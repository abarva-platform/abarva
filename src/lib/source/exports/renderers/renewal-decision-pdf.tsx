// Source · Renewal Decision · pdf renderer

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
import type { RenewalDecisionPayload } from './renewal-decision';

const SEED_GAP_LINE = '— Not recorded — seed gap';

function fmtUsd(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export function buildRenewalDecisionPdf(
  payload: RenewalDecisionPayload,
): ReactElement<DocumentProps> {
  const totals = computeTotals(payload);
  return buildStructuredPdfDocument({
    documentTitle: `Renewal Decision · ${payload.eventCode}`,
    subject: `Renewal decision pack for sourcing event ${payload.eventCode}.`,
    eyebrow: `Stage 7 · Renewal Decision · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    introNote:
      'Methodology §3 Stage 7: every renewal candidate carries an explicit ' +
      'posture (renew / renegotiate / rebid / consolidate / exit). ' +
      'Auto-renewal is not a posture.',
    confidentialityNote: 'Confidential — buyer-side renewal decision pack',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Renewal Decision`,
    body: (
      <>
        <StructuredPdfHeading>Portfolio summary</StructuredPdfHeading>
        <StructuredPdfKeyValueTable
          rows={[
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
          ]}
        />
        <StructuredPdfHeading>Renewal verdict</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.8, extract: (r) => r.vendor },
            { header: 'Scope', flex: 2.2, extract: (r) => r.scope },
            { header: 'Annual', flex: 1.2, extract: (r) => fmtUsd(r.annualSpendUsd) },
            { header: 'Renewal', flex: 1.1, extract: (r) => r.renewalDate },
            { header: 'Days', flex: 0.6, extract: (r) => String(r.daysUntilRenewal) },
            { header: 'Posture', flex: 1.4, extract: (r) => r.posture },
            { header: 'Alternative', flex: 1.6, extract: (r) => r.topAlternative },
          ]}
          rows={payload.candidates}
          rowStyle={(r) =>
            r.posture === 'exit' ||
            r.posture === 'rebid' ||
            (r.daysUntilRenewal > 0 && r.daysUntilRenewal < 90)
              ? 'warning'
              : undefined
          }
          emptyLabel={`${SEED_GAP_LINE} — no vendor_contracts records loaded.`}
        />
        <StructuredPdfHeading>Telemetry signals</StructuredPdfHeading>
        <StructuredPdfNote>
          {payload.signals.length === 0
            ? `${SEED_GAP_LINE} — operating_telemetry not yet loaded.`
            : `${payload.signals.length} telemetry signal${payload.signals.length === 1 ? '' : 's'} feeding the verdict.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Metric', flex: 2.2, extract: (r) => r.metric },
            { header: 'Value', flex: 1.4, extract: (r) => r.value },
            { header: 'Source', flex: 1.8, extract: (r) => r.source },
            { header: 'Posture impact', flex: 4.6, extract: (r) => r.impact },
          ]}
          rows={payload.signals}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>Decision triggers — what would change my mind</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Trigger', flex: 3.6, extract: (r) => r.trigger },
            { header: 'If true …', flex: 6.4, extract: (r) => r.ifTrue },
          ]}
          rows={payload.triggers}
          emptyLabel="No triggers supplied."
        />
      </>
    ),
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
