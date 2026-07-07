# 2026-06-05-kyriba-enumerated-answer-completeness — Kyriba Enumerated Answer Completeness

## Release ID

`2026-06-05-kyriba-enumerated-answer-completeness`

## Status

`candidate`

## Plain-English Summary

Sentinel now gives itself enough answer room when a CXO asks for a specific numbered set of readiness items, such as the six Kyriba rollout failure modes. This keeps normal answers concise while preventing the app from truncating a critical numbered list before all requested items are covered.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence synthesis guardrail used by all clients.
- `client-data-lane`: Improves Lakeshore demo-readiness proof for Kyriba readiness questions that depend on loaded tenant evidence.

## Client Applicability

- All clients: Applies to Intelligence Ask answers when the user asks for a specific count of risks, gates, steps, findings, or similar items.
- Specific clients: Lakeshore benefits immediately for Kyriba readiness and platform rollout de-risk questions.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`
  - Detects numbered/list-style completeness questions.
  - Raises synthesis token and sanitize word budgets only for those questions.
  - Adds an explicit prompt instruction to answer every requested item before ending.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`
  - Adds regression coverage for Kyriba six-failure-mode questions and standard digest limits.

## QA / Validation

- `pass` — `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/agent/output-discipline/prompt-contract.test.ts --runInBand` passed: 2 suites, 26 tests.
- `pass` — `git diff --check` passed.
- `pass` — `npm run release:check -- --base origin/main --head HEAD` passed.
- `not run` — Live Lakeshore Intelligence proof rerun pending after merge and production deploy.

## Rollout Plan

Merge to `main`, deploy the current `main` commit to Vercel production, then rerun the Lakeshore live Intelligence proof against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR. The rollback restores the previous 600-token and 240-word synthesis caps for all non-concise Intelligence answers.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Production deployment URL: pending.
- Live Lakeshore proof report: pending.

## Known Gaps

This does not expand the Lakeshore corpus. Corpus expansion remains intentionally on hold; this release only fixes answer completeness for already-loaded evidence and doctrine.
