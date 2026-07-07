import fs from "node:fs";
import path from "node:path";
import {
  buildTowerQuestionBank,
  summarizeTowerQuestionBank,
  type TowerQuestionBankItem,
} from "@/lib/tower/tower-question-bank";

const root = process.cwd();
const outDir = path.join(root, "out", "tower-question-bank");
const downloadsDir = "/Users/anand/Downloads";
const bank = buildTowerQuestionBank();
const summary = summarizeTowerQuestionBank(bank);

fs.mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(outDir, "tower-question-bank.json");
const summaryPath = path.join(outDir, "tower-question-bank-summary.json");
const htmlPath = path.join(outDir, "tower-question-bank-report.html");

fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(htmlPath, renderHtml(bank));

for (const file of [jsonPath, summaryPath, htmlPath]) {
  fs.copyFileSync(file, path.join(downloadsDir, path.basename(file)));
}

console.log(JSON.stringify({
  summary,
  outputs: {
    jsonPath,
    summaryPath,
    htmlPath,
    downloads: [
      path.join(downloadsDir, path.basename(jsonPath)),
      path.join(downloadsDir, path.basename(summaryPath)),
      path.join(downloadsDir, path.basename(htmlPath)),
    ],
  },
}, null, 2));

function renderHtml(items: TowerQuestionBankItem[]): string {
  const categoryRows = Object.entries(summary.byCategory)
    .map(([category, count]) => `<tr><td>${escapeHtml(category)}</td><td>${count}</td></tr>`)
    .join("");
  const routeRows = Object.entries(summary.byRoute)
    .map(([route, count]) => `<tr><td>${escapeHtml(route)}</td><td>${count}</td></tr>`)
    .join("");
  const intentRows = Object.entries(summary.byIntent)
    .map(([intent, count]) => `<tr><td>${escapeHtml(intent)}</td><td>${count}</td></tr>`)
    .join("");
  const sampleRows = items
    .filter((item) =>
      item.category === "metric" ||
      item.category === "cross_dimension" ||
      item.category === "advisory",
    )
    .slice(0, 220)
    .map((item) => `<tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.intent)}</td>
      <td>${escapeHtml(item.route)}</td>
      <td>${escapeHtml(item.artifact)}</td>
      <td>${escapeHtml(item.question)}</td>
      <td>${escapeHtml(item.requiredMetrics.join(", "))}</td>
      <td>${escapeHtml(item.requiredReadModels.join(", "))}</td>
    </tr>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tower Semantic Question Bank</title>
  <style>
    body { margin: 0; background: #fbfaf7; color: #101828; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1240px; margin: 0 auto; padding: 36px 28px 72px; }
    h1, h2 { font-family: Georgia, "Times New Roman", serif; color: #171717; }
    h1 { font-size: 44px; margin: 0 0 8px; }
    h2 { font-size: 26px; margin: 34px 0 12px; }
    .eyebrow { color: #0f7a4d; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; font-weight: 800; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: white; border: 1px solid #ded8ce; border-radius: 8px; padding: 16px; }
    .num { font-size: 32px; font-weight: 800; font-family: Georgia, "Times New Roman", serif; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ded8ce; margin: 12px 0 28px; }
    th, td { border-bottom: 1px solid #ded8ce; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #f4f1eb; color: #667085; font-size: 11px; text-transform: uppercase; letter-spacing: .11em; }
    tr:last-child td { border-bottom: 0; }
    .muted { color: #667085; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Tower semantic mart execution artifact</div>
    <h1>Tower Semantic Question Bank</h1>
    <p class="muted">Generated coverage bank for Tower metrics, datasets, cross-dimension joins, advisory dossiers, gaps, and safety routes.</p>
    <div class="cards">
      <div class="card"><div class="num">${summary.total}</div><div>Total questions</div></div>
      <div class="card"><div class="num">${summary.metricQuestionCount}</div><div>Metric questions</div></div>
      <div class="card"><div class="num">${summary.deterministicQuestionCount}</div><div>Deterministic route</div></div>
      <div class="card"><div class="num">${summary.dossierQuestionCount}</div><div>Dossier route</div></div>
    </div>
    <h2>By Category</h2>
    <table><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>${categoryRows}</tbody></table>
    <h2>By Route</h2>
    <table><thead><tr><th>Route</th><th>Count</th></tr></thead><tbody>${routeRows}</tbody></table>
    <h2>By Intent</h2>
    <table><thead><tr><th>Intent</th><th>Count</th></tr></thead><tbody>${intentRows}</tbody></table>
    <h2>Sample Questions</h2>
    <table>
      <thead><tr><th>ID</th><th>Category</th><th>Intent</th><th>Route</th><th>Artifact</th><th>Question</th><th>Metrics</th><th>Read Models</th></tr></thead>
      <tbody>${sampleRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

