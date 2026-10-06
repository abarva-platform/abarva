# 2026-09-22-t701-id-band-capacity-measured — The id-band rule now measures whether a band has a free number left

## Release ID

`2026-09-22-t701-id-band-capacity-measured`

## Status

`candidate`

## Plain-English Summary

Agents working the internal execution backlog file new items from disjoint number ranges — one
range per agent — so that two agents filing at the same moment cannot pick the same number. The
generated queue hands out that rule as a short table: this agent files in the 500s, that one in
the 600s.

The table was prose. It told an agent where to look and never checked that anything was there.

Measured across the three documents the rule itself names — the backlog, the append-only run
log, and the repo-owned structure map — one range was already **100 of 100 spent**, and no
artifact anywhere reported it. The next agent to file an item in that lane would have collided
by applying the rule *correctly*, which is the precise failure the disjoint ranges exist to
prevent.

The table now carries a measured free count per lane per range, recomputed on every run, and the
generator says so loudly — in the file an agent reads before filing, and on both output streams
an operator watches — when a range is spent or close to it.

Two details matter more than they look:

- **The run log counts.** Three numbers in the spent range exist only there: named by an agent,
  with no backlog row written yet. A reader that measures the backlog alone reports capacity that
  is already gone. That trap was recorded in the register earlier the same day and is now pinned
  by a test.
- **Over-inclusion is the safe direction.** A number mentioned anywhere in those documents is
  treated as spent. Counting a number that turns out to be free costs one wasted number;
  reporting a spent one as free costs the collision this is all here to prevent.

This reports the problem; it does not decide the remedy. **Which range the exhausted lane extends
into is an owner decision and is deliberately not taken here** — see Known Gaps.

## Layer Impact

Release lane: `internal-admin`.

No product layer is touched. The change is confined to the internal execution-board toolchain
under `scripts/exec/`, which derives an operator queue from operator-owned documents. Layers 1–4
of the enterprise information architecture — client intake, source adapters, canonical model, and
every product surface — are untouched. No tenant data is read or written, no schema changes, no
migration, no route, no component.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — the execution board toolchain used by agents working the backlog.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — measures free capacity per lane per band over the
  documents the board declared it read plus the append-only claim log; renders the measured
  counts in the band table it already printed; raises a loud line at exhaustion and at a low-water
  mark of 10 free, on stdout and, when exhausted, on stderr.
- `scripts/exec/build-execution-queue.test.mjs` — eleven behavioral cases (section 25) asserting
  on a real child process's stdout and on the rendered file.

No other file changes. Nothing under `src/` imports `scripts/exec/*`.

## QA / Validation

Clean baseline over the same scope, `node scripts/exec/build-execution-queue.test.mjs`:

| run | result |
|---|---|
| `origin/main` `9f3f7cd39`, new cases absent | **122 passed, 0 failed** |
| new cases present, generator unfixed (red) | **123 passed, 10 failed** |
| new cases present, generator fixed (green) | **133 passed, 0 failed** |

Ten of the eleven new cases fail on unfixed code. The eleventh — "a band with capacity left raises
no exhaustion warning" — passes on unfixed code by design: it is a guardrail against a fix that
warns unconditionally, and absence of the feature satisfies it. The per-lane guardrail was
tightened after the first red run, because comparing two unmeasured lanes to each other was
satisfiable by `null === null`; it now requires a measured number and fails red.

Four deliberate mutations, each with the file's SHA-256 confirmed changed before the suite ran:

| mutation | cases failed |
|---|---|
| drop the claim log from the sources | 2 — including "ids spent only in the claim log are counted" |
| ignore the lane, count any id in the numeric range | 3 — including "one lane's exhausted band does not consume another lane's" |
| never raise an alert | 2 — both announcement cases |
| report every band as untouched | 8 |

Run against the live operator documents, the real known positive is caught: `T-500`–`T-599`
reads **0 of 100 free** and the run prints `BAND EXHAUSTED` on both streams. The four other
figures the generator reports for that band were reproduced by an independent one-off count
written before the feature existed, and agree exactly.

Test expectations are deltas against a measured baseline, never absolutes. The fixture copies the
real repo-owned structure map, so it already carries live ids; an absolute expectation would
encode today's map and fail the next time anyone files an item.

- `node scripts/exec/build-execution-queue.test.mjs` — exit 0, 133 passed.
- `npx eslint scripts/exec/build-execution-queue.mjs scripts/exec/build-execution-queue.test.mjs` — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, empty
  diagnostic file, judged by exit code after removing `tsconfig.tsbuildinfo`.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` imports `scripts/exec/*`, the directory
is in no container image, and no Container App reads it. The change takes effect the next time an
agent or operator runs the queue generator.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as usual; this
  change contributes nothing to the image.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image content changes.
- ACA runtime invariant: unaffected; asserted by the repo-owned workflow, not by this change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is structural rather than a judgment call:
  no file under `src/` imports `scripts/exec/*`, so no deployed surface can exercise it.

## Rollback Plan

Revert the single commit. The generated `EXECUTION_QUEUE.md` is regenerated on every run and is
never committed, so reverting the generator restores the previous table on the next run with no
other step. No migration, no data, nothing to unwind.

## Audit Evidence

- The pull request and its checks.
- `scripts/exec/build-execution-queue.test.mjs` section 25 — the eleven cases, each naming the
  defect it holds shut.
- The red/green/mutation numbers in QA / Validation above, reproducible with the commands given.
- The live run output showing `T-500`–`T-599` at 0 of 100 free.

## Known Gaps

- **The range decision is open and is not taken here.** The item this closes has two parts. Part
  (a), the measurement, is done. Part (b) — which range the exhausted lane extends into — is an
  owner decision and is deliberately left open. `T-700`–`T-799` is measured free in all three
  documents and has already been used ad hoc, but it sits directly above another agent's band,
  where an agent reasoning "the 600s are full, take the 700s" would collide by applying the same
  correct rule. Both new ranges should be decided together and written into the generated table.
  Until then the generator reports the exhaustion every run rather than resolving it.
- **The id grammar forecloses the obvious escape.** Both the prose and table parsers accept
  exactly three digits, so a four-digit extension such as `T-1500` does not parse and is not
  available without a parser change. Not attempted here.
- The low-water mark is 10 free, chosen as a round number at which the decision is still cheap. It
  is not derived from a measured filing rate.
- Over-inclusion is deliberate: a number mentioned in any of these documents counts as spent, even
  in prose that only discusses it. This can overstate usage by a small amount and cannot
  understate it.
