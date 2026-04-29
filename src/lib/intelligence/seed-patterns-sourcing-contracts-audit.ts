import type { PatternSeed } from './seed-types';

const AUDIT_USAGE_SOURCE_BASIS = {
  aicpaSoc: {
    type: 'public-disclosure' as const,
    label: 'AICPA & CIMA System and Organization Controls overview',
    url: 'https://www.aicpa-cima.com/soc',
    asOf: '2026-04-29',
    note: 'Public AICPA SOC overview; used only as a source for assurance-report framing, not as a substitute for buyer legal or audit advice.',
  },
  aicpaSoc2Guide: {
    type: 'public-disclosure' as const,
    label: 'AICPA & CIMA SOC 2 guide for controls relevant to security, availability, processing integrity, confidentiality, or privacy',
    url: 'https://www.aicpa-cima.com/cpe-learning/publication/soc-2-reporting-on-an-examination-of-controls-at-a-service-organization-relevant-to-security-availability-processing-integrity-confidentiality-or-privacy',
    asOf: '2026-04-29',
    note: 'Public guide page describing SOC 2 examination context and trust-services categories.',
  },
  microsoftStp: {
    type: 'public-disclosure' as const,
    label: 'Microsoft Learn: Get started with the Microsoft Service Trust Portal',
    url: 'https://learn.microsoft.com/en-us/compliance/assurance/stp-get-started',
    asOf: '2026-04-29',
    note: 'Microsoft describes the Service Trust Portal as a place for audit reports and compliance resources for Microsoft cloud services.',
  },
  microsoftAssurance: {
    type: 'public-disclosure' as const,
    label: 'Microsoft Learn: Auditing and reporting in Microsoft cloud services',
    url: 'https://learn.microsoft.com/mt-mt/compliance/assurance/assurance-auditing-and-reporting-overview',
    asOf: '2026-04-29',
    note: 'Microsoft source for tenant-facing audit information, service-assurance materials, and external-auditor access concepts.',
  },
  salesforceTrust: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Trust and Compliance Documentation',
    url: 'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/',
    asOf: '2026-04-29',
    note: 'Salesforce describes SPARC documentation as covering architecture, security/privacy audits and certifications, and controls for covered services.',
  },
  salesforceAuditTrail: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Help: Auditing',
    url: 'https://help.salesforce.com/s/articleView?id=xcloud.security_overview_auditing.htm&language=en_US&type=5',
    asOf: '2026-04-29',
    note: 'Salesforce public help page describing admin-facing audit features and monitoring concepts.',
  },
  googleAuditLogs: {
    type: 'public-disclosure' as const,
    label: 'Google Cloud Documentation: Cloud Audit Logs overview',
    url: 'https://docs.cloud.google.com/logging/docs/audit',
    asOf: '2026-04-29',
    note: 'Google Cloud source used as a public example of provider-managed audit-log categories and export/retention planning considerations.',
  },
  gdprArticle28: {
    type: 'regulatory-document' as const,
    label: 'Regulation (EU) 2016/679 Article 28 official text',
    url: 'https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504',
    asOf: '2026-04-29',
    note: 'Used only where personal-data processing is in scope; Article 28 includes information availability and audit cooperation concepts for processors.',
  },
};

export const SOURCING_CONTRACT_AUDIT_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-CON-007',
    slug: 'saas-audit-rights-usage-evidence-governance',
    title: 'SaaS Audit Rights and Usage Evidence Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'SaaS audit-rights clauses become decision-grade only when they define the usage, access, control, exception, and remediation evidence the buyer can actually collect during the subscription term.',
    applicability:
      'Apply to SaaS, cloud platform, AI-service, collaboration, CRM, HR, finance, security, analytics, and workflow agreements where subscription usage, privileged access, customer data, uptime, control assurance, or renewal economics must be verified after signature.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.aicpa-cima.com/soc',
      'https://www.aicpa-cima.com/cpe-learning/publication/soc-2-reporting-on-an-examination-of-controls-at-a-service-organization-relevant-to-security-availability-processing-integrity-confidentiality-or-privacy',
      'https://learn.microsoft.com/en-us/compliance/assurance/stp-get-started',
      'https://learn.microsoft.com/mt-mt/compliance/assurance/assurance-auditing-and-reporting-overview',
      'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/',
      'https://help.salesforce.com/s/articleView?id=xcloud.security_overview_auditing.htm&language=en_US&type=5',
      'https://docs.cloud.google.com/logging/docs/audit',
      'https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504',
    ],
    regulatoryChips: [
      'SaaS-audit-rights',
      'usage-evidence',
      'SOC-report-scope',
      'tenant-audit-logs',
      'GDPR-if-personal-data',
      'legal-review-required',
    ],
    relatedPatternIds: ['PAT-SRC-CON-002', 'PAT-SRC-CON-005', 'PAT-SRC-CON-006', 'PAT-SRC-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'contract_intelligence',
    vendorClass: 'direct-tech',
    standardClauses: [
      {
        clauseArea: 'Evidence catalog and cadence',
        buyerPosition:
          'Define the SaaS evidence catalog before award: SOC or equivalent reports, certifications, bridge letters, security summaries, incident notices, uptime reports, usage exports, admin audit logs, access logs, support-access records, and remediation updates, with cadence and owner for each item.',
        fallbackPosition:
          'If the vendor will not list every artifact in the agreement, require an order-form evidence schedule or trust-portal access covenant that identifies scope, update frequency, retention limits, and escalation for unavailable evidence.',
        vendorPosition:
          'Vendor may prefer customer access through standard trust portals, admin consoles, and documented APIs rather than bespoke audit deliverables.',
        walkawayTriggers: [
          'Vendor can satisfy all audit requests with generic marketing trust pages that are not mapped to the purchased service.',
          'Usage, access, or control evidence is unavailable until after renewal, dispute, or incident escalation.',
        ],
        sourceBasis: [AUDIT_USAGE_SOURCE_BASIS.aicpaSoc, AUDIT_USAGE_SOURCE_BASIS.microsoftStp, AUDIT_USAGE_SOURCE_BASIS.salesforceTrust],
      },
      {
        clauseArea: 'Usage and entitlement verification',
        buyerPosition:
          'Require exportable, date-bounded evidence for licensed users, active users, dormant users, feature consumption, API or token consumption, storage, overages, support tiers, and module adoption so renewal baselines can be tested against actual use.',
        fallbackPosition:
          'Accept portal or API evidence if it is retained long enough for renewal review, includes field definitions, and can be reconciled to invoices and order-form entitlements.',
        walkawayTriggers: [
          'Vendor refuses to define the source of truth for billable usage, active use, or overage calculation.',
          'Usage exports cannot be reconciled to invoice quantities, committed tiers, or renewal quotes.',
        ],
        sourceBasis: [AUDIT_USAGE_SOURCE_BASIS.salesforceAuditTrail, AUDIT_USAGE_SOURCE_BASIS.googleAuditLogs],
      },
      {
        clauseArea: 'Trigger-based enhanced verification',
        buyerPosition:
          'Preserve enhanced evidence rights for material incidents, repeated SLA failures, disputed invoices, abnormal usage spikes, audit-report exceptions, privileged-access concerns, regulator inquiry, or unresolved remediation.',
        fallbackPosition:
          'For multi-tenant services, use structured evidence substitutes: independent reports, management responses, issue-specific attestations, log exports, bridge letters, and regulator-facing cooperation where applicable.',
        sourceBasis: [AUDIT_USAGE_SOURCE_BASIS.aicpaSoc2Guide, AUDIT_USAGE_SOURCE_BASIS.microsoftAssurance, AUDIT_USAGE_SOURCE_BASIS.gdprArticle28],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Evidence schedule before BAFO close',
        whenToUse:
          'Use before final commercial close when the vendor wants the buyer to rely on standard SaaS terms, a trust portal, or an automated billing model.',
        buyerAsk:
          'Attach a one-page evidence schedule that names each required artifact, source system, access method, retention period, refresh cadence, confidentiality treatment, and escalation owner.',
        vendorGive:
          'Vendor can keep standard audit language while committing to practical evidence access through portals, APIs, reports, and support workflows.',
        tradeoffs: [
          'Standardized evidence access is often more realistic than broad on-site inspection, but only if the scope matches the service being purchased.',
          'Portal-only evidence is weak when the buyer cannot export or retain it for renewal, dispute, or audit review.',
        ],
        evidenceBasis: [AUDIT_USAGE_SOURCE_BASIS.microsoftStp, AUDIT_USAGE_SOURCE_BASIS.salesforceTrust],
      },
      {
        lever: 'Renewal baseline reconciliation',
        whenToUse:
          'Use when subscription quantities, consumption metrics, shelfware, AI credits, storage, or support tiers affect renewal economics.',
        buyerAsk:
          'Require renewal quotes to reconcile against exportable usage and entitlement evidence before the non-renewal deadline.',
        tradeoffs: [
          'This can lengthen renewal preparation, but it prevents commercial decisions from relying on unverified vendor-reported consumption.',
        ],
      },
    ],
    riskFactors: [
      {
        id: 'saas-audit-evidence-not-operationalized',
        label: 'Audit right exists but evidence path is not operationalized',
        severity: 'high',
        detectionSignals: [
          'The contract grants audit rights but does not identify report access, usage exports, log availability, retention, or escalation workflow.',
          'The trust-portal evidence is not tied to the ordered service, region, module, or control period.',
          'Renewal pricing depends on usage that cannot be independently exported or reconciled.',
        ],
        mitigations: [
          'Add an evidence schedule covering assurance reports, usage data, audit logs, remediation updates, and trigger events.',
          'Validate source-system definitions before award and again before renewal notice deadlines.',
          'Escalate service-scope mismatches to legal, security, privacy, finance, and sourcing owners.',
        ],
        contractualRemedies: [
          'Evidence schedule',
          'Usage export right',
          'Trust-portal access covenant',
          'Trigger-based enhanced verification',
          'Remediation update obligation',
        ],
        sourceBasis: [AUDIT_USAGE_SOURCE_BASIS.aicpaSoc, AUDIT_USAGE_SOURCE_BASIS.microsoftAssurance, AUDIT_USAGE_SOURCE_BASIS.gdprArticle28],
      },
    ],
    body: `## Summary
SaaS audit rights are useful only if they translate into evidence the buyer can retrieve, retain, and reconcile during normal operations. A clause that says the buyer may audit is not enough when the service is multi-tenant, evidence sits behind a trust portal, and renewal economics depend on vendor-calculated usage. This pattern turns the right to verify into a governed evidence schedule covering assurance reports, usage exports, admin audit logs, access records, incident evidence, remediation updates, and renewal baseline reconciliation.

## When to apply
Apply this pattern to SaaS and cloud services where the buyer relies on the vendor for security controls, customer-data processing, uptime, privileged support access, consumption metering, AI credits, storage, or licensed-user counts. It is especially relevant before BAFO close, before signing a renewal, after a material incident, or when the vendor proposes standard audit language without showing how evidence will actually be delivered.

## Evidence model
Start with scope matching. The buyer should identify the purchased service, region, module, data types, tenant boundary, and control period, then map each evidence item to that scope. Public provider materials show why this matters. AICPA describes SOC reporting as assurance over service-organization controls, while large SaaS providers publish trust or service-assurance portals for audit reports and compliance materials. Those sources can be valuable, but the sourcing record must still show whether the report covers the service and period the buyer is buying.

Next define usage evidence. The contract file should name the source of truth for licensed users, active users, dormant accounts, feature usage, API calls, AI tokens or credits, storage, overages, support tiers, and module adoption where those metrics affect price or governance. Evidence should be exportable or otherwise retainable before renewal deadlines. Screenshots and portal views may help, but they are weak if they cannot be reconciled to invoices, order forms, entitlement tables, or renewal quotes.

## Contract posture
The buyer position is not unlimited on-site access. For many multi-tenant SaaS services, structured substitutes can be more realistic: independent reports, certifications, bridge letters, management responses to exceptions, admin-console audit trails, log exports, incident-specific attestations, and named support escalation. The contract should also preserve enhanced verification triggers for material incidents, disputed usage, repeated SLA failures, abnormal consumption spikes, unresolved audit exceptions, regulator inquiries, or suspected privileged-access misuse. Where personal data is processed, legal and privacy reviewers should evaluate whether the evidence path supports applicable processor-contract obligations; this pattern does not replace that advice.

## Evaluation signals
A strong sourcing event can answer five questions before award. What evidence will be available? How often is it refreshed? Can the buyer export or retain it? Does it match the purchased service scope? What happens when the evidence shows an exception or cannot be produced? A weak event relies on generic trust pages, non-exportable dashboards, broad audit language, or account-team assurances that are not tied to an owner, cadence, retention period, or remediation workflow.

## Pitfalls
The most common failure is treating a SOC report, certification badge, or trust-center page as complete audit evidence without checking service scope, control period, exceptions, subprocessor relevance, or management response. Another failure is separating contract audit rights from commercial usage governance, allowing renewal baselines to be set from vendor-reported consumption that the buyer cannot test. The durable output is a SaaS evidence schedule that travels with the contract, renewal calendar, security review, privacy review, and finance baseline so the buyer can verify both control posture and commercial usage without reconstructing the evidence story after leverage is gone.`,
  },
];
