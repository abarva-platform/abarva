# 2026-09-22 Source aVa Mounted Artifact Projection

## Release ID

`2026-09-22-source-ava-mounted-artifact-projection`

## Status

`candidate`

## Plain-English Summary

Source aVa stage-completion answers now use the same event-scoped evidence projection as the mounted
Files workspace: registered files plus the current stage's governed artifact-state records. This
keeps the stored count and required-artifact blockers consistent across the workspace and aVa.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes only the read-only Source aVa stage-completion projection.
- Layers 1-3: no intake, adapter, canonical row, artifact row, approval, parser, index, or graph state
  changes.

## Client Applicability

- All clients: yes, for Source New stage-completion questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Read current-stage artifact-state metadata alongside event-scoped registry files for stage answers.
- Use the combined set for lifecycle blockers and mounted-workspace counts, while retaining registry
  files as the only source of parse/index citations and detail rows.
- Preserve exact event and accepted tenant-alias fences for artifact-state rows.
- Add a live-shape regression covering 17 registry files, five current-stage records, and one
  opposite-event mutation row.

## QA / Validation

- RED FIRST: the focused suite proved the artifact-state reader was never called.
- PASS: the focused suite completed 13/13 tests after the implementation.
- MUTATION: removing the exact-event fence admitted an opposite-event record, changed the count from
  22 to 23, and failed the regression. The fence was restored afterward.
- PASS: TypeScript, scoped ESLint, release check, and `git diff --check`.
- Pending: hosted PR checks, repo-owned deploy, runtime invariant, and signed-in replay.

## Rollout Plan

Squash-merge through the protected pull-request path. Deploy only through the repo-owned Azure
Container Apps main workflow, prove the digest-pinned web and worker invariant, then replay the exact
stage-completion question signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none from this change.
- Approved image digest: pending repo-owned deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned workflow. No database or tenant-data
rollback is required.

## Audit Evidence

- Focused test output and mutation failure from this branch.
- Pull request and hosted checks.
- Repo-owned deployment run and runtime-invariant artifact.
- Signed-in replay of the exact stage-completion question after deployment.

## Known Gaps

- Deployment and signed-in replay remain pending.
- This release does not accept client-final artifacts, approve a stage, run parsers, contact
  suppliers, or make evidence agent-ready.

## Signed-in proof reconciliation (item C-548)

- Ran: a signed-in replay was run and is reported in the execution register at `2026-09-22T13:24:40Z`
  by `codex-cpo-source-new-smoke` against PR #8253 — the mounted-artifact projection was SIGNED-IN ACCEPTED on the frozen synthetic event after an exact deployed replay.
- Outcome as the register states it: reported as meeting this record's acceptance. The same line is explicit that no artifact was accepted, no stage approved and no supplier-facing action sent.
- Provenance: this section reconciles the durable record with the operator register under item
  C-548; it is not a first-hand observation by its author, and no proof was re-executed to write
  it. The QA/Validation bullet above was accurate when this record was authored and is superseded
  here by an appended correction rather than by a restamp, per the register time-authority rule.
