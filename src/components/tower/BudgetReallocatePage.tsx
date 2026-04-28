'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildAiProgramPortfolioView } from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtRoi(roi: number): string {
  if (roi > 0) return `+${roi.toFixed(2)}x`;
  return `${roi.toFixed(2)}x`;
}

// ---------------------------------------------------------------------------
// Program row with spend input
// ---------------------------------------------------------------------------

function ProgramRow({
  name, vendor, currentSpend, newSpend, valueCaptures, roi, onSpendChange,
}: {
  name: string; vendor: string; currentSpend: number; newSpend: number;
  valueCaptures: number; roi: number; onSpendChange: (v: number) => void;
}) {
  const simulatedRoi = newSpend > 0 ? (valueCaptures - newSpend) / newSpend : roi;
  const roiColor = simulatedRoi >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;
  const delta = newSpend - currentSpend;
  const deltaColor = delta > 0 ? SHELL.RUST_TEXT : delta < 0 ? SHELL.MINT_TEXT : SHELL.INK_MUTED;

  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 700, color: SHELL.INK, marginBottom: 2 }}>{name}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED }}>{vendor}</div>
        </div>
        <div style={{ width: 90, textAlign: 'right' }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 2 }}>Current</div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK }}>{fmt$(currentSpend)}</div>
        </div>
        <div style={{ width: 130 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 4 }}>New spend</div>
          <input
            type="number"
            value={newSpend}
            onChange={(e) => onSpendChange(Number(e.target.value))}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '6px 10px',
              fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK,
              background: SHELL.PAPER, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 6, outline: 'none',
            }}
          />
        </div>
        <div style={{ width: 80, textAlign: 'right' }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 2 }}>Δ spend</div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 12, color: deltaColor }}>
            {delta === 0 ? '—' : (delta > 0 ? '+' : '') + fmt$(delta)}
          </div>
        </div>
        <div style={{ width: 90, textAlign: 'right' }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 2 }}>Sim. ROI</div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 13, fontWeight: 700, color: roiColor }}>{fmtRoi(simulatedRoi)}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio delta summary
// ---------------------------------------------------------------------------

function PortfolioDelta({
  totalCurrent, totalNew, totalValue,
}: { totalCurrent: number; totalNew: number; totalValue: number }) {
  const currentRoi = totalCurrent > 0 ? (totalValue - totalCurrent) / totalCurrent : 0;
  const newRoi = totalNew > 0 ? (totalValue - totalNew) / totalNew : 0;
  const delta = totalNew - totalCurrent;
  const roiDelta = newRoi - currentRoi;

  return (
    <div style={{ background: SHELL.PAPER_DEEP, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontFamily: SHELL.SERIF, fontSize: 14, fontWeight: 600, color: SHELL.INK, marginBottom: 12 }}>Portfolio impact</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        {[
          { label: 'Current total', value: fmt$(totalCurrent), color: SHELL.INK },
          { label: 'New total', value: fmt$(totalNew), color: delta > 0 ? SHELL.RUST_TEXT : delta < 0 ? SHELL.MINT_TEXT : SHELL.INK },
          { label: 'Budget delta', value: (delta >= 0 ? '+' : '') + fmt$(delta), color: delta > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT },
          { label: 'Current ROI', value: fmtRoi(currentRoi), color: currentRoi >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
          { label: 'Simulated ROI', value: fmtRoi(newRoi), color: newRoi >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
          { label: 'ROI delta', value: (roiDelta >= 0 ? '+' : '') + roiDelta.toFixed(2) + 'x', color: roiDelta >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
        ].map((m) => (
          <div key={m.label} style={{ background: SHELL.CARD_WHITE, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontFamily: SHELL.SERIF, fontSize: 15, fontWeight: 700, color: m.color, marginBottom: 2 }}>{m.value}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function BudgetReallocatePage() {
  const { programs } = buildAiProgramPortfolioView();
  const [spends, setSpends] = useState<Record<string, number>>(
    Object.fromEntries(programs.map((p) => [p.id, p.annualSpend]))
  );

  const handleSpendChange = useCallback((id: string, v: number) => {
    setSpends((s) => ({ ...s, [id]: v }));
  }, []);

  const totalCurrent = programs.reduce((s, p) => s + p.annualSpend, 0);
  const totalNew = Object.values(spends).reduce((s, v) => s + v, 0);
  const totalValue = programs.reduce((s, p) => s + p.valueCaptures, 0);

  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'AI Control Tower · Budget reallocation' }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote="Edit spend for any program to model the reallocation impact. Value captures are held constant — this shows pure ROI sensitivity to spend changes. The portfolio ROI updates live as you type."
        agentContext={`Nexus · Budget simulator · ${fmt$(totalCurrent)} current`}
        actions={[
          { letter: 'A', text: 'Kill Now Assist, reallocate to Claude Code', detail: 'Move $2.8M → high-ROI program' },
          { letter: 'B', text: 'Right-size M365 to 8K seats', detail: 'Reduce $5M → $3.2M · hold value projection' },
          { letter: 'C', text: 'Reset all to current values', detail: 'Restore baseline spend' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
          ← Control Tower
        </Link>
        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.2 }}>
          Budget reallocation simulator
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 20px' }}>
          Edit spend to model reallocation scenarios · ROI recalculates live against fixed value captures
        </p>

        <PortfolioDelta totalCurrent={totalCurrent} totalNew={totalNew} totalValue={totalValue} />

        {programs.map((p) => (
          <ProgramRow
            key={p.id}
            name={p.name}
            vendor={p.vendor}
            currentSpend={p.annualSpend}
            newSpend={spends[p.id] ?? p.annualSpend}
            valueCaptures={p.valueCaptures}
            roi={p.roi}
            onSpendChange={(v) => handleSpendChange(p.id, v)}
          />
        ))}

        <p style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic', marginTop: 12 }}>
          Value captures are held at trailing 12-month actuals. Simulated ROI assumes spend change only. All data is deterministic seed.
        </p>
      </div>
    </AppShell>
  );
}
