# 2026-08-19-executive-story-contract-prompt-injection — Shared executive story spine, injected into the document prompt

## Release ID

`2026-08-19-executive-story-contract-prompt-injection`

## Status

`candidate`

## Plain-English Summary

A phase's story is one thing. The document explores it in depth; a deck
compresses it into an executive decision journey. If each surface invents its
own running order, a reader who saw the deck cannot follow the document, and a
reviewer cannot tell whether they disagree with the analysis or just read two
different arguments.

This adds the shared narrative model — the beats of the P2, P3 and P4 stories —
and injects it into the document prompt. Each beat is a QUESTION the reader
needs answered plus the decision work it does, not a section title, which is
what lets the same beat surface as a long document section and, later, as a
single slide.

Two further prompt instructions ship with it:

- **Numbers are not the model's to compute.** For P4 artifacts the prompt now
  states that every cost, effort, value, payback, TCO and sensitivity figure is
  supplied by the deterministic pricing and value model — and that arithmetic on
  supplied numbers is still the model computing. A figure that was not supplied
  must be named as an open input, not estimated to complete the narrative.
- **Size discipline now describes how length is actually measured.** Where a
  band counts prose only, the prompt says so and tells the model tables and
  exhibits are free. Previously the model budgeted its exhibits against a
  ceiling they did not consume, and under-exhibited to fit.

The deck contract (`DeckStoryContract`) is a separate, later increment. It will
consume this same module rather than defining its own story — that is the point
of putting the beats here.

## Layer Impact

Release lane: `global-control-lane` (shared narrative contract and prompt text;
no tenant data, no schema change).

- **Layer 4 (Products) — Moves.** Changes the generated prompt for Moves
  artifacts on the orchestrated path. No UI, no route, no persistence change.
- **Layer 3 (Canonical Model) — untouched.**

## Client Applicability

- All clients: no change unless the tenant is on `moves_orchestrated_deliverables`
  (today: `skyharbor`, `lakeshore`). For those tenants the prompt gains the story
  spine and, on P4 artifacts, the numbers mandate. The deterministic renderer —
  every other tenant's path — is untouched.
- Specific clients: `skyharbor`, `lakeshore` (existing flag, no enrolment change).
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added; rides the existing `moves_orchestrated_deliverables`
  flag, since only that path builds these prompts.

## Changes Included

- New: `src/lib/deliverables/shared/executive-story-contract.ts` — `StoryBeat`,
  `StorySpineId`, `EXECUTIVE_STORY_SPINES` (P2 10 beats, P3 11 beats, P4 10
  beats), `storySpineFor`, `storyBeatsFor`, `renderStorySpinePrompt`.
- New: `src/lib/deliverables/shared/__tests__/executive-story-contract.test.ts`.
- New: `src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts`.
- Modified: `src/lib/deliverables/orchestrator/prompt-builder.ts` — adds
  `storySpineInstruction()` and `deterministicNumbersInstruction()` to the
  context block, and makes `sizeDisciplineInstruction()` state the counting unit.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on all 4 touched files — 0 errors, 0 warnings.
- 22 new tests. The prompt tests are the important ones: they build a real
  request through `resolveQualityBar` and `getArtifactBrief` and assert the
  instruction text is present in the prompt actually returned by
  `buildPassPrompt` — because the failure mode this whole workstream exists to
  fix is a well-written contract that no prompt ever sees.
- Ordering is asserted as argument structure, not formatting: "what we are
  funding" must precede "investment", which must precede "economics"; in P3
  "approaches considered" and "tradeoffs" must precede "recommended approach";
  in P2 "what is not working" must precede "root causes".
- Negative cases covered: no spine for instruments (charter, financial model,
  value-measurement contract, handoff package), no spine for non-Moves modules,
  no numbers mandate on artifacts that carry no economics.
- Regression sweep: `src/lib/deliverables` + `src/lib/programs/deliverables` —
  703 tests, 8 failing. The same 8 pre-existing failures recorded in the
  preceding release record, verified unchanged. Net: 22 added, all passing,
  zero new failures.
- No live signed-in generation was run — see Known Gaps.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. Tenants on the orchestrated flag get the new prompt on their next
generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert the commit and merge to `main`. Prompt text is stateless: the next
generation after a revert uses the prior prompt. No migration, no persisted
artifact depends on the new instructions, and no tenant needs un-enrolling.

## Audit Evidence

- Local typecheck/lint/test output captured in this session's transcript.
- Motivating audit: `docs/design/strategic-moves/SOLUTION_PRICING_ENGINE_AUDIT.md`
  §5.2 (no narrative-spine instruction ever reaches the model) and §0 (the
  orchestrated path authoring cost figures rather than narrating computed ones).

## Known Gaps

- **The numbers mandate is prompt-level only.** It states the rule; it does not
  yet enforce it. Nothing currently supplies computed figures to the orchestrated
  P4 path, so today the instruction tells the model not to compute numbers that
  are also not being provided — which will correctly push it toward naming open
  inputs, but is not the end state. Enforcement arrives with the pricing-engine
  convergence, and the hard gate on the orchestrator is tracked separately.
- **The spine is injected but not validated.** No check yet asserts that the
  generated document actually followed the beat order. That belongs with the
  red-team pass rather than as a separate mechanical check.
- **`minSections: 9` for the business case still comes from the registry**, and
  the registry is still not consulted at runtime on the Moves path. Wiring
  `resolveQualityBar` is the next increment; this release deliberately precedes
  it so that wiring activates a reconciled contract.
- **No live generation has exercised the new prompt.** The tests prove the text
  is present; they cannot prove the model follows it. First live runs on an
  orchestrated tenant should be reviewed against the beat order before the bar
  is tightened further.
