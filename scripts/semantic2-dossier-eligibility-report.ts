#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

import { evaluateDossierSurfaceEligibility } from "@/lib/semantic2/dossiers";

interface DossierRow {
  id: string;
  tenant_key: string;
  dimension_key: string;
  prompt_version: string;
  dossier_version: string;
  coverage_score: number | string | null;
  confidence: number | string | null;
  evidence_packet: unknown;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function arg(name: string, fallback = ""): string {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function queryRows(): Promise<DossierRow[]> {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const client = new Client({
    connectionString,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const result = await client.query<DossierRow>(
      `
        SELECT COALESCE(id::text, tenant_key || ':' || dimension_key || ':' || prompt_version) AS id,
               tenant_key, dimension_key, prompt_version, dossier_version, coverage_score,
               confidence, evidence_packet
        FROM semantic2_dossiers
        WHERE invalidated_at IS NULL
        ORDER BY tenant_key, dimension_key, built_at DESC
      `,
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

function reportRows(rows: DossierRow[]) {
  return rows.map((row) => {
    const result = evaluateDossierSurfaceEligibility({
      dossier: row.evidence_packet,
      dossierId: row.id,
      tenantKey: row.tenant_key,
      dimensionKey: row.dimension_key,
    });
    return {
      id: row.id,
      tenant_key: row.tenant_key,
      canonical_tenant_key: result.canonicalTenantKey,
      dimension_key: row.dimension_key,
      prompt_version: row.prompt_version,
      dossier_version: row.dossier_version,
      eligibility_level: result.eligibilityLevel,
      surface_eligible: result.surfaceEligible,
      coverage: result.metrics.coverage,
      confidence: result.metrics.confidence,
      facts: result.metrics.facts,
      entities: result.metrics.entities,
      relationships: result.metrics.relationships,
      citations: result.metrics.citations,
      usable_citations: result.metrics.usableCitations,
      blocker_leaks: result.metrics.blockerLeaks,
      warning_leaks: result.metrics.warningLeaks,
      reasons: result.reasons.join(" | "),
      required_fixes: result.requiredFixes.join(" | "),
      warnings: result.warnings.join(" | "),
    };
  });
}

function csv(rows: ReturnType<typeof reportRows>): string {
  const columns = [
    "tenant_key",
    "canonical_tenant_key",
    "dimension_key",
    "eligibility_level",
    "surface_eligible",
    "coverage",
    "confidence",
    "facts",
    "entities",
    "relationships",
    "citations",
    "usable_citations",
    "blocker_leaks",
    "warning_leaks",
    "reasons",
    "required_fixes",
    "prompt_version",
  ];
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column as keyof typeof row])).join(","))].join("\n");
}

function html(rows: ReturnType<typeof reportRows>): string {
  const byLevel = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.eligibility_level] = (acc[row.eligibility_level] ?? 0) + 1;
    return acc;
  }, {});
  const byDimension = [...new Set(rows.map((row) => row.dimension_key))].map((dimension) => {
    const subset = rows.filter((row) => row.dimension_key === dimension);
    const ready = subset.filter((row) => row.surface_eligible).length;
    const wouldAfterFix = subset.filter((row) => !row.surface_eligible && row.facts > 0).length;
    return { dimension, ready, wouldAfterFix, total: subset.length };
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Semantic2 L3 Dossier Surface Eligibility</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#172033;background:#fafafa}
    h1,h2{letter-spacing:-.02em}
    table{border-collapse:collapse;width:100%;background:white;margin:18px 0;border:1px solid #ddd}
    th,td{border-bottom:1px solid #e5e5e5;padding:8px 10px;text-align:left;vertical-align:top;font-size:13px}
    th{background:#f0f3f6;text-transform:uppercase;font-size:11px;letter-spacing:.08em}
    .blocked{color:#9b1c1c;font-weight:700}.ready{color:#0f6b3f;font-weight:700}.partial{color:#8a5a00;font-weight:700}
    .note{background:#fff7db;border-left:4px solid #c89416;padding:12px 14px}
  </style>
</head>
<body>
  <h1>Semantic2 L3 Dossier Surface Eligibility</h1>
  <p class="note">This is a gate report, not a surface enablement. It separates ready-now dossiers from partial/operator-only/blocked dossiers and makes tenant-scope leakage explicit.</p>
  <h2>Summary</h2>
  <ul>${Object.entries(byLevel).map(([key, value]) => `<li><strong>${htmlEscape(key)}</strong>: ${value}</li>`).join("")}</ul>
  <h2>Ready Now vs Would Qualify After Fix</h2>
  <table><thead><tr><th>Dimension</th><th>Ready now</th><th>Would qualify after extraction/relationship/citation fix</th><th>Total</th></tr></thead><tbody>
  ${byDimension.map((row) => `<tr><td>${htmlEscape(row.dimension)}</td><td>${row.ready}</td><td>${row.wouldAfterFix}</td><td>${row.total}</td></tr>`).join("")}
  </tbody></table>
  <h2>Dossier Detail</h2>
  <table><thead><tr><th>Tenant</th><th>Dimension</th><th>Level</th><th>Facts</th><th>Entities</th><th>Relationships</th><th>Citations</th><th>Reasons</th></tr></thead><tbody>
  ${rows.map((row) => `<tr><td>${htmlEscape(row.tenant_key)}</td><td>${htmlEscape(row.dimension_key)}</td><td class="${row.eligibility_level}">${htmlEscape(row.eligibility_level)}</td><td>${row.facts}</td><td>${row.entities}</td><td>${row.relationships}</td><td>${row.usable_citations}/${row.citations}</td><td>${htmlEscape(row.reasons || "Ready")}</td></tr>`).join("")}
  </tbody></table>
</body></html>`;
}

function markdown(title: string, rows: ReturnType<typeof reportRows>, predicate: (row: ReturnType<typeof reportRows>[number]) => boolean): string {
  const subset = rows.filter(predicate);
  return [
    `# ${title}`,
    "",
    `Rows: ${subset.length}`,
    "",
    "| Tenant | Dimension | Level | Facts | Entities | Relationships | Usable citations | Reasons |",
    "|---|---|---|---:|---:|---:|---:|---|",
    ...subset.map((row) => `| ${row.tenant_key} | ${row.dimension_key} | ${row.eligibility_level} | ${row.facts} | ${row.entities} | ${row.relationships} | ${row.usable_citations} | ${row.reasons || "Ready"} |`),
    "",
  ].join("\n");
}

async function main() {
  const outDir = arg("--out-dir", path.join(process.cwd(), "proof", `semantic2-dossier-eligibility-${stamp()}`));
  const rows = reportRows(await queryRows());
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "eligibility-report.json"), JSON.stringify(rows, null, 2));
  await fs.writeFile(path.join(outDir, "eligibility-report.csv"), csv(rows));
  await fs.writeFile(path.join(outDir, "eligibility-report.html"), html(rows));
  await fs.writeFile(path.join(outDir, "ready-dossiers.md"), markdown("Ready Dossiers", rows, (row) => row.eligibility_level === "ready"));
  await fs.writeFile(path.join(outDir, "partial-dossiers.md"), markdown("Partial Dossiers", rows, (row) => row.eligibility_level === "partial"));
  await fs.writeFile(path.join(outDir, "blocked-dossiers.md"), markdown("Blocked and Operator-only Dossiers", rows, (row) => row.eligibility_level === "blocked" || row.eligibility_level === "operator_only"));
  await fs.writeFile(
    path.join(outDir, "tenant-scope-report.md"),
    markdown("Tenant Scope Report", rows, () => true),
  );
  await fs.writeFile(
    path.join(outDir, "quality-threshold-summary.md"),
    markdown("Quality Threshold Summary", rows, () => true),
  );
  console.log(JSON.stringify({ ok: true, outDir, rows: rows.length, ready: rows.filter((row) => row.surface_eligible).length }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
