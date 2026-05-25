-- Clerk user ids are strings like `user_...`, not UUIDs.
-- The AI egress audit writer records the authenticated Clerk subject, so the
-- ledger must preserve that value instead of rejecting the audit insert.
ALTER TABLE public.ai_egress_audit
  ALTER COLUMN user_id TYPE TEXT
  USING user_id::TEXT;
