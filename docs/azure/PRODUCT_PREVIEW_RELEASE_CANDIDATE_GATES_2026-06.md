# Product Preview Release Candidate Gates

## Purpose

This packet defines ENV-10: the release-candidate gates for AbarVa Product Preview. It is the control that keeps speed in Product Dev while forcing evidence before anything is considered ready for Product Prod.

It is intentionally non-mutating. Do not deploy, run migrations, shift traffic, load data, accept health-check gaps, or promote to Product Prod from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.json`.

Verifier: `npm run azure:product-preview-rc-gates:verify`.

## What Counts As A Release Candidate

A Product Preview release candidate must have:

- PR number
- merge commit SHA
- release record path
- image tag
- pinned image digest
- source branch
- target environment
- feature flags
- migration set
- rollback target

The promotion unit is the pinned image digest. The runtime is Azure Container Apps. Vercel production runtime is not allowed. Supabase runtime is not allowed.

## Required CI Gates

The release candidate must pass:

- release check
- typecheck
- ESLint
- Gitleaks
- fresh Postgres migration replay
- production-readiness gate
- context corpus governance gate
- canonical tenant allowlist
- runtime Supabase import guard
- Vercel production runtime guard
- control-plane purity
- browser matrix smoke
- public axe accessibility
- Lighthouse budget
- Next bundle budget

## Required Preview Evidence

Product Preview evidence must include:

- Azure build log
- image digest
- ACA revision export
- traffic state before and after
- root curl headers
- health JSON
- proof that no Vercel runtime headers are present
- Azure Postgres health
- `direct_postgres=true`
- signed-in browser QA report
- accessibility smoke report
- context health check report
- retrieval and citation proof
- artifact download proof
- rollback command

## Data Readiness Gates

Allowed data:

- synthetic
- pilot-reference
- client-approved-redacted

Disallowed data:

- unapproved client-confidential data
- PHI
- PII
- raw client private documents

PHI is not accepted. PII is not accepted.

Do not call chunks-only data ready. Do not call facts-only data ready. Do not call indexed-only data ready. Context-bundle trace proof is the real bar.

Nothing may auto-promote to `agent_ready`.

## Promotion Decision Gates

A release candidate cannot promote beyond Product Preview until:

- all CI gates are green
- all preview evidence is present
- context health check passed or gaps are explicitly accepted
- signed-in browser QA passed
- rollback path is verified
- release operator approval is recorded
- product owner approval is recorded

## Approval Boundary

Explicit approval is required before:

- deploying a release candidate to Product Preview
- running database migrations against Product Preview
- shifting Product Preview traffic
- loading Preview data
- accepting context health-check gaps
- promoting a release candidate to Product Prod

## Command Templates

These are templates only. Do not run without approval.

```bash
az acr build \
  --registry "<ACR_NAME>" \
  --image "abarva/web:preview-rc-<merge_sha>" \
  .
```

```bash
az containerapp update \
  --resource-group "<PRODUCT_PREVIEW_RESOURCE_GROUP>" \
  --name "<PRODUCT_PREVIEW_CONTAINER_APP>" \
  --image "<ACR_LOGIN_SERVER>/abarva/web@sha256:<digest>"
```

```bash
curl -I "https://<PRODUCT_PREVIEW_HOST>/"
curl "https://<PRODUCT_PREVIEW_HOST>/api/health"
```

## Completion Bar

ENV-10 is scaffold-ready when this packet and verifier exist, pass CI, and are wired into the production-readiness gate.

ENV-10 is complete only after Product Preview exists and a real release candidate produces the full evidence bundle without skipped gates.
