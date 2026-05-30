# 2026-05-30-c12-sentinel-feedback — Sentinel Answer Feedback

## Release ID

`2026-05-30-c12-sentinel-feedback`

## Status

`candidate`

## Plain-English Summary

Sentinel answers now show thumbs up/down controls after an answer completes. The feedback is attached to the existing reasoning telemetry event path, so operators can see the aggregate thumbs signal without adding a new database table, migration, or RLS policy.

## Layer Impact

- `global-control-lane`: Updates the shared Sentinel answer route, AgentDock UI, and reasoning telemetry aggregation for all tenants that use the Intelligence/Sentinel surfaces.
- `internal-admin`: Extends the existing reasoning telemetry aggregate surface with a `sentinel` bucket.

## Client Applicability

- All clients: Yes, where the authenticated Intelligence/Sentinel surfaces are enabled.
- Specific clients: None.
- Internal only: The aggregate telemetry view remains behind the existing reasoning API auth guard.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `POST /api/intelligence/ask` records a `sentinel` reasoning telemetry event when an answer completes and emits the event id in the NDJSON `done` event.
- `AgentDock` renders the existing thumbs feedback widget for agent turns that carry a feedback event id.
- `/intelligence/ask` Sentinel reasoning cards render the same feedback widget after completion.
- `POST /api/reasoning/feedback` initializes the existing telemetry backend before recording feedback.
- Reasoning telemetry summary and timeline helpers recognize the `sentinel` surface.
- No schema, migration, or RLS change.

## QA / Validation

- `npx jest src/components/intelligence-v3/__tests__/SentinelChat.migration.test.tsx src/lib/reasoning/__tests__/synthesis-telemetry-stats.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — passed.
- `npx eslint src/app/api/intelligence/ask/route.ts src/app/api/reasoning/feedback/route.ts src/components/agent/AgentDock.tsx src/components/intelligence-v3/SentinelChat.tsx 'src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx' src/components/reasoning/SynthesisFeedbackWidget.tsx src/lib/reasoning/synthesis-telemetry.ts src/lib/reasoning/synthesis-telemetry-stats.ts src/lib/reasoning/instance-event-timeline.ts src/components/intelligence-v3/__tests__/SentinelChat.migration.test.tsx src/lib/reasoning/__tests__/synthesis-telemetry-stats.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — passed.
- `git diff --check` — passed.
- `npx tsc --noEmit --pretty false` — blocked by existing missing optional package typings for Azure SDK packages, `pptxgenjs`, and `@resvg/resvg-js`; no C12-specific TypeScript errors remained after updating `instance-event-timeline`.

## Rollout Plan

Merge to `main` and deploy the Next.js app normally. Existing authenticated Sentinel surfaces will begin emitting feedback-capable telemetry events immediately. Persistent storage uses the already-approved `reasoning_telemetry_events` table when `REASONING_TELEMETRY_BACKEND=postgres` is configured.

## Rollback Plan

Revert the application commit. No database rollback is required because this release does not add schema, RLS, seed, or migration changes.

## Audit Evidence

- PR URL: pending.
- Commit SHA: pending.
- Validation output: local focused Jest, ESLint, and `git diff --check` from `/private/tmp/nexus-c12-sentinel-feedback`.

## Known Gaps

No new admin route was added. The admin aggregate path is the existing `/api/reasoning/telemetry` summary, now with a `sentinel` bucket.
