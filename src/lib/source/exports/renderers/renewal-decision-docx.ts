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
              'Methodology §3 Stage 7: every renewal candidate carries an explicit posture (renew / renegotiate / rebid / consolidate / exit). Auto-renewal is not a posture. This document is the executive share rendering: answer first, then timing, usage, spend, risk, negotiation posture and SRM/Tower handoff.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),

          heading2('Executive answer'),
          buildKeyValueTable({
            rows: [
              { label: 'Recommended decision', value: buildExecutiveAnswer(payload) },
              { label: 'Value at stake', value: `${fmtUsd(totals.spend)} annual spend under review` },
              { label: 'Urgency', value: `${totals.imminent} renewal(s) inside 90 days; ${totals.noticeAtRisk} notice deadline(s) at risk or not recorded` },
              { label: 'Hard blocker', value: totals.seedGaps > 0 ? `${totals.seedGaps} required field(s) not recorded` : 'No hard blocker in the artifact payload' },
              { label: 'Required executive action', value: buildExecutiveAction(payload) },
            ],
            labelWidth: 35,
          }),

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

          heading2('Timing and leverage'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 18, extract: (r) => r.vendor },
              { header: 'Renewal', widthPercent: 13, extract: (r) => r.renewalDate },
              { header: 'Auto-renews?', widthPercent: 12, extract: (r) => fmtBool(r.autoRenew) },
              { header: 'Notice days', widthPercent: 12, extract: (r) => fmtNumber(r.noticePeriodDays) },
              { header: 'Days to notice', widthPercent: 13, extract: (r) => fmtNumber(r.daysToNoticeDeadline) },
              { header: 'Leverage read', widthPercent: 32, extract: buildTimingRead },
            ],
            rows: payload.candidates,
          }),

          heading2('Usage and value leakage'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 20, extract: (r) => r.vendor },
              { header: 'Utilization', widthPercent: 14, extract: (r) => fmtPct(r.utilizationRate) },
              { header: 'Shelfware', widthPercent: 16, extract: (r) => fmtOptionalUsd(r.estimatedShelfwareUsd) },
              { header: 'Usage/value read', widthPercent: 50, extract: buildUsageRead },
            ],
            rows: payload.candidates,
          }),

          heading2('Spend and uplift bridge'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 20, extract: (r) => r.vendor },
              { header: 'Annual', widthPercent: 14, extract: (r) => fmtUsd(r.annualSpendUsd) },
              { header: 'Benchmark', widthPercent: 14, extract: (r) => fmtOptionalUsd(r.benchmarkUsd) },
              { header: 'Uplift / overspend', widthPercent: 16, extract: (r) => fmtOptionalUsd(r.overspendVsBenchmarkUsd) },
              { header: 'Spend read', widthPercent: 36, extract: buildSpendRead },
            ],
            rows: payload.candidates,
          }),

          heading2('Overlap, risk and executive challenge'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 18, extract: (r) => r.vendor },
              { header: 'Overlap / rationalization', widthPercent: 30, extract: (r) => r.overlapRead ?? SEED_GAP_LINE },
              { header: 'Risk read', widthPercent: 30, extract: (r) => r.riskRead ?? SEED_GAP_LINE },
              { header: 'Executive challenge', widthPercent: 22, extract: buildExecutiveChallenge },
            ],
            rows: payload.candidates,
          }),

          heading2('Negotiation posture'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 18, extract: (r) => r.vendor },
              { header: 'Posture', widthPercent: 14, extract: (r) => r.posture },
              { header: 'Stance', widthPercent: 36, extract: (r) => r.negotiationPosture ?? SEED_GAP_LINE },
              { header: 'BATNA / alternative', widthPercent: 16, extract: (r) => r.topAlternative },
              { header: 'Give / get', widthPercent: 16, extract: buildGiveGet },
            ],
            rows: payload.candidates,
          }),

          heading2('SRM / Tower handoff'),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 18, extract: (r) => r.vendor },
              { header: 'Owner', widthPercent: 18, extract: (r) => r.owner ?? SEED_GAP_LINE },
              { header: 'SRM / Tower action', widthPercent: 40, extract: (r) => r.srmAction ?? SEED_GAP_LINE },
              { header: 'Decision record', widthPercent: 24, extract: (r) => `Record final posture, target, terms and follow-up metric for ${r.vendor}.` },
            ],
            rows: payload.candidates,
          }),

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
