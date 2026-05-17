# Source Execution Room Persistence

Date: 2026-05-17

## Purpose

The first Execution Room release is a deterministic operating view built from the Renewal Cockpit. It is intentionally honest: actions that are not persisted are labelled as pending. This document defines the persistence layer required to turn the room into the durable sourcing work system.

## Tables

### `source_execution_actions`

One row per accountable action in a sourcing execution room.

Suggested columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. |
| `tenant_key` | text | Required. Must match caller tenancy. |
| `contract_id` | text | Vendor-contract substrate id. |
| `source_event_id` | uuid nullable | Linked Source event once created. |
| `action_kind` | text | Enum aligned to `ExecutionActionKind`. |
| `title` | text | Human-readable action title. |
| `owner_ref` | text nullable | Person id, email, or external owner reference. |
| `due_date` | date nullable | SLA date. |
| `status` | text | `not_started`, `in_progress`, `blocked`, `complete`, `pending_external`. |
| `evidence_refs` | jsonb | Contract, financial, clause, or segment refs. |
| `created_by` | text | Clerk/Entra user id. |
| `created_at` | timestamptz | Default now. |
| `updated_at` | timestamptz | Updated only by allowed state transitions. |

### `source_execution_approvals`

One row per approval role on an execution room.

Suggested columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. |
| `tenant_key` | text | Required. Must match caller tenancy. |
| `contract_id` | text | Vendor-contract substrate id. |
| `approval_role` | text | finance, legal, security, business_sponsor, it_owner. |
| `owner_ref` | text nullable | Owner or approver. |
| `decision_needed` | text | The exact approval ask. |
| `due_date` | date nullable | Approval SLA. |
| `status` | text | Same action status enum. |
| `evidence_refs` | jsonb | Grounding refs. |
| `decided_at` | timestamptz nullable | Set only when approved/rejected. |
| `decided_by` | text nullable | User id. |

### `source_execution_audit`

Append-only event log for sourcing execution.

Suggested columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. |
| `tenant_key` | text | Required. |
| `contract_id` | text | Vendor-contract substrate id. |
| `event_type` | text | action_created, status_changed, owner_assigned, notice_intent_recorded, approval_recorded, final_decision_recorded. |
| `actor_ref` | text | User id or service principal. |
| `event_payload` | jsonb | Before/after fields and evidence refs. |
| `created_at` | timestamptz | Default now. |

## RLS / tenancy

All three tables must enable RLS.

Policy shape:

- Read/write only when `tenant_key = current_setting('request.jwt.claims', true)::jsonb->>'tenant_key'`.
- Admin/service-role maintenance remains explicit, not broad public grants.
- Cross-tenant probes must assert 403/zero rows for contract ids from another tenant.

## Notice workflow

The current UI says "notice intent recorded - pending." To make this operational:

1. Clicking **Serve notice** creates a `source_execution_actions` row with `action_kind = 'serve_notice'`.
2. The row is assigned to legal/procurement ops with a due date equal to the notice deadline.
3. The event log records `notice_intent_recorded`.
4. The product must not say "notice served" until an authorized user marks the action complete and attaches supporting evidence.
5. Completion writes an audit event with the attachment/evidence ref.

## Owner workflow

The current UI can display the contract owner. To make ownership durable:

1. Assign owner writes `owner_ref` on the action row.
2. Owner changes append audit events.
3. Queue cards should display the persistent owner and SLA.
4. "not recorded" remains the fallback when no owner row exists.

## Final decision and outcome

The final-decision action should link to the Tower outcome ledger:

- final posture
- committed spend
- avoided spend or savings target
- risk retired
- measurement date
- evidence refs

Only realized outcomes should feed the Context layer and anonymized pattern-feedback path.

## Non-operational claims to avoid

Until the tables and routes exist, the UI must not claim:

- notice has been legally served
- an owner has been assigned in reporting
- Tower watch items are live
- finance/legal/security approvals are complete
- vendor email was sent

The current Execution Room correctly labels these as pending or draft-only.
