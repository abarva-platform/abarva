# 2026-10-11 — Moves step page response time

## Release ID

`2026-10-11-moves-step-page-speed`

## Status

`candidate`

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

- The phase route begins independent gate, step-record, evidence, artifact, and register reads together and records server timings on flagged step views.
- Effective phase resolution evaluates independent earlier-phase gates concurrently and still returns to the earliest blocked or unreadable gate.
- The charter bridge accepts a previously read register result and makes the final rows available to the page, preserving an explicit unavailable state after a failed read.
- The P2 step page uses the server register projection when present. The gate page uses the server sign-off projection and shows an explicit unavailable state if document or sign-off reads fail.
- Independent client panels share an in-flight cabinet request, with failures delivered to every reader. The walk stores per-view timing details and measures settled head after the heading, next action, and step bar are present.

## QA / Validation

- PASS: focused route, routing, bridge, host, shared evidence, and effective phase behavior suites; the added effective phase test proves concurrent gate starts.
- PASS: TypeScript typecheck.
- PASS: focused ESLint and Playwright test discovery.
- PASS: route reachability, library orphan, export reachability, test coverage census, tenancy fence census, and manual check.
- PASS: release check after adding the required release lane. It will be repeated on the final branch head.
- PASS: six temporary behavior mutations each made its focused test fail; all source files were restored. The performance ordering itself is verified by the post-deploy timing walk rather than a unit mutation.
- PENDING: current-head CI and post-deploy signed-in timing walk.

The pre-change signed-in walk reported the following five slowest reachable views. A separate fresh browser sample measured document response waits on those same views; these are distinct observations and are not paired trials.

| View                 | Existing settled head | Fresh document response wait | After deploy |
| -------------------- | --------------------: | ---------------------------: | ------------ |
| P2 gate              |              9,134 ms |                     3,849 ms | Pending      |
| P2 validate          |              9,049 ms |                     5,653 ms | Pending      |
| P2 evidence plan     |              7,611 ms |                     8,244 ms | Pending      |
| P1 sponsor scope     |              7,427 ms |                     8,179 ms | Pending      |
| P3 root cause design |              7,412 ms |                     8,228 ms | Pending      |

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
- PR URL, current-head CI, deploy run, digest proof, and post-deploy walk: pending.

## Known Gaps

- Server stage durations are unavailable in the baseline walk; the new proof records them after deployment.
- The response-time target and non-speed UX comparison require a post-deploy signed-in walk. Local tests do not establish live performance.
- A later walk of a changing runtime encountered a missing static chunk and is a separate reliability failure, not a valid speed sample.
