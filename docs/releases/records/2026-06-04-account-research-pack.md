# 2026-06-04-account-research-pack — Account Research Pack

## Release ID

`2026-06-04-account-research-pack`

## Status

`candidate`

## Plain-English Summary

Adds a sourced account-research pack for the highest-priority sales backlog lanes: Delta technology modernization, Morgan Street new-leader outreach, and a PHS evidence caveat. The pack keeps public facts, workbook assumptions, and open questions separate so sales material does not overstate what AbarVa knows.

## Layer Impact

- `public-demo`: Adds founder/operator sales-preparation documents that may be used to create future client-facing assets after review.
- `internal-admin`: Adds an internal verifier script for the account-research packet.

No runtime application layer, data-plane layer, authentication layer, or client data changes are included.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa founder/operator account research.
- Public/demo only: Sales-preparation artifacts that can later support public-demo or prospect-facing material after review.
- Feature flag: None.

## Changes Included

- `docs/gtm/account-research/README.md`
- `docs/gtm/account-research/delta-technology-modernization-brief.md`
- `docs/gtm/account-research/morgan-street-new-leader-brief.md`
- `docs/gtm/account-research/phs-evidence-caveat.md`
- `scripts/gtm/verify-account-research-pack.mjs`
- `package.json` script `gtm:account-research:verify`

Backlog rows touched: T253, T260, T261, T263, T265, T274, T278.

## QA / Validation

- pass: `npm run gtm:account-research:verify`
- pass: `node --check scripts/gtm/verify-account-research-pack.mjs`
- pass: `git diff --check origin/main...HEAD`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

No runtime rollout. Merge to `main` through the protected PR flow. Founder/operator can use the docs as source-controlled sales preparation after review.

## Rollback Plan

Revert the PR. Because this is docs/scripts only, rollback does not require a migration, feature flag, Vercel deploy change, or data-plane action.

## Audit Evidence

- PR URL and CI checks after the PR is opened.
- Local verifier output from `npm run gtm:account-research:verify`.
- Release-control output from `npm run release:check -- --base origin/main --head HEAD`.
- Sourced URLs embedded in the account-research briefs.

## Known Gaps

- PHS public evidence is insufficient; PHS rows remain In progress until the real entity, client-supplied materials, or approved synthetic premise is confirmed.
- Delta and Morgan Street research is public-source preparation, not client-approved discovery.
- Client-facing pitch decks, ROI worksheets, SOWs, outreach messages, and live relationship actions remain separate backlog items.
