# Workspace Canvas Read Bindings — P2 Discover & Diagnose phase — W-4.2 (P2)

| | |
|---|---|
| **Work Package** | W-4.2 (P2) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p2.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p2.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p2.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P2 Discover & Diagnose is the only phase that can produce a **discontinue** recommendation. Canvas panels: current-state baseline, root cause analysis, data readiness assessment, decision panel (continue/discontinue), gate panel, artifact shelf, and discontinue banner.

**Gate structure (from `governance.ts` P2→P3 rule):** 5 hard checks, 0 soft checks: `discovery_report_signed_off`, `discovery_notes_ingested`, `discovery_baseline_attested`, `discovery_stakeholders_named`, `p2_readiness_cleared`.

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · Baseline Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-baseline-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('baseline', 'baseline_metrics', 'value_baseline')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest version) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After baseline content update; page load | Empty placeholder: `"Current state baseline documentation will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p2-baseline-panel-status` | Computed: `attested` when baseline deliverable `status = 'signed_off'`; `in-progress` when deliverable exists but not signed off; `not-started` when no deliverable | Server: derived from deliverable status | Computed | After `ws-canvas-p2-baseline-panel-attest-btn` action | `'not-started'` | Not editable — derived |
| `ws-canvas-p2-baseline-panel-attest-btn` (visibility) | Computed: visible when `viewMode = current` AND baseline deliverable exists | N/A | Computed | View mode change; after deliverable add | Hidden until deliverable exists | Admin, lead, governance |

---

## §3 · Root Cause Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-rootcause-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('root_cause_analysis', 'discovery_findings')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) OR `program_modules` WHERE `module_key = 'root_cause'` | Server: `deliverables_v2` | Stored | After root cause update; page load | Empty placeholder: `"Root cause analysis documentation will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p2-rootcause-item-{n}` | Individual root cause records stored in `program_modules.module_data` JSONB array OR `deliverables_v2` structured data | Server: same as panel content | Stored in JSONB | After add/edit root cause | Empty list | Admin, lead, governance |
| `ws-canvas-p2-rootcause-panel-status` | Computed from root cause deliverable presence | Server: derived | Computed | After root cause update | `'not-started'` | Not editable |

---

## §4 · Data Readiness Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-datareadiness-panel-content` | `program_modules` WHERE `module_key IN ('data_readiness', 'readiness_assessment')` AND `engagement_id = moveId` → `module_data` | Server: `program_modules` | Stored | After readiness update; page load | Empty placeholder: `"Data and readiness assessment will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p2-datareadiness-panel-status` | Computed from module completion | Server: derived | Computed | After module update | `'not-started'` | Not editable |
| `ws-canvas-p2-datareadiness-gap-{n}` | Individual gap records from `program_modules.module_data->'gaps'` JSONB array | Server: same as panel | Stored in JSONB | After gap add/edit | Empty list | Admin, lead |

---

## §5 · Decision Panel (Continue / Discontinue)

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-decision-panel` (visibility) | Computed: visible when `evaluateGate(ctx, moveId, 2, 3)` has been called (gateState not `not-evaluated`) | Server: `evaluateGate` result persisted or triggered | Computed | After gate evaluation runs | Hidden until gate evaluated (Layer 2 Row 8) | Not editable |
| `ws-canvas-p2-decision-continue-option` | `engagements.value_assumptions_jsonb->>'p2_decision'` (interim — gap-ws-4-010, B-125) — value `'continue'` | Server: `getProgramById` | Stored in JSONB (interim) | After decision confirmation | `'continue'` pre-selected when no hard gaps | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p2-decision-discontinue-option` | Same field — value `'discontinue'` | Server: same | Stored in JSONB | After Nexus recommendation or manual selection | Pre-selected when `discoveryReportHasHardGap = true` | Same |
| `ws-canvas-p2-decision-rationale` | `engagements.value_assumptions_jsonb->>'p2_decision_rationale'` (interim — gap-ws-4-010) | Server: `getProgramById` | Stored in JSONB | After rationale entry | Empty string | Admin, lead, governance; required when discontinuing |

---

## §6 · Gate Panel (P2→P3)

### §6.1 Gate criterion data sources

| element-id | gate criterion key | db-table-or-view | computed-or-stored | fallback |
|---|---|---|---|---|
| `ws-canvas-p2-gate-item-1` (Discovery report signed off — hard) | `discovery_report_signed_off` | `deliverables_v2` WHERE `deliverable_type_key IN ('discovery_report', 'discovery_synthesis', 'discovery_findings')` AND `status = 'signed_off'` | Computed from `evaluateGate(ctx, moveId, 2, 3)` | `not-evaluated` |
| `ws-canvas-p2-gate-item-2` (Discovery notes ingested — hard) | `discovery_notes_ingested` | `deliverables_v2` WHERE `deliverable_type_key IN ('discovery_notes', 'meeting_notes', 'workshop_notes')` EXISTS; OR `program_modules` WHERE `module_key IN ('discovery_notes_ingest', 'workshop_notes_ingest')` AND `status = 'completed'`; OR `program_evidence_items` WHERE `phase = 1` exists; OR discovery report content contains workshop evidence keywords | Computed from `evaluateGate` | `not-evaluated` |
| `ws-canvas-p2-gate-item-3` (Baseline attested — hard) | `discovery_baseline_attested` | `deliverables_v2` WHERE `deliverable_type_key IN ('baseline', 'baseline_metrics', 'value_baseline')` AND `status = 'signed_off'`; OR discovery report text contains baseline attestation keywords | Computed from `evaluateGate` | `not-evaluated` |
| `ws-canvas-p2-gate-item-4` (Stakeholders named — hard) | `discovery_stakeholders_named` | Discovery report `deliverable_versions.content` text contains `stakeholder` AND no named owner gaps AND no hard gaps detected | Computed from `evaluateGate` (text analysis on discovery report content) | `not-evaluated` |
| `ws-canvas-p2-gate-item-5` (P2 readiness cleared — hard) | `p2_readiness_cleared` | Discovery report content: non-empty AND no hard gaps AND no `conditional proceed` language | Computed from `evaluateGate` | `not-evaluated` |

### §6.2 Gate summary and promote button

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-gate-summary` | Computed from `evaluateGate(ctx, moveId, 2, 3)` result | Server: `evaluateGate` | Computed | After any P2 artifact change | `"0 of 5 met"` | Not editable |
| `ws-canvas-p2-gate-promote-btn` (enabled) | Computed: zero hard fails AND `p2_decision = 'continue'` AND `userRole` authorized AND `viewMode = 'current'` | Server: `evaluateGate` + decision field + `hasAuthority` | Computed | After gate evaluation; after decision selection | Disabled | Not editable |

---

## §7 · Artifact Shelf

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-artifact-{n}` | `move_artifact_index` VIEW: `SELECT * FROM move_artifact_index WHERE engagement_id = $moveId AND (phase_number = 2 OR artifact_kind IN ('discovery_report', 'discovery_synthesis', 'discovery_notes', 'workshop_notes', 'baseline', 'baseline_metrics'))` | Server: Supabase query on `move_artifact_index` | Stored | After artifact upload; after status change; page load | Empty state | Admin, lead, governance |
| `ws-canvas-p2-artifact-{n}-status` | `move_artifact_index.status` | Same | Stored | After status update | `'draft'` | Admin, lead |

---

## §8 · Discontinue Banner

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p2-discontinue-banner` (visibility) | Computed: `discoveryReportHasHardGap = true` (from `evaluateGate` text analysis of discovery report) OR `ws-canvas-p2-decision-discontinue-option` is selected | Server: `evaluateGate` side output | Computed | After discovery report content changes; after decision selection | Hidden | Not editable |
| `ws-canvas-p2-discontinue-banner-reason` | Extracted from discovery report text analysis — hard gap phrases that triggered `discoveryReportHasHardGap = true` | Server: `evaluateGate` reasoning | Computed (text analysis output) | After discovery report update | Generic: `"Hard gaps identified in discovery synthesis"` | Not editable — Nexus-derived |
| `ws-canvas-p2-discontinue-banner-evidence` | `program_evidence_items` WHERE `engagement_id = moveId` AND `phase = 2` AND tagged as hard-gap evidence | Server: `program_evidence_items` query | Stored | After evidence items change | Empty list | Not editable |

---

## §9 · Write Bindings (P2 mutations)

| interaction-id | what gets written | target | API route |
|---|---|---|---|
| Baseline panel save | Baseline deliverable content | `deliverables_v2` content via `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Baseline attest button | `deliverables_v2.status = 'signed_off'` for baseline deliverable | `deliverables_v2` | **gap-ws-4-001** (B-117) |
| Decision confirm (continue/discontinue) | `engagements.value_assumptions_jsonb->>'p2_decision'` | `engagements` (JSONB update) | **gap-ws-4-001** (B-117) |
| Promote P2→P3 | `engagements.current_phase = 3` + audit log | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` — see `04-data-writes-promote.md` |

---

## §10 · Self-QA

| Check | Status |
|---|---|
| All P2 panels mapped to DB sources | PASS |
| P2→P3 gate criteria (5 hard checks) mapped to governance.ts keys | PASS |
| Discontinue banner derivation documented | PASS |
| Decision panel interim JSONB storage documented with gap references | PASS |
| No "TBD" values | PASS |
