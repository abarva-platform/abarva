'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildAiVendorView } from '@/lib/tower/ai-vendor-fixture';

// ---------------------------------------------------------------------------
// Checklist item
// ---------------------------------------------------------------------------

function CheckItem({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '7px 0', borderBottom: `1px solid ${SHELL.CARD_LINE}` }}>
      <div
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: `2px solid ${done ? SHELL.MINT_TEXT : SHELL.CARD_LINE}`,
          background: done ? SHELL.MINT_TEXT : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {done && <span style={{ color: SHELL.PAPER, fontSize: 11, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: done ? SHELL.INK_MUTED : SHELL.INK, textDecoration: done ? 'line-through' : 'none', lineHeight: 1.45 }}>
        {label}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Vendor renewal card
// ---------------------------------------------------------------------------

const RENEWAL_CHECKLISTS: Record<string, string[]> = {
  microsoft: [
    'Document current adoption rate (24%) vs vendor projection (75%)',
    'Quantify Now Assist duplication overlap ($800K/yr)',
    'Model seat right-sizing: 12,400 → 8,000 seats ($1.7M reduction)',
    'Prepare Finance sprint results as negotiation evidence',
    'Brief CIO on renewal position and walk-away scenario',
    'Schedule vendor meeting 30 days before expiry',
  ],
  servicenow: [
    'Issue formal SLA breach notice (KB integration 18 months late)',
    'Document deflection shortfall: 28% actual vs 40% SLA',
    'Calculate penalty credit: $560K/yr at 20% fee reduction',
    'Model 90-day KB completion sprint scope and cost',
    'Define descope boundary if deflection < 38% at renewal',
    'Align VP IT Ops and Legal before vendor meeting',
  ],
};

function VendorRenewalCard({ vendorId }: { vendorId: string }) {
  const vendor = buildAiVendorView(vendorId);
  const items = RENEWAL_CHECKLISTS[vendorId] ?? [];
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (!vendor) return null;

  const urgency = (vendor.renewalInDays ?? 999) < 60 ? 'critical' : 'upcoming';
  const urgencyColor = urgency === 'critical' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT;
  const urgencyBg = urgency === 'critical' ? SHELL.RUST_BG : SHELL.PEACH_BG;
  const doneCount = Object.values(checked).filter(Boolean).length;

  function toggle(i: number) {
    setChecked((c) => ({ ...c, [i]: !c[i] }));
  }

  const avgRoi = vendor.programs.reduce((s, p) => s + p.roi, 0) / vendor.programs.length;

  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${urgency === 'critical' ? SHELL.RUST_TEXT : SHELL.CARD_LINE}`, borderRadius: 10, padding: '18px 22px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 600, color: SHELL.INK, margin: '0 0 4px' }}>{vendor.vendorName}</h2>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>{vendor.category}</div>
        </div>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: urgencyBg, color: urgencyColor, padding: '2px 8px', borderRadius: 8 }}>
          {vendor.renewalInDays} days
        </span>
        <Link href={`/tower/vendors/${vendorId}`} style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT, textDecoration: 'none', alignSelf: 'flex-start' }}>
          Vendor detail →
        </Link>
      </div>

      {/* Key data points */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Annual spend', value: `$${(vendor.totalAnnualSpend / 1_000_000).toFixed(1)}M` },
          { label: 'Avg ROI', value: `${avgRoi.toFixed(2)}x`, color: avgRoi >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
          { label: 'Programs', value: String(vendor.programs.length) },
          { label: 'Active pressures', value: String(vendor.programs.reduce((s, p) => s + p.activePressures, 0)) },
        ].map((m) => (
          <div key={m.label} style={{ background: SHELL.PAPER_SOFT, borderRadius: 7, padding: '8px 10px' }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700, color: (m as { color?: string }).color ?? SHELL.INK, marginBottom: 2 }}>{m.value}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Negotiation position */}
      <div style={{ background: SHELL.PAPER_DEEP, borderRadius: 7, padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 4 }}>
          Nexus · Negotiation position
        </div>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.55 }}>
          {vendor.nexusQuote}
        </p>
      </div>

      {/* Checklist */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
            Renewal checklist
          </div>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: doneCount === items.length ? SHELL.MINT_TEXT : SHELL.INK_MUTED }}>
            {doneCount}/{items.length}
          </span>
        </div>
        {items.map((item, i) => (
          <CheckItem key={i} label={item} done={!!checked[i]} onToggle={() => toggle(i)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function RenewalWorkspacePage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'AI Control Tower · Renewal workspace' }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote="Two renewals require action now: Microsoft in 47 days and ServiceNow in 112 days. Both are at-risk — Microsoft for adoption shortfall, ServiceNow for SLA breach. Use the checklists to build your negotiation position before each vendor meeting."
        agentContext="Nexus · Renewal workspace · 2 active renewals"
        actions={[
          { letter: 'A', text: 'Draft Microsoft renewal brief', detail: '47 days · right-size + duplication evidence' },
          { letter: 'B', text: 'Draft ServiceNow SLA notice', detail: 'Formal breach letter · opens penalty discussion' },
          { letter: 'C', text: 'Calendar vendor meetings', detail: 'Microsoft: by May 14 · ServiceNow: by Jun 30' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
          ← Control Tower
        </Link>
        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.2 }}>
          Renewal workspace
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 20px' }}>
          Upcoming vendor renewals · negotiation position + action checklist
        </p>

        <VendorRenewalCard vendorId="microsoft" />
        <VendorRenewalCard vendorId="servicenow" />

        <div style={{ background: SHELL.PAPER_DEEP, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
            Later renewals
          </div>
          {[
            { name: 'Anthropic (Claude Code)', days: 214, note: 'No urgency — focus on expansion amendment (280 → 350 seats)' },
            { name: 'SAP (Joule + S/4HANA)', days: 548, note: 'Strategic watch only — switching cost extreme, no action in next 90 days' },
          ].map((r) => (
            <div key={r.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${SHELL.CARD_LINE}` }}>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, flex: 1 }}>{r.name}</span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED, flexShrink: 0 }}>{r.days} days · {r.note}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
