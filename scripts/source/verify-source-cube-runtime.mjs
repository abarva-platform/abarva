import crypto from "node:crypto";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const baseUrl = (args.get("url") || process.env.SOURCE_CUBE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const tenantKey = args.get("tenant") || process.env.SOURCE_TENANT_KEY || "skyharbor_global";
const apiSecret = args.get("secret") || process.env.CUBEJS_API_SECRET;

if (!apiSecret) {
  console.error(JSON.stringify({ ok: false, error: "Missing CUBEJS_API_SECRET" }, null, 2));
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

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "content-type": "application/json",
    },
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

async function load(query, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request("/cubejs-api/v1/load", {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
}

function value(row, key) {
  const raw = row?.[key];
  if (raw === undefined || raw === null || raw === "") return 0;
  return Number(raw);
}

function responseSummary(response) {
  return {
    status: response.status,
    ok: response.ok,
    error: response.json?.error || response.json?.message || null,
    body: response.ok ? undefined : response.json,
  };
}

function assertEquals(failures, label, actual, expected) {
  if (value(actual, label) !== expected) {
    failures.push(`${label} expected ${expected}, got ${actual?.[label]}`);
  }
}

function assertClose(failures, label, actual, expected, tolerance = 0.01) {
  const actualValue = value(actual, label);
  if (Math.abs(actualValue - expected) > tolerance) {
    failures.push(`${label} expected ${expected}, got ${actual?.[label]}`);
  }
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const tenantToken = signJwt({ tenant_key: tenantKey, iat: now, exp: now + 600 });
  const missingTenantToken = signJwt({ iat: now, exp: now + 600 });

  const readyz = await request("/readyz");
  const livez = await request("/livez");
  const noAuth = await load({ measures: ["sourcing_contracts.count"] }, "");
  const missingTenant = await load({ measures: ["sourcing_contracts.count"] }, missingTenantToken);

  const contracts = await load(
    {
      measures: [
        "sourcing_contracts.count",
        "sourcing_contracts.annual_value",
        "sourcing_contracts.total_committed_value",
        "sourcing_contracts.auto_renew_count",
        "sourcing_contracts.notice_90_day_count",
      ],
    },
    tenantToken,
  );
  const vendors = await load(
    {
      measures: [
        "sourcing_vendors.count",
        "sourcing_vendors.annual_value",
        "sourcing_vendors.contract_count",
        "sourcing_vendors.distinct_categories",
      ],
    },
    tenantToken,
  );
  const scope = await load(
    {
      measures: [
        "sourcing_contract_scope.count",
        "sourcing_contract_scope.explicit_scope_count",
        "sourcing_contract_scope.inferred_scope_count",
        "sourcing_contract_scope.average_relationship_confidence",
      ],
    },
    tenantToken,
  );
  const v4Contracts = await load(
    {
      measures: [
        "source_v4_contracts.count",
        "source_v4_contracts.annual_value",
        "source_v4_contracts.total_committed_value",
        "source_v4_contracts.auto_renew_count",
        "source_v4_contracts.notice_90_day_count",
      ],
    },
    tenantToken,
  );
  const v4Vendors = await load(
    {
      measures: [
        "source_v4_vendors.count",
        "source_v4_vendors.annual_value",
        "source_v4_vendors.contract_count",
      ],
    },
    tenantToken,
  );
  const v4Scope = await load(
    {
      measures: [
        "source_v4_contract_scope.count",
        "source_v4_contract_scope.explicit_scope_count",
        "source_v4_contract_scope.inferred_scope_count",
      ],
    },
    tenantToken,
  );
  const v4Spend = await load(
    {
      measures: [
        "source_v4_spend_monthly.invoice_lines",
        "source_v4_spend_monthly.actual_spend",
        "source_v4_spend_monthly.off_contract_spend",
      ],
    },
    tenantToken,
  );
  const v4Performance = await load(
    {
      measures: [
        "source_v4_performance.count",
        "source_v4_performance.credit_calculated",
        "source_v4_performance.credit_claimed",
        "source_v4_performance.unclaimed_credit",
      ],
    },
    tenantToken,
  );
  const v4Saas = await load(
    {
      measures: [
        "source_v4_saas_usage.count",
        "source_v4_saas_usage.assigned_seats",
        "source_v4_saas_usage.active_users",
        "source_v4_saas_usage.actual_cost",
        "source_v4_saas_usage.claimable_rows",
      ],
    },
    tenantToken,
  );
  const v4Cloud = await load(
    {
      measures: [
        "source_v4_cloud_cost.count",
        "source_v4_cloud_cost.actual_cost",
        "source_v4_cloud_cost.amortized_cost",
        "source_v4_cloud_cost.overage_amount",
      ],
    },
    tenantToken,
  );
  const v4Workforce = await load(
    {
      measures: [
        "source_v4_workforce_rate_cards.count",
        "source_v4_workforce_rate_cards.hours",
        "source_v4_workforce_rate_cards.unapproved_variance_count",
      ],
    },
    tenantToken,
  );
  const v4Events = await load(
    {
      measures: [
        "source_v4_sourcing_events.count",
        "source_v4_sourcing_events.normalized_cost",
        "source_v4_sourcing_events.weighted_score",
      ],
    },
    tenantToken,
  );
  const v4Coverage = await load(
    {
      measures: [
        "source_v4_context_coverage.vendors",
        "source_v4_context_coverage.contracts",
        "source_v4_context_coverage.annual_value",
        "source_v4_context_coverage.scope_rows",
        "source_v4_context_coverage.invoice_lines",
        "source_v4_context_coverage.saas_usage_rows",
        "source_v4_context_coverage.cloud_rows",
        "source_v4_context_coverage.performance_rows",
      ],
    },
    tenantToken,
  );

  const contractRow = contracts.json?.data?.[0] || {};
  const vendorRow = vendors.json?.data?.[0] || {};
  const scopeRow = scope.json?.data?.[0] || {};
  const v4ContractRow = v4Contracts.json?.data?.[0] || {};
  const v4VendorRow = v4Vendors.json?.data?.[0] || {};
  const v4ScopeRow = v4Scope.json?.data?.[0] || {};
  const v4SpendRow = v4Spend.json?.data?.[0] || {};
  const v4PerformanceRow = v4Performance.json?.data?.[0] || {};
  const v4SaasRow = v4Saas.json?.data?.[0] || {};
  const v4CloudRow = v4Cloud.json?.data?.[0] || {};
  const v4WorkforceRow = v4Workforce.json?.data?.[0] || {};
  const v4EventRow = v4Events.json?.data?.[0] || {};
  const v4CoverageRow = v4Coverage.json?.data?.[0] || {};

  const failures = [];
  if (!readyz.ok) failures.push(`readyz returned ${readyz.status}`);
  if (!livez.ok) failures.push(`livez returned ${livez.status}`);
  if (noAuth.status !== 403) failures.push(`unauthenticated Cube load expected 403, got ${noAuth.status}`);
  if (missingTenant.status !== 403) failures.push(`Cube load without tenant_key expected controlled 403, got ${missingTenant.status}`);
  if (!contracts.ok) failures.push(`contracts Cube query failed with ${contracts.status}`);
  if (!vendors.ok) failures.push(`vendors Cube query failed with ${vendors.status}`);
  if (!scope.ok) failures.push(`contract scope Cube query failed with ${scope.status}`);
  if (!v4Contracts.ok) failures.push(`v4 contracts Cube query failed with ${v4Contracts.status}`);
  if (!v4Vendors.ok) failures.push(`v4 vendors Cube query failed with ${v4Vendors.status}`);
  if (!v4Scope.ok) failures.push(`v4 scope Cube query failed with ${v4Scope.status}`);
  if (!v4Spend.ok) failures.push(`v4 spend Cube query failed with ${v4Spend.status}`);
  if (!v4Performance.ok) failures.push(`v4 performance Cube query failed with ${v4Performance.status}`);
  if (!v4Saas.ok) failures.push(`v4 SaaS usage Cube query failed with ${v4Saas.status}`);
  if (!v4Cloud.ok) failures.push(`v4 cloud cost Cube query failed with ${v4Cloud.status}`);
  if (!v4Workforce.ok) failures.push(`v4 workforce Cube query failed with ${v4Workforce.status}`);
  if (!v4Events.ok) failures.push(`v4 sourcing events Cube query failed with ${v4Events.status}`);
  if (!v4Coverage.ok) failures.push(`v4 coverage Cube query failed with ${v4Coverage.status}`);

  if (contracts.ok && value(contractRow, "sourcing_contracts.count") !== 119) {
    failures.push(`sourcing_contracts.count expected 119, got ${contractRow["sourcing_contracts.count"]}`);
  }
  if (contracts.ok && value(contractRow, "sourcing_contracts.annual_value") !== 1480500000) {
    failures.push(`sourcing_contracts.annual_value expected 1480500000, got ${contractRow["sourcing_contracts.annual_value"]}`);
  }
  if (vendors.ok && value(vendorRow, "sourcing_vendors.count") !== 28) {
    failures.push(`sourcing_vendors.count expected 28, got ${vendorRow["sourcing_vendors.count"]}`);
  }
  if (vendors.ok && value(vendorRow, "sourcing_vendors.contract_count") !== 119) {
    failures.push(`sourcing_vendors.contract_count expected 119, got ${vendorRow["sourcing_vendors.contract_count"]}`);
  }
  if (scope.ok && value(scopeRow, "sourcing_contract_scope.count") !== 3373) {
    failures.push(`sourcing_contract_scope.count expected 3373, got ${scopeRow["sourcing_contract_scope.count"]}`);
  }
  if (scope.ok && value(scopeRow, "sourcing_contract_scope.explicit_scope_count") !== 0) {
    failures.push(`explicit contract scope expected 0, got ${scopeRow["sourcing_contract_scope.explicit_scope_count"]}`);
  }
  if (v4Contracts.ok) {
    assertEquals(failures, "source_v4_contracts.count", v4ContractRow, 100);
    assertEquals(failures, "source_v4_contracts.annual_value", v4ContractRow, 1480500000);
  }
  if (v4Vendors.ok) {
    assertEquals(failures, "source_v4_vendors.count", v4VendorRow, 60);
    assertEquals(failures, "source_v4_vendors.contract_count", v4VendorRow, 100);
    assertEquals(failures, "source_v4_vendors.annual_value", v4VendorRow, 1480500000);
  }
  if (v4Scope.ok) {
    assertEquals(failures, "source_v4_contract_scope.count", v4ScopeRow, 5200);
    assertEquals(failures, "source_v4_contract_scope.explicit_scope_count", v4ScopeRow, 2600);
    assertEquals(failures, "source_v4_contract_scope.inferred_scope_count", v4ScopeRow, 2600);
  }
  if (v4Spend.ok) {
    assertEquals(failures, "source_v4_spend_monthly.invoice_lines", v4SpendRow, 175000);
    assertClose(failures, "source_v4_spend_monthly.off_contract_spend", v4SpendRow, 25709088.9);
  }
  if (v4Performance.ok) {
    assertEquals(failures, "source_v4_performance.count", v4PerformanceRow, 7200);
    assertClose(failures, "source_v4_performance.unclaimed_credit", v4PerformanceRow, 12727537.72);
  }
  if (v4Saas.ok) {
    assertEquals(failures, "source_v4_saas_usage.count", v4SaasRow, 1536);
    assertEquals(failures, "source_v4_saas_usage.claimable_rows", v4SaasRow, 0);
  }
  if (v4Cloud.ok) {
    assertEquals(failures, "source_v4_cloud_cost.count", v4CloudRow, 3456);
  }
  if (v4Workforce.ok) {
    assertEquals(failures, "source_v4_workforce_rate_cards.count", v4WorkforceRow, 2400);
  }
  if (v4Events.ok) {
    assertEquals(failures, "source_v4_sourcing_events.count", v4EventRow, 720);
  }
  if (v4Coverage.ok) {
    assertEquals(failures, "source_v4_context_coverage.vendors", v4CoverageRow, 60);
    assertEquals(failures, "source_v4_context_coverage.contracts", v4CoverageRow, 100);
    assertEquals(failures, "source_v4_context_coverage.annual_value", v4CoverageRow, 1480500000);
    assertEquals(failures, "source_v4_context_coverage.scope_rows", v4CoverageRow, 5200);
    assertEquals(failures, "source_v4_context_coverage.invoice_lines", v4CoverageRow, 175000);
    assertEquals(failures, "source_v4_context_coverage.saas_usage_rows", v4CoverageRow, 1536);
    assertEquals(failures, "source_v4_context_coverage.cloud_rows", v4CoverageRow, 3456);
    assertEquals(failures, "source_v4_context_coverage.performance_rows", v4CoverageRow, 7200);
  }

  const result = {
    ok: failures.length === 0,
    tenant_key: tenantKey,
    cube_url: baseUrl,
    health: {
      readyz: readyz.status,
      livez: livez.status,
    },
    security: {
      no_auth_status: noAuth.status,
      missing_tenant_status: missingTenant.status,
    },
    cube_runtime_results: {
      contracts: contractRow,
      vendors: vendorRow,
      contract_scope: scopeRow,
    },
    source_v4_canary_results: {
      contracts: v4ContractRow,
      vendors: v4VendorRow,
      contract_scope: v4ScopeRow,
      spend_monthly: v4SpendRow,
      performance: v4PerformanceRow,
      saas_usage: v4SaasRow,
      cloud_cost: v4CloudRow,
      workforce_rate_cards: v4WorkforceRow,
      sourcing_events: v4EventRow,
      context_coverage: v4CoverageRow,
    },
    cube_runtime_diagnostics: {
      readyz: responseSummary(readyz),
      livez: responseSummary(livez),
      no_auth: responseSummary(noAuth),
      missing_tenant: responseSummary(missingTenant),
      contracts: responseSummary(contracts),
      vendors: responseSummary(vendors),
      contract_scope: responseSummary(scope),
      source_v4_contracts: responseSummary(v4Contracts),
      source_v4_vendors: responseSummary(v4Vendors),
      source_v4_contract_scope: responseSummary(v4Scope),
      source_v4_spend_monthly: responseSummary(v4Spend),
      source_v4_performance: responseSummary(v4Performance),
      source_v4_saas_usage: responseSummary(v4Saas),
      source_v4_cloud_cost: responseSummary(v4Cloud),
      source_v4_workforce_rate_cards: responseSummary(v4Workforce),
      source_v4_sourcing_events: responseSummary(v4Events),
      source_v4_context_coverage: responseSummary(v4Coverage),
    },
    known_scope_caveat: {
      explicit_contract_scope: value(scopeRow, "sourcing_contract_scope.explicit_scope_count"),
      inferred_contract_scope: value(scopeRow, "sourcing_contract_scope.inferred_scope_count"),
      note: "Contract scope relationships are currently vendor-based inference and must not be labeled explicit.",
    },
    failures,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
