# 2026-09-21-map-t472-t473-so-the-queue-can-dispatch

## Release ID

`2026-09-21-map-t472-t473-so-the-queue-can-dispatch`

## Status

`candidate`

## Plain-English Summary

Two newly filed ids were not on the structure map, so the board build exited 1
and the execution queue could offer nothing at all — to any lane.

| | before | after |
|---|---|---|
| Board build | **exit 1** | **exit 0** |
| Ids not placed | 2 (`T-472`, `T-473`) | **0** |
| Vision completion | 43.1% | **43.1%** |

The completion figure is listed because it is the check that matters when
touching this file: a placement that moved the number would mean an id had been
attributed to a stage it does not belong to.

## Where they went, and why

- **`T-472` → platform track.** The next draw of stale, unrun test suites. It
  audits coverage and advances no lifecycle stage, which is that track's own
  stated test.
- **`T-473` → stage 6, RFI / RFP.** The F4 residual behind the neutral "Market
  package" phase label. Its subject is the RFx phase of the Source New
  workspace, so it is placed on the stage it concerns rather than parked on a
  track that would hide it.

## The diff is three lines, deliberately

A first attempt reserialised the file with `json.dump`, which produced **247
insertions and 67 deletions** for a two-id change: the same content, formatted
differently. That was discarded and replaced with a textual insertion.

This file is edited concurrently by more than one lane. A reformatting diff
would conflict with every other edit in flight and bury the actual change in
noise, and a reviewer could not see what moved.

## Layer Impact

- `global-control-lane`. One structure-map data file. No product surface,
  tenant data, schema, projection, migration, flag, code path, or runtime
  behaviour. The map holds structure only — no status, rung, evidence or dates.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — operator tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/source-stage-map.json` — two ids placed.

## QA / Validation

| What | Result |
|---|---|
| Board build | exit 1 → **exit 0** |
| Ids not placed | 2 → **0** |
| Vision completion, before and after | **43.1% → 43.1%** |
| JSON parses | yes |
| Diff size | **3 insertions, 1 deletion** |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. The next board run dispatches again. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The two ids become invisible to the queue again and the board
build fails until they are replaced.

## Audit Evidence

- Board exit code and unmapped count, before and after.
- Vision completion identical across the change.

## Known Gaps

- **Placing an item is not triaging it.** Nothing here says whether either
  premise holds.
- **This is the fifth time today the board has been down on unmapped ids**, and
  the interval is shortening as filing accelerates. The blocking behaviour is
  what produces prompt placement, so it is not weakened here — but a holding
  bucket that kept the board generating while still showing the items as
  unplaced would turn "no information" back into "partial information". That
  remains a question for whoever owns the queue, recorded rather than taken.
