// MW7 · Workshop Template Library read model.
//
// Pure deterministic catalog of AbarVa workshop templates spanning the
// canonical Maestro arc: discovery, framing, value, governance,
// architecture, adoption, and executive review. Each template names
// the purpose, the prerequisite inputs the room must bring, the
// deterministic agenda, the decision the workshop is meant to land,
// and the artifacts the room will produce.
//
// The library is the seed surface for MW7 — the panel that lets the
// Client Maestro pick the right template before scheduling a workshop.
// It is intentionally a calm, library-only catalog: no booking, no
// scheduling, no live agenda generation, no model calls, no Date.now()
// reads, no random IDs, no fetch.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type WorkshopTemplateCategory =
  | 'discovery'
  | 'framing'
  | 'value'
  | 'governance'
  | 'architecture'
  | 'adoption'
  | 'executive_review';

export interface WorkshopTemplateAgenda {
  step: number;
  title: string;
  durationMinutes: number;
  intent: string;
}

export interface WorkshopTemplateInputs {
  required: ReadonlyArray<string>;
  optional: ReadonlyArray<string>;
}

export interface WorkshopTemplate {
  id: string;
  category: WorkshopTemplateCategory;
  categoryLabel: string;
  title: string;
  purpose: string;
  durationMinutes: number;
  decisionToLand: string;
  inputs: WorkshopTemplateInputs;
  agenda: ReadonlyArray<WorkshopTemplateAgenda>;
  outputs: ReadonlyArray<string>;
  facilitatorNotes: ReadonlyArray<string>;
  createdFrom: 'deterministic_workshop_template_library_seed';
}

export interface WorkshopTemplateLibrarySummary {
  totalCount: number;
  byCategory: Record<WorkshopTemplateCategory, number>;
  totalDurationMinutes: number;
  uniqueCategories: ReadonlyArray<WorkshopTemplateCategory>;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

const CATEGORIES_IN_ORDER: ReadonlyArray<WorkshopTemplateCategory> = [
  'discovery',
  'framing',
  'value',
  'governance',
  'architecture',
  'adoption',
  'executive_review',
];

/** Canonical category list, in display order. Pure. */
export function listWorkshopTemplateCategories(): ReadonlyArray<WorkshopTemplateCategory> {
  return CATEGORIES_IN_ORDER;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic workshop template library. Same input →
 * identical output across calls. The library always emits at least
 * one template per canonical category and a total of seven or more
 * templates.
 */
export function buildWorkshopTemplateLibrary(): ReadonlyArray<WorkshopTemplate> {
  const out: WorkshopTemplate[] = [];
  for (const category of CATEGORIES_IN_ORDER) {
    for (const template of templatesForCategory(category)) {
      out.push(template);
    }
  }
  return out;
}

/**
 * Aggregate counts across the workshop template library. Pure.
 */
export function summarizeWorkshopTemplateLibrary(
  templates: ReadonlyArray<WorkshopTemplate>,
): WorkshopTemplateLibrarySummary {
  const byCategory = emptyByCategory();
  let totalDurationMinutes = 0;
  const uniqueCategories = new Set<WorkshopTemplateCategory>();
  for (const t of templates) {
    byCategory[t.category] += 1;
    totalDurationMinutes += t.durationMinutes;
    uniqueCategories.add(t.category);
  }
  const ordered = CATEGORIES_IN_ORDER.filter((c) => uniqueCategories.has(c));
  return {
    totalCount: templates.length,
    byCategory,
    totalDurationMinutes,
    uniqueCategories: ordered,
  };
}

/**
 * Filter the library by category. Pure.
 */
export function getTemplatesByCategory(
  category: WorkshopTemplateCategory,
): ReadonlyArray<WorkshopTemplate> {
  return buildWorkshopTemplateLibrary().filter((t) => t.category === category);
}

// ---------------------------------------------------------------------
// Category → template seed
// ---------------------------------------------------------------------

function templatesForCategory(
  category: WorkshopTemplateCategory,
): ReadonlyArray<WorkshopTemplate> {
  switch (category) {
    case 'discovery':
      return [DISCOVERY_CURRENT_STATE, DISCOVERY_OPPORTUNITY_MAP];
    case 'framing':
      return [FRAMING_USE_CASE_PRIORITIZATION];
    case 'value':
      return [VALUE_BASELINE_AND_TARGET];
    case 'governance':
      return [GOVERNANCE_RISK_REVIEW];
    case 'architecture':
      return [ARCHITECTURE_SOLUTION_DESIGN];
    case 'adoption':
      return [ADOPTION_CHANGE_READINESS];
    case 'executive_review':
      return [EXECUTIVE_DECISION_REVIEW];
  }
}

// ---------------------------------------------------------------------
// Templates · discovery
// ---------------------------------------------------------------------

const DISCOVERY_CURRENT_STATE: WorkshopTemplate = {
  id: 'wstpl:discovery:current_state_walk',
  category: 'discovery',
  categoryLabel: 'Discovery',
  title: 'Current-state operating walk',
  purpose: 'Ground the room in the operating reality the program must improve, with named hand-offs, tools, and friction points.',
  durationMinutes: 90,
  decisionToLand: 'Confirm the operating workflow the program is being asked to change and the friction the room agrees is in scope.',
  inputs: {
    required: [
      'Process map or sketch of the operating workflow',
      'Named workflow owner and a sponsor for the room',
    ],
    optional: [
      'Recent operational metrics for the workflow',
      'Prior discovery notes from the same domain',
    ],
  },
  agenda: [
    { step: 1, title: 'Frame the workshop intent and decision', durationMinutes: 10, intent: 'Read the named decision the room must land before the room ends.' },
    { step: 2, title: 'Walk the operating workflow end-to-end', durationMinutes: 35, intent: 'Capture hand-offs, tools, and the friction owners feel without solutioning.' },
    { step: 3, title: 'Surface contradictions and out-of-scope drift', durationMinutes: 20, intent: 'Adjudicate which friction is in scope and which is adjacent.' },
    { step: 4, title: 'Confirm the in-scope friction list', durationMinutes: 15, intent: 'Lock the friction list the framing workshop will inherit.' },
    { step: 5, title: 'Capture the decision and open questions', durationMinutes: 10, intent: 'Write the decision record before the room closes.' },
  ],
  outputs: [
    'Operating workflow walk with named hand-offs',
    'In-scope friction list ready for framing',
    'Decision record naming the workflow under change',
  ],
  facilitatorNotes: [
    'Keep solutioning out of the room — discovery is the wrong moment to choose a tool.',
    'When the workflow owner cannot name a hand-off, write it as an open question rather than guessing.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

const DISCOVERY_OPPORTUNITY_MAP: WorkshopTemplate = {
  id: 'wstpl:discovery:opportunity_map',
  category: 'discovery',
  categoryLabel: 'Discovery',
  title: 'Opportunity and pain mapping',
  purpose: 'Catalog candidate AI opportunities anchored in operating pain so the framing workshop has a defensible starting set.',
  durationMinutes: 75,
  decisionToLand: 'Lock the candidate opportunity list the framing workshop will prioritize from.',
  inputs: {
    required: [
      'In-scope friction list from the current-state walk',
      'Workflow owner present in the room',
    ],
    optional: [
      'Adjacent-domain reference patterns',
      'Prior opportunity audits if the engagement has them',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap the in-scope friction list', durationMinutes: 10, intent: 'Anchor the room on the discovery output.' },
    { step: 2, title: 'Map friction to candidate opportunities', durationMinutes: 30, intent: 'Pair each friction point with one or more candidate opportunities.' },
    { step: 3, title: 'Adjudicate evidence available per candidate', durationMinutes: 20, intent: 'Mark each candidate with the evidence the room can defend it with today.' },
    { step: 4, title: 'Lock the candidate list and open questions', durationMinutes: 15, intent: 'Capture the opportunity list and the open questions framing inherits.' },
  ],
  outputs: [
    'Candidate opportunity list with friction anchors',
    'Evidence-availability annotations per candidate',
    'Open-question list for the framing workshop',
  ],
  facilitatorNotes: [
    'Resist scoring opportunities here — scoring is the framing workshop, not discovery.',
    'When evidence is thin, write the gap honestly rather than promising fabricated data.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · framing
// ---------------------------------------------------------------------

const FRAMING_USE_CASE_PRIORITIZATION: WorkshopTemplate = {
  id: 'wstpl:framing:use_case_prioritization',
  category: 'framing',
  categoryLabel: 'Framing',
  title: 'Use-case prioritization rubric',
  purpose: 'Score candidate use cases on operating impact and feasibility so the room can defend the first wave with evidence rather than enthusiasm.',
  durationMinutes: 90,
  decisionToLand: 'Pick the first-wave use cases and the candidates the program will defer with reasons.',
  inputs: {
    required: [
      'Candidate opportunity list from discovery',
      'Workflow owner and value lead present',
    ],
    optional: [
      'Operating metrics that anchor impact estimates',
      'Comparable scoring rubrics from prior engagements',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap the candidate opportunity list', durationMinutes: 10, intent: 'Anchor the room on the discovery output and the rubric the room will use.' },
    { step: 2, title: 'Score candidates on operating impact', durationMinutes: 25, intent: 'Adjudicate impact with the workflow owner naming the metric the candidate moves.' },
    { step: 3, title: 'Score candidates on feasibility', durationMinutes: 25, intent: 'Score feasibility on data, governance, and adoption posture honestly.' },
    { step: 4, title: 'Resolve ties and adjudicate the cut line', durationMinutes: 20, intent: 'Lock the first-wave list and the deferred list with reasons.' },
    { step: 5, title: 'Write the decision and open questions', durationMinutes: 10, intent: 'Capture the prioritization decision the room can defend in the executive review.' },
  ],
  outputs: [
    'First-wave use-case list with named owners',
    'Deferred-candidate list with deferral reasons',
    'Open-question list for value framing',
  ],
  facilitatorNotes: [
    'When the room cannot defend a candidate with operating evidence, mark it deferred rather than ranking it.',
    'Keep tool talk out of the room — framing names the use case, not the vendor.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · value
// ---------------------------------------------------------------------

const VALUE_BASELINE_AND_TARGET: WorkshopTemplate = {
  id: 'wstpl:value:baseline_and_target',
  category: 'value',
  categoryLabel: 'Value',
  title: 'Baseline anchor and target framing',
  purpose: 'Lock the operating baseline and the target metric the program will be measured on, with a confidence band the room can defend.',
  durationMinutes: 75,
  decisionToLand: 'Confirm the baseline anchor, the target metric, and the confidence band the value ledger will carry.',
  inputs: {
    required: [
      'First-wave use-case list from the framing workshop',
      'Value lead and workflow owner present',
    ],
    optional: [
      'Source-of-truth measurement for the baseline metric',
      'Comparable target ranges from adjacent engagements',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap the first-wave use cases', durationMinutes: 10, intent: 'Anchor the room on the framing output and the metrics the room owns.' },
    { step: 2, title: 'Lock the baseline anchor', durationMinutes: 20, intent: 'Confirm the baseline measurement and the source the program will cite.' },
    { step: 3, title: 'Frame the target metric and confidence band', durationMinutes: 25, intent: 'Write the target with an honest confidence band rather than a single number.' },
    { step: 4, title: 'Capture the value-ledger entries', durationMinutes: 10, intent: 'Write the ledger entry the executive review will inherit.' },
    { step: 5, title: 'Write decision and open questions', durationMinutes: 10, intent: 'Lock the decision before the room closes.' },
  ],
  outputs: [
    'Baseline anchor entry with named source',
    'Target-metric entry with confidence band',
    'Value-ledger row ready for executive review',
  ],
  facilitatorNotes: [
    'Refuse single-number targets — write the band even when the band is wide.',
    'When the baseline source is unavailable, write the gap and defer the lock rather than fabricating a number.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · governance
// ---------------------------------------------------------------------

const GOVERNANCE_RISK_REVIEW: WorkshopTemplate = {
  id: 'wstpl:governance:risk_review',
  category: 'governance',
  categoryLabel: 'Governance',
  title: 'Governance and responsible-AI risk review',
  purpose: 'Map the regulatory, security, and responsible-AI posture for the prioritized wave so the design pack lands the right controls.',
  durationMinutes: 90,
  decisionToLand: 'Lock the controls the design pack must carry and the residual risks the executive review must call out.',
  inputs: {
    required: [
      'First-wave use-case list',
      'Security and governance lead present',
    ],
    optional: [
      'Existing control catalog or compliance posture record',
      'Prior responsible-AI assessments for adjacent programs',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap the first-wave use cases', durationMinutes: 10, intent: 'Anchor the room on the framing output and the boundaries the program crosses.' },
    { step: 2, title: 'Walk the regulatory map', durationMinutes: 20, intent: 'Name the regulations the program is subject to without overclaiming.' },
    { step: 3, title: 'Map controls to inputs and lineage', durationMinutes: 25, intent: 'Confirm which inputs trigger which controls at the right boundary.' },
    { step: 4, title: 'Surface residual risks', durationMinutes: 20, intent: 'Adjudicate the risks the design pack cannot fully control.' },
    { step: 5, title: 'Write decision and the executive callouts', durationMinutes: 15, intent: 'Lock the controls list and the residual-risk callouts.' },
  ],
  outputs: [
    'Required-controls list for the design pack',
    'Residual-risk register with executive callouts',
    'Open-question list for architecture',
  ],
  facilitatorNotes: [
    'Refuse blanket "compliant" claims — name the regulation and the control.',
    'When the room cannot name an input owner, write it as a residual risk rather than assuming coverage.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · architecture
// ---------------------------------------------------------------------

const ARCHITECTURE_SOLUTION_DESIGN: WorkshopTemplate = {
  id: 'wstpl:architecture:solution_design',
  category: 'architecture',
  categoryLabel: 'Architecture',
  title: 'Target architecture and integration boundary',
  purpose: 'Lock the target architecture, vendor stance, and integration boundary the design pack will publish, anchored to the controls list.',
  durationMinutes: 105,
  decisionToLand: 'Confirm the target architecture, the integration boundary, and the vendor stance the program will defend.',
  inputs: {
    required: [
      'First-wave use-case list and required-controls list',
      'Solution architect and data architect present',
    ],
    optional: [
      'Vendor evaluation memos for the candidate stack',
      'Prior reference architectures from adjacent programs',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap framing, value, and controls', durationMinutes: 10, intent: 'Anchor the room on the upstream outputs the design pack inherits.' },
    { step: 2, title: 'Walk the candidate target architecture', durationMinutes: 30, intent: 'Compare candidate architectures and the trade-offs the room must own.' },
    { step: 3, title: 'Lock the integration boundary', durationMinutes: 25, intent: 'Confirm the integration surface the design pack will publish.' },
    { step: 4, title: 'Adjudicate vendor stance', durationMinutes: 25, intent: 'Surface vendor risks and the stance the program will defend.' },
    { step: 5, title: 'Write decision and the design-pack outline', durationMinutes: 15, intent: 'Capture the decision and the design-pack outline the next workshop inherits.' },
  ],
  outputs: [
    'Target-architecture decision with trade-off notes',
    'Integration boundary contract for the design pack',
    'Vendor-stance memo with named risks',
  ],
  facilitatorNotes: [
    'Refuse vendor-first conversations — anchor on the use case and the controls list.',
    'When data movement crosses tenant or compliance boundaries, write the constraint rather than assuming the boundary holds.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · adoption
// ---------------------------------------------------------------------

const ADOPTION_CHANGE_READINESS: WorkshopTemplate = {
  id: 'wstpl:adoption:change_readiness',
  category: 'adoption',
  categoryLabel: 'Adoption',
  title: 'Adoption and change-readiness rubric',
  purpose: 'Stress-test the adoption, training, and operating-model posture so the pilot population is representative and the change can land where work happens.',
  durationMinutes: 90,
  decisionToLand: 'Lock the adoption rubric, the pilot population, and the training the operating model assumes is in place.',
  inputs: {
    required: [
      'Target architecture and integration boundary from the architecture workshop',
      'Change-and-adoption lead and workflow owner present',
    ],
    optional: [
      'Existing adoption signals from comparable rollouts',
      'Training catalog the workflow already relies on',
    ],
  },
  agenda: [
    { step: 1, title: 'Recap the architecture and value framing', durationMinutes: 10, intent: 'Anchor the room on the upstream outputs the rollout inherits.' },
    { step: 2, title: 'Walk the adoption rubric', durationMinutes: 25, intent: 'Confirm the rubric the room will accept as gating before scale.' },
    { step: 3, title: 'Confirm the pilot population', durationMinutes: 25, intent: 'Stress-test that the pilot population represents the scale population.' },
    { step: 4, title: 'Surface training and operating-model gaps', durationMinutes: 20, intent: 'Name the training the operating model assumes and where coverage is thin.' },
    { step: 5, title: 'Write decision and the rollout-readiness checklist', durationMinutes: 10, intent: 'Lock the rubric and the checklist before the room closes.' },
  ],
  outputs: [
    'Adoption rubric the room accepts as gating',
    'Pilot-population definition with representativeness notes',
    'Rollout-readiness checklist for the executive review',
  ],
  facilitatorNotes: [
    'Refuse rollout dates without an adoption rubric — the rubric is the gate, not the calendar.',
    'When the pilot population is not representative, write the gap rather than promising scale will absorb it.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Templates · executive review
// ---------------------------------------------------------------------

const EXECUTIVE_DECISION_REVIEW: WorkshopTemplate = {
  id: 'wstpl:executive_review:decision_review',
  category: 'executive_review',
  categoryLabel: 'Executive review',
  title: 'Executive decision review',
  purpose: 'Defend the program decision in front of the executive sponsor with the value evidence, governance posture, and rollout-readiness the upstream workshops produced.',
  durationMinutes: 60,
  decisionToLand: 'Confirm the executive decision, the deferred items the readout calls out, and the cadence the program will report against.',
  inputs: {
    required: [
      'Value-ledger entry with baseline, target, and confidence band',
      'Required-controls list and residual-risk register',
      'Rollout-readiness checklist and pilot population',
    ],
    optional: [
      'Vendor-stance memo and integration boundary contract',
      'Open-question list across the upstream workshops',
    ],
  },
  agenda: [
    { step: 1, title: 'Frame the decision and the readout shape', durationMinutes: 5, intent: 'Anchor the room on the named decision and the cadence the program will report against.' },
    { step: 2, title: 'Walk the value-ledger evidence', durationMinutes: 15, intent: 'Defend the value entries with the baseline anchor and the confidence band.' },
    { step: 3, title: 'Walk the governance posture', durationMinutes: 15, intent: 'Confirm the controls landed and the residual risks the readout calls out.' },
    { step: 4, title: 'Walk the rollout-readiness checklist', durationMinutes: 15, intent: 'Confirm the pilot population and the rubric that gates scale.' },
    { step: 5, title: 'Lock the decision and the deferred items', durationMinutes: 10, intent: 'Write the executive decision record and the items the next program update will close.' },
  ],
  outputs: [
    'Executive decision record naming the cadence',
    'Deferred-items list the next program update closes',
    'Reporting cadence and audience map',
  ],
  facilitatorNotes: [
    'Refuse single-number outcomes in the readout — defend the band the value workshop locked.',
    'When a residual risk has no owner, name the gap rather than letting the readout imply coverage.',
  ],
  createdFrom: 'deterministic_workshop_template_library_seed',
};

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByCategory(): Record<WorkshopTemplateCategory, number> {
  return {
    discovery: 0,
    framing: 0,
    value: 0,
    governance: 0,
    architecture: 0,
    adoption: 0,
    executive_review: 0,
  };
}
