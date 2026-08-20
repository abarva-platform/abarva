#!/usr/bin/env npx tsx
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordBrowser } from "../../src/components/home/v4/RecordBrowser";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT = process.argv.includes("--out-dir") ? process.argv[process.argv.indexOf("--out-dir") + 1] : "/tmp/browser";
const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
fs.mkdirSync(OUT, { recursive: true });
const SHELL = (t: string, b: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;font-family:Inter,system-ui,sans-serif;}*{box-sizing:border-box;}</style>
</head><body>${b}</body></html>`;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const tenantKey = f.replace(/\.json$/, "");
  const b = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as HomeReviewBundle;
  for (const rt of b.technologyEstate?.recordTypes ?? []) {
    const html = renderToStaticMarkup(React.createElement(RecordBrowser, { recordType: rt }));
    fs.writeFileSync(path.join(OUT, `${tenantKey}--${rt.objectType}.html`), SHELL(`${tenantKey} ${rt.label}`, html));
  }
  console.log(`${tenantKey}: ${(b.technologyEstate?.recordTypes ?? []).length} record types rendered`);
}
