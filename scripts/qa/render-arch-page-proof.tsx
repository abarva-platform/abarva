#!/usr/bin/env npx tsx
/** Renders the real ArchitecturePage component (L0 resting state) for both tenants, so the tile
 * treatment is reviewed as rendered output rather than as source. */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ArchitecturePage } from "../../src/components/home/v4/ArchitecturePage";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT = process.argv.includes("--out-dir") ? process.argv[process.argv.indexOf("--out-dir") + 1] : "/tmp/arch-page";
const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
fs.mkdirSync(OUT, { recursive: true });

const SHELL = (t: string, b: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;}*{box-sizing:border-box;}</style></head>
<body><div style="font-family:Inter,system-ui,sans-serif;">${b}</div></body></html>`;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const tenantKey = f.replace(/\.json$/, "");
  const bundle = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as HomeReviewBundle;
  const apps = bundle.technologyEstate?.recordTypes.find((r) => r.objectType === "application_system");
  if (!apps) continue;
  const html = renderToStaticMarkup(
    React.createElement(ArchitecturePage, { tenantKey, tenantDisplayName: tenantKey, applications: apps }),
  );
  fs.writeFileSync(path.join(OUT, `${tenantKey}--architecture.html`), SHELL(`${tenantKey} architecture`, html));
  console.log(`  wrote ${tenantKey}--architecture.html`);
}
