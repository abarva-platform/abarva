// EXPORT-3 · Program Charter document builder.
//
// Pure (spec) -> docx.Document builder. The DOCX renderer dispatcher
// (./docx.ts) calls this and serializes the document to a buffer; this
// module performs no I/O and no auth.
//
// The Program Charter is the sponsor's binding commitment at the P2
// gate. It mirrors the P2 phase pack outcome statement (see
// src/lib/programs/phase-packs/P2_synthesis.ts):
//
//   "A signed gate package combining (a) a synthesis recommendation that
//    names at least two viable target-state options, makes the trade-offs
//    explicit, and recommends a path with an architecture sketch the
//    architecture function has reviewed; AND (b) a charter the sponsor
//    has personally signed — naming baseline KPIs, the value hypothesis
//    with causal mechanism, the scope boundary, a named dissenter, a
//    kill criterion, and a succession owner."
//
// The eight document sections enforce that discipline; a charter that
// renders cleanly through this builder is a charter where the structure
// alone forced the sponsor to confront the decisions a P2 gate demands.
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy)
// + §6 (slice plan EXPORT-3).

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

/** The program's value hypothesis: cohort × behavior × mechanism × direction. */
export interface ProgramCharterValueHypothesis {
  /** The cohort whose behavior the program changes. */
  cohort: string;
  /** Today's pain that motivates the program. */
  currentPain: string;
  /** The specific behavior change the program drives. */
  behaviorChange: string;
  /** Direction of value movement (e.g. 'increase' / 'decrease' / 'maintain'). */
  valueDirection: string;
  /** Causal mechanism — *how* the value materializes. */
  causalMechanism: string;
  /** Optional explicit "in scope" bullet list. */
  inScope?: ReadonlyArray<string>;
  /** Optional explicit "out of scope" bullet list. */
  outOfScope?: ReadonlyArray<string>;
}

/** Sponsor: the named exec who carries air cover for the program. */
export interface ProgramCharterSponsor {
  name: string;
  role: string;
  decisionRights: ReadonlyArray<string>;
  successionOwner?: string;
  /** Free-text recurring cadence committed (e.g. 'weekly 30-min steer'). */
  cadence?: string;
}

/** One option considered and not chosen. */
export interface ProgramCharterOptionConsidered {
  name: string;
  whyNotChosen: string;
}

/** Recommended path with the explicit trade-offs. */
export interface ProgramCharterRecommendedPath {
  name: string;
  rationale: string;
  tradeoffsAccepted: ReadonlyArray<string>;
  optionsConsidered: ReadonlyArray<ProgramCharterOptionConsidered>;
}

/** Architecture review attestation summary. */
export interface ProgramCharterArchitectureReviewAttestation {
  /** ISO timestamp of the attestation. */
  attestedAt: string;
  /** Names of the architects who attested. */
  attestedBy: ReadonlyArray<string>;
  /** Substantive findings produced by the review. */
  findings: ReadonlyArray<string>;
  /** Open items remaining at attestation time. */
  openItems: ReadonlyArray<string>;
}

/** Kill criterion — specific, observable, time-boxed. */
export interface ProgramCharterKillCriterion {
  /** The measurable event that triggers the kill criterion. */
  measurableEvent: string;
  /** Who is responsible for measuring the event. */
  observableBy: string;
  /** ISO date or condition under which the criterion fires. */
  triggersWhen: string;
  /** The consequence when the criterion fires. */
  consequence: string;
}

/** Named dissenter — required per P2 doctrine (no-dissenter is an anti-pattern). */
export interface ProgramCharterNamedDissenter {
  name: string;
  role: string;
  /** Verbatim objection. The renderer treats this as literal text. */
  objection: string;
  mitigationOrAcceptance: string;
}

/** One baseline KPI carried forward from P1 Discovery. */
export interface ProgramCharterBaselineKpi {
  metric: string;
  currentValue: string;
  targetValue: string;
  sourceSystem: string;
  measurementMethod: string;
}

/** Sponsor sign-off. */
export interface ProgramCharterSignoff {
  sponsorName: string;
  /** Signature line placeholder, e.g. '_______________________ (signature)'. */
  sponsorSignatureLine: string;
  /** ISO timestamp of sign-off, when available. */
  signedAt?: string;
  /** Free-text notes captured at sign-off. */
  notes?: string;
}

/** Program Charter payload narrowed for this slice. */
export interface ProgramCharterPayload {
  valueHypothesis: ProgramCharterValueHypothesis;
  sponsor: ProgramCharterSponsor;
  recommendedPath: ProgramCharterRecommendedPath;
  architectureReviewAttestation: ProgramCharterArchitectureReviewAttestation;
  killCriterion: ProgramCharterKillCriterion;
  namedDissenter?: ProgramCharterNamedDissenter;
  baselineKpis: ReadonlyArray<ProgramCharterBaselineKpi>;
  signoff: ProgramCharterSignoff;
}

/** Spec narrowed to the program-charter kind + payload. */
export type ProgramCharterSpec = Omit<DeliverableSpec, 'kind' | 'payload'> & {
  kind: 'program-charter';
  payload: ProgramCharterPayload;
};

// ── Brand fonts ─────────────────────────────────────────────────────────

const SERIF_HEADING_FONT = 'Georgia';
const SANS_BODY_FONT = 'Calibri';

// ── Paragraph helpers ───────────────────────────────────────────────────

/** Title-page H1 in the serif heading font. */
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

/** Italic subtitle under the title. */
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

/** Tenant key in mono — small, muted. */
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

/** Generation timestamp — small, italic, muted. */
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

/** Banner that this is a signed charter. */
function signedCharterBanner(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text: 'SIGNED PROGRAM CHARTER · P2 GATE PACKAGE',
        bold: true,
        size: 22,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

/** H2 section heading in the serif font. */
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

/** H3 sub-heading in the serif font. */
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

/** Body prose paragraph. */
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

/** Body paragraph with mixed bold + plain runs. */
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

/** Bulleted list paragraph. */
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

/** Label / value line, bolded label inline with plain value. */
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

// ── Section builders ────────────────────────────────────────────────────

/** Section 1 · Title page. */
function buildTitlePage(spec: ProgramCharterSpec, generatedAt: Date): Paragraph[] {
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
    out.push(
      timestampParagraph(`Authors: ${spec.authors.join(', ')}`),
    );
  }
  out.push(signedCharterBanner());
  return out;
}

/** Section 2 · Value hypothesis. */
function buildValueHypothesisSection(payload: ProgramCharterPayload): Paragraph[] {
  const vh = payload.valueHypothesis;
  const prose =
    `For ${vh.cohort} experiencing ${vh.currentPain}, this program will ` +
    `change ${vh.behaviorChange}, expecting to ${vh.valueDirection} value ` +
    `through ${vh.causalMechanism}.`;

  const out: Paragraph[] = [
    sectionHeading('Value hypothesis'),
    bodyParagraph(prose),
  ];

  if (vh.inScope !== undefined && vh.inScope.length > 0) {
    out.push(subsectionHeading('In scope'));
    for (const item of vh.inScope) {
      out.push(bulletParagraph(item));
    }
  }
  if (vh.outOfScope !== undefined && vh.outOfScope.length > 0) {
    out.push(subsectionHeading('Out of scope'));
    for (const item of vh.outOfScope) {
      out.push(bulletParagraph(item));
    }
  }
  return out;
}

/** Section 3 · Sponsor commitment. */
function buildSponsorSection(payload: ProgramCharterPayload): Paragraph[] {
  const s = payload.sponsor;
  const out: Paragraph[] = [
    sectionHeading('Sponsor commitment'),
    labeledLine('Sponsor', `${s.name} (${s.role})`),
  ];
  if (s.decisionRights.length > 0) {
    out.push(subsectionHeading('Decision rights'));
    for (const right of s.decisionRights) {
      out.push(bulletParagraph(right));
    }
  }
  if (s.successionOwner !== undefined) {
    out.push(labeledLine('Succession owner', s.successionOwner));
  }
  if (s.cadence !== undefined) {
    out.push(
      bodyParagraph(
        `${s.name} commits to a recurring sponsor cadence: ${s.cadence}. ` +
          'This cadence is binding for the life of the program; phantom ' +
          'sponsorship is the #1 P2 failure mode and is rejected at this gate.',
      ),
    );
  } else {
    out.push(
      bodyParagraph(
        `${s.name} commits to a recurring sponsor cadence sufficient to make ` +
          'real-time decisions on behalf of the program. Phantom sponsorship ' +
          'is the #1 P2 failure mode and is rejected at this gate.',
      ),
    );
  }
  return out;
}

/** Section 4 · Recommended path with options-not-chosen. */
function buildRecommendedPathSection(payload: ProgramCharterPayload): Paragraph[] {
  const rp = payload.recommendedPath;
  const out: Paragraph[] = [
    sectionHeading('Recommended path'),
    labeledLine('Path', rp.name),
    bodyParagraph(rp.rationale),
  ];
  if (rp.tradeoffsAccepted.length > 0) {
    out.push(subsectionHeading('Trade-offs accepted'));
    for (const t of rp.tradeoffsAccepted) {
      out.push(bulletParagraph(t));
    }
  }
  if (rp.optionsConsidered.length > 0) {
    out.push(subsectionHeading('Options considered and not chosen'));
    for (const opt of rp.optionsConsidered) {
      out.push(
        bodyParagraphRich([
          { text: `${opt.name}: `, bold: true },
          { text: opt.whyNotChosen },
        ]),
      );
    }
  }
  return out;
}

/** Section 5 · Architecture review attestation. */
function buildArchitectureAttestationSection(
  payload: ProgramCharterPayload,
): Paragraph[] {
  const a = payload.architectureReviewAttestation;
  const out: Paragraph[] = [
    sectionHeading('Architecture review attestation'),
    labeledLine('Attested at', a.attestedAt),
    labeledLine(
      'Attested by',
      a.attestedBy.length > 0 ? a.attestedBy.join(', ') : '—',
    ),
  ];
  if (a.findings.length > 0) {
    out.push(subsectionHeading('Findings'));
    for (const f of a.findings) {
      out.push(bulletParagraph(f));
    }
  }
  if (a.openItems.length > 0) {
    out.push(subsectionHeading('Open items (yellow flag)'));
    for (const item of a.openItems) {
      out.push(bulletParagraph(item));
    }
  } else {
    out.push(bodyParagraph('No open items at attestation time.'));
  }
  return out;
}

/** Section 6 · Kill criterion. */
function buildKillCriterionSection(payload: ProgramCharterPayload): Paragraph[] {
  const k = payload.killCriterion;
  return [
    sectionHeading('Kill criterion'),
    bodyParagraphRich([
      { text: 'Measurable event: ', bold: true },
      { text: k.measurableEvent, bold: true },
    ]),
    labeledLine('Observable by', k.observableBy),
    labeledLine('Triggers when', k.triggersWhen),
    labeledLine('Consequence', k.consequence),
    bodyParagraph(
      'This kill criterion is contractual. Any senior practitioner observing ' +
        'the measurable event SHALL escalate to the sponsor for a stop / ' +
        'pivot / continue decision. Drift past the trigger without escalation ' +
        'is itself a governance failure flagged in the program audit log.',
    ),
  ];
}

/** Section 7 · Named dissenter (only when present). */
function buildNamedDissenterSection(
  d: ProgramCharterNamedDissenter,
): Paragraph[] {
  return [
    sectionHeading('Named dissenter'),
    labeledLine('Name', `${d.name} (${d.role})`),
    subsectionHeading('Verbatim objection'),
    bodyParagraph(d.objection),
    subsectionHeading('Mitigation or acceptance'),
    bodyParagraph(d.mitigationOrAcceptance),
  ];
}

/** Section 8 · Baseline KPIs (table). */
function buildBaselineKpisSection(payload: ProgramCharterPayload): Array<Paragraph | Table> {
  const headers: ReadonlyArray<string> = [
    'Metric',
    'Current value',
    'Target value',
    'Source system',
    'Measurement method',
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          shading: { fill: '0A0A0A' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 20,
                  color: 'F5F5F0',
                  font: SANS_BODY_FONT,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const dataRows = payload.baselineKpis.map((kpi) => {
    const cells: ReadonlyArray<string> = [
      kpi.metric,
      kpi.currentValue,
      kpi.targetValue,
      kpi.sourceSystem,
      kpi.measurementMethod,
    ];
    return new TableRow({
      children: cells.map(
        (text) =>
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    size: 20,
                    font: SANS_BODY_FONT,
                  }),
                ],
              }),
            ],
          }),
      ),
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  return [sectionHeading('Baseline KPIs'), table];
}

/** Section 9 · Sponsor sign-off. */
function buildSignoffSection(payload: ProgramCharterPayload): Paragraph[] {
  const s = payload.signoff;
  const out: Paragraph[] = [
    sectionHeading('Sponsor sign-off'),
    labeledLine('Sponsor', s.sponsorName),
    bodyParagraph(s.sponsorSignatureLine),
  ];
  if (s.signedAt !== undefined) {
    out.push(labeledLine('Signed at', s.signedAt));
  }
  if (s.notes !== undefined && s.notes.length > 0) {
    out.push(subsectionHeading('Notes'));
    out.push(bodyParagraph(s.notes));
  }
  return out;
}

// ── Public builder ──────────────────────────────────────────────────────

/**
 * Build a populated `docx.Document` for a program-charter spec. Pure —
 * no I/O. The DOCX renderer dispatcher serializes the returned document
 * to a buffer.
 */
export function buildProgramCharterDocument(spec: ProgramCharterSpec): Document {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();

  const children: Array<Paragraph | Table> = [
    ...buildTitlePage(spec, generatedAt),
    ...buildValueHypothesisSection(spec.payload),
    ...buildSponsorSection(spec.payload),
    ...buildRecommendedPathSection(spec.payload),
    ...buildArchitectureAttestationSection(spec.payload),
    ...buildKillCriterionSection(spec.payload),
  ];

  if (spec.payload.namedDissenter !== undefined) {
    children.push(...buildNamedDissenterSection(spec.payload.namedDissenter));
  }

  children.push(...buildBaselineKpisSection(spec.payload));
  children.push(...buildSignoffSection(spec.payload));

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
