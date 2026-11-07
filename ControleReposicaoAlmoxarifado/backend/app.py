from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.post("/api/estoque/analisar")
def analisar_estoque():
    dados = request.get_json(silent=True) or {}
    produtos = dados.get("produtos")
    minimo = dados.get("estoque_minimo")

    if not isinstance(produtos, list) or len(produtos) != 6:
        return jsonify({"erro": "Informe exatamente 6 produtos."}), 400

    try:
        minimo = int(minimo)
    except (TypeError, ValueError):
        return jsonify({"erro": "O estoque mínimo deve ser um número inteiro."}), 400

    if minimo < 0:
        return jsonify({"erro": "O estoque mínimo não pode ser negativo."}), 400

    codigos = []
    saldos = []
    try:
        for i in range(6):
            codigo = int(produtos[i].get("codigo"))
            saldo = int(produtos[i].get("saldo"))
            if codigo < 0:
                return jsonify({"erro": f"O código do produto {i + 1} não pode ser negativo."}), 400
            if saldo < 0:
                return jsonify({"erro": f"O saldo do produto {i + 1} não pode ser negativo."}), 400
            codigos.append(codigo)
            saldos.append(saldo)
    except (AttributeError, TypeError, ValueError):
        return jsonify({"erro": "Confira os códigos e saldos: todos devem ser números inteiros."}), 400

    abaixo = []
    saldo_maior = saldos[0]
    codigo_maior = codigos[0]
    saldo_menor = saldos[0]
    codigo_menor = codigos[0]

    # Varredura sincronizada dos vetores paralelos com índice explícito.
    for i in range(6):
        if saldos[i] < minimo:
            abaixo.append({"codigo": codigos[i], "saldo": saldos[i]})
        if saldos[i] < saldo_menor:
            saldo_menor = saldos[i]
            codigo_menor = codigos[i]
        if saldos[i] > saldo_maior:
            saldo_maior = saldos[i]
            codigo_maior = codigos[i]

    normal = len(abaixo) == 0
    return jsonify({
        "normal": normal,
        "mensagem": (
            "Estoque Operando em Parâmetros Normais"
            if normal else "Atenção: existem produtos abaixo do estoque mínimo de segurança."
        ),
        "estoque_minimo": minimo,
        "abaixo_minimo": abaixo,
        "menor": {"codigo": codigo_menor, "saldo": saldo_menor},
        "maior": {"codigo": codigo_maior, "saldo": saldo_maior},
        "produtos": [
            {"codigo": codigos[i], "saldo": saldos[i]}
            for i in range(6)
        ]
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
