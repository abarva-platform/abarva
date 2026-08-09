GRANT USAGE ON SCHEMA foundation_v2_meridian_health_cube_canary TO foundation_v2_meridian_health_demo_reader;
GRANT USAGE ON SCHEMA foundation_v2_meridian_health_cube_canary TO foundation_v2_meridian_health_demo_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA foundation_v2_meridian_health_cube_canary TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA foundation_v2_meridian_health_cube_canary TO foundation_v2_meridian_health_demo_writer;

ALTER DEFAULT PRIVILEGES IN SCHEMA foundation_v2_meridian_health_cube_canary
  GRANT SELECT ON TABLES TO foundation_v2_meridian_health_demo_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA foundation_v2_meridian_health_cube_canary
  GRANT SELECT ON TABLES TO foundation_v2_meridian_health_demo_writer;

COMMENT ON SCHEMA foundation_v2_meridian_health_cube_canary IS
  'Private Layer 5 Meridian Health Cube canary schema. Layer 6 reader/writer roles have read-only visibility for product-binding reconciliation.';
