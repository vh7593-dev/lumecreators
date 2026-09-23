"""Copy the local LUME database to an EMPTY PostgreSQL database.

Run from the project root. DATABASE_URL must be an environment variable, never
an argument or a value committed to Git. Sessions are deliberately not copied.
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ADMIN_COLUMNS = (
    "id", "email", "display_name", "password_salt", "password_hash",
    "totp_secret", "last_totp_step", "failed_attempts", "locked_until",
)
CREATOR_COLUMNS = (
    "id", "legacy_id", "created_at", "source", "name", "instagram",
    "followers", "stories", "experience", "status", "valid_depositors",
    "revenue_cents", "payout_cents", "notes", "attribution_json", "device_json",
)


def copy_rows(source: sqlite3.Connection, target, table: str, columns: tuple[str, ...]) -> int:
    names = ",".join(columns)
    placeholders = ",".join("%s" for _ in columns)
    rows = source.execute(f"SELECT {names} FROM {table}").fetchall()
    for row in rows:
        target.execute(
            f"INSERT INTO {table} ({names}) VALUES ({placeholders})",
            tuple(row[column] for column in columns),
        )
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrar SQLite local da LUME para PostgreSQL vazio")
    parser.add_argument("--sqlite", type=Path, default=ROOT / "data" / "lume.sqlite3")
    parser.add_argument("--apply", action="store_true", help="executar a cópia; sem isto, apenas mostra contagens")
    args = parser.parse_args()
    sqlite_path = args.sqlite.resolve()
    if not sqlite_path.is_file():
        raise SystemExit(f"Banco SQLite não encontrado: {sqlite_path}")

    source = sqlite3.connect(sqlite_path.as_uri() + "?mode=ro", uri=True)
    source.row_factory = sqlite3.Row
    try:
        source.execute("BEGIN")
        counts = {table: source.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                  for table in ("admin_users", "config", "creators", "sessions")}
        print("SQLite:", ", ".join(f"{table}={count}" for table, count in counts.items()))
        video = sqlite_path.parent / "campaign.mp4"
        print("MP4 local:", f"{video.stat().st_size} bytes" if video.is_file() else "não encontrado")
        print("Sessões antigas não serão migradas; será necessário entrar novamente no painel.")
        if not args.apply:
            print("Nenhum dado enviado. Acrescente --apply após configurar DATABASE_URL para migrar.")
            return

        database_url = os.getenv("DATABASE_URL", "").strip()
        if not database_url:
            raise SystemExit("Defina DATABASE_URL no ambiente, sem gravá-la no código ou no comando.")
        sys.path.insert(0, str(ROOT))
        import server  # Creates the PostgreSQL schema through the same production code.
        import psycopg

        if not server.DATABASE_URL:
            raise SystemExit("O servidor não reconheceu DATABASE_URL.")
        with psycopg.connect(database_url, connect_timeout=10) as target:
            target.execute("SELECT pg_advisory_xact_lock(687543212)")
            existing = {table: target.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                        for table in ("admin_users", "config", "creators")}
            if any(existing.values()):
                raise SystemExit("PostgreSQL não está vazio; migração cancelada sem sobrescrever dados.")
            moved_admins = copy_rows(source, target, "admin_users", ADMIN_COLUMNS)
            moved_config = copy_rows(source, target, "config", ("key", "value"))
            moved_creators = copy_rows(source, target, "creators", CREATOR_COLUMNS)
            target.execute(
                """SELECT setval(pg_get_serial_sequence('admin_users','id'),
                   COALESCE((SELECT MAX(id) FROM admin_users), 1),
                   EXISTS (SELECT 1 FROM admin_users))"""
            )
        print(f"Migrados: {moved_admins} administradores, {moved_config} configurações, {moved_creators} creators.")
        print("O MP4 não foi enviado. Hospede-o fora da Vercel e configure uma URL HTTPS direta.")
    finally:
        source.close()


if __name__ == "__main__":
    main()
