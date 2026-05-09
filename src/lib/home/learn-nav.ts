// Learn guide navigation structure.
// Drives both the left sidebar and the [section] route lookup.

export interface LearnNavItem {
  slug: string;
  label: string;
  phaseBadge?: string;   // e.g. "P0", "P1"
  phaseColor?: 'grey' | 'navy' | 'teal' | 'amber';
  /**
   * Optional stage badge for Source lifecycle chapters (e.g. "01" for
   * Stage 1 Strategy). Mirrors the field on the legacy Source primer
   * nav (src/lib/source/learn/learn-nav.ts) so the unified guide can
   * render Source chapters with the same affordance the standalone
   * primer used.
   */
  stageBadge?: string;
  stageColor?: 'grey' | 'navy' | 'teal' | 'amber';
  /**
   * Optional kind hint for the side nav. Currently only the
   * `caseStudy` value is meaningful — it lets the side nav anchor a
   * group of indented chapter entries below the "Meridian Cloud · case
   * study" link so the hierarchy is obvious.
   */
  kind?: 'caseStudy';
  /**
   * When true, the side nav indents this item slightly to indicate it
   * belongs underneath a parent case-study entry. Visual treatment is
   * intentionally subtle — a small left-margin + connecting line.
   */
  indent?: boolean;
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
    // Source primer · folded into the unified guide so all training
    // lives at a single URL surface (/home/learn). The standalone
    // /source/learn route now redirects here.
    //
    // Slug convention: nested under `source/` so the `[section]/[slug]`
    // route can dispatch on a stable prefix without colliding with the
    // top-level guide section slugs (welcome, setup, intelligence …).
    group: 'Source',
    items: [
      { slug: 'source/welcome', label: 'Welcome & overview' },
      { slug: 'source/intake', label: 'Creating your first event' },
      { slug: 'source/sentinel', label: 'Working with Sentinel' },
      // Case study anchor — chapters below indent under it.
      { slug: 'source/case-study', label: 'Meridian Cloud · case study', kind: 'caseStudy' },
      { slug: 'source/strategy', label: 'Ch.01 Strategy', stageBadge: '01', stageColor: 'grey', indent: true },
      { slug: 'source/scope', label: 'Ch.02 Scope', stageBadge: '02', stageColor: 'grey', indent: true },
      { slug: 'source/rfp', label: 'Ch.03 RFP', stageBadge: '03', stageColor: 'navy', indent: true },
      { slug: 'source/responses', label: 'Ch.04 Responses', stageBadge: '04', stageColor: 'navy', indent: true },
      { slug: 'source/evaluation', label: 'Ch.05 Evaluation', stageBadge: '05', stageColor: 'navy', indent: true },
      { slug: 'source/pricing', label: 'Ch.06 Pricing', stageBadge: '06', stageColor: 'navy', indent: true },
      { slug: 'source/bafo', label: 'Ch.07 BAFO', stageBadge: '07', stageColor: 'navy', indent: true },
      { slug: 'source/decision', label: 'Ch.08 Decision', stageBadge: '08', stageColor: 'amber', indent: true },
      { slug: 'source/selection', label: 'Ch.09 Selection', stageBadge: '09', stageColor: 'teal', indent: true },
      { slug: 'source/transition', label: 'Ch.10 Transition', stageBadge: '10', stageColor: 'teal', indent: true },
      { slug: 'source/value', label: 'Ch.11 Value', stageBadge: '11', stageColor: 'teal', indent: true },
      { slug: 'source/glossary', label: 'Glossary & pitfalls' },
      { slug: 'source/gates', label: 'Gates & evidence' },
      { slug: 'source/exports', label: 'Export formats' },
      { slug: 'source/tower', label: 'After the event' },
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
