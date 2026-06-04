# 2026-06-04-pilot-candidate-command-center — Pilot Candidate Command Center

## Release ID

`2026-06-04-pilot-candidate-command-center`

## Status

`candidate`

## Plain-English Summary

Adds a founder execution command center for the remaining active Sales motions. It ranks the top three pilot candidates, gives discovery-call scripts, lays out two-week close sprints for PHS and Delta, and defines a light-touch nurture path for Surekha.

## Layer Impact

- `public-demo`: Adds draft sales execution material that can become prospect-facing after founder review.
- `internal-admin`: Adds a verifier script for the command-center packet.

No runtime application layer, authentication layer, data-plane layer, migration, product UI, or private data-plane change is included.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa founder/operator sales execution planning.
- Public/demo only: Draft outreach/discovery material after review.
- Feature flag: None.

## Changes Included

- `docs/gtm/sales-assets/pilot-candidate-command-center.md`
- `scripts/gtm/verify-pilot-candidate-command-center.mjs`
- `package.json` script `gtm:pilot-command-center:verify`

Backlog rows touched: T063, T254, T272, T279, T284, T286, T287, T289, T291, T292, T293, T295, T297, T298, T299, T300, T303, T304.

## QA / Validation

- pass: `npm run gtm:pilot-command-center:verify`
- pass: `node --check scripts/gtm/verify-pilot-candidate-command-center.mjs`
- pass: `git diff --check origin/main...HEAD`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

No runtime rollout. Merge to `main` through the protected PR flow. Founder/operator can use the command center as an execution checklist after review.

## Rollback Plan

Revert the PR. Because this is docs/scripts only, rollback does not require a migration, feature flag, Vercel deploy change, or data-plane action.

## Audit Evidence

- PR URL and CI checks after the PR is opened.
- Local verifier output from `npm run gtm:pilot-command-center:verify`.
- Release-control output from `npm run release:check -- --base origin/main --head HEAD`.
- Source linkage to `docs/gtm/account-research/` and `docs/gtm/sales-assets/`.

## Known Gaps

- This command center does not complete external outreach, discovery, budget validation, legal review, or client commitment.
- Rows should remain In progress until call notes, approvals, sent artifacts, or signed evidence exist.
