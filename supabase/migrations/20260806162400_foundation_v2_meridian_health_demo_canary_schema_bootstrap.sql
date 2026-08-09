-- The Layer 5 canary typed tables are built by the private operator script,
-- not by ordinary shared migrations. Fresh migration replay still needs this
-- schema to exist before the Layer 6 read-grant migration runs.
CREATE SCHEMA IF NOT EXISTS foundation_v2_meridian_health_cube_canary;
