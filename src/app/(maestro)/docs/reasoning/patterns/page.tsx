// /docs/reasoning/patterns — Pattern Doctrine Library
//
// Server-rendered index of every sourcing and program pattern in the corpus.
// Patterns are grouped by family (Source Event, Program, Sourcing Category)
// with counts. A client-side search + family filter component (PatternDoctrineSearch)
// is rendered below the header for keyword and category filtering.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

// Pattern sources
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { CAT_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns-cat';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';

import type { DoctrinePatternsEntry, PatternFamily } from './PatternDoctrineSearch';
import { PatternDoctrineSearch } from './PatternDoctrineSearch';

export const metadata = {
  title: 'Pattern Doctrine Library · AbarVa Docs',
};

// ─── Style constants ──────────────────────────────────────────────────────────

const LINK_STYLE: CSSProperties = {
  color: COLORS.navy,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

const STAT_CHIP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  fontWeight: 600,
  color: COLORS.navy,
  background: COLORS.skyPale,
  borderRadius: RADIUS.pill,
  padding: '4px 14px',
  letterSpacing: '0.02em',
};

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildPatternEntries(): DoctrinePatternsEntry[] {
  const entries: DoctrinePatternsEntry[] = [];

  // Source event lifecycle patterns (PAT-SRC-*-001, not CAT)
  for (const p of SOURCE_LIFECYCLE_PATTERNS) {
    entries.push({
      id: p.id,
      title: p.title,
      body: p.body,
      family: 'source-event' satisfies PatternFamily,
    });
  }

  // Program lifecycle patterns (PAT-PRG-*-001)
  for (const p of PROGRAM_LIFECYCLE_PATTERNS) {
    entries.push({
      id: p.id,
      title: p.title,
      body: p.body,
      family: 'program' satisfies PatternFamily,
    });
  }

  // Category lifecycle patterns (PAT-SRC-CAT-*-001)
  for (const p of CAT_LIFECYCLE_PATTERNS) {
    entries.push({
      id: p.id,
      title: p.title,
      body: p.body,
      family: 'sourcing-category' satisfies PatternFamily,
    });
  }

  // Sourcing knowledge patterns (PAT-SRC-NNN — knowledge corpus)
  for (const p of SOURCING_PATTERNS) {
    entries.push({
      id: p.id,
      title: p.title,
      body: p.body,
      family: 'sourcing-category' satisfies PatternFamily,
    });
  }

  return entries;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternDoctrineLibraryPage() {
  const patterns = buildPatternEntries();
  const totalCount = patterns.length;

  const sourceEventCount = patterns.filter((p) => p.family === 'source-event').length;
  const programCount = patterns.filter((p) => p.family === 'program').length;
  const categoryCount = patterns.filter((p) => p.family === 'sourcing-category').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Docs · Reasoning · Patterns"
        title="Pattern Doctrine Library"
        subtitle="AbarVa's complete sourcing and program reasoning corpus — every doctrine entry, searchable."
      >
        {/* Corpus count + family breakdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexWrap: 'wrap',
          }}
        >
          <span style={STAT_CHIP_STYLE}>
            {totalCount} patterns in corpus
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
            }}
          >
            {sourceEventCount} source event · {programCount} program · {categoryCount} category
          </span>
        </div>

        {/* Context paragraph with links to other docs pages */}
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14.5,
              lineHeight: 1.65,
              color: `${COLORS.ink}cc`,
              margin: 0,
            }}
          >
            Each entry below is a typed{' '}
            <code
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12.5,
                color: COLORS.ink,
                background: COLORS.cream,
                padding: '1px 6px',
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.ink}10`,
              }}
            >
              PatternSeed
            </code>{' '}
            from the Layer 1 corpus. Lifecycle patterns (source-event and program families)
            also carry stages, gate criteria, expected artifacts, contradiction templates,
            and failure modes — those are visible at their detail pages in{' '}
            <Link href="/source/patterns" style={LINK_STYLE}>/source/patterns</Link>.
            For the reasoning architecture, see the{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>architecture doc</Link>.
            For a hands-on tour, see the{' '}
            <Link href="/docs/reasoning/demo" style={LINK_STYLE}>5-minute demo</Link>.
          </p>
        </div>

        {/* Client-side search + grouped cards */}
        <PatternDoctrineSearch patterns={patterns} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
