import {
  APPROVED_INPUTS_PACK_TYPE,
  buildApprovedInputsPack,
  isApprovedInputsPack,
} from '../approved-inputs-pack';
import { buildFeedForwardPack } from '../feed-forward';
import { computeWhatChanged } from '../what-changed';

const feedForward = buildFeedForwardPack(2, 'P3 Choose the Approach', {
  gaps: [{ capability: 'Data ownership model', severity: 'foundational' }],
  hardGaps: ['System of record unconfirmed'],
  softGaps: [],
  missingEvidence: ['Baseline metrics'],
  controlConstraints: ['Attorney approval'],
});
const whatChanged = computeWhatChanged(
  '## Selected approach\nOrchestration.',
  '## Selected approach\nCLM-embedded triage.\n## Risks\nNew.',
  ['P4 workstream inputs'],
);

describe('buildApprovedInputsPack — Move-scoped, never promoted', () => {
  const pack = buildApprovedInputsPack({
    moveId: 'm1',
    sourcePhase: 2,
    targetPhase: 3,
    targetPhaseLabel: 'P3 Choose the Approach',
    approvedBy: 'person-123',
    approvedAt: '2026-07-08T00:00:00.000Z',
    sourceUploadId: 'decision.md',
    feedForward,
    whatChanged,
  });

  it('carries the source/target phases, approver, and source upload', () => {
    expect(pack.sourcePhase).toBe(2);
    expect(pack.targetPhase).toBe(3);
    expect(pack.approvedBy).toBe('person-123');
    expect(pack.approvedAt).toBe('2026-07-08T00:00:00.000Z');
    expect(pack.sourceUploadId).toBe('decision.md');
  });

  it('includes only the populated feed-forward sections + the change summary', () => {
    expect(pack.sections.length).toBeGreaterThan(0);
    expect(pack.sections.every((s) => s.items.length > 0)).toBe(true);
    expect(pack.changeSummary?.sectionsAdded).toContain('Risks');
    expect(pack.carriesForward.length).toBeGreaterThan(0);
  });

  it('is Move-scoped and not eligible for enterprise promotion', () => {
    expect(pack.moveScopedOnly).toBe(true);
    expect(pack.enterprisePromotion).toBe('not_eligible');
  });

  it('changeSummary is null when there were no changes', () => {
    const p = buildApprovedInputsPack({
      moveId: 'm1',
      sourcePhase: 2,
      targetPhase: 3,
      targetPhaseLabel: 'P3',
      approvedBy: 'p',
      approvedAt: 'now',
      feedForward,
      whatChanged: computeWhatChanged('## A\nx', '## A\nx'),
    });
    expect(p.changeSummary).toBeNull();
  });

  it('round-trips through the store: a serialized pack is recognized on read', () => {
    const json = JSON.parse(JSON.stringify(pack));
    expect(isApprovedInputsPack(json)).toBe(true);
    expect(isApprovedInputsPack({ moveId: 'm', targetPhase: 3 })).toBe(false); // missing invariants
    expect(APPROVED_INPUTS_PACK_TYPE).toBe('approved_inputs_pack');
  });
});
