# Intelligence Pattern Governance Manifest

Date: 2026-06-03
Status: candidate
Backlog: T233, T234
Release lane: global-control-lane

## What Changed

Added responsible-AI controls for Sentinel active pattern recommendations and
the Intelligence-to-Moves handoff contract.

## Included

- Pattern cards now render:
  - `AI-assisted pattern recommendation`
  - confidence label
  - evidence refs from source signal ids
  - human promotion gate warning
- `/api/v1/programs/originate/from-thread` now returns `promotionGate` with:
  - `required: true`
  - source thread id
  - minimum rationale length
  - required evidence keys
  - decision-support warning
- Catalog updates for:
  - `docs/legal/AI_GENERATED_UI_CATALOG.md`
  - `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- Verifier and release record.

## Boundary

This slice closes the visible T233 pattern-card standard for the audited
Sentinel active-pattern surface. T234 remains `In progress` until the consuming
promotion dialog persists a human rationale/evidence packet before Move
creation.

No database writes, migrations, or live Sentinel runtime are added.
