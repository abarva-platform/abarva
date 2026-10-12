# 2026-10-11 — Moves phase reads and intake control names

## Release ID

`2026-10-11-moves-step-page-read-set`

## Status

`candidate`

## Plain-English Summary

The first speed release improved the deployed walk but left 13 reachable views above 2.5 seconds. Flagged step pages still resolved tenancy twice and waited for a current-phase gate inside the Move projection before requesting the viewed phase's gate. This follow-up reuses the already validated tenancy, starts the viewed gate with the Move projection, shares that gate with effective-phase validation within the request, and begins current-state readiness before effective-phase validation finishes. Every gate still runs the canonical evaluator. The walk retains exact settled milliseconds and binds server timings to the same navigation. Existing extended-intake controls gain accessible names from their visible prompts so the normal label-based operator flow can reach all 17 fields, including its four selects.

The candidate also carries the existing reference-deck client-copy and PDF-inspection changes from PR #9406. Their product code and focused tests match source head `54e74769ec488620049cd97364c21f32412d6e09`; the shared walk keeps both timing capture and independent artifact acceptance checks. The separate deck release record remains included. This combines two genuine test additions in one release candidate.

The existing flagged intake also resumes confirmed answers, the title, conversation, declared blueprint and explicit email preference from the actor's open draft. Its ordinary autosave retains all 17 confirmed answers and the email choice. A failed saved-intake read blocks editing and autosave until recovery, rather than replacing saved answers with an empty draft.

## Layer Impact

- Release lane: `global-control-lane`, behind existing tenant step-page flags.
- Layer 3: existing canonical sources, access checks, gate evaluator, and values remain authoritative.
- Layer 4: request scheduling and sharing change; there is no persistent result cache.
- The walk proof schema adds exact settled time and navigation identity.
- Existing intake control names and draft hydration are Layer 4 changes. The current actor/tenant/surface/uncommitted-draft fences and submission handlers remain authoritative. Optional fields in the existing draft JSON retain confirmed intake answers and email preference; there is no schema migration.
- Carried deck changes are Layer 4 copy, editable exhibits, PDF rendering and inspection, under the existing `moves_reference_deck_v1` flag. The deck release lane is `experimental`.

## Client Applicability

- All clients: existing legacy routes retain their read path.
- Specific clients: the scheduling change applies only where existing phase step-page flags are enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flags: existing `moves_capture_v2`, `moves_step_pages_v3`, `moves_step_pages_p0p1_v1`, and `moves_step_pages_p4p5_v1`, plus `moves_extended_intake_fields_v1` for control names and `moves_reference_deck_v1` for carried deck changes; enrollment is unchanged.

## Changes Included

- Reuse the authenticated tenancy on flagged step pages.
- Load the Move projection without its redundant current-phase gate, then provide the real viewed gate to the client.
- A read set shares pending results and errors only for the same context, Move, transition, and historical permission in one request; a new request starts fresh.
- Start the viewed gate and current-state readiness earlier while retaining explicit unavailable states.
- Capture server and settled-head timing before any walkthrough navigation, retaining later API entries only from the same document.
- Name every active extended-intake textarea/select from its visible prompt, gated by the existing extended-intake flag.
- Restore stored confirmed intake answers and conversation, preserving explicit title, blueprint and email choice. Share one authenticated draft read between the opening message and flagged canvas; retain the legacy read path when the flag is off.
- Keep absent drafts distinct from unavailable reads. An unavailable saved intake pauses autosave and submission until recovery.
- Keep the flagged intake's answer panel and recovery text reachable at mobile width, using the existing step-page CSS module. Flag-off markup and layout remain unchanged.
- Record actual deployment and failed speed acceptance for the preceding release.
- Carry the separately documented reference-deck client copy, editable exhibits, PDF inspection and both-edition acceptance checks from #9406.

## QA / Validation

- PASS: 681 focused tests across 20 suites after reconciling P4, covering host, intake/reload, origination boundaries, ROM selection, routing, read-set, effective-phase, evidence, transformers, and the five carried deck/preview suites.
- PASS: local typecheck and focused ESLint.
- PASS: all five read-sharing mutations and three intake-name/flag mutations were detected; source restored.
- PASS: library orphan audit, route and export reachability, census/tenancy/manual checks, Playwright discovery, and all 11 release gates.
- Census: reconciled main `4b55978d` reports 2831 covered test files; the combined tree regenerates to 2833 with exactly two new covered files: request sharing and PDF inspection. Reload tests extend existing CI-covered suites. No values were edited by hand.
- PASS: N's eight original behavior mutations, eight draft-resume/read-failure mutations and one mobile layout mutation were detected. Source was restored; the layout probe used a private rendered copy. K's release record retains its fifteen detected artifact-review mutations; carried product code and tests are unchanged.
- PASS: actual component/CSS renders at 1440 and 390 with both color-scheme settings. The restored answer panel is fully within the viewport; the failed-read notice is readable. A private mutation restoring the clipped mobile grid fails the same bounds check. Temporary render test removed. These local fixtures do not establish signed-in runtime behavior or speed.
- PENDING: K review of the carried scope, complete CI on the final combined head, and deployed signed-in timing/artifact proof.
- Baseline: walk 38194353988 on serving `0b7cee8c`, 20 reachable views passing, UX 95, 7 full-speed rows, and no lower non-speed dimension than walk 38171682273.

## Rollout Plan

Squash merge the combined candidate after K review, complete current-head CI and the fresh fetched-ref coverage collision scan of open Moves and shared-census PRs including drafts. Keep #9406 in that scan while it remains open. Only the repo-owned ACA main deploy may promote shared traffic. Require settled head at or below 2.5 seconds on every reachable view and no lower non-speed dimension before acceptance; cover all 29 when the normal P execution reaches P5. Carried deck scope also requires both editions and formats to meet their separately documented acceptance criteria.

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
- Combined release candidate: PR #9434, carrying #9406 head `54e74769ec488620049cd97364c21f32412d6e09` after reconciling P4/main `4b55978dbeac63f4eb45afc3d222024ac5837841`.
- K review, combined-head CI, deployment and signed-in proof remain pending.

## Known Gaps

- Local concurrency tests do not establish live latency; a new valid deployed walk is required.
- Nine views were not reachable in the preceding walk; their speed must be assessed when P reaches P5.
- The preceding proof mixed a later navigation's server timings into the root-cause row; this follow-up binds timing to the navigation whose head was measured.
- The carried deck record's live figures, independent format scores, slide-by-slide visual review and saved final artifacts remain acceptance gates.
- Older drafts can recover only answers that were stored; omitted extended values remain blank and email opt-in is restored only from an explicit stored choice. The actual same-actor runtime reload still requires P's readback and signed-in proof.
