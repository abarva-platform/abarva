-- Meridian tool→program alias seed.
--
-- Links the canonical tool keys the tower_* projection emits to the funded
-- programs declared in Meridian's V3 09_programs_initiatives.csv, so real tool
-- telemetry rolls up to the bet it is evidence for instead of orphaning. The
-- canonical_program_key values are the deterministic programKeyFromCode()
-- slugs (program::<lowercased program_code>) the V3 facts projection produces,
-- so the crosswalk keys match on both sides.
--
-- Idempotent (ON CONFLICT DO NOTHING). Synthetic demo tenant config; the same
-- rows would be curated per real client, never auto-inferred from display name.

INSERT INTO cio_tower.tool_identity_aliases
  (alias_key, tenant_key, canonical_tool_key, alias, vendor_name, system_name, program_code, canonical_program_key, source, active)
VALUES
  -- Developer productivity / SDLC automation: coding-assistant telemetry
  -- (tower_ai_tool_usage tool enum: github_copilot | claude_code | cursor).
  ('meridian-health::tool::github-copilot::github-copilot', 'meridian-health', 'tool::github-copilot', 'GitHub Copilot', 'GitHub', 'GitHub Copilot', 'PROG-DEV-PRODUCTIVITY', 'program::prog-dev-productivity', 'curated', true),
  ('meridian-health::tool::github-copilot::copilot-enterprise', 'meridian-health', 'tool::github-copilot', 'GitHub Copilot Enterprise', 'GitHub', 'GitHub Copilot', 'PROG-DEV-PRODUCTIVITY', 'program::prog-dev-productivity', 'curated', true),
  ('meridian-health::tool::github-copilot::codex', 'meridian-health', 'tool::github-copilot', 'GitHub Copilot & Codex', 'GitHub', 'GitHub Copilot', 'PROG-DEV-PRODUCTIVITY', 'program::prog-dev-productivity', 'curated', true),
  ('meridian-health::tool::claude-code::claude-code', 'meridian-health', 'tool::claude-code', 'Claude Code', 'Anthropic', 'Claude Code', 'PROG-DEV-PRODUCTIVITY', 'program::prog-dev-productivity', 'curated', true),
  ('meridian-health::tool::cursor::cursor', 'meridian-health', 'tool::cursor', 'Cursor', 'Anysphere', 'Cursor', 'PROG-DEV-PRODUCTIVITY', 'program::prog-dev-productivity', 'curated', true),

  -- Forward-ready mappings for AI programs whose telemetry source is not yet
  -- ingested (M365 Copilot usage, ServiceNow/Workday agent outcomes). Rows are
  -- harmless until matching telemetry lands: the crosswalk simply resolves
  -- nothing for a canonical_tool_key that has no facts yet. Seeded now so the
  -- identity spine is ready the moment those extracts are added.
  ('meridian-health::tool::m365-copilot::m365-copilot', 'meridian-health', 'tool::m365-copilot', 'Microsoft 365 Copilot', 'Microsoft', 'M365 Copilot', 'PROG-COPILOT-ADOPT', 'program::prog-copilot-adopt', 'abarva_proposed', true),
  ('meridian-health::tool::servicenow-ai::servicenow-ai', 'meridian-health', 'tool::servicenow-ai', 'ServiceNow AI', 'ServiceNow', 'ServiceNow AI', 'PROG-SNOW-AI', 'program::prog-snow-ai', 'abarva_proposed', true),
  ('meridian-health::tool::workday-ai::workday-ai', 'meridian-health', 'tool::workday-ai', 'Workday AI', 'Workday', 'Workday AI', 'PROG-WORKDAY-AI', 'program::prog-workday-ai', 'abarva_proposed', true)
ON CONFLICT (tenant_key, canonical_tool_key, alias) DO NOTHING;
