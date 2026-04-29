import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const SPLUNK_SOURCE_BASIS = {
  cloudPlatform: {
    type: 'public-disclosure',
    label: 'Splunk Cloud Platform',
    url: 'https://www.splunk.com/en_us/products/splunk-cloud-platform.html',
    asOf: SOURCE_AS_OF,
  },
  observabilityCloud: {
    type: 'public-disclosure',
    label: 'Splunk Observability Cloud',
    url: 'https://www.splunk.com/en_us/products/observability-cloud.html',
    asOf: SOURCE_AS_OF,
  },
  observabilityOverview: {
    type: 'public-disclosure',
    label: 'Splunk Observability Cloud overview documentation',
    url: 'https://help.splunk.com/en/splunk-observability-cloud/get-started/splunk-observability-cloud-overview/splunk-observability-cloud-overview',
    asOf: SOURCE_AS_OF,
  },
  enterpriseSecurity: {
    type: 'public-disclosure',
    label: 'Splunk Enterprise Security',
    url: 'https://www.splunk.com/en_us/products/enterprise-security.html',
    asOf: SOURCE_AS_OF,
  },
  pricing: {
    type: 'public-disclosure',
    label: 'Splunk pricing options',
    url: 'https://www.splunk.com/en_us/products/pricing.html',
    asOf: SOURCE_AS_OF,
  },
  observabilityPricing: {
    type: 'public-disclosure',
    label: 'Splunk Observability Cloud pricing',
    url: 'https://www.splunk.com/en_us/products/pricing/observability.html',
    asOf: SOURCE_AS_OF,
  },
  terms: {
    type: 'public-disclosure',
    label: 'Splunk terms for offerings',
    url: 'https://www.splunk.com/content/dam/splunk2/en_us/pdfs/legal/splunk-terms-for-splunk-offerings-february-2025.pdf',
    asOf: SOURCE_AS_OF,
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Splunk Data Processing Addendum',
    url: 'https://www.splunk.com/en_us/legal/splunk-dpa.html',
    asOf: SOURCE_AS_OF,
  },
  subprocessors: {
    type: 'public-disclosure',
    label: 'Splunk Offerings sub-processors notice',
    url: 'https://www.splunk.com/en_us/legal/sub-processors.html',
    asOf: SOURCE_AS_OF,
  },
  compliance: {
    type: 'public-disclosure',
    label: 'Compliance at Splunk',
    url: 'https://www.splunk.com/en_us/about-splunk/splunk-data-security-and-privacy/compliance-at-splunk.html',
    asOf: SOURCE_AS_OF,
  },
  ciscoAcquisition: {
    type: 'public-disclosure',
    label: 'Cisco completes acquisition of Splunk',
    url: 'https://www.splunk.com/en_us/newsroom/press-releases/2024/cisco-completes-acquisition-of-splunk.html',
    asOf: SOURCE_AS_OF,
  },
} satisfies Record<string, SourceBasisRef>;

const SPLUNK_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Splunk quote, order form, renewal notice, telemetry baseline, ingest history, support scope, service credits, implementation plan, and legal redlines needed',
  asOf: SOURCE_AS_OF,
  note:
    'Public Splunk and Cisco materials identify product scope, pricing model families, starting observability list-price anchors, public terms, and trust resources, but do not establish buyer-specific net price, private discounts, renewal uplift, committed-use treatment, workload shape, overage exposure, migration cost, or negotiated remedies.',
};

export const PAT_SRC_VEN_SPLUNK_001: PatternSeed = {
  id: 'PAT-SRC-VEN-SPLUNK-001',
  slug: 'splunk-observability-security-data-platform-sourcing-profile',
  title: 'Splunk Observability, Security, and Data Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Splunk sourcing should treat the vendor as a data, observability, security, AI, and Cisco-platform dependency decision rather than a narrow log-indexing or SIEM renewal.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking Splunk Cloud Platform, Splunk Enterprise, Splunk Enterprise Security, Splunk Observability Cloud, IT Service Intelligence, SOAR, UEBA, AppDynamics-adjacent observability, or Cisco-and-Splunk platform programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.82,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: [
    `${SPLUNK_SOURCE_BASIS.cloudPlatform.label} - ${SPLUNK_SOURCE_BASIS.cloudPlatform.url}`,
    `${SPLUNK_SOURCE_BASIS.observabilityCloud.label} - ${SPLUNK_SOURCE_BASIS.observabilityCloud.url}`,
    `${SPLUNK_SOURCE_BASIS.observabilityOverview.label} - ${SPLUNK_SOURCE_BASIS.observabilityOverview.url}`,
    `${SPLUNK_SOURCE_BASIS.enterpriseSecurity.label} - ${SPLUNK_SOURCE_BASIS.enterpriseSecurity.url}`,
    `${SPLUNK_SOURCE_BASIS.pricing.label} - ${SPLUNK_SOURCE_BASIS.pricing.url}`,
    `${SPLUNK_SOURCE_BASIS.observabilityPricing.label} - ${SPLUNK_SOURCE_BASIS.observabilityPricing.url}`,
    `${SPLUNK_SOURCE_BASIS.terms.label} - ${SPLUNK_SOURCE_BASIS.terms.url}`,
    `${SPLUNK_SOURCE_BASIS.dpa.label} - ${SPLUNK_SOURCE_BASIS.dpa.url}`,
    `${SPLUNK_SOURCE_BASIS.subprocessors.label} - ${SPLUNK_SOURCE_BASIS.subprocessors.url}`,
    `${SPLUNK_SOURCE_BASIS.compliance.label} - ${SPLUNK_SOURCE_BASIS.compliance.url}`,
    `${SPLUNK_SOURCE_BASIS.ciscoAcquisition.label} - ${SPLUNK_SOURCE_BASIS.ciscoAcquisition.url}`,
  ],
  regulatoryChips: [
    'GDPR-if-personal-data',
    'PCI-DSS-review-if-cardholder-data',
    'HIPAA-review-if-PHI',
    'DORA-if-regulated-financial-entity',
    'SOC-operations-critical-control',
    'observability-critical-control',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-SIEM-001', 'PAT-SRC-CAT-ITSM-001', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CON-004'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'data_analytics',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Splunk',
      tier: 'enterprise',
      positioning:
        'Enterprise data platform vendor, now a Cisco company, spanning Splunk Cloud Platform, Splunk Enterprise, security operations through Enterprise Security, and observability through Splunk Observability Cloud.',
      strengths: [
        'Official materials position Splunk Cloud Platform around search, analysis, visualization, action, streaming, machine learning, federated search, dashboards, and large-scale data ingestion',
        'Official Observability Cloud materials describe full-stack, OpenTelemetry-based observability with APM, infrastructure, RUM, synthetics, Log Observer Connect, and related analytics workflows',
        'Official Enterprise Security materials describe SIEM, threat intelligence, SOAR, UEBA, exposure analytics, detection lifecycle, federation, and AI-assistant capabilities by edition',
        'Cisco completed its acquisition of Splunk on March 18, 2024, making Cisco ownership, networking, security, and observability roadmap diligence part of the sourcing context',
      ],
      cautions: [
        'Public pages identify product families and pricing models, but do not prove buyer-specific net price, discount, renewal cap, credit, overage, or workload economics',
        'Scope can blur across ingest, workload, entity, activity, host, trace, MTS, session, uptime, security, support, services, marketplace, and Cisco-bundle assumptions',
        'Observability and security telemetry can contain sensitive operational, user, security, regulated, or incident-response data that requires data-flow and legal review before expansion',
        'Cisco integration may create strategic upside, but forward-looking integration or consolidation claims should remain non-binding unless written into order forms, support exhibits, or implementation plans',
      ],
      sourceBasis: [
        SPLUNK_SOURCE_BASIS.cloudPlatform,
        SPLUNK_SOURCE_BASIS.observabilityCloud,
        SPLUNK_SOURCE_BASIS.enterpriseSecurity,
        SPLUNK_SOURCE_BASIS.ciscoAcquisition,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Official pricing model orientation across Splunk Platform and Observability Cloud',
      model: 'hybrid',
      metric:
        'Workload pricing, ingest pricing, entity pricing, activity-based pricing, and public Observability Cloud per-host starting anchors; detailed buyer TCO depends on product, data source, telemetry volume, host/entity count, MTS, traces, sessions, uptime requests, support, and order-form scope',
      sourceBasis: [SPLUNK_SOURCE_BASIS.pricing, SPLUNK_SOURCE_BASIS.observabilityPricing],
      confidence: 0.73,
      notes:
        'Use official public pricing pages only as a meter and list-anchor map. The Observability Cloud page lists starts-at host/month amounts for Infrastructure, App & Infra, and End-to-End packages as of the source date, but this seed does not assert enterprise net pricing, discount bands, renewal uplift, committed-use value, marketplace pricing, security pricing, platform pricing, or buyer-specific run rate.',
    },
    {
      label: 'Founder data gap - Splunk commercial evidence required',
      model: 'unknown',
      sourceBasis: [SPLUNK_BUYER_DATA_GAP],
      confidence: 0.18,
      notes:
        'No quote normalization, savings case, migration case, renewal risk score, or vendor-replacement recommendation should be made without buyer-approved usage, quote, order-form, reseller, support, and deployment evidence.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Data source, telemetry, and pricing-meter exhibit',
      buyerPosition:
        'Attach a source-by-source exhibit covering daily ingest, indexed data, workload class, search intensity, retention, archive, federated search, hosts, entities, metric time series, traces, sessions, synthetics, uptime checks, security data, AI assistants, premium support, services, and every chargeable meter in the order form.',
      fallbackPosition:
        'If not all telemetry is known before BAFO, separate committed scope from optional expansion and require usage reporting, threshold alerts, and quote refresh before activation.',
      walkawayTriggers: [
        'No auditable bridge between proposed Splunk products, data sources, retention settings, operating workflows, and billable units',
        'Final commercial case depends on tool retirement or Cisco bundle value that is not tied to acceptance criteria',
      ],
      sourceBasis: [SPLUNK_SOURCE_BASIS.pricing, SPLUNK_SOURCE_BASIS.observabilityPricing, SPLUNK_SOURCE_BASIS.cloudPlatform],
    },
    {
      clauseArea: 'Security, compliance, data processing, and subprocessor evidence',
      buyerPosition:
        'Close applicable compliance report access, DPA execution path, customer trust portal evidence, service-specific security responsibilities, subprocessor or Cisco Trust Portal disclosure review, data-location review, and regulated-data approval before expanded telemetry, logs, or security records are transmitted.',
      fallbackPosition:
        'Where reports require NDA or portal access, make evidence delivery a pre-production or pre-expansion gate with named owner, due date, and remedy.',
      sourceBasis: [SPLUNK_SOURCE_BASIS.compliance, SPLUNK_SOURCE_BASIS.dpa, SPLUNK_SOURCE_BASIS.subprocessors, SPLUNK_SOURCE_BASIS.terms],
    },
    {
      clauseArea: 'Operational reliance, availability, and service-credit limits',
      buyerPosition:
        'Map Splunk availability, support, service levels, maintenance, incident communications, export rights, and customer responsibilities to the production services, SOC workflows, and executive reporting that depend on Splunk.',
      fallbackPosition:
        'If standard service credits are the only downtime remedy, require stronger incident communication, escalation, continuity, export, and transition-assistance obligations for critical reliance.',
      sourceBasis: [SPLUNK_SOURCE_BASIS.terms],
    },
    {
      clauseArea: 'Cisco integration and roadmap controls',
      buyerPosition:
        'Treat Cisco-and-Splunk integration, network/security/observability consolidation, and AI roadmap claims as evaluation hypotheses unless committed in scope, timeline, support, data-sharing, interoperability, or migration exhibits.',
      fallbackPosition:
        'Accept public roadmap context only for orientation; require written assumptions and acceptance gates before counting consolidation savings.',
      sourceBasis: [SPLUNK_SOURCE_BASIS.ciscoAcquisition],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Normalize data economics before BAFO',
      whenToUse:
        'Use when Splunk renewal, migration, or expansion spans Cloud Platform, Enterprise Security, Observability Cloud, ITSI, or Cisco-adjacent product bundles.',
      buyerAsk:
        'Require baseline ingest, search, workload, retention, trace, metric, session, synthetic, host, entity, and SOC data by product and environment, then price committed, optional, burst, and future-state scope separately.',
      vendorGive:
        'Vendor may offer workload pricing, ingest pricing, entity pricing, activity-based pricing, phased ramps, credits, services, or Cisco bundle constructs; each should be mapped to auditable buyer usage and order-form language.',
      tradeoffs: [
        'Broader platform use can simplify operations and analytics, but unnormalized telemetry can also increase spend variance and switching cost.',
        'Do not trade longer term or larger commitment for pricing unless downsize, substitution, export, and renewal-baseline protections are written.',
      ],
      evidenceBasis: [SPLUNK_SOURCE_BASIS.pricing, SPLUNK_SOURCE_BASIS.observabilityPricing],
    },
    {
      lever: 'Prove security and observability workflow value separately',
      whenToUse:
        'Use when the vendor or sponsor claims one Splunk platform program can replace multiple SOC, SIEM, SOAR, UEBA, APM, infrastructure monitoring, RUM, synthetics, or log analytics tools.',
      buyerAsk:
        'Run buyer-authored scenarios for detection lifecycle, alert triage, threat enrichment, incident response, service map troubleshooting, trace-to-log investigation, retention retrieval, and executive reporting before accepting tool-retirement savings.',
      tradeoffs: ['A single data platform may improve context, but security and reliability teams still need distinct operating-model, evidence, and response-time acceptance tests.'],
      evidenceBasis: [SPLUNK_SOURCE_BASIS.enterpriseSecurity, SPLUNK_SOURCE_BASIS.observabilityCloud, SPLUNK_SOURCE_BASIS.observabilityOverview],
    },
    {
      lever: 'Control Cisco roadmap and integration dependency',
      whenToUse:
        'Use when the business case relies on Cisco ownership, networking telemetry, AppDynamics adjacency, Talos enrichment, bundle economics, or future unified-platform capabilities.',
      buyerAsk:
        'Separate currently available contracted functionality from roadmap claims; require named integration milestones, data-sharing boundaries, support ownership, migration assistance, and rollback or coexistence rights.',
      evidenceBasis: [SPLUNK_SOURCE_BASIS.ciscoAcquisition, SPLUNK_SOURCE_BASIS.enterpriseSecurity],
    },
  ],
  riskFactors: [
    {
      id: 'splunk-meter-and-telemetry-sprawl',
      label: 'Meter and telemetry sprawl',
      severity: 'high',
      detectionSignals: [
        'Proposal combines ingest, workload, entity, activity, host, trace, MTS, session, uptime, retention, support, and service assumptions without a common usage baseline.',
        'Savings are counted before data reduction, federation, archive, tool retirement, or Cisco-bundle assumptions are proven.',
      ],
      mitigations: ['Build a telemetry and pricing-meter baseline workbook', 'Require monthly usage reporting and threshold alerts', 'Separate committed, optional, burst, and future-state scope'],
      contractualRemedies: ['Usage exhibit', 'Expansion quote refresh', 'Renewal baseline schedule', 'Downsize and substitution rights', 'Export and transition assistance'],
      sourceBasis: [SPLUNK_SOURCE_BASIS.pricing, SPLUNK_SOURCE_BASIS.observabilityPricing],
    },
    {
      id: 'splunk-sensitive-operational-data-flow-gap',
      label: 'Sensitive operational and security data-flow gap',
      severity: 'high',
      detectionSignals: [
        'Logs, traces, sessions, security detections, investigation notes, user identifiers, or regulated records enter Splunk before data classification, DPA, subprocessor, retention, and access reviews are complete.',
      ],
      mitigations: ['Run data-flow and retention review before production activation', 'Review DPA, trust, subprocessor, and service-specific terms', 'Apply masking, role design, and regulated-data gates'],
      contractualRemedies: ['DPA exhibit', 'Subprocessor notice process', 'Data export and deletion support', 'Regulated-data activation gate'],
      sourceBasis: [SPLUNK_SOURCE_BASIS.dpa, SPLUNK_SOURCE_BASIS.subprocessors, SPLUNK_SOURCE_BASIS.compliance, SPLUNK_SOURCE_BASIS.terms],
    },
    {
      id: 'splunk-platform-consolidation-overclaim',
      label: 'Platform consolidation overclaim',
      severity: 'medium',
      detectionSignals: [
        'Business case assumes SIEM, SOAR, UEBA, APM, log analytics, infrastructure monitoring, and Cisco telemetry consolidation without proof of feature parity, workflow fit, and migration effort.',
      ],
      mitigations: ['Run scripted SOC and SRE scenarios', 'Keep tool-retirement gates separate from license-signature gates', 'Document coexistence and rollback paths'],
      contractualRemedies: ['Acceptance criteria', 'Migration assistance', 'Roadmap exhibit', 'Support ownership schedule'],
      sourceBasis: [SPLUNK_SOURCE_BASIS.enterpriseSecurity, SPLUNK_SOURCE_BASIS.observabilityCloud, SPLUNK_SOURCE_BASIS.ciscoAcquisition],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Treat Splunk as a potential operational resilience and ICT third-party dependency when it supports production monitoring, SOC detection, incident response, regulated reporting, or critical infrastructure telemetry.',
      additionalRequirements: ['DORA classification review where applicable', 'Register-ready service and subcontractor evidence', 'Exit and continuity plan'],
      regulatoryRefs: ['DORA where applicable to EU financial entities'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm PHI boundaries, log redaction, trace/session controls, user access, DPA posture, retention, and incident workflow evidence before sending clinical, patient, workforce, or payer telemetry into Splunk services.',
      additionalRequirements: ['PHI boundary review', 'HIPAA/legal review where applicable', 'Sensitive-data masking and retention plan'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Verify product-specific authorization boundary, region, support model, Cisco/Splunk portal evidence, subcontractor disclosure path, and procurement vehicle rather than assuming all Splunk offerings share the same public-sector compliance posture.',
    },
    {
      industry: 'retail_cpg',
      modifier:
        'Separate observability for ecommerce, store systems, loyalty, payment-adjacent workflows, fraud signals, and SOC monitoring so PCI and customer-data controls are reviewed before broad log or session capture.',
      regulatoryRefs: ['PCI-DSS where cardholder data or adjacent telemetry is in scope'],
    },
  ],
  body: `## Summary
Splunk should be sourced as an enterprise data, observability, security, and Cisco-platform dependency, not as a simple log tool or standalone SIEM renewal. Public Splunk materials describe Splunk Cloud Platform as a service for searching, analyzing, visualizing, and acting on data, with streaming, machine learning, federated search, dashboards, and large-scale ingestion. Public Observability Cloud materials describe a full-stack observability platform with OpenTelemetry-based data collection, APM, infrastructure monitoring, Real User Monitoring, synthetic monitoring, Log Observer Connect, and analytics workflows. Public Enterprise Security materials describe SIEM, threat intelligence, SOAR, UEBA, exposure analytics, detection lifecycle, federation, and AI-assistant capabilities. Cisco completed its acquisition of Splunk on March 18, 2024, so a sourcing team should also test Cisco ownership, integration, support, and roadmap assumptions rather than treating them as guaranteed buyer value.

## When to apply
Use this pattern when Splunk is an incumbent, finalist, renewal target, expansion candidate, migration destination, or consolidation platform across security operations, observability, log analytics, IT operations, digital resilience, AI assistant workflows, or Cisco-adjacent programs. It applies to Splunk Cloud Platform, Splunk Enterprise, Enterprise Security, Observability Cloud, ITSI, SOAR, UEBA, AppDynamics-adjacent observability, and any event where the sponsor expects one data platform to replace multiple monitoring, SIEM, APM, log, incident, or analytics tools. The pattern does not decide that Splunk is the right technical answer. It ensures the buying process ties each product and promise to data scope, operating workflow, commercial meter, legal term, implementation evidence, and exit path.

## Evidence to collect
Start with a data estate baseline: current daily ingest, indexed and archived data, retention by source, search intensity, workload class, hosts, entities, metric time series, traces, sessions, synthetics, uptime checks, security event sources, identity sources, cloud accounts, regulated data classes, alert volumes, incident workflows, dashboards, data export needs, and current tool costs. Then map each Splunk module to a specific use case: SOC detection, threat investigation, SOAR automation, UEBA, exposure analytics, production troubleshooting, infrastructure health, browser experience, synthetic testing, AI assistant usage, executive reporting, or long-term analytics. Require evidence for what the module replaces, augments, or newly enables.

## Commercial posture
Splunk public pricing materials are useful for meter discovery, not for buyer-specific economics. Official pages identify workload pricing, ingest pricing, entity pricing, and activity-based pricing, and the Observability Cloud pricing page shows public per-host starting anchors for listed packages. Those sources should drive normalization questions: what data is ingested, searched, retained, federated, analyzed, traced, monitored, or billed by host, entity, metric, trace, session, or uptime request? They should not be used to invent enterprise net price, discount bands, renewal uplift, committed-use value, marketplace economics, security pricing, platform pricing, or migration cost. The BAFO workbook should split committed production scope, optional modules, expansion unit rates, data-reduction assumptions, archive and retention choices, support level, services, Cisco bundle assumptions, reseller or marketplace path, ramp timing, renewal baseline, and exit assistance.

## Contract and data controls
Splunk can become a critical operational evidence store. Logs, traces, sessions, security detections, user identifiers, incident notes, and infrastructure telemetry can expose sensitive operational or regulated data. Before production expansion, sourcing should close the DPA path, compliance evidence access, service-specific terms, trust portal evidence, subprocessor or Cisco Trust Portal disclosure review, data-location assumptions, masking approach, retention controls, role design, export rights, and deletion obligations. Public Splunk terms also point to service-level schedules and service credits for some offerings; those remedies should be tested against the buyer's reliance on Splunk for outage detection, SOC response, executive reporting, and regulated operational resilience. If the buyer depends on Splunk to detect production or security incidents, service credits alone may not be enough; escalation, communication, continuity, export, and transition obligations matter.

## Evaluation scenarios
Run buyer-authored scenarios before award. For security: onboard a priority data source, tune a detection, enrich an alert, investigate an identity anomaly, trigger a response playbook, retrieve audit evidence, and report detection coverage. For observability: instrument a critical service, connect traces to logs, diagnose a slow transaction, test browser and synthetic signals, route an incident, and show business-impact reporting. For platform economics: reduce or route low-value data, test federation, model retention changes, and reconcile usage against the quote. For Cisco dependency: separate currently contracted features from forward-looking roadmap claims and document which team owns support across Cisco, Splunk, reseller, and implementation partners.

## Pitfalls
The first failure mode is buying on a platform story while leaving ingest, workload, retention, trace, metric, session, and security meters vague. The second is assuming tool consolidation savings before workflow acceptance and data migration are proven. The third is sending sensitive telemetry into broader modules before DPA, subprocessor, retention, masking, access, and regulated-data reviews are complete. The fourth is treating Cisco integration as realized value without written scope, dates, data-sharing boundaries, support ownership, and rollback rights. Hedge public claims carefully: public sources support product scope, pricing model families, ownership status, and trust-resource availability, but buyer recommendations require quotes, order forms, usage logs, legal review, architecture proof, support history, and implementation evidence.

## Instances
No tenant instances are attached to this seed. Use it as a public-source vendor profile and enrich it only with approved buyer evidence before making a vendor recommendation, pricing conclusion, renewal-risk conclusion, or migration plan.`,
};

export const SOURCING_VENDOR_SPLUNK_PATTERNS: PatternSeed[] = [PAT_SRC_VEN_SPLUNK_001];
