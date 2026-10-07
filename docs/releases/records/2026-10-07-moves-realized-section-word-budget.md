# 2026-10-07-moves-realized-section-word-budget — Section word budget resolves over the sections a document will actually contain

## Release ID

`2026-10-07-moves-realized-section-word-budget`

## Status

`candidate`

## Plain-English Summary

A generated document is written section by section. Each section is told a hard
maximum ("stay under N words") and, when it comes back too thin, is asked to
grow to a target. Those targets are sized so that writing every section to its
target clears the whole document's minimum word count, which is a blocking
quality check: below it the document is refused as too short.

The targets were sized against the sections the document's template declares.
The document is written from the sections the planning pass returns, and nothing
required one set to cover the other. A declared section the planning pass left
out took its share of the minimum into the arithmetic and contributed no words
to the document; a section the planning pass named in its own wording matched no
declaration and fell back to a shared default unrelated to the share it was
replacing. The planning gate stops neither — a declared section the plan does
not name is deliberately a warning, and the thin-plan check compares a count,
not which sections are covered.

Measured across every document key any phase can request on any route: with one
declared section missing from the plan, all 18 keys that carry a per-section
budget fell below their own required total — one of them by 750 words, which no
remaining section could absorb, because each was also told to stay under its own
maximum. A model obeying every instruction it was given could not clear the
check. This matters past one document because a phase enqueues its documents as
a sequential chain and a blocked parent cascades, so one document stuck under
its minimum holds every later document in that phase, the phase gate, and the
phase itself.

The repair resolves the budget over the realized section set instead, reusing
the same proportional arithmetic that was already proven: the sections the
document will contain inherit the maximums their declarations carry (and the
shared default when they declared none), and that set is reconciled with the
minimum. No minimum is lowered and no maximum raised. When the planning pass
returns exactly the declared structure the answer is unchanged, so every
document that reconciled before is byte-identical.

## Layer Impact

Release lane: `global-control-lane` — shared document-generation behavior for all
clients, with no feature gate.

- `4 PRODUCTS` — Moves document generation only. The per-section instruction
  stated to the model and the completeness target the repair pass asks for are
  now both read from the realized section set. No product read model, projection
  or surface changes.
- No change to `1 CLIENT INTAKE`, `2 SOURCE ADAPTERS` or `3 CANONICAL MODEL`. No
  schema, migration, tenant data, evidence or gate-criterion change. Quality
  bars (floors, ceilings, advisory bands) are untouched.

## Client Applicability

- All clients: yes — shared document-generation behavior, no feature gate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior is inert for any document whose planning pass
  returns the declared structure, which is the intended case.

## Changes Included

- `src/lib/deliverables/orchestrator/realized-section-word-budget.ts` (new) —
  resolves the budget over the realized section keys and delegates the
  arithmetic to the existing `planSectionWordBudgets`.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` —
  `sectionWordBudgetPlanFor` takes the realized keys; `PassInputs` carries
  `plannedSectionKeys`; the draft/repair section instruction passes them through.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — derives the realized keys
  once from the planning pass's section plan and threads them to both the draft
  prompt and the repair-target reading.
- `src/lib/programs/__tests__/phase-deliverable-realized-section-budget.test.ts`
  (new) — 34 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/phase-deliverable-realized-section-budget.test.ts`
  — 34/34. Asserts the three invariants over every realization the planning pass
  can return (as declared, one and two sections omitted, one and two keyed off
  the declaration at the same count the thin-plan check accepts, and a key
  repeated) for every generatable key; that the answer is byte-identical to the
  prior reading when the realized set equals the declared one; that an empty
  realized set falls back to the declared structure; that an unsatisfiable bar is
  still reported rather than hidden; and that the sanitizer does not restore an
  omitted declared section, which is why this reached fixed structures too.
- **PASS** both callers pinned through a real orchestration run with a stub
  model, asserting against the prompt the model would receive — not against a
  hand-rebuilt call sequence.
- **PASS** `npx jest src/lib/programs/__tests__ src/lib/deliverables/orchestrator/__tests__`
  — 202 suites, 2,450 tests.
- **PASS** mutation testing, 7 of 7 killed: always budgeting the declared set;
  dropping the empty-set fallback; last-declaration-wins for a repeated declared
  key; collapsing duplicate realized keys; resolving a realized cap positionally
  rather than by key; and each of the two call sites dropping the realized keys.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no diagnostics.
- **PASS** `npx eslint` on all four touched files — 0 errors, 0 warnings.
- **PASS** census regenerated honestly: `testFiles` 2807 → 2808 and
  `coveredTestFiles` 2643 → 2644 with `uncoveredTestFiles` unchanged, so the new
  suite is CI-executed by the `src/lib/programs/__tests__` directory sweep in the
  required `AI surface control catalog` job. No per-file registration needed.
- **NOT RUN** live signed-in walk. This change alters a generation prompt and a
  repair target; proving it end to end needs a real document build for a tenant
  with approved evidence, which is outside this lane.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and
deploys from the merge commit as usual. No migration, no flag, no env var, no
worker job, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow at merge; not
  pinned here.
- ACA runtime invariant: unchanged by this PR; proven by the deploy workflow.
- Worker image invariant: unchanged. No worker job contract changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the end-to-end document build — see
  Known Gaps.

## Rollback Plan

Revert the squash commit. The change is additive and self-contained: one new
module plus an optional parameter threaded through two call sites, with no
schema, migration, stored state or flag. Reverting restores the declared-set
reading exactly, and the prior behavior is byte-identical for any document whose
planning pass returns the declared structure.

## Audit Evidence

- PR URL and CI run for this branch.
- The suite named above, and the mutation results recorded in QA / Validation.
- The census delta in `docs/architecture/test-ci-coverage-census.json`.

## Known Gaps

- No live signed-in proof. The behavior is exercised through a real
  orchestration run with a stub model, not against a generated document for a
  tenant with approved evidence. That needs the data lane.
- The budget is reconciled with the realized section set, not with how many
  words the model actually writes. A section that comes back under its target
  after the bounded repair rounds is still refused by the document-level check,
  which is the intended behavior.
- A section the planning pass names in its own wording still receives the shared
  default maximum rather than the declaration of the section it displaced. There
  is nothing to map it onto — the match is by key — so the default is the honest
  answer, and the reconciliation now raises it with the rest to cover the
  minimum.
- Unchanged and still open from prior runs in this workstream: a per-batch rather
  than per-file evidence declaration; an un-prevented multi-family fan-out; no
  operator view for the upload-declaration and evidence-tenant-scope reports; and
  several declared brief fields with no readers.
