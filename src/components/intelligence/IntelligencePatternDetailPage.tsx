// I2 · INT-DTL-PATTERN — Server-component Intelligence pattern detail page.
//
// Canonical reading layout for /intelligence/[patternId]. Replaces the
// 'use client' PatternDetailPage removed in I2.
//
// Key I2 additions:
//   • IntelligenceProvenanceRibbon anchored below the pattern header
//   • Correct pattern content per patternId (PatternDetailPage was hardcoded
//     to T3-H01 regardless of which pattern was requested)
//   • Server component — no useState, no client hooks
//   • Client island: IntelligencePatternDetailSentinel (AgentColumn only)
//
// No live model calls, no network IO, no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligencePatternDetailSentinel } from '@/components/intelligence/IntelligencePatternDetailSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligencePatternDetailView } from '@/lib/intelligence/intelligence-pattern-detail-view';
import { buildPatternActionCanvasView } from '@/lib/intelligence/pattern-action-canvas-view';

// ─── Status / tier pills ──────────────────────────────────────────────────────

const STATUS_MAP = {
  validated: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Validated' },
  'in-review': { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'In review' },
  candidate: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Candidate' },
  deprecated: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Deprecated' },
};

const TIER_MAP = {
  T3: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'T3 · Use-case' },
  T2: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'T2 · Capability' },
  T1: { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'T1 · Foundation' },
};

const CONFIDENCE_MAP = {
  high: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
  medium: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  low: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT },
};

// ─── Sentinel verdict card ────────────────────────────────────────────────────

function SentinelVerdictCard({
  verdict,
  status,
}: {
  verdict: IntelligencePatternDetailView['verdict'];
  status: IntelligencePatternDetailView['status'];
}) {
  const isDeprecated = status === 'deprecated';
  const bg = isDeprecated ? SHELL.RUST_BG : SHELL.MINT_BG;
  const border = isDeprecated ? '#d4a090' : SHELL.MINT_LINE;
  const labelColor = isDeprecated ? SHELL.RUST_TEXT : SHELL.MINT_TEXT;
  const conf = CONFIDENCE_MAP[verdict.confidence];

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '20px',
        maxWidth: 720,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        {/* Sn glyph */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: labelColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1,
            }}
          >
            Sn
          </span>
        </div>

        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: labelColor,
            flex: 1,
          }}
        >
          Sentinel Verdict
        </span>

        {/* Status pill */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: labelColor,
            color: '#fff',
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.6,
            textTransform: 'capitalize',
          }}
        >
          {STATUS_MAP[status]?.label ?? status}
        </span>

        {/* Confidence badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: conf.bg,
            color: conf.text,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          {verdict.confidence} confidence
        </span>
      </div>

      {/* Date + evidence count */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          marginBottom: 10,
          letterSpacing: '0.04em',
        }}
      >
        {verdict.verdictDate} · {verdict.evidenceSources} evidence source(s) reviewed
      </div>

      {/* Note */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {verdict.note}
      </p>
    </div>
  );
}

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceSection({
  row,
  isLast,
}: {
  row: IntelligencePatternDetailView['evidenceRows'][number];
  isLast: boolean;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 17,
          fontWeight: 700,
          color: SHELL.INK,
          margin: '0 0 8px',
          lineHeight: 1.3,
        }}
      >
        {row.heading}
      </h2>
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 15,
          color: SHELL.INK,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {row.body}
      </p>
      {!isLast && (
        <div
          style={{
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            margin: '24px 0',
          }}
        />
      )}
    </div>
  );
}

// ─── Using programs ───────────────────────────────────────────────────────────

function UsingProgramsSection({
  programs,
}: {
  programs: IntelligencePatternDetailView['usingPrograms'];
}) {
  if (programs.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 36,
        padding: '20px 24px',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        maxWidth: 720,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        Programs applying this pattern · {programs.length}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {programs.map((prog) => (
          <div
            key={prog.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              paddingBottom: 8,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
                minWidth: 100,
                marginTop: 2,
              }}
            >
              {prog.displayId}
            </span>
            <div style={{ flex: 1 }}>
              <Link
                href={prog.href}
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  color: SHELL.INK,
                  textDecoration: 'none',
                }}
              >
                {prog.name}
              </Link>
              {prog.context && (
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 11,
                    color: SHELL.INK_MUTED,
                    marginTop: 2,
                    lineHeight: 1.4,
                    fontStyle: 'italic',
                  }}
                >
                  {prog.context}
                </div>
              )}
            </div>
            {prog.phaseLabel && (
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  color: SHELL.INK_SOFT,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {prog.phaseLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Action canvas ────────────────────────────────────────────────────────────

const PRIORITY_STYLE = {
  immediate: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'Immediate' },
  this_week: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'This week' },
  this_month: { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'This month' },
  backlog: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Backlog' },
};

const ACTION_STATUS_STYLE = {
  open: { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'Open' },
  in_progress: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'In progress' },
  blocked: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'Blocked' },
  done: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Done' },
};

function ActionCanvasSection({
  patternId,
  patternName,
}: {
  patternId: string;
  patternName: string;
}) {
  const canvas = buildPatternActionCanvasView(patternId, patternName);
  if (!canvas.hasActions) return null;

  return (
    <div
      style={{ marginTop: 36, maxWidth: 720 }}
      data-testid="intelligence-action-canvas"
    >
      {/* Section eyebrow */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        Action Canvas · {canvas.actions.length} action{canvas.actions.length !== 1 ? 's' : ''}
      </div>

      {/* Atlas synthesis */}
      {canvas.atlasSynthesis && (
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            lineHeight: 1.6,
            margin: '0 0 20px',
          }}
        >
          {canvas.atlasSynthesis}
        </p>
      )}

      {/* Action items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {canvas.actions.map((action) => {
          const prio = PRIORITY_STYLE[action.priority];
          const stat = ACTION_STATUS_STYLE[action.status];
          return (
            <div
              key={action.actionId}
              data-testid={`intelligence-action-canvas-item-${action.actionId}`}
              style={{
                padding: '16px 20px',
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 8,
              }}
            >
              {/* Title + badge row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    fontWeight: 600,
                    color: SHELL.INK,
                    lineHeight: 1.4,
                  }}
                >
                  {action.title}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: prio.bg,
                    color: prio.text,
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prio.label}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: stat.bg,
                    color: stat.text,
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stat.label}
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK_SOFT,
                  lineHeight: 1.55,
                  margin: '0 0 10px',
                }}
              >
                {action.description}
              </p>

              {/* Meta: owner, deadline, context link */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                }}
              >
                <span>Owner: {action.owner}</span>
                <span>Due: {action.deadline}</span>
                {action.contextLink && (
                  <span style={{ color: SHELL.INK_SOFT, fontStyle: 'italic' }}>
                    → {action.contextLink}
                  </span>
                )}
              </div>

              {/* Blocker note */}
              {action.blockerNote && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    background: SHELL.RUST_BG,
                    borderRadius: 6,
                    fontFamily: SHELL.SANS,
                    fontSize: 11,
                    color: SHELL.RUST_TEXT,
                    lineHeight: 1.5,
                  }}
                >
                  Blocked: {action.blockerNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Honest disclaimer */}
      <div
        style={{
          marginTop: 16,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
        }}
        data-testid="intelligence-action-canvas-disclaimer"
        data-honest-disclaimer="intelligence-action-canvas"
      >
        Deterministic seed · Action canvas reflects fixture context for the Apex Retail engagement.
        Live action tracking and deadline management are deferred to the programme action management module.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligencePatternDetailPageProps {
  view: IntelligencePatternDetailView;
}

export function IntelligencePatternDetailPage({
  view,
}: IntelligencePatternDetailPageProps) {
  const tierMeta = TIER_MAP[view.tier];
  const statusMeta = STATUS_MAP[view.status];

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · ${view.patternKey} · ${view.patternName}`,
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligencePatternDetailSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
        patternKey={view.patternKey}
      />

      {/* Main reading area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px',
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href={view.intelligenceLandingHref}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            ← Pattern Library
          </Link>
        </div>

        {/* Pattern header */}
        <div style={{ maxWidth: 720, marginBottom: 20 }}>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            {view.tier} · {tierMeta?.label ?? view.tier} · {statusMeta?.label ?? view.status}
          </div>

          {/* Pattern key */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            {view.patternKey}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {view.patternName}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: tierMeta?.bg,
                color: tierMeta?.text,
                fontFamily: SHELL.MONO,
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.5,
              }}
            >
              {tierMeta?.label ?? view.tier}
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: statusMeta?.bg,
                color: statusMeta?.text,
                fontFamily: SHELL.SANS,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              {statusMeta?.label ?? view.status}
            </span>
            {view.lastReviewed !== '—' && (
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                }}
              >
                Reviewed {view.lastReviewed}
              </span>
            )}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {view.usedInPrograms} program{view.usedInPrograms !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── I2: Provenance ribbon ── */}
        <div style={{ maxWidth: 720, marginBottom: 28 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Sentinel verdict card */}
        <div style={{ marginBottom: 36 }}>
          <SentinelVerdictCard verdict={view.verdict} status={view.status} />
        </div>

        {/* Evidence rows (reading sections) */}
        <div
          style={{ maxWidth: 720 }}
          data-testid="evidence-sections"
          aria-label={`Pattern evidence · ${view.evidenceRows.length} section(s)`}
        >
          {view.evidenceRows.map((row, i) => (
            <EvidenceSection
              key={row.id}
              row={row}
              isLast={i === view.evidenceRows.length - 1}
            />
          ))}
        </div>

        {/* Programs using this pattern */}
        <UsingProgramsSection programs={view.usingPrograms} />

        {/* INT2: Action canvas */}
        <ActionCanvasSection patternId={view.patternKey} patternName={view.patternName} />

        {/* Honest disclaimer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            maxWidth: 720,
          }}
        >
          {view.honestDisclaimer}
        </div>
      </div>
    </AppShell>
  );
}
