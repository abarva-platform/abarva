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
import { SourceLinkedProgramChip } from '@/components/source/LinkedProgramChip';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';
import { PatternChip } from '@/components/source/PatternChip';
import { buildSourceStorylineContext, matchStorylinePatterns } from '@/lib/intelligence/storyline-matcher';
import { buildPricingCompletenessView } from '@/lib/source/pricing-completeness-view';
import { buildBafoScenarioCompareView } from '@/lib/source/bafo-scenario-compare-view';
import { buildTransitionReadinessView } from '@/lib/source/transition-readiness-view';
import type { VendorTransitionReadiness, TransitionRiskItem, TransitionGoNoGoItem, TransitionReadinessStatus } from '@/lib/source/transition-readiness-view';
import { ContradictionDetailCardClient } from '@/components/_shared/ContradictionDetailCardClient';
import { CascadeImpactCard, ReverseCascadeCard } from '@/components/_shared/CascadeImpactCard';
import { InstanceEventTimeline } from '@/components/_shared/InstanceEventTimeline';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { computeReverseCascade } from '@/lib/reasoning/cross-instance-reasoner';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { isResolved as isContradictionResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { buildInstanceEventTimeline } from '@/lib/reasoning/instance-event-timeline';

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

// ─── WorkPane tabs (SRC42 — 8-tab consolidated canvas) ───────────────────────

type TabKey = 'summary' | 'pricing' | 'bafo' | 'risk' | 'readiness' | 'missions' | 'signals' | 'program' | 'transition';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'bafo', label: 'BAFO' },
  { key: 'risk', label: 'Risks' },
  { key: 'readiness', label: 'Readiness' },
  { key: 'missions', label: 'Missions' },
  { key: 'signals', label: 'Signals' },
  { key: 'program', label: 'Linked Program' },
  { key: 'transition', label: 'Transition' },
];

// ─── Tab content components ───────────────────────────────────────────────────

// ─── SRC42: Summary tab ──────────────────────────────────────────────────────

function SummaryTab() {
  const summaryItems = [
    { label: 'Event', value: 'SRC-AMS-2026 · AMS Vendor Consolidation 2026' },
    { label: 'Active stage', value: 'Stage 7 — BAFO' },
    { label: 'Vendors active', value: '3 (Vendor A, Vendor B, Vendor C)' },
    { label: 'Risk flag', value: 'Vendor B · SOC-2 Type II attestation gap' },
    { label: 'Linked program', value: 'APX-CDP-2026 · P3 Design · gate pending' },
    { label: 'Last activity', value: '2h ago' },
  ];

  const statusItems = [
    { label: 'BAFO status', value: 'All 3 vendors submitted', ok: true },
    { label: 'Pricing spread', value: '−14% to +9.5% vs baseline', ok: true },
    { label: 'Gate readiness', value: 'Contract review outstanding (Vendor C)', ok: false },
    { label: 'Evidence', value: 'Stage gate approval record on file', ok: true },
    { label: 'CDP program gate', value: 'Privacy sign-off and vendor contract pending', ok: false },
  ];

  return (
    <div data-testid="source-summary-tab">
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: SHELL.INK_MUTED, marginBottom: 12 }}>
        Commercial Event Summary · SRC-AMS-2026
      </div>

      {/* Key facts */}
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 10 }}>
          Event facts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summaryItems.map((item, i) => (
            <div key={`sf-${i}`} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, minWidth: 120, flexShrink: 0 }}>{item.label}</span>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.4 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status roll-up */}
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 10 }}>
          Status roll-up
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statusItems.map((item, i) => (
            <div key={`ss-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: item.ok ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT, flexShrink: 0, marginTop: 1 }}>
                {item.ok ? '✓' : '✗'}
              </span>
              <div>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.06em', color: SHELL.INK_MUTED, marginRight: 6 }}>{item.label}</span>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.4 }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest disclaimer */}
      <div
        data-honest-disclaimer="source-summary"
        style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
      >
        Deterministic seed · SRC-AMS-2026 summary reflects fixture context only. Live event state, vendor submissions, and gate signals are deferred.
      </div>
    </div>
  );
}

// ─── SRC42: Readiness tab ─────────────────────────────────────────────────────

function ReadinessTab() {
  // REASON-30 — Contradiction detail card sits below the readiness criteria
  // panel so the user can see what to do about each detected contradiction
  // alongside the gate criteria that drive readiness.
  const synthesisContext = buildSourceSynthesisContext(
    AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    PAT_SRC_AMS_001,
  );
  const activeContradictions = synthesisContext.activeContradictions.filter(
    (c) =>
      !isContradictionResolved(
        `${AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id}::${c.templateId}`,
      ),
  );

  const criteria = [
    { label: 'All vendor BAFOs submitted', status: 'done' as const },
    { label: 'Pricing templates normalised (3/3 vendors)', status: 'done' as const },
    { label: 'Risk assessment complete (SOC-2 gap flagged)', status: 'done' as const },
    { label: 'Integration contract finalised (Vendor C)', status: 'pending' as const },
    { label: 'Steward selection approval obtained', status: 'pending' as const },
    { label: 'CDP program privacy sign-off linked', status: 'blocked' as const },
  ];

  const nextActions = [
    'Finalise integration contract with Vendor C',
    'Obtain Steward selection approval',
    'Confirm CDP program privacy sign-off is on track',
  ];

  const doneCount = criteria.filter((c) => c.status === 'done').length;

  return (
    <div data-testid="source-readiness-tab">
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: SHELL.INK_MUTED, marginBottom: 12 }}>
        Vendor Selection Readiness · {doneCount} of {criteria.length} criteria met
      </div>

      {/* Criteria list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {criteria.map((c, i) => {
          const dotColor = c.status === 'done' ? SHELL.MINT_TEXT : c.status === 'blocked' ? SHELL.RUST_TEXT : SHELL.AMBER_DOT;
          const statusLabel = c.status === 'done' ? 'Met' : c.status === 'blocked' ? 'Blocked' : 'Pending';
          return (
            <div key={`rc-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.4 }}>{c.label}</span>
              </div>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: dotColor, flexShrink: 0 }}>{statusLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Next actions */}
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
          Required next actions
        </div>
        {nextActions.map((action, i) => (
          <div key={`rna-${i}`} style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.5, marginBottom: 4 }}>
            → {action}
          </div>
        ))}
      </div>

      {/* REASON-30 — Contradiction detail card */}
      <ContradictionDetailCardClient
        contradictions={activeContradictions}
        instanceId={AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id}
      />

      {/* REASON-31 — Cascade impact detail (downstream + upstream) */}
      <CascadeImpactCard
        impacts={synthesisContext.cascadeContext}
        title="Downstream impacts"
      />
      <ReverseCascadeCard
        upstream={computeReverseCascade(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE)}
        thisInstanceId={AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.displayId}
        title="Upstream dependencies"
      />

      {/* REASON-32 — Per-instance reasoning event timeline. Sits below the
          cascade card so the user can scan recent activity (synthesis runs,
          evidence ingestion, contradiction resolutions) without digging
          through the work pane. */}
      <InstanceEventTimeline
        entries={buildInstanceEventTimeline(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id)}
      />

      {/* Honest disclaimer */}
      <div
        data-honest-disclaimer="source-readiness"
        style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
      >
        Deterministic seed · SRC-AMS-2026 readiness criteria reflect fixture context only. Live gate state machine and Steward sign-off persistence are deferred.
      </div>
    </div>
  );
}

// ─── SRC42: Missions tab ──────────────────────────────────────────────────────

function MissionsTab() {
  const missions = [
    {
      id: 'M-01',
      agent: 'Sentinel',
      agentInitials: 'Sn',
      label: 'Validate Vendor B SOC-2 gap',
      detail: 'Confirm attestation status and assess risk if waived',
      priority: 'critical' as const,
      state: 'active' as const,
    },
    {
      id: 'M-02',
      agent: 'Nexus',
      agentInitials: 'Nx',
      label: 'Align CDP integration contract scope',
      detail: 'Vendor C contract must reflect CDP data layer requirements',
      priority: 'high' as const,
      state: 'active' as const,
    },
    {
      id: 'M-03',
      agent: 'Steward',
      agentInitials: 'St',
      label: 'Obtain selection approval',
      detail: 'Steward sign-off gates final award to Vendor C',
      priority: 'high' as const,
      state: 'pending' as const,
    },
    {
      id: 'M-04',
      agent: 'Atlas',
      agentInitials: 'At',
      label: 'Model post-selection cost projection',
      detail: 'Update Executive lens with final Vendor C pricing',
      priority: 'medium' as const,
      state: 'pending' as const,
    },
  ];

  function priorityColor(p: 'critical' | 'high' | 'medium' | 'low'): string {
    if (p === 'critical') return SHELL.RUST_TEXT;
    if (p === 'high') return SHELL.PEACH_TEXT;
    if (p === 'medium') return SHELL.AMBER_DOT;
    return SHELL.INK_MUTED;
  }

  function stateLabel(s: 'active' | 'pending'): string {
    return s === 'active' ? 'Active' : 'Pending';
  }

  return (
    <div data-testid="source-missions-tab">
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: SHELL.INK_MUTED, marginBottom: 12 }}>
        Agent Missions · {missions.filter((m) => m.state === 'active').length} active
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {missions.map((m) => (
          <div key={m.id} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Agent badge */}
              <div style={{ width: 28, height: 28, borderRadius: 6, background: SHELL.PAPER_DEEP, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 9, fontWeight: 700, color: SHELL.INK }}>{m.agentInitials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK }}>{m.label}</span>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: priorityColor(m.priority) }}>{m.priority}</span>
                </div>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4, marginBottom: 6 }}>
                  {m.detail}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
                    {m.agent} · {m.id}
                  </span>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.06em', color: m.state === 'active' ? SHELL.MINT_TEXT : SHELL.INK_MUTED }}>
                    {stateLabel(m.state)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Honest disclaimer */}
      <div
        data-honest-disclaimer="source-missions"
        style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
      >
        Deterministic seed · SRC-AMS-2026 agent missions reflect fixture context only. Live mission dispatch, state tracking, and agent session management are deferred.
      </div>
    </div>
  );
}

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

      {/* SRC44 — BAFO scenario compare */}
      <BafoScenarioCompare />
    </div>
  );
}

// ─── SRC44: BAFO scenario compare ────────────────────────────────────────────

function BafoScenarioCompare() {
  const scenarioView = buildBafoScenarioCompareView();
  const { vendorSets } = scenarioView;

  const scenarioBg = (t: string) =>
    t === 'conservative' ? SHELL.MINT_BG : t === 'base' ? SHELL.BLUE_BG : `${SHELL.PEACH_BG}44`;
  const scenarioText = (t: string) =>
    t === 'conservative' ? SHELL.MINT_TEXT : t === 'base' ? SHELL.INK_SOFT : SHELL.PEACH_TEXT;
  const riskText = (r: string) =>
    r === 'low' ? SHELL.MINT_TEXT : r === 'medium' ? SHELL.INK_SOFT : SHELL.PEACH_TEXT;

  return (
    <div data-testid="bafo-scenario-compare" style={{ marginTop: 28 }}>
      {/* Section header */}
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
        BAFO SCENARIO COMPARE · {scenarioView.headline}
      </div>

      {/* Per-vendor scenario sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {vendorSets.map((vs) => (
          <div
            key={vs.vendorId}
            data-testid={`bafo-vendor-scenario-${vs.vendorId}`}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* Vendor header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: vs.hasActiveBlocker ? `${SHELL.PEACH_BG}44` : SHELL.PAPER_SOFT,
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK }}>
                {vs.vendorName}
              </span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT }}>
                YR2+ ${(vs.currentAnnualRunCostUsd / 1_000_000).toFixed(1)}M current
              </span>
            </div>

            {/* Blocker note */}
            {vs.hasActiveBlocker && vs.blockerNote && (
              <div
                style={{
                  padding: '6px 14px',
                  background: `${SHELL.PEACH_BG}33`,
                  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  color: SHELL.PEACH_TEXT,
                }}
              >
                ⚠ {vs.blockerNote}
              </div>
            )}

            {/* Three scenario cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderTop: 'none',
              }}
            >
              {vs.scenarios.map((scenario, idx) => (
                <div
                  key={scenario.scenarioType}
                  data-testid={`bafo-scenario-${vs.vendorId}-${scenario.scenarioType}`}
                  style={{
                    padding: '10px 12px',
                    borderLeft: idx > 0 ? `1px solid ${SHELL.CARD_LINE}` : undefined,
                    background: SHELL.CARD_WHITE,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {/* Scenario label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: scenarioText(scenario.scenarioType),
                        background: scenarioBg(scenario.scenarioType),
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {scenario.label}
                    </span>
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        color: riskText(scenario.riskLevel),
                        textTransform: 'uppercase',
                      }}
                    >
                      {scenario.riskLevel} risk
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK, lineHeight: 1.4 }}>
                    {scenario.description}
                  </div>

                  {/* Saving */}
                  {scenario.totalEstimatedSavingUsd > 0 ? (
                    <div style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.MINT_TEXT }}>
                      ~${(scenario.totalEstimatedSavingUsd / 1000).toFixed(0)}K saving
                    </div>
                  ) : (
                    <div style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
                      Not quantified
                    </div>
                  )}

                  {/* Levers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {scenario.levers.map((lever) => (
                      <div key={lever.leverId} style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_SOFT }}>
                        · {lever.label}
                      </div>
                    ))}
                  </div>

                  {/* Next action */}
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      fontStyle: 'italic',
                      borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                      paddingTop: 6,
                      marginTop: 2,
                    }}
                  >
                    → {scenario.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Compare action button */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          data-testid="bafo-scenario-compare-action"
          disabled={true}
          title={scenarioView.compareActionDisabledReason}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            padding: '6px 14px',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 4,
            background: SHELL.GRAY_BG,
            color: SHELL.INK_MUTED,
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          {scenarioView.compareActionLabel}
        </button>
        <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
          {scenarioView.compareActionDisabledReason.split('.')[0]}.
        </span>
      </div>

      {/* Honest disclaimer */}
      <div
        data-testid="bafo-scenario-compare-disclaimer"
        data-honest-disclaimer="source-bafo-scenario-compare"
        style={{
          marginTop: 14,
          fontFamily: SHELL.SANS,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          fontStyle: 'italic',
        }}
      >
        Deterministic seed · SRC-AMS-2026 BAFO scenarios reflect fixture context only. Saving estimates are directional and deterministic — not live predictions. Vendor B and Vendor C scenarios are contingent on active blocker resolution.
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

      {/* SRC43 — Pricing completeness drilldown */}
      <PricingCompletenessDrilldown />
    </div>
  );
}

// ─── SRC43: Pricing completeness drilldown ────────────────────────────────────

function PricingCompletenessDrilldown() {
  const completenessView = buildPricingCompletenessView();
  const { summary, vendors } = completenessView;

  const statusBg = (s: string) => {
    if (s === 'not_comparable') return `${SHELL.PEACH_BG}99`;
    if (s === 'partially_comparable') return `${SHELL.PEACH_BG}44`;
    if (s === 'comparable') return SHELL.MINT_BG;
    return SHELL.GRAY_BG;
  };
  const statusText = (s: string) => {
    if (s === 'not_comparable') return SHELL.PEACH_TEXT;
    if (s === 'partially_comparable') return SHELL.PEACH_TEXT;
    if (s === 'comparable') return SHELL.MINT_TEXT;
    return SHELL.INK_MUTED;
  };
  const statusLabel = (s: string) => {
    if (s === 'not_comparable') return 'Not comparable';
    if (s === 'partially_comparable') return 'Partially comparable';
    if (s === 'comparable') return 'Comparable';
    return 'Blocked';
  };
  const severityBg = (s: string) =>
    s === 'blocker' ? `${SHELL.PEACH_BG}99` : s === 'risk' ? `${SHELL.PEACH_BG}44` : SHELL.GRAY_BG;
  const severityText = (s: string) =>
    s === 'blocker' ? SHELL.PEACH_TEXT : s === 'risk' ? SHELL.PEACH_TEXT : SHELL.INK_MUTED;
  const severityLabel = (s: string) =>
    s === 'blocker' ? 'BLOCKER' : s === 'risk' ? 'RISK' : 'ADVISORY';

  return (
    <div data-testid="pricing-completeness-drilldown" style={{ marginTop: 28 }}>
      {/* Section header */}
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
        PRICING COMPLETENESS DRILLDOWN · {completenessView.headline}
      </div>

      {/* Summary banner */}
      <div
        data-testid="pricing-completeness-summary"
        style={{
          background: SHELL.PAPER_SOFT,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 6,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, marginBottom: 4, fontWeight: 500 }}>
          {summary.overallReason}
        </div>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
          {summary.comparableVendorCount} of {summary.totalVendorCount} vendors fully comparable ·{' '}
          {summary.crossVendorGaps.length} cross-vendor gaps
        </div>
      </div>

      {/* Per-vendor completeness cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vendors.map((vendor) => (
          <div
            key={vendor.vendorId}
            data-testid={`pricing-vendor-completeness-${vendor.vendorId}`}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* Vendor header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: statusBg(vendor.comparabilityStatus),
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK }}>
                  {vendor.vendorName}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: statusText(vendor.comparabilityStatus),
                  }}
                >
                  {statusLabel(vendor.comparabilityStatus)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT }}>
                  YR2+ ${(vendor.annualRunCostUsd / 1_000_000).toFixed(1)}M
                </span>
                {vendor.blockerCount > 0 && (
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.PEACH_TEXT }}>
                    {vendor.blockerCount} blocker
                  </span>
                )}
              </div>
            </div>

            {/* Comparability reason */}
            <div style={{ padding: '8px 14px', background: SHELL.CARD_WHITE, borderBottom: `1px solid ${SHELL.CARD_LINE}` }}>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>
                {vendor.comparabilityReason}
              </span>
            </div>

            {/* Gaps */}
            {vendor.gaps.length > 0 && (
              <div style={{ padding: '10px 14px', background: SHELL.CARD_WHITE }}>
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: SHELL.INK_MUTED,
                    marginBottom: 8,
                  }}
                >
                  GAPS · {vendor.gaps.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {vendor.gaps.map((gap) => (
                    <div
                      key={gap.gapId}
                      data-testid={`pricing-gap-${gap.gapId}`}
                      style={{
                        background: severityBg(gap.severity),
                        borderRadius: 4,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: SHELL.MONO,
                            fontSize: 8,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: severityText(gap.severity),
                          }}
                        >
                          {severityLabel(gap.severity)}
                        </span>
                        <span style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 500, color: SHELL.INK }}>
                          {gap.label}
                        </span>
                      </div>
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>
                        {gap.detail}
                      </div>
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
                        → {gap.nextAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {vendor.exclusions.length > 0 && (
              <div
                style={{
                  padding: '8px 14px',
                  background: SHELL.GRAY_BG,
                  borderTop: `1px solid ${SHELL.CARD_LINE}`,
                }}
              >
                <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  EXCLUDED FROM SCOPE:{' '}
                </span>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>
                  {vendor.exclusions.join(' · ')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cross-vendor gaps */}
      <div style={{ marginTop: 16 }}>
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
          CROSS-VENDOR GAPS · {summary.crossVendorGaps.length}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summary.crossVendorGaps.map((gap) => (
            <div
              key={gap.gapId}
              data-testid={`pricing-gap-${gap.gapId}`}
              style={{
                background: severityBg(gap.severity),
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 4,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: severityText(gap.severity),
                  }}
                >
                  {severityLabel(gap.severity)}
                </span>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 500, color: SHELL.INK }}>
                  {gap.label}
                </span>
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>{gap.detail}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
                → {gap.nextAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clarification action */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          data-testid="pricing-clarification-send"
          disabled={true}
          title={completenessView.clarificationDisabledReason}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            padding: '6px 14px',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 4,
            background: SHELL.GRAY_BG,
            color: SHELL.INK_MUTED,
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          {completenessView.clarificationLabel}
        </button>
        <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
          {completenessView.clarificationDisabledReason.split('.')[0]}.
        </span>
      </div>

      {/* Honest disclaimer */}
      <div
        data-testid="pricing-completeness-disclaimer"
        data-honest-disclaimer="source-pricing-completeness"
        style={{
          marginTop: 14,
          fontFamily: SHELL.SANS,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          fontStyle: 'italic',
        }}
      >
        Deterministic seed · SRC-AMS-2026 pricing completeness reflects fixture context only. Live vendor submissions, SOC-2 attestation status, and scope reconfirmation are deferred.
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
  // REASON-18 — chip contents are derived live from APX_CDP_2026_INSTANCE
  // via buildLinkedProgramChip. If the linked program advances a phase or
  // clears its blocker, this chip updates without a code change.
  const primaryLink = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.linkedPrograms[0];

  return (
    <div data-testid="source-linked-program-tab">
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

      {primaryLink ? (
        <SourceLinkedProgramChip
          linkedProgramId={primaryLink.programId}
          linkType={primaryLink.linkType}
          href={`/programs/${primaryLink.programId.toLowerCase()}`}
        />
      ) : (
        <LinkedProgramChip
          direction="source-to-program"
          linkedId="APX-CDP-2026"
          linkedName="Apex Retail CDP Activation"
          linkedPhase="P3 Design"
          href="/programs/apx-cdp-2026"
        />
      )}

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
        <div
          data-honest-disclaimer="source-linked-program"
          style={{
            marginTop: 8,
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
          }}
        >
          Deterministic seed · APX-CDP-2026 P3 Design link reflects fixture context only. Chip phase, blocker, and color resolved live from ProgramInstance via cross-instance reasoner
        </div>
      </div>
    </div>
  );
}

// ─── SRC45: Transition Readiness tab ─────────────────────────────────────────

function statusBadgeStyle(status: TransitionReadinessStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 4,
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
  };
  switch (status) {
    case 'ready':
      return { ...base, background: '#f0fdf4', color: '#166534' };
    case 'partial':
      return { ...base, background: '#fefce8', color: '#854d0e' };
    case 'blocked':
      return { ...base, background: '#fef2f2', color: '#991b1b' };
    case 'not_started':
      return { ...base, background: SHELL.PAPER, color: SHELL.INK_MUTED, border: `1px solid ${SHELL.CARD_LINE}` };
    case 'deferred':
      return { ...base, background: '#f5f3ff', color: '#5b21b6' };
    default:
      return base;
  }
}

function statusLabel(status: TransitionReadinessStatus): string {
  switch (status) {
    case 'ready': return 'Ready';
    case 'partial': return 'Partial';
    case 'blocked': return 'Blocked';
    case 'not_started': return 'Not started';
    case 'deferred': return 'Deferred';
    default: return status;
  }
}

function riskSeverityStyle(severity: 'high' | 'medium' | 'low'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 4,
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
  };
  switch (severity) {
    case 'high': return { ...base, background: '#fef2f2', color: '#991b1b' };
    case 'medium': return { ...base, background: '#fefce8', color: '#854d0e' };
    case 'low': return { ...base, background: '#f0fdf4', color: '#166534' };
    default: return base;
  }
}

function TransitionReadinessTab() {
  const view = buildTransitionReadinessView();
  const { summary, vendors, risks, goNoGoCriteria } = view;

  return (
    <div data-testid="source-transition-readiness-tab">
      {/* Header */}
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: SHELL.INK_MUTED, marginBottom: 12 }}>
        Transition Readiness · SRC-AMS-2026
      </div>

      {/* Summary banner */}
      <div
        data-testid="transition-readiness-summary"
        style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}
      >
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 10 }}>
          Readiness snapshot
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, marginBottom: 10 }}>
          {[
            { label: 'Vendors tracked', value: vendors.length },
            { label: 'Blocked', value: summary.blockedVendorCount },
            { label: 'Go / No-Go', value: `${summary.goNoGoMetCount} / ${summary.goNoGoTotalCount}` },
            { label: 'Transition clear', value: summary.transitionClearToBegin ? 'Yes' : 'Not yet' },
          ].map((m, i) => (
            <div key={`trm-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>{m.label}</span>
              <span style={{ fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.INK, lineHeight: 1 }}>{m.value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.5, fontStyle: 'italic', borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`, paddingTop: 10 }}>
          {view.atlasGuidance}
        </p>
      </div>

      {/* Per-vendor readiness */}
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
        Vendor transition readiness
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {vendors.map((vendor: VendorTransitionReadiness) => (
          <div
            key={vendor.vendorId}
            data-testid={`transition-vendor-${vendor.vendorId}`}
            style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: vendor.transitionBlocked ? 8 : 12 }}>
              <span style={{ fontFamily: SHELL.SERIF, fontSize: 15, color: SHELL.INK }}>{vendor.vendorLabel}</span>
              <span style={statusBadgeStyle(vendor.overallStatus)}>{statusLabel(vendor.overallStatus)}</span>
            </div>
            {vendor.blockerSummary && (
              <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '6px 10px', marginBottom: 10 }}>
                {vendor.blockerSummary}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {vendor.checks.map((check) => (
                <div key={check.checkId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={statusBadgeStyle(check.status)}>{statusLabel(check.status)}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.4 }}>{check.label}</span>
                    {check.blockerNote && check.status !== 'ready' && (
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, marginTop: 2 }}>
                        {check.blockerNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Go / No-Go criteria */}
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
        Go / No-Go criteria
      </div>
      <div
        data-testid="transition-go-no-go"
        style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goNoGoCriteria.map((criterion: TransitionGoNoGoItem) => (
            <div key={criterion.criterionId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 12, color: criterion.met ? '#166534' : SHELL.INK_MUTED, flexShrink: 0, marginTop: 1 }}>
                {criterion.met ? '✓' : '○'}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, lineHeight: 1.4 }}>{criterion.label}</span>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, marginLeft: 8 }}>
                  {criterion.owner}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transition risks */}
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
        Transition risk indicators
      </div>
      <div
        data-testid="transition-risks"
        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}
      >
        {risks.map((risk: TransitionRiskItem) => (
          <div
            key={risk.riskId}
            data-testid={`transition-risk-${risk.riskId}`}
            style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 8, padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={riskSeverityStyle(risk.severity)}>{risk.severity}</span>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK }}>{risk.label}</span>
            </div>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, margin: '0 0 6px', lineHeight: 1.5 }}>
              {risk.narrative}
            </p>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 3 }}>
              Mitigation
            </div>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
              {risk.mitigationNote}
            </p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        data-testid="transition-readiness-disclaimer"
        data-honest-disclaimer="source-transition-readiness"
        style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5, borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`, paddingTop: 10, marginTop: 8 }}
      >
        Deterministic seed · Transition readiness reflects fixture data for SRC-AMS-2026 at Stage 7 (BAFO). Live transition tracking, vendor check submission, and go/no-go gate management are deferred to the Source transition module (post-selection).
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SourceEventDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
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
          {activeTab === 'summary' && <SummaryTab />}
          {activeTab === 'pricing' && <PricingNormalizationTab />}
          {activeTab === 'bafo' && <BafoStrategyTab />}
          {activeTab === 'risk' && <RiskDetectionTab />}
          {activeTab === 'readiness' && <ReadinessTab />}
          {activeTab === 'missions' && <MissionsTab />}
          {activeTab === 'signals' && <SignalsStreamTab />}
          {activeTab === 'program' && <LinkedProgramTab />}
          {activeTab === 'transition' && <TransitionReadinessTab />}
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
