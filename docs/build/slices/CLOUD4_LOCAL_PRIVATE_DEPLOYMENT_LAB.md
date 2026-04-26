# CLOUD4 - Local Private Deployment Lab

Slice ID: CLOUD4
Slice name: Local Private Deployment Lab
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane C (parallel build pack)
Depends on: CLOUD1, CLOUD2

## Purpose

CLOUD4 lands a **local-only** docker-compose lab that simulates the
*dependency surface* of an AbarVa private deployment on a developer
laptop. It is the first cloud slice that produces a runnable
artifact - every prior CLOUD slice (CLOUD1, CLOUD2) was contract-only.

The lab boots:

- a Postgres data plane (`postgres:16-alpine`),
- a MinIO S3-compatible object store
  (`minio/minio:latest`), and
- a busybox `model-gateway-stub` placeholder

on a single private bridge network (`abarva-private-lab`), plus a
documented `app` service placeholder pointing at the future CLOUD3
Dockerfile image (`abarva:local`).

CLOUD4 is **lab only** and explicitly **not for production**. It does
not deploy to any cloud, does not invoke any model provider, does
not carry real customer data, and does not promote any
production-readiness component.

## What Changed

- New compose file
  [docker-compose.private-lab.yml](../../../docker-compose.private-lab.yml)
  with services `app`, `postgres`, `minio`, and `model-gateway-stub`,
  healthchecks for postgres and minio (and a placeholder healthcheck
  for `app`), bind-mounted local volumes, and the `abarva-private-lab`
  bridge network.
- New env template
  [.env.private-lab.example](../../../.env.private-lab.example)
  carrying placeholder values only:
  `POSTGRES_USER=abarva_lab`, `POSTGRES_PASSWORD=lab_only_change_me`,
  `POSTGRES_DB=abarva_lab`, `MINIO_ROOT_USER=lab_only`,
  `MINIO_ROOT_PASSWORD=lab_only_change_me`,
  `DATABASE_URL=postgres://abarva_lab:lab_only_change_me@postgres:5432/abarva_lab`,
  `S3_ENDPOINT=http://minio:9000`,
  `MODEL_GATEWAY_URL=http://model-gateway-stub:8080`. Header comment
  flags the file as EXAMPLE ONLY and instructs operators to copy and
  replace before any non-lab use.
- New operator runbook
  [docs/deployment/LOCAL_PRIVATE_DEPLOYMENT_LAB.md](../../deployment/LOCAL_PRIVATE_DEPLOYMENT_LAB.md)
  covering what the lab is, what it is NOT, prerequisites, boot,
  health checks (`psql`, `mc admin`, app health endpoint), tear-down,
  and forward references to CLOUD2 (Azure VNet blueprint) and CLOUD5
  (Azure IaC starter, deferred).
- New verification script
  [scripts/verify-private-lab-config.sh](../../../scripts/verify-private-lab-config.sh)
  that asserts file existence, declared services
  (`app`, `postgres`, `minio`, `model-gateway-stub`), required env
  keys, no real-secret patterns (no `sk-`, no `ghp_`, no opaque
  >=40-char alnum tokens that mix letters and digits), and no real
  provider hostnames. Exits 0 on success and prints
  `[CLOUD4] private lab config OK`.
- New integration test
  [src/__tests__/integration/deployment/private-lab-config.test.ts](../../../src/__tests__/integration/deployment/private-lab-config.test.ts)
  that asserts the same shape contracts in TypeScript and runs under
  jest with no docker, no cloud, and no model dependencies.
- `docs/build/build-slices.json` appends a CLOUD4 entry with this
  slice's `allowedFiles`, `forbiddenFiles`, `validationCommands`,
  `dependsOn` (CLOUD1, CLOUD2), `status` `code_complete`, `risk`
  `low`, and `ownerAgent` Lane C; manifest top-level `lastUpdated`
  is bumped to `2026-04-26`.
- `docs/build/production-readiness.json` updates the
  `production_deployment` and `data_evidence_knowledge_fabric`
  components:
  - One UNIONed note row each recording that CLOUD4 lands a local
    private deployment lab (no cloud, no model calls, lab-only).
  - `nextAction` UNIONed conservatively; prior PROD1 / PROD2 / PROD3
    / PROD4 / OPS1 / OPS2 / TEN1 / TEN2 / CLOUD1 / CLOUD2 / TRUST1 /
    TRUST2 wording is preserved verbatim.
  - Component statuses are preserved (NOT promoted) because the lab
    is local-only and proves nothing about production cloud posture.
  - Manifest top-level `lastUpdated` bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- CLOUD4 does not deploy to Azure, GCP, AWS, or any cloud.
- CLOUD4 does not run real model providers. The `model-gateway-stub`
  service is a busybox container that serves no traffic and MUST NOT
  be configured with real provider keys.
- CLOUD4 does not author Terraform, Bicep, ARM, `azd`, or any IaC.
  That is deferred to CLOUD5.
- CLOUD4 does not run database migrations, seed scripts, or load
  any real customer data.
- CLOUD4 does not modify application code, routes, auth, the Model
  Gateway, the agent runtime, the evidence ledger, the audit ledger,
  supabase, package manifests, or platform-design docs.
- CLOUD4 does not promote `production_deployment` or any other
  readiness component.
- CLOUD4 does not push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick / merge.

## Why It Is Safe

- Lab-only and explicitly labeled in every artifact (compose header,
  env header, operator runbook, slice contract).
- All env values are placeholders. The verification script and the
  jest test both reject real-secret patterns.
- The model gateway is a busybox stub - no provider URL, no
  provider key, no outbound traffic. The verification rejects real
  provider hostnames in either the compose file or the env example.
- Volumes are local named volumes scoped to the lab network and are
  wiped by `docker compose down -v`.
- The manifest update is append-only at the note / nextAction level
  and does not change any component status, dimension, gate status,
  blocker list, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the same
  shape as prior CLOUD1 / CLOUD2 / OPS / TRUST slices.

## How To Re-Run

1. TypeScript check:
   `cd /Users/anand/Projects/nexus-enterprise-cloud4 && npx tsc --noEmit --pretty false`
2. Integration test:
   `cd /Users/anand/Projects/nexus-enterprise-cloud4 && npx jest src/__tests__/integration/deployment/private-lab-config.test.ts`
3. Config verifier:
   `cd /Users/anand/Projects/nexus-enterprise-cloud4 && bash scripts/verify-private-lab-config.sh`
4. Production build:
   `cd /Users/anand/Projects/nexus-enterprise-cloud4 && npm run build`
   (Next.js symlink panic is acceptable to mitigate; this slice
   does not modify any application code.)
5. Re-parse manifest JSON:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed:
  - `production_deployment` (notes append + nextAction UNION).
  - `data_evidence_knowledge_fabric` (notes append + nextAction UNION).
- Readiness / status changes: none. `production_deployment` stays
  `blocked`; `data_evidence_knowledge_fabric` stays `scaffolded`.
- Blockers added or removed: none.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior PROD / OPS / TEN / TRUST / CLOUD wording).
- Notes added: one row each on `production_deployment` and
  `data_evidence_knowledge_fabric` recording the CLOUD4 local lab
  landing and that the cloud-side lab build itself remains deferred.
