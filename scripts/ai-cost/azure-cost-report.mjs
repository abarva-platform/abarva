#!/usr/bin/env node
/**
 * Azure cost collector — READ ONLY.
 *
 * Pulls month-to-date actual cost from the Azure Cost Management query API,
 * grouped by service and resource group, so ACA / Postgres / ACR / storage
 * spend sits alongside Anthropic API spend in one total-cost view.
 *
 * SAFETY: this script issues exactly one Cost Management `query` call. It never
 * creates, updates, scales, or deletes anything. The only `az` invocation is
 * `az rest --method post` against `Microsoft.CostManagement/query`, which is a
 * read operation despite the POST verb (the body is the query definition). The
 * URL is asserted against that endpoint before the call is made — see
 * assertReadOnlyUrl(). Do not extend this script to call other ARM endpoints;
 * write a separate, separately-reviewed tool.
 *
 * Auth: whatever `az` is already logged in as. In CI, use the repo's existing
 * federated (OIDC) service principal with the Cost Management Reader role —
 * NOT a contributor credential.
 *
 * Usage:
 *   node scripts/ai-cost/azure-cost-report.mjs --subscription <id>
 *   node scripts/ai-cost/azure-cost-report.mjs --subscription <id> --timeframe MonthToDate \
 *     --out reports/ai-cost/daily
 */

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const COST_QUERY_PATH = "/providers/Microsoft.CostManagement/query";

function assertReadOnlyUrl(url) {
  const parsed = new URL(url);
  if (parsed.host !== "management.azure.com") {
    throw new Error(`Refusing non-ARM host: ${parsed.host}`);
  }
  if (!parsed.pathname.endsWith(COST_QUERY_PATH)) {
    throw new Error(
      `Refusing non-cost-query path: ${parsed.pathname}. ` +
        "This tool may only call Microsoft.CostManagement/query.",
    );
  }
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}

function isoDay(offset = 0) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Cost Management returns { properties: { columns: [{name,type}], rows: [[...]] } }
 * — positional rows against a column list. Never index rows by a hardcoded
 * position; the column order varies with the grouping you request.
 */
function toRecords(payload) {
  const columns = payload?.properties?.columns ?? [];
  const rows = payload?.properties?.rows ?? [];
  const names = columns.map((c) => c.name);
  return rows.map((row) => {
    const record = {};
    names.forEach((name, i) => {
      record[name] = row[i];
    });
    return record;
  });
}

function pick(record, ...candidates) {
  for (const key of candidates) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function rollup(records, keyFn) {
  const map = new Map();
  for (const r of records) {
    const key = keyFn(r) ?? "unknown";
    const cost = Number(pick(r, "Cost", "PreTaxCost", "CostUSD") ?? 0);
    map.set(key, (map.get(key) ?? 0) + (Number.isFinite(cost) ? cost : 0));
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

/** Azure returns UsageDate as the integer 20260722, not an ISO string. */
function normalizeDay(value) {
  const text = String(value ?? "");
  return /^\d{8}$/.test(text)
    ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
    : text.slice(0, 10);
}

async function main() {
  const subscription = arg("subscription") ?? process.env.AZURE_SUBSCRIPTION_ID;
  const timeframe = arg("timeframe", "MonthToDate");
  const outDir = arg("out");

  if (!subscription) {
    console.error(
      "Subscription id required: --subscription <id> or AZURE_SUBSCRIPTION_ID.",
    );
    process.exit(2);
  }

  const url =
    `https://management.azure.com/subscriptions/${subscription}` +
    `${COST_QUERY_PATH}?api-version=2023-03-01`;
  assertReadOnlyUrl(url);

  const body = {
    type: "ActualCost",
    timeframe,
    dataset: {
      granularity: "Daily",
      aggregation: { totalCost: { name: "Cost", function: "Sum" } },
      grouping: [
        { type: "Dimension", name: "ServiceName" },
        { type: "Dimension", name: "ResourceGroupName" },
      ],
    },
  };

  let stdout;
  try {
    ({ stdout } = await run(
      "az",
      [
        "rest",
        "--method",
        "post",
        "--url",
        url,
        "--headers",
        "Content-Type=application/json",
        "--body",
        JSON.stringify(body),
      ],
      { maxBuffer: 32 * 1024 * 1024 },
    ));
  } catch (error) {
    const detail = String(error.stderr ?? error.message ?? error);
    console.error(
      `Azure cost query failed.\n${detail.slice(0, 900)}\n\n` +
        "Common causes: not logged in (`az login`), wrong subscription, or the " +
        "principal lacks the Cost Management Reader role on that subscription.",
    );
    process.exit(1);
  }

  const records = toRecords(JSON.parse(stdout));
  const totalCostUsd = records.reduce(
    (sum, r) => sum + (Number(pick(r, "Cost", "PreTaxCost", "CostUSD")) || 0),
    0,
  );

  const snapshot = {
    source: "azure-cost-management",
    generatedAt: new Date().toISOString(),
    subscription,
    timeframe,
    currency: records[0]?.Currency ?? "USD",
    totals: { billedCostUsd: totalCostUsd },
    costByDay: rollup(records, (r) => normalizeDay(pick(r, "UsageDate", "Date"))),
    costByService: rollup(records, (r) => pick(r, "ServiceName")),
    costByResourceGroup: rollup(records, (r) => pick(r, "ResourceGroupName")),
    rows: records,
  };

  if (outDir) {
    await mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `${isoDay(0)}-azure.json`);
    await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.error(`wrote ${file}`);
  }

  process.stdout.write(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
