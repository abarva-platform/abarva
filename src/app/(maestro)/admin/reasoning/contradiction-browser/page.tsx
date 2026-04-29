// /admin/reasoning/contradiction-browser — Full dictionary of all contradiction
// templates across every lifecycle pattern, with live resolution status and
// severity grouping.
//
// Pure server component. No client JS. Reads the in-memory resolved set and
// cross-references every contradiction template from the unified pattern
// catalogue to produce a deduplicated, severity-grouped dictionary.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction browser · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface TemplateDictEntry {
  template: ContradictionTemplate;
  /** All pattern IDs that reference this template. */
  patternIds: string[];
  /** Display titles of the referencing patterns. */
  patternTitles: string[];
  /** True when any compound resolved ID ends with this templateId. */
  resolved: boolean;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildDictionary(resolvedTemplateIds: Set<string>): TemplateDictEntry[] {
  const allPatterns = getAllLifecyclePatterns();

  // Map templateId → entry (deduplicated); accumulate patternIds / titles.
  const map = new Map<string, TemplateDictEntry>();

  for (const pattern of allPatterns) {
    for (const tpl of pattern.contradictionTemplates) {
      const existing = map.get(tpl.id);
      if (existing) {
        if (!existing.patternIds.includes(pattern.patternId)) {
          existing.patternIds.push(pattern.patternId);
          existing.patternTitles.push(pattern.title);
        }
      } else {
        map.set(tpl.id, {
          template: tpl,
          patternIds: [pattern.patternId],
          patternTitles: [pattern.title],
          resolved: resolvedTemplateIds.has(tpl.id),
        });
      }
    }
  }

  return Array.from(map.values());
}

function getResolvedTemplateIds(): Set<string> {
  const resolvedIds = new Set(getResolved());
  const resolvedTemplateIds = new Set<string>();

  for (const compoundId of resolvedIds) {
    const parts = compoundId.split('::');
    if (parts.length >= 2) {
      resolvedTemplateIds.add(parts[parts.length - 1]);
    } else {
      resolvedTemplateIds.add(compoundId);
    }
  }

  return resolvedTemplateIds;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function severityDotColor(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.GRAY_TEXT;
}

function severityLabel(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'high') return 'High';
  if (severity === 'medium') return 'Medium';
  return 'Low';
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  high,
  medium,
  low,
  resolved,
}: {
  total: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
}) {
  const items = [
    { label: 'Templates', value: total },
    { label: 'High', value: high },
    { label: 'Medium', value: medium },
    { label: 'Low', value: low },
    { label: 'Resolved', value: resolved },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 18,
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SeverityChips({
  high,
  medium,
  low,
}: {
  high: number;
  medium: number;
  low: number;
}) {
  const chips = [
    {
      label: 'High',
      count: high,
      dotColor: SHELL.RUST_TEXT,
      bg: SHELL.RUST_BG,
      fg: SHELL.RUST_TEXT,
    },
    {
      label: 'Medium',
      count: medium,
      dotColor: SHELL.AMBER_DOT,
      bg: SHELL.PEACH_BG,
      fg: SHELL.PEACH_TEXT,
    },
    {
      label: 'Low',
      count: low,
      dotColor: SHELL.GRAY_TEXT,
      bg: SHELL.GRAY_BG,
      fg: SHELL.GRAY_TEXT,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
      }}
    >
      {chips.map(({ label, count, dotColor, bg, fg }) => (
        <div
          key={label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: bg,
            color: fg,
            borderRadius: RADIUS.pill,
            padding: '6px 14px',
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          {count} {label}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ resolved }: { resolved: boolean }) {
  if (resolved) {
    return (
      <span
        style={{
          display: 'inline-block',
          background: SHELL.MINT_BG,
          color: SHELL.MINT_TEXT,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: SHELL.SANS,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        Resolved
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      Active
    </span>
  );
}

function TemplateCard({ entry }: { entry: TemplateDictEntry }) {
  const { template, patternIds, patternTitles, resolved } = entry;
  const dotColor = severityDotColor(template.severity);

  return (
    <div
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        borderBottom: `1px solid ${COLORS.ink}08`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: resolved ? 0.6 : 1,
      }}
    >
      {/* Top row: dot + id + label + status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          {template.id}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: COLORS.ink,
            fontWeight: 700,
            flex: 1,
            minWidth: 0,
          }}
        >
          {template.label}
        </span>
        <StatusBadge resolved={resolved} />
      </div>

      {/* Pattern references */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          Patterns:
        </span>
        {patternIds.map((pid, i) => (
          <span
            key={pid}
            title={patternTitles[i]}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.03em',
            }}
          >
            {pid}
          </span>
        ))}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {template.detectionHint}
      </p>
    </div>
  );
}

function SeverityGroup({
  severity,
  entries,
}: {
  severity: 'high' | 'medium' | 'low';
  entries: TemplateDictEntry[];
}) {
  if (entries.length === 0) return null;

  const dotColor = severityDotColor(severity);
  const label = severityLabel(severity);

  // Sort: active (unresolved) first, then resolved
  const sorted = [...entries].sort((a, b) => {
    if (a.resolved === b.resolved) return 0;
    return a.resolved ? 1 : -1;
  });

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {label} severity — {entries.length} template{entries.length === 1 ? '' : 's'}
          </h2>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {entries.filter((e) => !e.resolved).length} active ·{' '}
          {entries.filter((e) => e.resolved).length} resolved
        </span>
      </header>
      <div>
        {sorted.map((entry) => (
          <div key={entry.template.id}>
            <TemplateCard entry={entry} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionBrowserPage() {
  const resolvedTemplateIds = getResolvedTemplateIds();
  const allEntries = buildDictionary(resolvedTemplateIds);

  const highEntries = allEntries.filter((e) => e.template.severity === 'high');
  const mediumEntries = allEntries.filter((e) => e.template.severity === 'medium');
  const lowEntries = allEntries.filter((e) => e.template.severity === 'low');
  const resolvedCount = allEntries.filter((e) => e.resolved).length;

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
        title="Contradiction browser"
        subtitle="Full dictionary of contradiction templates across all lifecycle patterns with live resolution status."
      >
        <SummaryStrip
          total={allEntries.length}
          high={highEntries.length}
          medium={mediumEntries.length}
          low={lowEntries.length}
          resolved={resolvedCount}
        />

        <SeverityChips
          high={highEntries.length}
          medium={mediumEntries.length}
          low={lowEntries.length}
        />

        <SeverityGroup severity="high" entries={highEntries} />
        <SeverityGroup severity="medium" entries={mediumEntries} />
        <SeverityGroup severity="low" entries={lowEntries} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
