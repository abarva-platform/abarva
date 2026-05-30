// S4 — Cursor usage + cost ingest
// Registry entry. Single source of truth for "what S4 lands and where".
// Importing this module appends the entry; safe to import multiple times.

import { registerTowerIngest, type TowerIngestEntry } from '../registry';

export const CURSOR_INGEST_ENTRY: TowerIngestEntry = registerTowerIngest({
  key: 'cursor_team_usage_monthly',
  label: 'Cursor — team usage + cost (monthly)',
  category: 'ai_coding_tool_usage',
  source_system: 'Cursor',
  extract_path:
    'Cursor Admin Dashboard → Settings → Teams → Usage → Export CSV ; ' +
    'Cursor Billing Portal → Invoices → Per-team cost',
  cadence: 'monthly',
  status: 'pilot',
  target_tables: ['tower_ai_tool_usage'],
  tool_discriminator: 'cursor',
  templates: [
    'public/templates/tower/cursor/template.xlsx',
    'public/templates/tower/cursor/sample-filled.xlsx',
  ],
  dimensions: ['adoption', 'cost'],
  owner_slice: 'S4',
});
