/**
 * What a number is made of.
 *
 * A portal shows a figure. A context layer has to say how much to trust it, and the reason is
 * visible on the live page today: it reports 750 applications while the estate file carries 306
 * rows. Neither is labelled, so a reader cannot tell whether that is a contradiction, a different
 * population, or a different grain -- and those are three different problems with three different
 * fixes.
 *
 * So every rendered figure carries four things, not one:
 *
 *   VALUE      the number
 *   GRAIN      what one row means -- the single most common reason two honest counts differ
 *   FILTER     the rule applied, stated so a reader can reproduce it
 *   AGREEMENT  single source, corroborated, or in conflict -- and when in conflict, WHY
 *
 * The grain field exists because "how we group" decides the answer before any arithmetic happens.
 * One row per application and one row per deployed instance are both correct counts of different
 * things; presenting either as "the number of applications" without its grain is how a governed
 * surface states something false out of two true facts.
 */

export type Agreement = "single_source" | "corroborated" | "conflict";

export interface LineageSource {
  /** The intake file, named as the reader would find it. */
  file: string;
  /** Rows in that file that the figure was computed from. */
  rows: number;
  /** The rule applied, in words a reader can reproduce against the file. */
  filter?: string;
}

export interface DisagreeingFigure {
  value: string | number;
  source: string;
  /** Why the two differ. A conflict with no stated reason is an unfinished investigation. */
  reason: string;
  /** True when the difference is explained by grain or population rather than by error. */
  reconciled: boolean;
}

export interface FactLineage {
  value: string | number;
  label: string;
  /**
   * The rows behind the figure, openable.
   *
   * Without this the trace is a promise a reader has to take on faith. With it, "every figure is a
   * filter over a named file" becomes a control they can operate: one move to the rows, filtered
   * and labelled.
   */
  openRows?: { objectType: string; filter: string };
  /** What one row means. Never omitted -- a count without a grain is not a fact. */
  grain: string;
  sources: LineageSource[];
  agreement: Agreement;
  disagreements?: DisagreeingFigure[];
}

/**
 * Whether a figure may be quoted, and what a reader must be told when it is.
 *
 * An unreconciled conflict is not quotable at any confidence: the honest rendering is both numbers
 * and the open question. A conflict whose reason is understood IS quotable, provided the grain
 * travels with it -- that is the difference between "two sources disagree" and "two sources count
 * different things", and collapsing them is how a false precision gets onto a page.
 */
export function quotability(lineage: FactLineage): {
  quotable: boolean;
  qualifier: string | null;
  tone: Agreement;
} {
  if (lineage.agreement === "conflict") {
    const unreconciled = (lineage.disagreements ?? []).filter(
      (d) => !d.reconciled,
    );
    if (unreconciled.length > 0) {
      return {
        quotable: false,
        qualifier: `Not quotable — ${unreconciled.length === 1 ? "another source reports" : "other sources report"} ${unreconciled
          .map((d) => d.value)
          .join(" and ")}, and the difference is not explained.`,
        tone: "conflict",
      };
    }
    return {
      quotable: true,
      qualifier: `Quotable with its grain: ${lineage.grain}. Other counts of the same subject measure something else.`,
      tone: "conflict",
    };
  }
  if (lineage.agreement === "single_source") {
    return {
      quotable: true,
      qualifier: `One source. ${lineage.sources[0]?.file ?? "unnamed"} is the only file asserting this.`,
      tone: "single_source",
    };
  }
  return {
    quotable: true,
    qualifier: `Corroborated across ${lineage.sources.length} sources.`,
    tone: "corroborated",
  };
}

/** A one-line trace a reader can act on: the files, the rule, and the grain. */
export function traceLine(lineage: FactLineage): string {
  const files = lineage.sources
    .map((s) =>
      s.rows > 0 ? `${s.file} (${s.rows.toLocaleString()} rows)` : s.file,
    )
    .join(" + ");
  const filter = lineage.sources.find((s) => s.filter)?.filter;
  return [
    files,
    filter ? `filtered to ${filter}` : null,
    `one row = ${lineage.grain}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ------------------------------------------------------------------------------------------------
 * Building lineage from the estate rows the bundle carries
 * ---------------------------------------------------------------------------------------------- */

export interface LineageInput {
  rows: Array<Record<string, unknown>>;
  file: string;
  grain: string;
}

/**
 * Lineage for a count of rows matching a rule.
 *
 * `contradictedBy` is how a figure declares the other counts of its own subject that a reader may
 * have seen elsewhere in the product. Passing one with a reason marks the difference reconciled;
 * passing one without leaves it open, and the figure stops being quotable -- which is the correct
 * outcome, because an unexplained disagreement between two governed surfaces is a defect, not a
 * nuance to render around.
 */
export function countLineage(
  input: LineageInput,
  label: string,
  options: {
    filter?: string;
    matches?: (row: Record<string, unknown>) => boolean;
    contradictedBy?: DisagreeingFigure[];
  } = {},
): FactLineage {
  const matched = options.matches
    ? input.rows.filter(options.matches)
    : input.rows;
  const disagreements = options.contradictedBy ?? [];
  return {
    value: matched.length,
    label,
    grain: input.grain,
    sources: [
      { file: input.file, rows: input.rows.length, filter: options.filter },
    ],
    agreement: disagreements.length > 0 ? "conflict" : "single_source",
    disagreements: disagreements.length > 0 ? disagreements : undefined,
  };
}

/**
 * The application-count lineage, carrying the disagreement the live product actually has.
 *
 * The estate file is one row per application record. Another surface reports a larger figure drawn
 * from a configuration-management extract, which counts deployed instances -- the same subject at a
 * different grain. Stating that is the whole job: a reader who sees 306 on one page and a bigger
 * number on another needs the reason, not a reconciliation that quietly picks a winner.
 */
export function applicationCountLineage(
  rows: Array<Record<string, unknown>>,
  otherReportedCount?: number,
): FactLineage {
  const disagreements: DisagreeingFigure[] =
    otherReportedCount && otherReportedCount !== rows.length
      ? [
          {
            value: otherReportedCount,
            source: "configuration-management extract",
            reason:
              "That extract is one row per deployed instance, so a single application running in production, test and disaster recovery counts three times. It is a count of deployments, not of applications.",
            reconciled: true,
          },
        ]
      : [];
  return {
    value: rows.length,
    label: "applications in the governed current-state estate",
    grain: "one application record",
    sources: [{ file: "04_applications_systems.csv", rows: rows.length }],
    agreement: disagreements.length > 0 ? "conflict" : "single_source",
    disagreements: disagreements.length > 0 ? disagreements : undefined,
  };
}
