'use client';

// Intelligence v3 · top-level page.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
//       docs/design-canon/wireframe-intelligence-v3-2026-05-07.html
//
// Reframes the Intelligence surface as a pattern-to-Move funnel with
// Sentinel chat as a first-class, three-mode layout. v1 ships:
//   - Today canvas with substrate-bound blocks (currently fixture data)
//   - 7-stage tab nav (only Today canvas implemented in this slice)
//   - Three-mode chat shell (side rail · bottom expanded · collapsed)
//   - Tower link removed from this page's nav per §2.6 / Q5
//
// Deferred (next waves):
//   - 6 other stages get content
//   - Real tenant binding via AgentContextBroker
//   - LLM hookup behind Sentinel chat
//   - Chat-driven page state (Move cards mutate per conversation)
//   - Shape-into-Move click → Strategic Moves originate flow

import { useState } from 'react';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
import { IntelligenceV3TopNav } from './IntelligenceV3TopNav';
import { IntelligenceV3StageTabs } from './IntelligenceV3StageTabs';
import { TodayCanvas } from './TodayCanvas';
import { VendorsCanvas } from './VendorsCanvas';
import { SentinelChat } from './SentinelChat';
import { FIRST_CAPITAL_DEMO } from './demo-data';
import type { IntelligenceV3PageData, StageKey } from './types';
import type { VendorsData } from '@/lib/intelligence-v3/vendors-data';

interface Props {
  /** Server-side composed page data. Defaults to the demo fixture. */
  data?: IntelligenceV3PageData;
  /** True when `data` reflects real DB substrate; false for fallback. */
  isLiveBound?: boolean;
  /** Vendors stage data — null when not loaded. */
  vendorsData?: VendorsData | null;
}

export function IntelligenceV3Page({
  data: dataProp,
  isLiveBound = false,
  vendorsData = null,
}: Props = {}) {
  const data = dataProp ?? FIRST_CAPITAL_DEMO;
  const [stage, setStage] = useState<StageKey>('today');

  return (
    <div
      data-testid="intelligence-v3-page"
      style={{
        minHeight: '100vh',
        background: COLORS.surface,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      <IntelligenceV3TopNav tenantName={data.tenantName} />

      {!isLiveBound && (
        <div
          role="status"
          style={{
            background: COLORS.surface2,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: `${SPACING.xs}px ${SPACING.lg}px`,
            fontFamily: FONT.body,
            fontSize: 11,
            color: COLORS.muted,
            textAlign: 'center',
          }}
        >
          Demo content shown · {data.tenantName} substrate not yet bound
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 440px',
          alignItems: 'start',
        }}
      >
        <main
          style={{
            padding: `${SPACING.lg}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
            maxWidth: 1280,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
            paddingBottom: SPACING.xxxl + 56, // bottom gutter for any docked chat
          }}
        >
          <Hero data={data} />

          <IntelligenceV3StageTabs active={stage} onChange={setStage} />

          {stage === 'today' && <TodayCanvas data={data} />}
          {stage === 'vendors' && vendorsData && <VendorsCanvas data={vendorsData} />}
          {stage === 'vendors' && !vendorsData && <StageStub stage={stage} />}
          {stage !== 'today' && stage !== 'vendors' && <StageStub stage={stage} />}
        </main>

        <SentinelChat
          scopeLabel={`${data.tenantName} · this page`}
          opener={data.sentinelOpener}
          conversation={data.conversation}
        />
      </div>
    </div>
  );
}

function Hero({ data }: { data: typeof FIRST_CAPITAL_DEMO }) {
  return (
    <header
      style={{
        background: COLORS.surface2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: `${SPACING.lg}px ${SPACING.xl}px`,
        marginBottom: SPACING.lg,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.xs,
        }}
      >
        Intelligence · {data.tenantName}
      </div>
      <h1
        style={{
          fontFamily: FONT.body,
          fontSize: 26,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.xs,
        }}
      >
        What we&apos;re seeing across {data.tenantName.split(' ').slice(0, 2).join(' ')}.
      </h1>
      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          margin: 0,
        }}
      >
        {data.stats.patterns} patterns · {data.stats.contradictions} contradictions ·{' '}
        {data.stats.syntheses} synthesis ready · {data.refreshedLabel}
      </p>
    </header>
  );
}

function StageStub({ stage }: { stage: StageKey }) {
  return (
    <section
      data-testid={`stage-stub-${stage}`}
      style={{
        border: `1px dashed ${COLORS.border}`,
        background: COLORS.card,
        borderRadius: 8,
        padding: SPACING.xxl,
        textAlign: 'center',
        color: COLORS.muted,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.sm,
        }}
      >
        Stage · {stage}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 14, color: COLORS.body }}>
        Content for this stage ships in a follow-up wave. The Today
        stage has the v3 IA fully wired.
      </div>
    </section>
  );
}
