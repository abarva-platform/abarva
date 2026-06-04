# 2026-06-04-source-evidence-request-flow — Source Evidence Request Workflow

## Release ID

`2026-06-04-source-evidence-request-flow`

## Status

`candidate`

## Plain-English Summary

Source Evidence no longer sends users to a silent or external mail draft when evidence is missing. The Evidence tab now opens a small governed request panel, lets the Maestro identify an owner, due date, and note, and records the request as a visible Source event activity. AbarVa does not send an external email in this release; it creates the internal audit trail and task signal first.

## Layer Impact

- `global-control-lane`: updates the shared Source event canvas UI and adds a Source API route for governed evidence-request logging.
- `client-data-lane`: appends tenant-scoped and event-scoped rows to `source_event_activity` through the existing Source write adapter. No schema or migration changes are included.

## Client Applicability

- All clients: Source event users with contributor rights receive the governed evidence request panel.
- Specific clients: Apex Retail Group benefits immediately for the CXO readiness walkthrough.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `POST /api/v1/source/[eventId]/evidence-requests`.
- Replaces the Evidence tab `mailto:` request link with an in-app request panel.
- Refreshes the Source canvas after a request so the Log tab can show the new event activity.
- Updates Evidence tab tests to verify the governed request workflow.

## QA / Validation

- `npm test -- --runInBand src/components/source/__tests__/EvidenceTab.test.tsx` — passed.
- `npx eslint src/components/source/canvas/workspace-tabs/EvidenceTab.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/__tests__/EvidenceTab.test.tsx 'src/app/api/v1/source/[eventId]/evidence-requests/route.ts'` — passed.

## Rollout Plan

Merge the PR to `main`, allow the Vercel production deployment for `app.abarva.ai` to complete, then retest the Apex AMS Evidence tab by creating a request and confirming the Log tab updates.

## Rollback Plan

Revert the PR. This removes the new API route and restores the prior Evidence tab behavior. Existing `source_event_activity` rows created by users should remain as audit history.

## Audit Evidence

- PR URL: pending.
- Focused Jest and ESLint output from the PR validation.
- Production smoke after deploy: pending.

## Known Gaps

- This release does not send external email or integrate with a procurement/ticketing system. It intentionally logs the internal request first.
- The route logs request activity only; a dedicated evidence-request table can be added later if workflow assignment, SLA tracking, or reminders need structured state beyond the activity log.
