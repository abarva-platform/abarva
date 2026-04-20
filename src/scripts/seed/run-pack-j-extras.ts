import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseClients } from './run-enterprise'
import {
  PACK_J_ACTIVE_PROJECTS,
  PACK_J_CONTRADICTIONS,
  PACK_J_COST_CENTERS,
  PACK_J_SHADOW_INVENTORY,
  type SupportedPackJClient,
} from './_shared/packj-extras-data'
import { findVendorEntryByProduct } from './_shared/vendor-whitelist'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv()

const CLIENT_KEY_TO_NAME: Record<SupportedPackJClient, string> = {
  meridian: 'Meridian Health',
  firstcapital: 'First Capital',
  apex: 'Apex Retail',
}

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env missing')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function monthStart(base: Date, offsetMonths: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + offsetMonths, 1)
  return d.toISOString().slice(0, 10)
}

function annualizedShadowCost(productName: string): number | null {
  const vendor = findVendorEntryByProduct(productName)
  if (!vendor) return null
  const [minMonthly, maxMonthly] = vendor.typical_monthly_range_enterprise
  return Math.round(((minMonthly + maxMonthly) / 2) * 12)
}

function criticalityFromRisk(riskLevel: string): 'tier1' | 'tier2' | 'tier3' {
  if (riskLevel === 'HIGH') return 'tier1'
  if (riskLevel === 'MEDIUM') return 'tier2'
  return 'tier3'
}

async function lookupClientId(sb: SupabaseClient, clientName: string) {
  const { data, error } = await sb.from('clients').select('id').eq('name', clientName).maybeSingle()
  if (error) throw new Error(`Client lookup failed for ${clientName}: ${error.message}`)
  return (data as { id: string } | null)?.id ?? null
}

async function seedShadowInventory(sb: SupabaseClient, clientId: string, clientKey: SupportedPackJClient) {
  await sb
    .from('applications')
    .delete()
    .eq('client_id', clientId)
    .eq('business_function', 'Shadow AI')
    .eq('is_demo_data', true)

  const rows = PACK_J_SHADOW_INVENTORY[clientKey].map((finding) => ({
    client_id: clientId,
    name: finding.what_happening,
    vendor: finding.vendor_product,
    deployment_model: 'saas' as const,
    business_function: 'Shadow AI',
    user_count: null,
    annual_cost_usd: annualizedShadowCost(finding.vendor_product),
    criticality: criticalityFromRisk(finding.risk_level),
    status: 'active' as const,
    ai_enabled: true,
    is_demo_data: true,
  }))

  if (rows.length === 0) return 0
  const { error } = await sb.from('applications').insert(rows)
  if (error) throw new Error(`applications insert failed: ${error.message}`)
  return rows.length
}

async function seedContradictions(sb: SupabaseClient, clientId: string, clientKey: SupportedPackJClient) {
  await sb.from('contradictions').delete().eq('client_id', clientId)

  const rows = PACK_J_CONTRADICTIONS[clientKey].map((item) => ({
    client_id: clientId,
    contradiction_type: item.contradiction_type,
    severity: item.severity,
    description: item.description,
    suggested_action: item.suggested_action,
    evidence: { refs: item.evidence_refs, source: 'pack_j_seed' },
  }))

  if (rows.length === 0) return 0
  const { error } = await sb.from('contradictions').insert(rows)
  if (error) throw new Error(`contradictions insert failed: ${error.message}`)
  return rows.length
}

async function seedCostBreakdown(sb: SupabaseClient, clientId: string, clientKey: SupportedPackJClient) {
  await sb.from('spend_breakdown').delete().eq('client_id', clientId).eq('is_demo_data', true)
  await sb.from('cost_centers').delete().eq('client_id', clientId).eq('is_demo_data', true)

  const today = new Date()
  const currentMonthIndex = today.getMonth() + 1
  const centers = PACK_J_COST_CENTERS[clientKey]

  const centerRows = centers.map((center) => ({
    client_id: clientId,
    name: center.name,
    annual_budget_usd: center.monthly_amount_usd * 12,
    spent_ytd_usd: center.monthly_amount_usd * currentMonthIndex,
    run_vs_change_pct: center.run_vs_change_pct,
    leader_name: center.leader_name,
    is_demo_data: true,
  }))

  const { data: insertedCenters, error: centerError } = await sb
    .from('cost_centers')
    .insert(centerRows)
    .select('id,name')
  if (centerError) throw new Error(`cost_centers insert failed: ${centerError.message}`)

  const centerIds = new Map(
    ((insertedCenters as Array<{ id: string; name: string }> | null) ?? []).map((row) => [row.name, row.id]),
  )

  const spendRows = centers.flatMap((center) =>
    Array.from({ length: 12 }, (_, index) => ({
      client_id: clientId,
      cost_center_id: centerIds.get(center.name) ?? null,
      category: center.spend_category,
      month: monthStart(today, -11 + index),
      amount_usd: center.monthly_amount_usd,
      is_demo_data: true,
    })),
  )

  if (spendRows.length === 0) {
    return { centers: centerRows.length, spendRows: 0 }
  }

  const { error: spendError } = await sb.from('spend_breakdown').insert(spendRows)
  if (spendError) throw new Error(`spend_breakdown insert failed: ${spendError.message}`)

  return { centers: centerRows.length, spendRows: spendRows.length }
}

async function enrichAiProjects(sb: SupabaseClient, clientId: string, clientKey: SupportedPackJClient) {
  const projects = PACK_J_ACTIVE_PROJECTS[clientKey]
  let updated = 0

  for (const project of projects) {
    const metaLine = `AI meta · vendor ecosystem: ${project.vendor_ecosystem}; phase: ${project.phase_current}/${project.phase_total}; completion: ${project.pct_complete}%; next milestone: ${project.next_milestone}.`
    const { data: existing } = await sb
      .from('tech_projects')
      .select('id,description')
      .eq('client_id', clientId)
      .eq('name', project.name)
      .eq('is_demo_data', true)
      .maybeSingle()

    if (!existing) continue

    const row = existing as { id: string; description: string | null }
    const currentDescription = row.description ?? ''
    const nextDescription = currentDescription.includes('AI meta ·')
      ? currentDescription.replace(/AI meta ·.*$/u, metaLine)
      : `${currentDescription}${currentDescription ? ' ' : ''}${metaLine}`

    const { error } = await sb
      .from('tech_projects')
      .update({ description: nextDescription })
      .eq('id', row.id)
    if (error) throw new Error(`tech_projects update failed for "${project.name}": ${error.message}`)
    updated += 1
  }

  return updated
}

export async function runPackJExtras(clientKeys: string[]) {
  const sb = getSb()
  const supportedKeys = clientKeys.filter((key): key is SupportedPackJClient => key in CLIENT_KEY_TO_NAME)

  for (const clientKey of supportedKeys) {
    const clientName = CLIENT_KEY_TO_NAME[clientKey]
    const clientId = await lookupClientId(sb, clientName)
    if (!clientId) {
      console.error(`  ✗ client "${clientName}" not found in clients table`)
      continue
    }

    console.log(`\n▸ ${clientName} · Pack J extras`)
    const shadowCount = await seedShadowInventory(sb, clientId, clientKey)
    console.log(`  ✓ applications · ${shadowCount} shadow AI inventory rows`)

    const contradictionCount = await seedContradictions(sb, clientId, clientKey)
    console.log(`  ✓ contradictions · ${contradictionCount} rows`)

    const { centers, spendRows } = await seedCostBreakdown(sb, clientId, clientKey)
    console.log(`  ✓ cost model · ${centers} cost centers · ${spendRows} monthly spend rows`)

    const enriched = await enrichAiProjects(sb, clientId, clientKey)
    console.log(`  ✓ tech_projects enriched · ${enriched} AI project descriptions`)
  }
}

async function main() {
  await runPackJExtras(parseClients(process.argv))
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isMain) {
  main().catch((error) => {
    console.error('FAILED:', error)
    process.exit(1)
  })
}
