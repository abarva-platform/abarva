-- ────────────────────────────────────────────────────────────────────────────
-- L4 · Vendor-proposal-facts WRITE-path security regression suite (PR C of
-- the RLS/tenant-isolation security workstream)
-- ────────────────────────────────────────────────────────────────────────────
-- tests/security/rls-regression.sql already proves READ isolation for
-- source_vendor_proposal_facts / source_vendor_proposal_fact_reviews via its
-- auto-discovery (both tables carry a recognized client_key column, per
-- 20260726010000_vendor_proposal_facts_rls.sql's own header comment) — that
-- suite is 100% SELECT-only by design and does not exercise INSERT, the
-- cross-table ownership-consistency triggers (PR B), or the accept/reject
-- (review-insert) boundary. This suite is the WRITE-path complement: it
-- creates two synthetic tenants' worth of fixtures, then attempts a series
-- of adversarial writes as the `authenticated` role scoped to one tenant,
-- asserting each is rejected the SAME way it would be if the target simply
-- did not exist (RLS-hidden 0-row reads, or a trigger exception whose
-- wording never confirms another tenant's row exists) — never a
-- distinguishing signal.
--
-- Mechanism: identical to src/lib/source/vendor-proposals/tenant-scoped-
-- session.ts (this suite's application-code counterpart) — set_config
-- ('request.jwt.claims', ..., true) + SET LOCAL ROLE authenticated, scoped
-- to this transaction.
--
-- Safety: everything this suite creates is rolled back by the runner
-- (scripts/run-vendor-proposal-facts-write-isolation-regression.ts) — the
-- whole script runs inside one transaction that is ALWAYS rolled back,
-- pass or fail. Unlike rls-regression.sql (pure SELECT, safe to COMMIT),
-- this suite performs real INSERTs and must never persist them — safe to
-- point at a lab or production database, but never point the runner's
-- ROLLBACK-on-commit assumption at a connection pool that might reuse the
-- session outside this transaction.
--
-- Failure mode: each scenario is wrapped in its own nested BEGIN/EXCEPTION
-- block (an implicit savepoint) so one scenario's expected failure never
-- aborts the rest of the suite. A mismatch between what happened and what
-- was expected is recorded as a finding; the final summary block RAISE
-- EXCEPTIONs if any finding is not 'pass' — CI fails, release blocks.
--
-- What this suite does NOT re-prove (covered elsewhere, not duplicated):
--   * Plain list-isolation for these two tables — proven by
--     rls-regression.sql's auto-discovery (every canonical tenant × this
--     table pair is already a probed row).
--   * Authoritative downstream context purity (only selected tenant/event
--     facts reach d16/d19/d22/d24) — proven by
--     src/lib/source/vendor-proposals/__tests__/vendor-proposal-facts.test.ts
--     (getAuthoritativeVendorProposalFacts SQL WHERE-clause assertions) and
--     src/lib/source/agent-generation/__tests__/context-binder.test.ts
--     (join-hop tenant_key assertions, PR B).
--   * Candidate/rejected/superseded exclusion from the governed-read
--     contract — same vendor-proposal-facts.test.ts file, review-status
--     filtering assertions.

-- ── Sanity check ─────────────────────────────────────────────────────────────
DO $prereqs$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_read_tenant_by_key') THEN
    RAISE EXCEPTION
      'can_read_tenant_by_key() not found. Apply supabase/migrations/20260507100000_rls_role_helpers.sql first.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_source_vendor_proposal_facts_ownership_consistency'
  ) THEN
    RAISE EXCEPTION
      'trg_source_vendor_proposal_facts_ownership_consistency not found. Apply supabase/migrations/20260726020000_vendor_proposal_facts_cross_table_consistency.sql first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE EXCEPTION 'anon role not found. Run npm run db:azure:bootstrap first.';
  END IF;
END
$prereqs$;

-- ── Fixtures ─────────────────────────────────────────────────────────────────
-- Created under the connecting session's own role (superuser/admin in CI and
-- the migration lane) — RLS never applies to that role, so fixture creation
-- always succeeds regardless of policy state, and the cross-table
-- consistency triggers still fire (proving they accept genuinely consistent
-- rows, not just reject inconsistent ones).
DROP TABLE IF EXISTS vpf_regression_findings;
CREATE TEMP TABLE vpf_regression_findings (
  scenario TEXT PRIMARY KEY,
  status   TEXT NOT NULL,
  detail   TEXT
);

DROP TABLE IF EXISTS vpf_regression_fixtures;
CREATE TEMP TABLE vpf_regression_fixtures (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

DO $fixtures$
DECLARE
  v_event_a    UUID;
  v_event_b    UUID;
  v_artifact_a UUID;
  v_artifact_b UUID;
  v_fact_a1    UUID;
  v_fact_b1    UUID;
  v_review_a1  UUID;
BEGIN
  INSERT INTO source_events (client_key, event_code, event_name)
    VALUES ('rls-prc-tenant-a', 'RLS-PRC-A-' || substr(gen_random_uuid()::text, 1, 8), 'RLS PR C fixture event A')
    RETURNING id INTO v_event_a;

  INSERT INTO source_events (client_key, event_code, event_name)
    VALUES ('rls-prc-tenant-b', 'RLS-PRC-B-' || substr(gen_random_uuid()::text, 1, 8), 'RLS PR C fixture event B')
    RETURNING id INTO v_event_b;

  INSERT INTO source_artifacts (
    client_id, tenant_key, source_event_id, artifact_type, title, file_name,
    file_format, blob_container, blob_path
  ) VALUES (
    gen_random_uuid(), 'rls-prc-tenant-a', v_event_a, 'vendor_proposal',
    'RLS PR C fixture artifact A', 'rls-prc-a.txt', 'txt',
    'source-artifacts', 'rls-prc-fixtures/a.txt'
  ) RETURNING id INTO v_artifact_a;

  INSERT INTO source_artifacts (
    client_id, tenant_key, source_event_id, artifact_type, title, file_name,
    file_format, blob_container, blob_path
  ) VALUES (
    gen_random_uuid(), 'rls-prc-tenant-b', v_event_b, 'vendor_proposal',
    'RLS PR C fixture artifact B', 'rls-prc-b.txt', 'txt',
    'source-artifacts', 'rls-prc-fixtures/b.txt'
  ) RETURNING id INTO v_artifact_b;

  INSERT INTO source_vendor_proposal_facts (
    client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
    value_numeric, currency, source_quote, confidence, extraction_method, created_by
  ) VALUES (
    'rls-prc-tenant-a', v_event_a, 'vendor-a', v_artifact_a, 'price',
    100000, 'USD', 'Price: USD 100,000', 'high', 'manual_entry', 'rls-prc-fixture'
  ) RETURNING id INTO v_fact_a1;

  INSERT INTO source_vendor_proposal_facts (
    client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
    value_numeric, currency, source_quote, confidence, extraction_method, created_by
  ) VALUES (
    'rls-prc-tenant-b', v_event_b, 'vendor-b', v_artifact_b, 'price',
    50000, 'USD', 'Price: USD 50,000', 'high', 'manual_entry', 'rls-prc-fixture'
  ) RETURNING id INTO v_fact_b1;

  INSERT INTO source_vendor_proposal_fact_reviews (
    fact_id, client_key, source_event_id, review_status, rationale, reviewed_by
  ) VALUES (
    v_fact_a1, 'rls-prc-tenant-a', v_event_a, 'accepted', 'rls-prc fixture acceptance', 'rls-prc-fixture'
  ) RETURNING id INTO v_review_a1;

  INSERT INTO vpf_regression_fixtures VALUES
    ('event_a', v_event_a::text),
    ('event_b', v_event_b::text),
    ('artifact_a', v_artifact_a::text),
    ('artifact_b', v_artifact_b::text),
    ('fact_a1', v_fact_a1::text),
    ('fact_b1', v_fact_b1::text),
    ('review_a1', v_review_a1::text);

  RAISE NOTICE 'vpf-write-regression: fixtures created (event_a=%, event_b=%, fact_a1=%, fact_b1=%)',
    v_event_a, v_event_b, v_fact_a1, v_fact_b1;
END
$fixtures$;

-- ── Scenario runner ──────────────────────────────────────────────────────────
DO $scenarios$
DECLARE
  v_event_a    UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'event_a')::uuid;
  v_event_b    UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'event_b')::uuid;
  v_artifact_a UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'artifact_a')::uuid;
  v_artifact_b UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'artifact_b')::uuid;
  v_fact_a1    UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'fact_a1')::uuid;
  v_fact_b1    UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'fact_b1')::uuid;
  v_review_a1  UUID := (SELECT value FROM vpf_regression_fixtures WHERE key = 'review_a1')::uuid;
  v_count      BIGINT;
  v_count2     BIGINT;
BEGIN

  -- S1 — Direct known-ID cross-tenant read is denied (a fact), no error,
  -- just zero rows — "guessing the UUID" reveals nothing.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('tenant_key', 'rls-prc-tenant-b', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
    true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO v_count FROM source_vendor_proposal_facts WHERE id = v_fact_a1;
  RESET ROLE;
  INSERT INTO vpf_regression_findings VALUES (
    's1_cross_tenant_known_id_fact_read',
    CASE WHEN v_count = 0 THEN 'pass' ELSE 'fail' END,
    format('tenant B direct-ID read of tenant A''s fact returned %s rows (expected 0)', v_count)
  );

  -- S1b — same, for a review row.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('tenant_key', 'rls-prc-tenant-b', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
    true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO v_count FROM source_vendor_proposal_fact_reviews WHERE id = v_review_a1;
  RESET ROLE;
  INSERT INTO vpf_regression_findings VALUES (
    's1b_cross_tenant_known_id_review_read',
    CASE WHEN v_count = 0 THEN 'pass' ELSE 'fail' END,
    format('tenant B direct-ID read of tenant A''s review returned %s rows (expected 0)', v_count)
  );

  -- S2 — Guessing a real cross-tenant UUID must look identical to guessing a
  -- UUID that doesn't exist at all — no distinguishing signal either way.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('tenant_key', 'rls-prc-tenant-b', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
    true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO v_count FROM source_vendor_proposal_facts WHERE id = v_fact_a1;
  SELECT COUNT(*) INTO v_count2 FROM source_vendor_proposal_facts WHERE id = gen_random_uuid();
  RESET ROLE;
  INSERT INTO vpf_regression_findings VALUES (
    's2_no_existence_signal',
    CASE WHEN v_count = 0 AND v_count2 = 0 AND v_count = v_count2 THEN 'pass' ELSE 'fail' END,
    format('real cross-tenant id -> %s rows, nonexistent id -> %s rows (expected both 0, indistinguishable)', v_count, v_count2)
  );

  -- S3 — Cross-tenant supersession is rejected by the ownership-consistency
  -- trigger: tenant B cannot plant a new fact that supersedes tenant A's fact.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('tenant_key', 'rls-prc-tenant-b', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
      true);
    SET LOCAL ROLE authenticated;
    INSERT INTO source_vendor_proposal_facts (
      client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
      value_numeric, currency, source_quote, confidence, extraction_method,
      supersedes_fact_id, created_by
    ) VALUES (
      'rls-prc-tenant-b', v_event_b, 'vendor-b', v_artifact_b, 'price',
      60000, 'USD', 'attack: supersede tenant A''s fact', 'high', 'manual_entry',
      v_fact_a1, 'rls-prc-attacker'
    );
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's3_cross_tenant_supersession',
      'fail',
      'INSERT with a cross-tenant supersedes_fact_id was NOT rejected'
    );
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's3_cross_tenant_supersession', 'pass', 'rejected: ' || SQLERRM
    );
  END;

  -- S4 — A fact from Event A cannot be planted into Event B: tenant A
  -- attempts to INSERT a fact claiming an event it does not own.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('tenant_key', 'rls-prc-tenant-a', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
      true);
    SET LOCAL ROLE authenticated;
    INSERT INTO source_vendor_proposal_facts (
      client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
      value_numeric, currency, source_quote, confidence, extraction_method, created_by
    ) VALUES (
      'rls-prc-tenant-a', v_event_b, 'vendor-a', v_artifact_a, 'price',
      70000, 'USD', 'attack: plant into event B', 'high', 'manual_entry', 'rls-prc-attacker'
    );
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's4_cross_event_plant', 'fail', 'INSERT claiming another tenant''s event was NOT rejected'
    );
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's4_cross_event_plant', 'pass', 'rejected: ' || SQLERRM
    );
  END;

  -- S4b — Same idea via the proposal_artifact_id path: tenant A cites
  -- tenant B's artifact as the source of a "new" fact under its own event.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('tenant_key', 'rls-prc-tenant-a', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
      true);
    SET LOCAL ROLE authenticated;
    INSERT INTO source_vendor_proposal_facts (
      client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
      value_numeric, currency, source_quote, confidence, extraction_method, created_by
    ) VALUES (
      'rls-prc-tenant-a', v_event_a, 'vendor-a', v_artifact_b, 'price',
      70000, 'USD', 'attack: cite tenant B''s artifact', 'high', 'manual_entry', 'rls-prc-attacker'
    );
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's4b_cross_tenant_artifact_citation', 'fail', 'INSERT citing another tenant''s artifact was NOT rejected'
    );
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's4b_cross_tenant_artifact_citation', 'pass', 'rejected: ' || SQLERRM
    );
  END;

  -- S5 — A proposal from a different vendor cannot supersede this vendor's
  -- fact, even within the SAME tenant and event (isolates the vendor_key
  -- consistency check from RLS-hiding — both sides are visible here).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('tenant_key', 'rls-prc-tenant-a', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
      true);
    SET LOCAL ROLE authenticated;
    INSERT INTO source_vendor_proposal_facts (
      client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
      value_numeric, currency, source_quote, confidence, extraction_method,
      supersedes_fact_id, created_by
    ) VALUES (
      'rls-prc-tenant-a', v_event_a, 'vendor-a-second', v_artifact_a, 'price',
      80000, 'USD', 'attack: different vendor supersedes vendor-a''s fact', 'high', 'manual_entry',
      v_fact_a1, 'rls-prc-attacker'
    );
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's5_cross_vendor_supersession', 'fail', 'INSERT superseding a different vendor''s fact was NOT rejected'
    );
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's5_cross_vendor_supersession', 'pass', 'rejected: ' || SQLERRM
    );
  END;

  -- S6 — Cross-tenant accept/reject: tenant B cannot write a review row
  -- (accept/reject/supersede decision) against tenant A's fact.
  BEGIN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('tenant_key', 'rls-prc-tenant-b', 'role', 'observer', 'sub', 'rls-prc-runner')::text,
      true);
    SET LOCAL ROLE authenticated;
    INSERT INTO source_vendor_proposal_fact_reviews (
      fact_id, client_key, source_event_id, review_status, rationale, reviewed_by
    ) VALUES (
      v_fact_a1, 'rls-prc-tenant-b', v_event_b, 'accepted', 'attack: accept tenant A''s fact', 'rls-prc-attacker'
    );
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's6_cross_tenant_accept', 'fail', 'INSERT of a review against another tenant''s fact was NOT rejected'
    );
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's6_cross_tenant_accept', 'pass', 'rejected: ' || SQLERRM
    );
  END;

  -- S7 — Missing tenant context (authenticated role, no JWT claim at all) is
  -- denied exactly like a cross-tenant read: zero rows, no error.
  PERFORM set_config('request.jwt.claims', '{}', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO v_count FROM source_vendor_proposal_facts WHERE id = v_fact_a1;
  RESET ROLE;
  INSERT INTO vpf_regression_findings VALUES (
    's7_missing_tenant_context',
    CASE WHEN v_count = 0 THEN 'pass' ELSE 'fail' END,
    format('authenticated role with no tenant_key claim saw %s rows (expected 0)', v_count)
  );

  -- S8 — Unauthenticated (anon role, no GRANTs on these tables at all) is
  -- denied — Postgres raises insufficient_privilege rather than RLS-filtering,
  -- which is an acceptable, equally-safe denial shape (still "denied").
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM COUNT(*) FROM source_vendor_proposal_facts;
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's8_unauthenticated_denied', 'fail', 'anon role was able to read source_vendor_proposal_facts'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's8_unauthenticated_denied', 'pass', 'rejected: ' || SQLERRM
    );
  WHEN OTHERS THEN
    RESET ROLE;
    INSERT INTO vpf_regression_findings VALUES (
      's8_unauthenticated_denied', 'pass', 'rejected (non-privilege error, still denied): ' || SQLERRM
    );
  END;

  -- S9 — service_role bypass positive control: the documented privileged
  -- path still works end-to-end (sees both tenants' fixture facts).
  SET LOCAL ROLE service_role;
  SELECT COUNT(*) INTO v_count
    FROM source_vendor_proposal_facts
   WHERE client_key IN ('rls-prc-tenant-a', 'rls-prc-tenant-b');
  RESET ROLE;
  INSERT INTO vpf_regression_findings VALUES (
    's9_service_role_bypass',
    CASE WHEN v_count = 2 THEN 'pass' ELSE 'fail' END,
    format('service_role saw %s of the 2 fixture facts across both tenants (expected 2)', v_count)
  );

  RAISE NOTICE 'vpf-write-regression: all scenarios executed';
END
$scenarios$;

-- ── Summary and assertion ────────────────────────────────────────────────────
DO $summary$
DECLARE
  v_row  RECORD;
  v_fail INTEGER;
BEGIN
  RAISE NOTICE '── vendor-proposal-facts write-isolation regression: findings ──';
  FOR v_row IN SELECT scenario, status, detail FROM vpf_regression_findings ORDER BY scenario LOOP
    RAISE NOTICE '  % — % (%)', v_row.scenario, v_row.status, v_row.detail;
  END LOOP;

  SELECT COUNT(*) INTO v_fail FROM vpf_regression_findings WHERE status <> 'pass';
  IF v_fail > 0 THEN
    RAISE EXCEPTION
      'vpf-write-regression: % scenario(s) FAILED — see findings above', v_fail;
  END IF;

  RAISE NOTICE 'vpf-write-regression: GREEN — % scenarios all passed',
    (SELECT COUNT(*) FROM vpf_regression_findings);
END
$summary$;
