import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from produto import Produto
from repositorio import RepositorioProdutos

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
DEBUG = (
    APP_ENV != "production"
    and os.getenv("FLASK_DEBUG", "false").strip().lower()
    in {"1", "true", "yes", "on"}
)
app.config["DEBUG"] = DEBUG

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

repo = RepositorioProdutos()


def resposta_produto(item):
    return {
        **item,
        "valor_total_estoque": round(item["preco"] * item["quantidade"], 2)
    }


def erro(mensagem, status=400):
    return jsonify({"erro": mensagem}), status


@app.get("/api/health")
def health():
    return jsonify({"status": "online", "mensagem": "API funcionando!"})


@app.get("/api/produtos")
def listar():
    produtos = [resposta_produto(p) for p in repo.listar()]
    return jsonify({
        "produtos": produtos,
        "valor_total_estoque": round(sum(p["valor_total_estoque"] for p in produtos), 2)
    })


@app.post("/api/produtos")
def criar():
    dados = request.get_json(silent=True) or {}
    nome = str(dados.get("nome", "")).strip()
    if not nome:
        return erro("O nome do produto é obrigatório.")
    try:
        produto = Produto(nome, dados.get("preco"), dados.get("quantidade", 0))
    except (TypeError, ValueError):
        return erro("Preço deve ser maior que zero e quantidade deve ser inteira e não negativa.")
    item = repo.criar(produto.nome, produto.preco, produto.quantidade)
    return jsonify(resposta_produto(item)), 201


def alterar_estoque(produto_id, acao):
    dados = request.get_json(silent=True) or {}
    item = repo.buscar(produto_id)
    if item is None:
        return erro("Produto não encontrado.", 404)
    try:
        qtd = dados.get("quantidade")
        produto = Produto(item["nome"], item["preco"], item["quantidade"])
    except (TypeError, ValueError):
        return erro("Cadastro do produto inválido.")
    sucesso = produto.adicionar_estoque(qtd) if acao == "adicionar" else produto.remover_estoque(qtd)
    if not sucesso:
        mensagem = "Quantidade deve ser um inteiro maior que zero."
        if acao == "remover" and isinstance(qtd, int) and qtd > item["quantidade"]:
            mensagem = "Estoque insuficiente para realizar a remoção."
            return erro(mensagem, 409)
        return erro(mensagem)
    atualizado = repo.atualizar(produto_id, quantidade=produto.quantidade)
    return jsonify(resposta_produto(atualizado))


@app.post("/api/produtos/<int:produto_id>/estoque/adicionar")
def adicionar(produto_id):
    return alterar_estoque(produto_id, "adicionar")


@app.post("/api/produtos/<int:produto_id>/estoque/remover")
def remover(produto_id):
    return alterar_estoque(produto_id, "remover")


@app.put("/api/produtos/<int:produto_id>")
def atualizar(produto_id):
    item = repo.buscar(produto_id)
    if item is None:
        return erro("Produto não encontrado.", 404)
    dados = request.get_json(silent=True) or {}
    nome = str(dados.get("nome", item["nome"])).strip()
    if not nome:
        return erro("O nome do produto é obrigatório.")
    try:
        produto = Produto(nome, dados.get("preco", item["preco"]), dados.get("quantidade", item["quantidade"]))
    except (TypeError, ValueError):
        return erro("Preço deve ser maior que zero e quantidade deve ser inteira e não negativa.")
    salvo = repo.atualizar(produto_id, nome=produto.nome, preco=produto.preco, quantidade=produto.quantidade)
    return jsonify(resposta_produto(salvo))


@app.delete("/api/produtos/<int:produto_id>")
def excluir(produto_id):
    if not repo.excluir(produto_id):
        return erro("Produto não encontrado.", 404)
    return jsonify({"mensagem": "Produto excluído com sucesso."})


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=DEBUG,
    )
