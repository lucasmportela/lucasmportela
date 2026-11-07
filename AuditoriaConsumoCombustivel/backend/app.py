from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.post("/api/auditoria/processar")
def processar_veiculo():
    dados = request.get_json(silent=True) or {}

    try:
        km = float(dados.get("km"))
        litros = float(dados.get("litros"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe quilometragem e litros usando valores numéricos."}), 400

    if km <= 0:
        return jsonify({"erro": "A quilometragem deve ser maior que zero para auditar um veículo."}), 400
    if litros <= 0:
        return jsonify({"erro": "A quantidade de combustível deve ser maior que zero."}), 400

    consumo = km / litros
    if consumo >= 12:
        classificacao = "Econômico"
        nivel = "economico"
    elif consumo >= 9:
        classificacao = "Padrão"
        nivel = "padrao"
    else:
        classificacao = "Alto Consumo"
        nivel = "alto"

    return jsonify({
        "km": km,
        "litros": litros,
        "consumo": consumo,
        "classificacao": classificacao,
        "nivel": nivel
    })


@app.post("/api/auditoria/resumo")
def resumo_turno():
    dados = request.get_json(silent=True) or {}
    try:
        quantidade = int(dados.get("quantidade"))
        km_total = float(dados.get("km_total"))
        soma_consumos = float(dados.get("soma_consumos"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Dados do resumo inválidos."}), 400

    if quantidade < 0 or km_total < 0 or soma_consumos < 0:
        return jsonify({"erro": "Os acumuladores não podem ser negativos."}), 400

    media = soma_consumos / quantidade if quantidade > 0 else 0
    return jsonify({
        "quantidade_veiculos": quantidade,
        "km_total": km_total,
        "media_geral": media
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
