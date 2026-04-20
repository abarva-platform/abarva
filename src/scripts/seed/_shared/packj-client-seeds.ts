import { APEX_ENTERPRISE } from '../apex-enterprise'
import { FIRSTCAPITAL_ENTERPRISE } from '../firstcapital-enterprise'
import { MERIDIAN_ENTERPRISE } from '../meridian-enterprise'
import { CLIENT_DATA } from './enterprise-data'
import type { ProjectSeed } from './enterprise-data'
import type { UseCaseSeed } from './types'
import type {
  ActiveAiProject,
  EnterprisePortfolioUseCase,
  EnterpriseUseCaseStatus,
  PackJClientSeed,
  ShadowAiFinding,
  ShadowAiRiskLevel,
} from './packj-types'
import {
  assertAllowedVendorProducts,
  assertNoForbiddenClientNames,
} from './vendor-whitelist'

type PackJClientKey = 'meridian' | 'firstcapital' | 'apex'

function toPortfolioStatus(useCase: UseCaseSeed): EnterpriseUseCaseStatus {
  if (useCase.shadow) return 'shadow'

  switch (useCase.stage) {
    case 'realize':
      return 'production'
    case 'execute':
    case 'evidence':
    case 'review':
      return 'scaling_pilot'
    case 'stalled':
      return 'stalled'
    case 'design':
    case 'qualify':
    case 'idea':
    default:
      return 'research'
  }
}

function monthlyCost(useCase: UseCaseSeed): number | undefined {
  if (!useCase.cost) return undefined

  const total =
    useCase.cost.llm +
    useCase.cost.compute +
    useCase.cost.storage +
    useCase.cost.license +
    useCase.cost.integration

  return total > 0 ? total : undefined
}

function valueText(useCase: UseCaseSeed): string | undefined {
  if (!useCase.value) return undefined
  return `${useCase.value.metric}: ${useCase.value.observed}/${useCase.value.target} ${useCase.value.unit}`
}

function toPortfolioUseCase(useCase: UseCaseSeed, sequence: number): EnterprisePortfolioUseCase {
  const status = toPortfolioStatus(useCase)

  return {
    sequence,
    name: useCase.name,
    vendor_product: useCase.vendor,
    status,
    scope_or_users: useCase.usage?.dau
      ? `${useCase.usage.dau} DAU`
      : useCase.scope === 'enterprise'
        ? 'Enterprise'
        : useCase.scope === 'department'
          ? 'Department'
          : 'Single workflow',
    adoption_pct: useCase.usage?.penetration_pct,
    monthly_cost_usd: monthlyCost(useCase),
    verified_value_text: valueText(useCase),
    value_unverified: !useCase.value || status === 'research',
    why_stalled: status === 'stalled' ? useCase.description : undefined,
    contradiction: useCase.risk?.governance === 'pending'
      ? 'Governance approval pending'
      : undefined,
    next_milestone: status === 'scaling_pilot'
      ? 'Complete pilot evidence review and readiness checkpoint'
      : status === 'research'
        ? 'Confirm sponsor, scope, and baseline'
        : undefined,
    is_demo_data: true,
  }
}

function shadowRiskFromUseCase(useCase: UseCaseSeed): ShadowAiRiskLevel {
  const level = useCase.risk?.risk_level ?? 'medium'
  return level.toUpperCase() as ShadowAiRiskLevel
}

function toShadowFinding(useCase: UseCaseSeed, sequence: number): ShadowAiFinding {
  return {
    sequence,
    what_happening: useCase.name.replace(/^Shadow ·\s*/, ''),
    vendor_product: useCase.vendor,
    discovered_via: 'Admin telemetry + invoice review',
    risk_level: shadowRiskFromUseCase(useCase),
    is_demo_data: true,
  }
}

function inferPhase(progressPct: number) {
  if (progressPct >= 85) return { phase_current: 4, phase_total: 4 }
  if (progressPct >= 60) return { phase_current: 3, phase_total: 4 }
  if (progressPct >= 35) return { phase_current: 2, phase_total: 4 }
  return { phase_current: 1, phase_total: 4 }
}

function nextMilestoneForProject(project: ProjectSeed): string {
  switch (project.status) {
    case 'completed':
      return 'Capture realized value and operating baseline'
    case 'stabilizing':
      return 'Exit stabilization with production KPI review'
    case 'in_flight':
      return 'Complete current workstream and readiness review'
    case 'approved':
      return 'Mobilize delivery team and confirm baseline measures'
    case 'paused':
      return 'Resolve gating blocker and restart governance review'
    case 'cancelled':
      return 'Archive lessons learned and close vendor obligations'
    case 'ideation':
    default:
      return 'Confirm sponsor, target scope, and budget guardrails'
  }
}

function vendorEcosystemForProject(project: ProjectSeed): string {
  const words = project.description
    .replace(/[()]/g, '')
    .split(/[^A-Za-z0-9.+-]+/)
    .filter(Boolean)
  const candidates = words.slice(0, 4).join(' ')
  return candidates || 'Internal delivery stack'
}

function toActiveProject(project: ProjectSeed): ActiveAiProject {
  const pctComplete = Math.max(
    0,
    Math.min(100, Math.round((project.spent_to_date_usd / project.total_budget_usd) * 100)),
  )
  const phase = inferPhase(pctComplete)

  return {
    name: project.name,
    vendor_ecosystem: vendorEcosystemForProject(project),
    budget_usd: project.total_budget_usd,
    phase_current: phase.phase_current,
    phase_total: phase.phase_total,
    pct_complete: pctComplete,
    next_milestone: nextMilestoneForProject(project),
    is_demo_data: true,
  }
}

const EXTRA_SHADOW_FINDINGS: Record<PackJClientKey, Omit<ShadowAiFinding, 'sequence'>[]> = {
  meridian: [
    { what_happening: 'Cursor in research bioinformatics scripts', vendor_product: 'Cursor', discovered_via: 'Endpoint package scan', risk_level: 'MEDIUM', is_demo_data: true },
    { what_happening: 'Codeium on contractor engineering laptops', vendor_product: 'Codeium', discovered_via: 'IDE plugin inventory', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Notion AI in nursing education content creation', vendor_product: 'Notion AI', discovered_via: 'SaaS admin review', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Zapier AI moving patient-adjacent scheduling data', vendor_product: 'Zapier AI', discovered_via: 'Procurement invoice review', risk_level: 'HIGH', is_demo_data: true },
    { what_happening: 'DocuSign AI Navigator in legal contract redlines', vendor_product: 'DocuSign AI Navigator', discovered_via: 'Legal tooling review', risk_level: 'MEDIUM', is_demo_data: true },
    { what_happening: 'Jasper in foundation and fundraising messaging', vendor_product: 'Jasper', discovered_via: 'Marketing software audit', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Microsoft Copilot Studio departmental bot trial', vendor_product: 'Microsoft Copilot Studio', discovered_via: 'Power Platform admin logs', risk_level: 'MEDIUM', is_demo_data: true },
  ],
  firstcapital: [
    { what_happening: 'Cursor in quant research workstations', vendor_product: 'Cursor', discovered_via: 'Engineering IDE inventory', risk_level: 'HIGH', is_demo_data: true },
    { what_happening: 'Codeium on investment analytics notebooks', vendor_product: 'Codeium', discovered_via: 'Developer plugin inventory', risk_level: 'MEDIUM', is_demo_data: true },
    { what_happening: 'DocuSign AI Navigator in paralegal redlining', vendor_product: 'DocuSign AI Navigator', discovered_via: 'Legal ops review', risk_level: 'MEDIUM', is_demo_data: true },
    { what_happening: 'Zapier AI connecting retail-banking workflows', vendor_product: 'Zapier AI', discovered_via: 'SaaS purchase review', risk_level: 'HIGH', is_demo_data: true },
    { what_happening: 'Notion AI used for strategy memos', vendor_product: 'Notion AI', discovered_via: 'Workspace admin export', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Persado trial on unmanaged marketing tenant', vendor_product: 'Persado', discovered_via: 'MarTech contract review', risk_level: 'MEDIUM', is_demo_data: true },
  ],
  apex: [
    { what_happening: 'Persado trial in CRM messaging', vendor_product: 'Persado', discovered_via: 'CRM admin review', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Constructor.io merchandising experiment', vendor_product: 'Constructor.io', discovered_via: 'Digital experimentation review', risk_level: 'MEDIUM', is_demo_data: true },
    { what_happening: 'Shopify Magic used in merchandising copy workflows', vendor_product: 'Shopify Magic', discovered_via: 'Shopify admin review', risk_level: 'LOW', is_demo_data: true },
    { what_happening: 'Notion AI in frontline training materials', vendor_product: 'Notion AI', discovered_via: 'Workspace app inventory', risk_level: 'LOW', is_demo_data: true },
  ],
}

function buildShadowInventory(
  clientKey: PackJClientKey,
  useCases: UseCaseSeed[],
): ShadowAiFinding[] {
  const base = useCases
    .filter((useCase) => useCase.shadow)
    .map((useCase, index) => toShadowFinding(useCase, index + 1))
  const extras = EXTRA_SHADOW_FINDINGS[clientKey].map((item, index) => ({
    ...item,
    sequence: base.length + index + 1,
  }))

  const combined = [...base, ...extras]
  assertNoForbiddenClientNames(
    `${clientKey} shadow inventory`,
    combined.flatMap((item) => [item.what_happening, item.vendor_product]),
  )
  assertAllowedVendorProducts(
    `${clientKey} shadow inventory`,
    combined.map((item) => item.vendor_product),
  )
  return combined
}

function buildClientSeed(
  clientKey: PackJClientKey,
  clientName: string,
  useCases: UseCaseSeed[],
): PackJClientSeed {
  const portfolio = useCases.map((useCase, index) => toPortfolioUseCase(useCase, index + 1))
  const shadowInventory = buildShadowInventory(clientKey, useCases)
  const projects = CLIENT_DATA[clientName].projects
    .filter((project) => project.touches_ai)
    .map(toActiveProject)

  assertNoForbiddenClientNames(
    `${clientKey} portfolio`,
    portfolio.flatMap((item) => [item.name, item.vendor_product]),
  )
  assertAllowedVendorProducts(
    `${clientKey} portfolio`,
    portfolio.map((item) => item.vendor_product),
  )

  return {
    client_key: clientKey,
    client_name: clientName,
    profile: clientName,
    portfolio_use_cases: portfolio,
    shadow_ai_inventory: shadowInventory,
    active_ai_projects: projects,
  }
}

export const MERIDIAN_ENTERPRISE_SEED = buildClientSeed(
  'meridian',
  'Meridian Health',
  MERIDIAN_ENTERPRISE.useCases,
)

export const FIRSTCAPITAL_ENTERPRISE_SEED = buildClientSeed(
  'firstcapital',
  'First Capital',
  FIRSTCAPITAL_ENTERPRISE.useCases,
)

export const APEX_ENTERPRISE_SEED = buildClientSeed(
  'apex',
  'Apex Retail',
  APEX_ENTERPRISE.useCases,
)

