# 2026-06-02-sales-engineering-toolkit - Sales Engineering Toolkit

## Release ID

`2026-06-02-sales-engineering-toolkit`

## Status

`candidate`

## Plain-English Summary

Added an in-repo sales engineering toolkit for enterprise pilot conversations.
The toolkit gives the founder and sales engineering function a single place for
the reference architecture deck outline, technical demo script, ROI calculator
worksheet, and security one-pager.

## Layer Impact

Internal-admin and go-to-market documentation. No runtime code, routes,
migrations, data-plane behavior, or product UI changed.

## Client Applicability

- All clients: None directly.
- Specific clients: None.
- Internal only: AbarVa sales engineering, founder operations, and pilot
  preparation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/gtm/sales-engineering-toolkit/README.md`.
- Added `docs/gtm/sales-engineering-toolkit/reference-architecture-deck.md`.
- Added `docs/gtm/sales-engineering-toolkit/demo-script.md`.
- Added `docs/gtm/sales-engineering-toolkit/roi-calculator-template.md`.
- Added `docs/gtm/sales-engineering-toolkit/security-one-pager.md`.
- Updated `docs/internal/README.md` to link the sales engineering job.

## QA / Validation

Planned validation for this candidate:

- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`
- Verify every referenced repo path in the toolkit exists.
- `npm run secrets:staged`

## Rollout Plan

Merge to main. The toolkit becomes available as internal documentation only; no
runtime deployment or feature flag is required.

## Rollback Plan

Revert the PR to remove the toolkit files and internal wiki link.

## Audit Evidence

- PR for this release candidate.
- Local validation output listed above.
- Release record at
  `docs/releases/records/2026-06-02-sales-engineering-toolkit.md`.

## Known Gaps

The reference architecture deck is a markdown outline, not a rendered slide
deck. The ROI calculator is a worksheet template, not a committed spreadsheet.
Those are acceptable for T111's draft sales-engineering toolkit scope and can
be converted into presentation/spreadsheet artifacts later.
