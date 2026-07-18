// Domain Function Pack — Healthcare provider · Member-service Agent Assist.
//
// Function key: `member_service_agent_assist`.
//
// This pack covers the payer/provider member-service contact center where
// agents answer questions about claims, benefits, eligibility, prior
// authorization, care-management handoffs, provider access, and policy /
// knowledge content. It is intentionally distinct from a generic healthcare
// "patient access" pack and from payer back-office claims operations: the
// value is created inside the live service interaction, where fragmented
// systems, stale knowledge, PHI controls, and unclear human decision rights
// determine whether AI is useful or dangerous.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const memberServiceAgentAssistPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'member_service_agent_assist',
  functionLabel: 'Member-service Agent Assist',
  summary:
    'Member-service Agent Assist is the healthcare contact-center function ' +
    'that supports agents answering member and patient questions about ' +
    'claims status, benefits, eligibility, prior authorization, pharmacy, ' +
    'provider access, care-management handoffs, and policy content. It is ' +
    'judged on whether members get a consistent, compliant, complete answer ' +
    'without a long call, avoidable transfer, repeat contact, or unsafe ' +
    'clinical or coverage determination. The operating reality is that the ' +
    'agent often navigates a fragmented estate: CCaaS, CRM, claims, prior ' +
    'auth, benefits, eligibility, pharmacy, knowledge base, identity, and ' +
    'care-management records rarely line up in one view. The AI opportunity ' +
    'is not generic automation; it is a governed assistant that retrieves ' +
    'approved knowledge and member context, guides the agent through the ' +
    'right next action, flags PHI and escalation boundaries, and leaves a ' +
    'measurable trail for value, quality, and risk.',
  version: '1.0.0',
  lastReviewed: '2026-07-18',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'first_contact_resolution',
      name: 'First-contact resolution',
      definition:
        'The share of member-service interactions fully resolved in one ' +
        'contact with no avoidable callback, repeat contact, transfer, or ' +
        'escalation on the same issue within the defined measurement window.',
      unit: '% of member-service contacts',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 62,
        high: 86,
        basis:
          'Healthcare member-service FCR is heavily shaped by issue mix: ' +
          'benefits and eligibility resolve higher than claim appeals, prior ' +
          'auth disputes, and clinical-policy exceptions. A planning range; ' +
          'the point must be placed with tenant contact reasons.',
        label: 'planning-range',
      },
      dataSource:
        'CRM / case-management interaction history joined to repeat-contact ' +
        'logic and CCaaS disposition data.',
      whyItMatters:
        'FCR is the most direct read on whether the service operation solves ' +
        'the member problem, and it is the bridge metric between experience, ' +
        'cost to serve, and answer quality.',
    },
    {
      key: 'average_handle_time',
      name: 'Average handle time',
      definition:
        'Average agent time spent handling a member-service interaction, ' +
        'including talk or chat time, hold time caused by system navigation, ' +
        'and after-call work or case notes.',
      unit: 'minutes per handled contact',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 6,
        high: 18,
        basis:
          'Healthcare handle time ranges widely by claims, benefit, prior ' +
          'auth, pharmacy, and provider-access complexity. It is an in-range ' +
          'metric: unsafe shortening can increase repeat contacts and wrong ' +
          'answers. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CCaaS / telephony platform, CRM case timestamps, and after-call ' +
        'work codes.',
      whyItMatters:
        'AHT is the core productivity lever, but only when read with FCR, ' +
        'transfer rate, QA findings, and appeal or grievance outcomes.',
    },
    {
      key: 'avoidable_transfer_rate',
      name: 'Avoidable transfer rate',
      definition:
        'The share of interactions transferred because the first agent lacked ' +
        'the system access, knowledge, permission, or decision support needed ' +
        'to resolve the issue.',
      unit: '% of contacts transferred for avoidable reasons',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 28,
        basis:
          'Transfer rates depend on queue design, agent empowerment, ' +
          'specialty-team boundaries, and the fragmentation of claims, ' +
          'benefits, authorization, and provider data. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CCaaS transfer events joined to CRM disposition and transfer reason ' +
        'codes.',
      whyItMatters:
        'Transfers create member effort, queue load, and compliance risk when ' +
        'context is lost; agent assist should reduce transfers it can safely ' +
        'resolve or warm-handoff with context.',
    },
    {
      key: 'repeat_contact_rate',
      name: 'Repeat-contact rate',
      definition:
        'The share of members contacting again about the same issue within a ' +
        'defined window after the initial interaction.',
      unit: '% of contacts with same-issue repeat within window',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 24,
        basis:
          'Repeat contacts rise when answers are incomplete, status changes ' +
          'are not explained, claims and prior-auth data are stale, or agents ' +
          'cannot close the loop. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CRM interaction history, member identity resolution, and issue-code ' +
        'matching over a 7-30 day window.',
      whyItMatters:
        'Repeat contact is failure demand. It is the cost and experience ' +
        'penalty paid when the first answer did not actually resolve the ' +
        'member need.',
    },
    {
      key: 'after_call_work_time',
      name: 'After-call work time',
      definition:
        'The post-interaction time agents spend summarizing, coding, ' +
        'updating systems, documenting PHI-safe notes, or creating follow-up ' +
        'tasks.',
      unit: 'minutes per handled contact',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'After-call work varies with case-documentation requirements, ' +
          'system duplication, and how much note drafting is assisted and ' +
          'reviewed. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'CCaaS wrap-up states, CRM case updates, and workforce-management ' +
        'activity logs.',
      whyItMatters:
        'ACW is a concrete productivity opportunity for AI summarization, but ' +
        'only when summaries are reviewable, auditable, and PHI-safe.',
    },
    {
      key: 'knowledge_answer_accuracy',
      name: 'Knowledge-answer accuracy',
      definition:
        'The share of sampled interactions where the agent answer matches the ' +
        'approved policy, benefits, coverage, eligibility, or prior-auth ' +
        'knowledge source and cites the right source.',
      unit: '% of audited answers accurate',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 82,
        high: 98,
        basis:
          'Accuracy depends on knowledge ownership, policy freshness, plan ' +
          'variation, and whether the assistant retrieves only approved ' +
          'sources. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Quality-assurance review, knowledge-base source references, and ' +
        'sampled transcript audit.',
      whyItMatters:
        'An agent assist layer that speeds up wrong or stale answers creates ' +
        'regulatory and trust risk; answer accuracy is the non-negotiable ' +
        'quality floor.',
    },
    {
      key: 'intent_classification_coverage',
      name: 'Intent-classification coverage',
      definition:
        'The share of member-service interactions mapped to a stable intent ' +
        'taxonomy with enough granularity to route, retrieve knowledge, and ' +
        'measure outcomes.',
      unit: '% of interactions mapped to governed intents',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 90,
        basis:
          'Coverage depends on transcript availability, disposition hygiene, ' +
          'taxonomy governance, and how consistently agents code issues. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Speech analytics, chat transcript analytics, CRM disposition codes, ' +
        'and governed intent taxonomy.',
      whyItMatters:
        'Agent Assist value concentrates by intent; without a stable taxonomy ' +
        'the roadmap cannot rank which questions, handoffs, and knowledge ' +
        'gaps matter most.',
    },
    {
      key: 'member_satisfaction',
      name: 'Member satisfaction after contact',
      definition:
        'The share of surveyed members who rate the interaction as satisfied ' +
        'or better, measured by issue type and channel.',
      unit: '% satisfied or better',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 92,
        basis:
          'Satisfaction varies by channel, issue complexity, wait time, and ' +
          'whether the answer resolves the member need. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Post-contact survey, complaint and grievance system, and member ' +
        'experience analytics.',
      whyItMatters:
        'Member satisfaction is the outcome read that prevents productivity ' +
        'work from becoming a cost-only program.',
    },
    {
      key: 'claims_status_visibility',
      name: 'Claims-status visibility rate',
      definition:
        'The share of claim-status questions where the agent can see current ' +
        'claim receipt, pend reason, adjudication status, payment/denial ' +
        'status, and next action without manual swivel-chair lookup.',
      unit: '% of claim-status contacts with complete visible state',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 92,
        basis:
          'Visibility depends on claims-system integration, pend-reason ' +
          'coding, payment-status freshness, and whether CRM carries the ' +
          'right context. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Claims-processing system, CRM member-service workspace, and data ' +
        'platform integration logs.',
      whyItMatters:
        'Claims-status questions are high-volume and confidence-sensitive; ' +
        'poor visibility turns simple status questions into long calls and ' +
        'repeat contacts.',
    },
    {
      key: 'prior_auth_status_visibility',
      name: 'Prior-authorization status visibility',
      definition:
        'The share of prior-auth questions where the agent can see request ' +
        'status, missing information, decision timeframe, decision outcome, ' +
        'and escalation path in one governed workflow.',
      unit: '% of prior-auth contacts with complete visible state',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 88,
        basis:
          'Prior-auth visibility is usually lower than claims visibility ' +
          'because utilization-management systems, clinical criteria, and ' +
          'provider submissions are fragmented. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Utilization-management / prior-auth platform, provider portal, CRM, ' +
        'and interface/event logs.',
      whyItMatters:
        'Prior auth is a sensitive friction point; an assistant must explain ' +
        'status and next steps without making or implying a clinical decision.',
    },
    {
      key: 'phi_control_exception_rate',
      name: 'PHI/control exception rate',
      definition:
        'The rate of interactions, transcripts, summaries, or assistant ' +
        'outputs with access, disclosure, retention, redaction, or audit-log ' +
        'exceptions.',
      unit: 'exceptions per 1,000 reviewed interactions',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0,
        high: 8,
        basis:
          'Exception rates depend on access design, transcript retention, ' +
          'redaction, audit logging, and agent workflow discipline. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Security/privacy audit logs, QA findings, transcript-retention ' +
        'controls, and incident-management records.',
      whyItMatters:
        'PHI control is the guardrail that determines whether a pilot can ' +
        'move from demo to production; unmanaged transcripts or summaries can ' +
        'block scale.',
    },
    {
      key: 'agent_adoption_rate',
      name: 'Agent-assist adoption rate',
      definition:
        'The share of eligible interactions where agents use the assistant, ' +
        'accept or edit its suggestions appropriately, and leave structured ' +
        'feedback when suggestions are wrong.',
      unit: '% of eligible interactions with meaningful assistant use',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 35,
        high: 85,
        basis:
          'Adoption depends on trust, training, supervisor coaching, response ' +
          'latency, quality of suggestions, and whether the tool reduces ' +
          'work rather than adding one more screen. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Agent-assist telemetry, CRM interaction logs, supervisor QA, and ' +
        'agent feedback capture.',
      whyItMatters:
        'The business case only materializes if agents use the tool inside ' +
        'their real workflow and supervisors coach with the signals it emits.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ────────────────────────────────
  painThemes: [
    {
      key: 'swivel_chair_service',
      name: 'Swivel-chair service across fragmented systems',
      description:
        'Agents answer a single member question by moving across CCaaS, CRM, ' +
        'claims, benefits, eligibility, prior-auth, pharmacy, and knowledge ' +
        'tools. The member hears hold music while the agent reconciles state.',
      detectionSignal:
        'High handle time on otherwise simple status or eligibility contacts, ' +
        'multiple systems named in call notes, or agent screen recordings ' +
        'showing repeated lookups.',
      diagnosticQuestion:
        'Which member questions require the agent to visit more than two ' +
        'systems before giving a safe answer?',
    },
    {
      key: 'knowledge_freshness_gap',
      name: 'Stale or ownerless knowledge content',
      description:
        'Policy, benefit, coverage, escalation, and script content exists but ' +
        'lacks a clear owner, refresh cadence, source citation, or plan-level ' +
        'variation logic.',
      detectionSignal:
        'QA defects tied to wrong or inconsistent answers, duplicate articles, ' +
        'expired policy content, or agents using local job aids outside the ' +
        'approved knowledge base.',
      diagnosticQuestion:
        'Which answers would an assistant retrieve from an approved source, ' +
        'and who signs off that source as current?',
    },
    {
      key: 'status_visibility_gap',
      name: 'Claims and prior-auth status visibility gap',
      description:
        'Agents can see partial state but not enough to explain why a claim or ' +
        'authorization is pending, what is missing, what clock applies, or ' +
        'what next action is allowed.',
      detectionSignal:
        'Repeat contacts about claims or prior auth, transfer to specialty ' +
        'queues for basic status, or frequent "check back later" notes.',
      diagnosticQuestion:
        'For each top status intent, can the agent see current state, pend ' +
        'reason, next action, and allowed language without escalation?',
    },
    {
      key: 'unsafe_decision_boundary',
      name: 'Unclear boundary between guidance and determination',
      description:
        'The workflow does not clearly separate what an AI-assisted agent can ' +
        'explain from what requires a clinical, coverage, appeal, or benefit ' +
        'determination by an authorized human.',
      detectionSignal:
        'Escalation rules are tribal, agent scripts imply a decision before ' +
        'approval, or compliance findings flag over-promising language.',
      diagnosticQuestion:
        'Which member-service intents require human approval, clinical review, ' +
        'appeal routing, or a coverage-determination owner before an answer is ' +
        'safe?',
    },
    {
      key: 'intent_taxonomy_fragility',
      name: 'Weak intent taxonomy and disposition hygiene',
      description:
        'Contact reasons are too broad, inconsistently coded, or not linked to ' +
        'transcript-derived intents, so value sizing and roadmap sequencing ' +
        'are driven by anecdote.',
      detectionSignal:
        'Large "other" disposition buckets, mismatches between transcripts ' +
        'and CRM codes, or no stable view of volume by intent and outcome.',
      diagnosticQuestion:
        'Can the operation rank the top 20 member-service intents by volume, ' +
        'handle time, transfer rate, repeat contact, and risk?',
    },
    {
      key: 'after_call_documentation_drag',
      name: 'After-call documentation drag',
      description:
        'Agents spend avoidable time summarizing interactions, recoding cases, ' +
        'and updating multiple systems after the member is off the call.',
      detectionSignal:
        'High wrap-up time, supervisor QA comments about poor notes, or ' +
        'manual copying between transcript, CRM, and downstream task systems.',
      diagnosticQuestion:
        'Which after-call work can be drafted by AI and reviewed by the agent ' +
        'without weakening PHI, audit, or case-quality controls?',
    },
    {
      key: 'closed_loop_failure',
      name: 'No closed loop to fix upstream drivers',
      description:
        'The service operation knows the same claims, benefit, portal, letter, ' +
        'or provider-directory issues keep generating contacts, but the ' +
        'owners who can fix those drivers are not in the operating cadence.',
      detectionSignal:
        'Repeat contact themes persist across months with no owner, action, ' +
        'or measured reduction in the downstream call volume.',
      diagnosticQuestion:
        'Who owns the upstream fixes for the top avoidable contact drivers, ' +
        'and how will the Move prove that volume is removed rather than just ' +
        'handled faster?',
    },
    {
      key: 'adoption_without_supervisor_model',
      name: 'Agent adoption without a supervisor coaching model',
      description:
        'The organization deploys a tool but does not redesign supervisor QA, ' +
        'coaching, feedback loops, or exception review around how agents ' +
        'actually use the assistant.',
      detectionSignal:
        'Low assistant usage, high override rates without explanation, ' +
        'supervisors coaching from old QA forms, or no feedback path for bad ' +
        'suggestions.',
      diagnosticQuestion:
        'How will supervisors know whether agents are using the assistant ' +
        'correctly, safely, and often enough to realize the value case?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ─────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'real_time_agent_copilot',
      name: 'Real-time agent copilot',
      valueMechanism:
        'Retrieves approved knowledge and relevant member context during the ' +
        'interaction, reducing search time, improving answer consistency, ' +
        'and guiding safe next action while the agent remains accountable.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Approved knowledge base with owner and refresh cadence',
        'CRM interaction context and member identity',
        'Claims, benefits, eligibility, and prior-auth read access',
        'PHI-safe transcript and audit logging controls',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Assistant recommendations must cite approved sources and remain draft guidance until the agent accepts.',
        'Clinical, appeal, and coverage determinations require the authorized human workflow.',
        'PHI minimization, role-based access, and transcript retention controls must be tested before scale.',
      ],
      metricsMoved: [
        'average_handle_time',
        'first_contact_resolution',
        'knowledge_answer_accuracy',
        'agent_adoption_rate',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
    {
      key: 'intent_and_transfer_intelligence',
      name: 'Intent detection and transfer reduction',
      valueMechanism:
        'Classifies member intent from transcripts, chat, IVR, and CRM codes ' +
        'so routing, knowledge retrieval, and warm transfer rules focus on ' +
        'the contacts where the first agent can safely resolve more work.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Call and chat transcripts',
        'CRM disposition and resolution codes',
        'CCaaS routing, transfer, and queue events',
        'Governed intent taxonomy with owner',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Intent labels must be auditable and retrainable as policy and benefit designs change.',
        'Routing must not steer vulnerable or high-risk members away from required human review.',
        'Warm transfers must preserve context and authentication state.',
      ],
      metricsMoved: [
        'avoidable_transfer_rate',
        'repeat_contact_rate',
        'intent_classification_coverage',
        'member_satisfaction',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
    {
      key: 'claim_auth_status_assist',
      name: 'Claims and prior-auth status assist',
      valueMechanism:
        'Aggregates claims, eligibility, benefits, prior-auth, pharmacy, and ' +
        'provider portal status into safe agent-facing explanations, reducing ' +
        'swivel-chair lookup and repeat status contacts.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Claims-processing status and pend-reason data',
        'Utilization-management and prior-auth status data',
        'Eligibility and benefits system data',
        'Provider portal or submission event data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The assistant can explain current status and next action but must not issue a clinical or coverage determination.',
        'Status freshness and source timestamp must be visible to the agent.',
        'Plan-specific language and appeal rights must be retrieved from approved sources.',
      ],
      metricsMoved: [
        'claims_status_visibility',
        'prior_auth_status_visibility',
        'average_handle_time',
        'repeat_contact_rate',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
    {
      key: 'after_call_summary_automation',
      name: 'After-call summary and case-note automation',
      valueMechanism:
        'Drafts structured interaction summaries, disposition codes, follow-up ' +
        'tasks, and PHI-safe notes from the conversation for agent review, ' +
        'reducing wrap-up time and improving case quality.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Call/chat transcripts or summaries',
        'CRM case schema and required note fields',
        'PHI redaction and retention policy',
        'Quality-assurance criteria for acceptable notes',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Agent must review and accept the note before it becomes the system of record.',
        'Transcript-derived content must respect minimum-necessary PHI and retention rules.',
        'Summaries must distinguish member statements from verified system facts.',
      ],
      metricsMoved: [
        'after_call_work_time',
        'average_handle_time',
        'knowledge_answer_accuracy',
        'agent_adoption_rate',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
    {
      key: 'knowledge_governance_workbench',
      name: 'Knowledge governance workbench',
      valueMechanism:
        'Finds stale, duplicate, conflicting, or low-use knowledge content; ' +
        'links answer defects to source articles; and routes remediation to ' +
        'the accountable policy, benefits, claims, or clinical owner.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Knowledge article inventory and revision history',
        'QA defects by source article',
        'Transcript samples where answers were inconsistent',
        'Named article owners and approval workflow',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The tool can recommend knowledge changes, but policy and benefit owners approve the source of truth.',
        'Plan variation and effective dates must be explicit before an article is used by the assistant.',
        'Retired or draft articles must never be retrievable as approved guidance.',
      ],
      metricsMoved: [
        'knowledge_answer_accuracy',
        'first_contact_resolution',
        'repeat_contact_rate',
        'member_satisfaction',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
    {
      key: 'contact_driver_closed_loop',
      name: 'Contact-driver closed loop',
      valueMechanism:
        'Clusters repeat contacts and complaint themes into upstream root ' +
        'causes, assigns owners, and tracks whether product, claims, portal, ' +
        'letter, provider-data, or policy fixes actually remove demand.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Intent taxonomy and repeat-contact records',
        'Complaint and grievance themes',
        'Claims, prior-auth, benefits, portal, and provider-directory defect signals',
        'Owner/action tracker and volume trend after remediation',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Root-cause recommendations must be accepted by accountable business owners, not auto-applied.',
        'Value cannot be claimed until contact volume falls at the source, not only in the assisted channel.',
        'Equity and vulnerable-member effects must be monitored when changing letters, portals, or routing.',
      ],
      metricsMoved: [
        'repeat_contact_rate',
        'member_satisfaction',
        'first_contact_resolution',
        'intent_classification_coverage',
      ],
      relatedArchetypePlaybook: 'CONTACT_CENTER_AGENT_ASSIST',
    },
  ],

  // ── Layer 4 — Reference solution patterns ────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'governed_agent_workspace',
      name: 'Governed agent workspace with cited guidance',
      description:
        'A unified agent workspace embeds assistant guidance, source citations, ' +
        'member context, next-best-action prompts, and structured note capture ' +
        'inside the agent workflow rather than as a separate chat window.',
      boundary:
        'Owns retrieval, explanation, summarization, and next-action support; ' +
        'does not own clinical judgment, benefit-plan policy approval, appeal ' +
        'disposition, or final coverage determinations.',
      humanAccountabilityPoint:
        'VP Member Operations accountable with Privacy/Compliance and policy owners approving the retrievable sources.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'ai_operations_decision_support',
    },
    {
      key: 'healthcare_service_context_layer',
      name: 'Healthcare service context layer',
      description:
        'A governed context layer harmonizes CRM interaction history, claims, ' +
        'eligibility, benefits, prior auth, provider, pharmacy, knowledge, and ' +
        'transcript metadata for retrieval and measurement.',
      boundary:
        'Owns read-oriented service context, source lineage, freshness, and ' +
        'semantic definitions; does not replace claims adjudication, UM, or ' +
        'benefit-configuration systems of record.',
      humanAccountabilityPoint:
        'CDIO / enterprise data owner accountable for source lineage, access, and freshness controls.',
      controlPosture: 'human-on-the-loop',
      dispositionKind: 'foundation',
    },
    {
      key: 'intent_routing_and_warm_handoff',
      name: 'Intent routing and warm-handoff fabric',
      description:
        'Intent classification, queue routing, escalation guidance, and warm ' +
        'handoff rules move members to the right agent or owner while carrying ' +
        'the conversation, authentication, and evidence context.',
      boundary:
        'Owns routing recommendations and context packaging; does not bypass ' +
        'required clinical review, appeal routing, compliance escalation, or ' +
        'member consent requirements.',
      humanAccountabilityPoint:
        'Contact Center Director accountable for routing design with Compliance approving protected-class and vulnerable-member guardrails.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'case_triage_and_routing',
    },
    {
      key: 'knowledge_source_of_truth_factory',
      name: 'Knowledge source-of-truth factory',
      description:
        'A workflow that inventories articles, validates owners and effective ' +
        'dates, resolves conflicting content, tests answer retrieval, and ' +
        'publishes only approved knowledge to the assistant.',
      boundary:
        'Owns knowledge remediation and publishing controls; does not invent ' +
        'policy, change benefits, or treat draft content as approved evidence.',
      humanAccountabilityPoint:
        'Knowledge owner and policy/benefits owners accountable for source approval and version retirement.',
      controlPosture: 'human-approval-required',
      dispositionKind: 'foundation',
    },
    {
      key: 'member_service_value_control_room',
      name: 'Member-service value and control room',
      description:
        'A measurement cadence that ties adoption, FCR, handle time, repeat ' +
        'contact, transfers, QA defects, PHI exceptions, and member experience ' +
        'to owner actions and Tower-ready value evidence.',
      boundary:
        'Owns measurement, readout, and remediation cadence; does not claim ' +
        'realized value until finance, operations, and quality sources agree.',
      humanAccountabilityPoint:
        'Finance value owner and VP Member Operations accountable for measured benefits and caveats.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'value_governance_control_room',
    },
  ],

  // ── Layer 5 — Value model ────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Value is realized by reducing avoidable search, transfer, repeat ' +
      'contact, and after-call work while improving the consistency and ' +
      'safety of answers. The largest benefits do not come from replacing ' +
      'agents; they come from helping agents resolve more member needs on the ' +
      'first interaction, removing contact drivers upstream, and making the ' +
      'governance strong enough that the assistant can move from pilot to ' +
      'production. Every value claim must be tied back to measured contact ' +
      'volume, handle time, FCR, transfer, repeat-contact, QA, adoption, and ' +
      'PHI/control evidence.',
    dominantHaircutFactors: [
      {
        factor: 'Knowledge freshness and source approval',
        rationale:
          'If benefits, policy, prior-auth, or claims guidance is stale or ' +
          'ownerless, the assistant cannot safely answer the most valuable ' +
          'questions. Value must be discounted until the knowledge source of ' +
          'truth is remediated and cited.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Share of modelled productivity and FCR value that becomes unsafe ' +
            'or unreleasable when approved knowledge is incomplete; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Systems/data integration and freshness',
        rationale:
          'Claims, eligibility, benefits, prior-auth, pharmacy, provider, and ' +
          'CRM context must be current enough to answer status and next-action ' +
          'questions. Fragmented or stale integrations cap the reachable use ' +
          'cases.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from missing, stale, or non-cited systems/data ' +
            'inputs needed for live status answers; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'PHI, HIPAA, and decision-rights control ceiling',
        rationale:
          'The assistant cannot trade privacy, auditability, or required human ' +
          'determination for speed. If human-in-loop, access, retention, and ' +
          'audit controls are not production-ready, scale value is deferred.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Share of modelled benefit delayed or reduced by unresolved PHI, ' +
            'access, audit, or human-approval controls; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Agent adoption and supervisor operating model',
        rationale:
          'Agents must trust the suggestions, supervisors must coach new ' +
          'behaviors, and feedback must improve the assistant. Without that ' +
          'operating model, the tool becomes another screen.',
        typicalHaircut: {
          low: 0.1,
          high: 0.28,
          basis:
            'Forecast erosion from partial adoption, insufficient coaching, ' +
            'or poor feedback loops; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Upstream owner action on contact drivers',
        rationale:
          'Repeat contacts fall materially only when claims, benefits, portal, ' +
          'letters, provider data, and policy owners fix root causes surfaced ' +
          'by the service operation. Without upstream action, the assistant ' +
          'handles failure demand faster but does not remove it.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Share of avoidable-contact value dependent on business owners ' +
            'outside the contact center acting on surfaced defects; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Agent-handled productivity improvement',
        range: {
          low: 8,
          high: 22,
          basis:
            'Relative improvement from less search time, fewer transfers, and ' +
            'lower after-call work on intents where approved knowledge and ' +
            'systems access are available. A planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent improvement in agent-handled contacts per paid ' +
          'hour or fully-loaded cost per resolved contact.',
      },
      {
        lever: 'First-contact-resolution uplift',
        range: {
          low: 3,
          high: 10,
          basis:
            'Percentage-point uplift from better retrieval, safer next action, ' +
            'and reduced avoidable transfers on the top member-service ' +
            'intents. A planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in contacts resolved on first interaction, ' +
          'validated against repeat-contact logic.',
      },
      {
        lever: 'Repeat-contact and transfer reduction',
        range: {
          low: 6,
          high: 20,
          basis:
            'Relative reduction where the assistant improves status clarity, ' +
            'warm handoffs, and upstream contact-driver remediation. A ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in same-issue repeat contacts and ' +
          'avoidable transfers for in-scope intents.',
      },
      {
        lever: 'Quality and control-defect reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in QA defects tied to wrong source, stale ' +
            'knowledge, missing documentation, or PHI/control exceptions after ' +
            'the knowledge and audit model is in place. A planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in sampled answer-quality defects and ' +
          'control exceptions per reviewed interaction.',
      },
    ],
    timeToValueBand:
      '6-10 weeks to see a directional pilot signal on a narrow set of intents ' +
      '(usage, AHT, ACW, answer quality); 4-8 months to prove a controlled ' +
      'production slice; 9-18 months to prove durable value across contact ' +
      'drivers, FCR, repeat contact, and Tower-ready financial attribution.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'CCaaS / contact-center platform',
        role:
          'Owns queues, routing, call/chat events, recordings, transcripts, ' +
          'handle time, transfers, and agent state.',
        examples: ['NICE CXone', 'Genesys Cloud', 'Amazon Connect', 'Five9'],
      },
      {
        name: 'CRM / member-service case platform',
        role:
          'Owns interaction history, case notes, dispositions, tasks, member ' +
          'identity context, and service outcomes.',
        examples: ['Salesforce Health Cloud', 'Microsoft Dynamics 365', 'Pega Customer Service', 'ServiceNow CSM'],
      },
      {
        name: 'Claims-processing system',
        role:
          'Owns submitted claim status, pend reason, adjudication status, ' +
          'payment/denial outcome, and adjustment history.',
        examples: ['Facets', 'QNXT', 'HealthRules Payor', 'custom claims platforms'],
      },
      {
        name: 'Eligibility and benefits system',
        role:
          'Owns coverage eligibility, benefit design, plan variation, member ' +
          'cost-share context, and effective dates.',
        examples: ['Facets', 'QNXT', 'HealthRules', 'benefit administration platforms'],
      },
      {
        name: 'Utilization-management / prior-auth platform',
        role:
          'Owns authorization request status, clinical review state, missing ' +
          'information, decision timeframe, and escalation path.',
        examples: ['GuidingCare', 'Medecision', 'ZeOmega', 'custom UM systems'],
      },
      {
        name: 'Knowledge-management platform',
        role:
          'Owns approved scripts, policy guidance, plan-specific articles, ' +
          'effective dates, article owners, and retired/draft content controls.',
        examples: ['Salesforce Knowledge', 'ServiceNow Knowledge', 'SharePoint', 'Confluence'],
      },
      {
        name: 'Data platform / lakehouse',
        role:
          'Provides governed longitudinal service context, transcript features, ' +
          'claims/CRM joins, semantic metrics, and source lineage for AI and ' +
          'Tower measurement.',
        examples: ['Databricks on AWS', 'Snowflake', 'Azure Databricks', 'enterprise lakehouse'],
      },
    ],
    roles: [
      {
        title: 'Chief Digital and Information Officer',
        accountability:
          'Owns the platform, integration, identity, access, data freshness, ' +
          'and production-readiness path for the assistant.',
      },
      {
        title: 'VP Member Operations',
        accountability:
          'Owns member-service outcomes, operating model, staffing, adoption, ' +
          'and the balance between experience, cost, and quality.',
      },
      {
        title: 'Contact Center Director',
        accountability:
          'Owns queues, routing, agent workflow, service levels, transfer ' +
          'rules, supervisor coaching, and day-to-day adoption.',
      },
      {
        title: 'Claims / Prior Authorization Operations Owner',
        accountability:
          'Owns status accuracy, pend reason clarity, escalation paths, and the ' +
          'rules for what agents can explain versus route.',
      },
      {
        title: 'Knowledge and Policy Owner',
        accountability:
          'Owns approved content, plan-specific variation, effective dates, ' +
          'retirement of stale content, and source citation.',
      },
      {
        title: 'Privacy / Compliance / Responsible AI Owner',
        accountability:
          'Owns PHI, HIPAA, audit, consent, retention, model-risk, and ' +
          'human-decision boundary controls.',
      },
      {
        title: 'Finance / Value Owner',
        accountability:
          'Owns baseline economics, benefit attribution, realized-value ' +
          'attestation, and Tower handoff criteria.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'HIPAA Privacy and Security Rules',
        relevance:
          'Govern access, use, disclosure, audit, and protection of PHI in ' +
          'transcripts, summaries, context retrieval, and assistant outputs.',
      },
      {
        name: 'CMS interoperability and prior-authorization expectations',
        relevance:
          'Shape how status, missing information, and decision timeframes are ' +
          'communicated and how prior-auth data is made available.',
      },
      {
        name: 'Appeals, grievances, and coverage-determination rules',
        relevance:
          'Define which decisions require formal routing and what language ' +
          'agents may use before an authorized determination is complete.',
      },
      {
        name: 'Call recording, consent, and transcript retention rules',
        relevance:
          'Govern whether recordings and transcripts can be used for training, ' +
          'quality, retrieval, and summarization, and how long they are kept.',
      },
      {
        name: 'Responsible AI and model risk governance',
        relevance:
          'Requires transparency, monitoring, human oversight, bias and error ' +
          'management, and clear limits on what AI can recommend or decide.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Member service',
        definition:
          'The operational function that resolves member questions about ' +
          'coverage, claims, benefits, eligibility, authorization, pharmacy, ' +
          'provider access, and service navigation.',
      },
      {
        term: 'First-contact resolution',
        definition:
          'Resolution of the member issue in the first interaction without ' +
          'avoidable transfer, callback, or repeat contact.',
      },
      {
        term: 'Prior authorization',
        definition:
          'A utilization-management process requiring approval before certain ' +
          'services, drugs, or procedures are covered.',
      },
      {
        term: 'Pend reason',
        definition:
          'The coded reason a claim or authorization request is not yet ' +
          'finalized, including missing information, review, edit, or policy ' +
          'checks.',
      },
      {
        term: 'Human-in-the-loop',
        definition:
          'A control posture where the assistant drafts or recommends, but an ' +
          'authorized human reviews and accepts before the output becomes the ' +
          'record or decision.',
      },
      {
        term: 'PHI',
        definition:
          'Protected health information governed by privacy and security rules; ' +
          'the assistant must minimize, protect, and audit its use.',
      },
      {
        term: 'Knowledge source of truth',
        definition:
          'The approved, owned, versioned content that agents and AI may cite ' +
          'for policy, benefits, scripts, and next-action guidance.',
      },
      {
        term: 'Failure demand',
        definition:
          'Contact volume caused by preventable upstream defects, such as a ' +
          'confusing letter, stale portal status, missing claim explanation, ' +
          'or provider-directory issue.',
      },
      {
        term: 'Warm handoff',
        definition:
          'A transfer that carries member identity, interaction context, ' +
          'authentication status, and reason for transfer so the member does ' +
          'not restart the story.',
      },
      {
        term: 'Tower-ready metric',
        definition:
          'A metric with a defined owner, source, calculation, cadence, and ' +
          'caveat model that can support value measurement after the Move.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Member-Service Agent Assist Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose the current member-service operation, the evidence that ' +
        'supports or blocks Agent Assist, and the few high-value intents where ' +
        'a governed assistant can safely improve experience, productivity, ' +
        'quality, and readiness.',
      sections: [
        {
          heading: 'Executive current-state answer',
          guidance:
            'State in one page what is true now: top member-service pain, ' +
            'where agents lose time, which systems and knowledge sources are ' +
            'ready or not ready, and whether the Move can proceed to design.',
        },
        {
          heading: 'Operating baseline and contact mix',
          guidance:
            'Report baseline FCR, AHT, transfers, repeat contacts, ACW, ' +
            'member satisfaction, QA defects, contact volume by intent, and ' +
            'any missing metric with its expected source and owner.',
        },
        {
          heading: 'Workflow and system diagnostic',
          guidance:
            'Map the member-service workflow from contact arrival through ' +
            'resolution, including CCaaS, CRM, claims, eligibility, benefits, ' +
            'prior-auth, pharmacy, knowledge, identity, and handoff points.',
        },
        {
          heading: 'Knowledge, PHI, and decision-boundary diagnostic',
          guidance:
            'Assess whether approved knowledge, source citations, PHI controls, ' +
            'audit logging, transcript retention, and human decision rights are ' +
            'strong enough for a production assistant.',
        },
        {
          heading: 'Pain themes and value hypothesis',
          guidance:
            'Use the pack pain themes and planning ranges to explain where ' +
            'value could come from. Keep numbers labelled as hypotheses until ' +
            'evidence proves the baseline and reachable adoption.',
        },
        {
          heading: 'Evidence gaps and next asks',
          guidance:
            'List exactly which evidence families are missing, what each gap ' +
            'blocks, who owns it, and what must be uploaded or approved before ' +
            'P3 solution options can be ranked.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Member-Service Agent Assist Business Case',
      phase: 'Design & Plan',
      purpose:
        'Build the CFO/operator case for funding Agent Assist with grounded ' +
        'baseline metrics, honest planning ranges, adoption haircuts, control ' +
        'constraints, and Tower-ready measurement.',
      sections: [
        {
          heading: 'Investment decision headline',
          guidance:
            'State the recommended funding posture, what value is in range, ' +
            'what evidence supports it, what remains unproven, and the gate ' +
            'conditions that would stop or resize the investment.',
        },
        {
          heading: 'Baseline economics',
          guidance:
            'Anchor value to current contact volume, fully loaded cost per ' +
            'contact or resolved contact, AHT, ACW, FCR, transfers, repeat ' +
            'contacts, QA findings, and technology/run costs.',
        },
        {
          heading: 'Value levers and planning ranges',
          guidance:
            'Use the pack value benchmarks for productivity, FCR, repeat and ' +
            'transfer reduction, and quality/control defects. Show every ' +
            'range as a planning range with basis, not a committed value.',
        },
        {
          heading: 'Haircuts and constraints',
          guidance:
            'Apply explicit haircuts for knowledge freshness, data integration, ' +
            'PHI/control readiness, agent adoption, and upstream owner action. ' +
            'Explain what evidence would reduce each haircut.',
        },
        {
          heading: 'Cost and delivery model',
          guidance:
            'Estimate platform, integration, knowledge remediation, workflow ' +
            'change, QA, training, run, and governance costs. Use engineering ' +
            'delivery metrics only as optional estimation context, not as a P2 ' +
            'strategy blocker.',
        },
        {
          heading: 'Tower measurement contract',
          guidance:
            'Define the value metric owner, source, cadence, caveats, and ' +
            'approval process for adoption, productivity, experience, quality, ' +
            'risk, and financial benefit tracking.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Member-Service Agent Assist Solution Architecture',
      phase: 'Design & Plan',
      purpose:
        'Define the target architecture and operating model for a governed ' +
        'Agent Assist capability over member-service workflows, systems, data, ' +
        'knowledge, controls, and measurement.',
      sections: [
        {
          heading: 'Target-state operating model',
          guidance:
            'Define how agents, supervisors, knowledge owners, compliance, ' +
            'data owners, claims/auth owners, and finance work differently in ' +
            'the future state.',
        },
        {
          heading: 'Systems and integration architecture',
          guidance:
            'Show how CCaaS, CRM, claims, eligibility, benefits, prior-auth, ' +
            'pharmacy, provider, identity, knowledge, and the data platform ' +
            'feed the assistant with source lineage and freshness.',
        },
        {
          heading: 'Retrieval and knowledge architecture',
          guidance:
            'Specify approved knowledge, article ownership, effective dates, ' +
            'plan variation, source citations, retired/draft exclusion, and ' +
            'answer-quality monitoring.',
        },
        {
          heading: 'AI workflow and control posture',
          guidance:
            'For each use case, state whether AI drafts, recommends, routes, ' +
            'summarizes, or monitors; identify the human accountable for ' +
            'acceptance and the decisions AI may not make.',
        },
        {
          heading: 'PHI, audit, and responsible-AI controls',
          guidance:
            'Define role-based access, minimum necessary PHI, transcript and ' +
            'summary retention, redaction, audit logging, monitoring, and ' +
            'escalation for unsafe outputs.',
        },
        {
          heading: 'Roadmap option comparison',
          guidance:
            'Compare process-first, platform-foundation, and integrated Agent ' +
            'Assist options against value, complexity, data readiness, control ' +
            'risk, adoption, and speed to first proof.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Member-Service Agent Assist Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the pilot-to-production mobilization so the assistant is adopted, ' +
        'controlled, measured, and improved rather than treated as a one-time ' +
        'technology rollout.',
      sections: [
        {
          heading: '30 / 60 / 90-day launch sequence',
          guidance:
            'Sequence data and knowledge readiness, intent-slice selection, ' +
            'agent and supervisor training, controlled pilot, quality review, ' +
            'and scale decision with owners and dates.',
        },
        {
          heading: 'Pilot cohort and success criteria',
          guidance:
            'Define the initial intents, queues, agents, member population, ' +
            'guardrails, adoption target, quality floor, and go/no-go criteria ' +
            'before broadening scope.',
        },
        {
          heading: 'Training and change plan',
          guidance:
            'Lay out agent, supervisor, knowledge-owner, compliance, and data ' +
            'owner enablement. Include feedback loops for wrong suggestions ' +
            'and escalation paths for unsafe or unclear outputs.',
        },
        {
          heading: 'Production control cadence',
          guidance:
            'Define daily/weekly monitoring for usage, answer accuracy, ' +
            'override reasons, PHI exceptions, QA defects, latency, and member ' +
            'experience signals.',
        },
        {
          heading: 'Value realization and Tower handoff',
          guidance:
            'Name the metrics, owners, evidence cadence, baseline freeze, ' +
            'benefit calculation, and caveats that Tower will use after handoff.',
        },
        {
          heading: 'Risks, rollback, and scale criteria',
          guidance:
            'State the conditions that pause, roll back, or limit scale: stale ' +
            'knowledge, poor adoption, PHI/control incidents, low answer ' +
            'accuracy, latency, or unproven value.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Agent Assist can reduce handle time or after-call work.',
      authoritativeSource:
        'CCaaS handle/wrap metrics, CRM case timestamps, pilot telemetry, and ' +
        'pre/post queue-level comparison.',
      whatGoodEvidenceLooksLike:
        'A baseline and pilot-period extract by contact intent, channel, and ' +
        'agent cohort, with volume, AHT, ACW, transfers, FCR, and adoption.',
      weakEvidenceToReject:
        'A vendor productivity claim or anecdotal supervisor statement with no ' +
        'tenant baseline and no contact-mix control.',
    },
    {
      claim: 'Agent Assist can improve first-contact resolution.',
      authoritativeSource:
        'CRM interaction history with same-issue repeat-contact logic and QA ' +
        'sample review.',
      whatGoodEvidenceLooksLike:
        'A defined repeat-contact window, member identity resolution, issue ' +
        'taxonomy, and FCR comparison for in-scope intents.',
      weakEvidenceToReject:
        'A disposition code labelled resolved without repeat-contact matching ' +
        'or member outcome verification.',
    },
    {
      claim: 'The assistant can safely answer claims, benefits, eligibility, or prior-auth questions.',
      authoritativeSource:
        'Claims, benefits, eligibility, prior-auth, pharmacy, and knowledge ' +
        'source inventories with owner, freshness, access, and citation proof.',
      whatGoodEvidenceLooksLike:
        'A source map showing read access, data freshness, lineage, approved ' +
        'knowledge articles, plan variation, and allowed/blocked answer types.',
      weakEvidenceToReject:
        'A generic architecture diagram that names systems but does not prove ' +
        'source freshness, citation, access, or decision boundaries.',
    },
    {
      claim: 'Knowledge content is production-ready for AI retrieval.',
      authoritativeSource:
        'Knowledge-base export with article owner, version, effective date, ' +
        'retirement status, approval workflow, and QA defect linkage.',
      whatGoodEvidenceLooksLike:
        'A governed article inventory for top intents, with stale/duplicate ' +
        'content removed and source citations tested in sample answers.',
      weakEvidenceToReject:
        'A folder of policy PDFs or scripts without owner, effective date, ' +
        'version, or approved retrieval status.',
    },
    {
      claim: 'PHI and audit controls are sufficient for production use.',
      authoritativeSource:
        'Security/privacy control matrix, access policies, audit-log samples, ' +
        'transcript-retention policy, and incident-response workflow.',
      whatGoodEvidenceLooksLike:
        'Controls mapped to transcript capture, summary generation, retrieval, ' +
        'role-based access, redaction, retention, and output monitoring.',
      weakEvidenceToReject:
        'A high-level statement that HIPAA is covered without workflow-level ' +
        'controls and audit evidence.',
    },
    {
      claim: 'The selected intents are the right first pilot slice.',
      authoritativeSource:
        'Intent taxonomy, contact volume, AHT, transfer, repeat contact, QA, ' +
        'complaint/grievance, and readiness data by intent.',
      whatGoodEvidenceLooksLike:
        'A ranked intent table showing value, readiness, control risk, owner, ' +
        'and evidence status for each candidate slice.',
      weakEvidenceToReject:
        'A workshop preference list that is not grounded in volume, metric, ' +
        'risk, or readiness evidence.',
    },
    {
      claim: 'The operating model can absorb Agent Assist.',
      authoritativeSource:
        'Supervisor QA process, training plan, change-readiness survey, agent ' +
        'feedback telemetry, and adoption governance cadence.',
      whatGoodEvidenceLooksLike:
        'Named roles, coaching workflow, feedback loop, adoption metrics, and ' +
        'decision rights for accepting, editing, or rejecting suggestions.',
      weakEvidenceToReject:
        'A launch communication plan without supervisor workflow, adoption ' +
        'measurement, or feedback governance.',
    },
    {
      claim: 'Value can be handed to Tower for ongoing measurement.',
      authoritativeSource:
        'Finance-approved baseline, metric owners, calculation definitions, ' +
        'source extracts, measurement cadence, and caveat register.',
      whatGoodEvidenceLooksLike:
        'A Tower-ready value contract with baseline freeze, owner attestation, ' +
        'source lineage, timing, and known exclusions.',
      weakEvidenceToReject:
        'A benefits slide with target percentages but no baseline source, ' +
        'calculation owner, or measurement cadence.',
    },
  ],
};
