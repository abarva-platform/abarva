# 2026-09-26-signed-in-proof-record-writeback — reconcile nine release records and close the writing order at the writer

## Release ID

`2026-09-26-signed-in-proof-record-writeback`

## Status

`candidate`

## Plain-English Summary

Nine release records in this repository say a post-deployment signed-in check had not been run
when, according to the execution register, it had — and one of those nine records also hides a
real defect the check found. None of the nine is a wrong judgement by anybody. It is a writing
order: a release record is authored before the change merges, so it can only ever say the check
has not happened yet; the register line is written after the deployment, when it has; and nothing
between the two ever reopens the record. The consequence is that the durable, public artifact
asserts a debt that does not exist and the finding is recoverable only from an operator-owned
file that CI cannot read.

This change does two things. It appends a reconciliation section to each of the nine records —
appending, never rewriting, because a record is audit history — saying that the replay ran, when
and by which run identity, what it found, which item carries any residual, and, critically, what
the register does **not** settle. Eight of the nine report their scope as undetermined rather
than claiming the replay covered everything the record asked for; the ninth explains why it is
the exception.

Then it closes the loop, so the same nine are not owed again next week. The reconciliation is now
asked at the one moment both accounts exist: when a register line is being written. The sanctioned
writer of those lines compares the line it is about to append against the release records the
branch itself adds, and names any record the line contradicts.

## Layer Impact

Release lane: `internal-admin` — release governance and the execution toolchain, with no client-facing
surface and no data-plane change.

- **Layer 4 — products:** none. Nothing under `src/` changed and nothing imports `scripts/exec/*`
  at runtime; no route, surface, tenant or model input is touched.
- **Release governance / execution toolchain:** `scripts/exec/append-claim.mjs` gains the check,
  and `scripts/exec/signed-in-proof-reconcile.mjs` gains the comparison the two callers share.
- **Documentation:** nine existing release records gain an append-only section.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — release governance and the execution toolchain.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs` — `compareAccounts`, the single record-versus-register
  rule, extracted from `reconcileRecord` rather than copied; `reviewReleaseLine`, the same question
  asked of a line that is about to be written.
- `scripts/exec/append-claim.mjs` — `releaseRecordsInBranch` and the check itself, with
  `--repo`, `--records` and `--base`; advisory by default, refusing under `--strict` before the write.
- `scripts/exec/append-claim.test.mjs`, `scripts/exec/signed-in-proof-reconcile.test.mjs` — the cases.
- Nine records under `docs/releases/records/` — one appended section each.

## QA / Validation

- **Re-verified the filed state first, on `origin/main` `3c4c291d0`:**
  `node scripts/exec/signed-in-proof-reconcile.mjs --register <register> --since 2026-09-19T00:00:00Z`
  reports agree 92, disagree 9, ambiguous 32, no-register-line 83 across 216 records that declare a
  signed-in proof required. The nine disagreements are the nine the item names, and every one was
  matched from a register line naming a single pull request.
- **Red first, in a separate clean checkout at `origin/main`** rather than by stashing:
  `append-claim.test.mjs` **61 passed / 9 failed** there, **70 passed / 0 failed** here — same case
  count, so the nine new assertions are the difference. `signed-in-proof-reconcile.test.mjs` 60
  passed before this change, **67 passed / 0 failed** after.
- **Nine mutations, nine caught**, one at a time, each proven to have changed the file by comparing
  its sha256 before and after: `--strict` no longer refusing (2 red); the check running only on
  lines that say nothing (5 red); an unreadable checkout reported as no contradiction (1 red) and
  as nothing at all (1 red); each of the two `compareAccounts` disagreement cases dropped (3 and 1
  red); the population filter dropped (1 red); every row reported as contradicted (2 red); and the
  corpus reader keeping its own copy of the rule (4 red). **One of the nine was first written as a
  no-op** — `undetermined: null || \`…\`` — which changed the file's digest without changing its
  behaviour and so read exactly like a caught mutation; it was rewritten and then caught.
- **The nine repairs were round-tripped through the reader that found them**, because a section a
  human reads as a correction and the parser reads as a debt would leave all nine still owing their
  proof: after the edit the same command reports **disagree 9 → 0**, all nine reading `ran`, with
  `ambiguous` and `no-register-line` unchanged at 32 and 83 and no new disagreement in the corpus.
- Typecheck, ESLint over the changed files, and `node scripts/release-check.mjs` — recorded on the
  release candidate.

## Rollout Plan

Squash-merge a reviewed PR into `main`. There is no runtime rollout: no image, flag, environment
variable, worker or traffic change, and nothing under `src/`. The repo-owned ACA main workflow will
build and deploy an image as it does for any merge, and this change does not alter what it deploys.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. No Azure command is run by this change.
- Approved image digest: read from the completed workflow; not asserted here.
- ACA runtime invariant: unchanged by this release; verified by the workflow as usual.
- Worker image invariant: not touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and none may be claimed.** Every row in this release is a
  document reconciliation or a change to a repo-owned script with no runtime consumer.

## Rollback Plan

Revert the PR on `main`. The nine appended sections are additive, so reverting removes the
reconciliation without restoring anything the records previously asserted; the register remains the
independent account either way.

## Audit Evidence

- The PR and its CI run, including `execution-queue-toolchain.yml`, which already runs both suites.
- The before/after reconciliation counts quoted above, reproducible with the command named.
- The nine appended sections, each naming the register stamp and run identity it was written from.

## Known Gaps

- The check runs at the writer and therefore cannot repair a record that is already merged. It names
  the record and the append-only repair; opening that follow-up is still a human or agent action.
- The register is operator-owned, so nothing in CI can compare these two accounts. That is why the
  check sits on the sanctioned writer rather than in a workflow, and it means a register line written
  by hand still bypasses it.
- Two residuals found by two of the nine replays were previously carried by no item. They are filed
  as `C-542` and `C-543`; neither is diagnosed here.
