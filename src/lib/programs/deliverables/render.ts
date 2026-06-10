// =============================================================================
// Deliverable renderers — professional DOCX + HTML preview from a board result.
// -----------------------------------------------------------------------------
// DOCX: title page, revision-history table, TOC, page headers/footers with page
// numbers, Heading styles, real tables parsed from the markdown body, and a
// Source Register appendix. 11pt body. No internal tags (the generator already
// scrubbed them; the renderer never prints internalTrace).
// HTML: a clean document-preview (not a web page) with [n] citations + tables.
// =============================================================================

import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  TableOfContents,
  ShadingType,
} from "docx";
import type { BoardDeliverableResult } from "./board-deliverable";

const INK = "1A1A1A";
const ACCENT = "2E5F4F";
const RULE = "D8D4CA";
const HEADBG = "F3F1EA";

// ── markdown body → block model ──────────────────────────────────────────────

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string }
  | { kind: "table"; rows: string[][] };

function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (/^\s*\|.*\|/.test(ln)) {
      const tbl: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|/.test(lines[i])) {
        const cells = lines[i]
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
        // skip separator rows (---)
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "")) {
          tbl.push(cells);
        }
        i++;
      }
      if (tbl.length) blocks.push({ kind: "table", rows: tbl });
      continue;
    }
    if (/^##\s+/.test(ln))
      blocks.push({ kind: "h2", text: ln.replace(/^##\s+/, "").trim() });
    else if (/^###\s+/.test(ln))
      blocks.push({ kind: "h3", text: ln.replace(/^###\s+/, "").trim() });
    else if (/^[-*]\s+/.test(ln))
      blocks.push({ kind: "li", text: ln.replace(/^[-*]\s+/, "").trim() });
    else if (ln.trim() !== "" && !/^#\s/.test(ln))
      blocks.push({ kind: "p", text: ln.trim() });
    i++;
  }
  return blocks;
}

// inline **bold** + [CLIENT...] highlight → TextRuns
function runs(text: string, size = 22): TextRun[] {
  const out: TextRun[] = [];
  const re =
    /(\*\*[^*]+\*\*|\[(?:CLIENT|VALUE TEAM|LEGAL\/PROCUREMENT)[^\]]*\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last)
      out.push(
        new TextRun({ text: text.slice(last, m.index), size, color: INK }),
      );
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        new TextRun({
          text: tok.replace(/\*\*/g, ""),
          bold: true,
          size,
          color: INK,
        }),
      );
    } else {
      out.push(
        new TextRun({
          text: tok,
          italics: true,
          bold: true,
          size,
          color: "8A5200",
        }),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length)
    out.push(new TextRun({ text: text.slice(last), size, color: INK }));
  return out.length ? out : [new TextRun({ text, size, color: INK })];
}

function cell(text: string, opts: { header?: boolean } = {}): TableCell {
  return new TableCell({
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: HEADBG, color: "auto" }
      : undefined,
    children: [
      new Paragraph({
        spacing: { line: 240 },
        children: opts.header
          ? [new TextRun({ text, bold: true, size: 18, color: INK })]
          : runs(text, 19),
      }),
    ],
  });
}

function table(rows: string[][]): Table {
  const [head, ...body] = rows;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: RULE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: head.map((c) => cell(c, { header: true })),
      }),
      ...body.map(
        (r) =>
          new TableRow({
            children: head.map((_, ci) => cell(r[ci] ?? "")),
          }),
      ),
    ],
  });
}

export async function renderDeliverableDocx(
  r: BoardDeliverableResult,
): Promise<Buffer> {
  const docTitle = `${r.label} — ${r.moveName}`;
  const body: (Paragraph | Table)[] = [];

  for (const b of parseBlocks(r.bodyMarkdown)) {
    if (b.kind === "h2")
      body.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 110 },
          children: [
            new TextRun({
              text: b.text,
              bold: true,
              size: 28,
              color: ACCENT,
              font: "Georgia",
            }),
          ],
        }),
      );
    else if (b.kind === "h3")
      body.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
          children: [
            new TextRun({ text: b.text, bold: true, size: 24, color: INK }),
          ],
        }),
      );
    else if (b.kind === "li")
      body.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60, line: 264 },
          children: runs(b.text),
        }),
      );
    else if (b.kind === "table") {
      body.push(table(b.rows));
      body.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    } else
      body.push(
        new Paragraph({
          spacing: { after: 110, line: 276 },
          children: runs(b.text),
        }),
      );
  }

  // Source Register appendix.
  body.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 110 },
      children: [
        new TextRun({
          text: "Appendix A — Source Register",
          bold: true,
          size: 28,
          color: ACCENT,
          font: "Georgia",
        }),
      ],
    }),
  );
  body.push(
    table([
      ["Ref", "Source", "Evidence family", "Confidence", "Notes"],
      ...r.sourceRegister.map((s) => [
        `[${s.ref}]`,
        s.title,
        s.family,
        s.confidence,
        s.notes,
      ]),
    ]),
  );

  const titlePage: Paragraph[] = [
    new Paragraph({ spacing: { before: 1800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: r.clientName,
          bold: true,
          size: 30,
          color: INK,
          font: "Georgia",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [
        new TextRun({
          text: r.label,
          size: 52,
          color: ACCENT,
          font: "Georgia",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120 },
      children: [
        new TextRun({ text: r.moveName, size: 26, color: INK, italics: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 700 },
      children: [
        new TextRun({
          text: `Version ${r.version}  ·  ${r.date}`,
          size: 22,
          color: INK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80 },
      children: [
        new TextRun({
          text: r.confidentiality,
          size: 20,
          color: "8A5200",
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 700 },
      children: [
        new TextRun({ text: "Prepared by AbarVa", size: 22, color: INK }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 },
      children: [
        new TextRun({
          text: "Client owner: [CLIENT TO COMPLETE]",
          size: 20,
          color: "8A5200",
        }),
      ],
    }),
    new Paragraph({ pageBreakBefore: true, children: [] }),
  ];

  const revisionTable = table([
    ["Version", "Date", "Changes", "Owner", "Approval status"],
    [
      r.version,
      r.date,
      "Initial AbarVa-generated draft",
      "AbarVa",
      "Draft — pending client review",
    ],
  ]);

  const doc = new Document({
    creator: "AbarVa",
    title: docTitle,
    description: r.confidentiality,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22, color: INK } } },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${r.clientName} · ${r.label}`,
                    size: 16,
                    color: "8A857C",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${r.confidentiality}    ·    Page `,
                    size: 16,
                    color: "8A857C",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "8A857C",
                  }),
                  new TextRun({ text: " of ", size: 16, color: "8A857C" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "8A857C",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...titlePage,
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Revision History",
                bold: true,
                size: 28,
                color: ACCENT,
                font: "Georgia",
              }),
            ],
          }),
          revisionTable,
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: "Contents",
                bold: true,
                size: 28,
                color: ACCENT,
                font: "Georgia",
              }),
            ],
          }),
          new TableOfContents("Contents", {
            hyperlink: true,
            headingStyleRange: "2-3",
          }),
          new Paragraph({ pageBreakBefore: true, children: [] }),
          ...body,
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ── HTML preview (document-style, not a web page) ────────────────────────────

export function renderDeliverableHtml(r: BoardDeliverableResult): string {
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const inline = (t: string) =>
    esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /(\[(?:CLIENT|VALUE TEAM|LEGAL\/PROCUREMENT)[^\]]*\])/g,
        '<span class="todo">$1</span>',
      )
      .replace(/(\[\d+\])/g, '<sup class="ref">$1</sup>');
  let html = "";
  for (const b of parseBlocks(r.bodyMarkdown)) {
    if (b.kind === "h2") html += `<h2>${inline(b.text)}</h2>`;
    else if (b.kind === "h3") html += `<h3>${inline(b.text)}</h3>`;
    else if (b.kind === "li") html += `<li>${inline(b.text)}</li>`;
    else if (b.kind === "table") {
      const [head, ...rows] = b.rows;
      html += `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
        .map(
          (rw) =>
            `<tr>${head.map((_, i) => `<td>${inline(rw[i] ?? "")}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table>`;
    } else html += `<p>${inline(b.text)}</p>`;
  }
  // wrap stray <li> in <ul>
  html = html.replace(/(?:<li>[\s\S]*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
  const reg = r.sourceRegister
    .map(
      (s) =>
        `<tr><td>[${s.ref}]</td><td>${esc(s.title)}</td><td>${esc(s.family)}</td><td>${esc(s.confidence)}</td><td>${esc(s.notes)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><meta charset="utf-8"><title>${esc(r.label)} — ${esc(r.clientName)}</title>
<style>
 body{background:#eceae3;font-family:Calibri,'Segoe UI',sans-serif;color:#1a1a1a;margin:0;padding:32px}
 .page{max-width:8.5in;margin:0 auto 24px;background:#fff;padding:0.85in 0.95in;box-shadow:0 2px 10px rgba(0,0,0,.08);line-height:1.5}
 .cover{text-align:center;padding:2.2in 0 2in}
 .cover .client{font-family:Georgia,serif;font-size:22px}
 .cover .title{font-family:Georgia,serif;font-size:40px;color:#2e5f4f;margin:14px 0}
 .cover .move{font-style:italic;font-size:16px;color:#444}
 .cover .meta{margin-top:36px;font-size:13px}
 .cover .conf{margin-top:8px;color:#8a5200;font-weight:600;font-size:12px}
 h2{font-family:Georgia,serif;font-weight:400;color:#2e5f4f;font-size:19px;border-bottom:1px solid #e6e3dc;padding-bottom:5px;margin:26px 0 10px}
 h3{font-family:Georgia,serif;font-weight:400;font-size:15px;margin:16px 0 6px}
 p,li{font-size:13.5px} ul{padding-left:20px} li{margin:4px 0}
 table{border-collapse:collapse;width:100%;margin:10px 0;font-size:11.5px}
 th{background:#f3f1ea;text-align:left;font-weight:600} th,td{border:1px solid #d8d4ca;padding:5px 8px;vertical-align:top}
 .ref{color:#2e5f4f;font-weight:700} sup.ref{font-size:9px}
 .todo{background:#fbf0dd;border:1px solid #e8cfa0;border-radius:3px;padding:0 4px;color:#8a5200;font-weight:600}
 .hist{font-size:12px}
</style>
<div class="page"><div class="cover">
 <div class="client">${esc(r.clientName)}</div>
 <div class="title">${esc(r.label)}</div>
 <div class="move">${esc(r.moveName)}</div>
 <div class="meta">Version ${esc(r.version)} · ${esc(r.date)}</div>
 <div class="conf">${esc(r.confidentiality)}</div>
 <div class="meta">Prepared by AbarVa · Client owner: <span class="todo">[CLIENT TO COMPLETE]</span></div>
</div></div>
<div class="page">
 <h2>Revision History</h2>
 <table class="hist"><thead><tr><th>Version</th><th>Date</th><th>Changes</th><th>Owner</th><th>Approval status</th></tr></thead>
 <tbody><tr><td>${esc(r.version)}</td><td>${esc(r.date)}</td><td>Initial AbarVa-generated draft</td><td>AbarVa</td><td>Draft — pending client review</td></tr></tbody></table>
 ${html}
 <h2>Appendix A — Source Register</h2>
 <table><thead><tr><th>Ref</th><th>Source</th><th>Evidence family</th><th>Confidence</th><th>Notes</th></tr></thead><tbody>${reg}</tbody></table>
 <p style="margin-top:24px;color:#8a857c;font-size:11px">Authored by ${esc(r.model)} constrained to ${esc(r.clientName)}'s committed evidence. Every claim is cited to the Source Register or flagged as a client-to-complete item; no internal identifiers or unsupported claims. Representative/synthetic data.</p>
</div>`;
}
