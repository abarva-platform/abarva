// Source · TCO Iceberg · pdf renderer

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfKeyValueTable,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import type { TcoIcebergPayload } from './tco-iceberg';

const SEED_GAP_LINE = '— Not recorded — seed gap';

function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function buildTcoIcebergPdf(
  payload: TcoIcebergPayload,
): ReactElement<DocumentProps> {
  const totals = computeTotals(payload);

  return buildStructuredPdfDocument({
    documentTitle: `TCO Iceberg · ${payload.eventCode}`,
    subject: `TCO iceberg cost model for sourcing event ${payload.eventCode}.`,
    eyebrow: `Stage 4 · TCO Iceberg · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    introNote:
      'Methodology §5: the vendor quote is typically 20–35% of true cost. ' +
      'This document itemises the iceberg so the evaluation team never ' +
      'presents TCO as a single point.',
    confidentialityNote: 'Confidential — buyer-side TCO iceberg',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   TCO Iceberg`,
    body: (
      <>
        <StructuredPdfHeading>3-year totals</StructuredPdfHeading>
        <StructuredPdfKeyValueTable
          rows={[
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
          ]}
        />
        <StructuredPdfHeading>Cost layers</StructuredPdfHeading>
        <StructuredPdfNote>
          {payload.layers.length === 0
            ? `${SEED_GAP_LINE} — no layers supplied.`
            : `${payload.layers.length} cost layer${payload.layers.length === 1 ? '' : 's'}. Hidden-visibility rows are commonly missed by vendor quotes.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Cost layer', flex: 2.8, extract: (r) => r.label },
            { header: 'Visibility', flex: 1, extract: (r) => r.visibility },
            { header: 'Driver', flex: 2.6, extract: (r) => r.driver },
            { header: 'Y1', flex: 1, extract: (r) => fmtUsd(r.year1Usd) },
            { header: 'Y2', flex: 1, extract: (r) => fmtUsd(r.year2Usd) },
            { header: 'Y3', flex: 1, extract: (r) => fmtUsd(r.year3Usd) },
            { header: 'Conf.', flex: 0.6, extract: (r) => r.confidence },
          ]}
          rows={payload.layers}
          rowStyle={(r) =>
            r.visibility === 'hidden' || r.confidence === 'low' ? 'warning' : undefined
          }
          emptyLabel={`${SEED_GAP_LINE} — no layers supplied.`}
        />
        <StructuredPdfHeading>Sensitivity</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Cost layer', flex: 4, extract: (r) => r.label },
            {
              header: 'Sensitivity band (USD/yr)',
              flex: 4,
              extract: (r) => `${fmtUsd(r.sensitivityLowUsd)} – ${fmtUsd(r.sensitivityHighUsd)}`,
            },
            { header: 'Confidence', flex: 1.6, extract: (r) => r.confidence },
          ]}
          rows={payload.layers}
          emptyLabel={`${SEED_GAP_LINE}`}
        />
        <StructuredPdfHeading>Iceberg definitions</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Layer', flex: 3, extract: (r) => r.layerLabel },
            { header: 'Rubric', flex: 7, extract: (r) => r.rubric },
          ]}
          rows={payload.definitions}
          emptyLabel="No definitions supplied."
        />
      </>
    ),
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
