# 2026-06-29-home-v6-executive-claude-answer-contract — Home V6 Executive Claude Answer Contract

## Release ID

`2026-06-29-home-v6-executive-claude-answer-contract`

## Status

`candidate`

## Plain-English Summary

Home V6 now separates evidence selection from final answer writing. The deterministic V6 layer still selects tenant-safe facts, tables, gaps, citations, and handoff boundaries, but Claude is responsible for the final user-visible executive answer. If Claude cannot produce a validated executive answer in production, Home blocks the response instead of silently showing the older technical fallback.

## Layer Impact

- `global-control-lane`: changes the shared Home KNOW answer contract for all demo tenants using the V6 Home path.
- `public-demo`: improves soft-launch demo quality by moving Home answers from technical V6 contract prose to executive advisory prose.

## Client Applicability

- All clients: all tenants using `/api/home/know/ask` and the Home aVa chat stream.
- Specific clients: Retail Demo, Healthcare Demo, Financial Services Demo, Industrial Demo, Airline Demo are the immediate QA tenants.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED`, with production default enabled. `HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED` defaults to required in production.

## Changes Included

- Added `src/lib/home/know/home-v6-executive-synthesis.ts`.
- Updated `/api/home/know/ask` to apply the V6 executive synthesis after deterministic evidence selection.
- Updated the Home aVa chat stream path to use the same synthesis layer.
- Added focused Jest coverage for Claude selection, trace contract, fact/table preservation, and validation fallback behavior.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand` passed.
- `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/app/api/home/know/ask/route.ts src/lib/home/know/home-know-agent-answer.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts` passed.
- Local live-Claude probe could not complete from laptop because audited AI policy lookup requires private Azure Postgres DNS; the failure was explicit and did not silently claim Claude selection. Live ACA proof is still required after merge/deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, then run signed-in Home traces in production. The live proof must show `composer=claude_text_synthesis`, `claudeInvoked=true`, `claudeSelected=true`, `fallbackUsed=false`, preserved facts/tables, and executive-friendly prose.

## Deployment Authority

- Repo-owned deploy workflow: required, ACA main deploy only.
- Shared runtime mutators: none outside normal ACA deploy.
- Approved image digest: to be captured by deploy workflow.
- ACA runtime invariant: required.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: environment variables are optional because production defaults enable and require synthesis.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or set `HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED=false` to restore deterministic V6 Home prose while preserving the V6 evidence selection path.

## Audit Evidence

- Focused Jest and ESLint output.
- Post-deploy ACA revision, image digest, traffic, health.
- Signed-in Home trace showing prompt, raw Claude response, API payload, and rendered answer.
- Live multi-question audit requiring Claude-selected executive prose.

## Known Gaps

- Live ACA Claude proof is pending until this candidate is merged and deployed.
