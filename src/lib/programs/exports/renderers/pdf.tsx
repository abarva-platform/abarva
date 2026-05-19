// EXPORT-5 · PDF renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. The API route
// (export/route.ts) wraps this with the audit log.
//
// Built on @react-pdf/renderer (installed hard dep, v4.5.1) — the same
// engine Source uses in src/lib/source/exports/renderers/narrative-pdf.tsx.
// The document is assembled as a React element tree and serialized to a
// buffer via `pdf().toBuffer()`.
//
// PDF is the print-/archive-/signature-ready surface. It is offered for
// the kinds where a CFO-grade printable document makes sense:
//   • program-charter  — the signed P2 gate package
//   • outcome-report   — the P5 benefits-attestation package
//   • roadmap          — the program roadmap
//
// No fabrication: the renderer only emits data present on the spec.
// Absent sections render an explicit "not recorded" empty state.

import 'server-only';

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
  type DocumentProps,
} from '@react-pdf/renderer';
import type { ReactElement, ReactNode } from 'react';

import { buildExportFilename } from '../filename';
import type { DeliverableRenderResult, DeliverableSpec } from '../types';

import type { OutcomeReportPayload } from './outcome-report';
import type { ProgramCharterPayload } from './program-charter';

/** PDF MIME. */
const PDF_CONTENT_TYPE = 'application/pdf';

// ── Style tokens ────────────────────────────────────────────────────────
//
// @react-pdf only ships built-in fonts (Helvetica / Times-Roman /
// Courier). Times approximates the AbarVa serif display face; Helvetica
// the sans body. Palette mirrors the DOCX + HTML renderers.

const COLOR = {
  INK: '#0A0A0A',
  BODY: '#1A1A18',
  MUTED: '#706D66',
  FAINT: '#9AA3B2',
  RULE: '#E2DFD8',
  HEADER_BG: '#0A0A0A',
  HEADER_FG: '#F5F5F0',
  ROW_ALT: '#FCFBF9',
} as const;

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54,
    paddingBottom: 60,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLOR.BODY,
    lineHeight: 1.5,
  },
  eyebrow: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.MUTED,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Times-Roman',
    color: COLOR.INK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    color: COLOR.MUTED,
    marginBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: COLOR.FAINT,
    marginBottom: 2,
  },
  banner: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 6,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLOR.INK,
  },
  bannerText: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    letterSpacing: 0.4,
  },
  headerRule: {
    borderBottomWidth: 1.5,
    borderColor: COLOR.INK,
    marginTop: 12,
    marginBottom: 18,
  },
  h2: {
    fontSize: 14,
    fontFamily: 'Times-Roman',
    color: COLOR.INK,
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderColor: COLOR.RULE,
  },
  h3: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.MUTED,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
  },
  empty: {
    fontSize: 10,
    fontFamily: 'Helvetica-Oblique',
    color: COLOR.FAINT,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  listMarker: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  quote: {
    borderLeftWidth: 2,
    borderColor: COLOR.INK,
    paddingLeft: 10,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Oblique',
    color: COLOR.MUTED,
  },
  table: {
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLOR.RULE,
  },
  tHeadRow: {
    flexDirection: 'row',
    backgroundColor: COLOR.HEADER_BG,
  },
  tRow: {
    flexDirection: 'row',
  },
  tRowAlt: {
    flexDirection: 'row',
    backgroundColor: COLOR.ROW_ALT,
  },
  tHeadCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.HEADER_FG,
    padding: 4,
  },
  tCell: {
    fontSize: 8,
    color: COLOR.BODY,
    padding: 4,
    borderRightWidth: 0.5,
    borderColor: COLOR.RULE,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 54,
    right: 54,
    fontSize: 7,
    color: COLOR.FAINT,
    borderTopWidth: 0.5,
    borderColor: COLOR.RULE,
    paddingTop: 4,
  },
});

// ── Primitive builders ──────────────────────────────────────────────────

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function txt(value: unknown): string {
  return String(value ?? '').trim();
}

let nodeKey = 0;
function key(): string {
  nodeKey += 1;
  return `n${nodeKey}`;
}

/** Section heading. */
function H2(text: string): ReactNode {
  return (
    <Text key={key()} style={styles.h2}>
      {text}
    </Text>
  );
}

function H3(text: string): ReactNode {
  return (
    <Text key={key()} style={styles.h3}>
      {text}
    </Text>
  );
}

/** Body paragraph. */
function P(text: string): ReactNode {
  return (
    <Text key={key()} style={styles.body}>
      {text}
    </Text>
  );
}

/** Italic empty-state line. */
function Empty(text: string): ReactNode {
  return (
    <Text key={key()} style={styles.empty}>
      {text}
    </Text>
  );
}

/** Labeled inline value, or an empty-state when blank. */
function Labeled(label: string, value: unknown): ReactNode {
  const v = txt(value);
  return (
    <Text key={key()} style={styles.body}>
      <Text style={styles.label}>{label}: </Text>
      {v.length > 0 ? v : '(not recorded)'}
    </Text>
  );
}

/** Bulleted list of strings, or an empty-state when none. */
function BulletList(
  items: ReadonlyArray<unknown> | undefined,
  emptyLabel: string,
): ReactNode {
  const clean = (items ?? [])
    .map((i) => txt(i))
    .filter((s) => s.length > 0);
  if (clean.length === 0) {
    return Empty(emptyLabel);
  }
  return (
    <View key={key()}>
      {clean.map((item) => (
        <View key={key()} style={styles.listItem}>
          <Text style={styles.listMarker}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Blockquote. */
function Quote(text: string): ReactNode {
  return (
    <View key={key()} style={styles.quote}>
      <Text style={styles.quoteText}>{text}</Text>
    </View>
  );
}

/**
 * Table from a row set + column spec. Column widths are even percentages.
 * Emits an empty-state when there are no rows.
 */
function Table(
  rows: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<{ key: string; label: string }>,
  emptyLabel: string,
): ReactNode {
  if (rows.length === 0) {
    return Empty(emptyLabel);
  }
  const width = `${100 / columns.length}%`;
  return (
    <View key={key()} style={styles.table}>
      <View style={styles.tHeadRow}>
        {columns.map((c) => (
          <Text key={key()} style={[styles.tHeadCell, { width }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((row, idx) => (
        <View
          key={key()}
          style={idx % 2 === 1 ? styles.tRowAlt : styles.tRow}
        >
          {columns.map((c) => (
            <Text key={key()} style={[styles.tCell, { width }]}>
              {txt(row[c.key])}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Generic structured-payload walker (for roadmap + fallback) ──────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}

function isObjectArray(
  value: ReadonlyArray<unknown>,
): value is ReadonlyArray<Record<string, unknown>> {
  return value.length > 0 && value.every((v) => isPlainObject(v));
}

function humanizeKey(k: string): string {
  const spaced = k
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return spaced.length === 0
    ? k
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Render a generic object array as a table with a derived column set. */
function genericTable(rows: ReadonlyArray<Record<string, unknown>>): ReactNode {
  const keys: string[] = [];
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!keys.includes(k)) keys.push(k);
    }
  }
  const normalized = rows.map((row) => {
    const flat: Record<string, unknown> = {};
    for (const k of keys) {
      const cell = row[k];
      if (Array.isArray(cell)) {
        flat[k] = cell.map((c) => txt(c)).join('; ');
      } else if (isPlainObject(cell)) {
        flat[k] = JSON.stringify(cell);
      } else {
        flat[k] = cell;
      }
    }
    return flat;
  });
  return Table(
    normalized,
    keys.map((k) => ({ key: k, label: humanizeKey(k) })),
    'No rows recorded.',
  );
}

/** Recursively render a payload value at a heading depth. */
function renderGenericValue(
  label: string,
  value: unknown,
  depth: number,
): ReactNode[] {
  const out: ReactNode[] = [];
  out.push(depth <= 0 ? H2(label) : H3(label));

  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push(Empty(`No ${label.toLowerCase()} recorded.`));
    } else if (isObjectArray(value)) {
      out.push(genericTable(value));
    } else {
      out.push(BulletList(value, `No ${label.toLowerCase()} recorded.`));
    }
    return out;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      out.push(Empty('Not recorded.'));
      return out;
    }
    for (const [k, v] of entries) {
      if (Array.isArray(v) || isPlainObject(v)) {
        out.push(...renderGenericValue(humanizeKey(k), v, depth + 1));
      } else {
        out.push(Labeled(humanizeKey(k), v));
      }
    }
    return out;
  }

  out.push(P(txt(value) || '(not recorded)'));
  return out;
}

function renderGenericBody(
  payload: Record<string, unknown>,
  kind: string,
): ReactNode[] {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return [
      Empty(
        `No ${kind.replace(/-/g, ' ')} content was recorded on this deliverable.`,
      ),
    ];
  }
  const out: ReactNode[] = [];
  for (const [k, v] of entries) {
    if (Array.isArray(v) || isPlainObject(v)) {
      out.push(...renderGenericValue(humanizeKey(k), v, 0));
    } else {
      out.push(H2(humanizeKey(k)));
      out.push(P(txt(v) || '(not recorded)'));
    }
  }
  return out;
}

// ── program-charter body ────────────────────────────────────────────────

function renderProgramCharterBody(payload: ProgramCharterPayload): ReactNode[] {
  const out: ReactNode[] = [];

  const vh = payload.valueHypothesis;
  out.push(H2('Value hypothesis'));
  if (hasText(vh?.cohort) || hasText(vh?.currentPain)) {
    out.push(
      P(
        `For ${txt(vh.cohort)} experiencing ${txt(vh.currentPain)}, this ` +
          `program will change ${txt(vh.behaviorChange)}, expecting to ` +
          `${txt(vh.valueDirection)} value through ${txt(
            vh.causalMechanism,
          )}.`,
      ),
    );
  } else {
    out.push(Empty('Value hypothesis not recorded.'));
  }
  out.push(H3('In scope'));
  out.push(BulletList(vh?.inScope, 'No in-scope items recorded.'));
  out.push(H3('Out of scope'));
  out.push(BulletList(vh?.outOfScope, 'No out-of-scope items recorded.'));

  const s = payload.sponsor;
  out.push(H2('Sponsor commitment'));
  out.push(
    Labeled(
      'Sponsor',
      hasText(s?.name) ? `${s.name} (${s.role ?? ''})`.trim() : '',
    ),
  );
  out.push(H3('Decision rights'));
  out.push(BulletList(s?.decisionRights, 'No decision rights recorded.'));
  if (hasText(s?.successionOwner)) {
    out.push(Labeled('Succession owner', s.successionOwner));
  }
  if (hasText(s?.cadence)) {
    out.push(Labeled('Sponsor cadence', s.cadence));
  }

  const rp = payload.recommendedPath;
  out.push(H2('Recommended path'));
  out.push(Labeled('Path', rp?.name));
  if (hasText(rp?.rationale)) {
    out.push(P(rp.rationale));
  }
  out.push(H3('Trade-offs accepted'));
  out.push(BulletList(rp?.tradeoffsAccepted, 'No trade-offs recorded.'));
  out.push(H3('Options considered and not chosen'));
  const options = Array.isArray(rp?.optionsConsidered)
    ? rp.optionsConsidered
    : [];
  if (options.length === 0) {
    out.push(Empty('No alternative options recorded.'));
  } else {
    for (const o of options) {
      out.push(Labeled(txt(o.name), o.whyNotChosen));
    }
  }

  const a = payload.architectureReviewAttestation;
  out.push(H2('Architecture review attestation'));
  out.push(Labeled('Attested at', a?.attestedAt));
  out.push(
    Labeled(
      'Attested by',
      Array.isArray(a?.attestedBy) ? a.attestedBy.join(', ') : '',
    ),
  );
  out.push(H3('Findings'));
  out.push(BulletList(a?.findings, 'No findings recorded.'));
  out.push(H3('Open items'));
  out.push(BulletList(a?.openItems, 'No open items at attestation time.'));

  const k = payload.killCriterion;
  out.push(H2('Kill criterion'));
  out.push(Labeled('Measurable event', k?.measurableEvent));
  out.push(Labeled('Observable by', k?.observableBy));
  out.push(Labeled('Triggers when', k?.triggersWhen));
  out.push(Labeled('Consequence', k?.consequence));

  const d = payload.namedDissenter;
  if (d !== undefined && hasText(d.name)) {
    out.push(H2('Named dissenter'));
    out.push(Labeled('Name', `${d.name} (${d.role ?? ''})`.trim()));
    out.push(H3('Verbatim objection'));
    out.push(
      hasText(d.objection)
        ? Quote(d.objection)
        : Empty('No objection text recorded.'),
    );
    out.push(H3('Mitigation or acceptance'));
    out.push(
      hasText(d.mitigationOrAcceptance)
        ? P(d.mitigationOrAcceptance)
        : Empty('Not recorded.'),
    );
  }

  out.push(H2('Baseline KPIs'));
  const kpis = Array.isArray(payload.baselineKpis) ? payload.baselineKpis : [];
  out.push(
    Table(
      kpis as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'metric', label: 'Metric' },
        { key: 'currentValue', label: 'Current' },
        { key: 'targetValue', label: 'Target' },
        { key: 'sourceSystem', label: 'Source system' },
        { key: 'measurementMethod', label: 'Measurement method' },
      ],
      'No baseline KPIs recorded.',
    ),
  );

  const so = payload.signoff;
  out.push(H2('Sponsor sign-off'));
  out.push(Labeled('Sponsor', so?.sponsorName));
  if (hasText(so?.sponsorSignatureLine)) {
    out.push(P(so.sponsorSignatureLine));
  }
  if (hasText(so?.signedAt)) {
    out.push(Labeled('Signed at', so.signedAt));
  }
  if (hasText(so?.notes)) {
    out.push(H3('Notes'));
    out.push(P(so.notes));
  }

  return out;
}

// ── outcome-report body ─────────────────────────────────────────────────

function renderOutcomeReportBody(payload: OutcomeReportPayload): ReactNode[] {
  const out: ReactNode[] = [];

  const ps = payload.programSummary;
  out.push(H2('Program summary'));
  out.push(Labeled('Program', ps?.name));
  out.push(Labeled('Sponsor', ps?.sponsor));
  out.push(Labeled('Program lead', ps?.programLead));
  out.push(Labeled('Charter date', ps?.charterDate));
  out.push(Labeled('Outcome attestation date', ps?.outcomeDate));

  out.push(H2('Outcomes vs. baseline'));
  const outcomes = Array.isArray(payload.outcomesVsBaseline)
    ? payload.outcomesVsBaseline
    : [];
  out.push(
    Table(
      outcomes.map((row) => ({
        ...row,
        confidence:
          typeof row.confidence === 'number'
            ? `${Math.round(row.confidence * 100)}%`
            : '',
      })) as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'metric', label: 'Metric' },
        { key: 'baselineValue', label: 'Baseline' },
        { key: 'targetValue', label: 'Target' },
        { key: 'actualValue', label: 'Actual' },
        { key: 'deltaVsTarget', label: 'Delta' },
        { key: 'confidence', label: 'Confidence' },
      ],
      'No outcome rows recorded.',
    ),
  );

  out.push(H2('Adoption evidence'));
  const adoption = Array.isArray(payload.adoptionEvidence)
    ? payload.adoptionEvidence
    : [];
  out.push(
    Table(
      adoption as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'cohort', label: 'Cohort' },
        { key: 'metric', label: 'Adoption metric' },
        { key: 'result', label: 'Result' },
      ],
      'No adoption evidence recorded.',
    ),
  );

  const ba = payload.benefitsAttestation;
  out.push(H2('Benefits attestation'));
  out.push(Labeled('Attested by', ba?.attestedBy));
  out.push(Labeled('Attested at', ba?.attestedAt));
  if (hasText(ba?.attestationStatement)) {
    out.push(Quote(ba.attestationStatement));
  } else {
    out.push(Empty('No attestation statement recorded.'));
  }

  out.push(H2('Challenges and mitigations'));
  const challenges = Array.isArray(payload.challengesAndMitigations)
    ? payload.challengesAndMitigations
    : [];
  if (challenges.length === 0) {
    out.push(Empty('No challenges recorded.'));
  } else {
    for (const cm of challenges) {
      out.push(Labeled('Challenge', cm.challenge));
      out.push(BulletList([`Mitigation: ${txt(cm.mitigation)}`], ''));
    }
  }

  out.push(H2('Learnings for pattern catalog'));
  const learnings = Array.isArray(payload.learningsForCatalog)
    ? payload.learningsForCatalog
    : [];
  if (learnings.length === 0) {
    out.push(Empty('No learnings recorded.'));
  } else {
    const sorted = [
      ...learnings.filter((l) => l.applicability === 'cross-archetype'),
      ...learnings.filter((l) => l.applicability !== 'cross-archetype'),
    ];
    out.push(
      BulletList(
        sorted.map((l) => `[${txt(l.applicability)}] ${txt(l.learning)}`),
        'No learnings recorded.',
      ),
    );
  }

  const hp = payload.p6HandoffPlan;
  out.push(H2('P6 handoff plan'));
  out.push(Labeled('Standing owner', hp?.standingOwner));
  out.push(Labeled('Review cadence', hp?.quarterlyReviewCadence));
  out.push(H3('Kill / expand thresholds'));
  out.push(
    BulletList(hp?.killOrExpandThresholds, 'No thresholds recorded.'),
  );

  return out;
}

// ── Document assembly ───────────────────────────────────────────────────

/** Per-kind banner label. */
const BANNER: Record<string, string> = {
  'program-charter': 'SIGNED PROGRAM CHARTER · P2 GATE PACKAGE',
  'outcome-report': 'OUTCOME REPORT · P5 GATE PACKAGE',
  roadmap: 'PROGRAM ROADMAP',
};

/** Kinds the PDF dispatcher renders. */
const PDF_KINDS: ReadonlySet<string> = new Set([
  'program-charter',
  'outcome-report',
  'roadmap',
]);

/** Build the React element tree for the PDF document. */
function buildPdfDocument(
  spec: DeliverableSpec,
  body: ReactNode[],
): ReactElement<DocumentProps> {
  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();
  const brandSubtitle = spec.brandSubtitle ?? 'AbarVa · Programs';
  const banner = BANNER[spec.kind];

  return (
    <Document
      title={spec.title}
      subject={spec.subtitle}
      author={brandSubtitle}
      creator={brandSubtitle}
      producer={brandSubtitle}
    >
      <Page size="LETTER" style={styles.page}>
        <View>
          <Text style={styles.eyebrow}>{brandSubtitle}</Text>
          <Text style={styles.title}>{spec.title}</Text>
          {hasText(spec.subtitle) ? (
            <Text style={styles.subtitle}>{spec.subtitle}</Text>
          ) : null}
          <Text style={styles.meta}>Tenant: {spec.tenantKey}</Text>
          <Text style={styles.meta}>
            Generated by {brandSubtitle} at {generatedAt.toISOString()}
          </Text>
          {spec.authors !== undefined && spec.authors.length > 0 ? (
            <Text style={styles.meta}>
              Authors: {spec.authors.join(', ')}
            </Text>
          ) : null}
          {banner !== undefined ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{banner}</Text>
            </View>
          ) : null}
          <View style={styles.headerRule} />
        </View>
        {body}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${brandSubtitle}  ·  ${spec.title}  ·  page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/**
 * Render a `DeliverableSpec` as a PDF `DeliverableRenderResult`.
 *
 * Supported kinds: `program-charter`, `outcome-report`, `roadmap`.
 * All other kinds throw a clear "no renderer" error pointing callers at
 * the format router.
 */
export async function renderDeliverableAsPdf(
  spec: DeliverableSpec,
): Promise<DeliverableRenderResult> {
  if (!PDF_KINDS.has(spec.kind)) {
    throw new Error(
      `Kind "${spec.kind}" does not have a PDF renderer. Use the format ` +
        `router to pick the canonical format.`,
    );
  }
  if (!spec.payload || typeof spec.payload !== 'object') {
    throw new Error(
      `${spec.kind} payload is malformed: expected a structured object.`,
    );
  }

  let body: ReactNode[];
  switch (spec.kind) {
    case 'program-charter':
      body = renderProgramCharterBody(
        spec.payload as unknown as ProgramCharterPayload,
      );
      break;
    case 'outcome-report':
      body = renderOutcomeReportBody(
        spec.payload as unknown as OutcomeReportPayload,
      );
      break;
    default:
      body = renderGenericBody(spec.payload, spec.kind);
      break;
  }

  const element = buildPdfDocument(spec, body);
  const instance = pdf(element);
  const nodeBuffer = await instance.toBuffer();
  const buffer = await streamToBuffer(nodeBuffer);

  const filename = buildExportFilename({
    title: spec.title,
    kind: spec.kind,
    format: 'pdf',
    generatedAt:
      spec.generatedAt !== undefined ? new Date(spec.generatedAt) : undefined,
  });

  return {
    format: 'pdf',
    buffer,
    filename,
    contentType: PDF_CONTENT_TYPE,
    sizeBytes: buffer.byteLength,
  };
}

/**
 * `pdf().toBuffer()` resolves to a Node readable stream. Drain it into a
 * single Buffer the API route can hand to the Response.
 */
async function streamToBuffer(
  stream: NodeJS.ReadableStream | Buffer,
): Promise<Buffer> {
  if (Buffer.isBuffer(stream)) {
    return stream;
  }
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export { PDF_CONTENT_TYPE };
