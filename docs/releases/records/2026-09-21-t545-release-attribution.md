# 2026-09-21-t545-release-attribution — Attribute a release verdict to the id it names

## Release ID

`2026-09-21-t545-release-attribution`

## Status

`candidate`

## Plain-English Summary

The execution queue reads an append-only register in which each agent records the item it is
working on and, later, that it has released it. The queue decided "this item has been released"
by looking for the word `RELEASED` anywhere on the line, and it matched the item id separately.
The two were never related to each other.

Register lines are long and discursive. One line routinely claims item A while mentioning that
another lane released item B, or closes by releasing a claim on a *file* while the item itself is
still at PR/CI. Every one of those read as a release of the item the line claims, so the queue
listed actively-held work under *Explicitly released* — which is an invitation for a second agent
to start editing files another agent already owns. That is the collision this register exists to
prevent.

The verdict is now attributed to the release token **nearest the id reference**, rejected when a
negator precedes it, rejected when another item id sits between the id and the token, and rejected
when the token is further from the id than any genuine release has ever been written. The same
nearest-token shape is already proven in `scripts/exec/register-time-authority.mjs` for merge
attribution.

Both remaining error directions are deliberately on the safe side. Reading a real release as a
hold hides finished work until the next line is appended. Reading a passing mention as a release
sends a second agent into files another lane owns.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only execution tooling. No client-facing surface, no
control-plane behavior shared with clients, no data plane.

- **Platform integrity / execution tooling only.** `scripts/exec/build-execution-queue.mjs` and its
  behavioral suite. This is operator tooling that reads an operator register and writes an operator
  document.
- **No product layer is touched.** Nothing under `src/` imports either file; no client intake,
  source adapter, canonical model or product surface changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — execution tooling used by the agent lanes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — `parseClaimRecord` now reports where on the line the id
  is written; new `announcesReleaseOf(line, idIndex, idLength)` decides the release verdict from the
  nearest release token, with a negator guard, an intervening-id rule and a measured reach; the call
  site uses it in place of `/\bRELEASED\b/.test(line)`.
- `scripts/exec/build-execution-queue.test.mjs` — six new behavioral cases (20a–20f).
- This release record.

## QA / Validation

**Red first, then green, over the same scope.** Clean baseline on `origin/main` `7c08708a3`:
`node scripts/exec/build-execution-queue.test.mjs` → **53 passed / 0 failed**. With the new cases
added and no fix: **55 passed / 3 failed**. With the fix: **59 passed / 0 failed**.

**Measured on the live register, both sides generated in this same run from one frozen snapshot** —
no earlier snapshot reused. 817 lines parse as claim records. Lines reading as a release:
**108 before → 103 after**; the **five** that flip are every one a misattribution, and all flip in
the `released → held` direction:

| line | distance from id to token | what the token was actually about |
|---|---|---|
| `item 25` 2026-09-19T07:45Z | 631 | the release of a *file* claim, while the item was at deploy-readback |
| `item 25` 2026-09-19T08:05Z | 908 | the same |
| `item 126` 2026-09-20T03:13Z | 251 | `RELEASED T-005` — a different item, named 251 characters earlier |
| `item T-530` 2026-09-21T18:02Z | 793 | another lane's release of a shared file |
| `item T-530` 2026-09-21T18:10Z | 457 | the same |

**Bucket movement on the live register: exactly one id moves,** `#126` from *Explicitly released* to
*Expired but WORK IN FLIGHT*. The other four misattributions are not the newest line for their id
today, so they no longer decide a bucket — but they did when they were newest. Replaying the
register truncated immediately after the 18:02Z line (the instant that line *was* newest for T-530):
old code puts **T-530 under "Explicitly released"** while it was actively held; new code puts it
under **"Expired but WORK IN FLIGHT — do not take"**. That is the live harm, reproduced and repaired.

**Residual, stated rather than implied.** The reach is 120 characters. The furthest genuine release
measured is 54 and the nearest misattribution is 251, so the bound sits inside an empty band with
better than 2x margin either way — but it is a measurement of this register, not a proof. A genuine
release written with more than 120 characters between the id and the word would be read as held.
Separately, the `item 126` line intended to release `T-005` and the id parser never sees `T-005` at
all, because it takes the first `item <id>` on the line; after this change that line releases
nothing, which is right for `126` and still silent about `T-005`. Id *parsing* is out of scope here.

**One correction to the filed item.** It named the five far lines as `#25` twice, `T-530` twice and
`#54` once. Measured, the fifth is **`#126`**, not `#54`: the `#54` line reads `RELEASED item 54`
with the token adjacent, and is a genuine release that this change leaves alone.

**Mutation testing: eight mutations, eight caught — after one recorded escape.**

| # | mutation | result |
|---|---|---|
| 1 | revert the call site to the whole-line test | 3 failed |
| 2 | drop the negator guard | 1 failed |
| 3 | drop the intervening-id rule | 1 failed |
| 4 | drop the reach bound | 1 failed |
| 5 | never release anything (anti-tautology decoy) | 5 failed |
| 6 | widen the reach to the whole line | 1 failed |
| 7 | comment naming every control, none of them run | 3 failed |
| 8 | take the first token instead of the nearest | **escaped, then caught** |

Mutation 8 escaped on the first pass and the suite was strengthened rather than the score accepted:
no case had two release tokens on one line, so the nearest-token loop was an unreached branch. Case
20f now puts a far token about another lane's fixture before the id and a near one after it, and the
mutation fails it. Mutations 2 and 4 also escaped a first draft of the fixtures, for the same class
of reason — the fixture branch names repeated the item id, so the intervening-id rule caught those
lines before the negator or the reach could be reached. Both fixtures were rewritten to isolate one
rule each, and the comments say so.

Also: `npx eslint scripts/exec/build-execution-queue.mjs scripts/exec/build-execution-queue.test.mjs`
exit 0. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0 (exit code
judged, not grepped).

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow runs on merge as it does for
every change; nothing in this change reaches a runtime image, a worker job, a flag or an env var.
No migration, no data build, no manual Azure command.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified
- Shared runtime mutators: none
- Approved image digest: whatever the merge run publishes; unchanged by this diff
- ACA runtime invariant: asserted by the merge run's own proof artifact
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — no file under `src/` imports either changed script, so no
  client-visible surface can reach this code. Stated as not applicable rather than as passed.

## Rollback Plan

Revert the single commit. The change is two files and has no state: the queue is regenerated from
the register on every run, so reverting restores the previous verdict immediately with nothing to
migrate or clean up.

## Audit Evidence

- The PR and its checks.
- `node scripts/exec/build-execution-queue.test.mjs` — 59 passed / 0 failed, including cases 20a–20f.
- The before/after bucket counts and the one moving id, both generated in the same run from one
  frozen register snapshot.
- The truncated-register replay showing `T-530` moving out of *Explicitly released*.
- The eight-mutation table above, reproducible by applying each mutation and re-running the suite.

## Known Gaps

- The reach is a measurement of this register at a point in time, not a proof. It errs toward
  `held`, which hides work rather than causing a collision.
- Id *parsing* is unchanged and still takes the first `item <id>` on a line, so a line whose subject
  is written without the `item` prefix (`RELEASED T-005 | ... | item 126`) attributes to the wrong
  reference before any verdict is computed. Filed separately rather than absorbed here.
- No signed-in acceptance is owed; none is claimed.
