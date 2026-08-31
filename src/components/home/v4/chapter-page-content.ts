import type { ChapterId } from "@/lib/home/preview/types";
import {
  applicationTables,
  applicationFindings,
  vendorTables,
  vendorFindings,
  infrastructureTables,
  infrastructureFindings,
  dataTables,
  dataFindings,
  unsupportedApplicationViews,
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
    Array<"applications" | "vendors" | "infrastructure" | "data">
  >
> = {
  technology_data: ["applications", "data"],
  how_we_operate: ["infrastructure", "applications"],
  what_needs_attention: ["applications", "infrastructure"],
  performance_value: ["vendors"],
  strategy_value_creation: ["vendors", "applications"],
};

export interface EstateRecordTypes {
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
} as const;

export function chapterDepth(
  chapterId: ChapterId,
  estate: EstateRecordTypes,
): ChapterDepth {
  const sources = CHAPTER_SOURCES[chapterId] ?? [];
  const tables: TableSpec[] = [];
  const findings: Finding[] = [];
  const unsupported: UnsupportedView[] = [];
  for (const source of sources) {
    const rows = estate[source];
    if (!rows || rows.length === 0) continue;
    tables.push(...BUILDERS[source].tables(rows));
    findings.push(...BUILDERS[source].findings(rows));
    if (source === "applications")
      unsupported.push(...unsupportedApplicationViews(rows));
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
