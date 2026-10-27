"""Vercel entrypoint: exposes the FastAPI app as `app` (ASGI). Vercel project root directory: backend/."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import create_app  # noqa: E402

app = create_app()
