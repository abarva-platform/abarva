/**
 * Initiative archetype — SAP Joule.
 *
 * SAP Joule is SAP's generative-AI copilot, embedded across SAP's cloud
 * portfolio (S/4HANA Cloud, SuccessFactors, Ariba, SAP Build, BTP). It was
 * announced at SAP Sapphire 2023 and has been progressively expanded through
 * 2024–2025 with collaborations (Joule for Consultants; SAP–Microsoft Copilot
 * interoperability), an agent framework ("Joule Agents"), and developer
 * support inside SAP Build.
 *
 * Honesty discipline note: SAP's public disclosures about Joule lean heavily
 * on forward-looking projections (e.g. "Joule will deliver X% productivity
 * lift across the workforce"), not realized usage telemetry. Those
 * projections are surfaced here under `whatNext` and `trendDirection`, NOT
 * under `adoptionMetrics`, because they are vendor promises, not measured
 * outcomes. The only adoption metric carried is SAP's disclosed cloud
 * backlog (a real, audited figure) used to size the Joule-eligible cohort.
 *
 * Review cadence: re-verify each source on the next SAP quarterly earnings
 * (Christian Klein commentary on Joule adoption) and on the next SAP
 * Sapphire / TechEd announcements.
 */

import type { InitiativeArchetype } from '../types';

export const sapJouleArchetype: InitiativeArchetype = {
  archetypeKey: 'sap_joule',
  label: 'SAP Joule',
  category: 'ai-erp',
  definition:
    'SAP Joule is SAP\'s generative-AI copilot, embedded across SAP\'s cloud portfolio (S/4HANA Cloud, SuccessFactors, Ariba, SAP Build, Business Technology Platform). It answers natural-language questions over SAP data, drafts content (job descriptions, RFQs, code), navigates SAP transactions, and increasingly orchestrates multi-step tasks via "Joule Agents." It interoperates with Microsoft 365 Copilot under a co-marketed agreement.',

  adoptionMetrics: [
    {
      metric: 'sap_cloud_backlog_eligible_for_joule',
      range: {
        label: 'planning-range',
        low: 15_200_000_000,
        high: 15_200_000_000,
        unit: 'EUR current cloud backlog',
        cohort: 'SAP cloud backlog at Q4 2024 close — the upper bound of tenants where Joule is offered as part of the cloud portfolio (RISE / GROW with SAP)',
        sampleSize: 0,
        source: 'SAP Q4 and FY 2024 earnings press release',
        date: '2025-01',
      },
    },
    {
      metric: 'sap_cloud_revenue_run_rate_eligible_for_joule',
      range: {
        label: 'planning-range',
        low: 17_100_000_000,
        high: 17_100_000_000,
        unit: 'EUR FY24 cloud revenue',
        cohort: 'SAP FY24 cloud revenue — the population of paid cloud subscribers Joule is rolled out into as part of RISE / GROW / SuccessFactors / Ariba subscriptions',
        sampleSize: 0,
        source: 'SAP Q4 and FY 2024 earnings press release',
        date: '2025-01',
      },
    },
    {
      metric: 'joule_consultants_named_partner_program',
      range: {
        label: 'planning-range',
        low: 1,
        high: 1,
        unit: 'launched program (Joule for Consultants — partner-facing copilot)',
        cohort: 'SAP system integrator and consulting partner ecosystem',
        sampleSize: 0,
        source: 'SAP news release — "SAP Brings Generative AI Capabilities to Consultants with New Joule Functionality"',
        date: '2024-10',
      },
    },
    {
      metric: 'joule_microsoft_copilot_interoperability_announced',
      range: {
        label: 'planning-range',
        low: 1,
        high: 1,
        unit: 'announced bidirectional copilot interoperability (Joule ↔ Microsoft 365 Copilot)',
        cohort: 'SAP cloud customers also licensed for Microsoft 365 Copilot',
        sampleSize: 0,
        source: 'SAP news release — "SAP and Microsoft Reimagine the Future of Work with Joule and Microsoft 365 Copilot"',
        date: '2024-05',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'joule-as-natural-language-front-end-to-sap-transactions',
      description:
        'End users ask Joule questions in natural language inside S/4HANA Cloud, SuccessFactors, Ariba, or the SAP Fiori launchpad. Joule answers from SAP data, navigates to the relevant transaction, and drafts content (e.g. job descriptions in SuccessFactors). This is the surface SAP demonstrates publicly at Sapphire / TechEd keynotes.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'SAP cloud customers offered Joule as part of RISE / GROW with SAP',
        sampleSize: 0,
        source: 'SAP Sapphire 2024 keynote — "Bring Out Your Best with SAP" (Christian Klein)',
        date: '2024-06',
      },
      source: 'SAP Sapphire 2024 keynote — "Bring Out Your Best with SAP" (Christian Klein)',
      date: '2024-06',
    },
    {
      pattern: 'joule-agents-multi-step-cross-line-of-business-orchestration',
      description:
        'SAP TechEd 2024 introduced "Joule Agents" — AI agents that coordinate across SAP lines of business (e.g. finance + procurement + HR) to handle multi-step processes such as dispute resolution or onboarding. Initial agents announced include a dispute-resolution agent (finance) and a sales-quoting agent.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'early-access — no broad prevalence figure',
        cohort: 'SAP TechEd 2024 Joule Agents announcement audience',
        sampleSize: 0,
        source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
        date: '2024-10',
      },
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
      date: '2024-10',
    },
    {
      pattern: 'joule-for-developers-in-sap-build-code',
      description:
        'SAP Build Code embeds Joule for developers building extensions on SAP BTP — generating Java and JavaScript code, data models, and test scripts grounded in SAP\'s domain APIs. This is SAP\'s direct equivalent of GitHub Copilot for the SAP stack.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'SAP Build Code customers and BTP developers',
        sampleSize: 0,
        source: 'SAP news release — "SAP Build Code Brings Generative AI to Application Developers"',
        date: '2024-01',
      },
      source: 'SAP news release — "SAP Build Code Brings Generative AI to Application Developers"',
      date: '2024-01',
    },
    {
      pattern: 'joule-microsoft-365-copilot-cross-surface',
      description:
        'Joule and Microsoft 365 Copilot are positioned to call across surfaces — a Teams or Outlook prompt can reach into SAP data via Joule; a Joule prompt can reach into Microsoft 365 context. Co-marketed as a productivity pattern at SAP Sapphire and Microsoft Build 2024.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced co-marketed interoperability — no published prevalence figure',
        cohort: 'SAP cloud customers also licensed for Microsoft 365 Copilot',
        sampleSize: 0,
        source: 'SAP news release — "SAP and Microsoft Reimagine the Future of Work with Joule and Microsoft 365 Copilot"',
        date: '2024-05',
      },
      source: 'SAP news release — "SAP and Microsoft Reimagine the Future of Work with Joule and Microsoft 365 Copilot"',
      date: '2024-05',
    },
  ],

  trendDirection: {
    direction: 'emerging',
    six_month_signal:
      'SAP expands Joule from a chat front-end to an agent fabric ("Joule Agents") across S/4HANA, SuccessFactors, and Ariba, with named agents shipping into early access; SAP\'s quarterly disclosures continue to talk Joule in forward-looking terms rather than disclosing realized adoption telemetry.',
    named_driver:
      'SAP TechEd 2024 announcement of Joule Agents (October 2024) and the Joule for Consultants partner program, extending Joule from a single-surface copilot to a multi-step cross-line-of-business agent platform.',
    source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
    date: '2024-10',
  },

  commonPitfalls: [
    {
      name: 'vendor-projection-vs-realized-adoption-gap',
      description:
        'SAP\'s public disclosures about Joule lean on forward-looking productivity promises rather than disclosed usage telemetry. Buyers who size a Joule rollout off SAP keynote slides risk over-committing budget and seats relative to where realized adoption actually lands. Pilot with a controlled cohort and measure before scaling.',
      source: 'SAP Sapphire 2024 keynote — "Bring Out Your Best with SAP" (Christian Klein) — forward-looking productivity claims',
      date: '2024-06',
    },
    {
      name: 'license-bundling-and-entitlement-confusion',
      description:
        'Joule entitlements are bundled differently across RISE with SAP, GROW with SAP, SuccessFactors, and Ariba SKUs, and SAP introduced AI Units as a consumption metric for premium AI capabilities at TechEd 2024. Procurement needs to map which Joule capabilities are included by SKU vs. consumed against AI Units before sizing.',
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024) — AI Units announcement',
      date: '2024-10',
    },
    {
      name: 'cloud-edition-prerequisite',
      description:
        'Joule is delivered only against SAP\'s cloud editions (S/4HANA Cloud, SuccessFactors, Ariba, SAP Build). Customers still running S/4HANA on-premise or ECC cannot enable Joule on those instances and must first complete a RISE-with-SAP cloud migration. This is a multi-quarter precondition, not a feature flag.',
      source: 'SAP Sapphire 2024 keynote — "Bring Out Your Best with SAP" (Christian Klein) — Joule positioning inside RISE / GROW',
      date: '2024-06',
    },
    {
      name: 'data-grounding-quality-depends-on-master-data-hygiene',
      description:
        'Joule\'s answers and Joule Agents\' actions are only as good as the SAP master data they ground in. Tenants with stale HR org structures, inconsistent material masters, or weak finance hierarchies see Joule produce confidently-wrong outputs, which then erode user trust faster than incremental cleanup can recover it.',
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024) — grounding architecture description',
      date: '2024-10',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'SAP cloud customers (RISE / GROW / SuccessFactors / Ariba)',
      metric: 'sap_cloud_backlog_eur',
      range: {
        label: 'planning-range',
        low: 15_200_000_000,
        high: 15_200_000_000,
        unit: 'EUR current cloud backlog at Q4 2024 close',
        cohort: 'SAP cloud customers — Joule-eligible population sizing reference',
        sampleSize: 0,
        source: 'SAP Q4 and FY 2024 earnings press release',
        date: '2025-01',
      },
    },
    {
      cohortLabel: 'SAP cloud customers (RISE / GROW / SuccessFactors / Ariba)',
      metric: 'sap_cloud_revenue_fy24_eur',
      range: {
        label: 'planning-range',
        low: 17_100_000_000,
        high: 17_100_000_000,
        unit: 'EUR FY24 cloud revenue',
        cohort: 'SAP cloud customers — Joule deployment surface revenue base',
        sampleSize: 0,
        source: 'SAP Q4 and FY 2024 earnings press release',
        date: '2025-01',
      },
    },
  ],

  whatNext: [
    {
      name: 'joule-agents-progressing-from-announcement-to-customer-rollout',
      description:
        'The Joule Agents announced at SAP TechEd 2024 (dispute-resolution agent in finance, sales-quoting agent, etc.) move from announcement into early-access customer rollouts during 2025. SAP positions a roadmap to expand to additional line-of-business agents quarterly.',
      adoptionStatus: 'early-pilots',
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
      date: '2024-10',
    },
    {
      name: 'joule-for-consultants-partner-rollout',
      description:
        'SAP\'s Joule for Consultants program — a partner-facing copilot for SAP system integrators — expands its partner base through 2025 with the goal of accelerating SAP implementation projects. Adoption tracked at the partner-program level, not at the end-customer level.',
      adoptionStatus: 'limited-availability',
      source: 'SAP news release — "SAP Brings Generative AI Capabilities to Consultants with New Joule Functionality"',
      date: '2024-10',
    },
    {
      name: 'ai-units-consumption-metric-becomes-standard-sku-element',
      description:
        'SAP\'s AI Units consumption metric (introduced at TechEd 2024 for premium AI capabilities) becomes a standard line item in cloud renewals through 2025. Procurement teams need a forecast of AI-Units burn alongside seat counts.',
      adoptionStatus: 'GA-recent',
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
      date: '2024-10',
    },
    {
      name: 'joule-microsoft-365-copilot-bidirectional-interop-ga',
      description:
        'The co-marketed Joule ↔ Microsoft 365 Copilot interoperability (announced May 2024) progresses to broader availability, supporting cross-surface prompts (e.g. Teams reaching SAP data via Joule). Realized customer adoption depends on dual licensing.',
      adoptionStatus: 'limited-availability',
      source: 'SAP news release — "SAP and Microsoft Reimagine the Future of Work with Joule and Microsoft 365 Copilot"',
      date: '2024-05',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'SAP reported current cloud backlog of EUR 15.2 billion and FY24 cloud revenue of EUR 17.1 billion at Q4 / FY 2024 close — sizing the population of SAP cloud customers in which Joule is rolled out as part of RISE / GROW / SuccessFactors / Ariba subscriptions.',
      source: 'SAP Q4 and FY 2024 earnings press release',
      date: '2025-01',
      url: 'https://www.sap.com/investors/en/why-sap/financial-news.html',
    },
    {
      claim:
        'At SAP TechEd 2024, SAP introduced Joule Agents — AI agents coordinating across SAP lines of business (finance, procurement, HR) — and the AI Units consumption metric for premium AI capabilities.',
      source: 'SAP news release — "SAP Brings the Next Wave of AI Innovations to Transform How Work Gets Done" (SAP TechEd 2024)',
      date: '2024-10',
      url: 'https://news.sap.com/2024/10/sap-teched-ai-innovations-joule-agents/',
    },
    {
      claim:
        'SAP launched Joule for Consultants — a partner-facing copilot for SAP system integrators — to accelerate SAP implementation projects.',
      source: 'SAP news release — "SAP Brings Generative AI Capabilities to Consultants with New Joule Functionality"',
      date: '2024-10',
      url: 'https://news.sap.com/2024/10/joule-functionality-for-consultants/',
    },
    {
      claim:
        'SAP and Microsoft announced co-marketed interoperability between Joule and Microsoft 365 Copilot, enabling cross-surface prompts between SAP applications and Microsoft 365.',
      source: 'SAP news release — "SAP and Microsoft Reimagine the Future of Work with Joule and Microsoft 365 Copilot"',
      date: '2024-05',
      url: 'https://news.sap.com/2024/05/sap-microsoft-joule-copilot-future-of-work/',
    },
    {
      claim:
        'SAP Build Code (announced January 2024) embedded Joule for developers building extensions on SAP BTP — generating Java/JavaScript code, data models, and test scripts grounded in SAP\'s domain APIs.',
      source: 'SAP news release — "SAP Build Code Brings Generative AI to Application Developers"',
      date: '2024-01',
      url: 'https://news.sap.com/2024/01/sap-build-code-generative-ai-developers/',
    },
  ],

  lastReviewed: '2026-05-30',
};
