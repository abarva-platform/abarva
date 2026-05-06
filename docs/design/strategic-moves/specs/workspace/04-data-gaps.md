# Workspace Substrate Gap Log — W-4.6

| | |
|---|---|
| **Work Package** | W-4.6 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-gaps.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen) · `02-state.md` (frozen) · `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-shell.md` (W-4.1) · `04-data-canvas-*.md` (W-4.2) · `04-data-writes-*.md` (W-4.3–W-4.5) · `04-data-audit-log.md` (W-4.7) |
| **Author** | Claude Code |

---

## Overview

This document enumerates all substrate gaps discovered during the W-4 data binding layer authoring pass. Each gap represents a binding that cannot be fully specified, implemented, or resolved today due to a missing API route, missing database column or table, missing feature flag, or missing governance definition.

Gap IDs have the form `gap-ws-4-NNN`. Backlog items are referenced as `B-NNN`. Two gaps predating W-4 are cross-referenced: `gap-ws-001` (B-101, PHASE_SHORT_NAMES) and `gap-ws-p5-001` (B-120, P5→Tower gate).

---

## §1 · Gap Table

| gap-id | B-xxx | title | severity | discovered-in | blocking |
|---|---|---|---|---|---|
| gap-ws-001 | B-101 | `PHASE_SHORT_NAMES` constant missing from codebase | Low | W-4.1 shell | No — fallback to full `PHASE_LABELS` available |
| gap-ws-p5-001 | B-120 | P5→Tower gate rule not defined in `governance.ts` | Critical | W-4.2 (P5) | Yes — handoff gate is provisional; P5 panel cannot evaluate until gate defined |
| gap-ws-4-001 | B-117 | No workspace content-update API route for deliverables | High | W-4.2 (P1–P5), W-4.5 | Yes — all artifact signoff mutations, content saves, baseline attest, design signoff reference this gap |
| gap-ws-4-002 | B-118 | No sponsor signoff API route; no workspace-surface artifact upload endpoint | High | W-4.2 (P1), W-4.5 | Yes — sponsor signoff request and artifact upload via canvas blocked |
| gap-ws-4-003 | B-119 | `GATE_APPROVAL_STRICT_MODE` feature flag not implemented | Medium | W-4.3, W-4.4 | No — pilot operates with self-approval; production tier gating deferred |
| gap-ws-4-004 | B-116 | No single workspace GET API (`GET /api/programs/workspace/{moveId}`) | Medium | W-4.1 shell | No — shell reads from multiple individual Supabase queries; no unified fetch route |
| gap-ws-4-005 | B-121 | `scope_boundary` dedicated column missing from `engagements` | Low | W-4.2 (P0) | No — interim in `value_assumptions_jsonb`; content still available |
| gap-ws-4-006 | B-122 | `evidence_family` dedicated column missing from `engagements` | Low | W-4.2 (P0) | No — interim in `value_assumptions_jsonb` |
| gap-ws-4-007 | — | No single workspace GET API (duplicate note, see gap-ws-4-004) | — | — | — |
| gap-ws-4-008 | B-123 | `foundation_checks` JSONB sub-object not formalized in `engagements` schema | Low | W-4.2 (P0) | No — stored as JSONB; content available |
| gap-ws-4-009 | B-124 | `charter_scope` dedicated column missing from `engagements` | Low | W-4.2 (P1) | No — interim in `value_assumptions_jsonb` |
| gap-ws-4-010 | B-125 | `p2_decision` field (continue/discontinue) missing from `engagements` schema | Medium | W-4.2 (P2) | No — interim in `value_assumptions_jsonb`; but decision is displayed prominently |
| gap-ws-4-011 | B-126 | `cost_estimate` field not in `deliverables_v2.structured_data` schema | Low | W-4.2 (P4) | No — ROI calculation shows "pending" fallback |
| gap-ws-4-012 | B-127 | `acknowledged` status value missing from `founder_approval_requests.status` enum | High | W-4.2 (P5) | Partial — `acknowledged` display state is not distinguishable from `pending`; Tower acceptance flow degraded |
| gap-ws-4-013 | B-128 | `execution_team_readiness` request type missing from `founder_approval_requests` | Medium | W-4.2 (P5) | Yes — P5 gate item 2 (execution team confirmed readiness) has no substrate |
| gap-ws-4-014 | B-129 | `value_realization_framework` module key not seeded or tracked | Low | W-4.2 (P5) | No — P5 gate item 5 is soft; soft gap is not blocking |
| gap-ws-4-015 | B-130 | `POST /api/programs/phase-gate` writes to file-system ledger, not Supabase | Critical | W-4.3 | Yes — `engagements.current_phase` not updated by promote; audit log not written; phase state not persisted to DB |
| gap-ws-4-016 | B-131 | No notification service wired for sponsor or Tower notifications | Medium | W-4.3, W-4.5 | No — notifications are a pilot-tier enhancement; promotion/signoff still succeeds without them |

> Note: gap-ws-4-007 row is a duplicate detection artifact — the canonical entry is gap-ws-4-004 (B-116). Both reference the missing unified workspace GET endpoint. Gap-ws-4-007 is retained for cross-reference traceability but has no separate B-ticket.

---

## §2 · Gap Details

### gap-ws-001 / B-101 — PHASE_SHORT_NAMES constant

**Where used:** `ws-identity-phase-label` in the shell (W-4.1), phase rail nodes.

**Current state:** The codebase has `PHASE_LABELS` in `src/lib/programs/types.db.ts` with full display names (e.g., "P0 · Originate"). No `PHASE_SHORT_NAMES` constant (e.g., `["Originate", "Charter", ...]`) exists.

**Interim:** Use `PHASE_LABELS` and truncate in UI if needed. Do not add a new constant without a PR.

**Resolution:** Add `PHASE_SHORT_NAMES: Record<number, string>` to `types.db.ts` in B-101 scope.

---

### gap-ws-p5-001 / B-120 — P5→Tower gate rule

**Where used:** `ws-canvas-p5-gate-panel`, `ws-canvas-p5-gate-handoff-btn`, all P5 gate criterion bindings in `04-data-canvas-p5.md §5`.

**Current state:** `governance.ts` `GATE_RULES` array defines 5 transitions (P0→P1, P1→P2, P2→P3, P3→P4, P4→P5). No entry for P5→Tower exists. `evaluateGate(ctx, moveId, 5, 6)` would find no matching rule and return an empty result.

**Interim:** P5 gate criteria are documented as provisional in Layer 1 (5 criteria) and Layer 2. The `ws-canvas-p5-gate-handoff-btn` should remain disabled until B-120 resolves.

**Resolution:** Add `P5_TO_TOWER` gate rule to `governance.ts` with 3 hard + 2 soft criteria (per Layer 1 doc and W-4.2 §5).

---

### gap-ws-4-001 / B-117 — No workspace deliverable-update API

**Where used:** All artifact signoff interactions in W-4.5 (§4, §5, §6), RACI save in W-4.2 (P5 §8), all canvas panel content-save interactions.

**Current state:** No `PATCH /api/programs/deliverable/{id}/status` route exists. No route updates `deliverables_v2.status`. The Supabase client can be called directly, but there is no server-side route enforcing RBAC, audit log, and gate re-evaluation side effects.

**Proposed route:** `PATCH /api/programs/deliverable/{artifactId}/signoff` with body `{ engagement_id: UUID, signed_by_user_id: UUID, signoff_timestamp: ISO8601, rationale?: string }`.

**Resolution:** B-117 — create the signoff route; also evaluate whether a general `PATCH /api/programs/deliverable/{id}` content-update route is needed (separate ticket).

---

### gap-ws-4-002 / B-118 — No sponsor signoff API; no canvas artifact upload endpoint

**Where used:** W-4.5 §3 (artifact upload), W-4.5 §4.1 (sponsor signoff request), W-4.2 P5 §8 (Tower acceptance submit).

**Current state:** 
- Artifact uploads to `program_attachments` work via existing Supabase upload flow, but no Workspace-canvas-specific upload endpoint (`POST /api/programs/workspace/{moveId}/upload`) exists to tie upload to phase context and trigger gate re-evaluation.
- No `POST /api/programs/signoff-request` route exists for sponsor signoff requests.
- No endpoint for Tower handoff acceptance submission.

**Proposed routes:**
- `POST /api/programs/workspace/{moveId}/upload` — phase-aware artifact upload
- `POST /api/programs/signoff-request` — sponsor/stakeholder signoff request
- `POST /api/programs/workspace/{moveId}/tower-acceptance` — Tower acceptance submit + record

**Resolution:** B-118 — three sub-routes; prioritize upload > sponsor signoff > Tower acceptance.

---

### gap-ws-4-003 / B-119 — GATE_APPROVAL_STRICT_MODE flag

**Where used:** W-4.3 §2.1 (permissions), W-4.4 §3 (route behavior), W-4.4 §5.

**Current state:** Gate promotion self-approval is permitted for all authenticated users (pilot mode). No `GATE_APPROVAL_STRICT_MODE` env var or feature flag exists to enforce `admin`/`maestro`-only promotion in production mode.

**Resolution:** B-119 — add `GATE_APPROVAL_STRICT_MODE=true/false` to environment config; wire into `POST /api/programs/phase-gate` handler and `POST /api/programs/gate-criterion` handler (once B-117 route exists).

---

### gap-ws-4-004 / B-116 — No unified workspace GET API

**Where used:** W-4.1 shell data load context.

**Current state:** The workspace shell loads data from multiple Supabase queries (engagements, participants, approval requests, deliverables). No single `GET /api/programs/workspace/{moveId}` endpoint exists to return a composed workspace payload.

**Impact:** Multiple sequential queries on workspace load; higher latency; no server-side caching layer.

**Resolution:** B-116 — define `GET /api/programs/workspace/{moveId}` returning a composed `WorkspacePayload` type covering identity card, gate state, phase rail state, and artifact shelf summary.

---

### gap-ws-4-005 / B-121 — scope_boundary column

**Where used:** W-4.2 (P0) §P0.4 (scope section).

**Current state:** `engagements` table has no `scope_boundary TEXT` column. Stored as a key in `value_assumptions_jsonb`.

**Schema addition needed:** `ALTER TABLE engagements ADD COLUMN scope_boundary TEXT;`

**Resolution:** B-121 — migration to add column; backfill from JSONB; update all read/write bindings to use dedicated column.

---

### gap-ws-4-006 / B-122 — evidence_family column

**Where used:** W-4.2 (P0) §P0.5 (evidence section).

**Current state:** No `evidence_family TEXT` or `evidence_family_selected BOOLEAN` column on `engagements`. Stored in `value_assumptions_jsonb`.

**Resolution:** B-122 — migration; the gateway criterion `evidence_family_selected` in governance.ts already depends on this field being checkable.

---

### gap-ws-4-008 / B-123 — foundation_checks formalization

**Where used:** W-4.2 (P0) foundation check panel elements.

**Current state:** P0 foundation checks (capacity confirmed, executive authority confirmed, etc.) are stored as keys under `value_assumptions_jsonb`. No dedicated columns or a dedicated `program_foundation_checks` table exists.

**Resolution:** B-123 — evaluate whether a dedicated JSONB column `foundation_checks_jsonb` on `engagements` or a separate `program_foundation_checks` table is the right substrate; create migration.

---

### gap-ws-4-009 / B-124 — charter_scope column

**Where used:** W-4.2 (P1) charter scope panel.

**Current state:** No `charter_scope TEXT` column on `engagements`. The charter scope content (in-scope/out-of-scope boundaries from P1 Charter phase) is stored in `value_assumptions_jsonb`.

**Resolution:** B-124 — migration to add `charter_scope TEXT` to `engagements`.

---

### gap-ws-4-010 / B-125 — p2_decision field

**Where used:** W-4.2 (P2) decision panel (`ws-canvas-p2-decision-*`).

**Current state:** No `p2_decision TEXT` or `discovery_decision ENUM` column on `engagements`. The continue/discontinue decision is stored in `value_assumptions_jsonb`. This is a first-class visible UI element in the P2 decision panel.

**Resolution:** B-125 — migration to add `discovery_decision TEXT CHECK (discovery_decision IN ('continue', 'discontinue', 'pivot'))` to `engagements`.

---

### gap-ws-4-011 / B-126 — cost_estimate in business case deliverable

**Where used:** W-4.2 (P4) ROI display (`ws-canvas-p4-businesscase-roi-display`).

**Current state:** The ROI computation requires `cost_estimate` from the business case deliverable's `structured_data`. No schema enforcement or documented key exists for `structured_data.cost_estimate` in `deliverables_v2`.

**Resolution:** B-126 — document and enforce the `structured_data` schema for `deliverable_type_key = 'business_case'`; include `cost_estimate: number` and `currency: string` keys.

---

### gap-ws-4-012 / B-127 — acknowledged status in founder_approval_requests

**Where used:** W-4.2 (P5) Tower acceptance panel; `ws-canvas-p5-tower-acceptance-status`.

**Current state:** `founder_approval_requests.status` enum values are `pending`, `approved`, `denied`. The `acknowledged` state (Tower has seen the handoff package but not yet formally accepted) is not a native status value. The UI needs to distinguish `submitted/pending` from `acknowledged` from `accepted`.

**Resolution:** B-127 — add `acknowledged` to the `founder_approval_requests.status` check constraint via migration; OR add a separate `acknowledged_at TIMESTAMPTZ` column to track acknowledgment without changing the state machine.

---

### gap-ws-4-013 / B-128 — execution_team_readiness request type

**Where used:** W-4.2 (P5) gate item 2 (`ws-canvas-p5-gate-item-2` — execution team confirmed readiness).

**Current state:** `founder_approval_requests.request_type` has values for charter signoff and phase handoff flows, but no `execution_team_readiness` request type exists. The P5 gate criterion for execution team readiness has no substrate.

**Resolution:** B-128 — add `execution_team_readiness` as a valid `request_type` for `founder_approval_requests`; seed or wire the submission flow for P5 canvas.

---

### gap-ws-4-014 / B-129 — value_realization_framework module

**Where used:** W-4.2 (P5) gate item 5 (`ws-canvas-p5-gate-item-5` — value realization framework handed to Tower, provisional soft).

**Current state:** No `module_key = 'value_realization_framework'` row is seeded in `program_modules` for any engagement archetype. The soft criterion has no substrate.

**Resolution:** B-129 — add `value_realization_framework` to the module seed templates for Workspace archetypes; low priority (soft criterion).

---

### gap-ws-4-015 / B-130 — phase-gate route uses file ledger

**Where used:** W-4.3 (all promote interactions), W-4.2 (all canvas promote buttons).

**Current state:** `src/app/api/programs/phase-gate/route.ts` writes approved phase transitions to `.approvals/phase-gates.json` on the filesystem. It does NOT:
- UPDATE `engagements.current_phase` in Supabase
- INSERT into `program_audit_log`
- Trigger `evaluateGate` re-evaluation
- Enforce role-based permissions beyond Clerk auth

**Resolution:** B-130 — extend `POST /api/programs/phase-gate` to:
1. Write to Supabase `engagements.current_phase = toPhase`
2. Write `program_audit_log` entry `move_promoted_{fromPhase}_to_{toPhase}`
3. INSERT `phase_gate_snapshots` row (may require new table)
4. Optionally: retain file ledger as secondary audit trail during transition

---

### gap-ws-4-016 / B-131 — no notification service

**Where used:** W-4.3 §2.1 side effects item 9 (sponsor notification on promote), W-4.5 §4.1 side effects (sponsor signoff request notification), W-4.2 (P5) Tower acceptance submit side effects.

**Current state:** No notification service, email dispatch, or in-app notification system exists in the codebase. Mutations that logically should notify a sponsor or Tower representative have no delivery mechanism.

**Resolution:** B-131 — design and implement a notification service; likely: Resend for email + in-app `program_notifications` table for activity feed. Pilot tier: notifications not required; email alerts added in production tier.

---

## §3 · Gap Priority Matrix

| Priority | Gap IDs | Rationale |
|---|---|---|
| P0 — Critical (blocks shipping) | gap-ws-p5-001, gap-ws-4-015 | P5 gate undefined + phase promotion not persisting to DB |
| P1 — High (blocks core flows) | gap-ws-4-001, gap-ws-4-002, gap-ws-4-012 | Signoff mutations, artifact upload, Tower acceptance acknowledgment |
| P2 — Medium (degrades UX) | gap-ws-4-003, gap-ws-4-004, gap-ws-4-010, gap-ws-4-013, gap-ws-4-016 | Role enforcement, unified load, P2 decision persistence, P5 team readiness, notifications |
| P3 — Low (schema debt) | gap-ws-001, gap-ws-4-005, gap-ws-4-006, gap-ws-4-008, gap-ws-4-009, gap-ws-4-011, gap-ws-4-014 | Column gaps covered by JSONB interim; ROI calculation; soft P5 criterion; phase label constant |

---

## §4 · Self-QA

| Check | Status |
|---|---|
| All gaps from W-4.1 through W-4.5 enumerated | PASS |
| Each gap has a B-xxx backlog reference | PASS (gap-ws-4-007 deliberately has no separate B-ticket — it is a duplicate of gap-ws-4-004 / B-116) |
| Gaps from prior layers cross-referenced (gap-ws-001, gap-ws-p5-001) | PASS |
| Priority matrix included | PASS |
| No "TBD" in gap detail rows | PASS |
| Resolution path specified for each gap | PASS |
