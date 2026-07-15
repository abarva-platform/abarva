import fs from "node:fs";
import path from "node:path";

import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tower-v3-meridian-context-pack-proof");
const activeInputRoot = "datasets/tenant-inputs/active/meridian-health/current";

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath: string, rows: Array<Record<string, unknown>>): void {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeHtml(args: {
  filePath: string;
  summary: ReturnType<typeof buildTowerV3ContextPackFromTenantInputs>["summary"];
}): void {
  const { summary } = args;
  const checks = Object.entries(summary.acceptance)
    .map(
      ([key, passed]) =>
        `<tr><td>${htmlEscape(key)}</td><td class="${passed ? "pass" : "fail"}">${passed ? "Pass" : "Fail"}</td></tr>`,
    )
    .join("");
  const dimensions = summary.sourceDimensions
    .map(
      (dimension) => `
        <tr>
          <td>${htmlEscape(dimension.dimensionKey)}</td>
          <td>${htmlEscape(dimension.fileName)}</td>
          <td>${dimension.rowCount}</td>
          <td>${dimension.factCount}</td>
          <td>${dimension.evidenceCount}</td>
          <td>${htmlEscape(dimension.projectionStatus)}</td>
        </tr>`,
    )
    .join("");
  fs.writeFileSync(
    args.filePath,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower v3 Meridian ContextPack Proof</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #101828; background: #fbfaf7; }
    h1 { font-family: Georgia, serif; font-size: 34px; margin-bottom: 8px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .lede { max-width: 900px; color: #475467; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .card { background: white; border: 1px solid #e4dfd5; border-radius: 10px; padding: 16px; }
    .label { color: #667085; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    .value { font-size: 24px; font-weight: 750; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e4dfd5; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eee8df; text-align: left; font-size: 13px; }
    th { color: #667085; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
    .pass { color: #027a48; font-weight: 750; }
    .fail { color: #b42318; font-weight: 750; }
    .warn { border-left: 4px solid #f79009; }
    code { background: #f2eee7; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Tower v3 Meridian ContextPack Proof</h1>
  <p class="lede">
    This proof reads Meridian active v3 tenant input dimensions 08, 09, 11, 14, 17, and 18.
    It proves a TowerContextPack can be produced from active v3 context while keeping
    <code>cio_tower</code> bridge-only and blocking realized-value language until measured,
    finance-attested evidence passes the TowerValueClaim gate.
  </p>
  <div class="grid">
    <div class="card"><div class="label">Mode</div><div class="value">${htmlEscape(summary.mode)}</div></div>
    <div class="card"><div class="label">Truth status</div><div class="value">${htmlEscape(summary.truthStatus)}</div></div>
    <div class="card"><div class="label">Value claims</div><div class="value">${summary.towerValueClaimCount}</div></div>
    <div class="card warn"><div class="label">Realized value allowed</div><div class="value">${summary.realizedValueLanguageAllowed ? "Yes" : "No"}</div></div>
  </div>
  <h2>Acceptance</h2>
  <table><tbody>${checks}</tbody></table>
  <h2>Source Dimensions</h2>
  <table>
    <thead><tr><th>Dimension</th><th>File</th><th>Rows</th><th>Facts</th><th>Evidence</th><th>Projection</th></tr></thead>
    <tbody>${dimensions}</tbody>
  </table>
</body>
</html>
`,
  );
}

function main(): void {
  ensureDir(outDir);
  const proof = buildTowerV3ContextPackFromTenantInputs({
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    activeInputRoot,
  });

  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(proof.summary, null, 2)}\n`);
  fs.writeFileSync(
    path.join(outDir, "tower-context-pack-sample.json"),
    `${JSON.stringify(
      {
        contextPackId: proof.contextPack.contextPackId,
        tenantKey: proof.contextPack.tenantKey,
        mode: proof.contextPack.mode,
        truthStatus: proof.contextPack.truthStatus,
        executiveSummary: proof.contextPack.executiveSummary,
        sourceOfTruthPath: proof.contextPack.sourceOfTruthPath,
        projectionPath: proof.contextPack.projectionPath,
        projectionStatus: proof.contextPack.projectionStatus,
        v3SourceDimensions: proof.contextPack.v3SourceDimensions,
        derivedProjectionLineage: proof.contextPack.derivedProjectionLineage,
        towerMetricRecords: proof.contextPack.towerMetricRecords.slice(0, 25),
        towerValueRecords: proof.contextPack.towerValueRecords.slice(0, 25),
        towerValueClaims: proof.contextPack.towerValueClaims.slice(0, 25),
        blockedValueClaims: proof.contextPack.blockedValueClaims.slice(0, 25),
        towerTruthCaveats: proof.contextPack.towerTruthCaveats,
        caveats: proof.contextPack.caveats,
        recommendedNextEvidence: proof.contextPack.recommendedNextEvidence,
      },
      null,
      2,
    )}\n`,
  );

  writeCsv(
    path.join(outDir, "source-dimension-lineage.csv"),
    proof.summary.sourceDimensions.map((dimension) => ({
      dimension_key: dimension.dimensionKey,
      file_name: dimension.fileName,
      row_count: dimension.rowCount,
      fact_count: dimension.factCount,
      evidence_count: dimension.evidenceCount,
      projection_status: dimension.projectionStatus,
    })),
  );
  writeCsv(
    path.join(outDir, "tower-record-lineage.csv"),
    [
      ...proof.contextPack.towerMetricRecords.map((record) => ({
        record_type: "metric",
        record_id: record.metricId,
        label: record.label,
        source_dimension: record.sourceDimension,
        evidence_ids: record.evidenceIds.join(";"),
        projection_status: record.projectionStatus,
        safe_to_display: record.safeToDisplay,
      })),
      ...proof.contextPack.towerValueRecords.map((record) => ({
        record_type: "value",
        record_id: record.valueRecordId,
        label: record.label,
        source_dimension: record.sourceDimension,
        evidence_ids: record.evidenceIds.join(";"),
        projection_status: record.projectionStatus,
        claim_basis: record.claimBasis,
        safe_to_display: record.safeToDisplay,
      })),
    ],
  );
  writeCsv(
    path.join(outDir, "value-claim-gates.csv"),
    proof.contextPack.towerValueClaims.map((claim) => ({
      claim_id: claim.claimId,
      claim_kind: claim.claimKind,
      label: claim.label,
      gate_status: claim.gateStatus,
      realized_value_language_allowed: claim.realizedValueLanguageAllowed,
      reason: claim.reason,
      required_evidence: claim.requiredEvidence.join("; "),
      evidence_ids: claim.evidenceIds.join(";"),
      source_fact_ids: claim.sourceFactIds.join(";"),
    })),
  );
  fs.writeFileSync(
    path.join(outDir, "proof.md"),
    `# Tower v3 Meridian ContextPack Proof

Status: ${Object.values(proof.summary.acceptance).every(Boolean) ? "Pass" : "Fail"}

This proof reads active Meridian v3 tenant input files for dimensions 08, 09, 11, 14, 17, and 18.
It does not use \`cio_tower\` as source truth. \`cio_tower\` remains bridge-only until row-level reconciliation is proven.

## Result

- Context pack: \`${proof.summary.contextPackId}\`
- Mode: \`${proof.summary.mode}\`
- Truth status: \`${proof.summary.truthStatus}\`
- Tower metric records: ${proof.summary.towerMetricRecordCount}
- Tower value records: ${proof.summary.towerValueRecordCount}
- Tower value claims: ${proof.summary.towerValueClaimCount}
- Blocked value claims: ${proof.summary.blockedValueClaimCount}
- Realized-value language allowed: ${proof.summary.realizedValueLanguageAllowed ? "Yes" : "No"}

## Truth Split

This is live active v3 tenant input proof, not synthetic fixture contract proof. The rows remain planning-grade where their source classification says so, so Tower can show measurement/readiness context but cannot claim realized/proven/delivered value.
`,
  );
  writeHtml({ filePath: path.join(outDir, "proof.html"), summary: proof.summary });

  const failedChecks = Object.entries(proof.summary.acceptance)
    .filter(([, passed]) => !passed)
    .map(([check]) => check);
  if (failedChecks.length > 0) {
    throw new Error(`tower_v3_meridian_context_pack_proof_failed:${failedChecks.join(",")}`);
  }
  console.log(`Tower v3 Meridian ContextPack proof passed: ${outDir}`);
}

main();
