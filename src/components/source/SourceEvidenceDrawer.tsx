import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { DrawerBanner, DRAWER_PANEL, DRAWER_EYEBROW } from './SourceDrawerShell';

/**
 * SourceEvidenceDrawer — T13 Evidence trail drawer content
 *
 * Renders inside a SourceDrawerShell. Shows:
 *   - Sentinel attestation banner
 *   - Evidence item cards (name, state chip, provenance)
 *
 * Seeded with AMS outsourcing 2026 evidence data.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceState = 'usable' | 'available_not_validated' | 'not_available';

export interface EvidenceItem {
  id: string;
  name: string;
  state: EvidenceState;
  provenance: string;
  receivedAt?: string;
  agentNote?: string;
}

// ─── State label + chip ───────────────────────────────────────────────────────

function stateLabel(state: EvidenceState): string {
  if (state === 'usable') return 'Usable';
  if (state === 'available_not_validated') return 'Available · not validated';
  return 'Not available';
}

function stateChipStyle(state: EvidenceState): CSSProperties {
  if (state === 'usable') {
    return {
      background: SHELL.MINT_BG,
      border: '1px solid ' + SHELL.MINT_LINE,
      color: SHELL.MINT_TEXT,
    };
  }
  if (state === 'available_not_validated') {
    return {
      background: SHELL.PEACH_BG,
      border: '1px solid ' + SHELL.PEACH_LINE,
      color: SHELL.PEACH_TEXT,
    };
  }
  return {
    background: SHELL.RUST_BG,
    border: '1px solid rgba(138,62,34,0.30)',
    color: SHELL.RUST_TEXT,
  };
}

function StateChip({ state }: { state: EvidenceState }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: 4,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        ...stateChipStyle(state),
      }}
    >
      {stateLabel(state)}
    </span>
  );
}

// ─── Evidence item card ───────────────────────────────────────────────────────

function EvidenceCard({ item, isLast }: { item: EvidenceItem; isLast?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        padding: '10px 12px',
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 8,
        ...(item.state !== 'usable'
          ? { borderLeft: '3px solid ' + (item.state === 'not_available' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT) }
          : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            fontWeight: 700,
            color: SHELL.INK,
          }}
        >
          {item.name}
        </span>
        <StateChip state={item.state} />
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11.5,
          color: SHELL.INK_MUTED,
          lineHeight: 1.5,
        }}
      >
        {item.provenance}
        {item.receivedAt && (
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, marginLeft: 8, color: SHELL.INK_MUTED }}>
            {item.receivedAt}
          </span>
        )}
      </div>
      {item.agentNote && (
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.06em',
            color: item.state === 'not_available' ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT,
          }}
        >
          {item.agentNote}
        </div>
      )}
    </div>
  );
}

// ─── Main drawer content ──────────────────────────────────────────────────────

export function SourceEvidenceDrawerContent({ items }: { items: EvidenceItem[] }) {
  const usable = items.filter((i) => i.state === 'usable').length;
  const total = items.length;

  return (
    <>
      <DrawerBanner variant={usable === total ? 'green' : 'amber'}>
        <span>
          <strong>Sentinel · Evidence attestation</strong>
          {' — '}
          All {total} required evidence items received · {usable} of {total} confirmed usable ·{' '}
          {total - usable} item{total - usable !== 1 ? 's' : ''} in validation
        </span>
      </DrawerBanner>

      <div style={DRAWER_PANEL}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={DRAWER_EYEBROW}>Evidence items · {total} total</span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.MINT_TEXT,
            }}
          >
            {usable} usable
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <EvidenceCard key={item.id} item={item} isLast={i === items.length - 1} />
          ))}
        </div>
      </div>

      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.08em',
        }}
      >
        Evidence posture derived from Sentinel attestation log · AMS outsourcing event 2026
      </div>
    </>
  );
}

// ─── Seeded AMS evidence items ────────────────────────────────────────────────

export const AMS_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'E-AMS-001',
    name: 'AMS vendor proposals — full pack',
    state: 'usable',
    provenance: 'Vendor submission portal · Northstar, ArcVault, BlueMaster, DataPeak',
    receivedAt: '2026-03-14',
  },
  {
    id: 'E-AMS-002',
    name: 'Reference check transcripts',
    state: 'usable',
    provenance: 'Procurement team · 3 references per finalist',
    receivedAt: '2026-03-28',
  },
  {
    id: 'E-AMS-003',
    name: 'Financial viability reports',
    state: 'usable',
    provenance: 'Finance committee · 3 years audited statements',
    receivedAt: '2026-04-02',
  },
  {
    id: 'E-AMS-004',
    name: 'Pricing normalization model',
    state: 'usable',
    provenance: 'Sentinel automated analysis · assumption set v2',
    receivedAt: '2026-04-10',
  },
  {
    id: 'E-AMS-005',
    name: 'Evaluation scorecard matrix',
    state: 'usable',
    provenance: 'Evaluation panel · 5 evaluators, dual-blind scoring',
    receivedAt: '2026-04-15',
  },
  {
    id: 'E-AMS-006',
    name: 'BAFO round 1 submissions',
    state: 'usable',
    provenance: 'Northstar + ArcVault finalist responses',
    receivedAt: '2026-04-29',
  },
  {
    id: 'E-AMS-007',
    name: 'Legal & T&C review',
    state: 'available_not_validated',
    provenance: 'Legal team · standard SaaS managed-services review in progress',
    agentNote: 'STEWARD · Validation expected by 2026-05-14',
  },
  {
    id: 'E-AMS-008',
    name: 'EU data residency clause',
    state: 'not_available',
    provenance: 'Pending vendor confirmation · 11 apps in EU regions',
    agentNote: 'SENTINEL · P2 gap — see pricing trap log T-ALL-001',
  },
];
