"""End-to-end security and data smoke tests against a disposable local server."""

import http.cookiejar
import json
import os
import shutil
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from starlette.requests import Request


ROOT = Path(__file__).resolve().parents[1]


class SiteFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_data_dir = ROOT / "data" / ("test-" + uuid.uuid4().hex)
        cls.test_data_dir.mkdir(parents=True)
        os.environ["LUME_DATA_DIR"] = str(cls.test_data_dir)
        os.environ["LUME_DEV_HTTP"] = "1"
        sys.path.insert(0, str(ROOT))
        import server

        cls.server_module = server
        cls.email = "teste@example.com"
        cls.password = "senha-08"
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        env = {**os.environ, "PORT": str(port), "HOST": "127.0.0.1"}
        cls.process = subprocess.Popen(
            [sys.executable, "server.py"], cwd=ROOT, env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        for _ in range(100):
            try:
                urllib.request.urlopen(cls.base + "/healthz", timeout=1).close()
                break
            except (OSError, urllib.error.URLError):
                if cls.process.poll() is not None:
                    raise RuntimeError("Test server terminated before becoming ready")
                time.sleep(0.1)
        else:
            raise RuntimeError("Test server did not become ready")
        cls.cookies = http.cookiejar.CookieJar()
        cls.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cls.cookies))

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        try:
            cls.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.process.kill()
            cls.process.wait(timeout=5)
        if cls.test_data_dir.resolve().is_relative_to((ROOT / "data").resolve()):
            shutil.rmtree(cls.test_data_dir)

    def request(self, path, method="GET", data=None, csrf=None, origin=None, bearer=None):
        headers = {}
        if data is not None:
            data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if csrf:
            headers["X-CSRF-Token"] = csrf
        if origin:
            headers["Origin"] = origin
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
        request = urllib.request.Request(self.base + path, data=data, headers=headers, method=method)
        try:
            response = self.opener.open(request, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read()
        content_type = response.headers.get("Content-Type", "")
        parsed = json.loads(body) if "application/json" in content_type else body.decode("utf-8", "replace")
        return response.status, parsed, response.geturl()

    def test_vsl_identity_and_deduplicated_events(self):
        self.assertEqual(self.request('/api/vsl/session')[0], 401)
        token = uuid.uuid4().hex + uuid.uuid4().hex
        payload = {'id': 'lead_' + uuid.uuid4().hex, 'instagram': '@fluxo.teste', 'flow_token': token}
        status, lead, _ = self.request('/api/leads', 'POST', payload)
        self.assertEqual(status, 201)
        self.assertEqual(lead['flow_token'], token)
        self.assertEqual(self.request('/api/leads', 'POST', payload)[1]['flow_token'], token)
        forged = {**payload, 'flow_token': uuid.uuid4().hex + uuid.uuid4().hex}
        self.assertIsNone(self.request('/api/leads', 'POST', forged)[1]['flow_token'])
        status, session, _ = self.request('/api/vsl/session', bearer=token)
        self.assertEqual((status, session['instagram']), (200, '@fluxo.teste'))
        page = self.request('/vsl/')[1]
        self.assertIn('Seu perfil foi', page)
        self.assertNotIn('id="quiz-modal"', page)
        self.assertNotIn('id="faq"', page)
        for _ in range(2):
            self.assertEqual(self.request('/api/vsl/events', 'POST', {'event': 'vsl_80'}, bearer=token)[0], 200)
        with self.server_module.database() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM creator_events WHERE creator_id=? AND event=?', (lead['id'], 'vsl_80')).fetchone()[0], 1)

    def test_y_acquisition_events_are_distinct_and_session_deduplicated(self):
        if self.request('/api/setup/status')[1]['available']:
            self.request('/api/setup/start', 'POST', {'display_name': 'Teste', 'email': self.email, 'password': self.password})
        self.request('/api/auth/login', 'POST', {'email': self.email, 'password': self.password})
        session_id = uuid.uuid4().hex
        names = ('page_view', 'hero_cta_view', 'hero_cta_clicked', 'click_quiz',
                 'quiz_visible', 'quiz_started', 'quiz_question_1_answered', 'quiz_completed')
        events = {'events': [{'id': uuid.uuid4().hex, 'session_id': session_id, 'event': name} for name in names]}
        before = self.request('/api/admin/analytics?period=all')[1]['counts']
        self.assertEqual(self.request('/api/events', 'POST', events)[0], 200)
        refresh = {'events': [{'id': uuid.uuid4().hex, 'session_id': session_id, 'event': 'page_view'}]}
        self.assertEqual(self.request('/api/events', 'POST', refresh)[0], 200)
        after = self.request('/api/admin/analytics?period=all')[1]['counts']
        for name in names:
            self.assertEqual(after[name], before.get(name, 0) + 1, name)

    def test_z_admin_resets(self):
        if self.request('/api/setup/status')[1]['available']:
            self.request('/api/setup/start', 'POST', {'display_name': 'Teste', 'email': self.email, 'password': self.password})
        self.request('/api/auth/login', 'POST', {'email': self.email, 'password': self.password})
        csrf = self.request('/api/auth/session')[1]['csrf']
        token = uuid.uuid4().hex + uuid.uuid4().hex
        self.request('/api/leads', 'POST', {'id': uuid.uuid4().hex, 'instagram': '@reset.teste', 'flow_token': token})
        self.request('/api/vsl/events', 'POST', {'event': 'vsl_80'}, bearer=token)
        summary = self.request('/api/admin/reset-summary')[1]
        self.assertGreater(summary['creators'], 0)
        self.assertGreater(summary['events'], 0)
        before = self.request('/api/admin/analytics?period=all')[1]['counts']
        config_before = self.request('/api/admin/config')[1]
        payload = {'kind': 'creators', 'confirmation': 'APAGAR CREATORS'}
        self.assertEqual(self.request('/api/admin/reset', 'POST', payload)[0], 403)
        self.assertEqual(self.request('/api/admin/reset', 'POST', payload, csrf, 'https://evil.example')[0], 403)
        self.assertEqual(self.request('/api/admin/reset', 'POST', {'kind': 'creators', 'confirmation': 'sim'}, csrf)[0], 400)
        self.assertEqual(self.request('/api/admin/reset-summary')[1]['creators'], summary['creators'])
        status, result, _ = self.request('/api/admin/reset', 'POST', payload, csrf)
        self.assertEqual(status, 200)
        self.assertEqual(result['removed'], summary['creators'])
        self.assertEqual(self.request('/api/admin/creators')[1]['creators'], [])
        self.assertEqual(self.request('/api/vsl/session', bearer=token)[0], 401)
        self.assertEqual(self.request('/api/admin/analytics?period=all')[1]['counts'], before)
        self.assertEqual(self.request('/api/admin/config')[1], config_before)
        self.request('/api/leads', 'POST', {'id': uuid.uuid4().hex, 'instagram': '@depois.reset'})
        self.assertEqual(self.request('/api/admin/reset', 'POST', {'kind': 'funnel', 'confirmation': 'ZERAR FUNIL'}, csrf)[0], 200)
        self.assertEqual(self.request('/api/admin/reset-summary')[1]['events'], 0)
        self.assertEqual(len(self.request('/api/admin/creators')[1]['creators']), 1)
        self.assertTrue(all(value == 0 for value in self.request('/api/admin/analytics?period=all')[1]['counts'].values()))
        self.assertIn('reset_funnel_at', self.request('/api/admin/reset-summary')[1]['last_resets'])
        events = {'events': [{'id': uuid.uuid4().hex, 'session_id': uuid.uuid4().hex, 'event': 'page_view'}]}
        self.assertEqual(self.request('/api/events', 'POST', events)[0], 200)
        self.assertEqual(self.request('/api/admin/analytics?period=all')[1]['counts']['page_view'], 1)
        self.request('/api/auth/logout', 'POST', {}, csrf)
        self.assertEqual(self.request('/api/admin/reset', 'POST', payload, csrf)[0], 401)

    def test_public_private_auth_and_creator_flow(self):
        status, page, _ = self.request("/")
        self.assertEqual(status, 200)
        self.assertIn("LUME_BACKEND=true", page)
        self.assertIn('id="video-watch-track"', page)
        self.assertIn('id="video-contact"', page)
        self.assertNotIn('id="whatsapp-button"', page)
        status, page, url = self.request("/admin/")
        self.assertEqual(status, 200)
        self.assertTrue(url.endswith("/admin/setup/"))
        self.assertIn("Crie seu acesso", page)
        self.assertNotIn("aplicativo autenticador", page)
        self.assertEqual(self.request("/admin.js")[0], 404)
        self.assertEqual(self.request("/api/setup/confirm", "POST", {})[0], 404)

        status, setup, _ = self.request("/api/setup/status")
        self.assertEqual(status, 200)
        self.assertTrue(setup["available"])
        self.assertFalse(setup["requires_key"])
        self.assertEqual(self.request("/api/setup/start", "POST", {
            "display_name": "Pessoa de Teste", "email": self.email,
            "password": "abc1234",
        })[0], 400)
        status, setup, _ = self.request("/api/setup/start", "POST", {
            "display_name": "Pessoa de Teste", "email": self.email,
            "password": self.password,
        })
        self.assertEqual((status, setup["ok"]), (200, True))
        self.assertNotIn("secret", setup)
        self.assertNotIn("challenge", setup)
        self.assertFalse(self.request("/api/setup/status")[1]["available"])
        self.assertEqual(self.request("/api/setup/start", "POST", {
            "display_name": "Outra Pessoa", "email": "other@example.com",
            "password": self.password,
        })[0], 409)
        csrf = self.request("/api/auth/session")[1]["csrf"]
        self.assertEqual(self.request("/api/auth/logout", "POST", {}, csrf)[0], 200)
        self.assertTrue(self.request("/admin/login/")[2].endswith("/admin/login/"))

        with self.server_module.database() as db:
            db.execute("UPDATE admin_users SET totp_secret='legacy-secret' WHERE email=?", (self.email,))
        self.assertEqual(self.request("/api/auth/login", "POST", {"email": self.email, "password": "wrong"})[0], 401)
        with self.server_module.database() as db:
            self.assertEqual(db.execute("SELECT failed_attempts FROM admin_users WHERE email=?", (self.email,)).fetchone()[0], 1)
        status, result, _ = self.request("/api/auth/login", "POST", {"email": self.email, "password": self.password})
        self.assertEqual((status, result["ok"]), (200, True))
        self.assertEqual(self.request("/api/auth/login", "POST", {"email": self.email, "password": self.password})[0], 200)
        status, result, _ = self.request("/api/auth/session")
        self.assertTrue(result["authenticated"])
        csrf = result["csrf"]
        self.assertEqual(self.request("/admin/")[0], 200)
        self.assertEqual(self.request("/admin.js")[0], 200)

        creator = {"name": "Pessoa de Teste", "instagram": "@teste.criador", "followers": "2 mil",
                   "status": "fechado", "valid_depositors": 30, "revenue_cents": 80000,
                   "payout_cents": 60000, "notes": "Contato feito"}
        self.assertEqual(self.request("/api/admin/creators", "POST", creator)[0], 403)
        self.assertEqual(self.request("/api/admin/creators", "POST", creator, csrf, "https://evil.example")[0], 403)
        status, saved, _ = self.request("/api/admin/creators", "POST", creator, csrf)
        self.assertEqual(status, 201)
        self.assertEqual(saved["revenue_cents"], 80000)
        creator_id = saved["id"]
        status, saved, _ = self.request(f"/api/admin/creators/{creator_id}", "PATCH", {"status": "concluido", "revenue_cents": 100000}, csrf)
        self.assertEqual(status, 200)
        self.assertEqual(saved["status"], "concluido")
        status, summary, _ = self.request("/api/admin/dashboard")
        self.assertEqual(status, 200)
        self.assertEqual((summary["total"], summary["closed"], summary["revenue_cents"], summary["balance_cents"]), (1, 1, 100000, 40000))

        status, lead, _ = self.request("/api/leads", "POST", {"instagram": "@novo.perfil", "answers": {"question_1": "1 mil"}})
        self.assertEqual(status, 201)
        self.assertTrue(lead["id"])
        stable = {"id": "stable_submission_20260924", "instagram": "@sem.duplicata", "answers": {"question_1": "10 mil"}}
        stable_status, stable_result, _ = self.request("/api/leads", "POST", stable)
        self.assertEqual(stable_status, 201)
        repeated_status, repeated, _ = self.request("/api/leads", "POST", stable)
        self.assertEqual(repeated_status, 200)
        self.assertTrue(repeated["duplicate"])
        self.assertEqual(repeated["id"], stable_result["id"])
        events = {"events": [
            {"id": "event_unique_page_20260924", "session_id": "session_unique_20260924", "event": "page_view"},
            {"id": "event_unique_quiz_20260924", "session_id": "session_unique_20260924", "event": "quiz_started"},
        ]}
        self.assertEqual(self.request("/api/events", "POST", events)[0], 200)
        self.assertEqual(self.request("/api/events", "POST", events)[0], 200)
        self.assertEqual(self.request("/api/events", "POST", {"events": [{"id": "bad_event_identifier_2026", "session_id": "session_unique_20260924", "event": "invalid"}]})[0], 400)
        analytics = self.request("/api/admin/analytics?period=all")[1]["counts"]
        self.assertEqual((analytics["page_view"], analytics["quiz_started"]), (1, 1))
        self.assertEqual(self.request("/api/admin/ranking")[1]["creators"][0]["instagram"], "@teste.criador")
        self.assertEqual(self.request("/api/admin/dashboard?period=today")[1]["new_today"], 3)
        self.assertEqual(len(self.request("/api/admin/creators")[1]["creators"]), 3)
        status, exported, _ = self.request("/api/admin/export.csv")
        self.assertEqual(status, 200)
        self.assertIn("'@teste.criador", exported)

        config = {"campaign": {"whatsapp": "5513920073887"}, "content": {}, "vsl": {}, "analytics": {}, "legal": {}}
        self.assertEqual(self.request("/api/admin/config", "PUT", config, csrf)[0], 200)
        self.assertEqual(self.request("/api/admin/config")[1]["campaign"]["whatsapp"], "5513920073887")
        self.assertIn("LUME_SERVER_CONFIG", self.request("/")[1])
        self.assertEqual(self.request(f"/api/admin/creators/{creator_id}", "DELETE")[0], 403)
        self.assertEqual(self.request(f"/api/admin/creators/{creator_id}", "DELETE", csrf=csrf)[0], 200)
        self.assertEqual(self.request("/api/admin/dashboard")[1]["total"], 2)
        self.assertEqual(self.request("/api/auth/logout", "POST", {}, csrf)[0], 200)
        self.assertFalse(self.request("/api/auth/session")[1]["authenticated"])
        self.assertEqual(self.request("/api/admin/creators")[0], 401)

    def test_production_setup_requires_server_key(self):
        request = Request({
            "type": "http", "scheme": "https", "server": ("lume.example", 443),
            "client": ("198.51.100.10", 53000),
            "path": "/api/setup/start", "headers": [(b"host", b"lume.example")],
        })
        key = "test-only-setup-key-very-long-2026"
        with patch.object(self.server_module, "has_admin", return_value=False), \
             patch.object(self.server_module, "DEV_HTTP", False), \
             patch.dict(os.environ, {"LUME_SETUP_TOKEN": key}):
            with self.assertRaises(HTTPException) as failed:
                self.server_module.require_setup_access(request, "wrong-key")
            self.assertEqual(failed.exception.status_code, 403)
            self.server_module.require_setup_access(request, key)

    def test_pushcut_outbox_retry_and_failure_isolated(self):
        server = self.server_module
        with server.database() as db:
            lead = db.execute("SELECT lead_id FROM notification_outbox WHERE delivered_at IS NULL LIMIT 1").fetchone()
        self.assertIsNotNone(lead)
        lead_id = lead["lead_id"]
        with patch.dict(os.environ, {"PUSHCUT_WEBHOOK_URL": "https://api.pushcut.io/test-secret/notifications/New"}), \
             patch.object(server, "urlopen", side_effect=TimeoutError("test timeout")):
            server.notify_pushcut(lead_id)
        with server.database() as db:
            row = db.execute("SELECT attempts,delivered_at FROM notification_outbox WHERE lead_id=?", (lead_id,)).fetchone()
        self.assertEqual(row["attempts"], 1)
        self.assertIsNone(row["delivered_at"])

        class FakeResponse:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *_): return False

        with patch.dict(os.environ, {"PUSHCUT_WEBHOOK_URL": "https://api.pushcut.io/test-secret/notifications/New"}), \
             patch.object(server, "urlopen", return_value=FakeResponse()) as sent:
            server.notify_pushcut(lead_id)
            self.assertEqual(json.loads(sent.call_args.args[0].data)["title"], "🔥 Novo creator na LUME")
        with server.database() as db:
            row = db.execute("SELECT attempts,delivered_at FROM notification_outbox WHERE lead_id=?", (lead_id,)).fetchone()
        self.assertEqual(row["attempts"], 2)
        self.assertTrue(row["delivered_at"])

    def test_vercel_storage_guard_and_video_redirect(self):
        server = self.server_module

        class FakeConnection:
            def execute(self, statement, parameters):
                self.statement = statement
                self.parameters = parameters
                return self

        connection = FakeConnection()
        server.PostgresDatabase(connection).execute("SELECT * FROM config WHERE key=?", ("site",))
        self.assertEqual(connection.statement, "SELECT * FROM config WHERE key=%s")
        self.assertEqual(connection.parameters, ("site",))

        with patch.object(server, "IS_VERCEL", True), patch.object(server, "DATABASE_URL", ""):
            with self.assertRaises(HTTPException) as missing:
                with server._raw_database():
                    pass
            self.assertEqual(missing.exception.status_code, 503)

        with patch.object(server, "VIDEO_URL", "https://storage.example/campaign.mp4"):
            response = server.campaign_video()
            self.assertEqual(response.status_code, 307)
            self.assertEqual(response.headers["location"], "https://storage.example/campaign.mp4")

    def test_vercel_import_does_not_create_a_local_database(self):
        data_dir = self.test_data_dir / "vercel-must-not-write"
        env = {**os.environ, "VERCEL": "1", "LUME_DATA_DIR": str(data_dir)}
        env.pop("DATABASE_URL", None)
        result = subprocess.run(
            [sys.executable, "-c", "import server"], cwd=ROOT, env=env,
            capture_output=True, text=True, timeout=10,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(data_dir.exists())


if __name__ == "__main__":
    unittest.main()
