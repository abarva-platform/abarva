import { NextRequest, NextResponse } from 'next/server'

// Hardcoded Genome-powered vendor intelligence per track
// Later: query live Genome database for real scores

const VENDOR_DATA: Record<string, {
  vendors: {
    name: string
    category: string
    genome_score: number
    delivery_track_record: { engagements: number; on_time_pct: number; avg_overrun_pct: number; kt_score: number }
    strengths: string[]
    watch_outs: string[]
    recommended: boolean
    rationale: string
  }[]
  recommendation: string
  confidence: number
  source: string
}> = {

  core_system: {
    vendors: [
      {
        name: 'ION Group',
        category: 'product',
        genome_score: 71,
        delivery_track_record: { engagements: 34, on_time_pct: 58, avg_overrun_pct: 42, kt_score: 31 },
        strengths: ['Deep capital markets domain', 'Proven OMS replacement for buy-side', 'FIX protocol native'],
        watch_outs: ['Implementation drags 18-24 months average', 'KT score 31% — knowledge stays with ION', 'Customisation cost escalates post-go-live'],
        recommended: false,
        rationale: 'Genome flags F001 pattern (vendor dependency without capability transfer) in 61% of ION implementations. Viable product — governance model must prevent knowledge lock-in.'
      },
      {
        name: 'SS&C Advent',
        category: 'product',
        genome_score: 79,
        delivery_track_record: { engagements: 28, on_time_pct: 68, avg_overrun_pct: 28, kt_score: 44 },
        strengths: ['Strong portfolio accounting lineage', 'Better KT than ION historically', 'Modular — phased adoption possible'],
        watch_outs: ['Compliance modules lag regulatory updates', 'US-centric support model', 'Data migration complexity underestimated in 40% of deals'],
        recommended: true,
        rationale: 'Highest genome score in peer set. KT score 44% is above category average. Phased architecture reduces delivery risk vs big-bang ION approach.'
      },
      {
        name: 'TCS Financial Solutions',
        category: 'si',
        genome_score: 64,
        delivery_track_record: { engagements: 47, on_time_pct: 52, avg_overrun_pct: 56, kt_score: 22 },
        strengths: ['Scale — can staff large programmes quickly', 'Low day rate vs Tier 1 SIs', 'Capital markets practice exists'],
        watch_outs: ['F001 confirmed: KT score 22% across financial services', 'F008 pattern (scope creep) in 71% of deals over 12 months', 'Offshore model creates communication overhead'],
        recommended: false,
        rationale: 'Genome flags both F001 and F008 for TCS financial services engagements. Scale is their advantage — not quality of knowledge transfer.'
      },
      {
        name: 'Accenture Capital Markets',
        category: 'si',
        genome_score: 68,
        delivery_track_record: { engagements: 31, on_time_pct: 61, avg_overrun_pct: 38, kt_score: 35 },
        strengths: ['Strong regulatory knowledge (MiFID, EMIR)', 'Executive relationships at product vendors', 'Change management capability'],
        watch_outs: ['Charge-out rates highest in category', 'Partner-led sell, analyst-led deliver', 'Conflict of interest: they also sell product licences'],
        recommended: false,
        rationale: 'Higher KT score than TCS but conflict of interest risk — Accenture holds vendor partnerships that create incentive misalignment. AbarVa recommends independent SI.'
      }
    ],
    recommendation: 'SS&C Advent as product replacement with an independent boutique SI (not TCS or Accenture). AbarVa governs KT throughout. ION viable if governance model is enforced.',
    confidence: 84,
    source: 'ARC-T01'
  },

  erp: {
    vendors: [
      {
        name: 'SAP S/4HANA',
        category: 'product',
        genome_score: 66,
        delivery_track_record: { engagements: 89, on_time_pct: 41, avg_overrun_pct: 62, kt_score: 29 },
        strengths: ['Market leader — deep partner ecosystem', 'Regulatory compliance built-in', 'Strong in manufacturing and financial services'],
        watch_outs: ['F008 pattern in 74% of SAP deals (scope creep)', 'Average overrun 62% — worst in ERP category', 'RISE migration often re-sold as innovation, rarely delivers'],
        recommended: false,
        rationale: 'Highest Genome failure rate in ERP category. Overrun pattern is structural — SAP deals grow via change requests. Only viable with hard scope lock and external governance.'
      },
      {
        name: 'Oracle Fusion Cloud',
        category: 'product',
        genome_score: 72,
        delivery_track_record: { engagements: 61, on_time_pct: 54, avg_overrun_pct: 41, kt_score: 33 },
        strengths: ['Strong financials module', 'Better cloud-native architecture than SAP', 'Faster quarterly release cycle'],
        watch_outs: ['Customisation complexity underestimated', 'Integration layer (OIC) adds hidden cost', 'Support quality drops post go-live'],
        recommended: true,
        rationale: 'Best genome score in ERP peer set. Overrun rate 41% vs SAP 62%. Stronger for finance-led organisations. Requires AbarVa governance to contain customisation creep.'
      },
      {
        name: 'Workday Financial Management',
        category: 'product',
        genome_score: 77,
        delivery_track_record: { engagements: 44, on_time_pct: 62, avg_overrun_pct: 31, kt_score: 41 },
        strengths: ['Best-in-class HCM integration', 'Fastest time-to-value in category', 'Highest KT score — community-driven approach'],
        watch_outs: ['Financials module less mature than HR/Planning', 'Limited manufacturing / supply chain depth', 'Workday-only SI ecosystem creates dependency'],
        recommended: true,
        rationale: 'Highest KT score (41%) and lowest overrun rate (31%) in category. Genome confirms better delivery outcomes. Best fit if HCM is a parallel priority.'
      },
      {
        name: 'Deloitte (ERP SI)',
        category: 'si',
        genome_score: 69,
        delivery_track_record: { engagements: 52, on_time_pct: 57, avg_overrun_pct: 44, kt_score: 32 },
        strengths: ['Deep regulatory and audit knowledge', 'Cross-functional (tax, legal, technology)', 'Strong programme governance tooling'],
        watch_outs: ['Partner conflict: also audits client in some cases', 'Senior talent scarce on long programmes', 'Day rate premium 40% above mid-tier SIs'],
        recommended: false,
        rationale: 'Strong governance capability but audit relationship creates conflict risk. KT score below category average for a Tier 1 SI.'
      }
    ],
    recommendation: 'Workday for HCM-led transformation; Oracle Fusion for finance-led. Both require independent SI (not Deloitte or SAP-aligned partners). AbarVa governs scope and KT throughout.',
    confidence: 79,
    source: 'ERP-G01'
  },

  cloud_advisory: {
    vendors: [
      {
        name: 'AWS',
        category: 'product',
        genome_score: 81,
        delivery_track_record: { engagements: 104, on_time_pct: 71, avg_overrun_pct: 22, kt_score: 48 },
        strengths: ['Deepest capital markets service set (FinSpace, SageMaker)', 'Best-in-class data lake architecture', 'Strongest compliance certifications (FCA, SEC)'],
        watch_outs: ['Cost management complexity — egress fees surprise CFOs', 'Vendor lock-in risk via proprietary services', 'Support tiers aggressive — Enterprise support mandatory at scale'],
        recommended: true,
        rationale: 'Highest genome score for financial services cloud migrations. KT score 48% — AWS training investment is genuine. Cost architecture must be designed upfront.'
      },
      {
        name: 'Microsoft Azure',
        category: 'product',
        genome_score: 74,
        delivery_track_record: { engagements: 87, on_time_pct: 65, avg_overrun_pct: 29, kt_score: 43 },
        strengths: ['M365 + Azure integration reduces friction', 'Power Platform for rapid internal tooling', 'Hybrid cloud strongest in category'],
        watch_outs: ['Licensing complexity — EA deals require expert negotiation', 'AI services (Copilot) oversold vs delivered', 'Support quality inconsistent outside US'],
        recommended: true,
        rationale: 'Strong choice if M365 already in estate — integration value is real. Hybrid architecture (on-prem + cloud) is genuinely best-in-class. Licensing must be negotiated hard.'
      },
      {
        name: 'Google Cloud Platform',
        category: 'product',
        genome_score: 67,
        delivery_track_record: { engagements: 43, on_time_pct: 59, avg_overrun_pct: 35, kt_score: 39 },
        strengths: ['BigQuery for analytics workloads — best in class', 'Vertex AI for ML pipelines', 'Competitive pricing on compute'],
        watch_outs: ['Enterprise support model less mature than AWS/Azure', 'Financial services go-to-market less developed', 'Product deprecation history creates risk (Stadia, Domains)'],
        recommended: false,
        rationale: 'Strong for analytics-heavy workloads. Genome flags support gaps for financial services at scale. Viable for specific workloads — not recommended as primary cloud.'
      },
      {
        name: 'Cognizant Cloud Practice',
        category: 'si',
        genome_score: 65,
        delivery_track_record: { engagements: 38, on_time_pct: 55, avg_overrun_pct: 41, kt_score: 27 },
        strengths: ['Scale — large programme staffing capability', 'Financial services vertical practice', 'Competitive rates vs Tier 1'],
        watch_outs: ['F001 confirmed: KT score 27% for cloud migrations', 'Architecture decisions often not documented', 'Offshore model creates design-to-delivery gap'],
        recommended: false,
        rationale: 'KT score below acceptable threshold. Architecture knowledge does not transfer. Cloud engagements create same dependency pattern as on-prem consulting. Not recommended.'
      }
    ],
    recommendation: 'AWS primary for capital markets workloads; Azure where M365 integration creates real value. Avoid single-cloud lock — design for portability. AbarVa governs architecture decisions throughout.',
    confidence: 76,
    source: 'CLOUD-A01'
  },

  all: {
    vendors: [
      {
        name: 'Comprehensive Assessment',
        category: 'product',
        genome_score: 75,
        delivery_track_record: { engagements: 0, on_time_pct: 0, avg_overrun_pct: 0, kt_score: 0 },
        strengths: ['Full picture across all three tracks'],
        watch_outs: ['Run individual track analyses for detailed vendor scores'],
        recommended: true,
        rationale: 'Select a specific track (Core System, ERP, or Cloud) to see detailed vendor scoring.'
      }
    ],
    recommendation: 'Select a specific track to see Genome-powered vendor recommendations for that workstream.',
    confidence: 75,
    source: 'Genome'
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; solution: string }> }
) {
  try {
    const { clientId, solution } = await params
    const body = await request.json()
    const { track = 'core_system', engagementId } = body

    // Only for tech solution
    if (solution !== 'tech') {
      return NextResponse.json({ error: 'Vendor Intelligence only available for Tech solution' }, { status: 400 })
    }

    const data = VENDOR_DATA[track] || VENDOR_DATA['core_system']

    // Build client profile from known data
    const clientProfile = {
      industry: clientId === 'arcturus' ? 'Asset Management' : 'Healthcare',
      revenue_m: clientId === 'arcturus' ? 2800 : 1200,
      complexity: 'high' as const,
      cloud_readiness: clientId === 'arcturus' ? 34 : 41,
      current_estate: clientId === 'arcturus'
        ? ['SQL Server 2012 DW', 'Bloomberg AIM', 'Salesforce FSC', 'Custom risk engine']
        : ['SAP ECC 6.0', 'Epic EHR', 'Azure SQL', 'Legacy data warehouse']
    }

    return NextResponse.json({
      track,
      client_id: clientId,
      engagement_id: engagementId,
      client_profile: clientProfile,
      vendors: data.vendors,
      recommendation: data.recommendation,
      confidence: data.confidence,
      source: data.source,
      scored_at: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
