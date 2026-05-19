// Tower · outcome / measurement report · DOCX renderer
//
// G8 — narrative outcome report for the Control Tower surface. Mirrors
// the Source structured-docx renderer pattern (cover + headings +
// tables) and reuses the shared AbarVa docx tokens so the downloaded
// file reads like the rest of the product.
//
// Pure: payload → docx.Document. The route serializes via Packer.
//
// No-fabrication contract: this renderer prints only what the payload
// carries. Empty sections render their honest `emptyNotes` string;
// nothing is back-filled with placeholder numbers.

import 'server-only';

import { Document, Footer, Header, Paragraph, Table, TextRun } from 'docx';

import {
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  boldRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading1,
  heading2,
} from '@/lib/exports-shared/docx-base';
import {
  buildKeyValueTable,
  buildMultiColumnTable,
} from '@/lib/exports-shared/structured-docx-base';
import type {
  OutcomeActivityRow,
  OutcomeInitiativeRow,
  OutcomeKpiRow,
  OutcomeVendorRow,
  TowerOutcomeReportPayload,
} from './outcome-report-payload';

const CONFIDENTIALITY_NOTE =
  'Confidential — Control Tower outcome report; figures reflect loaded substrate only';

/** Realized-posture → human sentence. Honest about "not measured". */
function realizedPostureLabel(row: OutcomeInitiativeRow): string {
  switch (row.realizedPosture.kind) {
    case 'not_measured':
      return 'Not yet measured';
    case 'no_forecast':
      return 'Measured; no committed-spend forecast on file';
    case 'measured':
      return row.realizedPosture.deltaLabel;
  }
}

function kpiAttainmentLabel(row: OutcomeKpiRow): string {
  return row.attainment.kind === 'no_target'
    ? 'No target on file'
    : row.attainment.label;
}

function activityWhenLabel(row: OutcomeActivityRow): string {
  const { dayOffset } = row;
  if (dayOffset === 0) return 'today';
  if (dayOffset < 0) return `${Math.abs(dayOffset)}d ago`;
  return `in ${dayOffset}d`;
}

function emptyNoteParagraph(text: string): Paragraph {
  return bodyParagraph([
    bodyRun(text, { color: SOURCE_DOCX.MUTED_COLOR, italics: true }),
  ]);
}

export function buildTowerOutcomeReportDocx(
  payload: TowerOutcomeReportPayload,
): Document {
  const children: Array<Paragraph | Table> = [];

  // ── Cover ──────────────────────────────────────────────────────────────
  children.push(
    eyebrowParagraph(`Control Tower · Outcome & Measurement Report · ${payload.tenantName}`),
  );
  children.push(coverTitleParagraph('AI Initiative Outcome Report'));
  children.push(coverSubtitleParagraph(`Tenant: ${payload.tenantName}`));
  children.push(coverSubtitleParagraph(`Tower date: ${payload.towerToday}`));
  children.push(coverSubtitleParagraph(`Generated: ${payload.generatedAt}`));
  children.push(
    bodyParagraph([
      bodyRun(
        'This report assembles the realized outcomes the Control Tower tracks for ' +
          'this tenant: portfolio metrics, tracked initiatives, the measurement ' +
          'model (KPIs), realized-vs-forecast posture, the vendor portfolio, and ' +
          '90-day activity. Every figure is drawn from loaded substrate. Where ' +
          'substrate is thin, sections state so explicitly — no values are estimated.',
        { color: SOURCE_DOCX.MUTED_COLOR },
      ),
    ]),
  );

  if (payload.isEmpty) {
    children.push(heading1('No tracked outcomes yet'));
    children.push(emptyNoteParagraph(payload.emptyNotes.initiatives ?? ''));
    return wrapDocument(payload, children);
  }

  // ── Section 1 — Portfolio summary ──────────────────────────────────────
  children.push(heading1('Portfolio summary'));
  children.push(
    buildKeyValueTable({
      rows: [
        { label: 'Tracked initiatives', value: String(payload.summary.initiativeCount) },
        {
          label: 'Initiatives with a realized value',
          value: `${payload.summary.measuredInitiativeCount} of ${payload.summary.initiativeCount}`,
        },
        {
          label: 'Initiatives under active pressure',
          value: String(payload.summary.pressuredInitiativeCount),
        },
        { label: 'Vendor contracts tracked', value: String(payload.summary.vendorCount) },
        { label: 'KPI measurements recorded', value: String(payload.summary.kpiCount) },
      ],
      labelWidth: 50,
    }),
  );

  // ── Section 2 — Portfolio metrics (band) ───────────────────────────────
  children.push(heading2('Portfolio metrics'));
  children.push(
    bodyParagraph([
      bodyRun(
        'Deterministic Control Tower band metrics. The confidence column reflects ' +
          'substrate coverage; "NONE" means the metric has no substrate and shows a ' +
          'dash rather than a number.',
        { color: SOURCE_DOCX.MUTED_COLOR },
      ),
    ]),
  );
  children.push(
    buildMultiColumnTable({
      columns: [
        { header: 'Metric', widthPercent: 26, style: 'locked', extract: (r) => r.label },
        { header: 'Value', widthPercent: 14, extract: (r) => r.value },
        { header: 'Detail', widthPercent: 38, extract: (r) => r.subtext },
        { header: 'Confidence', widthPercent: 22, extract: (r) => r.confidence },
      ],
      rows: payload.bandMetrics,
    }),
  );

  // ── Section 3 — Tracked initiatives & realized vs forecast ─────────────
  children.push(heading1('Tracked initiatives — realized vs forecast'));
  if (payload.initiatives.length === 0) {
    children.push(emptyNoteParagraph(payload.emptyNotes.initiatives ?? ''));
  } else {
    if (payload.emptyNotes.measurement) {
      children.push(emptyNoteParagraph(payload.emptyNotes.measurement));
    }
    children.push(
      buildMultiColumnTable<OutcomeInitiativeRow>({
        columns: [
          { header: 'ID', widthPercent: 9, style: 'locked', extract: (r) => r.displayId },
          { header: 'Initiative', widthPercent: 22, extract: (r) => r.name },
          { header: 'Stage', widthPercent: 11, extract: (r) => r.stageLabel },
          { header: 'Status', widthPercent: 12, extract: (r) => r.statusLabel },
          { header: 'Committed', widthPercent: 11, extract: (r) => r.committedAnnual },
          { header: 'Realized', widthPercent: 11, extract: (r) => r.measuredValue },
          {
            header: 'Realized vs forecast',
            widthPercent: 24,
            extract: (r) => realizedPostureLabel(r),
          },
        ],
        rows: payload.initiatives,
        rowStyle: (r) =>
          r.realizedPosture.kind === 'measured' && r.realizedPosture.ratio < 1
            ? 'warning'
            : undefined,
      }),
    );
  }

  // ── Section 4 — Measurement model (KPIs) ───────────────────────────────
  children.push(heading1('Measurement model'));
  if (payload.kpis.length === 0) {
    children.push(emptyNoteParagraph(payload.emptyNotes.kpis ?? ''));
  } else {
    children.push(
      buildMultiColumnTable<OutcomeKpiRow>({
        columns: [
          { header: 'Initiative', widthPercent: 16, style: 'locked', extract: (r) => r.initiativeDisplayId },
          { header: 'KPI', widthPercent: 22, extract: (r) => r.kpiName },
          { header: 'Quarter', widthPercent: 11, extract: (r) => r.quarter },
          { header: 'Value', widthPercent: 12, extract: (r) => r.valueLabel },
          { header: 'Target', widthPercent: 12, extract: (r) => r.targetLabel },
          { header: 'Peer median', widthPercent: 12, extract: (r) => r.peerMedianLabel },
          { header: 'Attainment', widthPercent: 15, extract: (r) => kpiAttainmentLabel(r) },
        ],
        rows: payload.kpis,
        rowStyle: (r) =>
          r.attainment.kind === 'measured' && r.attainment.pct < 100
            ? 'warning'
            : undefined,
      }),
    );
  }

  // ── Section 5 — Vendor portfolio ───────────────────────────────────────
  children.push(heading1('Vendor portfolio'));
  if (payload.vendors.length === 0) {
    children.push(emptyNoteParagraph(payload.emptyNotes.vendors ?? ''));
  } else {
    children.push(
      buildMultiColumnTable<OutcomeVendorRow>({
        columns: [
          { header: 'Vendor', widthPercent: 22, style: 'locked', extract: (r) => r.vendorName },
          { header: 'Initiative', widthPercent: 26, extract: (r) => r.initiativeName },
          { header: 'Contract value', widthPercent: 16, extract: (r) => r.contractValue },
          { header: 'Renewal date', widthPercent: 16, extract: (r) => r.renewalDate },
          {
            header: 'Financial health',
            widthPercent: 20,
            extract: (r) => r.financialHealthLabel,
          },
        ],
        rows: payload.vendors,
      }),
    );
  }

  // ── Section 6 — 90-day activity ────────────────────────────────────────
  children.push(heading1('90-day activity'));
  if (payload.activity90d.length === 0) {
    children.push(emptyNoteParagraph(payload.emptyNotes.activity ?? ''));
  } else {
    children.push(
      bodyParagraph([
        bodyRun(
          `Vendor renewals and KPI measurements within 90 days of ${payload.towerToday}.`,
          { color: SOURCE_DOCX.MUTED_COLOR },
        ),
      ]),
    );
    children.push(
      buildMultiColumnTable<OutcomeActivityRow>({
        columns: [
          { header: 'Date', widthPercent: 16, style: 'locked', extract: (r) => r.date },
          { header: 'When', widthPercent: 14, extract: (r) => activityWhenLabel(r) },
          {
            header: 'Category',
            widthPercent: 18,
            extract: (r) =>
              r.category === 'renewal' ? 'Vendor renewal' : 'KPI measurement',
          },
          { header: 'Summary', widthPercent: 52, extract: (r) => r.summary },
        ],
        rows: payload.activity90d,
      }),
    );
  }

  // ── Closing note ───────────────────────────────────────────────────────
  children.push(
    bodyParagraph([
      boldRun('Provenance. ', { color: SOURCE_DOCX.HEADER_COLOR }),
      bodyRun(
        'Every number above is sourced from the AI Initiatives substrate and the ' +
          'deterministic Control Tower band-metrics view-model. No figure is ' +
          'estimated or back-filled. Sections with no substrate state that ' +
          'explicitly above.',
        { color: SOURCE_DOCX.MUTED_COLOR },
      ),
    ]),
  );

  return wrapDocument(payload, children);
}

function wrapDocument(
  payload: TowerOutcomeReportPayload,
  children: ReadonlyArray<Paragraph | Table>,
): Document {
  return new Document({
    creator: 'AbarVa · Atlas',
    title: `AI Initiative Outcome Report · ${payload.tenantName}`,
    description: `Control Tower outcome / measurement report for ${payload.tenantName}.`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${payload.tenantName}   ·   Control Tower   ·   Outcome & Measurement Report`,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 18,
                    color: SOURCE_DOCX.MUTED_COLOR,
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
                children: [
                  new TextRun({
                    text: CONFIDENTIALITY_NOTE,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 16,
                    color: SOURCE_DOCX.MUTED_COLOR,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...children],
      },
    ],
  });
}
