import type { PatternSeed } from './seed-types';

const DORA_SOURCE_BASIS = {
  doraLevelOne: {
    type: 'regulatory-document' as const,
    label: 'Regulation (EU) 2022/2554 on digital operational resilience for the financial sector',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554',
    asOf: '2026-04-29',
    note: 'Primary DORA text; use as legal source of record for ICT third-party risk, contractual arrangements, registers of information, and critical provider oversight.',
  },
  ebaRegisterPreparation: {
    type: 'regulatory-document' as const,
    label: 'EBA preparations for reporting of DORA registers of information',
    url: 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application',
    asOf: '2026-04-29',
    note: 'EBA states DORA became applicable on 17 January 2025 and describes register-of-information preparation and reporting resources.',
  },
  ebaFirstRules: {
    type: 'regulatory-document' as const,
    label: 'ESAs first set of rules under DORA for ICT and third-party risk management',
    url: 'https://www.eba.europa.eu/publications-and-media/press-releases/esas-publish-first-set-rules-under-dora-ict-and-third-party',
    asOf: '2026-04-29',
    note: 'ESA release describing RTS on ICT third-party provider policy and ITS templates for the register of information.',
  },
  esaSubcontracting: {
    type: 'regulatory-document' as const,
    label: 'ESAs final report on draft RTS for subcontracting under DORA',
    url: 'https://www.eiopa.europa.eu/esas-publish-joint-final-report-draft-technical-standards-subcontracting-under-dora-2024-07-26_en',
    asOf: '2026-04-29',
    note: 'ESA source on subcontracting conditions for ICT services supporting critical or important functions.',
  },
  esmaOversight: {
    type: 'regulatory-document' as const,
    label: 'ESMA DORA oversight framework for critical ICT third-party providers',
    url: 'https://www.esma.europa.eu/dora-oversight',
    asOf: '2026-04-29',
    note: 'ESMA describes the EU-wide oversight framework, Lead Overseers, Oversight Forum, and CTPP concepts.',
  },
  ebaCtppDesignation: {
    type: 'regulatory-document' as const,
    label: 'ESAs designation of critical ICT third-party providers under DORA',
    url: 'https://www.eba.europa.eu/publications-and-media/press-releases/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital',
    asOf: '2026-04-29',
    note: 'ESA source on the designation process and use of register-of-information data for CTPP assessment.',
  },
};

export const SOURCING_REGULATORY_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-REG-DORA-001',
    slug: 'dora-ict-third-party-risk-sourcing-overlay',
    title: 'DORA ICT Third-Party Risk Sourcing Overlay',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'financial-services',
    thesis:
      'DORA-sensitive ICT sourcing should convert third-party resilience duties into pre-award evidence, register-ready data, contractual controls, subcontracting visibility, and exit governance before commercial leverage disappears.',
    applicability:
      'Apply when an in-scope EU financial entity, financial-services group, regulated outsourcing function, or DORA-adjacent sourcing event evaluates ICT services that may support critical or important functions, material operational resilience, regulated data, or concentrated technology dependencies.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554',
      'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application',
      'https://www.eba.europa.eu/publications-and-media/press-releases/esas-publish-first-set-rules-under-dora-ict-and-third-party',
      'https://www.eiopa.europa.eu/esas-publish-joint-final-report-draft-technical-standards-subcontracting-under-dora-2024-07-26_en',
      'https://www.esma.europa.eu/dora-oversight',
      'https://www.eba.europa.eu/publications-and-media/press-releases/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital',
    ],
    regulatoryChips: [
      'DORA',
      'ICT-third-party-risk',
      'critical-or-important-functions',
      'register-of-information',
      'subcontracting-controls',
      'exit-strategy',
      'CTPP-oversight',
    ],
    relatedPatternIds: [
      'PAT-SRC-CAT-CSP-001',
      'PAT-SRC-CAT-SASE-001',
      'PAT-SRC-CAT-IAM-001',
      'PAT-SRC-CAT-ITSM-001',
      'PAT-SRC-CAT-CDW-001',
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'regulatory_compliance',
    standardClauses: [
      {
        clauseArea: 'DORA applicability and no-legal-advice positioning',
        buyerPosition:
          'State that the sourcing event is collecting operational, commercial, and contractual evidence to support the buyer\'s DORA governance process; final regulatory classification and compliance sign-off remain with buyer legal, risk, and compliance owners.',
        fallbackPosition:
          'If the vendor will not accept DORA-specific language, require an annex mapping equivalent resilience, audit, subcontracting, reporting, and exit commitments to the buyer\'s control framework.',
        walkawayTriggers: [
          'Vendor treats DORA review as a generic security questionnaire only',
          'Vendor refuses to identify whether services may support critical or important functions',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.ebaFirstRules],
      },
      {
        clauseArea: 'Register-of-information data pack',
        buyerPosition:
          'Require a contract data schedule that is complete enough for the buyer to maintain its DORA register of information, including legal entity identifiers where available, service descriptions, supported functions, subcontractor chain, locations, reliance level, data sensitivity, and contractual reference data.',
        fallbackPosition:
          'Accept staged completion only if missing data is listed, owned, dated, and contractually due before production use or critical-function reliance.',
        walkawayTriggers: [
          'Provider cannot supply stable contracting-entity, service, subcontractor, or data-location information',
          'Provider will only supply register inputs after signature with no acceptance remedy',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.ebaRegisterPreparation, DORA_SOURCE_BASIS.ebaCtppDesignation],
      },
      {
        clauseArea: 'Audit, inspection, assurance, and cooperation rights',
        buyerPosition:
          'Preserve risk-based access to evidence, audit artefacts, inspection cooperation, and regulator-facing support sufficient for the buyer and competent authorities to test the control environment without relying on vendor marketing claims.',
        fallbackPosition:
          'Where direct site access is constrained by multi-tenant security, require equivalent assurance packages, independent reports, regulator cooperation language, remediation SLAs, and escalation rights.',
        walkawayTriggers: [
          'Audit rights are limited to generic certifications with no issue remediation path',
          'Vendor terms prevent regulator cooperation or access to material resilience evidence',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.esmaOversight],
      },
      {
        clauseArea: 'Subcontracting and material-change controls',
        buyerPosition:
          'Require advance notice, risk assessment support, flow-down obligations, continuity evidence, and objection or exit rights for subcontractors that support critical or important functions or material parts of those ICT services.',
        fallbackPosition:
          'For commodity subcontractor rotations, accept risk-tiered notice if critical-function support, data location, continuity dependencies, and concentration effects are still transparent.',
        walkawayTriggers: [
          'Vendor cannot identify material ICT subcontractors or service supply-chain dependencies',
          'Vendor reserves unrestricted subcontractor changes for critical support paths',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.esaSubcontracting, DORA_SOURCE_BASIS.doraLevelOne],
      },
      {
        clauseArea: 'Exit, transition, and resilience remediation',
        buyerPosition:
          'Document exit triggers, orderly transition support, data return, deletion, portability, step-in coordination, continuity testing, and remediation obligations before production reliance begins.',
        fallbackPosition:
          'For standard SaaS or cloud terms, attach a buyer-specific exit runbook and acceptance checklist that controls evidence of export, identity cutover, integration rollback, and support during transition.',
        walkawayTriggers: [
          'Provider cannot support an exit plan for critical or important function dependency',
          'Service credits are the only remedy for repeated resilience or continuity control failure',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.ebaFirstRules],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Critical-function decision gate before BAFO',
        whenToUse:
          'Use when the business sponsor says the service is not outsourcing-critical, but architecture, security, operations, or compliance evidence suggests the service could support a critical or important function.',
        buyerAsk:
          'Make BAFO conditional on a buyer-owned DORA classification memo, register-data pack, exit outline, subcontracting map, and regulatory cooperation language.',
        vendorGive:
          'Vendor may offer a regulatory annex, control-mapping workbook, or standard financial-services addendum instead of bespoke redlines.',
        tradeoffs: [
          'This can slow sourcing, but it prevents selecting a finalist whose standard terms cannot satisfy downstream governance.',
          'Do not let commercial urgency substitute for buyer legal and compliance sign-off.',
        ],
        evidenceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.ebaFirstRules],
      },
      {
        lever: 'Register-ready data as a commercial deliverable',
        whenToUse:
          'Use during shortlist and BAFO when vendors compete on enterprise readiness, regulated-industry references, or critical infrastructure credibility.',
        buyerAsk:
          'Require complete register-of-information inputs, subcontractor identifiers, data-location fields, service taxonomy, and resilience evidence before contract award or before any production milestone payment.',
        vendorGive:
          'Provider may propose a fixed reporting cadence, standard export, or customer portal evidence pack.',
        tradeoffs: [
          'Portal-only evidence can be acceptable if the buyer can export, retain, and evidence it for governance and supervisory review.',
        ],
        evidenceBasis: [DORA_SOURCE_BASIS.ebaRegisterPreparation, DORA_SOURCE_BASIS.ebaCtppDesignation],
      },
      {
        lever: 'Concentration-risk and substitutability pressure',
        whenToUse:
          'Use when the shortlist includes a dominant cloud, infrastructure, data, core platform, or managed-service provider whose failure would affect multiple regulated functions.',
        buyerAsk:
          'Trade term length or volume commitment only for exit support, resilience transparency, subcontractor controls, portability assistance, and measurable recovery evidence.',
        vendorGive:
          'Provider may offer enhanced support, dedicated technical account coverage, resilience review sessions, or architecture-assurance workshops.',
        tradeoffs: [
          'A longer commitment can improve price, but it increases dependency risk unless exit and portability rights are operationally real.',
        ],
        evidenceBasis: [DORA_SOURCE_BASIS.esmaOversight, DORA_SOURCE_BASIS.ebaCtppDesignation],
      },
    ],
    riskFactors: [
      {
        id: 'dora-critical-function-misclassification',
        label: 'Critical or important function misclassification',
        severity: 'critical',
        detectionSignals: [
          'Business owner calls the service low risk while it supports payments, trading, claims, customer access, identity, core operations, incident response, or regulated reporting',
          'RFP does not ask whether the ICT service supports a critical or important function',
          'No legal, compliance, operational-resilience, or architecture owner has signed the classification',
        ],
        mitigations: [
          'Run a buyer-owned DORA classification gate before shortlist and refresh it before award',
          'Map the service to supported business functions, data sensitivity, substitutability, and recovery expectations',
          'Keep sourcing language framed as governance evidence, not legal advice',
        ],
        contractualRemedies: [
          'Condition award on classification evidence and a register-ready contract data pack',
          'Add change-control rights if the service later supports a critical or important function',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.ebaRegisterPreparation],
      },
      {
        id: 'dora-register-data-gap',
        label: 'Register-of-information data gap',
        severity: 'high',
        detectionSignals: [
          'Vendor cannot provide legal entity, service, subcontractor, data-location, or service-chain fields before award',
          'Supplier master data does not match contracting entities or service recipients',
          'The contract lacks a durable service description and reference structure',
        ],
        mitigations: [
          'Attach a register-data appendix to the RFP and require completion by shortlisted vendors',
          'Validate provider identifiers, contracting entities, functions supported, and subcontractor chains during due diligence',
          'Assign ownership for ongoing updates after signature',
        ],
        contractualRemedies: [
          'Withhold production authorization or milestone payment until mandatory fields are complete',
          'Require notification and update obligations for data-location, subcontractor, service, and contracting-entity changes',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.ebaRegisterPreparation, DORA_SOURCE_BASIS.ebaCtppDesignation],
      },
      {
        id: 'dora-subcontracting-blind-spot',
        label: 'Subcontracting blind spot for critical services',
        severity: 'high',
        detectionSignals: [
          'Vendor lists subprocessors but not the material ICT subcontractors supporting the service',
          'Critical service dependencies are described only as generic cloud, hosting, support, or offshore operations',
          'Subcontractor changes are unilateral and immediate',
        ],
        mitigations: [
          'Require material subcontractor mapping and flow-down controls before BAFO',
          'Classify subcontractors by service support, data access, resilience role, and concentration effect',
          'Set notice, assessment, objection, and exit mechanics proportionate to criticality',
        ],
        contractualRemedies: [
          'Add material-change approval or objection rights for critical support paths',
          'Require continuity evidence and remediation when subcontractor risk materially changes',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.esaSubcontracting, DORA_SOURCE_BASIS.doraLevelOne],
      },
      {
        id: 'dora-assurance-rights-too-thin',
        label: 'Assurance rights too thin for regulated reliance',
        severity: 'high',
        detectionSignals: [
          'Vendor offers only public certifications with no buyer-specific control evidence',
          'Audit language excludes critical systems, subcontractors, incident evidence, or regulator cooperation',
          'Security and resilience artefacts are gated behind post-signature portals without retention rights',
        ],
        mitigations: [
          'Separate marketing certifications from evidence the buyer can retain for governance',
          'Ask for regulator cooperation, issue remediation, independent assurance, testing participation where relevant, and escalation commitments',
          'Define acceptable alternative assurance if direct access is operationally impossible',
        ],
        contractualRemedies: [
          'Require assurance package delivery before go-live',
          'Tie unresolved material control gaps to remediation, service suspension, or exit assistance',
        ],
        sourceBasis: [DORA_SOURCE_BASIS.doraLevelOne, DORA_SOURCE_BASIS.esmaOversight],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Use the full overlay for banks, insurers, investment firms, market infrastructure, payments, e-money, crypto-asset service providers, and other potentially in-scope financial entities; classify applicability with counsel and the accountable compliance function.',
        additionalRequirements: [
          'Register-of-information completion before production reliance',
          'Critical or important function classification memo',
          'Operational resilience owner sign-off',
          'Exit and substitutability assessment',
        ],
        regulatoryRefs: ['Regulation (EU) 2022/2554', 'DORA Article 28', 'DORA Article 30'],
        affectedStages: ['Scope', 'MarketScan', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'cross_industry',
        modifier:
          'Use as a governance overlay only when the buyer is serving a regulated financial-services customer, operating as an ICT provider to financial entities, or voluntarily aligning sourcing controls to DORA-like resilience expectations.',
        additionalRequirements: [
          'Avoid representing voluntary alignment as legal compliance',
          'Separate regulated-customer obligations from general security commitments',
        ],
        regulatoryRefs: ['DORA customer-flowdown review'],
        affectedStages: ['RFP', 'BAFO', 'Contracting'],
      },
    ],
    body: `## Summary
This pattern is a sourcing overlay for DORA ICT third-party risk. It is not legal advice and should not decide whether a buyer, service, function, or provider is legally in scope. Its purpose is to help a sourcing team collect commercial, operational, and contractual evidence early enough that legal, compliance, operational resilience, security, architecture, and business owners can make informed DORA governance decisions before award.

DORA became applicable on 17 January 2025, and official EBA preparation material states that in-scope financial entities need a comprehensive register of contractual arrangements with ICT third-party service providers at entity, sub-consolidated, and consolidated levels. ESA materials also describe the register as useful for financial entities monitoring ICT third-party risk, competent authorities supervising DORA compliance, and the ESAs designating critical ICT third-party providers. For sourcing, that means the RFP cannot treat third-party resilience as a late security questionnaire. The event should be designed to produce register-ready data, critical-function classification evidence, subcontracting visibility, audit and cooperation terms, resilience artefacts, and exit options before finalist leverage is lost.

## When to apply
Apply this overlay when sourcing cloud infrastructure, core SaaS, managed services, data platforms, identity, cybersecurity, payments technology, application operations, hosting, outsourcing, or material support services for an EU financial entity or a group that supports one. Also apply it when a provider may indirectly support a critical or important function, when data sensitivity is high, when recovery dependency is material, or when concentration and substitutability concerns are visible. Use counsel and accountable compliance owners to determine the legal classification; the sourcing team should document facts and avoid inventing compliance conclusions.

## Sourcing controls
The scope gate should identify the service, business owner, regulated entities, supported functions, data sensitivity, locations, integration dependencies, recovery expectations, incumbent transition path, subcontractors, and whether the service could support a critical or important function. The market-scan gate should reject vendors that cannot explain contracting entities, service supply chains, data locations, resilience controls, assurance evidence, and change-notice practices. The RFP should ask for a DORA-oriented evidence pack: register-of-information inputs, service descriptions, SLAs, incident and continuity processes, audit and inspection cooperation, subcontracting conditions, business contingency evidence, data return and deletion, portability, and exit support. The BAFO should normalize not only price but also control gaps, evidence gaps, renewal and change risks, and the cost of switching if the provider later becomes unacceptable.

## Contracting posture
Contract language should preserve a durable service description, register data, SLAs, audit and inspection rights or equivalent assurance, regulator cooperation, subcontractor notice and assessment, continuity commitments, incident cooperation, testing participation where relevant, remediation obligations, and exit assistance. For multi-tenant cloud or SaaS providers, direct inspection may be operationally constrained, so the buyer can evaluate alternative assurance such as independent reports, pooled audits, customer-specific evidence, and regulator cooperation. The commercial point is not to demand impossible rights; it is to ensure that substitute evidence is specific, retainable, reviewable, and tied to remediation.

## Common failure modes
The first failure is misclassification: the business says the service is non-critical while architecture or operations show that it supports a regulated process, customer access, identity, reporting, payments, claims, trading, resilience monitoring, or incident response. The second is register friction: the vendor can sell the service but cannot provide stable provider identifiers, service taxonomy, legal entity data, subcontractor chains, data locations, or reliance information. The third is subcontracting opacity, especially where a branded provider relies on hosting, support, offshore operations, or specialist infrastructure that materially affects resilience. The fourth is paper assurance: certifications exist, but audit, remediation, regulator cooperation, and exit evidence are too thin for regulated reliance.

## Commercial guidance
Treat DORA as a governance and commercial discipline. Do not pay a premium merely because a vendor says it is DORA-ready. Ask what evidence the buyer can retain, what register fields can be populated before go-live, how subcontractor changes are controlled, what happens if a competent authority or internal risk owner challenges the arrangement, and how the buyer exits without operational disruption. Use term length, committed spend, and preferred-provider status as negotiation currency only after resilience, register, subcontracting, audit, and exit controls are acceptable to the buyer's accountable functions.`,
  },
];
