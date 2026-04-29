import type { PatternSeed } from './seed-types';

const SMARTSHEET_VENDOR_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Smartsheet estate and portfolio boundary',
    order: 1,
    description:
      'Baseline sheets, reports, dashboards, forms, WorkApps, Resource Management, Control Center, Dynamic View, Data Shuttle, connectors, AI, identity, data region, and regulated-workflow boundaries before commercial comparison.',
  },
  {
    id: 'CommercialBaseline',
    label: 'Plan, add-on, and Advanced Work Management baseline',
    order: 2,
    description:
      'Separate public Pro and Business plan orientation, Enterprise custom pricing, Advanced Work Management custom pricing, premium application eligibility, and buyer-specific quote evidence.',
  },
  {
    id: 'Proof',
    label: 'Scripted PPM, workflow, and governance proof',
    order: 3,
    description:
      'Require buyer-authored proofs for portfolio rollups, blueprint-driven project creation, change management, resource planning, secure external views, integrations, AI, access controls, and audit evidence.',
  },
  {
    id: 'BAFO',
    label: 'Entitlement normalization and BAFO',
    order: 4,
    description:
      'Normalize members, viewers, guests, premium apps, Advanced Work Management scope, support, professional services, data controls, renewal protections, downgrade rights, and exit assistance.',
  },
  {
    id: 'Contracting',
    label: 'Trust, data, renewal, and exit lock',
    order: 5,
    description:
      'Close data residency, DPA, subprocessor, security-evidence, AI governance, SCIM, SAML, event reporting, data retention, egress, CMEK where applicable, renewal, export, deletion, and transition commitments.',
  },
];

export const SMARTSHEET_VENDOR_PROFILE_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-SMARTSHEET-001',
    slug: 'smartsheet-enterprise-work-management-ppm-sourcing-profile',
    title: 'Smartsheet Enterprise Work Management and PPM Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Smartsheet sourcing should evaluate enterprise work management, project portfolio management, premium applications, governance controls, and data obligations rather than a simple spreadsheet-like collaboration subscription.',
    applicability:
      'Apply when sourcing, renewing, expanding, or rationalizing Smartsheet for enterprise work management, PMO or PPM operations, Control Center portfolios, Resource Management, Dynamic View, Data Shuttle, integrations, AI-assisted work, or governed external collaboration.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'Smartsheet Pricing and Plans - https://www.smartsheet.com/pricing',
      'Smartsheet Control Center - https://www.smartsheet.com/marketplace/premium-apps/control-center',
      'Smartsheet Trust Center - https://www.smartsheet.com/trust',
      'Smartsheet Data Residency - https://www.smartsheet.com/trust/data-residency',
      'Smartsheet Responsible AI - https://www.smartsheet.com/trust/responsible-ai',
      'Smartsheet Enterprise-grade security - https://www.smartsheet.com/enterprise-grade-security',
      'Smartsheet Enterprise Plan datasheet - https://www.smartsheet.com/datasheets/datasheet-enterpriseplan',
      'Smartsheet Security Capabilities, Practices, and Safeguards - https://www.smartsheet.com/sites/default/files/2026-03/smartsheet-security-capabilities-practices-safeguards.pdf',
    ],
    regulatoryChips: ['GDPR-if-personal-data', 'HIPAA-if-PHI', 'DORA-if-regulated-financial-entity', 'EU-AI-Act-review-if-AI-enabled'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-003', 'PAT-SRC-CAT-BI-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: SMARTSHEET_VENDOR_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Smartsheet enterprise work management and PPM platform',
        tier: 'enterprise',
        positioning:
          'Enterprise work management platform used for projects, programs, processes, portfolio reporting, governed collaboration, resource planning, and integrations through core plans and premium applications.',
        strengths: [
          'Public plan materials distinguish Pro, Business, Enterprise, and Advanced Work Management, with Enterprise and Advanced Work Management shown as custom-priced offerings',
          'Advanced Work Management publicly includes Control Center, Dynamic View, Data Shuttle, Connectors, DataMesh, Calendar App, Pivot App, and Premium Support',
          'Public trust and security materials provide anchors for SSO, directory integrations, data residency, audit and event reporting, data egress, retention, CMEK, and AI governance review',
        ],
        cautions: [
          'Public plan pages do not establish enterprise net pricing, private discounts, renewal uplift, implementation credits, migration cost, or buyer-specific concession norms',
          'Premium application, Advanced Work Management, support, professional services, data control, and region availability should be verified against the exact tenant, plan, quote, and order form',
          'PPM value depends on disciplined blueprint design, portfolio data hygiene, resource-model ownership, and adoption governance, not only access to Control Center or dashboards',
        ],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Smartsheet Pricing and Plans', url: 'https://www.smartsheet.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Smartsheet Control Center', url: 'https://www.smartsheet.com/marketplace/premium-apps/control-center', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Smartsheet Trust Center', url: 'https://www.smartsheet.com/trust', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public Smartsheet plan and premium application orientation',
        model: 'subscription',
        metric:
          'Plan type, member minimum, Enterprise custom-pricing boundary, Advanced Work Management custom-pricing boundary, premium application eligibility, and public add-on starting points where Smartsheet publishes them',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Smartsheet Pricing and Plans', url: 'https://www.smartsheet.com/pricing', asOf: '2026-04-29' },
        ],
        confidence: 0.72,
        notes:
          'Use public pricing only for dated orientation: Business and Pro public list pages, Enterprise and Advanced Work Management contact-us pricing, and published starting points for some premium applications such as Dynamic View and Data Shuttle. Do not infer private enterprise net price, discount band, renewal uplift, implementation cost, support concession, or reseller economics without buyer-specific evidence.',
      },
      {
        label: 'Buyer-specific Smartsheet benchmark gap',
        model: 'unknown',
        sourceBasis: [
          {
            type: 'founder-data-gap',
            label:
              'Requires buyer-specific Smartsheet quotes, order forms, invoices, renewal notices, admin usage exports, Plan Insights, reseller records, professional-services SOWs, or approved benchmark submissions before numeric discount or renewal guidance is shown',
          },
        ],
        confidence: 0.2,
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Plan, premium application, and portfolio entitlement control',
        buyerPosition:
          'Attach an entitlement schedule showing members, viewers, guests, plan type, Advanced Work Management status, Control Center, Resource Management, Dynamic View, Data Shuttle, connectors, Bridge, DataMesh, support, professional services, AI, renewal basis, downgrade rights, and SKU substitution language.',
        walkawayTriggers: [
          'Quote bundles core plan, Advanced Work Management, premium applications, support, and services without a line-item entitlement and renewal schedule',
          'Order form does not preserve downgrade, true-down, renewal-cap, add-on price-protection, or termination assistance rights for material portfolio workflows',
        ],
      },
      {
        clauseArea: 'Security, identity, and audit-control evidence',
        buyerPosition:
          'Require evidence for SAML SSO, directory integration, SCIM where used, domain validation, Enterprise Plan Manager, safe sharing, event reporting, data retention, data egress, CMEK where applicable, API token governance, and admin fallback before those controls justify Enterprise or Advanced Work Management spend.',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Smartsheet Pricing and Plans', url: 'https://www.smartsheet.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Smartsheet Enterprise-grade security', url: 'https://www.smartsheet.com/enterprise-grade-security', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Smartsheet Security Capabilities, Practices, and Safeguards', url: 'https://www.smartsheet.com/sites/default/files/2026-03/smartsheet-security-capabilities-practices-safeguards.pdf', asOf: '2026-04-29' },
        ],
      },
      {
        clauseArea: 'Data residency, AI, export, and exit governance',
        buyerPosition:
          'Document selected data region, residency limits, DPA and subprocessor review, AI enablement controls, provider-processing posture, human review, export formats, attachment handling, audit-log retention, deletion proof, and transition support for portfolio-critical workspaces.',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Smartsheet Data Residency', url: 'https://www.smartsheet.com/trust/data-residency', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Smartsheet Responsible AI', url: 'https://www.smartsheet.com/trust/responsible-ai', asOf: '2026-04-29' },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Advanced Work Management decomposition',
        whenToUse:
          'Use when Control Center, Dynamic View, Data Shuttle, connectors, DataMesh, Bridge, Calendar App, Pivot App, support, and services are blended into one platform expansion or renewal.',
        buyerAsk:
          'Require separate commercial lines for each premium capability, adoption owner, usage metric, implementation dependency, renewal treatment, and removal or downgrade right.',
      },
      {
        lever: 'Portfolio proof before term or bundle expansion',
        whenToUse:
          'Use before exchanging a longer term, broader member base, or Advanced Work Management purchase for commercial concessions.',
        buyerAsk:
          'Make Control Center blueprint proof, portfolio dashboard proof, resource planning proof, integration proof, secure external-view proof, identity proof, AI governance approval, and export proof pre-close gates.',
      },
      {
        lever: 'Viewer, guest, member, and workflow-value normalization',
        whenToUse:
          'Use when Smartsheet has grown through departmental adoption, PMO templates, external collaboration, or shadow portfolio reporting.',
        buyerAsk:
          'Tie premium spend to active members, viewers, guests, automated workflows, portfolio rollups, retired tools, avoided manual reporting, and documented executive decision use.',
      },
    ],
    riskFactors: [
      {
        id: 'smartsheet-ppm-add-on-cost-opacity',
        label: 'PPM and premium-application cost opacity',
        severity: 'high',
        detectionSignals: [
          'Business case treats Advanced Work Management as a single platform line without usage evidence for Control Center, Dynamic View, Data Shuttle, connectors, DataMesh, Bridge, or Resource Management',
          'Public plan pages are reused as if they prove enterprise net price, renewal uplift, support concessions, or professional-services economics',
        ],
        mitigations: [
          'Separate public plan orientation from quote, invoice, order-form, renewal, usage-export, and Plan Insights evidence',
          'Run a capability-by-capability value and adoption model before BAFO',
        ],
      },
      {
        id: 'smartsheet-portfolio-governance-drift',
        label: 'Portfolio governance drift after rapid template growth',
        severity: 'high',
        detectionSignals: [
          'Control Center blueprints, intake forms, dashboards, and resource fields differ by business unit without a shared portfolio data dictionary',
          'Executives depend on portfolio dashboards but source sheets, status definitions, resource assumptions, or archive rules are not governed',
        ],
        mitigations: [
          'Make blueprint design, change management, archive policy, portfolio data dictionary, and owner signoff part of sourcing acceptance',
          'Require proof that portfolio reporting, resource management, and secure views can survive scale and reorganization',
        ],
      },
      {
        id: 'smartsheet-ai-identity-and-data-control-gap',
        label: 'AI, identity, and data-control gap',
        severity: 'medium',
        detectionSignals: [
          'AI features are enabled before admin controls, auditability, data-use posture, human review, and sensitive-data policy are approved',
          'Enterprise value case cites SAML, directory integrations, event reporting, retention, egress, or CMEK but those controls are not tested against the tenant and add-on configuration',
        ],
        mitigations: [
          'Require AI, identity, event, data residency, export, and retention exhibits before contract close',
          'Route regulated or sensitive workflows through legal, security, privacy, compliance, and architecture review',
        ],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Raise outsourcing, data residency, event reporting, audit, AI governance, operational resilience, access review, subprocessor, and exit scrutiny when Smartsheet supports regulated portfolio, risk, or operational workflows.',
        regulatoryRefs: ['DORA-if-EU-regulated-financial-entity', 'GLBA-if-US-financial-data'],
      },
      {
        industry: 'healthcare',
        modifier:
          'Confirm PHI boundaries, HIPAA posture, BAA availability, AI enablement, external sharing, attachments, integrations, access reviews, deletion, and export requirements before storing or routing PHI-related work.',
        regulatoryRefs: ['HIPAA', 'HITECH'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Validate Smartsheet Gov, FedRAMP, regional hosting, accessibility, records retention, data egress, audit, support, and procurement-channel requirements by exact tenant and product configuration.',
        regulatoryRefs: ['FedRAMP-if-government-workload'],
      },
    ],
    body: `## Summary
Smartsheet should be sourced as an enterprise work management and PPM platform, not as a lightweight spreadsheet replacement. Public Smartsheet materials position the product around projects, programs, processes, dashboards, forms, automation, portfolio visibility, and integrations. The sourcing event therefore needs to normalize core plan scope, Advanced Work Management, premium applications, identity controls, data controls, AI, and PMO operating discipline before comparing commercial options. The strongest buying question is not whether a team can build a useful sheet. It is whether the buyer can govern an estate of sheets, reports, dashboards, blueprints, workflows, external views, resource plans, and integrations at enterprise scale.

## When to apply
Use this profile for a new Smartsheet selection, an Enterprise renewal, an Advanced Work Management expansion, a PMO modernization, a Control Center portfolio rollout, a Resource Management decision, a secure external-collaboration workflow, or a rationalization event against Microsoft, Atlassian, Asana, monday.com, ServiceNow, Salesforce, Planview, or internal reporting tools. It is especially relevant when Smartsheet has grown through business-led adoption and now carries program status, budget, risk, resource, compliance, customer, or supplier workflows that executives rely on.

## Commercial normalization
Public pricing pages are useful for orientation, but not for private enterprise benchmarking. Smartsheet publicly shows Pro and Business self-serve plan orientation, while Enterprise and Advanced Work Management are custom-priced contact-us offerings. The same page shows that Advanced Work Management includes Enterprise plus Control Center, Dynamic View, Data Shuttle, Connectors, DataMesh, Calendar App, Pivot App, and Premium Support. It also identifies several premium features as add-ons or included depending on plan, including Resource Management, Control Center, Dynamic View, Data Shuttle, Bridge, DataTable, event reporting, data retention, data egress, and customer-managed encryption keys. Use those facts to build the entitlement model. Do not infer negotiated discounts, renewal caps, implementation credits, professional-services pricing, reseller margins, or buyer-specific concession norms without quotes, order forms, invoices, renewal notices, Plan Insights, usage exports, or approved benchmark submissions.

## Sourcing gates
The scope gate should inventory members, viewers, guests, workspaces, sheets, reports, dashboards, forms, automations, attachments, WorkApps, external collaborators, integrations, resource plans, and premium applications. The PPM proof gate should test buyer-authored workflows: project creation from a blueprint, portfolio rollup, change deployment, resource demand forecast, executive dashboard, secure external update process, Data Shuttle import or export, and archive behavior. The security gate should validate SAML SSO, directory integrations, SCIM where used, domain validation, safe sharing, event reporting, data retention, data egress, CMEK where applicable, API token governance, and admin fallback. The BAFO gate should require a line-item schedule for plans, Advanced Work Management, premium apps, support, services, renewal uplift, true-down rights, downgrade rights, data extraction, and transition support.

## Trust, privacy, and AI
Smartsheet trust materials say the company publishes information on security, compliance, privacy, reliability, and data residency. Data residency pages state that customers can select where hosted data is committed for regional governance needs, but the buyer still needs to confirm the exact region, product coverage, and contractual terms for its tenant. Responsible AI materials state that customer data is not used to train third-party foundation models, AI actions are intended to be auditable and reviewable, admins should have controls over AI feature enablement, and human review remains part of the model. Treat those as sourcing evidence anchors, not as complete risk acceptance. Sensitive workflow use still needs privacy, security, legal, compliance, architecture, and business-owner review.

## Pitfalls
The profile fails when procurement renews a familiar collaboration tool without decomposing the estate. It also fails when a PMO buys Control Center but does not govern blueprint design, portfolio field definitions, archive policy, resource assumptions, or executive dashboard semantics. Another weak signal is a quote that blends Enterprise, Advanced Work Management, premium apps, support, services, and AI without a capability-by-capability value case. A final risk is treating public trust pages as if they prove tenant-specific configuration. Keep public claims traceable, keep unknown economics blank, and require every enterprise recommendation to map to adoption evidence, portfolio operating value, security controls, data governance, and exit readiness.`,
  },
];
