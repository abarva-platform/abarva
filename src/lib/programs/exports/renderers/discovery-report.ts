// EXPORT-3-EXTEND · Discovery Report document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Discovery Report is the narrative output of P1 Discovery. It
// closes the gate between P1 and P2 by proving the P0 seed against
// current-state evidence:
//
//   • a validated problem statement with severity and boundary
//   • OKR baselines with source / grain / method / owner
//   • a stakeholder map with named decision rights and dissenters
//   • root causes synthesized from evidence
//   • pattern-specific evidence collected
//   • contradictions logged (the absence of any is suspicious)
//   • an explicit recommendation: proceed / pivot / kill
//
// A Discovery Report that renders cleanly through this builder is one
// where Discovery actually adjudicated evidence — not one where
// Discovery turned into confirmation work.
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy)
// + src/lib/programs/phase-packs/P1_discovery.ts (DoD + anti-patterns).

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

/** Validated problem statement: cohort + severity + boundary. */
export interface DiscoveryReportProblemStatement {
  /** Quantified severity observed in the field. */
  observedSeverity: string;
  /** Cohort or use case affected. */
  affectedCohort: string;
  /** Explicit out-of-scope statement; what Discovery is *not* claiming. */
  scopeBoundary: string;
}

/** One baseline KPI captured during P1. */
export interface DiscoveryReportBaselineEntry {
  metric: string;
  current: string;
  target: string;
  sourceSystem: string;
  method: string;
  owner: string;
  /** Optional 0..1 owner attestation confidence. */
  confidence?: number;
}

/** One stakeholder on the named map (sponsor, owner, dissenter, blocker). */
export interface DiscoveryReportStakeholder {
  role: string;
  name: string;
  orgUnit: string;
  decisionRights: string[];
  /** Marks rows that should render with a dissenter callout. */
  isDissenter?: boolean;
}

/** One root cause synthesized from evidence. */
export interface DiscoveryReportRootCause {
  cause: string;
  evidence: string;
}

/** Pattern-specific evidence collected for the program archetype. */
export interface DiscoveryReportPatternEvidence {
  /** The lifecycle archetype (e.g. 'cdp-fragmentation'). */
  archetype: string;
  /** What was actually collected against the archetype's evidence family. */
  evidenceCollected: string[];
}

/** A contradiction surfaced by Discovery. Optional but warned-on when absent. */
export interface DiscoveryReportContradiction {
  description: string;
}

/** Discovery Report payload narrowed for this slice. */
export interface DiscoveryReportPayload {
  problemStatement: DiscoveryReportProblemStatement;
  baseline: ReadonlyArray<DiscoveryReportBaselineEntry>;
  stakeholderMap: ReadonlyArray<DiscoveryReportStakeholder>;
  rootCauses: ReadonlyArray<DiscoveryReportRootCause>;
  patternEvidence: DiscoveryReportPatternEvidence;
  contradictions?: ReadonlyArray<DiscoveryReportContradiction>;
  p2Recommendation: 'proceed' | 'pivot' | 'kill';
  p2RecommendationRationale: string;
}

/** Spec narrowed to the discovery-report kind + payload. */
export type DiscoveryReportSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'discovery-report';
  payload: DiscoveryReportPayload;
};

// ── Brand fonts ─────────────────────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

// Amber tone reserved for the contradictions callout.
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
        text: 'DISCOVERY REPORT · P1 GATE PACKAGE',
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

function dataCell(text: string, opts?: { bold?: boolean; color?: string }): TableCell {
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

// ── Section builders ────────────────────────────────────────────────────

function buildTitlePage(spec: DiscoveryReportSpec, generatedAt: Date): Paragraph[] {
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

function buildProblemStatementSection(payload: DiscoveryReportPayload): Paragraph[] {
  const ps = payload.problemStatement;
  return [
    sectionHeading('Problem statement'),
    bodyParagraph(
      `Discovery validates the following problem against current-state evidence. ${ps.affectedCohort} ` +
        `experiences the following severity: ${ps.observedSeverity}. The boundary of this Discovery ` +
        `is explicit — ${ps.scopeBoundary} is out of scope and will not be relitigated by P2 unless ` +
        'sponsor signs a re-scope.',
    ),
    labeledLine('Affected cohort or use case', ps.affectedCohort),
    labeledLine('Observed severity', ps.observedSeverity),
    labeledLine('Scope boundary (out of scope)', ps.scopeBoundary),
  ];
}

function buildBaselineSection(
  payload: DiscoveryReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Metric',
    'Current',
    'Target',
    'Source',
    'Method',
    'Owner',
    'Confidence',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.baseline.map((b) => {
    const confidence =
      b.confidence !== undefined
        ? `${Math.round(b.confidence * 100)}%`
        : '—';
    return new TableRow({
      children: [
        dataCell(b.metric),
        dataCell(b.current),
        dataCell(b.target),
        dataCell(b.sourceSystem),
        dataCell(b.method),
        dataCell(b.owner),
        dataCell(confidence),
      ],
    });
  });
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('OKR baseline'),
    bodyParagraph(
      'Each baseline below is decision-grade: source system named, measurement method documented, ' +
        'and an accountable owner who has confirmed the number is fit for P2 chartering. ' +
        'Aggregate-only baselines without grain are not decision-grade and are flagged for re-baseline.',
    ),
    table,
  ];
}

function buildStakeholderMapSection(
  payload: DiscoveryReportPayload,
): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Role',
    'Name',
    'Org unit',
    'Decision rights',
    'Dissenter',
  ];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => headerCell(h)),
  });
  const dataRows = payload.stakeholderMap.map((s) => {
    const rights = s.decisionRights.length > 0 ? s.decisionRights.join('; ') : '—';
    const dissenter = s.isDissenter === true ? 'YES' : '—';
    const dissenterColor = s.isDissenter === true ? AMBER_HEX : undefined;
    return new TableRow({
      children: [
        dataCell(s.role),
        dataCell(s.name, { bold: s.isDissenter === true }),
        dataCell(s.orgUnit),
        dataCell(rights),
        dataCell(dissenter, { bold: s.isDissenter === true, color: dissenterColor }),
      ],
    });
  });
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
  return [
    sectionHeading('Stakeholder map'),
    bodyParagraph(
      'Named owners — not departments. P2 will use this map for sign-off, blocker resolution, ' +
        'and politics. A "Department RACI" without named humans is rejected as a stakeholder map.',
    ),
    table,
  ];
}

function buildRootCausesSection(payload: DiscoveryReportPayload): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Root causes'),
    bodyParagraph(
      'Synthesized from interviews, system extracts, and audits. Each cause is paired with the ' +
        'specific evidence that supports it; vibes-only attributions are excluded.',
    ),
  ];
  for (const rc of payload.rootCauses) {
    out.push(
      bodyParagraphRich([
        { text: rc.cause, bold: true },
      ]),
    );
    out.push(bulletParagraph(`Evidence: ${rc.evidence}`));
  }
  return out;
}

function buildPatternEvidenceSection(payload: DiscoveryReportPayload): Paragraph[] {
  const pe = payload.patternEvidence;
  const out: Paragraph[] = [
    sectionHeading('Pattern-specific evidence'),
    labeledLine('Archetype', pe.archetype),
    bodyParagraph(
      'Generic stakeholder interviews are not enough. The archetype determines the evidence ' +
        'family P1 must collect; what follows is what was actually obtained against that family.',
    ),
  ];
  if (pe.evidenceCollected.length > 0) {
    out.push(subsectionHeading('Evidence collected'));
    for (const item of pe.evidenceCollected) {
      out.push(bulletParagraph(item));
    }
  } else {
    out.push(bodyParagraph('No archetype-specific evidence collected. Flag as a P1 gap.'));
  }
  return out;
}

function buildContradictionsSection(
  contradictions: ReadonlyArray<DiscoveryReportContradiction>,
): Paragraph[] {
  const out: Paragraph[] = [
    sectionHeading('Contradictions'),
    bodyParagraphRich([
      {
        text:
          'Healthy Discovery changes the seed. Contradictions below are useful signal, not bad ' +
          'news — they mark where evidence forced P0 assumptions to be revised.',
        color: AMBER_HEX,
      },
    ]),
  ];
  for (const c of contradictions) {
    out.push(bulletParagraph(c.description));
  }
  return out;
}

function buildP2RecommendationSection(payload: DiscoveryReportPayload): Paragraph[] {
  const verb = payload.p2Recommendation;
  const decisionLine =
    verb === 'proceed'
      ? 'PROCEED to P2 Synthesis'
      : verb === 'pivot'
        ? 'PIVOT — re-scope cohort, classification, or evidence before P2'
        : 'KILL — Discovery rejects the P0 seed; do not enter Synthesis';
  return [
    sectionHeading('P2 readiness recommendation'),
    bodyParagraphRich([
      { text: 'Discovery recommendation: ', bold: true },
      { text: decisionLine, bold: true },
    ]),
    subsectionHeading('Rationale'),
    bodyParagraph(payload.p2RecommendationRationale),
    bodyParagraph(
      '"Continue analysis" is not a recommendation. The decision above is binding for sponsor ' +
        'review at the P1 → P2 gate; any subsequent change requires a logged sponsor decision.',
    ),
  ];
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a discovery-report spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildDiscoveryReportDocument(spec: DiscoveryReportSpec): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildProblemStatementSection(spec.payload),
    ...buildBaselineSection(spec.payload),
    ...buildStakeholderMapSection(spec.payload),
    ...buildRootCausesSection(spec.payload),
    ...buildPatternEvidenceSection(spec.payload),
  ];

  if (
    spec.payload.contradictions !== undefined &&
    spec.payload.contradictions.length > 0
  ) {
    children.push(...buildContradictionsSection(spec.payload.contradictions));
  }

  children.push(...buildP2RecommendationSection(spec.payload));

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
