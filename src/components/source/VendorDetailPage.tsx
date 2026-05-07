import type { CSSProperties } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { VendorDetail } from '@/lib/source/vendor-detail';
import { formatUsdM, riskLevelLabel, riskLevelColor } from '@/lib/source/vendor-detail';

/**
 * VendorDetailPage — T10 Vendor detail
 *
 * Layout:
 *   1. Vendor head strip (name, profile, status chip + CTA)
 *   2. 3-column KV grid: response completeness / pricing normalized / risk posture
 *   3. Scorecard rows table (Step 5 scores)
 *   4. BAFO history panel (Step 7 rounds)
 */

// ─── Style tokens ─────────────────────────────────────────────────────────────

const PAGE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  color: SHELL.INK,
};

const VENDOR_HEAD: CSSProperties = {
  padding: '18px 22px 16px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
};

const VENDOR_NAME: CSSProperties = {
  fontFamily: "'Georgia', serif",
  fontSize: 22,
  fontWeight: 400,
  color: SHELL.INK,
  letterSpacing: '-0.3px',
  marginBottom: 4,
};

const VENDOR_META: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const CONTENT: CSSProperties = {
  padding: '18px 22px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const THREE_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

const KV_SECTION: CSSProperties = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const SECTION_TITLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  paddingBottom: 6,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
};

const KV_ROW: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 8,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
};

const KV_KEY: CSSProperties = {
  color: SHELL.INK_MUTED,
  flexShrink: 0,
};

const KV_VAL: CSSProperties = {
  fontWeight: 700,
  color: SHELL.INK,
  textAlign: 'right',
};

const PANEL: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  overflow: 'hidden',
};

const PANEL_HEAD: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '10px 14px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
};

const PANEL_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
};

const TH: CSSProperties = {
  padding: '7px 12px',
  textAlign: 'left',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
  fontWeight: 500,
};

const TD: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  color: SHELL.INK,
  verticalAlign: 'middle',
};

const TD_NUM: CSSProperties = {
  ...TD,
  textAlign: 'right',
  fontFamily: SHELL.MONO,
  fontSize: 12,
};

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ rank, status }: { rank?: number; status: VendorDetail['status'] }) {
  const isFinalist = status === 'finalist' || status === 'invited-bafo';
  const bg = isFinalist
    ? 'rgba(29,158,117,0.12)'
    : status === 'shortlisted'
    ? 'rgba(186,117,23,0.10)'
    : 'rgba(140,140,140,0.10)';
  const color = isFinalist ? '#1d9e75' : status === 'shortlisted' ? '#ba7517' : SHELL.INK_MUTED;
  const label = rank ? `Finalist · #${rank}` : status === 'shortlisted' ? 'Shortlisted' : 'Declined';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        color,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: '4px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {isFinalist && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      )}
      {label}
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#1d9e75' : score >= 70 ? '#ba7517' : '#c0392b';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-block',
          width: 72,
          height: 5,
          background: SHELL.PAPER_DEEP,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
          }}
        />
      </span>
      <span style={{ fontFamily: SHELL.MONO, fontSize: 11, fontWeight: 700, color: SHELL.INK }}>
        {score}
      </span>
    </span>
  );
}

// ─── Trap badge ───────────────────────────────────────────────────────────────

function TrapBadge({ severity }: { severity: 'P0' | 'P1' | 'P2' }) {
  const colors = {
    P0: { bg: 'rgba(163,45,45,0.10)', color: '#a32d2d', border: 'rgba(163,45,45,0.25)' },
    P1: { bg: 'rgba(186,117,23,0.10)', color: '#ba7517', border: 'rgba(186,117,23,0.25)' },
    P2: { bg: SHELL.PAPER_SOFT, color: SHELL.INK_MUTED, border: SHELL.CARD_LINE },
  };
  const c = colors[severity];
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: '2px 6px',
      }}
    >
      {severity}
    </span>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function KV({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={KV_ROW}>
      <span style={KV_KEY}>{label}</span>
      <span style={{ ...KV_VAL, color: valueColor ?? SHELL.INK }}>{value}</span>
    </div>
  );
}

function ResponseCompletenessSection({ vendor }: { vendor: VendorDetail }) {
  return (
    <div style={KV_SECTION}>
      <div style={SECTION_TITLE}>Response completeness · Step 4</div>
      <KV label="Response received" value={vendor.responseReceivedAt ?? '—'} />
      <KV
        label="Mandatory items"
        value={`${vendor.mandatoryItemsComplete ?? 0} / ${vendor.mandatoryItemsTotal ?? 0}`}
        valueColor={
          vendor.mandatoryItemsComplete === vendor.mandatoryItemsTotal ? '#1d9e75' : '#ba7517'
        }
      />
      <KV
        label="Optional items"
        value={`${vendor.optionalItemsComplete ?? 0} / ${vendor.optionalItemsTotal ?? 0}`}
      />
      <KV
        label="Clarifications resolved"
        value={`${vendor.clarificationsResolved ?? 0} / ${vendor.clarificationsTotal ?? 0}`}
      />
    </div>
  );
}

function PricingSection({ vendor }: { vendor: VendorDetail }) {
  const delta = vendor.listTcoUsd && vendor.normalizedTcoUsd
    ? Math.round(((vendor.normalizedTcoUsd - vendor.listTcoUsd) / vendor.listTcoUsd) * 100)
    : null;
  const trapCount = vendor.openTraps?.length ?? 0;

  return (
    <div style={KV_SECTION}>
      <div style={SECTION_TITLE}>Pricing · Step 6 · normalized</div>
      {vendor.listTcoUsd ? (
        <KV label="List 5-yr TCO" value={formatUsdM(vendor.listTcoUsd)} />
      ) : null}
      {vendor.normalizedTcoUsd ? (
        <KV label="Normalized 5-yr TCO" value={formatUsdM(vendor.normalizedTcoUsd)} />
      ) : null}
      {delta !== null ? (
        <KV label="Δ vs. list" value={`+${delta}%`} valueColor="#c0392b" />
      ) : null}
      {trapCount > 0 ? (
        <KV
          label="Open traps"
          value={`${trapCount} trap${trapCount > 1 ? 's' : ''}`}
          valueColor="#c0392b"
        />
      ) : (
        <KV label="Open traps" value="None" valueColor="#1d9e75" />
      )}
    </div>
  );
}

function RiskPostureSection({ vendor }: { vendor: VendorDetail }) {
  return (
    <div style={KV_SECTION}>
      <div style={SECTION_TITLE}>Risk posture · Sentinel</div>
      {vendor.riskFinancial ? (
        <KV
          label="Financial"
          value={riskLevelLabel(vendor.riskFinancial)}
          valueColor={riskLevelColor(vendor.riskFinancial)}
        />
      ) : null}
      {vendor.riskSecurity ? (
        <KV
          label="Security"
          value={riskLevelLabel(vendor.riskSecurity)}
          valueColor={riskLevelColor(vendor.riskSecurity)}
        />
      ) : null}
      {vendor.riskConcentration ? (
        <KV
          label="Concentration"
          value={riskLevelLabel(vendor.riskConcentration)}
          valueColor={riskLevelColor(vendor.riskConcentration)}
        />
      ) : null}
      {vendor.riskGeopolitical ? (
        <KV
          label="Geopolitical"
          value={riskLevelLabel(vendor.riskGeopolitical)}
          valueColor={riskLevelColor(vendor.riskGeopolitical)}
        />
      ) : null}
    </div>
  );
}

function ScorecardPanel({ vendor, eventId }: { vendor: VendorDetail; eventId: string }) {
  const rows = vendor.scorecardRows;
  if (!rows || rows.length === 0) return null;

  return (
    <div style={PANEL}>
      <div style={PANEL_HEAD}>
        <div style={PANEL_EYEBROW}>Scorecard rows · Step 5</div>
        <Link
          href={`/source/events/${eventId}/scorecard`}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: '#1a3a6c',
            textDecoration: 'underline',
            letterSpacing: '0.08em',
          }}
        >
          Back to evaluation matrix ↗
        </Link>
      </div>
      <table style={TABLE}>
        <thead>
          <tr>
            {['Criterion', 'Score', 'Weight', 'Weighted', 'Rater 1', 'Rater 2', 'Deviation'].map((h) => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.criterion}>
              <td style={{ ...TD, fontWeight: 700 }}>{row.criterion}</td>
              <td style={TD}><ScoreBar score={row.score} /></td>
              <td style={TD_NUM}>{row.weight}%</td>
              <td style={TD_NUM}>{row.weighted.toFixed(1)}</td>
              <td style={TD_NUM}>{row.rater1}</td>
              <td style={TD_NUM}>{row.rater2}</td>
              <td style={TD_NUM}>{row.deviation}</td>
            </tr>
          ))}
          {/* Weighted total row */}
          <tr style={{ background: SHELL.PAPER_SOFT }}>
            <td style={{ ...TD, fontWeight: 700 }} colSpan={3}>
              Final weighted
            </td>
            <td style={{ ...TD_NUM, fontWeight: 800, fontSize: 13 }}>
              {vendor.scorecardWeightedTotal?.toFixed(1) ?? '—'}
            </td>
            <td colSpan={3} style={{ ...TD, fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', color: vendor.rank === 1 ? '#1d9e75' : SHELL.INK_MUTED }}>
              {vendor.rank ? `RANK #${vendor.rank}` : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BafoHistoryPanel({ vendor }: { vendor: VendorDetail }) {
  const history = vendor.bafoHistory;
  if (!history || history.length === 0) return null;

  return (
    <div style={PANEL}>
      <div style={PANEL_HEAD}>
        <div style={PANEL_EYEBROW}>BAFO history · Step 7 · {history.length} round{history.length > 1 ? 's' : ''}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px' }}>
        {history.map((round) => {
          const statusColor =
            round.status === 'signed' ? '#1d9e75' : round.status === 'closed' ? SHELL.INK_MUTED : '#ba7517';
          const statusLabel =
            round.status === 'signed' ? `SIGNED · ${round.closedAt ?? ''}` : round.status === 'closed' ? `CLOSED · ${round.closedAt ?? ''}` : 'OPEN';

          return (
            <div
              key={round.round}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 130px',
                gap: 12,
                padding: '10px 14px',
                background: SHELL.PAPER_SOFT,
                borderRadius: 7,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: SHELL.INK,
                }}
              >
                ROUND {round.round}
              </span>
              <span style={{ fontFamily: SHELL.SANS, lineHeight: 1.5, color: SHELL.INK }}>
                {round.description}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  color: statusColor,
                  textAlign: 'right',
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingTrapList({ vendor }: { vendor: VendorDetail }) {
  const traps = vendor.openTraps;
  if (!traps || traps.length === 0) return null;

  return (
    <div style={PANEL}>
      <div style={PANEL_HEAD}>
        <div style={PANEL_EYEBROW}>Pricing traps · {traps.length} item{traps.length > 1 ? 's' : ''}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {traps.map((trap, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '9px 14px',
              borderBottom: i < traps.length - 1 ? '1px solid ' + SHELL.CARD_LINE : 'none',
            }}
          >
            <TrapBadge severity={trap.severity} />
            <span style={{ fontFamily: SHELL.SANS, fontSize: 12.5, lineHeight: 1.5, color: SHELL.INK }}>
              {trap.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VendorDetailPage({
  vendor,
  eventId,
  eventName,
}: {
  vendor: VendorDetail;
  eventId: string;
  eventName: string;
}) {
  const profileParts = [
    vendor.exchange && vendor.ticker ? `${vendor.exchange}:${vendor.ticker}` : null,
    vendor.hq ? `HQ ${vendor.hq}` : null,
    vendor.employees ? `${vendor.employees} employees` : null,
    vendor.trackRecord ?? null,
  ].filter(Boolean);

  return (
    <article style={PAGE}>
      {/* ── Vendor head strip ── */}
      <div style={VENDOR_HEAD}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link
              href={`/source/events/${eventId}`}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                textDecoration: 'none',
              }}
            >
              Source › {eventName} › Vendors
            </Link>
          </div>
          <div style={VENDOR_NAME}>{vendor.name}</div>
          {profileParts.length > 0 && (
            <div style={VENDOR_META}>{profileParts.join(' · ')}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <StatusChip rank={vendor.rank} status={vendor.status} />
          <Link
            href={`/source/events/${eventId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1B2B5C',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Back to event →
          </Link>
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={CONTENT}>
        {/* 3-column KV grid */}
        <div style={THREE_COL}>
          <ResponseCompletenessSection vendor={vendor} />
          <PricingSection vendor={vendor} />
          <RiskPostureSection vendor={vendor} />
        </div>

        {/* Pricing traps */}
        <PricingTrapList vendor={vendor} />

        {/* Scorecard table */}
        <ScorecardPanel vendor={vendor} eventId={eventId} />

        {/* BAFO history */}
        <BafoHistoryPanel vendor={vendor} />
      </div>
    </article>
  );
}
