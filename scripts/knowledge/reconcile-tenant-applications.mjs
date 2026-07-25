#!/usr/bin/env node
// Reconciles every tenant's real application inventory from
// tower-standardized-v1 (governed, per-tenant reconciled source) into
// HomeV4ApplicationFullRow[], and injects into any existing V4 preview
// fixture for that tenant.
//
// F05_applications-systems.csv was normalized to one canonical column
// schema across all 5 tenants on 2026-07-25 (previously skyharbor-air used
// a different, older column set than the other 4 -- see git history for
// the pre-normalization schema and scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
// TENANT_SCHEMA_FAMILY comment, since removed, for the full mapping). This
// script no longer branches on schema shape.
//
// Real, specific business-owner data is directly captured in F05 for
// apex-retail/first-capital/lakeshore-holdings/meridian-health -- "COO",
// "CFO", "Chief Medical Officer", etc. skyharbor-air's F05 has no directly
// captured owner (real gap in that tenant's source data, not a schema
// artifact of the normalization); F19_team-application-ownership.csv exists
// for every tenant and is used as a fallback wherever F05's owner is blank,
// via a governed application_id join. That join carries an explicit
// confidence score (0.50-0.78) and caveat per row, since it's a derived
// team/domain match, not a directly-captured owner.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tstRoot = path.join(repoRoot, "tower-standardized-v1");
const fixturesDir = path.join(repoRoot, "src/app/(maestro)/home/v4-preview/_fixtures");

// canonical V4 tenant key -> tower-standardized-v1 folder name
const TENANT_FOLDER = {
  "skyharbor-air": "skyharbor-air",
  "first-capital": "first-capital-financial",
  "meridian-health": "meridian-health",
  "apex-retail": "apex-retail",
  "lakeshore-holdings": "lakeshore-industries",
};

function parseCsv(text) {
  const lines = text.trim().split("\n").map((line) => line.replace(/\r$/, ""));
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((key, i) => {
      row[key] = cells[i] ?? "";
    });
    return row;
  });
}

function toNumberOrNull(value) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function reconcileTenant(tenantKey) {
  const folder = TENANT_FOLDER[tenantKey];
  const f05Path = path.join(tstRoot, folder, "family-2-technology-estate/F05_applications-systems.csv");
  if (!fs.existsSync(f05Path)) {
    console.log(`[${tenantKey}] no F05 file found at ${f05Path} -- skipping`);
    return null;
  }
  const f05Rows = parseCsv(fs.readFileSync(f05Path, "utf8"));

  const f19Path = path.join(tstRoot, folder, "family-8-semantic-enrichment/F19_team-application-ownership.csv");
  const ownershipById = new Map();
  if (fs.existsSync(f19Path)) {
    const f19Rows = parseCsv(fs.readFileSync(f19Path, "utf8"));
    for (const row of f19Rows) {
      ownershipById.set(row.application_id, row);
    }
  }

  let directCount = 0;
  let derivedCount = 0;
  const fullRows = f05Rows.map((row) => {
    const hasDirectOwner = Boolean(row.primary_business_owner);
    const ownership = hasDirectOwner ? null : ownershipById.get(row.application_id);
    if (hasDirectOwner) directCount += 1;
    else if (ownership) derivedCount += 1;
    return {
      app_id: row.application_id,
      name: row.application_name,
      business_domain: row.domain || null,
      criticality: row.criticality || null,
      tech_stack: row.platform_type || row.legacy_platform_category || null,
      hosting: row.hosting_model || null,
      vendor: row.legacy_vendor || null,
      modernization_disposition: row.modernization_state || null,
      named_users: toNumberOrNull(row.users_or_entities_supported),
      annual_run_cost_usd: toNumberOrNull(row.annual_run_cost_usd),
      interface_count: toNumberOrNull(row.integration_count),
      owner: hasDirectOwner ? row.primary_business_owner : (ownership?.business_owner_role || null),
      sponsor: ownership?.executive_owner_role || null,
      application_type: row.platform_type || row.legacy_platform_category || null,
      owner_confidence: hasDirectOwner ? 1 : (ownership ? toNumberOrNull(ownership.confidence) : null),
      owner_caveat: hasDirectOwner
        ? "Directly captured on the source application record (F05), not derived."
        : (ownership?.caveat || null),
      source_file: `tower-standardized-v1/${folder}/family-2-technology-estate/F05_applications-systems.csv` +
        (!hasDirectOwner && ownership ? ` + family-8-semantic-enrichment/F19_team-application-ownership.csv` : ""),
    };
  });

  const ownedCount = fullRows.filter((r) => r.owner).length;
  console.log(
    `[${tenantKey}] ${fullRows.length} applications reconciled, ${ownedCount} with a real owner (${directCount} F05 direct capture, ${derivedCount} F19 derived join, confidence-scored)`,
  );

  const fixturePath = path.join(fixturesDir, `${tenantKey}.json`);
  if (fs.existsSync(fixturePath)) {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    const appsDimension = fixture.dimensions?.find((d) => d.dimension_key === "apps");
    if (appsDimension) {
      appsDimension.data_tab = appsDimension.data_tab ?? {};
      appsDimension.data_tab.full_rows = fullRows;
      fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
      console.log(`  -> written into ${path.relative(repoRoot, fixturePath)}`);
    } else {
      console.log(`  -> fixture exists but has no 'apps' dimension -- not injected`);
    }
  } else {
    console.log(`  -> no V4 fixture exists for this tenant yet (no canary has been run) -- data reconciled but not injected anywhere. Not fabricating a fixture wrapper.`);
  }

  return fullRows;
}

const results = {};
for (const tenantKey of Object.keys(TENANT_FOLDER)) {
  results[tenantKey] = reconcileTenant(tenantKey);
}

const summaryPath = path.join(repoRoot, "docs/audits/artifacts/tenant-application-reconciliation-2026-07-24.json");
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(
  summaryPath,
  `${JSON.stringify(
    Object.fromEntries(
      Object.entries(results).map(([k, rows]) => [
        k,
        rows
          ? { count: rows.length, ownedCount: rows.filter((r) => r.owner).length }
          : { count: 0, note: "no F05 source file found" },
      ]),
    ),
    null,
    2,
  )}\n`,
);
console.log(`\nSummary written to ${path.relative(repoRoot, summaryPath)}`);
