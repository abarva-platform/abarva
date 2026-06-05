# 2026-06-04-source-redesign-spec-01-decision-queue-triage — Source Decision Queue Triage Bands

## Release ID

`2026-06-04-source-redesign-spec-01-decision-queue-triage`

## Status

`candidate`

## Plain-English Summary

The Source Decision Queue now leads with three clear triage bands: Overdue, Due this quarter, and Pipeline. The band cards are clickable filters, the queue can be sorted by deadline, value, or vendor, and empty states point the operator back to the active Source portfolio instead of showing a dead blank queue.

## Layer Impact

- `global-control-lane`: updates the shared Source queue read-model and UI for all Source-enabled clients. No schema, migration, tenant data, ingestion, or model-provider behavior changes.

## Client Applicability

- All clients: Source users who visit `/source/queue` receive the triage-band queue experience.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/source/queue/triage-banding.ts` for the pure three-band Source queue read-model.
- Adds `src/components/source/SourceTriageBands.tsx` for the clickable triage band cards.
- Updates `src/components/source/SourceDecisionQueueView.tsx` to render the Source · Attention header, URL-driven filter/sort controls, guarded secondary actions, and portfolio-forward empty states.
- Updates `src/app/(maestro)/source/queue/page.tsx` to normalize URL params and use the canonical Source portfolio count for the empty state.
- Adds focused tests for the triage read-model and queue SSR surface.

## QA / Validation

- PASS — `npm test -- --runInBand src/lib/source/queue/__tests__/triage-banding.test.ts src/__tests__/integration/source/source-decision-queue-triage.test.tsx src/lib/source/decision-queue/__tests__/queue.test.ts` — passed, 36/36 tests. Duplicate manual mock warnings are pre-existing.
- PASS — `npx eslint src/app/(maestro)/source/queue/page.tsx src/components/source/SourceDecisionQueueView.tsx src/components/source/SourceTriageBands.tsx src/lib/source/queue/triage-banding.ts src/lib/source/queue/__tests__/triage-banding.test.ts src/__tests__/integration/source/source-decision-queue-triage.test.tsx --max-warnings 0` — passed.
- PASS — `git diff --check` — passed.
- PASS — `npx tsc --noEmit --skipLibCheck --pretty false` — passed after installing dependencies in the isolated worktree from the branch lockfile.
- PASS — `npm run release:check -- --base origin/main --head HEAD` — passed.
- BLOCKED — local Playwright smoke against `http://localhost:3011/source/queue` could not reach the queue because the local dev session redirected through responsible-AI acknowledgment/Home while the local data-plane DNS lookup for `pg-abarva-context-lab-001.postgres.database.azure.com` failed. No E2E spec was committed for this branch; production post-deploy crawl remains the browser acceptance gate.
- NOT-RUN — PR CI after PR creation.
- NOT-RUN — production deploy and Source post-deploy crawl after merge.

## Rollout Plan

Merge the PR to `main`, then deploy the exact merged SHA to Vercel production. Verify `https://app.abarva.ai` aliases to that deployment and run the Source post-deploy crawl against the production alias.

## Rollback Plan

Revert the PR and redeploy the previous known-good `main` SHA. This change has no migration or persistent data side effects.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3061
- Production deployment: to be added after merge/deploy.
- Post-deploy crawl artifacts: to be added after production verification.

## Known Gaps

- Secondary deadline actions are deliberately guarded and route users to review in Portfolio; this slice does not add persistent snooze/defer mutations.
