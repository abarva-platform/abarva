# Source Dashboard Mission Preview Review

## 1. Scope

This slice adds a tiny deterministic agent mission preview to the `/source` dashboard.

It uses existing local Source context, validation, multi-agent briefing, mission, and mission report helpers. It does not add API calls, model calls, chat UI, upload/parsing, event canvas expansion, scorecard UI, artifact drawer UI, value ledger UI, vendor flow, AI/RFP generation, schedulers, persistence, workflow engine, approval engine, or Programs integration.

## 2. Files Changed

- `src/components/source/AbarVaSourceDashboard.tsx`
- `docs/abarva-source/build-pack/implementation-reviews/24_SOURCE_DASHBOARD_MISSION_PREVIEW_REVIEW.md`
- `docs/build/production-readiness.json`

## 3. Implementation Summary

The dashboard now builds a deterministic `SourceAgentMissionReport` for the most exposed Source event.

It renders a compact `Agent missions` section inside the existing Source command-read panel:

- top mission selection from `report.topMissions`
- up to 3 visible missions
- preference for different agents before duplicate agent missions
- agent name
- priority/state
- evidence status
- mission title
- recommended action
- critical/high count summary

For the seeded Data & AI event, the expected top mission remains Steward's stage gate check.

## 4. Design Intent

The preview is intentionally small:

- it stays inside the existing command-read panel
- it avoids a new chat rail
- it avoids a noisy mission feed
- it does not add freeform input
- it keeps agent work visible but secondary to the Source dashboard

Three choices plus custom was deferred because it would add visual density and imply interaction behavior that is not implemented.

## 5. Deterministic Data Path

The component builds the report locally:

1. use the most exposed Source event from existing dashboard data
2. build `SourceAgentContextBundle`
3. build context validation readable report
4. build workflow validation readable report
5. build deterministic multi-agent briefing
6. build `SourceAgentMissionReport`
7. render selected top missions

No network request, API route, model provider, persistence, upload parsing, or state mutation is involved.

## 6. Production Readiness Impact

`docs/build/production-readiness.json` was updated conservatively:

- Source / Outsourcing now notes the tiny deterministic dashboard mission preview.
- The tracker records that authenticated visual review is still needed.
- Source remains not pilot-ready and not production-ready.

No readiness gate was promoted to full-flow, pilot, or production readiness.

## 7. Validation Results

Passed:

- `npx eslint src/components/source/AbarVaSourceDashboard.tsx src/components/source/SourceAlertPanel.tsx src/lib/source/agent-mission-report.ts`
- `npx tsc --noEmit --pretty false`
- `npm run integrity:dom`
- `npm run build -- --webpack`
- `git diff --check`
- JSON parse check for `docs/build/production-readiness.json`
- trailing whitespace check
- non-ASCII check

Pending / limited:

- `npm run build` plain Turbopack mode is not practical in this isolated worktree because `node_modules` is symlinked outside the worktree root.
- Authenticated screenshot was not captured in this coding slice. The next review should capture `/source` while signed in.

## 8. Screenshot / Manual Review Status

No authenticated screenshot was captured in this slice.

Reason:

- the local Codex worktree does not have an established authenticated browser session for `/source`
- this slice stayed focused on deterministic code and validation

The change is intentionally compact and uses the existing command-read panel, but it should still receive authenticated visual review after merge.

## 9. Remaining Gaps

- no interactive mission actions
- no mission drawer
- no API contract for mission reports
- no live mission queue
- no persistence
- no scheduler/background refresh
- no authenticated visual review yet

## 10. Confirmation

No API route, model call, chat UI, upload/parsing, persistence, scheduler/background job, event canvas, scorecard UI, artifact UI, value ledger UI, workflow engine, approval engine, or Programs work was implemented.
