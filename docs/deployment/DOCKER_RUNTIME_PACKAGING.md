# Docker Runtime Packaging — CLOUD3

Status: code_complete · 2026-04-26
Owner: Lane B (parallel build pack · CLOUD3)
Depends on: CLOUD1 (deployment topology contract)
Forward-references: CLOUD2 (Azure VNet lab), future Cloud Run / ECS / AKS
slices that consume this image.

This runbook documents the AbarVa Dockerfile, its build/run flow, and the
boundaries of what this slice proves. CLOUD3 is **packaging-only** — it
adds no application code, performs no deployment, and pushes no image.

---

## 1 · Why this exists

AbarVa today runs on Vercel. The CLOUD1 strategy contract calls out
Tier 2+ enterprise tiers where the AbarVa shell must run in a customer
cloud (Azure Container Apps, Cloud Run, ECS, AKS, etc.) without any
Vercel-runtime dependency. CLOUD3 proves that **a non-Vercel runtime
path exists**: a clean `node:24-bookworm-slim` base, multi-stage build,
non-root user, no baked secrets, and a documented env-var contract.

This is the smallest credible step toward CLOUD2's Azure VNet lab and
the future GCP VPC lab — both of which need an OCI image to deploy.

---

## 2 · Architecture

The Dockerfile is multi-stage:

| Stage     | Base                       | Purpose                                              |
| --------- | -------------------------- | ---------------------------------------------------- |
| `deps`    | `node:24-bookworm-slim`    | Install npm dependencies (`npm ci`).                 |
| `build`   | `node:24-bookworm-slim`    | Run `npm run build` → produce `.next` artifacts.     |
| `runtime` | `node:24-bookworm-slim`    | Copy build artifacts, drop to non-root `node` user, run `npm run start`. |

Key properties:

- **Non-root runtime.** The runtime stage drops to the built-in `node`
  user via `USER node`. Operators can override with `--user 1001:1001`
  at run time if a stricter uid:gid is required.
- **No secrets baked.** The image contains source, build artifacts, and
  `node_modules` — never `.env*` or any token. `.env*` is in
  `.dockerignore`; the build context excludes secrets entirely.
- **`NEXT_PUBLIC_*` not embedded by default.** If the orchestrator
  needs them inlined into the static bundle, pass them via
  `--build-arg` and a small Dockerfile patch; default behavior is to
  read them at runtime.
- **Standalone-ready.** If `next.config.ts` later sets
  `output: 'standalone'`, the operator can swap the entry to
  `node .next/standalone/server.js` without rebuilding the Dockerfile.

---

## 3 · Required runtime environment variables

These are documented in the Dockerfile header and **must be supplied at
`docker run` time** (e.g. via `--env-file`, Key Vault / Secret Manager
mount, or platform-managed env). The placeholders below are names only;
no real values are committed.

### Database

- `DATABASE_URL` — Postgres connection string (server-only).
- `DIRECT_URL` — optional; bypass pooler for migrations.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` — public project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only.

### Auth (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY` — server-only.

### Model providers (server-only; routed via Model Gateway in V1+)

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (optional)
- `PINECONE_API_KEY` (optional)
- `PINECONE_INDEX` (optional; default `nexus-knowledge`)

### Runtime

- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0` — bind all interfaces inside the container so the
  orchestrator's port mapping works.

> Production deployments must source server-only secrets from a vault
> (Azure Key Vault, GCP Secret Manager, AWS Secrets Manager) and inject
> them as env at start. Never bake them into the image, never commit
> them to the repo, and never log them.

---

## 4 · Build & run

### Build

```bash
docker build -t abarva:local .
```

The build context is filtered by `.dockerignore` so `node_modules`,
`.next`, `.env*`, `.git`, `reports/`, `.claude/`, `tests/`, `e2e/`, and
similar are excluded. `src/`, `public/`, `package.json`,
`package-lock.json`, and `next.config.ts` are included so `next build`
can run.

### Run (local smoke; no real secrets)

```bash
cp .env.example .env.local                                # populate placeholders
docker run --rm -p 3000:3000 --env-file .env.example abarva:local
```

Then open http://localhost:3000. If `.env.example` is missing the
required keys, the app will log auth/db errors at startup — that is
expected for a smoke test without real credentials.

### Verify (CI-friendly)

```bash
bash scripts/verify-docker-build.sh
```

The script:

1. Checks `command -v docker`. If Docker is missing, prints the
   neutral skip message and **exits 0** so CI lanes without a daemon
   stay green.
2. If Docker is present, prints the canonical build/run command shapes
   and runs `docker build --check` (BuildKit Dockerfile linter) when
   supported. Exits 0 in both branches.

---

## 5 · What this proves

- A non-Vercel runtime path **exists** for AbarVa.
- The image runs as a non-root user with documented env contract.
- The build context excludes secrets and irrelevant tooling.
- The `node:24-bookworm-slim` base aligns with the current LTS line.
- `npm run build` succeeds inside the image (Next.js standalone output
  optional but supported).

---

## 6 · What this does NOT prove

- **No production deployment.** No registry push, no Container Apps /
  Cloud Run / ECS rollout, no DNS, no TLS termination, no observability.
- **No scaling, DR, or HA validation.** Single-replica, single-region,
  best-effort.
- **No tenant isolation certification at the network layer.** That is
  CLOUD2 (Azure VNet lab) and the future GCP VPC lab.
- **No live model gateway claim.** Model providers are documented at
  the env-var level; live routing remains contract-only via MG2 / MG3.
- **No compliance certification** (SOC 2, ISO, HIPAA, FedRAMP).
- **No image-scanning gate.** Operators must wire Trivy / Grype / Snyk
  into a CI step before any production promotion.
- **No SBOM emission.** Future slice should add `--sbom=true` and
  `--provenance=true` to the build invocation.

---

## 7 · CI integration (deferred)

Future work, **not in this slice**:

- Add a GitHub Actions job that runs `bash scripts/verify-docker-build.sh`
  on every PR. If the runner has Docker, it runs the lint; otherwise it
  exits 0 with the neutral skip message.
- Add a release-time job that builds the image with provenance + SBOM,
  pushes to Azure Container Registry / Artifact Registry, and tags by
  commit SHA. Push happens **only** on a release branch and **only**
  after explicit founder approval per AGENT_DISPATCH_OPERATING_MODEL §G.
- Wire image-scanning (Trivy or equivalent) and fail the release on
  any critical CVE in the runtime layer.
- Emit a build attestation that ties commit SHA → image digest →
  deployment manifest, ingested by PROD4 once that slice lands.

None of the above changes the `production_deployment` status. CLOUD3
preserves `blocked` per AGENT_DISPATCH_OPERATING_MODEL §G / §H.

---

## 8 · Cross-references

- `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md` — four-tier
  deployment strategy contract (control plane vs data plane, dependency
  replacement matrix).
- `docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md` — Azure VNet
  reference lab blueprint that consumes this image.
- `docs/build/AGENT_DISPATCH_OPERATING_MODEL.md` §G / §H — no-false-
  promotion policy and tracker-update conservative-conflict rules.
- `docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md` — manifest
  mutation discipline; CLOUD3 follows the UNION / preserve-prior-wording
  rule for `production_deployment.notes` and `nextAction`.
