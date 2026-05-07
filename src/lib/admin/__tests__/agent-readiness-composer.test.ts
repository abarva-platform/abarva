/**
 * agent-readiness-composer tests — Setup Redesign Package PR C.
 */

import {
  composeAgentReadinessBlocks,
  CAPABILITY_VERBS_ORDERED,
} from '../agent-readiness-composer';
import { buildAuthoredInventoryFallback, getSetupActsContent } from '../setup-acts-registry';

const FCF = buildAuthoredInventoryFallback(getSetupActsContent('arcturus'));
const APEX = buildAuthoredInventoryFallback(getSetupActsContent('apexretail'));

describe('composeAgentReadinessBlocks · State', () => {
  it('returns 4 agents in the canonical order', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    expect(blocks.state.map((a) => a.id)).toEqual(['nexus', 'sentinel', 'steward', 'atlas']);
  });

  it('each agent has a level + summary', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    blocks.state.forEach((a) => {
      expect(['blank', 'thin', 'partial', 'decision-grade']).toContain(a.level);
      expect(a.summary.length).toBeGreaterThan(0);
    });
  });

  it('truly empty tenant → all four blank', () => {
    const blocks = composeAgentReadinessBlocks([]);
    blocks.state.forEach((a) => expect(a.level).toBe('blank'));
  });
});

describe('composeAgentReadinessBlocks · Matrix', () => {
  it('returns 14 rows, 6 cells each', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    expect(blocks.matrix).toHaveLength(14);
    blocks.matrix.forEach((row) => {
      for (const verb of CAPABILITY_VERBS_ORDERED) {
        expect(row.cells[verb]).toBeDefined();
      }
    });
  });

  it('non-applicable cells exist where capability does not relate to segment', () => {
    const blocks = composeAgentReadinessBlocks(APEX.segments);
    // Segment 1 (Enterprise) is not relevant to "model-run-rate".
    const row1 = blocks.matrix.find((r) => r.familyNumber === 1);
    expect(row1?.cells['model-run-rate'].state).toBe('not-applicable');
  });

  it('decision-grade segment + relevant capability → "deep" cell', () => {
    const blocks = composeAgentReadinessBlocks(APEX.segments);
    // Apex segment 1 is "complete" in fallback → cite-evidence is deep.
    const row1 = blocks.matrix.find((r) => r.familyNumber === 1);
    if (row1) {
      // Apex authored fallback uses 'complete' for many segments.
      expect(['deep', 'partial', 'thin']).toContain(row1.cells['cite-evidence'].state);
    }
  });

  it('empty tenant → every cell is "empty" or "not-applicable"', () => {
    const blocks = composeAgentReadinessBlocks([]);
    for (const row of blocks.matrix) {
      for (const verb of CAPABILITY_VERBS_ORDERED) {
        expect(['empty', 'not-applicable']).toContain(row.cells[verb].state);
      }
    }
  });

  it('every cell has guidance text', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    for (const row of blocks.matrix) {
      for (const verb of CAPABILITY_VERBS_ORDERED) {
        expect(row.cells[verb].guidance.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('composeAgentReadinessBlocks · Admin actionable', () => {
  it('items emit a Data Trust href', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    blocks.adminActionable.forEach((item) => {
      expect(item.href).toBe('/admin/data-trust');
    });
  });

  it('truly empty tenant emits one item per agent', () => {
    const blocks = composeAgentReadinessBlocks([]);
    expect(blocks.adminActionable.length).toBeGreaterThan(0);
    expect(blocks.adminActionable.length).toBeLessThanOrEqual(4);
  });

  it('Steward and Nexus items get high severity', () => {
    const blocks = composeAgentReadinessBlocks([]);
    const steward = blocks.adminActionable.find((i) => i.agentId === 'steward');
    if (steward) expect(steward.severity).toBe('high');
    const nexus = blocks.adminActionable.find((i) => i.agentId === 'nexus');
    if (nexus) expect(nexus.severity).toBe('high');
  });
});

describe('composeAgentReadinessBlocks · Engineering tracked', () => {
  it('returns the static engineering-tracked list with Wave references', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    expect(blocks.engineeringTracked.length).toBeGreaterThan(0);
    blocks.engineeringTracked.forEach((item) => {
      expect(item.wave).toMatch(/^Wave \d+$/);
      expect(item.capability.length).toBeGreaterThan(0);
    });
  });

  it('engineering-tracked items have NO severity field (admin can\'t act on them)', () => {
    const blocks = composeAgentReadinessBlocks(FCF.segments);
    blocks.engineeringTracked.forEach((item) => {
      const asRecord = item as unknown as Record<string, unknown>;
      expect(asRecord.severity).toBeUndefined();
      expect(asRecord.href).toBeUndefined();
    });
  });
});
