import fs from "node:fs";
import path from "node:path";

import {
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  validateHomeInsightSummary,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/knowledge-home-insights");

function csvEscape(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function write(fileName: string, content: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, fileName), content);
}

const failures = validateHomeInsightSummary(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS);

write(
  "summary.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      status: failures.length === 0 ? "pass" : "fail",
      tenant: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.tenant_key,
      topInsights: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_insights.length,
      contextMapEdges:
        MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.enterprise_context_map.length,
      readinessRows: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.readiness_matrix.length,
      evidenceHeatmapRows:
        MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.evidence_heatmap.length,
      topGaps: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_gaps.length,
      moduleReadinessRows:
        MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.module_readiness.length,
      validationFailures: failures,
      truthSplit: {
        generatedBy: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_by,
        callsClaudeDuringThisCommand: false,
        mutatesSourceData: false,
        promotesCandidateData: false,
        changesModuleRuntimeBehavior: false,
      },
    },
    null,
    2,
  ),
);

write(
  "summary.md",
  [
    "# Knowledge Home Cross-Dimension Insights",
    "",
    `Status: ${failures.length === 0 ? "Pass" : "Fail"}`,
    "",
    `Tenant: ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.tenant_name}`,
    "",
    `Executive brief: ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.executive_summary}`,
    "",
    "## Top Insights",
    "",
    ...MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_insights.map(
      (insight) =>
        `- ${insight.title} (${insight.evidence_strength}) — ${insight.module_handoff}`,
    ),
    "",
    "## Truth Split",
    "",
    "This report is generated from the stored approved Home insight artifact. It does not call Claude locally, mutate tenant data, promote candidates, or change module runtime behavior.",
    "",
  ].join("\n"),
);

write(
  "meridian-home-insights.json",
  JSON.stringify(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS, null, 2),
);

write(
  "validation-results.csv",
  [
    "tenant_key,status,failure",
    ...(failures.length > 0
      ? failures.map((failure) =>
          [
            MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.tenant_key,
            "fail",
            failure,
          ]
            .map(csvEscape)
            .join(","),
        )
      : [
          [
            MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.tenant_key,
            "pass",
            "none",
          ]
            .map(csvEscape)
            .join(","),
        ]),
  ].join("\n"),
);

write(
  "home-insights-proof.html",
  `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Knowledge Home Insight Proof</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#0c1a3a;background:#fbfcff}
    h1{font-size:34px;margin:0 0 10px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .card{border:1px solid #e5eaf2;border-radius:14px;background:#fff;padding:18px;margin:14px 0}
    .badge{display:inline-flex;border-radius:999px;background:#edf9f2;color:#126449;padding:5px 10px;font-weight:800;font-size:12px}
    .edge{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;border:1px solid #e5eaf2;border-radius:10px;padding:10px;margin:8px 0}
    .rel{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#657089}
    li{margin:6px 0;line-height:1.45}
  </style>
</head>
<body>
  <h1>${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.summary_title}</h1>
  <p><span class="badge">${failures.length === 0 ? "PASS" : "FAIL"}</span></p>
  <div class="card"><h2>Enterprise Brief</h2><p>${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.executive_summary}</p></div>
  <h2>Cross-Dimension Insights</h2>
  <div class="grid">
    ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_insights.map(
      (insight) => `<div class="card"><h3>${insight.title}</h3><p>${insight.what_nexus_sees}</p><p><strong>Why:</strong> ${insight.why_it_matters}</p><p><strong>Next:</strong> ${insight.next_action}</p></div>`,
    ).join("")}
  </div>
  <h2>Agent Assist Context Map</h2>
  <div class="card">
    ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.enterprise_context_map.map(
      (edge) => `<div class="edge"><span>${edge.from}</span><span class="rel">${edge.relation}</span><span>${edge.to}${edge.caveat ? `<br><small>${edge.caveat}</small>` : ""}</span></div>`,
    ).join("")}
  </div>
  <h2>Do Not Claim</h2>
  <div class="card"><ul>${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.do_not_claim.map((claim) => `<li>${claim}</li>`).join("")}</ul></div>
</body>
</html>`,
);

if (failures.length > 0) {
  console.error(
    `Knowledge Home insight generation completed with ${failures.length} validation failures.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Knowledge Home insight reports written to ${path.relative(repoRoot, outDir)}`,
  );
}
