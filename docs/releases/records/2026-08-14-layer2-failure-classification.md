# 2026-08-14-layer2-failure-classification — Layer 2 Dry-Run Failure Classification

## Release ID

`2026-08-14-layer2-failure-classification`

## Status

`candidate`

## Plain-English Summary

The tenant layer-refresh audit now writes a machine-readable action classification for Layer 2
dry-run failures. The new report separates failures that can be handled by code-only alias/reporting
work from failures that need source-data correction or explicit approval before semantic identity
mapping changes.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only inspection of active intake packet headers; no intake files are
  changed.
- Layer 2 Source Adapters: report-only classification of mapping-profile dry-run failures; no
  adapter alias is activated and no adapter transform is executed.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, or relationships are written.
- Layer 4 Products: no product projection or runtime behavior changes.

## Client Applicability

- All clients: audit tooling can emit the new classification artifact for any tenant packet.
- Specific clients: none.
- Internal only: intended for operator/backlog execution and PR evidence gathering.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-layer-refresh.mjs` now emits
  `layer2-dry-run-failure-classification.json`.
- `scripts/audit/__tests__/run-layer2-failure-classification-tests.mjs` validates the report-only
  classifier and no-write truth split.
- This release record documents the report-only scope and closed activation gates.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-layer2-failure-classification-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out <tmp>/layer-reconciliation --no-package`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a pull request when approved. The new artifact appears the next time the audit script
runs. There is no data-plane load, registry activation, runtime routing change, or product deploy
required for the report-only behavior.

## Deployment Authority

- Repo-owned deploy workflow: not required for local audit artifact generation.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product runtime behavior changes.

## Rollback Plan

Revert the pull request to stop emitting `layer2-dry-run-failure-classification.json`. Existing dry
run failure reports remain available and unchanged.

## Audit Evidence

- Focused test output for the classifier test.
- Full audit dry-run output directory containing `layer2-dry-run-failure-classification.json`.
- `npm run release:check` after the release record is complete.

## Known Gaps

The classifier does not activate aliases, mutate source data, or declare semantic identity mappings.
Those actions remain separate hard-gated follow-up work.
