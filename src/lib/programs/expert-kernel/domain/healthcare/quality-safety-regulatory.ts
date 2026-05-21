// Domain Function Pack — Healthcare provider · Clinical quality, patient safety
// & regulatory compliance.
//
// Function key: `quality_safety_regulatory`.
//
// This is the function that owns whether care is safe, whether it is good, and
// whether the organisation can prove both to the bodies that license, accredit,
// and pay it. It runs three tightly-coupled disciplines that are usually
// managed as one: patient safety (preventing and learning from harm — the
// safety-event system, root-cause analysis, the harm-prevention bundles),
// clinical quality (the measured outcomes — mortality, readmissions, the CMS
// and Star measure portfolio, the PSI composite), and regulatory compliance
// (continuous readiness for CMS Conditions of Participation and Joint
// Commission survey, and the abstraction and attestation behind every reported
// measure). The function fails quietly: harm that is never reported cannot be
// learned from, a measure abstracted late or wrongly understates genuinely
// good care, and a Condition-of-Participation gap discovered by a surveyor
// rather than by the organisation becomes a finding instead of a fix. It is
// the function where the cost of being wrong is a patient, a citation, or a
// reimbursement penalty — so the discipline on evidence and on human
// accountability is stricter here than anywhere else in the provider.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const qualitySafetyRegulatoryPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'quality_safety_regulatory',
  functionLabel: 'Clinical quality, patient safety & regulatory compliance',
  summary:
    'Clinical quality, patient safety & regulatory compliance is the function ' +
    'that owns whether care is safe, whether it is measurably good, and ' +
    'whether the organisation can prove both to its regulators, accreditors, ' +
    'and payers. It runs the patient-safety system — event reporting, serious-' +
    'safety-event review, root-cause analysis, and the harm-prevention ' +
    'bundles — the clinical-quality portfolio — risk-adjusted mortality and ' +
    'readmissions, hospital-acquired conditions, the patient-safety-indicator ' +
    'composite, and the CMS and Star measure set — and the regulatory ' +
    'readiness discipline that keeps the organisation continuously compliant ' +
    'with CMS Conditions of Participation and Joint Commission standards. The ' +
    'function fails quietly and expensively: unreported harm cannot be ' +
    'learned from, a measure abstracted late or inaccurately understates care ' +
    'the organisation genuinely delivered, and a compliance gap found by a ' +
    'surveyor rather than by the organisation becomes a citation instead of a ' +
    'correction. It is the function where being wrong costs a patient, a ' +
    'finding, or a reimbursement penalty — and where evidence discipline and ' +
    'human accountability are held to the highest bar in the provider.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'hospital_acquired_condition_rate',
      name: 'Hospital-acquired-condition (HAC) rate',
      definition:
        'The rate of conditions a patient acquires during the hospital stay ' +
        'that were not present on admission — pressure injuries, ' +
        'catheter-associated urinary tract infections, central-line ' +
        'bloodstream infections, falls with injury, and the other ' +
        'CMS-designated hospital-acquired conditions — expressed per 1,000 ' +
        'patient-days or as the CMS HAC-Reduction-Program composite.',
      unit: 'HAC events per 1,000 patient-days (or HAC-RP composite score)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1.5,
        high: 6,
        basis:
          'Aggregate hospital-acquired-condition rates vary widely with case ' +
          'mix, acuity, and the maturity of harm-prevention bundles; ' +
          'condition-specific rates (CLABSI, CAUTI, pressure injury) each ' +
          'have their own band. A planning range — place the point with the ' +
          "tenant's case mix and the conditions actually being tracked.",
        label: 'planning-range',
      },
      dataSource:
        'Infection-prevention surveillance system and the patient-safety / ' +
        'incident system, reconciled against coded present-on-admission ' +
        'indicators in the EHR.',
      whyItMatters:
        'Hospital-acquired conditions are direct, largely preventable patient ' +
        'harm; they also carry CMS payment penalties under the HAC Reduction ' +
        'Program, so the rate is simultaneously a safety outcome and a ' +
        'reimbursement exposure.',
    },
    {
      key: 'risk_adjusted_readmission_rate',
      name: 'Risk-adjusted 30-day readmission rate',
      definition:
        'The share of index admissions followed by an unplanned readmission ' +
        'within 30 days, risk-adjusted for case mix and patient complexity ' +
        'so the rate reflects care quality rather than the sickness of the ' +
        'population.',
      unit: '% of index admissions, risk-adjusted',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 12,
        high: 20,
        basis:
          'Risk-adjusted all-cause readmission rates sit in a band that ' +
          'varies by condition cohort (heart failure and COPD run higher) ' +
          'and by the strength of transitional care; the CMS Hospital ' +
          'Readmissions Reduction Program targets the condition-specific ' +
          'measures. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'EHR encounter and admission data reconciled against claims and the ' +
        'CMS readmission-measure specifications.',
      whyItMatters:
        'Readmissions are a quality signal and a HRRP payment exposure at ' +
        'once; a readmission is also a patient who did not have a durable ' +
        'recovery, making the rate a shared quality and cost metric.',
    },
    {
      key: 'risk_adjusted_mortality_index',
      name: 'Risk-adjusted mortality index',
      definition:
        'The ratio of observed in-hospital (or 30-day) deaths to the deaths ' +
        'expected given the population\'s case mix and severity — an index ' +
        'of 1.0 means observed equals expected, below 1.0 means fewer deaths ' +
        'than predicted.',
      unit: 'observed-to-expected ratio (index)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.7,
        high: 1.1,
        basis:
          'Risk-adjusted mortality indices cluster around 1.0 by ' +
          'construction; sustained performance below 1.0 indicates ' +
          'better-than-expected outcomes, above 1.0 warrants investigation. ' +
          'The band depends heavily on the risk-adjustment model used. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'A risk-adjustment / clinical-outcomes platform (e.g. Vizient, ' +
        'Premier) fed by coded EHR and claims data.',
      whyItMatters:
        'Mortality is the gravest quality outcome; the risk-adjusted index ' +
        'is the only fair way to compare it across populations and is a core ' +
        'measure in public quality ratings and accreditation review.',
    },
    {
      key: 'serious_safety_event_rate',
      name: 'Serious-safety-event / never-event rate',
      definition:
        'The rate of serious safety events — events reaching a patient and ' +
        'causing moderate-to-severe harm or death, including the National ' +
        'Quality Forum "never events" — typically expressed per 10,000 ' +
        'adjusted patient-days and tracked as a rolling rate.',
      unit: 'serious safety events per 10,000 adjusted patient-days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.1,
        high: 1.0,
        basis:
          'Serious-safety-event rates are low-count and depend heavily on a ' +
          'consistent harm-severity classification; high-reliability ' +
          'organisations drive the rate toward the low end while keeping ' +
          'reporting culture strong. A planning range — a near-zero rate can ' +
          'mean excellent safety or under-reporting, and the two must be ' +
          'distinguished.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-safety / incident-reporting system with a harm-severity ' +
        'classification applied at safety-event review.',
      whyItMatters:
        'Serious safety events are the events the safety system exists to ' +
        'prevent and learn from; the rate is the headline patient-safety ' +
        'outcome and the trigger for mandatory root-cause analysis.',
    },
    {
      key: 'sepsis_bundle_compliance',
      name: 'Sepsis-bundle compliance rate',
      definition:
        'The share of eligible sepsis and septic-shock patients who receive ' +
        'every element of the time-bound sepsis bundle (the SEP-1 measure ' +
        'elements — lactate, blood cultures, antibiotics, fluids, ' +
        'reassessment) within the specified windows.',
      unit: '% of eligible sepsis patients with full bundle compliance',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 85,
        basis:
          'SEP-1 all-or-nothing bundle compliance sits in a wide band ' +
          'because every element must be met within its window; ' +
          'high-performing programs push the upper end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Quality-measure abstraction against the EHR, reconciled with the ' +
        'sepsis-screening and order-set data.',
      whyItMatters:
        'Sepsis is a leading cause of in-hospital mortality and timely ' +
        'bundle delivery measurably saves lives; SEP-1 is also a reported ' +
        'CMS measure, so compliance is both a clinical and a reporting ' +
        'outcome.',
    },
    {
      key: 'hand_hygiene_compliance',
      name: 'Hand-hygiene compliance rate',
      definition:
        'The share of observed hand-hygiene opportunities at which staff ' +
        'perform hand hygiene correctly, measured by direct observation or ' +
        'an electronic monitoring system.',
      unit: '% of observed hand-hygiene opportunities',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 95,
        basis:
          'Observed hand-hygiene compliance varies sharply with measurement ' +
          'method — direct observation is prone to the Hawthorne effect and ' +
          'reads higher than electronic monitoring. A planning range; state ' +
          'the measurement method when placing the point.',
        label: 'planning-range',
      },
      dataSource:
        'Direct-observation audit program or an electronic hand-hygiene ' +
        'monitoring system, with infection-prevention as the owner.',
      whyItMatters:
        'Hand hygiene is the single most effective infection-prevention ' +
        'practice; compliance is a leading indicator that moves before ' +
        'healthcare-associated-infection rates do.',
    },
    {
      key: 'cms_star_measure_performance',
      name: 'CMS quality / Star measure performance',
      definition:
        'Aggregate performance across the CMS-reported quality measure ' +
        'portfolio that drives public ratings — the Hospital Compare star ' +
        'rating, the Medicare Advantage / Part C & D Star Ratings for ' +
        'plan-aligned populations — expressed as the overall star level or ' +
        'the weighted measure-score composite.',
      unit: 'star rating (1–5) or weighted measure-score composite',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 3,
        high: 5,
        basis:
          'Overall CMS star ratings are distributed across the 1–5 scale ' +
          'with most organisations clustered in the middle; movement is ' +
          'slow and measure-weighting changes shift the band year to year. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CMS measure submission and the quality-measure / Stars ' +
        'management platform, reconciled against abstracted and ' +
        'claims-derived measure data.',
      whyItMatters:
        'CMS quality and Star performance drives public reputation, payer ' +
        'and patient choice, and — for Star-rated populations — directly ' +
        'links to bonus payments and rebate dollars; it is the most visible ' +
        'external scorecard the function owns.',
    },
    {
      key: 'psi_composite',
      name: 'Patient-safety-indicator (PSI) composite',
      definition:
        'The AHRQ PSI-90 composite — a weighted index of patient-safety ' +
        'indicators derived from coded discharge data (post-operative ' +
        'complications, pressure injury, post-operative sepsis, in-hospital ' +
        'falls with hip fracture, and others) — a claims-and-coding-based ' +
        'view of safety.',
      unit: 'PSI-90 composite index',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.8,
        high: 1.2,
        basis:
          'The PSI-90 composite is normalised around a reference population ' +
          'so values cluster near 1.0; it is sensitive to coding and ' +
          'present-on-admission accuracy as much as to true safety. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Coded discharge data run through the AHRQ PSI specifications, ' +
        'reconciled with the clinical safety-event record.',
      whyItMatters:
        'The PSI composite feeds CMS pay-for-performance programs and public ' +
        'ratings; because it is coding-derived it is also the metric most ' +
        'distorted by documentation gaps — a divergence from the clinical ' +
        'safety record is itself a finding.',
    },
    {
      key: 'incident_report_rate',
      name: 'Safety-event reporting rate',
      definition:
        'The volume of patient-safety events — including near-misses and ' +
        'no-harm events — voluntarily reported into the safety system per ' +
        '1,000 patient-days; a culture-and-engagement measure, not a harm ' +
        'measure.',
      unit: 'reported events per 1,000 patient-days',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 15,
        high: 50,
        basis:
          'Safety-event reporting rates rise with a mature, just safety ' +
          'culture and a low-friction reporting workflow; a healthy system ' +
          'reports many near-misses and no-harm events, not only harm. A ' +
          'planning range — higher is good only when near-miss reporting is ' +
          'driving it.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-safety / incident-reporting system, decomposed by ' +
        'event-type and harm severity.',
      whyItMatters:
        'A safety system can only learn from events it hears about; a low ' +
        'reporting rate, especially of near-misses, signals a culture ' +
        'problem and means real harm is going unseen — the rate is the ' +
        'leading indicator of safety-culture health.',
    },
    {
      key: 'survey_readiness_score',
      name: 'Regulatory-survey readiness score',
      definition:
        'A composite, continuously-maintained score of how ready the ' +
        'organisation is for an unannounced CMS or Joint Commission survey ' +
        '— the share of standards and Conditions of Participation in ' +
        'sustained compliance on internal tracer and mock-survey audit.',
      unit: '% of standards / CoPs in sustained compliance',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 98,
        basis:
          'Continuous-readiness scores from internal tracer programs sit ' +
          'high but rarely at ceiling; the residual gap is where survey ' +
          'findings come from. A planning range — the objective is ' +
          'sustained, not point-in-time, readiness.',
        label: 'planning-range',
      },
      dataSource:
        'The internal tracer / mock-survey program and the accreditation-' +
        'management system, reconciled against the CMS CoP and Joint ' +
        'Commission standards set.',
      whyItMatters:
        'CMS and Joint Commission surveys are unannounced; a gap found by a ' +
        'surveyor becomes a citation, a condition-level deficiency, or — at ' +
        'the extreme — a threat to CMS participation, while the same gap ' +
        'found internally is a quiet correction.',
    },
    {
      key: 'rca_closure_cycle_time',
      name: 'Root-cause-analysis closure cycle time',
      definition:
        'The median elapsed time from a serious safety event being declared ' +
        'to its root-cause analysis being completed and its corrective ' +
        'actions assigned with owners and due dates.',
      unit: 'calendar days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 14,
        high: 45,
        basis:
          'RCA closure cycle time spans a few weeks to well over a month; ' +
          'accreditation expectations and the loss of recall accuracy over ' +
          'time push toward the low end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-safety system\'s RCA and corrective-action workflow ' +
        'with lifecycle timestamps.',
      whyItMatters:
        'A slow RCA delays the learning and the corrective action while the ' +
        'same latent hazard remains live; cycle time is the throughput ' +
        'metric of the safety-learning loop.',
    },
    {
      key: 'corrective_action_completion_rate',
      name: 'Corrective-action completion rate',
      definition:
        'The share of corrective actions arising from root-cause analyses, ' +
        'safety reviews, and survey findings that are completed and verified ' +
        'effective within their committed timeframe.',
      unit: '% of corrective actions completed and verified on time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 95,
        basis:
          'On-time completion of corrective actions varies widely with how ' +
          'rigorously the action register is governed and how often actions ' +
          'are verified effective rather than merely marked done. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The corrective-action register in the patient-safety / ' +
        'accreditation-management system.',
      whyItMatters:
        'A safety system that analyses events but does not close its ' +
        'corrective actions is learning without changing; this rate ' +
        'measures whether the loop actually closes, which is where ' +
        'recurrent harm is prevented.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'safety_event_under_reporting',
      name: 'Safety-event under-reporting and near-miss blindness',
      description:
        'Staff do not report events — especially near-misses and no-harm ' +
        'events — because reporting is slow, feels punitive, or seems ' +
        'pointless. The safety system sees only a fraction of what happens, ' +
        'so its rates look good while real hazards stay invisible until they ' +
        'cause serious harm.',
      detectionSignal:
        'A low safety-event reporting rate, a reporting mix skewed toward ' +
        'harm events with few near-misses, and reporting concentrated in a ' +
        'few units while others are silent.',
      diagnosticQuestion:
        'What is the safety-event reporting rate, how much of it is ' +
        'near-misses, and do staff believe reporting leads to change rather ' +
        'than blame?',
    },
    {
      key: 'alert_fatigue_missed_deterioration',
      name: 'Alert fatigue and missed clinical deterioration',
      description:
        'Early-warning scores and clinical alerts fire so often, and so ' +
        'often without consequence, that staff stop reacting to them. A ' +
        'genuinely deteriorating patient is missed inside the noise, and the ' +
        'rescue happens late or as a code rather than as a planned ' +
        'escalation.',
      detectionSignal:
        'High alert volume per patient-day with low alert-to-action rates; ' +
        'serious safety events and unplanned ICU transfers preceded by ' +
        'hours of unactioned warning signals.',
      diagnosticQuestion:
        'How many deterioration alerts fire per patient-day, what share ' +
        'lead to a clinical action, and how often does a serious event ' +
        'follow ignored warnings?',
    },
    {
      key: 'measure_abstraction_burden',
      name: 'Quality-measure abstraction burden and lag',
      description:
        'Reported quality measures are abstracted from the chart largely by ' +
        'hand, by a small specialist team, well after the encounter. The ' +
        'work is slow and costly, the data is stale by the time it is ' +
        'visible, and abstraction capacity caps how many measures the ' +
        'organisation can credibly report.',
      detectionSignal:
        'A large manual-abstraction workload, a long lag between encounter ' +
        'and abstracted measure result, and a measure portfolio limited by ' +
        'abstractor capacity rather than by clinical priority.',
      diagnosticQuestion:
        'How is each reported measure abstracted, how long after the ' +
        'encounter is the result available, and what is abstraction ' +
        'capacity costing in staff and in measure coverage?',
    },
    {
      key: 'documentation_to_measure_gap',
      name: 'Documentation-to-measure gap — care delivered, credit not earned',
      description:
        'Clinically appropriate care is delivered but is documented in a ' +
        'way the measure logic cannot read — free text instead of a ' +
        'discrete field, the wrong order set, a missing timestamp. The ' +
        'organisation\'s measured quality understates its actual care, and ' +
        'the gap is a documentation failure read as a quality failure.',
      detectionSignal:
        'Measure performance materially below the clinical care actually ' +
        'delivered on chart review; PSI and abstracted measures diverging ' +
        'from the clinical safety record.',
      diagnosticQuestion:
        'Where is genuinely delivered care failing to earn measure credit ' +
        'because of how it is documented rather than how it is delivered?',
    },
    {
      key: 'reactive_survey_readiness',
      name: 'Reactive, cyclical survey readiness',
      description:
        'Regulatory readiness is treated as a project that spins up before ' +
        'an expected survey window and decays afterward, rather than a ' +
        'continuous state. Compliance is real on survey day and erodes ' +
        'between surveys, so an unannounced visit catches the organisation ' +
        'mid-decay.',
      detectionSignal:
        'Survey-readiness scores that cycle with the survey calendar; ' +
        'tracer-audit findings that recur survey after survey; corrective ' +
        'actions that close before a survey and reopen after it.',
      diagnosticQuestion:
        'Is compliance with the CoPs and accreditation standards sustained ' +
        'continuously, or does it spike around the survey window and decay ' +
        'between?',
    },
    {
      key: 'rca_without_closure',
      name: 'Root-cause analysis without closed-loop learning',
      description:
        'Serious events get a root-cause analysis, but the corrective ' +
        'actions stall, are never verified effective, or are weak ' +
        '("re-educate staff") and the same failure mode recurs. The safety ' +
        'system performs the ritual of learning without changing the system ' +
        'that produced the harm.',
      detectionSignal:
        'A low corrective-action completion rate, recurring root causes ' +
        'across separate RCAs, and corrective actions dominated by training ' +
        'and reminders rather than system or process redesign.',
      diagnosticQuestion:
        'After a root-cause analysis, do the corrective actions actually ' +
        'close, get verified effective, and prevent recurrence — or does ' +
        'the same root cause come back?',
    },
    {
      key: 'fragmented_safety_quality_systems',
      name: 'Fragmented safety, quality, and compliance systems',
      description:
        'Patient-safety events, quality measures, infection surveillance, ' +
        'and accreditation tracking each live in a separate system with no ' +
        'shared patient or event spine. Nobody can see that a safety event, ' +
        'a measure failure, and a tracer finding are the same underlying ' +
        'problem, so the organisation responds to symptoms three times ' +
        'over.',
      detectionSignal:
        'Separate, unreconciled systems for safety events, quality ' +
        'measures, infection control, and accreditation; manual ' +
        'spreadsheet bridges between them; no single view of a unit\'s ' +
        'total safety-and-quality picture.',
      diagnosticQuestion:
        'Can the organisation see a unit\'s safety events, quality measures, ' +
        'infections, and compliance gaps in one reconciled view, or are ' +
        'they four disconnected systems?',
    },
    {
      key: 'thin_safety_signal_detection',
      name: 'Thin proactive safety-signal detection',
      description:
        'The function reacts to events that have already reached patients ' +
        'and to measures that are already in. It does little to detect ' +
        'emerging hazard patterns — a cluster of similar near-misses, a ' +
        'drift in a process measure, an outlier unit — before they become ' +
        'serious harm.',
      detectionSignal:
        'Safety review is event-by-event with little cross-event pattern ' +
        'analysis; emerging clusters are recognised only retrospectively ' +
        'after a serious event; no surveillance of leading indicators.',
      diagnosticQuestion:
        'How does the function detect an emerging safety hazard — a cluster ' +
        'of near-misses, a process drift — before it produces a serious ' +
        'safety event?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'patient_deterioration_early_warning',
      name: 'Patient-deterioration detection and early warning',
      valueMechanism:
        'A model continuously reads streaming vitals, labs, nursing ' +
        'assessments, and trajectory in the EHR and flags patients ' +
        'deteriorating toward an adverse event — sepsis, respiratory ' +
        'failure, an unplanned ICU transfer, a code — earlier and more ' +
        'reliably than periodic manual scoring. Value comes through earlier, ' +
        'planned rescue: fewer codes outside the ICU, fewer failures to ' +
        'rescue, shorter and less severe escalations, and serious safety ' +
        'events prevented before harm reaches the patient. The bet is bought ' +
        'to convert late, chaotic rescues into early, calm ones.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Streaming EHR vital signs, nursing assessments, and flowsheet data',
        'Laboratory results and trends',
        'A defined clinical escalation pathway (rapid-response / nurse-line) ' +
          'the alert routes into',
        'Outcome labels — codes, ICU transfers, rescue events — for ' +
          'calibration and monitoring',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model raises a warning and routes an escalation; a clinician ' +
          'assesses the patient and owns the clinical decision — the model ' +
          'never diagnoses or treats.',
        'Alert burden must be actively managed — an early-warning model that ' +
          'adds to alert fatigue makes the missed-deterioration problem ' +
          'worse; tune for precision and route to the right responder.',
        'Under-triage is the dangerous failure direction; sensitivity, ' +
          'missed-event rate, and alert-to-action rate must be monitored ' +
          'continuously, decomposed by unit and patient subgroup.',
        'Performance must be checked for bias — a deterioration model that ' +
          'detects later in any patient subgroup is a safety and equity ' +
          'failure.',
      ],
      metricsMoved: [
        'serious_safety_event_rate',
        'risk_adjusted_mortality_index',
        'sepsis_bundle_compliance',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'sepsis_prediction',
      name: 'Sepsis prediction and bundle-compliance assist',
      valueMechanism:
        'A model screens every inpatient continuously for early sepsis ' +
        'physiology, surfaces likely sepsis hours before it would be ' +
        'clinically obvious, and drives the time-bound sepsis bundle — ' +
        'prompting lactate, cultures, antibiotics, and fluids within their ' +
        'windows. Value comes from earlier recognition and more complete, ' +
        'on-time bundle delivery, which is directly tied to lower ' +
        'sepsis mortality and to SEP-1 measure performance.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Streaming vitals, lab values (lactate, white cell count, culture ' +
          'results), and nursing assessments',
        'The sepsis order set and bundle-element timestamps',
        'Antibiotic administration and fluid-resuscitation records',
        'SEP-1 measure specifications and abstracted bundle-compliance data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'A sepsis alert is decision support — a clinician confirms the ' +
          'diagnosis and owns the order; the model does not start ' +
          'antibiotics or fluids.',
        'False positives drive unnecessary antibiotics and cultures, which ' +
          'carry their own harm and stewardship cost — precision and ' +
          'positive predictive value must be tracked, not just sensitivity.',
        'A widely-used sepsis model performing poorly is a known industry ' +
          'risk; the tenant must validate the model on its own population ' +
          'before relying on it and re-validate on drift.',
      ],
      metricsMoved: [
        'sepsis_bundle_compliance',
        'risk_adjusted_mortality_index',
        'serious_safety_event_rate',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'adverse_event_safety_signal_surveillance',
      name: 'Adverse-event and safety-signal surveillance',
      valueMechanism:
        'A model reads across the clinical record — notes, orders, labs, ' +
        'medication administration, and the safety-event system — to detect ' +
        'adverse events and emerging hazard signals that voluntary reporting ' +
        'misses: a medication-related harm never reported, a drift in a ' +
        'process measure, a cluster of similar near-misses. Value comes from ' +
        'seeing harm and pre-harm patterns the function is currently blind ' +
        'to, converting under-reporting and event-by-event review into ' +
        'proactive, population-level safety surveillance.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR clinical notes, orders, results, and medication-administration ' +
          'records',
        'The patient-safety / incident-reporting event record',
        'Trigger-tool and adverse-event detection definitions',
        'Infection-surveillance and pharmacy-event data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces candidate adverse events and signals; a ' +
          'patient-safety reviewer confirms, classifies harm severity, and ' +
          'owns whether an event is real.',
        'Surveillance must strengthen the just-culture posture — it is for ' +
          'system learning, not for individual performance management, or ' +
          'reporting culture will collapse.',
        'A surfaced signal is a hypothesis until a human review confirms it; ' +
          'precision must be high enough that reviewers are not buried in ' +
          'false signals.',
      ],
      metricsMoved: [
        'incident_report_rate',
        'serious_safety_event_rate',
        'hospital_acquired_condition_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'quality_measure_abstraction_automation',
      name: 'Quality-measure abstraction automation',
      valueMechanism:
        'A model reads the clinical record and pre-populates or drafts the ' +
        'abstraction for reported quality measures — identifying the ' +
        'eligible population, locating the numerator evidence, and flagging ' +
        'exclusions — with a measure abstractor reviewing and attesting. ' +
        'Value comes from cutting the manual-abstraction burden, shortening ' +
        'the lag from encounter to a visible measure result, and freeing ' +
        'abstractor capacity so the organisation can credibly report a ' +
        'broader, more current measure portfolio.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Structured and unstructured EHR clinical documentation',
        'The measure specifications (eCQM, CMS abstracted measures, Stars ' +
          'measures) and their value sets',
        'Historical abstracted measure results for calibration and audit',
        'A measure-abstractor review and attestation workflow',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'A measure abstractor reviews and attests every measure result — ' +
          'the organisation, not the model, certifies what it reports to ' +
          'CMS.',
        'The abstraction must be evidence-linked back to the chart so the ' +
          'abstractor verifies rather than rubber-stamps; reported quality ' +
          'data carries attestation and audit exposure.',
        'The objective is accurate abstraction, never score inflation; the ' +
          'model must not be tuned toward favourable numerators, and ' +
          'abstraction accuracy must be audited against re-abstraction.',
      ],
      metricsMoved: [
        'cms_star_measure_performance',
        'sepsis_bundle_compliance',
        'psi_composite',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'regulatory_survey_readiness',
      name: 'Regulatory-survey readiness intelligence',
      valueMechanism:
        'A model maintains a continuous, evidence-linked view of compliance ' +
        'against the CMS Conditions of Participation and the Joint ' +
        'Commission standards — mapping policies, tracer-audit results, ' +
        'corrective actions, and clinical evidence to each standard, and ' +
        'flagging where sustained compliance is drifting. Value comes from ' +
        'converting cyclical, reactive readiness into a continuous state: ' +
        'gaps are found and closed internally before a surveyor finds them, ' +
        'and the cost is a quiet correction instead of a citation.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The CMS CoP and Joint Commission standards set and their ' +
          'interpretive guidance',
        'Internal tracer / mock-survey audit results',
        'Policy, procedure, and corrective-action records',
        'Clinical-evidence sources (training records, environment-of-care ' +
          'logs, competency data) that substantiate each standard',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces compliance gaps and maps evidence; the ' +
          'accreditation and compliance leaders own the readiness ' +
          'assessment and any representation made to a surveyor.',
        'A standard is "met" only on verified evidence, not on a model ' +
          'inference — the consequence of being wrong is a survey finding.',
        'The tool informs internal readiness; it never generates or alters ' +
          'the evidence presented to a regulator, which must be authentic ' +
          'and contemporaneous.',
      ],
      metricsMoved: [
        'survey_readiness_score',
        'corrective_action_completion_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'safety_event_clustering_rca_assist',
      name: 'Safety-event clustering and root-cause-analysis assist',
      valueMechanism:
        'A model reads the corpus of safety-event reports and root-cause ' +
        'analyses, clusters events by latent failure mode rather than by ' +
        'surface category, and assists the RCA process — surfacing related ' +
        'prior events, drafting a contributing-factors view, and tracking ' +
        'whether corrective actions across the organisation are actually ' +
        'closing the failure modes. Value comes from faster, deeper RCAs ' +
        'and from closed-loop learning: recurring root causes are seen ' +
        'across events instead of one report at a time.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The full safety-event report corpus, including narrative free text',
        'Historical root-cause analyses and their contributing-factor ' +
          'taxonomies',
        'The corrective-action register and its completion / verification ' +
          'status',
        'Event-classification and harm-severity taxonomies',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model clusters events and drafts a contributing-factors view; ' +
          'a trained patient-safety reviewer leads the RCA and owns its ' +
          'conclusions and corrective actions.',
        'Clustering and analysis serve system learning under a just ' +
          'culture — they must not be used to attribute blame to ' +
          'individuals or reporting culture will be destroyed.',
        'Narrative safety reports contain sensitive PHI and ' +
          'peer-review-protected content; access, privilege, and ' +
          'confidentiality protections must be preserved.',
      ],
      metricsMoved: [
        'rca_closure_cycle_time',
        'corrective_action_completion_rate',
        'serious_safety_event_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'realtime_clinical_surveillance_layer',
      name: 'Real-time clinical-surveillance and escalation layer',
      description:
        'A surveillance layer that continuously reads streaming clinical ' +
        'data — vitals, labs, assessments — runs the deterioration and ' +
        'sepsis models against it, and routes a confirmed-needed escalation ' +
        'into a defined clinical pathway (rapid-response team, nurse line, ' +
        'attending). Alert burden, alert-to-action rate, and missed-event ' +
        'rate are first-class outputs of the layer, governed continuously.',
      boundary:
        'It detects and escalates; it does not diagnose, treat, or override ' +
        'clinical judgement. The responding clinician owns the assessment ' +
        'and the clinical decision.',
      humanAccountabilityPoint:
        'The Chief Medical Officer / patient-safety officer accountable for ' +
        'the rescue pathway, with the responding clinician owning each ' +
        'patient decision.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'clinical_decision_support_ai',
    },
    {
      key: 'closed_loop_safety_learning_system',
      name: 'Closed-loop safety-learning system',
      description:
        'A pattern that wires safety-event reporting, harm classification, ' +
        'root-cause analysis, the corrective-action register, and ' +
        'effectiveness verification into a single closed loop. Events are ' +
        'reported and clustered, RCAs draw on related prior events, ' +
        'corrective actions are tracked to verified completion, and ' +
        'recurrence of a root cause reopens the loop. It is measured on ' +
        'closure and on non-recurrence, not on RCA count.',
      boundary:
        'It manages the learning workflow and surfaces patterns; patient-' +
        'safety reviewers own RCA conclusions and accountable owners own ' +
        'corrective actions. It never assigns individual blame.',
      humanAccountabilityPoint:
        'The patient-safety officer accountable for safety learning, with ' +
        'named owners accountable for each corrective action.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'unified_quality_measure_factory',
      name: 'Unified quality-measure abstraction and attestation factory',
      description:
        'A measure-production layer that ingests the clinical record, runs ' +
        'AI-assisted abstraction against the measure specifications, routes ' +
        'every result to a measure abstractor for evidence-linked review ' +
        'and attestation, and submits attested results to CMS. It is the ' +
        'single pathway for every reported measure, replacing per-measure ' +
        'manual abstraction.',
      boundary:
        'It abstracts, evidences, and routes for attestation; the measure ' +
        'abstractor and the quality leadership own the attested result and ' +
        'the certification to CMS. It never self-submits.',
      humanAccountabilityPoint:
        'The VP of Quality accountable for reported-measure integrity, with ' +
        'the measure abstractor attesting each result.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'continuous_accreditation_readiness_substrate',
      name: 'Continuous accreditation-readiness substrate',
      description:
        'A read-and-tracking layer that maps every CMS Condition of ' +
        'Participation and Joint Commission standard to its substantiating ' +
        'evidence — policies, tracer results, corrective actions, training ' +
        'and competency records — and maintains a live readiness score. ' +
        'Internal tracer programs feed it; drift in any standard is ' +
        'surfaced for correction continuously rather than before a survey.',
      boundary:
        'It tracks readiness and surfaces gaps; accreditation and ' +
        'compliance leaders own the readiness assessment and every ' +
        'representation to a regulator. It does not create regulatory ' +
        'evidence.',
      humanAccountabilityPoint:
        'The Chief Quality Officer / accreditation lead accountable for ' +
        'continuous regulatory compliance.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'integrated_safety_quality_data_spine',
      name: 'Integrated safety-quality-compliance data spine',
      description:
        'A reconciliation layer that assembles patient-safety events, ' +
        'quality-measure results, infection surveillance, and accreditation ' +
        'tracking onto a shared patient, encounter, and unit spine, so a ' +
        'safety event, a measure failure, and a tracer finding on the same ' +
        'unit are visible as one connected picture. Every safety-and-quality ' +
        'analysis and every Move reads this spine rather than a siloed ' +
        'system.',
      boundary:
        'It assembles and reconciles; it is a read model, not a system of ' +
        'record, and it makes no clinical or compliance decision itself.',
      humanAccountabilityPoint:
        'The quality and patient-safety analytics owner accountable for the ' +
        'integrity and reconciliation of the spine.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'peer_review_protected_analytics_enclave',
      name: 'Peer-review-protected safety-analytics enclave',
      description:
        'A governed analytics environment for the most sensitive safety ' +
        'data — narrative event reports, RCA contributing-factor analyses, ' +
        'peer-review material — that preserves statutory peer-review and ' +
        'patient-safety-work-product privilege and confidentiality while ' +
        'still allowing clustering, surveillance, and trend analysis. ' +
        'Access is privilege-scoped and audited.',
      boundary:
        'It enables analysis on protected safety data within the privilege ' +
        'boundary; it does not expose protected content outside it and does ' +
        'not weaken the privilege.',
      humanAccountabilityPoint:
        'The patient-safety officer and legal counsel jointly accountable ' +
        'for the integrity of peer-review and patient-safety-work-product ' +
        'protection.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Quality-safety-regulatory value is realised through three channels ' +
      'that must be modelled separately because they convert and prove ' +
      'differently. The first is harm avoided: fewer hospital-acquired ' +
      'conditions, fewer serious safety events, fewer failures to rescue — ' +
      'real clinical value and real avoided cost of harm, but value that is ' +
      'only monetisable on an attested cost-of-harm basis and is measured ' +
      'as events that did not happen, which is inherently a counterfactual. ' +
      'The second is reimbursement protected and earned: avoided CMS ' +
      'penalties under the HAC Reduction and Readmissions Reduction ' +
      'Programs, and Star-rating and pay-for-performance dollars protected ' +
      'or improved — this channel converts more directly because the ' +
      'payment formulas are explicit, but it is bounded by where the ' +
      'organisation already sits on each program curve. The third is ' +
      'operating efficiency and risk reduction: abstraction labour ' +
      'recovered, RCA and readiness cycle time cut, and the avoided cost — ' +
      'financial and existential — of a serious survey finding or a loss ' +
      'of CMS participation. A forecast that blends harm-avoidance ' +
      'counterfactuals with explicit penalty formulas into a single number, ' +
      'or that monetises avoided harm on an unattested cost coefficient, is ' +
      'dishonest by construction. And no value in this function is real if ' +
      'it was bought by inflating a reported measure or weakening reporting ' +
      'culture — the integrity ceiling is absolute.',
    dominantHaircutFactors: [
      {
        factor: 'Counterfactual and attribution uncertainty',
        rationale:
          'The harm-avoidance channel is measured as events that did not ' +
          'occur — a counterfactual. Attributing a fall in serious safety ' +
          'events or HAC rate specifically to the AI intervention, rather ' +
          'than to concurrent bundle work, case-mix shift, or reporting ' +
          'changes, is genuinely hard. The forecast must discount heavily ' +
          'for what cannot be cleanly attributed; this is the largest ' +
          'source of erosion in this function.',
        typicalHaircut: {
          low: 0.3,
          high: 0.6,
          basis:
            'The discount applied to a harm-avoidance forecast for ' +
            'counterfactual and attribution uncertainty; a planning range, ' +
            'narrowed only by a rigorous matched-comparison measurement ' +
            'design.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Clinical adoption and alert-burden tolerance',
        rationale:
          'Deterioration, sepsis, and surveillance models only create ' +
          'value if clinicians act on them. If the alerts add to alert ' +
          'fatigue they are silenced and the value goes to zero; if ' +
          'precision is poor the workflow rejects them. The realisable ' +
          'value is bounded by how well the alerts are tuned and trusted.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Forecast erosion from partial clinical adoption and from ' +
            'alert burden suppressing response; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Program-curve position on reimbursement upside',
        rationale:
          'The avoided-penalty and Star-dollar channel is bounded by where ' +
          'the organisation already sits. An organisation already near the ' +
          'top of a Star measure or already avoiding a HAC penalty has ' +
          'little reimbursement headroom left, however much its absolute ' +
          'safety improves — the financial upside is capped by the program ' +
          'formula, not by the clinical gain.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'The portion of a modelled reimbursement upside that is not ' +
            'realisable because the organisation already sits high on the ' +
            'program curve; a planning range driven by the baseline ' +
            'position.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Measurement-integrity ceiling',
        rationale:
          'Quality and safety value is hard-bounded by integrity: a ' +
          'measure result is only worth claiming if it reflects care ' +
          'genuinely delivered and accurately documented, and a safety ' +
          'improvement is only real if reporting culture stayed strong. Any ' +
          'apparent gain that came from score inflation, selective ' +
          'abstraction, or suppressed reporting is not value — it is ' +
          'audit, citation, and patient-harm exposure, and must be removed ' +
          'from the forecast entirely.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The portion of an apparent quality or safety gain that is ' +
            'discounted because it is not integrity-supported; a planning ' +
            'range — and the residual is non-negotiable.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Serious-safety-event and hospital-acquired-condition reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in serious safety events and ' +
            'hospital-acquired conditions achievable from earlier ' +
            'deterioration detection and a closed-loop safety-learning ' +
            'system; a planning range spanning early and mature programs ' +
            'and only creditable on a matched-comparison design.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the serious-safety-event rate and ' +
          'the HAC rate for the affected units against a matched baseline, ' +
          'monetised only on an attested cost-of-harm basis.',
      },
      {
        lever: 'Quality-measure abstraction labour recovered',
        range: {
          low: 25,
          high: 60,
          basis:
            'Reduction in manual measure-abstraction effort from ' +
            'AI-assisted abstraction with abstractor attestation; a ' +
            'planning range, with the residual abstractor review and ' +
            'attestation work always retained.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in abstractor hours per reported measure, net ' +
          'of the review-and-attestation time retained.',
      },
      {
        lever: 'Reimbursement protected — avoided penalties and Star dollars',
        range: {
          low: 1,
          high: 8,
          basis:
            'Improvement in the relevant CMS quality, HAC, readmission, or ' +
            'Star program position from better measure performance and ' +
            'harm reduction; a planning range expressed against the ' +
            'program-linked reimbursement at stake and bounded by the ' +
            "baseline program-curve position.",
          label: 'planning-range',
        },
        measuredAs:
          'Change in program-linked reimbursement — avoided HAC/HRRP ' +
          'penalty and Star bonus / rebate dollars — computed on the ' +
          'explicit CMS program formulas.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable process signal (sepsis-bundle ' +
      'compliance, alert-to-action rate, abstraction cycle time) once a ' +
      'model is live and adopted; 9–18 months for the harm-outcome ' +
      'channel (serious-safety-event rate, HAC rate, risk-adjusted ' +
      'mortality and readmissions) to settle into a credible matched ' +
      'comparison; reimbursement and Star-rating effects are program-cycle ' +
      'lagged and take 12–24 months to read in payment terms.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Patient-safety / incident-reporting system',
        role:
          'The system of record for safety events, near-misses, harm ' +
          'classification, root-cause analyses, and the corrective-action ' +
          'register — the spine of the safety-learning loop.',
        examples: [
          'RLDatix (RL6)',
          'Datix',
          'Verge Health',
          'Origami Risk',
        ],
      },
      {
        name: 'Quality-measure / Stars management platform',
        role:
          'Manages the reported-measure portfolio — abstraction, eCQM and ' +
          'CMS measure calculation, and submission — and the Star-rating ' +
          'measure performance.',
        examples: [
          'Medisolv',
          'Q-Centrix',
          'Health Catalyst quality solutions',
          'EHR-native quality / eCQM modules',
        ],
      },
      {
        name: 'Infection-prevention and surveillance system',
        role:
          'Detects and tracks healthcare-associated infections and ' +
          'hospital-acquired conditions and supports NHSN reporting.',
        examples: [
          'CDC NHSN',
          'Epic Bugsy / infection-control modules',
          'Premier infection-prevention tools',
        ],
      },
      {
        name: 'Accreditation / compliance management system',
        role:
          'Tracks compliance against the CMS Conditions of Participation ' +
          'and Joint Commission standards, runs the tracer / mock-survey ' +
          'program, and holds policy and corrective-action records.',
        examples: [
          'symplr accreditation tools',
          'MedTrainer',
          'The Joint Commission tracer / SAFER tools',
        ],
      },
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record — the streaming vitals, labs, ' +
          'notes, orders, and medication data the surveillance models read ' +
          'and the documentation the quality measures are abstracted from.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'Meditech'],
      },
      {
        name: 'Risk-adjustment / clinical-outcomes analytics platform',
        role:
          'Computes risk-adjusted mortality, readmission, and ' +
          'complication outcomes and the comparative benchmarks behind ' +
          'them.',
        examples: [
          'Vizient Clinical Data Base',
          'Premier QualityAdvisor',
          'AHRQ Quality Indicator software',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Quality Officer (CQO)',
        accountability:
          'Owns clinical quality, the reported-measure portfolio, and the ' +
          'organisation\'s regulatory and accreditation standing.',
      },
      {
        title: 'Patient-Safety Officer',
        accountability:
          'Owns the patient-safety system — event reporting, serious-' +
          'safety-event review, root-cause analysis, and the just-culture ' +
          'posture.',
      },
      {
        title: 'Chief Medical Officer (CMO)',
        accountability:
          'Owns clinical outcomes and the medical-staff accountability for ' +
          'safety and quality performance, including the rescue pathway.',
      },
      {
        title: 'Chief Nursing Officer (CNO)',
        accountability:
          'Owns nursing-sensitive safety and quality outcomes — falls, ' +
          'pressure injuries, deterioration recognition — and frontline ' +
          'reporting culture.',
      },
      {
        title: 'Director of Infection Prevention',
        accountability:
          'Owns healthcare-associated-infection surveillance and the ' +
          'hospital-acquired-condition prevention bundles.',
      },
      {
        title: 'Accreditation / Regulatory Readiness Lead',
        accountability:
          'Owns continuous compliance with the CMS Conditions of ' +
          'Participation and Joint Commission standards and the survey ' +
          'readiness program.',
      },
      {
        title: 'Quality-measure abstractor / abstraction lead',
        accountability:
          'Owns the accuracy and attestation of each abstracted quality ' +
          'measure the organisation reports.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'CMS Conditions of Participation (CoPs)',
        relevance:
          'The baseline federal requirements a hospital must meet to ' +
          'participate in Medicare and Medicaid; a condition-level ' +
          'deficiency can threaten participation itself, making continuous ' +
          'CoP compliance the function\'s hardest constraint.',
      },
      {
        name: 'The Joint Commission accreditation standards',
        relevance:
          'The accreditation standards and unannounced tracer-method ' +
          'surveys most hospitals are held to (often as CMS ' +
          'deemed-status); they define the safety, quality, and ' +
          'environment-of-care bar the readiness discipline maintains.',
      },
      {
        name: 'CMS quality programs — HAC Reduction, HRRP, VBP, and Star ' +
          'Ratings',
        relevance:
          'The pay-for-performance and public-reporting programs that tie ' +
          'hospital-acquired-condition, readmission, mortality, and ' +
          'patient-experience performance directly to reimbursement and ' +
          'reputation.',
      },
      {
        name: 'Patient Safety and Quality Improvement Act (PSQIA) — ' +
          'patient-safety-work-product privilege',
        relevance:
          'Establishes the federal confidentiality and privilege ' +
          'protection for patient-safety work product reported to a ' +
          'Patient Safety Organization; it shapes how safety-event and RCA ' +
          'data may be analysed and who may see it.',
      },
      {
        name: 'HIPAA Privacy and Security Rules',
        relevance:
          'Govern PHI across every safety, quality, and surveillance ' +
          'system; any AI processing clinical data for safety surveillance ' +
          'or measure abstraction must operate under a compliant, ' +
          'minimum-necessary posture.',
      },
      {
        name: 'CMS / state mandatory adverse-event and never-event ' +
          'reporting requirements',
        relevance:
          'Require reporting of defined serious reportable events to CMS, ' +
          'state agencies, and accreditors; they make accurate event ' +
          'classification a regulatory obligation, not only an internal ' +
          'discipline.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Hospital-acquired condition (HAC)',
        definition:
          'A condition a patient acquires during the hospital stay that ' +
          'was not present on admission — the CMS-designated set carries ' +
          'payment penalties under the HAC Reduction Program.',
      },
      {
        term: 'Serious safety event (SSE)',
        definition:
          'A safety event that reaches a patient and results in ' +
          'moderate-to-severe harm or death, deviating from expected ' +
          'practice — the events the safety system most exists to prevent.',
      },
      {
        term: 'Never event',
        definition:
          'A serious, largely preventable patient-safety event from the ' +
          'National Quality Forum list of serious reportable events — ' +
          'events that should never occur.',
      },
      {
        term: 'Root-cause analysis (RCA)',
        definition:
          'The structured, multidisciplinary review of a serious event to ' +
          'identify the systemic contributing factors and the corrective ' +
          'actions that prevent recurrence.',
      },
      {
        term: 'Just culture',
        definition:
          'A safety-culture model that separates blameworthy acts from ' +
          'system-induced error, so staff report freely and the system, ' +
          'not the individual, is the focus of learning.',
      },
      {
        term: 'Failure to rescue',
        definition:
          'Death or serious harm following a treatable complication that ' +
          'was not recognised and acted on in time — a core measure of how ' +
          'well deterioration is detected and escalated.',
      },
      {
        term: 'SEP-1 sepsis bundle',
        definition:
          'The CMS time-bound sepsis measure requiring lactate, blood ' +
          'cultures, antibiotics, fluids, and reassessment within ' +
          'specified windows, scored all-or-nothing.',
      },
      {
        term: 'Patient-safety indicator (PSI)',
        definition:
          'An AHRQ indicator of a potentially avoidable safety event ' +
          'derived from coded discharge data; the PSI-90 composite feeds ' +
          'CMS programs and public ratings.',
      },
      {
        term: 'Tracer methodology',
        definition:
          'The survey method — followed by accreditors and used in ' +
          'internal mock surveys — that traces a patient\'s or a ' +
          'process\'s path through the organisation to test real ' +
          'compliance.',
      },
      {
        term: 'Condition-level deficiency',
        definition:
          'A finding that an entire CMS Condition of Participation is out ' +
          'of compliance — the most serious survey outcome, capable of ' +
          'threatening Medicare participation.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Quality-Safety-Regulatory Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the quality, patient-safety, and regulatory-' +
        'compliance operation is failing — as unseen harm, as lost or ' +
        'inaccurate measure credit, and as compliance drift — with baseline ' +
        'evidence, before any solution is shaped.',
      sections: [
        {
          heading: 'Quality, safety & compliance operating context',
          guidance:
            'Describe the landscape — the patient-safety system, the ' +
            'quality-measure and Stars operation, infection prevention, the ' +
            'accreditation and tracer program, and the clinical systems ' +
            'they read. State which data sources are available, how they ' +
            'reconcile, and how fresh they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — HAC rate, risk-adjusted readmission and ' +
            'mortality, serious-safety-event rate, sepsis-bundle and ' +
            'hand-hygiene compliance, CMS / Star performance, the PSI ' +
            'composite, safety-event reporting rate, survey-readiness ' +
            'score, RCA cycle time, corrective-action completion. For any ' +
            'metric the tenant does not record, name it as a precise seed ' +
            'gap with its expected data source — and flag where a low ' +
            'reported rate may be under-reporting rather than good ' +
            'performance.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — safety-event under-reporting, ' +
            'alert fatigue and missed deterioration, abstraction burden, ' +
            'the documentation-to-measure gap, reactive survey readiness, ' +
            'RCA without closure, fragmented systems, thin proactive ' +
            'signal detection — and state which are present, with the ' +
            'detection signal and evidence for each.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity from the value-model benchmark ranges, ' +
            'keeping the harm-avoidance, reimbursement-protected, and ' +
            'efficiency channels separate. Be explicit that harm avoidance ' +
            'is a counterfactual and that reimbursement upside is bounded ' +
            'by the program-curve position. Every figure a labelled ' +
            'planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the data the diagnosis still needs, who owns each ' +
            'source, and what each gap blocks — call out the attested ' +
            'cost-of-harm coefficient and the program-formula inputs ' +
            'explicitly as named asks, and note where peer-review ' +
            'privilege constrains data access.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            '— deterioration detection, sepsis prediction, safety-signal ' +
            'surveillance, abstraction automation, survey readiness, or ' +
            'RCA assist — and why, and what the Move would and would not ' +
            'attempt, including the integrity guardrails it must carry.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Quality-Safety-Regulatory Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a quality, safety, ' +
        'or regulatory AI Move — baseline, multi-channel forecast, cost, ' +
        'and the honest downside, with the measurement-integrity ceiling ' +
        'stated.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into the ' +
            'harm-avoidance, reimbursement-protected, and efficiency ' +
            'channels, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric. Where a baseline, an attested cost-of-harm ' +
            'coefficient, or a program-formula input is a seed gap, say so ' +
            'plainly and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'keeping the three channels separate, then apply each dominant ' +
            'haircut — counterfactual and attribution uncertainty, ' +
            'clinical adoption and alert burden, program-curve position, ' +
            'the measurement-integrity ceiling — explicitly with the math ' +
            'shown. Present harm-avoidance value as a planning range tied ' +
            'to a matched-comparison design, not as a claimed certainty.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the EHR, the patient-' +
            'safety, quality, infection, and accreditation systems, the ' +
            'model validation on the tenant population, and the clinical ' +
            'change and workflow effort.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weak attribution, low clinical ' +
            'adoption and high alert burden, a baseline already high on ' +
            'the program curve, and a model that underperforms on the ' +
            'local population. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Patient-safety, integrity & regulatory posture',
          guidance:
            'State the patient-safety controls (clinician-in-the-loop ' +
            'escalation, alert-burden governance, model validation), the ' +
            'measurement-integrity guardrails (no score inflation, ' +
            'evidence-linked attestation, protected reporting culture), ' +
            'and the PSQIA, HIPAA, and accreditation frames that bound the ' +
            'design.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — e.g. the model cannot be validated on the local ' +
            'population, no matched-comparison measurement is possible, or ' +
            'the integrity guardrails cannot be assured — and the evidence ' +
            'required before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the cadence — and flag that the ' +
            'harm-outcome metrics need a matched comparison and a longer ' +
            'window before they read credibly.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Quality-Safety-Regulatory Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'quality, safety, or regulatory AI capability, grounded in the ' +
        'function reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — the real-time clinical-surveillance layer, the ' +
            'closed-loop safety-learning system, the quality-measure ' +
            'abstraction factory, the continuous accreditation-readiness ' +
            'substrate, the integrated safety-quality data spine, and the ' +
            'peer-review-protected analytics enclave — and state which ' +
            'apply and how they connect.',
        },
        {
          heading: 'Clinical and regulatory system integration',
          guidance:
            'Specify the integration to the EHR streaming data, the ' +
            'patient-safety, quality, infection, and accreditation ' +
            'systems, and the identity and encounter-context resolution ' +
            'each depends on — including how peer-review-protected data is ' +
            'segregated.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'review / escalation / attestation path. Surveillance models ' +
            'escalate to a clinician; abstraction closes on abstractor ' +
            'attestation; readiness assessment stays with the ' +
            'accreditation lead.',
        },
        {
          heading: 'Model validation and alert-burden governance',
          guidance:
            'Define how each clinical model is validated on the tenant ' +
            'population before reliance and re-validated on drift, and how ' +
            'alert volume, precision, and alert-to-action rates are ' +
            'governed so the capability reduces rather than adds to alert ' +
            'fatigue.',
        },
        {
          heading: 'Patient-safety, integrity & responsible-AI controls',
          guidance:
            'State the just-culture protection, the no-score-inflation and ' +
            'evidence-linked-attestation controls, subgroup-bias testing ' +
            'for the clinical models, PHI handling, peer-review privilege ' +
            'preservation, and the regulatory frames (CoPs, Joint ' +
            'Commission, PSQIA, HIPAA) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'clinical and regulatory systems, and the phased, unit-led ' +
            'rollout with model validation gates.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Quality-Safety-Regulatory Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the quality, safety, or ' +
        'regulatory AI capability so clinicians and quality staff actually ' +
        'adopt it, the integrity guardrails hold, and value is realised — ' +
        'not just deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — system integration and validation, ' +
            'model validation on the local population, a lead-unit pilot, ' +
            'clinical and quality-staff onboarding, scale — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — clinical ' +
            'and regulatory system integration, model validation, alert-' +
            'burden governance, abstraction-attestation workflow, ' +
            'integrity assurance, Tower measurement.',
        },
        {
          heading: 'Clinical and quality-staff adoption approach',
          guidance:
            'Define the change runway — training clinicians on the ' +
            'escalation pathway and on calibrated trust in the alerts, ' +
            'training abstractors on the review-and-attest discipline, ' +
            'and protecting just culture so reporting stays strong. State ' +
            'how adoption is measured, not assumed.',
        },
        {
          heading: 'Patient-safety and integrity hypercare',
          guidance:
            'Define the hypercare window with elevated clinical and ' +
            'quality support, an alert-precision and alert-to-action ' +
            'review cadence, a model-performance and bias watch, and an ' +
            'abstraction-accuracy audit — with the exit criteria for ' +
            'leaving hypercare.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, the matched-comparison ' +
            'design for the harm-outcome metrics, and the cadence.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — model underperformance on the local ' +
            'population, alert fatigue, weak attribution, an integrity ' +
            'lapse, a reporting-culture regression — with the escalation ' +
            'owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it, including the model-validation and ' +
            'integrity-assurance preconditions.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'The true patient-safety performance — serious safety events ' +
        'and hospital-acquired conditions',
      authoritativeSource:
        'The patient-safety / incident system and the infection-' +
        'surveillance system, with a consistent harm-severity ' +
        'classification, reconciled against coded present-on-admission ' +
        'data.',
      whatGoodEvidenceLooksLike:
        'A multi-period harm trace with a stable severity classification, ' +
        'cross-checked against an independent signal (trigger-tool review, ' +
        'infection surveillance, PSI), and read alongside the reporting ' +
        'rate so a low harm count is distinguished from under-reporting.',
      weakEvidenceToReject:
        'A low safety-event count taken at face value as good performance ' +
        'with no reporting-rate context, or a harm rate with no consistent ' +
        'severity classification behind it.',
    },
    {
      claim: 'That a clinical surveillance model performs and is acted on',
      authoritativeSource:
        'Model-performance validation on the tenant population plus ' +
        'alert-to-action telemetry from the clinical workflow.',
      whatGoodEvidenceLooksLike:
        'Sensitivity, precision, and missed-event rate measured on the ' +
        "organisation's own patients and decomposed by unit and subgroup, " +
        'alongside alert-to-action rates that show clinicians are ' +
        'responding rather than silencing the alerts.',
      weakEvidenceToReject:
        'A vendor accuracy claim with no local validation, or an alert ' +
        'volume reported with no alert-to-action or missed-event data ' +
        'behind it.',
    },
    {
      claim: 'That a reported quality measure reflects care actually ' +
        'delivered',
      authoritativeSource:
        'Evidence-linked abstraction traceable to the clinical record, ' +
        'verified by abstractor attestation and tested by independent ' +
        're-abstraction.',
      whatGoodEvidenceLooksLike:
        'Each measure result linked to the specific chart evidence behind ' +
        'its numerator and exclusions, attested by an abstractor, and ' +
        'agreeing with a sample re-abstraction within tolerance.',
      weakEvidenceToReject:
        'A measure result with no evidence linkage, abstraction tuned ' +
        'toward favourable numerators, or a score-lift claim with no ' +
        're-abstraction check.',
    },
    {
      claim: 'That the organisation is continuously survey-ready',
      authoritativeSource:
        'The internal tracer / mock-survey program and the accreditation-' +
        'management system mapped to the CoPs and Joint Commission ' +
        'standards.',
      whatGoodEvidenceLooksLike:
        'A sustained, evidence-linked readiness score from ongoing tracer ' +
        'activity across the survey window, with each standard backed by ' +
        'authentic, contemporaneous evidence and recurring findings ' +
        'closed.',
      weakEvidenceToReject:
        'A readiness score that spikes only before an expected survey, ' +
        'a self-assessment with no tracer evidence, or evidence created ' +
        'reactively to satisfy a standard.',
    },
    {
      claim: 'The forecast value of a quality, safety, or regulatory AI Move',
      authoritativeSource:
        'The value model — the harm-avoidance, reimbursement-protected, ' +
        'and efficiency channels modelled separately and haircut by their ' +
        'dominant factors — with the cost-of-harm coefficient attested by ' +
        'Finance and the reimbursement effect computed on the explicit CMS ' +
        'program formulas.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, the three channels kept ' +
        'separate, each haircut applied explicitly, harm avoidance tied to ' +
        'a matched-comparison design, and reimbursement upside bounded by ' +
        'the program-curve position. Every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single blended savings number, a harm-avoidance dollar figure ' +
        'on an unattested cost coefficient, a reimbursement claim that ' +
        'ignores the baseline program position, or a vendor ROI claim ' +
        'taken at face value.',
    },
  ],
};
