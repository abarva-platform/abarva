// Professional renderers for a RenderableDeliverable.
//
// Renders the orchestrator's structured document to board-grade DOCX (11pt body,
// cover, numbered headings, banded tables, source register, client-to-complete
// checklist, recommendation, next actions), an Excel companion workbook for tables
// flagged targetFormat 'xlsx' (so wide data is never crammed into tiny in-doc tables),
// and a self-contained HTML preview in the AbarVa design system.
//
// Reuses the shared exports-shared/docx-base helpers so styling matches every other
// AbarVa artifact.

import 'server-only';

import { Document, Footer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';

import {
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  boldRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading1,
  heading2,
  pageBreak,
} from '@/lib/exports-shared/docx-base';
import { buildMultiColumnTable } from '@/lib/exports-shared/structured-docx-base';
import type { RenderableDeliverable, RenderableTable } from './types';

// ── helpers ──

/** Split a section's markdown body into paragraph/bullet runs (lightweight). */
function bodyToParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    if (/^[-*]\s+/.test(line)) {
      return bodyParagraph([bodyRun(`• ${line.replace(/^[-*]\s+/, '')}`)], { spacing: { before: 40, after: 40, line: 300 } });
    }
    if (/^#{1,6}\s+/.test(line)) {
      return heading2(line.replace(/^#{1,6}\s+/, ''));
    }
    return bodyParagraph([bodyRun(line)]);
  });
}

function tableToDocx(table: RenderableTable): Paragraph | ReturnType<typeof buildMultiColumnTable> {
  if (table.rows.length === 0) {
    return bodyParagraph([bodyRun(`(${table.title}: see Excel companion exhibit)`, { italics: true, color: SOURCE_DOCX.MUTED_COLOR })]);
  }
  const widthEach = Math.max(8, Math.floor(100 / table.columns.length));
  return buildMultiColumnTable<string[]>({
    columns: table.columns.map((c, i) => ({
      header: c,
      widthPercent: i === table.columns.length - 1 ? 100 - widthEach * (table.columns.length - 1) : widthEach,
      extract: (row) => row[i] ?? '',
    })),
    rows: table.rows,
  });
}

// ── DOCX ──

export function renderDeliverableDocx(doc: RenderableDeliverable): Document {
  const children: (Paragraph | ReturnType<typeof buildMultiColumnTable>)[] = [];

  // Cover
  children.push(eyebrowParagraph('AbarVa · Board-grade deliverable'));
  children.push(coverTitleParagraph(doc.title));
  if (doc.subtitle) children.push(coverSubtitleParagraph(doc.subtitle));
  children.push(coverSubtitleParagraph(`${doc.clientDisplayName} — ${doc.initiativeDisplayName}`));
  children.push(pageBreak());

  // Sections
  for (const section of doc.generatedSections) {
    children.push(heading1(section.title));
    children.push(...bodyToParagraphs(section.bodyMarkdown));
  }

  // In-document tables (those NOT routed to the Excel companion)
  const inDocTables = doc.tables.filter((t) => t.targetFormat !== 'xlsx');
  if (inDocTables.length) {
    children.push(pageBreak());
    children.push(heading1('Tables & Exhibits'));
    for (const t of inDocTables) {
      children.push(heading2(t.title));
      children.push(tableToDocx(t));
    }
  }

  // Recommendation + next actions
  children.push(pageBreak());
  children.push(heading1('Recommendation'));
  children.push(bodyParagraph([bodyRun(doc.recommendation)]));
  if (doc.nextActions.length) {
    children.push(heading2('Next Actions'));
    for (const a of doc.nextActions) children.push(bodyParagraph([bodyRun(`• ${a}`)]));
  }

  // Client-to-complete checklist
  if (doc.clientCompleteChecklist.length) {
    children.push(heading1('Client-to-Complete Checklist'));
    for (const c of doc.clientCompleteChecklist) {
      children.push(bodyParagraph([boldRun(`☐ ${c.label} `), bodyRun(`— owner: ${c.owner} (${c.reason})`)]));
    }
  }

  // Assumptions
  if (doc.assumptions.length) {
    children.push(heading1('Assumptions'));
    for (const a of doc.assumptions) {
      children.push(bodyParagraph([bodyRun(`• ${a.statement}${a.mustValidate ? ' [VALIDATE]' : ''} — ${a.basis}`)]));
    }
  }

  // Source register
  if (doc.sourceRegister.length) {
    children.push(heading1('Source Register'));
    children.push(
      buildMultiColumnTable({
        columns: [
          { header: '[n]', widthPercent: 8, extract: (r) => String(r.citationNumber) },
          { header: 'Source', widthPercent: 52, extract: (r) => r.label },
          { header: 'Family', widthPercent: 22, extract: (r) => r.evidenceFamily },
          { header: 'Confidence', widthPercent: 18, extract: (r) => `${r.confidence}${r.asOf ? ` · ${r.asOf}` : ''}` },
        ],
        rows: doc.sourceRegister,
      }),
    );
  }

  return new Document({
    creator: 'AbarVa',
    title: doc.title,
    description: `${doc.clientDisplayName} — ${doc.initiativeDisplayName}`,
    sections: [
      {
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `Confidential — ${doc.clientDisplayName}`, font: SOURCE_DOCX.BODY_FONT, size: 16, color: SOURCE_DOCX.MUTED_COLOR })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

// ── XLSX companion (wide tables) ──

/** Build the Excel companion for every table flagged targetFormat 'xlsx'. Returns null if none. */
export function renderDeliverableExcelCompanion(doc: RenderableDeliverable): ExcelJS.Workbook | null {
  const xlsxTables = doc.tables.filter((t) => t.targetFormat === 'xlsx');
  if (xlsxTables.length === 0) return null;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa';
  wb.created = new Date(0); // deterministic
  for (const t of xlsxTables) {
    const sheet = wb.addWorksheet(t.title.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '));
    const header = sheet.addRow(t.columns);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${SOURCE_DOCX.HEADER_COLOR}` } };
    });
    for (const row of t.rows) sheet.addRow(row);
    sheet.columns.forEach((col) => {
      let max = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        max = Math.max(max, String(cell.value ?? '').length + 2);
      });
      col.width = Math.min(60, max);
    });
  }
  return wb;
}

// ── HTML preview (AbarVa design system) ──

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tableHtml(t: RenderableTable): string {
  const head = t.columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<h3>${esc(t.title)}</h3><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function renderDeliverableHtml(doc: RenderableDeliverable): string {
  const sections = doc.generatedSections
    .map((s) => `<section><h2>${esc(s.title)}</h2>${s.bodyMarkdown.split('\n').filter(Boolean).map((l) => `<p>${esc(l.replace(/^#{1,6}\s+/, ''))}</p>`).join('')}</section>`)
    .join('');
  const tables = doc.tables.map(tableHtml).join('');
  const register = doc.sourceRegister
    .map((r) => `<tr><td>[${r.citationNumber}]</td><td>${esc(r.label)}</td><td>${esc(r.evidenceFamily)}</td><td>${esc(r.confidence)}${r.asOf ? ` · ${esc(r.asOf)}` : ''}</td></tr>`)
    .join('');
  const checklist = doc.clientCompleteChecklist.map((c) => `<li>☐ <b>${esc(c.label)}</b> — owner: ${esc(String(c.owner))} (${esc(c.reason)})</li>`).join('');
  const nextActions = doc.nextActions.map((a) => `<li>${esc(a)}</li>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>
  body{background:#F8F7F4;color:#1a1a1a;font-family:'DM Sans',Inter,Segoe UI,sans-serif;line-height:1.55}
  .wrap{max-width:960px;margin:0 auto;padding:40px 28px 80px}
  h1,h2,h3{font-family:Georgia,'Fraunces',serif;font-weight:400;color:#0C1A3A}
  h1{font-size:30px}h2{font-size:21px;border-bottom:1px solid #e4e1da;padding-bottom:6px;margin-top:34px}
  .eyebrow{letter-spacing:.12em;text-transform:uppercase;font-size:11px;color:#706D66}
  table{border-collapse:collapse;width:100%;margin:12px 0;background:#fff;border:1px solid #e4e1da;font-size:13px}
  th,td{border:1px solid #e4e1da;padding:7px 10px;text-align:left}th{background:#0C1A3A;color:#fff}
  .rec{background:#fff;border:1px solid #e4e1da;border-left:3px solid #2DD4C8;border-radius:8px;padding:14px 18px;margin:14px 0}
  ul{padding-left:18px}</style></head><body><div class="wrap">
  <div class="eyebrow">AbarVa · Board-grade deliverable</div>
  <h1>${esc(doc.title)}</h1>
  <p class="eyebrow">${esc(doc.clientDisplayName)} — ${esc(doc.initiativeDisplayName)}</p>
  ${sections}
  ${tables ? `<h2>Tables &amp; Exhibits</h2>${tables}` : ''}
  <h2>Recommendation</h2><div class="rec">${esc(doc.recommendation)}</div>
  ${nextActions ? `<h3>Next Actions</h3><ul>${nextActions}</ul>` : ''}
  ${checklist ? `<h2>Client-to-Complete Checklist</h2><ul>${checklist}</ul>` : ''}
  ${register ? `<h2>Source Register</h2><table><thead><tr><th>[n]</th><th>Source</th><th>Family</th><th>Confidence</th></tr></thead><tbody>${register}</tbody></table>` : ''}
  </div></body></html>`;
}
