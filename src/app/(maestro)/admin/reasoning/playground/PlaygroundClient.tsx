'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

// Kept in sync with PlaygroundCriterion in the route file — duplicated here
// so client bundle doesn't depend on the server route module.
export interface PlaygroundCriterion {
  id: string;
  label: string;
  hint: string;
  gateType: 'hard' | 'soft';
  hasEvidence: boolean;
}

export interface PlaygroundInstanceOption {
  id: string;
  name: string;
}

export interface PlaygroundProps {
  instances: PlaygroundInstanceOption[];
  defaultInstanceId: string;
  defaultInstanceLabel: string;
  defaultStageLabel: string;
  defaultCriteria: PlaygroundCriterion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coverageColor(met: number, total: number): string {
  if (total === 0) return SHELL.GRAY_TEXT;
  const pct = met / total;
  if (pct >= 0.8) return SHELL.MINT_TEXT;
  if (pct >= 0.4) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function coverageBg(met: number, total: number): string {
  if (total === 0) return SHELL.GRAY_BG;
  const pct = met / total;
  if (pct >= 0.8) return SHELL.MINT_BG;
  if (pct >= 0.4) return SHELL.PEACH_BG;
  return SHELL.RUST_BG;
}

function coverageBarColor(met: number, total: number): string {
  if (total === 0) return SHELL.GRAY_LINE;
  const pct = met / total;
  if (pct >= 0.8) return SHELL.MINT_TEXT;
  if (pct >= 0.4) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

// ─── CriterionRow ─────────────────────────────────────────────────────────────

function CriterionRow({
  criterion,
  checked,
  onChange,
}: {
  criterion: PlaygroundCriterion;
  checked: boolean;
  onChange: (id: string, checked: boolean) => void;
}) {
  const isHard = criterion.gateType === 'hard';
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: checked ? (isHard ? SHELL.MINT_BG : '#f0f7ee') : COLORS.white,
        border: `1px solid ${checked ? SHELL.MINT_LINE : COLORS.ink + '14'}`,
        borderRadius: RADIUS.md,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(criterion.id, e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer', accentColor: SHELL.MINT_TEXT }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              background: SHELL.GRAY_BG,
              padding: '1px 6px',
              borderRadius: RADIUS.sm,
              letterSpacing: '0.01em',
              flexShrink: 0,
            }}
          >
            {criterion.id}
          </code>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isHard ? SHELL.RUST_TEXT : SHELL.INK_SOFT,
              background: isHard ? SHELL.RUST_BG : SHELL.GRAY_BG,
              padding: '1px 6px',
              borderRadius: RADIUS.sm,
              flexShrink: 0,
            }}
          >
            {isHard ? 'hard gate' : 'soft gate'}
          </span>
          {checked ? (
            <span style={{ fontSize: 13, color: SHELL.MINT_TEXT }}>✓</span>
          ) : (
            <span style={{ fontSize: 13, color: SHELL.RUST_TEXT }}>✗</span>
          )}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.INK,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          {criterion.label}
        </div>
        {criterion.hint && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginTop: 3,
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            {criterion.hint}
          </div>
        )}
      </div>
    </label>
  );
}

// ─── CoverageBar ──────────────────────────────────────────────────────────────

function CoverageBar({ met, total }: { met: number; total: number }) {
  const pct = total === 0 ? 0 : (met / total) * 100;
  return (
    <div
      style={{
        height: 8,
        background: SHELL.GRAY_BG,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: coverageBarColor(met, total),
          borderRadius: RADIUS.pill,
          transition: 'width 0.2s ease, background 0.2s ease',
        }}
      />
    </div>
  );
}

// ─── PlaygroundClient ─────────────────────────────────────────────────────────

export function PlaygroundClient({
  instances,
  defaultInstanceId,
  defaultInstanceLabel,
  defaultStageLabel,
  defaultCriteria,
}: PlaygroundProps) {
  const [selectedId, setSelectedId] = useState(defaultInstanceId);
  const [instanceLabel, setInstanceLabel] = useState(defaultInstanceLabel);
  const [stageLabel, setStageLabel] = useState(defaultStageLabel);
  const [criteria, setCriteria] = useState<PlaygroundCriterion[]>(defaultCriteria);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of defaultCriteria) {
      init[c.id] = c.hasEvidence;
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Default state (from real evidence map) — used by Reset
  const [defaultChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of defaultCriteria) {
      init[c.id] = c.hasEvidence;
    }
    return init;
  });
  // Track the default checked per instance for reset after switching
  const [instanceDefaultChecked, setInstanceDefaultChecked] = useState<Record<string, boolean>>(defaultChecked);

  const metCount = criteria.filter((c) => checked[c.id]).length;
  const total = criteria.length;
  const hardCriteria = criteria.filter((c) => c.gateType === 'hard');
  const softCriteria = criteria.filter((c) => c.gateType === 'soft');

  const handleToggle = useCallback((id: string, val: boolean) => {
    setChecked((prev: Record<string, boolean>) => ({ ...prev, [id]: val }));
  }, []);

  const handleReset = useCallback(() => {
    setChecked(instanceDefaultChecked);
  }, [instanceDefaultChecked]);

  const handleInstanceChange = useCallback(
    (newId: string) => {
      if (newId === selectedId) return;
      setSelectedId(newId);
      setError(null);
      startTransition(async () => {
        try {
          const res = await fetch('/api/reasoning/playground/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instanceId: newId }),
          });
          if (!res.ok) {
            const data = (await res.json()) as { error?: string };
            setError(data.error ?? 'Unknown error');
            return;
          }
          const data = (await res.json()) as {
            instance: { id: string; label: string; stageLabel: string };
            criteria: PlaygroundCriterion[];
            totalMet: number;
            total: number;
          };
          setInstanceLabel(data.instance.label);
          setStageLabel(data.instance.stageLabel);
          setCriteria(data.criteria);
          const newDefaults: Record<string, boolean> = {};
          for (const c of data.criteria) {
            newDefaults[c.id] = c.hasEvidence;
          }
          setInstanceDefaultChecked(newDefaults);
          setChecked(newDefaults);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Fetch failed');
        }
      });
    },
    [selectedId],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* ── Instance selector ─────────────────────────────────────────── */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
            marginBottom: SPACING.sm,
          }}
        >
          Source event instance
        </div>
        <select
          value={selectedId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInstanceChange(e.target.value)}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: SHELL.INK,
            background: SHELL.PAPER,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.md,
            cursor: 'pointer',
            appearance: 'auto',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {instances.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
        {isPending && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              marginTop: SPACING.xs,
            }}
          >
            Loading…
          </div>
        )}
        {error && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.RUST_TEXT,
              background: SHELL.RUST_BG,
              padding: '6px 10px',
              borderRadius: RADIUS.sm,
              marginTop: SPACING.xs,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ── Coverage summary ──────────────────────────────────────────── */}
      <div
        style={{
          background: coverageBg(metCount, total),
          border: `1px solid ${coverageBarColor(metCount, total)}44`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.md, flexWrap: 'wrap' }}>
          <div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: coverageColor(metCount, total),
                fontWeight: 600,
              }}
            >
              Gate coverage · {instanceLabel} · Stage: {stageLabel}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 40,
                color: coverageColor(metCount, total),
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginTop: 6,
              }}
            >
              {metCount} / {total}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 500,
                  color: coverageColor(metCount, total),
                  marginLeft: 10,
                  letterSpacing: 0,
                }}
              >
                gates met
              </span>
            </div>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 16px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK,
              background: COLORS.white,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: RADIUS.pill,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Reset to actual evidence
          </button>
        </div>
        <div style={{ marginTop: SPACING.md }}>
          <CoverageBar met={metCount} total={total} />
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: coverageColor(metCount, total),
            marginTop: SPACING.xs,
            opacity: 0.85,
          }}
        >
          {total === 0
            ? 'No gate criteria for this stage'
            : `${Math.round((metCount / total) * 100)}% coverage`}
        </div>
      </div>

      {/* ── Hard gates ───────────────────────────────────────────────── */}
      {hardCriteria.length > 0 && (
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: SHELL.RUST_TEXT,
              fontWeight: 600,
              marginBottom: SPACING.md,
            }}
          >
            Hard gates ({hardCriteria.filter((c) => checked[c.id]).length}/{hardCriteria.length} met)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
            {hardCriteria.map((c) => (
              <CriterionRow
                key={c.id}
                criterion={c}
                checked={!!checked[c.id]}
                onChange={handleToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Soft gates ───────────────────────────────────────────────── */}
      {softCriteria.length > 0 && (
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              fontWeight: 600,
              marginBottom: SPACING.md,
            }}
          >
            Soft gates ({softCriteria.filter((c) => checked[c.id]).length}/{softCriteria.length} met)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
            {softCriteria.map((c) => (
              <CriterionRow
                key={c.id}
                criterion={c}
                checked={!!checked[c.id]}
                onChange={handleToggle}
              />
            ))}
          </div>
        </div>
      )}

      {total === 0 && !isPending && (
        <div
          style={{
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.GRAY_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: SHELL.GRAY_TEXT,
            textAlign: 'center',
          }}
        >
          No gate criteria found for stage &ldquo;{stageLabel}&rdquo;
        </div>
      )}
    </div>
  );
}
