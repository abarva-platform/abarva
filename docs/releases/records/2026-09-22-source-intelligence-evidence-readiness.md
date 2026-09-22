# 2026-09-22-source-intelligence-evidence-readiness — Align Source intelligence with governed evidence readiness

## Release ID

`2026-09-22-source-intelligence-evidence-readiness`

## Status

`candidate`

## Plain-English Summary

Source Intelligence now names open required evidence and directs the operator to Files when a stage's governed evidence checklist is incomplete. Deterministic stage insights remain visible, but they no longer sit beside copy that claims no gaps or no further action while required evidence is open.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Source Intelligence brief consumes the same governed requirement rows already rendered by the Files workspace.
- Canonical model: unchanged. No evidence state, approval, artifact, or event record is written or reclassified.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add a pure readiness-brief helper over governed stage evidence rows.
- Pass the current event's evidence states into the mounted Intelligence workspace.
- Add a behavioral regression for a completed Value stage with three required evidence gaps and a preserved deterministic insight.

## QA / Validation

- PASS: red-first behavioral test reproduced the contradiction before the fix.
- PASS: mutation proof confirmed the behavioral test fails when open required rows are ignored.
- PASS: focused Jest and scoped ESLint.
- PASS: Node 24 TypeScript (`typecheck: clean`), release check, and test-coverage census write/check.

## Rollout Plan

Squash-merge after applicable checks pass. The repo-owned ACA main workflow builds and deploys the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; replay the completed-stage Intelligence view and verify required gaps, next action, and deterministic insight agree.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main workflow. No data rollback is required.

## Audit Evidence

- Focused behavioral test output and mutation proof.
- Pull request checks and release check.
- Repo-owned deployment artifact and signed-in replay after deploy.

## Known Gaps

This release does not repair historical approval metadata, change evidence readiness, or write missing evidence. It only reconciles the mounted Intelligence explanation with the existing governed readiness state.
