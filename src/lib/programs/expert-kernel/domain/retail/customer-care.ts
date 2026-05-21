// Domain Function Pack — Retail · Customer care & service operations.
//
// Function key: `customer_care`.
//
// Customer care is the function that runs the retailer's service relationship
// with the customer after — and around — the sale: the contact centre, the
// digital service channels, the chat and messaging surfaces, the email and
// social queues, and the order, returns, delivery, and complaint resolution
// that sit behind them. It owns the journey of a customer who has a problem,
// a question, or a request — a delayed delivery, a faulty product, a refund,
// a where-is-my-order, a sizing question — and it is judged on whether that
// journey ends with the issue resolved, resolved once, resolved fast, and the
// customer still willing to come back. It is a cost line and a loyalty line at
// the same time: every contact has a cost to serve, and every contact is a
// moment that either repairs or erodes the relationship the loyalty function
// spent to build.
//
// The operating reality the pack encodes: most retail care operations are run
// as a cost centre measured on handle time and queue length, staffed reactively
// to a volume they do not forecast well, and blind to the upstream defects —
// the broken delivery promise, the confusing returns policy, the out-of-stock
// substitution — that generate the contacts in the first place. The function
// fails when it treats demand as a given rather than a symptom: it scales
// agents to absorb avoidable contacts instead of removing them, it routes work
// by queue rather than by customer intent and value, it resolves the ticket
// without resolving the cause, and it cannot tell a genuinely deflected contact
// from a customer who simply gave up. The AI archetypes are the recurring bets
// against that reality: conversational self-service and deflection, agent
// assist and real-time guidance, intelligent contact routing and triage,
// contact-driver and quality intelligence, service-demand forecasting and
// scheduling, and proactive service and order-status outreach.
//
// The companion retail packs decide the assortment, the price, the delivery
// promise, and the in-store visit; customer care is where the broken promise
// lands. Its sister function customer-loyalty-personalization owns who the
// customer is and why they come back; customer care owns whether a service
// failure quietly sends them away.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const customerCarePack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'customer_care',
  functionLabel: 'Customer care & service operations',
  summary:
    'Customer care is the function that runs the retailer’s service ' +
    'relationship with the customer after and around the sale — the ' +
    'contact centre, the digital service channels, chat and messaging, the ' +
    'email and social queues, and the order, returns, delivery, and ' +
    'complaint resolution behind them. It owns the journey of a customer ' +
    'with a problem, a question, or a request, and is judged on whether ' +
    'that journey ends with the issue resolved, resolved once, resolved ' +
    'fast, and the customer still willing to return. It is a cost line and ' +
    'a loyalty line at once: every contact has a cost to serve and is a ' +
    'moment that repairs or erodes the relationship. It fails when it ' +
    'treats contact demand as a given rather than a symptom — scaling ' +
    'agents to absorb avoidable contacts instead of removing the upstream ' +
    'defect, routing by queue rather than by intent and value, resolving ' +
    'the ticket without resolving the cause, and unable to tell a genuinely ' +
    'deflected contact from a customer who simply gave up.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'first_contact_resolution',
      name: 'First-contact resolution (FCR)',
      definition:
        'The share of customer contacts fully resolved in a single ' +
        'interaction — no callback, no re-contact on the same issue, no ' +
        'escalation needed — measured across all service channels.',
      unit: '% of contacts resolved on the first interaction',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 85,
        basis:
          'First-contact resolution varies by issue mix and channel — ' +
          'simple order-status questions resolve high, complex delivery ' +
          'and warranty disputes resolve lower. A planning range; the ' +
          'contact-type mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-centre / CRM ticketing system, joining a contact to ' +
        'any re-contact on the same issue within a defined window.',
      whyItMatters:
        'It is the single best read on whether care actually solves the ' +
        'customer’s problem — a low FCR multiplies cost through repeat ' +
        'contacts and is the strongest in-contact driver of whether the ' +
        'customer leaves satisfied or frustrated.',
    },
    {
      key: 'contacts_per_order',
      name: 'Contacts per order',
      definition:
        'The number of customer-service contacts generated per order ' +
        'placed — the rate at which fulfilled demand turns into a service ' +
        'interaction the retailer must staff and pay to handle.',
      unit: 'service contacts per 100 orders',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'Contacts per order depends on category complexity, the ' +
          'reliability of the delivery promise, and how clear policy and ' +
          'self-service are; the band spans a low-friction operation to a ' +
          'defect-heavy one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-centre system for contact volume joined to order ' +
        'counts from the order-management system.',
      whyItMatters:
        'It is the contact-demand efficiency metric — a high or rising ' +
        'rate means orders are generating avoidable friction upstream, and ' +
        'it reframes care volume as a symptom of operational defects ' +
        'rather than a fixed cost to absorb.',
    },
    {
      key: 'self_service_resolution_rate',
      name: 'Self-service resolution rate',
      definition:
        'The share of customer service journeys started in a self-service ' +
        'channel — help centre, chatbot, automated order tracking — that ' +
        'reach resolution without an agent, distinct from sessions that ' +
        'abandon or escalate.',
      unit: '% of self-service journeys resolved without an agent',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 70,
        basis:
          'Self-service resolution depends on the breadth of the knowledge ' +
          'base and the capability of the conversational layer; the band ' +
          'spans a thin help centre to a mature assisted-service estate. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The self-service and chatbot platforms, measured by genuine ' +
        'resolution rather than session start, with abandons and ' +
        'escalations separated.',
      whyItMatters:
        'It is the honest read on deflection — only a journey that ends ' +
        'resolved without an agent removed cost, so this metric separates ' +
        'a genuinely served customer from one who gave up or escalated ' +
        'anyway.',
    },
    {
      key: 'customer_satisfaction_score',
      name: 'Customer satisfaction score (CSAT)',
      definition:
        'The share of post-contact survey respondents who rate the ' +
        'service interaction as satisfied or better — the customer’s ' +
        'immediate verdict on the care they received.',
      unit: '% of surveyed contacts rated satisfied or better',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 75,
        high: 92,
        basis:
          'CSAT varies by channel, issue type, and survey method; the band ' +
          'spans a strained service operation to a strong one. A planning ' +
          'range; survey design and issue mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The post-contact survey platform, scored per contact and ' +
        'segmented by channel, issue type, and agent.',
      whyItMatters:
        'It is the customer’s direct rating of the service moment — a ' +
        'falling CSAT, especially on high-value customers or a specific ' +
        'issue type, is the leading signal of the loyalty erosion that ' +
        'shows up later in retention.',
    },
    {
      key: 'average_handle_time',
      name: 'Average handle time (AHT)',
      definition:
        'The average time an agent spends actively handling a contact — ' +
        'talk or chat time plus after-contact wrap-up work — across the ' +
        'period, by channel.',
      unit: 'minutes per agent-handled contact',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 4,
        high: 12,
        basis:
          'Handle time is structural by channel and issue complexity — ' +
          'voice runs longer than chat, a returns dispute longer than an ' +
          'order-status check. A planning range, not a target — cutting it ' +
          'below the band sacrifices resolution quality.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-centre platform, capturing handle and wrap-up time ' +
        'per contact by channel and issue type.',
      whyItMatters:
        'It is the core unit-cost driver of agent-handled service, but it ' +
        'must be read as a balance — squeezing handle time at the expense ' +
        'of first-contact resolution simply pushes cost into repeat ' +
        'contacts.',
    },
    {
      key: 'cost_per_contact',
      name: 'Cost per contact',
      definition:
        'The fully-loaded operating cost — agent labour, technology, and ' +
        'overhead — of handling one customer-service contact, computed by ' +
        'channel.',
      unit: 'USD per contact',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 12,
        basis:
          'Cost per contact spans an enormous range by channel — automated ' +
          'self-service is a fraction of a voice contact — and by labour ' +
          'market. A planning range; the channel mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The contact-centre cost ledger and workforce-management system, ' +
        'allocated to contact volume by channel.',
      whyItMatters:
        'It is the function’s cost-to-serve metric — it tells the ' +
        'retailer what each service interaction costs and is the figure ' +
        'every deflection, automation, and channel-shift decision moves.',
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
        'The contact-centre / automatic-call-distribution platform, ' +
        'measuring answered contacts against the target wait threshold.',
      whyItMatters:
        'It is the access read on the service operation — a queue that ' +
        'misses service level drives abandonment, repeat contacts, and ' +
        'frustration, and it is the first metric to break when demand is ' +
        'mis-forecast.',
    },
    {
      key: 'contact_abandonment_rate',
      name: 'Contact abandonment rate',
      definition:
        'The share of customers who join a service queue — voice, chat, ' +
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
        'The contact-centre platform, identifying queued contacts that ' +
        'disconnect before agent contact or resolution.',
      whyItMatters:
        'An abandoned contact is an unresolved problem and an unmeasured ' +
        'failure — it often masquerades as deflection while the customer ' +
        'leaves with the issue intact, so it is the honesty check on the ' +
        'service-access numbers.',
    },
    {
      key: 'escalation_rate',
      name: 'Escalation rate',
      definition:
        'The share of contacts that an agent cannot resolve at the first ' +
        'tier and must hand to a supervisor, a specialist team, or a ' +
        'higher support tier.',
      unit: '% of contacts escalated beyond first-tier resolution',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 20,
        basis:
          'Escalation depends on agent enablement, the clarity of policy, ' +
          'and issue complexity; the band spans a well-equipped front line ' +
          'to one that must hand work up. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CRM / ticketing system, tracking contacts transferred beyond ' +
        'the first-tier agent.',
      whyItMatters:
        'Escalation is slow, expensive, and frustrating for the customer ' +
        '— a high rate signals the front line is not enabled with the ' +
        'knowledge or authority to resolve, and it is a direct drag on ' +
        'first-contact resolution and cost.',
    },
    {
      key: 'avoidable_contact_share',
      name: 'Avoidable-contact share',
      definition:
        'The share of total contact volume attributable to an upstream, ' +
        'preventable defect — a broken delivery promise, a confusing ' +
        'policy, a website error — rather than to a genuine, ' +
        'unavoidable customer need.',
      unit: '% of contacts traced to a preventable upstream cause',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 50,
        basis:
          'The avoidable share depends on operational reliability and the ' +
          'maturity of contact-driver analysis; the band spans a clean ' +
          'operation to a defect-heavy one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Contact-reason coding and contact-driver analytics joined to ' +
        'order, delivery, and fulfilment exception data.',
      whyItMatters:
        'It is the metric that turns care from a cost to absorb into a ' +
        'lens on the rest of the business — every avoidable contact is a ' +
        'defect to fix at source, and reducing it removes cost permanently ' +
        'rather than staffing to it.',
    },
    {
      key: 'service_nps',
      name: 'Service Net Promoter Score',
      definition:
        'The Net Promoter Score derived from the post-service survey — ' +
        'the share of promoters less the share of detractors among ' +
        'customers who recently contacted care.',
      unit: 'NPS points (−100 to +100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Service NPS varies by segment and survey method; the band spans ' +
          'a strained service experience to a strong one on a typical ' +
          'retail NPS scale. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-experience survey platform, scored on the ' +
        'post-service survey and segmented by issue type and resolution ' +
        'outcome.',
      whyItMatters:
        'It is the customer’s loyalty verdict on how a problem was ' +
        'handled — a well-resolved issue can lift advocacy above a ' +
        'no-problem baseline, while a botched one is one of the fastest ' +
        'ways to create a detractor.',
    },
    {
      key: 'agent_attrition_rate',
      name: 'Agent attrition rate',
      definition:
        'The share of customer-service agents who leave the role over a ' +
        'rolling annualised period — voluntary and involuntary departures ' +
        'as a share of the agent headcount.',
      unit: '% annualised agent turnover',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Contact-centre attrition runs structurally high and varies with ' +
          'role design, pay, and how much avoidable, frustrating contact ' +
          'agents absorb; the band spans a stable operation to a churning ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The HR / workforce-management system, tracking agent departures ' +
        'against the agent headcount.',
      whyItMatters:
        'Attrition is a large hidden cost of the care operation — ' +
        'recruiting and ramping a new agent is expensive and a new agent ' +
        'resolves less well, so attrition both raises cost and depresses ' +
        'first-contact resolution and CSAT.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'demand_treated_as_given',
      name: 'Contact demand treated as a given, not a symptom',
      description:
        'The care operation staffs to absorb whatever contact volume ' +
        'arrives and never asks why the contacts exist. Avoidable ' +
        'contacts driven by broken delivery promises, confusing policy, ' +
        'and website defects are handled efficiently rather than removed, ' +
        'so the cost base is permanently inflated by failure demand.',
      detectionSignal:
        'Contacts per order is high or rising; the avoidable-contact ' +
        'share is large or unmeasured; capacity planning forecasts volume ' +
        'but no one owns reducing it.',
      diagnosticQuestion:
        'What share of contact volume is avoidable failure demand, and ' +
        'who is accountable for removing the upstream defects rather than ' +
        'staffing to absorb them?',
    },
    {
      key: 'false_deflection',
      name: 'False deflection — abandonment counted as self-service',
      description:
        'Self-service and chatbot metrics count a contained session as a ' +
        'success even when the customer abandoned unresolved or simply ' +
        'gave up. Reported deflection looks strong while the real issue ' +
        'goes unsolved, resurfaces as a repeat contact, or churns the ' +
        'customer silently.',
      detectionSignal:
        'Self-service "containment" is high but escalation, repeat ' +
        'contact, and abandonment behind it are not separated; CSAT on ' +
        'self-service journeys is low or unmeasured.',
      diagnosticQuestion:
        'Does the self-service resolution rate measure genuine resolution, ' +
        'or does it count abandoned and given-up sessions as deflected ' +
        'contacts?',
    },
    {
      key: 'handle_time_tyranny',
      name: 'Handle-time tyranny over resolution quality',
      description:
        'The operation is managed to average handle time as the dominant ' +
        'target, so agents are pushed to close contacts fast rather than ' +
        'to resolve them fully. Handle time falls while first-contact ' +
        'resolution and repeat contacts quietly worsen, and the cost ' +
        'simply moves to the second call.',
      detectionSignal:
        'Handle time is the headline agent metric; first-contact ' +
        'resolution is low or untracked; repeat-contact rate is rising ' +
        'even as handle time improves.',
      diagnosticQuestion:
        'Is the operation managed to resolution and repeat-contact rate, ' +
        'or to handle time alone — and is cut handle time simply ' +
        'reappearing as a second contact?',
    },
    {
      key: 'fragmented_channel_experience',
      name: 'Fragmented, channel-siloed service experience',
      description:
        'Voice, chat, email, social, and self-service run as separate ' +
        'queues on separate systems with no shared context. A customer ' +
        'who switches channel or re-contacts must re-explain the issue ' +
        'from the start, and the agent cannot see what was already tried.',
      detectionSignal:
        'Channels run on disconnected platforms; agents lack a unified ' +
        'contact and interaction history; customers report having to ' +
        'repeat themselves across channels.',
      diagnosticQuestion:
        'Can an agent in any channel see the customer’s full prior ' +
        'interaction history, or does each channel operate as an island ' +
        'with no shared context?',
    },
    {
      key: 'knowledge_inconsistency',
      name: 'Inconsistent knowledge and answers',
      description:
        'Agents rely on scattered, out-of-date knowledge sources and ' +
        'personal memory, so the same policy or product question gets ' +
        'different answers from different agents. Customers receive ' +
        'inconsistent, sometimes wrong information, and trust in the ' +
        'service operation erodes.',
      detectionSignal:
        'Knowledge content is fragmented and stale; quality monitoring ' +
        'finds inconsistent answers to the same question; escalations ' +
        'cluster on policy-interpretation uncertainty.',
      diagnosticQuestion:
        'Do agents work from a single, current, governed knowledge ' +
        'source, or does the answer a customer gets depend on which agent ' +
        'they reach?',
    },
    {
      key: 'reactive_volume_blindsides',
      name: 'Reactive staffing blindsided by demand spikes',
      description:
        'Service-demand forecasting is coarse and slow, so promotion ' +
        'peaks, delivery disruptions, product-issue spikes, and seasonal ' +
        'surges blindside the operation. The queue collapses, wait and ' +
        'abandonment spike, and the response is expensive overtime or a ' +
        'degraded customer experience.',
      detectionSignal:
        'Service level and abandonment swing sharply around promotions ' +
        'and disruptions; staffing is set on coarse averages; intraday ' +
        'and event-driven demand is not forecast.',
      diagnosticQuestion:
        'How well does service-demand forecasting anticipate promotion, ' +
        'disruption, and seasonal spikes, and how reliably does staffing ' +
        'flex to them?',
    },
    {
      key: 'resolve_ticket_not_cause',
      name: 'Resolving the ticket without resolving the cause',
      description:
        'Each contact is closed in isolation with no feedback loop to the ' +
        'function that caused it. A recurring delivery failure, a ' +
        'mislabelled product, or a broken policy generates contact after ' +
        'contact, and care absorbs every one without the root cause ever ' +
        'reaching merchandising, fulfilment, or digital.',
      detectionSignal:
        'Contact-reason data is not analysed for recurring drivers; there ' +
        'is no closed loop from care to the owning function; the same ' +
        'issue generates contacts month after month.',
      diagnosticQuestion:
        'Is there a closed feedback loop from contact drivers to the ' +
        'functions that own the cause, or does care resolve tickets while ' +
        'the defect keeps generating them?',
    },
    {
      key: 'agent_overload_and_attrition',
      name: 'Agent overload, burnout, and attrition spiral',
      description:
        'Agents absorb a high load of frustrating, avoidable, low-' +
        'autonomy contacts with thin tools and knowledge. Burnout drives ' +
        'attrition, attrition leaves the floor under-staffed and ' +
        'under-skilled, and the under-staffed floor raises the load on ' +
        'those who remain — a self-reinforcing spiral.',
      detectionSignal:
        'Agent attrition is high; new agents are a large share of the ' +
        'floor; quality and first-contact resolution dip with tenure mix; ' +
        'agents report tool and knowledge friction.',
      diagnosticQuestion:
        'How is the agent experience and workload measured, and is ' +
        'attrition treated as a managed cost driver or accepted as an ' +
        'unavoidable feature of the operation?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'conversational_self_service',
      name: 'Conversational self-service and deflection',
      valueMechanism:
        'A conversational AI assistant handles routine, well-bounded ' +
        'service journeys end to end — order status, returns initiation, ' +
        'policy questions, simple account changes — grounded in the ' +
        'retailer’s own order, policy, and product data, and resolves them ' +
        'without an agent or hands a warm, context-rich transfer when it ' +
        'cannot. Value comes from genuinely resolving high-volume routine ' +
        'contacts at a fraction of agent cost while keeping resolution ' +
        'quality and satisfaction intact — deflection that the customer ' +
        'experiences as service, not as a wall.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Order, delivery, and returns status from the order-management ' +
          'system',
        'A current, governed service knowledge base of policy and ' +
          'how-to content',
        'Product catalogue and account data',
        'Conversation transcripts and resolution outcomes for tuning',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The assistant resolves bounded journeys autonomously within a ' +
          'defined scope; anything outside scope is a warm, context-rich ' +
          'transfer to an agent, never a dead end.',
        'It must answer only from current grounded data — a confidently ' +
          'wrong policy, order-status, or refund answer damages trust at ' +
          'the worst moment.',
        'Deflection must be measured as genuine resolution, not ' +
          'containment — an assistant that strands the customer creates ' +
          'failure demand and silent churn.',
      ],
      metricsMoved: [
        'self_service_resolution_rate',
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
        'An AI copilot works alongside the agent during a live contact — ' +
        'surfacing the customer’s history and order context, retrieving ' +
        'the right knowledge-base answer, suggesting the next step, and ' +
        'drafting the response and the after-contact summary. Value comes ' +
        'from lifting first-contact resolution and consistency while ' +
        'cutting handle and wrap-up time and shortening the ramp for new ' +
        'agents — closing the knowledge gap that drives escalation and ' +
        'inconsistent answers.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Unified customer, order, and interaction history',
        'A current, governed service knowledge base',
        'Live contact transcript or chat context',
        'Resolution-outcome and quality data for tuning the guidance',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot suggests and drafts; the agent owns the customer ' +
          'conversation, the judgement, and every answer sent — it is an ' +
          'aid, not an autonomous responder.',
        'Suggestions must be grounded in current policy and data and cite ' +
          'their source so the agent can verify before relying on them.',
        'Agent monitoring and assist must respect agent privacy and ' +
          'labour-relations norms and not become a covert surveillance ' +
          'tool.',
      ],
      metricsMoved: [
        'first_contact_resolution',
        'average_handle_time',
        'escalation_rate',
        'customer_satisfaction_score',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'intelligent_routing_triage',
      name: 'Intelligent contact routing and triage',
      valueMechanism:
        'A model reads each inbound contact — its intent, sentiment, ' +
        'complexity, and the customer’s value and history — and routes it ' +
        'to the channel, the automation, or the agent skill best able to ' +
        'resolve it first time, rather than to the next available queue. ' +
        'Value comes from raising first-contact resolution and cutting ' +
        'escalation and transfer by matching the contact to the right ' +
        'resolver, and from protecting high-value and high-distress ' +
        'customers with priority handling.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inbound contact text, intent, and sentiment signal',
        'Customer profile, value tier, and prior-interaction history',
        'Agent skill, availability, and performance data',
        'Issue-type and resolution-path outcome history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model routes; service operations owns the routing policy and ' +
          'the skill-and-priority rules, and an agent can re-route on ' +
          'local judgement.',
        'Value-based prioritisation must not produce unfair or ' +
          'discriminatory service tiers — every customer is owed a ' +
          'baseline standard the routing cannot drop below.',
        'Intent and sentiment classification is imperfect — a ' +
          'mis-routed urgent or distressed contact must be easy to ' +
          'recover, not buried in the wrong queue.',
      ],
      metricsMoved: [
        'first_contact_resolution',
        'escalation_rate',
        'service_level',
        'service_nps',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'contact_driver_quality_intelligence',
      name: 'Contact-driver and quality intelligence',
      valueMechanism:
        'A model analyses every contact transcript and ticket at scale — ' +
        'classifying the true reason, detecting recurring drivers, ' +
        'spotting emerging issues, and scoring interaction quality ' +
        'across the whole volume rather than a sampled few. Value comes ' +
        'from turning care into the early-warning system for the rest of ' +
        'the business: it quantifies the avoidable-contact share, names ' +
        'the upstream defects to fix, and replaces thin manual quality ' +
        'sampling with full-coverage insight.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Full contact transcripts and ticket text across channels',
        'Contact-reason taxonomy and resolution-outcome data',
        'Order, delivery, and fulfilment exception data to attribute ' +
          'drivers',
        'Quality-evaluation criteria and historical scored samples',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model classifies and surfaces drivers; service and ' +
          'operations leaders own the fix decisions and the closed loop to ' +
          'the owning function.',
        'Automated quality scoring informs coaching; it must be calibrated, ' +
          'transparent, and never the sole basis for an agent performance ' +
          'action without human review.',
        'Transcript analysis must respect customer and agent privacy and ' +
          'data-use consent, and redact sensitive personal data.',
      ],
      metricsMoved: [
        'avoidable_contact_share',
        'contacts_per_order',
        'first_contact_resolution',
        'customer_satisfaction_score',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'service_demand_forecasting_scheduling',
      name: 'Service-demand forecasting and scheduling',
      valueMechanism:
        'A model forecasts contact volume by channel, interval, and ' +
        'issue type — folding in promotion calendars, delivery and supply ' +
        'disruptions, product-issue signals, weather, and seasonality — ' +
        'and builds the agent schedule that matches capacity to that ' +
        'demand within budget and labour constraints. Value comes from ' +
        'holding service level and abandonment steady through spikes ' +
        'without expensive overtime or over-staffing the quiet intervals.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical contact volume by channel, interval, and issue type',
        'Promotion, marketing, and product-launch calendars',
        'Delivery, supply, and fulfilment disruption signals',
        'Agent availability, skills, and labour-budget constraints',
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
      key: 'proactive_service_outreach',
      name: 'Proactive service and order-status outreach',
      valueMechanism:
        'A model detects, from order, delivery, and fulfilment signals, ' +
        'the situations that are about to generate an inbound contact — a ' +
        'delayed delivery, a cancelled line, a substitution, a failed ' +
        'payment — and reaches the customer first with a clear, ' +
        'resolution-ready message before they have to call. Value comes ' +
        'from removing avoidable inbound contacts entirely and turning a ' +
        'potential service failure into a moment of trust.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Real-time order, delivery, and fulfilment exception signals',
        'Customer contact preferences and consented channels',
        'A resolved customer identity and order history',
        'Resolution paths and remediation options for each exception type',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model triggers proactive outreach; service leadership owns ' +
          'the outreach policy, the message content, and the remediation ' +
          'options offered.',
        'Outreach must honour consent and contact-preference rules and a ' +
          'shared frequency budget — proactive must not become intrusive ' +
          'or over-messaging.',
        'A proactive message must be genuinely resolution-ready — an ' +
          'alert with no clear next step simply moves the inbound contact ' +
          'rather than removing it.',
      ],
      metricsMoved: [
        'contacts_per_order',
        'avoidable_contact_share',
        'service_nps',
        'customer_satisfaction_score',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'tiered_assisted_service_layer',
      name: 'Tiered assisted-service layer',
      description:
        'A pattern that fronts the service operation with a conversational ' +
        'AI layer resolving bounded routine journeys end to end, behind ' +
        'which sits agent-assisted resolution and then specialist ' +
        'escalation — with a warm, context-rich handoff at each tier so ' +
        'the customer never restarts and the routine volume never reaches ' +
        'an agent.',
      boundary:
        'It resolves only journeys inside a defined, governed scope and ' +
        'hands a warm transfer for anything beyond it; it does not ' +
        'autonomously make exception or goodwill decisions reserved for an ' +
        'agent.',
      humanAccountabilityPoint:
        'The head of customer service accountable for service ' +
        'resolution, deflection quality, and the cost to serve.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'unified_agent_workspace',
      name: 'Unified agent-workspace and copilot pattern',
      description:
        'A pattern that gives every agent one workspace across all ' +
        'channels — the resolved customer and order history, the live ' +
        'contact context, and an AI copilot that retrieves grounded ' +
        'answers, suggests the next step, and drafts the response and the ' +
        'wrap-up — so resolution is fast, consistent, and channel-blind.',
      boundary:
        'It surfaces context and suggests; the agent owns every answer ' +
        'and the customer conversation. It does not auto-send a response ' +
        'or close a contact without the agent.',
      humanAccountabilityPoint:
        'The service-operations director accountable for agent ' +
        'enablement, resolution quality, and answer consistency.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'intent_aware_routing_fabric',
      name: 'Intent-aware routing fabric',
      description:
        'A pattern that classifies every inbound contact by intent, ' +
        'sentiment, complexity, and customer value and routes it to the ' +
        'automation, channel, or agent skill best able to resolve it ' +
        'first time — replacing next-available-queue routing with ' +
        'resolver-matched routing inside a governed service-standard ' +
        'floor.',
      boundary:
        'It routes within a governed policy; service operations owns the ' +
        'routing and priority rules and an agent can re-route. It cannot ' +
        'drop any customer below the baseline service standard.',
      humanAccountabilityPoint:
        'The service-operations lead accountable for the routing policy ' +
        'and equitable service standards.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'contact_driver_closed_loop',
      name: 'Contact-driver closed-loop pattern',
      description:
        'A pattern that analyses every contact at scale to classify its ' +
        'true driver, quantify the avoidable-contact share, and feed a ' +
        'governed, prioritised defect queue back to the merchandising, ' +
        'fulfilment, digital, and policy owners — closing the loop so ' +
        'failure demand is removed at source, not absorbed.',
      boundary:
        'It detects, attributes, and prioritises drivers; the owning ' +
        'function owns the fix and the service operation owns the loop. ' +
        'It does not itself change upstream process or policy.',
      humanAccountabilityPoint:
        'The customer-experience or service-operations leader ' +
        'accountable for failure demand and the cross-functional fix loop.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'proactive_resolution_pattern',
      name: 'Proactive-resolution pattern',
      description:
        'A pattern that monitors order, delivery, and fulfilment signals ' +
        'for situations about to generate an inbound contact and reaches ' +
        'the customer first with a clear, resolution-ready message and ' +
        'remediation options — converting a looming service failure into ' +
        'a contained, trust-building interaction before the customer ' +
        'calls.',
      boundary:
        'It triggers outreach within a consent and frequency-governed ' +
        'frame; service leadership owns the outreach policy and the ' +
        'remediation options. It does not exceed the customer’s consented ' +
        'contact budget.',
      humanAccountabilityPoint:
        'The customer-service leader accountable for proactive-service ' +
        'policy and avoidable inbound volume.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Customer-care value is realised in three connected ways and a ' +
      'forecast must keep them distinct. First, cost to serve: genuine ' +
      'conversational deflection, agent-assist productivity, and sharper ' +
      'demand forecasting handle the same or more contacts at a lower ' +
      'fully-loaded cost — a recurring saving, but only where deflection ' +
      'is genuine resolution rather than abandonment relabelled. Second, ' +
      'avoidable-demand elimination: contact-driver intelligence and ' +
      'proactive outreach remove failure demand at source, so the cost ' +
      'falls permanently rather than being staffed more cheaply — the ' +
      'most durable lever, because a contact never made costs nothing. ' +
      'Third, retained loyalty value: faster, first-time, consistent ' +
      'resolution turns service moments from churn risks into trust, ' +
      'protecting the lifetime value the loyalty function spent to build. ' +
      'The dominant constraint is that care value is realised through ' +
      'thousands of agent interactions and customer self-service journeys, ' +
      'so the gain is paced by adoption, by data and channel integration, ' +
      'and by the honesty of the deflection measurement — a forecast must ' +
      'be read against the retailer’s service-data maturity and the real ' +
      'resolution rate, not a containment number. All three levers are ' +
      'recurring once realised, but the loyalty lever in particular ' +
      'compounds only as fast as a customer relationship and retention ' +
      'cycle runs.',
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
            'The share of a modelled care saving not realised because ' +
            'reported deflection is containment rather than genuine ' +
            'resolution; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data and channel integration readiness',
        rationale:
          'Deflection, agent assist, routing, and proactive outreach all ' +
          'depend on a resolved customer identity, current order and ' +
          'delivery data, a governed knowledge base, and connected ' +
          'channels. Fragmented systems and stale knowledge cap how much ' +
          'of the modelled value the use cases can deliver.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Value erosion from fragmented service channels, missing ' +
            'integration, and a stale knowledge base; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Upstream-fix dependency for failure demand',
        rationale:
          'Avoidable-contact reduction needs the merchandising, ' +
          'fulfilment, digital, and policy owners to actually fix the ' +
          'defects care surfaces. Where the closed loop is weak or those ' +
          'functions do not act, the failure-demand gain stays on the ' +
          'page — care can name the cause but not remove it alone.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'The share of a modelled failure-demand reduction bounded by ' +
            'whether upstream functions act on the surfaced defects; a ' +
            'planning range.',
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
            'agent assist, intent-aware routing, and consistent ' +
            'knowledge; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the share of contacts resolved on ' +
          'the first interaction.',
      },
      {
        lever: 'Service-driven retention value',
        range: {
          low: 1,
          high: 5,
          basis:
            'Relative reduction in churn among customers with a service ' +
            'contact, from faster first-time resolution; a planning range ' +
            '— retained lifetime value, read against the loyalty model.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in churn among customers who ' +
          'contacted care, measured against a comparable baseline.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot channel or ' +
      'contact-type group (deflection rate, handle time, first-contact ' +
      'resolution); 9–18 months to a settled result, because the ' +
      'avoidable-demand and retention gains only prove out once the ' +
      'closed loop to upstream functions runs and a full promotional and ' +
      'seasonal demand cycle has passed.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Contact-centre / CCaaS platform',
        role:
          'The system of record for contact handling — routing, queuing, ' +
          'voice and digital channel management, and the interaction ' +
          'metrics: service level, handle time, abandonment.',
        examples: [
          'Genesys Cloud',
          'NICE CXone',
          'Amazon Connect',
          'Five9',
        ],
      },
      {
        name: 'CRM / customer-service and ticketing system',
        role:
          'Holds the case and ticket record, the customer-service ' +
          'history, and the resolution workflow — the source of ' +
          'first-contact resolution, escalation, and contact-reason data.',
        examples: [
          'Salesforce Service Cloud',
          'Zendesk',
          'ServiceNow Customer Service Management',
          'Gladly',
        ],
      },
      {
        name: 'Conversational-AI and self-service platform',
        role:
          'Runs the chatbot, virtual agent, and help-centre self-service ' +
          'layer — the source of the self-service resolution and ' +
          'deflection metrics.',
        examples: [
          'Salesforce Einstein / Agentforce',
          'Ada',
          'Sierra',
          'in-house conversational-AI assistants',
        ],
      },
      {
        name: 'Workforce-management (WFM) and quality system',
        role:
          'Forecasts contact demand, builds the agent schedule, tracks ' +
          'adherence, and runs interaction quality evaluation — the ' +
          'backbone of service-demand forecasting and scheduling.',
        examples: [
          'NICE Workforce Management',
          'Verint Workforce Management',
          'Genesys WFM',
          'Calabrio',
        ],
      },
      {
        name: 'Order-management and fulfilment systems',
        role:
          'Hold the order, delivery, returns, and fulfilment-exception ' +
          'state — the upstream signal proactive outreach and contact-' +
          'driver attribution depend on.',
        examples: [
          'Order-management systems',
          'returns-management platforms',
          'carrier and delivery-tracking systems',
        ],
      },
    ],
    roles: [
      {
        title: 'VP of Customer Service / Chief Customer Officer',
        accountability:
          'Owns the total customer-care strategy, the service-experience ' +
          'outcome, and the cost-to-serve and loyalty balance across all ' +
          'channels.',
      },
      {
        title: 'Director of service operations / contact centre',
        accountability:
          'Owns the running of the service operation — channels, ' +
          'staffing, service level, resolution quality, and the operating ' +
          'budget.',
      },
      {
        title: 'Workforce-management / capacity-planning lead',
        accountability:
          'Owns service-demand forecasting, the agent schedule, ' +
          'intraday management, and the match of capacity to demand.',
      },
      {
        title: 'Service-quality and knowledge manager',
        accountability:
          'Owns interaction-quality evaluation, the agent knowledge base, ' +
          'and the consistency and currency of the answers customers ' +
          'receive.',
      },
      {
        title: 'Customer-experience / contact-driver analyst',
        accountability:
          'Owns contact-driver analysis, the avoidable-contact view, and ' +
          'the closed loop from care insight to the functions that own ' +
          'the cause.',
      },
      {
        title: 'Team lead / service supervisor',
        accountability:
          'Owns a team of front-line agents — their resolution ' +
          'performance, coaching and development, escalations, and ' +
          'day-to-day floor management.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Consumer-protection and returns / refund law',
        relevance:
          'Governs returns rights, refund timelines, faulty-goods ' +
          'remedies, and complaint handling — the frame around how care ' +
          'must resolve a large class of contacts.',
      },
      {
        name: 'Consumer-privacy and data-protection law',
        relevance:
          'GDPR, CCPA / CPRA and equivalents govern how customer ' +
          'interaction data, transcripts, and recordings are captured, ' +
          'used, and retained — the frame around transcript analytics and ' +
          'AI tooling.',
      },
      {
        name: 'Call-recording, consent, and disclosure rules',
        relevance:
          'Govern recording consent, AI-agent disclosure, and ' +
          'communication consent across voice and messaging — a hard ' +
          'constraint on conversational AI and proactive outreach.',
      },
      {
        name: 'Accessibility and equal-service requirements',
        relevance:
          'Accessibility standards and equal-treatment rules require ' +
          'service channels to be usable by all customers — a constraint ' +
          'on self-service and routing design.',
      },
      {
        name: 'Labour and workforce-scheduling regulation',
        relevance:
          'Wage-and-hour, predictable-scheduling, and any ' +
          'collective-bargaining terms bound how the agent schedule and ' +
          'workload can be optimised.',
      },
    ],
    canonicalTerms: [
      {
        term: 'First-contact resolution (FCR)',
        definition:
          'The share of contacts fully resolved in a single interaction ' +
          'with no re-contact, callback, or escalation on the same issue.',
      },
      {
        term: 'Average handle time (AHT)',
        definition:
          'The average time an agent spends actively handling a contact ' +
          '— talk or chat time plus after-contact wrap-up work.',
      },
      {
        term: 'Deflection',
        definition:
          'A service journey resolved in a self-service or automated ' +
          'channel without an agent — genuine deflection requires ' +
          'resolution, not just session containment.',
      },
      {
        term: 'Failure demand',
        definition:
          'Contact volume generated by a preventable upstream defect — ' +
          'demand caused by failing the customer, as distinct from ' +
          'genuine, value-adding demand.',
      },
      {
        term: 'Service level',
        definition:
          'The share of contacts answered or accepted within a defined ' +
          'target wait — the classic "X% in Y seconds" queue measure.',
      },
      {
        term: 'Containment',
        definition:
          'A self-service session that ends without reaching an agent — ' +
          'a weaker measure than resolution, since it counts abandonment ' +
          'and give-up sessions.',
      },
      {
        term: 'Contact driver',
        definition:
          'The underlying reason a customer contacted care — the basis ' +
          'for distinguishing avoidable failure demand from genuine ' +
          'need.',
      },
      {
        term: 'Warm transfer',
        definition:
          'A handoff between channels or tiers that carries the full ' +
          'interaction context, so the customer does not restart the ' +
          'issue.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Customer-Care Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the customer-care operation is over-spending to ' +
        'serve, leaking deflection, and eroding loyalty — failure demand, ' +
        'false deflection, handle-time tyranny, channel fragmentation — ' +
        'with baseline evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Service operation and channel context',
          guidance:
            'Name the care operation in scope — channels, contact volume, ' +
            'agent headcount and attrition, the in-house and outsourced ' +
            'mix, and the service operating model. State which contact-' +
            'centre, CRM, conversational-AI, and workforce-management ' +
            'systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — first-contact resolution, contacts per ' +
            'order, self-service resolution, CSAT, handle time, cost per ' +
            'contact, service level, abandonment, escalation, avoidable-' +
            'contact share, service NPS, agent attrition. For any metric ' +
            'not recorded, name it as a precise seed gap with its ' +
            'expected data source.',
        },
        {
          heading: 'Contact-demand and deflection diagnostic',
          guidance:
            'Analyse where contact volume comes from, how much is ' +
            'avoidable failure demand, and whether reported self-service ' +
            'deflection is genuine resolution or containment masking ' +
            'abandonment and escalation.',
        },
        {
          heading: 'Resolution, quality, and agent-experience diagnostic',
          guidance:
            'Analyse first-contact resolution, escalation, and answer ' +
            'consistency across channels and agents, the balance between ' +
            'handle time and resolution quality, and how agent attrition ' +
            'and tooling friction are affecting the operation.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — demand treated as a given, ' +
            'false deflection, handle-time tyranny, fragmented channels, ' +
            'knowledge inconsistency, reactive staffing, resolving the ' +
            'ticket not the cause, agent overload — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — cost-to-serve reduction, avoidable-demand ' +
            'elimination, first-contact-resolution uplift, retention ' +
            'value — explicitly haircut by deflection-quality honesty, ' +
            'data and channel integration, upstream-fix dependency, and ' +
            'agent adoption. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — a ' +
            'true resolution rate behind containment, an avoidable-contact ' +
            'view — is a named ask, not a vague unknown.',
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
      label: 'Customer-Care Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a customer-care ' +
        'AI Move on this service operation — baseline, forecast, cost, ' +
        'and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring cost-to-serve reduction, avoidable-demand ' +
            'elimination, and retained loyalty value, the time-to-value ' +
            'band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — cost per contact, first-contact resolution, ' +
            'contacts per order, self-service resolution, avoidable-' +
            'contact share. Where a baseline is a seed gap (a true ' +
            'resolution rate behind containment is a common one), say so ' +
            'and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — deflection-quality ' +
            'honesty, data and channel integration, upstream-fix ' +
            'dependency, agent adoption — explicitly and show the haircut ' +
            'math. Keep recurring cost, avoidable-demand, and retention ' +
            'gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the contact-centre, CRM, ' +
            'conversational-AI, workforce-management, and order-' +
            'management systems, the knowledge-base remediation, and the ' +
            'operating-model change — agent and supervisor workflow.',
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
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example a knowledge base too stale to ground a ' +
            'conversational agent, or no closed loop to act on contact ' +
            'drivers — and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the measurement cadence, and how ' +
            'genuine resolution is verified against containment, ' +
            'including the lagged retention and service-NPS metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Customer-Care Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'customer-care AI capability, grounded in the function reference ' +
        'patterns, the deflection-quality discipline, and the privacy and ' +
        'consumer-protection frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — tiered assisted-service layer, unified agent ' +
            'workspace and copilot, intent-aware routing fabric, contact-' +
            'driver closed loop, proactive resolution — and state which ' +
            'apply and how they connect.',
        },
        {
          heading: 'Data, knowledge, and integration architecture',
          guidance:
            'Specify the contact-centre, CRM, conversational-AI, ' +
            'workforce-management, and order-management integrations, the ' +
            'resolved customer-identity approach, data freshness, and the ' +
            'governed-knowledge-base discipline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'warm-handoff and escalation design. Define genuine ' +
            'resolution measurement and the baseline service standard as ' +
            'hard constraints.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how agent, supervisor, workforce-management, and ' +
            'customer-experience workflows change, how the routing and ' +
            'quality cadence is reshaped, how the contact-driver loop ' +
            'reaches upstream owners, and who owns each change.',
        },
        {
          heading: 'Responsible-AI, privacy, and consumer-protection controls',
          guidance:
            'State the AI-agent disclosure and call-recording consent ' +
            'rules, the transcript-data privacy and redaction discipline, ' +
            'the fairness controls on value-based routing, the agent-' +
            'monitoring and labour-relations guardrails, and the ' +
            'regulatory frames (consumer-protection and returns law, ' +
            'privacy law, consent and disclosure rules, accessibility ' +
            'requirements) that bound the design.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'service-systems stack, and the phased rollout by channel and ' +
            'contact type.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Customer-Care Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the customer-care AI capability ' +
        'so value reaches cost to serve, avoidable demand, and customer ' +
        'loyalty, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and knowledge-base ' +
            'validation, a pilot channel or contact-type group, agent and ' +
            'supervisor onboarding, scale across channels — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, knowledge-base and data readiness, agent and ' +
            'supervisor adoption, the contact-driver closed loop, Tower ' +
            'measurement.',
        },
        {
          heading: 'Agent and supervisor adoption approach',
          guidance:
            'Define the change runway for agents and supervisors — ' +
            'training, the shift in the resolution and routing workflow, ' +
            'and the move from handle-time to resolution-led management — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Deflection-quality and contact-driver loop plan',
          guidance:
            'Define how genuine resolution is verified against ' +
            'containment, how the avoidable-contact view is maintained, ' +
            'and how the closed loop to merchandising, fulfilment, ' +
            'digital, and policy owners is run — the discipline that ' +
            'removes failure demand at source.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged retention and service-NPS ' +
            'metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — false deflection, fragmented channel ' +
            'data, a stale knowledge base, slow upstream fixes, agent ' +
            'adoption resistance, privacy and consent exposure — with the ' +
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
        'The contact-centre cost ledger and workforce-management system, ' +
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
      claim: 'Whether self-service deflection is genuine resolution',
      authoritativeSource:
        'The self-service and conversational-AI platforms, measuring ' +
        'genuine resolution with abandonment and escalation behind a ' +
        'contained session separated out.',
      whatGoodEvidenceLooksLike:
        'A self-service resolution rate that counts only journeys ending ' +
        'resolved without an agent, with the abandoned and escalated ' +
        'share quantified and CSAT measured on those journeys.',
      weakEvidenceToReject:
        'A containment or "sessions handled" figure presented as ' +
        'deflection, with no separation of customers who abandoned or ' +
        'escalated unresolved.',
    },
    {
      claim: 'The avoidable share of contact volume and its drivers',
      authoritativeSource:
        'Contact-reason coding and contact-driver analytics joined to ' +
        'order, delivery, and fulfilment exception data.',
      whatGoodEvidenceLooksLike:
        'An avoidable-contact share quantified against a contact-driver ' +
        'taxonomy, with recurring drivers traced to the owning upstream ' +
        'function and the failure demand separated from genuine need.',
      weakEvidenceToReject:
        'A flat total contact-volume number with no driver analysis, or ' +
        'an avoidable-contact estimate based on agent guesswork rather ' +
        'than coded transcripts.',
    },
    {
      claim: 'Whether contacts are resolved first time',
      authoritativeSource:
        'The CRM / ticketing system, joining a contact to any re-contact ' +
        'on the same issue within a defined window.',
      whatGoodEvidenceLooksLike:
        'A first-contact-resolution rate computed on a consistent ' +
        're-contact window across all channels, with escalation and ' +
        'repeat-contact volume separated and traced.',
      weakEvidenceToReject:
        'An agent-asserted "resolved" disposition with no re-contact ' +
        'check, or an FCR figure that ignores re-contacts arriving on a ' +
        'different channel.',
    },
    {
      claim: 'The forecast value of a customer-care AI Move',
      authoritativeSource:
        'The value model — cost-to-serve, avoidable-demand, and ' +
        'retained-loyalty components, each haircut by its dominant ' +
        'factors — read against the retailer’s service-data maturity and ' +
        'genuine resolution rate.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring cost, avoidable-demand, and ' +
        'retention gains kept distinct, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor deflection-rate claim ' +
        'taken at face value, or a forecast that ignores the deflection-' +
        'quality and upstream-fix haircuts.',
    },
  ],
};
