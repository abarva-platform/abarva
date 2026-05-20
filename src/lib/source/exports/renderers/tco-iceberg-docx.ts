// Source · TCO Iceberg · docx renderer

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
import type { TcoIcebergPayload } from './tco-iceberg';

const SEED_GAP_LINE = '— Not recorded — seed gap';

function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function buildTcoIcebergDocx(payload: TcoIcebergPayload): Document {
  const totals = computeTotals(payload);
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `TCO Iceberg · ${payload.eventCode}`,
    description: `TCO iceberg cost model for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential — buyer-side TCO iceberg; not the vendor quote',
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
          eyebrowParagraph(`Stage 4 · TCO Iceberg · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)] : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          bodyParagraph([
            bodyRun(
              'Methodology §5: the vendor quote is typically 20–35% of true cost. This document itemises the iceberg so the evaluation team never presents TCO as a single point.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),

          heading2('3-year totals'),
          buildKeyValueTable({
            rows: [
              { label: 'Visible (vendor-quoted) 3-yr total', value: fmtUsd(totals.visible3y) },
              { label: 'Hidden (iceberg) 3-yr total', value: fmtUsd(totals.hidden3y) },
              { label: 'Combined 3-yr total', value: fmtUsd(totals.total3y) },
              {
                label: 'Iceberg multiplier (combined ÷ visible)',
                value:
                  totals.visible3y > 0
                    ? `${(totals.total3y / totals.visible3y).toFixed(1)}×`
                    : SEED_GAP_LINE,
              },
            ],
            labelWidth: 55,
          }),

          heading2('Cost layers'),
          bodyParagraph([
            bodyRun(
              payload.layers.length === 0
                ? `${SEED_GAP_LINE} — no layers supplied.`
                : `${payload.layers.length} cost layer${payload.layers.length === 1 ? '' : 's'}. Hidden-visibility rows are commonly missed by vendor quotes.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Cost layer', widthPercent: 28, extract: (r) => r.label },
              { header: 'Visibility', widthPercent: 10, extract: (r) => r.visibility },
              { header: 'Driver', widthPercent: 26, extract: (r) => r.driver },
              { header: 'Y1 USD', widthPercent: 10, extract: (r) => fmtUsd(r.year1Usd) },
              { header: 'Y2 USD', widthPercent: 10, extract: (r) => fmtUsd(r.year2Usd) },
              { header: 'Y3 USD', widthPercent: 10, extract: (r) => fmtUsd(r.year3Usd) },
              { header: 'Conf.', widthPercent: 6, extract: (r) => r.confidence },
            ],
            rows: payload.layers,
            rowStyle: (r) =>
              r.visibility === 'hidden' || r.confidence === 'low' ? 'warning' : undefined,
          }),

          heading2('Sensitivity'),
          buildMultiColumnTable({
            columns: [
              { header: 'Cost layer', widthPercent: 40, extract: (r) => r.label },
              {
                header: 'Sensitivity band (USD / yr)',
                widthPercent: 40,
                extract: (r) => `${fmtUsd(r.sensitivityLowUsd)} – ${fmtUsd(r.sensitivityHighUsd)}`,
              },
              { header: 'Confidence', widthPercent: 20, extract: (r) => r.confidence },
            ],
            rows: payload.layers,
          }),

          heading2('Iceberg definitions'),
          buildMultiColumnTable({
            columns: [
              { header: 'Layer', widthPercent: 30, style: 'locked', extract: (r) => r.layerLabel },
              { header: 'Rubric', widthPercent: 70, style: 'locked', extract: (r) => r.rubric },
            ],
            rows: payload.definitions,
          }),
        ],
      },
    ],
  });
}

function computeTotals(payload: TcoIcebergPayload): {
  visible3y: number;
  hidden3y: number;
  total3y: number;
} {
  let visible = 0;
  let hidden = 0;
  for (const l of payload.layers) {
    const t = l.year1Usd + l.year2Usd + l.year3Usd;
    if (l.visibility === 'visible') visible += t;
    else hidden += t;
  }
  return { visible3y: visible, hidden3y: hidden, total3y: visible + hidden };
}
