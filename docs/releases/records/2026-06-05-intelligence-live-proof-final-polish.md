# 2026-06-05-intelligence-live-proof-final-polish — Intelligence Live Proof Final Polish

## Release ID

`2026-06-05-intelligence-live-proof-final-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens two findings from the Lakeshore post-deploy live Intelligence proof. Sentinel is now instructed to name the active client in the first sentence for hard CXO or program-readiness answers when the live surface facts include that client. The Lakeshore live proof scorer also recognizes safe Pinecone negation phrasing such as “Pinecone is not in play.”

## Layer Impact

- `global-control-lane`: Shared Intelligence synthesis prompt is tightened for tenant-specific hard questions.
- `client-data-lane`: Lakeshore live proof scoring is made more accurate for Azure AI Search / Pinecone truth checks.

## Client Applicability

- All clients: Tenant-specific hard CXO answers should name the active client when the authenticated surface facts provide it.
- Specific clients: Lakeshore live proof scoring no longer flags safe “Pinecone is not in play” phrasing.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: adds active-client naming guidance for hard CXO / program-readiness answers.
- `scripts/lakeshore/intelligence-live-answer-qa.mjs`: fixes the Pinecone negation scorer.

## QA / Validation

- `pass`: Focused Jest guardrail tests: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/agent/output-discipline/prompt-contract.test.ts --runInBand`.
- `pass`: `git diff --check`.
- `pass`: `npm run release:check -- --base origin/main --head HEAD`.
- `not-run`: Post-deploy Lakeshore live proof rerun after merge/deploy.

## Rollout Plan

Merge to `main`, deploy to Vercel production, then rerun the Lakeshore authenticated live Intelligence proof against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR. No migration or data rollback is required.

## Audit Evidence

- Prior post-deploy proof: `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T17-26-53-733Z-db3fde4ba/summary.json`.
- PR URL, CI checks, Vercel deployment ID, and follow-up live proof report.

## Known Gaps

This does not expand corpus depth. It only tightens answer shape and QA scoring for live demo proof.
