# 2026-09-19 Frozen Pattern Manifest

## Release ID

`2026-09-19-frozen-pattern-manifest`

## Status

`candidate`

## Plain-English Summary

An npm script promised to regenerate the intelligence pattern manifest and pointed at a generator that does not exist. The question was whether to restore the generator or declare the manifest hand-maintained. Measured, neither is true: the file is 19 MB with 3,569 entries, so nobody maintains it by hand, and rebuilding a generator would mean guessing at a corpus read three months ago. It is frozen. This removes the script that promised otherwise, records the frozen state where the module that reads the manifest will be seen, and closes the one-way gap in the gate that let the reconciliation baseline go stale.

## Layer Impact

- Release lane: `global-control-lane`.
- Package scripts, one reconciliation gate, and a documentation comment on a library module.
- No runtime behavior change. The removed script could not run.
- No schema change, no migration.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance and operator tooling only.

## Changes Included

- Remove the npm script that named a generator which does not exist. A script promising a repair path that cannot run is worse than no script, because it reads as one.
- Record the frozen state in the module that consumes the manifest: what the file is, when it was made, that nothing records what made it, and what a future defect in its contents actually costs.
- Remove that script's reconciliation-baseline entry in the same change, and one entry that was already stale because its own script had been deleted.
- Make the reconciliation gate fail on a stale baseline entry, not only on a new missing target. Stale means the script was deleted, the target file came back, or the script stopped naming that token.
- Report the baseline size and the stale count on a passing run, so the direction is visible rather than implied.

## QA / Validation

- PASS: the reconciliation gate passes with 56 baseline entries, 0 unbaselined missing targets, and 0 stale entries.
- PASS: mutation harness catches 4 of 4 across both directions — a baseline entry whose script no longer exists, one whose target exists again, a new script naming a file that does not exist, and re-adding the entry this change removed.
- Measured before changing: 58 baseline entries, every one carrying the same disposition; 1 of them already stale. The directory the removed script pointed into holds one file of the eight that scripts advertise.

## Rollout Plan

Merge through the protected pull-request lane. No deployment behavior changes.

## Rollback Plan

Restore the script line, its baseline entry, the already-stale entry, and the one-directional assertion. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Tooling and documentation only.

## Audit Evidence

- Measurement of the baseline's size, its single disposition, and its one stale entry.
- Gate output before and after.
- Mutation harness output across both directions.

## Known Gaps

**Six other scripts still name files in the same directory that do not exist**, and they are untouched here. They are a different question — whether those operator paths are wanted at all — and answering it for one script while silently deleting six would be a scope the item did not ask for. The measurement is recorded in the backlog so the next change starts from it.

Every one of the 56 remaining baseline entries carries the same disposition, which means the field records that something is missing without recording whether it should be restored or removed. A baseline where every row says the same thing is a list, not a classification. That is worth deciding and is not decided here.
