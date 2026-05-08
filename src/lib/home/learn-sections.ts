// Learn panel section structure per
// docs/build/home-refinement-package/LEARN_PANEL_SHELL.md.
//
// Six sections, in canonical order. The shell ships with structure +
// placeholder content; future Learn Content Package fills each section.

export interface LearnSection {
  id: 'quickstart' | 'glossary' | 'doctrine' | 'agents' | 'workflows' | 'about';
  index: number;
  label: string;
  routeSegment: string;
  oneLineHook: string;
  futureContentSummary: string;
  shellPlaceholder: string;
  /** Sample sub-page slugs that resolve to placeholder pages. */
  sampleSubPages?: ReadonlyArray<{ slug: string; label: string }>;
}

export const LEARN_SECTIONS: ReadonlyArray<LearnSection> = [
  {
    id: 'quickstart',
    index: 1,
    label: 'Quickstart & Training',
    routeSegment: 'quickstart',
    oneLineHook: 'For first-time users · step-by-step training guides · "make your first Move"',
    futureContentSummary:
      '90-second product tour, step-by-step "First Move" walkthrough, video / animated walkthrough, common first-day questions.',
    shellPlaceholder:
      'Training guides and quickstart walkthroughs. The "How to Create a Strategic Move" guide is live — see Workflows below.',
  },
  {
    id: 'glossary',
    index: 2,
    label: 'Glossary',
    routeSegment: 'glossary',
    oneLineHook:
      'Terms used across AbarVa · click any term in the platform to come back here',
    futureContentSummary:
      'Alphabetical glossary of platform terms with plain-language definitions, longer reference, one example each.',
    shellPlaceholder:
      'Glossary index coming soon. Stub list of common terms below.',
    sampleSubPages: [
      { slug: 'ai-initiative', label: 'AI Initiative' },
      { slug: 'strategic-move', label: 'Strategic Move' },
      { slug: 'phase', label: 'Phase (P0–P5)' },
      { slug: 'archetype', label: 'Archetype' },
      { slug: 'pressure-card', label: 'Pressure card' },
      { slug: 'provenance', label: 'Provenance' },
      { slug: 'three-tests-gate', label: 'Three Tests gate' },
      { slug: 'substrate', label: 'Substrate' },
    ],
  },
  {
    id: 'doctrine',
    index: 3,
    label: 'Doctrine reference',
    routeSegment: 'doctrine',
    oneLineHook:
      'The opinionated framework: phases · archetypes · categories · Three Tests gate · substrate-to-surface contract',
    futureContentSummary:
      '6-phase Strategic Moves model, 5 archetypes, 8 AI categories, Three Tests gate, substrate-to-surface contract.',
    shellPlaceholder:
      'Doctrine reference coming soon. The opinionated framework underneath AbarVa.',
    sampleSubPages: [
      { slug: 'phases', label: 'The 6 phases (P0–P5)' },
      { slug: 'archetypes', label: 'The 5 Move archetypes' },
      { slug: 'categories', label: 'The 8 AI categories' },
      { slug: 'three-tests-gate', label: 'Three Tests gate' },
      { slug: 'substrate-to-surface', label: 'Substrate-to-surface contract' },
    ],
  },
  {
    id: 'agents',
    index: 4,
    label: 'Agents',
    routeSegment: 'agents',
    oneLineHook: 'How to work with each AbarVa agent',
    futureContentSummary:
      'One page per agent (Sentinel · Atlas · Nexus · Steward): job, surface, substrate access, sample questions, behavior expectations.',
    shellPlaceholder:
      'Agent reference coming soon. Each agent has a job, a surface, and a personality.',
    sampleSubPages: [
      { slug: 'sentinel', label: 'Sentinel · Intelligence + Source' },
      { slug: 'atlas', label: 'Atlas · Tower' },
      { slug: 'nexus', label: 'Nexus · Strategic Moves' },
      { slug: 'steward', label: 'Steward · Setup / Home' },
    ],
  },
  {
    id: 'workflows',
    index: 5,
    label: 'Workflows',
    routeSegment: 'workflows',
    oneLineHook: 'Step-by-step for common tasks · training guides',
    futureContentSummary:
      'Originating a Strategic Move, reviewing portfolio, handling a pressure card, onboarding a connector, validating substrate, per-phase guidance.',
    shellPlaceholder:
      'Workflow guides — the most-asked tasks, walked through end to end. The "How to Create a Strategic Move" training guide is live now.',
    sampleSubPages: [
      { slug: 'originate-a-move', label: 'How to Create a Strategic Move ↗' },
      { slug: 'review-portfolio', label: 'Review portfolio performance' },
      { slug: 'handle-pressure-card', label: 'Handle a pressure card' },
      { slug: 'onboard-connector', label: 'Onboard a new connector' },
      { slug: 'validate-substrate', label: 'Validate substrate completeness' },
    ],
  },
  {
    id: 'about',
    index: 6,
    label: 'About AbarVa',
    routeSegment: 'about',
    oneLineHook: 'Product · Philosophy · Roadmap',
    futureContentSummary:
      'Product description, differentiators, customer outcomes, roadmap, contact / support, release notes.',
    shellPlaceholder:
      'AbarVa is the operating system for enterprise AI portfolios. The platform helps strategy leads originate, validate, and govern AI Strategic Moves with substrate-grounded reasoning. More content coming.',
  },
];

export function findLearnSection(routeSegment: string): LearnSection | null {
  return LEARN_SECTIONS.find((s) => s.routeSegment === routeSegment) ?? null;
}
