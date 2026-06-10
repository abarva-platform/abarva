import type { AskIntent } from '@/lib/intelligence/ask/types';
import type { SegmentId } from '@/lib/knowledge/tenant-data';

export type QuestionCategory =
  | 'MODERNIZATION_PROGRESS'
  | 'IBM_DEPENDENCY'
  | 'VALUE_LEDGER'
  | 'OPERATING_MODEL'
  | 'EXECUTIVE_ALIGNMENT'
  | 'ORG_LEADERSHIP'
  | 'BUDGET_AUTHORITY'
  | 'APPLICATION_PORTFOLIO'
  | 'TECH_DEBT'
  | 'DATA_PLATFORM'
  | 'CYBER_SECURITY'
  | 'AI_TOOLING'
  | 'VENDOR_CONTRACTS'
  | 'SOURCING_PIPELINE'
  | 'PROGRAM_PORTFOLIO'
  | 'INITIATIVE_FINANCIALS'
  | 'KPI_PERFORMANCE'
  | 'EVIDENCE_PROVENANCE'
  | 'CROSS_PROGRAM_RISK'
  | 'REGULATORY_CONTEXT'
  | 'INDUSTRY_BENCHMARK'
  | 'PATTERN_FAILURE_MODE'
  | 'VENDOR_LANDSCAPE'
  | 'CURRENT_STATE_SYNTHESIS'
  | 'GENERAL_STRATEGY';

export type CoverageStatus = 'full' | 'partial' | 'missing';

export interface QuestionCategorySpec {
  label: string;
  keywords: readonly string[];
  requiredSegments: readonly SegmentId[];
  optionalSegments: readonly SegmentId[];
  minSources: number;
  intents?: readonly AskIntent[];
}

export interface CoverageSourceLike {
  type?: string | null;
  name?: string | null;
  id?: string | null;
  detail?: string | null;
}

export interface CoverageReport {
  category: QuestionCategory;
  status: CoverageStatus;
  requiredSegments: SegmentId[];
  presentSegments: SegmentId[];
  missingSegments: SegmentId[];
  optionalSegments: SegmentId[];
  sourceCount: number;
  minSources: number;
}

export type IndustryOverlayKey = 'retail';

export interface IndustryOverlayCoverageContract {
  overlayNamespace: string;
  requiredPacks: readonly string[];
}

export const QUESTION_CATEGORIES: Record<QuestionCategory, QuestionCategorySpec> = {
  MODERNIZATION_PROGRESS: {
    label: 'Modernization progress and defensible narrative',
    keywords: ['progress', 'defensible', 'narrative', 'journey', 'modernization', 'five years', '5 years'],
    requiredSegments: ['enterprise_profile', 'program_inventory', 'evidence_ledger'],
    optionalSegments: ['initiative_financials', 'cross_program_signals'],
    minSources: 3,
  },
  IBM_DEPENDENCY: {
    label: 'IBM dependency and mainframe leverage',
    keywords: ['ibm', 'mainframe', 'z workload', 'mips', 'dependency', 'restructure', 'leverage'],
    requiredSegments: ['it_landscape', 'vendor_contracts', 'program_inventory'],
    optionalSegments: ['it_financials', 'evidence_ledger'],
    minSources: 3,
  },
  VALUE_LEDGER: {
    label: 'Value ledger and realized benefits',
    keywords: ['value', 'benefit', 'realized', 'promised', 'disputed', 'business case', 'roi'],
    requiredSegments: ['it_financials', 'kpi_dictionary', 'evidence_ledger'],
    optionalSegments: ['initiative_financials', 'program_inventory'],
    minSources: 3,
  },
  OPERATING_MODEL: {
    label: 'Operating model and target-state delivery',
    keywords: ['operating model', 'tom', 'governance', 'delivery model', 'global capability', 'gcc'],
    requiredSegments: ['enterprise_profile', 'org_structure', 'cross_program_signals'],
    optionalSegments: ['program_inventory', 'workflow_inventory'],
    minSources: 3,
  },
  EXECUTIVE_ALIGNMENT: {
    label: 'Executive alignment and sponsor tension',
    keywords: ['alignment', 'sponsor', 'stakeholder', 'cfo', 'cmo', 'cio', 'tension', 'contradiction'],
    requiredSegments: ['org_structure', 'program_inventory', 'cross_program_signals'],
    optionalSegments: ['evidence_ledger', 'enterprise_profile'],
    minSources: 3,
  },
  ORG_LEADERSHIP: {
    label: 'Org leadership and reporting structure',
    keywords: ['who reports', 'direct reports', 'leadership', 'org structure', 'c-level', 'executive bench'],
    requiredSegments: ['org_structure', 'enterprise_profile', 'cross_program_signals'],
    optionalSegments: ['program_inventory', 'capability_map'],
    minSources: 3,
  },
  BUDGET_AUTHORITY: {
    label: 'Budget authority and approval path',
    keywords: ['budget', 'approval', 'authority', 'funding', 'capex', 'opex', 'spend'],
    requiredSegments: ['it_financials', 'org_structure', 'program_inventory'],
    optionalSegments: ['initiative_financials', 'evidence_ledger'],
    minSources: 3,
  },
  APPLICATION_PORTFOLIO: {
    label: 'Application portfolio and system criticality',
    keywords: ['application', 'apps', 'portfolio', 'system inventory', 'criticality', 'platform'],
    requiredSegments: ['it_landscape', 'application_portfolio', 'org_structure'],
    optionalSegments: ['vendor_contracts', 'data_estate'],
    minSources: 3,
  },
  TECH_DEBT: {
    label: 'Technology debt and migration posture',
    keywords: ['technical debt', 'tech debt', 'legacy', 'retire', 'migrate', 'replatform', 'cobol'],
    requiredSegments: ['it_landscape', 'application_portfolio', 'program_inventory'],
    optionalSegments: ['initiative_financials', 'risk_register'],
    minSources: 3,
  },
  DATA_PLATFORM: {
    label: 'Data platform and analytics stack',
    keywords: ['data platform', 'analytics', 'warehouse', 'lakehouse', 'snowflake', 'databricks', 'bi'],
    requiredSegments: ['it_landscape', 'data_estate', 'kpi_dictionary'],
    optionalSegments: ['org_structure', 'program_inventory'],
    minSources: 3,
  },
  CYBER_SECURITY: {
    label: 'Cybersecurity stack and risk posture',
    keywords: ['cyber', 'security', 'ciso', 'risk posture', 'vulnerability', 'zero trust'],
    requiredSegments: ['it_landscape', 'risk_register', 'compliance_posture'],
    optionalSegments: ['vendor_contracts', 'org_structure'],
    minSources: 3,
  },
  AI_TOOLING: {
    label: 'AI tooling and model governance',
    keywords: ['ai tooling', 'model', 'agent', 'copilot', 'genai', 'foundation model', 'llm'],
    requiredSegments: ['it_landscape', 'compliance_posture', 'program_inventory'],
    optionalSegments: ['evidence_ledger', 'data_estate'],
    minSources: 3,
  },
  VENDOR_CONTRACTS: {
    label: 'Vendor contracts and renewal leverage',
    keywords: ['contract', 'renewal', 'vendor health', 'sla', 'commercial', 'negotiation'],
    requiredSegments: ['vendor_contracts', 'it_landscape', 'it_financials'],
    optionalSegments: ['evidence_ledger', 'sponsor_signal'],
    minSources: 3,
    intents: ['vendor_lookup', 'vendor_comparison'],
  },
  SOURCING_PIPELINE: {
    label: 'Sourcing pipeline and event readiness',
    keywords: ['sourcing', 'rfp', 'bafo', 'vendor selection', 'deal', 'procurement'],
    requiredSegments: ['vendor_contracts', 'program_inventory', 'evidence_ledger'],
    optionalSegments: ['it_financials', 'cross_program_signals'],
    minSources: 3,
  },
  PROGRAM_PORTFOLIO: {
    label: 'Program portfolio and move sequencing',
    keywords: ['program', 'initiative', 'move', 'roadmap', 'portfolio', 'phase', 'sequence'],
    requiredSegments: ['program_inventory', 'org_structure', 'kpi_dictionary'],
    optionalSegments: ['initiative_financials', 'cross_program_signals'],
    minSources: 3,
  },
  INITIATIVE_FINANCIALS: {
    label: 'Initiative financials and capital allocation',
    keywords: ['initiative financial', 'capital allocation', 'fund', 'invest', 'business case', 'run change transform'],
    requiredSegments: ['initiative_financials', 'it_financials', 'program_inventory'],
    optionalSegments: ['kpi_dictionary', 'evidence_ledger'],
    minSources: 3,
  },
  KPI_PERFORMANCE: {
    label: 'KPI performance and outcome baseline',
    keywords: ['kpi', 'metric', 'baseline', 'target', 'performance', 'outcome'],
    requiredSegments: ['kpi_dictionary', 'evidence_ledger', 'program_inventory'],
    optionalSegments: ['it_financials', 'cross_program_signals'],
    minSources: 3,
  },
  EVIDENCE_PROVENANCE: {
    label: 'Evidence provenance and source traceability',
    keywords: ['evidence', 'provenance', 'source', 'trace', 'basis', 'confidence'],
    requiredSegments: ['evidence_ledger', 'enterprise_profile', 'program_inventory'],
    optionalSegments: ['kpi_dictionary', 'cross_program_signals'],
    minSources: 3,
  },
  CROSS_PROGRAM_RISK: {
    label: 'Cross-program risk and dependency',
    keywords: ['risk', 'dependency', 'blocker', 'blocked', 'cross-program', 'collision', 'interlock'],
    requiredSegments: ['cross_program_signals', 'program_inventory', 'risk_register'],
    optionalSegments: ['evidence_ledger', 'it_landscape'],
    minSources: 3,
  },
  REGULATORY_CONTEXT: {
    label: 'Regulatory context and compliance posture',
    keywords: ['regulatory', 'regulation', 'compliance', 'hipaa', 'fda', 'eu ai act', 'mdr', 'sr 11-7'],
    requiredSegments: ['compliance_posture', 'regulatory_and_dependency_context', 'evidence_ledger'],
    optionalSegments: ['risk_register', 'enterprise_profile'],
    minSources: 3,
    intents: ['regulation_query'],
  },
  INDUSTRY_BENCHMARK: {
    label: 'Industry benchmark and peer comparison',
    keywords: ['benchmark', 'peer', 'top quartile', 'median', 'cohort', 'comparison'],
    requiredSegments: ['enterprise_profile', 'kpi_dictionary', 'evidence_ledger'],
    optionalSegments: ['program_inventory', 'cross_program_signals'],
    minSources: 3,
    intents: ['benchmark_query'],
  },
  PATTERN_FAILURE_MODE: {
    label: 'Pattern failure mode and intervention logic',
    keywords: ['pattern', 'failure mode', 'anti-pattern', 'what goes wrong', 'why fail'],
    requiredSegments: ['evidence_ledger', 'program_inventory', 'cross_program_signals'],
    optionalSegments: ['risk_register', 'enterprise_profile'],
    minSources: 3,
    intents: ['pattern_inquiry'],
  },
  VENDOR_LANDSCAPE: {
    label: 'Vendor landscape and market posture',
    keywords: ['vendor landscape', 'compare vendors', 'market', 'credible vendor', 'overhyped'],
    requiredSegments: ['vendor_contracts', 'it_landscape', 'evidence_ledger'],
    optionalSegments: ['program_inventory', 'it_financials'],
    minSources: 3,
    intents: ['vendor_lookup', 'vendor_comparison'],
  },
  CURRENT_STATE_SYNTHESIS: {
    label: 'Current-state synthesis',
    keywords: ['current state', 'what do we have', 'today', 'where are we', 'state of'],
    requiredSegments: ['enterprise_profile', 'org_structure', 'it_landscape'],
    optionalSegments: ['it_financials', 'program_inventory'],
    minSources: 3,
  },
  GENERAL_STRATEGY: {
    label: 'General strategy synthesis',
    keywords: ['strategy', 'should we', 'what should', 'how should', 'recommend', 'prioritize'],
    requiredSegments: ['enterprise_profile', 'program_inventory', 'evidence_ledger'],
    optionalSegments: ['org_structure', 'it_financials'],
    minSources: 3,
    intents: ['general_synthesis', 'topic_synthesis', 'insight_query', 'research_query'],
  },
} as const;

export const categoryToRequiredSegments = Object.fromEntries(
  Object.entries(QUESTION_CATEGORIES).map(([category, spec]) => [category, spec.requiredSegments]),
) as Record<QuestionCategory, readonly SegmentId[]>;

export const RETAIL_OVERLAY_NAMESPACE = 'retail-v1';

export const retailCategoryToRequiredOverlayPacks: Record<QuestionCategory, readonly string[]> = {
  MODERNIZATION_PROGRESS: ['A.4', 'S.10', 'T.9', 'BH.1'],
  IBM_DEPENDENCY: ['S.4', 'S.8', 'S.10', 'H.10'],
  VALUE_LEDGER: ['AY.1', 'AY.2', 'AY.3', 'I.8'],
  OPERATING_MODEL: ['E.1', 'G.8', 'H.10', 'P.2'],
  EXECUTIVE_ALIGNMENT: ['BE.1', 'BE.2', 'A.8', 'BF.2'],
  ORG_LEADERSHIP: ['P.1', 'P.4', 'P.7', 'BE.1'],
  BUDGET_AUTHORITY: ['AY.1', 'AY.4', 'BE.2', 'BF.1'],
  APPLICATION_PORTFOLIO: ['S.1', 'S.2', 'S.4', 'S.9'],
  TECH_DEBT: ['S.8', 'S.10', 'F.6', 'F.7'],
  DATA_PLATFORM: ['L.1', 'L.2', 'L.3', 'AU.3'],
  CYBER_SECURITY: ['BA.1', 'BA.2', 'BA.3', 'R.3'],
  AI_TOOLING: ['T.1', 'T.3', 'T.5', 'T.9'],
  VENDOR_CONTRACTS: ['H.2', 'AM.2', 'AN.2', 'AP.4'],
  SOURCING_PIPELINE: ['H.3', 'H.4', 'C.4', 'AK.2'],
  PROGRAM_PORTFOLIO: ['A.7', 'A.8', 'BE.2', 'BH.1'],
  INITIATIVE_FINANCIALS: ['AY.1', 'AY.3', 'AY.4', 'AQ.3'],
  KPI_PERFORMANCE: ['E.7', 'O.2', 'AY.2', 'I.8'],
  EVIDENCE_PROVENANCE: ['L.5', 'L.6', 'BB.2', 'BE.2'],
  CROSS_PROGRAM_RISK: ['BG.1', 'H.10', 'BA.3', 'BC.1'],
  REGULATORY_CONTEXT: ['BA.2', 'BB.1', 'BC.1', 'BC.2'],
  INDUSTRY_BENCHMARK: ['AY.2', 'BF.1', 'N.2', 'E.7'],
  PATTERN_FAILURE_MODE: ['BG.1', 'K.4', 'E.3', 'AD.3'],
  VENDOR_LANDSCAPE: ['S.2', 'L.3', 'AX.1', 'AM.2'],
  CURRENT_STATE_SYNTHESIS: ['A.1', 'E.1', 'S.1', 'AY.1'],
  GENERAL_STRATEGY: ['A.4', 'A.7', 'BE.2', 'BH.1'],
} as const;

export function getRequiredOverlayPacksForCategory(
  category: QuestionCategory,
  industry: IndustryOverlayKey,
): IndustryOverlayCoverageContract | null {
  if (industry !== 'retail') return null;
  return {
    overlayNamespace: RETAIL_OVERLAY_NAMESPACE,
    requiredPacks: [...retailCategoryToRequiredOverlayPacks[category]],
  };
}

const SEGMENT_ALIASES: Record<SegmentId, readonly string[]> = {
  enterprise_profile: ['enterprise profile', 'company profile', 'tenant profile'],
  org_structure: ['org structure', 'leadership', 'executive bench', 'direct reports'],
  it_landscape: ['it landscape', 'technology inventory', 'system inventory', 'tech stack'],
  it_financials: ['it financials', 'budget', 'capex', 'opex', 'funding authority'],
  kpi_dictionary: ['kpi dictionary', 'metric', 'baseline', 'target'],
  program_inventory: ['program inventory', 'initiative', 'move', 'roadmap'],
  evidence_ledger: ['evidence ledger', 'evidence', 'provenance'],
  vendor_contracts: ['vendor contracts', 'renewal', 'contract'],
  cross_program_signals: ['cross program', 'dependency', 'blocker', 'signal'],
  risk_register: ['risk register', 'risk posture'],
  compliance_posture: ['compliance posture', 'regulatory', 'hipaa', 'fda'],
  data_estate: ['data estate', 'data platform', 'analytics', 'warehouse', 'bi', 'reporting'],
  infrastructure: ['infrastructure', 'datacenter', 'virtualization', 'storage', 'network', 'compute', 'cloud account'],
  workflow_inventory: ['workflow inventory', 'workflow'],
  capability_map: ['capability map', 'capability'],
  org_change_signals: ['org change', 'change signal'],
  application_portfolio: ['application portfolio', 'app portfolio'],
  initiative_financials: ['initiative financials', 'capital allocation'],
  regulatory_and_dependency_context: ['regulatory and dependency context', 'regulatory context'],
  vendor_contract: ['vendor contract'],
  sponsor_signal: ['sponsor signal'],
  // Meridian enterprise-context-layer segments.
  cmdb_applications_services: ['cmdb', 'applications and services', 'service catalog', 'software inventory'],
  data_domains_stewardship: ['data domains', 'data stewardship', 'data owner', 'master data'],
  ci_relationships_dependencies: ['ci relationships', 'configuration item dependency', 'dependency', 'coupling'],
  facilities_business_units: ['facilities', 'business units', 'sites', 'divisions'],
  incidents: ['incidents', 'outages', 'tickets'],
  changes: ['changes', 'change records', 'change management'],
  problems: ['problems', 'problem records', 'root cause'],
  slas: ['slas', 'service levels', 'service level agreements'],
  spend_baseline: ['spend baseline', 'cost baseline', 'it spend'],
  vendors_contract_inventory: ['vendors', 'contract inventory', 'supplier inventory'],
  renewal_calendar: ['renewal calendar', 'renewals', 'contract renewals'],
  risk_compliance_register: ['risk register', 'compliance register', 'risk and compliance'],
  org_decision_rights: ['org decision rights', 'decision rights', 'raci', 'accountability'],
  policies_procedures: ['policies', 'procedures', 'controls'],
  initiative_portfolio: ['initiative portfolio', 'program portfolio', 'roadmap'],
  // Lakeshore Holdings enterprise-context-layer segments.
  business_capability: ['business capability', 'capability map', 'value stream'],
  business_unit: ['business unit', 'division'],
  cmdb_application: ['application', 'cmdb application', 'app'],
  configuration_item: ['configuration item', 'ci', 'asset'],
  contract: ['contract', 'agreement'],
  data_asset: ['data asset', 'dataset', 'data product'],
  facility: ['facility', 'site', 'location'],
  initiative: ['initiative', 'project', 'program'],
  integration: ['integration', 'interface', 'connection'],
  kpi_metric: ['kpi', 'metric', 'measure', 'scorecard'],
  org_role: ['org role', 'role', 'position'],
  risk: ['risk', 'risk item'],
};

export function classifyQuestionCategory(query: string, intent?: AskIntent | null): QuestionCategory {
  const normalized = query.toLowerCase();
  if (/\b(ibm|mainframe|z workload|mips)\b/.test(normalized)) {
    return 'IBM_DEPENDENCY';
  }
  if (/\b(current state|what do we have|today)\b/.test(normalized) && /\b(data platform|analytics|warehouse|lakehouse|bi)\b/.test(normalized)) {
    return 'DATA_PLATFORM';
  }
  if (/\b(cross[-\s]?program|dependency|dependencies|blocker|blocked|interlock)\b/.test(normalized)) {
    return 'CROSS_PROGRAM_RISK';
  }
  if (/\b(contract|renewal|sla|commercial|negotiation)\b/.test(normalized) && /\b(vendor|vendors|supplier|suppliers)\b/.test(normalized)) {
    return 'VENDOR_CONTRACTS';
  }
  let best: { category: QuestionCategory; score: number } = { category: 'GENERAL_STRATEGY', score: 0 };

  for (const [category, spec] of Object.entries(QUESTION_CATEGORIES) as Array<[QuestionCategory, QuestionCategorySpec]>) {
    let score = 0;
    if (intent && spec.intents?.includes(intent)) score += 4;
    for (const keyword of spec.keywords) {
      if (normalized.includes(keyword.toLowerCase())) score += keyword.includes(' ') ? 3 : 1;
    }
    if (score > best.score) best = { category, score };
  }

  return best.category;
}

export function assertCoverage(
  category: QuestionCategory,
  retrieved: readonly CoverageSourceLike[],
): CoverageReport {
  const spec = QUESTION_CATEGORIES[category];
  const present = new Set<SegmentId>();
  for (const source of retrieved) {
    for (const segment of inferSegmentsFromSource(source)) present.add(segment);
  }

  const requiredSegments = [...spec.requiredSegments];
  const presentSegments = requiredSegments.filter((segment) => present.has(segment));
  const missingSegments = requiredSegments.filter((segment) => !present.has(segment));
  const status: CoverageStatus =
    missingSegments.length === 0 && retrieved.length >= spec.minSources
      ? 'full'
      : presentSegments.length > 0 || retrieved.length > 0
        ? 'partial'
        : 'missing';

  return {
    category,
    status,
    requiredSegments,
    presentSegments,
    missingSegments,
    optionalSegments: [...spec.optionalSegments],
    sourceCount: retrieved.length,
    minSources: spec.minSources,
  };
}

export function inferSegmentsFromSource(source: CoverageSourceLike): SegmentId[] {
  const haystack = [source.id, source.name, source.detail].filter(Boolean).join(' ').toLowerCase();
  const out = new Set<SegmentId>();
  for (const segment of Object.keys(SEGMENT_ALIASES) as SegmentId[]) {
    if (haystack.includes(segment.toLowerCase())) {
      out.add(segment);
      continue;
    }
    if (SEGMENT_ALIASES[segment].some((alias) => haystack.includes(alias))) out.add(segment);
  }
  return [...out];
}
