# 2026-09-21-t530-register-order-authority — Name the claim resolver's ordering authority, and report where the two orders disagree

## Release ID

`2026-09-21-t530-register-order-authority`

## Status

`candidate`

## Plain-English Summary

The execution register is an append-only log. Every line carries a timestamp, and
the generated board and queue both resolve "the newest line for an item wins" from
that log. There are two different orders in the file and they are not the same
thing: the order lines were **appended**, and the order of the **timestamps** they
carry. The item that prompted this work asserted the resolver used append order.

It does not. Established by execution, not by reading: the resolver uses the
**stamp**, and falls back to append position only when two stamps are equal. The
premise was backwards, and the fact that an experienced reader got it backwards
from the code is itself the defect — the authority was never named.

Measured on the live register, the two orders disagree on **14 of 283 ids**, and on
**5 of those the item lands in a different bucket**. Three of the five are the
difference between `released` and `expired-in-flight` — the difference between work
the queue offers and work it hides. Nothing downstream said so.

This change does two things and deliberately not a third:

1. **Names the authority** in both resolvers, with a self-test that fails if either
   half of it is changed.
2. **Reports the disagreement** in the generated queue, listing each affected id,
   which line each order picks, and which bucket each produces.
3. **Does not switch the authority.** Which order is right for a pair of lines
   written by two different lanes within the same minute is an owner call, not a
   resolver detail. It is filed as `T-544` with a recommendation.

Bucket counts are byte-for-byte unchanged by this release: 0 claimable,
134 blocked on Anand, 6 held, 110 expired-idle, 102 expired-in-flight, 65 released
both before and after.

## Layer Impact

**Release lane: `internal-admin`** — AbarVa-only execution tooling. No product
layer. This touches execution-control tooling only —
`scripts/exec/build-source-board.mjs`, `scripts/exec/build-execution-queue.mjs` and
the queue's behavioral contract. Layers 1–4 of the enterprise information
architecture are untouched; no tenant data, canonical object, adapter, loader or
product surface is read or written.

## Client Applicability

- All clients: none
- Specific clients: none
- Internal only: yes — agent execution tooling and the generated operator queue
- Public/demo only: none
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — `readClaims()` now records, per id, both
  the stamp-order winner and the append-order winner, compares them by object
  identity, and returns the disagreements. New `renderOrderDisagreements()` prints a
  section naming each disagreeing id, the line each authority picks, and the bucket
  each produces. The section is omitted entirely when the two orders agree.
- `scripts/exec/build-source-board.mjs` — `latestClaim` renamed to
  `latestClaimByStampThenAppend`, the authority documented, and two inline
  self-tests added in the file's existing idiom. Both fixtures are built so the two
  orders **disagree**; a fixture where they agree cannot fail whichever authority the
  function uses.
- `scripts/exec/build-execution-queue.test.mjs` — four behavioral cases (16–19).
- No behavior change to which line wins, in either script.

## QA / Validation

Baseline over the same scope, on `origin/main` `ed94a727176e5b0b5821e974561d010b30c84321`:

| | suite |
|---|---|
| before | **37 passed, 0 failed** |
| after the four new cases, before the fix | **40 passed, 1 failed** |
| after the fix | **41 passed, 0 failed** |

The one failing case before the fix is the defect case: an id whose two orders
disagree was not named anywhere in the generated queue.

**The measurement was taken twice, by two independent implementations, and they
agree.** A throwaway script replicating the resolver's regexes reported 14
disagreeing ids and 5 bucket changes, naming `#44 #54 T-019 T-020 T-401`; the shipped
code, run against the same register, reports the same 14, the same 5, and the same
five ids. The shipped code was not written from the throwaway's output.

**Bucket drift: none.** The generator was run against the real register before and
after. Both runs print `0 claimable, 134 blocked on Anand, 6 held, 110 expired-idle,
102 expired-in-flight, 65 released`.

**Seven mutations, seven caught.**

| # | mutation | caught by |
|---|---|---|
| M1 | queue: primary authority flipped to append order | case 16 + case 18 fail |
| M2 | queue: equal-stamp tie-break `>=` → `>` | case 17 fails (+ the existing release case) |
| M3 | queue: report printed unconditionally | case 19 fails |
| M4 | queue: report never printed | case 18 fails |
| M5 | **comment decoy** — the exact heading text present only in a comment | case 18 still fails |
| M6 | board: primary authority flipped to append order | board build throws; suite exits 1 |
| M7 | board: equal-stamp tie-break `>=` → `>` | board build throws; suite exits 1 |

M5 is the one this backlog exists for: the gate that started all of this proved a
control existed by finding its name in the file. Putting the exact heading string in
a comment does not satisfy this one, because the assertion reads the **rendered
queue**, not the source.

M6/M7 were also run through the behavioral suite rather than only by invoking the
board directly, to prove the board's inline self-test reaches CI: the suite builds a
board in a child process for every fixture, so a thrown self-test surfaces as a
non-zero suite exit (`suite exit=1`, observed).

- `node scripts/exec/build-execution-queue.test.mjs` — 41 passed, 0 failed. Already
  wired into `.github/workflows/execution-queue-toolchain.yml` step *Run the
  execution queue behavioral contract*, so the four new cases run in CI on arrival.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**
  (judged on exit code; a bare `npx tsc` exits 134 on this machine with no
  diagnostics).
- `npx eslint` on the three changed files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the PR.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: nothing in `src/` imports any of
these three files, so no route, component, server action or worker can reach this
change. The repo-owned ACA deploy workflow will run on merge as it does for every
commit; its digest proof is recorded for the runtime invariant, not because this
release alters runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified
- Shared runtime mutators: none; no `az` command is run by this release
- Approved image digest: whatever the repo-owned workflow builds for the merge SHA
- ACA runtime invariant: asserted from the merge run's own artifact after merge
- Worker image invariant: asserted from the same artifact
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no**, and the reason is structural rather than a
  judgement call — no file in `src/` imports any of the three changed scripts, so no
  client-visible surface can reach this change

## Rollback Plan

Revert the squash commit. There is no migration, no data write and no runtime state,
so a revert is complete on its own. The only externally visible effect is that the
generated queue stops printing the disagreement section; bucket assignment is
identical with or without this change, so nothing an agent acts on reverts with it.

## Known Gaps

- **The authority is named, not settled.** This release records which order the
  resolver uses and where the two disagree; it does not decide which order
  *should* win when two lanes write about one item inside the same minute. Filed
  as `T-544` with a recommendation. Until that is decided, the five ids named in
  the queue's new section carry a verdict that may not be the register's last
  written word.
- **The disagreement report is informational, not a gate.** It prints; it does
  not fail anything. Making it a gate would fail on arrival on 14 ids, which is
  the fail-on-arrival pattern this backlog has already paid for once.
- **283, not 363.** The item asked for the disagreement count "on how many of the
  363 ids". 363 is the number of ids in the backlog; only 283 appear in the
  claim log at all, and an id with no claim line has no two orders to disagree.
  The denominator reported here is 283 deliberately.
- **Minute-precision stamps make ties ordinary.** The tie-break is exercised by a
  fixture but its real-world frequency is not measured here.
- **This change found a second defect in the same family and did not fix it.**
  `readClaims()` decides the release verdict with `/\bRELEASED\b/` over the whole
  line, unrelated to where the id appears — so a line claiming one item while
  *mentioning* another item's release reads as a release. Found live on this
  item's own claim line, 798 characters from the id reference, which put an
  actively-held item on the queue's *Explicitly released* line. Measured: 102
  lines parse as a release, 5 of them with the token 462–913 characters from the
  id. Filed as `T-545`. Deliberately **not** fixed here, because that repair moves
  items between buckets and this release's whole claim is that no bucket moved;
  folding the two together would make the diff the thing nobody reads. The live
  register was corrected by appending a line at 18:12Z, not by restamping.
- **Not live-proven, and none is owed.** Nothing in `src/` imports these scripts.

## Audit Evidence

- PR URL and CI run for `Execution queue behavioral contract`, which prints all 41
  cases by name
- The before/after generator output showing identical bucket counts
- The mutation table above, each row reproducible by the one-line edit it names
- `docs/ops/deployment-register-time-authority.md` (item T-457) for the drift
  measurement this change cites
