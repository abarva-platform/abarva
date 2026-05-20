// Source · Market Scan · pdf renderer
//
// Print-ready PDF companion to market-scan-docx + xlsx. Sections mirror
// the docx; tables use the shared structured-pdf-base helpers.

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import type { MarketScanPayload } from './market-scan';

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function buildMarketScanPdf(
  payload: MarketScanPayload,
): ReactElement<DocumentProps> {
  return buildStructuredPdfDocument({
    documentTitle: `Market Scan · ${payload.eventCode}`,
    subject: `Stage 2 market scan for sourcing event ${payload.eventCode}.`,
    eyebrow: `Stage 2 · Market Scan · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    introNote:
      'Stage 2 market intelligence: vendor longlist, capability matrix, ' +
      '3-D rate benchmarks, industry signals. The xlsx companion is the ' +
      'working surface; rows tagged "Not recorded — seed gap" indicate ' +
      'industry_context is not yet loaded for this tenant.',
    confidentialityNote: 'Confidential — buyer-side market scan',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Market Scan`,
    body: (
      <>
        <StructuredPdfHeading>Vendor longlist</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'}. Reality column flags thin wrappers; M&A flag highlights active or rumored deals.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 2.2, extract: (r) => r.name },
            { header: 'Archetype', flex: 2.2, extract: (r) => r.archetype },
            { header: 'HQ', flex: 1.4, extract: (r) => r.hq },
            { header: 'Scale', flex: 1.6, extract: (r) => r.scale },
            { header: 'Reality', flex: 1.4, extract: (r) => r.platformReality },
            { header: 'M&A', flex: 1.0, extract: (r) => r.maFlag },
          ]}
          rows={payload.vendors}
          rowStyle={(r) =>
            r.platformReality === 'thin_wrapper' || r.maFlag === 'active' || r.maFlag === 'completed'
              ? 'warning'
              : undefined
          }
          emptyLabel={`${SEED_GAP_LINE} — no vendor longlist supplied.`}
        />
        <StructuredPdfHeading>Capability matrix</StructuredPdfHeading>
        <StructuredPdfNote>
          {payload.capabilities.length === 0
            ? `${SEED_GAP_LINE} — no capability matrix supplied.`
            : `${payload.capabilities.length} capability row${payload.capabilities.length === 1 ? '' : 's'}.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Capability', flex: 4, extract: (r) => r.capability },
            { header: 'M/I/O', flex: 0.8, extract: (r) => r.importance },
            {
              header: 'Vendor coverage',
              flex: 3,
              extract: (r) => describeVendorCoverage(r.byVendor),
            },
          ]}
          rows={payload.capabilities}
          emptyLabel={`${SEED_GAP_LINE}`}
        />
        <StructuredPdfHeading>Pricing benchmarks (3-D rate card)</StructuredPdfHeading>
        <StructuredPdfNote>
          {payload.rates.length === 0
            ? `${SEED_GAP_LINE} — no rate benchmarks recorded.`
            : `${payload.rates.length} rate row${payload.rates.length === 1 ? '' : 's'}.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Archetype', flex: 2.4, extract: (r) => r.archetype },
            { header: 'Delivery', flex: 1.2, extract: (r) => r.delivery },
            { header: 'Specialization', flex: 2.4, extract: (r) => r.specialization },
            {
              header: 'Rate USD/hr',
              flex: 1.4,
              extract: (r) => `$${r.rateUsdHrLow} – $${r.rateUsdHrHigh}`,
            },
            { header: 'Source', flex: 2, extract: (r) => r.source },
          ]}
          rows={payload.rates}
          emptyLabel={`${SEED_GAP_LINE}`}
        />
        <StructuredPdfHeading>Industry signals</StructuredPdfHeading>
        <StructuredPdfNote>
          {payload.industrySignals.length === 0
            ? `${SEED_GAP_LINE} — industry_context not yet loaded for ${payload.tenantName}.`
            : `${payload.industrySignals.length} signal${payload.industrySignals.length === 1 ? '' : 's'} from corpus.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Topic', flex: 1.6, extract: (r) => r.topic },
            { header: 'Observation', flex: 3.8, extract: (r) => r.observation },
            { header: 'Source', flex: 1.6, extract: (r) => r.source },
          ]}
          rows={payload.industrySignals}
          emptyLabel={`${SEED_GAP_LINE}`}
        />
      </>
    ),
  });
}

function describeVendorCoverage(
  byVendor: Record<string, 'full' | 'partial' | 'gap' | 'unknown'>,
): string {
  const counts = { full: 0, partial: 0, gap: 0, unknown: 0 };
  for (const v of Object.values(byVendor)) counts[v] += 1;
  const parts: string[] = [];
  if (counts.full) parts.push(`${counts.full} full`);
  if (counts.partial) parts.push(`${counts.partial} partial`);
  if (counts.gap) parts.push(`${counts.gap} gap`);
  if (counts.unknown) parts.push(`${counts.unknown} unknown`);
  return parts.join(' · ') || '—';
}
