import type {
  AdvanceResult,
  ArchetypeKey,
  ContextSource,
  CreateProgramRequest,
  DraftResult,
  InboxItem,
  Milestone,
  ModuleContent,
  ModuleState,
  NextTurn,
  NexusFlag,
  OriginationForm,
  OriginationRequest,
  OriginationStageEvent,
  PatternLibraryItem,
  PatternMatch,
  PersonRef,
  PortfolioFilters,
  ProgramFullState,
  ProgramSummary,
  Question,
  Synthesis,
  Turn,
  ViewerRole,
} from '@/lib/programs/types';

const PEOPLE: Record<string, PersonRef> = {
  dana: { id: 'person-dana-mercer', name: 'Dana Mercer', title: 'VP Store Ops', initials: 'DM', avatarColor: '#0f766e', clientName: 'Apex Retail Group' },
  arjun: { id: 'person-arjun-patel', name: 'Arjun Patel', title: 'Chief Information Officer', initials: 'AP', avatarColor: '#1d4ed8', clientName: 'Apex Retail Group' },
  elena: { id: 'person-elena-cruz', name: 'Elena Cruz', title: 'Chief Marketing Officer', initials: 'EC', avatarColor: '#9333ea', clientName: 'Apex Retail Group' },
  marcus: { id: 'person-marcus-hale', name: 'Marcus Hale', title: 'Head of Digital', initials: 'MH', avatarColor: '#ea580c', clientName: 'Apex Retail Group' },
  alex: { id: 'person-alex-kim', name: 'Alex Kim', title: 'Program Lead', initials: 'AK', avatarColor: '#0ea5e9', clientName: 'Apex Retail Group' },
  tori: { id: 'person-tori-nguyen', name: 'Tori Nguyen', title: 'VP Merchandising Analytics', initials: 'TN', avatarColor: '#16a34a', clientName: 'Apex Retail Group' },
  sofia: { id: 'person-sofia-ramirez', name: 'Sofia Ramirez', title: 'Data Platform Director', initials: 'SR', avatarColor: '#b45309', clientName: 'Apex Retail Group' },
  maya: { id: 'person-maya-brooks', name: 'Maya Brooks', title: 'Store Experience Lead', initials: 'MB', avatarColor: '#be123c', clientName: 'Apex Retail Group' },
  lena: { id: 'person-lena-morales', name: 'Lena Morales', title: 'Maestro Oversight', initials: 'LM', avatarColor: '#7c3aed' },
  fcfCfo: { id: 'person-elena-ford', name: 'Elena Ford', title: 'Chief Financial Officer', initials: 'EF', avatarColor: '#6d28d9', clientName: 'First Capital Financial' },
};

const archetypeLabelMap: Record<ArchetypeKey, string> = {
  strategic_transformation: 'Strategic Transformation',
  workflow_automation: 'Workflow Automation',
  platform_modernization: 'Platform Modernization',
  ai_product_enablement: 'AI Product Enablement',
  operational_optimization: 'Operational Optimization',
};

const MODULE_NAMES: Record<string, string> = {
  'problem-framing': 'Problem Framing',
  'stakeholder-map': 'Stakeholder Map',
  'success-criteria': 'Success Criteria Definition',
  'baseline-data-request': 'Baseline Data Request',
  'diagnostic-instrument': 'Diagnostic Instrument',
  'data-analysis-findings': 'Data Analysis + Findings',
  'contradiction-surface': 'Contradiction Surface',
  'cxo-interview': 'CXO Interview Prep + Capture',
  'solution-library-match': 'Solution Library Match',
  'vendor-tech-evaluation': 'Vendor/Tech Evaluation',
  'tradeoff-matrix': 'Tradeoff Matrix + Recommendation',
  'business-case-roi': 'Business Case + ROI',
  'implementation-plan': 'Implementation Plan',
  'build-integration-tracking': 'Build + Integration Tracking',
  'change-management-plan': 'Change Management Plan',
  'outcome-measurement': 'Outcome Measurement',
  'benefits-realization': 'Benefits Realization + Genome Feedback',
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function phaseState(
  canonicalPhase: number,
  name: string,
  state: ProgramFullState['phases'][number]['state'],
  summary: string,
  gateType: ProgramFullState['phases'][number]['gateType'],
): ProgramFullState['phases'][number] {
  return { canonicalPhase, name, state, summary, gateType };
}

function makeDeliverable(
  id: string,
  title: string,
  moduleKey: string,
  version: number,
  owner: PersonRef,
  summary: string,
  status: ProgramFullState['deliverables'][number]['status'],
): ProgramFullState['deliverables'][number] {
  return { id, title, moduleKey, version, owner, summary, status, updatedAt: hoursAgo(version * 7) };
}

const patterns: PatternLibraryItem[] = [
  {
    key: 'contact-center-ai',
    name: 'Contact Center AI Transformation',
    archetype: 'operational_optimization',
    promotionState: 'mature',
    summary: 'Retail contact-center transformation pattern spanning agent assist, workforce redesign, and service metrics governance.',
    typicalDurationMonths: 6,
    deploymentCount: 18,
    preloadDepthPct: 66,
  },
  {
    key: 'unified-customer-data-platform',
    name: 'Unified Customer Data Platform',
    archetype: 'platform_modernization',
    promotionState: 'proven',
    summary: 'Retail CDP pattern for unifying store, ecommerce, loyalty, CRM, media, service, and product data into a single customer view.',
    typicalDurationMonths: 5,
    deploymentCount: 12,
    preloadDepthPct: 63,
  },
  {
    key: 'store-associate-productivity',
    name: 'Store Associate Productivity',
    archetype: 'ai_product_enablement',
    promotionState: 'candidate',
    summary: 'Custom store-associate productivity shape focused on AI-assisted frontline workflows across 40K associates.',
    typicalDurationMonths: 4,
    deploymentCount: 3,
    preloadDepthPct: 49,
  },
  {
    key: 'demand-forecasting-ai',
    name: 'Demand Forecasting AI',
    archetype: 'ai_product_enablement',
    promotionState: 'proven',
    summary: 'Retail forecasting pattern linking demand accuracy, inventory turns, and same-store sales outcomes.',
    typicalDurationMonths: 4,
    deploymentCount: 15,
    preloadDepthPct: 61,
  },
];

const cdpStakeholders = [
  { id: 'st-dana', name: 'Dana Mercer', role: 'VP Store Ops', x: 76, y: 28, quadrant: 'manage_closely' as const },
  { id: 'st-arjun', name: 'Arjun Patel', role: 'CIO', x: 82, y: 42, quadrant: 'manage_closely' as const },
  { id: 'st-elena', name: 'Elena Cruz', role: 'CMO', x: 68, y: 18, quadrant: 'keep_satisfied' as const },
  { id: 'st-marcus', name: 'Marcus Hale', role: 'Head of Digital', x: 72, y: 55, quadrant: 'manage_closely' as const },
  { id: 'st-alex', name: 'Alex Kim', role: 'Program Lead', x: 58, y: 60, quadrant: 'keep_informed' as const },
  { id: 'st-tori', name: 'Tori Nguyen', role: 'VP Merchandising Analytics', x: 54, y: 32, quadrant: 'keep_satisfied' as const },
  { id: 'st-sofia', name: 'Sofia Ramirez', role: 'Data Platform Director', x: 44, y: 64, quadrant: 'keep_informed' as const },
  { id: 'st-maya', name: 'Maya Brooks', role: 'Store Experience Lead', x: 30, y: 48, quadrant: 'monitor' as const },
];

const charterModules: ModuleState[] = [
  { moduleKey: 'problem-framing', name: MODULE_NAMES['problem-framing'], phase: 2, status: 'signed_off', currentVersion: 2, lastEditedBy: PEOPLE.alex, lastEditedAt: daysAgo(2), deliverableIds: ['deliv-cdp-problem'] },
  { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.alex, lastEditedAt: hoursAgo(6), nexusDraftPending: true, deliverableIds: ['deliv-cdp-stakeholder'] },
  { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'], phase: 2, status: 'in_progress', currentVersion: 1, lastEditedBy: PEOPLE.tori, lastEditedAt: hoursAgo(14), deliverableIds: ['deliv-cdp-success'] },
  { moduleKey: 'baseline-data-request', name: MODULE_NAMES['baseline-data-request'], phase: 2, status: 'blocked', blockerReason: 'Salesforce Commerce and store POS extracts still need schema mapping into the Snowflake landing zone.', lastEditedBy: PEOPLE.sofia, lastEditedAt: hoursAgo(18), deliverableIds: ['deliv-cdp-baseline'] },
];

const cdpContent: Record<string, ModuleContent> = {
  'problem-framing': {
    summary: 'Pattern-preloaded framing for unifying customer data across Apex channels into one governed view.',
    structuredDocument: {
      program_name: 'Unified Customer Data Platform',
      archetype: 'Platform Modernization',
      sponsor: {
        name: 'Arjun Patel',
        role: 'Chief Information Officer',
        organization: 'Apex Retail Group',
      },
      business_context: {
        forcing_event: 'Holiday planning and retail-media reforecasting both require a single customer view before Q4 launch sequencing locks.',
        business_pain: 'Customer identity, behavior, and activation data live across seven systems, so store, ecommerce, and marketing teams cannot trust a shared audience definition.',
        sponsor_pressure: 'Arjun needs a governed answer that reads as commercial enablement rather than another infrastructure spend request.',
      },
      scope: {
        in_scope: [
          'Shopify orders and customer events',
          'Salesforce Commerce profiles',
          'Store POS basket data',
          'CRM and loyalty identity stitching',
          'Snowflake landing-zone governance',
        ],
        out_of_scope: [
          'New martech procurement before Phase 3',
          'Store labor workflow redesign',
          'Media buying process changes outside the customer-data dependency chain',
        ],
      },
      phase_1_entry_commitments: {
        diagnostic_workstreams: [
          'Identity and profile unification baseline',
          'Source-to-target data contract readiness',
          'Activation use-case value proof for store and digital sponsors',
        ],
        first_milestone: 'Within 10 business days, reconcile Salesforce Commerce and store POS keys into a sponsor-approved baseline request.',
      },
      decision_rights: {
        sponsor_decisions: [
          'Source-owner assignments',
          'Phase 3 entry approval',
          'Escalation if baseline alignment slips',
        ],
        maestro_decisions: [
          'Evidence standard for Diagnose',
          'Pattern preload quality bar',
          'Cross-functional sequencing recommendations',
        ],
      },
    },
    formFields: [
      { label: 'Core problem', value: 'Customer identity and behavior data live in seven disconnected systems, slowing personalization and store-to-digital coordination.' },
      { label: 'Why now', value: 'Apex wants one customer view before holiday planning and paid-media reforecasting lock.' },
      { label: 'Target state', value: 'A governed Snowflake-based customer view powering store, ecommerce, CRM, and marketing decisions.' },
    ],
  },
  'stakeholder-map': {
    summary: 'Eight retail stakeholders pre-populated across store ops, digital, marketing, data, and merchandising.',
    structuredDocument: {
      stakeholders: [
        {
          name: 'Arjun Patel',
          role: 'Chief Information Officer',
          relationship_to_program: 'sponsor',
          commitment_status: 'committed',
          what_we_need: 'Approve source-owner assignments and the Snowflake landing-zone decision path.',
          approach: 'Keep the case commercial: one trusted customer record tied to retail outcomes, not an infrastructure refresh.',
        },
        {
          name: 'Elena Cruz',
          role: 'Chief Marketing Officer',
          relationship_to_program: 'co_sponsor',
          commitment_status: 'engaged',
          what_we_need: 'Confirm activation use cases and the first audience segments that justify the business case.',
          approach: 'Frame this as faster retail-media and lifecycle activation, not a delay to campaign execution.',
        },
        {
          name: 'Dana Mercer',
          role: 'VP Store Ops',
          relationship_to_program: 'decision_influencer',
          commitment_status: 'aware',
          what_we_need: 'Validate store-side use cases and confirm the in-store data quality bar.',
          approach: 'Lead with how a shared customer view reduces store-to-digital friction and improves basket conversion.',
        },
        {
          name: 'Sofia Ramirez',
          role: 'Data Platform Director',
          relationship_to_program: 'data_owner',
          commitment_status: 'engaged',
          what_we_need: 'Own schema alignment and landing-zone readiness across Salesforce Commerce and store POS.',
          approach: 'Treat her as the technical pacing item and keep sponsor air cover close.',
        },
      ],
      org_graph_view: {
        reporting_lines: [
          'Elena Cruz and Arjun Patel both report into the enterprise steering group for holiday readiness.',
          'Sofia Ramirez owns the Snowflake landing-zone workstream.',
          'Dana Mercer governs store-side operational adoption and trust.',
        ],
        influence_network: [
          'Marketing will accelerate adoption if activation use cases stay first-class.',
          'Store ops becomes resistant if identity quality looks like a marketing-only initiative.',
        ],
      },
    },
    formFields: [
      { label: 'Decision owner', value: 'Arjun Patel confirms architecture and sponsor sequencing with Elena Cruz and Dana Mercer.' },
      { label: 'Cross-functional tension', value: 'Marketing wants speed, store ops wants trust in the in-store view, and digital wants identity resolution before Q4 launches.' },
      { label: 'Escalation trigger', value: 'Any source-system onboarding slip beyond five business days triggers sponsor review.' },
    ],
    stakeholders: cdpStakeholders,
  },
  'success-criteria': {
    summary: 'Retail success criteria combine customer, commerce, and inventory metrics so the CDP case stays commercial rather than technical.',
    tracker: [
      { label: 'Customer profile match rate', baseline: '61%', target: '87%', current: 'Pending baseline', trend: 'Waiting on pull' },
      { label: 'Same-store sales lift from segmentation', baseline: '0.0%', target: '+1.5%', current: 'Modeled at +1.1%', trend: 'Positive' },
      { label: 'Conversion rate from personalized journeys', baseline: '2.7%', target: '3.4%', current: '3.1% modeled', trend: 'Up' },
      { label: 'Inventory turns on promoted categories', baseline: '6.8x', target: '7.6x', current: 'Pending', trend: 'Waiting on pull' },
    ],
  },
  'baseline-data-request': {
    summary: 'Blocked baseline request centered on channel data consolidation across Shopify, Salesforce Commerce, loyalty, service, media, POS, and product systems.',
    structuredDocument: {
      requests: [
        {
          data_needed: 'Salesforce Commerce profile extract',
          granularity: 'Customer-level, trailing 12 months',
          requested_from: 'Sofia Ramirez',
          status: 'blocked',
          purpose: 'Identity stitching baseline for Diagnose entry',
          access_strategy: 'Resolve source-key mapping before requesting the full export',
        },
        {
          data_needed: 'Store POS basket logs',
          granularity: 'Transaction-level, 12 months trailing',
          requested_from: 'Dana Mercer',
          status: 'requested',
          purpose: 'Tie customer identity to basket and store-behavior outcomes',
          access_strategy: 'Route through store-ops analytics to avoid reads as a platform-only ask',
        },
        {
          data_needed: 'Loyalty ID crosswalk',
          granularity: 'Member-level identity graph',
          requested_from: 'Elena Cruz',
          status: 'approved',
          purpose: 'Match digital activation audiences to in-store profiles',
          access_strategy: 'Position as the minimum viable identity spine for Q4 activation',
        },
      ],
      access_governance: {
        who_can_see_raw_data: ['Arjun Patel', 'Sofia Ramirez', 'AbarVa Maestro'],
        who_can_see_analysis: ['Dana Mercer', 'Elena Cruz', 'Alex Kim'],
        data_retention_policy: 'Program duration plus 90 days, with pattern learnings retained only in aggregated form.',
      },
    },
    formFields: [
      { label: 'Requested datasets', value: 'Shopify orders, Salesforce Commerce profiles, store POS basket logs, loyalty IDs, CRM audiences, call-center interactions, product master mappings.' },
      { label: 'Target landing zone', value: 'Snowflake unified customer layer with identity stitching and source-level traceability.' },
      { label: 'Current blocker', value: 'Salesforce Commerce and in-store POS keys are not yet aligned to the shared customer ID strategy.' },
    ],
  },
};

const associateContent: Record<string, ModuleContent> = {
  'stakeholder-map': {
    summary: 'Custom-shape stakeholder map built around store operations, field enablement, and frontline technology adoption.',
    formFields: [
      { label: 'Decision owner', value: 'Dana Mercer signs off on charter scope and associate workflow priorities.' },
      { label: 'Pilot scope', value: '40K store associates across curbside, replenishment, customer service, and tasking workflows.' },
    ],
    stakeholders: [
      { id: 'sa-dana', name: 'Dana Mercer', role: 'VP Store Ops', x: 80, y: 20, quadrant: 'manage_closely' },
      { id: 'sa-maya', name: 'Maya Brooks', role: 'Store Experience Lead', x: 74, y: 48, quadrant: 'manage_closely' },
      { id: 'sa-marcus', name: 'Marcus Hale', role: 'Head of Digital', x: 58, y: 36, quadrant: 'keep_satisfied' },
      { id: 'sa-arjun', name: 'Arjun Patel', role: 'CIO', x: 66, y: 58, quadrant: 'keep_satisfied' },
      { id: 'sa-alex', name: 'Alex Kim', role: 'Program Lead', x: 48, y: 62, quadrant: 'keep_informed' },
      { id: 'sa-field', name: 'Field Operations Council', role: 'Regional leads', x: 38, y: 46, quadrant: 'keep_informed' },
    ],
  },
  'success-criteria': {
    summary: 'Success measures tie AI-assisted store workflows to labor efficiency, conversion, and basket outcomes.',
    tracker: [
      { label: 'Associate task minutes / shift', baseline: '92 min', target: '68 min', current: '76 min modeled', trend: 'Improving' },
      { label: 'Conversion rate in assisted journeys', baseline: '24.1%', target: '26.3%', current: '25.5% modeled', trend: 'Up' },
      { label: 'Basket size in assisted upsell moments', baseline: '$42.10', target: '$46.00', current: '$44.90 modeled', trend: 'Up' },
    ],
  },
  'tradeoff-matrix': {
    summary: 'Custom-shape options compare the fastest frontline AI workflow entry points across store labor and customer value.',
    matrix: {
      criteria: ['Labor reduction', 'Associate adoption', 'Customer impact', 'Implementation complexity', 'Strategic fit'],
      options: [
        { name: 'Tasking copilot', scores: [4, 5, 3, 3, 4], rationale: 'Fastest path to broad frontline adoption and measurable productivity.' },
        { name: 'Clienteling copilot', scores: [3, 4, 5, 4, 5], rationale: 'Higher upside on conversion and basket size, slower rollout motion.' },
        { name: 'Hybrid store-assist stack', scores: [5, 4, 5, 5, 5], rationale: 'Best long-term fit, but requires stronger sequencing and change-management support.' },
      ],
    },
  },
  'business-case-roi': {
    summary: 'Narrative business case framing AI-assisted store workflows for a 40K-associate footprint.',
    narrativeBlocks: [
      { title: 'Investment thesis', body: 'Apex can unlock labor capacity and customer value by moving repetitive store workflows into AI-assisted execution rather than adding incremental labor.' },
      { title: 'Return profile', body: 'The hybrid rollout path yields the strongest upside if change-management readiness is staged region by region.' },
    ],
  },
};

const executeMilestones: Milestone[] = [
  { id: 'm1', name: 'Agent-assist operating model locked', owner: PEOPLE.alex, status: 'done', plannedWindow: 'Apr 1 - Apr 9', actualWindow: 'Apr 1 - Apr 8', progressLabel: 'Signed off', evidenceCount: 4 },
  { id: 'm2', name: 'Salesforce Commerce + service integration wave', owner: PEOPLE.sofia, status: 'in_progress', plannedWindow: 'Apr 10 - Apr 24', progressLabel: '64% complete', evidenceCount: 5 },
  { id: 'm3', name: 'NVIDIA AI Enterprise tuning sprint', owner: PEOPLE.marcus, status: 'at_risk', plannedWindow: 'Apr 18 - May 2', progressLabel: '+1 week drift', evidenceCount: 2 },
  { id: 'm4', name: 'Cost takeout attribution audit', owner: PEOPLE.tori, status: 'not_started', plannedWindow: 'May 1 - May 8', progressLabel: 'Queued', evidenceCount: 0 },
];

const executeContent: Record<string, ModuleContent> = {
  'implementation-plan': {
    summary: 'Signed-off execution plan with owners, dependencies, and review cadence for the current service transformation wave.',
    structuredDocument: {
      program_plan: {
        workstreams: [
          { name: 'Platform integration', owner: 'Sofia Ramirez', status: 'in_progress', target_date: 'Apr 24' },
          { name: 'Agent-assist tuning', owner: 'Marcus Hale', status: 'at_risk', target_date: 'May 2' },
          { name: 'Enablement + supervisor readiness', owner: 'Maya Brooks', status: 'in_progress', target_date: 'Apr 29' },
        ],
        dependencies: [
          'Model evaluation signoff before production tuning',
          'Supervisor enablement before Wave 2 launch',
          'Attribution workbook before Verify pack assembly',
        ],
        thirty_day_target: 'Recover the one-week tuning slip while preserving CSAT and completing the evidence pack for sponsor review.',
      },
    },
  },
  'build-integration-tracking': {
    summary: 'Execution tracker tying milestones, assignees, savings, and evidence to the retail transformation plan.',
    structuredDocument: {
      program_plan: {
        thirty_day_target: 'Clear the tuning blocker, complete Wave 2 readiness, and lock the sponsor evidence pack for the next operating review.',
        milestones: [
          { name: 'Agent-assist operating model locked', owner: 'Alex Kim', date: 'Apr 8', status: 'complete' },
          { name: 'Commerce + service integration wave', owner: 'Sofia Ramirez', date: 'Apr 24', status: 'in_progress' },
          { name: 'NVIDIA tuning sprint', owner: 'Marcus Hale', date: 'May 2', status: 'at_risk' },
        ],
        dependencies: [
          'Model evaluation signoff before Wave 2 tuning',
          'Supervisor enablement pack before rollout expansion',
          'Attribution evidence before Verify handoff',
        ],
      },
      commitment_tracker: [
        {
          commitment: 'Publish sponsor report each Sunday',
          owner: 'Alex Kim',
          status: 'in_progress',
          latest_note: 'Draft is ready; waiting on final attribution line items.',
        },
        {
          commitment: 'Resolve tuning signoff path',
          owner: 'Marcus Hale',
          status: 'blocked',
          latest_note: 'Evaluation signoff remains the pacing constraint.',
        },
      ],
      early_warning_dashboard: [
        { signal: 'Model tuning drift', severity: 'high', owner: 'Marcus Hale', mitigation: 'Escalate signoff and split safe production phases.' },
        { signal: 'Supervisor readiness lag', severity: 'medium', owner: 'Maya Brooks', mitigation: 'Collapse enablement into two field-ready packs.' },
      ],
    },
    tracker: [
      { label: 'Milestones complete', baseline: '0', target: '6', current: '3', trend: 'On pace' },
      { label: 'Tracked cost reduction', baseline: '0%', target: '30%', current: '18% tracked', trend: 'Positive' },
      { label: 'CSAT uplift', baseline: '0 pt', target: '+7 pt', current: '+4.2 pt', trend: 'Up' },
    ],
  },
  'change-management-plan': {
    summary: 'Change-management sequencing is the strongest risk signal in the Execute view.',
    structuredDocument: {
      operating_review_rhythm: {
        cadence: 'Weekly sponsor review, twice-weekly execution standup, daily integration huddle.',
        decisions: [
          'Escalate blocker after 48h unresolved',
          'Freeze rollout changes 24h before sponsor review',
          'Attach new evidence before any benefits claim enters the report',
        ],
      },
      intervention_status_report: {
        intervention: 'Retail contact-center AI rollout',
        status: 'Active with one material blocker',
        accomplishments: [
          'Integration wave is 64% complete',
          'Three execution milestones have evidence attached',
          'CSAT uplift remains positive while cost takeout tracks',
        ],
        next_risks: [
          'Supervisor readiness must catch up before Wave 2',
          'Tuning signoff cannot drift another week without sponsor involvement',
        ],
      },
    },
    formFields: [
      { label: 'Store rollout cadence', value: 'Wave-based launch with digital service pods before full retail-service coverage.' },
      { label: 'Enablement motion', value: 'Manager briefings, agent coaching, and escalation playbooks are staged weekly.' },
      { label: 'Current gap', value: 'Supervisor readiness content is one review cycle behind the integration wave.' },
    ],
  },
};

const verifyContent: Record<string, ModuleContent> = {
  'outcome-measurement': {
    summary: 'Signed-off historical outcome dashboard linking forecasting accuracy to retail operating outcomes.',
    structuredDocument: {
      outcome_baseline_report: {
        attestor: 'Arjun Patel',
        baseline_metrics: [
          { metric: 'Forecast accuracy', baseline: '68%', actual: '85%', target: '82%' },
          { metric: 'Inventory turns', baseline: '6.4x', actual: '7.3x', target: '7.1x' },
          { metric: 'Same-store sales', baseline: '0.6%', actual: '1.7%', target: '1.4%' },
        ],
        measurement_window: 'Holiday planning through end-of-season closeout',
      },
      outcome_measurement_report: {
        attestation_bar: 'All three Verify thresholds must exceed target with signed evidence in the archive.',
        verified_savings: '$5.9M equivalent operating value from turns, markdown reduction, and sales lift',
        residual_questions: ['Sustain planner override discipline as category ownership rotates.'],
      },
    },
    tracker: [
      { label: 'Forecast accuracy', baseline: '68%', target: '82%', current: '85%', trend: 'Ahead' },
      { label: 'Inventory turns', baseline: '6.4x', target: '7.1x', current: '7.3x', trend: 'Ahead' },
      { label: 'Same-store sales', baseline: '0.6%', target: '1.4%', current: '1.7%', trend: 'Ahead' },
    ],
  },
  'benefits-realization': {
    summary: 'Historical texture program with signed-off outcomes and pattern feedback already captured.',
    structuredDocument: {
      learning_memo: {
        what_worked: [
          'Planner override review cadence stayed tied to commercial outcomes.',
          'Snowflake demand-feature template shortened data-to-model iteration.',
        ],
        what_we_would_do_differently: [
          'Pull supplier volatility signals earlier into the baseline.',
          'Promote the override exception playbook sooner for regional planners.',
        ],
      },
      genome_contribution_package: {
        promoted_patterns: [
          'Planner override review cadence',
          'Demand-feature template for seasonal forecasting',
        ],
        evidence_ledger: [
          'Signed sponsor attestation memo',
          'Inventory-turns dashboard export',
          'Same-store sales closeout pack',
        ],
      },
    },
    narrativeBlocks: [
      { title: 'Outcome attestation', body: 'Apex signed off that forecast accuracy, turns, and same-store sales all exceeded the agreed Verify thresholds.' },
      { title: 'Benefits realized', body: 'The program reduced markdown pressure, lifted in-stock reliability, and improved planner confidence in seasonal buys.' },
      { title: 'Genome feedback', body: 'Promote the planner override review cadence and Snowflake demand-feature template into the forecasting pattern preload.' },
    ],
  },
};

const executeData: ProgramFullState['executeData'] = {
  programId: 'contact-center-ai-transformation',
  activeTab: 'work',
  viewerRole: 'lead',
  milestones: executeMilestones,
  workItems: [
    { id: 'w1', title: 'Validate NVIDIA AI Enterprise tuning plan', milestoneId: 'm3', assignee: PEOPLE.marcus, status: 'blocked', dueLabel: 'Overdue by 3 days', dependency: 'Model evaluation signoff', nexusDrafted: false },
    { id: 'w2', title: 'Attach CSAT evidence to service-pod rollout', milestoneId: 'm4', assignee: PEOPLE.tori, status: 'in_progress', dueLabel: 'Due tomorrow', nexusDrafted: true },
    { id: 'w3', title: 'Finalize supervisor enablement pack', milestoneId: 'm2', assignee: PEOPLE.maya, status: 'done', dueLabel: 'Completed yesterday', nexusDrafted: false },
    { id: 'w4', title: 'Publish weekly sponsor report', milestoneId: 'm4', assignee: PEOPLE.alex, status: 'in_progress', dueLabel: 'Sunday draft', nexusDrafted: true },
    { id: 'w5', title: 'Reconcile Shopify service-event feed', milestoneId: 'm2', assignee: PEOPLE.sofia, status: 'done', dueLabel: 'Closed 2 days ago', nexusDrafted: false },
    { id: 'w6', title: 'Confirm cost takeout attribution baseline', milestoneId: 'm4', assignee: PEOPLE.tori, status: 'not_started', dueLabel: 'Due in 4 days', nexusDrafted: true },
  ],
  risks: [
    { id: 'r1', severity: 'critical', title: 'Model tuning sprint is stalled pending evaluation signoff', owner: PEOPLE.marcus, mitigation: 'Escalate the signoff path and split the tuning sprint into production-safe phases.', status: 'open' },
    { id: 'r2', severity: 'medium', title: 'Supervisor readiness content is lagging the rollout wave', owner: PEOPLE.maya, mitigation: 'Compress enablement content into two supervisor playbooks and push manager office hours.', status: 'watching' },
    { id: 'r3', severity: 'low', title: 'Shopify service-event feed lag resolved but retrospective pending', owner: PEOPLE.sofia, mitigation: 'Document the incident and add it to pattern failure modes.', status: 'resolved' },
  ],
  evidence: [
    { id: 'e1', title: 'Service pod cutover checklist', kind: 'report', relatedTo: 'm2', summary: 'Signed cutover checklist with digital service and call-center leadership initials.' },
    { id: 'e2', title: 'Cost takeout workbook', kind: 'metric', relatedTo: 'm4', summary: 'Tracked 18% cost reduction against the 30% target with line-item attribution.' },
    { id: 'e3', title: 'Agent productivity trend export', kind: 'log', relatedTo: 'm3', summary: 'Shows average handle time down 11% and productivity uplift in tuned cohorts.' },
    { id: 'e4', title: 'CSAT steering notes', kind: 'approval', relatedTo: 'm2', summary: 'Sponsor-approved sequencing for service rollout and customer comms.' },
  ],
  reports: [
    { id: 'rep-1', title: 'Week 16 sponsor readout', audience: 'sponsor', summary: 'Cost reduction is tracking, CSAT is lifting, and model tuning is the active blocker.', draftedBy: 'nexus', publishedAt: hoursAgo(30) },
    { id: 'rep-2', title: 'Execution checkpoint brief', audience: 'lead', summary: 'NVIDIA tuning drifted by one week while integration work stayed on plan.', draftedBy: 'lead', publishedAt: hoursAgo(42) },
  ],
};

const programs: ProgramFullState[] = [
  {
    id: 'contact-center-ai-transformation',
    name: 'Contact Center AI Transformation',
    clientName: 'Apex Retail Group',
    archetype: 'operational_optimization',
    currentPhase: 5,
    shape: 'pattern',
    patternKey: 'contact-center-ai',
    patternName: 'Contact Center AI Transformation',
    charter: {
      headline: 'Scale AI-assisted retail service operations across contact-center and digital support journeys.',
      bullets: [
        'Drive 30% cost reduction while lifting CSAT and agent productivity.',
        'Sequence Salesforce Commerce, service, and model-tuning work without eroding customer experience.',
        'Capture evidence in Execute so Verify can attest benefits cleanly.',
      ],
      sponsorDecision: 'Confirm whether the NVIDIA tuning slip should escalate into the weekly sponsor steering thread.',
      baselineNeed: 'Cost takeout attribution and CSAT evidence are still active dependencies in Execute.',
    },
    phases: [
      phaseState(1, 'Origination', 'complete', 'Pattern selected with retail service transformation preload.', 'none'),
      phaseState(2, 'Charter', 'complete', 'Scope and service metrics locked.', 'hard'),
      phaseState(3, 'Diagnose', 'complete', 'Findings and CXO interview captured.', 'hard'),
      phaseState(4, 'Design', 'complete', 'Recommendation and business case approved.', 'hard'),
      phaseState(5, 'Execute', 'active', 'Execution tracking, risks, and evidence are live.', 'soft'),
      phaseState(6, 'Verify', 'locked', 'Verification opens when the evidence pack clears.', 'hard'),
    ],
    modules: [
      { moduleKey: 'implementation-plan', name: MODULE_NAMES['implementation-plan'], phase: 5, status: 'signed_off', currentVersion: 2, lastEditedBy: PEOPLE.alex, lastEditedAt: daysAgo(5) },
      { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'], phase: 5, status: 'in_progress', currentVersion: 3, lastEditedBy: PEOPLE.alex, lastEditedAt: hoursAgo(5), deliverableIds: ['deliv-ccai-report'] },
      { moduleKey: 'change-management-plan', name: MODULE_NAMES['change-management-plan'], phase: 5, status: 'blocked', blockerReason: 'Supervisor readiness content is lagging the rollout wave.', lastEditedBy: PEOPLE.maya, lastEditedAt: hoursAgo(7) },
    ],
    team: [
      { ...PEOPLE.dana, role: 'sponsor', workstream: 'Store and service sponsor', activitySummary: 'Reads weekly reports and approves escalations', notificationState: 'priority' },
      { ...PEOPLE.alex, role: 'lead', workstream: 'Execution lead', activitySummary: 'Owns milestone progression and sponsor reporting', notificationState: 'all' },
      { ...PEOPLE.marcus, role: 'team_member', workstream: 'Digital experience', activitySummary: 'Owns agent-assist tuning and digital service rollout', notificationState: 'all' },
      { ...PEOPLE.sofia, role: 'team_member', workstream: 'Platform integration', activitySummary: 'Owns Salesforce Commerce, Shopify, and Snowflake integration work', notificationState: 'priority' },
      { ...PEOPLE.tori, role: 'team_member', workstream: 'Attribution + analytics', activitySummary: 'Owns cost takeout evidence and KPI tracking', notificationState: 'all' },
    ],
    activity: [
      { id: 'act-cc1', type: 'risk', title: 'NVIDIA tuning sprint blocked', detail: 'Model evaluation signoff is holding the tuning wave open.', at: hoursAgo(8), actor: PEOPLE.marcus },
      { id: 'act-cc2', type: 'milestone', title: 'Integration wave at 64%', detail: 'Salesforce Commerce and service integration are tracking with one blocker.', at: hoursAgo(11), actor: PEOPLE.sofia },
      { id: 'act-cc3', type: 'deliverable', title: 'Weekly report drafted', detail: 'Nexus drafted the Sunday sponsor report for Alex to edit.', at: hoursAgo(20), actor: PEOPLE.alex },
    ],
    sponsorPerson: PEOPLE.dana,
    leadPerson: PEOPLE.alex,
    phaseStatus: 'blocked',
    gateSummary: 'Execute remains active, but the tuning-sprint blocker must clear before Wave 2 agent rollout starts.',
    gateStatus: 'blocked',
    deliverables: [
      makeDeliverable('deliv-ccai-report', 'Week 16 Sponsor Report', 'build-integration-tracking', 3, PEOPLE.alex, 'Sponsor-facing status report with cost reduction, CSAT, productivity, and risk signals.', 'in_review'),
      makeDeliverable('deliv-ccai-plan', 'Execution Program Plan', 'implementation-plan', 2, PEOPLE.alex, 'Locked execution sequence, owners, and milestone pacing for the retail service rollout.', 'signed_off'),
      makeDeliverable('deliv-ccai-change', 'Operating Review Rhythm', 'change-management-plan', 1, PEOPLE.maya, 'Change-management cadence and intervention status for the current execute wave.', 'draft'),
    ],
    metrics: [
      { label: 'Cost reduction tracked', value: '18%', tone: 'teal' },
      { label: 'Target', value: '30%', tone: 'default' },
      { label: 'CSAT uplift', value: '+4.2 pt', tone: 'teal' },
      { label: 'Drift', value: '+1 week', tone: 'amber' },
    ],
    sponsorDashboard: {
      openDecisions: ['Escalate the model-tuning blocker into the sponsor steering thread.', 'Confirm whether Wave 2 should hold until supervisor readiness content catches up.'],
      milestones: ['Three milestones complete.', 'Integration wave is 64% complete with evidence attached.'],
      keyFindings: ['Cost reduction and productivity are trending positively.', 'Change-management drift is the strongest current risk signal.'],
      outcomeSignal: 'If the tuning blocker clears this week, the program can still recover most of the one-week slip.',
    },
    nexusPanel: {
      programId: 'contact-center-ai-transformation',
      mode: 'collapsed',
      activeTab: 'flags',
      thread: {
        id: 'program-thread-ccai',
        title: 'Contact center execute thread',
        turns: [
          { id: 'turn-ccai-1', speaker: 'lead', text: 'Summarize the sponsor-facing risk picture in one paragraph.' },
          { id: 'turn-ccai-2', speaker: 'nexus', text: 'Cost reduction and CSAT are tracking, but the NVIDIA tuning slip is now the pacing item for Wave 2 deployment.' },
        ],
      },
      drafts: [
        { id: 'draft-ccai-1', title: 'Week 16 status report', moduleKey: 'build-integration-tracking', status: 'ready', summary: 'Sunday sponsor report drafted with retail-service language and evidence links.' },
        { id: 'draft-ccai-2', title: 'Cost takeout attribution memo', moduleKey: 'build-integration-tracking', status: 'needs_context', summary: 'Waiting on final attribution evidence before lock.' },
      ],
      flags: [
        { id: 'flag-ccai-1', severity: 'high', title: 'NVIDIA tuning drift', detail: 'Model evaluation signoff is now the pacing blocker on the execute surface.' },
        { id: 'flag-ccai-2', severity: 'high', title: 'Pattern drift on enablement', detail: 'Supervisor readiness content is falling behind the mature contact-center pattern.' },
        { id: 'flag-ccai-3', severity: 'medium', title: 'Attribution evidence still incomplete', detail: 'The Verify-phase cost attestation is not yet fully supported.' },
      ],
      sources: [
        { id: 'source-ccai-1', label: 'Contact Center AI Transformation pattern', sourceType: 'pattern', detail: '18 deployments with a mature retail-service playbook.' },
        { id: 'source-ccai-2', label: 'Apex service KPI workbook', sourceType: 'l2', detail: 'CSAT, handle-time, cost, and productivity metrics updated yesterday.' },
        { id: 'source-ccai-3', label: 'Design recommendation memo', sourceType: 'l3', detail: 'Recommendation tied cost reduction to AI-assist adoption and tuned routing.' },
      ],
    },
    moduleContent: executeContent,
    executeData,
  },
  {
    id: 'unified-customer-data-platform',
    name: 'Unified Customer Data Platform',
    clientName: 'Apex Retail Group',
    archetype: 'platform_modernization',
    currentPhase: 2,
    shape: 'pattern',
    patternKey: 'unified-customer-data-platform',
    patternName: 'Unified Customer Data Platform',
    charter: {
      headline: 'Unify seven customer data sources into a single governed customer view across stores, ecommerce, and marketing.',
      bullets: [
        'Consolidate seven customer data sources into one customer profile and activation layer.',
        'Tie the case to same-store sales, conversion rate, basket size, and inventory turns rather than platform activity alone.',
        'Hard-gate Diagnose on a clean baseline request and stakeholder alignment across store ops, digital, marketing, and IT.',
      ],
      sponsorDecision: 'Approve the Charter package and confirm the source-onboarding owners for the Snowflake landing zone.',
      baselineNeed: 'Salesforce Commerce and store POS extracts still need schema alignment into Snowflake.',
    },
    phases: [
      phaseState(1, 'Origination', 'complete', 'Problem framing locked and shape selected.', 'none'),
      phaseState(2, 'Charter', 'active', 'Stakeholder map and success criteria are actively being shaped.', 'hard'),
      phaseState(3, 'Diagnose', 'locked', 'Hard-gated on signed Charter and baseline request.', 'hard'),
      phaseState(4, 'Design', 'locked', 'Recommendation work opens after findings synthesis.', 'soft'),
      phaseState(5, 'Execute', 'locked', 'Execution unlocks after Design approval.', 'hard'),
      phaseState(6, 'Verify', 'locked', 'Verification follows implementation evidence.', 'hard'),
    ],
    modules: charterModules,
    team: [
      { ...PEOPLE.arjun, role: 'sponsor', workstream: 'Technology sponsor', activitySummary: 'Decision owner for the Phase 2 hard gate', notificationState: 'priority' },
      { ...PEOPLE.alex, role: 'lead', workstream: 'Program orchestration', activitySummary: 'Driving charter completion and baseline unblock', notificationState: 'all' },
      { ...PEOPLE.elena, role: 'team_member', workstream: 'Marketing', activitySummary: 'Owns activation success-criteria refinement', notificationState: 'all' },
      { ...PEOPLE.sofia, role: 'team_member', workstream: 'Data + platform', activitySummary: 'Owns source onboarding and Snowflake landing-zone setup', notificationState: 'priority' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Oversight', activitySummary: 'Watching pattern adherence and gate quality', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-cdp-1', type: 'approval', title: 'Charter signoff queued', detail: 'Arjun Patel has 14 hours left on the Charter SLA.', at: hoursAgo(10), actor: PEOPLE.alex },
      { id: 'act-cdp-2', type: 'risk', title: 'Source onboarding blocked', detail: 'Salesforce Commerce and store POS keys still need schema alignment.', at: hoursAgo(18), actor: PEOPLE.sofia },
      { id: 'act-cdp-3', type: 'nexus', title: 'Nexus preload refreshed', detail: 'Stakeholder map pulled retail org context and prior platform notes with provenance.', at: hoursAgo(22), actor: PEOPLE.alex },
    ],
    linkedIntelligenceThreads: [
      { id: 'thread-cdp-1', title: 'Customer data platform scope thread', source: 'intelligence', lastTouchedAt: daysAgo(3) },
      { id: 'thread-cdp-2', title: 'Retail benchmark comparison pack', source: 'intelligence', lastTouchedAt: daysAgo(6) },
    ],
    sponsorPerson: PEOPLE.arjun,
    leadPerson: PEOPLE.alex,
    phaseStatus: 'awaiting_gate',
    gateSummary: 'Diagnose remains locked until Charter is signed off and the customer-data baseline request lands.',
    gateStatus: 'pending',
    deliverables: [
      makeDeliverable('deliv-cdp-problem', 'Problem Framing Brief', 'problem-framing', 2, PEOPLE.alex, 'Signed-off framing for a unified customer view and activation layer.', 'signed_off'),
      makeDeliverable('deliv-cdp-stakeholder', 'Stakeholder Map', 'stakeholder-map', 1, PEOPLE.alex, 'Draft 2x2 influence-interest map covering store ops, digital, marketing, and data leaders.', 'draft'),
      makeDeliverable('deliv-cdp-success', 'Success Criteria Sheet', 'success-criteria', 1, PEOPLE.tori, 'Retail success criteria tied to sales, conversion, basket, and turns.', 'in_review'),
      makeDeliverable('deliv-cdp-baseline', 'Baseline Data Request Pack', 'baseline-data-request', 1, PEOPLE.sofia, 'Blocked request packet for Shopify, Salesforce Commerce, POS, loyalty, and CRM sources.', 'draft'),
    ],
    metrics: [
      { label: 'Active modules', value: '4', tone: 'teal' },
      { label: 'Gate SLA', value: '14h', tone: 'amber' },
      { label: 'Sources to unify', value: '7', tone: 'default' },
      { label: 'Baseline blockers', value: '1', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Approve the Charter package for Phase 3 entry.', 'Confirm source owners for the Snowflake landing zone.'],
      milestones: ['Problem Framing signed off.', 'Stakeholder map draft is ready for sponsor review.'],
      keyFindings: ['Retail success criteria are already 80% shaped.', 'Source onboarding is the only hard blocker to Diagnose.'],
      outcomeSignal: 'If the gate clears this week, Diagnose can start before holiday planning lock.',
    },
    nexusPanel: {
      programId: 'unified-customer-data-platform',
      mode: 'collapsed',
      activeTab: 'chat',
      thread: {
        id: 'program-thread-cdp',
        title: 'Unified customer data platform thread',
        turns: [
          { id: 'turn-cdp-1', speaker: 'lead', text: 'What still blocks the Charter hard gate?' },
          { id: 'turn-cdp-2', speaker: 'nexus', text: 'Sponsor signoff and source-key alignment for Salesforce Commerce and store POS remain outstanding.' },
        ],
      },
      drafts: [
        { id: 'draft-cdp-1', title: 'Stakeholder map draft', moduleKey: 'stakeholder-map', status: 'pending_review', summary: 'Pattern-preloaded retail stakeholder map with eight leaders and escalation rules.' },
      ],
      flags: [
        { id: 'flag-cdp-1', severity: 'medium', title: 'Baseline dependency gap', detail: 'Diagnose will slip if source-key mapping does not land within 48 hours.' },
        { id: 'flag-cdp-2', severity: 'low', title: 'Marketing activation owner still provisional', detail: 'CMO review needs to confirm activation sequencing for launch use cases.' },
      ],
      sources: [
        { id: 'source-cdp-1', label: 'Unified Customer Data Platform pattern v2', sourceType: 'pattern', detail: '12 deployments with 63% preload depth.' },
        { id: 'source-cdp-2', label: 'Apex retail org notes', sourceType: 'l2', detail: 'Store, marketing, digital, and IT context from recent operating reviews.' },
        { id: 'source-cdp-3', label: 'Origination thread summary', sourceType: 'l3', detail: 'Scoped from Intelligence thread and accepted in Path 1.' },
      ],
    },
    moduleContent: cdpContent,
  },
  {
    id: 'store-associate-productivity',
    name: 'Store Associate Productivity',
    clientName: 'Apex Retail Group',
    archetype: 'ai_product_enablement',
    currentPhase: 2,
    shape: 'custom',
    patternKey: 'store-associate-productivity',
    patternName: 'Store Associate Productivity',
    charter: {
      headline: 'Design AI-assisted workflows for 40K store associates across selling, tasking, and service moments.',
      bullets: [
        'Use a custom shape optimized for frontline AI workflow design rather than a standard platform pattern.',
        'Frame the program around associate productivity, conversion, and basket-size improvement.',
        'Keep Charter rigor while allowing a specialized module mix and pacing.',
      ],
      sponsorDecision: 'Agree the custom shape is the right fit before Diagnose patterns are added.',
      baselineNeed: 'Store labor baselines and regional workflow variance still need finance and field-ops confirmation.',
    },
    phases: [
      phaseState(1, 'Origination', 'complete', 'Custom store-associate shape selected at origination.', 'none'),
      phaseState(2, 'Charter', 'active', 'Executive charter and tradeoff framing underway.', 'hard'),
      phaseState(3, 'Diagnose', 'locked', 'Opens when sponsor confirms workforce and baseline assumptions.', 'hard'),
      phaseState(4, 'Design', 'locked', 'Custom tradeoff design opens after Diagnose.', 'soft'),
    ],
    modules: [
      { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'], phase: 2, status: 'in_review', currentVersion: 1, lastEditedBy: PEOPLE.alex, lastEditedAt: hoursAgo(9) },
      { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'], phase: 2, status: 'in_progress', currentVersion: 1, lastEditedBy: PEOPLE.maya, lastEditedAt: hoursAgo(16) },
      { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.maya, lastEditedAt: hoursAgo(22), nexusDraftPending: true },
      { moduleKey: 'business-case-roi', name: MODULE_NAMES['business-case-roi'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.alex, lastEditedAt: hoursAgo(26) },
    ],
    team: [
      { ...PEOPLE.dana, role: 'sponsor', workstream: 'Store ops sponsor', activitySummary: 'Preps executive decision package for a 40K-associate rollout', notificationState: 'priority' },
      { ...PEOPLE.alex, role: 'lead', workstream: 'Program orchestration', activitySummary: 'Owns custom-shape module sequencing', notificationState: 'all' },
      { ...PEOPLE.maya, role: 'team_member', workstream: 'Frontline design', activitySummary: 'Drafting associate workflow and enablement inputs', notificationState: 'all' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Custom pattern oversight', activitySummary: 'Reviewing whether this shape should become a candidate pattern', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-assoc-1', type: 'nexus', title: 'Custom shape quality flag', detail: 'Business case draft still needs sharper frontline economics language.', at: hoursAgo(8), actor: PEOPLE.lena },
      { id: 'act-assoc-2', type: 'deliverable', title: 'Tradeoff matrix draft created', detail: 'Nexus assembled a first-pass option matrix for associate productivity paths.', at: hoursAgo(15), actor: PEOPLE.maya },
    ],
    sponsorPerson: PEOPLE.dana,
    leadPerson: PEOPLE.alex,
    phaseStatus: 'active',
    gateSummary: 'Custom Charter work is moving, but sponsor review is still required before baselines lock.',
    gateStatus: 'pending',
    deliverables: [
      makeDeliverable('deliv-assoc-charter', 'Custom Charter Pack', 'stakeholder-map', 1, PEOPLE.alex, 'Custom-shape charter and stakeholder framing for the associate AI workflow case.', 'in_review'),
    ],
    metrics: [
      { label: 'Custom modules', value: '4', tone: 'teal' },
      { label: 'Frontline scope', value: '40K', tone: 'default' },
      { label: 'Quality flags', value: '1', tone: 'amber' },
      { label: 'Sponsor review', value: 'Pending', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Confirm the custom shape before Diagnose opens.', 'Decide whether frontline AI starts with tasking or clienteling workflows.'],
      milestones: ['Tradeoff matrix first pass complete.', 'Associate productivity success metrics are 60% shaped.'],
      keyFindings: ['The custom shape may become a candidate pattern after a second deployment.', 'Frontline adoption risk is the key design constraint.'],
      outcomeSignal: 'Fast sponsor feedback here keeps the regional pilot timing intact.',
    },
    nexusPanel: {
      programId: 'store-associate-productivity',
      mode: 'collapsed',
      activeTab: 'drafts',
      thread: {
        id: 'program-thread-associate',
        title: 'Store associate charter thread',
        turns: [
          { id: 'turn-assoc-1', speaker: 'lead', text: 'What is the sharpest sponsor choice to frame in the Charter?' },
          { id: 'turn-assoc-2', speaker: 'nexus', text: 'Decide whether Apex should start with AI-assisted tasking, clienteling, or a staged hybrid that balances adoption and revenue upside.' },
        ],
      },
      drafts: [
        { id: 'draft-assoc-1', title: 'Tradeoff matrix draft', moduleKey: 'tradeoff-matrix', status: 'pending_review', summary: 'Three frontline AI workflow paths with weighted criteria and rationale.' },
      ],
      flags: [
        { id: 'flag-assoc-1', severity: 'medium', title: 'Custom-shape quality flag', detail: 'Business case voice needs sharper frontline economics language before sponsor review.' },
      ],
      sources: [
        { id: 'source-assoc-1', label: 'Store Associate Productivity candidate pattern', sourceType: 'pattern', detail: 'Candidate state with 3 deployments and 49% preload depth.' },
        { id: 'source-assoc-2', label: 'Apex field-operations baseline', sourceType: 'l2', detail: 'Store labor, workflow, and digital-assist notes from field-ops reviews.' },
      ],
    },
    moduleContent: associateContent,
  },
  {
    id: 'demand-forecasting-ai',
    name: 'Demand Forecasting AI',
    clientName: 'Apex Retail Group',
    archetype: 'ai_product_enablement',
    currentPhase: 6,
    shape: 'pattern',
    patternKey: 'demand-forecasting-ai',
    patternName: 'Demand Forecasting AI',
    charter: {
      headline: 'Historical texture program with already-signed-off forecasting outcomes and completed Verify work.',
      bullets: [
        'Demand forecasting outcomes are already signed off and complete.',
        'Use the program as historical texture for the Programs portfolio and pattern credibility.',
        'Pattern feedback and outcome evidence are already captured in the closeout package.',
      ],
      sponsorDecision: 'No open decision. This program is complete and serves as historical texture.',
      baselineNeed: 'All baseline references and evidence are already attached.',
    },
    phases: [
      phaseState(1, 'Origination', 'complete', 'Pattern accepted.', 'none'),
      phaseState(2, 'Charter', 'complete', 'Charter signed.', 'hard'),
      phaseState(3, 'Diagnose', 'complete', 'Findings locked.', 'hard'),
      phaseState(4, 'Design', 'complete', 'Recommendation approved.', 'hard'),
      phaseState(5, 'Execute', 'complete', 'Execution evidence catalog complete.', 'soft'),
      phaseState(6, 'Verify', 'complete', 'Verification signed off and outcomes attested.', 'hard'),
    ],
    modules: [
      { moduleKey: 'outcome-measurement', name: MODULE_NAMES['outcome-measurement'], phase: 6, status: 'signed_off', currentVersion: 2, lastEditedBy: PEOPLE.tori, lastEditedAt: hoursAgo(36) },
      { moduleKey: 'benefits-realization', name: MODULE_NAMES['benefits-realization'], phase: 6, status: 'signed_off', currentVersion: 1, lastEditedBy: PEOPLE.arjun, lastEditedAt: hoursAgo(32) },
    ],
    team: [
      { ...PEOPLE.arjun, role: 'sponsor', workstream: 'Technology sponsor', activitySummary: 'Closed the final attestation and archived the pattern learnings', notificationState: 'priority' },
      { ...PEOPLE.alex, role: 'lead', workstream: 'Program lead', activitySummary: 'Completed closeout package and evidence archive', notificationState: 'all' },
      { ...PEOPLE.tori, role: 'team_member', workstream: 'Merchandising analytics', activitySummary: 'Owns forecasting and turns measurement', notificationState: 'all' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Pattern oversight', activitySummary: 'Logged pattern learnings into the proven forecasting pattern', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-forecast-1', type: 'approval', title: 'Verification signed off', detail: 'Arjun Patel completed final outcome attestation.', at: daysAgo(2), actor: PEOPLE.arjun },
      { id: 'act-forecast-2', type: 'deliverable', title: 'Outcome dashboard archived', detail: 'Forecasting metrics and evidence archived into the closeout pack.', at: daysAgo(3), actor: PEOPLE.tori },
    ],
    sponsorPerson: PEOPLE.arjun,
    leadPerson: PEOPLE.alex,
    phaseStatus: 'complete',
    gateSummary: 'This program is complete. Verify is signed off and archived as historical texture.',
    gateStatus: 'cleared',
    deliverables: [
      makeDeliverable('deliv-forecast-verify', 'Forecasting Outcome Pack', 'outcome-measurement', 2, PEOPLE.tori, 'Signed-off outcome dashboard and benefits realization pack.', 'signed_off'),
      makeDeliverable('deliv-forecast-learning', 'Learning Memo + Genome Contribution', 'benefits-realization', 1, PEOPLE.arjun, 'Closeout memo documenting what worked, what to change, and what to promote into the pattern library.', 'signed_off'),
    ],
    metrics: [
      { label: 'Forecast accuracy', value: '85%', tone: 'teal' },
      { label: 'Inventory turns', value: '7.3x', tone: 'teal' },
      { label: 'Same-store sales', value: '+1.7%', tone: 'teal' },
      { label: 'Status', value: 'Signed off', tone: 'default' },
    ],
    sponsorDashboard: {
      openDecisions: [],
      milestones: ['Verification signed off.', 'Pattern feedback promoted into the forecasting playbook.'],
      keyFindings: ['All primary metrics exceeded target.', 'The program now serves as reference texture for future forecasting work.'],
      outcomeSignal: 'Closed and archived.',
    },
    nexusPanel: {
      programId: 'demand-forecasting-ai',
      mode: 'collapsed',
      activeTab: 'sources',
      thread: {
        id: 'program-thread-forecast',
        title: 'Forecasting closeout thread',
        turns: [
          { id: 'turn-forecast-1', speaker: 'lead', text: 'What should future teams remember from this closed program?' },
          { id: 'turn-forecast-2', speaker: 'nexus', text: 'Preserve the planner override review cadence and the Snowflake demand-feature template because both drove the strongest outcome lift.' },
        ],
      },
      drafts: [
        { id: 'draft-forecast-1', title: 'Outcome attestation memo', moduleKey: 'benefits-realization', status: 'ready', summary: 'Closed historical texture memo with all sponsor approvals attached.' },
      ],
      flags: [
        { id: 'flag-forecast-1', severity: 'low', title: 'Historical texture only', detail: 'No active flags. This program is complete and read-mostly.' },
      ],
      sources: [
        { id: 'source-forecast-1', label: 'Demand Forecasting AI pattern', sourceType: 'pattern', detail: '15 deployments with proven forecasting and inventory-turns guidance.' },
        { id: 'source-forecast-2', label: 'Apex forecasting evidence archive', sourceType: 'l2', detail: 'Signed-off forecasting dashboard, same-store sales results, and closeout evidence.' },
      ],
    },
    moduleContent: verifyContent,
  },
];

function buildProgramSummary(program: ProgramFullState): ProgramSummary {
  return {
    id: program.id,
    name: program.name,
    archetype: program.archetype,
    patternKey: program.patternKey,
    patternName: program.patternName,
    charterSummary: program.charter.headline,
    currentPhase: program.currentPhase,
    phaseStatus: program.phaseStatus,
    sponsorPerson: program.sponsorPerson,
    leadPerson: program.leadPerson,
    lastActivityAt: program.activity[0]?.at ?? daysAgo(2),
    attentionBadge:
      program.id === 'unified-customer-data-platform'
        ? { label: 'Awaiting approval', variant: 'warning' }
        : program.id === 'contact-center-ai-transformation'
          ? { label: 'Blocked', variant: 'danger' }
          : program.id === 'store-associate-productivity'
            ? { label: 'Quality flag', variant: 'info' }
            : { label: 'Signed off', variant: 'success' },
    shape: program.shape,
    clientName: program.clientName,
  };
}

function defaultInbox(role: ViewerRole): InboxItem[] {
  if (role === 'sponsor') {
    return [
      { id: 'inbox-s1', priority: 'high', label: 'Decision waiting', title: 'Approve Unified Customer Data Platform Charter', detail: 'Hard gate is ready as soon as you sign the Charter pack.', dueLabel: '14h remaining', programId: 'unified-customer-data-platform', programName: 'Unified Customer Data Platform', actionLabel: 'Review gate' },
      { id: 'inbox-s2', priority: 'medium', label: 'Execution escalation', title: 'Review Contact Center AI tuning blocker', detail: 'Execute is active and the tuning sprint now needs sponsor visibility.', dueLabel: 'Today', programId: 'contact-center-ai-transformation', programName: 'Contact Center AI Transformation', actionLabel: 'Open execute' },
    ];
  }
  if (role === 'maestro' || role === 'founder') {
    return [
      { id: 'inbox-m1', priority: 'critical', label: 'Intervention', title: 'Contact Center AI enablement drift needs review', detail: 'Pattern drift is compounding the execute slip.', dueLabel: 'Now', programId: 'contact-center-ai-transformation', programName: 'Contact Center AI Transformation', actionLabel: 'Open execute view' },
      { id: 'inbox-m2', priority: 'medium', label: 'Pattern health', title: 'Store Associate Productivity needs quality pass', detail: 'The custom-shape business case still needs sharper frontline economics language.', dueLabel: 'Today', programId: 'store-associate-productivity', programName: 'Store Associate Productivity', actionLabel: 'Review custom shape' },
    ];
  }
  return [
    { id: 'inbox-l1', priority: 'high', label: 'Hard gate', title: 'Unified Customer Data Platform is waiting on Charter signoff', detail: 'Stakeholder map is ready, but source-key alignment is still blocked.', dueLabel: '14h on SLA', programId: 'unified-customer-data-platform', programName: 'Unified Customer Data Platform', actionLabel: 'Open charter' },
    { id: 'inbox-l2', priority: 'critical', label: 'Blocked', title: 'Contact Center AI tuning sprint is 3 days overdue', detail: 'Model evaluation signoff is holding the execute sequence.', dueLabel: 'Escalate today', programId: 'contact-center-ai-transformation', programName: 'Contact Center AI Transformation', actionLabel: 'Open execute' },
    { id: 'inbox-l3', priority: 'medium', label: 'Quality flag', title: 'Store Associate Productivity business case needs sharper language', detail: 'Custom-shape draft is structurally sound but not ready for sponsor review.', dueLabel: 'This afternoon', programId: 'store-associate-productivity', programName: 'Store Associate Productivity', actionLabel: 'Open custom shape' },
  ];
}

function matchProgramFilters(program: ProgramSummary, role: ViewerRole, filters: PortfolioFilters): boolean {
  const search = (filters.search ?? '').trim().toLowerCase();
  if (search) {
    const haystack = [
      program.name,
      program.charterSummary,
      program.patternName ?? '',
      program.sponsorPerson.name,
      archetypeLabelMap[program.archetype],
      program.clientName,
    ].join(' ').toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.phase && filters.phase !== 'all' && String(program.currentPhase) !== filters.phase) return false;
  if (filters.archetype && filters.archetype !== 'all' && program.archetype !== filters.archetype) return false;
  if (filters.status && filters.status !== 'all') {
    const current = program.phaseStatus === 'awaiting_gate' ? 'pending' : program.phaseStatus;
    if (filters.status !== current) return false;
  }
  if (filters.sponsor && filters.sponsor !== 'all' && program.sponsorPerson.id !== filters.sponsor) return false;
  if (filters.pattern && filters.pattern !== 'all' && program.patternKey !== filters.pattern) return false;
  if (filters.shape && filters.shape !== 'all' && program.shape !== filters.shape) return false;
  if (filters.myRole && filters.myRole !== 'all') {
    if (filters.myRole === 'sponsor' && program.sponsorPerson.id !== PEOPLE.dana.id && program.sponsorPerson.id !== PEOPLE.arjun.id) return false;
    if (filters.myRole === 'lead' && program.leadPerson.id !== PEOPLE.alex.id) return false;
    if (filters.myRole === 'maestro' && role !== 'maestro' && role !== 'founder') return false;
  }
  return true;
}

export function getRoleDefaults(viewerRole: ViewerRole): PortfolioFilters {
  if (viewerRole === 'sponsor') return { myRole: 'sponsor', status: 'pending', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  if (viewerRole === 'maestro') return { myRole: 'maestro', status: 'all', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  if (viewerRole === 'founder') return { myRole: 'all', status: 'all', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  return { myRole: 'lead', status: 'active', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
}

export async function getPrograms(args: { role: ViewerRole; filters: PortfolioFilters }): Promise<{ programs: ProgramSummary[]; inbox: InboxItem[]; totalCount: number }> {
  const summaries = programs.map(buildProgramSummary).filter((program) => matchProgramFilters(program, args.role, args.filters));
  return { programs: summaries, inbox: defaultInbox(args.role), totalCount: summaries.length };
}

export async function searchPrograms(args: { q: string; filters: PortfolioFilters }): Promise<{ programs: ProgramSummary[] }> {
  const merged = { ...args.filters, search: args.q };
  return { programs: programs.map(buildProgramSummary).filter((program) => matchProgramFilters(program, 'lead', merged)) };
}

export async function getPatterns(args: { role: ViewerRole }): Promise<PatternLibraryItem[]> {
  if (args.role === 'maestro' || args.role === 'founder') return patterns;
  return patterns.filter((pattern) => pattern.promotionState !== 'candidate');
}

export async function getPatternByKey(patternKey: string): Promise<PatternLibraryItem | null> {
  return patterns.find((pattern) => pattern.key === patternKey) ?? null;
}

export async function getProgramById(programId: string): Promise<ProgramFullState | null> {
  return programs.find((program) => program.id === programId) ?? null;
}

export async function getProgramPhase(programId: string, phaseNumber: number): Promise<ProgramFullState | null> {
  const program = programs.find((entry) => entry.id === programId);
  if (!program) return null;
  return { ...program, currentPhase: phaseNumber };
}

export async function getProgramModule(programId: string, moduleKey: string): Promise<{ program: ProgramFullState | null; moduleState: ModuleState | null }> {
  const program = programs.find((entry) => entry.id === programId) ?? null;
  const moduleState = program?.modules.find((module) => module.moduleKey === moduleKey) ?? null;
  return { program, moduleState };
}

function rankPatternsFromText(text: string): PatternMatch[] {
  const lower = text.toLowerCase();
  const contactCenterScore = lower.includes('contact center') || lower.includes('agent') || lower.includes('csat') ? 0.88 : 0.69;
  const cdpScore = lower.includes('customer data') || lower.includes('single view') || lower.includes('source') ? 0.86 : 0.71;
  const associateScore = lower.includes('associate') || lower.includes('store') || lower.includes('frontline') ? 0.84 : 0.52;
  const forecastingScore = lower.includes('forecast') || lower.includes('inventory') || lower.includes('demand') ? 0.82 : 0.64;

  const matches: PatternMatch[] = [
    {
      patternKey: 'contact-center-ai',
      patternName: 'Contact Center AI Transformation',
      confidence: contactCenterScore,
      confidenceBand: contactCenterScore >= 0.75 ? 'high' : contactCenterScore >= 0.5 ? 'medium' : 'low',
      deploymentCount: 18,
      successfulDeploymentCount: 15,
      medianOutcomeUsd: 5_200_000,
      typicalDurationMonths: 6,
      successRatePct: 88,
      preloadDepthPct: 66,
      proposedShape: {
        phases: [
          { canonicalPhase: 1, name: 'Origination' },
          { canonicalPhase: 2, name: 'Charter' },
          { canonicalPhase: 3, name: 'Diagnose' },
          { canonicalPhase: 4, name: 'Design' },
          { canonicalPhase: 5, name: 'Execute' },
          { canonicalPhase: 6, name: 'Verify' },
        ],
        modules: [
          { moduleKey: 'data-analysis-findings', name: MODULE_NAMES['data-analysis-findings'] },
          { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'] },
          { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'] },
          { moduleKey: 'change-management-plan', name: MODULE_NAMES['change-management-plan'] },
        ],
      },
      isTopMatch: false,
    },
    {
      patternKey: 'unified-customer-data-platform',
      patternName: 'Unified Customer Data Platform',
      confidence: cdpScore,
      confidenceBand: cdpScore >= 0.75 ? 'high' : cdpScore >= 0.5 ? 'medium' : 'low',
      deploymentCount: 12,
      successfulDeploymentCount: 10,
      medianOutcomeUsd: 4_600_000,
      typicalDurationMonths: 5,
      successRatePct: 83,
      preloadDepthPct: 63,
      proposedShape: {
        phases: [
          { canonicalPhase: 1, name: 'Origination' },
          { canonicalPhase: 2, name: 'Charter' },
          { canonicalPhase: 3, name: 'Diagnose' },
          { canonicalPhase: 4, name: 'Design' },
          { canonicalPhase: 5, name: 'Execute' },
          { canonicalPhase: 6, name: 'Verify' },
        ],
        modules: [
          { moduleKey: 'problem-framing', name: MODULE_NAMES['problem-framing'] },
          { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'] },
          { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'] },
          { moduleKey: 'baseline-data-request', name: MODULE_NAMES['baseline-data-request'] },
        ],
      },
      isTopMatch: false,
    },
    {
      patternKey: associateScore > forecastingScore ? 'store-associate-productivity' : 'demand-forecasting-ai',
      patternName: associateScore > forecastingScore ? 'Store Associate Productivity' : 'Demand Forecasting AI',
      confidence: Math.max(associateScore, forecastingScore),
      confidenceBand: Math.max(associateScore, forecastingScore) >= 0.75 ? 'high' : Math.max(associateScore, forecastingScore) >= 0.5 ? 'medium' : 'low',
      deploymentCount: associateScore > forecastingScore ? 3 : 15,
      successfulDeploymentCount: associateScore > forecastingScore ? 2 : 12,
      medianOutcomeUsd: associateScore > forecastingScore ? 6_800_000 : 5_900_000,
      typicalDurationMonths: associateScore > forecastingScore ? 4 : 4,
      successRatePct: associateScore > forecastingScore ? 67 : 86,
      preloadDepthPct: associateScore > forecastingScore ? 49 : 61,
      proposedShape: {
        phases: associateScore > forecastingScore
          ? [
              { canonicalPhase: 1, name: 'Origination' },
              { canonicalPhase: 2, name: 'Charter' },
              { canonicalPhase: 3, name: 'Diagnose' },
              { canonicalPhase: 4, name: 'Design' },
            ]
          : [
              { canonicalPhase: 1, name: 'Origination' },
              { canonicalPhase: 2, name: 'Charter' },
              { canonicalPhase: 3, name: 'Diagnose' },
              { canonicalPhase: 5, name: 'Execute' },
              { canonicalPhase: 6, name: 'Verify' },
            ],
        modules: associateScore > forecastingScore
          ? [
              { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'] },
              { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'] },
              { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'] },
              { moduleKey: 'business-case-roi', name: MODULE_NAMES['business-case-roi'] },
            ]
          : [
              { moduleKey: 'diagnostic-instrument', name: MODULE_NAMES['diagnostic-instrument'] },
              { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'] },
              { moduleKey: 'outcome-measurement', name: MODULE_NAMES['outcome-measurement'] },
            ],
      },
      isTopMatch: false,
    },
  ];

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3).map((match, index) => ({ ...match, isTopMatch: index === 0 }));
}

export async function* originateProgram(body: OriginationRequest): AsyncGenerator<OriginationStageEvent | { id: 'complete'; matches: PatternMatch[]; prefilledForm: OriginationForm }, void, void> {
  const prefilledForm: OriginationForm =
    'source' in body
      ? body.source === 'intelligence_thread'
        ? {
            name: 'Scoped from Intelligence',
            useCase: 'Scale an Apex retail growth program into a governed operating surface with sponsor-ready sequencing.',
            targetOutcome: 'Lift customer outcomes while improving productivity and operating leverage.',
            sponsorPersonId: PEOPLE.dana.id,
            leadPersonId: PEOPLE.alex.id,
            industryHint: 'Retail',
            functionHint: 'Store and digital operations',
          }
        : {
            name: 'Signal-triggered program',
            useCase: 'Convert a rising retail execution signal into a governed delivery program.',
            targetOutcome: 'Stabilize risk and create a sponsor-visible execution path.',
            sponsorPersonId: PEOPLE.dana.id,
            leadPersonId: PEOPLE.alex.id,
            industryHint: 'Retail',
            functionHint: 'Operations',
          }
      : body;

  const stageSeed: OriginationStageEvent[] = [
    { id: 'intent-extraction', label: 'Intent extraction', detail: 'Distilling retail archetype, scope, and target-outcome signals from the intake.', state: 'running' },
    { id: 'vector-match', label: 'Genome match', detail: 'Comparing the scoped use case against retail pattern embeddings and prior deployments.', state: 'running' },
    { id: 'scoring', label: 'Shape scoring', detail: 'Ranking the top matches with confidence, preload depth, and success evidence.', state: 'running' },
  ];

  for (const stage of stageSeed) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    yield { ...stage, state: 'complete' };
  }

  yield {
    id: 'complete',
    matches: rankPatternsFromText(`${prefilledForm.name} ${prefilledForm.useCase} ${prefilledForm.targetOutcome}`),
    prefilledForm,
  };
}

export async function createProgram(body: CreateProgramRequest): Promise<{ programId: string; redirectTo: string }> {
  const selected = body.acceptedPatternKey ?? body.shapeModifications?.shape;
  if (selected === 'store-associate-productivity' || body.shapeModifications?.shape === 'custom') {
    return { programId: 'store-associate-productivity', redirectTo: '/programs/store-associate-productivity?created=1' };
  }
  if (selected === 'contact-center-ai') {
    return { programId: 'contact-center-ai-transformation', redirectTo: '/programs/contact-center-ai-transformation?created=1' };
  }
  if (selected === 'demand-forecasting-ai') {
    return { programId: 'demand-forecasting-ai', redirectTo: '/programs/demand-forecasting-ai?created=1' };
  }
  return { programId: 'unified-customer-data-platform', redirectTo: '/programs/unified-customer-data-platform?created=1' };
}

export async function advancePhase(_programId: string, fromPhase: number): Promise<AdvanceResult> {
  return { ok: true, message: `Mock phase advance recorded from Phase ${fromPhase}.` };
}

export async function publishModule(_programId?: string, _moduleKey?: string): Promise<void> {
  return;
}

export async function updateModuleField(_programId?: string, _moduleKey?: string, _field?: string, _value?: unknown): Promise<void> {
  return;
}

export async function requestNexusDraft(_programId?: string, _moduleKey?: string): Promise<DraftResult> {
  // TODO(Packet 8 §8.4, Packet 12 §12.3): replace this typed stub with the real
  // Mode B drafting SSE integration after Intelligence Nexus infra merges.
  return {
    ok: false,
    message: 'Nexus module drafting is intentionally stubbed in this frontend-only branch.',
  };
}

export async function* streamNexusChat(_programId?: string): AsyncGenerator<Turn, void, void> {
  // TODO(Packet 8 §8.3, Packet 12 §12.3): wire the side-panel chat tab to the
  // real program-scoped Nexus SSE endpoint after shared infra merges.
  yield { id: 'stub-chat-turn', speaker: 'nexus', text: 'Programs chat is running in static-shell mode on this branch.' };
}

export async function answerCxoTakeover(_programId: string, _mode: 'phase_3_interview' | 'phase_6_verification', answer: string): Promise<NextTurn> {
  // TODO(Packet 8 §8.5, Packet 12 §12.3): replace this typed stub with the real
  // Mode C takeover interaction flow after shared interview infrastructure lands.
  return {
    nextQuestion: undefined,
    transcript: [
      { id: 'stub-q', speaker: 'nexus', text: 'Mode C takeover is intentionally static on this branch.' },
      { id: 'stub-a', speaker: 'sponsor', text: answer },
    ],
  };
}

export async function closeCxoTakeover(_programId?: string): Promise<Synthesis> {
  // TODO(Packet 8 §8.5): replace with the real synthesis closeout once the
  // interview persistence layer is available.
  return {
    headline: 'Static takeover preview',
    bullets: [
      'Question flow is spec-aligned but not yet interactive.',
      'Transcript persistence will be added with the shared Nexus backend merge.',
    ],
  };
}

export function getArchetypeLabel(archetype: ArchetypeKey): string {
  return archetypeLabelMap[archetype];
}

export function getViewerRole(value: string | null | undefined): ViewerRole {
  switch (value) {
    case 'sponsor':
    case 'lead':
    case 'team_member':
    case 'maestro':
    case 'founder':
      return value;
    default:
      return 'lead';
  }
}

export function mergeFilters(defaults: PortfolioFilters, overrides: Partial<PortfolioFilters>): PortfolioFilters {
  return { ...defaults, ...overrides };
}

export function getSponsorOptions(): PersonRef[] {
  return [PEOPLE.dana, PEOPLE.arjun, PEOPLE.elena];
}

export function getLeadOptions(): PersonRef[] {
  return [PEOPLE.alex, PEOPLE.maya, PEOPLE.sofia];
}

export function getAllPrograms(): ProgramFullState[] {
  return programs;
}

export function getProgramByIdSync(programId: string): ProgramFullState | null {
  return programs.find((program) => program.id === programId) ?? null;
}

export function getProgramPhaseSync(programId: string, phaseNumber: number): ProgramFullState | null {
  const program = getProgramByIdSync(programId);
  if (!program) return null;
  return { ...program, currentPhase: phaseNumber };
}

export function getProgramModuleSync(programId: string, moduleKey: string): { program: ProgramFullState | null; moduleState: ModuleState | null } {
  const program = getProgramByIdSync(programId);
  const moduleState = program?.modules.find((module) => module.moduleKey === moduleKey) ?? null;
  return { program, moduleState };
}

export function getDeliverable(programId: string, deliverableId: string) {
  const program = programs.find((entry) => entry.id === programId);
  return program?.deliverables.find((deliverable) => deliverable.id === deliverableId) ?? null;
}

export function getModuleName(moduleKey: string) {
  return MODULE_NAMES[moduleKey] ?? moduleKey;
}

export function getCxoQuestionBank(mode: 'phase_3_interview' | 'phase_6_verification'): Question[] {
  return mode === 'phase_3_interview'
    ? [
        { id: 'q1', prompt: 'Which retail outcome feels most urgent to protect as this program moves into Design?', rationale: 'Starts with the most sponsor-visible pressure point.' },
        { id: 'q2', prompt: 'Where do you see the highest execution risk if the team advances next week?', rationale: 'Surfaces sponsor-owned blockers early.' },
        { id: 'q3', prompt: 'What should the next phase absolutely preserve for stores and customers?', rationale: 'Captures non-negotiables for the next phase.' },
      ]
    : [
        { id: 'qv1', prompt: 'Which verified outcome mattered most to the Apex business?', rationale: 'Confirms the strongest realized value signal.' },
        { id: 'qv2', prompt: 'What still feels incomplete before you would fully attest benefits?', rationale: 'Captures residual gaps before closeout.' },
        { id: 'qv3', prompt: 'What should this pattern remember for the next retail deployment?', rationale: 'Feeds Genome learning back into the pattern.' },
      ];
}

export const STATIC_NEXUS_SOURCES: ContextSource[] = [
  { id: 'static-source-1', label: 'Pattern preload', sourceType: 'pattern', detail: 'Canonical module framing and retail benchmark defaults.' },
  { id: 'static-source-2', label: 'Client uploads', sourceType: 'l2', detail: 'Uploaded CSVs, sponsor notes, and activity history.' },
  { id: 'static-source-3', label: 'Program history', sourceType: 'l3', detail: 'Published findings, reports, and gate decisions.' },
];
