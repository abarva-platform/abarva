# 2026-05-25-p19-meridian-data-pack-scaffold — Meridian Synthetic Substrate Scaffold

## Release ID

`2026-05-25-p19-meridian-data-pack-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds the static Meridian Health synthetic substrate pack used to give Sentinel
and the stress-test harness a healthcare-specific data foundation comparable to
the Apex Retail pack. This is file-backed scaffold data only: no database
migration, no Azure Postgres ingestion, no runtime deploy activation, and no
LLM calls are introduced by this change.

## Layer Impact

- `client-data-lane`: adds Meridian Health application, integration,
  initiative, vendor, org, regulatory, DORA, AI-tool, and contract fixture
  files under the synthetic data-pack root.
- `corpus-knowledge-lane`: adds 48 Meridian source files and 320 corpus chunks
  for future enterprise-context ingestion.
- `agent-quality-lane`: adds 14 expected Meridian Sentinel questions and
  cross-tenant forbidden-term checks to guard healthcare retrieval quality.
- `ops-release-lane`: adds the deterministic generator, verifier, package
  script, and release record; also updates the Packet 19 Meridian prompt to
  name Azure Postgres / runtime Postgres instead of stale provider wording.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: Meridian Health receives the new synthetic substrate files.
- Internal only: generator, verifier, and data-pack authoring scaffold.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Commit: `7f15da821` / current PR branch commit for the Meridian scaffold.
- Dataset root: `datasets/meridian-health-synthetic-v1/`
- Generator: `scripts/seed/generate-meridian-data-pack.mjs`
- Verifier: `scripts/verify/meridian-data-pack-scaffold.mjs`
- Package script: `npm run verify:meridian-data-pack`
- Packet prompt: `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md`

## QA / Validation

- pass: `node scripts/seed/generate-meridian-data-pack.mjs`
- pass: `npm run verify:meridian-data-pack`
- pass: `npx eslint scripts/seed/generate-meridian-data-pack.mjs scripts/verify/meridian-data-pack-scaffold.mjs`
- pass: `node --check scripts/seed/generate-meridian-data-pack.mjs`
- pass: `node --check scripts/verify/meridian-data-pack-scaffold.mjs`
- pass: `git diff --check`
- pass: stale provider-name scan across Meridian packet, release record,
  generator, verifier, and generated dataset returned zero matches.

## Rollout Plan

Merge to main after CI. No Vercel production deploy, Azure control-lane deploy,
or database migration is required for Phase A. Phase B ingestion into Azure
Postgres / runtime Postgres is a separate follow-up and must run through an
explicit ingestion runbook.

## Rollback Plan

Revert the PR. Because this change is static scaffold data plus verification
scripts only, rollback has no database or runtime state to unwind.

## Audit Evidence

- PR: pending at authoring time.
- Local verification output from `npm run verify:meridian-data-pack` reports:
  140 applications, 380 integration edges, 28 active initiatives, 14 closed
  initiatives, 16 teams, 1,650 roles, 50 vendor contracts, 14 infrastructure
  contracts, 84 DORA rows, 18 AI tools, 48 source files, 320 corpus chunks,
  32 contract PDFs, 12 charter PDFs, 14 Sentinel questions, and $172M run-cost
  rollup.

## Known Gaps

- Phase B ingestion into Azure Postgres / runtime Postgres is not included.
- Embedding enqueue for the 320 corpus chunks is not included.
- The post-ingestion Meridian full-module stress rerun is not included.
