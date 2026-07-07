# 2026-06-04-source-communication-drafts — Source Internal Communication Drafts

## Release ID

`2026-06-04-source-communication-drafts`

## Status

`candidate`

## Plain-English Summary

Source now gives Maestros a governed way to create internal communication drafts for Q&A follow-up, BAFO requests, award notices, and vendor follow-ups. The drafts are review-only, copy/download friendly, and explicitly not sent by AbarVa. Each generation writes a visible Source event activity row so the Log tab can show that a communication draft was created.

## Layer Impact

- `global-control-lane`: adds a Source canvas communication-draft panel and a Source API route for internal draft creation.
- `client-data-lane`: appends tenant-scoped and event-scoped rows to `source_event_activity` through the existing Source write adapter. No schema or migration changes are included.

## Client Applicability

- All clients: Source users with contributor rights can create review-only internal drafts from event context.
- Specific clients: Apex Retail Group benefits immediately for the CXO readiness walkthrough.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `POST /api/v1/source/[eventId]/communications/draft`.
- Adds a Source canvas “Communication drafts” panel for relevant stages.
- Adds deterministic draft text for Q&A follow-up, BAFO request, award notice, and vendor follow-up.
- Adds tests for draft guardrails, panel behavior, and route wiring.

## QA / Validation

- `npm test -- --runInBand src/lib/source/__tests__/communication-drafts.test.ts src/components/source/__tests__/CommunicationDraftsPanel.test.tsx` — passed.
- `npx eslint src/lib/source/communication-drafts.ts src/lib/source/__tests__/communication-drafts.test.ts src/components/source/canvas/workspace-tabs/CommunicationDraftsPanel.tsx src/components/source/__tests__/CommunicationDraftsPanel.test.tsx src/components/source/canvas/UniversalCanvasShell.tsx 'src/app/api/v1/source/[eventId]/communications/draft/route.ts'` — passed.

## Rollout Plan

Merge the PR to `main`, allow the Vercel production deployment for `app.abarva.ai` to complete, then smoke the Apex AMS event at RFP, BAFO, Selection, and Transition stages to confirm draft creation and Log tab activity.

## Rollback Plan

Revert the PR. This removes the new API route and canvas panel. Any activity rows created while active should remain as audit history.

## Audit Evidence

- PR URL: pending.
- Focused Jest and ESLint output from the PR validation.
- Production smoke after deploy: pending.

## Known Gaps

- This release does not send email, integrate with a procurement platform, or replace the client’s vendor portal. It intentionally creates copy/download drafts only.
- Drafts are deterministic and event-contextual in this first release. A future version can add LLM-assisted drafting after the same human approval and citation guardrails are validated.
