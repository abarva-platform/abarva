# 2026-10-07-moves-section-word-budget-reconciliation — a section budget that cannot reach its own floor

## Release ID

`2026-10-07-moves-section-word-budget-reconciliation`

## Status

`candidate`

## Plain-English Summary

A generated Move document is written one section at a time, and the generation
prompt states two different limits to the writer: a word FLOOR for the whole
document, and a hard cap for each individual section. The floor is a blocking
check — a document under it is quarantined "document too short" and never
reaches the person who asked for it. The caps come from a different declaration
(each section's own editorial guidance) and nothing reconciled the two.

For two of the six design-phase documents they did not reconcile. One has a
2,800-word floor and six section caps totalling 2,700. The other has an
1,800-word floor and five caps totalling 1,780. A writer that obeyed every cap
it was given could not reach the floor the same prompt demanded, so the only
ways through were to break a stated cap or to get lucky. The repair pass said it
out loud in one sentence — it asked a section for more words "while staying
under the hard cap above", and for four of the first document's six sections
that asked for more than the line above it allowed.

This matters beyond those two documents because the design phase builds its six
documents as a chain, and a blocked document blocks every later one in it. One
document stuck under its own floor could hold the rest of the phase, its exit
gate, and the Move.

The fix resolves both numbers together instead of reading them separately. Where
the declared caps already fit, nothing changes at all. Where they cannot reach
the floor, they are raised in proportion — so the editorial judgement about
which section carries the weight is kept rather than flattened into an even
share. The same reconciliation caught a third mismatch in the other direction:
one closing-phase document's caps totalled 600 words more than its blocking
maximum, so the stated budget permitted a document the check would then refuse;
those caps are brought inside it.

No quality threshold moved. The floor, the ceiling, the advisory band and the
minimum section count are all exactly what they were — only the per-section
budget the writer is handed changed, so that obeying it can satisfy them.

Two smaller corrections ride along. The writer was told its targets spanned
"all seven sections" as a literal word beside a computed total, so a section
added or removed would have misstated the budget; the count is now derived like
the total. And the first draft of the reconciliation settled its rounding
remainder in a branch no input could reach — removed, with the rounding
direction carrying the guarantee and a note saying why it is sufficient.

## Layer Impact

- **Layer 4 — Products (Moves).** Phase document generation only. The
  per-section word budget stated in the generation and repair prompts, and the
  per-section completeness target the repair pass asks for, are now one
  reconciled reading instead of two independent ones.
- **Layer 3 — Canonical model.** Unchanged. No schema, no read model, no
  projection, no stored value.
- **Layers 1–2 — Intake and adapters.** Unchanged.

Lane: `global-control-lane` — shared app/control-plane generation behaviour for
all clients, with no feature gate.

No gate, criterion, threshold, or approval rule changed. The quality bar is read
and not written.

## Client Applicability

- All clients: yes — this is shared control-plane generation behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The reconciliation is inert for every document whose
  declared caps already fit its band, which is all but three of them.

Lane: `global-control-lane`.

## Changes Included

- `src/lib/deliverables/orchestrator/section-word-budget-plan.ts` — new leaf
  module. Resolves the per-section caps and repair targets together against the
  document's floor and the ceiling the quality check blocks on, and names the
  three invariants it holds.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — states the reconciled
  cap to the writer; exposes the plan so the draft prompt, the repair prompt's
  cap, and the orchestrator's repair target are one reading; derives the charter
  section count instead of spelling it.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — asks the repair pass for
  the plan's per-section target rather than an even share of the floor.
- `src/lib/programs/__tests__/phase-deliverable-section-word-budget.test.ts` —
  new suite (38 cases).
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts` — the
  existing charter-prompt case now derives the section count too, and asserts
  the literal is gone.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration. No route. No script. No workflow change.

## QA / Validation

- **PASS** — new suite: 38 cases. A totality guard over every document key any
  phase can request on any confirmed route (21 keys × 19 route shapes),
  asserting per section that the repair target fits under its own cap, that the
  targets total at least the floor, that the targets aim at the floor rather
  than the caps, and that the caps total no more than the blocking ceiling.
  Plus the two reconciliations by name, the inert case, the module's own units,
  and two wiring cases driven through a real orchestration run with a stub
  model, which read the cap and the target out of the prompt the writer would
  actually receive.
- **PASS** — `npx jest src/lib/programs src/lib/deliverables src/lib/agent/tools`:
  461 suites / 6,160 tests, 0 failures.
- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__`: 56 suites /
  858 tests, 0 failures.
- **PASS** — mutation testing, 14 mutations / 14 killed. Includes the defect
  itself as a negative control (remove the raise → the totality guard fails for
  both documents), both wirings (state the declared cap instead of the
  reconciled one; ask the even share again), both rounding directions, the
  floor margin, the floor-above-ceiling report, and the restored literal
  section count. Three first-pass survivors were each diagnosed rather than
  reported as gaps: two were a remainder-settlement branch that no input could
  reach, which was removed, and the third was a distinction with no shipped
  numbers in the gap it governs, which now has its own case.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` over the changed paths, exit 0.
- **PASS** — `npm run audit:test-ci-coverage:write`: test files 2,784 → 2,785,
  covered 2,620 → 2,621, uncovered flat at 164. The new suite sits in a
  directory swept by a required check.
- **PASS** — `npm run audit:tenancy-fence-coverage:write`: no change.
- **NOT RUN** — live signed-in walk. This changes what a generation prompt says,
  so proving it end to end needs a real build of a design-phase document for a
  Move that has reached that phase. That is blocked on the discovery evidence
  load and its in-app approval, which are not in this lane.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys from the merge commit as usual. No migration to apply, no flag to
enrol, no env var to set, no worker job to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No ad-hoc Azure command, no
  revision weight change, no Container App template edit.
- Approved image digest: whatever digest the main deploy workflow produces for
  the merge commit; this record does not pin one.
- ACA runtime invariant: unchanged by this release — it carries no env, flag,
  scale, or secret update, so no `az containerapp update` is required.
- Worker image invariant: unchanged. No worker job image moves.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: not for this change to be correct (it is
  prompt text and arithmetic, covered by the suites above), but see Known Gaps:
  it is not `live-proven` until a design-phase document is built on a real Move.

## Rollback Plan

Revert the squash commit. The new module has exactly two callers, both in this
change, and the reverted behaviour is the previous reading — the declared caps
and an even share of the floor. Nothing is persisted by this code, so there is
no written state to unwind and no migration to roll back. A revert restores the
original contradiction for the three documents named above; it does not leave
anything in an intermediate state.

## Audit Evidence

- The PR and its CI run (linked from the PR body).
- The new suite is the readable statement of the invariants, and its totality
  guard enumerates the documents it covers.
- The mutation log is summarised under QA above; the defect's own negative
  control is the first entry.
- Census delta, quoted above, is the proof the new suite is reached by CI
  rather than dark.

## Known Gaps

- **Not live-proven.** No design-phase document has been generated on a real
  Move with this change in place, because the Move on the critical path has not
  reached that phase. It is held by a pending evidence load and an in-app human
  approval, both outside this lane. This record says `candidate`, not
  `released`, for that reason.
- **The declarations are still two files.** The reconciliation makes a
  mismatch harmless and the new guard makes it visible in CI, but the editorial
  caps and the calibrated word bands still live apart and are still edited for
  unrelated reasons. Bringing them into one declaration per document would be
  the fuller fix and is deliberately out of scope here.
- **The over-ceiling direction is weaker than the floor direction.** A cap is a
  maximum, so a writer that stays well under its caps was never going to breach
  the ceiling by obeying them; that mismatch permitted a refused document rather
  than guaranteeing one. It is reconciled for consistency, and the distinction
  is recorded rather than smoothed over.
- **A floor above the ceiling is reported, not repaired.** If a future
  calibration sets a floor that cannot be covered without breaching the blocking
  maximum, the plan says so and leaves the declared caps alone instead of
  trading one blocker for the other. No shipped document is in that state; the
  totality guard asserts none enters it.
- **The census count is contended.** One other open PR asserts the same counts
  while also adding one test file, so whichever squashes second needs a rebase
  and a regeneration. Noted on the PR.
