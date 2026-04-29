// /admin/reasoning/lifecycle-map — Visual map of every lifecycle pattern's
// stage progression: ordered stages with gate counts forming a pipeline view.
//
// Pure server component — no client JS needed.
//
// Sections:
//   SummaryStrip      — N patterns · M total stages · K total gate criteria
//   PatternPipelineCard per pattern — horizontal stage flow with gate counts
//   Patterns sorted by stage count descending

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed, PatternDomain } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lifecycle map · AbarVa Admin',
};

// ─── Domain colour palette (mirrors pattern-domains page) ─────────────────────

const DOMAIN_COLORS: Record<PatternDomain, { bg: string; line: string; text: string }> = {
  sourcing:          { bg: SHELL.BLUE_BG,    line: SHELL.BLUE_LINE,  text: SHELL.INK_MID },
  cdp:               { bg: SHELL.MINT_BG,    line: SHELL.MINT_LINE,  text: SHELL.MINT_TEXT },
  ai_programs:       { bg: SHELL.PEACH_BG,   line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  architecture:      { bg: SHELL.GRAY_BG,    line: SHELL.GRAY_LINE,  text: SHELL.GRAY_TEXT },
  industry_specific: { bg: SHELL.RUST_BG,    line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
  compliance:        { bg: SHELL.BLUE_BG,    line: SHELL.BLUE_LINE,  text: SHELL.INK_MID },
  future_of_work:    { bg: SHELL.GRAY_BG,    line: SHELL.GRAY_LINE,  text: SHELL.GRAY_TEXT },
  meta:              { bg: SHELL.PAPER_DEEP, line: SHELL.CARD_LINE,  text: SHELL.INK_SOFT },
};

const DOMAIN_LABELS: Record<PatternDomain, string> = {
  sourcing:          'Sourcing',
  cdp:               'CDP',
  ai_programs:       'AI Programs',
  architecture:      'Architecture',
  industry_specific: 'Industry',
  compliance:        'Compliance',
  future_of_work:    'Future of Work',
  meta:              'Meta',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface StageSlot {
  stageId: string;
  label: string;
  order: number;
  hardCount: number;
  softCount: number;
  totalCount: number;
}

interface PatternRow {
  patternId: string;
  title: string;
  domain: PatternDomain;
  confidence: number;
  stageSlots: StageSlot[];
  totalGates: number;
  hardGates: number;
  softGates: number;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildPatternRows(): PatternRow[] {
  const patterns = getAllLifecyclePatterns();

  const rows: PatternRow[] = patterns.map((p: LifecyclePatternSeed): PatternRow => {
    const sortedStages = [...p.stages].sort((a, b) => a.order - b.order);

    const stageSlots: StageSlot[] = sortedStages.map((stage) => {
      const criteria = p.gateCriteria.filter((g) => g.stageId === stage.id);
      const hardCount = criteria.filter((g) => g.gateType === 'hard').length;
      const softCount = criteria.filter((g) => g.gateType === 'soft').length;
      return {
        stageId: stage.id,
        label: stage.label,
        order: stage.order,
        hardCount,
        softCount,
        totalCount: hardCount + softCount,
      };
    });

    const totalGates = p.gateCriteria.length;
    const hardGates = p.gateCriteria.filter((g) => g.gateType === 'hard').length;
    const softGates = p.gateCriteria.filter((g) => g.gateType === 'soft').length;

    return {
      patternId: p.patternId,
      title: p.title,
      domain: p.domain as PatternDomain,
      confidence: p.confidence,
      stageSlots,
      totalGates,
      hardGates,
      softGates,
    };
  });

  // Sort by stage count descending
  rows.sort((a, b) => b.stageSlots.length - a.stageSlots.length);
  return rows;
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: PatternRow[] }) {
  const totalPatterns = rows.length;
  const totalStages = rows.reduce((s, r) => s + r.stageSlots.length, 0);
  const totalGates = rows.reduce((s, r) => s + r.totalGates, 0);
  const totalHard = rows.reduce((s, r) => s + r.hardGates, 0);
  const totalSoft = rows.reduce((s, r) => s + r.softGates, 0);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${SPACING.sm} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {totalPatterns} pattern{totalPatterns === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 700 }}>{totalStages}</span>
        {' total stages'}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 700 }}>{totalGates}</span>
        {' total gate criteria'}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACING.sm,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            aria-label="hard gate"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: SHELL.RUST_TEXT,
              flexShrink: 0,
            }}
          />
          <span style={{ color: SHELL.RUST_TEXT }}>{totalHard} hard</span>
        </span>
        <span style={{ color: `${COLORS.ink}44` }}>/</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            aria-label="soft gate"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: COLORS.navy,
              flexShrink: 0,
            }}
          />
          <span style={{ color: COLORS.navy }}>{totalSoft} soft</span>
        </span>
      </span>
    </div>
  );
}

// ─── DomainPill ───────────────────────────────────────────────────────────────

function DomainPill({ domain }: { domain: PatternDomain }) {
  const col = DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.meta;
  return (
    <span
      style={{
        display: 'inline-block',
        background: col.bg,
        color: col.text,
        border: `1px solid ${col.line}`,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {DOMAIN_LABELS[domain] ?? domain}
    </span>
  );
}

// ─── ConfidenceBadge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const bg =
    pct >= 80 ? SHELL.MINT_BG : pct >= 50 ? SHELL.PEACH_BG : SHELL.RUST_BG;
  const fg =
    pct >= 80 ? SHELL.MINT_TEXT : pct >= 50 ? SHELL.PEACH_TEXT : SHELL.RUST_TEXT;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {pct}%
    </span>
  );
}

// ─── StageBox ─────────────────────────────────────────────────────────────────

function StageBox({ slot }: { slot: StageSlot }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 96,
        maxWidth: 140,
        flex: '1 0 96px',
        background: SHELL.PAPER,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        gap: 6,
      }}
    >
      {/* Stage label */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          color: SHELL.INK,
          textAlign: 'center',
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {slot.label}
      </span>
      {/* Gate counts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {slot.hardCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: SHELL.RUST_TEXT,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: SHELL.RUST_TEXT,
                flexShrink: 0,
              }}
            />
            {slot.hardCount}
          </span>
        )}
        {slot.softCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: COLORS.navy,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: COLORS.navy,
                flexShrink: 0,
              }}
            />
            {slot.softCount}
          </span>
        )}
        {slot.hardCount === 0 && slot.softCount === 0 && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}55`,
            }}
          >
            0 gates
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Arrow connector ──────────────────────────────────────────────────────────

function ArrowConnector() {
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 14,
        color: `${COLORS.ink}44`,
        flexShrink: 0,
        alignSelf: 'center',
        userSelect: 'none',
      }}
    >
      →
    </span>
  );
}

// ─── PatternPipelineCard ──────────────────────────────────────────────────────

function PatternPipelineCard({ row }: { row: PatternRow }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            minWidth: 0,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {row.title}
          </span>
          <DomainPill domain={row.domain} />
          <ConfidenceBadge confidence={row.confidence} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}77`,
              whiteSpace: 'nowrap',
            }}
          >
            {row.stageSlots.length} stage{row.stageSlots.length === 1 ? '' : 's'}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}77`,
              whiteSpace: 'nowrap',
            }}
          >
            {row.totalGates} gate{row.totalGates === 1 ? '' : 's'}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}55`,
            }}
          >
            {row.patternId}
          </span>
        </div>
      </div>

      {/* Stage pipeline */}
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: SPACING.xs,
          overflowX: 'auto',
        }}
      >
        {row.stageSlots.length === 0 ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            No stages defined for this pattern.
          </span>
        ) : (
          row.stageSlots.map((slot, idx) => (
            <div
              key={slot.stageId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
              }}
            >
              <StageBox slot={slot} />
              {idx < row.stageSlots.length - 1 && <ArrowConnector />}
            </div>
          ))
        )}
      </div>

      {/* Gate legend footer */}
      <div
        style={{
          padding: `${SPACING.xs} ${SPACING.lg}`,
          borderTop: `1px solid ${COLORS.ink}08`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg,
          background: `${COLORS.ink}04`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: SHELL.RUST_TEXT,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: SHELL.RUST_TEXT,
            }}
          />
          {row.hardGates} hard
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: COLORS.navy,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: COLORS.navy,
            }}
          />
          {row.softGates} soft
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LifecycleMapPage() {
  const rows = buildPatternRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Pattern explorer"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Lifecycle map"
        subtitle="Visual stage-pipeline map for every lifecycle pattern — stages ordered with hard and soft gate criterion counts per stage."
      >
        <SummaryStrip rows={rows} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {rows.map((row) => {
            const card = <PatternPipelineCard row={row} />;
            return (
              <div key={row.patternId}>
                {card}
              </div>
            );
          })}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
