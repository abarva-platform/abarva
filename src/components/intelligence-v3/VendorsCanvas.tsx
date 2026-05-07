'use client';

// Intelligence v3 · Vendors stage canvas.
//
// Reads VendorsData (built server-side) and renders one row per vendor
// with a 4-mode lens toggle: Risk · Contract · Adoption · Value. The
// vendor's primary metric for the active lens is featured visually;
// the other dimensions remain available on the row but visually
// subordinated.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import {
  daysUntil,
  vendorHealthLabel,
  type VendorRollup,
  type VendorsData,
} from '@/lib/intelligence-v3/vendors-data';
import { STATUS_LABELS, formatUsd } from '@/lib/admin/ai-initiatives/queries';

export type VendorLens = 'risk' | 'contract' | 'adoption' | 'value';

const LENS_DEFS: ReadonlyArray<{ key: VendorLens; label: string; subtitle: string }> = [
  {
    key: 'risk',
    label: 'Risk',
    subtitle: 'Financial health · concentration · concerning initiatives',
  },
  {
    key: 'contract',
    label: 'Contract',
    subtitle: 'Total value · renewal calendar · committed exposure',
  },
  {
    key: 'adoption',
    label: 'Adoption',
    subtitle: 'How widely the vendor is in flight across initiatives',
  },
  {
    key: 'value',
    label: 'Value',
    subtitle: 'Realised vs committed · ROI signals',
  },
];

interface Props {
  data: VendorsData;
}

export function VendorsCanvas({ data }: Props) {
  const [lens, setLens] = useState<VendorLens>('risk');
  const lensDef = LENS_DEFS.find((l) => l.key === lens) ?? LENS_DEFS[0];

  return (
    <section
      id="stage-panel-vendors"
      role="tabpanel"
      aria-labelledby="stage-tab-vendors"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>Vendor landscape intelligence</SectionHeader>

      <Totals data={data} />

      <LensToggle lens={lens} onChange={setLens} />

      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 12,
          color: COLORS.muted,
          margin: 0,
          marginTop: -SPACING.sm,
        }}
      >
        Lens: <strong style={{ color: COLORS.body }}>{lensDef.label}</strong>{' '}
        — {lensDef.subtitle}
      </p>

      {data.vendors.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {data.vendors.map((vendor) => (
            <VendorRow key={vendor.vendorName} vendor={vendor} lens={lens} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Totals strip
// ---------------------------------------------------------------------

function Totals({ data }: { data: VendorsData }) {
  const tiles: ReadonlyArray<{ label: string; value: string }> = [
    {
      label: 'Vendors in flight',
      value: data.totals.vendorCount.toString(),
    },
    {
      label: 'Total contract value',
      value: formatUsd(data.totals.contractValueUsd),
    },
    {
      label: 'Renewals next 12mo',
      value: data.totals.upcomingRenewals.toString(),
    },
    {
      label: 'Vendors on watch',
      value: data.totals.atRiskVendors.toString(),
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.xs,
      }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            border: BORDER.hairline,
            background: COLORS.surface,
            borderRadius: RADIUS.sm,
            padding: SPACING.sm,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {t.label}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              marginTop: 2,
            }}
          >
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Lens toggle
// ---------------------------------------------------------------------

function LensToggle({ lens, onChange }: { lens: VendorLens; onChange: (v: VendorLens) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Vendor lens"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        flexWrap: 'wrap',
        marginTop: SPACING.xs,
      }}
    >
      {LENS_DEFS.map((def) => {
        const isActive = def.key === lens;
        return (
          <button
            key={def.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(def.key)}
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              padding: `${SPACING.xs}px ${SPACING.lg}px`,
              borderRadius: RADIUS.pill,
              background: isActive ? COLORS.navy : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.body,
              border: isActive ? `1px solid ${COLORS.navy}` : `1px solid ${COLORS.border}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {def.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Vendor row
// ---------------------------------------------------------------------

function VendorRow({ vendor, lens }: { vendor: VendorRollup; lens: VendorLens }) {
  const featured = featuredMetric(vendor, lens);
  const accent = accentForLens(lens);
  return (
    <article
      data-vendor={vendor.vendorName}
      data-lens={lens}
      style={{
        border: BORDER.hairline,
        borderLeft: `3px solid ${accent}`,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: SPACING.md,
          alignItems: 'center',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: FONT.body,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            {vendor.vendorName}
          </h3>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 12,
              color: COLORS.muted,
              marginTop: 2,
              display: 'flex',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {vendor.totalInitiatives} initiative{vendor.totalInitiatives === 1 ? '' : 's'}
            </span>
            {vendor.initiativesAtRisk > 0 && (
              <span style={{ color: COLORS.amber, fontWeight: 600 }}>
                · {vendor.initiativesAtRisk} at risk
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {featured.label}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 18,
              fontWeight: 700,
              color: featured.tone === 'warn' ? COLORS.amber : featured.tone === 'bad' ? COLORS.red : COLORS.ink,
              marginTop: 2,
            }}
          >
            {featured.value}
          </div>
          {featured.subtitle && (
            <div style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
              {featured.subtitle}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: SPACING.md,
          paddingTop: SPACING.sm,
          borderTop: `1px dotted ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        {vendor.initiatives.map((link) => (
          <div
            key={link.initiativeId}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              gap: SPACING.md,
              alignItems: 'baseline',
              fontFamily: FONT.body,
              fontSize: 12,
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: COLORS.muted,
                letterSpacing: '0.08em',
              }}
            >
              {link.initiativeDisplayId}
            </span>
            <span style={{ color: COLORS.body }}>{link.initiativeName}</span>
            <span style={{ color: COLORS.muted, textAlign: 'right' }}>
              {linkSecondaryByLens(link, lens)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------
// Lens-aware featured metric
// ---------------------------------------------------------------------

interface Featured {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'good' | 'neutral' | 'warn' | 'bad';
}

function featuredMetric(vendor: VendorRollup, lens: VendorLens): Featured {
  switch (lens) {
    case 'risk': {
      const health = vendor.worstFinancialHealth;
      return {
        label: 'Financial health',
        value: vendorHealthLabel(health),
        subtitle:
          vendor.initiativesAtRisk > 0
            ? `${vendor.initiativesAtRisk} of ${vendor.totalInitiatives} initiatives concerning`
            : 'no concerning initiatives',
        tone: health === 'at_risk' ? 'bad' : health === 'watch' ? 'warn' : 'neutral',
      };
    }
    case 'contract': {
      const days = daysUntil(vendor.earliestRenewal);
      return {
        label: 'Total contract value',
        value: formatUsd(vendor.totalContractValueUsd),
        subtitle:
          days === null
            ? 'no renewal recorded'
            : days < 0
              ? `expired ${Math.abs(days)}d ago`
              : days <= 90
                ? `next renewal in ${days}d`
                : `next renewal in ${Math.round(days / 30)}mo`,
        tone: days !== null && days >= 0 && days <= 90 ? 'warn' : 'neutral',
      };
    }
    case 'adoption': {
      return {
        label: 'Adoption breadth',
        value: `${vendor.totalInitiatives} initiatives`,
        subtitle: stageMixSummary(vendor),
        tone: 'neutral',
      };
    }
    case 'value': {
      // Without a measured-vs-committed split per vendor, surface a
      // proxy: total contract dollars + the count of healthy
      // initiatives as a rough "value-realised" signal.
      const healthy = vendor.initiatives.filter(
        (l) => l.initiativeStatusFlag === 'healthy',
      ).length;
      return {
        label: 'Value signal',
        value: `${healthy}/${vendor.totalInitiatives} healthy`,
        subtitle: `${formatUsd(vendor.totalContractValueUsd)} committed`,
        tone: healthy === vendor.totalInitiatives && vendor.totalInitiatives > 0 ? 'good' : 'neutral',
      };
    }
  }
}

function linkSecondaryByLens(
  link: VendorRollup['initiatives'][number],
  lens: VendorLens,
): string {
  switch (lens) {
    case 'risk':
      return `${STATUS_LABELS[link.initiativeStatusFlag]} · ${vendorHealthLabel(link.financialHealth)}`;
    case 'contract':
      return link.renewalDate
        ? `${formatUsd(link.contractValueUsd)} · renewal ${link.renewalDate}`
        : `${formatUsd(link.contractValueUsd)} · renewal n/a`;
    case 'adoption':
      return `${stageLabel(link.initiativeStage)} · ${STATUS_LABELS[link.initiativeStatusFlag]}`;
    case 'value':
      return `${STATUS_LABELS[link.initiativeStatusFlag]} · ${formatUsd(link.contractValueUsd)}`;
  }
}

function stageMixSummary(vendor: VendorRollup): string {
  const stages = vendor.initiatives.map((i) => i.initiativeStage);
  const counts: Record<string, number> = {};
  for (const s of stages) counts[s] = (counts[s] ?? 0) + 1;
  const parts = Object.entries(counts).map(([s, n]) => `${n} ${stageLabel(s as VendorRollup['initiatives'][number]['initiativeStage'])}`);
  return parts.join(' · ');
}

function stageLabel(stage: VendorRollup['initiatives'][number]['initiativeStage']): string {
  switch (stage) {
    case 'pilot':
      return 'Pilot';
    case 'scaled':
      return 'Scaled';
    case 'sunset':
      return 'Sunset';
    case 'multi_year_strategic_bet':
      return 'Strategic bet';
    case 'in_strategic_move':
      return 'In Move';
  }
}

function accentForLens(lens: VendorLens): string {
  switch (lens) {
    case 'risk':
      return COLORS.amber;
    case 'contract':
      return COLORS.navy;
    case 'adoption':
      return '#0F6E56';
    case 'value':
      return COLORS.amber;
  }
}

// ---------------------------------------------------------------------
// Section header + empty state (shared with TodayCanvas style)
// ---------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        background: COLORS.navyDark,
        color: COLORS.surface,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        fontSize: 13,
        fontWeight: 600,
        margin: 0,
        borderLeft: `3px solid ${COLORS.amber}`,
        borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
      }}
    >
      {children}
    </h2>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        background: COLORS.surface,
        padding: SPACING.xxxl,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 14,
          color: COLORS.muted,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        No vendor records loaded for this tenant yet. Run{' '}
        <code style={{ fontFamily: FONT.mono }}>npm run db:load:ai-initiatives</code> to populate.
      </div>
    </div>
  );
}
