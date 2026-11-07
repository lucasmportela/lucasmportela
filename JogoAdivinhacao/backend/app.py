from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parent.parent
FRONT = ROOT / "frontend"
app = Flask(__name__, static_folder=str(FRONT), static_url_path="")

# Estado do jogo em variáveis individuais, sem listas ou vetores.
rodada = tentativa = pontos_totais = numero_secreto = 0
jogo_iniciado = jogo_finalizado = False

def iniciar_rodada():
    global rodada, tentativa, numero_secreto
    rodada += 1
    tentativa = 0
    numero_secreto = random.randint(1, 50)

@app.get("/")
def index():
    return send_from_directory(FRONT, "index.html")

@app.post("/api/jogo/iniciar")
def iniciar_jogo():
    global rodada, tentativa, pontos_totais, numero_secreto, jogo_iniciado, jogo_finalizado
    rodada = tentativa = pontos_totais = numero_secreto = 0
    jogo_iniciado, jogo_finalizado = True, False
    iniciar_rodada()
    return jsonify(rodada=rodada, tentativa=tentativa, pontos_totais=pontos_totais,
                   tentativas_restantes=5, mensagem="Partida iniciada! Escolha um número de 1 a 50.")

@app.post("/api/jogo/palpite")
def palpite():
    global tentativa, pontos_totais, jogo_finalizado
    if not jogo_iniciado or jogo_finalizado:
        return jsonify(erro="Inicie uma nova partida antes de enviar palpites."), 400
    dados = request.get_json(silent=True) or {}
    try:
        numero = int(dados.get("palpite"))
    except (TypeError, ValueError):
        return jsonify(erro="Digite um número inteiro entre 1 e 50."), 400
    if not 1 <= numero <= 50:
        return jsonify(erro="O palpite deve estar entre 1 e 50."), 400

    tentativa += 1
    acertou = numero == numero_secreto
    pontos = 0
    if numero > numero_secreto:
        mensagem = "Seu palpite foi maior que o número secreto."
    elif numero < numero_secreto:
        mensagem = "Seu palpite foi menor que o número secreto."
    else:
        pontos = 125 - 25 * tentativa
        if tentativa == 5:
            pontos += 10
        pontos_totais += pontos
        mensagem = f"Acertou! Você ganhou {pontos} pontos nesta rodada."

    encerrada = acertou or tentativa == 5
    proxima = False
    classificacao = None
    if encerrada and not acertou:
        mensagem = f"Fim das tentativas! O número era {numero_secreto}. Você ganhou 0 pontos."
    if encerrada:
        if rodada == 3:
            jogo_finalizado = True
            if pontos_totais > 200:
                classificacao = "Excelente"
            elif pontos_totais >= 100:
                classificacao = "Bom"
            else:
                classificacao = "Tente Novamente"
            mensagem += f" Resultado final: {classificacao}!"
        else:
            iniciar_rodada()
            proxima = True

    return jsonify(
        rodada=rodada, tentativa=tentativa, pontos_totais=pontos_totais,
        tentativas_restantes=0 if encerrada else 5-tentativa,
        mensagem=mensagem, acertou=acertou, rodada_encerrada=encerrada,
        proxima_rodada=proxima, pontos_rodada=pontos,
        jogo_finalizado=jogo_finalizado, classificacao=classificacao
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)
