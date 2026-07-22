#!/usr/bin/env node
/**
 * Claude Code local spend analyzer.
 *
 * Parses ~/.claude/projects/<project>/*.jsonl session transcripts and rolls up
 * token usage into a daily cost ledger by model, session, effort and branch.
 *
 * This is the DEVELOPMENT half of AI spend (Claude Code / agent sessions).
 * The PRODUCT half (Nexus runtime inference through the audited AI egress path)
 * comes from the Anthropic Admin API — see scripts/ai-cost/anthropic-cost-report.mjs.
 *
 * Usage:
 *   node scripts/ai-cost/claude-code-usage.mjs --days 30
 *   node scripts/ai-cost/claude-code-usage.mjs --days 7 --json > out.json
 *
 * Cost figures are NOTIONAL API list price. If Claude Code runs on an OAuth /
 * subscription seat rather than a metered API key, these numbers measure token
 * volume and relative burn, not an invoice line.
 */

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";

// USD per million tokens. Keep in sync with platform.claude.com/docs/en/pricing.
const PRICING = {
  "claude-opus-4-8": { in: 5, out: 25, read: 0.5, write5m: 6.25, write1h: 10 },
  "claude-opus-4-7": { in: 5, out: 25, read: 0.5, write5m: 6.25, write1h: 10 },
  "claude-opus-4-6": { in: 5, out: 25, read: 0.5, write5m: 6.25, write1h: 10 },
  "claude-fable-5": { in: 10, out: 50, read: 1.0, write5m: 12.5, write1h: 20 },
  // Sonnet 5 introductory pricing runs through 2026-08-31 ($2/$10).
  "claude-sonnet-5": { in: 2, out: 10, read: 0.2, write5m: 2.5, write1h: 4 },
  "claude-sonnet-4-6": { in: 3, out: 15, read: 0.3, write5m: 3.75, write1h: 6 },
  "claude-haiku-4-5": { in: 1, out: 5, read: 0.1, write5m: 1.25, write1h: 2 },
};
const FALLBACK_PRICE = PRICING["claude-opus-4-8"];

function priceFor(model) {
  if (!model) return FALLBACK_PRICE;
  if (PRICING[model]) return PRICING[model];
  const key = Object.keys(PRICING).find((k) => model.startsWith(k));
  return key ? PRICING[key] : FALLBACK_PRICE;
}

function emptyBucket() {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    webSearches: 0,
    webFetches: 0,
    costUsd: 0,
  };
}

function addUsage(bucket, usage, model) {
  const p = priceFor(model);
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  const create = usage.cache_creation ?? {};
  // Older records only carry the flat cache_creation_input_tokens total.
  const totalWrite = usage.cache_creation_input_tokens ?? 0;
  const w1h = create.ephemeral_1h_input_tokens ?? 0;
  const w5m = create.ephemeral_5m_input_tokens ?? Math.max(0, totalWrite - w1h);

  bucket.calls += 1;
  bucket.inputTokens += input;
  bucket.outputTokens += output;
  bucket.cacheReadTokens += read;
  bucket.cacheWrite5mTokens += w5m;
  bucket.cacheWrite1hTokens += w1h;
  bucket.webSearches += usage.server_tool_use?.web_search_requests ?? 0;
  bucket.webFetches += usage.server_tool_use?.web_fetch_requests ?? 0;
  bucket.costUsd +=
    (input * p.in +
      output * p.out +
      read * p.read +
      w5m * p.write5m +
      w1h * p.write1h) /
    1_000_000;
}

function bucketOf(map, key) {
  let b = map.get(key);
  if (!b) {
    b = emptyBucket();
    map.set(key, b);
  }
  return b;
}

async function scanFile(file, since, acc, seenMessageIds) {
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line || line.charCodeAt(0) !== 123 /* { */) continue;
    // Cheap prefilter: skip lines that cannot carry assistant usage.
    if (!line.includes('"usage"')) continue;

    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec.type !== "assistant") continue;
    const usage = rec.message?.usage;
    if (!usage) continue;
    if (!rec.timestamp) continue;
    const day = rec.timestamp.slice(0, 10);
    if (day < since) continue;

    // CRITICAL: transcripts are not disjoint. Resuming or forking a session
    // copies prior history into the new session file, so one billed API call
    // can appear in many .jsonl files — measured at 53.8% duplicate records
    // over a 30-day window, with single messages repeated up to 14 times.
    // Counting every copy roughly doubles the total. Deduplicate on the
    // server-assigned message id, which is stable across copies.
    const messageId = rec.message?.id ?? rec.requestId;
    if (messageId) {
      if (seenMessageIds.has(messageId)) {
        acc.duplicatesSkipped += 1;
        continue;
      }
      seenMessageIds.add(messageId);
    }

    const model = rec.message?.model ?? "unknown";
    const sidechain = rec.isSidechain === true;

    addUsage(acc.total, usage, model);
    addUsage(bucketOf(acc.byDay, day), usage, model);
    addUsage(bucketOf(acc.byModel, model), usage, model);
    addUsage(bucketOf(acc.byEffort, rec.effort ?? "unset"), usage, model);
    addUsage(
      bucketOf(acc.byEntrypoint, rec.entrypoint ?? "unknown"),
      usage,
      model,
    );
    addUsage(bucketOf(acc.byBranch, rec.gitBranch ?? "unknown"), usage, model);
    addUsage(
      bucketOf(acc.byLane, sidechain ? "subagent" : "main-loop"),
      usage,
      model,
    );
    addUsage(
      bucketOf(acc.bySession, `${day}|${rec.sessionId ?? path.basename(file)}`),
      usage,
      model,
    );
    addUsage(bucketOf(acc.byDayModel, `${day}|${model}`), usage, model);
  }
}

function usd(n) {
  return `$${n.toFixed(2)}`;
}

function tok(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function pct(part, whole) {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%";
}

function table(title, rows, totalCost) {
  const lines = [`\n${title}`, "-".repeat(title.length)];
  const w = Math.max(...rows.map(([k]) => k.length), 12);
  lines.push(
    `${"key".padEnd(w)}  ${"cost".padStart(10)}  ${"share".padStart(7)}  ${"calls".padStart(7)}  ${"out tok".padStart(8)}  ${"cache rd".padStart(9)}  ${"cache wr".padStart(9)}`,
  );
  for (const [key, b] of rows) {
    lines.push(
      `${key.padEnd(w)}  ${usd(b.costUsd).padStart(10)}  ${pct(b.costUsd, totalCost).padStart(7)}  ${String(b.calls).padStart(7)}  ${tok(b.outputTokens).padStart(8)}  ${tok(b.cacheReadTokens).padStart(9)}  ${tok(b.cacheWrite5mTokens + b.cacheWrite1hTokens).padStart(9)}`,
    );
  }
  return lines.join("\n");
}

function sorted(map, limit) {
  const rows = [...map.entries()].sort((a, b) => b[1].costUsd - a[1].costUsd);
  return limit ? rows.slice(0, limit) : rows;
}

async function main() {
  const args = process.argv.slice(2);
  const days = Number(args[args.indexOf("--days") + 1]) || 30;
  const asJson = args.includes("--json");
  const projectsRoot = path.join(homedir(), ".claude", "projects");

  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const acc = {
    total: emptyBucket(),
    byDay: new Map(),
    byModel: new Map(),
    byEffort: new Map(),
    byEntrypoint: new Map(),
    byBranch: new Map(),
    byLane: new Map(),
    bySession: new Map(),
    byDayModel: new Map(),
    duplicatesSkipped: 0,
  };

  const seenMessageIds = new Set();
  const projects = await readdir(projectsRoot);

  // Gather candidates first, then scan OLDEST file first. With dedup on, the
  // first occurrence of a message wins — and the oldest file is the session
  // where the call was actually made, rather than a later session that merely
  // inherited the history. Day attribution is unaffected either way (it comes
  // from the record's own timestamp), but session and branch attribution are
  // only correct in this order.
  const candidates = [];
  for (const project of projects) {
    const dir = path.join(projectsRoot, project);
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".jsonl")) continue;
      const file = path.join(dir, entry);
      const st = await stat(file);
      // Sessions are append-only; if the file was last touched before the
      // window it cannot contain in-window records.
      if (st.mtime.toISOString().slice(0, 10) < since) continue;
      candidates.push({ file, mtimeMs: st.mtimeMs, size: st.size });
    }
  }
  candidates.sort((a, b) => a.mtimeMs - b.mtimeMs);

  let files = 0;
  let bytes = 0;
  for (const candidate of candidates) {
    files += 1;
    bytes += candidate.size;
    await scanFile(candidate.file, since, acc, seenMessageIds);
  }

  if (asJson) {
    const out = {
      windowDays: days,
      since,
      filesScanned: files,
      duplicatesSkipped: acc.duplicatesSkipped,
      bytesScanned: bytes,
      total: acc.total,
      byDay: Object.fromEntries(acc.byDay),
      byModel: Object.fromEntries(acc.byModel),
      byEffort: Object.fromEntries(acc.byEffort),
      byEntrypoint: Object.fromEntries(acc.byEntrypoint),
      byLane: Object.fromEntries(acc.byLane),
      byBranch: Object.fromEntries(sorted(acc.byBranch, 20)),
      topSessions: Object.fromEntries(sorted(acc.bySession, 25)),
      byDayModel: Object.fromEntries(acc.byDayModel),
    };
    process.stdout.write(JSON.stringify(out, null, 2));
    return;
  }

  const t = acc.total;
  const totalInputSide =
    t.inputTokens + t.cacheReadTokens + t.cacheWrite5mTokens + t.cacheWrite1hTokens;

  console.log(`Claude Code local usage — last ${days} days (since ${since})`);
  console.log(
    `Scanned ${files} session files (${(bytes / 1e9).toFixed(2)} GB) under ~/.claude/projects`,
  );
  console.log(
    `Deduplicated ${acc.duplicatesSkipped.toLocaleString()} copied-forward records ` +
      `(${pct(acc.duplicatesSkipped, acc.duplicatesSkipped + t.calls)} of all records seen); ` +
      `${t.calls.toLocaleString()} unique API calls counted.`,
  );
  console.log(`\nNOTIONAL COST AT API LIST PRICE: ${usd(t.costUsd)}`);
  console.log(`  model calls          ${t.calls.toLocaleString()}`);
  console.log(
    `  uncached input       ${tok(t.inputTokens).padStart(8)}  (${pct(t.inputTokens, totalInputSide)} of input side)`,
  );
  console.log(
    `  cache reads          ${tok(t.cacheReadTokens).padStart(8)}  (${pct(t.cacheReadTokens, totalInputSide)})`,
  );
  console.log(`  cache writes 5m      ${tok(t.cacheWrite5mTokens).padStart(8)}`);
  console.log(`  cache writes 1h      ${tok(t.cacheWrite1hTokens).padStart(8)}`);
  console.log(`  output               ${tok(t.outputTokens).padStart(8)}`);
  console.log(
    `  web search / fetch   ${t.webSearches} / ${t.webFetches}`,
  );

  const p = priceFor("claude-opus-4-8");
  const costIfUncached =
    ((t.cacheReadTokens + t.cacheWrite5mTokens + t.cacheWrite1hTokens) * p.in) /
    1_000_000;
  const costOfCache =
    (t.cacheReadTokens * p.read +
      t.cacheWrite5mTokens * p.write5m +
      t.cacheWrite1hTokens * p.write1h) /
    1_000_000;
  console.log(
    `\n  cache saved ~${usd(costIfUncached - costOfCache)} vs. sending the same prefix uncached`,
  );

  console.log(table("BY MODEL", sorted(acc.byModel), t.costUsd));
  console.log(table("BY LANE", sorted(acc.byLane), t.costUsd));
  console.log(table("BY EFFORT", sorted(acc.byEffort), t.costUsd));
  console.log(table("BY ENTRYPOINT", sorted(acc.byEntrypoint), t.costUsd));
  console.log(table("BY DAY", [...acc.byDay.entries()].sort(), t.costUsd));
  console.log(table("TOP 15 BRANCHES", sorted(acc.byBranch, 15), t.costUsd));
  console.log(
    table("TOP 15 SESSIONS (day|sessionId)", sorted(acc.bySession, 15), t.costUsd),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
