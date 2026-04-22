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

export interface TopicVendorEntry {
  name: string;
  descriptor: string;
  opinion?: string;
}

export interface TopicVendorGroup {
  layer: string;
  title: string;
  pointOfView: string;
  vendors: TopicVendorEntry[];
}

export interface TopicDepthOverlay {
  // Optional · only used when an overlay stands alone without a DB row.
  title?: string;
  tagline?: string;
  industriesLabel?: string;

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

  // Overlay-only · rendered when no DB topic row exists (2026-current
  // vendor layers with architectural POV, parallel to pattern pages).
  vendorLandscape?: TopicVendorGroup[];
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

// ─── AI Governance Operating Model (Fix Spec v4 §7) ─────────────────────
const AI_GOVERNANCE_OPERATING_MODEL: TopicDepthOverlay = {
  title: 'AI Governance Operating Model',
  tagline:
    'Governance of AI is not a framework adoption decision; it is an operating-model decision. Who decides, who monitors, who escalates, and at what cadence — and how those roles are staffed relative to the pace of AI deployment.',
  industriesLabel: 'CROSS-SECTOR · BOARD / EXECUTIVE',

  concept: [
    'Every enterprise with more than a handful of AI deployments reaches the governance operating-model question within 18 months. The framework choice — NIST AI RMF, ISO 42001, sector-specific supervisory guidance, EU AI Act — is usually the easier half of the question. The harder half is who sits in the seats the framework implies, how often they meet, what authority they carry, and how decisions move from their table to the operating teams without serialising the portfolio.',
    'The mistake most enterprises make is to adopt a framework as if it is the operating model. A framework names categories of risk; an operating model assigns named owners, cadence, authority, and accountability. Without the second half, the framework produces documents without changing decisions.',
    'The reference points have matured significantly in the 2024-2026 period. The EU AI Act came into force with phased implementation; NIST released RMF 1.0 with sector-specific profiles; ISO 42001 moved from draft to certified standard; and US financial services regulators (Fed SR 24-7, OCC guidance) clarified supervisory expectations. The question is not whether a framework exists for your sector — it does — but how you operationalise it without creating a review bottleneck.',
    'The three common failure modes are: (1) the committee meets monthly while production-deployments happen weekly, so the committee sees completed work rather than in-flight decisions; (2) the framework is owned by legal or compliance without operating-team seats, so framework decisions don\'t change engineering behavior; (3) risk tiering is absent, so a low-risk internal chatbot goes through the same process as a regulated consumer credit decision model, which means either the low-risk case blocks or the high-risk case slips through.',
  ],

  triggers: [
    'Board asks "how are we governing AI?" and the answer describes a framework rather than a decision cadence or named owners',
    'Three or more AI programs are awaiting "governance review" for >30 days without a named owner of the queue',
    'Legal and compliance own the AI governance committee; engineering and business teams attend without voting authority',
    'No risk-tiering approach exists; every AI deployment gets the same review path regardless of exposure level',
    'Recently reported AI-related incident (bias, data leak, customer-facing error) exposed a governance gap that a framework named in principle but didn\'t prevent in practice',
    'Board or audit committee requests "independent assurance" of AI governance effectiveness and nobody has a credible offer',
  ],

  conceptualLandscape: [
    {
      name: 'NIST AI Risk Management Framework (AI RMF 1.0) · sector profiles',
      note: 'US-origin reference; sector-specific profiles (healthcare, financial services, generative AI) released 2024-2025. Strong on risk categorisation; operating-model specifics left to the adopter.',
    },
    {
      name: 'ISO/IEC 42001 · AI Management System standard',
      note: 'Certifiable standard analogous to ISO 27001 for AI. Adoption accelerating in EU, Japan, Singapore. Forces operating-model documentation as part of certification scope.',
    },
    {
      name: 'EU AI Act · risk-tiering by use case',
      note: 'Prohibited / high-risk / limited-risk / minimal-risk structure. Phased implementation through 2027. High-risk category forces named accountable person, conformity assessment, and post-market monitoring.',
    },
    {
      name: 'Federal Reserve SR 24-7 · AI model risk management (2024)',
      note: 'Supervisory letter clarifying SR 11-7 model-risk expectations for AI. Named accountable risk officer, validation cadence, and documentation depth for regulated US banks.',
    },
    {
      name: 'Three-lines-of-defence model (adapted for AI)',
      note: 'First line · product/engineering; second line · AI risk + compliance; third line · internal audit. Adaptation question is where data-science teams sit and how model validation aligns with audit cadence.',
    },
    {
      name: 'AI tiered-review operating model',
      note: 'Risk-tiered review cadence · low-risk deployments follow an expedited path; high-risk deployments require full committee review. The single most effective structural pattern · prevents the committee becoming the bottleneck.',
    },
  ],

  practitionerLandscape: [
    {
      name: 'Daniel Ho (Stanford RegLab)',
      note: 'Most-cited academic on AI regulation operating-model specifics. His work separates framework-level choices from the operational realities of enforcement.',
    },
    {
      name: 'Rumman Chowdhury (Humane Intelligence, formerly Twitter META)',
      note: 'Operational lens on how AI governance roles are staffed and what authority they actually carry. Strong voice on red-teaming as a governance-operational practice, not a framework line item.',
    },
    {
      name: 'Kay Firth-Butterfield (Centre for Trustworthy Technology, formerly WEF)',
      note: 'Global perspective on AI governance board-level engagement. Useful for framing the CEO + board conversation about where governance accountability should sit structurally.',
    },
    {
      name: 'Nick Clegg (formerly Meta, public-policy + AI governance)',
      note: 'Operational view on cross-jurisdictional governance · the hard practitioner problem of reconciling EU AI Act, US state-level AI laws, and sector regulation without serialising the product cycle.',
    },
    {
      name: 'Christina Montgomery (IBM Chief Privacy + Trust Officer)',
      note: 'Practitioner voice on named-accountability governance · her role exists explicitly because IBM treats trust + privacy as an operating function, not a compliance function.',
    },
    {
      name: 'Navrina Singh (Credo AI · founder)',
      note: 'Vendor-side view on the tooling + operating model connection · most-cited practitioner on what governance tooling can and cannot do structurally.',
    },
  ],

  evidenceBase: [
    {
      name: 'NIST AI Risk Management Framework 1.0 + sector profiles (2023-2025)',
      note: 'Canonical US reference; profiles for GenAI (2024), Healthcare (2024), Financial Services (2025) are the operationally-useful artefacts.',
    },
    {
      name: 'Stanford HAI AI Index Report · annual',
      note: 'Empirical data on AI governance maturity across industries + geographies. The most-cited source for board-level framing conversations.',
    },
    {
      name: 'McKinsey State of AI Governance · 2025',
      note: '450-enterprise survey tying governance operating-model choices to outcome metrics. Useful for CEO + CRO framing.',
    },
    {
      name: 'OECD AI Policy Observatory',
      note: 'Cross-jurisdictional comparison of AI regulation · essential for multinational enterprises wrestling with the operating-model reconciliation problem.',
    },
  ],

  maestroRubric: {
    probeFor: [
      'Who is the named accountable person for the enterprise\'s AI governance operating model? If the answer is a committee, the pattern is active.',
      'What is the risk-tiering approach for AI deployments? If every deployment follows the same review path, the committee is inevitably the bottleneck.',
      'How often does the AI governance body meet, and how does that cadence compare to deployment frequency? If governance is monthly and deployments are weekly, the committee sees finished work.',
      'Which AI framework has been adopted and where does the operating model diverge from what the framework implies?',
      'When the last AI-related incident occurred, what specifically changed in the operating model afterwards? "We updated the framework" is a tell that the operating model didn\'t change.',
    ],
    confirmingSignals: [
      'AI governance is named in board materials as a priority but the committee has not met in the last quarter',
      'Framework adoption is described without naming the accountable person or the decision cadence',
      'Legal and compliance own the governance committee; engineering attends without voting authority',
      'Risk-tiering absent; all AI deployments flow through the same review pipeline',
      'Recent AI-related escalation resolved via framework document update rather than operating-model change',
    ],
    resolutionSignals: [
      'Named AI risk officer with direct report to CRO or CIO and defined authority to block a deployment',
      'Tiered review cadence · expedited path for low-risk, full-committee path for high-risk, with published SLA',
      'Governance committee meets at the deployment cadence (typically bi-weekly) with voting authority distributed across legal, engineering, business',
      'Three-lines-of-defence model documented with named owners and cadence per line',
      'Two consecutive quarters without an AI deployment blocked on "governance review" for >14 days',
    ],
  },

  patternCards: [
    {
      code: 'F008',
      name: 'Shadow AI · unsanctioned tool proliferation',
      description:
        'Governance operating model addresses this pattern at the source · risk tiering + sanctioned catalog + procurement gate together.',
    },
    {
      code: 'F015',
      name: 'Data-owner bottleneck',
      description:
        'Governance operating model interfaces with data-owner capacity · if the committee produces access approvals that still serialise through a capacity-constrained owner team, the governance fix is half-done.',
    },
    {
      code: 'F019',
      name: 'Model drift unmonitored',
      description:
        'Governance operating model should specify post-deployment monitoring cadence · when it does not, drift goes uncaught until an operating metric slips.',
    },
  ],

  vendorLandscape: [
    {
      layer: 'governance',
      title: 'AI governance platforms · 2026',
      pointOfView:
        'The category is maturing. Credo AI, Holistic AI, and Fairly AI are credible for mid-market and enterprise. The gap is connecting governance tooling to the actual deployment pipeline · most deployments happen through GitHub Actions or MLflow, and the governance tool is a separate system of record. Closing that gap is where the operating-model work lives.',
      vendors: [
        { name: 'Credo AI', descriptor: 'AI governance + risk orchestration · vendor-agnostic', opinion: 'Strongest operational narrative in the category · opinionated about the workflow, less opinionated about the framework choice. Right pick when the operating model is the question, not the framework.' },
        { name: 'Holistic AI', descriptor: 'AI risk management · bias + robustness focus', opinion: 'Strong on technical risk evaluation; weaker on the organisational operating-model layer. Best paired with a committee-level operating model rather than as its replacement.' },
        { name: 'Fairly AI', descriptor: 'Model governance · regulated-industry focus', opinion: 'Closer to the "model risk" framing than the "AI governance" framing · right pick for financial services still operating under SR 11-7 conventions.' },
        { name: 'OneTrust AI Governance', descriptor: 'Extension of privacy-governance platform to AI', opinion: 'Natural pick for enterprises already on OneTrust for privacy; weaker as standalone. Value comes from the integration with existing data-governance workflow.' },
      ],
    },
    {
      layer: 'infrastructure',
      title: 'Model lifecycle + deployment controls',
      pointOfView:
        'The operating model meets the deployment pipeline here. MLflow and Weights & Biases dominate the model-lifecycle layer; the governance connection is through tags, approvals, and gated promotion-to-production steps. The right deployment in a governed environment is one where a high-risk model cannot be promoted without a committee-tagged approval event in the pipeline.',
      vendors: [
        { name: 'MLflow (Databricks · open-source)', descriptor: 'Model registry + lifecycle · de-facto standard', opinion: 'Best-in-class for the lifecycle layer; governance integration is DIY. Closing that integration is high-leverage work.' },
        { name: 'Weights & Biases', descriptor: 'Experiment tracking + model registry', opinion: 'Dominant in ML research teams; enterprise adoption accelerating. Pair with Credo AI or similar for governance layer.' },
        { name: 'SageMaker Model Registry (AWS)', descriptor: 'AWS-native model lifecycle', opinion: 'Right pick for AWS-heavy enterprises; governance integration is tighter than the alternatives but less flexible across clouds.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Red-teaming + assurance',
      pointOfView:
        'Red-teaming is now an expected operating-model element for generative AI, per NIST GenAI profile and the White House EO. The vendors here are a mix of specialist firms and platform tools. The operating-model question is whether red-teaming happens once pre-launch (insufficient) or continuously post-launch (the new standard).',
      vendors: [
        { name: 'Humane Intelligence', descriptor: 'AI red-teaming + bias auditing · Rumman Chowdhury', opinion: 'Practitioner-led; strongest methodological rigor in the category. Right pick when board-level assurance is the driver.' },
        { name: 'Robust Intelligence (Cisco)', descriptor: 'Automated AI red-teaming platform · acquired 2024', opinion: 'Platform automation plus Cisco distribution; best when the governance need is scale rather than depth.' },
        { name: 'HiddenLayer', descriptor: 'AI security + adversarial ML', opinion: 'Specialist on adversarial ML attacks · appropriate for high-risk deployments (financial services, healthcare) where adversarial robustness is the specific concern.' },
        { name: 'Top-3 consulting firm · AI assurance practice', descriptor: 'Independent third-line assurance', opinion: 'Right pick when the audit committee wants third-party attestation rather than second-line verification.' },
      ],
    },
    {
      layer: 'talent',
      title: 'Governance roles · staffing model',
      pointOfView:
        'The most important vendor-adjacent choice is how the AI-risk-officer role is staffed. Heidrick and Spencer Stuart are running AI-governance search practices specifically for this role now · that is new in the 2024-2025 period. The alternative is an internal promotion from compliance or risk, which works when the candidate has the engineering fluency to push back; most do not.',
      vendors: [
        { name: 'Heidrick & Struggles · AI governance leadership practice', descriptor: 'Executive search for AI risk officer + governance roles', opinion: 'Right pick for Fortune-500 enterprises · the candidate pool outside executive search is thin.' },
        { name: 'Spencer Stuart · AI + digital leadership', descriptor: 'Executive search · adjacent practice', opinion: 'Close competitor to Heidrick; pick based on existing enterprise relationship.' },
        { name: 'Internal promotion from compliance / risk', descriptor: 'Most common staffing pattern', opinion: 'Works when the candidate has engineering fluency; fails when the role becomes a framework-adopter without operating-model authority.' },
      ],
    },
  ],
};

// ─── Build vs Buy for AI (Fix Spec v4 §7) ───────────────────────────────
const BUILD_VS_BUY_AI: TopicDepthOverlay = {
  title: 'Build vs Buy for AI',
  tagline:
    'The architectural question most AI programs face within the first six months. Not "can we build this?" · the right question is "where does building create durable advantage, where does buying preserve optionality, and what gets built in the middle as integration?"',
  industriesLabel: 'CROSS-SECTOR · CIO / CTO',

  concept: [
    'Build-vs-buy is the most-debated question in enterprise AI programs and the most poorly-framed. The framing failure is treating it as a single decision across the AI stack. In practice the decision is different at every layer — foundation model, inference infrastructure, fine-tuning pipeline, retrieval layer, application layer, evaluation harness — and the right answer varies by layer, by use case, and by where durable advantage exists.',
    'The 2026 baseline is that foundation models are bought (from Anthropic, OpenAI, Google, AWS Bedrock, Azure OpenAI). Essentially no enterprise builds foundation models; the economics are prohibitive and the marginal gains are narrow. The question is real only at the layers above the foundation model: inference infrastructure, fine-tuning, retrieval, application, evaluation.',
    'The durable-advantage lens is the cleanest framework. Build where advantage compounds — proprietary data connectors, domain-specific evaluation harnesses, workflow integrations into your core business systems. Buy where the category has commoditised or where the vendor can amortise investment you cannot — general-purpose RAG infrastructure, observability tooling, vector databases. Integrate in the middle — fine-tuning pipelines, domain retrieval, guardrails, cost management.',
    'The most common failure mode is building the infrastructure layer and buying the application layer · the inverse of what the durable-advantage lens would suggest. Building generic RAG produces a rate-limited team perpetually behind vendor feature velocity; buying the application produces a demo-then-stall outcome where the vendor\'s roadmap doesn\'t match your workflow specifics. The right default is buy the infrastructure, build the last-mile application glue.',
  ],

  triggers: [
    'AI team is 6-12 months into a program and 70%+ of engineering time is spent on infrastructure plumbing rather than business-facing features',
    'Application-layer vendor (e.g. Glean, Copilot, Einstein) has been deployed but adoption stalled because workflow specifics don\'t match the vendor\'s assumptions',
    'Finance asks for cost visibility on AI spend and the answer requires three weeks of reconciliation across six vendors and a home-built platform',
    '"We\'re building our own foundation model" appears as a program milestone · almost always a signal the program has lost framing clarity',
    'Vendor lock-in concern is raised in procurement review but the team cannot articulate where the lock-in is material vs. where it is theoretical',
    'Major foundation-model vendor announces a feature that the team has been building for 9 months · forcing an abandon-vs-continue conversation',
  ],

  conceptualLandscape: [
    {
      name: 'Durable-advantage framework',
      note: 'Build where advantage compounds · proprietary data, domain expertise, workflow specifics. Buy where the category has commoditised or where the vendor can amortise investment. Integrate in the middle. Most practical framework for layer-by-layer decisions.',
    },
    {
      name: 'Wardley mapping (applied to AI stack)',
      note: 'Explicitly surfaces the commodity vs. custom distinction at each layer. Useful for CTO-level strategy conversations · less useful for the week-to-week build-or-buy decision.',
    },
    {
      name: 'Core-vs-context (Geoffrey Moore)',
      note: 'Pre-AI framing that still applies · build for what differentiates; buy for what sustains operations without differentiating. AI complication · many "context" layers (observability, cost management, evaluation) were underbuilt pre-AI and now require deliberate investment even though they don\'t differentiate.',
    },
    {
      name: 'Reversibility principle',
      note: 'Buy first when the decision is reversible; build first when switching cost is existentially high. Most AI build-vs-buy decisions are more reversible than the debate suggests · the real irreversibility is in data commitments and workflow integration, not in the model layer.',
    },
    {
      name: 'Layer-by-layer decomposition',
      note: 'Foundation model · infrastructure · fine-tuning · retrieval · application · evaluation. Each layer has its own build-buy answer; treating them as one decision is the most common mistake.',
    },
    {
      name: 'Vendor optionality reserve',
      note: 'Even when buying, architect for vendor substitution at the layer where switching cost is highest (typically inference). Keeping two vendors warm on 20/80 split is a widely-used pattern in 2026, particularly for GenAI workloads.',
    },
  ],

  practitionerLandscape: [
    {
      name: 'Cassie Kozyrkov (Kozyr · formerly Google Chief Decision Scientist)',
      note: 'Decision-theory lens on build-vs-buy. Most-cited voice on avoiding the "sophistication bias" where engineering teams over-index on build for status reasons.',
    },
    {
      name: 'Ethan Mollick (Wharton · One Useful Thing)',
      note: 'Practitioner lens on which layers are commoditising fastest. Newsletter is the most-cited real-time source for build-vs-buy timing decisions.',
    },
    {
      name: 'Chip Huyen (Voltage Park · formerly Snorkel, author)',
      note: 'Ml-ops practitioner perspective on which layers of the AI stack deserve custom investment. Her "AI Engineering" framing is the cleanest current decomposition.',
    },
    {
      name: 'Andrej Karpathy (Eureka Labs · formerly OpenAI, Tesla)',
      note: 'Architectural voice on the foundation-model layer specifically. His public writing is the clearest articulation of why almost no enterprise should build foundation models in 2026.',
    },
    {
      name: 'Simon Willison',
      note: 'Practitioner tool-choice perspective. Strongest real-time signal on when vendor tools reach production-readiness vs. when a team still needs to build.',
    },
    {
      name: 'Daniel Saroff (IDC · VP Research)',
      note: 'Analyst lens on AI vendor-landscape maturity. Most-cited practitioner for procurement-level build-vs-buy decisions where vendor-viability is the concern.',
    },
  ],

  evidenceBase: [
    {
      name: 'a16z State of AI report · biannual',
      note: 'Vendor-landscape maturity benchmark. Useful for timing decisions · when a category has three funded vendors, building is probably wrong.',
    },
    {
      name: 'Stanford HAI AI Index · vendor landscape chapter',
      note: 'Academic framing of the build-vs-buy landscape. Strongest on foundation-model layer; thinner on application-layer decisions.',
    },
    {
      name: 'MIT Sloan · GenAI Adoption Patterns (2025)',
      note: 'Empirical data on enterprise build-vs-buy choices and outcome correlation. Finding worth citing · enterprises that built their own RAG infrastructure underperformed on time-to-value by 2-3 quarters vs. those that bought.',
    },
    {
      name: 'a16z "Emerging Architectures for LLM Applications"',
      note: 'Practitioner architecture reference · the most-cited layer decomposition in the field as of 2026.',
    },
    {
      name: 'IDC + Gartner AI Hype Cycle / MarketScape',
      note: 'Vendor-category maturity framing. Useful for procurement + CIO conversations; less useful for architecture-level decisions.',
    },
  ],

  maestroRubric: {
    probeFor: [
      'At which specific layer of the AI stack does your enterprise have durable advantage · proprietary data, domain expertise, workflow specifics? Those are the build candidates. Everything else defaults to buy.',
      'What percentage of AI engineering time is spent on infrastructure plumbing vs. business-facing features? If infrastructure >50%, the build-vs-buy ratio is inverted.',
      'When was the last time a major foundation-model vendor announced a feature you were building? What happened · abandon, continue, pivot? The pattern of responses is diagnostic.',
      'Who owns the "vendor optionality reserve" · the conscious decision to keep a second vendor warm at each critical layer? If nobody owns it, lock-in is unmanaged.',
      'How is AI cost visibility structured? If FinOps for AI requires weeks of reconciliation, the platform layer is under-invested.',
    ],
    confirmingSignals: [
      'AI engineering time >50% on infrastructure vs. business features',
      '"We\'re building our own foundation model" appears in a milestone deck',
      'Vendor-lock-in debate is theoretical · team cannot name a specific layer where lock-in is material',
      'Build-vs-buy decisions happen layer-by-layer without reference to a shared framework',
      'Application-layer buy + infrastructure-layer build · inverse of the durable-advantage default',
    ],
    resolutionSignals: [
      'Layer-by-layer decision matrix documented with durable-advantage attribution',
      'Foundation model · bought; inference infrastructure · bought with optionality reserve; fine-tuning + retrieval · built on open-source primitives; application layer · built to match workflow specifics',
      'FinOps-for-AI dashboard live with per-layer attribution and monthly cost reconciliation',
      '"Buy first, build if vendor caps out" explicitly endorsed at CTO level as the default',
      'Two consecutive quarters with no engineering time spent rebuilding infrastructure the vendor category now covers',
    ],
  },

  patternCards: [
    {
      code: 'F003',
      name: 'Platform build without business case',
      description:
        'The canonical build-vs-buy failure mode · a platform team builds capabilities that a vendor already sells, and the business-case rebuild is forced post-hoc.',
    },
    {
      code: 'F008',
      name: 'Shadow AI · unsanctioned tool proliferation',
      description:
        'Adjacent pattern · when sanctioned platform builds under-deliver, teams buy shadow tools outside the sanctioned catalog.',
    },
    {
      code: 'F015',
      name: 'Data-owner bottleneck',
      description:
        'Related pattern · the build-vs-buy decision at the data-access layer is often forced by owner-team capacity limits · buying federated query (Starburst / Immuta) is a structural answer.',
    },
  ],

  vendorLandscape: [
    {
      layer: 'infrastructure',
      title: 'Foundation model · the "always buy" layer',
      pointOfView:
        'Essentially no enterprise should build foundation models in 2026. The economics are prohibitive and the marginal gains are narrow relative to tuning/retrieval investment. The real question is which 2-3 models to keep warm for optionality, not whether to train your own.',
      vendors: [
        { name: 'Anthropic Claude (via API or AWS Bedrock)', descriptor: 'Frontier model family · strongest on long-context + alignment', opinion: 'Primary choice for reasoning-heavy enterprise workloads · particularly Claude Opus for high-stakes decisions. Keep OpenAI warm for optionality.' },
        { name: 'OpenAI GPT-4.5 + o-series (via API or Azure OpenAI)', descriptor: 'Frontier model family · strongest on ecosystem maturity', opinion: 'Broadest tooling ecosystem; right primary choice when ecosystem integration outweighs frontier-reasoning preference.' },
        { name: 'Google Gemini (via Vertex AI)', descriptor: 'Frontier model family · strongest multimodal + Google Workspace integration', opinion: 'Right primary choice when Workspace is the productivity anchor; less compelling as API-first frontier model.' },
        { name: 'Open-weight models (Llama, Mistral, Qwen) via AWS Bedrock / Databricks', descriptor: 'Self-hostable frontier-adjacent models', opinion: 'Right pick for regulated workloads requiring full data isolation; accept the 3-6 month performance lag vs. frontier closed models.' },
      ],
    },
    {
      layer: 'infrastructure',
      title: 'Inference infrastructure · buy with optionality reserve',
      pointOfView:
        'Building inference infrastructure from scratch is prohibitively expensive and vendor-category competition is fierce (AWS Bedrock, Azure OpenAI, GCP Vertex AI, Databricks, Together, Fireworks). The right default is buy with a conscious optionality reserve · keep 2 vendors warm at 80/20 split to prevent lock-in without over-taxing the engineering team.',
      vendors: [
        { name: 'AWS Bedrock', descriptor: 'Multi-provider model gateway · AWS-native', opinion: 'Best-in-class for AWS-heavy enterprises; weaker when non-Anthropic/non-open-weight models are primary.' },
        { name: 'Azure OpenAI Service', descriptor: 'OpenAI-exclusive on Azure · enterprise-regulated contracts', opinion: 'Right pick for enterprise-regulated workloads where Microsoft procurement is the easy path; no cross-vendor model choice.' },
        { name: 'Databricks Mosaic AI', descriptor: 'Model serving on the data platform · unified with lakehouse', opinion: 'Strongest integration story when data gravity sits in Databricks; less flexible across cloud providers.' },
        { name: 'Together AI / Fireworks / Baseten', descriptor: 'Specialist inference providers · open-weight focus', opinion: 'Right pick when self-hosted open-weight models at scale are the architectural need; accept the enterprise-contract tail being thinner.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Fine-tuning + retrieval · integrate, selectively build',
      pointOfView:
        'This is the layer most enterprises get wrong. Building end-to-end RAG is now almost always wrong (the category has commoditised); buying end-to-end RAG is almost always wrong (the vendor\'s assumptions don\'t match your workflow). Integrate · pick the open-source primitives, build the last-mile domain-retrieval logic, buy the observability.',
      vendors: [
        { name: 'LangChain / LlamaIndex', descriptor: 'Open-source RAG orchestration · widely adopted', opinion: 'Default primitive layer in 2026. Build on top; don\'t try to replace.' },
        { name: 'Pinecone / Weaviate / Qdrant', descriptor: 'Managed vector databases', opinion: 'Buy · category has matured. Pick based on existing cloud provider + integration needs, not feature differentiation.' },
        { name: 'Vectara / Glean (application-layer RAG)', descriptor: 'End-to-end enterprise RAG products', opinion: 'Caution · often over-fit to generic assumptions. Pilot against workflow specifics before committing; most enterprises end up building last-mile glue anyway.' },
        { name: 'Unstructured.io / Airtable + dbt', descriptor: 'Document processing + structured data pipelines', opinion: 'Integrate for document-processing layer; do not build.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Application layer · build for workflow fit',
      pointOfView:
        'This is where durable advantage lives. Buying application-layer AI (enterprise Copilot, Einstein, Glean) produces demo-then-stall outcomes when workflow specifics matter. Build the last-mile application glue on top of bought infrastructure; that is where the workflow fit + proprietary-data advantage compounds.',
      vendors: [
        { name: 'Microsoft Copilot for M365', descriptor: 'Productivity-surface AI · Microsoft-stack native', opinion: 'Right buy when productivity is the use case and Microsoft is the anchor. Not a substitute for workflow-specific application build.' },
        { name: 'Salesforce Einstein / Agentforce', descriptor: 'CRM-native AI · Salesforce-stack native', opinion: 'Right buy when CRM is the anchor; accept the walled-garden constraint on integration.' },
        { name: 'Glean', descriptor: 'Enterprise search + assistant · horizontal', opinion: 'Right buy when horizontal enterprise-search is the primary need; less compelling as the only AI surface.' },
        { name: 'Custom application layer on OpenAI Assistants / Claude Computer Use / Agents SDK', descriptor: 'Build · typical 1-3 month per workflow vertical', opinion: 'Right build for workflow-specific applications · the fastest path when the workflow fit is the value.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Evaluation + observability · buy, then build domain harness',
      pointOfView:
        'The observability layer has matured fast (Arize, Fiddler, LangSmith, Langfuse). Buy the general-purpose layer. Build the domain-specific evaluation harness on top · the business-outcome evaluation that matters for your use case will not be in the vendor\'s default metrics.',
      vendors: [
        { name: 'Arize AI', descriptor: 'ML observability · production-grade', opinion: 'Best-in-class for production monitoring; pair with domain-specific evaluation on top.' },
        { name: 'LangSmith (LangChain)', descriptor: 'Developer-time tracing + evaluation · LangChain-native', opinion: 'Right buy during development · strong ecosystem fit if already on LangChain.' },
        { name: 'Langfuse', descriptor: 'Open-source observability · self-hostable', opinion: 'Right pick for regulated workloads requiring self-hosted observability; accept the ecosystem being smaller than Arize/LangSmith.' },
        { name: 'Fiddler AI', descriptor: 'ML monitoring + explainability · regulated-industry focus', opinion: 'Right pick for financial services + healthcare where explainability is a compliance requirement.' },
      ],
    },
  ],
};

export const TOPIC_DEPTH_OVERLAYS: Record<string, TopicDepthOverlay> = {
  ai_governance_operating_model: AI_GOVERNANCE_OPERATING_MODEL,
  build_vs_buy_ai: BUILD_VS_BUY_AI,
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
