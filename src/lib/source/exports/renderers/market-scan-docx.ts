// Source · Market Scan · docx renderer
//
// Readable rendering of the dx2 market-scan xlsx — vendor longlist,
// capability matrix, 3-D rate benchmarks, industry signals. The xlsx
// is the working surface; the docx is for share + redline.

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
import { buildMultiColumnTable } from '@/lib/exports-shared/structured-docx-base';
import type { MarketScanPayload } from './market-scan';

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function buildMarketScanDocx(payload: MarketScanPayload): Document {
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Market Scan · ${payload.eventCode}`,
    description: `Market scan for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential — buyer-side market scan; not for vendor distribution',
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
          eyebrowParagraph(`Stage 2 · Market Scan · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)] : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          bodyParagraph([
            bodyRun(
              'Readable rendering of the market scan. The xlsx companion is the working surface; this document is for share + redline. Rows tagged "Not recorded — seed gap" mean the relevant substrate (industry_context) is not yet loaded for this tenant.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),

          heading2('Vendor longlist'),
          bodyParagraph([
            bodyRun(
              `${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'} on the longlist. Platform-reality column flags thin wrappers; M&A flag highlights active or rumored deals.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          payload.vendors.length === 0
            ? buildMultiColumnTable({
                columns: [
                  { header: 'Vendor', widthPercent: 30, extract: () => SEED_GAP_LINE },
                  { header: 'Note', widthPercent: 70, extract: () => 'No vendor longlist supplied.' },
                ],
                rows: [{}],
                rowStyle: () => 'warning',
              })
            : buildMultiColumnTable({
                columns: [
                  { header: 'Vendor', widthPercent: 22, extract: (r) => r.name },
                  { header: 'Archetype', widthPercent: 22, extract: (r) => r.archetype },
                  { header: 'HQ', widthPercent: 14, extract: (r) => r.hq },
                  { header: 'Scale', widthPercent: 16, extract: (r) => r.scale },
                  { header: 'Reality', widthPercent: 14, extract: (r) => r.platformReality },
                  { header: 'M&A', widthPercent: 12, extract: (r) => r.maFlag },
                ],
                rows: payload.vendors,
                rowStyle: (r) =>
                  r.platformReality === 'thin_wrapper' || r.maFlag === 'active' || r.maFlag === 'completed'
                    ? 'warning'
                    : undefined,
              }),

          heading2('Capability matrix'),
          bodyParagraph([
            bodyRun(
              payload.capabilities.length === 0
                ? `${SEED_GAP_LINE} — no capability matrix supplied.`
                : `${payload.capabilities.length} capability row${payload.capabilities.length === 1 ? '' : 's'}. Mandatory (M) gaps disqualify; Important (I) gaps go to BAFO.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Capability', widthPercent: 50, extract: (r) => r.capability },
              { header: 'M/I/O', widthPercent: 10, extract: (r) => r.importance },
              {
                header: 'Vendor coverage',
                widthPercent: 40,
                extract: (r) => describeVendorCoverage(r.byVendor),
              },
            ],
            rows: payload.capabilities,
          }),

          heading2('Pricing benchmarks (3-D rate card)'),
          bodyParagraph([
            bodyRun(
              payload.rates.length === 0
                ? `${SEED_GAP_LINE} — no rate benchmarks recorded.`
                : `${payload.rates.length} rate row${payload.rates.length === 1 ? '' : 's'}. Use as the d19 reasonableness check.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Archetype', widthPercent: 26, extract: (r) => r.archetype },
              { header: 'Delivery', widthPercent: 14, extract: (r) => r.delivery },
              { header: 'Specialization', widthPercent: 26, extract: (r) => r.specialization },
              {
                header: 'Rate USD/hr',
                widthPercent: 18,
                extract: (r) => `$${r.rateUsdHrLow} – $${r.rateUsdHrHigh}`,
              },
              { header: 'Source', widthPercent: 16, extract: (r) => r.source },
            ],
            rows: payload.rates,
          }),

          heading2('Industry signals (substrate)'),
          bodyParagraph([
            bodyRun(
              payload.industrySignals.length === 0
                ? `${SEED_GAP_LINE} — industry_context is not yet loaded for ${payload.tenantName}.`
                : `${payload.industrySignals.length} signal${payload.industrySignals.length === 1 ? '' : 's'} from corpus.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Topic', widthPercent: 26, extract: (r) => r.topic },
              { header: 'Observation', widthPercent: 56, extract: (r) => r.observation },
              { header: 'Source', widthPercent: 18, extract: (r) => r.source },
            ],
            rows: payload.industrySignals,
          }),
        ],
      },
    ],
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
