// Domain Function Pack — Healthcare provider · Payer / claims operations.
//
// Function key: `payer_claims_operations`.
//
// This pack covers the payer / claims-operations function — the back office
// that turns a submitted claim into an adjudicated, paid (or denied) claim,
// and the commercial interface between a payer and the provider network it
// pays. It spans claims intake and document classification, benefit and
// eligibility determination, auto-adjudication, payment integrity and
// fraud-waste-abuse review, prior-authorisation processing, provider-data
// management, and the appeals and grievances operation that handles the
// disputes the rest of the function produces.
//
// The function is read from inside the payer (or a payer-delegated entity — a
// TPA, an ASO administrator, a risk-bearing provider group that adjudicates
// its own delegated claims). The operating reality the pack encodes: a claims
// operation is judged on how much it can adjudicate correctly without a human
// touch, how accurately it pays, and how little rework, leakage, and provider
// abrasion it generates doing so. Every metric below is a labelled planning
// range; the AI archetypes are the recurring bets against exactly that
// reality — auto-adjudication, payment-integrity detection, prior-auth
// automation, claims-document intake, appeals triage, and provider-data
// management.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const payerClaimsOperationsPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'payer_claims_operations',
  functionLabel: 'Payer & claims operations',
  summary:
    'Payer / claims operations is the function that adjudicates a submitted ' +
    'claim into a paid or denied claim and runs the commercial interface ' +
    'between a payer and its provider network. It spans claims intake and ' +
    'document classification, eligibility and benefit determination, ' +
    'auto-adjudication, payment integrity and fraud-waste-abuse review, ' +
    'prior-authorisation processing, provider-data management, and the ' +
    'appeals and grievances operation that resolves the disputes everything ' +
    'upstream generates. Its economics are administrative cost per claim, ' +
    'payment accuracy, and the cost of every rework loop — and its softer ' +
    'currency is provider abrasion, because a claims operation that pays ' +
    'slowly or wrongly is also a network-relations problem. The function is ' +
    'judged on how much it adjudicates correctly without a human touch, how ' +
    'accurately it pays, and how little leakage and rework it generates ' +
    'doing so.',
  version: '1.1.0',
  lastReviewed: '2026-06-06',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'auto_adjudication_rate',
      name: 'Auto-adjudication rate',
      definition:
        'The share of received claims that are fully adjudicated to a final ' +
        'payment or denial decision by the claims-processing system with no ' +
        'manual examiner touch — straight-through processing.',
      unit: '% of received claims',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 75,
        high: 92,
        basis:
          'Auto-adjudication varies with claim type, benefit-plan ' +
          'complexity, provider-data quality, and edit-rule maintenance — ' +
          'professional claims auto-adjudicate well above institutional and ' +
          'COB claims. The band spans a manual operation to a highly ' +
          'automated one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The claims-processing / adjudication system, comparing claims ' +
        'finalised without a pend or manual touch against total claims ' +
        'received.',
      whyItMatters:
        'It is the single biggest driver of administrative cost per claim — ' +
        'every claim that pends to an examiner carries handling cost, delay, ' +
        'and a chance of error; the auto-adjudication rate is the leading ' +
        'indicator of how efficient the operation can be.',
    },
    {
      key: 'claims_cycle_time',
      name: 'Claims cycle time',
      definition:
        'The elapsed time from a claim being received to a final ' +
        'adjudication decision and payment disposition — the end-to-end ' +
        'speed of the claims operation.',
      unit: 'calendar days from receipt to final disposition',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 18,
        basis:
          'Cycle time depends on the auto-adjudication rate, the pend ' +
          'backlog, and how quickly pended claims are worked; clean ' +
          'electronic claims clear fast while pended and document-dependent ' +
          'claims pull the average up. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The claims-processing system, time-stamping receipt against final ' +
        'adjudication and payment.',
      whyItMatters:
        'Cycle time is what providers feel; it drives prompt-pay compliance, ' +
        'network satisfaction, and the interest exposure on late-paid ' +
        'claims, and it is the headline measure of operational throughput.',
    },
    {
      key: 'payment_accuracy_rate',
      name: 'Payment accuracy rate',
      definition:
        'The share of adjudicated claims paid at the correct amount to the ' +
        'correct provider under the correct benefit — measured against a ' +
        'post-payment audit of financial, coding, and procedural accuracy.',
      unit: '% of audited claims paid accurately',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 95,
        high: 99,
        basis:
          'Payment accuracy is audited on a financial and procedural basis; ' +
          'the band spans an operation with material leakage to a tightly ' +
          'controlled one. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'A statistically valid post-payment claims audit reconciled against ' +
        'the claims-processing system payment ledger.',
      whyItMatters:
        'Every inaccurate payment is either leakage (overpayment the payer ' +
        'must chase to recover) or an underpayment that becomes an appeal — ' +
        'payment accuracy is the truest measure of whether the operation is ' +
        'doing its core job.',
    },
    {
      key: 'claims_rework_rate',
      name: 'Claims rework / re-adjudication rate',
      definition:
        'The share of adjudicated claims that are subsequently adjusted, ' +
        'reopened, or re-adjudicated because the original decision was ' +
        'wrong or incomplete — claim rework after the first disposition.',
      unit: '% of adjudicated claims re-adjudicated',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 12,
        basis:
          'Rework rates depend on first-pass accuracy, edit-rule quality, ' +
          'and provider-data accuracy; the band spans a clean operation to ' +
          'a rework-heavy one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The claims-processing system adjustment and reopened-claim log, ' +
        'classified by adjustment reason.',
      whyItMatters:
        'Rework is pure avoidable cost — a claim handled twice — and a ' +
        'leading source of provider abrasion and cycle-time drag; the rework ' +
        'rate exposes how much first-pass quality the operation is missing.',
    },
    {
      key: 'prior_auth_processing_turnaround',
      name: 'Prior-authorisation processing turnaround',
      definition:
        'The elapsed time from a provider submitting a prior-authorisation ' +
        'request to the payer issuing an authorisation decision — measured ' +
        'separately for standard and expedited requests.',
      unit: 'hours from request to decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 12,
        high: 96,
        basis:
          'Turnaround depends on the share of requests that auto-approve ' +
          'against criteria versus those routed to clinical review, and on ' +
          'whether the request arrives electronically or by fax. The band ' +
          'spans a fast electronic operation to a slow manual-review one. A ' +
          'planning range; regulatory decision-time limits cap the upper ' +
          'end for many request types.',
        label: 'planning-range',
      },
      dataSource:
        'The utilisation-management / prior-authorisation system, ' +
        'time-stamping request receipt against the decision.',
      whyItMatters:
        'Prior-auth turnaround directly delays or denies care, is the ' +
        'single most cited source of provider and member friction with ' +
        'payers, and is increasingly governed by CMS interoperability and ' +
        'prior-authorisation decision-time rules.',
    },
    {
      key: 'appeals_grievances_rate',
      name: 'Appeals & grievances rate',
      definition:
        'The volume of member and provider appeals and grievances received ' +
        'per 1,000 adjudicated claims (or per 1,000 members) — the rate at ' +
        'which the operation generates formal disputes.',
      unit: 'appeals & grievances per 1,000 claims',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 15,
        basis:
          'Appeal and grievance rates depend on denial rates, payment ' +
          'accuracy, and how clearly decisions are communicated; the band ' +
          'spans a low-friction operation to a dispute-heavy one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The appeals and grievances tracking system reconciled against ' +
        'adjudicated-claim and membership volume.',
      whyItMatters:
        'Appeals and grievances are a downstream symptom of upstream ' +
        'failure — wrong denials, inaccurate payment, poor communication — ' +
        'and each one carries regulated handling cost and timeframes; a ' +
        'rising rate signals a quality problem earlier in the function.',
    },
    {
      key: 'provider_data_accuracy_rate',
      name: 'Provider-data accuracy rate',
      definition:
        'The share of provider-directory and contract records — name, ' +
        'specialty, location, network status, payment terms — verified ' +
        'accurate against an authoritative source within the measurement ' +
        'period.',
      unit: '% of provider records verified accurate',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 97,
        basis:
          'Provider-data accuracy depends on the cadence and rigour of ' +
          'directory verification; the band spans a stale directory to a ' +
          'continuously maintained one. A planning range; regulatory ' +
          'directory-accuracy rules push the expectation upward.',
        label: 'planning-range',
      },
      dataSource:
        'The provider-data-management system, sampled and verified against ' +
        'provider attestation and authoritative credentialing sources.',
      whyItMatters:
        'Inaccurate provider data is an upstream root cause that propagates ' +
        'everywhere — it misroutes claims, breaks auto-adjudication, ' +
        'misprices payment, and produces directory-accuracy regulatory ' +
        'exposure and member ghost-network complaints.',
    },
    {
      key: 'denial_overturn_rate',
      name: 'Claims-denial overturn rate',
      definition:
        'The share of denied claims that are appealed and subsequently ' +
        'overturned to a payment — the rate at which the operation’s own ' +
        'denial decisions are reversed on appeal.',
      unit: '% of appealed denials overturned',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 50,
        basis:
          'A high overturn rate signals that initial denials were wrong; ' +
          'the band spans an operation whose denials hold up to one whose ' +
          'denials are routinely reversed. A planning range — read from ' +
          'the payer’s own appeal outcomes.',
        label: 'planning-range',
      },
      dataSource:
        'The appeals tracking system, comparing appeal outcomes against the ' +
        'original denial decisions in the claims-processing system.',
      whyItMatters:
        'When the operation overturns its own denials at a high rate it is ' +
        'paying twice for the same claim, generating avoidable provider ' +
        'abrasion, and exposing a first-pass denial-quality problem — the ' +
        'overturn rate is the audit of denial accuracy.',
    },
    {
      key: 'first_pass_payment_rate',
      name: 'First-pass payment rate',
      definition:
        'The share of received claims paid correctly on the first pass with ' +
        'no pend, no manual rework, and no subsequent adjustment — the ' +
        'composite measure of a claim handled right the first time.',
      unit: '% of received claims',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 90,
        basis:
          'First-pass payment is a composite of auto-adjudication and ' +
          'payment accuracy; the band spans a high-touch operation to a ' +
          'low-touch one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The claims-processing system claim lifecycle, joining ' +
        'auto-adjudication, accuracy-audit, and adjustment data.',
      whyItMatters:
        'It is the single best summary of claims-operations quality — every ' +
        'point below the top of the range is a claim that pended, was ' +
        'reworked, or was paid wrong and adjusted, all of which cost money ' +
        'and provider goodwill.',
    },
    {
      key: 'administrative_cost_per_claim',
      name: 'Administrative cost per claim',
      definition:
        'The fully loaded operating cost of the claims function — examiner ' +
        'staffing, technology, document handling, and overhead — divided by ' +
        'the number of claims adjudicated.',
      unit: 'USD per adjudicated claim',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Cost per claim varies widely with the auto-adjudication rate, ' +
          'claim complexity, and document burden; the band spans a highly ' +
          'automated operation to a manual one. A planning range driven by ' +
          'the operation’s own claim mix.',
        label: 'planning-range',
      },
      dataSource:
        'Claims-operations financials reconciled against adjudicated-claim ' +
        'volume from the claims-processing system.',
      whyItMatters:
        'It is the efficiency ratio of the function; manual touches, pends, ' +
        'and rework are what drive it up, so it is the metric ' +
        'auto-adjudication and intake automation attack most directly.',
    },
    {
      key: 'pended_claims_inventory_age',
      name: 'Pended-claims inventory age',
      definition:
        'The average age of the standing inventory of claims pended for ' +
        'manual examiner review — claims received but not yet finally ' +
        'adjudicated.',
      unit: 'days of average pended-claim age',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 14,
        basis:
          'Pended-inventory age depends on pend volume and examiner ' +
          'capacity; the band spans an operation that works pends promptly ' +
          'to one with a growing backlog. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The claims-processing system pend work queue, measuring claim age ' +
        'in the pended state.',
      whyItMatters:
        'A growing pended inventory is the early-warning signal of a ' +
        'capacity or quality problem — it pulls cycle time up, threatens ' +
        'prompt-pay compliance, and is the most actionable leading ' +
        'indicator the operation has.',
    },
    {
      key: 'fwa_recovery_yield',
      name: 'Payment-integrity recovery yield',
      definition:
        'The dollar value of overpayments and fraud-waste-abuse loss ' +
        'identified and recovered (or prevented pre-payment) as a share of ' +
        'total claims spend reviewed by the payment-integrity function.',
      unit: '% of reviewed claims spend recovered or prevented',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 1,
        high: 5,
        basis:
          'Recovery yield depends on detection-model precision, the ' +
          'pre-pay versus post-pay mix, and provider-abrasion tolerance; ' +
          'the band spans a modest programme to an aggressive one. A ' +
          'planning range — yield is not a quality target in itself.',
        label: 'planning-range',
      },
      dataSource:
        'The payment-integrity / special-investigations system, ' +
        'reconciling identified and recovered loss against reviewed claims ' +
        'spend.',
      whyItMatters:
        'Payment integrity is where avoidable financial loss is recovered, ' +
        'but yield must be read against provider abrasion and false-positive ' +
        'cost — chasing recoveries that were never genuine loss damages the ' +
        'network and rarely nets out.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'low_auto_adjudication',
      name: 'Low auto-adjudication and pend overload',
      description:
        'Too many claims pend to a manual examiner because benefit ' +
        'configuration is complex, edit rules are over-broad, or ' +
        'provider data is wrong — so the operation carries a large manual ' +
        'workforce, a growing pend backlog, and high cost per claim for ' +
        'work that should have processed straight through.',
      detectionSignal:
        'The auto-adjudication rate sits in the lower part of the band, the ' +
        'pended-claims inventory is large and ageing, and administrative ' +
        'cost per claim is high.',
      diagnosticQuestion:
        'What share of claims pend to a manual examiner, what are the top ' +
        'pend reasons, and how many of those pends are avoidable with ' +
        'better configuration or data?',
    },
    {
      key: 'first_pass_accuracy_gap',
      name: 'First-pass payment-accuracy gap',
      description:
        'Claims are adjudicated quickly but not always correctly — ' +
        'mispriced against the contract, paid under the wrong benefit, or ' +
        'missing coordination of benefits — so the operation generates a ' +
        'stream of overpayments to recover and underpayments that become ' +
        'appeals.',
      detectionSignal:
        'A post-payment audit shows payment accuracy below the band, the ' +
        'rework / re-adjudication rate is elevated, and overpayment ' +
        'recoveries are material.',
      diagnosticQuestion:
        'When a claim is audited after payment, how often was it paid ' +
        'correctly the first time, and what are the dominant inaccuracy ' +
        'reasons?',
    },
    {
      key: 'prior_auth_friction',
      name: 'Prior-authorisation friction and turnaround drag',
      description:
        'Prior-authorisation requests arrive by fax and portal, sit in a ' +
        'manual clinical-review queue, and turn around slowly and ' +
        'variably — delaying care, generating provider and member ' +
        'complaints, and creating regulatory decision-timeframe exposure.',
      detectionSignal:
        'Prior-auth processing turnaround is long and variable, the share ' +
        'of requests auto-approved against criteria is low, and prior-auth ' +
        'drives a large share of provider complaints.',
      diagnosticQuestion:
        'How long does a prior-authorisation decision take, what share ' +
        'auto-approves against criteria, and how much of the volume could ' +
        'be decided without clinical review?',
    },
    {
      key: 'provider_data_decay',
      name: 'Provider-data decay and directory inaccuracy',
      description:
        'Provider-directory and contract records drift out of date — ' +
        'wrong locations, stale network status, missing specialties — ' +
        'because verification is periodic and manual, and the bad data ' +
        'then misroutes claims, breaks auto-adjudication, and produces ' +
        'directory-accuracy regulatory findings.',
      detectionSignal:
        'Provider-data accuracy is below the band, claims pend or deny on ' +
        'provider-record reasons, and member ghost-network or ' +
        'directory-error complaints recur.',
      diagnosticQuestion:
        'How current is the provider directory, how is it verified, and ' +
        'how many downstream claim and member problems trace to a stale ' +
        'provider record?',
    },
    {
      key: 'denial_quality_problem',
      name: 'Denial-quality problem and overturn churn',
      description:
        'Initial claim denials are issued on thin or wrong grounds and are ' +
        'then routinely overturned on appeal — so the operation pays for ' +
        'the same claim twice, generates avoidable provider abrasion, and ' +
        'consumes appeals capacity reversing its own decisions.',
      detectionSignal:
        'The claims-denial overturn rate is high, appeal volume is rising, ' +
        'and a large share of overturns trace to a small set of ' +
        'denial-reason codes.',
      diagnosticQuestion:
        'What share of denied claims are overturned on appeal, and which ' +
        'denial reasons are being reversed most often — are those denials ' +
        'being issued correctly in the first place?',
    },
    {
      key: 'document_intake_bottleneck',
      name: 'Unstructured-document intake bottleneck',
      description:
        'A large share of claims and supporting material — paper claims, ' +
        'faxed attachments, itemised bills, medical records for review — ' +
        'arrives unstructured and is keyed or classified by hand, creating ' +
        'a slow, error-prone front door that caps the auto-adjudication ' +
        'rate before adjudication even begins.',
      detectionSignal:
        'A material share of claims enter as paper or fax, document ' +
        'handling carries its own staffing line, and keying errors surface ' +
        'as downstream pends and adjustments.',
      diagnosticQuestion:
        'What share of claims and attachments arrive unstructured, how are ' +
        'they captured and classified, and how much pend and rework traces ' +
        'to an intake error?',
    },
    {
      key: 'appeals_backlog',
      name: 'Appeals and grievances backlog and timeframe risk',
      description:
        'Appeals and grievances are worked first-in-first-out with no ' +
        'triage by urgency, regulatory deadline, or recoverability — so ' +
        'regulated-timeframe cases risk breaching their decision deadline ' +
        'while the backlog grows.',
      detectionSignal:
        'The appeals and grievances inventory ages, regulated-timeframe ' +
        'compliance is at risk or has breached, and casework is not ' +
        'prioritised by deadline.',
      diagnosticQuestion:
        'How is the appeals and grievances queue prioritised, and how ' +
        'often does a regulated-timeframe case approach or breach its ' +
        'decision deadline?',
    },
    {
      key: 'fwa_blunt_instrument',
      name: 'Payment integrity as a blunt instrument',
      description:
        'Fraud-waste-abuse detection runs on broad rules that flag large ' +
        'volumes of legitimate claims, so genuine loss is buried in false ' +
        'positives, recovery effort is spread thin, and aggressive ' +
        'post-pay recovery damages the provider relationship.',
      detectionSignal:
        'Payment-integrity flag volume is high but recovery yield is low, ' +
        'false-positive rates are material, and provider complaints about ' +
        'recovery actions recur.',
      diagnosticQuestion:
        'How precise is fraud-waste-abuse detection — how much flagged ' +
        'volume is genuine loss versus false positive — and what is the ' +
        'provider-abrasion cost of the recovery approach?',
    },
    {
      key: 'rented_fragmented_point_solutions',
      name: 'Rented fragmented point-solution intelligence',
      description:
        'Each capability of the operation runs on a separate point-solution ' +
        'SaaS — one vendor for Stars, another for risk adjustment, another ' +
        'for prior auth, another for payment integrity — and every vendor ' +
        'ingests the plan’s data to its own cloud, scores on its own logic, ' +
        'and returns dashboards. No vendor sees the whole picture, none can ' +
        'unify the plan-side claims and enrollment data with the ' +
        'provider-side EHR and encounter data the organisation already ' +
        'holds, and the models, features, and IP stay on the vendor side. ' +
        'For an integrated payer-provider this is the decisive trap: it ' +
        'forfeits the one structural advantage — a single source of truth ' +
        'across plan and provider — and leaves the organisation with vendor ' +
        'lock-in and no compounding data asset, renting back intelligence ' +
        'derived from its own data.',
      detectionSignal:
        'Stars, RA, prior auth, and payment integrity each sit on a ' +
        'different vendor platform; the plan cannot inspect or recalibrate ' +
        'the scoring logic; provider-side EHR data the organisation owns ' +
        'cannot be fused into the claims-side models; and exit from any ' +
        'vendor would mean rebuilding that capability from scratch.',
      diagnosticQuestion:
        'Does the organisation own a unified lakehouse that fuses its ' +
        'plan-side and provider-side data and runs its own ' +
        'claims-operations models — auditable, recalibratable, and ' +
        'extensible — or is each capability rented from a separate ' +
        'point-solution SaaS that holds the data and logic on the vendor ' +
        'side?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'claims_auto_adjudication',
      name: 'AI-assisted claims auto-adjudication',
      valueMechanism:
        'A model resolves the ambiguity that causes a claim to pend — ' +
        'interpreting benefit configuration, matching the claim to the ' +
        'right provider contract, resolving coordination-of-benefits and ' +
        'edit conflicts — so claims that would have routed to a manual ' +
        'examiner finalise straight through. Value comes from lifting the ' +
        'auto-adjudication rate, which compresses cycle time and cuts ' +
        'administrative cost per claim, while keeping payment accuracy ' +
        'intact.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The claims-processing system claim, benefit, and edit-rule data',
        'Provider contract terms and the provider-data-management directory',
        'Historical pended-claim resolutions to calibrate the model',
        'Eligibility and coordination-of-benefits data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model resolves a claim only inside a measured high-confidence ' +
          'band; everything below confidence still routes to an examiner, ' +
          'who owns complex and exception claims.',
        'Accuracy, not throughput, is the objective — a wrong straight-' +
          'through payment is leakage or an appeal; payment-accuracy audit ' +
          'must govern the confidence threshold.',
        'The model must be revalidated whenever benefit plans, contracts, ' +
          'or edit rules change, or it will adjudicate against stale logic.',
      ],
      metricsMoved: [
        'auto_adjudication_rate',
        'claims_cycle_time',
        'administrative_cost_per_claim',
        'first_pass_payment_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'payment_integrity_fwa',
      name: 'Payment integrity & fraud-waste-abuse detection',
      valueMechanism:
        'A model scores claims — pre-payment and post-payment — for ' +
        'overpayment, abusive billing, and fraud risk, learning the ' +
        'patterns of genuine loss rather than applying broad rules, and ' +
        'ranks cases by expected recoverable value net of false-positive ' +
        'cost. Value comes from catching real loss earlier and with far ' +
        'fewer legitimate claims caught in the net — improving recovery ' +
        'yield and payment accuracy without the provider abrasion of a ' +
        'blunt instrument.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical claims, payment, and recovery / investigation outcomes',
        'Provider billing patterns and peer-comparison data',
        'Coding, edit, and clinical-policy reference data',
        'The current claim under review',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags and ranks; a payment-integrity analyst or ' +
          'investigator reviews and owns every recovery and ' +
          'investigation action — the model does not deny or recover ' +
          'autonomously.',
        'A flag against a provider must be explainable and ' +
          'evidence-grounded; an unexplained accusation is both a ' +
          'network-relations and a legal risk.',
        'False positives carry real cost — provider abrasion and wasted ' +
          'effort — so the model is tuned on net recoverable value, not ' +
          'flag volume.',
      ],
      metricsMoved: [
        'fwa_recovery_yield',
        'payment_accuracy_rate',
        'claims_rework_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'prior_authorization_automation',
      name: 'Prior-authorisation automation',
      valueMechanism:
        'An agent intakes a prior-authorisation request, extracts the ' +
        'clinical evidence from the attached documentation, checks it ' +
        'against the medical-necessity and clinical criteria, and ' +
        'auto-approves the requests that clearly meet criteria — routing ' +
        'only the genuinely ambiguous cases to a clinical reviewer. Value ' +
        'comes from collapsing prior-auth turnaround, cutting the manual ' +
        'review burden, and reducing the provider and member friction ' +
        'that slow prior auth generates.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The utilisation-management system request and attached clinical ' +
          'documentation',
        'Medical-necessity and clinical-criteria policy reference',
        'Member eligibility and benefit data',
        'Historical prior-auth decisions to calibrate auto-approval ' +
          'confidence',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent may only auto-APPROVE against clear criteria; a denial ' +
          'or a limitation always requires a qualified clinical reviewer — ' +
          'an adverse coverage determination is never automated.',
        'The clinical evidence must come from the submitted documentation; ' +
          'the agent does not infer or embellish medical necessity.',
        'Auto-approval must respect regulated prior-authorisation ' +
          'decision-timeframe rules and CMS prior-authorisation ' +
          'interoperability requirements.',
      ],
      metricsMoved: [
        'prior_auth_processing_turnaround',
        'administrative_cost_per_claim',
        'appeals_grievances_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'claims_document_intake',
      name: 'Claims-document intake & classification',
      valueMechanism:
        'A model reads the unstructured front door of the operation — ' +
        'paper claims, faxed attachments, itemised bills, medical records ' +
        '— and classifies, extracts, and structures each document into the ' +
        'claims-processing system. Value comes from removing the manual ' +
        'keying and classification bottleneck, lifting the auto-' +
        'adjudication rate by feeding it clean structured data, and cutting ' +
        'the intake errors that surface downstream as pends and ' +
        'adjustments.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Inbound document images and fax streams',
        'Claim, attachment, and document-type reference taxonomies',
        'The claims-processing system intake and matching logic',
        'Historical labelled documents to calibrate classification',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Low-confidence extractions route to a document specialist for ' +
          'verification; the model does not commit an uncertain field into ' +
          'adjudication.',
        'Extraction accuracy is audited — a mis-keyed field becomes a ' +
          'downstream pend or a wrong payment, so accuracy is governed, not ' +
          'assumed.',
        'PHI in inbound documents must be handled under the same HIPAA ' +
          'controls as any other claims data through capture and storage.',
      ],
      metricsMoved: [
        'auto_adjudication_rate',
        'claims_cycle_time',
        'administrative_cost_per_claim',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'appeals_triage',
      name: 'Appeals & grievances triage and drafting',
      valueMechanism:
        'A model classifies each incoming appeal or grievance by type, ' +
        'urgency, regulated decision deadline, and likely outcome, ' +
        'prioritises the queue so deadline-critical cases are worked ' +
        'first, assembles the case file, and drafts the decision rationale ' +
        'for a reviewer. Value comes from protecting regulated-timeframe ' +
        'compliance, cutting the casework burden, and surfacing the ' +
        'denial-reason patterns that the appeals stream is exposing ' +
        'upstream.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The appeals and grievances tracking system case data',
        'The original claim, denial reason, and adjudication record',
        'Clinical-policy, benefit, and contract reference for the case',
        'Regulated appeal and grievance timeframe rules',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model triages and drafts; a qualified appeals reviewer — and, ' +
          'for a clinical appeal, a clinician — owns and signs every ' +
          'determination. An appeal outcome is never automated.',
        'The drafted rationale must be grounded in the case file and the ' +
          'governing policy; a reviewer verifies it before it is issued.',
        'Triage must reliably identify regulated-timeframe and expedited ' +
          'cases — a missed deadline is a compliance breach, so urgency ' +
          'classification is audited.',
      ],
      metricsMoved: [
        'appeals_grievances_rate',
        'denial_overturn_rate',
        'claims_rework_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'provider_data_management',
      name: 'AI provider-data management',
      valueMechanism:
        'An agent continuously reconciles provider-directory and contract ' +
        'records against authoritative sources — credentialing data, ' +
        'provider attestations, claims-derived signals — detecting and ' +
        'flagging drift before it propagates. Value comes from raising ' +
        'provider-data accuracy, which removes an upstream root cause that ' +
        'misroutes claims, breaks auto-adjudication, and produces ' +
        'directory-accuracy regulatory exposure.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The provider-data-management system directory and contract records',
        'Authoritative credentialing and licensure sources',
        'Provider attestation responses',
        'Claims-derived signals — billing locations, specialty patterns',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent detects and proposes a correction; a provider-data ' +
          'steward verifies and owns the directory change — a contract or ' +
          'network-status change is never made autonomously.',
        'A proposed correction must cite the authoritative source it is ' +
          'based on; conflicting sources are escalated, not silently ' +
          'resolved.',
        'Directory changes have regulatory and member-facing consequences, ' +
          'so the change log is auditable and the steward is accountable ' +
          'for it.',
      ],
      metricsMoved: [
        'provider_data_accuracy_rate',
        'auto_adjudication_rate',
        'claims_rework_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'confidence_tiered_adjudication',
      name: 'Confidence-tiered adjudication pattern',
      description:
        'A pattern that routes claims by model confidence — straight-' +
        'through auto-adjudication for high-confidence claims, ' +
        'examiner-assisted adjudication for ambiguous ones, and full ' +
        'manual review for the complex tail. Confidence thresholds are set ' +
        'against a payment-accuracy audit and tuned, and an examiner audits ' +
        'a sample of the straight-through tier.',
      boundary:
        'It adjudicates within a measured confidence band and assists ' +
        'outside it; a claims examiner owns complex claims, exceptions, and ' +
        'audit. It does not deny a claim autonomously on a clinical ' +
        'judgement.',
      humanAccountabilityPoint:
        'The claims-operations manager accountable for the ' +
        'auto-adjudication rate and payment accuracy.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'pre_pay_integrity_layer',
      name: 'Pre-payment integrity layer',
      description:
        'A pattern that scores claims for overpayment and fraud-waste-' +
        'abuse risk before the payment is released, so genuine loss is ' +
        'prevented rather than chased post-payment — shifting payment ' +
        'integrity from costly, abrasive recovery to cheaper, cleaner ' +
        'prevention, with a ranked review queue for flagged claims.',
      boundary:
        'It scores and holds a flagged claim for review; a payment-' +
        'integrity analyst reviews and owns the pay / deny / investigate ' +
        'decision. It does not deny or recover autonomously.',
      humanAccountabilityPoint:
        'The payment-integrity director accountable for recovery yield ' +
        'and the false-positive rate.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'criteria_based_auth_automation',
      name: 'Criteria-based prior-authorisation automation pattern',
      description:
        'A pattern that intakes a prior-authorisation request, extracts ' +
        'the clinical evidence, and auto-approves requests that clearly ' +
        'meet medical-necessity criteria — routing every ambiguous or ' +
        'adverse case to a clinical reviewer. The automation acts only on ' +
        'approvals; denials and limitations stay with a clinician.',
      boundary:
        'It auto-approves clear-criteria requests; a clinical reviewer ' +
        'owns every denial, limitation, and ambiguous case. It never ' +
        'issues an adverse coverage determination.',
      humanAccountabilityPoint:
        'The utilisation-management medical director accountable for ' +
        'prior-authorisation decisions and decision-timeframe compliance.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'intelligent_intake_front_door',
      name: 'Intelligent claims-intake front-door pattern',
      description:
        'A pattern that puts a document-intelligence layer at the front ' +
        'of the operation — classifying and structuring every inbound ' +
        'paper claim, fax, and attachment into the claims-processing ' +
        'system — so adjudication receives clean structured data and the ' +
        'manual keying bottleneck is removed.',
      boundary:
        'It captures, classifies, and structures inbound documents; a ' +
        'document specialist verifies low-confidence extractions. It does ' +
        'not adjudicate the claim it intakes.',
      humanAccountabilityPoint:
        'The claims-intake supervisor accountable for intake accuracy and ' +
        'throughput.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'deadline_aware_appeals_triage',
      name: 'Deadline-aware appeals-triage pattern',
      description:
        'A pattern that classifies every incoming appeal and grievance by ' +
        'type, urgency, and regulated decision deadline, prioritises the ' +
        'queue so deadline-critical and expedited cases are worked first, ' +
        'assembles the case file, and drafts the rationale — protecting ' +
        'regulated-timeframe compliance while cutting casework effort.',
      boundary:
        'It triages, assembles, and drafts; a qualified reviewer — a ' +
        'clinician for a clinical appeal — owns and signs the ' +
        'determination. It does not decide an appeal.',
      humanAccountabilityPoint:
        'The appeals and grievances manager accountable for ' +
        'regulated-timeframe compliance and decision quality.',
      controlPosture: 'human-approval-required',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Payer / claims-operations value is realised in four distinct ways ' +
      'and a forecast must keep them separate. First, lower administrative ' +
      'cost: lifting the auto-adjudication rate and automating intake and ' +
      'prior-auth review removes manual touches, pends, and rework, which ' +
      'lands directly in administrative cost per claim. Second, recovered ' +
      'and protected payment: better payment integrity and higher payment ' +
      'accuracy capture overpayment loss and prevent leakage. Third, faster ' +
      'cycle time: a higher straight-through rate and a smaller pend ' +
      'inventory compress cycle time, improving prompt-pay compliance and ' +
      'cutting interest exposure. Fourth, lower provider abrasion: faster, ' +
      'more accurate adjudication and fewer wrong denials reduce appeals, ' +
      'rework, and network friction — a real but harder-to-monetise gain. ' +
      'The dominant constraint is that the cost and cycle-time gains only ' +
      'land if the manual workforce is genuinely redeployed as ' +
      'auto-adjudication rises; a tool that runs alongside the old process ' +
      'realises a fraction of the modelled saving. Administrative-cost and ' +
      'integrity gains are recurring; the cycle-time improvement is partly ' +
      'a one-time step change.',
    dominantHaircutFactors: [
      {
        factor: 'Benefit-plan and contract complexity',
        rationale:
          'The auto-adjudication ceiling is set by how cleanly benefit ' +
          'plans and provider contracts can be configured and interpreted. ' +
          'A book of business with many bespoke plans and non-standard ' +
          'contracts caps how much of the modelled auto-adjudication gain ' +
          'is reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from benefit and contract complexity that ' +
            'limits straight-through processing; a planning range driven ' +
            'by the specific book of business.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Workforce redeployment and operating-model change',
        rationale:
          'The administrative-cost gain only lands if examiner capacity ' +
          'freed by higher auto-adjudication is genuinely redeployed or ' +
          'reduced rather than left running the old process alongside the ' +
          'automation. Partial operating-model change realises only part ' +
          'of the modelled saving.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from partial workforce redeployment and ' +
            'incomplete operating-model change; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Provider-data and source-system readiness',
        rationale:
          'Auto-adjudication, payment integrity, and provider-data ' +
          'management all depend on clean directory, contract, and claims ' +
          'data. A stale provider directory and fragmented source systems ' +
          'cap how much of the modelled value the models can deliver.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from inaccurate provider data and ' +
            'fragmented source systems; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Regulatory and provider-abrasion ceiling',
        rationale:
          'Prior-auth automation cannot automate adverse determinations, ' +
          'payment-integrity recovery must stay within abrasion tolerance, ' +
          'and appeals must respect regulated timeframes. These ceilings ' +
          'bound how aggressively the modelled gain can be pursued without ' +
          'regulatory or network-relations cost that dwarfs it.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled gain that is not reachable within ' +
            'the regulatory and provider-abrasion ceiling; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Administrative-cost-per-claim reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in administrative cost per claim from a ' +
            'higher auto-adjudication rate and automated intake and ' +
            'prior-auth review; a planning range spanning early and ' +
            'mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in administrative cost per ' +
          'adjudicated claim.',
      },
      {
        lever: 'Auto-adjudication-rate uplift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Percentage-point uplift in the auto-adjudication rate from ' +
            'AI-assisted adjudication and clean structured intake; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the auto-adjudication rate.',
      },
      {
        lever: 'Prior-authorisation turnaround compression',
        range: {
          low: 30,
          high: 70,
          basis:
            'Relative reduction in prior-authorisation processing ' +
            'turnaround from criteria-based auto-approval; a planning ' +
            'range — the gain concentrates in the clear-criteria share of ' +
            'requests.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in prior-authorisation processing ' +
          'turnaround.',
      },
      {
        lever: 'Payment-integrity recovery and accuracy gain',
        range: {
          low: 0.5,
          high: 3,
          basis:
            'Percentage-point uplift in payment accuracy plus recovered ' +
            'overpayment loss as a share of reviewed spend; a planning ' +
            'range read net of false-positive cost.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in payment accuracy plus recovery ' +
          'yield on reviewed claims spend.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal ' +
      '(auto-adjudication rate, intake throughput, prior-auth turnaround); ' +
      '9–18 months to a settled financial result, because the ' +
      'administrative-cost gain depends on workforce redeployment and the ' +
      'payment-accuracy and integrity gains only show fully once a full ' +
      'claim cohort cycles through audit and recovery run-out.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Claims-processing / adjudication system',
        role:
          'The core system of record for the function — receives claims, ' +
          'applies benefit, edit, and pricing logic, and produces the ' +
          'adjudication decision and payment disposition.',
        examples: [
          'Health Edge HealthRules Payer',
          'TriZetto QNXT / Facets',
          'Cognizant claims platforms',
        ],
      },
      {
        name: 'Utilisation-management / prior-authorisation system',
        role:
          'Receives and tracks prior-authorisation requests, applies ' +
          'medical-necessity criteria, and records the authorisation ' +
          'decision that adjudication later checks against.',
        examples: [
          'MCG and InterQual criteria platforms',
          'Cohere Health prior-authorisation',
          'integrated UM modules of the core claims platform',
        ],
      },
      {
        name: 'Provider-data-management system',
        role:
          'The system of record for the provider directory and contract ' +
          'data — network status, locations, specialties, and payment ' +
          'terms — that adjudication and claim routing depend on.',
        examples: [
          'Provider-data-management and credentialing platforms',
          'CAQH provider-data sources',
          'directory modules of the core claims platform',
        ],
      },
      {
        name: 'Payment-integrity / special-investigations system',
        role:
          'Scores and works claims for overpayment and fraud-waste-abuse ' +
          'risk, pre-payment and post-payment, and tracks recovery and ' +
          'investigation outcomes.',
        examples: [
          'Optum payment-integrity solutions',
          'Cotiviti payment-accuracy platforms',
          'SAS fraud and integrity analytics',
        ],
      },
      {
        name: 'Appeals & grievances tracking system',
        role:
          'Logs and works member and provider appeals and grievances, ' +
          'tracks regulated decision timeframes, and records the ' +
          'determination and its rationale.',
        examples: [
          'Dedicated appeals and grievances case-management platforms',
          'appeals modules of the core claims platform',
          'workflow / case-management systems configured for A&G',
        ],
      },
    ],
    roles: [
      {
        title: 'VP / Director of Claims Operations',
        accountability:
          'Owns the operational and financial performance of the claims ' +
          'function — the auto-adjudication rate, cycle time, payment ' +
          'accuracy, and administrative cost per claim.',
      },
      {
        title: 'Claims examiner / processor',
        accountability:
          'Adjudicates the claims that pend out of straight-through ' +
          'processing — interpreting benefits, contracts, and edits — and ' +
          'owns the manual adjudication decision.',
      },
      {
        title: 'Payment-integrity director',
        accountability:
          'Owns the payment-integrity and fraud-waste-abuse programme — ' +
          'recovery yield, the false-positive rate, and the ' +
          'provider-abrasion posture of recovery.',
      },
      {
        title: 'Utilisation-management medical director',
        accountability:
          'Owns prior-authorisation and medical-necessity determinations ' +
          'and the clinical integrity of the utilisation-management ' +
          'operation.',
      },
      {
        title: 'Provider-data steward',
        accountability:
          'Owns the accuracy and currency of the provider directory and ' +
          'contract data and the verification process behind it.',
      },
      {
        title: 'Appeals & grievances manager',
        accountability:
          'Owns the appeals and grievances operation — ' +
          'regulated-timeframe compliance, decision quality, and the ' +
          'casework queue.',
      },
      {
        title: 'Provider-network / network-relations manager',
        accountability:
          'Owns the commercial relationship with the provider network and ' +
          'absorbs the abrasion that slow or inaccurate claims processing ' +
          'creates.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA and the X12 EDI transaction standards',
        relevance:
          'Mandate the standard electronic transactions the function runs ' +
          'on — claims (837), claim status (276/277), remittance (835), ' +
          'eligibility (270/271) — and govern PHI handling across claims ' +
          'and document intake.',
      },
      {
        name: 'State prompt-pay laws',
        relevance:
          'Set the deadlines by which a clean claim must be paid and the ' +
          'interest owed on a late-paid claim — a direct constraint on ' +
          'cycle time and pended-claims inventory.',
      },
      {
        name: 'CMS prior-authorisation and interoperability rules',
        relevance:
          'Set decision-timeframe limits and electronic prior-' +
          'authorisation requirements for affected lines of business — ' +
          'the frame any prior-authorisation automation must operate ' +
          'within.',
      },
      {
        name: 'Provider-directory accuracy requirements (No Surprises Act ' +
          'and state rules)',
        relevance:
          'Require payers to maintain and verify accurate provider ' +
          'directories and carry liability for directory errors — the ' +
          'regulatory weight behind provider-data accuracy.',
      },
      {
        name: 'Appeals and grievances regulation (ERISA, CMS Medicare ' +
          'Advantage and Medicaid managed-care, and state rules)',
        relevance:
          'Govern how appeals and grievances must be handled and the ' +
          'decision timeframes that apply by line of business — the frame ' +
          'any appeals-triage use case must respect.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Auto-adjudication / straight-through processing',
        definition:
          'A claim adjudicated to a final payment or denial decision by ' +
          'the claims system with no manual examiner touch.',
      },
      {
        term: 'Pend',
        definition:
          'A claim that the system cannot finalise automatically and ' +
          'holds in a work queue for a manual examiner to resolve.',
      },
      {
        term: 'Coordination of benefits (COB)',
        definition:
          'The rules that determine the order in which multiple payers ' +
          'are responsible for a claim when a member has more than one ' +
          'coverage.',
      },
      {
        term: 'Payment integrity',
        definition:
          'The function of ensuring claims are paid correctly — detecting ' +
          'and preventing overpayment, abusive billing, and ' +
          'fraud-waste-abuse, pre-payment and post-payment.',
      },
      {
        term: 'Prior authorisation',
        definition:
          'A payer requirement that a service be approved as medically ' +
          'necessary before it is delivered or the claim will be denied.',
      },
      {
        term: 'Clean claim',
        definition:
          'A claim with all required data, valid and complete, that can ' +
          'be adjudicated without a request for additional information.',
      },
      {
        term: 'Appeal versus grievance',
        definition:
          'An appeal disputes a coverage or payment decision; a grievance ' +
          'is a complaint about service or quality — each carries its own ' +
          'regulated handling process.',
      },
      {
        term: 'Provider directory',
        definition:
          'The maintained record of the providers in a payer’s network — ' +
          'identity, specialty, location, and network status — that ' +
          'members and claim routing rely on.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Payer / Claims-Operations Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the claims operation is carrying avoidable cost, ' +
        'paying inaccurately, or generating provider abrasion — and locate ' +
        'the root cause — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Operation and book-of-business context',
          guidance:
            'Name the claims operation in scope — lines of business, claim ' +
            'volume and mix (professional, institutional, COB), whether ' +
            'adjudication is in-house or delegated — and state which ' +
            'claims-processing, utilisation-management, provider-data, ' +
            'payment-integrity, and appeals systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — auto-adjudication rate, claims cycle time, ' +
            'payment accuracy, rework rate, prior-auth turnaround, appeals ' +
            'and grievances rate, provider-data accuracy, denial overturn ' +
            'rate, first-pass payment rate, administrative cost per claim, ' +
            'pended-inventory age, recovery yield. For any metric not ' +
            'recorded, name it as a precise seed gap with its data source.',
        },
        {
          heading: 'Pend, rework, and denial-overturn analysis',
          guidance:
            'Break down pends by reason, rework by adjustment reason, and ' +
            'overturned denials by denial-reason code; locate where each ' +
            'avoidable touch and reversal originates, and separate ' +
            'genuine complexity from avoidable failure.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — low auto-adjudication, the ' +
            'first-pass accuracy gap, prior-auth friction, provider-data ' +
            'decay, the denial-quality problem, the document-intake ' +
            'bottleneck, the appeals backlog, payment integrity as a blunt ' +
            'instrument — and state which are present, with the detection ' +
            'signal and supporting evidence.',
        },
        {
          heading: 'Provider-abrasion read',
          guidance:
            'State, with evidence, how the operation’s performance is ' +
            'landing with the provider network — appeal volume, ' +
            'prior-auth and recovery complaints, prompt-pay exposure — so ' +
            'the network-relations cost of the status quo is explicit.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — lower administrative cost, recovered and ' +
            'protected payment, faster cycle time, lower abrasion — ' +
            'explicitly haircut by benefit complexity, workforce ' +
            'redeployment, data readiness, and the regulatory ceiling. ' +
            'Every figure a labelled planning range.',
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
      label: 'Payer / Claims-Operations Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, executive-readable case for funding a claims-' +
        'operations AI Move on this operation — baseline, forecast, cost, ' +
        'and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'administrative-cost reduction, recovered and protected ' +
            'payment, cycle-time improvement, and abrasion reduction, the ' +
            'time-to-value band, and the go / hold recommendation in one ' +
            'read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — auto-adjudication rate, payment accuracy, cost per ' +
            'claim, prior-auth turnaround. Where a baseline is a seed gap, ' +
            'say so and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — benefit and ' +
            'contract complexity, workforce redeployment, provider-data ' +
            'and source-system readiness, the regulatory and abrasion ' +
            'ceiling — explicitly and show the haircut math. Keep ' +
            'recurring cost and integrity gains separate from the ' +
            'one-time cycle-time step change.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the claims-processing, ' +
            'utilisation-management, provider-data, and intake systems, ' +
            'and the operating-model change — the redeployment of examiner ' +
            'capacity the automation frees.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under higher benefit complexity, ' +
            'weaker provider data, and partial workforce redeployment. ' +
            'State the downside the sponsor is underwriting.',
        },
        {
          heading: 'Regulatory and provider-relations posture',
          guidance:
            'State the prompt-pay, prior-authorisation decision-timeframe, ' +
            'directory-accuracy, and appeals-timeframe controls the Move ' +
            'must hold, and how provider abrasion will be monitored — ' +
            'the network-relations risk is named, not assumed away.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged payment-accuracy and recovery metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Payer / Claims-Operations Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'claims-operations AI capability, grounded in the function ' +
        'reference patterns and the regulatory frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — confidence-tiered adjudication, the pre-payment ' +
            'integrity layer, criteria-based prior-authorisation ' +
            'automation, the intelligent intake front door, deadline-aware ' +
            'appeals triage — and state which apply and how they connect ' +
            'across the function.',
        },
        {
          heading: 'Platform landing zone & private data plane',
          guidance:
            'Specify the cloud landing zone and private data plane the ' +
            'capability runs on — multi-account governance, private ' +
            'networking with no public-IP compute and an egress allowlist, ' +
            'PrivateLink to the lakehouse, a regional Unity Catalog metastore, ' +
            'and identity federation. State the platform-readiness gate that ' +
            'must be green before PHI and claims data land. Do not present ' +
            'an architecture with no landing zone (cross-cutting pattern ' +
            'cc_cloud_landing_zone_private_data_plane).',
        },
        {
          heading: 'Ingestion & data-integration framework (own-it)',
          guidance:
            'Specify the metadata-driven ingestion framework that onboards ' +
            'claims, enrollment, provider-data, utilisation-management, and ' +
            '— for an integrated payer-provider — Epic Clarity/Caboodle and ' +
            'encounter feeds by configuration rather than per-pipeline code, ' +
            'so plan-side and provider-side data are unified on one ' +
            'lakehouse. Name the own-it choice (e.g. DLT-META / the ' +
            'Databricks four-config framework, Lakeflow Connect landing in ' +
            'the client’s own Unity Catalog) and reject reinventing a ' +
            'bespoke framework or renting fragmented point-solution ' +
            'destination platforms that each hold a slice of the data on the ' +
            'vendor side (cross-cutting pattern ' +
            'cc_metadata_driven_ingestion_framework).',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the claims-processing, utilisation-management, ' +
            'provider-data, payment-integrity, and appeals integrations, ' +
            'the X12 transaction flows (837, 276/277, 835, 270/271), ' +
            'latency, and the benefit, contract, and clinical-criteria ' +
            'reference data the use cases depend on — built as an own-it, ' +
            'lakehouse-native unified layer where the models, features, and ' +
            'IP stay in the client’s estate, not stitched across rented ' +
            'point-solution platforms that each hold a slice of the data and ' +
            'logic on the vendor side.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define the confidence thresholds for ' +
            'auto-adjudication and prior-auth auto-approval and the audit ' +
            'sample, and confirm no adverse determination is automated.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how examiner, prior-auth review, payment-integrity, ' +
            'provider-data, and appeals workflows change, how staff are ' +
            'redeployed, and who owns each change.',
        },
        {
          heading: 'Regulatory and responsible-AI controls',
          guidance:
            'State the prompt-pay, prior-authorisation decision-timeframe, ' +
            'directory-accuracy, and appeals-timeframe controls, and the ' +
            'explainability requirement for any payment-integrity flag. Make ' +
            'the governance spine explicit: Unity Catalog access/lineage ' +
            'controls over the unified plan + provider data, a HITRUST CSF ' +
            'control mapping over the cloud + lakehouse services, and HIPAA ' +
            'via the compliance security profile + BAA with both the cloud ' +
            'provider and the lakehouse vendor, with PHI processed in the ' +
            'client’s own account (cross-cutting pattern ' +
            'cc_unity_catalog_hitrust_governance). Name the regulatory frames ' +
            '(HIPAA, CMS rules, state prompt-pay and directory law) that ' +
            'bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and ' +
            'the phased rollout across claim types, lines of business, and ' +
            'the function’s sub-operations.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Payer / Claims-Operations Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the claims-operations AI ' +
        'capability so value reaches administrative cost, payment ' +
        'accuracy, and provider relations — not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and transaction validation, ' +
            'a pilot claim type or line of business, examiner onboarding, ' +
            'scale across the function — with milestones tied to the ' +
            'operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, benefit and contract configuration, ' +
            'confidence-threshold tuning, workforce redeployment, ' +
            'prior-auth and appeals adoption, provider-relations ' +
            'monitoring, Tower measurement.',
        },
        {
          heading: 'Workforce redeployment and adoption approach',
          guidance:
            'Define the change runway for examiner, prior-auth, ' +
            'payment-integrity, and appeals staff — training, workflow ' +
            'change, and the redeployment of the capacity the automation ' +
            'frees — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged payment-accuracy and ' +
            'recovery metrics.',
        },
        {
          heading: 'Provider-relations and risk register',
          guidance:
            'Carry the live risks — benefit-configuration drift, ' +
            'integration fragility, regulatory-timeframe exposure, ' +
            'provider abrasion, partial adoption — with the escalation ' +
            'owner and the trigger for each.',
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
      claim: 'The auto-adjudication rate and the pend mix',
      authoritativeSource:
        'The claims-processing system, comparing claims finalised with no ' +
        'manual touch against total claims received, with pends classified ' +
        'by pend reason.',
      whatGoodEvidenceLooksLike:
        'An auto-adjudication rate by claim type, with the standing pend ' +
        'inventory broken down by pend reason so avoidable pends are ' +
        'separated from genuine complexity.',
      weakEvidenceToReject:
        'A single blended auto-adjudication figure with no pend-reason ' +
        'breakdown, or a rate that cannot distinguish a true straight-' +
        'through claim from one that was touched and reopened.',
    },
    {
      claim: 'Payment accuracy — whether claims are paid correctly',
      authoritativeSource:
        'A statistically valid post-payment claims audit reconciled ' +
        'against the claims-processing payment ledger, classified by ' +
        'inaccuracy reason.',
      whatGoodEvidenceLooksLike:
        'An independent audit sample showing the share of claims paid ' +
        'accurately, separating financial, coding, and procedural ' +
        'inaccuracy and separating overpayment from underpayment.',
      weakEvidenceToReject:
        'A self-reported accuracy figure with no independent audit, or a ' +
        'measure that conflates a processing error with a benefit-design ' +
        'outcome.',
    },
    {
      claim: 'Prior-authorisation turnaround and the auto-approval share',
      authoritativeSource:
        'The utilisation-management system, time-stamping request receipt ' +
        'against the decision, split by standard and expedited request and ' +
        'by auto-approved versus clinically reviewed.',
      whatGoodEvidenceLooksLike:
        'Turnaround measured by request type with the share auto-approved ' +
        'against criteria, so the automatable volume is visible and ' +
        'regulated-timeframe compliance can be checked.',
      weakEvidenceToReject:
        'A single average turnaround with no split by request type or ' +
        'auto-approval share, which hides both the slow tail and the ' +
        'automatable volume.',
    },
    {
      claim: 'Provider-data accuracy and its downstream impact',
      authoritativeSource:
        'A verified sample of the provider-data-management directory ' +
        'against authoritative credentialing and attestation sources, ' +
        'joined to claims that pended or denied on provider-record reasons.',
      whatGoodEvidenceLooksLike:
        'A measured directory-accuracy rate with the claim pends, ' +
        'denials, and member complaints that trace to a stale provider ' +
        'record quantified.',
      weakEvidenceToReject:
        'An assertion that the directory is "mostly accurate" with no ' +
        'verified sample, or an accuracy claim with no link to the ' +
        'downstream claim and member impact.',
    },
    {
      claim: 'The forecast value of a claims-operations AI Move',
      authoritativeSource:
        'The value model — administrative-cost, recovered-payment, ' +
        'cycle-time, and abrasion components, each haircut by its ' +
        'dominant factors — read against the specific book of business.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring cost and integrity gains ' +
        'separated from the one-time cycle-time step change, and every ' +
        'figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores benefit complexity, workforce ' +
        'redeployment, or the regulatory and abrasion ceiling.',
    },
    {
      claim:
        'That the claims-operations intelligence is OWNED on a unified ' +
        'lakehouse, not rented across fragmented point-solution platforms',
      authoritativeSource:
        'The architecture decision record and the data-platform contract ' +
        'terms — where the claims, enrollment, provider-data, and (for an ' +
        'integrated payer-provider) EHR data products and the operation’s ' +
        'models physically reside, and who can audit, recalibrate, extend, ' +
        'and move them.',
      whatGoodEvidenceLooksLike:
        'The unified claims-operations data layer and the adjudication, ' +
        'payment-integrity, prior-auth, and provider-data models run in the ' +
        'organisation’s own governed lakehouse (its own cloud account, under ' +
        'Unity Catalog), fuse plan-side and provider-side data into a single ' +
        'source of truth, are auditable and recalibratable, and the IP is ' +
        'owned by the organisation. Managed connectors and licensed criteria ' +
        'content (InterQual/MCG) are acceptable where the destination ' +
        'catalog is the organisation’s own and the executable logic stays ' +
        'own-it.',
      weakEvidenceToReject:
        'A claim of capability where Stars, RA, prior auth, and payment ' +
        'integrity each run on a separate vendor platform that holds the ' +
        'data and scoring logic on its own cloud, cannot be inspected or ' +
        'recalibrated, and cannot fuse the provider-side data the ' +
        'organisation already owns — that is rented, fragmented ' +
        'intelligence, not an owned unified asset, and must not be presented ' +
        'as the organisation owning its claims-operations strategy.',
    },
  ],
};
