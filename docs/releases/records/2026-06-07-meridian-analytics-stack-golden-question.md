# 2026-06-07-meridian-analytics-stack-golden-question — Meridian Analytics Stack Golden Question

## Release ID

`2026-06-07-meridian-analytics-stack-golden-question`

## Status

`candidate`

## Plain-English Summary

Sentinel now answers the Meridian analytics-stack golden question by separating what is present in loaded Azure-backed Enterprise Context, what only appears in synthetic/demo application rows, and what is missing from the loaded context. The pinned answer covers Epic Clarity, Epic Caboodle, SQL Server, Tableau, SAS, Epic Cogito, and Power BI.

## Layer Impact

- `global-control-lane`: Updates Sentinel Ask retrieval and deterministic current-state technology advisory logic.
- `client-data-lane`: Interprets Meridian tenant context with the documented data-depth boundary: Enterprise Context / CMDB facts outrank synthetic `applications.is_demo_data` rows.

## Client Applicability

- All clients: The broader analytics-stack retrieval triggers and application data-basis labeling are available globally.
- Specific clients: Meridian Health receives the explicit seven-platform present/missing answer shape.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: Adds Meridian analytics-stack coverage classification for loaded, synthetic/demo, and missing platform buckets.
- `src/lib/knowledge/tenant-enterprise-context.ts`: Broadens analytics-stack retrieval terms and labels `applications.is_demo_data` rows as synthetic/demo.
- `src/lib/knowledge/tenant-technology-context.ts`: Recognizes healthcare analytics platform names in technology questions.
- `tests/agent-grounding/curriculum/meridian-analytics-stack-golden.jsonl`: Adds the pinned Meridian golden question.
- Targeted Jest coverage for response policy, retrieval, technology detection, and curriculum pinning.

## QA / Validation

- Passed: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/knowledge/__tests__/tenant-technology-context.test.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts tests/agent-grounding/__tests__/curriculum.test.ts --runInBand`
- Passed: `npm run release:check`
- Not run: signed-in live Meridian Sentinel QA, because this branch validation does not have a Clerk session cookie or live Azure operator query session.
- Note: Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks; the targeted suites passed.

## Rollout Plan

Merge to main through PR. The answer-path and retrieval changes become active on the next app deployment. No database migration or manual data load is required.

## Rollback Plan

Revert the PR. This restores the prior generic current-state technology advisory and removes the pinned Meridian analytics-stack curriculum case. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Branch validation output from the targeted Jest suites and `npm run release:check`.
- Existing audit doctrine: `docs/build/codex-prompts/CONTEXT_CORPUS_AGENT_VISIBILITY_AUDIT_PROMPT.md` Appendix A.

## Known Gaps

This does not load new Meridian BI/reporting inventory. SQL Server, Tableau, and SAS remain context-layer gaps until a governed loader run supplies real source rows.
