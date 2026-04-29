// /admin/reasoning/evidence-catalog — Evidence type data-dictionary.
//
// Server component. Loads all lifecycle patterns (source + program), collects
// every unique gate-criterion id (the canonical evidence key used by the gate
// evaluator's direct-key-match path), and renders a data-dictionary table
// showing which patterns, stages, and gate types each evidence key satisfies.
//
// Evidence keys are the criterion IDs (e.g. GATE-AMS-RFI-01) that the gate
// evaluator matches against the instance evidence map via evidenceMap[id].
// They are grouped by the keyword category that best describes their
// subject matter, derived from the criterion description.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion, LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence catalog · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface GateRef {
  criterionId: string;
  patternId: string;
  patternTitle: string;
  stageId: string;
  weight: 'hard' | 'soft';
}

interface EvidenceEntry {
  /** The evidence key string — the criterion ID used for direct-key match. */
  key: string;
  /** Human-readable description of what this criterion checks. */
  description: string;
  /** Which gates reference this evidence key. */
  usedByGates: GateRef[];
  /** How many distinct patterns reference this key. */
  patternCount: number;
  /** True if used in any hard-gate criterion. */
  isHardGate: boolean;
  /** The keyword category group this key belongs to. */
  group: string;
}

// ─── Keyword → group catalogue ────────────────────────────────────────────────
//
// Each entry maps keywords (lower-case substring match against the criterion
// description) to a human-readable group label. Checked in order; first match
// wins. Mirrors the KEYWORD_CATALOGUE in evidence-suggestions.ts but collapses
// to a single label rather than suggestion strings.

const GROUP_CATALOGUE: ReadonlyArray<{ keywords: string[]; group: string }> = [
  { keywords: ['pricing', 'price', 'cost', 'costs', 'fee', 'fees', 'tariff', 'tco', 'commercial'], group: 'Commercial & Pricing' },
  { keywords: ['sla', 'service level', 'uptime', 'availability'], group: 'Service Levels' },
  { keywords: ['contract', 'agreement', 'msa', 'nda', 'legal', 'countersign', 'sign-off', 'signed'], group: 'Legal & Contracts' },
  { keywords: ['vendor', 'supplier', 'provider', 'shortlist', 'finalist', 'bafo'], group: 'Vendor Management' },
  { keywords: ['security', 'soc', 'compliance', 'audit', 'iso', 'pen test', 'pentest', 'cyber'], group: 'Security & Compliance' },
  { keywords: ['privacy', 'gdpr', 'data protection', 'dpa'], group: 'Data Privacy' },
  { keywords: ['architecture', 'technical', 'design', 'integration', 'api', 'infrastructure'], group: 'Technical Architecture' },
  { keywords: ['risk', 'mitigation', 'contingency', 'flag'], group: 'Risk & Governance' },
  { keywords: ['approval', 'sign-off', 'sign off', 'steward', 'authorisation', 'authorization', 'governance', 'committee', 'sponsor', 'waiver'], group: 'Approvals & Governance' },
  { keywords: ['budget', 'forecast', 'financial', 'capex', 'opex', 'roi', 'business case'], group: 'Financial' },
  { keywords: ['timeline', 'milestone', 'schedule', 'plan', 'roadmap', 'duration'], group: 'Planning & Timelines' },
  { keywords: ['rfp', 'proposal', 'response', 'rfi', 'requirement', 'document', 'finalize', 'finalised', 'baselined'], group: 'RFP / RFI Documentation' },
  { keywords: ['reference', 'case study', 'testimonial', 'call'], group: 'References & Evidence' },
  { keywords: ['performance', 'kpi', 'metric', 'benchmark', 'score', 'evaluation', 'scorecard'], group: 'Performance & Evaluation' },
  { keywords: ['scope', 'statement of work', 'sow', 'charter'], group: 'Scope & Delivery' },
  { keywords: ['stakeholder', 'executive', 'team', 'assembled', 'role'], group: 'Stakeholders & Teams' },
  { keywords: ['transition', 'migration', 'decommission', 'cutover', 'onboard'], group: 'Transition & Onboarding' },
  { keywords: ['phase', 'gate', 'stage', 'criterion', 'criteria'], group: 'Lifecycle Gates' },
];

const FALLBACK_GROUP = 'General';

function groupForDescription(description: string): string {
  const lower = description.toLowerCase();
  for (const entry of GROUP_CATALOGUE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.group;
    }
  }
  return FALLBACK_GROUP;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildEvidenceCatalog(): {
  entries: EvidenceEntry[];
  totalKeys: number;
  hardGateCount: number;
  patternCount: number;
  groups: string[];
} {
  const patterns = getAllLifecyclePatterns();
  const patternSet = new Set<string>();

  // Collect all gate criteria across all patterns.
  // Each criterion.id is the canonical evidence key.
  const entriesMap = new Map<string, EvidenceEntry>();

  for (const pattern of patterns) {
    patternSet.add(pattern.patternId);
    const criteria: GateCriterion[] = pattern.gateCriteria ?? [];

    for (const criterion of criteria) {
      const key = criterion.id;

      if (!entriesMap.has(key)) {
        entriesMap.set(key, {
          key,
          description: criterion.description,
          usedByGates: [],
          patternCount: 0,
          isHardGate: false,
          group: groupForDescription(criterion.description),
        });
      }

      const entry = entriesMap.get(key)!;
      const gateRef: GateRef = {
        criterionId: criterion.id,
        patternId: pattern.patternId,
        patternTitle: pattern.title,
        stageId: criterion.stageId,
        weight: criterion.gateType,
      };
      entry.usedByGates.push(gateRef);
      if (criterion.gateType === 'hard') {
        entry.isHardGate = true;
      }
    }
  }

  // Compute patternCount per entry (distinct patterns referencing this key).
  for (const entry of entriesMap.values()) {
    const patternIds = new Set(entry.usedByGates.map((g) => g.patternId));
    entry.patternCount = patternIds.size;
  }

  // Sort: hard-gate first, then by usedByGates count descending, then alphabetical.
  const entries = Array.from(entriesMap.values()).sort((a, b) => {
    if (a.isHardGate !== b.isHardGate) return a.isHardGate ? -1 : 1;
    if (b.usedByGates.length !== a.usedByGates.length) {
      return b.usedByGates.length - a.usedByGates.length;
    }
    return a.key.localeCompare(b.key);
  });

  const hardGateCount = entries.filter((e) => e.isHardGate).length;

  // Collect unique groups in display order.
  const groupSet = new Set<string>();
  for (const entry of entries) {
    groupSet.add(entry.group);
  }

  return {
    entries,
    totalKeys: entries.length,
    hardGateCount,
    patternCount: patternSet.size,
    groups: Array.from(groupSet),
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

import { SHELL } from '@/lib/shell/shell-tokens';

const TH: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.PAPER_SOFT,
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: SHELL.INK,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'top',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: SHELL.INK_MID,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  totalKeys,
  hardGateCount,
  patternCount,
}: {
  totalKeys: number;
  hardGateCount: number;
  patternCount: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        flexWrap: 'wrap',
      }}
    >
      <StatChip label="Unique evidence types" value={String(totalKeys)} />
      <Divider />
      <StatChip label="Used in hard gates" value={String(hardGateCount)} accent />
      <Divider />
      <StatChip label="Patterns covered" value={String(patternCount)} />
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        (use Ctrl+F to search)
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 32,
        background: SHELL.CARD_LINE,
        flexShrink: 0,
      }}
    />
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: accent ? SHELL.RUST_TEXT : SHELL.INK,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function HardBadge({ isHard }: { isHard: boolean }) {
  if (isHard) {
    return (
      <span
        style={{
          display: 'inline-block',
          background: SHELL.RUST_BG,
          color: SHELL.RUST_TEXT,
          borderRadius: RADIUS.pill,
          padding: '2px 8px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        HARD
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        color: SHELL.INK_MUTED,
      }}
    >
      −
    </span>
  );
}

function GroupHeader({ group }: { group: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_SOFT,
          background: SHELL.PAPER_DEEP,
          padding: `${SPACING.xs} ${SPACING.md}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
        }}
      >
        {group}
      </td>
    </tr>
  );
}

const MAX_USED_IN_DISPLAY = 4;

function UsedInCell({ gates }: { gates: GateRef[] }) {
  const shown = gates.slice(0, MAX_USED_IN_DISPLAY);
  const extra = gates.length - shown.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {shown.map((g) => (
        <span
          key={`${g.patternId}-${g.stageId}-${g.criterionId}`}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            background: SHELL.BLUE_BG,
            borderRadius: RADIUS.sm,
            padding: '1px 6px',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          {g.patternId} · {g.stageId}
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          +{extra} more
        </span>
      )}
    </div>
  );
}

function EvidenceTable({ entries, groups }: { entries: EvidenceEntry[]; groups: string[] }) {
  // Group entries by group label, preserving sort order within each group.
  const byGroup = new Map<string, EvidenceEntry[]>();
  for (const g of groups) {
    byGroup.set(g, []);
  }
  for (const entry of entries) {
    const list = byGroup.get(entry.group);
    if (list) list.push(entry);
    else {
      const fallback = byGroup.get(FALLBACK_GROUP) ?? [];
      fallback.push(entry);
      byGroup.set(FALLBACK_GROUP, fallback);
    }
  }

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
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Evidence types
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              marginTop: 2,
            }}
          >
            Every evidence key derived from gate criteria across all lifecycle patterns, grouped by subject area
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {entries.length} entries · {groups.length} groups
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: '28%' }}>Evidence Key</th>
              <th style={{ ...TH, width: '32%' }}>Description</th>
              <th style={{ ...TH, width: 72 }}>Patterns</th>
              <th style={{ ...TH, width: 64 }}>Gates</th>
              <th style={{ ...TH, width: 64 }}>Hard?</th>
              <th style={{ ...TH }}>Used In</th>
            </tr>
          </thead>
          {groups.map((group) => {
            const groupEntries = byGroup.get(group) ?? [];
            if (groupEntries.length === 0) return null;
            return (
              <tbody key={group}>
                <GroupHeader group={group} />
                {groupEntries.map((entry) => (
                  <tr key={entry.key}>
                    <td style={TD_MONO}>{entry.key}</td>
                    <td style={{ ...TD, fontSize: 12, lineHeight: 1.4 }}>{entry.description}</td>
                    <td
                      style={{
                        ...TD,
                        textAlign: 'center',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: entry.patternCount > 1 ? SHELL.MINT_TEXT : SHELL.INK_SOFT,
                      }}
                    >
                      {entry.patternCount}
                    </td>
                    <td
                      style={{
                        ...TD,
                        textAlign: 'center',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        color: SHELL.INK_SOFT,
                      }}
                    >
                      {entry.usedByGates.length}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <HardBadge isHard={entry.isHardGate} />
                    </td>
                    <td style={TD}>
                      <UsedInCell gates={entry.usedByGates} />
                    </td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceCatalogPage() {
  const { entries, totalKeys, hardGateCount, patternCount, groups } =
    buildEvidenceCatalog();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Data Dictionary"
        title="Evidence catalog"
        subtitle="All evidence types referenced across gate criteria, grouped by subject area. Each row is one criterion ID — the canonical key the gate evaluator matches against the instance evidence map."
      >
        <SummaryStrip
          totalKeys={totalKeys}
          hardGateCount={hardGateCount}
          patternCount={patternCount}
        />
        <EvidenceTable entries={entries} groups={groups} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
