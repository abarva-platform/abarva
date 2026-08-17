#!/usr/bin/env node
// Source substrate lineage: prove Source / Contract 360 / Cube figures from
// the owning read models, with counting basis attached to every assertion.
//
// This is the Source counterpart to scripts/tower/fact-lineage-report.mjs.
// Tower's report covers Tower and tenant-intake headline metrics. It does not
// prove Source workspace counts, Contract 360 totals, or Cube/canary figures.
//
// Status semantics are intentionally the same:
//   AGREE      same metric + same basis, multiple sources agree within tolerance
//   CONFLICT   same metric + same basis, sources materially disagree
//   ONE_SOURCE only one source asserts metric + basis
//   ABSENT     no source asserts metric + basis
//
// Legitimate basis differences are reported separately. Example: contract
// rows in source.contract_360 vs contract families in the Source V4 snapshot.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.cwd();
const SCOPE_PATH = path.join(
  ROOT,
  "datasets/source/source-substrate-lineage-scope.json",
);
const OUT_DIR = path.join(ROOT, "reports/source-substrate-lineage");
const TOLERANCE = 0.02;

export const SOURCE_DEFINITIONS = [
  {
    id: "source.contract_360",
    label: "Contract 360 read model",
    table: "source.contract_360",
    basisByMetric: {
      contract_count: "contract_row",
      vendor_count: "vendor_ref",
      portfolio_annual_value_usd: "annual_value_total",
      total_committed_value_usd: "committed_value_total",
      auto_renew_contract_count: "contract_row",
    },
    sql: `
      SELECT
        COUNT(*)::numeric AS contract_count,
        COUNT(DISTINCT vendor_ref)::numeric AS vendor_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd,
        COALESCE(SUM(total_committed_value), 0)::numeric AS total_committed_value_usd,
        COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::numeric AS auto_renew_contract_count
      FROM source.contract_360
      WHERE tenant_key = ANY($1::text[])
        AND NOT (vendor_ref = ANY($2::text[]))
    `,
  },
  {
    id: "source.vendor_contract_portfolio",
    label: "Vendor Contract Portfolio read model",
    table: "source.vendor_contract_portfolio",
    basisByMetric: {
      contract_count: "contract_row",
      vendor_count: "vendor_ref",
      portfolio_annual_value_usd: "annual_value_total",
      total_committed_value_usd: "committed_value_total",
      auto_renew_contract_count: "contract_row",
    },
    sql: `
      SELECT
        COALESCE(SUM(contract_count), 0)::numeric AS contract_count,
        COUNT(DISTINCT vendor_ref)::numeric AS vendor_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd,
        COALESCE(SUM(total_committed_value), 0)::numeric AS total_committed_value_usd,
        COALESCE(SUM(auto_renew_contracts), 0)::numeric AS auto_renew_contract_count
      FROM source.vendor_contract_portfolio
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "consumption.sourcing_contract_v1",
    label: "Current Source contract cube",
    table: "consumption.sourcing_contract_v1",
    basisByMetric: {
      contract_count: "contract_row",
      portfolio_annual_value_usd: "annual_value_total",
      total_committed_value_usd: "committed_value_total",
      auto_renew_contract_count: "contract_row",
    },
    sql: `
      SELECT
        COUNT(*)::numeric AS contract_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd,
        COALESCE(SUM(total_committed_value), 0)::numeric AS total_committed_value_usd,
        COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::numeric AS auto_renew_contract_count
      FROM consumption.sourcing_contract_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "consumption.sourcing_vendor_v1",
    label: "Current Source vendor cube",
    table: "consumption.sourcing_vendor_v1",
    basisByMetric: {
      contract_count: "contract_row",
      vendor_count: "vendor_ref",
      portfolio_annual_value_usd: "annual_value_total",
      total_committed_value_usd: "committed_value_total",
      auto_renew_contract_count: "contract_row",
    },
    sql: `
      SELECT
        COALESCE(SUM(contract_count), 0)::numeric AS contract_count,
        COUNT(DISTINCT vendor_ref)::numeric AS vendor_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd,
        COALESCE(SUM(total_committed_value), 0)::numeric AS total_committed_value_usd,
        COALESCE(SUM(auto_renew_contracts), 0)::numeric AS auto_renew_contract_count
      FROM consumption.sourcing_vendor_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "consumption_v4_canary.sourcing_context_coverage_v1",
    label: "Source V4 context coverage",
    tenantFamilies: ["skyharbor"],
    table: "consumption_v4_canary.sourcing_context_coverage_v1",
    basisByMetric: {
      contract_count: "contract_family",
      vendor_count: "vendor_family",
      portfolio_annual_value_usd: "annual_value_total",
    },
    sql: `
      SELECT
        COALESCE(SUM(contracts), 0)::numeric AS contract_count,
        COALESCE(SUM(vendors), 0)::numeric AS vendor_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd
      FROM consumption_v4_canary.sourcing_context_coverage_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "consumption_v4_canary.sourcing_contract_v1",
    label: "Source V4 contract cube",
    tenantFamilies: ["skyharbor"],
    table: "consumption_v4_canary.sourcing_contract_v1",
    basisByMetric: {
      contract_count: "contract_family",
      portfolio_annual_value_usd: "annual_value_total",
      total_committed_value_usd: "committed_value_contract_family_total",
      auto_renew_contract_count: "contract_family",
    },
    sql: `
      SELECT
        COUNT(*)::numeric AS contract_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd,
        COALESCE(SUM(total_committed_value), 0)::numeric AS total_committed_value_usd,
        COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::numeric AS auto_renew_contract_count
      FROM consumption_v4_canary.sourcing_contract_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "consumption_v4_canary.sourcing_vendor_v1",
    label: "Source V4 vendor cube",
    tenantFamilies: ["skyharbor"],
    table: "consumption_v4_canary.sourcing_vendor_v1",
    basisByMetric: {
      contract_count: "contract_family",
      vendor_count: "vendor_family",
      portfolio_annual_value_usd: "annual_value_total",
    },
    sql: `
      SELECT
        COALESCE(SUM(contract_count), 0)::numeric AS contract_count,
        COUNT(*)::numeric AS vendor_count,
        COALESCE(SUM(annual_value), 0)::numeric AS portfolio_annual_value_usd
      FROM consumption_v4_canary.sourcing_vendor_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "meridian.contract_family_canary",
    label: "Meridian contract-family canary",
    tenantFamilies: ["meridian"],
    table:
      "foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1",
    basisByMetric: {
      contract_count: "contract_family",
      total_committed_value_usd: "committed_value_total",
    },
    sql: `
      SELECT
        COUNT(*)::numeric AS contract_count,
        COALESCE(SUM(synthetic_midpoint_total_contract_value), 0)::numeric AS total_committed_value_usd
      FROM foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
  {
    id: "meridian.vendor_portfolio_canary",
    label: "Meridian vendor-portfolio canary",
    tenantFamilies: ["meridian"],
    table:
      "foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1",
    basisByMetric: {
      contract_count: "contract_family",
      vendor_count: "vendor_family",
      portfolio_annual_value_usd: "annual_value_total",
    },
    sql: `
      SELECT
        COALESCE(SUM(contract_family_count), 0)::numeric AS contract_count,
        COUNT(*)::numeric AS vendor_count,
        COALESCE(SUM(invoice_line_amount), 0)::numeric AS portfolio_annual_value_usd
      FROM foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1
      WHERE tenant_key = ANY($1::text[])
    `,
  },
];

const METRICS = [
  {
    key: "portfolio_annual_value_usd",
    label: "Portfolio annual value",
    format: "money",
  },
  {
    key: "total_committed_value_usd",
    label: "Total committed value",
    format: "money",
  },
  {
    key: "contract_count",
    label: "Contract count",
    format: "count",
  },
  {
    key: "vendor_count",
    label: "Vendor count",
    format: "count",
  },
  {
    key: "auto_renew_contract_count",
    label: "Auto-renew contract count",
    format: "count",
  },
];

function readJson(full) {
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function loadLocalEnv() {
  const full = path.join(ROOT, ".env.local");
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    let value = rest.join("=").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  const arg = (name) => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : null;
  };
  return {
    tenant: arg("--tenant"),
    metric: arg("--metric"),
    json: arg("--json"),
    markdown: arg("--markdown"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function connectionString() {
  return (
    process.env.PROD_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ""
  );
}

function connectionOptions(connectionStringValue) {
  if (!connectionStringValue) {
    throw new Error(
      "missing_database_url: set DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or PROD_DATABASE_URL",
    );
  }
  return {
    connectionString: connectionStringValue,
    application_name: "source-substrate-lineage-report",
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 20000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 20000),
    ssl: connectionStringValue.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

function tenantScope(scope, tenantKey) {
  const configured = scope.tenants?.[tenantKey];
  return {
    key: tenantKey,
    rlsKey: configured?.rlsKey ?? tenantKey,
    aliases: Array.from(
      new Set([...(configured?.aliases ?? []), tenantKey].filter(Boolean)),
    ),
  };
}

function numeric(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function assertedValue(value) {
  const n = numeric(value);
  if (n == null || n === 0) return null;
  return n;
}

async function querySource(client, tenant, source, supplementalVendorRefs) {
  try {
    const result = await client.query(
      source.sql,
      queryParameterValuesForSource(source, tenant, supplementalVendorRefs),
    );
    return { ok: true, rows: result.rows };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function queryParameterValuesForSource(
  source,
  tenant,
  supplementalVendorRefs,
) {
  const placeholderNumbers = Array.from(source.sql.matchAll(/\$(\d+)/g)).map(
    (match) => Number(match[1]),
  );
  const maxPlaceholder = placeholderNumbers.length
    ? Math.max(...placeholderNumbers)
    : 0;
  if (maxPlaceholder <= 0) return [];
  const values = [tenant.aliases];
  if (maxPlaceholder >= 2) values.push(supplementalVendorRefs);
  return values;
}

function assertionsFromSource(tenantKey, source, rows) {
  const row = rows[0] ?? {};
  return Object.entries(source.basisByMetric)
    .map(([metric, basis]) => {
      const value = assertedValue(row[metric]);
      if (value == null) return null;
      return {
        tenant: tenantKey,
        metric,
        basis,
        value,
        sourceId: source.id,
        sourceLabel: source.label,
        table: source.table,
      };
    })
    .filter(Boolean);
}

export function evaluateAssertions({
  assertions,
  expectedMetrics = METRICS,
  expectedTenants = [],
  declaredBasisDifferences = [],
  tolerance = TOLERANCE,
}) {
  const basisByMetric = new Map();
  for (const assertion of assertions) {
    const key = `${assertion.tenant}::${assertion.metric}`;
    const basisSet = basisByMetric.get(key) ?? new Set();
    basisSet.add(assertion.basis);
    basisByMetric.set(key, basisSet);
  }
  for (const assertion of assertions) {
    const expectedMetric = expectedMetrics.find((metric) => metric.key === assertion.metric);
    if (!expectedMetric) continue;
    const key = `${assertion.tenant}::${assertion.metric}`;
    const basisSet = basisByMetric.get(key) ?? new Set();
    basisSet.add(assertion.basis);
    basisByMetric.set(key, basisSet);
  }

  const tenants = Array.from(
    new Set([
      ...expectedTenants,
      ...assertions.map((assertion) => assertion.tenant),
    ]),
  ).sort();
  const groups = [];
  for (const tenant of tenants) {
    for (const metric of expectedMetrics) {
      const metricAssertions = assertions.filter(
        (assertion) =>
          assertion.tenant === tenant && assertion.metric === metric.key,
      );
      const bases = Array.from(
        new Set(metricAssertions.map((assertion) => assertion.basis)),
      ).sort();
      if (bases.length === 0) {
        groups.push({
          tenant,
          metric: metric.key,
          label: metric.label,
          basis: "n/a",
          status: "ABSENT",
          assertions: [],
        });
        continue;
      }
      for (const basis of bases) {
        const inBasis = metricAssertions.filter(
          (assertion) => assertion.basis === basis,
        );
        groups.push({
          tenant,
          metric: metric.key,
          label: metric.label,
          basis,
          status: statusFor(inBasis, tolerance),
          assertions: inBasis,
        });
      }
    }
  }

  const basisDifferences = [];
  for (const tenant of tenants) {
    for (const metric of expectedMetrics) {
      const metricGroups = groups.filter(
        (group) =>
          group.tenant === tenant &&
          group.metric === metric.key &&
          group.status !== "ABSENT",
      );
      const bases = Array.from(new Set(metricGroups.map((group) => group.basis)));
      if (bases.length <= 1) continue;
      const declared = declaredBasisDifferences.find(
        (entry) =>
          entry.metric === metric.key &&
          bases.every((basis) => entry.bases?.includes(basis)),
      );
      basisDifferences.push({
        tenant,
        metric: metric.key,
        bases,
        declared: Boolean(declared),
        explanation: declared?.explanation ?? null,
      });
    }
  }

  const counts = {};
  for (const group of groups) counts[group.status] = (counts[group.status] ?? 0) + 1;
  return { groups, basisDifferences, counts };
}

function statusFor(assertions, tolerance) {
  if (!assertions.length) return "ABSENT";
  if (assertions.length === 1) return "ONE_SOURCE";
  const values = assertions.map((assertion) => assertion.value);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  return hi === 0 || (hi - lo) / hi <= tolerance ? "AGREE" : "CONFLICT";
}

function formatValue(value, format) {
  if (value == null) return "—";
  if (format === "money") return `$${(value / 1_000_000).toFixed(1)}M`;
  return value.toLocaleString("en-US");
}

export function renderMarkdown({
  scope,
  groups,
  basisDifferences,
  sourceErrors,
  tenants,
}) {
  const metricByKey = new Map(METRICS.map((metric) => [metric.key, metric]));
  const md = [
    "# Source substrate lineage",
    "",
    `Mode: \`${scope.defaultMode ?? "quote"}\`.`,
    "",
    scope.modes?.quote?.purpose ?? "",
    "",
    `Tenants: ${tenants.map((tenant) => `\`${tenant}\``).join(", ")}.`,
    "",
    "For each Source metric and tenant: every owning read model, cube, or canary source that asserts a value, its counting basis, and whether same-basis assertions agree.",
    "",
    "| Status | Meaning |",
    "| --- | --- |",
    "| `AGREE` | Same metric and same basis, several sources within 2% |",
    "| `CONFLICT` | Same metric and same basis, sources materially disagree; do not quote until resolved |",
    "| `ONE_SOURCE` | Only one source asserts this metric and basis; quote only with that caveat |",
    "| `ABSENT` | No source asserts this metric and basis |",
    "",
  ];

  for (const metric of METRICS) {
    md.push(`## ${metric.label} \`${metric.key}\``, "");
    md.push("| Tenant | Basis | Status | Asserted by | Value |");
    md.push("| --- | --- | --- | --- | ---: |");
    for (const group of groups.filter((item) => item.metric === metric.key)) {
      if (!group.assertions.length) {
        md.push(`| ${group.tenant} | ${group.basis} | \`${group.status}\` | — | — |`);
        continue;
      }
      group.assertions.forEach((assertion, index) => {
        md.push(
          `| ${index === 0 ? group.tenant : ""} | ${index === 0 ? group.basis : ""} | ${index === 0 ? `\`${group.status}\`` : ""} | \`${assertion.sourceId}\` | ${formatValue(assertion.value, metricByKey.get(group.metric)?.format)} |`,
        );
      });
    }
    md.push("");
  }

  if (basisDifferences.length) {
    md.push("## Declared basis differences", "");
    md.push("| Tenant | Metric | Bases | Declared | Explanation |");
    md.push("| --- | --- | --- | --- | --- |");
    for (const diff of basisDifferences) {
      md.push(
        `| ${diff.tenant} | \`${diff.metric}\` | ${diff.bases.map((basis) => `\`${basis}\``).join(", ")} | ${diff.declared ? "yes" : "no"} | ${diff.explanation ?? "No declared explanation; review before quoting."} |`,
      );
    }
    md.push("");
  }

  if (sourceErrors.length) {
    md.push("## Source read errors", "");
    md.push("| Tenant | Source | Error |");
    md.push("| --- | --- | --- |");
    for (const error of sourceErrors) {
      md.push(`| ${error.tenant} | \`${error.sourceId}\` | ${error.error.replace(/\|/g, "/")} |`);
    }
    md.push("");
  }

  return `${md.join("\n")}\n`;
}

async function collectAssertions({ client, scope, tenants }) {
  const assertions = [];
  const sourceErrors = [];
  const supplementalVendorRefs = scope.supplementalVendorRefs ?? [];

  for (const tenantKey of tenants) {
    const tenant = tenantScope(scope, tenantKey);
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [
      tenant.rlsKey,
    ]);

    const selectedSourceIds = scope.modes?.[scope.defaultMode ?? "quote"]?.sourceIds ?? [];
    for (const source of SOURCE_DEFINITIONS) {
      if (selectedSourceIds.length > 0 && !selectedSourceIds.includes(source.id)) continue;
      if (!sourceAppliesToTenant(source, tenantKey)) continue;
      const result = await querySource(
        client,
        tenant,
        source,
        supplementalVendorRefs,
      );
      if (!result.ok) {
        sourceErrors.push({
          tenant: tenantKey,
          sourceId: source.id,
          error: result.error,
        });
        continue;
      }
      assertions.push(
        ...assertionsFromSource(tenantKey, source, result.rows),
      );
    }
  }
  return { assertions, sourceErrors };
}

function sourceAppliesToTenant(source, tenantKey) {
  if (!source.tenantFamilies?.length) return true;
  const family = tenantFamily(tenantKey);
  return source.tenantFamilies.includes(family);
}

function tenantFamily(tenantKey) {
  return tenantKey.toLowerCase().includes("meridian") ? "meridian" : "skyharbor";
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(
      "Usage: node scripts/source/source-substrate-lineage-report.mjs [--tenant <tenant_key>] [--metric <metric_key>] [--json <path>] [--markdown <path>]",
    );
    return;
  }
  loadLocalEnv();
  const scope = readJson(SCOPE_PATH);
  const tenants = args.tenant
    ? args.tenant.split(",").map((tenant) => tenant.trim()).filter(Boolean)
    : scope.defaultTenants;
  if (!tenants?.length) throw new Error("no_tenants_selected");

  const { Client } = createRequire(import.meta.url)("pg");
  const client = new Client(connectionOptions(connectionString()));
  await client.connect();
  try {
    const { assertions, sourceErrors } = await collectAssertions({
      client,
      scope,
      tenants,
    });
    const expectedMetrics = args.metric
      ? METRICS.filter((metric) => metric.key === args.metric)
      : METRICS;
    if (args.metric && expectedMetrics.length === 0) {
      throw new Error(`unknown_metric: ${args.metric}`);
    }
    const result = evaluateAssertions({
      assertions: assertions.filter(
        (assertion) =>
          !args.metric || assertion.metric === args.metric,
      ),
      expectedMetrics,
      expectedTenants: tenants,
      declaredBasisDifferences: scope.declaredBasisDifferences ?? [],
    });
    const json = {
      generated_at: new Date().toISOString(),
      mode: scope.defaultMode ?? "quote",
      tenants,
      counts: result.counts,
      groups: result.groups,
      basis_differences: result.basisDifferences,
      source_errors: sourceErrors,
    };
    const markdown = renderMarkdown({
      scope,
      groups: result.groups,
      basisDifferences: result.basisDifferences,
      sourceErrors,
      tenants,
    });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const jsonPath = args.json ?? path.join(OUT_DIR, "lineage.json");
    const mdPath = args.markdown ?? path.join(OUT_DIR, "lineage.md");
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
    fs.writeFileSync(mdPath, markdown);

    console.log(
      Object.entries(result.counts)
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => `${status} ${count}`)
        .join("   "),
    );
    if (result.basisDifferences.length) {
      console.log("");
      console.log("BASIS DIFFERENCES");
      for (const diff of result.basisDifferences) {
        console.log(
          `  ${diff.tenant} ${diff.metric}: ${diff.bases.join(" vs ")} (${diff.declared ? "declared" : "undeclared"})`,
        );
      }
    }
    for (const group of result.groups.filter((item) => item.status === "CONFLICT")) {
      console.log("");
      console.log(`CONFLICT ${group.tenant} ${group.metric} basis=${group.basis}`);
      for (const assertion of group.assertions) {
        console.log(
          `  ${formatValue(assertion.value, METRICS.find((metric) => metric.key === group.metric)?.format).padStart(10)} ${assertion.sourceId}`,
        );
      }
    }
    console.log("");
    console.log(`Written to ${path.relative(ROOT, mdPath)}`);
    if (
      sourceErrors.length ||
      result.groups.some((group) => group.status === "CONFLICT")
    ) {
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
