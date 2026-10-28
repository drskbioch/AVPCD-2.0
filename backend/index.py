"""Vercel entrypoint (zero-config FastAPI): Vercel finds `app` in this file and passes every request path through unchanged.
Vercel project root directory: backend/."""
from app.main import create_app

app = create_app()
