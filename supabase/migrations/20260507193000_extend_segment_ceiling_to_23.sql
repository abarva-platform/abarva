-- INT-V1-0a · Extend segment-family ceiling from 1–14 to 1–23.
--
-- The original setup-data-layer migration (20260430121500) capped the
-- segment family at 14 and shipped 14 LIST partitions on
-- data_inventory_records. Per
-- docs/build/intelligence/INTELLIGENCE_V1_IMPLEMENTATION_PROMPT_2026-05-07.md
-- §0.1 — and the substrate readiness check on 2026-05-07 — the
-- Intelligence v3 surface needs segments 15–23 (KPI History,
-- Stakeholder Notes, Peer Benchmarks, Financial Model, Decision Traces,
-- Scenario Library, Vendor Intelligence, Graph Relationships, AI
-- Transformation Intelligence) to land their own substrate. With the
-- ceiling at 14 the canonical substrate physically cannot hold them;
-- agents fall back to the loose intelligence_layer_core tables which
-- aren't segment-keyed.
--
-- This migration is additive and reversible:
--   - drops the legacy 1..14 CHECK and re-adds it as 1..23
--   - creates 9 new LIST partitions (one per new segment)
--   - enables RLS on each partition to match the existing pattern
--     (service_role policies inherit from the data_inventory_records
--     parent definition; no new partition-scoped policies are required)
-- Existing rows, indexes, and policies on the parent table are
-- untouched. No data is moved.

BEGIN;

ALTER TABLE data_inventory_segments
  DROP CONSTRAINT IF EXISTS data_inventory_segments_family_number_check;

ALTER TABLE data_inventory_segments
  ADD CONSTRAINT data_inventory_segments_family_number_check
  CHECK (family_number BETWEEN 1 AND 23);

-- ---------------------------------------------------------------------
-- New LIST partitions for segments 15–23.
-- segment_id slugs follow the existing snake_case convention used for
-- segments 1–14. The slugs themselves are the canonical identifiers
-- used by the application tier when querying records.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS data_segment_kpi_history
  PARTITION OF data_inventory_records FOR VALUES IN ('kpi_history');

CREATE TABLE IF NOT EXISTS data_segment_stakeholder_notes
  PARTITION OF data_inventory_records FOR VALUES IN ('stakeholder_notes');

CREATE TABLE IF NOT EXISTS data_segment_peer_benchmarks
  PARTITION OF data_inventory_records FOR VALUES IN ('peer_benchmarks');

CREATE TABLE IF NOT EXISTS data_segment_financial_model
  PARTITION OF data_inventory_records FOR VALUES IN ('financial_model');

CREATE TABLE IF NOT EXISTS data_segment_decision_traces
  PARTITION OF data_inventory_records FOR VALUES IN ('decision_traces');

CREATE TABLE IF NOT EXISTS data_segment_scenario_library
  PARTITION OF data_inventory_records FOR VALUES IN ('scenario_library');

CREATE TABLE IF NOT EXISTS data_segment_vendor_intelligence
  PARTITION OF data_inventory_records FOR VALUES IN ('vendor_intelligence');

CREATE TABLE IF NOT EXISTS data_segment_graph_relationships
  PARTITION OF data_inventory_records FOR VALUES IN ('graph_relationships');

CREATE TABLE IF NOT EXISTS data_segment_ai_transformation
  PARTITION OF data_inventory_records FOR VALUES IN ('ai_transformation');

-- ---------------------------------------------------------------------
-- RLS — match existing pattern (one ENABLE per partition; the
-- service_role policy on the parent applies; tenant isolation policies
-- live on the parent table and cascade).
-- ---------------------------------------------------------------------

ALTER TABLE data_segment_kpi_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_stakeholder_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_peer_benchmarks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_financial_model      ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_decision_traces      ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_scenario_library     ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_vendor_intelligence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_graph_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_ai_transformation    ENABLE ROW LEVEL SECURITY;

COMMIT;
