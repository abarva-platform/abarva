// EXPORT-3-EXTEND · Meeting Notes document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// Meeting Notes are a narrative capture of any workshop, 1:1, gate
// review, or sponsor cadence. They exist so decisions made in
// off-platform conversation become auditable artifacts that flow back
// into the program record.
//
// A meeting note is not a transcript. It captures what was discussed,
// what was decided, what was committed (with owner + due date), and
// what remains open — in that order — so a reader who was not in the
// room can act on the same accountability as someone who was.

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

export type MeetingNotesType =
  | 'workshop'
  | '1:1'
  | 'gate-review'
  | 'sponsor-cadence'
  | 'other';

export interface MeetingNotesMeeting {
  title: string;
  type: MeetingNotesType;
  /** ISO date or human date — rendered verbatim. */
  date: string;
  durationMinutes: number;
}

export interface MeetingNotesAttendee {
  name: string;
  role: string;
}

export interface MeetingNotesDiscussion {
  topic: string;
  summary: string;
}

export interface MeetingNotesDecision {
  decision: string;
  decidedBy: string;
  rationale?: string;
}

export interface MeetingNotesActionItem {
  owner: string;
  action: string;
  dueBy: string;
}

/** Meeting Notes payload narrowed for this slice. */
export interface MeetingNotesPayload {
  meeting: MeetingNotesMeeting;
  attendees: ReadonlyArray<MeetingNotesAttendee>;
  agenda?: ReadonlyArray<string>;
  keyDiscussions: ReadonlyArray<MeetingNotesDiscussion>;
  decisions: ReadonlyArray<MeetingNotesDecision>;
  actionItems: ReadonlyArray<MeetingNotesActionItem>;
  openQuestions?: ReadonlyArray<string>;
  notesAuthor: string;
}

export type MeetingNotesSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'meeting-notes';
  payload: MeetingNotesPayload;
};

// ── Brand fonts ─────────────────────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

/** Glyph used to render an unchecked action-item box. */
const ACTION_CHECKBOX = '☐';

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

function meetingBanner(meeting: MeetingNotesMeeting): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text: `MEETING NOTES · ${meeting.type.toUpperCase()} · ${meeting.date}`,
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

function subsectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
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

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
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

function dataCell(text: string, opts?: { bold?: boolean }): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold === true,
            size: 20,
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

// ── Section builders ────────────────────────────────────────────────────

function buildTitlePage(spec: MeetingNotesSpec, generatedAt: Date): Paragraph[] {
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
  out.push(meetingBanner(spec.payload.meeting));
  out.push(labeledLine('Meeting', spec.payload.meeting.title));
  out.push(labeledLine('Date', spec.payload.meeting.date));
  out.push(
    labeledLine(
      'Duration',
      `${spec.payload.meeting.durationMinutes.toString()} minutes`,
    ),
  );
  return out;
}

function buildAttendeesSection(
  payload: MeetingNotesPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = ['Name', 'Role'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.attendees.map(
    (a) =>
      new TableRow({
        children: [dataCell(a.name, { bold: true }), dataCell(a.role)],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [sectionHeading('Attendees'), table];
}

function buildAgendaSection(agenda: ReadonlyArray<string>): Paragraph[] {
  const out: Paragraph[] = [sectionHeading('Agenda')];
  for (const item of agenda) {
    out.push(bulletParagraph(item));
  }
  return out;
}

function buildKeyDiscussionsSection(payload: MeetingNotesPayload): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Key discussions'),
    bodyParagraph(
      'Each topic captures the substance of the discussion — not a transcript. A reader who was ' +
        'not in the room should be able to understand the point at issue and the position the room landed on.',
    ),
  ];
  for (const d of payload.keyDiscussions) {
    out.push(subsectionHeading(d.topic));
    out.push(bodyParagraph(d.summary));
  }
  return out;
}

function buildDecisionsSection(
  payload: MeetingNotesPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = ['Decision', 'Decided by', 'Rationale'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.decisions.map(
    (d) =>
      new TableRow({
        children: [
          dataCell(d.decision, { bold: true }),
          dataCell(d.decidedBy),
          dataCell(d.rationale ?? '—'),
        ],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Decisions'),
    bodyParagraph(
      'Decisions made in this meeting are binding for the program record unless overturned in a ' +
        'later logged decision. Each row names the decision-maker so accountability does not dissolve into "the room agreed".',
    ),
    table,
  ];
}

function buildActionItemsSection(
  payload: MeetingNotesPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = ['', 'Owner', 'Action', 'Due by'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.actionItems.map(
    (ai) =>
      new TableRow({
        children: [
          dataCell(ACTION_CHECKBOX),
          dataCell(ai.owner, { bold: true }),
          dataCell(ai.action),
          dataCell(ai.dueBy),
        ],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Action items'),
    bodyParagraph(
      'Each item has a single owner and a due date. "Team will follow up" is not an action item; ' +
        'unowned commitments are rejected from the program record.',
    ),
    table,
  ];
}

function buildOpenQuestionsSection(
  questions: ReadonlyArray<string>,
): Paragraph[] {
  const out: Paragraph[] = [sectionHeading('Open questions')];
  for (const q of questions) {
    out.push(bulletParagraph(q));
  }
  return out;
}

function buildFooter(payload: MeetingNotesPayload, generatedAt: Date): Paragraph[] {
  return [
    sectionHeading('Notes captured by'),
    labeledLine('Notes author', payload.notesAuthor),
    timestampParagraph(`Captured at ${generatedAt.toISOString()}`),
  ];
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a meeting-notes spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildMeetingNotesDocument(spec: MeetingNotesSpec): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildAttendeesSection(spec.payload),
  ];

  if (spec.payload.agenda !== undefined && spec.payload.agenda.length > 0) {
    children.push(...buildAgendaSection(spec.payload.agenda));
  }

  children.push(...buildKeyDiscussionsSection(spec.payload));
  children.push(...buildDecisionsSection(spec.payload));
  children.push(...buildActionItemsSection(spec.payload));

  if (
    spec.payload.openQuestions !== undefined &&
    spec.payload.openQuestions.length > 0
  ) {
    children.push(...buildOpenQuestionsSection(spec.payload.openQuestions));
  }

  children.push(...buildFooter(spec.payload, generatedAt));

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
