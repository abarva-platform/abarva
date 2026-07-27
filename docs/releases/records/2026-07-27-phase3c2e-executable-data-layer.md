# 2026-07-27-phase3c2e-executable-data-layer — Shared Knowledge Publication Framework

## Release ID

`2026-07-27-phase3c2e-executable-data-layer`

## Status

`candidate`

## Plain-English Summary

This release candidate turns the approved shared consumption contract into the first executable Azure/Postgres migration package. It creates the source, evidence, working, canonical Knowledge, metrics, governance, publication, consumption, audit, and operations structures that future private tenant data planes will use before any product reads client facts.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: no change.
- Source adapters: no runtime change; future adapters gain a target source registry and evidence model.
- Canonical model: adds the first executable schema for entities, facts, relationships, metrics, conflicts, gaps, and review decisions.
- Products: no runtime wiring. Home, Source, Tower, Moves, Intelligence/aVa, and Cube will later consume versioned `consumption.*` projections built from this framework.

## Client Applicability

- All clients: future private data planes can reuse this shared migration package after their own execution authority is approved.
- Specific clients: Airline Demo New and Healthcare Demo New are the first planned execution consumers, but this PR does not apply either tenant.
- Internal only: operator migration/package validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `clients/shared/21-phase3c2e-executable-data-layer/sql/001_shared_knowledge_publication_consumption.sql`
- `clients/shared/21-phase3c2e-executable-data-layer/cube/knowledge_consumption_model.yml`
- `clients/shared/21-phase3c2e-executable-data-layer/jobs/publication_projection_job_contract.json`
- `clients/shared/21-phase3c2e-executable-data-layer/validation/expected-contract.json`
- `scripts/knowledge/validate-phase3c2e-executable-data-layer.mjs`
- `package.json` validation script

## QA / Validation

- Pass: `npm run test:phase3c2e-data-layer`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge as a shared migration/package candidate only. No Azure apply, no database migration, no source landing, no parser run, no publication activation, no Cube deployment, no Home/API wiring, and no ACA runtime deploy are included.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this contract-only candidate.

## Rollback Plan

Before any tenant applies the SQL, rollback is reverting this PR. After a tenant-specific apply in a later approved execution PR, rollback must use that tenant's migration rollback and baseline-activation controls; this release does not perform that apply.

## Audit Evidence

- Static SQL/Cube/job validator output.
- Release check output.
- PR review and CI once opened.

## Known Gaps

- This package does not yet apply the migration to Airline or Healthcare.
- This package does not repair or freeze the blocked Airline source corpus.
- This package does not create Azure resources or run what-if.
- This package does not deploy Cube or wire product APIs.
