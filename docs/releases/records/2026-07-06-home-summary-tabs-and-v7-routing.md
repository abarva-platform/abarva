# 2026-07-06-home-summary-tabs-and-v7-routing — Home Summary Tabs And V7 Routing

## Release ID

`2026-07-06-home-summary-tabs-and-v7-routing`

## Status

`candidate`

## Plain-English Summary

Restores the Home context-browser hierarchy so the dropdown remains the high-level selector and the selected canvas defaults to `Summary`. Overview and selected dimensions now expose only `Summary`, `Data`, and `Gaps`; the old `Questions` tab is removed from the right-side canvas. The release also fixes V7 Home KNOW routing so plain language questions such as "what is loaded about IT systems" use the applications/systems packet instead of repeating the enterprise profile answer.

## Layer Impact

- `global-control-lane`: Shared Home UI behavior and Home KNOW deterministic V7 routing change for all tenants using the Home surface.
- `client-data-lane`: No schema, ingestion, migration, or tenant data changes.

## Client Applicability

- All clients: Home context-browser tab hierarchy and V7 Home KNOW routing.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/__tests__/HomeSurface.test.tsx`
- `src/lib/home/know/v7-home-ask.ts`
- `src/lib/home/know/__tests__/v7-home-ask.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx src/lib/home/know/v7-home-ask.ts src/lib/home/know/__tests__/v7-home-ask.test.ts`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`, build the exact git SHA through the approved Azure Container Apps image build lane, deploy to `ca-abarva-web-lab-eastus`, move ingress traffic to the corrected revision, and verify `https://app.abarva.ai/home` in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deploy workflow/runbook.
- Shared runtime mutators: None beyond standard ACA image/revision update.
- Approved image digest: Pending deploy.
- ACA runtime invariant: `app.abarva.ai` must run from `ca-abarva-web-lab-eastus`, not Vercel.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by moving ACA ingress traffic to the prior healthy web revision, or revert this commit and redeploy the previous main SHA.

## Audit Evidence

- Focused Jest output listed in QA.
- Focused ESLint output listed in QA.
- Git diff check listed in QA.
- Browser screenshot and ACA revision/digest proof pending deploy.

## Known Gaps

Not deployed yet. Signed-in browser proof is still required before this is called live.
