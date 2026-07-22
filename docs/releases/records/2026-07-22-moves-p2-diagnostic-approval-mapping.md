# 2026-07-22-moves-p2-diagnostic-approval-mapping — Moves P2 Diagnostic Approval Mapping

## Release ID

`2026-07-22-moves-p2-diagnostic-approval-mapping`

## Status

`candidate`

## Plain-English Summary

Moves client approval now maps ambiguous P2 artifact titles like "Discovery & Root Cause Diagnostic" to the signed `discovery_report` deliverable that the P2 gate actually evaluates. Previously the fallback title heuristic could resolve those artifacts as `root_cause_worksheet` because "root cause" appeared before "discovery" in the matcher. That meant a reviewer could accept the diagnostic artifact and still see P2 blocked at 4/5 because the gate never saw a signed discovery report.

## Layer Impact

- `global-control-lane`: Updates shared Moves approval mapping behavior for generated Move artifacts.
- Governance runtime: Preserves strict P2 gate evaluation while aligning the client-approval bridge with the deliverable type the gate reads.

## Client Applicability

- All clients: Applies to generated Move board-pack artifact approvals when explicit deliverable metadata is missing and the route falls back to title inference.
- Specific clients: Discovered through FS Demo sandbox proof on the First Capital E2E Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts`
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts' --runInBand`
- Pass: `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts'`
- Pass: `git diff --check`
- Pending before release: `npm run release:check`
- Pending after deploy: signed-in browser/API proof that accepting the FS Demo P2 diagnostic creates a signed discovery-report deliverable path and allows P2 gate evaluation to consume it.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deploy, verify the ACA runtime invariant and run signed-in FS Demo sandbox proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable; web/API route change only.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No database migration or tenant data rewrite is included.

## Audit Evidence

- Before-fix proof: `proof/133-fs-moves-e2e-p2-final-advance` showed P2 still blocked at 4/5 after accepting the diagnostic artifact.
- Before-fix analysis: P2 gate reads signed `discovery_report`; fallback approval mapping checked `root cause` before `discovery/diagnosis/diagnostic`.
- PR URL: Pending.
- ACA revision and digest: Pending deploy.
- Signed-in proof: Pending deploy.

## Known Gaps

- This does not relax P2 gates.
- This does not automatically reclassify already-signed historical artifacts unless they are accepted again or otherwise rewritten through the approval route.
