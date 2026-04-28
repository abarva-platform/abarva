'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_INDEX_VIEW, AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

export function SourceIndexPage() {
  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · AMS Vendor Consolidation 2026 · BAFO',
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage={AMS_SOURCE_EVENT.activeStage}
        />
      }
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Commercial Intelligence' }}
        quote={SOURCE_INDEX_VIEW.agentQuote}
        agentContext={SOURCE_INDEX_VIEW.agentContext}
        actions={SOURCE_INDEX_VIEW.actions}
        inputPlaceholder="Ask Nexus about this event..."
      />

      {/* Work pane */}
      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>

        {/* Event header section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            {AMS_SOURCE_EVENT.displayId} · ACTIVE EVENT
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 8px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {AMS_SOURCE_EVENT.name}
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: '0 0 8px 0',
              lineHeight: 1.5,
            }}
          >
            {AMS_SOURCE_EVENT.description}
          </p>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            Stage 7 of 10 · BAFO
          </div>
        </div>

        {/* Linked program chip */}
        <div style={{ marginBottom: 24 }}>
          <LinkedProgramChip
            direction="source-to-program"
            linkedId="APX-CDP-2026"
            linkedName="Apex Retail CDP Activation"
            linkedPhase="P2 Synthesis"
            href="/programs/apx-cdp-2026"
          />
        </div>

        {/* Vendor summary */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: SHELL.INK_MUTED,
              marginBottom: 8,
            }}
          >
            BAFO · 3 VENDORS SUBMITTED
          </div>

          {/* Vendor A */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor A — pricing $2.1M/yr · normalized baseline
          </div>

          {/* Vendor B — SOC-2 gap flagged, peach tint */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              background: `${SHELL.PEACH_BG}4d`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor B — pricing $2.3M/yr · SOC-2 gap flagged
          </div>

          {/* Vendor C — 14% below median, mint tint */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              background: `${SHELL.MINT_BG}4d`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor C — pricing $1.8M/yr · 14% below median
          </div>
        </div>

        {/* Program impact cross-link */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: '0 0 10px 0',
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            This sourcing event directly affects P3 Design scope for APX-CDP-2026. Vendor architecture
            decisions must be aligned before the Design gate clears.
          </p>
          <LinkedProgramChip
            direction="source-to-program"
            linkedId="APX-CDP-2026"
            linkedName="Apex Retail CDP Activation"
            linkedPhase="P2 Synthesis"
            href="/programs/apx-cdp-2026"
          />
        </div>

        {/* Risk flag */}
        <div
          style={{
            marginBottom: 24,
            background: `${SHELL.PEACH_BG}66`,
            borderLeft: `3px solid ${SHELL.PEACH_LINE}`,
            padding: '10px 14px',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.PEACH_TEXT,
            }}
          >
            ⚠ Steward flag: Vendor B SOC-2 Type II attestation gap · must resolve before Award stage
          </span>
        </div>

        {/* Action queue placeholder */}
        <div
          style={{
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              fontStyle: 'italic',
            }}
          >
            Source action queue — cross-vendor next moves · P15
          </span>
        </div>

      </div>
    </AppShell>
  );
}
