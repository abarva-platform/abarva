import { buildBaseShadowInventory, buildClientPortfolioUseCases, buildProjectsFromPackJ, getClientProfileLine } from './_shared/packj-build'
import type { PackJClientSeed } from './_shared/packj-types'
import { assertAllowedVendorProducts, assertNoForbiddenClientNames } from './_shared/vendor-whitelist'

const EXTRA_SHADOW_AI = [
  {
    sequence: 35,
    what_happening: 'Branch operations leaders are using ChatGPT Plus to draft customer remediation messages for service issues.',
    vendor_product: 'ChatGPT Plus',
    discovered_via: 'Service communications audit',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 36,
    what_happening: 'Retail banking operations is piloting unsanctioned Copilot Studio workflows for branch knowledge routing.',
    vendor_product: 'Microsoft Copilot Studio',
    discovered_via: 'Power Platform tenant review',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 37,
    what_happening: 'Compliance analysts are using Harvey self-serve trials to summarize policy updates outside approved environments.',
    vendor_product: 'Harvey AI',
    discovered_via: 'IT intake ticket',
    risk_level: 'HIGH' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 38,
    what_happening: 'Corporate communications uses Jasper personal workspaces for executive messaging drafts.',
    vendor_product: 'Jasper',
    discovered_via: 'Expense report review',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 39,
    what_happening: 'Operations analysts maintain unapproved Notion AI workspaces to summarize audit and control findings.',
    vendor_product: 'Notion AI',
    discovered_via: 'Browser extension inventory',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 40,
    what_happening: 'Wealth advisors are using Claude.ai consumer to draft client prep notes ahead of review meetings.',
    vendor_product: 'Claude.ai consumer',
    discovered_via: 'Desktop telemetry',
    risk_level: 'HIGH' as const,
    is_demo_data: true as const,
  },
]

const PROJECT_MILESTONES: Record<string, string> = {
  'Advisor copilot expansion': 'Complete Salesforce FSC integration and move the next 180 advisors into production.',
  'M365 Copilot full deployment': 'Remove inactive seats and lock the steady-state license baseline.',
  'Fraud platform consolidation (Feedzai vs internal ML vs SAS)': 'Decide the target fraud stack and retire at least one overlapping model path.',
  'AML investigator workbench': 'Release the first investigator copilot workflow into regulated pilot.',
  'Mortgage AI expansion': 'Extend automated document extraction to 60% of funded applications.',
  'Contact center transformation': 'Finish quality calibration for Cresta and retire legacy agent-assist overlap.',
  'Harvey legal rollout': 'Expand from legal core team into compliance contract review workflows.',
  'KYC automation': 'Reach production decision for retail-banking onboarding with Socure integration complete.',
  'Alternative data platform': 'Approve the first governed alternative-data use cases for research teams.',
  'AI governance program': 'Publish the model review standard and risk register for all in-flight AI use cases.',
  'Data platform AI-readiness (Snowflake Cortex)': 'Deliver governed semantic objects for fraud, AML, and advisor workflows.',
  'Engineering productivity (Copilot + Devin pilot + Codeium eval)': 'Finalize the coding-assistant standard and shut down duplicate evaluations.',
  'Shadow AI discovery': 'Assign remediation owners to all high-risk consumer-tool usage findings.',
}

const portfolioUseCases = buildClientPortfolioUseCases('firstcapital')
const shadowAiInventory = [...buildBaseShadowInventory('firstcapital'), ...EXTRA_SHADOW_AI]
const activeAiProjects = buildProjectsFromPackJ('firstcapital', PROJECT_MILESTONES)

assertNoForbiddenClientNames('First Capital Pack J extras', shadowAiInventory.map(item => item.what_happening))
assertAllowedVendorProducts('First Capital Pack J extras', shadowAiInventory.map(item => item.vendor_product))

export const FIRSTCAPITAL_ENTERPRISE_SEED: PackJClientSeed = {
  client_key: 'firstcapital',
  client_name: 'First Capital Financial',
  profile: getClientProfileLine('firstcapital'),
  portfolio_use_cases: portfolioUseCases,
  shadow_ai_inventory: shadowAiInventory,
  active_ai_projects: activeAiProjects,
}
