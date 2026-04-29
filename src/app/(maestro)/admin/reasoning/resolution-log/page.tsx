// /admin/reasoning/resolution-log — All contradiction templates currently
// marked as resolved in the in-memory store, with full template details.
//
// Server component. Reads the in-memory RESOLVED set via getResolved(), then
// cross-references every contradiction template across all lifecycle patterns
// to show both the resolved list and the still-active (not-yet-resolved) list.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resolution Log · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateEntry {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  patternId: string;
  patternTitle: string;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildAllTemplates(): TemplateEntry[] {
  const allPatterns = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
  const entries: TemplateEntry[] = [];
  const seen = new Set<string>();

  for (const pattern of allPatterns) {
    for (const tpl of pattern.contradictionTemplates) {
      if (seen.has(tpl.id)) continue;
      seen.add(tpl.id);
      entries.push({
        id: tpl.id,
        label: tpl.label,
        severity: tpl.severity,
        patternId: pattern.patternId,
        patternTitle: pattern.title,
      });
    }
  }

  return entries;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function severityDotColor(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.GRAY_TEXT;
}

function severityPillColors(severity: 'low' | 'medium' | 'high'): { bg: string; fg: string } {
  if (severity === 'high') return { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT };
  if (severity === 'medium') return { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT };
  return { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT };
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  resolvedCount,
  totalCount,
  patternCount,
}: {
  resolvedCount: number;
  totalCount: number;
  patternCount: number;
}) {
  const items = [
    { label: 'Resolved', value: resolvedCount },
    { label: 'Total templates', value: totalCount },
    { label: 'Patterns', value: patternCount },
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
              fontFamily: TYPOGRAPHY.sans,
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
              fontFamily: TYPOGRAPHY.mono,
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

function AllClearBanner() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.MINT_TEXT,
        fontWeight: 500,
      }}
    >
      No contradictions are currently resolved.
    </div>
  );
}

function SeverityPill({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const { bg, fg } = severityPillColors(severity);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      {severity}
    </span>
  );
}

function TemplateRow({
  entry,
  dimmed,
}: {
  entry: TemplateEntry;
  dimmed?: boolean;
}) {
  const dotColor = severityDotColor(entry.severity);
  const opacity = dimmed ? 0.45 : 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `10px ${SPACING.md}`,
        borderBottom: `1px solid ${COLORS.ink}08`,
        opacity,
      }}
    >
      {/* Severity dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />

      {/* Template ID */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}99`,
          letterSpacing: '0.04em',
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {entry.id}
      </span>

      {/* Label */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          fontWeight: 600,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.label}
      </span>

      {/* Pattern name */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}66`,
          letterSpacing: '0.03em',
          flexShrink: 0,
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={entry.patternTitle}
      >
        {entry.patternId}
      </span>

      {/* Severity pill */}
      <SeverityPill severity={entry.severity} />
    </div>
  );
}

function ResolvedSection({ entries }: { entries: TemplateEntry[] }) {
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
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Resolved
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Templates whose compound ID ({'{instanceId}::{templateId}'}) is in the in-memory
            resolved set
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {entries.length} template{entries.length === 1 ? '' : 's'}
        </span>
      </header>
      <div>
        {entries.map((entry) => (
          <div key={entry.id}>
            <TemplateRow entry={entry} />
          </div>
        ))}
      </div>
    </section>
  );
}

function StillActiveSection({ entries }: { entries: TemplateEntry[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}0e`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}08`,
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
              fontSize: 18,
              color: `${COLORS.ink}88`,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Still active
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}66`,
              marginTop: 2,
            }}
          >
            Templates not yet in the resolved set (dimmed)
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}66`,
          }}
        >
          {entries.length} template{entries.length === 1 ? '' : 's'}
        </span>
      </header>
      <div>
        {entries.map((entry) => (
          <div key={entry.id}>
            <TemplateRow entry={entry} dimmed />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResolutionLogPage() {
  const allTemplates = buildAllTemplates();
  const resolvedIds = new Set(getResolved());

  // The resolved IDs in the store use compound form {instanceId}::{templateId}.
  // We want to find which templateIds appear in at least one resolved compound.
  const resolvedTemplateIds = new Set<string>();
  for (const compoundId of resolvedIds) {
    const parts = compoundId.split('::');
    if (parts.length >= 2) {
      resolvedTemplateIds.add(parts[parts.length - 1]);
    } else {
      // Bare template ID (no instance prefix)
      resolvedTemplateIds.add(compoundId);
    }
  }

  const resolvedEntries = allTemplates.filter((t) => resolvedTemplateIds.has(t.id));
  const activeEntries = allTemplates.filter((t) => !resolvedTemplateIds.has(t.id));

  const allPatternIds = new Set(allTemplates.map((t) => t.patternId));

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
        title="Resolution log"
        subtitle="All contradiction templates currently marked as resolved in the in-memory store. Resets on server restart."
      >
        <SummaryStrip
          resolvedCount={resolvedEntries.length}
          totalCount={allTemplates.length}
          patternCount={allPatternIds.size}
        />

        {resolvedEntries.length === 0 ? (
          <AllClearBanner />
        ) : (
          <ResolvedSection entries={resolvedEntries} />
        )}

        <StillActiveSection entries={activeEntries} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
