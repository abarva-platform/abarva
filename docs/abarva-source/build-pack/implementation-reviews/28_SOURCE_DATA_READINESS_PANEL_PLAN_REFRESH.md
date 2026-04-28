# Source Data Readiness Panel Plan Refresh Review

Date: 2026-04-26
Status: refreshed docs-only plan

## Purpose

Refresh the existing Source Data Readiness Panel plan against the merged dashboard mission preview direction and the newly planned Source event canvas shell.

This is planning only. It does not implement UI, runtime APIs, Admin/Setup readiness state, upload/parsing, evidence storage, workflow behavior, or model calls.

## Files Changed

- `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_DATA_READINESS_PANEL.md`
- `docs/abarva-source/build-pack/implementation-reviews/28_SOURCE_DATA_READINESS_PANEL_PLAN_REFRESH.md`

## What Was Refreshed

- Updated the plan date and status.
- Added relationship to the Source dashboard mission preview and event canvas shell.
- Clarified that Source consumes Admin/Setup readiness rather than creating duplicate setup behavior.
- Clarified that the data readiness panel should appear inside the event canvas shell as a compact current-stage readiness zone.
- Mapped readiness gaps to deterministic agent missions:
  - Nexus for data-request missions,
  - Sentinel for evidence-gap missions,
  - Steward for gate-check missions,
  - Atlas for value-risk missions.
- Added a rule that missing readiness should create missions only when it affects current-stage progress, gate readiness, evidence confidence, or executive value/risk.
- Added first-shell placement guidance that limits the panel to summary, top gaps, owner/handoff, workflow impact, and mission tie-in.

## Confirmation Of Ownership

Admin/Setup remains the owner of:

- connector setup,
- dataset readiness,
- access state,
- parsing state,
- evidence usability,
- platform-level readiness.

Source consumes that state and translates it into sourcing impact, missions, blockers, artifact-tier implications, and stage-gate consequences.

## Event Canvas Alignment

The refreshed plan aligns with `NEXT_SLICE_PLAN_SOURCE_EVENT_CANVAS_SHELL.md`:

- data readiness is a shell zone, not a separate Source setup flow,
- current-stage gaps should be visible without crowding the first viewport,
- the full data inventory table can wait until the Admin/Setup readiness contract exists,
- the shell may include a placeholder before full panel implementation.

## Production Readiness Impact

No `production-readiness.json` update is recommended for this slice.

Reason: this is docs-only planning and does not change runtime capability, route smoke, validation evidence, readiness gates, blockers, or production status.

## Validation Results

- `git diff --check`
- trailing whitespace check
- non-ASCII punctuation check

All passed.

## Explicitly Out Of Scope

- No UI implementation.
- No runtime code.
- No API routes.
- No model calls.
- No upload/parsing.
- No evidence ledger implementation.
- No Admin/Setup implementation.
- No Source-local setup workflow.
- No event canvas implementation.
- No scorecard UI.
- No artifact drawer UI.
- No value ledger UI.
- No workflow or approval engine.
- No `/programs`, `/preview`, or `/demo` work.
