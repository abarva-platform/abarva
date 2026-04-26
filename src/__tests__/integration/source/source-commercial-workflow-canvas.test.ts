import * as fs from 'fs';
import * as path from 'path';
import {
  SourceCommercialWorkflowCanvas,
  COMMERCIAL_WORKFLOW_STAGES,
} from '../../../components/source/SourceCommercialWorkflowCanvas';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/source/SourceCommercialWorkflowCanvas.tsx'),
  'utf8'
);

describe('SourceCommercialWorkflowCanvas (SRC31)', () => {
  test('SourceCommercialWorkflowCanvas exports as a function', () => {
    expect(typeof SourceCommercialWorkflowCanvas).toBe('function');
  });

  test('COMMERCIAL_WORKFLOW_STAGES has exactly 9 items', () => {
    expect(COMMERCIAL_WORKFLOW_STAGES).toHaveLength(9);
  });

  test('Stage IDs are unique', () => {
    const ids = COMMERCIAL_WORKFLOW_STAGES.map((stage) => stage.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('Stage IDs include all 9 canonical workflow stages', () => {
    const ids = COMMERCIAL_WORKFLOW_STAGES.map((stage) => stage.id).sort();
    const expected = [
      'bafo',
      'brief',
      'comparison',
      'decision',
      'missions',
      'pricing',
      'readiness',
      'risk',
      'signals',
    ];
    expect(ids).toEqual(expected);
  });

  test('Each stage has id, label, shortLabel, description', () => {
    for (const stage of COMMERCIAL_WORKFLOW_STAGES) {
      expect(typeof stage.id).toBe('string');
      expect(typeof stage.label).toBe('string');
      expect(typeof stage.shortLabel).toBe('string');
      expect(typeof stage.description).toBe('string');
      expect(stage.id.length).toBeGreaterThan(0);
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.shortLabel.length).toBeGreaterThan(0);
      expect(stage.description.length).toBeGreaterThan(0);
    }
  });

  test('Component source contains "deterministic" caveat language', () => {
    expect(componentSource).toContain('deterministic');
  });

  test('Component source contains "seed-backed" caveat language', () => {
    const hasSeedBacked =
      componentSource.includes('seed-backed') ||
      componentSource.includes('seed backed');
    expect(hasSeedBacked).toBe(true);
  });

  test('Component source does NOT contain "fake savings" phrasing', () => {
    expect(componentSource).not.toContain('fake savings');
  });

  test('Component source does NOT contain teal #14B8A6', () => {
    expect(componentSource).not.toContain('#14B8A6');
  });

  test('Component source does NOT contain teal #0E9F8C', () => {
    expect(componentSource).not.toContain('#0E9F8C');
  });

  test('Component source contains navy #1B2B5C', () => {
    expect(componentSource).toContain('#1B2B5C');
  });

  test('Component source contains warm off-white #FBFAF7', () => {
    expect(componentSource).toContain('#FBFAF7');
  });

  test('Component source contains "executive decision" workflow language', () => {
    expect(componentSource).toContain('executive decision');
  });

  test('Component source contains BAFO stage label', () => {
    expect(componentSource).toContain('BAFO');
  });
});
