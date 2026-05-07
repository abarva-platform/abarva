import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { VendorDetail } from '@/lib/source/vendor-detail';
import { formatUsdM } from '@/lib/source/vendor-detail';

/**
 * PricingNormalizationMatrix — T05 Pricing canvas center content
 *
 * TCO normalization table: List TCO | Transition cost | Egress over-base |
 * Migration risk reserve | Normalized TCO | Δ vs list
 *
 * Trap cells show a "TRAP · [REASON]" mono label in red/amber below the number.
 */

export interface PricingRow {
  vendorId: string;
  vendorName: string;
  listTcoUsd: number;
  transitionCostUsd: number;
  transitionTrap?: string;        // if present, cell shows trap label
  egressOverBaseUsd: number;
  egressTrap?: string;
  migrationRiskReserveUsd: number;
  normalizedTcoUsd: number;
  tcoHorizonYears?: number;
}

export interface PricingNormalizationMatrixProps {
  rows: PricingRow[];
  horizonLabel?: string;          // e.g. "3-year horizon"
  assumptionVersion?: string;     // e.g. "assumption set v3"
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

const HELPER: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  color: SHELL.INK_MUTED,
  letterSpacing: '0.06em',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
};

const TH: CSSProperties = {
  padding: '7px 12px',
  textAlign: 'left',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const TH_NUM: CSSProperties = {
  ...TH,
  textAlign: 'right',
};

const TD: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  verticalAlign: 'top',
};

const TD_NUM: CSSProperties = {
  ...TD,
  textAlign: 'right',
  fontFamily: SHELL.MONO,
  fontSize: 12,
};

const TD_CREAM: CSSProperties = {
  ...TD_NUM,
  background: '#f7f3ea',
  fontWeight: 800,
  fontSize: 13,
};

const TRAP_LABEL: CSSProperties = {
  display: 'block',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.06em',
  marginTop: 2,
};

// ─── Delta badge ─────────────────────────────────────────────────────────────

function DeltaBadge({ listUsd, normalizedUsd }: { listUsd: number; normalizedUsd: number }) {
  const pct = Math.round(((normalizedUsd - listUsd) / listUsd) * 100);
  const color = pct > 20 ? '#c0392b' : pct > 10 ? '#ba7517' : SHELL.INK_MUTED;
  return (
    <td style={{ ...TD_NUM, color, fontWeight: 700 }}>
      {pct > 0 ? '+' : ''}{pct}%
    </td>
  );
}

// ─── Trap cell ────────────────────────────────────────────────────────────────

function TrapCell({ amountUsd, trapLabel }: { amountUsd: number; trapLabel?: string }) {
  const color = trapLabel ? (trapLabel.toLowerCase().includes('p0') ? '#c0392b' : '#ba7517') : undefined;
  return (
    <td style={{ ...TD_NUM, ...(color ? { background: color === '#c0392b' ? 'rgba(163,45,45,0.05)' : 'rgba(186,117,23,0.05)' } : {}) }}>
      +{formatUsdM(amountUsd)}
      {trapLabel && (
        <span style={{ ...TRAP_LABEL, color }}>
          TRAP · {trapLabel}
        </span>
      )}
    </td>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PricingNormalizationMatrix({
  rows,
  horizonLabel = '5-year horizon',
  assumptionVersion,
}: PricingNormalizationMatrixProps) {
  return (
    <div style={PANEL}>
      <div style={PANEL_HEAD}>
        <span style={EYEBROW}>TCO normalization · {horizonLabel}</span>
        {assumptionVersion && (
          <span style={HELPER}>USD · normalized to {assumptionVersion}</span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 130 }}>Vendor</th>
              <th style={TH_NUM}>
                List TCO<br />
                <span style={{ fontWeight: 400 }}>as quoted</span>
              </th>
              <th style={TH_NUM}>
                Transition cost<br />
                <span style={{ fontWeight: 400 }}>normalized</span>
              </th>
              <th style={TH_NUM}>
                Egress · over-base<br />
                <span style={{ fontWeight: 400 }}>at projected use</span>
              </th>
              <th style={TH_NUM}>
                Migration risk reserve<br />
                <span style={{ fontWeight: 400 }}>15% of transition</span>
              </th>
              <th style={{ ...TH_NUM, background: '#f7f3ea' }}>Normalized TCO</th>
              <th style={TH_NUM}>Δ vs. list</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isLast = i === rows.length - 1;
              const tdStyle = isLast ? { ...TD, borderBottom: 'none' } : TD;
              const tdNumStyle = isLast ? { ...TD_NUM, borderBottom: 'none' } : TD_NUM;
              const tdCreamStyle = isLast ? { ...TD_CREAM, borderBottom: 'none' } : TD_CREAM;

              return (
                <tr key={row.vendorId}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{row.vendorName}</td>
                  <td style={tdNumStyle}>{formatUsdM(row.listTcoUsd)}</td>
                  <TrapCell amountUsd={row.transitionCostUsd} trapLabel={row.transitionTrap} />
                  <TrapCell amountUsd={row.egressOverBaseUsd} trapLabel={row.egressTrap} />
                  <td style={tdNumStyle}>+{formatUsdM(row.migrationRiskReserveUsd)}</td>
                  <td style={tdCreamStyle}>{formatUsdM(row.normalizedTcoUsd)}</td>
                  <DeltaBadge listUsd={row.listTcoUsd} normalizedUsd={row.normalizedTcoUsd} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Default AMS pricing rows (seeded) ────────────────────────────────────────

export function buildAmsPricingRows(vendors: VendorDetail[]): PricingRow[] {
  // Derive pricing rows from vendor fixture data; fill gaps with seeded deltas
  const transitionRatios: Record<string, { ratio: number; trap?: string }> = {
    'northstar-managed-services': { ratio: 0.12, trap: 'Tier-2 bundled in platform fee' },
    'arcvault-managed':           { ratio: 0.08 },
    'bluemaster-operations':      { ratio: 0.10, trap: 'Knowledge transfer plan underdefined' },
    'datapeak-services':          { ratio: 0.14, trap: 'Timeline conflict with CDP Q3' },
  };
  const egressRatios: Record<string, { ratio: number; trap?: string }> = {
    'northstar-managed-services': { ratio: 0.03 },
    'arcvault-managed':           { ratio: 0.025 },
    'bluemaster-operations':      { ratio: 0.02 },
    'datapeak-services':          { ratio: 0.04, trap: 'Data egress cap 1TB/mo' },
  };

  return vendors
    .filter((v) => v.listTcoUsd !== undefined)
    .map((v) => {
      const list = v.listTcoUsd!;
      const tRatio = transitionRatios[v.id] ?? { ratio: 0.10 };
      const eRatio = egressRatios[v.id] ?? { ratio: 0.03 };
      const transition = Math.round(list * tRatio.ratio);
      const egress = Math.round(list * eRatio.ratio);
      const reserve = Math.round(transition * 0.15);
      return {
        vendorId: v.id,
        vendorName: v.shortName ?? v.name,
        listTcoUsd: list,
        transitionCostUsd: transition,
        transitionTrap: tRatio.trap,
        egressOverBaseUsd: egress,
        egressTrap: eRatio.trap,
        migrationRiskReserveUsd: reserve,
        normalizedTcoUsd: v.normalizedTcoUsd ?? list + transition + egress + reserve,
      };
    });
}
