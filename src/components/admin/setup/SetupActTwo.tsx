/**
 * SetupActTwo · SETUP-1.3
 *
 * Act 2 — "What we can reason about because of that data."
 *
 * Renders the four capability families as a capability constellation:
 * a 2×2 SVG lattice with a corpus hub at center, four nodes orbiting
 * at quadrant positions, and depth state encoded in BOTH form (solid /
 * dashed / transparent disk stroke) AND color — so it survives
 * colorblind and grayscale-print passes (NFR-014).
 *
 * Axes: X = Describes corpus → Enables decisions,
 *        Y = Past → Future (top).
 *
 * The first grounding example per node is always visible; examples 2
 * and 3 reveal on :hover / :focus-within (CSS only, NFR-004 no-JS).
 * A visually-hidden <ul> carries all examples for screen readers.
 *
 * Per SETUP-1.3 Constellation Memo (2026-05-06).
 */

import Link from 'next/link';

import type {
  CapabilityDepthState,
  CapabilityFamily,
  CapabilityNode,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

import { SetupActHeader } from './SetupActOne';

export interface SetupActTwoProps {
  capabilities: CapabilityNode[];
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const VB_W = 860;
const VB_H = 440;
const HUB = { cx: 430, cy: 220, r: 42 };
const NODE_R = 28;

// Quadrant placement — hand-placed per design memo.
// X axis: left=describes-corpus, right=enables-decisions.
// Y axis: top=future, bottom=past.
const FAMILY_POS: Record<
  CapabilityFamily,
  {
    cx: number;
    cy: number;
    nameY: number;   // y for family name label
    countY: number;  // y for count mono label
    ex0Y: number;    // y for primary example
    ex1Y: number;    // y for secondary example 1
    ex2Y: number;    // y for secondary example 2
  }
> = {
  // TL: cross-program signals — current signals, corpus-facing
  'cross-program-signals': {
    cx: 150, cy: 112,
    nameY: 78, countY: 65,
    ex0Y: 154, ex1Y: 167, ex2Y: 180,
  },
  // TR: outcome-measurement-readiness — future-facing, decision-enabling
  'outcome-measurement-readiness': {
    cx: 710, cy: 112,
    nameY: 78, countY: 65,
    ex0Y: 154, ex1Y: 167, ex2Y: 180,
  },
  // BL: pattern-citations — historical corpus, pattern matching
  'pattern-citations': {
    cx: 150, cy: 328,
    nameY: 372, countY: 385,
    ex0Y: 286, ex1Y: 273, ex2Y: 260,
  },
  // BR: evidence-grounded Q&A — answering from existing evidence
  'evidence-grounded-qa': {
    cx: 710, cy: 328,
    nameY: 372, countY: 385,
    ex0Y: 286, ex1Y: 273, ex2Y: 260,
  },
};

const FAMILY_DISPLAY: Record<CapabilityFamily, string> = {
  'pattern-citations':             'Pattern citations',
  'cross-program-signals':         'Cross-program signals',
  'evidence-grounded-qa':          'Evidence-grounded Q&A',
  'outcome-measurement-readiness': 'Outcome readiness',
};

// ---------------------------------------------------------------------------
// Depth-state encoding — form + color (dual encoding for accessibility)
// ---------------------------------------------------------------------------

function nodeEncoding(state: CapabilityDepthState) {
  if (state === 'grounded') {
    return {
      fill: COLORS.mintSoft,
      stroke: COLORS.mintInk,
      strokeDasharray: undefined,
      strokeWidth: 2,
      glyph: '●',
      glyphColor: COLORS.mintInk,
      ariaState: 'grounded · sufficient data',
    };
  }
  if (state === 'partial') {
    return {
      fill: COLORS.amberSoft,
      stroke: COLORS.amberInk,
      strokeDasharray: '4 3' as string,
      strokeWidth: 2,
      glyph: '◐',
      glyphColor: COLORS.amberInk,
      ariaState: 'partial · thin data',
    };
  }
  return {
    fill: 'transparent',
    stroke: COLORS.coralInk,
    strokeDasharray: '3 3' as string,
    strokeWidth: 1.5,
    glyph: '○',
    glyphColor: COLORS.coralInk,
    ariaState: 'missing · no data loaded',
  };
}

function truncate(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ---------------------------------------------------------------------------
// Spoke line
// ---------------------------------------------------------------------------

function Spoke({ pos }: { pos: { cx: number; cy: number } }) {
  return (
    <line
      x1={HUB.cx}
      y1={HUB.cy}
      x2={pos.cx}
      y2={pos.cy}
      stroke={SHELL.CARD_LINE}
      strokeWidth={1}
      strokeDasharray="3 4"
    />
  );
}

// ---------------------------------------------------------------------------
// Single constellation node
// ---------------------------------------------------------------------------

function ConstellationNode({ cap }: { cap: CapabilityNode }) {
  const pos = FAMILY_POS[cap.family];
  const enc = nodeEncoding(cap.depthState);
  const ex0 = cap.groundingExamples[0];
  const ex1 = cap.groundingExamples[1];
  const ex2 = cap.groundingExamples[2];
  const isTop = pos.cy < HUB.cy;

  return (
    <g
      className="cap-node"
      role="listitem"
      tabIndex={0}
      aria-label={`${FAMILY_DISPLAY[cap.family]} — ${enc.ariaState}: ${cap.label}`}
    >
      {/* Disk — form encodes depth state */}
      <circle
        cx={pos.cx}
        cy={pos.cy}
        r={NODE_R}
        fill={enc.fill}
        stroke={enc.stroke}
        strokeWidth={enc.strokeWidth}
        strokeDasharray={enc.strokeDasharray}
      />

      {/* Glyph — redundant depth indicator inside disk */}
      <text
        x={pos.cx}
        y={pos.cy + 5}
        textAnchor="middle"
        fontFamily={TYPOGRAPHY.sans}
        fontSize={15}
        fontWeight={700}
        fill={enc.glyphColor}
        data-testid={`admin-setup-depth-${cap.depthState}`}
        aria-hidden="true"
      >
        {enc.glyph}
      </text>

      {/* Missing invitation — "→ this could be here" */}
      {cap.depthState === 'missing' && (
        <text
          x={pos.cx}
          y={pos.cy + NODE_R + (isTop ? 14 : -8)}
          textAnchor="middle"
          fontFamily={TYPOGRAPHY.mono}
          fontSize={8}
          fontWeight={700}
          fill={COLORS.coralInk}
          letterSpacing={1.2}
          aria-hidden="true"
        >
          → THIS COULD BE HERE
        </text>
      )}

      {/* Family name */}
      <text
        x={pos.cx}
        y={pos.nameY}
        textAnchor="middle"
        fontFamily={TYPOGRAPHY.sans}
        fontSize={12}
        fontWeight={700}
        fill={COLORS.ink}
        aria-hidden="true"
      >
        {FAMILY_DISPLAY[cap.family]}
      </text>

      {/* Count (mono) */}
      <text
        x={pos.cx}
        y={pos.countY}
        textAnchor="middle"
        fontFamily={TYPOGRAPHY.mono}
        fontSize={9}
        fill={SHELL.INK_MUTED}
        letterSpacing={1}
        aria-hidden="true"
      >
        {cap.count} {cap.countNoun}
      </text>

      {/* Primary grounding example — always visible */}
      {ex0 && (
        <text
          x={pos.cx}
          y={pos.ex0Y}
          textAnchor="middle"
          fontFamily={TYPOGRAPHY.sans}
          fontSize={10.5}
          fill={COLORS.navy}
          aria-hidden="true"
        >
          {truncate(ex0.label, 30)}
        </text>
      )}

      {/* Secondary examples — revealed on :hover / :focus-within via CSS */}
      <g className="cap-example-secondary" aria-hidden="true">
        {ex1 && (
          <text
            x={pos.cx}
            y={pos.ex1Y}
            textAnchor="middle"
            fontFamily={TYPOGRAPHY.sans}
            fontSize={10.5}
            fill={COLORS.navy}
            opacity={0.85}
          >
            {truncate(ex1.label, 30)}
          </text>
        )}
        {ex2 && (
          <text
            x={pos.cx}
            y={pos.ex2Y}
            textAnchor="middle"
            fontFamily={TYPOGRAPHY.sans}
            fontSize={10.5}
            fill={COLORS.navy}
            opacity={0.85}
          >
            {truncate(ex2.label, 30)}
          </text>
        )}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Full constellation SVG
// ---------------------------------------------------------------------------

function CapabilityConstellation({ capabilities }: { capabilities: CapabilityNode[] }) {
  const byFamily = Object.fromEntries(capabilities.map((c) => [c.family, c]));

  return (
    <>
      {/* CSS hover + accessibility (NFR-004 no-JS, NFR-011 keyboard, NFR-013 reduced-motion) */}
      <style>{`
        [data-testid="admin-setup-constellation"] .cap-node { cursor: default; }
        [data-testid="admin-setup-constellation"] .cap-node .cap-example-secondary {
          opacity: 0;
          transition: opacity 200ms ease;
        }
        [data-testid="admin-setup-constellation"] .cap-node:hover .cap-example-secondary,
        [data-testid="admin-setup-constellation"] .cap-node:focus .cap-example-secondary,
        [data-testid="admin-setup-constellation"] .cap-node:focus-within .cap-example-secondary {
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="admin-setup-constellation"] .cap-node .cap-example-secondary {
            transition: none;
          }
        }
      `}</style>

      <div data-testid="admin-setup-constellation">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="list"
          aria-label="Capability constellation — four capability families mapped against corpus depth and decision-enabling axes"
        >
          {/* Axis lines (subtle dashed, quiet) */}
          <line
            x1={HUB.cx} y1={36}
            x2={HUB.cx} y2={VB_H - 24}
            stroke={SHELL.CARD_LINE}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <line
            x1={52} y1={HUB.cy}
            x2={VB_W - 52} y2={HUB.cy}
            stroke={SHELL.CARD_LINE}
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Axis labels — mono 10px, quiet ink-muted */}
          <text
            x={56} y={22}
            fontFamily={TYPOGRAPHY.mono}
            fontSize={9.5}
            letterSpacing={1.4}
            fill={SHELL.INK_MUTED}
            fontWeight={700}
          >
            ← DESCRIBES CORPUS
          </text>
          <text
            x={VB_W - 56} y={22}
            textAnchor="end"
            fontFamily={TYPOGRAPHY.mono}
            fontSize={9.5}
            letterSpacing={1.4}
            fill={SHELL.INK_MUTED}
            fontWeight={700}
          >
            ENABLES DECISIONS →
          </text>
          <text
            x={HUB.cx + 8} y={48}
            fontFamily={TYPOGRAPHY.mono}
            fontSize={9}
            letterSpacing={1.3}
            fill={SHELL.INK_MUTED}
            fontWeight={700}
          >
            FUTURE ↑
          </text>
          <text
            x={HUB.cx + 8} y={VB_H - 18}
            fontFamily={TYPOGRAPHY.mono}
            fontSize={9}
            letterSpacing={1.3}
            fill={SHELL.INK_MUTED}
            fontWeight={700}
          >
            PAST ↓
          </text>

          {/* Corpus hub */}
          <g aria-label="Corpus hub — the grounded knowledge base">
            <circle
              cx={HUB.cx} cy={HUB.cy} r={HUB.r}
              fill={SHELL.PAPER_SOFT}
              stroke={COLORS.ink}
              strokeWidth={1}
            />
            <text
              x={HUB.cx} y={HUB.cy - 6}
              textAnchor="middle"
              fontFamily={TYPOGRAPHY.serif}
              fontSize={13}
              fontStyle="italic"
              fill={COLORS.ink}
            >
              corpus
            </text>
            <text
              x={HUB.cx} y={HUB.cy + 10}
              textAnchor="middle"
              fontFamily={TYPOGRAPHY.mono}
              fontSize={9}
              fill={SHELL.INK_MUTED}
              letterSpacing={1.2}
              fontWeight={700}
            >
              14 segments
            </text>
          </g>

          {/* Spokes + nodes — render spokes first so nodes sit on top */}
          {capabilities.map((cap) => (
            <Spoke key={`spoke-${cap.family}`} pos={FAMILY_POS[cap.family]} />
          ))}

          {(['cross-program-signals', 'outcome-measurement-readiness', 'pattern-citations', 'evidence-grounded-qa'] as CapabilityFamily[]).map(
            (family) => {
              const cap = byFamily[family];
              if (!cap) return null;
              return <ConstellationNode key={family} cap={cap} />;
            },
          )}
        </svg>

        {/* Visually-hidden list for screen readers — all examples as links */}
        <ul
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
          }}
          aria-label="Capability grounding examples"
        >
          {capabilities.map((cap) => (
            <li key={cap.id}>
              <strong>{FAMILY_DISPLAY[cap.family]}</strong> — {cap.depthState}:{' '}
              {cap.groundingExamples.map((ex, i) => (
                <Link key={i} href={ex.href}>
                  {ex.label}
                </Link>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty state (sparse tenant — capabilities array empty)
// ---------------------------------------------------------------------------

function ConstellationEmpty() {
  return (
    <p
      data-testid="admin-setup-empty"
      style={{
        margin: 0,
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_SOFT,
        fontStyle: 'italic',
      }}
    >
      Capability map is empty. Load Org structure + Program inventory + Evidence ledger to start grounding the corpus.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function SetupActTwo({ capabilities }: SetupActTwoProps) {
  return (
    <section
      data-testid="admin-setup-act-two"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
        position: 'relative',
      }}
    >
      <SetupActHeader
        eyebrow="Act 2"
        title="What we can reason about, because of that data"
        subtitle="Four capability families mapped by depth — grounded (●), partial (◐), missing (○). Hover or focus a node to see grounding examples."
      />

      {capabilities.length === 0 ? (
        <ConstellationEmpty />
      ) : (
        <CapabilityConstellation capabilities={capabilities} />
      )}
    </section>
  );
}
