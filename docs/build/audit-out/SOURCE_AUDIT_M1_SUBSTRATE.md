# Source Audit · M1 · Substrate

| Field | Value |
|---|---|
| Mode | M1 · Substrate |
| Status | In progress (initial pass complete) |
| Audit date | 2026-05-06 |
| Scope | Schema-level audit. Live tenant data queries deferred to a follow-up pass requiring DB connection. |
| Findings count | 4 compliance · 3 drift · 5 design observations |

---

## Migrations inspected

| File | Created | Purpose |
|---|---|---|
| `supabase/migrations/20260430150000_source_events.sql` | 2026-04-30 | `source_events` table — event registry |
| `supabase/migrations/20260430151000_source_event_approvals.sql` | 2026-04-30 | `source_event_approvals` — approval log |
| `supabase/migrations/20260430220000_source_artifact_registry.sql` | 2026-04-30 | `source_artifacts` + 9 parsed-object tables |
| `supabase/migrations/20260501170000_source_access_control.sql` | 2026-05-01 | RLS policies + access control |
| `supabase/migrations/20260501171000_source_demo_users.sql` | 2026-05-01 | Demo user seeding for RLS |
| `supabase/migrations/20260502122500_source_value_ledger_artifact_family.sql` | 2026-05-02 | Adds `value_ledger` artifact family |
| `supabase/migrations/20260502143000_source_11_stage_lifecycle.sql` | 2026-05-02 | 11-stage normalization (legacy keys retained) |

---

## 1 · Compliance findings

### F-M1-001 · Stage keys in code match dossier+design (modern set)
- **Source aligned:** Dossier §2.2 (11 canonical stages) + Design B step rail
- **Evidence:** [supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11-23](supabase/migrations/20260502143000_source_11_stage_lifecycle.sql:11-23). Modern keys: `strategy, scope, rfp, responses, evaluation, pricing, bafo, executive_decision, selection, transition, value`.
- **Bucket:** Compliance — POSITIVE
- **Severity:** N/A
- **Note:** All 11 dossier stages have a code-level enum entry. Stage names are abbreviated in code (`rfp` vs dossier "RFP/RFI Readiness", `selection` vs "Vendor Selection Readiness"). The mapping is unambiguous.

### F-M1-002 · Tenant-scoped RLS on every Source table
- **Source aligned:** Memory ("knowledge-layer broker boundary") + dossier security posture
- **Evidence:** [supabase/migrations/20260430220000_source_artifact_registry.sql:316-354](supabase/migrations/20260430220000_source_artifact_registry.sql:316-354). All 10 source_* tables have RLS enabled with service-role-bypass + authenticated-tenant-scoped read policies. Tenant key is read from `auth.jwt() ->> 'tenant_key'`.
- **Bucket:** Compliance — POSITIVE
- **Severity:** N/A

### F-M1-003 · Context receipts substrate exists (`source_context_receipts`)
- **Source aligned:** Dossier truth #1 (evidence integrity), §13.1 universal acceptance criterion 3 ("context-used information visible or accessible")
- **Evidence:** [supabase/migrations/20260430220000_source_artifact_registry.sql:298-313](supabase/migrations/20260430220000_source_artifact_registry.sql:298-313). Per-turn provenance table records `agent_name`, `used_artifact_ids[]`, `used_chunk_ids[]`, `used_fact_ids[]`, `used_graph_edge_ids[]`, `used_pattern_ids[]`.
- **Bucket:** Compliance — STRONG POSITIVE
- **Severity:** N/A
- **Note:** This is unusually strong evidence integrity infrastructure. The substrate doesn't just store agent output; it records exactly what the agent *consumed* to produce that output. This makes citation-checking and audit-trail reconstruction tractable.

### F-M1-004 · Storage bucket scoped per tenant
- **Source aligned:** Dossier security posture
- **Evidence:** [supabase/migrations/20260430220000_source_artifact_registry.sql:14-17,358-372](supabase/migrations/20260430220000_source_artifact_registry.sql:14). Bucket `source-artifacts` private, path convention `{tenant_key}/{source_event_id}/{artifact_id}/{safe_filename}`, storage RLS enforces tenant prefix matches JWT.
- **Bucket:** Compliance
- **Severity:** N/A

---

## 2 · Drift findings

### F-M1-101 · 13-state readiness ramp is not modeled as a single canonical enum
- **Source violated:** Dossier §2.4 (13 canonical readiness states: Missing, Requested, Uploaded, Connected, Loaded, Parsed, Available, Usable Evidence, Low Confidence, Stale, Access Restricted, Not Applicable, Waived)
- **Evidence:** Code uses a *multi-column* approach. `source_artifacts` columns: `parse_status` (pending/parsing/parsed/failed/needs_review), `embedding_status`, `graph_status`, `classification_status`, `evidence_state` (unparsed/parsed_uncited/cited/challenged/superseded). [supabase/migrations/20260430220000_source_artifact_registry.sql:111-137](supabase/migrations/20260430220000_source_artifact_registry.sql:111).
- **Bucket:** Drift
- **Severity:** P1
- **Recommended treatment:** Verify that the multi-column approach can derive all 13 dossier states. Some states (Stale, Access Restricted, Not Applicable, Waived) may not have any column representation — those are likely application-level concerns. Document the derivation function (or build it) so the 13-state vocabulary is recoverable from the substrate.

### F-M1-102 · 10-state artifact lifecycle reduced to 6 in `approval_state`
- **Source violated:** Dossier §2.5 (10 artifact states: Not Started, Draft, Needs Inputs, In Review, Changes Requested, Approved, Locked, Issued, Superseded, Archived)
- **Evidence:** `source_artifacts.approval_state` allows: not_required, draft, in_review, approved, rejected, locked. Supersession lives in `evidence_state='superseded'`. [supabase/migrations/20260430220000_source_artifact_registry.sql:135-137](supabase/migrations/20260430220000_source_artifact_registry.sql:135).
- **Missing:** "Not Started", "Needs Inputs", "Changes Requested", "Issued", "Archived" have no direct equivalent. "rejected" is in code but not in dossier (closest dossier state is "Changes Requested").
- **Bucket:** Drift
- **Severity:** P2
- **Recommended treatment:** Decide whether the 10-state model is canonical or whether the simpler 6-state model is sufficient. If the 10-state is canonical, expand the enum. If 6-state is sufficient, update the dossier vocabulary.

### F-M1-103 · Artifact family taxonomy drifts from dossier 13-artifact catalog
- **Source violated:** Dossier §10 (13 canonical artifacts)
- **Evidence:** `artifact_family` allows 14 values (rfi, rfp, bafo, scorecard, pricing_workbook, proposal, meeting_notes, workshop_output, decision_brief, transition_risk_register, value_ledger, sourcing_strategy, scope_document, other). [supabase/migrations/20260502122500_source_value_ledger_artifact_family.sql:7-22](supabase/migrations/20260502122500_source_value_ledger_artifact_family.sql:7).
- **Missing from code (vs dossier):** Minimum Data Request, Vendor Q&A Tracker, Vendor Response Completeness Checklist, Pricing Template (separate from pricing_workbook?), BAFO Question Pack (separate from bafo?), Vendor Selection Memo, Transition Readiness Checklist, Value Ledger Assumptions.
- **In code, not dossier:** rfi (dossier has only RFP), workshop_output, transition_risk_register, value_ledger.
- **Bucket:** Drift
- **Severity:** P1
- **Recommended treatment:** Reconcile the artifact catalog. The dossier names artifacts by purpose ("BAFO Question Pack"); code names them by category ("bafo"). One artifact family in code may correspond to several dossier artifacts. Decide whether to subdivide families or accept that artifact_kind (granular) carries the canonical identity.

---

## 3 · Design observations

### F-M1-201 · Substrate is richer than dossier specifies — ready for design template's needs
- **Where:** `source_pricing_components`, `source_commercial_exceptions`, `source_vendor_commitments`, `source_requirements`, `source_meeting_outcomes`, `source_graph_edges`. [supabase/migrations/20260430220000_source_artifact_registry.sql:195-296](supabase/migrations/20260430220000_source_artifact_registry.sql:195).
- **Observation:** The substrate has dedicated tables for pricing components (TCO normalization), commercial exceptions (pricing trap log), vendor commitments (BAFO history), requirements, and graph edges. The Source dossier §8 listed 16 canonical fields; the actual substrate exposes far more granular structure. This is positive — it suggests the team built ahead of spec — but it also means the dossier's binding reference is incomplete.
- **Bucket:** Design observation (positive)
- **Recommended treatment:** Update the dossier §8 binding reference to reflect actual substrate richness. Pricing trap log and BAFO commitments deserve dedicated dossier sections.

### F-M1-202 · `source_events` lacks a category column
- **Where:** [supabase/migrations/20260430150000_source_events.sql:9-32](supabase/migrations/20260430150000_source_events.sql:9).
- **Observation:** `event_type` column allows `managed_service | software | staffing | infrastructure | consulting | other`. Design template B uses 4 categories: AMS, Cloud & Infrastructure, Data & Analytics, Enterprise Software — and tied agent co-leadership to category. Code's event_type doesn't match design's category enum (e.g., "Data & Analytics" has no event_type code value).
- **Bucket:** Design observation (drift)
- **Severity:** P1
- **Recommended treatment:** This is the substrate-level evidence for the agent-architecture question. If category drives agent leadership (per design), the substrate needs a clean category enum, not loose `event_type` strings. Reconciliation needed.

### F-M1-203 · No `lead_agent` column on events; agent assignment is implicit
- **Where:** `source_events` columns examined: id, client_key, event_code, event_name, event_type, current_stage_key, lifecycle_state, linked_program_id, estimated_value_usd, trigger_description, scope_description, decision_owner, created_by_user_id. No `lead_agent`, `primary_agent`, or `agent_assignments` column.
- **Observation:** Per dossier and design, every event/stage has a lead agent. The substrate doesn't store this — meaning the agent assignment is computed (e.g., from stage→agent mapping table in code) rather than persisted per event. This is a forward-compatibility risk for the agent-redesign exercise: if agents become per-category co-leads, you'd want to persist the assignment, not derive it.
- **Bucket:** Design observation
- **Severity:** P2 (risk)
- **Recommended treatment:** Decide if agent assignment belongs in the substrate. If category co-leadership is the future, persisting `(stage_key, agent_role)` tuples per event makes the system flexible to per-event agent overrides.

### F-M1-204 · `source_event_approvals` is action-level, not gate-level
- **Where:** [supabase/migrations/20260430151000_source_event_approvals.sql:5-15](supabase/migrations/20260430151000_source_event_approvals.sql:5). Records `action`, `from_state`, `to_state`, `notes`, `approved_by_user_id`.
- **Observation:** The dossier and design template emphasize *gate criteria* — multiple criteria per gate, each with its own sign-off. The substrate models approvals as action records (one row per stage advance), not gate-criterion records. The granular criteria status (e.g., "scope memo signed by EA council: pending") is not modeled.
- **Bucket:** Design observation
- **Severity:** P1
- **Recommended treatment:** Add a `source_gate_criteria` table or similar. Per-criterion state is needed to render the gate panels seen in design B T03/T04/T05/T08.

### F-M1-205 · Value ledger has only the family flag, no dedicated ledger table
- **Where:** [supabase/migrations/20260502122500_source_value_ledger_artifact_family.sql:1-22](supabase/migrations/20260502122500_source_value_ledger_artifact_family.sql:1) — adds `value_ledger` to artifact_family, no dedicated table.
- **Observation:** Design template T07 (Value Realization) and T11 (Source Value Ledger) need per-line state tracking: projected → committed → measuring → realized, with measurement owner and evidence per line. The substrate currently treats the entire ledger as an artifact (a document family), not as a structured set of value lines with state. Realized requires owner+evidence per dossier truth #7; without per-line state, that discipline is enforced only at application level.
- **Bucket:** Design observation
- **Severity:** P1
- **Recommended treatment:** Build a `source_value_lines` table with per-line state, owner, evidence link. The dossier's "v2 substrate pending" footnote in design B may be referring to exactly this gap.

---

## 4 · Open questions for reconciliation

1. **13-state readiness ramp persistence.** Is the multi-column approach intentional or a gap? Document or fix.
2. **Artifact catalog reconciliation.** Are dossier's 13 named artifacts a subset of code's 14 families, or are they orthogonal?
3. **Category enum.** Does `event_type` need rationalization to match design's 4 categories?
4. **Agent assignment persistence.** Should `lead_agent` and `co_lead_agent` columns exist on events? On stages?
5. **Gate criteria substrate.** Build `source_gate_criteria` to back the gate panels in design B?
6. **Value lines substrate.** Build `source_value_lines` to back T07/T11?

---

## 5 · What this mode did NOT cover

- **Live data queries.** The audit inspected schema only; no SELECT queries against actual tenant data. A follow-up pass should confirm that for Apex Retail, every required field per dossier §7 has populated rows.
- **Data-readiness state derivation.** Whether the multi-column approach in F-M1-101 actually distinguishes all 13 dossier states for live data was not verified.
- **Knowledge graph projection.** `source_graph_edges` exists but graph quality wasn't audited.
- **Embedding pipeline.** `embedding_status` field exists; whether the pipeline is running wasn't verified.

These belong to a deeper M1 follow-up requiring DB access.

---

End of M1 initial pass.
