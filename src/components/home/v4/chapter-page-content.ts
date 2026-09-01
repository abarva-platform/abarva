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
  technology_data: ["applications", "data"],
  // Performance and Value is the metrics surface; What Needs Attention is the register. Both were
  // unreachable until the projection carried these families.
  how_we_operate: ["organization", "infrastructure"],
  what_needs_attention: ["risks", "applications", "infrastructure"],
  performance_value: ["metrics", "vendors"],
  strategy_value_creation: ["programs", "ai", "vendors"],
};

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

type EstateFamily = NonNullable<(typeof CHAPTER_SOURCES)[ChapterId]>[number];

/**
 * The projection names an object type; the depth engine names a family. One map, so a family that
 * arrives in the bundle cannot be silently unreachable to a page that asks for it.
 */
const OBJECT_TYPE_FAMILY: Record<string, EstateFamily> = {
  application_system: "applications",
  vendor_contract: "vendors",
  infrastructure_platform: "infrastructure",
  data_asset_or_integration: "data",
  metric_outcome: "metrics",
  risk_control: "risks",
  program_initiative: "programs",
  ai_use_case: "ai",
  organization_ownership: "organization",
};

/**
 * Every estate family the bundle carries, keyed for the depth engine.
 *
 * Built once from the bundle rather than assembled at each call site: a family added to the
 * projection reaches every surface at the same moment, instead of reaching whichever call site
 * someone remembered to update.
 */
export function estateFromBundle(bundle: {
  provenance?: { generated_at?: string } | null;
  technologyEstate?: {
    recordTypes: Array<{ objectType: string; rows: unknown[] }>;
  };
}): EstateRecordTypes {
  const estate: EstateRecordTypes = {
    asOf: bundle.provenance?.generated_at?.slice(0, 10),
  };
  for (const recordType of bundle.technologyEstate?.recordTypes ?? []) {
    const family = OBJECT_TYPE_FAMILY[recordType.objectType];
    if (family) estate[family] = recordType.rows as EstateRow[];
  }
  return estate;
}

function depthForSources(
  sources: EstateFamily[],
  estate: EstateRecordTypes,
): ChapterDepth {
  const tables: TableSpec[] = [];
  const findings: Finding[] = [];
  const unsupported: UnsupportedView[] = [];
  for (const source of sources) {
    const rows = estate[source];
    if (!rows || rows.length === 0) continue;
    tables.push(...BUILDERS[source].tables(rows));
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
  return depthForSources(CHAPTER_SOURCES[chapterId] ?? [], estate);
}

/**
 * Depth for a story section, which spans more than one chapter.
 *
 * A section whose narrative was never planned still has its rows in the bundle. This is what lets
 * such a section report what the record says instead of reporting that nobody wrote about it.
 */
export function sectionDepth(
  chapterIds: readonly ChapterId[],
  estate: EstateRecordTypes,
): ChapterDepth {
  const sources: EstateFamily[] = [];
  for (const chapterId of chapterIds)
    for (const source of CHAPTER_SOURCES[chapterId] ?? [])
      if (!sources.includes(source)) sources.push(source);
  return depthForSources(sources, estate);
}
