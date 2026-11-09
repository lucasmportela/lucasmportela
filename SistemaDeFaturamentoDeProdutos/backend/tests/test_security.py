import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app


class TestBillingSecurityConfiguration(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_debug_is_disabled_by_default(self):
        self.assertFalse(app.debug)

    def test_local_frontend_origin_is_allowed(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:3000",
        )

    def test_unlisted_origin_does_not_receive_cors_permission(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "https://untrusted.example"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(
            response.headers.get("Access-Control-Allow-Origin")
        )


if __name__ == "__main__":
    unittest.main()
