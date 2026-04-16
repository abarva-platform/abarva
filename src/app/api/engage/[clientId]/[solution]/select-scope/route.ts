import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DATA_REQUEST_TEMPLATES: Record<
  string,
  Array<{
    file_requested: string
    why_needed: string
    what_it_unlocks: string
    three_number_alternative: string
    priority: string
  }>
> = {
  middle_office: [
    {
      file_requested: 'Settlement failure log (12 months, Excel/CSV)',
      why_needed:
        'Settlement failure rate of ~2% vs 0.8% benchmark visible from public data. Cost breakdown and FTE will give precise recovery range.',
      what_it_unlocks: 'STP automation ROI — typically $2–5M for a firm your size',
      three_number_alternative:
        '1) Monthly settlement volume  2) Current failure rate %  3) FTE hours spent on fails per month',
      priority: 'high',
    },
    {
      file_requested: 'Reconciliation breaks by type and age',
      why_needed:
        'AIM vs Aladdin reconciliation gap is visible. Break count and age quantifies automation opportunity.',
      what_it_unlocks: 'Reconciliation automation business case — typically $0.5–1.5M',
      three_number_alternative:
        '1) Average daily break count  2) Average age to resolve (days)  3) FTE dedicated to breaks',
      priority: 'high',
    },
    {
      file_requested: 'Client reporting production schedule and FTE',
      why_needed: 'To model the offshore + automation case for client reporting.',
      what_it_unlocks: 'Reporting automation ROI — typically $1–4M depending on volume',
      three_number_alternative:
        '1) Monthly reports produced  2) FTE hours per report  3) % currently manual vs automated',
      priority: 'medium',
    },
  ],
  fee_yield: [
    {
      file_requested: 'Revenue by strategy (3 years, quarterly)',
      why_needed:
        'Performance fee decline from $82M to $48M visible in P&L. Need strategy-level breakdown to see where compression is worst.',
      what_it_unlocks:
        'Fee compression root cause and pricing optimisation opportunity — typically $8–16M',
      three_number_alternative:
        '1) Revenue from performance fees last 12 months  2) AUM in fee-bearing strategies  3) Average management fee rate %',
      priority: 'high',
    },
    {
      file_requested: 'Fee schedule by client tier (anonymised)',
      why_needed:
        'Fee yield analysis by client size — smallest clients often overprice, largest underprice relative to relationship cost.',
      what_it_unlocks: 'Client segmentation and fee optimisation — typically $3–8M',
      three_number_alternative:
        '1) Number of clients by AUM tier  2) Average fee rate by tier  3) Average relationship cost by tier',
      priority: 'medium',
    },
  ],
  ai_portfolio: [
    {
      file_requested: 'AI initiative tracker with budget and status (current)',
      why_needed:
        'We have the summary from ARC-M02. The detailed initiative-level view will let us sequence rationalisation and identify quick wins.',
      what_it_unlocks:
        'Precise rationalisation sequence — which 3 initiatives to shut, which 5 to fund',
      three_number_alternative:
        '1) Count of initiatives with no output in 6+ months  2) Total spend on those initiatives  3) CDO hire target timeline',
      priority: 'high',
    },
  ],
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  const { clientId, solution } = await params
  const body = await req.json()
  const { focus_areas, selected_by } = body as {
    focus_areas: string[]
    selected_by: string
  }

  if (!focus_areas || !Array.isArray(focus_areas) || focus_areas.length === 0) {
    return NextResponse.json({ error: 'focus_areas is required and must be a non-empty array' }, { status: 400 })
  }

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
  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
  }

  // Insert scope selections
  const scopeRows = focus_areas.map((focus_area: string) => ({
    engagement_id: engagement.id,
    focus_area,
    selected_by,
    selected_at: new Date().toISOString(),
  }))

  const { data: scopeSelections, error: scopeErr } = await supabase
    .from('engagement_scope')
    .insert(scopeRows)
    .select()

  if (scopeErr) {
    return NextResponse.json({ error: scopeErr.message }, { status: 500 })
  }

  // Build data request rows from templates
  const dataRequestRows: Array<Record<string, unknown>> = []
  for (const focus_area of focus_areas) {
    const templates = DATA_REQUEST_TEMPLATES[focus_area] ?? []
    for (const tpl of templates) {
      dataRequestRows.push({
        engagement_id: engagement.id,
        focus_area,
        file_requested: tpl.file_requested,
        why_needed: tpl.why_needed,
        what_it_unlocks: tpl.what_it_unlocks,
        three_number_alternative: tpl.three_number_alternative,
        priority: tpl.priority,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }
  }

  let dataRequests: unknown[] = []
  if (dataRequestRows.length > 0) {
    const { data: drData, error: drErr } = await supabase
      .from('data_requests')
      .insert(dataRequestRows)
      .select()

    if (drErr) {
      return NextResponse.json({ error: drErr.message }, { status: 500 })
    }
    dataRequests = drData ?? []
  }

  return NextResponse.json({ scope_selections: scopeSelections, data_requests: dataRequests })
}
