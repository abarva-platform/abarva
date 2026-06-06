// Domain Function Pack — Healthcare provider · Population health & value-based care.
//
// Function key: `population_health_value_based_care`.
//
// This is the other half of the value-based-care spine (spec §6). Where the
// care-delivery-care-management pack is the DELIVERY engine, this pack is the
// economics and the population science above it: VBC contract design and
// settlement, population stratification and risk modelling, HCC/RAF coding
// accuracy, quality-program performance (Stars / MSSP quality), and network
// design. It is the function that decides which risk to bear, on what terms,
// and whether the organisation actually made money on the population.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import { CROSS_CUTTING_ARCHITECTURE_PATTERNS } from '../cross-cutting-architecture-patterns';
import type { FunctionPack } from '../function-pack-types';

export const populationHealthValueBasedCarePack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'population_health_value_based_care',
  functionLabel: 'Population health & value-based care',
  summary:
    'Population health & value-based care is the function that owns the ' +
    'economics of bearing clinical risk: which VBC contracts to enter and on ' +
    'what risk terms, how the population is risk-modelled and stratified, ' +
    'whether HCC/RAF coding accurately reflects the population’s burden, how ' +
    'the organisation performs on quality programs that gate revenue, and how ' +
    'the network is designed to keep care in-system. It sets the financial ' +
    'frame the care-management operation executes inside. A care-management ' +
    'program can be excellent and still lose money if this function entered ' +
    'the wrong contract, mis-modelled the risk, or under-captured the ' +
    'population’s acuity.',
  version: '1.3.0',
  lastReviewed: '2026-06-06',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'medical_loss_ratio',
      name: 'Medical loss ratio (MLR)',
      definition:
        'The share of risk-adjusted premium or benchmark revenue spent on ' +
        'medical and pharmacy claims for the population — the core solvency ' +
        'ratio of a risk-bearing arrangement.',
      unit: '% of premium / benchmark revenue',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 80,
        high: 92,
        basis:
          'A sustainable MLR band for a risk-bearing provider organisation; ' +
          'too high signals losses, too low can signal under-investment or ' +
          'regulatory rebate exposure. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Payer settlement and premium data reconciled against the claims feed.',
      whyItMatters:
        'It is the single number that says whether the organisation is ' +
        'solvent on the risk it has taken — the economic frame every other ' +
        'metric serves.',
    },
    {
      key: 'shared_savings_rate',
      name: 'Shared-savings achievement rate',
      definition:
        'Actual spend for the attributed population versus the contract ' +
        'benchmark, expressed as the savings (or loss) generated against ' +
        'benchmark in the performance year.',
      unit: '% of benchmark (savings positive)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: -3,
        high: 8,
        basis:
          'Performance-year results against benchmark for ACO populations ' +
          'span loss to material savings; maturity and risk track drive the ' +
          'spread. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CMS or payer benchmark-and-settlement report for the contract.',
      whyItMatters:
        'It is the direct readout of whether the VBC bet paid off, and the ' +
        'figure the provider’s shared-savings share is computed from.',
    },
    {
      key: 'raf_score_accuracy',
      name: 'RAF score capture / accuracy',
      definition:
        'How completely the population’s documented and coded conditions ' +
        'reflect its true clinical burden, expressed as captured RAF against ' +
        'an expected RAF given the population’s clinical profile.',
      unit: 'captured RAF as % of expected RAF',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 100,
        basis:
          'Under-capture leaves revenue and benchmark uplift on the table; ' +
          'over-capture is a compliance risk. A planning range — never push ' +
          'capture beyond documented clinical truth.',
        label: 'planning-range',
      },
      dataSource:
        'HCC coding from EHR encounters reconciled against claims and the ' +
        'risk-adjustment submission.',
      whyItMatters:
        'RAF drives risk-adjusted revenue and the contract benchmark; ' +
        'systematic under-capture quietly understates the population and ' +
        'caps every downstream economic result.',
    },
    {
      key: 'quality_composite_score',
      name: 'Quality composite / Star rating',
      definition:
        'The blended performance score on the quality measures that gate ' +
        'revenue — MSSP quality measures, MA Star measures, or the contract’s ' +
        'quality set.',
      unit: 'composite score (0–100) or Star rating (1–5)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 90,
        basis:
          'Quality composite performance that supports — rather than ' +
          'forfeits — quality revenue; thresholds are program-specific. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Claims-based and EHR-based quality-measure calculation reconciled ' +
        'against the payer or CMS quality report.',
      whyItMatters:
        'Quality performance gates shared-savings eligibility and MA rebate ' +
        'dollars; a strong cost result can be forfeited by a weak quality ' +
        'score.',
    },
    {
      key: 'attribution_stability',
      name: 'Attribution stability / retention',
      definition:
        'The share of the attributed population that remains attributed from ' +
        'one measurement period to the next.',
      unit: '% of members retained period-over-period',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 85,
        basis:
          'Attribution churn varies with the attribution methodology ' +
          '(prospective versus retrospective) and patient mobility. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Period-over-period payer attribution files.',
      whyItMatters:
        'A program cannot accrue value on patients who churn out before the ' +
        'intervention matures; instability erodes both the clinical and the ' +
        'financial case.',
    },
    {
      key: 'pmpm_trend',
      name: 'Per-member-per-month cost trend',
      definition:
        'The year-over-year growth rate in per-member-per-month total cost ' +
        'of care for the attributed population, risk-adjusted.',
      unit: '% year-over-year change (risk-adjusted)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 7,
        basis:
          'Risk-adjusted PMPM trend; beating the contract trend benchmark is ' +
          'the source of savings. A planning range driven by medical-cost ' +
          'inflation.',
        label: 'planning-range',
      },
      dataSource:
        'Payer claims feed, risk-normalised, compared period over period.',
      whyItMatters:
        'VBC savings are generated by beating the trend benchmark; the ' +
        'trend, not the absolute level, is what the contract settles on.',
    },
    {
      key: 'in_network_utilization_rate',
      name: 'In-network (leakage) utilisation rate',
      definition:
        'The share of attributed-population care delivered within the ' +
        'organisation’s own network or preferred high-value partners, rather ' +
        'than leaking to out-of-network providers.',
      unit: '% of care delivered in-network',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 90,
        basis:
          'Network retention varies with geography and specialty coverage; ' +
          'leakage both loses revenue and removes care from managed ' +
          'pathways. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Claims feed classified against the network and preferred-provider ' +
        'directory.',
      whyItMatters:
        'Leakage simultaneously costs margin and breaks the care-management ' +
        'team’s line of sight into the patient’s care.',
    },
    {
      key: 'annual_wellness_visit_rate',
      name: 'Annual wellness visit completion rate',
      definition:
        'The share of eligible attributed members who complete an annual ' +
        'wellness visit (or equivalent comprehensive assessment) in the ' +
        'measurement year.',
      unit: '% of eligible members',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 75,
        basis:
          'Wellness-visit completion drives both quality capture and the ' +
          'documentation that underpins accurate RAF coding. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR scheduling and encounter data reconciled against claims.',
      whyItMatters:
        'The wellness visit is the primary structured opportunity to close ' +
        'care gaps and capture the coding that drives risk-adjusted revenue.',
    },
    {
      key: 'risk_tier_concentration',
      name: 'Cost concentration in the top risk tier',
      definition:
        'The share of total population cost generated by the top risk tier — ' +
        'the measure of how concentrated, and therefore how addressable, the ' +
        'population’s spend is.',
      unit: '% of total cost from the top risk decile',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 45,
        high: 70,
        basis:
          'Cost concentration in the top decile of a typical population is ' +
          'high; a figure far outside this band usually signals a ' +
          'stratification or data problem. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Claims feed analysed by the risk-stratification model output.',
      whyItMatters:
        'Concentration sizes how much value a focused care-management effort ' +
        'can realistically reach, and validates the stratification model.',
    },
    {
      key: 'specialist_referral_efficiency',
      name: 'High-value specialist referral rate',
      definition:
        'The share of specialist referrals from the attributed population ' +
        'that go to in-network, high-value (cost- and quality-efficient) ' +
        'specialists.',
      unit: '% of referrals to high-value specialists',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 80,
        basis:
          'Referral steering toward efficient specialists is a major TCOC ' +
          'lever but is constrained by patient choice and specialty supply. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR referral orders and claims, classified against a specialist ' +
        'cost-and-quality profile.',
      whyItMatters:
        'Specialist cost variation is large; steering referrals to efficient ' +
        'specialists moves TCOC without reducing access.',
    },
    {
      key: 'preventable_hospitalization_rate',
      name: 'Preventable hospitalisation rate',
      definition:
        'Inpatient admissions per 1,000 attributed members for conditions ' +
        'that effective population-health management could have prevented.',
      unit: 'admissions per 1,000 members per year',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 30,
        high: 65,
        basis:
          'Preventable hospitalisation rates track chronic-disease burden ' +
          'and primary-care access across the whole population. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Payer claims classified against a preventable-condition set.',
      whyItMatters:
        'It is the population-level outcome that proves the population-health ' +
        'strategy is working, upstream of the contract settlement.',
    },
    {
      key: 'risk_contract_revenue_share',
      name: 'Revenue under value-based / risk contracts',
      definition:
        'The share of the organisation’s patient revenue earned under value-' +
        'based or risk-bearing contracts rather than pure fee-for-service.',
      unit: '% of patient revenue under VBC contracts',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 15,
        high: 60,
        basis:
          'The VBC revenue mix varies enormously by organisation and market; ' +
          'the right level is a strategic choice, not a universal target. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Finance contract-mix reporting reconciled against payer contracts.',
      whyItMatters:
        'It sizes the strategic exposure to value-based care and how much of ' +
        'the organisation’s economics depend on this function performing.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'raf_undercapture',
      name: 'RAF under-capture',
      description:
        'The population’s documented and coded conditions understate its ' +
        'true clinical burden. Risk-adjusted revenue and the contract ' +
        'benchmark are set too low, and the organisation is judged against a ' +
        'population that looks healthier than it is.',
      detectionSignal:
        'Captured RAF sits well below expected RAF given the population’s ' +
        'claims-evident disease burden; documented conditions are not coded ' +
        'consistently year over year.',
      diagnosticQuestion:
        'How does captured RAF compare to the population’s expected burden, ' +
        'and how reliably are documented conditions recoded each year?',
    },
    {
      key: 'wrong_contract_risk',
      name: 'Mismatched contract risk',
      description:
        'The organisation has entered a contract whose risk track, benchmark, ' +
        'or attribution rule does not match its operational maturity — taking ' +
        'downside risk before the care-management operation can move cost, or ' +
        'staying upside-only long after it can.',
      detectionSignal:
        'Downside-risk contracts are held by an organisation with immature ' +
        'care management, or strong care-management performance sits under ' +
        'upside-only contracts that cap the return.',
      diagnosticQuestion:
        'Does the risk posture of each contract match the maturity of the ' +
        'care-management operation that has to deliver it?',
    },
    {
      key: 'fragmented_population_view',
      name: 'Fragmented population view',
      description:
        'Population analytics live in disconnected places — a payer portal, ' +
        'the EHR, a separate analytics tool — with no reconciled, single view ' +
        'of the attributed population. Cost, risk, and quality are computed ' +
        'three different ways.',
      detectionSignal:
        'TCOC, RAF, and quality figures differ depending on which system ' +
        'produced them; no single reconciled population data layer exists.',
      diagnosticQuestion:
        'Is there one reconciled population data layer, or do cost, risk, and ' +
        'quality numbers depend on which system you ask?',
    },
    {
      key: 'quality_score_drag',
      name: 'Quality-score drag on savings',
      description:
        'A genuine cost result is forfeited or discounted because the ' +
        'organisation under-performs on the quality measures that gate ' +
        'shared-savings eligibility or MA rebate dollars.',
      detectionSignal:
        'The quality composite sits below the program threshold while the ' +
        'cost result is favourable — savings earned but not collectible.',
      diagnosticQuestion:
        'Is quality performance strong enough to keep the savings the cost ' +
        'result earns, and which measures are at risk?',
    },
    {
      key: 'network_leakage',
      name: 'Network leakage',
      description:
        'Attributed patients receive a large share of their care out of ' +
        'network. Margin leaks to other providers and the care-management ' +
        'team loses visibility into the patient’s care.',
      detectionSignal:
        'In-network utilisation is low; high-cost specialty and post-acute ' +
        'care in particular flows out of network.',
      diagnosticQuestion:
        'What share of the attributed population’s care — especially ' +
        'specialty and post-acute — stays in network, and where does it leak?',
    },
    {
      key: 'stratification_lag',
      name: 'Stratification lag and staleness',
      description:
        'The risk model and population stratification refresh too slowly to ' +
        'reflect a changing population. Strategy and care-management targeting ' +
        'are run off a picture that is a quarter or more out of date.',
      detectionSignal:
        'The stratification refresh cadence lags the data; newly high-risk ' +
        'members are not visible until well after their cost has emerged.',
      diagnosticQuestion:
        'How frequently does the risk stratification refresh, and how far ' +
        'does it lag the underlying claims and clinical data?',
    },
    {
      key: 'fee_for_service_incentive_conflict',
      name: 'Fee-for-service incentive conflict',
      description:
        'The organisation runs a mostly fee-for-service business with a VBC ' +
        'overlay, so the incentives that reward volume and the incentives ' +
        'that reward population-cost reduction pull against each other and ' +
        'the VBC strategy is structurally under-resourced.',
      detectionSignal:
        'VBC investment is justified case by case while FFS volume targets ' +
        'are unchallenged; population-health staffing is treated as ' +
        'discretionary.',
      diagnosticQuestion:
        'Where do the FFS and VBC incentives conflict, and how is that ' +
        'conflict governed rather than ignored?',
    },
    {
      key: 'coding_compliance_overreach',
      name: 'Coding-compliance overreach',
      description:
        'Pressure to lift RAF tips coding past documented clinical truth — ' +
        'unsupported diagnoses, copy-forward coding — creating audit and ' +
        'recoupment exposure that can dwarf the revenue gained.',
      detectionSignal:
        'RAF capture rises faster than documented disease burden; diagnoses ' +
        'appear in coding without supporting clinical documentation.',
      diagnosticQuestion:
        'Is RAF capture grounded in documented clinical truth, and what ' +
        'compliance control prevents coding overreach?',
    },
    {
      key: 'rented_population_intelligence',
      name: 'Rented population intelligence',
      description:
        'The population data layer, risk models, and quality logic live ' +
        'inside an outsourced analytics platform that holds the data and the ' +
        'models on the vendor side. The organisation rents access to insight ' +
        'derived from its own data: it cannot audit the risk logic, extend it ' +
        'to local measures or contracts, recalibrate it on its own ' +
        'population, or move it without rebuilding from scratch — and it pays ' +
        'in perpetuity for the privilege. For an organisation whose mandate ' +
        'is to OWN its AI platform, this is the default trap, not a niche one.',
      detectionSignal:
        'The population system of record is a vendor platform that cannot be ' +
        'queried at the model level; risk scores and quality logic cannot be ' +
        'inspected, recalibrated, or exported; exit would mean rebuilding the ' +
        'population intelligence layer from zero.',
      diagnosticQuestion:
        'Does the organisation own its population data layer, risk models, ' +
        'and quality logic — able to audit, extend, and run them on its own ' +
        'governed platform — or does that intelligence live inside a vendor ' +
        'system it rents and cannot inspect?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'population_risk_stratification',
      name: 'Population risk stratification and forecasting',
      valueMechanism:
        'A model risk-stratifies the whole attributed population and ' +
        'forecasts next-period cost and rising risk, so population-health ' +
        'strategy and care-management capacity are pointed at the cost that ' +
        'is coming. Value comes from converting reactive, claims-lagged ' +
        'targeting into a forward-looking population strategy.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Longitudinal claims and pharmacy history',
        'EHR clinical data — problem list, vitals, labs',
        'Attribution and enrolment files',
        'Social-need data where available',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model informs strategy and targeting; population-health ' +
          'leadership owns the decisions.',
        'Revalidate predictive accuracy against realised cost every period — ' +
          'population drift is the norm, not the exception.',
        'Test for equity: confirm the model does not under-rank members with ' +
          'sparse data, who are often the highest-need. A cost-as-proxy ' +
          'target is a known bias trap — a widely-used commercial risk ' +
          'algorithm under-referred Black patients because it predicted cost ' +
          'rather than illness (Obermeyer et al., Science 2019); validate the ' +
          'target variable, not just the model.',
      ],
      metricsMoved: [
        'risk_tier_concentration',
        'pmpm_trend',
        'preventable_hospitalization_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'hcc_coding_intelligence',
      name: 'HCC / RAF coding-gap intelligence',
      valueMechanism:
        'A model surfaces conditions that are clinically evident in the ' +
        'record but not yet coded for the current year, and routes them to a ' +
        'clinician for confirmation at the point of care. Value comes from ' +
        'closing the gap between documented clinical truth and captured RAF — ' +
        'lifting risk-adjusted revenue without overreach.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'EHR clinical documentation and problem list',
        'Prior-year HCC coding and claims',
        'The current-year risk-adjustment submission',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'A suggested code is never submitted on inference; a clinician must ' +
          'confirm the diagnosis is documented and clinically true.',
        'The control objective is accuracy, not maximisation — coding ' +
          'overreach is a hard compliance risk.',
        'Every suggestion must cite the clinical evidence it is based on.',
      ],
      metricsMoved: [
        'raf_score_accuracy',
        'annual_wellness_visit_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'contract_performance_simulation',
      name: 'VBC contract performance simulation',
      valueMechanism:
        'A model simulates performance against a contract’s benchmark, risk ' +
        'track, and quality gates under different population and intervention ' +
        'scenarios, so contracting decisions are made with a quantified view ' +
        'of the downside. Value comes from avoiding mismatched-risk contracts ' +
        'before they are signed.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Historical claims, benchmark, and settlement data',
        'Contract terms — risk track, benchmark methodology, quality gates',
        'Care-management capacity and intervention assumptions',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The simulation informs the contracting decision; the VBC ' +
          'contracting and actuary leads own it.',
        'Scenario assumptions must be explicit and labelled — a simulation is ' +
          'only as honest as its stated assumptions.',
        'Benchmark methodology is contract-specific; the model must encode ' +
          'the actual contract, not a generic one.',
      ],
      metricsMoved: [
        'shared_savings_rate',
        'medical_loss_ratio',
        'risk_contract_revenue_share',
      ],
      relatedArchetypePlaybook: 'model_risk_ai',
    },
    {
      key: 'quality_measure_intelligence',
      name: 'Quality-measure performance intelligence',
      valueMechanism:
        'A model tracks projected performance on every revenue-gating ' +
        'quality measure, identifies which measures are at risk of falling ' +
        'below threshold, and ranks the closeable gaps by revenue impact. ' +
        'Value comes from protecting the quality score that gates the savings ' +
        'the cost result earns.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Claims-based and EHR-based quality-measure data',
        'Program quality-measure specifications and thresholds',
        'Care-gap and outreach data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A measure is closed by a documented clinical event, never by ' +
          'inference.',
        'Prioritising by revenue impact must not abandon measures that ' +
          'matter clinically but carry less revenue weight.',
      ],
      metricsMoved: [
        'quality_composite_score',
        'annual_wellness_visit_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'network_leakage_intelligence',
      name: 'Network leakage and referral-steering intelligence',
      valueMechanism:
        'A model identifies where attributed-population care leaks out of ' +
        'network and surfaces in-network, high-value alternatives at the ' +
        'point of referral. Value comes from retaining margin and restoring ' +
        'the care-management team’s line of sight into the patient’s care.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Claims classified by network status',
        'EHR referral orders',
        'A specialist and facility cost-and-quality profile',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Referral steering must respect patient choice and clinical ' +
          'appropriateness — it informs, it does not override.',
        'High-value classification must be transparent and defensible, not a ' +
          'black-box steer toward owned facilities.',
      ],
      metricsMoved: [
        'in_network_utilization_rate',
        'specialist_referral_efficiency',
        'pmpm_trend',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'reconciled_population_data_layer',
      name: 'Reconciled population data layer',
      description:
        'A single, governed data layer that reconciles claims, EHR, ' +
        'attribution, quality, and risk data into one authoritative view of ' +
        'the attributed population. Cost, RAF, and quality are computed once, ' +
        'from one place; every downstream population-health use case consumes ' +
        'it. For an own-it mandate this layer is built lakehouse-native — on ' +
        'the organisation’s own governed cloud platform (e.g. Databricks ' +
        'under Unity Catalog in the organisation’s own account) — so the ' +
        'reconciled data, the risk models, and the quality logic are owned, ' +
        'auditable, and extensible assets. A vendor population-health SaaS ' +
        'platform can deliver the same view faster but holds the data and ' +
        'models on the vendor side: a rent posture, acceptable only where the ' +
        'organisation has explicitly decided not to own this layer.',
      boundary:
        'It reconciles and computes population metrics; it does not make ' +
        'contracting or clinical decisions. It is the population system of ' +
        'record, not the EHR. Owning the layer means owning the data, the ' +
        'models, and the logic — not merely licensing a dashboard over them.',
      humanAccountabilityPoint:
        'The Chief Data Officer or population-health analytics owner ' +
        'accountable for the reconciled population layer.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'population_health',
    },
    {
      key: 'risk_model_with_validation_loop',
      name: 'Risk model with a periodic validation loop',
      description:
        'A population risk-stratification and forecasting model wired to a ' +
        'fixed validation cadence: each period the prior predictions are ' +
        'back-tested against realised cost, drift is measured, and the model ' +
        'is recalibrated. The validation loop is part of the pattern, not an ' +
        'afterthought.',
      boundary:
        'It stratifies and forecasts; it does not set strategy. Population-' +
        'health leadership owns the decisions the model informs.',
      humanAccountabilityPoint:
        'The model owner accountable for the risk model and its validation ' +
        'cadence.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'population_health',
    },
    {
      key: 'point_of_care_coding_capture',
      name: 'Point-of-care coding-gap capture',
      description:
        'A pattern that surfaces clinically evident, uncoded conditions to ' +
        'the clinician inside the encounter workflow — especially the annual ' +
        'wellness visit — for confirmation, so RAF capture is grounded in ' +
        'documented care rather than retrospective chart mining.',
      boundary:
        'It surfaces evidence-backed suggestions; the clinician confirms the ' +
        'diagnosis. It never submits a code on inference and never targets ' +
        'capture beyond documented truth.',
      humanAccountabilityPoint:
        'The clinician who confirms the diagnosis, with a coding-compliance ' +
        'owner accountable for the control.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'contract_decision_simulation',
      name: 'Contract-decision simulation harness',
      description:
        'A simulation pattern that encodes a specific contract’s benchmark, ' +
        'risk track, and quality gates and runs population and intervention ' +
        'scenarios before a contracting decision, producing a quantified ' +
        'downside view with explicit, labelled assumptions.',
      boundary:
        'It produces decision-support scenarios; the VBC contracting and ' +
        'actuary leads own the contract decision. It does not negotiate or ' +
        'commit.',
      humanAccountabilityPoint:
        'The VBC contracting lead and actuary who own the contract decision.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'quality_revenue_protection_loop',
      name: 'Quality-revenue protection loop',
      description:
        'A pattern that continuously projects performance on every revenue-' +
        'gating quality measure, flags measures at risk of falling below ' +
        'threshold, and feeds prioritised gap closure back to the care-' +
        'management operation — closing the loop between quality risk and ' +
        'outreach.',
      boundary:
        'It projects and prioritises; care management executes the outreach ' +
        'and a documented clinical event closes a measure. It does not close ' +
        'measures itself.',
      humanAccountabilityPoint:
        'The quality officer accountable for the program quality score.',
      controlPosture: 'human-on-the-loop',
    },
    // The cross-cutting architecture foundation (landing zone, own-it
    // ingestion, medallion, governed serving, HITRUST governance) is now
    // included here. Each is tagged `dispositionKind: 'foundation'`, so the
    // foundation-aware solution-architecture renderer presents them in the
    // "Adopted platform foundation" exhibit — adopted, never ranked or
    // rejected — while the option scorecard runs only over the competing
    // options above. The typed patterns are the single source of truth in
    // cross-cutting-architecture-patterns.ts, sourced from the Pattern Pack Bible.
    ...CROSS_CUTTING_ARCHITECTURE_PATTERNS,
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Population-health and VBC value is realised at the contract ' +
      'settlement: spend beating the benchmark trend, with the quality gate ' +
      'cleared so the savings are collectible, and RAF accurately reflecting ' +
      'the population so the benchmark and revenue are set fairly. The ' +
      'function creates value in three distinct ways — beating cost trend, ' +
      'protecting quality-gated revenue, and accurate (not inflated) risk ' +
      'capture — and a forecast must keep them separate because each carries ' +
      'a different haircut and a different risk. Value here is also lagged: ' +
      'shared-savings reconciliation arrives well after the performance ' +
      'year, so the forecast must be explicit about when cash actually ' +
      'lands.',
    dominantHaircutFactors: [
      {
        factor: 'Contract structure and benchmark methodology',
        rationale:
          'The benchmark, risk track, savings-share percentage, and quality ' +
          'gate together cap how much of any population improvement converts ' +
          'to provider-side value. This is the single largest determinant of ' +
          'realised value and the most contract-specific.',
        typicalHaircut: {
          low: 0.25,
          high: 0.55,
          basis:
            'Provider-side value erosion from benchmark and savings-share ' +
            'design; a planning range driven entirely by the specific ' +
            'contract.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Attribution stability',
        rationale:
          'Value accrues only on patients who stay attributed long enough ' +
          'for the intervention to mature. Churn erodes the forecast and is ' +
          'largely set by the attribution methodology, not by performance.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion attributable to attribution churn over the ' +
            'performance period; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data readiness and reconciliation',
        rationale:
          'A fragmented population view, claims lag, and unreconciled risk ' +
          'and quality data cap how much of the modelled strategy can ' +
          'actually be executed and measured. Late, inconsistent data is a ' +
          'direct drag on realised value.',
        typicalHaircut: {
          low: 0.15,
          high: 0.3,
          basis:
            'Forecast erosion from claims lag and unreconciled population ' +
            'data; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Quality-gate risk',
        rationale:
          'A genuine cost result can be partly or wholly forfeited if the ' +
          'quality composite falls below the program threshold. The haircut ' +
          'is non-linear — a near-miss on the gate can erase most of the ' +
          'collectible value.',
        typicalHaircut: {
          low: 0.1,
          high: 0.4,
          basis:
            'Expected-value erosion from the probability of missing a ' +
            'revenue-gating quality threshold; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Shared savings against benchmark',
        range: {
          low: 1,
          high: 5,
          basis:
            'Achievable savings against the contract benchmark for a ' +
            'maturing VBC program; a planning range spanning early and ' +
            'mature performance years.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent of the contract benchmark generated as gross savings ' +
          'before the provider savings-share is applied.',
      },
      {
        lever: 'Risk-adjusted revenue from accurate RAF capture',
        range: {
          low: 2,
          high: 8,
          basis:
            'Risk-adjusted revenue uplift from closing the gap between ' +
            'documented clinical burden and captured RAF — accurate capture ' +
            'only, never overreach. A planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent change in risk-adjusted revenue from improved, ' +
          'compliant RAF capture.',
      },
      {
        lever: 'Quality-revenue protection',
        range: {
          low: 1,
          high: 4,
          basis:
            'The share of contract revenue protected by clearing quality ' +
            'gates that would otherwise be forfeited; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent of contract revenue retained by keeping the quality ' +
          'composite above the program threshold.',
      },
    ],
    timeToValueBand:
      '9–18 months to first measurable population-level signal (trend, ' +
      'quality, RAF accuracy); 18–36 months to a settled financial result, ' +
      'because shared-savings reconciliation lags the performance year by ' +
      'six to twelve months.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Population-health analytics / reconciled population layer',
        role:
          'The system of record for the attributed population — cost, risk, ' +
          'quality, and stratification computed from reconciled data. Own-vs-' +
          'rent is the defining architecture choice here: a lakehouse-native ' +
          'layer on the organisation’s own platform keeps the data, models, ' +
          'and logic owned, auditable, and extensible; a vendor SaaS platform ' +
          'delivers the view faster but holds the intelligence on the vendor ' +
          'side (a rent posture — see the rented-population-intelligence pain ' +
          'theme).',
        examples: [
          'Lakehouse-native reconciled population layer (own-it — e.g. ' +
            'Databricks + Unity Catalog in the organisation’s own cloud account)',
          'Arcadia',
          'Innovaccer',
          'Health Catalyst',
          'Epic Healthy Planet',
        ],
      },
      {
        name: 'Payer settlement and benchmark system',
        role:
          'Holds the contract benchmark, the attribution file, and the ' +
          'performance-year savings/-loss settlement.',
        examples: ['CMS MSSP / REACH settlement reports', 'payer VBC portals'],
      },
      {
        name: 'Risk-adjustment / HCC coding system',
        role:
          'Manages HCC coding capture and the annual risk-adjustment ' +
          'submission that drives risk-adjusted revenue.',
        examples: ['EHR risk-adjustment modules', 'Apixio', 'specialist HCC tools'],
      },
      {
        name: 'Quality-measure engine',
        role:
          'Calculates claims- and EHR-based quality measures against program ' +
          'specifications and thresholds.',
        examples: ['eCQM engines', 'payer quality reports', 'CMS quality reporting'],
      },
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record providing the documentation that ' +
          'underpins coding, quality, and the clinical view of the population.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'athenahealth'],
      },
    ],
    roles: [
      {
        title: 'Chief Population Health Officer / VP Value-Based Care',
        accountability:
          'Owns the VBC strategy and the financial and clinical performance ' +
          'of the risk-bearing population.',
      },
      {
        title: 'VBC contracting lead',
        accountability:
          'Owns which contracts are entered, on what risk terms, and the ' +
          'benchmark and quality-gate negotiation.',
      },
      {
        title: 'Healthcare actuary',
        accountability:
          'Owns the risk modelling, the financial forecast, and the ' +
          'reserving against downside risk.',
      },
      {
        title: 'Risk-adjustment / HCC coding lead',
        accountability:
          'Owns accurate, compliant RAF capture and the annual risk-' +
          'adjustment submission.',
      },
      {
        title: 'Quality officer',
        accountability:
          'Owns performance on the quality measures that gate VBC revenue.',
      },
      {
        title: 'Chief Data Officer / population-health analytics owner',
        accountability:
          'Owns the reconciled population data layer and the integrity of ' +
          'the cost, risk, and quality figures.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Medicare Shared Savings Program (MSSP)',
        relevance:
          'The dominant Medicare ACO program; sets the benchmark ' +
          'methodology, the BASIC/ENHANCED risk tracks, the attribution ' +
          'rule, and the quality measures that gate shared savings.',
      },
      {
        name: 'ACO REACH',
        relevance:
          'A full-risk capitated CMS accountable-care model; carries a ' +
          'health-equity benchmark adjustment and a stronger downside than ' +
          'standard MSSP tracks.',
      },
      {
        name: 'Medicare Advantage and CMS-HCC risk adjustment',
        relevance:
          'Capitated payment with revenue set by the CMS-HCC risk model and ' +
          'Star ratings; the frame for risk capture and quality performance ' +
          'in MA populations.',
      },
      {
        name: 'CMS RADV (Risk Adjustment Data Validation) audits',
        relevance:
          'The audit regime that recoups revenue for HCC coding not ' +
          'supported by documentation — the hard constraint that makes ' +
          'coding accuracy, not maximisation, the objective.',
      },
      {
        name: 'CMS Health Equity Index (HEI) reward',
        relevance:
          'From the 2027 Star year (2024–2025 performance), the HEI reward ' +
          'replaces the reward factor and rewards plans for strong Star ' +
          'performance among members with social risk factors (dual / LIS / ' +
          'disabled). It turns equity-stratified quality performance — ' +
          'especially in D-SNP populations — into a direct Star-revenue ' +
          'lever, making SDOH capture an economics question, not only a ' +
          'clinical one.',
      },
      {
        name: 'Commercial and Medicaid value-based contracts',
        relevance:
          'Payer-specific VBC arrangements — shared savings, bundles, ' +
          'capitation — each with its own benchmark, attribution, and ' +
          'quality terms that the function must model individually.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Lakehouse-native (own-it) population layer',
        definition:
          'A reconciled population data layer, with its risk models and ' +
          'quality logic, built and run on the organisation’s own governed ' +
          'platform so the data, models, and IP are owned, auditable, and ' +
          'extensible — as opposed to a vendor SaaS platform that holds the ' +
          'intelligence on the vendor side (a rent posture).',
      },
      {
        term: 'Benchmark',
        definition:
          'The expected spend for an attributed population that a VBC ' +
          'contract measures actual spend against to compute savings or loss.',
      },
      {
        term: 'Risk track',
        definition:
          'The upside-only or two-sided (downside) risk arrangement a ' +
          'contract is held under — e.g. the MSSP BASIC and ENHANCED tracks.',
      },
      {
        term: 'Capitation',
        definition:
          'A fixed per-member-per-month payment to cover defined care, ' +
          'placing full cost risk on the provider organisation.',
      },
      {
        term: 'HCC / RAF',
        definition:
          'Hierarchical Condition Categories rolled into a Risk Adjustment ' +
          'Factor — the coded representation of population acuity that drives ' +
          'risk-adjusted revenue.',
      },
      {
        term: 'Attribution',
        definition:
          'The methodology — prospective or retrospective — that assigns ' +
          'patients to the organisation accountable for their cost and ' +
          'quality.',
      },
      {
        term: 'Medical loss ratio (MLR)',
        definition:
          'The share of premium or benchmark revenue consumed by medical ' +
          'and pharmacy claims — the solvency ratio of a risk arrangement.',
      },
      {
        term: 'Quality gate',
        definition:
          'A minimum quality-performance threshold a contract requires ' +
          'before earned savings become collectible.',
      },
      {
        term: 'Leakage',
        definition:
          'Care delivered to an attributed patient outside the ' +
          'organisation’s own network or preferred partners.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Population-Health & VBC Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the value-based-care economics are leaking on a ' +
        'specific population and contract — cost trend, RAF capture, quality, ' +
        'leakage — with baseline evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Contract and population portfolio',
          guidance:
            'Name the VBC contracts in scope, their risk tracks, benchmarks, ' +
            'attribution rules, quality gates, and the share of revenue under ' +
            'risk. State which payer and CMS feeds are available.',
        },
        {
          heading: 'Baseline economics against the operating metrics',
          guidance:
            'Report the current value for each operating metric — MLR, ' +
            'shared-savings rate, RAF accuracy, quality composite, PMPM ' +
            'trend, leakage, attribution stability. For any metric not ' +
            'recorded, name it as a precise seed gap with its data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — RAF under-capture, mismatched ' +
            'contract risk, fragmented population view, quality drag, ' +
            'leakage, stratification lag, FFS conflict, coding overreach — ' +
            'and state which are present, with detection signal and evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity from the value-model benchmark ranges — ' +
            'separating cost-trend savings, RAF accuracy, and quality ' +
            'protection — haircut by contract structure, attribution ' +
            'stability, and data readiness. Every figure a labelled planning ' +
            'range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns each ' +
            'source, and what each gap blocks. A missing metric is a named ' +
            'ask.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to and ' +
            'why, and the boundary of the Move.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Population-Health & VBC Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a population-health / ' +
        'VBC AI Move — baseline economics, forecast, cost, and the honest ' +
        'downside, read against the contract.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into cost-' +
            'trend, RAF, and quality components, the time-to-cash band, and ' +
            'the go / hold recommendation.',
        },
        {
          heading: 'Baseline economics model',
          guidance:
            'Anchor every value claim to a measured baseline metric and to ' +
            'the actual contract terms. Where a baseline is a seed gap, say ' +
            'so and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, then ' +
            'apply each dominant haircut — contract structure, attribution ' +
            'stability, data readiness, quality-gate risk — explicitly, with ' +
            'the math shown. Keep cost, RAF, and quality value separate.',
        },
        {
          heading: 'Cost, effort, and cash timing',
          guidance:
            'Cost the build and integration, and state when value actually ' +
            'lands — shared-savings reconciliation lags the performance year, ' +
            'so the cash-timing curve is part of the case.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show the case under a missed quality gate, high attribution ' +
            'churn, and a weaker benchmark outcome. State the downside the ' +
            'CFO is underwriting, including any two-sided-risk exposure.',
        },
        {
          heading: 'Compliance and audit posture',
          guidance:
            'For any RAF-capture component, state the coding-compliance ' +
            'control and the RADV-audit posture — accuracy, not ' +
            'maximisation, is the objective.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence required before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State which operating metrics Tower will track to prove the ' +
            'forecast, and the cadence — including the lagged settlement ' +
            'metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Population-Health & VBC Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'population-health / VBC AI capability, grounded in the function ' +
        'reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — reconciled population data layer, risk model with a ' +
            'validation loop, point-of-care coding capture, contract-decision ' +
            'simulation, quality-revenue protection loop — and state which ' +
            'apply and how they connect.',
        },
        {
          heading: 'Platform landing zone & private data plane',
          guidance:
            'Specify the cloud landing zone and private data plane the ' +
            'capability runs on — multi-account governance, private ' +
            'networking with no public-IP compute and an egress allowlist, ' +
            'PrivateLink to the lakehouse, a regional Unity Catalog metastore, ' +
            'and identity federation. State the platform-readiness gate that ' +
            'must be green before PHI lands. Do not present an architecture ' +
            'with no landing zone (cross-cutting pattern ' +
            'cc_cloud_landing_zone_private_data_plane).',
        },
        {
          heading: 'Ingestion & data-integration framework (own-it)',
          guidance:
            'Specify the metadata-driven ingestion framework that onboards ' +
            'Epic Clarity/Caboodle, claims, ERP, and SaaS sources by ' +
            'configuration rather than per-pipeline code — name the own-it ' +
            'choice (e.g. DLT-META / the Databricks four-config framework, ' +
            'Lakeflow Connect landing in the client’s own Unity Catalog) and ' +
            'reject reinventing a bespoke framework or renting an outsourced ' +
            'destination platform that holds the data on the vendor side ' +
            '(cross-cutting pattern cc_metadata_driven_ingestion_framework).',
        },
        {
          heading: 'Population data architecture',
          guidance:
            'Specify the claims, EHR, attribution, quality, and risk feeds, ' +
            'their latency and reconciliation, and how the single ' +
            'authoritative population view is built and governed — as an ' +
            'own-it, lakehouse-native reconciled layer, not a rented ' +
            'population-health SaaS that holds the data and models.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path — with special care on the coding-compliance ' +
            'and equity controls.',
        },
        {
          heading: 'Risk-model validation design',
          guidance:
            'Define the back-test cadence, the drift monitoring, and the ' +
            'recalibration trigger for any risk or forecasting model — the ' +
            'validation loop is part of the architecture.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how VBC contracting, coding, quality, and analytics ' +
            'workflows change, and who owns each change.',
        },
        {
          heading: 'Responsible-AI and regulatory controls',
          guidance:
            'State the model-monitoring, equity-check, coding-compliance, ' +
            'and audit controls, and the regulatory frames (MSSP, REACH, ' +
            'MA/HCC, RADV, HEI) that bound the design. Make the governance ' +
            'spine explicit: Unity Catalog access/lineage controls, a HITRUST ' +
            'CSF control mapping over the cloud + lakehouse services, and ' +
            'HIPAA via the compliance security profile + BAA with both the ' +
            'cloud provider and the lakehouse vendor, with PHI processed in ' +
            'the client’s own account (cross-cutting pattern ' +
            'cc_unity_catalog_hitrust_governance).',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, integration to the population-' +
            'health platform and EHR, and the phased rollout.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Population-Health & VBC Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the population-health / VBC AI ' +
        'capability so value reaches the contract settlement, not just the ' +
        'dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — population-data reconciliation, model ' +
            'validation, coding-capture and quality workflows, scale — with ' +
            'milestones tied to the operating metrics and the contract ' +
            'calendar.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — population ' +
            'data, risk-model validation, coding compliance, quality, ' +
            'contracting, Tower measurement.',
        },
        {
          heading: 'Workflow adoption approach',
          guidance:
            'Define the change runway for coders, clinicians, quality, and ' +
            'analytics teams, and how adoption is measured rather than ' +
            'assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence — ' +
            'including the lagged settlement metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — quality-gate exposure, attribution ' +
            'churn, coding-compliance risk, model drift — with the ' +
            'escalation owner and trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'The contract benchmark and the savings/-loss result',
      authoritativeSource:
        'The CMS or payer benchmark-and-settlement report for the specific ' +
        'contract.',
      whatGoodEvidenceLooksLike:
        'The official settlement report stating the benchmark, actual ' +
        'spend, the savings or loss, and the provider savings-share for the ' +
        'performance year.',
      weakEvidenceToReject:
        'An internally estimated benchmark, a projection presented as a ' +
        'settled result, or a savings figure with no stated benchmark ' +
        'methodology.',
    },
    {
      claim: 'That RAF capture reflects the population’s true clinical burden',
      authoritativeSource:
        'HCC coding traced to documented clinical evidence in the EHR, ' +
        'reconciled against the risk-adjustment submission.',
      whatGoodEvidenceLooksLike:
        'Coded conditions each supported by current-year clinical ' +
        'documentation, with captured RAF compared to the population’s ' +
        'claims-evident burden.',
      weakEvidenceToReject:
        'Copy-forward coding, diagnoses with no supporting documentation, ' +
        'or a RAF-uplift claim with no RADV-defensible evidence trail.',
    },
    {
      claim: 'Quality-measure performance against the program threshold',
      authoritativeSource:
        'The payer or CMS quality report, or eCQM calculations reconciled ' +
        'against the program measure specifications.',
      whatGoodEvidenceLooksLike:
        'Each gating measure reported with its numerator, denominator, and ' +
        'the program threshold, traceable to claims or the EHR.',
      weakEvidenceToReject:
        'A quality estimate with no measure specification, or a prior-year ' +
        'score used as a proxy for the current performance year.',
    },
    {
      claim: 'Cost trend and per-member-per-month performance',
      authoritativeSource:
        'The reconciled payer claims feed, risk-normalised, compared period ' +
        'over period.',
      whatGoodEvidenceLooksLike:
        'A risk-adjusted PMPM trend computed from a full claims extract ' +
        'with the run-out period stated and the risk normalisation ' +
        'methodology disclosed.',
      weakEvidenceToReject:
        'An un-run-out claims period presented as final, or a non-risk-' +
        'adjusted trend used to claim performance.',
    },
    {
      claim: 'The forecast value of a population-health / VBC AI Move',
      authoritativeSource:
        'The value model — cost-trend, RAF, and quality components, each ' +
        'haircut by its dominant factors — read against the specific ' +
        'contract.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines and actual contract ' +
        'terms, with each haircut applied explicitly, the cash-timing lag ' +
        'shown, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the contract structure or the ' +
        'settlement lag.',
    },
    {
      claim:
        'That the population intelligence layer is OWNED by the organisation, ' +
        'not rented from a vendor platform',
      authoritativeSource:
        'The architecture decision record and the data-platform contract ' +
        'terms — where the reconciled data, the risk models, and the quality ' +
        'logic physically reside, and who can audit, extend, and move them.',
      whatGoodEvidenceLooksLike:
        'The reconciled population layer, risk models, and quality logic run ' +
        'in the organisation’s own governed lakehouse (its own cloud account, ' +
        'under Unity Catalog), are auditable and extensible, and the IP is ' +
        'owned by the organisation. Managed connectors are acceptable where ' +
        'the destination catalog is the organisation’s own.',
      weakEvidenceToReject:
        'A claim of having a population-health platform where the data, ' +
        'models, and logic are held by the vendor and cannot be audited, ' +
        'recalibrated, or moved — that is rented intelligence, not an owned ' +
        'asset, and must not be presented as the organisation owning its ' +
        'population strategy.',
    },
  ],
};
