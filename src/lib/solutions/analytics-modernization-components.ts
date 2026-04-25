// SOL4 · Analytics Modernization Solution Component Pack.
//
// Pure deterministic library naming the canonical components of an
// analytics modernization solution archetype. Programs, Atlas, Steward,
// and Nexus can subscribe to this pack to recommend, sequence, and
// govern analytics modernization components without inventing them at
// runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, or read tenant state. Recommendations are pure pattern
// overlap on the input.
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
  | 'value_case_and_migration_roadmap'
  | 'data_product_operating_model'
  | 'real_time_integration_layer'
  | 'analytics_cost_optimization';

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
  relatedArchetypes: ReadonlyArray<string>;
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
      'Structured discovery of the current data and analytics estate — sources, pipelines, warehouses, lakes, BI tools, semantic models, governance controls, costs, and consumer cohorts — producing a defensible baseline for modernization.',
    problemSolved:
      'Modernization plans skip a defensible baseline; teams argue from anecdote about what to retire, replatform, or rebuild; cost and risk surprises emerge mid-program.',
    requiredCurrentStateInputs: [
      'Inventory of data sources, pipelines, warehouses, lakes, and BI tools currently in production',
      'Top consumer cohorts (executive, analyst, ops, customer-facing) with their primary questions',
      'Current data platform total cost of ownership broken out by infrastructure, license, and run-team labour',
    ],
    targetCapabilities: [
      'Captured baseline of platform footprint, cost, and consumer reach',
      'Heatmap of overlap, gaps, and high-risk pipelines ready for the modernization roadmap',
    ],
    architectureBuildingBlocks: [
      'Asset inventory model spanning sources, pipelines, datasets, and BI artefacts',
      'Cost-per-workload attribution model tied to the inventory',
    ],
    governanceRequirements: [
      'Named platform owner sign-off on the assessment scope and findings',
      'Data privacy review before any sample data is shared with the assessment team',
    ],
    implementationSteps: [
      'Charter the assessment with named sponsor, scope, and confidentiality boundaries',
      'Run inventory and consumer-cohort interviews against a fixed questionnaire',
      'Produce the baseline report with cost, risk, overlap, and gap heatmaps',
    ],
    expectedOutcomes: [
      'Modernization decisions are grounded in a defensible baseline rather than anecdote',
      'Cost and risk surprises are surfaced before commitments are made',
    ],
    risks: [
      'Assessment becomes shelfware if no sponsor owns the follow-through',
    ],
    requiredWorkshops: ['current_state_discovery', 'data_foundation_assessment'],
    deliverablesProduced: [
      'Data platform baseline report',
      'Consumer-cohort question map',
      'Cost and risk heatmap',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  cloud_lakehouse_foundation: {
    key: 'cloud_lakehouse_foundation',
    name: 'Cloud lakehouse foundation',
    definition:
      'Target-state cloud lakehouse pattern that unifies raw, conformed, and curated zones with open table formats, enabling both warehouse-style analytics and AI feature engineering on the same governed substrate.',
    problemSolved:
      'Separate warehouse and lake estates duplicate data, fragment governance, and force teams to choose between BI fidelity and AI readiness; cloud migrations stall without a coherent target pattern.',
    requiredCurrentStateInputs: [
      'List of source systems with refresh cadence and volume tier',
      'Current warehouse and lake footprints with the workloads they serve',
      'Cloud landing-zone posture and existing identity / network controls',
    ],
    targetCapabilities: [
      'Unified raw / conformed / curated zones backed by open table formats',
      'Lakehouse compute pattern that serves BI and AI workloads from the same governed substrate',
    ],
    architectureBuildingBlocks: [
      'Object storage with open table format (Delta / Iceberg / Hudi) for the curated zone',
      'Lakehouse compute engines for SQL and AI workloads with shared metadata',
      'Unified catalog spanning the raw, conformed, and curated zones',
    ],
    governanceRequirements: [
      'Named platform owner with authority over zone schemas and ingestion patterns',
      'Cloud security review of the landing-zone, identity, and network controls before production data lands',
    ],
    implementationSteps: [
      'Pick the open table format and lakehouse compute pattern using the assessment baseline',
      'Stand up the landing zone, raw zone, conformed zone, and curated zone with identity and network guardrails',
      'Migrate two reference workloads (one BI, one AI / feature) to validate the pattern',
      'Publish the lakehouse reference architecture and onboarding runbook',
    ],
    expectedOutcomes: [
      'BI and AI workloads share one governed substrate without duplication',
      'New workloads onboard against a published reference rather than improvising',
    ],
    risks: [
      'Lift-and-shift of legacy warehouse patterns onto the lakehouse without rethinking modelling',
      'Open table format choice locks the estate into a vendor-specific compute pattern if not reviewed',
    ],
    requiredWorkshops: ['architecture_solution_design', 'data_foundation_assessment'],
    deliverablesProduced: [
      'Lakehouse reference architecture',
      'Zone schema and ingestion pattern catalog',
      'Onboarding runbook for new workloads',
    ],
    relatedArchetypes: ['analytics_modernization', 'ai_led_pdlc_transformation'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  semantic_layer_design: {
    key: 'semantic_layer_design',
    name: 'Semantic layer design',
    definition:
      'Versioned semantic layer that captures business entities, metrics, dimensions, and certified definitions once, then serves them consistently to BI tools, notebooks, and AI agents.',
    problemSolved:
      'Every BI tool re-implements its own metric definitions; numbers disagree across tools and decks; AI agents fabricate plausible-but-wrong metric joins because there is no certified semantic source.',
    requiredCurrentStateInputs: [
      'Inventory of headline metrics referenced in executive reporting with current owners',
      'Top three BI tools in active use and how they define the same metrics',
      'Sample of escalations caused by inconsistent metric values across surfaces',
    ],
    targetCapabilities: [
      'Single certified definition per headline metric, owned and versioned',
      'BI tools, notebooks, and AI agents consume metrics from the same semantic layer',
    ],
    architectureBuildingBlocks: [
      'Semantic layer engine (e.g. dbt Semantic Layer / Cube / LookML) as the certified definition store',
      'Consumer adapter pattern for BI tools, notebooks, and AI agents',
    ],
    governanceRequirements: [
      'Named metric steward per business domain with sign-off authority on definition changes',
      'Versioning and deprecation policy for retired or replaced metric definitions',
    ],
    implementationSteps: [
      'Catalog headline metrics with current definitions, owners, and consumer cohorts',
      'Pick the semantic layer engine and define the certification rubric',
      'Implement the top tier of certified metrics and wire two consumer surfaces to the layer',
      'Publish the metric catalog and the deprecation playbook',
    ],
    expectedOutcomes: [
      'Headline metrics agree across BI tools, notebooks, and AI agents',
      'Time spent reconciling metric numbers in executive forums falls measurably',
    ],
    risks: [
      'Semantic layer becomes another silo if BI tools continue to re-implement metrics in parallel',
      'Definition churn without a deprecation policy erodes trust faster than it builds it',
    ],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review'],
    deliverablesProduced: [
      'Certified metric catalog',
      'Semantic layer reference architecture',
      'Metric stewardship and deprecation playbook',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  master_data_management: {
    key: 'master_data_management',
    name: 'Master data management',
    definition:
      'Captured operating pattern for mastering the highest-leverage business entities — customer, product, supplier, location, employee — with named stewards, survivorship rules, and downstream syndication.',
    problemSolved:
      'Reporting and AI workloads collide on entity ambiguity (which customer is the real customer?); reconciliation absorbs analyst time; AI feature engineering compounds entity errors at scale.',
    requiredCurrentStateInputs: [
      'List of business entities currently mastered (or attempted) with their authoritative source',
      'Sample of unresolved duplicates and their downstream impact in the last quarter',
      'Existing stewardship roles and the tools currently in use for mastering',
    ],
    targetCapabilities: [
      'Named steward per mastered entity with survivorship rules and audit trail',
      'Downstream consumers (reporting, AI feature store) syndicate from the master rather than re-deriving',
    ],
    architectureBuildingBlocks: [
      'MDM hub with survivorship and match-merge engine',
      'Outbound syndication channel to the warehouse, lakehouse, and feature store',
    ],
    governanceRequirements: [
      'Steward council sign-off on survivorship rules and match thresholds',
      'Privacy and consent review for any mastered entity carrying personal data',
    ],
    implementationSteps: [
      'Pick the top three mastered entities with the highest reconciliation pain',
      'Stand up the MDM hub, encode survivorship rules, and onboard the authoritative sources',
      'Wire downstream consumers to the master and retire ad-hoc reconciliation logic',
      'Publish the stewardship playbook and operating cadence',
    ],
    expectedOutcomes: [
      'Reconciliation effort across reporting and AI workloads falls measurably',
      'Entity ambiguity stops compounding through downstream feature engineering',
    ],
    risks: [
      'Stewardship roles unfunded after launch and the master drifts',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Mastered entity catalog',
      'Survivorship and match-merge rule set',
      'Stewardship playbook and operating cadence',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  data_quality_observability: {
    key: 'data_quality_observability',
    name: 'Data quality and observability',
    definition:
      'Always-on observability layer over data pipelines and curated datasets — schema, freshness, volume, distribution, and business-rule checks — with alert routing tied to named owners.',
    problemSolved:
      'Data quality issues are discovered by consumers in dashboards or AI outputs after the fact; trust in the platform erodes; remediation absorbs analyst and engineering time without preventing recurrence.',
    requiredCurrentStateInputs: [
      'Inventory of curated datasets with their downstream consumers and refresh cadence',
      'Last two quarters of data quality incidents with root cause classifications',
      'Existing monitoring posture (which datasets have which checks today)',
    ],
    targetCapabilities: [
      'Schema, freshness, volume, distribution, and business-rule checks on curated datasets',
      'Alerts route to the named dataset owner with remediation context',
    ],
    architectureBuildingBlocks: [
      'Data quality engine (e.g. Great Expectations / Soda / Monte Carlo / dbt tests)',
      'Alert routing layer wired to the ownership graph',
    ],
    governanceRequirements: [
      'Dataset owner accepts the SLA for each tier of dataset before production use',
      'Quarterly review of incident volume, MTTD, and MTTR per tier',
    ],
    implementationSteps: [
      'Tier the curated dataset estate by criticality and consumer breadth',
      'Encode the standard check set per tier and onboard the top tier first',
      'Wire alert routing to the ownership graph and the on-call rotation',
      'Run the quarterly review of incident volume, MTTD, and MTTR',
    ],
    expectedOutcomes: [
      'Data quality issues are caught before consumers see them on critical datasets',
      'Trust in the curated estate rises as incident volume and MTTR fall',
    ],
    risks: [
      'Alert fatigue if check thresholds are not tuned per tier',
      'False sense of safety if business-rule checks are skipped in favour of structural checks only',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Dataset tiering and SLA matrix',
      'Standard check catalog per tier',
      'Quarterly data quality review report',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  reporting_rationalization: {
    key: 'reporting_rationalization',
    name: 'Reporting rationalization',
    definition:
      'Disciplined cull and consolidation of the existing reporting estate, retiring redundant or unused reports and replacing them with certified, semantic-layer-backed equivalents.',
    problemSolved:
      'Decades of accumulated reports duplicate each other, contradict each other, and absorb run-team capacity; users hoard private spreadsheets because they cannot trust the catalog.',
    requiredCurrentStateInputs: [
      'Inventory of reports and dashboards with last-viewed telemetry',
      'List of report owners and the executive forums each report feeds',
      'Sample of contradictions where two reports answer the same question differently',
    ],
    targetCapabilities: [
      'Retired or consolidated redundant reports with audit trail',
      'Certified replacement reports backed by the semantic layer',
    ],
    architectureBuildingBlocks: [
      'Report inventory and usage telemetry pipeline',
      'Decommission workflow that captures owner sign-off and the replacement reference',
    ],
    governanceRequirements: [
      'Executive sponsor sign-off on the decommission slate per quarter',
      'Replacement reports must reference the semantic layer rather than ad-hoc joins',
    ],
    implementationSteps: [
      'Capture the report inventory with usage telemetry and owner attribution',
      'Score reports for redundancy, low usage, and contradictions',
      'Run the decommission slate per quarter with owner sign-off',
      'Track the replacement reports landing on the semantic layer',
    ],
    expectedOutcomes: [
      'Report estate shrinks measurably without losing decision support',
      'Run-team capacity is freed for new analytical work',
    ],
    risks: [
      'Decommission of a low-usage report that powers a regulated control',
    ],
    requiredWorkshops: ['governance_risk_review', 'value_framing'],
    deliverablesProduced: [
      'Report inventory with usage telemetry',
      'Quarterly decommission slate',
      'Certified replacement report catalog',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_ready_feature_store: {
    key: 'ai_ready_feature_store',
    name: 'AI-ready feature store',
    definition:
      'Curated feature store layered on the lakehouse where AI features are defined, versioned, governed, and served — both for offline training and online inference — from one canonical definition.',
    problemSolved:
      'AI feature engineering is duplicated across notebooks; training-serving skew creeps in; governance over AI inputs is impossible; the same feature is computed three different ways in three different models.',
    requiredCurrentStateInputs: [
      'Inventory of AI / ML use cases in production or pilot with their feature lists',
      'Sample of duplicated feature logic across notebooks and services',
      'Current training-serving skew incidents or degradation reports',
    ],
    targetCapabilities: [
      'Curated feature definitions with versioning, lineage, and named owner',
      'Offline training and online inference served from the same canonical definition',
      'Feature store entries flagged AI-ready with explicit governance metadata',
    ],
    architectureBuildingBlocks: [
      'Feature store engine (e.g. Feast / Tecton / Databricks Feature Store) on the lakehouse substrate',
      'Online serving path with low-latency cache and offline materialization path for training',
    ],
    governanceRequirements: [
      'Named feature owner per registered feature with sign-off authority on definition changes',
      'Responsible-AI review for features that touch regulated data classes or protected attributes',
    ],
    implementationSteps: [
      'Pick the feature store engine and wire it to the lakehouse curated zone',
      'Onboard the top AI / ML use case as the reference workload',
      'Migrate duplicated feature logic into the canonical definitions and retire the duplicates',
      'Publish the feature catalog and the governance metadata schema',
    ],
    expectedOutcomes: [
      'Training-serving skew falls as the canonical definition is the only source',
      'AI features ship with explicit governance metadata rather than implicit assumptions',
      'New AI use cases reuse existing features rather than re-implementing them',
    ],
    risks: [
      'Feature sprawl if no owner is named per feature',
      'Online serving latency regression if the cache pattern is not sized for the workload',
    ],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review'],
    deliverablesProduced: [
      'Feature catalog with governance metadata',
      'Feature store reference architecture',
      'Reference AI workload migration report',
    ],
    relatedArchetypes: ['analytics_modernization', 'ai_led_pdlc_transformation'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  data_governance_operating_model: {
    key: 'data_governance_operating_model',
    name: 'Data governance operating model',
    definition:
      'Operating model that names domain owners, data stewards, the council that arbitrates conflicts, and the cadence at which governance decisions are reviewed — published, funded, and visible.',
    problemSolved:
      'Governance shows up as policy documents that nobody owns; conflicts escalate slowly or not at all; AI investments stall waiting for decisions that have no decider.',
    requiredCurrentStateInputs: [
      'Existing governance charters, policies, and council attendance records',
      'List of unresolved governance escalations from the last two quarters',
      'Current funding posture for governance roles (named, funded, vacant)',
    ],
    targetCapabilities: [
      'Named domain owners and stewards with authority and time funded for the role',
      'Council with a published cadence, agenda template, and decision log',
      'Escalation path with sign-off authority defined per decision class',
    ],
    architectureBuildingBlocks: [
      'Governance role and authority matrix',
      'Decision log integrated with the data catalog and the policy library',
    ],
    governanceRequirements: [
      'Executive sponsor sign-off on the operating model and funding',
      'Quarterly review of council throughput, decision turnaround, and unresolved escalations',
    ],
    implementationSteps: [
      'Define the role and authority matrix per domain',
      'Stand up the council with cadence, agenda template, and decision log',
      'Publish the operating model and onboard the first wave of stewards',
      'Run the quarterly throughput review and adjust authority where bottlenecks emerge',
    ],
    expectedOutcomes: [
      'Governance decisions land at a known cadence with a named decider',
      'AI and analytics investments stop stalling on undecidable governance questions',
    ],
    risks: [
      'Roles are named without funding and the operating model collapses within two quarters',
      'Council becomes a status forum rather than a decision forum',
    ],
    requiredWorkshops: ['governance_risk_review', 'operating_model_alignment'],
    deliverablesProduced: [
      'Governance operating model document',
      'Role and authority matrix',
      'Council charter, agenda template, and decision log schema',
    ],
    relatedArchetypes: ['analytics_modernization', 'ai_led_pdlc_transformation'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  metadata_catalog_lineage: {
    key: 'metadata_catalog_lineage',
    name: 'Metadata catalog and lineage',
    definition:
      'Active metadata catalog that exposes datasets, columns, owners, classifications, and end-to-end lineage from source to consumer surface, queryable by humans and by AI agents.',
    problemSolved:
      'Consumers cannot find or trust data; impact analysis for a pipeline change is guesswork; AI agents fabricate column joins because lineage is invisible.',
    requiredCurrentStateInputs: [
      'Existing catalog footprint with coverage by domain',
      'Sample of incidents where missing lineage caused a regression',
      'List of consumer cohorts and how they currently search for data',
    ],
    targetCapabilities: [
      'Datasets, columns, owners, and classifications discoverable by humans and AI agents',
      'End-to-end lineage from source through transformations to consumer surfaces',
    ],
    architectureBuildingBlocks: [
      'Metadata catalog engine with active lineage harvesting',
      'Catalog API for AI agent consumption with the same authorization posture as human consumers',
    ],
    governanceRequirements: [
      'Catalog owner accepts the coverage SLA per domain',
      'Classification tags carry sign-off authority and revisit cadence',
    ],
    implementationSteps: [
      'Pick the catalog engine and wire it to the highest-leverage data sources',
      'Harvest lineage from the conformed and curated zones first',
      'Onboard consumer cohorts to search and impact analysis flows',
      'Expose the catalog API to authorized AI agents under the same authorization posture',
    ],
    expectedOutcomes: [
      'Impact analysis time falls measurably',
      'AI agents ground answers in the catalog rather than fabricating joins',
    ],
    risks: [
      'Catalog coverage stalls below the threshold needed for trust',
      'Classification tagging lags ingestion and creates exposure',
    ],
    requiredWorkshops: ['data_foundation_assessment', 'governance_risk_review'],
    deliverablesProduced: [
      'Catalog coverage and SLA matrix',
      'Lineage harvesting reference pattern',
      'Catalog API authorization runbook',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  self_service_analytics_enablement: {
    key: 'self_service_analytics_enablement',
    name: 'Self-service analytics enablement',
    definition:
      'Curated, supported pathway for business analysts and product teams to answer their own questions against certified datasets and the semantic layer, with named office-hours support and learning material.',
    problemSolved:
      'Analytics teams become a bottleneck; business teams build private spreadsheets that contradict the certified estate; AI literacy never spreads beyond the central team.',
    requiredCurrentStateInputs: [
      'Inventory of business analyst and product cohorts with current self-service tooling',
      'Sample of private spreadsheets and shadow datasets in active use',
      'Current learning and enablement footprint (training, office hours, certification)',
    ],
    targetCapabilities: [
      'Curated self-service tooling stack with documented patterns',
      'Office hours and learning paths with named owners',
      'Path from question to certified answer that does not require central engineering',
    ],
    architectureBuildingBlocks: [
      'Curated self-service tooling stack on top of the semantic layer',
      'Learning path and certification scheme tied to the catalog and semantic layer',
    ],
    governanceRequirements: [
      'Sponsor sign-off on the self-service tooling stack and the supported patterns',
      'Quarterly review of cohort enablement coverage and shadow-dataset volume',
    ],
    implementationSteps: [
      'Pick the supported self-service stack on top of the semantic layer and the catalog',
      'Stand up the learning path with named curriculum owners',
      'Run office hours on a known cadence with named coverage',
      'Track shadow-dataset volume quarterly as the inverse-trust signal',
    ],
    expectedOutcomes: [
      'Business teams answer their own questions against certified datasets',
      'Shadow-dataset volume falls as enablement coverage rises',
    ],
    risks: [
      'Office hours become unfunded and the self-service path collapses',
    ],
    requiredWorkshops: ['adoption_change_readiness', 'operating_model_alignment'],
    deliverablesProduced: [
      'Supported self-service stack reference',
      'Learning path and certification scheme',
      'Office-hours operating cadence',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  legacy_platform_decommission: {
    key: 'legacy_platform_decommission',
    name: 'Legacy platform decommission',
    definition:
      'Disciplined retirement of legacy warehouses, marts, ETL tools, and BI surfaces once their workloads have migrated, with audit trail, dependency clearance, and license-savings capture.',
    problemSolved:
      'Modernization investments compound rather than replace cost; legacy estates linger because nobody owns retirement; license and run-team savings stay theoretical.',
    requiredCurrentStateInputs: [
      'Inventory of legacy platforms with their workloads, licenses, and run-team labour',
      'Migration tracker showing which workloads have moved and which remain',
      'Existing decommission policy and audit-log practice',
    ],
    targetCapabilities: [
      'Legacy platform retirement with audit trail and license-savings capture',
      'Dependency clearance per platform before decommission lands',
    ],
    architectureBuildingBlocks: [
      'Migration tracker linked to the asset inventory and ownership graph',
      'Decommission workflow with audit log and license-savings ledger',
    ],
    governanceRequirements: [
      'Executive sponsor sign-off on each decommission slate',
      'Mandatory dependency clearance and rollback plan before retirement lands',
    ],
    implementationSteps: [
      'Maintain the migration tracker as workloads move off the legacy platforms',
      'Run the dependency clearance check per candidate decommission',
      'Execute the decommission slate per quarter with sponsor sign-off',
      'Capture license and run-team savings in the value ledger',
    ],
    expectedOutcomes: [
      'Modernization investments replace rather than compound legacy cost',
      'License and run-team savings are captured rather than aspirational',
    ],
    risks: [
      'Premature decommission of a legacy platform that still serves a regulated workload',
      'Decommission slate stalls because no sponsor owns the retirement',
    ],
    requiredWorkshops: ['governance_risk_review', 'value_framing'],
    deliverablesProduced: [
      'Migration tracker',
      'Decommission slate per quarter with audit log',
      'License and run-team savings entry in the value ledger',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  value_case_and_migration_roadmap: {
    key: 'value_case_and_migration_roadmap',
    name: 'Value case and migration roadmap',
    definition:
      'Captured value case for the modernization program — baseline, target, realized — paired with a sequenced migration roadmap that names the workloads, the wave they move in, and the sponsor accountable for each wave.',
    problemSolved:
      'Modernization programs run on aspirational decks; sequencing is improvised; sponsors cannot defend the investment at the next steering touchpoint; waves slip without escalation.',
    requiredCurrentStateInputs: [
      'List of in-flight modernization investments with named sponsors',
      'Existing value-claim artefacts (decks, business cases) for those investments',
      'Source-of-truth measurement systems referenced in the claims',
    ],
    targetCapabilities: [
      'Captured baseline, target, and realized entry per modernization investment',
      'Migration roadmap sequencing the workloads into waves with named sponsors',
      'Sponsors can defend each wave at the next steering touchpoint with traceable evidence',
    ],
    architectureBuildingBlocks: [
      'Value ledger schema spanning baseline, target, realized, and measurement source',
      'Migration roadmap artefact tied to the asset inventory and ownership graph',
    ],
    governanceRequirements: [
      'Sponsor sign-off on baseline and target before any realized claim is published',
      'Steering committee review of the migration roadmap at the agreed cadence',
    ],
    implementationSteps: [
      'Inventory the in-flight modernization investments and their existing claims',
      'Capture baseline, target, and measurement source per investment',
      'Sequence the workloads into waves with named sponsors and dependencies',
      'Run the steering review at the agreed cadence and update realized entries',
    ],
    expectedOutcomes: [
      'Modernization investments produce defensible value claims',
      'Wave slips trigger escalation rather than silent drift',
    ],
    risks: [
      'Roadmap becomes a static artefact if the steering review lapses',
    ],
    requiredWorkshops: ['value_framing', 'executive_decision_review'],
    deliverablesProduced: [
      'Per-investment value ledger entry',
      'Migration roadmap artefact',
      'Steering review cadence and decision log',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  data_product_operating_model: {
    key: 'data_product_operating_model',
    name: 'Data product operating model',
    definition:
      'Operating model that treats curated datasets and semantic-layer metrics as products with a named product owner, roadmap, SLA, and consumer feedback loop — funded as products, not as projects.',
    problemSolved:
      'Curated datasets are treated as project deliverables; nobody owns them after launch; consumer feedback has no destination; data quality issues become orphans.',
    requiredCurrentStateInputs: [
      'List of curated datasets and metrics that warrant product treatment',
      'Existing product management practice and how it would extend to data products',
      'Sample of orphaned curated datasets with no clear owner today',
    ],
    targetCapabilities: [
      'Named data product owner per high-leverage dataset / metric with funded time',
      'Roadmap, SLA, and consumer feedback loop per data product',
    ],
    architectureBuildingBlocks: [
      'Data product specification template tied to the catalog',
      'Consumer feedback channel routed to the product owner',
    ],
    governanceRequirements: [
      'Sponsor sign-off on the data products that warrant the operating model',
      'Quarterly review of SLA adherence and consumer feedback closure',
    ],
    implementationSteps: [
      'Pick the first wave of data products from the curated estate',
      'Name product owners and fund their time',
      'Publish the specification, roadmap, and SLA per product',
      'Stand up the consumer feedback channel and the quarterly review',
    ],
    expectedOutcomes: [
      'Curated datasets and metrics carry named owners with funded time',
      'Consumer feedback closes the loop rather than disappearing',
    ],
    risks: [
      'Product treatment is named without funding and reverts to project framing',
    ],
    requiredWorkshops: ['operating_model_alignment', 'governance_risk_review'],
    deliverablesProduced: [
      'Data product specification template',
      'First-wave data product roster',
      'Consumer feedback operating cadence',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  real_time_integration_layer: {
    key: 'real_time_integration_layer',
    name: 'Real-time integration layer',
    definition:
      'Streaming and event-driven integration layer that serves low-latency consumers — operational analytics, customer-facing surfaces, AI inference — alongside the batch lakehouse without duplicating logic.',
    problemSolved:
      'Operational and customer-facing analytics demand real-time signal that batch warehouses cannot serve; teams build parallel streaming estates that diverge from the curated batch estate.',
    requiredCurrentStateInputs: [
      'List of low-latency analytics and AI inference use cases with their latency targets',
      'Existing streaming or messaging footprint with workloads it serves',
      'Sample of divergence incidents between batch and streaming estates',
    ],
    targetCapabilities: [
      'Streaming and event-driven layer alongside the batch lakehouse',
      'Shared transformation logic between batch and streaming paths where feasible',
    ],
    architectureBuildingBlocks: [
      'Event broker (e.g. Kafka / Kinesis / Pub/Sub) with schema registry',
      'Streaming compute pattern reusing transformation logic with the batch path where possible',
    ],
    governanceRequirements: [
      'Schema governance with named schema owner and breaking-change policy',
      'Operational runbooks for stream lag, replay, and dead-letter handling',
    ],
    implementationSteps: [
      'Pick the event broker and the streaming compute pattern',
      'Onboard the top low-latency use case as the reference workload',
      'Reconcile transformation logic between batch and streaming paths where feasible',
      'Publish the streaming reference architecture and the operational runbooks',
    ],
    expectedOutcomes: [
      'Low-latency consumers are served from a shared, governed integration layer',
      'Divergence incidents between batch and streaming estates fall measurably',
    ],
    risks: [
      'Streaming estate diverges from batch when transformation logic is duplicated rather than shared',
      'Schema breakage cascades to downstream consumers without a versioning policy',
    ],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review'],
    deliverablesProduced: [
      'Streaming reference architecture',
      'Schema registry and breaking-change policy',
      'Operational runbooks for stream lag and replay',
    ],
    relatedArchetypes: ['analytics_modernization'],
    createdFrom: 'deterministic_solution_component_pack',
  },
  analytics_cost_optimization: {
    key: 'analytics_cost_optimization',
    name: 'Analytics cost optimization',
    definition:
      'Always-on optimization layer that monitors compute, storage, and license cost across the modernized estate, attributes cost to workloads, and surfaces remediation actions to named owners.',
    problemSolved:
      'Cloud analytics cost grows without attribution; runaway queries and idle clusters surprise the finance team; modernization savings claims become indefensible.',
    requiredCurrentStateInputs: [
      'Current cloud cost telemetry by service with workload attribution where it exists',
      'List of top-cost workloads by quarter and their owners',
      'Existing cost-governance forum and decision cadence',
    ],
    targetCapabilities: [
      'Cost attribution per workload across compute, storage, and license',
      'Surfaced remediation actions routed to the workload owner',
      'Cost trends visible at the cadence the steering committee can act on',
    ],
    architectureBuildingBlocks: [
      'Cost telemetry pipeline with workload attribution model',
      'Cost dashboard tied to the ownership graph and the value ledger',
    ],
    governanceRequirements: [
      'Workload owner accepts the cost SLA per tier of workload',
      'Steering committee review of cost trends at the agreed cadence',
    ],
    implementationSteps: [
      'Wire the cost telemetry pipeline and reconcile to the finance source-of-truth',
      'Encode the workload attribution model and onboard the top-cost workloads first',
      'Publish the cost dashboard with owner-routed remediation actions',
      'Run the steering review at the agreed cadence and feed savings into the value ledger',
    ],
    expectedOutcomes: [
      'Modernization savings claims are defensible and tied to the value ledger',
      'Runaway queries and idle clusters surface to owners before the finance team escalates',
    ],
    risks: [
      'Cost dashboard becomes a status artefact without owner-routed remediation',
      'Attribution drift if workload boundaries are not maintained as the estate evolves',
    ],
    requiredWorkshops: ['value_framing', 'operating_model_alignment'],
    deliverablesProduced: [
      'Cost telemetry pipeline',
      'Workload attribution model',
      'Quarterly cost review report',
    ],
    relatedArchetypes: ['analytics_modernization'],
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
  'data_product_operating_model',
  'real_time_integration_layer',
  'analytics_cost_optimization',
] as const);

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Frozen tuple of canonical component keys in canonical order.
 */
export const ANALYTICS_MODERNIZATION_COMPONENT_KEYS: ReadonlyArray<AnalyticsModernizationComponentKey> =
  PACK_KEYS_IN_ORDER;

/**
 * Canonical map of component key to component record. Frozen against
 * mutation to keep the library deterministic.
 */
export const ANALYTICS_MODERNIZATION_COMPONENTS: Record<
  AnalyticsModernizationComponentKey,
  AnalyticsModernizationComponent
> = Object.freeze({ ...PACK }) as Record<
  AnalyticsModernizationComponentKey,
  AnalyticsModernizationComponent
>;

/**
 * Return the full component pack in canonical order. Pure: same call →
 * identical output.
 */
export function listAnalyticsModernizationComponents(): ReadonlyArray<AnalyticsModernizationComponent> {
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
 * Recommend components whose targetCapabilities / architectureBuildingBlocks
 * / definition / problemSolved overlap with the caller's capabilityKeywords
 * OR whose requiredCurrentStateInputs overlap with the caller's
 * currentStateGaps. Pure. Order is canonical. Union semantics.
 */
export function recommendAnalyticsModernizationComponents(input: {
  capabilityKeywords?: ReadonlyArray<string>;
  currentStateGaps?: ReadonlyArray<string>;
}): ReadonlyArray<AnalyticsModernizationComponent> {
  const capabilityKeywords = input.capabilityKeywords ?? [];
  const currentStateGaps = input.currentStateGaps ?? [];
  if (capabilityKeywords.length === 0 && currentStateGaps.length === 0) {
    return [];
  }
  const lowerCapabilityKeywords = capabilityKeywords
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
  const lowerCurrentStateGaps = currentStateGaps
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((c) => {
    const capabilityHaystack = [
      c.name,
      c.definition,
      c.problemSolved,
      ...c.targetCapabilities,
      ...c.architectureBuildingBlocks,
    ]
      .join(' | ')
      .toLowerCase();
    const currentStateHaystack = c.requiredCurrentStateInputs.join(' | ').toLowerCase();
    const capabilityMatch = lowerCapabilityKeywords.some((kw) =>
      capabilityHaystack.includes(kw),
    );
    const gapMatch = lowerCurrentStateGaps.some((kw) => currentStateHaystack.includes(kw));
    return capabilityMatch || gapMatch;
  });
}

/**
 * Aggregate the unique sets of architecture building blocks, required
 * workshops, and deliverables observed across the pack. Each unique set
 * is sorted ascending. totalCount equals the canonical pack size. Pure.
 */
export function summarizeAnalyticsModernizationComponentPack(): {
  totalCount: number;
  uniqueArchitectureBlocks: string[];
  uniqueWorkshops: string[];
  uniqueDeliverables: string[];
} {
  const components = PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
  const blockSet = new Set<string>();
  const workshopSet = new Set<string>();
  const deliverableSet = new Set<string>();
  for (const c of components) {
    for (const b of c.architectureBuildingBlocks) blockSet.add(b);
    for (const w of c.requiredWorkshops) workshopSet.add(w);
    for (const d of c.deliverablesProduced) deliverableSet.add(d);
  }
  return {
    totalCount: components.length,
    uniqueArchitectureBlocks: Array.from(blockSet).sort((a, b) => a.localeCompare(b)),
    uniqueWorkshops: Array.from(workshopSet).sort((a, b) => a.localeCompare(b)),
    uniqueDeliverables: Array.from(deliverableSet).sort((a, b) => a.localeCompare(b)),
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isAnalyticsModernizationComponentKey(
  value: string,
): value is AnalyticsModernizationComponentKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}
