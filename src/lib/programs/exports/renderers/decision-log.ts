// EXPORT-3-EXTEND · Decision Log document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Decision Log is the running record of programmatic decisions made
// across phases. Each entry names the decision, who made it, why, what
// it impacts, whether it can be reversed, and what evidence supports it.
//
// The log is not a status update. It is the audit trail Nexus uses to
// explain how a program arrived at the state it is in — and to detect
// drift where later behavior contradicts an earlier logged decision.

import 'server-only';

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import type { DeliverableSpec } from '../types';

// ── Payload types ───────────────────────────────────────────────────────

/** One decision-log entry. */
export interface DecisionLogEntry {
  id: string;
  /** ISO date the decision was made (used to sort newest-first). */
  decisionDate: string;
  decision: string;
  decidedBy: string;
  rationale: string;
  impactedAreas: string[];
  /** True if the decision can be reversed without major rework. */
  reversible: boolean;
  /** Optional refs (artifact ids, URLs, doc names) that ground the decision. */
  evidenceRefs?: string[];
}

export interface DecisionLogProgramSummary {
  name: string;
  /** Phase label (e.g. 'P3 Design'). */
  phase: string;
}

/** Decision Log payload narrowed for this slice. */
export interface DecisionLogPayload {
  programSummary: DecisionLogProgramSummary;
  entries: ReadonlyArray<DecisionLogEntry>;
}

export type DecisionLogSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'decision-log';
  payload: DecisionLogPayload;
};

// ── Brand fonts ─────────────────────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

// ── Paragraph helpers ───────────────────────────────────────────────────

function titleHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 44,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

function subtitleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        italics: true,
        size: 24,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

function tenantKeyParagraph(tenantKey: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: `Tenant: ${tenantKey}`,
        font: 'Courier New',
        size: 18,
        color: '706D66',
      }),
    ],
  });
}

function timestampParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        italics: true,
        size: 18,
        color: '706D66',
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

function decisionLogBanner(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text: 'DECISION LOG · PROGRAM AUDIT TRAIL',
        bold: true,
        size: 22,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

function labeledLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: 22,
        font: SANS_BODY_FONT,
      }),
      new TextRun({
        text: value,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

// ── Table helpers ───────────────────────────────────────────────────────

function headerCell(text: string): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    shading: { fill: '0A0A0A' },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: 'F5F5F0',
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

function dataCell(text: string, opts?: { bold?: boolean; mono?: boolean }): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold === true,
            size: 20,
            font: opts?.mono === true ? 'Courier New' : SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

// ── Section builders ────────────────────────────────────────────────────

function buildTitlePage(spec: DecisionLogSpec, generatedAt: Date): Paragraph[] {
  const out: Paragraph[] = [];
  out.push(titleHeading(spec.title));
  if (spec.subtitle !== undefined) {
    out.push(subtitleParagraph(spec.subtitle));
  }
  out.push(tenantKeyParagraph(spec.tenantKey));
  out.push(
    timestampParagraph(
      `Generated by ${spec.brandSubtitle ?? 'AbarVa · Programs'} at ${generatedAt.toISOString()}`,
    ),
  );
  if (spec.authors !== undefined && spec.authors.length > 0) {
    out.push(timestampParagraph(`Authors: ${spec.authors.join(', ')}`));
  }
  out.push(decisionLogBanner());
  return out;
}

function buildProgramSummarySection(payload: DecisionLogPayload): Paragraph[] {
  const ps = payload.programSummary;
  return [
    sectionHeading('Program summary'),
    labeledLine('Program', ps.name),
    labeledLine('Current phase', ps.phase),
    bodyParagraph(
      'Decisions below are sorted newest-first. Each entry is a binding action of record; ' +
        'a later decision may override an earlier one but the earlier entry is never deleted from the log.',
    ),
  ];
}

function buildEntriesTable(payload: DecisionLogPayload): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'ID',
    'Date',
    'Decision',
    'Decided by',
    'Rationale',
    'Reversible',
    'Evidence',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });

  // Sort newest-first by ISO decisionDate. Stable sort: equal dates keep
  // their input order, which preserves caller intent for same-day entries.
  const sorted = [...payload.entries].sort((a, b) => {
    if (a.decisionDate === b.decisionDate) {
      return 0;
    }
    return a.decisionDate < b.decisionDate ? 1 : -1;
  });

  const dataRows = sorted.map((entry) => {
    const evidence =
      entry.evidenceRefs !== undefined && entry.evidenceRefs.length > 0
        ? entry.evidenceRefs.join('; ')
        : '—';
    const impacted =
      entry.impactedAreas.length > 0
        ? `Impacts: ${entry.impactedAreas.join(', ')}`
        : 'Impacts: —';
    const decisionWithImpact = `${entry.decision}\n${impacted}`;
    return new TableRow({
      children: [
        dataCell(entry.id, { mono: true }),
        dataCell(entry.decisionDate),
        dataCell(decisionWithImpact, { bold: true }),
        dataCell(entry.decidedBy),
        dataCell(entry.rationale),
        dataCell(entry.reversible ? 'Yes' : 'No', { bold: !entry.reversible }),
        dataCell(evidence),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  return [sectionHeading('Decision log'), table];
}

function buildFooter(
  payload: DecisionLogPayload,
  generatedAt: Date,
): Paragraph[] {
  const count = payload.entries.length;
  return [
    sectionHeading('Log status'),
    labeledLine('Entries', count.toString()),
    labeledLine('As of', generatedAt.toISOString()),
    bodyParagraph(
      'A decision drift detected after this log is generated will surface as a Nexus governance ' +
        'alert citing the entry id of the contradicted decision.',
    ),
  ];
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a decision-log spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildDecisionLogDocument(spec: DecisionLogSpec): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildProgramSummarySection(spec.payload),
    ...buildEntriesTable(spec.payload),
    ...buildFooter(spec.payload, generatedAt),
  ];

  return new Document({
    creator: 'AbarVa Programs',
    title: spec.title,
    description: spec.subtitle,
    styles: {
      default: {
        heading1: {
          run: {
            font: SERIF_HEADING_FONT,
            size: 44,
            bold: true,
            color: '0A0A0A',
          },
        },
        heading2: {
          run: {
            font: SERIF_HEADING_FONT,
            size: 30,
            bold: true,
            color: '0A0A0A',
          },
        },
        heading3: {
          run: {
            font: SERIF_HEADING_FONT,
            size: 24,
            bold: true,
            color: '0A0A0A',
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}
