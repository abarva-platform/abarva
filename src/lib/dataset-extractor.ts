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
    immediate_action?: string
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

export const ARCTURUS_TECH_PHASE0: Phase0Output = {
  overall_score: 34,
  overall_verdict: 'partial',
  verdict_summary: 'Sufficient data to begin Phase 1. System inventory complete. Migration history documented — 3 post-mortems available. Data architecture gaps identified. Technical debt assessment partial — no config files uploaded yet.',

  dimension_scores: {
    system_inventory: {
      score: 72,
      evidence: '13 systems mapped. Ages 4-28 years. Total annual cost £37M. SQL Server DW: EOL October 2025 — already passed. Bloomberg AIM: 28 years, £8.4M annually, 14 customisations.',
      missing_data: 'Dependency mapping between systems incomplete',
      what_it_unlocks: 'Precise migration sequencing — which system breaks if another is removed first'
    },
    modernization_history: {
      score: 88,
      evidence: '3 Bloomberg AIM modernisation attempts fully documented. Total cost £32.6M. All 3 failed. Root cause identical in all 3: F002 — no named executive sponsor who survived programme duration. 2009 TCS: £8.2M. 2016 Accenture: £14.6M. 2021 Infosys: £9.8M.',
      missing_data: 'Nothing — post-mortems are complete',
      what_it_unlocks: 'Already fully unlocked'
    },
    data_architecture: {
      score: 18,
      evidence: '0 of 14 data domains have a golden record. 11 of 14 integrations are manual. SQL Server DW: 3-day reporting lag from manual extraction. Client data: 4 conflicting sources. ESG data: monthly manual compilation.',
      missing_data: 'Data dictionary for Bloomberg AIM position history',
      what_it_unlocks: 'Migration extraction complexity assessment for Bloomberg AIM'
    },
    technical_assessment: {
      score: 42,
      evidence: 'ARC-T02 loaded: Bloomberg AIM technical debt score 94/100. SQL Server DW 88/100. Charles River IMS 32/100 (best managed). API wrapper opportunity identified for 6 of 14 Bloomberg customisations.',
      missing_data: 'Bloomberg AIM configuration files, integration specification documents',
      what_it_unlocks: 'Precise API wrapper feasibility per customisation. Migration complexity score.'
    },
    vendor_dependency: {
      score: 14,
      evidence: 'Bloomberg LP owns 14 AIM customisations — no documentation. Wipro owns all FSC customisations — code escrow absent. Contractor owns enterprise architecture — no KT obligation. Google PSO engagement ended with 5% KT score.',
      missing_data: 'Bloomberg contract data portability clause (request from legal)',
      what_it_unlocks: 'Exit penalty and data portability rights — critical for migration decision'
    },
    internal_capability: {
      score: 22,
      evidence: 'CDO vacant 11 months — F002 confirmed. Portfolio Analytics squad: genuine capability (benchmark). EA function: contractor-led — critical risk. VP Engineering Data: contractor in permanent role. Only 2 squads have internal capability without vendor support.',
      missing_data: 'Individual capability assessments per squad lead',
      what_it_unlocks: 'Maestro team design — which gaps to fill first'
    }
  },

  genome_matches: [
    {
      code: 'F001',
      name: 'Vendor dependency without internal capability',
      failure_rate: 0.72,
      confidence: 'confirmed',
      evidence: 'Bloomberg LP engineers own 14 AIM customisations. Wipro owns all FSC customisations. Google PSO knowledge walked out. Internal team cannot govern any of these systems without vendor.',
      source_files: ['ARC-T02', 'ARC-T03', 'ARC-C01']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'confirmed',
      evidence: 'All 3 Bloomberg AIM modernisation failures had F002 as root cause. CDO currently vacant 11 months — same structural gap that caused all 3 prior failures. Without addressing this first, attempt 4 will fail.',
      source_files: ['ARC-P04', 'ARC-C03']
    },
    {
      code: 'F003',
      name: 'Data readiness below threshold',
      failure_rate: 0.68,
      confidence: 'confirmed',
      evidence: '2016 Accenture attempt failed partly due to data migration complexity. 0 golden records currently. Bloomberg AIM position history in proprietary format with no data dictionary. Migration cannot begin without data extraction plan.',
      source_files: ['ARC-P02', 'ARC-P04']
    }
  ],

  top_findings: [
    {
      title: 'SQL Server DW: EOL passed. Running without security patches today.',
      description: 'Microsoft ended support for SQL Server 2017 in October 2025. Every day this system runs is a security and regulatory risk. Azure SQL migration is a 4-month project at £1.2M. This requires immediate action regardless of Bloomberg AIM decision.',
      severity: 'critical',
      source_files: ['ARC-C04'],
      genome_pattern: null,
      immediate_action: 'Commission Azure SQL migration within 30 days'
    },
    {
      title: '3 Bloomberg AIM modernisation failures. £32.6M spent. All failed for the same reason.',
      description: 'F002 — no named executive sponsor who survived the programme duration. 2009: CDO-equivalent absent. 2016: Programme director resigned month 18. 2021: CDO appointed, resigned 4 months. The technology was never the problem. Governance was. Attempt 4 with the same structure will produce the same result.',
      severity: 'critical',
      source_files: ['ARC-P04'],
      genome_pattern: 'F002',
      immediate_action: 'Name executive sponsor before scoping any modernisation approach'
    },
    {
      title: '6 of 14 Bloomberg customisations are portable. 8 are Bloomberg-only.',
      description: 'AIM-C011 (Geneva connector), AIM-C013 (ESG overlay), AIM-C005 (rebalancing workflow), AIM-C008 (mandate dashboard), AIM-C014 (board extract) — these are internal-built or low-complexity. An API wrapper approach covering these 6 would reduce dependency without the migration risk that killed all 3 prior attempts.',
      severity: 'high',
      source_files: ['ARC-P04', 'ARC-T02'],
      genome_pattern: 'F001',
      immediate_action: 'Commission API wrapper feasibility study for the 6 portable customisations'
    },
    {
      title: 'Charles River IMS + Portfolio Analytics: the proof that Arcturus can govern technology.',
      description: 'Charles River IMS scores 32/100 for technical debt — the best-managed system in the estate. Portfolio Analytics squad delivers at benchmark. These two prove the internal capability exists in pockets. Tech modernisation builds on these, not from zero.',
      severity: 'positive',
      source_files: ['ARC-T02', 'ARC-C01'],
      genome_pattern: null
    }
  ],

  missing_data: [
    {
      category: 'Bloomberg AIM configuration files and integration specifications',
      what_it_unlocks: 'Precise API wrapper feasibility per customisation. Migration complexity score per integration.',
      priority: 'important'
    },
    {
      category: 'Bloomberg contract data portability clause',
      what_it_unlocks: 'Exit penalty and data portability rights — critical for migration decision',
      priority: 'important'
    }
  ],

  recommended_action: 'Two immediate actions before Phase 1: (1) Commission Azure SQL migration for SQL Server DW — EOL has passed, this is non-negotiable. (2) Name an executive sponsor for the Bloomberg AIM programme before scoping any approach — all 3 prior failures share this root cause. Phase 1 can begin in parallel with Failure Pattern Analysis as the first workstream.'
}

export const MERIDIAN_TECH_PHASE0: Phase0Output = {
  overall_score: 41,
  overall_verdict: 'partial',
  verdict_summary: 'Strong data on Epic and integration landscape. Cerner migration complexity partially assessed. Data migration planning gap is the most critical risk. Ready to begin Phase 1.',

  dimension_scores: {
    system_inventory: {
      score: 68,
      evidence: 'Epic EHR: primary clinical system. 42 HL7/FHIR integrations mapped. 2 hospitals on Cerner — migration target Q4 2026. Epic optimization score 58/100 vs 80 benchmark. $36.5M unrealized Epic value identified.',
      missing_data: 'Non-clinical system inventory (supply chain, HR, finance systems)',
      what_it_unlocks: 'Full technology modernization scope beyond clinical systems'
    },
    modernization_history: {
      score: 52,
      evidence: 'Epic go-live 2014 — 11 years on same instance. No major modernization failures in Epic. Cerner legacy at 2 hospitals — no prior migration attempts. Prior auth integration: 60% complete, stalled for 18 months.',
      missing_data: 'Root cause of prior auth integration stall — governance or technical',
      what_it_unlocks: 'Understanding of delivery blockers for current modernization'
    },
    data_architecture: {
      score: 44,
      evidence: '42 HL7/FHIR connections mapped. Prior auth integration 60% complete. CMS mandate January 2027 requires electronic prior auth. Data migration planning for Cerner → Epic not started. 14 years of Cerner history in proprietary format.',
      missing_data: 'Cerner data dictionary and patient record count',
      what_it_unlocks: 'Cerner migration complexity and timeline estimate'
    },
    technical_assessment: {
      score: 38,
      evidence: 'Epic optimization score 58/100. 18 of 22 licensed modules underutilized. MyChart adoption 34% vs 60% target. Prior auth module 8% activated vs 50% benchmark. $36.5M in licensed but unused capability.',
      missing_data: 'Epic configuration files for specific module settings',
      what_it_unlocks: 'Precise module activation sequence and configuration requirements'
    },
    vendor_dependency: {
      score: 48,
      evidence: 'Epic: good documentation, good KT score (62%). Ensemble Health Partners: high dependency, 18% KT score, contract ends 2026. Wipro Salesforce Health Cloud: 22% KT score. Contractor analysts: 12% KT score.',
      missing_data: 'Cerner contract exit terms',
      what_it_unlocks: 'Cerner exit cost and data portability rights'
    },
    internal_capability: {
      score: 54,
      evidence: 'Epic team: 12 FTE, capable. AWS cloud team: capable. Cybersecurity: capable. Gap: no CDO (search month 4), prior auth AI expertise absent, data analytics capacity thin.',
      missing_data: 'Individual Epic analyst capability assessments',
      what_it_unlocks: 'Precise Maestro team design for Epic optimization programme'
    }
  },

  genome_matches: [
    {
      code: 'F008',
      name: 'Change management gap',
      failure_rate: 0.61,
      confidence: 'confirmed',
      evidence: 'Epic training completion 41% vs 80% benchmark. MyChart adoption 34% vs 60% target. Prior auth module 8% activated. The technology exists and is licensed. Adoption failure is a change management failure, not a technology problem.',
      source_files: ['MER-T03', 'MER-P04']
    },
    {
      code: 'F003',
      name: 'Data readiness below threshold',
      failure_rate: 0.68,
      confidence: 'probable',
      evidence: '14 years of Cerner patient history in proprietary format. Data migration planning not started for Q4 2026 Cerner migration. 2016 Arcturus modernisation failed for same reason — data complexity underestimated.',
      source_files: ['MER-T02']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'probable',
      evidence: 'CDO search active month 4 — vacant. Prior auth integration stalled 18 months — no accountable owner. Without CDO, technology modernization programme has no executive sponsor for the digital initiatives.',
      source_files: ['MER-C02', 'MER-T01']
    }
  ],

  top_findings: [
    {
      title: 'Epic optimization score 58/100. $36.5M unrealized value already paid for.',
      description: 'Meridian licenses 22 Epic modules. 18 are underutilized. The prior auth module — critical for the CMS January 2027 mandate — is 8% activated vs 50% benchmark. This is not a technology gap. The capability is licensed and configured. Change management and activation are the gaps.',
      severity: 'critical',
      source_files: ['MER-T03', 'MER-P04'],
      genome_pattern: 'F008',
      immediate_action: 'Activate prior auth module for top 3 payers before CMS mandate deadline'
    },
    {
      title: 'Cerner migration: Q4 2026 target. Data migration planning not started.',
      description: '2 hospitals on Cerner. 700 combined beds. 14 years of patient history. Migration target Q4 2026. Data migration planning not started. 2016 Arcturus modernisation failed for identical reason — data complexity underestimated before programme start. This is F003 at 68% failure rate.',
      severity: 'critical',
      source_files: ['MER-T02'],
      genome_pattern: 'F003',
      immediate_action: 'Begin Cerner data dictionary and patient record count immediately'
    },
    {
      title: 'CMS mandate January 2027: 8 integrations require enhancement. 14 months to deadline.',
      description: '42 HL7/FHIR connections mapped. Prior auth integration 60% complete for 3 payers. CMS mandate requires electronic prior auth for all payers. 8 payer integrations need enhancement. 14 months is achievable with right programme governance.',
      severity: 'high',
      source_files: ['MER-T01', 'MER-T04'],
      genome_pattern: null
    }
  ],

  missing_data: [
    {
      category: 'Cerner data dictionary and patient record count',
      what_it_unlocks: 'Cerner migration complexity and timeline estimate — currently unknown',
      priority: 'blocking'
    },
    {
      category: 'Epic configuration files for underutilized modules',
      what_it_unlocks: 'Precise module activation sequence for prior auth and MyChart',
      priority: 'important'
    }
  ],

  recommended_action: 'Three parallel tracks: (1) Begin Epic optimization — prior auth module activation for CMS mandate compliance. (2) Start Cerner data migration planning immediately — 14 months is tight. (3) Accelerate CDO hire — prior auth integration has been stalled 18 months without an accountable owner.'
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
