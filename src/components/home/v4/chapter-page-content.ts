import type { ChapterId } from "@/lib/home/preview/types";
import {
  applicationTables,
  applicationFindings,
  vendorTables,
  vendorFindings,
  metricTables,
  metricFindings,
  riskTables,
  riskFindings,
  programTables,
  programFindings,
  aiTables,
  aiFindings,
  organizationTables,
  organizationFindings,
  infrastructureTables,
  infrastructureFindings,
  dataTables,
  dataFindings,
  dropUndeclaredColumns,
  unsupportedApplicationViews,
  unsupportedAiViews,
  type EstateRow,
  type Finding,
  type TableSpec,
  type UnsupportedView,
} from "./page-tables";

/**
 * Which estate rows each chapter's depth is computed from.
 *
 * A chapter's tables are not authored and not generated: they are a filter over rows that ship in
 * the bundle. That is why they cannot go stale relative to the record, and why a reader who doubts
 * one can open the same rows in the record browser.
 *
 * A chapter absent from this map gets no table set. That is a deliberate omission rather than a
 * gap: those chapters answer questions the estate files do not carry.
 */
const CHAPTER_SOURCES: Partial<
  Record<
    ChapterId,
    Array<
      | "applications"
      | "vendors"
      | "infrastructure"
      | "data"
      | "metrics"
      | "risks"
      | "programs"
      | "ai"
      | "organization"
    >
  >
> = {
  // Applications are described here and nowhere else. Two chapters both drawing their tables from
  // the same family produced five identical tables under two different questions, which reads as a
  // page that does not know what it is for.
  technology_data: ["applications", "data"],
  // Performance and Value is the metrics surface; What Needs Attention is the register. Both were
  // unreachable until the projection carried these families.
  how_we_operate: ["organization", "infrastructure"],
  what_needs_attention: ["risks", "infrastructure"],
  performance_value: ["metrics", "vendors"],
  strategy_value_creation: ["programs", "ai", "vendors"],
};

type EstateFamily = NonNullable<(typeof CHAPTER_SOURCES)[ChapterId]>[number];

/**
 * Whether a chapter's argument is built on a given family of rows.
 *
 * A chart drawn wherever its data happens to exist is decoration. A renewal timeline under "what do
 * leaders agree on" answers nothing that chapter asked. This is the test for whether an exhibit
 * belongs to the argument on the page rather than merely to the bundle behind it.
 */
export function chapterArguesFrom(
  chapterId: ChapterId,
  family: EstateFamily,
): boolean {
  return (CHAPTER_SOURCES[chapterId] ?? []).includes(family);
}

export interface EstateRecordTypes {
  /** The record's own as-of date, threaded so time-relative findings measure against the record. */
  asOf?: string;
  metrics?: EstateRow[];
  risks?: EstateRow[];
  programs?: EstateRow[];
  ai?: EstateRow[];
  organization?: EstateRow[];
  applications?: EstateRow[];
  vendors?: EstateRow[];
  infrastructure?: EstateRow[];
  data?: EstateRow[];
}

export interface ChapterDepth {
  tables: TableSpec[];
  findings: Finding[];
  /** Views the rows could not support, named so absence reads as plumbing rather than as fact. */
  unsupported: UnsupportedView[];
}

const BUILDERS = {
  applications: { tables: applicationTables, findings: applicationFindings },
  vendors: { tables: vendorTables, findings: vendorFindings },
  infrastructure: {
    tables: infrastructureTables,
    findings: infrastructureFindings,
  },
  data: { tables: dataTables, findings: dataFindings },
  metrics: { tables: metricTables, findings: metricFindings },
  risks: { tables: riskTables, findings: riskFindings },
  programs: { tables: programTables, findings: programFindings },
  ai: { tables: aiTables, findings: aiFindings },
  organization: { tables: organizationTables, findings: organizationFindings },
} as const;

/**
 * Families a chapter draws findings from, beyond the ones it tabulates.
 *
 * What Needs Attention reasons about applications -- the PHI-on-local-accounts exposure is an
 * application finding -- without repeating the descriptive application tables that belong to
 * Technology & Data. A finding is an argument; a table is a description. They do not have to come
 * from the same family.
 */
const EXTRA_FINDING_SOURCES: Partial<Record<ChapterId, EstateFamily[]>> = {
  what_needs_attention: ["applications"],
};

function depthForSources(
  sources: readonly EstateFamily[],
  estate: EstateRecordTypes,
): ChapterDepth {
  const tables: TableSpec[] = [];
  const findings: Finding[] = [];
  const unsupported: UnsupportedView[] = [];
  for (const source of sources) {
    const rows = estate[source];
    if (!rows || rows.length === 0) continue;
    // Applied here rather than in each builder, so neither an empty table nor a column of dashes
    // can reach a reader from a family nobody thought to check.
    //
    // A table grouped on a column the record does not carry produces no rows and a total of zero,
    // and reads as a result: "0 blocked claims", "0 platforms without recovery". That is the most
    // flattering possible misreading of an absent column. Such a table is not rendered; it is
    // reported as a view the rows could not support, which is what it is.
    for (const table of BUILDERS[source].tables(rows)) {
      if (table.rows.length === 0) {
        unsupported.push({
          caption: table.caption,
          missingColumn: table.columns[0],
          why: `No row in this family declares ${table.columns[0].toLowerCase()}, so the table has nothing to group. An empty table with a total of zero would read as a result rather than as an absent column.`,
        });
        continue;
      }
      tables.push(dropUndeclaredColumns(table));
    }
    findings.push(
      ...(source === "vendors"
        ? vendorFindings(rows, estate.asOf)
        : BUILDERS[source].findings(rows)),
    );
    if (source === "applications")
      unsupported.push(...unsupportedApplicationViews(rows));
    if (source === "ai") unsupported.push(...unsupportedAiViews(rows));
  }
  // A finding repeated across two source families says nothing twice; keep the first.
  const seen = new Set<string>();
  return {
    tables,
    findings: findings.filter((f) =>
      seen.has(f.claim) ? false : (seen.add(f.claim), true),
    ),
    unsupported,
  };
}

export function chapterDepth(
  chapterId: ChapterId,
  estate: EstateRecordTypes,
): ChapterDepth {
  const depth = depthForSources(CHAPTER_SOURCES[chapterId] ?? [], estate);
  const extra = EXTRA_FINDING_SOURCES[chapterId];
  if (!extra) return depth;
  const seen = new Set(depth.findings.map((f) => f.claim));
  return {
    ...depth,
    findings: [
      ...depth.findings,
      ...depthForSources(extra, estate).findings.filter(
        (f) => !seen.has(f.claim),
      ),
    ],
  };
}
