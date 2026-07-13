# 2026-07-13-home-pr-dq2-skyharbor-wording — Home SkyHarbor Executive Summary Wording

## Release ID

`2026-07-13-home-pr-dq2-skyharbor-wording`

## Status

`candidate`

## Plain-English Summary

Home's deterministic executive summary now recognizes the live SkyHarbor route key (`skyharbor`) as the same tenant posture as the SkyHarbor/Airline Demo data-layer audit. This prevents the page from showing a generic "active Home context" explanation when the important buyer-readable warning is that Airline Demo has a richer upstream source estate than the active Home representation.

## Layer Impact

- Home read model rendering: updates deterministic plain-English summary wording and cautions.
- Audit/report artifact: regenerates the Home English summary proof bundle.
- Data plane: no production data writes, no candidate promotion, no active access update, and no module runtime consumption change.

## Client Applicability

- All clients: receive the same deterministic renderer behavior.
- Specific clients: SkyHarbor/Airline Demo gets corrected tenant-key detection for `skyharbor` and `skyharbor-air`.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/home-english-summary.ts`
- `src/lib/home/__tests__/home-english-summary.test.ts`
- `reports/home-english-summary/latest/*`

## QA / Validation

- `npm run test:home-english-summary` — Pass.
- `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand` — Pass.
- `npm run audit:home-english-summary` — Pass.
- `npx eslint src/components/home/HomeSurface.tsx src/lib/home/home-english-summary.ts src/lib/home/__tests__/home-english-summary.test.ts scripts/audit/build-home-english-summary.ts` — Pass.
- `npm run audit:enterprise-naming` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge through pull request to `main`. The approved ACA main deployment workflow builds and deploys the resulting main SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by ACA main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: `/home` and `/home?candidatePreview=true` for SkyHarbor plus one other tenant.

## Rollback Plan

Revert this PR or roll ACA back to the prior digest-pinned revision. No schema, data, candidate, promotion, or module-read rollback is required.

## Audit Evidence

- Home English summary proof bundle: `reports/home-english-summary/latest/`.
- Pull request and ACA deployment evidence will be attached after merge/deploy.

## Known Gaps

This does not regenerate tenant data or promote candidate data. It only corrects Home's deterministic business-readable wording for the live SkyHarbor route key.
