import type { PatternSeed } from './seed-types';

export const SERVICENOW_VENDOR_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-SERVICENOW-001',
    slug: 'servicenow-enterprise-workflow-platform-sourcing-profile',
    title: 'ServiceNow Enterprise Workflow Platform Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'ServiceNow sourcing should be treated as an enterprise workflow-platform decision, not a narrow ITSM license renewal, because value, risk, and leverage depend on module scope, instance architecture, AI/data terms, implementation accountability, and renewal control.',
    applicability:
      'Apply when selecting, renewing, expanding, consolidating, or renegotiating ServiceNow for ITSM, ITOM, SPM, CSM, HRSD, IRM, SecOps, Software Asset Management, App Engine, Now Assist, AI agents, or enterprise workflow platform scope.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm',
      'https://www.servicenow.com/products/itsm/pricing.html',
      'https://www.servicenow.com/lpgp/pricing-csm.html',
      'https://www.servicenow.com/products/strategic-portfolio-management.html',
      'https://www.servicenow.com/platform/what-is-servicenow-ai-platform.html',
      'https://www.servicenow.com/docs/r/application-development/licensing.html?contentId=oW_p2urVT7bk0DuIZoB6XQ',
      'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-general-terms-and-conditions.pdf',
      'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-product-specific-terms.pdf',
      'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/data-processing-addendum.pdf',
      'https://www.servicenow.com/company/trust/compliance.html',
    ],
    regulatoryChips: ['GDPR', 'SOC-2-review', 'ISO-27001-review', 'AI-governance-review', 'public-sector-if-applicable'],
    relatedPatternIds: ['PAT-SRC-CAT-ITSM-001', 'PAT-SRC-CAT-PPM-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    vendorLandscape: [
      {
        vendorName: 'ServiceNow',
        tier: 'enterprise',
        positioning:
          'Enterprise workflow and AI platform vendor with public positioning across IT, HR, customer service, CRM, application development, SPM, and risk workflows; strongest when the buyer wants a shared workflow platform rather than isolated service-management tooling.',
        strengths: [
          'Large enterprise customer base and public 2025 subscription revenue scale',
          'Broad workflow portfolio spanning ITSM, ITOM, SPM, CSM, HRSD, IRM, SecOps, SAM, App Engine, and AI capabilities',
          'Public trust, compliance, DPA, product-specific AI, and subscription terms available for diligence',
        ],
        cautions: [
          'Public pages orient around packages and custom quotes rather than durable numeric enterprise price lists',
          'Implementation success depends on workflow design, CMDB/data quality, integrations, partner performance, and customer operating readiness',
          'AI and data products introduce additional hosting, evaluation, accuracy, and governance terms that must be reviewed before expansion',
        ],
        sourceBasis: [
          { type: 'regulatory-document', label: 'ServiceNow 2025 Form 10-K', url: 'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow ITSM packages and pricing page', url: 'https://www.servicenow.com/products/itsm/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow AI Platform overview', url: 'https://www.servicenow.com/platform/what-is-servicenow-ai-platform.html', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Enterprise application and workflow alternatives',
        tier: 'enterprise',
        positioning:
          'ServiceNow discloses that it competes with enterprise application software vendors, AI-native and point-solution providers, custom or in-house solutions, technology consulting firms, systems integrators, and resellers; buyers should preserve credible alternatives by workflow tower rather than assuming one universal comparator.',
        strengths: ['Can create competitive tension by tower, geography, system of record, or implementation model'],
        cautions: ['Alternative leverage is weak unless the buyer can prove migration, integration, and operating-model feasibility'],
        sourceBasis: [
          { type: 'regulatory-document', label: 'ServiceNow 2025 Form 10-K competition disclosure', url: 'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public ServiceNow commercial posture only',
        model: 'hybrid',
        metric: 'Subscription agreement, order-form scope, package tier, user/application entitlements, service credits where applicable, and custom quote',
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow ITSM pricing page offers package comparison and Get Custom Quote path', url: 'https://www.servicenow.com/products/itsm/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow CSM pricing page directs buyers to custom quote', url: 'https://www.servicenow.com/lpgp/pricing-csm.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow licensing documentation says contract-specific licensing should be discussed with account representative', url: 'https://www.servicenow.com/docs/r/application-development/licensing.html?contentId=oW_p2urVT7bk0DuIZoB6XQ', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'TODO/founder-data-gap: buyer-specific discount bands, renewal uplift benchmarks, net module pricing, implementation SOW cost, AI credit consumption, and true-up history require buyer quote, order form, invoice, or approved benchmark evidence' },
        ],
        confidence: 0.67,
        notes:
          'Do not embed invented ServiceNow price-per-user, discount percentage, or renewal concession claims. Use public pages to document package and quote posture only; enterprise economics remain buyer-evidence gated.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Order-form entitlement and use verification',
        buyerPosition:
          'Attach an entitlement schedule that names each product, package, instance, user or unit metric, custom table/application allowance, AI/data product, service-credit pool, and excluded use; require notice and cure mechanics before any compliance true-up becomes payable.',
        fallbackPosition:
          'If the vendor will not alter audit mechanics, require a pre-renewal entitlement reconciliation workbook and written treatment for disabled users, requesters, non-production users, integrations, bots, and affiliates.',
        vendorPosition:
          'ServiceNow public terms reserve use verification rights and require purchase of additional subscriptions if use exceeds permitted access and use rights.',
        walkawayTriggers: ['No order-form detail for purchased entitlements', 'No cure period for excess use', 'Ambiguous treatment of AI/data product consumption'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow General Terms and Conditions', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-general-terms-and-conditions.pdf', asOf: '2026-04-29' },
        ],
      },
      {
        clauseArea: 'Data export, deletion, AI processing, and residency',
        buyerPosition:
          'Preserve standard database export, deletion certification timing, DPA coverage, SCC/UK transfer mechanism review, subprocessor and data-center-region review, and specific controls for Advanced AI and Data Products before Now Assist or AI agents enter production workflows.',
        fallbackPosition:
          'If standard terms control, attach a deployment exhibit that maps every regulated data class, AI feature, region, support path, subprocessor class, and human-review obligation.',
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow DPA', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/data-processing-addendum.pdf', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow Product-Specific Terms', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-product-specific-terms.pdf', asOf: '2026-04-29' },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Module expansion for renewal protection',
        whenToUse:
          'Use when ServiceNow seeks expansion into ITOM, SPM, CSM, HRSD, SecOps, SAM, App Engine, Now Assist, AI agents, or industry workflows during an incumbent renewal.',
        buyerAsk:
          'Condition any added module, longer term, or enterprise platform commitment on price protection, co-termination control, renewal uplift cap, shelfware remediation, downgrade rights, implementation milestones, and measurable adoption gates.',
        vendorGive: 'Multi-product expansion can justify improved commercial protections without publishing unsupported discount assumptions.',
        tradeoffs: ['Longer terms can improve leverage but increase lock-in if downsizing, exit, and implementation failure rights are weak.'],
        evidenceBasis: [
          { type: 'regulatory-document', label: 'ServiceNow 2025 Form 10-K: subscription agreements and multi-product enterprise sales context', url: 'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm', asOf: '2026-04-29' },
        ],
      },
      {
        lever: 'Package and AI entitlement normalization',
        whenToUse:
          'Use when public ITSM package language, Now Assist, AI agents, Moveworks, Workflow Data Fabric, Platform Analytics, Process Mining, or AI credit language is mixed into one platform proposal.',
        buyerAsk:
          'Require a line-item matrix showing included features, paid add-ons, consumption triggers, hosting region, data movement, accuracy/human-review obligations, support level, non-production use, and renewal-year treatment.',
        tradeoffs: ['AI feature adoption can improve automation value, but ungoverned usage and vague service-credit mechanics can turn into renewal surprise.'],
        evidenceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow ITSM packages and pricing page', url: 'https://www.servicenow.com/products/itsm/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow Product-Specific Terms for Advanced AI and Data Products', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-product-specific-terms.pdf', asOf: '2026-04-29' },
        ],
      },
      {
        lever: 'Implementation-accountability holdback',
        whenToUse:
          'Use when value depends on CMDB remediation, workflow redesign, ERP/HR/customer-system integration, partner configuration, data migration, or multi-region rollout.',
        buyerAsk:
          'Tie phased license activation, services milestones, partner SOW acceptance, training completion, and value-realization checkpoints to named operational outcomes before broad expansion.',
        evidenceBasis: [
          { type: 'regulatory-document', label: 'ServiceNow 2025 Form 10-K implementation and partner risk disclosures', url: 'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm', asOf: '2026-04-29' },
        ],
      },
    ],
    riskFactors: [
      {
        id: 'servicenow-entitlement-drift',
        label: 'Entitlement drift and unplanned true-up exposure',
        severity: 'high',
        detectionSignals: [
          'Order form does not map products to user populations, application access, custom tables, integrations, AI credits, and instances',
          'Admin usage reports differ from procurement entitlement workbook',
          'Expansion SKUs are added without disabled-user, requester, affiliate, bot, and non-production treatment',
        ],
        mitigations: ['Run pre-renewal entitlement reconciliation', 'Require SKU/package/metric matrix', 'Document cure rights and true-up process'],
        contractualRemedies: ['Notice and cure for excess use', 'Downsell and shelfware reallocation rights', 'Co-termination and price-hold protections'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow General Terms and Conditions use verification provisions', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-general-terms-and-conditions.pdf', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'servicenow-implementation-value-gap',
        label: 'Implementation and value-realization gap',
        severity: 'high',
        detectionSignals: [
          'CMDB ownership, process taxonomy, workflow approvals, or integration owners are unresolved at BAFO',
          'ServiceNow partner SOW is disconnected from license expansion economics',
          'Buyer cannot name acceptance criteria for first production workflow',
        ],
        mitigations: ['Gate award on implementation architecture and operating-model readiness', 'Attach partner accountability to adoption milestones', 'Sequence modules by value proof'],
        contractualRemedies: ['Milestone-based services acceptance', 'Delayed activation for dependent modules', 'Termination or reduction rights for failed pilot gates'],
        sourceBasis: [
          { type: 'regulatory-document', label: 'ServiceNow 2025 Form 10-K implementation risk disclosure', url: 'https://www.sec.gov/Archives/edgar/data/1373715/000137371526000007/now-20251231.htm', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'servicenow-ai-data-governance',
        label: 'Advanced AI and data governance ambiguity',
        severity: 'medium',
        detectionSignals: [
          'Proposal includes Now Assist, AI agents, Workflow Data Fabric, or Advanced AI/Data Products without data-region and human-review exhibits',
          'Business owner treats probabilistic AI output as final operational decisioning',
          'Security review has not reconciled centralized ServiceNow environment or public cloud processing language',
        ],
        mitigations: ['Require AI use-case inventory', 'Map data classes and processing regions', 'Document human review, opt-out, and monitoring controls'],
        contractualRemedies: ['AI product exhibit', 'Data-processing addendum review', 'Region and subprocessor documentation rights'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow Product-Specific Terms', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-product-specific-terms.pdf', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow Trust compliance page', url: 'https://www.servicenow.com/company/trust/compliance.html', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'servicenow-exit-and-data-portability',
        label: 'Exit and data-portability under-specification',
        severity: 'medium',
        detectionSignals: [
          'Contract review assumes generic export is sufficient for CMDB, catalog, workflow, attachment, audit, and knowledge-base migration',
          'Buyer has no transition timeline before termination or expiration',
          'Replacement strategy ignores custom applications and integrations built on the platform',
        ],
        mitigations: ['Define export objects and format', 'Plan transition assistance before renewal signature', 'Inventory custom apps, workflows, and tables'],
        contractualRemedies: ['Standard database export request window', 'Transition assistance SOW', 'Deletion certification and post-term data-retention controls'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow General Terms and Conditions return of customer data', url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/legal/servicenow-general-terms-and-conditions.pdf', asOf: '2026-04-29' },
        ],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Raise outsourcing, resilience, audit, data-location, AI governance, and exit-readiness scrutiny for regulated financial entities.',
        regulatoryRefs: ['DORA-if-EU-regulated-financial-entity', 'GLBA-if-US-financial-data', 'SOC-2-review'],
        affectedStages: ['RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'healthcare',
        modifier:
          'Treat patient, member, employee, and operational workflow data as privacy-sensitive even when ServiceNow is not the clinical system of record.',
        additionalRequirements: ['PHI boundary review', 'BAA availability review if PHI is in scope', 'Minimum-necessary workflow design'],
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Validate procurement vehicle, public-sector terms, hosting model, region, accessibility, audit, security authorization, reseller, and government-specific AI restrictions before award.',
        regulatoryRefs: ['FedRAMP-if-required', 'StateRAMP-if-required', 'IRAP-if-Australia-public-sector'],
        affectedStages: ['MarketScan', 'RFP', 'Contracting'],
      },
    ],
    body: `## Summary
ServiceNow should be sourced as an enterprise workflow platform, not as a simple ITSM renewal. Public ServiceNow materials show package-led ITSM offerings, custom-quote pathways for ITSM and CSM, an AI Platform story across IT, HR, CRM, customer service, and application development, and product-specific terms for Advanced AI and Data Products. The 2025 Form 10-K reinforces the same enterprise posture: ServiceNow reported approximately 8,700 customers as of December 31, 2025, primarily sells to enterprise customers, supports enterprise-wide deployments, and sells through direct subscription agreements plus managed service providers and resale partners. That scale creates strong incumbent value, but it also makes weak sourcing discipline expensive.

## Sourcing posture
Use this profile when the buyer is selecting, renewing, expanding, or rationalizing ServiceNow across ITSM, ITOM, SPM, CSM, HRSD, SecOps, IRM, SAM, App Engine, Now Assist, AI agents, or platform workflows. The event should start with the operating model: which workflows belong on ServiceNow, which systems remain systems of record, which integrations are mandatory, which data classes are regulated, who owns the CMDB or service graph, and which business outcomes justify each module. A buyer that negotiates only the headline subscription line may miss the real cost drivers: package tier, user population, custom application and table entitlements, non-production instances, support level, partner SOW, data migration, AI/data product consumption, and renewal-year treatment.

## Commercial and licensing frame
Public ServiceNow pricing pages are useful for package and quote posture, not for durable numeric benchmarks. The ITSM page exposes Foundation, Advanced, and Prime package concepts and a custom quote path. The CSM pricing page similarly points buyers to a representative for a custom quote. ServiceNow licensing documentation states that contract-specific licensing should be discussed with the ServiceNow account representative. Therefore AbarVa should not seed invented per-user prices, discount ranges, or private renewal norms. TODO/founder-data-gap: buyer-specific discount bands, renewal uplift benchmarks, net module pricing, implementation SOW cost, AI credit consumption, true-up exposure, and shelfware history require buyer quotes, order forms, invoices, renewal notices, entitlement exports, or approved benchmark data.

## Negotiation levers
The strongest lever is expansion discipline. If ServiceNow seeks broader platform commitment, the buyer should trade any added module, longer term, or co-termed expansion for renewal caps, price holds, downgrade rights, shelfware reallocation, implementation milestones, and explicit AI/data governance. The second lever is entitlement normalization: every proposal should show included products, package tiers, users or units, instances, support, service credits, custom tables, AI features, data movement, and consumption triggers. The third lever is implementation accountability. The 10-K warns that customer business, integration, migration, compliance, security, partner, and customer errors can make implementations delayed, inefficient, unsuccessful, lengthy, or costly. That makes partner SOWs, acceptance criteria, and value gates commercial issues, not merely delivery details.

## Risk and diligence
Diligence should cover security attestations, DPA terms, data export and deletion, data residency, public-cloud processing, AI limitations, and regulated-industry requirements. ServiceNow public trust pages list compliance programs and certifications, while the DPA and product-specific terms define important processing, transfer, centralized-environment, public-cloud, and AI-output limitations. For AI expansion, require human review obligations, accuracy monitoring, use-case boundaries, and clear ownership for harmful, biased, or incorrect outputs. For exit, do not assume a standard database export is enough; map CMDB data, knowledge, catalog items, attachments, workflows, custom apps, integrations, audit history, and transition assistance before renewal signature.

## Failure modes
The common failure is buying a platform vision without proving the operating model. A second failure is letting custom quote opacity hide unit economics, consumption triggers, and renewal leverage. A third failure is treating trust documentation as a completed security review rather than evidence to be mapped against the buyer's regulated data, geography, public-sector, and AI requirements. A defensible ServiceNow award ties scope, package, data, implementation, and renewal rights together before the buyer commits to deeper platform dependency.`,
  },
];
