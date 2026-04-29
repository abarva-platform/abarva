// /admin/reasoning/regulatory — Regulatory compliance tag reference.
//
// Server component. Loads all lifecycle patterns, collects unique
// `regulatoryChips` values, maps each chip to the patterns that reference it,
// and counts active instances that use those patterns. Sorted by instance count
// descending, then alphabetically.

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
  title: 'Regulatory reference · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface RegulatoryChipEntry {
  chip: string;
  patternIds: string[];
  patternTitles: string[];
  instanceCount: number;
}

function buildRegulatoryData(): {
  entries: RegulatoryChipEntry[];
  noTagCount: number;
  totalUniqueTags: number;
  totalPatternsWithTags: number;
  totalActiveInstances: number;
} {
  const allPatterns = getAllLifecyclePatterns();
  const allInstances = [...SOURCE_EVENT_INSTANCES, ...APEX_RETAIL_PROGRAM_INSTANCES];

  // Map patternId → instance count.
  const instancesByPattern = new Map<string, number>();
  for (const inst of allInstances) {
    const count = instancesByPattern.get(inst.patternId) ?? 0;
    instancesByPattern.set(inst.patternId, count + 1);
  }

  // Collect chips → patterns.
  const chipMap = new Map<string, { patternIds: string[]; patternTitles: string[] }>();

  let noTagCount = 0;
  const patternsWithTags = new Set<string>();

  for (const pattern of allPatterns) {
    if (!pattern.regulatoryChips || pattern.regulatoryChips.length === 0) {
      noTagCount++;
      continue;
    }
    for (const chip of pattern.regulatoryChips) {
      const trimmed = chip.trim();
      if (!trimmed) continue;
      const existing = chipMap.get(trimmed) ?? { patternIds: [], patternTitles: [] };
      existing.patternIds.push(pattern.patternId);
      existing.patternTitles.push(pattern.title);
      chipMap.set(trimmed, existing);
      patternsWithTags.add(pattern.patternId);
    }
  }

  // Build entries with instance counts.
  const entries: RegulatoryChipEntry[] = [];
  for (const [chip, { patternIds, patternTitles }] of chipMap.entries()) {
    let instanceCount = 0;
    for (const pid of patternIds) {
      instanceCount += instancesByPattern.get(pid) ?? 0;
    }
    entries.push({ chip, patternIds, patternTitles, instanceCount });
  }

  // Sort: instance count desc, then alphabetically.
  entries.sort((a, b) => {
    if (b.instanceCount !== a.instanceCount) return b.instanceCount - a.instanceCount;
    return a.chip.localeCompare(b.chip);
  });

  // Total active instances covered by at least one tagged pattern.
  const coveredPatternIds = new Set<string>();
  for (const e of entries) {
    for (const pid of e.patternIds) coveredPatternIds.add(pid);
  }
  let totalActiveInstances = 0;
  for (const inst of allInstances) {
    if (coveredPatternIds.has(inst.patternId)) totalActiveInstances++;
  }

  return {
    entries,
    noTagCount,
    totalUniqueTags: entries.length,
    totalPatternsWithTags: patternsWithTags.size,
    totalActiveInstances,
  };
}

// ─── Pill color assignment ────────────────────────────────────────────────────

// Cycle through three SHELL background colors based on chip index.
const PILL_PALETTES: Array<{ bg: string; line: string; text: string }> = [
  { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
];

function chipPalette(index: number) {
  return PILL_PALETTES[index % PILL_PALETTES.length];
}

// ─── Components ──────────────────────────────────────────────────────────────

function SummaryStrip({
  totalUniqueTags,
  totalPatternsWithTags,
  totalActiveInstances,
}: {
  totalUniqueTags: number;
  totalPatternsWithTags: number;
  totalActiveInstances: number;
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
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalUniqueTags}</span>
      <span>unique tags</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span>across</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalPatternsWithTags}</span>
      <span>patterns</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalActiveInstances}</span>
      <span>active instances</span>
    </div>
  );
}

function ChipBadge({
  label,
  paletteIndex,
}: {
  label: string;
  paletteIndex: number;
}) {
  const pal = chipPalette(paletteIndex);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '4px 12px',
        fontFamily: SHELL.MONO,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function CountBadge({ value, label }: { value: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_SOFT,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 700, color: SHELL.INK }}>{value}</span>
      {' '}
      {label}
    </span>
  );
}

function ChipRow({
  entry,
  index,
}: {
  entry: RegulatoryChipEntry;
  index: number;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <ChipBadge label={entry.chip} paletteIndex={index} />
        <CountBadge value={entry.patternIds.length} label={entry.patternIds.length === 1 ? 'pattern' : 'patterns'} />
        <CountBadge value={entry.instanceCount} label={entry.instanceCount === 1 ? 'active instance' : 'active instances'} />
      </div>
      {/* Pattern list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          paddingLeft: 4,
        }}
      >
        {entry.patternTitles.map((title, i) => (
          <div
            key={entry.patternIds[i]}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.GRAY_TEXT,
                marginRight: 6,
              }}
            >
              {entry.patternIds[i]}
            </span>
            {title}
          </div>
        ))}
      </div>
    </div>
  );
}

function NoTagsNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 13,
        color: SHELL.INK_MUTED,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
      }}
    >
      {count} pattern{count === 1 ? '' : 's'} have no regulatory tags.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegulatoryReferencePage() {
  const { entries, noTagCount, totalUniqueTags, totalPatternsWithTags, totalActiveInstances } =
    buildRegulatoryData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Regulatory reference"
        subtitle="Regulatory and compliance tags across all lifecycle patterns with active instance coverage."
      >
        <SummaryStrip
          totalUniqueTags={totalUniqueTags}
          totalPatternsWithTags={totalPatternsWithTags}
          totalActiveInstances={totalActiveInstances}
        />

        {entries.length === 0 ? (
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
            }}
          >
            No regulatory chips defined on any lifecycle pattern.
          </div>
        ) : (
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
                  Tags by coverage
                </h2>
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.INK_MUTED,
                    marginTop: 2,
                  }}
                >
                  Sorted by active instance count descending, then alphabetically
                </div>
              </div>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                }}
              >
                {entries.length} tag{entries.length === 1 ? '' : 's'}
              </span>
            </header>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.sm,
                padding: SPACING.md,
              }}
            >
              {entries.map((entry, i) => (
                <ChipRow key={entry.chip} entry={entry} index={i} />
              ))}
            </div>
          </section>
        )}

        <NoTagsNote count={noTagCount} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
