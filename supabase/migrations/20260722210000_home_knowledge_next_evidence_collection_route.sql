-- Home Knowledge Pack v5 — collection route for next-evidence requests
--
-- The v3 table home_knowledge_next_evidence_requests (added by
-- 20260722020000) was created but never populated by the generator. The v5
-- generation change wires it from the source pack's NEXT_EVIDENCE + per-
-- dimension DGAPS data (which map 1:1), and adds a dimension-appropriate
-- collection_route so a zero-state gives the right route (capability ->
-- workshop, industry -> governed corpus, decision-rights -> delegation-of-
-- authority docs, process -> workflow data, benefits -> Tower metrics +
-- finance attestation) instead of a generic "upload a client export", per
-- the 2026-07-22 design review (#12). The route is a deterministic function
-- of the requesting dimension, not model-authored.
--
-- Additive: one nullable column on an existing table. No data change to any
-- other table.

BEGIN;

ALTER TABLE public.home_knowledge_next_evidence_requests
  ADD COLUMN IF NOT EXISTS collection_route TEXT;

COMMIT;
