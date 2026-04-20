import type { ActiveAiProject, EnterprisePortfolioUseCase, EnterpriseUseCaseStatus, ShadowAiFinding, ShadowAiRiskLevel } from './packj-types'
import {
  extractHeadingBlock,
  getPackJClientSection,
  inferPhaseFromPercent,
  PackJClientKey,
  parseBudgetToUsd,
  parseCurrencyToUsd,
  parseLeadingPercent,
  parseMarkdownTable,
  parsePercentValue,
  parsePhaseDescriptor,
  type ParsedMarkdownRow,
} from './packj-parser'
import { assertAllowedVendorProducts, assertNoForbiddenClientNames } from './vendor-whitelist'

function getRowValue(row: ParsedMarkdownRow, candidates: string[]) {
  for (const key of candidates) {
    if (row[key]) return row[key]
  }
  return ''
}

function toUseCase(
  row: ParsedMarkdownRow,
  status: EnterpriseUseCaseStatus,
): EnterprisePortfolioUseCase {
  const name = getRowValue(row, ['name', 'project'])
  const vendorProduct = getRowValue(row, ['vendor_product', 'vendor_product_', 'vendor', 'vendor_product_stage'])
  const monthlyCostUsd = parseCurrencyToUsd(getRowValue(row, ['monthly_cost', 'monthly_cost_']))
  const verifiedValue = getRowValue(row, ['verified_value', 'verified_value_', 'why', 'status'])
  const stageText = getRowValue(row, ['stage'])
  const scope = getRowValue(row, ['providers_users', 'scope', 'users', 'status'])
  const contradiction = getRowValue(row, ['contradiction'])
  const whyStalled = getRowValue(row, ['why_stalled', 'why'])
  const nextMilestone = getRowValue(row, ['next_milestone'])

  return {
    sequence: Number(row['#'] || row['']),
    name,
    vendor_product: vendorProduct,
    status,
    scope_or_users: scope || undefined,
    adoption_pct: parseLeadingPercent(getRowValue(row, ['adoption'])) || undefined,
    monthly_cost_usd: monthlyCostUsd,
    verified_value_text: verifiedValue && !/^—$/.test(verifiedValue) ? verifiedValue : undefined,
    value_unverified: status === 'research' || /unverified/i.test(verifiedValue) || verifiedValue === '—',
    why_stalled: whyStalled || (status === 'stalled' ? stageText || undefined : undefined),
    contradiction: contradiction || undefined,
    next_milestone: nextMilestone || (status === 'scaling_pilot' || status === 'pilot' ? stageText || undefined : undefined),
    is_demo_data: true,
  }
}

function toShadowFinding(row: ParsedMarkdownRow): ShadowAiFinding {
  return {
    sequence: Number(row['#'] || row['']),
    what_happening: getRowValue(row, ['what_s_happening', 'what']),
    vendor_product: getRowValue(row, ['vendor', 'vendor_product']),
    discovered_via: getRowValue(row, ['discovered_via']) || 'Internal review',
    risk_level: (getRowValue(row, ['risk']).split('—')[0].trim() || 'MEDIUM') as ShadowAiRiskLevel,
    is_demo_data: true,
  }
}

function toProject(
  row: ParsedMarkdownRow,
  nextMilestone: string,
  explicitPhase?: { phase_current: number; phase_total: number },
): ActiveAiProject {
  const pctComplete = parsePercentValue(getRowValue(row, ['complete', 'phase', 'phase_']))
  const phase = explicitPhase || inferPhaseFromPercent(pctComplete)

  return {
    name: getRowValue(row, ['project']),
    vendor_ecosystem: getRowValue(row, ['vendor_ecosystem', 'vendor']),
    budget_usd: parseBudgetToUsd(getRowValue(row, ['budget'])),
    phase_current: phase.phase_current,
    phase_total: phase.phase_total,
    pct_complete: pctComplete,
    next_milestone: nextMilestone,
    is_demo_data: true,
  }
}

export function buildClientPortfolioUseCases(clientKey: PackJClientKey) {
  const section = getPackJClientSection(clientKey)

  const production = parseMarkdownTable(section, '### In production').map(row => toUseCase(row, 'production'))
  const scaling = parseMarkdownTable(section, '### In scaling').map(row => toUseCase(row, 'scaling_pilot'))
  const stalled = parseMarkdownTable(section, '### Stalled').map(row => toUseCase(row, 'stalled'))
  const research = parseMarkdownTable(section, '### Research').map(row => toUseCase(row, 'research'))
  const shadow = parseMarkdownTable(section, '### Shadow AI').map(row => toUseCase(row, 'shadow'))

  const useCases = [...production, ...scaling, ...stalled, ...research, ...shadow]

  assertNoForbiddenClientNames(`${clientKey} portfolio use cases`, useCases.flatMap(item => [item.name, item.vendor_product]))
  assertAllowedVendorProducts(`${clientKey} portfolio use cases`, useCases.map(item => item.vendor_product))

  return useCases
}

export function buildBaseShadowInventory(clientKey: PackJClientKey) {
  const section = getPackJClientSection(clientKey)
  const findings = parseMarkdownTable(section, '### Shadow AI').map(toShadowFinding)

  assertNoForbiddenClientNames(`${clientKey} shadow AI inventory`, findings.flatMap(item => [item.what_happening, item.vendor_product]))
  assertAllowedVendorProducts(`${clientKey} shadow AI inventory`, findings.map(item => item.vendor_product))

  return findings
}

export function buildProjectsFromPackJ(
  clientKey: PackJClientKey,
  nextMilestones: Record<string, string>,
) {
  const section = getPackJClientSection(clientKey)
  const rows = parseMarkdownTable(section, '## Active AI projects')

  const projects = rows.map(row => {
    const projectName = getRowValue(row, ['project'])
    const nextMilestone = nextMilestones[projectName]
    if (!nextMilestone) {
      throw new Error(`Missing next milestone for ${clientKey} project "${projectName}"`)
    }

    const explicitPhase = row.phase ? parsePhaseDescriptor(row.phase) : undefined
    return toProject(row, nextMilestone, explicitPhase)
  })

  assertNoForbiddenClientNames(`${clientKey} active projects`, projects.flatMap(item => [item.name, item.vendor_ecosystem, item.next_milestone]))
  assertAllowedVendorProducts(`${clientKey} active projects`, projects.map(item => item.vendor_ecosystem))

  return projects
}

export function getClientProfileLine(clientKey: PackJClientKey) {
  const section = getPackJClientSection(clientKey)
  const profileLine = extractHeadingBlock(section, `# Client`)
    .split('\n')
    .find(line => line.startsWith('**Profile:**'))

  if (!profileLine) {
    throw new Error(`Unable to find profile line for ${clientKey}`)
  }

  return profileLine.replace('**Profile:**', '').trim()
}
