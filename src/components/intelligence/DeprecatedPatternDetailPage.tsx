'use client';

// Shell-native Intelligence deprecated pattern detail reading view.
// INT-DTL-DEPRECATED: T2-C03 Rules-Based Recommendation Engine

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { T2_C03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-deprecated-fixture';

// ─── Sentinel verdict card (deprecated) ──────────────────────────────────────

function SentinelVerdictCard() {
  const v = T2_C03_PATTERN.sentinelVerdict;
  return (
    <div
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid #d4a090`,
        borderRadius: 10,
        padding: '20px',
        maxWidth: 720,
        marginTop: 24,
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
            background: SHELL.RUST_TEXT,
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

        {/* Label */}
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.RUST_TEXT,
            flex: 1,
          }}
        >
          Sentinel Verdict
        </span>

        {/* Deprecated pill */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: SHELL.RUST_TEXT,
            color: '#fff',
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          Deprecated
        </span>

        {/* Confidence badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(138,62,34,0.12)',
            color: SHELL.RUST_TEXT,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          High confidence
        </span>
      </div>

      {/* Date + evidence */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          marginBottom: 10,
          letterSpacing: '0.04em',
        }}
      >
        {v.verdictDate} · {v.evidenceSources} evidence sources reviewed
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
        {v.note}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DeprecatedPatternDetailPage() {
  const pattern = T2_C03_PATTERN;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · ${pattern.id} · ${pattern.name}`,
      }}
      middleStrip={
        <FilterPillStrip
          pills={[
            { key: 'all', label: 'All' },
            { key: 't2', label: 'T2 · Capability', active: true },
          ]}
        />
      }
    >
      {/* Sentinel column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={pattern.agentQuote}
        agentContext={pattern.agentContext}
        actions={pattern.actions}
        surface="intelligence"
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
            href="/intelligence"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK_MUTED;
            }}
          >
            ← Pattern Library
          </Link>
        </div>

        {/* Pattern header */}
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
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
            {pattern.tier} · Capability pattern · {pattern.status}
          </div>

          {/* ID */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            {pattern.id}
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
            {pattern.name}
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
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              Reviewed {pattern.lastReviewed}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {pattern.usedInPrograms} programs
            </span>
            {/* Status pill */}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: SHELL.GRAY_BG,
                color: SHELL.GRAY_TEXT,
                fontFamily: SHELL.SANS,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              Deprecated
            </span>
          </div>
        </div>

        {/* Sentinel verdict card (deprecation notice first) */}
        <SentinelVerdictCard />

        {/* Reading sections */}
        <div style={{ maxWidth: 720, marginTop: 40 }}>
          {pattern.sections.map((section, i) => (
            <div key={section.heading}>
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
                {section.heading}
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
                {section.body}
              </p>
              {i < pattern.sections.length - 1 && (
                <div
                  style={{
                    borderTop: `1px solid ${SHELL.CARD_LINE}`,
                    margin: '24px 0',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
