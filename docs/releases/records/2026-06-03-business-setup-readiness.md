# 2026-06-03-business-setup-readiness - Business Setup Readiness Packet

## Release ID

`2026-06-03-business-setup-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a repo-controlled execution packet for the company setup work that must be completed before or alongside first pilot contracting. The packet turns the open Business Setup rows into clear founder, counsel, CPA, insurance, domain, policy, and SOC 2 workstreams while keeping the status truthful: templates and checklists are progress, not completed external filings.

## Layer Impact

- Release lane: `internal-admin`
- Layer impact: founder/operator readiness documentation and a verifier for the business setup backlog.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: AbarVa founder/operator business setup.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/business/business-setup-readiness-packet.md`
- `scripts/business/verify-business-setup-readiness.mjs`
- `package.json` script `business:setup:verify`
- This release record.

## QA / Validation

- Passed: `npm run business:setup:verify`
- Passed: `node --check scripts/business/verify-business-setup-readiness.mjs`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

No runtime rollout. Merge to `main` through the protected PR flow. The packet becomes the internal operating checklist for rows T001 through T014 and should be used to update `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` truthfully.

## Rollback Plan

Revert the PR if the packet is inaccurate or superseded. This release has no database migration, runtime code, customer route, or external dependency.

## Audit Evidence

- PR URL after opening.
- CI checks for release control and standard repository gates.
- Local verifier output from `npm run business:setup:verify`.

## Known Gaps

No Business Setup row should be marked Done solely because of this release. External evidence is still required for incorporation, 83(b), EIN/banking, foreign qualification, founder/IP agreements, counsel engagement, insurance binding, trademark filing, domain locking, public policy publication, bookkeeping, CPA consultation, and SOC 2 vendor/auditor setup.
