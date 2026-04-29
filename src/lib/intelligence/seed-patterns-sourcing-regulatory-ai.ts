import type { PatternSeed } from './seed-types';

const EU_AI_ACT_OFFICIAL_SOURCES = [
  'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689',
  'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
  'https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',
  'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
  'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
  'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-27',
  'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
];

export const SOURCING_REGULATORY_AI_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-REG-EUAI-001',
    slug: 'eu-ai-act-procurement-overlay-ai-enabled-vendor-sourcing',
    title: 'EU AI Act Procurement Overlay for AI-Enabled Vendor Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI-enabled vendor sourcing needs an EU AI Act overlay that classifies intended use, allocates provider and deployer evidence duties, and converts regulatory uncertainty into commercial gates before award.',
    applicability:
      'Apply when buying, renewing, or materially changing AI-enabled software, embedded SaaS AI, model access, decision-support tooling, biometric or workplace AI, public-sector AI, or vendor-managed AI workflows that may be placed on the EU market or used in the EU.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.68,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: EU_AI_ACT_OFFICIAL_SOURCES,
    regulatoryChips: [
      'EU-AI-Act',
      'high-risk-AI-review',
      'provider-deployer-role-mapping',
      'fundamental-rights-impact-assessment-if-applicable',
      'transparency-obligations-review',
      'GDPR-if-person-data',
    ],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-AI-002', 'PAT-AI-003'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'regulatory_compliance',
    vendorClass: 'direct-tech',
    standardClauses: [
      {
        clauseArea: 'EU AI Act role and intended-use classification',
        buyerPosition:
          'Require the vendor to document whether it acts as provider, importer, distributor, product manufacturer, or deployer support partner for each AI feature, and require a buyer-approved intended-use exhibit that maps use cases to the Act risk tiers.',
        fallbackPosition:
          'If the vendor will not provide a definitive classification, require documented assumptions, change-notice rights, and a buyer right to suspend or disable affected AI features until legal and risk review is complete.',
        walkawayTriggers: [
          'Vendor refuses to identify AI features and intended uses',
          'Vendor markets high-impact decision support while disclaiming all role accountability',
          'Vendor cannot explain whether a feature could fall within Annex III high-risk use cases',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'Regulation (EU) 2024/1689 official text',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689',
            asOf: '2026-04-29',
          },
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Annex III',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
            asOf: '2026-04-29',
          },
        ],
      },
      {
        clauseArea: 'High-risk evidence package and lifecycle cooperation',
        buyerPosition:
          'For features classified or reasonably suspected as high-risk, require instructions for use, technical and risk-management evidence appropriate to the buyer role, logging and human-oversight support, post-market monitoring cooperation, incident notification flow, and information needed for buyer-side assessments.',
        fallbackPosition:
          'Permit phased deployment only for non-high-risk use cases until required evidence is complete and reviewed by buyer legal, privacy, security, and business owners.',
        walkawayTriggers: [
          'No meaningful instructions for use or human oversight guidance',
          'No cooperation mechanism for serious incidents, corrective actions, or authority requests',
          'No contractual right to disable or segregate high-risk AI features',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'European Commission AI Act FAQ - high-risk providers and deployers',
            url: 'https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',
            asOf: '2026-04-29',
          },
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Article 26',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
            asOf: '2026-04-29',
          },
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Article 27',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-27',
            asOf: '2026-04-29',
          },
        ],
      },
      {
        clauseArea: 'Transparency, change control, and feature activation',
        buyerPosition:
          'Require advance notice for new or materially changed AI features, explicit controls for generative or interactive AI disclosures where applicable, a buyer approval gate before AI feature activation in regulated workflows, and a maintained AI-feature inventory tied to the order form.',
        fallbackPosition:
          'If the vendor cannot provide feature-level controls, limit deployment to sandbox, pilot, or internal-assistive use cases until transparency and change-control evidence is supplied.',
        walkawayTriggers: [
          'AI features can be activated globally without buyer approval',
          'Vendor cannot distinguish assistive outputs from automated decision support',
          'No disclosure support for interactive, generative, or synthetic-content scenarios where transparency duties may apply',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Article 50',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
            asOf: '2026-04-29',
          },
          {
            type: 'regulatory-document',
            label: 'European Commission regulatory framework for AI',
            url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
            asOf: '2026-04-29',
          },
        ],
      },
    ],
    riskFactors: [
      {
        id: 'euai-intended-use-misclassification',
        label: 'Intended-use misclassification',
        severity: 'high',
        detectionSignals: [
          'Vendor describes the same AI feature as productivity support in sales materials but decision support in demonstrations',
          'Buyer use case touches employment, education, essential services, credit, insurance, public services, law enforcement, migration, justice, democratic processes, biometrics, or critical infrastructure without Annex III review',
          'The order form lists generic AI modules without use-case restrictions',
        ],
        mitigations: [
          'Create an intended-use register before RFP release',
          'Map each AI-enabled workflow to prohibited, high-risk, transparency, GPAI, or minimal-risk review paths',
          'Require legal review before expanding the use case after award',
        ],
        contractualRemedies: [
          'Use-case exhibit',
          'Change notice and approval right',
          'Feature disablement right',
          'Termination right for unsupported high-risk classification',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'European Commission AI Act FAQ - high-risk classification',
            url: 'https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',
            asOf: '2026-04-29',
          },
        ],
      },
      {
        id: 'euai-deployer-evidence-gap',
        label: 'Buyer deployer evidence gap',
        severity: 'high',
        detectionSignals: [
          'Buyer cannot assign human oversight for a high-risk workflow',
          'Vendor instructions for use do not explain monitoring, input-data quality, or escalation paths',
          'Public-sector, public-service, creditworthiness, or life/health insurance uses lack an impact-assessment workstream',
        ],
        mitigations: [
          'Name deployer owners for monitoring and human oversight',
          'Require vendor evidence before pilot exit',
          'Coordinate fundamental-rights and data-protection impact assessment work where applicable',
        ],
        contractualRemedies: [
          'Evidence delivery milestone',
          'Acceptance holdback',
          'Pilot-to-production gate',
          'Cooperation covenant for authority inquiries',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Article 26',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
            asOf: '2026-04-29',
          },
          {
            type: 'regulatory-document',
            label: 'EU AI Act Service Desk - Article 27',
            url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-27',
            asOf: '2026-04-29',
          },
        ],
      },
      {
        id: 'euai-timeline-and-change-drift',
        label: 'Applicability timeline and product-change drift',
        severity: 'medium',
        detectionSignals: [
          'Vendor roadmap adds AI features after RFP scoring',
          'Contract assumes a static AI Act timeline without renewal review',
          'Buyer treats future standards, guidance, or product recertification as vendor-only matters',
        ],
        mitigations: [
          'Snapshot official EU sources at award',
          'Add semiannual AI regulatory review to QBRs',
          'Tie new AI features to risk reclassification and evidence refresh',
        ],
        contractualRemedies: [
          'Regulatory change-control clause',
          'Feature-level audit right',
          'Updated documentation delivery obligation',
          'Commercial reopener for material compliance scope change',
        ],
        sourceBasis: [
          {
            type: 'regulatory-document',
            label: 'European Commission regulatory framework for AI',
            url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
            asOf: '2026-04-29',
          },
        ],
      },
    ],
    body: `## Summary
This pattern is sourcing and commercial governance guidance, not legal advice. It translates the EU AI Act into a procurement overlay for AI-enabled vendor sourcing so the buying team can ask the right questions before award, preserve commercial leverage, and hand legal, privacy, security, and business owners a structured evidence pack. The current official EU framing is risk-based: some AI practices are prohibited, a limited set of systems can be high-risk because of intended purpose or regulated-product embedding, certain interactive or generative uses carry transparency obligations, and many lower-risk uses remain governed mainly by existing law and ordinary risk management.

## When to apply
Use the overlay whenever a vendor product includes machine learning, generative AI, agentic workflow automation, biometric capability, automated scoring, worker or candidate evaluation, public-service eligibility support, credit or insurance assessment, healthcare triage, customer-affecting decision support, or hidden AI activation inside a broader SaaS suite. The overlay is strongest before RFP release and before BAFO, because that is when the buyer can still require feature inventories, intended-use boundaries, evidence exhibits, and price-risk tradeoffs. It also applies at renewal if an incumbent has added AI features since the last contract, or if the buyer wants to expand a tool from internal assistive use into customer, worker, citizen, patient, or applicant-facing decision support.

## How it works
Start with intended use rather than vendor category. For every AI-enabled workflow, capture who will use it, who may be affected, what decision or recommendation it supports, whether humans can override it, what input data is required, where it will be deployed, and whether the vendor or buyer will materially modify the system. Then route the workflow through five procurement questions. First, is the use prohibited or too close to a prohibited use to proceed without specialist review? Second, could it fall within high-risk classification because it is a safety component of a regulated product or because the intended use resembles an Annex III area such as employment, education, essential services, credit, insurance, public services, law enforcement, migration, justice, democratic processes, biometrics, or critical infrastructure? Third, do transparency obligations apply because the system interacts with people, generates synthetic content, or assists decisions about natural persons? Fourth, do provider, deployer, importer, distributor, or product-manufacturer responsibilities need to be allocated in the contract? Fifth, does personal data, regulated sector outsourcing, or public-sector procurement add parallel review under GDPR, sector rules, or local law?

## Procurement controls
The buyer should not ask the vendor to promise generic "AI Act compliance" and stop there. The stronger commercial posture is an evidence-based schedule: AI feature inventory, intended-use exhibit, role map, high-risk classification rationale, instructions for use, human-oversight design, logging and monitoring support, input-data assumptions, transparency controls, incident escalation, authority-cooperation path, and change-control process for new or materially changed AI features. Public bodies and providers of public services should add an explicit checkpoint for fundamental-rights impact assessment where the official EU materials indicate it may be required; buyers handling personal data should coordinate that work with data-protection impact assessment rather than running disconnected reviews.

## Pitfalls
Common failures are treating the AI Act as a post-award legal memo, allowing vendors to classify features without reference to the buyer's intended use, ignoring embedded AI that can be activated during the term, confusing model-provider obligations with deployer obligations, and assuming that a non-EU vendor is irrelevant if the system is placed on the EU market or used in the EU. Another failure is inventing enforcement predictions. The sourcing team should instead cite official EU sources, snapshot the source date, preserve conservative assumptions, and escalate uncertainty to counsel without turning the procurement pattern into legal advice.

## Commercial outcome
The desired outcome is not a legal conclusion; it is a controlled buying record. A well-run event can show which AI features were in scope, what official sources were consulted, what classification assumptions were used, what evidence the vendor supplied, what buyer-side controls are required before production, and which contractual remedies protect the buyer if the vendor changes features, withholds evidence, or shifts risk back to the deployer after award.`,
  },
];
