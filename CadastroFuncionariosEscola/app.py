from pathlib import Path
import sqlite3

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "funcionarios.db"

app = Flask(__name__)


def conectar():
    """Abre uma conexão com o banco SQLite."""
    conexao = sqlite3.connect(DATABASE)
    conexao.row_factory = sqlite3.Row
    return conexao


def inicializar_banco():
    """Cria a tabela caso ela ainda não exista."""
    with conectar() as conexao:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS funcionarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                salario REAL NOT NULL CHECK (salario >= 0),
                cargo TEXT NOT NULL,
                disciplina TEXT NOT NULL DEFAULT ''
            )
        """)


def funcionario_para_dict(registro):
    funcionario = dict(registro)
    funcionario["leciona_matematica"] = (
        funcionario["cargo"].strip().lower() == "professor"
        and funcionario["disciplina"].strip().casefold() == "matemática"
    )
    funcionario["salario_acima_2000"] = funcionario["salario"] >= 2000
    return funcionario


@app.get("/")
def inicio():
    return render_template("index.html")


@app.get("/api/funcionarios")
def listar_funcionarios():
    with conectar() as conexao:
        registros = conexao.execute(
            "SELECT * FROM funcionarios ORDER BY id DESC"
        ).fetchall()

    return jsonify([funcionario_para_dict(item) for item in registros])


@app.post("/api/funcionarios")
def cadastrar_funcionario():
    dados = request.get_json(silent=True) or {}

    nome = str(dados.get("nome", "")).strip()
    cargo = str(dados.get("cargo", "")).strip()
    disciplina = str(dados.get("disciplina", "")).strip()
    salario_recebido = dados.get("salario")

    if not nome:
        return jsonify({"erro": "Informe o nome do funcionário."}), 400

    if not cargo:
        return jsonify({"erro": "Informe o cargo do funcionário."}), 400

    try:
        salario = float(salario_recebido)
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe um salário válido."}), 400

    if salario < 0:
        return jsonify({"erro": "O salário não pode ser negativo."}), 400

    if cargo.casefold() == "professor" and not disciplina:
        return jsonify({"erro": "Informe a disciplina do professor."}), 400

    if cargo.casefold() != "professor":
        disciplina = ""

    with conectar() as conexao:
        cursor = conexao.execute(
            """
            INSERT INTO funcionarios (nome, salario, cargo, disciplina)
            VALUES (?, ?, ?, ?)
            """,
            (nome, salario, cargo, disciplina),
        )
        novo_id = cursor.lastrowid
        registro = conexao.execute(
            "SELECT * FROM funcionarios WHERE id = ?", (novo_id,)
        ).fetchone()

    return jsonify(funcionario_para_dict(registro)), 201


@app.delete("/api/funcionarios/<int:funcionario_id>")
def excluir_funcionario(funcionario_id):
    with conectar() as conexao:
        cursor = conexao.execute(
            "DELETE FROM funcionarios WHERE id = ?", (funcionario_id,)
        )

    if cursor.rowcount == 0:
        return jsonify({"erro": "Funcionário não encontrado."}), 404

    return jsonify({"mensagem": "Funcionário excluído com sucesso."})


if __name__ == "__main__":
    inicializar_banco()
    app.run(debug=True)
