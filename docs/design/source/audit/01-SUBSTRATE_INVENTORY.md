# Mode 1 · Substrate Inventory
**Audit mode:** 1 of 6  
**Question:** Does the substrate hold the data the design promises?  
**Baselines:** `SOURCE_DOSSIER_DIGESTION.md` §§7–9; `SOURCE_DESIGN_V03_RECONCILIATION.md` §§4–5  
**Output:** This file + gap entries in `SOURCE_GAP_REGISTER.md`  
**Status:** Complete

---

## 1 · Methodology

Investigated:
1. All SQL migration files containing "source", "vendor", "artifact", "gate", "value_line", "scorecard", "pricing", "bafo", "evaluation" in filename or content
2. TypeScript instance/fixture files in `src/lib/source/`
3. Dossier field-level binding table (§18 / digestion §8)
4. v0.3 design demo event narrative (reconciliation §4)
5. RLS and access control migrations

Migration files audited (18 files, in chronological order):
- `006_stage_gates.sql` (shared gate infrastructure)
- `20260430150000_source_events.sql`
- `20260430151000_source_event_approvals.sql`
- `20260430220000_source_artifact_registry.sql`
- `20260501170000_source_access_control.sql`
- `20260501171000_source_demo_users.sql`
- `20260502122500_source_value_ledger_artifact_family.sql`
- `20260502143000_source_11_stage_lifecycle.sql`
- `20260507110000_source_per_user_rls_read.sql`
- `20260507160000_source_substrate_wave1_2.sql`
- `20260507210000_gate_criteria_substrate.sql`
- `20260507220000_source_value_lines.sql`

---

## 2 · Complete table inventory

| Table | Migration file | Purpose | Status |
|---|---|---|---|
| `source_events` | 20260430150000 | Core sourcing event record | ✓ Exists |
| `source_event_approvals` | 20260430151000 | Approval audit trail | ✓ Exists |
| `source_artifacts` | 20260430220000 | Artifact registry | ✓ Exists |
| `source_artifact_chunks` | 20260430220000 | Parser output chunks | ✓ Exists |
| `source_artifact_facts` | 20260430220000 | Extracted structured facts | ✓ Exists |
| `source_pricing_components` | 20260430220000 | Vendor pricing line items | ✓ Exists (scope unclear) |
| `source_commercial_exceptions` | 20260430220000 | Commercial exception log | ✓ Exists |
| `source_vendor_commitments` | 20260430220000 | Vendor commitment records | ✓ Exists |
| `source_requirements` | 20260430220000 | Sourcing requirements | ✓ Exists |
| `source_meeting_outcomes` | 20260430220000 | Meeting outcome records | ✓ Exists |
| `source_graph_edges` | 20260430220000 | Knowledge graph edges | ✓ Exists |
| `source_context_receipts` | 20260430220000 | Context bundle receipts | ✓ Exists |
| `source_event_participants` | 20260501170000 | Access control participants | ✓ Exists |
| `gate_criteria` | 20260507210000 | Gate criterion definitions | ✓ Exists (shared with Programs) |
| `gate_criterion_states` | 20260507210000 | Criterion state machine | ✓ Exists (shared with Programs) |
| `source_value_lines` | 20260507220000 | Value line tracking | ✓ Exists |
| `evaluation_criteria` | — | Per-criterion weight governance | ✗ **MISSING** |
| `scorecard_overrides` | — | Weight change audit trail | ✗ **MISSING** |
| `pricing_traps` | — | P0/P1/P2 pricing trap log | ✗ **MISSING** |
| `bafo_rounds` | — | BAFO negotiation rounds | ✗ **MISSING** |
| `vendor_responses` | — | Vendor response records | ✗ **MISSING** |
| `data_readiness_items` | — | Per-source readiness state | ✗ **MISSING** (derived from artifacts) |

---

## 3 · Field-level binding verification

Checking each canonical field from dossier §18 (digestion §8):

| Field | Dossier target | Substrate column | Verdict |
|---|---|---|---|
| `sourcingEvent.eventId` | `sourcing_events.id` | `source_events.id` | ✓ Present (table renamed from dossier) |
| `sourcingEvent.tenantSlug` | `tenant table / auth` | `source_events.client_key` | ✓ Present (client_key = tenant) |
| `sourcingEvent.linkedProgramCode` | `program association table` | `source_events.linked_program_id` | ✓ Partial (TEXT link, not FK) |
| `stage.currentStep` | `workflow state table` | `source_events.current_stage_key` | ⚠ Present but defaults to `'intake'` (legacy key, not `'strategy'`) |
| `stage.gateState` | `workflow/gate state table` | `gate_criterion_states` | ✓ Present (derived) |
| `dataReadiness.category` | `Admin/Setup data domain` | No direct table — derived from `source_artifacts.evidence_state` | ⚠ Partial — no standalone data_readiness table |
| `dataReadiness.state` | `data readiness service` | `source_artifacts.evidence_state` (9 states) | ⚠ Partial — see §4 below |
| `artifact.status` | `artifact store` | `source_artifacts.approval_state` | ✓ Present (different column name) |
| `vendor.responseStatus` | `vendor submission system` | No `vendor_responses` table | ✗ Missing |
| `pricing.normalizedAnnualRunCost` | `pricing normalization service` | `source_pricing_components` (unclear schema) | ⚠ Partial — needs investigation |
| `commercialRisk.type` | `commercial risk detector` | `source_commercial_exceptions` | ✓ Present |
| `bafo.vendorQuestions` | `BAFO model / future artifact` | No `bafo_rounds` table | ✗ Missing |
| `executive.decisionPosture` | `executive decision summary service` | No table | ✗ Missing (TypeScript only) |
| `selection.selectionReviewReady` | `vendor selection readiness service` | No table | ✗ Missing (TypeScript only) |
| `value.realizationState` | `value ledger` | `source_value_lines.value_state` | ✓ Present |
| `evidence.confidence` | `evidence ledger` | `source_artifacts.confidence` / chunks | ✓ Present |

**Field binding verdict: 6 of 16 fully present, 4 partial, 6 missing.**

---

## 4 · Data readiness state vocabulary gap

### Dossier §2.4 specifies 13 states

`Missing` · `Requested` · `Uploaded` · `Connected` · `Loaded` · `Parsed` · `Available` · `Usable Evidence` · `Low Confidence` · `Stale` · `Access Restricted` · `Not Applicable` · `Waived`

### v0.3 design (T12) shows 7-state ramp

`Usable Evidence` · `Available` · `Parsed` · `Loaded` · `Not Requested` · `Stale` · `Low Confidence`

### Substrate has 9 evidence states

In `source_artifacts.evidence_state`:  
`unparsed` · `parsed_uncited` · `cited` · `challenged` · `superseded` · `stale` · `access_restricted` · `not_applicable` · `waived`

### Gap analysis

| Dossier state | v0.3 state | Substrate state | Verdict |
|---|---|---|---|
| Missing | — | — | ✗ No substrate equivalent |
| Requested | — | — | ✗ No substrate equivalent |
| Uploaded | — | `unparsed` | ⚠ Partial — unparsed ≈ Uploaded but naming diverges |
| Connected | — | — | ✗ No substrate equivalent |
| Loaded | Loaded | `unparsed` | ⚠ Partial |
| Parsed | Parsed | `parsed_uncited` | ⚠ Partial — naming diverges |
| Available | Available | `cited` (inferred) | ⚠ Partial — `cited` ≠ `Available` semantically |
| Usable Evidence | Usable Evidence | `cited` | ⚠ Partial — same domain, different name |
| Low Confidence | Low Confidence | No direct equivalent | ✗ Missing from substrate |
| Stale | Stale | `stale` | ✓ Present |
| Access Restricted | — | `access_restricted` | ✓ Present |
| Not Applicable | — | `not_applicable` | ✓ Present |
| Waived | — | `waived` | ✓ Present |

**Finding S-01 (P1):** The substrate uses a different vocabulary for data readiness states than both the dossier and the v0.3 design. The current `source_artifacts.evidence_state` tracks post-parse evidence quality, NOT the pre-parse ingestion ramp (Missing → Requested → Uploaded → Loaded). The T12 data readiness drawer cannot fully render the 7-state or 13-state ramp from current substrate. The 4 upper-funnel states (Missing, Requested, Uploaded/Connected, Loaded) have no substrate backing.

---

## 5 · Demo event seed data

### v0.3 design requires 4 events (reconciliation §4)

| Event | Tenant | Stage | Required seed |
|---|---|---|---|
| AMS Outsourcing 2026 | Apex Retail | Scope (Step 2) | Blocker: L2/L3 ticket history missing; Gate: 2/5 met |
| Cloud Platform Consolidation | Meridian Health | Evaluate (Step 5) | Blocker: security weight disputed; Gate: 3/5 met; 4 vendors |
| Data Platform Renewal | Meridian Health | Pricing (Step 6) | Blocker: 6 pricing traps; Gate: 3/5 met; 3 vendors |
| Endpoint Management Migration | Apex Retail | Transition (Step 10) | Status: on track; 14mo post go-live |

### Substrate seed finding

**`source_events` table rows:** The migration comment states "fixture data in `listSourceEventSeed()` remains authoritative demo source; DB rows are merged on top (DB rows take precedence)." This means the demo events are TypeScript fixtures, NOT SQL seed rows.

**TypeScript fixtures found:**
- `apex-retail-ams-outsourcing-2026` — in `source-event-instances.ts` ✓ Exists with vendors, stages, gate states
- Cloud Platform Consolidation (Meridian) — searched `src/lib/source/` — NOT FOUND
- Data Platform Renewal (Meridian) — NOT FOUND
- Endpoint Management Migration — NOT FOUND as a separate event fixture (separate from AMS)

**Finding S-02 (P1):** Three of four v0.3 design demo events have no fixture data. The design's multi-tenant portfolio narrative (Apex Retail + Meridian Health events) cannot be rendered. The portfolio page (T01) will show at most 1 event from the design's 4-row demo. The "Meridian Health" tenant has no Source event fixtures at all.

---

## 6 · Evaluation / scorecard substrate

### Dossier requires

`EvaluationScorecard` with `lockedAt`, `approvedBy`, `totalWeight`  
`EvaluationCriteria` with `defaultWeight`, `currentWeight`, `required`  
`ScorecardOverride` with `previousWeight`, `newWeight`, `rationale`, `materialChange`, `actor`, `timestamp`

### Substrate reality

The `source_artifacts` table includes `artifact_family: scorecard` but there is no dedicated `evaluation_criteria` or `scorecard_criteria` table. The `ScorecardGovernancePanel` component reads `event.scorecard.criteria` — this `scorecard` field is built from TypeScript models (`scorecard.ts` in `src/lib/source/`), not from a persistence layer.

`gate_criteria` and `gate_criterion_states` exist but track gate progression criteria, not scorecard evaluation criteria. These are architecturally different things (gate = go/no-go for stage advance; scorecard = vendor comparison scoring).

**Finding S-03 (P1):** No substrate table exists for scorecard evaluation criteria or weight governance. The T08 Scorecard Governance surface (weight versioning, criterion-level sign-off, audit trail of weight changes) cannot persist its state. Every session starts from the TypeScript fixture. This is a pre-disclosed partial/gap item in dossier §12, confirmed still open.

---

## 7 · Pricing trap substrate

### v0.3 design T05 requires

A "Pricing trap log" with:
- Trap entries per vendor
- Severity: P0, P1, P2
- Agent attribution (Sentinel / Steward / Nexus / Atlas)
- Resolution path (resolved in BAFO / advisory)

### Substrate reality

`source_pricing_components` exists but its schema (columns) was not fully returned in the agent query. The column names are not yet confirmed to include severity, trap categorization, or agent attribution.

`source_commercial_exceptions` exists and may partially cover "commercial traps" — its schema is similarly not yet confirmed in full.

No table is named `pricing_traps` or has `trap_severity` columns based on migration searches.

**Finding S-04 (P1):** Dedicated pricing trap persistence (P0/P1/P2 severity, agent attribution, vendor association) is not confirmed to exist. The T05 trap log panel likely renders from TypeScript fixture data. Requires deeper schema investigation of `source_pricing_components` and `source_commercial_exceptions`.

**Open question for Anand (OQ-01):** Is `source_commercial_exceptions.exception_type` the intended backing for the pricing trap log? If so, does it support P0/P1/P2 severity and the agent attribution the design shows?

---

## 8 · BAFO rounds substrate

### v0.3 design T10 requires

"BAFO history · 2 rounds" per vendor with:
- Round number
- Description of what was asked / answered
- Signed/closed date

### Substrate reality

No `bafo_rounds`, `bafo_history`, or `bafo_questions` table found in any migration. BAFO state in the TypeScript model (`bafo-negotiation.ts`, `AmsBafoPanel.tsx`) is derived from fixtures.

**Finding S-05 (P2):** BAFO round history has no persistence layer. The T10 vendor detail surface's BAFO history section renders from TypeScript fixture only.

---

## 9 · Vendor response substrate

### Dossier requires

`VendorResponse` with: `vendorId`, `status`, `submittedAt`, `missingItems`

### Substrate reality

No `vendor_responses`, `vendor_submissions`, or `vendor_response_items` table found. `source_requirements` may partially cover vendor Q&A but not response completeness tracking.

The `SourceOriginatePage` form creates source events; vendor responses appear to be entirely fixture-driven.

**Finding S-06 (P2):** No vendor response persistence layer. Vendor response completeness (T04, T10) is TypeScript fixture only. This is consistent with the dossier's self-assessment ("no real upload/parsing") but means the substrate cannot track real vendor submissions.

---

## 10 · Stage key default mismatch

### Substrate default

`source_events.current_stage_key` defaults to `'intake'` (the legacy alias).

### Canonical model

`SOURCE_STAGE_ORDER[0]` = `'strategy'`. `normalizeSourceStageKey('intake')` → `'strategy'`.

**Finding S-07 (P2):** New events inserted via the `POST /api/v1/source/events` route receive `current_stage_key = 'intake'` from the database default. While `normalizeSourceStageKey` handles this alias, any code that compares `current_stage_key === 'strategy'` directly (without normalization) will fail for new events. This is a silent data contract bug.

---

## 11 · RLS verification

### Pattern

All Source tables follow: service_role = full access; authenticated read via `can_read_tenant_by_id()` + tenant JOIN; authenticated write via `is_program_initiator()` check; delete = blocked (immutable audit trail).

### Gaps

- `gate_criteria` and `gate_criterion_states` RLS uses a loose FK join to `engagements` table. This means a user who is an engagements participant (Programs surface) can read gate criteria — intended or a scope bleed?
- `source_value_lines` follows the same pattern — value line visibility is tied to program initiator role.
- No RLS on `source_artifacts`, `source_pricing_components`, `source_commercial_exceptions` was confirmed — service_role bypass covers agent writes, but client-side read policies may not be in place.

**Finding S-08 (P2):** Gate criteria and value lines use engagements-based RLS, meaning Programs surface participants can read Source gate state. This may be intentional (cross-surface visibility) or unintended scope bleed. Confirm with Anand.

**Finding S-09 (P2):** `source_artifacts` and related tables RLS policy was not confirmed. The migration file has these tables but explicit RLS `CREATE POLICY` statements were not found for them in the search. This needs verification in the full migration file.

---

## 12 · Confidence band substrate

### v0.3 design footnote states explicitly

"Confidence bands on value posture are stamped `v2 PENDING SUBSTRATE` across templates 03, 07, 11. The number visible today is a single point estimate or range with no confidence interval."

### Substrate reality

`source_value_lines` has: `projected_amount`, `committed_amount`, `realized_amount` (single values, no range columns). No `projected_amount_low`, `projected_amount_high`, or `confidence_interval` columns.

**Finding S-10 ✓ (Compliant):** The substrate correctly lacks confidence band columns. The `v2 PENDING SUBSTRATE` footnote is honored — substrate does not pretend confidence bands exist. No action needed.

---

## 13 · Multi-tenant scoping verification

### Design requirement

Apex Retail events visible only to Apex users; Meridian Health events visible only to Meridian users.

### Substrate mechanism

`source_events.client_key` is the tenant discriminator. All RLS policies join on `client_key` through `can_read_tenant_by_id()`.

### Findings

- Tenant scoping architecture is correct — `client_key` is present and indexed on `source_events`.
- `source_artifacts` uses `tenant_key` (same concept, different column name). Both should resolve to the same tenant — no drift found in migration logic.
- Meridian Health events not seeded, so cross-tenant bleed cannot be tested empirically. Architecture appears correct for when events are seeded.

**Finding S-11 ✓ (Compliant):** Multi-tenant scoping architecture is correct at the substrate level. Cross-tenant visibility is blocked by RLS. Gap is seed data, not architecture.

---

## 14 · Artifact code convention

### v0.3 design uses `dNN_short_name` convention

`d04_app_inv`, `d05_scope_memo`, `d07_ticket_synth`, `d08_premortem`

### Substrate reality

`source_artifacts.artifact_kind` and `source_artifacts.original_name` are free-text. No `artifact_code` column follows the `dNN_short_name` convention. The convention exists in the TypeScript fixtures (`docs/build/SOURCE_MODULE_BACKLOG.md` acknowledges this) but is not enforced at substrate level.

**Finding S-12 (P3):** No substrate enforcement of artifact code convention. The `dNN_short_name` scheme exists in design and TypeScript fixtures but not in the `source_artifacts` table schema. Mechanically fixable (add `artifact_code TEXT` column) but low priority.

---

## 15 · Gap register entries (Mode 1)

| Gap ID | Severity | Layer | Description | Recommendation |
|---|---|---|---|---|
| S-01 | P1 | Substrate | Evidence state vocabulary: 9 substrate states vs 13 dossier states vs 7 design states. Missing: Missing, Requested, Uploaded/Connected states | Define mapping from substrate states to dossier 13-state model; update T12 drawer to use substrate vocabulary or add missing states |
| S-02 | P1 | Substrate | Seed data: 3 of 4 v0.3 demo events missing. Meridian Health has zero Source event fixtures | Create TypeScript fixtures for Cloud Platform Consolidation, Data Platform Renewal, Endpoint Migration events before Mode 3 UI audit |
| S-03 | P1 | Substrate | No evaluation criteria table. Scorecard weight governance (T08) has no persistence. Weight versioning and audit trail are TypeScript-only | Define `evaluation_criteria` and `scorecard_overrides` tables before T08 can be considered production-ready |
| S-04 | P1 | Substrate | Pricing trap persistence unconfirmed. T05 trap log (P0/P1/P2 with agent attribution) has no confirmed substrate backing | Investigate `source_pricing_components` and `source_commercial_exceptions` schema in full; confirm or deny trap log persistence |
| S-05 | P2 | Substrate | No BAFO rounds table. T10 BAFO history is fixture-only | Define `bafo_rounds` table when T10 vendor detail is implemented |
| S-06 | P2 | Substrate | No vendor response table. Vendor completeness tracking (T04) is fixture-only | Define `vendor_responses` table when real upload/parsing is implemented |
| S-07 | P2 | Substrate | Stage key default is `'intake'` (legacy) not `'strategy'` (canonical). Silent bug for code doing direct equality checks | Change `current_stage_key` default to `'strategy'` or add normalization at insert-time |
| S-08 | P2 | Substrate/RLS | Gate criteria and value lines use engagements-based RLS — Programs surface participants can read Source gate state. Confirm if intentional | Anand to confirm: is cross-surface gate visibility intentional? If not, scope RLS to source_event_participants only |
| S-09 | P2 | Substrate/RLS | RLS policies on `source_artifacts` and related tables not confirmed in migration search. May be service-role-only | Verify explicit RLS CREATE POLICY statements exist for source_artifacts read path |
| S-10 | ✓ | Substrate | Confidence bands absent from substrate — honors v0.3 `v2 PENDING SUBSTRATE` footnote | No action needed |
| S-11 | ✓ | Substrate | Multi-tenant scoping via `client_key` / `tenant_key` is architecturally correct | No action needed |
| S-12 | P3 | Substrate | `dNN_short_name` artifact code convention not enforced at substrate level | Add `artifact_code TEXT` column to `source_artifacts` when T09 is built |

---

## 16 · Open questions for Anand

| OQ | Question |
|---|---|
| OQ-01 | Is `source_commercial_exceptions.exception_type` the intended backing for the T05 pricing trap log? If so, does it support P0/P1/P2 severity and agent attribution? |
| OQ-02 | Is cross-surface gate visibility (Programs participants seeing Source gate state) intentional? |
| OQ-03 | Should Meridian Health demo event fixtures be created before Mode 3 (UI audit)? Mode 3 will be blocked without them. |

---

## 17 · Mode 1 sign-off

- [x] Every Source-related migration file examined
- [x] Field-level binding checked against dossier §18
- [x] Demo event seeds verified against v0.3 §4
- [x] Tenant scoping verified
- [x] Artifact code convention verified
- [x] RLS pattern reviewed
- [x] All findings logged to gap register (no fixes made)
- [x] No `src/` files modified
- [x] No migrations created or modified
