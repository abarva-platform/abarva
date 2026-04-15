export interface Phase0Output {
  overall_score: number
  overall_verdict: 'ready' | 'partial' | 'insufficient'
  verdict_summary: string
  dimension_scores: Record<string, {
    score: number
    evidence: string
    missing_data: string
    what_it_unlocks: string
  }>
  genome_matches: Array<{
    code: string
    name: string
    failure_rate: number
    confidence: 'confirmed' | 'probable' | 'possible'
    evidence: string
    source_files: string[]
  }>
  top_findings: Array<{
    title: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'positive'
    source_files: string[]
    genome_pattern: string | null
  }>
  missing_data: Array<{
    category: string
    what_it_unlocks: string
    priority: 'blocking' | 'important' | 'nice_to_have'
  }>
  recommended_action: string
}

export const ARCTURUS_DELIVERY_PHASE0: Phase0Output = {
  overall_score: 21,
  overall_verdict: 'partial',
  verdict_summary: 'Sufficient data to begin Phase 1 with high confidence. Three Genome patterns confirmed. Delivery velocity data (sprint metrics) would sharpen the cycle time analysis. Financial breakdown would sharpen the recovery range.',

  dimension_scores: {
    consulting_dependency: {
      score: 22,
      evidence: '10 active consulting relationships. £42M annual spend. Average KT score 24%. Wipro KT 15%, Bloomberg LP KT 8%, Google PSO KT 5% (engagement ended with no handover).',
      missing_data: 'Detailed vendor SLA performance actuals',
      what_it_unlocks: 'Precise SLA penalty calculations and renegotiation leverage'
    },
    knowledge_retention: {
      score: 18,
      evidence: 'Knowledge risk scores 55-98 across 10 domains. 5 domains at Critical (>80). Bloomberg AIM customisation logic entirely vendor-owned — 14 customisations, no internal documentation. Google PSO MLOps design walked out when engagement ended.',
      missing_data: 'Internal team competency assessments per squad',
      what_it_unlocks: 'Targeted capability-building programme per squad'
    },
    delivery_performance: {
      score: 31,
      evidence: 'Average cycle time 127 days (OMS squads) against 14-day industry benchmark for equivalent changes. AI/ML Platform squad: 0 deployments in 12 months. OMS squads: vendor-controlled release windows — Bloomberg governs all change cycles.',
      missing_data: 'DORA metrics across all squads, story point data',
      what_it_unlocks: 'Precise cycle time baseline for Phase 3 baseline lock'
    },
    internal_capability: {
      score: 19,
      evidence: '47% contractor and consulting ratio across 14 squads. EA function led by contractor — no permanent owner of architecture decisions. VP Engineering Data: contractor in permanent role. Portfolio Analytics: only squad with genuine internal capability.',
      missing_data: 'Individual capability assessments per squad lead',
      what_it_unlocks: 'Targeted internal hiring plan per Maestro workstream'
    },
    leadership_governance: {
      score: 15,
      evidence: 'CDO vacant 11 months. AI Governance Council not constituted. 14 AI initiatives awaiting governance sign-off. VP Engineering Data is a contractor with no knowledge retention obligation.',
      missing_data: 'Board minutes on AI governance decisions',
      what_it_unlocks: 'Understanding of why CDO role has been vacant 11 months'
    }
  },

  genome_matches: [
    {
      code: 'F001',
      name: 'Vendor dependency without internal capability',
      failure_rate: 0.72,
      confidence: 'confirmed',
      evidence: 'Bloomberg LP engineers own 14 AIM customisations with no internal documentation. Wipro own all Salesforce FSC customisations — internal team cannot deploy without vendor approval. Google PSO engagement ended with 5% KT score — AI/ML platform knowledge has no internal owner.',
      source_files: ['ARC-D01', 'ARC-D02', 'ARC-C01']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'confirmed',
      evidence: 'CDO vacant 11 months. AI Governance Council cannot convene without CDO. 14 AI initiatives blocked — none have an alternative executive sponsor. VP Engineering Data is a contractor with no delivery accountability.',
      source_files: ['ARC-C03', 'ARC-D02']
    },
    {
      code: 'F009',
      name: 'Pilot purgatory',
      failure_rate: 0.76,
      confidence: 'confirmed',
      evidence: 'Google PSO delivered 22% of agreed scope — engagement ended early. McKinsey delivered 55% of agreed deliverables. Both prior consulting engagements failed to deliver. Credibility deficit will make internal stakeholders sceptical of next programme.',
      source_files: ['ARC-D01']
    }
  ],

  top_findings: [
    {
      title: '£42M consulting spend. Average KT score 24%. Knowledge leaves every Friday.',
      description: '10 consulting relationships at £42M annually. The average knowledge transfer score across all vendors is 24% — meaning 76% of what they know walks out when the contract ends. Wipro (KT 15%) and Bloomberg LP (KT 8%) are the most critical.',
      severity: 'critical',
      source_files: ['ARC-D01', 'ARC-D02'],
      genome_pattern: 'F001'
    },
    {
      title: 'Google PSO engagement ended. MLOps design has no internal owner.',
      description: '£3.5M spent. 22% of scope delivered. The AI/ML platform knowledge — what was designed, what decisions were made, what was built — has no internal owner. The AI/ML Platform squad cannot proceed without rebuilding this context from scratch.',
      severity: 'critical',
      source_files: ['ARC-D01', 'ARC-D02'],
      genome_pattern: 'F001'
    },
    {
      title: 'CDO vacant 11 months. AI Governance Council not constituted.',
      description: '14 AI initiatives await CDO governance sign-off. The AI Governance Council cannot convene without a CDO to chair it. This single vacancy is the most expensive unfilled role in the firm — blocking more annual value than the CDO\'s salary costs.',
      severity: 'critical',
      source_files: ['ARC-C03'],
      genome_pattern: 'F002'
    },
    {
      title: 'Portfolio Analytics: the benchmark that proves the rest is fixable.',
      description: 'Portfolio Analytics delivers at or near industry benchmark — highest velocity, lowest cost per story point, genuine internal capability. This proves the problem is not structural to Arcturus. It is specific to squads with high vendor dependency.',
      severity: 'positive',
      source_files: ['ARC-C01', 'ARC-C05'],
      genome_pattern: null
    }
  ],

  missing_data: [
    {
      category: 'Sprint velocity and DORA metrics (all squads)',
      what_it_unlocks: 'Precise cycle time baseline for Phase 3. Exact deployment frequency vs benchmark.',
      priority: 'important'
    },
    {
      category: 'Vendor SLA performance actuals',
      what_it_unlocks: 'Enforceable SLA penalty calculations. Renegotiation leverage per vendor.',
      priority: 'important'
    }
  ],

  recommended_action: 'Begin Phase 1 with the Consulting Audit workstream. The data is sufficient to conduct a full audit of all 10 vendor relationships. Request sprint velocity data from CIO before Phase 1 completes.'
}

export const ARCTURUS_MARGIN_PHASE0: Phase0Output = {
  overall_score: 38,
  overall_verdict: 'partial',
  verdict_summary: 'Sufficient data to identify £250–320M in addressable margin across three confirmed areas. Middle office, fee yield, client retention, and operations require additional uploads to unlock the next £40–80M estimate range.',

  dimension_scores: {
    financial_data_quality: {
      score: 52,
      evidence: 'P&L by business unit loaded (ARC-M01). Cost structure loaded (ARC-M03). AI spend tracker loaded (ARC-M02). Financial statements 2022–2024 loaded. C/I ratio 71% clearly visible. Missing: segment-level fee revenue breakdown, fund-level profitability.',
      missing_data: 'Revenue by strategy (3 years). Fund-level P&L.',
      what_it_unlocks: 'Fee yield analysis by strategy — typically £8–16M for £840B AUM manager.'
    },
    revenue_analysis_readiness: {
      score: 28,
      evidence: 'Performance fees declined from £82M (2023) to £48M (2025) — AUM grew. Fee compression visible but not decomposed by strategy. Client AUM flows not loaded.',
      missing_data: 'Revenue by strategy. Client AUM flows. Fee schedule by tier.',
      what_it_unlocks: 'Client retention analysis. Fee pricing optimisation.'
    },
    cost_structure_visibility: {
      score: 61,
      evidence: 'IT budget 4.2% vs 3.1% peer — £178M overspend. Consulting spend £42M at 24% KT score. Bloomberg AIM maintenance £8.4M vs £2.1M peer. C/I ratio 71% vs 58%. Middle office FTE and process data not loaded.',
      missing_data: 'Settlement failure log. Reconciliation break data. Reporting FTE.',
      what_it_unlocks: 'Middle office automation opportunity — typically £3–9M.'
    },
    ai_roi_tracking: {
      score: 18,
      evidence: '28 AI initiatives. £94M committed. £0 verified ROI. No baseline on any initiative. CDO vacant 11 months — governance absent. CRO blocking new deployments.',
      missing_data: 'Initiative-level detail on blocked vs in-flight. CDO hire timeline.',
      what_it_unlocks: 'Rationalisation sequence — which 3 to shut, which 5 to fund.'
    },
    leadership_accountability: {
      score: 22,
      evidence: 'CDO vacant 11 months. CRO blocking AI approvals. Board commitment to 58% CIR by 2027 with no credible cost programme. No named owner for margin recovery programme.',
      missing_data: 'Board minutes on AI governance. CDO search status.',
      what_it_unlocks: 'Governance structure for margin recovery programme.'
    }
  },

  genome_matches: [
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'confirmed',
      evidence: 'CDO vacant 11 months. £94M AI portfolio has no accountable owner. CRO has blocked further deployments. Board committed to 58% CIR by 2027 — no programme owner to deliver it.',
      source_files: ['ARC-M02', 'ARC-C03']
    },
    {
      code: 'F010',
      name: 'Measurement vacuum',
      failure_rate: 0.79,
      confidence: 'confirmed',
      evidence: '£94M committed across 28 AI initiatives. Zero have a documented baseline. Zero have a measurement framework. Cannot prove ROI to the board, to regulators, or internally.',
      source_files: ['ARC-M02', 'ARC-M01']
    },
    {
      code: 'F012',
      name: 'Structural cost misattribution',
      failure_rate: 0.68,
      confidence: 'probable',
      evidence: 'IT budget 4.2% vs 3.1% peer — entire overspend treated as strategic investment. Bloomberg AIM maintenance at 4× peer median, classified as core infrastructure. £42M consulting spend classified as necessary — knowledge transfer score 24% suggests most value is not retained.',
      source_files: ['ARC-M03', 'ARC-D01']
    }
  ],

  top_findings: [
    {
      title: '£94M in AI spend. £0 verified return. CDO vacancy is the root cause.',
      description: '28 AI initiatives running. None have a baseline. None have a measurement framework. The CDO vacancy — 11 months — is why: the Governance Council cannot convene, the CRO has blocked new deployments, and no one owns the portfolio. This is not a technology problem. It is a governance problem with a single fix.',
      severity: 'critical',
      source_files: ['ARC-M02', 'ARC-C03'],
      genome_pattern: 'F002'
    },
    {
      title: '£178M structural IT overspend annually vs peers.',
      description: 'IT budget 4.2% of revenue vs 3.1% peer benchmark. The gap is £178M annually. Driven by: Bloomberg AIM maintenance at 4× peer (£6M recoverable), consulting spend at 24% KT (£16–28M recoverable), and contractor permanence creating no reduction pressure.',
      severity: 'critical',
      source_files: ['ARC-M03', 'ARC-D01'],
      genome_pattern: 'F012'
    },
    {
      title: 'Performance fee compression: £82M → £48M while AUM grew.',
      description: 'Revenue per AUM is declining as AUM grows. Performance fees dropped 41% in two years. The margin problem is not just cost — the revenue line is compressing too. Fee yield analysis by strategy is the next unlock.',
      severity: 'high',
      source_files: ['ARC-M01'],
      genome_pattern: null
    },
    {
      title: 'Middle office, fee yield, KYC/AML: £40–80M available with data uploads.',
      description: 'Three areas where Genome benchmarks suggest significant opportunity but client data has not yet been loaded: settlement STP automation (£2–5M), fee yield analysis (£8–16M), KYC/AML automation (estimated £3–8M). Upload data or enter 3 numbers to unlock each analysis.',
      severity: 'medium',
      source_files: [],
      genome_pattern: null
    }
  ],

  missing_data: [
    {
      category: 'Revenue by strategy (3 years, quarterly)',
      what_it_unlocks: 'Fee yield analysis and pricing optimisation — typically £8–16M for £840B AUM manager.',
      priority: 'important'
    },
    {
      category: 'Settlement failure log and reconciliation breaks',
      what_it_unlocks: 'Middle office STP automation ROI — typically £2–5M.',
      priority: 'important'
    },
    {
      category: 'Client AUM flows and redemption data',
      what_it_unlocks: 'Client retention analysis — cannot estimate without data.',
      priority: 'important'
    }
  ],

  recommended_action: 'Review the Margin Opportunity Map. Approve Phase 0 to begin Phase 1 with the three confirmed high-confidence areas: AI portfolio rationalisation, consulting reduction, and IT structural overspend. Simultaneously, request data uploads for middle office and fee yield to unlock Phase 2 analyses.'
}

export async function extractDatasetSummaries(
  clientId: string,
  solution: string,
  uploadedFiles: string[]
): Promise<Record<string, any>> {

  // Arcturus Delivery
  if (clientId === 'arcturus' && solution === 'delivery') {
    return {
      consulting_audit: {
        file: 'ARC-D01',
        total_annual_spend_m: 42.0,
        vendor_count: 10,
        avg_kt_score_pct: 24,
        worst_kt: { vendor: 'Bloomberg LP', score: 8 },
        best_kt: { vendor: 'AWS ProServe', score: 62 },
        failed_engagements: ['Google PSO — 22% delivered', 'McKinsey — 55% delivered'],
        total_recoverable_m: 22.4,
        critical_vendors: ['Bloomberg LP', 'Wipro', 'Contractors (EA)']
      },
      knowledge_risk: {
        file: 'ARC-D02',
        critical_domains: 5,
        highest_risk: { domain: 'Bloomberg AIM customisation logic', score: 98 },
        vendor_owned_knowledge: [
          'Bloomberg AIM customisation logic (14 customisations)',
          'Wipro FSC customisation code',
          'Google PSO MLOps design (engagement ended)'
        ],
        no_retention_plan: 7
      },
      engineering_org: {
        file: 'ARC-C01',
        total_headcount: 157,
        fte: 79,
        contractors: 37,
        consulting: 67,
        vendor_dependency_ratio: 0.66,
        critical_vacant_roles: ['VP Engineering Data', 'CDO'],
        squads_vendor_dependent: ['OMS Core', 'Client Data Platform', 'Digital Innovation Lab']
      },
      leadership: {
        file: 'ARC-C03',
        cdo_vacant_months: 11,
        initiatives_blocked: 14,
        governance_council_status: 'Not constituted',
        critical_risks: ['CDO vacancy', 'Contractor in EA permanent role', 'AI governance absent']
      }
    }
  }

  // Meridian Delivery
  if (clientId === 'meridian' && solution === 'delivery') {
    return {
      consulting_audit: {
        file: 'MER-D01',
        total_annual_spend_m: 25.4,
        vendor_count: 8,
        avg_kt_score_pct: 34,
        worst_kt: { vendor: 'Ensemble Health Partners', score: 18 },
        critical_vendors: ['Ensemble Health Partners', 'Various contractors'],
        sla_penalties_enforceable_m: 8.0,
        total_recoverable_m: 10.6
      },
      consulting_contracts: {
        file: 'MER-C02',
        ensemble_annual_m: 14.2,
        ensemble_denial_rate: 0.182,
        ensemble_benchmark: 0.120,
        ensemble_contract_end: '2026-06-30'
      }
    }
  }

  return {}
}
