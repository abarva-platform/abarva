#!/usr/bin/env node
/**
 * Daily AI spend digest — render + send.
 *
 * Consumes the JSON snapshots produced by:
 *   - anthropic-cost-report.mjs  (product runtime, billed USD from Admin API)
 *   - claude-code-usage.mjs --json  (agent development, notional at list price)
 *
 * Either input may be absent; the digest renders the half it has and says so
 * rather than implying a total it cannot compute. The two are DIFFERENT METERS
 * (metered API key vs OAuth seat) and are never summed into one number.
 *
 * Email goes out via the Resend HTTP API directly rather than through
 * src/lib/notifications/** — that spine is tenant-scoped, Clerk-addressed and
 * `server-only`; this is a single-recipient ops digest that must run from a
 * plain node process in CI.
 *
 * Usage:
 *   node scripts/ai-cost/render-digest.mjs \
 *     --anthropic reports/ai-cost/daily/2026-07-22-anthropic.json \
 *     --claude-code reports/ai-cost/daily/2026-07-22-claude-code.json \
 *     --out reports/ai-cost/daily/2026-07-22-digest.html \
 *     --send
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BRAND = {
  bg: "#F8F7F4",
  ink: "#1A1A1A",
  muted: "#6B6B6B",
  rule: "#E2DFD8",
  up: "#B4472B",
  down: "#2F6B4F",
};

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}

async function readJson(file) {
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function usd(n) {
  return `$${(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function tok(n) {
  const v = n ?? 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

/** Yesterday vs the mean of the 7 days before it. */
function trend(byDay, day) {
  const days = Object.keys(byDay).sort();
  const idx = days.indexOf(day);
  if (idx < 1) return null;
  const priorDays = days.slice(Math.max(0, idx - 7), idx);
  if (priorDays.length === 0) return null;
  const mean =
    priorDays.reduce((s, d) => s + byDay[d], 0) / priorDays.length;
  if (mean === 0) return null;
  return { mean, deltaPct: ((byDay[day] - mean) / mean) * 100 };
}

/**
 * Inline SVG bar chart. Email clients block external images and most strip
 * <img> with remote src, but inline SVG renders in Apple Mail and most modern
 * webmail. The table below it carries the same numbers, so a client that
 * strips SVG entirely still delivers the full signal.
 */
function sparkChart(byDay, label) {
  const days = Object.keys(byDay).sort().slice(-30);
  if (days.length < 2) return "";
  const values = days.map((d) => byDay[d]);
  const max = Math.max(...values);
  if (max <= 0) return "";

  const W = 560;
  const H = 130;
  const pad = 20;
  const barW = (W - pad * 2) / days.length;

  const bars = days
    .map((d, i) => {
      const h = Math.max(1, ((byDay[d] / max) * (H - pad * 2)) | 0);
      const x = pad + i * barW;
      const y = H - pad - h;
      return `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(1, barW - 2).toFixed(1)}" height="${h}" fill="${BRAND.ink}" opacity="${i === days.length - 1 ? "1" : "0.42"}"><title>${esc(d)}: ${usd(byDay[d])}</title></rect>`;
    })
    .join("");

  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">
    <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="${BRAND.rule}" stroke-width="1"/>
    ${bars}
    <text x="${pad}" y="14" font-family="Georgia,serif" font-size="11" fill="${BRAND.muted}">${esc(label)} — peak ${esc(usd(max))}</text>
    <text x="${pad}" y="${H - 6}" font-family="Georgia,serif" font-size="10" fill="${BRAND.muted}">${esc(days[0])}</text>
    <text x="${W - pad}" y="${H - 6}" text-anchor="end" font-family="Georgia,serif" font-size="10" fill="${BRAND.muted}">${esc(days[days.length - 1])}</text>
  </svg>`;
}

function table(headers, rows) {
  if (rows.length === 0) {
    return `<p style="color:${BRAND.muted};font-size:13px;margin:8px 0 0">No rows.</p>`;
  }
  const th = headers
    .map(
      (h, i) =>
        `<th style="text-align:${i === 0 ? "left" : "right"};padding:6px 10px;border-bottom:1px solid ${BRAND.rule};font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};font-weight:600">${esc(h)}</th>`,
    )
    .join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c, i) =>
              `<td style="text-align:${i === 0 ? "left" : "right"};padding:7px 10px;border-bottom:1px solid ${BRAND.rule};font-size:13px;color:${BRAND.ink};${i === 0 ? "" : "font-variant-numeric:tabular-nums;"}">${esc(c)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:10px 0 0"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function section(title, note, body) {
  return `
  <div style="margin:30px 0 0">
    <h2 style="font-family:Georgia,serif;font-size:17px;font-weight:normal;color:${BRAND.ink};margin:0">${esc(title)}</h2>
    ${note ? `<p style="color:${BRAND.muted};font-size:12px;margin:4px 0 0;line-height:1.5">${esc(note)}</p>` : ""}
    ${body}
  </div>`;
}

function topN(obj, n) {
  return Object.entries(obj ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function renderAnthropic(snap, day) {
  if (!snap) {
    return section(
      "Product runtime — Anthropic API",
      "No snapshot. ANTHROPIC_ADMIN_KEY is unset or the Admin API call failed; this is the metered invoice half and is currently unmeasured.",
      "",
    );
  }

  const byDay = snap.costByDay ?? {};
  const today = byDay[day] ?? 0;
  const t = trend(byDay, day);
  const total = snap.totals?.billedCostUsd ?? snap.totals?.costUsd ?? 0;

  const trendLine = t
    ? `<span style="color:${t.deltaPct >= 0 ? BRAND.up : BRAND.down};font-size:13px">${t.deltaPct >= 0 ? "▲" : "▼"} ${Math.abs(t.deltaPct).toFixed(0)}% vs 7-day avg ${usd(t.mean)}</span>`
    : "";

  const inputSide =
    (snap.totals?.uncachedInputTokens ?? 0) +
    (snap.totals?.cacheReadTokens ?? 0) +
    (snap.totals?.cacheWrite5mTokens ?? 0) +
    (snap.totals?.cacheWrite1hTokens ?? 0);
  const cacheRatio =
    inputSide > 0
      ? ((snap.totals.cacheReadTokens / inputSide) * 100).toFixed(1)
      : "0.0";

  return `
  ${section(
    "Product runtime — Anthropic API",
    `Metered spend on ANTHROPIC_API_KEY: Nexus inference (Sentinel, Source, Tower, Home generation) and key-authenticated jobs. Billed USD from the Admin API cost report. ${snap.windowDays}-day window.`,
    `
    <p style="margin:14px 0 0;font-family:Georgia,serif;font-size:30px;color:${BRAND.ink};line-height:1.1">${esc(usd(today))} <span style="font-size:13px;color:${BRAND.muted};font-family:-apple-system,sans-serif">on ${esc(day)}</span></p>
    <p style="margin:5px 0 0">${trendLine}</p>
    <p style="margin:9px 0 0;color:${BRAND.muted};font-size:13px">${esc(usd(total))} across the ${snap.windowDays}-day window &nbsp;·&nbsp; cache reads are ${cacheRatio}% of the input side</p>
    ${sparkChart(byDay, "Billed USD per day")}
    `,
  )}
  ${section(
    "Where it was billed",
    "Cost report lines — this is what reconciles against the invoice.",
    table(
      ["Line", "USD"],
      topN(snap.costByDescription, 10).map(([k, v]) => [k, usd(v)]),
    ),
  )}
  ${section(
    "Token shape",
    "Why the invoice looks the way it does. Output is the expensive side; cache reads are the volume side.",
    table(
      ["Token class", "Tokens"],
      [
        ["Uncached input", tok(snap.totals?.uncachedInputTokens)],
        ["Cache write 5m", tok(snap.totals?.cacheWrite5mTokens)],
        ["Cache write 1h", tok(snap.totals?.cacheWrite1hTokens)],
        ["Cache read", tok(snap.totals?.cacheReadTokens)],
        ["Output", tok(snap.totals?.outputTokens)],
      ],
    ),
  )}
  ${section(
    "Output tokens by model",
    "Frontier models doing routine work show up here first.",
    table(
      ["Model", "Output tokens"],
      topN(snap.outputTokensByModel, 8).map(([k, v]) => [k, tok(v)]),
    ),
  )}
  ${section(
    "Output tokens by API key",
    "Attribution is only as good as your key separation. 'unattributed' means one key is doing several jobs.",
    table(
      ["API key", "Output tokens"],
      topN(snap.outputTokensByApiKey, 8).map(([k, v]) => [k, tok(v)]),
    ),
  )}`;
}

function renderClaudeCode(snap, day) {
  if (!snap) {
    return section(
      "Agent development — Claude Code",
      "No snapshot in this run. Collected on the workstation only (~/.claude/projects does not exist on a CI runner).",
      "",
    );
  }

  const byDay = Object.fromEntries(
    Object.entries(snap.byDay ?? {}).map(([d, b]) => [d, b.costUsd]),
  );
  const today = byDay[day] ?? 0;
  const t = trend(byDay, day);
  const trendLine = t
    ? `<span style="color:${t.deltaPct >= 0 ? BRAND.up : BRAND.down};font-size:13px">${t.deltaPct >= 0 ? "▲" : "▼"} ${Math.abs(t.deltaPct).toFixed(0)}% vs 7-day avg ${usd(t.mean)}</span>`
    : "";

  const tot = snap.total ?? {};
  const inputSide =
    (tot.inputTokens ?? 0) +
    (tot.cacheReadTokens ?? 0) +
    (tot.cacheWrite5mTokens ?? 0) +
    (tot.cacheWrite1hTokens ?? 0);
  const cacheRatio =
    inputSide > 0
      ? ((tot.cacheReadTokens / inputSide) * 100).toFixed(1)
      : "0.0";

  return `
  ${section(
    "Agent development — Claude Code",
    "NOTIONAL at API list price, not an invoice. Claude Code authenticates via OAuth seat, so these tokens are not billed per-token. Track it for volume and relative burn, and to catch a session that ran away.",
    `
    <p style="margin:14px 0 0;font-family:Georgia,serif;font-size:30px;color:${BRAND.ink};line-height:1.1">${esc(usd(today))} <span style="font-size:13px;color:${BRAND.muted};font-family:-apple-system,sans-serif">notional on ${esc(day)}</span></p>
    <p style="margin:5px 0 0">${trendLine}</p>
    <p style="margin:9px 0 0;color:${BRAND.muted};font-size:13px">${esc(usd(tot.costUsd))} across ${snap.windowDays} days &nbsp;·&nbsp; ${(tot.calls ?? 0).toLocaleString()} calls &nbsp;·&nbsp; cache reads ${cacheRatio}% of input side</p>
    ${sparkChart(byDay, "Notional USD per day")}
    `,
  )}
  ${section(
    "By model",
    "",
    table(
      ["Model", "USD", "Output", "Cache read"],
      Object.entries(snap.byModel ?? {})
        .sort((a, b) => b[1].costUsd - a[1].costUsd)
        .slice(0, 6)
        .map(([k, b]) => [
          k,
          usd(b.costUsd),
          tok(b.outputTokens),
          tok(b.cacheReadTokens),
        ]),
    ),
  )}
  ${section(
    "Top sessions",
    "A single session above ~$300 notional in a day is a long-context run worth splitting.",
    table(
      ["Day | session", "USD", "Calls"],
      Object.entries(snap.topSessions ?? {})
        .slice(0, 8)
        .map(([k, b]) => [k, usd(b.costUsd), String(b.calls)]),
    ),
  )}`;
}

function renderEmail({ anthropic, claudeCode, day }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI spend — ${esc(day)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg}">
<div style="max-width:640px;margin:0 auto;padding:32px 22px 48px;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink}">

  <h1 style="font-family:Georgia,serif;font-size:23px;font-weight:normal;margin:0">AI spend — ${esc(day)}</h1>
  <p style="color:${BRAND.muted};font-size:13px;margin:6px 0 0;line-height:1.55">
    Two meters, reported separately and never summed: the metered Anthropic API key that carries Nexus product inference, and the OAuth seat that carries Claude Code development.
  </p>
  <hr style="border:0;border-top:1px solid ${BRAND.rule};margin:22px 0 0">

  ${renderAnthropic(anthropic, day)}
  <hr style="border:0;border-top:1px solid ${BRAND.rule};margin:34px 0 0">
  ${renderClaudeCode(claudeCode, day)}

  <hr style="border:0;border-top:1px solid ${BRAND.rule};margin:34px 0 0">
  <p style="color:${BRAND.muted};font-size:11px;line-height:1.6;margin:16px 0 0">
    Generated by scripts/ai-cost/render-digest.mjs. Claude Code figures are notional at list price and do not appear on any invoice.
    Anthropic API figures are billed USD from the Admin API cost report.
    Reproduce locally: <code>node scripts/ai-cost/claude-code-usage.mjs --days 7</code>
  </p>
</div></body></html>`;
}

async function send(html, day) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.AI_COST_DIGEST_TO;
  const from = process.env.AI_COST_DIGEST_FROM;

  if (!key || !to || !from) {
    console.error(
      "Send skipped — need RESEND_API_KEY, AI_COST_DIGEST_TO, AI_COST_DIGEST_FROM.",
    );
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()),
      subject: `AI spend — ${day}`,
      html,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Resend HTTP ${response.status}: ${body.slice(0, 400)}`);
  }
  console.error(`sent: ${body.slice(0, 200)}`);
  return true;
}

async function main() {
  const day =
    arg("day") ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const anthropic = await readJson(arg("anthropic"));
  const claudeCode = await readJson(arg("claude-code"));

  if (!anthropic && !claudeCode) {
    console.error("No input snapshots readable — nothing to render.");
    process.exit(1);
  }

  const html = renderEmail({ anthropic, claudeCode, day });

  const out = arg("out");
  if (out) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, html);
    console.error(`wrote ${out}`);
  }

  if (process.argv.includes("--send")) {
    await send(html, day);
  } else if (!out) {
    process.stdout.write(html);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
