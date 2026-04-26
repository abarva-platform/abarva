// PROG14 · Program Action / Agent Mission / Resume Strip tests.
//
// Pure type/source tests — no jsdom, no React rendering. Asserts the
// shape and canon of the view-model and the component module.

import * as fs from 'fs';
import * as path from 'path';
import {
  buildProgramActionMissionStripView,
  type StripAgentKey,
} from '../../../lib/programs/program-action-mission-strip-view';
import { ProgramActionMissionStrip } from '../../../components/programs/ProgramActionMissionStrip';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(
    repoRoot,
    'src/components/programs/ProgramActionMissionStrip.tsx',
  ),
  'utf8',
);

const ALL_AGENTS: ReadonlyArray<StripAgentKey> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

describe('PROG14 · buildProgramActionMissionStripView', () => {
  it('returns exactly 3 topActions', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.topActions).toHaveLength(3);
  });

  it('has 4 agentMissions', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.agentMissions.length).toBe(4);
  });

  it('agentMissions cover all 4 agents exactly once', () => {
    const view = buildProgramActionMissionStripView();
    const agents = view.agentMissions.map((row) => row.agent).sort();
    expect(agents).toEqual([...ALL_AGENTS].sort());
  });

  it('all topActions have a valid ownerAgent', () => {
    const view = buildProgramActionMissionStripView();
    for (const action of view.topActions) {
      expect(ALL_AGENTS).toContain(action.ownerAgent);
    }
  });

  it('all topActions have a non-empty stopCondition', () => {
    const view = buildProgramActionMissionStripView();
    for (const action of view.topActions) {
      expect(action.stopCondition.trim().length).toBeGreaterThan(0);
    }
  });

  it('resumeAction.label is non-empty', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.resumeAction.label.trim().length).toBeGreaterThan(0);
  });

  it('resumeAction.rationale is non-empty', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.resumeAction.rationale.trim().length).toBeGreaterThan(0);
  });

  it('blockedItems.length is at least 1', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.blockedItems.length).toBeGreaterThanOrEqual(1);
  });

  it('blockedItems.length is at most 3', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.blockedItems.length).toBeLessThanOrEqual(3);
  });

  it('every blockedItem has a valid unblockedBy agent', () => {
    const view = buildProgramActionMissionStripView();
    for (const item of view.blockedItems) {
      expect(ALL_AGENTS).toContain(item.unblockedBy);
    }
  });

  it('caveat contains "deterministic"', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.caveat.toLowerCase()).toContain('deterministic');
  });

  it('caveat asserts read-only / no live writes', () => {
    const view = buildProgramActionMissionStripView();
    const c = view.caveat.toLowerCase();
    expect(c.includes('no live') || c.includes('read-only')).toBe(true);
  });

  it('generatedAt === "2026-04-26"', () => {
    const view = buildProgramActionMissionStripView();
    expect(view.generatedAt).toBe('2026-04-26');
  });

  it('ProgramActionMissionStrip exports as a function', () => {
    expect(typeof ProgramActionMissionStrip).toBe('function');
  });

  it('component source does not contain banned teal tokens', () => {
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
  });
});
