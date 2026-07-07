# 2026-06-07-sentinel-current-state-tech-grounding — Sentinel/Nexus Current-State Technology Grounding

## Release ID

`2026-06-07-sentinel-current-state-tech-grounding`

## Status

`candidate`

## Plain-English Summary

Sentinel and Nexus now treat “current state of data analytics / technology stack” as a concrete enterprise-context question. The answer path prioritizes tenant technology and enterprise-context sources before generic Intelligence brief summaries, so a CXO asking what systems and analytics capabilities exist today gets named current-state facts instead of a generic AI-bet sequencing response.

## Layer Impact

- `global-control-lane`: Changes Sentinel Ask response assembly and Nexus current-state question routing for all tenants.
- `client-data-lane`: Improves how tenant-scoped `it_landscape`, enterprise context chunks, and structured facts are ordered and summarized. No schema or data migration is included.

## Client Applicability

- All clients: Yes, for Sentinel Ask and Nexus current-state brief answers.
- Specific clients: The immediate live failure was observed on Lakeshore Holdings, but the routing is tenant-agnostic.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`: prioritizes tenant technology, tenant enterprise, and structured fact sources for current-state technology questions.
- `src/lib/intelligence/ask/response-policy.ts`: adds a concrete current-state technology advisory that only fires when tenant/surface/graph technology facts are present.
- `src/lib/programs/nexus-current-state-briefing.ts`: routes “data analytics / technologies / stack” phrasing to the Technology Landscape section.
- Tests added or updated for Sentinel response policy and Nexus current-state question routing.

## QA / Validation

- `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand` — passed.
- `npx jest src/lib/programs/__tests__/nexus-current-state-briefing.test.ts --runInBand` — passed.
- `npx jest src/lib/knowledge/__tests__/tenant-technology-context.test.ts --runInBand` — passed.
- Jest emitted existing duplicate manual mock warnings for markdown mocks; the suites passed.

## Rollout Plan

Merge to main through PR. The change becomes active with the next app deployment. No database migration, manual data operation, or feature flag flip is required.

## Rollback Plan

Revert the PR. This restores the prior broad-current-state advisory and Nexus routing behavior. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Focused Jest outputs from the branch validation.
- The release diff in the files listed above.

## Known Gaps

This does not extract missing structured facts from tenants that only have raw chunks, and it does not complete the broader hybrid semantic retrieval upgrade. It fixes the immediate answer-path failure so loaded technology context is preferred when available.
