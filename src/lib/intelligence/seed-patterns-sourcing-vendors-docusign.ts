import type { PatternSeed } from './seed-types';

export const DOCUSIGN_VENDOR_PROFILE_PATTERN: PatternSeed = {
  id: 'PAT-SRC-VEN-DOCUSIGN-001',
  slug: 'docusign-iam-clm-esignature-sourcing-profile',
  title: 'DocuSign IAM, CLM, and eSignature Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'DocuSign sourcing should treat eSignature, IAM, CLM, identity verification, API usage, and agreement repository scope as separate decision lanes before accepting a bundled agreement platform story.',
  applicability:
    'Apply when sourcing, renewing, expanding, or replacing DocuSign eSignature, Docusign IAM, Docusign CLM, Identify, API-based signing, or line-of-business agreement workflow deployments.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.82,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-29',
  instanceCount: 0,
  sourceDocuments: [
    'https://www.docusign.com/intelligent-agreement-management',
    'https://ecom.docusign.com/plans-and-pricing/esignature',
    'https://www.docusign.com/iam/plan-allowances',
    'https://www.docusign.com/products/clm',
    'https://www.docusign.com/resources/solution-briefs/docusign-identify-platform-id-verification-datasheet',
    'https://www.docusign.com/trust',
    'https://www.docusign.com/trust/compliance/certifications',
    'https://investor.docusign.com/news-and-events/press-releases/news-details/2026/Docusign-Announces-Fourth-Quarter-and-Fiscal-Year-2026-Financial-Results-Announces-2-0-Billion-Increase-to-Share-Repurchase-Program/default.aspx',
    'https://investor.docusign.com/files/doc_financials/2025/ar/DOCU_Annual-Report-FY25.pdf',
  ],
  regulatoryChips: ['ESIGN', 'UETA', 'eIDAS-if-EU-signature-level-required', '21-CFR-Part-11-if-life-sciences', 'GDPR-if-EU-personal-data'],
  relatedPatternIds: ['PAT-SRC-PROC-007', 'PAT-SRC-CAT-CRM-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'enterprise_saas',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Docusign',
      tier: 'enterprise',
      positioning:
        'Enterprise agreement platform vendor spanning eSignature, Intelligent Agreement Management, CLM, signer identity verification, repository, workflow, and API-based sending use cases.',
      strengths: [
        'Large eSignature installed base and brand recognition',
        'IAM strategy connects pre-signature, signature, and post-signature agreement workflows',
        'Publicly documented envelope, IAM allowance, identity verification, trust, and compliance materials',
        'CLM integrations called out for Salesforce, Coupa, and SAP Ariba workflows',
      ],
      cautions: [
        'Do not blend standalone eSignature renewal, IAM migration, CLM expansion, Identify, and API volume into one undifferentiated benchmark',
        'Treat vendor-published ROI, leader, customer, and market-positioning claims as vendor evidence until independently validated in the buyer context',
        'Model envelope, automation send, third-party integration, Navigator, identity verification, support, and services assumptions before BAFO',
      ],
      sourceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign IAM overview',
          url: 'https://www.docusign.com/intelligent-agreement-management',
          asOf: '2026-04-29',
        },
        {
          type: 'public-disclosure',
          label: 'Docusign FY2026 results release',
          url: 'https://investor.docusign.com/news-and-events/press-releases/news-details/2026/Docusign-Announces-Fourth-Quarter-and-Fiscal-Year-2026-Financial-Results-Announces-2-0-Billion-Increase-to-Share-Repurchase-Program/default.aspx',
          asOf: '2026-04-29',
        },
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public eSignature and IAM allowance anchors only',
      model: 'hybrid',
      metric: 'User plans, envelope allowances, automation sends, third-party integration sends, Navigator allowances, and API production usage',
      sourceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign eSignature plans and pricing FAQ',
          url: 'https://ecom.docusign.com/plans-and-pricing/esignature',
          asOf: '2026-04-29',
        },
        {
          type: 'public-disclosure',
          label: 'Docusign IAM plan allowances',
          url: 'https://www.docusign.com/iam/plan-allowances',
          asOf: '2026-04-29',
        },
        {
          type: 'public-disclosure',
          label: 'Docusign developer API plans FAQ',
          url: 'https://ecom.docusign.com/isv/plans-and-pricing/developer',
          asOf: '2026-04-29',
        },
      ],
      confidence: 0.76,
      notes:
        'Use public pages to anchor packaging mechanics only. Do not infer enterprise net price, discount, renewal uplift, overage rate, Identify usage price, CLM services cost, or IAM migration economics without buyer invoices, order forms, quotes, or approved benchmarks.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Envelope, automation send, and API allowance control',
      buyerPosition:
        'Define all send units, pooled allowances, third-party integration sends, API production envelopes, overage mechanics, usage reporting, and notice before allowance exhaustion.',
      fallbackPosition:
        'If the vendor will not cap or pre-price overages, require monthly usage reporting, true-up notice, and a right to adjust purchased capacity before punitive billing applies.',
      walkawayTriggers: ['Undefined overage rate', 'No auditable usage export', 'Material API or integration send volumes excluded from the priced model'],
      sourceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign IAM plan allowances',
          url: 'https://www.docusign.com/iam/plan-allowances',
          asOf: '2026-04-29',
        },
      ],
    },
    {
      clauseArea: 'Agreement data, AI processing, repository, export, and deletion',
      buyerPosition:
        'Separate signature records, CLM contracts, IAM repository content, Navigator extractions, metadata, AI-assisted review outputs, retention, export format, deletion, subprocessors, and customer-data-use boundaries.',
      fallbackPosition:
        'At minimum, require a data schedule covering repository scope, extraction fields, AI feature enablement, opt-out or restriction options where available, and transition assistance.',
      walkawayTriggers: ['No usable export path for agreements and metadata', 'No clear treatment of AI processing boundaries for sensitive agreement data'],
    },
    {
      clauseArea: 'Signer identity and regulated signature posture',
      buyerPosition:
        'Map each high-risk transaction to required authentication, identity verification, certificate, audit, and regional signature level before selecting Identify or digital-signature add-ons.',
      sourceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign Identify datasheet',
          url: 'https://www.docusign.com/resources/solution-briefs/docusign-identify-platform-id-verification-datasheet',
          asOf: '2026-04-29',
        },
        {
          type: 'public-disclosure',
          label: 'Docusign compliance certifications',
          url: 'https://www.docusign.com/trust/compliance/certifications',
          asOf: '2026-04-29',
        },
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Separate renewal from IAM expansion',
      whenToUse:
        'Use when an incumbent eSignature renewal is presented together with IAM, CLM, Navigator, Maestro, Identify, API, or repository expansion.',
      buyerAsk:
        'Hold the eSignature baseline price, renewal cap, and envelope rights constant while evaluating IAM/CLM expansion as an incremental business case with pilots and adoption gates.',
      vendorGive:
        'Pilot credits, phased activation, protected renewal terms, implementation support, or conversion rights that do not erase the baseline renewal benchmark.',
      tradeoffs: ['Bundling may improve commercial leverage, but it can hide usage risk and make future downsizing harder.'],
    },
    {
      lever: 'Evidence-based CLM and repository expansion',
      whenToUse:
        'Use when the buying center wants to move from signing to agreement workflow, repository, AI-assisted review, or CLM automation.',
      buyerAsk:
        'Require a proof pack using buyer agreement templates, approval paths, third-party paper, CRM/procurement integration, metadata extraction, security review, and adoption owners.',
      evidenceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign CLM overview',
          url: 'https://www.docusign.com/products/clm',
          asOf: '2026-04-29',
        },
      ],
    },
  ],
  riskFactors: [
    {
      id: 'docusign-allowance-normalization-risk',
      label: 'Allowance and usage normalization risk',
      severity: 'high',
      detectionSignals: [
        'The business case references users but does not model envelopes, automation sends, API sends, third-party integration sends, Navigator agreements, or identity verification events.',
        'Buyer cannot reconcile admin usage reports to order-form quantities.',
      ],
      mitigations: ['Collect 12 to 24 months of envelope and API usage', 'Separate human web sends from embedded and automated sends', 'Normalize all finalists on the same transaction forecast'],
      contractualRemedies: ['Usage reporting covenant', 'Pre-priced overage table', 'Capacity reallocation right', 'Renewal cap tied to normalized units'],
    },
    {
      id: 'docusign-iam-bundle-fit-risk',
      label: 'IAM bundle fit risk',
      severity: 'medium',
      detectionSignals: [
        'Stakeholders approve IAM based on agreement-platform positioning without validating CLM workflows, repository ingestion, AI review boundaries, integration effort, or operating ownership.',
      ],
      mitigations: ['Pilot with buyer templates and real approval paths', 'Define line-of-business owners', 'Require integration and migration estimates before BAFO'],
      contractualRemedies: ['Phased activation', 'Acceptance criteria', 'Termination or conversion right for unused expansion modules'],
    },
    {
      id: 'docusign-regulated-signature-risk',
      label: 'Regulated signer identity and evidentiary risk',
      severity: 'high',
      detectionSignals: [
        'Use cases include high-value, regulated, cross-border, life-sciences, financial-services, healthcare, or government transactions without a documented identity assurance and audit posture.',
      ],
      mitigations: ['Map ESIGN/UETA/eIDAS/Part 11 requirements by use case', 'Choose authentication and identity verification level per transaction class', 'Validate certificate and audit evidence with legal'],
      contractualRemedies: ['Identity verification exhibit', 'Certificate of Completion retention', 'Audit evidence access', 'Regional signature-level support commitments'],
      sourceBasis: [
        {
          type: 'public-disclosure',
          label: 'Docusign Identify datasheet',
          url: 'https://www.docusign.com/resources/solution-briefs/docusign-identify-platform-id-verification-datasheet',
          asOf: '2026-04-29',
        },
      ],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Raise identity verification, KYC/AML adjacency, audit evidence, resilience, retention, outsourcing, and data-location review for customer agreements, account servicing, lending, and wealth workflows.',
      regulatoryRefs: ['KYC/AML where applicable', 'DORA where applicable to EU financial entities'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm whether PHI enters envelopes, CLM repositories, web forms, identity workflows, or downstream integrations; require HIPAA/BAA review if PHI is in scope.',
      regulatoryRefs: ['HIPAA-if-PHI', '21-CFR-Part-11-if-life-sciences-validation'],
      affectedStages: ['Scope', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate accessibility, identity assurance, regional data handling, procurement terms, public-record retention, and government cloud or certification needs before award.',
      regulatoryRefs: ['FedRAMP-if-US-federal', 'Government-of-Canada-Protected-B-if-Canada-public-sector'],
      affectedStages: ['RFP', 'Contracting'],
    },
  ],
  body: `## Summary
Docusign should be sourced as an agreement infrastructure decision, not as a simple signature utility. Public Docusign materials describe three overlapping lanes: standalone eSignature; Intelligent Agreement Management, or IAM, for agreement creation, commitment, management, repository, workflow, integrations, and AI-assisted agreement work; and CLM for contract generation, negotiation, workflow, storage, and analysis. Docusign's FY2025 annual report frames IAM, eSignature, and CLM as core offerings, and the March 2026 fiscal-year results release says IAM represented 10.8 percent of annual recurring revenue as of January 31, 2026. That supports a sourcing posture in which the buyer treats IAM as an active strategic shift, while still validating whether the buyer's use case is mostly signing, full contract lifecycle management, embedded API sending, regulated signer identity, or a broader agreement repository program.

## When to apply
Use this profile for a new Docusign selection, incumbent renewal, department expansion, eSignature-to-IAM migration, CLM selection, Salesforce/Coupa/SAP Ariba integration, high-volume API sending, Identify evaluation, or regulated signing use case. Do not use it as a generic legal-tech recommendation. It is specifically for a sourcing event where Docusign is a named finalist, incumbent, expansion candidate, or benchmark vendor. The profile should also be applied when a business stakeholder says "we just need signatures" but the proposal includes IAM, CLM, Navigator, Maestro, Identify, web forms, API production sends, or repository and AI capabilities.

## Buyer questions before market contact
The scope gate should separate six workloads. First, human web-app signing: who sends envelopes, how many users send, and how many envelopes are sent per month or year. Second, embedded or automated signing: which systems call APIs or integrations, which transactions count as automated sends, and how usage is pooled. Third, CLM: which templates, clauses, approvals, third-party paper, redlines, repositories, and renewals are in scope. Fourth, IAM repository and AI: which agreements are ingested, which metadata is extracted, whether AI-assisted review or summaries are enabled, and what data-use restrictions legal requires. Fifth, identity: which transaction classes require email authentication only, phone/SMS authentication, government ID verification, knowledge-based authentication, risk-based verification, Advanced Electronic Signatures, or Qualified Electronic Signatures. Sixth, compliance: which legal regimes, audit needs, retention obligations, data locations, subprocessors, business continuity commitments, and deletion obligations apply.

## Evidence to require
Docusign's public pages provide useful fact anchors, but they are not enough to award an enterprise deal. The buyer should collect current order forms, renewal notice, product schedule, envelope and API usage exports, admin reports, support tickets, integration inventory, identity verification events, CLM workflow maps, repository ingestion volumes, and security review outputs. For RFP proof, require Docusign to execute buyer-authored scripts: send a regulated agreement, verify signer identity, complete a multi-party contract approval, ingest third-party paper, produce the audit certificate, export agreement data and metadata, push status back to CRM or procurement, and report usage against allowance units. Docusign public materials say eSignature can be purchased standalone or as part of IAM; they also document envelope allowances, IAM web envelopes, automation sends, third-party integration sends, Navigator allowances, and developer/API plan distinctions. Those mechanics should drive the pricing workbook.

## Commercial normalization
Do not compare Docusign on a single per-user number. Normalize users, senders, recipients, envelopes, annual and monthly allowances, API production envelopes, automation sends, third-party integration sends, web application sends, Identify events, digital signature or certificate needs, CLM seats, repository ingested agreements, Navigator processed agreements, Maestro workflows, premium support, implementation services, sandbox and admin needs, and partner integration work. Public pages can identify packaging mechanics, but they do not prove enterprise net pricing, discount range, renewal uplift, professional-services cost, identity verification price, or overage rate for the buyer. Keep numeric benchmark fields blank unless the buyer has quote, invoice, reseller, or approved benchmark evidence.

## Contracting posture
The contract should lock the baseline renewal separately from optional IAM or CLM expansion. If the buyer expands, use phased activation and acceptance criteria rather than paying for every module on day one. Require explicit treatment of usage reports, overages, renewal caps, SKU substitutions, module retirement, data export, metadata export, deletion certification, transition assistance, service levels, support response, subprocessors, audit evidence, incident notice, AI feature enablement, customer-data-use restrictions, and professional-services deliverables. For regulated workflows, legal should confirm whether the proposed signing and identity flow satisfies the required evidentiary standard. Docusign Identify public materials describe multiple identity and authentication methods and support for AES and QES needs under eIDAS, but the buyer still must map the right assurance level to each transaction.

## Failure modes
The first failure mode is buying IAM as a bundle before proving whether the buyer has the operating owners, agreement templates, repository governance, and integration budget to use it. The second is renewing eSignature on a user count while envelope, API, automation, or integration sends are the real cost driver. The third is selecting CLM from a demo without testing third-party paper, redlines, approval exceptions, and downstream CRM or procurement synchronization. The fourth is assuming all signatures have the same legal posture. A low-risk HR acknowledgement, a consumer lending agreement, a patient consent, a public-sector form, and a life-sciences controlled record may need different authentication, identity, certificate, audit, and retention controls.

## Sourcing recommendation
Run the event as a three-lane decision. Lane one is baseline eSignature renewal with usage transparency and renewal protection. Lane two is IAM or CLM expansion with proof-based adoption gates. Lane three is regulated identity and evidentiary fit. Award only the lanes that clear evidence. If Docusign is the incumbent, preserve credible alternatives and an exit plan until Docusign has provided normalized pricing, a usage history reconciliation, implementation commitments, data and AI terms, and acceptance evidence for the buyer's highest-risk agreement workflows.`,
};
