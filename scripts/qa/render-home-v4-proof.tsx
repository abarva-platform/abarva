#!/usr/bin/env npx tsx
/**
 * Renders the promoted Home v4 snapshot to static HTML.
 *
 * This is component-level render proof, not signed-in route proof: it exercises the real
 * components against the real promoted snapshot, so what a reader sees here is what the route
 * would serve. It does NOT exercise Clerk, tenancy resolution, or the route's own data fetch, and
 * must not be described as though it did.
 */
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { HomeV4App } from "../../src/components/home/v4/HomeV4App";
import type { HomePreviewTenantKey } from "../../src/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "/tmp/home-v4-proof";
fs.mkdirSync(OUT, { recursive: true });

for (const tenantKey of ["meridian-health", "skyharbor-air"] as HomePreviewTenantKey[]) {
  const snapshotFile = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots", `${tenantKey}.json`);
  const bundle = fs.existsSync(snapshotFile)
    ? (JSON.parse(fs.readFileSync(snapshotFile, "utf8")) as HomeReviewBundle)
    : null;
  if (!bundle) { console.error(`no snapshot for ${tenantKey}`); process.exit(1); }

  const body = renderToStaticMarkup(<HomeV4App bundle={bundle} tenantKey={tenantKey} />);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${tenantKey} — Home v4</title>
<style>body{margin:0;background:#fff;font-family:Inter,system-ui,sans-serif}</style>
</head><body>${body}</body></html>`;
  const file = path.join(OUT, `${tenantKey}.html`);
  fs.writeFileSync(file, html, "utf8");

  const p = bundle.provenance as unknown as Record<string, unknown>;
  const estate = (bundle as any).technologyEstate?.recordTypes ?? [];
  console.log(`${tenantKey}`);
  console.log(`   canonical hash ${String(p.canonical_snapshot_hash).slice(0, 16)}  generated ${String(p.generated_at).slice(0, 10)}`);
  console.log(`   chapters ${bundle.chapters.length}  html ${(html.length / 1024).toFixed(0)} KB -> ${file}`);
  for (const r of estate) console.log(`      ${r.objectType}: ${Array.isArray(r.rows) ? r.rows.length : r.rows} rows`);
}
