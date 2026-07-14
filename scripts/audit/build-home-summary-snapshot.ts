import fs from "node:fs/promises";
import path from "node:path";

import {
  buildHomeSummarySnapshot,
  buildHomeSummarySnapshotFromModuleContext,
  type HomeSummarySnapshot,
  type HomeSummarySnapshotMode,
} from "@/lib/home/home-summary-snapshot";
import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type { ModuleContextRequestedDomain } from "@/lib/enterprise-data/contracts/module-context-apis";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

interface TenantMatrixArtifact {
  generatedAt?: string;
  tenants: Array<{
    tenantKey: string;
    tenantDisplayName: string;
  }>;
}

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/home-summary-snapshot/latest");

const CLIENT_KEY_BY_AUDIT_TENANT: Record<string, string> = {
  "apex-retail": "apexretail",
  "first-capital": "firstcapital",
  "lakeshore-holdings": "lakeshore",
  "meridian-health": "meridian",
  "skyharbor-air": "skyharbor",
};

const DISPLAY_NAME_BY_TENANT: Record<string, string> = {
  "apex-retail": "Retail Demo",
  "first-capital": "Financial Services Demo",
  "lakeshore-holdings": "Lakeshore Holdings",
  "meridian-health": "Healthcare Demo",
  "skyharbor-air": "Airline Demo",
};

const INDUSTRY_BY_TENANT: Record<string, string> = {
  "apex-retail": "Retail",
  "first-capital": "Financial Services",
  "lakeshore-holdings": "Diversified Holdings",
  "meridian-health": "Healthcare",
  "skyharbor-air": "Airline",
};

const HOME_MODULE_DOMAINS: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
];

async function main() {
  const generatedAt = new Date().toISOString();
  const tenants = await readTenants();
  const activeTenants = tenants.filter(
    (tenant) => !/northstar/i.test(tenant.tenantKey),
  );
  const excludedTenants = tenants
    .filter((tenant) => /northstar/i.test(tenant.tenantKey))
    .map((tenant) => ({
      ...tenant,
      status: "retired/excluded",
      reason: "Northstar is not processed as an active Home Summary Snapshot tenant.",
    }));

  const legacyBrowserSnapshots = activeTenants.map((tenant) =>
    buildSnapshotForTenant(tenant, "active_home_context", generatedAt),
  );
  const candidatePreviewSnapshots = activeTenants.map((tenant) =>
    buildSnapshotForTenant(tenant, "candidate_preview", generatedAt),
  );
  const snapshots = await Promise.all(
    activeTenants.map((tenant) =>
      buildModuleContextSnapshotForTenant(tenant, generatedAt),
    ),
  );

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  await writeJson("home-summary-snapshots.json", {
    generatedAt,
    tenants: snapshots,
    candidatePreviewTenants: candidatePreviewSnapshots,
    excludedTenants,
  });
  await writeJson("legacy-browser-snapshots.json", {
    generatedAt,
    tenants: legacyBrowserSnapshots,
    note: "Legacy browser snapshots are retained as comparison only. Home module data should consume the supplier-context snapshots.",
  });
  await writeJson(
    "tenant-profile-headers.json",
    pick(snapshots, "tenantProfileHeader"),
  );
  await writeJson(
    "executive-profile-summaries.json",
    pick(snapshots, "executiveProfile"),
  );
  await writeJson(
    "context-area-summaries.json",
    snapshots.map((snapshot) => ({
      tenantKey: snapshot.tenantProfileHeader.tenantKey,
      displayName: snapshot.tenantProfileHeader.displayName,
      contextAreas: snapshot.contextAreas,
    })),
  );
  await writeJson(
    "data-quality-summary.json",
    pick(snapshots, "dataQualitySummary"),
  );
  await writeJson("ava-scope-summary.json", pick(snapshots, "avaScope"));
  await writeJson("lineage.json", pick(snapshots, "lineage"));
  await writeJson("home-module-context-snapshots.json", {
    generatedAt,
    tenants: snapshots,
  });
  await writeJson(
    "skyharbor-module-context-snapshot.json",
    snapshots.find(
      (snapshot) => snapshot.tenantProfileHeader.tenantKey === "skyharbor-air",
    ) ?? null,
  );
  await writeJson(
    "skyharbor-snapshot.json",
    snapshots.find((snapshot) => snapshot.tenantProfileHeader.tenantKey === "skyharbor-air") ??
      null,
  );
  await writeJson(
    "lakeshore-snapshot.json",
    snapshots.find((snapshot) => snapshot.tenantProfileHeader.tenantKey === "lakeshore-holdings") ??
      null,
  );
  await writeJson("guardrails.json", buildGuardrails(snapshots));
  await fs.writeFile(
    path.join(outDir, "summary.md"),
    renderSummary({
      generatedAt,
      snapshots,
      candidatePreviewSnapshots,
      moduleContextSnapshots: snapshots,
      excludedTenants,
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(outDir, "home-summary-control.html"),
    renderHtml({
      generatedAt,
      snapshots,
      candidatePreviewSnapshots,
      moduleContextSnapshots: snapshots,
      excludedTenants,
    }),
    "utf8",
  );

  assertGuardrails(snapshots, candidatePreviewSnapshots, excludedTenants);
  assertModuleContextGuardrails(snapshots);
  console.log(
    `[home-summary-snapshot] wrote ${snapshots.length} active snapshots to ${path.relative(repoRoot, outDir)}`,
  );
}

function buildSnapshotForTenant(
  tenant: TenantMatrixArtifact["tenants"][number],
  mode: HomeSummarySnapshotMode,
  generatedAt: string,
): HomeSummarySnapshot {
  const clientKey = CLIENT_KEY_BY_AUDIT_TENANT[tenant.tenantKey];
  const browser = clientKey ? getHomeV6ContextBrowser(clientKey) : null;
  return buildHomeSummarySnapshot({
    repoRoot,
    tenantKey: tenant.tenantKey,
    displayName: DISPLAY_NAME_BY_TENANT[tenant.tenantKey] ?? tenant.tenantDisplayName,
    industry: INDUSTRY_BY_TENANT[tenant.tenantKey] ?? null,
    mode,
    browser,
    generatedAt,
  });
}

async function buildModuleContextSnapshotForTenant(
  tenant: TenantMatrixArtifact["tenants"][number],
  generatedAt: string,
): Promise<HomeSummarySnapshot> {
  const request = {
    tenantKey: tenant.tenantKey,
    moduleKey: "home" as const,
    purpose: "context_summary" as const,
    requestedDomains: HOME_MODULE_DOMAINS,
  };
  const [moduleContext, moduleContextExplanation] = await Promise.all([
    getModuleContext(request, { repoRoot, generatedAt }),
    explainModuleContext(request, { repoRoot, generatedAt }),
  ]);
  return buildHomeSummarySnapshotFromModuleContext({
    repoRoot,
    tenantKey: tenant.tenantKey,
    displayName:
      DISPLAY_NAME_BY_TENANT[tenant.tenantKey] ?? tenant.tenantDisplayName,
    industry: INDUSTRY_BY_TENANT[tenant.tenantKey] ?? null,
    moduleContext,
    moduleContextExplanation,
    generatedAt,
  });
}

async function readTenants(): Promise<TenantMatrixArtifact["tenants"]> {
  const filePath = path.join(
    repoRoot,
    "reports/data-quality/all-tenants/latest/tenant-quality-matrix.json",
  );
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as TenantMatrixArtifact;
  return parsed.tenants;
}

function pick<K extends keyof HomeSummarySnapshot>(
  snapshots: HomeSummarySnapshot[],
  key: K,
) {
  return snapshots.map((snapshot) => ({
    tenantKey: snapshot.tenantProfileHeader.tenantKey,
    displayName: snapshot.tenantProfileHeader.displayName,
    [key]: snapshot[key],
  }));
}

function buildGuardrails(snapshots: HomeSummarySnapshot[]) {
  return {
    generatedAt: new Date().toISOString(),
    deterministicBuilder: true,
    callsClaude: false,
    uploadsFiles: false,
    validatesFiles: false,
    createsCandidates: false,
    candidatePromoted: false,
    activeTenantAccessLayerUpdated: false,
    productionTenantDataWritten: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    northstarProcessedAsActive: false,
    tenants: snapshots.map((snapshot) => ({
      tenantKey: snapshot.tenantProfileHeader.tenantKey,
      fingerprint: snapshot.lineage.inputFingerprint,
      guardrails: snapshot.guardrails,
    })),
  };
}

function assertGuardrails(
  activeSnapshots: HomeSummarySnapshot[],
  previewSnapshots: HomeSummarySnapshot[],
  excludedTenants: Array<{ tenantKey: string }>,
) {
  const all = [...activeSnapshots, ...previewSnapshots];
  const violations = all.flatMap((snapshot) => {
    const failed = Object.entries(snapshot.guardrails)
      .filter(([key, value]) =>
        key === "deterministicBuilder" ? value !== true : value !== false,
      )
      .map(([key]) => `${snapshot.tenantProfileHeader.tenantKey}:${key}`);
    if (snapshot.lineage.inputFingerprint.length < 32) {
      failed.push(`${snapshot.tenantProfileHeader.tenantKey}:fingerprint`);
    }
    return failed;
  });
  if (activeSnapshots.some((snapshot) => /northstar/i.test(snapshot.tenantProfileHeader.tenantKey))) {
    violations.push("northstar:processed_as_active");
  }
  if (excludedTenants.some((tenant) => !/northstar/i.test(tenant.tenantKey))) {
    violations.push("unexpected_excluded_tenant");
  }
  const skyHarbor = activeSnapshots.find(
    (snapshot) => snapshot.tenantProfileHeader.tenantKey === "skyharbor-air",
  );
  if (!skyHarbor) violations.push("skyharbor:missing");
  if (violations.length) {
    throw new Error(`Home Summary Snapshot guardrail failed: ${violations.join(", ")}`);
  }
}

function assertModuleContextGuardrails(snapshots: HomeSummarySnapshot[]) {
  const violations: string[] = [];
  const skyHarbor = snapshots.find(
    (snapshot) => snapshot.tenantProfileHeader.tenantKey === "skyharbor-air",
  );
  if (!skyHarbor) violations.push("skyharbor-module-context:missing");
  else {
    const apps = skyHarbor.contextAreas.find(
      (area) => area.displayName === "Applications & Systems",
    );
    if (skyHarbor.moduleContextSummary?.sourceMode !== "active_tenant_access") {
      violations.push("skyharbor-module-context:not_active");
    }
    if ((apps?.loadedCount ?? 0) < 600) {
      violations.push("skyharbor-module-context:applications_thin");
    }
    if (skyHarbor.guardrails.candidateReadByDefault) {
      violations.push("skyharbor-module-context:candidate_read_by_default");
    }
  }
  const meridian = snapshots.find(
    (snapshot) => snapshot.tenantProfileHeader.tenantKey === "meridian-health",
  );
  if (meridian?.moduleContextSummary?.sourceMode !== "active_not_available") {
    violations.push("meridian-module-context:unexpected_active_access");
  }
  if (meridian && meridian.executiveProfile.contextDepthWidth.loadedRecords !== 0) {
    violations.push("meridian-module-context:candidate_fallback_detected");
  }
  if (violations.length) {
    throw new Error(
      `Home module-context snapshot guardrail failed: ${violations.join(", ")}`,
    );
  }
}

function renderSummary(args: {
  generatedAt: string;
  snapshots: HomeSummarySnapshot[];
  candidatePreviewSnapshots: HomeSummarySnapshot[];
  moduleContextSnapshots: HomeSummarySnapshot[];
  excludedTenants: Array<{ tenantKey: string; reason: string }>;
}): string {
  const rows = args.snapshots
    .map(
      (snapshot) =>
        `| ${snapshot.tenantProfileHeader.displayName} | ${snapshot.lineage.status} | ${snapshot.executiveProfile.contextDepthWidth.loadedRecords.toLocaleString()} | ${snapshot.dataQualitySummary.manifestCompleteness.replace(/\|/g, "/")} | ${snapshot.executiveProfile.recommendedNextDataActions[0]?.replace(/\|/g, "/") ?? "None"} |`,
    )
    .join("\n");
  const excluded = args.excludedTenants
    .map((tenant) => `- ${tenant.tenantKey}: ${tenant.reason}`)
    .join("\n") || "- None";
  const moduleRows = args.moduleContextSnapshots
    .map(
      (snapshot) =>
        `| ${snapshot.tenantProfileHeader.displayName} | ${snapshot.moduleContextSummary?.sourceMode ?? "unknown"} | ${snapshot.lineage.status} | ${snapshot.executiveProfile.contextDepthWidth.loadedRecords.toLocaleString()} | ${snapshot.moduleContextSummary?.contextCompleteness.overall ?? "n/a"} |`,
    )
    .join("\n");
  return `# Home Summary Snapshot Proof

Generated: \`${args.generatedAt}\`

This proof is read-only. It does not upload files, validate files, create candidates, promote candidates, update Active Tenant Access, write production tenant data, or change module runtime behavior.

## Active Snapshots

| Tenant | Status | Loaded records | Manifest posture | Next data action |
| --- | --- | ---: | --- | --- |
${rows}

## Candidate Preview

Candidate preview snapshots are generated as explicit inactive preview mode only. They are not active tenant truth and are not read by modules by default.

## Module Context Serving Snapshots

These snapshots are built from \`getModuleContext(...)\` and \`explainModuleContext(...)\`.

| Tenant | Source mode | Status | Loaded records | Completeness |
| --- | --- | --- | ---: | --- |
${moduleRows}

## Excluded

${excluded}

## Guardrails

- deterministicBuilder: true
- callsClaude: false
- productionTenantDataWritten: false
- activeTenantAccessLayerUpdated: false
- candidatePromoted: false
- moduleRuntimeConsumptionChanged: false
- candidateReadByDefault: false
- Northstar processed as active: false
`;
}

function renderHtml(args: {
  generatedAt: string;
  snapshots: HomeSummarySnapshot[];
  candidatePreviewSnapshots: HomeSummarySnapshot[];
  moduleContextSnapshots: HomeSummarySnapshot[];
  excludedTenants: Array<{ tenantKey: string; reason: string }>;
}): string {
  const cards = args.moduleContextSnapshots
    .map((snapshot) => {
      const metrics = snapshot.executiveProfile.enterpriseSnapshotMetrics
        .map(
          (metric) => `<article><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><p>${escapeHtml(metric.detail)}</p></article>`,
        )
        .join("");
      const areas = snapshot.contextAreas
        .map(
          (area) => `<tr><td>${escapeHtml(area.displayName)}</td><td>${area.loadedCount.toLocaleString()}</td><td>${area.sourceCount.toLocaleString()}</td><td>${escapeHtml(area.answerability)}</td><td>${escapeHtml(area.nextDataActions[0] ?? "")}</td></tr>`,
        )
        .join("");
      return `<section class="tenant">
        <header>
          <div><p>HOME SUMMARY SNAPSHOT</p><h2>${escapeHtml(snapshot.tenantProfileHeader.displayName)}</h2><span>${escapeHtml(snapshot.tenantProfileHeader.dataOrigin)} · ${escapeHtml(snapshot.lineage.status)} · ${escapeHtml(snapshot.lineage.mode)}</span></div>
          <code>${escapeHtml(snapshot.lineage.inputFingerprint.slice(0, 16))}</code>
        </header>
        <div class="metrics">${metrics}</div>
        <div class="columns">
          <article><h3>What AbarVa knows</h3><ul>${snapshot.executiveProfile.whatAbarVaKnows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>
          <article><h3>Do not rely yet</h3><ul>${snapshot.executiveProfile.doNotRelyYet.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>
          <article><h3>aVa scope</h3><ul>${snapshot.avaScope.suggestedPrompts.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>
        </div>
        <table><thead><tr><th>Area</th><th>Loaded</th><th>Sources</th><th>Answerability</th><th>Next action</th></tr></thead><tbody>${areas}</tbody></table>
      </section>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Summary Snapshot Control</title><style>
    body{margin:0;background:#f5f1eb;color:#07162f;font-family:Inter,Arial,sans-serif}main{max-width:1440px;margin:auto;padding:32px}h1,h2,h3{font-family:Georgia,serif}h1{font-size:42px;margin:0 0 8px}.lede{color:#536073;margin:0 0 24px}.tenant{background:#fff;border:1px solid #d8d1c2;border-radius:14px;margin:18px 0;padding:22px}header{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #e7e3da;padding-bottom:16px}header p{font-size:11px;letter-spacing:.16em;color:#1f6b3a;font-weight:800;margin:0 0 6px}header h2{font-size:30px;margin:0 0 6px}header span{color:#536073}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.metrics article,.columns article{border:1px solid #e7e3da;border-radius:10px;background:#fbfaf7;padding:14px}.metrics span{font-size:10px;letter-spacing:.12em;color:#7b7a72;text-transform:uppercase}.metrics strong{display:block;font-family:Georgia,serif;font-size:24px;margin:7px 0}.metrics p,li{color:#334155;line-height:1.45}.columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{border-top:1px solid #e7e3da;text-align:left;padding:10px}th{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7b7a72}code{align-self:start;background:#07162f;color:#22aeea;border-radius:8px;padding:8px 10px}@media(max-width:900px){.metrics,.columns{grid-template-columns:1fr}main{padding:18px}}
  </style></head><body><main><h1>Home Summary Snapshot Control</h1><p class="lede">Generated ${escapeHtml(args.generatedAt)}. This is the structured, deterministic object the next Home UI consumes.</p>${cards}</main></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function writeJson(fileName: string, value: unknown) {
  await fs.writeFile(
    path.join(outDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
