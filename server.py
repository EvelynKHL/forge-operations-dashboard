"""Small SQLite-backed REST API for the Forge operations dashboard."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

DB_PATH = Path(os.environ.get("FORGE_DB_PATH", Path(__file__).parent / "data" / "forge.db"))
API_PORT = int(os.environ.get("FORGE_API_PORT", "8765"))
SEED = [
    ("svc-001", "Identity Gateway", "Access & Identity", "AK", "Healthy", "99.99%", "Global", "2 min ago", "Authentication and token exchange for internal services.", "Tier 0", "42 ms"),
    ("svc-002", "Device Provisioning", "Fleet Systems", "MP", "Degraded", "98.72%", "US West", "4 min ago", "Enrollment and configuration for managed devices.", "Tier 1", "840 ms"),
    ("svc-003", "Build Orchestrator", "Developer Tools", "JL", "Healthy", "99.95%", "US East", "8 min ago", "Schedules and coordinates continuous integration workloads.", "Tier 1", "118 ms"),
    ("svc-004", "Asset Registry", "Infrastructure Data", "SR", "Maintenance", "99.80%", "EU Central", "12 min ago", "Source of truth for infrastructure assets and relationships.", "Tier 2", "—"),
    ("svc-005", "Metrics Pipeline", "Observability", "TN", "Healthy", "99.97%", "Global", "16 min ago", "Collects and routes operational telemetry across regions.", "Tier 1", "76 ms"),
    ("svc-006", "Secrets Broker", "Access & Identity", "DV", "Healthy", "99.99%", "AP South", "21 min ago", "Issues short-lived credentials to authorized workloads.", "Tier 0", "35 ms"),
    ("svc-007", "Network Configurator", "Network Platform", "EC", "Degraded", "97.61%", "AP South", "27 min ago", "Validates and applies approved network configuration changes.", "Tier 1", "1.2 s"),
    ("svc-008", "Capacity Planner", "Infrastructure Data", "RB", "Healthy", "99.91%", "US East", "31 min ago", "Models demand and recommends infrastructure capacity.", "Tier 2", "203 ms"),
]
FIELDS = ("id", "name", "team", "owner", "status", "uptime", "region", "updated", "description", "tier", "latency")


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("""CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, team TEXT NOT NULL,
        owner TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('Healthy','Degraded','Maintenance')),
        uptime TEXT NOT NULL, region TEXT NOT NULL, updated TEXT NOT NULL,
        description TEXT NOT NULL, tier TEXT NOT NULL, latency TEXT NOT NULL
    )""")
    if db.execute("SELECT COUNT(*) FROM services").fetchone()[0] == 0:
        db.executemany("INSERT INTO services VALUES (?,?,?,?,?,?,?,?,?,?,?)", SEED)
        db.commit()
    return db


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path != "/api/services":
            return self.respond(404, {"error": "Route not found"})
        with connect() as db:
            rows = db.execute("SELECT * FROM services ORDER BY name").fetchall()
        self.respond(200, [dict(row) for row in rows])

    def do_POST(self):
        if urlparse(self.path).path != "/api/services":
            return self.respond(404, {"error": "Route not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 4096:
                return self.respond(413, {"error": "Request is too large"})
            data = json.loads(self.rfile.read(length))
            name = data.get("name", "").strip()
            team = data.get("team", "").strip() or "Unassigned"
            region = data.get("region", "")
            if not name or len(name) > 60 or len(team) > 60:
                return self.respond(400, {"error": "Name is required (up to 60 characters); team must be 60 characters or fewer"})
            if region not in {"US West", "US East", "EU Central", "AP South", "Global"}:
                return self.respond(400, {"error": "Choose a valid region"})
            item = (f"svc-{os.urandom(4).hex()}", name, team, "YO", "Healthy", "—", region, "just now",
                    "Newly registered service. Add operational details to complete this record.", "Tier 2", "—")
            with connect() as db:
                db.execute("INSERT INTO services VALUES (?,?,?,?,?,?,?,?,?,?,?)", item)
            return self.respond(201, dict(zip(FIELDS, item)))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return self.respond(400, {"error": "Send a valid JSON request"})
        except (AttributeError, TypeError):
            return self.respond(400, {"error": "Request fields must be strings"})

    def log_message(self, fmt, *args):
        print(f"{self.log_date_time_string()} {self.client_address[0]} {fmt % args}")


if __name__ == "__main__":
    with connect() as database:
        print(f"Forge API ready on http://127.0.0.1:{API_PORT} (database: {DB_PATH})")
    ThreadingHTTPServer(("127.0.0.1", API_PORT), Handler).serve_forever()
