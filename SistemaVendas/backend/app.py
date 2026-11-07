from flask import Flask, jsonify, request, session, send_from_directory
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "chave-temporaria-apenas-para-estudo")


def estado():
    """Obtém ou inicializa os dados da venda na sessão atual."""
    if "carrinho" not in session:
        session["carrinho"] = []
        session["faturamento_total"] = 0.0
        session["venda_fechada"] = False
        session["resumo_venda"] = None
    return session


def calcular_desconto(total):
    if total > 200:
        return total * 0.10
    if total > 100:
        return total * 0.05
    return 0.0


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.get("/api/status")
def status():
    dados = estado()
    subtotal = sum(item["valor"] for item in dados["carrinho"])
    desconto = calcular_desconto(subtotal) if dados["venda_fechada"] else 0.0
    total = subtotal - desconto if dados["venda_fechada"] else subtotal
    return jsonify({
        "itens": dados["carrinho"],
        "subtotal": round(subtotal, 2),
        "desconto": round(desconto, 2),
        "total": round(total, 2),
        "faturamento_total": round(dados["faturamento_total"], 2),
        "venda_fechada": dados["venda_fechada"],
        "resumo_venda": dados["resumo_venda"]
    })


@app.post("/api/produtos")
def adicionar_produto():
    dados = estado()
    if dados["venda_fechada"]:
        return jsonify({"message": "Esta venda já foi fechada. Finalize ou inicie outra venda."}), 409

    payload = request.get_json(silent=True) or {}
    try:
        valor = float(payload.get("valor"))
    except (TypeError, ValueError):
        return jsonify({"message": "Informe um valor numérico válido."}), 400

    if valor < 0:
        return jsonify({"message": "Digite um valor válido. O preço não pode ser negativo."}), 400
    if valor == 0:
        return jsonify({"message": "O valor do produto deve ser maior que zero."}), 400

    itens = list(dados["carrinho"])
    itens.append({"numero": len(itens) + 1, "valor": round(valor, 2)})
    dados["carrinho"] = itens
    session.modified = True

    subtotal = sum(item["valor"] for item in itens)
    return jsonify({
        "message": "Produto adicionado à venda.",
        "itens": itens,
        "subtotal": round(subtotal, 2)
    })


@app.post("/api/fechar-venda")
def fechar_venda():
    dados = estado()
    if dados["venda_fechada"]:
        return jsonify({"message": "A venda já está fechada."}), 409
    if not dados["carrinho"]:
        return jsonify({"message": "Adicione pelo menos um produto antes de fechar a venda."}), 400

    payload = request.get_json(silent=True) or {}
    try:
        parcelas = int(payload.get("parcelas"))
    except (TypeError, ValueError):
        return jsonify({"message": "Informe uma quantidade de parcelas válida."}), 400

    if parcelas < 1 or parcelas > 6:
        return jsonify({"message": "A quantidade de parcelas deve estar entre 1 e 6."}), 400

    subtotal = sum(item["valor"] for item in dados["carrinho"])
    desconto = calcular_desconto(subtotal)
    total = round(subtotal - desconto, 2)
    valor_parcela = round(total / parcelas, 2)

    dados["venda_fechada"] = True
    dados["resumo_venda"] = {
        "subtotal": round(subtotal, 2),
        "desconto": round(desconto, 2),
        "percentual_desconto": 10 if subtotal > 200 else (5 if subtotal > 100 else 0),
        "total": total,
        "parcelas": parcelas,
        "valor_parcela": valor_parcela
    }
    session.modified = True
    return jsonify({
        "message": "Venda fechada. Confira o resumo e finalize para registrar o faturamento.",
        "resumo": dados["resumo_venda"]
    })


@app.post("/api/finalizar-venda")
def finalizar_venda():
    dados = estado()
    if not dados["venda_fechada"] or not dados["resumo_venda"]:
        return jsonify({"message": "Feche a venda antes de finalizá-la."}), 400

    resumo = dict(dados["resumo_venda"])
    dados["faturamento_total"] = round(dados["faturamento_total"] + resumo["total"], 2)
    dados["ultima_venda"] = resumo
    dados["carrinho"] = []
    dados["venda_fechada"] = False
    dados["resumo_venda"] = None
    session.modified = True

    return jsonify({
        "message": "Venda finalizada e faturamento atualizado!",
        "faturamento_total": dados["faturamento_total"],
        "ultima_venda": resumo
    })


@app.post("/api/nova-venda")
def nova_venda():
    dados = estado()
    if dados["carrinho"] or dados["venda_fechada"]:
        return jsonify({"message": "Finalize ou cancele a venda atual antes de iniciar outra."}), 409
    return jsonify({"message": "Pronto para registrar uma nova venda."})


@app.post("/api/cancelar-venda")
def cancelar_venda():
    dados = estado()
    dados["carrinho"] = []
    dados["venda_fechada"] = False
    dados["resumo_venda"] = None
    session.modified = True
    return jsonify({"message": "Venda atual cancelada. O faturamento acumulado foi preservado."})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
