// PROG10 · Program Flagship Page Shell — deterministic source tests.
//
// Type-level + source-text assertions only. No jsdom, no React render.
// We verify:
//   1. The view-model builder is deterministic and matches contract.
//   2. The component file ships the AbarVa canon and the slot prop API.

import * as fs from 'fs';
import * as path from 'path';
import { buildProgramFlagshipView } from '../../../lib/programs/program-flagship-view';
import { ProgramFlagshipPage } from '../../../components/programs/ProgramFlagshipPage';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramFlagshipPage.tsx'),
  'utf8',
);

const view = buildProgramFlagshipView({
  tenantSlug: 'apex-retail',
  programSlug: 'cdp-activation',
});

describe('PROG10 · ProgramFlagshipView', () => {
  test('1. pageQuestion is non-empty', () => {
    expect(typeof view.pageQuestion).toBe('string');
    expect(view.pageQuestion.length).toBeGreaterThan(0);
  });

  test('2. primaryAgent is "nexus"', () => {
    expect(view.primaryAgent).toBe('nexus');
  });

  test('3. whatThePageKnows has at least 5 rows', () => {
    expect(view.whatThePageKnows.length).toBeGreaterThanOrEqual(5);
  });

  test('4. whatThePageIsMissing has at least 2 rows', () => {
    expect(view.whatThePageIsMissing.length).toBeGreaterThanOrEqual(2);
  });

  test('5. recommendedNextAction.verb is non-empty', () => {
    expect(typeof view.recommendedNextAction.verb).toBe('string');
    expect(view.recommendedNextAction.verb.length).toBeGreaterThan(0);
  });

  test('6. recommendedNextAction.target is non-empty', () => {
    expect(typeof view.recommendedNextAction.target).toBe('string');
    expect(view.recommendedNextAction.target.length).toBeGreaterThan(0);
  });

  test('7. caveat contains "deterministic"', () => {
    expect(view.caveat.toLowerCase()).toContain('deterministic');
  });

  test('8. caveat references seed backing', () => {
    const lower = view.caveat.toLowerCase();
    expect(lower.includes('seed') || lower.includes('seed-backed')).toBe(true);
  });

  test('9. generatedAt is "2026-04-26"', () => {
    expect(view.generatedAt).toBe('2026-04-26');
  });

  test('10. brief.asOf is "2026-04-26"', () => {
    expect(view.brief.asOf).toBe('2026-04-26');
  });
});

describe('PROG10 · ProgramFlagshipPage component', () => {
  test('11. exports a function component', () => {
    expect(typeof ProgramFlagshipPage).toBe('function');
  });

  test('12. component source contains navy accent #1B2B5C', () => {
    expect(componentSource).toContain('#1B2B5C');
  });

  test('13. component source contains warm off-white surface tokens', () => {
    expect(
      componentSource.includes('#FBFAF7') ||
        componentSource.includes('#FFFFFF'),
    ).toBe(true);
  });

  test('14. component source has no banned teal accents', () => {
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
  });

  test('15. component source advertises all four slot props', () => {
    expect(componentSource).toContain('phaseGateSlot');
    expect(componentSource).toContain('workshopCanvasSlot');
    expect(componentSource).toContain('deliverablesEvidenceSlot');
    expect(componentSource).toContain('actionMissionStripSlot');
  });
});
