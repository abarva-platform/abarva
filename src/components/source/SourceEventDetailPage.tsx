'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { RibbonSynthesis } from '@/components/shell/RibbonSynthesis';
import type { StageId } from '@/lib/shell/atlas-page-state';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { WorkingPaneContainer } from '@/components/shell/WorkingPaneContainer';
import { sourceShapeResolver } from '@/lib/source/source-shape-resolver';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';
import { PatternChip } from '@/components/source/PatternChip';
import { buildSourceStorylineContext, matchStorylinePatterns } from '@/lib/intelligence/storyline-matcher';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  'Plan', 'RFI', 'Shortlist', 'RFP', 'Q&A',
  'Initial Bid', 'BAFO', 'Selection', 'Award', 'Onboard',
];
const CURRENT_STAGE = 'BAFO'; // index 6

const STEWARD_QUOTE =
  "AMS Vendor Consolidation 2026 is at Stage 7 BAFO. Three vendors submitted bids — Vendor B's SOC-2 report is outstanding, blocking full evaluation. Vendor A leads on total cost of ownership. Selection decision is linked to CDP scope confirmation in APX-CDP-2026.";

const STEWARD_CONTEXT = 'Steward · AMS Vendor Consolidation 2026 · BAFO · Apr 27 2026';

const STEWARD_ACTIONS = [
  {
    letter: 'A' as const,
    text: 'Compare BAFO submissions',
    detail: 'Full line-item comparison across Vendor A, B, C',
  },
  {
    letter: 'B' as const,
    text: 'Flag Vendor B blocker',
    detail: 'SOC-2 Type II outstanding — escalate to procurement contact',
  },
  {
    letter: 'C' as const,
    text: 'Link to CDP program',
    detail: 'Vendor selection affects CDP data architecture scope',
  },
];

// ─── WorkPane tabs ─────────────────────────────────────────────────────────────

type TabKey = 'bafo' | 'pricing' | 'risk' | 'signals' | 'program';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'bafo', label: 'BAFO Strategy' },
  { key: 'pricing', label: 'Pricing Normalization' },
  { key: 'risk', label: 'Risk Detection' },
  { key: 'signals', label: 'Signals Stream' },
  { key: 'program', label: 'Linked Program' },
];

// ─── Tab content components ───────────────────────────────────────────────────

function BafoStrategyTab() {
  const vendors = [
    {
      name: 'Vendor A · TechCorp',
      status: 'Submitted',
      statusColor: SHELL.MINT_TEXT,
      statusBg: SHELL.MINT_BG,
      pricingDelta: '−0% (baseline)',
      pricingDeltaSign: 'neutral' as const,
      riskScore: '2 / 10',
      riskColor: SHELL.MINT_TEXT,
    },
    {
      name: 'Vendor B · DataStream',
      status: 'Submitted',
      statusColor: SHELL.PEACH_TEXT,
      statusBg: SHELL.PEACH_BG,
      pricingDelta: '+9.5% above baseline',
      pricingDeltaSign: 'high' as const,
      riskScore: '7 / 10',
      riskColor: SHELL.PEACH_TEXT,
      flag: 'SOC-2 Type II outstanding',
    },
    {
      name: 'Vendor C · CloudBase',
      status: 'Submitted',
      statusColor: SHELL.MINT_TEXT,
      statusBg: SHELL.MINT_BG,
      pricingDelta: '−14% below median',
      pricingDeltaSign: 'low' as const,
      riskScore: '4 / 10',
      riskColor: SHELL.INK_SOFT,
    },
  ];

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        BAFO · 3 VENDORS ACTIVE
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '8px 12px',
            background: SHELL.GRAY_BG,
            borderRadius: '6px 6px 0 0',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderBottom: 'none',
          }}
        >
          {['Vendor', 'Status', 'Pricing Delta vs Baseline', 'Risk Score'].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: SHELL.INK_MUTED,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {vendors.map((v, i) => (
          <div key={v.name}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '12px 12px',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderTop: 'none',
                borderRadius: i === vendors.length - 1 ? '0 0 6px 6px' : 0,
                background: v.flag ? `${SHELL.PEACH_BG}33` : SHELL.CARD_WHITE,
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK,
                    fontWeight: 500,
                  }}
                >
                  {v.name}
                </div>
                {v.flag && (
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 11,
                      color: SHELL.PEACH_TEXT,
                      marginTop: 3,
                    }}
                  >
                    ⚠ {v.flag}
                  </div>
                )}
              </div>
              <div>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: v.statusColor,
                    background: v.statusBg,
                    padding: '3px 8px',
                    borderRadius: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {v.status}
                </span>
              </div>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 12,
                  color:
                    v.pricingDeltaSign === 'low'
                      ? SHELL.MINT_TEXT
                      : v.pricingDeltaSign === 'high'
                      ? SHELL.PEACH_TEXT
                      : SHELL.INK_SOFT,
                }}
              >
                {v.pricingDelta}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 12,
                  color: v.riskColor,
                }}
              >
                {v.riskScore}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          background: `${SHELL.PEACH_BG}66`,
          borderLeft: `3px solid ${SHELL.PEACH_LINE}`,
          padding: '10px 14px',
          borderRadius: '0 6px 6px 0',
        }}
      >
        <span
          style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.PEACH_TEXT }}
        >
          ⚠ Steward flag: Vendor B SOC-2 Type II attestation gap · must resolve before Award stage
        </span>
      </div>
    </div>
  );
}

function PricingNormalizationTab() {
  const lineItems = [
    { item: 'Application Management (Tier 1)', vendorA: '$480K', vendorB: '$520K', vendorC: '$410K' },
    { item: 'Application Management (Tier 2)', vendorA: '$680K', vendorB: '$740K', vendorC: '$590K' },
    { item: 'Infrastructure Operations', vendorA: '$320K', vendorB: '$380K', vendorC: '$310K' },
    { item: 'Governance & Reporting', vendorA: '$120K', vendorB: '$130K', vendorC: '$100K' },
    { item: 'Year 1 Transition', vendorA: '$500K', vendorB: '$530K', vendorC: '$390K' },
    { item: 'TOTAL (Annual, YR2+)', vendorA: '$2.1M', vendorB: '$2.3M', vendorC: '$1.8M' },
  ];

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        PRICING NORMALIZATION · LINE-ITEM COMPARISON
      </div>

      <div
        style={{
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
            padding: '8px 12px',
            background: SHELL.GRAY_BG,
          }}
        >
          {['Line Item', 'Vendor A', 'Vendor B', 'Vendor C'].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: SHELL.INK_MUTED,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {lineItems.map((row, i) => {
          const isTotal = row.item.startsWith('TOTAL');
          return (
            <div
              key={row.item}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
                padding: '10px 12px',
                borderTop: `1px solid ${SHELL.CARD_LINE}`,
                background: isTotal ? SHELL.PAPER_SOFT : i % 2 === 0 ? SHELL.CARD_WHITE : 'transparent',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: isTotal ? SHELL.INK : SHELL.INK_SOFT,
                  fontWeight: isTotal ? 600 : 400,
                }}
              >
                {row.item}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 12,
                  color: isTotal ? SHELL.INK : SHELL.INK_SOFT,
                  fontWeight: isTotal ? 600 : 400,
                }}
              >
                {row.vendorA}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 12,
                  color: isTotal ? SHELL.PEACH_TEXT : SHELL.INK_SOFT,
                  fontWeight: isTotal ? 600 : 400,
                }}
              >
                {row.vendorB}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 12,
                  color: isTotal ? SHELL.MINT_TEXT : SHELL.INK_SOFT,
                  fontWeight: isTotal ? 600 : 400,
                }}
              >
                {row.vendorC}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_MUTED,
          fontStyle: 'italic',
        }}
      >
        All pricing normalized to Apex Retail reference towers. Year 1 transition costs are one-off. Figures are deterministic seed data for demonstration.
      </div>
    </div>
  );
}

function RiskDetectionTab() {
  const risks = [
    {
      id: 'R1',
      title: 'Vendor B · SOC-2 Type II attestation outstanding',
      detail:
        'Vendor B has not submitted a current SOC-2 Type II report. This blocks full security evaluation and must be resolved before the Award stage gate can open.',
      severity: 'critical' as const,
      owner: 'Procurement Lead',
      action: 'Escalate to Vendor B procurement contact — deadline May 2, 2026',
    },
    {
      id: 'R2',
      title: 'Vendor C · Nearshore delivery capacity flag',
      detail:
        'Vendor C has flagged constrained nearshore capacity for Q3 CDP integration workstream. If CDP scope expands in APX-CDP-2026 P3, Vendor C may not be able to staff the concurrent AMS transition.',
      severity: 'warning' as const,
      owner: 'Delivery Lead',
      action: 'Confirm capacity in BAFO clarification round before award',
    },
    {
      id: 'R3',
      title: 'Award timeline · CDP Design gate dependency',
      detail:
        'Vendor architecture selection for AMS must align with APX-CDP-2026 Design gate. If Design gate is delayed, the AMS award may need to hold to avoid scope lock-in.',
      severity: 'info' as const,
      owner: 'Program Director',
      action: 'Monitor APX-CDP-2026 gate status — linked in Nexus',
    },
  ];

  const severityTokens = {
    critical: { bg: `${SHELL.PEACH_BG}99`, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT, label: 'CRITICAL' },
    warning: { bg: `${SHELL.PEACH_BG}44`, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT, label: 'WARNING' },
    info: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_SOFT, label: 'INFO' },
  };

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        RISK DETECTION · {risks.length} ITEMS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {risks.map((risk) => {
          const t = severityTokens[risk.severity];
          return (
            <div
              key={risk.id}
              style={{
                background: t.bg,
                border: `1px solid ${t.line}`,
                borderRadius: 6,
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: t.text,
                    background: 'rgba(255,255,255,0.5)',
                    padding: '2px 7px',
                    borderRadius: 8,
                  }}
                >
                  {t.label}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK,
                    fontWeight: 600,
                  }}
                >
                  {risk.title}
                </span>
              </div>
              <p
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK_SOFT,
                  margin: '0 0 8px',
                  lineHeight: 1.55,
                }}
              >
                {risk.detail}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: SHELL.INK_MUTED,
                  }}
                >
                  ACTION
                </span>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.INK_SOFT,
                    fontStyle: 'italic',
                  }}
                >
                  {risk.action}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SignalsStreamTab() {
  const signals = [
    {
      id: 'S1',
      type: 'Market Intelligence',
      text: 'Enterprise AMS contract awards in retail vertical up 18% YoY — mid-market vendors gaining share from hyperscalers on 3-year fixed-price structures.',
      date: 'Apr 26 2026',
      relevance: 'High',
    },
    {
      id: 'S2',
      type: 'Competitor Award',
      text: 'Rival retailer TerraGoods awarded AMS contract to Northstar Managed Services (Vendor A analogue) — 36-month deal, CDP integration scope included. Signal of Vendor A commercial flexibility.',
      date: 'Apr 24 2026',
      relevance: 'High',
    },
    {
      id: 'S3',
      type: 'Pricing Trend',
      text: 'Managed services pricing indices flat for Q2 2026. Vendor C\'s below-median positioning is structurally unusual — Nexus recommends confirming scope assumptions before accepting headline price.',
      date: 'Apr 22 2026',
      relevance: 'Medium',
    },
    {
      id: 'S4',
      type: 'Program Signal',
      text: 'APX-CDP-2026 moved into P2 Synthesis. Data platform scope for Phase 3 Design still open — vendor selection must hold until CDP architecture is confirmed to avoid rework risk.',
      date: 'Apr 20 2026',
      relevance: 'High',
    },
  ];

  const relevanceColor = (r: string) =>
    r === 'High' ? SHELL.PEACH_TEXT : SHELL.INK_MUTED;
  const relevanceBg = (r: string) =>
    r === 'High' ? SHELL.PEACH_BG : SHELL.GRAY_BG;

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        SIGNALS STREAM · {signals.length} ITEMS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {signals.map((signal, i) => (
          <div
            key={signal.id}
            style={{
              padding: '14px 16px',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius:
                i === 0
                  ? '6px 6px 0 0'
                  : i === signals.length - 1
                  ? '0 0 6px 6px'
                  : 0,
              borderTop: i > 0 ? 'none' : undefined,
              background: SHELL.CARD_WHITE,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: SHELL.INK_MUTED,
                  background: SHELL.GRAY_BG,
                  padding: '2px 7px',
                  borderRadius: 8,
                }}
              >
                {signal.type}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: relevanceColor(signal.relevance),
                  background: relevanceBg(signal.relevance),
                  padding: '2px 7px',
                  borderRadius: 8,
                }}
              >
                {signal.relevance}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  marginLeft: 'auto',
                }}
              >
                {signal.date}
              </span>
            </div>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_SOFT,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {signal.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedProgramTab() {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        LINKED PROGRAM
      </div>

      <LinkedProgramChip
        direction="source-to-program"
        linkedId="APX-CDP-2026"
        linkedName="Apex Retail CDP Activation"
        linkedPhase="P3 Design"
        href="/programs/apx-cdp-2026"
      />

      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          margin: '14px 0',
          lineHeight: 1.6,
          maxWidth: 600,
        }}
      >
        This sourcing event is directly linked to the CDP program&apos;s Design phase. The Design gate (P2 → P3)
        has been cleared — Vendor C was selected as the managed CDP layer. AMS Vendor Consolidation award is
        now unblocked; integration contract with Vendor C is in final review.
      </p>

      <div
        style={{
          background: SHELL.PAPER_SOFT,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 6,
          padding: '12px 14px',
          maxWidth: 600,
        }}
      >
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
          NEXUS CONTEXT
        </div>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            margin: 0,
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          Link is deterministic seed for demonstration. In production, Nexus maintains a live
          dependency graph between source events and program phases — gate transitions in either
          surface propagate signals to the linked entity.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SourceEventDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('bafo');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stage-aware pane contract (Shell Layout Spec v2 §7)
  // BAFO = stage 7 of 10 → StageId S7
  const currentStage: StageId = 'S7';
  const sourceSurfaceContext: Record<string, unknown> = {
    eventId: AMS_SOURCE_EVENT.displayId,
    eventName: AMS_SOURCE_EVENT.name,
    stage: 'BAFO',
    stageIndex: 7,
    vendorCount: AMS_SOURCE_EVENT.vendorCount,
  };
  const storylineMatches = matchStorylinePatterns(buildSourceStorylineContext(), { limit: 4 });

  return (
    <AppShell
      surface="source-detail"
      stage={currentStage}
      surfaceContext={sourceSurfaceContext}
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `${AMS_SOURCE_EVENT.name} · Stage 7 BAFO · 3 vendors active`,
      }}
      middleStrip={
        <StageTrackerStrip
          stages={STAGES}
          activeStage={CURRENT_STAGE}
        />
      }
    >
      {/* Mode B: full-width canvas column with ribbon + scrollable work pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <RibbonSynthesis
          agentInitials="St"
          agentName="Steward"
          quote={STEWARD_QUOTE}
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen((v) => !v)}
        />

        {/* Work pane — WorkingPaneContainer adds stage label strip + gate badge
            for Source event stages (Shell Layout Spec v2 §7) */}
        <WorkingPaneContainer
          shapeResolver={sourceShapeResolver}
          style={{ background: SHELL.PAPER }}
        >
        {/* Event header */}
        <div
          style={{
            padding: '20px 28px 0',
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: SHELL.INK_MUTED,
              marginBottom: 4,
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
              margin: '0 0 4px',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {AMS_SOURCE_EVENT.name}
          </h1>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              marginBottom: 14,
            }}
          >
            Stage 7 of 10 · BAFO · {AMS_SOURCE_EVENT.vendorCount} vendors active
          </div>

          {storylineMatches.length > 0 && (
            <div
              data-testid="source-storyline-pattern-chips"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 14,
              }}
            >
              {storylineMatches.map((pattern) => (
                <PatternChip key={pattern.id} pattern={pattern} />
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: isActive ? SHELL.INK : SHELL.INK_MUTED,
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive
                      ? `2px solid ${SHELL.INK}`
                      : '2px solid transparent',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'color 0.12s, border-color 0.12s',
                    lineHeight: 1,
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px 28px', flex: 1 }}>
          {activeTab === 'bafo' && <BafoStrategyTab />}
          {activeTab === 'pricing' && <PricingNormalizationTab />}
          {activeTab === 'risk' && <RiskDetectionTab />}
          {activeTab === 'signals' && <SignalsStreamTab />}
          {activeTab === 'program' && <LinkedProgramTab />}
        </div>
      </WorkingPaneContainer>
      </div>

      {/* Mode B — AtlasDrawer (Shell Layout Spec v2 §5.1) */}
      <AtlasDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        agent={{ initials: 'St', name: 'Steward', role: 'Source Coordinator' }}
        quote={STEWARD_QUOTE}
        surface="source-detail"
      />
    </AppShell>
  );
}
