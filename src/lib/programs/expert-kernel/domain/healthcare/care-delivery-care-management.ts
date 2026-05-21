// Domain Function Pack — Healthcare provider · Care delivery & care management.
//
// Function key: `care_delivery_care_management`.
//
// This is one half of the value-based-care spine (spec §6). Care management is
// the operational arm of VBC: it is how a provider organisation actually moves
// the cost and quality of a risk-bearing population — through complex-care
// management, transitions of care, chronic-disease management, and the panels
// of high-risk patients that drive the bulk of total cost of care.
//
// The companion pack — population-health-value-based-care.ts — sits one level
// up: it is the contract economics, the risk model, the population
// stratification. This pack is the delivery engine that those economics depend
// on. Together they are the VBC reference depth.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const careDeliveryCareManagementPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'care_delivery_care_management',
  functionLabel: 'Care delivery & care management',
  summary:
    'Care management is the operating engine of value-based care: the staffed, ' +
    'workflow-driven function that takes a risk-stratified population and ' +
    'actively bends its trajectory — closing care gaps, managing chronic ' +
    'disease, owning transitions out of the hospital, and wrapping the ' +
    'highest-risk patients in complex-care management. It is where contract ' +
    'economics either land or leak. A VBC contract can be financially sound on ' +
    'paper and still lose money if the care-management operation cannot reach, ' +
    'engage, and follow the patients who carry the cost.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'risk_adjusted_tcoc_pmpy',
      name: 'Risk-adjusted total cost of care (PMPY)',
      definition:
        'Total medical and pharmacy spend for an attributed population over a ' +
        'year, divided by member-months and annualised, then normalised by the ' +
        "population's risk score so panels of differing acuity can be compared.",
      unit: 'USD per member per year (risk-adjusted)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 9000,
        high: 16000,
        basis:
          'Commercial and Medicare Advantage attributed populations span a wide ' +
          'PMPY band; Medicare populations sit materially higher than commercial. ' +
          'Use the tenant contract mix to place the planning point.',
        label: 'planning-range',
      },
      dataSource:
        'Payer claims feed reconciled against the care-management platform; ' +
        'risk score from the HCC/RAF model.',
      whyItMatters:
        'It is the single number a shared-savings or capitation contract is ' +
        'settled on. Every care-management intervention is ultimately judged by ' +
        'whether it moved risk-adjusted TCOC.',
    },
    {
      key: 'readmission_rate_30d',
      name: '30-day all-cause readmission rate',
      definition:
        'The share of inpatient discharges followed by an unplanned acute ' +
        'readmission within 30 days, all-cause, for the attributed population.',
      unit: '% of index discharges',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 12,
        high: 18,
        basis:
          'All-cause 30-day readmission for general medical-surgical Medicare ' +
          'populations; condition-specific cohorts (heart failure, COPD) run ' +
          'higher. Treat as a planning band, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'ADT (admit-discharge-transfer) feed plus payer claims; transitions-of-' +
        'care workflow in the care-management platform.',
      whyItMatters:
        'Readmissions are concentrated, expensive, and substantially ' +
        'preventable through transitions-of-care work — the most direct lever a ' +
        'care-management operation owns.',
    },
    {
      key: 'ed_utilization_per_1000',
      name: 'Emergency department utilisation per 1,000 members',
      definition:
        'Emergency department visits per 1,000 attributed members per year, ' +
        'including visits that do not result in an inpatient admission.',
      unit: 'ED visits per 1,000 members per year',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 400,
        high: 750,
        basis:
          'Attributed Medicare and commercial populations; the band widens with ' +
          'social complexity and primary-care access gaps. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Payer claims and ADT feed; ambulatory-access data from the EHR.',
      whyItMatters:
        'Avoidable ED use signals a primary-care access or chronic-disease ' +
        'management failure upstream; it is a leading indicator care management ' +
        'can move before it shows up in admissions.',
    },
    {
      key: 'care_gap_closure_rate',
      name: 'Care-gap closure rate',
      definition:
        'The share of identified open care gaps (preventive screenings, chronic ' +
        'monitoring, medication reconciliation items) closed within the ' +
        'measurement period for the managed population.',
      unit: '% of identified gaps closed',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 80,
        basis:
          'Closure rates vary sharply by gap type and outreach maturity; ' +
          'pharmacy and lab gaps close faster than visit-dependent gaps. Planning ' +
          'range only.',
        label: 'planning-range',
      },
      dataSource:
        'Care-management platform gap registry reconciled against EHR and ' +
        'claims-based quality measures.',
      whyItMatters:
        'Gap closure drives both quality-score revenue and the downstream ' +
        'avoidance of complications; it is the most measurable proof a care-' +
        'management workflow is actually reaching patients.',
    },
    {
      key: 'panel_engagement_rate',
      name: 'Care-management engagement rate',
      definition:
        'The share of patients enrolled in a care-management program who have ' +
        'a documented, substantive contact with a care manager within the ' +
        'expected cadence for their risk tier.',
      unit: '% of enrolled patients',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 70,
        basis:
          'Engagement is the chronic bottleneck of care management; rates ' +
          'depend heavily on outreach channel, patient trust, and data freshness. ' +
          'Planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Care-management platform contact and documentation logs.',
      whyItMatters:
        'A program cannot move outcomes for patients it never reaches; ' +
        'engagement is the rate-limiting step between enrolment and value.',
    },
    {
      key: 'care_plan_adherence_rate',
      name: 'Care-plan adherence rate',
      definition:
        'The share of active care-management patients whose documented care-' +
        'plan actions (follow-up visits, medication changes, monitoring tasks) ' +
        'are completed on schedule.',
      unit: '% of care-plan actions completed on time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 75,
        basis:
          'Adherence is sensitive to plan realism and social barriers; over-' +
          'specified plans depress the rate. Treat as a planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Care-management platform care-plan task tracking.',
      whyItMatters:
        'Adherence is the bridge between an intervention being designed and ' +
        'its outcome being realised; low adherence is where value silently leaks.',
    },
    {
      key: 'transitions_of_care_followup_72h',
      name: 'Post-discharge follow-up within 72 hours',
      definition:
        'The share of inpatient and observation discharges in the managed ' +
        'population that receive a documented care-management contact or ' +
        'clinician follow-up within 72 hours of discharge.',
      unit: '% of discharges',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 75,
        basis:
          'High-performing transitions-of-care programs push the upper end; ' +
          'discharge-notification latency caps the rest. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'ADT discharge feed timestamps against care-management contact logs.',
      whyItMatters:
        'The 72-hour window is when medication errors and missed follow-up ' +
        'turn into readmissions; it is the single most actionable transitions ' +
        'metric.',
    },
    {
      key: 'high_risk_panel_share',
      name: 'High-risk panel share',
      definition:
        'The share of the attributed population classified into the top risk ' +
        'tier (rising-risk plus high-risk) by the stratification model.',
      unit: '% of attributed members',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 3,
        high: 8,
        basis:
          'The top tier of a typical population concentrates a large majority ' +
          'of cost; an unusually low or high share usually signals a ' +
          'stratification calibration problem, not a real population shift.',
        label: 'planning-range',
      },
      dataSource:
        'Risk-stratification model output in the care-management platform.',
      whyItMatters:
        'Care-management capacity is finite; the high-risk panel share sizes ' +
        'the workload and tests whether the stratification model is calibrated.',
    },
    {
      key: 'care_manager_caseload',
      name: 'Care-manager active caseload',
      definition:
        'The average number of actively managed patients per full-time care ' +
        'manager, weighted by patient acuity tier.',
      unit: 'patients per FTE care manager',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 50,
        high: 125,
        basis:
          'Complex-care caseloads sit at the low end; lighter chronic-disease ' +
          'management runs higher. Acuity mix determines the planning point.',
        label: 'planning-range',
      },
      dataSource:
        'Care-management platform staffing and assignment data.',
      whyItMatters:
        'Caseload is the capacity constraint; a caseload set without acuity ' +
        'weighting silently overloads care managers and collapses engagement.',
    },
    {
      key: 'avoidable_admission_rate',
      name: 'Ambulatory-care-sensitive (avoidable) admission rate',
      definition:
        'Inpatient admissions per 1,000 members for ambulatory-care-sensitive ' +
        'conditions — admissions that good outpatient management could have ' +
        'prevented.',
      unit: 'admissions per 1,000 members per year',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 25,
        high: 60,
        basis:
          'Ambulatory-care-sensitive admission rates vary with chronic-disease ' +
          'burden and primary-care access. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'Payer claims classified against the AHRQ prevention-quality-indicator ' +
        'condition set.',
      whyItMatters:
        'It isolates the admissions care management can actually prevent, ' +
        'separating delivery-system performance from unavoidable acute illness.',
    },
    {
      key: 'medication_reconciliation_completion',
      name: 'Post-discharge medication reconciliation completion',
      definition:
        'The share of discharges in the managed population with a documented ' +
        'medication reconciliation completed within the transitions-of-care ' +
        'window.',
      unit: '% of discharges',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 85,
        basis:
          'Completion depends on pharmacy involvement and discharge-data ' +
          'quality; high-performing programs reach the upper band. Planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Care-management platform and pharmacy documentation against the ADT ' +
        'discharge feed.',
      whyItMatters:
        'Medication discrepancies at discharge are a leading preventable cause ' +
        'of readmission; reconciliation is the cheapest high-yield intervention.',
    },
    {
      key: 'patient_activation_measure',
      name: 'Patient activation level',
      definition:
        'A validated measure of how equipped and confident a patient is to ' +
        'manage their own health, tracked for the actively managed panel.',
      unit: 'activation level (1–4) or PAM score (0–100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 72,
        basis:
          'Activation scores for chronically ill, managed populations sit ' +
          'below the general-population mean; movement over time is the signal. ' +
          'Planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Patient-reported assessment captured in the care-management platform.',
      whyItMatters:
        'Activation predicts adherence and utilisation; a program that raises ' +
        'activation buys durable outcomes rather than one-time gap closure.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'stale_attribution',
      name: 'Stale or churning attribution',
      description:
        'The managed population is defined by a payer attribution file that ' +
        'lags reality by a month or a quarter. Care managers spend effort on ' +
        'patients who have already churned out of the panel, and miss newly ' +
        'attributed high-risk patients entirely.',
      detectionSignal:
        'A material share of actively managed patients no longer appear on the ' +
        'current attribution file; new high-cost claimants have no care manager.',
      diagnosticQuestion:
        'How fresh is the attribution file the care-management panel is built ' +
        'from, and how is mid-cycle churn reconciled?',
    },
    {
      key: 'discharge_notification_latency',
      name: 'Discharge-notification latency',
      description:
        'The care-management team learns a patient was admitted or discharged ' +
        'days late — or only from a claim weeks later. The 72-hour transitions ' +
        'window is gone before the team can act.',
      detectionSignal:
        'The median gap between an actual discharge timestamp and the first ' +
        'care-management contact exceeds the transitions-of-care window.',
      diagnosticQuestion:
        'What real-time ADT or admission-discharge notification feed reaches ' +
        'the care-management team, and what is its latency?',
    },
    {
      key: 'engagement_ceiling',
      name: 'Engagement ceiling',
      description:
        'Enrolment numbers look healthy but a large share of enrolled patients ' +
        'are never substantively reached. The program reports a panel size it ' +
        'is not actually managing.',
      detectionSignal:
        'Engagement rate sits far below enrolment; a long tail of enrolled ' +
        'patients has zero documented substantive contact.',
      diagnosticQuestion:
        'Of the patients counted as enrolled, what share have an actual ' +
        'documented care-management contact in the expected cadence?',
    },
    {
      key: 'uncalibrated_stratification',
      name: 'Uncalibrated risk stratification',
      description:
        'The stratification model assigns risk tiers that do not match where ' +
        'cost actually lands. Care managers are pointed at the wrong patients ' +
        'while genuinely rising-risk patients sit unmanaged.',
      detectionSignal:
        'A weak overlap between the model-assigned high-risk tier and the ' +
        'patients who in fact generated the top decile of cost last period.',
      diagnosticQuestion:
        'How well does the stratification model predict next-period cost, and ' +
        'when was it last validated against realised spend?',
    },
    {
      key: 'caseload_overload',
      name: 'Acuity-blind caseload overload',
      description:
        'Caseloads are set as a flat patient count with no acuity weighting. ' +
        'Care managers with complex panels are silently overloaded; engagement ' +
        'and care-plan adherence collapse without showing up in a headcount ' +
        'report.',
      detectionSignal:
        'Care managers with high-acuity panels show falling engagement and ' +
        'rising overdue care-plan tasks relative to lighter panels.',
      diagnosticQuestion:
        'Is caseload weighted by patient acuity, and how is care-manager ' +
        'capacity actually monitored?',
    },
    {
      key: 'workflow_documentation_burden',
      name: 'Documentation burden displacing care',
      description:
        'Care managers spend a large share of their time on documentation, ' +
        'gap-list reconciliation, and toggling between the EHR and the care-' +
        'management platform — time taken directly from patient contact.',
      detectionSignal:
        'Time-and-motion or platform telemetry shows documentation and system ' +
        'navigation consuming a large fraction of the care-manager workday.',
      diagnosticQuestion:
        'How much of a care manager’s day is patient contact versus ' +
        'documentation and reconciliation across systems?',
    },
    {
      key: 'social_barrier_blindness',
      name: 'Social-barrier blindness',
      description:
        'Care plans are clinically sound but ignore transport, housing, food, ' +
        'and benefits barriers that actually drive non-adherence. The plan ' +
        'fails and is misread as patient non-compliance.',
      detectionSignal:
        'Care-plan adherence is low specifically in the cohort with documented ' +
        'unmet social needs, and social-need data is sparse or unused.',
      diagnosticQuestion:
        'Are social barriers captured and acted on inside the care plan, or is ' +
        'non-adherence recorded without a documented cause?',
    },
    {
      key: 'fragmented_care_team_handoffs',
      name: 'Fragmented care-team handoffs',
      description:
        'Care management, primary care, specialists, behavioral health, and ' +
        'pharmacy each hold a partial view. Handoffs are by phone or fax; the ' +
        'patient repeats their story and actions fall between the seams.',
      detectionSignal:
        'No shared care plan of record; duplicate or contradictory actions ' +
        'across team members for the same patient.',
      diagnosticQuestion:
        'Where does the shared, current care plan live, and who can see and ' +
        'update it across the care team?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'rising_risk_prediction',
      name: 'Rising-risk prediction and panel targeting',
      valueMechanism:
        'A predictive model identifies patients whose risk is rising before ' +
        'their cost does, so finite care-management capacity is directed at ' +
        'patients who are still preventable rather than at patients whose ' +
        'expensive episode has already happened. Value comes from converting a ' +
        'reactive panel into a pre-emptive one.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Longitudinal claims and pharmacy history',
        'EHR problem list, vitals, and lab trends',
        'Prior utilisation and ADT history',
        'Documented social-need data where available',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends a panel; a care-management lead owns enrolment ' +
          'decisions and can override.',
        'Model drift must be monitored — populations and contracts change; ' +
          'revalidate against realised cost each period.',
        'Equity check: confirm the model does not systematically under-flag ' +
          'patients with sparse data or unmet social needs.',
      ],
      metricsMoved: [
        'avoidable_admission_rate',
        'ed_utilization_per_1000',
        'risk_adjusted_tcoc_pmpy',
        'high_risk_panel_share',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'transitions_of_care_orchestration',
      name: 'Transitions-of-care orchestration',
      valueMechanism:
        'Real-time discharge signals trigger an automatically prioritised, ' +
        'time-boxed transitions worklist — follow-up scheduling, medication ' +
        'reconciliation, and outreach — so the 72-hour window is consistently ' +
        'used. Value comes from converting a missed window into a prevented ' +
        'readmission.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Real-time ADT / discharge notification feed',
        'Discharge medication list and discharge summary',
        'Care-management platform task and contact data',
        'Appointment availability from the EHR scheduling system',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent prioritises and drafts; a care manager owns every patient ' +
          'contact and clinical judgement.',
        'Medication-reconciliation discrepancies must route to a pharmacist or ' +
          'clinician, never auto-resolve.',
        'Latency of the discharge feed bounds the whole use case — measure it ' +
          'before sizing value.',
      ],
      metricsMoved: [
        'readmission_rate_30d',
        'transitions_of_care_followup_72h',
        'medication_reconciliation_completion',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'care_gap_intelligence',
      name: 'Care-gap intelligence and outreach prioritisation',
      valueMechanism:
        'Open care gaps across claims, EHR, and quality measures are ' +
        'reconciled, de-duplicated, and ranked by closeability and clinical ' +
        'value, and outreach is sequenced accordingly. Value comes from ' +
        'closing more of the gaps that matter with the same outreach effort.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Claims-based and EHR-based quality-measure gap data',
        'Care-management platform gap registry',
        'Patient contact-preference and channel data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Gap reconciliation must not auto-close a gap on inference alone; ' +
          'closure requires a documented clinical event.',
        'Outreach prioritisation must not deprioritise patients purely because ' +
          'they are hard to reach — that compounds inequity.',
      ],
      metricsMoved: [
        'care_gap_closure_rate',
        'panel_engagement_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'care_manager_documentation_copilot',
      name: 'Care-manager documentation and summary copilot',
      valueMechanism:
        'A copilot drafts care-management notes, assembles a longitudinal ' +
        'patient summary across the EHR and care-management platform, and ' +
        'pre-populates care-plan updates. Value comes from returning care-' +
        'manager time from documentation to patient contact, raising effective ' +
        'capacity without adding headcount.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR clinical notes, problem list, and recent encounters',
        'Care-management platform contact and care-plan history',
        'Claims-derived utilisation timeline',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Every drafted note and care-plan change is reviewed and attested by ' +
          'the care manager before it is saved.',
        'The summary must cite its source records so the care manager can ' +
          'verify, never present an unsourced synthesis.',
        'PHI handling and the deployment lane must be settled before build.',
      ],
      metricsMoved: [
        'panel_engagement_rate',
        'care_manager_caseload',
        'care_plan_adherence_rate',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'patient_outreach_engagement_agent',
      name: 'Multi-channel patient outreach and engagement agent',
      valueMechanism:
        'An outreach agent runs structured, multi-channel check-ins, ' +
        'appointment and medication reminders, and symptom triage prompts, ' +
        'escalating anything clinical to a care manager. Value comes from ' +
        'lifting engagement and activation for patients a thinly staffed team ' +
        'could never reach at cadence.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Patient contact details, channel preference, and consent',
        'Care-plan tasks and appointment schedule',
        'Care-management platform escalation routing',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent does not give clinical advice; any clinical signal ' +
          'escalates to a licensed care manager.',
        'Consent and channel rules (including TCPA-style constraints) gate ' +
          'every contact.',
        'Engagement must be measured by substantive contact, not by messages ' +
          'sent — a vanity-metric trap.',
      ],
      metricsMoved: [
        'panel_engagement_rate',
        'patient_activation_measure',
        'care_plan_adherence_rate',
      ],
      relatedArchetypePlaybook: 'contact_center_ai',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'longitudinal_record_assembly',
      name: 'Longitudinal patient-record assembly layer',
      description:
        'A reconciliation layer that assembles a single longitudinal view of ' +
        'each managed patient from claims, the EHR, ADT, pharmacy, and care-' +
        'management data — with identity resolution and a freshness stamp on ' +
        'each source. Every downstream care-management AI consumes this layer ' +
        'rather than querying source systems directly.',
      boundary:
        'It assembles and reconciles; it does not make clinical decisions and ' +
        'does not write back to source systems. It is a read model.',
      humanAccountabilityPoint:
        'The data-governance owner accountable for the master patient index ' +
        'and source-feed freshness.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'population_health',
    },
    {
      key: 'stratify_then_route',
      name: 'Stratify-then-route panel operating pattern',
      description:
        'Risk stratification produces tiered panels; a routing layer assigns ' +
        'patients to care managers by acuity-weighted caseload and matches ' +
        'program type to tier. The stratification model is revalidated against ' +
        'realised cost on a fixed cadence.',
      boundary:
        'It proposes panels and assignments; a care-management lead approves ' +
        'enrolment and can reassign. It does not set clinical care plans.',
      humanAccountabilityPoint:
        'The care-management operations lead who owns panel composition and ' +
        'caseload calibration.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'event_triggered_worklist',
      name: 'Event-triggered transitions worklist',
      description:
        'A real-time ADT and discharge feed triggers a prioritised, time-boxed ' +
        'worklist for transitions of care. Tasks are auto-prioritised and ' +
        'pre-drafted; a care manager works the list and owns every contact. ' +
        'The pattern is measured on window-adherence, not task volume.',
      boundary:
        'It prioritises and drafts; it does not contact patients autonomously ' +
        'and does not resolve medication discrepancies — those route to a ' +
        'pharmacist or clinician.',
      humanAccountabilityPoint:
        'The transitions-of-care care manager working the patient, with a ' +
        'pharmacist accountable for medication reconciliation.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'shared_care_plan_of_record',
      name: 'Shared care-plan of record',
      description:
        'A single shared care plan visible and updatable across care ' +
        'management, primary care, specialists, behavioral health, and ' +
        'pharmacy, with each action carrying an owner and a due date. AI ' +
        'copilots draft updates into it; humans attest. It is the system of ' +
        'record for "what is the plan for this patient".',
      boundary:
        'It holds the plan and the action ledger; it is not the clinical EHR ' +
        'of record and does not replace clinical documentation.',
      humanAccountabilityPoint:
        'The named accountable clinician or care manager who owns the ' +
        "patient's care plan.",
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'closed_loop_outreach',
      name: 'Closed-loop outreach with clinical escalation',
      description:
        'A multi-channel outreach layer that runs structured non-clinical ' +
        'contact at cadence and closes the loop into the care-management ' +
        'platform — every interaction logged, every clinical signal escalated ' +
        'to a licensed care manager through a defined routing path.',
      boundary:
        'It handles scheduling, reminders, and structured check-ins; it does ' +
        'not triage clinically or give medical advice — clinical signals ' +
        'escalate.',
      humanAccountabilityPoint:
        'The care manager who receives escalations and owns clinical follow-up.',
      controlPosture: 'human-approval-required',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Care-management value is realised by bending the cost trajectory of a ' +
      'risk-bearing population: preventing avoidable admissions and ' +
      'readmissions, diverting avoidable ED use, and closing the gaps that ' +
      'drive quality revenue. The economic engine is the VBC contract — ' +
      'shared savings, capitation, or a quality bonus — so realised value is ' +
      'always the product of (clinical effect) and (contract structure). A ' +
      'real clinical improvement on a population with no downside contract ' +
      'still produces little provider-side value; the value model must be ' +
      'read against the contract, not in isolation.',
    dominantHaircutFactors: [
      {
        factor: 'Patient engagement and reach',
        rationale:
          'Care management only moves outcomes for patients it actually ' +
          'reaches. Engagement is the single largest source of forecast ' +
          'shortfall — a plan modelled on the enrolled panel but delivered to ' +
          'the engaged panel overstates value by the engagement gap.',
        typicalHaircut: {
          low: 0.25,
          high: 0.5,
          basis:
            'The gap between enrolled and substantively engaged patients in ' +
            'typical programs; a planning range, calibrate to the tenant.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data readiness and feed latency',
        rationale:
          'Stale attribution and late discharge notifications cap how much of ' +
          'the modelled intervention can actually be delivered in time. The ' +
          'transitions use cases are especially sensitive to ADT latency.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion attributable to attribution churn and ' +
            'notification latency; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Contract structure and attribution',
        rationale:
          'Upside-only contracts, low attributed volume, and short ' +
          'performance years all cap the provider share of any clinical ' +
          'improvement. A clinically sound program under a weak contract ' +
          'realises a fraction of its modelled value.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Provider-side value erosion from contract design; a planning ' +
            'range driven by the specific contract mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Care-management capacity',
        rationale:
          'Finite, acuity-blind caseloads cap the panel a program can truly ' +
          'manage. A value forecast modelled on an ideal caseload but ' +
          'delivered by an overloaded team erodes through missed cadence.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from staffing capacity constraints; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Risk-adjusted total-cost-of-care reduction',
        range: {
          low: 1.5,
          high: 6,
          basis:
            'Achievable risk-adjusted TCOC reduction for a well-run care-' +
            'management program on a managed population; a planning range ' +
            'spanning early-stage and mature programs.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in risk-adjusted PMPY for the managed cohort ' +
          'against a matched baseline.',
      },
      {
        lever: '30-day readmission reduction',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative reduction in 30-day readmissions attributable to a ' +
            'transitions-of-care program; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the 30-day all-cause readmission ' +
          'rate for the managed cohort.',
      },
      {
        lever: 'Avoidable ED-visit reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in avoidable ED utilisation from improved ' +
            'access and chronic-disease management; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in ED visits per 1,000 for the managed ' +
          'cohort.',
      },
    ],
    timeToValueBand:
      '6–12 months to first measurable clinical signal (readmissions, ' +
      'transitions metrics); 12–24 months to a settled contract-year ' +
      'financial result, because shared-savings reconciliation lags the ' +
      'performance year.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Care-management platform',
        role:
          'The system of record for the managed panel — enrolment, care ' +
          'plans, contacts, gap registries, and care-manager workflow.',
        examples: ['Innovaccer', 'Arcadia', 'Epic Healthy Planet', 'Athena'],
      },
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record — encounters, problem lists, orders, ' +
          'results, and discharge documentation.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'Meditech'],
      },
      {
        name: 'Payer claims and attribution feed',
        role:
          'Defines the attributed population and provides the longitudinal ' +
          'cost and utilisation history that anchors TCOC.',
        examples: [
          'Payer 837/835 claims extracts',
          'ACO attribution files',
          'MA member rosters',
        ],
      },
      {
        name: 'ADT / event-notification feed',
        role:
          'Real-time admit-discharge-transfer notifications that trigger ' +
          'transitions-of-care workflow.',
        examples: ['Statewide HIE ADT feeds', 'Epic Care Everywhere', 'Bamboo Health'],
      },
      {
        name: 'Risk-adjustment / stratification engine',
        role:
          'Produces the HCC/RAF risk scores and the risk-tier stratification ' +
          'that size and target the managed panel.',
        examples: ['CMS-HCC model', 'Johns Hopkins ACG', 'vendor risk models'],
      },
    ],
    roles: [
      {
        title: 'Chief Medical Officer / VP Population Health',
        accountability:
          'Owns the clinical outcomes and the VBC performance the care-' +
          'management operation is accountable for.',
      },
      {
        title: 'Care-management operations director',
        accountability:
          'Owns panel composition, caseload calibration, staffing, and the ' +
          'care-management workflow.',
      },
      {
        title: 'Care manager (RN / LCSW / community health worker)',
        accountability:
          'Owns the patient relationship — assessment, the care plan, ' +
          'contacts, and clinical follow-up for an assigned panel.',
      },
      {
        title: 'Transitions-of-care pharmacist',
        accountability:
          'Owns post-discharge medication reconciliation and the resolution ' +
          'of medication discrepancies.',
      },
      {
        title: 'VBC contracting / actuary lead',
        accountability:
          'Owns the contract economics and the translation of clinical ' +
          'improvement into provider-side financial value.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Medicare Shared Savings Program (MSSP)',
        relevance:
          'The dominant Medicare ACO program; defines attribution, the ' +
          'benchmark, and the shared-savings/-loss settlement care management ' +
          'is judged against.',
      },
      {
        name: 'ACO REACH',
        relevance:
          'A capitated CMS accountable-care model with full risk; care ' +
          'management under REACH carries a stronger economic engine and a ' +
          'health-equity benchmark adjustment.',
      },
      {
        name: 'Medicare Advantage (MA)',
        relevance:
          'Capitated payment with risk-adjusted revenue; care management ' +
          'under MA must move both cost and Star quality measures.',
      },
      {
        name: 'CMS chronic care management (CCM) and transitional care ' +
          'management (TCM) billing codes',
        relevance:
          'Fee-for-service billing pathways that can fund care-management ' +
          'staffing alongside the VBC contract.',
      },
      {
        name: 'HIPAA and 42 CFR Part 2',
        relevance:
          'Govern PHI handling across the care team; Part 2 adds stricter ' +
          'segmentation for substance-use-disorder data in shared care plans.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Attributed population',
        definition:
          'The set of patients a provider organisation is financially ' +
          'accountable for under a VBC contract, assigned by a payer ' +
          'attribution rule.',
      },
      {
        term: 'Total cost of care (TCOC)',
        definition:
          'All medical and pharmacy spend for an attributed population over a ' +
          'period — the figure VBC contracts settle on.',
      },
      {
        term: 'HCC / RAF score',
        definition:
          'Hierarchical Condition Category coding rolled into a Risk ' +
          'Adjustment Factor — the score that normalises payment and ' +
          'benchmarks for population acuity.',
      },
      {
        term: 'Rising-risk patient',
        definition:
          'A patient not yet high-cost but on a trajectory toward it — the ' +
          'population care management can still pre-empt.',
      },
      {
        term: 'Transitions of care (TOC)',
        definition:
          'The clinical and logistical handoff when a patient moves between ' +
          'care settings, especially the post-discharge window.',
      },
      {
        term: 'Care gap',
        definition:
          'A recommended preventive or chronic-care action that is due or ' +
          'overdue for a patient and not yet completed.',
      },
      {
        term: 'Ambulatory-care-sensitive condition',
        definition:
          'A condition for which good outpatient care can prevent the need ' +
          'for hospitalisation — the basis of the avoidable-admission metric.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Care-Management Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the care-management operation is leaking value on a ' +
        'specific risk-bearing population, with baseline evidence, before any ' +
        'solution is shaped.',
      sections: [
        {
          heading: 'Population and contract context',
          guidance:
            'Name the attributed population, its size, the VBC contract type ' +
            'and risk posture, the performance year, and the attribution rule. ' +
            'State which payer feeds and ADT feeds are available and how fresh ' +
            'they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the function ' +
            'expects — risk-adjusted TCOC, readmissions, ED utilisation, gap ' +
            'closure, engagement, transitions follow-up. For any metric the ' +
            'tenant does not record, name it as a precise seed gap with its ' +
            'expected data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — stale attribution, discharge ' +
            'latency, engagement ceiling, uncalibrated stratification, ' +
            'caseload overload, social-barrier blindness, fragmented handoffs ' +
            '— and state which are present with their detection signal and ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges, explicitly haircut by engagement, data ' +
            'readiness, and contract structure. Every figure is a labelled ' +
            'planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns each ' +
            'source, and what each gap blocks. A missing metric is a named ' +
            'ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to and ' +
            'why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Care-Management Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a care-management AI ' +
        'Move on this population — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value, the time-to-value ' +
            'band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric. Where a baseline is a seed gap, say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, then ' +
            'apply each dominant haircut factor — engagement, data readiness, ' +
            'contract structure, capacity — explicitly and show the haircut ' +
            'math. Read the forecast against the actual VBC contract.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the care-management platform ' +
            'and ADT feeds, and the care-management operating-model change ' +
            '(staffing, caseload recalibration).',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under low engagement, high feed latency, ' +
            'and a weaker contract outcome. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to prove ' +
            'the forecast, and the measurement cadence.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Care-Management Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'care-management AI capability, grounded in the function reference ' +
        'patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference patterns ' +
            '— longitudinal record assembly, stratify-then-route, event-' +
            'triggered worklist, shared care plan, closed-loop outreach — and ' +
            'state which apply and how they connect.',
        },
        {
          heading: 'Data architecture and feeds',
          guidance:
            'Specify the claims, EHR, ADT, pharmacy, and stratification feeds, ' +
            'their latency, identity resolution, and the freshness discipline ' +
            'each downstream use case depends on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. No archetype ships without a named human owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how care-manager workflow, caseload calibration, and care-' +
            'team handoffs change, and who owns each change.',
        },
        {
          heading: 'Responsible-AI and clinical-governance controls',
          guidance:
            'State the model-monitoring, equity-check, PHI-handling, and ' +
            'clinical-governance controls, and the regulatory frames (MSSP, ' +
            'MA, HIPAA, Part 2) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, integration patterns to the care-' +
            'management platform and EHR, and the phased rollout.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Care-Management Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the care-management AI capability so ' +
        'value is realised, not just deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — feed integration and validation, pilot ' +
            'panel, care-manager onboarding, scale — with milestones tied to ' +
            'the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — data feeds, ' +
            'stratification calibration, care-manager adoption, clinical ' +
            'governance, Tower measurement.',
        },
        {
          heading: 'Care-manager adoption approach',
          guidance:
            'Define the change runway for care managers — training, workflow ' +
            'change, the documentation-copilot rollout — and how adoption is ' +
            'measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for each ' +
            'metric.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — feed latency, engagement shortfall, ' +
            'caseload overload — with the escalation owner and the trigger for ' +
            'each.',
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
      claim: 'The baseline risk-adjusted total cost of care for the population',
      authoritativeSource:
        'Reconciled payer claims feed for the attributed population, ' +
        'risk-normalised by the HCC/RAF model.',
      whatGoodEvidenceLooksLike:
        'A full performance-year claims extract for the attributed members, ' +
        'reconciled to the payer settlement file, with the risk score and ' +
        'member-months stated.',
      weakEvidenceToReject:
        'A care-management-platform cost estimate, a single quarter ' +
        'annualised, or a TCOC figure with no stated risk normalisation.',
    },
    {
      claim: 'The 30-day readmission rate for the managed population',
      authoritativeSource:
        'ADT discharge feed plus payer claims, with index admissions and ' +
        'readmissions defined by a stated all-cause methodology.',
      whatGoodEvidenceLooksLike:
        'A denominator of index discharges and a numerator of 30-day ' +
        'readmissions, both traceable to claims or ADT, with the inclusion ' +
        'rules stated.',
      weakEvidenceToReject:
        'A readmission rate quoted with no methodology, or a hospital-wide ' +
        'rate used as a proxy for the attributed population.',
    },
    {
      claim: 'Care-management engagement — that patients are actually reached',
      authoritativeSource:
        'Care-management platform contact and documentation logs.',
      whatGoodEvidenceLooksLike:
        'Documented substantive contacts per enrolled patient against the ' +
        'expected cadence for their risk tier.',
      weakEvidenceToReject:
        'Enrolment counts presented as engagement, or outbound messages ' +
        'sent counted as substantive contact.',
    },
    {
      claim: 'That the risk-stratification model targets the right patients',
      authoritativeSource:
        'A back-test of model-assigned risk tiers against realised cost in ' +
        'the following period.',
      whatGoodEvidenceLooksLike:
        'A validation showing the model-flagged high-risk tier captures a ' +
        'large share of the patients who in fact generated the top cost ' +
        'decile, with the validation date stated.',
      weakEvidenceToReject:
        'A vendor accuracy claim with no tenant-specific back-test, or a ' +
        'model never revalidated since go-live.',
    },
    {
      claim: 'The forecast value of a care-management AI Move',
      authoritativeSource:
        'The value model — benchmark ranges haircut by the dominant ' +
        'factors — read against the specific VBC contract.',
      whatGoodEvidenceLooksLike:
        'A forecast built from a measured baseline, with each haircut factor ' +
        'applied explicitly and the contract structure stated, every figure ' +
        'a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the contract structure.',
    },
  ],
};
