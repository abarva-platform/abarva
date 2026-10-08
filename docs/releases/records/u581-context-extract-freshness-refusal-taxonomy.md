# U-581 — A context-freshness refusal states the fact it established

## Release ID

`2026-10-07-context-extract-freshness-refusal-taxonomy`

## Status

`candidate`

## Plain-English Summary

The phase-3 architecture build checks that the workspace's context extract is still current before
it generates anything. That check was written as a single condition over four independent things,
and every one of them produced the same answer: `stale_context_snapshot`, with the words "evidence
changed after this batch was queued — refresh the context extract and rebuild".

Only some of the four make that sentence true.

One of them is "the approved-evidence basis could not be read at all". The freshness loader folded
that case into the same `rebuild_required` status it uses for "the extract recorded no revision to
compare", so the two arrived at the check indistinguishable. Several of the loader's unreadable
causes are structural rather than transient — a row cap exceeded, or an approved review whose
evidence row the scoped read did not return — so refreshing the extract and rebuilding re-reads the
same unreadable basis and lands on the same refusal. A blocked run is terminal (the stale-run sweep
requeues neither blocked nor failed), and blocking a run cascades its queued descendants, so one
unreadable read ended the whole architecture batch while instructing the operator to perform the one
action this code had already determined could not clear it.

This change does not relax any refusal. The batch still needs a current, matching extract and still
stops without one. What changes is what the refusal claims, and whether it prescribes an action
already known to be futile. Each of the conditions now carries its own code and its own sentence,
and the unreadable-basis case says plainly that no comparison was made and that a rebuild cannot
clear it.

This is the same rule already applied to the gate read path and to the four document write paths,
owed at a fifth site that compares the context extract rather than a document.

## Layer Impact

- `global-control-lane`. Layer 4 (products) only: the Moves phase-3 generation queue worker and the
  worker-safe freshness leaf it reads. No change to layers 1–3 — no intake, adapter, or canonical
  model change, and nothing is written, migrated, or re-derived.

## Client Applicability

- All clients: yes — the refusal taxonomy is tenant-agnostic and not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is unconditional.

## Changes Included

- New `src/lib/programs/move-context-freshness-refusal.ts` — classifies the phase-3 context-freshness
  refusal into six conditions and declares, per condition, whether a rebuild can satisfy it.
- `src/lib/programs/move-context-extract-freshness.ts` — the loader now resolves its basis through
  the existing `resolveApprovedEvidenceCurrencyBasis`, and records
  `basisUnevaluableReason` when the approved-evidence snapshot could not be read. Additive field; no
  existing consumer's type narrows.
- `src/scripts/process-deliverable-queue.ts` — the phase-3 architecture-batch guard records the
  classified code and sentence instead of one hardcoded pair.
- Three test suites (two new, one extended) and a regenerated test-CI coverage census.

Response `error` values change for the conditions that were previously mislabelled. A grep across
`src/` found no consumer of `stale_context_snapshot` by name outside the producing file and its own
test; the genuinely-superseded and fingerprint-mismatch conditions keep that value and its original
sentence unchanged.

No migrations, workflows, images, flags, or environment variables changed.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__ src/scripts/__tests__`: 164 suites, 2114 tests.
- **PASS** — `npm run test:behaviors`: 202 suites, 2102 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0 (not
  134, so not an out-of-memory exit read as success).
- **PASS** — `npx eslint` over all six changed files, exit 0.
- **PASS** — registered-suite proof via census delta, measured after merging `main`: `testFiles`
  2825 → 2828, `coveredTestFiles` 2661 → 2664, and `uncoveredTestFiles` unchanged at 164. Both new
  suites sit in directories a required check sweeps, so neither is dark. The delta is +3 rather than
  the +2 these two files add because `main`'s committed census was itself short by one: two
  concurrent changes each asserted their own total from the same base, and the later merge erased one
  hunk with no conflict. The regenerated file therefore also repairs that drift rather than
  re-asserting it.
- **PASS** — mutation testing: 10 mutations, 10 killed. Killed: dropping the loader's reason
  pass-through; collapsing the loader's three causes into one; falling the unevaluable branch through
  to the status ladder; claiming a rebuild can satisfy an unevaluable basis; narrowing the final
  status branch so an unrecognised status passes; collapsing the unevaluable sentence into the
  superseded one; marking the absent-extract case unsatisfiable; collapsing the no-recorded-revision
  branch; keeping the worker's hardcoded code and sentence; keeping the honest code with the old
  sentence. The harness asserts each anchor matches exactly once before applying, and all three
  mutated files were diffed byte-for-byte against backups after the run.
- **PASS** — wiring non-vacuity: with both call sites reverted to their prior behaviour and every
  new test kept, the classifier's own suite passes in full (20 of 20) while exactly six host cases
  fail. A suite over the new module alone would therefore have proven nothing about the wiring.
- **NOT RUN** — live signed-in walk. No agent-side action can reach this code path for the demo
  workspace: it needs a queued phase-3 architecture batch, which is downstream of a human evidence
  approval that is not an agent action.
- **NOT RUN** — the loader's structural unreadable causes (row caps, a scoped read omitting an
  evidence row) against a real runtime. This lane does not exercise a live data plane; those causes
  are covered by injected cases at the loader and at the worker instead.

## Rollout Plan

Merge to `main`. No rollout of its own: the worker behaviour ships with the next operator image
built from `main` by the repo-owned deploy workflow, and the leaf's behaviour with the next web
image from the same `main`. No migration to apply, no flag to set, no environment variable to change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only authority that may
  shift shared web traffic. This change performs and requires no deploy action.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image is updated here.
- ACA runtime invariant: unchanged, and not claimed. The invariant must be proven against whichever
  deploy first carries this commit, before that deploy is called live-proven.
- Worker image invariant: unchanged. The queue worker's refusal codes and sentences change; its job
  contract, payload shape, and terminal statuses do not.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before any `live-proven` claim. This record claims `merged`
  only.

## Rollback Plan

Revert the squash commit. The change is confined to one new module, two call sites, three test
suites, and a regenerated census; it writes nothing, migrates nothing, and reads no new table, so a
revert needs no data repair. Reverting restores the prior behaviour exactly, including the single
conflated refusal and its unsatisfiable prescription.

## Audit Evidence

- The pull request and its CI run, including the `Behavior coverage floor`, `Typecheck +
  reasoning-layer tests`, `ESLint`, and `Release record and impact note` checks.
- `src/lib/programs/move-context-freshness-refusal.ts` — the module header records each operand of
  the condition it replaces and which fact that operand actually establishes.
- A blocked run's recorded `error`: `context_extract_basis_unevaluable` records that no comparison
  was made, and its absence from a refusal now means the comparison **was** made.

## Known Gaps

- The artifact client-approval route makes the same freshness read and still answers every condition
  with one message. Its wording ("unavailable") does not assert that evidence changed, so it is not
  making a false claim, but it does not distinguish an unreadable basis either. Left for a following
  change to avoid colliding with concurrent edits to that file.
- The unreadable-basis reason reaches the blocked run's recorded `error` and blockers. No workspace
  screen renders it, so it joins the other signals that flow and render nowhere; one surface would
  close them together.
- This change names the structural unreadable causes honestly; it does not remove them. Raising or
  paginating the loader's row caps so the basis stays readable at scale remains open.
- The two concurrent changes this one was written alongside have since merged, and resolving the
  resulting census conflict confirmed the predicted drift: `main` was short by exactly one. The
  regenerated census here corrects it, so no separate reconciliation PR is owed for that drift. The
  mechanism itself is unchanged and will recur for any future set of concurrent suite-adding
  changes.
