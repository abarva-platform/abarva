'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { PressureDetail } from '@/lib/tower/shell-tower-fixture';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PressureDetailPageProps {
  detail: PressureDetail;
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function severityDotColor(severity: PressureDetail['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}

function severityLabelColor(severity: PressureDetail['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function deltaColor(detail: PressureDetail): string {
  if (detail.deltaDir === 'down') return SHELL.MINT_TEXT;
  if (detail.deltaDir === 'up') {
    if (detail.severity === 'high') return SHELL.RUST_TEXT;
    return SHELL.PEACH_TEXT;
  }
  return SHELL.INK_MUTED;
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: PressureDetail['status'] }) {
  const bg =
    status === 'active'
      ? SHELL.RUST_BG
      : status === 'watching'
        ? SHELL.PEACH_BG
        : SHELL.MINT_BG;
  const color =
    status === 'active'
      ? SHELL.RUST_TEXT
      : status === 'watching'
        ? SHELL.PEACH_TEXT
        : SHELL.MINT_TEXT;
  const label =
    status === 'active' ? 'Active' : status === 'watching' ? 'Watching' : 'Resolved';

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 10,
        background: bg,
        color,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: SHELL.INK_MUTED,
        marginBottom: 10,
        marginTop: 28,
      }}
    >
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actor glyph
// ---------------------------------------------------------------------------

function ActorGlyph({ actor }: { actor: string }) {
  const initials = actor
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: SHELL.PAPER_DEEP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8,
          color: SHELL.INK,
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PressureDetailPage({ detail }: PressureDetailPageProps) {
  const dColor = deltaColor(detail);
  const dotColor = severityDotColor(detail.severity);
  const labelColor = severityLabelColor(detail.severity);
  const atlasBg = detail.severity === 'high' ? SHELL.RUST_BG : SHELL.GRAY_BG;
  const atlasBorder = detail.severity === 'high' ? SHELL.PEACH_LINE : SHELL.GRAY_LINE;
  const atlasColor = detail.severity === 'high' ? SHELL.RUST_TEXT : SHELL.GRAY_TEXT;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Control Tower · ${detail.title}`,
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Control Tower' }}
        quote={detail.agentQuote}
        agentContext={detail.agentContext}
        actions={detail.actions}
        surface="tower"
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          {/* Back link */}
          <Link
            href="/tower"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 12,
            }}
          >
            ← All pressures
          </Link>

          {/* Severity row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            {/* Severity dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: labelColor,
              }}
            >
              {detail.severity}
            </span>
            <StatusPill status={detail.status} />
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {detail.title}
          </h1>

          {/* Hero stat row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              marginTop: 12,
              background: SHELL.PAPER_SOFT,
              borderRadius: 10,
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{
                    fontFamily: SHELL.SERIF,
                    fontSize: 28,
                    fontWeight: 700,
                    color: SHELL.INK,
                    lineHeight: 1,
                  }}
                >
                  {detail.heroStat}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK_SOFT,
                    lineHeight: 1.3,
                  }}
                >
                  {detail.heroLabel}
                </span>
              </div>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: SHELL.INK_MUTED,
                  marginTop: 4,
                }}
              >
                {detail.topDriver}
              </span>
            </div>

            {/* Delta badge pushed to the right */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: dColor,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {detail.delta}
            </span>
          </div>
        </div>

        {/* ── Atlas note ── */}
        <div
          style={{
            background: atlasBg,
            border: `1px solid ${atlasBorder}`,
            borderRadius: 8,
            padding: '12px 16px',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: atlasColor,
              lineHeight: 1.55,
            }}
          >
            {detail.atlasSentence}
          </span>
        </div>

        {/* ── Timeline ── */}
        <SectionHeader label="Activity" />
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {detail.timeline.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 14,
                padding: '8px 16px',
                borderBottom:
                  i < detail.timeline.length - 1
                    ? `1px solid ${SHELL.CARD_LINE_SOFT}`
                    : undefined,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  minWidth: 40,
                  flexShrink: 0,
                }}
              >
                {row.date}
              </span>
              <ActorGlyph actor={row.actor} />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  flex: 1,
                  lineHeight: 1.45,
                }}
              >
                {row.event}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  flexShrink: 0,
                }}
              >
                {row.actor}
              </span>
            </div>
          ))}
        </div>

        {/* ── Related programs ── */}
        {detail.relatedPrograms.length > 0 && (
          <>
            <SectionHeader label="Related programs" />
            <div
              style={{
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {detail.relatedPrograms.map((prog, i) => (
                <div
                  key={prog.displayId}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom:
                      i < detail.relatedPrograms.length - 1
                        ? `1px solid ${SHELL.CARD_LINE_SOFT}`
                        : undefined,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      flexShrink: 0,
                    }}
                  >
                    {prog.displayId}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.SERIF,
                      fontSize: 13,
                      color: SHELL.INK,
                      flex: 1,
                    }}
                  >
                    {prog.name}
                  </span>
                  <Link
                    href={prog.href}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_SOFT,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
