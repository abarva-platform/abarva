# Setup / Admin

## Page / Category Name

Setup / Admin.

## Purpose

Configure tenant identity, users, permissions, connectors, data onboarding, dataset readiness, and evidence usability.

## Primary User Question

What must be connected or configured before AbarVa can produce reliable work?

## Agent Anchor

Steward anchors setup readiness. Nexus can explain downstream impact. Sentinel can flag governance risk. Atlas can summarize operating readiness.

## Journey / Workflow State

Setup state: missing, requested, connected, loaded, parsed, available, usable evidence, stale, restricted, waived, or not applicable.

## UI Zones

- Setup journey progress.
- Connector readiness.
- Dataset inventory.
- Permission checks.
- Evidence usability summary.
- Governance and audit panel.

## Data Required

Tenant profile, users, roles, connectors, dataset metadata, file inventory, permission state, parsing status, evidence usability, and audit events.

## Seed Data Today

Seeded tenant profile, seeded datasets, seeded connector placeholders, and deterministic readiness states.

## Real Data Tomorrow

Connected SaaS systems, uploaded files, parsed documents, normalized tables, evidence ledger entries, user and role data, and audit logs.

## Actions Supported

Invite users, configure roles, add connectors, request data, upload approved files, mark waivers, review parsing readiness, and resolve access issues.

## Missing-Data Behavior

Show the exact missing connector, permission, dataset, or parsing state and the next owner action.

## MVP / V1 / V2 Classification

MVP: readiness inventory and manual state tracking. V1: connector onboarding and evidence usability tracking. V2: automated governance checks and remediation workflows.

## Dependencies

Auth, tenant model, connector registry, file registry, evidence ledger, audit log, and Steward contracts.

## Wireframe Required

Yes.

## What Not To Show If Data Is Missing

Do not show connected-system claims, parsed evidence, or readiness scores without actual readiness records.
