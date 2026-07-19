# 2026-07-19 Tower Claim Language Polish

## Release ID

`2026-07-19-tower-claim-language-polish`

## Status

`candidate`

## Plain-English Summary

Tower already blocks AI usage, interview, and partial finance-validation data from being treated as realized value. This follow-up removes the remaining visible "proven/unproven" wording from the Tower executive surface, charts, suggested prompts, and dossier labels so the product consistently talks about finance validation, claimable value, and proof gaps.

## Layer Impact

- `global-control-lane`: Updates shared Tower UI copy and chart labels for all tenants.
- `public-demo`: Reduces demo risk by preventing a CFO/CXO from reading partial evidence as booked or proven value.

## Client Applicability

- All clients: Yes, wherever the shared Tower dashboard and charts are used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Follow-up PR: Tower claim-language polish.
- Updates Tower dashboard copy from proven/unproven language to finance-validated, claimable, and proof-gap language.
- Updates Tower Recharts labels and tests to enforce finance-validation wording.
- Updates visible Tower suggested prompts and dossier labels that previously asked for realized/proven value.

## QA / Validation

- pass: Focused Tower Jest suites:
  `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx --runInBand`
- pass: Targeted ESLint:
  `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx src/lib/tower/atlas-interpretation-view.ts src/lib/tower/atlas-observations-view.ts src/lib/tower/tower-l3-dossiers.ts src/lib/tower/tower-materialization.ts`
  Existing Tower unused-symbol warnings remain; no errors.
- pass: TypeScript:
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- pass: Whitespace:
  `git diff --check`
- pass: Release control:
  `npm run release:check`
- not-run: Post-deploy signed-in Tower proof on `https://app.abarva.ai/tower`; requires PR merge and ACA deploy.

## Rollout Plan

Merge through PR to `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image. After ACA deploy completes, verify the runtime invariant and signed-in Tower UI.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR or redeploy the previous approved ACA image digest. No schema or data migration is included.

## Audit Evidence

- PR URL: Pending.
- CI/check output: Pending.
- ACA deployment: Pending.
- Browser proof: Pending.

## Known Gaps

Lakeshore signed-in browser proof may require a refreshed Clerk session. Meridian proof is expected to be used first because the existing signed-in state is valid.
