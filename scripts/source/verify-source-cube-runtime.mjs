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

  const contractRow = contracts.json?.data?.[0] || {};
  const vendorRow = vendors.json?.data?.[0] || {};
  const scopeRow = scope.json?.data?.[0] || {};

  const failures = [];
  if (!readyz.ok) failures.push(`readyz returned ${readyz.status}`);
  if (!livez.ok) failures.push(`livez returned ${livez.status}`);
  if (noAuth.ok) failures.push("unauthenticated Cube load unexpectedly succeeded");
  if (missingTenant.ok) failures.push("Cube load without tenant_key unexpectedly succeeded");
  if (!contracts.ok) failures.push(`contracts Cube query failed with ${contracts.status}`);
  if (!vendors.ok) failures.push(`vendors Cube query failed with ${vendors.status}`);
  if (!scope.ok) failures.push(`contract scope Cube query failed with ${scope.status}`);

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
