'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstanceOption {
  id: string;
  label: string;
  type: 'source' | 'program';
}

interface BulkWaiverCriterion {
  id: string;
  label: string;
  hint: string;
  gateType: 'hard' | 'soft';
  hasEvidence: boolean;
}

export interface BulkWaiverClientProps {
  instances: InstanceOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionLabel(type: 'hard' | 'soft'): string {
  return type === 'hard' ? 'Hard gates' : 'Soft gates';
}

function sectionColor(type: 'hard' | 'soft'): string {
  return type === 'hard' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT;
}

function sectionBg(type: 'hard' | 'soft'): string {
  return type === 'hard' ? SHELL.RUST_BG : SHELL.PEACH_BG;
}

// ─── CriterionRow ─────────────────────────────────────────────────────────────

function CriterionRow({
  criterion,
  checked,
  disabled,
  onChange,
}: {
  criterion: BulkWaiverCriterion;
  checked: boolean;
  disabled: boolean;
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
        background: disabled
          ? SHELL.GRAY_BG
          : checked
            ? isHard
              ? SHELL.RUST_BG
              : SHELL.PEACH_BG
            : COLORS.white,
        border: `1px solid ${
          disabled
            ? SHELL.GRAY_LINE
            : checked
              ? isHard
                ? SHELL.RUST_TEXT + '44'
                : SHELL.PEACH_LINE
              : COLORS.ink + '14'
        }`,
        borderRadius: RADIUS.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(criterion.id, e.target.checked)}
        style={{
          marginTop: 3,
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          accentColor: isHard ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT,
        }}
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
            }}
          >
            {criterion.id}
          </code>
          {disabled && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                color: SHELL.MINT_TEXT,
                background: SHELL.MINT_BG,
                padding: '1px 6px',
                borderRadius: RADIUS.sm,
                letterSpacing: '0.02em',
              }}
            >
              already met
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.INK,
            marginTop: 3,
            lineHeight: 1.4,
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
              marginTop: 2,
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

// ─── GateSection ──────────────────────────────────────────────────────────────

function GateSection({
  gateType,
  criteria,
  checked,
  onChange,
}: {
  gateType: 'hard' | 'soft';
  criteria: BulkWaiverCriterion[];
  checked: Set<string>;
  onChange: (id: string, isChecked: boolean) => void;
}) {
  const items = criteria.filter((c) => c.gateType === gateType);
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: SPACING.md }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: sectionBg(gateType),
          color: sectionColor(gateType),
          borderRadius: RADIUS.pill,
          padding: '3px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: SPACING.xs,
        }}
      >
        {sectionLabel(gateType)}
        <span style={{ fontWeight: 400, opacity: 0.8 }}>({items.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((c: BulkWaiverCriterion) => (
          <CriterionRow
            key={c.id}
            criterion={c}
            checked={checked.has(c.id)}
            disabled={c.hasEvidence}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BulkWaiverClient({ instances }: BulkWaiverClientProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [criteria, setCriteria] = useState<BulkWaiverCriterion[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('Demo waiver — applied via bulk waiver tool');
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<{ current: number; total: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected instance display label
  const selectedInstance = instances.find((i) => i.id === selectedId);

  const handleInstanceChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedId(id);
      setCriteria([]);
      setChecked(new Set());
      setCriteriaError(null);
      setSuccessMsg(null);
      setErrorMsg(null);

      if (!id) return;

      setLoadingCriteria(true);
      try {
        const res = await fetch('/api/reasoning/playground/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          criteria: BulkWaiverCriterion[];
        };
        setCriteria(data.criteria);
        // Pre-check nothing — user selects what to waive
        setChecked(new Set());
      } catch (err) {
        setCriteriaError(err instanceof Error ? err.message : 'Failed to load criteria');
      } finally {
        setLoadingCriteria(false);
      }
    },
    [],
  );

  const handleCheckChange = useCallback((id: string, isChecked: boolean) => {
    setChecked((prev: Set<string>) => {
      const next = new Set(prev);
      if (isChecked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleApply = useCallback(async () => {
    if (!selectedId || checked.size === 0 || !reason.trim()) return;

    const toWaive = Array.from(checked);
    setApplying(true);
    setApplyProgress({ current: 0, total: toWaive.length });
    setSuccessMsg(null);
    setErrorMsg(null);

    let failed = 0;
    for (let i = 0; i < toWaive.length; i++) {
      setApplyProgress({ current: i + 1, total: toWaive.length });
      try {
        const res = await fetch('/api/reasoning/gate-waiver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'gate_waiver',
            criterionId: toWaive[i],
            instanceId: selectedId,
            reason: reason.trim(),
          }),
        });
        if (!res.ok) {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setApplying(false);
    setApplyProgress(null);

    const instanceLabel = selectedInstance?.label ?? selectedId;
    if (failed === 0) {
      setSuccessMsg(`Applied ${toWaive.length} waiver${toWaive.length !== 1 ? 's' : ''} to ${instanceLabel}`);
      // Clear success after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
      // Uncheck applied
      setChecked(new Set());
    } else {
      setErrorMsg(
        `${failed} of ${toWaive.length} waivers failed. Check the console for details.`,
      );
    }
  }, [selectedId, checked, reason, selectedInstance]);

  const unmetCriteria = criteria.filter((c: BulkWaiverCriterion) => !c.hasEvidence);
  const checkedCount = checked.size;
  const canApply = checkedCount > 0 && reason.trim().length > 0 && !applying;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {/* Warning banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          background: SHELL.PEACH_BG,
          border: `1px solid ${SHELL.PEACH_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.PEACH_TEXT,
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>&#9888;&#xFE0F;</span>
        <span>
          All waivers are in-memory and reset on server restart. Use the{' '}
          <a
            href="/admin/reasoning/demo-panel"
            style={{ color: SHELL.PEACH_TEXT, fontWeight: 600 }}
          >
            Demo panel
          </a>{' '}
          to reset to a known state.
        </span>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div
          style={{
            background: SHELL.MINT_BG,
            border: `1px solid ${SHELL.MINT_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.MINT_TEXT,
            fontWeight: 600,
          }}
        >
          &#10003; {successMsg}
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div
          style={{
            background: SHELL.RUST_BG,
            border: `1px solid ${SHELL.RUST_TEXT}44`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.RUST_TEXT,
          }}
        >
          &#9888; {errorMsg}
        </div>
      )}

      {/* Step 1 — Instance selector */}
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
            color: SHELL.INK_MUTED,
            fontWeight: 600,
            marginBottom: SPACING.xs,
          }}
        >
          Step 1 — Select instance
        </div>
        <select
          value={selectedId}
          onChange={handleInstanceChange}
          disabled={applying}
          style={{
            width: '100%',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: SHELL.INK,
            background: SHELL.PAPER,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            outline: 'none',
            cursor: applying ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">— choose an instance —</option>
          <optgroup label="Source events">
            {instances
              .filter((i) => i.type === 'source')
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="Programs">
            {instances
              .filter((i) => i.type === 'program')
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
          </optgroup>
        </select>

        {loadingCriteria && (
          <div
            style={{
              marginTop: SPACING.sm,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            Loading criteria...
          </div>
        )}
        {criteriaError && (
          <div
            style={{
              marginTop: SPACING.sm,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.RUST_TEXT,
            }}
          >
            {criteriaError}
          </div>
        )}
      </div>

      {/* Step 2 — Gate criteria */}
      {criteria.length > 0 && (
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
              color: SHELL.INK_MUTED,
              fontWeight: 600,
              marginBottom: SPACING.sm,
            }}
          >
            Step 2 — Select gate criteria to waive
          </div>

          {unmetCriteria.length === 0 ? (
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: SHELL.MINT_TEXT,
                background: SHELL.MINT_BG,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
              }}
            >
              All gate criteria are already met — no waivers needed.
            </div>
          ) : (
            <>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: SHELL.INK_MUTED,
                  marginBottom: SPACING.sm,
                }}
              >
                Criteria that are already met are shown disabled. Check the unmet criteria you want to waive.
              </div>
              <GateSection
                gateType="hard"
                criteria={criteria}
                checked={checked}
                onChange={handleCheckChange}
              />
              <GateSection
                gateType="soft"
                criteria={criteria}
                checked={checked}
                onChange={handleCheckChange}
              />
              <div
                style={{
                  marginTop: SPACING.sm,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: SHELL.INK_MUTED,
                }}
              >
                {checkedCount} of {unmetCriteria.length} unmet criteria selected
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3 — Reason field */}
      {criteria.length > 0 && unmetCriteria.length > 0 && (
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
              color: SHELL.INK_MUTED,
              fontWeight: 600,
              marginBottom: SPACING.xs,
            }}
          >
            Step 3 — Waiver reason
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
            disabled={applying}
            placeholder="Waiver reason (required)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              color: SHELL.INK,
              background: SHELL.PAPER,
              border: `1px solid ${reason.trim() ? SHELL.CARD_LINE : SHELL.RUST_TEXT + '88'}`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              outline: 'none',
            }}
          />
          {!reason.trim() && (
            <div
              style={{
                marginTop: 4,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
              }}
            >
              Reason is required
            </div>
          )}
        </div>
      )}

      {/* Apply button */}
      {criteria.length > 0 && unmetCriteria.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <button
            onClick={handleApply}
            disabled={!canApply}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 600,
              color: canApply ? COLORS.white : SHELL.INK_MUTED,
              background: canApply ? SHELL.INK : SHELL.GRAY_BG,
              border: 'none',
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.lg}`,
              cursor: canApply ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Apply {checkedCount > 0 ? `${checkedCount} ` : ''}waiver{checkedCount !== 1 ? 's' : ''}
          </button>

          {applying && applyProgress && (
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: SHELL.INK_MUTED,
              }}
            >
              Applying waiver {applyProgress.current} of {applyProgress.total}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
