#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import {
  buildTenantManifestProjectionAudit,
  domainLabels,
  type TenantManifestProjectionAudit,
} from "../../src/lib/admin/tenant-manifest-projection-audit";

const root = process.cwd();
const outDir = path.join(root, "reports/data-quality/manifest-projection/latest");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(name: string, value: unknown): void {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status: string): string {
  if (status === "complete") return "ok";
  if (status === "partial") return "warn";
  if (status === "thin" || status === "stranded" || status === "blocked") return "bad";
  return "muted";
}

function writeSummary(audit: TenantManifestProjectionAudit): void {
  const lines = [
    "# DATA-PR31 Tenant Manifest Completeness and Source Projection Audit",
    "",
    `Generated: ${audit.generatedAt}`,
    "",
    "## Truth split",
    "",
    "- Implemented: all-tenant manifest completeness audit, source projection audit, stranded-source detection, adapter/mapping gap detection, Home/aVa representation warnings, Admin visibility.",
    "- Not implemented: source remediation, candidate regeneration, production writes, candidate promotion, Active Tenant Access update, module runtime behavior changes.",
    "",
    "## Guardrails",
    "",
    `- productionTenantDataWritten: ${audit.guardrails.productionTenantDataWritten}`,
    `- candidatePromoted: ${audit.guardrails.candidatePromoted}`,
    `- activeTenantAccessLayerUpdated: ${audit.guardrails.activeTenantAccessLayerUpdated}`,
    `- moduleRuntimeBehaviorChanged: ${audit.guardrails.moduleRuntimeBehaviorChanged}`,
    `- activeTenantTruthChanged: ${audit.guardrails.activeTenantTruthChanged}`,
    "",
    "## Upload path alignment",
    "",
    `- Target process: ${audit.uploadPathAlignment.targetProcess}`,
    `- Canonical landing: ${audit.uploadPathAlignment.canonicalLandingContainer}/${audit.uploadPathAlignment.canonicalLandingPrefix}`,
    `- Current loader landing: ${audit.uploadPathAlignment.currentLoaderLandingContainer}/${audit.uploadPathAlignment.currentLoaderLandingPrefix}`,
    `- Legacy staging container: ${audit.uploadPathAlignment.legacyStagingContainer}`,
    `- Admin upload alignment: ${audit.uploadPathAlignment.adminUploadAlignment}`,
    `- Loader kickoff: ${audit.uploadPathAlignment.loaderKickoff}`,
    `- Required correction: ${audit.uploadPathAlignment.requiredCorrection}`,
    "",
    "## Tenant summary",
    "",
    "| Tenant | Status | Source files | Structured rows | Manifest files | Included files | Candidate records | Home rows | Blockers |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...audit.tenants.map((tenant) =>
      `| ${tenant.displayName} | ${tenant.status} | ${tenant.sourceFilesDiscovered} | ${tenant.sourceStructuredRows.toLocaleString()} | ${tenant.candidateManifestFilesDiscovered} | ${tenant.candidateManifestIncludedFiles} | ${tenant.candidateRecordsGenerated.toLocaleString()} | ${tenant.activeHomeContextRows.toLocaleString()} | ${tenant.blockers.length} |`,
    ),
    "",
    "## Excluded tenants",
    "",
    ...audit.excludedTenants.map((tenant) => `- ${tenant.tenantKey}: ${tenant.reason}`),
    "",
    "## SkyHarbor required findings",
    "",
    "| Required item | Accessible | Included in candidate manifest | Rows | Path |",
    "| --- | --- | --- | ---: | --- |",
    ...audit.skyHarborRequiredFindings.map((item) =>
      `| ${item.label} | ${item.accessible} | ${item.includedInCandidateManifest} | ${item.rowCount ?? "n/a"} | ${item.path} |`,
    ),
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeRemediationPlan(audit: TenantManifestProjectionAudit): void {
  const lines = [
    "# Manifest Projection Remediation Plan",
    "",
    "This plan is generated from DATA-PR31. It does not mutate data; it identifies what must be fixed before any candidate can be promoted.",
    "",
  ];

  for (const tenant of audit.tenants) {
    lines.push(`## ${tenant.displayName}`);
    lines.push("");
    if (tenant.blockers.length === 0) {
      lines.push("- No promotion blockers detected by this audit.");
    } else {
      for (const blocker of tenant.blockers.slice(0, 12)) {
        lines.push(`- ${blocker}`);
      }
      if (tenant.blockers.length > 12) {
        lines.push(`- ${tenant.blockers.length - 12} additional blockers in promotion-blockers.json.`);
      }
    }
    lines.push("");
    lines.push("Recommended next step: select the authoritative source file per stranded domain, add it to the candidate manifest with an adapter/mapping profile, regenerate an inactive candidate, and re-run the promotion gate.");
    lines.push("");
  }

  fs.writeFileSync(path.join(outDir, "remediation-plan.md"), `${lines.join("\n")}\n`);
}

function writeHtml(audit: TenantManifestProjectionAudit): void {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tenant Manifest Completeness</title>
  <style>
    :root { --paper:#f8f7f4; --ink:#071225; --muted:#5b6472; --line:#ded7ca; --navy:#071a3a; --teal:#148c78; --amber:#9a6500; --red:#9f2418; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1680px; margin:0 auto; padding: 34px 42px 72px; }
    .eyebrow { color:var(--teal); font-size:12px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
    h1,h2,h3 { font-family: Georgia, "Times New Roman", serif; margin:0; letter-spacing:0; }
    h1 { font-size:52px; line-height:1.02; max-width:1120px; }
    h2 { font-size:30px; }
    p { color:#334155; font-size:16px; line-height:1.55; }
    .top { display:grid; grid-template-columns: minmax(0,1fr) 560px; gap:24px; align-items:end; border-bottom:1px solid var(--line); padding-bottom:24px; }
    .guardrails { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .chip { border:1px solid var(--line); border-radius:8px; background:#fffdfa; padding:14px 16px; }
    .chip span { display:block; color:#7b746b; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; }
    .chip strong { display:block; margin-top:6px; color:var(--teal); font-size:22px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; margin-top:24px; }
    .tenant { background:#fffefa; border:1px solid var(--line); border-radius:10px; padding:18px; min-height:210px; }
    .status { display:inline-flex; align-items:center; border-radius:999px; padding:5px 9px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
    .ok { background:#e0f5ec; color:#116c55; }
    .warn { background:#fff2cf; color:#815500; }
    .bad { background:#ffe1dc; color:#8f2117; }
    .muted { background:#edf0f3; color:#526071; }
    .metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:16px; }
    .metric { border-top:1px solid var(--line); padding-top:10px; }
    .metric span { color:#7b746b; font-size:11px; text-transform:uppercase; letter-spacing:.1em; font-weight:800; }
    .metric strong { display:block; margin-top:4px; font-size:24px; font-family: Georgia, "Times New Roman", serif; }
    .section { margin-top:34px; background:#fffefa; border:1px solid var(--line); border-radius:10px; padding:22px; }
    table { width:100%; border-collapse:collapse; margin-top:16px; font-size:14px; }
    th { text-align:left; color:#7b746b; font-size:11px; text-transform:uppercase; letter-spacing:.11em; border-bottom:1px solid var(--line); padding:10px 8px; }
    td { border-bottom:1px solid #ece7dc; padding:11px 8px; vertical-align:top; }
    .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; overflow-wrap:anywhere; color:#39465a; }
    .blockers { columns:2; column-gap:28px; }
    .blockers li { break-inside:avoid; margin:0 0 10px; color:#344054; }
    @media (max-width: 1200px) { .top, .grid { grid-template-columns:1fr; } .blockers { columns:1; } }
  </style>
</head>
<body>
<main>
  <section class="top">
    <div>
      <div class="eyebrow">Admin · Data layer proof · Read only</div>
      <h1>Tenant Manifest Completeness and Source Projection Audit</h1>
      <p>Shows which rich tenant source files exist, which files are actually included in candidate manifests, and where active Home/aVa context is thinner than the available source estate.</p>
    </div>
    <div class="guardrails">
      ${Object.entries(audit.guardrails)
        .map(([key, value]) => `<div class="chip"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`)
        .join("")}
    </div>
  </section>
  <section class="grid">
    ${audit.tenants
      .map(
        (tenant) => `<article class="tenant">
          <span class="status ${statusClass(tenant.status)}">${escapeHtml(tenant.status)}</span>
          <h2 style="margin-top:12px">${escapeHtml(tenant.displayName)}</h2>
          <p>${escapeHtml(tenant.blockers[0] ?? "No manifest projection blocker detected.")}</p>
          <div class="metrics">
            <div class="metric"><span>Source rows</span><strong>${tenant.sourceStructuredRows.toLocaleString()}</strong></div>
            <div class="metric"><span>Candidate rows</span><strong>${tenant.candidateRecordsGenerated.toLocaleString()}</strong></div>
            <div class="metric"><span>Included files</span><strong>${tenant.candidateManifestIncludedFiles}/${tenant.sourceFilesDiscovered}</strong></div>
            <div class="metric"><span>Home rows</span><strong>${tenant.activeHomeContextRows.toLocaleString()}</strong></div>
          </div>
        </article>`,
      )
      .join("")}
  </section>
  <section class="section">
    <h2>Upload path alignment</h2>
    <table>
      <tbody>
        <tr><th>Target process</th><td>${escapeHtml(audit.uploadPathAlignment.targetProcess)}</td></tr>
        <tr><th>Canonical landing</th><td class="path">${escapeHtml(`${audit.uploadPathAlignment.canonicalLandingContainer}/${audit.uploadPathAlignment.canonicalLandingPrefix}`)}</td></tr>
        <tr><th>Current loader landing</th><td class="path">${escapeHtml(`${audit.uploadPathAlignment.currentLoaderLandingContainer}/${audit.uploadPathAlignment.currentLoaderLandingPrefix}`)}</td></tr>
        <tr><th>Legacy staging</th><td class="path">${escapeHtml(audit.uploadPathAlignment.legacyStagingContainer)}</td></tr>
        <tr><th>Admin upload alignment</th><td><span class="status bad">${escapeHtml(audit.uploadPathAlignment.adminUploadAlignment)}</span></td></tr>
        <tr><th>Required correction</th><td>${escapeHtml(audit.uploadPathAlignment.requiredCorrection)}</td></tr>
      </tbody>
    </table>
  </section>
  <section class="section">
    <h2>Domain projection matrix</h2>
    <table>
      <thead><tr><th>Tenant</th><th>Domain</th><th>Sources</th><th>Templates</th><th>Manifest</th><th>Adapter</th><th>Mapping</th><th>Home/aVa</th><th>Status</th><th>Reason</th></tr></thead>
      <tbody>
      ${audit.tenants
        .flatMap((tenant) => tenant.domains.filter((domain) => domain.sourceFilesDiscovered > 0 || domain.promotionBlocker))
        .map(
          (domain) => `<tr>
            <td>${escapeHtml(domain.tenantName)}</td>
            <td>${escapeHtml(domain.label)}</td>
            <td>${domain.sourceFilesDiscovered}</td>
            <td>${domain.transformedTemplatesDiscovered}</td>
            <td>${escapeHtml(domain.candidateManifestIncluded)}</td>
            <td>${escapeHtml(domain.adapterExists)}</td>
            <td>${escapeHtml(domain.mappingProfileExists)}</td>
            <td>${escapeHtml(domain.homeVisible)} / ${escapeHtml(domain.avaReadable)}</td>
            <td><span class="status ${statusClass(domain.status)}">${escapeHtml(domain.status)}</span></td>
            <td>${escapeHtml(domain.reasonIfExcluded ?? "")}</td>
          </tr>`,
        )
        .join("")}
      </tbody>
    </table>
  </section>
  <section class="section">
    <h2>SkyHarbor required source check</h2>
    <table>
      <thead><tr><th>Required source</th><th>Accessible</th><th>Manifest included</th><th>Rows</th><th>Path</th></tr></thead>
      <tbody>
      ${audit.skyHarborRequiredFindings
        .map(
          (item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.accessible)}</td><td>${escapeHtml(item.includedInCandidateManifest)}</td><td>${escapeHtml(item.rowCount ?? "n/a")}</td><td class="path">${escapeHtml(item.path)}</td></tr>`,
        )
        .join("")}
      </tbody>
    </table>
  </section>
  <section class="section">
    <h2>Promotion blockers</h2>
    <ul class="blockers">
      ${audit.promotionBlockers.map((item) => `<li><strong>${escapeHtml(item.tenantName)}:</strong> ${escapeHtml(item.blocker)}</li>`).join("")}
    </ul>
  </section>
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "manifest-projection-control.html"), html);
}

function writeReports(audit: TenantManifestProjectionAudit): void {
  ensureDir(outDir);
  writeJson("tenant-manifest-completeness.json", audit.tenants);
  writeJson("source-domain-inventory.json", {
    domains: domainLabels(),
    tenants: audit.tenants.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      domains: tenant.domains,
    })),
  });
  writeJson("manifest-vs-source-gaps.json", audit.promotionBlockers);
  writeJson("transformed-template-usage.json", audit.sourceFiles.filter((file) => file.isTransformedTemplate));
  writeJson("adapter-coverage.json", audit.tenants.map((tenant) => ({
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    domains: tenant.domains.map((domain) => ({
      domain: domain.domain,
      adapterExists: domain.adapterExists,
      sourceFilesDiscovered: domain.sourceFilesDiscovered,
      status: domain.adapterExists ? "available" : "missing",
    })),
  })));
  writeJson("mapping-coverage.json", audit.tenants.map((tenant) => ({
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    domains: tenant.domains.map((domain) => ({
      domain: domain.domain,
      mappingProfileExists: domain.mappingProfileExists,
      candidateManifestIncluded: domain.candidateManifestIncluded,
      status: domain.mappingProfileExists ? "available" : "missing",
    })),
  })));
  writeJson("source-projection-lineage.json", audit.sourceFiles);
  writeJson("home-ava-representation.json", audit.tenants.map((tenant) => ({
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    homeRepresentationScore: tenant.homeRepresentationScore,
    avaRepresentationScore: tenant.avaRepresentationScore,
    activeHomeContextRows: tenant.activeHomeContextRows,
    domains: tenant.domains.map((domain) => ({
      domain: domain.domain,
      homeVisible: domain.homeVisible,
      avaReadable: domain.avaReadable,
      activeHomeRows: domain.activeHomeRows,
      richestSourceRows: domain.richestSourceRows,
      warning: domain.reasonIfExcluded,
    })),
  })));
  writeJson("promotion-blockers.json", audit.promotionBlockers);
  writeJson("full-audit.json", audit);
  writeSummary(audit);
  writeRemediationPlan(audit);
  writeHtml(audit);
}

function failIfUnsafe(audit: TenantManifestProjectionAudit): void {
  const guardrails = audit.guardrails;
  if (
    guardrails.productionTenantDataWritten ||
    guardrails.candidatePromoted ||
    guardrails.activeTenantAccessLayerUpdated ||
    guardrails.moduleRuntimeBehaviorChanged ||
    guardrails.activeTenantTruthChanged
  ) {
    throw new Error("Read-only guardrail violation detected.");
  }
}

const audit = buildTenantManifestProjectionAudit({ root, includeDownloads: true });
writeReports(audit);
failIfUnsafe(audit);

const tenantSummary = audit.tenants
  .map(
    (tenant) =>
      `${tenant.displayName}: ${tenant.status}, sourceRows=${tenant.sourceStructuredRows}, candidateRows=${tenant.candidateRecordsGenerated}, blockers=${tenant.blockers.length}`,
  )
  .join("\n");

console.log(`DATA-PR31 manifest projection audit written to ${path.relative(root, outDir)}`);
console.log(tenantSummary);
