// Domain Function Pack — Healthcare provider · Clinical workforce & staffing.
//
// Function key: `clinical_workforce_staffing`.
//
// This pack covers the clinical workforce & staffing function: the end-to-end
// function that gets the right clinical staff — nurses, technicians, advanced
// practice providers, and support roles — to the right unit, at the right
// time, in the right number, at a cost the organisation can sustain. It spans
// workforce planning and budgeting (the staffing grid and the hours-per-
// patient-day target), recruitment and hiring, scheduling and shift coverage,
// the management of the float pool and the contingent / agency workforce,
// onboarding and competency development, retention and engagement, and the
// credentialing and competency tracking that keeps every clinician qualified
// for the unit they are placed on.
//
// The operating reality the pack encodes: clinical labour is the single
// largest cost line in a health system, and it has been under structural
// strain — nurse turnover, vacancy, and a heavy reliance on premium-priced
// agency labour have together pushed labour cost up while burning out the
// permanent workforce. The function fails in two coupled ways at once: it
// over-spends (premium pay, agency, overtime) AND it under-staffs or mis-
// staffs (census mismatch, churn, burnout), and the two reinforce each other.
// The AI archetypes are the recurring bets against exactly that reality —
// predictive census-based staffing, AI scheduling and self-scheduling,
// agency-spend optimisation, attrition-risk prediction, float-pool
// optimisation, and credential & competency management.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const clinicalWorkforceStaffingPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'clinical_workforce_staffing',
  functionLabel: 'Clinical workforce & staffing',
  summary:
    'Clinical workforce & staffing is the function that gets the right ' +
    'clinical staff — nurses, technicians, advanced practice providers, and ' +
    'support roles — to the right unit, at the right time, in the right ' +
    'number, at a cost the organisation can sustain. It spans workforce ' +
    'planning and the staffing grid, recruitment and hiring, scheduling and ' +
    'shift coverage, the float pool and the contingent / agency workforce, ' +
    'onboarding and competency development, retention and engagement, and ' +
    'credentialing. Clinical labour is the single largest cost line in a ' +
    'health system, and the function fails in two coupled ways at once: it ' +
    'over-spends — premium pay, agency, overtime — and it under- or mis-' +
    'staffs — census mismatch, turnover, burnout — and each failure feeds ' +
    'the other. The function is judged on the cost and the stability of the ' +
    'workforce, on whether units are staffed to the acuity of the patients ' +
    'in them, and on whether the people doing the work stay.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'nurse_turnover_rate',
      name: 'Nurse turnover rate',
      definition:
        'The share of registered-nurse positions that separate — ' +
        'voluntarily or involuntarily — over a rolling year, as a ' +
        'percentage of the average RN headcount.',
      unit: '% of RN headcount per year',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 12,
        high: 27,
        basis:
          'Nurse turnover varies with market, specialty, and tenure mix ' +
          'and rose sharply through the recent workforce strain; the band ' +
          'spans a stable employer to a high-churn one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The human-capital-management (HCM) system separation records ' +
        'reconciled against the average RN headcount.',
      whyItMatters:
        'Turnover is the headline workforce-stability metric — every ' +
        'departure carries a large replacement, orientation, and lost-' +
        'productivity cost, and high turnover is both a symptom of strain ' +
        'and a cause of the next departure.',
    },
    {
      key: 'rn_vacancy_rate',
      name: 'RN vacancy rate',
      definition:
        'The share of budgeted registered-nurse positions that are unfilled ' +
        'and actively open, as a percentage of total budgeted RN ' +
        'positions.',
      unit: '% of budgeted RN positions unfilled',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 17,
        basis:
          'RN vacancy depends on the local labour market, the specialty, ' +
          'and how aggressively positions are budgeted; the band spans a ' +
          'well-staffed operation to a strained one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The HCM / applicant-tracking system, comparing open requisitions ' +
        'against budgeted positions in the position-control file.',
      whyItMatters:
        'Vacancy is the gap the rest of the function pays to cover — every ' +
        'open position is filled by overtime, float, or agency at a ' +
        'premium, so the vacancy rate is the upstream driver of premium ' +
        'labour cost.',
    },
    {
      key: 'contract_agency_labor_pct',
      name: 'Contract / agency labour as a percent of worked hours',
      definition:
        'The share of total worked clinical hours delivered by contract, ' +
        'travel, or agency staff rather than by the employed workforce.',
      unit: '% of worked clinical hours',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 15,
        basis:
          'Agency reliance spiked during the workforce crisis and varies ' +
          'widely by market and specialty; the band spans a self-' +
          'sufficient operation to a heavily agency-dependent one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The time-and-attendance and vendor-management-system (VMS) data ' +
        'reconciled against total worked hours in the HCM system.',
      whyItMatters:
        'Agency hours cost a large multiple of an employed hour and carry ' +
        'no retention or culture value — the agency share is the clearest ' +
        'single measure of how much the workforce strain is costing.',
    },
    {
      key: 'premium_pay_pct',
      name: 'Premium-pay percentage',
      definition:
        'Premium-rate compensation — overtime, shift differentials, ' +
        'incentive and crisis-rate pay, on-call — as a share of total ' +
        'worked-hours compensation cost.',
      unit: '% of worked-hours labour cost',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 14,
        basis:
          'Premium pay rises with vacancy, absenteeism, and census ' +
          'volatility; the band spans a well-covered operation to one ' +
          'leaning hard on incentives to fill shifts. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The payroll and time-and-attendance system, isolating premium-' +
        'rate earnings codes from base-rate worked-hours pay.',
      whyItMatters:
        'Premium pay is the price of covering a gap reactively — a high ' +
        'figure signals the schedule is not absorbing variability and the ' +
        'function is buying coverage shift-by-shift at a markup.',
    },
    {
      key: 'overtime_pct',
      name: 'Overtime percentage',
      definition:
        'Overtime hours as a share of total worked clinical hours — the ' +
        'hours staff work beyond their scheduled and standard commitment.',
      unit: '% of worked clinical hours',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 9,
        basis:
          'Overtime depends on vacancy, scheduling discipline, and census ' +
          'volatility; the band spans a controlled operation to one ' +
          'covering chronic gaps with extra hours. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The time-and-attendance system, comparing overtime hours against ' +
        'total worked hours by unit.',
      whyItMatters:
        'Overtime is both a cost and a fatigue signal — sustained overtime ' +
        'covers a structural staffing gap while burning out the staff ' +
        'covering it, feeding the next departure.',
    },
    {
      key: 'hours_per_patient_day_variance',
      name: 'Hours-per-patient-day variance to target',
      definition:
        'The gap between actual worked nursing hours per patient day and ' +
        'the budgeted, acuity-adjusted target for the unit — measured as ' +
        'the variance, positive (over-staffed) or negative (under-' +
        'staffed).',
      unit: 'variance in hours per patient day vs. target',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: -1.5,
        high: 1.5,
        basis:
          'A well-run unit holds worked hours close to its acuity-adjusted ' +
          'target; the band is the tolerable variance either side before ' +
          'staffing is mismatched to demand. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The staffing / productivity system, comparing worked hours ' +
        'against the acuity-adjusted target volume from the patient-' +
        'classification system.',
      whyItMatters:
        'It is the core staffing-to-demand metric — a persistent negative ' +
        'variance is unsafe under-staffing, a persistent positive variance ' +
        'is avoidable cost, and the discipline is holding worked hours to ' +
        'the acuity actually present.',
    },
    {
      key: 'time_to_fill',
      name: 'Time to fill',
      definition:
        'The average elapsed time from a clinical requisition opening to ' +
        'an accepted offer for that position.',
      unit: 'days from requisition to accepted offer',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 40,
        high: 100,
        basis:
          'Time to fill varies with specialty scarcity, market, and the ' +
          'efficiency of the hiring process; the band spans a fast pipeline ' +
          'to a slow one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The applicant-tracking system, time-stamped from requisition ' +
        'opening to offer acceptance.',
      whyItMatters:
        'Every day a position is open is a day covered by premium labour — ' +
        'time to fill is the speed of the only durable fix for vacancy, ' +
        'and a slow pipeline keeps the premium-cost meter running.',
    },
    {
      key: 'float_pool_utilization',
      name: 'Float-pool utilisation rate',
      definition:
        'The share of available float-pool clinician hours that are ' +
        'actually deployed to cover a unit need, rather than going unused ' +
        'or being left idle.',
      unit: '% of available float-pool hours deployed',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'Float-pool utilisation depends on how well placement is matched ' +
          'to need and competency; the band spans an under-used pool to a ' +
          'well-deployed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The scheduling and staffing system, comparing deployed float ' +
        'hours against the available float-pool roster.',
      whyItMatters:
        'The float pool is the cheapest internal buffer against ' +
        'variability — an under-used pool means the organisation is paying ' +
        'for flexible capacity and then buying agency coverage instead.',
    },
    {
      key: 'onboarding_time_to_productivity',
      name: 'Onboarding time to productivity',
      definition:
        'The average elapsed time from a new clinical hire’s start date to ' +
        'the point they carry a full, independent patient assignment for ' +
        'their unit.',
      unit: 'weeks from hire to independent practice',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 6,
        high: 26,
        basis:
          'Time to productivity varies by role and specialty — a ' +
          'med-surg transfer is fast, a new-graduate ICU residency is long; ' +
          'the band spans those. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The learning-management and onboarding system, time-stamped from ' +
        'start date to sign-off on independent assignment.',
      whyItMatters:
        'Until a hire is independent they consume a preceptor’s capacity ' +
        'rather than adding their own — slow time to productivity blunts ' +
        'the return on every hire and delays relief from vacancy.',
    },
    {
      key: 'span_of_control',
      name: 'Span of control',
      definition:
        'The average number of direct-report staff per front-line nurse ' +
        'manager or clinical leader across the units in scope.',
      unit: 'direct reports per front-line manager',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 25,
        high: 80,
        basis:
          'Span of control varies with unit type and the support layer ' +
          'beneath the manager; the band spans a manageable span to one ' +
          'wide enough to erode retention and oversight. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The HCM organisational-hierarchy data, counting direct reports ' +
        'per front-line clinical manager.',
      whyItMatters:
        'An over-wide span leaves the manager unable to coach, round, or ' +
        'retain — manager span is a quietly powerful driver of turnover, ' +
        'because staff leave the relationship with their direct leader.',
    },
    {
      key: 'staffing_to_acuity_match_rate',
      name: 'Staffing-to-acuity match rate',
      definition:
        'The share of shifts where the staff assigned matched the ' +
        'acuity-adjusted demand of the unit within an acceptable tolerance ' +
        '— neither materially under- nor over-staffed for the patients ' +
        'present.',
      unit: '% of shifts matched to acuity within tolerance',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 90,
        basis:
          'Match rate depends on how far ahead and how accurately census ' +
          'and acuity are predicted and how flexible coverage is; the band ' +
          'spans a reactive operation to a well-forecast one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The staffing system, comparing assigned staff against the ' +
        'patient-classification acuity score by shift.',
      whyItMatters:
        'It is the quality-and-cost metric of staffing at once — a poor ' +
        'match is unsafe when under and wasteful when over, and improving ' +
        'it is the direct objective of predictive staffing.',
    },
    {
      key: 'engagement_index',
      name: 'Workforce engagement index',
      definition:
        'The composite score from the clinical-workforce engagement survey ' +
        '— intent to stay, perceived staffing adequacy, manager support, ' +
        'and recommendation of the organisation as a place to work.',
      unit: 'index score (survey scale)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 85,
        basis:
          'Engagement scores vary by instrument and normalised scale; the ' +
          'band spans a strained workforce to an engaged one on a typical ' +
          '0–100 normalised index. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-engagement survey platform, scored on a normalised ' +
        'index and segmented by unit and role.',
      whyItMatters:
        'Engagement is the leading indicator turnover is the lagging one — ' +
        'a falling engagement index, especially on staffing-adequacy and ' +
        'manager-support items, predicts the next wave of departures.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'agency_dependence',
      name: 'Structural agency dependence',
      description:
        'A persistent vacancy gap is filled month after month with ' +
        'contract, travel, and agency labour at a large cost multiple, and ' +
        'the dependence becomes structural — agency stops being a bridge ' +
        'and becomes the operating model, while the premium cost crowds out ' +
        'investment in the permanent workforce.',
      detectionSignal:
        'Contract / agency labour is a sustained, non-declining share of ' +
        'worked hours; agency cost is a material and growing line; agency ' +
        'staff backfill the same units quarter after quarter.',
      diagnosticQuestion:
        'What share of worked hours is agency, is it trending down or ' +
        'holding, and is there a costed plan to convert that dependence to ' +
        'permanent staff?',
    },
    {
      key: 'reactive_premium_coverage',
      name: 'Reactive premium-pay coverage',
      description:
        'Shift gaps are discovered late and closed reactively — with ' +
        'overtime, incentive and crisis-rate shifts, and last-minute ' +
        'call-ins — instead of being anticipated and absorbed by the ' +
        'schedule, so the function buys coverage shift-by-shift at a ' +
        'markup.',
      detectionSignal:
        'Premium pay and overtime are a high share of labour cost; ' +
        'incentive shifts spike close to the shift date; coverage is ' +
        'arranged hours, not weeks, ahead.',
      diagnosticQuestion:
        'How far ahead are shift gaps known, and how much of coverage is ' +
        'arranged reactively with overtime and incentive pay?',
    },
    {
      key: 'census_staffing_mismatch',
      name: 'Census-to-staffing mismatch',
      description:
        'Staffing is set to a static grid or to yesterday’s census rather ' +
        'than to a forecast of tomorrow’s acuity and volume, so units are ' +
        'over-staffed on a light day (avoidable cost) and under-staffed on ' +
        'a heavy one (an unsafe assignment and a burnout event).',
      detectionSignal:
        'Hours-per-patient-day variance to target is wide and swings both ' +
        'ways; the staffing-to-acuity match rate is low; staffing is set ' +
        'from a fixed grid.',
      diagnosticQuestion:
        'Is staffing set from a forecast of census and acuity, or from a ' +
        'static grid — and how often does the assignment miss the patients ' +
        'actually present?',
    },
    {
      key: 'turnover_spiral',
      name: 'Turnover and burnout spiral',
      description:
        'Vacancy and under-staffing increase the load on the remaining ' +
        'staff, the heavier load and overtime drive burnout, burnout ' +
        'drives the next departure — and each turn of the loop raises ' +
        'turnover, replacement cost, and the experience deficit on the ' +
        'unit.',
      detectionSignal:
        'Turnover and the engagement index are moving in opposite, ' +
        'worsening directions; departures cluster on the most-strained ' +
        'units; exit interviews cite workload and staffing.',
      diagnosticQuestion:
        'Where is turnover concentrated, what do exit interviews say is ' +
        'driving it, and is the engagement index falling ahead of it?',
    },
    {
      key: 'slow_hiring_pipeline',
      name: 'Slow hiring pipeline',
      description:
        'The hiring process — requisition approval, sourcing, interview ' +
        'scheduling, offer, credentialing — is slow and high-friction, so ' +
        'time to fill runs long, candidates are lost to faster competitors, ' +
        'and every open position keeps drawing premium coverage.',
      detectionSignal:
        'Time to fill is long; candidate drop-off between application and ' +
        'offer is high; requisitions sit in approval or interview-' +
        'scheduling stages.',
      diagnosticQuestion:
        'How long does it take to fill a clinical requisition, and which ' +
        'stage of the pipeline consumes the most time and loses the most ' +
        'candidates?',
    },
    {
      key: 'float_pool_underuse',
      name: 'Float-pool under-use and mismatch',
      description:
        'The float pool exists but is poorly deployed — placements are not ' +
        'matched to where the need is or to the floater’s validated ' +
        'competencies — so available internal flexible capacity sits idle ' +
        'while units fill the same gaps with agency or overtime.',
      detectionSignal:
        'Float-pool utilisation is low at the same time as agency and ' +
        'overtime are high; floaters are placed on units they are not ' +
        'competency-matched to.',
      diagnosticQuestion:
        'How fully is the float pool utilised, and is float placement ' +
        'matched to unit need and validated competency or assigned ad hoc?',
    },
    {
      key: 'onboarding_drag',
      name: 'Onboarding and time-to-productivity drag',
      description:
        'New hires take a long time to reach independent practice, and a ' +
        'share leave during or shortly after orientation — so the hiring ' +
        'effort does not convert into relief from vacancy, and preceptor ' +
        'capacity is consumed without a durable return.',
      detectionSignal:
        'Onboarding time to productivity is long; first-year turnover is a ' +
        'large share of total turnover; preceptors report sustained ' +
        'orientation load.',
      diagnosticQuestion:
        'How long until a new hire is independent, and what share of new ' +
        'hires leave within their first year?',
    },
    {
      key: 'credential_competency_gaps',
      name: 'Credential and competency gaps',
      description:
        'Licences, certifications, and unit-specific competencies lapse or ' +
        'go untracked, so a clinician is scheduled onto a shift or a unit ' +
        'they are not currently qualified for — a compliance exposure and a ' +
        'patient-safety risk discovered late, or not at all.',
      detectionSignal:
        'Credential expirations are found reactively; competency records ' +
        'are incomplete or held in disconnected systems; staff are placed ' +
        'on units outside their validated competency set.',
      diagnosticQuestion:
        'How are licences, certifications, and unit competencies tracked, ' +
        'and how confident is the function that everyone scheduled is ' +
        'currently qualified for the assignment?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'predictive_census_staffing',
      name: 'Predictive census-based staffing',
      valueMechanism:
        'A model forecasts unit-level census and acuity days ahead from ' +
        'admission, discharge, and transfer patterns, the surgical and ' +
        'admission schedule, and seasonality, and drives the staffing plan ' +
        'from that forecast rather than from a static grid. Value comes ' +
        'from matching staff to the patients who will actually be there — ' +
        'cutting both the over-staffed avoidable cost and the under-staffed ' +
        'unsafe shift, and shrinking the reactive premium coverage.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical census and admission-discharge-transfer (ADT) data by ' +
          'unit',
        'Patient-classification / acuity scores',
        'The forward surgical and scheduled-admission schedule',
        'Seasonal and day-of-week demand patterns',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model forecasts demand and proposes a staffing plan; the ' +
          'nurse manager or staffing office reviews and owns the final ' +
          'assignment.',
        'A forecast must never be used to staff below a safe minimum or a ' +
          'mandated ratio — the minimum is a floor the model cannot ' +
          'optimise through.',
        'A model trained on an under-staffed history will learn the ' +
          'under-staffing as normal — the target must be acuity-based need, ' +
          'not historical actuals.',
      ],
      metricsMoved: [
        'hours_per_patient_day_variance',
        'staffing_to_acuity_match_rate',
        'premium_pay_pct',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'ai_scheduling_self_scheduling',
      name: 'AI scheduling and self-scheduling',
      valueMechanism:
        'A model builds and continuously rebalances the staff schedule — ' +
        'matching the predicted demand to skills, competencies, ' +
        'preferences, fatigue rules, and contractual constraints — and ' +
        'opens a self-scheduling layer where staff claim and swap shifts ' +
        'within guardrails. Value comes from closing gaps earlier and more ' +
        'cheaply, raising the share of demand covered by base-rate hours, ' +
        'and improving the schedule fairness and predictability that drive ' +
        'retention.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Staff roster with skills, competencies, and unit qualifications',
        'Staff shift preferences and availability',
        'The forecast demand plan and the staffing target by unit',
        'Contractual, fatigue, and scheduling-rule constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes and rebalances the schedule; the manager ' +
          'approves it and owns any override, and self-scheduling operates ' +
          'inside explicit guardrails.',
        'Optimisation must respect fairness — it cannot concentrate the ' +
          'undesirable shifts on the staff least able to refuse them.',
        'Fatigue and consecutive-shift rules are hard constraints, not ' +
          'preferences the optimiser can trade against cost.',
      ],
      metricsMoved: [
        'premium_pay_pct',
        'overtime_pct',
        'engagement_index',
        'staffing_to_acuity_match_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'agency_spend_optimization',
      name: 'Agency-spend optimisation',
      valueMechanism:
        'A model analyses contingent-labour demand against the internal ' +
        'coverage options — open shifts, the float pool, internal-agency ' +
        'and incentive capacity — and against vendor rates and fill ' +
        'history, and recommends the lowest-cost compliant way to cover ' +
        'each gap, escalating to agency only when no cheaper internal ' +
        'option exists. Value comes from systematically displacing premium ' +
        'agency hours with internal capacity and from sourcing the agency ' +
        'hours that remain at the best rate.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Vendor-management-system rate, fill, and reliability data',
        'Internal coverage capacity — open shifts, float pool, incentive ' +
          'pool',
        'Historical contingent-labour demand by unit and specialty',
        'Worked-hours and worked-hours-cost data from payroll',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model recommends the coverage source; the staffing office ' +
          'owns the decision and the agency commitment.',
        'Cost minimisation must not push agency staff onto units or shifts ' +
          'they are not competency-cleared for — the qualification check ' +
          'overrides the cost ranking.',
        'A recommendation to displace agency assumes the internal capacity ' +
          'is genuinely available — the model must use real, not nominal, ' +
          'internal availability.',
      ],
      metricsMoved: [
        'contract_agency_labor_pct',
        'premium_pay_pct',
        'float_pool_utilization',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'attrition_risk_prediction',
      name: 'Attrition-risk prediction',
      valueMechanism:
        'A model scores clinical staff for the risk of leaving, drawing on ' +
        'tenure, scheduling and overtime load, engagement-survey signals, ' +
        'unit strain, and career-progression patterns, and surfaces the ' +
        'risk early so a manager can intervene with a retention ' +
        'conversation, a schedule change, or a development opportunity. ' +
        'Value comes from preventing departures before they happen — ' +
        'avoiding the replacement cost and the experience loss, and ' +
        'breaking the turnover spiral.',
      adoptionProfile: 'early',
      dataDependencies: [
        'HCM tenure, role-history, and compensation data',
        'Scheduling, overtime, and worked-hours-load data',
        'Workforce-engagement survey signals',
        'Unit-level turnover and strain history',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces a retention risk; the manager owns the ' +
          'conversation and the intervention — the score informs a human ' +
          'relationship, it does not replace it.',
        'A risk score must never be used adversely — to deny opportunity, ' +
          'shift, or development — only to prompt support; misuse destroys ' +
          'trust and is an ethical and legal exposure.',
        'The model must be checked for bias across role, demographic, and ' +
          'unit so it does not systematically mis-score any group.',
      ],
      metricsMoved: [
        'nurse_turnover_rate',
        'engagement_index',
        'rn_vacancy_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'float_pool_optimization',
      name: 'Float-pool optimisation',
      valueMechanism:
        'A model matches available float-pool clinicians to unit needs by ' +
        'predicted demand, validated competency, and travel and continuity ' +
        'constraints, and recommends the placement that covers the most ' +
        'gaps with the internal flexible workforce. Value comes from ' +
        'raising float-pool utilisation so the cheapest internal buffer is ' +
        'used fully before the function reaches for overtime or agency.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The float-pool roster with validated unit competencies',
        'Predicted unit-level demand and open-shift gaps',
        'Float-clinician availability and placement history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends placements; the staffing office confirms ' +
          'them and owns any reassignment.',
        'A floater can only be placed on a unit their competency record ' +
          'validates — utilisation is never raised by placing staff ' +
          'outside their qualified scope.',
        'Placement should weigh continuity and floater experience, not ' +
          'only gap-coverage maths — churn within the pool itself is a ' +
          'retention risk.',
      ],
      metricsMoved: [
        'float_pool_utilization',
        'contract_agency_labor_pct',
        'staffing_to_acuity_match_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'credential_competency_management',
      name: 'Credential and competency management',
      valueMechanism:
        'An agent tracks every clinician’s licences, certifications, and ' +
        'unit-specific competencies across the source systems, predicts ' +
        'upcoming expirations, prompts timely renewal and competency ' +
        'completion, and validates at the point of scheduling that the ' +
        'person assigned is currently qualified for the unit and shift. ' +
        'Value comes from removing the compliance and patient-safety risk ' +
        'of an under-qualified assignment and the manual effort of tracking ' +
        'credentials by hand.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Licence, certification, and competency records from the HCM and ' +
          'learning-management systems',
        'Primary-source verification data where required',
        'Unit-level competency and qualification requirements',
        'The schedule and assignment data',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent tracks, predicts, and flags; a clinician or HR ' +
          'professional owns any credentialing decision and the ' +
          'verification of a contested record.',
        'A scheduling validation must fail safe — an unverified or ' +
          'ambiguous credential blocks the assignment until a human ' +
          'resolves it, it does not pass by default.',
        'Competency records must be primary-source-verified where ' +
          'regulation requires it — the agent cannot infer a qualification ' +
          'the source data does not establish.',
      ],
      metricsMoved: [
        'staffing_to_acuity_match_rate',
        'onboarding_time_to_productivity',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'demand_driven_staffing_layer',
      name: 'Demand-driven staffing layer',
      description:
        'A pattern that drives the staffing plan from a forward census-and-' +
        'acuity forecast rather than a static grid — predicting unit ' +
        'demand days ahead and proposing a staffing plan matched to the ' +
        'acuity that will actually be present, with safe-minimum and ' +
        'ratio floors built in as hard constraints.',
      boundary:
        'It forecasts demand and proposes a plan; the nurse manager or ' +
        'staffing office reviews and owns the final assignment. It cannot ' +
        'staff below a safe minimum or a mandated ratio.',
      humanAccountabilityPoint:
        'The chief nursing officer accountable for safe staffing and the ' +
        'labour budget.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'optimized_scheduling_with_self_service',
      name: 'Optimised-scheduling-with-self-service pattern',
      description:
        'A pattern that builds and continuously rebalances the schedule ' +
        'against demand, skills, fatigue rules, and contractual ' +
        'constraints, and pairs it with a self-scheduling layer where ' +
        'staff claim and swap shifts inside guardrails — closing gaps ' +
        'earlier and at base rate while improving the fairness and ' +
        'predictability that retain staff.',
      boundary:
        'It optimises and proposes; the manager approves the schedule and ' +
        'owns overrides, and self-scheduling runs inside explicit ' +
        'guardrails. Fatigue and contractual rules are hard constraints.',
      humanAccountabilityPoint:
        'The nurse manager accountable for the unit schedule and shift ' +
        'coverage.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'internal_first_coverage_pattern',
      name: 'Internal-first coverage pattern',
      description:
        'A pattern that, for every coverage gap, ranks the options by cost ' +
        'and exhausts the cheaper internal sources — open base-rate shifts, ' +
        'the float pool, internal-agency and incentive capacity — before ' +
        'escalating to external agency, and sources any remaining agency ' +
        'hours at the best compliant rate.',
      boundary:
        'It ranks and recommends the coverage source; the staffing office ' +
        'owns the decision and the agency commitment. Competency clearance ' +
        'overrides the cost ranking.',
      humanAccountabilityPoint:
        'The staffing-office director accountable for contingent-labour ' +
        'cost and coverage.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'retention_early_warning_pattern',
      name: 'Retention early-warning pattern',
      description:
        'A pattern that combines attrition-risk scoring with engagement ' +
        'signals and unit-strain indicators to surface retention risk — ' +
        'at the individual and the unit level — early enough for a manager ' +
        'to intervene with support before a departure becomes a decision.',
      boundary:
        'It surfaces the risk and the contributing signals; the manager ' +
        'owns the retention conversation and intervention. The score is ' +
        'used only to prompt support, never adversely.',
      humanAccountabilityPoint:
        'The nurse manager and HR business partner accountable for ' +
        'workforce retention on the unit.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'credential_assurance_pattern',
      name: 'Credential-and-competency assurance pattern',
      description:
        'A pattern that maintains a continuously current view of every ' +
        'clinician’s licences, certifications, and unit competencies, ' +
        'predicts and prompts upcoming expirations, and validates ' +
        'qualification at the point of scheduling so no clinician is ' +
        'assigned to a unit or shift they are not currently cleared for.',
      boundary:
        'It tracks, predicts, and validates; a clinician or HR ' +
        'professional owns any credentialing decision. A scheduling ' +
        'validation fails safe — an ambiguous credential blocks the ' +
        'assignment.',
      humanAccountabilityPoint:
        'The chief nursing officer and credentialing lead accountable for ' +
        'a qualified workforce.',
      controlPosture: 'human-approval-required',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Clinical-workforce value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, premium-labour reduction: ' +
      'better demand forecasting, earlier scheduling, fuller float-pool ' +
      'use, and internal-first coverage displace agency, overtime, and ' +
      'incentive hours with base-rate hours — a recurring reduction in ' +
      'labour cost. Second, retention value: predicting and preventing ' +
      'departures avoids the large replacement, orientation, and lost-' +
      'productivity cost of turnover, and — because turnover and premium ' +
      'cost are coupled — a more stable workforce lowers the vacancy that ' +
      'drove the premium spend in the first place. Third, productivity ' +
      'and safety: matching staff to acuity reduces both the over-staffed ' +
      'avoidable cost and the under-staffed unsafe shift, and faster ' +
      'onboarding converts hiring effort into coverage sooner. The ' +
      'dominant constraint is that the largest, most durable value — the ' +
      'retention and premium-displacement gain — is paced by the labour ' +
      'market and by manager capacity to act on what the models surface; ' +
      'a tool that flags a retention risk into an over-stretched manager ' +
      'changes nothing. Premium and productivity gains are recurring; ' +
      'they compound as the turnover spiral is broken, but only at the ' +
      'speed the market and the management layer allow.',
    dominantHaircutFactors: [
      {
        factor: 'Labour-market scarcity',
        rationale:
          'The durable fix for premium cost is filling vacancy with ' +
          'permanent staff, and that depends on a labour market the ' +
          'provider does not control. In a scarce market, faster hiring ' +
          'and better retention still cannot close the gap, so a large ' +
          'share of the modelled premium-displacement value is unreachable.',
        typicalHaircut: {
          low: 0.25,
          high: 0.5,
          basis:
            'The share of a modelled premium-labour-reduction gain not ' +
            'reachable because of labour-market scarcity outside the ' +
            'provider’s control; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Manager capacity and management-layer adoption',
        rationale:
          'Attrition scores, retention prompts, and schedule changes only ' +
          'create value if a front-line manager has the capacity and the ' +
          'capability to act on them. Where span of control is wide and ' +
          'managers are over-stretched, the insight is generated and not ' +
          'used.',
        typicalHaircut: {
          low: 0.2,
          high: 0.4,
          basis:
            'Forecast erosion from limited front-line-manager capacity to ' +
            'act on the models’ output; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Workforce data quality and integration',
        rationale:
          'Forecasting, scheduling, attrition modelling, and credential ' +
          'validation depend on accurate, integrated HCM, time-and-' +
          'attendance, scheduling, acuity, and competency data. Fragmented ' +
          'or stale workforce data caps how much of the modelled value can ' +
          'be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from fragmented or stale workforce-system ' +
            'data; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Labour-relations and contractual constraints',
        rationale:
          'Scheduling, self-scheduling, float deployment, and coverage ' +
          'optimisation operate inside collective-bargaining terms, ' +
          'seniority rules, and fatigue and ratio mandates. Those ' +
          'constraints are non-negotiable and bound how far the optimiser ' +
          'can move the modelled value.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled scheduling-optimisation gain bounded ' +
            'by contractual and regulatory staffing constraints; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Contract / agency-labour cost reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in contingent-labour cost from internal-' +
            'first coverage, better forecasting, and fuller float-pool ' +
            'use; a planning range spanning early and mature adoption and ' +
            'market conditions.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in contract / agency labour cost.',
      },
      {
        lever: 'Premium-pay and overtime reduction',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative reduction in premium-pay and overtime cost from ' +
            'earlier, demand-matched scheduling; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in premium-pay and overtime cost.',
      },
      {
        lever: 'Nurse-turnover-rate reduction',
        range: {
          low: 2,
          high: 8,
          basis:
            'Percentage-point reduction in the annual nurse turnover rate ' +
            'from earlier retention intervention and a more sustainable ' +
            'schedule; a planning range, paced by the labour market.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point reduction in the annual nurse turnover rate.',
      },
      {
        lever: 'Onboarding-time-to-productivity compression',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in the time from hire to independent ' +
            'practice from a structured, tracked onboarding pathway; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in onboarding time to productivity.',
      },
    ],
    timeToValueBand:
      '3–6 months to first measurable operational signal (premium-pay ' +
      'and overtime share, schedule-gap timing, float-pool utilisation); ' +
      '12–24 months to a settled result on turnover and vacancy, because ' +
      'retention gains compound slowly as the turnover spiral is broken ' +
      'and a full hiring-and-tenure cycle must pass to prove them.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Human-capital-management (HCM) system',
        role:
          'The system of record for the workforce — employee records, ' +
          'position control, compensation, organisational hierarchy, and ' +
          'separations. The backbone of turnover, vacancy, and span-of-' +
          'control measurement.',
        examples: [
          'Workday HCM',
          'Oracle / PeopleSoft HCM',
          'UKG Pro',
        ],
      },
      {
        name: 'Workforce-management / scheduling system',
        role:
          'Manages the staffing plan, the schedule, shift coverage, the ' +
          'float pool, and self-scheduling — the operational layer where ' +
          'staff are matched to shifts.',
        examples: [
          'UKG / Kronos workforce management',
          'symplr / API Healthcare scheduling',
          'Epic clinical-staffing modules',
        ],
      },
      {
        name: 'Time-and-attendance and payroll system',
        role:
          'Captures worked hours, overtime, premium-rate earnings, and ' +
          'pay — the source of the worked-hours, overtime, and premium-pay ' +
          'metrics.',
        examples: [
          'UKG / Kronos timekeeping',
          'Workday payroll',
          'ADP payroll',
        ],
      },
      {
        name: 'Patient-classification / acuity system',
        role:
          'Scores patient acuity and care intensity by unit and shift — ' +
          'the demand signal that turns a head-count target into an ' +
          'acuity-adjusted staffing target.',
        examples: [
          'QuadraMed / acuity classification tools',
          'Epic Acuity',
          'unit-based patient-classification systems',
        ],
      },
      {
        name: 'Vendor-management system (VMS) and contingent-labour ' +
          'platform',
        role:
          'Manages contract, travel, and agency labour — requisitions, ' +
          'vendor rates, fill, and reliability — the source of the agency-' +
          'cost and contingent-labour data.',
        examples: [
          'symplr workforce / contingent management',
          'Medical Solutions / agency VMS platforms',
          'internal-agency and float-management tools',
        ],
      },
      {
        name: 'Applicant-tracking and learning-management systems',
        role:
          'The applicant-tracking system runs the hiring pipeline and ' +
          'time-to-fill; the learning-management system holds onboarding, ' +
          'competency, and certification records.',
        examples: [
          'iCIMS / Workday Recruiting',
          'HealthStream learning and competency management',
          'Cornerstone OnDemand',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Nursing Officer / Chief Nurse Executive',
        accountability:
          'Owns safe staffing, the nursing workforce, the labour budget, ' +
          'and the nurse-retention and engagement outcome.',
      },
      {
        title: 'Director of staffing / staffing-office director',
        accountability:
          'Owns shift coverage, the float pool, contingent-labour ' +
          'sourcing, and the day-to-day staffing operation.',
      },
      {
        title: 'Nurse manager / front-line clinical manager',
        accountability:
          'Owns the unit schedule, the unit budget, and the engagement ' +
          'and retention of the unit’s staff.',
      },
      {
        title: 'Chief Human Resources Officer / VP Talent Acquisition',
        accountability:
          'Owns recruitment, the hiring pipeline, time to fill, and total ' +
          'workforce planning.',
      },
      {
        title: 'Workforce / labour-analytics leader',
        accountability:
          'Owns the productivity and labour-cost analytics — hours per ' +
          'patient day, premium pay, agency share — and the staffing grid.',
      },
      {
        title: 'Nurse educator / professional-development lead',
        accountability:
          'Owns onboarding, the competency framework, and time to ' +
          'productivity for new clinical hires.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'State nurse-staffing-ratio and staffing-plan laws',
        relevance:
          'Set mandated minimum nurse-to-patient ratios or staffing-' +
          'committee plan requirements — a hard floor that any staffing ' +
          'optimisation must respect and can never optimise through.',
      },
      {
        name: 'Fair Labor Standards Act and overtime regulation',
        relevance:
          'Governs overtime eligibility, premium-rate pay, and worked-' +
          'hours rules — the legal frame around premium pay, overtime, and ' +
          'scheduling.',
      },
      {
        name: 'Collective-bargaining agreements and labour-relations law',
        relevance:
          'Set seniority, scheduling, floating, and shift-assignment ' +
          'rules for represented staff — non-negotiable constraints the ' +
          'scheduling and float models operate inside.',
      },
      {
        name: 'Joint Commission staffing-effectiveness and competency ' +
          'standards',
        relevance:
          'Require staffing to be matched to patient need and every ' +
          'clinician to be competency-validated for their assignment — the ' +
          'accreditation frame around staffing and credentialing.',
      },
      {
        name: 'State licensure and primary-source-verification ' +
          'requirements',
        relevance:
          'Mandate that clinical licences and certifications be current ' +
          'and, where required, primary-source-verified — the rule the ' +
          'credential-management use case must enforce.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Hours per patient day (HPPD)',
        definition:
          'The worked nursing hours delivered per patient day on a unit — ' +
          'the core measure of staffing intensity, judged against an ' +
          'acuity-adjusted target.',
      },
      {
        term: 'Staffing grid',
        definition:
          'The predefined matrix that sets the number and skill mix of ' +
          'staff for a unit at each census level — the traditional, static ' +
          'basis of a staffing plan.',
      },
      {
        term: 'Float pool',
        definition:
          'A roster of clinicians not assigned to a single unit, deployed ' +
          'flexibly to cover need across units they are competency-' +
          'qualified for.',
      },
      {
        term: 'Premium pay',
        definition:
          'Compensation above the base rate — overtime, shift ' +
          'differentials, incentive and crisis-rate pay, and on-call.',
      },
      {
        term: 'Contingent / agency labour',
        definition:
          'Clinical staff supplied by an external agency or as travel or ' +
          'contract workers, billed at a rate well above an employed hour.',
      },
      {
        term: 'Acuity',
        definition:
          'The intensity of nursing care a patient requires, scored by a ' +
          'patient-classification system to adjust the staffing target ' +
          'above a raw head count.',
      },
      {
        term: 'Time to fill',
        definition:
          'The elapsed time from a position requisition opening to an ' +
          'accepted offer for that position.',
      },
      {
        term: 'Span of control',
        definition:
          'The number of direct-report staff a single front-line manager ' +
          'is responsible for.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Clinical-Workforce-and-Staffing Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the clinical workforce is over-spending and where ' +
        'it is under- or mis-staffing — premium labour, agency dependence, ' +
        'turnover, census mismatch — with baseline evidence, before a ' +
        'solution is shaped.',
      sections: [
        {
          heading: 'Operation and workforce context',
          guidance:
            'Name the workforce operation in scope — facilities, the units ' +
            'and specialties, the headcount and skill mix, the labour-' +
            'market conditions, and whether any staff are represented by a ' +
            'collective-bargaining agreement. State which HCM, workforce-' +
            'management, time-and-attendance, acuity, and VMS systems are ' +
            'in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — nurse turnover, RN vacancy, agency share, ' +
            'premium pay, overtime, hours-per-patient-day variance, time ' +
            'to fill, float-pool utilisation, onboarding time to ' +
            'productivity, span of control, staffing-to-acuity match, ' +
            'engagement index. For any metric not recorded, name it as a ' +
            'precise seed gap with its data source.',
        },
        {
          heading: 'Premium-labour and agency-dependence analysis',
          guidance:
            'Break down premium-labour cost — overtime, incentive, ' +
            'agency — by unit and driver, separate structural agency ' +
            'dependence from genuine bridge use, and trace how much of the ' +
            'premium spend traces back to vacancy and how much to census ' +
            'volatility.',
        },
        {
          heading: 'Turnover, retention, and census-mismatch analysis',
          guidance:
            'Analyse where turnover is concentrated, what exit interviews ' +
            'and the engagement index say is driving it, and how often ' +
            'staffing misses the acuity present — connecting the turnover ' +
            'spiral and the census-mismatch failure modes.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — agency dependence, reactive ' +
            'premium coverage, census-staffing mismatch, the turnover ' +
            'spiral, slow hiring pipeline, float-pool under-use, onboarding ' +
            'drag, credential and competency gaps — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — agency and premium-pay reduction, turnover ' +
            'reduction, onboarding compression — explicitly haircut by ' +
            'labour-market scarcity, manager capacity, data quality, and ' +
            'contractual constraints. Every figure a labelled planning ' +
            'range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'acuity-adjusted targets, exit-interview data — is a named ask, ' +
            'not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Clinical-Workforce-and-Staffing Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO- and CNO-readable case for funding a ' +
        'clinical-workforce AI Move on this operation — baseline, forecast, ' +
        'cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring premium-labour reduction, retention value, and ' +
            'productivity gain, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — agency share, premium pay, turnover, hours-per-' +
            'patient-day variance. Where a baseline is a seed gap (acuity-' +
            'adjusted targets are a common one), say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — labour-market ' +
            'scarcity, manager capacity, data quality, contractual ' +
            'constraints — explicitly and show the haircut math. Be honest ' +
            'that the largest gains are paced by the market and the ' +
            'management layer.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the HCM, workforce-' +
            'management, time-and-attendance, acuity, and VMS systems, and ' +
            'the operating-model change — manager enablement and the ' +
            'staffing-office workflow change.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a tighter labour market, ' +
            'over-stretched managers, and partial adoption. State the ' +
            'downside the CFO and CNO are underwriting.',
        },
        {
          heading: 'Safety and workforce-trust posture',
          guidance:
            'State how safe-minimum and ratio floors are enforced, how ' +
            'attrition scoring is protected from adverse use, and how ' +
            'scheduling optimisation respects fairness and contractual ' +
            'terms — the trust the workforce is being asked to extend.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            '— for example, workforce data too fragmented to model, or no ' +
            'manager capacity to act — and the evidence that must be in ' +
            'hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including the ' +
            'lagged turnover, vacancy, and engagement metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Clinical-Workforce-and-Staffing Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'clinical-workforce AI capability, grounded in the function ' +
        'reference patterns, the safety floors, and the labour-relations ' +
        'frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — demand-driven staffing layer, optimised scheduling ' +
            'with self-service, internal-first coverage, retention early ' +
            'warning, credential-and-competency assurance — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the HCM, workforce-management, time-and-attendance, ' +
            'acuity, VMS, applicant-tracking, and learning-management ' +
            'integrations, the data latency, and the workforce-data-' +
            'quality baseline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define the safe-minimum and ratio floors as ' +
            'hard constraints and the fail-safe behaviour for credential ' +
            'validation.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the staffing-office, nurse-manager, recruitment, ' +
            'and credentialing workflows change, how managers are enabled ' +
            'to act on retention insight, and who owns each change.',
        },
        {
          heading: 'Safety, responsible-AI, and labour-relations controls',
          guidance:
            'State the safe-staffing and ratio floors, the protection of ' +
            'attrition scores from adverse use, the bias checks across ' +
            'role and demographic, the fairness constraints on scheduling, ' +
            'and the regulatory and contractual frames (staffing-ratio ' +
            'law, FLSA, collective bargaining, Joint Commission, ' +
            'licensure) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and ' +
            'the phased rollout across units and facilities.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Clinical-Workforce-and-Staffing Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the clinical-workforce AI ' +
        'capability so value reaches labour cost and workforce stability, ' +
        'not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot unit or service line, manager enablement, scale across ' +
            'units — with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, staffing-office workflow, manager enablement, ' +
            'recruitment and credentialing, labour-relations engagement, ' +
            'Tower measurement.',
        },
        {
          heading: 'Manager enablement and adoption approach',
          guidance:
            'Define the change runway for nurse managers and the staffing ' +
            'office — training, workflow change, and the capacity managers ' +
            'need to act on retention and scheduling insight — and how ' +
            'adoption is measured, not assumed.',
        },
        {
          heading: 'Workforce-trust and labour-relations plan',
          guidance:
            'Define how the workforce and any bargaining unit are engaged ' +
            'on scheduling change, self-scheduling, and attrition scoring — ' +
            'the transparency and the safeguards that make the capability ' +
            'feel supportive, not surveillance.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged turnover and engagement ' +
            'metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — labour-market scarcity, limited ' +
            'manager capacity, fragmented workforce data, labour-relations ' +
            'friction, partial adoption — with the escalation owner and ' +
            'the trigger for each.',
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
      claim: 'The nurse turnover rate and where turnover concentrates',
      authoritativeSource:
        'The HCM-system separation records reconciled against the average ' +
        'RN headcount, segmented by unit, tenure, and separation reason.',
      whatGoodEvidenceLooksLike:
        'A turnover rate computed on a consistent rolling-year basis, ' +
        'broken down by unit and tenure, with first-year turnover ' +
        'separated and exit-interview reasons attached.',
      weakEvidenceToReject:
        'A blended organisation-wide turnover figure with no unit or ' +
        'tenure breakdown, or a rate whose headcount denominator and ' +
        'period are not defined.',
    },
    {
      claim: 'Premium-labour and agency cost and what drives it',
      authoritativeSource:
        'The payroll and time-and-attendance system for premium-rate ' +
        'earnings and overtime, reconciled with VMS data for contingent-' +
        'labour cost.',
      whatGoodEvidenceLooksLike:
        'Premium-pay, overtime, and agency cost isolated by earnings code ' +
        'and vendor, broken down by unit, and traced to its driver — ' +
        'vacancy or census volatility.',
      weakEvidenceToReject:
        'A total labour-cost figure that does not isolate premium and ' +
        'agency components, or an agency cost with no link to the ' +
        'vacancy it covers.',
    },
    {
      claim: 'Staffing matched to acuity — the safety-and-cost evidence',
      authoritativeSource:
        'The staffing / productivity system, comparing worked hours ' +
        'against the acuity-adjusted target from the patient-' +
        'classification system by shift.',
      whatGoodEvidenceLooksLike:
        'Worked hours per patient day against an acuity-adjusted target ' +
        'by unit and shift, with the variance and the share of shifts ' +
        'under- and over-staffed quantified.',
      weakEvidenceToReject:
        'A raw nurse-to-patient head-count ratio with no acuity ' +
        'adjustment, or a staffing claim measured against a static grid ' +
        'rather than the patients actually present.',
    },
    {
      claim: 'The retention signal — engagement ahead of turnover',
      authoritativeSource:
        'The workforce-engagement survey platform scored on a normalised ' +
        'index and segmented by unit and role, read alongside the ' +
        'turnover trend.',
      whatGoodEvidenceLooksLike:
        'An engagement index segmented to the unit level, with staffing-' +
        'adequacy and manager-support items isolated, tracked as a ' +
        'leading indicator against the lagging turnover rate.',
      weakEvidenceToReject:
        'A single organisation-wide engagement score with no segmentation, ' +
        'or an attrition claim with no engagement or exit-interview ' +
        'evidence behind it.',
    },
    {
      claim: 'The forecast value of a clinical-workforce AI Move',
      authoritativeSource:
        'The value model — premium-labour-reduction, retention-value, and ' +
        'productivity components, each haircut by its dominant factors — ' +
        'read against the specific labour market and contractual context.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring premium and productivity ' +
        'gains separated from slow-compounding retention value, and every ' +
        'figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores labour-market scarcity or ' +
        'manager capacity to act.',
    },
  ],
};
