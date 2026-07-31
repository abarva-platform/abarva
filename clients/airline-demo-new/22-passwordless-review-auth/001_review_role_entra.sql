-- Passwordless (Microsoft Entra) database principal for the Airline Demo New
-- review job — least privilege for DRY-RUN review-package generation.
--
-- Runs against the airline lab DB (abarva_airline_demo_new_knowledge_lab on
-- pg-abarva-airdn-lab-eus2-001), applied by the server's Entra ADMIN principal
-- (NOT the PostgreSQL administrator password). Prerequisite (see README): Entra
-- auth must be ENABLED on the flexible server and an Entra admin set — it is
-- currently Disabled, so this migration cannot apply until the IaC step runs.
--
-- Governance intent:
--   * mi-airdn-review-lab-001 authenticates via an Entra token (passwordless);
--   * it maps to this approved database principal;
--   * SELECT ONLY on the candidate + evidence structures the dry-run reads;
--   * NO INSERT/UPDATE/DELETE, and NO access to publication.* or baseline
--     activation — the review identity cannot publish or activate during dry-run.

BEGIN;

-- 1. Create the Entra-mapped role for the review managed identity. On Azure
--    PostgreSQL Flexible Server, an Entra principal is created with the
--    pgaadauth extension. The role name is the managed identity's name; its
--    object id binds it to the identity. (No password is ever set.)
--    mi-airdn-review-lab-001 objectId = 1c570a7e-8fc1-4cf5-9bf4-2bef30023334
SELECT * FROM pgaadauth_create_principal_with_oid(
  'mi-airdn-review-lab-001',
  '1c570a7e-8fc1-4cf5-9bf4-2bef30023334',
  'service',   -- managed identity (service principal), not a user
  false,       -- isAdmin: NOT an admin
  false        -- isMfa
);

-- 2. Least-privilege grants: SELECT only, on the working candidate + evidence
--    read structures the dry-run package generation touches. Nothing else.
GRANT USAGE ON SCHEMA working TO "mi-airdn-review-lab-001";
GRANT USAGE ON SCHEMA evidence TO "mi-airdn-review-lab-001";
GRANT USAGE ON SCHEMA source_registry TO "mi-airdn-review-lab-001";
GRANT USAGE ON SCHEMA governance TO "mi-airdn-review-lab-001";

GRANT SELECT ON working.entity_candidate TO "mi-airdn-review-lab-001";
GRANT SELECT ON working.fact_candidate TO "mi-airdn-review-lab-001";
GRANT SELECT ON working.relationship_candidate TO "mi-airdn-review-lab-001";
GRANT SELECT ON working.quarantine_item TO "mi-airdn-review-lab-001";
GRANT SELECT ON evidence.evidence_item TO "mi-airdn-review-lab-001";
GRANT SELECT ON source_registry.source_version TO "mi-airdn-review-lab-001";
GRANT SELECT ON source_registry.source TO "mi-airdn-review-lab-001";
-- Read-only view of prior review decisions (to report existing state); no write.
GRANT SELECT ON governance.review_decision TO "mi-airdn-review-lab-001";

-- 3. Explicitly ensure NO publication / baseline / write capability. These are
--    defensive REVOKEs; the role was never granted them, but we state intent.
REVOKE ALL ON SCHEMA publication FROM "mi-airdn-review-lab-001";
REVOKE ALL ON SCHEMA consumption FROM "mi-airdn-review-lab-001";
-- The role may not create objects anywhere.
REVOKE CREATE ON SCHEMA working, evidence, governance, source_registry FROM "mi-airdn-review-lab-001";

COMMIT;

-- APPLY (dry-run of the migration itself) is verified by:
--   \dp working.*_candidate   -- should show only SELECT for mi-airdn-review-lab-001
-- A separate governed migration grants INSERT on governance.review_decision only
-- when the human-approved APPLY step runs (never during dry-run).
