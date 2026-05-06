-- Source substrate · Wave 1+2 hardening
-- F-M2-103: renamed SOURCE_NEXUS_API_STUB_VERSION constant (code-only, no schema)
-- F-M1-103: add 4 missing artifact families (minimum_data_request, vendor_qa,
--           response_checklist, selection_memo)
-- F-M1-101: add stale/access_restricted/not_applicable/waived to evidence_state
-- F-M1-203: add lead_agent column to source_events
-- F-M2-104: mark legacy stage_keys as deprecated in constraint comment

-- ── Artifact family CHECK — add 4 dossier-canonical families ─────────────────

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_family_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_family_check
  CHECK (artifact_family IN (
    'rfi',
    'rfp',
    'bafo',
    'scorecard',
    'pricing_workbook',
    'proposal',
    'meeting_notes',
    'workshop_output',
    'decision_brief',
    'transition_risk_register',
    'value_ledger',
    'sourcing_strategy',
    'scope_document',
    -- dossier-canonical families added in Wave 1 (F-M1-103)
    'minimum_data_request',
    'vendor_qa',
    'response_checklist',
    'selection_memo',
    'other'
  ));

-- ── Evidence state CHECK — add missing dossier readiness states ───────────────
-- F-M1-101: 13-state readiness ramp. The multi-column approach
-- (parse_status + embedding_status + evidence_state) is the canonical model;
-- evidence_state carries the human-readable readiness label. Adding:
--   stale           — artifact exists but content is outdated
--   access_restricted — artifact registered but content not accessible
--   not_applicable  — artifact type exempt from this sourcing stage
--   waived          — requirement explicitly waived with approval record

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_evidence_state_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_evidence_state_check
  CHECK (evidence_state IN (
    'unparsed',
    'parsed_uncited',
    'cited',
    'challenged',
    'superseded',
    -- dossier-canonical states added in Wave 2 (F-M1-101)
    'stale',
    'access_restricted',
    'not_applicable',
    'waived'
  ));

-- ── lead_agent column on source_events (F-M1-203) ────────────────────────────
-- Records which front agent was explicitly assigned as lead for this event.
-- NULL = not yet explicitly assigned (resolved by surface default).

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS lead_agent TEXT
    CHECK (lead_agent IN ('sentinel', 'nexus', 'atlas', 'steward'));

-- ── Stage key comment (F-M2-104) ─────────────────────────────────────────────
-- The 11-stage canonical set is: strategy, scope, rfp, responses, evaluation,
-- pricing, bafo, executive_decision, selection, transition, value.
-- Legacy keys (intake, sourcing_strategy, rfp_rfi_package, vendor_responses,
-- orals_bafo, contract_mobilization, value_realization) are retained for
-- backward compat with artifacts uploaded before the 11-stage normalization
-- (see 20260502143000_source_11_stage_lifecycle.sql). No new uploads should
-- use legacy keys; they are preserved for query continuity only.
-- Future migration (Phase 6) will backfill legacy keys to canonical equivalents.

COMMENT ON COLUMN source_artifacts.stage_key IS
  'Canonical 11-stage sourcing lifecycle key. Legacy keys are deprecated — '
  'see 20260502143000_source_11_stage_lifecycle.sql.';

COMMENT ON COLUMN source_events.lead_agent IS
  'Explicit front-agent assignment for this sourcing event. '
  'NULL inherits the surface default (Sentinel for /source).';
