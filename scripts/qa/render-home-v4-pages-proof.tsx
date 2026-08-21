#!/usr/bin/env npx tsx
/**
 * Component-level visual proof for the Home preview pages.
 *
 * This deliberately renders each page directly from the checked-in golden snapshots. It is not
 * signed-in route proof and does not claim deployment; it gives browser QA stable files for the
 * exact Home surfaces that need visual review.
 */
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { BrowseTheData } from "../../src/components/home/preview/BrowseTheData";
import { CurrentState } from "../../src/components/home/preview/CurrentState";
import { ArchitecturePage } from "../../src/components/home/v4/ArchitecturePage";
import { DataFlowPage } from "../../src/components/home/v4/DataFlowPage";
import { RecordBrowser } from "../../src/components/home/v4/RecordBrowser";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const outDir = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "/tmp/home-v4-pages-proof";
const snapshotDir = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
const tenantKeys = ["meridian-health", "skyharbor-air"] as const;
const tenantNames: Record<(typeof tenantKeys)[number], string> = {
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air",
};

fs.mkdirSync(outDir, { recursive: true });

const indexLinks: string[] = [];

for (const tenantKey of tenantKeys) {
  const snapshotPath = path.join(snapshotDir, `${tenantKey}.json`);
  const bundle = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as HomeReviewBundle;
  const technologyRecords = bundle.technologyEstate?.recordTypes ?? [];
  const applications = technologyRecords.find((record) => record.objectType === "application_system");
  const integrations = technologyRecords.find((record) => record.objectType === "data_asset_or_integration");
  const infrastructure = technologyRecords.find((record) => record.objectType === "infrastructure_platform");
  const tenantDisplayName = tenantNames[tenantKey];
  const canonicalBuild = bundle.provenance.canonical_snapshot_hash;

  if (applications) {
    writePage(
      `${tenantKey}-architecture`,
      "Architecture",
      renderToStaticMarkup(
        <ArchitecturePage
          tenantKey={tenantKey}
          tenantDisplayName={tenantDisplayName}
          applications={applications}
          integrations={integrations}
          infrastructure={infrastructure}
          canonicalBuild={canonicalBuild}
        />,
      ),
    );
  }

  if (integrations) {
    writePage(
      `${tenantKey}-data-flow`,
      "Data Flow",
      renderToStaticMarkup(
        <DataFlowPage
          tenantKey={tenantKey}
          tenantDisplayName={tenantDisplayName}
          integrations={integrations}
          applications={applications}
          canonicalBuild={canonicalBuild}
        />,
      ),
    );
  }

  writePage(
    `${tenantKey}-loaded-context`,
    "Loaded Context",
    renderToStaticMarkup(<CurrentState signalPacket={bundle.thesis.signalPacket} />),
  );
  writePage(
    `${tenantKey}-browse-record`,
    "Browse Record",
    renderToStaticMarkup(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />),
  );

  for (const record of technologyRecords) {
    writePage(
      `${tenantKey}-record-${record.objectType}`,
      record.label,
      renderToStaticMarkup(<RecordBrowser recordType={record} />),
    );
  }
}

fs.writeFileSync(
  path.join(outDir, "index.html"),
  shell(
    "Home v4 page proof",
    `<main style="padding:36px 48px;font-family:Inter,system-ui,sans-serif;"><h1 style="font-family:Fraunces,Georgia,serif;font-weight:500;">Home v4 page proof</h1><ul style="line-height:2;">${indexLinks.join("")}</ul></main>`,
  ),
  "utf8",
);

console.log(`Wrote ${indexLinks.length} Home v4 proof pages to ${outDir}`);

function writePage(slug: string, title: string, body: string) {
  const filename = `${slug}.html`;
  fs.writeFileSync(path.join(outDir, filename), shell(title, body), "utf8");
  indexLinks.push(`<li><a href="./${filename}">${slug}</a></li>`);
}

function shell(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;}*{box-sizing:border-box;}button,input,select{font:inherit;}</style>
</head><body>${body}</body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
