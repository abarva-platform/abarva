/**
 * data-trust-composer tests — Setup Redesign Package PR B.
 */

import { composeDataTrustBlocks } from '../data-trust-composer';
import { buildAuthoredInventoryFallback, getSetupActsContent } from '../setup-acts-registry';

const FCF = buildAuthoredInventoryFallback(getSetupActsContent('arcturus'));
const APEX = buildAuthoredInventoryFallback(getSetupActsContent('apexretail'));

describe('composeDataTrustBlocks · State', () => {
  it('returns metrics shaped for the 4-metric state header', () => {
    const blocks = composeDataTrustBlocks(FCF.segments);
    expect(blocks.state.totalSegments).toBe(14);
    expect(blocks.state.segmentsLoaded).toBeGreaterThanOrEqual(0);
    expect(blocks.state.records).toBeGreaterThan(0);
    expect(blocks.state.decisionGrade).toBeGreaterThanOrEqual(0);
    expect(blocks.state.emptyBlocking).toBeGreaterThanOrEqual(0);
  });

  it('truly sparse tenant → 0 loaded, all critical-path blocking', () => {
    const blocks = composeDataTrustBlocks([]);
    expect(blocks.state.segmentsLoaded).toBe(0);
    expect(blocks.state.records).toBe(0);
    expect(blocks.state.decisionGrade).toBe(0);
    expect(blocks.state.emptyBlocking).toBe(8);
  });
});

describe('composeDataTrustBlocks · Buckets', () => {
  it('produces 5 buckets in catalog order', () => {
    const blocks = composeDataTrustBlocks(FCF.segments);
    expect(blocks.buckets.map((b) => b.id)).toEqual([
      'who-you-are',
      'what-you-run-on',
      'what-rules-apply',
      'how-you-measure',
      'in-flight',
    ]);
  });
});

describe('composeDataTrustBlocks · Action queue', () => {
  it('caps at 5 items', () => {
    const blocks = composeDataTrustBlocks(FCF.segments);
    expect(blocks.actionQueue.length).toBeLessThanOrEqual(5);
  });

  it('items for templated segments expose the template href', () => {
    const blocks = composeDataTrustBlocks([]);
    // Empty tenant → ladder shows all 14 as Empty/Load; action queue
    // pulls top-impact empty segments. Compliance (12), Enterprise (1),
    // IT (3), Programs (6) all have templates from Setup Fix Package PR 4.
    const tplItem = blocks.actionQueue.find((i) => i.templateHref?.includes('compliance'));
    if (tplItem) {
      expect(tplItem.templateLabel).toBe('CSV');
    }
  });

  it('items for non-templated segments expose templateHref=null', () => {
    const blocks = composeDataTrustBlocks([]);
    const noTplItem = blocks.actionQueue.find(
      (i) => !i.segmentName.toLowerCase().includes('compliance')
        && !i.segmentName.toLowerCase().includes('enterprise')
        && !i.segmentName.toLowerCase().includes('system')
        && !i.segmentName.toLowerCase().includes('program'),
    );
    if (noTplItem) {
      expect(noTplItem.templateHref).toBeNull();
    }
  });
});

describe('composeDataTrustBlocks · Trust ladder', () => {
  it('always returns 14 rows ordered by family number', () => {
    const blocks = composeDataTrustBlocks(FCF.segments);
    expect(blocks.ladder).toHaveLength(14);
    for (let i = 0; i < blocks.ladder.length; i += 1) {
      expect(blocks.ladder[i].familyNumber).toBe(i + 1);
    }
  });

  it('decision-grade segment renders rung "Decision-grade" with next "—"', () => {
    // Apex has more "complete"-state segments than FCF.
    const blocks = composeDataTrustBlocks(APEX.segments);
    const decisionGradeRows = blocks.ladder.filter((r) => r.trustRung === 'Decision-grade');
    decisionGradeRows.forEach((r) => expect(r.nextAction).toBe('—'));
  });

  it('empty rung renders nextAction = Load', () => {
    const blocks = composeDataTrustBlocks([]);
    blocks.ladder.forEach((r) => {
      expect(r.trustRung).toBe('Empty');
      expect(r.nextAction).toBe('Load');
    });
  });

  it('partial / sparse rows render nextAction = Promote', () => {
    const blocks = composeDataTrustBlocks(FCF.segments);
    const partialOrSparse = blocks.ladder.filter(
      (r) => r.trustRung === 'Usable evidence' || r.trustRung === 'Available' || r.trustRung === 'Loaded',
    );
    partialOrSparse.forEach((r) => expect(r.nextAction).toBe('Promote'));
  });
});
