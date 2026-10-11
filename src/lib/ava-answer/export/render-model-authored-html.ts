import type { AvaChatSessionExport } from "./session-types";
import {
  chartPlot,
  graphPlot,
  matrixQuadrants,
} from "@/lib/intelligence/answer/model-exhibit-layout";
import type { AvaArtifact } from "../contract";

const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function exhibit(a: AvaArtifact): string {
  let body: string;
  if (a.artifact === "table") {
    body = `<table><thead><tr>${a.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${a.rows.map((r) => `<tr>${a.columns.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table><p>${esc(a.note)}</p>`;
  } else if (a.artifact === "chart") {
    if (a.kind === "quadrant-matrix") {
      body = `<p>${esc(a.subtitle)}</p><div class="matrix">${matrixQuadrants(a).map((q) => `<section><h4>${esc(a.xKey)}: ${q.x} · ${esc(a.yKey)}: ${q.y}</h4><ul>${q.rows.map((row) => `<li><strong>${esc(row.label)}</strong>${Object.entries(row).filter(([key]) => !["label", a.xKey!, a.yKey!].includes(key)).map(([key, value]) => `<p>${esc(key)}: ${esc(value)}</p>`).join("")}</li>`).join("")}</ul></section>`).join("")}</div><p>${esc(a.sourceNote)}</p>`;
      return `<section class="exhibit"><h3>${esc(a.title)}</h3>${body}</section>`;
    }
    const p = chartPlot(a);
    body = `<p>${esc(a.subtitle)}</p><svg viewBox="0 0 500 210" role="img" aria-label="${esc(a.title)}"><line x1="${p.horizontal ? p.baselineX : 30}" x2="${p.horizontal ? p.baselineX : 470}" y1="${p.horizontal ? 10 : p.baseline}" y2="${p.horizontal ? 200 : p.baseline}" stroke="#aaa"/>${a.kind === "line" ? `<polyline points="${p.points.map((v) => `${v.x},${v.y}`).join(" ")}" fill="none" stroke="#166534" stroke-width="2"/>` : ""}${p.points.map((v, i) => `${a.kind === "line" ? `<circle cx="${v.x}" cy="${v.y}" r="4" fill="#166534"/>` : `<rect x="${p.horizontal ? Math.min(v.x, p.baselineX) : v.x - 12}" y="${p.horizontal ? v.y - 7 : Math.min(v.y, p.baseline)}" width="${p.horizontal ? Math.abs(v.x - p.baselineX) : 24}" height="${p.horizontal ? 14 : Math.abs(v.y - p.baseline)}" fill="#166534"/>`}<text x="${p.horizontal ? 18 : v.x}" y="${p.horizontal ? v.y + 3 : 193}" text-anchor="middle">${i + 1}</text>`).join("")}</svg><p>${esc(a.unit)}</p><ol>${p.points.map((v) => `<li>${esc(v.label)}: ${esc(v.value)}</li>`).join("")}</ol><p>${esc(a.sourceNote)}</p>`;
  } else {
    const p = graphPlot(a);
    body = `<svg viewBox="0 0 500 250" role="img" aria-label="${esc(a.title)}">${p.edges.map((e) => `<line x1="${e.fromNode.x}" y1="${e.fromNode.y}" x2="${e.toNode.x}" y2="${e.toNode.y}" stroke="#78716c"/>`).join("")}${p.nodes.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="16" fill="#dcfce7" stroke="#166534"/><text x="${n.x}" y="${n.y + 4}" text-anchor="middle">${n.index}</text>`).join("")}</svg><ol>${p.nodes.map((n) => `<li>${esc(n.label)}</li>`).join("")}</ol><ul>${p.edges.map((e) => `<li>${esc(e.fromNode.label)} → ${esc(e.toNode.label)}${e.label ? `: ${esc(e.label)}` : ""}</li>`).join("")}</ul>`;
  }
  return `<section class="exhibit"><h3>${esc(a.title)}</h3>${body}</section>`;
}

/** Escape content for safe display; never apply language or claim rewriting. */
export function renderModelAuthoredSessionHtml(
  session: AvaChatSessionExport,
): string {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(session.title)}</title><style>body{max-width:850px;margin:40px auto;padding:24px;color:#17281e;font:15px/1.6 system-ui}section{margin:24px 0}.prose,pre{white-space:pre-wrap;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #ddd;padding:8px}.exhibit{border:1px solid #ddd;border-radius:8px;padding:18px}svg{width:100%;max-height:280px;font:10px sans-serif}pre{font-size:12px}.matrix{display:grid;grid-template-columns:1fr 1fr;gap:8px}.matrix section{margin:0;padding:12px;border:1px solid #a7cdb2;background:#f0f7f2}</style><body><h1>${esc(session.title ?? "Intelligence review")}</h1>${session.turns.map((t) => `<section><h2>${t.role === "user" ? "Question" : "Claude response"}</h2><div class="prose">${esc(t.body)}</div>${t.answer?.artifacts.map(exhibit).join("") ?? ""}${t.answer ? `<h3>Sources</h3><ul>${t.answer.citations.map((c) => `<li>${c.url ? `<a href="${esc(c.url)}">${esc(c.label)}</a>` : esc(c.label)}</li>`).join("")}</ul><h3>Follow-up questions</h3><ul>${t.answer.nextSteps.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ul>` : ""}${t.answer?.modelAuthored ? `<details><summary>Original model response</summary><pre>${esc(t.answer.modelAuthored.rawText)}</pre></details>` : ""}</section>`).join("")}</body></html>`;
}
