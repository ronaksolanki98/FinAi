# Setup & Deployment Guide

## Prerequisites
- Node.js 20.x + pnpm 10.x.
- Docker & BuildKit for local image builds.
- Access to a PostgreSQL instance (Neon, Azure, or local container).
- Azure subscription with a Web App (or Kubernetes cluster) and Container Registry.

## Local Environment
1. Copy the sample configuration: `cp configs/.env.example .env` and fill in your secrets (Resend key, Google OAuth, Postgres URL).
2. Install dependencies: `pnpm install`.
3. Start PostgreSQL locally or point `DATABASE_URL` to a managed cluster with SSL enabled.
4. Run `pnpm init-db` to seed tables if you rely on the server running locally.
5. Launch both client/server: `pnpm dev`.

## Container Workflow
1. Build & tag the Docker image: `./scripts/build-docker.sh <version> <registry>`.
2. Push the artifact to your registry (`docker push`).
3. Update your Azure Web App (or Kubernetes manifest) to pull the new tag.
4. Restart the app via Azure CLI or redeploy via GitHub Actions.

## Terraform & Kubernetes
- Terraform files live under `infrastructure/terraform`; run `terraform init` from that directory and keep your state in remote backends (Azure storage or Terraform Cloud).
- The Kubernetes folder (`infrastructure/kubernetes`) contains YAML for deployments, services, and configmaps. Apply them via `kubectl apply -f infrastructure/kubernetes` after pointing the config at your cluster.

## Documentation & Troubleshooting
- Architecture reference: `docs/architecture.md`.
- CI/CD explanation: `ci-cd/README.md`.
- Need to rebuild the image? Use `scripts/build-docker.sh` and ensure secrets from `.env` are passed through with `--env-file .env`.
