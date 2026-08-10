# 2026-08-10-source-clean-workflow-cxo-audit - Source Clean Workflow and CXO Audit

## Release ID

`2026-08-10-source-clean-workflow-cxo-audit`

## Status

`candidate`

## Plain-English Summary

This candidate simplifies the Source event stage workspace so a user sees one active step list, one task canvas, and one gated forward action instead of competing workflow panels. It also adds a CXO-level audit of the full 11-stage Source event journey, artifact quality bar, intelligence gaps, and ranked follow-up backlog.

## Layer Impact

Products: Source event presentation changes only. The change reworks the stage canvas layout and upload affordance for the existing Source workflow without changing persistence, canonical data, loaders, migrations, or the live data plane.

Governance/docs: Adds a repo-tracked audit artifact and this release record so the change can be reviewed as a controlled release candidate.

## Client Applicability

- All clients: Applies to users who open Source event stage workspaces after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- `docs/codex-handoff/SOURCE_NEW_EVENT_CXO_WORKFLOW_AUDIT_2026-08-10.md`
- `docs/releases/records/2026-08-10-source-clean-workflow-cxo-audit.md`

## QA / Validation

- Dependency install: pass. `npm ci` completed in the clean worktree; npm reported existing audit warnings.
- Focused ESLint: pass for changed Source canvas, upload, and test files.
- Focused Jest: pass. Source shell v2 behavior, upload behavior, and clean workflow stage tests passed: 3 suites, 31 tests.
- Fast navigation suite: pass. 1 suite, 26 tests.
- Fast behavior suite: pass. 15 suites, 195 tests.
- TypeScript compile: pass with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Production build: pass with `NODE_OPTIONS=--max-old-space-size=8192 npm run build`; build emitted existing Turbopack broad filesystem trace warnings but exited successfully.
- Full integration suite: fail on existing broad-suite failures unrelated to this candidate: 341 suites passed, 122 failed, 1 skipped; failures include deterministic build-wave manifest expectations, agent/editorial fallback expectations, missing seeded Source event fixtures, and legacy Tower/source smoke assumptions.
- Local browser smoke: blocked for authenticated Source workspace proof. The requested Source event route redirected to `/sign-in` in local Clerk keyless mode; screenshot captured under `/Users/anand/Downloads/source-e2e-qa-20260810/predeploy-clean-branch-source-workflow-smoke.png`.
- Post-deploy signed-in Source route proof: blocked until approved ACA deployment.

## Rollout Plan

Merge through a PR, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged SHA. No manual ACA traffic mutation, environment mutation, data-plane load, migration, or operator job is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None approved for this candidate.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deployment before calling the change live-proven.
- Worker image invariant: Not expected to change, but runtime invariant proof should confirm no drift.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source event workspace and affected stage canvas states.

## Rollback Plan

Revert the UI/test/doc changes in a follow-up PR and redeploy through the same ACA main deploy workflow. No database rollback is required because this candidate does not change persistence or schema.

## Audit Evidence

- Clean-branch focused ESLint output.
- Clean-branch focused Jest output.
- Clean-branch fast navigation and behavior suite output.
- Clean-branch TypeScript compile output.
- Clean-branch production build output.
- Local browser smoke screenshot under `/Users/anand/Downloads/source-e2e-qa-20260810/`.
- Post-deploy ACA runtime invariant and signed-in browser evidence to be captured after deployment.

## Known Gaps

Authenticated browser proof and post-deploy production smoke are pending until this candidate is merged and deployed through the approved ACA path.
