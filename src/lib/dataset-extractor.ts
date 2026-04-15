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
