// /admin/reasoning/pattern-domains — Lifecycle pattern catalog grouped by
// domain and tier with active instance counts.
//
// Pure server component. Loads all patterns, groups by domain, shows tier
// breakdown, and counts active instances per pattern ID across the source-
// event and program fixture corpora. No client JS required.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { PatternDomain, PatternTier, PatternStatus } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern domains · AbarVa Admin',
};

// ─── Domain display helpers ───────────────────────────────────────────────────

const DOMAIN_LABELS: Record<PatternDomain, string> = {
  meta: 'Meta',
  sourcing: 'Sourcing',
  cdp: 'CDP',
  ai_programs: 'AI Programs',
  architecture: 'Architecture',
  industry_specific: 'Industry Specific',
  compliance: 'Compliance',
  future_of_work: 'Future of Work',
};

const TIER_LABELS: Record<PatternTier, string> = {
  M: 'M',
  authoritative: 'Authoritative',
  validated: 'Validated',
};

// Colour associations for domains (using SHELL palette)
const DOMAIN_COLORS: Record<PatternDomain, { bg: string; line: string; text: string }> = {
  sourcing:        { bg: SHELL.BLUE_BG,  line: SHELL.BLUE_LINE,  text: SHELL.INK_MID },
  cdp:             { bg: SHELL.MINT_BG,  line: SHELL.MINT_LINE,  text: SHELL.MINT_TEXT },
  ai_programs:     { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  architecture:    { bg: SHELL.GRAY_BG,  line: SHELL.GRAY_LINE,  text: SHELL.GRAY_TEXT },
  industry_specific: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
  compliance:      { bg: SHELL.BLUE_BG,  line: SHELL.BLUE_LINE,  text: SHELL.INK_MID },
  future_of_work:  { bg: SHELL.GRAY_BG,  line: SHELL.GRAY_LINE,  text: SHELL.GRAY_TEXT },
  meta:            { bg: SHELL.PAPER_DEEP, line: SHELL.CARD_LINE, text: SHELL.INK_SOFT },
};

const TIER_COLORS: Record<PatternTier, { bg: string; text: string }> = {
  authoritative: { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT },
  validated:     { bg: SHELL.BLUE_BG,  text: SHELL.INK_MID },
  M:             { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT },
};

// Status → display colour
function statusPalette(status: PatternStatus): { bg: string; text: string } {
  if (status.startsWith('AUTHORED')) return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (status === 'IN-AUTHORING')     return { bg: SHELL.BLUE_BG, text: SHELL.INK_MID };
  if (status === 'COMMISSIONED')     return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT };
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

// ─── Data model ───────────────────────────────────────────────────────────────

interface PatternEntry {
  patternId: string;
  title: string;
  domain: PatternDomain;
  tier: PatternTier;
  status: PatternStatus;
  instanceCount: number;
}

interface TierGroup {
  tier: PatternTier;
  patterns: PatternEntry[];
}

interface DomainGroup {
  domain: PatternDomain;
  label: string;
  tiers: TierGroup[];
  total: number;
  activeInstances: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternDomainsPage() {
  const allPatterns = getAllLifecyclePatterns();

  // Build instance count lookup: patternId → count
  const instanceCounts = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instanceCounts.set(inst.patternId, (instanceCounts.get(inst.patternId) ?? 0) + 1);
  }

  // Flatten into rows
  const rows: PatternEntry[] = allPatterns.map((p) => ({
    patternId: p.patternId,
    title: p.title,
    domain: p.domain as PatternDomain,
    tier: p.tier as PatternTier,
    status: p.status as PatternStatus,
    instanceCount: instanceCounts.get(p.patternId) ?? 0,
  }));

  // Group by domain → tier
  const domainMap = new Map<PatternDomain, PatternEntry[]>();
  for (const row of rows) {
    const bucket = domainMap.get(row.domain) ?? [];
    bucket.push(row);
    domainMap.set(row.domain, bucket);
  }

  const domainGroups: DomainGroup[] = Array.from(domainMap.entries())
    .map(([domain, patterns]) => {
      const tierMap = new Map<PatternTier, PatternEntry[]>();
      for (const p of patterns) {
        const tb = tierMap.get(p.tier) ?? [];
        tb.push(p);
        tierMap.set(p.tier, tb);
      }
      const tiers: TierGroup[] = Array.from(tierMap.entries())
        .map(([tier, ps]) => ({ tier, patterns: ps }))
        .sort((a, b) => {
          // Sort tiers: authoritative first, validated second, M last
          const order: Record<PatternTier, number> = { authoritative: 0, validated: 1, M: 2 };
          return (order[a.tier] ?? 9) - (order[b.tier] ?? 9);
        });
      const activeInstances = patterns.reduce((sum, p) => sum + p.instanceCount, 0);
      return {
        domain,
        label: DOMAIN_LABELS[domain] ?? domain,
        tiers,
        total: patterns.length,
        activeInstances,
      };
    })
    // Sort by pattern count descending
    .sort((a, b) => b.total - a.total);

  // Summary stats
  const totalPatterns = rows.length;
  const totalDomains = domainGroups.length;
  const uniqueTiers = new Set(rows.map((r) => r.tier)).size;
  const totalActiveInstances = rows.reduce((s, r) => s + r.instanceCount, 0);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Browse patterns"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Pattern domains"
        subtitle="Lifecycle patterns organized by domain and tier with active instance counts."
      >
        {/* Summary strip */}
        <SummaryStrip
          patterns={totalPatterns}
          domains={totalDomains}
          tiers={uniqueTiers}
          activeInstances={totalActiveInstances}
        />

        {/* Domain distribution bar */}
        <DomainDistributionBar groups={domainGroups} total={totalPatterns} />

        {/* Domain sections */}
        {domainGroups.map((group) => (
          <DomainSection key={group.domain} group={group} />
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  patterns,
  domains,
  tiers,
  activeInstances,
}: {
  patterns: number;
  domains: number;
  tiers: number;
  activeInstances: number;
}) {
  const items = [
    { value: patterns, label: 'pattern', plural: 'patterns' },
    { value: domains,  label: 'domain',  plural: 'domains' },
    { value: tiers,    label: 'tier',    plural: 'tiers' },
    { value: activeInstances, label: 'active instance', plural: 'active instances' },
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
        alignItems: 'center',
        gap: `${SPACING.sm} ${SPACING.xl}`,
      }}
    >
      {items.map(({ value, label, plural }, i) => (
        <span
          key={label}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <strong
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 400,
              color: SHELL.INK,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </strong>
          <span style={{ color: SHELL.INK_SOFT }}>
            {value === 1 ? label : plural}
          </span>
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              style={{ color: SHELL.CARD_LINE, marginLeft: SPACING.sm }}
            >
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Domain distribution bar ──────────────────────────────────────────────────

function DomainDistributionBar({
  groups,
  total,
}: {
  groups: DomainGroup[];
  total: number;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 600,
          marginBottom: SPACING.sm,
        }}
      >
        Domain distribution
      </div>

      {/* Segmented bar */}
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
          gap: 2,
          marginBottom: SPACING.md,
        }}
      >
        {groups.map((g) => {
          const pct = total > 0 ? (g.total / total) * 100 : 0;
          const col = DOMAIN_COLORS[g.domain] ?? DOMAIN_COLORS.meta;
          return (
            <div
              key={g.domain}
              title={`${g.label}: ${g.total} pattern${g.total === 1 ? '' : 's'}`}
              style={{
                flex: `0 0 ${pct}%`,
                background: col.line,
                borderRadius: 2,
                minWidth: 4,
              }}
            />
          );
        })}
      </div>

      {/* Pill legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${SPACING.xs} ${SPACING.sm}` }}>
        {groups.map((g) => {
          const col = DOMAIN_COLORS[g.domain] ?? DOMAIN_COLORS.meta;
          const pct = total > 0 ? Math.round((g.total / total) * 100) : 0;
          return (
            <span
              key={g.domain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: col.bg,
                border: `1px solid ${col.line}`,
                borderRadius: RADIUS.pill,
                padding: '3px 10px',
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: col.text,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: col.line,
                  flexShrink: 0,
                }}
              />
              {g.label}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  opacity: 0.7,
                }}
              >
                {g.total} · {pct}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Domain section ───────────────────────────────────────────────────────────

interface DomainSectionProps { group: DomainGroup }
function DomainSection({ group }: DomainSectionProps) {
  const col = DOMAIN_COLORS[group.domain] ?? DOMAIN_COLORS.meta;

  return (
    <section
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Domain header */}
      <header
        style={{
          background: col.bg,
          borderBottom: `1px solid ${col.line}`,
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 400,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {group.label}
          </h2>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: col.text,
              background: `${col.line}80`,
              borderRadius: RADIUS.pill,
              padding: '2px 8px',
              letterSpacing: '0.04em',
            }}
          >
            {group.domain}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          {group.activeInstances > 0 && (
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
              }}
            >
              {group.activeInstances} active instance{group.activeInstances === 1 ? '' : 's'}
            </span>
          )}
          <CountBadge value={group.total} label="pattern" />
        </div>
      </header>

      {/* Tier groups */}
      <div style={{ background: SHELL.CARD_WHITE }}>
        {group.tiers.map((tg, tIdx) => (
          <div
            key={tg.tier}
            style={{
              borderTop: tIdx > 0 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : undefined,
            }}
          >
            {/* Tier sub-header */}
            <div
              style={{
                background: SHELL.PAPER,
                padding: `${SPACING.sm} ${SPACING.lg}`,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              <TierChip tier={tg.tier} />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                }}
              >
                {tg.patterns.length} pattern{tg.patterns.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Pattern rows */}
            {tg.patterns.map((p, pIdx) => (
              <PatternEntryRow
                key={p.patternId}
                pattern={p}
                isLast={pIdx === tg.patterns.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

interface PatternEntryRowProps { pattern: PatternEntry; isLast: boolean }
function PatternEntryRow({ pattern, isLast }: PatternEntryRowProps) {
  const pal = statusPalette(pattern.status);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        borderBottom: isLast ? 'none' : `1px solid ${SHELL.PAPER_DEEP}`,
        flexWrap: 'wrap',
      }}
    >
      {/* Left: title + ID */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm, minWidth: 0 }}>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 500,
            color: SHELL.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pattern.title}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
          }}
        >
          {pattern.patternId}
        </span>
      </div>

      {/* Right: chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexShrink: 0,
        }}
      >
        <TierChip tier={pattern.tier} />

        {/* Status badge */}
        <span
          style={{
            display: 'inline-block',
            background: pal.bg,
            color: pal.text,
            borderRadius: RADIUS.pill,
            padding: '2px 9px',
            fontFamily: SHELL.SANS,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {humanStatus(pattern.status)}
        </span>

        {/* Instance count */}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: pattern.instanceCount > 0 ? SHELL.INK_MID : SHELL.INK_MUTED,
            background: pattern.instanceCount > 0 ? SHELL.MINT_BG : SHELL.PAPER_DEEP,
            border: `1px solid ${pattern.instanceCount > 0 ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
            borderRadius: RADIUS.pill,
            padding: '2px 9px',
            minWidth: 40,
            textAlign: 'center' as const,
          }}
        >
          {pattern.instanceCount > 0 ? `${pattern.instanceCount}×` : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Tier chip ────────────────────────────────────────────────────────────────

function TierChip({ tier }: { tier: PatternTier }) {
  const pal = TIER_COLORS[tier] ?? TIER_COLORS.validated;
  return (
    <span
      style={{
        display: 'inline-block',
        background: pal.bg,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase' as const,
      }}
    >
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

// ─── Count badge ──────────────────────────────────────────────────────────────

function CountBadge({ value, label }: { value: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: SHELL.PAPER_DEEP,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_SOFT,
        fontWeight: 600,
      }}
    >
      {value} {value === 1 ? label : `${label}s`}
    </span>
  );
}
