-- Additive bootstrap required for deterministic clean-database replay.
CREATE SCHEMA IF NOT EXISTS foundation_v2_meridian_health_cube_canary;

COMMENT ON SCHEMA foundation_v2_meridian_health_cube_canary IS
  'Private Layer 5 Meridian Health Cube canary schema.';
