// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - IT Modernisation & Data Platform
// Code range: A2400-A2699
// Run: npx tsx src/scripts/seed/seed-airline-dom08-it-modernization.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineItPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_IT_PATTERNS: AirlineItPatternSeed[] = [
  {
    code: 'A2400',
    name: 'PSS Migration Built Without Enterprise Event Backbone',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'SkyHarbor migrates from Sabre to Amadeus Altéa while downstream systems still depend on point-to-point batch extracts from the legacy PSS. Every downstream feed must be reworked separately, so cutover risk concentrates in brittle integration glue rather than the PSS platform itself.',
    keywords: ['PSS migration', 'Sabre', 'Amadeus Altea', 'event backbone', 'batch extract'],
    demoRelevant: true,
  },
  {
    code: 'A2401',
    name: 'Customer Data Platform Fed By Stale PNR Snapshots',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'The airline CDP promises real-time personalization but ingests PNR, loyalty, and service events through nightly snapshots. Marketing journeys use stale travel status, sending upgrade, disruption, or bag offers after the customer context has already changed.',
    keywords: ['CDP', 'PNR', 'loyalty', 'real-time data', 'personalization'],
    demoRelevant: true,
  },
  {
    code: 'A2402',
    name: 'Cloud Landing Zone Missing Station Network Pattern',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'The cloud landing zone is designed for corporate applications but not for airport station connectivity, latency, and offline operation. Kiosks, bag drops, and common-use workstations still depend on fragile local network paths that are invisible to cloud architecture reviews.',
    keywords: ['cloud landing zone', 'station network', 'CUTE', 'offline operations', 'airport IT'],
  },
  {
    code: 'A2403',
    name: 'Data Lake Duplicates PSS Without Ownership Model',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'A data lake copies PSS, DCS, loyalty, and revenue accounting data but no domain owner is accountable for truth, freshness, or field definitions. Analysts build competing passenger, booking, and flown-revenue views, creating executive debates about whose number is right.',
    keywords: ['data lake', 'PSS', 'DCS', 'data ownership', 'flown revenue'],
    demoRelevant: true,
  },
  {
    code: 'A2404',
    name: 'Mainframe Decommission Leaves Revenue Accounting Dependency',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'A legacy host is declared decommission-ready after booking and inventory flows move, but revenue accounting still consumes coupon, tax, and interline settlement extracts from the old platform. The modernization team retires visible customer functions while the finance-critical dependency remains hidden.',
    keywords: ['mainframe decommission', 'revenue accounting', 'coupon', 'IATA SIS', 'legacy host'],
  },
  {
    code: 'A2405',
    name: 'API Gateway Masks Unmapped Legacy Semantics',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'An API gateway wraps legacy reservation functions but does not document semantic differences between old host commands and modern resource models. Developers see a clean REST interface while business rules such as fare repricing, SSR handling, and ticketing deadlines remain host-specific.',
    keywords: ['API gateway', 'legacy host', 'REST', 'SSR', 'ticketing deadline'],
  },
  {
    code: 'A2406',
    name: 'Modernization Roadmap Sequenced By Technology Not Capability',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The transformation roadmap retires systems by platform age rather than by passenger, operational, or finance capability dependency. Teams modernize easy services first and leave the highest-value decision seams stuck between legacy and cloud for years.',
    keywords: ['modernization roadmap', 'capability map', 'legacy estate', 'cloud migration', 'dependency'],
    demoRelevant: true,
  },
  {
    code: 'A2407',
    name: 'Event Streaming Platform Missing Replay Discipline',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Kafka or Kinesis streams carry booking and operations events, but schemas, retention, replay, and dead-letter handling are not governed. When a downstream consumer misses events during an outage, teams cannot replay exactly the right slice without duplicating orders or operational messages.',
    keywords: ['event streaming', 'Kafka', 'Kinesis', 'schema registry', 'dead-letter queue'],
  },
  {
    code: 'A2408',
    name: 'Data Product Catalog Excludes Operational Freshness SLA',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Data products are cataloged with owners and descriptions but not freshness, latency, and operational-use SLAs. A dashboard suitable for monthly analysis is reused for day-of-travel decisions, causing teams to optimize from stale state.',
    keywords: ['data product', 'data catalog', 'SLA', 'freshness', 'operational analytics'],
  },
  {
    code: 'A2409',
    name: 'PSS Test Environment Lacks Partner Distribution Fidelity',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'PSS migration testing validates direct web and call-center paths but uses mocked or simplified GDS, OTA, interline, and corporate agency integrations. The cutover passes internal testing and then fails in partner channels where real message timing and agency mid-office behavior differ.',
    keywords: ['PSS testing', 'GDS', 'OTA', 'interline', 'agency mid-office'],
    demoRelevant: true,
  },
  {
    code: 'A2410',
    name: 'Identity Graph Splits Passenger And Loyalty Profiles',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Customer identity programs merge loyalty, web, mobile, and service records but leave PNR passenger identities loosely matched. The airline personalizes to the loyalty profile while operational servicing depends on the booking passenger record, creating inconsistent entitlements and communication.',
    keywords: ['identity graph', 'loyalty', 'PNR', 'CDP', 'customer 360'],
  },
  {
    code: 'A2411',
    name: 'Cloud Cost Allocation Missing Route-Level Attribution',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Cloud spend is allocated by application team rather than route, station, or business capability. Executives cannot connect modernization cost to commercial outcomes, so cost optimization becomes generic infrastructure pruning instead of business-value management.',
    keywords: ['cloud cost', 'FinOps', 'route profitability', 'capability cost', 'AWS'],
  },
  {
    code: 'A2412',
    name: 'Legacy Batch Window Blocks Real-Time Recovery',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Operational recovery tools promise real-time decisions but still wait for overnight or hourly legacy batch jobs for passenger, bag, crew, or aircraft state. During disruption, the recovery model uses old facts and recommends actions that are no longer feasible.',
    keywords: ['batch window', 'real-time recovery', 'IROPS', 'legacy integration', 'operational data'],
  },
  {
    code: 'A2413',
    name: 'Digital Twin Missing Airport Constraint Data',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Network and operations digital twins model aircraft, crew, and passenger flows but omit station-level constraints such as gates, belt loaders, deicing pads, and PRM capacity. Simulations recommend schedules and recovery plans that cannot be executed on the ground.',
    keywords: ['digital twin', 'airport constraints', 'A-CDM', 'simulation', 'operations planning'],
  },
  {
    code: 'A2414',
    name: 'Migration Factory Measures Story Points Not Retired Risk',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'The modernization factory reports sprint velocity and migrated services but not retired failure modes, cut dependencies, or closed operational risks. Executives see throughput while the legacy estate remains expensive because the hardest dependencies survive each wave.',
    keywords: ['migration factory', 'technical debt', 'dependency retirement', 'DORA', 'risk burndown'],
    demoRelevant: true,
  },
  {
    code: 'A2415',
    name: 'Service Mesh Introduced Before Domain Boundaries Stabilize',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'A service mesh is rolled out while reservation, order, loyalty, and airport domains still have unstable ownership boundaries. Teams gain traffic controls and telemetry but keep shipping distributed monolith behavior through chatty cross-domain calls.',
    keywords: ['service mesh', 'domain boundary', 'microservices', 'distributed monolith', 'Kubernetes'],
  },
  {
    code: 'A2416',
    name: 'Data Lineage Stops At Landing Table',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Lineage tooling proves that PSS data landed in the warehouse but does not trace transformations into revenue, loyalty, and operations metrics. When an executive KPI changes after migration, teams cannot tell whether the business changed or a transformation rule did.',
    keywords: ['data lineage', 'warehouse', 'PSS', 'KPI', 'transformation rule'],
  },
  {
    code: 'A2417',
    name: 'Application Portfolio Missing Operational Criticality',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'The application portfolio classifies systems by technology stack and cost but not by operational criticality during day-of-travel events. A low-cost integration component may be ignored in funding decisions even though its failure stops check-in, boarding, or baggage flow.',
    keywords: ['application portfolio', 'operational criticality', 'CMDB', 'day-of-travel', 'funding'],
  },
  {
    code: 'A2418',
    name: 'DevSecOps Pipeline Not Certified For Safety-Critical Changes',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'DevSecOps pipelines accelerate digital releases but do not distinguish customer-facing UI changes from safety- or operations-critical changes touching DCS, load control, or maintenance interfaces. Release automation bypasses additional evidence required for regulated operational systems.',
    keywords: ['DevSecOps', 'DCS', 'load control', 'FAA Part 121', 'release governance'],
  },
  {
    code: 'A2419',
    name: 'Vendor SI Owns Knowledge Graph In Practice',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'The systems integrator documents dependencies, interface maps, and migration decisions in its own tooling rather than in an airline-owned knowledge graph. SkyHarbor can execute through the vendor but cannot independently reason about what to modernize next.',
    keywords: ['systems integrator', 'knowledge graph', 'dependency map', 'vendor lock-in', 'modernization'],
    demoRelevant: true,
  },
  {
    code: 'A2420',
    name: 'Observability Designed For Services Not Journeys',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Monitoring covers service uptime and API latency but not complete passenger journeys such as shop-book-pay-check-in-board. A journey fails across three healthy services, and operations cannot see the customer-impacting break until complaints arrive.',
    keywords: ['observability', 'customer journey', 'SLO', 'API latency', 'OpenTelemetry'],
  },
  {
    code: 'A2421',
    name: 'Reference Architecture Ignores Offline Airport Mode',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'The enterprise reference architecture assumes connected cloud services and does not define degraded offline behavior for airport workstations, bag tags, boarding, and document checks. A network incident turns an IT outage into a station shutdown because local continuity procedures are not engineered.',
    keywords: ['reference architecture', 'offline mode', 'airport workstation', 'business continuity', 'CUTE'],
  },
  {
    code: 'A2422',
    name: 'Analytics Sandbox Becomes Shadow Production',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      'Analysts build disruption, pricing, or staffing models in a sandbox that later feeds operational decisions without production controls. The model looks innovative but lacks versioning, access control, and rollback discipline expected for airline operations.',
    keywords: ['analytics sandbox', 'model governance', 'MLOps', 'operational decision', 'versioning'],
  },
  {
    code: 'A2423',
    name: 'PSS Migration Backlog Excludes Training Data Conversion',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Migration plans convert live PNR and operational data but forget training, simulation, and regression-test datasets used by agents and support teams. After go-live, teams cannot rehearse incidents in the new platform because realistic scenarios remain locked in the old host.',
    keywords: ['PSS migration', 'training data', 'regression testing', 'Sabre', 'Amadeus Altea'],
  },
  {
    code: 'A2424',
    name: 'Master Data Governance Excludes Aircraft Configuration',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Master data programs focus on customer, route, and product data while aircraft configuration is governed in engineering and operations tools. Seat maps, maintenance status, and cabin layouts drift across domains, breaking retailing, boarding, and service planning.',
    keywords: ['master data', 'aircraft configuration', 'seat map', 'MRO', 'data governance'],
  },
  {
    code: 'A2425',
    name: 'Cloud DR Test Skips Airport Edge Dependencies',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Disaster recovery tests prove cloud workloads can fail over but skip airport edge devices, local print services, scanners, and common-use integrations. The application recovers while station processes remain stuck, so the tested RTO is not the operational RTO.',
    keywords: ['disaster recovery', 'RTO', 'airport edge', 'CUTE', 'cloud failover'],
  },
  {
    code: 'A2426',
    name: 'Data Platform Retains Sensitive PNR Remarks Unclassified',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'PNR remark fields flow into the data platform without classification, masking passport details, health notes, disability information, or payment fragments in free text. Privacy controls protect structured fields while high-risk unstructured data remains searchable by broad analyst groups.',
    keywords: ['PNR remarks', 'PII', 'GDPR', 'data classification', 'free text'],
  },
  {
    code: 'A2427',
    name: 'Modern API Product Has No Decommission Contract',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      'New API products are launched for booking, loyalty, or operations without defining what legacy endpoint they replace and when consumers must migrate. Modernization adds another interface layer instead of reducing estate complexity.',
    keywords: ['API product', 'decommission', 'consumer migration', 'legacy endpoint', 'platform governance'],
  },
  {
    code: 'A2428',
    name: 'Release Calendar Conflicts With Peak Travel Freeze',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Agile release trains plan major platform changes without honoring airline peak travel freezes, fare sale windows, or holiday operational embargoes. A technically successful release lands during a period when the business cannot absorb even minor instability.',
    keywords: ['release calendar', 'peak travel freeze', 'change management', 'holiday embargo', 'DevOps'],
  },
  {
    code: 'A2429',
    name: 'Data Contract Missing Passenger Rights Semantics',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Data contracts define field names and types but not passenger-rights semantics such as involuntary change, denied boarding, refund eligibility, or assistance requirement. Downstream teams consume technically valid events and make legally incorrect service decisions.',
    keywords: ['data contract', 'passenger rights', 'DOT', 'event schema', 'service decision'],
  },
  {
    code: 'A2430',
    name: 'AI Code Assistant Modernizes Syntax Not Business Rules',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'AI code assistants convert legacy scripts or host routines into modern code while preserving misunderstood airline business rules. The migrated service compiles and passes shallow tests, but fare, ticketing, or day-of-travel edge cases behave differently because rule intent was never captured.',
    keywords: ['AI code assistant', 'business rules', 'PSS migration', 'test coverage', 'legacy modernization'],
    demoRelevant: true,
  },
  {
    code: 'A2431',
    name: 'AI SDLC Contract Missing Defect Attribution',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'A systems integrator promises productivity uplift from AI SDLC tooling but does not define how defects, rework, escaped incidents, or human review effort will be attributed. Source teams cannot tell whether AI accelerated delivery or shifted quality cost downstream.',
    keywords: ['AI SDLC', 'vendor contract', 'defect attribution', 'Source', 'quality telemetry'],
    demoRelevant: true,
  },
  {
    code: 'A2432',
    name: 'Generative Data Mapping Hallucinates PSS Field Semantics',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Generative AI proposes mappings between Sabre fields, Altéa fields, and warehouse tables without grounding every mapping in source documentation. The mappings look plausible to engineers but quietly invert ticketing, SSR, or fare-rule semantics.',
    keywords: ['generative AI', 'data mapping', 'Sabre', 'Amadeus Altea', 'field lineage'],
    demoRelevant: true,
  },
  {
    code: 'A2433',
    name: 'AIOps Suppresses Airport Incidents As Noise',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'AIOps clusters repeated airport workstation and network alerts as low-severity noise because each individual event is brief. The station-level pattern is operationally severe, but alert suppression prevents escalation until check-in or boarding is already impaired.',
    keywords: ['AIOps', 'airport network', 'alert suppression', 'SLO', 'station incident'],
    demoRelevant: true,
  },
  {
    code: 'A2434',
    name: 'Enterprise RAG AI Exposes Sensitive PNR Remarks',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'An enterprise RAG layer indexes operational knowledge and historical PNR remarks without field-level classification. The assistant can retrieve medical notes, passport fragments, or service exceptions that should never have entered a broad employee knowledge surface.',
    keywords: ['enterprise RAG', 'PNR remarks', 'PII', 'GDPR', 'data classification'],
    demoRelevant: true,
  },
  {
    code: 'A2435',
    name: 'AI Dependency Mining Stops At Static Code',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'AI dependency mining scans repositories and host copybooks but misses scheduler jobs, message queues, vendor feeds, and station workarounds. The modernization map looks complete while the real operational dependencies remain outside the codebase.',
    keywords: ['AI dependency mining', 'copybook', 'message queue', 'scheduler', 'modernization map'],
    demoRelevant: true,
  },
  {
    code: 'A2436',
    name: 'MLOps Platform Not Cleared For Operational Decisioning',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'The MLOps platform supports experimentation but lacks approval gates, rollback, monitoring, and audit evidence required for models affecting pricing, safety, or day-of-travel decisions. AI initiatives graduate from notebooks before the control plane is ready.',
    keywords: ['MLOps', 'approval gate', 'model monitoring', 'audit evidence', 'operational AI'],
    demoRelevant: true,
  },
  {
    code: 'A2437',
    name: 'AI Architecture Review Omits Human Override Path',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Architecture review approves an AI decision service based on accuracy, latency, and integration design but does not require a human override path. When the model is wrong during an operational exception, frontline teams cannot safely bypass it without breaking audit controls.',
    keywords: ['AI architecture', 'human override', 'audit control', 'operational exception', 'governance'],
    demoRelevant: true,
  },
];
