#!/usr/bin/env node
/**
 * Reality-crawl HTML report generator.
 *
 * Turns the captured corpus (out/reality-crawl/<tenant>.jsonl) + any screenshots
 * (out/reality-crawl/shots/<tenant>/<id>.png) into ONE self-contained, auditable
 * HTML page: the conformance pass-rate matrix, every question→answer (expandable,
 * failures highlighted), the typed exhibits each answer returned, the LLM-judge
 * notes on failures, and the signed-in screenshots as visual proof.
 *
 *   node scripts/qa/reality-crawl-report.mjs            # reads out/reality-crawl
 *   OUT_DIR=path/to/corpus node scripts/qa/reality-crawl-report.mjs
 *
 * Writes out/reality-crawl/report.html. Open it; screenshots resolve relative to it.
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT = process.env.OUT_DIR || "out/reality-crawl";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function loadCorpus() {
  const files = (await readdir(OUT)).filter((f) => f.endsWith(".jsonl"));
  const byTenant = {};
  for (const f of files) {
    const tenant = f.replace(/\.jsonl$/, "");
    const lines = (await readFile(path.join(OUT, f), "utf8")).split("\n").filter(Boolean);
    byTenant[tenant] = lines.map((l) => JSON.parse(l));
  }
  return byTenant;
}

function exhibitBadges(ex = {}) {
  return ["table", "chart", "graph"]
    .map((k) => `<span class="bx ${ex[k] ? "on" : "off"}">${k}${ex[k] ? " ✓" : ""}</span>`)
    .join("");
}

function recordRow(r) {
  const cls = r.pass ? "ok" : "bad";
  const shot = r._shot ? `<div class="shot"><img src="${r._shot}" loading="lazy"></div>` : "";
  const judge = r.judge
    ? `<div class="judge">judge — correct ${r.judge.correct}/3 · useful ${r.judge.useful}/3 · honest ${r.judge.honest}/3 · ${esc(r.judge.why)}</div>`
    : "";
  return `<details class="rec ${cls}">
    <summary><span class="mk">${r.pass ? "✅" : "❌"}</span><span class="cat">${esc(r.category)}</span>
      <span class="q">${esc(r.q)}</span>${exhibitBadges(r.exhibits)}<span class="rsn">${esc(r.reason || "")}</span></summary>
    <div class="ans">${esc(r.prose || "(no prose)")}</div>
    <div class="meta">experts: ${esc((r.experts || []).join(", ") || "none")} · citations: ${esc((r.citations || []).join(", ") || "none")} · ${r.latencyMs ?? "?"}ms</div>
    ${judge}${shot}
  </details>`;
}

async function main() {
  if (!(await exists(OUT))) { console.error(`No corpus dir at ${OUT}. Run reality-crawl.mjs first.`); process.exit(1); }
  const corpus = await loadCorpus();
  const tenants = Object.keys(corpus);
  if (!tenants.length) { console.error(`No <tenant>.jsonl in ${OUT}.`); process.exit(1); }
  const cats = [...new Set(Object.values(corpus).flat().map((r) => r.category))];

  // attach screenshot paths if present
  for (const t of tenants) {
    for (const r of corpus[t]) {
      const rel = path.join("shots", t, `${r.id}.png`);
      if (await exists(path.join(OUT, rel))) r._shot = rel;
    }
  }

  const pad = (n, d) => `${n}/${d}`;
  let matrix = `<tr><th>tenant</th>${cats.map((c) => `<th>${c}</th>`).join("")}<th>overall</th></tr>`;
  for (const t of tenants) {
    const rs = corpus[t];
    const cells = cats.map((c) => {
      const cr = rs.filter((r) => r.category === c);
      const p = cr.filter((r) => r.pass).length;
      const pct = cr.length ? p / cr.length : 1;
      const cl = pct === 1 ? "g" : pct === 0 ? "r" : "a";
      return `<td class="${cl}">${pad(p, cr.length)}</td>`;
    });
    const p = rs.filter((r) => r.pass).length;
    matrix += `<tr><th>${esc(t)}</th>${cells.join("")}<td class="${p === rs.length ? "g" : "a"}"><b>${pad(p, rs.length)}</b></td></tr>`;
  }

  const all = Object.values(corpus).flat();
  const fails = all.filter((r) => !r.pass);
  const totalPass = all.filter((r) => r.pass).length;

  const sections = tenants
    .map((t) => `<section><h2>${esc(t)} <span class="sub">${corpus[t].filter((r) => r.pass).length}/${corpus[t].length}</span></h2>${corpus[t].map(recordRow).join("")}</section>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reality crawl — brain proof</title>
<style>
:root{--g:#1f6b3a;--r:#a32d2d;--a:#a66a1f;--line:#e7e3da;--ink:#1a1a18;--muted:#6b6b63}
body{margin:0;font-family:Inter,system-ui,sans-serif;color:var(--ink);background:#fbfaf7;font-size:14px}
.wrap{max-width:1100px;margin:0 auto;padding:32px 28px 80px}
h1{font-family:Georgia,serif;font-weight:500;font-size:30px;margin:0 0 4px}
.lead{color:var(--muted);margin:0 0 24px}
table{border-collapse:collapse;width:100%;margin:0 0 28px;font-size:13px}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:center}th{background:#f4f2ec;text-transform:uppercase;font-size:10px;letter-spacing:.06em;color:var(--muted)}
td.g{background:#eef6e9;color:var(--g);font-weight:600}td.r{background:#fbecec;color:var(--r);font-weight:600}td.a{background:#fbf3e3;color:var(--a);font-weight:600}
h2{font-family:Georgia,serif;font-weight:500;font-size:20px;margin:30px 0 10px;text-transform:capitalize}.sub{font-family:monospace;font-size:13px;color:var(--muted)}
.rec{border:1px solid var(--line);border-radius:8px;margin:6px 0;background:#fff;overflow:hidden}
.rec.bad{border-color:#e7b9b9;background:#fffafa}
summary{cursor:pointer;padding:10px 12px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;list-style:none}
.mk{flex:none}.cat{font-family:monospace;font-size:9.5px;text-transform:uppercase;color:var(--muted);background:#f4f2ec;border-radius:4px;padding:2px 6px}
.q{flex:1;min-width:280px}.rsn{font-family:monospace;font-size:11px;color:var(--r)}
.bx{font-family:monospace;font-size:9px;border:1px solid var(--line);border-radius:10px;padding:1px 6px;color:#bbb}.bx.on{color:var(--g);border-color:var(--g)}
.ans{padding:10px 14px;border-top:1px solid var(--line);white-space:pre-wrap;line-height:1.55;font-size:13.5px}
.meta,.judge{padding:6px 14px;font-family:monospace;font-size:11px;color:var(--muted);border-top:1px solid var(--line)}.judge{color:var(--a)}
.shot{padding:10px 14px;border-top:1px solid var(--line)}.shot img{max-width:100%;border:1px solid var(--line);border-radius:6px}
.kpi{display:flex;gap:24px;margin:0 0 24px}.kpi div{font-family:Georgia,serif}.kpi b{font-size:26px}.kpi span{display:block;font-family:Inter;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
</style></head><body><div class="wrap">
<h1>Reality crawl — does the brain answer?</h1>
<p class="lead">${all.length} answers captured across ${tenants.length} tenants. Every row is a real signed-in response — expand to read it. Failures highlighted.</p>
<div class="kpi"><div><b>${totalPass}/${all.length}</b><span>passed (${Math.round((100 * totalPass) / all.length)}%)</span></div><div><b style="color:var(--r)">${fails.length}</b><span>failures</span></div><div><b>${tenants.length}</b><span>tenants</span></div></div>
<table>${matrix}</table>
${fails.length ? `<h2>Failures (${fails.length})</h2>${fails.map(recordRow).join("")}` : "<h2>No failures 🎉</h2>"}
<h2 style="margin-top:40px">Full corpus</h2>${sections}
</div></body></html>`;

  const dest = path.join(OUT, "report.html");
  await writeFile(dest, html);
  console.log(`Report: ${dest}  (${totalPass}/${all.length} passed; ${fails.length} failures)`);
}

main().catch((e) => { console.error("report error:", e); process.exit(1); });
