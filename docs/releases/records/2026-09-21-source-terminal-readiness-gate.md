# 2026-09-21-source-terminal-readiness-gate — Enforce readiness before event completion

## Release ID

`2026-09-21-source-terminal-readiness-gate`

## Status

`candidate`

## Plain-English Summary

Approving the final stage of a Source event used to validate the reviewer checkboxes but skip the
computed artifact, evidence, and criterion readiness check because the journey had no next stage.
Terminal approval now runs the same governed readiness contract before it can mark the event
completed. An open required criterion, missing gate scaffold, or unverified supporting evidence
therefore blocks completion instead of relying on attestation alone.

The change does not reopen or rewrite completed events. Existing historical gaps remain visible as
historical gaps.

## Layer Impact

- **Products (layer 4 — Source):** the existing approval API applies computed readiness to terminal
  closure as well as ordinary stage advancement.
- **Canonical model (layer 3):** unchanged; the route reads existing gate substrate and writes the
  same lifecycle and approval records only after the guard passes.
- **Source adapters (layer 2) and client intake (layer 1):** unchanged.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: yes, for Source events approved at their journey's terminal stage.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Extend the existing Source gate contract with an explicit terminal-closure mode.
- Run computed readiness before the terminal approval write.
- Add route and contract tests proving an open terminal criterion writes nothing.

No migration, data job, tenant-data change, external communication, or supplier action is included.

## QA / Validation

- Red-first proof: terminal approval returned `200` while a required final-stage criterion was open.
- Corrected focused run: four suites, 65 tests, all passing.
- Mutation proof: removing the terminal readiness branch restored the unsafe `200`; the route test
  failed and the source was restored.
- Scoped ESLint passed.
- TypeScript, release control, and diff checks are required before the PR opens.

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
- Live signed-in proof required: yes; a terminal event with an unresolved gate must remain blocked,
  and a ready terminal event must still complete.

## Rollback Plan

Revert the squash commit and redeploy through the same workflow. There is no data rollback.

## Audit Evidence

- Focused red/green and mutation output.
- PR checks and release-control output.
- Repo-owned deployment artifact.
- Signed-in terminal approval acceptance on governed test fixtures.

## Known Gaps

- Already-completed historical events are not rewritten or reopened.
- Positive and negative signed-in terminal fixtures are required after deployment; no live approval
  is performed by this release candidate.
