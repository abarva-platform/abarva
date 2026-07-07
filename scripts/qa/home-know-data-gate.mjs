#!/usr/bin/env node
/**
 * Home KNOW live data GO/NO-GO gate.
 *
 * Run inside the private VNet or another environment with DATABASE_URL /
 * ABARVA_AZURE_DATABASE_URL. This does not mutate data. It proves the backend
 * seam has real tenant rows, facts, relationships, lineage, and non-placeholder
 * Home view coverage before frontend wiring is allowed to claim readiness.
 */

const V4_TENANTS = [
  { v4TenantKey: "apex-retail", dbTenantKey: "apex-retail" },
  { v4TenantKey: "first-capital-financial", dbTenantKey: "first-capital" },
  { v4TenantKey: "lakeshore-holdings", dbTenantKey: "lakeshore-holdings" },
  { v4TenantKey: "meridian-health", dbTenantKey: "meridian-health" },
  { v4TenantKey: "skyharbor-air", dbTenantKey: "skyharbor-air" },
];

const REQUIRED_VIEWS = [
  "mv_home_dimension_coverage_view",
  "mv_home_it_org_view",
  "mv_home_application_ownership_view",
  "mv_home_vendor_landscape_view",
  "mv_home_budget_by_portfolio_view",
  "mv_home_gap_register_view",
  "mv_home_conflict_register_view",
];

async function main() {
  const connectionString =
    process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "HOME KNOW DATA GATE BLOCKED: missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL.",
    );
    process.exit(2);
  }

  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    application_name: "home-know-data-gate",
    max: 1,
    ssl: isLocal(connectionString) ? false : { rejectUnauthorized: false },
  });

  const results = [];
  try {
    await assertViewsExist(pool);
    for (const tenant of V4_TENANTS) {
      results.push(await checkTenant(pool, tenant));
    }
  } finally {
    await pool.end().catch(() => undefined);
  }

  const failed = results.filter((result) => result.status !== "pass");
  console.table(
    results.map((result) => ({
      tenant: result.v4TenantKey,
      dbTenantKey: result.dbTenantKey,
      status: result.status,
      records: result.records,
      facts: result.facts,
      relationships: result.relationships,
      lineageRows: result.lineageRows,
      coverageRows: result.coverageRows,
      variedCounts: result.variedCounts,
      reason: result.reason ?? "",
    })),
  );

  if (failed.length > 0) {
    console.error(`HOME KNOW DATA GATE FAILED: ${failed.length}/${results.length} tenant(s) blocked.`);
    process.exit(1);
  }
  console.log("HOME KNOW DATA GATE PASSED: all v4 tenants have usable Home KNOW read models.");
}

async function assertViewsExist(pool) {
  const { rows } = await pool.query(
    `
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = ANY($1)
        AND c.relkind IN ('v', 'm')
    `,
    [REQUIRED_VIEWS],
  );
  const found = new Set(rows.map((row) => row.relname));
  const missing = REQUIRED_VIEWS.filter((view) => !found.has(view));
  if (missing.length > 0) {
    throw new Error(`Missing Home KNOW views: ${missing.join(", ")}`);
  }
}

async function checkTenant(pool, tenant) {
  const counts = await one(pool, `
    SELECT
      (SELECT count(*)::int FROM public.enterprise_context_records WHERE tenant_key = $1 AND lifecycle_state = 'active') AS records,
      (SELECT count(*)::int FROM public.enterprise_context_facts WHERE tenant_key = $1 AND lifecycle_state = 'active') AS facts,
      (SELECT count(*)::int FROM public.enterprise_context_relationships WHERE tenant_key = $1 AND lifecycle_state = 'active') AS relationships,
      (
        SELECT count(*)::int
        FROM public.enterprise_context_records
        WHERE tenant_key = $1
          AND lifecycle_state = 'active'
          AND source_file IS NOT NULL
          AND source_row_number IS NOT NULL
      ) AS lineage_rows
  `, [tenant.dbTenantKey]);

  const coverage = await all(pool, `
    SELECT dimension_id, record_count::int AS record_count, fact_count::int AS fact_count,
           relationship_count::int AS relationship_count, source_count::int AS source_count,
           gap_count::int AS gap_count, conflict_count::int AS conflict_count,
           trust_score::int AS trust_score
    FROM public.mv_home_dimension_coverage_view
    WHERE tenant_key = $1
    ORDER BY dimension_id
  `, [tenant.dbTenantKey]);

  const requiredFamilies = await one(pool, `
    SELECT
      (SELECT count(*)::int FROM public.mv_home_it_org_view WHERE tenant_key = $1) AS org_rows,
      (SELECT count(*)::int FROM public.mv_home_application_ownership_view WHERE tenant_key = $1) AS app_rows,
      (SELECT count(*)::int FROM public.mv_home_vendor_landscape_view WHERE tenant_key = $1) AS vendor_rows,
      (SELECT count(*)::int FROM public.mv_home_budget_by_portfolio_view WHERE tenant_key = $1) AS budget_rows
  `, [tenant.dbTenantKey]);

  const payloadProof = await one(pool, `
    SELECT
      bool_or(payload ? 'team_id' OR source_file ILIKE '%F03%') AS has_org_shape,
      bool_or(payload ? 'application_name' OR source_file ILIKE '%F05%') AS has_app_shape,
      bool_or(payload ? 'vendor_name' OR source_file ILIKE '%F11%') AS has_vendor_shape,
      bool_or(payload ? 'run_budget_usd' OR source_file ILIKE '%F12%') AS has_budget_shape
    FROM public.enterprise_context_records
    WHERE tenant_key = $1
      AND lifecycle_state = 'active'
  `, [tenant.dbTenantKey]);

  const coverageCounts = coverage.map((row) => row.record_count);
  const variedCounts = new Set(coverageCounts).size > 1;
  const reason = firstFailure([
    [counts.records > 0, "no active enterprise_context_records"],
    [counts.facts > 0, "no active enterprise_context_facts"],
    [counts.relationships > 0, "no active enterprise_context_relationships"],
    [counts.lineage_rows > 0, "source_file/source_row_number lineage is missing"],
    [coverage.length > 0, "mv_home_dimension_coverage_view returned zero rows"],
    [variedCounts, "dimension coverage counts look uniform/placeheld"],
    [requiredFamilies.org_rows > 0, "mv_home_it_org_view returned zero rows"],
    [requiredFamilies.app_rows > 0, "mv_home_application_ownership_view returned zero rows"],
    [requiredFamilies.vendor_rows > 0, "mv_home_vendor_landscape_view returned zero rows"],
    [requiredFamilies.budget_rows > 0, "mv_home_budget_by_portfolio_view returned zero rows"],
    [payloadProof.has_org_shape, "payload/source shape missing for F03 org"],
    [payloadProof.has_app_shape, "payload/source shape missing for F05 applications"],
    [payloadProof.has_vendor_shape, "payload/source shape missing for F11 vendors"],
    [payloadProof.has_budget_shape, "payload/source shape missing for F12 budget"],
  ]);

  return {
    ...tenant,
    status: reason ? "fail" : "pass",
    records: counts.records,
    facts: counts.facts,
    relationships: counts.relationships,
    lineageRows: counts.lineage_rows,
    coverageRows: coverage.length,
    variedCounts,
    reason,
  };
}

async function one(pool, sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows[0] ?? {};
}

async function all(pool, sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

function firstFailure(assertions) {
  for (const [condition, message] of assertions) {
    if (!condition) return message;
  }
  return null;
}

function isLocal(connectionString) {
  try {
    const url = new URL(connectionString);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
