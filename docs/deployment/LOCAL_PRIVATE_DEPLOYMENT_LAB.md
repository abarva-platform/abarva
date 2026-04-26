# Local Private Deployment Lab (CLOUD4)

> LAB ONLY - NOT FOR PRODUCTION.
>
> This is a local, on-laptop docker-compose lab that simulates the
> *dependency surface* of an AbarVa private deployment. It is the
> first cloud slice that produces a runnable artifact (every prior
> CLOUD slice was contract-only).

## What this lab IS

- A local docker-compose stack that boots a Postgres data plane, a
  MinIO object-storage plane, and a model-gateway stub on a single
  private bridge network (`abarva-private-lab`).
- A way to validate that the AbarVa shell can talk to its private
  deployment dependencies via private hostnames (no public DNS, no
  internet egress required).
- A development convenience that mirrors, at the dependency level,
  the network shape of:
  - CLOUD2 - Azure VNet reference lab blueprint (private endpoints,
    private DNS, no public ingress).
  - CLOUD5 - Azure IaC starter (forward reference, not yet authored).
- A safe place to iterate on env-var shape, healthcheck wiring, and
  boot sequence before committing to Terraform / Bicep / `azd`.

## What this lab is NOT

- NOT production. The volumes are local; the secrets are placeholders;
  the model gateway is a busybox stub that serves no traffic.
- NOT a real cloud deployment. Nothing is provisioned in Azure, GCP,
  AWS, or on any tenant cloud account.
- NOT a real model gateway. The `model-gateway-stub` service exists
  only to hold the canonical hostname; it does NOT route to OpenAI,
  Anthropic, Azure OpenAI, Vertex AI, or any other provider, and it
  MUST NOT be configured with real provider keys.
- NOT a tenant isolation certification. Logical and physical isolation
  remain the responsibility of TEN1, TEN2, CLOUD1, CLOUD2, and the
  future CLOUD5 slice.
- NOT promoted in `production-readiness.json`. The
  `production_deployment` component status remains `blocked` and the
  `prod-deploy-verification` blocker is preserved verbatim.

## Prerequisites

- Docker (Engine 24+ recommended).
- Docker Compose v2 (`docker compose ...`, hyphenated form).
- ~2 GB free disk for postgres + minio volumes.
- (Optional) An AbarVa shell image tagged `abarva:local` for the
  `app` service. Until CLOUD3 lands a Dockerfile, the `app` service
  is documented as a placeholder and may fail to pull; the rest of
  the stack still boots.

## Boot

```bash
cp .env.private-lab.example .env.private-lab
docker compose -f docker-compose.private-lab.yml up -d
```

The `.env.private-lab` file is git-ignored locally (or should be).
The example file contains placeholder values only - replace ALL
values before any non-lab use.

## Health checks

Once the stack is up:

```bash
# Postgres - confirm the DB is reachable on the lab network.
docker compose -f docker-compose.private-lab.yml exec postgres \
  psql -U abarva_lab -d abarva_lab -c "select 1;"

# MinIO - admin liveness check (alternative: http://localhost:9001).
docker compose -f docker-compose.private-lab.yml exec minio \
  mc admin info local || true

# AbarVa app (only if abarva:local was built and is running).
curl -sf http://localhost:3000/api/health || true
```

Each healthcheck is best-effort. The lab is considered healthy when
`docker compose ps` reports `postgres` and `minio` as `healthy` and
`model-gateway-stub` as `running`.

## Tear down

```bash
docker compose -f docker-compose.private-lab.yml down -v
```

The `-v` flag wipes the lab volumes
(`abarva-private-lab-postgres-data` and `abarva-private-lab-minio-data`).
Always tear down with `-v` between iterations to avoid stale state.

## Forward references

- **CLOUD2 - Azure VNet reference lab blueprint** -
  documentation-only. Defines the Azure-side shape this lab simulates
  (private endpoints, private DNS zones, no public ingress).
- **CLOUD5 - Azure IaC starter** - forward reference; will translate
  the CLOUD2 blueprint and this lab's dependency shape into actual
  Terraform / Bicep / `azd` templates.

## Safety

- No real secrets are committed. The example env file is checked
  in; the actual `.env.private-lab` file should NEVER be committed.
- No real model provider keys are referenced. The `MODEL_GATEWAY_URL`
  resolves only on the lab's private bridge network.
- No production data is loaded. Migrations, seeds, and demo data are
  out of scope for CLOUD4.
- No external CI / Vercel polling is performed by this lab.
