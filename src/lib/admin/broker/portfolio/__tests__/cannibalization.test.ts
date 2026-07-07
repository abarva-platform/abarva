import type { ProgramInstance, ProgramPatternId } from '@/lib/programs/program-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { detectCannibalization, type CannibalizationFinding } from '../cannibalization';

describe('detectCannibalization', () => {
  it('surfaces customer-value overlap in the Apex Retail program substrate', () => {
    const findings = detectCannibalization({
      clientKey: 'apex-retail',
      programs: APEX_RETAIL_PROGRAM_INSTANCES,
    });

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((finding) => finding.overlapKpi === 'customer experience')).toBe(true);
    expectEveryFindingIsDecisionGrade(findings);
  });

  it('identifies the labor-cost double-count case the portfolio wave is meant to catch', () => {
    const findings = detectCannibalization({
      clientKey: 'apex-retail',
      programs: [
        makeProgram({
          id: 'APX-STORE-LABOR-AI',
          name: 'Store Labor Optimization AI',
          evidence: [
            'Value case claims labor cost reduction through AI scheduling recommendations for stores and associates.',
            'Workflow touches workforce scheduling, overtime, and store manager labor planning.',
          ],
          estimatedValueUsd: 4_800_000,
          sponsor: ['apx-sponsor-store', 'Nkechi Okafor', 'VP Store Operations'],
        }),
        makeProgram({
          id: 'APX-KRONOS-SUNSET',
          name: 'Workforce Scheduling AI Kronos Sunset',
          evidence: [
            'Value case claims labor cost reduction by retiring legacy Kronos scheduling and improving workforce planning.',
            'Workflow touches workforce scheduling, overtime, and associate shift coverage.',
          ],
          estimatedValueUsd: 3_200_000,
          sponsor: ['apx-sponsor-store', 'Nkechi Okafor', 'VP Store Operations'],
        }),
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      moveA: 'APX-STORE-LABOR-AI',
      moveB: 'APX-KRONOS-SUNSET',
      overlapKpi: 'store labor cost',
      recommendation: 'merge',
    });
    expect(findings[0].overlapMagnitudeUsd).toBeGreaterThan(0);
    expect(findings[0].rationale).toContain('double-count exposure');
  });

  it('sequences data-foundation overlap instead of treating foundation value as duplicate run-rate', () => {
    const findings = detectCannibalization({
      clientKey: 'meridian',
      programs: [
        makeProgram({
          id: 'MER-DATA-SPINE',
          clientKey: 'meridian',
          name: 'Clinical Data Spine Remediation',
          patternId: 'PAT-PRG-DATA-FAB-001',
          evidence: ['Data readiness and Epic source system quality unblock downstream AI programs.'],
          estimatedValueUsd: 2_400_000,
        }),
        makeProgram({
          id: 'MER-AMBIENT-DOCS',
          clientKey: 'meridian',
          name: 'Ambient Clinical Documentation',
          patternId: 'PAT-PRG-CC-AI-001',
          evidence: ['Ambient documentation depends on Epic data quality and claims data readiness.'],
          estimatedValueUsd: 3_600_000,
        }),
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      moveA: 'MER-DATA-SPINE',
      moveB: 'MER-AMBIENT-DOCS',
      overlapKpi: 'data readiness',
      recommendation: 'sequence',
    });
  });

  it('is tenant-scoped and deterministic', () => {
    const apexProgram = makeProgram({
      id: 'APX-CCAI',
      clientKey: 'apex-retail',
      name: 'Apex Contact Center AI',
      evidence: ['Customer experience and CSAT value claim in contact center workflow.'],
      estimatedValueUsd: 2_000_000,
    });
    const meridianProgram = makeProgram({
      id: 'MER-CCAI',
      clientKey: 'meridian',
      name: 'Meridian Contact Center AI',
      evidence: ['Customer experience and CSAT value claim in contact center workflow.'],
      estimatedValueUsd: 2_000_000,
    });

    const input = { clientKey: 'apex-retail', programs: [apexProgram, meridianProgram] };

    expect(detectCannibalization(input)).toEqual([]);
    expect(detectCannibalization(input)).toEqual(detectCannibalization(input));
  });
});

function expectEveryFindingIsDecisionGrade(findings: CannibalizationFinding[]): void {
  for (const finding of findings) {
    expect(finding.moveA).toBeTruthy();
    expect(finding.moveB).toBeTruthy();
    expect(finding.moveA).not.toBe(finding.moveB);
    expect(finding.overlapKpi).toBeTruthy();
    expect(finding.overlapMagnitudeUsd).toBeGreaterThanOrEqual(0);
    expect(['merge', 'sequence', 'descope_one', 'accept_overlap']).toContain(finding.recommendation);
    expect(finding.rationale.length).toBeGreaterThan(80);
    expect(finding.rationale).not.toMatch(/signal:[0-9a-f-]{8,}/i);
  }
}

function makeProgram(input: {
  id: string;
  name: string;
  evidence: string[];
  clientKey?: string;
  estimatedValueUsd?: number;
  patternId?: ProgramPatternId;
  sponsor?: [id: string, name: string, title: string];
}): ProgramInstance {
  const clientKey = input.clientKey ?? 'apex-retail';
  const sponsor = input.sponsor ?? [`${clientKey}-sponsor`, 'Program Sponsor', 'Executive Sponsor'];

  return {
    id: input.id,
    displayId: input.id,
    tenantSlug: clientKey,
    tenantId: clientKey,
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
        id: `${input.id.toLowerCase()}-value-case`,
        label: `${input.name} value case`,
        phaseId: 3,
        status: 'in-progress',
        owner: sponsor[2],
      },
    ],
    evidence: input.evidence.map((citation, index) => ({
      id: `${input.id.toLowerCase()}-ev-${index + 1}`,
      citation,
      phaseId: 3,
      uploadedAt: '2026-05-31',
      uploadedBy: sponsor[1],
      kind: 'assessment',
    })),
    linkedSourceEvents: [],
    linkedPrograms: [],
    sponsor: { id: sponsor[0], name: sponsor[1], title: sponsor[2] },
    flags: [],
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-05-31',
    estimatedValueUsd: input.estimatedValueUsd,
  };
}
