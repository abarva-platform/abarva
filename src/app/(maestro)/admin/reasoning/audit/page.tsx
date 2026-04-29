'use client';

// /admin/reasoning/audit — Live reasoning audit log.
//
// Client component: fetches GET /api/reasoning/audit on mount and on demand,
// renders a table of all reasoning actions newest-first, with a summary strip,
// per-type pill badges, and a freshness indicator.

import React, { useCallback, useEffect, useState } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { AuditEntry, AuditEntryType } from '@/app/api/reasoning/audit/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeHMS(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

// ─── Type badge ───────────────────────────────────────────────────────────────

type BadgePalette = { bg: string; border: string; fg: string; label: string };

function typeBadgePalette(type: AuditEntryType): BadgePalette {
  switch (type) {
    case 'gate_waiver':
      return {
        bg: SHELL.PEACH_BG,
        border: SHELL.PEACH_LINE,
        fg: SHELL.PEACH_TEXT,
        label: 'gate waiver',
      };
    case 'gate_approval':
      return {
        bg: SHELL.MINT_BG,
        border: SHELL.MINT_LINE,
        fg: SHELL.MINT_TEXT,
        label: 'gate approval',
      };
    case 'gate_reject':
      return {
        bg: SHELL.RUST_BG,
        border: `${SHELL.RUST_TEXT}44`,
        fg: SHELL.RUST_TEXT,
        label: 'gate reject',
      };
    case 'contradiction_resolved':
      return {
        bg: SHELL.MINT_BG,
        border: SHELL.MINT_LINE,
        fg: SHELL.MINT_TEXT,
        label: 'contradiction',
      };
    case 'synthesis_feedback':
      return {
        bg: SHELL.GRAY_BG,
        border: SHELL.GRAY_LINE,
        fg: SHELL.GRAY_TEXT,
        label: 'synthesis fb',
      };
  }
}

function TypePill({ type }: { type: AuditEntryType }) {
  const { bg, border, fg, label } = typeBadgePalette(type);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        border: `1px solid ${border}`,
        color: fg,
        borderRadius: 100,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}

// ─── Live indicator ───────────────────────────────────────────────────────────

const BLINK_KEYFRAME = `
@keyframes auditDotBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
`;

function LiveDot({ fresh }: { fresh: boolean }) {
  return (
    <>
      <style>{BLINK_KEYFRAME}</style>
      <span
        aria-label={fresh ? 'Data is fresh' : 'Data may be stale'}
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: fresh ? '#3a8c5a' : SHELL.INK_MUTED,
          animation: fresh ? 'auditDotBlink 1.6s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      />
    </>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

const AUDIT_ENTRY_TYPES: AuditEntryType[] = [
  'gate_waiver',
  'gate_approval',
  'gate_reject',
  'contradiction_resolved',
  'synthesis_feedback',
];

function SummaryStrip({ entries }: { entries: AuditEntry[] }) {
  const counts = Object.fromEntries(
    AUDIT_ENTRY_TYPES.map((t) => [t, entries.filter((e) => e.type === t).length]),
  ) as Record<AuditEntryType, number>;

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '14px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 13,
          fontWeight: 700,
          color: SHELL.INK,
          minWidth: 80,
        }}
      >
        {entries.length} total
      </span>
      {AUDIT_ENTRY_TYPES.map((type) => {
        const { bg, border, fg, label } = typeBadgePalette(type);
        const count = counts[type];
        return (
          <span
            key={type}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 100,
              padding: '3px 10px 3px 8px',
              fontFamily: SHELL.SANS,
              fontSize: 11,
              fontWeight: 600,
              color: fg,
              letterSpacing: '0.02em',
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  fontWeight: 700,
  color: SHELL.INK_SOFT,
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK,
  padding: '9px 14px',
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'top',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_MID,
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: 40,
        textAlign: 'center',
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_MUTED,
        lineHeight: 1.6,
      }}
    >
      No audit entries yet — run a demo scenario to generate activity
    </div>
  );
}

// ─── Audit table ──────────────────────────────────────────────────────────────

function AuditTable({ entries }: { entries: AuditEntry[] }) {
  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={TH}>Time</th>
              <th style={TH}>Type</th>
              <th style={TH}>Instance</th>
              <th style={TH}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td style={TD_MONO}>{formatTimeHMS(entry.timestamp)}</td>
                <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                  <TypePill type={entry.type} />
                </td>
                <td
                  style={{
                    ...TD_MONO,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.instanceId}
                </td>
                <td
                  style={{
                    ...TD,
                    color: SHELL.INK_SOFT,
                    maxWidth: 420,
                  }}
                >
                  {truncate(entry.detail, 60)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STALE_THRESHOLD_MS = 30_000;

export default function ReasoningAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reasoning/audit', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AuditEntry[];
      // Sort newest first (API may already sort, but be safe)
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setEntries(sorted);
      setFetchedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void load();
  }, [load]);

  const isFresh =
    fetchedAt !== null && Date.now() - fetchedAt < STALE_THRESHOLD_MS;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Audit Log"
        subtitle="Live chronological log of all reasoning actions — gate waivers, approvals, rejections, contradiction resolutions, and synthesis feedback. Resets on server restart."
      >
        {/* Header row: title with live dot + refresh button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LiveDot fresh={isFresh} />
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                fontWeight: 600,
                color: SHELL.INK,
              }}
            >
              Audit Log
            </span>
            {fetchedAt !== null && (
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                }}
              >
                fetched {formatTimeHMS(new Date(fetchedAt).toISOString())}
                {!isFresh && ' · stale'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: loading ? SHELL.GRAY_BG : SHELL.INK,
              color: loading ? SHELL.INK_MUTED : SHELL.PAPER,
              border: 'none',
              borderRadius: 6,
              padding: '7px 16px',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Error banner */}
        {error !== null && (
          <div
            style={{
              background: SHELL.RUST_BG,
              border: `1px solid ${SHELL.RUST_TEXT}44`,
              borderRadius: 8,
              padding: '10px 16px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.RUST_TEXT,
            }}
          >
            Error loading audit log: {error}
          </div>
        )}

        {/* Summary strip */}
        {entries.length > 0 && <SummaryStrip entries={entries} />}

        {/* Main table or empty state */}
        {entries.length === 0 && !loading ? (
          <EmptyState />
        ) : (
          <AuditTable entries={entries} />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
