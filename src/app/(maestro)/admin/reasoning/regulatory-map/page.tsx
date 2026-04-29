// /admin/reasoning/regulatory-map — Regulatory framework coverage map.
//
// Pure server component. Loads all lifecycle patterns, builds a
// regulation → { patterns[], instanceCount } map from `regulatoryChips`,
// and renders:
//   1. SummaryStrip   — N regulations · M patterns reference regulations · K instances affected
//   2. RegulationTable — Regulation | Pattern count | Instances affected | Pattern chips
//      sorted by instance count descending
//   3. PatternRegulationMatrix — each pattern that has regulatory chips shown
//      with its chip set
//
// Shows a neutral info card when no regulatory chips are found.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regulatory map · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface RegulationEntry {
  regulation: string;
  patternIds: string[];
  patternTitles: string[];
  instanceCount: number;
}

interface PatternChipRow {
  patternId: string;
  patternTitle: string;
  chips: string[];
  instanceCount: number;
}

interface RegulatoryMapData {
  regulations: RegulationEntry[];
  patternRows: PatternChipRow[];
  totalRegulations: number;
  totalPatternsWithRegulations: number;
  totalInstancesAffected: number;
  hasAnyChips: boolean;
}

function buildRegulatoryMapData(): RegulatoryMapData {
  const allPatterns = getAllLifecyclePatterns();
  const allInstances = [...SOURCE_EVENT_INSTANCES, ...APEX_RETAIL_PROGRAM_INSTANCES];

  // Map patternId → instance count.
  const instancesByPattern = new Map<string, number>();
  for (const inst of allInstances) {
    const count = instancesByPattern.get(inst.patternId) ?? 0;
    instancesByPattern.set(inst.patternId, count + 1);
  }

  // Collect regulation → patterns.
  const regMap = new Map<string, { patternIds: string[]; patternTitles: string[] }>();
  const patternsWithChips = new Set<string>();

  for (const pattern of allPatterns) {
    if (!pattern.regulatoryChips || pattern.regulatoryChips.length === 0) continue;
    for (const chip of pattern.regulatoryChips) {
      const trimmed = chip.trim();
      if (!trimmed) continue;
      const existing = regMap.get(trimmed) ?? { patternIds: [], patternTitles: [] };
      if (!existing.patternIds.includes(pattern.patternId)) {
        existing.patternIds.push(pattern.patternId);
        existing.patternTitles.push(pattern.title);
      }
      regMap.set(trimmed, existing);
      patternsWithChips.add(pattern.patternId);
    }
  }

  // Build regulation entries with instance counts.
  const regulations: RegulationEntry[] = [];
  for (const [regulation, { patternIds, patternTitles }] of regMap.entries()) {
    let instanceCount = 0;
    for (const pid of patternIds) {
      instanceCount += instancesByPattern.get(pid) ?? 0;
    }
    regulations.push({ regulation, patternIds, patternTitles, instanceCount });
  }

  // Sort: instance count desc, then alphabetically.
  regulations.sort((a, b) => {
    if (b.instanceCount !== a.instanceCount) return b.instanceCount - a.instanceCount;
    return a.regulation.localeCompare(b.regulation);
  });

  // Build pattern rows (only patterns with chips), sorted by instance count desc.
  const patternRows: PatternChipRow[] = [];
  for (const pattern of allPatterns) {
    if (!pattern.regulatoryChips || pattern.regulatoryChips.length === 0) continue;
    const chips = pattern.regulatoryChips.map((c) => c.trim()).filter(Boolean);
    if (chips.length === 0) continue;
    patternRows.push({
      patternId: pattern.patternId,
      patternTitle: pattern.title,
      chips,
      instanceCount: instancesByPattern.get(pattern.patternId) ?? 0,
    });
  }
  patternRows.sort((a, b) => {
    if (b.instanceCount !== a.instanceCount) return b.instanceCount - a.instanceCount;
    return a.patternTitle.localeCompare(b.patternTitle);
  });

  // Total affected instances = instances whose pattern has at least one chip.
  let totalInstancesAffected = 0;
  for (const inst of allInstances) {
    if (patternsWithChips.has(inst.patternId)) totalInstancesAffected++;
  }

  return {
    regulations,
    patternRows,
    totalRegulations: regulations.length,
    totalPatternsWithRegulations: patternsWithChips.size,
    totalInstancesAffected,
    hasAnyChips: regulations.length > 0,
  };
}

// ─── Pill palette cycling ──────────────────────────────────────────────────────

const PILL_PALETTES: Array<{ bg: string; line: string; text: string }> = [
  { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
];

// Stable index based on string hash so the same chip always gets the same color.
function paletteForChip(chip: string): (typeof PILL_PALETTES)[number] {
  let h = 0;
  for (let i = 0; i < chip.length; i++) {
    h = (h * 31 + chip.charCodeAt(i)) >>> 0;
  }
  return PILL_PALETTES[h % PILL_PALETTES.length];
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  totalRegulations,
  totalPatternsWithRegulations,
  totalInstancesAffected,
}: {
  totalRegulations: number;
  totalPatternsWithRegulations: number;
  totalInstancesAffected: number;
}) {
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
        gap: 6,
        fontFamily: SHELL.MONO,
        fontSize: 13,
        color: SHELL.INK_SOFT,
      }}
    >
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalRegulations}</span>
      <span>{totalRegulations === 1 ? 'regulation' : 'regulations'}</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 6px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalPatternsWithRegulations}</span>
      <span>
        {totalPatternsWithRegulations === 1 ? 'pattern references' : 'patterns reference'} regulations
      </span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 6px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalInstancesAffected}</span>
      <span>{totalInstancesAffected === 1 ? 'instance affected' : 'instances affected'}</span>
    </div>
  );
}

function RegChip({ label }: { label: string }) {
  const pal = paletteForChip(label);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function PatternNameChip({ id, title }: { id: string; title: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_SOFT,
        whiteSpace: 'nowrap',
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={`${id} — ${title}`}
    >
      <span style={{ color: SHELL.GRAY_TEXT }}>{id}</span>
      <span style={{ color: SHELL.INK_MUTED, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </span>
    </span>
  );
}

const HEADER_CELL: React.CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 13,
  fontWeight: 700,
  color: SHELL.INK,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  letterSpacing: '0.01em',
  background: SHELL.PAPER_SOFT,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: SHELL.MONO,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

function RegulationTable({ regulations }: { regulations: RegulationEntry[] }) {
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
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Regulation coverage
          </h2>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Sorted by instance count descending
          </div>
        </div>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {regulations.length} {regulations.length === 1 ? 'regulation' : 'regulations'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Regulation</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Patterns</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances affected</th>
              <th style={HEADER_CELL}>Pattern list</th>
            </tr>
          </thead>
          <tbody>
            {regulations.map((reg) => (
              <tr key={reg.regulation}>
                <td style={BODY_CELL}>
                  <RegChip label={reg.regulation} />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {reg.patternIds.length}
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {reg.instanceCount === 0 ? (
                    <span style={{ color: SHELL.INK_MUTED, fontWeight: 400 }}>0</span>
                  ) : (
                    reg.instanceCount
                  )}
                </td>
                <td style={{ ...BODY_CELL, maxWidth: 480 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {reg.patternIds.map((pid, i) => {
                      const chipTitle = reg.patternTitles[i] ?? '';
                      return (
                        <span
                          key={pid}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: SHELL.GRAY_BG,
                            border: `1px solid ${SHELL.GRAY_LINE}`,
                            borderRadius: RADIUS.pill,
                            padding: '3px 10px',
                            fontFamily: SHELL.MONO,
                            fontSize: 11,
                            color: SHELL.INK_SOFT,
                            whiteSpace: 'nowrap' as const,
                            maxWidth: 280,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={`${pid} — ${chipTitle}`}
                        >
                          <span style={{ color: SHELL.GRAY_TEXT }}>{pid}</span>
                          <span style={{ color: SHELL.INK_MUTED, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {chipTitle}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PatternRegulationMatrix({ patternRows }: { patternRows: PatternChipRow[] }) {
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
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Pattern annotation matrix
          </h2>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            Each pattern that carries regulatory annotations, with its full chip set
          </div>
        </div>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {patternRows.length} {patternRows.length === 1 ? 'pattern' : 'patterns'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {patternRows.map((row, idx) => (
          <div
            key={row.patternId}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom:
                idx < patternRows.length - 1
                  ? `1px solid ${SHELL.CARD_LINE_SOFT}`
                  : 'none',
              flexWrap: 'wrap',
            }}
          >
            {/* Pattern identity */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 220,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.02em',
                }}
              >
                {row.patternId}
              </span>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {row.patternTitle}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                }}
              >
                {row.instanceCount} {row.instanceCount === 1 ? 'instance' : 'instances'}
              </span>
            </div>
            {/* Chip set */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
                paddingTop: 2,
              }}
            >
              {row.chips.map((chip) => {
                const pal = paletteForChip(chip);
                return (
                  <span
                    key={chip}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: pal.bg,
                      border: `1px solid ${pal.line}`,
                      color: pal.text,
                      borderRadius: RADIUS.pill,
                      padding: '3px 10px',
                      fontFamily: SHELL.MONO,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {chip}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: `${COLORS.ink}cc`,
          marginBottom: SPACING.sm,
        }}
      >
        No regulatory annotations found
      </div>
      Add <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 13 }}>regulatoryChips</code> to
      pattern seeds to enable this view.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegulatoryMapPage() {
  const data = buildRegulatoryMapData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Regulatory reference"
          primaryActionHref="/admin/reasoning/regulatory"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Regulatory map"
        subtitle="Regulatory framework coverage across lifecycle patterns — which regulations affect which instances."
      >
        {!data.hasAnyChips ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip
              totalRegulations={data.totalRegulations}
              totalPatternsWithRegulations={data.totalPatternsWithRegulations}
              totalInstancesAffected={data.totalInstancesAffected}
            />
            <RegulationTable regulations={data.regulations} />
            <PatternRegulationMatrix patternRows={data.patternRows} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
