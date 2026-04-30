// EXPORT-3-EXTEND-2 · Workshop Facilitator Guide document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Workshop Facilitator Guide is the run-of-show that turns a
// scheduled session into a working session. It exists because hours of
// senior-stakeholder time are wasted when the facilitator improvises the
// agenda, the probes are not pre-loaded, and the closeout protocol is
// "we'll send notes later". The guide carries:
//
//   • who is in the room and why each role matters
//   • what the facilitator and participants must do BEFORE the workshop
//   • a numbered agenda — each item with objective, instructions, output
//   • pre-built probes the facilitator scans during the run
//   • anti-patterns and the recommended facilitator response
//   • a closeout protocol — decisions, action items, escalations
//
// The shape mirrors the archetype-primer template in
// PAT-PRG-CDP-001's `cdp-data-discovery-facilitator-guide`: that
// template names *what* a facilitator guide must carry; this builder
// renders any concrete instance of that shape.
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy)
// + src/lib/programs/archetype-primers/PAT-PRG-CDP-001.ts (template).

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

export interface WorkshopFacilitatorGuideTargetParticipant {
  role: string;
  rationale: string;
}

export interface WorkshopFacilitatorGuideWorkshop {
  title: string;
  durationMinutes: number;
  targetParticipants: ReadonlyArray<WorkshopFacilitatorGuideTargetParticipant>;
  /** What the workshop produces, e.g. baseline spreadsheet, stakeholder map. */
  outputArtifacts: string[];
}

export interface WorkshopFacilitatorGuidePreWorkshopPrep {
  facilitatorPrep: string[];
  participantPrep: string[];
  materialsRequired: string[];
}

export interface WorkshopFacilitatorGuideAgendaItem {
  /** Stable id used to tie probes / anti-patterns back to this item. */
  id: string;
  durationMinutes: number;
  title: string;
  /** What this item must accomplish — the success condition. */
  objective: string;
  /** Facilitator narrative — how to actually run the segment. */
  instructions: string;
  /** What this segment produces (artifact, decision, etc.). */
  output: string;
}

export interface WorkshopFacilitatorGuideProbe {
  /** Ties to an agenda item id. */
  activityId: string;
  probe: string;
  purpose: string;
}

export interface WorkshopFacilitatorGuideAntiPattern {
  signal: string;
  recommendedFacilitatorResponse: string;
}

export interface WorkshopFacilitatorGuideCloseout {
  decisionsToCapture: string[];
  actionItemsCommitted: string[];
  escalationsRequired: string[];
}

/** Workshop Facilitator Guide payload narrowed for this slice. */
export interface WorkshopFacilitatorGuidePayload {
  workshop: WorkshopFacilitatorGuideWorkshop;
  preWorkshopPrep: WorkshopFacilitatorGuidePreWorkshopPrep;
  agenda: ReadonlyArray<WorkshopFacilitatorGuideAgendaItem>;
  facilitationProbes: ReadonlyArray<WorkshopFacilitatorGuideProbe>;
  antiPatterns: ReadonlyArray<WorkshopFacilitatorGuideAntiPattern>;
  closeout: WorkshopFacilitatorGuideCloseout;
}

/** Spec narrowed to the workshop-facilitator-guide kind + payload. */
export type WorkshopFacilitatorGuideSpec = Omit<
  DeliverableSpec,
  'kind' | 'payload'
> & {
  kind: 'workshop-facilitator-guide';
  payload: WorkshopFacilitatorGuidePayload;
};

// ── Brand fonts + signal colors ─────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

/** Amber wash behind the anti-patterns table to flag importance. */
const AMBER_WASH_HEX = 'FEF3C7';
/** Amber text/border tone used for the anti-patterns header. */
const AMBER_HEX = 'B45309';

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

function workshopBanner(workshop: WorkshopFacilitatorGuideWorkshop): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text: `WORKSHOP FACILITATOR GUIDE · ${workshop.title.toUpperCase()} · ${workshop.durationMinutes.toString()} MIN`,
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

function italicParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        italics: true,
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

/** Bold label/value with the value bolded as well — used for objectives. */
function boldLabeledLine(label: string, value: string): Paragraph {
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
        bold: true,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

// ── Table helpers ───────────────────────────────────────────────────────

function headerCell(text: string, opts?: { fill?: string }): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    shading: { fill: opts?.fill ?? '0A0A0A' },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: opts?.fill !== undefined ? '0A0A0A' : 'F5F5F0',
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

function dataCell(
  text: string,
  opts?: { bold?: boolean; mono?: boolean; fill?: string },
): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    shading: opts?.fill !== undefined ? { fill: opts.fill } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 20,
            bold: opts?.bold === true,
            font: opts?.mono === true ? 'Courier New' : SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

// ── Section builders ────────────────────────────────────────────────────

function buildTitlePage(
  spec: WorkshopFacilitatorGuideSpec,
  generatedAt: Date,
): Paragraph[] {
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
  out.push(workshopBanner(spec.payload.workshop));
  out.push(labeledLine('Workshop', spec.payload.workshop.title));
  out.push(
    labeledLine(
      'Duration',
      `${spec.payload.workshop.durationMinutes.toString()} minutes`,
    ),
  );
  return out;
}

function buildOverviewSection(
  payload: WorkshopFacilitatorGuidePayload,
): Array<Paragraph | Table> {
  const w = payload.workshop;
  const out: Array<Paragraph | Table> = [
    sectionHeading('Workshop overview'),
    bodyParagraph(
      'A workshop earns the time it takes only when each role in the room maps to a specific need ' +
        'and each output artifact is named in advance. The block below makes that mapping explicit.',
    ),
    subsectionHeading('Target participants'),
  ];

  const headers: ReadonlyArray<string> = ['Role', 'Why this role matters'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = w.targetParticipants.map(
    (p) =>
      new TableRow({
        children: [dataCell(p.role, { bold: true }), dataCell(p.rationale)],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  out.push(table);

  out.push(subsectionHeading('Output artifacts'));
  if (w.outputArtifacts.length > 0) {
    for (const a of w.outputArtifacts) {
      out.push(bulletParagraph(a));
    }
  } else {
    out.push(
      bodyParagraph(
        'No output artifacts named. A workshop without named outputs is a status meeting; reschedule ' +
          'or re-scope before running.',
      ),
    );
  }
  return out;
}

function buildPreWorkshopPrepSection(
  payload: WorkshopFacilitatorGuidePayload,
): Paragraph[] {
  const p = payload.preWorkshopPrep;
  const out: Paragraph[] = [
    sectionHeading('Pre-workshop prep'),
    bodyParagraph(
      'Each list below must be complete before the room is in session. Walking in with prep undone is ' +
        'the most common cause of a workshop that fails to land its outputs.',
    ),
    subsectionHeading('Facilitator prep'),
  ];
  if (p.facilitatorPrep.length > 0) {
    for (const item of p.facilitatorPrep) {
      out.push(bulletParagraph(item));
    }
  } else {
    out.push(bodyParagraph('No facilitator prep items listed.'));
  }
  out.push(subsectionHeading('Participant prep'));
  if (p.participantPrep.length > 0) {
    for (const item of p.participantPrep) {
      out.push(bulletParagraph(item));
    }
  } else {
    out.push(bodyParagraph('No participant prep items listed.'));
  }
  out.push(subsectionHeading('Materials required'));
  if (p.materialsRequired.length > 0) {
    for (const item of p.materialsRequired) {
      out.push(bulletParagraph(item));
    }
  } else {
    out.push(bodyParagraph('No materials called out.'));
  }
  return out;
}

/** Format the agenda index as a zero-padded label, e.g. 01, 02, 03. */
function agendaIndexLabel(index: number): string {
  const oneBased = index + 1;
  if (oneBased < 10) {
    return `0${oneBased.toString()}`;
  }
  return oneBased.toString();
}

function buildAgendaSection(payload: WorkshopFacilitatorGuidePayload): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Agenda'),
    bodyParagraph(
      'Numbered run-of-show. For each item: title, duration, objective (the success condition), ' +
        'facilitator instructions, and the named output. A workshop that runs the clock without ' +
        'producing the listed output is a workshop that ran out of facilitation, not out of time.',
    ),
  ];
  payload.agenda.forEach((item, idx) => {
    const indexLabel = agendaIndexLabel(idx);
    out.push(subsectionHeading(`${indexLabel} · ${item.title}`));
    out.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${item.durationMinutes.toString()} min`,
            font: 'Courier New',
            size: 20,
            color: '706D66',
          }),
        ],
      }),
    );
    out.push(boldLabeledLine('Objective', item.objective));
    out.push(bodyParagraph(item.instructions));
    out.push(italicParagraph(`Output: ${item.output}`));
  });
  return out;
}

function buildProbesSection(
  payload: WorkshopFacilitatorGuidePayload,
): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [
    sectionHeading('Facilitation probes'),
    bodyParagraph(
      'Probes the facilitator scans during the run. Grouped by the agenda item they support so the ' +
        'facilitator can find the right one in real time without reading the whole guide. A probe ' +
        'is not a script line — it is a question that forces a position from the room.',
    ),
  ];

  // Group probes by activityId, preserving the order activities appear in
  // the agenda. Probes whose activityId matches no agenda item are emitted
  // last under an explicit "Unattached" group.
  const agendaOrder = new Map<string, number>();
  payload.agenda.forEach((item, idx) => agendaOrder.set(item.id, idx));

  const groups = new Map<string, WorkshopFacilitatorGuideProbe[]>();
  for (const probe of payload.facilitationProbes) {
    const existing = groups.get(probe.activityId) ?? [];
    existing.push(probe);
    groups.set(probe.activityId, existing);
  }

  const orderedGroupIds = [...groups.keys()].sort((a, b) => {
    const ai = agendaOrder.get(a);
    const bi = agendaOrder.get(b);
    if (ai === undefined && bi === undefined) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    if (ai === undefined) {
      return 1;
    }
    if (bi === undefined) {
      return -1;
    }
    return ai - bi;
  });

  if (orderedGroupIds.length === 0) {
    out.push(
      bodyParagraph(
        'No facilitation probes registered. Pre-load probes before the workshop runs; relying on ' +
          'real-time invention is how rooms drift away from the objective.',
      ),
    );
    return out;
  }

  const headers: ReadonlyArray<string> = ['Activity', 'Probe', 'Purpose'];

  for (const activityId of orderedGroupIds) {
    const probes = groups.get(activityId) ?? [];
    const agendaItem = payload.agenda.find((a) => a.id === activityId);
    const groupTitle =
      agendaItem !== undefined
        ? `Probes for · ${agendaItem.title}`
        : `Probes for · ${activityId} (no matching agenda item)`;
    out.push(subsectionHeading(groupTitle));
    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map((h) => headerCell(h)),
    });
    const dataRows = probes.map(
      (p) =>
        new TableRow({
          children: [
            dataCell(activityId, { mono: true }),
            dataCell(p.probe, { bold: true }),
            dataCell(p.purpose),
          ],
        }),
    );
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });
    out.push(table);
  }
  return out;
}

function buildAntiPatternsSection(
  payload: WorkshopFacilitatorGuidePayload,
): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [
    sectionHeading('Anti-patterns to watch for'),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text:
            'Signals the facilitator scans for in real time, paired with a recommended response. ' +
            'Pretending these never appear is itself a facilitation failure.',
          color: AMBER_HEX,
          size: 22,
          font: SANS_BODY_FONT,
        }),
      ],
    }),
  ];

  if (payload.antiPatterns.length === 0) {
    out.push(
      bodyParagraph(
        'No anti-patterns registered. Re-author this guide before re-running the workshop; every ' +
          'mature workshop has anti-patterns the facilitator has learned to interrupt.',
      ),
    );
    return out;
  }

  const headers: ReadonlyArray<string> = [
    'Signal',
    'Recommended facilitator response',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h, { fill: AMBER_WASH_HEX })),
  });
  const dataRows = payload.antiPatterns.map(
    (a) =>
      new TableRow({
        children: [
          dataCell(a.signal, { bold: true, fill: AMBER_WASH_HEX }),
          dataCell(a.recommendedFacilitatorResponse, { fill: AMBER_WASH_HEX }),
        ],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  out.push(table);
  return out;
}

function buildCloseoutSection(
  payload: WorkshopFacilitatorGuidePayload,
): Paragraph[] {
  const c = payload.closeout;
  const out: Paragraph[] = [
    sectionHeading('Closeout protocol'),
    bodyParagraph(
      'Run this protocol in the last fifteen minutes — not after the room has emptied. A workshop ' +
        'whose decisions, action items, and escalations are captured days later is a workshop whose ' +
        'output is silently rewritten by whoever sends the recap email.',
    ),
    subsectionHeading('Decisions to capture'),
  ];
  if (c.decisionsToCapture.length > 0) {
    for (const d of c.decisionsToCapture) {
      out.push(bulletParagraph(d));
    }
  } else {
    out.push(
      bodyParagraph(
        'No decisions enumerated. If the workshop produces no decisions, name that explicitly so the ' +
          'sponsor is not waiting for a sign-off that will not arrive.',
      ),
    );
  }
  out.push(subsectionHeading('Action items committed'));
  if (c.actionItemsCommitted.length > 0) {
    for (const a of c.actionItemsCommitted) {
      out.push(bulletParagraph(a));
    }
  } else {
    out.push(bodyParagraph('No action items committed.'));
  }
  out.push(subsectionHeading('Escalations required'));
  if (c.escalationsRequired.length > 0) {
    for (const e of c.escalationsRequired) {
      out.push(bulletParagraph(e));
    }
  } else {
    out.push(bodyParagraph('No escalations required.'));
  }
  return out;
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a workshop-facilitator-guide
 * spec. Pure — no I/O. The DOCX renderer dispatcher serializes the
 * returned document to a buffer.
 */
export function buildWorkshopFacilitatorGuideDocument(
  spec: WorkshopFacilitatorGuideSpec,
): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildOverviewSection(spec.payload),
    ...buildPreWorkshopPrepSection(spec.payload),
    ...buildAgendaSection(spec.payload),
    ...buildProbesSection(spec.payload),
    ...buildAntiPatternsSection(spec.payload),
    ...buildCloseoutSection(spec.payload),
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
