# 2026-07-17-meridian-v3-derived-claude-layer — Meridian V3 Derived And Approved Content Layer

## Release ID

`2026-07-17-meridian-v3-derived-claude-layer`

## Status

`candidate`

## Plain-English Summary

This release candidate builds Meridian Health's V3 source packet into governed, source-traceable derived artifacts for Home and Tower. It also generates approved Claude-authored Home and Tower story blocks and visual framing from those deterministic views. The artifacts are committed as files only; they are not loaded into Azure/Postgres, promoted into Active Tenant Access, deployed to the product, or wired to runtime UI.

## Layer Impact

- `client-data-lane`: Adds Meridian-only derived artifacts under `datasets/tenant-inputs/meridian-health/derived/` and approved content under `datasets/tenant-inputs/meridian-health/approved-content/`.
- `governance/context-corpus`: Derived facts carry source lineage, evidence IDs, tenant key, source truth role, and a `GovernedObject`-compatible envelope.
- `internal-admin`: Adds repeatable generation and audit scripts for the Meridian artifact build. No Admin runtime behavior changes.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health source artifact lane only.
- Internal only: Yes, until a later approved load/promotion/runtime PR consumes these artifacts.
- Public/demo only: No direct product surface change in this release.
- Feature flag: None.

## Changes Included

- `scripts/tenant-v3/build-meridian-v3-derived-layer.mjs`
- `scripts/tenant-v3/generate-meridian-approved-claude-content.mjs`
- `scripts/tenant-v3/audit-meridian-v3-derived-layer.mjs`
- `datasets/tenant-inputs/meridian-health/derived/**`
- `datasets/tenant-inputs/meridian-health/approved-content/**`
- `reports/meridian-v3-derived-and-claude-layer/**`
- Package scripts for generation and scoped audits.

## QA / Validation

- Pass: `npm run generate:meridian-v3-derived-layer`
- Pass: `npm run generate:meridian-v3-approved-claude-content` using local Anthropic egress configuration.
- Pass: `npm run audit:meridian-v3-derived-layer-build`
- Pass: `npm run audit:meridian-home-context-view`
- Pass: `npm run audit:meridian-tower-dashboard-view`
- Pass: `npm run audit:meridian-sa08-benefits-posture`
- Pass: `npm run audit:meridian-approved-claude-content`
- Pass: `npm run audit:meridian-candidate-ai-portfolio-boundary`
- Pass: `npm run audit:meridian-v3-reload-readiness`
- Pass: `npm run audit:tenant-v3-data -- --tenant meridian-health`
- Pass: `npm run audit:meridian-executive-interviews`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

No runtime rollout. This is an artifact-generation release candidate. A later, separate PR must explicitly load, promote, or wire these artifacts into Azure/Postgres, Active Tenant Access, Home, Tower, or any other module.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this artifact-only candidate. Required for any later runtime wiring.

## Rollback Plan

Revert the PR to remove the generated artifacts, reports, package scripts, and generator/audit scripts. No database rollback, Azure rollback, feature flag rollback, or ACA traffic rollback is required because this release does not mutate runtime state.

## Audit Evidence

- `reports/meridian-v3-derived-and-claude-layer/summary.md`
- `reports/meridian-v3-derived-and-claude-layer/proof.html`
- `reports/meridian-v3-derived-and-claude-layer/audit-all.json`
- `reports/meridian-v3-derived-and-claude-layer/home-claude-prompt.json`
- `reports/meridian-v3-derived-and-claude-layer/tower-claude-prompt.json`
- `reports/meridian-v3-derived-and-claude-layer/home-claude-raw-response.json`
- `reports/meridian-v3-derived-and-claude-layer/tower-claude-raw-response.json`

## Known Gaps

- These artifacts are not loaded into Azure/Postgres.
- These artifacts do not update Active Tenant Access.
- These artifacts do not promote candidate data.
- These artifacts do not modify Home, Tower, Intelligence, Moves, Source, Admin, or any runtime route.
