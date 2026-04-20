import { buildBaseShadowInventory, buildClientPortfolioUseCases, buildProjectsFromPackJ, getClientProfileLine } from './_shared/packj-build'
import type { PackJClientSeed } from './_shared/packj-types'
import { assertAllowedVendorProducts, assertNoForbiddenClientNames } from './_shared/vendor-whitelist'

const EXTRA_SHADOW_AI = [
  {
    sequence: 30,
    what_happening: 'Store planners are using ChatGPT Plus to draft district labor and markdown notes outside approved channels.',
    vendor_product: 'ChatGPT Plus',
    discovered_via: 'Expense review',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 31,
    what_happening: 'Field HR partners are trialing Notion AI to prepare store-manager coaching summaries.',
    vendor_product: 'Notion AI',
    discovered_via: 'Browser extension inventory',
    risk_level: 'LOW' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 32,
    what_happening: 'Supply chain planners are using Microsoft Copilot Studio to prototype inbound exception bots without governance review.',
    vendor_product: 'Microsoft Copilot Studio',
    discovered_via: 'Power Platform admin report',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
  {
    sequence: 33,
    what_happening: 'Digital commerce analysts are using Claude.ai consumer to summarize campaign and assortment performance.',
    vendor_product: 'Claude.ai consumer',
    discovered_via: 'Desktop telemetry',
    risk_level: 'MEDIUM' as const,
    is_demo_data: true as const,
  },
]

const PROJECT_MILESTONES: Record<string, string> = {
  'Personalization platform consolidation': 'Select the target personalization stack and begin retiring duplicate experimentation flows.',
  'Pricing AI expansion': 'Complete rollout into 48 categories and lock operating model with merchandising.',
  'Store operations AI': 'Move from 40 stores to the first regional deployment wave.',
  'Moveworks deployment': 'Expand employee coverage from pilot group to the full corporate and district population.',
  'Supply chain digital twin': 'Publish the first DC and inbound-lane twin with weekly planning cadence.',
  'Returns intelligence rollout': 'Scale from pilot stores to the first 200-store rollout.',
  'Loss prevention expansion': 'Validate shrink reduction in pilot stores before funding the next region.',
  'Marketing AI stack (content + campaign)': 'Create governed workflow for Jasper and Anthropic usage before expansion.',
  'Demand forecasting accuracy program': 'Close the next forecast-improvement release with planning leadership signoff.',
  'Agentic customer service (Sierra eval)': 'Finish vendor evaluation and decide whether to enter controlled pilot.',
  'Frontline Copilot scale': 'Reduce inactive seats and finish the next store-operations training wave.',
}

const portfolioUseCases = buildClientPortfolioUseCases('apex')
const shadowAiInventory = [...buildBaseShadowInventory('apex'), ...EXTRA_SHADOW_AI]
const activeAiProjects = buildProjectsFromPackJ('apex', PROJECT_MILESTONES)

assertNoForbiddenClientNames('Apex Pack J extras', shadowAiInventory.map(item => item.what_happening))
assertAllowedVendorProducts('Apex Pack J extras', shadowAiInventory.map(item => item.vendor_product))

export const APEX_ENTERPRISE_SEED: PackJClientSeed = {
  client_key: 'apex',
  client_name: 'Apex Retail Group',
  profile: getClientProfileLine('apex'),
  portfolio_use_cases: portfolioUseCases,
  shadow_ai_inventory: shadowAiInventory,
  active_ai_projects: activeAiProjects,
}
