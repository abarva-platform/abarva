# 2026-07-02-home-v6-context-findings — Home V6 Context Findings

## Release ID

`2026-07-02-home-v6-context-findings`

## Status

`candidate`

## Plain-English Summary

Home overview findings now come from the V6 context browser substrate instead of the older Intelligence binding signal cards. The page presents “Context findings” with supporting dimensions, V6 source files, source-row counts, evidence gaps, claim basis, and next-surface guidance so users can see why a finding appears before asking aVa.

## Layer Impact

- `global-control-lane`: Updates the shared Home UI and V6 context-browser read model used by every tenant that has a V6 browser pack.
- `public-demo`: Improves demo readiness by removing old signal language from the Home overview and making the V6 substrate visible in executive-friendly form.

## Client Applicability

- All clients: Yes, for Home surfaces with V6 context-browser packs.
- Specific clients: Validated locally for Airline Demo and Industrial Demo through the V6 finding assembler.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/lib/home/v6-context-browser.ts`
- `src/lib/home/v6/home-v6-context-findings.ts`
- `src/lib/home/v6/__tests__/home-v6-context-findings.test.ts`
- `src/components/home/__tests__/HomeSurface.test.tsx`
- Hotfix: renamed one Industrial Demo V6 finding that reused a legacy top-four signal headline, and added a regression test banning the old Home signal headlines from V6 findings.

## QA / Validation

- Pass: `npx jest src/lib/home/__tests__/v6-context-browser.test.ts src/lib/home/v6/__tests__/home-v6-context-findings.test.ts src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx eslint src/lib/home/v6-context-browser.ts src/lib/home/v6/home-v6-context-findings.ts src/lib/home/v6/__tests__/home-v6-context-findings.test.ts src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx src/app/api/home/know/ask/route.ts src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/home-know-contract.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts src/lib/home/__tests__/v6-context-browser.test.ts`
- Pass hotfix: `npx jest src/lib/home/v6/__tests__/home-v6-context-findings.test.ts --runInBand`
- Pass hotfix: `npx eslint src/lib/home/v6/home-v6-context-findings.ts src/lib/home/v6/__tests__/home-v6-context-findings.test.ts`
- Not run yet: signed-in ACA browser proof. Required after merge/deploy.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deployment lane. The change becomes active when the new ACA revision receives 100% ingress traffic.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow.
- Shared runtime mutators: None.
- Approved image digest: Filled during deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the merged `main` image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify Airline Demo and Industrial Demo Home overview findings plus aVa Home answers.

## Rollback Plan

Rollback by reverting the Home V6 context-finding commit or by assigning ACA traffic back to the prior healthy revision. No database migration is included.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA revision and image digest: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

This release replaces the Home overview finding cards. It does not remove every historical V4-derived file or compatibility shim in the repository.
