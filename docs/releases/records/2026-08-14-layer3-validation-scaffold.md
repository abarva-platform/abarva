# 2026-08-14-layer3-validation-scaffold — Layer 3 validation registry scaffold

## Release ID

`2026-08-14-layer3-validation-scaffold`

## Status

`candidate`

## Plain-English Summary

Layer 3 now has a typed validation scaffold for canonical object definitions, deterministic fact
authority, and the approved relationship type dictionary. The layer-refresh report emits a
machine-readable scaffold summary so future canonical builds and graph reconciliation jobs can prove
which concepts are governed before anything is written.

No canonical store write, graph materialization, data-plane load, retrieval indexing, or product
runtime change is included.

## Layer Impact

Release lane: `client-data-lane`. This is a Layer 3 validation-contract scaffold with offline proof.

- **Layer 1:** unchanged; active intake files are read only by the existing report.
- **Layer 2:** unchanged except that active v3 mapping profiles are checked against the Layer 3
  scaffold.
- **Layer 3:** adds object-registry, fact-authority, and relationship-dictionary definitions used
  for validation.
- **Layer 4:** unchanged; no product surface or read model consumes the scaffold in this release.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/contracts/layer3-validation.ts` — introduces the Layer 3 validation
  scaffold and deterministic gap-report helper.
- `src/lib/enterprise-data/contracts/__tests__/layer3-validation.test.ts` — verifies object
  registry coverage, deterministic fact authority coverage, and approved relationship vocabulary.
- `scripts/audit/tenant-layer-refresh.mjs` — writes `layer3-validation-scaffold.json` into the
  report-only proof bundle.
- `reports/layer-reconciliation-2026-08/` — refreshed proof bundle including the Layer 3 scaffold
  summary.

## QA / Validation

| Check                  | Command                                                                                                                                                                          | Result                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Layer 3 scaffold tests | `npx jest src/lib/enterprise-data/contracts/__tests__/layer3-validation.test.ts --runInBand`                                                                                     | pass — 4 tests                                                                                                      |
| Layer 3 scaffold smoke | `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/layer-reconciliation-2026-08 --no-package`                                                                  | pass — scaffold reports 19 object definitions, 11 fact authorities, 17 relationship entries, and zero scaffold gaps |
| Scaffold lint          | `npx eslint scripts/audit/tenant-layer-refresh.mjs src/lib/enterprise-data/contracts/layer3-validation.ts src/lib/enterprise-data/contracts/__tests__/layer3-validation.test.ts` | pass                                                                                                                |

## Rollout Plan

Merge to `main`. No runtime rollout. The scaffold is available for local validation and future
approved data-build jobs only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. Future Layer 3 and graph jobs would lose the scaffold and return to their
previous validation gap state.

## Audit Evidence

- Layer 3 scaffold proof: `reports/layer-reconciliation-2026-08/layer3-validation-scaffold.json`.
- Layer 2 dry-run failures:
  `reports/layer-reconciliation-2026-08/layer2-adapter-dry-run-failures.json`.
- Layer 3 per-tenant readiness summaries:
  `reports/layer-reconciliation-2026-08/<tenant>/layer3-canonical-refresh-summary.json`.

## Known Gaps

- The scaffold does not write canonical objects, normalize relationship rows, or materialize graph
  nodes/edges.
- Relationship row quarantine and graph reconciliation remain separate follow-on slices.
