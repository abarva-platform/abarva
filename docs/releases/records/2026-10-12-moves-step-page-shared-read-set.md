# 2026-10-12 — Moves shared source reads and batched readiness

## Release ID

`2026-10-12-moves-step-page-shared-read-set`

## Status

`candidate`

## Plain-English Summary

Valid deployed step walks still exceed 2.5 seconds on reachable views. The earlier measured readiness read took 6878 ms. Current-state requirements were queried one family at a time, while historical gate checks repeated the same program, module, evidence and document-version reads. This candidate shares those canonical reads within one authenticated page request and batches independent readiness requirements. It starts readiness, snapshots, gate readback and register visibility with the Move load. Gate rules, approvals and evidence content keep their existing authority.

The existing Foundation inset editor also receives its visible prompt as an accessible name under the existing extended-intake flag. It remains a second editor of the same saved answer, with the normal handler and autosave.

## Layer Impact

- Release lane: `global-control-lane`, behind existing tenant step-page flags.
- Layer 3: canonical program, module, snapshot, review and evidence records remain authoritative. There is no schema, migration, seed or calculation change.
- Layer 4: request scheduling and source sharing change. Results and errors are retained only inside the current request, bound to the same tenancy context and Move.
- Client responsibility: supply and confirm intake/evidence through the existing governed flow. Adapters and intake contracts are unchanged.
- Deterministic gate verdicts and reviewed evidence remain separate from generated narrative. Moves owns presentation; the canonical stores own the data.

## Client Applicability

- All clients: legacy and flag-off read paths retain their existing behavior.
- Specific clients: only workspaces already enrolled in the existing step-page flags use the new scheduling.
- Internal only: no.
- Public/demo only: no.
- Feature flags: existing `moves_capture_v2`, `moves_step_pages_v3`, `moves_step_pages_p0p1_v1`, `moves_step_pages_p4p5_v1`, and `moves_extended_intake_fields_v1`. Enrollment is unchanged.

## Changes Included

- Share the authorized program and module reads between the Move projection, archetype resolver, discovery readiness, displayed gate and historical gates. Share the same canonical read-access result or failure across program, module and snapshot readers; each new request rechecks access.
- Share the canonical evidence snapshot, approved-phase references, gate state and current document versions between gate consumers.
- Reuse the same snapshot read for effective phase, catch-up and the page model, preserving the page model's eight-row limit.
- Start independent gate evidence and version reads together instead of waiting for each preceding read.
- Query all required document families in one tenant- and Move-scoped review batch and one evidence batch. Keep per-family decisions, pending extraction and human-reviewed committed content.
- Run structured requirements concurrently and reuse estate counts. Failed flagged reads remain unavailable; legacy defensive behavior is retained.
- Start readiness and snapshot reads earlier. Start register visibility and gate readback after the canonical program/access reads authorize them, alongside the Move projection.
- Retain a later client-mount mark only when it belongs to the same navigation whose settled head was measured.
- Name the existing Foundation inset editor without changing its answer, save path or flag-off markup.

## QA / Validation

- PASS: 959 focused tests across 34 suites on the final source, including canonical verdict equivalence, shared failures, tenant/Move fencing, document content, readiness concurrency, access-check reuse, declared blueprint reuse, snapshot projection and the existing intake handlers.
- PASS: after merging actual main `64f59af8`, 1007 focused tests across 38 suites, including the changed canonical access-policy and tenancy behavior, with zero failures.
- PASS: 16 meaningful mutations detected one at a time; every source restored. These cover request cache/fence, gate sharing, module failure, readiness concurrency, both document fences and failures, strict count failure, program/module/snapshot reuse the inset name, canonical access sharing and discovery-program reuse.
- PASS: clean typecheck and ESLint on all changed code; library orphan audit, route/export reachability, manual/coverage/tenancy checks, all six context-corpus validators, five discovered live-walk tests, and all 11 release gates.
- PENDING: complete exact-current-head remote CI, the immediate merge guard, deployment and a valid after walk.
- Census: after merging the actual main predecessor `64f59af8`, independently regenerated actual main and candidate both report 2847 covered test files, a zero delta with no new test files. Behavior cases extend existing CI-covered suites. Main’s carried census was one existing upstream suite stale; this regeneration repairs that drift. Counts were not edited by hand.
- PASS: current real-component/CSS fixtures at 1440 and 390 with both color-scheme settings. The named inset stays within the viewport (mobile x71, width270); normal save behavior and flag-off markup are tested. Temporary render probe removed. These fixtures are local proof.
- FAIL: the preceding deployed speed acceptance. Local tests do not establish runtime latency.

## Before / After Timing

These are exact settled-head observations on the existing read-only walk. The candidate has no deployed after sample yet.

| View | Walk 38204300162, serving 5f63421b | Walk 38207362621, serving 061c0368 | Candidate after |
| --- | ---: | ---: | --- |
| P0 signal | 2583 ms | 4343 ms | Pending |
| P1 sponsor and scope | 3500 ms | 4241 ms | Pending |
| P2 evidence plan | 4601 ms | 4383 ms | Pending |
| P2 validate | 5884 ms | 5420 ms | Pending |
| P2 gate | 4937 ms | 10185 ms | Pending |
| Root-cause design | 4580 ms | 4408 ms | Pending |
| P3 gate | 2577 ms | 2579 ms | Pending |

The five largest server contributors in the 061c0368 benchmark were P2 gate readiness (6878 ms), P2 validate readiness (3129 ms), P2 gate effective phase (2957 ms), P2 evidence-plan readiness (2938 ms), and P0 signal effective phase (2605 ms). These overlap; they are not added together.

A later valid serving benchmark is walk 38211625754 on `65c5764107fec53f0c703bee33123844222af35b`, after main deployment 38210769900 completed. It reaches 20/29, UX 97, with 14 full-speed views and six failures at 3917–5833 ms. No non-speed dimension is lower than baseline 38171682273. This is a before sample for the unmerged candidate.

| View | Stable serving 65c57641 before | Candidate after |
| --- | ---: | --- |
| P0 signal | 4493 ms | Pending |
| P1 sponsor and scope | 3917 ms | Pending |
| P2 evidence plan | 4604 ms | Pending |
| P2 validate | 5286 ms | Pending |
| P2 gate | 5833 ms | Pending |
| Root-cause design | 4580 ms | Pending |

## Rollout Plan

Squash merge only after complete exact-current-head CI, main reconciliation, and the immediate fetched-ref collision scan of all open Moves PRs including drafts and known shared-census candidates. Only the repo-owned main deployment may promote shared traffic. Require a matching approved serving SHA/digest invariant before accepting a signed-in walk. Every reachable view must settle in at most 2.5 seconds, with no lower non-speed dimension than baseline 38171682273. Cover all 29 when the separate authorized writer reaches P5.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: assigned and checked by the main deploy workflow.
- ACA runtime invariant: web template, 100% traffic revision and required worker images must match the approved digest.
- Worker image invariant: both required worker jobs must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, a valid full reachable step walk with exact timings.

## Rollback Plan

Revert through a squash PR and let the repo-owned main deployment promote the revert. Keep the approved digest within the rollback window. No stored answers, evidence, approvals or gate state are rewritten by this change.

## Audit Evidence

- Prior release: PR #9434, squash `5f63421baadd8d45207aa29a523ec8db33fca759`.
- Prior valid failed speed walk: https://github.com/abarva-platform/abarva/actions/runs/38204300162.
- Earlier stable failed speed walk: https://github.com/abarva-platform/abarva/actions/runs/38207362621.
- Later independently verified before speed walk: https://github.com/abarva-platform/abarva/actions/runs/38211625754, serving `65c5764107fec53f0c703bee33123844222af35b`.
- Its successful main deployment: https://github.com/abarva-platform/abarva/actions/runs/38210769900.
- Earlier verified descendant main deploy: https://github.com/abarva-platform/abarva/actions/runs/38206506901, serving `061c036865c42165e03b4c534f097c1cee5d1afe`, digest `sha256:548b7b2cb4989f1edb25cb9609df280becdc4e5d511fcf3fb088c895ba0b8462`.
- Candidate PR, exact-head CI, merge, deployment and after timings remain pending.

## Known Gaps

- Speed acceptance remains failed until an actual deployed after walk passes every reachable view.
- Nine of 29 views were unavailable in the existing Move's walk. Fresh all-phase proof belongs to the separate authorized writer.
- Intake persistence/reload runtime acceptance remains separate from local recovery tests.
- Reference-deck validation and investment artifacts have separate failed acceptance and remain with their existing repair owner.
- A missing static chunk, rollout-transition sample or workflow success without a valid proof artifact cannot establish speed acceptance.
