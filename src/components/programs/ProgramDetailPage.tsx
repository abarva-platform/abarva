'use client';

// SHELL-B — Program Detail Page adapted to AppShell.

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramDetailView, ProgramPhaseId, EvidenceItem } from '@/lib/programs/programs-types';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramDetailView['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate Pending';
      break;
    case 'open':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Open';
      break;
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Approved';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : 'Gate N/A';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Gate ribbon (PRG-STA-GATE-PENDING) ───────────────────────────────────────

interface GateRibbonProps {
  fromPhase: number;
  toPhase: number;
  totalCriteria: number;
  metCriteria: number;
  onRequestApproval: () => void;
}

function GateRibbon({
  fromPhase,
  toPhase,
  totalCriteria,
  metCriteria,
  onRequestApproval,
}: GateRibbonProps) {
  const fromPhaseLabel = PHASE_LABEL_MAP[fromPhase as ProgramPhaseId] ?? `Phase ${fromPhase}`;
  const toPhaseLabel = PHASE_LABEL_MAP[toPhase as ProgramPhaseId] ?? `Phase ${toPhase}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: 10,
        padding: '14px 20px',
      }}
    >
      {/* Amber dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: SHELL.AMBER_DOT,
          flexShrink: 0,
        }}
      />

      {/* "GATE REVIEW" label */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: SHELL.PEACH_TEXT,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Gate Review
      </span>

      {/* Arrow */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        →
      </span>

      {/* Phase transition label */}
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK,
          whiteSpace: 'nowrap',
        }}
      >
        P{fromPhase} {fromPhaseLabel} → P{toPhase} {toPhaseLabel}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Criteria badge */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.PEACH_TEXT,
          background: SHELL.PEACH_LINE,
          padding: '3px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {metCriteria} of {totalCriteria} criteria met
      </span>

      {/* Request approval button */}
      <button
        onClick={onRequestApproval}
        style={{
          background: SHELL.INK,
          color: SHELL.PAPER,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          padding: '6px 14px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Request gate approval
      </button>
    </div>
  );
}

// ─── Gate approve modal (PRG-MOD-GATE-APPROVE) ────────────────────────────────

interface GateApproveModalProps {
  fromPhase: number;
  toPhase: number;
  unmetCriteria: string[];
  onApprove: (rationale: string) => void;
  onClose: () => void;
}

function GateApproveModal({
  fromPhase,
  toPhase,
  unmetCriteria,
  onApprove,
  onClose,
}: GateApproveModalProps) {
  const [rationale, setRationale] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toPhaseLabel = PHASE_LABEL_MAP[toPhase as ProgramPhaseId] ?? `Phase ${toPhase}`;

  const canApprove = rationale.trim().length > 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Gate Approval
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              lineHeight: 1.25,
            }}
          >
            Advance to P{toPhase} {toPhaseLabel}?
          </div>
        </div>

        {/* Warning section for unmet criteria */}
        {unmetCriteria.length > 0 && (
          <div
            style={{
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unmetCriteria.map((criterion, i) => (
                <div
                  key={`unmet-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.PEACH_TEXT,
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>✗</span>
                  <span>{criterion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rationale textarea */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Approval Rationale (required)
          </div>
          <textarea
            ref={textareaRef}
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: 10,
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              color: SHELL.INK,
              outline: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Describe why this gate advance is approved despite any open criteria…"
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              color: SHELL.INK,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => canApprove && onApprove(rationale)}
            disabled={!canApprove}
            style={{
              background: canApprove ? SHELL.INK : SHELL.GRAY_BG,
              color: canApprove ? SHELL.PAPER : SHELL.GRAY_TEXT,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: canApprove ? 'pointer' : 'not-allowed',
            }}
          >
            Approve gate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gate criteria ────────────────────────────────────────────────────────────

function GateCriteriaList({
  criteria,
}: {
  criteria: NonNullable<ProgramDetailView['phasePanel']['gateCriteria']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Gate criteria
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {criteria.map((g, i) => (
          <div
            key={`gc-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 12px',
              borderRadius: 7,
              background: g.met
                ? SHELL.MINT_BG
                : SHELL.PEACH_BG,
              border: `1px solid ${g.met ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
            }}
          >
            {/* Circle icon */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                background: g.met ? SHELL.MINT_TEXT : 'transparent',
                border: g.met ? 'none' : `1.5px solid ${SHELL.INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {g.met && (
                <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: g.met ? SHELL.MINT_TEXT : SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {g.criterion}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: g.met ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
              }}
            >
              {g.met ? 'Met' : 'Open'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

function DeliverablesList({
  deliverables,
}: {
  deliverables: NonNullable<ProgramDetailView['phasePanel']['deliverables']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Deliverables
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deliverables.map((d, i) => {
          const statusDotColor =
            d.status === 'done'
              ? SHELL.MINT_TEXT
              : d.status === 'blocked'
              ? SHELL.RUST_TEXT
              : SHELL.AMBER_DOT;

          return (
            <div
              key={`del-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 7,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusDotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  flex: 1,
                  lineHeight: 1.4,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: statusDotColor,
                }}
              >
                {d.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Evidence section ─────────────────────────────────────────────────────────

interface EvidenceSectionProps {
  items: EvidenceItem[];
  onView: (item: EvidenceItem) => void;
}

function EvidenceSection({ items, onView }: EvidenceSectionProps) {
  function confidenceDotColor(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return SHELL.MINT_TEXT;
    if (confidence === 'medium') return SHELL.AMBER_DOT;
    return SHELL.RUST_TEXT;
  }

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Evidence · {items.length} citations
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onView(item)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            {/* Confidence dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: confidenceDotColor(item.confidence),
                flexShrink: 0,
              }}
            />
            {/* Citation */}
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK,
                flex: 1,
                lineHeight: 1.4,
              }}
            >
              {item.citation}
            </span>
            {/* Conflict badge */}
            {item.hasContradiction && (
              <span
                style={{
                  background: SHELL.PEACH_BG,
                  color: SHELL.PEACH_TEXT,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                ⚠ conflict
              </span>
            )}
            {/* View arrow */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                whiteSpace: 'nowrap',
              }}
            >
              View →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence drawer ──────────────────────────────────────────────────────────

interface EvidenceDrawerProps {
  item: EvidenceItem;
  onClose: () => void;
  onResolveContradiction: (item: EvidenceItem) => void;
}

function EvidenceDrawer({ item, onClose, onResolveContradiction }: EvidenceDrawerProps) {
  function confidenceDotColor(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return SHELL.MINT_TEXT;
    if (confidence === 'medium') return SHELL.AMBER_DOT;
    return SHELL.RUST_TEXT;
  }

  function confidenceLabel(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return 'High confidence';
    if (confidence === 'medium') return 'Medium confidence';
    return 'Low confidence';
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: SHELL.PAPER,
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Evidence Citation
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 20,
            color: SHELL.INK_SOFT,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 24px',
        }}
      >
        {/* Citation */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            color: SHELL.INK,
            fontWeight: 'bold',
            marginBottom: 4,
          }}
        >
          {item.citation}
        </div>

        {/* Source */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 16,
          }}
        >
          {item.source}
        </div>

        {/* Excerpt */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK,
            lineHeight: 1.7,
            borderLeft: `3px solid ${SHELL.CARD_LINE}`,
            paddingLeft: 14,
            marginBottom: 20,
          }}
        >
          {item.excerpt}
        </div>

        {/* Confidence */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: item.hasContradiction ? 20 : 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: confidenceDotColor(item.confidence),
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: SHELL.INK_MUTED,
            }}
          >
            {confidenceLabel(item.confidence)}
          </span>
        </div>

        {/* Contradiction box */}
        {item.hasContradiction && (
          <div
            style={{
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.PEACH_TEXT,
                marginBottom: 10,
              }}
            >
              ⚠ Conflicting evidence detected
            </div>
            <button
              onClick={() => {
                onClose();
                onResolveContradiction(item);
              }}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                letterSpacing: '0.06em',
              }}
            >
              Resolve contradiction →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contradiction modal ──────────────────────────────────────────────────────

interface ContradictionModalProps {
  item: EvidenceItem;
  onResolve: (resolution: string) => void;
  onClose: () => void;
}

function ContradictionModal({ item, onResolve, onClose }: ContradictionModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const options = [
    'Accept this evidence — discard conflicting item',
    'Accept conflicting item — flag this as superseded',
    'Defer — flag both items for sponsor review',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 500,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Contradiction
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              lineHeight: 1.25,
            }}
          >
            Conflicting evidence detected
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {item.citation}
        </div>

        {/* Resolution options */}
        <div style={{ marginBottom: 20 }}>
          {options.map((opt, i) => (
            <div
              key={`opt-${i}`}
              onClick={() => setSelected(i)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: `1.5px solid ${selected === i ? SHELL.INK : SHELL.CARD_LINE}`,
                background: selected === i ? SHELL.PAPER_DEEP : SHELL.CARD_WHITE,
                cursor: 'pointer',
                marginBottom: 6,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {opt}
            </div>
          ))}
        </div>

        {/* Note textarea */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Resolution Note (optional)
          </div>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: 10,
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              color: SHELL.INK,
              outline: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Optional note about this resolution…"
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              color: SHELL.INK,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const resolution = selected !== null ? options[selected] : '';
              onResolve(resolution + (note ? ` — ${note}` : ''));
            }}
            style={{
              background: SHELL.INK,
              color: SHELL.PAPER,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Record resolution
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgramDetailPage({ view }: ProgramDetailPageProps) {
  const router = useRouter();
  const [showGateModal, setShowGateModal] = useState(false);
  const [evidenceDrawerItem, setEvidenceDrawerItem] = useState<EvidenceItem | null>(null);
  const [contradictionItem, setContradictionItem] = useState<EvidenceItem | null>(null);

  const phaseLabel = PHASE_LABEL_MAP[view.viewingPhase] ?? `Phase ${view.viewingPhase}`;

  // Map ProgramPhaseSlot to PhaseStripSlot
  const stripPhases: PhaseStripSlot[] = view.phases.map((s) => ({
    id: s.id as PhaseStripSlot['id'],
    label: s.label,
    state: s.state,
  }));

  const handlePhaseSelect = (id: PhaseStripSlot['id']) => {
    router.push(`/programs/${view.programId}?phase=${id}`, { scroll: false });
  };

  // Cast actions for AgentColumn
  const agentActions = view.workbench.actions.map((a) => ({
    letter: a.letter as 'A' | 'B' | 'C',
    text: a.text,
    detail: a.detail,
  }));

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `${view.displayId} · P${view.viewingPhase} ${phaseLabel}`,
      }}
      middleStrip={
        <PhaseStrip phases={stripPhases} onPhaseSelect={handlePhaseSelect} />
      }
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
        quote={view.workbench.prose}
        agentContext={view.workbench.title}
        actions={agentActions}
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
        {/* Program header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {view.displayId}
            </span>
            <GatePill status={view.gateStatus} />
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 600,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {view.name}
          </h1>
        </div>

        {/* Gate ribbon — shown when gate is pending */}
        {view.gateStatus === 'pending' && view.phasePanel.gateCriteria && (
          <GateRibbon
            fromPhase={view.viewingPhase}
            toPhase={view.viewingPhase + 1}
            totalCriteria={view.phasePanel.gateCriteria.length}
            metCriteria={view.phasePanel.gateCriteria.filter((c) => c.met).length}
            onRequestApproval={() => setShowGateModal(true)}
          />
        )}

        {/* Gate criteria */}
        {view.phasePanel.gateCriteria && view.phasePanel.gateCriteria.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GateCriteriaList criteria={view.phasePanel.gateCriteria} />
          </div>
        )}

        {/* Evidence */}
        {view.phasePanel.evidenceItems && view.phasePanel.evidenceItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <EvidenceSection
              items={view.phasePanel.evidenceItems}
              onView={(item) => setEvidenceDrawerItem(item)}
            />
          </div>
        )}

        {/* Deliverables */}
        {view.phasePanel.deliverables && view.phasePanel.deliverables.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <DeliverablesList deliverables={view.phasePanel.deliverables} />
          </div>
        )}

        {/* Blocker note */}
        {view.phasePanel.blockerNote && (
          <div
            style={{
              marginBottom: 20,
              padding: '10px 14px',
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 7,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              lineHeight: 1.5,
            }}
          >
            {view.phasePanel.blockerNote}
          </div>
        )}

        {/* Linked source event */}
        {view.linkedSourceEvent && (
          <div style={{ marginBottom: 20 }}>
            <LinkedProgramChip
              direction="program-to-source"
              linkedId="SRC-AMS-2026"
              linkedName="AMS Vendor Consolidation 2026"
              linkedStage="BAFO · Stage 7"
              href="/source"
            />
          </div>
        )}
      </div>

      {/* Gate approval modal — portal-style fixed overlay */}
      {showGateModal && view.phasePanel.gateCriteria && (
        <GateApproveModal
          fromPhase={view.viewingPhase}
          toPhase={view.viewingPhase + 1}
          unmetCriteria={view.phasePanel.gateCriteria
            .filter((c) => !c.met)
            .map((c) => c.criterion)}
          onApprove={(rationale) => {
            console.log('Gate approved', rationale);
            setShowGateModal(false);
          }}
          onClose={() => setShowGateModal(false)}
        />
      )}

      {/* Evidence drawer */}
      {evidenceDrawerItem && (
        <EvidenceDrawer
          item={evidenceDrawerItem}
          onClose={() => setEvidenceDrawerItem(null)}
          onResolveContradiction={(item) => {
            setEvidenceDrawerItem(null);
            setContradictionItem(item);
          }}
        />
      )}

      {/* Contradiction modal */}
      {contradictionItem && (
        <ContradictionModal
          item={contradictionItem}
          onResolve={(res) => {
            console.log('Resolved', res);
            setContradictionItem(null);
          }}
          onClose={() => setContradictionItem(null)}
        />
      )}
    </AppShell>
  );
}
