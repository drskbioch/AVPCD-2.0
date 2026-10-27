#!/bin/sh
# Production start: gunicorn with uvicorn workers. Run from backend/. Settings come from the environment (see .env.example).
# Windows or quick local run: python -m uvicorn app.main:app --reload
set -eu
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers "${WEB_CONCURRENCY:-2}" \
  --bind "${HOST:-127.0.0.1}:${PORT:-8000}" \
  --timeout 30 \
  --access-logfile -
