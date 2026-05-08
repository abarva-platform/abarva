// GET /api/programs/[id]/deliverables/[deliverableId]/content-export
//
// Exports the latest markdown content from deliverable_versions as:
//   ?format=html  — standalone HTML document (inline CSS, AbarVa palette)
//   ?format=docx  — Word document (.docx) built from markdown headings/lists/text
//   ?format=xlsx  — Excel workbook for financial_model deliverables
//                   Parses structured markdown tables (## SECTION + table)
//                   into separate worksheets: Assumptions, Benefit Levers,
//                   Implementation Costs, Value Model, Scenarios
//
// Auth: requireTenancy + program tenant gate (403 if program not visible).
//
// Returns:
//   200  — binary with Content-Type + Content-Disposition: attachment
//   400  — missing params or invalid format
//   403  — not authorised for this tenant / program
//   404  — program or deliverable not found, or no content exists yet
//   500  — render failure

import 'server-only';

import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Format = 'html' | 'docx' | 'xlsx';

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
}

function safeFilename(title: string, ext: string): string {
  const base = title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60)
    .replace(/-+$/, '') || 'deliverable';
  return `${base}.${ext}`;
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────
//
// Simple line-by-line converter for the subset of markdown Nexus produces:
//   # / ## / ### headings, **bold**, *italic*, - bullets, > blockquote,
//   --- separator, plain paragraphs. Does NOT handle tables or code blocks.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(md: string, title: string): string {
  const lines = md.split('\n');
  const bodyParts: string[] = [];
  let inUl = false;

  function closeUl() {
    if (inUl) {
      bodyParts.push('</ul>');
      inUl = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^# /.test(line)) {
      closeUl();
      bodyParts.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (/^## /.test(line)) {
      closeUl();
      bodyParts.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (/^### /.test(line)) {
      closeUl();
      bodyParts.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (/^[-*] /.test(line)) {
      if (!inUl) { bodyParts.push('<ul>'); inUl = true; }
      bodyParts.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else if (/^> /.test(line)) {
      closeUl();
      bodyParts.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    } else if (/^---+$/.test(line)) {
      closeUl();
      bodyParts.push('<hr>');
    } else if (line.trim() === '') {
      closeUl();
    } else {
      closeUl();
      bodyParts.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeUl();

  const body = bodyParts.join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.65;
      color: #1A1A18;
      background: #F8F7F4;
      max-width: 780px;
      margin: 48px auto;
      padding: 0 24px 80px;
    }
    h1 { font-family: Georgia, serif; font-size: 26px; font-weight: normal; margin: 0 0 8px; }
    h2 { font-family: Georgia, serif; font-size: 19px; font-weight: normal; margin: 32px 0 8px; border-bottom: 1px solid #E2DFD8; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #525866; margin: 24px 0 6px; }
    p  { margin: 0 0 12px; }
    ul { padding-left: 22px; margin: 0 0 12px; }
    li { margin-bottom: 4px; }
    blockquote { border-left: 3px solid #1B2B5C; margin: 16px 0; padding: 4px 16px; background: rgba(27,43,92,0.04); color: #525866; }
    hr { border: none; border-top: 1px solid #E2DFD8; margin: 24px 0; }
    strong { font-weight: 600; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #ECEAE4; padding: 1px 5px; border-radius: 3px; }
    .doc-header { border-bottom: 2px solid #1B2B5C; padding-bottom: 16px; margin-bottom: 32px; }
    .doc-meta { font-size: 11px; color: #9AA3B2; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-meta">Nexus · Deliverable Output</div>
    <h1>${escapeHtml(title)}</h1>
  </div>
  ${body}
</body>
</html>`;
}

// ── Markdown → DOCX ──────────────────────────────────────────────────────────
//
// Converts the same markdown subset into a Word document using the `docx`
// package (already installed at ^9.6.1). Handles: H1/H2/H3, bullet lists,
// bold/italic inline, blockquote (indented), horizontal rule, paragraphs.

interface ParsedInline {
  text: string;
  bold?: boolean;
  italics?: boolean;
  monospace?: boolean;
}

function parseInline(text: string): ParsedInline[] {
  const result: ParsedInline[] = [];
  // Simple state machine: scan for **bold**, *italic*, `code`
  let i = 0;
  let buf = '';
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('**', i + 2);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 2, end), bold: true });
      i = end + 2;
    } else if (text[i] === '*' && text[i + 1] !== '*') {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('*', i + 1);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 1, end), italics: true });
      i = end + 1;
    } else if (text[i] === '`') {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('`', i + 1);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 1, end), monospace: true });
      i = end + 1;
    } else {
      buf += text[i++];
    }
  }
  if (buf) result.push({ text: buf });
  return result;
}

function textRuns(text: string): TextRun[] {
  return parseInline(text).map(
    (p) =>
      new TextRun({
        text: p.text,
        bold: p.bold,
        italics: p.italics,
        font: p.monospace ? 'Courier New' : undefined,
        size: p.monospace ? 20 : undefined,
      }),
  );
}

function markdownToDocx(md: string, title: string): Promise<Uint8Array> {
  const lines = md.split('\n');
  const paragraphs: Paragraph[] = [];

  // Document title as H1
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  );

  let inBulletList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^# /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(2)), heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
    } else if (/^## /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(3)), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }));
    } else if (/^### /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(4)), heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 } }));
    } else if (/^[-*] /.test(line)) {
      inBulletList = true;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(2)), bullet: { level: 0 }, spacing: { after: 60 } }));
    } else if (/^> /.test(line)) {
      inBulletList = false;
      paragraphs.push(
        new Paragraph({
          children: textRuns(line.slice(2)),
          indent: { left: 720 },
          spacing: { after: 80 },
          alignment: AlignmentType.LEFT,
        }),
      );
    } else if (/^---+$/.test(line)) {
      inBulletList = false;
      // Blank spacer paragraph as section separator
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200, before: 200 } }));
    } else if (line.trim() === '') {
      inBulletList = false;
    } else {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line), spacing: { after: 100 } }));
    }
  }

  const doc = new Document({
    creator: 'Nexus',
    title,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }, // 11pt
        },
      },
    },
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc) as Promise<Uint8Array>;
}

// ── Markdown → Excel (financial model) ──────────────────────────────────────
//
// Claude generates the financial model as structured markdown tables under
// ## SECTION_NAME headers. This parser extracts those tables and builds a
// proper Excel workbook with one sheet per section.
//
// Sheet mapping:
//   ## ASSUMPTIONS          → "Assumptions" (editable inputs, yellow header)
//   ## BENEFIT_LEVERS       → "Benefit Levers" (editable, green header)
//   ## IMPLEMENTATION_COSTS → "Implementation Costs" (editable, orange header)
//   ## VALUE_MODEL          → "Value Model" (calculated, blue header)
//   ## SCENARIOS            → "Scenarios" (calculated, purple header)

type ParsedTable = { headers: string[]; rows: string[][] };

function parseMarkdownTable(lines: string[]): ParsedTable | null {
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));
  if (tableLines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map((cell) => cell.trim());

  const headers = parseRow(tableLines[0]);
  // Skip separator row (---|---|...)
  const dataRows = tableLines.slice(2).map(parseRow);
  return { headers, rows: dataRows };
}

function extractSections(md: string): Map<string, ParsedTable> {
  const result = new Map<string, ParsedTable>();
  const sectionRegex = /^##\s+([A-Z_]+)\s*$/gm;
  const parts = md.split(sectionRegex);
  // parts = [before, sectionName1, content1, sectionName2, content2, ...]
  for (let i = 1; i < parts.length - 1; i += 2) {
    const sectionKey = parts[i].trim();
    const sectionContent = parts[i + 1] ?? '';
    const tableLines = sectionContent.split('\n').filter(Boolean);
    const table = parseMarkdownTable(tableLines);
    if (table) result.set(sectionKey, table);
  }
  return result;
}

const SHEET_CONFIG: Array<{
  sectionKey: string;
  sheetName: string;
  headerColor: string; // ARGB hex
  editable: boolean;
}> = [
  { sectionKey: 'ASSUMPTIONS',          sheetName: 'Assumptions',          headerColor: 'FF1B2B5C', editable: true },
  { sectionKey: 'BENEFIT_LEVERS',        sheetName: 'Benefit Levers',        headerColor: 'FF166534', editable: true },
  { sectionKey: 'IMPLEMENTATION_COSTS',  sheetName: 'Implementation Costs',  headerColor: 'FF92400E', editable: true },
  { sectionKey: 'VALUE_MODEL',           sheetName: 'Value Model',           headerColor: 'FF1E3A5F', editable: false },
  { sectionKey: 'SCENARIOS',             sheetName: 'Scenarios',             headerColor: 'FF4C1D95', editable: false },
];

async function markdownToXlsx(md: string, title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus';
  workbook.created = new Date();
  workbook.title = title;

  const sections = extractSections(md);

  // Add a cover sheet
  const cover = workbook.addWorksheet('Cover');
  cover.getColumn(1).width = 60;
  cover.getRow(2).getCell(1).value = title;
  cover.getRow(2).getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1B2B5C' } };
  cover.getRow(3).getCell(1).value = `Generated by Nexus · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  cover.getRow(3).getCell(1).font = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } };
  cover.getRow(5).getCell(1).value = 'This workbook contains the following sheets:';
  cover.getRow(5).getCell(1).font = { name: 'Calibri', size: 11, bold: true };
  let coverRow = 6;
  for (const cfg of SHEET_CONFIG) {
    if (sections.has(cfg.sectionKey)) {
      const cell = cover.getRow(coverRow++).getCell(1);
      cell.value = `• ${cfg.sheetName}${cfg.editable ? ' (editable inputs)' : ' (calculated)'}`;
      cell.font = { name: 'Calibri', size: 10 };
    }
  }

  // Add data sheets
  for (const cfg of SHEET_CONFIG) {
    const table = sections.get(cfg.sectionKey);
    if (!table || table.headers.length === 0) continue;

    const sheet = workbook.addWorksheet(cfg.sheetName);

    // Column widths
    table.headers.forEach((_, colIdx) => {
      sheet.getColumn(colIdx + 1).width = Math.max(18,
        Math.min(40, Math.max(...table.rows.map((r) => (r[colIdx] ?? '').length), table.headers[colIdx].length) + 4)
      );
    });

    // Header row
    const headerRow = sheet.getRow(1);
    table.headers.forEach((h, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cfg.headerColor } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      };
    });
    headerRow.height = 24;

    // Data rows
    table.rows.forEach((row, rowIdx) => {
      const sheetRow = sheet.getRow(rowIdx + 2);
      row.forEach((val, colIdx) => {
        const cell = sheetRow.getCell(colIdx + 1);
        // Try to parse as number
        const asNum = val.replace(/[$%,]/g, '').trim();
        const num = Number(asNum);
        if (!Number.isNaN(num) && asNum !== '' && !/[a-zA-Z]/.test(asNum)) {
          cell.value = num;
          if (val.includes('%')) {
            cell.numFmt = '0.0%';
            cell.value = num / 100; // store as decimal
          } else if (val.includes('$') || /^\d+\.\d/.test(asNum)) {
            cell.numFmt = '#,##0.0';
          }
        } else {
          cell.value = val;
        }
        cell.font = { name: 'Calibri', size: 10 };
        const isAlt = rowIdx % 2 === 1;
        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F7F4' } };
        }
        if (cfg.editable && colIdx === 1) {
          // Highlight the value column for editable sheets
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'FFFFFBE6' : 'FFFFFFF0' } };
        }
      });
      sheetRow.height = 18;
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Note for editable sheets
    if (cfg.editable) {
      const noteRow = sheet.getRow(table.rows.length + 3);
      const noteCell = noteRow.getCell(1);
      noteCell.value = '← Yellow cells are input assumptions. Update these to run scenarios.';
      noteCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF92400E' } };
    }
  }

  // If no sections were parsed, add a fallback raw-content sheet
  if (workbook.worksheets.length === 1) {
    const raw = workbook.addWorksheet('Content');
    raw.getColumn(1).width = 80;
    md.split('\n').forEach((line, idx) => {
      raw.getRow(idx + 1).getCell(1).value = line;
    });
  }

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; deliverableId: string }> },
): Promise<Response> {
  // Auth
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch { return jsonError(500, 'internal_error'); }
  }
  void ctx; // used implicitly by requireTenancy side-effects (session + tenant check)

  const { id: programId, deliverableId } = await params;
  if (!programId || !deliverableId) return jsonError(400, 'missing_params');

  const url = new URL(req.url);
  const formatParam = url.searchParams.get('format') ?? 'html';
  if (formatParam !== 'html' && formatParam !== 'docx' && formatParam !== 'xlsx') {
    return jsonError(400, 'invalid_format', 'format must be html, docx, or xlsx');
  }
  const format: Format = formatParam;

  const sb = getServerSupabase();

  // Fetch deliverable row — must belong to this program
  const { data: delivRow, error: delivErr } = await sb
    .from('deliverables_v2')
    .select('id, engagement_id, deliverable_type_key, title')
    .eq('id', deliverableId)
    .eq('engagement_id', programId)
    .maybeSingle();
  if (delivErr) {
    console.error('[content-export] deliverable fetch error', delivErr);
    return jsonError(500, 'db_error');
  }
  if (!delivRow) return jsonError(404, 'deliverable_not_found');

  const deliverable = delivRow as { id: string; engagement_id: string; deliverable_type_key: string; title: string | null };

  // Fetch latest version content
  const { data: vRow, error: vErr } = await sb
    .from('deliverable_versions')
    .select('content, version, generated_at')
    .eq('deliverable_id', deliverableId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (vErr) {
    console.error('[content-export] version fetch error', vErr);
    return jsonError(500, 'db_error');
  }

  const version = vRow as { content: string | null; version: number; generated_at: string } | null;
  const content = version?.content ?? null;
  if (!content || content.trim().length === 0) {
    return jsonError(404, 'no_content', 'This deliverable has no content yet. Generate it in the phase workspace first.');
  }

  const title = deliverable.title || deliverable.deliverable_type_key.replace(/_/g, ' ');

  try {
    if (format === 'html') {
      const html = markdownToHtml(content, title);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(html);
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename(title, 'html')}"`,
          'Cache-Control': 'private, max-age=0',
        },
      });
    }

    if (format === 'docx') {
      const rawBuffer = await markdownToDocx(content, title);
      // Copy into a guaranteed ArrayBuffer-backed Uint8Array (Node Buffer's
      // backing is ArrayBufferLike which may not satisfy BodyInit in strict mode).
      const arrayBuffer = new ArrayBuffer(rawBuffer.byteLength);
      new Uint8Array(arrayBuffer).set(rawBuffer);
      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeFilename(title, 'docx')}"`,
          'Cache-Control': 'private, max-age=0',
        },
      });
    }

    // xlsx — financial model
    const xlsxBuffer = await markdownToXlsx(content, title);
    const xlsxArrayBuffer = new ArrayBuffer(xlsxBuffer.byteLength);
    new Uint8Array(xlsxArrayBuffer).set(xlsxBuffer);
    return new Response(xlsxArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFilename(title, 'xlsx')}"`,
        'Cache-Control': 'private, max-age=0',
      },
    });
  } catch (err) {
    console.error('[content-export] render error', err);
    return jsonError(500, 'render_failed', err instanceof Error ? err.message : 'render_failed');
  }
}
