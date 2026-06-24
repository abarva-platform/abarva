import { CONTEXT_TEMPLATE_REGISTRY, type ContextTemplateDefinition } from '@/lib/context-ingestion/template-registry';
import type { ContextDimensionUniversal } from '@/lib/context-ingestion/types';

export type UniversalSemanticDimensionId = ContextDimensionUniversal | 'context_relationships';
export type SemanticExtensionDimensionId =
  | `operational:${string}`
  | `moves:${string}`
  | `source:${string}`
  | `rate_card:${string}`
  | `tower:${string}`
  | `healthcare:${string}`
  | `client:${string}`;
export type SemanticDimensionId = UniversalSemanticDimensionId | SemanticExtensionDimensionId;

export type SemanticFamilyId =
  | 'enterprise_operating_model'
  | 'personas_workforce'
  | 'technology_estate'
  | 'data_connectivity'
  | 'financial_commercial'
  | 'execution_operations'
  | 'governance_ai_evidence'
  | 'relationship_graph'
  | 'semantic_extension';

export type SemanticExtensionId =
  | 'operational_evidence_process_intelligence'
  | 'moves_evidence_readiness'
  | 'source_proposal_intelligence'
  | 'rate_card_provenance'
  | 'ai_control_tower'
  | 'healthcare_clinical_claims'
  | `client_${string}`;

export type EnterpriseSemanticModule =
  | 'home'
  | 'intelligence'
  | 'moves'
  | 'source'
  | 'tower'
  | 'ava'
  | 'context_layer_admin';

export type SemanticQuestionIntent =
  | 'metric_lookup'
  | 'ranking'
  | 'comparison'
  | 'trend'
  | 'root_cause'
  | 'evidence_lookup'
  | 'opportunity_recommendation'
  | 'summary'
  | 'gap_analysis'
  | 'recommendation'
  | 'drill_down'
  | 'definition';

export type SemanticExecutionMode = 'structured_metric' | 'structured_summary' | 'evidence_summary' | 'unsupported';

export type SemanticConfidence = 'high' | 'medium' | 'low';

export interface SemanticCitationRule {
  required: boolean;
  sourceFields: string[];
  format: string;
}

export interface SemanticMetricDefinition {
  metricId: string;
  businessName: string;
  description: string;
  formula: string;
  requiredFields: string[];
  grain: string;
  allowedDimensions: SemanticDimensionId[];
  filters: string[];
  unit: 'count' | 'percent' | 'currency' | 'hours' | 'days' | 'score' | 'ratio' | 'text';
  freshness: string;
  confidenceRules: string[];
  caveats: string[];
  citationRequirements: string[];
}

export interface SemanticJoinPath {
  targetDimension: SemanticDimensionId;
  joinKeys: string[];
  purpose: string;
}

export interface SemanticDimensionContract {
  dimensionId: SemanticDimensionId;
  family: SemanticFamilyId;
  businessName: string;
  description: string;
  businessQuestionsSupported: string[];
  synonyms: string[];
  canonicalEntities: string[];
  sourceTablesOrViews: string[];
  searchableIndices: string[];
  primaryGrain: string;
  keyFields: string[];
  allowedFilters: string[];
  defaultFilters: string[];
  canonicalMetrics: string[];
  metricDefinitions: string[];
  joinPaths: SemanticJoinPath[];
  freshnessFields: string[];
  ownerFields: string[];
  dataQualityFields: string[];
  confidenceRules: string[];
  caveats: string[];
  citationRules: SemanticCitationRule[];
  answerExamples: string[];
  unsupportedQuestionBehavior: string;
}

export interface SemanticExtensionContract {
  extensionId: SemanticExtensionId;
  label: string;
  purpose: string;
  appliesToModules: EnterpriseSemanticModule[];
  datasetFamilies: string[];
  extensionDimensions: SemanticExtensionDimensionId[];
  anchorsToUniversalDimensions: UniversalSemanticDimensionId[];
  canonicalMetrics: string[];
  requiredEvidenceTypes: string[];
  joinStrategy: string;
  caveats: string[];
  unsupportedQuestionBehavior: string;
}

export interface SemanticRecord {
  id: string;
  dimensionId: SemanticDimensionId;
  sourceType: 'structured_row' | 'semantic_view' | 'document_chunk' | 'synthetic_demo';
  sourceName: string;
  fields: Record<string, unknown>;
  freshness?: string;
  confidence?: number;
  citation?: string;
  synthetic?: boolean;
}

export interface RoutedSemanticQuestion {
  question: string;
  requestedByModule?: EnterpriseSemanticModule;
  intent: SemanticQuestionIntent;
  dimensions: SemanticDimensionId[];
  semanticExtensions: SemanticExtensionId[];
  entities: string[];
  metrics: string[];
  filters: Record<string, string>;
  timePeriod?: string;
  comparisonSet?: string[];
  requiredJoins: SemanticJoinPath[];
  confidence: SemanticConfidence;
  clarificationNeeded: string[];
  suggestedQueryPlan: string;
}

export interface SemanticEvidenceResult {
  sourceType: SemanticRecord['sourceType'];
  sourceFileTableOrView: string;
  recordId: string;
  excerptOrRowSummary: string;
  confidence: number;
  freshness: string;
  citationReference: string;
  caveat?: string;
}

export interface ComputedSemanticFact {
  metricId: string;
  label: string;
  value: number | string;
  unit: SemanticMetricDefinition['unit'];
  sourceRecordIds: string[];
}

export interface SemanticQueryPlan {
  route: RoutedSemanticQuestion;
  executionMode: SemanticExecutionMode;
  selectedMetrics: SemanticMetricDefinition[];
  selectedDimensions: SemanticDimensionContract[];
  sourceTablesOrViews: string[];
  evidence: SemanticEvidenceResult[];
  computedFacts: ComputedSemanticFact[];
  unsupportedReason?: string;
  caveats: string[];
  confidence: SemanticConfidence;
}

export interface SemanticAnswer {
  serviceName: 'Enterprise Semantic Question Layer';
  requestedByModule?: EnterpriseSemanticModule;
  directAnswer: string;
  basis: string;
  whyItMatters: string;
  evidence: SemanticEvidenceResult[];
  caveats: string[];
  confidence: SemanticConfidence;
  freshness: string;
  recommendedNextAction: string;
  askNext: string[];
  metricDefinitions: SemanticMetricDefinition[];
  verification: SemanticAnswerVerification;
}

export interface SemanticAnswerVerification {
  passed: boolean;
  issues: string[];
  checkedNumbers: string[];
}

export interface EnterpriseSemanticQuestionContext {
  requestedByModule?: EnterpriseSemanticModule;
  tenantKey?: string;
  userId?: string;
}

export interface EnterpriseSemanticQuestionLayerContract {
  serviceName: 'Enterprise Semantic Question Layer';
  principle: string;
  consumers: EnterpriseSemanticModule[];
  moduleUseCases: Record<EnterpriseSemanticModule, string>;
  responsibilities: string[];
  requiredAnswerSections: Array<keyof Pick<SemanticAnswer, 'directAnswer' | 'basis' | 'evidence' | 'confidence' | 'caveats' | 'recommendedNextAction' | 'askNext'>>;
  unsupportedBehavior: string[];
}

export interface EnterpriseSemanticQuestionRequest extends EnterpriseSemanticQuestionContext {
  question: string;
  records?: SemanticRecord[];
}

export interface EnterpriseSemanticQuestionResponse {
  serviceName: 'Enterprise Semantic Question Layer';
  requestedByModule?: EnterpriseSemanticModule;
  moduleUseCase?: string;
  answer: SemanticAnswer;
  plan: SemanticQueryPlan;
}

export interface SemanticGoldenQuestion {
  id: string;
  question: string;
  expectedIntent: SemanticQuestionIntent;
  expectedDimensions: SemanticDimensionId[];
  expectedMetrics: string[];
  expectedAnswerShape: string[];
  requiredCitationBehavior: string;
  unsupportedCaveatBehavior: string;
}

const templateByDimension = new Map<SemanticDimensionId, ContextTemplateDefinition>(
  CONTEXT_TEMPLATE_REGISTRY.map((template) => [template.dimension as SemanticDimensionId, template]),
);

const sharedCitationRule: SemanticCitationRule = {
  required: true,
  sourceFields: ['source_file_id', 'row', 'record_id', 'source_locator', 'citation'],
  format: 'dimension.source_name#record_id or file:row where available',
};

export const ENTERPRISE_SEMANTIC_MODULE_USE_CASES: Record<EnterpriseSemanticModule, string> = {
  home: 'what do we know?',
  intelligence: 'what does the enterprise context say?',
  moves: 'what should we do?',
  source: 'which vendor and why?',
  tower: 'are we delivering value?',
  ava: 'explain it like an advisor.',
  context_layer_admin: 'what evidence is loaded, missing, stale, or unsafe?',
};

export const ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT: EnterpriseSemanticQuestionLayerContract = {
  serviceName: 'Enterprise Semantic Question Layer',
  principle:
    'Universal platform-level question answering across enterprise context, using structured data, governed metrics, cited evidence, caveats, and verification before narrative synthesis.',
  consumers: ['home', 'intelligence', 'moves', 'source', 'tower', 'ava', 'context_layer_admin'],
  moduleUseCases: ENTERPRISE_SEMANTIC_MODULE_USE_CASES,
  responsibilities: [
    'Understand the question intent, domain, dimensions, metrics, filters, time period, and clarification needs.',
    'Map business language to governed semantic dimensions, extension dimensions, metrics, joins, and source tables or views.',
    'Use structured data, semantic views, and registered metrics first for numeric, ranking, comparison, trend, root-cause, and decision-support questions.',
    'Retrieve cited evidence with freshness, confidence, caveats, and synthetic/demo labeling where applicable.',
    'Compose human answers for aVa and modules from computed facts and evidence, not guessed numbers.',
    'Verify every number, ranking, metric claim, synthetic label, and missing-data caveat before returning.',
  ],
  requiredAnswerSections: ['directAnswer', 'basis', 'evidence', 'confidence', 'caveats', 'recommendedNextAction', 'askNext'],
  unsupportedBehavior: [
    'Say what is missing or unsupported.',
    'Ask a clarifying question when the domain, metric, time period, or entity is ambiguous.',
    'Offer the closest available evidenced answer with caveats.',
    'Recommend which data template or evidence would unlock the requested answer.',
    'Do not hallucinate unsupported numbers, rankings, vendors, estimates, or clinical/business claims.',
  ],
};

const metric = (
  metricId: string,
  businessName: string,
  description: string,
  formula: string,
  requiredFields: string[],
  allowedDimensions: SemanticDimensionId[],
  unit: SemanticMetricDefinition['unit'],
  caveats: string[] = [],
): SemanticMetricDefinition => ({
  metricId,
  businessName,
  description,
  formula,
  requiredFields,
  grain: 'defined by primary semantic dimension',
  allowedDimensions,
  filters: ['tenant_key', 'time_period', 'business_domain', 'owner_role', 'status'],
  unit,
  freshness: 'use the newest approved structured row or semantic view refresh timestamp',
  confidenceRules: [
    'high when all required fields are present and source is client-approved structured data',
    'medium when required fields are present but source is benchmark or synthetic demo evidence',
    'low when one or more required fields are missing or only document summaries support the answer',
  ],
  caveats,
  citationRequirements: ['cite source row or semantic view result for every computed value'],
});

export const SEMANTIC_METRIC_REGISTRY: SemanticMetricDefinition[] = [
  metric('record_count', 'Record count', 'Number of records in scope.', 'count(records)', ['id'], ['context_relationships'], 'count'),
  metric('incident_count', 'Incident count', 'Incident or work item count in scope.', 'count(records where record_type in incident/work_item)', ['record_id', 'record_type'], ['operations_service_management'], 'count'),
  metric('sla_breach_rate', 'SLA breach rate', 'Percent of work items breaching SLA.', 'sla_breached / total_work_items', ['record_id', 'sla_breached'], ['operations_service_management'], 'percent'),
  metric('reopen_rate', 'Reopen rate', 'Percent of work items reopened after closure.', 'reopened_count / total_work_items', ['record_id', 'reopened_count'], ['operations_service_management'], 'percent'),
  metric('reassignment_rate', 'Reassignment rate', 'Average reassignment or handoff count per work item.', 'sum(reassignment_count) / total_work_items', ['record_id', 'reassignment_count'], ['operations_service_management'], 'ratio'),
  metric('cycle_time', 'Cycle time', 'Elapsed time from open to close.', 'closed_at - opened_at', ['opened_at', 'closed_at'], ['operations_service_management'], 'hours'),
  metric(
    'app_friction_score',
    'Application friction score',
    'Composite rank score for apps creating operational friction.',
    'incident_count + (sla_breach_count * 4) + (reopen_count * 3) + (reassignment_count * 1.5) + linked_event_count + ownership_gap_penalty',
    ['app_id', 'incident_count', 'sla_breach_count', 'reopen_count'],
    ['applications_systems', 'operations_service_management', 'integrations_interfaces'],
    'score',
    ['if logs are missing, label the score as ticket/Jira-based only'],
  ),
  metric('automation_value_score', 'Automation value score', 'Relative score for automation value.', 'weighted value, volume, effort saved, cycle-time reduction, and risk', ['baseline_volume', 'effort_saved_hours'], ['ai_automation_footprint', 'operations_service_management', 'kpis_outcome_evidence'], 'score'),
  metric('opportunity_feasibility_score', 'Opportunity feasibility score', 'Readiness score for executing an opportunity.', 'data_readiness + process_stability + control_readiness - integration_complexity', ['data_readiness', 'process_stability'], ['ai_automation_footprint', 'security_risk_compliance'], 'score'),
  metric('normalized_tco', 'Normalized TCO', 'Comparable total cost of ownership.', 'license + run + labor + implementation + risk-adjusted transition cost', ['annual_value_usd'], ['vendors_contracts_licenses', 'it_budget_financials'], 'currency'),
  metric('vendor_score', 'Vendor score', 'Composite vendor performance and risk score.', 'commercial_score + delivery_score + risk_score + exit_score', ['vendor_id', 'annual_value_usd'], ['vendors_contracts_licenses'], 'score'),
  metric('roadmap_readiness', 'Roadmap readiness', 'Readiness to proceed based on evidence, owner, dependency, and value clarity.', 'evidence_score + owner_score + dependency_score + value_score', ['initiative_id', 'status'], ['initiatives_portfolio', 'kpis_outcome_evidence'], 'score'),
  metric('data_quality_score', 'Data quality score', 'Trust score for a data product or dataset.', 'completeness + freshness + lineage + quality issue closure', ['data_product_id', 'quality_score'], ['data_analytics_estate'], 'score'),
  metric('governance_gap_count', 'Governance gap count', 'Open risk, control, compliance, or AI governance gaps.', 'count(records where status is gap/open/noncompliant)', ['control_id', 'status'], ['security_risk_compliance', 'ai_automation_footprint'], 'count'),
  metric('ownership_coverage', 'Ownership coverage', 'Percent of records with accountable owner fields populated.', 'records_with_owner / total_records', ['owner_role'], ['applications_systems', 'data_analytics_estate', 'initiatives_portfolio'], 'percent'),
  metric('integration_risk_count', 'Integration risk count', 'Number of risky or failing integration edges.', 'count(edges where failure_impact or kill_blocker_flag is high)', ['edge_id', 'source_app_id', 'target_app_id'], ['integrations_interfaces', 'context_relationships'], 'count'),
  metric('workforce_adoption_rate', 'Workforce adoption rate', 'Share of workforce/personas actively adopting a tool or workflow.', 'active_users / eligible_users', ['persona_id', 'head_count'], ['personas_workforce', 'ai_automation_footprint'], 'percent'),
  metric('kpi_gap_to_target', 'KPI gap to target', 'Gap between current KPI value and target.', 'target_value - current_value', ['kpi_id', 'current_value', 'target_value'], ['kpis_outcome_evidence'], 'ratio'),
];

const metricIds = (...ids: string[]) => ids;

const buildContract = (input: {
  dimensionId: SemanticDimensionId;
  family: SemanticFamilyId;
  businessName: string;
  description: string;
  questions: string[];
  synonyms: string[];
  entities: string[];
  grain: string;
  keyFields?: string[];
  filters?: string[];
  metrics: string[];
  joins?: SemanticJoinPath[];
  caveats?: string[];
  examples?: string[];
}): SemanticDimensionContract => {
  const template = templateByDimension.get(input.dimensionId);
  const sourceName = input.dimensionId === 'context_relationships' ? 'enterprise_context_relationships' : `enterprise_context_${input.dimensionId}`;
  const ownerFields = template ? [template.ownerRole, 'owner_role', 'business_owner', 'it_owner'] : ['relationship_owner', 'source_owner', 'target_owner'];
  const keyFields = input.keyFields ?? template?.requiredFields ?? ['record_id'];
  return {
    dimensionId: input.dimensionId,
    family: input.family,
    businessName: input.businessName,
    description: input.description,
    businessQuestionsSupported: input.questions,
    synonyms: input.synonyms,
    canonicalEntities: input.entities,
    sourceTablesOrViews: [sourceName, 'enterprise_context_records', 'enterprise_context_facts'],
    searchableIndices: ['tenant-context-azure-search', `semantic-${input.dimensionId}`],
    primaryGrain: input.grain,
    keyFields,
    allowedFilters: input.filters ?? ['tenant_key', 'business_domain', 'owner_role', 'status', 'time_period'],
    defaultFilters: ['approved_or_demo_labeled = true', 'tenant_key = active tenant'],
    canonicalMetrics: input.metrics,
    metricDefinitions: input.metrics,
    joinPaths: input.joins ?? [],
    freshnessFields: ['loaded_at', 'source_updated_at', 'refresh_date', 'period'],
    ownerFields,
    dataQualityFields: ['confidence', 'quality_score', 'validation_findings', 'requires_approval', 'lineage_documented'],
    confidenceRules: [
      'high for approved structured data with complete required fields',
      'medium for synthetic demo evidence or partial structured extracts',
      'low for document-only evidence or missing required fields',
    ],
    caveats: input.caveats ?? ['disclose missing required evidence and never invent values'],
    citationRules: [sharedCitationRule],
    answerExamples: input.examples ?? input.questions,
    unsupportedQuestionBehavior: 'answer with the missing dimension, metric, join, or evidence needed; do not fabricate a numeric result',
  };
};

export const SEMANTIC_DIMENSION_CATALOG: SemanticDimensionContract[] = [
  buildContract({
    dimensionId: 'enterprise_profile',
    family: 'enterprise_operating_model',
    businessName: 'Enterprise profile',
    description: 'Company identity, scale, industry, geography, strategy context, and baseline profile.',
    questions: ['Who is this enterprise?', 'What business context matters?', 'What scale and operating footprint are in scope?', 'What constraints shape the strategy?', 'What evidence identifies the tenant?'],
    synonyms: ['company', 'enterprise', 'tenant', 'organization', 'profile', 'business context'],
    entities: ['enterprise', 'business_unit', 'geography'],
    grain: 'one row per enterprise profile version',
    metrics: metricIds('record_count'),
  }),
  buildContract({
    dimensionId: 'business_org_functions',
    family: 'enterprise_operating_model',
    businessName: 'Business functions',
    description: 'Business function inventory, executive accountability, headcount, cost centers, and AI maturity.',
    questions: ['Which functions are in scope?', 'Who owns each business function?', 'Where is headcount concentrated?', 'Which functions have AI maturity gaps?', 'Which functions are affected by this move?'],
    synonyms: ['function', 'department', 'business unit', 'operating function', 'cost center'],
    entities: ['business_function', 'executive_owner'],
    grain: 'one row per business function',
    metrics: metricIds('ownership_coverage', 'record_count'),
  }),
  buildContract({
    dimensionId: 'it_org_ownership',
    family: 'enterprise_operating_model',
    businessName: 'IT organization and ownership',
    description: 'IT teams, domains, owners, workforce mix, budgets, and vendor dependencies.',
    questions: ['Who owns this technology domain?', 'Which IT teams are accountable?', 'Where are ownership gaps?', 'What is the delivery model?', 'Which teams need to approve?'],
    synonyms: ['IT owner', 'tech owner', 'platform team', 'support team', 'domain owner'],
    entities: ['it_team', 'domain', 'owner_role'],
    grain: 'one row per IT team or ownership domain',
    metrics: metricIds('ownership_coverage', 'record_count'),
  }),
  buildContract({
    dimensionId: 'personas_workforce',
    family: 'personas_workforce',
    businessName: 'Personas and workforce',
    description: 'Personas, roles, workforce counts, tool use, throughput, skills, and work patterns.',
    questions: ['Which personas are affected?', 'Where will AI change work?', 'Who needs adoption support?', 'What is the workforce impact?', 'Where is productivity improving?'],
    synonyms: ['persona', 'workforce', 'role', 'worker', 'agent user', 'associate', 'clinician', 'analyst'],
    entities: ['persona', 'role', 'workforce_group'],
    grain: 'one row per persona or workforce population',
    metrics: metricIds('workforce_adoption_rate', 'automation_value_score', 'record_count'),
  }),
  buildContract({
    dimensionId: 'capabilities_value_streams',
    family: 'enterprise_operating_model',
    businessName: 'Capabilities and value streams',
    description: 'Capability map, value streams, maturity, business functions, and opportunity alignment.',
    questions: ['Which capabilities are affected?', 'Where is maturity low?', 'Which value streams depend on this system?', 'What capability should improve first?', 'Where are architecture gaps by business process?'],
    synonyms: ['capability', 'value stream', 'business process', 'process area', 'maturity'],
    entities: ['capability', 'value_stream', 'process_area'],
    grain: 'one row per capability',
    metrics: metricIds('roadmap_readiness', 'record_count'),
    joins: [{ targetDimension: 'system_function_mapping', joinKeys: ['capability_id', 'function_id'], purpose: 'connect capabilities to supporting systems' }],
  }),
  buildContract({
    dimensionId: 'applications_systems',
    family: 'technology_estate',
    businessName: 'Applications and systems',
    description: 'Application portfolio, vendor, category, criticality, lifecycle, cost, ownership, and AI eligibility.',
    questions: ['Which apps cause the most friction?', 'Which apps are critical?', 'Which systems should be modernized?', 'Which apps lack owners?', 'Which apps should be in a pilot?'],
    synonyms: ['app', 'apps', 'application', 'system', 'platform', 'service', 'CMDB', 'portfolio'],
    entities: ['application', 'system', 'service'],
    grain: 'one row per application or system',
    keyFields: ['app_id', 'name', 'vendor', 'category', 'criticality', 'it_owner_team', 'lifecycle_stage'],
    metrics: metricIds('app_friction_score', 'ownership_coverage', 'normalized_tco', 'record_count'),
    joins: [
      { targetDimension: 'operations_service_management', joinKeys: ['app_id', 'system_id'], purpose: 'connect apps to incidents, tickets, changes, and operational work' },
      { targetDimension: 'integrations_interfaces', joinKeys: ['app_id', 'source_app_id', 'target_app_id'], purpose: 'connect apps to integration dependencies' },
      { targetDimension: 'vendors_contracts_licenses', joinKeys: ['vendor', 'vendor_id'], purpose: 'connect apps to commercial exposure' },
    ],
    caveats: ['if logs or tickets are missing, friction answers must disclose the limited evidence basis'],
    examples: ['Advisor Desktop is highest friction because incidents, SLA breaches, reopens, and ownership gaps rank highest.'],
  }),
  buildContract({
    dimensionId: 'system_function_mapping',
    family: 'technology_estate',
    businessName: 'System-to-function mapping',
    description: 'Mappings between applications, business functions, modules, support type, users, and process areas.',
    questions: ['Which systems support this function?', 'What processes depend on this system?', 'Where are duplicate systems?', 'Which functions rely on fragile apps?', 'What is the blast radius of a system change?'],
    synonyms: ['system mapping', 'function mapping', 'process support', 'module', 'blast radius'],
    entities: ['system_function_edge', 'application', 'business_function'],
    grain: 'one row per app-to-function mapping',
    metrics: metricIds('record_count', 'ownership_coverage'),
    joins: [{ targetDimension: 'business_org_functions', joinKeys: ['function_id'], purpose: 'connect system support to business function ownership' }],
  }),
  buildContract({
    dimensionId: 'infrastructure_cloud',
    family: 'technology_estate',
    businessName: 'Infrastructure and cloud estate',
    description: 'Cloud, infrastructure, environment, region, cost, criticality, resilience, and compliance scope.',
    questions: ['What cloud resources are critical?', 'Where is infrastructure cost concentrated?', 'What needs resilience work?', 'Which environments are in scope?', 'Where are compliance-sensitive workloads?'],
    synonyms: ['cloud', 'infrastructure', 'resource', 'hosting', 'environment', 'region', 'DR'],
    entities: ['cloud_resource', 'environment', 'region'],
    grain: 'one row per infrastructure resource',
    metrics: metricIds('normalized_tco', 'governance_gap_count', 'record_count'),
  }),
  buildContract({
    dimensionId: 'platform_volumetrics',
    family: 'technology_estate',
    businessName: 'Platform volumetrics',
    description: 'Platform activity, capacity, growth, peaks, thresholds, and operating volumes.',
    questions: ['Which platforms are growing fastest?', 'Where is capacity pressure?', 'What volumes drive cost?', 'Which thresholds are breached?', 'Where is demand changing?'],
    synonyms: ['volume', 'volumetrics', 'capacity', 'usage', 'peak', 'throughput', 'growth'],
    entities: ['platform_metric', 'capacity_metric'],
    grain: 'one row per platform metric per period',
    metrics: metricIds('cycle_time', 'record_count'),
  }),
  buildContract({
    dimensionId: 'data_analytics_estate',
    family: 'data_connectivity',
    businessName: 'Data and analytics estate',
    description: 'Data products, source systems, owners, data class, refresh SLA, quality, consumers, and lineage.',
    questions: ['Which data products have low trust?', 'What data quality issues exist?', 'Which data products are PHI or PII?', 'Where is lineage missing?', 'What analytics foundation is ready?'],
    synonyms: ['data product', 'dataset', 'analytics', 'semantic layer', 'lineage', 'quality', 'warehouse', 'lakehouse'],
    entities: ['data_product', 'dataset', 'semantic_model'],
    grain: 'one row per data product or dataset',
    metrics: metricIds('data_quality_score', 'ownership_coverage', 'record_count'),
    caveats: ['do not claim governed data readiness when quality, lineage, or owner fields are missing'],
  }),
  buildContract({
    dimensionId: 'integrations_interfaces',
    family: 'data_connectivity',
    businessName: 'Integrations and interfaces',
    description: 'Integration edges, source/target apps, interface type, direction, latency, volume, middleware, and failure impact.',
    questions: ['Which interfaces create risk?', 'Where are data flows fragile?', 'What integration dependencies block modernization?', 'Which APIs fail most?', 'What systems exchange data?'],
    synonyms: ['integration', 'interface', 'API', 'feed', 'data flow', 'edge', 'middleware', 'HL7', 'FHIR'],
    entities: ['integration_edge', 'api', 'interface'],
    grain: 'one row per integration edge',
    metrics: metricIds('integration_risk_count', 'record_count'),
    joins: [{ targetDimension: 'applications_systems', joinKeys: ['source_app_id', 'target_app_id', 'app_id'], purpose: 'connect integration risks to systems and owners' }],
  }),
  buildContract({
    dimensionId: 'vendors_contracts_licenses',
    family: 'financial_commercial',
    businessName: 'Vendors, contracts, and licenses',
    description: 'Vendor contracts, license costs, renewal dates, terms, AI clauses, data rights, and benchmark evidence.',
    questions: ['Which vendors drive operational risk?', 'Where is pricing risk?', 'Which renewals matter?', 'Which contracts block change?', 'What vendor evidence supports this recommendation?'],
    synonyms: ['vendor', 'supplier', 'contract', 'license', 'renewal', 'BAFO', 'quote', 'commercial'],
    entities: ['vendor', 'contract', 'license'],
    grain: 'one row per vendor contract or license group',
    metrics: metricIds('normalized_tco', 'vendor_score', 'record_count'),
  }),
  buildContract({
    dimensionId: 'it_budget_financials',
    family: 'financial_commercial',
    businessName: 'IT budget and financials',
    description: 'Budget lines, annual budget, actuals, variance, capex, opex, labor, vendor cost, and fiscal year.',
    questions: ['What is the investment baseline?', 'Where is spend concentrated?', 'Which budgets fund this?', 'What variance exists?', 'What estimate basis is available?'],
    synonyms: ['budget', 'financials', 'spend', 'cost', 'capex', 'opex', 'funding', 'actuals'],
    entities: ['budget_line', 'cost_center', 'funding_source'],
    grain: 'one row per budget line per fiscal year',
    metrics: metricIds('normalized_tco', 'roadmap_readiness', 'record_count'),
    caveats: ['if client-approved rates are missing, label estimates as ROM planning assumptions'],
  }),
  buildContract({
    dimensionId: 'initiatives_portfolio',
    family: 'execution_operations',
    businessName: 'Initiatives and portfolio',
    description: 'Initiative portfolio, sponsor, status, committed spend, value claims, posture, phase, dependencies, and roadmap.',
    questions: ['Which initiatives are at risk?', 'What should we fund first?', 'Which initiatives lack evidence?', 'What is the 90-day roadmap?', 'Where are dependencies blocking value?'],
    synonyms: ['initiative', 'program', 'move', 'roadmap', 'portfolio', 'dependency', 'milestone'],
    entities: ['initiative', 'program', 'roadmap_item'],
    grain: 'one row per initiative',
    metrics: metricIds('roadmap_readiness', 'automation_value_score', 'record_count'),
    joins: [{ targetDimension: 'kpis_outcome_evidence', joinKeys: ['initiative_id'], purpose: 'connect initiatives to outcomes and value evidence' }],
  }),
  buildContract({
    dimensionId: 'operations_service_management',
    family: 'execution_operations',
    businessName: 'Operations and service management',
    description: 'Tickets, incidents, requests, changes, defects, severity, system linkage, SLA, root cause, MTTR, and impact.',
    questions: ['Where are bottlenecks?', 'What work is repetitive?', 'Which apps create friction?', 'What should we automate first?', 'Which operational patterns repeat?'],
    synonyms: ['ticket', 'incident', 'ServiceNow', 'Jira', 'case', 'request', 'change', 'SLA', 'MTTR', 'bottleneck', 'handoff', 'friction'],
    entities: ['work_item', 'incident', 'change', 'defect'],
    grain: 'one row per work item',
    metrics: metricIds('incident_count', 'sla_breach_rate', 'reopen_rate', 'reassignment_rate', 'cycle_time', 'app_friction_score', 'automation_value_score'),
    joins: [{ targetDimension: 'applications_systems', joinKeys: ['system_id', 'app_id'], purpose: 'rank applications by linked operational work and failure patterns' }],
  }),
  buildContract({
    dimensionId: 'kpis_outcome_evidence',
    family: 'execution_operations',
    businessName: 'KPIs and outcome evidence',
    description: 'KPI definitions, baseline, current value, target, owner, evidence source, confidence, and measurement date.',
    questions: ['Which KPIs are off target?', 'What value has been realized?', 'Which KPIs support this move?', 'What is the baseline?', 'What measurement evidence exists?'],
    synonyms: ['KPI', 'metric', 'outcome', 'baseline', 'target', 'value', 'performance'],
    entities: ['kpi', 'outcome_metric', 'value_measure'],
    grain: 'one row per KPI per measurement period',
    metrics: metricIds('kpi_gap_to_target', 'roadmap_readiness', 'record_count'),
  }),
  buildContract({
    dimensionId: 'security_risk_compliance',
    family: 'governance_ai_evidence',
    businessName: 'Security, risk, and compliance',
    description: 'Controls, risk posture, compliance area, system linkage, audit date, findings, remediation, and regulation.',
    questions: ['What control gaps exist?', 'What stays human-approved?', 'Which systems have compliance risk?', 'Where is remediation late?', 'What controls are needed before scaling?'],
    synonyms: ['security', 'risk', 'compliance', 'control', 'HIPAA', 'SOC2', 'audit', 'finding', 'guardrail'],
    entities: ['control', 'risk', 'finding', 'compliance_requirement'],
    grain: 'one row per control or risk item',
    metrics: metricIds('governance_gap_count', 'roadmap_readiness', 'record_count'),
  }),
  buildContract({
    dimensionId: 'ai_automation_footprint',
    family: 'governance_ai_evidence',
    businessName: 'AI and automation footprint',
    description: 'AI tools, agents, workflows, risk classification, approval status, spend, users, and automation scope.',
    questions: ['What should we automate first?', 'Which AI tools are approved?', 'What needs human approval?', 'Where is AI adoption happening?', 'Which automation opportunities need controls?'],
    synonyms: ['AI', 'automation', 'agent', 'LLM', 'copilot', 'workflow automation', 'model', 'agentic'],
    entities: ['ai_tool', 'automation_opportunity', 'agent'],
    grain: 'one row per AI tool, agent, or automation opportunity',
    metrics: metricIds('automation_value_score', 'opportunity_feasibility_score', 'workforce_adoption_rate', 'governance_gap_count'),
  }),
  buildContract({
    dimensionId: 'context_relationships',
    family: 'relationship_graph',
    businessName: 'Context relationship graph',
    description: 'Relationship edges connecting systems, functions, vendors, initiatives, KPIs, evidence, risks, and opportunities.',
    questions: ['What depends on this?', 'What evidence supports this opportunity?', 'Which relationships explain the risk?', 'What is the trace from source to recommendation?', 'Where are graph gaps?'],
    synonyms: ['relationship', 'dependency', 'graph', 'lineage', 'trace', 'edge', 'depends on', 'evidence chain'],
    entities: ['relationship_edge', 'dependency', 'lineage_trace'],
    grain: 'one row per relationship edge',
    keyFields: ['source_id', 'target_id', 'relationship_type'],
    metrics: metricIds('record_count', 'integration_risk_count'),
  }),
];

export const SEMANTIC_EXTENSION_REGISTRY: SemanticExtensionContract[] = [
  {
    extensionId: 'operational_evidence_process_intelligence',
    label: 'Operational Evidence and Process Intelligence',
    purpose: 'Answer questions about ticket, Jira, log, process observation, automation opportunity, human-agent role, and value-estimate evidence.',
    appliesToModules: ['home', 'intelligence', 'moves', 'tower', 'ava', 'context_layer_admin'],
    datasetFamilies: [
      'Operational Use Case Intake',
      'ServiceNow Ticket Extract',
      'Jira Delivery Extract',
      'App / CMDB Inventory',
      'Log / Event Summary',
      'Process Flow Observation',
      'AI Opportunity Backlog',
      'Value / Effort Estimate',
    ],
    extensionDimensions: [
      'operational:work_items',
      'operational:process_observations',
      'operational:events_logs',
      'operational:automation_opportunities',
      'operational:human_agent_controls',
      'operational:value_estimates',
    ],
    anchorsToUniversalDimensions: ['operations_service_management', 'applications_systems', 'ai_automation_footprint', 'kpis_outcome_evidence', 'context_relationships'],
    canonicalMetrics: ['incident_count', 'sla_breach_rate', 'reopen_rate', 'reassignment_rate', 'cycle_time', 'app_friction_score', 'automation_value_score', 'opportunity_feasibility_score'],
    requiredEvidenceTypes: ['ticket extract', 'delivery extract', 'CMDB/app inventory', 'log summary', 'process observation', 'value estimate'],
    joinStrategy: 'Anchor operational records to app_id/system_id, process_name, owner_team, opportunity_id, and evidence trace ids.',
    caveats: ['Synthetic demo operational evidence must be labeled and must not override client production truth.'],
    unsupportedQuestionBehavior: 'Ask for ticket/log/Jira/process/value evidence before ranking operational friction or automation value.',
  },
  {
    extensionId: 'moves_evidence_readiness',
    label: 'Moves Evidence Readiness',
    purpose: 'Score phase/deliverable readiness and bind approved context, caveats, feedback, and client-to-complete fields into artifact generation.',
    appliesToModules: ['moves', 'intelligence', 'ava'],
    datasetFamilies: ['move charter', 'phase gates', 'deliverable feedback', 'evidence readiness slots', 'solution context digest'],
    extensionDimensions: ['moves:evidence_slots', 'moves:phase_gates', 'moves:solution_context', 'moves:deliverable_feedback'],
    anchorsToUniversalDimensions: ['enterprise_profile', 'initiatives_portfolio', 'kpis_outcome_evidence', 'context_relationships'],
    canonicalMetrics: ['roadmap_readiness', 'record_count'],
    requiredEvidenceTypes: ['approved gate', 'phase artifact', 'feedback item', 'evidence slot score'],
    joinStrategy: 'Join by move_id, phase_id, deliverable_type, evidence_item_id, and approved context digest id.',
    caveats: ['Recommended and optional evidence improve quality but should not block draft generation unless a minimum required slot is missing.'],
    unsupportedQuestionBehavior: 'Disclose which phase, gate, deliverable, or evidence slot is missing.',
  },
  {
    extensionId: 'source_proposal_intelligence',
    label: 'Source Proposal Intelligence',
    purpose: 'Answer sourcing questions about requirements, vendor proposals, scorecards, pricing, risk, BAFOs, and decision evidence.',
    appliesToModules: ['source', 'intelligence', 'ava', 'moves'],
    datasetFamilies: ['requirements', 'vendor responses', 'pricing sheets', 'scorecards', 'risk registers', 'negotiation notes'],
    extensionDimensions: ['source:requirements', 'source:vendor_proposals', 'source:pricing', 'source:scorecards', 'source:decision_evidence'],
    anchorsToUniversalDimensions: ['vendors_contracts_licenses', 'it_budget_financials', 'applications_systems', 'security_risk_compliance', 'context_relationships'],
    canonicalMetrics: ['vendor_score', 'normalized_tco', 'governance_gap_count'],
    requiredEvidenceTypes: ['requirements matrix', 'proposal response', 'pricing workbook', 'risk evidence', 'scoring rationale'],
    joinStrategy: 'Join by event_id, vendor_id, requirement_id, artifact_code, pricing_line_id, and risk_id.',
    caveats: ['Do not compare vendors numerically unless scoring rules and proposal evidence are available.'],
    unsupportedQuestionBehavior: 'Ask for requirements, vendor response, pricing, or scoring evidence before recommending a vendor.',
  },
  {
    extensionId: 'rate_card_provenance',
    label: 'Rate Card Provenance',
    purpose: 'Govern estimate basis across client, vendor, internal, benchmark, and fallback planning rates.',
    appliesToModules: ['moves', 'source', 'tower', 'intelligence', 'ava'],
    datasetFamilies: ['client rate card', 'vendor quote', 'BAFO rate sheet', 'internal cost model', 'benchmark market rates', 'researched fallback rates'],
    extensionDimensions: ['rate_card:client_approved', 'rate_card:vendor_quote', 'rate_card:internal_cost', 'rate_card:benchmark_market', 'rate_card:fallback_planning'],
    anchorsToUniversalDimensions: ['it_budget_financials', 'vendors_contracts_licenses', 'kpis_outcome_evidence'],
    canonicalMetrics: ['normalized_tco', 'automation_value_score'],
    requiredEvidenceTypes: ['rate source', 'provenance', 'confidence', 'validation status', 'override status'],
    joinStrategy: 'Join estimate lines to rate_card_id, role_id, vendor_id, opportunity_id, move_id, and validation status.',
    caveats: ['Fallback and benchmark estimates must be labeled ROM and finance/client validation required.'],
    unsupportedQuestionBehavior: 'Do not produce precise funding estimates without rate provenance and validation caveats.',
  },
  {
    extensionId: 'ai_control_tower',
    label: 'AI Control Tower',
    purpose: 'Answer portfolio questions about AI initiatives, adoption, value, spend, risk, productivity, evidence, and actions.',
    appliesToModules: ['tower', 'home', 'intelligence', 'ava', 'moves'],
    datasetFamilies: ['initiative registry', 'tool usage', 'agent outcomes', 'persona productivity', 'DORA metrics', 'benefit realization', 'AI spend', 'risk governance', 'evidence items'],
    extensionDimensions: ['tower:ai_initiatives', 'tower:adoption_usage', 'tower:value_outcomes', 'tower:spend_contracts', 'tower:risk_governance', 'tower:productivity'],
    anchorsToUniversalDimensions: ['ai_automation_footprint', 'personas_workforce', 'initiatives_portfolio', 'it_budget_financials', 'security_risk_compliance', 'kpis_outcome_evidence'],
    canonicalMetrics: ['automation_value_score', 'workforce_adoption_rate', 'normalized_tco', 'governance_gap_count', 'roadmap_readiness'],
    requiredEvidenceTypes: ['portfolio item', 'usage/adoption row', 'value evidence', 'risk/control row', 'spend line'],
    joinStrategy: 'Join by initiative_id, ai_use_case_id, tool_id, persona_id, benefit_id, and control_id.',
    caveats: ['Tower views must disclose when read models are estimated, stale, or derived from synthetic templates.'],
    unsupportedQuestionBehavior: 'Ask for portfolio/adoption/value/risk evidence before claiming AI portfolio performance.',
  },
  {
    extensionId: 'healthcare_clinical_claims',
    label: 'Healthcare Clinical and Claims Overlay',
    purpose: 'Answer healthcare modernization questions across EHR, claims, pharmacy, quality, population health, provider performance, revenue cycle, and governance.',
    appliesToModules: ['moves', 'home', 'intelligence', 'ava', 'tower'],
    datasetFamilies: ['EHR extracts', 'claims', 'pharmacy', 'quality metrics', 'provider attribution', 'clinical workflow', 'FHIR/HL7 interfaces', 'HIPAA controls'],
    extensionDimensions: ['healthcare:ehr', 'healthcare:claims', 'healthcare:pharmacy', 'healthcare:quality', 'healthcare:provider_performance', 'healthcare:clinical_workflow'],
    anchorsToUniversalDimensions: ['data_analytics_estate', 'integrations_interfaces', 'kpis_outcome_evidence', 'security_risk_compliance', 'applications_systems', 'personas_workforce'],
    canonicalMetrics: ['data_quality_score', 'kpi_gap_to_target', 'governance_gap_count', 'roadmap_readiness'],
    requiredEvidenceTypes: ['clinical source inventory', 'claims source inventory', 'quality metric definition', 'lineage/control evidence', 'workflow notes'],
    joinStrategy: 'Join by patient/member-safe aggregate keys, provider_id, measure_id, app_id, data_product_id, and approved de-identified evidence ids.',
    caveats: ['PHI/PII answers must use approved de-identified or aggregate evidence and disclose missing lineage/quality controls.'],
    unsupportedQuestionBehavior: 'Do not infer clinical or claims metrics without approved source, measure definition, and governance evidence.',
  },
];

const catalogByDimension = new Map(SEMANTIC_DIMENSION_CATALOG.map((entry) => [entry.dimensionId, entry]));
const metricById = new Map(SEMANTIC_METRIC_REGISTRY.map((entry) => [entry.metricId, entry]));

export function getEnterpriseSemanticQuestionLayerContract(): EnterpriseSemanticQuestionLayerContract {
  return {
    ...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT,
    consumers: [...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT.consumers],
    moduleUseCases: { ...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT.moduleUseCases },
    responsibilities: [...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT.responsibilities],
    requiredAnswerSections: [...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT.requiredAnswerSections],
    unsupportedBehavior: [...ENTERPRISE_SEMANTIC_QUESTION_LAYER_CONTRACT.unsupportedBehavior],
  };
}

export function getSemanticDimensionCatalog(): SemanticDimensionContract[] {
  return SEMANTIC_DIMENSION_CATALOG.map((entry) => ({ ...entry, joinPaths: [...entry.joinPaths], citationRules: [...entry.citationRules] }));
}

export function getSemanticMetricRegistry(): SemanticMetricDefinition[] {
  return SEMANTIC_METRIC_REGISTRY.map((entry) => ({ ...entry }));
}

export function getSemanticExtensionRegistry(): SemanticExtensionContract[] {
  return SEMANTIC_EXTENSION_REGISTRY.map((entry) => ({
    ...entry,
    appliesToModules: [...entry.appliesToModules],
    datasetFamilies: [...entry.datasetFamilies],
    extensionDimensions: [...entry.extensionDimensions],
    anchorsToUniversalDimensions: [...entry.anchorsToUniversalDimensions],
    canonicalMetrics: [...entry.canonicalMetrics],
    requiredEvidenceTypes: [...entry.requiredEvidenceTypes],
    caveats: [...entry.caveats],
  }));
}

export function getSemanticDimension(dimensionId: SemanticDimensionId): SemanticDimensionContract {
  const entry = catalogByDimension.get(dimensionId);
  if (!entry) throw new Error(`Unknown semantic dimension: ${dimensionId}`);
  return entry;
}

function inferIntent(query: string): SemanticQuestionIntent {
  const q = query.toLowerCase();
  if (/\b(define|definition|what does|meaning)\b/.test(q)) return 'definition';
  if (/\b(top|highest|lowest|rank|ranking|most|least|leaderboard)\b/.test(q)) return 'ranking';
  if (/\b(compare|versus|vs\.?|difference|better|worse)\b/.test(q)) return 'comparison';
  if (/\b(trend|over time|month|quarter|year|improving|declining)\b/.test(q)) return 'trend';
  if (/\b(why|root cause|drivers?|cause|because)\b/.test(q)) return 'root_cause';
  if (/\b(evidence|cite|source|show me the proof|trace)\b/.test(q)) return 'evidence_lookup';
  if (/\b(automate|opportunity|pilot|recommend|what should we do|prioritize)\b/.test(q)) return 'opportunity_recommendation';
  if (/\b(gap|missing|readiness|quality issue)\b/.test(q)) return 'gap_analysis';
  if (/\b(how many|count|rate|score|metric|value|cost|savings|spend)\b/.test(q)) return 'metric_lookup';
  if (/\b(show|drill|break down)\b/.test(q)) return 'drill_down';
  return 'summary';
}

function scoreDimension(query: string, dimension: SemanticDimensionContract): number {
  const normalized = query.toLowerCase();
  let score = 0;
  for (const token of [dimension.businessName, dimension.dimensionId, ...dimension.synonyms, ...dimension.canonicalEntities]) {
    const term = token.toLowerCase().replaceAll('_', ' ');
    if (normalized.includes(term)) score += term.includes(' ') ? 4 : 2;
  }
  for (const question of dimension.businessQuestionsSupported) {
    for (const word of question.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length > 3)) {
      if (normalized.includes(word)) score += 1;
    }
  }
  return score;
}

function scoreExtension(query: string, extension: SemanticExtensionContract): number {
  const normalized = query.toLowerCase();
  let score = 0;
  for (const token of [
    extension.label,
    extension.purpose,
    ...extension.datasetFamilies,
    ...extension.extensionDimensions,
    ...extension.requiredEvidenceTypes,
  ]) {
    const term = token.toLowerCase().replaceAll('_', ' ').replaceAll(':', ' ');
    if (normalized.includes(term)) score += term.includes(' ') ? 4 : 2;
  }
  return score;
}

function selectSemanticExtensions(question: string, context: EnterpriseSemanticQuestionContext = {}): SemanticExtensionContract[] {
  const normalized = question.toLowerCase();
  const scored = SEMANTIC_EXTENSION_REGISTRY
    .map((extension) => {
      let score = scoreExtension(question, extension);
      if (context.requestedByModule && extension.appliesToModules.includes(context.requestedByModule)) score += 4;
      if (extension.extensionId === 'operational_evidence_process_intelligence' && /\b(ticket|servicenow|jira|log|bottleneck|friction|handoff|automate|process)\b/.test(normalized)) score += 8;
      if (extension.extensionId === 'moves_evidence_readiness' && /\b(move|phase|gate|artifact|deliverable|evidence readiness|charter|roadmap)\b/.test(normalized)) score += 8;
      if (extension.extensionId === 'source_proposal_intelligence' && /\b(source|sourcing|rfp|proposal|vendor|bafo|scorecard|pricing)\b/.test(normalized)) score += 8;
      if (extension.extensionId === 'rate_card_provenance' && /\b(rate card|estimate|rom|funding|finance validation|labor rate|cost basis)\b/.test(normalized)) score += 8;
      if (extension.extensionId === 'ai_control_tower' && /\b(ai portfolio|control tower|adoption|copilot|agent outcome|ai spend)\b/.test(normalized)) score += 8;
      if (extension.extensionId === 'healthcare_clinical_claims' && /\b(ehr|epic|claims|pharmacy|hedis|star|provider|clinical|hipaa|fhir|hl7)\b/.test(normalized)) score += 8;
      if (context.requestedByModule === 'moves' && /\b(what should we do|recommend|approach|roadmap|business case|artifact|move)\b/.test(normalized)) {
        if (extension.extensionId === 'moves_evidence_readiness') score += 10;
      }
      if (context.requestedByModule === 'source' && /\b(which vendor|why|recommend|pricing|score|risk|proposal)\b/.test(normalized)) {
        if (extension.extensionId === 'source_proposal_intelligence') score += 10;
      }
      if (context.requestedByModule === 'tower' && /\b(value|delivering|benefit|adoption|spend|risk|portfolio)\b/.test(normalized)) {
        if (extension.extensionId === 'ai_control_tower') score += 10;
      }
      if (context.requestedByModule === 'home' && /\b(what do we know|overview|summary|enterprise|context)\b/.test(normalized)) {
        if (extension.extensionId === 'operational_evidence_process_intelligence' || extension.extensionId === 'ai_control_tower') score += 4;
      }
      return { extension, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((entry) => entry.extension);
}

function inferMetrics(query: string, dimensions: SemanticDimensionContract[]): SemanticMetricDefinition[] {
  const normalized = query.toLowerCase();
  const selected = new Map<string, SemanticMetricDefinition>();
  for (const metricDefinition of SEMANTIC_METRIC_REGISTRY) {
    const nameTokens = [metricDefinition.metricId, metricDefinition.businessName, metricDefinition.description]
      .join(' ')
      .toLowerCase()
      .replaceAll('_', ' ');
    if (nameTokens.split(/[^a-z0-9]+/).some((token) => token.length > 4 && normalized.includes(token))) {
      selected.set(metricDefinition.metricId, metricDefinition);
    }
  }
  if (/\b(friction|bottleneck|handoff|rework|tickets?|incidents?|sla|reopen)\b/.test(normalized)) {
    for (const id of ['app_friction_score', 'incident_count', 'sla_breach_rate', 'reopen_rate', 'reassignment_rate']) {
      const metricDefinition = metricById.get(id);
      if (metricDefinition) selected.set(id, metricDefinition);
    }
  }
  if (/\b(automate|opportunity|pilot|value|savings|effort)\b/.test(normalized)) {
    for (const id of ['automation_value_score', 'opportunity_feasibility_score']) {
      const metricDefinition = metricById.get(id);
      if (metricDefinition) selected.set(id, metricDefinition);
    }
  }
  if (selected.size === 0) {
    for (const dimension of dimensions) {
      for (const metricId of dimension.canonicalMetrics.slice(0, 2)) {
        const metricDefinition = metricById.get(metricId);
        if (metricDefinition) selected.set(metricId, metricDefinition);
      }
    }
  }
  return [...selected.values()];
}

export function routeSemanticQuestion(question: string, context: EnterpriseSemanticQuestionContext = {}): RoutedSemanticQuestion {
  const intent = inferIntent(question);
  const extensions = selectSemanticExtensions(question, context);
  const scored = SEMANTIC_DIMENSION_CATALOG
    .map((dimension) => ({ dimension, score: scoreDimension(question, dimension) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const extensionAnchors = extensions.flatMap((extension) => extension.anchorsToUniversalDimensions).map(getSemanticDimension);
  const selectedDimensions = (scored.length > 0
    ? scored.slice(0, 4).map((entry) => entry.dimension)
    : extensionAnchors.length > 0
      ? extensionAnchors.slice(0, 4)
      : [getSemanticDimension('enterprise_profile')]);
  for (const anchor of extensionAnchors) {
    if (!selectedDimensions.some((dimension) => dimension.dimensionId === anchor.dimensionId)) selectedDimensions.push(anchor);
  }
  const selectedMetricMap = new Map(inferMetrics(question, selectedDimensions).map((metricDefinition) => [metricDefinition.metricId, metricDefinition]));
  for (const extension of extensions) {
    for (const metricId of extension.canonicalMetrics) {
      const metricDefinition = metricById.get(metricId);
      if (metricDefinition) selectedMetricMap.set(metricDefinition.metricId, metricDefinition);
    }
  }
  const selectedMetrics = [...selectedMetricMap.values()];
  const joins = selectedDimensions.flatMap((dimension) => dimension.joinPaths);
  const confidence: SemanticConfidence = scored.length >= 2 || selectedMetrics.length > 0 ? 'high' : scored.length === 1 ? 'medium' : 'low';
  const clarificationNeeded = confidence === 'low' ? ['Which business area, dimension, or metric should this question use?'] : [];

  return {
    question,
    requestedByModule: context.requestedByModule,
    intent,
    dimensions: selectedDimensions.map((dimension) => dimension.dimensionId),
    semanticExtensions: extensions.map((extension) => extension.extensionId),
    entities: [...new Set(selectedDimensions.flatMap((dimension) => dimension.canonicalEntities))],
    metrics: selectedMetrics.map((metricDefinition) => metricDefinition.metricId),
    filters: {},
    requiredJoins: joins,
    confidence,
    clarificationNeeded,
    suggestedQueryPlan: selectedMetrics.length > 0
      ? `Use structured metrics ${selectedMetrics.map((metricDefinition) => metricDefinition.metricId).join(', ')} before narrative synthesis.`
      : 'Retrieve cited evidence and label the answer as an evidence summary.',
  };
}

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,%]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
};

function evidenceFromRecords(records: SemanticRecord[], limit = 5): SemanticEvidenceResult[] {
  return records.slice(0, limit).map((record) => ({
    sourceType: record.sourceType,
    sourceFileTableOrView: record.sourceName,
    recordId: record.id,
    excerptOrRowSummary: Object.entries(record.fields)
      .slice(0, 6)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('; '),
    confidence: record.confidence ?? (record.synthetic ? 0.72 : 0.86),
    freshness: record.freshness ?? 'freshness not supplied',
    citationReference: record.citation ?? `${record.sourceName}#${record.id}`,
    caveat: record.synthetic ? 'Synthetic demo evidence - not client-approved production truth' : undefined,
  }));
}

function computeFacts(route: RoutedSemanticQuestion, records: SemanticRecord[]): ComputedSemanticFact[] {
  const facts: ComputedSemanticFact[] = [];
  const scoped = records.filter((record) => route.dimensions.includes(record.dimensionId));
  const sourceRecordIds = scoped.map((record) => record.id);

  if (route.metrics.includes('incident_count')) {
    facts.push({ metricId: 'incident_count', label: 'Incident count', value: scoped.length, unit: 'count', sourceRecordIds });
  }
  if (route.metrics.includes('sla_breach_rate')) {
    const total = scoped.length;
    const breaches = scoped.filter((record) => asNumber(record.fields.sla_breached ?? record.fields.sla_breach_count) > 0).length;
    facts.push({ metricId: 'sla_breach_rate', label: 'SLA breach rate', value: total === 0 ? 0 : Math.round((breaches / total) * 100), unit: 'percent', sourceRecordIds });
  }
  if (route.metrics.includes('reopen_rate')) {
    const total = scoped.length;
    const reopened = scoped.filter((record) => asNumber(record.fields.reopened_count ?? record.fields.reopen_count) > 0).length;
    facts.push({ metricId: 'reopen_rate', label: 'Reopen rate', value: total === 0 ? 0 : Math.round((reopened / total) * 100), unit: 'percent', sourceRecordIds });
  }
  if (route.metrics.includes('app_friction_score')) {
    const byApp = new Map<string, { score: number; recordIds: string[]; name: string }>();
    for (const record of records) {
      const appId = String(record.fields.app_id ?? record.fields.system_id ?? record.fields.application_id ?? record.fields.name ?? 'unknown');
      const name = String(record.fields.app_name ?? record.fields.name ?? appId);
      const current = byApp.get(appId) ?? { score: 0, recordIds: [], name };
      current.score +=
        asNumber(record.fields.incident_count ?? (record.dimensionId === 'operations_service_management' ? 1 : 0)) +
        asNumber(record.fields.sla_breach_count ?? record.fields.sla_breached) * 4 +
        asNumber(record.fields.reopen_count ?? record.fields.reopened_count) * 3 +
        asNumber(record.fields.reassignment_count) * 1.5 +
        asNumber(record.fields.linked_event_count) +
        (record.fields.owner_role || record.fields.it_owner_team ? 0 : 5);
      current.recordIds.push(record.id);
      byApp.set(appId, current);
    }
    const top = [...byApp.values()].sort((a, b) => b.score - a.score)[0];
    if (top) {
      facts.push({
        metricId: 'app_friction_score',
        label: `Top application friction score: ${top.name}`,
        value: Math.round(top.score),
        unit: 'score',
        sourceRecordIds: top.recordIds,
      });
    }
  }
  if (route.metrics.includes('record_count') && facts.length === 0) {
    facts.push({ metricId: 'record_count', label: 'Record count', value: scoped.length, unit: 'count', sourceRecordIds });
  }

  return facts;
}

export function planSemanticQuestion(question: string, records: SemanticRecord[] = [], context: EnterpriseSemanticQuestionContext = {}): SemanticQueryPlan {
  const route = routeSemanticQuestion(question, context);
  const selectedDimensions = route.dimensions.map(getSemanticDimension);
  const selectedMetrics = route.metrics.map((metricId) => metricById.get(metricId)).filter(Boolean) as SemanticMetricDefinition[];
  const hasStructuredMetricIntent = ['metric_lookup', 'ranking', 'comparison', 'trend', 'root_cause', 'opportunity_recommendation', 'gap_analysis'].includes(route.intent);
  const computedFacts = records.length > 0 ? computeFacts(route, records) : [];
  const executionMode: SemanticExecutionMode =
    route.clarificationNeeded.length > 0
      ? 'unsupported'
      : hasStructuredMetricIntent && selectedMetrics.length > 0
        ? 'structured_metric'
        : records.length > 0
          ? 'structured_summary'
          : 'evidence_summary';

  const evidenceRecords = records.filter((record) => route.dimensions.includes(record.dimensionId));
  const caveats = [
    ...new Set([
      ...selectedDimensions.flatMap((dimension) => dimension.caveats),
      ...(records.some((record) => record.synthetic || record.sourceType === 'synthetic_demo') ? ['Synthetic demo evidence is not client-approved production truth.'] : []),
      ...(records.length === 0 ? ['No structured rows were supplied to this planner run; answer must not claim computed numeric precision.'] : []),
    ]),
  ];

  return {
    route,
    executionMode,
    selectedMetrics,
    selectedDimensions,
    sourceTablesOrViews: [...new Set(selectedDimensions.flatMap((dimension) => dimension.sourceTablesOrViews))],
    evidence: evidenceFromRecords(evidenceRecords.length > 0 ? evidenceRecords : records),
    computedFacts,
    unsupportedReason: route.clarificationNeeded[0],
    caveats,
    confidence: computedFacts.length > 0 ? route.confidence : records.length > 0 ? 'medium' : 'low',
  };
}

export function composeSemanticAnswer(plan: SemanticQueryPlan): SemanticAnswer {
  const topFact =
    plan.route.intent === 'ranking'
      ? plan.computedFacts.find((fact) => /score|rank|leaderboard|friction/.test(fact.metricId)) ?? plan.computedFacts[0]
      : plan.computedFacts[0];
  const metricNames = plan.selectedMetrics.map((metricDefinition) => metricDefinition.businessName).join(', ');
  const dimensionNames = plan.selectedDimensions.map((dimension) => dimension.businessName).join(', ');
  const directAnswer = topFact
    ? `${topFact.label} is ${topFact.value}${topFact.unit === 'percent' ? '%' : topFact.unit === 'currency' ? ' USD' : ''}, based on ${topFact.sourceRecordIds.length} cited source record${topFact.sourceRecordIds.length === 1 ? '' : 's'}.`
    : plan.executionMode === 'unsupported'
      ? `I need more context before answering: ${plan.unsupportedReason ?? 'the question did not map to a governed semantic dimension.'}`
      : `I can answer this as an evidence summary for ${dimensionNames}, but no computed metric result was available in this run.`;

  const answerWithoutVerification: Omit<SemanticAnswer, 'verification'> = {
    serviceName: 'Enterprise Semantic Question Layer',
    requestedByModule: plan.route.requestedByModule,
    directAnswer,
    basis: plan.selectedMetrics.length > 0
      ? `Basis: ${plan.selectedMetrics.map((metricDefinition) => `${metricDefinition.businessName} = ${metricDefinition.formula}`).join('; ')}.`
      : `Basis: cited evidence summary over ${dimensionNames}.`,
    whyItMatters: `This keeps aVa grounded in governed semantic dimensions (${dimensionNames}) and uses ${metricNames || 'cited evidence'} before narrative synthesis.`,
    evidence: plan.evidence,
    caveats: plan.caveats,
    confidence: plan.confidence,
    freshness: plan.evidence[0]?.freshness ?? 'freshness not supplied',
    recommendedNextAction: topFact
      ? 'Review the cited records, confirm missing evidence caveats, then promote the result into the relevant Move, Source event, or Home insight.'
      : 'Load or approve structured evidence for this dimension before using numeric claims.',
    askNext: [
      'Show the source records behind this answer',
      'Break this down by owner or business function',
      'Create an automation opportunity from this',
      'Add this to a Move',
    ],
    metricDefinitions: plan.selectedMetrics,
  };

  const verification = verifySemanticAnswer(answerWithoutVerification.directAnswer, plan);
  return { ...answerWithoutVerification, verification };
}

export function verifySemanticAnswer(answerText: string, plan: SemanticQueryPlan): SemanticAnswerVerification {
  const checkedNumbers = answerText.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  const allowedNumbers = new Set<string>();
  for (const fact of plan.computedFacts) {
    if (typeof fact.value === 'number') allowedNumbers.add(String(fact.value));
    allowedNumbers.add(String(fact.sourceRecordIds.length));
  }
  const issues: string[] = [];
  for (const number of checkedNumbers) {
    if (!allowedNumbers.has(number)) issues.push(`Unsupported number in answer: ${number}`);
  }
  if (/\b(top|highest|lowest|rank|ranking|most|least)\b/i.test(answerText) && plan.executionMode !== 'structured_metric') {
    issues.push('Ranking language requires a structured metric plan.');
  }
  if (plan.selectedMetrics.some((metricDefinition) => !metricById.has(metricDefinition.metricId))) {
    issues.push('Answer references a metric that is not registered.');
  }
  if (plan.confidence === 'low' && !/\b(low confidence|limited|missing|need more context)\b/i.test(answerText)) {
    issues.push('Low-confidence answer must disclose its limitation.');
  }
  if (plan.caveats.some((caveat) => caveat.toLowerCase().includes('synthetic')) && !/\bsynthetic|demo\b/i.test(`${answerText} ${plan.caveats.join(' ')}`)) {
    issues.push('Synthetic/demo evidence must be labeled.');
  }
  return { passed: issues.length === 0, issues, checkedNumbers };
}

export function answerSemanticQuestion(question: string, records: SemanticRecord[] = [], context: EnterpriseSemanticQuestionContext = {}): SemanticAnswer {
  return composeSemanticAnswer(planSemanticQuestion(question, records, context));
}

export function answerEnterpriseSemanticQuestion(request: EnterpriseSemanticQuestionRequest): EnterpriseSemanticQuestionResponse {
  const context: EnterpriseSemanticQuestionContext = {
    requestedByModule: request.requestedByModule,
    tenantKey: request.tenantKey,
    userId: request.userId,
  };
  const plan = planSemanticQuestion(request.question, request.records ?? [], context);
  const answer = composeSemanticAnswer(plan);
  return {
    serviceName: 'Enterprise Semantic Question Layer',
    requestedByModule: request.requestedByModule,
    moduleUseCase: request.requestedByModule ? ENTERPRISE_SEMANTIC_MODULE_USE_CASES[request.requestedByModule] : undefined,
    answer,
    plan,
  };
}

export const SEMANTIC_GOLDEN_QUESTIONS: SemanticGoldenQuestion[] = SEMANTIC_DIMENSION_CATALOG.flatMap((dimension) =>
  dimension.businessQuestionsSupported.slice(0, 5).map((question, index) => ({
    id: `${dimension.dimensionId}-q${index + 1}`,
    question,
    expectedIntent: inferIntent(question),
    expectedDimensions: [dimension.dimensionId],
    expectedMetrics: dimension.canonicalMetrics.slice(0, 2),
    expectedAnswerShape: ['direct answer', 'evidence citations', 'confidence', 'caveats', 'ask next'],
    requiredCitationBehavior: dimension.citationRules[0]?.format ?? sharedCitationRule.format,
    unsupportedCaveatBehavior: dimension.unsupportedQuestionBehavior,
  })),
);

export function auditSemanticLayerReadiness(): {
  dimensionCount: number;
  extensionCount: number;
  extensionDimensionCount: number;
  metricCount: number;
  goldenQuestionCount: number;
  missingMetrics: Array<{ dimensionId: SemanticDimensionId; metricId: string }>;
} {
  const missingMetrics: Array<{ dimensionId: SemanticDimensionId; metricId: string }> = [];
  for (const dimension of SEMANTIC_DIMENSION_CATALOG) {
    for (const metricId of dimension.canonicalMetrics) {
      if (!metricById.has(metricId)) missingMetrics.push({ dimensionId: dimension.dimensionId, metricId });
    }
  }
  return {
    dimensionCount: SEMANTIC_DIMENSION_CATALOG.length,
    extensionCount: SEMANTIC_EXTENSION_REGISTRY.length,
    extensionDimensionCount: SEMANTIC_EXTENSION_REGISTRY.reduce((sum, extension) => sum + extension.extensionDimensions.length, 0),
    metricCount: SEMANTIC_METRIC_REGISTRY.length,
    goldenQuestionCount: SEMANTIC_GOLDEN_QUESTIONS.length,
    missingMetrics,
  };
}
