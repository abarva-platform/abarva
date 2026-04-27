import * as fs from 'fs';
import * as path from 'path';
import { buildNexusProgramWorkbenchView } from '../../../lib/programs/nexus-program-workbench-view';
import { NexusProgramWorkbench } from '../../../components/programs/NexusProgramWorkbench';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/NexusProgramWorkbench.tsx'),
  'utf8',
);
const viewSource = fs.readFileSync(
  path.join(repoRoot, 'src/lib/programs/nexus-program-workbench-view.ts'),
  'utf8',
);
const canonicalDetailSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramCanonicalDetail.tsx'),
  'utf8',
);
const flagshipSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramFlagshipPage.tsx'),
  'utf8',
);

describe('AGENTUI1 · buildNexusProgramWorkbenchView', () => {
  const view = buildNexusProgramWorkbenchView({
    programCode: 'APX-CDP-2026',
    programName: 'Apex Retail CDP Activation',
    tenantLabel: 'Apex Retail',
    currentPhaseSpec: 4,
    deliverableCount: 14,
    evidenceBackedDeliverables: 5,
  });

  it('renders current program identity', () => {
    expect(view.currentProgram).toContain('APX-CDP-2026');
    expect(view.currentProgram).toContain('Apex Retail CDP Activation');
  });

  it('renders current phase, gate, and workflow stage', () => {
    expect(view.currentPhase).toContain('Synthesis');
    expect(view.currentGateState).toContain('Design gate');
    expect(view.currentWorkflowStage).toContain('Workshop 5');
  });

  it('contains context used chips', () => {
    expect(view.contextUsed).toEqual(
      expect.arrayContaining([
        'Program state',
        'Workshop 5 outcomes',
        'Evidence ledger',
        'Deliverables',
        'Source AMS event',
      ]),
    );
  });

  it('contains evidence confidence, blocker, and recommendation', () => {
    expect(view.confidenceState).toContain('Deterministic confidence');
    expect(view.evidenceState).toContain('5/14');
    expect(view.blocker).toContain('Missing value evidence');
    expect(view.recommendedNextAction).toContain('Review Design gate blockers');
  });

  it('contains three contextual suggested actions plus custom ask affordance', () => {
    expect(view.suggestedActions.map((action) => action.label)).toEqual([
      'Review Design gate blockers',
      'Open Workshop 5 outcomes',
      'Inspect deliverable evidence',
    ]);
    expect(view.customAskPlaceholder).toBe(
      'Ask Nexus about this program, gate, workshop, or evidence...',
    );
    expect(view.customAskDeferredState).toContain('disabled until runtime');
  });

  it('contains deterministic/live caveat and agent handoffs', () => {
    expect(view.deterministicCaveat).toContain('deterministic');
    expect(view.deterministicCaveat).toContain('No live chat');
    expect(view.agentHandoffs.map((handoff) => handoff.agent)).toEqual([
      'nexus',
      'steward',
      'sentinel',
      'atlas',
    ]);
  });
});

describe('AGENTUI1 · NexusProgramWorkbench component contract', () => {
  it('exports a function component', () => {
    expect(typeof NexusProgramWorkbench).toBe('function');
  });

  it('ships the required visual contract text', () => {
    expect(componentSource).toContain('Nexus workbench');
    expect(componentSource).toContain('Phase Journey');
    expect(componentSource).toContain('Context used');
    expect(componentSource).toContain('Suggested next actions');
    expect(componentSource).toContain('Ask Nexus');
    expect(componentSource).toContain('Submit deferred');
  });

  it('uses dark navy / blue accents and avoids banned teal/cyber styling', () => {
    expect(componentSource).toContain('#132B4F');
    expect(componentSource).toContain('#0B4A91');
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
    expect(componentSource.toLowerCase()).not.toContain('cyber');
  });

  it('does not include generic assistant/chatbot copy', () => {
    const combined = `${componentSource}\n${viewSource}`.toLowerCase();
    expect(combined).not.toContain('generic chatbot');
    expect(combined).not.toContain('chatbot');
    expect(combined).not.toContain('avatar');
  });

  it('does not import model/runtime/upload/persistence APIs', () => {
    const combined = `${componentSource}\n${viewSource}`;
    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('anthropic');
    expect(combined).not.toContain('claude');
    expect(combined).not.toContain('@/lib/models');
    expect(combined).not.toContain('@/lib/ai');
    expect(combined).not.toContain('@/lib/upload');
    expect(combined).not.toContain('@/lib/parsing');
    expect(combined).not.toContain('supabase');
    expect(combined).not.toContain('fetch(');
  });

  it('is mounted above the fold in the active Program detail route component', () => {
    expect(canonicalDetailSource).toContain('NexusProgramWorkbench');
    expect(canonicalDetailSource.indexOf('NexusProgramWorkbench')).toBeLessThan(
      canonicalDetailSource.indexOf('Primary workspace'),
    );
  });

  it('is also available in the ProgramFlagshipPage reference shell', () => {
    expect(flagshipSource).toContain('NexusProgramWorkbench');
  });
});
