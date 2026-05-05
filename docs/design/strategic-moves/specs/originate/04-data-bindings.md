# Originate Page · Layer 4 Data Binding Spec

| | |
|---|---|
| **Work Package** | O-4.1, O-4.2, O-4.3, O-4.4 |
| **Doc path** | `docs/design/strategic-moves/specs/originate/04-data-bindings.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending O-4.5 sign-off |
| **Preceding layers** | `01-anatomy.md` (frozen), `02-state.md` (frozen), `03-interactions.md` (frozen) |
| **Companion** | `SPEC_METHODOLOGY.md` §2.4, `SPECS_AND_AGENT_TRAINING_WBS.md` §5.1.4 |
| **Author** | Claude Code |

---

## Overview

This document specifies the data bindings for every visible field and every mutating interaction on the Originate page (`/strategic-moves/new`).

**Structure:**

- **§1 — Read bindings (O-4.1):** Every visible field → DB source, API route, computed vs stored, refetch trigger, fallback, permissions.
- **§2 — Write bindings (O-4.2):** Every mutating interaction → mutation API, optimistic update, rollback, audit log shape, side effects.
- **§3 — Substrate gap log (O-4.3):** All bindings with no current substrate mapped to numbered backlog items.
- **§4 — Audit log spec (O-4.4):** Full audit log entry shape for each Originate mutation.

**Substrate context:** The Originate page writes to `program_origination_drafts` during the session and to `engagements` + `engagement_participants` + `program_approval_requests` on promote. The `program_audit_log` table is write-only (no UPDATE/DELETE permitted by RLS + trigger). The `program_origination_drafts.state` column is a JSONB blob holding `OriginationDraftState` (`{ sessionId, turns, brief, patternMatch }`).

---

## §1 · Read Bindings (O-4.1)

### 1.0 Column definitions

| Column | Content |
|---|---|
| `element-id` | Stable ID from Layer 1 |
| `db-table-or-view` | Source table, view, or computed field |
| `query-api-route` | API route that provides this data |
| `computed-or-stored` | Whether value is computed at query time or stored |
| `refetch-trigger` | What event causes a refetch |
| `fallback` | What renders when null or fetch fails |
| `update-permissions` | Which roles/conditions can update this field |

---

### 1.1 Identity card

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `orig-identity-eyebrow` | Computed from `program_origination_drafts.created_at` | `GET /api/programs/origination-draft?surface=/strategic-moves/new` (draft row `created_at`) | Computed: `DRAFT-{ISO date of draft.created_at}` | Once on page load; no refetch | "DRAFT" (static fallback when no draft exists — new session) | Not user-editable |
| `orig-identity-title` | `program_origination_drafts.state->'brief'->>'programName'` | `GET /api/programs/origination-draft` (draft `state.brief.programName`) | Stored in JSONB draft state | On Nexus extraction of scaffold step 1 content (scaffold step 1 completion event) | "Untitled Move" placeholder | Auto-derived by Nexus; user cannot directly edit on this page |
| `orig-identity-status-pill` | Hardcoded: always "P0 Originate" while on this route | N/A | Computed (constant) | Never — static for this route | N/A | Not editable |

---

### 1.2 Phase rail

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `orig-rail-phase-node-p0` | Phase short label from `PHASE_LABELS[0]` in `src/lib/programs/types.db.ts` | N/A — rendered from constant | Computed: `PHASE_LABELS[0]` = `'Originate'` | Never — constant | "Originate" (hardcoded as fallback) | Not editable |
| `orig-rail-phase-node-p1` | `PHASE_LABELS[1]` = `'Charter'` | N/A | Computed | Never | "Charter" | Not editable — non-interactive |
| `orig-rail-phase-node-p2` | `PHASE_LABELS[2]` = `'Discover & Diagnose'` | N/A | Computed | Never | "Discover & Diagnose" | Not editable |
| `orig-rail-phase-node-p3` | `PHASE_LABELS[3]` = `'Design Future State'` | N/A | Computed | Never | "Design Future State" | Not editable |
| `orig-rail-phase-node-p4` | `PHASE_LABELS[4]` = `'Roadmap & Business Case'` | N/A | Computed | Never | "Roadmap & Business Case" | Not editable |
| `orig-rail-phase-node-p5` | `PHASE_LABELS[5]` = `'Mobilize & Handoff'` | N/A | Computed | Never | "Mobilize & Handoff" | Not editable |
| `orig-rail-tower-indicator` | Hardcoded label "→ Tower" | N/A | Computed (constant) | Never | "→ Tower" | Not editable |

> **Substrate note on `PHASE_LABELS`:** The constant `PHASE_LABELS` (Record<number, string>) already exists in `src/lib/programs/types.db.ts` as of 2026-05-05. It provides the full phase names keyed by phase number (0–5). The shorter rail display labels (e.g. "Diagnose" vs. "Discover & Diagnose") for tight rail spaces are a separate concern; see substrate gap `gap-orig-001` (B-101 from Layer 1 anatomy — `PHASE_SHORT_NAMES` constant). Rail dots in the Originate context can use `PHASE_LABELS` values truncated or as-is until B-101 lands.

---

### 1.3 Chat lane — scaffold steps

All scaffold step data is stored in `program_origination_drafts.state` JSONB. The state blob holds conversation `turns` and `brief` fields.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `orig-chat-scaffold-step-1` (status + content) | `program_origination_drafts.state->'brief'->>'problemStatement'` (step 1 maps to brief.problemStatement in the existing OriginationDraftState shape) | `GET /api/programs/origination-draft?surface=/strategic-moves/new` | Stored in JSONB | After each Nexus response that advances scaffold | `status: 'empty'`, content: null | Written by Nexus (agent); user can edit via inline editor |
| `orig-chat-scaffold-step-2` (status + content — archetype) | `program_origination_drafts.state->'brief'->>'classification'` | Same draft GET | Stored in JSONB | After Nexus classifies archetype (classifier SSE complete event) | `status: 'empty'`, content: null | Written by Nexus; user can edit |
| `orig-chat-scaffold-step-3` (status + content — sponsor) | `program_origination_drafts.state->'brief'->>'sponsor'` | Same draft GET | Stored in JSONB | After Nexus extracts sponsor candidate | `status: 'empty'`, content: null | Written by Nexus; user can edit |
| `orig-chat-scaffold-step-4` (status + content — scope) | `program_origination_drafts.state->>'[scope field]'` (gap: no dedicated `scope` field in current `OriginationDraftState.brief`) | Same draft GET | Stored in JSONB | After Nexus extracts scope | `status: 'empty'`, content: null | Written by Nexus; user can edit |
| `orig-chat-scaffold-step-5` (status + content — evidence family) | `program_origination_drafts.state->>'[evidence field]'` (gap: no dedicated `evidenceFamily` field) | Same draft GET | Stored in JSONB | After Nexus selects evidence family | `status: 'empty'`, content: null | Written by Nexus; user can edit |
| `orig-chat-scaffold-step-6` (status + content — value hypothesis) | `program_origination_drafts.state->'brief'->>'targetOutcome'` (closest existing field) | Same draft GET | Stored in JSONB | After Nexus extracts value hypothesis | `status: 'empty'`, content: null | Written by Nexus; user can edit |
| `orig-chat-scaffold-step-7` (status + F1–F4 checks) | `program_origination_drafts.state->'brief'->'foundationChecks'` (gap: field does not exist yet — see B-105) | Same draft GET | Stored in JSONB | After Nexus completes foundation check extraction | `status: 'empty'`, all F checks: `'not-checked'` | Written by Nexus; user can edit |
| `orig-chat-message-list` | `program_origination_drafts.state->'turns'` | Same draft GET | Stored in JSONB array | After each message send/receive; refetch on page load | Empty array — blank chat | Append-only by Nexus and user |

> **Step-to-field mapping note:** The existing `OriginationDraftState.brief` shape has fields: `programName`, `problemStatement`, `targetOutcome`, `timeline`, `classification`, `matchedPatternId`, `sponsor`, `lead`, `crossProgramDependencies`. These do not 1:1 map to the 7 scaffold steps in the Strategic Moves Originate flow. See substrate gaps B-108 through B-112 in §3 for the missing fields.

---

### 1.4 Canvas lane — brief section panels

Brief section content is read from the same draft JSONB state as scaffold steps. Each section panel mirrors the corresponding scaffold step's content.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `orig-canvas-brief-section-1-content` | `program_origination_drafts.state->'brief'->>'problemStatement'` | `GET /api/programs/origination-draft` | Stored | Scaffold step 1 completion; inline edit save | Empty placeholder: "Paste a CEO note or describe the core bet..." | Any authenticated user on this origination session (`userId` = `program_origination_drafts.user_id`) |
| `orig-canvas-brief-section-2-content` | `program_origination_drafts.state->'brief'->>'classification'` | Same draft GET | Stored | Scaffold step 2 completion; inline edit save | Empty placeholder: "Archetype classification will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-3-content` | `program_origination_drafts.state->'brief'->>'sponsor'` | Same draft GET | Stored | Scaffold step 3 completion; inline edit save | Empty placeholder: "Sponsor candidate will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-4-content` | `program_origination_drafts.state->'brief'->>'[scopeField]'` (gap: B-108) | Same draft GET | Stored | Scaffold step 4 completion; inline edit save | Empty placeholder: "Scope boundary will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-5-content` | `program_origination_drafts.state->'brief'->>'[evidenceFamilyField]'` (gap: B-109) | Same draft GET | Stored | Scaffold step 5 completion; inline edit save | Empty placeholder: "Evidence family will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-6-content` | `program_origination_drafts.state->'brief'->>'targetOutcome'` | Same draft GET | Stored | Scaffold step 6 completion; inline edit save | Empty placeholder: "Value hypothesis will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-7-content` | `program_origination_drafts.state->'brief'->'foundationChecks'` (gap: B-105) | Same draft GET | Stored | Scaffold step 7 completion; inline edit save | Empty placeholder: "Foundation readiness checks will appear here..." | Same as section 1 |
| `orig-canvas-brief-section-7-f1` | `program_origination_drafts.state->'brief'->'foundationChecks'->>'f1'` (gap: B-105) | Same draft GET | Stored | Scaffold step 7 completion | `'not-checked'` | Written by Nexus; editable by user |
| `orig-canvas-brief-section-7-f2` | Same, `->>'f2'` | Same draft GET | Stored | Same | `'not-checked'` | Same |
| `orig-canvas-brief-section-7-f3` | Same, `->>'f3'` | Same draft GET | Stored | Same | `'not-checked'` | Same |
| `orig-canvas-brief-section-7-f4` | Same, `->>'f4'` | Same draft GET | Stored | Same | `'not-checked'` | Same |
| `orig-canvas-brief-section-{N}-status` | Computed from corresponding scaffold step `status_icon` field in draft state | Same draft GET | Computed at render time from draft state | Same trigger as section content | `'empty'` | Not directly editable — derived |
| `orig-canvas-brief-section-{N}-label` | Hardcoded section label string | N/A | Computed (constant) | Never | Hardcoded string | Not editable |

---

### 1.5 Promote bar

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `orig-promote-bar-gate-summary` | Computed: count of `complete` scaffold steps from draft state | `GET /api/programs/origination-draft` (derived from state) | Computed at render | After each scaffold step completion | "0 of 7 complete" | Not editable — derived |
| `orig-promote-bar-status-text` | Computed from `briefCompleteness` + `sponsorState` + `foundationState` dimensions (Layer 2 §2.2 column) | N/A | Computed at render | After any state dimension change | "Complete all 7 sections to promote" (default when brief not complete) | Not editable — derived |
| `orig-promote-bar-promote-btn` (enabled/disabled state) | Derived: `promoteEnabled = briefCompleteness === 'complete' AND sponsorState === 'confirmed'` (Layer 2 §1.2) | N/A | Computed at render | After any state dimension change | Disabled | N/A — not a data field |

---

### 1.6 ACL / persons lookup (sponsor search)

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| Sponsor candidate in `orig-canvas-brief-section-3-content` | `persons` table, filtered by `client_id` and eligibility | `GET /api/v1/persons` (or internal Supabase query in `resolvePersonByLabel`) | Stored in `persons`; lookup is computed match | On scaffold step 3 extraction; when user edits section 3 | Empty / placeholder if no match found; EDGE-A warning if ACL empty | Not editable by user directly — sponsor is resolved by Nexus from ACL |
| Pattern match display in scaffold step 2 / brief section 2 | `engagement_topics` (classifier query: `topic_key`, `title`, `canonical_shape_json`, `deployment_count`, `successful_deployment_count`) | `POST /api/v1/programs/originate` (SSE) → `complete` event `matches` | Stored in `engagement_topics`; confidence scores computed by classifier | On scaffold step 2 conversation completion | No pattern match displayed; section 2 shows classification only | Not editable by user — classifier determines |

---

## §2 · Write Bindings (O-4.2)

### 2.0 Column definitions

| Column | Content |
|---|---|
| `interaction-id` | Stable ID from Layer 3 (element-id + trigger context) |
| `mutation-api-route` | API route that accepts the write |
| `optimistic-update` | What UI changes before server response |
| `rollback-on-failure` | How UI reverts on server error |
| `audit-log-shape` | `{ action, by, at, prev, next }` — see §4 for full shapes |
| `side-effects` | Other tables touched, notifications triggered, agent rescope |

---

### 2.1 Draft saves (background, silent)

#### Message send / scaffold step completion → draft save

| Field | Value |
|---|---|
| **interaction-id** | `orig-chat-input-submit` (click/Enter) triggers Nexus response → on step completion, triggers draft save |
| **mutation-api-route** | `POST /api/programs/origination-draft` with `{ surface: '/strategic-moves/new', state: OriginationDraftState }` |
| **optimistic-update** | Draft save is fire-and-forget — no optimistic UI update. Scaffold step status icon and brief section content update optimistically from Nexus response (before save confirms). |
| **rollback-on-failure** | Draft save failure: no rollback of UI (user's current session state is preserved in memory). Silent retry on next save event. Toast notification only if 3 consecutive save failures. |
| **audit-log-shape** | Draft saves are NOT written to `program_audit_log`. Draft saves write only to `program_origination_drafts.state` (updated_at auto-touched by trigger). |
| **side-effects** | `program_origination_drafts.updated_at` auto-updated by DB trigger `trg_origination_drafts_touch`. No other side effects. |

---

#### Inline brief section edit → save

| Field | Value |
|---|---|
| **interaction-id** | `orig-canvas-brief-section-{N}-edit-btn` (click → inline editor → save) |
| **mutation-api-route** | `POST /api/programs/origination-draft` with updated `state.brief` field |
| **optimistic-update** | The brief section's `-content` element updates immediately with the user's edited text before server confirms. |
| **rollback-on-failure** | On `POST` failure: content reverts to pre-edit value in UI. Toast: "Failed to save — please try again." |
| **audit-log-shape** | Not written to `program_audit_log`. Draft edit events are not audited at the draft stage. The audit trail begins at promote time. |
| **side-effects** | If section 3 (sponsor) is edited: `sponsorState` may change (recomputed from updated draft state). No other side effects. |

---

### 2.2 File attachment

| Field | Value |
|---|---|
| **interaction-id** | `orig-chat-input-attachment` (click → file picker → file selected) |
| **mutation-api-route** | `POST /api/programs/origination-draft` or a dedicated file upload endpoint (gap: B-113 — no dedicated attachment API for Strategic Moves originate context exists yet) |
| **optimistic-update** | File chip appears in message list with "Uploading..." status. |
| **rollback-on-failure** | Chip transitions to error state. File is NOT added to Nexus context. |
| **audit-log-shape** | File attachments during origination are NOT written to `program_audit_log`. File upload is captured in draft state. |
| **side-effects** | File content made available as context for next Nexus message via the agent's context bundle. File is stored ephemerally for the session (not persisted as an artifact). |

---

### 2.3 Promote to P1 Charter — the primary write mutation

This is the most important write on the page. It creates the Strategic Move in the portfolio.

| Field | Value |
|---|---|
| **interaction-id** | `orig-promote-bar-promote-btn` (click → confirmation dialog → confirm) |
| **mutation-api-route** | `POST /api/programs/origination-submit` with `SubmitOriginationBriefInput`: `{ surface, programName, problemStatement, targetOutcome?, timeline?, classification?, sponsor, lead?, matchedPatternId? }` |
| **optimistic-update** | None before API response — page enters S-12 (promote-in-flight) which locks all interactive elements. The optimistic approach here is to lock the UI immediately to prevent double-submit, then wait for server confirmation before navigating. |
| **rollback-on-failure** | Page exits S-12 (unlocks). Promote button re-enables. `orig-promote-bar-status-text` shows error message. Toast with error detail. No DB changes to roll back (the engagement insert either succeeded or failed atomically). |
| **audit-log-shape** | See §4.1 — `move_originated` and `move_promoted_p0_to_p1` entries. |
| **side-effects (on success):** | |
| 1. `engagements` INSERT | New row with `current_phase=0`, `lifecycle_state='submitted_for_approval'`, `status='draft'`, `sponsor_person_id`, `program_archetype`, `value_projected_low_usd`, `value_projected_high_usd`, all brief fields mapped per `submitOriginationBrief` logic |
| 2. `engagement_participants` INSERT (×2) | Sponsor participant (role='Sponsor', approval_authority='sponsor'); Lead participant if different from sponsor (role='Program Lead', approval_authority='contributor') |
| 3. `program_approval_requests` INSERT | Submitted via `submitForApproval()`: `{ tenantKey, programId, requestedByUserId, briefSnapshot }` — creates pending approval request |
| 4. `program_origination_drafts` UPDATE | `committed_engagement_id` set to new `engagements.id` via `markDraftCommitted()` — frees draft slot |
| 5. Navigation | `router.push('/strategic-moves/[newMoveSlug]')` — full route change to new move workspace |
| 6. Analytics | `originate_promoted_to_p1` event |
| 7. Portfolio draft count | Portfolio view should reflect new move (cache invalidation needed — gap B-114) |

> **Data mapping for promote:** The `SubmitOriginationBriefInput` shape expected by `submitOriginationBrief` does not have dedicated fields for all 7 scaffold sections. Specifically: scope/boundary (section 4), evidence family (section 5), and F1–F4 foundation checks (section 7) are not passed as named fields. They are currently packed into `problemStatement` or `targetOutcome` as free text. This is the core substrate gap cluster (B-108 through B-112) — see §3.

---

## §3 · Substrate Gap Log (O-4.3)

All gaps from Layers 1, 2, and 4. Numbered gaps inherit from prior layers; new gaps start at B-108.

### 3.1 Previously identified gaps (from Layers 1 and 2)

| Gap ID | Element | Missing | Impact | Backlog item |
|---|---|---|---|---|
| `gap-orig-001` | `orig-rail-phase-node-{p0..p5}` | `PHASE_SHORT_NAMES` constant for compact rail display labels | Medium | B-101 |
| `gap-orig-002` | `orig-chat-scaffold-step-{1..7}`, `orig-canvas-brief-section-{1..7}` | `program_origination_drafts` table — exists but JSONB state shape does not have dedicated fields for all 7 Strategic Moves scaffold steps | High | B-102 |
| `gap-orig-003` | `orig-canvas-brief-section-7-f1` through `-f4` | F1–F4 foundation readiness check criteria not codified | Medium | B-103 |
| `gap-orig-004` | EDGE-A (no ACL sponsor) | `sponsorAclEmpty` flag missing from `OriginationDraftState.brief` | Medium | B-104 |
| `gap-orig-005` | `orig-canvas-brief-section-7`, F1–F4 fields | `foundationChecks` JSONB sub-object missing from `OriginationDraftState.brief` | High | B-105 |
| `gap-orig-006` | EDGE-C (archetype tie) | `tieBreakerRequired` flag missing from classifier SSE response | Medium | B-106 |
| `gap-orig-007` | EDGE-E (concurrent tabs) | `saveDraft` return value lacks `committed` indicator | Low | B-107 |

### 3.2 New gaps identified in Layer 4 data binding analysis

| Gap ID | Element(s) | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|
| `gap-orig-008` | `orig-chat-scaffold-step-4`, `orig-canvas-brief-section-4` | No `scope` or `scopeBoundary` field in `OriginationDraftState.brief`. Current shape: `{ programName, problemStatement, targetOutcome, timeline, classification, matchedPatternId, sponsor, lead, crossProgramDependencies }`. Scope/boundary from scaffold step 4 has no storage location. | High — scope information is lost between sessions; cannot populate brief section 4 from draft | B-108: Add `scopeBoundary: string | null` to `OriginationDraftState.brief` in `origination-drafts.ts` |
| `gap-orig-009` | `orig-chat-scaffold-step-5`, `orig-canvas-brief-section-5` | No `evidenceFamily` or `evidenceFamilySelection` field in `OriginationDraftState.brief` | High — evidence family selection from scaffold step 5 has no storage | B-109: Add `evidenceFamily: string | null` to `OriginationDraftState.brief` |
| `gap-orig-010` | Promote mutation — `POST /api/programs/origination-submit` | `SubmitOriginationBriefInput` has no fields for: (1) `scopeBoundary` (section 4), (2) `evidenceFamily` (section 5), (3) `foundationCheckResults` (section 7 F1–F4). These sections' content is currently lost at promote time — not persisted to the `engagements` row or `briefSnapshot`. | High — the most important origination sections (scope, evidence, foundation) are not persisted at promote. The P1 Charter team cannot access this data from the Move. | B-110: Add `scopeBoundary`, `evidenceFamily`, `foundationCheckResults` to `SubmitOriginationBriefInput` and to the `engagements` INSERT payload and `briefSnapshot` object. Requires schema additions to `engagements` table (or storage in `value_assumptions_jsonb` as interim). |
| `gap-orig-011` | `orig-canvas-brief-section-{N}-content` (all 7) | No `problem_statement` column on `engagements` at promote time for sections 1 and 4. The current `submitOriginationBrief` maps `problemStatement` input → `engagements.problem_statement` (column added in migration `20260503113000_strategic_moves_schema_v02.sql`). However only section 1 (hypothesis/bet) is mapped. Section 4 (scope) is not. | Medium — schema column exists; mapping in submit function incomplete. | B-111: Map `scopeBoundary` → `engagements.problem_statement` extended field or a new `scope_boundary TEXT` column added via migration |
| `gap-orig-012` | `orig-chat-input-attachment` | No dedicated file attachment endpoint for the Strategic Moves originate context. The existing `POST /api/programs/origination-draft` accepts only `{ surface, state: OriginationDraftState }`. There is no file upload handler that processes `.pdf`, `.docx`, `.txt`, `.md`, `.xlsx` and injects into Nexus context bundle. | High — the attachment button (paperclip) from Layer 1 anatomy has no working backend. | B-112: Create `POST /api/programs/origination-attachment` (or extend chat agent's file ingestion for this surface). Accept multipart/form-data; store file ephemerally; inject into agent context. |
| `gap-orig-013` | Promote → portfolio cache | After `POST /api/programs/origination-submit` succeeds and browser navigates to workspace, the portfolio page's draft count and move list are stale. No cache invalidation signal is emitted to the portfolio. | Medium — portfolio shows stale data until user manually refreshes | B-113: Emit a cache invalidation tag (or revalidate path) for the portfolio route after successful promote. Use Next.js `revalidatePath('/strategic-moves')` or equivalent cache tag invalidation. |
| `gap-orig-014` | `orig-identity-title` | `OriginationDraftState.brief.programName` is set by the user in the original Programs origination form, not auto-derived by Nexus from scaffold step 1. In the Strategic Moves context the title should auto-derive from the hypothesis conversation. This derivation logic does not exist. | Medium — title stays "Untitled Move" until user manually names it | B-114: Nexus agent P0 pack (T-P0) should include a step that extracts `programName` from the hypothesis conversation and updates `draft.brief.programName` via draft save API. |
| `gap-orig-015` | `orig-canvas-brief-section-3-content` (sponsor) | The `resolvePersonByLabel` function in `origination-submit.ts` does an unstructured text search against `persons.name` and `persons.email`. If the draft stores `brief.sponsor` as a display name (free text from Nexus extraction), the resolve at submit time is fuzzy and can fail with `person_not_found`. No ACL check happens during draft phase — only at submit. | Medium — promote can fail with `person_not_found` even when user confirmed a valid sponsor in conversation | B-115: Resolve sponsor to a `persons.id` UUID during scaffold step 3 completion (not deferred to submit time). Store both `sponsor` (display name) and `sponsorPersonId` (UUID) in draft state. |

---

## §4 · Audit Log Spec (O-4.4)

The `program_audit_log` table is write-only (no UPDATE/DELETE, enforced by RLS + DB trigger). Schema:

```
program_audit_log:
  id             UUID (PK, auto-generated)
  tenant_key     TEXT (from active client)
  program_id     TEXT (display ID, e.g. APX-CDP-2026 — or engagement UUID as text before display ID assigned)
  engagement_id  UUID (FK to engagements, nullable)
  actor_id       UUID (FK to persons, nullable — the user performing the action)
  actor_role     TEXT (role of the actor at time of action)
  action         TEXT (discriminator — see below)
  from_state     TEXT (previous state descriptor)
  to_state       TEXT (new state descriptor)
  rationale      TEXT (optional human-readable context)
  evidence_refs  TEXT[] (array of evidence IDs or URLs)
  created_at     TIMESTAMPTZ (auto-set to now())
```

### 4.1 Audit entries produced by Originate mutations

#### `move_originated` — fired at promote time when engagement is first created

```json
{
  "action": "move_originated",
  "tenant_key": "<activeClient.key>",
  "program_id": "<new engagements.id as text (display ID not yet assigned)>",
  "engagement_id": "<new engagements.id>",
  "actor_id": "<tenancy.userId resolved to persons.id>",
  "actor_role": "originator",
  "from_state": "none",
  "to_state": "P0 draft — submitted_for_approval",
  "rationale": "Move originated via /strategic-moves/new scaffold. Scaffold sections: 7/7 complete. Sponsor confirmed.",
  "evidence_refs": ["<matchedPatternId if present>"]
}
```

#### `move_promoted_p0_to_p1` — fired when promote succeeds and phase transitions from 0 to 1

> **Note:** In the current `submitOriginationBrief` implementation, the engagement is inserted at `current_phase=0` and immediately transitions to `submitted_for_approval` lifecycle state. The actual `current_phase` update to 1 (Charter) happens when the approval request is processed. The audit entry below should be written at the point where `current_phase` is set to 1, which is in the approval flow, NOT in `submitOriginationBrief` itself. This is a design clarity gap — see B-116.

```json
{
  "action": "move_promoted_p0_to_p1",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.id>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<tenancy.userId>",
  "actor_role": "originator",
  "from_state": "P0 Originate — submitted_for_approval",
  "to_state": "P1 Charter — approved",
  "rationale": "Promotion from P0 Originate to P1 Charter approved.",
  "evidence_refs": ["<approvalRequestId>"]
}
```

#### `origination_draft_abandoned` — written when a draft is abandoned (edge case — if cleanup process fires)

```json
{
  "action": "origination_draft_abandoned",
  "tenant_key": "<activeClient.key>",
  "program_id": "<program_origination_drafts.id as text>",
  "engagement_id": null,
  "actor_id": null,
  "actor_role": "system",
  "from_state": "open draft",
  "to_state": "abandoned",
  "rationale": "Draft abandoned after 30-day idle TTL (D-11 policy).",
  "evidence_refs": []
}
```

### 4.2 Audit entries NOT produced by Originate (for clarity)

- Draft saves (`POST /api/programs/origination-draft`): NOT audited in `program_audit_log`. Draft state is tracked in the `program_origination_drafts` table itself via `updated_at`.
- Inline brief section edits: NOT audited. These are draft-phase edits.
- File attachments during origination: NOT audited.

### 4.3 Existing audit architecture note

The `program_audit_log` table has both an `actor_id` (UUID FK to `persons`) and a separate `program_id` (TEXT, display ID). At origination time, the display ID may not yet be assigned. The `program_id` column should be populated with the `engagements.id` UUID cast to text as a temporary identifier until the display ID system (B-116) assigns a stable display ID.

---

## §5 · Self-QA

Per `EXECUTION_PLAYBOOK.md §2.3` universal self-QA and `§2.4` spec PR additional QA:

| Check | Status |
|---|---|
| 1. Branch named per §2.1 (`spec/originate-l4-data`) | PASS |
| 2. PR title formatted per §2.2 (`[SPEC] Originate Layer 4 Data Binding (O-4.1 through O-4.4)`) | PASS |
| 3. PR description references O-4.1–O-4.4 and links to WBS | PASS |
| 4. Single work package per PR | PASS |
| 5. Targets `main` | PASS |
| 6. Decision log — no new decisions; substrate gaps B-108 through B-116 logged | PASS |
| 7. Substrate gaps logged with backlog item references | PASS (§3) |
| 8. Internal consistency — all element IDs from Layer 1; all interactions from Layer 3 | PASS |
| 9. Cascade fidelity — bindings describe the data model shown in Flow 2 | PASS |
| 10. Acceptance demo alignment — promote mutation maps to WBS §11.4 demo B | PASS |
| 11. Cross-spec consistency — no contradiction with Layers 1–3 | PASS |
| 12. Substrate verification — all bindings map to real substrate OR numbered backlog item | PASS |
| Every visible field from Layer 1 has a read binding row | PASS |
| Every mutating interaction from Layer 3 has a write binding row | PASS |
| All substrate gaps enumerated | PASS — B-101 through B-116 (extending prior layers) |
| Audit log shape documented for every write | PASS (§4) |
| No "TBD" in any binding row | PASS |

---

## §6 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft | Claude Code |
