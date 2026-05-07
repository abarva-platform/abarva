import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

/**
 * PricingTrapLog — T05 Pricing canvas trap log panel
 *
 * Displays ordered list of pricing traps with:
 *   - P0/P1/P2 severity badge
 *   - Vendor name (bold)
 *   - Trap description
 *   - Resolution note + resolver-agent tag
 */

export type TrapSeverity = 'P0' | 'P1' | 'P2';
export type TrapAgent = 'Sentinel' | 'Steward' | 'Nexus' | 'Atlas';
export type TrapStatus = 'open' | 'in-bafo' | 'resolved';

export interface PricingTrap {
  id: string;
  vendorName: string;
  severity: TrapSeverity;
  description: string;
  resolutionNote?: string;
  agent: TrapAgent;
  status: TrapStatus;
}

export interface PricingTrapLogProps {
  traps: PricingTrap[];
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PANEL: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  overflow: 'hidden',
};

const PANEL_HEAD: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const TRAP_ROW: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '10px 14px',
};

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<TrapSeverity, { bg: string; color: string; border: string }> = {
  P0: {
    bg: 'rgba(163,45,45,0.10)',
    color: '#a32d2d',
    border: 'rgba(163,45,45,0.28)',
  },
  P1: {
    bg: 'rgba(186,117,23,0.10)',
    color: '#ba7517',
    border: 'rgba(186,117,23,0.28)',
  },
  P2: {
    bg: SHELL.PAPER_SOFT,
    color: SHELL.INK_MUTED,
    border: SHELL.CARD_LINE,
  },
};

function SeverityBadge({ severity }: { severity: TrapSeverity }) {
  const c = SEVERITY_COLORS[severity];
  return (
    <span
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        color: c.color,
      }}
    >
      {severity}
    </span>
  );
}

// ─── Agent tag ────────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<TrapAgent, string> = {
  Sentinel: '#1a3a6c',
  Steward:  '#1B2B5C',
  Nexus:    '#2a4070',
  Atlas:    '#3a3a4a',
};

function AgentTag({ agent }: { agent: TrapAgent }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 8.5,
        fontWeight: 700,
        color: AGENT_COLORS[agent],
        background: `${AGENT_COLORS[agent]}14`,
        border: `1px solid ${AGENT_COLORS[agent]}30`,
        borderRadius: 4,
        padding: '1px 6px',
      }}
    >
      {agent.toUpperCase()}
    </span>
  );
}

// ─── Counter chip ─────────────────────────────────────────────────────────────

function CountChip({ traps }: { traps: PricingTrap[] }) {
  const p0 = traps.filter((t) => t.severity === 'P0' && t.status !== 'resolved').length;
  const p1 = traps.filter((t) => t.severity === 'P1' && t.status !== 'resolved').length;
  const p2 = traps.filter((t) => t.severity === 'P2' && t.status !== 'resolved').length;

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {p0 > 0 && (
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: '#a32d2d', fontWeight: 700 }}>
          {p0} P0
        </span>
      )}
      {p1 > 0 && (
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: '#ba7517', fontWeight: 700 }}>
          · {p1} P1
        </span>
      )}
      {p2 > 0 && (
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
          · {p2} P2
        </span>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PricingTrapLog({ traps }: PricingTrapLogProps) {
  if (traps.length === 0) return null;

  return (
    <div style={PANEL}>
      <div style={PANEL_HEAD}>
        <span style={EYEBROW}>Pricing trap log · {traps.length} item{traps.length !== 1 ? 's' : ''}</span>
        <CountChip traps={traps} />
      </div>

      <div>
        {traps.map((trap, i) => (
          <div
            key={trap.id}
            style={{
              ...TRAP_ROW,
              borderBottom: i < traps.length - 1 ? '1px solid ' + SHELL.CARD_LINE : 'none',
              opacity: trap.status === 'resolved' ? 0.5 : 1,
            }}
          >
            <SeverityBadge severity={trap.severity} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.4, color: SHELL.INK }}>
                <strong style={{ fontWeight: 700 }}>{trap.vendorName}:</strong>{' '}
                {trap.description}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {trap.resolutionNote && (
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 11.5,
                      color: trap.status === 'resolved' ? '#1d9e75' : SHELL.INK_MUTED,
                      lineHeight: 1.4,
                    }}
                  >
                    {trap.resolutionNote}
                  </span>
                )}
                {trap.status === 'in-bafo' && (
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: '#ba7517' }}>
                    Resolves in BAFO
                  </span>
                )}
                {trap.status === 'resolved' && (
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: '#1d9e75' }}>
                    Resolved
                  </span>
                )}
                <AgentTag agent={trap.agent} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Seeded AMS trap data ─────────────────────────────────────────────────────

export const AMS_PRICING_TRAPS: PricingTrap[] = [
  {
    id: 'T-NST-001',
    vendorName: 'Northstar',
    severity: 'P0',
    description: 'Tier-2 application support cost bundled in platform fee with no itemised breakdown',
    resolutionNote: 'Requested itemised breakdown in BAFO round 1',
    agent: 'Sentinel',
    status: 'in-bafo',
  },
  {
    id: 'T-ARC-001',
    vendorName: 'ArcVault',
    severity: 'P0',
    description: 'Governance framework undefined — no steering committee or escalation paths priced',
    resolutionNote: 'Supplementary model submitted in BAFO round 1',
    agent: 'Steward',
    status: 'in-bafo',
  },
  {
    id: 'T-NST-002',
    vendorName: 'Northstar',
    severity: 'P1',
    description: 'SLA scope broader than Apex reference spec — may expand managed footprint post-award',
    resolutionNote: 'Scope narrowing letter requested',
    agent: 'Steward',
    status: 'open',
  },
  {
    id: 'T-DPK-001',
    vendorName: 'DataPeak',
    severity: 'P1',
    description: 'Standard 16-week onboarding conflicts with CDP Q3 milestone — no fast-track option priced',
    resolutionNote: 'Timeline risk acknowledged; fast-track unavailable',
    agent: 'Nexus',
    status: 'open',
  },
  {
    id: 'T-BLU-001',
    vendorName: 'BlueMaster',
    severity: 'P1',
    description: 'Transition plan at 6 pages vs expected 25–40; critical knowledge transfer milestones absent',
    resolutionNote: 'Transition plan not eligible for BAFO — disqualification factor',
    agent: 'Atlas',
    status: 'open',
  },
  {
    id: 'T-ALL-001',
    vendorName: 'All vendors',
    severity: 'P2',
    description: 'No data residency clause priced for EU-scope applications (11 apps in EU regions)',
    agent: 'Steward',
    status: 'open',
  },
];
