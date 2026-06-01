import type { ProgramInstance, ProgramPatternId } from '@/lib/programs/program-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  buildDependencyGraph,
  type BuildDependencyGraphInput,
  type DependencyEdge,
} from '../dependency-graph';

describe('buildDependencyGraph', () => {
  it('emits dependency edges for the Apex Retail substrate', () => {
    const edges = buildDependencyGraph({
      clientKey: 'apex-retail',
      programs: APEX_RETAIL_PROGRAM_INSTANCES,
    });

    expect(edges.length).toBeGreaterThanOrEqual(5);
    expect(edges.some((edge) => edge.kind === 'data_dependency')).toBe(true);
    expect(edges.some((edge) => edge.kind === 'value_overlap')).toBe(true);
    expect(edges.some((edge) => edge.kind === 'governance_council')).toBe(true);
    expectEveryEdgeIsDecisionGrade(edges);
  });

  it.each([
    ['meridian', buildMeridianPortfolio()],
    ['skyharbor-air', buildSkyHarborPortfolio()],
  ])('emits at least five edges for %s without relying on Apex defaults', (clientKey, programs) => {
    const input: BuildDependencyGraphInput = { clientKey, programs };
    const edges = buildDependencyGraph(input);

    expect(edges.length).toBeGreaterThanOrEqual(5);
    expect(edges.every((edge) => !edge.fromMove.startsWith('APX-'))).toBe(true);
    expect(edges.every((edge) => !edge.toMove.startsWith('APX-'))).toBe(true);
    expectEveryEdgeIsDecisionGrade(edges);
  });

  it('keeps output deterministic and sorted', () => {
    const input = { clientKey: 'meridian', programs: buildMeridianPortfolio() };

    expect(buildDependencyGraph(input)).toEqual(buildDependencyGraph(input));
    expect(buildDependencyGraph(input).map(edgeKey)).toEqual(
      [...buildDependencyGraph(input).map(edgeKey)].sort((a, b) => a.localeCompare(b)),
    );
  });
});

function expectEveryEdgeIsDecisionGrade(edges: DependencyEdge[]): void {
  for (const edge of edges) {
    expect(edge.fromMove).toBeTruthy();
    expect(edge.toMove).toBeTruthy();
    expect(edge.fromMove).not.toBe(edge.toMove);
    expect(edge.rationale.length).toBeGreaterThan(40);
    expect(['soft', 'hard']).toContain(edge.strength);
    expect(['substrate', 'corpus', 'manual']).toContain(edge.detectedBy);
  }
}

function edgeKey(edge: DependencyEdge): string {
  return `${edge.fromMove}|${edge.toMove}|${edge.kind}|${edge.rationale}`;
}

function buildMeridianPortfolio(): ProgramInstance[] {
  return [
    makeProgram({
      id: 'MER-AMBIENT-2026',
      clientKey: 'meridian',
      name: 'Ambient Clinical Documentation',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['mer-sponsor-clinical', 'Dr. Anita Rao', 'Chief Digital and Information Officer'],
      evidence: [
        'Nuance DAX pilot in Epic clinical workflow reduces documentation time but requires privacy attestation and physician adoption sequencing.',
        'Clinical governance council requested ambient note quality review before scaling beyond primary care.',
      ],
      deliverables: ['Epic workflow design', 'Clinical privacy attestation', 'Physician adoption plan'],
    }),
    makeProgram({
      id: 'MER-PRIOR-AUTH-2026',
      clientKey: 'meridian',
      name: 'Prior Authorization Automation',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['mer-sponsor-rcm', 'Patricia Okafor', 'Chief Operating Officer'],
      evidence: [
        'Cohere Health prior auth workflow depends on Epic payer data quality and CMS compliance attestation.',
        'Manual prior authorization backlog overlaps with clinical workflow redesign and revenue-cycle operations.',
      ],
      deliverables: ['Epic payer integration', 'CMS compliance gate', 'Revenue-cycle operating model'],
    }),
    makeProgram({
      id: 'MER-DATA-SPINE-2026',
      clientKey: 'meridian',
      name: 'Clinical Data Spine Remediation',
      patternId: 'PAT-PRG-DATA-FAB-001',
      sponsor: ['mer-sponsor-clinical', 'Dr. Anita Rao', 'Chief Digital and Information Officer'],
      evidence: [
        'Data readiness for Epic, claims, and quality-measure source systems is below the threshold for AI scaling.',
        'Azure data quality remediation is the foundation for ambient documentation and prior authorization automation.',
      ],
      deliverables: ['Data quality remediation plan', 'Epic source system mapping', 'Azure pipeline hardening'],
    }),
    makeProgram({
      id: 'MER-WORKDAY-2026',
      clientKey: 'meridian',
      name: 'Workday Finance and Workforce AI',
      patternId: 'PAT-PRG-COPILOT-001',
      sponsor: ['mer-sponsor-cfo', 'David Kim', 'Chief Financial Officer'],
      evidence: [
        'Workday workforce and finance automation needs governance approval because clinical staffing, overtime, and cost reporting feed board metrics.',
      ],
      deliverables: ['Workday operating model', 'Finance governance approval', 'Workforce change plan'],
    }),
    makeProgram({
      id: 'MER-QUALITY-CAPTURE-2026',
      clientKey: 'meridian',
      name: 'Quality Measure Capture AI',
      patternId: 'PAT-PRG-LOYALTY-001',
      sponsor: ['mer-sponsor-rcm', 'Patricia Okafor', 'Chief Operating Officer'],
      evidence: [
        'Quality capture depends on clinical documentation, Epic data quality, and governance attestation before performance-year lock.',
      ],
      deliverables: ['Quality workflow redesign', 'Epic measure mapping', 'Governance attestation'],
    }),
  ];
}

function buildSkyHarborPortfolio(): ProgramInstance[] {
  return [
    makeProgram({
      id: 'SKY-MAINFRAME-2026',
      clientKey: 'skyharbor-air',
      name: 'Mainframe Revenue Accounting Extraction',
      patternId: 'PAT-PRG-DATA-FAB-001',
      sponsor: ['sky-sponsor-cio', 'Elena Moretti', 'Chief Information Officer'],
      evidence: [
        'IBM mainframe extraction and AWS data foundation unblock revenue accounting, disruption analytics, and operations dashboards.',
        'Data quality remediation is required before downstream AI workloads can use passenger and flight operations records.',
      ],
      deliverables: ['IBM extraction plan', 'AWS data pipeline', 'Data quality remediation'],
    }),
    makeProgram({
      id: 'SKY-CREW-2026',
      clientKey: 'skyharbor-air',
      name: 'Crew Scheduling Optimization',
      patternId: 'PAT-PRG-AI-CODING-001',
      sponsor: ['sky-sponsor-ops', 'Nadia Rahman', 'Chief Operating Officer'],
      evidence: [
        'Crew scheduling AI depends on clean flight operations data, labor rules, and governance approval before dispatch use.',
        'Workforce scheduling changes overlap with operations productivity and union-sensitive change management.',
      ],
      deliverables: ['Crew rules model', 'Operations governance approval', 'Workforce change plan'],
    }),
    makeProgram({
      id: 'SKY-DISRUPTION-2026',
      clientKey: 'skyharbor-air',
      name: 'Irregular Operations Recovery AI',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['sky-sponsor-ops', 'Nadia Rahman', 'Chief Operating Officer'],
      evidence: [
        'Irregular operations recovery uses AWS data, customer service workflows, and operations control center decisions during disruptions.',
      ],
      deliverables: ['Operations control workflow', 'AWS inference path', 'Customer communications playbook'],
    }),
    makeProgram({
      id: 'SKY-CUSTOMER-2026',
      clientKey: 'skyharbor-air',
      name: 'Customer Reaccommodation Assistant',
      patternId: 'PAT-PRG-LOYALTY-001',
      sponsor: ['sky-sponsor-commercial', 'Miles Chen', 'Chief Commercial Officer'],
      evidence: [
        'Customer reaccommodation assistant shares disruption data and customer-service workflow with irregular operations recovery.',
        'Governance review required for passenger communications and service recovery policy advice.',
      ],
      deliverables: ['Customer service handoff', 'Passenger communications governance', 'Service recovery dashboard'],
    }),
    makeProgram({
      id: 'SKY-COPILOT-2026',
      clientKey: 'skyharbor-air',
      name: 'M365 Copilot for Airport Operations',
      patternId: 'PAT-PRG-COPILOT-001',
      sponsor: ['sky-sponsor-cio', 'Elena Moretti', 'Chief Information Officer'],
      evidence: [
        'Microsoft M365 Copilot rollout touches operations productivity, security, DLP, and airport-station knowledge management.',
      ],
      deliverables: ['DLP readiness review', 'Operations productivity baseline', 'Station knowledge workflow'],
    }),
  ];
}

function makeProgram(input: {
  id: string;
  clientKey: string;
  name: string;
  patternId: ProgramPatternId;
  sponsor: [id: string, name: string, title: string];
  evidence: string[];
  deliverables: string[];
}): ProgramInstance {
  return {
    id: input.id,
    displayId: input.id,
    tenantSlug: input.clientKey,
    tenantId: input.clientKey,
    name: input.name,
    patternId: input.patternId,
    patternVersion: '1.0.0',
    currentPhase: 3,
    phases: Array.from({ length: 7 }, (_, phaseId) => ({
      phaseId,
      phaseLabel: `P${phaseId}`,
      status: phaseId < 3 ? 'done' : phaseId === 3 ? 'current' : phaseId === 4 ? 'pending' : 'locked',
      gateStatus: phaseId < 3 ? 'approved' : phaseId === 3 ? 'open' : 'na',
      gateEvidence: phaseId < 3 ? [`${input.id} gate evidence`] : [],
    })),
    deliverables: input.deliverables.map((label, index) => ({
      id: `${input.id.toLowerCase()}-d-${index + 1}`,
      label,
      phaseId: 3,
      status: index === 0 ? 'complete' : 'in-progress',
      owner: input.sponsor[2],
    })),
    evidence: input.evidence.map((citation, index) => ({
      id: `${input.id.toLowerCase()}-ev-${index + 1}`,
      citation,
      phaseId: 3,
      uploadedAt: '2026-05-31',
      uploadedBy: input.sponsor[1],
      kind: 'assessment',
    })),
    linkedSourceEvents: [],
    linkedPrograms: [],
    sponsor: { id: input.sponsor[0], name: input.sponsor[1], title: input.sponsor[2] },
    flags: [],
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-05-31',
    estimatedValueUsd: 1_000_000,
  };
}
