'use client';

// Intelligence v3 · By function stage.
//
// Groups initiatives by owner_function with a 4-lens toggle:
// Scorecards · Gates · Dependencies · Executive Brief. Each lens
// re-features the same function rows around a different metric.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { STATUS_LABELS, formatUsd } from '@/lib/admin/ai-initiatives/labels';
import {
  LAYER_LABELS,
  type ByFunctionData,
  type FunctionRollup,
} from '@/lib/intelligence-v3/stages-display';

export type ByFunctionLens = 'scorecards' | 'gates' | 'dependencies' | 'executive_brief';

const LENS_DEFS: ReadonlyArray<{ key: ByFunctionLens; label: string; subtitle: string }> = [
  { key: 'scorecards', label: 'Scorecards', subtitle: 'Health · stage mix · committed and realised' },
  { key: 'gates', label: 'Gates', subtitle: 'Decisions pending · stalled · awaiting sponsor' },
  { key: 'dependencies', label: 'Dependencies', subtitle: 'Vendor renewals upcoming per function' },
  { key: 'executive_brief', label: 'Executive Brief', subtitle: 'Aligned-callout initiatives · what to tell the sponsor' },
];

export function ByFunctionCanvas({ data }: { data: ByFunctionData }) {
  const [lens, setLens] = useState<ByFunctionLens>('scorecards');
  const lensDef = LENS_DEFS.find((l) => l.key === lens) ?? LENS_DEFS[0];

  return (
    <section
      id="stage-panel-by-function"
      role="tabpanel"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>By function · Front · Middle · Back office</SectionHeader>

      <div role="tablist" aria-label="By function lens" style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
        {LENS_DEFS.map((def) => {
          const isActive = def.key === lens;
          return (
            <button
              key={def.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setLens(def.key)}
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

      <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0 }}>
        Lens: <strong style={{ color: COLORS.body }}>{lensDef.label}</strong> — {lensDef.subtitle}
      </p>

      {data.functions.length === 0 ? (
        <Empty>No function rollups available for this tenant.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {data.functions.map((fn) => (
            <FunctionRow key={fn.function} fn={fn} lens={lens} />
          ))}
        </div>
      )}
    </section>
  );
}

function FunctionRow({ fn, lens }: { fn: FunctionRollup; lens: ByFunctionLens }) {
  const accent =
    fn.layer === 'experience'
      ? '#0F6E56'
      : fn.layer === 'decision'
        ? COLORS.amber
        : COLORS.navy;
  return (
    <article
      data-function={fn.function}
      style={{
        border: BORDER.hairline,
        borderLeft: `3px solid ${accent}`,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: SPACING.sm }}>
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {LAYER_LABELS[fn.layer]}
          </div>
          <h3 style={{ fontFamily: FONT.body, fontSize: 16, fontWeight: 600, color: COLORS.ink, margin: 0 }}>
            {fn.function}
          </h3>
        </div>
        <FeaturedMetric fn={fn} lens={lens} />
      </header>

      <LensBody fn={fn} lens={lens} />
    </article>
  );
}

function FeaturedMetric({ fn, lens }: { fn: FunctionRollup; lens: ByFunctionLens }) {
  switch (lens) {
    case 'scorecards': {
      const tone = fn.counts.atRisk > fn.counts.healthy ? COLORS.amber : COLORS.ink;
      return (
        <Right>
          <Eyebrow>Health mix</Eyebrow>
          <Big tone={tone}>
            {fn.counts.healthy}/{fn.counts.total} healthy
          </Big>
          <Sub>
            {fn.counts.atRisk > 0 ? `${fn.counts.atRisk} at risk · ` : ''}
            {formatUsd(fn.committedAnnualUsd)} annual committed
          </Sub>
        </Right>
      );
    }
    case 'gates': {
      const total = fn.pendingDecisions + fn.stalledDecisions;
      return (
        <Right>
          <Eyebrow>Open gates</Eyebrow>
          <Big tone={total > 0 ? COLORS.amber : COLORS.ink}>{total}</Big>
          <Sub>
            {fn.pendingDecisions} pending · {fn.stalledDecisions} stalled
          </Sub>
        </Right>
      );
    }
    case 'dependencies': {
      return (
        <Right>
          <Eyebrow>Vendor renewals</Eyebrow>
          <Big tone={fn.upcomingRenewals.length > 0 ? COLORS.navy : COLORS.muted}>
            {fn.upcomingRenewals.length}
          </Big>
          <Sub>
            {fn.upcomingRenewals[0]
              ? `next: ${fn.upcomingRenewals[0].vendorName} (${fn.upcomingRenewals[0].renewalDate})`
              : 'no renewals scheduled'}
          </Sub>
        </Right>
      );
    }
    case 'executive_brief': {
      return (
        <Right>
          <Eyebrow>Aligned bets</Eyebrow>
          <Big tone={fn.counts.aligned > 0 ? COLORS.amber : COLORS.muted}>
            {fn.counts.aligned}
          </Big>
          <Sub>{formatUsd(fn.measuredValueUsd)} measured value</Sub>
        </Right>
      );
    }
  }
}

function LensBody({ fn, lens }: { fn: FunctionRollup; lens: ByFunctionLens }) {
  if (lens === 'executive_brief') {
    const aligned = fn.initiatives.filter((i) => i.alignedCallout);
    if (aligned.length === 0) {
      return (
        <Body>
          <p style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.muted, margin: 0 }}>
            No aligned bets in this function. {fn.initiatives.length} initiative
            {fn.initiatives.length === 1 ? '' : 's'} in flight.
          </p>
        </Body>
      );
    }
    return (
      <Body>
        {aligned.map((a) => (
          <div key={a.initiativeId} style={{ marginTop: SPACING.xs }}>
            <div style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
              ⭐ {a.displayId} · {a.name}
            </div>
            {a.alignedRationale && (
              <div style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.body, marginTop: 2 }}>
                {a.alignedRationale}
              </div>
            )}
          </div>
        ))}
      </Body>
    );
  }
  if (lens === 'dependencies') {
    if (fn.upcomingRenewals.length === 0) return null;
    return (
      <Body>
        {fn.upcomingRenewals.map((r) => (
          <div
            key={`${r.initiativeId}-${r.vendorName}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0,1fr) auto',
              gap: SPACING.md,
              fontFamily: FONT.body,
              fontSize: 12,
              padding: `${SPACING.xs}px 0`,
            }}
          >
            <span style={{ fontFamily: FONT.mono, color: COLORS.muted, fontSize: 10 }}>renewal</span>
            <span style={{ color: COLORS.body }}>{r.vendorName}</span>
            <span style={{ color: COLORS.muted, fontFamily: FONT.mono }}>{r.renewalDate}</span>
          </div>
        ))}
      </Body>
    );
  }
  // scorecards + gates show initiatives list
  return (
    <Body>
      {fn.initiatives.map((i) => (
        <div
          key={i.initiativeId}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0,1fr) auto',
            gap: SPACING.md,
            fontFamily: FONT.body,
            fontSize: 12,
            padding: `${SPACING.xs}px 0`,
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontFamily: FONT.mono, color: COLORS.muted, fontSize: 10 }}>
            {i.displayId}
          </span>
          <span style={{ color: COLORS.body }}>
            {i.alignedCallout && '⭐ '}
            {i.name}
          </span>
          <span style={{ color: COLORS.muted, textAlign: 'right' }}>
            {STATUS_LABELS[i.statusFlag]}
            {lens === 'scorecards' ? ` · ${formatUsd(i.committedAnnualUsd)}` : ''}
          </span>
        </div>
      ))}
    </Body>
  );
}

// ---------------------------------------------------------------------
// Reusable bits
// ---------------------------------------------------------------------

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: SPACING.md,
        paddingTop: SPACING.sm,
        borderTop: `1px dotted ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  );
}

function Right({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'right' }}>{children}</div>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}
    >
      {children}
    </div>
  );
}

function Big({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <div
      style={{
        fontFamily: FONT.body,
        fontSize: 18,
        fontWeight: 700,
        color: tone ?? COLORS.ink,
        marginTop: 2,
      }}
    >
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
      {children}
    </div>
  );
}

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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.xxxl,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontSize: 13,
        color: COLORS.muted,
      }}
    >
      {children}
    </div>
  );
}
