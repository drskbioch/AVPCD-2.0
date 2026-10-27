"""Settings, read from environment variables when the app is created. No defaults hold a secret; there are none."""
import os
from dataclasses import dataclass
from pathlib import Path

# Default database: backend/data/ (the standalone deployment repo, where Vercel bundles the file), else the release
# folder of the project repository (local development). AVPCD_DB_PATH overrides both.
_BACKEND = Path(__file__).resolve().parents[1]
_BUNDLED_DB = _BACKEND / "data" / "avpcd_v0.1.sqlite3"
_PROJECT_DB = _BACKEND.parents[1] / "analysis" / "phase6" / "release_v0.1" / "avpcd_v0.1.sqlite3"
DEFAULT_DB_PATH = _BUNDLED_DB if _BUNDLED_DB.is_file() else _PROJECT_DB


def _flag(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    return default if raw is None else raw.strip().lower() in ("1", "true", "yes", "on")


def _int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    return int(raw) if raw else default


@dataclass(frozen=True)
class Settings:
    db_path: Path
    cors_origins: tuple  # exact origins, e.g. ("https://avpcd.example.org",); empty = no CORS headers
    max_page_size: int
    default_page_size: int
    enable_download: bool
    enable_docs: bool

    @classmethod
    def from_env(cls) -> "Settings":
        origins = tuple(o.strip().rstrip("/") for o in os.environ.get("AVPCD_CORS_ORIGINS", "").split(",") if o.strip())
        return cls(
            db_path=Path(os.environ.get("AVPCD_DB_PATH") or DEFAULT_DB_PATH),
            cors_origins=origins,
            max_page_size=_int("AVPCD_MAX_PAGE_SIZE", 200),
            default_page_size=_int("AVPCD_DEFAULT_PAGE_SIZE", 50),
            # Off by default: the licence plan of release v0.1 is a proposal and is not confirmed (see release README).
            enable_download=_flag("AVPCD_ENABLE_DOWNLOAD", False),
            enable_docs=_flag("AVPCD_ENABLE_DOCS", True),
        )
