# 2026-10-09 — P2's short name reads "Discover"

## Release ID

`2026-10-09-moves-p2-short-label-discover`

## Status

`candidate`

## Plain-English Summary

P2's full name is "Discover & Diagnose", but its short name, used on the phase
rail, phase chips, the Moves Home roster, gate-approval events, the sponsor and
engagement phase steppers and model prompts, read "Diagnose". The finalized
Moves design calls P2 "Discover" everywhere a short name appears, and the
product owner confirmed that name. This change makes the short name "Discover".
The full name is unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: every surface that reads `PHASE_LABELS_SHORT` or the
  phase roster, plus the Moves Home roster's own P2 entry.
- Canonical model: none. Phases remain integers; only the display label moves.

## Client Applicability

- All clients: yes (display label only).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/phase-labels.ts`: `PHASE_LABELS_SHORT[2]` is `Discover`.
- `src/components/strategic-moves/StrategicMovesHomeClient.tsx`: P2 entry.
- Tests that pin the canonical short name (labels, roster, chip, rail, gate
  events, engagement and sponsor steppers) now pin `Discover`; the full name
  `P2 Discover & Diagnose` stays pinned.

## QA / Validation

- Every suite naming "Diagnose" (40 files, 1,090 tests) passes.
- `npm run typecheck` passes.

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow deploys the digest-pinned image. No flag, migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: the Moves phase rail shows "Discover" for P2.

## Rollback Plan

Revert through a pull request. No data needs repair.

## Audit Evidence

- Pull request and CI results.

## Known Gaps

Surfaces that keep their own local phase arrays instead of reading the
canonical labels (for example demo seed scripts and the Source workspace's
unrelated "Diagnose" method stage) are not changed here; they are not Moves
phase names. Older generated documents keep the name they were built with.
