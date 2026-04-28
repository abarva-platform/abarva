// src/components/source/LinkedProgramChip.tsx
//
// REASON-18 — Source-side chip rendering linked-program live state.
//
// Replaces the hardcoded "LINKED PROGRAM · APX-CDP-2026 P3 Design" chip
// with a chip whose contents are derived at render time from the linked
// program's current ProgramInstance. If the linked program advances a
// phase or clears a blocker, the chip text and color update automatically.
//
// This is a thin presentational shell over `buildLinkedProgramChip`. It
// composes the existing `LinkedProgramChip` from `@/components/shell` for
// the navigation chip itself, then layers an amber dot + blocker pill when
// the linked program has an open blocker.

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildLinkedProgramChip,
  type LinkedProgramChipData,
} from '@/lib/reasoning/cross-instance-reasoner';
import type { LinkType } from '@/lib/reasoning';

export interface SourceLinkedProgramChipProps {
  /** Program ID to link to, e.g. 'APX-CDP-2026'. */
  linkedProgramId: string;
  /** Type of link expressed by the source event. */
  linkType: LinkType;
  /** href override; defaults to `/programs/{lowercased-id}`. */
  href?: string;
}

const STATUS_BG: Record<LinkedProgramChipData['status'], string> = {
  green: SHELL.MINT_BG,
  amber: SHELL.PEACH_BG,
  gray: SHELL.GRAY_BG,
};

const STATUS_LINE: Record<LinkedProgramChipData['status'], string> = {
  green: SHELL.MINT_LINE,
  amber: SHELL.PEACH_LINE,
  gray: SHELL.GRAY_LINE,
};

const STATUS_TEXT: Record<LinkedProgramChipData['status'], string> = {
  green: SHELL.MINT_TEXT,
  amber: SHELL.PEACH_TEXT,
  gray: SHELL.GRAY_TEXT,
};

export function SourceLinkedProgramChip({
  linkedProgramId,
  linkType,
  href,
}: SourceLinkedProgramChipProps) {
  const chip = buildLinkedProgramChip(linkedProgramId, linkType);
  const targetHref = href ?? `/programs/${linkedProgramId.toLowerCase()}`;

  return (
    <div data-testid="source-linked-program-chip" data-status={chip.status}>
      <Link
        href={targetHref}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: SHELL.PAPER_DEEP,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 20,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: SHELL.INK_MUTED,
          }}
        >
          {chip.label}
        </span>
        <span style={{ color: SHELL.CARD_LINE }}>·</span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            fontWeight: 600,
            color: SHELL.INK,
          }}
        >
          {chip.linkedProgramId}
        </span>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 13,
            color: SHELL.INK,
          }}
        >
          {chip.linkedProgramName}
        </span>
        <span
          data-testid="source-linked-program-phase-pill"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: STATUS_TEXT[chip.status],
            background: STATUS_BG[chip.status],
            border: `1px solid ${STATUS_LINE[chip.status]}`,
            padding: '2px 8px',
            borderRadius: 10,
          }}
        >
          {chip.phaseLabel}
        </span>
        {chip.hasBlocker && (
          <span
            data-testid="source-linked-program-blocker-dot"
            aria-label="Linked program has an open blocker"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: SHELL.AMBER_DOT,
            }}
          />
        )}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
          }}
        >
          →
        </span>
      </Link>
      {chip.hasBlocker && chip.blockerLabel && (
        <p
          data-testid="source-linked-program-blocker-label"
          style={{
            margin: '8px 0 0 0',
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.PEACH_TEXT,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          {chip.blockerLabel}
        </p>
      )}
    </div>
  );
}
