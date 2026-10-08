# 2026-10-07-stage-readiness-review-family-coverage — a reviewed workbook that does not cover a required evidence family

## Release ID

`2026-10-07-stage-readiness-review-family-coverage`

## Status

`candidate`

## Plain-English Summary

A phase transition is gated by a readiness workbook: the Move team downloads a
spreadsheet of questions, answers them with sources, and a human accepts or
rejects each answer. The gate then reads that review.

The workbook's questions are built from the list of required evidence families as
it stands **at download time**. The gate re-derives that list **at evaluation
time**, from a fresh read. Between those two moments the list can change — a
Move whose archetype declaration lands after a workbook was reviewed resolves a
different blueprint, and therefore a different set of required families.

Nothing detected that. The workbook stamps a `dimensionPlanVersion`, but it is a
build-time constant, not a content hash of the family set, so a complete review
of an older question set read as a complete review of the current one. The two
readings then failed in opposite directions from the same missing check:

- **Phases 2 to 4 blocked, and could not be unblocked.** For a family the
  reviewed workbook never asked about, the gate reported the same sentence it
  uses for a workbook nobody has opened: "Complete the P2 to P3 readiness
  workbook with an evidence-backed answer and source reference." But the workbook
  on file has no question for that family, so completing it, re-reviewing it, and
  accepting every response in it all leave the gate exactly where it was. The
  instruction named a control that could not satisfy it. The only thing that
  clears it is downloading a fresh workbook, and nothing said so.
- **Phase 1 passed when it should not have.** The Charter check asks only whether
  the review's own required responses are all accepted. A review covering an
  earlier, smaller set is complete on its own terms, so the Charter phase read as
  review-complete while a newly required family had never been asked about at
  all.

Both are now decided by one question asked in one place: does the reviewed
workbook contain a required response for this family? That separates "nobody has
reviewed this workbook" from "this workbook does not ask about this family" —
different situations that need different instructions.

This changes what the gate *says* and, for the Charter phase, *when it is
satisfied*. It never makes a family ready: an uncovered family stays blocked, and
a covered one is still judged on its own merits by the existing assessment.

## Layer Impact

**Release lane: `global-control-lane`.** The gate reading is shared app behaviour
for all clients and is not feature-gated.

- **Layer 4 — products.** The phase readiness gate reading for the Moves phase
  workspace, the phase-gate approval route, and the phase deliverable generation
  route — the three callers of `applyStageReadinessToEvidencePackets`.
- Layers 1 to 3 untouched. No intake, adapter, canonical-model, schema,
  migration, projection or persisted-field change. Nothing new is stored: the
  coverage question is answered from the proposals already loaded and the packets
  already derived.

## Client Applicability

- All clients: yes. The gate reading is shared and ungated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A flag was considered and rejected: one half of the change
  makes a phase gate **stricter** (the Charter phase stops closing on a review
  that does not cover a required family), and leaving that behind a default-off
  flag would leave the falsely-permissive reading as the shipped default.

## Changes Included

- **Added** `src/lib/programs/stage-readiness-workbooks/review-family-coverage.ts`
  — a leaf module with no I/O and no dependency on the gate's internals. It
  answers the coverage question, reports which currently-required families the
  review does not cover, and owns the two instruction sentences for the cases
  where that is true.
- **Modified** `src/lib/programs/stage-readiness-workbooks/gate-readiness.ts` at
  three points:
  - the Charter branch now requires coverage as well as acceptance, and names the
    uncovered families in its next action;
  - the phase 2 to 4 packet loop reports an uncovered family with an instruction
    that can be performed;
  - the existing inline "has any required response been acted on" computation is
    replaced by the module's helper, so the two situations are decided from one
    definition rather than two.
- **Added** `src/lib/programs/stage-readiness-workbooks/__tests__/review-family-coverage.test.ts`
  — 9 cases over the module.
- **Modified** `src/lib/programs/stage-readiness-workbooks/__tests__/gate-readiness.test.ts`
  — 7 cases over the wiring, including the two readings this release corrects and
  the three that must not change.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`.
- **Added** this release record.

A dead branch was removed rather than left in place. Inside the phase 2 to 4
loop, `!dimensionProposals?.length` and "this family is uncovered" are the same
condition — the wholly-unreviewed case has already returned above it — so that
branch was only ever reachable in the uncovered case, which is why it was
emitting the unperformable instruction. It is not duplicated alongside the new
check.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/stage-readiness-workbooks` | **PASS** — 10 suites / 100 tests, 0 failing |
| `npx jest src/lib/programs/stage-readiness-workbooks src/lib/programs/__tests__ src/app/api/v1/programs src/app/api/v1/deliverables/generate-phase` | **PASS** — 179 suites / 1838 tests, 0 failing |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint src/lib/programs/stage-readiness-workbooks/` | **PASS** — exit 0, no output |
| `npm run audit:moves-gate-consistency` | **PASS** |
| `npm run audit:moves-evidence-lifecycle` | **PASS** |
| `npm run release:check -- --base origin/main --head HEAD` | **PASS** |
| Live signed-in walk | **NOT RUN** — see Deployment Authority |

The typecheck is judged on its exit code, not on a grep for `error TS`: a bare
run can exit 134 on this host with no diagnostics, which a grep reads as clean.

**The defect was measured before it was fixed, not inferred.** A probe run
against the unmodified module recorded, for a currently-required family absent
from the reviewed workbook: phase 2 next action
`Complete the P2 to P3 readiness workbook with an evidence-backed answer and source reference.`
— byte-identical to the never-reviewed sentence — and, at phase 1, no workbook
packet added at all, so the Charter phase read as complete. Both readings are now
asserted in the suite.

**The suite can fail.** Twelve mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file, so a mutation that
silently edits nothing cannot read as a survivor. Every mutation was reverted
from the index and the tree re-verified between runs.

| # | Mutation | Result |
|---|---|---|
| 1 | A recommended response counts as covering a family | **KILLED** (2 failed) |
| 2 | The covered set is ignored, so every family reads uncovered | **KILLED** (9 failed) |
| 3 | The duplicate-family guard is dropped | **KILLED** (1 failed) |
| 4 | A pending response counts as a decided one | **KILLED** (2 failed) |
| 5 | A decided recommended response counts as a worked required review | **KILLED** (1 failed) |
| 6 | The uncovered-family instruction stops naming the family | **KILLED** (2 failed) |
| 7 | The Charter instruction stops naming the families | **KILLED** (2 failed) |
| 8 | The Charter branch ignores coverage (the pre-fix reading) | **KILLED** (1 failed) |
| 9 | Optional packets are treated as required at the Charter gate | **KILLED** (1 failed) |
| 10 | The Charter branch reverts to its generic sentence | **KILLED** (1 failed) |
| 11 | Phase 2 to 4 reverts to the unperformable instruction | **KILLED** (1 failed) |
| 12 | No family is ever reported as uncovered | **KILLED** (1 failed) |

**12 of 12 killed.** Mutations 8 and 11 are the two pre-fix readings; each kills
exactly the case written for it, so neither correction is passing on the other's
assertion.

**Census.** `testFiles` 2792 to 2793, `coveredTestFiles` 2628 to 2629,
`pullRequestCoveredTestFiles` 2627 to 2628, `uncoveredTestFiles` **unchanged at
164**. The new suite moves `testFiles` and `coveredTestFiles` by the same +1 with
uncovered flat, which is the proof it is swept by a CI job rather than merely
present in the tree. The tenancy-fence census needed no change — the module is a
leaf with no tenancy surface — and `audit:tenancy-fence-coverage` exits 0 against
the committed file.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and
deploys the merge commit as it does every merge. No flag to enable, no migration
to run, no worker job to schedule, no data to backfill.

## Deployment Authority

Not required by this change. No Azure Container App, deploy workflow, runtime
image, feature flag, environment variable, worker job, traffic weight, DNS record
or environment promotion is touched.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change in this record.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof: **NOT RUN, and owed before this is called live-proven.**
  This record claims `merged` and `deployed` only. The gate reading changes what
  a signed-in reviewer is told and, at the Charter phase, when the phase closes,
  so a signed-in walk is the right proof and it is not mine to perform.

## Rollback Plan

Revert the merge commit. The change is one added module, one added suite, edits
to one existing module and its suite, a regenerated census and this record. No
schema, no migration, no persisted field, no stored artifact shape and no data
are touched, so a revert restores the prior reading exactly and nothing has to be
migrated back. The prior reading is the pre-fix behaviour described above, which
is the hazard, not a safe state — a revert should therefore be paired with the
sequencing note in Known Gaps.

## Audit Evidence

- `src/lib/programs/stage-readiness-workbooks/review-family-coverage.ts` — the
  module's own doc comment states the drift, both failure directions, and why
  coverage is asked of required responses only.
- The two suites named in Changes Included. Each case name states what it pins.
- The mutation table above. It is reproducible: apply the listed mutation and
  rerun `npx jest src/lib/programs/stage-readiness-workbooks`.
- `scripts/audit/moves-gate-consistency.mjs` and
  `scripts/audit/moves-evidence-lifecycle.mjs`, both PASS — no HARD gate
  criterion became unsatisfiable, which is the invariant this area is guarded by.

## Known Gaps

- **A fresh download is the only recovery, and it costs a re-review.** The new
  instruction is correct and performable, but downloading a replacement workbook
  mints a new proposal set, so decisions already made are restored only where the
  answer text is unchanged. That restoration exists and is reported; it is not
  claimed to be free. Making the surface state the cost before the reviewer
  commits is a content decision, not a refusal.
- **The drift is still detected only by its consequence.** Coverage is computed
  at gate time; nothing stamps the family set into the workbook, so nothing can
  tell a reviewer their workbook went stale at the moment it happened. A content
  hash of the family set, stamped at download and compared at review, would turn
  this from a correct late diagnosis into an early one. That is a persisted-field
  change and deliberately out of scope here.
- **Sequencing worth stating for whoever operates a transition.** Approve the
  evidence for a phase before downloading that phase's readiness workbook, and
  declare the archetype before either. The required-family set is resolved from
  the declaration; a workbook downloaded ahead of it is built from the wrong set,
  and this change makes that visible rather than preventing it.
- **A census regeneration is owed after this merges, and it is not a conflict.**
  One other pull request is queued that also adds one test file and therefore also
  asserts `testFiles` 2793 / `coveredTestFiles` 2629. Both were regenerated from
  the same base, so the counts lines are identical and git merges them without
  complaint; whichever lands second leaves the committed census one behind the
  tree. The drift is one per additional branch asserting the same counts, it is
  silent by construction, and the fix is a single regeneration pull request once
  both have landed rather than a race between them.
- No signed-in walk was performed. See Deployment Authority.
