import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ARCTURUS_MARGIN_LEVERS = [
  {
    id: 'ai_portfolio',
    category: 'AI Portfolio',
    lever: 'AI portfolio reorientation — $94M committed, $0 ROI',
    opportunity_min_m: 94,
    opportunity_max_m: 94,
    genome_confidence: 0.89,
    status: 'analysed',
    data_required: [],
    key_finding:
      '$94M committed. 28 initiatives. Zero verified return. CDO vacancy is the governance failure.',
    wave: 1,
  },
  {
    id: 'cdo_vacancy',
    category: 'AI Portfolio',
    lever: 'CDO hire — unblocks 14 AI initiatives',
    opportunity_min_m: 18,
    opportunity_max_m: 32,
    genome_confidence: 0.84,
    status: 'analysed',
    data_required: [],
    key_finding:
      'Single hire. Highest leverage decision. Unblocks $18–32M of stalled AI value.',
    wave: 1,
  },
  {
    id: 'consulting_spend',
    category: 'IT Cost',
    lever: 'Consulting spend reduction — $42M, 24% KT score',
    opportunity_min_m: 16,
    opportunity_max_m: 28,
    genome_confidence: 0.84,
    status: 'analysed',
    data_required: [],
    key_finding:
      'Replace 4 of 10 vendors with Maestros. KT score 24% means 76% of knowledge leaves on departure.',
    wave: 1,
  },
  {
    id: 'bloomberg_aim',
    category: 'IT Cost',
    lever: 'Bloomberg AIM overpay — $8.4M vs $2.1M peer median',
    opportunity_min_m: 4,
    opportunity_max_m: 8,
    genome_confidence: 0.78,
    status: 'analysed',
    data_required: [],
    key_finding:
      '4× peer median maintenance cost. Three modernisation attempts have failed — all vendor-led.',
    wave: 2,
  },
  {
    id: 'it_overspend',
    category: 'IT Cost',
    lever: 'IT budget structural overspend — 4.2% vs 3.1% peers',
    opportunity_min_m: 14,
    opportunity_max_m: 22,
    genome_confidence: 0.76,
    status: 'analysed',
    data_required: [],
    key_finding:
      '$178M above peer benchmark annually. Driven by vendor contracts not renegotiated and contractor permanence.',
    wave: 2,
  },
  {
    id: 'middle_office_stp',
    category: 'Middle Office',
    lever: 'Settlement STP automation',
    opportunity_min_m: 2,
    opportunity_max_m: 5,
    genome_confidence: 0.78,
    status: 'genome_estimate',
    data_required: ['Settlement failure log (12 months)', 'Reconciliation breaks by type'],
    key_finding: null,
    wave: 2,
  },
  {
    id: 'client_reporting',
    category: 'Middle Office',
    lever: 'Client reporting automation',
    opportunity_min_m: 1,
    opportunity_max_m: 4,
    genome_confidence: 0.72,
    status: 'genome_estimate',
    data_required: ['Reporting FTE count and process time', 'Client report production schedule'],
    key_finding: null,
    wave: 2,
  },
  {
    id: 'fee_yield',
    category: 'Revenue',
    lever: 'Fee yield analysis by strategy',
    opportunity_min_m: 8,
    opportunity_max_m: 16,
    genome_confidence: 0.68,
    status: 'genome_estimate',
    data_required: ['Revenue by strategy (3 years)', 'Fee schedule by client tier'],
    key_finding: null,
    wave: 2,
  },
  {
    id: 'client_retention',
    category: 'Revenue',
    lever: 'Client retention and AUM attrition',
    opportunity_min_m: null,
    opportunity_max_m: null,
    genome_confidence: null,
    status: 'unlock_required',
    data_required: ['Client AUM flows (quarterly, 3 years)', 'Redemption reasons log'],
    key_finding: null,
    wave: 3,
  },
  {
    id: 'kyc_aml_ops',
    category: 'Operations',
    lever: 'KYC/AML operations automation',
    opportunity_min_m: null,
    opportunity_max_m: null,
    genome_confidence: null,
    status: 'unlock_required',
    data_required: ['KYC process FTE and cycle time', 'AML alert volume and false positive rate'],
    key_finding: null,
    wave: 3,
  },
  {
    id: 'fund_accounting',
    category: 'Operations',
    lever: 'Fund accounting efficiency',
    opportunity_min_m: null,
    opportunity_max_m: null,
    genome_confidence: null,
    status: 'unlock_required',
    data_required: ['Fund accounting FTE by function', 'NAV calculation errors and rework'],
    key_finding: null,
    wave: 3,
  },
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  const { clientId, solution } = await params

  // Find engagement
  const { data: engagement, error: engErr } = await supabase
    .from('engagements')
    .select('id')
    .eq('client_id', clientId)
    .eq('solution', solution)
    .maybeSingle()

  if (engErr) {
    return NextResponse.json({ error: engErr.message }, { status: 500 })
  }

  // Fall back to hardcoded levers if no engagement found
  if (!engagement) {
    return NextResponse.json(buildResponse(ARCTURUS_MARGIN_LEVERS))
  }

  // Get margin_opportunity_status records
  const { data: records, error: recErr } = await supabase
    .from('margin_opportunity_status')
    .select('*')
    .eq('engagement_id', engagement.id)

  if (recErr) {
    return NextResponse.json({ error: recErr.message }, { status: 500 })
  }

  // Fall back to hardcoded if no records exist yet
  if (!records || records.length === 0) {
    return NextResponse.json(buildResponse(ARCTURUS_MARGIN_LEVERS))
  }

  return NextResponse.json(buildResponse(records))
}

function buildResponse(levers: Array<Record<string, unknown>>) {
  const analysed = levers.filter((l) => l.status === 'analysed')
  const estimates = levers.filter((l) => l.status === 'genome_estimate')

  const sum = (arr: Array<Record<string, unknown>>, key: string) =>
    arr.reduce((s, l) => s + ((l[key] as number) ?? 0), 0)

  return {
    levers,
    analysed_total_min_m: sum(analysed, 'opportunity_min_m'),
    analysed_total_max_m: sum(analysed, 'opportunity_max_m'),
    estimate_total_min_m: sum(estimates, 'opportunity_min_m'),
    estimate_total_max_m: sum(estimates, 'opportunity_max_m'),
  }
}
