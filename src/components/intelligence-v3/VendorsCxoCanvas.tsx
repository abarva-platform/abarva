'use client';

// Intelligence v3 · Vendors (CXO mode · PR-K2.5).
//
// CIO-quality canvas: leads with IT spend by category
// (Hardware/Cloud · Software/SaaS · Services/SI), drills into top
// vendors per category, then offers renewal calendar and risk
// quadrant as secondary views.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import {
  MERIDIAN_VENDOR_SPEND,
  VENDOR_CATEGORIES,
  type VendorCategory,
  type VendorHealth,
  type VendorSpendRow,
} from './cxo-fixtures';

type VendorsView = 'spend' | 'renewals' | 'risk';
type VendorRiskFilter = 'all' | 'risk' | 'watch';

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

interface Props {
  spend?: ReadonlyArray<VendorSpendRow>;
}

export function VendorsCxoCanvas({ spend = MERIDIAN_VENDOR_SPEND }: Props) {
  const [view, setView] = useState<VendorsView>('spend');
  const totals = useMemo(() => computeCategoryTotals(spend), [spend]);
  const decisionVendor = useMemo(() => pickDecisionVendor(spend), [spend]);

  if (spend.length === 0) {
    return (
      <section data-canvas="vendors" data-view="empty">
        <VendorMockHero
          totalSpendUsdM={0}
          vendorCount={0}
          atRisk={0}
          watchlist={0}
          decisionVendor={undefined}
        />
        <EmptyVendorState />
      </section>
    );
  }

  const totalSpendUsdM = totals.reduce((sum, c) => sum + c.totalUsdM, 0);
  const atRisk = spend.filter((v) => v.health === 'risk').length;
  const watchlist = spend.filter((v) => v.health === 'watch').length;

  return (
    <section data-canvas="vendors" data-view={view}>
      <div style={{ display: 'none' }} aria-hidden="true">
        {VIEWS.map((option) => (
          <button key={option.key} type="button" onClick={() => setView(option.key)}>
            {option.label}
          </button>
        ))}
      </div>

      <VendorMockHero
        totalSpendUsdM={totalSpendUsdM}
        vendorCount={spend.length}
        atRisk={atRisk}
        watchlist={watchlist}
        decisionVendor={decisionVendor}
      />

      {view === 'spend' && <SpendView totals={totals} totalUsdM={totalSpendUsdM} />}
      {view === 'renewals' && <RenewalsView spend={spend} />}
      {view === 'risk' && <RiskQuadrantView spend={spend} />}
    </section>
  );
}

function EmptyVendorState() {
  return (
    <div
      role="status"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        No tenant-specific vendor spend is loaded yet.
      </div>
      <p
        style={{
          color: COLORS.body,
          fontSize: 14,
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 760,
        }}
      >
        AbarVa will not recommend a renewal or name a vendor from another client. Load this tenant&apos;s vendor contracts before using the Vendors panel for a sourcing decision.
      </p>
    </div>
  );
}

function VendorMockHero({
  totalSpendUsdM,
  vendorCount,
  atRisk,
  watchlist,
  decisionVendor,
}: {
  totalSpendUsdM: number;
  vendorCount: number;
  atRisk: number;
  watchlist: number;
  decisionVendor?: VendorSpendRow;
}) {
  const isAdobe = decisionVendor?.vendor.toLowerCase().includes('adobe') ?? false;
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 36,
        alignItems: 'center',
        borderBottom: BORDER.hairline,
        paddingBottom: 22,
        marginBottom: 22,
      }}
    >
      <div>
        <div style={heroEyebrowStyle()}>Stage · Vendors</div>
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: 400,
            lineHeight: 1.04,
            letterSpacing: '-0.012em',
            color: COLORS.ink,
            margin: '8px 0 12px',
            maxWidth: 920,
          }}
        >
          Vendor risk is not the spend number. It is where spend controls the AI roadmap.
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            lineHeight: 1.5,
            color: COLORS.body,
            maxWidth: 860,
            margin: 0,
          }}
        >
          Spend is sliced into the operating choices it creates: renewals that force architecture decisions,
          vendors claiming the same integration layer, and sourcing events that can become executive moves.
        </p>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            marginTop: 12,
          }}
        >
          ${totalSpendUsdM.toFixed(1)}M annualized · {vendorCount} vendors · {atRisk} at risk · {watchlist} on watch
        </div>
      </div>
      <DecisionNow
        title={
          isAdobe
            ? 'Use the Adobe renewal to force CDP clarity'
            : `Use the ${decisionVendor?.vendor ?? 'next'} renewal to force platform clarity`
        }
        metrics={[
          ['Spend at risk', decisionVendor?.spendLabel ?? 'Not sized'],
          [
            'Renews',
            decisionVendor?.renewsInMonths === null
              ? 'Consumption'
              : decisionVendor?.renewsInMonths
                ? `${decisionVendor.renewsInMonths} months`
                : 'Renewal not set',
          ],
          [
            'Linked bets',
            decisionVendor
              ? isAdobe
                ? '3'
                : linkedBetsForVendor(decisionVendor).split(',').length.toString()
              : 'Not mapped',
          ],
          ['Risk', decisionVendor?.health === 'risk' ? 'High' : 'Watch'],
        ]}
      />
    </header>
  );
}

function DecisionNow({
  title,
  metrics,
}: {
  title: string;
  metrics: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <aside
      aria-label="Decision now"
      style={{
        borderLeft: `3px solid ${COLORS.navy}`,
        padding: '12px 0 12px 18px',
      }}
    >
      <div style={heroEyebrowStyle()}>Decision now</div>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.1,
          color: COLORS.ink,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 18px' }}>
        {metrics.map(([label, value]) => (
          <div key={label}>
            <div style={metricLabelStyle()}>{label}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 800, color: COLORS.ink }}>{value}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function heroEyebrowStyle(): React.CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: COLORS.muted,
  };
}

function metricLabelStyle(): React.CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 4,
  };
}

function pickDecisionVendor(spend: ReadonlyArray<VendorSpendRow>): VendorSpendRow | undefined {
  return (
    spend.find((vendor) => vendor.vendor.toLowerCase().includes('adobe')) ??
    [...spend]
      .filter((vendor) => vendor.health !== 'healthy')
      .sort((a, b) => {
        if (a.health !== b.health) return a.health === 'risk' ? -1 : 1;
        const aMonths = a.renewsInMonths ?? 99;
        const bMonths = b.renewsInMonths ?? 99;
        if (aMonths !== bMonths) return aMonths - bMonths;
        return b.spendUsdM - a.spendUsdM;
      })[0] ??
    spend[0]
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
  return VENDOR_CATEGORIES.flatMap((cat) => {
    const inCat = spend.filter((v) => v.category === cat.key);
    if (inCat.length === 0) return [];

    const sorted = [...inCat].sort((a, b) => b.spendUsdM - a.spendUsdM);
    const total = sorted.reduce((sum, v) => sum + v.spendUsdM, 0);
    return [
      {
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
      },
    ];
  });
}

// ─── View 1 · By category (default · CIO read) ─────────────────

function SpendView({ totals, totalUsdM }: { totals: CategoryTotal[]; totalUsdM: number }) {
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory>(totals[0]?.key ?? 'hardware-cloud');
  const [riskFilter, setRiskFilter] = useState<VendorRiskFilter>('all');
  const selectedTotal = totals.find((cat) => cat.key === selectedCategory) ?? totals[0];
  const allVendors = totals.flatMap((cat) => cat.topVendors);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'none' }} aria-hidden="true">
        <SpendHero totals={totals} totalUsdM={totalUsdM} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: SPACING.md,
        }}
      >
        {totals.map((cat) => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            totalUsdM={totalUsdM}
            isActive={cat.key === selectedCategory}
            onSelect={() => {
              setSelectedCategory(cat.key);
              setRiskFilter('all');
            }}
          />
        ))}
      </div>
      {selectedTotal && (
        <VendorSpendDrilldown
          selected={selectedTotal}
          totals={totals}
          allVendors={allVendors}
          riskFilter={riskFilter}
          onCategoryChange={setSelectedCategory}
          onRiskChange={setRiskFilter}
        />
      )}
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

function CategoryCard({
  cat,
  totalUsdM,
  isActive,
  onSelect,
}: {
  cat: CategoryTotal;
  totalUsdM: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const pctOfTotal = (cat.totalUsdM / totalUsdM) * 100;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onSelect();
      }}
      style={{
        background: COLORS.card,
        border: isActive ? `1px solid ${cat.accent}` : BORDER.hairline,
        borderTop: `3px solid ${cat.accent}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'inherit',
        boxShadow: isActive ? '0 14px 34px rgba(10, 12, 18, 0.08)' : 'none',
        transform: isActive ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow 140ms ease, transform 140ms ease, border-color 140ms ease',
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

function VendorSpendDrilldown({
  selected,
  totals,
  allVendors,
  riskFilter,
  onCategoryChange,
  onRiskChange,
}: {
  selected: CategoryTotal;
  totals: CategoryTotal[];
  allVendors: ReadonlyArray<VendorSpendRow>;
  riskFilter: VendorRiskFilter;
  onCategoryChange: (category: VendorCategory) => void;
  onRiskChange: (filter: VendorRiskFilter) => void;
}) {
  const visibleVendors = selected.topVendors.filter((vendor) => {
    if (riskFilter === 'all') return true;
    return vendor.health === riskFilter;
  });
  const atRiskCount = allVendors.filter((vendor) => vendor.health === 'risk').length;
  const watchCount = allVendors.filter((vendor) => vendor.health === 'watch').length;

  return (
    <section
      aria-label="Vendor spend drilldown"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: SPACING.lg,
          alignItems: 'center',
          padding: `${SPACING.lg}px ${SPACING.xl}px`,
          background: COLORS.surface2,
          borderBottom: BORDER.hairline,
          flexWrap: 'wrap',
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
              marginBottom: 5,
            }}
          >
            Spend drilldown
          </div>
          <h3
            style={{
              fontFamily: FONT.display,
              fontSize: 24,
              fontWeight: 400,
              color: COLORS.ink,
              letterSpacing: '-0.012em',
              margin: 0,
              lineHeight: 1.12,
            }}
          >
            {selected.shortLabel} vendors
          </h3>
        </div>
        <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
          <Link href="/source" prefetch={false} style={actionButtonStyle(true)}>
            Open Source event
          </Link>
          <Link href="/source#scope" prefetch={false} style={actionButtonStyle(false)}>
            Shape sourcing move
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: SPACING.xs,
          flexWrap: 'wrap',
          padding: `${SPACING.sm}px ${SPACING.xl}px`,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        {totals.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => {
              onCategoryChange(cat.key);
              onRiskChange('all');
            }}
            style={filterButtonStyle(cat.key === selected.key)}
          >
            {cat.shortLabel}
          </button>
        ))}
        <button type="button" onClick={() => onRiskChange('risk')} style={filterButtonStyle(riskFilter === 'risk')}>
          At risk {atRiskCount}
        </button>
        <button type="button" onClick={() => onRiskChange('watch')} style={filterButtonStyle(riskFilter === 'watch')}>
          Watch {watchCount}
        </button>
        <button type="button" onClick={() => onRiskChange('all')} style={filterButtonStyle(riskFilter === 'all')}>
          All risk
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
          <thead>
            <tr>
              {['Vendor', 'Bucket', 'Spend', 'Renewal', 'Linked AI bets', 'Status', 'Action'].map((header) => (
                <th key={header} style={tableHeadStyle(header === 'Spend' || header === 'Renewal' ? 'right' : 'left')}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleVendors.map((vendor) => (
              <VendorSpendTableRow key={vendor.vendor} vendor={vendor} selected={selected} />
            ))}
            {visibleVendors.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: SPACING.xl, color: COLORS.muted, fontSize: 13 }}>
                  No vendors match this slice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VendorSpendTableRow({ vendor, selected }: { vendor: VendorSpendRow; selected: CategoryTotal }) {
  const tone = HEALTH_TONE[vendor.health];
  return (
    <tr>
      <td style={tableCellStyle()}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{vendor.vendor}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: COLORS.muted, letterSpacing: '0.04em', marginTop: 3 }}>
          {vendor.subcategory}
        </div>
      </td>
      <td style={tableCellStyle()}>{selected.shortLabel}</td>
      <td style={{ ...tableCellStyle('right'), fontWeight: 800, color: COLORS.ink, whiteSpace: 'nowrap' }}>
        {vendor.spendLabel}
      </td>
      <td style={tableCellStyle('right')}>{vendor.renewsInMonths === null ? 'Consumption' : `${vendor.renewsInMonths} mo`}</td>
      <td style={tableCellStyle()}>{linkedBetsForVendor(vendor)}</td>
      <td style={tableCellStyle()}>
        <Pill tone={tone}>{tone.label}</Pill>
      </td>
      <td style={tableCellStyle()}>
        <Link href={`/source?vendor=${encodeURIComponent(vendor.vendor)}`} prefetch={false} style={sourceEventButtonStyle()}>
          Source event
        </Link>
      </td>
    </tr>
  );
}

function linkedBetsForVendor(vendor: VendorSpendRow): string {
  const text = `${vendor.vendor} ${vendor.subcategory} ${vendor.takeaway}`.toLowerCase();
  if (text.includes('adobe') || text.includes('salesforce') || text.includes('cdp') || text.includes('loyalty')) {
    return 'Loyalty AI, personalization, returns fraud';
  }
  if (text.includes('blue yonder') || text.includes('forecast') || text.includes('demand')) {
    return 'Demand sensing, replenishment';
  }
  if (text.includes('zebra') || text.includes('store') || text.includes('workforce')) {
    return 'Store productivity, workforce scheduling';
  }
  if (text.includes('accenture') || text.includes('deloitte') || text.includes('integration')) {
    return 'CDP readiness, AI governance';
  }
  return 'Portfolio dependency';
}

function tableHeadStyle(align: 'left' | 'right' = 'left'): React.CSSProperties {
  return {
    textAlign: align,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    borderBottom: BORDER.hairline,
    fontFamily: FONT.mono,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: COLORS.muted,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}

function tableCellStyle(align: 'left' | 'right' = 'left'): React.CSSProperties {
  return {
    textAlign: align,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    borderBottom: BORDER.hairlineSoft,
    fontSize: 12.5,
    color: COLORS.body,
    verticalAlign: 'top',
    lineHeight: 1.45,
  };
}

function filterButtonStyle(active: boolean): React.CSSProperties {
  return {
    border: active ? `1px solid ${COLORS.ink}` : BORDER.hairline,
    background: active ? COLORS.ink : COLORS.card,
    color: active ? COLORS.surface : COLORS.body,
    borderRadius: RADIUS.pill,
    padding: '7px 11px',
    fontFamily: FONT.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function actionButtonStyle(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${COLORS.ink}`,
    background: primary ? COLORS.ink : COLORS.card,
    color: primary ? COLORS.surface : COLORS.ink,
    borderRadius: 5,
    padding: '9px 12px',
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function sourceEventButtonStyle(): React.CSSProperties {
  return {
    display: 'inline-flex',
    border: `1px solid ${COLORS.ink}`,
    background: COLORS.card,
    color: COLORS.ink,
    borderRadius: 5,
    padding: '7px 9px',
    fontFamily: FONT.mono,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
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
