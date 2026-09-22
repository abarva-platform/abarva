# 2026-09-22-t578-blocker-corpus-evidence-kinds — Derive the board's blocker from the item body and its claim log as separate evidence

## Release ID

`2026-09-22-t578-blocker-corpus-evidence-kinds`

## Status

`candidate`

## Plain-English Summary

The execution board decides, for every backlog item, whether that item is waiting on a
person. Until now it made that decision by reading one flat string: the item's own text
glued together with every line of the append-only claim log that names it.

Those are two different kinds of evidence. The item's text is a statement about the item.
A claim-log line is a run log — it records what an agent set out to do. So a line reading
"claimed, lane T; decide which vocabulary is authoritative before writing any code" went
on reading as an unanswered question for as long as that line existed, which is forever:
the log is append-only and a line is never restamped. The item could be decided, built,
merged and deployed, and the board would still say someone owed it an answer.

Measured on the live backlog before this change: 12 of 411 items were marked as waiting on
a person on the strength of a claim line their own text does not support. All 12 had
already shipped, so today the cost is a wrong label on a finished item rather than hidden
work — but the same reading decides the fate of an item that has *not* shipped, and there
a stale line would hide live work instead of mislabelling finished work.

What changed is the input, not the patterns. The patterns were right. Once an item's own
source records that it shipped, its decision gate is read from the item's text alone. Two
things are deliberately unchanged, and each is held by its own test: every other kind of
blocker still reads the claim log at every stage, and an item that has not shipped still
reads its claim lines for a decision gate — that is the direction that would hide live
work, and it is left exactly as it was.

This also adds two backlog ids to the repo-owned structure map. The map is what lets the
generated queue offer an item at all, and both ids were filed while the map was under
another lane's live claim, so the board had been reporting them unplaced.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only operations tooling — the script that
derives the execution board and the claimable queue an agent takes its next item from. It
ships no product capability and is not gated by a flag.

- **Layer 4 (Products):** none. No product surface, route, component or tenant-facing
  behaviour is touched.
- **Layer 3 (Canonical model):** none. No schema, migration, loader, adapter or projection.
- **Operator tooling only:** `scripts/exec/build-source-board.mjs` derives the board and
  summary from operator documents supplied through `--operator-root`. It reads those
  documents and writes generated artifacts that are never committed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — the execution board and claimable queue used to route agent work
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — `deriveBlocker` now takes the item body, the
  claim corpus and the derived rung as separate arguments instead of one concatenated
  string. The decision rule is tagged `decisionGate` and reads the body alone once the
  rung is `merged`, `deployed` or `proven`. `closed` is deliberately excluded: it asserts
  no shipping proof, and no closed-rung item is affected either way (measured).
- `scripts/exec/build-execution-queue.test.mjs` — four new behavioural cases (23a–23d).
- `scripts/exec/source-stage-map.json` — adds `T-578` and `T-598`, which the board had
  been reporting as unplaced.

## QA / Validation

**Premise re-verified on `main` at `a1a6b82c8` before any code was written**, with an
instrumented copy of the generator rather than by reading it. For the real known positive:
the item body alone yields no blocker, and the claim corpus alone yields `Decision needed`,
matching inside that item's own claim line. The filing is accurate as written.

**Behavioural suite** — `node scripts/exec/build-execution-queue.test.mjs`, which runs both
generators as real child processes against synthetic operator documents:

| | result |
|---|---|
| before the fix, with the four new cases in place | **115 passed, 2 failed** |
| after the fix | **117 passed, 0 failed** |

The two that failed first are the two defect cases. The other two new cases are controls
and passed before and after — they exist to pin what must *not* change.

**Mutation check — the guard is proven able to fail, three ways:**

| deliberate break | result |
|---|---|
| decision rule reads the combined corpus again (the pre-fix behaviour) | 115 passed, **2 failed** (23a, 23d) |
| claim lines dropped from the blocker corpus entirely | 115 passed, **2 failed** (23c, 23d) |
| every item treated as having shipped | 116 passed, **1 failed** (23c) |
| restored | 117 passed, 0 failed |

The second mutation matters: a fix that simply stopped reading the claim log would satisfy
the item's headline and silently break the two properties this narrowing is scoped around.

**Blast radius on the live backlog, measured rather than estimated.** Both generators run
over identical copies of the same operator documents, once with `origin/main`'s code and
map and once with this branch's:

| | count |
|---|---|
| items whose derived rung and blocker are unchanged | **397** |
| items whose blocker changed | **12** |
| items newly present, from the two map additions | **2** |
| items lost | **0** |

All 12 changed items sit at rung merged, deployed or proven. None is at rung 0, so no item
that has yet to ship changes state.

**Acceptance criteria, each checked by name:**

- the target item stops reading `Decision needed` — confirmed, `"Decision needed"` → `null`
- the five named control items keep theirs — confirmed for all five, including two at rung
  merged and deployed whose gate is declared in their own text, which a cruder
  "it shipped, so nothing is owed" rule would have broken
- **the claimable count must not move** — confirmed, `0 claimable` before and after
- ids unplaced on the structure map: `2` → `0`

`npx eslint` exit 0. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
judged by exit code, not by grepping its output.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is built into an image, served by a
route, or read by a Container App. The repo-owned deploy workflow will run on merge as it
does for every commit, and this change is not part of what it ships.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no `az containerapp` command, no traffic or revision change
- Approved image digest: not applicable; no runtime image is built or pinned by this change
- ACA runtime invariant: unaffected — no web or worker template is touched
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and the reason is stated rather than assumed —
  this code never runs in the deployed product. It is an operator script executed locally
  and in the behavioural suite. A signed-in check would prove nothing about it.

## Rollback Plan

Revert the single squash commit. The generated artifacts — `source-board.html`,
`source-board-summary.json`, `EXECUTION_QUEUE.md` — are rebuilt from source on every run
and are not committed, so a revert followed by one regeneration restores the previous
board exactly. No migration, no data, nothing to unwind.

## Audit Evidence

- PR and its CI run
- `node scripts/exec/build-execution-queue.test.mjs` — 117 passed, 0 failed
- the before/after counts and the three mutation results recorded above
- `node scripts/release-check.mjs --base origin/main --head HEAD`

## Known Gaps

- **A body-declared decision gate can still be masked by a claim line.** The rules are
  tried in a fixed order and the signed-in rule comes first, so for 13 items the item's own
  text declares a gate and a claim line's signed-in language wins the label. All 13 are at
  merged, deployed or proven today. This is the same conflation of two kinds of evidence,
  in the opposite direction, and it is deliberately **not** fixed here: repairing it moves
  13 items between display buckets and is not what this item asked for. It is filed as its
  own backlog item with the measurement attached.
- The rung corpus still concatenates claim text with item text, so an item's stage can be
  read from a claim line's narration. Out of scope here; the blocker corpus was the filed
  defect.
- One of the two ids added to the structure map is gated on an owner's answer and will
  appear in the board's blocked bucket, which is the correct and honest placement for it.
