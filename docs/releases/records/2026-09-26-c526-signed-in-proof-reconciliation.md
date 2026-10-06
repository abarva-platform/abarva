# 2026-09-26 Reconcile a release record's signed-in proof against the register

## Release ID

`2026-09-26-c526-signed-in-proof-reconciliation`

## Status

`candidate`

## Plain-English Summary

A release record on `main` said its live signed-in replay had **not been run**. The
append-only execution register said the opposite for the same pull request: the
replay ran, was positive, and produced a residual that a follow-up change has
since fixed. The durable artifact in this repository therefore asserted a debt
that did not exist and hid a finding that did, and nothing compared the two
documents.

**The direction of that error is why this was worth fixing.** A false "not run"
costs more than a false "run": a later auditor either re-runs a proof already
obtained, or reports a release as owing a proof it does not owe — and the finding
the replay produced is recoverable only from an operator-side register that CI
cannot read and a reader of this repository never opens.

This release adds a repo-owned reader that answers the general question — for
every release record that declares a live signed-in proof required, what does the
record say, and what does the register say — and repairs the one record by
**appending** a post-deployment section rather than editing the original
assertion.

## Layer Impact

- Release lane: `global-control-lane`.
- No product layer changes. This is release-evidence tooling plus one release
  record correction. Nothing under `src/` imports `scripts/exec/*`, so there is
  no runtime effect and no rendered output moves.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: Yes — release governance and audit evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs` — new. Reads every release record
  added in a window, classifies whether it declares a live signed-in proof
  required and what it says happened, joins it to the register by pull request,
  and reports **per record** what each document says. `--strict` exits non-zero
  while any row disagrees or is ambiguous.
- `scripts/exec/signed-in-proof-reconcile.test.mjs` — new. 41 behavioural cases.
- `.github/workflows/execution-queue-toolchain.yml` — runs the new suite.
- `docs/releases/records/2026-09-26-source-action-detail-guard.md` — an
  **appended** post-deployment section. The original QA/Validation line is left
  exactly as written; a correction to audit history is an addition, never an edit.
- `docs/architecture/c526-signed-in-proof-reconciliation.json` — the measurement,
  per record.

### Three design decisions, and why the obvious choice was wrong

**The join is the pull request, not the branch name.** The item is written in
terms of "the register's release line for the same branch". A branch-name join was
built first and discarded: it works for records whose release id echoes their
branch and fails for every record produced by a run-stamped branch, whose release
id shares no token with it. A pull request *is* a branch, it is stamped into the
squash subject that added the record, and the register names it.

**Both register spellings are read.** The register writes a pull request as
`pull/N` in recent lines and a bare `#N` in older ones — 33 ids in the first form
and 564 in the second. A reader that knew only the newer spelling would have found
a register line for 33 records and reported `no-register-line` for the rest, which
reads exactly like agreement.

**Four verdicts, not two.** When one register line carries both an obtained marker
and an owed marker for the same proof, the row is reported `ambiguous` with the
sentence printed, not resolved. Folding those into `agree` hides the defect the
reader looks for; folding them into `disagree` sends an auditor after records that
are fine.

## QA / Validation

**Measured over the real corpus** — 626 release records added to `main` since
2026-09-19T00:00:00Z (a superset of the last seven days), against the live
register:

| | |
|---|---|
| records scanned | 626 |
| declare a live signed-in proof required | 209 |
| declare none, excluded and named individually | 417 |
| **disagree** | **9** (after the filed record was repaired; 10 before) |
| ambiguous — a human reads these | 61 |
| no register line found for the pull request | 83 |
| agree | 56 |

So the filed item was one case of a class, not an incident. Every disagreeing row
was matched from a register line naming **exactly one** pull request, so none of
them is an artifact of a line citing somebody else's release. The per-record
report is in `docs/architecture/c526-signed-in-proof-reconciliation.json`.

**Register sentences are deliberately not copied into that artifact.** The
register is an operator-owned document that has never been reviewed for public
disclosure; only the verdict derived from each line is committed, and the
sentences are re-derivable by running the reader against the register.

**Red first, then green, on the repair half:** with the record as it stands on
`origin/main`, the same 41-case suite reports **2 failed / 35 passed**, both
failures the cases asserting that the repaired record states its replay ran and
agrees with the register. After the appended section: **41 passed / 0 failed.**

**Seventeen mutations, seventeen caught**, one at a time, each against the final
module and suite. Among them: checking `not-run` before `ran` (2 failed — which is
the repair pattern inverted, and would report every correctly repaired record as
still owing its proof); narrowing the negation scope to adjacency (1); restoring
bare `proven` to the completed-run pattern (2); scanning the whole record body for
a completed run instead of only the sections where a record accounts for itself
(1); dropping the requirement promotion that puts the filed record in the
population at all (2); collapsing a multi-line field to its first line (2);
dropping the bare-`#N` pull-request spelling (8); demanding minute precision in
the register's record boundary (8); folding `conflicted` into `obtained` (3);
reporting a missing register line as agreement (2); reporting an absent register
instead of refusing (1); accepting an unrecognised flag (1); `--strict` exiting 0
on a disagreement (1).

**Two guards were deleted during that sweep rather than kept.** Each survived its
mutation, and in both cases the reason was that the guard was unreachable rather
than that the suite was blind:

- A rule excluding the requirement field itself from the completed-run scan. The
  owed-marker check already fires on every such field in the corpus; removing the
  rule changed the verdict, stated run-state and evidence line of **zero** records.
- A branch reading the answer out of a negated field label. Three records write
  their position that way, and all three also carry the canonical field, which is
  preferred and opens negative on its own — so that branch decided **zero**
  records. What replaced it is a case asserting the preference that does decide,
  and that case fails when the preference is removed.

A guard nothing reaches reads to the next author as protection that is present.

**Calibrated in both directions, over real rows.** The disagreeing direction is
the filed instance. The agreeing direction is a real known-negative: a record
whose replay genuinely was not run, whose register line independently says the
proof is owed, and which comes back `agree`. Across the corpus 27 rows have that
shape. A detector calibrated only on the disagreeing case cannot distinguish "this
record is stale" from "this detector always says stale".

**The suite reads real records, never invented ones.** Every record it parses is
read from `docs/releases/records` at run time; a helper refuses rather than
substituting text when a named record is missing. Register text appears as
sentences quoted from the live register with their stamp and identity attributed
in the case, plus fixtures for the structural cases, so no case reads the operator
root — which CI cannot see.

- Pass: `node scripts/exec/signed-in-proof-reconcile.test.mjs` — 41/41.
- Pass: every sibling suite in `scripts/exec` re-run with the new module in the
  directory (the fixtures copy the directory, so a new file is a real input to
  them): build-execution-queue 194/0, register-time-authority 311/0, fossil-claims
  91/0, build-source-board 82/0, append-claim 61/0, deploy-proof-resolver 44/0,
  worktree-sweep-hazard 38/0, cli-entry 34/0, queue-provenance 30/0,
  worktree-retention 27/0, register-citation-check 22/0, toolchain-manifest 17/0.
- Pre-existing, not caused here: `id-collision.test.mjs` reports 69 passed / 1
  failed. Measured in a **separate clean worktree at `origin/main`**, not by
  stashing: 1 failed there too, the same case, whose precondition is a ratio in the
  live operator register.
- Pass: full TypeScript check, `tsconfig.tsbuildinfo` removed first, exit 0 and 0
  `error TS` lines.
- Pass: ESLint on both new files, 0 errors and 0 warnings.

### What this release does NOT claim

**The scope of the replay that ran is undetermined, and is not asserted.** The
repaired record's own Deployment Authority names two assertions. The register
sentence reports one positive action review and one residual; it does not settle
whether both were exercised. The appended section says so rather than closing the
gap by assumption.

## Rollout Plan

Squash-merge a reviewed PR into `main`. Only the repo-owned ACA main workflow may
build and deploy the web image. No environment, flag, schema or data-plane change
is needed, and no runtime behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Verify from the completed workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision
  after deployment.
- Worker image invariant: Unchanged by this release; verify separately.
- Feature/env flag update path: None.
- Live signed-in proof required: **no**, and the reason is structural rather than
  stated as a convenience: nothing under `src/` imports `scripts/exec/*`, no
  route, component, prompt, read model or schema is touched, and the only product
  artifact changed is a markdown release record. There is no signed-in surface on
  which this could be observed. No signed-in run was performed and none is owed.

## Rollback Plan

Revert the PR through the protected `main` branch. The appended post-deployment
section would revert with it, restoring the stale assertion — so a revert should
be followed by re-appending the correction, not by leaving the record as it was.
No schema rollback is required.

## Audit Evidence

- `docs/architecture/c526-signed-in-proof-reconciliation.json` — the per-record
  measurement, with its window, its join rule and its counts.
- The appended section in
  `docs/releases/records/2026-09-26-source-action-detail-guard.md`, which names
  the follow-up that carries the residual.
- The new CI step in `.github/workflows/execution-queue-toolchain.yml`.

## Known Gaps

- **9 records still disagree with the register, and 61 are ambiguous.** They are
  named in the measurement artifact. Repairing each is a per-record append by
  whoever owns that record's work; this release repairs only the record the item
  was filed against, because the other records are inside other agents' claimed
  files. One of the 9 is the immediately following release in the same family and
  has the same shape.
- **The reader cannot run in CI against the real register**, which lives in the
  operator root. CI proves the reader's behaviour; the corpus measurement is an
  operator-side run whose output is committed as the artifact above.
- **`no-register-line` is not a verdict about a record's honesty**, and it has
  two causes, which are separated rather than left conflated: of the 83 rows, **49
  resolved a pull request and the register simply holds no line naming it**, and
  **34 had no pull request to look up at all** — their record was added by a commit
  whose subject carries no `(#N)`, so the join has nothing to key on. The second
  group is a gap in the *reader*, not in the records; a record added outside a
  squash merge is invisible to this join. Closing it needs a second join key, which
  this release does not attempt.
