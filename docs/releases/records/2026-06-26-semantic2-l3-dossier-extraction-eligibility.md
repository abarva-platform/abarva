# 2026-06-26-semantic2-l3-dossier-extraction-eligibility — Semantic2 L3 Extraction Repair and Surface Gate

## Release ID

`2026-06-26-semantic2-l3-dossier-extraction-eligibility`

## Status

`candidate`

## Plain-English Summary

This release fixes the L3 dossier extraction path so business facts are parsed from typed evidence instead of preserving source-reference placeholders. It also adds a strict surface-eligibility gate that blocks archived/global/unknown tenant scopes, JSON-shaped values, generic citation stubs, missing relationships, and internal implementation language before a persisted dossier can feed Home, Intelligence, or Tower. Older dossier generations are retired reversibly with `invalidated_at` when a clean active v2 replacement exists; no rows are hard-deleted.

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
- Reversible active-generation handling: eligibility reports evaluate only `semantic2-l3-enriched-buildtime-claude-v2`; all active non-current dossier prompt versions are marked invalidated, not deleted.
- Extended deterministic relationship extraction: adds source-backed typed edges for organization, application, vendor, AI governance, operations, risk, data, and budget dimensions where grouped L2 source fields support them.
- Dimension relevance scoring: prevents broad dimensions such as organization/leadership from being filled by adjacent but wrong source families, such as AI governance rows.
- Broader relationship derivation pool: derives relationship edges from a relevance-filtered source pool while keeping the displayed fact packet capped.
- Eligibility threshold normalization: accepts both machine-style and business-readable relationship labels where they represent the same source-backed edge.

## QA / Validation

- PASS: `npm run semantic2:l3-dossiers:self-test`
- PASS: `npx jest src/lib/semantic2/dossiers --runInBand`
- PASS: `npx eslint scripts/semantic2/build-enriched-l3-dossiers.mjs scripts/semantic2/run-l3-dossier-surface-proof.mjs scripts/semantic2-dossier-eligibility-report.ts src/lib/semantic2/dossiers src/lib/semantic-dossiers/curated-dossier-store.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- PASS: `npm run release:check`
- PASS: ACA Job proof `job-abarva-private-operator-eus-d4qn54x` generated active eligibility bundle `semantic2-dossier-active-eligibility-20260626T234851Z`.
- PASS: Lakeshore `organization_leadership` active dossier is `ready`, surface eligible, coverage `0.75`, confidence `0.86`, facts `240`, entities `80`, relationships `56`, usable citations `365`, blocker leaks `0`.
- PASS: Active eligibility evaluated only prompt version `semantic2-l3-enriched-buildtime-claude-v2`.
- PASS: Sample placeholder/internal scan returned no hits for source-reference placeholders, JSON field names, or internal table names.

## Rollout Plan

Merge through PR to `main`. Build/deploy through Azure Container Apps only if live re-derivation proof is required. Run the L3 dossier build as an ACA Job or documented break-glass operator run. No Home, Intelligence, Source, Moves, Tower, or aVa surface is enabled by this release.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy only.
- Shared runtime mutators: none in code. Data re-derive must use ACA Job or documented break-glass.
- Approved proof image digest: `sha256:53c20da23d261f4ab731e03c466f28453339e014bbe9cd5c73c53a42de972c7c`.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required for ACA Job adoption.
- Feature/env flag update path: none.
- Live signed-in proof required: not for surface use, because no surface is enabled. Data-plane proof requires build/report artifacts.

## Rollback Plan

Rollback code through the prior ACA image or revert the PR. Existing persisted dossiers are versioned by prompt version and are not destructively deleted. If a re-derive run writes bad data, invalidate the new prompt version and restore a previous generation by setting `invalidated_at = NULL` for the superseded prompt rows listed in `SUPERSEDE_RECORD.md`.

## Audit Evidence

- PR URL: TBD.
- Proof bundle: `/Users/anand/Downloads/semantic2-dossier-active-eligibility-20260626T234851Z.zip`.
- Report outputs: `ACTIVE_ELIGIBILITY_REPORT.{md,csv}`, `RELATIONSHIPS_BEFORE_AFTER.md`, `EDGE_PROVENANCE.md`, and `SUPERSEDE_RECORD.md`.
- Before/after sample: `SAMPLE_BEFORE_AFTER.md`.

## Known Gaps

No user-facing surface is enabled by this release. Several tenant/dimension dossiers remain partial or blocked until their source evidence is enriched; the release intentionally gates those from surfaces instead of forcing them ready.
