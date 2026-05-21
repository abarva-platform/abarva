// Domain Function Pack — Healthcare provider · Patient access, engagement & experience.
//
// Function key: `patient_access_engagement_experience`.
//
// This is the function that owns the patient's path INTO and ALONGSIDE care:
// the digital front door, scheduling and appointment access, the contact
// centre, referral management, patient communications and outreach, the
// patient portal, and the reported experience of all of it. It is where a
// patient first touches the organisation and where they decide — often before
// any clinician is involved — whether to stay in-system or leak out. It is the
// function with the highest density of AI bets in healthcare provider
// operations: scheduling and triage, the digital front door, contact-centre
// assist, patient communications and outreach, and referral management are all
// active, distinct archetypes, and they are specified in full below.
//
// Access is also a revenue and equity function at once. Slow access leaks
// volume and margin to competitors; it also disproportionately turns away the
// patients with the least slack — those who cannot wait three weeks, navigate
// a phone tree, or take time off for an inconvenient slot. A patient-access
// program is judged on access speed, conversion and retention, AND on whether
// it widened or narrowed the equity gap.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const patientAccessEngagementExperiencePack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'patient_access_engagement_experience',
  functionLabel: 'Patient access, engagement & experience',
  summary:
    'Patient access, engagement & experience is the function that owns the ' +
    "patient's path into and alongside care: the digital front door, " +
    'scheduling and appointment access, the contact centre, referral ' +
    'management, patient communications and outreach, the patient portal, and ' +
    'the reported experience of all of it. It is the first and most frequent ' +
    'touchpoint a patient has with the organisation, and the point at which ' +
    'volume, margin, and loyalty are won or lost — usually before a clinician ' +
    'is ever involved. Slow or hard access leaks patients to competitors and ' +
    'sends avoidable demand to the emergency department; it also falls ' +
    'hardest on the patients with the least slack, making access an equity ' +
    'function as much as a growth one. The function is judged on how fast and ' +
    'how easily patients can get care, on how much of the demand it converts ' +
    'and retains in-network, and on the experience patients report.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'third_next_available_appointment',
      name: 'Third-next-available appointment lag',
      definition:
        'The average number of calendar days until the third available new-' +
        'patient or routine appointment slot — the standard access measure, ' +
        'using the third slot rather than the first because the first is ' +
        'distorted by cancellations.',
      unit: 'calendar days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 7,
        high: 30,
        basis:
          'Third-next-available lag varies sharply by specialty and market — ' +
          'primary care and high-demand specialties run long. A planning ' +
          'range; place the point using the tenant specialty mix.',
        label: 'planning-range',
      },
      dataSource:
        'EHR / practice-management scheduling system, calculated per ' +
        'department and provider.',
      whyItMatters:
        'It is the cleanest single measure of how hard it is to get care; ' +
        'long access lag is the leading cause of leakage, avoidable ED use, ' +
        'and lost new-patient volume.',
    },
    {
      key: 'no_show_rate',
      name: 'No-show and same-day cancellation rate',
      definition:
        'The share of scheduled appointments where the patient does not ' +
        'attend and does not cancel with enough notice for the slot to be ' +
        'refilled — combining no-shows and late cancellations.',
      unit: '% of scheduled appointments',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'No-show rates vary widely with specialty, payer mix, social ' +
          'complexity, and reminder maturity; primary care and behavioral ' +
          'health run higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR / practice-management appointment-status data.',
      whyItMatters:
        'A no-show is wasted clinical capacity and a patient who did not get ' +
        'care; the rate is both an efficiency metric and an early signal of ' +
        'an access or engagement barrier.',
    },
    {
      key: 'digital_self_scheduling_adoption',
      name: 'Digital self-scheduling adoption rate',
      definition:
        'The share of eligible appointments booked by the patient through a ' +
        'digital self-scheduling channel rather than via a phone call to the ' +
        'contact centre or office.',
      unit: '% of eligible appointments self-scheduled',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 10,
        high: 45,
        basis:
          'Digital self-scheduling adoption depends on how many visit types ' +
          'are exposed to it and how usable the front door is; it is rising ' +
          'but rarely the majority channel. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Digital front-door / patient-portal scheduling analytics reconciled ' +
        'against the practice-management system.',
      whyItMatters:
        'Self-scheduling shifts demand off the contact centre, is available ' +
        '24/7, and is what patients increasingly expect; low adoption usually ' +
        'means too few visit types are bookable digitally.',
    },
    {
      key: 'call_abandonment_rate',
      name: 'Contact-centre call abandonment rate',
      definition:
        'The share of inbound contact-centre calls where the caller hangs up ' +
        'before reaching an agent.',
      unit: '% of inbound calls',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 15,
        basis:
          'Call abandonment tracks staffing, call volume, and hold time; it ' +
          'spikes at peak periods and in understaffed centres. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Contact-centre telephony / ACD (automatic call distributor) ' +
        'platform.',
      whyItMatters:
        'An abandoned call is very often an abandoned care need — the ' +
        'patient leaks, defers, or escalates to the ED; abandonment is the ' +
        'sharpest contact-centre failure signal.',
    },
    {
      key: 'average_speed_of_answer',
      name: 'Average speed of answer',
      definition:
        'The average time an inbound contact-centre caller waits before an ' +
        'agent answers.',
      unit: 'seconds',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 120,
        basis:
          'Average speed of answer in healthcare contact centres spans well-' +
          'staffed to badly congested; a planning range driven by staffing ' +
          'and volume.',
        label: 'planning-range',
      },
      dataSource:
        'Contact-centre telephony / ACD platform.',
      whyItMatters:
        'Wait time directly drives abandonment and patient frustration; it ' +
        'is the contact-centre metric patients feel most immediately.',
    },
    {
      key: 'first_contact_resolution',
      name: 'First-contact resolution rate',
      definition:
        'The share of patient contacts whose reason is fully resolved in a ' +
        'single interaction, without a transfer, a callback, or the patient ' +
        'having to make contact again.',
      unit: '% of contacts',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 85,
        basis:
          'First-contact resolution depends on agent tooling, system access, ' +
          'and the breadth of what an agent is empowered to do. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Contact-centre platform interaction and disposition data, ' +
        'reconciled against repeat-contact tracking.',
      whyItMatters:
        'Low first-contact resolution multiplies contact volume and patient ' +
        'effort; it is the efficiency-and-experience metric that best ' +
        'predicts both cost and satisfaction.',
    },
    {
      key: 'patient_portal_activation_rate',
      name: 'Patient-portal activation rate',
      definition:
        'The share of the active patient population with an activated, ' +
        'usable patient-portal account.',
      unit: '% of active patients',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 80,
        basis:
          'Portal activation varies with age, digital access, and how hard ' +
          'the organisation drives enrolment; activation overstates real use. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Patient-portal platform account and engagement analytics.',
      whyItMatters:
        'The portal is the lowest-cost engagement and self-service channel; ' +
        'activation sizes how much demand can be served digitally — and a ' +
        'low rate in specific subgroups is an equity signal.',
    },
    {
      key: 'referral_to_appointment_conversion',
      name: 'Referral-to-appointment conversion rate',
      definition:
        'The share of placed referrals that result in a completed ' +
        'appointment with the referred-to provider within an expected ' +
        'window.',
      unit: '% of referrals converted to a completed appointment',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 80,
        basis:
          'Referral conversion leaks at every step — scheduling, patient ' +
          'follow-through, out-of-network capture; high-performing referral ' +
          'operations push the upper end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR referral-management module reconciled against completed-' +
        'encounter and claims data.',
      whyItMatters:
        'A referral that never converts is a care gap and a leaked patient; ' +
        'conversion is where access failures and network leakage compound.',
    },
    {
      key: 'network_leakage_rate',
      name: 'Network leakage at the access point',
      definition:
        'The share of referrals and bookable demand for in-network-capable ' +
        'services that is nonetheless completed out of network.',
      unit: '% of in-network-capable demand completed out of network',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 40,
        basis:
          'Access-point leakage is driven by appointment availability, ' +
          'referral-workflow friction, and patient convenience; it varies ' +
          'with specialty coverage and geography. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Referral-management and claims data classified against the network ' +
        'and the organisation\'s own service availability.',
      whyItMatters:
        'Leakage at the access point loses revenue and removes the patient ' +
        'from coordinated, in-network care — and much of it is caused by ' +
        'access friction the function can actually fix.',
    },
    {
      key: 'time_to_third_party_care',
      name: 'Time to care (request to completed visit)',
      definition:
        'The median elapsed time from a patient first requesting care — by ' +
        'call, digital channel, or referral — to a completed appointment for ' +
        'that need.',
      unit: 'calendar days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 21,
        basis:
          'End-to-end time to care spans the full access journey, not just ' +
          'slot availability; it is longer than third-next-available because ' +
          'it includes scheduling friction and patient follow-through. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Reconciled request-channel timestamps (contact centre, digital ' +
        'front door, referral) against the completed encounter in the EHR.',
      whyItMatters:
        'It is the patient-experienced measure of access — the whole journey ' +
        'end to end — and the figure that best correlates with leakage and ' +
        'with deferred care.',
    },
    {
      key: 'patient_experience_score',
      name: 'Patient-reported access experience (CAHPS-style)',
      definition:
        'A validated patient-reported measure of the access and service ' +
        'experience — getting appointments, getting timely care and ' +
        'information, contact-centre courtesy — drawn from a CAHPS-style ' +
        'survey.',
      unit: 'top-box / composite score (0–100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 85,
        basis:
          'CAHPS-style access-domain top-box scores sit in a wide band; the ' +
          '"getting timely appointments and care" domain is persistently one ' +
          'of the weakest. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CAHPS-style patient-experience survey (e.g. CG-CAHPS for ambulatory ' +
        'access).',
      whyItMatters:
        'It is the patient\'s own verdict on access; it also feeds ' +
        'reputation, loyalty, and — for relevant programs — quality-linked ' +
        'revenue.',
    },
    {
      key: 'new_patient_acquisition_rate',
      name: 'New-patient acquisition and conversion rate',
      definition:
        'The share of new-patient inquiries — calls, digital inquiries, ' +
        'referrals — that convert into a completed first appointment.',
      unit: '% of new-patient inquiries converted',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 65,
        basis:
          'New-patient conversion leaks heavily at the access step; ' +
          'availability and front-door friction drive the spread. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Contact-centre, digital front-door, and CRM inquiry tracking ' +
        'reconciled against completed first encounters.',
      whyItMatters:
        'New-patient conversion is the growth engine of the function; a ' +
        'lost new-patient inquiry is a lost lifetime relationship, not just ' +
        'a lost visit.',
    },
    {
      key: 'outreach_engagement_rate',
      name: 'Proactive-outreach engagement rate',
      definition:
        'The share of patients reached by a proactive outreach campaign — ' +
        'recall, gap closure, preventive reminders — who take the intended ' +
        'action, such as booking or completing the recommended visit.',
      unit: '% of contacted patients who take the intended action',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 10,
        high: 35,
        basis:
          'Outreach action rates vary with channel, message relevance, and ' +
          'ease of the next step; campaigns that book in one step out-perform ' +
          'those that ask the patient to call. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Outreach / population-engagement platform reconciled against ' +
        'scheduling and encounter data.',
      whyItMatters:
        'Outreach is how the function turns access from purely reactive into ' +
        'proactive; the action rate, not the send count, is what proves it ' +
        'worked.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'appointment_access_lag',
      name: 'Appointment access lag',
      description:
        'Patients cannot get an appointment for days or weeks. The delay ' +
        'pushes them to a competitor, to the emergency department, or to ' +
        'simply not getting care — and it falls hardest on the patients with ' +
        'the least ability to wait.',
      detectionSignal:
        'Long third-next-available lag, concentrated in specific specialties ' +
        'and providers; a correlation between access lag and downstream ' +
        'leakage or ED use.',
      diagnosticQuestion:
        'What is the third-next-available appointment lag by specialty, and ' +
        'where is the access bottleneck?',
    },
    {
      key: 'contact_centre_congestion',
      name: 'Contact-centre congestion',
      description:
        'The contact centre cannot answer calls fast enough. Hold times ' +
        'grow, callers abandon, and patients give up on the care they were ' +
        'calling to arrange — the failure is invisible in the EHR because the ' +
        'patient never reached a schedulable interaction.',
      detectionSignal:
        'High call-abandonment rate and long average speed of answer, ' +
        'spiking at peak periods; a long tail of repeat callers.',
      diagnosticQuestion:
        'What share of inbound calls are abandoned, how long is the wait, ' +
        'and what happens to the patients who hang up?',
    },
    {
      key: 'low_digital_front_door_adoption',
      name: 'Low digital-front-door adoption',
      description:
        'A digital front door exists but few patients use it, because too ' +
        'few visit types are bookable online, the experience is hard, or ' +
        'patients do not know it is there. Demand stays on the phone and the ' +
        'contact centre stays congested.',
      detectionSignal:
        'Low digital self-scheduling adoption and low portal activation ' +
        'despite an available digital channel; a narrow set of bookable ' +
        'visit types.',
      diagnosticQuestion:
        'How many visit types can a patient actually book digitally, and ' +
        'what share of demand uses the digital channel?',
    },
    {
      key: 'no_show_demand_waste',
      name: 'No-show demand waste',
      description:
        'A meaningful share of booked slots are lost to no-shows and late ' +
        'cancellations. Clinical capacity is wasted while other patients ' +
        'wait, and the no-show itself is usually an unaddressed barrier — ' +
        'transport, cost, an inconvenient slot — read wrongly as patient ' +
        'fault.',
      detectionSignal:
        'High no-show and same-day cancellation rates, concentrated in ' +
        'specific cohorts, with no slot-recovery or barrier-resolution ' +
        'process.',
      diagnosticQuestion:
        'What is the no-show rate, which cohorts does it concentrate in, ' +
        'and is anything done to recover the slot or address the barrier?',
    },
    {
      key: 'referral_leakage_and_loss',
      name: 'Referral leakage and loss',
      description:
        'Referrals are placed but never converted — they fall out at ' +
        'scheduling, the patient is never followed up, or they are completed ' +
        'out of network. The referring clinician assumes the patient was ' +
        'seen; the loop is never closed.',
      detectionSignal:
        'Low referral-to-appointment conversion, a backlog of unscheduled ' +
        'referrals, and high out-of-network completion of in-network-capable ' +
        'referrals.',
      diagnosticQuestion:
        'What share of referrals convert to a completed in-network ' +
        'appointment, and where in the referral workflow are they lost?',
    },
    {
      key: 'fragmented_patient_journey',
      name: 'Fragmented patient journey across channels',
      description:
        'The phone, the portal, the digital front door, and outreach each ' +
        'operate as separate channels with no shared view of the patient. ' +
        'The patient repeats themselves, gets inconsistent answers, and ' +
        'experiences the organisation as disjointed rather than as one front ' +
        'door.',
      detectionSignal:
        'No unified patient-interaction record across channels; patients ' +
        'report repeating information; agents cannot see prior digital or ' +
        'outreach activity.',
      diagnosticQuestion:
        'Is there one view of the patient across the phone, portal, digital ' +
        'front door, and outreach, or does each channel start from zero?',
    },
    {
      key: 'access_equity_gap',
      name: 'Access-equity gap',
      description:
        'Access barriers — phone-only scheduling, English-only channels, ' +
        'inconvenient slots, digital-only self-service — fall hardest on the ' +
        'patients with the least slack. The function can improve average ' +
        'access while widening the gap for the patients who most need care.',
      detectionSignal:
        'Access metrics — lag, no-show, portal activation, conversion — ' +
        'differ materially across demographic, language, or payer subgroups; ' +
        'self-service gains concentrate in already-advantaged groups.',
      diagnosticQuestion:
        'Do the access metrics differ by patient subgroup, and is a ' +
        'self-service improvement widening or narrowing the equity gap?',
    },
    {
      key: 'reactive_only_engagement',
      name: 'Reactive-only engagement',
      description:
        'The function only responds to patients who reach out; it does ' +
        'nothing proactive to bring patients in for needed care. Care gaps, ' +
        'overdue recalls, and rising-need patients are left until they ' +
        'become an acute, expensive contact.',
      detectionSignal:
        'No structured proactive-outreach program, or outreach that is ' +
        'send-heavy and action-light; recall and gap-closure demand sits ' +
        'unworked.',
      diagnosticQuestion:
        'What proactive outreach brings patients in for needed care, and ' +
        'what share of contacted patients actually act on it?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_scheduling_and_triage',
      name: 'AI scheduling and clinical triage',
      valueMechanism:
        'A model matches a patient\'s stated need to the right visit type, ' +
        'provider, and slot — applying clinical triage logic so urgent needs ' +
        'are surfaced and lower-acuity needs are routed to the appropriate ' +
        'channel — and books the appointment. Value comes from shortening ' +
        'access lag, filling capacity more efficiently, deflecting avoidable ' +
        'ED demand to the right setting, and removing scheduling friction ' +
        'that drives leakage.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR / practice-management scheduling rules and provider availability',
        'Visit-type and provider-matching logic and clinical triage protocols',
        'Patient demographic, insurance, and prior-visit context',
        'Symptom or reason-for-visit input from the patient',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Clinical triage is decision support, not diagnosis — any urgent or ' +
          'red-flag presentation must escalate to a clinician or a nurse ' +
          'line, never be self-resolved by the model.',
        'Triage logic must be clinically governed and validated; mis-triage ' +
          'is a patient-safety event, and under-triage is the dangerous ' +
          'direction.',
        'Test for equity — triage and slot-matching must not systematically ' +
          'route disadvantaged patients to worse access.',
      ],
      metricsMoved: [
        'third_next_available_appointment',
        'time_to_third_party_care',
        'digital_self_scheduling_adoption',
        'network_leakage_rate',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'digital_front_door',
      name: 'Digital front door and conversational self-service',
      valueMechanism:
        'A conversational, always-on digital front door lets patients find ' +
        'care, self-schedule, complete intake, and get answers without a ' +
        'phone call. Value comes from shifting demand off the contact ' +
        'centre, capturing demand outside business hours, raising new-patient ' +
        'conversion by removing friction, and meeting the access expectation ' +
        'patients now bring from every other industry.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Bookable visit-type catalogue and real-time provider availability',
        'Provider directory, services, and location data',
        'Digital intake forms and insurance-eligibility data',
        'Patient-identity matching to the EHR / portal',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The front door handles navigation, scheduling, and intake — not ' +
          'clinical advice; any clinical question routes to a clinical ' +
          'channel.',
        'A digital-only front door can exclude patients without digital ' +
          'access or English fluency — a staffed channel must remain a ' +
          'first-class equal, not a fallback.',
        'Patient-identity matching must be accurate; a mismatched record is ' +
          'both a safety and a privacy failure.',
      ],
      metricsMoved: [
        'digital_self_scheduling_adoption',
        'patient_portal_activation_rate',
        'new_patient_acquisition_rate',
        'call_abandonment_rate',
      ],
      relatedArchetypePlaybook: 'contact_center_ai',
    },
    {
      key: 'contact_centre_assist',
      name: 'Contact-centre agent assist and call automation',
      valueMechanism:
        'AI handles routine contact-centre interactions end to end — ' +
        'appointment booking, simple questions, prescription-refill requests ' +
        '— and assists agents on the rest with real-time information ' +
        'retrieval, next-best-action prompts, and after-call summarisation. ' +
        'Value comes from cutting hold time and abandonment, raising first-' +
        'contact resolution, and freeing agent capacity for the complex, ' +
        'high-empathy interactions that need a human.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Contact-centre telephony / ACD and interaction data',
        'Scheduling, provider, and patient-account systems for agent retrieval',
        'A knowledge base of policies, services, and FAQs',
        'Call-disposition and repeat-contact tracking',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Automated handling is confined to clearly non-clinical, well-' +
          'bounded interactions; anything clinical or ambiguous routes to a ' +
          'human agent or a nurse line.',
        'A clean, low-friction escalation path to a human must always be ' +
          'available — trapping a patient in automation is a failure.',
        'After-call summaries and agent prompts are drafted for the agent; ' +
          'the agent owns what is recorded and what is told to the patient.',
      ],
      metricsMoved: [
        'call_abandonment_rate',
        'average_speed_of_answer',
        'first_contact_resolution',
      ],
      relatedArchetypePlaybook: 'contact_center_ai',
    },
    {
      key: 'patient_communications_outreach',
      name: 'Proactive patient communications and outreach',
      valueMechanism:
        'A model runs targeted, multi-channel proactive outreach — recall ' +
        'campaigns, care-gap and preventive reminders, no-show-risk ' +
        'reminders — personalising the message, channel, and timing and ' +
        'making the next step a single tap to book. Value comes from ' +
        'converting reactive access into proactive engagement: bringing ' +
        'patients in for needed care, recovering no-show-bound slots, and ' +
        'closing care gaps before they become acute.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Patient contact details, channel preference, language, and consent',
        'Care-gap, recall, and overdue-visit data',
        'No-show-risk signals and appointment history',
        'Scheduling availability so the message can book in one step',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'Outreach is non-clinical communication — any clinical reply or ' +
          'symptom from a patient must escalate to a clinical channel.',
        'Consent, channel rules, and contact-frequency limits (including ' +
          'TCPA-style constraints) gate every message; over-contacting ' +
          'patients erodes trust.',
        'Success is measured by the patient action taken — booked, ' +
          'completed, gap closed — never by messages sent.',
        'No-show-risk modelling must not be used to deprioritise or ' +
          'penalise high-risk patients; it must trigger support, not ' +
          'exclusion.',
      ],
      metricsMoved: [
        'outreach_engagement_rate',
        'no_show_rate',
        'patient_experience_score',
      ],
      relatedArchetypePlaybook: 'marketing_personalization',
    },
    {
      key: 'referral_management_intelligence',
      name: 'Referral management and leakage-recovery intelligence',
      valueMechanism:
        'A model tracks every placed referral, flags those at risk of ' +
        'falling out — unscheduled, stalled, or heading out of network — and ' +
        'drives the next action to convert them, surfacing in-network, ' +
        'timely options at the point of referral. Value comes from closing ' +
        'the referral loop: lifting referral-to-appointment conversion, ' +
        'recovering leaked volume and margin, and ensuring referred care ' +
        'actually happens.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR referral-management module and referral-status data',
        'Provider availability and in-network service capability',
        'Completed-encounter and claims data to confirm conversion',
        'Patient contact and scheduling data for follow-up',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Referral steering must respect the referring clinician\'s clinical ' +
          'intent and the patient\'s choice — it informs and recovers, it ' +
          'does not override.',
        'In-network steering must be clinically appropriate and transparent, ' +
          'never a black-box push toward owned facilities at the patient\'s ' +
          'expense.',
        'Closing the loop requires confirmed completion data, not an assumed ' +
          'booking.',
      ],
      metricsMoved: [
        'referral_to_appointment_conversion',
        'network_leakage_rate',
        'new_patient_acquisition_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'patient_experience_intelligence',
      name: 'Patient-experience and journey intelligence',
      valueMechanism:
        'A model assembles the patient\'s journey and feedback across every ' +
        'channel — survey verbatims, contact-centre interactions, portal ' +
        'and digital-front-door behaviour — and surfaces where the access ' +
        'experience is failing, for which subgroups, and why. Value comes ' +
        'from turning fragmented experience signals into a prioritised, ' +
        'equity-aware improvement backlog instead of a lagging survey score.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'CAHPS-style survey responses and free-text verbatims',
        'Cross-channel patient-interaction data (phone, portal, front door)',
        'Access operating metrics decomposed by patient subgroup',
        'Complaint and grievance data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'It surfaces patterns and prioritises; access and experience leaders ' +
          'own the improvement decisions.',
        'Subgroup analysis must be handled carefully — the intent is to ' +
          'close equity gaps, and the analysis must not itself stigmatise a ' +
          'group.',
        'Free-text verbatim analysis must protect patient privacy and not ' +
          're-identify individuals.',
      ],
      metricsMoved: [
        'patient_experience_score',
        'first_contact_resolution',
        'time_to_third_party_care',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_digital_front_door',
      name: 'Unified digital front door',
      description:
        'A single patient-facing entry layer — find care, self-schedule, ' +
        'complete intake, get answers — that sits over the practice-' +
        'management, provider-directory, and intake systems and exposes a ' +
        'consistent experience across web, app, and conversational channels. ' +
        'A staffed channel runs in parallel as an equal path, not a fallback.',
      boundary:
        'It handles navigation, scheduling, and intake; it does not provide ' +
        'clinical advice and does not replace a clinical or nurse-triage ' +
        'channel.',
      humanAccountabilityPoint:
        'The VP / director of patient access who owns the front-door ' +
        'experience and the equal-access guarantee.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'digital_front_door',
    },
    {
      key: 'intelligent_scheduling_layer',
      name: 'Intelligent scheduling and triage layer',
      description:
        'A scheduling layer that combines clinically governed triage logic ' +
        'with provider-matching and slot optimisation, so a stated need is ' +
        'routed to the right visit type, provider, and time. Urgent ' +
        'presentations escalate; capacity is filled efficiently across the ' +
        'access channels.',
      boundary:
        'It triages for routing and schedules; it does not diagnose, and ' +
        'red-flag presentations escalate to a clinician. Clinical governance ' +
        'owns the triage protocol.',
      humanAccountabilityPoint:
        'The clinical lead who owns and validates the triage protocol, with ' +
        'the access operations lead owning scheduling.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'omnichannel_contact_layer',
      name: 'Omnichannel contact and agent-assist layer',
      description:
        'A contact layer that unifies phone, chat, portal messaging, and ' +
        'outreach into one patient-interaction record, automates routine ' +
        'non-clinical interactions, and assists agents with retrieval, ' +
        'next-best-action, and after-call summarisation — with a clean human ' +
        'escalation path always available.',
      boundary:
        'It automates and assists on non-clinical interactions; clinical ' +
        'questions route to a nurse line or clinician, and a human agent is ' +
        'always reachable.',
      humanAccountabilityPoint:
        'The contact-centre operations leader accountable for the patient ' +
        'interaction and the escalation guarantee.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'closed_loop_referral_management',
      name: 'Closed-loop referral management',
      description:
        'A pattern that tracks every referral from placement to completed ' +
        'appointment, flags at-risk referrals, drives the conversion action, ' +
        'and confirms completion against encounter and claims data — closing ' +
        'the loop back to the referring clinician.',
      boundary:
        'It tracks, flags, and drives conversion; the referring clinician ' +
        'owns the clinical intent and the patient owns the choice. It ' +
        'confirms completion on data, not assumption.',
      humanAccountabilityPoint:
        'The referral-management lead accountable for referral conversion ' +
        'and leakage recovery.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'unified_patient_interaction_record',
      name: 'Unified patient-interaction and journey record',
      description:
        'A read layer that assembles every patient interaction across phone, ' +
        'portal, digital front door, outreach, and survey feedback into one ' +
        'reconciled view, decomposed by patient subgroup. Every access AI ' +
        'and every experience-improvement decision consumes it rather than a ' +
        'per-channel silo.',
      boundary:
        'It assembles and reconciles interaction data; it is a read model, ' +
        'not a system of record, and does not itself contact patients.',
      humanAccountabilityPoint:
        'The patient-access analytics owner accountable for the unified ' +
        'interaction record and its equity decomposition.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'equity_aware_access_monitoring',
      name: 'Equity-aware access monitoring',
      description:
        'A monitoring pattern that computes every access metric decomposed ' +
        'by demographic, language, and payer subgroup, so any access or ' +
        'self-service change is evaluated for whether it widened or narrowed ' +
        'the equity gap — not just whether it moved the average.',
      boundary:
        'It measures and surfaces equity gaps; access leadership owns the ' +
        'decisions that respond to them. It does not itself allocate access.',
      humanAccountabilityPoint:
        'The access leader and the health-equity officer jointly ' +
        'accountable for closing access-equity gaps.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Patient-access value is realised through three channels. The first ' +
      'is growth and retention: faster, easier access converts more new-' +
      'patient inquiries, recovers referral and network leakage, and keeps ' +
      'patients in-system — each retained patient carrying downstream ' +
      'lifetime revenue. The second is operating efficiency: automation and ' +
      'self-service shift demand off the contact centre, recover no-show-' +
      'bound capacity, and raise first-contact resolution, lowering cost-to-' +
      'serve per interaction. The third is experience and equity: a better ' +
      'reported access experience feeds reputation and loyalty and, for ' +
      'relevant programs, quality-linked revenue — but only counts as real ' +
      'value if it does not widen the access-equity gap. A forecast must ' +
      'keep the growth channel separate from the efficiency channel because ' +
      'they convert differently — efficiency savings are near-term and ' +
      'measurable, growth value is larger but slower and softer — and it ' +
      'must treat an equity regression as a cost, not a neutral side ' +
      'effect.',
    dominantHaircutFactors: [
      {
        factor: 'Capacity constraint behind the access point',
        rationale:
          'Access AI can only schedule into capacity that exists. If the ' +
          'real bottleneck is a clinician-supply shortage, faster scheduling ' +
          'redistributes the wait rather than removing it — the access-lag ' +
          'and time-to-care value is capped by the supply behind the door.',
        typicalHaircut: {
          low: 0.25,
          high: 0.55,
          basis:
            'The portion of a modelled access improvement that is not ' +
            'realisable because clinician capacity, not scheduling, is the ' +
            'true constraint; a planning range driven by the tenant\'s ' +
            'capacity position.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Patient adoption of digital and automated channels',
        rationale:
          'The efficiency and self-service value depends on patients ' +
          'actually using the digital front door and automated channels. ' +
          'Adoption varies sharply by age, digital access, and language, and ' +
          'a digital channel cannot be forced — the realisable shift off the ' +
          'phone is bounded by who will use it.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Forecast erosion from partial patient adoption of digital and ' +
            'automated channels; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Channel and data fragmentation',
        rationale:
          'When the phone, portal, front door, and outreach run as silos ' +
          'with no unified interaction record, the AI works from a partial ' +
          'view, journeys break at the seams, and the modelled conversion ' +
          'and resolution gains erode.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion attributable to cross-channel fragmentation ' +
            'and the absence of a unified interaction record; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Equity and access-fairness constraint',
        rationale:
          'A self-service or automation gain that concentrates in already-' +
          'advantaged patients while leaving others behind is not full ' +
          'value — and may be a net harm. The realisable, defensible value ' +
          'is the portion that does not depend on widening the equity gap.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The portion of an apparent access gain that is discounted ' +
            'because it is not equitably distributed; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'New-patient and referral conversion lift',
        range: {
          low: 5,
          high: 20,
          basis:
            'Percentage-point lift in new-patient and referral-to-' +
            'appointment conversion from reduced access friction; a planning ' +
            'range spanning early and mature programs.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in new-patient acquisition rate and ' +
          'referral-to-appointment conversion, with retained-patient value ' +
          'modelled on a stated lifetime-revenue basis.',
      },
      {
        lever: 'Contact-centre cost-to-serve reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Reduction in contact-centre cost-to-serve from automation, ' +
            'self-service deflection, and higher first-contact resolution; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in cost per resolved patient interaction, net ' +
          'of the automation run cost.',
      },
      {
        lever: 'No-show recovery',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in the no-show and late-cancellation rate ' +
            'from risk-targeted reminders, easier rescheduling, and barrier ' +
            'resolution; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the no-show rate, converted to ' +
          'recovered clinical-capacity value.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable efficiency signal (call ' +
      'abandonment, speed of answer, self-scheduling adoption) once the ' +
      'channel is live; 9–18 months for the growth and retention channel ' +
      '(new-patient conversion, leakage recovery, lifetime value) to read ' +
      'clearly; patient-experience scores are survey-lagged and take 12+ ' +
      'months to move convincingly.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'EHR / practice-management and scheduling system',
        role:
          'The system of record for appointments, provider availability, ' +
          'scheduling rules, and visit types — the engine the access ' +
          'function schedules into.',
        examples: ['Epic Cadence', 'Oracle Health (Cerner) Scheduling', 'athenaOne'],
      },
      {
        name: 'Digital front door / patient-engagement platform',
        role:
          'The patient-facing layer for finding care, self-scheduling, ' +
          'digital intake, and navigation.',
        examples: ['Epic MyChart', 'Notable', 'Luma Health', 'Phreesia', 'Gozio'],
      },
      {
        name: 'Contact-centre / telephony platform',
        role:
          'Runs inbound and outbound patient calls and the ACD routing, and ' +
          'is the source of contact-centre operating telemetry.',
        examples: [
          'Genesys Cloud',
          'Amazon Connect',
          'NICE CXone',
          'Cisco contact-centre platforms',
        ],
      },
      {
        name: 'Referral-management system',
        role:
          'Tracks placed referrals, their status, and their conversion to a ' +
          'completed appointment.',
        examples: [
          'EHR referral modules',
          'Epic referral workqueues',
          'standalone referral-management tools',
        ],
      },
      {
        name: 'Patient CRM / outreach platform',
        role:
          'Holds patient contact, preference, and consent data and runs ' +
          'proactive multi-channel outreach campaigns.',
        examples: [
          'Salesforce Health Cloud',
          'Epic outreach / Healthy Planet',
          'population-engagement tools',
        ],
      },
      {
        name: 'Patient-experience survey platform',
        role:
          'Captures CAHPS-style patient-reported access and service ' +
          'experience.',
        examples: ['Press Ganey', 'Qualtrics', 'NRC Health'],
      },
    ],
    roles: [
      {
        title: 'VP / Director of Patient Access',
        accountability:
          'Owns the end-to-end access operation — scheduling, the digital ' +
          'front door, and the access experience.',
      },
      {
        title: 'Contact-centre operations leader',
        accountability:
          'Owns contact-centre performance — staffing, service levels, and ' +
          'the quality of the patient interaction.',
      },
      {
        title: 'Chief Experience Officer / patient-experience leader',
        accountability:
          'Owns the patient-reported experience and the CAHPS-style ' +
          'performance the function is measured on.',
      },
      {
        title: 'Referral-management lead',
        accountability:
          'Owns referral conversion, the closed referral loop, and leakage ' +
          'recovery at the access point.',
      },
      {
        title: 'Chief Marketing / Growth Officer',
        accountability:
          'Owns new-patient acquisition and the growth value of the access ' +
          'function.',
      },
      {
        title: 'Health-equity officer',
        accountability:
          'Owns the access-equity outcome — ensuring access improvements ' +
          'narrow rather than widen subgroup gaps.',
      },
      {
        title: 'Clinical triage lead',
        accountability:
          'Owns the clinical governance of any triage logic embedded in ' +
          'scheduling or the digital front door.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA Privacy and Security Rules',
        relevance:
          'Govern PHI handling across every access channel — scheduling, ' +
          'the digital front door, contact-centre interactions, and ' +
          'outreach; identity matching and channel security must satisfy ' +
          'them.',
      },
      {
        name: 'TCPA (Telephone Consumer Protection Act) and patient-' +
          'communication consent rules',
        relevance:
          'Govern automated calls and texts to patients; proactive outreach ' +
          'and reminders must respect consent, opt-out, and contact-' +
          'frequency constraints.',
      },
      {
        name: 'ADA and Section 1557 language-access requirements',
        relevance:
          'Require accessible communication and meaningful language access; ' +
          'digital-only or English-only access channels can breach them and ' +
          'are an equity risk.',
      },
      {
        name: 'CMS CAHPS / patient-experience measurement programs',
        relevance:
          'Standardise patient-reported access and experience measurement; ' +
          'for relevant programs the access-experience score is tied to ' +
          'quality reporting and revenue.',
      },
      {
        name: '21st Century Cures Act information-blocking and patient-' +
          'access provisions',
        relevance:
          'Require timely patient access to their information through the ' +
          'portal and digital channels, raising the bar on the digital front ' +
          'door.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Third-next-available appointment',
        definition:
          'The standard access measure — days until the third open ' +
          'appointment slot — used because the first slot is distorted by ' +
          'cancellations.',
      },
      {
        term: 'Digital front door',
        definition:
          'The unified digital entry point through which a patient finds ' +
          'care, self-schedules, completes intake, and navigates the ' +
          'organisation.',
      },
      {
        term: 'Network leakage',
        definition:
          'Care for an in-network-capable need that is completed outside ' +
          "the organisation's own network, often caused by access friction.",
      },
      {
        term: 'First-contact resolution',
        definition:
          'Resolving a patient\'s reason for contact in a single ' +
          'interaction, with no transfer, callback, or repeat contact ' +
          'required.',
      },
      {
        term: 'Average speed of answer',
        definition:
          'The average time an inbound contact-centre caller waits before ' +
          'an agent answers.',
      },
      {
        term: 'No-show',
        definition:
          'A scheduled appointment the patient does not attend and does not ' +
          'cancel with enough notice to refill the slot.',
      },
      {
        term: 'Patient triage',
        definition:
          'The clinically governed sorting of a stated patient need by ' +
          'urgency and type, to route it to the appropriate care setting and ' +
          'timeframe.',
      },
      {
        term: 'CAHPS',
        definition:
          'The Consumer Assessment of Healthcare Providers and Systems — ' +
          'the standardised family of patient-experience surveys, including ' +
          'the access domain.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Patient-Access Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the patient-access operation is leaking volume, ' +
        'efficiency, and experience — and where it is failing on equity — ' +
        'with baseline evidence, before any solution is shaped.',
      sections: [
        {
          heading: 'Access operating context',
          guidance:
            'Describe the access landscape — the scheduling system, the ' +
            'digital front door, the contact centre, the referral and ' +
            'outreach operations, the specialty and site footprint. State ' +
            'which channel and survey data sources are available and how ' +
            'fresh they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric — third-' +
            'next-available lag, no-show rate, self-scheduling adoption, ' +
            'contact-centre abandonment / speed of answer / first-contact ' +
            'resolution, portal activation, referral conversion, leakage, ' +
            'time to care, patient-experience score, new-patient conversion. ' +
            'Decompose by patient subgroup to expose equity gaps. For any ' +
            'metric the tenant does not record, name it as a precise seed ' +
            'gap with its data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — access lag, contact-centre ' +
            'congestion, low digital adoption, no-show waste, referral ' +
            'leakage, fragmented journey, the access-equity gap, reactive-' +
            'only engagement — and state which are present, with the ' +
            'detection signal and evidence for each.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity from the value-model benchmark ranges, ' +
            'separating the growth-and-retention channel from the operating-' +
            'efficiency channel, haircut by capacity constraint, patient ' +
            'adoption, channel fragmentation, and the equity constraint. ' +
            'Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the data the diagnosis still needs, who owns each source, ' +
            'and what each gap blocks — including whether the true ' +
            'bottleneck is scheduling or clinician capacity, which changes ' +
            'the whole case.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to — ' +
            'often more than one, given the bet density of this function — ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Patient-Access Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a patient-access AI ' +
        'Move — baseline, dual-channel forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into the ' +
            'growth-and-retention and operating-efficiency channels, the ' +
            'time-to-value band, and the go / hold recommendation in one ' +
            'read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric. Where a baseline is a seed gap, say so and state what ' +
            'closing it requires before funding. State explicitly whether ' +
            'the access bottleneck is scheduling or clinician capacity.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'keeping the growth and efficiency channels separate, then apply ' +
            'each dominant haircut — capacity constraint, patient adoption, ' +
            'channel fragmentation, the equity constraint — explicitly with ' +
            'the math shown. Model retained-patient value on a stated ' +
            'lifetime-revenue basis, not a single-visit basis.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the scheduling, contact-' +
            'centre, referral, and outreach systems, the unified-interaction-' +
            'record work, and the operating-model change for access and ' +
            'contact-centre teams.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under low patient adoption, a ' +
            'capacity-bound bottleneck, channel fragmentation, and a thinner ' +
            'conversion lift. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Equity and compliance posture',
          guidance:
            'State how the Move protects against widening the access-equity ' +
            'gap, the staffed-channel guarantee, and the HIPAA, TCPA, and ' +
            'language-access compliance posture for automated channels.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            '— e.g. the bottleneck is clinician supply not access, or an ' +
            'equity regression cannot be prevented — and the evidence ' +
            'required before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State which operating metrics Tower will track to prove the ' +
            'forecast, the cadence, and the subgroup decomposition that ' +
            'keeps the equity outcome visible.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Patient-Access Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'patient-access AI capability, grounded in the function reference ' +
        'patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — the unified digital front door, the intelligent ' +
            'scheduling and triage layer, the omnichannel contact layer, ' +
            'closed-loop referral management, the unified patient-' +
            'interaction record, and equity-aware access monitoring — and ' +
            'state which apply and how they connect.',
        },
        {
          heading: 'Channel and system integration',
          guidance:
            'Specify the integration to the scheduling, contact-centre, ' +
            'referral, portal, and outreach systems, the patient-identity ' +
            'matching, and how the unified interaction record is assembled ' +
            'and kept current.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Clinical-triage logic ships only under named ' +
            'clinical governance; a human escalation path is always present.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how access, scheduling, contact-centre, and referral ' +
            'workflows change — agents moving to higher-complexity work, ' +
            'self-service governance, the staffed-channel guarantee — and ' +
            'who owns each change.',
        },
        {
          heading: 'Equity, safety, and responsible-AI controls',
          guidance:
            'State the equity-monitoring, clinical-triage-safety, identity-' +
            'matching, consent, and language-access controls, and the ' +
            'regulatory frames (HIPAA, TCPA, Section 1557, CAHPS, Cures Act) ' +
            'that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and the ' +
            'phased rollout — typically channel by channel or specialty by ' +
            'specialty.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Patient-Access Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the patient-access AI capability ' +
        'so patients and staff actually adopt it and value is realised, not ' +
        'just deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — channel and system integration and ' +
            'validation, a pilot channel or specialty, staff onboarding, ' +
            'scale — with milestones tied to the access operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — channel ' +
            'integration, the unified interaction record, clinical-triage ' +
            'governance, contact-centre adoption, equity monitoring, Tower ' +
            'measurement.',
        },
        {
          heading: 'Patient and staff adoption approach',
          guidance:
            'Define the change runway both for patients — driving digital-' +
            'front-door and self-scheduling adoption, keeping the staffed ' +
            'channel equal — and for contact-centre and access staff moving ' +
            'to higher-complexity work. State how adoption is measured, not ' +
            'assumed.',
        },
        {
          heading: 'Equity and access-fairness checkpoint',
          guidance:
            'Define the explicit checkpoint that confirms the launch is ' +
            'narrowing, not widening, the access-equity gap, with the ' +
            'subgroup metrics watched and the trigger to pause if it ' +
            'regresses.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, the cadence, and the ' +
            'subgroup decomposition.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — low patient adoption, a capacity-bound ' +
            'bottleneck, channel fragmentation, an equity regression, ' +
            'clinical-triage safety — with the escalation owner and trigger ' +
            'for each.',
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
      claim: 'The appointment-access lag for the population',
      authoritativeSource:
        'The EHR / practice-management scheduling system, calculated as ' +
        'third-next-available by department and provider.',
      whatGoodEvidenceLooksLike:
        'Third-next-available lag computed from the live schedule across a ' +
        'stated period, broken down by specialty and provider, with the ' +
        'visit-type definitions stated.',
      weakEvidenceToReject:
        'A first-available figure (distorted by cancellations), a single ' +
        'anecdotal wait time, or an organisation-wide average that hides the ' +
        'specialty variation.',
    },
    {
      claim: 'Contact-centre performance — abandonment, wait, and resolution',
      authoritativeSource:
        'The contact-centre telephony / ACD platform and its interaction-' +
        'disposition data.',
      whatGoodEvidenceLooksLike:
        'Call abandonment, average speed of answer, and first-contact ' +
        'resolution drawn directly from the telephony platform over a ' +
        'representative period, with peak and off-peak shown.',
      weakEvidenceToReject:
        'A staffing-model assumption presented as measured performance, or ' +
        'a first-contact-resolution figure with no repeat-contact tracking ' +
        'behind it.',
    },
    {
      claim: 'Whether the access bottleneck is scheduling or clinician ' +
        'capacity',
      authoritativeSource:
        'Provider availability and slot-supply data set against demand ' +
        'volume in the scheduling system.',
      whatGoodEvidenceLooksLike:
        'A demand-versus-capacity analysis showing whether open, bookable ' +
        'slots exist that scheduling is failing to fill, or whether the slot ' +
        'supply itself is exhausted.',
      weakEvidenceToReject:
        'An assumption that long access lag is purely a scheduling problem ' +
        'with no demand-versus-capacity evidence.',
    },
    {
      claim: 'That an access improvement is equitable across patient ' +
        'subgroups',
      authoritativeSource:
        'Access operating metrics decomposed by demographic, language, and ' +
        'payer subgroup against a stated baseline.',
      whatGoodEvidenceLooksLike:
        'Each access metric reported by subgroup before and after the ' +
        'change, showing the equity gap narrowed or held, not widened.',
      weakEvidenceToReject:
        'An aggregate access improvement reported with no subgroup ' +
        'decomposition, which can hide a worsening equity gap.',
    },
    {
      claim: 'The forecast value of a patient-access AI Move',
      authoritativeSource:
        'The value model — the growth-and-retention and operating-' +
        'efficiency channels modelled separately and haircut by their ' +
        'dominant factors.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with the two value ' +
        'channels kept separate, each haircut applied explicitly, retained-' +
        'patient value on a stated lifetime basis, and every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single blended value number, a vendor ROI claim taken at face ' +
        'value, or a growth forecast that ignores the capacity constraint ' +
        'behind the access point.',
    },
  ],
};
