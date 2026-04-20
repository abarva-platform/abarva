import {
  APEX_ENTERPRISE_SEED,
  FIRSTCAPITAL_ENTERPRISE_SEED,
  MERIDIAN_ENTERPRISE_SEED,
} from './packj-client-seeds'

export type SupportedPackJClient = 'meridian' | 'firstcapital' | 'apex'

export interface PackJContradictionSeed {
  severity: 'high' | 'medium' | 'low'
  contradiction_type: 'cost_vs_adoption' | 'value_vs_adoption' | 'value_vs_baseline' | 'risk_vs_value' | 'risk_vs_data' | 'shadow_ai' | 'stalled' | 'cost_trajectory'
  description: string
  suggested_action: string
  evidence_refs: string[]
  /**
   * Prat-tuned so-what framing. Rendered prominently on Tower cards + /home
   * alert rows. Include the bottom-line impact — dollars + owner + % eliminable
   * — so the reader instantly knows why this contradiction matters.
   */
  impact?: {
    one_liner: string
    monthly_total_usd?: number
    eliminable_usd_annual?: number
    eliminable_pct?: number
    owner_named?: boolean
    confidence?: 'high' | 'medium' | 'low'
  }
}

export interface PackJCostCenterSeed {
  name: string
  monthly_amount_usd: number
  spend_category: 'labor_internal' | 'labor_contract' | 'software_license' | 'cloud_infra' | 'services' | 'hardware'
  leader_name: string
  run_vs_change_pct: number
}

export const PACK_J_SHADOW_INVENTORY = {
  meridian: MERIDIAN_ENTERPRISE_SEED.shadow_ai_inventory,
  firstcapital: FIRSTCAPITAL_ENTERPRISE_SEED.shadow_ai_inventory,
  apex: APEX_ENTERPRISE_SEED.shadow_ai_inventory,
} as const

export const PACK_J_ACTIVE_PROJECTS = {
  meridian: MERIDIAN_ENTERPRISE_SEED.active_ai_projects,
  firstcapital: FIRSTCAPITAL_ENTERPRISE_SEED.active_ai_projects,
  apex: APEX_ENTERPRISE_SEED.active_ai_projects,
} as const

export const PACK_J_CONTRADICTIONS: Record<SupportedPackJClient, PackJContradictionSeed[]> = {
  meridian: [
    {
      severity: 'high',
      contradiction_type: 'cost_vs_adoption',
      description: 'Abridge is running at $340K per month with 78% adoption in East and Central, while Nuance DAX is running at $138K per month with 62% adoption in West. The regional split was driven by separate sponsors with no single enterprise owner.',
      suggested_action: 'Run a regional ambient documentation consolidation decision and quantify the savings from standardizing on one platform.',
      evidence_refs: ['Abridge contract summary', 'Nuance DAX regional rollout metrics', 'Epic provider time-stamp data'],
      impact: {
        one_liner: 'Abridge + Nuance DAX regional overlap · $478K/mo combined, no consolidation owner named, likely 30–40% eliminable with a single-platform decision.',
        monthly_total_usd: 478_000,
        eliminable_usd_annual: 1_900_000,
        eliminable_pct: 33,
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'high',
      contradiction_type: 'cost_vs_adoption',
      description: 'Abridge, Nuance DAX, and Nabla are all deployed or lightly piloted for ambient documentation. Three overlapping vendors are solving the same documentation job with no portfolio owner reconciling terms or value.',
      suggested_action: 'Create a single ambient documentation portfolio decision with exit criteria for duplicate vendors.',
      evidence_refs: ['Ambient documentation vendor inventory', 'Regional pilot roster', 'Contract overlap review'],
      impact: {
        one_liner: 'Three ambient-documentation vendors competing for one job · $510K/mo aggregate, 2 of 3 likely exit candidates · $3.6M annualized eliminable.',
        monthly_total_usd: 510_000,
        eliminable_usd_annual: 3_600_000,
        eliminable_pct: 55,
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'high',
      contradiction_type: 'shadow_ai',
      description: 'Sixteen shadow AI findings are now known across clinical, research, finance, marketing, and legal workflows, including multiple PHI-adjacent consumer AI use cases.',
      suggested_action: 'Assign remediation owners to all high-risk shadow AI findings and bring approved use cases into governed enterprise tools.',
      evidence_refs: ['Zscaler network logs', 'Power Platform admin logs', 'Corporate card and invoice trail', 'Named incident report'],
      impact: {
        one_liner: '16 shadow AI findings including PHI-adjacent workflows · governance gap has zero named remediation owner · HIPAA exposure first, $2.1M/year in ungoverned spend second.',
        monthly_total_usd: 175_000,
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'high',
      contradiction_type: 'risk_vs_data',
      description: 'Paige.AI is processing pathology imagery under a BAA, but the data-processing addendum still references a 2023 subprocessor list and has not been refreshed against the current vendor subprocessor roster.',
      suggested_action: 'Refresh the Paige.AI subprocessor review and revalidate the current DPA against Meridian privacy controls.',
      evidence_refs: ['Paige.AI BAA', '2023 DPA addendum', 'Current subprocessor register'],
      impact: {
        one_liner: 'Paige.AI DPA references a 2023 subprocessor list processing PHI · one audit finding away from enforcement action · remediation is 2 weeks of legal time, cost of miss is multi-million.',
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'medium',
      contradiction_type: 'cost_trajectory',
      description: 'AI-related cloud spend across Bedrock, AWS, and Azure OpenAI has grown 1.8x in 12 months, projecting to roughly $2.4M per month within six months if unchecked.',
      suggested_action: 'Implement consumption governance with cost guardrails before the next seat and workload expansion wave.',
      evidence_refs: ['AWS Bedrock invoice trend', 'Azure OpenAI consumption summary', 'Cloud FinOps forecast'],
      impact: {
        one_liner: 'AI cloud spend on pace to $2.4M/mo by Q3 without guardrails · 1.8x growth in 12 months, no consumption attribution · FinOps flag likely turns into a CFO escalation within 90 days.',
        monthly_total_usd: 1_333_000,
        eliminable_usd_annual: 4_200_000,
        eliminable_pct: 26,
        owner_named: false,
        confidence: 'medium',
      },
    },
    {
      severity: 'medium',
      contradiction_type: 'stalled',
      description: 'Chart summarization achieved strong test adoption, but the use case has been paused for 90 days because liability sign-off is still unresolved.',
      suggested_action: 'Drive a legal decision memo so the organization either accepts the workflow with guardrails or stops funding it.',
      evidence_refs: ['Pilot adoption report', 'Legal review backlog', 'Product escalation notes'],
      impact: {
        one_liner: 'Chart summarization stalled 90 days on legal sign-off despite strong pilot adoption · either ship with guardrails or kill the burn · decision cost of ~2 hours of legal time is blocking $140K invested.',
        owner_named: false,
        confidence: 'medium',
      },
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_value',
      description: 'The AI governance committee meets monthly, but 18 of 42 AI use cases have never been reviewed and 4 of those are already in production.',
      suggested_action: 'Backfill governance review on the unreviewed production use cases and require committee review before further scale.',
      evidence_refs: ['Governance committee roster', 'Use case inventory review status'],
      impact: {
        one_liner: 'Governance theater · 18 of 42 AI use cases never reviewed, 4 already in production · committee meets but can\'t name last 3 approvals · F007 pattern active.',
        owner_named: true,
        confidence: 'high',
      },
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_value',
      description: 'Two documented bias incidents occurred in the Paradox AI recruiting workflow in the last four months, but no cross-cohort retraining or escalation was triggered.',
      suggested_action: 'Trigger a bias review and retraining decision before the recruiting assistant expands.',
      evidence_refs: ['HR incident reports', 'Paradox AI screening logs'],
      impact: {
        one_liner: 'Two documented bias incidents in recruiting AI, no retraining triggered · Title VII exposure and brand risk compounding with every additional applicant screened.',
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'low',
      contradiction_type: 'risk_vs_data',
      description: 'Tempus Next is supposed to remain in research-only mode, but Epic audit trails show research credentials are being used by clinical staff for PHI-adjacent workflows.',
      suggested_action: 'Re-scope access controls and separate research-only and clinical-user entitlements immediately.',
      evidence_refs: ['Epic audit trail', 'Tempus Next access logs'],
      impact: {
        one_liner: 'Tempus Next research credentials used for clinical PHI workflows · access-scope violation is straightforward to fix, exposure window is every patient record touched in the interim.',
        owner_named: false,
        confidence: 'high',
      },
    },
  ],
  firstcapital: [
    {
      severity: 'high',
      contradiction_type: 'cost_trajectory',
      description: 'M365 Copilot is projected to rise from $672K to roughly $1.1M per month, while 34% of seats were inactive in the last 30 days.',
      suggested_action: 'Right-size the license base before approving another expansion wave.',
      evidence_refs: ['Microsoft 365 seat report', '30-day active usage export'],
      impact: {
        one_liner: 'M365 Copilot seats $672K/mo growing to $1.1M with 34% inactive · $3.6M/year of ghost seats funding a trajectory no one has defended.',
        monthly_total_usd: 672_000,
        eliminable_usd_annual: 3_600_000,
        eliminable_pct: 34,
        owner_named: false,
        confidence: 'high',
      },
    },
    {
      severity: 'high',
      contradiction_type: 'shadow_ai',
      description: 'Consumer Claude.ai and ChatGPT are being used by quant and research teams for market-sensitive work without governed DPA coverage.',
      suggested_action: 'Shut down consumer AI use for research workflows and move approved users onto enterprise workspaces.',
      evidence_refs: ['Desktop telemetry', 'Consumer AI expense trail', 'Research lead interviews'],
    },
    {
      severity: 'high',
      contradiction_type: 'cost_vs_adoption',
      description: 'Cresta, Observe.AI, and Verint are all still consuming budget in the contact center even though Cresta is the chosen strategic platform.',
      suggested_action: 'Retire the overlapping agent-assist platforms and consolidate contract spend onto the chosen stack.',
      evidence_refs: ['Contact center tooling inventory', 'Legacy contract list'],
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_data',
      description: 'Hebbia is indexing sensitive deal materials, but current residency controls do not enforce the intended US-only boundary by default.',
      suggested_action: 'Apply residency restrictions and revalidate the data-handling controls before expanding the research workspace.',
      evidence_refs: ['Hebbia workspace config', 'DPA residency clause'],
    },
    {
      severity: 'medium',
      contradiction_type: 'value_vs_baseline',
      description: 'Personetics is carrying a 12% deposit-growth claim, but Finance disputes the attribution because the baseline cohort and control methodology are weak.',
      suggested_action: 'Rebuild the baseline and attribution model before using the claim in executive reporting.',
      evidence_refs: ['Personetics value deck', 'Finance attribution review'],
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_value',
      description: 'Fourteen of thirty-four AI use cases have never been reviewed by the AI governance committee, even though the committee has existed for nine months.',
      suggested_action: 'Create a remediation sprint to review all ungoverned AI use cases before additional pilots are approved.',
      evidence_refs: ['Governance committee agenda history', 'AI inventory review status'],
    },
  ],
  apex: [
    {
      severity: 'high',
      contradiction_type: 'cost_vs_adoption',
      description: 'Frontline Copilot is costing $182K per month while only 32% of the 28,000-seat base is active each week.',
      suggested_action: 'Either retrain and relaunch the frontline program or cut inactive seats before scaling further.',
      evidence_refs: ['Microsoft Frontline usage export', 'Seat assignment list'],
    },
    {
      severity: 'high',
      contradiction_type: 'cost_vs_adoption',
      description: 'Bloomreach, Dynamic Yield, and Nosto are all running personalization or recommendation logic with unclear attribution, driving roughly $430K per month of overlap.',
      suggested_action: 'Choose the target personalization architecture and decommission the overlapping stack.',
      evidence_refs: ['Digital experimentation stack inventory', 'Vendor overlap analysis'],
    },
    {
      severity: 'medium',
      contradiction_type: 'shadow_ai',
      description: 'Marketing is using Midjourney at enterprise scale with no formal brand compliance or prompt-governance review.',
      suggested_action: 'Bring marketing image generation into an approved workflow with brand-review controls.',
      evidence_refs: ['Midjourney invoice trend', 'Brand review process gap analysis'],
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_data',
      description: 'Signifyd is receiving customer transaction data, but the subprocessor review is more than a year stale.',
      suggested_action: 'Refresh the Signifyd subprocessor review and revalidate the current PII-sharing controls.',
      evidence_refs: ['Signifyd DPA', 'Subprocessor register'],
    },
    {
      severity: 'medium',
      contradiction_type: 'risk_vs_value',
      description: 'Store-level AI tools are being funded and piloted through line-of-business budgets, but they still do not appear in a central inventory or governance cadence.',
      suggested_action: 'Require every store-level AI tool to enter the central inventory before further rollout decisions.',
      evidence_refs: ['Store operations budget review', 'Central AI inventory gap list'],
    },
  ],
}

export const PACK_J_COST_CENTERS: Record<SupportedPackJClient, PackJCostCenterSeed[]> = {
  meridian: [
    { name: 'LLM APIs', monthly_amount_usd: 1_800_000, spend_category: 'cloud_infra', leader_name: 'VP AI Platform', run_vs_change_pct: 55 },
    { name: 'AI SaaS licenses', monthly_amount_usd: 1_400_000, spend_category: 'software_license', leader_name: 'VP Clinical AI', run_vs_change_pct: 70 },
    { name: 'Copilot seats', monthly_amount_usd: 284_000, spend_category: 'software_license', leader_name: 'SVP Enterprise IT', run_vs_change_pct: 80 },
    { name: 'ML and GPU compute', monthly_amount_usd: 1_900_000, spend_category: 'cloud_infra', leader_name: 'VP Data Platform', run_vs_change_pct: 40 },
    { name: 'Data platform', monthly_amount_usd: 780_000, spend_category: 'software_license', leader_name: 'Chief Data Officer', run_vs_change_pct: 60 },
    { name: 'AI staff augmentation', monthly_amount_usd: 2_100_000, spend_category: 'labor_contract', leader_name: 'Chief Transformation Officer', run_vs_change_pct: 30 },
    { name: 'AI services', monthly_amount_usd: 890_000, spend_category: 'services', leader_name: 'Chief Transformation Officer', run_vs_change_pct: 25 },
    { name: 'Observability and governance', monthly_amount_usd: 180_000, spend_category: 'software_license', leader_name: 'Chief Risk Officer', run_vs_change_pct: 65 },
    { name: 'Unknown and shadow AI', monthly_amount_usd: 180_000, spend_category: 'services', leader_name: 'CIO Office', run_vs_change_pct: 10 },
  ],
  firstcapital: [
    { name: 'LLM and model usage', monthly_amount_usd: 1_050_000, spend_category: 'cloud_infra', leader_name: 'Head of AI Platform', run_vs_change_pct: 50 },
    { name: 'AI SaaS licenses', monthly_amount_usd: 2_150_000, spend_category: 'software_license', leader_name: 'Head of AI Applications', run_vs_change_pct: 72 },
    { name: 'Copilot seats', monthly_amount_usd: 734_000, spend_category: 'software_license', leader_name: 'SVP Enterprise Productivity', run_vs_change_pct: 82 },
    { name: 'Fraud and AML compute', monthly_amount_usd: 1_100_000, spend_category: 'cloud_infra', leader_name: 'Chief Risk Officer', run_vs_change_pct: 45 },
    { name: 'Data platform and governance', monthly_amount_usd: 620_000, spend_category: 'software_license', leader_name: 'Chief Data Officer', run_vs_change_pct: 58 },
    { name: 'AI staff and services', monthly_amount_usd: 1_146_000, spend_category: 'labor_contract', leader_name: 'Chief Transformation Officer', run_vs_change_pct: 35 },
  ],
  apex: [
    { name: 'Copilot seats', monthly_amount_usd: 323_000, spend_category: 'software_license', leader_name: 'SVP Enterprise IT', run_vs_change_pct: 80 },
    { name: 'Personalization and search stack', monthly_amount_usd: 1_020_000, spend_category: 'software_license', leader_name: 'Chief Digital Officer', run_vs_change_pct: 72 },
    { name: 'Forecasting and pricing stack', monthly_amount_usd: 1_120_000, spend_category: 'software_license', leader_name: 'Chief Merchandising Officer', run_vs_change_pct: 60 },
    { name: 'Fraud and contact center AI', monthly_amount_usd: 328_000, spend_category: 'software_license', leader_name: 'Chief Customer Officer', run_vs_change_pct: 68 },
    { name: 'Model and cloud usage', monthly_amount_usd: 460_000, spend_category: 'cloud_infra', leader_name: 'VP Data Platform', run_vs_change_pct: 48 },
    { name: 'AI staff and services', monthly_amount_usd: 949_000, spend_category: 'labor_contract', leader_name: 'Chief Transformation Officer', run_vs_change_pct: 30 },
  ],
}
