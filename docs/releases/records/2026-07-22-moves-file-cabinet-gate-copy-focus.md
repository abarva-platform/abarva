# 2026-07-22-moves-file-cabinet-gate-copy-focus — Moves File Cabinet Gate Copy and Review Focus

## Release ID

`2026-07-22-moves-file-cabinet-gate-copy-focus`

## Status

`candidate`

## Plain-English Summary

Moves File Cabinet context extracts no longer imply that a next phase can proceed just because usable evidence exists. The review language now says that attached evidence is usable, but phase advancement still requires the governed Approve & Build gate. Artifact review panels also scroll into view when opened so reviewers can see the client-approval controls instead of hunting through a long Files & Evidence list.

## Layer Impact

- `global-control-lane`: Updates shared Moves File Cabinet review copy and review-panel focus behavior for the product runtime.
- Product UI: Clarifies the difference between evidence readiness and governed phase advancement without changing gate rules or evidence policy.

## Client Applicability

- All clients: Applies wherever the Moves File Cabinet renders context extracts and artifact review rows.
- Specific clients: Verified against FS Demo sandbox proof flow before the fix.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves runtime surface; no new flag.

## Changes Included

- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`

## QA / Validation

- Passed: `npx jest --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand`
- Passed: `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`
- Pending before release: `npm run release:check`
- Pending before release: `git diff --check`
- Pending after deploy: signed-in browser proof on the FS Demo sandbox Move showing the revised context-extract message and review-panel focus.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared Product/Lab runtime. After deploy, verify the ACA runtime invariant and capture signed-in browser proof on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable; UI-only web change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the previous behavior. No database migrations, tenant data updates, feature-flag changes, or worker changes are involved.

## Audit Evidence

- Before-fix proof: `proof/129-fs-moves-e2e-p2-worker-followup` showed a context extract saying P2 could proceed while Approvals still showed P2 blocked at 4/5.
- Before-fix proof: `proof/131-fs-moves-e2e-p2-deliverable-review` showed review controls existed but were easy to miss in a long File Cabinet list.
- PR URL: Pending.
- ACA revision and digest: Pending deploy.
- Signed-in proof: Pending deploy.

## Known Gaps

- This does not change or relax P2 gate evaluation.
- This does not reconcile client-approved P2 diagnostic artifacts with the `p2_readiness_cleared` gate criterion.
- This does not advance any sandbox or production Move.
