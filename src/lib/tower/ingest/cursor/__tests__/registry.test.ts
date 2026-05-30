import {
  __resetTowerIngestRegistryForTests,
  getTowerIngestEntry,
  listTowerIngestEntries,
  registerTowerIngest,
} from '../../registry';

describe('tower ingest registry', () => {
  beforeEach(() => {
    __resetTowerIngestRegistryForTests();
  });

  test('append-only: each new key adds an entry in arrival order', () => {
    registerTowerIngest({
      key: 'copilot_team_usage_monthly',
      label: 'Copilot — team usage (monthly)',
      category: 'ai_coding_tool_usage',
      source_system: 'GitHub Copilot',
      extract_path: 'GitHub Enterprise → Copilot → Usage',
      cadence: 'monthly',
      status: 'pilot',
      target_tables: ['tower_ai_tool_usage'],
      tool_discriminator: 'copilot',
      templates: ['public/templates/tower/copilot/template.xlsx'],
      dimensions: ['adoption'],
      owner_slice: 'S2',
    });
    registerTowerIngest({
      key: 'claude_code_team_usage_monthly',
      label: 'Claude Code — team usage (monthly)',
      category: 'ai_coding_tool_usage',
      source_system: 'Claude Code',
      extract_path: 'Anthropic Console → Org → Usage',
      cadence: 'monthly',
      status: 'pilot',
      target_tables: ['tower_ai_tool_usage'],
      tool_discriminator: 'claude_code',
      templates: ['public/templates/tower/claude-code/template.xlsx'],
      dimensions: ['adoption', 'cost'],
      owner_slice: 'S3',
    });
    registerTowerIngest({
      key: 'cursor_team_usage_monthly',
      label: 'Cursor — team usage + cost (monthly)',
      category: 'ai_coding_tool_usage',
      source_system: 'Cursor',
      extract_path: 'Cursor Admin → Teams → Usage Export',
      cadence: 'monthly',
      status: 'pilot',
      target_tables: ['tower_ai_tool_usage'],
      tool_discriminator: 'cursor',
      templates: ['public/templates/tower/cursor/template.xlsx'],
      dimensions: ['adoption', 'cost'],
      owner_slice: 'S4',
    });

    const entries = listTowerIngestEntries();
    expect(entries.map((e) => e.key)).toEqual([
      'copilot_team_usage_monthly',
      'claude_code_team_usage_monthly',
      'cursor_team_usage_monthly',
    ]);
  });

  test('union-merges target_tables, templates, dimensions on key conflict', () => {
    registerTowerIngest({
      key: 'shared_key',
      label: 'first writer wins on label',
      category: 'ai_coding_tool_usage',
      source_system: 'X',
      extract_path: 'a',
      cadence: 'monthly',
      status: 'pilot',
      target_tables: ['tower_ai_tool_usage'],
      templates: ['public/templates/tower/x/template.xlsx'],
      dimensions: ['adoption'],
      owner_slice: 'S?',
    });
    registerTowerIngest({
      key: 'shared_key',
      label: 'second writer should NOT overwrite label',
      category: 'ai_coding_tool_usage',
      source_system: 'X',
      extract_path: 'a',
      cadence: 'monthly',
      status: 'pilot',
      target_tables: ['tower_ai_tool_usage', 'tower_ai_tool_usage_user'],
      templates: ['public/templates/tower/x/sample-filled.xlsx'],
      dimensions: ['cost'],
      owner_slice: 'S?',
    });

    const e = getTowerIngestEntry('shared_key')!;
    expect(e.label).toBe('first writer wins on label');
    expect(e.target_tables).toEqual([
      'tower_ai_tool_usage',
      'tower_ai_tool_usage_user',
    ]);
    expect(e.templates).toEqual([
      'public/templates/tower/x/template.xlsx',
      'public/templates/tower/x/sample-filled.xlsx',
    ]);
    expect(e.dimensions).toEqual(['adoption', 'cost']);
  });

  test('S4 entry self-registers when its module is imported (side-effect)', () => {
    // Importing registry-entry runs `registerTowerIngest(...)` at module load
    // time. Because the module may already be cached from earlier tests, we
    // assert the entry shape against the imported constant — which is the
    // value returned by registerTowerIngest — rather than against the outer
    // registry (which beforeEach has just cleared).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CURSOR_INGEST_ENTRY } = require('../registry-entry');
    expect(CURSOR_INGEST_ENTRY).toBeDefined();
    expect(CURSOR_INGEST_ENTRY.key).toBe('cursor_team_usage_monthly');
    expect(CURSOR_INGEST_ENTRY.tool_discriminator).toBe('cursor');
    expect(CURSOR_INGEST_ENTRY.target_tables).toContain('tower_ai_tool_usage');
    expect(CURSOR_INGEST_ENTRY.dimensions).toEqual(
      expect.arrayContaining(['adoption', 'cost']),
    );
  });
});
