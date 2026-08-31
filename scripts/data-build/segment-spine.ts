/**
 * The cross-domain segment table.
 *
 * Segmenting one domain answers a question about that domain. Segmenting every domain onto the same
 * declared spine answers the question an executive is actually holding: this segment carries 40% of
 * the revenue -- what share of the applications, the spend, the programs, the risk and the people
 * does it get, and does that look deliberate?
 *
 * The spine is declared in `01b_business_segments.csv`, with a revenue share and a named P&L owner
 * per segment. It is not derived here and it is not a model's opinion. `10_ai_automation_use_cases`
 * already carries the same vocabulary, so AI joins natively; everything else joins through the
 * business function it names.
 *
 * Deterministic throughout. Every cell is a filter over a source file.
 */

export interface DeclaredSegment {
  segmentKey: string;
  segmentName: string;
  revenueSharePct: number;
  revenueUsd: number;
  pnlOwnerRole: string;
}

export interface FunctionSegmentMap {
  [businessFunction: string]: { segment_key: string; clinical: boolean; office: string; contested?: string };
}

/** One domain's contribution to a segment. `unresolved` names what could not be joined. */
export interface DomainContribution {
  domain: string;
  /** count of records attributed to each segment */
  bySegment: Record<string, number>;
  /** money attributed to each segment, where the domain carries money */
  moneyBySegment?: Record<string, number>;
  moneyLabel?: string;
  unresolved: string[];
}

export interface SegmentRow {
  segmentKey: string;
  segmentName: string;
  revenueSharePct: number;
  revenueUsd: number;
  pnlOwnerRole: string;
  domains: Record<string, { count: number; money?: number }>;
}

export interface SegmentSpineReport {
  segments: SegmentRow[];
  unattributed: Record<string, number>;
  /** Domains whose join key did not resolve, named rather than dropped. */
  unresolvedByDomain: Record<string, string[]>;
  /** Share comparisons against declared revenue share -- the point of the whole table. */
  shareVsRevenue: Array<{
    segmentKey: string;
    revenueSharePct: number;
    shares: Record<string, { sharePct: number; gapVsRevenue: number }>;
  }>;
}

const UNATTRIBUTED = "Unattributed";

/**
 * Attributes a domain's records to segments through the business function each record names.
 * `resolveFunction` lets a domain point at whichever of its columns carries the function, and a
 * record whose function is not in the declared map is named in `unresolved` rather than silently
 * dropped or bucketed -- an estate that is 30% unattributed must read as 30% unattributed.
 */
export function attributeByFunction<T>(
  domain: string,
  records: T[],
  map: FunctionSegmentMap,
  resolveFunction: (record: T) => string,
  resolveMoney?: (record: T) => number,
): DomainContribution {
  const bySegment: Record<string, number> = {};
  const moneyBySegment: Record<string, number> = {};
  const unresolved = new Set<string>();

  for (const record of records) {
    const fn = resolveFunction(record).trim();
    const entry = map[fn];
    const key = entry?.segment_key ?? UNATTRIBUTED;
    if (fn && !entry) unresolved.add(fn);
    bySegment[key] = (bySegment[key] ?? 0) + 1;
    if (resolveMoney) moneyBySegment[key] = (moneyBySegment[key] ?? 0) + resolveMoney(record);
  }

  return {
    domain,
    bySegment,
    moneyBySegment: resolveMoney ? moneyBySegment : undefined,
    unresolved: [...unresolved].sort(),
  };
}

/** Attributes records that already declare a segment name -- the AI use-case file does this. */
export function attributeByDeclaredSegment<T>(
  domain: string,
  records: T[],
  segments: DeclaredSegment[],
  resolveSegmentName: (record: T) => string,
): DomainContribution {
  const byName = new Map(segments.map((segment) => [segment.segmentName.toLowerCase(), segment.segmentKey]));
  const bySegment: Record<string, number> = {};
  const unresolved = new Set<string>();

  for (const record of records) {
    const name = resolveSegmentName(record).trim();
    const key = byName.get(name.toLowerCase()) ?? UNATTRIBUTED;
    if (name && !byName.has(name.toLowerCase())) unresolved.add(name);
    bySegment[key] = (bySegment[key] ?? 0) + 1;
  }

  return { domain, bySegment, unresolved: [...unresolved].sort() };
}

export function buildSegmentSpine(
  segments: DeclaredSegment[],
  contributions: DomainContribution[],
): SegmentSpineReport {
  const rows: SegmentRow[] = segments.map((segment) => ({
    ...segment,
    domains: Object.fromEntries(
      contributions.map((c) => [
        c.domain,
        { count: c.bySegment[segment.segmentKey] ?? 0, money: c.moneyBySegment?.[segment.segmentKey] },
      ]),
    ),
  }));

  const unattributed = Object.fromEntries(
    contributions.map((c) => [c.domain, c.bySegment[UNATTRIBUTED] ?? 0]),
  );

  // Share of each domain that lands in a segment, against that segment's declared revenue share.
  // A negative gap says the segment gets less of that resource than its revenue would suggest.
  const shareVsRevenue = segments.map((segment) => ({
    segmentKey: segment.segmentKey,
    revenueSharePct: segment.revenueSharePct,
    shares: Object.fromEntries(
      contributions.map((c) => {
        const attributed = Object.entries(c.bySegment)
          .filter(([key]) => key !== UNATTRIBUTED)
          .reduce((sum, [, n]) => sum + n, 0);
        const mine = c.bySegment[segment.segmentKey] ?? 0;
        const sharePct = attributed ? round(100 * mine / attributed) : 0;
        return [c.domain, { sharePct, gapVsRevenue: round(sharePct - segment.revenueSharePct) }];
      }),
    ),
  }));

  return {
    segments: rows,
    unattributed,
    unresolvedByDomain: Object.fromEntries(contributions.filter((c) => c.unresolved.length).map((c) => [c.domain, c.unresolved])),
    shareVsRevenue,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
