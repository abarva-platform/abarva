-- Airline Demo New review-ledger apply grant.
--
-- This is intentionally narrower than publisher/baseline authority. It lets the
-- review managed identity write only the governed review ledger structures after
-- the policy-bound dry-run package has been reviewed and approved. It does not
-- grant publication, consumption, baseline activation, candidate mutation, or
-- schema creation rights.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mi-airdn-review-lab-001') THEN
    GRANT USAGE ON SCHEMA governance TO "mi-airdn-review-lab-001";

    GRANT SELECT, INSERT, UPDATE ON governance.review_policy TO "mi-airdn-review-lab-001";
    GRANT SELECT, INSERT, UPDATE ON governance.review_batch TO "mi-airdn-review-lab-001";
    GRANT SELECT, INSERT, UPDATE ON governance.review_batch_approval TO "mi-airdn-review-lab-001";
    GRANT SELECT, INSERT, UPDATE ON governance.review_decision TO "mi-airdn-review-lab-001";

    REVOKE DELETE ON governance.review_policy FROM "mi-airdn-review-lab-001";
    REVOKE DELETE ON governance.review_batch FROM "mi-airdn-review-lab-001";
    REVOKE DELETE ON governance.review_batch_approval FROM "mi-airdn-review-lab-001";
    REVOKE DELETE ON governance.review_decision FROM "mi-airdn-review-lab-001";

    -- Keep the review job unable to publish, activate, or mutate accepted domains.
    REVOKE ALL ON SCHEMA publication FROM "mi-airdn-review-lab-001";
    REVOKE ALL ON SCHEMA consumption FROM "mi-airdn-review-lab-001";
    REVOKE CREATE ON SCHEMA governance FROM "mi-airdn-review-lab-001";
  ELSE
    RAISE NOTICE 'Skipping Airline review-ledger apply grants: role mi-airdn-review-lab-001 does not exist in this database.';
  END IF;
END $$;

COMMIT;
