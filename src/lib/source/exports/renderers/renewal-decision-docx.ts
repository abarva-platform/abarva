// Source · Renewal Decision · docx renderer

import 'server-only';

import { Document, Footer, Paragraph, TextRun } from 'docx';

import {
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading2,
} from '@/lib/exports-shared/docx-base';
import {
  buildKeyValueTable,
  buildMultiColumnTable,
} from '@/lib/exports-shared/structured-docx-base';
import type { RenewalDecisionPayload } from './renewal-decision';

const SEED_GAP_LINE = '— Not recorded — seed gap';

function fmtUsd(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export function buildRenewalDecisionDocx(payload: RenewalDecisionPayload): Document {
  const totals = computeTotals(payload);
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Renewal Decision · ${payload.eventCode}`,
    description: `Renewal decision pack for sourcing event ${payload.eventCode}.`,
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential — buyer-side renewal decision pack',
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
        children: [
          eyebrowParagraph(`Stage 7 · Renewal Decision · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)] : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          bodyParagraph([
            bodyRun(
              'Methodology §3 Stage 7: every renewal candidate carries an explicit posture (renew / renegotiate / rebid / consolidate / exit). Auto-renewal is not a posture. The xlsx companion is the working surface; this document is the share + decision-pack rendering.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),

          heading2('Portfolio summary'),
          buildKeyValueTable({
            rows: [
              { label: 'Candidates under review', value: String(payload.candidates.length) },
              { label: 'Combined annual spend', value: fmtUsd(totals.spend) },
              { label: 'Imminent renewals (< 90 days)', value: String(totals.imminent) },
              { label: 'Postures: renew_as_is', value: String(totals.byPosture.renew_as_is) },
              { label: 'Postures: renegotiate', value: String(totals.byPosture.renegotiate) },
              { label: 'Postures: rebid', value: String(totals.byPosture.rebid) },
              { label: 'Postures: consolidate', value: String(totals.byPosture.consolidate) },
              { label: 'Postures: exit', value: String(totals.byPosture.exit) },
              { label: 'Postures: undetermined', value: String(totals.byPosture.undetermined) },
              { label: 'Telemetry signals on file', value: String(payload.signals.length) },
            ],
            labelWidth: 55,
          }),

          heading2('Renewal verdict'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 18, extract: (r) => r.vendor },
              { header: 'Scope', widthPercent: 22, extract: (r) => r.scope },
              { header: 'Annual spend', widthPercent: 12, extract: (r) => fmtUsd(r.annualSpendUsd) },
              { header: 'Renewal', widthPercent: 11, extract: (r) => r.renewalDate },
              { header: 'Days', widthPercent: 7, extract: (r) => String(r.daysUntilRenewal) },
              { header: 'Posture', widthPercent: 14, extract: (r) => r.posture },
              { header: 'Alternative', widthPercent: 16, extract: (r) => r.topAlternative },
            ],
            rows: payload.candidates,
            rowStyle: (r) =>
              r.posture === 'exit' ||
              r.posture === 'rebid' ||
              (r.daysUntilRenewal > 0 && r.daysUntilRenewal < 90)
                ? 'warning'
                : undefined,
          }),

          heading2('Rationale (per candidate)'),
          ...payload.candidates.flatMap((c) => [
            bodyParagraph([
              bodyRun(`${c.vendor} — ${c.posture}`, { bold: true }),
            ]),
            bodyParagraph([bodyRun(c.rationale)]),
          ]),

          heading2('Telemetry signals'),
          bodyParagraph([
            bodyRun(
              payload.signals.length === 0
                ? `${SEED_GAP_LINE} — operating_telemetry is not yet loaded for ${payload.tenantName}.`
                : `${payload.signals.length} telemetry signal${payload.signals.length === 1 ? '' : 's'} feeding the verdict.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Metric', widthPercent: 22, extract: (r) => r.metric },
              { header: 'Value', widthPercent: 14, extract: (r) => r.value },
              { header: 'Source', widthPercent: 18, extract: (r) => r.source },
              { header: 'Posture impact', widthPercent: 46, extract: (r) => r.impact },
            ],
            rows: payload.signals,
          }),

          heading2('Decision triggers — what would change my mind'),
          buildMultiColumnTable({
            columns: [
              { header: 'Trigger', widthPercent: 36, style: 'locked', extract: (r) => r.trigger },
              { header: 'If true …', widthPercent: 64, style: 'locked', extract: (r) => r.ifTrue },
            ],
            rows: payload.triggers,
          }),
        ],
      },
    ],
  });
}

function computeTotals(payload: RenewalDecisionPayload) {
  let spend = 0;
  let imminent = 0;
  const byPosture: Record<string, number> = {
    renew_as_is: 0,
    renegotiate: 0,
    rebid: 0,
    consolidate: 0,
    exit: 0,
    undetermined: 0,
  };
  for (const c of payload.candidates) {
    spend += c.annualSpendUsd;
    if (c.daysUntilRenewal > 0 && c.daysUntilRenewal < 90) imminent += 1;
    byPosture[c.posture] = (byPosture[c.posture] ?? 0) + 1;
  }
  return { spend, imminent, byPosture };
}
