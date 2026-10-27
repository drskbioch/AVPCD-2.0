# Deploying the AVPCD API on an Alibaba Cloud server (note, not yet carried out)

Nothing here has been run on a server. It is a checklist for the person who will do it. No secret, password or key belongs in the repository; the API itself needs none.

## Before you start

1. **Region and domain.** In a mainland China region, serving a domain on ports 80/443 needs an ICP filing, which takes time; a Hong Kong or other overseas region does not. Decide this first. The frontend (Vercel) will call the API from visitors' browsers, so the API needs an **https** address with a valid certificate (a mixed-content block otherwise).
2. **Licence.** The records are CC BY 4.0 (release README), so the API may be public. Downloads are on by default; set `AVPCD_ENABLE_DOWNLOAD=false` to switch them off.
3. **Security group.** Open inbound 80 and 443 (and 22 from your own address only). Do **not** open 8000: the API listens on localhost behind nginx.

## Steps (Docker route)

```sh
# on the server (Ubuntu/Debian, Docker installed)
sudo mkdir -p /srv/avpcd/data && sudo chown "$USER" /srv/avpcd/data
# copy from your machine (scp/rsync): backend/ -> /srv/avpcd/backend ; analysis/phase6/release_v0.1/avpcd_v0.1.sqlite3 -> /srv/avpcd/data/
cd /srv/avpcd/backend
cp .env.example .env && nano .env            # set AVPCD_CORS_ORIGINS to the Vercel URL
docker build -t avpcd-api .
docker run -d --name avpcd-api --restart unless-stopped -p 127.0.0.1:8000:8000 \
  --env-file .env -v /srv/avpcd/data:/data:ro avpcd-api
curl -s http://127.0.0.1:8000/api/health
```

Without Docker: create a virtualenv, `pip install -r requirements.txt`, and use `avpcd-api.service.sample` (systemd) instead of `docker run`.

## nginx and TLS

1. `sudo apt install nginx certbot` and point the DNS record of `api.example.org` at the server.
2. Copy `nginx.conf.sample` to `/etc/nginx/conf.d/avpcd-api.conf`, replace `api.example.org`, create the certificate (`sudo certbot certonly --webroot -w /var/www/certbot -d api.example.org`), then `sudo nginx -t && sudo systemctl reload nginx`.
3. Check from outside: `curl -s https://api.example.org/api/stats`.

## Connecting the frontend

In the Vercel project settings add the environment variable `AVPCD_API_URL=https://api.example.org` (see `avpcd_web/README.md`) and redeploy. Put the Vercel production URL into `AVPCD_CORS_ORIGINS` on the server and restart the container.

## Updating the data

Replace `/srv/avpcd/data/avpcd_v0.1.sqlite3` with the new release file and restart the container (`docker restart avpcd-api`). The server opens the file read-only and never writes to it. `/api/stats` is cached until the file's modification time changes.

## What this setup does not do

No authentication, no per-user limits beyond nginx `limit_req`, no logging of query contents beyond the standard access log, no backups (the database is a copy of a repository file).
