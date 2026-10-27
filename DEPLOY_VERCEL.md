# Deploying AVPCD to GitHub and Vercel

Two Vercel projects from one GitHub repository. The browser loads the site from the frontend project and calls the API project directly.

| Vercel project | Root Directory | Framework preset | Environment variables |
|---|---|---|---|
| `avpcd-api` (backend) | `backend` | Other (Vercel detects Python from `requirements.txt` and `api/index.py`) | `AVPCD_CORS_ORIGINS` = the frontend's production URL, no trailing slash |
| `avpcd-web` (frontend) | `frontend` | Other (`vercel.json` sets build command `node build.mjs` and output `dist`) | `AVPCD_API_URL` = the backend's production URL (https) |

The release database `backend/data/avpcd_v0.1.sqlite3` (2.3 MB) is committed to this repository and bundled into the function (`includeFiles` in `backend/vercel.json`). It is opened read-only. Downloads (`/api/download`) stay off unless `AVPCD_ENABLE_DOWNLOAD=true` is set.

## One-time steps

1. **GitHub:** create an empty **private** repository, then from this folder:
   ```sh
   git remote add origin https://github.com/<account>/<repo>.git
   git push -u origin main
   ```
2. **Backend project:** Vercel dashboard > Add New > Project > import the repository > Root Directory `backend` > Deploy. Note its production URL, e.g. `https://avpcd-api.vercel.app`. Check `https://<api-url>/api/health` and `/api/stats`.
3. **Frontend project:** import the same repository again > Root Directory `frontend` > add `AVPCD_API_URL=https://<api-url>` > Deploy. Note its production URL.
4. **Close the loop:** in the backend project add `AVPCD_CORS_ORIGINS=https://<frontend-url>` (plus a custom domain if you add one) and redeploy. Preview URLs are not allowed by design.
5. **Check:** open the frontend, search, open a record page, open the statistics page.

Project names decide the `.vercel.app` addresses; if a name is taken Vercel adds a suffix. Use the real URLs in steps 3 and 4.

## Visibility: read before step 2

A private GitHub repository does **not** make the Vercel sites private. A production `*.vercel.app` address is reachable by anyone who has the link, and the API serves all 1,731 records. The release licence is not confirmed (release README), so either:

- turn on Vercel Deployment Protection for both projects (Project Settings > Deployment Protection) while testing; the frontend then works only for people logged in to Vercel in the same browser, and the API call from the page may be blocked, so this is for the owner's own checks; or
- deploy knowing the data is public, with the draft banner and downloads off.

## Updating the data

Replace `backend/data/avpcd_v0.1.sqlite3` with the new release file, run `python -I backend/tools/make_data_contract.py` (it reads the file in `backend/data/` when present, else the project repository's release folder), run `cd backend && python -m pytest -q`, commit, push. Vercel redeploys.

## Limits

The function is serverless: each cold start reopens the file (a few hundred milliseconds), and the in-process cache of `/api/stats` does not survive between instances. Responses carry `Cache-Control: public, max-age=300`, which Vercel's CDN honours for the data endpoints.

The Alibaba route (`backend/deploy/DEPLOY_ALIBABA.md`) still works unchanged if the API should later run on a server.
