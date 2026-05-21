// Domain Function Pack — Healthcare provider · Revenue cycle.
//
// Function key: `revenue_cycle`.
//
// This pack covers healthcare revenue-cycle management: the end-to-end
// function that converts delivered care into collected cash. It spans the
// front end (eligibility and benefits verification, prior authorisation,
// point-of-service collection), the middle (charge capture, medical coding,
// clinical documentation integrity, claim production), and the back end
// (claim submission and status, denial management and appeals, payment
// posting, patient billing, and bad-debt write-off).
//
// The operating reality the pack encodes: revenue is not lost in one place,
// it leaks at every handoff — an unverified benefit, a missing prior auth, an
// undercoded chart, a clean-claim edit, a denial that is never worked. The AI
// archetypes are the recurring bets against exactly that reality — AI prior
// authorisation, denial prediction and prevention, autonomous and assisted
// coding and CDI, claims-status automation, patient propensity-to-pay, and
// eligibility and benefits verification.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const revenueCyclePack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'revenue_cycle',
  functionLabel: 'Revenue cycle',
  summary:
    'Revenue-cycle management is the function that converts delivered care ' +
    'into collected cash: verifying eligibility and benefits, securing prior ' +
    'authorisation, capturing charges, coding the encounter and maintaining ' +
    'clinical documentation integrity, producing and submitting clean ' +
    'claims, managing denials and appeals, posting payments, and collecting ' +
    'the patient balance. Its economics are net collections, the cost to ' +
    'collect, and the cash-flow cost of every day a dollar sits in accounts ' +
    'receivable. Revenue does not leak in one place — it leaks at every ' +
    'handoff, from an unverified benefit at the front desk to a denial that ' +
    'is never worked on the back end — so the function is judged on how ' +
    'little it leaks across the whole cycle, not on any single step.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'clean_claim_rate',
      name: 'Clean-claim rate',
      definition:
        'The share of claims that pass payer and clearinghouse edits and ' +
        'are accepted for adjudication on first submission without a ' +
        'rejection or a manual edit.',
      unit: '% of submitted claims',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 97,
        basis:
          'Clean-claim performance varies with front-end data quality, ' +
          'coding accuracy, and edit-rule maintenance; the band spans a ' +
          'leaky operation to a strong one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Clearinghouse acceptance reporting reconciled against the patient-' +
        'accounting / billing system claim log.',
      whyItMatters:
        'Every claim that is not clean is rework — a touch, a delay, and a ' +
        'risk of timely-filing loss; the clean-claim rate is the leading ' +
        'indicator of how much avoidable cost the back end will carry.',
    },
    {
      key: 'initial_denial_rate',
      name: 'Initial denial rate',
      definition:
        'The share of submitted claims (by count or by charge value) that ' +
        'receive an initial denial from the payer rather than being paid as ' +
        'submitted.',
      unit: '% of claims denied on first adjudication',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 15,
        basis:
          'Initial denial rates vary with payer mix, service mix, and ' +
          'front-end rigor; the band spans a controlled operation to a ' +
          'denial-prone one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Remittance (835) data reconciled against the patient-accounting ' +
        'system claim and denial log.',
      whyItMatters:
        'Denials are the largest single source of avoidable revenue loss; ' +
        'every denial costs rework to appeal and a share are never ' +
        'recovered at all.',
    },
    {
      key: 'days_in_ar',
      name: 'Days in accounts receivable',
      definition:
        'The average number of days outstanding revenue sits in accounts ' +
        'receivable before it is collected — net A/R divided by average ' +
        'daily net revenue.',
      unit: 'days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 35,
        high: 60,
        basis:
          'Days in A/R depends on payer mix, claim velocity, and denial ' +
          'rework load; the band spans a fast-cycling operation to a slow ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-accounting system A/R aging reconciled against net ' +
        'revenue.',
      whyItMatters:
        'Days in A/R is the headline cash-flow metric of the revenue cycle; ' +
        'every extra day is working capital tied up and a higher risk that ' +
        'the receivable ages into uncollectibility.',
    },
    {
      key: 'cost_to_collect',
      name: 'Cost to collect',
      definition:
        'The total cost of running the revenue-cycle operation — staffing, ' +
        'technology, clearinghouse and vendor fees — as a share of the cash ' +
        'collected.',
      unit: '% of net cash collected',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 5,
        basis:
          'Cost to collect varies with automation maturity, payer ' +
          'complexity, and outsourcing mix; the band spans an automated ' +
          'operation to a manual one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Revenue-cycle department financials reconciled against net cash ' +
        'collected.',
      whyItMatters:
        'It is the efficiency ratio of the function; rework — denials, ' +
        'unclean claims, manual status checks — is what drives cost to ' +
        'collect up, so it is the metric automation directly attacks.',
    },
    {
      key: 'net_collection_rate',
      name: 'Net collection rate',
      definition:
        'Cash actually collected as a share of the revenue collectible ' +
        'after contractual allowances — how much of what the organisation ' +
        'is genuinely owed it actually captures.',
      unit: '% of collectible (net of contractual) revenue',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 94,
        high: 99,
        basis:
          'Net collection rate isolates avoidable loss — denials, write-' +
          'offs, underpayments — from contractual allowances; the band ' +
          'spans a leaky operation to a tight one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-accounting system, comparing cash posted against ' +
        'expected reimbursement net of contractual adjustments.',
      whyItMatters:
        'It is the truest measure of revenue integrity: it strips out ' +
        'contractual allowances and shows what the operation is leaving on ' +
        'the table through avoidable loss.',
    },
    {
      key: 'first_pass_resolution_rate',
      name: 'First-pass resolution rate',
      definition:
        'The share of claims paid in full on first submission without any ' +
        'rework, denial, appeal, or resubmission.',
      unit: '% of claims resolved on first pass',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 75,
        high: 92,
        basis:
          'First-pass resolution is a composite of clean-claim and denial ' +
          'performance; the band spans a high-touch operation to a low-touch ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-accounting system claim lifecycle reconciled against ' +
        'remittance data.',
      whyItMatters:
        'It is the single best summary of revenue-cycle efficiency — every ' +
        'point below 100% is a claim that needed human rework before the ' +
        'organisation was paid.',
    },
    {
      key: 'prior_auth_turnaround',
      name: 'Prior-authorisation turnaround time',
      definition:
        'The elapsed time from identifying that a service needs prior ' +
        'authorisation to receiving an authorisation decision from the ' +
        'payer.',
      unit: 'days from request to decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 7,
        basis:
          'Prior-auth turnaround varies enormously by payer, service line, ' +
          'and channel — portal, fax, or phone; the band spans a fast ' +
          'electronic path to a slow manual one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The prior-authorisation tracking workflow time-stamped from ' +
        'request to decision.',
      whyItMatters:
        'Slow prior auth delays or cancels care, creates a leading cause of ' +
        'denials, and consumes heavy manual staff effort — it is one of the ' +
        'most universally cited revenue-cycle pain points.',
    },
    {
      key: 'pos_collection_rate',
      name: 'Point-of-service collection rate',
      definition:
        'The share of patient financial responsibility — copays, ' +
        'deductibles, coinsurance — collected at or before the point of ' +
        'service rather than billed after the fact.',
      unit: '% of patient responsibility collected at point of service',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 55,
        basis:
          'Point-of-service collection depends on estimation accuracy, ' +
          'front-desk workflow, and patient-payment options; the band spans ' +
          'a passive operation to an active one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Front-desk and patient-access collection reporting in the ' +
        'patient-accounting system.',
      whyItMatters:
        'A dollar collected at the point of service is collected at near-' +
        'zero cost; the same dollar billed after the visit is far more ' +
        'expensive to collect and far more likely to become bad debt.',
    },
    {
      key: 'bad_debt_writeoff_rate',
      name: 'Bad-debt and write-off rate',
      definition:
        'The share of net revenue written off as uncollectible — patient ' +
        'bad debt plus avoidable administrative write-offs such as timely-' +
        'filing and unworked-denial write-offs.',
      unit: '% of net revenue written off',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Write-off rates depend on payer and patient mix and on how ' +
          'aggressively the back end works denials before the timely-filing ' +
          'window closes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-accounting system write-off ledger by reason code.',
      whyItMatters:
        'Write-offs are revenue permanently lost; separating avoidable ' +
        'administrative write-offs from genuine patient bad debt shows how ' +
        'much of the loss the operation could have prevented.',
    },
    {
      key: 'charge_lag_days',
      name: 'Charge-lag days',
      definition:
        'The average number of days between a service being delivered and ' +
        'the charge being captured and posted, ready to be billed.',
      unit: 'days from service to charge posting',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 7,
        basis:
          'Charge lag depends on documentation completion and coding ' +
          'throughput; the band spans a fast charge-capture operation to a ' +
          'backlogged one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The patient-accounting system, comparing service dates against ' +
        'charge-posting dates.',
      whyItMatters:
        'Charge lag delays the entire downstream cycle, pushes out cash, ' +
        'and risks timely-filing loss before a claim is ever produced.',
    },
    {
      key: 'denial_overturn_rate',
      name: 'Denial-overturn rate',
      definition:
        'The share of appealed denials that are overturned and ultimately ' +
        'paid — the success rate of the appeals operation.',
      unit: '% of appealed denials overturned',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 70,
        basis:
          'Overturn rates depend on which denials are selected to appeal ' +
          'and the quality of the appeal package; the band spans a ' +
          'scattershot operation to a targeted one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The denial-management workflow tracking appeal outcomes against ' +
        'remittance data.',
      whyItMatters:
        'A high overturn rate proves the appeals effort is targeted at ' +
        'recoverable denials; a low rate signals effort spent appealing ' +
        'denials that were never going to be paid.',
    },
    {
      key: 'eligibility_verification_rate',
      name: 'Eligibility-verification rate',
      definition:
        'The share of scheduled and registered encounters with insurance ' +
        'eligibility and benefits verified before the date of service.',
      unit: '% of encounters verified pre-service',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 99,
        basis:
          'Pre-service verification depends on scheduling lead time and ' +
          'front-end workflow; same-day and walk-in volume caps the upper ' +
          'end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Patient-access verification reporting reconciled against the ' +
        'encounter schedule.',
      whyItMatters:
        'An unverified benefit at registration is the root cause of a large ' +
        'share of downstream eligibility and coverage denials; verification ' +
        'is the cheapest place to prevent them.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'front_end_data_leak',
      name: 'Front-end data leak',
      description:
        'Registration captures wrong or incomplete demographic and ' +
        'insurance data, or skips eligibility verification, and the error ' +
        'propagates the whole way down the cycle to surface as a denial ' +
        'weeks later — far from where it was created.',
      detectionSignal:
        'Eligibility, coverage, and registration-error denials are a large ' +
        'share of the denial mix; the eligibility-verification rate is low.',
      diagnosticQuestion:
        'What share of denials trace back to a front-end registration or ' +
        'eligibility error, and is eligibility verified before service?',
    },
    {
      key: 'prior_auth_friction',
      name: 'Prior-authorisation friction',
      description:
        'Prior authorisation is a slow, manual, payer-by-payer process — ' +
        'portals, faxes, and phone calls — that delays care, consumes heavy ' +
        'staff effort, and still produces no-authorisation denials when a ' +
        'service slips through unauthorised.',
      detectionSignal:
        'Prior-auth turnaround is long and variable; no-authorisation ' +
        'denials persist and prior-auth staffing is a large cost line.',
      diagnosticQuestion:
        'How much staff effort goes into prior authorisation, and how ' +
        'often does a service still proceed without the required auth?',
    },
    {
      key: 'denial_backlog',
      name: 'Unworked denial backlog',
      description:
        'Denials arrive faster than the back end can work them. Lower-' +
        'dollar denials in particular are never appealed and quietly age ' +
        'into administrative write-offs once the timely-filing window ' +
        'closes.',
      detectionSignal:
        'The aged-denial inventory grows; a tail of denials is written off ' +
        'unworked, and avoidable administrative write-offs are material.',
      diagnosticQuestion:
        'What is the standing denial inventory and its age, and what share ' +
        'of denials are written off without ever being worked?',
    },
    {
      key: 'coding_documentation_gap',
      name: 'Coding and documentation gap',
      description:
        'The clinical documentation does not fully support the acuity and ' +
        'services delivered, or coding is inconsistent — so encounters are ' +
        'under-coded (lost revenue) or mis-coded (denial and compliance ' +
        'risk).',
      detectionSignal:
        'Coding-related denials and downcoding adjustments are material; ' +
        'documentation queries to clinicians are frequent or are skipped ' +
        'under throughput pressure.',
      diagnosticQuestion:
        'Does clinical documentation reliably support the coded acuity, ' +
        'and how are coding gaps and queries handled under volume pressure?',
    },
    {
      key: 'scattershot_appeals',
      name: 'Scattershot denial appeals',
      description:
        'The appeals operation works denials in the order they arrive, ' +
        'with no triage by recoverability or dollar value, so effort is ' +
        'spread across denials that will never be overturned while ' +
        'recoverable ones age out.',
      detectionSignal:
        'The denial-overturn rate is low and appeal effort does not ' +
        'correlate with denial recoverability or value.',
      diagnosticQuestion:
        'Are denials triaged by recoverability and dollar value before ' +
        'they are worked, or worked first-in-first-out?',
    },
    {
      key: 'manual_status_chasing',
      name: 'Manual claim-status chasing',
      description:
        'Staff spend large amounts of time logging into payer portals and ' +
        'phoning payers to check claim status, instead of that effort going ' +
        'to denials and patient collections that actually need a human.',
      detectionSignal:
        'A large share of back-end staff time is spent on routine status ' +
        'checks; status-related touches per claim are high.',
      diagnosticQuestion:
        'How much back-end staff time is spent checking claim status ' +
        'manually, and how much of that could be automated?',
    },
    {
      key: 'patient_collection_breakdown',
      name: 'Patient-responsibility collection breakdown',
      description:
        'As patient cost-sharing has grown, more revenue depends on ' +
        'collecting from the patient — but estimates are inaccurate, ' +
        'point-of-service collection is passive, and statements go out with ' +
        'no propensity-to-pay tailoring, so patient balances age into bad ' +
        'debt.',
      detectionSignal:
        'Point-of-service collection is low, patient-responsibility A/R ' +
        'ages poorly, and patient bad debt is a rising share of write-offs.',
      diagnosticQuestion:
        'How accurately is patient responsibility estimated up front, and ' +
        'how is patient balance collected before it ages into bad debt?',
    },
    {
      key: 'timely_filing_loss',
      name: 'Timely-filing and avoidable write-off loss',
      description:
        'Claims and appeals miss payer filing deadlines because of charge ' +
        'lag, denial backlog, or rework delay, and the revenue is written ' +
        'off as uncollectible purely for being late — not for being ' +
        'invalid.',
      detectionSignal:
        'Timely-filing write-offs appear in the write-off ledger; charge ' +
        'lag and denial-rework cycle times run close to payer deadlines.',
      diagnosticQuestion:
        'How much revenue is written off purely for missing a filing ' +
        'deadline, and which step in the cycle consumes the filing window?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_prior_authorization',
      name: 'AI prior authorisation',
      valueMechanism:
        'An agent determines whether a service needs authorisation, ' +
        'assembles the clinical evidence the payer requires, submits the ' +
        'request through the payer’s channel, and tracks it to a decision. ' +
        'Value comes from collapsing prior-auth turnaround, cutting the ' +
        'manual staff effort it consumes, and preventing the no-' +
        'authorisation denials that occur when a service slips through ' +
        'unauthorised.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Payer-specific prior-authorisation rules and required clinical ' +
          'criteria',
        'The order, the scheduled service, and the encounter context',
        'EHR clinical documentation supporting medical necessity',
        'Payer portal or electronic prior-authorisation channel access',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent assembles and submits; a revenue-cycle specialist ' +
          'reviews exceptions and owns any clinically nuanced or denied ' +
          'request.',
        'The clinical evidence submitted must come from the documented ' +
          'record — the agent does not infer or embellish medical necessity.',
        'Payer rules change constantly; the rule base must be monitored and ' +
          'kept current or the agent will submit against stale criteria.',
      ],
      metricsMoved: [
        'prior_auth_turnaround',
        'initial_denial_rate',
        'cost_to_collect',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'denial_prediction_prevention',
      name: 'Denial prediction and prevention',
      valueMechanism:
        'A model scores claims before submission for denial risk and the ' +
        'likely reason, so high-risk claims are corrected up front rather ' +
        'than denied, reworked, and resubmitted. Value comes from moving ' +
        'denial handling from costly back-end rework to cheap pre-bill ' +
        'prevention — lifting the clean-claim rate and the first-pass ' +
        'resolution rate.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical claims and remittance (835) data with denial reasons',
        'The current claim — codes, charges, payer, service, and ' +
          'eligibility data',
        'Payer-specific edit and adjudication patterns',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags a denial risk and the likely cause; a biller ' +
          'reviews and corrects the claim — the model does not alter codes ' +
          'or charges on its own.',
        'Predictions must be explainable to the reason-code level so a ' +
          'biller can act on them and trust them.',
        'The model must be revalidated as payer behaviour and the payer ' +
          'mix shift — denial patterns drift.',
      ],
      metricsMoved: [
        'clean_claim_rate',
        'initial_denial_rate',
        'first_pass_resolution_rate',
        'days_in_ar',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'autonomous_assisted_coding_cdi',
      name: 'Autonomous and assisted coding and CDI',
      valueMechanism:
        'A model reads the clinical documentation and proposes the ' +
        'diagnosis and procedure codes — coding the most straightforward ' +
        'encounters end-to-end and assisting coders on the complex ones — ' +
        'and surfaces clinical-documentation-integrity queries where the ' +
        'record does not support the acuity delivered. Value comes from ' +
        'cutting charge lag, raising coding accuracy and completeness, and ' +
        'capturing the revenue lost to under-coding without tipping into ' +
        'compliance risk.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR clinical documentation — notes, problem list, orders, results',
        'Current code sets and payer coding and edit rules',
        'Historical coded encounters to calibrate the model',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'Autonomous coding is confined to encounters the model can code ' +
          'with high, measured confidence; everything else routes to a ' +
          'certified coder, and a coder owns audit and exception review.',
        'The objective is accuracy, not maximisation — upcoding is a hard ' +
          'compliance and False-Claims-Act risk; every code must be ' +
          'supported by documentation.',
        'CDI queries to clinicians must be evidence-based and non-leading, ' +
          'never pressure a particular diagnosis.',
      ],
      metricsMoved: [
        'charge_lag_days',
        'clean_claim_rate',
        'net_collection_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'claims_status_automation',
      name: 'Claims-status and follow-up automation',
      valueMechanism:
        'An agent checks claim status across payer portals and electronic ' +
        'channels, interprets the response, and routes only the claims that ' +
        'need a human — a denial, an underpayment, a stalled claim — into ' +
        'the right work queue. Value comes from eliminating the routine ' +
        'manual status-chasing that consumes back-end staff time and ' +
        'redirecting that capacity to denials and collections.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Open-claim inventory from the patient-accounting system',
        'Payer portal and electronic claim-status (276/277) access',
        'Work-queue routing rules by claim disposition',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent retrieves and triages status; a specialist works every ' +
          'claim that needs judgement — the agent does not appeal or adjust ' +
          'a claim itself.',
        'Status interpretation must be reliable — a misread status that ' +
          'closes a claim prematurely is lost revenue.',
        'Portal access and credentials must be governed and monitored ' +
          'against payer terms of use.',
      ],
      metricsMoved: [
        'days_in_ar',
        'cost_to_collect',
        'first_pass_resolution_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'patient_propensity_to_pay',
      name: 'Patient propensity-to-pay and collection intelligence',
      valueMechanism:
        'A model estimates each patient’s likelihood and capacity to pay ' +
        'and tailors the collection approach — point-of-service ask, ' +
        'payment-plan offer, statement cadence and channel, or charity-care ' +
        'and financial-assistance routing. Value comes from collecting more ' +
        'patient responsibility earlier and at lower cost, and from routing ' +
        'genuine hardship to assistance instead of into bad debt.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Patient balance, prior-payment history, and coverage data',
        'Estimated patient responsibility from a benefits estimate',
        'Financial-assistance and charity-care policy criteria',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model informs the collection approach; staff own patient ' +
          'conversations and any hardship or charity-care determination.',
        'Propensity scoring must not become a tool that pressures patients ' +
          'or steers genuine hardship away from financial assistance — ' +
          'equity and patient-protection rules apply.',
        'Patient-responsibility estimates must be transparent and accurate; ' +
          'an aggressive estimate erodes trust and creates downstream ' +
          'disputes.',
      ],
      metricsMoved: [
        'pos_collection_rate',
        'bad_debt_writeoff_rate',
        'days_in_ar',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'eligibility_benefits_verification',
      name: 'Automated eligibility and benefits verification',
      valueMechanism:
        'An agent verifies insurance eligibility and benefits ' +
        'electronically before the date of service, resolves coverage ' +
        'discrepancies, and produces an accurate patient-responsibility ' +
        'estimate. Value comes from catching coverage problems before the ' +
        'encounter — preventing the eligibility denials and inaccurate ' +
        'patient estimates that originate at the front end.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'The encounter schedule and registered patient and insurance data',
        'Payer eligibility (270/271) transaction access',
        'Plan benefit and patient cost-sharing data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent verifies and flags discrepancies; patient-access staff ' +
          'resolve ambiguous coverage and own the patient conversation.',
        'A wrong or stale benefit verification produces a wrong patient ' +
          'estimate — the verification must be current as of the service ' +
          'date.',
        'Coverage discovery for self-pay patients must respect patient-' +
          'consent and privacy rules.',
      ],
      metricsMoved: [
        'eligibility_verification_rate',
        'initial_denial_rate',
        'pos_collection_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'front_end_prevention_layer',
      name: 'Front-end prevention layer',
      description:
        'A pattern that moves eligibility verification, benefits ' +
        'estimation, and prior-authorisation determination to before the ' +
        'date of service, so coverage and authorisation problems are caught ' +
        'and resolved while the encounter can still be corrected — rather ' +
        'than surfacing as a denial weeks later.',
      boundary:
        'It verifies, estimates, and flags; patient-access staff resolve ' +
        'ambiguous coverage and own the patient conversation. It does not ' +
        'register patients or commit a clinical order.',
      humanAccountabilityPoint:
        'The patient-access director accountable for front-end data ' +
        'quality and pre-service clearance.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'pre_bill_claim_scrubbing',
      name: 'Pre-bill claim-scrubbing and risk-scoring pattern',
      description:
        'A pattern that scores every claim for denial risk before ' +
        'submission, applies edit rules, and routes high-risk claims to a ' +
        'biller for correction — turning denial handling into pre-bill ' +
        'prevention rather than post-adjudication rework.',
      boundary:
        'It scores and flags; a biller reviews and corrects the claim and ' +
        'authorises submission. It does not change codes or charges ' +
        'autonomously.',
      humanAccountabilityPoint:
        'The billing supervisor accountable for the clean-claim rate and ' +
        'pre-bill review.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'confidence_tiered_coding',
      name: 'Confidence-tiered coding and CDI pattern',
      description:
        'A pattern that routes encounters by model confidence — straight-' +
        'through autonomous coding for high-confidence routine encounters, ' +
        'coder-assisted coding for complex ones, and an evidence-based CDI ' +
        'query loop where documentation does not support the acuity. ' +
        'Confidence thresholds are measured and tuned, and a coder audits a ' +
        'sample of the autonomous tier.',
      boundary:
        'It codes within a measured confidence band and assists outside ' +
        'it; a certified coder owns complex coding, audit, and exceptions. ' +
        'It targets accuracy, never maximisation.',
      humanAccountabilityPoint:
        'The coding and CDI manager accountable for coding accuracy and ' +
        'compliance.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'denial_triage_and_appeal',
      name: 'Denial triage-and-appeal pattern',
      description:
        'A pattern that classifies each denial by reason, recoverability, ' +
        'and dollar value, prioritises the recoverable high-value denials, ' +
        'and assembles a draft appeal package — so appeal effort is ' +
        'concentrated where it overturns denials rather than spread first-' +
        'in-first-out.',
      boundary:
        'It triages and drafts; a denial specialist reviews the appeal and ' +
        'owns the submission and the payer relationship. It does not submit ' +
        'an appeal autonomously.',
      humanAccountabilityPoint:
        'The denial-management lead accountable for the overturn rate and ' +
        'the appeal operation.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'status_automation_and_routing',
      name: 'Automated status-and-routing pattern',
      description:
        'A pattern that automates routine payer claim-status checks across ' +
        'portals and electronic channels, interprets the response, and ' +
        'routes only claims needing judgement — denials, underpayments, ' +
        'stalled claims — into the correct human work queue, freeing staff ' +
        'from manual status-chasing.',
      boundary:
        'It checks status and routes work; a specialist works every claim ' +
        'that needs a decision. It does not appeal, adjust, or close a ' +
        'claim itself.',
      humanAccountabilityPoint:
        'The accounts-receivable manager accountable for the open-claim ' +
        'inventory and work-queue throughput.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Revenue-cycle value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, recovered revenue: fewer ' +
      'denials, fewer write-offs, and more complete coding capture revenue ' +
      'that was otherwise leaking — this lands in the net collection rate. ' +
      'Second, lower cost to collect: automating prior auth, status checks, ' +
      'and routine claim work removes manual touches and rework, lowering ' +
      'the cost ratio. Third, faster cash: a shorter cycle pulls cash ' +
      'forward and reduces days in A/R, a working-capital gain distinct ' +
      'from recovered revenue. The dominant constraint is that the provider ' +
      'controls only its own side of the cycle — payer behaviour, payer ' +
      'rules, and the payer mix cap how much of any modelled gain is ' +
      'reachable — so a forecast must be read against the specific payer ' +
      'mix, not a generic one. Recovered-revenue and cost gains are ' +
      'recurring once realised; the cash-acceleration gain is largely a ' +
      'one-time pull-forward.',
    dominantHaircutFactors: [
      {
        factor: 'Payer mix and payer behaviour',
        rationale:
          'Denial rates, prior-auth burden, electronic-channel ' +
          'availability, and adjudication behaviour vary enormously by ' +
          'payer. The provider does not control any of it, so the payer mix ' +
          'caps how much of a modelled denial or prior-auth gain is ' +
          'actually reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from payer behaviour outside the provider’s ' +
            'control; a planning range driven by the specific payer mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and source-system readiness',
        rationale:
          'Denial prediction, coding, and verification only work to the ' +
          'extent registration, clinical documentation, and claims data are ' +
          'complete and consistent. Poor front-end data and weak ' +
          'documentation cap how much of the modelled value can be ' +
          'delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from incomplete registration data and ' +
            'documentation gaps; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Workflow integration and staff adoption',
        rationale:
          'The cost-to-collect gain only lands if automation is embedded ' +
          'in the work queue and staff are redeployed to higher-value work ' +
          'rather than running the tool alongside the old process. Partial ' +
          'adoption realises a fraction of the modelled saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial workflow integration and staff ' +
            'redeployment; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Compliance and coding-accuracy ceiling',
        rationale:
          'Coding value is bounded by documented clinical truth. The ' +
          'objective is accurate capture, not maximisation — pushing coding ' +
          'past documentation is a False-Claims-Act and audit-recoupment ' +
          'risk that can dwarf the revenue gained, so the compliant ceiling ' +
          'haircuts the modelled coding upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled coding-capture gain that is not ' +
            'compliantly reachable; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Initial-denial-rate reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in the initial denial rate from front-end ' +
            'prevention and pre-bill scoring; a planning range spanning ' +
            'early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the initial denial rate.',
      },
      {
        lever: 'Cost-to-collect reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in cost to collect from automating prior ' +
            'auth, status checks, and routine claim work; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in cost to collect as a share of ' +
          'cash collected.',
      },
      {
        lever: 'Days-in-A/R compression',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in days in A/R from a faster, cleaner ' +
            'cycle; a planning range — largely a one-time cash pull-' +
            'forward.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in days in accounts receivable.',
      },
      {
        lever: 'Net-collection-rate uplift',
        range: {
          low: 1,
          high: 4,
          basis:
            'Percentage-point uplift in the net collection rate from ' +
            'fewer avoidable write-offs and more complete capture; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the net collection rate.',
      },
    ],
    timeToValueBand:
      '3–6 months to first measurable operational signal (clean-claim ' +
      'rate, prior-auth turnaround, status-touch reduction); 9–18 months ' +
      'to a settled financial result, because denial, write-off, and net-' +
      'collection improvements only show fully once a full claim cohort ' +
      'cycles through adjudication and run-out.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Patient-accounting / billing system',
        role:
          'The financial system of record for the revenue cycle — charges, ' +
          'claims, payments, adjustments, A/R, and write-offs. Usually a ' +
          'module of the EHR or a dedicated billing platform.',
        examples: ['Epic Resolute', 'Oracle Health Patient Accounting', 'athenaIDX'],
      },
      {
        name: 'Clearinghouse',
        role:
          'Routes claims to payers, applies payer edits, and returns ' +
          'acceptance, rejection, and remittance data — the gateway between ' +
          'the provider and the payers.',
        examples: ['Availity', 'Change Healthcare / Optum', 'Waystar'],
      },
      {
        name: 'Electronic health record (EHR)',
        role:
          'The clinical system of record; the source of the documentation ' +
          'that drives coding, charge capture, and medical-necessity ' +
          'evidence for prior authorisation.',
        examples: ['Epic', 'Oracle Health (Cerner)', 'MEDITECH'],
      },
      {
        name: 'Coding and CDI platform',
        role:
          'Supports medical coding and clinical-documentation-integrity ' +
          'review — code assignment, encoder logic, and documentation ' +
          'queries to clinicians.',
        examples: [
          'Epic / 3M coding tools',
          'Solventum (3M) 360 Encompass',
          'computer-assisted coding engines',
        ],
      },
      {
        name: 'Denial-management and contract-management system',
        role:
          'Tracks denials, appeals, and underpayments, and models expected ' +
          'reimbursement against payer contracts to detect variance.',
        examples: [
          'Waystar denial management',
          'FinThrive contract management',
          'patient-accounting denial work queues',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Financial Officer / VP Revenue Cycle',
        accountability:
          'Owns the financial performance of the revenue cycle — net ' +
          'collections, days in A/R, and cost to collect.',
      },
      {
        title: 'Patient-access director',
        accountability:
          'Owns the front end — scheduling, registration, eligibility ' +
          'verification, prior authorisation, and point-of-service ' +
          'collection.',
      },
      {
        title: 'Coding and CDI manager',
        accountability:
          'Owns coding accuracy and completeness, clinical-documentation ' +
          'integrity, and coding compliance.',
      },
      {
        title: 'Billing and claims supervisor',
        accountability:
          'Owns claim production, the clean-claim rate, claim submission, ' +
          'and pre-bill review.',
      },
      {
        title: 'Denial-management lead',
        accountability:
          'Owns denial triage, appeals, the overturn rate, and the payer-' +
          'denial relationship.',
      },
      {
        title: 'Patient financial services / collections manager',
        accountability:
          'Owns patient billing, patient collections, payment plans, and ' +
          'financial-assistance routing.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA and the X12 EDI transaction standards',
        relevance:
          'Mandate the standard electronic transactions the cycle runs on ' +
          '— eligibility (270/271), claims (837), claim status (276/277), ' +
          'and remittance (835) — and govern PHI handling throughout.',
      },
      {
        name: 'The False Claims Act and coding-compliance rules',
        relevance:
          'Make accurate coding — not maximised coding — the legal ' +
          'objective; upcoding and unsupported claims carry severe penalty ' +
          'and recoupment exposure, the hard ceiling on coding value.',
      },
      {
        name: 'CMS billing rules and Medicare / Medicaid conditions of ' +
          'participation',
        relevance:
          'Set the billing, medical-necessity, and documentation rules for ' +
          'government payers — a large share of provider revenue and the ' +
          'strictest compliance frame.',
      },
      {
        name: 'The No Surprises Act and price-transparency rules',
        relevance:
          'Govern good-faith estimates, patient cost-sharing protections, ' +
          'and price transparency — shaping how patient responsibility is ' +
          'estimated and communicated.',
      },
      {
        name: 'IRS 501(r) and financial-assistance / charity-care ' +
          'obligations',
        relevance:
          'Require non-profit hospitals to have financial-assistance ' +
          'policies and limits on collection actions — the frame any ' +
          'patient-collection or propensity-to-pay use case must respect.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Clean claim',
        definition:
          'A claim accepted for payer adjudication on first submission ' +
          'with no rejection, edit, or request for additional information.',
      },
      {
        term: 'Denial',
        definition:
          'A payer’s refusal to pay a claim, in full or in part, on first ' +
          'adjudication — distinct from a contractual adjustment.',
      },
      {
        term: 'Days in A/R',
        definition:
          'The average number of days revenue sits outstanding in accounts ' +
          'receivable before it is collected.',
      },
      {
        term: 'Contractual allowance / adjustment',
        definition:
          'The difference between billed charges and the contracted rate a ' +
          'payer has agreed to pay — an expected write-down, not avoidable ' +
          'loss.',
      },
      {
        term: 'Prior authorisation',
        definition:
          'A payer’s requirement that a service be approved as medically ' +
          'necessary before it is delivered, or the claim will be denied.',
      },
      {
        term: 'Clinical documentation integrity (CDI)',
        definition:
          'The discipline of ensuring clinical documentation accurately and ' +
          'completely reflects the patient’s acuity and the care delivered.',
      },
      {
        term: 'Timely filing',
        definition:
          'The payer-set deadline by which a claim or appeal must be ' +
          'submitted; a claim filed late is denied purely for lateness.',
      },
      {
        term: 'Patient responsibility',
        definition:
          'The portion of a bill the patient owes — copay, deductible, and ' +
          'coinsurance — after the payer’s share is applied.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Revenue-Cycle Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the revenue cycle is leaking revenue and carrying ' +
        'avoidable cost — front end, middle, or back end — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Operation and payer context',
          guidance:
            'Name the revenue-cycle operation in scope — facilities and ' +
            'service lines, claim volume, the payer mix, and whether ' +
            'billing is in-house or outsourced. State which patient-' +
            'accounting, clearinghouse, EHR, and coding systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — clean-claim rate, initial denial rate, ' +
            'days in A/R, cost to collect, net collection rate, first-pass ' +
            'resolution, prior-auth turnaround, point-of-service collection, ' +
            'write-off rate, charge lag, overturn rate. For any metric not ' +
            'recorded, name it as a precise seed gap with its data source.',
        },
        {
          heading: 'Denial and write-off analysis',
          guidance:
            'Break down denials and write-offs by reason and dollar value, ' +
            'separate avoidable administrative loss from genuine ' +
            'contractual and bad-debt loss, and locate where in the cycle ' +
            'each loss originates.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — front-end data leak, prior-' +
            'auth friction, denial backlog, coding and documentation gap, ' +
            'scattershot appeals, manual status chasing, patient-collection ' +
            'breakdown, timely-filing loss — and state which are present, ' +
            'with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — recovered revenue, lower cost to collect, ' +
            'faster cash — explicitly haircut by payer mix, data quality, ' +
            'and adoption. Every figure a labelled planning range.',
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
      label: 'Revenue-Cycle Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a revenue-cycle AI ' +
        'Move on this operation — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recovered revenue, cost-to-collect reduction, and cash ' +
            'acceleration, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — denial rate, clean-claim rate, cost to collect, days ' +
            'in A/R. Where a baseline is a seed gap, say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — payer mix, data ' +
            'quality, workflow adoption, the compliance ceiling — ' +
            'explicitly and show the haircut math. Keep recurring revenue ' +
            'and cost gains separate from one-time cash acceleration.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the patient-accounting ' +
            'system, clearinghouse, and EHR, and the operating-model change ' +
            '— staff redeployment from the work the automation removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under an adverse payer mix, weaker ' +
            'data quality, and partial adoption. State the downside the CFO ' +
            'is underwriting.',
        },
        {
          heading: 'Compliance posture',
          guidance:
            'For any coding or CDI component, state the coding-compliance ' +
            'control and the audit posture — accuracy, not maximisation, is ' +
            'the objective, and the False-Claims-Act exposure is named.',
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
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including the ' +
            'lagged net-collection and write-off metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Revenue-Cycle Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'revenue-cycle AI capability, grounded in the function reference ' +
        'patterns and the compliance frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — front-end prevention layer, pre-bill claim ' +
            'scrubbing, confidence-tiered coding and CDI, denial triage-' +
            'and-appeal, automated status-and-routing — and state which ' +
            'apply and how they connect across the cycle.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the patient-accounting, clearinghouse, EHR, and ' +
            'coding-system integrations, the X12 transaction flows ' +
            '(270/271, 837, 276/277, 835), latency, and the payer-rule ' +
            'data the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define the confidence thresholds for any ' +
            'autonomous coding and the audit sample.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how patient-access, coding, billing, denial-management, ' +
            'and collections workflows change, how staff are redeployed, ' +
            'and who owns each change.',
        },
        {
          heading: 'Compliance and responsible-AI controls',
          guidance:
            'State the coding-compliance and audit controls, the patient-' +
            'protection and financial-assistance controls for any ' +
            'collection use case, and the regulatory frames (False Claims ' +
            'Act, CMS rules, No Surprises Act, 501(r)) that bound the ' +
            'design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and ' +
            'the phased rollout across the cycle and the facilities.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Revenue-Cycle Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the revenue-cycle AI capability so ' +
        'value reaches net collections and cost to collect, not just the ' +
        'dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and transaction validation, ' +
            'a pilot service line or payer, staff onboarding, scale across ' +
            'the cycle — with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, payer-rule maintenance, coding compliance, staff ' +
            'redeployment, denial and collections adoption, Tower ' +
            'measurement.',
        },
        {
          heading: 'Staff adoption and redeployment approach',
          guidance:
            'Define the change runway for patient-access, coding, billing, ' +
            'and collections staff — training, workflow change, and the ' +
            'redeployment of capacity the automation frees — and how ' +
            'adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged settlement metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — payer-rule drift, integration ' +
            'fragility, coding-compliance exposure, partial adoption — with ' +
            'the escalation owner and the trigger for each.',
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
      claim: 'The denial rate and the denial mix',
      authoritativeSource:
        'Remittance (835) data reconciled against the patient-accounting ' +
        'system claim and denial log, classified by denial reason code.',
      whatGoodEvidenceLooksLike:
        'A denial count and charge value broken down by reason code and ' +
        'payer, separating avoidable denials from genuine contractual ' +
        'adjustments.',
      weakEvidenceToReject:
        'A blended denial rate with no reason breakdown, or a figure that ' +
        'cannot distinguish a denial from a contractual write-down.',
    },
    {
      claim: 'The net collection rate — what avoidable revenue is being lost',
      authoritativeSource:
        'The patient-accounting system, comparing cash posted against ' +
        'expected reimbursement net of contractual allowances.',
      whatGoodEvidenceLooksLike:
        'Cash collected against collectible revenue, with contractual ' +
        'allowances explicitly separated so avoidable loss is isolated.',
      weakEvidenceToReject:
        'A gross collection rate against billed charges, which conflates ' +
        'contractual allowances with avoidable loss and overstates the ' +
        'problem.',
    },
    {
      claim: 'Cost to collect and the manual-touch burden',
      authoritativeSource:
        'Revenue-cycle department financials reconciled against net cash ' +
        'collected, with staffing effort traced to work-queue activity.',
      whatGoodEvidenceLooksLike:
        'Total operating cost as a share of cash collected, with the ' +
        'manual-touch and rework volume — status checks, denial rework — ' +
        'measured.',
      weakEvidenceToReject:
        'A staffing headcount with no link to work volume, or a cost ' +
        'figure that omits technology and clearinghouse fees.',
    },
    {
      claim: 'Coding accuracy and documentation support',
      authoritativeSource:
        'A coding audit comparing assigned codes against the clinical ' +
        'documentation, with downcoding and coding-denial data.',
      whatGoodEvidenceLooksLike:
        'An independent audit sample showing the share of codes fully ' +
        'supported by documentation, separating under-coding from ' +
        'compliance risk.',
      weakEvidenceToReject:
        'A claimed revenue uplift from coding with no audit of ' +
        'documentation support, or a coding-accuracy assertion with no ' +
        'independent review.',
    },
    {
      claim: 'The forecast value of a revenue-cycle AI Move',
      authoritativeSource:
        'The value model — recovered revenue, cost-to-collect, and cash-' +
        'acceleration components, each haircut by its dominant factors — ' +
        'read against the specific payer mix.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring gains separated from one-time ' +
        'cash pull-forward, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the payer mix or the compliance ' +
        'ceiling on coding.',
    },
  ],
};
