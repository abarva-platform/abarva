'use client';

// Intelligence v3 · Vendors (CXO mode · PR-K2.5).
//
// CIO-quality canvas: leads with IT spend by category
// (Hardware/Cloud · Software/SaaS · Services/SI), drills into top
// vendors per category, then offers renewal calendar and risk
// quadrant as secondary views.

import { useMemo, useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import {
  MERIDIAN_VENDOR_SPEND,
  VENDOR_CATEGORIES,
  type VendorCategory,
  type VendorHealth,
  type VendorSpendRow,
  type VendorTier,
} from './cxo-fixtures';

type VendorsView = 'spend' | 'renewals' | 'risk';

const VIEWS: ReadonlyArray<{ key: VendorsView; label: string }> = [
  { key: 'spend', label: 'By category' },
  { key: 'renewals', label: 'Renewal calendar' },
  { key: 'risk', label: 'Risk quadrant' },
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
  spend?: ReadonlyArray<VendorSpendRow>;
}

export function VendorsCxoCanvas({ spend = MERIDIAN_VENDOR_SPEND }: Props) {
  const [view, setView] = useState<VendorsView>('spend');

  const totals = useMemo(() => computeCategoryTotals(spend), [spend]);
  const totalSpendUsdM = totals.reduce((sum, c) => sum + c.totalUsdM, 0);
  const atRisk = spend.filter((v) => v.health === 'risk').length;
  const watchlist = spend.filter((v) => v.health === 'watch').length;

  return (
    <section data-canvas="vendors" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Vendors</span>
          </>
        }
        title="Where's IT spend going — and which vendors carry strategic risk?"
        lead="Annualized spend rolled up by category, then drill in to individuals. Renewal pressure and risk leverage land on the secondary views."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>${totalSpendUsdM.toFixed(1)}M</strong> annualized ·{' '}
            <strong style={{ color: COLORS.ink }}>{spend.length}</strong> vendors ·{' '}
            <strong style={{ color: COLORS.ink }}>{atRisk}</strong> at risk · {watchlist} on watch
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'spend' && <SpendView totals={totals} totalUsdM={totalSpendUsdM} />}
      {view === 'renewals' && <RenewalsView spend={spend} />}
      {view === 'risk' && <RiskQuadrantView spend={spend} />}
    </section>
  );
}

// ─── Aggregation ─────────────────────────────────────────────────

interface CategoryTotal {
  key: VendorCategory;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  totalUsdM: number;
  vendorCount: number;
  topVendors: ReadonlyArray<VendorSpendRow>;
  watchCount: number;
  riskCount: number;
}

function computeCategoryTotals(spend: ReadonlyArray<VendorSpendRow>): CategoryTotal[] {
  return VENDOR_CATEGORIES.map((cat) => {
    const inCat = spend.filter((v) => v.category === cat.key);
    const sorted = [...inCat].sort((a, b) => b.spendUsdM - a.spendUsdM);
    const total = sorted.reduce((sum, v) => sum + v.spendUsdM, 0);
    return {
      key: cat.key,
      label: cat.label,
      shortLabel: cat.shortLabel,
      description: cat.description,
      accent: cat.accent,
      totalUsdM: total,
      vendorCount: inCat.length,
      topVendors: sorted,
      watchCount: inCat.filter((v) => v.health === 'watch').length,
      riskCount: inCat.filter((v) => v.health === 'risk').length,
    };
  });
}

// ─── View 1 · By category (default · CIO read) ─────────────────

function SpendView({ totals, totalUsdM }: { totals: CategoryTotal[]; totalUsdM: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <SpendHero totals={totals} totalUsdM={totalUsdM} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: SPACING.md,
        }}
      >
        {totals.map((cat) => (
          <CategoryCard key={cat.key} cat={cat} totalUsdM={totalUsdM} />
        ))}
      </div>
    </div>
  );
}

function SpendHero({ totals, totalUsdM }: { totals: CategoryTotal[]; totalUsdM: number }) {
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
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: SPACING.xxl,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              marginBottom: 4,
            }}
          >
            Total annualized IT spend
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 42,
              fontWeight: 300,
              color: COLORS.ink,
              letterSpacing: '-0.022em',
              lineHeight: 1,
            }}
          >
            ${totalUsdM.toFixed(1)}M
          </div>
          <div
            style={{
              fontSize: 12,
              color: COLORS.muted,
              marginTop: 6,
            }}
          >
            FY26 run-rate · across {totals.reduce((s, c) => s + c.vendorCount, 0)} active vendors
          </div>
        </div>
        <div>
          {/* Stacked bar */}
          <div
            style={{
              display: 'flex',
              height: 28,
              borderRadius: 6,
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.04)',
              marginBottom: SPACING.xs,
            }}
          >
            {totals.map((cat) => {
              const pct = (cat.totalUsdM / totalUsdM) * 100;
              return (
                <div
                  key={cat.key}
                  title={`${cat.shortLabel} · $${cat.totalUsdM.toFixed(1)}M (${pct.toFixed(0)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: cat.accent,
                    borderRight: '1px solid rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  {pct >= 12 ? `${pct.toFixed(0)}%` : ''}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: SPACING.md,
            }}
          >
            {totals.map((cat) => (
              <div key={cat.key}>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: cat.accent,
                  }}
                >
                  {cat.shortLabel}
                </div>
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 18,
                    fontWeight: 400,
                    color: COLORS.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  ${cat.totalUsdM.toFixed(1)}M
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    letterSpacing: '0.02em',
                  }}
                >
                  {cat.vendorCount} vendors · {((cat.totalUsdM / totalUsdM) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ cat, totalUsdM }: { cat: CategoryTotal; totalUsdM: number }) {
  const pctOfTotal = (cat.totalUsdM / totalUsdM) * 100;
  return (
    <article
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderTop: `3px solid ${cat.accent}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: cat.accent,
          marginBottom: 6,
        }}
      >
        {cat.shortLabel}
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14, lineHeight: 1.5 }}>
        {cat.description}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.xs,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        <span
          style={{
            fontFamily: FONT.display,
            fontSize: 30,
            fontWeight: 400,
            color: COLORS.ink,
            letterSpacing: '-0.018em',
            lineHeight: 1,
          }}
        >
          ${cat.totalUsdM.toFixed(1)}M
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: COLORS.muted,
            letterSpacing: '0.04em',
          }}
        >
          {pctOfTotal.toFixed(0)}% · {cat.vendorCount} vendors
        </span>
      </div>

      {(cat.riskCount > 0 || cat.watchCount > 0) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {cat.riskCount > 0 && (
            <Pill tone={HEALTH_TONE.risk}>
              {cat.riskCount} at risk
            </Pill>
          )}
          {cat.watchCount > 0 && (
            <Pill tone={HEALTH_TONE.watch}>
              {cat.watchCount} on watch
            </Pill>
          )}
        </div>
      )}

      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: 6,
        }}
      >
        Top vendors
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
        {cat.topVendors.slice(0, 6).map((v) => (
          <VendorRow key={v.vendor} v={v} catTotalUsdM={cat.totalUsdM} />
        ))}
      </ul>
    </article>
  );
}

function VendorRow({ v, catTotalUsdM }: { v: VendorSpendRow; catTotalUsdM: number }) {
  const pct = (v.spendUsdM / catTotalUsdM) * 100;
  const tone = HEALTH_TONE[v.health];
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: SPACING.xs,
        padding: '8px 0',
        borderBottom: BORDER.hairlineSoft,
        alignItems: 'baseline',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.ink,
            }}
          >
            {v.vendor}
          </span>
          {v.health !== 'healthy' && (
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: tone.chipText,
                background: tone.chip,
                padding: '1px 6px',
                borderRadius: 3,
              }}
            >
              {tone.label}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: '0.04em',
          }}
        >
          {v.subcategory}
          {v.renewsInMonths !== null && ` · renews in ${v.renewsInMonths}mo`}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {v.spendLabel}
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9.5,
            color: COLORS.muted,
            letterSpacing: '0.04em',
          }}
        >
          {pct.toFixed(0)}% of bucket
        </div>
      </div>
    </li>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: { chip: string; chipText: string };
}) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tone.chipText,
        background: tone.chip,
        padding: '3px 8px',
        borderRadius: 3,
      }}
    >
      {children}
    </span>
  );
}

// ─── View 2 · Renewal calendar ──────────────────────────────────

function RenewalsView({ spend }: { spend: ReadonlyArray<VendorSpendRow> }) {
  const renewals = spend
    .filter((v): v is VendorSpendRow & { renewsInMonths: number } => v.renewsInMonths !== null)
    .sort((a, b) => a.renewsInMonths - b.renewsInMonths);
  const max = Math.max(24, ...renewals.map((r) => r.renewsInMonths));
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
          display: 'grid',
          gridTemplateColumns: '180px 1fr 110px 100px',
          gap: SPACING.md,
          padding: `${SPACING.xs}px 0`,
          borderBottom: BORDER.hairlineSoft,
          fontFamily: FONT.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: COLORS.muted,
          textTransform: 'uppercase',
        }}
      >
        <span>Vendor</span>
        <span>Timeline</span>
        <span style={{ textAlign: 'right' }}>Spend</span>
        <span style={{ textAlign: 'right' }}>Health</span>
      </div>
      {renewals.map((r) => {
        const tone = HEALTH_TONE[r.health];
        const pct = (r.renewsInMonths / max) * 100;
        return (
          <div
            key={r.vendor}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr 110px 100px',
              gap: SPACING.md,
              padding: `${SPACING.sm}px 0`,
              borderBottom: BORDER.hairlineSoft,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{r.vendor}</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: COLORS.muted, letterSpacing: '0.04em' }}>
                {r.subcategory}
              </div>
            </div>
            <div style={{ position: 'relative', height: 18, background: 'rgba(0,0,0,0.04)', borderRadius: 3 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: `linear-gradient(to right, transparent, ${tone.accent}66)`,
                  borderRadius: 3,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: tone.accent,
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(8px, -50%)',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: COLORS.muted,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.renewsInMonths}mo
              </span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
              {r.spendLabel}
            </div>
            <div style={{ textAlign: 'right' }}>
              <Pill tone={tone}>{tone.label}</Pill>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── View 3 · Risk quadrant ─────────────────────────────────────

function RiskQuadrantView({ spend }: { spend: ReadonlyArray<VendorSpendRow> }) {
  // X axis: tier (incumbent low leverage → emerging high leverage).
  // Y axis: health (risk low → healthy high). Bubble size = spend.
  const positionFor = (r: VendorSpendRow) => {
    const x = r.tier === 'incumbent' ? 0.2 : r.tier === 'challenger' ? 0.55 : 0.85;
    const y = r.health === 'risk' ? 0.2 : r.health === 'watch' ? 0.55 : 0.85;
    return { x, y };
  };
  const maxSpend = Math.max(...spend.map((r) => r.spendUsdM));
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
        position: 'relative',
        height: 420,
      }}
    >
      <span style={{ position: 'absolute', left: SPACING.xl, right: SPACING.xl, top: '50%', height: 1, background: COLORS.border }} />
      <span style={{ position: 'absolute', top: SPACING.xl, bottom: SPACING.xl, left: '50%', width: 1, background: COLORS.border }} />
      <Label x="50%" y={`${SPACING.xs}px`} text="HEALTHY" />
      <Label x="50%" y="calc(100% - 14px)" text="AT RISK" />
      <Label x={`${SPACING.xs}px`} y="50%" text="INCUMBENT" rotate={-90} anchor="start" />
      <Label x="calc(100% - 14px)" y="50%" text="EMERGING" rotate={90} anchor="end" />

      {spend.map((r) => {
        const pos = positionFor(r);
        const tone = HEALTH_TONE[r.health];
        const size = 12 + (r.spendUsdM / maxSpend) * 36;
        return (
          <div
            key={r.vendor}
            title={`${r.vendor} · ${r.spendLabel}`}
            style={{
              position: 'absolute',
              left: `${pos.x * 100}%`,
              top: `${(1 - pos.y) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: size,
              height: size,
              borderRadius: '50%',
              background: tone.accent,
              opacity: 0.55,
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.04em',
            }}
          >
            {r.vendor.split(' ')[0]?.slice(0, 4)}
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
