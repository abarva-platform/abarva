import {
  isSetupAiInitiativeArchetype,
  isSetupAiInitiativeStatus,
  normalizeSetupAiInitiativeTenantKey,
  type SetupAiInitiativeRecord,
  type SetupAiInitiativeRiskSignal,
} from "./ai-initiatives";

export interface ParsedSetupAiInitiativesUpload {
  tenantKey: string;
  accepted: readonly SetupAiInitiativeRecord[];
  rejected: readonly SetupAiInitiativeUploadRejection[];
}
export interface SetupAiInitiativeUploadRejection {
  rowNumber: number;
  reason: string;
  row: Record<string, string>;
}

const REQUIRED_HEADERS = [
  "initiative_id",
  "name",
  "archetype",
  "status",
  "owner_role",
  "sponsor_role",
  "started_at",
] as const;

export function looksLikeSetupAiInitiativesUpload(
  fileName: string,
  documentName: string,
): boolean {
  return /ai initiative|ai-initiative|initiative registry|initiative upload|portfolio registry/.test(
    `${fileName} ${documentName}`.toLowerCase(),
  );
}

export function parseSetupAiInitiativesCsv(
  text: string,
  tenantKey: string,
  options: { financialVisibility?: boolean } = {},
): ParsedSetupAiInitiativesUpload {
  const normalizedTenant = normalizeSetupAiInitiativeTenantKey(tenantKey);
  const rows = parseCsv(text);
  if (rows.length === 0)
    return { tenantKey: normalizedTenant, accepted: [], rejected: [] };
  const headers = rows[0].map((header) => normalizeHeader(header));
  const missing = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length > 0)
    throw new Error(
      `Setup AI Initiatives upload missing required headers: ${missing.join(", ")}`,
    );
  if (
    (headers.includes("budget_amount") || headers.includes("spend_to_date")) &&
    options.financialVisibility !== true
  )
    throw new Error(
      "Financial columns require financialVisibility=true for Setup AI Initiatives uploads",
    );

  const accepted: SetupAiInitiativeRecord[] = [];
  const rejected: SetupAiInitiativeUploadRejection[] = [];
  for (const [index, values] of rows.slice(1).entries()) {
    if (values.every((value) => value.trim() === "")) continue;
    const rowNumber = index + 2;
    const row = Object.fromEntries(
      headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""]),
    );
    const archetype = normalizeHeader(row.archetype);
    const status = normalizeHeader(row.status).replace(/_/g, "-");
    if (!isSetupAiInitiativeArchetype(archetype)) {
      rejected.push({
        rowNumber,
        reason: `Invalid archetype ${row.archetype}`,
        row,
      });
      continue;
    }
    if (!isSetupAiInitiativeStatus(status)) {
      rejected.push({ rowNumber, reason: `Invalid status ${row.status}`, row });
      continue;
    }
    if (Number.isNaN(Date.parse(row.started_at))) {
      rejected.push({
        rowNumber,
        reason: `Invalid started_at ${row.started_at}`,
        row,
      });
      continue;
    }
    const budgetAmount = parseOptionalNumber(row.budget_amount);
    const spendToDate = parseOptionalNumber(row.spend_to_date);
    if (budgetAmount === "invalid" || spendToDate === "invalid") {
      rejected.push({
        rowNumber,
        reason: "budget_amount and spend_to_date must be numeric when provided",
        row,
      });
      continue;
    }
    const linkedProgramId = row.linked_program_id || null;
    if (archetype === "abarva_program" && !linkedProgramId) {
      rejected.push({
        rowNumber,
        reason: "abarva_program rows require linked_program_id",
        row,
      });
      continue;
    }
    accepted.push({
      initiativeId: row.initiative_id,
      tenantKey: normalizedTenant,
      clientId: normalizedTenant,
      name: row.name,
      archetype,
      sponsorRole: row.sponsor_role,
      ownerRole: row.owner_role,
      sponsorUserId: row.sponsor_user_id || null,
      ownerUserId: row.owner_user_id || null,
      vendor:
        row.vendor ||
        (archetype === "internal_build" ? null : "Uploaded vendor pending"),
      parentProduct: row.parent_product || null,
      internalTeam: row.internal_team || null,
      status,
      linkedProgramId,
      startedAt: row.started_at,
      targetOutcomes: row.target_outcome_name
        ? [
            {
              name: row.target_outcome_name,
              targetValue: row.target_value || "target pending",
              unit: row.unit || "n/a",
              targetDate: row.target_date || row.started_at,
            },
          ]
        : [],
      realizedSignals: row.realized_outcome
        ? [
            {
              outcomeName: row.realized_outcome,
              currentValue: row.current_value || "baseline pending",
              asOfDate: row.as_of || row.started_at,
              source: row.source_detail || "Setup AI Initiatives upload",
            },
          ]
        : [],
      riskSignals: row.risk_description
        ? [
            {
              type: row.risk_type || "uploaded_risk",
              severity: normalizeSeverity(row.risk_severity),
              description: row.risk_description,
              raisedAt: row.as_of || row.started_at,
              raisedBy: row.raised_by || "Setup upload",
            },
          ]
        : [],
      budgetAmount: budgetAmount ?? null,
      spendToDate: spendToDate ?? null,
      directionalSummary: {
        trajectory:
          status === "at-risk"
            ? "at_risk"
            : status === "realizing"
              ? "improving"
              : "watch",
        budget: row.directional_budget || "directional budget pending",
        spend: row.directional_spend || "directional spend pending",
        value:
          row.directional_value ||
          "Uploaded initiative requires Steward review before agent confidence increases.",
      },
      evidenceLinks: row.evidence_label
        ? [
            {
              label: row.evidence_label,
              href:
                row.evidence_href ||
                `abarva://setup/upload/${row.initiative_id}`,
              sourceType: "minutes",
            },
          ]
        : [],
      tags: row.tags
        ? row.tags
            .split(";")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      visibility: {
        personaDefault: "admin",
        readGroups: ["tenant-admin", "programs", "source", "tower"],
        writeGroups: ["tenant-admin", "initiative-owner"],
      },
      source: "setup_upload",
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: row.last_updated_by || "setup-upload",
    });
  }
  return { tenantKey: normalizedTenant, accepted, rejected };
}

function parseOptionalNumber(
  value: string | undefined,
): number | null | "invalid" {
  if (!value || value.trim() === "") return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? "invalid" : numeric;
}
function normalizeSeverity(
  value: string | undefined,
): SetupAiInitiativeRiskSignal["severity"] {
  const normalized = normalizeHeader(value ?? "");
  if (normalized === "high") return "high";
  if (normalized === "low") return "low";
  return "medium";
}
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  row.push(current.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}
