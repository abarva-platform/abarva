// Domain Function Pack — Financial services · Collections & recovery.
//
// Function key: `collections_recovery`.
//
// Collections & recovery is the function that runs the bank's relationship
// with a customer whose account has fallen behind: the early-stage
// delinquency contact, the late-stage treatment, the loss-mitigation
// workout, the charge-off decision, and the post-charge-off recovery —
// across cards, consumer loans, auto, and mortgage. It owns the journey of a
// borrower who has missed a payment, and it is judged on whether that
// journey ends with the account cured, the loss minimised, the borrower
// treated fairly, and — wherever the borrower's situation allows — the
// relationship preserved. It is simultaneously a credit-loss line, a
// conduct-and-fair-treatment line, and a cost line: every dollar cured or
// recovered reduces the net charge-off, every contact is governed by
// debt-collection law that makes a wrong call a regulatory and litigation
// event, and every treatment has a cost to deliver.
//
// The operating reality the pack encodes: most collections operations are
// run as a uniform, channel-and-day-of-delinquency engine — a dialer
// campaign and a letter cycle applied to every delinquent account the same
// way — measured on contact volume rather than on cured dollars and fair
// outcomes. The function fails when it treats every delinquent borrower as
// the same: it spends expensive late-stage treatment on accounts that would
// have self-cured, it under-treats the curable accounts that needed an
// earlier, gentler touch, it pushes a hardship borrower toward a payment
// they cannot make instead of toward a loss-mitigation workout, it lets the
// roll-rate worsen because the early-stage contact strategy is blunt, and
// it cannot tell genuine inability-to-pay from unwillingness. The AI
// archetypes are the recurring bets against that reality: delinquency and
// roll-rate risk segmentation, treatment and channel optimisation,
// right-party-contact and outreach optimisation, conversational and
// digital self-cure, loss-mitigation and workout matching, and
// post-charge-off recovery scoring.
//
// CRITICAL DISCIPLINE: every consumer-protection and fair-treatment
// constraint — FDCPA contact and communication limits, Reg F, UDAAP,
// SCRA protections, fair-lending principles, validated-debt and dispute
// duties — is a HARD BOUND on this function, never a value lever. A
// forecast may never count a dollar cured or recovered at the expense of
// a permitted contact frequency, a required disclosure, an honoured
// hardship, or an equitable outcome.
//
// Its sister pack customer-servicing-contact-center owns the
// non-delinquent servicing relationship; lending-credit-underwriting
// originates the credit; collections & recovery owns the account once it
// is behind.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const collectionsRecoveryPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'collections_recovery',
  functionLabel: 'Collections & recovery',
  summary:
    'Collections & recovery is the function that runs the bank’s ' +
    'relationship with a customer whose account has fallen behind — the ' +
    'early-stage delinquency contact, the late-stage treatment, the ' +
    'loss-mitigation workout, the charge-off decision, and the ' +
    'post-charge-off recovery — across cards, consumer loans, auto, and ' +
    'mortgage. It owns the journey of a borrower who has missed a payment ' +
    'and is judged on whether that journey ends with the account cured, ' +
    'the loss minimised, the borrower treated fairly, and the relationship ' +
    'preserved wherever the borrower’s situation allows. It is a ' +
    'credit-loss line, a conduct-and-fair-treatment line, and a cost line ' +
    'at once: every dollar cured or recovered reduces net charge-offs, ' +
    'every contact is governed by debt-collection law that makes a wrong ' +
    'call a regulatory and litigation event, and every treatment has a ' +
    'cost to deliver. It fails when it treats every delinquent borrower ' +
    'the same — spending late-stage treatment on accounts that would have ' +
    'self-cured, under-treating curable accounts, pushing a hardship ' +
    'borrower toward an unaffordable payment instead of a workout, ' +
    'letting the roll-rate worsen on a blunt early-stage strategy, and ' +
    'unable to tell genuine inability-to-pay from unwillingness. Every ' +
    'consumer-protection and fair-treatment rule — FDCPA, Reg F, UDAAP, ' +
    'SCRA, fair-lending principles — is a hard bound on the function, ' +
    'never a value lever.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'roll_rate',
      name: 'Delinquency roll rate',
      definition:
        'The share of accounts in one delinquency bucket that progress ' +
        '("roll") to the next more-severe bucket in the following cycle — ' +
        'for example current-to-30, 30-to-60, 60-to-90 days past due.',
      unit: '% of a delinquency bucket rolling to the next bucket',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 55,
        basis:
          'Roll rates vary sharply by bucket, product, and credit mix — ' +
          'an early bucket rolls at a different rate than a late one, and ' +
          'cards differ from secured loans. A planning range; the bucket ' +
          'and portfolio set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The collections / loan-servicing system delinquency-bucket ' +
        'migration reporting, cycle over cycle.',
      whyItMatters:
        'The roll rate is the leading indicator of credit loss — every ' +
        'account that rolls deeper is closer to charge-off and costs more ' +
        'to treat, so containing the roll rate is the core early-stage ' +
        'objective of the function.',
    },
    {
      key: 'cure_rate',
      name: 'Cure rate',
      definition:
        'The share of delinquent accounts that return to current status ' +
        '— through payment, a catch-up, or a successful arrangement — ' +
        'within a defined window, rather than rolling deeper or charging ' +
        'off.',
      unit: '% of delinquent accounts returned to current',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 75,
        basis:
          'Cure rate depends on the delinquency stage, the product, the ' +
          'borrower mix, and treatment effectiveness; the band spans a ' +
          'weak early-stage operation to a strong one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The collections system, tracking delinquent accounts to a ' +
        'current, rolled, or charged-off outcome within the window.',
      whyItMatters:
        'The cure rate is the headline effectiveness metric of ' +
        'early-and-late-stage collections — it measures how much ' +
        'delinquency the operation reverses before it becomes a loss, and ' +
        'it is the metric treatment optimisation directly moves.',
    },
    {
      key: 'right_party_contact_rate',
      name: 'Right-party-contact rate',
      definition:
        'The share of outbound collection contact attempts that reach the ' +
        'actual borrower (the right party) and result in a substantive ' +
        'conversation, rather than no answer, a wrong number, or a ' +
        'third party.',
      unit: '% of contact attempts reaching the right party',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Right-party-contact rate is structurally low — most attempts ' +
          'do not connect — and varies with contact-data quality, ' +
          'channel mix, and timing; the band spans a poorly-targeted ' +
          'operation to a well-targeted one. A planning range; FDCPA and ' +
          'Reg F contact limits are a hard ceiling on attempts.',
        label: 'planning-range',
      },
      dataSource:
        'The dialer and outbound-contact platforms, joining contact ' +
        'attempts to right-party-contact dispositions.',
      whyItMatters:
        'A treatment only works if it reaches the borrower — a low ' +
        'right-party-contact rate wastes treatment capacity and means ' +
        'curable accounts are never actually engaged, while the fix is ' +
        'better targeting, not more dialling against legal limits.',
    },
    {
      key: 'promise_to_pay_kept_rate',
      name: 'Promise-to-pay kept rate',
      definition:
        'The share of payment promises made by borrowers during a ' +
        'collection contact that are actually kept — the payment arrives ' +
        'as agreed — rather than broken.',
      unit: '% of payment promises kept',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 80,
        basis:
          'Promise-kept rates depend on how realistically the ' +
          'arrangement matches the borrower’s capacity and on the ' +
          'delinquency stage; the band spans a pressured, unrealistic ' +
          'operation to one that sets affordable arrangements. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The collections system, joining recorded promises to subsequent ' +
        'payment posting.',
      whyItMatters:
        'A broken promise is a wasted contact and a sign the arrangement ' +
        'was unaffordable — a high kept rate signals treatment is matched ' +
        'to genuine capacity, while pressuring an unaffordable promise ' +
        'just produces a broken one and a fair-treatment risk.',
    },
    {
      key: 'net_charge_off_rate',
      name: 'Net charge-off rate',
      definition:
        'The value of loans charged off as uncollectible, net of ' +
        'recoveries, expressed as an annualised share of the average ' +
        'outstanding loan balance.',
      unit: '% of average outstanding balances, annualised',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.3,
        high: 8,
        basis:
          'Net charge-off rates vary enormously by product and credit ' +
          'mix — a prime secured book sits low, an unsecured subprime ' +
          'card book far higher — and with the credit cycle. A planning ' +
          'range; the portfolio and cycle set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-accounting and charge-off ledger, net of recoveries, ' +
        'against average outstanding balances.',
      whyItMatters:
        'The net charge-off rate is the headline credit-loss outcome of ' +
        'the function — it is the figure the CFO, the board, and ' +
        'investors watch, and the ultimate measure of whether collections ' +
        'and recovery contained the loss.',
    },
    {
      key: 'recovery_rate',
      name: 'Post-charge-off recovery rate',
      definition:
        'The share of charged-off balances eventually recovered — through ' +
        'in-house recovery, agency placement, legal recovery, or debt ' +
        'sale — expressed against the original charged-off principal.',
      unit: '% of charged-off balances recovered',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5,
        high: 35,
        basis:
          'Recovery rates depend on product, collateral, the age of the ' +
          'debt, and the recovery channel; the band spans an unsecured ' +
          'aged book to a fresher or secured one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The recovery-management system, tracking post-charge-off cash ' +
        'against the charged-off principal by vintage and channel.',
      whyItMatters:
        'Recovery is revenue won back on a loss already taken — it ' +
        'directly offsets the net charge-off rate, and the metric shows ' +
        'how effectively the recovery operation and its channel mix turn ' +
        'a written-off balance back into cash.',
    },
    {
      key: 'cost_to_collect',
      name: 'Cost to collect',
      definition:
        'The fully-loaded cost of running collections and recovery — ' +
        'staffing, dialer and technology, agency and legal fees — as a ' +
        'share of the dollars cured and recovered.',
      unit: '% of dollars cured and recovered',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'Cost to collect varies with the delinquency stage mix, ' +
          'automation maturity, and the in-house versus agency split; ' +
          'the band spans an efficient operation to a high-touch one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Collections-and-recovery department financials reconciled ' +
        'against cured and recovered dollars.',
      whyItMatters:
        'It is the efficiency ratio of the function — mis-targeted ' +
        'treatment, wasted dialling, and over-staffing of self-curing ' +
        'accounts drive it up, so it is the metric treatment and channel ' +
        'optimisation directly attacks.',
    },
    {
      key: 'self_cure_rate',
      name: 'Self-cure rate',
      definition:
        'The share of newly delinquent accounts that return to current ' +
        'without any collections treatment at all — the borrower simply ' +
        'pays — within an early window.',
      unit: '% of new delinquencies curing with no treatment',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Self-cure is largest in the earliest delinquency bucket and ' +
          'on prime accounts; the band spans a higher-risk book to a ' +
          'prime one. A planning range — a high self-cure share is an ' +
          'opportunity to save treatment cost, not a target to manage.',
        label: 'planning-range',
      },
      dataSource:
        'The collections system, identifying early-bucket accounts that ' +
        'cure before any treatment is applied.',
      whyItMatters:
        'Self-curing accounts need no expensive treatment — identifying ' +
        'them lets the operation withhold cost and contact from borrowers ' +
        'who do not need it, concentrating treatment on the accounts ' +
        'genuinely at risk of rolling.',
    },
    {
      key: 'loss_mitigation_completion_rate',
      name: 'Loss-mitigation completion rate',
      definition:
        'The share of borrowers entering a loss-mitigation or workout ' +
        'process — forbearance, modification, repayment plan, hardship ' +
        'arrangement — who reach a completed, sustainable outcome rather ' +
        'than falling out or re-defaulting.',
      unit: '% of workout entries reaching a sustainable outcome',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 80,
        basis:
          'Completion depends on how well the workout is matched to the ' +
          'borrower’s genuine capacity and on process friction; the band ' +
          'spans a poorly-matched process to a well-matched one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loss-mitigation / workout case system, tracking entries to ' +
        'a completed, fallen-out, or re-defaulted outcome.',
      whyItMatters:
        'Loss mitigation is how a genuine-hardship borrower avoids ' +
        'charge-off and the bank avoids a worse loss — a low completion ' +
        'rate signals workouts mis-matched to capacity or a process too ' +
        'hard to navigate, and a high re-default rate is a fair-treatment ' +
        'as well as a loss concern.',
    },
    {
      key: 'redefault_rate',
      name: 'Workout re-default rate',
      definition:
        'The share of accounts that completed a modification or workout ' +
        'and subsequently fell delinquent again within a defined window — ' +
        'the durability test of the workout.',
      unit: '% of completed workouts re-defaulting within the window',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 40,
        basis:
          'Re-default rates depend on how realistically the workout ' +
          'terms matched the borrower’s sustainable capacity; the band ' +
          'spans a well-structured workout book to an over-optimistic ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system, tracking post-workout accounts for ' +
        'subsequent delinquency.',
      whyItMatters:
        'A re-default means the workout failed — the loss is taken ' +
        'anyway, later, with more cost in between — so re-default rate is ' +
        'the honesty check on loss-mitigation: a workout that was set too ' +
        'optimistically just delays the charge-off.',
    },
    {
      key: 'complaint_rate',
      name: 'Collections complaint rate',
      definition:
        'The number of formally logged complaints arising from ' +
        'collections and recovery activity per unit of delinquent ' +
        'account base — including complaints routed via a regulator such ' +
        'as the CFPB.',
      unit: 'complaints per 1,000 delinquent accounts per month',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 15,
        basis:
          'Collections complaint rate depends on contact discipline, ' +
          'treatment tone, dispute handling, and capture completeness; ' +
          'the band spans a well-controlled operation to a complaint-' +
          'prone one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The complaint-management system, filtered to collections-and-' +
        'recovery-driven complaints and joined to the delinquent-account ' +
        'base.',
      whyItMatters:
        'Collections is one of the most heavily regulated and ' +
        'complaint-sensitive functions in the bank — a rising complaint ' +
        'rate is the leading signal of FDCPA, Reg F, or UDAAP exposure ' +
        'and is the metric that proves fair treatment is holding as a ' +
        'hard bound, not eroding under collection pressure.',
    },
    {
      key: 'contacts_per_resolution',
      name: 'Contacts per resolution',
      definition:
        'The average number of collection contact attempts and ' +
        'interactions required to reach a resolution — a cure, an ' +
        'arrangement, or a workout — on a delinquent account.',
      unit: 'contact attempts per resolved account',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Contacts per resolution depend on targeting quality, channel ' +
          'effectiveness, and right-party-contact rates; the band spans ' +
          'a precisely-targeted operation to a high-effort one. A ' +
          'planning range — bounded by FDCPA and Reg F contact limits.',
        label: 'planning-range',
      },
      dataSource:
        'The collections and dialer systems, joining contact-attempt ' +
        'volume to resolution outcomes per account.',
      whyItMatters:
        'It is the treatment-efficiency metric — a high figure means ' +
        'effort is being spread thin or mis-targeted, and reducing it by ' +
        'better targeting (never by exceeding contact limits) lowers cost ' +
        'and reduces the contact pressure borrowers experience.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'uniform_treatment',
      name: 'Uniform treatment of every delinquent account',
      description:
        'The operation runs one dialer-and-letter cycle against every ' +
        'delinquent account regardless of risk, capacity, or curability. ' +
        'Self-curing accounts get expensive, unnecessary contact, ' +
        'genuinely at-risk accounts get the same blunt touch as everyone ' +
        'else, and treatment cost is mis-allocated across the whole book.',
      detectionSignal:
        'Treatment is keyed only to days-past-due and product, not to a ' +
        'risk or curability score; cost to collect is high and the ' +
        'self-cure share is unmeasured or unused.',
      diagnosticQuestion:
        'Is collections treatment differentiated by an account’s genuine ' +
        'roll-risk and curability, or applied uniformly by ' +
        'days-past-due and product?',
    },
    {
      key: 'wasted_blunt_outreach',
      name: 'Wasted, blunt outreach missing the right party',
      description:
        'Outreach is run as a high-volume dialer campaign on stale ' +
        'contact data at fixed times, so most attempts never reach the ' +
        'borrower. Capacity is burned on no-answers and wrong numbers ' +
        'while curable accounts are never genuinely engaged — and the ' +
        'instinctive fix, dialling harder, runs straight into FDCPA and ' +
        'Reg F contact limits.',
      detectionSignal:
        'Right-party-contact rate is low; contact attempts per account ' +
        'are high; channel mix is dialer-dominant with little use of ' +
        'digital or self-service outreach.',
      diagnosticQuestion:
        'How well does outreach reach the right party on the right ' +
        'channel at the right time, and is the response to a low ' +
        'contact rate better targeting or simply more dialling?',
    },
    {
      key: 'pressure_over_affordability',
      name: 'Pressure for a payment over an affordable arrangement',
      description:
        'Agents are measured on dollars promised today, so they push ' +
        'borrowers toward the largest promise they will agree to rather ' +
        'than an arrangement matched to genuine capacity. The promise ' +
        'breaks, the account rolls anyway, the borrower is worse off, and ' +
        'the pressured contact is a fair-treatment and UDAAP exposure.',
      detectionSignal:
        'Promise-to-pay kept rate is low; broken promises cluster on ' +
        'large arrangements; agent incentives reward promised dollars ' +
        'over kept dollars or sustainable outcomes.',
      diagnosticQuestion:
        'Are arrangements set to the borrower’s genuine, evidenced ' +
        'capacity to pay, or to the largest promise pressure can ' +
        'extract — and does that show in the promise-kept rate?',
    },
    {
      key: 'hardship_misrouting',
      name: 'Genuine hardship mis-routed away from loss mitigation',
      description:
        'The operation cannot reliably distinguish a borrower in genuine ' +
        'inability-to-pay from one who is simply unwilling, so ' +
        'hardship borrowers are kept in a standard collection cycle ' +
        'instead of being routed to a forbearance, modification, or ' +
        'workout that could produce a sustainable outcome — and SCRA, ' +
        'bereavement, or other protected situations are missed.',
      detectionSignal:
        'Loss-mitigation entry is low relative to the hardship ' +
        'population; workout completion is weak; complaints cite hardship ' +
        'not being recognised; protected-status flags are caught late.',
      diagnosticQuestion:
        'How early and reliably does the operation identify genuine ' +
        'hardship and protected-status borrowers and route them to loss ' +
        'mitigation rather than standard collection treatment?',
    },
    {
      key: 'overoptimistic_workouts',
      name: 'Over-optimistic workouts that re-default',
      description:
        'Workouts and modifications are structured on optimistic ' +
        'assumptions about the borrower’s recovery, so the new payment is ' +
        'still beyond sustainable capacity. The account completes the ' +
        'workout, re-defaults within months, and the loss is taken ' +
        'anyway — later and with more cost.',
      detectionSignal:
        'Re-default rate after workout is high; workout terms are set ' +
        'with thin verification of sustainable income and expenses; ' +
        'completion rate looks healthy but durability does not.',
      diagnosticQuestion:
        'Are workout terms set against verified, sustainable borrower ' +
        'capacity, and is the re-default rate tracked as the real test ' +
        'of whether loss mitigation worked?',
    },
    {
      key: 'late_stage_value_destruction',
      name: 'Value destroyed at the charge-off and recovery boundary',
      description:
        'Charge-off timing, agency placement, legal-action decisions, ' +
        'and debt-sale choices are made on crude rules rather than on the ' +
        'expected recovery value of each account, so accounts are placed ' +
        'in the wrong channel, charged off too early, or pursued through ' +
        'costly legal action where the expected recovery never justified ' +
        'it.',
      detectionSignal:
        'Recovery rate is low or flat; channel placement is rule-based ' +
        'not value-based; legal-recovery cost is high relative to amounts ' +
        'recovered; debt-sale pricing is not informed by recovery scoring.',
      diagnosticQuestion:
        'Are charge-off timing, recovery-channel placement, and legal ' +
        'and debt-sale decisions driven by the expected recovery value ' +
        'of each account, or by blunt rules?',
    },
    {
      key: 'compliance_treated_as_friction',
      name: 'Consumer-protection rules treated as friction to manage',
      description:
        'FDCPA and Reg F contact limits, validation and dispute duties, ' +
        'UDAAP constraints, and SCRA protections are treated as ' +
        'obstacles to collection rather than hard bounds. Contact ' +
        'frequency is pushed to the edge, disputes slow the cure so they ' +
        'are under-handled, and the operation runs a standing regulatory ' +
        'and litigation exposure.',
      detectionSignal:
        'Contact frequency runs at or above limits; dispute handling is ' +
        'slow or incomplete; the collections complaint rate is rising; ' +
        'compliance findings recur in audit and exam.',
      diagnosticQuestion:
        'Are FDCPA, Reg F, UDAAP, and SCRA requirements engineered into ' +
        'the operation as hard bounds, or treated as friction to be ' +
        'minimised under collection pressure?',
    },
    {
      key: 'reactive_loss_blindness',
      name: 'Reactive blindness to the building loss',
      description:
        'Delinquency, roll-rate, and loss forecasting are coarse and ' +
        'lagging, so a deteriorating segment, an economic shift, or a ' +
        'rising vintage loss is recognised only after it has rolled ' +
        'deep. Treatment capacity, loss provisions, and staffing are ' +
        'always responding to last quarter rather than the building ' +
        'loss.',
      detectionSignal:
        'Roll-rate and loss forecasts are coarse and lag actuals; ' +
        'treatment capacity and provisions are set reactively; emerging ' +
        'high-risk segments are spotted late.',
      diagnosticQuestion:
        'How early does the operation see a building loss in roll-rate ' +
        'and vintage signals, and how quickly does treatment capacity ' +
        'and provisioning respond?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'delinquency_roll_risk_segmentation',
      name: 'Delinquency and roll-rate risk segmentation',
      valueMechanism:
        'A model scores every delinquent account for its probability of ' +
        'rolling deeper, of self-curing, and of charging off — segmenting ' +
        'the book by genuine roll-risk and curability rather than by ' +
        'days-past-due alone. Value comes from concentrating treatment ' +
        'cost on the accounts genuinely at risk of rolling, withholding ' +
        'expensive contact from accounts that will self-cure, and giving ' +
        'the earlier-stage operation a forward view of the building loss.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Account delinquency history, payment behaviour, and ' +
          'bucket-migration data',
        'Borrower credit, balance, product, and relationship data',
        'Historical roll, cure, and charge-off outcomes for training',
        'Macroeconomic and portfolio-segment signals',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model scores and segments; collections leadership owns the ' +
          'treatment policy each segment maps to and can override.',
        'Segmentation must not become a fair-lending or fair-treatment ' +
          'breach — risk segments cannot proxy a protected class, and ' +
          'every segment is owed a compliant, fair treatment path.',
        'A model trained through one credit environment drifts as the ' +
          'cycle turns — it must be revalidated against fresh roll and ' +
          'cure outcomes.',
      ],
      metricsMoved: [
        'roll_rate',
        'cure_rate',
        'self_cure_rate',
        'cost_to_collect',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'treatment_channel_optimization',
      name: 'Treatment and channel optimisation',
      valueMechanism:
        'A model matches each delinquent account to the treatment and ' +
        'channel most likely to cure it within consumer-protection ' +
        'limits — a digital nudge, a self-service reminder, an outbound ' +
        'call, a letter, an agent conversation — rather than running one ' +
        'uniform cycle. Value comes from lifting the cure rate and ' +
        'cutting cost to collect by spending the right treatment intensity ' +
        'on the right account, and by shifting curable accounts to ' +
        'lower-cost digital channels.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Account risk and curability segmentation',
        'Historical treatment-and-channel outcome data by segment',
        'Borrower channel preferences and consented contact channels',
        'FDCPA / Reg F contact-frequency and timing constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends the treatment-and-channel path; collections ' +
          'operations owns the treatment policy and any account-level ' +
          'override.',
        'Contact frequency, timing, and channel rules under FDCPA and ' +
          'Reg F are hard constraints the optimiser operates strictly ' +
          'within — efficiency is never bought by exceeding a contact ' +
          'limit.',
        'Treatment intensity must be matched to risk fairly — a higher-' +
          'risk segment cannot be subjected to harsher or more frequent ' +
          'contact than the rules and fair-treatment principles allow.',
      ],
      metricsMoved: [
        'cure_rate',
        'cost_to_collect',
        'contacts_per_resolution',
        'roll_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'right_party_contact_outreach_optimization',
      name: 'Right-party-contact and outreach optimisation',
      valueMechanism:
        'A model predicts, for each account, the channel, time, and ' +
        'sequence of outreach most likely to reach the actual borrower in ' +
        'a substantive conversation — within the permitted contact ' +
        'window — and prioritises and paces the outbound queue ' +
        'accordingly. Value comes from raising the right-party-contact ' +
        'rate and cutting wasted attempts so treatment capacity reaches ' +
        'curable borrowers, without ever increasing contact beyond legal ' +
        'limits.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Contact-attempt history, dispositions, and right-party-contact ' +
          'outcomes',
        'Verified borrower contact data and channel availability',
        'Borrower channel preferences and consented contact methods',
        'FDCPA / Reg F permitted-contact windows and frequency limits',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model prioritises and times outreach; collections ' +
          'operations owns the contact strategy and the dialer ' +
          'configuration.',
        'Permitted contact times, frequency caps, and channel-consent ' +
          'rules under FDCPA and Reg F are hard, non-negotiable bounds — ' +
          'the optimiser maximises reach strictly inside them.',
        'Outreach must respect cease-communication requests, dispute ' +
          'holds, and bankruptcy and protected-status flags ' +
          'immediately and absolutely.',
      ],
      metricsMoved: [
        'right_party_contact_rate',
        'contacts_per_resolution',
        'cost_to_collect',
        'cure_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'conversational_digital_self_cure',
      name: 'Conversational and digital self-cure',
      valueMechanism:
        'A conversational AI assistant and digital self-service flow let ' +
        'a delinquent borrower resolve the account on their own terms — ' +
        'see the amount, make a payment, set an affordable arrangement ' +
        'within pre-approved bounds, or request hardship help — in a ' +
        'private, low-pressure digital channel. Value comes from curing ' +
        'accounts at a fraction of agent cost, lifting the cure rate by ' +
        'meeting borrowers who avoid a collection call, and reaching ' +
        'borrowers who will self-serve but not answer the phone.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Authenticated account, balance, and delinquency data',
        'Pre-approved arrangement and hardship-option parameters by ' +
          'segment',
        'A current, compliance-governed collections knowledge base',
        'Borrower digital-channel access and consent',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The assistant resolves only within pre-approved arrangement ' +
          'bounds behind strong authentication; anything outside scope, ' +
          'and any hardship signal, is a warm transfer to a trained ' +
          'agent.',
        'All collections communications, disclosures, and validation ' +
          'and dispute rights apply in the digital channel exactly as ' +
          'they do with an agent — FDCPA, Reg F, and UDAAP bind the ' +
          'assistant fully.',
        'The assistant must never pressure a borrower toward an ' +
          'unaffordable arrangement and must surface hardship and ' +
          'loss-mitigation options plainly, not bury them.',
      ],
      metricsMoved: [
        'cure_rate',
        'cost_to_collect',
        'self_cure_rate',
        'promise_to_pay_kept_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'loss_mitigation_workout_matching',
      name: 'Loss-mitigation and workout matching',
      valueMechanism:
        'A model identifies borrowers in genuine inability-to-pay early ' +
        'and matches each to the loss-mitigation option — forbearance, ' +
        'modification, repayment plan, settlement — most likely to ' +
        'produce a sustainable, non-re-defaulting outcome given their ' +
        'verified capacity. Value comes from routing hardship borrowers ' +
        'to a workout instead of a futile collection cycle, lifting ' +
        'workout completion, and cutting the re-default that destroys the ' +
        'value of a workout.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Borrower income, expense, and verified capacity-to-pay data',
        'Hardship indicators, protected-status flags, and prior ' +
          'arrangement history',
        'Historical workout outcomes and re-default data by option type',
        'Loss-mitigation programme eligibility and policy parameters',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model recommends a loss-mitigation option; a trained ' +
          'workout specialist verifies capacity, owns the offer, and owns ' +
          'every approval and denial decision.',
        'A loss-mitigation denial or option offered must respect ' +
          'fair-lending, ECOA adverse-action, and any programme rules — ' +
          'the model never autonomously denies relief, and reasons are ' +
          'explainable to the borrower.',
        'Capacity assessments must use genuine, verified borrower data; ' +
          'an over-optimistic workout that re-defaults is both a loss and ' +
          'a fair-treatment failure.',
      ],
      metricsMoved: [
        'loss_mitigation_completion_rate',
        'redefault_rate',
        'net_charge_off_rate',
        'cure_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'post_charge_off_recovery_scoring',
      name: 'Post-charge-off recovery scoring',
      valueMechanism:
        'A model scores each charged-off account for its expected ' +
        'recovery value and the channel — in-house recovery, agency ' +
        'placement, legal recovery, debt sale — most likely to realise ' +
        'it efficiently. Value comes from placing each account in the ' +
        'right recovery channel, focusing costly legal action where the ' +
        'expected recovery justifies it, informing debt-sale pricing, ' +
        'and lifting the overall recovery rate against the same ' +
        'charged-off principal.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Charged-off account, balance, vintage, and product data',
        'Borrower contactability, asset, and prior-payment signals',
        'Historical recovery outcomes by channel and account profile',
        'Agency, legal-recovery, and debt-sale cost and performance data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model scores and recommends channel placement; recovery ' +
          'leadership owns placement policy and any legal-action or ' +
          'debt-sale decision.',
        'Legal action and recovery activity must comply with FDCPA, ' +
          'time-barred-debt rules, and litigation-conduct standards — the ' +
          'model never triggers legal action autonomously.',
        'Debt-sale and agency placement must transfer accurate, ' +
          'validated account data and exclude disputed, bankrupt, ' +
          'deceased, and protected accounts.',
      ],
      metricsMoved: [
        'recovery_rate',
        'net_charge_off_rate',
        'cost_to_collect',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'risk_tiered_treatment_engine',
      name: 'Risk-tiered treatment engine',
      description:
        'A pattern that scores every delinquent account for roll-risk, ' +
        'self-cure likelihood, and curability and maps it to a ' +
        'differentiated treatment and channel path — withholding ' +
        'treatment from likely self-curers, concentrating it on the ' +
        'genuinely at-risk — replacing one uniform days-past-due cycle ' +
        'with risk-tiered treatment inside the consumer-protection ' +
        'frame.',
      boundary:
        'It scores and recommends a treatment tier; collections ' +
        'operations owns the treatment policy and any override, and ' +
        'every tier maps to a compliant, fair treatment path. It does ' +
        'not contact borrowers itself.',
      humanAccountabilityPoint:
        'The head of collections accountable for treatment strategy, ' +
        'the cure rate, and fair-treatment outcomes.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'compliant_outreach_orchestration',
      name: 'Compliant outreach-orchestration pattern',
      description:
        'A pattern that orchestrates outbound contact across dialer, ' +
        'digital, and self-service channels — predicting the channel, ' +
        'time, and sequence most likely to reach the right party — ' +
        'while enforcing FDCPA and Reg F contact-frequency, timing, ' +
        'consent, and cease-communication rules as hard, system-level ' +
        'constraints the orchestration cannot breach.',
      boundary:
        'It prioritises, paces, and times outreach within the legal ' +
        'frame; collections operations owns the contact strategy. The ' +
        'contact limits, consent, and cease-communication rules are ' +
        'enforced absolutely and are not configurable away.',
      humanAccountabilityPoint:
        'The collections-operations lead accountable for outreach ' +
        'effectiveness and contact compliance.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'digital_self_cure_layer',
      name: 'Digital self-cure layer',
      description:
        'A pattern that fronts collections with an authenticated digital ' +
        'and conversational self-cure layer — letting a borrower see the ' +
        'amount, pay, set a pre-approved affordable arrangement, or ' +
        'request hardship help privately — behind which a trained agent ' +
        'handles anything outside pre-approved bounds and every hardship ' +
        'signal.',
      boundary:
        'It resolves only within pre-approved arrangement bounds behind ' +
        'strong authentication; a trained agent owns hardship, ' +
        'loss-mitigation, and any out-of-bounds case. It applies every ' +
        'collections disclosure and validation right.',
      humanAccountabilityPoint:
        'The collections leader accountable for digital self-cure and ' +
        'its compliance and fair-treatment posture.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'loss_mitigation_matching_pattern',
      name: 'Loss-mitigation matching pattern',
      description:
        'A pattern that identifies genuine-hardship and protected-status ' +
        'borrowers early, verifies sustainable capacity, and matches each ' +
        'to the loss-mitigation option most likely to produce a durable, ' +
        'non-re-defaulting outcome — drafting the offer and the borrower ' +
        'communications for a workout specialist to verify and decide.',
      boundary:
        'It identifies, recommends, and drafts; a workout specialist ' +
        'verifies capacity and owns every approval, denial, and offer. ' +
        'It does not autonomously approve or deny relief, and adverse ' +
        'actions follow ECOA notice rules.',
      humanAccountabilityPoint:
        'The loss-mitigation manager accountable for sustainable workout ' +
        'outcomes, the re-default rate, and fair-treatment compliance.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'value_based_recovery_placement',
      name: 'Value-based recovery-placement pattern',
      description:
        'A pattern that scores every charged-off account for expected ' +
        'recovery value and routes it to the recovery channel — in-house, ' +
        'agency, legal, or debt sale — that realises that value most ' +
        'efficiently, replacing crude placement rules with value-based ' +
        'recovery routing and informing debt-sale pricing.',
      boundary:
        'It scores and recommends placement; recovery leadership owns ' +
        'placement policy and every legal-action and debt-sale decision. ' +
        'It does not trigger legal action and excludes disputed, ' +
        'bankrupt, deceased, and protected accounts.',
      humanAccountabilityPoint:
        'The head of recovery accountable for the recovery rate, ' +
        'channel-placement policy, and recovery-conduct compliance.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'loss_forecasting_early_warning',
      name: 'Loss-forecasting early-warning pattern',
      description:
        'A pattern that forecasts roll rates, cure rates, and vintage ' +
        'losses forward — folding in portfolio-segment and ' +
        'macroeconomic signals — so a building loss is seen before it ' +
        'rolls deep, and treatment capacity, staffing, and loss ' +
        'provisions can be set against the forecast rather than last ' +
        'quarter.',
      boundary:
        'It forecasts and surfaces emerging risk; credit-risk and ' +
        'collections leadership own the capacity, staffing, and ' +
        'provisioning decisions. It does not set provisions or staffing ' +
        'itself.',
      humanAccountabilityPoint:
        'The credit-risk and collections leadership accountable for loss ' +
        'forecasting, treatment capacity, and provisioning.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Collections-and-recovery value is realised in three connected ' +
      'ways and a forecast must keep them distinct. First, credit-loss ' +
      'reduction: better roll-risk segmentation, sharper treatment, ' +
      'earlier and better-matched loss mitigation, and stronger outreach ' +
      'cure more accounts before they roll to charge-off — this lands in ' +
      'a lower net charge-off rate and is the largest and most durable ' +
      'lever. Second, recovery uplift: value-based recovery placement and ' +
      'recovery scoring win back more cash on losses already taken, ' +
      'offsetting the charge-off. Third, cost-to-collect reduction: ' +
      'risk-tiered treatment, digital self-cure, and right-party-contact ' +
      'optimisation handle and cure delinquency at lower cost by spending ' +
      'the right treatment on the right account and shifting curable ' +
      'volume to low-cost digital channels. The dominant and ' +
      'non-negotiable constraint is that consumer-protection and ' +
      'fair-treatment rules — FDCPA and Reg F contact and communication ' +
      'limits, UDAAP, SCRA protections, validation and dispute duties, ' +
      'fair-lending principles — are HARD BOUNDS, not value levers: a ' +
      'forecast may never count a dollar cured or recovered that depends ' +
      'on exceeding a contact limit, skipping a disclosure, pressuring an ' +
      'unaffordable promise, or denying a deserved hardship. The other ' +
      'dominant constraint is the credit cycle — loss outcomes are ' +
      'driven heavily by the macroeconomic environment the bank does not ' +
      'control — so a forecast must be read against the cycle and the ' +
      'portfolio, not a benign baseline. Loss-reduction and cost gains ' +
      'are recurring once realised; recovery uplift tracks the ' +
      'charge-off flow.',
    dominantHaircutFactors: [
      {
        factor: 'Credit-cycle and macroeconomic environment',
        rationale:
          'Roll rates, cure rates, and charge-offs are driven heavily ' +
          'by unemployment, rates, and the broader economy — none of ' +
          'which the bank controls. A loss-reduction forecast built in a ' +
          'benign environment can be overwhelmed by a downturn, so the ' +
          'cycle caps how much of a modelled gain is attributable to the ' +
          'capability rather than the environment.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'The share of a modelled loss-reduction gain that the ' +
            'credit cycle can mask or reverse; a planning range driven ' +
            'by the macro outlook and portfolio.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Consumer-protection and fair-treatment ceiling',
        rationale:
          'FDCPA and Reg F contact limits, UDAAP, SCRA, and validation ' +
          'and dispute duties are hard bounds. Any modelled gain that ' +
          'implicitly relied on more contact, more pressure, or thinner ' +
          'compliance is simply not reachable — the compliant ceiling ' +
          'haircuts the modelled cure and cost upside.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'The share of a modelled cure or cost gain that is not ' +
            'reachable without breaching contact limits, fair-treatment, ' +
            'or dispute duties; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Borrower-capacity and data-quality readiness',
        rationale:
          'Risk segmentation, workout matching, and recovery scoring ' +
          'only work to the extent payment history, contact data, and ' +
          'verified borrower income-and-expense data are complete and ' +
          'current. Stale contact data and thin capacity verification ' +
          'cap how much of the modelled value the use cases can deliver.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Value erosion from stale contact data, incomplete payment ' +
            'history, and thin borrower-capacity verification; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Workout durability and re-default risk',
        rationale:
          'Loss-mitigation value is only realised if workouts hold. An ' +
          'over-optimistic workout that re-defaults takes the loss ' +
          'anyway, later and with more cost in between, so the modelled ' +
          'loss-mitigation gain is haircut by the share of workouts that ' +
          'do not durably hold.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The share of a modelled loss-mitigation gain lost to ' +
            'workout re-default; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Operating-model and agent adoption',
        rationale:
          'The treatment, outreach, and recovery gains only land if ' +
          'collections operations actually run to the new segmentation ' +
          'and routing and agents trust them. Partial adoption, with the ' +
          'old uniform cycle running alongside, realises only a fraction ' +
          'of the modelled gain.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Forecast erosion from partial adoption of the new treatment ' +
            'and routing operating model; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Net-charge-off-rate reduction',
        range: {
          low: 3,
          high: 15,
          basis:
            'Relative reduction in the net charge-off rate from better ' +
            'roll-risk segmentation, treatment, and loss mitigation; a ' +
            'planning range spanning early and mature adoption, before ' +
            'the credit-cycle haircut.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the net charge-off rate, ' +
          'controlled for the credit environment.',
      },
      {
        lever: 'Cure-rate uplift',
        range: {
          low: 2,
          high: 10,
          basis:
            'Percentage-point uplift in the cure rate from risk-tiered ' +
            'treatment, channel optimisation, and digital self-cure; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the share of delinquent accounts ' +
          'returned to current.',
      },
      {
        lever: 'Cost-to-collect reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in cost to collect from risk-tiered ' +
            'treatment, digital self-cure, and reduced wasted outreach; ' +
            'a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in cost to collect as a share of ' +
          'dollars cured and recovered.',
      },
      {
        lever: 'Post-charge-off recovery uplift',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative uplift in the recovery rate from value-based ' +
            'channel placement and recovery scoring; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent uplift in recovered cash against the ' +
          'charged-off principal.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first operational signal in a pilot portfolio or ' +
      'delinquency stage (right-party-contact rate, cure rate, cost to ' +
      'collect); 12–24 months to a settled loss result, because roll, ' +
      'cure, charge-off, and re-default outcomes only prove out once a ' +
      'full account cohort cycles through delinquency and a meaningful ' +
      'span of the credit cycle has passed.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Collections / loan-servicing system',
        role:
          'The system of record for delinquent accounts — delinquency ' +
          'buckets, treatment status, promises, arrangements, and ' +
          'bucket-migration data; the source of roll, cure, and ' +
          'self-cure metrics.',
        examples: [
          'FIS / Fiserv collections modules',
          'CGI / FICO collections platforms',
          'specialist collections-management systems',
        ],
      },
      {
        name: 'Dialer and outbound-contact platform',
        role:
          'Runs and paces outbound voice, SMS, and digital collection ' +
          'contact, enforces contact-frequency and timing rules, and ' +
          'records dispositions — the source of right-party-contact and ' +
          'contact-attempt data.',
        examples: [
          'predictive and compliant dialer platforms',
          'omnichannel collections-outreach systems',
          'digital-messaging collection platforms',
        ],
      },
      {
        name: 'Loss-mitigation / workout case system',
        role:
          'Manages forbearance, modification, repayment-plan, and ' +
          'hardship cases through eligibility, capacity verification, ' +
          'offer, and outcome — the source of loss-mitigation completion ' +
          'and re-default data.',
        examples: [
          'loss-mitigation modules of the servicing platform',
          'mortgage default-management systems',
          'workout and hardship case-management tools',
        ],
      },
      {
        name: 'Recovery-management system',
        role:
          'Tracks charged-off accounts through in-house recovery, agency ' +
          'placement, legal recovery, and debt sale — the source of ' +
          'recovery-rate and channel-performance data.',
        examples: [
          'recovery and post-charge-off management platforms',
          'agency-placement and oversight systems',
          'debt-sale management tools',
        ],
      },
      {
        name: 'Loan-accounting and charge-off ledger',
        role:
          'The financial system of record for outstanding balances, ' +
          'charge-offs, recoveries, and the loss provision — the source ' +
          'of the net charge-off rate.',
        examples: [
          'core loan-accounting systems',
          'general-ledger and allowance / CECL systems',
          'credit-loss provisioning platforms',
        ],
      },
      {
        name: 'Complaint-management and compliance system',
        role:
          'Captures, tracks, and reports collections-driven complaints ' +
          'and disputes, including regulator-routed complaints — the ' +
          'source of the collections complaint rate and conduct ' +
          'monitoring.',
        examples: [
          'complaint-management platforms',
          'GRC complaint and conduct registers',
          'dispute and validation-tracking tools',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of Collections & Recovery',
        accountability:
          'Owns the total collections-and-recovery strategy and ' +
          'outcome — the net charge-off and recovery contribution, the ' +
          'cost to collect, and the conduct record.',
      },
      {
        title: 'Director of early-stage collections',
        accountability:
          'Owns early-bucket delinquency treatment — the roll rate, the ' +
          'cure rate, treatment strategy, and the early-stage operation.',
      },
      {
        title: 'Director of late-stage collections and loss mitigation',
        accountability:
          'Owns late-stage treatment, loss mitigation and workouts, the ' +
          'charge-off decision, and sustainable workout outcomes.',
      },
      {
        title: 'Head of recovery',
        accountability:
          'Owns post-charge-off recovery — the recovery rate, ' +
          'recovery-channel placement, agency oversight, legal recovery, ' +
          'and debt sale.',
      },
      {
        title: 'Collections compliance and conduct officer',
        accountability:
          'Owns adherence to FDCPA, Reg F, UDAAP, SCRA, and ' +
          'fair-treatment requirements, dispute and validation handling, ' +
          'and complaint oversight.',
      },
      {
        title: 'Credit-risk and loss-forecasting lead',
        accountability:
          'Owns roll-rate and loss forecasting, the loss provision, and ' +
          'the link between portfolio credit risk and collections ' +
          'capacity.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Fair Debt Collection Practices Act (FDCPA)',
        relevance:
          'Governs debt-collection communications and conduct — contact ' +
          'limits, prohibited practices, validation and dispute rights — ' +
          'a hard bound on every collection contact, directly and where ' +
          'it informs first-party collection standards.',
      },
      {
        name: 'Regulation F — debt-collection rule',
        relevance:
          'Implements and extends the FDCPA with specific ' +
          'contact-frequency caps, communication and consent rules, and ' +
          'disclosure requirements — a hard, system-enforced bound on ' +
          'outreach orchestration.',
      },
      {
        name: 'UDAAP — unfair, deceptive, or abusive acts or practices',
        relevance:
          'Prohibits unfair, deceptive, or abusive collection conduct — ' +
          'misleading a borrower, pressuring an unaffordable promise, or ' +
          'obscuring hardship options is a UDAAP violation, bounding ' +
          'every treatment and communication.',
      },
      {
        name: 'Servicemembers Civil Relief Act (SCRA) and ' +
          'military-protection rules',
        relevance:
          'Provides interest-rate caps and protections against certain ' +
          'collection and foreclosure actions for servicemembers — a ' +
          'protected-status frame the operation must detect and honour ' +
          'early.',
      },
      {
        name: 'ECOA / Regulation B and fair-lending principles',
        relevance:
          'Govern non-discrimination and adverse-action notice in ' +
          'credit decisions — bounding loss-mitigation eligibility, ' +
          'denial, and any risk segmentation so it cannot proxy a ' +
          'protected class.',
      },
      {
        name: 'Bankruptcy, time-barred-debt, and litigation-conduct ' +
          'rules',
        relevance:
          'Govern collection once a borrower is in bankruptcy, the ' +
          'treatment of out-of-statute debt, and conduct in legal ' +
          'recovery and debt sale — hard constraints on late-stage ' +
          'recovery activity.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Delinquency bucket',
        definition:
          'A band of days past due — current, 30, 60, 90, 120+ — that ' +
          'classifies how far behind an account is and drives treatment.',
      },
      {
        term: 'Roll rate',
        definition:
          'The share of accounts in one delinquency bucket that progress ' +
          'to the next more-severe bucket in the following cycle.',
      },
      {
        term: 'Cure',
        definition:
          'The return of a delinquent account to current status through ' +
          'payment, catch-up, or a successful arrangement.',
      },
      {
        term: 'Charge-off',
        definition:
          'The accounting recognition that a loan balance is ' +
          'uncollectible and is removed from active receivables, ' +
          'typically at a regulatory days-past-due threshold.',
      },
      {
        term: 'Right-party contact',
        definition:
          'An outbound contact attempt that reaches the actual borrower ' +
          'in a substantive conversation, as distinct from a no-answer, ' +
          'wrong number, or third party.',
      },
      {
        term: 'Promise to pay',
        definition:
          'A borrower’s commitment, recorded during a contact, to make a ' +
          'payment of a stated amount by a stated date.',
      },
      {
        term: 'Loss mitigation',
        definition:
          'The set of workout options — forbearance, modification, ' +
          'repayment plan, settlement — offered to a hardship borrower to ' +
          'avoid charge-off and a worse loss.',
      },
      {
        term: 'Re-default',
        definition:
          'A return to delinquency by an account that had completed a ' +
          'modification or workout — the durability test of loss ' +
          'mitigation.',
      },
      {
        term: 'Recovery',
        definition:
          'Cash collected on a balance after it has been charged off, ' +
          'through in-house effort, agency, legal action, or debt sale.',
      },
      {
        term: 'Validation of debt',
        definition:
          'The debt-collection requirement to provide a borrower, on ' +
          'request or notice, with evidence and details of the debt ' +
          'being collected.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Collections-and-Recovery Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the collections-and-recovery operation is taking ' +
        'avoidable credit loss, mis-spending treatment, and carrying ' +
        'conduct risk — uniform treatment, blunt outreach, hardship ' +
        'mis-routing, over-optimistic workouts, recovery value ' +
        'destruction — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Portfolio and operation context',
          guidance:
            'Name the collections-and-recovery operation in scope — ' +
            'products and portfolios, delinquency and charge-off volume, ' +
            'the early / late / recovery stage split, the in-house and ' +
            'agency mix, and the operating model. State which ' +
            'collections, dialer, loss-mitigation, recovery, and ' +
            'complaint systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — roll rate, cure rate, ' +
            'right-party-contact rate, promise-kept rate, net charge-off ' +
            'rate, recovery rate, cost to collect, self-cure rate, ' +
            'loss-mitigation completion, re-default rate, complaint ' +
            'rate, contacts per resolution. For any metric not recorded, ' +
            'name it as a precise seed gap with its expected data source.',
        },
        {
          heading: 'Delinquency, roll-rate, and loss diagnostic',
          guidance:
            'Analyse where delinquency builds and rolls, how it differs ' +
            'by product, vintage, and segment, how much is self-curing, ' +
            'and whether treatment is differentiated by genuine ' +
            'roll-risk and curability or applied uniformly by ' +
            'days-past-due.',
        },
        {
          heading: 'Treatment, loss-mitigation, and recovery diagnostic',
          guidance:
            'Analyse outreach effectiveness and right-party contact, ' +
            'whether arrangements match borrower capacity, how early ' +
            'genuine hardship is routed to loss mitigation, whether ' +
            'workouts hold or re-default, and whether recovery placement ' +
            'is value-based or rule-based.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — uniform treatment, blunt ' +
            'wasted outreach, pressure over affordability, hardship ' +
            'mis-routing, over-optimistic workouts, recovery value ' +
            'destruction, compliance treated as friction, reactive loss ' +
            'blindness — and state which are present, with the detection ' +
            'signal and supporting evidence.',
        },
        {
          heading: 'Compliance and fair-treatment baseline',
          guidance:
            'State the current FDCPA, Reg F, UDAAP, and SCRA posture — ' +
            'contact-frequency adherence, dispute and validation ' +
            'handling, protected-status detection, the collections ' +
            'complaint trend — as the hard-bound baseline any Move must ' +
            'hold, never erode.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — net-charge-off reduction, cure-rate ' +
            'uplift, cost-to-collect reduction, recovery uplift — ' +
            'explicitly haircut by the credit cycle, the ' +
            'consumer-protection ceiling, data quality, workout ' +
            'durability, and adoption. Every figure a labelled planning ' +
            'range.',
        },
        {
          heading: 'Evidence gaps, asks, and recommended Move framing',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks; then state which AI ' +
            'use-case archetype(s) the evidence points to and why, and ' +
            'what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Collections-and-Recovery Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a ' +
        'collections-and-recovery AI Move on this operation — baseline, ' +
        'forecast, cost, and the honest downside — with the ' +
        'consumer-protection frame held as a hard bound and the credit ' +
        'cycle made explicit.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'credit-loss reduction, recovery uplift, and ' +
            'cost-to-collect reduction, the time-to-value band, and the ' +
            'go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — net charge-off rate, roll rate, cure rate, cost to ' +
            'collect, recovery rate. Where a baseline is a seed gap, say ' +
            'so and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast, haircuts, and the credit cycle',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — the credit cycle, ' +
            'the consumer-protection ceiling, data quality, workout ' +
            'durability, adoption — explicitly and show the haircut ' +
            'math. Separate the capability gain from the cycle and keep ' +
            'loss, recovery, and cost gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the collections, ' +
            'dialer, loss-mitigation, recovery, loan-accounting, and ' +
            'complaint systems, and the operating-model change — the ' +
            'shift to risk-tiered treatment and value-based recovery ' +
            'placement.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under an adverse credit cycle, ' +
            'weaker data quality, and higher workout re-default. State ' +
            'the downside the CFO is underwriting.',
        },
        {
          heading: 'Compliance and fair-treatment posture',
          guidance:
            'State the consumer-protection controls the design holds as ' +
            'hard bounds — FDCPA and Reg F contact limits, UDAAP-safe ' +
            'treatment, SCRA and protected-status handling, validation ' +
            'and dispute duties, fair-lending in segmentation and ' +
            'loss-mitigation decisions — and confirm no modelled value ' +
            'depends on weakening them.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example contact data too stale to target ' +
            'outreach, or a compliance posture that would have to bend ' +
            'to hit the forecast — and the evidence required before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the measurement cadence, how the ' +
            'capability gain is separated from the credit cycle, and how ' +
            'the lagged net-charge-off and re-default metrics are read.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Collections-and-Recovery Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'collections-and-recovery AI capability, grounded in the function ' +
        'reference patterns and the consumer-protection and ' +
        'fair-treatment frame as a hard-bound constraint.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — risk-tiered treatment engine, compliant ' +
            'outreach orchestration, digital self-cure layer, ' +
            'loss-mitigation matching, value-based recovery placement, ' +
            'loss-forecasting early warning — and state which apply and ' +
            'how they connect across the delinquency lifecycle.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the collections, dialer, loss-mitigation, ' +
            'recovery, loan-accounting, and complaint integrations, the ' +
            'borrower contact-and-capacity data, the bucket-migration ' +
            'and outcome history, and the data freshness the use cases ' +
            'depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and ' +
            'the escalation path. Define where human approval is ' +
            'required — loss-mitigation decisions, legal action — and ' +
            'the model-revalidation cadence as the cycle turns.',
        },
        {
          heading: 'Consumer-protection controls as hard bounds',
          guidance:
            'Specify how FDCPA and Reg F contact-frequency, timing, ' +
            'consent, and cease-communication limits, UDAAP constraints, ' +
            'SCRA and protected-status detection, and validation and ' +
            'dispute duties are engineered into the architecture as ' +
            'system-enforced, non-configurable bounds — never ' +
            'optimisation parameters.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how early-stage, late-stage, loss-mitigation, and ' +
            'recovery workflows change, how treatment moves from uniform ' +
            'to risk-tiered, how agent incentives shift from promised to ' +
            'kept and sustainable dollars, and who owns each change.',
        },
        {
          heading: 'Responsible-AI, fairness, and rollout approach',
          guidance:
            'State the fair-lending and bias controls on segmentation ' +
            'and loss-mitigation models, the explainability and ' +
            'adverse-action posture, the build sequence, and the phased ' +
            'rollout by portfolio and delinquency stage.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Collections-and-Recovery Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the collections-and-recovery AI ' +
        'capability so value reaches the net charge-off and recovery ' +
        'lines and the conduct record, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot portfolio or delinquency stage, agent and specialist ' +
            'onboarding, scale across the lifecycle — with milestones ' +
            'tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, model and segmentation validation, ' +
            'compliance and fair-treatment sign-off, agent and ' +
            'specialist adoption, recovery-channel changes, Tower ' +
            'measurement.',
        },
        {
          heading: 'Agent and specialist adoption approach',
          guidance:
            'Define the change runway for collections agents and ' +
            'loss-mitigation and recovery specialists — training, the ' +
            'shift to risk-tiered treatment and value-based placement, ' +
            'and the move from promised dollars to kept and sustainable ' +
            'outcomes — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Compliance and fair-treatment assurance plan',
          guidance:
            'Define how FDCPA and Reg F contact limits, UDAAP, SCRA, ' +
            'and dispute and validation duties are monitored in ' +
            'production, how the collections complaint rate is watched, ' +
            'and how a compliance breach triggers an immediate hold — ' +
            'the discipline that keeps fair treatment a hard bound.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged net-charge-off and ' +
            're-default metrics and the credit-cycle controls.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — credit-cycle deterioration, model ' +
            'drift, compliance or fair-treatment breach, workout ' +
            're-default, stale contact data, partial adoption — with the ' +
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
      claim: 'The roll-rate and cure-rate performance of the book',
      authoritativeSource:
        'The collections / loan-servicing system bucket-migration ' +
        'reporting, cycle over cycle, by product and vintage.',
      whatGoodEvidenceLooksLike:
        'Roll and cure rates computed by delinquency bucket, product, ' +
        'and vintage, with the self-cure share separated, so treatment ' +
        'effectiveness is distinguished from accounts that would have ' +
        'cured anyway.',
      weakEvidenceToReject:
        'A single blended delinquency or cure figure with no bucket, ' +
        'product, or vintage breakdown, or a cure number that does not ' +
        'separate self-cure from treated cure.',
    },
    {
      claim: 'The net charge-off rate and the credit-loss outcome',
      authoritativeSource:
        'The loan-accounting and charge-off ledger, net of recoveries, ' +
        'against average outstanding balances.',
      whatGoodEvidenceLooksLike:
        'A net charge-off rate by product and vintage, with recoveries ' +
        'shown and the credit-environment context stated, so the ' +
        'capability’s contribution is separable from the cycle.',
      weakEvidenceToReject:
        'A charge-off figure with no recovery netting, no vintage view, ' +
        'or no acknowledgement of the credit environment that drove it.',
    },
    {
      claim: 'Whether collection contact stays within the legal frame',
      authoritativeSource:
        'The dialer and outbound-contact platforms and the ' +
        'complaint-management system, measured against FDCPA and Reg F ' +
        'contact-frequency, timing, and consent rules.',
      whatGoodEvidenceLooksLike:
        'Contact-frequency and timing measured against the legal limits ' +
        'with any breaches shown, cease-communication and dispute holds ' +
        'evidenced, and the collections complaint trend tracked.',
      weakEvidenceToReject:
        'A contact-volume number with no view of frequency against ' +
        'limits, or a claim of compliance with no breach, dispute, or ' +
        'complaint evidence behind it.',
    },
    {
      claim: 'Whether loss-mitigation workouts are durable',
      authoritativeSource:
        'The loss-mitigation case system and loan-servicing system, ' +
        'tracking completed workouts for subsequent re-default.',
      whatGoodEvidenceLooksLike:
        'A re-default rate measured on completed workouts over a ' +
        'defined window, with the capacity-verification basis of the ' +
        'workout terms shown, so durability is tested, not assumed.',
      weakEvidenceToReject:
        'A workout completion rate presented as success with no ' +
        're-default tracking, or workout terms set with no verified ' +
        'borrower-capacity basis.',
    },
    {
      claim: 'The forecast value of a collections-and-recovery AI Move',
      authoritativeSource:
        'The value model — credit-loss-reduction, recovery-uplift, and ' +
        'cost-to-collect components, each haircut by its dominant ' +
        'factors — read against the credit cycle and the portfolio.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the capability gain separated from ' +
        'the credit cycle, the consumer-protection ceiling held as a ' +
        'hard bound, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point loss-reduction number, a vendor ROI claim taken ' +
        'at face value, or a forecast that ignores the credit cycle or ' +
        'assumes harder contact and thinner compliance.',
    },
  ],
};
