# Moves Evidence Lifecycle And Gate Consistency Fix

Status: local implementation complete; not deployed; not live-proven.

## What Changed

- Workspace uploads now open or reuse a `program_evidence_reviews` lifecycle row.
- Discovery readiness now reads approved Move evidence through `program_evidence_reviews`, not raw uploaded rows.
- Move Context Extract freshness now includes accepted evidence count, latest accepted review timestamp, evidence fingerprint, source mode, blueprint id, and blueprint version.
- A stale current extract is rebuilt when accepted evidence or blueprint posture changes.
- Generation no longer falls back to unreviewed `program_evidence_items`.
- Healthcare/contact-center Agent Assist now maps to a dedicated evidence blueprint instead of the generic AI operations blueprint.
- Phase gate approval responses now return `gateId`, transition, capture status, blocked details, and `nextAction`.

## What This Fixes

- Uploaded evidence appearing in one surface but not the context extract.
- Generated deliverables consuming evidence that the review/readiness layer did not agree was accepted.
- Stale context extract reuse after new accepted evidence arrives.
- Agent Assist asking for generic evidence instead of member-service, claims, CRM, knowledge, PHI, and contact-center evidence.
- Approval UX ambiguity when a gate fails or advances.

## What This Does Not Do

- It does not bypass human gate approval.
- It does not promote candidate data.
- It does not update Active Tenant Access.
- It does not claim Tower value realization.
- It does not deploy to ACA or prove production browser behavior.

