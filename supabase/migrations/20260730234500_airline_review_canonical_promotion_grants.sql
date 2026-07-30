-- Airline review execution writes accepted, hash-guarded decisions into the
-- canonical Knowledge layer before publication/baseline steps run.
-- Keep this grant scoped: no publication, consumption, metrics, Cube, delete,
-- ownership, or baseline activation authority is granted here.

DO $$
BEGIN
  IF to_regrole('airline_demo_new_reviewer') IS NULL THEN
    RAISE NOTICE 'airline_demo_new_reviewer role is not present; skipping Airline review canonical promotion grants.';
    RETURN;
  END IF;

  GRANT USAGE ON SCHEMA knowledge TO airline_demo_new_reviewer;

  GRANT SELECT, INSERT, UPDATE ON TABLE
    knowledge.entity,
    knowledge.fact_assertion,
    knowledge.relationship_type,
    knowledge.relationship_assertion
  TO airline_demo_new_reviewer;

  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA knowledge TO airline_demo_new_reviewer;
END $$;
