# 2026-09-21-t457-register-time-authority — Deployment register time authority

## Release ID

`2026-09-21-t457-register-time-authority`

## Status

`candidate`

## Plain-English Summary

The execution lanes keep an append-only register of what was claimed, merged
and deployed. Every line carries a timestamp, and each lane was writing that
timestamp from its own idea of the time rather than from the event's own
record. Measured against GitHub over one day's window, one lane ran more than
an hour **ahead** of the merges it was reporting and another ran behind them,
and six lines were stamped in the future of the clock that read them. Opposite
signs, non-constant magnitude — not a fixed skew a single offset would repair.

The lines themselves were not wrong; their content checked out. What was wrong
is that the file's order stopped being chronology, and two already-closed items
had derived elapsed figures from that order. A reader could not tell which such
figure was sound.

This change names the authority — GitHub's own `mergedAt` or a run's
`createdAt`/`updatedAt` for an event line, a literal `date -u` for a claim line
— and ships an executable checker for it, so the rule is something that runs
rather than something written down. No existing line is restamped: the register
is audit history and the correction pattern is append-only.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only execution/operations
capability — the lanes' own register and the checker for it.

None of the four data layers is touched. This is execution-control tooling and
process documentation only: no intake, no source adapter, no canonical model,
no product surface, no tenant data, no schema, no migration, no runtime.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — execution lanes and operator process
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` (new) — the checker. Parses a
  register, classifies each stamped line, resolves the authoritative instant
  from GitHub (or from an injected JSON file), and exits non-zero on a
  violation inside an explicit window. Also `--emit`, which builds a correctly
  stamped line prefix from the authority so the right thing is the easy thing.
- `scripts/exec/register-time-authority.test.mjs` (new) — the behavioural
  suite. Fourteen cases over fixture registers, asserting on exit status and
  verdicts.
- `.github/workflows/execution-queue-toolchain.yml` — one appended step that
  runs the suite. The workflow already triggers on `scripts/exec/**`.
- `docs/ops/deployment-register-time-authority.md` (new) — the rule.

## QA / Validation

**The measurement that demonstrated the defect.** Run against the real register
with `--github`, audit clock named rather than assumed
(`2026-09-21T17:14:02Z`), window `2026-09-21T12:00:00Z` onward:

| measure | before |
|---|---|
| stamped lines parsed | 434 (99 in window, 335 out) |
| merge announcements resolved to an authoritative `mergedAt` | 26 |
| outside ±300s of the event they reported | 17 |
| drift range | −44s to +48,077s |
| median drift | +2,385s |
| lines stamped in the future of the audit clock | 6 |
| appended lines whose stamp precedes a line above them | 63 |

The sign structure is the finding: every negative drift is between −11s and
−44s, which is a minute-precision stamp rounding down through its own event,
while the positives run to more than thirteen hours. Of the 17 outside
tolerance, 7 quote the authoritative instant inline — a deliberate late
reconciliation, which is correct behaviour and is **not** counted as a
violation. The remaining 10 leave the line's own stamp as the only time on
offer, and that is the defect.

**Test first, then the fix.** The suite was written and run before the checker
existed: `0 collected` (module not found) → after the checker,
**14 collected, 14 passed**. Clean baseline over the same scope, the existing
`Execution queue toolchain` job, taken on `origin/main` `279dc800e`:
`build-execution-queue.test.mjs` **37 passed, 0 failed** before and after — the
appended step adds a second suite and changes nothing in the first.

**Mutation proof — six deliberate breaks, every one caught:**

| mutation | result |
|---|---|
| delete the future-stamp check | 12 passed, **2 failed** |
| remove negated-merge handling | 13 passed, **1 failed** |
| **comment decoy** — remove the handling, leave `MERGE_NEGATOR` named only in a comment | 13 passed, **1 failed** |
| `citesAuthority` always true | 13 passed, **1 failed** |
| elapsed rule that can never trip | 12 passed, **2 failed** |
| missing authority entry silently skipped | 13 passed, **1 failed** |
| restored | **14 passed, 0 failed** |

**A false positive the real register caught, not the fixtures.** The first
classifier read `NOT MERGED YET, checks running` as a merge announcement and
produced a false drift pair and a false violation against a line that was
opening a pull request. Case 9 exists because of that line, and the negated-use
handling is mutation-proved above.

**Two checks were vacuous on the first draft** — `array.every(...)` over an
empty array passes regardless — and were tightened to assert the expected
violation is also present, so an empty report cannot satisfy them.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by application
code, no image changes behaviour, no flag moves. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does every merge; that
deploy carries no behavioural change from this record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no `az` command, no revision, no traffic
- Approved image digest: not applicable; no runtime behaviour changes
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and the reason is structural rather
  than a judgement call — no file in this change is reachable from any route,
  component, server action or worker. The only executable additions are two
  `scripts/exec/*.mjs` files that nothing in `src/` imports.

## Rollback Plan

Revert the merge commit. Nothing to undo beyond the files themselves: no
migration, no data write, no flag, no runtime state. The register is untouched
by this change — the checker only reads it.

## Audit Evidence

- The `Execution queue toolchain` workflow run on this pull request, whose
  `Run the register time-authority contract` step prints all fourteen cases by
  name, so the step is proved to **run** rather than merely to exist.
- The before-measurement above is reproducible on demand:
  `node scripts/exec/register-time-authority.mjs --file <register> --since <ISO> --github`.
  It is deliberately **not** committed as a baseline artifact — the register is
  not visible to CI, so a committed baseline could only become a document that
  used to be true.
- `docs/ops/deployment-register-time-authority.md` for the rule and its verdicts.

## Known Gaps

- **CI cannot audit the real register.** It is an operator file outside the
  repository. CI holds the control shut; the audit is run by whoever holds the
  register. This is stated in the doc rather than papered over.
- **The "after" measurement is owed and is small by construction.** A process
  rule can only be measured on lines written after it is adopted, and at the
  time of writing the only such lines are this item's own. The honest reading
  is that the before-number is established and the after-number needs a day of
  both lanes' traffic; it is recorded as owed rather than implied to have passed.
- Claim-line stamps are checkable only for the future-stamp and elapsed rules.
  A `date -u` read cannot be verified after the fact from outside the machine
  that made it, so the rule for claim lines is enforced by `--emit` making the
  correct thing easier than the estimate, not by a proof.
