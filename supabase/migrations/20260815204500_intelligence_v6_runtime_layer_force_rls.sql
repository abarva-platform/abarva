-- Force tenant RLS on the Intelligence V6 runtime layer refresh substrate.
--
-- The governed refresh job writes through an operator connection, but runtime
-- readback proof must exercise tenant-scoped policies through an authenticated
-- role. FORCE ROW LEVEL SECURITY keeps table ownership from bypassing the
-- tenant policy path.

ALTER TABLE intelligence_v6.layer_refresh_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.business_records FORCE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.relationship_edges FORCE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_nodes FORCE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_edges FORCE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_quality_reports FORCE ROW LEVEL SECURITY;
