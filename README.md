# FinAi — Modern Personal Finance Platform

FinAi is a modular finance assistant that captures transactions from user entry and receipt uploads, categorizes spending, and delivers intelligent insights that help people proactively manage their money. The stack combines a React + Vite SPA with an Express API, backed by PostgreSQL, containerized for cloud deployment, and shipped through a full CI/CD pipeline.

## Table of Contents
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Local Setup](#local-setup)
- [Running Locally](#running-locally)
- [Production Deployment](#production-deployment)
- [CI/CD Workflow](#cicd-workflow)
- [Environment Variables](#environment-variables)
- [Future Improvements](#future-improvements)

## Architecture
1. **Client** (`app/client`): React + Vite SPA that renders dashboards, upload flows, and Gmail integrations. Path aliases (`@` / `@shared`) point to the cleaned `app/client` and `app/shared` directories.
2. **Server** (`app/server`): Express API that handles OCR, insights, Gmail connectors, and OTP-based authentication. The server build is bundled via `vite.config.server.ts` to `dist/server` and served through a lightweight Node runtime.
3. **Infrastructure** (`infrastructure`): Terraform modules manage cloud resources (AKS, Key Vault, logging, PostgreSQL, etc.), Kubernetes manifests live under `infrastructure/kubernetes`, and Docker assets now live in `docker/`.
4. **Flow**: Developers push to GitHub → CI runs lint/build/tests → Docker builds and pushes to ACR → Azure Web App pulls the image using the published secrets and environment variables.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Express 5 + PostgreSQL + Zod for validation
- OCR & Insights: Custom heuristics + AI augmentation for receipts
- Deployment: Docker 20 + Azure Web App / GitHub Actions + Terraform for infra

## Folder Structure
```
project-root/
├── app/
│   ├── client/ (React SPA)
│   ├── server/ (Express API)
│   └── shared/ (shared DTOs + helpers)
├── infrastructure/
│   ├── kubernetes/ (prod manifests)
│   └── terraform/ (IaC modules + configs)
├── docker/ (Dockerfile, docker-compose)
├── ci-cd/ (pipeline documentation)
├── configs/ (.env example + config manuals)
├── docs/ (architecture & setup guides)
├── scripts/ (automation helpers + tooling)
├── .github/workflows/ (GitHub Actions CI/CD)
├── README.md
├── package.json, pnpm-lock.yaml
├── tsconfig.json, vite.config*.ts
└── .gitignore
```

## Local Setup
1. Install [pnpm](https://pnpm.io): `npm install -g pnpm`
2. Copy configuration template: `cp configs/.env.example .env` and fill in secrets.
3. Start PostgreSQL locally or point `DATABASE_URL` to a managed cluster.
4. Install dependencies: `pnpm install`.

## Running Locally
- `pnpm dev` – runs the combined Vite + Express dev server on port 8080.
- `pnpm build` – produces optimized `dist/spa` and `dist/server` bundles.
- `pnpm test` – executes Vitest suites.
- `pnpm typecheck` – TypeScript validation through the shared `tsconfig.json`.

## Production Deployment
1. Build the Docker image: `./scripts/build-docker.sh latest your.registry/finai3tier`.
2. Push to Azure Container Registry (ACR).
3. Provision managed PostgreSQL (Azure Database for PostgreSQL Flexible Server) and copy the SSL-enabled connection string.
4. Update the Web App configuration with secrets: `DATABASE_URL`, `RESEND_API_KEY`, `AUTH_FROM_EMAIL`, and OAuth keys.
5. Restart the Web App via `az webapp restart` or let GitHub Actions redeploy automatically.

## CI/CD Workflow
Located at `.github/workflows/ci-cd.yml`, the pipeline:
1. Installs dependencies with pnpm.
2. Runs `pnpm typecheck`, `pnpm test`, `pnpm build`.
3. Builds + pushes the Docker image with BuildKit.
4. Deploys the container to Azure Web App when `main` is updated.
Refer to `ci-cd/README.md` for context and required secrets.

## Environment Variables
Please populate these in your `.env` or cloud environment before running:
- `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`, `AUTH_FROM_EMAIL`
- `DATABASE_URL` (PostgreSQL with `sslmode=require`)
- Optional: `PING_MESSAGE`, `NODE_ENV`, `PORT`

## Future Improvements
- Introduce Helm charts for Kubernetes deployments.
- Add automated tests for OCR/confidence heuristics.
- Replace Resend fallback with a retry queue and monitoring dashboards.
- Introduce secrets rotation via Azure Key Vault + pipelines.
- Enhance AI insights via vector search + finance-specific models.
