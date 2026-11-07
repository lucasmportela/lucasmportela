from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pathlib import Path
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

class Bateria:
    def __init__(self, identificacao, capacidade_maxima, carga_atual=0):
        if not identificacao or not identificacao.strip():
            raise ValueError("A identificação é obrigatória.")
        if capacidade_maxima <= 0:
            raise ValueError("A capacidade máxima deve ser maior que zero.")
        self.id = str(uuid4())
        self.identificacao = identificacao.strip()
        self._capacidade_maxima = float(capacidade_maxima)
        self.carga_atual = float(carga_atual)

    @property
    def capacidade_maxima(self):
        return self._capacidade_maxima

    @property
    def carga_atual(self):
        return self._carga_atual

    @carga_atual.setter
    def carga_atual(self, valor):
        if not 0 <= valor <= self.capacidade_maxima:
            raise ValueError("A carga não pode ser negativa ou ultrapassar a capacidade máxima.")
        self._carga_atual = float(valor)

    @property
    def porcentagem_carga(self):
        return self.carga_atual / self.capacidade_maxima * 100

    @property
    def alerta_bateria_fraca(self):
        return self.porcentagem_carga < 20

    def carregar(self, mah):
        if mah <= 0 or self.carga_atual + mah > self.capacidade_maxima:
            return False
        self.carga_atual += mah
        return True

    def descarregar(self, mah):
        if mah <= 0 or mah > self.carga_atual:
            return False
        self.carga_atual -= mah
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "identificacao": self.identificacao,
            "capacidade_maxima": self.capacidade_maxima,
            "carga_atual": self.carga_atual,
            "porcentagem_carga": round(self.porcentagem_carga, 2),
            "alerta_bateria_fraca": self.alerta_bateria_fraca
        }

baterias = {}

@app.get("/api/baterias")
def listar_baterias():
    return jsonify([b.to_dict() for b in baterias.values()])

@app.post("/api/baterias")
def criar_bateria():
    dados = request.get_json(silent=True) or {}
    try:
        bateria = Bateria(
            str(dados.get("identificacao", "")),
            float(dados.get("capacidade_maxima", 0)),
            float(dados.get("carga_atual", 0))
        )
        baterias[bateria.id] = bateria
        return jsonify(bateria.to_dict()), 201
    except (TypeError, ValueError) as erro:
        return jsonify({"erro": str(erro)}), 400

@app.post("/api/baterias/<bateria_id>/<operacao>")
def operar_bateria(bateria_id, operacao):
    bateria = baterias.get(bateria_id)
    if bateria is None:
        return jsonify({"erro": "Bateria não encontrada."}), 404

    dados = request.get_json(silent=True) or {}
    try:
        quantidade = float(dados.get("mah", 0))
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe uma quantidade numérica válida."}), 400

    if operacao == "carregar":
        sucesso = bateria.carregar(quantidade)
        mensagem = "Bateria carregada com sucesso." if sucesso else "Operação rejeitada: confira a quantidade e a capacidade disponível."
    elif operacao == "descarregar":
        sucesso = bateria.descarregar(quantidade)
        mensagem = "Bateria descarregada com sucesso." if sucesso else "Operação rejeitada: confira a quantidade e a carga disponível."
    else:
        return jsonify({"erro": "Operação inválida."}), 404

    return jsonify({"sucesso": sucesso, "mensagem": mensagem, "bateria": bateria.to_dict()}), 200 if sucesso else 400

@app.delete("/api/baterias/<bateria_id>")
def excluir_bateria(bateria_id):
    if bateria_id not in baterias:
        return jsonify({"erro": "Bateria não encontrada."}), 404
    del baterias[bateria_id]
    return jsonify({"mensagem": "Bateria removida com sucesso."})

@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
