/**
 * Initiative archetype — Oracle AI Agents in Fusion Cloud Applications.
 *
 * Oracle\'s ERP/HCM/SCM/CX AI agent push is recent and marketing-driven, so
 * the citation discipline here is strict. Every figure traces to an Oracle
 * primary source (Oracle CloudWorld 2024 keynote, Oracle newsroom posts, or
 * Oracle quarterly earnings transcripts where AI agents are explicitly
 * discussed). Third-party adoption metrics for the Oracle AI agent line are
 * not yet published at a level we can cite; rather than fabricate them, this
 * entry leans on qualitative deployment patterns, pitfalls, and a rich
 * `whatNext` — which is the right shape for an early/emerging archetype.
 *
 * Review cadence: re-verify all sources and `lastReviewed` on the first of
 * each quarter, or when Oracle CloudWorld / Oracle quarterly earnings add new
 * agent disclosures.
 */

import type { InitiativeArchetype } from '../types';

export const oracleAiAgentsArchetype: InitiativeArchetype = {
  archetypeKey: 'oracle_ai_agents',
  label: 'Oracle AI Agents (Fusion Cloud Applications)',
  category: 'ai-erp',
  definition:
    'Oracle AI Agents are a family of more than 50 role- and task-specific generative-AI agents announced for Oracle Fusion Cloud Applications across ERP, HCM, SCM, and CX. Oracle positions the agents as embedded inside the existing Fusion application surfaces (not a separate console) and bundled into the existing Fusion subscription, with the Oracle Cloud Infrastructure (OCI) generative-AI service as the underlying model substrate.',

  adoptionMetrics: [
    {
      metric: 'announced_agent_count_at_cloudworld_2024',
      range: {
        label: 'planning-range',
        low: 50,
        high: 50,
        unit: 'AI agents announced across Fusion Cloud Applications',
        cohort: 'Oracle CloudWorld 2024 keynote announcement scope',
        sampleSize: 0,
        source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
        date: '2024-09',
      },
    },
    {
      metric: 'oracle_fusion_cloud_applications_customers',
      range: {
        label: 'planning-range',
        low: 37_000,
        high: 37_000,
        unit: 'Fusion Cloud Applications customers (denominator for any agent rollout)',
        cohort: 'Oracle disclosed Fusion Cloud customer count as cited at CloudWorld 2024 keynote',
        sampleSize: 0,
        source: 'Oracle CloudWorld 2024 keynote — Larry Ellison',
        date: '2024-09',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'embedded-in-existing-fusion-surfaces',
      description:
        'Oracle\'s positioning is that AI Agents are embedded inside the existing Fusion Cloud Application surfaces — ERP, HCM, SCM, and CX — rather than served from a separate "AI console". The intent is that a Fusion user encounters agent assistance inside the workflow they already use; the agent is not a separate destination.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced — no published adoption figure',
        cohort: 'Oracle CloudWorld 2024 announcement audience',
        sampleSize: 0,
        source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
        date: '2024-09',
      },
      source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
      date: '2024-09',
    },
    {
      pattern: 'role-specific-agents-across-erp-hcm-scm-cx',
      description:
        'The 50+ announced agents are role- and task-specific (e.g., supplier recommendations in Procurement, expense entry in Financials, candidate insights in HCM, contract drafting in CX). Each agent is tied to an existing Fusion role and persona rather than a generic chat surface.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'announced — no published adoption figure',
        cohort: 'Oracle CloudWorld 2024 announcement scope (50+ agents)',
        sampleSize: 0,
        source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
        date: '2024-09',
      },
      source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
      date: '2024-09',
    },
    {
      pattern: 'oci-generative-ai-as-substrate',
      description:
        'OCI Generative AI Service is the model substrate. Oracle positions agent inference as running inside OCI — same trust boundary as the customer\'s Fusion tenant — rather than calling out to third-party model providers.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'substrate — not separately adopted',
        cohort: 'Oracle Fusion Cloud Applications customer base',
        sampleSize: 0,
        source: 'Oracle newsroom — OCI Generative AI Service (general availability announcement)',
        date: '2024-01',
      },
      source: 'Oracle newsroom — OCI Generative AI Service (general availability announcement)',
      date: '2024-01',
    },
    {
      pattern: 'bundled-pricing-no-separate-sku',
      description:
        'Oracle\'s public pitch is that the AI agents are included in the existing Fusion Cloud subscription — there is no separate AI SKU to negotiate. This is a deliberate contrast to competitors that price AI agents per-seat on top of the base subscription.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'pricing posture — no published per-tenant figure',
        cohort: 'Oracle Fusion Cloud Applications subscription cohort',
        sampleSize: 0,
        source: 'Oracle CloudWorld 2024 keynote — Larry Ellison commentary on AI bundled into Fusion',
        date: '2024-09',
      },
      source: 'Oracle CloudWorld 2024 keynote — Larry Ellison',
      date: '2024-09',
    },
  ],

  trendDirection: {
    direction: 'early',
    six_month_signal:
      'Oracle moves the announced agent set from CloudWorld-2024-disclosed into the customer GA wave, cohort by cohort across ERP, HCM, SCM, and CX. Customer references shift from beta-program logos to named production deployments; published adoption metrics begin to appear in Oracle quarterly earnings commentary.',
    named_driver:
      'Oracle CloudWorld 2024 keynote announcing 50+ generative-AI agents embedded across Fusion Cloud Applications, with OCI Generative AI as the model substrate and bundled pricing.',
    source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
    date: '2024-09',
  },

  commonPitfalls: [
    {
      name: 'agent-coverage-uneven-across-modules-in-early-releases',
      description:
        'The 50+ announced agents are not uniformly mature across ERP, HCM, SCM, and CX. Customers planning a Fusion-wide rollout should expect maturity differences cohort by cohort; treating the 50+ number as uniform coverage understates implementation work in less-mature modules.',
      source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
      date: '2024-09',
    },
    {
      name: 'audit-trail-and-explainability-gaps-in-early-agent-decisions',
      description:
        'Oracle\'s public materials describe OCI as the trust substrate but do not publish a full schema for per-decision agent audit trails (which model, which retrieval, which policy fired, which Fusion objects were read). Customers in regulated industries (financial services, healthcare, public sector) should treat audit-trail depth as a buying-cycle question, not an assumed capability.',
    },
    {
      name: 'change-management-on-existing-fusion-workflows',
      description:
        'Because Oracle\'s positioning is "embedded in the surfaces users already use", agent suggestions appear directly inside flows that Fusion users have run unchanged for years. Without explicit change-management — clear "agent did this, you can override" UX and an approver retraining loop — early pilots see low acceptance and erode trust before agents reach steady state.',
    },
    {
      name: 'bundled-pricing-obscures-true-cost-conversation',
      description:
        'Oracle\'s "bundled into Fusion subscription" pitch is favorable in deal structures but obscures the real per-tenant inference cost (OCI Generative AI compute, retrieval, audit storage). CIOs evaluating Oracle agents alongside competitors should still build a unit-economics model — bundled pricing does not mean zero marginal cost.',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'enterprises running Oracle Fusion Cloud Applications',
      metric: 'oracle_fusion_cloud_applications_customers',
      range: {
        label: 'planning-range',
        low: 37_000,
        high: 37_000,
        unit: 'Fusion Cloud Applications customers (denominator)',
        cohort: 'Oracle disclosed Fusion Cloud customer count as cited at CloudWorld 2024 keynote',
        sampleSize: 0,
        source: 'Oracle CloudWorld 2024 keynote — Larry Ellison',
        date: '2024-09',
      },
    },
  ],

  whatNext: [
    {
      name: 'agent-coverage-fills-out-across-erp-hcm-scm-cx',
      description:
        'The announced 50+ agents move from CloudWorld 2024 disclosure into customer GA cohort by cohort. The next twelve months are about Oracle reaching parity coverage across ERP, HCM, SCM, and CX rather than announcing a second wave of net-new agents.',
      adoptionStatus: 'early-pilots',
      source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
      date: '2024-09',
    },
    {
      name: 'agent-audit-trail-and-governance-controls-formalize',
      description:
        'Oracle publishes a formal per-decision audit-trail and admin governance model for the Fusion AI agents — the prerequisite for regulated-industry adoption at scale. Customers in financial services, healthcare, and public sector should expect to require this before production rollout.',
      adoptionStatus: 'early-pilots',
    },
    {
      name: 'agent-disclosure-in-oracle-quarterly-earnings-commentary',
      description:
        'Oracle quarterly earnings calls begin to disclose customer counts and named production deployments for Fusion AI agents (rather than just total Cloud Applications revenue). This is the leading signal that the agents have crossed from announcement into measurable customer traction.',
      adoptionStatus: 'early-pilots',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'At Oracle CloudWorld 2024, Oracle announced more than 50 generative-AI agents embedded across Fusion Cloud Applications spanning ERP, HCM, SCM, and CX.',
      source: 'Oracle newsroom — "Oracle Announces Generative AI Agents for Fusion Applications" (Oracle CloudWorld 2024)',
      date: '2024-09',
      url: 'https://www.oracle.com/news/announcement/oracle-announces-generative-ai-agents-for-fusion-applications-2024-09-10/',
    },
    {
      claim:
        'Oracle positions the AI agents as embedded inside the existing Fusion application surfaces and included in the existing Fusion Cloud subscription, with OCI Generative AI as the underlying model substrate.',
      source: 'Oracle CloudWorld 2024 keynote — Larry Ellison',
      date: '2024-09',
      url: 'https://www.oracle.com/cloudworld/',
    },
    {
      claim:
        'OCI Generative AI Service is Oracle\'s managed generative-AI inference platform — the substrate Oracle\'s Fusion AI agents run on.',
      source: 'Oracle newsroom — OCI Generative AI Service (general availability announcement)',
      date: '2024-01',
      url: 'https://www.oracle.com/news/announcement/oci-generative-ai-service-now-generally-available-2024-01-23/',
    },
    {
      claim:
        'Oracle has publicly cited 37,000+ Fusion Cloud Applications customers as the denominator for its applications strategy at CloudWorld 2024 — the relevant denominator for any agent rollout analysis.',
      source: 'Oracle CloudWorld 2024 keynote — Larry Ellison',
      date: '2024-09',
      url: 'https://www.oracle.com/cloudworld/',
    },
  ],

  lastReviewed: '2026-05-30',
};
