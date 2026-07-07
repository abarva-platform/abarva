// Generate the REPRESENTATIVE / SYNTHETIC SkyHarbor qualitative current-state
// document set for the review-required document path. NOT real client data.
//   - KPI baseline       → XLSX (clean table; should auto-promote on schema check)
//   - Stakeholder map     → DOCX (review-required)
//   - Operating model     → PPTX (review-required)
// Run: node docs/build/moves-design/representative-data/generate-synthetic-docs.mjs
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import PptxGenJS from "pptxgenjs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const BANNER = "REPRESENTATIVE / SYNTHETIC — not real SkyHarbor client data";

// ── 1) KPI baseline (XLSX) — clean KPI table, designed to auto-promote ────────
async function kpiXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Baseline 2026-05");
  ws.addRow([BANNER]);
  ws.addRow([]);
  ws.addRow(["KPI", "Baseline", "Target", "Unit", "Source"]);
  const rows = [
    ["Deployment frequency", "9", "30", "per month", "CI/CD export 2026-05"],
    ["Lead time for changes", "11", "3", "days", "CI/CD export 2026-05"],
    ["Change-failure rate", "17", "8", "percent", "ITSM export 2026-05"],
    ["Mean time to restore", "6.5", "2", "hours", "ITSM export 2026-05"],
    ["Booking conversion", "2.4", "3.1", "percent", "Web analytics 2026-05"],
    ["Self-service check-in", "61", "80", "percent", "Ops report 2026-05"],
    ["Engineering cost per release", "42", "28", "k USD", "Finance 2026-Q1"],
  ];
  rows.forEach((r) => ws.addRow(r));
  await wb.xlsx.writeFile(join(DIR, "skyharbor-kpi-baseline-2026-05.xlsx"));
  console.log("wrote skyharbor-kpi-baseline-2026-05.xlsx");
}

// ── 2) Stakeholder / decision-rights map (DOCX) — review-required ─────────────
async function stakeholderDocx() {
  const stakeholders = [
    ["Name / role", "Function", "Decision right", "Stance"],
    ["VP Engineering (D. Cho)", "Engineering", "Approves platform spend", "Sponsor"],
    ["CPO (R. Nair)", "Product", "Owns roadmap priorities", "Sponsor"],
    ["Head of Reservations (M. Patel)", "Reservations Core", "Can block mainframe change", "Cautious"],
    ["Director Data Eng (S. Olsen)", "Data Engineering", "Owns data pipelines", "Supportive"],
    ["CISO (A. Fofana)", "Security", "Approves AI tool rollout", "Gatekeeper"],
    ["CFO delegate (L. Romano)", "Finance", "Approves business case", "Neutral"],
  ];
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: BANNER, italics: true, color: "999999" })],
          }),
          new Paragraph({
            text: "SkyHarbor Air — Stakeholder & Decision-Rights Map",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Move: AI-Powered Product Development Lifecycle. Captured for current-state charter. Decisions: AI tool rollout gated by Security; mainframe change can be blocked by Reservations Core; business case approved by Finance delegate.",
          }),
          new Paragraph({ text: "Stakeholders", heading: HeadingLevel.HEADING_2 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: stakeholders.map(
              (cells) =>
                new TableRow({
                  children: cells.map(
                    (c) =>
                      new TableCell({
                        children: [new Paragraph(c)],
                      }),
                  ),
                }),
            ),
          }),
          new Paragraph({ text: "Risks", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "Risk: Reservations Core can block mainframe change cadence." }),
          new Paragraph({ text: "Risk: Security gate may delay AI tool rollout by a quarter." }),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  await writeFile(join(DIR, "skyharbor-stakeholder-map-2026-05.docx"), buf);
  console.log("wrote skyharbor-stakeholder-map-2026-05.docx");
}

// ── 3) Product / platform operating model (PPTX) — review-required ────────────
async function operatingModelPptx() {
  const pptx = new PptxGenJS();
  const s1 = pptx.addSlide();
  s1.addText(BANNER, { x: 0.3, y: 0.2, fontSize: 9, italic: true, color: "999999" });
  s1.addText("SkyHarbor Air — Product & Platform Operating Model", {
    x: 0.5,
    y: 1.2,
    w: 9,
    fontSize: 24,
    bold: true,
  });
  s1.addText("Current-state operating model for the AI-PDLC Move", {
    x: 0.5,
    y: 2.2,
    fontSize: 14,
  });

  const s2 = pptx.addSlide();
  s2.addText("Operating model — how teams are funded & run today", {
    x: 0.5,
    y: 0.3,
    fontSize: 18,
    bold: true,
  });
  s2.addText(
    [
      { text: "Funding: annual capex per platform; product squads funded quarterly.", options: { bullet: true } },
      { text: "Prioritization: a central architecture council approves cross-team work.", options: { bullet: true } },
      { text: "Decision: platform changes require VP Engineering sign-off.", options: { bullet: true } },
      { text: "Operating model is federated squads over a centralized platform team.", options: { bullet: true } },
      { text: "Risk: quarterly funding cadence slows mid-cycle AI investment.", options: { bullet: true } },
    ],
    { x: 0.6, y: 1.2, w: 8.5, h: 4, fontSize: 14 },
  );
  await pptx.writeFile({
    fileName: join(DIR, "skyharbor-operating-model-2026-05.pptx"),
  });
  console.log("wrote skyharbor-operating-model-2026-05.pptx");
}

await kpiXlsx();
await stakeholderDocx();
await operatingModelPptx();
console.log("synthetic doc set complete.");
