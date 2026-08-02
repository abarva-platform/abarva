-- Foundation V3 baseline activation gate.
--
-- Additive gate only. Existing historical rows are not rewritten here; the
-- current synthetic active baseline remains visible to readback as a warning
-- until a post-promotion rebuild replaces it.

BEGIN;

CREATE TABLE IF NOT EXISTS publication.projection_absence_assertion (
  tenant_key TEXT NOT NULL,
  absence_ref TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  projection_version_ref TEXT,
  projection_name TEXT NOT NULL,
  absence_reason_code TEXT NOT NULL,
  absence_reason_detail TEXT NOT NULL,
  assertion_basis TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  review_ref TEXT,
  asserted_by TEXT NOT NULL,
  asserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, absence_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref)
    REFERENCES publication.knowledge_baseline (tenant_key, knowledge_baseline_ref),
  FOREIGN KEY (tenant_key, projection_version_ref)
    REFERENCES publication.projection_version (tenant_key, projection_version_ref),
  FOREIGN KEY (tenant_key, review_ref)
    REFERENCES governance.review_decision (tenant_key, review_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (absence_ref <> ''),
  CHECK (projection_name <> ''),
  CHECK (absence_reason_code IN (
    'source_not_received',
    'not_applicable',
    'restricted',
    'template_change_pending',
    'projection_not_supported',
    'rebuild_pending'
  )),
  CHECK (nullif(trim(absence_reason_detail), '') IS NOT NULL),
  CHECK (assertion_basis IN (
    'declared_intake',
    'review_decision',
    'governance_exception',
    'template_contract',
    'operator_readback'
  )),
  CHECK (asserted_by <> '')
);

CREATE INDEX IF NOT EXISTS projection_absence_assertion_active_idx
  ON publication.projection_absence_assertion (
    tenant_key,
    knowledge_baseline_ref,
    projection_name,
    projection_version_ref
  )
  WHERE retired_at IS NULL;

ALTER TABLE publication.projection_absence_assertion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projection_absence_assertion_tenant_policy
  ON publication.projection_absence_assertion;

CREATE POLICY projection_absence_assertion_tenant_policy
  ON publication.projection_absence_assertion
  FOR ALL
  USING (governance.can_access_tenant(tenant_key))
  WITH CHECK (governance.can_access_tenant(tenant_key));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_baseline_passed_requires_projection_validation_chk'
  ) THEN
    ALTER TABLE publication.knowledge_baseline
      ADD CONSTRAINT knowledge_baseline_passed_requires_projection_validation_chk
      CHECK (
        baseline_state <> 'passed'
        OR nullif(trim(coalesce(projection_validation_hash, '')), '') IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION publication.validate_knowledge_baseline_activation_gate(
  p_tenant_key TEXT,
  p_knowledge_baseline_ref TEXT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  baseline_row publication.knowledge_baseline%ROWTYPE;
  zero_projection_count BIGINT;
  missing_absence_count BIGINT;
  missing_projection_names TEXT[];
BEGIN
  IF p_tenant_key IS NULL OR p_tenant_key = '' OR p_tenant_key = 'all' OR p_tenant_key LIKE '%*%' THEN
    RAISE EXCEPTION 'Wildcard tenant execution is not allowed';
  END IF;

  SELECT *
    INTO baseline_row
  FROM publication.knowledge_baseline
  WHERE tenant_key = p_tenant_key
    AND knowledge_baseline_ref = p_knowledge_baseline_ref;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Knowledge Baseline % was not found', p_knowledge_baseline_ref;
  END IF;

  IF baseline_row.baseline_state <> 'passed' THEN
    RAISE EXCEPTION 'Knowledge Baseline % is not eligible for activation', p_knowledge_baseline_ref;
  END IF;

  IF nullif(trim(coalesce(baseline_row.projection_validation_hash, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Knowledge Baseline % has no projection validation hash', p_knowledge_baseline_ref;
  END IF;

  SELECT count(DISTINCT pv.projection_version_ref)::bigint,
         coalesce(array_agg(pv.projection_name ORDER BY pv.projection_name) FILTER (WHERE paa.absence_ref IS NULL), ARRAY[]::text[])
    INTO zero_projection_count, missing_projection_names
  FROM publication.projection_version pv
  LEFT JOIN publication.projection_absence_assertion paa
    ON paa.tenant_key = pv.tenant_key
   AND paa.knowledge_baseline_ref = pv.knowledge_baseline_ref
   AND paa.projection_name = pv.projection_name
   AND (paa.projection_version_ref IS NULL OR paa.projection_version_ref = pv.projection_version_ref)
   AND paa.retired_at IS NULL
  WHERE pv.tenant_key = p_tenant_key
    AND pv.knowledge_baseline_ref = p_knowledge_baseline_ref
    AND pv.is_active
    AND pv.row_count = 0;

  missing_absence_count := coalesce(array_length(missing_projection_names, 1), 0);

  IF missing_absence_count > 0 THEN
    RAISE EXCEPTION 'Knowledge Baseline % has zero-row projections without absence assertions: %',
      p_knowledge_baseline_ref,
      array_to_string(missing_projection_names, ', ');
  END IF;

  RETURN jsonb_build_object(
    'tenantKey', p_tenant_key,
    'knowledgeBaselineRef', p_knowledge_baseline_ref,
    'zeroRowActiveProjectionCount', coalesce(zero_projection_count, 0),
    'missingProjectionAbsenceAssertionCount', missing_absence_count,
    'status', 'passed'
  );
END;
$$;

CREATE OR REPLACE FUNCTION publication.activate_knowledge_baseline(
  p_tenant_key TEXT,
  p_knowledge_baseline_ref TEXT,
  p_activation_ref TEXT,
  p_run_ref TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  previous_ref TEXT;
BEGIN
  PERFORM publication.validate_knowledge_baseline_activation_gate(
    p_tenant_key,
    p_knowledge_baseline_ref
  );

  SELECT knowledge_baseline_ref
    INTO previous_ref
  FROM publication.knowledge_baseline
  WHERE tenant_key = p_tenant_key
    AND is_active = true
  FOR UPDATE;

  UPDATE publication.knowledge_baseline
  SET is_active = false
  WHERE tenant_key = p_tenant_key
    AND is_active = true;

  UPDATE publication.knowledge_baseline
  SET is_active = true,
      baseline_state = 'passed',
      activated_run_ref = p_run_ref,
      activated_at = now()
  WHERE tenant_key = p_tenant_key
    AND knowledge_baseline_ref = p_knowledge_baseline_ref;

  INSERT INTO publication.publication_activation (
    tenant_key,
    activation_ref,
    knowledge_baseline_ref,
    previous_knowledge_baseline_ref,
    activation_state,
    activated_run_ref,
    activated_at
  )
  VALUES (
    p_tenant_key,
    p_activation_ref,
    p_knowledge_baseline_ref,
    previous_ref,
    'passed',
    p_run_ref,
    now()
  );
END;
$$;

COMMIT;
