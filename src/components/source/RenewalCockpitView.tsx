// Renewal Cockpit surface — the per-renewal decision view.
//
// The headline is the recommended posture; everything below it is the
// evidence behind that call: current spend, term & timing + auto-renewal
// risk, usage/shelfware, should-cost benchmark, incumbent leverage, and
// alternatives. Progressive disclosure: the posture answers first, the
// reasoning sits beneath. Locked design system.

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  RenewalCockpit,
  RenewalPosture,
} from '@/lib/source/renewal-cockpit/cockpit';
import { RenewalCockpitActionBar } from './RenewalCockpitActionBar';

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const POSTURE_META: Record<
  RenewalPosture,
  { bg: string; line: string; text: string }
> = {
  renew: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  renegotiate: { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  rebid: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  consolidate: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  exit: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
};

function formatUsd(value: number | null): string {
  if (value === null) return 'not priced';
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        color: SHELL.INK_MUTED,
      }}
    >
      {children}
    </span>
  );
}

function EvidenceCard({
  label,
  headline,
  body,
  children,
}: {
  label: string;
  headline: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <section style={CARD}>
      <SectionLabel>{label}</SectionLabel>
      <h3
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 'normal',
          fontSize: 16,
          color: SHELL.INK,
          margin: 0,
        }}
      >
        {headline}
      </h3>
      <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.5 }}>
        {body}
      </p>
      {children}
    </section>
  );
}

export function RenewalCockpitView({ cockpit }: { cockpit: RenewalCockpit }) {
  const posture = POSTURE_META[cockpit.recommendedPosture];
  const sc = cockpit.shouldCost;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Link
          href="/source/queue"
          style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, textDecoration: 'none' }}
        >
          ← Decision Queue
        </Link>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: SHELL.INK_MUTED,
          }}
        >
          Source · Renewal Cockpit
        </span>
        <h1 style={{ fontFamily: SHELL.SERIF, fontWeight: 'normal', fontSize: 26, color: SHELL.INK, margin: 0 }}>
          {cockpit.vendorName} — {cockpit.product}
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0 }}>
          Current annual spend {formatUsd(cockpit.currentAnnualSpendUsd)}.
        </p>
      </header>

      {/* THE HEADLINE — recommended posture */}
      <section
        style={{
          ...CARD,
          background: posture.bg,
          border: '1px solid ' + posture.line,
          gap: 10,
        }}
      >
        <SectionLabel>Recommended posture</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontWeight: 'normal',
              fontSize: 30,
              color: posture.text,
            }}
          >
            {cockpit.postureLabel}
          </span>
        </div>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_MID, margin: 0, lineHeight: 1.55 }}>
          {cockpit.postureRationale}
        </p>
      </section>

      {/* THE ACTION BAR — let the VP act, not just read (Practitioner-Fit §2) */}
      <RenewalCockpitActionBar cockpit={cockpit} />

      {/* Evidence behind the posture */}
      <EvidenceCard
        label="Term & timing · auto-renewal risk"
        headline={
          cockpit.timing.noticeWindowAtRisk
            ? 'Notice window is closing'
            : cockpit.timing.autoRenew
              ? 'Auto-renewing contract'
              : 'Standard renewal'
        }
        body={cockpit.timing.summary}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
          <Metric label="Term end" value={cockpit.timing.termEndDate ?? '—'} />
          <Metric
            label="Days to term end"
            value={cockpit.timing.daysToTermEnd === null ? '—' : String(cockpit.timing.daysToTermEnd)}
          />
          <Metric label="Auto-renew" value={cockpit.timing.autoRenew ? 'Yes' : 'No'} />
          <Metric
            label="Days to notice deadline"
            value={
              cockpit.timing.daysToNoticeDeadline === null
                ? '—'
                : String(cockpit.timing.daysToNoticeDeadline)
            }
          />
        </div>
      </EvidenceCard>

      <EvidenceCard
        label="Usage · adoption · shelfware"
        headline={
          cockpit.usage.utilizationRate === null
            ? 'Utilization not measured'
            : `${Math.round(cockpit.usage.utilizationRate * 100)}% utilized`
        }
        body={cockpit.usage.summary}
      />

      <EvidenceCard
        label="Should-cost benchmark"
        headline={
          sc.benchmarkUsd !== null
            ? `Benchmark ${formatUsd(sc.benchmarkUsd)}/yr`
            : 'Should-cost iceberg framing'
        }
        body={sc.summary}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
          <Metric label="Should-cost low" value={formatUsd(sc.estimate.totalLow)} />
          <Metric label="Should-cost high" value={formatUsd(sc.estimate.totalHigh)} />
          {sc.overspendVsBenchmarkUsd !== null ? (
            <Metric
              label="Vs benchmark"
              value={
                sc.overspendVsBenchmarkUsd > 0
                  ? `+${formatUsd(sc.overspendVsBenchmarkUsd)}`
                  : formatUsd(sc.overspendVsBenchmarkUsd)
              }
            />
          ) : null}
        </div>
      </EvidenceCard>

      <EvidenceCard
        label="Incumbent leverage"
        headline={
          cockpit.leverage.leverageHolder === 'buyer'
            ? 'Leverage sits with the buyer'
            : cockpit.leverage.leverageHolder === 'vendor'
              ? 'Leverage sits with the vendor'
              : 'Leverage is balanced'
        }
        body={cockpit.leverage.assessment}
      >
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_MID,
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}
        >
          <strong>Play:</strong> {cockpit.leverage.recommendedPlay}
        </p>
      </EvidenceCard>

      <section style={CARD}>
        <SectionLabel>Alternatives</SectionLabel>
        {cockpit.alternatives.length === 0 ? (
          <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0 }}>
            No deal-ready alternative is scouted. Without competitive tension the
            incumbent holds the price; scouting one alternative materially shifts leverage.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cockpit.alternatives.map((alt) => (
              <li
                key={alt.vendorName}
                style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MID, lineHeight: 1.5 }}
              >
                <strong>{alt.vendorName}</strong>
                {alt.indicativeAnnualUsd !== null ? ` — ${formatUsd(alt.indicativeAnnualUsd)}/yr` : ''}
                . {alt.switchingNote}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
