# Deployment & CI/CD

This frontend deploys exactly like the backend: **CI** builds it on every push to
`main`, and once CI passes **CD** SSHes into the GCP VM, pulls the repo, and
rebuilds the Docker Compose stack. The two repos are independent — the backend
runs on port `8080`, the frontend on port `8081`.

```
push to main ──> CI (npm ci + ng build) ──> CD (ssh ──> git reset ──> docker compose up --build ──> /healthz)
```

## 1. Add the GitHub Actions secrets

In the **frontend** repo (`dk30814-pixel/doubleCheckFrontEnd`) →
**Settings → Secrets and variables → Actions → New repository secret**, add the
same four secrets you created for the backend:

| Secret       | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| `VM_HOST`    | External IP of the VM (e.g. `34.73.44.233`)                      |
| `VM_USER`    | SSH username (e.g. `amarjahiji2004`)                             |
| `VM_SSH_KEY` | The **private** SSH key (full contents, incl. BEGIN/END lines)   |
| `VM_APP_DIR` | Path to **this** repo on the VM (e.g. `/home/<user>/doubleCheckFrontEnd`) |

You can reuse the same key pair as the backend.

## 2. Prepare the VM (one time)

SSH into the VM and clone the frontend repo to the path you put in `VM_APP_DIR`:

```bash
cd ~
git clone https://github.com/dk30814-pixel/doubleCheckFrontEnd.git
cd doubleCheckFrontEnd
docker compose up -d --build      # first deploy (CD does this automatically afterwards)
```

Docker + Compose are already installed from the backend setup. The frontend
container reaches the backend through `host.docker.internal:host-gateway`
(configured in `docker-compose.yml`), so it talks to the backend's published
`8080` on the same host — nothing to change on the backend.

## 3. Open the firewall for port 8081

Allow TCP `8081` to the VM so the site is reachable. With gcloud:

```bash
gcloud compute firewall-rules create allow-frontend-8081 \
  --allow tcp:8081 --direction INGRESS --network default
```

(Or add the rule in the GCP Console → VPC network → Firewall.) The app is then at
`http://<VM_HOST>:8081`.

## 4. Done — push to deploy

After the secrets and the one-time clone are in place, every push to `main`
builds and deploys automatically. You can also trigger a deploy manually from the
repo's **Actions → CD (Deploy to GCP VM) → Run workflow** button.

The CD job waits for `http://localhost:8081/healthz` to return `ok` before
reporting success, and dumps the last 50 lines of container logs if it doesn't.

## Optional / good to know

- **CORS:** not needed. nginx serves the SPA and reverse-proxies `/api` to the
  backend, so the browser uses a single origin. (If you ever point the SPA
  directly at the API on another origin instead, you'd then need to enable CORS
  in the backend's `Program.cs`.)
- **Serving on port 80 / a domain:** change the compose port mapping to
  `"80:80"` (set `WEB_PORT=80`), or put the existing `8081` behind a reverse
  proxy / load balancer that terminates TLS for your domain.
- **Pointing at a different backend:** override `API_UPSTREAM` (e.g. in a
  `.env` file next to `docker-compose.yml`) — for example if the API is exposed
  on a different host or port.
