export interface PatternLandscapeLayer {
  layer: string;
  note: string;
  vendors: string[];
}

export interface PatternSignal {
  signal: string;
  source: string;
}

export interface PatternIntervention {
  title: string;
  effectiveness: string;
  horizon: string;
  resourcing: string;
  description: string;
}

export interface PatternHistoricalInstance {
  label: string;
  detail: string;
}

export interface PatternLink {
  label: string;
  href: string;
}

export interface PatternDepthOverlay {
  subtitle: string;
  tags: string[];
  failureMode: string[];
  triggers: string[];
  telemetry: PatternSignal[];
  landscape: PatternLandscapeLayer[];
  contradictions: string[];
  historicalInstances: PatternHistoricalInstance[];
  interventions: PatternIntervention[];
  failureModes: string[];
  evidenceBase: PatternHistoricalInstance[];
  maestroRubric: {
    probeFor: string[];
    confirmingSignals: string[];
    resolutionSignals: string[];
  };
  relatedTopics: PatternLink[];
  relatedPatterns: Array<{ code: string; label: string }>;
}

export interface TopicLandscapeItem {
  name: string;
  note: string;
}

export interface TopicPatternCard {
  code: string;
  name: string;
  description: string;
}

export interface TopicDepthOverlay {
  concept: string[];
  triggers: string[];
  conceptualLandscape: TopicLandscapeItem[];
  practitionerLandscape: TopicLandscapeItem[];
  evidenceBase: TopicLandscapeItem[];
  maestroRubric: {
    probeFor: string[];
    confirmingSignals: string[];
    resolutionSignals: string[];
  };
  patternCards: TopicPatternCard[];
}

export const PATTERN_DEPTH_OVERLAYS: Record<string, PatternDepthOverlay> = {
  F008: {
    subtitle:
      'Capital is flowing into AI faster than proof, controls, and operating accountability can catch up. This pattern appears when spend looks modern but evidence, baseline discipline, and governance still lag.',
    tags: ['Cross-sector', 'Executive', 'Outcome accountability'],
    failureMode: [
      'AI portfolios usually accumulate in three different clocks. Budget approvals move quarterly. Tool activation happens weekly. Verified outcome measurement lags by months. When those clocks are not governed together, the organization can sincerely believe it is accelerating while the evidence base is still thin.',
      'What makes the pattern persistent is not a lack of intent. It is the combination of fragmented sponsorship, soft baseline discipline, and no single operating view of where spend, usage, and value attribution meet. Teams can point to pilots, licenses, and demos, but no one can show which deployments changed a business metric enough to survive board scrutiny.',
      'The pattern often coexists with shadow-AI behavior. Decentralized experimentation is not the root cause by itself. The deeper issue is that the enterprise has no clean handoff from local experimentation into governed, portfolio-level value realization.',
    ],
    triggers: [
      'Board or CFO asks for verified AI return by business line and the answer comes back as case studies rather than measured deltas.',
      'AI tools are renewed automatically while baseline metrics, owner names, or success thresholds remain unresolved.',
      'Multiple teams report AI activity as progress, but portfolio reporting cannot distinguish pilot, production, and retired efforts.',
      'Finance sees rising AI spend while operating leaders still frame the portfolio as experimentation.',
      'A central AI program exists, but below-threshold purchases or feature activations continue outside the same review cadence.',
      'Outcome reporting relies on adoption anecdotes instead of instrumentation, attested savings, or counterfactual baselines.',
    ],
    telemetry: [
      {
        signal: 'AI spend grows quarter over quarter while the count of attested outcomes stays flat.',
        source: 'Finance ledger, contract register, portfolio review deck',
      },
      {
        signal: 'More tools are active in SSO, expense, or browser telemetry than exist in the governed inventory.',
        source: 'SSO logs, expense audits, discovery tools such as Zscaler or Netskope',
      },
      {
        signal: 'Usage is high for localized copilots, but executive KPI packs still show no attributable effect on cycle time, revenue, cost, or risk.',
        source: 'Product telemetry, KPI scorecards, operator interviews',
      },
      {
        signal: 'Renewals, pilots, and implementation workstreams have different owners and none own the portfolio outcome narrative end to end.',
        source: 'Contract metadata, steering-committee notes, org mapping',
      },
    ],
    landscape: [
      {
        layer: 'Discovery and inventory',
        note: 'Most enterprises start by finding what is already in use before they try to govern it.',
        vendors: ['Zscaler', 'Netskope', 'Microsoft Defender', 'Okta'],
      },
      {
        layer: 'Governance and policy orchestration',
        note: 'The AI-specific category is maturing, but many teams still extend existing GRC rather than adopt a clean AI operating layer.',
        vendors: ['Credo AI', 'Holistic AI', 'OneTrust', 'ServiceNow'],
      },
      {
        layer: 'Model and usage monitoring',
        note: 'Monitoring is necessary but insufficient if finance, sponsorship, and portfolio controls stay disconnected.',
        vendors: ['Fiddler', 'Arthur', 'WhyLabs', 'Datadog'],
      },
      {
        layer: 'Productivity and workflow estate',
        note: 'These vendors are where fragmented usage usually becomes visible first because they spread by team faster than policy catches up.',
        vendors: ['Jasper', 'Microsoft Copilot', 'Claude Enterprise', 'Glean', 'Moveworks'],
      },
    ],
    contradictions: [
      'Leadership states that AI is centrally governed while renewals, feature activations, or copilots continue outside the same intake and review path.',
      'A portfolio is described as strategic, but the evidence available for it is still tool-centric instead of outcome-centric.',
      'Business leaders argue for more AI investment while tolerating no shared method for proving what the current stack is already delivering.',
      'Security and legal review are treated as exceptional escalations even though the tool estate has already become enterprise-wide.',
    ],
    historicalInstances: [
      {
        label: 'Retail portfolio rationalization',
        detail:
          'Consumer-facing and internal GenAI tools spread through merchandising, marketing, and operations faster than contract review. The highest leverage move was not a procurement freeze; it was a 90-day inventory plus outcome-attribution sprint tied to renewal dates.',
      },
      {
        label: 'Healthcare ambient-documentation overlap',
        detail:
          'Regional ownership allowed multiple ambient-documentation vendors to coexist without a single enterprise owner. Governance harmonization had to happen before any rationalization decision would stick.',
      },
      {
        label: 'Financial-services AI portfolio cleanup',
        detail:
          'The visible issue was spend. The actual blocker was that no one could distinguish experimental AI, regulated production AI, and workflow automation in one board-facing view.',
      },
    ],
    interventions: [
      {
        title: 'Portfolio truth layer',
        effectiveness: 'High when adopted early in the cleanup',
        horizon: '4-8 weeks',
        resourcing: 'Finance + CIO/CTO staff + one program lead',
        description:
          'Create a single operating view that ties every AI tool or program to owner, renewal date, review status, baseline metric, and claimed outcome. This is the fastest way to stop the pattern from remaining anecdotal.',
      },
      {
        title: 'Renewal-gated rationalization',
        effectiveness: 'High on duplicated or lightly governed tool estates',
        horizon: '1-2 quarters',
        resourcing: 'Procurement, legal, security, business owners',
        description:
          'Use upcoming renewals as forcing functions. The point is not to ban local experimentation. It is to move duplicated tools onto a governed shortlist with explicit exception handling.',
      },
      {
        title: 'Outcome attestation discipline',
        effectiveness: 'Medium to high depending on data availability',
        horizon: '1 quarter to first signal',
        resourcing: 'Finance, operators, analytics lead',
        description:
          'Every material AI initiative needs an agreed baseline, a named attestor, and one measurable business delta. Without that discipline, portfolio reporting will keep collapsing back into narrative.',
      },
      {
        title: 'Tiered AI governance path',
        effectiveness: 'High when review bottlenecks are the excuse for bypassing governance',
        horizon: '6-10 weeks',
        resourcing: 'Governance owner + security + legal + architecture',
        description:
          'A low / medium / high risk review path prevents the central team from becoming the bottleneck while still forcing inventory, ownership, and data-sharing discipline.',
      },
    ],
    failureModes: [
      'The enterprise launches a governance committee but never connects it to renewal decisions, so the visible estate does not change.',
      'Tool rationalization happens before owner incentives change, so replacement tools get purchased in parallel six months later.',
      'Portfolio reporting becomes a one-time cleanup exercise instead of an operating rhythm tied to finance and security cadences.',
      'Measurement focuses on seats or prompts rather than a business delta, so the portfolio remains impossible to defend externally.',
    ],
    evidenceBase: [
      {
        label: 'McKinsey State of AI',
        detail:
          'Useful for understanding how quickly experimentation spreads relative to formal governance and ROI proof.',
      },
      {
        label: 'MIT Sloan and BCG AI adoption research',
        detail:
          'Helpful for separating local productivity gains from enterprise operating-model change.',
      },
      {
        label: 'NIST AI RMF and sector governance guidance',
        detail:
          'Relevant not because frameworks are the answer, but because they expose how often monitoring and accountability remain underspecified.',
      },
      {
        label: 'Client-side telemetry and renewal metadata',
        detail:
          'The strongest evidence is usually internal: renewals, seat growth, SSO usage, owner mapping, and KPI deltas reviewed together.',
      },
    ],
    maestroRubric: {
      probeFor: [
        'Who can name the top ten AI spends, their owners, and the next renewal date without opening three different systems?',
        'Which AI efforts have an attested baseline and a named executive willing to defend the claimed value?',
        'Where does local experimentation currently graduate into governed enterprise use?',
      ],
      confirmingSignals: [
        'Executives describe value in stories while operators can only name tool adoption.',
        'Renewals and security review live in separate workflows with no shared inventory.',
        'The same business outcome is claimed by multiple tools or workstreams.',
      ],
      resolutionSignals: [
        'The portfolio can be sorted by owner, value, risk, and renewal date in one view.',
        'At least one duplicated tool family has been rationalized with an explicit exception path.',
        'Outcome claims in steering materials can be traced to an agreed baseline and attestor.',
      ],
    },
    relatedTopics: [
      { label: 'AI Governance Implementation', href: '/intelligence/topics/ai_governance_implementation' },
      { label: 'Change Management for AI', href: '/intelligence/topics/change_management' },
      { label: 'Data Platform Modernization', href: '/intelligence/topics/data_platform_modernization' },
    ],
    relatedPatterns: [
      { code: 'F002', label: 'No active sponsor' },
      { code: 'F007', label: 'CDO vacancy through transition' },
      { code: 'F012', label: 'Post go-live data architecture rebuild' },
    ],
  },
};

export const TOPIC_DEPTH_OVERLAYS: Record<string, TopicDepthOverlay> = {
  change_management: {
    concept: [
      'AI change management is not the same as classic software rollout. The tool is rarely the hard part. The hard part is redesigning incentives, operating rituals, exception handling, manager coaching, and trust in machine-assisted work.',
      'The historical mistake is to treat adoption as a training problem. In AI programs, the more common root cause is that the old workflow continues to be rewarded while the new workflow is introduced as optional. That produces surface usage without behavior change.',
      'This matters differently across phases. In Phase 0 and Phase 1, the question is whether the sponsor is committed to changing how work gets done. By Phase 3 and Phase 4, the question becomes whether managers, metrics, and operating cadences reinforce the new behavior strongly enough to hold after rollout energy fades.',
    ],
    triggers: [
      'Frontline teams say the tool is interesting, but managers still measure performance with the old dashboard and the old rhythm.',
      'Training is scheduled as a launch event while coaching, exception handling, and manager reinforcement remain unowned.',
      'The same workflow has already failed once under a different platform, which means trust debt exists before the new program even starts.',
      'The sponsor frames the work as technology deployment while operators describe it as process redesign or staffing disruption.',
      'Adoption looks acceptable in pilot cohorts but collapses when the rollout moves into busier, lower-support operating units.',
      'Success metrics focus on clicks, seats, or logins even though the real change requires cycle-time, quality, risk, or revenue movement.',
    ],
    conceptualLandscape: [
      {
        name: 'Kotter 8-step model',
        note:
          'Still useful for urgency, coalition building, and reinforcement. Less useful on its own when AI programs need workflow-level instrumentation and rapid exception handling.',
      },
      {
        name: 'ADKAR / Prosci',
        note:
          'Strong for individual adoption framing. Needs extension for AI because awareness and desire alone do not solve trust, prompt quality, or manager-level operating changes.',
      },
      {
        name: 'Operating-model redesign',
        note:
          'Often more predictive than formal change frameworks. AI programs succeed when decision rights, rituals, QA steps, and escalation paths are redesigned together with enablement.',
      },
      {
        name: 'Executive visibility loops',
        note:
          'AI programs need short-cycle review of where usage, value, and friction diverge. Quarterly steering without weekly operator signals is usually too slow.',
      },
    ],
    practitionerLandscape: [
      {
        name: 'John Kotter',
        note:
          'Still the clearest shorthand for urgency and coalition-building, especially when leadership misalignment is the real obstacle.',
      },
      {
        name: 'Jeff Hiatt / Prosci',
        note:
          'Useful for practitioner-friendly adoption design. Best applied as one layer inside a broader operating-model change approach.',
      },
      {
        name: 'Tsedal Neeley',
        note:
          'Strong lens on digital transformation, remote leadership, and how managerial behavior shapes adoption credibility.',
      },
      {
        name: 'Ethan Mollick',
        note:
          'Helpful for practical AI work-pattern change and how humans recalibrate around new tools in knowledge workflows.',
      },
      {
        name: 'MIT Sloan, Stanford HAI, Wharton',
        note:
          'The most useful research tends to connect AI adoption to work design, manager behavior, and organizational trust rather than raw model quality.',
      },
    ],
    evidenceBase: [
      {
        name: 'Prosci benchmarking',
        note:
          'Consistently supports the idea that active sponsorship and manager reinforcement matter more than training volume alone.',
      },
      {
        name: 'McKinsey and BCG AI adoption studies',
        note:
          'Useful for understanding why pilots stall after initial enthusiasm when workflow redesign and operating ownership stay weak.',
      },
      {
        name: 'MIT Sloan management research',
        note:
          'Important for the trust and work-design layer: adoption follows when employees can see how the new system changes the job, not just the tool stack.',
      },
      {
        name: 'Internal program evidence',
        note:
          'The strongest signal is still local: manager variance, behavior-change lag, workarounds, escalation frequency, and which teams revert first when pressure rises.',
      },
    ],
    maestroRubric: {
      probeFor: [
        'What behavior is supposed to change, exactly, and who is accountable for that behavior after training ends?',
        'Which manager metric, ritual, or approval step still rewards the old way of working?',
        'Where does the first hard exception surface when the AI-assisted workflow collides with a real operating edge case?',
      ],
      confirmingSignals: [
        'Adoption is discussed as communications and training rather than operating-system redesign.',
        'Manager-level variance is wide and no one is treating that variance as the core problem.',
        'Operators can name the friction, but steering materials still describe rollout as on track.',
      ],
      resolutionSignals: [
        'Managers review new workflow measures in the same cadence that used to reinforce the old way of working.',
        'Exception paths are explicit, short, and owned.',
        'Behavior-change metrics tighten across teams instead of relying on one hero cohort.',
      ],
    },
    patternCards: [
      {
        code: 'F001',
        name: 'Workflow enablement gap',
        description:
          'A capable tool lands in the workflow, but operators never receive the redesign, guardrails, or manager reinforcement required to use it confidently.',
      },
      {
        code: 'F012',
        name: 'Post go-live operating rewrite',
        description:
          'The technology ships before the surrounding workflow is ready, forcing teams to rebuild process, controls, and ownership after launch.',
      },
      {
        code: 'F014',
        name: 'Incentives still reward the old system',
        description:
          'Adoption is requested, but compensation, KPIs, or manager scorecards still favor the prior workflow, so behavior snaps back under pressure.',
      },
    ],
  },
};
