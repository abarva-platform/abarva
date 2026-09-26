# Register Owed Vocabulary Gains A Not-Owed State

## Release ID

`2026-09-26-signed-in-owed-polarity`

## Status

`candidate`

## Plain-English Summary

Two operator-side readers decide whether a signed-in proof is owed by looking for words in prose. Neither could tell "a proof is owed" from "no proof was owed" — a polarity gap, not a scoping one. So a release line reading *"Signed-in acceptance NOT owed: the change alters one refusal branch in a pure function"* was read as a release owing a signed-in proof.

The reconciliation reader now has a third state for the register: `not-owed`, distinct from `owed` and from `obtained`, because a release that needed no proof has not obtained one. The negation is read adjacent to the owed word, and an un-negated debt word anywhere in the same clause still wins, so the rule can miss a not-owed assertion but cannot hide a real debt.

The board's blocker rule gains the same negation as a veto, which can only remove a label. Measured on the live backlog it corrects 31 items, every one of them already merged, deployed or signed-in proven, and every one labelled from a release line of its own saying the proof was not owed. No unproven item moves, and the generated claimable queue is unchanged.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1-3: no change. Both files read documents, never tenant data.
- Layer 4, products: none. No route, component, surface, prompt or product behavior changes.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — two operator scripts and their behavioral suites.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs`
- `scripts/exec/signed-in-proof-reconcile.test.mjs`
- `scripts/exec/build-source-board.mjs`
- `scripts/exec/build-source-board.test.mjs`
- No migration, no data build, no product code.

## QA / Validation

Baseline measured on `origin/main` `36d947126` in a worktree created from that exact ref.

- `signed-in-proof-reconcile.test.mjs`: 49 passed, 0 failed before.
- `build-source-board.test.mjs`: 82 passed, 0 failed before.

Red first, both halves, with the cases written before any fix.

- Reconciliation: 9 checks added; **54 passed, 4 failed**. The other 5 are negative controls and pass on unfixed code deliberately — without them the change would be indistinguishable from deleting the owed marker.
- Board: 2 checks added; **83 passed, 1 failed**. The second is the regression control for a genuine gate and passes before and after by design.

Green after: reconciliation 60 passed, 0 failed (two further cases were added while calibrating, below); board 84 passed, 0 failed.

Mutation proof. Each mutation was applied to the final module one at a time, each was confirmed to change the file rather than being a silent no-op, and each failed on its intended case.

- widen the owed negation from adjacent to a span → the separating case fails (59/1).
- drop the debt-wins guard → the debt-in-the-same-clause case fails (59/1).
- read the debt over the whole clause instead of the remainder → 5 fail (55/5).
- let the owed marker win over a not-owed assertion → 5 fail (55/5).
- fold `not-owed` into `obtained` → 6 fail (54/6), including the case that forbids exactly that.
- report `not-owed` as silence → 6 fail (54/6).
- use the full owed vocabulary where only debt words belong → 2 fail (58/2).
- board: remove the veto → the quoted-negation case fails (83/1).
- board: widen the veto to a span → the genuine-gate case fails (83/1).

**A justification written here was falsified by its own mutation and is recorded rather than quietly corrected.** The adjacent scope was first justified by the register's commonest owed phrasing, *"Not live-proven — signed-in check owed"*; widening the regex left that case green, because the clause scoping already leaves its negator outside the scope. The real separating sentence is *"the signed-in replay was not attempted and remains owed"*, where a span rule reports an open debt as owing nothing. That case is constructed and labelled as such: over the whole register the two scopes disagree about exactly one distinct sentence, `"**NOT signed-in accepted and none owed**"`, which adjacency should also accept — which is why `none` is a negator — and once it is, the two agree on the entire live corpus. Adjacency is kept for its failure direction, not for a corpus effect it does not have.

Effect on the live corpus, measured against one frozen register snapshot (sha256 `23bdbd2b…845e4`) so that register drift cannot be mistaken for a code effect — the first measurement was taken against two different reads of a register another agent appended to between them, and showed a fifth row moving that this change did not touch. Same scope both sides, `--since 2026-09-19T00:00:00Z`, 638 records scanned, population 215 both times.

| verdict | before | after |
|---|---|---|
| `agree` | 90 | 91 |
| `disagree` | 10 | 9 |
| `ambiguous` | 32 | 32 |
| `no-register-line` | 83 | 83 |

Exactly 4 rows move, each named rather than counted: PR #8240 `disagree`→`agree` (its register state was a false `owed`), and PRs #8236, #8234, #8128 keep `agree` while their register state is corrected from `owed` to `not-owed` — the rows that were right by accident.

`ambiguous` does not move, and the item predicted it would. The prediction was that at least two ambiguous rows carry this phrasing; measured, **zero of the 32 do**, and the reason is structural rather than a shortfall: an ambiguous row needs both markers in one clause, and this change only removes an owed marker, so it cannot reach that bucket. Verified by scanning all 32 chosen sentences for the negation rather than inferred from the unchanged total.

Board effect, measured by running the `origin/main` generator and this one over the same snapshot and diffing every item's derived blocker: 31 of 591 items change, 0 of them at rung 0. The generated queue, rebuilt from both summaries, is identical apart from its own generation timestamp.

- Whole `scripts/exec` toolchain, 14 suites, run after the change: no regression attributable to it.
- `id-collision.test.mjs` reports 69 passed, 1 failed. **Pre-existing and not caused here**, proven by running that suite in a separate clean worktree created from `origin/main` `36d947126` rather than by stashing: the same single case fails there, on the same corpus assertion. It is already filed.
- TypeScript `--noEmit` exit 0 with `tsconfig.tsbuildinfo` deleted first, and 0 `error TS` lines; scoped ESLint 0 errors, 0 warnings. Both judged by exit code.
- No signed-in run was performed and none is owed: both files are operator scripts that render no surface, and nothing under `src/` imports `scripts/exec/*`.

## Rollout Plan

Squash-merge after applicable CI and review. The repo-owned ACA main workflow builds and deploys the exact main commit; nothing here reaches the running application, so the deploy carries it only incidentally.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: verify required worker jobs match the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. Operator-side readers only; they render nothing and reach no tenant data.

## Rollback Plan

Revert through a new PR and the repo-owned main deploy workflow. No schema or data rollback is involved. Reverting restores both readers to treating a negated owed marker as a debt, which returns one false disagreement to the reconciliation report and the "signed-in acceptance owed" label to 31 already-shipped items.

## Audit Evidence

- Red-first, green and mutation counts above, reproducible with `node scripts/exec/signed-in-proof-reconcile.test.mjs` and `node scripts/exec/build-source-board.test.mjs`.
- Corpus counts reproducible with `node scripts/exec/signed-in-proof-reconcile.mjs --register <register> --since 2026-09-19T00:00:00Z --json`, and the board diff by running both generators over one operator root. The register is operator-owned and outside this repository, so CI cannot reproduce those halves; every sentence quoted in a test case is quoted from it and attributed in the case that uses it. Register sentences are otherwise deliberately kept out of this record.
- PR, CI, deployment run and digest evidence to be recorded after execution.

## Known Gaps

- **The board change does not free the two items that motivated it**, and this record says so rather than implying otherwise. Their rows are vetoed correctly; what keeps the label is a different hole, found by measurement: a claim line quoting the label itself reads as a use of it, and the `files:` path list at the end of every claim line makes a release-record filename carrying the token match the rule. A filename is not a gate — the same file already pins that for its `blocked` rule. Neither is a polarity question; both are filed with the live line that produced each, and one of them is this change's own release-record filename.
- A register line naming more than one pull request can still supply a row's verdict. The reconciliation picks the line naming the fewest, which is the right preference, but it does not report that the attribution was inexact when the winner still names several. Filed, not fixed.
- The reconciliation reader can still miss a not-owed assertion written without an adjacent negator, for example "no signed-in proof is owed for this release". That direction is chosen: the rule errs toward reporting a debt, never toward hiding one.
