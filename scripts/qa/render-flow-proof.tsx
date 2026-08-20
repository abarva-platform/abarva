#!/usr/bin/env npx tsx
/** Renders the current-state integration topology for both tenants so it can be read, not assumed. */
import fs from "node:fs";
import path from "node:path";
import { renderArchitectureViewSvg, renderArchitectureLegend } from "../../src/lib/visual-system/architecture-svg-renderer";
import { validateArchitectureView } from "../../src/lib/visual-system/architecture-view-contract";
import { buildCurrentStateFlowView } from "../../src/lib/visual-system/projections/current-state-flow";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT = process.argv.includes("--out-dir") ? process.argv[process.argv.indexOf("--out-dir") + 1] : "/tmp/flow";
const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
fs.mkdirSync(OUT, { recursive: true });

const SHELL = (t: string, b: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;font-family:Inter,system-ui,sans-serif;}*{box-sizing:border-box;}
h1{font-family:Fraunces,Georgia,serif;font-weight:500;letter-spacing:-0.027em;max-width:36ch;}
.legend{padding:14px 0;font-size:13px;color:#5F5E5A;}.legend .k{margin-right:18px;}.limits{margin:8px 0 0;padding-left:18px;}</style>
</head><body><div style="max-width:1320px;padding:34px;">${b}</div></body></html>`;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const tenantKey = f.replace(/\.json$/, "");
  const b = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as HomeReviewBundle;
  const ints = b.technologyEstate?.recordTypes.find((r) => r.objectType === "data_asset_or_integration");
  if (!ints) continue;
  const view = buildCurrentStateFlowView({ tenantKey, tenantDisplayName: tenantKey, integrations: ints });
  const issues = validateArchitectureView(view);
  const { svg, layout } = renderArchitectureViewSvg(view, { width: 1260 });
  fs.writeFileSync(
    path.join(OUT, `${tenantKey}--flow.html`),
    SHELL(`${tenantKey} flow`, `<h1>${view.title}</h1><p style="color:#5F5E5A;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;">${view.contextLine}</p>
<div style="overflow-x:auto;border:1px solid rgba(136,135,128,0.28);border-radius:10px;">${svg}</div>${renderArchitectureLegend(view)}`),
  );
  console.log(`${tenantKey}: ${view.nodes.length} nodes · ${view.edges.length} edges · ${layout.width}x${layout.height} · ${issues.length} issues`);
}
