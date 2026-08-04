import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const baseUrl = (args.get("url") || process.env.SOURCE_CUBE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const tenantKey = args.get("tenant") || process.env.SOURCE_TENANT_KEY || "skyharbor_global";
const apiSecret = args.get("secret") || process.env.CUBEJS_API_SECRET;
const databaseUrl = process.env.DATABASE_URL || process.env.SOURCE_CUBE_DATABASE_URL;

if (!apiSecret) {
  console.error(JSON.stringify({ ok: false, error: "Missing CUBEJS_API_SECRET" }, null, 2));
  process.exit(1);
}

if (!databaseUrl) {
  console.error(JSON.stringify({ ok: false, error: "Missing DATABASE_URL or SOURCE_CUBE_DATABASE_URL" }, null, 2));
  process.exit(1);
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const body = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

async function cubeLoad(query, token) {
  const response = await fetch(`${baseUrl}/cubejs-api/v1/load`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json };
}

function numeric(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function compareNumber(failures, label, cubeRow, cubeKey, sourceRow, sourceKey, tolerance = 0.01) {
  const cubeValue = numeric(cubeRow[cubeKey]);
  const sourceValue = numeric(sourceRow[sourceKey]);
  if (Number.isNaN(cubeValue) || Number.isNaN(sourceValue) || Math.abs(cubeValue - sourceValue) > tolerance) {
    failures.push(`${label}: Cube ${cubeKey}=${cubeRow[cubeKey]} does not match Source ${sourceKey}=${sourceRow[sourceKey]}`);
  }
}

const metricFamilies = [
  {
    name: "legacy_contracts",
    cubeMeasures: [
      "sourcing_contracts.count",
      "sourcing_contracts.annual_value",
      "sourcing_contracts.total_committed_value",
      "sourcing_contracts.auto_renew_count",
      "sourcing_contracts.notice_90_day_count",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(annual_value)::numeric AS annual_value,
        sum(total_committed_value)::numeric AS total_committed_value,
        sum(CASE WHEN auto_renew THEN 1 ELSE 0 END)::int AS auto_renew_count,
        sum(CASE WHEN notice_deadline <= DATE '2027-09-28' THEN 1 ELSE 0 END)::int AS notice_90_day_count
      FROM consumption.sourcing_contract_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["sourcing_contracts.count", "count", 0],
      ["sourcing_contracts.annual_value", "annual_value", 0.01],
      ["sourcing_contracts.total_committed_value", "total_committed_value", 0.01],
      ["sourcing_contracts.auto_renew_count", "auto_renew_count", 0],
      ["sourcing_contracts.notice_90_day_count", "notice_90_day_count", 0],
    ],
  },
  {
    name: "legacy_vendors",
    cubeMeasures: [
      "sourcing_vendors.count",
      "sourcing_vendors.annual_value",
      "sourcing_vendors.contract_count",
      "sourcing_vendors.distinct_categories",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(annual_value)::numeric AS annual_value,
        sum(contract_count)::int AS contract_count,
        count(DISTINCT supplier_category)::int AS distinct_categories
      FROM consumption.sourcing_vendor_semantic_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["sourcing_vendors.count", "count", 0],
      ["sourcing_vendors.annual_value", "annual_value", 0.01],
      ["sourcing_vendors.contract_count", "contract_count", 0],
      ["sourcing_vendors.distinct_categories", "distinct_categories", 0],
    ],
  },
  {
    name: "legacy_contract_scope",
    cubeMeasures: [
      "sourcing_contract_scope.count",
      "sourcing_contract_scope.explicit_scope_count",
      "sourcing_contract_scope.inferred_scope_count",
      "sourcing_contract_scope.average_relationship_confidence",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(CASE WHEN relationship_method = 'explicit_contract_scope' THEN 1 ELSE 0 END)::int AS explicit_scope_count,
        sum(CASE WHEN relationship_method LIKE '%inference' THEN 1 ELSE 0 END)::int AS inferred_scope_count,
        avg(relationship_confidence)::numeric AS average_relationship_confidence
      FROM consumption.sourcing_contract_scope_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["sourcing_contract_scope.count", "count", 0],
      ["sourcing_contract_scope.explicit_scope_count", "explicit_scope_count", 0],
      ["sourcing_contract_scope.inferred_scope_count", "inferred_scope_count", 0],
      ["sourcing_contract_scope.average_relationship_confidence", "average_relationship_confidence", 0.0001],
    ],
  },
  {
    name: "v4_contracts",
    cubeMeasures: [
      "source_v4_contracts.count",
      "source_v4_contracts.annual_value",
      "source_v4_contracts.total_committed_value",
      "source_v4_contracts.auto_renew_count",
      "source_v4_contracts.notice_90_day_count",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(annual_value)::numeric AS annual_value,
        sum(total_committed_value)::numeric AS total_committed_value,
        sum(CASE WHEN auto_renew THEN 1 ELSE 0 END)::int AS auto_renew_count,
        sum(CASE WHEN notice_deadline <= DATE '2027-09-28' THEN 1 ELSE 0 END)::int AS notice_90_day_count
      FROM consumption_v4_canary.sourcing_contract_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_contracts.count", "count", 0],
      ["source_v4_contracts.annual_value", "annual_value", 0.01],
      ["source_v4_contracts.total_committed_value", "total_committed_value", 0.01],
      ["source_v4_contracts.auto_renew_count", "auto_renew_count", 0],
      ["source_v4_contracts.notice_90_day_count", "notice_90_day_count", 0],
    ],
  },
  {
    name: "v4_vendors",
    cubeMeasures: [
      "source_v4_vendors.count",
      "source_v4_vendors.annual_value",
      "source_v4_vendors.contract_count",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(annual_value)::numeric AS annual_value,
        sum(contract_count)::int AS contract_count
      FROM consumption_v4_canary.sourcing_vendor_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_vendors.count", "count", 0],
      ["source_v4_vendors.annual_value", "annual_value", 0.01],
      ["source_v4_vendors.contract_count", "contract_count", 0],
    ],
  },
  {
    name: "v4_contract_scope",
    cubeMeasures: [
      "source_v4_contract_scope.count",
      "source_v4_contract_scope.explicit_scope_count",
      "source_v4_contract_scope.inferred_scope_count",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(CASE WHEN relationship_method = 'explicit_contract_scope' THEN 1 ELSE 0 END)::int AS explicit_scope_count,
        sum(CASE WHEN relationship_method <> 'explicit_contract_scope' THEN 1 ELSE 0 END)::int AS inferred_scope_count
      FROM consumption_v4_canary.sourcing_contract_scope_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_contract_scope.count", "count", 0],
      ["source_v4_contract_scope.explicit_scope_count", "explicit_scope_count", 0],
      ["source_v4_contract_scope.inferred_scope_count", "inferred_scope_count", 0],
    ],
  },
  {
    name: "v4_spend_monthly",
    cubeMeasures: [
      "source_v4_spend_monthly.invoice_lines",
      "source_v4_spend_monthly.actual_spend",
      "source_v4_spend_monthly.off_contract_spend",
    ],
    sourceSql: `
      SELECT
        sum(invoice_lines)::int AS invoice_lines,
        sum(actual_spend)::numeric AS actual_spend,
        sum(CASE WHEN matching_state = 'off_contract' THEN actual_spend ELSE 0 END)::numeric AS off_contract_spend
      FROM consumption_v4_canary.sourcing_spend_monthly_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_spend_monthly.invoice_lines", "invoice_lines", 0],
      ["source_v4_spend_monthly.actual_spend", "actual_spend", 0.01],
      ["source_v4_spend_monthly.off_contract_spend", "off_contract_spend", 0.01],
    ],
  },
  {
    name: "v4_performance",
    cubeMeasures: [
      "source_v4_performance.count",
      "source_v4_performance.credit_calculated",
      "source_v4_performance.credit_claimed",
      "source_v4_performance.unclaimed_credit",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(credit_calculated)::numeric AS credit_calculated,
        sum(credit_claimed)::numeric AS credit_claimed,
        sum(coalesce(credit_calculated, 0) - coalesce(credit_claimed, 0))::numeric AS unclaimed_credit
      FROM consumption_v4_canary.sourcing_performance_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_performance.count", "count", 0],
      ["source_v4_performance.credit_calculated", "credit_calculated", 0.01],
      ["source_v4_performance.credit_claimed", "credit_claimed", 0.01],
      ["source_v4_performance.unclaimed_credit", "unclaimed_credit", 0.01],
    ],
  },
  {
    name: "v4_saas_usage",
    cubeMeasures: [
      "source_v4_saas_usage.count",
      "source_v4_saas_usage.assigned_seats",
      "source_v4_saas_usage.active_users",
      "source_v4_saas_usage.actual_cost",
      "source_v4_saas_usage.claimable_rows",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(assigned_seats::numeric)::numeric AS assigned_seats,
        sum(active_users::numeric)::numeric AS active_users,
        sum(actual_cost::numeric)::numeric AS actual_cost,
        sum(CASE WHEN claimable_value_state = 'claimable' THEN 1 ELSE 0 END)::int AS claimable_rows
      FROM raw_source_v4.entra_saas_usage_monthly
      WHERE _tenant_key = $1
    `,
    pairs: [
      ["source_v4_saas_usage.count", "count", 0],
      ["source_v4_saas_usage.assigned_seats", "assigned_seats", 0.01],
      ["source_v4_saas_usage.active_users", "active_users", 0.01],
      ["source_v4_saas_usage.actual_cost", "actual_cost", 0.01],
      ["source_v4_saas_usage.claimable_rows", "claimable_rows", 0],
    ],
  },
  {
    name: "v4_cloud_cost",
    cubeMeasures: [
      "source_v4_cloud_cost.count",
      "source_v4_cloud_cost.actual_cost",
      "source_v4_cloud_cost.amortized_cost",
      "source_v4_cloud_cost.overage_amount",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(actual_cost::numeric)::numeric AS actual_cost,
        sum(amortized_cost::numeric)::numeric AS amortized_cost,
        sum(overage_amount::numeric)::numeric AS overage_amount
      FROM raw_source_v4.azure_cost_monthly
      WHERE _tenant_key = $1
    `,
    pairs: [
      ["source_v4_cloud_cost.count", "count", 0],
      ["source_v4_cloud_cost.actual_cost", "actual_cost", 0.01],
      ["source_v4_cloud_cost.amortized_cost", "amortized_cost", 0.01],
      ["source_v4_cloud_cost.overage_amount", "overage_amount", 0.01],
    ],
  },
  {
    name: "v4_workforce_rate_cards",
    cubeMeasures: [
      "source_v4_workforce_rate_cards.count",
      "source_v4_workforce_rate_cards.hours",
      "source_v4_workforce_rate_cards.unapproved_variance_count",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(hours::numeric)::numeric AS hours,
        sum(CASE WHEN approval_state = 'variance_unapproved' THEN 1 ELSE 0 END)::int AS unapproved_variance_count
      FROM raw_source_v4.fieldglass_rate_card
      WHERE _tenant_key = $1
    `,
    pairs: [
      ["source_v4_workforce_rate_cards.count", "count", 0],
      ["source_v4_workforce_rate_cards.hours", "hours", 0.01],
      ["source_v4_workforce_rate_cards.unapproved_variance_count", "unapproved_variance_count", 0],
    ],
  },
  {
    name: "v4_sourcing_events",
    cubeMeasures: [
      "source_v4_sourcing_events.count",
      "source_v4_sourcing_events.normalized_cost",
      "source_v4_sourcing_events.weighted_score",
    ],
    sourceSql: `
      SELECT
        count(*)::int AS count,
        sum(normalized_cost::numeric)::numeric AS normalized_cost,
        avg(score::numeric)::numeric AS weighted_score
      FROM raw_source_v4.ariba_sourcing_events
      WHERE _tenant_key = $1
    `,
    pairs: [
      ["source_v4_sourcing_events.count", "count", 0],
      ["source_v4_sourcing_events.normalized_cost", "normalized_cost", 0.01],
      ["source_v4_sourcing_events.weighted_score", "weighted_score", 0.0001],
    ],
  },
  {
    name: "v4_context_coverage",
    cubeMeasures: [
      "source_v4_context_coverage.vendors",
      "source_v4_context_coverage.contracts",
      "source_v4_context_coverage.annual_value",
      "source_v4_context_coverage.scope_rows",
      "source_v4_context_coverage.invoice_lines",
      "source_v4_context_coverage.saas_usage_rows",
      "source_v4_context_coverage.cloud_rows",
      "source_v4_context_coverage.performance_rows",
    ],
    sourceSql: `
      SELECT
        vendors::int,
        contracts::int,
        annual_value::numeric,
        scope_rows::int,
        invoice_lines::int,
        saas_usage_rows::int,
        cloud_rows::int,
        performance_rows::int
      FROM consumption_v4_canary.sourcing_context_coverage_v1
      WHERE tenant_key = $1
    `,
    pairs: [
      ["source_v4_context_coverage.vendors", "vendors", 0],
      ["source_v4_context_coverage.contracts", "contracts", 0],
      ["source_v4_context_coverage.annual_value", "annual_value", 0.01],
      ["source_v4_context_coverage.scope_rows", "scope_rows", 0],
      ["source_v4_context_coverage.invoice_lines", "invoice_lines", 0],
      ["source_v4_context_coverage.saas_usage_rows", "saas_usage_rows", 0],
      ["source_v4_context_coverage.cloud_rows", "cloud_rows", 0],
      ["source_v4_context_coverage.performance_rows", "performance_rows", 0],
    ],
  },
];

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const tenantToken = signJwt({ tenant_key: tenantKey, iat: now, exp: now + 600 });
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query("select set_config('app.tenant_key', $1, false)", [tenantKey]);

  const failures = [];
  const families = {};

  for (const spec of metricFamilies) {
    const cubeResponse = await cubeLoad({ measures: spec.cubeMeasures }, tenantToken);
    if (!cubeResponse.ok) {
      failures.push(`${spec.name}: Cube query failed with ${cubeResponse.status}`);
      families[spec.name] = {
        ok: false,
        cube_status: cubeResponse.status,
        cube_error: cubeResponse.json?.error || cubeResponse.json?.message || cubeResponse.json,
      };
      continue;
    }

    const sourceResult = await client.query(spec.sourceSql, [tenantKey]);
    const cubeRow = cubeResponse.json?.data?.[0] || {};
    const sourceRow = sourceResult.rows[0] || {};
    const familyFailures = [];
    for (const [cubeKey, sourceKey, tolerance] of spec.pairs) {
      compareNumber(familyFailures, spec.name, cubeRow, cubeKey, sourceRow, sourceKey, tolerance);
    }
    failures.push(...familyFailures);
    families[spec.name] = {
      ok: familyFailures.length === 0,
      cube: cubeRow,
      source: sourceRow,
      failures: familyFailures,
    };
  }

  await client.end();

  const result = {
    ok: failures.length === 0,
    tenant_key: tenantKey,
    cube_url: baseUrl,
    reconciled_family_count: metricFamilies.length,
    families,
    failures,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
