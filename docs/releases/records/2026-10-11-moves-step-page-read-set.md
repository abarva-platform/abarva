# 2026-10-11 — Moves phase page request reads

## Release ID

`2026-10-11-moves-step-page-read-set`

## Status

`candidate`

## Plain-English Summary

The first speed release improved the deployed walk but left 13 reachable views above 2.5 seconds. Flagged step pages still resolved tenancy twice and waited for a current-phase gate inside the Move projection before requesting the viewed phase's gate. This follow-up reuses the already validated tenancy, starts the viewed gate with the Move projection, shares that gate with effective-phase validation within the request, and begins current-state readiness before effective-phase validation finishes. Every gate still runs the canonical evaluator. The walk retains exact settled milliseconds and binds server timings to the same navigation.

## Layer Impact

- Release lane: `global-control-lane`, behind existing tenant step-page flags.
- Layer 3: existing canonical sources, access checks, gate evaluator, and values remain authoritative.
- Layer 4: request scheduling and sharing change; there is no persistent result cache.
- The walk proof schema adds exact settled time and navigation identity.

## Client Applicability

- All clients: existing legacy routes retain their read path.
- Specific clients: the scheduling change applies only where existing phase step-page flags are enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flags: existing `moves_capture_v2`, `moves_step_pages_v3`, `moves_step_pages_p0p1_v1`, and `moves_step_pages_p4p5_v1`; enrollment is unchanged.

## Changes Included

- Reuse the authenticated tenancy on flagged step pages.
- Load the Move projection without its redundant current-phase gate, then provide the real viewed gate to the client.
- A read set shares pending results and errors only for the same context, Move, transition, and historical permission in one request; a new request starts fresh.
- Start the viewed gate and current-state readiness earlier while retaining explicit unavailable states.
- Capture server and settled-head timing before any walkthrough navigation, retaining later API entries only from the same document.
- Record actual deployment and failed speed acceptance for the preceding release.

## QA / Validation

- PASS: 447 focused host, routing, read-set, effective-phase, evidence, and transformer tests.
- PASS: local typecheck and focused ESLint.
- PASS: all five read-sharing mutations were detected; source restored.
- PASS: library orphan audit, route and export reachability, census/tenancy/manual checks, Playwright discovery, and all 11 release gates.
- Census: exact main tree `118977ac` regenerates to 2831 covered test files, correcting its saved 2830 count for an existing covered suite; this branch regenerates to 2832 with exactly one new request-sharing test file. No values were edited by hand.
- PENDING: complete CI on the final head and deployed signed-in timing proof.
- Baseline: walk 38194353988 on serving `0b7cee8c`, 20 reachable views passing, UX 95, 7 full-speed rows, and no lower non-speed dimension than walk 38171682273.

## Rollout Plan

Squash merge after complete current-head CI and the fresh fetched-ref coverage collision scan of open Moves PRs including drafts. Only the repo-owned ACA main deploy may promote shared traffic. Require settled head at or below 2.5 seconds on every reachable view and no lower non-speed dimension before acceptance; cover all 29 when the normal P execution reaches P5.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: determined and checked by the main deploy workflow.
- ACA runtime invariant: web template, 100% traffic revision, and required worker images must match the approved digest.
- Worker image invariant: no new worker behavior.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the full reachable step walk.

## Rollback Plan

Revert this follow-up through a squash PR and let the repo-owned main deployment promote the revert. Retain the preceding approved digest for the rollback window.

## Audit Evidence

- Preceding release: PR #9414, squash `085b513af55f0ede43effa47ac91c791dd6f2e8d`.
- Actual timing failure: https://github.com/abarva-platform/abarva/actions/runs/38194353988.
- This follow-up's PR, current-head CI, deployment, and signed-in proof remain pending.

## Known Gaps

- Local concurrency tests do not establish live latency; a new valid deployed walk is required.
- Nine views were not reachable in the preceding walk; their speed must be assessed when P reaches P5.
- The preceding proof mixed a later navigation's server timings into the root-cause row; this follow-up binds timing to the navigation whose head was measured.
