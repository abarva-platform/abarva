// Source · d04 App Inventory · docx renderer
//
// Slice 5 — adds a docx surface alongside the existing xlsx (Slice 2b).
// Reuses the AppInventoryPayload from the xlsx pipeline so the payload
// binder is shared. Mirrors the xlsx sheet structure as docx sections:
//
//   1. Cover (eyebrow + title + metadata)
//   2. Tier Definitions (locked table — Tier / Label / Criterion /
//      Recovery objective / Examples)
//   3. Application Inventory (App ID / Name / Tier / Owner / Tech
//      stack / Hosting / Workload count / In-scope / Notes —
//      unclassified rows highlighted)
//   4. Inventory Summary (computed counts — total / by tier /
//      in-scope vs out)

import 'server-only';

import { Document, Footer, Paragraph, TextRun } from 'docx';

import {
  ORDERED_NUMBERING_CONFIG,
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
import type { AppInventoryPayload } from './app-inventory';

export function buildAppInventoryDocx(payload: AppInventoryPayload): Document {
  const tier1Count = payload.rows.filter((r) => r.tier === 1).length;
  const tier2Count = payload.rows.filter((r) => r.tier === 2).length;
  const tier3Count = payload.rows.filter((r) => r.tier === 3).length;
  const inScopeCount = payload.rows.filter((r) => r.inScope).length;
  const outOfScopeCount = payload.rows.filter((r) => !r.inScope).length;
  const totalWorkload = payload.rows
    .filter((r) => r.inScope)
    .reduce((acc, r) => acc + r.annualWorkloadCount, 0);

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Application Inventory · ${payload.eventCode}`,
    description: `d04 Application Inventory & Tiering for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential — buyer-side inventory; share with vendors only after scope lock',
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
          // Cover
          eyebrowParagraph(`d04 · Application Inventory · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          // Section 1 — Tier definitions
          heading2('Tier definitions'),
          bodyParagraph([
            bodyRun(
              'Locked rubric. Every Tier value in the inventory below must map to one of these rows.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Tier', widthPercent: 8, style: 'locked', extract: (r) => String(r.tier) },
              { header: 'Label', widthPercent: 18, style: 'locked', extract: (r) => r.label },
              { header: 'Criterion', widthPercent: 35, style: 'locked', extract: (r) => r.criterion },
              { header: 'Recovery objective', widthPercent: 19, style: 'locked', extract: (r) => r.recoveryObjective },
              { header: 'Examples', widthPercent: 20, style: 'locked', extract: (r) => r.examples },
            ],
            rows: payload.tierDefinitions,
          }),
          // Section 2 — Application inventory
          heading2('Application inventory'),
          bodyParagraph([
            bodyRun(
              `${payload.rows.length} application${payload.rows.length === 1 ? '' : 's'} inventoried. Rows with Tier 0 (unclassified) are highlighted — review before publishing.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'App ID', widthPercent: 10, extract: (r) => r.id },
              { header: 'Application name', widthPercent: 18, extract: (r) => r.name },
              { header: 'Tier', widthPercent: 6, extract: (r) => (r.tier === 0 ? '— unclassified —' : String(r.tier)) },
              { header: 'Business owner', widthPercent: 14, extract: (r) => r.owner },
              { header: 'Tech stack', widthPercent: 14, extract: (r) => r.techStack },
              { header: 'Hosting today', widthPercent: 14, extract: (r) => r.hostingToday },
              { header: 'Annual workload', widthPercent: 10, extract: (r) => r.annualWorkloadCount > 0 ? r.annualWorkloadCount.toLocaleString() : '' },
              { header: 'In-scope', widthPercent: 7, extract: (r) => (r.inScope ? 'Y' : 'N') },
              { header: 'Notes', widthPercent: 7, extract: (r) => r.notes ?? '' },
            ],
            rows: payload.rows,
            rowStyle: (r) => (r.tier === 0 ? 'warning' : undefined),
          }),
          // Section 3 — Inventory summary
          heading2('Inventory summary'),
          bodyParagraph([
            bodyRun(
              'Computed at generation time. Re-run this export after the inventory changes to refresh the counts.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildKeyValueTable({
            rows: [
              { label: 'Total applications inventoried', value: String(payload.rows.length) },
              { label: 'Tier 1 (mission-critical)', value: String(tier1Count) },
              { label: 'Tier 2 (important)', value: String(tier2Count) },
              { label: 'Tier 3 (standard)', value: String(tier3Count) },
              { label: 'In-scope', value: String(inScopeCount) },
              { label: 'Out-of-scope', value: String(outOfScopeCount) },
              { label: 'Total annual workload (in-scope only)', value: totalWorkload > 0 ? totalWorkload.toLocaleString() : '0' },
            ],
            labelWidth: 50,
          }),
        ],
      },
    ],
  });
}
