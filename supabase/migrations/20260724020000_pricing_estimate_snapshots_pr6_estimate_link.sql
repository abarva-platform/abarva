-- Nexus Pricing Engine — PR6: link pricing_estimate_snapshots back to the
-- specific pricing_estimates row (scenario variant) it was approved from.
--
-- ## Why this is needed now
--
-- The PR2 skeleton (20260723234500_pricing_rate_cards_client_profiles_v1.sql)
-- intentionally shaped `pricing_estimate_snapshots` with NO
-- `pricing_estimates` FK, because `pricing_estimates` did not exist yet at
-- PR2 time: "This table has no FK to a pricing_estimates row because none
-- exists yet ... so it can exist standalone until PR6 wires the real
-- estimate workflow into it" (that migration's header comment).
--
-- PR5 (20260724010000_pricing_estimates_moves_workflow_v1.sql) then created
-- `pricing_estimates` with EXPLICIT support for multiple scenario variants
-- per Move sharing one `move_id` (`scenario_group_id` — "traditional" vs.
-- "ai_accelerated" vs. "vendor_led" under the same costing exercise). That
-- means "the approved snapshot for this Move" is only well-defined if a
-- snapshot names WHICH estimate/scenario it approved — `move_id` alone
-- cannot disambiguate when a Move has more than one scenario draft. This is
-- the "wires the real estimate workflow into it" step the PR2 header
-- anticipated; it is a minimal, additive ALTER, not a redesign of the PR2
-- skeleton.
--
-- Nullable (a snapshot without a known estimate is still valid — see
-- `getApprovedSnapshotForMove`'s defensive handling in
-- `src/lib/pricing/effort-engine/snapshot-service.ts`) and a REAL FK, unlike
-- the soft `move_id`/`engagements.id` reference: `pricing_estimates` is in
-- the SAME `pricing_*` schema (no cross-schema coupling concern), matching
-- the existing convention already used for `rate_card_version_id REFERENCES
-- pricing_rate_cards (id)` on this same table.
--
-- No backfill needed: the skeleton table has zero rows before this PR (PR2–
-- PR5 never wrote to it — `snapshot-service.ts` threw `not_implemented_pr6`
-- until this PR).

BEGIN;

ALTER TABLE pricing_estimate_snapshots
  ADD COLUMN IF NOT EXISTS estimate_id UUID NULL REFERENCES pricing_estimates (id);

CREATE INDEX IF NOT EXISTS idx_pricing_estimate_snapshots_estimate
  ON pricing_estimate_snapshots (estimate_id, created_at DESC);

COMMIT;
