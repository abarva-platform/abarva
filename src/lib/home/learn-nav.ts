// Learn guide navigation structure.
// Drives both the left sidebar and the [section] route lookup.

export interface LearnNavItem {
  slug: string;
  label: string;
  phaseBadge?: string;   // e.g. "P0", "P1"
  phaseColor?: 'grey' | 'navy' | 'teal';
}

export interface LearnNavGroup {
  group: string;
  items: LearnNavItem[];
}

export const LEARN_NAV: ReadonlyArray<LearnNavGroup> = [
  {
    group: 'Getting Started',
    items: [
      { slug: 'welcome', label: 'Welcome & overview' },
      { slug: 'first-steps', label: 'Your first 30 minutes' },
    ],
  },
  {
    group: 'Setup',
    items: [
      { slug: 'setup', label: 'Setup & connectors' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { slug: 'intelligence', label: 'Art of the possible' },
    ],
  },
  {
    group: 'Strategic Moves',
    items: [
      { slug: 'moves-overview', label: 'What is a Move?' },
      { slug: 'p0', label: 'Originate', phaseBadge: 'P0', phaseColor: 'grey' },
      { slug: 'p1', label: 'Charter', phaseBadge: 'P1', phaseColor: 'navy' },
      { slug: 'p2', label: 'Discover & Diagnose', phaseBadge: 'P2', phaseColor: 'navy' },
      { slug: 'p3', label: 'Design Future State', phaseBadge: 'P3', phaseColor: 'navy' },
      { slug: 'p4', label: 'Roadmap & Biz Case', phaseBadge: 'P4', phaseColor: 'navy' },
      { slug: 'p5', label: 'Mobilize & Handoff', phaseBadge: 'P5', phaseColor: 'teal' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'gates', label: 'Gates & evidence' },
      { slug: 'tower', label: 'Control Tower' },
      { slug: 'glossary', label: 'Glossary' },
    ],
  },
];

export function flatLearnItems(): LearnNavItem[] {
  return LEARN_NAV.flatMap((g) => g.items);
}

export function findLearnNavItem(slug: string): LearnNavItem | null {
  return flatLearnItems().find((i) => i.slug === slug) ?? null;
}
