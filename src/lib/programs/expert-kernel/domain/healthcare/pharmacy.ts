// Domain Function Pack — Healthcare provider · Pharmacy.
//
// Function key: `pharmacy`.
//
// This pack covers the health-system pharmacy function — the operation that
// procures, prepares, dispenses, and clinically governs medication across a
// provider organisation. It spans inpatient pharmacy operations (the central
// pharmacy, the IV / sterile-compounding room, automated dispensing cabinets,
// unit-based distribution), ambulatory and retail pharmacy, the rapidly
// growing specialty-pharmacy operation, the 340B drug-pricing program where
// the organisation is a covered entity, and the clinical-pharmacy work —
// medication-use management, antimicrobial stewardship, clinical intervention
// — that sits across all of it.
//
// The function is read from inside the health system as a director or
// administrator of pharmacy. The operating reality the pack encodes: pharmacy
// is simultaneously one of the largest controllable expense lines in the
// organisation, one of the highest patient-safety-risk operations, and — via
// 340B and specialty pharmacy — one of the few operations that is also a
// material margin contributor. A pharmacy operation is judged on safety,
// drug-spend stewardship, throughput, and how completely it captures the
// 340B and specialty value it is entitled to.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const pharmacyPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'pharmacy',
  functionLabel: 'Pharmacy',
  summary:
    'The pharmacy function procures, prepares, dispenses, and clinically ' +
    'governs medication across a provider organisation — inpatient and ' +
    'ambulatory pharmacy operations, the IV / sterile-compounding room, ' +
    'automated dispensing cabinets, the specialty-pharmacy operation, the ' +
    '340B drug-pricing program, and the clinical-pharmacy work of ' +
    'medication-use management, antimicrobial stewardship, and clinical ' +
    'intervention. It is at once one of the largest controllable expense ' +
    'lines in the organisation, one of the highest patient-safety-risk ' +
    'operations, and — through 340B and specialty pharmacy — a material ' +
    'margin contributor. The function is judged on medication safety, ' +
    'drug-spend stewardship, dispensing and compounding throughput, ' +
    'formulary discipline, and how completely it captures the 340B and ' +
    'specialty-pharmacy value it is entitled to, all under the compliance ' +
    'weight of sterile-compounding standards, controlled-substance rules, ' +
    'and 340B program integrity.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'medication_turnaround_time',
      name: 'Medication turnaround time',
      definition:
        'The elapsed time from a medication order being verified by a ' +
        'pharmacist to the dose being available to administer at the ' +
        'point of care — the responsiveness of the dispensing operation.',
      unit: 'minutes from order verification to dose available',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Turnaround varies by dose type and delivery model — a cabinet ' +
          'override is near-immediate while a compounded or first-dose ' +
          'medication runs longer; the band spans a responsive operation ' +
          'to a slow one. A planning range; STAT orders carry a tighter ' +
          'expectation.',
        label: 'planning-range',
      },
      dataSource:
        'The pharmacy information system and electronic medication ' +
        'administration record, time-stamping order verification against ' +
        'dose availability.',
      whyItMatters:
        'Slow turnaround delays therapy, drives nursing workarounds and ' +
        'cabinet overrides that defeat safety checks, and is the most ' +
        'visible measure of how well the dispensing operation serves the ' +
        'point of care.',
    },
    {
      key: 'drug_spend_per_adjusted_day',
      name: 'Drug spend per adjusted patient day',
      definition:
        'Total medication acquisition cost normalised by adjusted patient ' +
        'days — a volume-and-acuity adjusted measure of how much the ' +
        'organisation spends on drugs.',
      unit: 'USD per adjusted patient day',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 90,
        high: 350,
        basis:
          'Drug spend per adjusted day varies enormously with service ' +
          'mix — an oncology or transplant programme runs far higher than ' +
          'a community hospital; the band spans that range. A planning ' +
          'range, read against the organisation’s own case mix.',
        label: 'planning-range',
      },
      dataSource:
        'Pharmacy purchasing and the wholesaler-purchase feed reconciled ' +
        'against adjusted patient days from the finance system.',
      whyItMatters:
        'Drug spend is one of the largest and fastest-growing controllable ' +
        'expense lines in the organisation; normalised per adjusted day it ' +
        'is the headline stewardship metric the function is held to.',
    },
    {
      key: 'formulary_compliance_rate',
      name: 'Formulary compliance rate',
      definition:
        'The share of medication orders filled with a formulary-preferred ' +
        'agent rather than a non-formulary or non-preferred alternative ' +
        'when a therapeutic equivalent exists.',
      unit: '% of eligible orders filled on-formulary',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 98,
        basis:
          'Formulary compliance depends on order-entry design, ' +
          'therapeutic-interchange protocols, and prescriber engagement; ' +
          'the band spans a loosely managed formulary to a tightly ' +
          'governed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The pharmacy information system order data compared against the ' +
        'formulary and therapeutic-interchange rules.',
      whyItMatters:
        'Formulary discipline is a primary drug-spend lever and a ' +
        'standardisation-of-care lever; every off-formulary fill is ' +
        'usually higher cost and a break from the reviewed, preferred ' +
        'therapeutic pathway.',
    },
    {
      key: 'dispensing_error_rate',
      name: 'Dispensing error rate',
      definition:
        'The rate of dispensing errors — wrong drug, wrong dose, wrong ' +
        'formulation, wrong patient — detected per dispensed doses, ' +
        'whether intercepted before administration or reaching the ' +
        'patient.',
      unit: 'errors per 10,000 dispensed doses',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 20,
        basis:
          'Detected dispensing-error rates depend heavily on how ' +
          'rigorously errors are surfaced and reported as much as on true ' +
          'rate; the band spans a strong barcode-and-verification ' +
          'operation to a weaker one. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The medication-safety event-reporting system reconciled against ' +
        'dispensed-dose volume from the pharmacy information system.',
      whyItMatters:
        'A dispensing error is a direct patient-safety failure; the rate ' +
        'is the core safety metric of the dispensing operation and the ' +
        'one a pharmacy director is personally accountable for.',
    },
    {
      key: 'medication_prior_auth_turnaround',
      name: 'Medication prior-authorisation turnaround',
      definition:
        'The elapsed time from identifying that a medication requires ' +
        'payer prior authorisation to securing the authorisation decision ' +
        '— a leading driver of delayed therapy starts, especially for ' +
        'specialty drugs.',
      unit: 'days from identification to decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 10,
        basis:
          'Medication prior-auth turnaround varies widely by payer, drug, ' +
          'and channel; specialty and high-cost drugs sit at the slow end. ' +
          'The band spans a fast electronic path to a slow manual one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The medication prior-authorisation / benefits-investigation ' +
        'workflow, time-stamped from identification to decision.',
      whyItMatters:
        'Slow medication prior auth delays therapy starts — clinically ' +
        'harmful for specialty patients — drives prescription abandonment, ' +
        'and is a leading cause of leaked specialty-pharmacy volume.',
    },
    {
      key: 'inventory_carrying_cost',
      name: 'Pharmacy inventory carrying cost',
      definition:
        'The cost of holding medication inventory — capital tied up, ' +
        'storage, and the value lost to expiry and waste — expressed as a ' +
        'share of annual drug spend.',
      unit: '% of annual drug spend',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 12,
        basis:
          'Carrying cost depends on inventory-turn discipline, expiry ' +
          'management, and how much high-cost drug is held; the band spans ' +
          'a lean operation to an overstocked one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Pharmacy inventory and purchasing data reconciled against the ' +
        'expiry / waste log and annual drug spend.',
      whyItMatters:
        'Pharmacy inventory ties up working capital and, with high-cost ' +
        'specialty drugs, a single expired vial is a material loss; ' +
        'carrying cost measures how lean the supply operation runs.',
    },
    {
      key: 'iv_room_throughput',
      name: 'IV-room / sterile-compounding throughput',
      definition:
        'The volume of compounded sterile preparations the IV room ' +
        'produces against its staffed and certified capacity — a measure ' +
        'of compounding operational performance.',
      unit: '% of staffed sterile-compounding capacity utilised',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 65,
        high: 90,
        basis:
          'Sustained sterile-compounding utilisation has a healthy ' +
          'operating band — too low wastes certified capacity, too high ' +
          'erodes the slack that quality and safety require. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The IV-workflow / sterile-compounding system reconciled against ' +
        'staffed hood and cleanroom capacity.',
      whyItMatters:
        'The IV room is a capacity-constrained, compliance-critical ' +
        'operation under USP 797 / 800; throughput against capacity shows ' +
        'whether it can meet demand without sacrificing the quality slack ' +
        'sterile compounding requires.',
    },
    {
      key: 'clinical_intervention_rate',
      name: 'Pharmacist clinical-intervention rate',
      definition:
        'The rate at which pharmacists make documented clinical ' +
        'interventions — dose optimisation, therapeutic substitution, ' +
        'drug-interaction or duplication catches, renal or geriatric ' +
        'dosing adjustments — per patient days or per orders reviewed.',
      unit: 'documented interventions per 100 patient days',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Intervention rate depends on clinical-pharmacy staffing, ' +
          'practice model, and how consistently interventions are ' +
          'documented; the band spans a distribution-focused model to a ' +
          'clinically embedded one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The clinical-intervention documentation in the pharmacy ' +
        'information system or a clinical-surveillance platform.',
      whyItMatters:
        'Clinical interventions are where pharmacy improves outcomes and ' +
        'avoids cost — a low rate signals an underused clinical workforce ' +
        'or undocumented value the function cannot defend.',
    },
    {
      key: 'specialty_pharmacy_capture_rate',
      name: 'Specialty-pharmacy capture rate',
      definition:
        'The share of the organisation’s specialty-drug prescriptions ' +
        'filled by its own integrated specialty pharmacy rather than ' +
        'leaking to an external or payer-mandated specialty pharmacy.',
      unit: '% of eligible specialty prescriptions captured internally',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 75,
        basis:
          'Capture rate depends on payer network access, limited-' +
          'distribution-drug access, and referral workflow; the band ' +
          'spans an operation that leaks most volume to one that captures ' +
          'most of what is accessible. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The specialty-pharmacy dispensing system compared against the ' +
        'organisation’s total specialty-prescription volume from the EHR.',
      whyItMatters:
        'Specialty pharmacy is the fastest-growing pharmacy segment and a ' +
        'major margin and care-continuity opportunity; every leaked ' +
        'prescription is lost margin and a lost chance to manage the ' +
        'patient’s adherence and outcomes.',
    },
    {
      key: 'capture_340b_rate',
      name: '340B capture / compliance rate',
      definition:
        'The share of 340B-eligible medication purchases correctly ' +
        'identified and captured at the 340B price, measured alongside the ' +
        'program-integrity compliance posture — accurate eligibility, ' +
        'no duplicate discounts, no diversion.',
      unit: '% of eligible purchases captured at 340B pricing',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'Capture depends on the accuracy of patient and ' +
          'encounter-eligibility logic and contract-pharmacy ' +
          'reconciliation; the band spans an operation that under-captures ' +
          'to one that captures most of what it is compliantly entitled ' +
          'to. A planning range — capture must never be pursued past the ' +
          'bounds of program integrity.',
        label: 'planning-range',
      },
      dataSource:
        'The 340B split-billing / third-party administrator system ' +
        'reconciled against wholesaler purchases and dispensing data.',
      whyItMatters:
        '340B savings are a material margin source for eligible covered ' +
        'entities, but the program carries strict integrity rules and ' +
        'audit exposure — under-capture leaves entitled value unrealised ' +
        'while over-reach is a compliance failure, so capture and ' +
        'integrity must be read together.',
    },
    {
      key: 'antimicrobial_stewardship_index',
      name: 'Antimicrobial-use / stewardship index',
      definition:
        'Antimicrobial consumption measured as days of therapy per 1,000 ' +
        'patient days, read against the antimicrobial-stewardship ' +
        'program’s appropriateness review — a measure of how well ' +
        'antibiotic use is governed.',
      unit: 'antimicrobial days of therapy per 1,000 patient days',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 400,
        high: 900,
        basis:
          'Antimicrobial days of therapy per 1,000 patient days vary with ' +
          'case mix and acuity; the metric is read for appropriateness, ' +
          'not minimisation. The band is a planning range against the ' +
          'organisation’s own case mix.',
        label: 'planning-range',
      },
      dataSource:
        'The pharmacy information system and clinical-surveillance ' +
        'platform antimicrobial-use data reconciled against patient days.',
      whyItMatters:
        'Antimicrobial stewardship is a regulatory expectation and a ' +
        'patient-safety and resistance-control imperative; the index ' +
        'shows whether antibiotic use is appropriate, not merely high or ' +
        'low.',
    },
    {
      key: 'medication_adherence_rate',
      name: 'Medication adherence rate (managed populations)',
      definition:
        'The share of patients in pharmacy-managed chronic or specialty ' +
        'cohorts who remain adherent to therapy — typically measured as ' +
        'proportion of days covered above the adherence threshold.',
      unit: '% of managed patients adherent (PDC ≥ threshold)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 85,
        basis:
          'Adherence varies by drug class, regimen complexity, and the ' +
          'intensity of pharmacy management; the band spans an unmanaged ' +
          'population to an actively managed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Pharmacy dispensing / refill data and the specialty- or ' +
        'ambulatory-pharmacy patient-management system.',
      whyItMatters:
        'Adherence is where pharmacy management converts a dispensed drug ' +
        'into a clinical outcome — it drives specialty-patient results, ' +
        'feeds value-based quality measures, and underpins the case for ' +
        'an integrated specialty pharmacy.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'drug_spend_escalation',
      name: 'Uncontrolled drug-spend escalation',
      description:
        'Drug spend grows faster than volume or acuity because high-cost ' +
        'agents are adopted without a managed therapeutic pathway, ' +
        'formulary discipline is loose, and biosimilar and ' +
        'lower-cost-alternative opportunities are missed — so one of the ' +
        'largest controllable expense lines drifts upward unmanaged.',
      detectionSignal:
        'Drug spend per adjusted patient day rises ahead of volume and ' +
        'acuity, formulary compliance sits in the lower band, and ' +
        'biosimilar conversion lags available opportunity.',
      diagnosticQuestion:
        'Is drug spend per adjusted day growing faster than volume and ' +
        'acuity, and where — which agents, which service lines — is the ' +
        'unmanaged growth concentrated?',
    },
    {
      key: 'dispensing_safety_failure',
      name: 'Dispensing and medication-safety failure mode',
      description:
        'Dispensing errors and adverse drug events occur because ' +
        'barcode-verification and double-check steps are bypassed under ' +
        'workload, cabinet overrides defeat safety checks, and ' +
        'high-alert medications are not consistently differentiated — a ' +
        'direct patient-safety exposure.',
      detectionSignal:
        'The dispensing error rate or override rate is elevated, ' +
        'high-alert-medication events recur, and barcode-verification ' +
        'compliance is inconsistent.',
      diagnosticQuestion:
        'Where in the medication-use process are errors and ' +
        'near-misses concentrated, and which safety checks are being ' +
        'bypassed under workload?',
    },
    {
      key: 'iv_compounding_constraint',
      name: 'IV-room capacity and compliance constraint',
      description:
        'The sterile-compounding operation is squeezed between rising ' +
        'demand and the staffing, cleanroom, and certification limits of ' +
        'USP 797 / 800 — so it either runs over-capacity at the expense ' +
        'of quality slack, leans on outsourced compounding at higher ' +
        'cost, or delays doses.',
      detectionSignal:
        'IV-room throughput runs at the top of or above its healthy band, ' +
        'outsourced-compounding spend is rising, and STAT-dose ' +
        'turnaround from the IV room is slow.',
      diagnosticQuestion:
        'Can the IV room meet demand within its certified capacity and ' +
        'USP 797 / 800 requirements, and what is the cost of the slack — ' +
        'or the lack of it?',
    },
    {
      key: 'medication_prior_auth_drag',
      name: 'Medication prior-authorisation drag and therapy delay',
      description:
        'Medication prior authorisation — especially for specialty ' +
        'drugs — is a slow, manual, payer-by-payer process that delays ' +
        'therapy starts, drives prescription abandonment, and consumes ' +
        'pharmacy-technician and benefits-investigation effort.',
      detectionSignal:
        'Medication prior-auth turnaround is long and variable, ' +
        'specialty therapy starts are delayed, and prior-auth handling ' +
        'is a large pharmacy-technician workload.',
      diagnosticQuestion:
        'How long does a medication prior authorisation take, how much ' +
        'therapy delay and abandonment does it cause, and how much staff ' +
        'effort does it consume?',
    },
    {
      key: 'inventory_expiry_waste',
      name: 'Inventory imbalance and expiry waste',
      description:
        'Inventory is simultaneously overstocked in some agents and ' +
        'short in others because demand is forecast manually, expiry ' +
        'dating is not actively managed, and high-cost specialty stock ' +
        'is not closely tracked — so capital is tied up and expensive ' +
        'drug expires unused.',
      detectionSignal:
        'Inventory carrying cost is high, expiry / waste write-offs are ' +
        'material, and stockouts and emergency purchases recur alongside ' +
        'overstock.',
      diagnosticQuestion:
        'How is medication demand forecast and expiry managed, and what ' +
        'is being lost to overstock, stockouts, and expired drug?',
    },
    {
      key: 'specialty_leakage',
      name: 'Specialty-pharmacy leakage',
      description:
        'The organisation’s own specialty prescriptions leak to external ' +
        'or payer-mandated specialty pharmacies because referral capture ' +
        'is not systematic, payer network and limited-distribution-drug ' +
        'access is not worked, and the prescription is filled before the ' +
        'internal pharmacy can engage — losing margin and care ' +
        'continuity.',
      detectionSignal:
        'The specialty-pharmacy capture rate sits in the lower band, ' +
        'specialty referrals are not consistently routed internally, and ' +
        'specialty volume the organisation generated is filled elsewhere.',
      diagnosticQuestion:
        'What share of the organisation’s specialty prescriptions are ' +
        'captured by its own pharmacy, and where in the referral path is ' +
        'the leakage occurring?',
    },
    {
      key: 'capture_340b_compliance_tension',
      name: '340B under-capture and compliance tension',
      description:
        'The 340B program either leaves entitled savings on the table ' +
        'because eligibility logic and contract-pharmacy reconciliation ' +
        'are imprecise, or it reaches past the program rules and creates ' +
        'duplicate-discount, diversion, or eligibility-audit exposure — ' +
        'both failures of the same imprecision.',
      detectionSignal:
        'The 340B capture rate is below the band while audit findings, ' +
        'duplicate-discount flags, or eligibility-determination ' +
        'inconsistencies appear in program review.',
      diagnosticQuestion:
        'How accurate is 340B eligibility determination and ' +
        'contract-pharmacy reconciliation, and is the program capturing ' +
        'its entitled value strictly within program-integrity rules?',
    },
    {
      key: 'clinical_pharmacy_underuse',
      name: 'Clinical-pharmacy capacity underused or undocumented',
      description:
        'Pharmacists spend a large share of their time on distribution ' +
        'and order verification rather than clinical work, and the ' +
        'clinical interventions they do make — stewardship, dose ' +
        'optimisation, intervention — are inconsistently documented, so ' +
        'the function cannot see or defend the clinical value it creates.',
      detectionSignal:
        'The clinical-intervention rate is low or unmeasured, pharmacist ' +
        'time is dominated by distribution tasks, and stewardship ' +
        'activity is not systematically captured.',
      diagnosticQuestion:
        'How much pharmacist time goes to clinical work versus ' +
        'distribution, and is the clinical value pharmacy creates being ' +
        'documented and measured?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'drug_spend_medication_use_analytics',
      name: 'Drug-spend & medication-use analytics',
      valueMechanism:
        'A model analyses medication purchasing, dispensing, and ' +
        'utilisation against formulary, biosimilar opportunity, and ' +
        'therapeutic-pathway benchmarks, surfacing the highest-value ' +
        'stewardship opportunities — biosimilar conversions, formulary ' +
        'tightening, dose rounding, site-of-care optimisation — ranked by ' +
        'realisable saving. Value comes from converting an unmanaged ' +
        'expense line into a targeted, evidence-ranked stewardship ' +
        'pipeline.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Pharmacy purchasing and wholesaler-purchase data',
        'Pharmacy information system dispensing and order data',
        'Formulary, biosimilar, and therapeutic-interchange reference',
        'Drug-pricing and contract data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model identifies and ranks opportunities; a pharmacist and ' +
          'the P&T committee own every formulary and therapeutic-pathway ' +
          'decision — the model does not change a formulary.',
        'A recommended conversion must be clinically appropriate; cost ' +
          'ranking never overrides clinical equivalence and patient ' +
          'safety.',
        'Pricing and contract inputs must be current or the ranked saving ' +
          'is wrong; the data feeds are governed.',
      ],
      metricsMoved: [
        'drug_spend_per_adjusted_day',
        'formulary_compliance_rate',
        'inventory_carrying_cost',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'capture_340b_optimization',
      name: '340B capture & compliance optimisation',
      valueMechanism:
        'A model evaluates each dispense against 340B eligibility logic ' +
        '— patient, encounter, and provider criteria — reconciles ' +
        'contract-pharmacy claims, and flags both missed captures and ' +
        'program-integrity risks such as duplicate discounts or ' +
        'diversion. Value comes from capturing the entitled 340B savings ' +
        'the entity is leaving on the table while tightening the ' +
        'compliance posture — the two failure modes solved together.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The 340B split-billing / TPA system eligibility and ' +
          'accumulation data',
        'EHR encounter, patient, and provider eligibility data',
        'Wholesaler purchasing and contract-pharmacy claims data',
        'The covered entity’s 340B policies and HRSA program rules',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model flags eligibility and integrity findings; the 340B ' +
          'program manager owns every eligibility determination and ' +
          'accumulation decision — capture is never automated past human ' +
          'sign-off.',
        'Capture must never be pursued past program rules; the model is ' +
          'tuned for compliant capture, and an integrity flag always ' +
          'takes precedence over a capture opportunity.',
        'Eligibility logic must reflect current HRSA guidance and the ' +
          'entity’s registered sites, or it will mis-determine ' +
          'eligibility and create audit exposure.',
      ],
      metricsMoved: [
        'capture_340b_rate',
        'drug_spend_per_adjusted_day',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'dispensing_error_detection',
      name: 'Dispensing-error detection & medication-safety surveillance',
      valueMechanism:
        'A model screens medication orders, dispensing events, and ' +
        'administration data in real time for error and adverse-event ' +
        'risk — wrong-dose and wrong-route patterns, high-alert-' +
        'medication exposures, drug-interaction and dosing risks the ' +
        'standard checks miss — and surfaces them for a pharmacist before ' +
        'the dose reaches the patient. Value comes from catching ' +
        'medication errors earlier and reducing the dispensing-error and ' +
        'adverse-drug-event rate.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Pharmacy information system order and dispensing data',
        'The electronic medication administration record',
        'High-alert-medication, dosing, and interaction reference rules',
        'Patient clinical data — renal function, allergies, weight',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags risk; a pharmacist reviews and owns every ' +
          'intervention — it does not stop or change an order ' +
          'autonomously.',
        'Alert precision is critical — a noisy model adds to alert ' +
          'fatigue and is ignored, so it is tuned for clinically ' +
          'meaningful, actionable alerts.',
        'A missed true error is a patient-safety failure; surveillance ' +
          'sensitivity is validated and monitored, not assumed.',
      ],
      metricsMoved: [
        'dispensing_error_rate',
        'clinical_intervention_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'inventory_expiry_optimization',
      name: 'Inventory & expiry optimisation',
      valueMechanism:
        'A model forecasts medication demand by agent and location, sets ' +
        'par levels, and actively tracks expiry dating — flagging stock ' +
        'to redistribute or use before it expires and preventing both ' +
        'stockouts and overstock. Value comes from lowering inventory ' +
        'carrying cost, cutting expiry waste, and reducing the emergency ' +
        'purchasing that stockouts force.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Pharmacy inventory, par-level, and purchasing data',
        'Historical dispensing and demand patterns by location',
        'Lot and expiry-dating data',
        'Wholesaler availability and lead-time data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes par levels and redistribution; pharmacy ' +
          'buyers and inventory staff own purchasing and movement ' +
          'decisions.',
        'High-cost specialty stock carries asymmetric risk — a wrong ' +
          'forecast either expires expensive drug or causes a clinical ' +
          'stockout; those agents are reviewed more closely.',
        'Forecasts must adapt to demand shifts and drug shortages; a ' +
          'stale model misfires exactly when supply is tightest.',
      ],
      metricsMoved: [
        'inventory_carrying_cost',
        'drug_spend_per_adjusted_day',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'medication_prior_authorization',
      name: 'Medication prior-authorisation automation',
      valueMechanism:
        'An agent identifies that a medication needs payer prior ' +
        'authorisation, runs the benefits investigation, assembles the ' +
        'clinical evidence the payer requires, submits the request, and ' +
        'tracks it to a decision. Value comes from collapsing medication ' +
        'prior-auth turnaround, cutting the pharmacy-technician effort it ' +
        'consumes, and getting specialty patients to therapy faster with ' +
        'less abandonment.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'EHR medication orders and clinical documentation',
        'Payer formulary, coverage, and prior-authorisation criteria',
        'Member pharmacy-benefit and eligibility data',
        'Payer portal or electronic prior-authorisation channel access',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent assembles and submits; a pharmacist or technician ' +
          'reviews exceptions and owns any clinically nuanced or denied ' +
          'request.',
        'The clinical evidence submitted must come from the documented ' +
          'record — the agent does not infer or embellish medical ' +
          'necessity.',
        'Payer criteria change constantly; the rule base must be kept ' +
          'current or the agent submits against stale criteria.',
      ],
      metricsMoved: [
        'medication_prior_auth_turnaround',
        'specialty_pharmacy_capture_rate',
        'medication_adherence_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'clinical_surveillance_stewardship',
      name: 'Clinical surveillance & antimicrobial stewardship',
      valueMechanism:
        'A model continuously screens patients against ' +
        'clinical-surveillance rules — antimicrobial appropriateness, ' +
        'culture-and-sensitivity mismatches, IV-to-oral conversion ' +
        'candidates, renal dose adjustments, therapeutic drug monitoring ' +
        '— and routes a worklist of high-yield intervention candidates to ' +
        'clinical pharmacists. Value comes from focusing scarce ' +
        'clinical-pharmacist capacity on the patients where an ' +
        'intervention will most change the outcome and the cost.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'EHR clinical data — labs, cultures, vitals, renal function',
        'Pharmacy information system medication-order data',
        'Antimicrobial-stewardship and clinical-surveillance rule sets',
        'Microbiology and culture-result data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces and ranks intervention candidates; a clinical ' +
          'pharmacist reviews each and owns the recommendation to the ' +
          'care team.',
        'Surveillance rules must be evidence-based and locally validated; ' +
          'a noisy worklist wastes the clinical capacity it is meant to ' +
          'focus.',
        'Stewardship recommendations are clinical advice to the ' +
          'prescriber, not autonomous order changes — the prescriber ' +
          'retains the decision.',
      ],
      metricsMoved: [
        'antimicrobial_stewardship_index',
        'clinical_intervention_rate',
        'drug_spend_per_adjusted_day',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'specialty_pharmacy_patient_management',
      name: 'Specialty-pharmacy patient management',
      valueMechanism:
        'A model identifies the organisation’s specialty prescriptions ' +
        'as they are written, routes referrals into the internal ' +
        'specialty pharmacy, and then risk-stratifies enrolled patients ' +
        'for adherence and intervention — prioritising outreach, refill ' +
        'coordination, and clinical follow-up. Value comes from capturing ' +
        'specialty volume that would otherwise leak and from raising ' +
        'adherence and outcomes once the patient is managed.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'EHR specialty-prescription and diagnosis data',
        'Specialty-pharmacy dispensing and refill data',
        'Payer specialty-network and limited-distribution-drug access ' +
          'data',
        'Patient adherence and clinical-follow-up history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model routes referrals and stratifies patients; specialty-' +
          'pharmacy staff own patient enrolment, counselling, and ' +
          'clinical follow-up.',
        'Referral routing must respect patient choice and payer network ' +
          'rules — capture is pursued only where it is permitted and in ' +
          'the patient’s interest.',
        'Risk stratification informs outreach intensity; it must not ' +
          'become a tool that deprioritises clinically vulnerable ' +
          'patients.',
      ],
      metricsMoved: [
        'specialty_pharmacy_capture_rate',
        'medication_adherence_rate',
        'medication_prior_auth_turnaround',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'stewardship_opportunity_pipeline',
      name: 'Drug-stewardship opportunity-pipeline pattern',
      description:
        'A pattern that runs purchasing, dispensing, and utilisation data ' +
        'against formulary, biosimilar, and therapeutic-pathway ' +
        'benchmarks to produce a continuously refreshed, evidence-ranked ' +
        'pipeline of drug-spend stewardship opportunities — feeding the ' +
        'P&T committee and clinical pharmacists a prioritised worklist ' +
        'rather than an annual review.',
      boundary:
        'It identifies and ranks opportunities; the P&T committee and ' +
        'clinical pharmacists own every formulary and therapeutic-pathway ' +
        'decision. It does not change a formulary or substitute a drug.',
      humanAccountabilityPoint:
        'The pharmacy director (and P&T committee chair) accountable for ' +
        'drug-spend stewardship and the formulary.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'closed_loop_medication_safety',
      name: 'Closed-loop medication-safety surveillance pattern',
      description:
        'A pattern that layers AI surveillance across the closed-loop ' +
        'medication-use process — order, verify, dispense, administer — ' +
        'screening for error and adverse-event risk in real time and ' +
        'routing actionable alerts to a pharmacist before the dose ' +
        'reaches the patient, complementing barcode and double-check ' +
        'controls rather than replacing them.',
      boundary:
        'It screens and alerts; a pharmacist reviews and owns every ' +
        'intervention. It does not stop, change, or release a ' +
        'medication order autonomously.',
      humanAccountabilityPoint:
        'The medication-safety officer (and pharmacy director) ' +
        'accountable for the dispensing-error and adverse-drug-event rate.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'integrity_first_340b_capture',
      name: 'Integrity-first 340B capture pattern',
      description:
        'A pattern that evaluates every dispense against 340B ' +
        'eligibility logic and reconciles contract-pharmacy claims, ' +
        'surfacing missed captures and program-integrity risks together — ' +
        'and treats any duplicate-discount, diversion, or ' +
        'eligibility-ambiguity flag as a stop condition that outranks the ' +
        'capture opportunity.',
      boundary:
        'It evaluates eligibility and flags integrity risk; the 340B ' +
        'program manager owns every eligibility determination and ' +
        'accumulation decision. It never auto-captures past human ' +
        'sign-off.',
      humanAccountabilityPoint:
        'The 340B program manager accountable for capture and program ' +
        'integrity.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'surveillance_driven_clinical_worklist',
      name: 'Surveillance-driven clinical-pharmacy worklist pattern',
      description:
        'A pattern that turns clinical-surveillance rules — stewardship, ' +
        'IV-to-oral conversion, renal dosing, therapeutic drug monitoring ' +
        '— into a ranked daily worklist for clinical pharmacists, so ' +
        'scarce clinical capacity is pointed at the patients where an ' +
        'intervention will most change the outcome and the cost.',
      boundary:
        'It surfaces and ranks intervention candidates; a clinical ' +
        'pharmacist reviews each and owns the recommendation to the ' +
        'prescriber. It does not change therapy.',
      humanAccountabilityPoint:
        'The clinical-pharmacy manager accountable for the clinical-' +
        'intervention rate and stewardship outcomes.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'specialty_capture_and_management',
      name: 'Specialty-capture-and-management pattern',
      description:
        'A pattern that detects the organisation’s specialty ' +
        'prescriptions at the point they are written, routes the referral ' +
        'into the internal specialty pharmacy where network and ' +
        'limited-distribution access allow, and then risk-stratifies ' +
        'enrolled patients for adherence and clinical follow-up — joining ' +
        'capture and ongoing management into one flow.',
      boundary:
        'It detects, routes, and stratifies; specialty-pharmacy staff own ' +
        'enrolment, counselling, and follow-up, and patient choice and ' +
        'payer rules govern routing. It does not enrol a patient ' +
        'autonomously.',
      humanAccountabilityPoint:
        'The specialty-pharmacy director accountable for the capture ' +
        'rate and managed-patient outcomes.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Pharmacy value is realised in four distinct ways and a forecast ' +
      'must keep them separate. First, drug-spend stewardship: tighter ' +
      'formulary discipline, biosimilar conversion, dose optimisation, ' +
      'and site-of-care optimisation reduce one of the largest ' +
      'controllable expense lines — this lands in drug spend per adjusted ' +
      'patient day. Second, captured margin: 340B capture and ' +
      'specialty-pharmacy capture are not cost reductions but margin the ' +
      'organisation is entitled to and is currently leaving on the table. ' +
      'Third, avoided cost and harm: medication-safety surveillance and ' +
      'clinical stewardship prevent adverse drug events and the cost they ' +
      'carry, and inventory optimisation cuts carrying cost and expiry ' +
      'waste. Fourth, throughput and access: faster turnaround and ' +
      'prior-auth automation get therapy to patients sooner — a real ' +
      'operational and clinical gain. The dominant constraint is that the ' +
      'two largest dollar levers — 340B and specialty capture — are ' +
      'bounded hard by program rules and payer access respectively: ' +
      'neither can be pursued past its compliance and network ceiling. ' +
      'Stewardship and avoided-harm gains are recurring; the ' +
      'inventory-carrying gain is partly a one-time working-capital ' +
      'release.',
    dominantHaircutFactors: [
      {
        factor: 'Program-integrity and regulatory ceiling',
        rationale:
          'The 340B capture lever is bounded by HRSA program-integrity ' +
          'rules and sterile-compounding and controlled-substance ' +
          'compliance constrains operations. Capture and throughput gains ' +
          'cannot be pursued past these ceilings without audit and ' +
          'enforcement exposure that dwarfs the gain.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled 340B and operational gain that is ' +
            'not reachable within program-integrity and regulatory ' +
            'limits; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Payer access and specialty-network constraints',
        rationale:
          'The specialty-capture lever depends on payer network access ' +
          'and limited-distribution-drug access the organisation does not ' +
          'control. A restrictive payer mix caps how much of the modelled ' +
          'specialty-capture and prior-auth gain is reachable.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Value erosion from payer network and ' +
            'limited-distribution-drug access outside the organisation’s ' +
            'control; a planning range driven by the payer mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Prescriber and clinical-workflow adoption',
        rationale:
          'Formulary, stewardship, and clinical-intervention value only ' +
          'lands if prescribers and clinical pharmacists act on the ' +
          'recommendations and embed them in workflow. Partial adoption — ' +
          'recommendations made but not acted on — realises a fraction of ' +
          'the modelled value.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial prescriber and ' +
            'clinical-workflow adoption; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data and source-system readiness',
        rationale:
          'Spend analytics, 340B eligibility, safety surveillance, and ' +
          'inventory optimisation all depend on clean pharmacy, EHR, ' +
          'purchasing, and clinical data. Fragmented or low-quality ' +
          'source data caps how much of the modelled value the models ' +
          'can deliver.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Forecast erosion from fragmented or low-quality pharmacy and ' +
            'clinical source data; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Drug-spend reduction',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative reduction in addressable drug spend from formulary ' +
            'tightening, biosimilar conversion, and dose and ' +
            'site-of-care optimisation; a planning range spanning early ' +
            'and mature stewardship.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in addressable drug spend per ' +
          'adjusted patient day.',
      },
      {
        lever: '340B capture uplift',
        range: {
          low: 5,
          high: 20,
          basis:
            'Percentage-point uplift in the 340B capture rate from more ' +
            'precise eligibility logic and contract-pharmacy ' +
            'reconciliation, within program-integrity rules; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the 340B capture rate, with ' +
          'compliance posture held or improved.',
      },
      {
        lever: 'Specialty-pharmacy capture uplift',
        range: {
          low: 5,
          high: 25,
          basis:
            'Percentage-point uplift in the specialty-pharmacy capture ' +
            'rate from systematic referral routing, within payer-access ' +
            'limits; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the specialty-pharmacy capture ' +
          'rate.',
      },
      {
        lever: 'Inventory carrying-cost and expiry-waste reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in inventory carrying cost and expiry ' +
            'waste from demand forecasting and active expiry management; ' +
            'a planning range — partly a one-time working-capital ' +
            'release.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in inventory carrying cost as a ' +
          'share of drug spend.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable operational signal (formulary ' +
      'compliance, turnaround, inventory carrying cost); 9–18 months to a ' +
      'settled financial result, because 340B and specialty-capture gains ' +
      'depend on workflow and payer-access change, and drug-spend and ' +
      'safety improvements only show fully once stewardship actions ' +
      'cycle through a full purchasing and outcomes period.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Pharmacy information system',
        role:
          'The core system of record for the function — medication ' +
          'orders, pharmacist verification, dispensing, and clinical ' +
          'documentation; usually a module of the EHR or a dedicated ' +
          'pharmacy platform.',
        examples: [
          'Epic Willow',
          'Oracle Health (Cerner) pharmacy',
          'MEDITECH pharmacy',
        ],
      },
      {
        name: 'Automated dispensing and distribution systems',
        role:
          'Automated dispensing cabinets, carousels, and packaging robots ' +
          'that control and track medication distribution at the point of ' +
          'care and in the central pharmacy.',
        examples: [
          'BD Pyxis',
          'Omnicell automated dispensing',
          'central-pharmacy packaging and carousel automation',
        ],
      },
      {
        name: 'IV-workflow / sterile-compounding system',
        role:
          'Governs and documents sterile compounding in the IV room — ' +
          'gravimetric and image verification, batch records, and USP ' +
          '797 / 800 compliance evidence.',
        examples: [
          'BD Cato / Pyxis IV prep',
          'Omnicell IV-workflow systems',
          'gravimetric IV-compounding workflow platforms',
        ],
      },
      {
        name: '340B split-billing / third-party-administrator system',
        role:
          'Determines 340B eligibility for each dispense, manages ' +
          'accumulations and the virtual inventory, and reconciles ' +
          'contract-pharmacy claims — the system of record for 340B ' +
          'capture and compliance.',
        examples: [
          'Verity / Vizient 340B solutions',
          'Macro Helix / Omnicell 340B platforms',
          'contract-pharmacy TPA systems',
        ],
      },
      {
        name: 'Specialty-pharmacy / clinical-surveillance platforms',
        role:
          'The specialty-pharmacy dispensing and patient-management ' +
          'system, and the clinical-surveillance platform that screens ' +
          'patients for stewardship and intervention opportunities.',
        examples: [
          'Specialty-pharmacy dispensing and patient-management systems',
          'Bamboo Health / Wolters Kluwer clinical-surveillance tools',
          'antimicrobial-stewardship surveillance platforms',
        ],
      },
    ],
    roles: [
      {
        title: 'Director / Administrator of Pharmacy',
        accountability:
          'Owns the operational, financial, safety, and compliance ' +
          'performance of the whole pharmacy function — drug spend, ' +
          'safety, throughput, and 340B and specialty value.',
      },
      {
        title: 'Clinical pharmacy manager / clinical pharmacist',
        accountability:
          'Owns medication-use management, clinical interventions, ' +
          'antimicrobial stewardship, and the clinical-pharmacy practice ' +
          'model.',
      },
      {
        title: 'Pharmacy operations / dispensing manager',
        accountability:
          'Owns the central-pharmacy and unit-distribution operation — ' +
          'dispensing turnaround, automation, and the dispensing-error ' +
          'rate.',
      },
      {
        title: 'Sterile-compounding / IV-room supervisor',
        accountability:
          'Owns the sterile-compounding operation and its USP 797 / 800 ' +
          'compliance, quality, and throughput.',
      },
      {
        title: '340B program manager',
        accountability:
          'Owns 340B eligibility determination, capture, ' +
          'contract-pharmacy reconciliation, and HRSA program-integrity ' +
          'compliance.',
      },
      {
        title: 'Specialty-pharmacy director',
        accountability:
          'Owns the specialty-pharmacy operation — referral capture, ' +
          'patient management, and specialty therapy outcomes.',
      },
      {
        title: 'Pharmacy buyer / inventory coordinator',
        accountability:
          'Owns medication purchasing, par levels, inventory, expiry ' +
          'management, and drug-shortage response.',
      },
      {
        title: 'Pharmacy & Therapeutics (P&T) committee',
        accountability:
          'Governs the formulary, therapeutic-interchange protocols, and ' +
          'medication-use policy across the organisation.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA',
        relevance:
          'Governs the handling of patient and medication data across ' +
          'the pharmacy information system, surveillance, and ' +
          'specialty-pharmacy patient management.',
      },
      {
        name: 'The 340B Drug Pricing Program (HRSA)',
        relevance:
          'Lets eligible covered entities buy outpatient drugs at ' +
          'discounted prices, under strict integrity rules — patient ' +
          'eligibility, no duplicate discounts, no diversion — and HRSA ' +
          'and manufacturer audit; the frame any 340B use case must obey.',
      },
      {
        name: 'USP Chapters 797 and 800',
        relevance:
          'Set the standards for sterile compounding (797) and the ' +
          'handling of hazardous drugs (800) — environmental, process, ' +
          'and personnel requirements that bound IV-room capacity and ' +
          'operations.',
      },
      {
        name: 'State pharmacy law and the Board of Pharmacy',
        relevance:
          'Governs pharmacy licensure, pharmacist and technician scope ' +
          'of practice, dispensing requirements, and inspection — the ' +
          'baseline legal frame the function operates under.',
      },
      {
        name: 'Controlled Substances Act and DEA rules',
        relevance:
          'Govern the procurement, storage, dispensing, recordkeeping, ' +
          'and diversion control of controlled substances throughout the ' +
          'pharmacy operation.',
      },
      {
        name: 'CMS Conditions of Participation and antimicrobial-' +
          'stewardship requirements',
        relevance:
          'Require a functioning medication-management and ' +
          'antimicrobial-stewardship program as a condition of ' +
          'participation — the regulatory weight behind clinical ' +
          'stewardship.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Formulary',
        definition:
          'The reviewed, approved list of medications the organisation ' +
          'preferentially stocks and uses, governed by the P&T ' +
          'committee.',
      },
      {
        term: '340B covered entity',
        definition:
          'An organisation eligible to participate in the 340B Drug ' +
          'Pricing Program and to purchase qualifying outpatient drugs at ' +
          'the discounted 340B price.',
      },
      {
        term: 'Duplicate discount',
        definition:
          'A prohibited 340B outcome in which a drug receives both the ' +
          '340B discount and a Medicaid rebate — a core program-integrity ' +
          'violation.',
      },
      {
        term: 'Sterile compounding',
        definition:
          'The preparation of medications in a controlled, sterile ' +
          'environment — IV admixtures and hazardous-drug preparations — ' +
          'under USP 797 / 800.',
      },
      {
        term: 'Specialty pharmacy',
        definition:
          'The pharmacy operation that dispenses and manages high-cost, ' +
          'high-complexity specialty medications with intensive patient ' +
          'support and clinical follow-up.',
      },
      {
        term: 'Limited-distribution drug',
        definition:
          'A specialty drug a manufacturer distributes through only a ' +
          'restricted set of pharmacies — a key constraint on specialty ' +
          'capture.',
      },
      {
        term: 'Antimicrobial stewardship',
        definition:
          'The coordinated program to optimise antimicrobial use — right ' +
          'drug, dose, route, and duration — to improve outcomes and ' +
          'limit resistance.',
      },
      {
        term: 'Days of therapy / proportion of days covered',
        definition:
          'Days of therapy is a standardised measure of antimicrobial ' +
          'consumption; proportion of days covered is the standard ' +
          'measure of a patient’s medication adherence.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Pharmacy Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the pharmacy function is leaking drug-spend ' +
        'value, carrying safety or compliance risk, or leaving 340B and ' +
        'specialty value uncaptured — with baseline evidence, before a ' +
        'solution is shaped.',
      sections: [
        {
          heading: 'Operation and service-mix context',
          guidance:
            'Name the pharmacy operation in scope — inpatient, ' +
            'ambulatory, IV room, specialty pharmacy, 340B status — the ' +
            'service mix that drives drug spend, and the pharmacy ' +
            'information, automation, 340B, and surveillance systems in ' +
            'use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — medication turnaround, drug spend per ' +
            'adjusted day, formulary compliance, dispensing error rate, ' +
            'medication prior-auth turnaround, inventory carrying cost, ' +
            'IV-room throughput, clinical-intervention rate, ' +
            'specialty-capture rate, 340B capture, antimicrobial index, ' +
            'adherence. For any metric not recorded, name it as a precise ' +
            'seed gap with its data source.',
        },
        {
          heading: 'Drug-spend and stewardship-opportunity analysis',
          guidance:
            'Break down drug spend by agent, service line, and ' +
            'on-/off-formulary status; identify the biosimilar, ' +
            'therapeutic-interchange, dose-optimisation, and ' +
            'site-of-care opportunities and size each.',
        },
        {
          heading: 'Safety, compliance, and 340B-integrity read',
          guidance:
            'State, with evidence, the medication-safety posture ' +
            '(dispensing errors, overrides, high-alert events), the USP ' +
            '797 / 800 and controlled-substance compliance posture, and ' +
            'the 340B capture-and-integrity position — so risk and ' +
            'uncaptured value are both explicit.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — drug-spend escalation, the ' +
            'dispensing-safety failure mode, the IV-compounding ' +
            'constraint, medication prior-auth drag, inventory and expiry ' +
            'waste, specialty leakage, the 340B under-capture / ' +
            'compliance tension, clinical-pharmacy underuse — and state ' +
            'which are present, with the detection signal and evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — drug-spend stewardship, captured 340B and ' +
            'specialty margin, avoided cost and harm, throughput — ' +
            'explicitly haircut by the program-integrity and regulatory ' +
            'ceiling, payer access, adoption, and data readiness. Every ' +
            'figure a labelled planning range.',
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
      label: 'Pharmacy Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, executive-readable case for funding a pharmacy ' +
        'AI Move on this operation — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'drug-spend stewardship, captured 340B and specialty margin, ' +
            'avoided cost and harm, and throughput, the time-to-value ' +
            'band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — drug spend per adjusted day, formulary compliance, ' +
            'dispensing error rate, 340B and specialty capture. Where a ' +
            'baseline is a seed gap, say so and state what closing it ' +
            'requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — the ' +
            'program-integrity and regulatory ceiling, payer access, ' +
            'prescriber and workflow adoption, data readiness — ' +
            'explicitly and show the haircut math. Keep recurring ' +
            'stewardship and margin gains separate from the one-time ' +
            'inventory release.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the pharmacy ' +
            'information, automation, 340B, EHR, and surveillance ' +
            'systems, and the operating-model change — clinical-pharmacy ' +
            'and buyer workflow.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a tighter program-integrity ' +
            'ceiling, more restrictive payer access, and weaker ' +
            'prescriber adoption. State the downside the sponsor is ' +
            'underwriting.',
        },
        {
          heading: 'Compliance and patient-safety posture',
          guidance:
            'State the 340B program-integrity, USP 797 / 800, ' +
            'controlled-substance, and medication-safety controls the ' +
            'Move must hold — capture and throughput are never pursued ' +
            'past the compliance and safety ceiling, and that ceiling is ' +
            'named.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged drug-spend, adherence, and capture metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Pharmacy Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'pharmacy AI capability, grounded in the function reference ' +
        'patterns and the compliance frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — the stewardship opportunity pipeline, ' +
            'closed-loop medication-safety surveillance, integrity-first ' +
            '340B capture, the surveillance-driven clinical worklist, ' +
            'specialty capture-and-management — and state which apply and ' +
            'how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the pharmacy information system, automation, ' +
            'IV-workflow, 340B TPA, EHR, and surveillance integrations, ' +
            'the purchasing and clinical data feeds, latency, and the ' +
            'formulary, criteria, and program-rule reference data the use ' +
            'cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. Confirm no formulary change, 340B capture, ' +
            'or therapy change is made without the named human sign-off.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how clinical-pharmacy, dispensing, IV-room, 340B, ' +
            'specialty-pharmacy, and buyer workflows change, how staff ' +
            'are redeployed toward clinical work, and who owns each ' +
            'change.',
        },
        {
          heading: 'Compliance and responsible-AI controls',
          guidance:
            'State the 340B program-integrity controls, the USP 797 / ' +
            '800 and controlled-substance controls, the ' +
            'medication-safety and alert-precision controls, and the ' +
            'regulatory frames (HRSA 340B rules, USP standards, state ' +
            'pharmacy law, DEA rules, CMS requirements) that bound the ' +
            'design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns, and ' +
            'the phased rollout across the pharmacy sub-operations and ' +
            'sites.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Pharmacy Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the pharmacy AI capability so ' +
        'value reaches drug spend, safety, and captured margin — not just ' +
        'the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot operation or drug class, clinical and operations ' +
            'onboarding, scale across the function — with milestones tied ' +
            'to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, formulary and criteria configuration, 340B ' +
            'program integrity, clinical-pharmacy adoption, ' +
            'specialty-capture workflow, inventory change, Tower ' +
            'measurement.',
        },
        {
          heading: 'Clinical and operations adoption approach',
          guidance:
            'Define the change runway for clinical pharmacists, ' +
            'dispensing and IV-room staff, buyers, and the prescribers ' +
            'whose orders the recommendations touch — training, workflow ' +
            'change, and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged drug-spend, adherence, and ' +
            'capture metrics.',
        },
        {
          heading: 'Compliance and risk register',
          guidance:
            'Carry the live risks — 340B program-integrity exposure, ' +
            'sterile-compounding compliance, medication-safety alert ' +
            'fatigue, payer-access change, partial adoption — with the ' +
            'escalation owner and the trigger for each.',
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
      claim: 'Drug spend and the stewardship opportunity',
      authoritativeSource:
        'Pharmacy purchasing and wholesaler-purchase data reconciled ' +
        'against dispensing data and adjusted patient days, broken down ' +
        'by agent and service line.',
      whatGoodEvidenceLooksLike:
        'Drug spend per adjusted patient day with the addressable ' +
        'opportunity sized by lever — biosimilar conversion, formulary, ' +
        'dose optimisation, site of care — each tied to specific agents.',
      weakEvidenceToReject:
        'A total drug-spend figure with no normalisation for volume or ' +
        'acuity, or an opportunity claim with no agent-level basis.',
    },
    {
      claim: 'The dispensing-error and medication-safety rate',
      authoritativeSource:
        'The medication-safety event-reporting system reconciled against ' +
        'dispensed-dose volume, with errors classified by type and stage.',
      whatGoodEvidenceLooksLike:
        'A dispensing-error rate per dispensed doses with the error type ' +
        'and the process stage identified, and a stated view of ' +
        'reporting completeness so the rate is read honestly.',
      weakEvidenceToReject:
        'An assertion that the operation is "safe" with no measured rate, ' +
        'or a low error count with no acknowledgement of under-reporting.',
    },
    {
      claim: '340B capture and program-integrity position',
      authoritativeSource:
        'The 340B split-billing / TPA system reconciled against ' +
        'wholesaler purchases and dispensing data, alongside the most ' +
        'recent program audit or independent review.',
      whatGoodEvidenceLooksLike:
        'A measured capture rate against eligible volume with the ' +
        'compliance posture stated — eligibility-determination accuracy, ' +
        'duplicate-discount and diversion controls — so capture and ' +
        'integrity are read together.',
      weakEvidenceToReject:
        'A capture or savings figure with no compliance evidence, or a ' +
        'claimed savings number that cannot be tied to eligible ' +
        'dispenses.',
    },
    {
      claim: 'Specialty-pharmacy capture and managed-patient outcomes',
      authoritativeSource:
        'The specialty-pharmacy dispensing system compared against total ' +
        'organisation specialty-prescription volume from the EHR, with ' +
        'adherence measured on enrolled patients.',
      whatGoodEvidenceLooksLike:
        'A capture rate against the organisation’s own specialty ' +
        'prescriptions, with the share of leakage that is payer-mandated ' +
        'separated from addressable leakage, and adherence on managed ' +
        'cohorts.',
      weakEvidenceToReject:
        'A specialty-pharmacy volume figure with no denominator, or a ' +
        'capture claim that does not distinguish addressable leakage ' +
        'from payer-mandated leakage.',
    },
    {
      claim: 'The forecast value of a pharmacy AI Move',
      authoritativeSource:
        'The value model — drug-spend, captured-margin, avoided-cost, ' +
        'and throughput components, each haircut by its dominant factors ' +
        '— read against the organisation’s service mix and payer mix.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring stewardship and margin ' +
        'gains separated from the one-time inventory release, and every ' +
        'figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the 340B program-integrity ' +
        'ceiling, payer access, or adoption.',
    },
  ],
};
