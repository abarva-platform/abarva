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

import {
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import ExcelJS from 'exceljs';
import { rasteriseSvg } from '@/lib/programs/expert-kernel/exports/board-grade/svg-raster';

import {
  ORDERED_NUMBERING_CONFIG,
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
import { markdownToDocxBlocks } from '@/lib/exports-shared/markdown-to-docx';
import { markdownToHtml } from '@/lib/programs/deliverables/orchestrated/render-html';
import type {
  RenderableDeliverable,
  RenderableExhibit,
  RenderableTable,
} from './types';

// ── helpers ──

// Canonical data-display tokens (docs/design/DATA_DISPLAY_TOKENS.md) as docx
// hex (no leading #). The deliverable owns these light-table builders so the
// rendered DOCX uses muted uppercase headers + hairline row dividers + NO navy
// fill — without mutating the shared Source house-style helpers.
const TOKENS = {
  MUTED: '6F6A61', // --muted
  INK: '1B1A17', // --ink
  LINE: 'E6E2DA', // --line  (header bottom border)
  LINE2: 'EFECE5', // --line2 (row divider)
} as const;

/** A light, board-grade table: muted uppercase header (bottom border only),
 *  hairline row dividers, no per-cell boxes, no navy fill. */
function lightTable(columns: string[], rows: string[][]): Table {
  const widthEach = Math.max(8, Math.floor(100 / columns.length));
  const width = (i: number): number =>
    i === columns.length - 1 ? 100 - widthEach * (columns.length - 1) : widthEach;

  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map((c, i) =>
      new TableCell({
        width: { size: width(i), type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: TOKENS.LINE },
        },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: c.toUpperCase(),
                font: SOURCE_DOCX.BODY_FONT,
                size: 16, // ~8pt — the header recedes
                color: TOKENS.MUTED,
                characterSpacing: 6,
              }),
            ],
          }),
        ],
      }),
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: columns.map((_, i) =>
        new TableCell({
          width: { size: width(i), type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            // hairline divider on every row except the last (last row no border)
            bottom:
              ri === rows.length - 1
                ? { style: BorderStyle.NONE, size: 0, color: 'auto' }
                : { style: BorderStyle.SINGLE, size: 2, color: TOKENS.LINE2 },
          },
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: row[i] ?? '',
                  font: SOURCE_DOCX.BODY_FONT,
                  size: 20,
                  color: TOKENS.INK,
                }),
              ],
            }),
          ],
        }),
      ),
    }),
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  });
}

function tableToDocx(table: RenderableTable): Paragraph | Table {
  if (table.rows.length === 0) {
    return bodyParagraph([bodyRun(`(${table.title}: see Excel companion exhibit)`, { italics: true, color: SOURCE_DOCX.MUTED_COLOR })]);
  }
  return lightTable(table.columns, table.rows);
}

// ── DOCX ──

export function renderDeliverableDocx(doc: RenderableDeliverable): Document {
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(eyebrowParagraph('AbarVa · Board-grade deliverable'));
  children.push(coverTitleParagraph(doc.title));
  if (doc.subtitle) children.push(coverSubtitleParagraph(doc.subtitle));
  children.push(coverSubtitleParagraph(`${doc.clientDisplayName} — ${doc.initiativeDisplayName}`));
  // Required document-status block — every generated artifact carries this
  // until a real, named human-approval record exists for it.
  children.push(
    bodyParagraph([
      boldRun('Document status: '),
      bodyRun('AI-generated working draft — not approved.'),
    ]),
  );
  children.push(
    bodyParagraph([
      bodyRun(
        'Generated by AbarVa aVa AI-assisted generation. Required next steps: (1) review for factual accuracy and completeness; (2) resolve highlighted assumptions and evidence gaps; (3) update with client decisions and workshop outcomes; (4) obtain named human approval; (5) upload the approved version to become the governed record. This document must not be treated as an approved client deliverable, implementation instruction, financial commitment, architecture decision, or value claim until human approval is recorded.',
      ),
    ]),
  );
  children.push(pageBreak());

  // Sections — render the authored markdown body PROPERLY (headings, bold,
  // ordered/unordered + nested lists, inline GFM tables) via the shared
  // mdast walker, instead of flattening every line to a paragraph.
  for (const section of doc.generatedSections) {
    children.push(heading1(section.title));
    children.push(...markdownToDocxBlocks(section.bodyMarkdown));
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

  // Visual exhibits — rasterised from the same SVG the HTML renderer inlines,
  // so a DOCX reader sees the diagrams that were previously only reachable
  // via the HTML preview.
  if (doc.exhibits.length) {
    children.push(pageBreak());
    children.push(heading1('Visual Exhibits'));
    doc.exhibits.forEach((exhibit, index) => {
      children.push(...exhibitToDocxBlocks(exhibit, index));
    });
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
      lightTable(
        ['[n]', 'Source', 'Family', 'Confidence'],
        doc.sourceRegister.map((r) => [
          String(r.citationNumber),
          r.label,
          r.evidenceFamily,
          `${r.confidence}${r.asOf ? ` · ${r.asOf}` : ''}`,
        ]),
      ),
    );
  }

  return new Document({
    creator: 'AbarVa',
    title: doc.title,
    description: `${doc.clientDisplayName} — ${doc.initiativeDisplayName}`,
    // Required so ordered lists emitted by markdownToDocxBlocks render as 1./2./a.
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Confidential — ${doc.clientDisplayName} · AI-generated working draft. Human review, update, approval, and approved re-upload are required before this artifact becomes authoritative.`,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 16,
                    color: SOURCE_DOCX.MUTED_COLOR,
                  }),
                ],
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
    const header = sheet.addRow(t.columns.map((c) => c.toUpperCase()));
    // Canonical light header: muted uppercase text on a hairline bottom rule —
    // no navy fill (DATA_DISPLAY_TOKENS.md table recipe).
    header.font = { color: { argb: `FF${TOKENS.MUTED}` } };
    header.eachCell((cell) => {
      cell.border = { bottom: { style: 'thin', color: { argb: `FF${TOKENS.LINE}` } } };
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

// ── HTML preview (AbarVa data-display tokens) ──
//
// Styled per docs/design/DATA_DISPLAY_TOKENS.md: Georgia 400 headings, DM Sans
// 13.5px body, the clean table recipe (10px uppercase muted header, bottom
// border only, hairline row dividers, tabular-nums on numbers), status pills for
// confidence, and a fresh-green recommendation rule. Section bodies are rendered
// through markdownToHtml so authored markdown structure survives.

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Confidence → soft-bg status pill (fresh / attention / unknown). */
function confidencePill(confidence: string): string {
  const c = confidence.toLowerCase();
  const status = c === 'high' ? 'fresh' : c === 'medium' ? 'attention' : c === 'low' ? 'stale' : 'unknown';
  return `<span class="pill pill-${status}"><span class="dot"></span>${esc(confidence)}</span>`;
}

function tableHtml(t: RenderableTable): string {
  const head = t.columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(String(c))}</td>`).join('')}</tr>`).join('');
  return `<h3>${esc(t.title)}</h3><table class="md"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function exhibitClauses(exhibit: RenderableExhibit): string[] {
  const raw = exhibit.description || exhibit.title;
  const parts = raw
    .split(/\s*(?:→|->|;|\n|\.\s+)\s*/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (parts.length >= 3) return parts;
  return [
    exhibit.kind.replace(/_/g, ' '),
    exhibit.title,
    exhibit.description || 'Decision implication to confirm',
  ].slice(0, 5);
}

function svgFlowExhibit(exhibit: RenderableExhibit, domId: string): string {
  const clauses = exhibitClauses(exhibit);
  const width = Math.max(720, clauses.length * 180);
  const nodes = clauses
    .map((clause, i) => {
      const x = 56 + i * 170;
      const arrow =
        i < clauses.length - 1
          ? `<path d="M${x + 116} 72 L${x + 154} 72" stroke="var(--fresh)" stroke-width="2" marker-end="url(#arrow-${domId})"/>`
          : '';
      return `${arrow}<g>
        <rect x="${x}" y="38" width="118" height="68" rx="8" fill="#fff" stroke="var(--line)"/>
        <text x="${x + 59}" y="65" text-anchor="middle" font-size="11" font-weight="700">${esc(clause.slice(0, 28))}</text>
        <text x="${x + 59}" y="84" text-anchor="middle" font-size="9" fill="var(--muted)">${esc(exhibit.kind)}</text>
      </g>`;
    })
    .join('');
  return `<svg class="exhibit-svg" viewBox="0 0 ${width} 140" role="img" aria-label="${esc(exhibit.title)}">
    <defs><marker id="arrow-${domId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--fresh)"/></marker></defs>
    ${nodes}
  </svg>`;
}

function svgMatrixExhibit(exhibit: RenderableExhibit): string {
  const clauses = exhibitClauses(exhibit).slice(0, 4);
  const cells = clauses
    .map((clause, i) => {
      const x = i % 2 === 0 ? 36 : 378;
      const y = i < 2 ? 44 : 132;
      return `<g>
        <rect x="${x}" y="${y}" width="300" height="66" rx="8" fill="#fff" stroke="var(--line)"/>
        <text x="${x + 16}" y="${y + 28}" font-size="12" font-weight="700">${esc(clause.slice(0, 36))}</text>
        <text x="${x + 16}" y="${y + 48}" font-size="10" fill="var(--muted)">Implication: ${esc(exhibit.kind)}</text>
      </g>`;
    })
    .join('');
  return `<svg class="exhibit-svg" viewBox="0 0 720 230" role="img" aria-label="${esc(exhibit.title)}">
    <path d="M360 28 L360 210 M24 120 L696 120" stroke="var(--line)" stroke-width="1"/>
    ${cells}
  </svg>`;
}

// ── Architecture-view swimlane renderers ──
//
// conceptual/logical/physical_architecture and agent_orchestration are
// distinct diagram KINDS (not one generic "diagram" box) — each answers a
// different question and needs its own layout. The lane labels below mirror
// the `requiredElements` grouping defined for these exhibit kinds in
// briefs/deliverable-structures.ts (kept as a local constant here rather than
// imported, since these are static reference labels, the same pattern
// `golden-bar.ts` already uses for its own keyword lists — importing across
// that module boundary would be a real dependency, not just shared data).
// The model's free-text exhibit description is split into clauses (the same
// `exhibitClauses` extraction used elsewhere) and each clause is assigned to
// the lane whose keywords it best matches, so the rendered diagram always
// shows the FULL required lane structure even when the model's own wording
// only touches some of it.

interface ArchitectureLane {
  label: string;
  keywords: RegExp;
}

const CONCEPTUAL_LANES: ArchitectureLane[] = [
  { label: 'Personas & Channels', keywords: /persona|user|channel|audience/i },
  { label: 'Business Capabilities & Domains', keywords: /capabilit|domain|function/i },
  { label: 'Trust, Governance & Outcomes', keywords: /trust|govern|boundary|outcome|compliance/i },
];

const LOGICAL_LANES: ArchitectureLane[] = [
  { label: 'Experience & Orchestration', keywords: /experience|workflow|orchestrat/i },
  { label: 'Agents & Models', keywords: /agent|model/i },
  { label: 'Context, Data & Integration', keywords: /context|knowledge|data|integrat/i },
  { label: 'Identity, Security, Observability & Governance', keywords: /identity|security|observab|governance|human-in-the-loop|hitl/i },
];

const PHYSICAL_LANES: ArchitectureLane[] = [
  { label: 'Cloud Boundaries & Network', keywords: /subscription|account|region|network|private endpoint/i },
  { label: 'Runtime & Model Endpoints', keywords: /runtime|endpoint|compute|container/i },
  { label: 'Data, Search & Events', keywords: /data platform|vector|search|queue|event|database/i },
  { label: 'Secrets, Monitoring, CI/CD & Resilience', keywords: /secret|monitor|ci\/cd|cicd|resilien|recovery/i },
];

const AGENT_ORCHESTRATION_STEPS: string[] = [
  'Trigger',
  'Intent Router',
  'Planner',
  'Context Assembler',
  'Tool/Retrieval Selection',
  'Model Execution',
  'Evidence Challenge',
  'Policy/Control Gate',
  'Human Approval',
  'Action Execution',
  'Trace/Monitoring',
];

function assignToLanes(clauses: string[], lanes: ArchitectureLane[]): string[][] {
  const buckets: string[][] = lanes.map(() => []);
  clauses.forEach((clause, i) => {
    const matchIdx = lanes.findIndex((l) => l.keywords.test(clause));
    buckets[matchIdx >= 0 ? matchIdx : i % lanes.length].push(clause);
  });
  return buckets;
}

function svgLegendRow(y: number, width: number): string {
  const items: [string, string][] = [
    ['illustrative', 'var(--muted)'],
    ['selected', 'var(--fresh)'],
    ['client-confirmed', '#B5852A'],
  ];
  const chips = items
    .map(([label, color], i) => {
      const x = width / 2 - 260 + i * 180;
      return `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/><text x="${x + 12}" y="${y + 4}" font-size="10" fill="var(--muted)">${esc(label)}</text>`;
    })
    .join('');
  return `<g data-legend="true">${chips}</g>`;
}

function svgLayeredArchitectureExhibit(
  exhibit: RenderableExhibit,
  lanes: ArchitectureLane[],
  opts: { legend?: boolean } = {},
): string {
  const clauses = exhibitClauses(exhibit);
  const buckets = assignToLanes(clauses, lanes);
  const laneHeight = 62;
  const width = 760;
  const top = 24;
  const rows = lanes
    .map((lane, i) => {
      const y = top + i * (laneHeight + 10);
      const content = buckets[i].length
        ? buckets[i].map((c) => c.slice(0, 60)).join(' · ')
        : '(use judgment — no clause matched this layer)';
      return `<g>
        <rect x="24" y="${y}" width="${width - 48}" height="${laneHeight}" rx="8" fill="#fff" stroke="var(--line)"/>
        <rect x="24" y="${y}" width="6" height="${laneHeight}" rx="3" fill="var(--fresh)"/>
        <text x="42" y="${y + 22}" font-size="11" font-weight="700">${esc(lane.label)}</text>
        <text x="42" y="${y + 42}" font-size="10" fill="var(--muted)">${esc(content)}</text>
      </g>`;
    })
    .join('');
  const legendY = top + lanes.length * (laneHeight + 10) + 16;
  const totalHeight = legendY + (opts.legend ? 20 : 4);
  return `<svg class="exhibit-svg" viewBox="0 0 ${width} ${totalHeight}" role="img" aria-label="${esc(exhibit.title)}">
    ${rows}
    ${opts.legend ? svgLegendRow(legendY, width) : ''}
  </svg>`;
}

function svgAgentOrchestrationExhibit(exhibit: RenderableExhibit): string {
  const clauses = exhibitClauses(exhibit);
  const steps = AGENT_ORCHESTRATION_STEPS;
  const nodeWidth = 108;
  const gap = 14;
  const width = steps.length * (nodeWidth + gap) + gap;
  const y = 34;
  const nodes = steps
    .map((step, i) => {
      const x = gap + i * (nodeWidth + gap);
      const isGate = step === 'Policy/Control Gate' || step === 'Human Approval';
      const arrow =
        i < steps.length - 1
          ? `<path d="M${x + nodeWidth} ${y + 30} L${x + nodeWidth + gap} ${y + 30}" stroke="var(--fresh)" stroke-width="2" marker-end="url(#arrow-ao-${esc(exhibit.key)})"/>`
          : '';
      const annotation = clauses[i] ? clauses[i].slice(0, 30) : '';
      return `${arrow}<g>
        <rect x="${x}" y="${y}" width="${nodeWidth}" height="60" rx="8" fill="${isGate ? '#FDF6E3' : '#fff'}" stroke="${isGate ? '#E8CF8A' : 'var(--line)'}"/>
        <text x="${x + nodeWidth / 2}" y="${y + 24}" text-anchor="middle" font-size="10" font-weight="700">${esc(step)}</text>
        ${annotation ? `<text x="${x + nodeWidth / 2}" y="${y + 42}" text-anchor="middle" font-size="8" fill="var(--muted)">${esc(annotation)}</text>` : ''}
      </g>`;
    })
    .join('');
  const legendY = y + 90;
  return `<svg class="exhibit-svg" viewBox="0 0 ${width} ${legendY + 20}" role="img" aria-label="${esc(exhibit.title)}">
    <defs><marker id="arrow-ao-${esc(exhibit.key)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--fresh)"/></marker></defs>
    ${nodes}
    <circle cx="${width / 2 - 90}" cy="${legendY}" r="5" fill="#FDF6E3" stroke="#E8CF8A"/><text x="${width / 2 - 78}" y="${legendY + 4}" font-size="10" fill="var(--muted)">policy/control or human-approval gate</text>
  </svg>`;
}

function svgTimelineExhibit(exhibit: RenderableExhibit): string {
  const clauses = exhibitClauses(exhibit);
  const width = Math.max(720, clauses.length * 170);
  const nodes = clauses
    .map((clause, i) => {
      const x = 70 + i * 160;
      const line =
        i < clauses.length - 1
          ? `<path d="M${x + 28} 84 L${x + 132} 84" stroke="var(--fresh)" stroke-width="2"/>`
          : '';
      return `${line}<g>
        <circle cx="${x}" cy="84" r="24" fill="#fff" stroke="var(--fresh)" stroke-width="2"/>
        <text x="${x}" y="89" text-anchor="middle" font-size="12" font-weight="700">${i + 1}</text>
        <text x="${x}" y="130" text-anchor="middle" font-size="11" font-weight="700">${esc(clause.slice(0, 28))}</text>
      </g>`;
    })
    .join('');
  return `<svg class="exhibit-svg" viewBox="0 0 ${width} 165" role="img" aria-label="${esc(exhibit.title)}">${nodes}</svg>`;
}

/** The raw `<svg>` markup for one exhibit, dispatched by kind. Shared by the
 *  HTML renderer (inlined directly, where the page's `:root` CSS variables
 *  resolve `var(--fresh)` etc.) and the DOCX renderer (which must substitute
 *  concrete hex values before rasterising — see `resolveSvgTokens`). */
function exhibitSvg(exhibit: RenderableExhibit, index: number): string {
  const domId = `exhibit-${index + 1}`;
  return exhibit.kind === 'matrix' || exhibit.kind === 'heatmap'
    ? svgMatrixExhibit(exhibit)
    : exhibit.kind === 'timeline'
      ? svgTimelineExhibit(exhibit)
      : exhibit.kind === 'conceptual_architecture'
        ? svgLayeredArchitectureExhibit(exhibit, CONCEPTUAL_LANES)
        : exhibit.kind === 'logical_architecture'
          ? svgLayeredArchitectureExhibit(exhibit, LOGICAL_LANES)
          : exhibit.kind === 'physical_architecture'
            ? svgLayeredArchitectureExhibit(exhibit, PHYSICAL_LANES, { legend: true })
            : exhibit.kind === 'agent_orchestration'
              ? svgAgentOrchestrationExhibit(exhibit)
              : svgFlowExhibit(exhibit, domId);
}

function exhibitHtml(exhibit: RenderableExhibit, index: number): string {
  const domId = `exhibit-${index + 1}`;
  const visual = exhibitSvg(exhibit, index);
  return `<figure class="visual-exhibit" data-exhibit="${domId}" data-kind="${esc(exhibit.kind)}">
    <figcaption><span>${esc(exhibit.kind)}</span><strong>${esc(exhibit.title)}</strong></figcaption>
    ${visual}
    <p>${esc(exhibit.description)}</p>
  </figure>`;
}

// ── DOCX exhibit embedding ──
//
// The exhibit SVGs reference the page's `:root` CSS custom properties
// (`var(--fresh)`, `var(--muted)`, `var(--line)`, `var(--line2)`, `var(--ink)`
// — declared once in `renderDeliverableHtml`'s stylesheet, see the `:root{...}`
// literal below). Rasterising standalone (no surrounding page/stylesheet)
// cannot resolve those variables, so they must be substituted with the same
// concrete hex values before handing the SVG to `@resvg/resvg-js`.
const SVG_TOKEN_HEX: Record<string, string> = {
  '--bg': '#F8F7F4',
  '--panel': '#FFFFFF',
  '--ink': '#1B1A17',
  '--muted': '#6F6A61',
  '--line': '#E6E2DA',
  '--line2': '#EFECE5',
  '--chip': '#F1EEE7',
  '--fresh': '#3F7A5B',
};

function resolveSvgTokens(svg: string): string {
  return svg.replace(/var\((--[a-z0-9-]+)\)/gi, (match, token: string) => SVG_TOKEN_HEX[token] ?? match);
}

/** `resvg` refuses to parse an `<svg>` root with no `xmlns` — the exhibit
 *  markup omits it because it's designed to be inlined directly into an
 *  HTML document, where no xmlns is needed. Add it only for rasterisation. */
function withXmlns(svg: string): string {
  return /<svg\b[^>]*\bxmlns=/.test(svg)
    ? svg
    : svg.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
}

/** Rasterise one exhibit to a DOCX image paragraph + its caption/description. */
function exhibitToDocxBlocks(exhibit: RenderableExhibit, index: number): Paragraph[] {
  const svg = withXmlns(resolveSvgTokens(exhibitSvg(exhibit, index)));
  let imageParagraph: Paragraph;
  try {
    const { png, aspect } = rasteriseSvg(svg, 3);
    const width = 6.5 * 96; // 6.5in at 96dpi, in pixels (docx ImageRun expects px)
    const height = Math.round(width / aspect);
    imageParagraph = new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data: png,
          transformation: { width, height },
        }),
      ],
    });
  } catch (err) {
    // Rasterisation is best-effort — a malformed exhibit must not fail the
    // whole document. Fall back to a text notice; the same content is
    // still available in the HTML preview.
    imageParagraph = bodyParagraph([
      bodyRun(`(exhibit could not be rendered as an image — see HTML preview)`, {
        italics: true,
        color: SOURCE_DOCX.MUTED_COLOR,
      }),
    ]);
    console.error('[renderDeliverableDocx] exhibit rasterisation failed', exhibit.key, err);
  }
  return [
    heading2(exhibit.title),
    imageParagraph,
    bodyParagraph([bodyRun(exhibit.description, { italics: true, color: SOURCE_DOCX.MUTED_COLOR })]),
  ];
}

export function renderDeliverableHtml(doc: RenderableDeliverable): string {
  // Render each section's authored markdown PROPERLY (headings, bold,
  // ordered/unordered + nested lists, inline GFM tables) via the shared,
  // escape-first markdown subset renderer — never split('\n') → <p>.
  const sections = doc.generatedSections
    .map((s) => `<section><h2>${esc(s.title)}</h2>${markdownToHtml(s.bodyMarkdown)}</section>`)
    .join('');
  const exhibits = doc.exhibits.map(exhibitHtml).join('');
  const tables = doc.tables.map(tableHtml).join('');
  const register = doc.sourceRegister
    .map(
      (r) =>
        `<tr><td class="num">[${r.citationNumber}]</td><td>${esc(r.label)}</td><td>${esc(r.evidenceFamily)}</td><td>${confidencePill(r.confidence)}</td><td class="muted">${r.asOf ? esc(r.asOf) : '—'}</td></tr>`,
    )
    .join('');
  const checklist = doc.clientCompleteChecklist.map((c) => `<li>☐ <strong>${esc(c.label)}</strong> — owner: ${esc(String(c.owner))} (${esc(c.reason)})</li>`).join('');
  const nextActions = doc.nextActions.map((a) => `<li>${esc(a)}</li>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(doc.title)}</title><style>
  :root{--bg:#F8F7F4;--panel:#FFFFFF;--ink:#1B1A17;--muted:#6F6A61;--line:#E6E2DA;--line2:#EFECE5;--chip:#F1EEE7;--fresh:#3F7A5B}
  *{box-sizing:border-box}
  body{background:var(--bg);color:var(--ink);font-family:'DM Sans',-apple-system,Segoe UI,sans-serif;font-size:13.5px;line-height:1.45;margin:0}
  .wrap{max-width:860px;margin:0 auto;padding:40px 28px 80px}
  h1,h2,h3,h4{font-family:Georgia,'Times New Roman',serif;font-weight:400;color:var(--ink);margin:0}
  h1{font-size:26px;margin:8px 0 4px;line-height:1.2}
  h2{font-size:21px;margin:34px 0 10px;padding-bottom:7px;border-bottom:1px solid var(--line)}
  h3{font-size:16px;margin:22px 0 8px}
  h4{font-size:14px;margin:16px 0 6px;color:var(--muted)}
  p,li{font-size:13.5px;line-height:1.45}
  ul,ol{margin:8px 0 8px 20px;padding:0}
  li{margin:3px 0}
  strong{font-weight:600}
  code{font-family:'DM Mono',ui-monospace,Menlo,monospace;background:var(--chip);padding:1px 5px;border-radius:3px;font-size:12.5px}
  .eyebrow{letter-spacing:.12em;text-transform:uppercase;font-size:10px;color:var(--muted)}
  table.md{border-collapse:collapse;width:100%;margin:12px 0;font-size:12.5px}
  table.md th{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);text-align:left;font-weight:600;padding:9px 10px;border-bottom:1px solid var(--line)}
  table.md td{padding:9px 10px;border-bottom:1px solid var(--line2);vertical-align:top;color:var(--ink)}
  table.md tbody tr:last-child td{border-bottom:none}
  table.md tbody tr:hover td{background:#fbfaf6}
  td.num,td .num,td.muted{font-variant-numeric:tabular-nums}
  td.num{font-variant-numeric:tabular-nums;color:var(--muted)}
  td.muted{color:var(--muted)}
  .pill{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;padding:2px 8px;border-radius:999px;line-height:1.5}
  .pill .dot{width:6px;height:6px;border-radius:50%;display:inline-block}
  .pill-fresh{color:#3F7A5B;background:#3F7A5B16}.pill-fresh .dot{background:#3F7A5B}
  .pill-attention{color:#B5852A;background:#B5852A18}.pill-attention .dot{background:#B5852A}
  .pill-stale{color:#B4513C;background:#B4513C16}.pill-stale .dot{background:#B4513C}
  .pill-unknown{color:#A39C90;background:#A39C9018}.pill-unknown .dot{background:#A39C90}
  .rec{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--fresh);border-radius:8px;padding:14px 18px;margin:14px 0;font-size:13.5px}
  .checklist li{color:var(--ink)}
  .visual-exhibit{margin:16px 0 22px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;overflow-x:auto}
  .visual-exhibit figcaption{display:flex;gap:8px;align-items:baseline;margin-bottom:10px}
  .visual-exhibit figcaption span{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
  .visual-exhibit figcaption strong{font-size:14px}
  .visual-exhibit p{margin:10px 0 0;color:var(--muted);font-size:12.5px}
  .exhibit-svg{display:block;width:100%;min-width:620px;height:auto;background:#fbfaf6;border:1px solid var(--line2);border-radius:8px}
  .doc-status{font-size:12.5px;background:#FDF6E3;border:1px solid #E8CF8A;border-radius:8px;padding:12px 16px;margin:14px 0 20px}
  .doc-status .status-title{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:#8A6D1A;margin-bottom:6px}
  .doc-status .status-line{font-weight:600;color:#5A4A1A}
  .doc-status ol{margin:6px 0 6px 18px;padding:0}
  </style></head><body><div class="wrap">
  <div class="eyebrow">AbarVa · Board-grade deliverable</div>
  <h1>${esc(doc.title)}</h1>
  ${doc.subtitle ? `<div class="muted" style="color:var(--muted);font-size:13.5px;margin:2px 0">${esc(doc.subtitle)}</div>` : ''}
  <p class="eyebrow">${esc(doc.clientDisplayName)} — ${esc(doc.initiativeDisplayName)}</p>
  <div class="doc-status">
    <div class="status-title">Document Status</div>
    <div><strong>Generated by:</strong> AbarVa aVa AI-assisted generation</div>
    <div class="status-line"><strong>Current status:</strong> AI-generated working draft — not approved</div>
    <div style="margin-top:6px"><strong>Required next steps:</strong></div>
    <ol>
      <li>Review for factual accuracy and completeness.</li>
      <li>Resolve highlighted assumptions and evidence gaps.</li>
      <li>Update with client decisions and workshop outcomes.</li>
      <li>Obtain named human approval.</li>
      <li>Upload the approved version to become the governed record.</li>
    </ol>
    <div>This document must not be treated as an approved client deliverable, implementation instruction, financial commitment, architecture decision, or value claim until human approval is recorded.</div>
  </div>
  <h2>Recommendation</h2><div class="rec"><strong>Recommendation.</strong> ${esc(doc.recommendation)}</div>
  ${sections}
  ${exhibits || tables ? `<h2>Tables &amp; Exhibits</h2>${exhibits}${tables}` : ''}
  ${nextActions ? `<h3>Next Actions</h3><ol>${nextActions}</ol>` : ''}
  ${checklist ? `<h2>Client-to-Complete Checklist</h2><ul class="checklist">${checklist}</ul>` : ''}
  ${register ? `<h2>Source Register</h2><table class="md"><thead><tr><th>[n]</th><th>Source</th><th>Family</th><th>Confidence</th><th>As of</th></tr></thead><tbody>${register}</tbody></table>` : ''}
  <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:32px;padding-top:10px;border-top:1px dashed var(--line)">AI-generated working draft. Human review, update, approval, and approved re-upload are required before this artifact becomes authoritative.</div>
  </div></body></html>`;
}
