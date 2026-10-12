# 2026-10-12 — Moves shared source reads and batched readiness

## Release ID

`2026-10-12-moves-step-page-shared-read-set`

## Status

`candidate`

## Plain-English Summary

Valid deployed step walks still exceed 2.5 seconds on reachable views. The earlier measured readiness read took 6878 ms. Current-state requirements were queried one family at a time, while historical gate checks repeated the same program, module, evidence and document-version reads. This candidate shares those canonical reads within one authenticated page request and batches independent readiness requirements. It starts readiness, snapshots, gate readback and register visibility with the Move load. Gate rules, approvals and evidence content keep their existing authority.

The existing Foundation inset editor also receives its visible prompt as an accessible name under the existing extended-intake flag. It remains a second editor of the same saved answer, with the normal handler and autosave. Theme text and background tokens now switch together: their separate fades briefly combined colors from opposite palettes and failed contrast. Final palette values and layout retain the canonical template.

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
- Switch step-page foregrounds, backgrounds, active-phase labels and controls together across themes, retaining the canonical token values and focus effects.
- Keep P5 publication preflight and the full gate verdict in separate request-cache entries, preserving the landed publication and document approvals.
- Retain a later client-mount mark only when it belongs to the same navigation whose settled head was measured.
- Name the existing Foundation inset editor without changing its answer, save path or flag-off markup.

## QA / Validation

- PASS: 1374 focused and affected tests across 48 suites on the P5-reconciled source, including canonical verdict equivalence, shared failures, tenant/Move fencing, document content, readiness concurrency, access-check reuse, declared blueprint reuse, snapshot projection and the existing intake handlers.
- PASS: 23 mutations detected one at a time: the recorded 16 request/readiness and six separate palette-fade mutations, plus the reconciled P5 publication-cache distinction. Every source was restored. These cover request cache/fence, gate sharing, module failure, readiness concurrency, both document fences and failures, strict count failure, program/module/snapshot reuse the inset name, canonical access sharing and discovery-program reuse.
- PASS: clean typecheck and ESLint on all changed code; library orphan audit, route/export reachability, manual/coverage/tenancy checks, all six context-corpus validators, six discovered live-walk tests, and all 11 release gates.
- PASS: the palette regression is reproduced as an actual WCAG contrast failure before the fix. Three local browser checks pass, including both directions of the palette switch at 390 and 1440. Real component/CSS fixtures have no contrast violations or horizontal overflow in either theme at both widths; the temporary render probe was removed.
- FAIL: required unit CI on superseded head `31023aba` failed an unchanged sampler timing assertion (105.98 ms, limit 100 ms). That head remains ineligible; the genuine palette repair requires complete CI on its new head.
- PASS: historical exact `0a77d01d` CI completed 38 successful checks and six expected skips. It does not cover the reconciled source.
- PASS: P5 reconciliation retains the landed publication preflight and N canonical shared reads. A reproduced cache collision initially allowed preflight to replace the full publication gate verdict; both call-order regression cases now pass, and removing the new cache-key dimension fails them.
- PENDING: complete new exact-current-head remote CI, the immediate merge guard, deployment and a valid after walk.
- Census: the genuine P5 predecessor #9438 landed as `691a1b4337c3916038495ad3a6e491a46ab4dd40` with 2848 covered test files: actual predecessor 2847 plus one P5 suite. It corrects the inherited carried 2846 artifact. This branch merged actual main without rebasing and regenerated the artifacts. An independent immutable-main source export regenerated 2848 and matched every candidate count field, a genuine N delta of zero. N adds no new test file; its publication-cache regression extends an existing suite. Counts are not edited by hand.
- PASS: current real-component/CSS fixtures at 1440 and 390 with both color-scheme settings. The named inset stays within the viewport (mobile x71, width270); normal save behavior and flag-off markup are tested. Temporary render probe removed. These fixtures are local proof.
- FAIL: the preceding deployed speed acceptance. Local tests do not establish runtime latency.

## Before / After Timing

These are observed settled-head milliseconds from valid serving before walks. This candidate has no deployed after sample. Walk 38211625754 on `65c57641` reached 20/29, UX 97, with 14 full-speed views and no lower non-speed dimension than baseline 38171682273. Later walk 38216031458 on `087c997f` reached 20/29, UX 93, with two full-speed views and 18 slow views at 2627–6768 ms. Its historical repo deployment artifact verifies the matching web/traffic/worker digest.

| View | Stable 65c57641 before | Later stable 087c997f before | Latest stable e4863a6c before | Candidate after |
| --- | ---: | ---: | ---: | --- |
| p0-signal | 4493 ms | 4356 ms | 3819 ms | Pending |
| p0-scope | 2312 ms | 2830 ms | 4321 ms | Pending |
| p0-value | 2029 ms | 2831 ms | 2942 ms | Pending |
| p0-owner-evidence | 2054 ms | 2682 ms | 2764 ms | Pending |
| p0-approve | 2277 ms | 2671 ms | 3247 ms | Pending |
| p1-sponsor-scope | 3917 ms | 4383 ms | 2216 ms | Pending |
| p1-stakeholders | 1950 ms | 2672 ms | 3083 ms | Pending |
| p1-success | 1878 ms | 2284 ms | 2690 ms | Pending |
| p1-evidence-change | 2025 ms | 2694 ms | 2859 ms | Pending |
| p1-charter-gate | 2119 ms | 2709 ms | 2890 ms | Pending |
| p2-evidence-plan | 4604 ms | 4519 ms | 2381 ms | Pending |
| p2-baseline | 2110 ms | 2494 ms | 3422 ms | Pending |
| root-causes | 2074 ms | 2738 ms | 2929 ms | Pending |
| p2-validate | 5286 ms | 5880 ms | 5657 ms | Pending |
| p2-gate | 5833 ms | 6768 ms | 4931 ms | Pending |
| root-cause-design | 4580 ms | 4520 ms | 2805 ms | Pending |
| architecture-options | 2235 ms | 2886 ms | 2923 ms | Pending |
| operating-adoption | 2337 ms | 2686 ms | 4048 ms | Pending |
| rom-estimate | 2181 ms | 2627 ms | 3162 ms | Pending |
| gate | 2307 ms | 2923 ms | 3460 ms | Pending |

The five largest 087c997f server contributors were P2 gate readiness (4086 ms), P2 validate readiness (3491 ms), P2 gate effective phase (3387 ms), P2 validate effective phase (2962 ms), and P2 evidence-plan readiness (2932 ms). These overlap and are not added together.

The later walk also lowers the themes dimension from 10 to 7 on P0 owner/evidence, architecture options and operating/adoption because of dark contrast. Desktop screenshots capture the palette fade; the corresponding phone screenshots have the final dark palette. Local browser reproduction catches a 3.09:1 intermediate contrast ratio where 4.5:1 is required. The palette fix has local proof; runtime acceptance remains pending.


The latest independently downloaded [before walk 38222162878](https://github.com/abarva-platform/abarva/actions/runs/38222162878) embeds serving `e4863a6c`. Its phase walk passed all 20 reachable views, UX 94, with two full-speed views, 18 slow views at 2690–5657 ms and no lower non-speed dimension than baseline 38171682273. The overall workflow failed its separate reference-deck fetch test; this valid phase sample does not establish deck acceptance or N after proof. The fresh read-only web-template, 100% traffic revision and required-worker invariant passed at 09:10:10 UTC for digest `sha256:9879d3f7d2c72c567a28adaf631c2a8435fd4846f1702ba318ce96e6c1b7a80b`.

The five largest e4863a6c server contributors were P2 baseline readiness (1982 ms), P3 gate criteria (1849 ms), P2 baseline gate criteria (1656 ms), P2 baseline effective phase (1588 ms), and P0 scope Move projection (1581 ms). These overlap and are not added together.
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
- Candidate PR: #9442. The superseded 31023aba unit failure is run 38220639316; historical 0a77d01d has complete CI. Actual P5 main `691a1b4337c3916038495ad3a6e491a46ab4dd40` is reconciled without rebasing. Complete reconciled-head CI, merge, deployment and after timings remain pending.
- Latest independently downloaded before walk: https://github.com/abarva-platform/abarva/actions/runs/38216031458, serving `087c997f377ab8b65801661879b0d30f5b1b7043`.
- Its successful repo-owned deployment: https://github.com/abarva-platform/abarva/actions/runs/38215247360, digest `sha256:30463dc3316c1eb0909860632e6542089d59ec4880b70c29dd7422cf4a7f8ccc`.

- Latest valid phase before sample: https://github.com/abarva-platform/abarva/actions/runs/38222162878, serving `e4863a6ca6a06d54bcc62911715ae7bdb5639f56`; separate deck-fetch test failed.
- Its successful repo-owned deployment: https://github.com/abarva-platform/abarva/actions/runs/38220778993.

## Known Gaps

- Speed acceptance remains failed until an actual deployed after walk passes every reachable view.
- Nine of 29 views were unavailable in the existing Move's walk. Fresh all-phase proof belongs to the separate authorized writer.
- Intake persistence/reload runtime acceptance remains separate from local recovery tests.
- Reference-deck validation and investment artifacts have separate failed acceptance and remain with their existing repair owner.
- A missing static chunk, rollout-transition sample or workflow success without a valid proof artifact cannot establish speed acceptance.
