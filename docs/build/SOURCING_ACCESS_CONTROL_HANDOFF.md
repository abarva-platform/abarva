# Sourcing Access Control Handoff

Date: 2026-05-01

Status: control-plane doctrine for Sourcing alignment with Programs access policy.

## 1. Non-Negotiable Rule

There is no super admin in a private data plane.

Every user, including an admin, is scoped to exactly one active client at a time. The highest data-plane role is `client_admin`, and that role means "all permitted modules and records for this one client," not cross-client visibility.

## 2. Shared Role Model

| Role | Client Scope | Programs Scope | Sourcing Scope | Setup/Admin | Financial Output |
| --- | --- | --- | --- | --- | --- |
| `client_admin` | One client only | All programs for that client | All sourcing events for that client | Can create/manage users for that client | Restricted by `financial_visibility`; default false |
| `program_member` | One client only | Assigned programs only | None unless separately granted | No | Restricted |
| `program_viewer` | One client only | Assigned programs read-only | None unless separately granted | No | Restricted |
| `source_member` | One client only | None unless separately granted | Assigned sourcing events only | No | Restricted |
| `source_viewer` | One client only | None unless separately granted | Assigned sourcing events read-only | No | Restricted |

Users may have access to Programs, Sourcing, or both, but each grant remains inside one client private data plane.

## 3. Setup/Admin Page Requirements

The Setup/Admin page should support a client admin doing these actions for their one client:

| Admin Action | Required Behavior |
| --- | --- |
| Create user | Create or invite a user tied to exactly one `client_id`. |
| Grant module access | Choose `programs`, `source`, or both. Common surfaces (`intelligence`, `tower`) remain client-scoped and permission-filtered. |
| Assign records | Assign specific program IDs and/or source event IDs for non-admin users. |
| Set approval rights | Grant phase-gate approval for Programs and stage/award approval for Sourcing separately. |
| Set artifact rights | Grant upload, generate, publish, and approve rights separately by module. |
| Set financial visibility | Default false. If false, agents may use restricted financial context for reasoning but must not expose exact budgets, spend, revenue, margins, ROI, payback, or sensitive KPI values in chat or deliverables. |
| Audit changes | Write each user/permission change to the client-scoped audit log. |

The UI must not expose a cross-client user browser, cross-client client switcher, or "super admin" label.

## 4. Programs To Sourcing Mapping

| Programs Control | Sourcing Equivalent |
| --- | --- |
| `person_client_memberships.access_level = client_admin` | Same client-level membership, still one client only |
| `engagement_participants` | `source_event_participants` or equivalent sourcing participant table |
| `program_access_level` | `source_access_level` |
| `can_approve_phase_gates` | `can_approve_source_stages` / `can_approve_award` |
| `can_upload` | `can_upload_source_artifacts` |
| `can_generate_deliverables` | `can_generate_sourcing_artifacts` |
| `can_publish_deliverables` | `can_publish_sourcing_artifacts` |
| `allowedProgramIdsForUser()` | `allowedSourceEventIdsForUser()` |
| `canReadProgram()` | `canReadSourceEvent()` |
| Nexus `USER ACCESS POLICY` prompt block | Source/Sourcing agent `USER ACCESS POLICY` prompt block |
| `restricted-output-policy.ts` | Reuse the same restricted-output policy |

## 5. Sourcing Agent Behavior

The Sourcing agent should follow the same guardrails Nexus now follows:

1. Resolve active tenant before answering.
2. Load the user access policy before reading records or writing artifacts.
3. Refuse cross-client create/read/update requests.
4. Treat `client_admin` as all records in active client only.
5. Treat assigned users as record-scoped.
6. Use financial context privately when allowed by retrieval, but do not expose exact restricted values unless `financial_visibility = true`.
7. Include a context receipt when answering material sourcing questions: tenant, module, records used, restricted data withheld, and missing evidence.

## 6. Negative Tests For Sourcing

| Test | Expected Result |
| --- | --- |
| Meridian user asks to create Apex sourcing event | Refuse and explain the safe path is to sign in under the Apex client context. |
| Source member asks to browse all client sourcing events | Refuse list-browse; show only assigned events. |
| Programs-only user asks to edit sourcing event | Refuse module action; explain that Sourcing access has not been granted. |
| User asks for exact vendor spend without financial visibility | Answer with qualitative risk/readiness framing and state that restricted financial values are withheld. |
| Client admin asks to create a Sourcing user for another client | Refuse cross-client administration. |

## 7. Implementation Note

Programs now treats `client_admin` as the highest private-data-plane role. Legacy `abarva_super_admin` values are normalized to `client_admin` and should not be reintroduced in Sourcing schema, prompts, fixtures, seed packs, or UI copy.
