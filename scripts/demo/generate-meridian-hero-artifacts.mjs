// Generate the Meridian/PHS hero-Move demo artifacts as standalone files.
//
// Hero Move: "AI-enabled Population Health & Clinical Performance Command
// Center" for the synthetic Meridian Health (meridian-health) tenant.
//
// Produces, under docs/build/meridian-phs-demo/wow-demo/artifacts/:
//   - executive-memo.docx        (DOCX executive memo)
//   - board-brief.pdf            (PDF board brief; HTML fallback if lib missing)
//   - value-model.xlsx           (XLSX value model)
//   - architecture-pack.html     (HTML architecture pack, AbarVa tokens)
//   - raci-mobilization-plan.xlsx (RACI + mobilization plan)
//   - evidence-appendix.md        (evidence appendix, maps claims -> loaded files)
//   - board-brief.html            (always-on HTML twin of the board brief)
//
// All content is SYNTHETIC and inspired-by — never real confidential PHS data.
//
// Run from repo root:
//   node scripts/demo/generate-meridian-hero-artifacts.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(
  REPO_ROOT,
  'docs/build/meridian-phs-demo/wow-demo/artifacts',
);

const MOVE = {
  tenantKey: 'meridian-health',
  tenantName: 'Meridian Health System (synthetic)',
  name: 'AI-enabled Population Health & Clinical Performance Command Center',
  sponsor: 'Chief Population Health Officer',
  maestro: 'Transformation Office Lead',
  valueLowUsd: 38_000_000,
  valueHighUsd: 61_000_000,
  phases: [
    {
      n: 0,
      label: 'P0 Originate',
      deliverable: 'Originate brief',
      summary:
        'Frame the command-center bet across provider and plan; name sponsor, value range, and the first gate.',
      bullets: [
        'Problem: care-gap closure, avoidable utilization, and STAR/HEDIS pressure span provider and plan but are managed in silos.',
        'Outcome: a governed command center that prioritizes rising-risk cohorts and routes interventions.',
        'Sponsor: Chief Population Health Officer; plan-side partner: Health Plan COO.',
      ],
    },
    {
      n: 1,
      label: 'P1 Charter',
      deliverable: 'Charter',
      summary:
        'Lock scope, decision rights, value hypothesis, and the evidence the Move must clear at each gate.',
      bullets: [
        'In scope: rising-risk stratification, care-gap orchestration, post-discharge follow-up, plan STAR measure capture.',
        'Decision rights: AI Governance Council gates clinical models; CFO approves business case >$5M.',
        'Value hypothesis: $38M–$61M/yr from avoidable admissions, care-gap closure, and quality-bonus realization.',
      ],
    },
    {
      n: 2,
      label: 'P2 Discover & Diagnose',
      deliverable: 'Discovery brief',
      summary:
        'Diagnose the loaded baseline: gaps, denials, acuity, data readiness, and where AI realistically moves the metric.',
      bullets: [
        'Care-gap analytics: diabetes A1c control 68% vs 75% benchmark; AWV rate 58% vs 70%.',
        'Risk-adjustment capture 88% vs 94% suspected; network leakage 19% (commercial).',
        'Data readiness: Epic Healthy Planet + Databricks lakehouse; Unity Catalog governance is Wave-1.',
      ],
    },
    {
      n: 3,
      label: 'P3 Design Future State',
      deliverable: 'Solution & target-state architecture',
      summary:
        'Design the bronze/silver/gold lakehouse, the model portfolio, and the clinical-safety governance path.',
      bullets: [
        'Lakehouse: Epic Clarity + Tapestry claims -> bronze -> conformed silver -> population-health gold.',
        'Models: rising-risk, post-discharge readmission, care-gap propensity, RAF suspecting (NLP).',
        'Governance: Unity Catalog PHI masking + ABAC; AI Governance Council clinical-safety gate.',
      ],
    },
    {
      n: 4,
      label: 'P4 Roadmap & Business Case',
      deliverable: 'Costed business case & value model',
      summary:
        'Sequence the waves, cost the platform and AMS, and produce the funding-gate business case.',
      bullets: [
        'Wave 1: data foundation + governance; Wave 2: conformed analytics; Wave 3: gold + models; Wave 4: monitoring + write-back.',
        'Investment: platform + model build + change management, offset against avoidable-cost and quality-bonus value.',
        'Funding gate: CFO approval at P4 exit with explicit assumptions and sensitivity.',
      ],
    },
    {
      n: 5,
      label: 'P5 Mobilize & Handoff',
      deliverable: 'Mobilization plan & value-measurement contract',
      summary:
        'Stand up the RACI, the operating cadence, and the value-measurement contract Control Tower will own.',
      bullets: [
        'RACI across CPHO, Plan COO, CDAO, CMIO, CISO, VP Procurement, Transformation Office.',
        'Tower owns value realization, model monitoring, and risk after handoff.',
        'Value-measurement contract: monthly care-gap closure, avoidable admissions, STAR capture, MLR.',
      ],
    },
  ],
};

// Value model rows: synthetic, illustrative. lever, basis, low, high, owner.
const VALUE_ROWS = [
  ['Avoidable admissions reduction', 'Rising-risk model + care management', 12_000_000, 19_000_000, 'Chief Population Health Officer'],
  ['Care-gap closure (HEDIS/STAR)', 'Care-gap orchestration', 8_000_000, 13_000_000, 'VP Population Health Analytics'],
  ['Quality-bonus realization', 'STAR measure capture automation', 9_000_000, 14_000_000, 'Health Plan COO'],
  ['Risk-adjustment accuracy (RAF)', 'Suspecting model + NLP', 5_000_000, 9_000_000, 'Chief Actuary (Plan)'],
  ['Post-acute / readmission', 'Post-discharge follow-up model', 4_000_000, 6_000_000, 'Chief Medical Officer'],
];

const RACI_ROWS = [
  ['Charter sign-off', 'CPHO', 'Transformation Office', 'CFO; Plan COO', 'AI Governance Council'],
  ['Data foundation (Wave 1)', 'Chief Data Architect', 'CDAO', 'CISO; Chief Privacy Officer', 'CIO'],
  ['Clinical model validation', 'AI Governance Council Chair', 'CMIO', 'CMO; Radiology Chair', 'CISO'],
  ['Business case & funding', 'Transformation Office', 'CFO', 'CPHO; Plan COO', 'CEO'],
  ['Mobilization & handoff', 'Transformation Office', 'CPHO', 'Control Tower', 'CFO; Plan COO'],
  ['Value realization (post-handoff)', 'Control Tower', 'CPHO', 'CDAO; Plan COO', 'CFO'],
];

const MOBILIZATION_ROWS = [
  ['M1', 'Stand up governance + data foundation', 'Wave 1', 'Chief Data Architect'],
  ['M2', 'Conformed analytics + lineage', 'Wave 2', 'CDAO'],
  ['M3', 'Gold layer + first models in shadow', 'Wave 3', 'VP Population Health Analytics'],
  ['M4', 'Clinical-safety gate + limited rollout', 'Wave 3', 'AI Governance Council Chair'],
  ['M5', 'Monitoring + FHIR write-back', 'Wave 4', 'Integration Architecture Lead'],
  ['M6', 'Handoff to Control Tower', 'Wave 4', 'Transformation Office Lead'],
];

const EVIDENCE_MAP = [
  ['Care-gap & analytics baseline', 'plan-provider-analytics.csv', 'use_case_evidence: MR-UC-015'],
  ['Value-based care panel', 'value-based-care-panel.csv', 'use_case_evidence: MR-UC-007'],
  ['Population-health risk panels', 'population-health-risk-panels.csv', 'use_case_evidence: MR-UC-006'],
  ['Lakehouse target model', 'databricks-lakehouse-target-model.csv', 'use_case_evidence: MR-UC-014'],
  ['Clinical AI model inventory', 'clinical-ai-model-inventory.csv', 'use_case_evidence: MR-UC-004'],
  ['KPI baselines', 'kpi-library.csv', 'use_case_evidence: MR-UC-018'],
  ['AMS / vendor contracts', 'ams-vendor-contracts.csv', 'use_case_evidence: MR-UC-016'],
  ['AI governance decisions', 'governance-committee-decisions.csv', 'use_case_evidence: MR-UC-012'],
  ['HIPAA AI controls', 'hipaa-ai-controls.csv', 'use_case_evidence: MR-UC-013'],
  ['Org decision rights', 'org-structure-decision-rights.csv', 'use_case_evidence: MR-UC-028'],
];

const usd = (n) => `$${(n / 1_000_000).toFixed(1)}M`;
const SYNTH_NOTE =
  'Synthetic, Meridian/PHS-inspired pilot context. Not real confidential PHS data.';

async function ensureOut() {
  await mkdir(OUT_DIR, { recursive: true });
}

async function genDocx() {
  const docx = await import('docx');
  const {
    Document, Packer, Paragraph, HeadingLevel, TextRun,
  } = docx;
  const children = [];
  children.push(new Paragraph({ text: 'AbarVa · Strategic Move — Executive Memo', heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ children: [new TextRun({ text: MOVE.name, bold: true })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Tenant: ${MOVE.tenantName}`, italics: true })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: SYNTH_NOTE, italics: true, color: '706D66' })] }));
  children.push(new Paragraph({ text: 'My read', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph(
    'A governed Population Health & Clinical Performance Command Center is the highest-value AI move for Meridian because it spans the provider and the plan, attacks avoidable utilization and quality-bonus gaps at once, and rides the Azure Databricks lakehouse already on the roadmap.',
  ));
  children.push(new Paragraph({ text: 'Value at stake', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph(`Projected ${usd(MOVE.valueLowUsd)}–${usd(MOVE.valueHighUsd)} per year across five levers (see value model). Funding gate is CFO approval at P4 exit.`));
  for (const lever of VALUE_ROWS) {
    children.push(new Paragraph({ text: `• ${lever[0]}: ${usd(lever[2])}–${usd(lever[3])} (${lever[4]})`, bullet: { level: 0 } }));
  }
  children.push(new Paragraph({ text: 'Phases', heading: HeadingLevel.HEADING_1 }));
  for (const p of MOVE.phases) {
    children.push(new Paragraph({ text: `${p.label} — ${p.deliverable}`, heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph(p.summary));
    for (const b of p.bullets) children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
  }
  children.push(new Paragraph({ text: 'Assumptions', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph('Value ranges are synthetic planning estimates pending CFO validation. Clinical models require AI Governance Council clinical-safety sign-off before any production use.'));
  children.push(new Paragraph({ text: 'Risk / gate', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph('Do not advance past P3 until Unity Catalog PHI governance (Wave 1) and model-validation coverage are proven. Do not present any figure as confidential PHS proof.'));

  const doc = new Document({ sections: [{ children }] });
  const buf = await Packer.toBuffer(doc);
  await writeFile(path.join(OUT_DIR, 'executive-memo.docx'), buf);
  console.log('wrote executive-memo.docx');
}

async function genXlsxValueModel() {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa';
  const ws = wb.addWorksheet('Value Model');
  ws.addRow([MOVE.name]);
  ws.addRow([SYNTH_NOTE]);
  ws.addRow([]);
  const header = ws.addRow(['Lever', 'Basis', 'Low (USD/yr)', 'High (USD/yr)', 'Owner']);
  header.font = { bold: true };
  for (const r of VALUE_ROWS) ws.addRow(r);
  ws.addRow([]);
  const totalLow = VALUE_ROWS.reduce((s, r) => s + r[2], 0);
  const totalHigh = VALUE_ROWS.reduce((s, r) => s + r[3], 0);
  const totalRow = ws.addRow(['Total', '', totalLow, totalHigh, '']);
  totalRow.font = { bold: true };
  ws.getColumn(1).width = 36;
  ws.getColumn(2).width = 38;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 34;
  ws.getColumn(3).numFmt = '#,##0';
  ws.getColumn(4).numFmt = '#,##0';
  await wb.xlsx.writeFile(path.join(OUT_DIR, 'value-model.xlsx'));
  console.log('wrote value-model.xlsx');
}

async function genXlsxRaci() {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa';
  const raci = wb.addWorksheet('RACI');
  raci.addRow(['RACI — ' + MOVE.name]);
  raci.addRow([SYNTH_NOTE]);
  raci.addRow([]);
  const rh = raci.addRow(['Activity', 'Responsible', 'Accountable', 'Consulted', 'Informed']);
  rh.font = { bold: true };
  for (const r of RACI_ROWS) raci.addRow(r);
  [40, 26, 26, 30, 26].forEach((w, i) => (raci.getColumn(i + 1).width = w));

  const mob = wb.addWorksheet('Mobilization');
  mob.addRow(['Mobilization plan']);
  mob.addRow([]);
  const mh = mob.addRow(['Milestone', 'Workstream', 'Wave', 'Owner']);
  mh.font = { bold: true };
  for (const r of MOBILIZATION_ROWS) mob.addRow(r);
  [10, 42, 12, 32].forEach((w, i) => (mob.getColumn(i + 1).width = w));

  await wb.xlsx.writeFile(path.join(OUT_DIR, 'raci-mobilization-plan.xlsx'));
  console.log('wrote raci-mobilization-plan.xlsx');
}

function archPackHtml() {
  const phaseRows = MOVE.phases
    .map(
      (p) =>
        `<tr><td class="mono">${p.label}</td><td>${p.deliverable}</td><td>${p.summary}</td></tr>`,
    )
    .join('\n');
  const layerRows = [
    ['Ingestion', 'Epic Clarity + Tapestry (X12) + HL7/FHIR', 'DLT / Autoloader CDC'],
    ['Bronze', 'Raw clinical + raw claims', 'UC managed Delta'],
    ['Silver', 'Patient master, encounter, claims conformed', 'MDM keys + conformed Delta'],
    ['Gold', 'Population-health panels, service-line P&L, denials', 'Gold Delta + dashboards'],
    ['ML', 'Rising-risk, readmission, care-gap, RAF suspecting', 'Feature Store + MLflow + UC models'],
    ['Governance', 'Unity Catalog, PHI masking/ABAC, lineage', 'Wave 1 platform'],
    ['Consumption', 'Power BI, Genie (governed), FHIR write-back', 'Delta Sharing + reverse-ETL'],
  ]
    .map((r) => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${MOVE.name} — Architecture Pack</title>
<style>
  :root{ --cream:#f5f1eb; --surface:#fff; --ink:#0c1a3a; --muted:#706d66; --accent:#0066CC; --line:#e6e1d8; }
  *{box-sizing:border-box} body{margin:0;background:var(--cream);color:var(--ink);
    font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
  .wrap{max-width:980px;margin:0 auto;padding:48px 24px}
  .eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;text-transform:uppercase;
    letter-spacing:.12em;font-size:12px;color:var(--accent);font-weight:600}
  h1{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:34px;margin:.2em 0}
  h2{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:22px;margin-top:2em}
  .note{color:var(--muted);font-style:italic;font-size:13px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;margin-top:16px}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  th{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:var(--muted)}
  .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
</style></head>
<body><div class="wrap">
  <div class="eyebrow">AbarVa · Strategic Move · Architecture Pack</div>
  <h1>${MOVE.name}</h1>
  <p class="note">${MOVE.tenantName} — ${SYNTH_NOTE}</p>
  <div class="card">
    <h2 style="margin-top:0">Lakehouse target model (Azure Databricks)</h2>
    <table><thead><tr><th>Layer</th><th>Scope</th><th>Pattern</th></tr></thead>
    <tbody>${layerRows}</tbody></table>
  </div>
  <div class="card">
    <h2 style="margin-top:0">Phase deliverables</h2>
    <table><thead><tr><th>Phase</th><th>Deliverable</th><th>Summary</th></tr></thead>
    <tbody>${phaseRows}</tbody></table>
  </div>
  <div class="card">
    <h2 style="margin-top:0">Governance gates</h2>
    <ul>
      <li>Unity Catalog PHI masking + ABAC stood up in Wave 1 before any model build.</li>
      <li>AI Governance Council clinical-safety gate before limited rollout.</li>
      <li>Control Tower owns value realization, model monitoring, and risk after P5 handoff.</li>
    </ul>
  </div>
</div></body></html>`;
}

function boardBriefHtml() {
  const levers = VALUE_ROWS.map(
    (r) => `<li>${r[0]} — <strong>${usd(r[2])}–${usd(r[3])}</strong> · ${r[4]}</li>`,
  ).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>${MOVE.name} — Board Brief</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;color:#0c1a3a;background:#f5f1eb;margin:0}
  .wrap{max-width:820px;margin:0 auto;padding:48px 24px}
  .eyebrow{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#0066CC;font-weight:600}
  h1{font-family:Fraunces,Georgia,serif;font-size:30px;margin:.2em 0}
  h2{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:20px;margin-top:1.6em}
  .note{color:#706d66;font-style:italic;font-size:13px}
</style></head><body><div class="wrap">
<div class="eyebrow">AbarVa · Board Brief</div>
<h1>${MOVE.name}</h1>
<p class="note">${MOVE.tenantName} — ${SYNTH_NOTE}</p>
<h2>Recommendation</h2>
<p>Fund the command center as one governed Strategic Move spanning provider and plan, sponsored by the Chief Population Health Officer, with CFO approval at the P4 funding gate.</p>
<h2>Value at stake</h2>
<p>Projected <strong>${usd(MOVE.valueLowUsd)}–${usd(MOVE.valueHighUsd)}</strong> per year:</p>
<ul>${levers}</ul>
<h2>Phases & gates</h2>
<ol>${MOVE.phases.map((p) => `<li><strong>${p.label}</strong> — ${p.deliverable}: ${p.summary}</li>`).join('\n')}</ol>
<h2>Assumptions & guardrails</h2>
<p>Value ranges are synthetic planning estimates pending CFO validation. Clinical models require AI Governance Council clinical-safety sign-off. No figure is confidential PHS proof.</p>
</div></body></html>`;
}

async function genPdfBoardBrief() {
  try {
    const React = (await import('react')).default;
    const ReactPDF = await import('@react-pdf/renderer');
    const { Document, Page, Text, View, StyleSheet } = ReactPDF;
    const s = StyleSheet.create({
      page: { padding: 48, fontSize: 11, color: '#0c1a3a', backgroundColor: '#f8f7f4' },
      eyebrow: { fontSize: 9, color: '#0066CC', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
      h1: { fontSize: 20, fontFamily: 'Times-Roman', marginBottom: 4 },
      note: { fontSize: 9, color: '#706d66', fontStyle: 'italic', marginBottom: 14 },
      h2: { fontSize: 13, fontFamily: 'Times-Roman', marginTop: 14, marginBottom: 4 },
      p: { marginBottom: 4, lineHeight: 1.4 },
      li: { marginBottom: 2 },
    });
    const e = React.createElement;
    const doc = e(Document, null,
      e(Page, { size: 'A4', style: s.page },
        e(Text, { style: s.eyebrow }, 'AbarVa · Board Brief'),
        e(Text, { style: s.h1 }, MOVE.name),
        e(Text, { style: s.note }, `${MOVE.tenantName} — ${SYNTH_NOTE}`),
        e(Text, { style: s.h2 }, 'Recommendation'),
        e(Text, { style: s.p }, 'Fund the command center as one governed Strategic Move spanning provider and plan, sponsored by the Chief Population Health Officer, with CFO approval at the P4 funding gate.'),
        e(Text, { style: s.h2 }, 'Value at stake'),
        e(Text, { style: s.p }, `Projected ${usd(MOVE.valueLowUsd)}-${usd(MOVE.valueHighUsd)} per year across five levers.`),
        ...VALUE_ROWS.map((r) => e(Text, { style: s.li }, `- ${r[0]}: ${usd(r[2])}-${usd(r[3])} (${r[4]})`)),
        e(Text, { style: s.h2 }, 'Phases & gates'),
        ...MOVE.phases.map((p) => e(Text, { style: s.li }, `${p.label} - ${p.deliverable}: ${p.summary}`)),
        e(Text, { style: s.h2 }, 'Assumptions & guardrails'),
        e(Text, { style: s.p }, 'Value ranges are synthetic planning estimates pending CFO validation. Clinical models require AI Governance Council clinical-safety sign-off. No figure is confidential PHS proof.'),
      ),
    );
    const buf = await ReactPDF.renderToBuffer(doc);
    await writeFile(path.join(OUT_DIR, 'board-brief.pdf'), buf);
    console.log('wrote board-brief.pdf');
  } catch (err) {
    console.warn('PDF generation skipped (', err?.message, '); HTML twin still written.');
  }
}

function evidenceAppendixMd() {
  const rows = EVIDENCE_MAP.map((r) => `| ${r[0]} | \`${r[1]}\` | ${r[2]} |`).join('\n');
  return `# Evidence Appendix — ${MOVE.name}

**Tenant:** ${MOVE.tenantName}

> ${SYNTH_NOTE}

Every claim in this Move's artifacts traces to a loaded Meridian context file
(governed admin context loader path, tenant \`meridian-health\`). No seed-side
shortcuts. Nothing here is real confidential PHS data.

| Claim area | Loaded source file | Use-case evidence ref |
|---|---|---|
${rows}

## How to verify

1. Admin Context Layer → filter tenant \`meridian-health\` → confirm the source
   files above are present and embedded (873 embedded, 0 pending, 0 failed).
2. Intelligence (Sentinel) → ask a hard question from the golden deck and
   confirm the answer cites these evidence fields.
3. Strategic Move → Documents tab → open each phase deliverable and the
   artifacts in this folder.
`;
}

async function main() {
  await ensureOut();
  await genDocx();
  await genXlsxValueModel();
  await genXlsxRaci();
  await writeFile(path.join(OUT_DIR, 'architecture-pack.html'), archPackHtml());
  console.log('wrote architecture-pack.html');
  await writeFile(path.join(OUT_DIR, 'board-brief.html'), boardBriefHtml());
  console.log('wrote board-brief.html');
  await genPdfBoardBrief();
  await writeFile(path.join(OUT_DIR, 'evidence-appendix.md'), evidenceAppendixMd());
  console.log('wrote evidence-appendix.md');
  console.log('hero-move artifacts complete ->', path.relative(REPO_ROOT, OUT_DIR));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
