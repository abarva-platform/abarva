-- Home Knowledge V4 lifecycle actions: reject, retire, rollback
--
-- The only mutating action that existed before this migration was
-- "approve" (see 20260725160000_home_knowledge_v4_quality_governance.sql),
-- whose side effect retires whatever pack was previously live. That leaves
-- three real admin needs unaddressed:
--
-- 1. Reject a candidate outright (never approve it, record why) without
--    waiting for a newer candidate to silently supersede it in review-queue
--    listings.
-- 2. Retire the currently-active pack for a tenant WITHOUT promoting a
--    replacement -- e.g. to fall a tenant back to the V2 renderer on
--    purpose, not as a side effect of approving something else.
-- 3. Roll a tenant back to a specific earlier pack (already-retired or
--    already-rejected) -- reactivate it as the approved/live row.
--
-- `status` gains 'rejected' alongside the existing 'draft' | 'candidate' |
-- 'approved' | 'retired'. A rejected row was reviewed and explicitly
-- declined -- it never went live. A retired row DID go live and was
-- superseded or pulled. This distinction matters for audit: "we looked at
-- this and said no" reads differently from "this was live and we took it
-- down."

BEGIN;

ALTER TABLE public.home_knowledge_packs
  DROP CONSTRAINT IF EXISTS home_knowledge_packs_status_check;

ALTER TABLE public.home_knowledge_packs
  ADD CONSTRAINT home_knowledge_packs_status_check
  CHECK (status IN ('draft', 'candidate', 'approved', 'retired', 'rejected'));

ALTER TABLE public.home_knowledge_packs
  ADD COLUMN IF NOT EXISTS rejected_by TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reject_reason TEXT,
  ADD COLUMN IF NOT EXISTS retired_by TEXT,
  ADD COLUMN IF NOT EXISTS retire_reason TEXT,
  ADD COLUMN IF NOT EXISTS rollback_of_pack_id UUID REFERENCES public.home_knowledge_packs(id);

COMMENT ON COLUMN public.home_knowledge_packs.reject_reason IS
  'Required whenever a candidate is rejected outright (never approved). Distinct from override_reason, which explains approving a flagged candidate anyway.';
COMMENT ON COLUMN public.home_knowledge_packs.retire_reason IS
  'Required whenever the currently-active pack is retired without a replacement being approved in the same action (a standalone retire, not approve''s implicit retire-of-prior).';
COMMENT ON COLUMN public.home_knowledge_packs.rollback_of_pack_id IS
  'Set on a row that was reactivated via rollback (status flipped back to approved from retired/rejected) rather than approved as a fresh candidate. Value is the id of the pack it displaced -- the row that was active immediately before this rollback. NULL for every row approved the ordinary way.';

COMMIT;
