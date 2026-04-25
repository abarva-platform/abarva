# Source Artifacts / Reviews / Approvals

## Page / Category Name

Source Artifacts / Reviews / Approvals.

## Purpose

Track Source artifacts through draft, input gaps, review, approval, lock, issue, supersede, and archive states.

## Primary User Question

Which artifacts are ready, which need input, and who must approve them?

## Agent Anchor

Nexus summarizes artifact readiness. Steward anchors approval and governance state. Sentinel flags missing evidence or contradictory claims. Atlas can summarize operating impact.

## Journey / Workflow State

Artifact lifecycle: not started, draft, needs inputs, in review, changes requested, approved, locked, issued, superseded, or archived.

## UI Zones

- Artifact inventory.
- Review queue.
- Approval state.
- Evidence links.
- Change request summary.
- Governance/audit notes.

## Data Required

Artifacts, versions, review owners, approval records, evidence links, missing inputs, comments, issue state, and audit history.

## Seed Data Today

Seeded artifact placeholders, deterministic lifecycle states, seeded missing-input notes, and seeded review/approval examples.

## Real Data Tomorrow

Generated or uploaded artifacts, version records, approval events, reviewer comments, evidence ledger links, and audit logs.

## Actions Supported

Open artifact, request input, send to review, approve, request changes, lock, issue, supersede, archive, and inspect evidence.

## Missing-Data Behavior

Hold the artifact in needs-inputs or draft state and show the missing source, reviewer, approval, or evidence link.

## MVP / V1 / V2 Classification

MVP: artifact state and review queue. V1: versioning, approval routing, and evidence binding. V2: document collaboration and external edit/re-upload.

## Dependencies

Artifact model, approval state, evidence ledger, audit log, workflow validation, and user/role model.

## Wireframe Required

Yes.

## What Not To Show If Data Is Missing

Do not show approved, locked, issued, or evidence-backed claims unless approval and evidence records exist.
