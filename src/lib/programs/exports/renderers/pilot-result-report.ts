// EXPORT-3-EXTEND-2 · Pilot Result Report document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Pilot Result Report is the narrative output of P4 Build. It closes
// the gate between P4 and P5 by proving — or failing to prove — the
// pilot against the success criteria locked in P3:
//
//   • the pilot cohort and its scope (no silent substitution)
//   • criterion-by-criterion pass/fail vs the locked targets
//   • observed cohort-level outcomes (broader context than the criteria)
//   • edge cases that surfaced during the pilot run
//   • scale-validation findings — does the result hold beyond pilot?
//   • change-management readiness, the input that gates P5 rollout
//   • a binding go / no-go / extend-pilot recommendation for P5
//
// A pilot result without an explicit recommendation is a status update,
// not a gate package. A recommendation without criterion-level evidence
// is enthusiasm. This builder enforces both shapes.
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy)
// + src/lib/programs/phase-packs/P4_build.ts (DoD + anti-patterns).

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

export interface PilotResultReportProgramSummary {
  name: string;
  /** Phase label (e.g. 'P4 Build'). */
  phase: string;
  /** ISO date — pilot start. */
  pilotStartDate: string;
  /** ISO date — pilot end. */
  pilotEndDate: string;
}

export interface PilotResultReportCohort {
  /** Cohort handle (e.g. 'Top-decile loyalty members'). */
  name: string;
  /** Free-text scope notes — population, channels, exclusions. */
  sizeNotes: string;
}

export type PilotResultMetStatus = 'met' | 'unmet' | 'partial';

export interface PilotResultReportSuccessCriterion {
  criterion: string;
  targetValue: string;
  actualValue: string;
  metStatus: PilotResultMetStatus;
  measurementMethod: string;
}

export interface PilotResultReportObservedOutcome {
  cohortMetric: string;
  baseline: string;
  pilot: string;
  delta: string;
  /** 0..1 owner / measurement confidence. */
  confidence: number;
  notes?: string;
}

export type PilotResultEdgeCaseImpact = 'low' | 'medium' | 'high';

export interface PilotResultReportEdgeCase {
  description: string;
  impact: PilotResultEdgeCaseImpact;
  mitigation: string;
}

export interface PilotResultReportScaleValidation {
  /** What was tested for scale (e.g. '10K → simulated 100K extrapolation'). */
  scaleTested: string;
  /** Free-text findings prose. */
  findings: string;
  /** Blockers that would prevent scale; rendered with a red flag when non-empty. */
  blockers: string[];
}

export type PilotResultCohortSentiment = 'positive' | 'mixed' | 'negative';

export interface PilotResultReportChangeReadiness {
  cohortSentiment: PilotResultCohortSentiment;
  adoptionMetric: string;
  trainingGapsIdentified: string[];
  incentiveModelChanges: string[];
}

export type PilotResultP5Recommendation = 'go' | 'no-go' | 'extend-pilot';

/** Pilot Result Report payload narrowed for this slice. */
export interface PilotResultReportPayload {
  programSummary: PilotResultReportProgramSummary;
  pilotCohort: PilotResultReportCohort;
  successCriteria: ReadonlyArray<PilotResultReportSuccessCriterion>;
  observedOutcomes: ReadonlyArray<PilotResultReportObservedOutcome>;
  edgeCases: ReadonlyArray<PilotResultReportEdgeCase>;
  scaleValidation: PilotResultReportScaleValidation;
  changeReadiness: PilotResultReportChangeReadiness;
  p5Recommendation: PilotResultP5Recommendation;
  p5RecommendationRationale: string;
}

/** Spec narrowed to the pilot-result-report kind + payload. */
export type PilotResultReportSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'pilot-result-report';
  payload: PilotResultReportPayload;
};

// ── Brand fonts + signal colors ─────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

/** Green for 'met' / 'go'. Tailwind emerald-700. */
const GREEN_HEX = '047857';
/** Amber for 'partial' / 'extend-pilot' / scale-validation flags. */
const AMBER_HEX = 'B45309';
/** Red for 'unmet' / 'no-go' / blockers. Tailwind red-700. */
const RED_HEX = 'B91C1C';

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
        text: 'PILOT RESULT REPORT · P4 GATE PACKAGE',
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

function bodyParagraphRich(
  runs: ReadonlyArray<{ text: string; bold?: boolean; color?: string }>,
): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold === true,
          color: r.color,
          size: 22,
          font: SANS_BODY_FONT,
        }),
    ),
  });
}

function bulletParagraph(text: string, opts?: { color?: string }): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: opts?.color,
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

function dataCell(
  text: string,
  opts?: { bold?: boolean; color?: string },
): TableCell {
  return new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 20,
            bold: opts?.bold === true,
            color: opts?.color,
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

// ── Signal helpers ──────────────────────────────────────────────────────

/** Color-code the met status column. */
function metStatusColor(status: PilotResultMetStatus): string {
  switch (status) {
    case 'met':
      return GREEN_HEX;
    case 'partial':
      return AMBER_HEX;
    case 'unmet':
      return RED_HEX;
  }
}

/** Render the met-status cell as an UPPERCASE label for legibility. */
function metStatusLabel(status: PilotResultMetStatus): string {
  switch (status) {
    case 'met':
      return 'MET';
    case 'partial':
      return 'PARTIAL';
    case 'unmet':
      return 'UNMET';
  }
}

function impactColor(impact: PilotResultEdgeCaseImpact): string | undefined {
  switch (impact) {
    case 'high':
      return RED_HEX;
    case 'medium':
      return AMBER_HEX;
    case 'low':
      return undefined;
  }
}

function impactLabel(impact: PilotResultEdgeCaseImpact): string {
  return impact.toUpperCase();
}

function p5RecommendationColor(rec: PilotResultP5Recommendation): string {
  switch (rec) {
    case 'go':
      return GREEN_HEX;
    case 'extend-pilot':
      return AMBER_HEX;
    case 'no-go':
      return RED_HEX;
  }
}

function p5RecommendationLine(rec: PilotResultP5Recommendation): string {
  switch (rec) {
    case 'go':
      return 'GO — proceed to P5 Activate';
    case 'extend-pilot':
      return 'EXTEND PILOT — gather more evidence before P5';
    case 'no-go':
      return 'NO-GO — pilot did not clear P5 entry; do not activate';
  }
}

function cohortSentimentLabel(s: PilotResultCohortSentiment): string {
  switch (s) {
    case 'positive':
      return 'POSITIVE';
    case 'mixed':
      return 'MIXED';
    case 'negative':
      return 'NEGATIVE';
  }
}

function cohortSentimentColor(s: PilotResultCohortSentiment): string | undefined {
  switch (s) {
    case 'positive':
      return GREEN_HEX;
    case 'mixed':
      return AMBER_HEX;
    case 'negative':
      return RED_HEX;
  }
}

// ── Section builders ────────────────────────────────────────────────────

function buildTitlePage(
  spec: PilotResultReportSpec,
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
  out.push(gateBanner());
  return out;
}

function buildProgramSummarySection(
  payload: PilotResultReportPayload,
): Paragraph[] {
  const ps = payload.programSummary;
  return [
    sectionHeading('Program summary'),
    labeledLine('Program', ps.name),
    labeledLine('Phase', ps.phase),
    labeledLine('Pilot start', ps.pilotStartDate),
    labeledLine('Pilot end', ps.pilotEndDate),
  ];
}

function buildCohortSection(payload: PilotResultReportPayload): Paragraph[] {
  const c = payload.pilotCohort;
  return [
    sectionHeading('Pilot cohort'),
    labeledLine('Cohort', c.name),
    bodyParagraph(c.sizeNotes),
    bodyParagraph(
      'The cohort above is the cohort that actually ran. Silent substitution of a different ' +
        'cohort during pilot invalidates the result; if the cohort drifted from the P3 design, ' +
        'that drift is logged here as part of the cohort scope notes.',
    ),
  ];
}

function buildSuccessCriteriaSection(
  payload: PilotResultReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Criterion',
    'Target',
    'Actual',
    'Status',
    'Measurement method',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.successCriteria.map(
    (c) =>
      new TableRow({
        children: [
          dataCell(c.criterion, { bold: true }),
          dataCell(c.targetValue),
          dataCell(c.actualValue, { bold: true }),
          dataCell(metStatusLabel(c.metStatus), {
            bold: true,
            color: metStatusColor(c.metStatus),
          }),
          dataCell(c.measurementMethod),
        ],
      }),
  );
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Success criteria'),
    bodyParagraph(
      'Criteria below were locked in P3 Design. The pilot is judged criterion-by-criterion against ' +
        'those targets — not on aggregated narrative. A criterion that moved during pilot is itself a ' +
        'finding and is flagged in the measurement method column.',
    ),
    table,
  ];
}

function buildObservedOutcomesSection(
  payload: PilotResultReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Cohort metric',
    'Baseline',
    'Pilot',
    'Delta',
    'Confidence',
    'Notes',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.observedOutcomes.map((o) => {
    const confidence = `${Math.round(o.confidence * 100)}%`;
    return new TableRow({
      children: [
        dataCell(o.cohortMetric, { bold: true }),
        dataCell(o.baseline),
        dataCell(o.pilot, { bold: true }),
        dataCell(o.delta),
        dataCell(confidence),
        dataCell(o.notes ?? '—'),
      ],
    });
  });
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Observed outcomes'),
    bodyParagraph(
      'Cohort-level context broader than the locked criteria. Useful for sponsor reading; not a ' +
        'substitute for criterion pass/fail. Where a metric is movement-only (no baseline available), ' +
        'the row carries the caveat in its notes column.',
    ),
    table,
  ];
}

function buildEdgeCasesSection(
  payload: PilotResultReportPayload,
): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [
    sectionHeading('Edge cases observed'),
    bodyParagraph(
      'Edge cases that surfaced during the pilot run. Naming them now contains the over-generalisation ' +
        'risk in P5; pretending the pilot was edge-case-free is a P4 anti-pattern flagged by Nexus.',
    ),
  ];
  if (payload.edgeCases.length === 0) {
    out.push(
      bodyParagraph(
        'No edge cases were surfaced during the pilot run. This is itself a flag — re-confirm the pilot ' +
          'exercised the cohort completely before treating an empty edge-case list as evidence of robustness.',
      ),
    );
    return out;
  }
  const headers: ReadonlyArray<string> = ['Description', 'Impact', 'Mitigation'];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.edgeCases.map(
    (e) =>
      new TableRow({
        children: [
          dataCell(e.description),
          dataCell(impactLabel(e.impact), {
            bold: true,
            color: impactColor(e.impact),
          }),
          dataCell(e.mitigation),
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

function buildScaleValidationSection(
  payload: PilotResultReportPayload,
): Paragraph[] {
  const sv = payload.scaleValidation;
  const out: Paragraph[] = [
    sectionHeading('Scale validation'),
    labeledLine('Scale tested', sv.scaleTested),
    bodyParagraph(sv.findings),
  ];
  if (sv.blockers.length > 0) {
    out.push(
      bodyParagraphRich([
        {
          text: 'Blockers to scale (red flag):',
          bold: true,
          color: RED_HEX,
        },
      ]),
    );
    for (const b of sv.blockers) {
      out.push(bulletParagraph(b, { color: RED_HEX }));
    }
    out.push(
      bodyParagraph(
        'Each blocker above is a P5 entry condition. A go recommendation that does not name how each ' +
          'blocker is closed before activation is a momentum decision, not an evidence decision.',
      ),
    );
  } else {
    out.push(
      bodyParagraph(
        'No scale blockers identified at pilot end. This is the rare and unusual case; absence of ' +
          'blockers should itself be re-tested by the operating model owner before P5 launch.',
      ),
    );
  }
  return out;
}

function buildChangeReadinessSection(
  payload: PilotResultReportPayload,
): Paragraph[] {
  const cr = payload.changeReadiness;
  const out: Paragraph[] = [
    sectionHeading('Change-management readiness'),
    bodyParagraphRich([
      { text: 'Cohort sentiment: ', bold: true },
      {
        text: cohortSentimentLabel(cr.cohortSentiment),
        bold: true,
        color: cohortSentimentColor(cr.cohortSentiment),
      },
    ]),
    labeledLine('Adoption metric', cr.adoptionMetric),
  ];
  if (cr.trainingGapsIdentified.length > 0) {
    out.push(subsectionHeading('Training gaps identified'));
    for (const g of cr.trainingGapsIdentified) {
      out.push(bulletParagraph(g));
    }
  } else {
    out.push(subsectionHeading('Training gaps identified'));
    out.push(
      bodyParagraph(
        'No training gaps surfaced during the pilot run. Re-confirm with cohort operators that the ' +
          'pilot was operated by intended-state staff, not by the build team or vendors.',
      ),
    );
  }
  if (cr.incentiveModelChanges.length > 0) {
    out.push(subsectionHeading('Incentive model changes required'));
    for (const c of cr.incentiveModelChanges) {
      out.push(bulletParagraph(c));
    }
  } else {
    out.push(subsectionHeading('Incentive model changes required'));
    out.push(
      bodyParagraph(
        'No incentive model changes flagged at pilot end. The P5 owner should confirm that adoption ' +
          'targets are achievable without changing how the cohort is measured or compensated.',
      ),
    );
  }
  out.push(
    bodyParagraph(
      'Change readiness is the most common P5 failure mode. A capable pilot operated by capable people ' +
        'still misses the gate when training, incentives, and operating ownership are not in place at activation.',
    ),
  );
  return out;
}

function buildP5RecommendationSection(
  payload: PilotResultReportPayload,
): Paragraph[] {
  const rec = payload.p5Recommendation;
  return [
    sectionHeading('P5 go/no-go recommendation'),
    bodyParagraphRich([
      { text: 'Pilot recommendation: ', bold: true },
      {
        text: p5RecommendationLine(rec),
        bold: true,
        color: p5RecommendationColor(rec),
      },
    ]),
    subsectionHeading('Rationale'),
    bodyParagraph(payload.p5RecommendationRationale),
    bodyParagraph(
      '"Continue analysis" is not a recommendation. The decision above is binding for sponsor review at ' +
        'the P4 → P5 gate; any subsequent change requires a logged sponsor decision in the program record.',
    ),
  ];
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a pilot-result-report spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildPilotResultReportDocument(
  spec: PilotResultReportSpec,
): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildProgramSummarySection(spec.payload),
    ...buildCohortSection(spec.payload),
    ...buildSuccessCriteriaSection(spec.payload),
    ...buildObservedOutcomesSection(spec.payload),
    ...buildEdgeCasesSection(spec.payload),
    ...buildScaleValidationSection(spec.payload),
    ...buildChangeReadinessSection(spec.payload),
    ...buildP5RecommendationSection(spec.payload),
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
