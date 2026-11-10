import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import User, create_app, db
from werkzeug.security import generate_password_hash


class TestUserAuthenticationAndAuthorization(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database = str(Path(self.temp_dir.name) / "test-auth.db")
        self.app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key-that-is-long-enough-123456",
            "DATABASE": self.database,
            "SESSION_COOKIE_SECURE": False,
        })
        self.client = self.app.test_client()
        self.csrf = self.client.get("/api/status").get_json()["csrf_token"]

        with self.app.app_context():
            db.session.add(User(
                name="Admin",
                email="admin@example.com",
                password_hash=generate_password_hash("AdminPassword123"),
                role="admin",
            ))
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
        self.temp_dir.cleanup()

    def post(self, path, body=None):
        return self.client.post(
            path,
            json=body or {},
            headers={"X-CSRF-Token": self.csrf},
        )

    def login(self, email="admin@example.com", password="AdminPassword123"):
        response = self.post("/api/login", {"email": email, "password": password})
        if response.status_code == 200:
            self.csrf = response.get_json()["csrf_token"]
        return response

    def register(self, name="Pessoa Usuária", email="user@example.com", password="UserPassword123"):
        return self.post("/api/register", {"name": name, "email": email, "password": password})

    def test_status_starts_unauthenticated_and_issues_csrf_token(self):
        response = self.client.get("/api/status")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()["authenticated"])
        self.assertTrue(response.get_json()["csrf_token"])

    def test_registration_creates_regular_user_with_hashed_password(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        with self.app.app_context():
            user = db.session.query(User).filter_by(email="user@example.com").one()
            self.assertEqual(user.role, "user")
            self.assertNotEqual(user.password_hash, "UserPassword123")
            self.assertTrue(
                user.password_hash.startswith("scrypt:")
                or user.password_hash.startswith("pbkdf2:")
            )

    def test_registration_rejects_short_password_and_invalid_email(self):
        short = self.register(password="123456")
        invalid = self.register(email="email-invalido")
        self.assertEqual(short.status_code, 400)
        self.assertEqual(invalid.status_code, 400)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        self.register()
        duplicate = self.register(email="USER@example.com")
        self.assertEqual(duplicate.status_code, 409)

    def test_registration_persists_user_between_app_instances(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)

        second_app = create_app({
            "TESTING": True,
            "SECRET_KEY": "another-test-secret-key-that-is-long-enough",
            "DATABASE": self.database,
            "SESSION_COOKIE_SECURE": False,
        })
        with second_app.app_context():
            persisted = db.session.query(User).filter_by(email="user@example.com").one()
            self.assertEqual(persisted.name, "Pessoa Usuária")
            self.assertEqual(persisted.role, "user")

    def test_state_changing_request_requires_csrf_token(self):
        response = self.client.post("/api/register", json={
            "name": "Outra Pessoa",
            "email": "other@example.com",
            "password": "AnotherPassword123",
        })
        self.assertEqual(response.status_code, 403)

    def test_login_returns_user_and_authenticated_session(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["role"], "admin")
        me = self.client.get("/api/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["user"]["email"], "admin@example.com")

    def test_invalid_login_does_not_authenticate(self):
        response = self.login(password="wrong-password")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    def test_five_failed_logins_temporarily_lock_account(self):
        for _ in range(4):
            response = self.login(password="incorrect-password")
            self.assertEqual(response.status_code, 401)
        fifth = self.login(password="incorrect-password")
        self.assertEqual(fifth.status_code, 429)
        sixth = self.login()
        self.assertEqual(sixth.status_code, 429)

    def test_regular_user_cannot_access_admin_endpoint(self):
        self.register()
        response = self.login("user@example.com", "UserPassword123")
        self.assertEqual(response.status_code, 200)
        denied = self.client.get("/api/admin/users")
        self.assertEqual(denied.status_code, 403)

    def test_anonymous_user_cannot_access_protected_endpoint(self):
        self.assertEqual(self.client.get("/api/admin/users").status_code, 401)
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    def test_admin_can_list_users_and_change_role(self):
        self.register()
        self.login()
        users = self.client.get("/api/admin/users")
        self.assertEqual(users.status_code, 200)
        target = next(
            user for user in users.get_json()["users"]
            if user["email"] == "user@example.com"
        )
        changed = self.client.patch(
            f"/api/admin/users/{target['id']}/role",
            json={"role": "admin"},
            headers={"X-CSRF-Token": self.csrf},
        )
        self.assertEqual(changed.status_code, 200)
        users_after = self.client.get("/api/admin/users").get_json()["users"]
        updated = next(user for user in users_after if user["id"] == target["id"])
        self.assertEqual(updated["role"], "admin")

    def test_admin_cannot_demote_the_last_active_admin(self):
        self.login()
        users = self.client.get("/api/admin/users").get_json()["users"]
        admin_id = users[0]["id"]
        response = self.client.patch(
            f"/api/admin/users/{admin_id}/role",
            json={"role": "user"},
            headers={"X-CSRF-Token": self.csrf},
        )
        self.assertEqual(response.status_code, 409)

    def test_admin_role_update_rejects_invalid_role_and_unknown_user(self):
        self.login()
        invalid = self.client.patch(
            "/api/admin/users/1/role",
            json={"role": "superuser"},
            headers={"X-CSRF-Token": self.csrf},
        )
        missing = self.client.patch(
            "/api/admin/users/9999/role",
            json={"role": "admin"},
            headers={"X-CSRF-Token": self.csrf},
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(missing.status_code, 404)

    def test_logout_clears_authenticated_session(self):
        self.login()
        response = self.post("/api/logout")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    def test_inactive_user_cannot_reuse_existing_session(self):
        self.login()
        with self.app.app_context():
            user = db.session.query(User).filter_by(email="admin@example.com").one()
            user.is_active = False
            db.session.commit()
        response = self.client.get("/api/me")
        self.assertEqual(response.status_code, 401)

    def test_security_headers_are_set(self):
        response = self.client.get("/api/status")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertEqual(response.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()
