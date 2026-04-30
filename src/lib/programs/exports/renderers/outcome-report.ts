// EXPORT-3-EXTEND · Outcome Report document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Outcome Report is the narrative output of P5 Activate. It closes
// the gate between P5 and P6 by proving outcomes against the P2 charter
// baseline:
//
//   • outcomes vs baseline (the heart of the document)
//   • adoption evidence by cohort
//   • benefits attestation by an accountable signer
//   • challenges and mitigations from rollout waves
//   • learnings worth promoting to the pattern catalog
//   • a P6 handoff plan with standing owner and review cadence
//
// The Outcome Report exists to make benefits attestation auditable —
// not dependent on program-team optimism. Source comparability with the
// P2 baseline is preserved across the outcomesVsBaseline rows.
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy)
// + src/lib/programs/phase-packs/P5_activate.ts (DoD + anti-patterns).

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

/** Program summary block displayed at the top of the report. */
export interface OutcomeReportProgramSummary {
  name: string;
  sponsor: string;
  programLead: string;
  /** ISO date the charter was signed (P2 gate). */
  charterDate: string;
  /** ISO date the outcome was attested (P5 → P6 gate). */
  outcomeDate: string;
}

/** One outcome metric: charter baseline → target → actual. */
export interface OutcomeReportOutcomeRow {
  metric: string;
  baselineValue: string;
  targetValue: string;
  actualValue: string;
  /** Free text — e.g. '+18% vs target', 'on-target', '−4 pts vs target'. */
  deltaVsTarget: string;
  /** 0..1 — sponsor / CXO confidence in the measurement. */
  confidence: number;
  measurementMethod: string;
}

/** Adoption evidence row — one per cohort × metric. */
export interface OutcomeReportAdoptionRow {
  cohort: string;
  metric: string;
  result: string;
}

/** Benefits attestation — signed-block style. */
export interface OutcomeReportBenefitsAttestation {
  attestedBy: string;
  /** ISO timestamp of attestation. */
  attestedAt: string;
  /** Free-text statement; rendered in italics under the signature line. */
  attestationStatement: string;
}

/** One challenge surfaced during rollout, paired with the mitigation taken. */
export interface OutcomeReportChallengeMitigation {
  challenge: string;
  mitigation: string;
}

/** A learning worth promoting to the pattern catalog. */
export interface OutcomeReportLearning {
  learning: string;
  applicability: 'archetype-specific' | 'cross-archetype';
}

/** P6 handoff plan — who owns the capability after the launch team dissolves. */
export interface OutcomeReportP6HandoffPlan {
  standingOwner: string;
  /** Cadence for governance review (e.g. 'monthly', 'quarterly'). */
  quarterlyReviewCadence: string;
  /** Thresholds that trigger expand or kill review. */
  killOrExpandThresholds: string[];
}

/** Outcome Report payload narrowed for this slice. */
export interface OutcomeReportPayload {
  programSummary: OutcomeReportProgramSummary;
  outcomesVsBaseline: ReadonlyArray<OutcomeReportOutcomeRow>;
  adoptionEvidence: ReadonlyArray<OutcomeReportAdoptionRow>;
  benefitsAttestation: OutcomeReportBenefitsAttestation;
  challengesAndMitigations: ReadonlyArray<OutcomeReportChallengeMitigation>;
  learningsForCatalog: ReadonlyArray<OutcomeReportLearning>;
  p6HandoffPlan: OutcomeReportP6HandoffPlan;
}

/** Spec narrowed to the outcome-report kind + payload. */
export type OutcomeReportSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'outcome-report';
  payload: OutcomeReportPayload;
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

function gateBanner(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text: 'OUTCOME REPORT · P5 GATE PACKAGE',
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

function bodyParagraphRich(
  runs: ReadonlyArray<{ text: string; bold?: boolean }>,
): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold === true,
          size: 22,
          font: SANS_BODY_FONT,
        }),
    ),
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

function buildTitlePage(spec: OutcomeReportSpec, generatedAt: Date): Paragraph[] {
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
  out.push(gateBanner());
  return out;
}

function buildProgramSummarySection(payload: OutcomeReportPayload): Paragraph[] {
  const ps = payload.programSummary;
  return [
    sectionHeading('Program summary'),
    labeledLine('Program', ps.name),
    labeledLine('Sponsor', ps.sponsor),
    labeledLine('Program lead', ps.programLead),
    labeledLine('Charter date', ps.charterDate),
    labeledLine('Outcome attestation date', ps.outcomeDate),
  ];
}

function buildOutcomesSection(
  payload: OutcomeReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Metric',
    'Baseline',
    'Target',
    'Actual',
    'Δ vs target',
    'Confidence',
    'Measurement method',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.outcomesVsBaseline.map((row) => {
    const confidence = `${Math.round(row.confidence * 100)}%`;
    return new TableRow({
      children: [
        dataCell(row.metric, { bold: true }),
        dataCell(row.baselineValue),
        dataCell(row.targetValue),
        dataCell(row.actualValue, { bold: true }),
        dataCell(row.deltaVsTarget),
        dataCell(confidence),
        dataCell(row.measurementMethod),
      ],
    });
  });
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Outcomes vs. baseline'),
    bodyParagraph(
      'Each row uses the same measurement source and grain locked at the P2 charter — no scoreboard ' +
        'movement between charter and outcome. Where the source had to change, the conversion bridge ' +
        'is documented in the measurement method column and signed by the metric owner.',
    ),
    table,
  ];
}

function buildAdoptionSection(
  payload: OutcomeReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = ['Cohort', 'Adoption metric', 'Result'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.adoptionEvidence.map(
    (row) =>
      new TableRow({
        children: [dataCell(row.cohort), dataCell(row.metric), dataCell(row.result)],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Adoption evidence'),
    bodyParagraph(
      'Behavior telemetry, not training attendance. Adoption is reported by cohort because rollout ' +
        'waves were intentionally sequenced; aggregate-only adoption claims are rejected at the P5 → P6 gate.',
    ),
    table,
  ];
}

function buildBenefitsAttestationSection(payload: OutcomeReportPayload): Paragraph[] {
  const ba = payload.benefitsAttestation;
  return [
    sectionHeading('Benefits attestation'),
    bodyParagraph(
      'The named attester certifies that the outcomes above are observed against the P2 baseline and ' +
        'are fit for portfolio reporting and Operate handoff.',
    ),
    labeledLine('Attested by', ba.attestedBy),
    labeledLine('Attested at', ba.attestedAt),
    bodyParagraph('___________________________________________ (signature)'),
    italicParagraph(`"${ba.attestationStatement}"`),
  ];
}

function buildChallengesSection(payload: OutcomeReportPayload): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Challenges and mitigations'),
    bodyParagraph(
      'Rollout produced friction. The pairs below name what surfaced and what was done — pretending ' +
        'no challenges existed is a P5 anti-pattern flagged by Nexus during wave debriefs.',
    ),
  ];
  for (const cm of payload.challengesAndMitigations) {
    out.push(
      bodyParagraphRich([
        { text: 'Challenge: ', bold: true },
        { text: cm.challenge },
      ]),
    );
    out.push(bulletParagraph(`Mitigation: ${cm.mitigation}`));
  }
  return out;
}

function buildLearningsSection(payload: OutcomeReportPayload): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Learnings for pattern catalog'),
    bodyParagraph(
      'Each learning below is tagged for catalog promotion. Cross-archetype learnings are surfaced ' +
        'first; archetype-specific learnings are scoped so future programs do not over-generalize.',
    ),
  ];
  // Render cross-archetype learnings first to make catalog promotion legible.
  const sorted = [
    ...payload.learningsForCatalog.filter(
      (l) => l.applicability === 'cross-archetype',
    ),
    ...payload.learningsForCatalog.filter(
      (l) => l.applicability === 'archetype-specific',
    ),
  ];
  for (const l of sorted) {
    const tag =
      l.applicability === 'cross-archetype'
        ? '[cross-archetype]'
        : '[archetype-specific]';
    out.push(bulletParagraph(`${tag} ${l.learning}`));
  }
  return out;
}

function buildHandoffSection(payload: OutcomeReportPayload): Paragraph[] {
  const hp = payload.p6HandoffPlan;
  const out: Paragraph[] = [
    sectionHeading('P6 handoff plan'),
    labeledLine('Standing owner', hp.standingOwner),
    labeledLine('Review cadence', hp.quarterlyReviewCadence),
  ];
  if (hp.killOrExpandThresholds.length > 0) {
    out.push(subsectionHeading('Kill / expand thresholds'));
    for (const t of hp.killOrExpandThresholds) {
      out.push(bulletParagraph(t));
    }
  }
  out.push(
    bodyParagraph(
      'The standing owner inherits adoption, quality, cost, and drift measurement. Handoff is not ' +
        'complete until this owner has accepted the cadence above and the thresholds that would force ' +
        'expand or kill review.',
    ),
  );
  return out;
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for an outcome-report spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildOutcomeReportDocument(spec: OutcomeReportSpec): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildProgramSummarySection(spec.payload),
    ...buildOutcomesSection(spec.payload),
    ...buildAdoptionSection(spec.payload),
    ...buildBenefitsAttestationSection(spec.payload),
    ...buildChallengesSection(spec.payload),
    ...buildLearningsSection(spec.payload),
    ...buildHandoffSection(spec.payload),
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
