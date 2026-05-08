// Source Learn primer · navigation structure.
//
// Drives the left sidebar on /source/learn/* and the [slug] route
// lookup. Mirrors the shape of src/lib/home/learn-nav.ts so the two
// surfaces feel native together.
//
// Slice S1 ships the four framing pages (welcome / intake / sentinel
// / glossary). Future slices add the 11 stage walkthroughs (one per
// canonical Source stage) + Gates / Exports / Tower-after-source.

export interface SourceLearnNavItem {
  slug: string;
  label: string;
  /** Optional stage badge (e.g. "01" for Stage 1 Strategy). */
  stageBadge?: string;
  stageColor?: 'grey' | 'navy' | 'teal' | 'amber';
}

export interface SourceLearnNavGroup {
  group: string;
  items: SourceLearnNavItem[];
}

export const SOURCE_LEARN_NAV: ReadonlyArray<SourceLearnNavGroup> = [
  {
    group: 'Getting Started',
    items: [
      { slug: 'welcome', label: 'Welcome & overview' },
      { slug: 'intake', label: 'Creating your first event' },
      { slug: 'sentinel', label: 'Working with Sentinel' },
    ],
  },
  {
    group: 'Lifecycle',
    items: [
      { slug: 'strategy', label: 'Strategy', stageBadge: '01', stageColor: 'grey' },
      { slug: 'scope', label: 'Scope', stageBadge: '02', stageColor: 'grey' },
      { slug: 'rfp', label: 'RFP', stageBadge: '03', stageColor: 'navy' },
      { slug: 'responses', label: 'Responses', stageBadge: '04', stageColor: 'navy' },
      { slug: 'evaluation', label: 'Evaluation', stageBadge: '05', stageColor: 'navy' },
      { slug: 'pricing', label: 'Pricing', stageBadge: '06', stageColor: 'navy' },
      { slug: 'bafo', label: 'BAFO', stageBadge: '07', stageColor: 'navy' },
      { slug: 'decision', label: 'Executive Decision', stageBadge: '08', stageColor: 'amber' },
      { slug: 'selection', label: 'Selection', stageBadge: '09', stageColor: 'teal' },
      { slug: 'transition', label: 'Transition', stageBadge: '10', stageColor: 'teal' },
      { slug: 'value', label: 'Value', stageBadge: '11', stageColor: 'teal' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'gates', label: 'Gates & evidence' },
      { slug: 'exports', label: 'Export formats' },
      { slug: 'tower', label: 'After the event' },
      { slug: 'glossary', label: 'Glossary & pitfalls' },
    ],
  },
];

export function flatSourceLearnItems(): SourceLearnNavItem[] {
  return SOURCE_LEARN_NAV.flatMap((g) => g.items);
}

export function findSourceLearnNavItem(
  slug: string,
): SourceLearnNavItem | null {
  return flatSourceLearnItems().find((i) => i.slug === slug) ?? null;
}
