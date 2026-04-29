import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const NEW_RELIC_SOURCE_BASIS = {
  platform: {
    type: 'public-disclosure',
    label: 'New Relic Intelligent Observability Platform',
    url: 'https://newrelic.com/platform',
    asOf: SOURCE_AS_OF,
  },
  pricing: {
    type: 'public-disclosure',
    label: 'New Relic pricing',
    url: 'https://newrelic.com/pricing',
    asOf: SOURCE_AS_OF,
  },
  ingestManagement: {
    type: 'public-disclosure',
    label: 'New Relic data ingest management documentation',
    url: 'https://docs.newrelic.com/docs/data-apis/manage-data/manage-data-coming-new-relic/',
    asOf: SOURCE_AS_OF,
  },
  pricingDefinitions: {
    type: 'public-disclosure',
    label: 'New Relic usage-based pricing definitions',
    url: 'https://docs.newrelic.com/docs/licenses/license-information/product-definitions/new-relic-one-pricing-definitions/',
    asOf: SOURCE_AS_OF,
  },
  privacy: {
    type: 'public-disclosure',
    label: 'New Relic data privacy documentation',
    url: 'https://docs.newrelic.com/docs/security/security-privacy/data-privacy/data-privacy-new-relic/',
    asOf: SOURCE_AS_OF,
  },
  compliance: {
    type: 'public-disclosure',
    label: 'New Relic certifications, standards, and regulations documentation',
    url: 'https://docs.newrelic.com/docs/security/security-privacy/compliance/regulatory-audits-new-relic-services/',
    asOf: SOURCE_AS_OF,
  },
  subprocessors: {
    type: 'public-disclosure',
    label: 'New Relic sub-processors',
    url: 'https://newrelic.com/sub-processors',
    asOf: SOURCE_AS_OF,
  },
  terms: {
    type: 'public-disclosure',
    label: 'New Relic Terms of Service',
    url: 'https://newrelic.com/termsandconditions/terms',
    asOf: SOURCE_AS_OF,
  },
  dpa: {
    type: 'public-disclosure',
    label: 'New Relic Data Processing Addendum',
    url: 'https://newrelic.com/termsandconditions/dataprotection',
    asOf: SOURCE_AS_OF,
  },
  serviceSpecificTerms: {
    type: 'public-disclosure',
    label: 'New Relic Service Specific Terms',
    url: 'https://newrelic.com/termsandconditions/service-specific',
    asOf: SOURCE_AS_OF,
  },
} satisfies Record<string, SourceBasisRef>;

const NEW_RELIC_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific New Relic order form, quote, usage export, telemetry baseline, security review, and renewal evidence',
  note:
    'Public New Relic materials describe product scope, published price mechanisms, public terms, compliance documentation, and data controls, but do not establish buyer-specific net price, private discounts, committed-use treatment, renewal caps, reseller economics, overage exposure, or negotiated remedies.',
};

export const PAT_SRC_VEN_NEWRELIC_001: PatternSeed = {
  id: 'PAT-SRC-VEN-NEWRELIC-001',
  slug: 'newrelic-observability-platform-sourcing-profile',
  title: 'New Relic Observability Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'New Relic sourcing should treat the platform as an observability, telemetry-ingest, user-access, compute-consumption, data-governance, and operational-resilience decision rather than a narrow APM or log-management renewal.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking New Relic for APM, distributed tracing, infrastructure monitoring, Kubernetes, cloud monitoring, log management, synthetics, browser or mobile monitoring, AIOps, service levels, dashboards, AI monitoring, vulnerability management, or broader observability platform standardization.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(NEW_RELIC_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'HIPAA-review-if-PHI',
    'FedRAMP-if-public-sector-or-government-workload',
    'DORA-if-regulated-financial-entity',
    'security-operations-critical-control',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CON-004', 'PAT-SRC-PROC-007', 'PAT-SRC-PRC-SAAS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'infrastructure',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'New Relic',
      tier: 'enterprise',
      positioning:
        'Enterprise observability platform vendor spanning APM, infrastructure monitoring, cloud and Kubernetes monitoring, logs, distributed tracing, browser and mobile monitoring, synthetics, AIOps, OpenTelemetry, dashboards, service levels, AI monitoring, and selected security-adjacent capabilities.',
      strengths: [
        'Official platform materials describe a broad observability surface with 50+ capabilities and 780+ integrations',
        'Public pricing materials expose data ingest, user type, and compute-oriented mechanisms that can anchor a sourcing normalization workbook',
        'Public documentation covers data ingest management, usage definitions, privacy responsibilities, compliance posture, subprocessors, terms, and data-processing addendum topics',
      ],
      cautions: [
        'Public prices and product pages do not prove enterprise net price, private discount, committed-use value, reseller terms, support concessions, renewal caps, or buyer-specific overage exposure',
        'Telemetry scope can expand through logs, traces, metrics, browser events, mobile events, synthetics, AI monitoring, and security-adjacent data unless ingestion controls and owners are explicit',
        'Compliance status, HIPAA or FedRAMP eligibility, Data Plus requirements, data region, and product-specific scope should be verified for the exact services being purchased',
      ],
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.platform,
        NEW_RELIC_SOURCE_BASIS.pricing,
        NEW_RELIC_SOURCE_BASIS.ingestManagement,
        NEW_RELIC_SOURCE_BASIS.compliance,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public New Relic pricing mechanism orientation only',
      model: 'hybrid',
      metric:
        'Data ingest, user type, edition, Data Plus, and compute-capacity dimensions disclosed in public New Relic pricing and usage-definition materials',
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.pricing,
        NEW_RELIC_SOURCE_BASIS.pricingDefinitions,
        NEW_RELIC_BUYER_DATA_GAP,
      ],
      confidence: 0.71,
      notes:
        'Use public New Relic pricing to identify the commercial meters and quote-normalization questions. Do not infer buyer-specific net price, discount range, committed-use economics, renewal uplift, overage treatment, marketplace pricing, support concession, or enterprise bundle value without approved quote, order-form, usage-export, invoice, and renewal evidence.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Telemetry scope, ingest controls, and usage reporting',
      buyerPosition:
        'Attach a service schedule that separates APM, infrastructure, Kubernetes, cloud integrations, logs, distributed traces, browser, mobile, synthetics, AI monitoring, vulnerability data, retention, Data Plus, users, compute-capacity exposure, regions, and every usage metric expected to affect spend.',
      fallbackPosition:
        'If final telemetry volume is not known before award, split committed scope from optional streams and require data-ingest dashboards, budget thresholds, monthly usage exports, alerting, and quote refresh before expansion.',
      walkawayTriggers: ['No auditable connection between proposed modules, telemetry sources, user types, compute features, and billable usage dimensions'],
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.pricing,
        NEW_RELIC_SOURCE_BASIS.ingestManagement,
        NEW_RELIC_SOURCE_BASIS.pricingDefinitions,
      ],
    },
    {
      clauseArea: 'Data privacy, processor terms, and subprocessor governance',
      buyerPosition:
        'Close DPA, transfer mechanism, data-region, subprocessor notice, sensitive-data, log obfuscation, user-access, audit-event, deletion, retention, and export requirements before production logs, traces, user-session data, security findings, or AI telemetry are sent to New Relic.',
      fallbackPosition:
        'If privacy review is incomplete, restrict rollout to non-sensitive telemetry and require legal, security, and data-owner approval before regulated data or personal data enters the platform.',
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.privacy,
        NEW_RELIC_SOURCE_BASIS.dpa,
        NEW_RELIC_SOURCE_BASIS.subprocessors,
      ],
    },
    {
      clauseArea: 'Operational reliance, compliance scope, and resilience',
      buyerPosition:
        'Map support level, incident communication, availability expectations, FedRAMP or HIPAA eligibility, compliance program scope, service-specific terms, customer configuration responsibilities, export paths, and transition assistance to the production services that depend on New Relic.',
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.terms,
        NEW_RELIC_SOURCE_BASIS.serviceSpecificTerms,
        NEW_RELIC_SOURCE_BASIS.compliance,
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Normalize ingest and compute before observability consolidation',
      whenToUse:
        'Use when New Relic is proposed as a standard platform across APM, logs, infrastructure, digital experience, synthetics, AI monitoring, AIOps, service levels, or security-adjacent workflows.',
      buyerAsk:
        'Require a baseline workbook for data sources, ingest volume, retention, drop or transform rules, user types, advanced compute features, Data Plus requirements, alert thresholds, account structure, and retired-tool assumptions before accepting platform-consolidation economics.',
      tradeoffs: [
        'A single platform can reduce context switching, but consolidation value is not bankable until telemetry scope, ingestion controls, users, compute usage, and tool-retirement gates are proven.',
      ],
      evidenceBasis: [
        NEW_RELIC_SOURCE_BASIS.platform,
        NEW_RELIC_SOURCE_BASIS.pricing,
        NEW_RELIC_SOURCE_BASIS.ingestManagement,
        NEW_RELIC_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'Gate regulated telemetry and advanced services by evidence',
      whenToUse:
        'Use before enabling Data Plus, FedRAMP or HIPAA-sensitive workloads, AI monitoring, vulnerability management, session or mobile telemetry, log payloads, or production security workflows.',
      buyerAsk:
        'Tie activation to compliance-scope confirmation, DPA and subprocessor review, data-region selection, masking or obfuscation controls, role-based access, audit events, retention, export, and owner signoff for every regulated or sensitive telemetry stream.',
      evidenceBasis: [
        NEW_RELIC_SOURCE_BASIS.privacy,
        NEW_RELIC_SOURCE_BASIS.compliance,
        NEW_RELIC_SOURCE_BASIS.dpa,
      ],
    },
  ],
  riskFactors: [
    {
      id: 'newrelic-ingest-and-compute-sprawl',
      label: 'Telemetry ingest and compute sprawl',
      severity: 'high',
      detectionSignals: [
        'Proposal references broad observability coverage but does not map data sources, retention, users, Data Plus, compute-capacity features, or ingest controls to billable usage',
        'Savings case assumes tool retirement before log, trace, metric, browser, mobile, synthetics, and AI-monitoring volume is measured',
      ],
      mitigations: ['Build a telemetry baseline workbook', 'Set ingest budgets and alerts', 'Separate committed rollout from optional telemetry streams'],
      contractualRemedies: ['Usage reporting exhibit', 'Expansion quote refresh', 'Renewal baseline schedule', 'Downsize and module-substitution rights'],
      sourceBasis: [NEW_RELIC_SOURCE_BASIS.pricing, NEW_RELIC_SOURCE_BASIS.ingestManagement],
    },
    {
      id: 'newrelic-sensitive-observability-data-flow-gap',
      label: 'Sensitive observability data-flow gap',
      severity: 'high',
      detectionSignals: [
        'Production logs, traces, browser events, mobile telemetry, AI inputs, vulnerability data, or customer identifiers enter New Relic before privacy, legal, and security owners approve the data flow',
      ],
      mitigations: ['Run data-flow review before activation', 'Apply obfuscation or drop rules where appropriate', 'Review DPA, subprocessors, data regions, retention, and compliance scope'],
      contractualRemedies: ['DPA exhibit', 'Subprocessor notice process', 'Data export and deletion support', 'Sensitive-data activation gate'],
      sourceBasis: [
        NEW_RELIC_SOURCE_BASIS.privacy,
        NEW_RELIC_SOURCE_BASIS.dpa,
        NEW_RELIC_SOURCE_BASIS.subprocessors,
      ],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Treat New Relic as a potential ICT third-party and operational-resilience dependency when it supports production monitoring, alerting, incident response, digital-channel reliability, or security-adjacent telemetry for regulated financial workloads.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'GDPR if personal data enters telemetry'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm HIPAA eligibility, BAA path, Data Plus or approved subscription requirements, PHI boundaries, log and session controls, access permissions, and retention before sending clinical or patient-adjacent telemetry.',
      additionalRequirements: ['PHI boundary review', 'BAA and subscription eligibility review', 'Sensitive-data obfuscation and retention plan'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Verify FedRAMP applicability, endpoint configuration, region, authorization boundary, support model, subprocessor posture, and product-specific compliance status rather than assuming every module has the same public-sector posture.',
      additionalRequirements: ['FedRAMP scope confirmation', 'Government endpoint and region review', 'Contract vehicle and support model review'],
    },
  ],
  body: `## Summary
New Relic should be sourced as an enterprise observability platform and telemetry control plane, not as a simple APM renewal. Public New Relic materials position the platform around 50+ capabilities and 780+ integrations, including APM, distributed tracing, infrastructure monitoring, Kubernetes and cloud monitoring, browser and mobile monitoring, synthetic monitoring, log management, OpenTelemetry, AIOps, service levels, dashboards, AI monitoring, and vulnerability management. That breadth can help a buyer reduce context switching and tool fragmentation, but only if the sourcing event proves what telemetry will enter the platform, which teams will use it, what usage dimensions will drive cost, and which incumbent tools can actually be retired.

## When to apply
Use this pattern when New Relic is an incumbent, finalist, expansion candidate, or benchmark vendor for application performance monitoring, infrastructure observability, logs, traces, digital experience monitoring, synthetic checks, AI application monitoring, service-level management, cloud monitoring, or an enterprise observability consolidation program. The pattern does not assert that New Relic is technically preferred. It makes the sourcing process decision-grade by forcing the buyer to connect public product scope to buyer-specific estates, data sources, user personas, support needs, security review, and commercial meters.

## Evidence to collect
Start with the telemetry baseline: applications, services, hosts, containers, Kubernetes clusters, serverless functions, cloud accounts, log sources, trace volume, browser and mobile events, synthetics, dashboards, alert policies, service levels, AI workloads, vulnerability data, current observability tools, current incidents, and export requirements. Then capture commercial facts: edition, user types, Data Plus need, data region, advanced compute exposure, support level, marketplace or reseller path, order term, committed volume, true-up or overage treatment, and renewal baseline. New Relic documentation says the data ingestion UI can show active sources and contribution to total ingest, which makes buyer usage exports a required input rather than a post-award nice-to-have.

## Commercial posture
Public New Relic pricing is useful as a meter map, not as buyer economics. The public page describes pricing around data ingest, user types, and advanced compute, and its usage definitions describe Compute Capacity Unit consumption for actions such as loading a page, executing a query, evaluating an alert condition, or invoking an API call. Those public facts should drive a BAFO workbook that separates data ingest, Data Plus, full platform users, core users, basic users, compute features, support, retention, and optional modules. Do not infer private discounts, enterprise net price, renewal caps, support concessions, committed-use value, or marketplace economics without quote, usage, invoice, and order-form evidence.

## Evaluation design
The event should include a side-by-side scenario rather than a feature checklist. Ask New Relic and alternates to ingest the same representative service map, Kubernetes or cloud workload, log stream, trace path, synthetic check, dashboard, alert policy, and incident-review workflow. Score the finalist on source setup effort, data filtering controls, query performance, alert precision, dashboard maintainability, role design, usage visibility, and exportability. The most important artifact is the telemetry-to-commercial trace: every proposed monitoring stream should connect to expected usage, owner, retention, privacy posture, and termination or downsizing path. If a vendor cannot explain how a buyer controls ingest, user expansion, Data Plus scope, or compute-heavy workflows, keep the economics provisional.

## Contract and data controls
Observability data can include operational secrets, customer identifiers, user-session context, error payloads, infrastructure metadata, security findings, and AI application telemetry. New Relic privacy documentation says customers are responsible for configuring systems so inappropriate personal data or sensitive material is not sent to monitoring tools. The sourcing file should therefore require data-flow review, DPA review, subprocessor review, region and transfer-mechanism confirmation, retention decisions, obfuscation or drop rules, user-access governance, audit-event requirements, export paths, and deletion support before sensitive production telemetry is expanded.

## Negotiation focus
The strongest ask is not simply a lower platform price. It is a scope-normalized package: baseline telemetry, named modules, edition and Data Plus assumptions, users, advanced compute controls, ingest budgets, threshold alerts, reporting cadence, support response, compliance scope, renewal baseline, future unit treatment, and downsizing or module-substitution rights. If consolidation savings are claimed, require parallel-run acceptance criteria and tool-retirement gates before booking value.

## Pitfalls
The main failure mode is buying a broad observability story while leaving ingestion governance fragmented. A second failure is treating public list metrics as negotiated economics. A third is enabling logs, session data, AI monitoring, vulnerability data, or regulated workload telemetry before privacy, security, legal, and platform owners approve the data flow. Use public New Relic sources to structure diligence, then use buyer telemetry, finalist quotes, order forms, security review, and renewal history for the final recommendation.`,
};
