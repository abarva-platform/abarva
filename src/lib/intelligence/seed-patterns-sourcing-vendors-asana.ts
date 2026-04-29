import type { PatternSeed, SourceBasisRef } from './seed-types';

const AS_OF = '2026-04-29';

const ASANA_ENTERPRISE: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana Enterprise overview',
  url: 'https://asana.com/enterprise',
  asOf: AS_OF,
  note:
    'Public Asana enterprise page describing enterprise work management, goals, AI-powered workflows, admin controls, SAML, SCIM, audit log, service accounts, compliance APIs, app management, SIEM integrations, and trust standards.',
};

const ASANA_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana pricing and plan comparison',
  url: 'https://asana.com/pricing',
  asOf: AS_OF,
  note:
    'Public pricing page showing Enterprise contact-sales pricing, Enterprise and Enterprise+ feature boundaries, AI Studio Basic credit disclosure, SAML, SCIM, compliance management, permissions management, data residency, audit logs, SIEM, DLP, archiving, and eDiscovery positioning.',
};

const ASANA_10K_2025: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana FY2025 Form 10-K',
  url: 'https://www.sec.gov/Archives/edgar/data/1477720/000147772025000045/asan-20250131.htm',
  asOf: AS_OF,
  note:
    'SEC filing describing Asana as an enterprise work management software platform, its tiered seat-based core product, AI Studio consumption model, hybrid go-to-market approach, customer metrics, renewal risk, and competitive market context.',
};

const ASANA_TRUST: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana Trust',
  url: 'https://asana.com/trust',
  asOf: AS_OF,
  note:
    'Public trust page describing privacy controls, data governance, export and deletion capabilities, global data residency options, Enterprise Key Management, SOC 2, SOC 3, GDPR, ISO, CSA STAR, HIPAA, GLBA, FERPA, and APPI references.',
};

const ASANA_DPA: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana Data Processing Addendum',
  url: 'https://asana.com/terms/data-processing',
  asOf: AS_OF,
  note:
    'Public DPA covering processor role, customer instructions, no sale or targeted-ad sharing of customer personal data, subprocessors, objection mechanics, security assistance, incident notification, data transfers, deletion, and audit support.',
};

const ASANA_SECURITY_STANDARDS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana Data Security Standards',
  url: 'https://asana.com/terms/security-standards',
  asOf: AS_OF,
  note:
    'Public security standards describing risk-based security program, ISO 27001-based framework, annual third-party assessments, SOC 2 Type 2 report, ISO certifications, penetration tests, bug bounty program, customer artifacts, and remote audit path.',
};

const ASANA_AI_FAQ: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana Intelligence and Asana AI FAQ',
  url: 'https://help.asana.com/s/article/asana-ai-faq?language=en_US',
  asOf: AS_OF,
  note:
    'Public Asana help article describing Asana AI data-use posture, AI partner agreements, query deletion expectations, and feature review process.',
};

const ASANA_AI_PARTNERS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Asana AI Partners',
  url: 'https://asana.com/terms/asana-ai-partners',
  asOf: AS_OF,
  note:
    'Public Asana terms page listing third-party AI providers and stating that customers may determine AI Partners to use through the Admin Console.',
};

const ASANA_VENDOR_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Asana estate and work-graph scope',
    order: 1,
    description:
      'Baseline teams, goals, portfolios, projects, tasks, guests, forms, automations, integrations, AI use cases, data regions, identity model, compliance needs, and overlapping work tools before market comparison.',
  },
  {
    id: 'CommercialBaseline',
    label: 'Plan, seat, add-on, and quote baseline',
    order: 2,
    description:
      'Separate public Enterprise and Enterprise+ plan boundaries from quote-only economics, seat expansion, AI Studio consumption, compliance add-ons, implementation, support, and renewal mechanics.',
  },
  {
    id: 'Proof',
    label: 'Scripted workflow and control proof',
    order: 3,
    description:
      'Require buyer-authored proofs for strategic planning, project intake, resource planning, portfolio reporting, SAML, SCIM, audit, SIEM, DLP, data residency, EKM, AI governance, and export controls.',
  },
  {
    id: 'BAFO',
    label: 'Enterprise normalization and BAFO',
    order: 4,
    description:
      'Normalize plan tier, seat counts, guests, departments, AI Studio credits or consumption, compliance management, permissions management, integrations, data controls, renewal caps, true-down rights, and exit assistance.',
  },
  {
    id: 'Contracting',
    label: 'Trust, AI, privacy, and renewal lock',
    order: 5,
    description:
      'Close DPA, subprocessor, AI partner, security artifact, audit, data residency, EKM, export, deletion, regulated-data, support, renewal, and transition commitments before enterprise rollout.',
  },
];

export const ASANA_VENDOR_PROFILE_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-ASANA-001',
    slug: 'asana-enterprise-work-management-sourcing-profile',
    title: 'Asana Enterprise Work Management Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Asana sourcing should evaluate enterprise work management, goals, portfolio governance, AI workflow automation, identity controls, data governance, and renewal flexibility rather than treating Asana as a simple project-management subscription.',
    applicability:
      'Apply when sourcing, renewing, expanding, consolidating, or rationalizing Asana for enterprise work management, strategic planning, portfolio reporting, resource planning, workflow automation, AI Studio, AI Teammates, regulated collaboration, or cross-functional operating cadence.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: AS_OF,
    instanceCount: 0,
    sourceDocuments: [
      'https://asana.com/enterprise',
      'https://asana.com/pricing',
      'https://www.sec.gov/Archives/edgar/data/1477720/000147772025000045/asan-20250131.htm',
      'https://asana.com/trust',
      'https://asana.com/terms/data-processing',
      'https://asana.com/terms/security-standards',
      'https://help.asana.com/s/article/asana-ai-faq?language=en_US',
      'https://asana.com/terms/asana-ai-partners',
    ],
    regulatoryChips: ['GDPR-if-personal-data', 'HIPAA-if-PHI-and-BAA-executed', 'GLBA-if-financial-data', 'FERPA-if-education-records', 'DORA-if-regulated-financial-entity', 'EU-AI-Act-review-if-AI-enabled'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-003', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-PRC-SAAS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: ASANA_VENDOR_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Asana Enterprise and Enterprise+',
        tier: 'enterprise',
        positioning:
          'Enterprise work management platform for coordinating goals, strategic initiatives, portfolios, projects, resources, workflows, AI-assisted work, and cross-functional operating rhythms across departments.',
        strengths: [
          'Public materials frame Asana around enterprise work management, goals, project intake, resource planning, workflow automation, reporting, and AI-powered workflows',
          'Public plan materials identify Enterprise contact-sales pricing and Enterprise+ security, compliance, governance, SIEM, data residency, audit log, and managed-workspace positioning',
          'Trust and legal materials provide public anchors for DPA, subprocessors, security artifacts, data governance, data residency, EKM, privacy controls, and compliance review',
        ],
        cautions: [
          'Public pages do not establish enterprise net price, private discount, renewal uplift, implementation credit, reseller concession, or buyer-specific AI consumption economics',
          'Enterprise value depends on adoption across real work graphs, not just enabling a collaboration tool; require active-user, workflow, portfolio, automation, and executive-reporting evidence',
          'AI Studio, AI Teammates, AI partners, data residency, EKM, SIEM, DLP, archiving, eDiscovery, HIPAA, and regulated workflows must be validated against the exact plan, add-on, tenant, and contract configuration',
        ],
        sourceBasis: [ASANA_ENTERPRISE, ASANA_PRICING, ASANA_TRUST, ASANA_DPA, ASANA_AI_PARTNERS],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public Asana Enterprise plan-boundary evidence only',
        model: 'hybrid',
        metric:
          'Plan tier, seat population, Enterprise contact-sales quote, Enterprise+ controls, AI Studio credit or consumption treatment, compliance or permissions add-ons, support, and renewal basis',
        sourceBasis: [ASANA_PRICING, ASANA_10K_2025],
        confidence: 0.69,
        notes:
          'Use official public pages to orient plan and packaging boundaries only. Do not infer buyer-specific net price, discount band, renewal uplift, AI overage, implementation credit, reseller margin, or multi-year concession without quotes, order forms, invoices, renewal notices, or approved benchmark evidence.',
      },
      {
        label: 'Buyer-specific Asana commercial benchmark gap',
        model: 'unknown',
        sourceBasis: [
          {
            type: 'founder-data-gap',
            label:
              'Requires buyer-specific Asana proposals, order forms, invoices, renewal notices, reseller records, AI Studio usage exports, or approved benchmark submissions before numeric discount or renewal guidance is shown',
          },
        ],
        confidence: 0.2,
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Plan, entitlement, AI, and renewal control',
        buyerPosition:
          'Attach an entitlement schedule showing plan, seat count, departments or divisions, guests, workspaces, AI Studio package or consumption basis, AI Teammates treatment, compliance management, permissions management, data residency, EKM, support, renewal cap, true-down, downgrade, and SKU substitution rights.',
        fallbackPosition:
          'If the vendor or reseller will not decompose the quote, require an order-form exhibit naming every included plan, add-on, control, billing unit, and renewal baseline.',
        walkawayTriggers: [
          'Enterprise quote bundles plan tier, AI, controls, compliance add-ons, and support without line-item entitlements',
          'Renewal language prevents true-down, downgrade, SKU substitution, or renewal-cap verification',
        ],
        sourceBasis: [ASANA_PRICING, ASANA_10K_2025],
      },
      {
        clauseArea: 'Privacy, subprocessors, data transfers, and deletion',
        buyerPosition:
          'Document DPA execution, controller and processor roles, customer instructions, subprocessor notice and objection path, transfer mechanisms, deletion assistance, export mechanics, data subject request support, and incident notification expectations.',
        fallbackPosition:
          'For sensitive or regulated workflows, restrict launch until privacy, legal, security, and records owners approve the tenant configuration and contractual exhibits.',
        sourceBasis: [ASANA_DPA, ASANA_TRUST],
      },
      {
        clauseArea: 'Security artifacts, audit, and regulated-data controls',
        buyerPosition:
          'Require SOC 2 Type 2, ISO certification evidence, penetration-test summary availability, business-continuity summary, remote audit path where artifacts are insufficient, SAML, SCIM, audit log, SIEM, DLP, archiving, eDiscovery, data residency, and EKM acceptance criteria.',
        fallbackPosition:
          'If exact artifacts or controls are unavailable at the selected tier, preserve phased rollout, restricted data classes, and exit rights for unresolved control gaps.',
        sourceBasis: [ASANA_SECURITY_STANDARDS, ASANA_ENTERPRISE, ASANA_PRICING, ASANA_TRUST],
      },
      {
        clauseArea: 'AI partner and AI workflow governance',
        buyerPosition:
          'Define permitted AI use cases, AI partner selection, admin-console enablement, data-use restrictions, human review, usage reporting, model-change notice where available, and prohibited sensitive-data patterns before AI Studio or AI Teammates are enabled at scale.',
        fallbackPosition:
          'If AI terms or controls are not approved, contract for core work management while gating AI features behind a separate security, privacy, and legal approval path.',
        sourceBasis: [ASANA_AI_FAQ, ASANA_AI_PARTNERS, ASANA_PRICING],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Work-graph value proof before enterprise expansion',
        whenToUse:
          'Use when the business case claims cross-functional coordination value, executive visibility, or tool consolidation but active workflows and measurable adoption are not yet proven.',
        buyerAsk:
          'Tie expansion to named goals, portfolios, projects, intake workflows, automations, dashboards, resource-planning scenarios, active-user evidence, and replacement or consolidation outcomes.',
        tradeoffs: ['This can slow a broad rollout, but it prevents buying enterprise scale before operating-model fit is visible.'],
        evidenceBasis: [ASANA_ENTERPRISE, ASANA_10K_2025],
      },
      {
        lever: 'Enterprise+ control exchange',
        whenToUse:
          'Use when the vendor positions Enterprise+ or control add-ons as required for regulated collaboration, security review, or centralized administration.',
        buyerAsk:
          'Exchange term length or broader seat commitment only for tested SAML, SCIM, audit log, SIEM, data residency, EKM, DLP, eDiscovery, archiving, export, deletion, and managed-workspace controls.',
        tradeoffs: ['More control evidence creates procurement friction, but it makes the premium defensible and auditable.'],
        evidenceBasis: [ASANA_PRICING, ASANA_TRUST, ASANA_SECURITY_STANDARDS],
      },
      {
        lever: 'AI consumption and governance normalization',
        whenToUse:
          'Use when AI Studio, AI Teammates, smart workflows, or AI partner choices are included in the roadmap or commercial proposal.',
        buyerAsk:
          'Separate included AI access, paid AI packages, consumption credits, overage treatment, builder lists, partner selection, usage exports, data-use restrictions, and regulated-workflow exclusions before BAFO.',
        tradeoffs: ['Separating AI can reduce bundle simplicity, but it avoids ungoverned consumption and data-use ambiguity.'],
        evidenceBasis: [ASANA_PRICING, ASANA_AI_FAQ, ASANA_AI_PARTNERS],
      },
    ],
    riskFactors: [
      {
        id: 'asana-enterprise-bundle-opacity',
        label: 'Enterprise bundle and add-on opacity',
        severity: 'high',
        detectionSignals: [
          'Quote combines seats, departments, AI, compliance management, permissions management, data residency, EKM, support, and implementation without a normalized entitlement schedule',
          'Public contact-sales or plan pages are treated as buyer-specific pricing evidence',
        ],
        mitigations: [
          'Create a plan, seat, add-on, AI, control, and renewal exhibit before BAFO',
          'Model active users, guests, external collaborators, workflows, automation volume, and suite overlap against actual buyer data',
        ],
        contractualRemedies: ['Entitlement schedule', 'Renewal baseline exhibit', 'True-down and downgrade rights', 'Add-on price-protection language'],
        sourceBasis: [ASANA_PRICING, ASANA_10K_2025],
      },
      {
        id: 'asana-ai-governance-and-consumption-risk',
        label: 'AI governance and consumption risk',
        severity: 'high',
        detectionSignals: [
          'AI Studio or AI Teammates are enabled before AI partner selection, data-use restrictions, usage reporting, and human-review controls are approved',
          'Business case assumes included AI capacity is sufficient without credit, consumption, builder, or overage evidence',
        ],
        mitigations: [
          'Separate AI enablement from core work management approval when needed',
          'Require admin-console AI partner settings, usage exports, data-use review, and sensitive-data rules before production rollout',
        ],
        contractualRemedies: ['AI use exhibit', 'Data-use restriction', 'Usage reporting obligation', 'Feature gating and opt-out language'],
        sourceBasis: [ASANA_AI_FAQ, ASANA_AI_PARTNERS, ASANA_PRICING],
      },
      {
        id: 'asana-workflow-adoption-gap',
        label: 'Workflow adoption gap',
        severity: 'medium',
        detectionSignals: [
          'Enterprise renewal case cites strategic planning or portfolio visibility, but usage is concentrated in isolated team projects',
          'Asana overlaps with Microsoft, Jira, Smartsheet, Monday.com, ServiceNow, Salesforce, or internal workflow tools without a consolidation decision',
        ],
        mitigations: [
          'Require workflow inventory and active-user evidence before expansion',
          'Score replacement, coexistence, and integration outcomes rather than generic feature fit',
        ],
        sourceBasis: [ASANA_ENTERPRISE, ASANA_10K_2025],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier:
          'Confirm PHI boundaries, Business Associate Addendum status, AI feature restrictions, support-channel PHI rules, data residency, audit evidence, guest access, and integration safeguards before allowing health data in Asana.',
        regulatoryRefs: ['HIPAA', 'HITECH'],
      },
      {
        industry: 'financial_services',
        modifier:
          'Raise outsourcing, operational resilience, GLBA, DORA, records retention, data residency, subprocessor, AI governance, audit, exit, and eDiscovery scrutiny when Asana supports regulated workflows.',
        regulatoryRefs: ['GLBA', 'DORA-if-EU-regulated-financial-entity'],
      },
      {
        industry: 'higher_education',
        modifier:
          'Validate FERPA boundaries, student-record exclusions, data governance, identity, guest access, retention, deletion, and AI restrictions before Asana is used for education records or student-support workflows.',
        regulatoryRefs: ['FERPA'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Validate procurement channel, Asana Gov applicability, data residency, accessibility, records retention, audit, subprocessor, law-enforcement request, and AI partner requirements against the exact public-sector use case.',
      },
    ],
    body: `## Summary
Asana should be sourced as an enterprise work management and operating cadence platform, not as a generic project-management subscription. Public Asana materials position the platform around goals, strategic initiatives, workflows, portfolios, resource planning, reporting, AI-powered workflows, and enterprise administration. The FY2025 Form 10-K describes the core work management product as tiered and seat-based, and describes AI Studio as a separate AI capability operating on a consumption basis. That combination creates a sourcing event with at least four workstreams: enterprise adoption value, plan and seat economics, AI governance and consumption, and privacy/security control proof.

## When to apply
Use this profile for a new Asana enterprise selection, an Enterprise or Enterprise+ renewal, a departmental expansion, a consolidation away from fragmented project and workflow tools, or a suite-overlap decision against Microsoft, Atlassian, Smartsheet, Monday.com, ServiceNow, Salesforce, or internal workflow systems. It is strongest when the buyer wants company goals, portfolio visibility, intake standardization, resource planning, executive reporting, governed guest collaboration, AI Studio workflows, AI Teammates, or regulated-work management. Do not use it as a price-only benchmark for a small team plan.

## Commercial normalization
Asana public pricing is useful for packaging orientation, but it is not enterprise net-price evidence. The public pricing page shows Enterprise as contact-sales pricing and describes Enterprise+ as adding advanced security, compliance, and governance controls such as SIEM integrations, data residency, audit logs, and managed workspaces. It also identifies AI Studio options and Enterprise plan AI credit language. Use those public facts to structure the quote model, not to infer private discount ranges, renewal uplifts, reseller concessions, implementation credits, AI overage treatment, or multi-year concessions. Those values require buyer-specific proposals, order forms, invoices, renewal notices, reseller records, AI Studio usage exports, or approved benchmark evidence.

## Sourcing gates
The scope gate should map every team, division, workspace, goal, portfolio, project, form, automation, integration, guest population, external collaborator group, admin role, data region, AI use case, and renewal date. The proof gate should use buyer-authored scenarios: strategic goal changes flowing into portfolios, project intake becoming approved work, resource planning exposing capacity risk, executive reporting updating from project status, and deprovisioning removing access through SCIM. The control gate should test SAML, SCIM, audit log, service accounts, compliance APIs, SIEM, DLP, archiving, eDiscovery, export, deletion, data residency, EKM, and managed-workspace requirements when those controls justify Enterprise+ or add-on spend. The BAFO gate should require line-item visibility for plan tier, seat population, guests, AI package, consumption basis, compliance management, permissions management, support, renewal cap, true-down, downgrade, SKU substitution, and exit assistance.

## Trust, privacy, and AI
Asana trust and legal materials provide public anchors for the security and privacy review. The trust page references privacy controls, data governance, organization-level export and deletion, global data residency options, Enterprise Key Management, SOC 2, SOC 3, GDPR, ISO standards, CSA STAR, HIPAA, GLBA, FERPA, and APPI. The DPA defines Asana's processor role for customer personal data, subprocessor notice and objection mechanics, data-transfer mechanisms, incident support, deletion support, and audit support. The data security standards describe a risk-based security program, annual third-party assessments, SOC 2 Type 2, ISO artifacts, penetration-test summaries, bug bounty, customer artifacts, and a remote audit path where artifacts are insufficient. AI should be separately governed. Public Asana AI materials describe third-party AI partners and customer admin choice of enabled partners; the AI FAQ should be reviewed for training, retention, deletion, safety-review, and data-use commitments before regulated workflows are enabled.

## Pitfalls
This profile fails when procurement treats Asana as familiar team software and renews a broad enterprise quote without entitlement decomposition. It also fails when buyers purchase Enterprise+ controls but never test them, assume AI consumption is commercially bounded without usage evidence, allow sensitive data before legal and security approval, or justify expansion from anecdotal productivity claims rather than measured workflow adoption. Keep public claims traceable, keep private economics blank until sourced, and make every enterprise recommendation map to adoption evidence, control evidence, AI governance, and renewal flexibility.`,
  },
];
