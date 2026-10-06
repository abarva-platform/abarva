# 2026-09-22-preclaim-ownership-gate — Pre-claim run-ownership gate for the execution register

## Release ID

`2026-09-22-preclaim-ownership-gate`

## Status

`candidate`

## Plain-English Summary

Two automated runs of the same scheduled task can start at the same time. Each one reads the
shared work register, sees a claim written under the task's name, and reasonably concludes the
claim is its own to continue — so both edit the same files and one silently loses work.

The repository already had the logic that tells those two runs apart, and a recent fix finally
fed it real data. What was missing was a caller at the moment it matters. Ownership was still
decided by an agent reading the file and judging for itself, and the existing audit only reported
the collision after it was already written down.

This adds the check that runs *before* a claim is written. Given the register, the item, and this
run's full identity, it answers one of four things — take it, it is already yours, a sibling run
of your own task holds it, or another lane holds it — and it exits non-zero on the last two so a
script cannot walk past the refusal by ignoring the message.

## Layer Impact

Release lane: `internal-admin`.

None of the four product layers. This is internal execution tooling only: one Node script under
`scripts/exec/` and its behavioural suite. No product surface, no canonical model object, no
adapter, no intake tab, no database read or write, no model prompt.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent/operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — new exports `CLAIM_WINDOW_HOURS`, `itemSubjects`,
  `announcesRelease`, `resolveItemClaim`, and a new `--preclaim` CLI mode. No existing export,
  audit rule or exit path changed.
- `scripts/exec/register-time-authority.test.mjs` — sixteen new behavioural cases, each driving
  the real CLI as a child process and reading its exit status.

## QA / Validation

Measured over the same scope (this one suite), against a clean baseline taken from
`origin/main` `1b2bdbcd3681da9f7ce2876ae39231e1c2984524`:

| | result |
|---|---|
| Baseline on `origin/main`, before any change | **37 passed, 0 failed** |
| New cases added, fix not yet written (red first) | **40 passed, 13 failed** |
| After the fix | **53 passed, 0 failed** |

The thirteen failures are the new cases and nothing else; no pre-existing case changed state.

**Mutation proof — the guard can fail.** Both mutations were applied to the shipped code and the
suite re-run:

1. *Key ownership on the base agent name instead of the whole identity* — exactly the defect this
   exists to prevent. Result: **51 passed, 2 failed**; `a sibling run under the same base agent is
   refused the item` and `refusing a sibling exits non-zero` both failed.
2. *Match an item id anywhere on the line instead of in subject position* — Result: **52 passed,
   1 failed**; `an id merely mentioned in the same line does not hold the item` failed.

The code was restored from a pre-mutation copy after each and re-verified at 53 passed, 0 failed.

**Proven on the real register, not only on fixtures.** Run against the live operator register at
`2026-09-22T18:32:36Z`, with this run's own identity:

| item | verdict | exit | evidence |
|---|---|---|---|
| a live foreign claim | `held-by-another` | 1 | names the holding line, stamp and full identity |
| this run's own claim | `already-yours` | 0 | exact identity match |
| this run's own claim, read as a **sibling** run id | `held-by-a-sibling` | 1 | real line, real sibling relation — the 18 Sep failure mode, refused |
| an item claimed and released inside the window | `take` | 0 | newest line releases it |
| a second released item | `take` | 0 | newest line releases it |

The third row is the case that matters: it is a genuine two-run collision on real data, and a
base-name-keyed check reads it as the run's own traffic.

Also run: `node --check` on the changed script; `npx eslint` over both changed files;
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` judged by exit code;
`node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. No runtime rollout: this is a developer/agent script, not application code, and
nothing imports it at runtime. It ships into the existing `execution-queue-toolchain` CI job that
already runs this suite.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as usual; this
  change contributes no application code to the image.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: will be re-proven for the merge commit as standard practice, but this
  change cannot alter it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — there is no user-visible surface and no runtime path.

## Rollback Plan

Revert the single commit. The change is additive: no existing export, CLI flag, exit code or audit
rule was modified, so a revert restores prior behaviour exactly. No migration, no data change.

## Audit Evidence

- The pull request for this record, its CI checks, and the `execution-queue-toolchain` job running
  `node scripts/exec/register-time-authority.test.mjs`.
- The three suite measurements and both mutation results above, reproducible from the commit.
- The real-register run table above, reproducible with `--preclaim` against any register file.

## Known Gaps

- **The gate governs item ownership, not file ownership.** Two runs may legitimately hold two
  different items whose file lists overlap; the protocol's one-owner-per-file rule is still
  enforced by an agent reading the file lists. This run hit that exact case and had to reason it
  out by hand.
- **Reach limit, measured and deliberate.** The prior parser repair recorded 99 distinct
  identities on the real register of which 18 carry a run id. Ownership is undecidable for the
  other 81, so those resolve `unresolved-legacy` and the gate **fails open** on them with an
  advisory. Failing closed would refuse work on nearly every historical item and the gate would be
  switched off. `--strict` turns that advisory into a refusal for anyone who wants it.
- **Nothing forces an agent to run the gate.** It is available and proven; wiring it into the
  claim step itself is a separate change.
- Item-subject attribution uses the one cue the register actually writes (`item <id>`). A claim
  line that names its item with no such cue is not attributed, and the gate will report the item
  free. That direction was chosen over the alternative, which refuses work on ids merely mentioned
  in passing.
