# CI/CD Overview

This folder documents the GitHub Actions pipeline (`.github/workflows/ci-cd.yml`). The workflow orchestrates the following stages:
1. **Lint & Typecheck** — installs dependencies and runs `pnpm typecheck` + `pnpm test` to guard against regressions.
2. **Build** — runs `pnpm build` to produce both SPA and server bundles.
3. **Docker** — leverages `docker/build-push-action` to build the image defined in `docker/Dockerfile` and pushes to your Azure Container Registry.
4. **Deploy** — logs into Azure using a service principal and deploys the freshly built container to the configured Web App.

Secrets required (configure via GitHub repo settings):
- `ACR_REGISTRY` (e.g. `finai.azurecr.io`)
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_WEBAPP_NAME`
- `AZURE_RESOURCE_GROUP`
- `AZURE_WEBAPP_PUBLISH_PROFILE` (or Azure service principal JSON if using `azure/login`)
- `AZURE_CREDENTIALS` (JSON for service principal if required)
