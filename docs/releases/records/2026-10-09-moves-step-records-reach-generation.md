# 2026-10-09 — Step-page records reach the build and the next phase

## Release ID

`2026-10-09-moves-step-records-reach-generation`

## Status

`candidate`

## Plain-English Summary

The step pages save structured step records beside a phase's answers. P3 has
two: the root cause → design traceability and the chosen option with its
coverage. Two readers did not receive them.

- **The build's authoritative capture block.** This is the block that tells
  the model "use these captured values as the primary source". It listed only
  capture questions, so the records reached a P3 build only through the
  general phase digest, not through this block. It now lists each saved record
  as text through the same text dispatcher every reader uses. It never shows
  raw JSON.
- **The next phase's inherited capture.** A later phase inherits earlier
  capture only from modules marked completed. Records were always saved as in
  progress, so P4 never inherited them, although the pages say the choice and
  its coverage carry to P4. Completing a phase now completes its saved records
  exactly as it completes its answers. A record that was never saved is not
  created by completing the phase.

## Layer Impact

- Release lane: `global-control-lane`.
- Capture route: the step-record write follows the answers' status rule on
  phase completion.
- Generation: the decision context includes the phase's step records.
- Canonical model: no schema change.

## Client Applicability

- All clients: only Moves with saved step records see a difference. Today
  that is the synthetic demo tenant, the only tenant with the step-page flag.
- Specific clients: the synthetic demo tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed. The change only reads and completes records that
  the flagged pages wrote.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-capture/route.ts`: records
  complete with the phase.
- `src/app/api/v1/deliverables/generate-phase/route.ts`: the decision context
  lists the phase's step records.
- Tests for both.

## QA / Validation

- New cases pass:
  - capture route (3): a saved record completes with the phase; no empty
    record row is created; a record stays in progress until the phase
    completes.
  - generation route (1): the P3 decision context carries the traceability as
    ranked text, never JSON.
- Mutation checks pass: 8 mutations, each failing a test. They cover:
  - a record never completed, an unchanged record skipped at completion, an
    empty record row created at completion, and a missing completion date on
    a new row;
  - records missing from the decision context, and records passed as raw JSON.
- One guard was removed rather than tested. It overlapped the guard before it
  and could not change the result on its own.
- Combined run: pass, programs and deliverables routes and libraries (8,467
  tests).
- `npm run typecheck`: pass. ESLint: pass.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: on the demo Move:
  1. Save P3 Steps 1 and 2.
  2. Build P3 and confirm the decision context lists both records.
  3. After the P3 gate, confirm P4's carried capture includes them.

## Rollback Plan

Revert through a pull request. Records already marked completed stay valid
module rows, and inheriting them is correct.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.

## Known Gaps

- A record completed before this change stays in progress until the phase is
  completed again.
- The update path's completion date is not covered by its own test. The
  insert path is.
