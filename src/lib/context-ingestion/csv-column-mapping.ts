import type { ContextTemplateDefinition } from "./template-registry";

export interface ColumnMatch {
  field: string;
  sourceColumn: string | null;
  confidence: number;
  reason: "exact" | "synonym" | "fuzzy" | "unresolved";
}

export interface CsvColumnMappingProposal {
  fieldMappings: Record<string, string>;
  requiredMatches: ColumnMatch[];
  optionalMatches: ColumnMatch[];
  unresolvedRequiredFields: string[];
  sourceRecordIdColumn: string | null;
  titleColumn: string | null;
  textColumns: string[];
  readyForCommit: boolean;
}

const MAX_TEXT_COLUMNS = 12;

const FIELD_SYNONYMS: Record<string, string[]> = {
  team_id: [
    "team",
    "team_name",
    "domain",
    "scorecard_id",
    "scorecard",
    "business_unit_id",
    "owner_team",
    "squad_id",
    "squad",
    "repo_id",
    "repository_id",
  ],
  measured_at: [
    "measured_on",
    "measurement_date",
    "last_updated",
    "updated_at",
    "period",
    "period_month",
    "month",
    "reporting_month",
    "report_date",
    "observed_at",
    "trigger_date",
  ],
  deploy_freq_per_week: [
    "deploy_frequency_per_week",
    "deployment_frequency_per_week",
    "deploy_frequency",
    "deployment_frequency",
    "deploys_per_week",
    "deployments_per_week",
    "deploy_freq",
  ],
  lead_time_hours: [
    "lead_time_for_change_hours",
    "lead_time_to_change_hours",
    "lead_time_for_changes_hours",
    "lead_time_change_hours",
    "change_lead_time_hours",
    "lead_time",
  ],
  mttr_hours: [
    "mean_time_to_recovery_hours",
    "mean_time_recovery_hours",
    "mean_time_to_restore_hours",
    "time_to_restore_hours",
    "restore_time_hours",
  ],
  change_failure_rate_pct: [
    "change_failure_percentage",
    "change_failure_rate",
    "change_fail_rate_pct",
    "change_fail_pct",
    "failure_rate_pct",
    "cfr_pct",
  ],
  annual_cost_usd: [
    "annual_run_cost_usd",
    "annual_spend",
    "annual_spend_usd",
    "annual_usd",
    "annual_value_usd",
  ],
  annual_value_usd: [
    "annual_run_cost_usd",
    "annual_spend",
    "annual_spend_usd",
    "annual_usd",
  ],
  committed_usd: ["budget_committed", "projected_value_usd", "value_usd"],
  value_usd: ["committed_usd", "budget_committed", "projected_value_usd"],
  metric_value: ["monthly_value", "target", "peer_benchmark", "baseline"],
  vendor_name: ["vendor"],
  renewal_date: ["contract_end", "renegotiation_window_open_date"],
  source_app_id: ["source_system_id", "source_system", "source"],
  target_app_id: ["target_system_id", "target_system", "target"],
  owner_role: [
    "owner",
    "owner_team",
    "sponsor",
    "accountable",
    "decision_owner",
  ],
  title: ["name", "label", "metric", "persona"],
  label: ["name", "title", "metric", "persona"],
};

const RECORD_ID_CANDIDATES = [
  "source_record_id",
  "record_id",
  "id",
  "team_id",
  "scorecard_id",
  "gcc_id",
  "persona_id",
  "kpi_id",
  "kpi_observation_id",
  "opportunity_id",
  "app_id",
  "service_id",
  "vendor_id",
  "contract_id",
  "initiative_id",
  "event_id",
  "person_id",
  "asset_id",
  "edge_id",
];

const TITLE_CANDIDATES = [
  "title",
  "name",
  "metric",
  "label",
  "persona",
  "domain",
  "team",
  "team_name",
  "vendor_name",
  "tool_name",
  "business_purpose",
  "segment",
];

export function normalizeColumnName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function compact(value: string): string {
  return normalizeColumnName(value).replace(/_/g, "");
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeColumnName(value).split("_").filter(Boolean));
}

function tokenScore(field: string, header: string): number {
  const fieldTokens = tokenSet(field);
  const headerTokens = tokenSet(header);
  if (fieldTokens.size === 0 || headerTokens.size === 0) return 0;
  const intersection = [...fieldTokens].filter((token) =>
    headerTokens.has(token),
  ).length;
  const union = new Set([...fieldTokens, ...headerTokens]).size;
  return intersection / union;
}

function isKnownSynonym(field: string, header: string): boolean {
  const normalizedHeader = normalizeColumnName(header);
  return (FIELD_SYNONYMS[normalizeColumnName(field)] ?? []).some(
    (candidate) => normalizeColumnName(candidate) === normalizedHeader,
  );
}

function matchField(field: string, headers: readonly string[]): ColumnMatch {
  const normalizedField = normalizeColumnName(field);
  const exact = headers.find(
    (header) => normalizeColumnName(header) === normalizedField,
  );
  if (exact) {
    return { field, sourceColumn: exact, confidence: 1, reason: "exact" };
  }

  const synonym = headers.find((header) => isKnownSynonym(field, header));
  if (synonym) {
    return {
      field,
      sourceColumn: synonym,
      confidence: 0.96,
      reason: "synonym",
    };
  }

  const compactField = compact(field);
  const scored = headers
    .map((header) => {
      const compactHeader = compact(header);
      const contains =
        compactHeader.includes(compactField) ||
        compactField.includes(compactHeader)
          ? 0.78
          : 0;
      return {
        header,
        score: Math.max(contains, tokenScore(field, header)),
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = scored[0];
  const second = scored[1];
  if (best && best.score >= 0.62 && best.score - (second?.score ?? 0) >= 0.12) {
    return {
      field,
      sourceColumn: best.header,
      confidence: Number(best.score.toFixed(2)),
      reason: "fuzzy",
    };
  }

  return { field, sourceColumn: null, confidence: 0, reason: "unresolved" };
}

function firstCandidate(
  headers: readonly string[],
  candidates: string[],
): string | null {
  for (const candidate of candidates) {
    const match = matchField(candidate, headers);
    if (match.sourceColumn) return match.sourceColumn;
  }
  return null;
}

export function proposeCsvColumnMapping(args: {
  headers: readonly string[];
  template: Pick<
    ContextTemplateDefinition,
    "requiredFields" | "optionalFields"
  >;
}): CsvColumnMappingProposal {
  const requiredMatches = args.template.requiredFields.map((field) =>
    matchField(field, args.headers),
  );
  const optionalMatches = args.template.optionalFields.map((field) =>
    matchField(field, args.headers),
  );
  const allMatches = [...requiredMatches, ...optionalMatches];
  const fieldMappings = Object.fromEntries(
    allMatches
      .filter((match): match is ColumnMatch & { sourceColumn: string } =>
        Boolean(match.sourceColumn),
      )
      .map((match) => [match.field, match.sourceColumn]),
  );
  const unresolvedRequiredFields = requiredMatches
    .filter((match) => !match.sourceColumn)
    .map((match) => match.field);
  const mappedColumns = new Set(Object.values(fieldMappings));
  const sourceRecordIdColumn =
    firstCandidate(args.headers, [
      ...args.template.requiredFields.filter((field) =>
        /(^|_)id$/.test(normalizeColumnName(field)),
      ),
      ...RECORD_ID_CANDIDATES,
    ]) ?? null;
  const titleColumn = firstCandidate(args.headers, TITLE_CANDIDATES) ?? null;
  const textColumns = [
    ...mappedColumns,
    ...args.headers.filter((header) => !mappedColumns.has(header)),
  ].slice(0, MAX_TEXT_COLUMNS);

  return {
    fieldMappings,
    requiredMatches,
    optionalMatches,
    unresolvedRequiredFields,
    sourceRecordIdColumn,
    titleColumn,
    textColumns,
    readyForCommit: unresolvedRequiredFields.length === 0,
  };
}
