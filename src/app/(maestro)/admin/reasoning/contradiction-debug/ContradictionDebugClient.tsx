'use client';

// ContradictionDebugClient — interactive selector for per-instance contradiction debug.
//
// Renders an instance dropdown at the top. On selection, shows per-template results
// grouped: Active first (red border), Resolved (mint, muted), Not triggered (gray,
// very muted). Each template card shows severity, confidence, evidence pointers,
// detectionHint, and resolutionPath.

import { useState } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { InstanceDebugResult, TemplateResult } from './page';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  instanceResults: InstanceDebugResult[];
};

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const style: React.CSSProperties =
    severity === 'high'
      ? { background: SHELL.RUST_BG, color: SHELL.RUST_TEXT }
      : severity === 'medium'
        ? { background: SHELL.PAPER_DEEP, color: '#7a5c1a' }
        : { background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT };
  return (
    <span
      style={{
        ...style,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'resolved' | 'not-fired' }) {
  if (status === 'active') {
    return (
      <span
        style={{
          background: SHELL.RUST_BG,
          color: SHELL.RUST_TEXT,
          border: `1px solid #d4917a`,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap' as const,
        }}
      >
        Active
      </span>
    );
  }
  if (status === 'resolved') {
    return (
      <span
        style={{
          background: SHELL.MINT_BG,
          color: SHELL.MINT_TEXT,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap' as const,
        }}
      >
        Resolved
      </span>
    );
  }
  return (
    <span
      style={{
        background: SHELL.GRAY_BG,
        color: SHELL.GRAY_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap' as const,
      }}
    >
      Not triggered
    </span>
  );
}

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  return (
    <span
      style={{
        background: type === 'source' ? '#fde9d9' : SHELL.BLUE_BG,
        color: type === 'source' ? '#8a3e22' : SHELL.INK_MID,
        border: `1px solid ${type === 'source' ? '#e8bfa5' : SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {type === 'source' ? 'Source event' : 'Program'}
    </span>
  );
}

// ─── Template card ─────────────────────────────────────────────────────────────

function templateStatus(t: TemplateResult): 'active' | 'resolved' | 'not-fired' {
  if (t.resolved) return 'resolved';
  if (t.fired) return 'active';
  return 'not-fired';
}

function TemplateCard({ template }: { template: TemplateResult }) {
  const status = templateStatus(template);

  const cardBorder =
    status === 'active'
      ? `1px solid #d4917a`
      : status === 'resolved'
        ? `1px solid ${SHELL.MINT_LINE}`
        : `1px solid ${SHELL.CARD_LINE}`;

  const cardBg =
    status === 'active'
      ? SHELL.RUST_BG
      : status === 'resolved'
        ? SHELL.MINT_BG
        : SHELL.PAPER;

  const textMuted: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    color: status === 'not-fired' ? SHELL.INK_MUTED : SHELL.INK_SOFT,
  };

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        opacity: status === 'not-fired' ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap' as const,
          gap: 6,
          marginBottom: 6,
        }}
      >
        <code
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            background: `${COLORS.white}80`,
            borderRadius: RADIUS.sm,
            padding: '1px 5px',
          }}
        >
          {template.templateId}
        </code>
        <SeverityBadge severity={template.severity} />
        <StatusBadge status={status} />
        {template.confidence !== null && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: SHELL.INK_SOFT,
            }}
          >
            {Math.round(template.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: status === 'not-fired' ? SHELL.INK_MUTED : SHELL.INK,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        {template.label}
      </div>

      {/* Parties */}
      <div style={{ ...textMuted, marginBottom: 6 }}>
        {template.partyA} <span style={{ opacity: 0.5 }}>vs</span> {template.partyB}
      </div>

      {/* Detection hint */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: SHELL.INK_MUTED,
          fontStyle: 'italic',
          marginBottom: template.triggeringEvidence.length > 0 ? 8 : 0,
          lineHeight: 1.5,
        }}
      >
        Hint: {template.detectionHint}
      </div>

      {/* Triggering evidence */}
      {template.triggeringEvidence.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              color: SHELL.INK_SOFT,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            Evidence matched ({template.triggeringEvidence.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {template.triggeringEvidence.map((ev) => (
              <span
                key={ev.field}
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: SHELL.INK_MID,
                  background: `${COLORS.white}80`,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: RADIUS.sm,
                  padding: '2px 7px',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                }}
                title={`${ev.field}: ${ev.value}`}
              >
                {ev.field}: {ev.value.slice(0, 40)}{ev.value.length > 40 ? '…' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resolution path — only shown for active/resolved */}
      {(status === 'active' || status === 'resolved') && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Resolution: {template.resolutionPath}
        </div>
      )}
    </div>
  );
}

// ─── Template group section ────────────────────────────────────────────────────

function TemplateGroup({
  title,
  count,
  templates,
  defaultOpen,
}: {
  title: string;
  count: number;
  templates: TemplateResult[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (templates.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: open ? 10 : 0,
          width: '100%',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            background: SHELL.PAPER_DEEP,
            borderRadius: RADIUS.pill,
            padding: '1px 8px',
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            marginLeft: 'auto',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map((t) => (
            <div key={t.templateId}>
              {TemplateCard({ template: t })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ result }: { result: InstanceDebugResult }) {
  const total = result.templates.length;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
        gap: 16,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        marginBottom: SPACING.md,
      }}
    >
      <TypeBadge type={result.instanceType} />
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        {result.instanceId}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        Pattern:{' '}
        <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{result.patternId}</code>
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        Stage: <strong>{result.currentStage}</strong>
      </span>

      <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.RUST_TEXT,
            background: SHELL.RUST_BG,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          {result.activeCount} active
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.MINT_TEXT,
            background: SHELL.MINT_BG,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          {result.resolvedCount} resolved
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.GRAY_TEXT,
            background: SHELL.GRAY_BG,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          {result.notFiredCount} not triggered
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {total} templates total
        </span>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export function ContradictionDebugClient({ instanceResults }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    instanceResults[0]?.instanceId ?? '',
  );

  const selected = instanceResults.find((r) => r.instanceId === selectedId);

  const activeTemplates = selected?.templates.filter(
    (t) => t.fired && !t.resolved,
  ) ?? [];
  const resolvedTemplates = selected?.templates.filter((t) => t.resolved) ?? [];
  const notFiredTemplates = selected?.templates.filter(
    (t) => !t.fired && !t.resolved,
  ) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {/* Instance selector */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
        }}
      >
        <label
          htmlFor="instance-select"
          style={{
            display: 'block',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Select instance
        </label>
        <select
          id="instance-select"
          value={selectedId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedId(e.target.value)}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: SHELL.INK,
            background: SHELL.PAPER,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.sm,
            padding: '7px 12px',
            width: '100%',
            maxWidth: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {instanceResults.map((r) => (
            <option key={r.instanceId} value={r.instanceId}>
              [{r.instanceType === 'source' ? 'Source' : 'Program'}]{' '}
              {r.instanceLabel} — {r.activeCount} active, {r.resolvedCount} resolved
            </option>
          ))}
        </select>
      </div>

      {/* Instance detail */}
      {selected && (
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.lg}`,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {/* Instance title + summary strip */}
          <div>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                fontWeight: 700,
                color: SHELL.INK,
                letterSpacing: '-0.02em',
                margin: `0 0 ${SPACING.sm}`,
              }}
            >
              {selected.instanceLabel}
            </h2>
            <SummaryStrip result={selected} />
          </div>

          {/* Active contradictions */}
          <TemplateGroup
            title="Active contradictions"
            count={activeTemplates.length}
            templates={activeTemplates}
            defaultOpen={true}
          />

          {/* Resolved */}
          <TemplateGroup
            title="Resolved"
            count={resolvedTemplates.length}
            templates={resolvedTemplates}
            defaultOpen={true}
          />

          {/* Not triggered */}
          <TemplateGroup
            title="Not triggered"
            count={notFiredTemplates.length}
            templates={notFiredTemplates}
            defaultOpen={false}
          />

          {/* Empty state */}
          {selected.templates.length === 0 && (
            <p
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: SHELL.INK_MUTED,
                margin: 0,
              }}
            >
              No contradiction templates found for pattern{' '}
              <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
                {selected.patternId}
              </code>
              .
            </p>
          )}
        </div>
      )}

      {/* Empty: no instances */}
      {instanceResults.length === 0 && (
        <div
          style={{
            background: COLORS.white,
            border: `1px dashed ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: SHELL.INK_MUTED,
          }}
        >
          No instances found.
        </div>
      )}
    </div>
  );
}
