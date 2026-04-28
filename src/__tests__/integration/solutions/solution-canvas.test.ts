// SOL11 · Solution Canvas integration tests.
//
// Verifies the deterministic view-model is byte-equal across calls,
// that all canonical sections are present, and that the .ts module and
// .tsx Server Component pass canon hygiene gates.

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildSolutionCanvasView,
  type SolutionCanvasInput,
} from '@/lib/solutions/solution-canvas-view';

const VIEW_MODULE_PATH = join(
  process.cwd(),
  'src/lib/solutions/solution-canvas-view.ts',
);
const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/solutions/SolutionCanvas.tsx',
);

const sampleInput: SolutionCanvasInput = {
  title: 'Ambient Documentation Pilot',
  brief:
    'Reduce clinician documentation burden by piloting ambient scribe across two ambulatory specialties.',
  currentInputs: [
    'Two ambulatory specialty clinics scoped',
    'EHR integration constraints captured',
  ],
  archetypeKey: 'ambient_documentation',
  archetypeLabel: 'Ambient Documentation',
  components: [
    {
      key: 'ambient_capture',
      name: 'Ambient Capture',
      role: 'Audio capture and on-device transcription',
    },
    {
      key: 'note_drafting',
      name: 'Note Drafting',
      role: 'Specialty-aware note assembly with clinician review',
    },
  ],
  buildBuyGuidance:
    'Buy a vendor ambient scribe that meets enterprise readiness; partner for specialty-specific note templates.',
  risks: [
    {
      key: 'phi_handling',
      label: 'PHI handling and BAA scope',
      level: 'high',
    },
    {
      key: 'clinician_adoption',
      label: 'Clinician adoption variance',
      level: 'medium',
    },
  ],
  recommendedWorkshops: [
    {
      key: 'ambient_scope',
      name: 'Ambient Scope Workshop',
      why: 'Confirm specialties, EHR write-back, and BAA scope before pilot.',
    },
  ],
  recommendedDeliverables: [
    { key: 'pilot_charter', name: 'Pilot Charter' },
    { key: 'governance_memo', name: 'Governance Memo' },
  ],
  missingInputs: [
    {
      key: 'baseline_documentation_time',
      label: 'Baseline documentation time per specialty',
    },
  ],
};

describe('SOL11 · solution canvas view', () => {
  it('buildSolutionCanvasView is byte-equal across calls', () => {
    const a = JSON.stringify(buildSolutionCanvasView(sampleInput));
    const b = JSON.stringify(buildSolutionCanvasView(sampleInput));
    expect(a).toBe(b);
  });

  it('exposes all canonical sections', () => {
    const view = buildSolutionCanvasView(sampleInput);
    const sectionKeys = view.sections.map((s) => s.key);
    expect(sectionKeys).toEqual([
      'brief',
      'currentInputs',
      'archetype',
      'components',
      'buildBuyGuidance',
      'risks',
      'recommendedWorkshops',
      'recommendedDeliverables',
      'missingInputs',
    ]);
    expect(view.createdFrom).toBe('deterministic_solution_canvas_seed');
    expect(view.archetype).toBe('Ambient Documentation');
    expect(view.components).toHaveLength(2);
    expect(view.risks).toHaveLength(2);
    expect(view.recommendedWorkshops).toHaveLength(1);
    expect(view.recommendedDeliverables).toHaveLength(2);
    expect(view.missingInputs).toHaveLength(1);
  });

  it('module hygiene · view-model .ts has no clock / random / fetch / model providers', () => {
    const src = readFileSync(VIEW_MODULE_PATH, 'utf8');
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\b/);
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/anthropic/i);
    expect(src).not.toMatch(/openai/i);
  });

  it('canon hygiene · component imports theme tokens', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8');
    expect(src).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('canon hygiene · component has no local hex literals', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8');
    expect(src).not.toMatch(/['"]#[0-9A-Fa-f]{6}['"]/);
  });

  it('canon hygiene · component has no DM Sans literals', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8');
    expect(src).not.toMatch(/['"]DM Sans[^'"]*['"]/);
  });

  it('canon hygiene · component is server-only · no use-client / hooks', () => {
    const src = readFileSync(COMPONENT_PATH, 'utf8');
    expect(src).not.toMatch(/'use client'/);
    expect(src).not.toMatch(/useState|useEffect|useMemo|useReducer|useCallback/);
  });
});
