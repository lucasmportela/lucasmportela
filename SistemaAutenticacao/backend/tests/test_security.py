import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app


class TestAuthenticationSecurity(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_secret_key_is_configured_and_not_the_old_default(self):
        self.assertTrue(app.config["SECRET_KEY"])
        self.assertNotEqual(
            app.config["SECRET_KEY"],
            "chave-temporaria-apenas-para-estudo",
        )
        self.assertGreaterEqual(len(app.config["SECRET_KEY"]), 32)

    def test_debug_is_disabled_by_default(self):
        self.assertFalse(app.debug)

    def test_session_cookie_has_safe_defaults(self):
        self.assertTrue(app.config["SESSION_COOKIE_HTTPONLY"])
        self.assertEqual(app.config["SESSION_COOKIE_SAMESITE"], "Lax")

    def test_setup_rejects_pin_with_invalid_length(self):
        response = self.client.post("/api/setup", json={"password": "123"})
        self.assertEqual(response.status_code, 400)

    def test_correct_pin_authenticates(self):
        setup = self.client.post("/api/setup", json={"password": "1234"})
        login = self.client.post("/api/login", json={"password": "1234"})

        self.assertEqual(setup.status_code, 200)
        self.assertEqual(login.status_code, 200)
        self.assertTrue(login.get_json()["authenticated"])

    def test_three_failed_attempts_block_the_session(self):
        self.client.post("/api/setup", json={"password": "1234"})

        first = self.client.post("/api/login", json={"password": "0000"})
        second = self.client.post("/api/login", json={"password": "1111"})
        third = self.client.post("/api/login", json={"password": "2222"})
        fourth = self.client.post("/api/login", json={"password": "1234"})

        self.assertEqual(first.status_code, 401)
        self.assertEqual(second.status_code, 401)
        self.assertEqual(third.status_code, 403)
        self.assertTrue(third.get_json()["blocked"])
        self.assertEqual(fourth.status_code, 403)


if __name__ == "__main__":
    unittest.main()
