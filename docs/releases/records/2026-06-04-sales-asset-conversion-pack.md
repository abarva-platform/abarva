# 2026-06-04-sales-asset-conversion-pack — Sales Asset Conversion Pack

## Release ID

`2026-06-04-sales-asset-conversion-pack`

## Status

`candidate`

## Plain-English Summary

Adds founder-review sales assets that convert the merged account research pack into actionable prospect materials: a Delta modernization-program pitch and Lane A/Lane B pilot SOW outline, plus a Morgan Street first-100-days teaser, candidate Move catalog, and thoughtful value piece.

## Layer Impact

- `public-demo`: Adds sales-preparation documents that can become prospect-facing after founder review.
- `internal-admin`: Adds a verifier script for the sales asset pack.

No runtime application layer, authentication layer, data-plane layer, migration, or product UI changes are included.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa founder/operator sales preparation.
- Public/demo only: Draft prospect-facing material after review.
- Feature flag: None.

## Changes Included

- `docs/gtm/sales-assets/delta-modernization-program-os.md`
- `docs/gtm/sales-assets/morgan-street-100-day-framework.md`
- `scripts/gtm/verify-sales-asset-conversion-pack.mjs`
- `package.json` script `gtm:sales-assets:verify`

Backlog rows touched: T266, T267, T273, T275, T280, T294, T296, T301.

## QA / Validation

- pass: `npm run gtm:sales-assets:verify`
- pass: `node --check scripts/gtm/verify-sales-asset-conversion-pack.mjs`
- pass: `git diff --check origin/main...HEAD`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

No runtime rollout. Merge to `main` through the protected PR flow. Founder/operator can use the assets as draft sales material after review.

## Rollback Plan

Revert the PR. Because this is docs/scripts only, rollback does not require a migration, feature flag, Vercel deploy change, or data-plane action.

## Audit Evidence

- PR URL and CI checks after the PR is opened.
- Local verifier output from `npm run gtm:sales-assets:verify`.
- Release-control output from `npm run release:check -- --base origin/main --head HEAD`.
- Source linkage to `docs/gtm/account-research/`.

## Known Gaps

- These are founder-review drafts, not client-approved materials.
- SOW language remains non-legal and requires lawyer/founder review before use.
- Outreach, discovery calls, final SOW negotiation, and client-specific approvals remain separate backlog items.
