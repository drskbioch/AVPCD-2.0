# AVPCD API. Build from backend/:  docker build -t avpcd-api .
# Run:  docker run -d --name avpcd-api -p 127.0.0.1:8000:8000 --env-file .env \
#         -v /srv/avpcd/data:/data:ro avpcd-api
# /srv/avpcd/data must hold avpcd_v0.1.sqlite3 (copied from analysis/phase6/release_v0.1/). The database is not baked into the image.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    AVPCD_DB_PATH=/data/avpcd_v0.1.sqlite3

WORKDIR /srv/app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY start.sh .
RUN chmod +x start.sh && useradd --system --no-create-home avpcd
USER avpcd

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/api/health',timeout=4)" || exit 1
CMD ["./start.sh"]
