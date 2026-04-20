import { buildBaseShadowInventory, buildClientPortfolioUseCases, buildProjectsFromPackJ, getClientProfileLine } from './_shared/packj-build'
import type { PackJClientSeed } from './_shared/packj-types'
import { assertAllowedVendorProducts, assertNoForbiddenClientNames } from './_shared/vendor-whitelist'

const EXTRA_SHADOW_AI = [
  {
    sequence: 43,
    what_happening: 'Students and residents are using ChatGPT Plus on personal devices to summarize rotation notes and board-style questions.',
    vendor_product: 'ChatGPT Plus',
    discovered_via: 'Medical education survey + traffic sample',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 44,
    what_happening: 'Offshore DevOps contractors are using personal Codeium accounts to draft infrastructure scripts against Meridian runbooks.',
    vendor_product: 'Codeium',
    discovered_via: 'VPN session review',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 45,
    what_happening: 'Finance operations created unsanctioned Copilot Studio flows to answer supply and labor variance questions.',
    vendor_product: 'Microsoft Copilot Studio',
    discovered_via: 'Power Platform admin logs',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 46,
    what_happening: 'Incident log shows Dr. Elena Markham using ChatGPT Plus to draft rare-disease differential summaries outside the approved workflow.',
    vendor_product: 'ChatGPT Plus',
    discovered_via: 'Named incident report',
    risk_level: 'HIGH' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 47,
    what_happening: 'Data science team members are using Claude.ai consumer workspaces for rapid model-experiment notebooks.',
    vendor_product: 'Claude.ai consumer',
    discovered_via: 'Corporate card trail',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 48,
    what_happening: 'Marketing operations built unreviewed patient-campaign automations with Zapier AI.',
    vendor_product: 'Zapier AI',
    discovered_via: 'Invoice review',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 49,
    what_happening: 'Legal operations is trialing DocuSign AI Navigator to summarize contracting language without approved governance review.',
    vendor_product: 'DocuSign AI Navigator',
    discovered_via: 'Legal ops software request',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
]

const PROJECT_MILESTONES: Record<string, string> = {
  'Abridge scale to full provider base': 'Finalize regional standard decision and onboard the remaining provider cohorts.',
  'Prior auth AI expansion (5 specialties)': 'Complete oncology and neurology workflow validation before systemwide go-live.',
  'AI governance program': 'Approve the enterprise AI policy and publish the risk review intake process.',
  'Revenue cycle AI consolidation': 'Retire duplicate denial workbenches and lock the target-state tooling mix.',
  'Ambient nursing deployment': 'Finish nursing documentation pilot evaluation and approve scale funding.',
  'M365 Copilot full rollout': 'Remove inactive seats and complete the final corporate training wave.',
  'Claims triage copilot (Claude-based)': 'Validate recovery attribution and productionize the workflow in revenue operations.',
  'Patient portal AI': 'Reach East-region quality threshold and decide on full-system expansion.',
  'Sepsis model validation': 'Close clinical validation package and determine which hospitals move into production.',
  'Interpreter assist expansion': 'Add three more hospitals and verify documented patient-access gains.',
  'Radiology AI consolidation': 'Choose the target imaging triage stack and publish decommission plan for overlaps.',
  'Shadow AI discovery + governance': 'Assign remediation owners to all high-risk findings and close PHI exposure gaps.',
  'Data platform modernization (Snowflake + AI-ready)': 'Complete governed semantic layer for clinical and finance data.',
  'Clinical data quality program': 'Resolve duplicate patient identity backlog and publish first quality scorecard.',
}

const portfolioUseCases = buildClientPortfolioUseCases('meridian')
const shadowAiInventory = [...buildBaseShadowInventory('meridian'), ...EXTRA_SHADOW_AI]
const activeAiProjects = buildProjectsFromPackJ('meridian', PROJECT_MILESTONES)

assertNoForbiddenClientNames('Meridian Pack J extras', shadowAiInventory.map(item => item.what_happening))
assertAllowedVendorProducts('Meridian Pack J extras', shadowAiInventory.map(item => item.vendor_product))

export const MERIDIAN_ENTERPRISE_SEED: PackJClientSeed = {
  client_key: 'meridian',
  client_name: 'Meridian Health System',
  profile: getClientProfileLine('meridian'),
  portfolio_use_cases: portfolioUseCases,
  shadow_ai_inventory: shadowAiInventory,
  active_ai_projects: activeAiProjects,
}
