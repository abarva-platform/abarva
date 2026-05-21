// Domain Function Pack — Healthcare provider · Research & clinical trials.
//
// Function key: `research_clinical_trials`.
//
// This pack covers the clinical-research operation of a provider or academic
// medical centre: how a site (or a sponsor-facing research enterprise) takes a
// protocol, opens the study, finds and consents the right patients, runs the
// visits, keeps the data clean, and brings the database to lock. It is a
// distinct function from care delivery — its economics are study budgets,
// per-patient grants, and the cost of a day of delay, not total cost of care.
//
// The operating reality the pack encodes: most trials miss their enrolment
// timeline, recruitment is the dominant failure mode, and the gap between an
// eligible patient sitting in the EHR and that patient being screened is where
// most studies bleed. The AI archetypes are the recurring bets against exactly
// that reality — feasibility, EHR-driven patient matching, eligibility
// pre-screening, protocol-design assistance, safety-signal detection, and
// study-document generation.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const researchClinicalTrialsPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'research_clinical_trials',
  functionLabel: 'Research & clinical trials',
  summary:
    'Clinical research operations is the function that turns a sponsor or ' +
    'investigator protocol into completed, regulator-grade evidence: study ' +
    'feasibility and site selection, regulatory and IRB start-up, patient ' +
    'identification and informed consent, the conduct of study visits, source ' +
    'documentation and data capture, monitoring and query resolution, safety ' +
    'reporting, and database lock. Its economics are study budgets, per-' +
    'patient grant revenue, and the cost of delay — every day a trial runs ' +
    'past plan burns fixed coordinator and site cost. The function lives or ' +
    'dies on recruitment: a protocol can be scientifically excellent and a ' +
    'site operationally sound, and the study still fails because the right ' +
    'patients were never found, screened, and enrolled on time.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'time_to_first_patient_in',
      name: 'Time to first-patient-in',
      definition:
        'The elapsed time from study activation (site green-light to enrol) ' +
        'to the first participant signing informed consent and being ' +
        'randomised or enrolled — the start-up-to-recruitment lag for a study.',
      unit: 'days from activation to first enrolment',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 30,
        high: 120,
        basis:
          'The activation-to-first-patient lag varies widely by therapeutic ' +
          'area, protocol complexity, and how warm the site’s eligible ' +
          'population is. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS study-milestone tracking against the IRB approval and site-' +
        'activation dates.',
      whyItMatters:
        'A long first-patient-in lag means the site is carrying activated, ' +
        'paid-for capacity with no enrolling — it is the earliest signal that ' +
        'a study will miss its enrolment timeline.',
    },
    {
      key: 'enrollment_rate_vs_plan',
      name: 'Enrolment rate vs. plan',
      definition:
        'Actual cumulative participants enrolled as a share of the enrolment ' +
        'the study plan expected by the same point in the recruitment period.',
      unit: '% of planned enrolment achieved to date',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 100,
        basis:
          'A large share of trials enrol behind plan; the band reflects the ' +
          'gap between an optimistic feasibility projection and realised ' +
          'recruitment. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS enrolment log compared against the protocol enrolment plan and ' +
        'the feasibility commitment.',
      whyItMatters:
        'It is the headline health metric of a study; sustained under-' +
        'enrolment forces timeline extensions, added sites, or termination.',
    },
    {
      key: 'screen_fail_rate',
      name: 'Screen-fail rate',
      definition:
        'The share of participants who consent and enter screening but do ' +
        'not pass eligibility and are not enrolled or randomised.',
      unit: '% of screened participants',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 45,
        basis:
          'Screen-fail rates depend heavily on protocol restrictiveness and ' +
          'how well eligibility is pre-checked; oncology and rare-disease ' +
          'protocols sit high. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS screening log; screening labs and procedures recorded in the ' +
        'EDC and the EHR.',
      whyItMatters:
        'Every screen-fail consumes a screening visit, labs, and coordinator ' +
        'effort with no enrolment in return — a high rate is wasted study ' +
        'budget and a sign eligibility is being checked too late.',
    },
    {
      key: 'protocol_deviation_rate',
      name: 'Protocol-deviation rate',
      definition:
        'The number of recorded protocol deviations per enrolled participant ' +
        '(or per visit), spanning eligibility, visit-window, procedure, and ' +
        'informed-consent deviations.',
      unit: 'deviations per enrolled participant',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.2,
        high: 1.5,
        basis:
          'Deviation rates rise with protocol complexity and visit burden; ' +
          'the band spans a clean simple study to a complex, deviation-prone ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS and EDC deviation logs reconciled against the monitoring ' +
        'visit reports.',
      whyItMatters:
        'Deviations threaten data integrity and participant safety, draw ' +
        'regulatory and sponsor scrutiny, and a deviation-prone site risks ' +
        'losing future study allocation.',
    },
    {
      key: 'data_query_resolution_time',
      name: 'Data-query resolution time',
      definition:
        'The median elapsed time from a data query being raised on a case-' +
        'report-form field to that query being answered and closed by the ' +
        'site.',
      unit: 'days to query closure (median)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'Query turnaround depends on site staffing, source-document ' +
          'access, and EDC usability; the band spans a responsive site to a ' +
          'query-backlogged one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EDC query-management log time-stamped from query open to close.',
      whyItMatters:
        'Open queries are the long pole of database lock; a slow query loop ' +
        'pushes the lock date and delays the analysis the trial exists to ' +
        'produce.',
    },
    {
      key: 'site_activation_cycle_time',
      name: 'Site-activation cycle time',
      definition:
        'The elapsed time from site selection to study activation — the ' +
        'span covering regulatory and IRB submission, contract and budget ' +
        'execution, and site initiation.',
      unit: 'days from selection to activation',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 60,
        high: 180,
        basis:
          'Start-up cycle time is dominated by contract and budget ' +
          'negotiation and IRB turnaround; the band spans a streamlined ' +
          'central-IRB study to a slow multi-party one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS start-up milestone tracking — selection, regulatory, contract, ' +
        'and initiation dates.',
      whyItMatters:
        'Start-up is pure delay before any patient can be enrolled; a long ' +
        'activation cycle compresses the recruitment window and is a leading ' +
        'cause of missed enrolment.',
    },
    {
      key: 'database_lock_cycle_time',
      name: 'Database-lock cycle time',
      definition:
        'The elapsed time from last-patient-last-visit to a clean, locked ' +
        'study database ready for statistical analysis.',
      unit: 'days from last-patient-last-visit to lock',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 90,
        basis:
          'Lock cycle time depends on the standing query backlog, source-' +
          'data-verification completeness, and reconciliation load. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EDC and data-management milestone tracking from last-visit to lock.',
      whyItMatters:
        'The lock date gates the analysis, the regulatory submission, and ' +
        'for industry studies the final-payment milestone; a slow lock delays ' +
        'every downstream outcome of the trial.',
    },
    {
      key: 'in_trial_retention_rate',
      name: 'In-trial participant retention rate',
      definition:
        'The share of enrolled or randomised participants who complete the ' +
        'study through the protocol-defined end without early withdrawal or ' +
        'loss to follow-up.',
      unit: '% of enrolled participants retained to completion',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 92,
        basis:
          'Retention falls with study duration, visit burden, and placebo ' +
          'arms; long chronic-disease trials sit at the low end. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS and EDC participant-status tracking — completion, withdrawal, ' +
        'and lost-to-follow-up disposition.',
      whyItMatters:
        'Dropout erodes statistical power and can bias the result; a study ' +
        'that enrols well but retains poorly may still fail to answer its ' +
        'question.',
    },
    {
      key: 'study_budget_variance',
      name: 'Study budget variance',
      definition:
        'Actual study cost or invoiced effort against the executed study ' +
        'budget for the work delivered to date, for the site or research ' +
        'enterprise.',
      unit: '% variance to budget (overrun positive)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: -5,
        high: 15,
        basis:
          'Trials commonly run over budget through unbudgeted screen-fails, ' +
          'amendments, and extended timelines; the band spans an on-budget ' +
          'study to a moderate overrun. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Research-finance / clinical-trial-budgeting system reconciled ' +
        'against the executed budget and the CTMS effort log.',
      whyItMatters:
        'Per-patient grants and milestone payments are fixed; uncontrolled ' +
        'screen-fails, deviations, and delay turn a study from a contribution ' +
        'to a loss for the research enterprise.',
    },
    {
      key: 'monitoring_visit_burden',
      name: 'Site-monitoring burden',
      definition:
        'The coordinator and site effort consumed by monitoring visits and ' +
        'source-data verification per enrolled participant — visit ' +
        'preparation, on-site verification, and follow-up actions.',
      unit: 'monitoring hours per enrolled participant',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Monitoring burden depends on the monitoring model — full on-site ' +
          'source-data verification versus risk-based monitoring — and on ' +
          'data quality. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS monitoring-visit log and coordinator effort tracking.',
      whyItMatters:
        'Monitoring is a large, often-hidden share of trial conduct cost; a ' +
        'high burden per participant signals data-quality problems upstream ' +
        'and crowds out coordinator time for recruitment.',
    },
    {
      key: 'consent_to_screen_conversion',
      name: 'Identification-to-consent conversion rate',
      definition:
        'The share of potentially eligible patients identified for a study ' +
        'who go on to be approached and sign informed consent.',
      unit: '% of identified candidates consented',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Conversion from an identified candidate list to a signed consent ' +
          'is low and varies with referral workflow, patient interest, and ' +
          'how the list reaches the care team. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS recruitment funnel — identified, contacted, and consented ' +
        'counts — joined to the EHR-derived candidate list.',
      whyItMatters:
        'It isolates the recruitment funnel step where most studies leak: a ' +
        'large identified pool with no path to the patient produces no ' +
        'enrolment, and identification work without conversion is wasted.',
    },
    {
      key: 'protocol_amendment_count',
      name: 'Protocol-amendment count',
      definition:
        'The number of substantial amendments made to a protocol after ' +
        'finalisation, each of which triggers re-approval, re-consent, and ' +
        'site re-work.',
      unit: 'substantial amendments per protocol',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 4,
        basis:
          'Most protocols are amended at least once; eligibility-driven and ' +
          'feasibility-driven amendments are the most common and the most ' +
          'costly. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CTMS / regulatory-binder amendment history.',
      whyItMatters:
        'Each amendment is expensive delay — re-approval, re-consent of ' +
        'enrolled participants, and re-training; a high amendment count ' +
        'usually signals weak protocol design or feasibility upstream.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'optimistic_feasibility',
      name: 'Optimistic feasibility projection',
      description:
        'Site feasibility commits to an enrolment number drawn from gut ' +
        'sense or an outdated patient count rather than a real query of the ' +
        'eligible population. The study is built on an enrolment plan the ' +
        'site was never able to hit.',
      detectionSignal:
        'Feasibility-committed enrolment is far above the count of patients ' +
        'who actually meet the key eligibility criteria in the EHR; ' +
        'enrolment rate vs. plan falls behind from the first month.',
      diagnosticQuestion:
        'Is study feasibility based on a real, criteria-level query of the ' +
        'eligible population, or on an unverified estimate?',
    },
    {
      key: 'recruitment_funnel_leak',
      name: 'Recruitment-funnel leak',
      description:
        'Potentially eligible patients exist in the record but never become ' +
        'enrolled participants — the candidate list never reaches the ' +
        'treating clinician, the patient is seen and the trial is never ' +
        'mentioned, or referral has no workflow. The funnel leaks between ' +
        'identification and consent.',
      detectionSignal:
        'A large identified-candidate pool sits against a low identification-' +
        'to-consent conversion rate; eligible patients have encounters with ' +
        'no documented trial referral.',
      diagnosticQuestion:
        'Once a patient is identified as potentially eligible, what workflow ' +
        'actually carries that to the clinician and to a consent conversation?',
    },
    {
      key: 'late_eligibility_screening',
      name: 'Late eligibility screening',
      description:
        'Eligibility is fully checked only after the patient consents and ' +
        'enters formal screening, so ineligibility is discovered after a ' +
        'screening visit and labs have already been spent.',
      detectionSignal:
        'The screen-fail rate is high and dominated by criteria that could ' +
        'have been checked from existing record data before consent.',
      diagnosticQuestion:
        'Which eligibility criteria are checkable from the existing record, ' +
        'and are they pre-screened before a screening visit is scheduled?',
    },
    {
      key: 'startup_drag',
      name: 'Study start-up drag',
      description:
        'Regulatory submission, contract and budget negotiation, and IRB ' +
        'turnaround consume months before the site can enrol. The ' +
        'recruitment window is compressed before it opens.',
      detectionSignal:
        'Site-activation cycle time runs long; the contract-and-budget and ' +
        'IRB milestones are the dominant components of the delay.',
      diagnosticQuestion:
        'Where is the time going in study start-up — regulatory, contract ' +
        'and budget, or IRB — and which step is the bottleneck?',
    },
    {
      key: 'coordinator_documentation_load',
      name: 'Coordinator documentation and double-entry load',
      description:
        'Study coordinators re-enter data from the EHR into the EDC, ' +
        'reconcile source documents by hand, and chase queries — time taken ' +
        'directly from recruitment and participant contact.',
      detectionSignal:
        'Time-and-motion or CTMS telemetry shows coordinators spending a ' +
        'large share of their day on transcription and reconciliation rather ' +
        'than recruitment or visit conduct.',
      diagnosticQuestion:
        'How much of a coordinator’s day is EHR-to-EDC transcription and ' +
        'source reconciliation, and how much is recruitment and visits?',
    },
    {
      key: 'query_backlog',
      name: 'Data-query backlog',
      description:
        'Open data queries accumulate faster than the site clears them. The ' +
        'backlog becomes the long pole of database lock and pushes the ' +
        'analysis date.',
      detectionSignal:
        'The open-query count grows over time; data-query resolution time ' +
        'lengthens and a tail of aged queries never closes.',
      diagnosticQuestion:
        'What is the standing open-query count and its age profile, and is ' +
        'the site clearing queries faster than they are raised?',
    },
    {
      key: 'protocol_complexity_creep',
      name: 'Protocol-complexity creep',
      description:
        'Protocols accumulate procedures, visits, and narrow eligibility ' +
        'criteria that raise burden and screen-fails without proportional ' +
        'scientific value, and then need amendment when the design proves ' +
        'unworkable in the clinic.',
      detectionSignal:
        'High visit burden and a restrictive eligibility set sit alongside a ' +
        'high screen-fail rate and one or more feasibility-driven amendments.',
      diagnosticQuestion:
        'Were the protocol’s eligibility criteria and visit schedule ' +
        'pressure-tested against real-world feasibility before finalisation?',
    },
    {
      key: 'safety_signal_latency',
      name: 'Safety-signal and adverse-event latency',
      description:
        'Adverse events and emerging safety signals are recognised, coded, ' +
        'and reported late because they surface across unstructured notes, ' +
        'labs, and visit records that no one reconciles in time.',
      detectionSignal:
        'Adverse events are entered into the EDC well after the clinical ' +
        'event; expedited safety reports cluster near their regulatory ' +
        'deadline rather than near event recognition.',
      diagnosticQuestion:
        'How quickly are adverse events recognised and reported after they ' +
        'occur, and what reconciles clinical data into safety detection?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'trial_feasibility_site_selection',
      name: 'Trial feasibility and site-selection intelligence',
      valueMechanism:
        'A model queries the eligible population against the protocol’s key ' +
        'criteria and produces an evidence-based feasibility estimate and a ' +
        'site or service-line ranking, so studies are accepted with an ' +
        'enrolment plan grounded in real patient counts. Value comes from ' +
        'declining studies a site cannot deliver and right-sizing the ' +
        'enrolment commitment for the ones it accepts — preventing the ' +
        'optimistic-feasibility failure before the study is even opened.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR diagnosis, problem-list, lab, and medication data for the ' +
          'potential population',
        'Historical enrolment performance by therapeutic area and ' +
          'investigator',
        'The protocol’s key inclusion and exclusion criteria',
        'Site capacity and competing-study data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model produces a feasibility estimate; the research operations ' +
          'leader and principal investigator own the accept / decline ' +
          'decision and the committed enrolment number.',
        'The eligible-population count is a planning estimate, not a ' +
          'guaranteed enrolment — conversion through the funnel still applies.',
        'Criteria interpretation must be transparent so an over- or under-' +
          'inclusive query can be corrected.',
      ],
      metricsMoved: [
        'enrollment_rate_vs_plan',
        'time_to_first_patient_in',
        'protocol_amendment_count',
        'study_budget_variance',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'ehr_patient_matching',
      name: 'EHR-driven patient matching and recruitment',
      valueMechanism:
        'A model continuously matches patients in the EHR against open ' +
        'protocols and surfaces a ranked candidate list — ideally inside the ' +
        'clinician’s workflow at the point of an encounter — so eligible ' +
        'patients are identified and routed to a consent conversation before ' +
        'they leave the clinic. Value comes from closing the recruitment-' +
        'funnel leak: turning a passive eligible population into an active, ' +
        'time-aligned referral stream.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Real-time EHR clinical data — diagnoses, problems, labs, ' +
          'medications, encounters',
        'Structured and de-restricted protocol eligibility criteria',
        'The clinic schedule, to align matches to upcoming encounters',
        'Trial-referral and CTMS recruitment-status data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'A match is a candidate, not an enrolment; the treating clinician ' +
          'decides whether to discuss the trial and the patient consents ' +
          'freely.',
        'Surfacing matches must not pressure the clinical encounter or imply ' +
          'the patient should enrol — equipoise and voluntary consent are ' +
          'absolute.',
        'PHI access for cross-protocol matching must sit within an IRB-' +
          'approved recruitment pathway and the institution’s privacy rules.',
      ],
      metricsMoved: [
        'consent_to_screen_conversion',
        'enrollment_rate_vs_plan',
        'time_to_first_patient_in',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'eligibility_prescreening',
      name: 'Automated eligibility pre-screening',
      valueMechanism:
        'Before a screening visit is scheduled, a model checks each ' +
        'candidate against the record-checkable inclusion and exclusion ' +
        'criteria and flags likely screen-fails and the missing data ' +
        'standing between candidate and confirmed eligibility. Value comes ' +
        'from moving ineligibility discovery to before the screening visit — ' +
        'cutting wasted screening labs, visits, and coordinator effort, and ' +
        'lowering the screen-fail rate.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR clinical data covering the record-checkable criteria',
        'A structured representation of each protocol’s inclusion and ' +
          'exclusion criteria',
        'Prior screening-log outcomes to calibrate the model',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'Pre-screening flags candidates for review; a coordinator or ' +
          'investigator confirms eligibility and no one is excluded on the ' +
          'model’s inference alone.',
        'A false-exclude is a lost participant — the model must be tuned to ' +
          'surface uncertainty rather than silently drop borderline ' +
          'candidates.',
        'Criteria not checkable from the record must be clearly marked as ' +
          'still requiring a screening assessment.',
      ],
      metricsMoved: [
        'screen_fail_rate',
        'study_budget_variance',
        'enrollment_rate_vs_plan',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'protocol_design_assistance',
      name: 'Protocol-design and feasibility-review assistance',
      valueMechanism:
        'A model reviews a draft protocol against the real-world ' +
        'feasibility of its eligibility criteria and visit schedule — ' +
        'estimating how the criteria shrink the eligible pool and how the ' +
        'visit burden will affect retention — and flags design choices ' +
        'likely to cause screen-fails, low enrolment, or an amendment. Value ' +
        'comes from catching unworkable design before the protocol is ' +
        'finalised, avoiding the cost of a feasibility-driven amendment.',
      adoptionProfile: 'early',
      dataDependencies: [
        'The draft protocol — eligibility criteria, visit schedule, ' +
          'endpoints',
        'Eligible-population counts at the criteria level',
        'Historical screen-fail, retention, and amendment data for similar ' +
          'protocols',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model advises; the sponsor, principal investigator, and ' +
          'scientific team own every protocol-design decision.',
        'Scientific necessity can justify a restrictive criterion the model ' +
          'flags as feasibility-costly — the trade-off is a human judgement.',
        'Feasibility estimates are planning ranges and must not be presented ' +
          'as a guaranteed enrolment outcome.',
      ],
      metricsMoved: [
        'protocol_amendment_count',
        'screen_fail_rate',
        'in_trial_retention_rate',
        'enrollment_rate_vs_plan',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'safety_signal_detection',
      name: 'Adverse-event and safety-signal detection',
      valueMechanism:
        'A model reconciles structured and unstructured clinical data — ' +
        'visit notes, labs, vitals, medications — to surface candidate ' +
        'adverse events and emerging safety signals for the study team to ' +
        'review and code, so events are recognised close to when they ' +
        'happen rather than at the next monitoring visit. Value comes from ' +
        'faster, more complete safety detection — protecting participants ' +
        'and meeting expedited-reporting timelines.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR and EDC clinical data — notes, labs, vitals, medications',
        'The protocol’s adverse-event definitions and reporting rules',
        'Concomitant-medication and medical-history data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces candidate events; a qualified investigator or ' +
          'safety reviewer confirms, assesses causality, and codes every ' +
          'event and decides on reporting.',
        'Detection must err toward surfacing for review — a missed event is ' +
          'a participant-safety failure, not just a data gap.',
        'The pathway must integrate with pharmacovigilance and expedited-' +
          'reporting obligations, never substitute for them.',
      ],
      metricsMoved: [
        'protocol_deviation_rate',
        'monitoring_visit_burden',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'study_document_generation',
      name: 'Study-document drafting and source-to-EDC assistance',
      valueMechanism:
        'A copilot drafts and assembles study documentation — visit-' +
        'summary source notes, EDC case-report-form pre-population from the ' +
        'EHR, query responses, and monitoring-visit follow-up — for ' +
        'coordinator review and attestation. Value comes from cutting the ' +
        'transcription and reconciliation load, returning coordinator time ' +
        'to recruitment and visit conduct and shrinking the query loop.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR source data for the participant’s study visits',
        'EDC case-report-form structure and field definitions',
        'Open data queries and monitoring-visit findings',
        'The protocol’s visit schedule and assessment requirements',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Every drafted source note and EDC entry is reviewed and attested ' +
          'by the coordinator or investigator before it is committed — the ' +
          'site remains accountable for the data.',
        'Drafts must cite the source record so the coordinator can verify ' +
          'against the source document — no unsourced synthesis enters the ' +
          'EDC.',
        'The audit trail and source-data-verification expectations of the ' +
          'EDC must be preserved; an AI draft does not bypass them.',
      ],
      metricsMoved: [
        'data_query_resolution_time',
        'database_lock_cycle_time',
        'monitoring_visit_burden',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'eligible_population_query_layer',
      name: 'Eligible-population query layer',
      description:
        'A governed data layer that translates protocol eligibility criteria ' +
        'into structured, repeatable queries over the EHR and claims data, ' +
        'producing criteria-level eligible-population counts. Feasibility, ' +
        'patient matching, and pre-screening all consume this layer rather ' +
        'than querying source systems ad hoc.',
      boundary:
        'It counts and identifies the eligible population; it does not ' +
        'contact patients, make eligibility determinations, or enrol anyone. ' +
        'It is a read model behind an IRB-approved recruitment pathway.',
      humanAccountabilityPoint:
        'The research informatics or data-governance owner accountable for ' +
        'the recruitment data layer and its IRB-approved use.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'document_intelligence',
    },
    {
      key: 'point_of_care_trial_match',
      name: 'Point-of-care trial-match surfacing',
      description:
        'A pattern that surfaces a ranked trial-match for a patient inside ' +
        'the clinician’s encounter workflow, so a potential participant is ' +
        'recognised while the patient is in front of the care team. The ' +
        'match carries the matching evidence and routes to a defined ' +
        'referral path.',
      boundary:
        'It surfaces a candidate match and the supporting evidence; the ' +
        'clinician decides whether to raise the trial and the patient ' +
        'consents freely. It does not enrol and does not pressure the ' +
        'encounter.',
      humanAccountabilityPoint:
        'The treating clinician who decides whether to discuss the trial, ' +
        'with the principal investigator accountable for the recruitment ' +
        'pathway.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'prescreen_before_visit',
      name: 'Pre-screen-before-visit recruitment pattern',
      description:
        'A pattern that runs record-checkable eligibility criteria against a ' +
        'candidate before a screening visit is scheduled, so likely screen-' +
        'fails are caught and the missing-data list is resolved before site ' +
        'resources are spent. The screening visit is reserved for criteria ' +
        'that genuinely require an in-person assessment.',
      boundary:
        'It flags likely ineligibility for human review; a coordinator or ' +
        'investigator confirms eligibility. It never excludes a candidate on ' +
        'inference alone.',
      humanAccountabilityPoint:
        'The study coordinator or sub-investigator who confirms eligibility ' +
        'and authorises the screening visit.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'source_to_edc_assist',
      name: 'Source-to-EDC assisted data flow',
      description:
        'A pattern that pre-populates EDC case-report-form fields from the ' +
        'EHR source record and drafts visit-summary source documentation, ' +
        'with the coordinator reviewing, correcting, and attesting every ' +
        'value. It shrinks double-entry and the query loop while keeping the ' +
        'site accountable for the data.',
      boundary:
        'It drafts and pre-populates; the coordinator or investigator ' +
        'verifies against the source and attests. It does not commit data to ' +
        'the EDC autonomously and does not replace source-data verification.',
      humanAccountabilityPoint:
        'The study coordinator and the investigator accountable for the ' +
        'integrity of the study data.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'continuous_safety_reconciliation',
      name: 'Continuous safety-data reconciliation',
      description:
        'A pattern that continuously reconciles clinical data across the EHR ' +
        'and EDC to surface candidate adverse events for investigator ' +
        'review, so safety detection runs between monitoring visits rather ' +
        'than only at them. It feeds the study’s safety and ' +
        'pharmacovigilance workflow.',
      boundary:
        'It surfaces candidate events for review; the investigator confirms, ' +
        'assesses causality, and decides on coding and reporting. It does not ' +
        'report events itself.',
      humanAccountabilityPoint:
        'The principal investigator and the study safety reviewer ' +
        'accountable for adverse-event assessment and reporting.',
      controlPosture: 'human-in-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Clinical-research value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, time: a study that enrols ' +
      'and locks faster shortens the path to evidence and to the milestone ' +
      'and final payments — every day saved on start-up, recruitment, or ' +
      'database lock has a quantifiable carrying-cost value. Second, ' +
      'efficiency: fewer screen-fails, less double-entry, and a shorter ' +
      'query loop lower the cost per enrolled participant and free ' +
      'coordinator capacity to run more studies. Third, portfolio capacity: ' +
      'a site that delivers on enrolment commitments wins future study ' +
      'allocation and per-patient grant revenue. The dominant driver is ' +
      'recruitment — feasibility, matching, and pre-screening — because an ' +
      'under-enrolling study erodes all three forms of value at once. The ' +
      'forecast must be read against the funding model: an industry-' +
      'sponsored per-patient-grant study and an investigator-initiated ' +
      'grant-funded study realise value differently.',
    dominantHaircutFactors: [
      {
        factor: 'Recruitment-funnel conversion',
        rationale:
          'An eligible-population count is not enrolment. The conversion ' +
          'from identified candidate, to clinician referral, to consent, to ' +
          'a passed screen is the largest source of forecast shortfall — a ' +
          'plan modelled on the eligible pool but delivered through a leaky ' +
          'funnel overstates value badly.',
        typicalHaircut: {
          low: 0.3,
          high: 0.6,
          basis:
            'The gap between an identified eligible pool and enrolled, ' +
            'screened-in participants; a planning range, calibrate to the ' +
            'site’s historic funnel.',
          label: 'planning-range',
        },
      },
      {
        factor: 'EHR data readiness and criteria structurability',
        rationale:
          'Feasibility, matching, and pre-screening only work to the extent ' +
          'eligibility criteria are checkable from structured record data. ' +
          'Criteria that live only in unstructured notes, or sparse and ' +
          'inconsistent EHR data, cap how much of the modelled value can be ' +
          'delivered.',
        typicalHaircut: {
          low: 0.2,
          high: 0.4,
          basis:
            'Forecast erosion from criteria that cannot be reliably checked ' +
            'against the record; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Protocol and sponsor constraint',
        rationale:
          'A restrictive protocol, a fixed sponsor monitoring model, and a ' +
          'sponsor-mandated EDC all cap how much of an efficiency gain a ' +
          'site can capture. The site does not control the protocol, so ' +
          'part of the modelled value is outside its reach.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Value erosion from protocol restrictiveness and sponsor-fixed ' +
            'process; a planning range driven by the specific study.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Coordinator adoption and capacity',
        rationale:
          'The efficiency archetypes return coordinator time only if ' +
          'coordinators adopt the tool into the study workflow. A thinly ' +
          'staffed site, or one that runs the tool alongside rather than ' +
          'inside its process, realises a fraction of the modelled time ' +
          'saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial coordinator adoption and ' +
            'staffing capacity; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Time-to-first-patient-in compression',
        range: {
          low: 15,
          high: 50,
          basis:
            'Relative reduction in the activation-to-first-patient lag from ' +
            'feasibility and matching; a planning range spanning early and ' +
            'mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in days from study activation to ' +
          'first-patient-in.',
      },
      {
        lever: 'Screen-fail-rate reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in screen-fails from moving record-checkable ' +
            'eligibility to before the screening visit; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the screen-fail rate for studies ' +
          'using pre-screening.',
      },
      {
        lever: 'Coordinator effort returned to recruitment and conduct',
        range: {
          low: 8,
          high: 25,
          basis:
            'Share of coordinator time recovered from transcription, ' +
            'reconciliation, and query handling by source-to-EDC assistance; ' +
            'a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percent of coordinator working time redirected from ' +
          'documentation to recruitment and visit conduct.',
      },
      {
        lever: 'Database-lock cycle-time compression',
        range: {
          low: 10,
          high: 40,
          basis:
            'Relative reduction in the last-visit-to-lock interval from a ' +
            'shorter query loop and cleaner data capture; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in days from last-patient-last-visit ' +
          'to database lock.',
      },
    ],
    timeToValueBand:
      '3–9 months to first measurable operational signal (faster start-up, ' +
      'lower screen-fail rate on newly opened studies); 12–24 months to a ' +
      'portfolio-level result, because enrolment and lock improvements only ' +
      'compound as a full cohort of studies cycles through the new process.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Clinical trial management system (CTMS)',
        role:
          'The operational system of record for the research portfolio — ' +
          'studies, sites, enrolment, milestones, monitoring visits, and ' +
          'study budgets.',
        examples: ['Veeva Vault CTMS', 'Oracle Clinical One', 'Advarra CTMS'],
      },
      {
        name: 'Electronic data capture (EDC)',
        role:
          'The system of record for study data — the electronic case-report ' +
          'forms, the data queries, and the locked study database.',
        examples: ['Medidata Rave', 'Veeva Vault EDC', 'Oracle Clinical One Data Collection'],
      },
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record; the source of the eligible ' +
          'population, the source documents for study visits, and the ' +
          'clinical data behind safety detection.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'Epic Research / SlicerDicer'],
      },
      {
        name: 'eRegulatory / electronic trial master file (eTMF)',
        role:
          'Holds the regulatory binder and the trial master file — IRB ' +
          'approvals, protocols, amendments, delegation logs, and the audit-' +
          'ready document record.',
        examples: ['Florence eBinders', 'Veeva Vault eTMF', 'Complion'],
      },
      {
        name: 'Research finance / clinical-trial budgeting system',
        role:
          'Manages study budgets, coverage analysis, per-patient grant ' +
          'invoicing, and milestone payments for the research enterprise.',
        examples: [
          'OnCore financials',
          'Forte / Advarra study financials',
          'Huron research finance',
        ],
      },
    ],
    roles: [
      {
        title: 'Principal investigator (PI)',
        accountability:
          'The physician accountable for the scientific conduct, the ' +
          'safety, and the regulatory integrity of the study at the site.',
      },
      {
        title: 'Clinical research coordinator (CRC)',
        accountability:
          'Owns the day-to-day conduct of the study — recruitment, consent, ' +
          'visit conduct, source documentation, EDC data entry, and queries.',
      },
      {
        title: 'Director of clinical research operations',
        accountability:
          'Owns the research portfolio — study feasibility and acceptance, ' +
          'site performance, start-up cycle time, and operating budget.',
      },
      {
        title: 'Regulatory affairs / IRB coordinator',
        accountability:
          'Owns IRB submissions, amendments, the regulatory binder, and ' +
          'the institution’s human-subjects-protection compliance.',
      },
      {
        title: 'Clinical research associate / study monitor',
        accountability:
          'Owns source-data verification and monitoring of the site’s ' +
          'compliance with the protocol and good clinical practice — ' +
          'typically a sponsor or CRO role.',
      },
      {
        title: 'Data manager / biostatistician',
        accountability:
          'Owns data-query management, the database-lock process, and the ' +
          'analysis-ready study dataset.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'ICH-GCP (Good Clinical Practice, ICH E6)',
        relevance:
          'The international standard for the ethical and scientific ' +
          'conduct of trials; defines the obligations on investigators, ' +
          'documentation, and data integrity that bound every workflow.',
      },
      {
        name: 'FDA regulations — 21 CFR Parts 50, 56 and 312',
        relevance:
          'Govern informed consent, IRB review, and the investigational-' +
          'new-drug process for US trials; set the conduct and reporting ' +
          'rules a site operates under.',
      },
      {
        name: '21 CFR Part 11 (electronic records and signatures)',
        relevance:
          'Governs the validity of electronic records, electronic ' +
          'signatures, and audit trails — the constraint any AI-assisted ' +
          'EDC or eRegulatory workflow must satisfy.',
      },
      {
        name: 'The Common Rule (45 CFR 46) and IRB oversight',
        relevance:
          'The federal human-subjects-protection framework; IRB approval ' +
          'governs every recruitment, consent, and data-use pathway, ' +
          'including AI-assisted patient identification.',
      },
      {
        name: 'HIPAA and the privacy of research data',
        relevance:
          'Governs the use and disclosure of PHI for research recruitment ' +
          'and study conduct; cross-protocol EHR matching must sit within an ' +
          'approved privacy pathway.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Protocol',
        definition:
          'The document defining a study’s objectives, design, eligibility ' +
          'criteria, procedures, and statistical plan — the contract for how ' +
          'the trial is conducted.',
      },
      {
        term: 'Inclusion / exclusion criteria',
        definition:
          'The conditions a patient must meet (inclusion) and must not meet ' +
          '(exclusion) to be eligible to enrol in a study.',
      },
      {
        term: 'Screen-fail',
        definition:
          'A participant who consents and enters screening but is found ' +
          'ineligible and is not enrolled or randomised.',
      },
      {
        term: 'Source-data verification (SDV)',
        definition:
          'The monitoring activity of checking EDC data against the ' +
          'original source documents to confirm it is accurate and complete.',
      },
      {
        term: 'Protocol deviation',
        definition:
          'Any departure from the approved protocol — an eligibility, ' +
          'visit-window, procedure, or consent deviation.',
      },
      {
        term: 'Database lock',
        definition:
          'The point at which the study database is declared clean, ' +
          'complete, and frozen so statistical analysis can begin.',
      },
      {
        term: 'Last-patient-last-visit (LPLV)',
        definition:
          'The milestone when the final enrolled participant completes ' +
          'their final protocol-defined study visit — the start of the ' +
          'clock to database lock.',
      },
      {
        term: 'Adverse event (AE) / serious adverse event (SAE)',
        definition:
          'Any untoward medical occurrence in a participant; a serious ' +
          'adverse event meets defined severity criteria and triggers ' +
          'expedited reporting.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Clinical-Research Operations Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where a research operation is losing time and budget — ' +
        'feasibility, start-up, recruitment, data, or lock — on a specific ' +
        'study portfolio, with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Portfolio and study context',
          guidance:
            'Name the research portfolio in scope — therapeutic areas, ' +
            'number of active studies, the sponsor mix (industry vs. ' +
            'investigator-initiated), and the funding model. State which ' +
            'CTMS, EDC, and EHR systems are in use and how they connect.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — time to first-patient-in, enrolment vs. ' +
            'plan, screen-fail rate, deviation rate, query resolution time, ' +
            'activation and lock cycle time, retention, budget variance. For ' +
            'any metric the operation does not record, name it as a precise ' +
            'seed gap with its expected data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — optimistic feasibility, ' +
            'recruitment-funnel leak, late eligibility screening, start-up ' +
            'drag, coordinator documentation load, query backlog, protocol-' +
            'complexity creep, safety-signal latency — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Recruitment-funnel analysis',
          guidance:
            'Trace the recruitment funnel for representative studies — ' +
            'eligible population, identified candidates, referrals, ' +
            'consents, screens passed, enrolled — and locate the step where ' +
            'the funnel leaks most.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — time compression, screen-fail reduction, ' +
            'coordinator effort returned, lock compression — explicitly ' +
            'haircut by funnel conversion, data readiness, and protocol ' +
            'constraint. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric is a ' +
            'named ask, not a vague unknown.',
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
      label: 'Clinical-Research Operations Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a clinical-research ' +
        'AI Move on this portfolio — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into time, ' +
            'efficiency, and portfolio-capacity components, the time-to-' +
            'value band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — screen-fail rate, cycle times, coordinator effort. ' +
            'Where a baseline is a seed gap, say so and state what closing ' +
            'it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — funnel conversion, ' +
            'EHR data readiness, protocol constraint, coordinator adoption — ' +
            'explicitly and show the haircut math.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the CTMS, EDC, and EHR, the ' +
            'IRB and regulatory work to approve any recruitment pathway, and ' +
            'the coordinator operating-model change.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under low funnel conversion, criteria ' +
            'that prove hard to structure, and partial coordinator adoption. ' +
            'State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence — including IRB feasibility — that must be in ' +
            'hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including the ' +
            'portfolio-level metrics that compound over multiple studies.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Clinical-Research Operations Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'clinical-research AI capability, grounded in the function reference ' +
        'patterns and the regulatory frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — eligible-population query layer, point-of-care ' +
            'trial-match, pre-screen-before-visit, source-to-EDC assist, ' +
            'continuous safety reconciliation — and state which apply and ' +
            'how they connect.',
        },
        {
          heading: 'Data architecture and feeds',
          guidance:
            'Specify the EHR, CTMS, EDC, and eRegulatory feeds, their ' +
            'latency, identity resolution, and how protocol eligibility ' +
            'criteria are structured into queryable form.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. No recruitment or eligibility archetype ships ' +
            'without a named human owner and IRB approval.',
        },
        {
          heading: 'Recruitment-pathway and consent design',
          guidance:
            'Define exactly how AI-identified candidates reach a clinician ' +
            'and a voluntary consent conversation, and how the pathway ' +
            'protects equipoise and free consent.',
        },
        {
          heading: 'Regulatory, GCP and Part 11 controls',
          guidance:
            'State the IRB-approval pathway, the GCP and audit-trail ' +
            'controls, the 21 CFR Part 11 requirements for any EDC or ' +
            'eRegulatory workflow, and the privacy frame for EHR-based ' +
            'matching.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'CTMS, EDC, and EHR, and the phased rollout across the study ' +
            'portfolio.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Clinical-Research Operations Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the clinical-research AI ' +
        'capability so value is realised across the study portfolio, not ' +
        'just deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — feed integration and validation, IRB ' +
            'approval of the recruitment pathway, a pilot study, coordinator ' +
            'onboarding, scale to the portfolio — with milestones tied to ' +
            'the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — data feeds, ' +
            'criteria structuring, IRB and regulatory approval, coordinator ' +
            'adoption, safety governance, Tower measurement.',
        },
        {
          heading: 'Coordinator and investigator adoption approach',
          guidance:
            'Define the change runway for coordinators and investigators — ' +
            'training, workflow change, the source-to-EDC and matching ' +
            'rollout — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the portfolio-level rollups.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — IRB-approval delay, low funnel ' +
            'conversion, criteria that resist structuring, coordinator ' +
            'capacity — with the escalation owner and the trigger for each.',
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
      claim: 'The eligible population for a study at the site',
      authoritativeSource:
        'A criteria-level query of the EHR and claims data against the ' +
        'protocol’s key inclusion and exclusion criteria.',
      whatGoodEvidenceLooksLike:
        'A reproducible query stating each criterion checked, the data ' +
        'source for it, and the resulting count, with the criteria that ' +
        'could not be checked from the record listed explicitly.',
      weakEvidenceToReject:
        'A gut-feel patient estimate from the investigator, a stale count ' +
        'from a prior study, or a feasibility number with no stated query.',
    },
    {
      claim: 'Enrolment performance against the study plan',
      authoritativeSource:
        'The CTMS enrolment log compared against the protocol enrolment ' +
        'plan and the feasibility commitment.',
      whatGoodEvidenceLooksLike:
        'Time-stamped consent and enrolment records traced to the planned ' +
        'recruitment curve, with the funnel counts at each stage.',
      weakEvidenceToReject:
        'A verbal enrolment status, or a count that does not separate ' +
        'consented, screened, and enrolled participants.',
    },
    {
      claim: 'The screen-fail rate and its causes',
      authoritativeSource:
        'The CTMS screening log with each screen-fail’s recorded reason, ' +
        'reconciled against the screening assessments in the EDC.',
      whatGoodEvidenceLooksLike:
        'A screen-fail count with a coded reason for each, separating ' +
        'failures on record-checkable criteria from those needing an in-' +
        'person assessment.',
      weakEvidenceToReject:
        'A screen-fail rate quoted with no reason breakdown, or one that ' +
        'cannot distinguish a pre-checkable failure from an unavoidable one.',
    },
    {
      claim: 'Data-query and database-lock cycle performance',
      authoritativeSource:
        'The EDC query-management and milestone logs, time-stamped from ' +
        'query open to close and from last-visit to lock.',
      whatGoodEvidenceLooksLike:
        'The standing open-query count with an age profile, and the ' +
        'last-patient-last-visit-to-lock interval traced to the EDC ' +
        'milestone record.',
      weakEvidenceToReject:
        'A claimed lock timeline with no query-backlog evidence, or an ' +
        'estimate of query turnaround with no time-stamped log.',
    },
    {
      claim: 'The forecast value of a clinical-research AI Move',
      authoritativeSource:
        'The value model — time, efficiency, and portfolio-capacity ' +
        'components, each haircut by its dominant factors — read against ' +
        'the study funding model.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut factor ' +
        'applied explicitly and the funding model stated, every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single-point time-or-cost saving, a vendor ROI claim taken at ' +
        'face value, or a forecast that treats the eligible-population ' +
        'count as guaranteed enrolment.',
    },
  ],
};
