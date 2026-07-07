import type { ProgramInstance } from '@/lib/programs/program-instance';

export type DependencyKind =
  | 'data_dependency'
  | 'system_dependency'
  | 'sponsor_overlap'
  | 'vendor_overlap'
  | 'gcc_capacity'
  | 'governance_council'
  | 'value_overlap'
  | 'workflow_overlap';

export interface DependencyEdge {
  fromMove: string;
  toMove: string;
  kind: DependencyKind;
  strength: 'soft' | 'hard';
  rationale: string;
  detectedBy: 'substrate' | 'corpus' | 'manual';
}

export interface BuildDependencyGraphInput {
  clientKey: string;
  programs: ReadonlyArray<ProgramInstance>;
}

interface ProgramProfile {
  program: ProgramInstance;
  text: string;
  systems: Set<string>;
  vendors: Set<string>;
  valueDomains: Set<string>;
  workflows: Set<string>;
  needsDataFoundation: boolean;
  providesDataFoundation: boolean;
  needsGovernance: boolean;
}

const SYSTEM_TOKENS = [
  'adobe',
  'aws',
  'azure',
  'cdp',
  'cohere',
  'copilot',
  'epic',
  'genesys',
  'ibm',
  'kronos',
  'microsoft',
  'm365',
  'nuance',
  'oracle',
  'salesforce',
  'sap',
  'segment',
  'servicenow',
  'tableau',
  'ukg',
  'workday',
];

const VENDOR_TOKENS = [
  'adobe',
  'aws',
  'blue yonder',
  'cohere',
  'epic',
  'genesys',
  'ibm',
  'microsoft',
  'nuance',
  'oracle',
  'salesforce',
  'sap',
  'segment',
  'servicenow',
  'ukg',
  'vendor c',
  'workday',
];

const VALUE_DOMAIN_RULES: Array<{ domain: string; terms: string[] }> = [
  { domain: 'customer-experience', terms: ['customer', 'loyalty', 'contact center', 'csat', 'nps', 'personalization'] },
  { domain: 'store-labor', terms: ['store', 'labor', 'associate', 'workforce', 'scheduling', 'overtime'] },
  { domain: 'data-foundation', terms: ['cdp', 'data fabric', 'data layer', 'identity', 'source system', 'data readiness'] },
  { domain: 'clinical-productivity', terms: ['clinical', 'ambient', 'documentation', 'nurse', 'physician', 'prior auth'] },
  { domain: 'risk-and-compliance', terms: ['risk', 'compliance', 'attestation', 'governance', 'regulatory', 'fraud'] },
  { domain: 'engineering-productivity', terms: ['engineering', 'coding', 'developer', 'copilot', 'productivity'] },
  { domain: 'operations-productivity', terms: ['operations', 'productivity', 'automation', 'manual', 'throughput'] },
];

const WORKFLOW_RULES: Array<{ workflow: string; terms: string[] }> = [
  { workflow: 'customer-care', terms: ['contact center', 'customer service', 'handoff', 'csat', 'support'] },
  { workflow: 'identity-activation', terms: ['identity', 'audience', 'activation', 'segment', 'loyalty'] },
  { workflow: 'store-operations', terms: ['store', 'associate', 'labor', 'scheduling', 'workforce'] },
  { workflow: 'clinical-workflow', terms: ['clinical', 'ambient', 'documentation', 'prior auth', 'physician', 'nurse'] },
  { workflow: 'data-engineering', terms: ['data layer', 'source system', 'data readiness', 'pipeline', 'quality'] },
  { workflow: 'engineering-delivery', terms: ['engineering', 'developer', 'code', 'pull request', 'defect'] },
];

export function buildDependencyGraph(input: BuildDependencyGraphInput): DependencyEdge[] {
  const profiles = input.programs.map(buildProgramProfile);
  const edges: DependencyEdge[] = [];

  for (const profile of profiles) {
    for (const linked of profile.program.linkedPrograms) {
      if (!linked.programId || linked.programId === profile.program.id) continue;
      edges.push({
        fromMove: linked.programId,
        toMove: profile.program.id,
        kind: 'system_dependency',
        strength: linked.linkType === 'depends-on' ? 'hard' : 'soft',
        rationale: `${readLabel(profile.program)} records a linked-program dependency on ${linked.programName}: ${linked.description}`,
        detectedBy: 'substrate',
      });
    }
  }

  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      edges.push(...buildPairwiseEdges(profiles[i], profiles[j]));
    }
  }

  return dedupeAndSortEdges(edges);
}

function buildProgramProfile(program: ProgramInstance): ProgramProfile {
  const text = normalizeText([
    program.id,
    program.displayId,
    program.name,
    program.patternId,
    program.sponsor.name,
    program.sponsor.title,
    ...program.deliverables.flatMap((d) => [d.label, d.owner ?? '']),
    ...program.evidence.map((e) => e.citation),
    ...program.flags.map((f) => f.description),
    ...program.linkedSourceEvents.flatMap((e) => [e.sourceEventName, e.description]),
    ...program.linkedPrograms.flatMap((p) => [p.programName, p.description]),
  ]);

  return {
    program,
    text,
    systems: collectTokens(text, SYSTEM_TOKENS),
    vendors: collectTokens(text, VENDOR_TOKENS),
    valueDomains: collectRuleHits(text, VALUE_DOMAIN_RULES),
    workflows: collectRuleHits(text, WORKFLOW_RULES),
    needsDataFoundation: hasAny(text, ['data access', 'data layer', 'source system', 'data readiness', 'data quality', 'evidence backlog']),
    providesDataFoundation: program.patternId === 'PAT-PRG-CDP-001' || program.patternId === 'PAT-PRG-DATA-FAB-001',
    needsGovernance: hasAny(text, [
      'ai governance',
      'attestation',
      'ciso',
      'dlp',
      'governance',
      'privacy',
      'risk',
      'security',
    ]),
  };
}

function buildPairwiseEdges(a: ProgramProfile, b: ProgramProfile): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const aLabel = readLabel(a.program);
  const bLabel = readLabel(b.program);

  if (a.program.sponsor.id === b.program.sponsor.id) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'sponsor_overlap',
      strength: 'hard',
      rationale: `${aLabel} and ${bLabel} both require ${a.program.sponsor.name}'s sponsor bandwidth.`,
      detectedBy: 'substrate',
    });
  } else if (normalizeText([a.program.sponsor.title]) === normalizeText([b.program.sponsor.title])) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'sponsor_overlap',
      strength: 'soft',
      rationale: `${aLabel} and ${bLabel} sit under the same sponsor role (${a.program.sponsor.title}).`,
      detectedBy: 'substrate',
    });
  }

  const sharedVendors = intersection(a.vendors, b.vendors);
  if (sharedVendors.length > 0) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'vendor_overlap',
      strength: sharedVendors.length > 1 ? 'hard' : 'soft',
      rationale: `${aLabel} and ${bLabel} both reference ${formatList(sharedVendors)}, creating vendor-management contention.`,
      detectedBy: 'substrate',
    });
  }

  const sharedSystems = intersection(a.systems, b.systems);
  if (sharedSystems.length > 0) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'system_dependency',
      strength: sharedSystems.length > 1 ? 'hard' : 'soft',
      rationale: `${aLabel} and ${bLabel} touch the same system surface (${formatList(sharedSystems)}). Sequence architecture decisions before parallel delivery.`,
      detectedBy: 'substrate',
    });
  }

  if (a.providesDataFoundation && b.needsDataFoundation) {
    edges.push(dataDependency(a, b));
  }
  if (b.providesDataFoundation && a.needsDataFoundation) {
    edges.push(dataDependency(b, a));
  }

  const sharedDomains = intersection(a.valueDomains, b.valueDomains);
  if (sharedDomains.length > 0) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'value_overlap',
      strength: sharedDomains.length > 1 ? 'hard' : 'soft',
      rationale: `${aLabel} and ${bLabel} both claim the ${formatList(sharedDomains)} value domain; finance should prevent double-counted benefits.`,
      detectedBy: 'corpus',
    });
  }

  const sharedWorkflows = intersection(a.workflows, b.workflows);
  if (sharedWorkflows.length > 0) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'workflow_overlap',
      strength: sharedWorkflows.length > 1 ? 'hard' : 'soft',
      rationale: `${aLabel} and ${bLabel} both change the ${formatList(sharedWorkflows)} workflow. Change sequencing should protect operators from competing rollout asks.`,
      detectedBy: 'corpus',
    });
  }

  if (a.needsGovernance && b.needsGovernance) {
    edges.push({
      fromMove: a.program.id,
      toMove: b.program.id,
      kind: 'governance_council',
      strength: 'soft',
      rationale: `${aLabel} and ${bLabel} both carry governance, risk, security, or attestation work; AI Governance Council capacity should be reserved explicitly.`,
      detectedBy: 'substrate',
    });
  }

  return edges;
}

function dataDependency(provider: ProgramProfile, dependent: ProgramProfile): DependencyEdge {
  return {
    fromMove: provider.program.id,
    toMove: dependent.program.id,
    kind: 'data_dependency',
    strength: 'hard',
    rationale: `${readLabel(dependent.program)} needs data readiness that ${readLabel(provider.program)} is positioned to unblock.`,
    detectedBy: 'substrate',
  };
}

function dedupeAndSortEdges(edges: DependencyEdge[]): DependencyEdge[] {
  const byKey = new Map<string, DependencyEdge>();
  for (const edge of edges) {
    const key = [edge.fromMove, edge.toMove, edge.kind, edge.rationale].join('::');
    if (!byKey.has(key)) byKey.set(key, edge);
  }
  return [...byKey.values()].sort((a, b) => {
    const left = `${a.fromMove}|${a.toMove}|${a.kind}|${a.rationale}`;
    const right = `${b.fromMove}|${b.toMove}|${b.kind}|${b.rationale}`;
    return left.localeCompare(right);
  });
}

function readLabel(program: ProgramInstance): string {
  return program.displayId ? `${program.displayId} (${program.name})` : program.name;
}

function normalizeText(parts: ReadonlyArray<string>): string {
  return parts.filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
}

function collectTokens(text: string, tokens: ReadonlyArray<string>): Set<string> {
  return new Set(tokens.filter((token) => text.includes(token)));
}

function collectRuleHits(
  text: string,
  rules: ReadonlyArray<{ domain?: string; workflow?: string; terms: string[] }>,
): Set<string> {
  const hits = new Set<string>();
  for (const rule of rules) {
    if (rule.terms.some((term) => text.includes(term))) {
      hits.add(rule.domain ?? rule.workflow ?? '');
    }
  }
  hits.delete('');
  return hits;
}

function hasAny(text: string, terms: ReadonlyArray<string>): boolean {
  return terms.some((term) => text.includes(term));
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((item) => right.has(item)).sort((a, b) => a.localeCompare(b));
}

function formatList(items: ReadonlyArray<string>): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
