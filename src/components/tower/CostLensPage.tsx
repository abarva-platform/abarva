'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { COST_ITEMS, COST_AGENT_VOICE, type CostItem } from '@/lib/tower/shell-lens-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtVariance(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(0)}%`;
}

function varianceColor(pct: number): string {
  if (pct > 0.05) return SHELL.RUST_TEXT;
  if (pct > 0) return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function trajectoryIcon(t: CostItem['trajectory']): string {
  if (t === 'up') return '↑';
  if (t === 'down') return '↓';
  return '→';
}

function trajectoryColor(t: CostItem['trajectory']): string {
  if (t === 'up') return SHELL.RUST_TEXT;
  if (t === 'down') return SHELL.MINT_TEXT;
  return SHELL.INK_MUTED;
}

// ---------------------------------------------------------------------------
// Budget share bar
// ---------------------------------------------------------------------------

function BudgetBar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        height: 4,
        borderRadius: 2,
        background: SHELL.PAPER_DEEP,
        overflow: 'hidden',
        width: '100%',
        marginTop: 6,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${(pct * 100).toFixed(1)}%`,
          background: SHELL.INK_MID,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dept allocation mini-bars
// ---------------------------------------------------------------------------

function DeptAllocationRow({ item }: { item: CostItem }) {
  const DEPT_COLORS = [SHELL.INK, SHELL.INK_MID, SHELL.INK_SOFT, SHELL.GRAY_TEXT, SHELL.INK_MUTED];
  return (
    <div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
        {item.deptAllocation.map((d, i) => (
          <div
            key={d.dept}
            title={`${d.dept}: ${(d.pct * 100).toFixed(0)}%`}
            style={{ width: `${d.pct * 100}%`, background: DEPT_COLORS[i % DEPT_COLORS.length] }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {item.deptAllocation.map((d, i) => (
          <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 1,
                background: DEPT_COLORS[i % DEPT_COLORS.length],
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_SOFT }}>
              {d.dept}
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
              {(d.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost card
// ---------------------------------------------------------------------------

function CostCard({ item }: { item: CostItem }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 15,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1.2,
              marginBottom: 2,
            }}
          >
            {item.program}
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.08em',
            }}
          >
            {item.vendor} · {item.programType}
          </div>
        </div>

        {/* Spend + trajectory */}
        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {fmt$(item.annualSpend)}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            annualized
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* % of AI budget */}
        <div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, lineHeight: 1 }}>
            {(item.pctOfAiBudget * 100).toFixed(1)}%
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 2 }}>
            of AI budget
          </div>
          <BudgetBar pct={item.pctOfAiBudget} />
        </div>

        {/* Variance vs plan */}
        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 600,
              color: varianceColor(item.spendVariancePct),
              lineHeight: 1,
            }}
          >
            {fmtVariance(item.spendVariancePct)}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 2 }}>
            vs plan
          </div>
        </div>

        {/* Effective per-user cost */}
        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 600,
              color: item.effectivePerUserCostMo !== null ? SHELL.INK : SHELL.INK_MUTED,
              lineHeight: 1,
            }}
          >
            {item.effectivePerUserCostMo !== null ? `$${item.effectivePerUserCostMo}` : '—'}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 2 }}>
            /user/mo effective
          </div>
        </div>

        {/* Trajectory */}
        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 16,
              fontWeight: 700,
              color: trajectoryColor(item.trajectory),
              lineHeight: 1,
            }}
          >
            {trajectoryIcon(item.trajectory)}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 2 }}>
            spend trend
          </div>
        </div>

        {/* Renewal */}
        {item.renewalInDays !== null && (
          <div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 600,
                color: item.renewalInDays < 90 ? SHELL.RUST_TEXT : SHELL.INK,
                lineHeight: 1,
              }}
            >
              {item.renewalInDays}d
            </div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 2 }}>
              to renewal
            </div>
          </div>
        )}
      </div>

      {/* Dept allocation */}
      <div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 6,
          }}
        >
          Dept allocation
        </div>
        <DeptAllocationRow item={item} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CostLensPage() {
  const totalSpend = COST_ITEMS.reduce((s, i) => s + i.annualSpend, 0);

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Cost Lens',
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={COST_AGENT_VOICE.quote}
        agentContext={COST_AGENT_VOICE.agentContext}
        actions={COST_AGENT_VOICE.actions}
        surface="tower"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Back link */}
        <a
          href="/tower"
          style={{
            display: 'inline-block',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            marginBottom: 12,
            letterSpacing: '0.06em',
          }}
        >
          ← Control Tower
        </a>

        {/* Header */}
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 400,
            color: SHELL.INK,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          Cost Lens
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '0 0 20px 0',
          }}
        >
          AI spend by program, vendor allocation, and budget variance · {fmt$(totalSpend)} total annualized
        </p>

        {/* Cost cards */}
        {COST_ITEMS.map((item) => (
          <CostCard key={item.id} item={item} />
        ))}

        {/* Footer note */}
        <div
          style={{
            background: SHELL.PAPER_SOFT,
            padding: '12px 20px',
            borderRadius: 8,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            Cost data is annualized run rate. Variance vs plan uses approved budget baselines. Per-user cost uses active user count — programs with no active users show —.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
