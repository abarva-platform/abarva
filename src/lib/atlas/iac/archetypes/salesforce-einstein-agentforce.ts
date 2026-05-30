/**
 * Initiative archetype — Salesforce Einstein and Agentforce.
 *
 * Salesforce's AI-for-CRM brand spans two layers: Einstein (predictive ML
 * and generative copilots — Einstein Copilot, Einstein GPT, Einstein 1
 * Studio) and Agentforce (Salesforce's autonomous agents announced at
 * Dreamforce 2024 and re-platformed in Agentforce 2.0). This archetype
 * covers both because customer announcements, deal counts, and pricing
 * disclosures consistently bundle them in Salesforce's own communications.
 *
 * Sources cited are real and verifiable: the Dreamforce 2024 keynote and
 * Salesforce Newsroom press releases (which name Wiley, OpenTable, FedEx,
 * Saks, ADP, Bombora, RBC Wealth Management, and others as Agentforce
 * customers), Salesforce Q2 FY25 and Q3 FY25 earnings call transcripts
 * (Marc Benioff and Amy Weaver disclose Agentforce deal counts and pricing
 * on the analyst calls), Salesforce's own Agentforce 2.0 announcement, and
 * the State of the Connected Customer / State of Sales reports for adoption
 * context. Where a claim could not be tied to a published, dated source, it
 * is omitted.
 *
 * Review cadence: re-verify after every Salesforce quarterly earnings call
 * (Agentforce deal counts are now a standing disclosure), at Dreamforce and
 * TrailblazerDX (major product cadences), and when Salesforce publishes a
 * new State of the Connected Customer or State of Sales report.
 */

import type { InitiativeArchetype } from '../types';

export const salesforceEinsteinAgentforceArchetype: InitiativeArchetype = {
  archetypeKey: 'salesforce_einstein_agentforce',
  label: 'Salesforce Einstein and Agentforce',
  category: 'ai-crm',
  definition:
    'Salesforce Einstein is the AI layer inside the Salesforce platform — predictive scoring, recommendations, and generative copilots (Einstein Copilot, Einstein GPT) embedded in Sales Cloud, Service Cloud, Marketing Cloud, and Industry Clouds. Agentforce — announced at Dreamforce 2024 and re-platformed as Agentforce 2.0 in December 2024 — is Salesforce\'s suite of autonomous AI agents for service, sales development, marketing, and commerce, grounded on the Salesforce Data Cloud and a customer\'s metadata.',

  adoptionMetrics: [
    {
      metric: 'agentforce_paid_deals_closed_q3_fy25',
      range: {
        label: 'planning-range',
        low: 200,
        high: 200,
        unit: 'paid Agentforce deals closed in the quarter (Salesforce disclosure)',
        cohort: 'Salesforce customer base in Q3 FY25, quarter ended October 31, 2024',
        sampleSize: 0,
        source: 'Salesforce Q3 FY25 earnings call (December 3, 2024) — Marc Benioff and Amy Weaver prepared remarks',
        date: '2024-12',
      },
    },
    {
      metric: 'agentforce_pipeline_deals_total_q3_fy25',
      range: {
        label: 'planning-range',
        low: 200,
        high: 200,
        unit: 'paid Agentforce deals plus a substantially larger pipeline (specific pipeline number not disclosed on the call)',
        cohort: 'Salesforce customer base, Q3 FY25 quarter end',
        sampleSize: 0,
        source: 'Salesforce Q3 FY25 earnings call — Marc Benioff prepared remarks',
        date: '2024-12',
      },
    },
    {
      metric: 'agentforce_consumption_pricing_per_conversation',
      range: {
        label: 'planning-range',
        low: 2,
        high: 2,
        unit: 'USD per Agentforce conversation under the consumption pricing model',
        cohort: 'Agentforce customers as priced by Salesforce at launch',
        sampleSize: 0,
        source: 'Salesforce Newsroom — "Salesforce Announces Agentforce: The First Digital Labor Solution for Enterprises"',
        date: '2024-09',
      },
    },
    {
      metric: 'state_of_the_connected_customer_use_of_genai',
      range: {
        label: 'planning-range',
        low: 73,
        high: 73,
        unit: '% of customers expecting better personalisation as AI use grows (consumer + business buyer survey)',
        cohort: 'over 14,300 consumers and business buyers across 25 countries — Salesforce 6th State of the Connected Customer',
        sampleSize: 14300,
        source: 'Salesforce — "State of the Connected Customer, 6th edition"',
        date: '2023-10',
      },
    },
    {
      metric: 'state_of_sales_reps_using_ai',
      range: {
        label: 'planning-range',
        low: 81,
        high: 81,
        unit: '% of sales professionals reporting that AI helps them spend more time selling',
        cohort: 'over 5,500 sales professionals across 27 countries — Salesforce 6th State of Sales',
        sampleSize: 5500,
        source: 'Salesforce — "State of Sales, 6th edition"',
        date: '2024-05',
      },
    },
    {
      metric: 'named_agentforce_launch_customers',
      range: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'named Agentforce launch and early-adopter customers disclosed by Salesforce (Wiley, OpenTable, Saks, ADP, Bombora, FedEx, RBC Wealth Management, Workday partnership, Accenture, Deloitte, IBM)',
        cohort: 'Salesforce-disclosed Agentforce launch customers',
        sampleSize: 0,
        source: 'Salesforce Newsroom — Agentforce launch press release and Dreamforce 2024 keynote',
        date: '2024-09',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'service-cloud-agentforce-service-agent',
      description:
        'Agentforce Service Agent answers customer service questions over a brand\'s knowledge base and Data Cloud, hands off to human agents, and logs interactions in Service Cloud. Salesforce names this the highest-volume Agentforce use case and lists Wiley, OpenTable, and Saks as named deployments.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no industry-wide prevalence figure; Salesforce discloses paid deals quarterly',
        cohort: 'Agentforce paid customers as disclosed in Salesforce Q3 FY25 earnings',
        sampleSize: 0,
        source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0" plus Wiley and OpenTable customer stories',
        date: '2024-12',
      },
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0"',
      date: '2024-12',
    },
    {
      pattern: 'sales-cloud-agentforce-sdr-agent',
      description:
        'Agentforce Sales Development Representative (SDR) Agent qualifies inbound leads, answers questions, books meetings, and hands off to human reps. The Salesforce SDR Agent and Sales Coach Agent were Wave-1 Agentforce launch agents.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no industry-wide prevalence figure',
        cohort: 'Agentforce launch announcement audience',
        sampleSize: 0,
        source: 'Salesforce Newsroom — "Salesforce Announces Agentforce: The First Digital Labor Solution for Enterprises"',
        date: '2024-09',
      },
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce: The First Digital Labor Solution for Enterprises"',
      date: '2024-09',
    },
    {
      pattern: 'einstein-copilot-in-app-actions',
      description:
        'Einstein Copilot is the in-app conversational assistant embedded in Sales, Service, and Industry Clouds. Users invoke it inline to summarise records, draft replies, run actions, and orchestrate Flow automations grounded in tenant CRM data.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no Salesforce-disclosed prevalence figure for Einstein Copilot specifically',
        cohort: 'Salesforce general-availability customers',
        sampleSize: 0,
        source: 'Salesforce Newsroom — "Salesforce Announces Einstein Copilot Generally Available"',
        date: '2024-04',
      },
      source: 'Salesforce Newsroom — "Salesforce Announces Einstein Copilot Generally Available"',
      date: '2024-04',
    },
    {
      pattern: 'agentforce-grounded-on-data-cloud',
      description:
        'Agentforce agents and Einstein generative features ground responses on Data Cloud — Salesforce\'s unified customer data layer — plus tenant metadata. Salesforce positions Data Cloud as the substrate that makes Agentforce factually accurate against a customer\'s own data.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no public prevalence figure; Salesforce ties Data Cloud growth to Agentforce uptake in earnings commentary',
        cohort: 'Salesforce customers running Agentforce in production',
        sampleSize: 0,
        source: 'Salesforce Q2 FY25 earnings call (August 28, 2024) — Marc Benioff prepared remarks on Data Cloud and Agentforce',
        date: '2024-08',
      },
      source: 'Salesforce Q2 FY25 earnings call (August 28, 2024) — Marc Benioff prepared remarks on Data Cloud and Agentforce',
      date: '2024-08',
    },
    {
      pattern: 'agent-builder-low-code-authoring',
      description:
        'Customers build their own Agentforce agents in Agent Builder (low-code) and Atlas Reasoning Engine (Agentforce 2.0), specifying topics, actions, and grounding sources. Salesforce positions Agent Builder as the path enterprises take to extend the catalogue of stock agents.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no public prevalence figure',
        cohort: 'Agentforce 2.0 launch announcement audience',
        sampleSize: 0,
        source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0: The Digital Labor Platform with Enhanced Reasoning, Integrations, and Customization"',
        date: '2024-12',
      },
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0: The Digital Labor Platform with Enhanced Reasoning, Integrations, and Customization"',
      date: '2024-12',
    },
  ],

  trendDirection: {
    direction: 'mainstream-scaling',
    six_month_signal:
      'Agentforce evolves from the Dreamforce 2024 launch through Agentforce 2.0 (Atlas Reasoning Engine, deeper Slack and Tableau integrations, MuleSoft topic library) into Salesforce\'s standing growth narrative on quarterly earnings; Salesforce repositions Einstein as the predictive layer and Agentforce as the agentic surface, and discloses paid Agentforce deals every quarter.',
    named_driver:
      'Dreamforce 2024 Agentforce launch (September 2024) followed by Agentforce 2.0 announcement (December 17, 2024) introducing the Atlas Reasoning Engine and Agentforce in Slack.',
    source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0"',
    date: '2024-12',
  },

  commonPitfalls: [
    {
      name: 'data-cloud-readiness-is-the-prerequisite',
      description:
        'Salesforce ties Agentforce accuracy to Data Cloud grounding. Customers that have not unified their customer data into Data Cloud — or who skip the data-quality and harmonisation step — find Agentforce hallucinates or under-performs against their own knowledge base. Salesforce\'s own customer-success guidance leads with Data Cloud readiness.',
      source: 'Salesforce — "Agentforce: Getting Started" trailhead and Q2 FY25 earnings commentary on Data Cloud as the Agentforce substrate',
      date: '2024-08',
    },
    {
      name: 'consumption-pricing-cost-surprise',
      description:
        'Agentforce launched with consumption-based pricing at USD 2 per conversation. Customers running high-volume customer-service workloads need a per-conversation cost model and active conversation-volume monitoring; without it, agent rollouts can outrun the modelled business case once production traffic ramps.',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce: The First Digital Labor Solution for Enterprises" (USD 2 per conversation pricing disclosure)',
      date: '2024-09',
    },
    {
      name: 'topic-and-action-scope-creep',
      description:
        'Agent Builder lets teams add topics and actions quickly. Salesforce\'s own implementation guidance warns that mis-scoped topics or overly broad actions degrade agent reliability — agents need a narrow, well-tested topic graph before scope expansion.',
      source: 'Salesforce Architects — Agentforce topic and action design guidance',
      date: '2024-12',
    },
    {
      name: 'einstein-copilot-vs-agentforce-confusion',
      description:
        'Salesforce ships both Einstein Copilot (an in-app conversational assistant inside Sales, Service, and Industry Clouds) and Agentforce (autonomous agents). Customers conflate the two and mis-license, mis-scope, or mis-prioritise the rollout. Agentforce 2.0 messaging clarified the split but the conflation is the most common procurement-side confusion observed.',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0" (split between Agentforce and Einstein clarified)',
      date: '2024-12',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'Salesforce customer base, Q3 FY25 quarter end',
      metric: 'agentforce_paid_deals_in_quarter',
      range: {
        label: 'planning-range',
        low: 200,
        high: 200,
        unit: 'paid Agentforce deals closed in the quarter (Salesforce disclosure)',
        cohort: 'Salesforce Q3 FY25 (quarter ended October 31, 2024)',
        sampleSize: 0,
        source: 'Salesforce Q3 FY25 earnings call — Marc Benioff and Amy Weaver prepared remarks',
        date: '2024-12',
      },
    },
    {
      cohortLabel: 'Salesforce customers pricing Agentforce',
      metric: 'consumption_price_per_conversation',
      range: {
        label: 'planning-range',
        low: 2,
        high: 2,
        unit: 'USD per Agentforce conversation',
        cohort: 'Agentforce launch pricing as disclosed by Salesforce',
        sampleSize: 0,
        source: 'Salesforce Newsroom — Agentforce launch press release',
        date: '2024-09',
      },
    },
    {
      cohortLabel: 'sales professionals using AI',
      metric: 'more_time_selling_with_ai',
      range: {
        label: 'planning-range',
        low: 81,
        high: 81,
        unit: '% saying AI helps them spend more time selling',
        cohort: 'over 5,500 sales professionals across 27 countries, Salesforce State of Sales 6th edition',
        sampleSize: 5500,
        source: 'Salesforce — "State of Sales, 6th edition"',
        date: '2024-05',
      },
    },
    {
      cohortLabel: 'consumers and business buyers',
      metric: 'expect_better_personalisation_as_ai_grows',
      range: {
        label: 'planning-range',
        low: 73,
        high: 73,
        unit: '% expecting better personalisation as AI use grows',
        cohort: 'over 14,300 consumers and business buyers across 25 countries, Salesforce State of the Connected Customer 6th edition',
        sampleSize: 14300,
        source: 'Salesforce — "State of the Connected Customer, 6th edition"',
        date: '2023-10',
      },
    },
  ],

  whatNext: [
    {
      name: 'agentforce-2-atlas-reasoning-engine',
      description:
        'Agentforce 2.0 ships the Atlas Reasoning Engine, deeper Slack-as-agent-surface integration, a MuleSoft-native topic library, and Tableau Semantic Layer grounding. Salesforce positions 2.0 as the platform release that turns Agentforce from a launch into a standing product line.',
      adoptionStatus: 'GA-recent',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0: The Digital Labor Platform with Enhanced Reasoning, Integrations, and Customization"',
      date: '2024-12',
    },
    {
      name: 'agentforce-in-slack-as-default-surface',
      description:
        'Salesforce makes Slack the primary conversational surface for Agentforce, exposing service, SDR, and custom agents inside Slack channels and DMs grounded on tenant Data Cloud context.',
      adoptionStatus: 'GA-recent',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0"',
      date: '2024-12',
    },
    {
      name: 'industry-cloud-agentforce-templates',
      description:
        'Industry Cloud teams ship vertical Agentforce templates — Financial Services, Health Cloud, Manufacturing, Consumer Goods — bundling pre-built topics, actions, and Data Cloud schemas for sector-specific agents.',
      adoptionStatus: 'early-pilots',
      source: 'Salesforce Newsroom — Agentforce launch press release (industry rollouts referenced)',
      date: '2024-09',
    },
    {
      name: 'agentforce-partner-marketplace',
      description:
        'Salesforce and SI partners (Accenture, Deloitte, IBM) co-build vertical and function-specific Agentforce agents distributed through AppExchange; partner-led agent builds become a standing channel motion.',
      adoptionStatus: 'early-pilots',
      source: 'Salesforce Newsroom — Agentforce launch press release (partner ecosystem disclosure)',
      date: '2024-09',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'Salesforce launched Agentforce at Dreamforce 2024 (September 12, 2024) with consumption pricing at USD 2 per conversation, naming Wiley, OpenTable, Saks, ADP, Bombora, FedEx, and RBC Wealth Management among launch customers, with Accenture, Deloitte, and IBM as launch SI partners.',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce: The First Digital Labor Solution for Enterprises"',
      date: '2024-09',
      url: 'https://www.salesforce.com/news/press-releases/2024/09/12/agentforce-announcement/',
    },
    {
      claim:
        'On the Salesforce Q3 FY25 earnings call (December 3, 2024, quarter ended October 31, 2024), Marc Benioff and Amy Weaver disclosed 200 paid Agentforce deals closed in the quarter with a substantially larger pipeline.',
      source: 'Salesforce Q3 FY25 earnings call — Marc Benioff and Amy Weaver prepared remarks',
      date: '2024-12',
      url: 'https://investor.salesforce.com/financials/default.aspx',
    },
    {
      claim:
        'Salesforce announced Agentforce 2.0 on December 17, 2024, introducing the Atlas Reasoning Engine, Agentforce in Slack, a MuleSoft-native topic library, and Tableau Semantic Layer grounding.',
      source: 'Salesforce Newsroom — "Salesforce Announces Agentforce 2.0: The Digital Labor Platform with Enhanced Reasoning, Integrations, and Customization"',
      date: '2024-12',
      url: 'https://www.salesforce.com/news/press-releases/2024/12/17/agentforce-2-announcement/',
    },
    {
      claim:
        'Salesforce announced Einstein Copilot as generally available in February 2024, embedded in Sales Cloud, Service Cloud, and Industry Clouds with grounding on tenant CRM data.',
      source: 'Salesforce Newsroom — "Salesforce Announces Einstein Copilot Generally Available"',
      date: '2024-04',
      url: 'https://www.salesforce.com/news/stories/einstein-copilot-news/',
    },
    {
      claim:
        'Salesforce\'s 6th State of Sales survey of over 5,500 sales professionals across 27 countries reported that 81% of sales professionals using AI say it helps them spend more time selling.',
      source: 'Salesforce — "State of Sales, 6th edition"',
      date: '2024-05',
      url: 'https://www.salesforce.com/resources/research-reports/state-of-sales/',
    },
    {
      claim:
        'Salesforce\'s 6th State of the Connected Customer surveyed over 14,300 consumers and business buyers across 25 countries; 73% of customers expect better personalisation as AI use grows.',
      source: 'Salesforce — "State of the Connected Customer, 6th edition"',
      date: '2023-10',
      url: 'https://www.salesforce.com/resources/research-reports/state-of-the-connected-customer/',
    },
  ],

  lastReviewed: '2026-05-30',
};
