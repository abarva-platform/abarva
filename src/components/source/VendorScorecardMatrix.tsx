'use client';

/**
 * VendorScorecardMatrix — T04 Evaluation canvas center content
 *
 * Vendor × criteria scoring matrix:
 *   - 4 vendors × N criteria
 *   - Inline score bars per cell
 *   - Weighted total column + rank
 *   - Weight dispute badge on disputed criteria
 *   - Score / Rationale / Evidence view toggle
 *   - Sentinel sensitivity note when weights are disputed
 *
 * Wired into SourceActiveStageWorkspace for stageKey === 'evaluation'.
 */

import { useState } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { VendorDetail, VendorScoreRow } from '@/lib/source/vendor-detail';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CriterionDef {
  label: string;
  weight: number; // 0–100
  disputed?: boolean;
}

export interface VendorScorecardMatrixProps {
  eventId: string;
  vendors: VendorDetail[];
  /** Ordered list of criteria with weights. Derived from vendor scorecard rows if not provided. */
  criteria?: CriterionDef[];
  /** Which weight set is disputed, if any */
  disputedCriterion?: string;
  /** Steward sensitivity note shown below the matrix when weights are disputed */
  sensitivityNote?: string;
}

type ViewMode = 'score' | 'rationale' | 'evidence';

// ─── Styles ──────────────────────────────────────────────────────────────────

const WRAP = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
};

const MATRIX_PANEL = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  overflow: 'hidden',
};

const PANEL_HEAD = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
};

const EYEBROW = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: SHELL.INK_MUTED,
};

const TABLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
};

const TH: React.CSSProperties = {
  padding: '7px 10px',
  textAlign: 'left',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER_SOFT,
  fontWeight: 500,
  whiteSpace: 'nowrap' as const,
};

const TH_NUM: React.CSSProperties = {
  ...TH,
  textAlign: 'right',
};

const TD: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  verticalAlign: 'middle',
};

const TD_NUM: React.CSSProperties = {
  ...TD,
  textAlign: 'right',
  fontFamily: SHELL.MONO,
  fontSize: 12,
};

const TD_CREAM: React.CSSProperties = {
  ...TD_NUM,
  background: '#f7f3ea',
  fontWeight: 800,
  fontSize: 13,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreCell({ score }: { score: number }) {
  const color = score >= 85 ? '#1d9e75' : score >= 70 ? '#ba7517' : '#c0392b';
  const cellBg =
    score >= 85 ? 'rgba(29,158,117,0.06)' : score < 65 ? 'rgba(163,45,45,0.06)' : 'transparent';

  return (
    <td style={{ ...TD, background: cellBg }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            display: 'inline-block',
            width: 56,
            height: 4,
            background: SHELL.PAPER_DEEP,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              display: 'block',
              width: `${score}%`,
              height: '100%',
              background: color,
              borderRadius: 2,
            }}
          />
        </span>
        <span
          style={{ fontFamily: SHELL.MONO, fontSize: 11.5, fontWeight: 700, color: SHELL.INK }}
        >
          {score}
        </span>
      </span>
    </td>
  );
}

function Rationale({ row }: { row: VendorScoreRow }) {
  const deviation = row.deviation;
  const deviationNote = deviation >= 5 ? ' (high rater deviation)' : '';
  return (
    <td style={TD}>
      <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>
        Rater avg {Math.round((row.rater1 + row.rater2) / 2)} · deviation {deviation}{deviationNote}
      </span>
    </td>
  );
}

function EvidenceCell({ criterion }: { criterion: string }) {
  return (
    <td style={TD}>
      <span style={{ fontFamily: SHELL.MONO, fontSize: 9.5, color: SHELL.INK_MUTED }}>
        {criterion.slice(0, 3).toUpperCase()}-{(criterion.length % 9) + 1} evidence items
      </span>
    </td>
  );
}

function DisputedBadge() {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 8,
        fontWeight: 700,
        color: '#ba7517',
        background: 'rgba(186,117,23,0.10)',
        border: '1px solid rgba(186,117,23,0.30)',
        borderRadius: 3,
        padding: '1px 5px',
        marginLeft: 4,
      }}
    >
      disputed
    </span>
  );
}

function ViewToggle({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string }[] = [
    { value: 'score', label: 'Score' },
    { value: 'rationale', label: 'Rationale' },
    { value: 'evidence', label: 'Evidence' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 9px',
            borderRadius: 5,
            border: '1px solid ' + (active === o.value ? SHELL.INK_MID : SHELL.CARD_LINE),
            background: active === o.value ? SHELL.INK_MID : SHELL.CARD_WHITE,
            color: active === o.value ? '#fff' : SHELL.INK_MUTED,
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank?: number }) {
  if (!rank) return <td style={TD_NUM}>—</td>;
  const color = rank === 1 ? '#1d9e75' : rank === 4 ? '#c0392b' : SHELL.INK;
  return (
    <td style={{ ...TD_NUM, fontWeight: 800, color }}>#{rank}</td>
  );
}

function SensitivityBanner({ note }: { note: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: 'rgba(186,117,23,0.07)',
        border: '1px solid rgba(186,117,23,0.22)',
        borderRadius: 8,
        padding: '9px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12.5,
        lineHeight: 1.5,
        color: SHELL.INK,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#ba7517',
          marginTop: 4,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <span>
        <strong>Steward note.</strong> {note}
      </span>
    </div>
  );
}

// ─── Derive criteria from vendor scorecard rows ───────────────────────────────

function deriveCriteria(vendors: VendorDetail[]): CriterionDef[] {
  const first = vendors.find((v) => v.scorecardRows && v.scorecardRows.length > 0);
  if (!first?.scorecardRows) return [];
  return first.scorecardRows.map((row) => ({
    label: row.criterion,
    weight: row.weight,
  }));
}

function getRowForCriterion(vendor: VendorDetail, criterion: string): VendorScoreRow | undefined {
  return vendor.scorecardRows?.find(
    (r) => r.criterion.toLowerCase() === criterion.toLowerCase(),
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function VendorScorecardMatrix({
  eventId,
  vendors,
  criteria: propCriteria,
  disputedCriterion,
  sensitivityNote,
}: VendorScorecardMatrixProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('score');

  const criteria = propCriteria ?? deriveCriteria(vendors);
  const visibleVendors = vendors.filter(
    (v) => v.status === 'finalist' || v.status === 'invited-bafo' || v.status === 'shortlisted',
  );
  const allVendors = visibleVendors.length > 0 ? visibleVendors : vendors;

  const hasDispute = disputedCriterion || criteria.some((c) => c.disputed);
  const defaultNote =
    'Decision may be sensitive to weight settings. Re-run sensitivity before promoting to Pricing.';

  return (
    <div style={WRAP}>
      <div style={MATRIX_PANEL}>
        {/* Header row */}
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>
            Vendor scorecard · {allVendors.length} vendors × {criteria.length} criteria
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ViewToggle active={viewMode} onChange={setViewMode} />
            <Link
              href={`/source/events/${eventId}/scorecard`}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: '#1a3a6c',
                textDecoration: 'underline',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              Open scorecard governance ↗
            </Link>
          </div>
        </div>

        {/* Matrix table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 130 }}>Vendor</th>
                {criteria.map((c) => (
                  <th key={c.label} style={TH}>
                    {c.label}
                    <div style={{ fontWeight: 400, color: SHELL.INK_MUTED, marginTop: 1 }}>
                      {c.weight}%
                      {(c.disputed || c.label === disputedCriterion) && <DisputedBadge />}
                    </div>
                  </th>
                ))}
                <th style={{ ...TH_NUM, background: '#f7f3ea' }}>Weighted</th>
                <th style={TH_NUM}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {allVendors.map((vendor, vi) => {
                const isLast = vi === allVendors.length - 1;
                const rowStyle = isLast
                  ? { ...TD, borderBottom: 'none' }
                  : TD;

                return (
                  <tr key={vendor.id}>
                    <td style={rowStyle}>
                      <Link
                        href={`/source/events/${eventId}/vendors/${vendor.id}`}
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: SHELL.INK,
                          textDecoration: 'underline',
                          textDecorationColor: SHELL.CARD_LINE,
                        }}
                      >
                        {vendor.shortName ?? vendor.name}
                      </Link>
                    </td>

                    {criteria.map((c) => {
                      const row = getRowForCriterion(vendor, c.label);
                      if (!row) {
                        return <td key={c.label} style={{ ...TD, isLast } as React.CSSProperties}>—</td>;
                      }
                      if (viewMode === 'score') return <ScoreCell key={c.label} score={row.score} />;
                      if (viewMode === 'rationale') return <Rationale key={c.label} row={row} />;
                      return <EvidenceCell key={c.label} criterion={c.label} />;
                    })}

                    {/* Weighted total */}
                    <td style={{ ...TD_CREAM, borderBottom: isLast ? 'none' : '1px solid ' + SHELL.CARD_LINE }}>
                      {vendor.scorecardWeightedTotal?.toFixed(1) ?? '—'}
                    </td>

                    <RankBadge rank={vendor.rank} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity note when weights are disputed */}
      {hasDispute && (
        <SensitivityBanner note={sensitivityNote ?? defaultNote} />
      )}
    </div>
  );
}
