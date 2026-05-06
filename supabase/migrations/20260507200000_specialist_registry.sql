-- F-SU-104 · Specialist registry substrate
--
-- Creates the DB-backed specialist_registry table for runtime routing.
-- The static catalog at docs/architecture/specialist-catalog.md is the
-- source of truth for specialist definitions; this table makes them
-- queryable at runtime for orchestration, trace display, and auditing.
--
-- Design decisions:
--   - flavor maps to the four product surfaces (sentinel/nexus/atlas/steward)
--   - owner_agent is the front-agent brand name that surfaces this specialist
--   - inputs/outputs are JSONB arrays (string labels for now; may evolve to
--     structured schemas as the contract layer matures)
--   - No tenant scoping: this is a global registry (same across all tenants)
--   - RLS: service_role bypass + authenticated read (no per-tenant filter)
--   - The 7 Source specialists seeded here match the sentinel-source-orchestrator
--     specialist list as of 2026-05-07

BEGIN;

CREATE TABLE IF NOT EXISTS specialist_registry (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id   TEXT        NOT NULL UNIQUE,   -- e.g. 'context-validation-checker'
  name            TEXT        NOT NULL,           -- HumanReadableName (function-named)
  flavor          TEXT        NOT NULL CHECK (flavor IN ('sentinel', 'nexus', 'atlas', 'steward')),
  purpose         TEXT        NOT NULL,           -- one-line purpose statement
  inputs          JSONB       NOT NULL DEFAULT '[]',   -- array of input type/label strings
  outputs         JSONB       NOT NULL DEFAULT '[]',   -- array of output type/label strings
  owner_agent     TEXT        NOT NULL,           -- front-agent that surfaces this specialist
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for runtime routing by flavor/owner — filtered to active only
CREATE INDEX IF NOT EXISTS idx_specialist_registry_flavor
  ON specialist_registry (flavor)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_specialist_registry_owner
  ON specialist_registry (owner_agent)
  WHERE active = true;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Global registry — no tenant scoping. Service role has full access.
-- Authenticated users can read all active specialists (needed for trace/admin UI).

ALTER TABLE specialist_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_specialist_registry" ON specialist_registry;
CREATE POLICY "service_role_all_specialist_registry" ON specialist_registry
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_specialist_registry" ON specialist_registry;
CREATE POLICY "authenticated_read_specialist_registry" ON specialist_registry
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON specialist_registry TO authenticated;

-- ── Seed: 7 known Source specialists from the sentinel-source-orchestrator ───
-- Derived from docs/architecture/specialist-catalog.md §3 as of 2026-05-07.
-- ON CONFLICT DO NOTHING: idempotent; re-applying is safe.

INSERT INTO specialist_registry
  (specialist_id, name, flavor, purpose, inputs, outputs, owner_agent)
VALUES
  (
    'context-validation-checker',
    'ContextValidationChecker',
    'sentinel',
    'Verify context bundle integrity; flag intentional defers that must remain visible.',
    '["context validation report"]',
    '["defer list with reasons + remediation pre-pass"]',
    'sentinel'
  ),
  (
    'evidence-gap-detector',
    'EvidenceGapDetector',
    'sentinel',
    'Identify missing citations, parsed-file gaps, and unsupported claims for the current event.',
    '["context bundle", "context validation report", "citation coverage map"]',
    '["ranked list of evidence gaps with remediation"]',
    'sentinel'
  ),
  (
    'next-action-recommender',
    'NextActionRecommender',
    'nexus',
    'Given current event state, name the operationally-next concrete action.',
    '["event context bundle", "current stage", "blockers list", "missing inputs list"]',
    '["one-line next action with handoff target"]',
    'sentinel'
  ),
  (
    'minimum-data-request-generator',
    'MinimumDataRequestGenerator',
    'nexus',
    'When inputs are missing, produce a structured data request to the right human owner.',
    '["missing inputs list", "event tenant context", "admin/setup readiness contract"]',
    '["data request artifact with named owner per request"]',
    'sentinel'
  ),
  (
    'value-at-stake-summarizer',
    'ValueAtStakeSummarizer',
    'atlas',
    'Summarize projected/committed/measuring/realized value with confidence framing for executives.',
    '["event value attribution", "realized value ledger"]',
    '["executive value summary with confidence bands"]',
    'sentinel'
  ),
  (
    'executive-decision-brief-writer',
    'ExecutiveDecisionBriefWriter',
    'atlas',
    'Compose 1-page decision brief with tradeoff card (value/risk/transition postures).',
    '["finalist comparison", "commercial risk register", "value summary"]',
    '["decision brief with named recommendation + caveats"]',
    'sentinel'
  ),
  (
    'workflow-blocker-detector',
    'WorkflowBlockerDetector',
    'steward',
    'Identify workflow-validation blockers and failed expectations across the event.',
    '["workflow validation report"]',
    '["prioritized blocker list with remediation per blocker"]',
    'sentinel'
  )
ON CONFLICT (specialist_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
