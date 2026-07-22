#!/usr/bin/env node
// Read-only content verification for the live Home Knowledge Packs.
//
// Answers, per tenant, in plain terms: is the currently-live (approved) pack
// actually complete, or is a surface going to render thin/empty? Reports the
// forward-looking layer by type (industry movements / new ways of operating /
// change theses) because those drive the "Change & Transformation" explorer
// items, plus the executive read, AI readiness, and next-evidence counts.
//
// Read-only: SELECT statements only, no writes, no schema changes. Safe to run
// through the operator job at any time.

import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

// Minimum bars for a pack to be considered presentable, not just non-empty.
// A single narrative is technically "not empty" but would still render as a
// thin page, which is the thing we actually care about avoiding.
const MIN_NEW_WAYS = 3;
const MIN_TOTAL_NARRATIVES = 6;
const MIN_AI_READINESS = 3;

function connectionString() {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function pgOptions(url) {
  const parsed = new URL(url);
  const ssl =
    parsed.searchParams.get("sslmode")?.toLowerCase() === "disable" ||
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
      ? false
      : { rejectUnauthorized: false };
  return { connectionString: url, ssl, application_name: "home-pack-content-verify" };
}

async function main() {
  const url = connectionString();
  if (!url) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  const pg = await import("pg");
  const { Client } = pg.default ?? pg;
  const client = new Client(pgOptions(url));
  await client.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        p.tenant_key,
        p.tenant_name,
        p.status,
        p.validation_status,
        COALESCE(p.quality_report->>'strategic_narratives', '0') AS reported_sn,
        (SELECT count(*) FROM public.home_knowledge_strategic_narratives s
           WHERE s.pack_id = p.id AND s.narrative_type = 'industry_movement') AS industry_movements,
        (SELECT count(*) FROM public.home_knowledge_strategic_narratives s
           WHERE s.pack_id = p.id AND s.narrative_type = 'new_way_of_operating') AS new_ways_of_operating,
        (SELECT count(*) FROM public.home_knowledge_strategic_narratives s
           WHERE s.pack_id = p.id AND s.narrative_type = 'change_thesis') AS change_theses,
        (SELECT count(*) FROM public.home_knowledge_executive_read e WHERE e.pack_id = p.id) AS executive_read,
        (SELECT count(*) FROM public.home_knowledge_ai_readiness a WHERE a.pack_id = p.id) AS ai_readiness,
        (SELECT count(*) FROM public.home_knowledge_next_evidence_requests n WHERE n.pack_id = p.id) AS next_evidence,
        (SELECT count(*) FROM public.home_knowledge_dimensions d WHERE d.pack_id = p.id) AS dimensions
      FROM public.home_knowledge_packs p
      WHERE p.effective_to IS NULL
      ORDER BY p.tenant_key
    `);

    const report = rows.map((row) => {
      const nw = Number(row.new_ways_of_operating);
      const im = Number(row.industry_movements);
      const ct = Number(row.change_theses);
      const total = nw + im + ct;
      const problems = [];
      if (row.status !== "approved") problems.push(`status=${row.status}`);
      if (total === 0) problems.push("NO strategic narratives");
      else {
        if (nw < MIN_NEW_WAYS) problems.push(`thin new_ways_of_operating (${nw}<${MIN_NEW_WAYS})`);
        if (total < MIN_TOTAL_NARRATIVES) problems.push(`thin narratives total (${total}<${MIN_TOTAL_NARRATIVES})`);
      }
      if (Number(row.executive_read) === 0) problems.push("NO executive read");
      if (Number(row.ai_readiness) < MIN_AI_READINESS) problems.push(`thin ai_readiness (${row.ai_readiness}<${MIN_AI_READINESS})`);
      return {
        tenant: row.tenant_name,
        key: row.tenant_key,
        status: row.status,
        industry_movements: im,
        new_ways_of_operating: nw,
        change_theses: ct,
        narratives_total: total,
        executive_read: Number(row.executive_read),
        ai_readiness: Number(row.ai_readiness),
        next_evidence: Number(row.next_evidence),
        dimensions: Number(row.dimensions),
        verdict: problems.length ? "NEEDS WORK" : "COMPLETE",
        problems,
      };
    });

    console.table(
      report.map((r) => ({
        tenant: r.tenant,
        status: r.status,
        "industry mvmts": r.industry_movements,
        "new ways": r.new_ways_of_operating,
        "change theses": r.change_theses,
        "exec read": r.executive_read,
        "ai readiness": r.ai_readiness,
        verdict: r.verdict,
      })),
    );

    const failing = report.filter((r) => r.verdict !== "COMPLETE");
    console.log("");
    if (failing.length === 0) {
      console.log(`HOME_PACK_CONTENT_VERDICT: ALL_COMPLETE (${report.length} tenants)`);
    } else {
      console.log(`HOME_PACK_CONTENT_VERDICT: INCOMPLETE (${failing.length}/${report.length} tenants need work)`);
      for (const f of failing) {
        console.log(`  - ${f.tenant} [${f.key}]: ${f.problems.join("; ")}`);
      }
    }
    console.log("");
    console.log(`HOME_PACK_CONTENT_JSON: ${JSON.stringify(report)}`);
    // Non-zero exit so an operator run visibly fails when content is incomplete.
    if (failing.length > 0) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
