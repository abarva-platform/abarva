import fs from "node:fs";
import path from "node:path";

type Severity = "pass" | "watch" | "fail";
type TabKey = "summary" | "data" | "gaps" | "sources" | "relationships";

interface Finding {
  tenantKey: string;
  tenantName: string;
  dimension: string;
  tab: TabKey | "enterprise-profile" | "data-quality" | "live-crawl";
  severity: Severity;
  check: string;
  detail: string;
}

interface ContextArea {
  areaKey: string;
  displayName: string;
  loadedCount: number;
  mappedCount: number;
  sourceCount: number;
  evidenceCount: number;
  relationshipCount: number;
  examples: string[];
  topGaps: Array<{ label: string; count: number; whyItMatters: string | null }>;
  evidencePosture: string;
  relationshipDepth: string;
  answerability: string;
  safeQuestions: string[];
  unsupportedQuestions: string[];
  decisionsSupported: string[];
  decisionsNotReady: string[];
  nextDataActions: string[];
  caveats: string[];
}

interface Snapshot {
  tenantProfileHeader: {
    tenantKey: string;
    displayName: string;
    headquarters: string | null;
    revenue: string | null;
    employees: string | null;
    dataOrigin: string;
    activeContextStatus: string;
    candidatePreviewStatus: string;
  };
  executiveProfile?: {
    whatIsMissing?: string[];
  };
  contextAreas: ContextArea[];
  dataQualitySummary: {
    sourceCoverage: string;
    candidateCoverage: string;
    evidenceStrength: string;
    relationshipCoverage: string;
    manifestCompleteness: string;
    homeAvaRepresentationWarnings: string[];
    promotionBlockers: string[];
    answerabilityPosture: string;
  };
  guardrails: Record<string, boolean>;
}

interface SourceCoverage {
  tenantKey: string;
  tenantDisplayName: string;
  structuredRowCount: number;
  fileCount: number;
  domainCount: number;
  sourceRichCandidateThin: boolean;
}

interface CandidateCoverage {
  tenantKey: string;
  candidateRecordsGenerated: number;
  candidateThin: boolean;
}

interface QualityMatrix {
  tenantKey: string;
  tenantDisplayName: string;
  sourceStructuredRows: number;
  candidateRecordsGenerated: number;
  sourceRichCandidateThin: boolean;
  relationshipOperationCount: number;
  overallStatus: string;
  recommendedNextAction: string;
}

interface ProfileRecord {
  tenantKey: string;
  objectType: string;
  attributes: Record<string, { value: unknown }>;
  evidenceReferences: unknown[];
  qualityStatus: string;
  dataStatus: string;
}

const ACTIVE_TENANTS = [
  "skyharbor-air",
  "lakeshore-holdings",
  "meridian-health",
  "first-capital",
  "apex-retail",
] as const;

const REQUIRED_PROFILE_OBJECTS = [
  "tenant_profile",
  "location",
  "business_segment",
  "business_model_component",
  "leadership_role",
  "strategic_priority",
  "mission_statement",
  "vision_statement",
] as const;

const REQUIRED_PROFILE_FIELDS = [
  "industry",
  "headquarters",
  "revenueUsd",
  "employeeCount",
  "businessModel",
  "sourceAsOfDate",
] as const;

const PLACEHOLDER_PATTERN =
  /\b(?:not_loaded|unknown|tbd|to be determined|n\/a|sample|lorem ipsum|placeholder)\b/i;

const SOURCE_BACKED_CONTEXT_AREAS = new Set([
  "Business Functions",
  "Applications & Systems",
  "Vendors & Contracts",
  "Data Assets",
  "Integrations",
  "Programs & Initiatives",
  "Risks & Controls",
  "Metrics / KPIs",
  "Evidence Sources",
]);

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports/home-content-accuracy/latest");

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const snapshots = readJson<{ tenants: Snapshot[] }>(
    "reports/home-summary-snapshot/latest/home-summary-snapshots.json",
  ).tenants;
  const areaSummaries = readJson<
    Array<{ tenantKey: string; displayName: string; contextAreas: ContextArea[] }>
  >("reports/home-summary-snapshot/latest/context-area-summaries.json");
  const sourceCoverage = indexByTenant(
    readJson<{ tenants: SourceCoverage[] }>(
      "reports/data-quality/all-tenants/latest/source-estate-coverage.json",
    ).tenants,
  );
  const candidateCoverage = indexByTenant(
    readJson<{ tenants: CandidateCoverage[] }>(
      "reports/data-quality/all-tenants/latest/candidate-coverage.json",
    ).tenants,
  );
  const qualityMatrix = indexByTenant(
    readJson<{ tenants: QualityMatrix[] }>(
      "reports/data-quality/all-tenants/latest/tenant-quality-matrix.json",
    ).tenants,
  );
  const profiles = readJson<ProfileRecord[]>(
    "reports/enterprise-profile-foundation/latest/canonical-profile-records.json",
  );

  const findings: Finding[] = [];
  const tenantReports = snapshots
    .filter((snapshot) =>
      ACTIVE_TENANTS.includes(
        snapshot.tenantProfileHeader.tenantKey as (typeof ACTIVE_TENANTS)[number],
      ),
    )
    .map((snapshot) => {
      const tenantKey = snapshot.tenantProfileHeader.tenantKey;
      const tenantName = snapshot.tenantProfileHeader.displayName;
      const source = sourceCoverage.get(tenantKey);
      const candidate = candidateCoverage.get(tenantKey);
      const quality = qualityMatrix.get(tenantKey);
      const profileRecords = profiles.filter(
        (record) => record.tenantKey === tenantKey,
      );
      const contextAreaSource = areaSummaries.find(
        (entry) => entry.tenantKey === tenantKey,
      );
      const contextAreas = contextAreaSource?.contextAreas ?? snapshot.contextAreas;

      findings.push(
        ...auditEnterpriseProfile({
          tenantKey,
          tenantName,
          records: profileRecords,
        }),
      );
      findings.push(
        ...auditDataQuality({
          tenantKey,
          tenantName,
          snapshot,
          source,
          candidate,
          quality,
        }),
      );
      for (const area of contextAreas) {
        findings.push(
          ...auditContextArea({
            tenantKey,
            tenantName,
            area,
            sourceRichCandidateThin: Boolean(
              quality?.sourceRichCandidateThin ?? source?.sourceRichCandidateThin,
            ),
          }),
        );
      }
      findings.push(
        ...auditDimensionSpecificity({
          tenantKey,
          tenantName,
          areas: contextAreas,
        }),
      );

      return {
        tenantKey,
        tenantName,
        activeContextStatus: snapshot.tenantProfileHeader.activeContextStatus,
        candidatePreviewStatus: snapshot.tenantProfileHeader.candidatePreviewStatus,
        sourceRows: source?.structuredRowCount ?? null,
        sourceFiles: source?.fileCount ?? null,
        candidateRecords: candidate?.candidateRecordsGenerated ?? null,
        sourceRichCandidateThin: Boolean(
          quality?.sourceRichCandidateThin ?? source?.sourceRichCandidateThin,
        ),
        dimensions: contextAreas.map((area) => ({
          areaKey: area.areaKey,
          displayName: area.displayName,
          loadedCount: area.loadedCount,
          sourceCount: area.sourceCount,
          evidenceCount: area.evidenceCount,
          relationshipCount: area.relationshipCount,
          answerability: area.answerability,
          topGapCount: area.topGaps.reduce((sum, gap) => sum + gap.count, 0),
        })),
      };
    });

  findings.push(...auditActiveTenantSet(snapshots));

  const summary = {
    generatedAt: new Date().toISOString(),
    activeTenantCount: tenantReports.length,
    expectedActiveTenants: ACTIVE_TENANTS,
    tenantReports,
    counts: countFindings(findings),
    guardrails: {
      deterministicArtifactAudit: true,
      callsClaude: false,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
    },
  };

  writeJson("home-content-accuracy.json", { summary, findings });
  fs.writeFileSync(
    path.join(OUT_DIR, "home-content-accuracy.md"),
    renderMarkdown(summary, findings),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "home-content-accuracy.html"),
    renderHtml(summary, findings),
  );

  console.log(
    `Home content accuracy audit: ${summary.counts.pass} pass, ${summary.counts.watch} watch, ${summary.counts.fail} fail`,
  );
  console.log(`Report: ${path.join(OUT_DIR, "home-content-accuracy.md")}`);
  if (summary.counts.fail > 0) process.exitCode = 1;
}

function auditEnterpriseProfile(args: {
  tenantKey: string;
  tenantName: string;
  records: ProfileRecord[];
}): Finding[] {
  const findings: Finding[] = [];
  const byType = new Map<string, ProfileRecord[]>();
  for (const record of args.records) {
    byType.set(record.objectType, [...(byType.get(record.objectType) ?? []), record]);
  }
  for (const objectType of REQUIRED_PROFILE_OBJECTS) {
    const records = byType.get(objectType) ?? [];
    findings.push({
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: "Enterprise profile",
      tab: "enterprise-profile",
      severity: records.length > 0 ? "pass" : "fail",
      check: `required object: ${objectType}`,
      detail:
        records.length > 0
          ? `${records.length} canonical ${objectType} record(s) present.`
          : `Missing required canonical ${objectType} records.`,
    });
  }
  const tenantProfile = byType.get("tenant_profile")?.[0];
  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = tenantProfile?.attributes[field]?.value;
    findings.push({
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: "Enterprise profile",
      tab: "enterprise-profile",
      severity: isUsable(value) ? "pass" : "fail",
      check: `required field: ${field}`,
      detail: isUsable(value)
        ? `${field} is present with non-placeholder value.`
        : `${field} is missing or placeholder.`,
    });
  }
  const unsupported = args.records.filter((record) => {
    const text = JSON.stringify(record.attributes);
    return PLACEHOLDER_PATTERN.test(text);
  });
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: "Enterprise profile",
    tab: "enterprise-profile",
    severity: unsupported.length === 0 ? "pass" : "fail",
    check: "placeholder rejection",
    detail:
      unsupported.length === 0
        ? "No placeholder profile values passed into canonical records."
        : `${unsupported.length} canonical record(s) contain placeholder language.`,
  });
  const recordsWithoutEvidence = args.records.filter(
    (record) => record.evidenceReferences.length === 0,
  );
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: "Enterprise profile",
    tab: "enterprise-profile",
    severity: recordsWithoutEvidence.length === 0 ? "pass" : "fail",
    check: "evidence lineage",
    detail:
      recordsWithoutEvidence.length === 0
        ? "Every enterprise profile canonical record carries evidence lineage."
        : `${recordsWithoutEvidence.length} profile record(s) lack evidence references.`,
  });
  return findings;
}

function auditDataQuality(args: {
  tenantKey: string;
  tenantName: string;
  snapshot: Snapshot;
  source?: SourceCoverage;
  candidate?: CandidateCoverage;
  quality?: QualityMatrix;
}): Finding[] {
  const sourceRichCandidateThin = Boolean(
    args.quality?.sourceRichCandidateThin ?? args.source?.sourceRichCandidateThin,
  );
  const warnings = [
    ...args.snapshot.dataQualitySummary.homeAvaRepresentationWarnings,
    ...args.snapshot.dataQualitySummary.promotionBlockers,
    ...args.snapshot.contextAreas.flatMap((area) => area.caveats),
    ...args.snapshot.executiveProfile?.whatIsMissing ?? [],
  ].join(" ");
  return [
    {
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: "Data quality",
      tab: "data-quality",
      severity: args.source && args.source.structuredRowCount > 0 ? "pass" : "fail",
      check: "source estate exists",
      detail: `${args.source?.structuredRowCount ?? 0} structured source rows across ${args.source?.fileCount ?? 0} file(s).`,
    },
    {
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: "Data quality",
      tab: "data-quality",
      severity:
        sourceRichCandidateThin && /source-rich|candidate-thin|expand|project/i.test(warnings)
          ? "pass"
          : sourceRichCandidateThin
            ? "fail"
            : "pass",
      check: "source-rich/candidate-thin caveat",
      detail: sourceRichCandidateThin
        ? "Home artifacts explicitly preserve the source-rich/candidate-thin caveat."
        : "Tenant is not marked source-rich/candidate-thin.",
    },
    {
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: "Data quality",
      tab: "data-quality",
      severity:
        args.snapshot.guardrails.productionTenantDataWritten === false &&
        args.snapshot.guardrails.activeTenantAccessLayerUpdated === false &&
        args.snapshot.guardrails.candidatePromoted === false
          ? "pass"
          : "fail",
      check: "non-destructive guardrails",
      detail:
        "Snapshot guardrails keep production writes, Active Tenant Access update, and candidate promotion false.",
    },
  ];
}

function auditContextArea(args: {
  tenantKey: string;
  tenantName: string;
  area: ContextArea;
  sourceRichCandidateThin: boolean;
}): Finding[] {
  const area = args.area;
  const findings: Finding[] = [];
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: area.displayName,
    tab: "summary",
    severity:
      area.loadedCount >= 0 &&
      area.mappedCount >= 0 &&
      area.answerability.length > 0 &&
      area.safeQuestions.length > 0 &&
      area.unsupportedQuestions.length > 0
        ? "pass"
        : "fail",
    check: "summary tab completeness",
    detail: `${area.loadedCount.toLocaleString()} loaded, ${area.mappedCount.toLocaleString()} mapped, answerability=${area.answerability}.`,
  });
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: area.displayName,
    tab: "data",
    severity:
      area.loadedCount === 0 || (area.examples.length > 0 && !hasPlaceholder(area.examples))
        ? "pass"
        : "fail",
    check: "data tab representative rows",
    detail:
      area.loadedCount === 0
        ? "No loaded rows; data tab can render empty state honestly."
        : `${area.examples.length} representative example(s) available without placeholder language.`,
  });
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: area.displayName,
    tab: "gaps",
    severity:
      area.topGaps.length > 0 || area.nextDataActions.length > 0 || !args.sourceRichCandidateThin
        ? "pass"
        : "fail",
    check: "gaps tab does not false-green",
    detail:
      area.topGaps.length > 0
        ? `${area.topGaps.length} gap pattern(s) visible.`
        : area.nextDataActions.length > 0
          ? "No repeated gap pattern, but next data actions are visible."
          : "No visible gap or action despite candidate-thin posture.",
  });
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: area.displayName,
    tab: "sources",
    severity: area.loadedCount === 0 || area.sourceCount > 0 ? "pass" : "fail",
    check: "sources tab lineage",
    detail: `${area.sourceCount} source file(s), ${area.evidenceCount} evidence item(s).`,
  });
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: area.displayName,
    tab: "relationships",
    severity:
      area.relationshipCount > 0 ||
      /limited|not projected|not ready|caveat/i.test(area.relationshipDepth) ||
      area.caveats.some((caveat) => /relationship|graph/i.test(caveat))
        ? "pass"
        : "fail",
    check: "relationships tab honesty",
    detail:
      area.relationshipCount > 0
        ? `${area.relationshipCount} relationship(s) projected.`
        : `Relationship count is 0 and text says: ${area.relationshipDepth}`,
  });
  return findings;
}

function auditDimensionSpecificity(args: {
  tenantKey: string;
  tenantName: string;
  areas: ContextArea[];
}): Finding[] {
  const findings: Finding[] = [];
  const loadedAreas = args.areas.filter((area) => area.loadedCount > 0);
  const loadedSignatures = new Set(
    loadedAreas.map(
      (area) =>
        `${area.loadedCount}:${area.sourceCount}:${area.evidenceCount}:${area.relationshipCount}`,
    ),
  );
  findings.push({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    dimension: "All dimensions",
    tab: "summary",
    severity:
      loadedAreas.length >= 5 && loadedSignatures.size <= 2 ? "fail" : "pass",
    check: "dimension-specific rollups",
    detail:
      loadedAreas.length >= 5 && loadedSignatures.size <= 2
        ? `${loadedAreas.length} loaded dimensions collapsed into only ${loadedSignatures.size} count signature(s).`
        : `${loadedAreas.length} loaded dimensions have ${loadedSignatures.size} distinct count signature(s).`,
  });

  for (const area of args.areas.filter((entry) =>
    SOURCE_BACKED_CONTEXT_AREAS.has(entry.displayName),
  )) {
    findings.push({
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      dimension: area.displayName,
      tab: "summary",
      severity: area.loadedCount > 0 && area.sourceCount > 0 ? "pass" : "fail",
      check: "source-backed area projected",
      detail:
        area.loadedCount > 0 && area.sourceCount > 0
          ? `${area.displayName} projects ${area.loadedCount.toLocaleString()} loaded row(s) from ${area.sourceCount.toLocaleString()} source file(s).`
          : `${area.displayName} rendered empty despite being a required source-backed Home area.`,
    });
  }
  return findings;
}

function auditActiveTenantSet(snapshots: Snapshot[]): Finding[] {
  const tenantKeys = snapshots.map((snapshot) => snapshot.tenantProfileHeader.tenantKey);
  const retiredActive = tenantKeys.filter((key) => /northstar/i.test(key));
  const missing = ACTIVE_TENANTS.filter((tenantKey) => !tenantKeys.includes(tenantKey));
  return [
    {
      tenantKey: "all",
      tenantName: "All active tenants",
      dimension: "Active tenant set",
      tab: "live-crawl",
      severity: missing.length === 0 ? "pass" : "fail",
      check: "all active tenants represented",
      detail:
        missing.length === 0
          ? "All expected active tenants are present in Home snapshot artifacts."
          : `Missing active tenant(s): ${missing.join(", ")}`,
    },
    {
      tenantKey: "all",
      tenantName: "All active tenants",
      dimension: "Active tenant set",
      tab: "live-crawl",
      severity: retiredActive.length === 0 ? "pass" : "fail",
      check: "Northstar retired/excluded",
      detail:
        retiredActive.length === 0
          ? "Northstar is not present as an active Home snapshot tenant."
          : `Retired Northstar tenant(s) appeared as active: ${retiredActive.join(", ")}`,
    },
  ];
}

function isUsable(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return true;
  return value.trim().length > 0 && !PLACEHOLDER_PATTERN.test(value);
}

function hasPlaceholder(values: string[]): boolean {
  return values.some((value) => PLACEHOLDER_PATTERN.test(value));
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function writeJson(fileName: string, value: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), JSON.stringify(value, null, 2));
}

function indexByTenant<T extends { tenantKey: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.tenantKey, row]));
}

function countFindings(findings: Finding[]) {
  return {
    pass: findings.filter((finding) => finding.severity === "pass").length,
    watch: findings.filter((finding) => finding.severity === "watch").length,
    fail: findings.filter((finding) => finding.severity === "fail").length,
  };
}

function renderMarkdown(
  summary: {
    generatedAt: string;
    activeTenantCount: number;
    tenantReports: Array<{
      tenantKey: string;
      tenantName: string;
      sourceRows: number | null;
      sourceFiles: number | null;
      candidateRecords: number | null;
      sourceRichCandidateThin: boolean;
      dimensions: Array<{
        displayName: string;
        loadedCount: number;
        sourceCount: number;
        evidenceCount: number;
        relationshipCount: number;
        answerability: string;
        topGapCount: number;
      }>;
    }>;
    counts: { pass: number; watch: number; fail: number };
    guardrails: Record<string, boolean>;
  },
  findings: Finding[],
): string {
  const lines = [
    "# Home Content Accuracy Audit",
    "",
    `Generated: \`${summary.generatedAt}\``,
    "",
    "This is a deterministic artifact audit of Home content by active tenant, dimension, and tab. It does not call Claude, write production tenant data, promote candidates, or update Active Tenant Access.",
    "",
    `Result: **${summary.counts.pass} pass / ${summary.counts.watch} watch / ${summary.counts.fail} fail**`,
    "",
    "## Tenant Rollup",
    "",
    "| Tenant | Source rows | Source files | Candidate records | Source-rich/candidate-thin |",
    "|---|---:|---:|---:|---|",
    ...summary.tenantReports.map(
      (tenant) =>
        `| ${tenant.tenantName} | ${fmt(tenant.sourceRows)} | ${fmt(tenant.sourceFiles)} | ${fmt(tenant.candidateRecords)} | ${tenant.sourceRichCandidateThin ? "yes" : "no"} |`,
    ),
    "",
    "## Dimension Rollup",
    "",
  ];
  for (const tenant of summary.tenantReports) {
    lines.push(`### ${tenant.tenantName}`, "");
    lines.push(
      "| Dimension | Loaded | Sources | Evidence | Relationships | Gaps | Answerability |",
      "|---|---:|---:|---:|---:|---:|---|",
    );
    for (const dimension of tenant.dimensions) {
      lines.push(
        `| ${dimension.displayName} | ${dimension.loadedCount.toLocaleString()} | ${dimension.sourceCount.toLocaleString()} | ${dimension.evidenceCount.toLocaleString()} | ${dimension.relationshipCount.toLocaleString()} | ${dimension.topGapCount.toLocaleString()} | ${dimension.answerability} |`,
      );
    }
    lines.push("");
  }
  lines.push("## Findings By Tab", "");
  for (const severity of ["fail", "watch", "pass"] as const) {
    const rows = findings.filter((finding) => finding.severity === severity);
    if (rows.length === 0) continue;
    lines.push(`### ${severity.toUpperCase()}`, "");
    lines.push("| Tenant | Dimension | Tab | Check | Detail |", "|---|---|---|---|---|");
    for (const finding of rows) {
      lines.push(
        `| ${finding.tenantName} | ${finding.dimension} | ${finding.tab} | ${finding.check} | ${finding.detail.replace(/\|/g, "\\|")} |`,
      );
    }
    lines.push("");
  }
  lines.push("## Guardrails", "");
  for (const [key, value] of Object.entries(summary.guardrails)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  return lines.join("\n");
}

function renderHtml(summary: unknown, findings: Finding[]): string {
  const counts = countFindings(findings);
  const rows = findings
    .map(
      (finding) =>
        `<tr><td>${esc(finding.severity)}</td><td>${esc(finding.tenantName)}</td><td>${esc(finding.dimension)}</td><td>${esc(finding.tab)}</td><td>${esc(finding.check)}</td><td>${esc(finding.detail)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Content Accuracy</title><style>body{font-family:Inter,system-ui,sans-serif;margin:32px;color:#111827;background:#fbfaf7}h1{font-family:Georgia,serif}table{width:100%;border-collapse:collapse;background:#fff}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}th{background:#f3f4f6}.pass{color:#047857}.fail{color:#b91c1c}.watch{color:#92400e}</style></head><body><h1>Home Content Accuracy Audit</h1><p><strong>${counts.pass}</strong> pass / <strong>${counts.watch}</strong> watch / <strong>${counts.fail}</strong> fail</p><pre>${esc(JSON.stringify(summary, null, 2))}</pre><table><thead><tr><th>Severity</th><th>Tenant</th><th>Dimension</th><th>Tab</th><th>Check</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function fmt(value: number | null): string {
  return value === null ? "n/a" : value.toLocaleString();
}

function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
