# 2026-10-12-home-shadow-readback-version-boundary - Bind shadow readback to a target version

## Release ID

`2026-10-12-home-shadow-readback-version-boundary`

## Status

`candidate`

Release lane: `global-control-lane`.

## Plain-English Summary

A readback explicitly names the Home projection version it checks. Older versions remain visible in the proof inventory and do not make an absent target version appear occupied. Shadow construction and promotion refuse unversioned or wrong-version proofs, in addition to existing tenant, assessment, source and content checks.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 is unchanged: no schema, canonical objects, source records, readiness records or relationships are modified by this code release.
- Layer 4 operator readback and proof-consuming release gates change. The readback remains a repeatable-read, read-only transaction; occupancy is scoped to the declared target version.
- No model call, narrative generation, publication, selector activation or product rendering change is introduced.

## Client Applicability

- All clients: shared, explicitly scoped operator code.
- Specific clients: none selected or activated.
- Internal only: readback and release-gate behavior.
- Public/demo only: no new route or dataset.
- Feature flag: none changed.
- Old unversioned proofs are refused rather than silently reinterpreted.

## Changes Included

- Readback requires `ECL_SYNTHETIC_READBACK_HOME_PROJECTION_VERSION` (`1` or `2`) before generation or database access.
- The proof records `home_projection_version` and the complete existing Home manifest inventory from the same read-only snapshot.
- Shadow and promotion gates require their exact target version; existing source/content and occupancy refusals remain.
- Existing behavior and disposable Postgres tests cover wrong/unversioned proofs, older-version coexistence, unchanged canonical/source content and recovery/replay.
- No package, census, source-adapter, schema or tenant-input changes.

## QA / Validation

- Readback and Home operator gate behavior: 21 passed, zero failed; the new refusal cases first failed on the old implementation.
- Disposable Postgres pre-projection readback: 14 passed, zero failed, including older-version coexistence and full source/canonical comparison.
- Disposable Postgres initial shadow construction, prior-manifest/canonical preservation, recovery and replay: passed.
- Post-projection readback: two applicable cases passed; 12 pre-projection-only cases skipped by phase.
- Full TypeScript check: passed.
- Final lint, census, release and exact-head CI evidence are recorded with the reviewed candidate; local tests are not native product acceptance.
- No live tenant, private operator, readiness/index/citation, model or serving action was performed.

## Rollout Plan

Review the exact code candidate and applicable QA. Merge through protected main only after current-head CI and current-main applicability pass. Deploy solely through `.github/workflows/aca-main-deploy.yml`. Future operator runs must explicitly bind their target version and obtain their own exact execution review; this release grants no data or serving authority.

## Deployment Authority

- Repo-owned ACA main workflow only; no ad-hoc web template or traffic update.
- Main workflow resolves a digest-pinned image with Premium ACR and Buildx GitHub Actions cache requirements intact.
- Independently prove template, healthy 100%-traffic revision, required worker images and health against the approved digest.
- Existing stored-record serving remains unchanged. Signed-in acceptance is required after any separately approved future serving change.

## Rollback Plan

Revert this code through a protected PR and redeploy via the ACA main workflow. Do not delete prior manifests or canonical data to satisfy a zero-count gate. Any later native data operation requires its own scoped rollback evidence.

## Audit Evidence

Exact PR source, behavior tests, disposable Postgres preservation/readback results, current-head CI, release gates and subsequent ACA runtime proof. Existing versions are inventoried rather than removed; counts refer to the explicitly declared target version.

## Known Gaps

Fresh native source/catalog preflight, version-2 shadow execution, earned index/cite-render/readiness evidence, matching narrative, publication and serving activation remain separate governed work. This code is a prerequisite, not proof of refreshed Home content.
