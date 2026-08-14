# 2026-08-14-layer2-alias-impact — Layer 2 Code-Only Alias Impact Report

## Release ID

`2026-08-14-layer2-alias-impact`

## Status

`candidate`

## Plain-English Summary

The tenant layer-refresh audit now writes a report-only estimate of which Layer 2 dry-run failures
would clear if mechanically safe code-only aliases were activated later. This makes the next adapter
slice explicit without changing adapter behavior, tenant input files, or canonical outputs.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only inspection of active intake packet headers; no intake files are
  changed.
- Layer 2 Source Adapters: report-only alias impact analysis; aliases are not activated and adapter
  transforms are not executed.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, or relationships are written.
- Layer 4 Products: no product projection or runtime behavior changes.

## Client Applicability

- All clients: audit tooling can emit the alias impact artifact for any tenant packet.
- Specific clients: none.
- Internal only: intended for operator/backlog planning and PR evidence gathering.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-layer-refresh.mjs` now emits `layer2-code-only-alias-impact.json`.
- `scripts/audit/__tests__/run-layer2-code-only-alias-impact-tests.mjs` validates the report-only
  truth split and impact counts.
- This release record documents the closed activation gates.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-layer2-code-only-alias-impact-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out <tmp>/layer-reconciliation --no-package`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a pull request. The artifact appears the next time the audit script runs. There is no
data-plane load, registry activation, runtime routing change, or product behavior change.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session merge/deploy approval for merged code.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned ACA main deploy if merged.
- ACA runtime invariant: required after repo-owned deploy if merged.
- Worker image invariant: required after repo-owned deploy if merged.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product runtime behavior changes.

## Rollback Plan

Revert the pull request to stop emitting `layer2-code-only-alias-impact.json`. Existing dry-run and
classification reports remain available.

## Audit Evidence

- Focused test output for the alias impact test.
- Full audit dry-run output directory containing `layer2-code-only-alias-impact.json`.
- `npm run release:check` output.

## Known Gaps

The artifact does not activate aliases. Semantic identity aliases, tenant CSV mutation, registry
activation, and data-plane writes remain hard-gated follow-up work.
