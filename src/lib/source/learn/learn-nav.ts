// Source Learn primer · navigation structure.
//
// Drives the left sidebar on /source/learn/* and the [slug] route
// lookup. Mirrors the shape of src/lib/home/learn-nav.ts so the two
// surfaces feel native together.
//
// Slice S1 ships the four framing pages (welcome / intake / sentinel
// / glossary). Slice S2 replaces the abstract per-stage walkthroughs
// with a single end-to-end case study — Meridian Health's $8M Cloud
// & Infrastructure event — broken into 11 chapters that map 1:1 to
// the canonical Source stages but read as one connected narrative.

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
    group: 'Meridian Case Study',
    items: [
      { slug: 'case-study', label: 'Case study · overview' },
      {
        slug: 'strategy',
        label: 'Ch.01 Strategy · CTO names the trigger',
        stageBadge: '01',
        stageColor: 'grey',
      },
      {
        slug: 'scope',
        label: 'Ch.02 Scope · 280 workloads, DR boundary',
        stageBadge: '02',
        stageColor: 'grey',
      },
      {
        slug: 'rfp',
        label: 'Ch.03 RFP · Sentinel composes d09',
        stageBadge: '03',
        stageColor: 'navy',
      },
      {
        slug: 'responses',
        label: 'Ch.04 Responses · Vendor C drops',
        stageBadge: '04',
        stageColor: 'navy',
      },
      {
        slug: 'evaluation',
        label: 'Ch.05 Evaluation · Blind scoring',
        stageBadge: '05',
        stageColor: 'navy',
      },
      {
        slug: 'pricing',
        label: 'Ch.06 Pricing · 3 P0 traps surface',
        stageBadge: '06',
        stageColor: 'navy',
      },
      {
        slug: 'bafo',
        label: 'Ch.07 BAFO · Vendor A drops, B wins',
        stageBadge: '07',
        stageColor: 'navy',
      },
      {
        slug: 'decision',
        label: 'Ch.08 Decision · CTO + CFO sign d24',
        stageBadge: '08',
        stageColor: 'amber',
      },
      {
        slug: 'selection',
        label: 'Ch.09 Selection · Winner + loser letters',
        stageBadge: '09',
        stageColor: 'teal',
      },
      {
        slug: 'transition',
        label: 'Ch.10 Transition · 2-month slip',
        stageBadge: '10',
        stageColor: 'teal',
      },
      {
        slug: 'value',
        label: 'Ch.11 Value · $11.2M of $14.4M',
        stageBadge: '11',
        stageColor: 'teal',
      },
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

/** Ordered list of the 11 case study chapter slugs (Strategy → Value). */
export const CASE_STUDY_CHAPTER_SLUGS: ReadonlyArray<string> = [
  'strategy',
  'scope',
  'rfp',
  'responses',
  'evaluation',
  'pricing',
  'bafo',
  'decision',
  'selection',
  'transition',
  'value',
];

export interface CaseStudyNeighbors {
  prev: SourceLearnNavItem | null;
  next: SourceLearnNavItem | null;
}

/**
 * Returns the previous + next chapter for a given case study slug, used
 * to render "Previous chapter" / "Next chapter" links at the bottom of
 * each chapter component for read-it-as-one-story flow.
 *
 * Chapter 1 (`strategy`) has prev = the case study overview.
 * Chapter 11 (`value`) has next = null (end of story).
 */
export function caseStudyChapterNeighbors(
  slug: string,
): CaseStudyNeighbors {
  const idx = CASE_STUDY_CHAPTER_SLUGS.indexOf(slug);
  if (idx < 0) return { prev: null, next: null };
  const prevSlug =
    idx === 0 ? 'case-study' : CASE_STUDY_CHAPTER_SLUGS[idx - 1];
  const nextSlug =
    idx === CASE_STUDY_CHAPTER_SLUGS.length - 1
      ? null
      : CASE_STUDY_CHAPTER_SLUGS[idx + 1];
  return {
    prev: prevSlug ? findSourceLearnNavItem(prevSlug) : null,
    next: nextSlug ? findSourceLearnNavItem(nextSlug) : null,
  };
}
