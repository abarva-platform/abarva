// SOL4 · Analytics Modernization Solution Component Pack.
//
// Pure deterministic library naming the canonical components of an
// analytics modernization initiative. Programs, Atlas, and Steward can
// subscribe to this pack to recommend, sequence, and govern analytics
// modernization components without inventing them at runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, or read tenant state. Recommendations are pure
// substring overlap on the input.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type AnalyticsModernizationComponentKey =
  | 'data_platform_assessment'
  | 'cloud_lakehouse_foundation'
  | 'semantic_layer_design'
  | 'master_data_management'
  | 'data_quality_observability'
  | 'reporting_rationalization'
  | 'ai_ready_feature_store'
  | 'data_governance_operating_model'
  | 'metadata_catalog_lineage'
  | 'self_service_analytics_enablement'
  | 'legacy_platform_decommission'
  | 'value_case_and_migration_roadmap';

export interface AnalyticsModernizationComponent {
  key: AnalyticsModernizationComponentKey;
  name: string;
  definition: string;
  problemSolved: string;
  requiredCurrentStateInputs: ReadonlyArray<string>;
  targetCapabilities: ReadonlyArray<string>;
  architectureBuildingBlocks: ReadonlyArray<string>;
  governanceRequirements: ReadonlyArray<string>;
  implementationSteps: ReadonlyArray<string>;
  expectedOutcomes: ReadonlyArray<string>;
  risks: ReadonlyArray<string>;
  requiredWorkshops: ReadonlyArray<string>;
  deliverablesProduced: ReadonlyArray<string>;
  createdFrom: 'deterministic_solution_component_pack';
}

export interface AnalyticsModernizationComponentPackSummary {
  totalCount: number;
  uniqueArchitectureBlocks: ReadonlyArray<string>;
  uniqueWorkshops: ReadonlyArray<string>;
  uniqueDeliverables: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Component pack
// ---------------------------------------------------------------------

const PACK: Record<AnalyticsModernizationComponentKey, AnalyticsModernizationComponent> = {
  data_platform_assessment: {
    key: 'data_platform_assessment',
    name: 'Data platform assessment',
    definition:
      'Structured current-state assessment of data platforms, warehouses, marts, ETL, and reporting estates that establishes the modernization baseline and target architecture options.',
    problemSolved:
      'Modernization programs start without a defensible baseline; legacy estates are partially mapped; modernization options are debated without inventory.',
    requiredCurrentStateInputs: [
      'Inventory of data platforms, warehouses, lakes, and marts in production',
      'List of ingestion pipelines with named owner and refresh cadence',
      'Reporting estate export with owner, frequency, and consumer count per report',
    ],
    targetCapabilities: [
      'Defensible baseline of platforms, pipelines, and reports across the estate',
      'Target architecture options graded against the baseline with named trade-offs',
      'Modernization scope agreed with sponsor before architecture work begins',
    ],
    architectureBuildingBlocks: [
      'Platform inventory worksheet',
      'Pipeline-to-report dependency map',
      'Target architecture option pack',
    ],
    governanceRequirements: [
      'Named sponsor sign-off on the assessment scope and baseline',
      'Architecture review board review of target architecture options before selection',
    ],
    implementationSteps: [
      'Capture the platform, pipeline, and reporting inventory from the source systems',
      'Interview platform owners and consumers to validate the inventory',
      'Author the target architecture option pack with named trade-offs',
      'Run the sponsor review and capture the agreed scope',
    ],
    expectedOutcomes: [
      'Modernization program starts with a defensible baseline',
      'Target architecture options are graded against the baseline rather than asserted',
    ],
    risks: [
      'Assessment becomes shelfware if the sponsor is not engaged through the option grading',
      'Inventory drifts during modernization if owners are not named for refresh',
    ],
    requiredWorkshops: ['current_state_discovery', 'architecture_solution_design'],
    deliverablesProduced: [
      'Platform inventory worksheet',
      'Pipeline-to-report dependency map',
      'Target architecture option pack',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  cloud_lakehouse_foundation: {
    key: 'cloud_lakehouse_foundation',
    name: 'Cloud lakehouse foundation',
    definition:
      'Cloud-native lakehouse foundation combining open table formats, separation of storage and compute, and governed zones (raw, curated, presentation) as the modernization landing platform.',
    problemSolved:
      'Legacy warehouses and marts cannot scale to AI / streaming / cross-domain analytics workloads; storage and compute are coupled; governance is bolt-on rather than zoned.',
    requiredCurrentStateInputs: [
      'Cloud provider strategy and named landing region',
      'Existing warehouse / mart workload profile (concurrency, storage, peak compute)',
      'Network and security posture for the target landing zone',
    ],
    targetCapabilities: [
      'Storage and compute scale independently per workload',
      'Open table formats enable cross-engine access without lock-in',
      'Governed zones enforce promotion rules from raw through presentation',
    ],
    architectureBuildingBlocks: [
      'Object storage with open table format (Iceberg / Delta / Hudi)',
      'Decoupled compute engines for SQL, streaming, and ML',
      'Zone-based promotion policies (raw, curated, presentation)',
    ],
    governanceRequirements: [
      'Named platform owner with sign-off on zone promotion rules',
      'Security review of network, encryption, and key-management posture before any production load',
    ],
    implementationSteps: [
      'Stand up the landing zone with object storage and the chosen table format',
      'Wire the first decoupled compute engines (SQL + streaming) with shared catalog',
      'Encode the zone-based promotion policy as policy-as-code',
      'Migrate one reference workload end-to-end before broader rollout',
    ],
    expectedOutcomes: [
      'New workloads land on the lakehouse rather than expanding the legacy warehouse',
      'Cross-engine access becomes the default for curated zones',
    ],
    risks: [
      'Lakehouse becomes a swamp if zone-promotion rules are not enforced',
      'Cost runaway if compute autoscaling is not bounded per workload',
    ],
    requiredWorkshops: ['architecture_solution_design', 'data_foundation_assessment'],
    deliverablesProduced: [
      'Lakehouse landing-zone architecture document',
      'Zone-promotion policy-as-code',
      'Reference workload migration report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  semantic_layer_design: {
    key: 'semantic_layer_design',
    name: 'Semantic layer design',
    definition:
      'Versioned semantic layer that captures business metrics, dimensions, and join paths once so reporting, self-service, and AI consumers see the same numbers.',
    problemSolved:
      'Every report redefines the same metric; numbers disagree across decks; AI consumers invent metric definitions because the canonical layer does not exist.',
    requiredCurrentStateInputs: [
      'Inventory of metrics referenced in executive decks and operational reports',
      'List of conformed dimensions in current use and the systems they originate from',
      'Sample of historical metric disputes with root-cause notes',
    ],
    targetCapabilities: [
      'Metric definitions live in a versioned semantic layer with named owners',
      'Reporting, self-service, and AI consumers query the same definitions',
      'Metric disputes can be traced to a definition diff rather than tribal disagreement',
    ],
    architectureBuildingBlocks: [
      'Semantic-layer engine (dbt Semantic Layer / Cube / Looker / equivalent)',
      'Versioned metric repository with code review',
      'Conformed dimension catalog with named stewards',
    ],
    governanceRequirements: [
      'Named metric owner per business domain with sign-off authority on definition changes',
      'Change to a metric definition requires architecture decision record sign-off',
    ],
    implementationSteps: [
      'Inventory the most-referenced metrics and conformed dimensions',
      'Encode the metrics in the semantic-layer engine with named owners',
      'Wire the top reporting tools and self-service consumers to query the semantic layer',
      'Retire the duplicated definitions in legacy reports per quarter',
    ],
    expectedOutcomes: [
      'Reporting and self-service consumers agree on metric values',
      'Metric disputes resolve via definition diff, not opinion',
    ],
    risks: [
      'Semantic layer drifts if metric owners are not named per domain',
      'Adoption stalls if downstream consumers cannot retire their duplicate definitions',
    ],
    requiredWorkshops: ['architecture_solution_design', 'use_case_framing'],
    deliverablesProduced: [
      'Metric and dimension inventory',
      'Semantic-layer repository seed',
      'Quarterly metric-definition change log',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  master_data_management: {
    key: 'master_data_management',
    name: 'Master data management',
    definition:
      'Canonical mastering of high-leverage entities (customer, product, supplier, asset) with named stewards, survivorship rules, and downstream propagation into curated zones.',
    problemSolved:
      'Reports and AI features carry duplicate or conflicting entity records; survivorship is implicit; downstream defects trace to mastering gaps that no one owns.',
    requiredCurrentStateInputs: [
      'Inventory of source systems publishing each high-leverage entity',
      'Existing matching / dedupe logic per entity (where any exists)',
      'Sample of historical defects traced to mastering gaps',
    ],
    targetCapabilities: [
      'Each high-leverage entity has a named steward and survivorship rule set',
      'Curated zones receive the mastered record rather than per-source duplicates',
      'Downstream AI features and reports reference the mastered entity by stable identifier',
    ],
    architectureBuildingBlocks: [
      'Master data management hub (Reltio / Informatica MDM / open MDM)',
      'Match and survivorship rule repository under code review',
      'Stable-identifier propagation pipeline into curated zones',
    ],
    governanceRequirements: [
      'Named domain steward per high-leverage entity with sign-off authority',
      'Architecture decision record required for survivorship rule changes',
    ],
    implementationSteps: [
      'Pick the highest-leverage entity and stand up the steward role',
      'Encode the match and survivorship rules with explicit ownership',
      'Wire the curated zone to consume the mastered record',
      'Retire the per-source duplicates in downstream consumers per quarter',
    ],
    expectedOutcomes: [
      'Defect rate from mastering gaps falls on the prioritized entities',
      'AI features and reports anchor on the mastered identifier',
    ],
    risks: [
      'Mastering rules become unmaintainable without named stewards',
      'Downstream consumers route around the mastered record if propagation lags',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Steward roster per high-leverage entity',
      'Match and survivorship rule set',
      'Curated-zone mastered-record propagation report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  data_quality_observability: {
    key: 'data_quality_observability',
    name: 'Data quality and observability',
    definition:
      'Captured data quality expectations, freshness service-level objectives, and pipeline observability so consumers can trust the curated zones and incidents are caught upstream.',
    problemSolved:
      'Data quality is asserted but not measured; pipeline incidents are surfaced by downstream consumers; trust in curated outputs erodes over time.',
    requiredCurrentStateInputs: [
      'Inventory of curated tables and their declared consumers',
      'Existing data-quality checks and where they run today',
      'Sample of historical incidents traced to pipeline freshness or completeness gaps',
    ],
    targetCapabilities: [
      'Every curated table carries declared quality expectations and freshness service-level objectives',
      'Pipeline observability surfaces incidents upstream of the consumer',
      'Consumers can self-serve current quality status before using a table',
    ],
    architectureBuildingBlocks: [
      'Data-quality testing framework (Great Expectations / dbt tests / equivalent)',
      'Pipeline observability platform (Monte Carlo / Bigeye / open-source equivalent)',
      'Quality status surface readable by downstream consumers',
    ],
    governanceRequirements: [
      'Named owner per curated table with sign-off on quality expectations',
      'Incident response playbook with severity tiers and named on-call rotation',
    ],
    implementationSteps: [
      'Capture quality expectations on the top-consumed curated tables',
      'Wire the testing framework into the pipeline orchestrator',
      'Stand up the observability platform and route alerts to the on-call rotation',
      'Publish the quality status surface to downstream consumers',
    ],
    expectedOutcomes: [
      'Incidents are detected upstream of the consumer rather than reported by them',
      'Trust in curated zones rises as quality status becomes legible',
    ],
    risks: [
      'Alert fatigue if expectations are not tuned per table',
      'Quality expectations become checkbox theater without owner accountability',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Quality expectation set per curated table',
      'Observability alert routing matrix',
      'Quarterly data-quality posture report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  reporting_rationalization: {
    key: 'reporting_rationalization',
    name: 'Reporting rationalization',
    definition:
      'Structured rationalization of legacy reports, dashboards, and extracts so the modernized estate carries only the reports with named consumers and decision impact.',
    problemSolved:
      'Legacy reporting estates carry duplicate, abandoned, and orphaned reports; modernization migrates the estate as-is and inherits the cruft; consumer signal is lost.',
    requiredCurrentStateInputs: [
      'Reporting estate export with owner, frequency, and consumer count per report',
      'Consumer interview sample for the top-by-volume reports',
      'Mapping of reports to the metrics and tables they consume',
    ],
    targetCapabilities: [
      'Reports carry a named consumer cohort and a decision they support',
      'Duplicate and orphaned reports are retired before migration',
      'Modernized estate is smaller, named, and traceable to decisions',
    ],
    architectureBuildingBlocks: [
      'Report inventory worksheet with consumer and decision columns',
      'Retirement decision register with named approver',
      'Migration backlog scoped to surviving reports',
    ],
    governanceRequirements: [
      'Named sponsor sign-off on the retirement decisions',
      'Consumer cohort confirmation on every retained report before migration',
    ],
    implementationSteps: [
      'Capture the reporting estate with usage telemetry and ownership',
      'Run the consumer interviews on the top-by-volume reports',
      'Retire duplicates and orphans with sponsor sign-off',
      'Author the migration backlog scoped to the surviving reports',
    ],
    expectedOutcomes: [
      'Modernized estate is materially smaller and tied to decisions',
      'Migration scope shrinks because cruft does not travel forward',
    ],
    risks: [
      'Retirements get reversed if consumer cohorts are not actually confirmed',
      'Migration list grows if decision-impact discipline lapses',
    ],
    requiredWorkshops: ['use_case_framing', 'value_framing'],
    deliverablesProduced: [
      'Report inventory worksheet',
      'Retirement decision register',
      'Modernization migration backlog',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_ready_feature_store: {
    key: 'ai_ready_feature_store',
    name: 'AI-ready feature store',
    definition:
      'Versioned feature store that hosts curated features for AI / ML consumers with offline / online parity, lineage to the source pipelines, and named owners per feature group.',
    problemSolved:
      'AI / ML teams rebuild features per project; offline / online drift causes silent model regressions; feature lineage is undocumented and review is per-team.',
    requiredCurrentStateInputs: [
      'Inventory of in-flight AI / ML projects and the features they need',
      'Existing feature engineering code per project (where any exists)',
      'Source pipeline map for the features in scope',
    ],
    targetCapabilities: [
      'Features are reused across AI / ML projects rather than rebuilt per team',
      'Offline / online parity is enforced for features serving production models',
      'Lineage from feature back to the source pipeline is captured and reviewable',
    ],
    architectureBuildingBlocks: [
      'Feature store (Feast / Tecton / Vertex AI Feature Store / equivalent)',
      'Offline / online parity validation harness',
      'Feature-group ownership registry under code review',
    ],
    governanceRequirements: [
      'Named owner per feature group with sign-off authority on definition changes',
      'Responsible-AI review when features touch regulated decisions',
    ],
    implementationSteps: [
      'Pick the highest-leverage feature group and stand up the owner role',
      'Encode the feature definitions and lineage into the store',
      'Wire the parity validation harness into the deployment pipeline',
      'Promote the feature group to production after parity baseline is acceptable',
    ],
    expectedOutcomes: [
      'AI / ML projects reuse features rather than rebuild',
      'Silent feature drift falls as parity validation runs on every deployment',
    ],
    risks: [
      'Feature store becomes a graveyard if owners are not named per feature group',
      'Parity validation becomes checkbox theater without coverage discipline',
    ],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review'],
    deliverablesProduced: [
      'Feature group ownership registry',
      'Parity validation report per pilot',
      'Feature-store rollout playbook',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  data_governance_operating_model: {
    key: 'data_governance_operating_model',
    name: 'Data governance operating model',
    definition:
      'Captured operating model for data governance covering domain stewardship, escalation paths, decision rights, and review cadence so governance scales with the modernized estate.',
    problemSolved:
      'Governance is asserted in policy documents but lacks named stewards, decision rights, and review cadence; escalation paths exist only in tribal knowledge.',
    requiredCurrentStateInputs: [
      'List of in-flight governance policies and their authoring owners',
      'Existing steward roster (where any exists) per domain',
      'Sample of escalations that did or did not surface to the right authority',
    ],
    targetCapabilities: [
      'Each domain carries a named steward and a documented decision-rights matrix',
      'Escalation paths are documented and rehearsed quarterly',
      'Review cadence is honored and policy drift is caught early',
    ],
    architectureBuildingBlocks: [
      'Domain stewardship roster',
      'Decision-rights matrix per domain',
      'Quarterly review cadence calendar',
    ],
    governanceRequirements: [
      'Sponsor sign-off on the operating model before publication',
      'Quarterly review cadence audit with named authority',
    ],
    implementationSteps: [
      'Inventory the existing policies, stewards, and escalations',
      'Author the decision-rights matrix per domain with sponsor sign-off',
      'Stand up the quarterly review cadence and publish the calendar',
      'Audit the cadence after the first two quarters and tune the matrix',
    ],
    expectedOutcomes: [
      'Governance scales beyond the initial policy authors',
      'Escalations reach the right authority without tribal routing',
    ],
    risks: [
      'Operating model becomes shelfware without sponsor accountability',
      'Steward rotation drift if no quarterly review is honored',
    ],
    requiredWorkshops: ['governance_risk_review', 'operating_model_alignment'],
    deliverablesProduced: [
      'Decision-rights matrix per domain',
      'Domain stewardship roster',
      'Quarterly governance review report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  metadata_catalog_lineage: {
    key: 'metadata_catalog_lineage',
    name: 'Metadata catalog and lineage',
    definition:
      'Active metadata catalog that captures table, column, and pipeline lineage across the modernized estate with named owners so consumers and auditors can trace any number to its source.',
    problemSolved:
      'Lineage exists only in pipeline code; consumers and auditors cannot trace a number to its source; impact analysis is manual and slow.',
    requiredCurrentStateInputs: [
      'Inventory of pipelines in production with current lineage notes',
      'Existing catalog (where any exists) with coverage estimate',
      'Sample of historical impact-analysis efforts and their effort cost',
    ],
    targetCapabilities: [
      'Every curated table and column carries lineage to its source',
      'Consumers and auditors can trace any number to its origin in self-service',
      'Impact analysis on a proposed change is fast and evidence-led',
    ],
    architectureBuildingBlocks: [
      'Active metadata catalog (DataHub / OpenMetadata / Atlan / equivalent)',
      'Lineage extraction from the orchestrator and the SQL engine',
      'Owner-of-record tagging at the table and column level',
    ],
    governanceRequirements: [
      'Named owner per cataloged domain with sign-off on lineage publication',
      'Architecture decision record required when lineage extraction approach changes',
    ],
    implementationSteps: [
      'Stand up the catalog and seed it with the highest-leverage domain',
      'Wire the lineage extraction from the orchestrator and SQL engine',
      'Tag owners at the table and column level for the seeded domain',
      'Open self-service access to consumers and auditors',
    ],
    expectedOutcomes: [
      'Impact analysis becomes evidence-led rather than manual',
      'Audit posture improves because lineage is queryable',
    ],
    risks: [
      'Catalog drifts if owners are not named per domain',
      'Self-service trust erodes after one bad lineage answer',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Catalog domain seed report',
      'Lineage extraction architecture document',
      'Quarterly catalog coverage report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  self_service_analytics_enablement: {
    key: 'self_service_analytics_enablement',
    name: 'Self-service analytics enablement',
    definition:
      'Captured enablement program that equips business analysts and decision-makers to author analyses on the modernized estate without rebuilding the semantic layer or pipelines.',
    problemSolved:
      'Self-service is asserted but blocked by missing semantic layer, sparse training, and unclear escalation; analysts route around governance to ship analyses.',
    requiredCurrentStateInputs: [
      'List of analyst cohorts and the tools they currently use',
      'Existing training assets and the cohort coverage they reach',
      'Sample of in-flight analyses that are blocked or routed around governance',
    ],
    targetCapabilities: [
      'Analysts author analyses on the semantic layer without rebuilding metrics',
      'Training assets cover the semantic layer, governance, and escalation paths',
      'Escalation from self-service to governed change is clear and rehearsed',
    ],
    architectureBuildingBlocks: [
      'Self-service tooling integrated with the semantic layer',
      'Cohort-based training curriculum with named instructor',
      'Escalation path from self-service to governed change',
    ],
    governanceRequirements: [
      'Named sponsor of the enablement program with sign-off on cohort coverage',
      'Privacy review of analyst tool access before any sensitive domain is opened',
    ],
    implementationSteps: [
      'Inventory the analyst cohorts and the tools they use today',
      'Author the cohort-based training curriculum tied to the semantic layer',
      'Pilot enablement with one cohort and measure analysis-blocked rate before and after',
      'Roll out to broader cohorts after the pilot baseline shifts',
    ],
    expectedOutcomes: [
      'Analyst cohorts ship analyses on the semantic layer rather than route around it',
      'Blocked-analysis rate falls as escalation paths become clear',
    ],
    risks: [
      'Enablement becomes one-off training without cohort follow-up',
      'Self-service drifts away from governance if escalation paths are not honored',
    ],
    requiredWorkshops: ['adoption_change_readiness', 'use_case_framing'],
    deliverablesProduced: [
      'Cohort-based training curriculum',
      'Pilot blocked-analysis report',
      'Quarterly enablement coverage report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  legacy_platform_decommission: {
    key: 'legacy_platform_decommission',
    name: 'Legacy platform decommission',
    definition:
      'Disciplined decommission program for legacy warehouses, marts, ETL tools, and reports so the modernization realizes savings and the estate stops splitting attention.',
    problemSolved:
      'Modernization stands up the new platform but leaves legacy alongside; total cost rises; teams split attention; planned savings never materialize.',
    requiredCurrentStateInputs: [
      'Inventory of legacy platforms and their declared retirement candidates',
      'Workload migration status per legacy system',
      'Cost baseline of the legacy estate by platform',
    ],
    targetCapabilities: [
      'Each legacy platform carries a named decommission owner and a target shutdown date',
      'Workload migrations gate the decommission rather than the calendar',
      'Realized savings are reconciled against the cost baseline quarterly',
    ],
    architectureBuildingBlocks: [
      'Decommission owner roster',
      'Workload migration tracker tied to the decommission gate',
      'Cost reconciliation report against the baseline',
    ],
    governanceRequirements: [
      'Named sponsor sign-off on every shutdown before execution',
      'Architecture review board sign-off on workload migration completion before decommission',
    ],
    implementationSteps: [
      'Capture the legacy inventory and the cost baseline',
      'Assign decommission owners and target shutdown dates per platform',
      'Track workload migration as the decommission gate, not the calendar',
      'Reconcile realized savings quarterly and adjust the plan',
    ],
    expectedOutcomes: [
      'Legacy platforms shut down on the planned cadence',
      'Realized savings are visible and reconciled against the baseline',
    ],
    risks: [
      'Decommission slips because workloads were never fully migrated',
      'Realized savings are anecdotal if the cost baseline drifts',
    ],
    requiredWorkshops: ['architecture_solution_design', 'value_framing'],
    deliverablesProduced: [
      'Decommission owner roster',
      'Workload migration completion report',
      'Quarterly savings reconciliation report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  value_case_and_migration_roadmap: {
    key: 'value_case_and_migration_roadmap',
    name: 'Value case and migration roadmap',
    definition:
      'Captured value case — baseline KPIs, target with confidence band, sequenced migration roadmap — that defends the modernization investment at every steering touchpoint.',
    problemSolved:
      'Modernization programs make value claims that cannot be defended at steering; baseline / target / realized are anecdotal; investment confidence erodes.',
    requiredCurrentStateInputs: [
      'List of in-flight modernization investments with named sponsors',
      'Existing value-claim artifacts (decks, business cases) for those investments',
      'Source-of-truth measurement systems referenced in the claims',
    ],
    targetCapabilities: [
      'Every modernization investment carries a captured baseline, target, and realized entry',
      'Sequenced migration roadmap reconciles to the value case rather than calendar pressure',
      'CXO can challenge any claim and trace it back to the source-of-truth measurement',
    ],
    architectureBuildingBlocks: [
      'Value-case ledger entry per investment',
      'Sequenced migration roadmap tied to the ledger',
      'Quarterly value review report',
    ],
    governanceRequirements: [
      'Sponsor sign-off on baseline and target before any realized claim is published',
      'Steering review cadence with named approver per investment',
    ],
    implementationSteps: [
      'Inventory the in-flight modernization investments and their existing value claims',
      'Capture baseline plus target plus measurement source per investment',
      'Sequence the migration roadmap so it reconciles to the value case',
      'Run a quarterly value review with sponsors to retire or refresh entries',
    ],
    expectedOutcomes: [
      'Modernization investments produce defensible value claims',
      'Investment confidence rises as evidence replaces anecdote',
    ],
    risks: [
      'Ledger entries become checkbox theater without sponsor accountability',
      'Roadmap drifts from the value case if calendar pressure overrides reconciliation',
    ],
    requiredWorkshops: ['value_framing', 'executive_decision_review'],
    deliverablesProduced: [
      'Value-case ledger entry per investment',
      'Sequenced migration roadmap',
      'Quarterly value review report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
};

const PACK_KEYS_IN_ORDER: ReadonlyArray<AnalyticsModernizationComponentKey> = Object.freeze([
  'data_platform_assessment',
  'cloud_lakehouse_foundation',
  'semantic_layer_design',
  'master_data_management',
  'data_quality_observability',
  'reporting_rationalization',
  'ai_ready_feature_store',
  'data_governance_operating_model',
  'metadata_catalog_lineage',
  'self_service_analytics_enablement',
  'legacy_platform_decommission',
  'value_case_and_migration_roadmap',
] as const);

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full component pack in canonical order. Pure: same call →
 * identical output (byte-equal across calls).
 */
export function listAnalyticsModernizationComponents(): AnalyticsModernizationComponent[] {
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
}

/**
 * Return one component by key. Pure. Returns null for unknown keys.
 */
export function getAnalyticsModernizationComponent(
  key: string,
): AnalyticsModernizationComponent | null {
  if (!isAnalyticsModernizationComponentKey(key)) return null;
  return PACK[key];
}

/**
 * Recommend components by deterministic substring overlap on the
 * caller's inputs. A component matches when ANY of:
 *   - any capabilityKeyword appears as a substring in name, definition,
 *     problemSolved, or any targetCapabilities entry (case-insensitive)
 *   - any currentStateGap appears as a substring in name, definition,
 *     problemSolved, or any targetCapabilities entry (case-insensitive)
 *
 * Pure. Order is canonical. Empty inputs return an empty result.
 * Unknown / non-matching inputs are ignored without throwing.
 */
export function recommendAnalyticsModernizationComponents(input: {
  capabilityKeywords?: ReadonlyArray<string>;
  currentStateGaps?: ReadonlyArray<string>;
}): AnalyticsModernizationComponent[] {
  const keywords = (input.capabilityKeywords ?? []).map((s) => s.toLowerCase().trim()).filter((s) => s.length > 0);
  const gaps = (input.currentStateGaps ?? []).map((s) => s.toLowerCase().trim()).filter((s) => s.length > 0);
  if (keywords.length === 0 && gaps.length === 0) {
    return [];
  }
  const needles = Array.from(new Set<string>([...keywords, ...gaps]));
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((c) => {
    const haystack = [
      c.name,
      c.definition,
      c.problemSolved,
      ...c.targetCapabilities,
    ]
      .join(' | ')
      .toLowerCase();
    return needles.some((n) => haystack.includes(n));
  });
}

/**
 * Aggregate the unique architecture building blocks, workshops, and
 * deliverables across the pack. All arrays are sorted ascending so the
 * output is byte-equal across calls. Pure.
 */
export function summarizeAnalyticsModernizationComponentPack(): AnalyticsModernizationComponentPackSummary {
  const components = PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
  const blocks = new Set<string>();
  const workshops = new Set<string>();
  const deliverables = new Set<string>();
  for (const c of components) {
    for (const b of c.architectureBuildingBlocks) blocks.add(b);
    for (const w of c.requiredWorkshops) workshops.add(w);
    for (const d of c.deliverablesProduced) deliverables.add(d);
  }
  return {
    totalCount: components.length,
    uniqueArchitectureBlocks: Array.from(blocks).sort(),
    uniqueWorkshops: Array.from(workshops).sort(),
    uniqueDeliverables: Array.from(deliverables).sort(),
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const ANALYTICS_MODERNIZATION_COMPONENT_KEYS: ReadonlyArray<AnalyticsModernizationComponentKey> =
  PACK_KEYS_IN_ORDER;

export const ANALYTICS_MODERNIZATION_COMPONENTS: Readonly<
  Record<AnalyticsModernizationComponentKey, AnalyticsModernizationComponent>
> = PACK;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isAnalyticsModernizationComponentKey(
  value: string,
): value is AnalyticsModernizationComponentKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}
