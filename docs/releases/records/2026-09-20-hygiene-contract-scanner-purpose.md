# 2026-09-20-hygiene-contract-scanner-purpose — A red assertion that disabled the four behind it

## Release ID

`2026-09-20-hygiene-contract-scanner-purpose`

## Status

`candidate`

## Plain-English Summary

A contract suite reads the hygiene gate's source text and checks the gate still declares
what it promises. One of its cases listed five commands the gate must never run and
asserted all five in a single case.

The first of those five was failing, and had been for some time, on a false positive: it
searched the raw source for `git stash pop`, and the gate contains a warning telling the
operator **not to run** `git stash pop`. Saying so is the opposite of doing it.

A case stops at its first failing assertion. So while that one was red, the four behind it
never ran — and a real `git push origin main` added to the gate produced no new signal at
all. Same one failure, same message.

The scan now separates executable shell from comments and quoted strings, so prose about a
command is no longer read as the command. Each forbidden command is its own case, so one
failure cannot hide the rest. And the suite now carries a header saying what it is for,
backed by measurement rather than opinion.

## Layer Impact

- `global-control-lane`. One test file. No product surface, tenant data, schema,
  projection, migration, script, or runtime behaviour — the gate itself is unchanged.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a CI contract suite
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` — a `shellCodeOnly`
  stripper, one case per forbidden command, fixtures pinning both directions of the
  stripper, and a header recording what this suite answers. 12 cases → 19.

## QA / Validation

| What | Result |
|---|---|
| The contract suite | **19 passed** (was 11 passed, 1 failed) |
| Three hygiene suites together | 56 passed, 0 failed |
| `tsc --noEmit` | exit 0 |
| `eslint` | exit 0 |
| Mutation harness, two directions | **8 mutations, 8 caught, 0 survived** |

Direction 1 puts each forbidden command into the gate for real — `git stash pop`,
`git stash drop`, `git push origin main`, `rm -rf /tmp/x`, `git reset --hard HEAD`. All five
are caught independently, and the failure names the command.

Direction 2 attacks the stripper: returning nothing (so nothing can ever be found), no
longer removing quoted strings (so prose trips it again), no longer removing comments. All
three caught.

### The long-red case is green because the false positive is fixed, not because it was weakened

That distinction is load-bearing, so it is demonstrated rather than claimed. With the fix in
place, adding a real `git push origin main` to the gate fails the suite and names it:

```
● hygiene_gate.sh - contract › script does NOT run destructive commands › does not run git push
```

Before the fix, the identical mutation produced no new signal.

### The old form was run against real destructive commands rather than assumed inadequate

The single-case form was restored and each command added to the gate in turn:

| gate really runs | old form reported |
|---|---|
| `git push origin main` | `Expected substring: not "git stash pop"` — silent about it |
| `rm -rf /tmp/x` | `Expected substring: not "git stash pop"` — silent about it |
| `git reset --hard HEAD` | `Expected substring: not "git stash pop"` — silent about it |

Byte-identical output in every case. The masking was total, not partial.

### What each suite is for, measured instead of judged

The item says not to fold this suite into the behavioural one until the scanner is merely
redundant, and to decide what each is answering. Nine mutations were applied to the gate
with both suites run separately:

| | mutations |
|---|---|
| **only the scanner caught** | remove `--help` handling; remove the shebang; delete section 1 (git hygiene, where the conflict-marker check lives) |
| **only the behavioural suite caught** | remove `--skip-build`; delete section 3 (secret hygiene); delete section 6 (stash hygiene) |
| **both caught** | delete section 2 (JSON manifests + duplicate slices); delete section 4 (TypeScript) |

**Neither suite subsumes the other**, and redundancy is two of eight — so folding the
scanner in would lose three guards. The answer recorded in the file's header is that the
scanner answers whether the gate still *declares* its contract (flags, shebang, sections the
behavioural fixture does not name), and the behavioural suite answers whether each check
reaches the right verdict when run.

## Rollout Plan

Merge to `main`. No runtime rollout — one test file.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores a suite in which one
red assertion hides four guards.

## Audit Evidence

- The PR diff — one file.
- The eight mutation results; the before/after demonstration on a real `git push`; the
  three-row table of what the old form reported.
- The nine-mutation coverage comparison between the two suites.

## Known Gaps

- **The stripper is an approximation.** It removes full-line comments, trailing comments,
  and single- and double-quoted spans. It does not parse shell. The fixtures pin both
  directions — prose must not trip it, real commands must — so a drift fails rather than
  passing quietly, but a sufficiently exotic quoting form could still fool it.
- **The behavioural suite's own section list is a hardcoded four names plus a line-count
  floor.** That is why three of the nine mutations went uncaught by it. Widening it is
  explicitly out of scope here, per the item.
- One mutation in the earlier comparison — adding a destructive command — was initially
  recorded as caught by neither suite. That reading was an artifact of counting failures
  against a baseline that already had one. The direct check above is what established the
  real answer, and it is worse than the first reading suggested.
