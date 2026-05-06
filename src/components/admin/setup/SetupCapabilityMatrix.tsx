/**
 * SetupCapabilityMatrix · SETUP-1.4
 *
 * Replaces SetupActTwo / SetupActTwoMap with a 14-segment × 6-capability
 * depth matrix. Verbs are workflow-anchored ("Cite evidence") not
 * agent-domain framings.
 *
 * Per Claude Design's Setup Module redesign 2026-05-06.
 */

import type {
  CapabilityDepth,
  CapabilityMatrixRow,
  CapabilityNarrativeCard,
  CapabilityNarrativeKind,
  CapabilityVerb,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

import { SetupActHeader } from './SetupActOne';

export interface SetupCapabilityMatrixProps {
  matrix: CapabilityMatrixRow[];
  narrativeCards: CapabilityNarrativeCard[];
}

const VERB_ORDER: readonly CapabilityVerb[] = [
  'cite-evidence',
  'model-run-rate',
  'detect-risk',
  'synthesize-cross-program',
  'advance-lifecycle',
  'audit-govern',
] as const;

const VERB_LABELS: Record<CapabilityVerb, string> = {
  'cite-evidence': 'Cite evidence',
  'model-run-rate': 'Model run-rate',
  'detect-risk': 'Detect risk',
  'synthesize-cross-program': 'Synthesize cross-program',
  'advance-lifecycle': 'Advance lifecycle',
  'audit-govern': 'Audit / govern',
};

export function SetupCapabilityMatrix({
  matrix,
  narrativeCards,
}: SetupCapabilityMatrixProps) {
  const empty = matrix.length === 0;

  return (
    <section
      data-testid="admin-setup-capability-matrix"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <SetupActHeader
        eyebrow="Capability constellation"
        title="What this tenant can reason about"
        subtitle="Reasoning depth across the 14 data segments and six platform capabilities. A capability is deep when there's enough grounded evidence to cite confidently; thin or empty where the segment under it is sparse or missing."
      />

      {empty ? (
        <p
          data-testid="admin-setup-capability-matrix-empty"
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_SOFT,
            fontStyle: 'italic',
          }}
        >
          Capability matrix is empty. Load org structure, program inventory, and evidence ledger to start grounding the corpus.
        </p>
      ) : (
        <>
          <MatrixTable matrix={matrix} />
          <Legend />
          {narrativeCards.length > 0 ? <NarrativeGrid cards={narrativeCards} /> : null}
        </>
      )}
    </section>
  );
}

// ── Matrix table ─────────────────────────────────────────────────────────────

function MatrixTable({ matrix }: { matrix: CapabilityMatrixRow[] }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.md,
        padding: '14px 14px 8px',
        overflowX: 'auto',
      }}
    >
      <table
        role="table"
        aria-label="Capability matrix: 14 segments by 6 reasoning verbs"
        style={{
          borderCollapse: 'collapse',
          fontFamily: SHELL.SANS,
          width: '100%',
          minWidth: 720,
        }}
      >
        <thead>
          <tr>
            <th
              scope="col"
              style={{
                ...HEADER_CELL,
                textAlign: 'left',
                paddingLeft: 4,
              }}
            >
              Segment
            </th>
            {VERB_ORDER.map((verb) => (
              <th key={verb} scope="col" style={HEADER_CELL}>
                {VERB_LABELS[verb]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, idx) => (
            <tr
              key={row.segmentId}
              style={idx === 0 ? undefined : { borderTop: `1px solid ${SHELL.CARD_LINE}` }}
            >
              <td style={SEG_CELL}>
                <span style={SEG_NUM}>{row.segmentId}</span>
                {row.segmentName}
              </td>
              {VERB_ORDER.map((verb) => (
                <td key={verb} style={DOT_CELL}>
                  <DepthDot depth={row.depths[verb]} ariaLabel={`${row.segmentName} · ${VERB_LABELS[verb]}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HEADER_CELL: React.CSSProperties = {
  padding: '7px 8px 10px',
  textAlign: 'center',
  verticalAlign: 'middle',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  whiteSpace: 'nowrap',
};

const SEG_CELL: React.CSSProperties = {
  padding: '8px 14px 8px 4px',
  textAlign: 'left',
  verticalAlign: 'middle',
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: COLORS.ink,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  borderRight: `1px solid ${SHELL.CARD_LINE}`,
};

const SEG_NUM: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  color: SHELL.INK_MUTED,
  marginRight: 8,
  letterSpacing: '0.04em',
  fontWeight: 600,
};

const DOT_CELL: React.CSSProperties = {
  padding: '7px 8px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

// ── Depth dot ────────────────────────────────────────────────────────────────

function DepthDot({ depth, ariaLabel }: { depth: CapabilityDepth; ariaLabel: string }) {
  const tone = depthTone(depth);
  return (
    <span
      role="img"
      aria-label={`${ariaLabel} — ${depth}`}
      title={`${depth}`}
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: tone.fill,
        border: `1px solid ${tone.stroke}`,
        borderStyle: depth === 'empty' ? 'dashed' : 'solid',
        opacity: depth === 'thin' ? 0.6 : 1,
      }}
    />
  );
}

function depthTone(depth: CapabilityDepth): { fill: string; stroke: string } {
  switch (depth) {
    case 'deep':
      return { fill: COLORS.mintInk, stroke: COLORS.mintInk };
    case 'partial':
      return { fill: COLORS.amberInk, stroke: COLORS.amberInk };
    case 'thin':
      return { fill: COLORS.coralInk, stroke: COLORS.coralInk };
    case 'empty':
      return { fill: 'transparent', stroke: SHELL.CARD_LINE };
  }
}

// ── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items: Array<{ depth: CapabilityDepth; label: string }> = [
    { depth: 'deep', label: 'Deep · grounded, citable' },
    { depth: 'partial', label: 'Partial · usable with caveats' },
    { depth: 'thin', label: 'Thin · low confidence' },
    { depth: 'empty', label: 'Empty · cannot reason' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        paddingTop: 12,
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        color: SHELL.INK_MUTED,
        letterSpacing: '0.04em',
      }}
    >
      {items.map(({ depth, label }) => (
        <span key={depth} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <DepthDot depth={depth} ariaLabel={label} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Narrative cards ──────────────────────────────────────────────────────────

function NarrativeGrid({ cards }: { cards: CapabilityNarrativeCard[] }) {
  return (
    <div
      data-testid="admin-setup-capability-narrative"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {cards.map((card, i) => (
        <NarrativeCard key={i} card={card} />
      ))}
    </div>
  );
}

function NarrativeCard({ card }: { card: CapabilityNarrativeCard }) {
  const labelColor = narrativeLabelColor(card.kind);
  return (
    <div
      data-testid={`admin-setup-narrative-${card.kind}`}
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.md,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: labelColor,
          fontWeight: 700,
        }}
      >
        {narrativeLabelText(card.kind)}
      </p>
      <h3
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {card.heading}
      </h3>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
        }}
      >
        {card.body}
      </p>
      <p
        style={{
          margin: '8px 0 0',
          paddingTop: 8,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          borderTop: `1px dashed ${SHELL.CARD_LINE}`,
        }}
      >
        {card.basis}
      </p>
    </div>
  );
}

function narrativeLabelColor(kind: CapabilityNarrativeKind): string {
  switch (kind) {
    case 'deep':
      return COLORS.mintInk;
    case 'partial':
      return COLORS.amberInk;
    case 'thin':
    case 'blocked':
      return COLORS.coralInk;
  }
}

function narrativeLabelText(kind: CapabilityNarrativeKind): string {
  switch (kind) {
    case 'deep':
      return 'Deep';
    case 'partial':
      return 'Partial';
    case 'thin':
      return 'Thin';
    case 'blocked':
      return 'Blocked';
  }
}
