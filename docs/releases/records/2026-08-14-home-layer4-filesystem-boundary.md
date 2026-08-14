# 2026-08-14-home-layer4-filesystem-boundary — Home Layer 4 filesystem boundary

## Release ID

`2026-08-14-home-layer4-filesystem-boundary`

## Status

`candidate`

## Plain-English Summary

The mounted Home runtime boundary is tightened so the current Home canvas does not depend on a
derived relationship graph file under tenant-input filesystem artifacts. The unused derived-graph
reader is retired, and a focused boundary test now blocks direct `datasets/tenant-inputs` and
`derived/relationship-graph.json` references from the mounted Home canvas path.

No product routing change, data-plane write, tenant data mutation, registry activation, or runtime
deployment is included.

## Layer Impact

Release lane: `global-control-lane`. This is a Layer 4 product-boundary guard.

- **Layer 1:** unchanged; no tenant intake files are written.
- **Layer 2:** unchanged.
- **Layer 3:** unchanged.
- **Layer 4:** removes an unused Home helper that read derived filesystem graph artifacts and adds a
  mounted-runtime boundary test.

## Client Applicability

- All clients: yes, after merge.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/read-derived-relationship-graph.ts` — removed unused filesystem reader.
- `src/lib/home/__tests__/read-derived-relationship-graph.test.ts` — removed obsolete filesystem
  reader test.
- `src/lib/home/derive-relationship-edges.ts` — updates the pure-helper boundary note after reader
  removal.
- `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts` — adds a focused guard for
  the mounted Home canvas files.

## QA / Validation

| Check                      | Command                                                                                                                        | Result                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------- |
| Home Layer 4 boundary test | `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts' --runInBand`                | pass — 1 test                                       |
| Home boundary lint         | `npx eslint 'src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts' src/lib/home/derive-relationship-edges.ts` | pass                                                |
| Reference check            | `rg -n "readDerivedRelationshipGraphEdges                                                                                      | read-derived-relationship-graph" src tests scripts` | pass — only the new boundary test references the retired path |

## Rollout Plan

Merge to `main`. No runtime deploy is part of this release record; deployment requires a separate
explicit approval gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes before claiming the change live.

## Rollback Plan

Revert the squash commit. The retired filesystem helper and its old test would return with no data
rollback because no tenant or runtime state is mutated.

## Audit Evidence

- Boundary test:
  `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts`.
- Retired reader path: `src/lib/home/read-derived-relationship-graph.ts`.

## Known Gaps

- Other legacy Home library helpers that are not mounted by the current `/home` route still need a
  broader read-path audit before any future Home surface adopts them.
- Existing `home-admin-boundary-contract.test.ts` has an unrelated pre-existing tab-expectation
  failure and is not used as validation evidence for this slice.
