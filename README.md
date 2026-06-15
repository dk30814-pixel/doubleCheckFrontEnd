# DoubleCheck — Frontend

A small Angular (v22, standalone + signals) single-page app for the DoubleCheck
backend. It ships as an nginx Docker image and deploys to the same GCP VM as the
API via GitHub Actions, mirroring the backend's CI/CD.

> **Note:** the chat / `/api/conversations` endpoints are intentionally **not**
> used anywhere in this app — that part of the API has a known bug. The frontend
> only calls auth, account, categories, professionals, admin and verification.

## What's included

| Area          | Route            | API used                                  |
| ------------- | ---------------- | ----------------------------------------- |
| Login         | `/login`         | `POST /api/auth/login`                    |
| Register      | `/register`      | `POST /api/auth/register`                 |
| Dashboard     | `/dashboard`     | `GET /api/auth/me`, `GET /api/account/balance` |
| Categories    | `/categories`    | `GET/POST/PUT/DELETE /api/categories`     |
| Professional  | `/professional`  | `GET/POST/PUT /api/professionals/...`     |
| Verification  | `/verification`  | `GET/POST /api/verification/...`          |
| Admin         | `/admin`         | `GET/POST/DELETE /api/admin/...`          |

Admin and Professional sections appear only for users holding those roles
(role-aware nav + route guards). The JWT is stored client-side and attached to
every request by an HTTP interceptor.

## Local development

```bash
npm install
npm start          # ng serve on http://localhost:4200
```

`ng serve` proxies `/api` to `http://localhost:8080` (see `proxy.conf.json`), so
run the backend stack (`docker compose up` in the `doubleCheck` repo) first, or
edit the target if your API runs elsewhere (e.g. `http://localhost:5247`).

## Production build

```bash
npm run build -- --configuration production
# output: dist/dcfe/browser
```

## Docker (local smoke test)

```bash
docker compose up -d --build
# open http://localhost:8081   (nginx serves the SPA and proxies /api -> backend)
```

`nginx` reverse-proxies `/api` to the backend, so the browser only ever talks to
one origin — **no CORS configuration is required on the API**. The upstream is
controlled by `API_UPSTREAM` (default `http://host.docker.internal:8080`) and the
published port by `WEB_PORT` (default `8081`).

## Deployment / CI-CD

See **DEPLOYMENT.md** in this repo for the full step-by-step setup of the GitHub
Actions pipeline and the one-time VM preparation.
