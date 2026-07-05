# 2026-07-05-source-intake-brief-progress-fix — Source Intake: aVa Brief Auto-Fill + Post-Submit Redirect Fix

## Release ID

`2026-07-05-source-intake-brief-progress-fix`

## Status

`candidate`

## Plain-English Summary

Two bugs fixed on the `/source/new` intake canvas:

**Bug 1 — aVa right-panel boxes not auto-filling:**
When a user types intake information into the aVa chat on the new sourcing event intake page, the five right-panel brief boxes (Why now / trigger, Decision owner, Scope boundary, Value basis, Baseline owner) should fill automatically via `brief-progress` artifacts. They were not filling because: (a) the agent's artifact documentation said `brief-progress` was for `/strategic-moves/new` only, and (b) the source surface system prompt had no instruction telling the agent which exact field IDs to emit. Fixed by extending the `brief-progress` artifact docs to cover source intake mode with the correct 5 camelCase IDs, and adding an INTAKE MODE ACTIVE instruction to the source system prompt block.

**Bug 2 — Post-submit redirect to `/source/queue` instead of event canvas:**
When the `commit_source_event` aVa tool creates an event (on the `/source` portfolio surface), it emitted a `navigate-to` artifact pointing to `/source`. The `/source` page immediately redirects to `/source/queue`, so the user landed on the queue instead of the new event's canvas. Fixed by navigating to `/source/events/${event.id}?stage=Strategy` directly.

## Layer Impact

- `global-control-lane`: System prompt update to `/api/chat/agent` (source surface with `sourceIntakeMode=true`) — affects all tenants using the source intake canvas. Agent tool `commitSourceEvent.ts` navigate-to target fixed — affects all tenants where aVa creates a sourcing event from the portfolio chat.
- API / data-plane: Unchanged.
- Schema / migrations: Unchanged.

## Client Applicability

- All clients: Yes — source intake canvas and source portfolio aVa event creation affect all tenants.
- Feature flag: None.

## Changes Included

| Type | Path | Description |
|------|------|-------------|
| Modified | `src/app/api/chat/agent/route.ts` | Added INTAKE MODE ACTIVE instruction with 5 exact field IDs for source intake brief-progress |
| Modified | `src/lib/agent/tools/source/commitSourceEvent.ts` | Changed navigate-to target from `/source` to `/source/events/${event.id}?stage=Strategy` |
| Modified | `src/lib/agent/artifacts.ts` | Extended brief-progress artifact docs to cover source intake mode with correct field IDs and example |

## QA / Validation

| Check | Result |
|-------|--------|
| TypeScript type-check | Clean — no errors |
| Release check domain gates | Context ingestion truth standard: passed. Azure deployment lane: passed. |
| Behavioral fix | Both bugs confirmed by code trace: wrong field IDs → silent drop in handleArtifact; wrong navigate-to target → `/source` redirects to `/source/queue` |

## Rollout Plan

Standard ACA deploy on next image build. No migration, seed, or feature flag required.

## Rollback Plan

Revert the three file changes and rebuild the container image. No data-plane changes — rollback is instant.

## Deployment Authority

`global-control-lane` — system prompt and agent tool behavior only. Authorized under Code-lane pre-approval.

## Audit Evidence

Commit: `12a31a836` on branch `codex/source-canvas-three-column`.

## Context Ingestion Evidence

Not applicable. No ingestion changes.

## Known Gaps

- The `/source/new` intake button path (`createEvent()` in `SourceOriginatePage.tsx`) already uses `payload.eventUrl` from the API which is the canvas URL — this path is not affected by Bug 2 (which is the aVa tool path).
- Brief-progress behavior on first load depends on the model following the new INTAKE MODE ACTIVE instruction; a follow-on QA pass on ACA is recommended.
