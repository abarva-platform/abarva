# 2026-07-24-home-knowledge-v4-canary-scope-validation — scope dimension validation to the requested run

## Release ID

`2026-07-24-home-knowledge-v4-canary-scope-validation`

## Status

`candidate`

## Plain-English Summary

Fixes a validator bug that the first live canary run exposed: `validateDimensionTabs` checked
the candidate against the full 38-dimension catalog with no awareness that `--dimensions`
deliberately restricts a run to a subset. A 3-dimension canary on skyharbor-air reported 43
findings; 35 of them were `missing_expanded_dimension` for the 35 dimensions the canary never
asked for.

Fix: the candidate now records `requested_dimensions` when `--dimensions` is set, and
`validateDimensionTabs` checks against that list instead of the full catalog when present. An
unscoped (full-tenant) run is unaffected — `requested_dimensions` is `null` and the full-catalog
check still applies.

Verified against the real canary candidate: patching `requested_dimensions` onto the stored
artifact and replaying dropped the finding count **43 → 8**, isolating exactly the two real
findings this canary was run to surface (see the companion live-canary release record).

## Layer Impact

- `global-control-lane`: validator scoping in one operator script. No schema, no runtime path.

## Client Applicability

- Internal only: operator/QA tooling for the Home V4 candidate pipeline.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - `assembled.requested_dimensions` recorded at generation time when `--dimensions` is set.
  - `validateDimensionTabs` checks against `requested_dimensions` when present, else the full
    `expandedDimensionCatalog`.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — Retroactive proof against the real skyharbor-air canary candidate (2026-07-24T01:49Z
  run): patching `requested_dimensions` onto the stored artifact and replaying drops findings
  from 43 to 8 — the exact 35-finding gap this bug produced.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. Applies automatically to the next canary or
full run — no operator action required beyond the normal `--dimensions` usage.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. A scoped run reverts to reporting 35 false findings, which is safe (over-strict,
not under-strict) but noisy.

## Audit Evidence

- Live canary execution `job-abarva-private-operator-eus-uyqx3o4` (2026-07-24T01:38–01:49Z),
  proof bundle retrieved and replayed.

## Known Gaps

- Only `validateDimensionTabs` was scoped. If other validators later assume full-catalog
  coverage, apply the same `requested_dimensions` check there.
