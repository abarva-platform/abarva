# 2026-06-08-discovery-persist-on-promote — Persist discovery shape on Promote

## Release ID

`2026-06-08-discovery-persist-on-promote`

## Status

`candidate`

## Plain-English Summary

Tier B follow-on to the discovery capture re-home. When a user promotes a Strategic Move from
the live Originate surface, the captured discovery shape (problem, archetype, sponsor, value
hypothesis) is now sent with the submission so it carries into the engagement charter, instead
of being discarded at promote time. The server already accepted and gated this field; this
change wires the live client to actually send it.

## Layer Impact

Affects the **global-control-lane** app tier (the live Originate promote path), gated by the
**experimental lane** flag `discovery_intake_v2`. The server (`submitOriginationBrief` →
`applyDiscoveryShapeIfEnabled`) already gates persistence by the same flag and writes into the
`engagements.charter` JSONB — no new schema or migration. Client-only change.

## Client Applicability

- All clients: no change while the flag is off (the client sends `null`).
- Feature flag: `discovery_intake_v2` — active for `meridian`/`apexretail` in the Azure lab only.
- Internal only: effectively internal/lab until the flag is widened.

## Changes Included

- PR (this branch `discovery-intake/persist-on-promote`).
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — `promote()` now includes
  `discoveryShape` (via the existing `strategicMoveBriefToDiscoveryShape` adapter) when the flag
  is on; `null` otherwise. No server change required (route forwards the body; submit gates it).

## QA / Validation

- `tsc --noEmit`: **passed** (0 errors in changed file).
- `eslint`: **passed**.
- Adapter already covered by `strategicMoveBriefToDiscoveryShape` unit tests (3/3 pass).
- Server persistence path (`applyDiscoveryShapeIfEnabled`) is flag-gated and previously tested.
- Live promote verification on ACA: see Audit Evidence. Charter-level DB read not performed from
  the workstation (private Postgres is not workstation-reachable and no public firewall exception
  is permitted); persistence is covered by the server logic + tests. **Pass (with that caveat).**

## Rollout Plan

Merge to `main`. Flag stays off in Vercel production (no production behavior change). On the
Azure lab it ships in the next ACA image/revision built from `main`.

## Rollback Plan

Disable the flag (client then sends `null`), or revert this PR. No migrations or data backfill,
so rollback is immediate and side-effect-free.

## Audit Evidence

- PR URL (this branch).
- ACA Originate URL; a promoted Move created from a flag-on Meridian session.
- The discovery re-home record (`2026-06-08-discovery-capture-rehome-strategic-moves`) for the
  surface this builds on.

## Known Gaps

Tier B remainder still open: surfacing the assessment-template download on the Move detail /
Diagnose surface, and wiring the upload → extraction → DiscoveryReceiptCard evidence flow onto
the live surfaces. Charter-persistence has not been verified via a live DB read (workstation
cannot reach the private Postgres).
