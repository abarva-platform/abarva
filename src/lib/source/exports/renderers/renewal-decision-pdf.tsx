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

function fmtOptionalUsd(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  return fmtUsd(n);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  return `${Math.round(n * 100)}%`;
}

function fmtBool(v: boolean | null | undefined): string {
  if (v == null) return SEED_GAP_LINE;
  return v ? 'Yes' : 'No';
}

function fmtNumber(v: number | null | undefined): string {
  if (v == null) return SEED_GAP_LINE;
  return String(v);
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
      'Auto-renewal is not a posture. Answer first, then timing, usage, spend, risk, negotiation posture and SRM/Tower handoff.',
    confidentialityNote: 'Confidential — buyer-side renewal decision pack',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Renewal Decision`,
    body: (
      <>
        <StructuredPdfHeading>Executive answer</StructuredPdfHeading>
        <StructuredPdfKeyValueTable
          rows={[
            { label: 'Recommended decision', value: buildExecutiveAnswer(payload) },
            { label: 'Value at stake', value: `${fmtUsd(totals.spend)} annual spend under review` },
            { label: 'Urgency', value: `${totals.imminent} renewal(s) inside 90 days; ${totals.noticeAtRisk} notice deadline(s) at risk or not recorded` },
            { label: 'Hard blocker', value: totals.seedGaps > 0 ? `${totals.seedGaps} required field(s) not recorded` : 'No hard blocker in the artifact payload' },
            { label: 'Required executive action', value: buildExecutiveAction(payload) },
          ]}
        />
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
        <StructuredPdfHeading>Timing and leverage</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.7, extract: (r) => r.vendor },
            { header: 'Renewal', flex: 1.1, extract: (r) => r.renewalDate },
            { header: 'Auto?', flex: 0.8, extract: (r) => fmtBool(r.autoRenew) },
            { header: 'Notice', flex: 0.9, extract: (r) => fmtNumber(r.noticePeriodDays) },
            { header: 'Deadline', flex: 1, extract: (r) => fmtNumber(r.daysToNoticeDeadline) },
            { header: 'Leverage read', flex: 3.6, extract: buildTimingRead },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>Usage and value leakage</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.8, extract: (r) => r.vendor },
            { header: 'Utilization', flex: 1.1, extract: (r) => fmtPct(r.utilizationRate) },
            { header: 'Shelfware', flex: 1.3, extract: (r) => fmtOptionalUsd(r.estimatedShelfwareUsd) },
            { header: 'Usage/value read', flex: 4.8, extract: buildUsageRead },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>Spend and uplift bridge</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.8, extract: (r) => r.vendor },
            { header: 'Annual', flex: 1.1, extract: (r) => fmtUsd(r.annualSpendUsd) },
            { header: 'Benchmark', flex: 1.2, extract: (r) => fmtOptionalUsd(r.benchmarkUsd) },
            { header: 'Uplift', flex: 1.2, extract: (r) => fmtOptionalUsd(r.overspendVsBenchmarkUsd) },
            { header: 'Spend read', flex: 4.7, extract: buildSpendRead },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>Overlap, risk and executive challenge</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.5, extract: (r) => r.vendor },
            { header: 'Overlap', flex: 2.5, extract: (r) => r.overlapRead ?? SEED_GAP_LINE },
            { header: 'Risk', flex: 2.6, extract: (r) => r.riskRead ?? SEED_GAP_LINE },
            { header: 'Challenge', flex: 2.4, extract: buildExecutiveChallenge },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>Negotiation posture</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.4, extract: (r) => r.vendor },
            { header: 'Posture', flex: 1.1, extract: (r) => r.posture },
            { header: 'Stance', flex: 3.2, extract: (r) => r.negotiationPosture ?? SEED_GAP_LINE },
            { header: 'BATNA', flex: 1.7, extract: (r) => r.topAlternative },
            { header: 'Give/get', flex: 2.6, extract: buildGiveGet },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
        />
        <StructuredPdfHeading>SRM / Tower handoff</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.5, extract: (r) => r.vendor },
            { header: 'Owner', flex: 1.5, extract: (r) => r.owner ?? SEED_GAP_LINE },
            { header: 'SRM / Tower action', flex: 4.5, extract: (r) => r.srmAction ?? SEED_GAP_LINE },
            { header: 'Decision record', flex: 2.5, extract: (r) => `Record final posture, target, terms and follow-up metric for ${r.vendor}.` },
          ]}
          rows={payload.candidates}
          emptyLabel={SEED_GAP_LINE}
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
  let noticeAtRisk = 0;
  let seedGaps = 0;
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
    if (c.daysToNoticeDeadline == null || c.daysToNoticeDeadline < 30) noticeAtRisk += 1;
    if (c.utilizationRate == null) seedGaps += 1;
    if (c.benchmarkUsd == null) seedGaps += 1;
    if (!c.owner) seedGaps += 1;
    byPosture[c.posture] = (byPosture[c.posture] ?? 0) + 1;
  }
  return { spend, imminent, noticeAtRisk, seedGaps, byPosture };
}

function buildExecutiveAnswer(payload: RenewalDecisionPayload): string {
  const priority = payload.candidates.find((c) => c.posture !== 'renew_as_is') ?? payload.candidates[0];
  if (!priority) return 'No renewal candidates recorded; load vendor_contracts before presenting a decision.';
  return `${priority.vendor}: ${priority.posture}. ${priority.rationale}`;
}

function buildExecutiveAction(payload: RenewalDecisionPayload): string {
  const priority = payload.candidates.find((c) => c.posture !== 'renew_as_is') ?? payload.candidates[0];
  return priority?.srmAction ?? 'Assign sourcing owner and generate SRM/Tower watch item.';
}

function buildTimingRead(c: RenewalDecisionPayload['candidates'][number]): string {
  const notice = c.daysToNoticeDeadline == null ? 'notice deadline not recorded' : `${c.daysToNoticeDeadline} days to notice deadline`;
  const auto = c.autoRenew == null ? 'auto-renewal term not recorded' : c.autoRenew ? 'auto-renewal applies' : 'no auto-renewal recorded';
  return `${c.daysUntilRenewal || 'Unknown'} days to renewal; ${auto}; ${notice}.`;
}

function buildUsageRead(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.utilizationRate == null && c.estimatedShelfwareUsd == null) {
    return 'Usage telemetry not recorded. Cannot quantify shelfware or adoption leakage.';
  }
  return `Utilization ${fmtPct(c.utilizationRate)}; estimated avoidable spend ${fmtOptionalUsd(c.estimatedShelfwareUsd)}.`;
}

function buildSpendRead(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.benchmarkUsd == null && c.overspendVsBenchmarkUsd == null) {
    return 'Benchmark not recorded. Use Source should-cost or client rate card before approving renewal economics.';
  }
  return `Annual spend ${fmtUsd(c.annualSpendUsd)} versus benchmark ${fmtOptionalUsd(c.benchmarkUsd)}; uplift / overspend ${fmtOptionalUsd(c.overspendVsBenchmarkUsd)}.`;
}

function buildExecutiveChallenge(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.posture === 'renew_as_is') return 'Why renew without competitive tension or usage evidence?';
  if (c.posture === 'rebid') return 'Can the business absorb transition risk before term end?';
  if (c.posture === 'exit') return 'Is there a funded transition path before service dependency breaks?';
  if (c.posture === 'consolidate') return 'Will consolidation create unacceptable vendor concentration?';
  if (c.posture === 'undetermined') return 'Do not decide until required substrate is recorded.';
  return 'What concession, benchmark or contract term must change before renewal is acceptable?';
}

function buildGiveGet(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.posture === 'renegotiate') return 'Give term only after price/terms improve. Get price protection, usage true-up, exit rights and AI/data clauses.';
  if (c.posture === 'rebid') return 'Use incumbent as baseline only; require challenger proof, transition plan and commercial walk-away.';
  if (c.posture === 'renew_as_is') return 'Limit give to administrative renewal; keep benchmark and usage review in SRM.';
  if (c.posture === 'consolidate') return 'Trade volume commitment for SKU rationalization, governance and measurable savings.';
  if (c.posture === 'exit') return 'No concession unless exit risk exceeds commercial value; preserve service continuity.';
  return SEED_GAP_LINE;
}
