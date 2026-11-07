from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "chave-de-estudo-altere-em-producao")


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.post("/api/auditoria")
def auditar():
    dados = request.get_json(silent=True) or {}
    maquinas = dados.get("maquinas")
    teto = dados.get("teto")

    if not isinstance(maquinas, list) or len(maquinas) != 5:
        return jsonify({"message": "Informe exatamente 5 máquinas."}), 400

    try:
        teto = float(teto)
    except (TypeError, ValueError):
        return jsonify({"message": "Informe um teto operacional numérico válido."}), 400

    if teto <= 0:
        return jsonify({"message": "O teto operacional deve ser maior que zero."}), 400

    # Vetores paralelos: códigos e consumos, com cinco posições.
    num_ident = []
    consumo = []

    try:
        for i in range(5):
            codigo = int(maquinas[i].get("codigo"))
            kwh = float(maquinas[i].get("consumo"))
            if codigo < 0:
                return jsonify({"message": f"O código da máquina {i + 1} não pode ser negativo."}), 400
            if kwh <= 0:
                return jsonify({"message": f"O consumo da máquina {i + 1} deve ser maior que zero."}), 400
            num_ident.append(codigo)
            consumo.append(kwh)
    except (AttributeError, TypeError, ValueError):
        return jsonify({"message": "Verifique os códigos e consumos informados."}), 400

    ultrapassaram = []
    maior = 0.0
    maior_num_ident = 0
    soma = 0.0

    # Varredura sincronizada com índice explícito; sem max(), min() ou sum().
    for i in range(5):
        soma += consumo[i]

        if consumo[i] > teto:
            ultrapassaram.append({
                "codigo": num_ident[i],
                "consumo": round(consumo[i], 2)
            })

        if consumo[i] > maior:
            maior = consumo[i]
            maior_num_ident = num_ident[i]

    media = soma / 5
    return jsonify({
        "message": (
            "Operação Dentro dos Parâmetros de Eficiência"
            if len(ultrapassaram) == 0
            else "Auditoria concluída: existem máquinas acima do teto operacional."
        ),
        "dentro_dos_parametros": len(ultrapassaram) == 0,
        "ultrapassaram": ultrapassaram,
        "maior_consumo": {
            "codigo": maior_num_ident,
            "consumo": round(maior, 2)
        },
        "media": round(media, 2),
        "teto": round(teto, 2),
        "maquinas": [
            {"codigo": num_ident[i], "consumo": round(consumo[i], 2)}
            for i in range(5)
        ]
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
