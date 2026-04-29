// /admin/reasoning/pattern-confidence — Lifecycle patterns ranked by confidence score.
//
// Pure server component. Loads all lifecycle patterns, sorts by confidence
// descending, and renders a leaderboard with distribution bands, status
// badges, createdFrom lineage, and active instance counts.

import { RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { PatternStatus, PatternCreatedFrom } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern confidence · AbarVa Admin',
};

// ─── Colour helpers ───────────────────────────────────────────────────────────

/** Confidence band thresholds */
const HIGH_THRESHOLD = 0.8;
const MID_THRESHOLD = 0.5;

type ConfidenceBand = 'high' | 'medium' | 'low';

function getBand(confidence: number): ConfidenceBand {
  if (confidence >= HIGH_THRESHOLD) return 'high';
  if (confidence >= MID_THRESHOLD) return 'medium';
  return 'low';
}

function bandPalette(band: ConfidenceBand): { bar: string; text: string; bg: string } {
  switch (band) {
    case 'high':   return { bar: SHELL.MINT_TEXT, text: SHELL.MINT_TEXT, bg: SHELL.MINT_BG };
    case 'medium': return { bar: SHELL.AMBER_DOT, text: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG };
    case 'low':    return { bar: SHELL.RUST_TEXT, text: SHELL.RUST_TEXT, bg: SHELL.RUST_BG };
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusPalette(status: PatternStatus): { bg: string; text: string } {
  if (status === 'AUTHORED-EXPERT')    return { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT };
  if (status === 'AUTHORED-REVIEWED')  return { bg: SHELL.BLUE_BG,  text: SHELL.INK_MID };
  if (status === 'AUTHORED-DRAFT')     return { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT };
  if (status === 'IN-AUTHORING')       return { bg: SHELL.BLUE_BG,  text: SHELL.INK_MID };
  if (status === 'COMMISSIONED')       return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT }; // PROPOSED
}

function humanStatus(status: PatternStatus): string {
  const map: Record<PatternStatus, string> = {
    'AUTHORED-DRAFT':    'Draft',
    'AUTHORED-REVIEWED': 'Reviewed',
    'AUTHORED-EXPERT':   'Expert',
    'IN-AUTHORING':      'Authoring',
    'COMMISSIONED':      'Commissioned',
    'PROPOSED':          'Proposed',
  };
  return map[status] ?? status;
}

// ─── CreatedFrom helpers ──────────────────────────────────────────────────────

function createdFromPalette(cf: PatternCreatedFrom): { bg: string; text: string } {
  if (cf === 'human_authored')    return { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT };
  if (cf === 'deterministic_seed') return { bg: SHELL.BLUE_BG, text: SHELL.INK_MID };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

function humanCreatedFrom(cf: PatternCreatedFrom): string {
  if (cf === 'human_authored')     return 'expert';
  if (cf === 'deterministic_seed') return 'derived';
  return cf;
}

// ─── Badge component ──────────────────────────────────────────────────────────

function Pill({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  avgConfidence,
  expertValidated,
}: {
  total: number;
  avgConfidence: number;
  expertValidated: number;
}) {
  const items = [
    { value: `${total}`,                label: 'pattern' + (total === 1 ? '' : 's') },
    { value: `${Math.round(avgConfidence * 100)}%`, label: 'avg confidence' },
    { value: `${expertValidated}`,       label: 'expert-validated' },
  ];
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.lg,
        alignItems: 'baseline',
      }}
    >
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              letterSpacing: '-0.02em',
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
            }}
          >
            {item.label}
          </span>
          {i < items.length - 1 && (
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 14,
                color: SHELL.CARD_LINE,
                marginLeft: 8,
              }}
            >
              ·
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar({
  highCount,
  medCount,
  lowCount,
  total,
}: {
  highCount: number;
  medCount: number;
  lowCount: number;
  total: number;
}) {
  const highPct = total > 0 ? (highCount / total) * 100 : 0;
  const medPct  = total > 0 ? (medCount / total) * 100 : 0;
  const lowPct  = total > 0 ? (lowCount / total) * 100 : 0;

  const segments: Array<{ pct: number; color: string; label: string; count: number }> = [
    { pct: highPct, color: SHELL.MINT_TEXT,  label: 'High ≥80%',   count: highCount },
    { pct: medPct,  color: SHELL.AMBER_DOT,  label: 'Med 50–79%',  count: medCount },
    { pct: lowPct,  color: SHELL.RUST_TEXT,  label: 'Low <50%',    count: lowCount },
  ];

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_SOFT,
          fontWeight: 600,
        }}
      >
        Confidence distribution
      </div>

      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: RADIUS.sm,
          overflow: 'hidden',
          background: SHELL.GRAY_BG,
        }}
      >
        {segments.map((seg, i) =>
          seg.pct > 0 ? (
            <div
              key={i}
              title={`${seg.label}: ${seg.count}`}
              style={{
                width: `${seg.pct}%`,
                background: seg.color,
                opacity: 0.85,
              }}
            />
          ) : null,
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: SPACING.lg, flexWrap: 'wrap' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: seg.color,
                opacity: 0.85,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
              }}
            >
              {seg.label}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 12,
                color: SHELL.INK_MID,
                fontWeight: 600,
              }}
            >
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Table cells ──────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
  fontWeight: 700,
  color: SHELL.INK,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};

// ─── Confidence bar cell ──────────────────────────────────────────────────────

function ConfidenceCell({ confidence }: { confidence: number }) {
  const band = getBand(confidence);
  const { bar, text } = bandPalette(band);
  const pct = Math.round(confidence * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 18,
          fontWeight: 700,
          color: text,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {pct}%
      </span>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: SHELL.GRAY_BG,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: bar,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

// ─── Ranked table ─────────────────────────────────────────────────────────────

interface PatternRow {
  rank: number;
  patternId: string;
  title: string;
  confidence: number;
  status: PatternStatus;
  createdFrom: PatternCreatedFrom;
  activeInstances: number;
  version: string;
}

function RankedTable({ rows }: { rows: PatternRow[] }) {
  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Patterns by confidence
        </h2>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {rows.length} pattern{rows.length === 1 ? '' : 's'} · sorted by confidence desc
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 40, textAlign: 'center' }}>#</th>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Confidence</th>
              <th style={HEADER_CELL}>Status</th>
              <th style={HEADER_CELL}>Source</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Instances</th>
              <th style={HEADER_CELL}>Version</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const sPal = statusPalette(row.status);
              const cfPal = createdFromPalette(row.createdFrom);
              return (
                <tr key={row.patternId}>
                  {/* Rank */}
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                      fontSize: 13,
                      color: SHELL.INK_MUTED,
                      fontWeight: 600,
                    }}
                  >
                    {row.rank}
                  </td>

                  {/* Pattern title + ID */}
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        fontFamily: SHELL.SANS,
                        fontSize: 14,
                        fontWeight: 600,
                        color: SHELL.INK,
                        lineHeight: 1.3,
                      }}
                    >
                      {row.title}
                    </div>
                    <div
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 11,
                        color: SHELL.INK_MUTED,
                        marginTop: 2,
                      }}
                    >
                      {row.patternId}
                    </div>
                  </td>

                  {/* Confidence bar */}
                  <td style={BODY_CELL}>
                    <ConfidenceCell confidence={row.confidence} />
                  </td>

                  {/* Status badge */}
                  <td style={BODY_CELL}>
                    <Pill label={humanStatus(row.status)} bg={sPal.bg} text={sPal.text} />
                  </td>

                  {/* createdFrom badge */}
                  <td style={BODY_CELL}>
                    <Pill
                      label={humanCreatedFrom(row.createdFrom)}
                      bg={cfPal.bg}
                      text={cfPal.text}
                    />
                  </td>

                  {/* Active instances */}
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: row.activeInstances > 0 ? 700 : 400,
                      color: row.activeInstances > 0 ? SHELL.INK_MID : SHELL.INK_MUTED,
                    }}
                  >
                    {row.activeInstances}
                  </td>

                  {/* Version */}
                  <td style={MONO_CELL}>{row.version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternConfidencePage() {
  const allPatterns = getAllLifecyclePatterns();

  // Build active-instance count per patternId
  const instanceCounts = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }

  // Sort by confidence descending
  const sorted = [...allPatterns].sort((a, b) => b.confidence - a.confidence);

  // Build table rows
  const rows: PatternRow[] = sorted.map((p, i) => ({
    rank: i + 1,
    patternId: p.patternId,
    title: p.title,
    confidence: p.confidence,
    status: p.status as PatternStatus,
    createdFrom: p.createdFrom as PatternCreatedFrom,
    activeInstances: instanceCounts.get(p.patternId) ?? 0,
    version: p.version ?? '1.0',
  }));

  // Summary stats
  const total = rows.length;
  const avgConfidence = total > 0 ? rows.reduce((s, r) => s + r.confidence, 0) / total : 0;
  const expertValidated = rows.filter(
    (r) => r.status === 'AUTHORED-EXPERT' || r.status === 'AUTHORED-REVIEWED',
  ).length;

  // Band counts for distribution bar
  const highCount = rows.filter((r) => r.confidence >= HIGH_THRESHOLD).length;
  const medCount  = rows.filter((r) => r.confidence >= MID_THRESHOLD && r.confidence < HIGH_THRESHOLD).length;
  const lowCount  = rows.filter((r) => r.confidence < MID_THRESHOLD).length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Pattern domains"
          primaryActionHref="/admin/reasoning/pattern-domains"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Pattern confidence"
        subtitle="Lifecycle patterns ranked by confidence score — reflects evidence base and validation status."
      >
        <SummaryStrip
          total={total}
          avgConfidence={avgConfidence}
          expertValidated={expertValidated}
        />
        <DistributionBar
          highCount={highCount}
          medCount={medCount}
          lowCount={lowCount}
          total={total}
        />
        <RankedTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
