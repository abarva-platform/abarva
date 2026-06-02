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
   * group of indented chapter entries below the Apex Retail Source
   * case study link so the hierarchy is obvious.
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
    ],
  },
  {
    group: 'Admin Guide',
    items: [
      { slug: 'admin', label: 'Admin workspace & connectors' },
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
      { slug: 'case-study', label: '↗ Case study: $35M Move' },
      { slug: 'moves-overview', label: 'What is a Move?' },
      { slug: 'first-move', label: 'Your first Move walkthrough' },
      { slug: 'nexus-guide', label: 'Working with Nexus' },
      { slug: 'moves-reference', label: 'Quick reference card' },
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
    // top-level guide section slugs (welcome, admin, intelligence ...).
    group: 'Source',
    items: [
      { slug: 'source/welcome', label: 'Welcome & overview' },
      { slug: 'source/intake', label: 'Creating your first event' },
      { slug: 'source/sentinel', label: 'Working with Sentinel' },
      // Apex Retail case study — $35M AMS Outsourcing 2026
      { slug: 'source/apex-retail-case-study', label: 'Apex Retail · $35M AMS', kind: 'caseStudy' },
      { slug: 'source/apex-strategy',   label: 'Ch.01 Strategy',         stageBadge: '01', stageColor: 'grey',  indent: true },
      { slug: 'source/apex-scope',      label: 'Ch.02 Scope',            stageBadge: '02', stageColor: 'grey',  indent: true },
      { slug: 'source/apex-rfp',        label: 'Ch.03 RFP',              stageBadge: '03', stageColor: 'navy',  indent: true },
      { slug: 'source/apex-responses',  label: 'Ch.04 Responses',        stageBadge: '04', stageColor: 'navy',  indent: true },
      { slug: 'source/apex-evaluation', label: 'Ch.05 Evaluation',       stageBadge: '05', stageColor: 'navy',  indent: true },
      { slug: 'source/apex-pricing',    label: 'Ch.06 Pricing',          stageBadge: '06', stageColor: 'navy',  indent: true },
      { slug: 'source/apex-bafo',       label: 'Ch.07 BAFO · active',    stageBadge: '07', stageColor: 'amber', indent: true },
      { slug: 'source/apex-decision',   label: 'Ch.08 Decision · pending', stageBadge: '08', stageColor: 'grey', indent: true },
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
