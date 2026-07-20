# 2026-07-20-intelligence-followup-diversity-v3 — Intelligence Follow-Up Quality Hardening

## Release ID

`2026-07-20-intelligence-followup-diversity-v3`

## Status

`candidate`

## Plain-English Summary

This release improves aVa Intelligence follow-up questions so they feel like the next question a CXO or consultant would naturally ask, instead of repeating the same safe-but-generic evidence prompts. Claude is instructed to produce three distinct follow-up roles, and the runtime fallback now creates topic-specific questions when generated follow-ups are missing or unsafe.

## Layer Impact

- `global-control-lane`: adjusts the shared Intelligence answer lifecycle follow-up generation guidance and runtime fallback assembly.
- `global-control-lane`: keeps product-truth safety enforcement in place while improving specificity and diversity of safe replacement questions.
- Tests: adds a regression that fails if Intelligence fallback questions become too repetitive across a strategy question pack.

## Client Applicability

- All clients: yes, for Intelligence aVa suggested follow-up questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/followups.ts`
- `src/lib/agent/product-truth/runtime-guard.ts`
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`

## QA / Validation

- `npx jest src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/intelligence/ask/__tests__/followups.test.ts --runInBand` passed.
- `npx eslint src/lib/agent/product-truth/runtime-guard.ts src/lib/intelligence/ask/followups.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.
- `git diff --check` passed.
- Offline strict sample across 16 FS Demo strategy prompts improved fallback diversity to 42 unique questions out of 48, with max repeat count 2.

## Rollout Plan

Merge to main through PR. The normal repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: pending post-merge ACA deployment
- ACA runtime invariant: pending post-merge ACA deployment
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, run the Intelligence follow-up quality audit against `https://app.abarva.ai`

## Rollback Plan

Revert the PR and redeploy main through the ACA deploy workflow. No migrations or data-plane changes are included.

## Audit Evidence

- PR: pending
- Local focused Jest output: passed
- Strict offline fallback diversity sample: 42/48 unique, max repeat 2
- Live signed-in/API proof: pending after deploy

## Known Gaps

Live production acceptance is pending merge and ACA deployment.
