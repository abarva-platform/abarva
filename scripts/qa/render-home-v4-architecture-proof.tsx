#!/usr/bin/env npx tsx
/**
 * Renders the Home architecture views for both tenants to static HTML: the estate landscape plus
 * the three largest capabilities drilled to L2. Same reason as the chapter proof -- an
 * architecture drawing is exactly the kind of output that passes every test and is still
 * unreadable, and the only way to know is to look at it.
 */

import fs from "node:fs";
import path from "node:path";

import { renderArchitectureViewSvg, renderArchitectureLegend } from "../../src/lib/visual-system/architecture-svg-renderer";
import { validateArchitectureView } from "../../src/lib/visual-system/architecture-view-contract";
import { buildBusinessCapabilityLandscapeView } from "../../src/lib/visual-system/projections/capability-landscape";
import { buildCapabilityToTechnologyView, listCapabilities } from "../../src/lib/visual-system/projections/capability-to-technology";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT_DIR = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/home-v4-architecture";
})();

const SNAPSHOT_DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");

const SHELL = (title: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;font-family:Inter,system-ui,sans-serif;}*{box-sizing:border-box;}
.legend{padding:16px 0;font-size:13px;color:#5F5E5A;} .legend .k{margin-right:18px;} .limits{margin:10px 0 0;padding-left:18px;}
h1{font-family:Fraunces,Georgia,serif;font-weight:500;letter-spacing:-0.026em;}</style>
</head><body><div style="max-width:1240px;padding:32px;">${body}</div></body></html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
const index: string[] = [];
let errors = 0;

for (const file of fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json"))) {
  const tenantKey = file.replace(/\.json$/, "");
  const bundle = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), "utf8")) as HomeReviewBundle;
  const applications = bundle.technologyEstate?.recordTypes.find((r) => r.objectType === "application_system");
  if (!applications) {
    console.log(`  ! ${tenantKey}: no application_system record type -- skipped`);
    continue;
  }
  const tenantDisplayName = tenantKey;

  const views = [
    { name: "landscape", view: buildBusinessCapabilityLandscapeView({ tenantKey, tenantDisplayName, applications, audienceLevel: "L1_domain" }) },
    ...listCapabilities(applications)
      .slice(0, 3)
      .map((c) => ({
        name: `capability-${c.capability.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        view: buildCapabilityToTechnologyView({ tenantKey, tenantDisplayName, applications, capability: c.capability }),
      })),
  ];

  for (const { name, view } of views) {
    const issues = validateArchitectureView(view);
    const blocking = issues.filter((i) => i.level === "error");
    if (blocking.length) {
      errors += blocking.length;
      console.log(`  ! ${tenantKey}/${name}: ${blocking.length} validator error(s)`);
      blocking.forEach((i) => console.log(`      ${i.message}`));
    }
    const { svg, layout } = renderArchitectureViewSvg(view, { width: 1180 });
    const fileName = `${tenantKey}--${name}.html`;
    fs.writeFileSync(
      path.join(OUT_DIR, fileName),
      SHELL(
        `${tenantKey} · ${name}`,
        `<h1>${view.title}</h1><p style="color:#5F5E5A;">${view.primaryQuestion}</p>` +
          (view.contextLine ? `<p style="color:#5F5E5A;">${view.contextLine}</p>` : "") +
          `<div style="overflow-x:auto;border:1px solid rgba(136,135,128,0.28);border-radius:10px;">${svg}</div>` +
          renderArchitectureLegend(view),
      ),
    );
    index.push(
      `<li><a href="${fileName}">${tenantKey} · ${name}</a> <code>${view.nodes.length} nodes · ${view.edges.length} edges · ${layout.width}x${layout.height} · ${issues.length} issue(s)</code></li>`,
    );
  }
}

fs.writeFileSync(
  path.join(OUT_DIR, "index.html"),
  SHELL("Home v4 architecture proofs", `<h1>Home v4 — architecture views</h1><ul style="line-height:2;">${index.join("")}</ul>`),
);

console.log(`Wrote ${index.length} architecture renders to ${OUT_DIR}`);
if (errors > 0) {
  console.log(`FAILED: ${errors} validator error(s) -- these views must not ship.`);
  process.exit(1);
}
console.log("All views pass the contract validator.");
