import type { ClientKey } from '@/lib/client-config';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { ProgramInstance, ProgramPatternId, ProgramPhaseState } from '@/lib/programs/program-instance';
import { detectCannibalization } from '@/lib/admin/broker/portfolio/cannibalization';
import { buildDependencyGraph } from '@/lib/admin/broker/portfolio/dependency-graph';
import { buildResourcePools } from '@/lib/admin/broker/portfolio/resource-pools';
import { optimizePortfolioSequence } from '@/lib/admin/broker/portfolio/sequence-optimizer';

export interface PortfolioSequenceMoveView {
  id: string;
  name: string;
  phase: string;
  reasoning: string;
}

export interface PortfolioSequenceBlockedMoveView {
  id: string;
  name: string;
  blockedBy: string[];
  recommendedAction: string;
}

export interface PortfolioSequenceQuarterView {
  quarterId: string;
  moves: PortfolioSequenceMoveView[];
  blockedMoves: PortfolioSequenceBlockedMoveView[];
  resourceUtilization: Array<{ id: string; label: string; percent: number; tone: 'ok' | 'watch' | 'tight' }>;
  totalValueLabel: string;
}

export interface PortfolioSequenceOverlapView {
  id: string;
  moveA: string;
  moveB: string;
  overlapKpi: string;
  overlapMagnitudeLabel: string;
  recommendation: string;
  rationale: string;
}

export interface PortfolioSequenceViewModel {
  clientKey: string;
  clientName: string;
  dataBasis: 'program-instance-substrate' | 'signature-planning-fixture' | 'empty';
  disclosure: string;
  scheduledMoves: number;
  blockedMoves: number;
  overlapFindings: number;
  sequenceValueLabel: string;
  quarters: PortfolioSequenceQuarterView[];
  overlaps: PortfolioSequenceOverlapView[];
  alternatives: Array<{ scenario: string; tradeoff: string }>;
}

const CLIENT_TO_PORTFOLIO_KEY: Partial<Record<ClientKey, string>> = {
  apexretail: 'apex-retail',
  meridian: 'meridian',
  skyharbor: 'skyharbor-air',
};

const CLIENT_NAMES: Record<string, string> = {
  apexretail: 'Apex Retail Group',
  meridian: 'Meridian Health System',
  skyharbor: 'SkyHarbor Air',
};

export function buildPortfolioSequenceView(input: {
  clientKey: ClientKey | string | null | undefined;
  clientName?: string | null;
  startQuarterId?: string;
}): PortfolioSequenceViewModel {
  const clientKey = input.clientKey ?? 'unknown';
  const portfolioKey = CLIENT_TO_PORTFOLIO_KEY[clientKey as ClientKey];
  const clientName = input.clientName ?? CLIENT_NAMES[clientKey] ?? 'Active client';

  if (!portfolioKey) {
    return emptyView(clientKey, clientName);
  }

  const programs = programsForPortfolio(portfolioKey);
  if (programs.length === 0) return emptyView(clientKey, clientName);

  const dependencyEdges = buildDependencyGraph({ clientKey: portfolioKey, programs });
  const resourcePools = buildResourcePools({ clientKey: portfolioKey, programs });
  const cannibalizationFindings = detectCannibalization({ clientKey: portfolioKey, programs });
  const sequence = optimizePortfolioSequence({
    clientKey: portfolioKey,
    programs,
    dependencyEdges,
    resourcePools,
    cannibalizationFindings,
    startQuarterId: input.startQuarterId ?? '2026-Q3',
  });
  const programNames = new Map(programs.map((program) => [program.id, program.name]));
  const totalValue = Object.values(sequence.totalValueRealizedByQuarter).at(-1) ?? 0;
  const quarters = sequence.quarters.map((quarter) => ({
    quarterId: quarter.quarterId,
    moves: quarter.moves.map((move) => ({
      id: move.moveId,
      name: programNames.get(move.moveId) ?? move.moveId,
      phase: move.phase,
      reasoning: move.reasoning,
    })),
    blockedMoves: quarter.blockedMoves.map((blocked) => ({
      id: blocked.moveId,
      name: programNames.get(blocked.moveId) ?? blocked.moveId,
      blockedBy: [...new Set(blocked.blockedBy.map((id) => programNames.get(id) ?? readablePoolLabel(id)))],
      recommendedAction: blocked.recommendedAction,
    })),
    resourceUtilization: Object.entries(quarter.resourceUtilization)
      .map(([id, value]) => ({
        id,
        label: readablePoolLabel(id),
        percent: Math.round(value * 100),
        tone: value >= 0.9 ? 'tight' as const : value >= 0.65 ? 'watch' as const : 'ok' as const,
      }))
      .sort((a, b) => b.percent - a.percent || a.label.localeCompare(b.label))
      .slice(0, 4),
    totalValueLabel: formatUsd(sequence.totalValueRealizedByQuarter[quarter.quarterId] ?? 0),
  }));

  const blockedMoves = quarters.reduce((sum, quarter) => sum + quarter.blockedMoves.length, 0);
  const scheduledMoves = quarters.reduce((sum, quarter) => sum + quarter.moves.length, 0);

  return {
    clientKey,
    clientName,
    dataBasis: portfolioKey === 'apex-retail' ? 'program-instance-substrate' : 'signature-planning-fixture',
    disclosure: portfolioKey === 'apex-retail'
      ? 'Sequenced from Apex program-instance substrate and the Wave 4 portfolio broker.'
      : 'Sequenced from signature planning fixtures until this client has loaded program-instance substrate.',
    scheduledMoves,
    blockedMoves,
    overlapFindings: cannibalizationFindings.length,
    sequenceValueLabel: formatUsd(totalValue),
    quarters,
    overlaps: cannibalizationFindings.map((finding) => ({
      id: `${finding.moveA}:${finding.moveB}:${finding.overlapKpi}`,
      moveA: programNames.get(finding.moveA) ?? finding.moveA,
      moveB: programNames.get(finding.moveB) ?? finding.moveB,
      overlapKpi: finding.overlapKpi,
      overlapMagnitudeLabel: formatUsd(finding.overlapMagnitudeUsd),
      recommendation: formatRecommendation(finding.recommendation),
      rationale: finding.rationale
        .replace(finding.moveA, programNames.get(finding.moveA) ?? finding.moveA)
        .replace(finding.moveB, programNames.get(finding.moveB) ?? finding.moveB),
    })),
    alternatives: sequence.alternativeSequences,
  };
}

function emptyView(clientKey: string, clientName: string): PortfolioSequenceViewModel {
  return {
    clientKey,
    clientName,
    dataBasis: 'empty',
    disclosure: 'No portfolio-sequencing substrate is available for this client yet.',
    scheduledMoves: 0,
    blockedMoves: 0,
    overlapFindings: 0,
    sequenceValueLabel: '$0',
    quarters: [],
    overlaps: [],
    alternatives: [],
  };
}

function programsForPortfolio(portfolioKey: string): ProgramInstance[] {
  if (portfolioKey === 'apex-retail') return APEX_RETAIL_PROGRAM_INSTANCES;
  if (portfolioKey === 'meridian') return MERIDIAN_SEQUENCE_PROGRAMS;
  if (portfolioKey === 'skyharbor-air') return SKYHARBOR_SEQUENCE_PROGRAMS;
  return [];
}

function makeProgram(input: {
  id: string;
  clientKey: string;
  name: string;
  sponsor: { id: string; name: string; title: string };
  currentPhase: number;
  patternId: ProgramPatternId;
  estimatedValueUsd: number;
  deliverables: string[];
  evidence: string[];
  flags?: string[];
  linkedPrograms?: ProgramInstance['linkedPrograms'];
}): ProgramInstance {
  return {
    id: input.id,
    displayId: input.id,
    tenantSlug: input.clientKey,
    tenantId: input.clientKey,
    name: input.name,
    patternId: input.patternId,
    patternVersion: '1.0.0',
    currentPhase: input.currentPhase,
    phases: buildPhases(input.currentPhase),
    deliverables: input.deliverables.map((label, index) => ({
      id: `${input.id.toLowerCase()}-d-${index + 1}`,
      label,
      phaseId: input.currentPhase,
      status: index === 0 ? 'in-progress' : 'not-started',
      owner: index === 0 ? input.sponsor.title : undefined,
    })),
    evidence: input.evidence.map((citation, index) => ({
      id: `${input.id.toLowerCase()}-ev-${index + 1}`,
      citation,
      phaseId: input.currentPhase,
      uploadedAt: '2026-05-31',
      uploadedBy: input.sponsor.name,
      kind: 'assessment',
    })),
    linkedSourceEvents: [],
    linkedPrograms: input.linkedPrograms ?? [],
    sponsor: input.sponsor,
    flags: (input.flags ?? []).map((description, index) => ({
      id: `${input.id.toLowerCase()}-flag-${index + 1}`,
      kind: 'risk',
      description,
      raisedBy: 'Tower',
      raisedAt: '2026-05-31',
      status: 'open',
    })),
    createdAt: '2026-01-01',
    lastModifiedAt: '2026-05-31',
    estimatedValueUsd: input.estimatedValueUsd,
  };
}

function buildPhases(currentPhase: number): ProgramPhaseState[] {
  const labels = ['Originate', 'Discovery', 'Synthesis', 'Design', 'Execution Roadmap', 'Approval & Mobilization', 'Tower Handoff'];
  return labels.map((phaseLabel, phaseId) => ({
    phaseId,
    phaseLabel,
    status: phaseId < currentPhase ? 'done' : phaseId === currentPhase ? 'current' : phaseId === currentPhase + 1 ? 'pending' : 'locked',
    gateStatus: phaseId < currentPhase ? 'approved' : phaseId === currentPhase ? 'open' : 'na',
    gateEvidence: phaseId < currentPhase ? [`${phaseLabel} gate cleared`] : [],
  }));
}

const MERIDIAN_SEQUENCE_PROGRAMS: ProgramInstance[] = [
  makeProgram({
    id: 'MER-DATA-SPINE',
    clientKey: 'meridian',
    name: 'Clinical Data Spine Remediation',
    sponsor: { id: 'mer-cdio', name: 'Anita Krishnamurthy', title: 'Chief Digital and Information Officer' },
    currentPhase: 3,
    patternId: 'PAT-PRG-DATA-FAB-001',
    estimatedValueUsd: 3_200_000,
    deliverables: ['Epic source-system remediation plan', 'Azure pipeline architecture', 'Data quality control test'],
    evidence: ['Epic source system data quality remediation and Azure pipeline foundation.'],
    flags: ['Clinical data quality must clear before ambient documentation value is counted.'],
  }),
  makeProgram({
    id: 'MER-AMBIENT-DOCS',
    clientKey: 'meridian',
    name: 'Ambient Clinical Documentation',
    sponsor: { id: 'mer-cmio', name: 'Rohan Mehta', title: 'Chief Medical Information Officer' },
    currentPhase: 2,
    patternId: 'PAT-PRG-COPILOT-001',
    estimatedValueUsd: 8_600_000,
    deliverables: ['Physician workflow pilot plan', 'AI governance attestation', 'Clinical documentation quality baseline'],
    evidence: ['Ambient documentation depends on Epic data quality, clinical workflow adoption, and governance attestation.'],
    flags: ['Physician adoption and governance attestation remain the next gate risks.'],
    linkedPrograms: [{
      programId: 'MER-DATA-SPINE',
      programName: 'Clinical Data Spine Remediation',
      linkType: 'depends-on',
      description: 'Ambient documentation requires reliable clinical data feeds before scale.',
    }],
  }),
  makeProgram({
    id: 'MER-PRIOR-AUTH',
    clientKey: 'meridian',
    name: 'Prior Authorization Recovery',
    sponsor: { id: 'mer-rev-cycle', name: 'Patricia Okafor', title: 'Revenue Cycle Executive' },
    currentPhase: 1,
    patternId: 'PAT-PRG-CC-AI-001',
    estimatedValueUsd: 5_100_000,
    deliverables: ['Denials workflow map', 'Payer exception baseline', 'Operations productivity model'],
    evidence: ['Prior authorization throughput and denial reduction share data-readiness needs with the clinical data spine.'],
  }),
  makeProgram({
    id: 'MER-GOVERNANCE-HUB',
    clientKey: 'meridian',
    name: 'AI Governance Attestation Hub',
    sponsor: { id: 'mer-cdao', name: 'Priya Raman', title: 'Chief Data and Analytics Officer' },
    currentPhase: 2,
    patternId: 'PAT-PRG-CC-AI-001',
    estimatedValueUsd: 1_900_000,
    deliverables: ['AI governance intake', 'Risk attestation workflow', 'Clinical review evidence register'],
    evidence: ['AI governance, privacy, risk, and clinical attestation workflow for high-stakes AI programs.'],
  }),
];

const SKYHARBOR_SEQUENCE_PROGRAMS: ProgramInstance[] = [
  makeProgram({
    id: 'SKY-MAINFRAME-EXTRACT',
    clientKey: 'skyharbor-air',
    name: 'Mainframe Schedule Extraction',
    sponsor: { id: 'sky-cio', name: 'Elena Morales', title: 'Chief Information Officer' },
    currentPhase: 3,
    patternId: 'PAT-PRG-DATA-FAB-001',
    estimatedValueUsd: 4_700_000,
    deliverables: ['Crew and schedule source-system extract', 'Operational data quality plan', 'API integration architecture'],
    evidence: ['Mainframe extraction provides the schedule data foundation for crew recovery and irregular operations AI.'],
  }),
  makeProgram({
    id: 'SKY-CREW-RECOVERY',
    clientKey: 'skyharbor-air',
    name: 'Crew Recovery AI',
    sponsor: { id: 'sky-coo', name: 'Marissa Kwan', title: 'Chief Operating Officer' },
    currentPhase: 2,
    patternId: 'PAT-PRG-CC-AI-001',
    estimatedValueUsd: 7_400_000,
    deliverables: ['Crew recovery workflow design', 'Union review plan', 'Operations control rollout model'],
    evidence: ['Crew recovery depends on schedule data, operations workflow change, and AI governance controls.'],
    flags: ['Operations sponsor bandwidth is shared with irregular-operations recovery.'],
    linkedPrograms: [{
      programId: 'SKY-MAINFRAME-EXTRACT',
      programName: 'Mainframe Schedule Extraction',
      linkType: 'depends-on',
      description: 'Crew recovery needs the source-system schedule extract before scale.',
    }],
  }),
  makeProgram({
    id: 'SKY-IROPS',
    clientKey: 'skyharbor-air',
    name: 'Irregular Operations Recovery AI',
    sponsor: { id: 'sky-coo', name: 'Marissa Kwan', title: 'Chief Operating Officer' },
    currentPhase: 2,
    patternId: 'PAT-PRG-CC-AI-001',
    estimatedValueUsd: 9_200_000,
    deliverables: ['IROP decision workflow', 'Passenger recovery impact model', 'Operations control training'],
    evidence: ['Irregular operations recovery shares operations workflows, crew schedule data, and sponsor capacity with crew recovery.'],
    flags: ['Operations sponsor bandwidth and control-room adoption are constrained.'],
    linkedPrograms: [{
      programId: 'SKY-MAINFRAME-EXTRACT',
      programName: 'Mainframe Schedule Extraction',
      linkType: 'depends-on',
      description: 'IROP recovery needs the source-system schedule extract before scale.',
    }],
  }),
  makeProgram({
    id: 'SKY-CUSTOMER-REBOOK',
    clientKey: 'skyharbor-air',
    name: 'Customer Rebooking Copilot',
    sponsor: { id: 'sky-cx', name: 'Daniel Brooks', title: 'Chief Customer Officer' },
    currentPhase: 1,
    patternId: 'PAT-PRG-COPILOT-001',
    estimatedValueUsd: 3_600_000,
    deliverables: ['Customer-care workflow map', 'Rebooking policy guardrails', 'Contact-center adoption pilot'],
    evidence: ['Customer rebooking copilot affects customer-care workflows during irregular operations events.'],
  }),
];

function readablePoolLabel(id: string): string {
  return id
    .replace(/^gcc:/, 'GCC ')
    .replace(/^sponsor:/, 'Sponsor ')
    .replace(/^vendor:/, 'Vendor ')
    .replace(/^governance:/, 'Governance ')
    .replace(/[-:]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRecommendation(recommendation: string): string {
  return recommendation.replace(/_/g, ' ');
}

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}
