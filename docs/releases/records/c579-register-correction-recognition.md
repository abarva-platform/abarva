# 2026-10-04-register-correction-recognition — the register control recognises an appended correction

## Release ID

`2026-10-04-register-correction-recognition`

## Status

`candidate`

## Plain-English Summary

The deployment register is append-only: the rule for fixing a line you already
wrote is to leave it alone and append a correction underneath it, never to edit
the original. The automated control that audits that register judged every line
on its own, so it had no way to see that a later line had supplied the figures
an earlier line was missing. A line repaired exactly as the rule prescribes
therefore stayed flagged permanently, and the only way to make the audit read
clean was to edit the original — the one thing the rule forbids. A number you
can only reach by breaking the rule is not a measure of whether the rule was
followed, which is the whole defect.

The control now reads a correction. A flagged line is reported as `corrected`
when a line below it names that line's stamp, says it is a correction, and
itself supplies what the original lacked. The flagged line is still printed,
annotated with the line that corrected it — it moves out of the failing count,
it is never hidden, because the readable pair is the point of keeping history
append-only. The headline now reads `N failing, M advisory, C corrected`, so a
maintained register can reach zero failing without anyone rewriting history.

The discharge is deliberately hard to fake, because the opposite failure is the
one this programme exists against: a gate satisfied by a sentence. Four
conditions are all required, and the load-bearing one is the fourth — the
correcting line must itself satisfy the check it discharges, counting the stamp
it quoted to identify the original as a *reference* rather than as one of the
figures. Without that exclusion, "CORRECTION: my 16:04Z line was wrong, it
started at 09:30:00Z" would count as two timestamps and clear the gate with
prose. The table of correctable codes also fails closed: a code not in it can
never be corrected, however the later line is worded, because no appended
sentence can un-future a stamp or un-share a checkout.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only operations tooling — the
audit control agents and operators run over the deployment register, plus its
runbook. It is not `global-control-lane`: no shared app or control-plane
behaviour changes for any client.

No product layer. This is operator tooling only: `scripts/exec/` and its
behavioural suite, plus the operator-facing runbook that states the rule. No
client intake, source adapter, canonical model or product surface is touched,
no route, no schema, no migration, and nothing a signed-in user can reach.

## Client Applicability

- All clients: none — no runtime behaviour changes.
- Specific clients: none.
- Internal only: yes. Operator/agent execution tooling and its runbook.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/register-time-authority.mjs` — new `CORRECTABLE_CODES` table and
  `annotateCorrections()`; the report gains a `corrected` bucket, and `failing`
  and `advisory` are computed over undischarged violations only. The printed
  summary gains a corrected count and a per-violation `[corrected by line N]`
  annotation.
- `scripts/exec/register-time-authority.test.mjs` — 12 new behavioural cases.
- `docs/ops/deployment-register-time-authority.md` — a `Corrections` section
  stating all four conditions, why each is load-bearing, and why the table
  fails closed; severity table updated.
- Backlog item: `C-579`.

## QA / Validation

Measured against a clean baseline over the same scope, not quoted as an
absolute: the suite on `origin/main` (`6de543f93d`) is **331 passed / 0
failed**. With the 12 new cases and no fix, **337 passed / 4 failed** — the four
positive cases are red first, and the eight guard cases pass vacuously at that
point because nothing is ever discharged yet, which is exactly why each one is
pinned to its own mutation below. With the fix: **343 passed / 0 failed**.

`node scripts/exec/register-time-authority.test.mjs` → 343 passed, 0 failed.
`npx eslint` over both changed scripts → 0 errors, 0 warnings.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` →
**exit 0**, judged on the exit code rather than on grepping for `error TS`.

**Mutation proof — 11 applied, 11 caught, with the green control printed in the
same batch** so a run that executed nothing cannot be mistaken for a run that
caught nothing. Green control: 343 passed / 0 failed.

| # | mutation | result |
|---|---|---|
| 1 | declare `future_stamp` correctable, so the table no longer fails closed | 1 failed |
| 2 | count the referenced stamp as one of the sourced figures | 1 failed |
| 3 | drop append order — let a line above correct a line below | 1 failed |
| 4 | stop requiring the correction marker | 1 failed |
| 5 | stop requiring the verbatim stamp reference | 1 failed |
| 6 | never consult the per-code predicate | 2 failed |
| 7 | lower the threshold from two sourced instants to one | 1 failed |
| 8 | leave corrected violations inside `failing` | 2 failed |
| 9 | drop the corrected count from the printed summary | 1 failed |
| 10 | drop the `[corrected by line N]` annotation | 1 failed |
| 11 | attach an empty corrected annotation instead of the real line | 2 failed |

**The control is still failable on the real register, which is the check that
matters most for a change that relaxes a count.** Run read-only over the live
register with `--since 2026-10-03T14:00:00Z`: before, 2 violations / 2 failing;
after, 2 violations / **1 failing, 1 corrected** — the `2026-10-03T14:10:17Z`
line is now annotated `[corrected by line 4272 (2026-10-03T14:11:16Z)]`, which
is its real, already-appended correction, and the uncorrected `worktree_shared`
verdict keeps the process **exit code at 1**. Nothing was weakened: no test was
deleted or relaxed, no severity was downgraded, and the register's bytes were
verified unchanged by md5 before and after every read.

Not verified, and named rather than implied: no signed-in walk and no deploy
proof apply to this change, because it alters no runtime surface.

## Rollout Plan

Merge to `main`. There is no runtime rollout: these are repo-owned operator
scripts invoked by agents and by
`.github/workflows/execution-queue-toolchain.yml`, which runs the suite. No
image build is required for the change to take effect, no Container App
template changes, no flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime artifact changes.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected; no Container App template, revision weight
  or worker job image is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — nothing a signed-in user can reach
  changes.

## Rollback Plan

Revert the single squash commit. The control returns to judging each line in
isolation and the corrected count disappears; no state, no data and no schema
is involved, so the revert is complete on merge. No migration constraint.

## Audit Evidence

- The pull request and its CI run. The suite runs as the
  `Run the register time-authority contract` step in
  `.github/workflows/execution-queue-toolchain.yml`, whose context is
  **`Execution queue behavioral contract`** — and read by name against the
  rulesets API, that context is **not one of the 19 required status checks on
  `main`**. So the suite proving this change executes on the pull request but
  **cannot fail a merge**. Stated plainly rather than left to read as
  enforcement; filed as its own item (see Known Gaps). The local run, the
  mutation batch and the live read-only runs above are the actual proof.
- The before/after read-only runs over the live register quoted above, and the
  md5 pair proving the register was not written.
- The 11-mutation batch with its green control.
- The claim and release lines for `C-579` in the append-only claim log.

## Known Gaps

- Only `unsourced_elapsed` is declared correctable. Filed as `C-583`:
  `drifted_without_authority` is arguably correctable on the same principle — a later line that quotes the
  authoritative `mergedAt` sources what the original left out — but that needs
  the authority set threaded into the discharge, which is a second change and is
  not folded in here. Filed rather than folded.
- **The suite that proves this change runs in a non-required job.** Filed as
  `C-582`: `Execution queue behavioral contract` is absent from the 19 required
  contexts, so every behavioural contract under `scripts/exec/` — not only this
  change's — is advisory at merge time. Wiring it into a blocking job means
  editing a required workflow, which is a wider change than this one and is not
  folded in.
- Filed as `C-584`: the generated execution queue offers `C-634` as claimable in
  lane C although the backlog withdrew it as a false positive, because two
  definitions share that number and the generator reads the live one. That sends
  an agent at closed work.
- `order regressions: 2228` on the live register is untouched and unrelated:
  append order disagreeing with stamp order is reported, not corrected, and no
  claim is made about it here.
