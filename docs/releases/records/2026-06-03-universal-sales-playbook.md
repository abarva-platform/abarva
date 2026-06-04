# 2026-06-03-universal-sales-playbook - Universal Sales Playbook

## Release ID

`2026-06-03-universal-sales-playbook`

## Status

`candidate`

## Plain-English Summary

Adds a reusable GTM playbook for two founder-sales motions: the "no AI leader ready" modernization operating-system play and the "new leader" first-100-days play. The playbook gives positioning, qualification signals, discovery questions, pilot shape, success criteria, and risk boundaries without inventing account-specific facts.

## Layer Impact

- Release lane: `public-demo`
- Layer impact: sales/GTM documentation and verifier only. No runtime behavior, database schema, customer UI, or production configuration changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: AbarVa founder/operator sales motion.
- Public/demo only: reusable GTM content that can inform client-facing derivatives after review.
- Feature flag: none.

## Changes Included

- `docs/gtm/universal-sales-playbook.md`
- `scripts/gtm/verify-universal-sales-playbook.mjs`
- `package.json` script `gtm:universal-sales:verify`
- This release record.

## QA / Validation

- Passed: `npm run gtm:universal-sales:verify`
- Passed: `node --check scripts/gtm/verify-universal-sales-playbook.mjs`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR flow. No runtime rollout. The playbook becomes the repo-controlled baseline for rows T269 and T277.

## Rollback Plan

Revert the PR if the playbook is superseded or commercially inaccurate. There are no runtime or data changes.

## Audit Evidence

- PR URL after opening.
- Local verifier output from `npm run gtm:universal-sales:verify`.
- CI release-control and standard repository checks.

## Known Gaps

Account-specific derivatives remain out of scope. Rows for PHS, Delta, KK, Surekha, Lakeshore, or other named prospects still require sourced account research and separate deliverables before they can move.
