#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { Resvg } = require("@resvg/resvg-js");
const OpenAI = require("openai");

const ROOT = path.resolve(__dirname);
const ASSET_DIR = path.resolve(ROOT, "../assets");
const OUT = path.join(ROOT, "detailed-render");
const PLATE_DIR = path.join(OUT, "plates");
const AUDIO_DIR = path.join(OUT, "audio");
const CLIP_DIR = path.join(OUT, "clips");
const QA_DIR = path.join(OUT, "qa");
const FPS = 30;
const WIDTH = 1600;
const HEIGHT = 900;
const PAD_SECONDS = 1.25;
const OUTPUT_VERSION = "V3";
const DEFAULT_VOICE = "shimmer";
const VOICE_INSTRUCTIONS =
  "Warm, polished, human female advisor voice with gentle energy and real empathy. Pronounce the brand name AbarVa as one natural word: 'uh-BAR-vuh' / 'Abarva'. Never spell it out, never say 'A bar V A', and do not make the first A stand alone. Sound like a trusted senior operator explaining a thoughtful plan to a client, not a commercial narrator. Use calm confidence, natural pauses, and no hype.";

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
    bullets: ["Supply chain", "Brand services", "Consumer products", "Workplace services"],
    bulletBodies: [
      "Program margin, sourcing spread, inventory turns, freight discipline.",
      "Fees, fulfillment margin, analytics, renewal scope control.",
      "Retail/DTC margin, promotion ROI, turns, return-rate control.",
      "Route density, uptime, cash capture, labor productivity.",
    ],
    highlight: "Money is made in operations, not in a slide.",
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    title: "The secret sauce is the living context graph.",
    subtitle: "AbarVa connects identity, tenant scope, operating facts, evidence, workflow state, corpus doctrine, and value claims.",
    narration:
      "The secret sauce is not a document dump. It is a living context graph. Abarva connects who is asking, which tenant they belong to, which company and system the fact came from, which artifact supports it, which corpus pattern applies, who owns the next decision, and what value claim is still unproven.",
    contextGraph: true,
    screenshot: "../assets/01-setup-cxo-intel-index.png",
    highlight: "The agent is grounded by relationships, permissions, evidence, and workflow state.",
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    id: "06A",
    eyebrow: "Product proof",
    title: "Context becomes workflow in the app.",
    subtitle: "Every answer should land somewhere: a gate, artifact, owner, Source event, or value-ledger entry.",
    narration:
      "This is where Abarva separates from direct model access. Setup loads client context. Intelligence answers with evidence gaps. Moves turns recommendations into gates and artifacts. Source turns insight into buying and vendor decisions. Tower proves the portfolio story across value, risk, and execution state.",
    screenshot: "../assets/03-moves-kyriba-documents.png",
    workflowProof: true,
    callouts: ["Context loaded", "Evidence gap named", "Move gate created", "Artifact persisted", "Tower proof updated"],
    highlight: "The product proof is workflow plus evidence, not chat output.",
    camera: { x: 800, y: 450, zoom: 1.0 },
  },
  {
    id: "06B",
    eyebrow: "First 90 days",
    title: "Kyriba is the wedge, not the whole AI strategy.",
    subtitle: "Northshore should define a corporate AI agenda in parallel: treasury, growth, cost, risk, and modernization.",
    narration:
      "Kyriba is the right wedge because treasury modernization exposes operating truth quickly. But the first ninety days should also define Northshore's corporate AI strategy: which use cases create value, which data products are required, which CXO owns each lane, and which artifacts prove progress.",
    strategy90: true,
    highlight: "The first 90 days should create an AI operating agenda, not one isolated pilot.",
    camera: { x: 800, y: 450, zoom: 1.0 },
  },
  {
    id: "06C",
    eyebrow: "IT and data modernization",
    title: "AI needs a cleaner operating technology estate.",
    subtitle: "The context layer should expose modernization work that improves AI quality and lowers execution cost.",
    narration:
      "Abarva should use the AI agenda to pull IT and data modernization forward. The early opportunities are application rationalization, CMDB cleanup, ERP and treasury integration, analytics data products, SaaS and SI spend leverage, identity and access controls, and a cleaner contract and vendor spine.",
    modernization: true,
    highlight: "Modernization becomes sequenced by AI value and execution risk.",
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    camera: { x: 800, y: 450, zoom: 1.0 },
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
    bulletBodies: [
      "Reduce bank sprawl, improve H2H readiness, compress fees.",
      "Control integration scope, acceptance criteria, change orders.",
      "Unify entitlements, renewals, utilization, enterprise terms.",
      "Benchmark fees, standardize scope, rationalize advisors.",
      "Reduce concentration risk while improving coverage evidence.",
      "Turn renewal calendar into negotiated savings and risk control.",
    ],
    highlight: "Source turns intelligence into buying power.",
    camera: { x: 800, y: 500, zoom: 1.12 },
  },
  {
    id: "20",
    eyebrow: "Product proof flow",
    title: "The app must show the actual work.",
    subtitle: "The buyer should see the chain from loaded context to answer, artifact, decision, and proof.",
    narration:
      "The demo needs to show the work, not just the answer. Setup loads the Lakeshore context. Intelligence explains what is known and missing. Moves runs the Kyriba readiness gates. Source creates commercial decision artifacts. Tower shows the value ledger and risk concentrations without mixing forecast with realized proof.",
    screenshot: "../assets/10-source-decision-artifacts-focus.png",
    workProof: true,
    callouts: ["Context", "Answer", "Artifact", "Decision", "Proof"],
    flow: ["Setup", "Intelligence", "Moves", "Source", "Tower", "Board pack"],
    highlight: "Abarva is persisted workflow, not a nicer chat window.",
    camera: { x: 820, y: 470, zoom: 1.1 },
  },
  {
    id: "21",
    eyebrow: "Captured interactions",
    title: "The answers improve because the agent has operating memory.",
    subtitle: "The proof pack captured 100 hard questions with answers, evidence references, scores, and issue taxonomy.",
    narration:
      "The most interesting proof is the interaction quality. A raw model can produce plausible treasury advice. Abarva answers inside a governed frame: what Lakeshore context is loaded, which Kyriba artifact is still in review, what evidence reference supports the answer, what value claim is not yet realized, and what workflow action should follow. The current hard-question pack captured one hundred answers: sixty pass, forty watch, zero fail. The watch items are useful because they show exactly where owner specificity, finance depth, or evidence references should be improved next.",
    stats: [
      ["100", "captured CXO hard questions"],
      ["60", "pass"],
      ["40", "watch items to improve"],
      ["0", "hard fails"],
    ],
    highlight: "The QA pack turns answer quality into an improvable operating system.",
    camera: { x: 800, y: 450, zoom: 1.0 },
  },
  {
    id: "22",
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
    id: "23",
    eyebrow: "Six-month roadmap",
    title: "Build the AI strategy while proving the Kyriba wedge.",
    subtitle: "Month by month: AI opportunity scan, use-case portfolio, governance, pilots, Source value events, modernization dependencies, and board-ready scale plan.",
    narration:
      "The roadmap cannot read like Kyriba support only. Month one loads context and builds the AI opportunity inventory. Month two defines the AI strategy, use-case portfolio, governance model, and editable corpus. Month three de-risks Kyriba and designs the first use cases: cash forecasting readiness, variance detection, covenant headroom, vendor leverage, and operating exceptions. Month four launches Source value events and data and IT modernization dependencies. Month five executes pilots and captures reusable artifacts. Month six gives the board a scale roadmap, value ledger, and operating model.",
    flow: ["M1 AI scan", "M2 strategy", "M3 Kyriba + AI", "M4 pilots + Source", "M5 execute + reuse", "M6 scale plan"],
    highlight: "Six months should leave Lakeshore with an AI operating model, not a one-off demo.",
    camera: { x: 800, y: 480, zoom: 1.1 },
  },
  {
    id: "24",
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

function imageDataUri(relativePath) {
  const file = path.resolve(ROOT, relativePath);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function assetDataUri(fileName) {
  const file = path.join(ASSET_DIR, fileName);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
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
  const src = assetDataUri("abarva-nav-dark-compact-28px-2x.png");
  return `
    <g transform="translate(54 27)">
      <image x="0" y="0" width="124" height="28" href="${src}" xlink:href="${src}" preserveAspectRatio="xMinYMid meet"/>
      <text x="196" y="25" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="760" fill="rgba(255,255,255,.78)">Lakeshore</text>
    </g>`;
}

function card(x, y, w, h, title, body, accent = COLORS.blue) {
  const compact = h <= 110;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff" stroke="${COLORS.line}" />
    <rect x="${x}" y="${y}" width="7" height="${h}" rx="4" fill="${accent}" />
    ${textBlock(title, x + 24, y + 36, { size: compact ? 21 : 23, lineHeight: compact ? 24 : 27, weight: 850, fill: COLORS.ink, maxChars: Math.max(14, Math.floor((w - 48) / 12)), maxLines: 2 })}
    ${textBlock(body, x + 24, y + (compact ? 75 : 83), { size: compact ? 15 : 18, lineHeight: compact ? 18 : 22, maxChars: Math.floor((w - 50) / (compact ? 8.3 : 10)), maxLines: compact ? 2 : 3, fill: COLORS.muted })}
  `;
}

function imagePanel(scene, x, y, w, h, src, title, body) {
  const id = `clip-${scene.id.replace(/[^a-zA-Z0-9]/g, "-")}-${Math.round(x)}-${Math.round(y)}`;
  const image = imageDataUri(src);
  return `
    <defs>
      <clipPath id="${id}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
      </clipPath>
    </defs>
    <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="20" fill="#fff" stroke="${COLORS.line}"/>
    <image x="${x}" y="${y}" width="${w}" height="${h}" href="${image}" xlink:href="${image}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y + h - 88}" width="${w}" height="88" fill="rgba(15,23,42,.88)" clip-path="url(#${id})"/>
    <text x="${x + 24}" y="${y + h - 51}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" fill="#fff">${esc(title)}</text>
    ${textBlock(body, x + 24, y + h - 24, { size: 15, lineHeight: 19, weight: 650, fill: "rgba(255,255,255,.84)", maxChars: Math.floor((w - 48) / 8), maxLines: 2 })}
  `;
}

function plainImagePanel(scene, x, y, w, h, src, title, fit = "meet") {
  const id = `plain-clip-${scene.id.replace(/[^a-zA-Z0-9]/g, "-")}-${Math.round(x)}-${Math.round(y)}`;
  const image = imageDataUri(src);
  return `
    <defs>
      <clipPath id="${id}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
      </clipPath>
    </defs>
    <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="20" fill="#fff" stroke="${COLORS.line}"/>
    <image x="${x}" y="${y}" width="${w}" height="${h}" href="${image}" xlink:href="${image}" preserveAspectRatio="xMidYMid ${fit}" clip-path="url(#${id})"/>
    ${title ? `<text x="${x}" y="${y - 18}" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="950" letter-spacing="2" fill="${COLORS.blue}">${esc(title).toUpperCase()}</text>` : ""}
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

function renderContextGraph(scene) {
  if (!scene.contextGraph) return "";
  const columns = [
    {
      x: 120,
      w: 285,
      title: "Access frame",
      color: COLORS.blue,
      items: ["Tenant boundary", "Persona + role", "Decision rights"],
    },
    {
      x: 455,
      w: 320,
      title: "Operating facts",
      color: COLORS.gold,
      items: ["HoldCo / PortCo", "Systems + CMDB", "Banks + controls"],
    },
    {
      x: 825,
      w: 310,
      title: "Proof spine",
      color: COLORS.green,
      items: ["Artifacts + evidence", "Workflow state", "Process owners"],
    },
    {
      x: 1185,
      w: 285,
      title: "Decision layer",
      color: COLORS.rose,
      items: ["Corpus patterns", "Value claims", "Next action"],
    },
  ];
  let out = `
    <defs>
      <linearGradient id="contextFlow" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="#dbeafe" stop-opacity=".55"/>
        <stop offset="52%" stop-color="#ccfbf1" stop-opacity=".48"/>
        <stop offset="100%" stop-color="#fef3c7" stop-opacity=".55"/>
      </linearGradient>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="${COLORS.line}" />
      </marker>
    </defs>
    <rect x="90" y="455" width="1420" height="278" rx="22" fill="#fff" stroke="${COLORS.line}"/>
    <path d="M250 630 C430 548 604 548 760 630 C916 712 1100 712 1324 630" fill="none" stroke="url(#contextFlow)" stroke-width="24" stroke-linecap="round"/>
    <rect x="494" y="478" width="612" height="48" rx="24" fill="${COLORS.ink}"/>
    <text x="800" y="509" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" fill="#fff">AbarVa governed intelligence layer</text>
  `;
  columns.forEach((column) => {
    out += `
      <rect x="${column.x}" y="542" width="${column.w}" height="158" rx="18" fill="rgba(255,255,255,.95)" stroke="${COLORS.line}"/>
      <rect x="${column.x}" y="542" width="${column.w}" height="8" rx="4" fill="${column.color}"/>
      <text x="${column.x + 22}" y="584" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" fill="${COLORS.ink}">${esc(column.title)}</text>
    `;
    column.items.forEach((item, index) => {
      const y = 616 + index * 34;
      out += `
        <circle cx="${column.x + 30}" cy="${y - 6}" r="6" fill="${column.color}"/>
        <text x="${column.x + 48}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="760" fill="${COLORS.muted}">${esc(item)}</text>
      `;
    });
  });
  out += `
    <path d="M405 621 L455 621" stroke="${COLORS.line}" stroke-width="2.5" marker-end="url(#arrow)"/>
    <path d="M775 621 L825 621" stroke="${COLORS.line}" stroke-width="2.5" marker-end="url(#arrow)"/>
    <path d="M1135 621 L1185 621" stroke="${COLORS.line}" stroke-width="2.5" marker-end="url(#arrow)"/>
  `;
  return out;
}

function renderScreenshotScene(scene) {
  if (!scene.screenshot || scene.contextGraph || scene.workflowProof || scene.workProof) return "";
  const out = [
    imagePanel(scene, 92, 405, 900, 330, scene.screenshot, "Live product screen", scene.subtitle),
  ];
  const callouts = scene.callouts || [];
  callouts.forEach((item, i) => {
    const y = 430 + i * 90;
    const color = [COLORS.blue, COLORS.green, COLORS.gold][i % 3];
    out.push(`
      <rect x="1040" y="${y}" width="390" height="64" rx="16" fill="#fff" stroke="${COLORS.line}"/>
      <circle cx="1073" cy="${y + 32}" r="15" fill="${color}"/>
      <text x="1073" y="${y + 38}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" fill="#fff">${i + 1}</text>
      <text x="1102" y="${y + 39}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="850" fill="${COLORS.ink}">${esc(item)}</text>
    `);
  });
  return out.join("\n");
}

function renderWorkflowProof(scene) {
  if (!scene.workflowProof || !scene.screenshot) return "";
  const steps = [
    ["Context loaded", "Tenant, persona, HoldCo facts, systems, banks, contracts, and artifacts."],
    ["Evidence gap named", "The agent says what is still missing before anyone relies on the answer."],
    ["Move gate created", "Recommendation becomes owner, phase, readiness criteria, and next gate."],
    ["Artifact persisted", "Strategy memo, decision dossier, checklist, or steering pack is saved."],
    ["Tower proof updated", "Status, risk, and value proof roll up without counting unsupported claims."],
  ];
  let out = plainImagePanel(scene, 92, 422, 600, 292, scene.screenshot, "live move document workspace");
  out += `
    <rect x="92" y="728" width="600" height="32" rx="16" fill="#fff" stroke="${COLORS.line}"/>
    <text x="120" y="750" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" fill="${COLORS.ink}">Actual work: generated artifacts stay human-reviewed and gate-bound.</text>
  `;
  steps.forEach(([title, body], i) => {
    const x = 746;
    const y = 414 + i * 66;
    const color = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.rose, COLORS.cyan][i];
    out += `
      <rect x="${x}" y="${y}" width="676" height="54" rx="15" fill="#fff" stroke="${COLORS.line}"/>
      <circle cx="${x + 28}" cy="${y + 27}" r="15" fill="${color}"/>
      <text x="${x + 28}" y="${y + 33}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="950" fill="#fff">${i + 1}</text>
      <text x="${x + 56}" y="${y + 24}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="920" fill="${COLORS.ink}">${esc(title)}</text>
      ${textBlock(body, x + 56, y + 43, { size: 13, lineHeight: 16, weight: 640, fill: COLORS.muted, maxChars: 82, maxLines: 1 })}
    `;
    if (i < steps.length - 1) {
      out += `<line x1="${x + 28}" y1="${y + 54}" x2="${x + 28}" y2="${y + 66}" stroke="${color}" stroke-width="3" opacity=".34"/>`;
    }
  });
  return out;
}

function renderWorkProof(scene) {
  if (!scene.workProof || !scene.screenshot) return "";
  const proof = [
    ["1", "Setup", "CXO bundles, systems, banks, contracts, CMDB, artifacts loaded."],
    ["2", "Intelligence", "Answer names known facts, missing proof, and relevant pattern."],
    ["3", "Moves", "Recommendation becomes gates, owners, checklist, decision record."],
    ["4", "Source", "Vendor action becomes RFP, BAFO, negotiation, selection, proof."],
    ["5", "Tower", "Forecast, approved, negotiated, realized value stay separate."],
  ];
  let out = `
    <rect x="90" y="420" width="610" height="302" rx="22" fill="#fff" stroke="${COLORS.line}"/>
    <text x="122" y="464" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="950" fill="${COLORS.ink}">What the demo has to prove</text>
    <text x="122" y="496" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="680" fill="${COLORS.muted}">Not a nicer answer. A persisted operating loop.</text>
  `;
  proof.forEach(([number, title, body], i) => {
    const y = 535 + i * 34;
    const color = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.rose, COLORS.cyan][i];
    out += `
      <circle cx="130" cy="${y - 5}" r="13" fill="${color}"/>
      <text x="130" y="${y}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="950" fill="#fff">${number}</text>
      <text x="158" y="${y}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="920" fill="${COLORS.ink}">${esc(title)}</text>
      ${textBlock(body, 258, y, { size: 13, lineHeight: 15, weight: 620, fill: COLORS.muted, maxChars: 58, maxLines: 1 })}
    `;
  });
  out += plainImagePanel(scene, 760, 430, 680, 280, scene.screenshot, "live source decision screen", "slice");
  out += `
    <rect x="760" y="726" width="680" height="34" rx="17" fill="#fff" stroke="${COLORS.line}"/>
    <text x="790" y="748" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" fill="${COLORS.ink}">The screen should show artifacts, gates, evidence status, and value state.</text>
  `;
  return out;
}

function renderStrategy90(scene) {
  if (!scene.strategy90) return "";
  const lanes = [
    ["Treasury / Kyriba", "Bank connectivity, ERP feeds, entity hierarchy, cash history, IC, covenants.", COLORS.blue],
    ["Growth AI", "Customer programs, pricing, cross-sell, retention, campaign ROI, service recovery.", COLORS.green],
    ["Cost AI", "Vendor overlap, renewal leverage, SI scope control, audit/advisory, cyber insurance.", COLORS.gold],
    ["Risk and controls", "BEC controls, access risk, covenant monitoring, policy exceptions, audit evidence.", COLORS.rose],
    ["IT/data foundation", "CMDB, app rationalization, data products, identity, analytics modernization.", COLORS.cyan],
  ];
  let out = `<rect x="90" y="430" width="1420" height="294" rx="22" fill="#fff" stroke="${COLORS.line}"/>`;
  lanes.forEach(([title, body, color], i) => {
    const x = 120 + i * 276;
    out += `
      <rect x="${x}" y="462" width="242" height="190" rx="18" fill="#f9fafb" stroke="${COLORS.line}"/>
      <rect x="${x}" y="462" width="242" height="9" rx="5" fill="${color}"/>
      <text x="${x + 20}" y="510" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="900" fill="${COLORS.ink}">${esc(title)}</text>
      ${textBlock(body, x + 20, 550, { size: 16, lineHeight: 21, weight: 620, fill: COLORS.muted, maxChars: 24, maxLines: 4 })}
    `;
  });
  out += `
    <line x1="120" y1="680" x2="1482" y2="680" stroke="${COLORS.ink}" stroke-width="4" opacity=".85"/>
    <text x="120" y="710" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" letter-spacing="2" fill="${COLORS.blue}">30 DAYS: FACT BASE</text>
    <text x="555" y="710" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" letter-spacing="2" fill="${COLORS.green}">60 DAYS: PRIORITIZED USE CASES</text>
    <text x="1040" y="710" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" letter-spacing="2" fill="${COLORS.gold}">90 DAYS: FUNDED ROADMAP</text>
  `;
  return out;
}

function renderModernization(scene) {
  if (!scene.modernization) return "";
  const items = [
    ["CMDB + app rationalization", "Know what exists, who owns it, cost, risk, and duplicate capability."],
    ["Data products", "Treasury, vendor, customer, contract, entity, and value-ledger domains."],
    ["Integration spine", "ERP, TMS/Kyriba, WMS, CRM, HCM, bank data, and document evidence."],
    ["Spend leverage", "SaaS, SI partners, cloud, audit/advisory, cyber, and renewals."],
    ["Controls foundation", "Identity, access, BEC, signers, RLS, auditability, and exceptions."],
    ["Analytics modernization", "From static reports to governed decisions and reusable AI patterns."],
  ];
  return items.map(([title, body], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 92 + col * 472;
    const y = 430 + row * 126;
    const color = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.rose, COLORS.cyan, COLORS.slate][i];
    return `
      <rect x="${x}" y="${y}" width="438" height="100" rx="18" fill="#fff" stroke="${COLORS.line}"/>
      <rect x="${x}" y="${y}" width="10" height="100" rx="5" fill="${color}"/>
      <text x="${x + 30}" y="${y + 40}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="900" fill="${COLORS.ink}">${esc(title)}</text>
      ${textBlock(body, x + 30, y + 73, { size: 17, lineHeight: 22, weight: 610, fill: COLORS.muted, maxChars: 43, maxLines: 2 })}
    `;
  }).join("\n");
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
    const body = scene.bulletBodies?.[i] || (scene.id === "17" ? "Treasury pattern to promote into editable doctrine." : "Decision-grade context for the Lakeshore operating model.");
    return card(x, y, w, h, item, body, accent);
  }).join("\n");
}

function svgForScene(scene) {
  const detail = renderContextGraph(scene) || renderWorkflowProof(scene) || renderWorkProof(scene) || renderScreenshotScene(scene) || renderStrategy90(scene) || renderModernization(scene) || renderTable(scene) || renderFlow(scene) || renderStats(scene) || renderChips(scene) || renderBullets(scene);
  const titleSize = scene.title.length > 44 ? 50 : 58;
  const titleLineHeight = scene.title.length > 44 ? 54 : 62;
  const titleTop = 222;
  const titleLines = wrap(scene.title, scene.title.length > 44 ? 34 : 39).slice(0, 2);
  const titleSvg = titleLines
    .map((line, index) => `<text x="90" y="${titleTop + index * titleLineHeight}" font-family="Georgia, serif" font-size="${titleSize}" font-weight="900" fill="${COLORS.ink}">${esc(line)}</text>`)
    .join("\n");
  const subtitleY = titleTop + titleLines.length * titleLineHeight + 22;
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.paper}"/>
    <rect width="${WIDTH}" height="82" fill="#000"/>
    ${logo()}
    <text x="1480" y="50" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="rgba(255,255,255,.78)">${scene.id} · DETAILED</text>
    <text x="90" y="172" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="4" fill="${COLORS.blue}">${esc(scene.eyebrow).toUpperCase()}</text>
    ${titleSvg}
    ${textBlock(scene.subtitle, 92, subtitleY, { size: 21, lineHeight: 29, maxChars: 98, maxLines: 2, fill: "#3c485a", weight: 550 })}
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

function createClip(plateFile, audioFile, clipFile, entry) {
  const clipDuration = entry.clipDuration;
  const fadeStart = Math.max(0, clipDuration - 0.25).toFixed(3);
  const filter = [
    `[0:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p[v]`,
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
    "-t", clipDuration.toFixed(3),
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
  fs.rmSync(PLATE_DIR, { recursive: true, force: true });
  fs.rmSync(CLIP_DIR, { recursive: true, force: true });
  fs.mkdirSync(PLATE_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(CLIP_DIR, { recursive: true });
  fs.mkdirSync(QA_DIR, { recursive: true });

  const plateFiles = scenes.map(writePlate);
  if (process.env.PLATES_ONLY === "1") {
    fs.writeFileSync(path.join(QA_DIR, `detailed-${OUTPUT_VERSION.toLowerCase()}-scenes.json`), JSON.stringify(scenes.map((scene, index) => ({
      scene: scene.id,
      title: scene.title,
      plate: path.relative(ROOT, plateFiles[index]),
      narration: scene.narration,
    })), null, 2) + "\n");
    console.log(`wrote ${plateFiles.length} plates`);
    return;
  }
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
    createClip(plateFiles[i], audioFile, clipFile, entry);
    timeline.push(entry);
    clipFiles.push(clipFile);
    cursor += clipDuration;
    process.stdout.write("done\n");
  }

  const outputFile = path.join(OUT, `LAKESHORE_AI_SUCCESS_PLATFORM_DETAILED_${OUTPUT_VERSION}.mp4`);
  concatClips(clipFiles, outputFile);
  fs.writeFileSync(path.join(OUT, `LAKESHORE_AI_SUCCESS_PLATFORM_DETAILED_${OUTPUT_VERSION}_TIMELINE.json`), JSON.stringify({
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
  fs.writeFileSync(path.join(QA_DIR, `detailed-${OUTPUT_VERSION.toLowerCase()}-scenes.json`), JSON.stringify(scenes.map((scene, index) => ({
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
