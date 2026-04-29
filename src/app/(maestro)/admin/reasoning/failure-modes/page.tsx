// /admin/reasoning/failure-modes — Catalog of all failure modes defined across
// all lifecycle patterns.
//
// Pure server component. Collects every FailureMode entry from all patterns,
// deduplicates by id (recording which patterns reference each), sorts by stage
// count descending then alphabetical, and renders a card-per-failure-mode view.

import { SHELL } from '@/lib/shell/shell-tokens';
import { RADIUS, SPACING } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { FailureMode } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Failure mode catalog | AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FailureModeEntry {
  failureMode: FailureMode;
  patternTitles: string[];
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildFailureModeEntries(): FailureModeEntry[] {
  const patterns = getAllLifecyclePatterns();

  // Deduplicate by id — collect pattern titles that reference each.
  const byId = new Map<string, { failureMode: FailureMode; patternTitles: string[] }>();

  for (const pattern of patterns) {
    for (const fm of pattern.failureModes ?? []) {
      const existing = byId.get(fm.id);
      if (existing) {
        existing.patternTitles.push(pattern.title);
      } else {
        byId.set(fm.id, {
          failureMode: fm,
          patternTitles: [pattern.title],
        });
      }
    }
  }

  // Sort: most stages descending, then alphabetical by id.
  return Array.from(byId.values()).sort((a, b) => {
    const diff = (b.failureMode.stages?.length ?? 0) - (a.failureMode.stages?.length ?? 0);
    if (diff !== 0) return diff;
    return a.failureMode.id.localeCompare(b.failureMode.id);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: SHELL.INK_MUTED,
        fontWeight: 600,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function StageChip({ stageId }: { stageId: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: RADIUS.sm,
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_MUTED,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {stageId}
    </span>
  );
}

function FailureModeCard({ entry }: { entry: FailureModeEntry }) {
  const { failureMode, patternTitles } = entry;
  const stages = failureMode.stages ?? [];
  const mitigations = failureMode.mitigations ?? [];
  const visibleMitigations = mitigations.slice(0, 3);
  const hiddenCount = mitigations.length - visibleMitigations.length;

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: SPACING.md,
      }}
    >
      {/* Header row: mono ID + bold label + pattern count badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          flexWrap: 'wrap' as const,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          {failureMode.id}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 16,
            fontWeight: 700,
            color: SHELL.INK,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            flex: '1 1 auto',
          }}
        >
          {failureMode.label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: RADIUS.pill,
            background: `${SHELL.INK}0a`,
            border: `1px solid ${SHELL.CARD_LINE}`,
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontWeight: 600,
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap' as const,
            flexShrink: 0,
          }}
        >
          {patternTitles.length} {patternTitles.length === 1 ? 'pattern' : 'patterns'}
        </span>
      </div>

      {/* Stages row */}
      {stages.length > 0 ? (
        <div>
          <SectionLabel>Stages</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {stages.map((stageId) => (
              <StageChip key={stageId} stageId={stageId} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Description */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {failureMode.description}
      </p>

      {/* Mitigations */}
      {visibleMitigations.length > 0 ? (
        <div
          style={{
            paddingTop: SPACING.xs,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
          }}
        >
          <SectionLabel>Mitigations</SectionLabel>
          <ol
            style={{
              margin: 0,
              paddingLeft: '1.4em',
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 6,
            }}
          >
            {visibleMitigations.map((m, idx) => (
              <li
                key={idx}
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  lineHeight: 1.55,
                }}
              >
                {m}
              </li>
            ))}
          </ol>
          {hiddenCount > 0 ? (
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
                fontStyle: 'italic' as const,
                marginTop: 6,
              }}
            >
              &hellip;+{hiddenCount} more
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Pattern names */}
      <div
        style={{
          paddingTop: SPACING.xs,
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
        }}
      >
        <SectionLabel>Referenced by</SectionLabel>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {patternTitles.join(', ')}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FailureModeCatalogPage() {
  const entries = buildFailureModeEntries();
  const patternCount = getAllLifecyclePatterns().length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open reasoning telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Failure mode catalog"
        subtitle="All failure modes defined across lifecycle patterns, with affected stages and mitigations."
      >
        {/* Summary strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexWrap: 'wrap' as const,
            padding: `${SPACING.sm} ${SPACING.md}`,
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.GRAY_LINE}`,
            borderRadius: RADIUS.lg,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          <span>{entries.length} failure {entries.length === 1 ? 'mode' : 'modes'}</span>
          <span style={{ color: SHELL.INK_MUTED }}>·</span>
          <span>across {patternCount} {patternCount === 1 ? 'pattern' : 'patterns'}</span>
        </div>

        {/* Back link */}
        <a
          href="/admin/reasoning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.sm,
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.md}`,
            textDecoration: 'none',
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            alignSelf: 'flex-start' as const,
          }}
        >
          <span style={{ fontWeight: 600 }}>Back to reasoning telemetry</span>
        </a>

        {/* Failure mode cards */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: SPACING.md }}>
          {entries.map((entry) => (
            <FailureModeCard key={entry.failureMode.id} entry={entry} />
          ))}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
