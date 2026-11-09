from flask import Flask, jsonify, request, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
import re
import os
import secrets

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    if APP_ENV == "production":
        raise RuntimeError(
            "A variável SECRET_KEY é obrigatória quando APP_ENV=production."
        )
    SECRET_KEY = secrets.token_urlsafe(32)
    print(
        "AVISO: SECRET_KEY não definida. Uma chave temporária foi gerada "
        "para desenvolvimento; as sessões serão invalidadas ao reiniciar."
    )
elif APP_ENV == "production" and len(SECRET_KEY) < 32:
    raise RuntimeError(
        "Em produção, SECRET_KEY deve ter pelo menos 32 caracteres."
    )

DEBUG = (
    APP_ENV != "production"
    and os.getenv("FLASK_DEBUG", "false").strip().lower()
    in {"1", "true", "yes", "on"}
)

app.config.update(
    SECRET_KEY=SECRET_KEY,
    DEBUG=DEBUG,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=(APP_ENV == "production"),
)

MAX_ATTEMPTS = 3


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.get("/api/status")
def status():
    configured = "password_hash" in session
    blocked = session.get("blocked", False)
    authenticated = session.get("authenticated", False)
    return jsonify({
        "configured": configured,
        "blocked": blocked,
        "authenticated": authenticated,
        "attempts_left": session.get("attempts_left", MAX_ATTEMPTS)
    })


@app.post("/api/setup")
def setup():
    data = request.get_json(silent=True) or {}
    password = str(data.get("password", ""))

    if not re.fullmatch(r"[0-9]{4}", password):
        return jsonify({"message": "A senha deve conter exatamente 4 dígitos numéricos."}), 400

    session.clear()
    session["password_hash"] = generate_password_hash(password)
    session["attempts_left"] = MAX_ATTEMPTS
    session["blocked"] = False
    session["authenticated"] = False

    return jsonify({
        "message": "Senha cadastrada! Agora confirme sua senha para liberar o sistema.",
        "attempts_left": MAX_ATTEMPTS
    })


@app.post("/api/login")
def login():
    if "password_hash" not in session:
        return jsonify({"message": "Cadastre uma senha antes de tentar entrar."}), 400

    if session.get("blocked", False):
        return jsonify({"message": "Conta bloqueada após 3 tentativas incorretas.", "blocked": True}), 403

    if session.get("authenticated", False):
        return jsonify({"message": "O acesso já está liberado.", "authenticated": True})

    data = request.get_json(silent=True) or {}
    password = str(data.get("password", ""))

    if not re.fullmatch(r"[0-9]{4}", password):
        return jsonify({"message": "Digite uma senha com exatamente 4 dígitos."}), 400

    if check_password_hash(session["password_hash"], password):
        session["authenticated"] = True
        return jsonify({
            "message": "Acesso concedido! Sistema inicializando...",
            "authenticated": True
        })

    attempts_left = max(0, session.get("attempts_left", MAX_ATTEMPTS) - 1)
    session["attempts_left"] = attempts_left

    if attempts_left == 0:
        session["blocked"] = True
        return jsonify({
            "message": "Conta bloqueada após 3 tentativas incorretas.",
            "attempts_left": 0,
            "blocked": True
        }), 403

    return jsonify({
        "message": f"Acesso negado. Você ainda tem {attempts_left} tentativa(s).",
        "attempts_left": attempts_left,
        "blocked": False
    }), 401


@app.post("/api/reset")
def reset():
    session.clear()
    return jsonify({"message": "Sessão reiniciada. Cadastre uma nova senha."})


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=DEBUG,
    )
