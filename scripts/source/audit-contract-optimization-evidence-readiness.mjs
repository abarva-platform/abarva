#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const tenantKey = args.get("tenant") || process.env.SOURCE_TENANT_KEY || "skyharbor_global";
const envFile = args.get("env-file");
const outDir = args.get("out-dir") || "";

await loadEnvFile(envFile);

function connectionString() {
  return (
    process.env.ABARVA_CLIENT_DATABASE_URL_SKYHARBOR_GLOBAL ||
    process.env.ABARVA_TENANT_DATABASE_URL_SKYHARBOR_GLOBAL ||
    process.env.AZURE_CLIENT_DATABASE_URL_SKYHARBOR_GLOBAL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.TARGET_DATABASE_URL ||
    ""
  );
}

function redactTarget(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, ""),
      sslmode: parsed.searchParams.get("sslmode") || "not_explicit",
    };
  } catch {
    return { host: "unparseable", database: "unparseable", sslmode: "unknown" };
  }
}

function sslConfig(url) {
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    return local || parsed.searchParams.get("sslmode") === "disable"
      ? false
      : { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

async function loadEnvFile(filePath) {
  if (!filePath) return;
  const text = await fs.readFile(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  const [, key, raw] = match;
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

async function tableExists(client, tableRef) {
  const result = await client.query("SELECT to_regclass($1) AS table_ref", [tableRef]);
  return Boolean(result.rows[0]?.table_ref);
}

async function queryIfExists(client, tableRef, sql, params = [tenantKey]) {
  if (!(await tableExists(client, tableRef))) {
    return { table: tableRef, exists: false, rows: [] };
  }
  const result = await client.query(sql, params);
  return { table: tableRef, exists: true, rows: result.rows };
}

function n(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function firstNumber(queryResult, key) {
  return n(queryResult.rows[0]?.[key]);
}

function classify(ledger, state, rationale, nextEvidence) {
  return { ledger, state, rationale, nextEvidence };
}

function evaluateReadiness(results) {
  const performance = results.recoverableLeakage.performance;
  const spend = results.recoverableLeakage.spend;
  const rateCards = results.recoverableLeakage.rateCards;
  const contracts = results.avoidedCost.contracts;
  const saas = results.avoidedCost.saas;
  const cloud = results.avoidedCost.cloud;
  const sourcingEvents = results.negotiatedImprovement.sourcingEvents;
  const eventFacts = results.negotiatedImprovement.facts;
  const towerClaims = results.realizedValue.towerClaims;

  const unclaimedCredit = firstNumber(performance, "unclaimed_credit");
  const offContractSpend = firstNumber(spend, "off_contract_spend");
  const unapprovedVarianceCount = firstNumber(rateCards, "unapproved_variance_count");
  const contractRows = firstNumber(contracts, "contract_count");
  const saasRows = firstNumber(saas, "row_count");
  const cloudRows = firstNumber(cloud, "row_count");
  const sourcingRows = firstNumber(sourcingEvents, "row_count");
  const factRows = eventFacts.rows.reduce((total, row) => total + n(row.count), 0);
  const realizedRows = towerClaims.rows
    .filter((row) => /^(accepted|claimable|finance_validated|realized|realised)$/i.test(row.claim_state ?? ""))
    .reduce((total, row) => total + n(row.count), 0);
  const realizedValue = towerClaims.rows
    .filter((row) => /^(accepted|claimable|finance_validated|realized|realised)$/i.test(row.claim_state ?? ""))
    .reduce((total, row) => total + n(row.calculated_value), 0);

  return [
    classify(
      "Recoverable leakage",
      unclaimedCredit > 0 || offContractSpend > 0 || unapprovedVarianceCount > 0
        ? "evidence_available_but_review_required"
        : "not_quantified",
      `Unclaimed credits=${usd(unclaimedCredit)}, off-contract spend=${usd(offContractSpend)}, unapproved rate-card exceptions=${unapprovedVarianceCount}.`,
      "For cash recovery, add reviewed invoice-line duplicates, active-contract matching, legal entitlement, vendor acceptance, and recovered-credit evidence.",
    ),
    classify(
      "Avoided cost",
      contractRows > 0 && (saasRows > 0 || cloudRows > 0)
        ? "exposure_available_workflow_required"
        : "needs_more_extracts",
      `Contracts=${contractRows}, SaaS usage rows=${saasRows}, cloud cost rows=${cloudRows}.`,
      "Classify shelfware, avoided uplift, scope rationalization, and consumption reductions before treating exposure as avoided cost.",
    ),
    classify(
      "Negotiated improvement",
      sourcingRows > 0 || factRows > 0
        ? "workflow_evidence_available"
        : "needs_sourcing_event_or_fact_rows",
      `Sourcing/BAFO rows=${sourcingRows}, active contract-optimization fact rows=${factRows}.`,
      "Capture signed concession terms, price/term deltas, index caps, volume-tier changes, and executive approvals by event.",
    ),
    classify(
      "Realized value",
      realizedRows > 0 && realizedValue > 0 ? "finance_value_available" : "not_established",
      `Finance-cleared Tower claim rows=${realizedRows}, calculated value=${usd(realizedValue)}.`,
      "Register baseline, actuals, attribution basis, guardrails, and finance attestation before presenting realized value.",
    ),
  ];
}

function usd(value) {
  return Number(value ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function main() {
  const url = connectionString();
  if (!url) {
    throw new Error("Missing database URL. Set a tenant database URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, DATABASE_URL, AZURE_LAB_DATABASE_URL, or TARGET_DATABASE_URL.");
  }

  const client = new Client({
    connectionString: url,
    application_name: "source-contract-optimization-evidence-audit",
    ssl: sslConfig(url),
  });

  await client.connect();
  try {
    const results = {
      recoverableLeakage: {
        spend: await queryIfExists(client, "consumption_v4_canary.sourcing_spend_monthly_v1", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(invoice_lines), 0)::numeric AS invoice_lines,
            coalesce(sum(actual_spend), 0)::numeric AS actual_spend,
            coalesce(sum(committed_amount), 0)::numeric AS committed_amount,
            coalesce(sum(CASE WHEN matching_state = 'off_contract' THEN actual_spend ELSE 0 END), 0)::numeric AS off_contract_spend,
            count(DISTINCT matching_state)::int AS matching_states
          FROM consumption_v4_canary.sourcing_spend_monthly_v1
          WHERE tenant_key = $1
        `),
        performance: await queryIfExists(client, "consumption_v4_canary.sourcing_performance_v1", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(breach_count), 0)::numeric AS breach_count,
            coalesce(sum(credit_calculated), 0)::numeric AS credit_calculated,
            coalesce(sum(credit_claimed), 0)::numeric AS credit_claimed,
            coalesce(sum(credit_recovered), 0)::numeric AS credit_recovered,
            coalesce(sum(coalesce(credit_calculated, 0) - coalesce(credit_claimed, 0)), 0)::numeric AS unclaimed_credit
          FROM consumption_v4_canary.sourcing_performance_v1
          WHERE tenant_key = $1
        `),
        rateCards: await queryIfExists(client, "raw_source_v4.fieldglass_rate_card", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(hours::numeric), 0)::numeric AS hours,
            coalesce(sum(CASE WHEN approval_state = 'variance_unapproved' THEN 1 ELSE 0 END), 0)::int AS unapproved_variance_count
          FROM raw_source_v4.fieldglass_rate_card
          WHERE _tenant_key = $1
        `),
      },
      avoidedCost: {
        contracts: await queryIfExists(client, "consumption_v4_canary.sourcing_contract_v1", `
          SELECT
            count(*)::int AS contract_count,
            coalesce(sum(annual_value), 0)::numeric AS annual_value,
            coalesce(sum(total_committed_value), 0)::numeric AS total_committed_value,
            coalesce(sum(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::int AS auto_renew_count,
            coalesce(sum(CASE WHEN notice_deadline <= DATE '2027-09-28' THEN 1 ELSE 0 END), 0)::int AS notice_90_day_count
          FROM consumption_v4_canary.sourcing_contract_v1
          WHERE tenant_key = $1
        `),
        saas: await queryIfExists(client, "raw_source_v4.entra_saas_usage_monthly", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(assigned_seats::numeric), 0)::numeric AS assigned_seats,
            coalesce(sum(active_users::numeric), 0)::numeric AS active_users,
            coalesce(sum(actual_cost::numeric), 0)::numeric AS actual_cost,
            coalesce(sum(CASE WHEN claimable_value_state = 'claimable' THEN 1 ELSE 0 END), 0)::int AS claimable_rows
          FROM raw_source_v4.entra_saas_usage_monthly
          WHERE _tenant_key = $1
        `),
        cloud: await queryIfExists(client, "raw_source_v4.azure_cost_monthly", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(actual_cost::numeric), 0)::numeric AS actual_cost,
            coalesce(sum(amortized_cost::numeric), 0)::numeric AS amortized_cost,
            coalesce(sum(overage_amount::numeric), 0)::numeric AS overage_amount
          FROM raw_source_v4.azure_cost_monthly
          WHERE _tenant_key = $1
        `),
      },
      negotiatedImprovement: {
        sourcingEvents: await queryIfExists(client, "raw_source_v4.ariba_sourcing_events", `
          SELECT
            count(*)::int AS row_count,
            coalesce(sum(normalized_cost::numeric), 0)::numeric AS normalized_cost,
            coalesce(sum(line_item_cost::numeric), 0)::numeric AS line_item_cost,
            avg(score::numeric)::numeric AS average_weighted_score,
            count(DISTINCT event_id)::int AS event_count
          FROM raw_source_v4.ariba_sourcing_events
          WHERE _tenant_key = $1
        `),
        events: await queryIfExists(client, "source_events", `
          SELECT sourcing_motion, count(*)::int AS count
          FROM source_events
          WHERE client_key = $1
          GROUP BY sourcing_motion
          ORDER BY sourcing_motion
        `),
        facts: await queryIfExists(client, "source_event_facts", `
          SELECT f.fact_key, count(*)::int AS count, coalesce(sum(f.value_numeric), 0)::numeric AS numeric_total
          FROM source_event_facts f
          JOIN source_events e ON e.id = f.source_event_id AND e.client_key = f.client_key
          WHERE f.client_key = $1
            AND coalesce(f.is_stale, false) = false
            AND e.sourcing_motion = 'contract_optimization'
          GROUP BY f.fact_key
          ORDER BY f.fact_key
        `),
      },
      realizedValue: {
        towerClaims: await queryIfExists(client, "tower.value_claim", `
          SELECT claim_state, count(*)::int AS count, coalesce(sum(calculated_value), 0)::numeric AS calculated_value
          FROM tower.value_claim
          WHERE tenant_key = $1
          GROUP BY claim_state
          ORDER BY claim_state
        `),
      },
    };

    const report = {
      event: "source_contract_optimization_evidence_readiness",
      ok: true,
      tenantKey,
      target: redactTarget(url),
      checkedAt: new Date().toISOString(),
      readiness: evaluateReadiness(results),
      results,
    };

    const json = `${JSON.stringify(report, null, 2)}\n`;
    if (outDir) {
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "source-contract-optimization-evidence-readiness.json"), json);
      await fs.writeFile(path.join(outDir, "SHA256SUMS.txt"), `${sha256(json)}  source-contract-optimization-evidence-readiness.json\n`);
    }
    console.log(json);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: "source_contract_optimization_evidence_readiness",
    ok: false,
    tenantKey,
    error: err instanceof Error ? err.message : String(err),
  }, null, 2));
  process.exit(1);
});
