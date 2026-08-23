// Deliverable Quality Transformation — HTML architecture renderer (W2)
//
// Renders an ArchitectureModel into a premium, self-contained, executive-grade
// HTML architecture readout. Cloud-AGNOSTIC: it draws whatever providers/services
// the model carries. Honours the hard requirements:
//   - current-to-target journey (as-is and to-be physical architecture)
//   - data flow rendered DISTINCT from the AI decision/control flow
//   - the agentic overlay (how services come alive)
//   - human-in-the-loop control points
//   - implementation waves
//   - every exhibit carries a business-implication caption
//
// Design system (locked): #F8F7F4 canvas, Georgia headings, DM Sans body,
// restrained high-end consulting look — not a SaaS landing page.

import {
  ARCH_LAYER_LABELS,
  ARCH_LAYER_ORDER,
  ARCHITECTURE_V2_EXHIBITS,
  type AgentBinding,
  type ArchitectureExhibitKey,
  type ArchitectureLevelModel,
  type ArchFlow,
  type ArchFlowKind,
  type ArchLayer,
  type ArchNode,
  type ArchitectureModel,
  type ArchitectureStateModel,
} from "./architecture-model";

/** The exhibits the architecture renderer always produces from a model. */
export const ARCHITECTURE_RENDERED_EXHIBITS = [
  "current_state_architecture",
  "target_state_architecture",
  "data_flow",
  "ai_decision_flow",
  "agentic_overlay",
  "integration_pattern",
  "control_points",
  "implementation_waves",
] as const;

export interface ArchitectureContractSignals {
  hasStorySpine: boolean;
  currentStateVisualPresent: boolean;
  gapToTargetBridgePresent: boolean;
  conceptualArchPresent: boolean;
  logicalArchPresent: boolean;
  physicalArchPresent: boolean;
  exhibitsRenderedAsVisual: boolean;
  exhibitsInterpreted: boolean;
}

function esc(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PROVIDER_LABEL: Record<string, string> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
  on_prem: "On-prem",
  saas: "SaaS",
  hybrid: "Hybrid",
  other: "",
};

const STATUS_LABEL: Record<string, string> = {
  existing: "Existing",
  new: "New",
  changed: "Changed",
  retired: "Retiring",
};

const FLOW_LABEL: Record<ArchFlowKind, string> = {
  data: "Data",
  control: "AI control",
  event: "Event",
  human_approval: "Human approval",
};

function nodeCard(n: ArchNode): string {
  const provider =
    n.provider && PROVIDER_LABEL[n.provider]
      ? `<span class="badge prov prov-${n.provider}">${esc(PROVIDER_LABEL[n.provider])}</span>`
      : "";
  const status = n.status
    ? `<span class="badge st st-${n.status}">${esc(STATUS_LABEL[n.status])}</span>`
    : "";
  const service = n.service ? `<div class="svc">${esc(n.service)}</div>` : "";
  const note = n.note ? `<div class="note">${esc(n.note)}</div>` : "";
  return `<div class="node k-${n.kind}">
    <div class="node-h"><span class="node-label">${esc(n.label)}</span>${provider}${status}</div>
    ${service}${note}
  </div>`;
}

function layerBand(state: ArchitectureStateModel, layer: ArchLayer): string {
  const nodes = state.nodes.filter((n) => n.layer === layer);
  if (!nodes.length) return "";
  return `<div class="band">
    <div class="band-label">${esc(ARCH_LAYER_LABELS[layer])}</div>
    <div class="band-nodes">${nodes.map(nodeCard).join("")}</div>
  </div>`;
}

function stateMap(state: ArchitectureStateModel): string {
  const bands = ARCH_LAYER_ORDER.map((l) => layerBand(state, l)).join("");
  return `<div class="statemap">${bands}</div>`;
}

function levelState(level: ArchitectureLevelModel): ArchitectureStateModel {
  return {
    title: level.title,
    thesis: level.thesis,
    nodes: level.nodes,
    flows: level.flows,
  };
}

function nodeLabelMap(model: ArchitectureModel): Record<string, string> {
  const m: Record<string, string> = {};
  for (const n of [...model.current.nodes, ...model.target.nodes])
    m[n.id] = n.label;
  return m;
}

function flowList(
  flows: ArchFlow[],
  labels: Record<string, string>,
  kinds: ArchFlowKind[],
): string {
  const rows = flows
    .filter((f) => kinds.includes(f.kind))
    .map((f) => {
      const from = esc(labels[f.from] ?? f.from);
      const to = esc(labels[f.to] ?? f.to);
      const lbl = f.label ? `<span class="flbl">${esc(f.label)}</span>` : "";
      const note = f.note ? `<div class="note">${esc(f.note)}</div>` : "";
      return `<div class="flow k-${f.kind}">
        <div class="flow-line"><span class="tile">${from}</span><span class="arrow" data-k="${f.kind}">→</span><span class="tile">${to}</span>${lbl}<span class="badge fk fk-${f.kind}">${esc(FLOW_LABEL[f.kind])}</span></div>
        ${note}
      </div>`;
    })
    .join("");
  return (
    rows ||
    `<p class="empty">No ${kinds.map((k) => FLOW_LABEL[k]).join("/")} flows modelled.</p>`
  );
}

function agenticOverlay(
  model: ArchitectureModel,
  labels: Record<string, string>,
): string {
  if (!model.agentic.length)
    return `<p class="empty">No agentic bindings modelled.</p>`;
  const cards = model.agentic
    .map((b: AgentBinding) => {
      const name = esc(labels[b.agentId] ?? b.agentId);
      const tools = b.callsTools
        .map((t) => `<span class="chip">${esc(labels[t] ?? t)}</span>`)
        .join("");
      const ground = (b.grounding ?? [])
        .map((g) => `<span class="chip ground">${esc(labels[g] ?? g)}</span>`)
        .join("");
      const guards = (b.guardrails ?? [])
        .map((g) => `<span class="chip guard">${esc(labels[g] ?? g)}</span>`)
        .join("");
      const hil = b.humanInLoop
        ? `<div class="hil">Human-in-the-loop: ${esc(b.humanInLoop)}</div>`
        : "";
      return `<div class="agent">
        <div class="agent-h"><span class="dot"></span><strong>${name}</strong><span class="role">${esc(b.role)}</span></div>
        ${tools ? `<div class="line"><span class="lk">Calls</span>${tools}</div>` : ""}
        ${ground ? `<div class="line"><span class="lk">Grounds on</span>${ground}</div>` : ""}
        ${guards ? `<div class="line"><span class="lk">Guarded by</span>${guards}</div>` : ""}
        ${hil}
      </div>`;
    })
    .join("");
  return `<div class="agents">${cards}</div>`;
}

function section(
  id: string,
  num: number,
  title: string,
  caption: string,
  body: string,
): string {
  return `<section id="${id}">
    <div class="sec-h"><span class="num">${num}</span><h2>${esc(title)}</h2></div>
    <p class="caption">${esc(caption)}</p>
    ${body}
  </section>`;
}

function exhibitMeta(
  model: ArchitectureModel,
  id: ArchitectureExhibitKey,
): { title: string; soWhat: string; decisionImplication: string } {
  const planned = model.exhibitPlan?.find((e) => e.id === id);
  return {
    title: planned?.title ?? id.replace(/_/g, " "),
    soWhat: planned?.soWhat ?? "No interpretation modelled.",
    decisionImplication:
      planned?.decisionImplication ?? "Decision implication not modelled.",
  };
}

function exhibitSection(
  model: ArchitectureModel,
  id: ArchitectureExhibitKey,
  num: number,
  body: string,
): string {
  const meta = exhibitMeta(model, id);
  return `<section class="exhibit" id="${id}" data-exhibit="${id}">
    <div class="sec-h"><span class="num">${num}</span><h2>${esc(meta.title)}</h2></div>
    <div class="visual-body">${body}</div>
    <p class="so-what"><strong>So what:</strong> ${esc(meta.soWhat)}</p>
    <p class="decision-implication"><strong>Decision implication:</strong> ${esc(meta.decisionImplication)}</p>
  </section>`;
}

function wrapSvgText(
  text: string | undefined,
  maxChars: number,
  maxLines: number,
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current =
      word.length > maxChars ? word.slice(0, maxChars - 3) + "..." : word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  const consumed = lines.join(" ").replace(/\.\.\.$/, "");
  if (words.join(" ").length > consumed.length && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length > maxChars - 3
        ? last.slice(0, maxChars - 3) + "..."
        : `${last}...`;
  }
  return lines;
}

function svgTextBlock(
  text: string | undefined,
  x: number,
  y: number,
  opts: {
    maxChars: number;
    maxLines: number;
    lineHeight: number;
    fontSize: number;
    weight?: number;
    fill?: string;
  },
): string {
  const lines = wrapSvgText(text, opts.maxChars, opts.maxLines);
  if (!lines.length) return "";
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : opts.lineHeight}">${esc(line)}</tspan>`,
    )
    .join("");
  const fill = opts.fill ? ` fill="${opts.fill}"` : "";
  const weight = opts.weight ? ` font-weight="${opts.weight}"` : "";
  return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${opts.fontSize}"${weight}${fill}>${tspans}</text>`;
}

function svgTimeline(
  items: ReadonlyArray<{ id: string; label: string; detail?: string }>,
  accent = "var(--data)",
): string {
  const leftGutter = 132;
  const step = 220;
  const width = Math.max(
    760,
    leftGutter * 2 + Math.max(0, items.length - 1) * step,
  );
  const height = 214;
  const nodes = items
    .map((item, i) => {
      const x = leftGutter + i * step;
      const line =
        i < items.length - 1
          ? `<path d="M${x + 48} 92 L${x + step - 48} 92" stroke="${accent}" stroke-width="2" marker-end="url(#arrow)"/>`
          : "";
      return `${line}<g>
        <circle cx="${x}" cy="92" r="28" fill="#fff" stroke="${accent}" stroke-width="2"/>
        <text x="${x}" y="97" text-anchor="middle" font-size="13" font-weight="700">${i + 1}</text>
        ${svgTextBlock(item.label, x, 140, {
          maxChars: 24,
          maxLines: 2,
          lineHeight: 14,
          fontSize: 12,
          weight: 700,
        })}
        ${svgTextBlock(item.detail, x, 174, {
          maxChars: 32,
          maxLines: 2,
          lineHeight: 12,
          fontSize: 10,
          fill: "#6b6b66",
        })}
      </g>`;
    })
    .join("");
  return `<svg class="diagram timeline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Architecture flow diagram">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${accent}"/></marker></defs>
    ${nodes}
  </svg>`;
}

function svgFlowDiagram(
  flows: ArchFlow[],
  labels: Record<string, string>,
  kinds: ArchFlowKind[],
  title: string,
): string {
  const filtered = flows.filter((f) => kinds.includes(f.kind)).slice(0, 8);
  const items = filtered.length
    ? filtered.map((f) => ({
        id: f.id,
        label: `${labels[f.from] ?? f.from} → ${labels[f.to] ?? f.to}`,
        detail: f.label ?? FLOW_LABEL[f.kind],
      }))
    : [{ id: "empty", label: title, detail: "No modelled flow" }];
  const accent =
    kinds.includes("control") || kinds.includes("human_approval")
      ? "var(--control)"
      : "var(--data)";
  return svgTimeline(items, accent);
}

function svgGapBridge(model: ArchitectureModel): string {
  const items = (model.gapToTargetBridge ?? []).map((b) => ({
    id: b.id,
    label: b.targetCapability,
    detail: b.gap,
  }));
  return svgTimeline(items, "var(--changed)");
}

function svgLevel(
  level: ArchitectureLevelModel | undefined,
  title: string,
): string {
  if (!level) {
    return svgTimeline(
      [{ id: "missing", label: title, detail: "Missing level" }],
      "var(--muted)",
    );
  }
  return svgTimeline(
    level.nodes.slice(0, 7).map((n) => ({
      id: n.id,
      label: n.label,
      detail: n.service ?? ARCH_LAYER_LABELS[n.layer],
    })),
    "var(--data)",
  );
}

function currentOperatingFlow(model: ArchitectureModel): string {
  const steps = (model.currentStateFlow ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    detail: s.actor ?? s.trigger,
  }));
  return `${svgTimeline(steps, "var(--control)")}<div class="grid2">${(
    model.currentStateFlow ?? []
  )
    .map(
      (s) =>
        `<div class="card"><div class="card-h">${esc(s.label)}</div><div class="note">${esc(
          s.bottleneck ?? s.manualWork ?? s.handoff ?? s.decision,
        )}</div></div>`,
    )
    .join("")}</div>`;
}

function gapsMap(model: ArchitectureModel): string {
  const cards = (model.gapsMap ?? [])
    .map(
      (g) =>
        `<div class="card"><div class="card-h">${esc(g.gap)}</div><div class="note">${esc(g.observation)}</div><div class="outcome">${esc(g.designImplication)}</div></div>`,
    )
    .join("");
  return `${svgGapBridge(model)}<div class="grid2">${cards}</div>`;
}

function levelBody(
  level: ArchitectureLevelModel | undefined,
  title: string,
): string {
  if (!level)
    return `${svgLevel(undefined, title)}<p class="empty">Missing ${esc(title)}.</p>`;
  return `${svgLevel(level, title)}<p class="caption">${esc(level.thesis)}</p>${stateMap(levelState(level))}${flowList(level.flows, Object.fromEntries(level.nodes.map((n) => [n.id, n.label])), ["data", "event", "control", "human_approval"])}`;
}

function humanApproval(
  model: ArchitectureModel,
  labels: Record<string, string>,
): string {
  const approvals = model.agentic
    .filter((a) => a.humanInLoop)
    .map((a) => ({
      id: a.agentId,
      label: labels[a.agentId] ?? a.agentId,
      detail: a.humanInLoop,
    }));
  return `${svgTimeline(approvals, "var(--control)")}${agenticOverlay(model, labels)}`;
}

function integrationMap(
  model: ArchitectureModel,
  labels: Record<string, string>,
): string {
  const integrationNodes = model.target.nodes.filter(
    (n) =>
      n.layer === "integration" ||
      n.kind === "integration" ||
      n.layer === "core_systems",
  );
  const svg = svgTimeline(
    integrationNodes.map((n) => ({
      id: n.id,
      label: n.label,
      detail: n.service,
    })),
    "var(--data)",
  );
  return `${svg}${stateMap({
    title: "Integration map",
    thesis: "Target integration rail",
    nodes: integrationNodes,
    flows: model.target.flows.filter((f) => labels[f.from] && labels[f.to]),
  })}`;
}

function governanceTelemetry(model: ArchitectureModel): string {
  const items = model.controlPoints.map((c) => ({
    id: c.id,
    label: c.label,
    detail: c.owner ?? c.what,
  }));
  return `${svgTimeline(items, "var(--control)")}<div class="grid2">${model.controlPoints
    .map(
      (c) =>
        `<div class="card"><div class="card-h">${esc(c.label)}</div><div class="note">${esc(c.what)}</div>${c.owner ? `<div class="owner">${esc(c.owner)}</div>` : ""}</div>`,
    )
    .join("")}</div>`;
}

function decisionLog(model: ArchitectureModel): string {
  const rows = (model.decisionLog ?? []).map(
    (d) =>
      `<div class="card"><div class="card-h">${esc(d.decision)}</div><div class="outcome">${esc(d.recommendation)}</div><div class="note">${esc(d.rationale)}</div>${d.status ? `<span class="badge">${esc(d.status)}</span>` : ""}</div>`,
  );
  return `${svgTimeline(
    (model.decisionLog ?? []).map((d) => ({
      id: d.id,
      label: d.status ?? "decision",
      detail: d.recommendation,
    })),
    "var(--accent)",
  )}<div class="grid2">${rows.join("")}</div>`;
}

function storySpine(model: ArchitectureModel): string {
  const bridge = model.gapToTargetBridge ?? [];
  if (!bridge.length) return `<p class="empty">No story spine modelled.</p>`;
  return `<div class="story-spine">${bridge
    .map(
      (b) =>
        `<div class="story-beat"><span>${esc(b.observation)}</span><strong>${esc(b.targetCapability)}</strong><em>${esc(b.architectureResponse)}</em></div>`,
    )
    .join("")}</div>`;
}

function clientProvenanceNote(note: string | undefined): string {
  if (!note?.trim()) return "";
  return note
    .replace(
      /\bDecision\s+[0-9a-f]{8}-[0-9a-f-]{27,36}\b/gi,
      "approved solution decision",
    )
    .replace(
      /\bhash\s+[0-9a-f]{6,}(?:…[0-9a-f]+)?\b/gi,
      "validated decision record",
    )
    .replace(/\bversion\s+[0-9a-f]{6,}(?:…[0-9a-f]+)?\b/gi, "approved version")
    .replace(/\s+/g, " ")
    .trim();
}

/** Render the full premium architecture HTML document. */
export function renderArchitectureHtml(model: ArchitectureModel): string {
  const labels = nodeLabelMap(model);
  const nav = [
    ["thesis", "Thesis"],
    ["current_state_operating_flow", "Current flow"],
    ["current_state_gaps_map", "Gaps"],
    ["target_conceptual_architecture", "Conceptual"],
    ["target_logical_architecture", "Logical"],
    ["target_physical_deployment", "Physical"],
    ["end_to_end_data_flow", "Data flow"],
    ["ai_recommendation_control_flow", "AI control"],
    ["governance_audit_telemetry_flow", "Governance"],
    ["architecture_decision_log", "Decisions"],
  ]
    .map(([h, l]) => `<a href="#${h}">${esc(l)}</a>`)
    .join("");

  const patternsBody = model.patterns.length
    ? `<div class="grid2">${model.patterns
        .map(
          (p) =>
            `<div class="card"><div class="card-h">${esc(p.name)}</div><div class="note">${esc(p.implication)}</div></div>`,
        )
        .join("")}</div>`
    : `<p class="empty">No patterns modelled.</p>`;

  const wavesBody = model.waves.length
    ? `<div class="waves">${model.waves
        .map(
          (w) =>
            `<div class="wave"><div class="wave-h"><strong>${esc(w.label)}</strong>${w.window ? `<span class="win">${esc(w.window)}</span>` : ""}</div><ul>${w.scope.map((s) => `<li>${esc(labels[s] ?? s)}</li>`).join("")}</ul><div class="outcome">${esc(w.outcome)}</div></div>`,
        )
        .join("")}</div>`
    : `<p class="empty">No implementation waves modelled.</p>`;

  const decisionsBody = `${
    model.openInputs && model.openInputs.length
      ? `<div class="open-inputs"><div class="card-h">Open Inputs Required</div><ul>${model.openInputs
          .map((o) => `<li>${esc(o)}</li>`)
          .join("")}</ul></div>`
      : ""
  }`;
  const provenanceNote = clientProvenanceNote(model.provenanceNote);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(model.engagement)} — Target Architecture</title>
<style>
  :root{--bg:#F8F7F4;--ink:#1a1a1a;--muted:#6b6b66;--line:#e2e0d9;--card:#fff;
    --data:#2f6f6a;--control:#9a5b2f;--new:#2f6f6a;--changed:#9a5b2f;--accent:#1a1a1a;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",-apple-system,system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
  h1,h2,h3,.svc{font-family:Georgia,"Times New Roman",serif;font-weight:400}
  .review-banner{background:#111827;color:#fff;padding:12px 48px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.18)}
  .review-banner strong{font-size:12px;letter-spacing:.08em;text-transform:uppercase}
  .review-banner span{font-size:13px;color:#D1D5DB}
  .header{padding:64px 48px 28px;border-bottom:1px solid var(--line)}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  h1{font-size:34px;line-height:1.15;margin:10px 0 14px;max-width:900px}
  .decision{font-size:18px;max-width:880px;border-left:3px solid var(--accent);padding:8px 0 8px 18px;margin:6px 0 8px}
  .prov-note{font-size:13px;color:var(--muted);font-style:italic;max-width:820px}
  .nav{position:sticky;top:0;background:rgba(248,247,244,.92);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:12px 48px;display:flex;gap:18px;flex-wrap:wrap;z-index:5}
  .nav a{color:var(--muted);text-decoration:none;font-size:13px}
  .nav a:hover{color:var(--ink)}
  .wrap{padding:8px 48px 80px;max-width:1080px}
  section{padding:38px 0;border-bottom:1px solid var(--line)}
  .sec-h{display:flex;align-items:baseline;gap:12px}
  .num{font-family:Georgia,serif;color:var(--muted);font-size:15px}
  h2{font-size:24px;margin:0}
  .caption{color:var(--muted);max-width:760px;margin:8px 0 22px}
  .statemap{display:flex;flex-direction:column;gap:10px}
  .band{display:grid;grid-template-columns:170px 1fr;gap:14px;align-items:start;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .band-label{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding-top:4px}
  .band-nodes{display:flex;flex-wrap:wrap;gap:10px}
  .node{background:#fbfbf9;border:1px solid var(--line);border-radius:8px;padding:9px 12px;min-width:150px;max-width:230px}
  .node-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .node-label{font-weight:600;font-size:13.5px}
  .svc{font-size:13px;color:var(--data);margin-top:2px}
  .note{font-size:12.5px;color:var(--muted);margin-top:4px}
  .badge{font-size:10.5px;letter-spacing:.04em;padding:1px 6px;border-radius:20px;border:1px solid var(--line);color:var(--muted)}
  .st-new{color:#fff;background:var(--new);border-color:var(--new)}
  .st-changed{color:#fff;background:var(--changed);border-color:var(--changed)}
  .st-retired{text-decoration:line-through}
  .prov{background:#f0eee8}
  .flow{padding:7px 0}
  .flow-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .tile{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:4px 10px;font-size:13px;font-weight:600}
  .arrow{font-weight:700}
  .arrow[data-k="data"]{color:var(--data)} .arrow[data-k="control"]{color:var(--control)}
  .arrow[data-k="human_approval"]{color:var(--accent)}
  .flbl{font-size:12.5px;color:var(--muted)}
  .fk-data{color:var(--data);border-color:var(--data)} .fk-control{color:var(--control);border-color:var(--control)}
  .agents{display:flex;flex-direction:column;gap:12px}
  .agent{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .agent-h{display:flex;align-items:center;gap:9px}
  .dot{width:9px;height:9px;border-radius:50%;background:var(--control)}
  .role{font-size:12.5px;color:var(--muted)}
  .line{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}
  .lk{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);min-width:74px}
  .chip{font-size:12px;background:#f3f2ed;border:1px solid var(--line);border-radius:20px;padding:2px 9px}
  .chip.ground{background:#eef4f3} .chip.guard{background:#f6efe8}
  .hil{margin-top:9px;font-size:12.5px;color:var(--control)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .card-h{font-weight:600;margin-bottom:4px}
  .owner{font-size:12px;color:var(--muted);margin-top:6px}
  .waves{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
  .wave{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .wave-h{display:flex;justify-content:space-between;align-items:baseline}
  .win{font-size:12px;color:var(--muted)}
  .wave ul{margin:8px 0;padding-left:18px;font-size:13px}
  .outcome{font-size:12.5px;color:var(--data);border-top:1px solid var(--line);padding-top:8px;margin-top:6px}
  .open-inputs{background:#fbfaf6;border:1px dashed var(--line);border-radius:10px;padding:14px 16px}
  .open-inputs ul{margin:8px 0 0;padding-left:18px;font-size:13.5px}
  .empty{color:var(--muted);font-style:italic}
  .legend{display:flex;gap:16px;font-size:12px;color:var(--muted);margin-bottom:14px}
  .legend span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:middle}
  .legend .l-data::before{background:var(--data)} .legend .l-control::before{background:var(--control)}
  .visual-body{display:flex;flex-direction:column;gap:18px}
  .diagram{width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px}
  .so-what,.decision-implication{background:#fff;border-left:3px solid var(--data);padding:10px 14px;margin:14px 0 0;color:var(--ink)}
  .decision-implication{border-left-color:var(--control);color:var(--muted)}
  .story-spine{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
  .story-beat{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
  .story-beat span{font-size:12px;color:var(--muted)} .story-beat strong{font-size:14px} .story-beat em{font-size:12px;color:var(--control);font-style:normal}
  @media(max-width:720px){.review-banner,.header,.nav,.wrap{padding-left:20px;padding-right:20px}.band{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}}
</style></head>
<body>
  <div class="review-banner">
    <strong>HTML preview only</strong>
    <span>Generated from structured state for review. Client-final export is DOCX or PPTX after approval.</span>
  </div>
  <div class="header">
    <div class="kicker">${esc(model.client)} · Target Architecture</div>
    <h1>${esc(model.engagement)}</h1>
    <div class="decision">${esc(model.decisionHeadline)}</div>
    ${provenanceNote ? `<div class="prov-note">${esc(provenanceNote)}</div>` : ""}
  </div>
  <nav class="nav">${nav}</nav>
  <div class="wrap">
    ${section("thesis", 1, "Architecture thesis", "The single idea the future-state design turns on.", `<p class="decision" style="border-color:var(--data)">${esc(model.target.thesis)}</p>`)}
    ${section("story-spine-summary", 2, "Story spine summary", `${model.current.title || "Current state (as-is)"} → ${model.target.title || "Target state (to-be)"}. Current observation → gap → target capability → architecture response.`, storySpine(model))}
    ${section("target-state-overview", 3, model.target.title || "Target state (to-be)", "Named services reflect the solution we designed — not a predetermined cloud.", stateMap(model.target))}
    ${exhibitSection(model, "current_state_operating_flow", 3, currentOperatingFlow(model))}
    ${exhibitSection(model, "current_state_system_data_flow", 4, `${svgFlowDiagram(model.current.flows, labels, ["data", "event"], "Current state (as-is) system/data flow")}${stateMap(model.current)}${flowList(model.current.flows, labels, ["data", "event"])}`)}
    ${exhibitSection(model, "current_state_gaps_map", 5, gapsMap(model))}
    ${exhibitSection(model, "target_conceptual_architecture", 6, levelBody(model.architectureLevels?.conceptual, "conceptual architecture"))}
    ${exhibitSection(model, "target_logical_architecture", 7, levelBody(model.architectureLevels?.logical, "logical architecture"))}
    ${exhibitSection(model, "target_physical_deployment", 8, levelBody(model.architectureLevels?.physical, "physical architecture"))}
    ${exhibitSection(model, "end_to_end_data_flow", 9, `<div class="legend"><span class="l-data">Data flow</span></div>${svgFlowDiagram(model.target.flows, labels, ["data", "event"], "End-to-end data flow")}${flowList(model.target.flows, labels, ["data", "event"])}`)}
    ${exhibitSection(model, "ai_recommendation_control_flow", 10, `<div class="legend"><span class="l-control">AI control / decision flow</span></div><h3 style="font-size:15px;margin:0 0 10px">AI decision &amp; control flow</h3>${svgFlowDiagram(model.target.flows, labels, ["control", "human_approval"], "AI decision & control flow")}${flowList(model.target.flows, labels, ["control", "human_approval"])}<h3 style="font-size:15px;margin:22px 0 10px">Agentic overlay — how the services come alive</h3>${agenticOverlay(model, labels)}`)}
    ${exhibitSection(model, "human_approval_override_model", 11, humanApproval(model, labels))}
    ${exhibitSection(model, "integration_map", 12, integrationMap(model, labels))}
    ${exhibitSection(model, "governance_audit_telemetry_flow", 13, governanceTelemetry(model))}
    ${exhibitSection(
      model,
      "implementation_waves",
      14,
      `${svgTimeline(
        model.waves.map((w) => ({
          id: w.id,
          label: w.label,
          detail: w.window ?? w.outcome,
        })),
        "var(--data)",
      )}${wavesBody}`,
    )}
    ${exhibitSection(model, "architecture_decision_log", 15, decisionLog(model))}
    ${section("patterns", 16, "Architecture patterns", "The patterns the design relies on, and why each matters.", patternsBody)}
    ${section("decisions", 17, "Open inputs required", "What the architecture leadership still needs to confirm.", decisionsBody || `<p class="empty">No open decisions outstanding.</p>`)}
  </div>
</body></html>`;
}

function blockHasSvg(html: string, id: ArchitectureExhibitKey): boolean {
  const re = new RegExp(
    `<section[^>]+data-exhibit="${id}"[\\s\\S]*?<\\/section>`,
    "i",
  );
  return re.test(html) && /<svg\b/i.test(html.match(re)?.[0] ?? "");
}

function hasLevel(level: ArchitectureLevelModel | undefined): boolean {
  return (
    !!level &&
    !!level.title?.trim() &&
    !!level.thesis?.trim() &&
    !!level.soWhat?.trim() &&
    level.nodes.length > 0
  );
}

export function deriveArchitectureContractSignals(
  model: ArchitectureModel,
  html = renderArchitectureHtml(model),
): ArchitectureContractSignals {
  const visualExhibits = ARCHITECTURE_V2_EXHIBITS.filter((id) =>
    blockHasSvg(html, id),
  );
  const interpreted = ARCHITECTURE_V2_EXHIBITS.every((id) => {
    const meta = model.exhibitPlan?.find((e) => e.id === id);
    return !!meta?.soWhat?.trim() && !!meta.decisionImplication?.trim();
  });
  return {
    hasStorySpine:
      (model.gapToTargetBridge?.length ?? 0) >= 3 &&
      (model.currentStateFlow?.length ?? 0) >= 2 &&
      !!model.target.thesis?.trim(),
    currentStateVisualPresent:
      (model.currentStateFlow?.length ?? 0) > 0 &&
      blockHasSvg(html, "current_state_operating_flow") &&
      blockHasSvg(html, "current_state_system_data_flow"),
    gapToTargetBridgePresent:
      (model.gapToTargetBridge?.length ?? 0) > 0 &&
      blockHasSvg(html, "current_state_gaps_map"),
    conceptualArchPresent:
      hasLevel(model.architectureLevels?.conceptual) &&
      blockHasSvg(html, "target_conceptual_architecture"),
    logicalArchPresent:
      hasLevel(model.architectureLevels?.logical) &&
      blockHasSvg(html, "target_logical_architecture"),
    physicalArchPresent:
      hasLevel(model.architectureLevels?.physical) &&
      blockHasSvg(html, "target_physical_deployment"),
    exhibitsRenderedAsVisual:
      visualExhibits.length === ARCHITECTURE_V2_EXHIBITS.length,
    exhibitsInterpreted: interpreted,
  };
}
