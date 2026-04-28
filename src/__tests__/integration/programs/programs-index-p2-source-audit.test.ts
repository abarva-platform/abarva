// PROG-P2 · Programs index source audit.
//
// Verifies the structural invariants added in the P2 wave:
//   1. data-testid markers for P-SMOKE-CDP test targeting
//   2. Flagship card shows APX-CDP-2026 spotlight label (not dev annotation)
//   3. Honest disclaimer present at footer
//   4. No forbidden runtime patterns
//   5. Canonical shell components imported

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramsIndexPage.tsx',
);

const source = readFileSync(COMPONENT_PATH, 'utf8');

describe('PROG-P2 · ProgramsIndexPage · testid markers', () => {
  it('has data-testid="programs-index-page" on work pane', () => {
    expect(source).toContain('data-testid="programs-index-page"');
  });

  it('has data-testid="programs-flagship-card" on flagship card', () => {
    expect(source).toContain('data-testid="programs-flagship-card"');
  });

  it('has data-testid="programs-empty-state" on empty state', () => {
    expect(source).toContain('data-testid="programs-empty-state"');
  });

  it('has data-testid="programs-table" wrapper around ProgramsTable', () => {
    expect(source).toContain('data-testid="programs-table"');
  });
});

describe('PROG-P2 · ProgramsIndexPage · flagship card copy', () => {
  it('flagship label uses Spotlight not the dev annotation', () => {
    expect(source).toContain('Spotlight · ');
    expect(source).not.toContain('Canonical route · /programs');
  });
});

describe('PROG-P2 · ProgramsIndexPage · honest disclaimer', () => {
  it('renders the honest disclaimer with data-honest-disclaimer marker', () => {
    expect(source).toContain('data-honest-disclaimer="programs-index"');
    expect(source).toContain('Deterministic seed · Apex Retail Group');
  });
});

describe('PROG-P2 · ProgramsIndexPage · module hygiene', () => {
  it('imports canonical shell components', () => {
    expect(source).toContain("from '@/components/shell/AppShell'");
    expect(source).toContain("from '@/components/shell/AgentColumn'");
  });

  it('uses no forbidden runtime patterns', () => {
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).not.toMatch(/from ['"]@\/lib\/auth\//);
    expect(source).not.toMatch(/['"]anthropic['"]/);
    expect(source).not.toMatch(/['"]openai['"]/);
  });

  it('uses no time or random sources', () => {
    expect(source).not.toMatch(/Date\.now/);
    expect(source).not.toMatch(/Math\.random/);
    expect(source).not.toMatch(/new Date\(/);
  });
});
