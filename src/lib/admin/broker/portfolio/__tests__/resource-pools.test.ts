import type { ProgramInstance, ProgramPatternId } from '@/lib/programs/program-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildResourcePools, type ResourcePool } from '../resource-pools';

describe('buildResourcePools', () => {
  it('builds sponsor, vendor, GCC, and governance pools for Apex Retail', () => {
    const pools = buildResourcePools({
      clientKey: 'apex-retail',
      programs: APEX_RETAIL_PROGRAM_INSTANCES,
    });

    expect(pools.some((pool) => pool.kind === 'sponsor')).toBe(true);
    expect(pools.some((pool) => pool.kind === 'vendor')).toBe(true);
    expect(pools.some((pool) => pool.kind === 'gcc')).toBe(true);
    expect(pools.some((pool) => pool.kind === 'governance')).toBe(true);
    expectEveryPoolIsDecisionGrade(pools);
  });

  it.each([
    ['meridian', buildMeridianPortfolio()],
    ['skyharbor-air', buildSkyHarborPortfolio()],
  ])('models %s resource commitments without Apex defaults', (clientKey, programs) => {
    const pools = buildResourcePools({ clientKey, programs });
    const sponsorMoveCount = uniqueMoveCount(pools.filter((pool) => pool.kind === 'sponsor'));

    expect(sponsorMoveCount).toBe(programs.filter((program) => program.currentPhase < 6).length);
    expect(pools.every((pool) => Object.keys(pool.committedByMoveId).every((id) => !id.startsWith('APX-')))).toBe(true);
    expectEveryPoolIsDecisionGrade(pools);
  });

  it('honors capacity overrides and never returns negative availability', () => {
    const pools = buildResourcePools({
      clientKey: 'meridian',
      programs: buildMeridianPortfolio(),
      capacityOverrides: { 'governance:ai-council': 1 },
    });
    const governance = pools.find((pool) => pool.id === 'governance:ai-council');

    expect(governance).toBeDefined();
    expect(governance?.capacityPerQuarter).toBe(1);
    expect(governance?.availableForNewWork).toBe(0);
  });

  it('keeps output deterministic and sorted', () => {
    const input = { clientKey: 'skyharbor-air', programs: buildSkyHarborPortfolio() };

    expect(buildResourcePools(input)).toEqual(buildResourcePools(input));
    expect(buildResourcePools(input).map((pool) => pool.id)).toEqual(
      [...buildResourcePools(input).map((pool) => pool.id)].sort((a, b) => a.localeCompare(b)),
    );
  });
});

function expectEveryPoolIsDecisionGrade(pools: ResourcePool[]): void {
  expect(pools.length).toBeGreaterThan(0);
  for (const pool of pools) {
    expect(pool.id).toMatch(/^[a-z]+:[a-z0-9-]+$/);
    expect(pool.capacityPerQuarter).toBeGreaterThan(0);
    expect(pool.availableForNewWork).toBeGreaterThanOrEqual(0);
    expect(Object.keys(pool.committedByMoveId).length).toBeGreaterThan(0);
  }
}

function uniqueMoveCount(pools: ResourcePool[]): number {
  return new Set(pools.flatMap((pool) => Object.keys(pool.committedByMoveId))).size;
}

function buildMeridianPortfolio(): ProgramInstance[] {
  return [
    makeProgram({
      id: 'MER-AMBIENT-2026',
      clientKey: 'meridian',
      name: 'Ambient Clinical Documentation',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['mer-sponsor-clinical', 'Dr. Anita Rao', 'Chief Digital and Information Officer'],
      evidence: ['Nuance DAX in Epic clinical workflow needs privacy governance and physician adoption sequencing.'],
      deliverables: ['Epic workflow design', 'Clinical privacy attestation', 'Physician adoption plan'],
    }),
    makeProgram({
      id: 'MER-PRIOR-AUTH-2026',
      clientKey: 'meridian',
      name: 'Prior Authorization Automation',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['mer-sponsor-rcm', 'Patricia Okafor', 'Chief Operating Officer'],
      evidence: ['Cohere Health prior auth depends on Epic payer data quality and CMS compliance attestation.'],
      deliverables: ['Epic payer integration', 'CMS compliance gate', 'Revenue-cycle operating model'],
    }),
    makeProgram({
      id: 'MER-DATA-SPINE-2026',
      clientKey: 'meridian',
      name: 'Clinical Data Spine Remediation',
      patternId: 'PAT-PRG-DATA-FAB-001',
      sponsor: ['mer-sponsor-clinical', 'Dr. Anita Rao', 'Chief Digital and Information Officer'],
      evidence: ['Azure data pipeline and Epic source system data quality remediation unblock AI scaling.'],
      deliverables: ['Data quality remediation plan', 'Epic source system mapping', 'Azure pipeline hardening'],
    }),
    makeProgram({
      id: 'MER-WORKDAY-2026',
      clientKey: 'meridian',
      name: 'Workday Finance and Workforce AI',
      patternId: 'PAT-PRG-COPILOT-001',
      sponsor: ['mer-sponsor-cfo', 'David Kim', 'Chief Financial Officer'],
      evidence: ['Workday finance automation needs governance approval and workforce change management.'],
      deliverables: ['Workday operating model', 'Finance governance approval', 'Workforce change plan'],
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
      evidence: ['IBM mainframe extraction and AWS data foundation require data quality remediation.'],
      deliverables: ['IBM extraction plan', 'AWS data pipeline', 'Data quality remediation'],
    }),
    makeProgram({
      id: 'SKY-CREW-2026',
      clientKey: 'skyharbor-air',
      name: 'Crew Scheduling Optimization',
      patternId: 'PAT-PRG-AI-CODING-001',
      sponsor: ['sky-sponsor-ops', 'Nadia Rahman', 'Chief Operating Officer'],
      evidence: ['Crew scheduling AI requires operations governance and workforce change management.'],
      deliverables: ['Crew rules model', 'Operations governance approval', 'Workforce change plan'],
    }),
    makeProgram({
      id: 'SKY-DISRUPTION-2026',
      clientKey: 'skyharbor-air',
      name: 'Irregular Operations Recovery AI',
      patternId: 'PAT-PRG-CC-AI-001',
      sponsor: ['sky-sponsor-ops', 'Nadia Rahman', 'Chief Operating Officer'],
      evidence: ['AWS operations control center workflow supports disruption recovery automation.'],
      deliverables: ['Operations control workflow', 'AWS inference path', 'Customer communications playbook'],
    }),
    makeProgram({
      id: 'SKY-COPILOT-2026',
      clientKey: 'skyharbor-air',
      name: 'M365 Copilot for Airport Operations',
      patternId: 'PAT-PRG-COPILOT-001',
      sponsor: ['sky-sponsor-cio', 'Elena Moretti', 'Chief Information Officer'],
      evidence: ['Microsoft M365 Copilot rollout touches operations productivity, security, and DLP.'],
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
