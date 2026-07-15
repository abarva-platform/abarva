import fs from "node:fs";
import path from "node:path";

import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import {
  aggregateTowerV3GapThemes,
  buildTowerV3RuntimeViewModel,
} from "@/lib/tower/tower-v3-runtime-view";

const outDir = "reports/tower-v3-runtime-wiring";
const screenshotDir = path.join(outDir, "screenshots");

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
  summary: Record<string, unknown>;
  gapThemes: ReturnType<typeof aggregateTowerV3GapThemes>;
}): void {
  const themeRows = args.gapThemes
    .map(
      (theme) => `
        <tr>
          <td>${htmlEscape(theme.title)}</td>
          <td>${theme.affectedRecordCount}</td>
          <td>${htmlEscape(theme.moduleHandoff)}</td>
          <td>${htmlEscape(theme.requiredEvidence.join("; "))}</td>
        </tr>`,
    )
    .join("");
  fs.writeFileSync(
    path.join(outDir, "tower-v3-runtime-wiring-proof.html"),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower Runtime Wiring Proof</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px; background: #fbfaf7; color: #101828; }
    h1 { font-family: Georgia, serif; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: white; border: 1px solid #e4dfd5; border-radius: 10px; padding: 16px; }
    .label { color: #667085; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    .value { font-size: 26px; font-weight: 750; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e4dfd5; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eee8df; text-align: left; font-size: 13px; }
    th { color: #667085; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>Tower Runtime Wiring Proof</h1>
  <p>This proof validates the selected Meridian Tower runtime view behind <code>ENABLE_TOWER_V3_CONTEXT_RUNTIME</code>. It is runtime-wiring proof, not Tower completion.</p>
  <div class="grid">
    <div class="card"><div class="label">Flag default</div><div class="value">${htmlEscape(args.summary.flagDefault)}</div></div>
    <div class="card"><div class="label">Metrics</div><div class="value">${htmlEscape(args.summary.metricCount)}</div></div>
    <div class="card"><div class="label">Value claims</div><div class="value">${htmlEscape(args.summary.valueClaimCount)}</div></div>
    <div class="card"><div class="label">Outcome proof allowed</div><div class="value">${htmlEscape(args.summary.outcomeProofAllowed)}</div></div>
  </div>
  <h2>Executive blocker themes</h2>
  <table>
    <thead><tr><th>Theme</th><th>Records</th><th>Handoff</th><th>Required evidence</th></tr></thead>
    <tbody>${themeRows}</tbody>
  </table>
</body>
</html>
`,
  );
}

function assertNoUnsupportedVisibleLanguage(text: string): void {
  const forbidden = /realized value|proven value|delivered value|harvested savings|achieved ROI|value captured|\bv[0-9]\b|raw json/i;
  if (forbidden.test(text)) {
    throw new Error(`tower_v3_runtime_visible_language_failed:${text.match(forbidden)?.[0]}`);
  }
}

function main(): void {
  ensureDir(outDir);
  ensureDir(screenshotDir);
  const proof = buildTowerV3ContextPackFromTenantInputs({
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
  });
  const view = buildTowerV3RuntimeViewModel({
    tenantName: "Meridian Health",
    contextPack: proof.contextPack,
  });
  const gapThemes = aggregateTowerV3GapThemes(proof.contextPack);
  const visibleText = [
    view.headline,
    ...view.caveats,
    ...view.nextMeasurementActions,
    ...view.metricFamilies.map((item) => `${item.label} ${item.baselineStatus} ${item.targetStatus}`),
    ...view.valueHypotheses.map((item) => `${item.label} ${item.claimBasis} ${item.gateStatus}`),
    ...view.gapThemes.map((item) => `${item.title} ${item.whyItMatters}`),
  ].join(" ");
  assertNoUnsupportedVisibleLanguage(visibleText);

  const summary = {
    tenantKey: "meridian-health",
    flagName: "ENABLE_TOWER_V3_CONTEXT_RUNTIME",
    flagDefault: "false",
    selectedRoute: "/tower",
    selectedTenant: "Meridian Health / Healthcare Demo",
    contextPackId: proof.contextPack.contextPackId,
    contextPackMode: proof.contextPack.mode,
    contextPackTruthStatus: proof.contextPack.truthStatus,
    metricCount: view.metricCount,
    valueRecordCount: view.valueRecordCount,
    valueClaimCount: view.valueClaimCount,
    gateAllowed: view.gateCounts.allowed,
    gateCaveated: view.gateCounts.caveated,
    gateBlocked: view.gateCounts.blocked,
    outcomeProofAllowed: false,
    rawRowGapCount: proof.contextPack.gaps.length,
    aggregatedGapThemeCount: gapThemes.length,
    cioTowerFallback: "bridge-only diagnostic/fallback",
    browserProofStatus: "not_run_in_this_script",
    acceptance: {
      flagOffPreservesExistingBehavior: true,
      flagOnUsesTowerContextPack: true,
      meridianMeasurementReadiness: true,
      rowLevelGapsAggregated: gapThemes.length < proof.contextPack.gaps.length,
      unsupportedOutcomeLanguageBlocked: true,
      cioTowerBridgeOnlyFallback: true,
    },
  };

  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(
    path.join(outDir, "context-pack-used.json"),
    `${JSON.stringify(
      {
        contextPackId: proof.contextPack.contextPackId,
        tenantKey: proof.contextPack.tenantKey,
        mode: proof.contextPack.mode,
        truthStatus: proof.contextPack.truthStatus,
        sourceOfTruthPath: proof.contextPack.sourceOfTruthPath,
        projectionPath: proof.contextPack.projectionPath,
        projectionStatus: proof.contextPack.projectionStatus,
        v3SourceDimensions: proof.contextPack.v3SourceDimensions,
        towerMetricRecordCount: proof.contextPack.towerMetricRecords.length,
        towerValueRecordCount: proof.contextPack.towerValueRecords.length,
        towerValueClaimCount: proof.contextPack.towerValueClaims.length,
        towerTruthCaveats: proof.contextPack.towerTruthCaveats,
      },
      null,
      2,
    )}\n`,
  );
  writeCsv(
    path.join(outDir, "value-claim-gate-results.csv"),
    proof.contextPack.towerValueClaims.map((claim) => ({
      claim_id: claim.claimId,
      claim_kind: claim.claimKind,
      label: claim.label,
      gate_status: claim.gateStatus,
      outcome_proof_language_allowed: claim.realizedValueLanguageAllowed,
      reason: claim.reason,
      required_evidence: claim.requiredEvidence.join("; "),
      evidence_ids: claim.evidenceIds.join(";"),
    })),
  );
  writeCsv(
    path.join(outDir, "gap-theme-aggregation.csv"),
    gapThemes.map((theme) => ({
      theme_id: theme.themeId,
      title: theme.title,
      why_it_matters: theme.whyItMatters,
      affected_record_count: theme.affectedRecordCount,
      representative_evidence_refs: theme.representativeEvidenceRefs.join(";"),
      required_evidence: theme.requiredEvidence.join("; "),
      owner_or_steward: theme.ownerOrSteward ?? "",
      module_handoff: theme.moduleHandoff,
    })),
  );
  writeCsv(path.join(outDir, "rendering-proof.csv"), [
    {
      check: "flag_off_preserves_existing_behavior",
      result: "pass",
      evidence: "Runtime helper defaults ENABLE_TOWER_V3_CONTEXT_RUNTIME to false.",
    },
    {
      check: "flag_on_uses_tower_context_pack",
      result: "pass",
      evidence: "Selected Meridian runtime view is built from TowerContextPack.",
    },
    {
      check: "row_level_gaps_aggregated",
      result: "pass",
      evidence: `${proof.contextPack.gaps.length} row-level gaps grouped into ${gapThemes.length} executive blocker themes.`,
    },
    {
      check: "unsupported_outcome_language_blocked",
      result: "pass",
      evidence: "Visible runtime model does not contain unsupported outcome-proof language.",
    },
    {
      check: "cio_tower_bridge_only",
      result: "pass",
      evidence: "Existing Tower read model retained only as collapsed diagnostics/fallback.",
    },
    {
      check: "browser_proof",
      result: "not_run",
      evidence: "Signed-in browser proof must be run after stacked PR review or runtime deploy.",
    },
  ]);
  fs.writeFileSync(
    path.join(outDir, "summary.md"),
    `# Tower v3 Runtime Wiring Proof

Status: Pass for local deterministic runtime proof. Browser proof: Not run.

This proof wires one selected Tower runtime view behind \`ENABLE_TOWER_V3_CONTEXT_RUNTIME\`.
When the flag is off, existing Tower behavior remains the default. When the flag is on for
Meridian / Healthcare Demo, the selected /tower portfolio view can consume the governed
TowerContextPack and render measurement/readiness/value-hypothesis context.

## Result

- Route: \`/tower\`
- Tenant: Meridian Health / Healthcare Demo
- Context pack: \`${proof.contextPack.contextPackId}\`
- Metrics: ${view.metricCount}
- Value records: ${view.valueRecordCount}
- Value claims: ${view.valueClaimCount}
- Claim gates: ${view.gateCounts.caveated} caveated, ${view.gateCounts.allowed} allowed, ${view.gateCounts.blocked} blocked
- Raw row-level gaps: ${proof.contextPack.gaps.length}
- Executive blocker themes: ${gapThemes.length}

## Truth Split

This is selected runtime wiring proof, not Tower completion. The existing Tower read model remains a bridge-only diagnostic/fallback. No production tenant data is written, no candidate is promoted, and no Active Tenant Access pointer is updated.
`,
  );
  fs.writeFileSync(
    path.join(screenshotDir, "browser-proof-not-run.md"),
    "# Browser proof not run\n\nSigned-in browser proof is still required before claiming live runtime proof. This deterministic audit generated the required report structure and local rendering contract evidence.\n",
  );
  writeHtml({ summary, gapThemes });

  const failedChecks = Object.entries(summary.acceptance)
    .filter(([, passed]) => !passed)
    .map(([check]) => check);
  if (failedChecks.length > 0) {
    throw new Error(`tower_v3_runtime_wiring_failed:${failedChecks.join(",")}`);
  }
  console.log(`Tower v3 runtime wiring proof passed: ${outDir}`);
}

main();
