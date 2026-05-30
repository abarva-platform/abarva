/**
 * Initiative archetype — Workday AI Agents (Workday Illuminate + Agent System
 * of Record).
 *
 * Workday's AI agent push is recent and marketing-driven, so the citation
 * discipline here is strict. Every figure traces to a Workday primary source
 * (Workday Rising 2024 keynote, Workday newsroom posts, or Workday quarterly
 * earnings transcripts). Adoption metrics from independent third parties are
 * not yet published for the agent line; rather than fabricate them, this
 * entry leans on qualitative deployment patterns, pitfalls, and a rich
 * `whatNext` — which is the right shape for an early/emerging archetype.
 *
 * Review cadence: re-verify all sources and `lastReviewed` on the first of
 * each quarter, or when Workday Rising / a Workday quarterly earnings call
 * adds new agent disclosures.
 */

import type { InitiativeArchetype } from '../types';

export const workdayAiAgentsArchetype: InitiativeArchetype = {
  archetypeKey: 'workday_ai_agents',
  label: 'Workday AI Agents',
  category: 'ai-erp',
  definition:
    'Workday AI Agents are role-specific generative-AI agents embedded across Workday Finance, HCM, Recruiting, and Expense, governed by what Workday calls the Agent System of Record. Workday Illuminate is the underlying AI platform, trained on Workday\'s transactional graph, that powers both the agents and the AI features inside core Workday flows. The category covers Workday-built agents (Recruiter Agent, Expenses Agent, Succession Planning Agent, Optimize Agent, Talent Mobility Agent, Contracts Agent) and partner-built agents registered against Workday\'s Agent System of Record.',

  adoptionMetrics: [
    {
      metric: 'workday_total_customers',
      range: {
        label: 'planning-range',
        low: 11_000,
        high: 11_000,
        unit: 'customers on the Workday platform (denominator for any agent rollout)',
        cohort: 'Workday customers as disclosed in Workday Q4 FY25 earnings',
        sampleSize: 0,
        source: 'Workday Q4 FY25 earnings call (February 2025)',
        date: '2025-02',
      },
    },
    {
      metric: 'workday_full_time_employees_supported',
      range: {
        label: 'planning-range',
        low: 70_000_000,
        high: 70_000_000,
        unit: 'workers under management on Workday (denominator for HCM-side agents)',
        cohort: 'Workday-managed worker population as disclosed by Workday',
        sampleSize: 0,
        source: 'Workday corporate fact sheet (Workday newsroom, 2025)',
        date: '2025-02',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'workday-built-role-specific-agents',
      description:
        'Workday ships first-party agents tied to specific Workday roles: Recruiter Agent (sources and screens candidates inside Workday Recruiting), Expenses Agent (drafts and validates expense reports), Succession Planning Agent (proposes succession slates for HRBPs), Optimize Agent (recommends business-process improvements for admins), Talent Mobility Agent (matches internal talent to open roles), and Contracts Agent (reviews supplier contracts). All are announced as Workday-built and gated on the Agent System of Record.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure — early GA / preview as of Workday Rising 2024',
        cohort: 'Workday Rising 2024 announcement audience',
        sampleSize: 0,
        source: 'Workday Rising 2024 — "Introducing a new generation of Workday AI agents" (Workday newsroom)',
        date: '2024-09',
      },
      source: 'Workday Rising 2024 — "Introducing a new generation of Workday AI agents" (Workday newsroom)',
      date: '2024-09',
    },
    {
      pattern: 'agent-system-of-record',
      description:
        'Workday positions the Agent System of Record as the central registry, lifecycle, and governance plane for all AI agents — Workday-built and partner-built — operating against Workday data. The pitch is that customers manage agents the way they manage workers today: hire, role-assign, monitor, retire. The Agent System of Record was the headline announcement at Workday Rising 2024.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced — no published adoption figure',
        cohort: 'Workday Rising 2024 announcement audience',
        sampleSize: 0,
        source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
        date: '2024-09',
      },
      source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
      date: '2024-09',
    },
    {
      pattern: 'workday-illuminate-as-shared-substrate',
      description:
        'Workday Illuminate is the underlying AI platform — trained on Workday\'s transactional graph (>800 billion transactions, per Workday\'s disclosures) — that powers both the agents and AI features inside core Workday flows. Customers do not adopt Illuminate as a separate SKU; it is the substrate the agents and embedded features run on.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'substrate — not separately adopted',
        cohort: 'Workday platform customers',
        sampleSize: 0,
        source: 'Workday newsroom — "Workday Illuminate: The Next Generation of Workday AI"',
        date: '2024-09',
      },
      source: 'Workday newsroom — "Workday Illuminate: The Next Generation of Workday AI"',
      date: '2024-09',
    },
    {
      pattern: 'partner-built-agents-registered-against-asor',
      description:
        'Partners (initially announced with Accenture, Deloitte, PwC, AWS, Google Cloud, and others) build domain-specific agents that register against the Agent System of Record. The model parallels the Workday partner SI ecosystem for implementations, extended to AI agents.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced partner roster — no published adoption figure',
        cohort: 'Workday Rising 2024 partner ecosystem announcement',
        sampleSize: 0,
        source: 'Workday newsroom — Workday Rising 2024 partner ecosystem announcement',
        date: '2024-09',
      },
      source: 'Workday newsroom — Workday Rising 2024 partner ecosystem announcement',
      date: '2024-09',
    },
    {
      pattern: 'contracts-agent-via-evisort-acquisition',
      description:
        'The Contracts Agent is built on the Evisort contract-AI platform that Workday acquired and closed in late 2024. Workday positions Contracts Agent as covering supplier-contract review across Workday procurement flows. This is the first instance where a Workday agent\'s capability provenance is acknowledged as acquired, not built in-house.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced — Evisort acquisition closed 2024',
        cohort: 'Workday newsroom announcement audience',
        sampleSize: 0,
        source: 'Workday newsroom — "Workday completes acquisition of Evisort"',
        date: '2024-12',
      },
      source: 'Workday newsroom — "Workday completes acquisition of Evisort"',
      date: '2024-12',
    },
  ],

  trendDirection: {
    direction: 'early',
    six_month_signal:
      'Workday agents move from announcement (Rising 2024) toward customer GA cohort by cohort; the Agent System of Record gains telemetry, audit-trail, and admin-lifecycle controls that customers can lean on for governance reviews; partner-built agents begin to register in volume.',
    named_driver:
      'Workday Rising 2024 keynote announcing the Agent System of Record and the first wave of role-specific agents (Recruiter, Expenses, Succession Planning, Optimize, Talent Mobility, Contracts).',
    source: 'Workday Rising 2024 keynote — Carl Eschenbach and Sayan Chakraborty',
    date: '2024-09',
  },

  commonPitfalls: [
    {
      name: 'limited-cross-module-orchestration-in-early-releases',
      description:
        'Each role-specific agent operates inside its own Workday domain (Recruiting, Expenses, Procurement). Customers expecting an HCM action to trigger a Finance follow-up via one agent overestimate Workday agent cross-module orchestration in the early release wave. The Agent System of Record is the stated future answer, but cross-module orchestration is not the present-day capability.',
      source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
      date: '2024-09',
    },
    {
      name: 'audit-trail-and-explainability-gaps-in-agent-decisions',
      description:
        'Workday Rising 2024 announced the Agent System of Record as the governance plane but did not publish a full schema for agent decision audit trails (which model, which retrieval, which policy fired, which data was read). Customers in regulated industries should treat audit-trail depth as a buying-cycle question, not an assumed capability.',
      source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
      date: '2024-09',
    },
    {
      name: 'change-management-on-recruiter-and-expenses-workflows',
      description:
        'Recruiter Agent and Expenses Agent both insert AI drafts into workflows long owned by humans (recruiters, expense submitters, approvers). Without change-management — clear "agent did this, you can override" UX and a retraining loop for approvers — early pilots see low acceptance rates and erode trust before the agents reach steady-state.',
    },
    {
      name: 'partner-built-agent-data-boundary-confusion',
      description:
        'Partner-built agents registered against the Agent System of Record can read Workday data. Customers should require partner-agent reviews that explicitly answer: which Workday objects does the agent read, which does it write, and how does Workday\'s tenant boundary enforce that?',
      source: 'Workday newsroom — Workday Rising 2024 partner ecosystem announcement',
      date: '2024-09',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'enterprises running Workday HCM and/or Financials',
      metric: 'workday_total_customers',
      range: {
        label: 'planning-range',
        low: 11_000,
        high: 11_000,
        unit: 'Workday platform customers (denominator)',
        cohort: 'Workday customers as disclosed in Workday Q4 FY25 earnings',
        sampleSize: 0,
        source: 'Workday Q4 FY25 earnings call (February 2025)',
        date: '2025-02',
      },
    },
  ],

  whatNext: [
    {
      name: 'agent-system-of-record-governance-controls-ga',
      description:
        'The Agent System of Record gains GA-grade admin controls: agent registration approval, scoped data access, decision audit logs, retirement workflows. This is the prerequisite for regulated-industry adoption of Workday agents at scale.',
      adoptionStatus: 'early-pilots',
      source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
      date: '2024-09',
    },
    {
      name: 'partner-built-agent-marketplace-expansion',
      description:
        'The partner-agent ecosystem (Accenture, Deloitte, PwC, AWS, Google Cloud, and others) expands beyond the initial announcement wave; partner-built agents become a routinely-evaluated buying category alongside Workday-built agents.',
      adoptionStatus: 'early-pilots',
      source: 'Workday newsroom — Workday Rising 2024 partner ecosystem announcement',
      date: '2024-09',
    },
    {
      name: 'contracts-agent-via-evisort-expands-procurement-coverage',
      description:
        'The Contracts Agent — built on the Evisort acquisition — extends from supplier contract review into adjacent procurement flows (supplier risk, renewal management) inside Workday.',
      adoptionStatus: 'limited-availability',
      source: 'Workday newsroom — "Workday completes acquisition of Evisort"',
      date: '2024-12',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'At Workday Rising 2024, Workday announced the Agent System of Record as the central registry, lifecycle, and governance plane for AI agents — Workday-built and partner-built — operating against Workday data.',
      source: 'Workday newsroom — "Workday Introduces the Agent System of Record" (Workday Rising 2024)',
      date: '2024-09',
      url: 'https://newsroom.workday.com/2024-09-17-Workday-Introduces-the-Agent-System-of-Record-Helping-Organizations-Manage-Their-AI-Agents-Workforce',
    },
    {
      claim:
        'Workday announced an initial wave of role-specific AI agents — Recruiter, Expenses, Succession Planning, Optimize, Talent Mobility, and Contracts — at Workday Rising 2024.',
      source: 'Workday newsroom — "Introducing a new generation of Workday AI agents" (Workday Rising 2024)',
      date: '2024-09',
      url: 'https://newsroom.workday.com/2024-09-17-Workday-Unveils-Next-Generation-of-AI-Agents-to-Transform-How-Work-Gets-Done',
    },
    {
      claim:
        'Workday Illuminate is the underlying AI platform — trained on Workday\'s transactional graph — that powers both the agents and AI features inside core Workday flows.',
      source: 'Workday newsroom — "Workday Illuminate: The Next Generation of Workday AI"',
      date: '2024-09',
      url: 'https://newsroom.workday.com/2024-09-17-Workday-Illuminates-the-Path-to-an-AI-Powered-Future-of-Work',
    },
    {
      claim:
        'Workday completed its acquisition of Evisort in late 2024, providing the contract-AI foundation that the Contracts Agent is built on.',
      source: 'Workday newsroom — "Workday completes acquisition of Evisort"',
      date: '2024-12',
      url: 'https://newsroom.workday.com/2024-12-02-Workday-Completes-Acquisition-of-Evisort',
    },
    {
      claim:
        'Workday discloses 11,000+ customers and 70 million workers under management on the Workday platform — the denominator for any Workday agent rollout analysis.',
      source: 'Workday Q4 FY25 earnings call and Workday corporate fact sheet (February 2025)',
      date: '2025-02',
      url: 'https://www.workday.com/en-us/company/about-workday/newsroom.html',
    },
  ],

  lastReviewed: '2026-05-30',
};
