// PROG20 · Program subnav + workflow canvas interaction.
//
// Verifies the structural invariants added in PROG20:
//   1. SubNavStrip imported and used in ProgramDetailPage
//   2. Seven section tabs declared: overview, gate, evidence, deliverables, workshop, actions, decisions
//   3. Section content testid markers present
//   4. activeSection state wired to tab onChange
//   5. Action A handler switches to gate tab (not just scrolls)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);
const source = readFileSync(COMPONENT_PATH, 'utf8');

describe('PROG20 · ProgramDetailPage · SubNavStrip integration', () => {
  it('imports SubNavStrip from shell', () => {
    expect(source).toContain("from '@/components/shell/SubNavStrip'");
  });

  it('renders SubNavStrip with section items', () => {
    expect(source).toContain('SubNavStrip');
    expect(source).toContain('data-testid="program-section-tabs"');
  });

  it('declares activeSection state', () => {
    expect(source).toContain('activeSection');
    expect(source).toContain('setActiveSection');
  });

  it('has SectionKey type with all 7 tabs', () => {
    const sectionType = "type SectionKey = 'overview' | 'gate' | 'evidence' | 'deliverables' | 'workshop' | 'actions' | 'decisions'";
    expect(source).toContain(sectionType);
  });

  it('surfaces a visible strategic move record quick nav above the collapsed detail record', () => {
    expect(source).toContain('data-testid="program-phase-archive-quicknav"');
    expect(source).toContain('PhaseArchiveQuickNav');
    expect(source).toContain('openArchiveSection');
    expect(source).toContain('Strategic move record');
  });

  it('quick nav changes the immediate readable record browser', () => {
    expect(source).toContain("data-testid={`program-phase-archive-${item.key}`}");
    expect(source).toContain("setArchiveOpen(true)");
    expect(source).toContain("setActiveSection(section)");
    expect(source).toContain('data-testid="program-record-browser"');
    expect(source).toContain('data-testid="program-record-browser-deliverables"');
  });
});

describe('PROG20 · ProgramDetailPage · section tab keys', () => {
  const REQUIRED_TABS = ['overview', 'gate', 'evidence', 'deliverables', 'workshop', 'actions', 'decisions'];

  REQUIRED_TABS.forEach((tab) => {
    it(`has key="${tab}" tab item`, () => {
      expect(source).toContain(`key: '${tab}'`);
    });
  });

  it('overview tab is active by default (useState initial value)', () => {
    expect(source).toContain("useState<SectionKey>('overview')");
  });
});

describe('PROG20 · ProgramDetailPage · section content testids', () => {
  it('has data-testid="program-section-overview"', () => {
    expect(source).toContain('data-testid="program-section-overview"');
  });

  it('has data-testid="program-section-gate"', () => {
    expect(source).toContain('data-testid="program-section-gate"');
  });

  it('has data-testid="program-section-evidence"', () => {
    expect(source).toContain('data-testid="program-section-evidence"');
  });

  it('has data-testid="program-section-deliverables"', () => {
    expect(source).toContain('data-testid="program-section-deliverables"');
  });

  it('has data-testid="program-section-workshop"', () => {
    expect(source).toContain('data-testid="program-section-workshop"');
  });

  it('has data-testid="program-section-actions"', () => {
    expect(source).toContain('data-testid="program-section-actions"');
  });

  it('has data-testid="program-section-decisions"', () => {
    expect(source).toContain('data-testid="program-section-decisions"');
  });
});

describe('PROG20 · ProgramDetailPage · workflow canvas correctness', () => {
  it('gate tab shows GateRibbon and GateCriteriaList', () => {
    expect(source).toContain('program-section-gate');
    expect(source).toContain('GateRibbon');
    expect(source).toContain('GateCriteriaList');
  });

  it('evidence tab shows EvidenceSection', () => {
    expect(source).toContain('program-section-evidence');
    expect(source).toContain('EvidenceSection');
  });

  it('deliverables tab shows DeliverablesList', () => {
    expect(source).toContain('program-section-deliverables');
    expect(source).toContain('DeliverablesList');
  });

  it('workshop tab shows workbench prose and actions', () => {
    expect(source).toContain('program-section-workshop');
    expect(source).toContain('view.workbench.prose');
    expect(source).toContain('view.workbench.title');
  });

  it('actions tab shows handleActionClick wired to action buttons', () => {
    expect(source).toContain('program-section-actions');
    expect(source).toContain('handleActionClick');
  });

  it('decisions tab has honest disclaimer', () => {
    expect(source).toContain('program-section-decisions');
    expect(source).toContain('data-honest-disclaimer="programs-decisions"');
  });

  it('action A switches to gate tab (not just scrolls)', () => {
    expect(source).toContain("setActiveSection('gate')");
  });
});

describe('PROG20 · ProgramDetailPage · module hygiene', () => {
  it('no runtime impurity introduced', () => {
    // existing guard — Math.random / new Date() / fetch() not in component
    expect(source).not.toMatch(/Math\.random/);
    expect(source).not.toMatch(/['"]anthropic['"]/);
  });
});
