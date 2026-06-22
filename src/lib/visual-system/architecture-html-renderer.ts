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
  type AgentBinding,
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
  const service = n.service
    ? `<div class="svc">${esc(n.service)}</div>`
    : "";
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

function nodeLabelMap(model: ArchitectureModel): Record<string, string> {
  const m: Record<string, string> = {};
  for (const n of [...model.current.nodes, ...model.target.nodes]) m[n.id] = n.label;
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
  return rows || `<p class="empty">No ${kinds.map((k) => FLOW_LABEL[k]).join("/")} flows modelled.</p>`;
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

/** Render the full premium architecture HTML document. */
export function renderArchitectureHtml(model: ArchitectureModel): string {
  const labels = nodeLabelMap(model);
  const nav = [
    ["thesis", "Thesis"],
    ["current", "Current state"],
    ["target", "Target state"],
    ["dataflow", "Data flow"],
    ["aiflow", "AI control & agents"],
    ["patterns", "Patterns"],
    ["controls", "Controls"],
    ["waves", "Waves"],
    ["decisions", "Decisions"],
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

  const controlsBody = model.controlPoints.length
    ? `<div class="grid2">${model.controlPoints
        .map(
          (c) =>
            `<div class="card"><div class="card-h">${esc(c.label)}</div><div class="note">${esc(c.what)}</div>${c.owner ? `<div class="owner">${esc(c.owner)}</div>` : ""}</div>`,
        )
        .join("")}</div>`
    : `<p class="empty">No control points modelled.</p>`;

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
  @media(max-width:720px){.header,.nav,.wrap{padding-left:20px;padding-right:20px}.band{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}}
</style></head>
<body>
  <div class="header">
    <div class="kicker">${esc(model.client)} · Target Architecture</div>
    <h1>${esc(model.engagement)}</h1>
    <div class="decision">${esc(model.decisionHeadline)}</div>
    ${model.provenanceNote ? `<div class="prov-note">${esc(model.provenanceNote)}</div>` : ""}
  </div>
  <nav class="nav">${nav}</nav>
  <div class="wrap">
    ${section("thesis", 1, "Architecture thesis", "The single idea the future-state design turns on.", `<p class="decision" style="border-color:var(--data)">${esc(model.target.thesis)}</p>`)}
    ${section("current", 2, model.current.title || "Current state (as-is)", model.current.thesis, stateMap(model.current) + `<h3 style="font-size:15px;margin:20px 0 8px">Today's information flows</h3>` + flowList(model.current.flows, labels, ["data", "event"]))}
    ${section("target", 3, model.target.title || "Target state (to-be)", "Named services reflect the solution we designed — not a predetermined cloud.", stateMap(model.target))}
    ${section("dataflow", 4, "End-to-end data flow", "Where data moves — rendered distinct from where AI judgment happens.", `<div class="legend"><span class="l-data">Data flow</span></div>` + flowList(model.target.flows, labels, ["data", "event"]))}
    ${section("aiflow", 5, "AI decision & control flow — how the services come alive", "The agentic overlay: where agents sit, what they call, how they are grounded and guarded, and where humans approve.", `<div class="legend"><span class="l-control">AI control / decision flow</span></div>` + flowList(model.target.flows, labels, ["control", "human_approval"]) + `<h3 style="font-size:15px;margin:22px 0 10px">Agentic overlay</h3>` + agenticOverlay(model, labels))}
    ${section("patterns", 6, "Architecture patterns", "The patterns the design relies on, and why each matters.", patternsBody)}
    ${section("controls", 7, "Control points", "Human-in-the-loop, model-risk, and policy checkpoints built in by design.", controlsBody)}
    ${section("waves", 8, "Implementation waves", "How the target is delivered — sequenced, with the outcome each wave unlocks.", wavesBody)}
    ${section("decisions", 9, "Architecture decisions required", "What the architecture leadership must decide, and what we still need to confirm.", decisionsBody || `<p class="empty">No open decisions outstanding.</p>`)}
  </div>
</body></html>`;
}
