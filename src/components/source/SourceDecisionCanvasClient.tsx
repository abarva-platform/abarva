'use client';

/**
 * SourceDecisionCanvasClient — T06 Decision canvas client wrapper
 *
 * Manages drawer state for:
 *   T12 — Data readiness drawer
 *   T13 — Evidence trail drawer
 *   T14 — Gate criteria drawer
 *
 * Server-passes data readiness props; all else uses seeded AMS fixtures.
 */

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  SourceExecutiveDecisionSummaryPanel,
  buildAmsDecisionSummaryProps,
} from './SourceExecutiveDecisionSummaryPanel';
import { SourceDrawerShell, DrawerBanner, DRAWER_PANEL, DRAWER_EYEBROW } from './SourceDrawerShell';
import { SourceEvidenceDrawerContent, AMS_EVIDENCE_ITEMS } from './SourceEvidenceDrawer';
import { SourceDataReadinessPanel } from './SourceDataReadinessPanel';
import type { SourceDataReadinessItem } from '@/lib/source/types';
import type { SourceDataReadinessProgressSummary } from '@/lib/source/admin-setup-readiness-contract';

// ─── Gate criteria drawer content ─────────────────────────────────────────────

type GateStatus = 'met' | 'partial' | 'unmet' | 'waived';

interface GateCriterion {
  id: string;
  label: string;
  status: GateStatus;
  note?: string;
}

const AMS_GATE_CRITERIA: GateCriterion[] = [
  { id: 'G-01', label: 'Pricing normalized and TCO model validated', status: 'met' },
  { id: 'G-02', label: 'Scorecard evaluation complete — all finalists scored', status: 'met' },
  { id: 'G-03', label: 'BAFO round 1 submitted by all finalists', status: 'met' },
  {
    id: 'G-04',
    label: 'All P0 commercial traps resolved before award',
    status: 'partial',
    note: 'Northstar T-NST-001 (Tier-2 bundling) and ArcVault T-ARC-001 (governance framework) open',
  },
  {
    id: 'G-05',
    label: 'Legal & T&C review signed off',
    status: 'unmet',
    note: 'Review in progress · Steward expects closure by 2026-05-14',
  },
  {
    id: 'G-06',
    label: 'EU data residency clause confirmed',
    status: 'unmet',
    note: 'P2 gap — 11 apps in EU regions; no vendor confirmation received',
  },
];

const GATE_STATUS_STYLES: Record<GateStatus, { dot: string; label: string; pillBg: string; pillBorder: string; pillColor: string }> = {
  met:     { dot: SHELL.MINT_TEXT,  label: 'Passed',  pillBg: SHELL.MINT_BG,   pillBorder: SHELL.MINT_LINE,              pillColor: SHELL.MINT_TEXT  },
  partial: { dot: SHELL.PEACH_TEXT, label: 'Partial', pillBg: SHELL.PEACH_BG,  pillBorder: SHELL.PEACH_LINE,             pillColor: SHELL.PEACH_TEXT },
  unmet:   { dot: SHELL.RUST_TEXT,  label: 'Unmet',   pillBg: SHELL.RUST_BG,   pillBorder: 'rgba(138,62,34,0.30)',       pillColor: SHELL.RUST_TEXT  },
  waived:  { dot: SHELL.INK_MUTED,  label: 'Waived',  pillBg: SHELL.PAPER_SOFT, pillBorder: SHELL.CARD_LINE,            pillColor: SHELL.INK_MUTED  },
};

function GateCriterionRow({ criterion }: { criterion: GateCriterion }) {
  const s = GATE_STATUS_STYLES[criterion.status];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 1fr auto',
        gap: 10,
        alignItems: 'start',
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 8,
        padding: '9px 10px',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: s.dot,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, marginBottom: 2 }}>
          {criterion.id}
        </div>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12.5, lineHeight: 1.5, color: SHELL.INK }}>
          {criterion.label}
        </div>
        {criterion.note && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11.5,
              lineHeight: 1.5,
              color: SHELL.INK_MUTED,
              fontStyle: 'italic',
              marginTop: 3,
            }}
          >
            {criterion.note}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          borderRadius: 999,
          padding: '2px 7px',
          border: '1px solid',
          background: s.pillBg,
          borderColor: s.pillBorder,
          color: s.pillColor,
          whiteSpace: 'nowrap',
        }}
      >
        {s.label}
      </span>
    </div>
  );
}

function GateDrawerContent() {
  const met = AMS_GATE_CRITERIA.filter((c) => c.status === 'met').length;
  const partial = AMS_GATE_CRITERIA.filter((c) => c.status === 'partial').length;
  const unmet = AMS_GATE_CRITERIA.filter((c) => c.status === 'unmet').length;

  return (
    <>
      {/* Waiver path banner */}
      <DrawerBanner variant="amber">
        <span>
          <strong>Steward · Waiver path available</strong>
          {' — '}
          G-06 (EU data residency) is eligible for a conditional waiver if vendor confirms clause by award date.
          G-05 requires Legal sign-off before award; no waiver path available.
        </span>
      </DrawerBanner>

      <div style={DRAWER_PANEL}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={DRAWER_EYEBROW}>
            Gate criteria · {met}/{AMS_GATE_CRITERIA.length} met
          </span>
          <div style={{ display: 'flex', gap: 8, fontFamily: SHELL.MONO, fontSize: 9 }}>
            {partial > 0 && <span style={{ color: SHELL.PEACH_TEXT }}>{partial} partial</span>}
            {unmet > 0 && <span style={{ color: SHELL.RUST_TEXT }}>{unmet} unmet</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {AMS_GATE_CRITERIA.map((c) => (
            <GateCriterionRow key={c.id} criterion={c} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            fontWeight: 600,
            background: '#1d9e75',
            color: '#fff',
            border: '1px solid #18875f',
            borderRadius: 7,
            padding: '7px 14px',
            cursor: 'default',
            opacity: 0.5,
          }}
          disabled
          title="All P0 traps must resolve before promotion"
        >
          Promote to award
        </button>
        <button
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            fontWeight: 600,
            background: SHELL.PEACH_BG,
            color: SHELL.PEACH_TEXT,
            border: '1px solid ' + SHELL.PEACH_TEXT,
            borderRadius: 7,
            padding: '7px 14px',
            cursor: 'pointer',
          }}
        >
          Request waiver
        </button>
        <button
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            fontWeight: 600,
            background: SHELL.PAPER_SOFT,
            color: SHELL.INK_SOFT,
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 7,
            padding: '7px 14px',
            cursor: 'pointer',
          }}
        >
          Notify sponsor
        </button>
      </div>

      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.08em',
        }}
      >
        Gate status evaluated live by Steward · AMS outsourcing event 2026
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SourceDecisionCanvasClientProps {
  dataReadinessItems: SourceDataReadinessItem[];
  dataReadinessSummary?: SourceDataReadinessProgressSummary;
}

export function SourceDecisionCanvasClient({
  dataReadinessItems,
  dataReadinessSummary,
}: SourceDecisionCanvasClientProps) {
  const [dataReadinessOpen, setDataReadinessOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const panelProps = buildAmsDecisionSummaryProps();

  return (
    <>
      <SourceExecutiveDecisionSummaryPanel
        {...panelProps}
        onOpenDataReadiness={() => setDataReadinessOpen(true)}
        onOpenEvidence={() => setEvidenceOpen(true)}
        onOpenGate={() => setGateOpen(true)}
      />

      {/* T12 — Data readiness drawer */}
      <SourceDrawerShell
        open={dataReadinessOpen}
        onClose={() => setDataReadinessOpen(false)}
        eyebrow="T12 · Data readiness"
        title="Evidence posture for decision stage"
      >
        <SourceDataReadinessPanel
          items={dataReadinessItems}
          progressSummary={dataReadinessSummary}
        />
      </SourceDrawerShell>

      {/* T13 — Evidence trail drawer */}
      <SourceDrawerShell
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        eyebrow="T13 · Evidence trail"
        title="Sentinel evidence attestation"
      >
        <SourceEvidenceDrawerContent items={AMS_EVIDENCE_ITEMS} />
      </SourceDrawerShell>

      {/* T14 — Gate criteria drawer */}
      <SourceDrawerShell
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        eyebrow="T14 · Gate criteria"
        title="Selection gate — advance to award"
      >
        <GateDrawerContent />
      </SourceDrawerShell>
    </>
  );
}
