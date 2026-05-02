// PROG-P3 · Program detail source audit.
//
// Verifies the structural invariants added in the P3 canonicalization wave:
//   1. data-testid markers for P-SMOKE-CDP test targeting
//   2. Dev annotation 'Canonical route · /programs/{id}' removed
//   3. data-honest-disclaimer present on program header
//   4. Gate ribbon and linked source chip have test targets
//   5. No forbidden runtime patterns

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);

const source = readFileSync(COMPONENT_PATH, 'utf8');

describe('PROG-P3 · ProgramDetailPage · testid markers', () => {
  it('has data-testid="program-detail-page" on work pane root', () => {
    expect(source).toContain('data-testid="program-detail-page"');
  });

  it('has data-testid="program-gate-ribbon" wrapper for P-SMOKE-CDP gate assertion', () => {
    expect(source).toContain('data-testid="program-gate-ribbon"');
  });

  it('has data-testid="program-linked-source-chip" for P-SMOKE-CDP source link assertion', () => {
    expect(source).toContain('data-testid="program-linked-source-chip"');
  });
});

describe('PROG-P3 · ProgramDetailPage · dev annotation cleanup', () => {
  it('no longer uses the Canonical route dev annotation', () => {
    expect(source).not.toContain('Canonical route ·');
  });

  it('renders data-honest-disclaimer="programs-detail" in program header', () => {
    expect(source).toContain('data-honest-disclaimer="programs-detail"');
  });

  it('shows deterministic seed label in program header', () => {
    expect(source).toContain('Deterministic seed');
  });
});

describe('PROG-P3 · ProgramDetailPage · P-SMOKE-CDP critical path', () => {
  it('gate ribbon is conditional on gateStatus === pending', () => {
    expect(source).toContain("view.gateStatus === 'pending'");
  });

  it('linked source event renders LinkedProgramChip', () => {
    expect(source).toContain('LinkedProgramChip');
    expect(source).toContain('view.linkedSourceEvent');
  });

  it('action C wires to SuggestedActionOverlay with href', () => {
    // Action C falls through to generic handler that opens SuggestedActionOverlay
    // with the workbench action href (e.g. /intelligence/t3-h03 for APX-CDP-2026)
    expect(source).toContain('setSuggestedAction');
    expect(source).toContain('action.href');
    expect(source).toContain('view.workbench.actions.find');
  });
});

describe('PROG-P3 · ProgramDetailPage · module hygiene', () => {
  it('imports canonical shell components', () => {
    // ProgramDetailPage uses AppShell + RibbonSynthesis (not AgentColumn directly)
    expect(source).toContain("from '@/components/shell/AppShell'");
    expect(source).toContain("from '@/components/shell/RibbonSynthesis'");
  });

  it('uses no forbidden runtime patterns', () => {
    expect(source).not.toMatch(/from ['"]@\/lib\/auth\//);
    expect(source).not.toMatch(/['"]anthropic['"]/);
    expect(source).not.toMatch(/['"]openai['"]/);
  });

  it('resets the ribbon synthesis quote when refreshed phase data changes', () => {
    expect(source).toContain('useEffect(() => {');
    expect(source).toContain('setSynthesisQuote(view.workbench.prose);');
    expect(source).toContain('}, [view.workbench.prose]);');
  });
});
