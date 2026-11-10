from functools import wraps
from pathlib import Path
import os
import re
import secrets
import sqlite3
import time

import click
from flask import Flask, g, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
PASSWORD_MIN_LENGTH = 10
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""


def create_app(test_config=None):
    app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    secret_key = os.getenv("SECRET_KEY")

    if not secret_key:
        if app_env == "production":
            raise RuntimeError("A variável SECRET_KEY é obrigatória em produção.")
        secret_key = secrets.token_urlsafe(48)
        app.logger.warning(
            "SECRET_KEY temporária gerada para desenvolvimento; sessões serão invalidadas ao reiniciar."
        )
    elif app_env == "production" and len(secret_key) < 32:
        raise RuntimeError("Em produção, SECRET_KEY deve ter pelo menos 32 caracteres.")

    database = os.getenv("AUTH_DATABASE") or str(ROOT / "instance" / "auth.db")
    app.config.update(
        SECRET_KEY=secret_key,
        DATABASE=database,
        APP_ENV=app_env,
        DEBUG=(app_env != "production" and os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes", "on"}),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=(app_env == "production"),
        PERMANENT_SESSION_LIFETIME=1800,
        MAX_CONTENT_LENGTH=16 * 1024,
    )
    if test_config:
        app.config.update(test_config)

    database_path = Path(app.config["DATABASE"])
    if str(database_path) != ":memory:":
        database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(app.config["DATABASE"]) as connection:
        connection.executescript(SCHEMA)

    def get_db():
        if "db" not in g:
            g.db = sqlite3.connect(app.config["DATABASE"], timeout=10)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA foreign_keys = ON")
        return g.db

    @app.teardown_appcontext
    def close_db(_error=None):
        connection = g.pop("db", None)
        if connection is not None:
            connection.close()

    def public_user(user):
        if user is None:
            return None
        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        }

    def current_user():
        user_id = session.get("user_id")
        if not user_id:
            return None
        user = get_db().execute(
            "SELECT id, name, email, role, is_active FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if user is None or not user["is_active"]:
            session.clear()
            return None
        return user

    def require_auth(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            user = current_user()
            if user is None:
                return jsonify({"message": "Faça login para acessar este recurso."}), 401
            g.current_user = user
            return view(*args, **kwargs)
        return wrapped

    def require_role(role):
        def decorator(view):
            @wraps(view)
            @require_auth
            def wrapped(*args, **kwargs):
                if g.current_user["role"] != role:
                    return jsonify({"message": "Você não tem permissão para acessar este recurso."}), 403
                return view(*args, **kwargs)
            return wrapped
        return decorator

    def csrf_required(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            expected = session.get("csrf_token", "")
            supplied = request.headers.get("X-CSRF-Token", "")
            if not expected or not supplied or not secrets.compare_digest(expected, supplied):
                return jsonify({"message": "Token CSRF ausente ou inválido. Atualize a página e tente novamente."}), 403
            return view(*args, **kwargs)
        return wrapped

    def valid_email(email):
        return bool(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email))

    def valid_password(password):
        return isinstance(password, str) and PASSWORD_MIN_LENGTH <= len(password) <= 128

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND, "index.html")

    @app.get("/api/status")
    def status():
        user = current_user()
        csrf_token = session.get("csrf_token")
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)
            session["csrf_token"] = csrf_token
        return jsonify({"authenticated": user is not None, "csrf_token": csrf_token, "user": public_user(user)})

    @app.post("/api/register")
    @csrf_required
    def register():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            data = {}
        name_value = data.get("name", "")
        email_value = data.get("email", "")
        name = name_value.strip() if isinstance(name_value, str) else ""
        email = email_value.strip().lower() if isinstance(email_value, str) else ""
        password = data.get("password", "")

        if not 2 <= len(name) <= 80:
            return jsonify({"message": "Informe um nome entre 2 e 80 caracteres."}), 400
        if not valid_email(email) or len(email) > 254:
            return jsonify({"message": "Informe um endereço de e-mail válido."}), 400
        if not valid_password(password):
            return jsonify({"message": f"A senha deve ter entre {PASSWORD_MIN_LENGTH} e 128 caracteres."}), 400

        try:
            cursor = get_db().execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
                (name, email, generate_password_hash(password)),
            )
            get_db().commit()
        except sqlite3.IntegrityError:
            get_db().rollback()
            return jsonify({"message": "Já existe uma conta cadastrada com este e-mail."}), 409

        return jsonify({"message": "Cadastro concluído. Entre com seu e-mail e senha.", "user_id": cursor.lastrowid}), 201

    @app.post("/api/login")
    @csrf_required
    def login():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            data = {}
        email_value = data.get("email", "")
        email = email_value.strip().lower() if isinstance(email_value, str) else ""
        password = data.get("password", "")
        if not email or not isinstance(password, str) or not password:
            return jsonify({"message": "Informe e-mail e senha."}), 400

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email,)).fetchone()
        if user is None:
            return jsonify({"message": "E-mail ou senha inválidos."}), 401

        now = int(time.time())
        if user["locked_until"] and user["locked_until"] > now:
            remaining = user["locked_until"] - now
            return jsonify({"message": "Acesso temporariamente bloqueado após várias tentativas. Tente novamente mais tarde.", "retry_after": remaining}), 429
        attempts_before_login = user["failed_attempts"]
        if user["locked_until"] and user["locked_until"] <= now:
            attempts_before_login = 0
            db.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user["id"],))
            db.commit()

        if not user["is_active"] or not check_password_hash(user["password_hash"], password):
            if user["is_active"]:
                failed = attempts_before_login + 1
                locked_until = now + LOCKOUT_SECONDS if failed >= MAX_LOGIN_ATTEMPTS else None
                db.execute(
                    "UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?",
                    (failed, locked_until, user["id"]),
                )
                db.commit()
                if locked_until:
                    return jsonify({"message": "Acesso temporariamente bloqueado após várias tentativas. Tente novamente mais tarde."}), 429
            return jsonify({"message": "E-mail ou senha inválidos."}), 401

        db.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user["id"],))
        db.commit()
        session.clear()
        session.permanent = True
        session["user_id"] = user["id"]
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({"message": "Login realizado com sucesso.", "csrf_token": session["csrf_token"], "user": public_user(user)})

    @app.get("/api/me")
    @require_auth
    def me():
        return jsonify({"user": public_user(g.current_user)})

    @app.post("/api/logout")
    @csrf_required
    @require_auth
    def logout():
        session.clear()
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({"message": "Você saiu da sua conta.", "csrf_token": session["csrf_token"]})

    @app.get("/api/admin/users")
    @require_role("admin")
    def admin_users():
        users = get_db().execute(
            "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id"
        ).fetchall()
        return jsonify({"users": [dict(user) for user in users]})

    @app.patch("/api/admin/users/<int:user_id>/role")
    @csrf_required
    @require_role("admin")
    def update_user_role(user_id):
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            data = {}
        new_role = data.get("role")
        if not isinstance(new_role, str) or new_role not in {"user", "admin"}:
            return jsonify({"message": "Perfil inválido. Use 'user' ou 'admin'."}), 400

        db = get_db()
        target = db.execute("SELECT id, role, is_active FROM users WHERE id = ?", (user_id,)).fetchone()
        if target is None:
            return jsonify({"message": "Usuário não encontrado."}), 404
        if target["role"] == "admin" and new_role == "user" and target["is_active"]:
            active_admins = db.execute(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1"
            ).fetchone()["total"]
            if active_admins <= 1:
                return jsonify({"message": "Não é possível remover o último administrador ativo."}), 409

        db.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        db.commit()
        return jsonify({"message": "Permissão do usuário atualizada."})

    @app.cli.command("create-admin")
    def create_admin():
        """Cria uma conta administrativa sem expor a senha na linha de comando."""
        name = click.prompt("Nome do administrador").strip()
        email = click.prompt("E-mail do administrador").strip().lower()
        password = click.prompt("Senha (mínimo de 10 caracteres)", hide_input=True, confirmation_prompt=True)
        if not 2 <= len(name) <= 80:
            raise click.ClickException("O nome deve ter entre 2 e 80 caracteres.")
        if not valid_email(email):
            raise click.ClickException("Informe um endereço de e-mail válido.")
        if not valid_password(password):
            raise click.ClickException(f"A senha deve ter entre {PASSWORD_MIN_LENGTH} e 128 caracteres.")
        try:
            get_db().execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
                (name, email, generate_password_hash(password)),
            )
            get_db().commit()
        except sqlite3.IntegrityError:
            raise click.ClickException("Já existe uma conta cadastrada com este e-mail.")
        click.echo("Administrador criado com sucesso.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=app.config["DEBUG"],
    )
