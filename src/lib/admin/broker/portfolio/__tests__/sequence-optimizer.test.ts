import type { ProgramInstance, ProgramPatternId } from '@/lib/programs/program-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { optimizePortfolioSequence, type PortfolioSequence } from '../sequence-optimizer';

describe('optimizePortfolioSequence', () => {
  it('produces a four-quarter sequence for the Apex Retail program substrate', () => {
    const sequence = optimizePortfolioSequence({
      clientKey: 'apex-retail',
      programs: APEX_RETAIL_PROGRAM_INSTANCES,
      startQuarterId: '2026-Q3',
    });

    expect(sequence.quarters).toHaveLength(4);
    expect(sequence.quarters.map((quarter) => quarter.quarterId)).toEqual(['2026-Q3', '2026-Q4', '2027-Q1', '2027-Q2']);
    expect(sequence.quarters.flatMap((quarter) => quarter.moves).length).toBeGreaterThan(0);
    expect(sequence.alternativeSequences.length).toBeGreaterThanOrEqual(2);
    expectEverySequenceItemIsDecisionGrade(sequence);
  });

  it('blocks a dependent Move until its hard dependency is scheduled first', () => {
    const dataFoundation = makeProgram({
      id: 'MER-DATA-SPINE',
      clientKey: 'meridian',
      name: 'Clinical Data Spine Remediation',
      patternId: 'PAT-PRG-DATA-FAB-001',
      estimatedValueUsd: 2_000_000,
      evidence: ['Epic source system data quality remediation and Azure pipeline foundation.'],
    });
    const ambientDocs = makeProgram({
      id: 'MER-AMBIENT-DOCS',
      clientKey: 'meridian',
      name: 'Ambient Clinical Documentation',
      patternId: 'PAT-PRG-CC-AI-001',
      estimatedValueUsd: 8_000_000,
      evidence: ['Ambient documentation depends on Epic data quality and clinical governance.'],
    });

    const sequence = optimizePortfolioSequence({
      clientKey: 'meridian',
      programs: [ambientDocs, dataFoundation],
      dependencyEdges: [
        {
          fromMove: 'MER-DATA-SPINE',
          toMove: 'MER-AMBIENT-DOCS',
          kind: 'data_dependency',
          strength: 'hard',
          rationale: 'Ambient documentation needs the data spine to clear Epic quality issues first.',
          detectedBy: 'substrate',
        },
      ],
      resourcePools: [],
      cannibalizationFindings: [],
      startQuarterId: '2026-Q3',
    });

    const firstQuarterMoves = sequence.quarters[0].moves.map((move) => move.moveId);
    expect(firstQuarterMoves).toContain('MER-DATA-SPINE');
    expect(firstQuarterMoves).not.toContain('MER-AMBIENT-DOCS');
    expect(sequence.quarters[0].blockedMoves).toContainEqual(
      expect.objectContaining({ moveId: 'MER-AMBIENT-DOCS', blockedBy: ['MER-DATA-SPINE'] }),
    );
  });

  it('respects resource-pool capacity and names constrained pools', () => {
    const programs = [
      makeProgram({ id: 'SKY-CREW', clientKey: 'skyharbor-air', name: 'Crew Scheduling AI' }),
      makeProgram({ id: 'SKY-IROPS', clientKey: 'skyharbor-air', name: 'Irregular Operations Recovery AI' }),
    ];

    const sequence = optimizePortfolioSequence({
      clientKey: 'skyharbor-air',
      programs,
      dependencyEdges: [],
      resourcePools: [
        {
          id: 'sponsor:ops',
          kind: 'sponsor',
          capacityPerQuarter: 1,
          committedByMoveId: { 'SKY-CREW': 1, 'SKY-IROPS': 1 },
          availableForNewWork: 0,
        },
      ],
      cannibalizationFindings: [],
      startQuarterId: '2026-Q3',
    });

    expect(sequence.quarters[0].moves).toHaveLength(1);
    expect(sequence.quarters[0].resourceUtilization['sponsor:ops']).toBe(1);
    expect(sequence.quarters[0].blockedMoves).toContainEqual(
      expect.objectContaining({ blockedBy: ['sponsor:ops'], recommendedAction: expect.stringContaining('constrained pool') }),
    );
  });

  it('is tenant-scoped and deterministic', () => {
    const apexProgram = makeProgram({ id: 'APX-CCAI', clientKey: 'apex-retail', name: 'Apex Contact Center AI' });
    const meridianProgram = makeProgram({ id: 'MER-CCAI', clientKey: 'meridian', name: 'Meridian Contact Center AI' });
    const input = { clientKey: 'apex-retail', programs: [apexProgram, meridianProgram] };

    expect(optimizePortfolioSequence(input)).toEqual(optimizePortfolioSequence(input));
    expect(JSON.stringify(optimizePortfolioSequence(input))).not.toContain('MER-CCAI');
  });
});

function expectEverySequenceItemIsDecisionGrade(sequence: PortfolioSequence): void {
  for (const quarter of sequence.quarters) {
    expect(quarter.quarterId).toMatch(/^\d{4}-Q[1-4]$/);
    for (const move of quarter.moves) {
      expect(move.moveId).toBeTruthy();
      expect(move.phase).toBeTruthy();
      expect(move.reasoning.length).toBeGreaterThan(40);
      expect(move.reasoning).not.toMatch(/signal:[0-9a-f-]{8,}/i);
    }
    for (const blocked of quarter.blockedMoves) {
      expect(blocked.moveId).toBeTruthy();
      expect(blocked.blockedBy.length).toBeGreaterThan(0);
      expect(blocked.recommendedAction.length).toBeGreaterThan(30);
    }
  }
}

function makeProgram(input: {
  id: string;
  clientKey: string;
  name: string;
  patternId?: ProgramPatternId;
  estimatedValueUsd?: number;
  evidence?: string[];
}): ProgramInstance {
  return {
    id: input.id,
    displayId: input.id,
    tenantSlug: input.clientKey,
    tenantId: input.clientKey,
    name: input.name,
    patternId: input.patternId ?? 'PAT-PRG-CC-AI-001',
    patternVersion: '1.0.0',
    currentPhase: 3,
    phases: Array.from({ length: 7 }, (_, phaseId) => ({
      phaseId,
      phaseLabel: `P${phaseId}`,
      status: phaseId < 3 ? 'done' : phaseId === 3 ? 'current' : phaseId === 4 ? 'pending' : 'locked',
      gateStatus: phaseId < 3 ? 'approved' : phaseId === 3 ? 'open' : 'na',
      gateEvidence: phaseId < 3 ? [`${input.id} gate evidence`] : [],
    })),
    deliverables: [
      {
        id: `${input.id.toLowerCase()}-d-1`,
        label: `${input.name} delivery plan`,
        phaseId: 3,
        status: 'in-progress',
        owner: 'Executive Sponsor',
      },
    ],
    evidence: (input.evidence ?? ['Customer experience, operations productivity, and governance evidence.']).map(
      (citation, index) => ({
        id: `${input.id.toLowerCase()}-ev-${index + 1}`,
        citation,
        phaseId: 3,
        uploadedAt: '2026-05-31',
        uploadedBy: 'Program Sponsor',
        kind: 'assessment',
      }),
    ),
    linkedSourceEvents: [],
    linkedPrograms: [],
    sponsor: { id: `${input.clientKey}-sponsor`, name: 'Program Sponsor', title: 'Executive Sponsor' },
    flags: [],
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-05-31',
    estimatedValueUsd: input.estimatedValueUsd ?? 1_000_000,
  };
}
