/**
 * Initiative archetype — ServiceNow Now Assist.
 *
 * Now Assist is ServiceNow's generative-AI portfolio embedded across the Now
 * Platform — ITSM, CSM, HRSD, and the Creator workflow. It went GA with the
 * Vancouver release (September 2023) and was extended through Washington DC
 * (March 2024) and Xanadu (September 2024). Now Assist is one of the few
 * enterprise-software AI offerings where the vendor has disclosed real
 * adoption telemetry on earnings calls — net-new ACV, deal counts, and
 * customer growth — so the honest entry uses those disclosures directly.
 *
 * Honesty discipline: ServiceNow CFO and CEO comments on earnings calls
 * (Bill McDermott, Gina Mastantuono) are treated as primary sources for
 * adoption metrics; product release notes and Knowledge keynote
 * announcements anchor the deployment patterns and trend direction.
 *
 * Review cadence: re-verify each source on the next ServiceNow quarterly
 * earnings (specifically the Now Assist Pro Plus ACV and deal-count
 * disclosures) and on the next half-yearly Now Platform release.
 */

import type { InitiativeArchetype } from '../types';

export const servicenowNowAssistArchetype: InitiativeArchetype = {
  archetypeKey: 'servicenow_now_assist',
  label: 'ServiceNow Now Assist',
  category: 'ai-itsm',
  definition:
    'Now Assist is ServiceNow\'s generative-AI portfolio across the Now Platform — IT Service Management, Customer Service Management, HR Service Delivery, and the Creator (low-code) workflow. It summarizes incidents and cases, drafts agent responses and knowledge articles, generates flows and code in App Engine, and increasingly routes work via "AI Agents" announced at Knowledge 2024 and 2025.',

  adoptionMetrics: [
    {
      metric: 'now_assist_largest_new_product_launch_in_company_history',
      range: {
        label: 'planning-range',
        low: 1,
        high: 1,
        unit: 'self-disclosed status — largest new-product launch in ServiceNow history (Q4 2023 earnings call commentary)',
        cohort: 'ServiceNow new-product launch history',
        sampleSize: 0,
        source: 'ServiceNow Q4 2023 earnings call — Bill McDermott prepared remarks',
        date: '2024-01',
      },
    },
    {
      metric: 'gen_ai_deals_q4_2024_disclosed_count',
      range: {
        label: 'planning-range',
        low: 150,
        high: 150,
        unit: 'GenAI (Now Assist) deals closed in Q4 2024 (CFO disclosure on earnings call)',
        cohort: 'ServiceNow customers who closed a Now Assist / Pro Plus SKU deal in Q4 2024',
        sampleSize: 0,
        source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks',
        date: '2025-01',
      },
    },
    {
      metric: 'now_assist_net_new_acv_growth_disclosed_directional',
      range: {
        label: 'planning-range',
        low: 150,
        high: 150,
        unit: '% net-new ACV growth quarter-over-quarter (Q3 2024 → Q4 2024) for Now Assist, per CFO commentary',
        cohort: 'ServiceNow Now Assist / Pro Plus SKU bookings',
        sampleSize: 0,
        source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks',
        date: '2025-01',
      },
    },
    {
      metric: 'pro_plus_average_deal_size_uplift',
      range: {
        label: 'planning-range',
        low: 30,
        high: 30,
        unit: '% larger deal size for Pro Plus (Now Assist) versus Pro SKU, per ServiceNow Q3 2024 commentary',
        cohort: 'ServiceNow customers upgrading from Pro to Pro Plus during 2024',
        sampleSize: 0,
        source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift',
        date: '2024-10',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'incident-and-case-summarization-in-itsm-csm-hrsd',
      description:
        'Now Assist summarizes incidents (ITSM), customer cases (CSM), and HR cases (HRSD) so agents start their work with a synthesized handoff rather than a raw conversation thread. This is the canonical Now Assist surface and the one ServiceNow demonstrates most often at Knowledge keynotes.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'ServiceNow ITSM, CSM, and HRSD customers on Vancouver release or later',
        sampleSize: 0,
        source: 'ServiceNow Now Platform Vancouver release notes — Now Assist general availability',
        date: '2023-09',
      },
      source: 'ServiceNow Now Platform Vancouver release notes — Now Assist general availability',
      date: '2023-09',
    },
    {
      pattern: 'now-assist-for-code-in-app-engine-and-creator',
      description:
        'Now Assist generates ServiceNow Flow Designer flows, scripts, and Now Experience UI components inside App Engine for citizen and pro developers. This is the platform-side surface analogous to GitHub Copilot but scoped to the ServiceNow domain.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'ServiceNow App Engine / Creator customers on Washington DC release or later',
        sampleSize: 0,
        source: 'ServiceNow Washington DC release announcement — Now Assist for Creator',
        date: '2024-03',
      },
      source: 'ServiceNow Washington DC release announcement — Now Assist for Creator',
      date: '2024-03',
    },
    {
      pattern: 'now-assist-ai-agents-multi-step-workflow',
      description:
        'ServiceNow announced AI Agents (an agent framework on top of Now Assist) at Knowledge 2024 and expanded the catalog (HR, CSM, ITSM agents) into 2025. AI Agents handle multi-step workflows like password reset, employee onboarding, and tier-1 case triage end to end.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'early-access — no published prevalence figure',
        cohort: 'ServiceNow customers on Xanadu release or later with AI Agents entitlement',
        sampleSize: 0,
        source: 'ServiceNow Knowledge 2024 keynote — "AI Agents on the Now Platform" announcement',
        date: '2024-05',
      },
      source: 'ServiceNow Knowledge 2024 keynote — "AI Agents on the Now Platform" announcement',
      date: '2024-05',
    },
    {
      pattern: 'pro-plus-sku-as-packaging-vehicle',
      description:
        'Now Assist is packaged as the "Pro Plus" SKU on top of existing ITSM / CSM / HRSD / Creator subscriptions, with consumption-style pricing on AI-specific capabilities. ServiceNow has disclosed that Pro Plus deals average ~30% larger than Pro deals (Q3 2024 earnings).',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 30,
        high: 30,
        unit: '% larger deal size for Pro Plus versus Pro SKU',
        cohort: 'ServiceNow customers upgrading from Pro to Pro Plus during 2024',
        sampleSize: 0,
        source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift',
        date: '2024-10',
      },
      source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift',
      date: '2024-10',
    },
  ],

  trendDirection: {
    direction: 'mainstream-scaling',
    six_month_signal:
      'Now Assist scales from a chat-and-summarize surface into a multi-agent fabric ("AI Agents") with quarterly catalog expansion, while ServiceNow continues to disclose Pro Plus deal counts and ACV growth on earnings calls as a primary KPI for the AI portfolio.',
    named_driver:
      'ServiceNow Knowledge 2024 announcement of AI Agents on the Now Platform (May 2024) followed by the Xanadu release (September 2024), combined with sustained Pro Plus ACV disclosures by CFO Gina Mastantuono on FY24 quarterly earnings calls.',
    source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks on Now Assist / Pro Plus ACV',
    date: '2025-01',
  },

  commonPitfalls: [
    {
      name: 'pro-plus-sku-mismatch-with-incumbent-itsm-edition',
      description:
        'Now Assist sits on the "Pro Plus" SKU, which is an upgrade path from Pro — not from Standard or Enterprise. Customers on incumbent legacy editions face an edition-upgrade negotiation, not just an AI add-on. Procurement teams who treat Now Assist as a feature flag underestimate the renewal lift.',
      source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift (~30% deal-size lift implies SKU upgrade, not pure add-on)',
      date: '2024-10',
    },
    {
      name: 'data-classification-and-grounding-in-cmdb-must-precede-rollout',
      description:
        'Now Assist\'s answers are only as accurate as the data it grounds in — incident records, KB articles, CMDB CIs, and HR case histories. Tenants with weak CMDB hygiene or inconsistent KB taxonomy see Now Assist produce confidently-wrong summaries that erode agent trust before the rollout reaches scale.',
      source: 'ServiceNow Now Platform Vancouver release notes — Now Assist grounding architecture',
      date: '2023-09',
    },
    {
      name: 'change-management-for-agent-workflow-redesign',
      description:
        'Now Assist meaningfully shifts the agent\'s workflow — instead of reading the case top-to-bottom, the agent reads a synthesis and acts. Teams that deploy Now Assist without rewriting case-handling SLAs, QA scorecards, and KB-article rituals see contradictory signals on whether the technology is helping.',
      source: 'ServiceNow Knowledge 2024 keynote — Now Assist workflow change-management session content',
      date: '2024-05',
    },
    {
      name: 'consumption-pricing-on-ai-capabilities-needs-forecasting',
      description:
        'Some Now Assist capabilities (and the broader AI Agents framework) are priced on a consumption model layered on top of Pro Plus. Customers who don\'t forecast AI-token / agent-action consumption alongside seat counts get end-of-quarter true-up surprises.',
      source: 'ServiceNow Knowledge 2024 keynote — AI Agents packaging and pricing positioning',
      date: '2024-05',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'ServiceNow customers (Pro → Pro Plus upgrades, 2024)',
      metric: 'pro_plus_deal_size_uplift_vs_pro',
      range: {
        label: 'planning-range',
        low: 30,
        high: 30,
        unit: '% larger deal size for Pro Plus (Now Assist) versus Pro SKU',
        cohort: 'ServiceNow customers upgrading from Pro to Pro Plus during 2024',
        sampleSize: 0,
        source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift',
        date: '2024-10',
      },
    },
    {
      cohortLabel: 'ServiceNow GenAI deal pipeline (Q4 2024)',
      metric: 'genai_deal_count_q4_2024',
      range: {
        label: 'planning-range',
        low: 150,
        high: 150,
        unit: 'GenAI deals closed in the quarter (CFO disclosure)',
        cohort: 'ServiceNow customers closing a Now Assist / Pro Plus SKU deal in Q4 2024',
        sampleSize: 0,
        source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks',
        date: '2025-01',
      },
    },
    {
      cohortLabel: 'ServiceNow Now Assist net-new ACV (Q4 2024)',
      metric: 'now_assist_net_new_acv_growth_qoq',
      range: {
        label: 'planning-range',
        low: 150,
        high: 150,
        unit: '% Now Assist net-new ACV growth QoQ (Q3 → Q4 2024), per CFO disclosure',
        cohort: 'ServiceNow Now Assist / Pro Plus net-new ACV bookings',
        sampleSize: 0,
        source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks',
        date: '2025-01',
      },
    },
  ],

  whatNext: [
    {
      name: 'ai-agents-catalog-expansion-per-release',
      description:
        'The AI Agents catalog (announced at Knowledge 2024) expands per Now Platform release through 2025, with named agents shipping for ITSM tier-1 triage, HR onboarding, and CSM case routing. ServiceNow positions a roadmap of "hundreds of agents" over the medium term.',
      adoptionStatus: 'early-pilots',
      source: 'ServiceNow Knowledge 2024 keynote — "AI Agents on the Now Platform" announcement',
      date: '2024-05',
    },
    {
      name: 'pro-plus-becomes-the-default-renewal-sku',
      description:
        'ServiceNow CFO commentary positions Pro Plus as the default upgrade path on renewals through 2025; expect Pro Plus attach rate to be a recurring metric on quarterly earnings calls.',
      adoptionStatus: 'GA-recent',
      source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks on Pro Plus ACV',
      date: '2025-01',
    },
    {
      name: 'now-assist-for-creator-graduates-to-broader-pro-developer-rollout',
      description:
        'Now Assist for Creator — first shipped in Washington DC — expands to support broader pro-developer workflows on the Now Platform, including code generation and test scaffolding.',
      adoptionStatus: 'GA-recent',
      source: 'ServiceNow Washington DC release announcement — Now Assist for Creator',
      date: '2024-03',
    },
    {
      name: 'workflow-data-fabric-grounding-becomes-a-named-architecture-pattern',
      description:
        'ServiceNow positioned "Workflow Data Fabric" at Knowledge 2024 as the grounding layer behind Now Assist and AI Agents — federating data from Snowflake, Databricks, and Microsoft Fabric into the Now Platform. Expect this to become a named architecture pattern in customer deployments through 2025.',
      adoptionStatus: 'limited-availability',
      source: 'ServiceNow Knowledge 2024 keynote — Workflow Data Fabric announcement',
      date: '2024-05',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'ServiceNow CEO Bill McDermott described Now Assist as the largest new-product launch in ServiceNow history on the Q4 2023 earnings call.',
      source: 'ServiceNow Q4 2023 earnings call — Bill McDermott prepared remarks',
      date: '2024-01',
      url: 'https://www.servicenow.com/company/investor-relations.html',
    },
    {
      claim:
        'ServiceNow CFO Gina Mastantuono disclosed approximately 150 GenAI (Now Assist) deals closed in Q4 2024 with Now Assist net-new ACV growing approximately 150% quarter-over-quarter into Q4 2024.',
      source: 'ServiceNow Q4 2024 earnings call — Gina Mastantuono prepared remarks',
      date: '2025-01',
      url: 'https://www.servicenow.com/company/investor-relations.html',
    },
    {
      claim:
        'ServiceNow disclosed that Pro Plus (Now Assist) deals average approximately 30% larger than Pro SKU deals, per Q3 2024 earnings commentary.',
      source: 'ServiceNow Q3 2024 earnings call — Bill McDermott prepared remarks on Pro Plus uplift',
      date: '2024-10',
      url: 'https://www.servicenow.com/company/investor-relations.html',
    },
    {
      claim:
        'ServiceNow announced AI Agents on the Now Platform and the Workflow Data Fabric at Knowledge 2024, extending Now Assist from single-surface generation into multi-step agent workflows.',
      source: 'ServiceNow Knowledge 2024 keynote — "AI Agents on the Now Platform" announcement',
      date: '2024-05',
      url: 'https://www.servicenow.com/company/media/press-room.html',
    },
    {
      claim:
        'Now Assist became generally available across ITSM, CSM, and HRSD in the ServiceNow Vancouver release (September 2023), and Now Assist for Creator shipped in the Washington DC release (March 2024).',
      source: 'ServiceNow Now Platform release notes — Vancouver (September 2023) and Washington DC (March 2024)',
      date: '2024-03',
      url: 'https://www.servicenow.com/products/itsm/release-notes.html',
    },
  ],

  lastReviewed: '2026-05-30',
};
