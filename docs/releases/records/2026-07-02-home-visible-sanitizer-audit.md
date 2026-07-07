# 2026-07-02-home-visible-sanitizer-audit — Home Visible Sanitizer Audit

## Release ID

`2026-07-02-home-visible-sanitizer-audit`

## Status

`candidate`

## Plain-English Summary

Home KNOW already used a narrow visible-response sanitizer to convert demo tenant names and collapse repeated tenant openings such as `For Airline Demo, For Airline Demo`. This release makes that duplicate-opening cleanup auditable in the response safety metadata so operators can see whether the sanitizer fired, why it fired, and that it was prefix-only with no semantic loss.

## Layer Impact

- `global-control-lane`: adds response safety metadata for the Home KNOW API. It does not change context selection, Claude prompting, recommendations, caveats, tables, charts, or renderer behavior.

## Client Applicability

- All clients: Home KNOW API responses include the sanitizer audit metadata when present.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/know/home-demo-safe-response.ts`: adds `sanitizeHomeKnowVisiblePayloadWithAudit`.
- `src/app/api/home/know/ask/route.ts`: attaches `safety.visibleSanitizer` and includes it in trace output.
- `src/lib/home/know/home-know-contract.ts`: adds the visible sanitizer audit contract.
- `src/lib/home/know/__tests__/home-demo-safe-response.test.ts`: covers applied and no-op audit states.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand` passed.
- `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/home-know-contract.ts src/app/api/home/know/ask/route.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts` passed.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, verify ACA revision, health, and a signed-in Home KNOW trace response.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/azure-container-apps-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deploy workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: latest ready revision must receive 100% traffic.
- Worker image invariant: No worker behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the sanitizer-audit commit and redeploy the prior known-good Azure Container Apps image. Since this is metadata-only, rollback does not require data migration.

## Audit Evidence

- PR URL: To be added after PR creation.
- Focused Jest output.
- Focused ESLint output.
- Post-deploy Home KNOW trace response showing `safety.visibleSanitizer`.

## Known Gaps

This release does not broaden answer-quality scoring or cross-surface proof. It only makes the existing duplicate-opening sanitizer auditable.
