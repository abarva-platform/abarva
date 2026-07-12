import { buildNextPhaseReadinessPack } from '../next-phase-readiness-pack';
import type { MoveEvidenceNeedPacket } from '@/lib/programs/evidence-readiness/move-evidence-need-packet';

function packet(overrides: Partial<MoveEvidenceNeedPacket>): MoveEvidenceNeedPacket {
  return {
    moveId: 'move-1',
    phase: 2,
    artifactType: 'target_state_architecture',
    evidenceSlot: 'IT systems landscape',
    familyId: 'it_systems_landscape',
    priority: 'required',
    ownerSource: 'Client owner',
    acceptedFormats: ['CSV', 'XLSX'],
    exampleTemplate: 'Application and integration landscape',
    exampleContent: ['System inventory'],
    whyItMatters: 'Architecture artifacts need the real systems and owners.',
    blockedArtifacts: [
      { artifactType: 'target_state_architecture', title: 'Target-State Architecture', phase: 3, reason: 'needed' },
    ],
    canDraftBoundary: { canDraft: false, canDraftLabel: '', cannotDraftLabel: '' },
    preliminaryGenerationCaveat: null,
    waiverOption: null,
    nextAction: 'Upload a CMDB export or architecture diagram.',
    status: 'missing',
    evidenceTitles: [],
    ...overrides,
  };
}

describe('buildNextPhaseReadinessPack — real gap data, no fabrication', () => {
  it('includes only open needs that block an artifact in the next phase', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [
        packet({ evidenceSlot: 'IT systems landscape' }),
        packet({
          evidenceSlot: 'KPI baseline',
          familyId: 'kpi_baseline',
          status: 'covered',
        }),
        packet({
          evidenceSlot: 'Cost baseline',
          familyId: 'cost_baseline',
          blockedArtifacts: [
            { artifactType: 'business_case', title: 'Business Case', phase: 4, reason: 'needed' },
          ],
        }),
      ],
      suggestedSessions: ['Solution options workshop'],
      suggestedTemplates: [{ name: 'Solution Options Canvas', type: 'PPTX' }],
    });

    expect(pack.openNeeds).toHaveLength(1);
    expect(pack.openNeeds[0].evidenceSlot).toBe('IT systems landscape');
    expect(pack.openNeeds[0].acceptedFormats).toEqual(['CSV', 'XLSX']);
    expect(pack.openNeeds[0].nextAction).toContain('CMDB');
  });

  it('sorts open needs required-first', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [
        packet({ evidenceSlot: 'Optional slot', priority: 'optional', status: 'partial' }),
        packet({ evidenceSlot: 'Required slot', priority: 'required', status: 'missing' }),
        packet({ evidenceSlot: 'Recommended slot', priority: 'recommended', status: 'partial' }),
      ],
      suggestedSessions: [],
      suggestedTemplates: [],
    });

    expect(pack.openNeeds.map((n) => n.evidenceSlot)).toEqual([
      'Required slot',
      'Recommended slot',
      'Optional slot',
    ]);
  });

  it('isFullyReady is true only when no required need is open', () => {
    const withRequired = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [packet({ priority: 'required', status: 'missing' })],
      suggestedSessions: [],
      suggestedTemplates: [],
    });
    expect(withRequired.isFullyReady).toBe(false);

    const onlyOptional = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [packet({ priority: 'optional', status: 'partial' })],
      suggestedSessions: [],
      suggestedTemplates: [],
    });
    expect(onlyOptional.isFullyReady).toBe(true);

    const noOpenNeeds = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [],
      suggestedSessions: [],
      suggestedTemplates: [],
    });
    expect(noOpenNeeds.isFullyReady).toBe(true);
  });

  it('excludes covered, waived, and not_applicable packets even when required', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [
        packet({ status: 'covered' }),
        packet({ status: 'waived' }),
        packet({ status: 'not_applicable' }),
      ],
      suggestedSessions: [],
      suggestedTemplates: [],
    });
    expect(pack.openNeeds).toHaveLength(0);
    expect(pack.isFullyReady).toBe(true);
  });

  it('carries the terminal-handoff flag and label through untouched (P5 → Tower)', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Tower handoff',
      nextPhaseNum: 6,
      isTerminalHandoff: true,
      evidenceNeedPackets: [],
      suggestedSessions: ['Tower metric handoff'],
      suggestedTemplates: [],
    });
    expect(pack.isTerminalHandoff).toBe(true);
    expect(pack.nextPhaseLabel).toBe('Tower handoff');
    expect(pack.suggestedSessions).toEqual(['Tower metric handoff']);
  });

  it('defaults carriesForwardContent to empty when the caller supplies none', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Choose the Approach',
      nextPhaseNum: 3,
      isTerminalHandoff: false,
      evidenceNeedPackets: [],
      suggestedSessions: [],
      suggestedTemplates: [],
    });
    expect(pack.carriesForwardContent).toEqual([]);
  });

  it('passes real content signals through untouched', () => {
    const pack = buildNextPhaseReadinessPack({
      nextPhaseLabel: 'Build the Plan',
      nextPhaseNum: 4,
      isTerminalHandoff: false,
      evidenceNeedPackets: [],
      suggestedSessions: [],
      suggestedTemplates: [],
      carriesForwardContent: [
        { key: 'workstreams', heading: 'Workstream Breakdown', snippet: 'Data platform migration...' },
      ],
    });
    expect(pack.carriesForwardContent).toHaveLength(1);
    expect(pack.carriesForwardContent[0].heading).toBe('Workstream Breakdown');
  });
});
