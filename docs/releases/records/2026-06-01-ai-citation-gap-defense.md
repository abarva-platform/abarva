# 2026-06-01-ai-citation-gap-defense — AI Citation Gap Defense

## Release ID

`2026-06-01-ai-citation-gap-defense`

## Status

`candidate`

## Plain-English Summary

Adds an explicit citation-gap banner to the shared structured agent response renderer. If a non-operational AI response contains substantive claim text but no source citations, the UI now marks the output as uncited and tells the user to treat claims as unverified until evidence is linked.

## Layer Impact

`global-control-lane`: Shared AI output disclosure behavior in `AgentResponse`.

## Client Applicability

- All clients: Shared structured agent responses receive the citation-gap defense.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentResponse.tsx`
- `src/components/agent/__tests__/AgentResponse.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/agent/__tests__/AgentResponse.test.tsx --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel control-plane release. The banner appears automatically only for uncited substantive structured responses.

## Rollback Plan

Revert the PR to remove the citation-gap banner and test. No data migration or tenant data change is involved.

## Audit Evidence

- PR URL
- CI checks
- Local component test, typecheck, release check, and diff hygiene output

## Known Gaps

This slice flags uncited structured responses; it does not prove every sentence has an inline citation. Follow-on catalog and renderer work should expand coverage to remaining custom chat text paths and sentence-level citation density.
