# 2026-09-21-source-new-completed-phase-history-gap — Name missing completed-event history

## Release ID

`2026-09-21-source-new-completed-phase-history-gap`

## Status

`candidate`

## Plain-English Summary

A completed sourcing event could show an earlier phase as `No record`. That was factually cautious,
but too easy to read as an ordinary empty state even though the event had already reached its final
stage. The phase rail now calls this a `Historical gap`. Opening it explains that governed evidence
or a named waiver is required before anyone treats that phase history as complete.

This is a read-only presentation correction. It does not reopen an event, create a waiver, approve a
phase, or write evidence.

## Layer Impact

- **Products (layer 4 — Source):** completed-event phase status and explanatory copy.
- **Canonical model (layer 3):** unchanged; no record, schema, or authority changes.
- **Source adapters (layer 2) and client intake (layer 1):** unchanged.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: yes, wherever Source New renders a completed event with missing phase evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts`
- `src/lib/source/new-workspace/phase-state.test.ts`
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`

No migration, data job, route, approval path, or external communication is included.

## QA / Validation

- Red-first focused run: 2 failing assertions, 74 passing tests.
- Corrected focused run: 2 suites, 76 tests, all passing.
- Mutation proof: forcing the completed-event branch back to `no_record` failed both the state and
  rendered-workspace tests; source was restored afterward.
- TypeScript, ESLint, release control, and diff checks are required before the PR opens.

## Rollout Plan

Squash-merge through a protected PR. The repo-owned ACA main deploy workflow builds and deploys the
exact merge SHA. No migration, data load, flag, or manual runtime mutation is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: captured from the repo-owned deploy after merge.
- ACA runtime invariant: must pass before calling the change deployed.
- Worker image invariant: must match the approved web digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes; a completed event with missing phase history must show the
  new label and remediation copy.

## Rollback Plan

Revert the squash commit and redeploy through the same workflow. There is no data rollback.

## Audit Evidence

- Focused red/green and mutation output.
- PR checks and release-control output.
- Repo-owned deployment artifact and signed-in screenshot or DOM readback.

## Known Gaps

- This change identifies the missing history; it does not create the evidence or waiver.
- A positive end-to-end event spanning supplier readiness through award remains separately owed.
