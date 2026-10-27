# avpcd_web: web app for AVPCD release v0.1

Status: ready to deploy (see DEPLOY_VERCEL.md). There are no secrets in these files (the API needs none). The data is release 0.1, licensed CC BY 4.0; its accuracy is reported as a range (release README).

## The split

| part | folder | goes to | what it is |
|---|---|---|---|
| frontend | `frontend/` | GitHub, then **Vercel** | static site (plain HTML and ES modules, no framework, no dependencies): home, browse (virus, plant, compound, endpoint), search, record page, statistics, about |
| backend | `backend/` | the **Alibaba server** | FastAPI app serving the release SQLite file read-only as JSON, run by gunicorn/uvicorn behind nginx |

The browser loads the site from Vercel and then calls the API on the Alibaba server directly. The only link between the two is one address and one allow-list:

- the frontend learns the API address from `AVPCD_API_URL` (a Vercel environment variable, written into `config.js` at build time);
- the backend allows the frontend's origin through `AVPCD_CORS_ORIGINS`.

The database file is **not** in the image or on Vercel. It is a copy of `analysis/phase6/release_v0.1/avpcd_v0.1.sqlite3` placed on the server.

**Why a static site rather than Next.js:** the release is a fixed 1,731-row table that is browsed through an API, so there is nothing to render on a server and nothing to build; plain files deploy on Vercel as they are and need no dependency updates. Next.js can be added later if per-record pages must be indexed by search engines.

## Layout

```
avpcd_web/
  README.md            this file
  DATA_CONTRACT.md     exact columns the API returns (generated from the release)
  backend/
    app/               FastAPI app (main.py, queries.py, db.py, config.py)
    tests/             pytest, run against the real release database
    tools/             make_data_contract.py
    deploy/            nginx.conf.sample, avpcd-api.service.sample, DEPLOY_ALIBABA.md
    Dockerfile  start.sh  requirements.txt  requirements-dev.txt  .env.example
  frontend/
    src/               layout.html (navbar, sidebar, footer), pages/*.html (8 pages), js/*.js (labels.js holds every plain-language field name), css/style.css, assets/art (plant cut-outs)
    build.mjs          renders pages/ into layout.html, copies css/js/assets to dist/, writes dist/config.js from AVPCD_API_URL
    tests/smoke.mjs    static checks plus every page rendered in headless Edge against the live API 
    screenshots/       pages at 1280 px and 390 px wide (written by smoke.mjs --shots screenshots)
    serve.mjs          local preview server (development only)
    vercel.json  package.json  .env.example
```

## Run it locally

Backend (from `avpcd_web/backend/`, Python 3.12 or newer):

```sh
pip install -r requirements-dev.txt
# the default database is backend/data/avpcd_v0.1.sqlite3; set AVPCD_DB_PATH to use another file
AVPCD_CORS_ORIGINS=http://127.0.0.1:5173 python -m uvicorn app.main:app --port 8000
python -m pytest -q          # 20 tests against the real database
```
(PowerShell: `$env:AVPCD_CORS_ORIGINS = "http://127.0.0.1:5173"` before the uvicorn line.) Interactive API docs: http://127.0.0.1:8000/docs.

Frontend (from `avpcd_web/frontend/`, Node 18 or newer, no `npm install` needed):

```sh
node build.mjs && node serve.mjs      # http://127.0.0.1:5173, API at http://127.0.0.1:8000 unless AVPCD_API_URL is set
node tests/smoke.mjs                  # with the backend and serve.mjs running; add --shots screenshots to refresh the pictures
```

## API in one table

| endpoint | returns |
|---|---|
| `GET /api/records` | filtered, sorted, paginated records (compound, inchikey, plant, virus, endpoint, value range, tier, flags) |
| `GET /api/record/{id}` | one record (all 65 columns) plus its paper row |
| `GET /api/stats` | counts for the release (tiers, endpoints, flags, ...) |
| `GET /api/download` | CSV of a release table; off by default (`AVPCD_ENABLE_DOWNLOAD=true` switches it on); the site itself offers no downloads |
| `GET /api/facets/{virus\|plant\|compound\|endpoint}` | record counts behind the browse pages |
| `GET /api/health` | liveness check |

Parameters, response shapes and every column are in `DATA_CONTRACT.md`. After a new release file, regenerate it with `python -I backend/tools/make_data_contract.py`; a test fails if the contract and the database disagree.

## Environment variables

Backend (`backend/.env.example`): `AVPCD_DB_PATH`, `AVPCD_CORS_ORIGINS`, `AVPCD_DEFAULT_PAGE_SIZE`, `AVPCD_MAX_PAGE_SIZE`, `AVPCD_ENABLE_DOWNLOAD`, `AVPCD_ENABLE_DOCS`, and the process settings `HOST`, `PORT`, `WEB_CONCURRENCY`. Frontend (`frontend/.env.example`): `AVPCD_API_URL`. The `.env.example` files hold placeholders; real `.env` files are git-ignored.

## Deploying

This folder is its own repository (GitHub, private) with two Vercel projects: `backend/` (FastAPI, serverless, database bundled in `backend/data/`) and `frontend/` (static). Steps, environment variables and the visibility warning: **`DEPLOY_VERCEL.md`**. The Alibaba route (`backend/deploy/DEPLOY_ALIBABA.md`) remains an alternative for the API.

## Not included

No authentication, no user accounts, no write endpoints, no search over free text beyond the listed filters, no curator identifiers (they are not in the release), no manuscript figures (figure style: `analysis/phase8/figures/avpcd_style.py`).
