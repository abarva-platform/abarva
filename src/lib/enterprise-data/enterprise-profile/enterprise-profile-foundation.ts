import fs from "node:fs/promises";
import path from "node:path";

import {
  CANONICAL_TENANTS,
  type CanonicalTenant,
} from "@/config/tenants/CANONICAL_TENANTS";
import type {
  CanonicalIngestionRecord,
  CanonicalValue,
  DataClassification,
  DataStatus,
  EvidenceReference,
} from "../contracts/canonical-ingestion";
import {
  parseCsv,
  isMissingSourceValue,
} from "../source-adapters/csv-source-adapter";

export const ENTERPRISE_PROFILE_FOUNDATION_SOURCE =
  "datasets/enterprise-profile-foundation-v1/active-tenants/enterprise_profile_foundation.csv";
export const ENTERPRISE_PROFILE_FOUNDATION_REPORT_DIR =
  "reports/enterprise-profile-foundation/latest";
export const ENTERPRISE_PROFILE_FOUNDATION_MAPPING_PROFILE =
  "enterprise-profile-foundation/v1";

/**
 * Tenants that remain in CANONICAL_TENANTS but are excluded from active service.
 *
 * Empty since the 2026-08-16 sunset: the retired tenants were removed from CANONICAL_TENANTS
 * outright rather than left in place and filtered, so there is nothing left to exclude. The
 * mechanism stays as the hook for any future retirement that wants to keep a tenant visible
 * in inventory while marking it inactive.
 */
const RETIRED_TENANT_KEYS = new Set<string>([]);

export const REQUIRED_ENTERPRISE_PROFILE_FIELDS = [
  "tenant_key",
  "client_display_name",
  "legal_name",
  "industry",
  "sub_industry",
  "headquarters",
  "revenue_usd",
  "revenue_basis",
  "employee_count",
  "employee_count_basis",
  "global_locations",
  "business_model",
  "business_segments",
  "mission_statement",
  "vision_statement",
  "leadership_roles",
  "strategic_priorities",
  "source_file",
  "source_as_of_date",
  "source_validation_status",
  "known_gaps",
] as const;

const SCALAR_PROFILE_FIELDS = [
  "tenant_key",
  "client_display_name",
  "legal_name",
  "industry",
  "sub_industry",
  "headquarters",
  "revenue_usd",
  "revenue_basis",
  "employee_count",
  "employee_count_basis",
  "business_model",
  "source_file",
  "source_as_of_date",
  "source_validation_status",
] as const;

export interface EnterpriseProfileFoundationOptions {
  repoRoot: string;
  sourcePath?: string;
  outputDir?: string;
  generatedAt?: string;
}

export interface TenantProfileSourceInventoryRow {
  tenantKey: string;
  displayName: string;
  active: boolean;
  sourceFound: boolean;
  sourcePath: string | null;
  retiredOrExcluded: boolean;
}

export interface PlaceholderRejection {
  tenantKey: string;
  field: string;
  value: string;
  severity: "error";
  reason: string;
}

export interface ProfileGap {
  tenantKey: string;
  field: string;
  severity: "required_missing" | "placeholder_rejected" | "source_caveat";
  message: string;
  sourceFile?: string;
}

export interface HomeAvaConsumptionReadiness {
  tenantKey: string;
  ready: boolean;
  canonicalRecordCount: number;
  requiredGapCount: number;
  placeholderRejectionCount: number;
  canRenderExecutiveProfile: boolean;
  canAnswerProfileQuestions: boolean;
  caveats: string[];
}

export interface EnterpriseProfileFoundationReport {
  generatedAt: string;
  sourcePath: string;
  activeTenantCount: number;
  retiredTenantKeys: string[];
  sourceInventory: TenantProfileSourceInventoryRow[];
  parsedRows: Record<string, string>[];
  canonicalRecords: CanonicalIngestionRecord[];
  placeholderRejections: PlaceholderRejection[];
  profileGaps: ProfileGap[];
  sourceLineage: Array<{
    tenantKey: string;
    sourceFile: string;
    sourceAsOfDate: string;
    validationStatus: string;
    evidenceKey: string;
  }>;
  homeAvaReadiness: HomeAvaConsumptionReadiness[];
  summary: {
    tenantsExpected: number;
    tenantsWithSource: number;
    canonicalRecordCount: number;
    placeholderRejectionCount: number;
    requiredGapCount: number;
    homeAvaReadyCount: number;
    northstarExcluded: boolean;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    productionTenantDataWritten: false;
    moduleRuntimeConsumptionChanged: false;
  };
}

export async function buildEnterpriseProfileFoundationReport(
  options: EnterpriseProfileFoundationOptions,
): Promise<EnterpriseProfileFoundationReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourcePath = options.sourcePath ?? ENTERPRISE_PROFILE_FOUNDATION_SOURCE;
  const absoluteSourcePath = path.resolve(options.repoRoot, sourcePath);
  const parsed = parseCsv(await fs.readFile(absoluteSourcePath, "utf8"));
  const rows = parsed.rows;
  const rowsByTenant = new Map(rows.map((row) => [row.tenant_key, row]));
  const activeTenants = activeCanonicalTenants();
  const placeholderRejections: PlaceholderRejection[] = [];
  const profileGaps: ProfileGap[] = [];
  const canonicalRecords: CanonicalIngestionRecord[] = [];
  const sourceLineage: EnterpriseProfileFoundationReport["sourceLineage"] = [];

  for (const tenant of activeTenants) {
    const row = rowsByTenant.get(tenant.key);
    if (!row) {
      profileGaps.push({
        tenantKey: tenant.key,
        field: "tenant_key",
        severity: "required_missing",
        message: `No enterprise profile source row exists for active tenant ${tenant.key}.`,
      });
      continue;
    }

    const evidence = evidenceFor(row);
    const tenantGaps = validateEnterpriseProfileRow(row);
    profileGaps.push(...tenantGaps);
    placeholderRejections.push(
      ...tenantGaps
        .filter((gap) => gap.severity === "placeholder_rejected")
        .map((gap) => ({
          tenantKey: gap.tenantKey,
          field: gap.field,
          value: row[gap.field] ?? "",
          severity: "error" as const,
          reason: gap.message,
        })),
    );
    sourceLineage.push({
      tenantKey: tenant.key,
      sourceFile: row.source_file,
      sourceAsOfDate: row.source_as_of_date,
      validationStatus: row.source_validation_status,
      evidenceKey: evidence.evidenceKey,
    });
    canonicalRecords.push(
      ...canonicalRecordsForRow(row, evidence, generatedAt),
    );
  }

  const sourceInventory = [
    ...activeTenants.map((tenant) => ({
      tenantKey: tenant.key,
      displayName: tenant.name,
      active: true,
      sourceFound: rowsByTenant.has(tenant.key),
      sourcePath: rowsByTenant.has(tenant.key) ? sourcePath : null,
      retiredOrExcluded: false,
    })),
    ...CANONICAL_TENANTS.filter((tenant) =>
      RETIRED_TENANT_KEYS.has(tenant.key),
    ).map((tenant) => ({
      tenantKey: tenant.key,
      displayName: tenant.name,
      active: false,
      sourceFound: rowsByTenant.has(tenant.key),
      sourcePath: rowsByTenant.has(tenant.key) ? sourcePath : null,
      retiredOrExcluded: true,
    })),
  ];

  const homeAvaReadiness = activeTenants.map((tenant) => {
    const tenantRecords = canonicalRecords.filter(
      (record) => record.tenantKey === tenant.key,
    );
    const tenantRequiredGaps = profileGaps.filter(
      (gap) => gap.tenantKey === tenant.key && gap.severity !== "source_caveat",
    );
    const tenantCaveats = profileGaps
      .filter(
        (gap) =>
          gap.tenantKey === tenant.key && gap.severity === "source_caveat",
      )
      .map((gap) => gap.message);
    const ready =
      tenantRecords.some((record) => record.objectType === "tenant_profile") &&
      tenantRequiredGaps.length === 0;
    return {
      tenantKey: tenant.key,
      ready,
      canonicalRecordCount: tenantRecords.length,
      requiredGapCount: tenantRequiredGaps.length,
      placeholderRejectionCount: placeholderRejections.filter(
        (item) => item.tenantKey === tenant.key,
      ).length,
      canRenderExecutiveProfile: ready,
      canAnswerProfileQuestions: ready,
      caveats: tenantCaveats,
    };
  });

  return {
    generatedAt,
    sourcePath,
    activeTenantCount: activeTenants.length,
    retiredTenantKeys: [...RETIRED_TENANT_KEYS],
    sourceInventory,
    parsedRows: rows,
    canonicalRecords,
    placeholderRejections,
    profileGaps,
    sourceLineage,
    homeAvaReadiness,
    summary: {
      tenantsExpected: activeTenants.length,
      tenantsWithSource: sourceInventory.filter(
        (row) => row.active && row.sourceFound,
      ).length,
      canonicalRecordCount: canonicalRecords.length,
      placeholderRejectionCount: placeholderRejections.length,
      requiredGapCount: profileGaps.filter(
        (gap) => gap.severity !== "source_caveat",
      ).length,
      homeAvaReadyCount: homeAvaReadiness.filter((row) => row.ready).length,
      northstarExcluded: sourceInventory.some(
        (row) =>
          row.tenantKey === "northstar-clinical" && row.retiredOrExcluded,
      ),
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      productionTenantDataWritten: false,
      moduleRuntimeConsumptionChanged: false,
    },
  };
}

export async function writeEnterpriseProfileFoundationReport(
  options: EnterpriseProfileFoundationOptions,
): Promise<EnterpriseProfileFoundationReport> {
  const report = await buildEnterpriseProfileFoundationReport(options);
  const outputDir = path.resolve(
    options.repoRoot,
    options.outputDir ?? ENTERPRISE_PROFILE_FOUNDATION_REPORT_DIR,
  );
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "tenant-profile-source-inventory.json"),
    json(report.sourceInventory),
  );
  await fs.writeFile(
    path.join(outputDir, "parsed-enterprise-profile-records.json"),
    json(report.parsedRows),
  );
  await fs.writeFile(
    path.join(outputDir, "canonical-profile-records.json"),
    json(report.canonicalRecords),
  );
  await fs.writeFile(
    path.join(outputDir, "placeholder-rejection-report.json"),
    json(report.placeholderRejections),
  );
  await fs.writeFile(
    path.join(outputDir, "profile-gaps.json"),
    json(report.profileGaps),
  );
  await fs.writeFile(
    path.join(outputDir, "source-lineage.json"),
    json(report.sourceLineage),
  );
  await fs.writeFile(
    path.join(outputDir, "home-ava-consumption-readiness.json"),
    json(report.homeAvaReadiness),
  );
  await fs.writeFile(
    path.join(outputDir, "summary.json"),
    json(report.summary),
  );
  await fs.writeFile(
    path.join(outputDir, "summary.md"),
    summaryMarkdown(report),
  );
  await fs.writeFile(
    path.join(outputDir, "all-tenant-profile-audit.html"),
    auditHtml(report),
  );
  return report;
}

function activeCanonicalTenants(): CanonicalTenant[] {
  return CANONICAL_TENANTS.filter(
    (tenant) => !RETIRED_TENANT_KEYS.has(tenant.key),
  );
}

function validateEnterpriseProfileRow(
  row: Record<string, string>,
): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  for (const field of REQUIRED_ENTERPRISE_PROFILE_FIELDS) {
    const value = row[field];
    if (isMissingSourceValue(value)) {
      gaps.push({
        tenantKey: row.tenant_key || "unknown",
        field,
        severity: value?.trim() ? "placeholder_rejected" : "required_missing",
        message: value?.trim()
          ? `Placeholder value "${value}" is not accepted as an enterprise profile fact.`
          : `Required enterprise profile field ${field} is missing.`,
        sourceFile: row.source_file,
      });
    }
  }
  for (const caveat of splitList(row.known_gaps)) {
    gaps.push({
      tenantKey: row.tenant_key,
      field: "known_gaps",
      severity: "source_caveat",
      message: caveat,
      sourceFile: row.source_file,
    });
  }
  return gaps;
}

function canonicalRecordsForRow(
  row: Record<string, string>,
  evidence: EvidenceReference,
  observedAt: string,
): CanonicalIngestionRecord[] {
  const records: CanonicalIngestionRecord[] = [];
  records.push(
    record({
      row,
      objectType: "tenant_profile",
      sourceObjectId: `${row.tenant_key}:tenant_profile`,
      attributes: Object.fromEntries(
        SCALAR_PROFILE_FIELDS.filter(
          (field) => !isMissingSourceValue(row[field]),
        ).map((field) => [
          toAttributeName(field),
          canonicalValue(row[field], field),
        ]),
      ),
      evidence,
      observedAt,
    }),
  );

  records.push(
    ...splitList(row.global_locations).map((location, index) =>
      record({
        row,
        objectType: "location",
        sourceObjectId: `${row.tenant_key}:location:${index + 1}`,
        attributes: {
          name: stringValue(location),
          tenantKey: stringValue(row.tenant_key),
        },
        evidence,
        observedAt,
      }),
    ),
  );
  records.push(
    ...splitList(row.business_segments).map((segment, index) =>
      record({
        row,
        objectType: "business_segment",
        sourceObjectId: `${row.tenant_key}:business_segment:${index + 1}`,
        attributes: {
          name: stringValue(segment),
          tenantKey: stringValue(row.tenant_key),
        },
        evidence,
        observedAt,
      }),
    ),
  );
  records.push(
    record({
      row,
      objectType: "business_model_component",
      sourceObjectId: `${row.tenant_key}:business_model_component:1`,
      attributes: {
        description: stringValue(row.business_model),
        tenantKey: stringValue(row.tenant_key),
      },
      evidence,
      observedAt,
    }),
  );
  records.push(
    ...splitList(row.leadership_roles).map((role, index) =>
      record({
        row,
        objectType: "leadership_role",
        sourceObjectId: `${row.tenant_key}:leadership_role:${index + 1}`,
        attributes: parseLeadershipRole(role, row.tenant_key),
        evidence,
        observedAt,
      }),
    ),
  );
  records.push(
    ...splitList(row.strategic_priorities).map((priority, index) =>
      record({
        row,
        objectType: "strategic_priority",
        sourceObjectId: `${row.tenant_key}:strategic_priority:${index + 1}`,
        attributes: {
          priority: stringValue(priority),
          tenantKey: stringValue(row.tenant_key),
        },
        evidence,
        observedAt,
      }),
    ),
  );
  records.push(
    record({
      row,
      objectType: "mission_statement",
      sourceObjectId: `${row.tenant_key}:mission_statement`,
      attributes: {
        statement: stringValue(row.mission_statement),
        tenantKey: stringValue(row.tenant_key),
      },
      evidence,
      observedAt,
    }),
  );
  records.push(
    record({
      row,
      objectType: "vision_statement",
      sourceObjectId: `${row.tenant_key}:vision_statement`,
      attributes: {
        statement: stringValue(row.vision_statement),
        tenantKey: stringValue(row.tenant_key),
      },
      evidence,
      observedAt,
    }),
  );
  records.push(
    ...splitList(row.known_gaps).map((gap, index) =>
      record({
        row,
        objectType: "profile_gap",
        sourceObjectId: `${row.tenant_key}:profile_gap:${index + 1}`,
        attributes: {
          gap: stringValue(gap),
          tenantKey: stringValue(row.tenant_key),
        },
        evidence,
        observedAt,
        qualityStatus: "warning",
      }),
    ),
  );
  return records;
}

function record(args: {
  row: Record<string, string>;
  objectType: string;
  sourceObjectId: string;
  attributes: Record<string, CanonicalValue>;
  evidence: EvidenceReference;
  observedAt: string;
  qualityStatus?: "valid" | "warning";
}): CanonicalIngestionRecord {
  return {
    tenantKey: args.row.tenant_key,
    packetVersion: "enterprise-profile-foundation/v1",
    domain:
      args.objectType === "strategic_priority"
        ? "transformation_ai_portfolio"
        : args.objectType === "profile_gap"
          ? "risk_control_governance"
          : "enterprise_structure",
    objectType: args.objectType,
    sourceObjectId: args.sourceObjectId,
    canonicalObjectKey: `${args.row.tenant_key}:${args.objectType}:${args.sourceObjectId}`,
    attributes: args.attributes,
    relationships: [],
    evidenceReferences: [args.evidence],
    sourceAuthority: {
      sourceSystem: "enterprise-profile-foundation-v1",
      sourceType: "enterprise_profile",
      owner: args.row.source_validation_status,
      authority: "self_reported",
    },
    effectiveDate: args.row.source_as_of_date,
    observedAt: args.observedAt,
    confidence: 0.86,
    sensitivity: "internal" satisfies DataClassification,
    dataStatus: "synthetic" satisfies DataStatus,
    qualityStatus: args.qualityStatus ?? "valid",
    validationFindings: [],
    lineage: [
      {
        step: "enterprise_profile_foundation_parse",
        version: "enterprise-profile-foundation/v1",
        at: args.observedAt,
        adapterKey: "enterprise-profile-foundation-builder",
        mappingProfile: ENTERPRISE_PROFILE_FOUNDATION_MAPPING_PROFILE,
        contractVersion: "tenant-packet/v1",
        notes:
          "Non-destructive canonical profile proof. No active tenant access update, no promotion, no production write.",
      },
    ],
  };
}

function evidenceFor(row: Record<string, string>): EvidenceReference {
  return {
    evidenceKey: `enterprise-profile-foundation:${row.tenant_key}:${row.source_file}`,
    sourceObjectId: `${row.tenant_key}:tenant_profile`,
    sourceField: "source_file",
    excerpt: `${row.client_display_name} enterprise profile source as of ${row.source_as_of_date}. ${row.known_gaps}`,
    confidence: 0.86,
  };
}

function canonicalValue(value: string, field: string): CanonicalValue {
  if (field === "revenue_usd")
    return {
      value: Number(value),
      valueType: "currency",
      unit: "USD",
      confidence: 0.86,
    };
  if (field === "employee_count")
    return { value: Number(value), valueType: "number", confidence: 0.86 };
  if (field === "source_as_of_date")
    return { value, valueType: "date", confidence: 0.86 };
  return stringValue(value);
}

function stringValue(value: string): CanonicalValue {
  return { value, valueType: "string", confidence: 0.86 };
}

function parseLeadershipRole(
  role: string,
  tenantKey: string,
): Record<string, CanonicalValue> {
  const [title, ...nameParts] = role.split(":");
  const name = nameParts.join(":").trim();
  return {
    tenantKey: stringValue(tenantKey),
    title: stringValue(title.trim()),
    name: stringValue(name || "not_named"),
  };
}

function splitList(value: string | undefined): string[] {
  return String(value ?? "")
    .split(/\s*[|;]\s*/)
    .map((item) => item.trim())
    .filter((item) => !isMissingSourceValue(item));
}

function toAttributeName(field: string): string {
  return field.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function summaryMarkdown(report: EnterpriseProfileFoundationReport): string {
  const readinessTable = formatMarkdownTable(
    [
      "Tenant",
      "Ready",
      "Canonical records",
      "Required gaps",
      "Placeholder rejections",
    ],
    report.homeAvaReadiness.map((row) => [
      row.tenantKey,
      String(row.ready),
      String(row.canonicalRecordCount),
      String(row.requiredGapCount),
      String(row.placeholderRejectionCount),
    ]),
    ["left", "left", "right", "right", "right"],
  );

  return `# Enterprise Profile Foundation

Generated: \`${report.generatedAt}\`
Source: \`${report.sourcePath}\`

Enterprise Profile is treated as a governed tenant data domain. This proof is non-destructive: it does not write production tenant data, update the Active Tenant Access Layer, promote a candidate, or change module runtime behavior.

## Summary

- Active tenants expected: ${report.summary.tenantsExpected}
- Active tenants with source: ${report.summary.tenantsWithSource}
- Canonical profile records: ${report.summary.canonicalRecordCount}
- Required gaps: ${report.summary.requiredGapCount}
- Placeholder rejections: ${report.summary.placeholderRejectionCount}
- Home/aVa ready tenants: ${report.summary.homeAvaReadyCount}
- Northstar retired/excluded: ${report.summary.northstarExcluded}

## Home/aVa readiness

${readinessTable}
`;
}

function formatMarkdownTable(
  headers: string[],
  rows: string[][],
  alignments: Array<"left" | "right">,
): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const renderCell = (value: string, index: number) =>
    alignments[index] === "right"
      ? value.padStart(widths[index])
      : value.padEnd(widths[index]);
  const separator = widths.map((width, index) =>
    alignments[index] === "right"
      ? `${"-".repeat(Math.max(width - 1, 3))}:`
      : "-".repeat(Math.max(width, 3)),
  );

  return [
    `| ${headers.map(renderCell).join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(renderCell).join(" | ")} |`),
  ].join("\n");
}

function auditHtml(report: EnterpriseProfileFoundationReport): string {
  const rows = report.homeAvaReadiness
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.tenantKey)}</td><td>${row.ready ? "Ready" : "Blocked"}</td><td>${row.canonicalRecordCount}</td><td>${row.requiredGapCount}</td><td>${row.placeholderRejectionCount}</td></tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Enterprise Profile Foundation Audit</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #07152f; background: #f7f3ed; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 28px; }
    h1 { font-family: Georgia, serif; font-size: 44px; margin: 0 0 10px; }
    .lede { font-size: 18px; line-height: 1.5; max-width: 860px; color: #40506a; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 28px 0; }
    .card { border: 1px solid #ddd2c2; border-radius: 8px; background: #fffaf3; padding: 18px; }
    .label { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #7b6c5a; }
    .value { display: block; font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd2c2; }
    th, td { padding: 12px 14px; border-bottom: 1px solid #eee4d7; text-align: left; }
    th { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #6b7280; }
  </style>
</head>
<body>
  <main>
    <p class="label">Data Layer / Enterprise Profile</p>
    <h1>Enterprise Profile Foundation Audit</h1>
    <p class="lede">Enterprise Profile is now audited as a required tenant data domain. Home and aVa should consume the resulting canonical facts downstream; they should not store executive narrative as source truth.</p>
    <section class="grid">
      <div class="card"><span class="label">Active tenants</span><span class="value">${report.summary.tenantsExpected}</span></div>
      <div class="card"><span class="label">Canonical records</span><span class="value">${report.summary.canonicalRecordCount}</span></div>
      <div class="card"><span class="label">Required gaps</span><span class="value">${report.summary.requiredGapCount}</span></div>
      <div class="card"><span class="label">Placeholder rejects</span><span class="value">${report.summary.placeholderRejectionCount}</span></div>
    </section>
    <table>
      <thead><tr><th>Tenant</th><th>Home/aVa readiness</th><th>Records</th><th>Required gaps</th><th>Placeholder rejections</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
