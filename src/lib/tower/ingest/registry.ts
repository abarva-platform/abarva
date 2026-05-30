// Tower · ingest source registry.
//
// One entry per AI-coding-assistant feed. Entries are append-only — sister
// slices (S2 Copilot, S4 Cursor) add their entries; merges should union by
// `tool` discriminator. Do not edit or remove another slice's entry without
// coordination.
//
// Consumed by: setup catalog UI (route at /tower/onboard), CLI lister,
// onboarding wizard. Map back to the shared `tower_ai_tool_usage` table.

export type TowerIngestTool = 'claude_code' | 'copilot' | 'cursor';

export interface TowerIngestEntry {
  tool: TowerIngestTool;
  displayName: string;
  vendor: string;
  description: string;
  table: 'tower_ai_tool_usage';
  templatePath: string;
  sampleFilledPath: string;
  readmePath: string;
  cliScript: string;
  ownerSlice: 'S2' | 'S3' | 'S4';
}

export const CLAUDE_CODE_INGEST: TowerIngestEntry = {
  tool: 'claude_code',
  displayName: 'Claude Code (Anthropic)',
  vendor: 'Anthropic',
  description:
    'Per-developer Claude Code usage and cost from the Anthropic Console (org admin).',
  table: 'tower_ai_tool_usage',
  templatePath: '/templates/tower/claude-code/template.xlsx',
  sampleFilledPath: '/templates/tower/claude-code/sample-filled.xlsx',
  readmePath: 'docs/templates/tower/claude-code/README.md',
  cliScript: 'src/scripts/tower/ingest-claude-code.ts',
  ownerSlice: 'S3',
};

export const TOWER_INGEST_REGISTRY: TowerIngestEntry[] = [
  CLAUDE_CODE_INGEST,
  // S2 Copilot — append CopilotIngestEntry here.
  // S4 Cursor  — append CursorIngestEntry here.
];

export function getTowerIngestEntry(tool: TowerIngestTool): TowerIngestEntry | undefined {
  return TOWER_INGEST_REGISTRY.find((entry) => entry.tool === tool);
}
