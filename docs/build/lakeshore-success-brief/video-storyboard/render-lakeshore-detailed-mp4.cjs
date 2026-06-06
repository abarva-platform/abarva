#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { Resvg } = require("@resvg/resvg-js");
const OpenAI = require("openai");

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, "detailed-render");
const PLATE_DIR = path.join(OUT, "plates");
const AUDIO_DIR = path.join(OUT, "audio");
const CLIP_DIR = path.join(OUT, "clips");
const QA_DIR = path.join(OUT, "qa");
const FPS = 30;
const WIDTH = 1600;
const HEIGHT = 900;
const PAD_SECONDS = 1.25;
const DEFAULT_VOICE = "nova";
const VOICE_INSTRUCTIONS =
  "Warm, empathetic, confident female executive narrator. Pronounce AbarVa as one word, 'uh-BAR-vuh' or 'Abarva'; never say 'A bar V A'. Speak with calm conviction, slight sympathy for implementation risk, and no hype.";

const COLORS = {
  navy: "#111827",
  ink: "#171b2a",
  muted: "#5f6b7d",
  paper: "#f7f5ef",
  panel: "#ffffff",
  line: "#d9d4ca",
  blue: "#1d5fd1",
  cyan: "#16a7d8",
  green: "#0f766e",
  gold: "#a16207",
  rose: "#be123c",
  slate: "#273243",
};

const scenes = [
  {
    id: "01",
    eyebrow: "Executive thesis",
    title: "AI success is not a chatbot problem.",
    subtitle: "For Lakeshore, the job is governed execution: context, corpus, workflow, evidence, owners, and value proof.",
    narration:
      "AI success for Lakeshore is not a chatbot problem. It is a governed execution layer that knows the portfolio, understands the evidence, turns decisions into work, and proves value without pretending the data is cleaner than it is.",
    bullets: ["Context before answers", "Evidence before claims", "Workflow before pilots", "Value proof before renewal"],
    highlight: "Abarva = model + context + corpus + workflow + proof",
    camera: { x: 850, y: 430, zoom: 1.1 },
  },
  {
    id: "02",
    eyebrow: "Who Lakeshore is",
    title: "A private holdings operating network.",
    subtitle: "The modeled Northshore profile mirrors the Chicago private-holdings archetype: operating companies, customer programs, vendors, banks, systems, and long-term stewardship.",
    narration:
      "We should orient Lakeshore like an operating-company portfolio, not a financial abstraction. The modeled Northshore profile covers supply chain and logistics, brand services, consumer products, and workplace convenience services. These businesses make money through margin, programs, route density, service quality, and customer depth.",
    bullets: ["Supply chain / logistics / packaging", "Brand services / promotions / loyalty", "Consumer products / commerce", "Workplace food / vending / micro-markets"],
    highlight: "Money is made in operations, not in a slide.",
    camera: { x: 790, y: 475, zoom: 1.12 },
  },
  {
    id: "03",
    eyebrow: "Business economics",
    title: "Where value and leakage actually show up.",
    subtitle: "AbarVa needs the revenue model, cost drivers, customer commitments, and operating exceptions before it can make useful recommendations.",
    narration:
      "The context layer gets powerful when it knows how each business makes money. Supply chain programs depend on distribution margin, sourcing spread, inventory turns, and transport cost. Brand services depend on scope, vendor pricing, fulfillment, and renewal discipline. Workplace services depend on route density, cash capture, uptime, and local execution.",
    table: [
      ["Business", "Makes money through", "Leakage risk"],
      ["Supply chain", "program margin, sourcing spread", "working capital, freight, inventory"],
      ["BrandWorks", "fees, fulfillment, analytics", "scope creep, vendor overlap"],
      ["Consumer", "DTC/retail margin, turns", "returns, promo ROI, data risk"],
      ["Workplace", "route density, payment capture", "labor, shrink, uptime"],
    ],
    highlight: "AI value starts with operating economics.",
    camera: { x: 820, y: 500, zoom: 1.13 },
  },
  {
    id: "04",
    eyebrow: "Typical challenges",
    title: "The portfolio is not one clean system.",
    subtitle: "Different companies keep different ERPs, banks, vendors, contracts, approval habits, and local workarounds.",
    narration:
      "The difficult part is not asking a model a treasury question. The difficult part is loading the real operating picture: ERP and TMS gaps, CMDB records, vendor contracts, bank relationships, payment controls, route operations, customer concentration, board priorities, and the exceptions that only the operators know.",
    bullets: ["ERP / TMS / WMS / CRM fragmentation", "Bank and payment-rail sprawl", "Vendor overlap and renewal leakage", "Local process exceptions", "Board claims without evidence"],
    highlight: "The mess is exactly where Abarva creates leverage.",
    camera: { x: 820, y: 480, zoom: 1.12 },
  },
  {
    id: "05",
    eyebrow: "Context layer",
    title: "The secret sauce is not a document dump.",
    subtitle: "It is a governed map of who, what, where, evidence, workflow state, and decision rights.",
    narration:
      "The context layer is the long-term moat. It connects tenant, persona, holding-company layer, operating company, system, vendor, contract, bank, process, artifact, corpus pattern, and value claim. That is what lets the agent answer like a senior advisor instead of a generic model.",
    chips: ["Tenant", "Persona", "HoldCo", "PortCo", "System", "Vendor", "Contract", "Bank", "Process", "Artifact", "Pattern", "Value claim"],
    highlight: "Context dimensions become decision intelligence.",
    camera: { x: 800, y: 470, zoom: 1.1 },
  },
  {
    id: "06",
    eyebrow: "What the context layer learned",
    title: "The best insights are cross-context joins.",
    subtitle: "AbarVa becomes valuable when it joins facts that usually live in different silos.",
    narration:
      "The interesting insights come from joins. Same bank fragmentation plus Kyriba schedule plus ERP variance plus covenant exposure means an urgent treasury Move. Same vendor across HoldCos plus renewal dates plus underused licenses means a Source event. Same use case requested by two companies means a reusable AI capability, not two disconnected pilots.",
    bullets: ["Bank estate + Kyriba plan + covenant exposure", "Vendor contracts + renewals + spend leverage", "CMDB + cloud cost + modernization debt", "Use-case demand + artifacts + reusable patterns"],
    highlight: "The insight is in the relationship graph.",
    camera: { x: 820, y: 490, zoom: 1.12 },
  },
  {
    id: "07",
    eyebrow: "Corpus doctrine",
    title: "The corpus must stay editable.",
    subtitle: "Lakeshore leaders should approve, refine, localize, retire, or challenge doctrine as the portfolio learns what works.",
    narration:
      "The corpus cannot be set in stone. Lakeshore should be able to approve a treasury rule, localize it for a bank, change the owner from CFO to Treasurer plus CFO, downgrade confidence when evidence is weak, or retire a pattern that no longer fits how the portfolio operates.",
    bullets: ["Approve", "Edit", "Localize", "Retire", "Evidence-tag", "Workflow-link"],
    highlight: "Doctrine becomes a living operating asset.",
    camera: { x: 780, y: 500, zoom: 1.11 },
  },
  {
    id: "08",
    eyebrow: "Loaded pattern truth",
    title: "What finance and treasury doctrine is already modeled.",
    subtitle: "The current package models a global corpus baseline plus Lakeshore-specific Kyriba doctrine that should be promoted into editable rows.",
    narration:
      "Today the buyer brief cites a global baseline of eight thousand nine hundred eighty-seven published patterns and twenty-seven thousand fifty-two relationships. For Lakeshore, the Kyriba and treasury doctrine is modeled in the prompt, success brief, and Move Zero package. The next step is to promote these into editable Lakeshore corpus rows before buyer reliance.",
    stats: [
      ["8,987", "published corpus patterns"],
      ["27,052", "relationships"],
      ["18+", "treasury pattern handles"],
      ["6", "Kyriba failure modes"],
    ],
    highlight: "Modeled now. Editable corpus rows next.",
    camera: { x: 780, y: 485, zoom: 1.11 },
  },
  {
    id: "09",
    eyebrow: "What Kyriba is",
    title: "Kyriba is a treasury operating platform.",
    subtitle: "Cash visibility, bank connectivity, payments, liquidity planning, forecasting, bank account management, risk, and controls.",
    narration:
      "Kyriba is a treasury management platform. It supports cash visibility, bank connectivity, payments, liquidity planning, cash forecasting, bank account management, risk, and treasury controls. For Lakeshore, the vision is not to install software. The vision is to make treasury operating facts reliable enough for the CFO, Treasurer, audit committee, and board to trust.",
    bullets: ["Cash visibility", "Bank connectivity", "Payments", "Liquidity and forecasting", "Bank account management", "Treasury controls"],
    highlight: "Not software install. Treasury operating transformation.",
    camera: { x: 780, y: 500, zoom: 1.12 },
  },
  {
    id: "10",
    eyebrow: "Implementation vision",
    title: "Move 0 first. AI on top second.",
    subtitle: "AbarVa de-risks the foundation before promoting AI forecasting, anomaly detection, covenant monitoring, or IC automation.",
    narration:
      "The implementation vision is simple but strict. Move Zero de-risks Kyriba readiness: banks, feeds, entities, history, controls, adoption, intercompany, and covenants. Move One puts AI on top only when the foundation is clean enough. Otherwise, AI just makes weak data sound confident.",
    flow: ["Move 0", "Readiness gates", "Evidence pack", "Steering decision", "Move 1", "AI on treasury"],
    highlight: "Foundation before AI. Evidence before confidence.",
    camera: { x: 820, y: 470, zoom: 1.1 },
  },
  {
    id: "11",
    eyebrow: "Failure mode 1",
    title: "Bank connectivity stalls the rollout.",
    subtitle: "Hidden H2H, SWIFT, BAI2, MT940/942, portal-only, signer, and onboarding issues show up too late.",
    narration:
      "The first failure mode is bank connectivity. Teams discover bank by bank that only a fraction of the estate is host-to-host ready. Abarva should force a bank inventory and connectivity matrix before the schedule is committed, then spawn a Source event if consolidation is the smarter path.",
    bullets: ["Bank / account / entity inventory", "Connectivity format and owner", "Critical-bank-first sequencing", "Tail-bank containment", "Banking consolidation Source event"],
    highlight: "Do not automate bank sprawl blindly.",
    camera: { x: 820, y: 500, zoom: 1.12 },
  },
  {
    id: "12",
    eyebrow: "Failure mode 2",
    title: "ERP and GL feeds look automated but do not reconcile.",
    subtitle: "AP, AR, GL, EPM, and cash feeds need quality scores, variance logs, and owners.",
    narration:
      "The second failure mode is feed quality. A feed can load and still be wrong. The Move Zero design models a demo gap of zero point four one percent cash-versus-GL variance against a tighter production target. Abarva should name the variance source, owner, remediation plan, and pass-fail gate.",
    bullets: ["Completeness", "Timing", "Mapping quality", "Variance threshold", "Remediation owner"],
    highlight: "Automation without reconciliation is theater.",
    camera: { x: 840, y: 500, zoom: 1.12 },
  },
  {
    id: "13",
    eyebrow: "Failure mode 3",
    title: "Entity hierarchy breaks treasury rollup.",
    subtitle: "HoldCo, PortCo, trust, account, tax, lender, and intercompany structures must be canonical.",
    narration:
      "The third failure mode is entity hierarchy. In a holdings company, treasury reporting breaks when legal, tax, finance, bank-account, and intercompany records disagree. Abarva should load the canonical entity registry before treasury automation goes live.",
    bullets: ["Legal entities", "Bank accounts", "Signers", "IC notes", "Tax classification", "Reporting hierarchy"],
    highlight: "Bad hierarchy creates silent treasury errors.",
    camera: { x: 780, y: 500, zoom: 1.12 },
  },
  {
    id: "14",
    eyebrow: "Failure mode 4",
    title: "Forecasting starts without enough cash history.",
    subtitle: "Predictive cash forecasts need normalized historical position data by entity, currency, bank, and account.",
    narration:
      "The fourth failure mode is weak history. Forecasting needs more than a model demo. Lakeshore should reconstruct twelve to twenty-four months of bank statements or position history into normalized entity-currency-day records before trusting predictive cash forecasts.",
    bullets: ["Bronze bank statement archive", "Silver position table", "Entity-currency-day records", "Forecast entry gate", "Exception log"],
    highlight: "Forecast accuracy begins before the model.",
    camera: { x: 800, y: 495, zoom: 1.12 },
  },
  {
    id: "15",
    eyebrow: "Failure mode 5",
    title: "Adoption quietly falls back to Excel.",
    subtitle: "Kyriba can be live while real treasury work still happens in spreadsheets and bank portals.",
    narration:
      "The fifth failure mode is adoption. Users log in for meetings, but real work stays in Excel. Abarva should track usage by role, unresolved exceptions, training completion, dashboards used, and a thirty-day Excel-elimination sprint with named owners.",
    bullets: ["Role dashboards", "Weekly active users", "Training completion", "Exception backlog", "Excel-elimination sprint"],
    highlight: "Adoption is evidence, not optimism.",
    camera: { x: 820, y: 500, zoom: 1.12 },
  },
  {
    id: "16",
    eyebrow: "Failure mode 6",
    title: "Intercompany and covenants stay manual.",
    subtitle: "IC loans, monthly true-ups, leverage, fixed-charge coverage, liquidity thresholds, and board reporting must connect to treasury evidence.",
    narration:
      "The sixth failure mode is manual intercompany and covenant work. Intercompany notes, rate basis, monthly true-ups, covenant definitions, EBITDA add-backs, leverage, fixed-charge coverage, and liquidity thresholds need a finance-owned evidence pack. Otherwise treasury modernization stops short of what the CFO really needs.",
    bullets: ["IC loan schedule", "Rate basis and approvals", "Monthly true-up", "Covenant definitions", "12-week liquidity view"],
    highlight: "This is where treasury becomes board-grade.",
    camera: { x: 830, y: 500, zoom: 1.12 },
  },
  {
    id: "17",
    eyebrow: "Patterns that matter",
    title: "The treasury corpus should sound like a treasurer.",
    subtitle: "Daily cash, variance thresholds, payment controls, BEC, sweeps, pooling, FX, ASC 815, and board packs.",
    narration:
      "The finance and treasury patterns need to be specific enough for a real treasurer. Daily cash pre-walk by nine Central. Material surprises reconciled same day. Payment controls for first-time payees and BEC risk. Cash pooling with tax and intercompany consequences. FX and ASC 815 clarity. And no realized value claim until finance accepts the evidence chain.",
    bullets: ["9am CT daily cash pre-walk", "Same-day variance reconciliation", "Wire and first-time-payee controls", "Cash pooling / tax / IC review", "FX and ASC 815 clarity", "Finance-attested value proof"],
    highlight: "Specific doctrine beats generic treasury advice.",
    camera: { x: 780, y: 510, zoom: 1.12 },
  },
  {
    id: "18",
    eyebrow: "Value case",
    title: "The six-month case must show 5-10x potential.",
    subtitle: "Not through hype: through avoided failure cost, vendor leverage, execution-cost reduction, and finance-defensible proof.",
    narration:
      "The five hundred thousand dollar case should be grounded in five-to-ten times value potential. Avoiding a ten-to-twenty percent delay or change-order tax on a multi-million-dollar treasury rollout can cover a meaningful share of the engagement. Banking, vendor, SI, audit, software, and cyber optimization can add more. The key is to separate forecast, approved, negotiated, and finance-attested value.",
    bullets: ["Avoid rollout delay tax", "Rationalize banks and vendors", "Reduce execution cost", "Reuse artifacts and AI capabilities", "Finance-attested value ledger"],
    highlight: "Value is earned in proof, not promised in adjectives.",
    camera: { x: 820, y: 490, zoom: 1.11 },
  },
  {
    id: "19",
    eyebrow: "Source events",
    title: "Insights become commercial actions.",
    subtitle: "Banking consolidation, SI scope control, Microsoft/vendor leverage, audit/advisory rationalization, cyber insurance, and renewal optimization.",
    narration:
      "Abarva should turn context-layer insights into Source events. Bank consolidation when connectivity blocks Kyriba. SI scope control when implementation risk rises. Vendor leverage when multiple platforms buy the same services separately. Audit, advisory, cyber insurance, and software renewals all become governed decision paths with artifacts.",
    bullets: ["Banking consolidation", "Kyriba SI scope control", "Microsoft / software leverage", "Audit and advisory rationalization", "Cyber insurance consolidation", "Renewal optimization"],
    highlight: "Source turns intelligence into buying power.",
    camera: { x: 800, y: 500, zoom: 1.12 },
  },
  {
    id: "20",
    eyebrow: "Product proof flow",
    title: "The app must show the actual work.",
    subtitle: "Setup loads the context. Intelligence answers with evidence gaps. Moves owns execution. Source creates decision artifacts. Tower proves the portfolio story.",
    narration:
      "The demo needs to show the work, not just the answer. Setup loads the Lakeshore context. Intelligence explains what is known and missing. Moves runs the Kyriba readiness gates. Source creates commercial decision artifacts. Tower shows the value ledger and risk concentrations without mixing forecast with realized proof.",
    flow: ["Setup", "Intelligence", "Moves", "Source", "Tower", "Board pack"],
    highlight: "Abarva is persisted workflow, not a nicer chat window.",
    camera: { x: 820, y: 470, zoom: 1.1 },
  },
  {
    id: "21",
    eyebrow: "Why not raw Claude",
    title: "Claude can reason. AbarVa governs the operating frame.",
    subtitle: "Client context, corpus patterns, role/persona framing, evidence gaps, tenant boundaries, and persisted artifacts.",
    narration:
      "Claude can reason. Abarva governs what Claude can see, cite, create, and persist. That is the buyer proof. The answer is shaped by Lakeshore context, role and persona, corpus doctrine, evidence gaps, tenant boundaries, and the workflow artifact that follows from the recommendation.",
    bullets: ["Client context", "Role/persona framing", "Corpus doctrine", "Evidence citations and gaps", "Tenant boundaries", "Persisted artifacts"],
    highlight: "The platform makes model intelligence operational.",
    camera: { x: 820, y: 500, zoom: 1.12 },
  },
  {
    id: "22",
    eyebrow: "Six-month roadmap",
    title: "The engagement should build durable capability.",
    subtitle: "Month by month: context, corpus, treasury proof, Source value events, execution rhythm, and board-ready renewal case.",
    narration:
      "The six-month roadmap should not end with a one-month sales push. Month one loads and validates context. Month two promotes editable corpus doctrine. Month three runs Kyriba and treasury gates. Month four launches Source value events. Month five moves opportunities through execution. Month six publishes the board-ready value ledger, corpus coverage, operating model, and renewal case.",
    flow: ["M1 context", "M2 corpus", "M3 Kyriba gates", "M4 Source events", "M5 execution", "M6 board proof"],
    highlight: "Six months should leave Lakeshore stronger after we leave.",
    camera: { x: 800, y: 480, zoom: 1.1 },
  },
  {
    id: "23",
    eyebrow: "Success standard",
    title: "What a real win looks like.",
    subtitle: "Lakeshore should be able to decide faster, execute cleaner, reduce failure risk, and prove value with evidence.",
    narration:
      "The success standard is practical. Lakeshore can see what is loaded, what is missing, what decision is next, who owns it, what evidence supports it, what artifact gets created, and how value will be proven. That is the difference between AI theater and an AI success platform.",
    stats: [
      ["Context", "loaded and governed"],
      ["Corpus", "editable by leaders"],
      ["Kyriba", "de-risked by gates"],
      ["Value", "finance-defensible"],
    ],
    highlight: "This is the renewal case.",
    camera: { x: 790, y: 480, zoom: 1.1 },
  },
];

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: options.stdio || "pipe", encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed\n${result.stdout || ""}\n${result.stderr || ""}`);
  }
  return result.stdout || "";
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(text, x, y, opts = {}) {
  const size = opts.size || 28;
  const lineHeight = opts.lineHeight || Math.round(size * 1.35);
  const fill = opts.fill || COLORS.muted;
  const weight = opts.weight || 500;
  const family = opts.family || "Inter, Arial, sans-serif";
  const lines = wrap(text, opts.maxChars || 62).slice(0, opts.maxLines || 5);
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`)
    .join("\n");
}

function logo() {
  return `
    <g transform="translate(54 36)">
      <path d="M0 24 L15 4 L35 36 L51 8" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51 8 L64 8" stroke="${COLORS.cyan}" stroke-width="7" stroke-linecap="round"/>
      <text x="84" y="32" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="850" fill="#ffffff">Abar<tspan fill="${COLORS.cyan}">Va</tspan></text>
      <text x="238" y="32" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="760" fill="rgba(255,255,255,.78)">Lakeshore</text>
    </g>`;
}

function card(x, y, w, h, title, body, accent = COLORS.blue) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff" stroke="${COLORS.line}" />
    <rect x="${x}" y="${y}" width="7" height="${h}" rx="4" fill="${accent}" />
    <text x="${x + 24}" y="${y + 38}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="850" fill="${COLORS.ink}">${esc(title)}</text>
    ${textBlock(body, x + 24, y + 74, { size: 19, maxChars: Math.floor((w - 50) / 10), maxLines: 4, fill: COLORS.muted })}
  `;
}

function pill(x, y, label, fill = "#eef5ff", stroke = "#c8dcff", text = COLORS.blue) {
  const w = Math.max(118, label.length * 11 + 30);
  return `<rect x="${x}" y="${y}" width="${w}" height="38" rx="19" fill="${fill}" stroke="${stroke}" /><text x="${x + 15}" y="${y + 25}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="${text}">${esc(label)}</text>`;
}

function renderTable(scene) {
  if (!scene.table) return "";
  const [header, ...rows] = scene.table;
  const x = 90;
  const y = 440;
  const cols = [300, 510, 510];
  let out = `<rect x="${x}" y="${y - 44}" width="1420" height="${72 + rows.length * 78}" rx="16" fill="#fff" stroke="${COLORS.line}"/>`;
  let cursorX = x + 26;
  for (let i = 0; i < header.length; i++) {
    out += `<text x="${cursorX}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" letter-spacing="2" fill="${COLORS.blue}">${esc(header[i]).toUpperCase()}</text>`;
    cursorX += cols[i];
  }
  rows.forEach((row, rowIndex) => {
    const rowY = y + 42 + rowIndex * 78;
    out += `<line x1="${x}" y1="${rowY - 28}" x2="${x + 1420}" y2="${rowY - 28}" stroke="${COLORS.line}"/>`;
    let cx = x + 26;
    row.forEach((cell, i) => {
      out += textBlock(cell, cx, rowY, { size: i === 0 ? 21 : 18, weight: i === 0 ? 850 : 600, fill: i === 0 ? COLORS.ink : COLORS.muted, maxChars: i === 0 ? 22 : 42, maxLines: 2 });
      cx += cols[i];
    });
  });
  return out;
}

function renderFlow(scene) {
  if (!scene.flow) return "";
  const startX = 110;
  const y = 520;
  const gap = 28;
  const w = Math.floor((1380 - gap * (scene.flow.length - 1)) / scene.flow.length);
  return scene.flow.map((item, i) => {
    const x = startX + i * (w + gap);
    const accent = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.rose, COLORS.cyan, COLORS.slate][i % 6];
    return `
      <rect x="${x}" y="${y}" width="${w}" height="118" rx="16" fill="#fff" stroke="${COLORS.line}"/>
      <circle cx="${x + 34}" cy="${y + 38}" r="18" fill="${accent}"/>
      <text x="${x + 34}" y="${y + 45}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="#fff">${i + 1}</text>
      ${textBlock(item, x + 24, y + 80, { size: 22, weight: 850, fill: COLORS.ink, maxChars: Math.max(11, Math.floor(w / 11)), maxLines: 2 })}
    `;
  }).join("\n");
}

function renderStats(scene) {
  if (!scene.stats) return "";
  const startX = 92;
  const y = 430;
  const w = 330;
  const gap = 28;
  return scene.stats.map(([value, label], i) => {
    const x = startX + i * (w + gap);
    return `
      <rect x="${x}" y="${y}" width="${w}" height="155" rx="16" fill="#fff" stroke="${COLORS.line}"/>
      <text x="${x + 26}" y="${y + 78}" font-family="Georgia, serif" font-size="58" font-weight="900" fill="${COLORS.ink}">${esc(value)}</text>
      ${textBlock(label, x + 28, y + 116, { size: 18, weight: 850, fill: COLORS.muted, maxChars: 24, maxLines: 2 })}
    `;
  }).join("\n");
}

function renderChips(scene) {
  if (!scene.chips) return "";
  let x = 92;
  let y = 430;
  const out = [];
  scene.chips.forEach((chip, i) => {
    const width = Math.max(118, chip.length * 11 + 34);
    if (x + width > 1490) {
      x = 92;
      y += 58;
    }
    out.push(pill(x, y, chip, i % 3 === 0 ? "#eef5ff" : i % 3 === 1 ? "#edfdf8" : "#fff7ed", i % 3 === 0 ? "#c8dcff" : i % 3 === 1 ? "#b8eee0" : "#fed7aa", i % 3 === 0 ? COLORS.blue : i % 3 === 1 ? COLORS.green : COLORS.gold));
    x += width + 14;
  });
  return out.join("\n");
}

function renderBullets(scene) {
  if (!scene.bullets) return "";
  const cards = scene.bullets.slice(0, 6);
  const cols = cards.length <= 4 ? cards.length : 3;
  const w = (1420 - (cols - 1) * 24) / cols;
  const h = cards.length <= 3 ? 116 : 104;
  return cards.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 90 + col * (w + 24);
    const y = 430 + row * (h + 22);
    const accent = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.rose, COLORS.cyan, COLORS.slate][i % 6];
    return card(x, y, w, h, item, scene.id === "17" ? "Treasury pattern to promote into editable doctrine." : "Decision-grade context for the Lakeshore operating model.", accent);
  }).join("\n");
}

function svgForScene(scene) {
  const detail = renderTable(scene) || renderFlow(scene) || renderStats(scene) || renderChips(scene) || renderBullets(scene);
  const titleSize = scene.title.length > 44 ? 56 : 64;
  const titleLineHeight = scene.title.length > 44 ? 60 : 68;
  const titleLines = wrap(scene.title, scene.title.length > 44 ? 38 : 40).slice(0, 2);
  const titleSvg = titleLines
    .map((line, index) => `<text x="90" y="${244 + index * titleLineHeight}" font-family="Georgia, serif" font-size="${titleSize}" font-weight="900" fill="${COLORS.ink}">${esc(line)}</text>`)
    .join("\n");
  const subtitleY = 244 + titleLines.length * titleLineHeight + 24;
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.paper}"/>
    <rect width="${WIDTH}" height="82" fill="#000"/>
    ${logo()}
    <text x="1480" y="50" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="rgba(255,255,255,.78)">${scene.id} · DETAILED</text>
    <text x="90" y="172" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="4" fill="${COLORS.blue}">${esc(scene.eyebrow).toUpperCase()}</text>
    ${titleSvg}
    ${textBlock(scene.subtitle, 92, subtitleY, { size: 23, lineHeight: 31, maxChars: 94, maxLines: 2, fill: "#3c485a", weight: 550 })}
    ${detail}
    <rect x="90" y="762" width="1420" height="78" rx="16" fill="#0f172a"/>
    <text x="120" y="810" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900" fill="#fff">${esc(scene.highlight)}</text>
  </svg>`;
}

function writePlate(scene) {
  const svg = svgForScene(scene);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: { loadSystemFonts: true },
  });
  const png = resvg.render().asPng();
  const file = path.join(PLATE_DIR, `${scene.id}-${scene.eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`);
  fs.writeFileSync(file, png);
  return file;
}

function durationSeconds(file) {
  const out = run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return Number.parseFloat(out.trim());
}

async function createSpeech(client, scene, outFile) {
  if (fs.existsSync(outFile) && process.env.FORCE_AUDIO !== "1") return;
  const candidates = [
    { model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE, instructions: VOICE_INSTRUCTIONS },
    { model: "tts-1", voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE },
  ];
  let lastError;
  for (const candidate of candidates) {
    try {
      const response = await client.audio.speech.create({
        model: candidate.model,
        voice: candidate.voice,
        input: scene.narration,
        response_format: "mp3",
        ...(candidate.instructions ? { instructions: candidate.instructions } : {}),
      });
      fs.writeFileSync(outFile, Buffer.from(await response.arrayBuffer()));
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function createClip(scene, plateFile, audioFile, clipFile, entry) {
  const clipDuration = entry.clipDuration;
  const frames = Math.ceil(clipDuration * FPS);
  const holdFrames = Math.round(frames * 0.12);
  const rampFrames = Math.max(60, Math.round(frames * 0.55));
  const rampEnd = Math.min(frames - 1, holdFrames + rampFrames);
  const outStart = Math.min(frames - 2, Math.max(rampEnd + 1, Math.round(entry.audioDuration * FPS)));
  const z = scene.camera.zoom.toFixed(3);
  const p = `if(lte(on\\,${holdFrames})\\,0\\,if(lte(on\\,${rampEnd})\\,(on-${holdFrames})/${Math.max(1, rampEnd - holdFrames)}\\,1))`;
  const settle = `if(lte(on\\,${outStart})\\,1\\,1-0.78*(on-${outStart})/${Math.max(1, frames - outStart)})`;
  const zoom = `if(lte(on\\,${holdFrames})\\,1\\,if(lte(on\\,${rampEnd})\\,1+(${z}-1)*(on-${holdFrames})/${Math.max(1, rampEnd - holdFrames)}\\,if(lte(on\\,${outStart})\\,${z}\\,${z}-(${z}-1.045)*(on-${outStart})/${Math.max(1, frames - outStart)})))`;
  const x = `(800+(${scene.camera.x}-800)*${p}*${settle})-iw/zoom/2`;
  const y = `(450+(${scene.camera.y}-450)*${p}*${settle})-ih/zoom/2`;
  const fadeStart = Math.max(0, clipDuration - 0.25).toFixed(3);
  const filter = [
    `[0:v]scale=${WIDTH}:${HEIGHT},zoompan=z='${zoom}':x='${x}':y='${y}':d=${frames}:fps=${FPS}:s=${WIDTH}x${HEIGHT},format=yuv420p[v]`,
    `[1:a]apad=pad_dur=${PAD_SECONDS},atrim=0:${clipDuration.toFixed(3)},afade=t=out:st=${fadeStart}:d=0.2[a]`,
  ].join(";");
  run("ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", plateFile,
    "-i", audioFile,
    "-filter_complex", filter,
    "-map", "[v]",
    "-map", "[a]",
    "-r", String(FPS),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    clipFile,
  ]);
}

function concatClips(clipFiles, outputFile) {
  const listFile = path.join(OUT, "concat-list.txt");
  fs.writeFileSync(listFile, clipFiles.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outputFile]);
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env.azure.local"));
  fs.mkdirSync(PLATE_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(CLIP_DIR, { recursive: true });
  fs.mkdirSync(QA_DIR, { recursive: true });

  const plateFiles = scenes.map(writePlate);
  const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  if (!client && process.env.SKIP_AUDIO !== "1") {
    throw new Error("OPENAI_API_KEY was not found. Set SKIP_AUDIO=1 to render plates only.");
  }

  const timeline = [];
  const clipFiles = [];
  let cursor = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const audioFile = path.join(AUDIO_DIR, `scene-${scene.id}.mp3`);
    const clipFile = path.join(CLIP_DIR, `scene-${scene.id}.mp4`);
    process.stdout.write(`scene ${scene.id} audio... `);
    await createSpeech(client, scene, audioFile);
    const audioDuration = durationSeconds(audioFile);
    const clipDuration = Math.max(audioDuration + PAD_SECONDS, 7.0);
    const entry = {
      scene: scene.id,
      title: scene.title,
      plate: path.relative(ROOT, plateFiles[i]),
      voiceText: scene.narration,
      cameraTarget: scene.highlight,
      audioDuration: Number(audioDuration.toFixed(3)),
      clipDuration: Number(clipDuration.toFixed(3)),
      timelineStart: Number(cursor.toFixed(3)),
      timelineEnd: Number((cursor + clipDuration).toFixed(3)),
      gapAfterVoice: Number((clipDuration - audioDuration).toFixed(3)),
    };
    process.stdout.write("clip... ");
    createClip(scene, plateFiles[i], audioFile, clipFile, entry);
    timeline.push(entry);
    clipFiles.push(clipFile);
    cursor += clipDuration;
    process.stdout.write("done\n");
  }

  const outputFile = path.join(OUT, "LAKESHORE_AI_SUCCESS_PLATFORM_DETAILED_V2.mp4");
  concatClips(clipFiles, outputFile);
  fs.writeFileSync(path.join(OUT, "LAKESHORE_AI_SUCCESS_PLATFORM_DETAILED_V2_TIMELINE.json"), JSON.stringify({
    created: new Date().toISOString(),
    fps: FPS,
    frameSize: { width: WIDTH, height: HEIGHT },
    voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE,
    pronunciation: "AbarVa/Abarva is pronounced as one word: uh-BAR-vuh. Do not say A bar V A.",
    voiceInstructions: VOICE_INSTRUCTIONS,
    output: path.relative(ROOT, outputFile),
    scenes: timeline,
  }, null, 2) + "\n");

  const sampleList = path.join(OUT, "contact-sheet-list.txt");
  fs.writeFileSync(sampleList, plateFiles.map((file) => `file '${file.replace(/'/g, "'\\''")}'\nduration 0.1`).join("\n") + `\nfile '${plateFiles[plateFiles.length - 1].replace(/'/g, "'\\''")}'\n`);
  fs.writeFileSync(path.join(QA_DIR, "detailed-v2-scenes.json"), JSON.stringify(scenes.map((scene, index) => ({
    scene: scene.id,
    title: scene.title,
    plate: path.relative(ROOT, plateFiles[index]),
    narration: scene.narration,
  })), null, 2) + "\n");

  console.log(`wrote ${path.relative(process.cwd(), outputFile)}`);
  console.log(`duration ${cursor.toFixed(1)}s`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
