from functools import wraps
from pathlib import Path
import os
import re
import secrets
import time

import click
from flask import Flask, g, jsonify, request, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index, func, select
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
PASSWORD_MIN_LENGTH = 10
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    __table_args__ = (
        db.CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
        db.CheckConstraint("is_active IN (0, 1)", name="ck_users_is_active"),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="user", server_default="'user'")
    is_active = db.Column(db.Boolean, nullable=False, default=True, server_default=db.text("true"))
    failed_attempts = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    locked_until = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.current_timestamp())


# A restrição por expressão também impede e-mails duplicados com diferenças de caixa
# em bancos que não possuem comparação case-insensitive por padrão.
Index("uq_users_email_lower", func.lower(User.email), unique=True)


def sqlite_uri(database_path):
    if str(database_path) == ":memory:":
        return "sqlite:///:memory:"
    return "sqlite:///" + Path(database_path).resolve().as_posix()


def normalize_database_url(database_url):
    if database_url.startswith("postgres://"):
        return "postgresql+psycopg://" + database_url[len("postgres://"):]
    if database_url.startswith("postgresql://"):
        return "postgresql+psycopg://" + database_url[len("postgresql://"):]
    return database_url


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

    database_path = os.getenv("AUTH_DATABASE") or str(ROOT / "instance" / "auth.db")
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        database_uri = normalize_database_url(database_url)
    else:
        if database_path != ":memory:":
            Path(database_path).resolve().parent.mkdir(parents=True, exist_ok=True)
        database_uri = sqlite_uri(database_path)

    app.config.update(
        SECRET_KEY=secret_key,
        DATABASE=database_path,
        SQLALCHEMY_DATABASE_URI=database_uri,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        APP_ENV=app_env,
        DEBUG=(
            app_env != "production"
            and os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
        ),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=(app_env == "production"),
        PERMANENT_SESSION_LIFETIME=1800,
        MAX_CONTENT_LENGTH=16 * 1024,
    )

    if test_config:
        app.config.update(test_config)
        # Mantém compatibilidade com testes e instalações que configuram o
        # caminho SQLite pela opção DATABASE usada na versão anterior.
        if "DATABASE" in test_config and "SQLALCHEMY_DATABASE_URI" not in test_config:
            test_database = app.config["DATABASE"]
            if test_database != ":memory:":
                Path(test_database).resolve().parent.mkdir(parents=True, exist_ok=True)
            app.config["SQLALCHEMY_DATABASE_URI"] = sqlite_uri(test_database)

    db.init_app(app)
    with app.app_context():
        db.create_all()

    def public_user(user):
        if user is None:
            return None
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }

    def current_user():
        user_id = session.get("user_id")
        if not user_id:
            return None
        user = db.session.get(User, user_id)
        if user is None or not user.is_active:
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
                if g.current_user.role != role:
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
                return jsonify({
                    "message": "Token CSRF ausente ou inválido. Atualize a página e tente novamente."
                }), 403
            return view(*args, **kwargs)
        return wrapped

    def valid_email(email):
        return bool(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email))

    def valid_password(password):
        return isinstance(password, str) and PASSWORD_MIN_LENGTH <= len(password) <= 128

    def serialize_admin_user(user):
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

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
        return jsonify({
            "authenticated": user is not None,
            "csrf_token": csrf_token,
            "user": public_user(user),
        })

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
            return jsonify({
                "message": f"A senha deve ter entre {PASSWORD_MIN_LENGTH} e 128 caracteres."
            }), 400

        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="user",
        )
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"message": "Já existe uma conta cadastrada com este e-mail."}), 409

        return jsonify({
            "message": "Cadastro concluído. Entre com seu e-mail e senha.",
            "user_id": user.id,
        }), 201

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

        user = db.session.scalar(select(User).where(func.lower(User.email) == email))
        if user is None:
            return jsonify({"message": "E-mail ou senha inválidos."}), 401

        now = int(time.time())
        if user.locked_until and user.locked_until > now:
            remaining = user.locked_until - now
            return jsonify({
                "message": "Acesso temporariamente bloqueado após várias tentativas. Tente novamente mais tarde.",
                "retry_after": remaining,
            }), 429

        attempts_before_login = user.failed_attempts
        if user.locked_until and user.locked_until <= now:
            attempts_before_login = 0
            user.failed_attempts = 0
            user.locked_until = None
            db.session.commit()

        if not user.is_active or not check_password_hash(user.password_hash, password):
            if user.is_active:
                failed = attempts_before_login + 1
                locked_until = now + LOCKOUT_SECONDS if failed >= MAX_LOGIN_ATTEMPTS else None
                user.failed_attempts = failed
                user.locked_until = locked_until
                db.session.commit()
                if locked_until:
                    return jsonify({
                        "message": "Acesso temporariamente bloqueado após várias tentativas. Tente novamente mais tarde."
                    }), 429
            return jsonify({"message": "E-mail ou senha inválidos."}), 401

        user.failed_attempts = 0
        user.locked_until = None
        db.session.commit()
        session.clear()
        session.permanent = True
        session["user_id"] = user.id
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({
            "message": "Login realizado com sucesso.",
            "csrf_token": session["csrf_token"],
            "user": public_user(user),
        })

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
        return jsonify({
            "message": "Você saiu da sua conta.",
            "csrf_token": session["csrf_token"],
        })

    @app.get("/api/admin/users")
    @require_role("admin")
    def admin_users():
        users = db.session.scalars(select(User).order_by(User.id)).all()
        return jsonify({"users": [serialize_admin_user(user) for user in users]})

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

        target = db.session.get(User, user_id)
        if target is None:
            return jsonify({"message": "Usuário não encontrado."}), 404
        if target.role == "admin" and new_role == "user" and target.is_active:
            active_admins = db.session.scalar(
                select(func.count(User.id)).where(
                    User.role == "admin",
                    User.is_active.is_(True),
                )
            ) or 0
            if active_admins <= 1:
                return jsonify({
                    "message": "Não é possível remover o último administrador ativo."
                }), 409

        target.role = new_role
        db.session.commit()
        return jsonify({"message": "Permissão do usuário atualizada."})

    @app.cli.command("create-admin")
    def create_admin():
        """Cria uma conta administrativa sem expor a senha na linha de comando."""
        name = click.prompt("Nome do administrador").strip()
        email = click.prompt("E-mail do administrador").strip().lower()
        password = click.prompt(
            "Senha (mínimo de 10 caracteres)",
            hide_input=True,
            confirmation_prompt=True,
        )
        if not 2 <= len(name) <= 80:
            raise click.ClickException("O nome deve ter entre 2 e 80 caracteres.")
        if not valid_email(email):
            raise click.ClickException("Informe um endereço de e-mail válido.")
        if not valid_password(password):
            raise click.ClickException(
                f"A senha deve ter entre {PASSWORD_MIN_LENGTH} e 128 caracteres."
            )

        db.session.add(User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="admin",
        ))
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
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
