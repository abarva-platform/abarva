# 2026-09-22-place-one-invisible-backlog-id — Place one backlog id the structure map does not have

## Release ID

`2026-09-22-place-one-invisible-backlog-id`

## Status

`candidate`

## Plain-English Summary

The execution board is generated from a hand-maintained structure map that says
which backlog ids belong where. An id that is in the backlog and in no map entry
is reported as unmapped, and the generated queue never offers it — so the item
exists, nobody sees it, and the agent that filed it has no way to notice. One id
is in that state. This places it. One line, no behaviour change.

## Layer Impact

**Release lane: `internal-admin`.** Repository execution tooling only. No layer
of the data operating model is touched: no intake, no adapter, no canonical
object, no product surface.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/source-stage-map.json` — one id added to the platform-integrity
  track's item list.

## QA / Validation

- `node scripts/exec/build-execution-queue.test.mjs` — **107 passed, 0 failed**
  with the change in place.
- The map parses as JSON.
- Board regenerated against the operator root: **no unmapped ids**, and the
  queue's claimable count rises by exactly one — the id being placed — with no
  other row changing bucket.

## Rollout Plan

Merge to `main`. No runtime rollout: this file is read by a local generator and
by the generator's own test. Nothing serves it.

## Deployment Authority

- Repo-owned deploy workflow: runs on merge as it does for every commit.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — the diff is one entry in a generator's
  input file; no route, component or tenant read path is in it.

## Known Gaps

- **The map is hand-maintained, which is why this keeps happening.** Placing an
  id is a pull request, and an agent that files an item at the end of its run
  has every incentive to skip it. The generator reporting unmapped ids is the
  backstop, and it only helps someone who runs the generator.
- **This places one id; it does not stop the next one.** Deriving placement, or
  failing a check when an id is filed without one, is the actual fix and is not
  attempted here.

## Rollback Plan

Revert the commit. The id returns to being reported as unmapped; nothing else
changes.

## Audit Evidence

- The generator suite run in this pull request.
- The board generator's `unmapped` output, empty after the change.

## Disclosure Note

This repository is public. The record and the commit describe the mechanism —
an id present in one file and absent from another — and name no item content,
no tenant and no incident narrative.
