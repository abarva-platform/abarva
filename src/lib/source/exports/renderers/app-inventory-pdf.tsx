// Source · d04 App Inventory · pdf renderer
//
// PDF companion to app-inventory-docx.ts (Slice 5) and the xlsx
// (Slice 2b). Reuses the AppInventoryPayload from the xlsx pipeline so
// the payload binder is shared. Mirrors the docx section structure as
// react-pdf table Views — a CFO-readable, print-ready rendering of the
// same content the spreadsheet carries.
//
// Sections:
//   1. Cover (eyebrow + title + metadata)
//   2. Tier definitions (locked rubric)
//   3. Application inventory (one row per app; Tier 0 highlighted)
//   4. Inventory summary (computed counts)

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
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import type { AppInventoryPayload } from './app-inventory';

export function buildAppInventoryPdf(
  payload: AppInventoryPayload,
): ReactElement<DocumentProps> {
  const tier1Count = payload.rows.filter((r) => r.tier === 1).length;
  const tier2Count = payload.rows.filter((r) => r.tier === 2).length;
  const tier3Count = payload.rows.filter((r) => r.tier === 3).length;
  const inScopeCount = payload.rows.filter((r) => r.inScope).length;
  const outOfScopeCount = payload.rows.filter((r) => !r.inScope).length;
  const totalWorkload = payload.rows
    .filter((r) => r.inScope)
    .reduce((acc, r) => acc + r.annualWorkloadCount, 0);

  return buildStructuredPdfDocument({
    documentTitle: `Application Inventory · ${payload.eventCode}`,
    subject: `d04 Application Inventory & Tiering for sourcing event ${payload.eventCode}.`,
    eyebrow: `d04 · Application Inventory · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    governanceNotice: sourceArtifactGovernanceBanner('ai_draft', {
      artifactCode: 'd04',
    }),
    introNote:
      'Print-ready rendering of the d04 application inventory. The xlsx ' +
      'companion is the in-place editing surface; this PDF is for board ' +
      'packs and offline review.',
    confidentialityNote:
      'Confidential — buyer-side inventory; share with vendors only after scope lock',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Application Inventory`,
    body: (
      <>
        <StructuredPdfHeading>Tier definitions</StructuredPdfHeading>
        <StructuredPdfNote>
          Locked rubric. Every Tier value in the inventory below must map to one of these rows.
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Tier', flex: 0.6, extract: (r) => String(r.tier) },
            { header: 'Label', flex: 1.4, extract: (r) => r.label },
            { header: 'Criterion', flex: 2.8, extract: (r) => r.criterion },
            { header: 'Recovery objective', flex: 1.5, extract: (r) => r.recoveryObjective },
            { header: 'Examples', flex: 1.6, extract: (r) => r.examples },
          ]}
          rows={payload.tierDefinitions}
          emptyLabel="No tier definitions supplied for this artifact."
        />
        <StructuredPdfHeading>Application inventory</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.rows.length} application${payload.rows.length === 1 ? '' : 's'} inventoried. Tier 0 (unclassified) rows are highlighted — review before publishing.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'App ID', flex: 1, extract: (r) => r.id },
            { header: 'Application name', flex: 1.8, extract: (r) => r.name },
            { header: 'Tier', flex: 0.8, extract: (r) => (r.tier === 0 ? 'unclassified' : String(r.tier)) },
            { header: 'Business owner', flex: 1.4, extract: (r) => r.owner },
            { header: 'Tech stack', flex: 1.4, extract: (r) => r.techStack },
            { header: 'Hosting today', flex: 1.4, extract: (r) => r.hostingToday },
            { header: 'Annual workload', flex: 1, extract: (r) => (r.annualWorkloadCount > 0 ? r.annualWorkloadCount.toLocaleString() : '') },
            { header: 'In-scope', flex: 0.7, extract: (r) => (r.inScope ? 'Y' : 'N') },
            { header: 'Notes', flex: 1, extract: (r) => r.notes ?? '' },
          ]}
          rows={payload.rows}
          rowStyle={(r) => (r.tier === 0 ? 'warning' : undefined)}
          emptyLabel="No applications inventoried yet — populate the inventory before circulating."
        />
        <StructuredPdfHeading>Inventory summary</StructuredPdfHeading>
        <StructuredPdfNote>
          Computed at generation time. Re-run this export after the inventory changes to refresh the counts.
        </StructuredPdfNote>
        <StructuredPdfKeyValueTable
          rows={[
            { label: 'Total applications inventoried', value: String(payload.rows.length) },
            { label: 'Tier 1 (mission-critical)', value: String(tier1Count) },
            { label: 'Tier 2 (important)', value: String(tier2Count) },
            { label: 'Tier 3 (standard)', value: String(tier3Count) },
            { label: 'In-scope', value: String(inScopeCount) },
            { label: 'Out-of-scope', value: String(outOfScopeCount) },
            { label: 'Total annual workload (in-scope only)', value: totalWorkload > 0 ? totalWorkload.toLocaleString() : '0' },
          ]}
        />
      </>
    ),
  });
}
