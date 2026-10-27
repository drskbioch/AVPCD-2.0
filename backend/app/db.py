"""Read-only access to the release SQLite file and the facts about it that the API validates against."""
import sqlite3
from contextlib import closing
from pathlib import Path


class Release:
    """Opens the release database read-only (URI mode=ro plus PRAGMA query_only) and reads its shape once."""

    def __init__(self, path: Path):
        path = Path(path).resolve()
        if not path.is_file():
            raise FileNotFoundError(f"release database not found: {path} (set AVPCD_DB_PATH)")
        self.path = path
        with closing(self.connect()) as con:
            self.tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
            for needed in ("records", "papers", "meta"):
                if needed not in self.tables:
                    raise RuntimeError(f"{path} has no table {needed!r}: not a release database")
            self.columns = {t: [r[1] for r in con.execute(f'PRAGMA table_info("{t}")')] for t in self.tables}
            self.meta = dict(con.execute("SELECT key, value FROM meta"))
            self.endpoints = {r[0] for r in con.execute("SELECT DISTINCT endpoint FROM records") if r[0]}
            self.tiers = {r[0] for r in con.execute("SELECT DISTINCT evidence_tier FROM records") if r[0]}
            tokens = set()
            for (v,) in con.execute("SELECT DISTINCT data_quality_flags FROM records"):
                tokens.update(t for t in (v or "").split(";") if t)
            self.flags = tokens

    def connect(self) -> sqlite3.Connection:
        con = sqlite3.connect(f"{self.path.as_uri()}?mode=ro", uri=True, check_same_thread=False)
        con.execute("PRAGMA query_only = ON")
        con.row_factory = sqlite3.Row
        return con

    @property
    def mtime(self) -> float:
        return self.path.stat().st_mtime
