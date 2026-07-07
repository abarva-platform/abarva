import type { ProgramInstance } from '@/lib/programs/program-instance';

export interface CannibalizationFinding {
  moveA: string;
  moveB: string;
  overlapKpi: string;
  overlapMagnitudeUsd: number;
  recommendation: 'merge' | 'sequence' | 'descope_one' | 'accept_overlap';
  rationale: string;
}

export interface DetectCannibalizationInput {
  clientKey: string;
  programs: ReadonlyArray<ProgramInstance>;
  minimumOverlapScore?: number;
}

interface KpiRule {
  kpi: string;
  terms: string[];
}

interface ProgramValueProfile {
  program: ProgramInstance;
  label: string;
  text: string;
  kpis: Set<string>;
  workflows: Set<string>;
  isFoundationMove: boolean;
}

const KPI_RULES: KpiRule[] = [
  {
    kpi: 'store labor cost',
    terms: ['associate productivity', 'labor cost', 'labor optimization', 'overtime', 'scheduling', 'store labor', 'workforce'],
  },
  {
    kpi: 'customer experience',
    terms: ['contact center', 'csat', 'customer', 'deflection', 'loyalty', 'nps', 'personalization', 'service recovery'],
  },
  {
    kpi: 'data readiness',
    terms: ['cdp', 'data access', 'data fabric', 'data layer', 'data quality', 'data readiness', 'identity', 'source system'],
  },
  {
    kpi: 'engineering productivity',
    terms: ['code', 'coding', 'developer', 'engineering', 'pull request', 'software delivery'],
  },
  {
    kpi: 'operations productivity',
    terms: ['automation', 'manual', 'operations', 'productivity', 'throughput'],
  },
  {
    kpi: 'risk and compliance',
    terms: ['attestation', 'compliance', 'fraud', 'governance', 'privacy', 'regulatory', 'risk', 'security'],
  },
  {
    kpi: 'working capital and margin',
    terms: ['assortment', 'demand', 'forecast', 'gross margin', 'inventory', 'markdown', 'margin', 'supply chain'],
  },
];

const WORKFLOW_RULES: KpiRule[] = [
  { kpi: 'customer-care', terms: ['contact center', 'customer service', 'handoff', 'support'] },
  { kpi: 'identity-activation', terms: ['activation', 'audience', 'identity', 'loyalty'] },
  { kpi: 'store-operations', terms: ['associate', 'labor', 'scheduling', 'store', 'workforce'] },
  { kpi: 'data-engineering', terms: ['data access', 'data layer', 'data quality', 'pipeline', 'source system'] },
  { kpi: 'governance', terms: ['attestation', 'compliance', 'governance', 'privacy', 'risk', 'security'] },
  { kpi: 'planning', terms: ['assortment', 'demand', 'forecast', 'inventory', 'supply chain'] },
];

const DEFAULT_MINIMUM_OVERLAP_SCORE = 0.28;

export function detectCannibalization(input: DetectCannibalizationInput): CannibalizationFinding[] {
  const profiles = input.programs
    .filter((program) => program.tenantSlug === input.clientKey || program.tenantId === input.clientKey)
    .map(buildProgramValueProfile);
  const minimumOverlapScore = input.minimumOverlapScore ?? DEFAULT_MINIMUM_OVERLAP_SCORE;
  const findings: CannibalizationFinding[] = [];

  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const finding = buildFinding(profiles[i], profiles[j], minimumOverlapScore);
      if (finding) findings.push(finding);
    }
  }

  return dedupeAndSort(findings);
}

function buildProgramValueProfile(program: ProgramInstance): ProgramValueProfile {
  const text = normalizeText([
    program.id,
    program.displayId,
    program.name,
    program.patternId,
    program.sponsor.name,
    program.sponsor.title,
    ...program.deliverables.flatMap((deliverable) => [deliverable.label, deliverable.owner ?? '']),
    ...program.evidence.map((item) => item.citation),
    ...program.flags.map((flag) => flag.description),
    ...program.linkedSourceEvents.flatMap((event) => [event.sourceEventName, event.description]),
    ...program.linkedPrograms.flatMap((linked) => [linked.programName, linked.description]),
  ]);

  return {
    program,
    label: readLabel(program),
    text,
    kpis: collectRuleHits(text, KPI_RULES),
    workflows: collectRuleHits(text, WORKFLOW_RULES),
    isFoundationMove: program.patternId === 'PAT-PRG-CDP-001' || program.patternId === 'PAT-PRG-DATA-FAB-001',
  };
}

function buildFinding(
  a: ProgramValueProfile,
  b: ProgramValueProfile,
  minimumOverlapScore: number,
): CannibalizationFinding | null {
  const sharedKpis = intersectionByRuleOrder(a.kpis, b.kpis, KPI_RULES);
  if (sharedKpis.length === 0) return null;

  const sharedWorkflows = intersection(a.workflows, b.workflows);
  const sponsorOverlap = a.program.sponsor.id === b.program.sponsor.id;
  const phaseDistance = Math.abs(a.program.currentPhase - b.program.currentPhase);
  const overlapScore = scoreOverlap(sharedKpis.length, sharedWorkflows.length, sponsorOverlap, phaseDistance);

  if (overlapScore < minimumOverlapScore) return null;

  const strongestKpi = sharedKpis[0];
  const overlapMagnitudeUsd = estimateOverlapMagnitudeUsd(a.program, b.program, overlapScore);
  const recommendation = chooseRecommendation({
    a,
    b,
    overlapMagnitudeUsd,
    phaseDistance,
    sharedWorkflows,
    sponsorOverlap,
  });

  return {
    moveA: a.program.id,
    moveB: b.program.id,
    overlapKpi: strongestKpi,
    overlapMagnitudeUsd,
    recommendation,
    rationale: buildRationale({
      a,
      b,
      overlapKpi: strongestKpi,
      overlapMagnitudeUsd,
      recommendation,
      sharedWorkflows,
      sponsorOverlap,
    }),
  };
}

function scoreOverlap(
  sharedKpiCount: number,
  sharedWorkflowCount: number,
  sponsorOverlap: boolean,
  phaseDistance: number,
): number {
  const kpiScore = Math.min(0.42, sharedKpiCount * 0.18);
  const workflowScore = Math.min(0.3, sharedWorkflowCount * 0.15);
  const sponsorScore = sponsorOverlap ? 0.18 : 0;
  const phaseScore = phaseDistance <= 1 ? 0.1 : phaseDistance <= 2 ? 0.05 : 0;
  return Number((kpiScore + workflowScore + sponsorScore + phaseScore).toFixed(2));
}

function estimateOverlapMagnitudeUsd(a: ProgramInstance, b: ProgramInstance, overlapScore: number): number {
  const aValue = a.estimatedValueUsd ?? 0;
  const bValue = b.estimatedValueUsd ?? 0;
  if (aValue <= 0 || bValue <= 0) return 0;

  const conservativeOverlapRate = Math.min(0.45, Math.max(0.12, overlapScore / 2));
  return Math.round(Math.min(aValue, bValue) * conservativeOverlapRate);
}

function chooseRecommendation(input: {
  a: ProgramValueProfile;
  b: ProgramValueProfile;
  overlapMagnitudeUsd: number;
  phaseDistance: number;
  sharedWorkflows: string[];
  sponsorOverlap: boolean;
}): CannibalizationFinding['recommendation'] {
  if (input.a.isFoundationMove !== input.b.isFoundationMove) return 'sequence';
  if (input.sponsorOverlap && input.sharedWorkflows.length > 0) return 'merge';
  if (input.overlapMagnitudeUsd >= 1_000_000 && input.phaseDistance <= 1) return 'descope_one';
  if (input.sharedWorkflows.length > 0) return 'sequence';
  return 'accept_overlap';
}

function buildRationale(input: {
  a: ProgramValueProfile;
  b: ProgramValueProfile;
  overlapKpi: string;
  overlapMagnitudeUsd: number;
  recommendation: CannibalizationFinding['recommendation'];
  sharedWorkflows: string[];
  sponsorOverlap: boolean;
}): string {
  const workflowText =
    input.sharedWorkflows.length > 0 ? ` and the ${formatList(input.sharedWorkflows)} workflow` : '';
  const sponsorText = input.sponsorOverlap ? ` They also share ${input.a.program.sponsor.name}'s sponsor bandwidth.` : '';
  const magnitudeText =
    input.overlapMagnitudeUsd > 0
      ? ` Estimated double-count exposure is ${formatUsd(input.overlapMagnitudeUsd)} based on the smaller declared value pool and overlap score.`
      : ' No declared value pool exists for one side, so the finding is qualitative until finance sizes it.';

  return `${input.a.label} and ${input.b.label} both claim the ${input.overlapKpi} KPI${workflowText}.${sponsorText}${magnitudeText} Recommendation: ${formatRecommendation(input.recommendation)}.`;
}

function dedupeAndSort(findings: CannibalizationFinding[]): CannibalizationFinding[] {
  const byKey = new Map<string, CannibalizationFinding>();
  for (const finding of findings) {
    const key = [finding.moveA, finding.moveB, finding.overlapKpi].join('::');
    if (!byKey.has(key)) byKey.set(key, finding);
  }
  return [...byKey.values()].sort((a, b) => {
    const left = `${a.moveA}|${a.moveB}|${a.overlapKpi}`;
    const right = `${b.moveA}|${b.moveB}|${b.overlapKpi}`;
    return left.localeCompare(right);
  });
}

function readLabel(program: ProgramInstance): string {
  return program.displayId ? `${program.displayId} (${program.name})` : program.name;
}

function normalizeText(parts: ReadonlyArray<string>): string {
  return parts.filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
}

function collectRuleHits(text: string, rules: ReadonlyArray<KpiRule>): Set<string> {
  return new Set(rules.filter((rule) => rule.terms.some((term) => text.includes(term))).map((rule) => rule.kpi));
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((item) => right.has(item)).sort((a, b) => a.localeCompare(b));
}

function intersectionByRuleOrder(left: Set<string>, right: Set<string>, rules: ReadonlyArray<KpiRule>): string[] {
  return rules.map((rule) => rule.kpi).filter((kpi) => left.has(kpi) && right.has(kpi));
}

function formatList(items: ReadonlyArray<string>): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatRecommendation(recommendation: CannibalizationFinding['recommendation']): string {
  switch (recommendation) {
    case 'merge':
      return 'merge the value case or run one integrated program';
    case 'sequence':
      return 'sequence the Moves so the second value case only claims incremental lift';
    case 'descope_one':
      return 'descope one Move before approval or explicitly reduce its value commitment';
    case 'accept_overlap':
      return 'accept the overlap only if finance records it as a deliberate shared benefit';
  }
}
