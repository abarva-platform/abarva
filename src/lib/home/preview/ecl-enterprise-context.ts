import {
  attributeByFunction,
  buildSegmentSpine,
  type DeclaredSegment,
  type DomainContribution,
  type FunctionSegmentMap,
  type SegmentSpineReport,
} from "../../../../scripts/data-build/segment-spine";
import type { HomeProjectionRow } from "./ecl-projection-bundle";
import { homeProjectionPayload } from "./projection-row-payload";

export interface EnterpriseContextFact {
  rowKey: string;
  title: string;
  sourceRefs: string[];
  asOf: string | null;
}

/** A segment's own row. Revenue is what that row records, or null when it records none. */
export interface EnterpriseContextSegmentFact extends EnterpriseContextFact {
  revenueUsd: number | null;
  revenueSharePct: number | null;
}

export interface EnterpriseContextFunction extends EnterpriseContextFact {
  /** The identifier other records name this function by. How its rows are found, not shown. */
  functionId: string;
  segmentKey: string | null;
  executiveOwner: string | null;
  applicationCount: number;
  programCount: number;
  riskCount: number;
}

export interface EnterpriseContextPriority extends EnterpriseContextFact {
  /** The identifier programs and measures name this priority by. */
  priorityId: string;
  segmentKey: string | null;
  ownerRole: string | null;
  targetOutcome: string | null;
  programCount: number;
  atRiskProgramCount: number;
  metricCount: number;
}

export interface EnterpriseContextProgram extends EnterpriseContextFact {
  programId: string;
}

/**
 * Why records are counted outside every segment. Three different facts, kept apart: one number
 * for all three reads as "shared" when part of it is a link that does not resolve.
 */
export interface AttributionGap {
  /** The record's function is in this record and declares no segment. */
  functionWithoutSegment: number;
  /** The record names a function that is not in this record. */
  functionNotInRecord: number;
  /** The record names no function. */
  noFunctionRecorded: number;
}

export interface EnterpriseContextRisk extends EnterpriseContextFact {
  riskType: string | null;
  severity: "critical" | "high";
  controlState: "partially_effective" | "unknown";
  ownerRole: string | null;
  functionName: string | null;
  affectedObject: string | null;
}

export interface EnterpriseRiskTriage {
  totalRisks: number;
  highOrCritical: number;
  partialControl: number;
  unknownControl: number;
  ownerIsConstant: boolean;
  attentionRisks: EnterpriseContextRisk[];
}

export interface EnterpriseValuePriority extends EnterpriseContextFact {
  unlinked?: boolean;
  ownerRole: string | null;
  programCount: number;
  approvedBudgetUsd: number;
  forecastUsd: number;
  overBudgetProgramCount: number;
  missingFinancialCount: number;
}

export interface EnterpriseValueProof {
  asOf: string | null;
  programCount: number;
  approvedBudgetUsd: number;
  forecastUsd: number;
  overBudgetProgramCount: number;
  missingFinancialCount: number;
  modelledClaimCount: number;
  unsupportedClaimCount: number;
  otherClaimCount: number;
  completedPeriodSpendLines: number;
  excludedSpendLines: number;
  priorities: EnterpriseValuePriority[];
}

export interface HomeEnterpriseContext {
  profile: EnterpriseContextFact & {
    businessModel: string;
    annualRevenueUsd: number | null;
  };
  /**
   * `revenueUsd` and `revenueSharePct` on a spine row are inputs to its arithmetic and read 0
   * where the segment's row records none. To show a segment's revenue, read `segmentFacts`.
   */
  segmentSpine: SegmentSpineReport;
  segmentFacts: Record<string, EnterpriseContextSegmentFact>;
  functions: EnterpriseContextFunction[];
  priorities: EnterpriseContextPriority[];
  valueProof: EnterpriseValueProof;
  riskTriage: EnterpriseRiskTriage;
  /** Functions whose row declares no segment. Says nothing about why. */
  sharedFunctionIds: string[];
  unlinkedPrograms: EnterpriseContextProgram[];
  /** By the same domain names the spine uses; sums to that domain's `unattributed` count. */
  attributionGaps: Record<string, AttributionGap>;
  /** Spend lines that record no amount. They are counted, and add nothing to any total. */
  unrecordedSpendAmounts: number;
  excludedUncitedRows: number;
  evidenceClass: "synthetic_reference";
}

/** Rows a narrative build writes about the record. They are not part of it and cite nothing. */
const NARRATIVE_ROW_TYPES = new Set(["summary", "chapter_claim", "story_plan"]);

/** The spine's own name for "in no segment"; a function with no segment is routed there. */
const NO_SEGMENT = "Unattributed";

type SourceRefsForRow = (row: HomeProjectionRow) => string[];

function payload(row: HomeProjectionRow): Record<string, unknown> {
  return homeProjectionPayload(row.display_payload_json);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const valueText = stringValue(value).replace(/,/g, "");
  if (!valueText) return null;
  const number = Number(valueText);
  return Number.isFinite(number) ? number : null;
}

function fact(
  row: HomeProjectionRow,
  sourceRefs: SourceRefsForRow,
): EnterpriseContextFact {
  return {
    rowKey: row.row_key,
    title: row.title,
    sourceRefs: sourceRefs(row),
    asOf: stringValue(payload(row).source_as_of) || null,
  };
}

function completedFiscalPeriod(row: HomeProjectionRow, recordAsOf: string): boolean {
  const data = payload(row);
  const period = stringValue(data.fiscal_period);
  const rowAsOf = stringValue(data.source_as_of);
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
  };
  if (!/^\d{4}-\d{2}$/.test(period) || !validDate(recordAsOf) || !validDate(rowAsOf)) return false;
  const [year, month] = period.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const end = `${period}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  return end <= recordAsOf && end <= rowAsOf;
}

/** A source-linked, ID-joined business spine for one governed Home assessment. */
export function buildHomeEnterpriseContext(
  rows: HomeProjectionRow[],
  sourceRefs: SourceRefsForRow,
): HomeEnterpriseContext | null {
  const recordRows = rows.filter(
    (row) => !NARRATIVE_ROW_TYPES.has(row.row_type),
  );
  const cited = recordRows.filter((row) => sourceRefs(row).length > 0);
  const excludedUncitedRows = recordRows.length - cited.length;
  const byType = (rowType: string) =>
    cited.filter((row) => row.row_type === rowType);
  const profileRows = byType("enterprise_profile");
  const segmentRows = byType("business_segment");
  const functionRows = byType("business_function");
  if (
    profileRows.length !== 1 ||
    segmentRows.length === 0 ||
    functionRows.length === 0
  )
    return null;

  const profilePayload = payload(profileRows[0]);
  const businessModel = stringValue(profilePayload.business_model);
  if (
    !businessModel ||
    stringValue(profilePayload.business_model_basis) !==
      "synthetic_reference_not_client_attested"
  )
    return null;

  const segments: DeclaredSegment[] = segmentRows.map((row) => {
    const data = payload(row);
    return {
      segmentKey: stringValue(data.segment_key),
      segmentName: stringValue(data.segment_name) || row.title,
      revenueSharePct: numberValue(data.revenue_share_pct) ?? 0,
      revenueUsd: numberValue(data.revenue_usd) ?? 0,
      pnlOwnerRole: stringValue(data.pnl_owner_role),
    };
  });
  const segmentKeys = new Set(segments.map((segment) => segment.segmentKey));
  if (segmentKeys.has("") || segmentKeys.size !== segments.length) return null;

  const functionMap: FunctionSegmentMap = {};
  const sharedFunctionIds: string[] = [];
  for (const row of functionRows) {
    const data = payload(row);
    const functionId = stringValue(data.function_id);
    const segmentId = stringValue(data.business_segment_key);
    if (!functionId || functionMap[functionId]) return null;
    if (segmentId && !segmentKeys.has(segmentId)) return null;
    if (!segmentId) sharedFunctionIds.push(functionId);
    functionMap[functionId] = {
      segment_key: segmentId || NO_SEGMENT,
      clinical: false,
      office: "",
    };
  }

  const domainSpecs = [
    ["programs", "program", "sponsor_function_id"],
    ["applications", "application", "business_function_id"],
    ["data assets", "data_analytics_workload", "function_id"],
    ["platforms", "infrastructure", "business_function_id"],
    ["workforce roles", "workforce_role", "function_id"],
    ["KPIs", "metric", "business_function_id"],
    ["risks", "risk", "business_function_id"],
    ["data flows", "data_flow", "source_function_id"],
    ["AI use cases", "ai_use_case", "business_function_id"],
  ] as const;
  const contributions: DomainContribution[] = domainSpecs.map(
    ([domain, rowType, key]) =>
      attributeByFunction(domain, byType(rowType), functionMap, (row) =>
        stringValue(payload(row)[key]),
      ),
  );
  // Only spend in a completed fiscal period with a recorded amount feeds a total, so a
  // segment with no such line carries no spend domain at all rather than a total of zero.
  // Lines excluded here are counted in valueProof.excludedSpendLines, not silently dropped.
  const spendRows = byType("spend_line");
  const completedSpendRows = spendRows.filter((row) =>
    completedFiscalPeriod(row, stringValue(profilePayload.source_as_of)) &&
    numberValue(payload(row).actual_usd) !== null,
  );
  if (completedSpendRows.length > 0) {
    const spend = attributeByFunction(
      "spend",
      completedSpendRows,
      functionMap,
      (row) => stringValue(payload(row).business_function_id),
      (row) => numberValue(payload(row).actual_usd) ?? 0,
    );
    spend.moneyLabel = "actual spend in completed fiscal periods (USD)";
    contributions.push(spend);
  }
  const spine = buildSegmentSpine(segments, contributions);
  const segmentFacts = Object.fromEntries(
    segmentRows.map((row) => {
      const data = payload(row);
      return [
        stringValue(data.segment_key),
        {
          ...fact(row, sourceRefs),
          revenueUsd: numberValue(data.revenue_usd),
          revenueSharePct: numberValue(data.revenue_share_pct),
        },
      ];
    }),
  );
  // A share compared against a revenue share nobody recorded is a number about nothing.
  const segmentSpine: SegmentSpineReport = {
    ...spine,
    shareVsRevenue: spine.shareVsRevenue.filter(
      (entry) => segmentFacts[entry.segmentKey]?.revenueSharePct !== null,
    ),
  };
  const functionsWithoutSegment = new Set(sharedFunctionIds);
  const attributionGaps: Record<string, AttributionGap> = Object.fromEntries(
    [
      ...domainSpecs,
      ["spend", "spend_line", "business_function_id"] as const,
    ].map(([domain, rowType, key]) => {
      const gap: AttributionGap = {
        functionWithoutSegment: 0,
        functionNotInRecord: 0,
        noFunctionRecorded: 0,
      };
      for (const row of byType(rowType)) {
        const functionId = stringValue(payload(row)[key]);
        if (!functionId) gap.noFunctionRecorded += 1;
        else if (!functionMap[functionId]) gap.functionNotInRecord += 1;
        else if (functionsWithoutSegment.has(functionId))
          gap.functionWithoutSegment += 1;
      }
      return [domain, gap];
    }),
  );
  const countFor = (rowType: string, functionId: string, key: string) =>
    byType(rowType).filter(
      (row) => stringValue(payload(row)[key]) === functionId,
    ).length;
  const functions: EnterpriseContextFunction[] = functionRows.map((row) => {
    const data = payload(row);
    const functionId = stringValue(data.function_id);
    return {
      ...fact(row, sourceRefs),
      functionId,
      segmentKey: stringValue(data.business_segment_key) || null,
      executiveOwner: stringValue(data.executive_owner) || null,
      applicationCount: countFor(
        "application",
        functionId,
        "business_function_id",
      ),
      programCount: countFor("program", functionId, "sponsor_function_id"),
      riskCount: countFor("risk", functionId, "business_function_id"),
    };
  });

  const ownerById = new Map(
    byType("organization_ownership").map((row) => [
      stringValue(payload(row).owner_id),
      stringValue(payload(row).owner_role) || row.title,
    ]),
  );
  const programRows = byType("program");
  const priorityRows = byType("priority");
  const priorityIds = new Set(
    priorityRows.map((row) => stringValue(payload(row).priority_id)),
  );
  const unlinkedProgramRows = programRows.filter((row) =>
    !priorityIds.has(stringValue(payload(row).priority_id)),
  );
  const unlinkedPrograms = unlinkedProgramRows
    .map((row) => ({
      ...fact(row, sourceRefs),
      programId: stringValue(payload(row).program_id) || row.row_key,
    }))
    .sort((a, b) => a.rowKey.localeCompare(b.rowKey));
  const priorities: EnterpriseContextPriority[] = priorityRows.map((row) => {
    const data = payload(row);
    const priorityId = stringValue(data.priority_id);
    const programs = programRows.filter(
      (program) => stringValue(payload(program).priority_id) === priorityId,
    );
    return {
      ...fact(row, sourceRefs),
      priorityId,
      segmentKey: stringValue(data.segment_id) || null,
      ownerRole: ownerById.get(stringValue(data.owner_id)) || null,
      targetOutcome: stringValue(data.target_outcome) || null,
      programCount: programs.length,
      atRiskProgramCount: programs.filter(
        (program) => stringValue(payload(program).status) === "at_risk",
      ).length,
      metricCount: byType("metric").filter(
        (metric) => stringValue(payload(metric).priority_id) === priorityId,
      ).length,
    };
  });

  const programAmounts = (programs: HomeProjectionRow[]) => {
    const withAmounts = programs.map((program) => ({
      budget: numberValue(payload(program).approved_budget_usd),
      forecast: numberValue(payload(program).forecast_usd),
    }));
    return {
      programCount: programs.length,
      approvedBudgetUsd: withAmounts.reduce((sum, item) => sum + (item.budget ?? 0), 0),
      forecastUsd: withAmounts.reduce((sum, item) => sum + (item.forecast ?? 0), 0),
      overBudgetProgramCount: withAmounts.filter((item) =>
        item.budget !== null && item.forecast !== null && item.forecast > item.budget,
      ).length,
      missingFinancialCount: withAmounts.filter((item) =>
        item.budget === null || item.forecast === null,
      ).length,
    };
  };
  const commonSourceDate = (sourceRows: HomeProjectionRow[]): string | null => {
    const dates = sourceRows.map((row) => stringValue(payload(row).source_as_of));
    return dates.length > 0 && dates.every((date) => date && date === dates[0])
      ? dates[0]
      : null;
  };
  const valueProof: EnterpriseValueProof = {
    ...programAmounts(programRows),
    asOf: commonSourceDate(programRows),
    modelledClaimCount: programRows.filter((row) =>
      stringValue(payload(row).value_claim_status) === "modelled_not_finance_validated",
    ).length,
    unsupportedClaimCount: programRows.filter((row) =>
      stringValue(payload(row).value_claim_status) === "unsupported_hypothesis",
    ).length,
    otherClaimCount: programRows.filter((row) =>
      !["modelled_not_finance_validated", "unsupported_hypothesis"].includes(
        stringValue(payload(row).value_claim_status),
      ),
    ).length,
    completedPeriodSpendLines: completedSpendRows.length,
    excludedSpendLines: spendRows.length - completedSpendRows.length,
    priorities: [...priorityRows.map((row): EnterpriseValuePriority => {
      const programs = programRows.filter((program) =>
        stringValue(payload(program).priority_id) === stringValue(payload(row).priority_id),
      );
      return {
        ...fact(row, sourceRefs),
        ownerRole: ownerById.get(stringValue(payload(row).owner_id)) || null,
        sourceRefs: [...new Set([sourceRefs(row), ...programs.map(sourceRefs)].flat())],
        ...programAmounts(programs),
      };
    }), ...(unlinkedProgramRows.length > 0 ? [{
      rowKey: "unlinked-programs",
      title: "No declared priority",
      sourceRefs: [...new Set(unlinkedProgramRows.map(sourceRefs).flat())],
      asOf: commonSourceDate(unlinkedProgramRows),
      unlinked: true,
      ownerRole: null,
      ...programAmounts(unlinkedProgramRows),
    }] : [])],
  };

  const namedObjects = new Map(cited.map((row) => [row.row_key, row.title]));
  const functionNames = new Map(
    functionRows.map((row) => [stringValue(payload(row).function_id), row.title]),
  );
  const riskRows = byType("risk");
  const attentionRisks = riskRows.flatMap((row): EnterpriseContextRisk[] => {
    const data = payload(row);
    const severity = stringValue(data.severity).toLowerCase();
    const controlState = stringValue(data.control_status ?? data.control_state)
      .toLowerCase()
      .replaceAll(" ", "_");
    if (
      (severity !== "critical" && severity !== "high") ||
      (controlState !== "partially_effective" && controlState !== "unknown")
    ) return [];
    const sourceTitle = stringValue(data.risk_name) || row.title;
    const riskId = stringValue(data.risk_or_control_id);
    const idSuffix = riskId ? ` (${riskId})` : "";
    return [{
      ...fact(row, sourceRefs),
      title: idSuffix && sourceTitle.endsWith(idSuffix)
        ? sourceTitle.slice(0, -idSuffix.length)
        : sourceTitle,
      riskType: stringValue(data.risk_type) || null,
      severity,
      controlState,
      ownerRole: ownerById.get(stringValue(data.owner_id)) || stringValue(data.control_owner) || null,
      functionName: functionNames.get(stringValue(data.business_function_id)) || null,
      affectedObject: namedObjects.get(stringValue(data.object_ref)) || null,
    }];
  }).sort((a, b) => {
    const priority = (risk: EnterpriseContextRisk) =>
      (risk.severity === "critical" ? 0 : 2) +
      (risk.controlState === "unknown" ? 0 : 1);
    return priority(a) - priority(b) || a.rowKey.localeCompare(b.rowKey);
  });
  const riskOwnerRoles = riskRows.map((row) => {
    const data = payload(row);
    return ownerById.get(stringValue(data.owner_id)) || stringValue(data.control_owner) || "";
  });
  const riskTriage: EnterpriseRiskTriage = {
    totalRisks: riskRows.length,
    highOrCritical: riskRows.filter((row) =>
      ["critical", "high"].includes(stringValue(payload(row).severity).toLowerCase()),
    ).length,
    partialControl: attentionRisks.filter((risk) => risk.controlState === "partially_effective").length,
    unknownControl: attentionRisks.filter((risk) => risk.controlState === "unknown").length,
    ownerIsConstant: riskOwnerRoles.length > 1 && Boolean(riskOwnerRoles[0]) && new Set(riskOwnerRoles).size === 1,
    attentionRisks,
  };

  return {
    profile: {
      ...fact(profileRows[0], sourceRefs),
      businessModel,
      annualRevenueUsd: numberValue(profilePayload.annual_revenue_usd),
    },
    segmentSpine,
    segmentFacts,
    functions,
    priorities,
    valueProof,
    riskTriage,
    sharedFunctionIds: sharedFunctionIds.sort(),
    unlinkedPrograms,
    attributionGaps,
    unrecordedSpendAmounts: spendRows.filter(
      (row) => numberValue(payload(row).actual_usd) === null,
    ).length,
    excludedUncitedRows,
    evidenceClass: "synthetic_reference",
  };
}
