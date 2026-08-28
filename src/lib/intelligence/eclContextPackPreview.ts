import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";

interface IntelligenceEclContextPackRow {
  row_key: string;
  surface_key: string;
  retrieval_state: string;
  value_state: string;
  quality_state: string;
  access_class: string;
  prompt_context_json: Record<string, unknown>;
  permitted_facts_json: unknown[];
  blocked_facts_json: unknown[];
  citation_refs_json: unknown[];
  gap_flags_json: unknown[];
  source_hash: string;
}

interface IntelligenceServingRow {
  readonly surface_key: string;
  readonly row_key: string;
  readonly payload_json: IntelligenceEclContextPackRow;
}

export interface IntelligenceEclContextPackPreview {
  provider: "ecl_projection_db";
  tenantKey: string;
  assessmentId: string;
  rowCount: number;
  retrievalCounts: Array<{ retrievalState: string; count: number }>;
  accessCounts: Array<{ accessClass: string; count: number }>;
  qualityCounts: Array<{ qualityState: string; count: number }>;
  totals: {
    permittedFacts: number;
    blockedFacts: number;
    citations: number;
    gaps: number;
  };
  contextRows: Array<{
    rowKey: string;
    surfaceKey: string;
    title: string;
    summary: string;
    retrievalState: string;
    valueState: string;
    qualityState: string;
    accessClass: string;
    permittedFactCount: number;
    blockedFactCount: number;
    citationCount: number;
    gapCount: number;
    sourceHash: string;
  }>;
}

function countBy<T extends string>(
  rows: IntelligenceEclContextPackRow[],
  key: (row: IntelligenceEclContextPackRow) => T,
): Array<{ key: T; count: number }> {
  const counts = new Map<T, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ key: name, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function displayLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function displayTitle(row: IntelligenceEclContextPackRow): string {
  const payload = row.prompt_context_json ?? {};
  return (
    textValue(payload.title) ??
    textValue(payload.name) ??
    textValue(payload.heading) ??
    textValue(payload.topic) ??
    row.row_key
  );
}

function displaySummary(row: IntelligenceEclContextPackRow): string {
  const payload = row.prompt_context_json ?? {};
  const summary =
    textValue(payload.summary) ??
    textValue(payload.executive_summary) ??
    textValue(payload.context) ??
    textValue(payload.description);

  if (summary) return summary;

  const permittedFacts = countArray(row.permitted_facts_json);
  const citationRefs = countArray(row.citation_refs_json);
  const blockedFacts = countArray(row.blocked_facts_json);
  const gaps = countArray(row.gap_flags_json);

  return (
    `${permittedFacts} permitted facts, ${citationRefs} citation references, ` +
    `${blockedFacts} blocked facts and ${gaps} explicit gaps. ` +
    `Retrieval is ${displayLabel(row.retrieval_state)}; ` +
    `access is ${displayLabel(row.access_class)}.`
  );
}

export async function readIntelligenceEclContextPackPreview(
  tenantKey: string | null,
): Promise<IntelligenceEclContextPackPreview | null> {
  if (!tenantKey) return null;
  const assessmentId = denseAssessmentIdForTenant(tenantKey);

  const servingRows = await azureRead.query<IntelligenceServingRow>(
    `select payload_json
       from (
         select surface_key, row_key, payload_json
           from serving.intelligence_advisory
          where tenant_key = $1 and assessment_id = $2
          union all
         select surface_key, row_key, payload_json
           from serving.intelligence_enterprise_landscape
          where tenant_key = $1 and assessment_id = $2
          union all
         select surface_key, row_key, payload_json
           from serving.intelligence_context_summary
          where tenant_key = $1 and assessment_id = $2
       ) intelligence_rows
      order by surface_key, row_key
      limit 200`,
    [tenantKey, assessmentId],
    { missingTable: "empty" },
  );
  const rows = servingRows.map((row) => row.payload_json);

  if (rows.length === 0) {
    throw new Error(
      `Intelligence ECL preview: no serving Intelligence context rows for ${tenantKey}/${assessmentId}.`,
    );
  }

  const retrievalCounts = countBy(rows, (row) => row.retrieval_state).map(
    ({ key, count }) => ({ retrievalState: key, count }),
  );
  const accessCounts = countBy(rows, (row) => row.access_class).map(
    ({ key, count }) => ({ accessClass: key, count }),
  );
  const qualityCounts = countBy(rows, (row) => row.quality_state).map(
    ({ key, count }) => ({ qualityState: key, count }),
  );

  return {
    provider: "ecl_projection_db",
    tenantKey,
    assessmentId,
    rowCount: rows.length,
    retrievalCounts,
    accessCounts,
    qualityCounts,
    totals: {
      permittedFacts: rows.reduce(
        (sum, row) =>
          sum +
          (Array.isArray(row.permitted_facts_json)
            ? row.permitted_facts_json.length
            : 0),
        0,
      ),
      blockedFacts: rows.reduce(
        (sum, row) =>
          sum +
          (Array.isArray(row.blocked_facts_json)
            ? row.blocked_facts_json.length
            : 0),
        0,
      ),
      citations: rows.reduce(
        (sum, row) =>
          sum +
          (Array.isArray(row.citation_refs_json)
            ? row.citation_refs_json.length
            : 0),
        0,
      ),
      gaps: rows.reduce(
        (sum, row) =>
          sum +
          (Array.isArray(row.gap_flags_json) ? row.gap_flags_json.length : 0),
        0,
      ),
    },
    contextRows: rows.slice(0, 9).map((row) => ({
      rowKey: row.row_key,
      surfaceKey: row.surface_key,
      title: displayTitle(row),
      summary: displaySummary(row),
      retrievalState: row.retrieval_state,
      valueState: row.value_state,
      qualityState: row.quality_state,
      accessClass: row.access_class,
      permittedFactCount: Array.isArray(row.permitted_facts_json)
        ? row.permitted_facts_json.length
        : 0,
      blockedFactCount: Array.isArray(row.blocked_facts_json)
        ? row.blocked_facts_json.length
        : 0,
      citationCount: Array.isArray(row.citation_refs_json)
        ? row.citation_refs_json.length
        : 0,
      gapCount: Array.isArray(row.gap_flags_json)
        ? row.gap_flags_json.length
        : 0,
      sourceHash: row.source_hash,
    })),
  };
}
