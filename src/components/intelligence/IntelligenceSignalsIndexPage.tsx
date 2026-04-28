// I3 · INT-IDX-SIGNALS — Server-component Intelligence signal stream index page.
//
// Canonical signal stream surface for /intelligence/signals.
// Built server-side via buildIntelligenceSignalsIndexView().
//
// Key I3 additions:
//   • IntelligenceProvenanceRibbon anchored below page header
//   • Signal rows link to INT-DTL-SIGNAL detail pages
//   • Source-type breakdown chips
//   • Server component — no useState, no client hooks
//   • Client island: IntelligenceSignalsSentinel (AgentColumn only)
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceSignalsSentinel } from '@/components/intelligence/IntelligenceSignalsSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  IntelligenceSignalsIndexView,
  SignalRowView,
  SignalSourceTypeSummary,
} from '@/lib/intelligence/intelligence-signals-index-view';

// ─── Source type color map ────────────────────────────────────────────────────

const SOURCE_COLOR = {
  vendor_announcement: { bg: SHELL.BLUE_BG,  text: '#2a4a7a', border: SHELL.BLUE_LINE },
  regulatory:          { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, border: SHELL.PEACH_LINE },
  analyst:             { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT,  border: SHELL.MINT_LINE },
  manual_curated:      { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT,  border: SHELL.GRAY_LINE },
} as const;

// ─── Source breakdown chips ───────────────────────────────────────────────────

function SourceTypeSummary({ summary }: { summary: SignalSourceTypeSummary }) {
  const items = [
    { key: 'vendor_announcement' as const, label: 'Vendor', count: summary.vendor_announcement },
    { key: 'regulatory' as const,          label: 'Regulatory', count: summary.regulatory },
    { key: 'analyst' as const,             label: 'Analyst', count: summary.analyst },
    { key: 'manual_curated' as const,      label: 'Curated', count: summary.manual_curated },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
      }}
    >
      {items.map((item) => {
        const color = SOURCE_COLOR[item.key];
        return (
          <div
            key={item.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: color.bg,
              border: `1px solid ${color.border}`,
              fontSize: 12,
              fontFamily: SHELL.SANS,
              color: color.text,
              fontWeight: 500,
            }}
          >
            <span>{item.label}</span>
            <span
              style={{
                background: color.text,
                color: color.bg,
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Signal row card ──────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: SignalRowView }) {
  const color = SOURCE_COLOR[signal.sourceType];

  return (
    <Link
      href={signal.href}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}
    >
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '14px 20px',
        }}
      >
        {/* Top row: source type + confidence + date */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: SHELL.MONO,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {signal.id}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              background: color.bg,
              border: `1px solid ${color.border}`,
              color: color.text,
              fontSize: 11,
              fontFamily: SHELL.SANS,
              fontWeight: 600,
            }}
          >
            {signal.sourceTypeLabel}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              background: SHELL.MINT_BG,
              border: `1px solid ${SHELL.MINT_LINE}`,
              color: SHELL.MINT_TEXT,
              fontSize: 11,
              fontFamily: SHELL.MONO,
              fontWeight: 600,
            }}
          >
            {signal.confidenceLabel}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontFamily: SHELL.SANS,
              color: SHELL.INK_MUTED,
            }}
          >
            {signal.observedAt}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontWeight: 600,
            fontSize: 14,
            color: SHELL.INK,
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          {signal.title}
        </div>

        {/* Footer: source name + pattern count */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: SHELL.SANS,
              color: SHELL.INK_SOFT,
            }}
          >
            {signal.sourceName}
          </span>
          {signal.affectedPatternCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontFamily: SHELL.SANS,
                color: SHELL.INK_MUTED,
              }}
            >
              {signal.affectedPatternCount} pattern{signal.affectedPatternCount !== 1 ? 's' : ''} affected
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceSignalsIndexPageProps {
  view: IntelligenceSignalsIndexView;
}

export function IntelligenceSignalsIndexPage({ view }: IntelligenceSignalsIndexPageProps) {
  const firstSignalId = view.signals[0]?.id;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Signal Stream',
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceSignalsSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
        firstSignalId={firstSignalId}
      />

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '32px 48px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 64px' }}>
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: 12,
            fontFamily: SHELL.SANS,
            color: SHELL.INK_MUTED,
            marginBottom: 16,
          }}
        >
          <Link href="/intelligence" style={{ color: SHELL.INK_MUTED, textDecoration: 'none' }}>
            Intelligence
          </Link>
          {' / '}
          <span style={{ color: SHELL.INK_SOFT }}>Signal Stream</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 400,
              color: SHELL.INK,
              margin: 0,
              marginBottom: 6,
            }}
          >
            Signal Stream
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_SOFT,
              margin: 0,
              marginBottom: 16,
            }}
          >
            {view.totalSignals} signals · vendor announcements, regulatory notices, analyst observations, and curated intelligence
          </p>
        </div>

        {/* ProvenanceRibbon */}
        <div style={{ marginBottom: 20 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Source type breakdown */}
        <SourceTypeSummary summary={view.bySourceType} />

        {/* Signal rows */}
        <div data-testid="signal-stream">
          {view.signals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>
      </div>
      </div>
    </AppShell>
  );
}
