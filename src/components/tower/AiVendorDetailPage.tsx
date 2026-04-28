'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildAiVendorView, type AiVendorView, type VendorProgram, type VendorAlternative } from '@/lib/tower/ai-vendor-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 0) return `-${fmt$(Math.abs(n))}`;
  return `$${n}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtRoi(roi: number): string {
  if (roi >= 0) return `${roi.toFixed(1)}x ROI`;
  return `${roi.toFixed(2)}x ROI`;
}

const LIFECYCLE_META: Record<VendorProgram['lifecyclePhase'], { label: string; color: string; bg: string }> = {
  pilot: { label: 'Pilot', color: SHELL.INK_SOFT, bg: SHELL.GRAY_BG },
  rollout: { label: 'Rollout', color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
  'steady-state': { label: 'Steady state', color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
  'at-risk': { label: 'At risk', color: SHELL.RUST_TEXT, bg: SHELL.RUST_BG },
};

// ---------------------------------------------------------------------------
// Header KPIs band
// ---------------------------------------------------------------------------

function VendorHeader({ vendor }: { vendor: AiVendorView }) {
  const roiColor = vendor.programs.some((p) => p.roi < 0) ? SHELL.RUST_TEXT : SHELL.MINT_TEXT;

  return (
    <div style={{ marginBottom: 28 }}>
      <Link
        href="/tower"
        style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
      >
        ← Control Tower
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 24, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.1 }}>
            {vendor.vendorName}
          </h1>
          <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0 }}>
            {vendor.category}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { label: 'Annual spend', value: fmt$(vendor.totalAnnualSpend), color: SHELL.INK },
          { label: '% of AI budget', value: fmtPct(vendor.pctOfAiBudget), color: vendor.pctOfAiBudget > 0.3 ? SHELL.RUST_TEXT : SHELL.INK },
          { label: 'Programs', value: String(vendor.programs.length), color: SHELL.INK },
          {
            label: 'Renewal',
            value: vendor.renewalInDays !== null ? `${vendor.renewalInDays} days` : 'N/A',
            color: vendor.renewalInDays !== null && vendor.renewalInDays < 90 ? SHELL.RUST_TEXT : SHELL.INK,
          },
          {
            label: 'Portfolio ROI',
            value: fmtRoi(vendor.programs.reduce((s, p) => s + p.roi, 0) / vendor.programs.length),
            color: roiColor,
          },
        ].map((m) => (
          <div key={m.label} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Programs panel
// ---------------------------------------------------------------------------

function ProgramsPanel({ programs }: { programs: readonly VendorProgram[] }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 12px' }}>
        Programs using this vendor
      </h2>
      {programs.map((p) => {
        const lm = LIFECYCLE_META[p.lifecyclePhase];
        const roiPositive = p.roi >= 0;
        return (
          <Link
            key={p.programId}
            href={`/tower/programs/${p.programId}`}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}
          >
            <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 700, color: SHELL.INK, flex: 1 }}>{p.programName}</span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: lm.bg, color: lm.color, padding: '2px 8px', borderRadius: 8 }}>
                {lm.label}
              </span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: roiPositive ? SHELL.MINT_TEXT : SHELL.RUST_TEXT, fontWeight: 600 }}>
                {fmtRoi(p.roi)}
              </span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
                {fmt$(p.annualSpend)}/yr
              </span>
              {p.activePressures > 0 && (
                <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.RUST_TEXT }}>
                  {p.activePressures} pressure{p.activePressures > 1 ? 's' : ''}
                </span>
              )}
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>→</span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Contract panel
// ---------------------------------------------------------------------------

function ContractPanel({ vendor }: { vendor: AiVendorView }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 12px' }}>
        Contract
      </h2>
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '18px 20px' }}>
        {vendor.renewalInDays !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: vendor.renewalInDays < 90 ? SHELL.RUST_BG : SHELL.PEACH_BG, color: vendor.renewalInDays < 90 ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT, padding: '2px 8px', borderRadius: 8 }}>
              Renewal in {vendor.renewalInDays} days
            </span>
          </div>
        )}
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 12px', lineHeight: 1.6 }}>
          {vendor.contractNotes}
        </p>
        <div style={{ borderTop: `1px solid ${SHELL.CARD_LINE}`, paddingTop: 12 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 4 }}>
            Switching cost
          </div>
          <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, margin: 0 }}>
            {vendor.switchingCostLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alternatives table
// ---------------------------------------------------------------------------

function AlternativesPanel({ alternatives }: { alternatives: readonly VendorAlternative[] }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 12px' }}>
        Alternatives
      </h2>
      {alternatives.map((alt) => (
        <div key={alt.name} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 700, color: SHELL.INK, flex: 1 }}>{alt.name}</span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT, padding: '2px 7px', borderRadius: 8, flexShrink: 0 }}>
              {alt.type}
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.RUST_TEXT, fontWeight: 600, flexShrink: 0 }}>
              {alt.estimatedSwitchCost}
            </span>
          </div>
          <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, margin: 0, lineHeight: 1.55 }}>{alt.note}</p>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface Props { vendorId: string; }

export function AiVendorDetailPage({ vendorId }: Props) {
  const vendor = buildAiVendorView(vendorId);
  if (!vendor) return null;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `AI Control Tower · ${vendor.vendorName}`,
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={vendor.nexusQuote}
        agentContext={vendor.nexusContext}
        actions={[...vendor.nexusActions]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <VendorHeader vendor={vendor} />
        <ProgramsPanel programs={vendor.programs} />
        <ContractPanel vendor={vendor} />
        <AlternativesPanel alternatives={vendor.alternatives} />
      </div>
    </AppShell>
  );
}
