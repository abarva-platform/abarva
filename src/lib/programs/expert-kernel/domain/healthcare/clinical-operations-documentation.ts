// Domain Function Pack — Healthcare provider · Clinical operations & documentation.
//
// Function key: `clinical_operations_documentation`.
//
// This is the function that owns how clinical work gets recorded: the encounter
// note, the documentation workflow, clinical documentation integrity (CDI), the
// coding pathway out of the note, and the documentation burden that work places
// on clinicians. It is upstream of almost everything — revenue cycle, risk
// adjustment, quality measurement, and care coordination all consume what the
// note carries. When documentation is slow, incomplete, or burdensome, the cost
// shows up as after-hours work, clinician burnout and attrition, lost coding
// and quality capture, and care that is harder to coordinate.
//
// GROUNDED SUBSTRATE. This pack's operating metrics are calibrated against a
// real audited tenant: Meridian Health's "Ambient Clinical Value Chain
// Activation" Move (see `meridian-ambient-clinical-case.ts`). Where the kernel
// recorded a measured Meridian baseline — pajama time, note sign-to-close, CDI
// query volume and resolution, HCC capture, MBI-HSS burnout, ambulatory visit
// throughput — that figure anchors the metric's planning range here. The pack
// is the senior-operator generalisation; the Meridian case is one calibrated
// instance of it. Benchmark ranges remain labelled planning ranges, never
// asserted facts (spec §6 hard fail).
//
// The marquee AI archetype for this function is ambient clinical documentation —
// it is specified in full below.
//
// Pure, deterministic, typed module — no I/O, no fabrication.

import type { FunctionPack } from '../function-pack-types';

export const clinicalOperationsDocumentationPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'clinical_operations_documentation',
  functionLabel: 'Clinical operations & documentation',
  summary:
    'Clinical operations & documentation is the function that owns how the ' +
    'clinical record is created and how clinical work is recorded, coded, and ' +
    'closed. It runs the encounter-documentation workflow, clinical ' +
    'documentation integrity (CDI), the note-to-code pathway, and the ' +
    'documentation burden that work places on clinicians. It sits upstream of ' +
    'revenue cycle, risk adjustment, quality measurement, and care ' +
    'coordination — every one of those functions consumes what the note ' +
    'carries. The function fails in two directions at once: when documentation ' +
    'is slow and burdensome it drives clinician after-hours work, burnout, and ' +
    'attrition; when it is incomplete it leaks coding accuracy, risk capture, ' +
    'and quality credit the organisation has genuinely earned. It is the ' +
    'function where clinician experience and revenue integrity are the same ' +
    'problem seen from two sides.',
  version: '1.1.0',
  lastReviewed: '2026-06-06',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'after_hours_documentation_minutes',
      name: 'After-hours documentation time ("pajama time")',
      definition:
        'Median minutes per clinician per day spent in the EHR outside ' +
        'scheduled clinical hours — the "work outside work" or pajama-time ' +
        'measure of documentation burden, captured from EHR usage telemetry.',
      unit: 'minutes per clinician per day',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 60,
        high: 130,
        basis:
          'EHR-telemetry "work outside work" spans a wide band by specialty: ' +
          'primary care and ambulatory medicine sit at the high end (the ' +
          'Meridian audited baseline placed primary care at ~129 min/day, ' +
          'cohort median ~111), procedural specialties lower. Use the tenant ' +
          'specialty mix to place the planning point.',
        label: 'planning-range',
      },
      dataSource:
        'EHR usage-telemetry / signal data (e.g. Epic Signal, Cerner Advance), ' +
        'decomposed by specialty and site.',
      whyItMatters:
        'After-hours documentation is the most direct, clinician-felt measure ' +
        'of documentation burden; it is the metric that correlates with ' +
        'burnout and attrition and the one ambient documentation is bought to ' +
        'move.',
    },
    {
      key: 'note_sign_to_close_hours',
      name: 'Note turnaround (sign-to-close time)',
      definition:
        'Median elapsed time from the end of a patient encounter to the ' +
        'clinical note being signed and closed in the EHR.',
      unit: 'hours',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 24,
        basis:
          'Documentation-cycle turnaround spans same-shift close to next-day ' +
          'and beyond; the Meridian audited baseline recorded ~11.4 hours, ' +
          'above the cohort median on the narrower sign-to-close window. A ' +
          'planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'EHR encounter and note-status timestamps reconciled against the ' +
        'visit schedule.',
      whyItMatters:
        'Slow note turnaround delays coding, billing, care-team handoffs, and ' +
        'results follow-up; a backlog of open notes is also a leading ' +
        'indicator of clinician overload.',
    },
    {
      key: 'documentation_time_per_visit',
      name: 'Documentation time per visit',
      definition:
        'Median minutes of EHR documentation effort attributable to a single ' +
        'patient visit — in-visit plus associated charting — from usage ' +
        'telemetry.',
      unit: 'minutes per visit',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 20,
        basis:
          'Per-visit documentation effort varies with visit complexity, ' +
          'specialty, and template design; ambulatory medicine sits at the ' +
          'higher end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR usage telemetry attributed to encounters; time-and-motion ' +
        'observation as a corroborating source.',
      whyItMatters:
        'It is the unit-economics view of documentation burden — the figure ' +
        'that translates a documentation intervention into recovered clinical ' +
        'capacity or recovered after-hours time.',
    },
    {
      key: 'ambulatory_visit_throughput',
      name: 'Ambulatory visit throughput per clinician',
      definition:
        'The number of completed ambulatory patient visits per clinician per ' +
        'week — the throughput that documentation burden constrains and that ' +
        'recovered documentation time can expand.',
      unit: 'visits per clinician per week',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 70,
        high: 110,
        basis:
          'Ambulatory throughput varies with specialty, panel design, and ' +
          'visit length; the Meridian audited baseline recorded ~84 visits/' +
          'clinician/week. A planning range — higher is not automatically ' +
          'better if it trades against documentation quality or access.',
        label: 'planning-range',
      },
      dataSource:
        'EHR scheduling and encounter-completion data.',
      whyItMatters:
        'Throughput is where recovered documentation time can convert to ' +
        'access and revenue; it is also the metric that must be watched so a ' +
        'documentation gain is not silently spent on more visits and more ' +
        'burnout.',
    },
    {
      key: 'cdi_query_rate',
      name: 'CDI query rate',
      definition:
        'The number of clinical documentation integrity (CDI) queries raised ' +
        'to clinicians per measurement period — clarifications that resolve ' +
        'ambiguous, incomplete, or non-specific documentation, especially for ' +
        'HCC- and DRG-relevant conditions.',
      unit: 'queries per week (or queries per 1,000 encounters)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 40,
        high: 220,
        basis:
          'CDI query volume is scale- and case-mix-dependent; the Meridian ' +
          'audited baseline recorded ~40 HCC-relevant queries/week against a ' +
          'pattern expectation of 180–220 for its scale and MA mix — the ' +
          'shortfall is itself the measure of an integration gap. A planning ' +
          'range; too few queries signals missed capture, too many signals a ' +
          'documentation-quality problem upstream.',
        label: 'planning-range',
      },
      dataSource:
        'CDI workflow platform / EHR CDI module query logs.',
      whyItMatters:
        'CDI query volume is the leading indicator of how completely the note ' +
        'is supporting accurate coding and risk capture; an abnormally low ' +
        'rate usually means evident conditions are going uncoded.',
    },
    {
      key: 'cdi_query_resolution_hours',
      name: 'CDI query resolution cycle time',
      definition:
        'Median elapsed time from a CDI query being raised to the clinician ' +
        'resolving it — answering, amending the note, or declining.',
      unit: 'hours',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 24,
        high: 72,
        basis:
          'Query resolution turnaround spans same-day to multi-day; the ' +
          'Meridian audited baseline recorded ~38 hours, where the bottleneck ' +
          'was queue starvation rather than resolver throughput. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'CDI workflow platform query lifecycle timestamps.',
      whyItMatters:
        'Slow query resolution delays the coded, billable, risk-adjusted ' +
        'record and can push a discharge or claim past its working window; ' +
        'resolution time is the throughput metric of the CDI loop.',
    },
    {
      key: 'documentation_coding_accuracy',
      name: 'Documentation & coding accuracy',
      definition:
        'The share of audited encounters whose final coding is fully ' +
        'supported by the clinical documentation in the record — measured by ' +
        'coding-integrity audit, expressed as the agreement rate between ' +
        'documentation and assigned codes.',
      unit: '% of audited encounters with documentation-supported coding',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 88,
        high: 98,
        basis:
          'Coding-integrity audit agreement rates for mature documentation ' +
          'programs sit high but rarely at ceiling; the gap is split between ' +
          'under-documentation and over-coding. A planning range — accuracy, ' +
          'not maximisation, is the objective.',
        label: 'planning-range',
      },
      dataSource:
        'Coding-integrity / documentation-quality audit (internal or ' +
        'external) against the EHR record.',
      whyItMatters:
        'Accuracy is the integrity anchor — under-documentation leaks earned ' +
        'revenue and quality credit, over-coding creates audit and ' +
        'recoupment exposure; both are documentation failures.',
    },
    {
      key: 'hcc_capture_rate',
      name: 'HCC capture rate',
      definition:
        'How completely the clinically evident, eligible Hierarchical ' +
        'Condition Categories for a risk-adjusted (e.g. Medicare Advantage) ' +
        'panel are documented and coded in the measurement year, expressed ' +
        'against the conditions the population is expected to carry.',
      unit: '% of expected HCCs captured',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 75,
        basis:
          'Annual HCC recapture is documentation-dependent and varies with ' +
          'wellness-visit completion and CDI maturity; the Meridian audited ' +
          'baseline recorded ~58% against a cohort median of ~62% and a top ' +
          'quartile of ~71%. A planning range — capture must never exceed ' +
          'documented clinical truth.',
        label: 'planning-range',
      },
      dataSource:
        'HCC coding from EHR encounters reconciled against the risk-' +
        'adjustment submission and prior-year coding.',
      whyItMatters:
        'HCC capture is where documentation quality converts directly to ' +
        'risk-adjusted revenue; it is the clearest line from a better note to ' +
        'a financial result, and the one most exposed to compliance risk if ' +
        'pushed past documentation.',
    },
    {
      key: 'quality_measure_documentation_capture',
      name: 'Quality-measure documentation capture',
      definition:
        'The share of eligible quality-measure events (HEDIS, Stars, eCQM ' +
        'numerators) that are actually captured in structured, measure-ready ' +
        'documentation rather than lost to unstructured or absent recording.',
      unit: '% of eligible quality events captured in structured documentation',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 34,
        high: 70,
        basis:
          'Structured quality capture varies enormously with template design ' +
          'and discrete-field discipline; the Meridian audited baseline ' +
          'recorded ~34% against a program target band of 55–65%. A wide ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'eCQM / quality-measure engine reconciled against EHR structured and ' +
        'unstructured documentation.',
      whyItMatters:
        'Quality credit is forfeited when a clinically delivered action is ' +
        'documented in free text the measure engine cannot read; this metric ' +
        'isolates documentation loss from genuine care-delivery gaps.',
    },
    {
      key: 'clinician_documentation_burden_score',
      name: 'Clinician-reported documentation burden',
      definition:
        'A validated, clinician-reported score of perceived documentation ' +
        'burden — how much the documentation workload is felt to detract from ' +
        'patient care — tracked as a survey index for the clinician cohort.',
      unit: 'burden index (survey scale) or % reporting high burden',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 35,
        high: 65,
        basis:
          'The share of clinicians reporting high documentation burden is ' +
          'persistently large in ambulatory medicine; the band moves with ' +
          'specialty mix and EHR maturity. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Clinician experience / documentation-burden survey (e.g. a periodic ' +
        'EHR-experience or KLAS-style survey wave).',
      whyItMatters:
        'It is the subjective counterpart to the telemetry metrics; a ' +
        'documentation intervention that moves telemetry but not perceived ' +
        'burden has not actually changed the clinician experience.',
    },
    {
      key: 'mbi_burnout_signal',
      name: 'Clinician burnout signal (emotional exhaustion)',
      definition:
        'The share of surveyed clinicians scoring in the elevated emotional-' +
        'exhaustion band of a validated burnout instrument (e.g. the MBI-HSS) ' +
        '— a trailing indicator of the human cost of documentation burden.',
      unit: '% of clinicians in the elevated emotional-exhaustion band',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 40,
        high: 60,
        basis:
          'Elevated emotional-exhaustion prevalence among physicians is ' +
          'persistently high; the Meridian audited baseline recorded ~54% ' +
          'against a cohort median of ~48%, with documentation time ' +
          'correlated at r≈0.41. A planning range — it is a quarterly ' +
          'trailing indicator, not a real-time metric.',
        label: 'planning-range',
      },
      dataSource:
        'Periodic validated burnout survey wave (e.g. MBI-HSS) for the ' +
        'clinician cohort.',
      whyItMatters:
        'Burnout is the lagging outcome documentation burden is bought to ' +
        'move, and it is the channel into clinician attrition and locum cost; ' +
        'it must be tracked even though it responds slowly.',
    },
    {
      key: 'clinician_retention_rate',
      name: 'Clinician retention rate (annual)',
      definition:
        'The share of clinicians retained over a rolling twelve-month period ' +
        '— the workforce-stability outcome that documentation burden and ' +
        'burnout feed into.',
      unit: '% of clinicians retained year-over-year',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 95,
        basis:
          'Annual clinician retention sits in a high but consequential band; ' +
          'the Meridian audited baseline recorded ~88%. Each lost clinician ' +
          'carries large replacement and locum-coverage cost. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'HR workforce data reconciled against the clinician roster.',
      whyItMatters:
        'Retention is the dominant economic channel through which reduced ' +
        'documentation burden converts to dollars — through avoided ' +
        'replacement, recruitment, and locum-coverage cost.',
    },
    {
      key: 'note_template_variation_index',
      name: 'Note-template variation index',
      definition:
        'A measure of how much encounter documentation varies in structure ' +
        'across clinicians and sites for the same encounter type — the ' +
        'degree of template and documentation-standard fragmentation.',
      unit: 'variation index (number of distinct effective templates per encounter type)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Documentation-template fragmentation grows with site count and ' +
          'specialty count and with weak template governance; consolidation ' +
          'programs target the low end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'EHR template-usage inventory and CDI documentation-standard review.',
      whyItMatters:
        'Template fragmentation undermines structured quality capture, makes ' +
        'CDI and coding harder, and is the precondition that template ' +
        'governance has to fix before downstream documentation AI can scale.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'after_hours_documentation_load',
      name: 'After-hours documentation load',
      description:
        'Clinicians cannot complete documentation within scheduled hours, so ' +
        'a substantial share of charting moves to evenings and weekends. The ' +
        'workday looks full on paper while the real documentation cost is ' +
        'invisible until it surfaces as burnout and attrition.',
      detectionSignal:
        'EHR telemetry shows high "work outside work" minutes per clinician ' +
        'per day, concentrated in ambulatory primary care and a long tail of ' +
        'overloaded clinicians.',
      diagnosticQuestion:
        'How many minutes a day are clinicians documenting outside scheduled ' +
        'hours, and how does that vary by specialty and site?',
    },
    {
      key: 'note_backlog_and_turnaround',
      name: 'Note backlog and slow turnaround',
      description:
        'Encounter notes are signed and closed slowly, so a backlog of open ' +
        'notes accumulates. Coding, billing, results follow-up, and care-team ' +
        'handoffs all wait on the note, and the backlog itself becomes a ' +
        'source of clinician stress.',
      detectionSignal:
        'Median note sign-to-close time runs long and a rising count of ' +
        'notes sit open past their expected close window.',
      diagnosticQuestion:
        'What is the median note sign-to-close time, and how large is the ' +
        'open-note backlog?',
    },
    {
      key: 'cdi_queue_starvation',
      name: 'CDI queue starvation and integration gap',
      description:
        'The CDI operation is sized to handle far more queries than it ' +
        'actually receives, because clinically evident documentation gaps ' +
        'never reach the queue. CDI specialists are under-fed while real ' +
        'capture is being lost — the bottleneck is the routing into CDI, not ' +
        'CDI throughput.',
      detectionSignal:
        'CDI query volume sits far below the pattern expectation for the ' +
        "organisation's scale and case mix while CDI resolver capacity is " +
        'idle; the gap between expected and actual query volume is large.',
      diagnosticQuestion:
        'How does CDI query volume compare to the volume expected for this ' +
        'scale and case mix, and what routes documentation gaps into the CDI ' +
        'queue?',
    },
    {
      key: 'documentation_to_code_leakage',
      name: 'Documentation-to-code leakage',
      description:
        'Conditions and quality actions are clinically real and clinically ' +
        'delivered but never make it into structured, codeable documentation. ' +
        'Earned HCC capture and quality credit are silently lost between the ' +
        'encounter and the coded record.',
      detectionSignal:
        'HCC capture and structured quality-measure capture sit well below ' +
        'expected levels while the underlying clinical care is being ' +
        'delivered; free-text documentation carries actions the coding and ' +
        'measure engines cannot read.',
      diagnosticQuestion:
        'Where is clinically delivered care being lost between the note and ' +
        'the coded, measure-ready record?',
    },
    {
      key: 'template_fragmentation',
      name: 'Note-template and documentation-standard fragmentation',
      description:
        'Documentation templates and standards have proliferated across ' +
        'sites and specialties with weak governance. The same encounter type ' +
        'is documented many different ways, which degrades structured ' +
        'capture, complicates CDI and coding, and blocks any documentation AI ' +
        'from scaling cleanly.',
      detectionSignal:
        'A large inventory of effective templates per encounter type; ' +
        'structured quality capture varies sharply by site for clinically ' +
        'similar populations.',
      diagnosticQuestion:
        'How many effective documentation templates are in use per encounter ' +
        'type, and who governs the documentation standard?',
    },
    {
      key: 'over_documentation_and_note_bloat',
      name: 'Over-documentation and note bloat',
      description:
        'Copy-forward, templated boilerplate, and defensive documentation ' +
        'inflate notes with low-signal text. The clinically meaningful ' +
        'content is buried, the next clinician cannot find it quickly, and ' +
        'the bloat itself raises both review time and over-coding risk.',
      detectionSignal:
        'Note length grows without a corresponding rise in distinct clinical ' +
        'content; high copy-forward rates; clinicians report difficulty ' +
        'finding the relevant history.',
      diagnosticQuestion:
        'How much of the typical note is copied-forward or boilerplate, and ' +
        'how easily can the next clinician find what actually matters?',
    },
    {
      key: 'clinician_burnout_and_attrition',
      name: 'Documentation-driven burnout and attrition',
      description:
        'Sustained documentation burden converts into emotional exhaustion, ' +
        'reduced clinical hours, and ultimately clinician departures — each ' +
        'departure carrying large replacement and locum-coverage cost and ' +
        'further loading the clinicians who remain.',
      detectionSignal:
        'Elevated emotional-exhaustion scores correlated with documentation ' +
        'time; rising voluntary attrition and locum spend in the most ' +
        'documentation-heavy specialties.',
      diagnosticQuestion:
        'Is documentation burden showing up in the burnout survey and in ' +
        'attrition, and what is it costing in locum coverage?',
    },
    {
      key: 'ambient_trust_and_oversight_gap',
      name: 'Ambient-documentation trust and oversight gap',
      description:
        'When ambient or AI-drafted documentation is introduced, clinicians ' +
        'either over-trust the draft and sign without adequate review, or ' +
        'distrust it and re-document everything — both of which destroy the ' +
        'intended benefit. Without a defined review and attestation ' +
        'discipline the safety and the value both fail.',
      detectionSignal:
        'Either very fast sign-off with low edit rates on AI-drafted notes ' +
        '(over-trust), or high edit and rejection rates and no time saved ' +
        '(distrust); clinician sentiment is polarised.',
      diagnosticQuestion:
        'When documentation is AI-drafted, what is the clinician review and ' +
        'attestation discipline, and how is draft accuracy actually ' +
        'monitored?',
    },
    {
      key: 'rented_black_box_clinical_models',
      name: 'Rented black-box clinical models the organisation cannot ' +
        'validate',
      description:
        'The documentation, coding, and clinical-decision models the ' +
        'organisation depends on are proprietary vendor models that run on ' +
        'the vendor side and cannot be inspected, validated on the ' +
        'organisation’s own population, or recalibrated when that population ' +
        'drifts. The organisation rents intelligence derived from its own ' +
        'clinical data and takes the vendor’s marketed accuracy on faith — a ' +
        'liability it cannot fix because it cannot see inside it. The ' +
        'canonical cautionary case is the Epic Sepsis Model: when externally ' +
        'validated (Wong et al., JAMA Internal Medicine 2021) its real-world ' +
        'discrimination was AUC ≈0.63, far below the vendor’s marketed ' +
        'performance, while it missed roughly two-thirds of sepsis cases and ' +
        'fired on a large share of all patients. A model you cannot inspect ' +
        'or recalibrate is a liability, not an asset, and marketed accuracy ' +
        'is not real-world accuracy on your population.',
      detectionSignal:
        'The coding, CDI, or clinical models cannot be inspected at the ' +
        'feature or logic level, were never validated against the ' +
        'organisation’s own labelled outcomes, report only a marketed ' +
        'accuracy figure rather than tenant discrimination and calibration, ' +
        'and have no drift-monitoring or recalibration path the organisation ' +
        'controls.',
      diagnosticQuestion:
        'Are the documentation and coding models owned and validated on the ' +
        'organisation’s own data — auditable, locally calibrated, and ' +
        'monitored for drift — or are they black-box vendor models the ' +
        'organisation rents and cannot inspect, recalibrate, or move?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ambient_clinical_documentation',
      name: 'Ambient clinical documentation',
      valueMechanism:
        'An ambient AI scribe captures the clinician-patient conversation and ' +
        'drafts the structured encounter note in real time; the clinician ' +
        'reviews, edits, and attests it in-visit rather than charting after ' +
        'hours. Value comes through two distinct channels: recovered clinician ' +
        'time — which converts to reduced after-hours documentation, lower ' +
        'burnout, better retention, and optionally added visit throughput — ' +
        'and a more complete, more structured note that lifts downstream CDI, ' +
        'HCC capture, and quality-measure capture. The marquee bet of this ' +
        'function: it attacks burden and revenue integrity with one ' +
        'intervention.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'In-visit audio capture with patient consent',
        'EHR write-back integration for the drafted note (encounter, ' +
          'problem list, orders context)',
        'Specialty-specific note templates and documentation standards',
        'EHR usage telemetry to measure recovered time and adoption',
        'A coding / CDI feedback channel so the note carries codeable ' +
          'specificity',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Every ambient-drafted note is reviewed, edited, and attested by the ' +
          'clinician before sign-off — the clinician owns the record, the AI ' +
          'never closes a note autonomously.',
        'Patient consent for ambient capture is obtained and recorded; the ' +
          'capture posture must satisfy HIPAA and, where substance-use data ' +
          'is involved, 42 CFR Part 2.',
        'Draft accuracy must be monitored continuously — hallucinated or ' +
          'omitted clinical content is a patient-safety risk; track edit ' +
          'rates and run periodic accuracy audits.',
        'Watch the over-trust failure mode: fast sign-off with near-zero ' +
          'edits is a warning sign, not a success signal.',
        'Decide explicitly whether recovered time is taken as relieved ' +
          'burden or as added visit volume — taking it all as volume ' +
          're-creates the burnout it was meant to fix.',
      ],
      metricsMoved: [
        'after_hours_documentation_minutes',
        'note_sign_to_close_hours',
        'documentation_time_per_visit',
        'clinician_documentation_burden_score',
        'mbi_burnout_signal',
        'clinician_retention_rate',
      ],
      relatedArchetypePlaybook: 'clinical_workflow_ai',
    },
    {
      key: 'cdi_query_intelligence',
      name: 'CDI query intelligence and routing',
      valueMechanism:
        'A model reads the encounter documentation as it is created, detects ' +
        'ambiguous, non-specific, or clinically-evident-but-uncoded content, ' +
        'and routes a precise, evidence-cited CDI query to the right ' +
        'specialist or clinician. Value comes from feeding a starved CDI ' +
        'queue with the queries that actually matter — converting an ' +
        'integration gap into accurate documentation and recaptured, ' +
        'compliant HCC and DRG specificity.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR clinical documentation and problem list',
        'Prior-year HCC / DRG coding and claims history',
        'CDI workflow platform query lifecycle data',
        'Coding-integrity reference rules and specificity standards',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model drafts and routes queries; a CDI specialist and the ' +
          'clinician own the clinical answer — a code is never assigned on ' +
          'inference.',
        'Every query must cite the specific clinical evidence it is based ' +
          'on, so the clinician can verify and is not led toward a ' +
          'predetermined answer.',
        'The objective is documentation accuracy, not query volume or ' +
          'capture maximisation — over-querying is its own burden and ' +
          'over-capture is a compliance risk.',
      ],
      metricsMoved: [
        'cdi_query_rate',
        'cdi_query_resolution_hours',
        'documentation_coding_accuracy',
        'hcc_capture_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'autonomous_and_assisted_coding',
      name: 'Computer-assisted and autonomous coding',
      valueMechanism:
        'A model reads the completed clinical documentation and proposes — or ' +
        'for well-bounded, low-ambiguity encounter types, assigns — the ' +
        'diagnosis and procedure codes, with a coder reviewing exceptions and ' +
        'high-risk cases. Value comes from faster, more consistent coding, a ' +
        'shorter documentation-to-bill cycle, and coder capacity redirected ' +
        'from routine encounters to complex and audit-sensitive ones.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Structured and unstructured EHR clinical documentation',
        'Code sets and coding-rule references (ICD-10-CM, CPT, HCC mappings)',
        'Historical coded encounters for calibration and audit',
        'A coder review and exception-handling workflow',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Autonomous assignment is confined to narrow, low-ambiguity encounter ' +
          'types with measured accuracy; everything else routes to a coder.',
        'A confidence threshold and a mandatory exception queue catch ' +
          'ambiguous and high-risk cases — coders sample autonomous output ' +
          'continuously.',
        'Coding must remain grounded in the documentation; the model must ' +
          'never code to a diagnosis the note does not support, which would ' +
          'create recoupment exposure.',
      ],
      metricsMoved: [
        'documentation_coding_accuracy',
        'note_sign_to_close_hours',
        'hcc_capture_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'note_summarization_and_chart_synthesis',
      name: 'Clinical note summarisation and chart synthesis',
      valueMechanism:
        'A model assembles a concise, sourced synthesis of a patient chart — ' +
        'a longitudinal summary, a pre-visit brief, an interval-history ' +
        'digest — so the clinician spends less time hunting through a bloated ' +
        'record. Value comes from recovered chart-review time, fewer missed ' +
        'history items, and a partial antidote to note bloat without ' +
        'requiring the underlying notes to be rewritten.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Longitudinal EHR notes, problem list, results, and medications',
        'Encounter and visit-schedule context for pre-visit briefs',
        'Source-citation linkage back to the originating record',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Every synthesised statement must cite its source record so the ' +
          'clinician can verify — an unsourced summary is unsafe to act on.',
        'The summary is decision support, not a clinical record; it does not ' +
          'replace reading the chart where the stakes require it.',
        'Omission is the dangerous failure mode — monitor for clinically ' +
          'material content the summary drops, not just for incorrect ' +
          'content.',
      ],
      metricsMoved: [
        'documentation_time_per_visit',
        'clinician_documentation_burden_score',
        'note_template_variation_index',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'documentation_quality_template_governance',
      name: 'Documentation-quality analytics and template governance',
      valueMechanism:
        'A model analyses documentation across clinicians and sites — ' +
        'template fragmentation, copy-forward rates, structured-capture gaps, ' +
        'note-bloat patterns — and turns it into a governed, consolidated set ' +
        'of documentation standards and templates. Value comes from raising ' +
        'structured quality capture, reducing fragmentation, and creating the ' +
        'clean documentation substrate the other archetypes need to scale.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR template-usage inventory and note-content telemetry',
        'Structured quality-measure capture data by site and clinician',
        'CDI findings and coding-audit results',
        'Specialty documentation standards and governance ownership',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces patterns and proposes standards; a clinical ' +
          'documentation governance body owns the decision to change a ' +
          'template or standard.',
        'Template change is a workflow change for every affected clinician — ' +
          'it must be governed and staged, not pushed silently.',
        'Standardisation must not strip the clinically necessary specialty ' +
          'variation; the objective is governed consistency, not uniformity ' +
          'for its own sake.',
      ],
      metricsMoved: [
        'note_template_variation_index',
        'quality_measure_documentation_capture',
        'documentation_coding_accuracy',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'ambient_capture_review_attest',
      name: 'Ambient capture → clinician review → attest pattern',
      description:
        'An ambient layer captures the encounter and drafts the note; the ' +
        'clinician reviews and edits it inside the visit workflow; the ' +
        'clinician attests and signs. The note is only ever written back to ' +
        'the EHR after human attestation. Edit rate and draft-accuracy ' +
        'telemetry are first-class outputs of the pattern, not afterthoughts.',
      boundary:
        'It captures and drafts; it does not sign, close, or own the record. ' +
        'The clinician is the author of the legal note and the only actor ' +
        'who can attest it.',
      humanAccountabilityPoint:
        'The attesting clinician, who owns and signs the clinical note.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'clinical_documentation_ai',
    },
    {
      key: 'documentation_to_cdi_coding_loop',
      name: 'Documentation-to-CDI-to-coding closed loop',
      description:
        'A pattern that wires the note, the CDI query workflow, and the ' +
        'coding pathway into a single closed loop: documentation gaps are ' +
        'detected and routed into the CDI queue, resolved queries amend the ' +
        'note, and the amended note flows into coding. The loop is measured ' +
        'on query volume reaching CDI and on documentation-supported coding ' +
        'accuracy, not on raw capture.',
      boundary:
        'It detects, routes, and reconciles; CDI specialists and clinicians ' +
        'own the clinical answer and coders own the final code. It never ' +
        'assigns a code on inference.',
      humanAccountabilityPoint:
        'The CDI director accountable for documentation integrity, with the ' +
        'clinician accountable for the documented clinical truth.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'documentation_telemetry_substrate',
      name: 'Unified documentation-telemetry substrate',
      description:
        'A reconciliation layer that assembles documentation telemetry — ' +
        'after-hours minutes, note turnaround, per-visit time, edit rates, ' +
        'template usage — from the EHR and any ambient vendors into a single, ' +
        'specialty- and site-decomposed view. Every documentation use case ' +
        'and every measurement plan reads this substrate rather than a ' +
        'vendor dashboard.',
      boundary:
        'It assembles and reconciles telemetry; it does not make clinical or ' +
        'staffing decisions and is a read model, not a system of record.',
      humanAccountabilityPoint:
        'The clinical informatics owner accountable for documentation ' +
        'telemetry and its reconciliation across vendors.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'governed_template_library',
      name: 'Governed documentation-template library',
      description:
        'A single governed library of documentation templates and standards ' +
        'per encounter type and specialty, owned by a clinical documentation ' +
        'governance body. Proposed changes are evidenced by documentation-' +
        'quality analytics, staged as managed workflow changes, and version-' +
        'controlled. It is the substrate that lets documentation AI scale ' +
        'cleanly.',
      boundary:
        'It holds and governs the documentation standard; it does not ' +
        'override clinically necessary specialty variation and does not ' +
        'author individual notes.',
      humanAccountabilityPoint:
        'The clinical documentation governance body, chaired by a CMIO or ' +
        'documentation-integrity lead.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'multi_vendor_ambient_orchestration',
      name: 'Multi-vendor ambient orchestration layer',
      description:
        'When more than one ambient documentation vendor is in use across an ' +
        'organisation, an orchestration layer normalises their outputs, ' +
        'telemetry, and feedback channels to a common standard so ' +
        'measurement, governance, and the CDI/coding loop do not fragment ' +
        'per vendor. It also keeps a vendor-rationalisation decision open and ' +
        'evidenced.',
      boundary:
        'It normalises and orchestrates across vendors; it does not itself ' +
        'generate documentation and does not make the procurement decision.',
      humanAccountabilityPoint:
        'The CMIO or clinical informatics lead accountable for the ambient ' +
        'documentation portfolio and its vendor strategy.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Clinical-documentation value is realised through two distinct ' +
      'channels that must be modelled separately because they carry ' +
      'different haircuts and different proof. The first is recovered ' +
      'clinician time: less after-hours documentation, lower burnout, ' +
      'better retention and avoided locum cost, and — only if the ' +
      'organisation chooses to take it that way — added visit throughput. ' +
      'The second is documentation integrity: a more complete, structured ' +
      'note that lifts CDI throughput, compliant HCC capture, and quality-' +
      'measure capture, which convert to revenue and quality credit. The ' +
      'recovered-time channel is real but hard to monetise — it only ' +
      'becomes dollars through an attested cost-per-clinician-hour or an ' +
      'attested locum-avoidance basis, and if those are not measured the ' +
      'forecast is an illustrative ceiling, not a claimed return. The ' +
      'integrity channel converts more directly but is gated by compliance: ' +
      'capture must never exceed documented clinical truth. A forecast that ' +
      'blends the two channels into a single number, or that monetises ' +
      'recovered time on an unattested coefficient, is dishonest by ' +
      'construction.',
    dominantHaircutFactors: [
      {
        factor: 'Monetisation-coefficient readiness',
        rationale:
          'The recovered-time channel only becomes a dollar value through a ' +
          'fully-loaded cost-per-clinician-hour, a locum-avoidance basis, or ' +
          'a RAF-to-revenue coefficient. When those are modeled rather than ' +
          'attested by Finance, the dollar forecast is a proxy — the ' +
          'gross-value range is an illustrative ceiling, not a return. This ' +
          'is the largest and most common source of forecast erosion in ' +
          'this function.',
        typicalHaircut: {
          low: 0.3,
          high: 0.6,
          basis:
            'The discount applied to a documentation-value forecast that ' +
            'rests on unattested monetisation coefficients; a planning ' +
            'range, narrowed once Finance attests the basis.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Clinician adoption and review discipline',
        rationale:
          'Documentation AI only creates value for clinicians who actually ' +
          'adopt it and review its drafts well. Low adoption removes the ' +
          'time benefit entirely; over-trust without review creates a ' +
          'safety and accuracy liability that offsets it. Adoption varies ' +
          'sharply by specialty and by clinician.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Forecast erosion from partial adoption and uneven review ' +
            'discipline across the clinician cohort; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Documentation-substrate readiness',
        rationale:
          'Template fragmentation, weak CDI integration, and fragmented ' +
          'documentation telemetry cap how much of the integrity channel can ' +
          'be realised and measured. A program modelled on a clean substrate ' +
          'but delivered onto a fragmented one erodes through the gap.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion attributable to template fragmentation and ' +
            'weak CDI / telemetry integration; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Compliance ceiling on capture',
        rationale:
          'The HCC and quality-capture value is hard-bounded by documented ' +
          'clinical truth — capture cannot be pushed past what the record ' +
          'supports without creating audit and recoupment exposure that can ' +
          'exceed the revenue gained. The realisable capture lift is ' +
          'therefore capped well below the apparent gap.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The portion of an apparent capture gap that is not compliantly ' +
            'realisable; a planning range driven by the documentation ' +
            'baseline.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'After-hours documentation-time reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Achievable reduction in after-hours documentation minutes per ' +
            'clinician per day from a well-adopted ambient documentation ' +
            'program; a planning range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Absolute reduction in after-hours documentation minutes per ' +
          'clinician per day for the adopting cohort against a matched ' +
          'baseline.',
      },
      {
        lever: 'Clinician-retention improvement and locum-cost avoidance',
        range: {
          low: 1,
          high: 4,
          basis:
            'Improvement in annual clinician retention attributable to ' +
            'reduced documentation burden, and the associated avoided ' +
            'replacement and locum-coverage cost; a planning range — only ' +
            'monetisable on an attested cost basis.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in annual clinician retention, converted ' +
          'to dollars only on an attested replacement / locum-avoidance ' +
          'basis.',
      },
      {
        lever: 'Compliant HCC and quality-capture lift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Percentage-point lift in HCC capture and structured quality-' +
            'measure capture from improved documentation and CDI integration ' +
            '— accurate capture only, never overreach. A planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in HCC capture rate and quality-measure ' +
          'documentation capture for the affected panel, converted to ' +
          'revenue only on an attested coefficient.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable documentation-burden signal (after-' +
      'hours minutes, note turnaround) once ambient documentation is adopted; ' +
      '9–18 months for the integrity channel (CDI volume, HCC capture, ' +
      'quality capture) to settle, because it depends on CDI integration and ' +
      'a full risk-adjustment / quality cycle; retention and burnout signals ' +
      'are trailing and take 12–24 months to read clearly.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record — the encounter note, problem ' +
          'list, orders, results, and the documentation templates and usage ' +
          'telemetry that this function runs on.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'Meditech', 'athenahealth'],
      },
      {
        name: 'Ambient clinical documentation platform',
        role:
          'Captures the clinician-patient encounter and drafts the ' +
          'structured note for clinician review and attestation.',
        examples: [
          'Abridge',
          'Microsoft / Nuance DAX Copilot',
          'Ambience Healthcare',
          'Suki',
        ],
      },
      {
        name: 'Clinical documentation integrity (CDI) platform',
        role:
          'Manages the CDI query workflow — detecting documentation gaps, ' +
          'routing queries, and tracking their resolution.',
        examples: [
          'Epic CDI module',
          '3M / Solventum CDI',
          'Iodine Software',
          'Nuance CDE',
        ],
      },
      {
        name: 'Coding and computer-assisted-coding system',
        role:
          'Assigns and manages diagnosis and procedure codes from the ' +
          'clinical documentation and feeds the claim.',
        examples: [
          'EHR-native coding modules',
          '3M / Solventum CAC',
          'computer-assisted-coding engines',
        ],
      },
      {
        name: 'EHR usage-telemetry / signal system',
        role:
          'Provides the documentation-burden telemetry — after-hours time, ' +
          'note turnaround, per-visit documentation time — decomposed by ' +
          'clinician, specialty, and site.',
        examples: ['Epic Signal', 'Cerner Advance', 'EHR audit-log analytics'],
      },
    ],
    roles: [
      {
        title: 'Chief Medical Information Officer (CMIO)',
        accountability:
          'Owns clinical informatics, the documentation workflow, the ' +
          'documentation-AI portfolio, and the clinician-experience outcome.',
      },
      {
        title: 'Chief Medical Officer (CMO)',
        accountability:
          'Owns clinical quality and the clinician workforce — burnout, ' +
          'retention, and the clinical case for reducing documentation ' +
          'burden.',
      },
      {
        title: 'CDI director / clinical documentation integrity lead',
        accountability:
          'Owns documentation integrity — the CDI query operation and the ' +
          'completeness and specificity of the clinical record.',
      },
      {
        title: 'Director of health information management (HIM) / coding',
        accountability:
          'Owns the coding operation and the integrity of the documented-to-' +
          'coded pathway.',
      },
      {
        title: 'Practising clinician (attending physician, APP)',
        accountability:
          'Owns the clinical note — its clinical truth, its completeness, ' +
          'and the attestation that closes it.',
      },
      {
        title: 'VP Revenue Cycle',
        accountability:
          'Owns the conversion of documentation and coding into billed, ' +
          'risk-adjusted revenue and the financial coefficients behind it.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA Privacy and Security Rules',
        relevance:
          'Govern PHI handling across documentation and any ambient capture; ' +
          'an ambient vendor processing encounter audio requires a Business ' +
          'Associate Agreement and a controlled processing posture.',
      },
      {
        name: '42 CFR Part 2',
        relevance:
          'Adds stricter segmentation and consent rules for substance-use-' +
          'disorder information — a specific constraint on ambient capture ' +
          'and on note sharing where that content is present.',
      },
      {
        name: 'CMS Evaluation & Management (E/M) documentation guidelines',
        relevance:
          'Define what documentation is required to support a billed ' +
          'encounter level; documentation AI must produce notes that meet ' +
          'them without inflating to over-code.',
      },
      {
        name: 'CMS-HCC risk-adjustment and RADV audit regime',
        relevance:
          'HCC capture from documentation drives risk-adjusted revenue and ' +
          'is audited under RADV — making documentation-supported accuracy, ' +
          'not capture maximisation, the hard objective.',
      },
      {
        name: '21st Century Cures Act information-blocking rule',
        relevance:
          'Requires that clinical notes are shared with patients; it raises ' +
          'the bar on note clarity and accuracy because the patient is now a ' +
          'direct reader of the documentation.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Pajama time / work outside work',
        definition:
          'EHR time spent on clinical documentation outside scheduled ' +
          'clinical hours — the standard telemetry measure of documentation ' +
          'burden.',
      },
      {
        term: 'Ambient clinical documentation',
        definition:
          'AI that captures the clinician-patient conversation and drafts ' +
          'the encounter note for clinician review and attestation.',
      },
      {
        term: 'Clinical documentation integrity (CDI)',
        definition:
          'The function and workflow that ensures the clinical record is ' +
          'complete, specific, and accurate enough to support correct coding ' +
          'and quality measurement.',
      },
      {
        term: 'CDI query',
        definition:
          'A clarification raised to a clinician to resolve ambiguous, ' +
          'incomplete, or non-specific documentation, typically for a coding-' +
          'or risk-relevant condition.',
      },
      {
        term: 'Sign-to-close',
        definition:
          'The interval from the end of an encounter to the clinical note ' +
          'being signed and closed in the EHR.',
      },
      {
        term: 'HCC capture',
        definition:
          'The completeness with which clinically evident Hierarchical ' +
          'Condition Categories are documented and coded in the measurement ' +
          'year for a risk-adjusted population.',
      },
      {
        term: 'Note bloat',
        definition:
          'The inflation of clinical notes with copied-forward or templated ' +
          'low-signal text that buries the clinically meaningful content.',
      },
      {
        term: 'Attestation',
        definition:
          'The clinician act of reviewing and signing a note, taking ' +
          'authorship and accountability for it — the human gate every ' +
          'documentation AI must pass.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Clinical-Documentation Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the clinical-documentation operation is leaking — as ' +
        'clinician burden and as lost documentation integrity — with baseline ' +
        'evidence, before any solution is shaped.',
      sections: [
        {
          heading: 'Documentation operating context',
          guidance:
            'Describe the documentation landscape — the EHR, the specialty ' +
            'and site mix, any ambient documentation vendors already in use, ' +
            'the CDI operation, and the coding pathway. State which telemetry ' +
            'and survey sources are available and how fresh they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the function ' +
            'expects — after-hours documentation time, note sign-to-close, ' +
            'documentation time per visit, CDI query rate and resolution, ' +
            'coding accuracy, HCC and quality-measure capture, burnout, ' +
            'retention. Decompose by specialty and site where it matters. For ' +
            'any metric the tenant does not record, name it as a precise seed ' +
            'gap with its expected data source.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — after-hours load, note backlog, ' +
            'CDI queue starvation, documentation-to-code leakage, template ' +
            'fragmentation, note bloat, burnout and attrition, ambient trust ' +
            'gap — and state which are present, with the detection signal and ' +
            'evidence for each.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity from the value-model benchmark ranges, ' +
            'separating the recovered-time channel from the documentation-' +
            'integrity channel. Be explicit that the recovered-time channel ' +
            'is not monetisable without an attested cost coefficient. Every ' +
            'figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the data the diagnosis still needs, who owns each source, ' +
            'and what each gap blocks — call out the monetisation ' +
            'coefficients (cost-per-clinician-hour, RAF-to-revenue, locum ' +
            'basis) explicitly as named asks, not vague unknowns.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to — ' +
            'most often ambient documentation, often paired with CDI query ' +
            'intelligence — and why, and what the Move would and would not ' +
            'attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Clinical-Documentation Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a clinical-' +
        'documentation AI Move — baseline, dual-channel forecast, cost, and ' +
        'the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into the ' +
            'recovered-time and documentation-integrity channels, the time-' +
            'to-value band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric. Where a baseline or a monetisation coefficient is a seed ' +
            'gap, say so plainly and state what closing it requires before ' +
            'funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'keeping the recovered-time and integrity channels separate, then ' +
            'apply each dominant haircut — monetisation-coefficient ' +
            'readiness, clinician adoption, substrate readiness, the ' +
            'compliance ceiling — explicitly with the math shown. If the ' +
            'monetisation coefficients are unattested, present the dollar ' +
            'figure as an illustrative ceiling, not a claimed return.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the ambient and CDI integration to the EHR, the ' +
            'documentation-governance and template-consolidation work, and ' +
            'the clinician change and training effort.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under low clinician adoption, ' +
            'unattested coefficients, a fragmented documentation substrate, ' +
            'and a thinner compliant capture lift. State the downside the CFO ' +
            'is underwriting.',
        },
        {
          heading: 'Compliance and clinician-safety posture',
          guidance:
            'State the HIPAA / BAA, 42 CFR Part 2, and information-blocking ' +
            'posture for ambient capture, and the draft-accuracy and ' +
            'attestation controls that keep AI-drafted documentation safe.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded — ' +
            'e.g. CDI integration not commissioning, monetisation ' +
            'coefficients still unattested — and the evidence required before ' +
            'the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to prove ' +
            'the forecast and the cadence — and flag the metrics whose ' +
            'financial conversion stays unwired until a coefficient is ' +
            'attested.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Clinical-Documentation Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'clinical-documentation AI capability, grounded in the function ' +
        'reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — ambient capture-review-attest, the documentation-to-' +
            'CDI-to-coding loop, the documentation-telemetry substrate, the ' +
            'governed template library, and multi-vendor ambient ' +
            'orchestration where more than one vendor is in play — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Platform landing zone & private data plane',
          guidance:
            'Specify the cloud landing zone and private data plane the ' +
            'capability runs on — multi-account governance, private ' +
            'networking with no public-IP compute and an egress allowlist, ' +
            'PrivateLink to the lakehouse, a regional Unity Catalog metastore, ' +
            'and identity federation. State the platform-readiness gate that ' +
            'must be green before PHI and clinical documentation land. Do not ' +
            'present an architecture with no landing zone (cross-cutting ' +
            'pattern cc_cloud_landing_zone_private_data_plane).',
        },
        {
          heading: 'Ingestion & data-integration framework (own-it)',
          guidance:
            'Specify the metadata-driven ingestion framework that onboards ' +
            'Epic Clarity/Caboodle, clinical-documentation, CDI, coding, and ' +
            'EHR-telemetry feeds by configuration rather than per-pipeline ' +
            'code — name the own-it choice (e.g. DLT-META / the Databricks ' +
            'four-config framework, Lakeflow Connect landing in the client’s ' +
            'own Unity Catalog) and reject reinventing a bespoke framework or ' +
            'renting an outsourced destination platform that holds the ' +
            'documentation data on the vendor side (cross-cutting pattern ' +
            'cc_metadata_driven_ingestion_framework).',
        },
        {
          heading: 'EHR integration and the note write-back path',
          guidance:
            'Specify the EHR integration for ambient note write-back, the ' +
            'CDI and coding integration, the telemetry feeds, and the ' +
            'identity and encounter-context resolution each depends on — as ' +
            'an own-it, lakehouse-native integration where the documentation ' +
            'data products, models, and IP stay in the client’s estate, not a ' +
            'rented documentation or coding platform that holds the data and ' +
            'models on the vendor side.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'review-and-attestation path. No archetype ships without a named ' +
            'clinician owner; ambient documentation always closes on human ' +
            'attestation.',
        },
        {
          heading: 'Documentation governance and template consolidation',
          guidance:
            'Define the clinical documentation governance body, how template ' +
            'consolidation is sequenced, and how documentation standards are ' +
            'versioned and changed as a managed workflow change.',
        },
        {
          heading: 'Clinician-safety and responsible-AI controls',
          guidance:
            'State the draft-accuracy monitoring, edit-rate telemetry, ' +
            'over-trust detection, and PHI handling. Require that any coding, ' +
            'CDI, or clinical model is validated on the organisation’s own ' +
            'labelled data and reports tenant discrimination and calibration ' +
            '— never a marketed accuracy figure — with continuous drift ' +
            'monitoring and a recalibration path the organisation controls ' +
            '(the Epic Sepsis Model lesson: a black-box model you cannot ' +
            'inspect or recalibrate is a liability, not an asset). Make the ' +
            'governance spine explicit: Unity Catalog access/lineage controls, ' +
            'a HITRUST CSF control mapping over the cloud + lakehouse ' +
            'services, and HIPAA via the compliance security profile + BAA ' +
            'with both the cloud provider and the lakehouse vendor, with PHI ' +
            'processed in the client’s own account (cross-cutting pattern ' +
            'cc_unity_catalog_hitrust_governance). Name the regulatory frames ' +
            '(HIPAA, 42 CFR Part 2, E/M guidelines, RADV, information ' +
            'blocking) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'EHR, CDI, and coding systems, and the phased, specialty-led ' +
            'rollout.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Clinical-Documentation Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the clinical-documentation AI ' +
        'capability so clinicians actually adopt it and value is realised, ' +
        'not just deployed.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — EHR and ambient integration and ' +
            'validation, a lead-specialty pilot, clinician onboarding, scale ' +
            '— with milestones tied to the documentation operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — EHR and ' +
            'ambient integration, CDI integration, documentation governance, ' +
            'clinician adoption, clinician-safety monitoring, Tower ' +
            'measurement.',
        },
        {
          heading: 'Clinician adoption and change approach',
          guidance:
            'Define the change runway for clinicians — training on the ' +
            'ambient tool and the review-and-attest discipline, the ' +
            'specialty-led rollout, and the explicit decision on whether ' +
            'recovered time is taken as relieved burden or added volume. ' +
            'State how adoption is measured, not assumed.',
        },
        {
          heading: 'Clinician-safety hypercare',
          guidance:
            'Define the hypercare window with elevated informatics support, ' +
            'a draft-accuracy and edit-rate review cadence, and the over-' +
            'trust watch — with the exit criteria for leaving hypercare.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence — ' +
            'flagging any metric whose dollar conversion stays unwired ' +
            'pending an attested coefficient.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — low clinician adoption, ambient draft ' +
            'accuracy, CDI integration delay, unattested coefficients, ' +
            'multi-vendor fragmentation — with the escalation owner and the ' +
            'trigger for each.',
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
      claim: 'The clinician documentation burden — after-hours time and ' +
        'note turnaround',
      authoritativeSource:
        'EHR usage-telemetry / signal data (e.g. Epic Signal), decomposed by ' +
        'specialty and site.',
      whatGoodEvidenceLooksLike:
        'A multi-month telemetry trace of after-hours documentation minutes ' +
        'and note sign-to-close time, broken down by specialty and site, ' +
        'with the measurement window stated.',
      weakEvidenceToReject:
        'A single clinician-reported estimate, a vendor benchmark with no ' +
        'tenant telemetry, or an organisation-wide average that hides the ' +
        'specialty variation.',
    },
    {
      claim: 'That the CDI operation is starved by an integration gap rather ' +
        'than under-resourced',
      authoritativeSource:
        'CDI workflow platform query-volume and resolution data compared to ' +
        'the query volume expected for the scale and case mix.',
      whatGoodEvidenceLooksLike:
        'Actual CDI query volume and resolver utilisation set against a ' +
        'pattern-based expectation for the organisation, showing the gap is ' +
        'in routing into the queue, not in resolver throughput.',
      weakEvidenceToReject:
        'A raw query count with no expected-volume comparison, or an ' +
        'assumption that low query volume means good documentation.',
    },
    {
      claim: 'The HCC and quality-measure capture lift attributable to ' +
        'better documentation',
      authoritativeSource:
        'HCC and quality-measure capture reconciled against documented ' +
        'clinical evidence in the EHR and the risk-adjustment / eCQM ' +
        'submission.',
      whatGoodEvidenceLooksLike:
        'A capture rate measured against clinically evident, documentation-' +
        'supported conditions and actions, with the documentation evidence ' +
        'trail intact for each.',
      weakEvidenceToReject:
        'A capture-lift claim with no documentation support, copy-forward ' +
        'coding, or a projection that assumes the full apparent gap is ' +
        'compliantly closeable.',
    },
    {
      claim: 'That AI-drafted documentation is clinically accurate and safely ' +
        'reviewed',
      authoritativeSource:
        'Draft-accuracy audits and clinician edit-rate telemetry against the ' +
        'attested final note.',
      whatGoodEvidenceLooksLike:
        'A periodic accuracy audit of ambient drafts against the attested ' +
        'note plus edit-rate telemetry that shows clinicians are genuinely ' +
        'reviewing, not rubber-stamping.',
      weakEvidenceToReject:
        'A vendor accuracy claim with no tenant audit, or fast sign-off with ' +
        'near-zero edit rates treated as a success signal rather than an ' +
        'over-trust warning.',
    },
    {
      claim: 'The forecast value of a clinical-documentation AI Move',
      authoritativeSource:
        'The value model — the recovered-time and documentation-integrity ' +
        'channels modelled separately and haircut by their dominant factors ' +
        '— with monetisation coefficients attested by Finance.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with the two value ' +
        'channels kept separate, each haircut applied explicitly, and the ' +
        'dollar conversion resting on a Finance-attested cost-per-clinician-' +
        'hour and RAF-to-revenue basis. Every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single blended savings number, a recovered-time dollar figure ' +
        'built on an unattested coefficient presented as a return, or a ' +
        'vendor ROI claim taken at face value.',
    },
    {
      claim:
        'That the documentation and coding models are OWNED and validated by ' +
        'the organisation, not rented as a black box',
      authoritativeSource:
        'The architecture decision record and the data-platform contract ' +
        'terms — where the documentation data products, the coding/CDI ' +
        'models, and the clinical models physically reside, plus the ' +
        'model-validation report showing tenant discrimination, calibration, ' +
        'and drift monitoring on the organisation’s own labelled data.',
      whatGoodEvidenceLooksLike:
        'The documentation data products and the coding/CDI models run in ' +
        'the organisation’s own governed lakehouse (its own cloud account, ' +
        'under Unity Catalog), are auditable and recalibratable, the IP is ' +
        'owned by the organisation, and any clinical model reports tenant ' +
        'AUC and calibration with a drift-monitoring and recalibration path ' +
        'the organisation controls. Managed connectors and licensed coding ' +
        'reference content are acceptable where the destination catalog is ' +
        'the organisation’s own.',
      weakEvidenceToReject:
        'A claim of having a documentation or coding platform whose models ' +
        'and data are held by the vendor and cannot be inspected, validated ' +
        'on the tenant population, or recalibrated, or a model accepted on a ' +
        'marketed accuracy figure with no tenant validation — that is rented ' +
        'black-box intelligence (the Epic Sepsis Model failure mode), not an ' +
        'owned asset.',
    },
  ],
};
