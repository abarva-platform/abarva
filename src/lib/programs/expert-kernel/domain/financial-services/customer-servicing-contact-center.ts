// Domain Function Pack — Financial services · Customer servicing & contact
// center.
//
// Function key: `customer_servicing_contact_center`.
//
// Customer servicing & contact center is the function that runs the bank's
// service relationship with the account holder after onboarding: the voice
// contact center and IVR, the digital service channels — secure messaging,
// chat, in-app and online banking servicing — the email and social queues,
// and the back-office servicing operations that sit behind them. It owns the
// journey of a customer with a question, a problem, or a request — a card
// declined, a fee they do not recognise, a payment that did not arrive, a
// transaction they want to dispute, an address change, a statement query —
// and it is judged on whether that journey ends with the issue resolved,
// resolved once, resolved fast, resolved in compliance, and the customer
// still banking with the institution. It is simultaneously a cost line, a
// fair-treatment line, and a retention line: every contact has a cost to
// serve, every contact is governed by consumer-protection rules that make
// a wrong answer a regulatory event, and every contact is a moment that
// either repairs or erodes a relationship measured in deposit balances and
// product holdings.
//
// The operating reality the pack encodes: most bank servicing operations are
// run as a cost centre measured on handle time and queue length, staffed
// reactively to a volume they forecast poorly, and blind to the upstream
// product, fee, and digital defects that generate the contacts in the first
// place. The function fails when it treats demand as a given rather than a
// symptom: it scales agents to absorb avoidable contacts instead of removing
// them, it routes work by queue rather than by intent and customer value, it
// resolves the ticket without resolving the cause, it lets a fee or dispute
// query slide into a UDAAP or Reg E exposure, and it cannot tell a genuinely
// deflected self-service journey from a customer who simply gave up. The AI
// archetypes are the recurring bets against that reality: conversational
// servicing and authenticated self-service, agent assist and real-time
// guidance, intelligent contact routing and triage, contact-driver and
// quality-and-compliance intelligence, service-demand forecasting and
// scheduling, and proactive servicing outreach.
//
// Its sister financial-services packs originate the deposit, the loan, and
// the payment; customer servicing is where a broken product experience
// lands. The collections-recovery pack owns the delinquent-account
// conversation specifically; customer servicing owns every other servicing
// contact and the fair-treatment discipline that governs them.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const customerServicingContactCenterPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'customer_servicing_contact_center',
  functionLabel: 'Customer servicing & contact center',
  summary:
    'Customer servicing & contact center is the function that runs the ' +
    'bank’s service relationship with the account holder after onboarding ' +
    '— the voice contact center and IVR, the digital servicing channels ' +
    '(secure messaging, chat, in-app and online banking), the email and ' +
    'social queues, and the back-office servicing operations behind them. ' +
    'It owns the journey of a customer with a question, a problem, or a ' +
    'request — a declined card, an unrecognised fee, a missing payment, a ' +
    'transaction dispute, an address change — and is judged on whether ' +
    'that journey ends resolved, resolved once, resolved fast, resolved in ' +
    'compliance, and the customer still banking with the institution. It ' +
    'is a cost line, a fair-treatment line, and a retention line at once: ' +
    'every contact has a cost to serve, is governed by consumer-protection ' +
    'rules that make a wrong answer a regulatory event, and is a moment ' +
    'that repairs or erodes a relationship measured in balances and ' +
    'product holdings. It fails when it treats contact demand as a given ' +
    'rather than a symptom — scaling agents to absorb avoidable contacts ' +
    'instead of removing the upstream product, fee, or digital defect, ' +
    'routing by queue rather than by intent and value, resolving the ' +
    'ticket without resolving the cause, letting a fee or dispute query ' +
    'slide into a UDAAP or Reg E exposure, and unable to tell genuine ' +
    'self-service deflection from a customer who simply gave up.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'first_contact_resolution',
      name: 'First-contact resolution (FCR)',
      definition:
        'The share of servicing contacts fully resolved in a single ' +
        'interaction — no callback, no re-contact on the same issue, no ' +
        'escalation needed — measured across voice and digital channels.',
      unit: '% of contacts resolved on the first interaction',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 85,
        basis:
          'First-contact resolution varies by issue mix and channel — a ' +
          'balance enquiry resolves high, a transaction dispute or a ' +
          'complex fee dispute resolves lower. A planning range; the ' +
          'contact-type mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM / servicing case system, joining a contact to any ' +
        're-contact on the same issue within a defined window.',
      whyItMatters:
        'It is the single best read on whether servicing actually solves ' +
        'the customer’s problem — a low FCR multiplies cost through repeat ' +
        'contacts and is the strongest in-contact driver of whether the ' +
        'customer leaves satisfied or moves their relationship.',
    },
    {
      key: 'average_handle_time',
      name: 'Average handle time (AHT)',
      definition:
        'The average time an agent spends actively handling a servicing ' +
        'contact — talk or chat time plus after-contact wrap-up and case ' +
        'notes — across the period, by channel.',
      unit: 'minutes per agent-handled contact',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 4,
        high: 12,
        basis:
          'Handle time is structural by channel and issue complexity — ' +
          'voice runs longer than chat, a Reg E dispute intake longer than ' +
          'a balance check. A planning range, not a target — cutting it ' +
          'below the band sacrifices resolution quality and compliance.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center / CCaaS platform, capturing handle and wrap-up ' +
        'time per contact by channel and issue type.',
      whyItMatters:
        'It is the core unit-cost driver of agent-handled servicing, but ' +
        'it must be read as a balance — squeezing handle time at the ' +
        'expense of first-contact resolution or a complete dispute intake ' +
        'simply pushes cost and regulatory risk into the second contact.',
    },
    {
      key: 'cost_per_contact',
      name: 'Cost per contact',
      definition:
        'The fully-loaded operating cost — agent labour, technology, and ' +
        'overhead — of handling one servicing contact, computed by ' +
        'channel.',
      unit: 'USD per contact',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 14,
        basis:
          'Cost per contact spans an enormous range by channel — ' +
          'authenticated self-service is a fraction of a voice contact — ' +
          'and by labour market and complexity. A planning range; the ' +
          'channel mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center cost ledger and workforce-management system, ' +
        'allocated to contact volume by channel.',
      whyItMatters:
        'It is the function’s cost-to-serve metric — it tells the bank ' +
        'what each servicing interaction costs and is the figure every ' +
        'deflection, automation, and channel-shift decision moves.',
    },
    {
      key: 'service_level',
      name: 'Service level',
      definition:
        'The share of contacts answered or accepted within a defined ' +
        'target wait — the classic "X% answered in Y seconds" measure of ' +
        'queue responsiveness across voice, chat, and messaging.',
      unit: '% of contacts answered within the target wait',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 90,
        basis:
          'Service level depends on how well staffing tracks demand and ' +
          'the target wait chosen; the band spans an under-staffed queue ' +
          'to a well-resourced one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center / automatic-call-distribution platform, ' +
        'measuring answered contacts against the target wait threshold.',
      whyItMatters:
        'It is the access read on the servicing operation — a queue that ' +
        'misses service level drives abandonment, repeat contacts, and ' +
        'frustration, and it is the first metric to break when demand is ' +
        'mis-forecast.',
    },
    {
      key: 'contact_abandonment_rate',
      name: 'Contact abandonment rate',
      definition:
        'The share of customers who join a servicing queue — voice, chat, ' +
        'or callback — and leave before reaching an agent or resolution.',
      unit: '% of queued contacts abandoned before resolution',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Abandonment depends on wait time, the queue experience, and ' +
          'whether a callback option exists; the band spans a responsive ' +
          'operation to a congested one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center platform, identifying queued contacts that ' +
        'disconnect before agent contact or resolution.',
      whyItMatters:
        'An abandoned contact is an unresolved problem and an unmeasured ' +
        'failure — it often masquerades as deflection while the customer ' +
        'leaves with the issue intact, so it is the honesty check on the ' +
        'service-access numbers.',
    },
    {
      key: 'digital_self_service_resolution_rate',
      name: 'Digital self-service resolution rate',
      definition:
        'The share of servicing journeys started in an authenticated ' +
        'digital channel — in-app, online banking, virtual assistant, IVR ' +
        'self-service — that reach resolution without an agent, distinct ' +
        'from sessions that abandon or escalate.',
      unit: '% of self-service journeys resolved without an agent',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 70,
        basis:
          'Self-service resolution depends on the breadth of authenticated ' +
          'servicing actions exposed and the capability of the ' +
          'conversational layer; the band spans a thin estate to a mature ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The digital banking and virtual-assistant platforms, measured by ' +
        'genuine resolution rather than session start, with abandons and ' +
        'escalations separated.',
      whyItMatters:
        'It is the honest read on deflection — only a journey that ends ' +
        'resolved without an agent removed cost, so this metric separates ' +
        'a genuinely served customer from one who gave up or escalated.',
    },
    {
      key: 'customer_satisfaction_score',
      name: 'Customer satisfaction score (CSAT)',
      definition:
        'The share of post-contact survey respondents who rate the ' +
        'servicing interaction as satisfied or better — the customer’s ' +
        'immediate verdict on the service they received.',
      unit: '% of surveyed contacts rated satisfied or better',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 75,
        high: 92,
        basis:
          'CSAT varies by channel, issue type, and survey method; the band ' +
          'spans a strained servicing operation to a strong one. A ' +
          'planning range; survey design and issue mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The post-contact survey platform, scored per contact and ' +
        'segmented by channel, issue type, and agent.',
      whyItMatters:
        'It is the customer’s direct rating of the servicing moment — a ' +
        'falling CSAT, especially on high-value relationships or a ' +
        'specific issue type, is the leading signal of the attrition that ' +
        'shows up later in balances and product holdings.',
    },
    {
      key: 'transferred_escalated_contact_rate',
      name: 'Transferred / escalated contact rate',
      definition:
        'The share of contacts that a first-tier agent cannot resolve and ' +
        'must transfer to another queue, a specialist team, or a ' +
        'supervisor — including transfers to a back-office servicing team.',
      unit: '% of contacts transferred or escalated beyond first tier',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 25,
        basis:
          'Transfer and escalation depend on agent enablement, the breadth ' +
          'of first-tier authority, and issue complexity; the band spans a ' +
          'well-equipped front line to one that hands work up. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center and CRM systems, tracking contacts ' +
        'transferred beyond the first-tier agent and to whom.',
      whyItMatters:
        'A transfer is slow, expensive, and frustrating — the customer ' +
        'often re-authenticates and re-explains — and a high rate signals ' +
        'the front line lacks the knowledge or authority to resolve, a ' +
        'direct drag on first-contact resolution and cost.',
    },
    {
      key: 'dispute_resolution_cycle_time',
      name: 'Dispute resolution cycle time',
      definition:
        'The average elapsed time from a customer raising a transaction ' +
        'dispute or claim to a final resolution decision communicated to ' +
        'the customer, across card, ACH, and other dispute types.',
      unit: 'calendar days from dispute intake to final resolution',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 45,
        basis:
          'Dispute cycle time is bounded by network chargeback rules and ' +
          'Reg E / Reg Z investigation timeframes and varies by dispute ' +
          'type; the band spans an efficient operation to a backlogged ' +
          'one. A planning range — the regulatory clocks are hard limits, ' +
          'not targets to optimise past.',
        label: 'planning-range',
      },
      dataSource:
        'The dispute / chargeback management system, time-stamped from ' +
        'intake to final resolution by dispute type.',
      whyItMatters:
        'Dispute cycle time is both a customer-experience metric and a ' +
        'compliance metric — Reg E and Reg Z set hard provisional-credit ' +
        'and investigation deadlines, and a slow operation breaches them, ' +
        'turning a service delay into a regulatory finding.',
    },
    {
      key: 'complaint_rate',
      name: 'Complaint rate',
      definition:
        'The number of formally logged customer complaints per unit of ' +
        'customer or account base over the period — including complaints ' +
        'raised directly and those routed via a regulator such as the ' +
        'CFPB.',
      unit: 'complaints per 10,000 active accounts per month',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 20,
        basis:
          'Complaint rate depends on product mix, fee structure, digital ' +
          'reliability, and how completely complaints are captured; the ' +
          'band spans a clean operation to a complaint-heavy one. A ' +
          'planning range — capture completeness sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The complaint-management system, joined to the active-account ' +
        'base and including regulator-routed complaints.',
      whyItMatters:
        'The complaint rate is the headline fair-treatment and conduct ' +
        'signal — a rising rate, or a cluster on one product or fee, is ' +
        'the leading indicator of a UDAAP or consumer-harm issue that ' +
        'supervisors and the board watch closely.',
    },
    {
      key: 'complaint_resolution_time',
      name: 'Complaint resolution time',
      definition:
        'The average elapsed time from a complaint being logged to a ' +
        'final response and resolution communicated to the customer, ' +
        'against the institution’s and any regulatory response standard.',
      unit: 'calendar days from complaint logged to final response',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 25,
        basis:
          'Complaint resolution time depends on complaint severity, the ' +
          'investigation required, and operational capacity; the band ' +
          'spans a responsive operation to a slow one. A planning range — ' +
          'regulator response windows are a hard ceiling.',
        label: 'planning-range',
      },
      dataSource:
        'The complaint-management system, time-stamped from logging to ' +
        'final response by complaint category.',
      whyItMatters:
        'Slow complaint resolution compounds consumer harm and breaches ' +
        'regulator response expectations — it is the metric that converts ' +
        'a single complaint into an escalated, supervised conduct issue.',
    },
    {
      key: 'authentication_pass_rate',
      name: 'Authentication pass rate',
      definition:
        'The share of inbound servicing contacts where the customer is ' +
        'successfully and securely authenticated without failing out, ' +
        'being routed to manual identity verification, or abandoning.',
      unit: '% of contacts authenticated successfully on first attempt',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 96,
        basis:
          'Authentication pass rate depends on the strength and friction ' +
          'of the identity method and the fraud-risk posture; the band ' +
          'spans a high-friction process to a smooth one. A planning ' +
          'range — it cannot be pushed up by weakening fraud controls.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-center authentication and identity-verification ' +
        'systems, measured against total authenticated contact attempts.',
      whyItMatters:
        'Authentication is the gate on every servicing contact — a low ' +
        'pass rate adds handle time, frustrates customers, and drives ' +
        'abandonment, while a method made frictionless by weakening ' +
        'controls opens an account-takeover fraud channel.',
    },
    {
      key: 'agent_attrition_rate',
      name: 'Agent attrition rate',
      definition:
        'The share of contact-center servicing agents who leave the role ' +
        'over a rolling annualised period — voluntary and involuntary ' +
        'departures as a share of the agent headcount.',
      unit: '% annualised agent turnover',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 55,
        basis:
          'Contact-center attrition runs structurally high and varies ' +
          'with role design, pay, and how much avoidable, frustrating ' +
          'contact agents absorb; the band spans a stable operation to a ' +
          'churning one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The HR / workforce-management system, tracking agent departures ' +
        'against the agent headcount.',
      whyItMatters:
        'Attrition is a large hidden cost — recruiting and ramping a new ' +
        'agent is expensive, and a new agent resolves less well and is ' +
        'more likely to mishandle a regulated dispute or complaint — so ' +
        'attrition raises cost and depresses both FCR and compliance ' +
        'quality.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'demand_treated_as_given',
      name: 'Contact demand treated as a given, not a symptom',
      description:
        'The servicing operation staffs to absorb whatever contact volume ' +
        'arrives and never asks why the contacts exist. Avoidable ' +
        'contacts driven by confusing fees, a failed digital journey, an ' +
        'unclear statement, or a card-control gap are handled efficiently ' +
        'rather than removed, so the cost base is permanently inflated by ' +
        'failure demand and the upstream defect keeps generating volume.',
      detectionSignal:
        'Contact volume per account is high or rising; contact-driver ' +
        'analysis is thin or absent; capacity planning forecasts volume ' +
        'but no one owns reducing it.',
      diagnosticQuestion:
        'What share of contact volume is avoidable failure demand, and ' +
        'who is accountable for removing the upstream product, fee, or ' +
        'digital defect rather than staffing to absorb it?',
    },
    {
      key: 'false_deflection',
      name: 'False deflection — abandonment counted as self-service',
      description:
        'IVR, virtual-assistant, and digital self-service metrics count a ' +
        'contained session as a success even when the customer abandoned ' +
        'unresolved or fell back to the agent queue. Reported deflection ' +
        'looks strong while the real issue goes unsolved, resurfaces as a ' +
        'repeat contact, or quietly erodes the relationship.',
      detectionSignal:
        'Digital "containment" is high but escalation, repeat contact, ' +
        'and abandonment behind it are not separated; CSAT on self-service ' +
        'journeys is low or unmeasured.',
      diagnosticQuestion:
        'Does the digital self-service resolution rate measure genuine ' +
        'resolution, or does it count abandoned and given-up sessions as ' +
        'deflected contacts?',
    },
    {
      key: 'handle_time_tyranny',
      name: 'Handle-time tyranny over resolution and compliance quality',
      description:
        'The operation is managed to average handle time as the dominant ' +
        'target, so agents are pushed to close contacts fast rather than ' +
        'to resolve them fully and compliantly. Handle time falls while ' +
        'first-contact resolution worsens, dispute intakes are rushed and ' +
        'incomplete, and the cost and regulatory risk move to the second ' +
        'contact.',
      detectionSignal:
        'Handle time is the headline agent metric; FCR is low or ' +
        'untracked; repeat-contact and dispute-rework rates rise even as ' +
        'handle time improves.',
      diagnosticQuestion:
        'Is the operation managed to resolution, repeat-contact rate, and ' +
        'compliance quality, or to handle time alone — and is cut handle ' +
        'time simply reappearing as a second contact or a rework?',
    },
    {
      key: 'fragmented_channel_experience',
      name: 'Fragmented, channel-siloed servicing experience',
      description:
        'Voice, chat, secure messaging, in-app, and the branch run as ' +
        'separate queues on separate systems with no shared context. A ' +
        'customer who switches channel or re-contacts must re-authenticate ' +
        'and re-explain the issue from the start, and the agent cannot see ' +
        'what was already tried or what the customer did in the app.',
      detectionSignal:
        'Channels run on disconnected platforms; agents lack a unified ' +
        'contact and interaction history; customers report re-explaining ' +
        'and re-authenticating across channels.',
      diagnosticQuestion:
        'Can an agent in any channel see the customer’s full prior ' +
        'interaction and digital-journey history, or does each channel ' +
        'operate as an island with no shared context?',
    },
    {
      key: 'inconsistent_compliant_answers',
      name: 'Inconsistent and non-compliant answers',
      description:
        'Agents rely on scattered, out-of-date knowledge and personal ' +
        'memory, so the same fee, product, or regulatory question gets ' +
        'different answers from different agents. Some answers are simply ' +
        'wrong; others are non-compliant — a misstated fee, an unfounded ' +
        'assurance, an incomplete disclosure — turning a routine contact ' +
        'into a UDAAP or mis-statement exposure.',
      detectionSignal:
        'Knowledge content is fragmented and stale; quality monitoring ' +
        'finds inconsistent answers; complaints and disputes cluster on ' +
        'policy or fee-interpretation uncertainty.',
      diagnosticQuestion:
        'Do agents work from a single, current, compliance-governed ' +
        'knowledge source, or does the answer a customer gets — and its ' +
        'regulatory accuracy — depend on which agent they reach?',
    },
    {
      key: 'dispute_complaint_process_breakdown',
      name: 'Dispute and complaint process breakdown',
      description:
        'Disputes and complaints are intaken inconsistently, tracked in ' +
        'fragmented systems, and worked without firm control of the Reg E, ' +
        'Reg Z, and network-rule clocks. Provisional-credit and ' +
        'investigation deadlines are missed, complaints are mis-classified ' +
        'or never logged, and a service failure compounds into a ' +
        'regulatory finding.',
      detectionSignal:
        'Dispute cycle time and complaint resolution time are long or ' +
        'variable; regulatory deadline breaches occur; complaint capture ' +
        'is incomplete and root-cause analysis is thin.',
      diagnosticQuestion:
        'Are disputes and complaints intaken completely, tracked against ' +
        'their regulatory clocks, and analysed for root cause — or worked ' +
        'reactively until a deadline is breached?',
    },
    {
      key: 'reactive_volume_blindsides',
      name: 'Reactive staffing blindsided by demand spikes',
      description:
        'Service-demand forecasting is coarse and slow, so a fee-schedule ' +
        'change, a digital-banking outage, a fraud event, a rate change, ' +
        'or a seasonal surge blindsides the operation. The queue ' +
        'collapses, wait and abandonment spike, and the response is ' +
        'expensive overtime or a degraded, non-compliant experience.',
      detectionSignal:
        'Service level and abandonment swing sharply around product ' +
        'changes and incidents; staffing is set on coarse averages; ' +
        'intraday and event-driven demand is not forecast.',
      diagnosticQuestion:
        'How well does service-demand forecasting anticipate product ' +
        'changes, incidents, and seasonal spikes, and how reliably does ' +
        'staffing flex to them?',
    },
    {
      key: 'resolve_ticket_not_cause',
      name: 'Resolving the ticket without resolving the cause',
      description:
        'Each contact is closed in isolation with no feedback loop to the ' +
        'function that caused it. A confusing overdraft fee, a broken ' +
        'payment flow, a misleading statement line, or a recurring card ' +
        'decline generates contact after contact, and servicing absorbs ' +
        'every one without the root cause ever reaching the deposit, ' +
        'payments, lending, or digital product owners.',
      detectionSignal:
        'Contact-reason data is not analysed for recurring drivers; there ' +
        'is no closed loop from servicing to the owning product function; ' +
        'the same issue generates contacts and complaints month after ' +
        'month.',
      diagnosticQuestion:
        'Is there a closed feedback loop from contact and complaint ' +
        'drivers to the product functions that own the cause, or does ' +
        'servicing resolve tickets while the defect keeps generating them?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'conversational_servicing_self_service',
      name: 'Conversational servicing and authenticated self-service',
      valueMechanism:
        'A conversational AI assistant handles routine, well-bounded ' +
        'servicing journeys end to end — balance and transaction ' +
        'enquiries, card activation and lock, payment status, statement ' +
        'and fee explanations, address and contact changes, dispute ' +
        'initiation — grounded in the bank’s own account, transaction, and ' +
        'policy data behind strong authentication, and resolves them ' +
        'without an agent or hands a warm, context-rich transfer when it ' +
        'cannot. Value comes from genuinely resolving high-volume routine ' +
        'contacts at a fraction of agent cost while keeping resolution ' +
        'quality, compliance accuracy, and satisfaction intact.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Authenticated account, balance, and transaction data from the ' +
          'core banking and card systems',
        'A current, compliance-governed servicing knowledge base of ' +
          'policy, fee, and how-to content',
        'Customer profile, product holdings, and contact-preference data',
        'Conversation transcripts and resolution outcomes for tuning',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The assistant resolves bounded journeys autonomously within a ' +
          'defined scope behind strong authentication; anything outside ' +
          'scope is a warm, context-rich transfer, never a dead end.',
        'It must answer only from current grounded data and compliant ' +
          'language — a confidently wrong fee, balance, or disclosure ' +
          'answer is a UDAAP and consumer-harm exposure.',
        'Regulated actions (a dispute, a fee reversal, a payment ' +
          'cancellation) follow the same disclosures, audit trail, and ' +
          'fair-treatment rules as an agent-handled contact.',
        'Deflection must be measured as genuine resolution, not ' +
          'containment — an assistant that strands the customer creates ' +
          'failure demand and silent attrition.',
      ],
      metricsMoved: [
        'digital_self_service_resolution_rate',
        'cost_per_contact',
        'first_contact_resolution',
        'contact_abandonment_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'agent_assist_realtime_guidance',
      name: 'Agent assist and real-time guidance',
      valueMechanism:
        'An AI copilot works alongside the agent during a live servicing ' +
        'contact — surfacing the customer’s account and interaction ' +
        'context, retrieving the right compliance-governed knowledge ' +
        'answer, suggesting the next step, prompting required disclosures, ' +
        'and drafting the response and the after-contact case note. Value ' +
        'comes from lifting first-contact resolution and answer ' +
        'consistency while cutting handle and wrap-up time and shortening ' +
        'the ramp for new agents — closing the knowledge gap that drives ' +
        'transfers and non-compliant answers.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Unified customer, account, and interaction history',
        'A current, compliance-governed servicing knowledge base',
        'Live contact transcript or chat context',
        'Resolution-outcome and quality-and-compliance data for tuning',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot suggests and drafts; the agent owns the customer ' +
          'conversation, the judgement, and every answer sent — it is an ' +
          'aid, not an autonomous responder.',
        'Suggestions must be grounded in current policy and compliant ' +
          'language and cite their source so the agent can verify before ' +
          'relying on them.',
        'Agent monitoring and assist must respect agent privacy and ' +
          'labour-relations norms and not become a covert surveillance ' +
          'tool.',
      ],
      metricsMoved: [
        'first_contact_resolution',
        'average_handle_time',
        'transferred_escalated_contact_rate',
        'customer_satisfaction_score',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'intelligent_routing_triage',
      name: 'Intelligent contact routing and triage',
      valueMechanism:
        'A model reads each inbound contact — its intent, sentiment, ' +
        'complexity, regulatory sensitivity, and the customer’s value and ' +
        'history — and routes it to the channel, the automation, or the ' +
        'agent skill best able to resolve it first time, rather than to ' +
        'the next available queue. Value comes from raising first-contact ' +
        'resolution and cutting transfers by matching the contact to the ' +
        'right resolver, and from steering disputes, complaints, and ' +
        'vulnerable-customer contacts straight to a trained, equipped ' +
        'handler.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inbound contact text, intent, and sentiment signal',
        'Customer profile, relationship value, and prior-interaction ' +
          'history',
        'Agent skill, certification, availability, and performance data',
        'Issue-type and resolution-path outcome history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model routes; servicing operations owns the routing policy ' +
          'and the skill-and-priority rules, and an agent can re-route on ' +
          'local judgement.',
        'Value-based prioritisation must not produce unfair or ' +
          'discriminatory service tiers — every customer is owed a ' +
          'baseline servicing standard the routing cannot drop below, and ' +
          'fair-lending and fair-treatment principles bound the design.',
        'Intent and sentiment classification is imperfect — a mis-routed ' +
          'dispute, complaint, or distressed-customer contact must be easy ' +
          'to recover, not buried in the wrong queue.',
      ],
      metricsMoved: [
        'first_contact_resolution',
        'transferred_escalated_contact_rate',
        'service_level',
        'dispute_resolution_cycle_time',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'contact_driver_quality_compliance_intelligence',
      name: 'Contact-driver and quality-and-compliance intelligence',
      valueMechanism:
        'A model analyses every contact transcript, dispute, and ' +
        'complaint at scale — classifying the true reason, detecting ' +
        'recurring drivers, spotting emerging issues, and scoring ' +
        'interaction quality and compliance across the whole volume ' +
        'rather than a sampled few. Value comes from turning servicing ' +
        'into the early-warning system for conduct risk and product ' +
        'defects: it quantifies the avoidable-contact share, names the ' +
        'upstream defects and fee or disclosure problems to fix, and ' +
        'replaces thin manual quality and complaint sampling with ' +
        'full-coverage insight.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Full contact transcripts, dispute records, and complaint text ' +
          'across channels',
        'Contact-reason and complaint-category taxonomies and ' +
          'resolution-outcome data',
        'Product, fee, payment, and digital-incident data to attribute ' +
          'drivers',
        'Quality-and-compliance evaluation criteria and historical scored ' +
          'samples',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model classifies and surfaces drivers; servicing, product, ' +
          'and compliance leaders own the fix decisions and the closed ' +
          'loop to the owning function.',
        'Automated quality and compliance scoring informs coaching and ' +
          'conduct review; it must be calibrated, transparent, and never ' +
          'the sole basis for an agent action or a regulatory ' +
          'determination without human review.',
        'Transcript and complaint analysis must respect customer and ' +
          'agent privacy and data-use rules and redact sensitive personal ' +
          'and financial data.',
      ],
      metricsMoved: [
        'complaint_rate',
        'first_contact_resolution',
        'customer_satisfaction_score',
        'cost_per_contact',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'service_demand_forecasting_scheduling',
      name: 'Service-demand forecasting and scheduling',
      valueMechanism:
        'A model forecasts contact volume by channel, interval, and issue ' +
        'type — folding in fee-schedule and rate changes, product ' +
        'launches, statement cycles, digital-banking and payment ' +
        'incidents, fraud events, and seasonality — and builds the agent ' +
        'schedule that matches capacity to that demand within budget and ' +
        'labour constraints. Value comes from holding service level and ' +
        'abandonment steady through spikes without expensive overtime or ' +
        'over-staffing the quiet intervals.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical contact volume by channel, interval, and issue type',
        'Product-change, statement-cycle, and marketing calendars',
        'Digital-banking, payment, and fraud incident signals',
        'Agent availability, skills, certifications, and labour-budget ' +
          'constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model forecasts demand and proposes the schedule; the ' +
          'workforce-management and operations leads own the published ' +
          'schedule and any override.',
        'Scheduling must respect labour law, contractual terms, and agent ' +
          'fairness — predictability and rest rules are hard constraints, ' +
          'not cost trade-offs.',
        'A forecast trained on a history of abandoned and deflected ' +
          'contact understates true demand — the signal must be corrected ' +
          'for suppressed volume.',
      ],
      metricsMoved: [
        'service_level',
        'contact_abandonment_rate',
        'cost_per_contact',
        'agent_attrition_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'proactive_servicing_outreach',
      name: 'Proactive servicing outreach',
      valueMechanism:
        'A model detects, from account, payment, card, and digital ' +
        'signals, the situations that are about to generate an inbound ' +
        'contact — a low balance heading to an overdraft, a failed ' +
        'recurring payment, a card about to expire, an unusual fee on the ' +
        'next statement, a declined transaction — and reaches the customer ' +
        'first with a clear, action-ready message before they have to ' +
        'call. Value comes from removing avoidable inbound contacts ' +
        'entirely and turning a potential service failure into a moment of ' +
        'trust.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Real-time account, balance, payment, and card-status signals',
        'Customer contact preferences and consented channels',
        'A resolved customer identity and product-holdings view',
        'Resolution paths and self-service actions for each scenario type',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model triggers proactive outreach; servicing leadership owns ' +
          'the outreach policy, the message content, and the action ' +
          'options offered.',
        'Outreach must honour consent, contact-preference, and ' +
          'telemarketing rules and a shared frequency budget — proactive ' +
          'must not become intrusive or over-messaging.',
        'A proactive message must be genuinely action-ready and must not ' +
          'stray into unsolicited cross-sell — an alert with no clear ' +
          'next step simply moves the inbound contact rather than removing ' +
          'it.',
      ],
      metricsMoved: [
        'cost_per_contact',
        'complaint_rate',
        'customer_satisfaction_score',
        'first_contact_resolution',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'tiered_authenticated_servicing_layer',
      name: 'Tiered authenticated-servicing layer',
      description:
        'A pattern that fronts the servicing operation with a ' +
        'conversational AI layer resolving bounded routine journeys end ' +
        'to end behind strong authentication, behind which sits ' +
        'agent-assisted resolution and then specialist and back-office ' +
        'escalation — with a warm, context-rich handoff at each tier so ' +
        'the customer never re-authenticates or restarts and routine ' +
        'volume never reaches an agent.',
      boundary:
        'It resolves only journeys inside a defined, governed, ' +
        'authenticated scope and hands a warm transfer for anything ' +
        'beyond it; it does not autonomously make exception, goodwill, or ' +
        'fee-waiver decisions reserved for an agent.',
      humanAccountabilityPoint:
        'The head of customer servicing accountable for servicing ' +
        'resolution, deflection quality, compliance, and cost to serve.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'unified_agent_workspace',
      name: 'Unified agent-workspace and copilot pattern',
      description:
        'A pattern that gives every agent one workspace across all ' +
        'channels — the resolved customer and account history, the live ' +
        'contact context, the digital-journey trail, and an AI copilot ' +
        'that retrieves compliance-governed answers, prompts required ' +
        'disclosures, suggests the next step, and drafts the response and ' +
        'the case note — so resolution is fast, consistent, compliant, and ' +
        'channel-blind.',
      boundary:
        'It surfaces context and suggests; the agent owns every answer ' +
        'and the customer conversation. It does not auto-send a response ' +
        'or close a contact without the agent.',
      humanAccountabilityPoint:
        'The servicing-operations director accountable for agent ' +
        'enablement, resolution quality, and answer consistency and ' +
        'compliance.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'intent_aware_routing_fabric',
      name: 'Intent-aware routing fabric',
      description:
        'A pattern that classifies every inbound contact by intent, ' +
        'sentiment, complexity, regulatory sensitivity, and customer ' +
        'value and routes it to the automation, channel, or agent skill ' +
        'best able to resolve it first time — replacing ' +
        'next-available-queue routing with resolver-matched routing ' +
        'inside a governed service-standard floor that protects every ' +
        'customer equally.',
      boundary:
        'It routes within a governed policy; servicing operations owns ' +
        'the routing and priority rules and an agent can re-route. It ' +
        'cannot drop any customer below the baseline servicing standard ' +
        'or breach fair-treatment principles.',
      humanAccountabilityPoint:
        'The servicing-operations lead accountable for the routing policy ' +
        'and equitable service standards.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'dispute_complaint_management_pattern',
      name: 'Dispute-and-complaint management pattern',
      description:
        'A pattern that standardises dispute and complaint intake, ' +
        'classifies and tracks every case against its Reg E, Reg Z, and ' +
        'network-rule clocks, drafts the investigation and the customer ' +
        'communications, and surfaces deadline and consumer-harm risk — ' +
        'so the regulated clocks are met, complaints are captured ' +
        'completely, and root cause is analysed rather than lost.',
      boundary:
        'It intakes, tracks, drafts, and flags; a trained dispute or ' +
        'complaint handler owns the investigation outcome, the ' +
        'provisional-credit and remediation decisions, and the customer ' +
        'communication. It does not autonomously resolve a dispute or ' +
        'close a complaint.',
      humanAccountabilityPoint:
        'The disputes-and-complaints manager accountable for regulatory ' +
        'timeframe adherence and fair-treatment outcomes.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'contact_driver_closed_loop',
      name: 'Contact-driver closed-loop pattern',
      description:
        'A pattern that analyses every contact, dispute, and complaint at ' +
        'scale to classify its true driver, quantify the ' +
        'avoidable-contact share, and feed a governed, prioritised defect ' +
        'and conduct-risk queue back to the deposit, payments, lending, ' +
        'fee, and digital owners — closing the loop so failure demand and ' +
        'consumer-harm causes are removed at source, not absorbed.',
      boundary:
        'It detects, attributes, and prioritises drivers; the owning ' +
        'product or compliance function owns the fix and the servicing ' +
        'operation owns the loop. It does not itself change a product, ' +
        'fee, or process.',
      humanAccountabilityPoint:
        'The servicing-operations or customer-experience leader ' +
        'accountable for failure demand and the cross-functional fix ' +
        'loop.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'proactive_resolution_pattern',
      name: 'Proactive-resolution pattern',
      description:
        'A pattern that monitors account, payment, card, and digital ' +
        'signals for situations about to generate an inbound contact and ' +
        'reaches the customer first with a clear, action-ready message ' +
        'and self-service options — converting a looming service failure ' +
        'into a contained, trust-building interaction before the customer ' +
        'calls.',
      boundary:
        'It triggers outreach within a consent and frequency-governed ' +
        'frame; servicing leadership owns the outreach policy and the ' +
        'action options. It does not exceed the customer’s consented ' +
        'contact budget or stray into unsolicited marketing.',
      humanAccountabilityPoint:
        'The customer-servicing leader accountable for ' +
        'proactive-servicing policy and avoidable inbound volume.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Customer-servicing value is realised in three connected ways and a ' +
      'forecast must keep them distinct. First, cost to serve: genuine ' +
      'conversational deflection, agent-assist productivity, and sharper ' +
      'demand forecasting handle the same or more contacts at a lower ' +
      'fully-loaded cost — a recurring saving, but only where deflection ' +
      'is genuine resolution rather than abandonment relabelled. Second, ' +
      'avoidable-demand elimination: contact-driver intelligence and ' +
      'proactive outreach remove failure demand at source, so the cost ' +
      'falls permanently rather than being staffed more cheaply — the ' +
      'most durable lever, because a contact never made costs nothing. ' +
      'Third, retained relationship value and avoided conduct cost: ' +
      'faster, first-time, compliant resolution turns servicing moments ' +
      'from attrition risks into trust and reduces the complaints, ' +
      'remediation, and regulatory exposure that a mishandled fee or ' +
      'dispute creates — this protects deposit balances, product ' +
      'holdings, and the conduct record at once. The dominant constraint ' +
      'is that consumer-protection and fair-treatment rules are hard ' +
      'bounds, not value levers: a forecast can never count speed or ' +
      'cost saved at the expense of a complete dispute intake, a required ' +
      'disclosure, or an equitable outcome. Servicing value is realised ' +
      'through thousands of agent interactions and self-service journeys, ' +
      'so the gain is paced by adoption, by data and channel ' +
      'integration, and by the honesty of the deflection measurement — a ' +
      'forecast must be read against the bank’s servicing-data maturity ' +
      'and the real resolution rate, not a containment number.',
    dominantHaircutFactors: [
      {
        factor: 'Deflection-quality and measurement honesty',
        rationale:
          'The cost-to-serve case rests on genuine resolution, not ' +
          'containment. Where self-service strands customers who abandon ' +
          'or escalate, the modelled saving is illusory — failure demand ' +
          'simply resurfaces — so weak deflection measurement is the ' +
          'single largest reason the forecast overstates the gain.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled servicing saving not realised ' +
            'because reported deflection is containment rather than ' +
            'genuine resolution; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data and channel integration readiness',
        rationale:
          'Deflection, agent assist, routing, and proactive outreach all ' +
          'depend on a resolved customer identity, current account and ' +
          'transaction data, a compliance-governed knowledge base, and ' +
          'connected channels. Fragmented core, card, and digital systems ' +
          'and stale knowledge cap how much of the modelled value the use ' +
          'cases can deliver.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Value erosion from fragmented servicing channels, missing ' +
            'core and card integration, and a stale knowledge base; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Compliance and fair-treatment ceiling',
        rationale:
          'Consumer-protection rules — Reg E and Reg Z dispute ' +
          'timeframes, complete disclosures, UDAAP and complaint-handling ' +
          'duties — are hard bounds. The objective is faster, cheaper, ' +
          'compliant servicing, never speed or cost bought by a rushed ' +
          'dispute intake or a missed disclosure, so the compliant ' +
          'ceiling haircuts the modelled efficiency upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The share of a modelled efficiency gain that is not ' +
            'compliantly reachable without weakening dispute, disclosure, ' +
            'or fair-treatment discipline; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Upstream-fix dependency for failure demand',
        rationale:
          'Avoidable-contact reduction needs the deposit, payments, ' +
          'lending, fee, and digital owners to actually fix the defects ' +
          'servicing surfaces. Where the closed loop is weak or those ' +
          'functions do not act, the failure-demand gain stays on the ' +
          'page — servicing can name the cause but not remove it alone.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'The share of a modelled failure-demand reduction bounded by ' +
            'whether upstream product functions act on the surfaced ' +
            'defects; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Agent adoption and trust in the tooling',
        rationale:
          'Agent-assist and routing gains depend on agents trusting and ' +
          'using the copilot and the routing rather than working around ' +
          'them. High attrition, thin training, and tool friction slow ' +
          'adoption, so the modelled productivity gain is realised only ' +
          'partly and slowly.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Forecast erosion from slow or partial agent adoption of the ' +
            'assist and routing tooling; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Cost-to-serve reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in the fully-loaded cost to serve from ' +
            'genuine deflection, agent-assist productivity, and sharper ' +
            'scheduling; a planning range spanning early and mature ' +
            'adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fully-loaded cost per contact ' +
          'across the contact mix.',
      },
      {
        lever: 'Avoidable-contact-volume reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in avoidable failure-demand contact ' +
            'volume from contact-driver intelligence and proactive ' +
            'outreach; a planning range — volume removed at source, not ' +
            'handled more cheaply.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in contact volume traced to ' +
          'preventable upstream causes.',
      },
      {
        lever: 'First-contact-resolution uplift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Percentage-point uplift in first-contact resolution from ' +
            'agent assist, intent-aware routing, and consistent, ' +
            'compliant knowledge; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the share of contacts resolved on ' +
          'the first interaction.',
      },
      {
        lever: 'Complaint-volume and conduct-cost reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in complaint volume and the associated ' +
            'remediation and conduct cost from faster, compliant ' +
            'resolution and contact-driver fixes; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in logged complaints per active ' +
          'account, and in the associated remediation cost.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot channel or ' +
      'contact-type group (deflection rate, handle time, first-contact ' +
      'resolution); 9–18 months to a settled result, because the ' +
      'avoidable-demand, complaint, and retention gains only prove out ' +
      'once the closed loop to upstream product functions runs and a ' +
      'full statement, fee-change, and seasonal cycle has passed.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Contact-center / CCaaS platform',
        role:
          'The system of record for contact handling — routing, queuing, ' +
          'IVR, voice and digital channel management, and the interaction ' +
          'metrics: service level, handle time, abandonment.',
        examples: [
          'Genesys Cloud',
          'NICE CXone',
          'Amazon Connect',
          'Five9',
        ],
      },
      {
        name: 'CRM / servicing case-management system',
        role:
          'Holds the servicing case and ticket record, the ' +
          'customer-interaction history, and the resolution workflow — ' +
          'the source of first-contact resolution, transfer, and ' +
          'contact-reason data.',
        examples: [
          'Salesforce Financial Services Cloud',
          'Microsoft Dynamics 365',
          'Pega Customer Service',
          'ServiceNow',
        ],
      },
      {
        name: 'Core banking and card-management systems',
        role:
          'The systems of record for the account, balance, transaction, ' +
          'and card state — the authenticated data servicing and ' +
          'conversational AI must read to resolve a contact.',
        examples: [
          'FIS',
          'Fiserv',
          'Jack Henry',
          'card-management and processing platforms',
        ],
      },
      {
        name: 'Dispute / chargeback management system',
        role:
          'Tracks transaction disputes and claims through intake, ' +
          'investigation, network chargeback, provisional credit, and ' +
          'resolution — the source of dispute cycle-time data and Reg E / ' +
          'Reg Z clock tracking.',
        examples: [
          'dispute-management modules of the card processor',
          'specialist chargeback-management platforms',
          'in-house dispute case systems',
        ],
      },
      {
        name: 'Complaint-management system',
        role:
          'Captures, categorises, tracks, and reports customer ' +
          'complaints, including regulator-routed complaints — the source ' +
          'of complaint-rate, resolution-time, and conduct-risk data.',
        examples: [
          'dedicated complaint-management platforms',
          'a complaints module of the CRM',
          'GRC complaint and conduct registers',
        ],
      },
      {
        name: 'Workforce-management (WFM) and quality system',
        role:
          'Forecasts contact demand, builds the agent schedule, tracks ' +
          'adherence, and runs interaction quality and compliance ' +
          'evaluation — the backbone of service-demand forecasting and ' +
          'scheduling.',
        examples: [
          'NICE Workforce Management',
          'Verint Workforce Management',
          'Genesys WFM',
          'Calabrio',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of Customer Servicing / Chief Customer Officer',
        accountability:
          'Owns the total customer-servicing strategy, the ' +
          'service-experience outcome, and the cost-to-serve, ' +
          'compliance, and retention balance across all channels.',
      },
      {
        title: 'Director of contact-center / servicing operations',
        accountability:
          'Owns the running of the servicing operation — channels, ' +
          'staffing, service level, resolution quality, and the operating ' +
          'budget.',
      },
      {
        title: 'Disputes-and-complaints manager',
        accountability:
          'Owns transaction-dispute and complaint handling — intake, ' +
          'investigation, regulatory timeframe adherence, and ' +
          'fair-treatment outcomes.',
      },
      {
        title: 'Workforce-management / capacity-planning lead',
        accountability:
          'Owns service-demand forecasting, the agent schedule, intraday ' +
          'management, and the match of capacity to demand.',
      },
      {
        title: 'Service-quality, compliance, and knowledge manager',
        accountability:
          'Owns interaction quality and compliance evaluation, the ' +
          'agent knowledge base, and the consistency, currency, and ' +
          'regulatory accuracy of the answers customers receive.',
      },
      {
        title: 'Team lead / servicing supervisor',
        accountability:
          'Owns a team of front-line agents — their resolution ' +
          'performance, coaching and development, escalations, and ' +
          'day-to-day floor management.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'UDAAP — unfair, deceptive, or abusive acts or practices',
        relevance:
          'Governs how servicing communicates with customers — a ' +
          'misstated fee, an unfounded assurance, or a misleading answer ' +
          'is a UDAAP violation, making compliant servicing language a ' +
          'hard constraint on every contact and every conversational AI.',
      },
      {
        name: 'Regulation E — electronic fund transfer disputes',
        relevance:
          'Sets the customer’s rights and the bank’s investigation, ' +
          'provisional-credit, and timing duties for disputed electronic ' +
          'transactions — a hard frame around dispute intake and cycle ' +
          'time.',
      },
      {
        name: 'Regulation Z and the Fair Credit Billing Act',
        relevance:
          'Govern credit-card billing-error disputes and the ' +
          'investigation and resolution timeframes — bounding how ' +
          'card-dispute servicing must operate.',
      },
      {
        name: 'CFPB complaint-handling and consumer-protection ' +
          'expectations',
        relevance:
          'Set the supervisory expectation for complete complaint ' +
          'capture, timely response, root-cause analysis, and ' +
          'fair-treatment outcomes — the frame around the ' +
          'complaint-management operation.',
      },
      {
        name: 'Call-recording, consent, AI-disclosure, and TCPA / ' +
          'telemarketing rules',
        relevance:
          'Govern recording consent, AI-agent disclosure, and outbound ' +
          'contact consent and frequency — a hard constraint on ' +
          'conversational AI and proactive outreach.',
      },
      {
        name: 'GLBA, consumer-privacy law, and authentication / ' +
          'fraud-control standards',
        relevance:
          'Govern how customer financial data is protected, how ' +
          'transcripts and recordings are used, and how customers are ' +
          'authenticated before servicing — bounding both AI tooling and ' +
          'self-service design.',
      },
    ],
    canonicalTerms: [
      {
        term: 'First-contact resolution (FCR)',
        definition:
          'The share of servicing contacts fully resolved in a single ' +
          'interaction with no re-contact, callback, or escalation on the ' +
          'same issue.',
      },
      {
        term: 'Average handle time (AHT)',
        definition:
          'The average time an agent spends actively handling a contact ' +
          '— talk or chat time plus after-contact wrap-up and case notes.',
      },
      {
        term: 'Deflection',
        definition:
          'A servicing journey resolved in a self-service or automated ' +
          'channel without an agent — genuine deflection requires ' +
          'resolution, not just session containment.',
      },
      {
        term: 'Containment',
        definition:
          'A self-service or IVR session that ends without reaching an ' +
          'agent — a weaker measure than resolution, since it counts ' +
          'abandonment and give-up sessions.',
      },
      {
        term: 'Failure demand',
        definition:
          'Contact volume generated by a preventable upstream defect — a ' +
          'confusing fee, a broken digital journey, an unclear statement ' +
          '— as distinct from genuine, value-adding demand.',
      },
      {
        term: 'Provisional credit',
        definition:
          'A conditional credit a bank must extend to a customer’s ' +
          'account while a disputed transaction is investigated, under ' +
          'Regulation E timing rules.',
      },
      {
        term: 'Chargeback',
        definition:
          'The card-network process by which a disputed card transaction ' +
          'is reversed and charged back to the merchant — the ' +
          'rules-bound path most card disputes follow.',
      },
      {
        term: 'UDAAP',
        definition:
          'Unfair, deceptive, or abusive acts or practices — the ' +
          'consumer-protection standard a servicing communication or ' +
          'fee answer must never breach.',
      },
      {
        term: 'Warm transfer',
        definition:
          'A handoff between channels, tiers, or teams that carries the ' +
          'full interaction context and authentication state, so the ' +
          'customer does not restart or re-authenticate.',
      },
      {
        term: 'Vulnerable customer',
        definition:
          'A customer whose circumstances — financial distress, ' +
          'bereavement, illness, low capability — require additional care ' +
          'and adjusted handling under fair-treatment expectations.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Customer-Servicing Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the customer-servicing operation is over-spending ' +
        'to serve, leaking deflection, breaching compliance, and eroding ' +
        'relationships — failure demand, false deflection, handle-time ' +
        'tyranny, dispute and complaint process breakdown, channel ' +
        'fragmentation — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Servicing operation and channel context',
          guidance:
            'Name the servicing operation in scope — channels, contact ' +
            'volume, agent headcount and attrition, the in-house and ' +
            'outsourced mix, and the servicing operating model. State ' +
            'which contact-center, CRM, core banking, dispute, complaint, ' +
            'and workforce-management systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — first-contact resolution, handle time, ' +
            'cost per contact, service level, abandonment, digital ' +
            'self-service resolution, CSAT, transfer rate, dispute cycle ' +
            'time, complaint rate, complaint resolution time, ' +
            'authentication pass rate, agent attrition. For any metric ' +
            'not recorded, name it as a precise seed gap with its ' +
            'expected data source.',
        },
        {
          heading: 'Contact-demand and deflection diagnostic',
          guidance:
            'Analyse where contact volume comes from, how much is ' +
            'avoidable failure demand from product, fee, or digital ' +
            'defects, and whether reported digital self-service ' +
            'deflection is genuine resolution or containment masking ' +
            'abandonment and escalation.',
        },
        {
          heading: 'Resolution, dispute, and complaint diagnostic',
          guidance:
            'Analyse first-contact resolution, transfers, and answer ' +
            'consistency across channels, the balance between handle ' +
            'time and resolution quality, and whether disputes and ' +
            'complaints are intaken completely and worked within their ' +
            'Reg E, Reg Z, and regulatory clocks.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — demand treated as a given, ' +
            'false deflection, handle-time tyranny, fragmented channels, ' +
            'inconsistent and non-compliant answers, dispute and ' +
            'complaint process breakdown, reactive staffing, resolving ' +
            'the ticket not the cause — and state which are present, ' +
            'with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — cost-to-serve reduction, avoidable-demand ' +
            'elimination, first-contact-resolution uplift, ' +
            'complaint-and-conduct-cost reduction — explicitly haircut by ' +
            'deflection-quality honesty, data and channel integration, ' +
            'the compliance ceiling, upstream-fix dependency, and agent ' +
            'adoption. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — a ' +
            'true resolution rate behind containment, a complete ' +
            'avoidable-contact view — is a named ask, not a vague ' +
            'unknown.',
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
      label: 'Customer-Servicing Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a ' +
        'customer-servicing AI Move on this operation — baseline, ' +
        'forecast, cost, and the honest downside, with the compliance ' +
        'frame held as a hard bound.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring cost-to-serve reduction, avoidable-demand ' +
            'elimination, and complaint-and-conduct-cost reduction, the ' +
            'time-to-value band, and the go / hold recommendation in one ' +
            'read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — cost per contact, first-contact resolution, ' +
            'digital self-service resolution, complaint rate, dispute ' +
            'cycle time. Where a baseline is a seed gap (a true ' +
            'resolution rate behind containment is a common one), say so ' +
            'and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — deflection-quality ' +
            'honesty, data and channel integration, the compliance and ' +
            'fair-treatment ceiling, upstream-fix dependency, agent ' +
            'adoption — explicitly and show the haircut math. Keep ' +
            'recurring cost, avoidable-demand, and complaint-cost gains ' +
            'distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the contact-center, CRM, ' +
            'core banking, card, dispute, complaint, and ' +
            'workforce-management systems, the compliance-governed ' +
            'knowledge-base remediation, and the operating-model change ' +
            '— agent and supervisor workflow.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker deflection quality, ' +
            'fragmented channel data, and an upstream organisation slow ' +
            'to fix surfaced defects. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Compliance and fair-treatment posture',
          guidance:
            'State the consumer-protection controls the design holds as ' +
            'hard bounds — Reg E and Reg Z dispute discipline, complete ' +
            'disclosures, UDAAP-safe servicing language, complaint ' +
            'capture — and confirm no modelled value depends on ' +
            'weakening them.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example a knowledge base too stale to ground a ' +
            'compliant conversational agent, or no closed loop to act on ' +
            'contact drivers — and the evidence that must be in hand ' +
            'before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the measurement cadence, and how ' +
            'genuine resolution is verified against containment, ' +
            'including the lagged complaint-rate and CSAT metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Customer-Servicing Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'customer-servicing AI capability, grounded in the function ' +
        'reference patterns, the deflection-quality discipline, and the ' +
        'consumer-protection and fair-treatment frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — tiered authenticated-servicing layer, unified ' +
            'agent workspace and copilot, intent-aware routing fabric, ' +
            'dispute-and-complaint management, contact-driver closed ' +
            'loop, proactive resolution — and state which apply and how ' +
            'they connect.',
        },
        {
          heading: 'Data, knowledge, and integration architecture',
          guidance:
            'Specify the contact-center, CRM, core banking, card, ' +
            'dispute, complaint, and workforce-management integrations, ' +
            'the resolved customer-identity and authentication approach, ' +
            'data freshness, and the compliance-governed knowledge-base ' +
            'discipline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and ' +
            'the warm-handoff and escalation design. Define genuine ' +
            'resolution measurement and the baseline servicing standard ' +
            'as hard constraints.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how agent, supervisor, dispute, complaint, ' +
            'workforce-management, and customer-experience workflows ' +
            'change, how the routing and quality cadence is reshaped, ' +
            'how the contact-driver loop reaches upstream owners, and who ' +
            'owns each change.',
        },
        {
          heading:
            'Responsible-AI, privacy, and consumer-protection controls',
          guidance:
            'State the AI-agent disclosure and call-recording consent ' +
            'rules, the transcript and complaint data privacy and ' +
            'redaction discipline, the fairness controls on value-based ' +
            'routing, the dispute and complaint compliance controls, the ' +
            'agent-monitoring and labour-relations guardrails, and the ' +
            'regulatory frames (UDAAP, Reg E, Reg Z, CFPB complaint ' +
            'expectations, consent and disclosure rules, GLBA and ' +
            'privacy law) that bound the design.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the servicing-systems stack, and the phased rollout by ' +
            'channel and contact type.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Customer-Servicing Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the customer-servicing AI ' +
        'capability so value reaches cost to serve, avoidable demand, ' +
        'and the conduct and retention record, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and knowledge-base ' +
            'validation, a pilot channel or contact-type group, agent ' +
            'and supervisor onboarding, scale across channels — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, knowledge-base and data readiness, agent and ' +
            'supervisor adoption, dispute-and-complaint compliance, the ' +
            'contact-driver closed loop, Tower measurement.',
        },
        {
          heading: 'Agent and supervisor adoption approach',
          guidance:
            'Define the change runway for agents and supervisors — ' +
            'training, the shift in the resolution and routing workflow, ' +
            'and the move from handle-time to resolution-and-compliance ' +
            'management — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Deflection-quality and contact-driver loop plan',
          guidance:
            'Define how genuine resolution is verified against ' +
            'containment, how the avoidable-contact view is maintained, ' +
            'and how the closed loop to the deposit, payments, lending, ' +
            'fee, and digital owners is run — the discipline that ' +
            'removes failure demand at source.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged complaint-rate and CSAT ' +
            'metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — false deflection, fragmented channel ' +
            'data, a stale knowledge base, dispute or complaint ' +
            'compliance breach, slow upstream fixes, agent adoption ' +
            'resistance, privacy and consent exposure — with the ' +
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
      claim: 'The true cost to serve and the contact mix behind it',
      authoritativeSource:
        'The contact-center cost ledger and workforce-management system, ' +
        'allocated to contact volume by channel and issue type.',
      whatGoodEvidenceLooksLike:
        'A fully-loaded cost per contact computed by channel, with the ' +
        'agent, technology, and overhead components and the contact mix ' +
        'shown, so the channel-shift opportunity is visible.',
      weakEvidenceToReject:
        'A single blended cost-per-contact figure with no channel ' +
        'breakdown, or a labour-only number that ignores technology and ' +
        'overhead.',
    },
    {
      claim: 'Whether digital self-service deflection is genuine resolution',
      authoritativeSource:
        'The digital banking and virtual-assistant platforms, measuring ' +
        'genuine resolution with abandonment and escalation behind a ' +
        'contained session separated out.',
      whatGoodEvidenceLooksLike:
        'A digital self-service resolution rate that counts only ' +
        'journeys ending resolved without an agent, with the abandoned ' +
        'and escalated share quantified and CSAT measured on those ' +
        'journeys.',
      weakEvidenceToReject:
        'A containment or "sessions handled" figure presented as ' +
        'deflection, with no separation of customers who abandoned or ' +
        'escalated unresolved.',
    },
    {
      claim: 'Whether disputes and complaints are handled within the rules',
      authoritativeSource:
        'The dispute / chargeback management and complaint-management ' +
        'systems, time-stamped against the Reg E, Reg Z, and regulatory ' +
        'response clocks.',
      whatGoodEvidenceLooksLike:
        'Dispute cycle time and complaint resolution time measured ' +
        'against the regulatory deadlines, with any breaches, ' +
        'provisional-credit timing, and complaint-capture completeness ' +
        'shown.',
      weakEvidenceToReject:
        'An average dispute or complaint turnaround with no view of ' +
        'deadline breaches, or a complaint count with no evidence the ' +
        'capture is complete.',
    },
    {
      claim: 'The avoidable share of contact volume and its drivers',
      authoritativeSource:
        'Contact-reason coding and contact-driver analytics joined to ' +
        'product, fee, payment, and digital-incident data.',
      whatGoodEvidenceLooksLike:
        'An avoidable-contact share quantified against a contact-driver ' +
        'taxonomy, with recurring drivers traced to the owning upstream ' +
        'product function and the failure demand separated from genuine ' +
        'need.',
      weakEvidenceToReject:
        'A flat total contact-volume number with no driver analysis, or ' +
        'an avoidable-contact estimate based on agent guesswork rather ' +
        'than coded transcripts.',
    },
    {
      claim: 'The forecast value of a customer-servicing AI Move',
      authoritativeSource:
        'The value model — cost-to-serve, avoidable-demand, and ' +
        'complaint-and-conduct-cost components, each haircut by its ' +
        'dominant factors — read against the bank’s servicing-data ' +
        'maturity and genuine resolution rate.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring cost, avoidable-demand, and ' +
        'complaint-cost gains kept distinct, the compliance ceiling held ' +
        'as a hard bound, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor deflection-rate claim ' +
        'taken at face value, or a forecast that ignores the ' +
        'deflection-quality, compliance, or upstream-fix haircuts.',
    },
  ],
};
