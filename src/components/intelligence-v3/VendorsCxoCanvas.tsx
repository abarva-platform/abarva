'use client';

// Intelligence v3 · Vendors (CXO mode · PR-K2.4).
//
// 3 views: Renewal cards (default) · Timeline · Risk quadrant.
// Reads as the vendor portfolio actually is: Innovaccer at risk,
// Epic with thin negotiation leverage, Abridge promising challenger,
// Hippocratic emerging.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import {
  MERIDIAN_VENDOR_RENEWALS,
  MERIDIAN_VENDOR_WATCH,
  type VendorHealth,
  type VendorRenewalRow,
  type VendorTier,
  type VendorWatchRow,
} from './cxo-fixtures';

type VendorsView = 'renewal' | 'timeline' | 'quadrant';

const VIEWS: ReadonlyArray<{ key: VendorsView; label: string }> = [
  { key: 'renewal', label: 'Renewal' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'quadrant', label: 'Risk quadrant' },
];

const HEALTH_TONE: Record<
  VendorHealth,
  { accent: string; chip: string; chipText: string; label: string }
> = {
  healthy: { accent: '#0E8C7E', chip: 'rgba(14,140,126,0.12)', chipText: '#0E8C7E', label: 'Healthy' },
  watch: { accent: '#C8881C', chip: 'rgba(200,136,28,0.14)', chipText: '#C8881C', label: 'Watch' },
  risk: { accent: '#B8443A', chip: 'rgba(184,68,58,0.12)', chipText: '#B8443A', label: 'At risk' },
};

const TIER_LABEL: Record<VendorTier, string> = {
  incumbent: 'Incumbent',
  challenger: 'Challenger',
  emerging: 'Emerging',
};

interface Props {
  renewals?: ReadonlyArray<VendorRenewalRow>;
  watch?: ReadonlyArray<VendorWatchRow>;
}

export function VendorsCxoCanvas({
  renewals = MERIDIAN_VENDOR_RENEWALS,
  watch = MERIDIAN_VENDOR_WATCH,
}: Props) {
  const [view, setView] = useState<VendorsView>('renewal');

  return (
    <section data-canvas="vendors" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Vendors</span>
          </>
        }
        title="What's the vendor portfolio · what's renewing · what's at risk?"
        lead="Renewal pressure first. Then the watch list — disruptors moving in your category. Risk-quadrant view shows where leverage is thinnest."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>{renewals.length}</strong> active renewals ·{' '}
            <strong style={{ color: COLORS.ink }}>
              {renewals.filter((r) => r.health === 'risk').length}
            </strong>{' '}
            at risk · <strong style={{ color: COLORS.ink }}>{watch.length}</strong> on watch
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'renewal' && <RenewalView renewals={renewals} watch={watch} />}
      {view === 'timeline' && <TimelineView renewals={renewals} />}
      {view === 'quadrant' && <QuadrantView renewals={renewals} />}
    </section>
  );
}

function RenewalView({
  renewals,
  watch,
}: {
  renewals: ReadonlyArray<VendorRenewalRow>;
  watch: ReadonlyArray<VendorWatchRow>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div>
        <SectionEyebrow>Active renewals</SectionEyebrow>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: SPACING.md,
          }}
        >
          {renewals.map((r) => (
            <RenewalCard key={r.vendor} row={r} />
          ))}
        </div>
      </div>

      <div>
        <SectionEyebrow>Watch list · disruptors in your categories</SectionEyebrow>
        <div
          style={{
            background: COLORS.card,
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            overflow: 'hidden',
          }}
        >
          {watch.map((w, i) => (
            <div
              key={w.vendor}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 240px 1fr',
                gap: SPACING.md,
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderBottom: i === watch.length - 1 ? 'none' : BORDER.hairlineSoft,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {w.vendor}
              </div>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10.5,
                  letterSpacing: '0.06em',
                  color: COLORS.muted,
                }}
              >
                {w.category}
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.body }}>{w.signal}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RenewalCard({ row }: { row: VendorRenewalRow }) {
  const tone = HEALTH_TONE[row.health];
  return (
    <article
      style={{
        background: COLORS.card,
        border: `1px solid ${tone.accent}`,
        borderTop: `3px solid ${tone.accent}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: SPACING.xs,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              marginBottom: 4,
            }}
          >
            {TIER_LABEL[row.tier]} · {row.category}
          </div>
          <h3
            style={{
              fontFamily: FONT.display,
              fontSize: 20,
              fontWeight: 400,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {row.vendor}
          </h3>
        </div>
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 11,
            fontWeight: 600,
            color: tone.chipText,
            background: tone.chip,
            padding: '4px 10px',
            borderRadius: RADIUS.pill,
          }}
        >
          {tone.label}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.sm,
          padding: `${SPACING.xs}px 0`,
          borderTop: BORDER.hairlineSoft,
          borderBottom: BORDER.hairlineSoft,
          marginBottom: SPACING.xs,
        }}
      >
        <Stat eyebrow="Spend" value={row.spend} />
        <Stat eyebrow="Renews in" value={row.renewsIn} />
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: COLORS.body,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {row.takeaway}
      </p>
    </article>
  );
}

function Stat({ eyebrow, value }: { eyebrow: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 14,
          fontWeight: 600,
          color: COLORS.ink,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TimelineView({ renewals }: { renewals: ReadonlyArray<VendorRenewalRow> }) {
  // Parse "8 mo" / "11 mo" / "n/a" into months for timeline placement.
  const months = renewals
    .map((r) => ({ row: r, m: parseMonths(r.renewsIn) }))
    .filter((x) => x.m !== null) as Array<{ row: VendorRenewalRow; m: number }>;
  const max = Math.max(...months.map((x) => x.m), 18);

  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 24,
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 4,
          marginBottom: SPACING.md,
        }}
      >
        {[3, 6, 9, 12, 15].map((m) => (
          <span
            key={m}
            style={{
              position: 'absolute',
              left: `${(m / max) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: COLORS.border,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: SPACING.lg,
          fontFamily: FONT.mono,
          fontSize: 9.5,
          letterSpacing: '0.12em',
          color: COLORS.muted,
        }}
      >
        <span>NOW</span>
        <span>3 mo</span>
        <span>6 mo</span>
        <span>9 mo</span>
        <span>12 mo</span>
        <span>15 mo</span>
        <span>{max}+ mo</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {months.map(({ row, m }) => {
          const tone = HEALTH_TONE[row.health];
          return (
            <div key={row.vendor} style={{ position: 'relative', height: 32 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${(m / max) * 100}%`,
                  background: `linear-gradient(to right, transparent, ${tone.accent}55)`,
                  borderRadius: 4,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: `${(m / max) * 100}%`,
                  top: '50%',
                  transform: 'translateY(-50%) translateX(-100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingRight: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.vendor}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tone.accent,
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseMonths(label: string): number | null {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1]!, 10) : null;
}

function QuadrantView({ renewals }: { renewals: ReadonlyArray<VendorRenewalRow> }) {
  // X axis: leverage (incumbent low, emerging high). Y axis: health
  // (risk low, healthy high). Approximates the wireframe risk quadrant.
  const positionFor = (r: VendorRenewalRow) => {
    const x = r.tier === 'incumbent' ? 0.2 : r.tier === 'challenger' ? 0.55 : 0.85;
    const y = r.health === 'risk' ? 0.2 : r.health === 'watch' ? 0.55 : 0.85;
    return { x, y };
  };
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
        position: 'relative',
        height: 360,
      }}
    >
      {/* axes */}
      <span
        style={{
          position: 'absolute',
          left: SPACING.xl,
          right: SPACING.xl,
          top: '50%',
          height: 1,
          background: COLORS.border,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: SPACING.xl,
          bottom: SPACING.xl,
          left: '50%',
          width: 1,
          background: COLORS.border,
        }}
      />
      {/* labels */}
      <Label x="50%" y={`${SPACING.xs}px`} text="HEALTHY" />
      <Label x="50%" y="calc(100% - 14px)" text="AT RISK" />
      <Label
        x={`${SPACING.xs}px`}
        y="50%"
        text="INCUMBENT"
        rotate={-90}
        anchor="start"
      />
      <Label
        x="calc(100% - 14px)"
        y="50%"
        text="EMERGING"
        rotate={90}
        anchor="end"
      />

      {renewals.map((r) => {
        const pos = positionFor(r);
        const tone = HEALTH_TONE[r.health];
        return (
          <div
            key={r.vendor}
            style={{
              position: 'absolute',
              left: `${pos.x * 100}%`,
              top: `${(1 - pos.y) * 100}%`,
              transform: 'translate(-50%, -50%)',
              padding: '6px 10px',
              borderRadius: RADIUS.pill,
              background: '#fff',
              border: `2px solid ${tone.accent}`,
              fontFamily: FONT.body,
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.ink,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {r.vendor}
          </div>
        );
      })}
    </div>
  );
}

function Label({
  x,
  y,
  text,
  rotate,
  anchor,
}: {
  x: string;
  y: string;
  text: string;
  rotate?: number;
  anchor?: 'start' | 'end';
}) {
  return (
    <span
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${anchor === 'end' ? '-100%' : anchor === 'start' ? '0' : '-50%'}, -50%) ${rotate ? `rotate(${rotate}deg)` : ''}`,
        fontFamily: FONT.mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: COLORS.mutedSoft,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        marginBottom: SPACING.sm,
      }}
    >
      {children}
    </div>
  );
}
