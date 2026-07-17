import fs from "node:fs";
import path from "node:path";

import {
  buildTowerGovernedCandidateLoadReport,
  type TowerGovernedCandidateLoadReport,
} from "@/lib/enterprise-data/tower-candidate-load/tower-governed-candidate-load";

const repoRoot = process.cwd();
const outDir = path.join(
  repoRoot,
  "reports/tower-governed-candidate-load/meridian-health",
);

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
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(","),
    ),
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

function writeHtml(report: TowerGovernedCandidateLoadReport): void {
  const gateRows = report.qualityGateChecks
    .map(
      (check) => `
        <tr>
          <td>${htmlEscape(check.label)}</td>
          <td class="${check.status}">${htmlEscape(check.status)}</td>
          <td>${htmlEscape(check.detail)}</td>
        </tr>`,
    )
    .join("");
  const dimensionRows = report.sourceDimensions
    .map(
      (dimension) => `
        <tr>
          <td>${htmlEscape(dimension.dimensionKey)}</td>
          <td>${htmlEscape(dimension.fileName)}</td>
          <td>${dimension.rowCount}</td>
          <td>${dimension.evidenceCount}</td>
          <td>${htmlEscape(dimension.projectionStatus)}</td>
        </tr>`,
    )
    .join("");
  const blockerCards = report.candidatePreview.executiveBlockerThemes
    .map((theme) => `<li>${htmlEscape(theme)}</li>`)
    .join("");

  fs.writeFileSync(
    path.join(outDir, "proof.html"),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower governed candidate load proof</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #101828; background: #fbfaf7; }
    h1 { font-family: Georgia, serif; font-size: 34px; margin-bottom: 8px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .lede { max-width: 980px; color: #475467; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .card { background: white; border: 1px solid #e4dfd5; border-radius: 10px; padding: 16px; }
    .label { color: #667085; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    .value { font-size: 22px; font-weight: 760; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e4dfd5; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eee8df; text-align: left; font-size: 13px; vertical-align: top; }
    th { color: #667085; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
    .pass { color: #027a48; font-weight: 750; text-transform: uppercase; }
    .fail { color: #b42318; font-weight: 750; text-transform: uppercase; }
    .banner { border-left: 5px solid #0ea5e9; background: #eef8ff; padding: 14px 16px; margin: 20px 0; }
    code { background: #f2eee7; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Tower Governed Candidate Load Proof</h1>
  <p class="lede">
    This proof builds the Meridian Tower candidate-load plan from the v3 TowerContextPack
    path. It is deliberately candidate-preview only: no production tenant data is written,
    Active Tenant Access is not updated, and Tower runtime does not read candidate data by default.
  </p>
  <div class="banner"><strong>${htmlEscape(report.candidatePreview.previewBanner)}</strong></div>
  <div class="grid">
    <div class="card"><div class="label">Quality gate</div><div class="value">${htmlEscape(report.qualityGateStatus)}</div></div>
    <div class="card"><div class="label">Candidate version</div><div class="value">${htmlEscape(report.candidateVersionId)}</div></div>
    <div class="card"><div class="label">Metric records</div><div class="value">${report.lineage.towerMetricRecordCount}</div></div>
    <div class="card"><div class="label">Value claims</div><div class="value">${report.lineage.towerValueClaimCount}</div></div>
  </div>
  <h2>Truth Split</h2>
  <p class="lede">
    Retrieval state: <code>${htmlEscape(report.truthSplit.retrievalState)}</code>.
    <code>cio_tower</code> remains ${htmlEscape(report.truthSplit.cioTowerSourceOfTruth)}.
  </p>
  <h2>Executive Blocker Themes</h2>
  <ul>${blockerCards}</ul>
  <h2>Quality Gate</h2>
  <table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>${gateRows}</tbody></table>
  <h2>Source Dimensions</h2>
  <table>
    <thead><tr><th>Dimension</th><th>File</th><th>Rows</th><th>Evidence</th><th>Projection</th></tr></thead>
    <tbody>${dimensionRows}</tbody>
  </table>
  <h2>ACA Job Contract</h2>
  <p class="lede">
    Planned job: <code>${htmlEscape(report.acaJobContract.jobName)}</code>.
    This report did not submit the job. Any mutation must use
    <code>${htmlEscape(report.acaJobContract.operatorWrapper)}</code> with a digest-pinned image.
  </p>
</body>
</html>
`,
  );
}

function writeMarkdown(report: TowerGovernedCandidateLoadReport): void {
  fs.writeFileSync(
    path.join(outDir, "summary.md"),
    `# Tower Governed Candidate Load Path - Meridian

Status: ${report.qualityGateStatus === "pass" ? "Pass" : "Fail"}

This proof builds a governed candidate-load plan for Meridian Tower. It does **not**
submit an ACA Job, write production tenant data, update Active Tenant Access, promote
a candidate, or change Tower runtime reads.

## Result

- Candidate version: \`${report.candidateVersionId}\`
- Dataset manifest: \`${report.datasetManifestId}\`
- Input root: \`${report.inputRoot}\`
- Input fingerprint: \`${report.inputFingerprint}\`
- Metrics: ${report.lineage.towerMetricRecordCount}
- Value records: ${report.lineage.towerValueRecordCount}
- Value claims: ${report.lineage.towerValueClaimCount}
- Quality gate: \`${report.qualityGateStatus}\`

## Candidate Preview Boundary

${report.candidatePreview.previewBanner}

Tower may preview measurement readiness, budget/value posture, source dimensions, and
executive blocker themes. Tower must not claim realized value, ROI, savings, achieved
outcomes, or active runtime truth from this candidate preview.

## ACA Job Contract

- Job: \`${report.acaJobContract.jobName}\`
- Run id: \`${report.acaJobContract.runId}\`
- Idempotency key: \`${report.acaJobContract.idempotencyKey}\`
- Operator wrapper: \`${report.acaJobContract.operatorWrapper}\`
- Script: \`${report.acaJobContract.npmScript}\`
- Status: \`${report.acaJobContract.status}\`

## Truth Split

- Active context updated: ${report.truthSplit.activeContextUpdated}
- Candidate preview created: ${report.truthSplit.candidatePreviewCreated}
- Default Tower runtime changed: ${report.truthSplit.defaultTowerRuntimeChanged}
- \`cio_tower\`: ${report.truthSplit.cioTowerSourceOfTruth}
- Retrieval state: ${report.truthSplit.retrievalState}
`,
  );
}

function main(): void {
  ensureDir(outDir);
  const report = buildTowerGovernedCandidateLoadReport({
    repoRoot,
  });

  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "candidate-preview-packet.json"),
    `${JSON.stringify(report.candidatePreview, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "aca-job-contract.json"),
    `${JSON.stringify(report.acaJobContract, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "quality-gate.json"),
    `${JSON.stringify(
      {
        status: report.qualityGateStatus,
        checks: report.qualityGateChecks,
      },
      null,
      2,
    )}\n`,
  );
  writeCsv(
    path.join(outDir, "source-lineage.csv"),
    report.lineage.sourceFiles.map((source) => ({
      dimension_key: source.dimensionKey,
      path: source.path,
      row_count: source.rowCount,
      evidence_count: source.evidenceCount,
      projection_status: source.projectionStatus,
    })),
  );
  writeCsv(
    path.join(outDir, "quality-gate.csv"),
    report.qualityGateChecks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      detail: check.detail,
    })),
  );
  writeMarkdown(report);
  writeHtml(report);

  if (report.qualityGateStatus !== "pass") {
    throw new Error(`tower_governed_candidate_load_gate_failed:${outDir}`);
  }
  console.log(`Tower governed candidate load proof passed: ${outDir}`);
}

main();
