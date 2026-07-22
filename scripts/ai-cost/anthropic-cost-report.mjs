#!/usr/bin/env node
/**
 * Anthropic Admin API cost + usage collector.
 *
 * This is the PRODUCT half of AI spend: the actual metered invoice for the
 * `ANTHROPIC_API_KEY` used by Nexus runtime inference (Sentinel, Source, Tower,
 * Home pack generation) and any key-authenticated scripts.
 *
 * Two endpoints, deliberately both:
 *   - /v1/organizations/cost_report          → authoritative billed USD
 *   - /v1/organizations/usage_report/messages → token shape behind that USD
 *
 * The cost report tells you WHAT you were charged. The usage report tells you
 * WHY — uncached input vs cache writes vs cache reads vs output. You cannot
 * diagnose a caching problem from the cost report alone, and you cannot trust
 * a token-derived cost estimate as an invoice. Hence both.
 *
 * Requires an Admin API key (`sk-ant-admin...`, org owner only):
 *   console.anthropic.com → Settings → API keys → Admin keys
 * Export as ANTHROPIC_ADMIN_KEY. A normal `sk-ant-api...` key returns 401 here.
 *
 * Usage:
 *   node scripts/ai-cost/anthropic-cost-report.mjs --days 30
 *   node scripts/ai-cost/anthropic-cost-report.mjs --days 1 --out reports/ai-cost/daily
 *   node scripts/ai-cost/anthropic-cost-report.mjs --days 1 --raw   # dump API shape
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.ANTHROPIC_ADMIN_BASE_URL ?? "https://api.anthropic.com";
const ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY;

function isoDay(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Admin report endpoints paginate with `page` / `next_page` and return
 * `{ data: [{ starting_at, ending_at, results: [...] }], has_more, next_page }`.
 * Follow every page — a 30-day window with several group_by dimensions
 * exceeds one page, and a silent first-page-only read understates spend.
 */
async function fetchAllPages(endpoint, params) {
  const pages = [];
  let page = null;
  for (let guard = 0; guard < 100; guard += 1) {
    const url = new URL(`${BASE}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, v);
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    if (page) url.searchParams.set("page", page);

    const response = await fetch(url, {
      headers: {
        "x-api-key": ADMIN_KEY,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `${endpoint} → HTTP ${response.status}\n${body.slice(0, 800)}`,
      );
    }

    const json = await response.json();
    pages.push(json);
    if (!json.has_more || !json.next_page) break;
    page = json.next_page;
  }
  return pages;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalize the usage report into one row per (day, model, api_key, workspace).
 * Field names are read defensively: the report has gained fields over time
 * (1h vs 5m cache creation split, server tool use), and an older or newer
 * shape should degrade to zeros rather than crash the daily job.
 */
function normalizeUsage(pages) {
  const rows = [];
  for (const page of pages) {
    for (const bucket of page.data ?? []) {
      const day = String(bucket.starting_at ?? "").slice(0, 10);
      for (const r of bucket.results ?? []) {
        const creation = r.cache_creation ?? {};
        rows.push({
          day,
          model: r.model ?? "unknown",
          apiKeyId: r.api_key_id ?? null,
          workspaceId: r.workspace_id ?? null,
          serviceTier: r.service_tier ?? null,
          contextWindow: r.context_window ?? null,
          uncachedInputTokens: num(
            r.uncached_input_tokens ?? r.input_tokens,
          ),
          cacheWrite5mTokens: num(
            creation.ephemeral_5m_input_tokens ??
              r.cache_creation_input_tokens,
          ),
          cacheWrite1hTokens: num(creation.ephemeral_1h_input_tokens),
          cacheReadTokens: num(r.cache_read_input_tokens),
          outputTokens: num(r.output_tokens),
          webSearchRequests: num(
            r.server_tool_use?.web_search_requests ?? r.web_search_requests,
          ),
        });
      }
    }
  }
  return rows;
}

/**
 * Normalize the cost report into one row per (day, workspace, description).
 * `description` is the billing line label (e.g. per-model token type), which
 * is what reconciles against the invoice.
 */
function normalizeCost(pages) {
  const rows = [];
  for (const page of pages) {
    for (const bucket of page.data ?? []) {
      const day = String(bucket.starting_at ?? "").slice(0, 10);
      for (const r of bucket.results ?? []) {
        rows.push({
          day,
          workspaceId: r.workspace_id ?? null,
          description: r.description ?? r.cost_type ?? "unknown",
          model: r.model ?? null,
          tokenType: r.token_type ?? null,
          serviceTier: r.service_tier ?? null,
          currency: r.currency ?? "USD",
          amountUsd: num(r.amount),
        });
      }
    }
  }
  return rows;
}

function rollup(rows, keyFn, valueFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + valueFn(row));
  }
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => b[1] - a[1]),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const days = Number(args[args.indexOf("--days") + 1]) || 30;
  const raw = args.includes("--raw");
  const outIdx = args.indexOf("--out");
  const outDir = outIdx >= 0 ? args[outIdx + 1] : null;

  if (!ADMIN_KEY) {
    console.error(
      "ANTHROPIC_ADMIN_KEY is not set.\n" +
        "Mint one at console.anthropic.com → Settings → API keys → Admin keys\n" +
        "(org owner only; a normal sk-ant-api... key returns 401 on these endpoints).",
    );
    process.exit(2);
  }

  // ending_at is exclusive; +1 day to include today's partial bucket.
  const startingAt = `${isoDay(-days)}T00:00:00Z`;
  const endingAt = `${isoDay(1)}T00:00:00Z`;

  const [usagePages, costPages] = await Promise.all([
    fetchAllPages("/v1/organizations/usage_report/messages", {
      starting_at: startingAt,
      ending_at: endingAt,
      bucket_width: "1d",
      "group_by[]": ["model", "api_key_id", "workspace_id", "service_tier"],
      limit: 1000,
    }),
    fetchAllPages("/v1/organizations/cost_report", {
      starting_at: startingAt,
      ending_at: endingAt,
      bucket_width: "1d",
      "group_by[]": ["workspace_id", "description"],
      limit: 1000,
    }),
  ]);

  if (raw) {
    console.log(
      JSON.stringify(
        { usageFirstPage: usagePages[0], costFirstPage: costPages[0] },
        null,
        2,
      ),
    );
    return;
  }

  const usage = normalizeUsage(usagePages);
  const cost = normalizeCost(costPages);

  const snapshot = {
    source: "anthropic-admin-api",
    generatedAt: new Date().toISOString(),
    windowDays: days,
    startingAt,
    endingAt,
    totals: {
      costUsd: cost.reduce((sum, r) => sum + r.amountUsd, 0),
      uncachedInputTokens: usage.reduce(
        (s, r) => s + r.uncachedInputTokens,
        0,
      ),
      cacheWrite5mTokens: usage.reduce((s, r) => s + r.cacheWrite5mTokens, 0),
      cacheWrite1hTokens: usage.reduce((s, r) => s + r.cacheWrite1hTokens, 0),
      cacheReadTokens: usage.reduce((s, r) => s + r.cacheReadTokens, 0),
      outputTokens: usage.reduce((s, r) => s + r.outputTokens, 0),
    },
    costByDay: rollup(cost, (r) => r.day, (r) => r.amountUsd),
    costByDescription: rollup(cost, (r) => r.description, (r) => r.amountUsd),
    costByWorkspace: rollup(
      cost,
      (r) => r.workspaceId ?? "default",
      (r) => r.amountUsd,
    ),
    outputTokensByModel: rollup(
      usage,
      (r) => r.model,
      (r) => r.outputTokens,
    ),
    cacheReadTokensByModel: rollup(
      usage,
      (r) => r.model,
      (r) => r.cacheReadTokens,
    ),
    outputTokensByApiKey: rollup(
      usage,
      (r) => r.apiKeyId ?? "unattributed",
      (r) => r.outputTokens,
    ),
    usageRows: usage,
    costRows: cost,
  };

  if (outDir) {
    await mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `${isoDay(0)}-anthropic.json`);
    await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.error(`wrote ${file}`);
  }

  process.stdout.write(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
