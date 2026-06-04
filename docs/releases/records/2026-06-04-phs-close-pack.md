# 2026-06-04-phs-close-pack — PHS Close Pack

## Release ID

`2026-06-04-phs-close-pack`

## Status

`candidate`

## Plain-English Summary

Adds an internal PHS close pack with a CDAO-style justification memo, 8-12 slide pitch deck outline, business-case worksheet, joint CDAO + sourcing pitch, PHS-style data and Move catalog plan, draft pilot SOW, and legal/procurement pre-handle checklist. The pack carries explicit evidence caveats so PHS-specific assumptions are not mistaken for sourced client facts.

## Layer Impact

- `public-demo`: Adds draft sales and pilot-preparation material that can become prospect-facing after founder review and evidence confirmation.
- `internal-admin`: Adds a verifier script for the PHS close pack.

No runtime application layer, authentication layer, data-plane layer, migration, product UI, private data-plane implementation, or data load is included.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa founder/operator sales preparation.
- Public/demo only: Draft prospect-facing material after review.
- Feature flag: None.

## Changes Included

- `docs/gtm/sales-assets/phs-close-pack.md`
- `scripts/gtm/verify-phs-close-pack.mjs`
- `package.json` script `gtm:phs-close-pack:verify`

Backlog rows touched: T252, T255, T256, T257, T262, T264, T285, T288, T290.

## QA / Validation

- pass: `npm run gtm:phs-close-pack:verify`
- pass: `node --check scripts/gtm/verify-phs-close-pack.mjs`
- pass: `git diff --check origin/main...HEAD`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

No runtime rollout. Merge to `main` through the protected PR flow. Founder/operator can use the close pack as internal preparation after review.

## Rollback Plan

Revert the PR. Because this is docs/scripts only, rollback does not require a migration, feature flag, Vercel deploy change, or data-plane action.

## Audit Evidence

- PR URL and CI checks after the PR is opened.
- Local verifier output from `npm run gtm:phs-close-pack:verify`.
- Release-control output from `npm run release:check -- --base origin/main --head HEAD`.
- Source linkage to `docs/gtm/account-research/phs-evidence-caveat.md`.

## Known Gaps

- PHS entity, revenue, payer mix, AMS wave, Azure/Databricks partner, and buyer-confirmed AI-strategy pressure remain unverified.
- SOW language requires founder and counsel review before client use.
- This pack does not load data or implement private data-plane behavior.
