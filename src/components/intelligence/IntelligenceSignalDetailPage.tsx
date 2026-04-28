// I3 · INT-DTL-SIGNAL — Server-component Intelligence signal detail page.
//
// Canonical signal detail surface for /intelligence/signals/[signalId].
// Built server-side via buildIntelligenceSignalDetailView().
//
// Key I3 additions:
//   • IntelligenceProvenanceRibbon anchored below page header
//   • Affected patterns + programs chips
//   • Source metadata panel (confidence, TTL, observedAt, ingestedAt)
//   • Server component — no useState, no client hooks
//   • Client island: IntelligenceSignalDetailSentinel (AgentColumn only)
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceSignalDetailSentinel } from '@/components/intelligence/IntelligenceSignalDetailSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceSignalDetailView } from '@/lib/intelligence/intelligence-signal-detail-view';

// ─── Source type color map (same tokens as index) ─────────────────────────────

const SOURCE_COLOR = {
  vendor_announcement: { bg: SHELL.BLUE_BG,  text: '#2a4a7a', border: SHELL.BLUE_LINE },
  regulatory:          { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, border: SHELL.PEACH_LINE },
  analyst:             { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT,  border: SHELL.MINT_LINE },
  manual_curated:      { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT,  border: SHELL.GRAY_LINE },
} as const;

// ─── Metadata panel ───────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: SHELL.SANS,
          color: SHELL.INK_MUTED,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: SHELL.MONO,
          color: SHELL.INK,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Affected entity chips ────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: { bg: string; text: string; border: string } }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 10,
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        fontSize: 11,
        fontFamily: SHELL.MONO,
        fontWeight: 600,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceSignalDetailPageProps {
  view: IntelligenceSignalDetailView;
}

export function IntelligenceSignalDetailPage({ view }: IntelligenceSignalDetailPageProps) {
  const sourceColor = SOURCE_COLOR[view.sourceType];

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · Signal · ${view.signalId.toUpperCase()}`,
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceSignalDetailSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
        signalId={view.signalId}
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
          <Link href="/intelligence/signals" style={{ color: SHELL.INK_MUTED, textDecoration: 'none' }}>
            Signal Stream
          </Link>
          {' / '}
          <span style={{ color: SHELL.INK_SOFT, fontFamily: SHELL.MONO }}>{view.signalId.toUpperCase()}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          {/* ID + source type badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: SHELL.MONO,
                color: SHELL.INK_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {view.signalId.toUpperCase()}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 10,
                background: sourceColor.bg,
                border: `1px solid ${sourceColor.border}`,
                color: sourceColor.text,
                fontSize: 11,
                fontFamily: SHELL.SANS,
                fontWeight: 600,
              }}
            >
              {view.sourceTypeLabel}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 10,
                background: SHELL.MINT_BG,
                border: `1px solid ${SHELL.MINT_LINE}`,
                color: SHELL.MINT_TEXT,
                fontSize: 11,
                fontFamily: SHELL.MONO,
                fontWeight: 600,
              }}
            >
              {view.confidenceLabel} confidence
            </span>
          </div>

          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 26,
              fontWeight: 400,
              color: SHELL.INK,
              margin: 0,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {view.title}
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MUTED,
              margin: 0,
            }}
          >
            {view.sourceName}
          </p>
        </div>

        {/* ProvenanceRibbon */}
        <div style={{ margin: '20px 0' }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Summary */}
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: SHELL.SANS,
              fontWeight: 700,
              color: SHELL.INK_MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            Summary
          </div>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {view.summary}
          </p>
        </div>

        {/* Metadata */}
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            padding: '16px 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: SHELL.SANS,
              fontWeight: 700,
              color: SHELL.INK_MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            Signal Metadata
          </div>
          <MetaRow label="Observed at" value={view.observedAt} />
          <MetaRow label="Ingested at" value={view.ingestedAt} />
          <MetaRow label="Confidence" value={view.confidenceLabel} />
          <MetaRow label="TTL" value={`${view.ttlDays} days`} />
          <div style={{ borderBottom: 'none' }}>
            <MetaRow label="Source URL" value={view.sourceUrl.slice(0, 60) + (view.sourceUrl.length > 60 ? '…' : '')} />
          </div>
        </div>

        {/* Affected patterns */}
        {view.affectedPatternIds.length > 0 && (
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '16px 24px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: SHELL.SANS,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Affected Patterns ({view.affectedPatternIds.length})
            </div>
            <div data-testid="affected-patterns">
              {view.affectedPatternIds.map((id) => (
                <Chip
                  key={id}
                  label={id}
                  color={{ bg: SHELL.BLUE_BG, text: '#2a4a7a', border: SHELL.BLUE_LINE }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Affected programs */}
        {view.affectedProgramIds.length > 0 && (
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '16px 24px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: SHELL.SANS,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Affected Programs ({view.affectedProgramIds.length})
            </div>
            <div>
              {view.affectedProgramIds.map((id) => (
                <Chip
                  key={id}
                  label={id}
                  color={{ bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, border: SHELL.PEACH_LINE }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Honest disclaimer */}
        <div
          style={{
            fontSize: 11,
            fontFamily: SHELL.SANS,
            color: SHELL.INK_MUTED,
            borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            paddingTop: 16,
            lineHeight: 1.5,
          }}
        >
          {view.honestDisclaimer}
        </div>
      </div>
      </div>
    </AppShell>
  );
}
