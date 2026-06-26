# 2026-06-26-semantic2-l3-dossier-extraction-eligibility — Semantic2 L3 Extraction Repair and Surface Gate

## Release ID

`2026-06-26-semantic2-l3-dossier-extraction-eligibility`

## Status

`candidate`

## Plain-English Summary

This release fixes the L3 dossier extraction path so business facts are parsed from typed evidence instead of preserving source-reference placeholders. It also adds a strict surface-eligibility gate that blocks archived/global/unknown tenant scopes, JSON-shaped values, generic citation stubs, missing relationships, and internal implementation language before a persisted dossier can feed Home, Intelligence, or Tower.

## Layer Impact

- `global-control-lane`: Adds shared Semantic2 dossier validation, tenant-scope policy, report tooling, and selector guard code.
- `client-data-lane`: The build script can re-derive persisted Semantic2 L3 dossiers in Azure/Postgres when run by an approved operator job. No migration or purge is included.
- `internal-admin`: Adds the ACA data-build job operating rule and eligibility reporting script for operators.

## Client Applicability

- All clients: shared gate and report logic applies universally.
- Specific clients: runtime allowlist includes `apex-retail`, `first-capital`, `lakeshore-holdings`, `meridian-health`, and `skyharbor-air`.
- Internal only: report script and ACA job rule.
- Feature flag: none.

## Changes Included

- `scripts/semantic2/build-enriched-l3-dossiers.mjs`
- `scripts/semantic2/run-l3-dossier-surface-proof.mjs`
- `scripts/semantic2-dossier-eligibility-report.ts`
- `src/lib/semantic2/dossiers/*`
- `src/lib/semantic-dossiers/curated-dossier-store.ts`
- `docs/ops/aca-data-build-job-rule.md`
- `AGENTS.md`

## QA / Validation

- PASS: `npm run semantic2:l3-dossiers:self-test`
- PASS: `npx jest src/lib/semantic2/dossiers --runInBand`
- PASS: `npx eslint scripts/semantic2/build-enriched-l3-dossiers.mjs scripts/semantic2-dossier-eligibility-report.ts src/lib/semantic2/dossiers src/lib/semantic-dossiers/curated-dossier-store.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- PASS: `npm run release:check`

## Rollout Plan

Merge through PR to `main`. Build/deploy through Azure Container Apps only if live re-derivation proof is required. Run the L3 dossier build as an ACA Job or documented break-glass operator run. No Home, Intelligence, Source, Moves, Tower, or aVa surface is enabled by this release.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy only.
- Shared runtime mutators: none in code. Data re-derive must use ACA Job or documented break-glass.
- Approved image digest: TBD after ACA build if deployed.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required for ACA Job adoption.
- Feature/env flag update path: none.
- Live signed-in proof required: not for surface use, because no surface is enabled. Data-plane proof requires build/report artifacts.

## Rollback Plan

Rollback code through the prior ACA image or revert the PR. Existing persisted dossiers are versioned by prompt version and are not destructively deleted. If a re-derive run writes bad data, invalidate the new prompt version and restore reads to the prior approved version.

## Audit Evidence

- PR URL: TBD.
- Proof bundle: `semantic2-dossier-surface-eligibility-<timestamp>.zip` after validation.
- Report outputs: `eligibility-report.{html,json,csv}`.
- Before/after sample: `SAMPLE_BEFORE_AFTER.md`.

## Known Gaps

Live ACA Job execution and re-derived production sample proof are pending until this candidate passes local validation.
