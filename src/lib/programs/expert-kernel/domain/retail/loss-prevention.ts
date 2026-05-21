// Domain Function Pack — Retail · Loss prevention & shrink management.
//
// Function key: `loss_prevention`.
//
// Loss prevention & shrink management is the function that protects the
// retailer's merchandise, cash, and margin from loss — and protects the people
// and the brand while doing it. It owns the detection and reduction of shrink
// in all its forms: external theft and organised retail crime, internal
// (associate) theft, point-of-sale and refund fraud, self-checkout loss,
// administrative and process error, and vendor and supply-chain loss. It owns
// the exception analytics that turn POS, inventory, and refund data into
// investigations, the case-management discipline that runs each investigation
// to a defensible conclusion, the physical-security and safety posture of the
// store, and the governance that keeps every intervention lawful, fair, and
// safe. It is judged on a hard quadruple bind: shrink must be driven down,
// the cost of the loss-prevention programme itself must stay proportionate to
// the loss it removes, the customer and associate experience must not be
// degraded into a fortress, and every accusation, detention, and intervention
// must be lawful, evidence-based, and free of bias — because a wrong
// accusation is a legal, ethical, and brand exposure far larger than the
// merchandise.
//
// The operating reality the pack encodes: shrink is a large, structural drain
// on retail margin that has grown with organised retail crime and the spread
// of self-checkout, and the function fails in four coupled ways at once. It is
// blind — shrink is discovered as one large unexplained number at the annual
// physical count, with no early signal and no attribution, so the events that
// caused it are months past and untraceable. It is reactive — investigations
// are launched on instinct and tip-offs rather than evidence, and the highest-
// loss patterns are never prioritised. It over-spends — the programme's own
// labour, technology, and guarding cost can drift out of proportion to the
// loss it actually removes. And it carries risk — a mis-aimed accusation, a
// wrongful detention, or a biased flag is a serious legal and reputational
// loss. The AI archetypes are the recurring bets against that reality:
// shrink-anomaly and exception detection, self-checkout loss intervention,
// organised-retail-crime pattern detection, video and computer-vision loss
// analytics, refund- and POS-fraud detection, and the loss-prevention
// investigation copilot.
//
// The companion retail packs — store-operations owns the in-store execution
// and the day-to-day shrink the store controls, supply-chain-fulfillment owns
// the network loss between nodes, returns-reverse-logistics owns returns fraud
// and abuse as a returns-process control. Loss prevention & shrink management
// is the specialist function that detects, investigates, and reduces loss
// across all of those surfaces and owns the governance that keeps the
// programme lawful and fair.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const lossPreventionPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'loss_prevention',
  functionLabel: 'Loss prevention & shrink management',
  summary:
    'Loss prevention & shrink management is the function that protects the ' +
    'retailer’s merchandise, cash, and margin from loss — and protects its ' +
    'people and brand while doing it. It owns the detection and reduction ' +
    'of shrink in all its forms: external theft and organised retail ' +
    'crime, internal theft, point-of-sale and refund fraud, self-checkout ' +
    'loss, administrative error, and supply-chain loss. It owns the ' +
    'exception analytics that turn POS, inventory, and refund data into ' +
    'investigations, the case-management discipline that runs each ' +
    'investigation to a defensible conclusion, the physical-security and ' +
    'safety posture of the store, and the governance that keeps every ' +
    'intervention lawful, fair, and safe. The function is judged on a ' +
    'quadruple bind: shrink must fall, the cost of the programme itself ' +
    'must stay proportionate to the loss it removes, the customer and ' +
    'associate experience must not be turned into a fortress, and every ' +
    'accusation and detention must be lawful, evidence-based, and free of ' +
    'bias — because a wrong accusation is a legal, ethical, and brand ' +
    'exposure far larger than the merchandise. It fails when shrink is ' +
    'blind until the annual count, investigations are reactive rather than ' +
    'evidence-led, the programme over-spends on its own cost, and a ' +
    'mis-aimed intervention creates a serious liability.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'total_shrink_rate',
      name: 'Total shrink rate',
      definition:
        'Total inventory and merchandise loss — external theft, internal ' +
        'theft, fraud, administrative error, and damage — measured as the ' +
        'gap between book inventory and physically counted inventory, ' +
        'expressed as a percentage of net sales.',
      unit: '% of net sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 3,
        basis:
          'Shrink runs structurally by category, format, and exposure — ' +
          'high-theft categories, urban high-traffic stores, and ' +
          'self-checkout-heavy formats run higher. A planning range; the ' +
          'category and format mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'Physical inventory counts and cycle counts reconciled against ' +
        'book inventory in the merchandising / inventory system.',
      whyItMatters:
        'The total shrink rate is the headline measure of the function — ' +
        'a direct, dollar-for-dollar drain on margin — and every ' +
        'detection, investigation, and intervention decision is ' +
        'ultimately judged on whether it moves this number.',
    },
    {
      key: 'known_loss_share',
      name: 'Identified-cause (known-loss) share of shrink',
      definition:
        'The share of total shrink attributable to an identified, ' +
        'investigable cause — confirmed theft, fraud, or process error — ' +
        'rather than unidentified, unexplained inventory loss.',
      unit: '% of total shrink with an identified cause',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 70,
        basis:
          'The identified share depends on the maturity of exception ' +
          'analytics and investigation; the band spans a retailer that ' +
          'cannot explain its loss to one that can. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loss-prevention case-management and exception-reporting ' +
        'system, reconciled against the total physical-count shrink.',
      whyItMatters:
        'Loss the retailer cannot attribute is loss it cannot fix — a ' +
        'low identified share means shrink is absorbed blind, so this ' +
        'metric tests whether the function can act on what it loses ' +
        'rather than only count it.',
    },
    {
      key: 'shrink_detection_lead_time',
      name: 'Shrink detection lead time',
      definition:
        'The elapsed time between a loss event occurring and it being ' +
        'detected and surfaced as an investigable signal — measured ' +
        'against the alternative of discovery only at the next physical ' +
        'count.',
      unit: 'days from loss event to detection',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 90,
        basis:
          'Detection lead time spans a wide band — continuous exception ' +
          'analytics surface a pattern within days, while a retailer ' +
          'relying on the physical count waits months. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The exception-reporting and case-management systems, ' +
        'timestamping the loss event against the date a signal was ' +
        'raised.',
      whyItMatters:
        'Loss detected late is loss that compounds and becomes ' +
        'untraceable — by the time an annual-count number is visible the ' +
        'causing events are months gone, so detection lead time is the ' +
        'difference between an addressable loss and an absorbed one.',
    },
    {
      key: 'investigation_resolution_rate',
      name: 'Investigation resolution rate',
      definition:
        'The share of opened loss-prevention investigations closed with ' +
        'a defensible, evidence-based conclusion — a confirmed cause, a ' +
        'cleared subject, or a documented finding — rather than left ' +
        'open or closed inconclusive.',
      unit: '% of opened investigations closed with a defensible conclusion',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 90,
        basis:
          'Resolution rate depends on evidence quality and case-' +
          'management discipline; the band spans a backlogged, ' +
          'instinct-led process to a rigorous, evidence-led one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loss-prevention case-management system, tracking opened ' +
        'against closed-with-conclusion investigations.',
      whyItMatters:
        'An investigation that never reaches a defensible conclusion ' +
        'neither recovers loss nor deters it and consumes scarce ' +
        'investigator time — resolution rate is the throughput and ' +
        'quality measure of the investigation engine.',
    },
    {
      key: 'shrink_program_cost_ratio',
      name: 'Loss-prevention programme cost ratio',
      definition:
        'The total cost of the loss-prevention programme — investigator ' +
        'and analyst labour, security technology, guarding, and ' +
        'product-protection hardware — expressed as a ratio to the shrink ' +
        'loss it is charged with reducing.',
      unit: 'programme cost per dollar of addressed shrink',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0.15,
        high: 0.6,
        basis:
          'The cost ratio is structural by format and risk — a ' +
          'high-theft, high-ORC environment justifies a heavier ' +
          'programme; the band is a planning range, not a target, ' +
          'because too lean a programme leaves loss uncaught.',
        label: 'planning-range',
      },
      dataSource:
        'The loss-prevention budget and the finance system for programme ' +
        'cost, set against the addressable shrink it targets.',
      whyItMatters:
        'A loss-prevention programme can itself become a cost centre ' +
        'larger than the loss it removes — the cost ratio is the ' +
        'discipline that keeps the programme proportionate, read as a ' +
        'balance because under-investing simply moves the loss to ' +
        'shrink.',
    },
    {
      key: 'self_checkout_loss_rate',
      name: 'Self-checkout loss rate',
      definition:
        'Merchandise loss occurring at self-checkout — non-scans, ' +
        'mis-scans, weight-and-item manipulation, and walk-offs — ' +
        'expressed as a percentage of self-checkout sales.',
      unit: '% of self-checkout sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 6,
        basis:
          'Self-checkout loss runs materially above staffed-lane loss ' +
          'and varies with intervention technology and store profile; ' +
          'the band spans a well-controlled deployment to an exposed one. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The self-checkout and exception-analytics systems, joining ' +
        'intervention events and audit findings to self-checkout sales.',
      whyItMatters:
        'Self-checkout shifts scanning to the customer and is a ' +
        'structural shrink exposure that has grown with its adoption — ' +
        'this metric isolates that channel’s loss so it can be managed ' +
        'without abandoning the labour-cost benefit.',
    },
    {
      key: 'orc_recovery_value',
      name: 'Organised-retail-crime recovery value',
      definition:
        'The value of merchandise recovered, and loss prevented, through ' +
        'organised-retail-crime investigations — case-linked recoveries, ' +
        'interdicted theft, and prosecutions — over the period.',
      unit: 'USD of merchandise recovered or loss prevented',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50000,
        high: 5000000,
        basis:
          'ORC recovery value scales with retailer size, ORC exposure, ' +
          'and the maturity of cross-store pattern detection; the band is ' +
          'a wide planning range across retailer scale.',
        label: 'planning-range',
      },
      dataSource:
        'The case-management system and ORC investigation records, ' +
        'tracking recovered value and documented prevented loss.',
      whyItMatters:
        'Organised retail crime is concentrated, cross-store, and the ' +
        'fastest-growing shrink driver — recovery value measures whether ' +
        'the function can detect and disrupt the organised patterns that ' +
        'an isolated store-level view never sees.',
    },
    {
      key: 'false_positive_rate',
      name: 'Intervention false-positive rate',
      definition:
        'The share of loss-prevention interventions — stops, ' +
        'detentions, accusations, or flagged alerts — that prove on ' +
        'investigation to involve no actual loss or wrongdoing.',
      unit: '% of interventions found to be false positives',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'The false-positive rate depends on evidence thresholds and ' +
          'the discipline of the intervention standard; the band spans a ' +
          'high-threshold, evidence-led programme to a loose one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The case-management system, comparing intervention outcomes ' +
        'against confirmed loss or wrongdoing.',
      whyItMatters:
        'A false positive is a wrongly accused or detained customer or ' +
        'associate — a legal, ethical, and reputational exposure far ' +
        'larger than any merchandise — so this metric is the safety ' +
        'and fairness measure that bounds every detection model.',
    },
    {
      key: 'inventory_record_accuracy',
      name: 'Inventory record accuracy',
      definition:
        'The share of SKU-location records where the system on-hand ' +
        'quantity matches the physically verified count — the data ' +
        'integrity that lets a true loss be separated from a record ' +
        'error.',
      unit: '% of SKU-location records matching physical count',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 95,
        basis:
          'Record accuracy depends on receiving, cycle-count, and ' +
          'adjustment discipline; the band spans a loosely controlled ' +
          'inventory to a tightly managed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Cycle counts and physical counts reconciled against the ' +
        'perpetual inventory in the merchandising / inventory system.',
      whyItMatters:
        'Shrink can only be measured and attributed against an accurate ' +
        'book inventory — when records are wrong, true theft and process ' +
        'error are indistinguishable from data noise, so record accuracy ' +
        'is the foundation every shrink number rests on.',
    },
    {
      key: 'refund_fraud_rate',
      name: 'Refund and POS-fraud rate',
      definition:
        'The share of refund and point-of-sale transaction value ' +
        'attributable to fraud — fraudulent refunds, void and discount ' +
        'abuse, fictitious returns, and collusive transactions — as a ' +
        'percentage of total refund and adjustment value.',
      unit: '% of refund and adjustment value identified as fraud',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 12,
        basis:
          'Refund and POS-fraud share depends on transaction controls ' +
          'and exception-analytics maturity; the band spans a tightly ' +
          'controlled environment to an exposed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The exception-reporting system, analysing POS void, refund, ' +
        'discount, and no-sale patterns against confirmed fraud cases.',
      whyItMatters:
        'Refund and POS fraud is loss generated at the register itself, ' +
        'often by collusion — it is invisible to physical security and ' +
        'shows only in transaction data, so this metric tests whether ' +
        'exception analytics are catching register-level loss.',
    },
    {
      key: 'shrink_repeat_location_share',
      name: 'Repeat high-shrink location share',
      definition:
        'The share of stores or locations that remain in the worst ' +
        'shrink decile across consecutive measurement periods — a read ' +
        'on whether high-shrink sites are being corrected or persist ' +
        'untreated.',
      unit: '% of high-shrink locations repeating period over period',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Repeat share depends on whether root causes at high-shrink ' +
          'sites are diagnosed and fixed; the band spans an effective ' +
          'corrective loop to a stuck one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The shrink-reporting system, tracking location shrink rank ' +
        'across consecutive physical-count or cycle-count periods.',
      whyItMatters:
        'A store that stays in the worst shrink decile period after ' +
        'period is an untreated root cause — repeat share tests whether ' +
        'the function actually fixes high-shrink locations or simply ' +
        're-reports them.',
    },
    {
      key: 'safety_incident_rate',
      name: 'Loss-prevention safety-incident rate',
      definition:
        'The rate of safety incidents — to customers, associates, or ' +
        'loss-prevention staff — arising from theft events, ' +
        'apprehensions, and interventions, normalised per store or per ' +
        'million transactions.',
      unit: 'safety incidents per store per period',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0,
        high: 3,
        basis:
          'The incident rate depends on intervention policy and ' +
          'de-escalation discipline; the band spans a safety-first, ' +
          'non-confrontational policy to a confrontation-prone one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The incident-reporting and case-management systems, recording ' +
        'safety incidents linked to theft events and interventions.',
      whyItMatters:
        'No merchandise recovery justifies a harmed customer, associate, ' +
        'or officer — the safety-incident rate is the hard constraint on ' +
        'the function, and a rising rate is the signal that intervention ' +
        'policy has become unsafe.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'shrink_blind_until_count',
      name: 'Shrink blind until the physical count',
      description:
        'Shrink is discovered only at the annual or semi-annual physical ' +
        'count, as a single large unexplained number, with no early ' +
        'signal and no attribution between counts. By the time the loss ' +
        'is visible the events that caused it are months past and ' +
        'untraceable, and a full year of loss has already been absorbed.',
      detectionSignal:
        'Shrink is known only at count time; the identified-cause share ' +
        'is low; exception analytics on POS and inventory data are absent ' +
        'or unused between counts.',
      diagnosticQuestion:
        'How early is shrink detected between physical counts, and what ' +
        'share of loss is attributed to an identified, investigable ' +
        'cause rather than counted blind?',
    },
    {
      key: 'reactive_instinct_led_investigation',
      name: 'Reactive, instinct-led investigation',
      description:
        'Investigations are launched on tip-offs, manager instinct, and ' +
        'isolated incidents rather than on evidence and analytics, so ' +
        'investigator time is spent on visible small cases while the ' +
        'highest-loss patterns — collusive refund rings, cross-store ORC ' +
        '— go unworked and undetected.',
      detectionSignal:
        'Case openings track tip-offs not exception scores; the ' +
        'investigation backlog is unprioritised; the largest confirmed ' +
        'losses were found by chance, not by analytics.',
      diagnosticQuestion:
        'Are investigations prioritised by evidence and modelled loss ' +
        'exposure, or by instinct and tip-offs — and are the highest-' +
        'loss patterns the ones being worked?',
    },
    {
      key: 'self_checkout_loss_exposure',
      name: 'Self-checkout loss exposure',
      description:
        'Self-checkout shifts scanning to the customer and creates a ' +
        'structural shrink exposure — non-scans, mis-scans, weight ' +
        'manipulation, walk-offs — that staffed lanes did not have, and ' +
        'blunt interventions either fail to catch it or degrade the ' +
        'experience for every honest shopper.',
      detectionSignal:
        'Self-checkout loss rate runs well above staffed-lane loss; ' +
        'intervention is either rare or so frequent it slows honest ' +
        'customers; audit non-scan findings are high.',
      diagnosticQuestion:
        'How large is the self-checkout loss rate relative to staffed ' +
        'lanes, and is intervention targeted by risk or applied bluntly ' +
        'to everyone?',
    },
    {
      key: 'orc_cross_store_blindness',
      name: 'Organised-retail-crime cross-store blindness',
      description:
        'Organised retail crime operates across many stores and over ' +
        'time, but each store sees only its own isolated incidents — so ' +
        'the connecting pattern, the same crews and the same boosted ' +
        'SKUs hitting store after store, is never assembled, and the ' +
        'fastest-growing shrink driver goes undetected.',
      detectionSignal:
        'ORC incidents are logged per store with no linking; the same ' +
        'high-theft SKUs spike across a region with no connected case; ' +
        'ORC recovery value is low or untracked.',
      diagnosticQuestion:
        'How are theft incidents linked across stores and time into ' +
        'organised-crime patterns, and what cross-store ORC loss is the ' +
        'function actually detecting and disrupting?',
    },
    {
      key: 'intervention_risk_and_bias',
      name: 'Intervention risk, false positives, and bias',
      description:
        'Stops, detentions, and accusations are made on weak evidence or ' +
        'biased judgement, producing wrongful interventions that fall ' +
        'unevenly across customer groups — a serious legal, ethical, and ' +
        'reputational exposure, and the gravest failure mode the ' +
        'function carries.',
      detectionSignal:
        'The intervention false-positive rate is high or unmeasured; ' +
        'interventions and their outcomes are not analysed for ' +
        'disparate impact; complaints and claims cluster around stops.',
      diagnosticQuestion:
        'What is the false-positive rate on interventions, and are stops ' +
        'and their outcomes monitored for fairness and disparate impact ' +
        'across customer groups?',
    },
    {
      key: 'inventory_data_unreliable',
      name: 'Unreliable inventory data masking true loss',
      description:
        'Inaccurate book inventory — bad receiving, missed adjustments, ' +
        'stale records — means the shrink number conflates true theft ' +
        'and fraud with simple record error, so the function cannot tell ' +
        'real loss from data noise and chases phantom shrink.',
      detectionSignal:
        'Inventory record accuracy is low; shrink results swing widely ' +
        'count to count without a behavioural cause; large adjustments ' +
        'are common at count time.',
      diagnosticQuestion:
        'How accurate is the book inventory the shrink number is ' +
        'measured against, and how much reported shrink is actually ' +
        'record error rather than loss?',
    },
    {
      key: 'program_cost_disproportion',
      name: 'Loss-prevention programme cost disproportion',
      description:
        'The loss-prevention programme’s own cost — guarding, ' +
        'technology, product-protection hardware, investigator labour — ' +
        'drifts out of proportion to the loss it removes, with spend ' +
        'allocated by habit and store rather than by where the modelled ' +
        'loss exposure actually is.',
      detectionSignal:
        'The programme cost ratio is high or untracked; guarding and ' +
        'hardware spend does not correlate with store shrink; ' +
        'low-shrink stores carry the same protection as high-shrink ones.',
      diagnosticQuestion:
        'Is loss-prevention spend allocated to where the modelled loss ' +
        'exposure is, and how does the programme cost compare to the ' +
        'shrink it actually removes?',
    },
    {
      key: 'siloed_loss_signal',
      name: 'Siloed loss signal across channels and functions',
      description:
        'Loss signal is fragmented — POS exceptions, inventory variance, ' +
        'returns abuse, supply-chain loss, and video each sit in their ' +
        'own system — so a loss that crosses channels (a collusive ' +
        'associate refunding to an accomplice’s account) is never ' +
        'assembled into one picture.',
      detectionSignal:
        'Exception, returns-fraud, inventory, and video data are not ' +
        'joined; investigations cannot follow a loss across channels; ' +
        'the same actor recurs in separate systems with no link.',
      diagnosticQuestion:
        'How are POS, inventory, returns, supply-chain, and video loss ' +
        'signals joined, and can an investigation follow a loss pattern ' +
        'across channels and functions?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'shrink_anomaly_exception_detection',
      name: 'Shrink-anomaly and exception detection',
      valueMechanism:
        'A model continuously analyses POS transactions, inventory ' +
        'movements, adjustments, and cycle-count variance to detect loss ' +
        'patterns early — between physical counts — attributes each to a ' +
        'likely cause, and raises a prioritised, evidence-backed signal ' +
        'for investigation. Value comes from cutting shrink detection ' +
        'lead time and raising the identified-cause share, so loss is ' +
        'caught and addressed while it is still traceable rather than ' +
        'absorbed blind until the count.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'POS transaction, void, refund, discount, and no-sale data',
        'Inventory movement, adjustment, and cycle-count variance data',
        'Store, register, and associate reference data',
        'Confirmed loss-case history for model training',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags an anomaly and prioritises an investigation; a ' +
          'loss-prevention professional owns the case and any finding — ' +
          'a flag is never a finding of theft.',
        'An associate-facing flag must be handled with strict privacy, ' +
          'due process, and bias review before any action.',
        'Detection must be tuned against the false-positive cost — a ' +
          'noisy model that churns investigator time is as harmful as a ' +
          'blind one.',
      ],
      metricsMoved: [
        'total_shrink_rate',
        'known_loss_share',
        'shrink_detection_lead_time',
        'refund_fraud_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'self_checkout_loss_intervention',
      name: 'Self-checkout loss intervention',
      valueMechanism:
        'A model — combining self-checkout transaction signal, scale and ' +
        'weight data, and computer vision at the lane — scores each ' +
        'self-checkout transaction for non-scan, mis-scan, and ' +
        'manipulation risk in real time and triggers a targeted, ' +
        'proportionate intervention only on genuinely high-risk baskets. ' +
        'Value comes from cutting the self-checkout loss rate while ' +
        'leaving the honest-customer experience untouched, because ' +
        'intervention is risk-targeted rather than blanket.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Self-checkout transaction, scan, and scale or weight data',
        'Computer-vision signal at the self-checkout lane',
        'Audit and confirmed non-scan and walk-off history',
        'Item, basket, and store risk-profile data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model scores risk and prompts an intervention; a store ' +
          'associate owns the interaction and the judgement to approach ' +
          '— a score is never an accusation.',
        'Intervention must be proportionate and respectful so honest ' +
          'customers are not policed — an over-triggered model degrades ' +
          'the experience it was meant to protect.',
        'Vision and behaviour signals must be governed by surveillance, ' +
          'consent, and anti-discrimination rules and reviewed for ' +
          'disparate impact.',
      ],
      metricsMoved: [
        'self_checkout_loss_rate',
        'total_shrink_rate',
        'false_positive_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'orc_pattern_detection',
      name: 'Organised-retail-crime pattern detection',
      valueMechanism:
        'A model links theft incidents, boosted-SKU spikes, video ' +
        'identifications, and external intelligence across stores and ' +
        'over time to assemble organised-retail-crime patterns — the ' +
        'same crews and the same merchandise hitting store after store ' +
        '— and builds case-ready evidence packages. Value comes from ' +
        'raising organised-retail-crime recovery value by detecting and ' +
        'disrupting the connected patterns an isolated store-level view ' +
        'can never see.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Cross-store theft-incident and high-theft-SKU spike data',
        'Video identifications and case-linked imagery',
        'External ORC intelligence and law-enforcement bulletins',
        'Case-management and recovery history',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces and links patterns; an ORC investigator ' +
          'owns the case, the evidence package, and any referral to law ' +
          'enforcement.',
        'Identity matching and watch-listing must meet a high evidence ' +
          'standard and respect privacy and civil-rights law — a wrong ' +
          'link is a serious harm.',
        'Cross-store linking must be governed for bias and never used ' +
          'to profile by protected characteristics.',
      ],
      metricsMoved: [
        'orc_recovery_value',
        'total_shrink_rate',
        'known_loss_share',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'video_vision_loss_analytics',
      name: 'Video and computer-vision loss analytics',
      valueMechanism:
        'A computer-vision layer analyses store video to detect ' +
        'loss-relevant events — concealment, gate walk-outs, sweeps, ' +
        'fitting-room and high-theft-zone activity — and correlates them ' +
        'with POS and inventory exceptions so an investigator gets ' +
        'event-linked evidence instead of hours of raw footage. Value ' +
        'comes from raising the investigation resolution rate and the ' +
        'identified-cause share by turning passive video into ' +
        'prioritised, evidence-ready loss signal.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Store video feeds and camera-coverage metadata',
        'POS and inventory exception data for correlation',
        'A defined taxonomy of loss-relevant events',
        'Investigation outcomes for model feedback',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The vision layer detects and correlates events; an investigator ' +
          'reviews the footage and owns any finding — a detection is a ' +
          'lead, not proof.',
        'Camera deployment, retention, and any biometric or facial ' +
          'analysis must comply with surveillance, consent, and ' +
          'biometric-privacy law, which varies sharply by jurisdiction.',
        'The model must be tested for accuracy and bias across lighting, ' +
          'demographics, and store conditions and never used to profile ' +
          'customers.',
      ],
      metricsMoved: [
        'investigation_resolution_rate',
        'known_loss_share',
        'total_shrink_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'refund_pos_fraud_detection',
      name: 'Refund and POS-fraud detection',
      valueMechanism:
        'A model analyses refund, void, discount, no-sale, and ' +
        'price-override patterns by register, associate, and customer to ' +
        'detect register-level fraud — fraudulent refunds, fictitious ' +
        'returns, collusive transactions, discount abuse — and ' +
        'prioritises the highest-loss patterns for investigation. Value ' +
        'comes from cutting the refund and POS-fraud rate by catching ' +
        'collusive and transactional loss that is invisible to physical ' +
        'security and shows only in transaction data.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'POS refund, void, discount, no-sale, and override transaction ' +
          'data',
        'Associate, register, and shift reference data',
        'Customer and refund-method identifiers where available',
        'Confirmed POS-fraud and collusion case history',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model scores and prioritises; a loss-prevention or HR ' +
          'professional owns any associate case, with due process and ' +
          'representation as required.',
        'An associate-facing flag must be handled under employment law, ' +
          'privacy rules, and a documented, fair investigation process.',
        'The model must be reviewed for bias so legitimate high-refund ' +
          'roles or stores are not systematically mis-flagged.',
      ],
      metricsMoved: [
        'refund_fraud_rate',
        'known_loss_share',
        'total_shrink_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'loss_prevention_investigation_copilot',
      name: 'Loss-prevention investigation copilot',
      valueMechanism:
        'A copilot assembles each investigation’s evidence — joining POS ' +
        'exceptions, inventory variance, video events, returns abuse, ' +
        'and case history into one timeline — drafts the case ' +
        'documentation, and guides the investigator through the lawful, ' +
        'consistent steps the policy requires. Value comes from raising ' +
        'the investigation resolution rate and shrink detection lead ' +
        'time by letting investigators work more cases to a defensible, ' +
        'evidence-based conclusion.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'POS, inventory, video, and returns-abuse exception data',
        'The case-management system and investigation history',
        'The loss-prevention investigation policy and legal standards',
        'Store, associate, and incident reference data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot assembles evidence and drafts documentation; the ' +
          'investigator owns every conclusion, accusation, and action — ' +
          'the copilot never decides a case.',
        'Drafted documentation must be grounded only in the actual ' +
          'evidence — a fabricated or overstated case fact is a serious ' +
          'legal exposure.',
        'The copilot must enforce the lawful investigation process — due ' +
          'process, privacy, and consistency — and flag, never skip, a ' +
          'required step.',
      ],
      metricsMoved: [
        'investigation_resolution_rate',
        'shrink_detection_lead_time',
        'false_positive_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'continuous_loss_intelligence_layer',
      name: 'Continuous loss-intelligence layer',
      description:
        'A pattern that monitors POS exceptions, inventory variance, ' +
        'refund patterns, and self-checkout events continuously between ' +
        'physical counts, detects loss early, attributes it to a likely ' +
        'cause, and feeds a single prioritised, evidence-backed ' +
        'investigation queue to the loss-prevention team.',
      boundary:
        'It detects, attributes, and prioritises; a loss-prevention ' +
        'professional owns every case and any finding. A flag is a ' +
        'signal to investigate, never a finding of theft.',
      humanAccountabilityPoint:
        'The VP of loss prevention / asset protection accountable for ' +
        'shrink and the integrity of every investigation.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'risk_targeted_self_checkout_pattern',
      name: 'Risk-targeted self-checkout intervention pattern',
      description:
        'A pattern that scores each self-checkout transaction for loss ' +
        'risk from transaction, scale, and vision signal and triggers a ' +
        'proportionate, targeted intervention only on genuinely ' +
        'high-risk baskets — protecting the channel without policing ' +
        'every honest shopper.',
      boundary:
        'It scores risk and prompts an intervention; a store associate ' +
        'owns the interaction and the judgement to approach. It cannot ' +
        'detain or accuse, and it must leave honest baskets untouched.',
      humanAccountabilityPoint:
        'The store-operations and loss-prevention lead accountable for ' +
        'self-checkout loss and the customer experience at the lane.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'cross_store_orc_intelligence_pattern',
      name: 'Cross-store ORC-intelligence pattern',
      description:
        'A pattern that links theft incidents, boosted-SKU spikes, ' +
        'video identifications, and external intelligence across stores ' +
        'and time into organised-retail-crime cases, and assembles ' +
        'case-ready evidence packages for investigation and referral.',
      boundary:
        'It links patterns and assembles evidence; an ORC investigator ' +
        'owns the case and any law-enforcement referral. Identity ' +
        'matching meets a high evidence standard and respects privacy ' +
        'and civil-rights law.',
      humanAccountabilityPoint:
        'The ORC / investigations director accountable for organised-' +
        'crime recovery and the lawfulness of every case.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'governed_investigation_workbench',
      name: 'Governed investigation-workbench pattern',
      description:
        'A pattern that gives every investigator one workbench — the ' +
        'joined evidence timeline, drafted case documentation, and a ' +
        'guided, lawful investigation workflow — so cases are worked ' +
        'consistently, to a defensible standard, and to a documented ' +
        'conclusion.',
      boundary:
        'It assembles evidence and guides the process; the investigator ' +
        'owns every conclusion and action. It enforces the lawful ' +
        'process and flags a skipped step rather than proceeding.',
      humanAccountabilityPoint:
        'The investigations manager accountable for case quality, ' +
        'resolution rate, and due process.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'fairness_and_safety_governance_pattern',
      name: 'Fairness-and-safety governance pattern',
      description:
        'A pattern that wraps every loss-prevention detection model and ' +
        'intervention in a governance layer — false-positive monitoring, ' +
        'disparate-impact testing across customer groups, intervention ' +
        'and de-escalation standards, and a customer and associate ' +
        'recourse channel.',
      boundary:
        'It governs and audits the models and interventions; the ' +
        'loss-prevention leadership and a responsible-AI or legal ' +
        'function own the standards. It can suspend a model that fails ' +
        'a fairness or safety threshold.',
      humanAccountabilityPoint:
        'The loss-prevention leadership, with legal and responsible-AI ' +
        'oversight, accountable for the lawfulness, fairness, and safety ' +
        'of the programme.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Loss-prevention value is realised in three connected ways and a ' +
      'forecast must keep them distinct — and it carries a fourth, ' +
      'non-negotiable dimension that is a constraint, not a value lever. ' +
      'First, recovered margin: earlier, attributed detection of theft, ' +
      'fraud, and process error cuts the shrink rate and raises the ' +
      'identified-cause share — a recurring margin gain that shows up ' +
      'directly in the P&L. Second, fraud and ORC contained: register-' +
      'fraud detection and cross-store ORC pattern detection cut ' +
      'transactional and organised loss that physical security never ' +
      'sees, and raise organised-crime recovery value. Third, programme ' +
      'efficiency: prioritised, evidence-led investigation and ' +
      'risk-targeted protection let the same loss-prevention spend ' +
      'address more loss, holding the programme cost ratio in its band ' +
      'rather than letting it drift. The fourth dimension — safety and ' +
      'fairness — is a hard constraint on all three: a forecast must ' +
      'never trade a lower shrink number for a higher false-positive or ' +
      'safety-incident rate, because a wrongful detention or a harmed ' +
      'person is a loss far larger than any merchandise. The dominant ' +
      'constraint on value is data and evidence quality — detection is ' +
      'only as good as the inventory accuracy, transaction data, and ' +
      'video coverage behind it — so a forecast must be read against the ' +
      'retailer’s data readiness and the legal and fairness limits on ' +
      'intervention, not a model-perfect programme. The first three ' +
      'levers are recurring once realised; the safety-and-fairness ' +
      'constraint binds every period.',
    dominantHaircutFactors: [
      {
        factor: 'Inventory-accuracy and loss-data readiness',
        rationale:
          'Every detection model rests on accurate book inventory, ' +
          'clean transaction data, and adequate video coverage. ' +
          'Unreliable inventory records that conflate true loss with ' +
          'record error, and gaps in transaction or video data, cap how ' +
          'much of the modelled shrink reduction can actually be ' +
          'realised.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled shrink-reduction gain not realised ' +
            'because inventory records, transaction data, and video ' +
            'coverage fall short; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Legal, fairness, and intervention constraints',
        rationale:
          'Detection only converts to recovered loss through lawful, ' +
          'fair, evidence-based intervention. Civil-rights, ' +
          'consumer-protection, employment, and biometric-privacy law, ' +
          'and the false-positive cost of a wrong accusation, bound how ' +
          'aggressively any detection signal can be acted on.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'The share of a modelled detection gain bounded by legal, ' +
            'fairness, and false-positive limits on intervention; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Investigation capacity and follow-through',
        rationale:
          'A detection signal only removes loss if an investigator works ' +
          'it to a defensible conclusion and a corrective action ' +
          'follows. Limited investigator capacity and weak corrective ' +
          'follow-through at high-shrink sites cap how much detected ' +
          'loss is actually reduced.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Value erosion from limited investigation capacity and weak ' +
            'corrective follow-through on detected loss; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Shrink-driver volatility and external crime trends',
        rationale:
          'Shrink is driven partly by external forces — organised ' +
          'retail crime trends, economic conditions, local crime — that ' +
          'the retailer does not control. That volatility makes the ' +
          'baseline move under the programme and caps how cleanly a ' +
          'modelled gain can be isolated and claimed.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Forecast erosion from external crime-trend volatility that ' +
            'moves the shrink baseline independent of the programme; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Shrink-rate reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in the total shrink rate from earlier, ' +
            'attributed detection and evidence-led investigation; a ' +
            'planning range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in total shrink as a share of net ' +
          'sales.',
      },
      {
        lever: 'Self-checkout loss reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in the self-checkout loss rate from ' +
            'risk-targeted intervention; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in self-checkout loss as a share ' +
          'of self-checkout sales.',
      },
      {
        lever: 'Refund and POS-fraud reduction',
        range: {
          low: 20,
          high: 50,
          basis:
            'Relative reduction in refund and POS-fraud loss from ' +
            'transaction-level exception detection; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in refund and adjustment value ' +
          'identified as fraud.',
      },
      {
        lever: 'Investigation-throughput improvement',
        range: {
          low: 20,
          high: 60,
          basis:
            'Relative improvement in investigations resolved to a ' +
            'defensible conclusion per investigator from evidence ' +
            'assembly and a guided workbench; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in defensibly-resolved investigations ' +
          'per investigator per period.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot store group ' +
      '(exception detection live, detection lead time falling, ' +
      'investigations evidence-led); 12–24 months to a settled result, ' +
      'because the shrink rate is proven against the physical-count ' +
      'cycle and a full count-to-count period must run — and longer ' +
      'still where inventory-accuracy and video-coverage groundwork is ' +
      'needed before detection can be trusted.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Exception-reporting and loss-analytics system',
        role:
          'The system of record for transaction and inventory exception ' +
          'analytics — refund, void, discount, and variance patterns — ' +
          'and the source of the early-detection and fraud signal.',
        examples: [
          'Appriss Retail / Secure exception reporting',
          'Zebra / Reflexis loss-prevention analytics',
          'NCR Voyix loss-prevention analytics',
          'in-house exception-analytics platforms',
        ],
      },
      {
        name: 'Loss-prevention case-management system',
        role:
          'Holds every investigation — opening, evidence, subjects, ' +
          'outcome, and documentation — the backbone of the resolution-' +
          'rate, recovery, and identified-cause metrics.',
        examples: [
          'Appriss Retail case management',
          'Auror retail-crime intelligence and case management',
          'in-house case-management platforms',
        ],
      },
      {
        name: 'Video-surveillance and computer-vision system',
        role:
          'Holds store video and the vision analytics that detect ' +
          'loss-relevant events — the source of event-linked ' +
          'investigation evidence.',
        examples: [
          'Genetec video and analytics',
          'March Networks retail video',
          'Everseen / self-checkout vision platforms',
        ],
      },
      {
        name: 'Point-of-sale and self-checkout system',
        role:
          'Captures every transaction, refund, void, and self-checkout ' +
          'event — the raw transactional data POS-fraud and self-' +
          'checkout loss detection run on.',
        examples: [
          'Oracle Retail Xstore',
          'NCR Voyix POS and self-checkout',
          'Toshiba Commerce POS and self-checkout',
        ],
      },
      {
        name: 'Merchandising / inventory system',
        role:
          'Holds the perpetual book inventory and the physical-count ' +
          'and cycle-count results — the reference the shrink rate and ' +
          'record accuracy are measured against.',
        examples: [
          'Oracle Retail Merchandising',
          'enterprise inventory-management systems',
          'RFID-enabled inventory platforms',
        ],
      },
      {
        name: 'ORC-intelligence and external-data system',
        role:
          'Holds organised-retail-crime intelligence, cross-retailer ' +
          'crime sharing, and external bulletins — the source for ' +
          'cross-store ORC pattern detection.',
        examples: [
          'Auror retail-crime intelligence',
          'regional ORC associations and crime-sharing networks',
          'law-enforcement intelligence feeds',
        ],
      },
    ],
    roles: [
      {
        title: 'VP / SVP of Loss Prevention / Asset Protection',
        accountability:
          'Owns the total loss-prevention strategy, the shrink outcome ' +
          'across the enterprise, the programme budget, and the ' +
          'lawfulness and safety of the programme.',
      },
      {
        title: 'Regional loss-prevention / asset-protection manager',
        accountability:
          'Owns shrink and the loss-prevention programme for a group of ' +
          'stores — investigations, interventions, and corrective action.',
      },
      {
        title: 'Loss-prevention investigator',
        accountability:
          'Owns individual investigations — evidence, interviews, ' +
          'conclusions, and recoveries — to a lawful, defensible ' +
          'standard.',
      },
      {
        title: 'Organised-retail-crime (ORC) investigator',
        accountability:
          'Owns cross-store organised-crime cases, the evidence ' +
          'packages, and the referral and partnership with law ' +
          'enforcement.',
      },
      {
        title: 'Loss-prevention / exception analyst',
        accountability:
          'Owns the exception analytics, the detection models’ tuning, ' +
          'and the prioritised investigation queue.',
      },
      {
        title: 'Store manager',
        accountability:
          'Owns the day-to-day shrink controls in the store — process ' +
          'compliance, inventory accuracy, and the store-level ' +
          'corrective actions.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Detention, civil-rights, and consumer-protection law',
        relevance:
          'Governs shopkeeper’s-privilege detention, stops, ' +
          'accusations, and non-discrimination — the legal frame that ' +
          'bounds every customer-facing loss-prevention intervention.',
      },
      {
        name: 'Surveillance, video, and biometric-privacy regulation',
        relevance:
          'Governs store video, facial recognition, and any biometric ' +
          'analysis — rules that vary sharply by jurisdiction and bound ' +
          'video and vision loss analytics.',
      },
      {
        name: 'Employment law and associate-investigation rules',
        relevance:
          'Govern internal investigations of associates — due process, ' +
          'representation, interview conduct, and privacy — the frame ' +
          'around internal-theft and POS-fraud cases.',
      },
      {
        name: 'Data-privacy and consumer-data regulation',
        relevance:
          'Governs the customer and associate data used in detection ' +
          'and profiling — the frame that bounds cross-channel loss ' +
          'analytics and watch-listing.',
      },
      {
        name: 'Evidence, prosecution, and law-enforcement-referral rules',
        relevance:
          'Set the evidentiary standard for a defensible case and a ' +
          'lawful referral — the frame the investigation and ORC ' +
          'processes must meet for an outcome to hold.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Shrink',
        definition:
          'Inventory and merchandise loss to theft, fraud, ' +
          'administrative error, and damage — the gap between book and ' +
          'physically counted inventory.',
      },
      {
        term: 'Known vs unknown loss',
        definition:
          'Known loss is shrink attributed to an identified, ' +
          'investigable cause; unknown loss is shrink with no ' +
          'identified explanation.',
      },
      {
        term: 'Organised retail crime (ORC)',
        definition:
          'Coordinated, professional theft of retail merchandise for ' +
          'resale — typically cross-store, high-value, and crew-based.',
      },
      {
        term: 'Exception reporting',
        definition:
          'Analytics over POS and inventory data that surface ' +
          'transactions and patterns deviating from the norm as ' +
          'candidates for investigation.',
      },
      {
        term: 'Internal vs external loss',
        definition:
          'Internal loss is caused by associates — theft, fraud, ' +
          'collusion; external loss is caused by customers and outside ' +
          'actors — shoplifting and ORC.',
      },
      {
        term: 'Shopkeeper’s privilege',
        definition:
          'The limited legal right of a retailer to detain a suspected ' +
          'shoplifter for a reasonable time on reasonable, ' +
          'evidence-based grounds.',
      },
      {
        term: 'Non-scan / scan-avoidance',
        definition:
          'A self-checkout loss event in which an item is not scanned ' +
          'or is mis-scanned so it leaves without being paid for.',
      },
      {
        term: 'Product protection',
        definition:
          'Physical and electronic measures — EAS tags, locked ' +
          'fixtures, spider wraps — that deter or delay theft of ' +
          'high-risk merchandise.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Loss-Prevention Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the retailer is losing margin to shrink and ' +
        'fraud, how blind and reactive the detection is, and where the ' +
        'programme over-spends or carries risk — with baseline evidence ' +
        '— before a solution is shaped.',
      sections: [
        {
          heading: 'Loss-prevention operating context',
          guidance:
            'Name the store fleet, formats, and channels in scope, the ' +
            'loss-prevention operating and investigation model, the ' +
            'self-checkout footprint, and the ORC exposure. State which ' +
            'exception-reporting, case-management, video, POS, and ' +
            'inventory systems run the function.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — total shrink rate, known-loss share, ' +
            'detection lead time, resolution rate, programme cost ratio, ' +
            'self-checkout loss, ORC recovery, false-positive rate, ' +
            'inventory record accuracy, refund-fraud rate, repeat ' +
            'high-shrink share, safety-incident rate. For any metric not ' +
            'recorded, name it as a precise seed gap with its expected ' +
            'data source.',
        },
        {
          heading: 'Shrink composition and detection diagnostic',
          guidance:
            'Analyse how shrink breaks down across external theft, ' +
            'internal theft, fraud, and process error, how early loss is ' +
            'detected between counts, the identified-cause share, and ' +
            'how much reported shrink is masked by inventory-record ' +
            'error.',
        },
        {
          heading: 'Investigation, fraud, and ORC diagnostic',
          guidance:
            'Analyse how investigations are prioritised and resolved, ' +
            'the refund and POS-fraud rate, the self-checkout loss ' +
            'exposure, and how — or whether — theft incidents are linked ' +
            'across stores into organised-retail-crime patterns.',
        },
        {
          heading: 'Programme-cost and safety-and-fairness diagnostic',
          guidance:
            'Analyse the programme cost ratio and how spend is ' +
            'allocated against modelled loss exposure, the intervention ' +
            'false-positive rate, the safety-incident rate, and whether ' +
            'interventions are monitored for fairness and disparate ' +
            'impact.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — shrink blind until the ' +
            'count, reactive instinct-led investigation, self-checkout ' +
            'exposure, ORC cross-store blindness, intervention risk and ' +
            'bias, unreliable inventory data, programme cost ' +
            'disproportion, siloed loss signal — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — shrink reduction, self-checkout loss ' +
            'reduction, fraud reduction, investigation throughput — ' +
            'explicitly haircut by inventory-data readiness, legal and ' +
            'fairness constraints, investigation capacity, and external ' +
            'crime volatility. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'inventory record accuracy, a shrink-cause breakdown — is a ' +
            'named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt — ' +
            'with the safety and fairness constraints stated up front.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Loss-Prevention Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a ' +
        'loss-prevention AI Move — baseline, forecast, cost, the honest ' +
        'downside, and the safety-and-fairness constraint that bounds it.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recovered margin, fraud and ORC contained, and programme ' +
            'efficiency, the time-to-value band, the explicit safety-' +
            'and-fairness constraint, and the go / hold recommendation in ' +
            'one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — total shrink rate, known-loss share, self-checkout ' +
            'loss, refund-fraud rate, programme cost ratio. Where a ' +
            'baseline is a seed gap (inventory record accuracy and a ' +
            'shrink-cause breakdown are common ones), say so and state ' +
            'what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — inventory-data ' +
            'readiness, legal and fairness limits, investigation ' +
            'capacity, external crime volatility — explicitly and show ' +
            'the haircut math. Keep recovered-margin, fraud, and ' +
            'efficiency gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the exception-' +
            'reporting, case-management, video, POS, and inventory ' +
            'systems, any camera or self-checkout vision hardware, and ' +
            'the operating-model change across the investigation and ' +
            'intervention process.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker inventory accuracy, ' +
            'tighter legal and fairness constraints, limited ' +
            'investigation capacity, and a worsening external crime ' +
            'trend. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example inventory records too inaccurate to ' +
            'trust a shrink signal, or a fairness-governance framework ' +
            'not yet in place — and the evidence required before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the measurement cadence, including ' +
            'the count-cycle-lagged shrink rate and the false-positive ' +
            'and safety-incident constraint metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Loss-Prevention Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for ' +
        'the loss-prevention AI capability, grounded in the function ' +
        'reference patterns, the investigation controls, and the legal, ' +
        'fairness, and safety frames.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — continuous loss-intelligence layer, ' +
            'risk-targeted self-checkout intervention, cross-store ORC ' +
            'intelligence, governed investigation workbench, fairness-' +
            'and-safety governance — and state which apply and how they ' +
            'connect.',
        },
        {
          heading: 'Data, video, and inventory architecture',
          guidance:
            'Specify the exception-reporting, case-management, video, ' +
            'POS, self-checkout, and inventory integrations, any camera ' +
            'and self-checkout vision deployment, data freshness, and ' +
            'the inventory-accuracy discipline the detection use cases ' +
            'depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the human-in-the-loop control posture, the human ' +
            'accountability point, and how an investigator owns every ' +
            'finding. State that a flag is never a finding and define ' +
            'the evidence threshold before any intervention.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how investigation, ORC, exception-analyst, and ' +
            'store workflows change, how investigations move from ' +
            'instinct-led to evidence-led, how loss signal is joined ' +
            'across channels, and who owns each change.',
        },
        {
          heading: 'Responsible-AI, fairness, safety, and legal controls',
          guidance:
            'State the false-positive and disparate-impact monitoring, ' +
            'the intervention and de-escalation standards, the customer ' +
            'and associate recourse channel, the video and biometric-' +
            'privacy governance, and the detention, civil-rights, ' +
            'employment, and evidence frames that bound the design — ' +
            'with the authority to suspend a model that fails a fairness ' +
            'or safety threshold.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the loss-prevention systems stack, and the phased rollout ' +
            'by store group, format, and use case.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Loss-Prevention Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the loss-prevention AI ' +
        'capability so value reaches recovered margin and a lower shrink ' +
        'rate — lawfully, fairly, and safely — not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot store group, investigator and analyst onboarding, ' +
            'scale across the fleet — with milestones tied to the ' +
            'operating metrics and the count cycle.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, inventory-accuracy and data readiness, ' +
            'investigation-process adoption, ORC and fraud process, ' +
            'fairness-and-safety governance, Tower measurement.',
        },
        {
          heading: 'Investigation-team adoption approach',
          guidance:
            'Define the change runway for investigators and analysts — ' +
            'training, the shift from instinct-led to evidence-led ' +
            'casework, and the new workbench and detection-queue ' +
            'workflow — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Fairness, safety, and governance launch plan',
          guidance:
            'Define how false-positive and disparate-impact monitoring, ' +
            'intervention and de-escalation standards, and the recourse ' +
            'channel are stood up before detection drives any ' +
            'intervention, and who has the authority to suspend a model.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the count-cycle-lagged shrink rate ' +
            'and the false-positive and safety-incident constraints.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — inaccurate inventory data, legal ' +
            'and fairness exposure, false positives, investigation ' +
            'capacity, external crime-trend shifts — with the escalation ' +
            'owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it, including the fairness-and-' +
            'safety conditions that must hold.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Total shrink and what is driving it',
      authoritativeSource:
        'Physical and cycle counts reconciled against book inventory, ' +
        'with the loss-prevention exception and case-management system.',
      whatGoodEvidenceLooksLike:
        'A shrink rate with the identified-cause share quantified — ' +
        'external theft, internal theft, fraud, and process error ' +
        'separated from unexplained loss — and traced to store and ' +
        'category.',
      weakEvidenceToReject:
        'A single chain-wide shrink number known only at physical-count ' +
        'time, with no attribution and no early-detection signal.',
    },
    {
      claim: 'Inventory record accuracy underpinning the shrink number',
      authoritativeSource:
        'Cycle counts and physical counts reconciled against the ' +
        'perpetual inventory in the merchandising / inventory system.',
      whatGoodEvidenceLooksLike:
        'A measured record-accuracy rate at SKU-location level, with ' +
        'the share of reported shrink attributable to record error ' +
        'rather than true loss quantified.',
      weakEvidenceToReject:
        'A shrink figure presented with no statement of the inventory ' +
        'accuracy behind it, treating book inventory as ground truth.',
    },
    {
      claim: 'Refund, POS, and self-checkout fraud loss',
      authoritativeSource:
        'The exception-reporting system, analysing POS void, refund, ' +
        'discount, no-sale, and self-checkout patterns against confirmed ' +
        'fraud cases.',
      whatGoodEvidenceLooksLike:
        'A refund and POS-fraud rate and a self-checkout loss rate built ' +
        'from confirmed cases and exception-pattern analysis, separated ' +
        'by channel and cause.',
      weakEvidenceToReject:
        'An unmeasured fraud assumption, or a generic industry ' +
        'fraud-percentage applied with no tenant transaction-data ' +
        'evidence.',
    },
    {
      claim: 'Intervention fairness, false positives, and safety',
      authoritativeSource:
        'The case-management and incident-reporting systems, comparing ' +
        'intervention outcomes against confirmed loss and recording ' +
        'safety incidents and disparate-impact analysis.',
      whatGoodEvidenceLooksLike:
        'A measured false-positive rate and safety-incident rate, with ' +
        'interventions and their outcomes analysed for disparate impact ' +
        'across customer groups.',
      weakEvidenceToReject:
        'A programme that reports only recoveries and shrink reduction ' +
        'with no false-positive, safety, or fairness measurement.',
    },
    {
      claim: 'The forecast value of a loss-prevention AI Move',
      authoritativeSource:
        'The value model — recovered-margin, fraud-and-ORC-contained, ' +
        'and programme-efficiency components, each haircut by its ' +
        'dominant factors — read against the retailer’s data readiness ' +
        'and the legal and fairness limits on intervention.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recovered-margin, fraud, and ' +
        'efficiency gains kept distinct, the safety-and-fairness ' +
        'constraint stated, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at ' +
        'face value, or a forecast that ignores the data-readiness and ' +
        'legal-and-fairness haircuts or omits the safety constraint.',
    },
  ],
};
