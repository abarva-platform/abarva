/**
 * SetupActTwo · SETUP-1.2
 *
 * Act 2 — "What we can reason about because of that data."
 *
 * Renders the four capability families (pattern citations,
 * cross-program signals, evidence-grounded Q&A, outcome
 * measurement readiness) with a depth state pill (grounded /
 * partial / missing) and 2-3 grounding examples each.
 *
 * The capability node prose is authored; the depth state is
 * authored too because it reflects narrative judgment — not just
 * row counts. SETUP-1.3 will swap depth state to a live computed
 * value derived from segment coverage + cross-segment lineage.
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.3.
 */

import Link from 'next/link';

import type {
  CapabilityDepthState,
  CapabilityNode,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

import { SetupActHeader } from './SetupActOne';

export interface SetupActTwoProps {
  capabilities: CapabilityNode[];
}

export function SetupActTwo({ capabilities }: SetupActTwoProps) {
  return (
    <section
      data-testid="admin-setup-act-two"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <SetupActHeader
        eyebrow="Act 2"
        title="What we can reason about, because of that data"
        subtitle="Capabilities are graded grounded, partial, or missing — judgments that reflect both what's loaded and what's still gappy. Click any example to see the underlying record."
      />
      {capabilities.length === 0 ? (
        <p
          data-testid="admin-setup-empty"
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_SOFT,
            fontStyle: 'italic',
          }}
        >
          Capability map is empty. Load Org structure + Program inventory + Evidence ledger to start grounding the corpus.
        </p>
      ) : (
        <ul
          role="list"
          data-testid="admin-setup-capability-grid"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: SPACING.md,
          }}
        >
          {capabilities.map((cap) => (
            <CapabilityCard key={cap.id} capability={cap} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CapabilityCard({ capability }: { capability: CapabilityNode }) {
  const tone = depthTone(capability.depthState);
  return (
    <li
      role="listitem"
      data-testid={`admin-setup-capability-${capability.family}`}
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 15,
            color: SHELL.INK,
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {familyDisplay(capability.family)}
        </p>
        <DepthPill depthState={capability.depthState} />
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        {capability.label}
      </p>
      <ul
        role="list"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        {capability.groundingExamples.map((ex, i) => (
          <li role="listitem" key={i}>
            <Link
              href={ex.href}
              data-testid={`admin-setup-cap-example-${capability.family}-${i}`}
              style={{
                color: COLORS.navy,
                textDecoration: 'none',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                lineHeight: 1.5,
                borderBottom: `1px dotted ${COLORS.navy}66`,
              }}
            >
              {ex.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function DepthPill({ depthState }: { depthState: CapabilityDepthState }) {
  const tone = depthTone(depthState);
  return (
    <span
      data-testid={`admin-setup-depth-${depthState}`}
      style={{
        display: 'inline-block',
        padding: `2px ${SPACING.sm}`,
        background: tone.background,
        color: tone.text,
        borderRadius: RADIUS.pill,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
    >
      {depthState}
    </span>
  );
}

function depthTone(state: CapabilityDepthState): {
  background: string;
  border: string;
  text: string;
} {
  switch (state) {
    case 'grounded':
      return {
        background: COLORS.mintSoft,
        border: `${COLORS.mintInk}33`,
        text: COLORS.mintInk,
      };
    case 'partial':
      return {
        background: COLORS.amberSoft,
        border: `${COLORS.amberInk}33`,
        text: COLORS.amberInk,
      };
    case 'missing':
      return {
        background: COLORS.coralSoft,
        border: `${COLORS.coralInk}33`,
        text: COLORS.coralInk,
      };
  }
}

function familyDisplay(family: CapabilityNode['family']): string {
  switch (family) {
    case 'pattern-citations':
      return 'Pattern citations across the corpus';
    case 'cross-program-signals':
      return 'Cross-program signals + contradictions';
    case 'evidence-grounded-qa':
      return 'Evidence-grounded Q&A';
    case 'outcome-measurement-readiness':
      return 'Outcome measurement readiness';
  }
}
