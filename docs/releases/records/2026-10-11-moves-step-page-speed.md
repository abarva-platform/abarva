# 2026-10-11 — Moves step page response time

## Release ID

`2026-10-11-moves-step-page-speed`

## Status

`deployed`

## Plain-English Summary

Moves step pages waited for several independent server reads in sequence before showing the heading, next action, and step bar. The route now starts those reads together and shares the register result between the page and its charter bridge. Earlier-phase gate checks also start together when resolving the effective phase. Gate document sign-off comes from a server read so the gate's next action is final on first render. Other step pages leave gate document reads to the secondary cabinet panel. The signed-in walk records server read durations, document response time, client mount, and later API reads for each view.

## Layer Impact

- Release lane: `global-control-lane`, with the existing tenant step-page flags controlling the new hydration path.
- Layer 3: canonical Move records, evidence, gate results, and register rows retain their existing sources and tenant fence. This release changes when they are read and reuses one register result; it does not change their values.
- Layer 4: the Moves phase route assembles the same projection from parallel reads. Step pages receive timing instrumentation. No new intake, adapter, schema, or calculation path is introduced.

## Client Applicability

- All clients: no new surface or feature enrollment. Existing phase routes retain the same content and access checks.
- Specific clients: step-page timing and shared register hydration apply where the existing step-page and register flags are enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flags: existing `moves_step_pages_v3`, phase step-page flags, and `moves_assumption_register_v1`; no flag values change.

## Changes Included

- The phase route begins tenancy and step-record reads alongside the Move projection, then begins independent gate, evidence, artifact, and register reads together. It records server timings on flagged step views.
- Effective phase resolution evaluates independent earlier-phase gates concurrently and still returns to the earliest blocked or unreadable gate.
- The charter bridge accepts a previously read register result and makes the final rows available to the page, preserving an explicit unavailable state after a failed read.
- The P2 step page uses the server register projection when present. The gate page uses the server sign-off projection and shows an explicit unavailable state if document or sign-off reads fail. Non-gate pages continue the cabinet read after the head renders.
- Independent client panels share an in-flight cabinet request, with failures delivered to every reader. The walk stores per-view timing details and measures settled head after the heading, next action, and step bar are present.
- The Source layout smoke retries one transient Chromium screenshot-capture error before failing. Screenshot output and every layout assertion remain required.

## QA / Validation

- PASS: focused route, routing, bridge, host, shared evidence, and effective phase behavior suites; the added effective phase test proves concurrent gate starts.
- PASS: TypeScript typecheck.
- PASS: focused ESLint and Playwright test discovery.
- PASS: route reachability, library orphan, export reachability, test coverage census, tenancy fence census, and manual check.
- PASS: release check after adding the required release lane. It will be repeated on the final branch head.
- PASS: six temporary behavior mutations each made its focused test fail; all source files were restored. The performance ordering itself is verified by the post-deploy timing walk rather than a unit mutation.
- PASS: the Source stage layout smoke passes locally; complete CI on the final head remains required after the screenshot-capture retry.
- PASS: complete CI on final PR head `3f1865f8`: 38 successful checks and 6 skips.
- PASS: repo-owned ACA deployment 38192347770 and read-only runtime invariant on serving SHA `0b7cee8c4b58ec87b5a3582f577c9f2b95f41656`.
- FAIL: valid signed-in walk 38194353988 reaches and passes 20 of 29 views with UX 95 and no lower non-speed dimension, but only 7 views earn full speed points. The remaining 13 settle in 2,551–6,319 ms. Speed acceptance requires a follow-up.

The pre-change signed-in walk reported the following five slowest reachable views. A separate fresh browser sample measured document response waits on those same views; these are distinct observations and are not paired trials.

| View                 | Existing settled head | Fresh document response wait | After deploy |
| -------------------- | --------------------: | ---------------------------: | ------------ |
| P2 gate              |              9,134 ms |                     3,849 ms | 4,439 ms     |
| P2 validate          |              9,049 ms |                     5,653 ms | 6,319 ms     |
| P2 evidence plan     |              7,611 ms |                     8,244 ms | 4,919 ms     |
| P1 sponsor scope     |              7,427 ms |                     8,179 ms | 4,557 ms     |
| P3 root cause design |              7,412 ms |                     8,228 ms | 4,410 ms     |

## Rollout Plan

Merge by squash PR after current-head checks and the open Moves PR coverage-count collision scan. The repository-owned ACA main deploy workflow builds and promotes the merged SHA. Run the signed-in step walk after deployment and compare every reachable view with the previous proof; require settled head at or below 2.5 seconds and no lower non-speed UX dimension before calling this accepted.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: determined and checked by the main deploy workflow.
- ACA runtime invariant: verify web template, traffic revision, and required worker images match the approved digest after deployment.
- Worker image invariant: no worker image change intended.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the complete reachable step-page walk.

## Rollback Plan

Revert this PR on `main` and allow the repository-owned ACA main deploy workflow to promote the revert. Keep the preceding approved digest available for the documented rollback window.

## Audit Evidence

- Baseline signed-in walk: Actions run `38171682273`, embedded serving SHA `52a1b501073984c83d34986d394162700b185103`.
- PR: https://github.com/abarva-platform/abarva/pull/9414; squash commit `085b513af55f0ede43effa47ac91c791dd6f2e8d`.
- Deployment: https://github.com/abarva-platform/abarva/actions/runs/38192347770; descendant `0b7cee8c` contains the squash commit.
- Runtime invariant: web template, 100% traffic revision `ca-abarva-web-lab-eastus--m0b7cee8c`, and both required workers match `sha256:434973b9464f14f345919f4d529fdc040c8b15c19ab06c2512fd93d66946a808`; a fresh read-only check passed at 2026-10-12 02:09:55 UTC.
- Signed-in timing proof: https://github.com/abarva-platform/abarva/actions/runs/38194353988, embedded serving SHA `0b7cee8c`; speed acceptance failed as recorded above.

## Known Gaps

- Server stage durations are unavailable in the baseline walk; the new proof records them after deployment.
- The valid walk has no lower non-speed dimension, but the response-time target remains unmet on 13 reachable views. Exact settled milliseconds for the 7 full-speed rows were not retained by the original proof schema; a follow-up will preserve them.
- A later walk of a changing runtime encountered a missing static chunk and is a separate reliability failure, not a valid speed sample.
- The screenshot retry addresses one observed browser protocol error; a repeated capture failure still fails the smoke job.
