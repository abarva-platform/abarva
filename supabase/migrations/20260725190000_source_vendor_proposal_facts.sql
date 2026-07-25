-- Vendor proposal facts — the governed extraction-and-review pipeline for
-- structured facts pulled from uploaded vendor proposal documents (PR 3 of
-- ADR-0013-source-modernization-baseline.md: "governed vendor-proposal
-- ingestion foundation"). See
-- docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md's Evidence
-- Upload/Parsing/Storage section — the audit's headline finding was that
-- binary vendor proposals were parsed by the same generic text parser as
-- pasted markdown, with hardcoded confidence constants and no review gate.
--
-- Two append-only tables, same "ledger, not mutable row" pattern already used
-- by source_artifact_acceptances and source_event_facts:
--
--   source_vendor_proposal_facts        — one row per EXTRACTED candidate
--                                          fact. Never updated. A re-upload
--                                          or re-extraction that would
--                                          conflict with an already-accepted
--                                          fact creates a NEW row that names
--                                          the old fact via supersedes_fact_id
--                                          — it never overwrites the old row.
--   source_vendor_proposal_fact_reviews — one row per REVIEW DECISION
--                                          (accept/reject/supersede) against
--                                          a fact_id. Never updated. The
--                                          derived "current status" of a fact
--                                          is the latest review row for its
--                                          id, or 'candidate' if none exists
--                                          yet — same "latest wins, decorate
--                                          don't overwrite" idiom as
--                                          source_artifact_acceptances.
--
-- Splitting extraction from review (rather than one mutable status column on
-- one table) means accepting a new version of a fact can ATOMICALLY record
-- the old fact as superseded (a second insert into the reviews table) without
-- ever touching the old fact's row — full lineage is always still readable
-- by following supersedes_fact_id, and nothing is ever destructively
-- overwritten.
--
-- Tenant scoping is enforced at the application query layer (client_key
-- column + join to source_events.client_key), matching
-- source_artifact_acceptances and source_event_facts — not per-row RLS.
--
-- TS mirror: src/lib/source/vendor-proposals/types.ts (keep in lockstep).
-- Repository: src/lib/source/vendor-proposals/vendor-proposal-facts.ts.

CREATE TABLE IF NOT EXISTS source_vendor_proposal_facts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key              TEXT NOT NULL,
  source_event_id         UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  vendor_key              TEXT NOT NULL,
  -- The uploaded proposal document this fact was extracted from. Always a
  -- real source_artifacts row — never a synthetic/manual placeholder, even
  -- for extraction_method = 'manual_entry' (an analyst still cites the
  -- document they read the value from).
  proposal_artifact_id    UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  -- Open domain vocabulary (unit_price, sla_uptime_pct, payment_terms, ...),
  -- not a fixed CHECK enum — vendor proposals vary far more than the closed
  -- governance-state vocabularies elsewhere in this schema.
  fact_key                TEXT NOT NULL,
  section_key             TEXT NULL,
  page_or_location         TEXT NULL,
  value_numeric            NUMERIC NULL,
  value_text               TEXT NULL,
  unit                     TEXT NULL,
  currency                 TEXT NULL,
  effective_period_start   DATE NULL,
  effective_period_end     DATE NULL,
  -- Verbatim quoted text from the source document, plus a structured
  -- locator. Every governed fact must be traceable back to the words that
  -- produced it — no fact may exist with both null.
  source_quote             TEXT NULL,
  source_pointer           JSONB NULL,
  confidence               TEXT NOT NULL DEFAULT 'low'
                            CHECK (confidence IN ('low', 'med', 'high')),
  -- Confidence is derived from HOW a fact was captured (structure implies
  -- reliability), not a free-floating per-row literal — the audit flagged
  -- the legacy parser's five hardcoded confidence constants (0.72-0.9) as
  -- fake precision that was never actually computed from anything.
  extraction_method        TEXT NOT NULL
                            CHECK (extraction_method IN (
                              'parsed_text', 'parsed_xlsx_cell', 'parsed_pdf_table', 'manual_entry'
                            )),
  -- Lineage: when a new extraction supersedes an earlier fact (a revised
  -- proposal, a corrected re-upload), this points at the fact it replaces.
  -- The OLD fact's row is never touched — acceptance of THIS fact is what
  -- writes a 'superseded' row against the old fact_id in the reviews ledger
  -- (see repository: acceptVendorProposalFact).
  supersedes_fact_id       UUID NULL REFERENCES source_vendor_proposal_facts(id),
  created_by               TEXT NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_vendor_proposal_facts_single_value_chk
    CHECK (value_numeric IS NULL OR value_text IS NULL),
  CONSTRAINT source_vendor_proposal_facts_lineage_chk
    CHECK (source_quote IS NOT NULL OR source_pointer IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS source_vendor_proposal_facts_event_vendor_idx
  ON source_vendor_proposal_facts (source_event_id, vendor_key, created_at DESC);
CREATE INDEX IF NOT EXISTS source_vendor_proposal_facts_proposal_idx
  ON source_vendor_proposal_facts (proposal_artifact_id);
CREATE INDEX IF NOT EXISTS source_vendor_proposal_facts_supersedes_idx
  ON source_vendor_proposal_facts (supersedes_fact_id) WHERE supersedes_fact_id IS NOT NULL;

ALTER TABLE source_vendor_proposal_facts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON source_vendor_proposal_facts;
CREATE POLICY "service_role_full_access" ON source_vendor_proposal_facts
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS source_vendor_proposal_fact_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id           UUID NOT NULL REFERENCES source_vendor_proposal_facts(id) ON DELETE CASCADE,
  review_status     TEXT NOT NULL CHECK (review_status IN ('accepted', 'rejected', 'superseded')),
  rationale         TEXT NOT NULL,
  reviewed_by       TEXT NOT NULL,
  reviewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latest-review-for-fact lookup (the hot path for deriving current status).
CREATE INDEX IF NOT EXISTS source_vendor_proposal_fact_reviews_fact_idx
  ON source_vendor_proposal_fact_reviews (fact_id, reviewed_at DESC);

ALTER TABLE source_vendor_proposal_fact_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON source_vendor_proposal_fact_reviews;
CREATE POLICY "service_role_full_access" ON source_vendor_proposal_fact_reviews
  USING (true) WITH CHECK (true);
