# 2026-10-07-section-word-cap-declared-sources-only — A section's hard word cap comes only from declared sources

## Release ID

`2026-10-07-section-word-cap-declared-sources-only`

## Status

`candidate`

## Plain-English Summary

When the product writes a long document, it writes it one section at a time, and it tells
the writing step a hard limit: "keep this section under N words." That limit is a control —
the finished document is checked against a minimum and a maximum length, and a section told
the wrong limit either starves or overruns.

The limit is supposed to come from one of two things the product itself declares: the
editorial guidance written for that section in the document's own outline, or, when the
outline states none, that section's governed share of the document's ceiling. A reconciliation
step already balances those numbers so that "write at least X words" and "stay under Y words"
can never contradict each other in the same instruction.

A third source had slipped in. The step that plans the document is itself a model call, and
each planned section carries a short written reason for existing. For a section that is not in
the declared outline, the reconciliation does not cover it, and the limit fell through to a
text search for the phrase "under N words" inside that planned reason — prose the model had
just written. So the planning step could choose the limit the writing step was then held to,
either far above the section's governed share or far below the number the repair step would ask
that same section for one sentence later. The planned reason was also restated beside the
limit, which put two different word limits in one instruction.

This change removes that third source. A section the outline does not declare now takes the
same governed share as a declared section that states no guidance of its own, and the repair
step never asks such a section for more words than the limit it was given. The planned reason
is still given to the writing step, on its own line, as intent — it just no longer sets a
number. Every document whose sections are all declared is unchanged.

The route mattered because it is open on the one funding document in the plan phase: that
document's outline is deliberately not fixed, so the planning step is allowed to add sections
to it, and an added section took this path every time.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- `4 PRODUCTS` — Moves phase deliverable generation (the instruction given to the
  section-drafting and section-repair passes). No product read model, projection, or stored
  value changes.
- No change to layers 1-3: no intake, adapter, canonical model, schema, migration, or tenant
  data is touched. The quality bar's own floors and ceilings are untouched.

## Client Applicability

- All clients: yes — this is shared generation behavior for every tenant that generates a
  phase deliverable.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior is not flag-gated; it narrows where one number may come
  from and is inert for any document whose sections are all declared.

## Changes Included

- `src/lib/deliverables/orchestrator/section-word-budget-plan.ts` — the plan now carries the
  `fallbackCap` it applied, and two accessors resolve an uncovered key from declared numbers
  only: `sectionCapFor` (cap) and `sectionRepairTargetWithin` (repair target, clamped to that
  cap so INV1 holds for an undeclared section too).
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — the per-section cap is read through
  `sectionCapFor`; the model-authored `rationale` is removed from both the cap chain and the
  instruction line restated beside it. The applicability guard is now read off the plan, which
  removes a duplicated even-share literal and a branch no input could reach.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — the repair target for an undeclared
  section is resolved through `sectionRepairTargetWithin` rather than an unclamped even share.
- `src/lib/programs/__tests__/phase-deliverable-section-word-budget.test.ts` — the three
  orchestration helpers are hoisted so a new block can reuse them, and that block asserts the
  reachability condition, both directions of the removed source, the clamp, and the prompt the
  model would actually receive. No new test file, so no CI wiring is added.

## QA / Validation

- PASS `npx jest src/lib/deliverables src/lib/programs` — 457 suites, 6,281 tests.
- PASS `npx jest src/lib/programs/__tests__/phase-deliverable-section-word-budget.test.ts` —
  42 tests (was 38).
- PASS Mutation check, 6 of 6 killed: restoring the model-rationale cap source; an uncovered
  cap falling to zero instead of the declared share; the repair target left unclamped; the
  repair target ignoring the even share; a wrong fallback cap carried on the plan; and the
  instruction line restating the model's rationale. The last one survived the first pass —
  the display line had no case of its own — and the case was added rather than the change
  dropped.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint src/` — 0 errors (249 pre-existing warnings repo-wide, none in the changed
  files).
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN Live signed-in generation of a phase deliverable. This change alters an instruction
  given to a model, so the observable proof is a generated document; no live generation was
  run and none is claimed. The assertions above are made against the prompt text the model
  would receive, through a real orchestration run with a stub model caller.

## Rollout Plan

Merge to `main` via squash. No migration, no flag, no environment variable, no worker job. It
reaches the runtime with the next repo-owned ACA main deploy; nothing here requires one of its
own.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. No `az` command, traffic shift, revision weight, or Container
  App template change is part of this release.
- Approved image digest: not applicable — no runtime image is pinned or updated here.
- ACA runtime invariant: unchanged; this release asserts nothing about the live runtime.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable — no flag is added, enrolled, or read.
- Live signed-in proof required: no, for merge. A generated-document proof belongs to whoever
  next runs a live generation; this record does not claim `live-proven`.

## Rollback Plan

Revert the squash commit. The change is confined to four files inside the generation path,
adds no schema, no stored field, no flag, and no persisted value, so a revert restores the
previous instruction text exactly. Nothing generated under this change needs migrating back:
the cap only ever appears inside a prompt, never in a stored document or a read model.

## Audit Evidence

- The PR and its CI run.
- The mutation results listed under QA / Validation, reproducible by re-applying each listed
  mutation against the named suite.
- `section-word-budget-plan.ts`'s own header, which states the three invariants and now the
  uncovered-key rule beneath them.

## Known Gaps

- The census committed on `main` is stale by `testFiles 2802 -> 2804 (+2)` and
  `coveredTestFiles 2638 -> 2640 (+2)` relative to main's own tree. That drift is not this
  change's — no test file is added here — and a PR already in flight carries a census update,
  so the regeneration is deliberately left to a single separate pass rather than asserted in
  three PRs at once.
- The enabling condition is unchanged: two shipped structures — the plan-phase funding
  document and the evaluation workbook — declare no fixed structure, and the generic
  module-fallback outline explicitly invites the model to add sections. This release makes an
  added section's cap governed; it does not decide whether those outlines should be fixed. That
  is an editorial question about those two documents, not a defect in this path, and flipping
  it would change which sections those documents are generated with.
- `MIN_EVEN_SHARE_WORD_BUDGET`-style flooring still happens in the caller
  (`max(120, floor(ceiling / sectionCount))` inside `sectionWordBudgetPlanFor`) rather than in
  the plan module. One literal, one caller, so it cannot drift today; it is named here because
  a second caller would make it two.
- A declared section the model simply omits from its plan is a different hole in the same area:
  for an outline that is not fixed, nothing requires the planned set to cover the declared one,
  so the declared targets that total the floor can be partly unused. Not addressed here.
