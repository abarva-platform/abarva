'use client';

// src/components/source/PatternSelector.tsx
//
// REASON-25 — pattern selector + doctrine preview pane for source-event creation.
// Renders a card grid of all 7 typed lifecycle patterns. Selecting a card
// surfaces a small preview pane (first stages, top required artifacts, one
// contradiction template) so the choice is a moment of doctrine awareness.

import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import type { LifecyclePatternSeed, SourceEventPatternId } from '@/lib/intelligence/seed-types';
import { previewPattern, summarizePattern } from '@/lib/reasoning/pattern-summary';
import { SHELL } from '@/lib/shell/shell-tokens';

interface PatternSelectorProps {
  value: SourceEventPatternId | null;
  onChange: (patternId: SourceEventPatternId) => void;
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface PatternCardProps {
  pattern: LifecyclePatternSeed;
  selected: boolean;
  onSelect: () => void;
}

function PatternCard({ pattern, selected, onSelect }: PatternCardProps) {
  const summary = summarizePattern(pattern);

  const cardStyle: React.CSSProperties = {
    textAlign: 'left',
    cursor: 'pointer',
    padding: '14px 16px',
    borderRadius: 8,
    background: selected ? SHELL.PAPER_SOFT : SHELL.CARD_WHITE,
    border: `1px solid ${selected ? SHELL.INK : SHELL.CARD_LINE}`,
    boxShadow: selected ? `inset 0 0 0 1px ${SHELL.INK}` : 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    transition: 'background 120ms ease',
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      style={cardStyle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 15,
            fontWeight: 'normal',
            color: SHELL.INK,
            lineHeight: 1.25,
          }}
        >
          {summary.title}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {summary.patternId}
        </span>
      </div>

      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.4,
        }}
      >
        {summary.applicabilityLine}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            background: SHELL.GRAY_BG,
            color: SHELL.GRAY_TEXT,
            borderRadius: 4,
            padding: '2px 8px',
          }}
        >
          {summary.stageCountLabel}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            background: SHELL.GRAY_BG,
            color: SHELL.GRAY_TEXT,
            borderRadius: 4,
            padding: '2px 8px',
          }}
        >
          {summary.durationLabel}
        </span>
      </div>
    </button>
  );
}

// ── Preview pane ──────────────────────────────────────────────────────────────

function PreviewSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: SHELL.INK_MUTED,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function PatternPreview({ pattern }: { pattern: LifecyclePatternSeed }) {
  const preview = previewPattern(pattern);
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 8,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <PreviewSectionLabel>First stages</PreviewSectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {preview.topStageLabels.map((label, idx) => (
            <span
              key={`${label}-${idx}`}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                color: SHELL.INK_SOFT,
                borderRadius: 4,
                padding: '3px 8px',
              }}
            >
              {idx + 1}. {label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <PreviewSectionLabel>Top expected artifacts</PreviewSectionLabel>
        {preview.topArtifacts.length === 0 ? (
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
            None defined.
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {preview.topArtifacts.map((art) => (
              <li
                key={art.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                }}
              >
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    background: art.requirement === 'required' ? SHELL.INK : SHELL.GRAY_BG,
                    color: art.requirement === 'required' ? SHELL.PAPER : SHELL.GRAY_TEXT,
                    borderRadius: 3,
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {art.requirement}
                </span>
                <span style={{ flex: 1 }}>{art.label}</span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: SHELL.INK_MUTED,
                  }}
                >
                  {art.stageId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <PreviewSectionLabel>Sample contradiction</PreviewSectionLabel>
        {preview.topContradiction ? (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK,
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{preview.topContradiction.label}</div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_SOFT,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span>{preview.topContradiction.partyA}</span>
              <span style={{ color: SHELL.INK_MUTED }}>vs</span>
              <span>{preview.topContradiction.partyB}</span>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
            No contradiction templates defined for this pattern.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main selector ─────────────────────────────────────────────────────────────

export function PatternSelector({ value, onChange }: PatternSelectorProps) {
  const selectedPattern =
    SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === value) ?? null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <div role="radiogroup" aria-label="Source-event lifecycle pattern" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SOURCE_LIFECYCLE_PATTERNS.map((pattern) => (
          <PatternCard
            key={pattern.patternId}
            pattern={pattern}
            selected={value === pattern.patternId}
            onSelect={() => onChange(pattern.patternId as SourceEventPatternId)}
          />
        ))}
      </div>

      <div style={{ position: 'sticky', top: 16 }}>
        {selectedPattern ? (
          <PatternPreview pattern={selectedPattern} />
        ) : (
          <div
            style={{
              background: SHELL.PAPER_SOFT,
              border: `1px dashed ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: '20px 18px',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Select a pattern to see its first stages, required artifacts, and a sample
            contradiction template.
          </div>
        )}
      </div>
    </div>
  );
}
