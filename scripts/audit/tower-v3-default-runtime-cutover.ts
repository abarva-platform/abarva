import fs from "node:fs";
import path from "node:path";

import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import { buildTowerV3RuntimeViewModel } from "@/lib/tower/tower-v3-runtime-view";

const OUT_DIR = "reports/tower-v3-default-runtime-cutover";
const SCREENSHOT_DIR = path.join(OUT_DIR, "screenshots");

type CsvValue = string | number | boolean | null | undefined;

function ensureDirs() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function csvEscape(value: CsvValue): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(
  fileName: string,
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<CsvValue>>,
) {
  const text = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${text}\n`);
}

function writeJson(fileName: string, value: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function unsupportedClaims(visibleText: string): Array<{ term: string; sample: string }> {
  const checks: Array<[string, RegExp]> = [
    ["realized", /\brealized\b/i],
    ["ROI", /\bROI\b/i],
    ["savings", /\bsavings\b/i],
    ["achieved", /\bachieved\b/i],
    ["delivered", /\bdelivered\b/i],
    ["proven value", /\bproven value\b/i],
    ["measured value", /\bmeasured value\b/i],
    ["value captured", /\bvalue captured\b/i],
  ];
  return checks.flatMap(([term, pattern]) => {
    const match = visibleText.match(pattern);
    if (match?.index === undefined) return [];
    return [
      {
        term,
        sample: visibleText.slice(Math.max(0, match.index - 80), match.index + 120),
      },
    ];
  });
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

ensureDirs();

const { contextPack, summary: contextSummary } = buildTowerV3ContextPackFromTenantInputs({
  tenantKey: "meridian-health",
  tenantName: "Healthcare Demo",
  activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
});
const view = buildTowerV3RuntimeViewModel({
  tenantName: "Healthcare Demo",
  contextPack,
});

const allowedClassifications = new Set([
  "tower_context_pack_v3_derived",
  "tower_projection_v3_derived",
]);
const tabRows = view.defaultTabs.map((tab) => [
  tab.label,
  tab.sourceClassification,
  tab.sourcePosture,
  tab.rows,
  tab.evidenceRefs.join("; "),
  tab.caveat,
]);

const visibleText = [
  view.headline,
  ...view.defaultTabs.flatMap((tab) => [
    tab.label,
    tab.sourceClassification,
    tab.sourcePosture,
    tab.caveat,
  ]),
  ...view.metricFamilies.flatMap((metric) => [
    metric.label,
    metric.baselineStatus,
    metric.targetStatus,
    metric.evidenceStatus,
  ]),
  ...view.valueHypotheses.flatMap((item) => [
    item.label,
    item.value,
    item.claimBasis,
    item.gateStatus,
  ]),
  ...view.gapThemes.flatMap((theme) => [
    theme.title,
    theme.whyItMatters,
    theme.requiredEvidence.join(" "),
  ]),
  ...view.executiveInsights.flatMap((insight) => [
    insight.role,
    insight.insightTitle,
    insight.insightSummary,
    insight.whyItMatters,
    insight.evidenceBasis,
    insight.decisionImplication,
    insight.nextAction,
    insight.moduleHandoff,
    insight.claimStrength,
    insight.valueClaimGateStatus,
    insight.watchOut ?? "",
  ]),
  ...view.caveats,
  ...view.nextMeasurementActions,
].join("\n");

const unsupported = unsupportedClaims(visibleText);
const defaultTabsV3Derived = view.defaultTabs.every((tab) =>
  allowedClassifications.has(tab.sourceClassification),
);
const allInsightsGrounded = view.executiveInsights.every(
  (insight) =>
    insight.evidenceRefsUsed.length > 0 &&
    insight.contextGapsUsed.length > 0 &&
    insight.decisionImplication.trim().length > 0 &&
    insight.claimStrength !== "measured",
);
const bridgeDiagnosticOnly =
  view.bridgeDiagnostics.source === "cio_tower" &&
  view.bridgeDiagnostics.sourceOfTruthStatus === "bridge_only" &&
  view.bridgeDiagnostics.v3ReconciliationStatus === "not_v3_reconciled";

const pass =
  defaultTabsV3Derived &&
  unsupported.length === 0 &&
  view.gateCounts.allowed === 0 &&
  view.blockedOutcomeProof &&
  allInsightsGrounded &&
  bridgeDiagnosticOnly;

writeCsv(
  "tab-data-map.csv",
  ["tab", "source_classification", "source_posture", "rows", "evidence_refs", "caveat"],
  tabRows,
);

writeCsv(
  "visible-values.csv",
  ["surface", "label", "value", "basis_or_status", "evidence_refs"],
  [
    ...view.metricFamilies.map((metric) => [
      "metric_family",
      metric.label,
      metric.targetStatus,
      metric.evidenceStatus,
      metric.evidenceIds.join("; "),
    ]),
    ...view.valueHypotheses.map((item) => [
      "value_hypothesis",
      item.label,
      item.value,
      `${item.claimBasis}:${item.gateStatus}`,
      item.evidenceIds.join("; "),
    ]),
  ],
);

writeCsv(
  "value-claim-gate-results.csv",
  ["claim_id", "claim_kind", "label", "gate_status", "realized_value_language_allowed", "required_evidence"],
  contextPack.towerValueClaims.map((claim) => [
    claim.claimId,
    claim.claimKind,
    claim.label,
    claim.gateStatus,
    claim.realizedValueLanguageAllowed,
    claim.requiredEvidence.join("; "),
  ]),
);

writeCsv(
  "source-classification-before-after.csv",
  ["tab", "before_classification", "after_classification", "after_source_posture"],
  view.defaultTabs.map((tab) => [
    tab.label,
    "cio_tower_bridge_unreconciled",
    tab.sourceClassification,
    tab.sourcePosture,
  ]),
);

writeCsv(
  "unsupported-claims.csv",
  ["term", "sample"],
  unsupported.map((item) => [item.term, item.sample]),
);

writeCsv(
  "cio-cfo-insight-validation.csv",
  [
    "role",
    "title",
    "claim_strength",
    "gate_status",
    "evidence_refs",
    "context_gaps",
    "module_handoff",
    "valid",
  ],
  view.executiveInsights.map((insight) => [
    insight.role,
    insight.insightTitle,
    insight.claimStrength,
    insight.valueClaimGateStatus,
    insight.evidenceRefsUsed.join("; "),
    insight.contextGapsUsed.join("; "),
    insight.moduleHandoff,
    insight.evidenceRefsUsed.length > 0 &&
      insight.contextGapsUsed.length > 0 &&
      insight.decisionImplication.trim().length > 0 &&
      insight.claimStrength !== "measured",
  ]),
);

writeJson("cio-cfo-insights.json", view.executiveInsights);
fs.writeFileSync(
  path.join(OUT_DIR, "cio-cfo-insights.md"),
  [
    "# CIO/CFO Tower Insights",
    "",
    ...view.executiveInsights.flatMap((insight) => [
      `## ${insight.role}: ${insight.insightTitle}`,
      "",
      insight.insightSummary,
      "",
      `Why it matters: ${insight.whyItMatters}`,
      "",
      `Decision implication: ${insight.decisionImplication}`,
      "",
      `Next action: ${insight.nextAction}`,
      "",
      `Claim strength: ${insight.claimStrength}`,
      "",
      `Evidence refs: ${insight.evidenceRefsUsed.join(", ")}`,
      "",
      `Context gaps: ${insight.contextGapsUsed.join(", ")}`,
      "",
    ]),
  ].join("\n"),
);

writeJson("browser-crawl.json", {
  status: "not_run",
  reason:
    "This deterministic cutover audit does not claim signed-in browser proof. Run signed-in Meridian crawl after PR deploy.",
  screenshotsDir: SCREENSHOT_DIR,
});

const summary = {
  verdict: pass ? "PASS" : "FAIL",
  tenant: "meridian-health",
  contextPackId: view.contextPackId,
  mode: view.mode,
  truthStatus: view.truthStatus,
  defaultTabsV3Derived,
  tabClassifications: view.defaultTabs.map((tab) => ({
    tab: tab.label,
    sourceClassification: tab.sourceClassification,
    sourcePosture: tab.sourcePosture,
    rows: tab.rows,
  })),
  counts: {
    metricRecords: view.metricCount,
    valueRecords: view.valueRecordCount,
    valueClaims: view.valueClaimCount,
    evidenceRefs: contextPack.evidence.length,
    contextGaps: contextPack.gaps.length,
    executiveInsights: view.executiveInsights.length,
  },
  gateCounts: view.gateCounts,
  unsupportedClaimCount: unsupported.length,
  allInsightsGrounded,
  bridgeDiagnosticOnly,
  contextPackProofAcceptance: contextSummary.acceptance,
};

writeJson("summary.json", summary);
fs.writeFileSync(
  path.join(OUT_DIR, "summary.md"),
  [
    "# Tower V3 Default Runtime Cutover Proof",
    "",
    `Verdict: ${summary.verdict}`,
    "",
    "## What Changed",
    "",
    "Meridian default Tower tabs now classify as v3 context-derived or v3 projection-derived. The old `cio_tower` read model remains bridge fallback / diagnostics only.",
    "",
    "## Counts",
    "",
    `- Metric records: ${summary.counts.metricRecords}`,
    `- Value records: ${summary.counts.valueRecords}`,
    `- Value claims: ${summary.counts.valueClaims}`,
    `- Evidence refs: ${summary.counts.evidenceRefs}`,
    `- Context gaps: ${summary.counts.contextGaps}`,
    `- Executive insights: ${summary.counts.executiveInsights}`,
    "",
    "## Tab Classification",
    "",
    ...summary.tabClassifications.map(
      (tab) =>
        `- ${tab.tab}: ${tab.sourceClassification} (${tab.rows} rows) — ${tab.sourcePosture}`,
    ),
    "",
    "## Claim Gate",
    "",
    `- Allowed: ${view.gateCounts.allowed}`,
    `- Caveated: ${view.gateCounts.caveated}`,
    `- Blocked: ${view.gateCounts.blocked}`,
    `- Unsupported outcome-language hits: ${unsupported.length}`,
    "",
    "## Browser Proof",
    "",
    "Not run in this deterministic audit. Do not claim signed-in proof until the deployed Meridian route is crawled.",
  ].join("\n"),
);

fs.writeFileSync(
  path.join(OUT_DIR, "proof.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower V3 Default Runtime Cutover Proof</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;background:#f8f7f4;color:#111827;margin:40px;line-height:1.5}
    h1,h2{font-family:Georgia,serif}
    table{border-collapse:collapse;width:100%;background:white;margin:18px 0}
    th,td{border:1px solid #dedbd2;padding:8px;text-align:left;vertical-align:top}
    th{background:#f1eee7}
    .pass{color:#087f5b;font-weight:800}.fail{color:#a32d2d;font-weight:800}
  </style>
</head>
<body>
  <h1>Tower V3 Default Runtime Cutover Proof</h1>
  <p>Verdict: <span class="${pass ? "pass" : "fail"}">${summary.verdict}</span></p>
  <h2>Tab Classifications</h2>
  <table>
    <thead><tr><th>Tab</th><th>Classification</th><th>Rows</th><th>Posture</th></tr></thead>
    <tbody>
      ${summary.tabClassifications
        .map(
          (tab) =>
            `<tr><td>${htmlEscape(tab.tab)}</td><td>${htmlEscape(tab.sourceClassification)}</td><td>${tab.rows}</td><td>${htmlEscape(tab.sourcePosture)}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <h2>CIO/CFO Insights</h2>
  <table>
    <thead><tr><th>Role</th><th>Insight</th><th>Decision</th><th>Next action</th><th>Gate</th></tr></thead>
    <tbody>
      ${view.executiveInsights
        .map(
          (insight) =>
            `<tr><td>${htmlEscape(insight.role)}</td><td>${htmlEscape(insight.insightTitle)}</td><td>${htmlEscape(insight.decisionImplication)}</td><td>${htmlEscape(insight.nextAction)}</td><td>${htmlEscape(insight.valueClaimGateStatus)}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`,
);

if (!pass) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
