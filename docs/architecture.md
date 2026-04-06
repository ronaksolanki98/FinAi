# Architecture Overview

## Key Layers
1. **Application Layer** (`app/`): Houses the React SPA (`app/client`) and the Express API (`app/server`). Shared DTOs, helpers, and Zod schemas live under `app/shared` so both sides use the same contracts.
2. **Infrastructure Layer** (`infrastructure/`): Terraform defines Azure resources such as AKS, Key Vault, logging, and PostgreSQL. Kubernetes manifests under `infrastructure/kubernetes` describe deployments, services, and configmaps for production-scale deployments.
3. **DevOps Layer** (`docker/`, `.github/workflows/`, `scripts/`, `ci-cd/`): Dockerfile + compose for reproducible images, GitHub Actions pipelines for lint/build/docker push/deploy, helper scripts that standardize build/push operations.

## Runtime Flow
```text
Developer → GitHub → CI/CD (lint/typecheck/build + docker build/push) → ACR → Azure Web App/Kubernetes
```
1. Developers commit to `main` → GitHub Actions runs tests/builds, then builds the Docker image and pushes to ACR.
2. The production Web App (or Kubernetes cluster) pulls the image, attaches environment variables/secrets, and runs the Node server which serves the frontend from `dist/spa` and attaches API routes via Express.
3. PostgreSQL (managed by Azure) stores users, OTPs, and transactions produced by manual entries or OCR uploads.
4. Resend (email) + Gmail connectivity are protected via environment secrets, and insights are generated via server heuristics + optional AI layer.

## Security / Production Readiness
- Secrets live in Azure Key Vault or GitHub Secrets; `.env.example` documents required keys without leaking values.
- Docker image uses a multi-stage build to minimize runtime dependencies.
- Terraform and Kubernetes manifests emphasize modularity, portability, and idempotent structures.
- GitHub pipeline gates each stage (`lint` → `build` → `docker` → `deploy`) to fail fast when issues occur.
