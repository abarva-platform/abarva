# 2026-09-26-exec-queue-per-unit-residual-bucket — Per-unit residual work stays visible in the generated execution queue

## Release ID

`2026-09-26-exec-queue-per-unit-residual-bucket`

## Status

`candidate`

## Plain-English Summary

The internal execution queue that agents read to decide what to work on had a blind spot, and this
closes it.

The queue derives a proof "rung" for every backlog item — open, PR raised, merged, deployed,
proven — and it only offers an item as claimable while that rung is 0. For most items that is
correct: once the change has merged, the item's proof is its rung and there is nothing left to
hand out.

It is not correct for an item whose acceptance criterion is explicitly per-unit — "one row at a
time", "per row, never as a count". There, the rung describes the one slice that shipped and says
nothing about the remaining rows. The moment the first slice merged, the item left every claimable
bucket; if it also carried no owner gate it was not in the owner-blocked bucket either, so it was
in no bucket of the file at all and its remaining rows became invisible to every later run. The
only thing keeping that work alive was an agent remembering to hand-file a successor item id for
the remainder — which is not a mechanism, and it was missed three times in three days.

The queue now renders a separate section, **Residual work a proof rung cannot close**, listing
every item that reached a proof rung while carrying a per-unit acceptance, with the rung, the lane,
the owner gate if any, and the exact phrase that selected it. The numbered instructions at the top
of the file tell the reader to read that section before stopping. These items are deliberately
**not** made claimable: the shipped slice is real, and offering the whole item again would invite a
second agent to redo it. The section says to settle the open rows or file the successor id.

Nothing else about the queue changes. The claimable lanes, the funnel that explains the claimable
count, the owner-blocked counts and every claim bucket render byte-for-byte as before.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only execution-planning tooling. It ships no
client-facing capability, no control-plane behaviour reachable by a client, and no data-plane change,
so neither `global-control-lane` nor `client-data-lane` applies.

- **Internal tooling / operator reporting only.** `scripts/exec/build-execution-queue.mjs` renders a
  markdown report from a summary produced by `scripts/exec/build-source-board.mjs`. It reads
  operator-owned documents supplied through `SOURCE_EXECUTION_HOME` and writes one generated file.
- No product layer is touched. No intake, adapter, canonical model or product surface changes. No
  tenant data is read or written, no schema changes, no runtime code, no route, no prompt.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — internal execution-planning tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs`
  - Added a measured per-unit acceptance detector (`PER_UNIT_PHRASES`, `perUnitPhrase`) and the
    `residualAtRung` set: items that are not finished, are above rung 0, and carry a per-unit
    acceptance.
  - Added `renderResidualAtRung()`, rendered on every run including at zero, and wired it between
    the claimable lane tables and the owner-blocked section.
  - Added step 7 to the "How to take work without asking" instructions, pointing the reader at the
    new section.
  - Added a stdout line reporting the residual count and which of them sit in no other bucket, so a
    run whose output is tailed rather than read still surfaces it.
- `scripts/exec/build-execution-queue.test.mjs`
  - Added case block 30: four behavioural cases over synthetic operator documents, asserting on the
    rendered file produced by real child processes.

## QA / Validation

Baseline and result measured over the same scope — the queue's own behavioural suite:

- **Red first:** with the four cases added and no generator change, `node
  scripts/exec/build-execution-queue.test.mjs` reported **197 passed, 2 failed**.
- **Green:** after the change, **199 passed, 0 failed**.

The positive case was corrected twice during authoring, and both corrections are recorded in the
suite because each was a case that would have passed while proving nothing:

1. The first draft wrote the proof language ("merged and deployed") into the backlog row. The board
   derives a rung from an item's own verdict text plus its claim-log lines, deliberately excluding
   prose that merely cites a predecessor's PR, so the fixture stayed at rung 0 and the item came
   back *claimable* — the case could never reach the branch under test. The fixture now drives the
   rung through the register, and the three fixtures were probed directly to confirm they land on
   rung 6, rung 7 and rung 6 respectively.
2. The first phrase list missed the real known positive. The item that motivated this work writes
   "one surface at a time" where its predecessor wrote "one row at a time"; a list matching only
   literal rows selected 6 items and excluded the one case the work exists for. Widening it with
   per-direction proof language ("prove each in both directions") was measured and rejected — it
   takes the selected set from 9 to 21, which is proof obligation rather than per-unit settlement.

**Proved in both directions,** which the acceptance criterion required:

| direction | fixture | expected | result |
|---|---|---|---|
| per-unit acceptance, rung 6, no owner gate | rung driven through the register | appears in the section | pass |
| same item | — | is **not** offered in any claimable lane | pass |
| per-unit acceptance, rung 7 (finished) | — | must not appear | pass |
| aggregate acceptance, rung 6 | — | must not appear, so the bucket is not every merged item | pass |
| two per-unit + one aggregate at rung 6 | — | stated count equals the ids listed | pass |

The two negative cases additionally assert the section **exists** before asserting the id is absent
from it. Without that, both would pass on a file that has no such section at all — which is the
defect state, so the exclusion would have read identically to the bug.

**Mutation proof** — the fix was broken three ways and each mutation was caught by the cases that
should catch it, and only those:

| mutation | expected to kill | result |
|---|---|---|
| drop the `!isFinished(i)` term from the residual filter | the finished-item case | 198 passed, **1 failed** — the finished case |
| drop the per-unit phrase requirement | the aggregate case and the count case | 197 passed, **2 failed** — both |
| never render the section | all four cases | 195 passed, **4 failed** — all four, which is also what proves the two negatives are not vacuous |

**Additive-only, proved rather than asserted.** The `origin/main` generator and the changed
generator were each run over the identical operator corpus and their output diffed. The only
differences are the new section, the new instruction step, and the provenance sha256 (which changes
by design whenever the generator changes, and which `append-claim.mjs` re-checks). The claimable
lane tables, the funnel, the owner-blocked counts and every claim bucket are byte-identical.

**Surrounding gates.** Every suite in `.github/workflows/execution-queue-toolchain.yml` was run
locally:

- `build-execution-queue` 199/0 · `build-source-board` 84/0 · `register-time-authority` 311/0 ·
  `append-claim` 71/0 · `worktree-retention` 27/0 · `queue-provenance` 30/0 · `cli-entry` 34/0 ·
  `toolchain-manifest` 17/0 · `signed-in-proof-reconcile` 89/0 · `fossil-claims` 91/0 ·
  `register-citation-check` 22/0 · `deploy-proof-resolver` 44/0 · `worktree-sweep-hazard` 38/0.
- `id-collision` reports 69 passed / 1 failed **both on this branch and on a clean `origin/main`
  checkout** — identical case, identical counts. It is pre-existing and not caused by this change.
  The failing case reads the live operator corpus, which CI does not have and where the case skips;
  it is filed separately rather than repaired here.
- `npm run check:cli-invocation-guard` — 3 passed, 0 failed.
- `npm run check:export-reachability` — 19 passed, 0 failed, exit 0.
- `npx eslint scripts/exec/build-execution-queue.mjs scripts/exec/build-execution-queue.test.mjs` —
  exit 0.

Typecheck is not applicable: both changed files are `.mjs`, and `tsconfig.json` includes `**/*.ts`,
`**/*.tsx` and `**/*.mts` only.

## Rollout Plan

Merge to `main`. There is no runtime rollout: neither changed file is imported by the application,
served by any route, or included in the web image's execution path. The behaviour becomes active the
next time an operator or agent regenerates the queue.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: unaffected; no Container App template, revision or traffic change
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — internal reporting tooling, no product surface and no
  tenant data

## Known Gaps

- **Only half of the item this closes.** The backlog row that asked for this has two explicitly
  separable halves and says to take the first without waiting for the second. This is the first half,
  the recurring mechanism. The second half is a set of eight per-surface rows that are individually a
  build, a legal-catalog correction, a resolver change or a taxonomy call; none is the cataloguing
  work its two predecessors did, and one of them needs a product decision. That half stays open and
  is untouched here.
- **The detector reads acceptance prose, and prose is the weaker signal.** An item is selected by a
  measured list of per-unit settlement phrases. That is honest about what it can know — an acceptance
  that expresses the same contract in wording nobody has written yet will not be selected. The
  durable fix is a declared per-unit field on the item rather than a phrase match, which needs a
  change to the operator document format and is not attempted here. The phrase that selected each
  item is printed beside it so a wrong selection is visible rather than silent.
- **It reports; it does not decide.** The section cannot know whether a given item's rows are
  actually still open — only that its rung cannot answer the question. A reader still has to open the
  item. The section says so rather than implying the rows are open.
- **One pre-existing failure left in place.** `scripts/exec/id-collision.test.mjs` reports 69 passed /
  1 failed on a clean `origin/main` checkout as well as on this branch. The failing case reads the
  live operator corpus and has drifted with it; it skips in CI. It is out of scope here and filed
  separately rather than repaired in this slice.

## Rollback Plan

Revert the commit. No migration, no state and no generated artifact needs repair: the queue file is
regenerated from its inputs on every run and is not committed.

## Audit Evidence

- The behavioural suite: `node scripts/exec/build-execution-queue.test.mjs` — case block 30.
- Red/green and the three mutation results, quoted above with their counts.
- The additive-only diff, reproducible by running the `origin/main` generator and this one over the
  same operator root and comparing the rendered files.
- CI run for `.github/workflows/execution-queue-toolchain.yml` on the pull request.
