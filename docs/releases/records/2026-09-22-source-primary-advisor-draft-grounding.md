# 2026-09-22-source-primary-advisor-draft-grounding — Source primary Advisor draft grounding

## Release ID

`2026-09-22-source-primary-advisor-draft-grounding`

## Status

`candidate`

## Plain-English Summary

Source primary Advisor answers now use the event artifact registry when describing Define evidence readiness. If the registry already shows a Scope Memo as a generated draft awaiting review, the primary answer must describe that registered draft state instead of repeating stale missing-artifact wording. Truly absent evidence, such as an Exclusion Log with no registered artifact, remains listed as missing.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes Source aVa/Advisor answer grounding and deterministic pre-return text repair for grounded Source event turns.
- Layer 3, Canonical Model: no canonical data, artifact rows, lifecycle states, approvals, parser status, search status, or tenant records are changed.

## Client Applicability

- All clients: yes, for Source event Advisor answers about evidence readiness or stage completion.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Primary Source mode grounding matches provide-tasks to registered artifacts by stage and canonical artifact specification.
- Registered generated drafts are surfaced as registered artifacts awaiting review rather than missing files.
- The Source answer quality gate detects and repairs primary text that calls a registered artifact unregistered.
- The chat route emits gated grounded Source answer text, while preserving the existing context-bundle artifact and telemetry.
- Focused tests cover grounding, final gated text, and route wiring.

## QA / Validation

- PASSED: red-first `npx jest src/lib/source/ava/__tests__/mode-grounding.test.ts --runInBand --no-coverage` failed before implementation because the grounding listed both Scope Memo and Exclusion Log as missing.
- PASSED: `npx jest src/lib/source/ava/__tests__/mode-grounding.test.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand --no-coverage`.
- PASSED: mutation proof disabling the registered-artifact grounding branch caused the focused mode-grounding regression to fail; the implementation was restored afterward.
- PASSED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASSED: `npx eslint src/lib/source/ava/mode-grounding.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/lib/source/ava/answer-quality-gate.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`.
- PASSED: `git diff --check`.
- PASSED: `npm run release:check`.
- Pending before merge: hosted PR checks.

## Rollout Plan

Squash merge to `main`; the repo-owned Azure Container Apps workflow may build and deploy the exact merged revision. No manual deploy, data-plane job, migration, parser/indexer job, lifecycle transition, approval action, vendor contact, or tenant-data write is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: none from this branch.
- Approved image digest: pending repo-owned deploy workflow.
- ACA runtime invariant: required after deployment before any live claim.
- Worker image invariant: required after deployment if worker images are reported.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling the behavior live-proven. Not performed in this candidate record.

## Rollback Plan

Revert the squash merge and allow the repo-owned deployment workflow to restore the prior answer-grounding behavior. No migration rollback or data correction is required.

## Audit Evidence

- Focused test output and mutation proof output from this branch.
- Pull request checks and squash commit after PR creation.
- Repo-owned deploy/runtime-invariant artifact after merge.
- Signed-in Source New readback after deployment; not claimed by this candidate.

## Known Gaps

- This release does not prove the signed-in production path.
- This release does not create, approve, parse, index, or transition any artifact.
- This release does not change the structured governed answer packet already covered by the earlier artifact-draft grounding release record.
