# 2026-09-20-census-honours-quoted-ignore-patterns — a trap laid for the next quarantine

## Release ID

`2026-09-20-census-honours-quoted-ignore-patterns`

## Status

`candidate`

## Plain-English Summary

The test-coverage census decides which suites CI actually reaches, and the
unwired-suite queue is ranked from its output. It subtracts a command's own
`--testPathIgnorePatterns` so a quarantined suite is not counted as run.

It did that correctly only for **unquoted** patterns. Quoting one — the natural
way to write an argument in YAML — silently defeated the subtraction:

| | jest | census |
|---|---|---|
| `--testPathIgnorePatterns foo$` | excludes `foo` | excludes `foo` ✓ |
| `--testPathIgnorePatterns "foo$"` | excludes `foo` | **counts `foo` as covered** ✗ |

The shell strips quotes before jest sees the argument, so jest behaves the same
either way. The census reads command **text**, not shell **arguments**, so the
quote characters stayed attached and the pattern matched nothing.

**The failure direction is the dangerous one.** A file the command explicitly
skips reads as covered, so the directory holding it drops out of the queue of
directories that need wiring — the census would hide work from the very list it
exists to produce.

## This changes no current number, and that was checked rather than assumed

No workflow in the repository quotes an ignore pattern today. Every quarantine
is emitted by a generator script that joins its patterns unquoted, and there is
no quoted literal in any workflow. Verified both ways before claiming it:

- `grep` for a quoted pattern literal across `.github/workflows/` — no matches.
- One generator run directly, to see the shape it emits — unquoted.

Regenerating the census after the fix produces a **byte-identical file**, which
is why it is not in this diff. So this is a latent trap rather than a live
miscount: it would have fired for whoever wrote the next quarantine, and it very
nearly did — the defect was found while writing exactly such a step.

## Layer Impact

- `global-control-lane`. One operator/CI analysis script and its behaviour
  suite. No product surface, tenant data, schema, projection, migration, flag,
  code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — a small `unquote` applied to
  each ignore-pattern token, stripping **only** a matched pair wrapping the
  whole token.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — three cases: a
  double-quoted pattern, a single-quoted pattern, and a pattern containing a
  quote in the middle.

## QA / Validation

| What | Result |
|---|---|
| Census behaviour suite | **26 tests passing** (23 before, 3 added) |
| Committed census after the fix | **byte-identical** |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### Failing first, then mutation-proofed in both directions

The three cases were written before the fix and the two quoted ones failed on
the exact defect — `coveredTestFiles: 2` where 1 is correct — not on some
incidental difference. The third passed already, which is what made it a
control rather than a second copy of the same assertion.

| state of `unquote` | result |
|---|---|
| **reverted** (returns the token unchanged) | **2 fail** — the quoted cases |
| **over-aggressive** (strips every quote character) | **1 fails** — the internal-quote case |
| as shipped | **26 pass** |

Both directions matter. The first shows the fix is necessary; the second shows
it is not over-broad — a repair that stripped every quote would break regex
patterns that work today, which is the same defect pointing the other way. A
one-directional mutation run would have scored the over-aggressive version as
correct.

## Rollout Plan

Merge to `main`. No behaviour changes today; the next quarantine written with
quotes will be counted correctly instead of silently ignored. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores the
trap.

## Audit Evidence

- The PR diff — one function and three cases.
- The mutation table above.
- The unchanged census.

## Known Gaps

- **Only the ignore-pattern parser is fixed.** The census reads command text in
  other places too — the matcher that decides whether a command *names* a path
  has the same text-versus-arguments gap in principle. It was not audited here,
  and a quoted path argument may well have a similar problem. That is a
  separate question and is not claimed to be solved.
- **This is a parser fix, not a shell.** Backslash escaping, `$'...'`, and
  concatenated quoting are all still read literally. The fix handles the one
  form anybody actually writes, and nothing warns about the others.
- **No number moved**, so nothing in the queue this session ranked against
  changes. The value is entirely in the failure that no longer waits to happen.
