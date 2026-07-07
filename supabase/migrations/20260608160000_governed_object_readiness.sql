-- Context & Corpus Governance (PR-3) — governed-object readiness sidecar.
--
-- ADDITIVE ONLY. Creates one new normalized table that carries the governance
-- readiness state for every governed object across all stores, keyed by
-- (object_table, object_id, client_key). Source tables are NOT touched: no
-- column adds, no data rewrites, no drops. This is the safest possible first DB
-- slice — a new ledger that later slices (PR-4 validators, PR-5 runtime bundle)
-- read and update as evidence arrives.
--
-- The columns mirror the canonical contract in
-- src/lib/governance/context-corpus-policy.ts (GovernedObject) so the runtime
-- gate and this row describe the same object the same way.
--
-- REVERSE / DOWN (documented; no destructive auto-run):
--   DROP TABLE IF EXISTS public.governed_object_readiness;
-- The table is append/upsert-only governance metadata; dropping it removes the
-- ledger and nothing else. No source data is affected by forward or reverse.

BEGIN;

CREATE TABLE IF NOT EXISTS public.governed_object_readiness (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity of the governed object this row describes.
  object_table              text NOT NULL,           -- source store, e.g. enterprise_context_chunks
  object_id                 text NOT NULL,           -- source row id (text-normalized)
  client_key                text NOT NULL,           -- canonical cover key or 'corpus_global'
  tenant_id                 text,                     -- clientId for tenant objects; null for corpus_global
  source_layer              text NOT NULL,           -- SOURCE_LAYERS enum value

  -- Governance state (mirrors the policy contract enums).
  agent_readiness_status    text NOT NULL DEFAULT 'not_reviewed',  -- AGENT_READINESS
  retrievability            text NOT NULL DEFAULT 'committed_not_indexed', -- RETRIEVABILITY
  classification            text NOT NULL DEFAULT 'internal',      -- CLASSIFICATIONS

  -- Grounding / evidence.
  source_basis              text,
  confidence_level          text,                     -- CONFIDENCE_LEVELS
  confidence_rationale      text,
  applicable_agents         text[] NOT NULL DEFAULT '{}',
  cited_render_verified_at  timestamptz,              -- the #3322 gate: never set by backfill

  -- Policy validation bookkeeping.
  policy_version            text NOT NULL DEFAULT '1.0.0',
  policy_validation_status  text NOT NULL DEFAULT 'pending', -- pending | pass | warn | block
  policy_validation_errors  jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_validated_at       timestamptz,

  -- Append-only provenance lineage (source_file, ingestion_run_id, indexed_at, …).
  provenance                jsonb NOT NULL DEFAULT '{}'::jsonb,

  owner                     text,
  backfill_reason           text,                     -- why the backfill assigned this state
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- One governance row per (store, object, scope). Idempotent backfill upserts on this.
CREATE UNIQUE INDEX IF NOT EXISTS uq_governed_object_readiness_identity
  ON public.governed_object_readiness (object_table, object_id, client_key);

-- Coverage / gating lookups used by validators (PR-4) and the runtime bundle (PR-5).
CREATE INDEX IF NOT EXISTS idx_governed_object_readiness_scope
  ON public.governed_object_readiness (client_key);
CREATE INDEX IF NOT EXISTS idx_governed_object_readiness_status
  ON public.governed_object_readiness (agent_readiness_status);
CREATE INDEX IF NOT EXISTS idx_governed_object_readiness_layer
  ON public.governed_object_readiness (source_layer);

COMMENT ON TABLE public.governed_object_readiness IS
  'Context & Corpus Governance readiness ledger (PR-3). One row per governed object across all stores. Additive sidecar — source tables untouched. Mirrors src/lib/governance/context-corpus-policy.ts.';

COMMIT;
