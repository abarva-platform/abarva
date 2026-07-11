# 2026-07-11-source-adapter-dry-run-skeleton — Source Adapter Runtime Skeleton

## Release ID

`2026-07-11-source-adapter-dry-run-skeleton`

## Status

`candidate`

## Plain-English Summary

This release adds the first executable dry-run path from a Tenant Packet manifest and source files into canonical ingestion candidates. It lets operators validate source parsing, mapping coverage, quarantine findings, and a local proof bundle before any database write path exists.

## Layer Impact

- Release lane: `global-control-lane`.
- Tenant Packet: uses the PR2 manifest contract and minimal fixture as the dry-run input.
- Source Adapter Framework: adds a CSV dry-run adapter and built-in mapping profiles for the minimal packet.
- Canonical Ingestion Contract: emits `CanonicalIngestionRecord` candidates with evidence references, authority, lineage, sensitivity, data status, and quality status.
- Proof Bundle: writes local JSON/Markdown evidence for mapping coverage, quarantine results, canonical records, and summary status.

## Client Applicability

- All clients: applies as a shared platform contract and validation utility.
- Specific clients: none.
- Internal only: dry-run proof bundle generation for operators and release validation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts`
- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts`
- `src/lib/enterprise-data/dry-run/tenant-packet-dry-run.ts`
- `scripts/audit/run-tenant-packet-dry-run.ts`
- `fixtures/tenant-packets/minimal/sources/*.csv`
- `package.json` script `audit:tenant-packet-dry-run`
- architecture docs updated for the executable dry-run boundary

## QA / Validation

- Pass: `npm run audit:tenant-packet-contract`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for enterprise-data contracts, adapters, and dry-run files
- Pass: `npm run audit:tenant-packet-dry-run`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The ACA main deploy workflow may build and deploy the code as part of the shared app image, but this release does not activate a runtime data load, database write, migration, or module behavior change.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared ACA image update.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by ACA main deploy workflow after merge.
- ACA runtime invariant: required if deployed.
- Worker image invariant: required if deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is a non-runtime dry-run utility and docs/contracts change.

## Rollback Plan

Revert the PR. No production data or tenant state rollback is required because the dry-run path does not write to the database or promote candidate tenant versions.

## Audit Evidence

- PR URL
- GitHub checks
- dry-run proof bundle under `audit-artifacts/tenant-packet-dry-run/minimal`
- release check output
- TypeScript compile output

## Known Gaps

- No target writer plan yet.
- No DB persistence.
- No candidate tenant data version.
- No live DB proof.
- No module-consumption proof.
