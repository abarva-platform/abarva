# 2026-06-06-long-cxo-evidence-breaks — Long CXO Evidence Breaks

## Release ID

`2026-06-06-long-cxo-evidence-breaks`

## Status

`candidate`

## Plain-English Summary

Ask Intelligence now adds paragraph breaks at natural evidence headings in long CXO answers when the model still compresses the answer after standard section formatting. This addresses live Meridian proof cases where the answer had useful structure but only one visible paragraph break.

## Layer Impact

- `global-control-lane`: Shared Ask Intelligence display discipline changes for all clients.
- `client-data-lane`: No tenant data, schema, loader, or data-plane change.

## Client Applicability

- All clients: Yes, for long Ask Intelligence answers.
- Specific clients: Meridian/PHS is the live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a long-answer fallback in `src/lib/intelligence/ask/response-policy.ts`.
- Breaks before natural headings such as `What I can prove from evidence`, `Proven`, `Not yet proven`, and numbered evidence clauses when long answers remain compressed.
- Adds regression coverage based on the failed Meridian live proof shape.

## QA / Validation

- BLOCKED: Initial focused Jest run showed the new regression fixture was below the long-answer threshold, so the fallback intentionally did not run.
- PASS: Focused ESLint completed cleanly.
- PASS: `git diff --check` completed cleanly.
- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand` passed 2 suites / 29 tests after fixture update.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed.
- NOT-RUN: Production Meridian response-shape proof after merge and deploy.

## Rollout Plan

Merge to main and deploy to Vercel production. No migration or data reload is required.

## Rollback Plan

Revert the PR or redeploy the previous production commit. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Production proof target: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-response-style-postdeploy/`.

## Known Gaps

This improves answer readability only. It does not change Meridian tenant facts, generated strategy substance, or the remaining evidence-depth issues from the broader 50-question QA.
