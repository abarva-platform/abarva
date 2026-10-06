# 2026-10-03-t801-claim-helper-final-verdict-line — Claim helper states write or no-write as its final line

## Release ID

`2026-10-03-t801-claim-helper-final-verdict-line`

## Status

`candidate`

## Plain-English Summary

The execution register is append-only, and agents add to it through one helper,
`scripts/exec/append-claim.mjs`. Until this change the helper announced a
successful write with `Appended to <file>:` followed by the full claim line, and
on one path that announcement arrived *after* two lines of advisory prose. An
agent that piped the invocation through `head -3` saw the advisory, never saw
the announcement, concluded the write had been refused, and appended the same
line a second time — so one backlog item carried two near-identical release
lines eleven seconds apart. Three existing register controls were run against
the duplicate and none of them detects it.

The same output had a second, opposite ambiguity: `--dry-run` writes nothing and
exits 0, and it also printed the claim line as its last output, so the final
line of a real write and the final line of a deliberate no-write were the same
shape. A `tail` read could not tell them apart either.

This change makes the helper end every path with one line that names the
outcome and nothing else — `VERDICT: WROTE <file>`, `VERDICT: REFUSED, nothing
appended`, or `VERDICT: NOT WRITTEN, nothing appended (--dry-run)`. It is the
last line, so a tail read reaches it however much prose preceded it, and it is
on stdout even when the explanation is on stderr, because the read that got
this wrong was a pipe and a pipe does not carry stderr.

The remedy is deliberately in the tool rather than in guidance to its callers.
Telling agents not to truncate output is not a control; a signal the output
carries is.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only execution tooling and ships
in no client-facing lane.

No product layer of the data operating model is touched. It changes what one
operator-facing script prints, not what it writes, not what it refuses, and not
any client-intake, source-adapter, canonical-model or product behavior.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — execution/claim tooling used by agents against an
  operator-local register. No tenant data, no client surface, no model path.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs` — adds a single `finish(code, verdict)` exit
  that prints the verdict as the last line of stdout. Every exit path in `main`
  now routes through it, including the usage-error path via `fail()`, the
  ownership refusal, the gate-unusable refusal, the strict record-contradiction
  refusal, `--dry-run`, and the append.
- `scripts/exec/append-claim.test.mjs` — adds nine cases over the five
  sanctioned paths.
- This release record.

No behavior change to what is written, what is refused, exit codes, or the
claim-line format. The register's bytes are unaffected.

## QA / Validation

Measured against a clean baseline over the same scope, not as an absolute count.

- `node scripts/exec/append-claim.test.mjs` — **85 passed / 0 failed** before any
  edit; **86 passed / 8 failed** with the new cases added and no fix (red-first);
  **94 passed / 0 failed** after the fix.
- The acceptance assertion is a count over all five paths, not five separate
  expectations: for each path the suite classifies a `tail -1` read of stdout as
  write or no-write and compares it against whether the fixture register's
  sha256 actually changed. The truth side comes from the digest, never from the
  helper's own words. A verdict line that is correct on one path and wrong on
  another cannot read as green.
- The expected strings are literals in the suite rather than imports from the
  helper. Sharing them would measure the fix against itself.
- Mutation-checked, five mutations, five caught, each by a named case:
  1. write path emits the refusal verdict → 3 cases fail, including the count.
  2. `--dry-run` emits the write verdict → 2 fail, including the count.
  3. verdict printed on stderr instead of stdout → all 8 fail.
  4. verdict printed before the claim line instead of after → 4 fail.
  5. `fail()` loses the verdict → 4 fail, including the usage-error case.
- Sibling suites in the same directory, unchanged by this diff:
  `queue-provenance` 30/0, `register-time-authority` 331/0, `cli-entry` 34/0,
  `fossil-claims` 91/0, `register-citation-check` 22/0.
- `scripts/exec/id-collision.test.mjs` reports **1 failing case, pre-existing and
  not caused by this diff**: both of its files are byte-identical to `origin/main`
  and neither imports anything changed here. The failing case asserts a ratio
  over the live operator register, which grows with every agent run, so its
  verdict is environment-dependent. Stated rather than folded into a count.

## Rollout Plan

Merge to `main`. No runtime rollout: these files are developer/agent tooling and
are not built into the web image or any worker job. Nothing becomes active in
any client environment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for any commit. This diff changes no runtime input to it.
- Shared runtime mutators: none. No `az` command, no revision weight, no
  Container App template change.
- Approved image digest: not applicable — no runtime image behavior changes.
- ACA runtime invariant: not applicable to this diff's content; the
  post-merge deploy run is observed as a matter of course and recorded in the
  register.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here renders on any client
  surface or reaches a model. Asserting a signed-in proof for it would be the
  false-evidence shape this backlog exists against.

## Rollback Plan

Revert the commit. No migration, no data, no flag, no runtime state. The
previous helper behavior returns immediately, and no register line written under
either version differs in content.

## Audit Evidence

- The red-first, green-after and five-mutation numbers above, each reproducible
  by running the one suite named.
- The append-only register carries this run's claim line and its outcome line.

## Known Gaps

1. **The second half of the item is a decision, and the decision is to ALLOW it.**
   The item asks whether a second release line for an item already released by
   the same identity should be refused as a no-op. It should not. The register is
   audit history and append-only; the sanctioned way to fix a line is to append a
   correction that references it, never to restamp or delete it. Refusing a
   second line would have blocked exactly the correction that repaired the
   duplicate this item was filed from, and would push that correction into a
   hand-written line — the same unwired-path shape the helper exists to replace.
   So duplicates stay possible by design, and the signal above is what stops one
   being written by accident.
2. **The detector that would have surfaced the duplicate in one run is still
   owed.** A cheap hygiene line reporting "item X has N release lines from one
   identity" belongs in the queue generator's own output. It is not in this
   change on purpose: `build-execution-queue.mjs` has two suites that assert its
   output byte-for-byte and its own sha256 is the queue-provenance stamp every
   fixture compares against, so adding a line to it is a separate, larger change
   than this one and should be reviewed as such.
3. **That follow-on could not be filed as a backlog id.** The Claude Code T-lane
   band `T-500`–`T-599` has 0 of 100 free and the human band `T-400`–`T-499` is
   also exhausted, which the generated queue reports as needing a range decision
   rather than a careful reading. Taking "one past the highest" is the exact
   collision the band rule exists to prevent, so no id was taken. The range
   decision is owed to an owner and is recorded here instead of guessed.
