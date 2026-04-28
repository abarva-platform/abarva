import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface LinkedProgramChipProps {
  direction: 'source-to-program' | 'program-to-source';
  linkedId: string;           // APX-CDP-2026 or SRC-AMS-2026
  linkedName: string;         // Short display name
  linkedPhase?: string;       // e.g. 'P3 Design' (for program link)
  linkedStage?: string;       // e.g. 'BAFO · Stage 7' (for source link)
  href: string;               // Link destination
}

export function LinkedProgramChip({
  direction,
  linkedId,
  linkedName,
  linkedPhase,
  linkedStage,
  href,
}: LinkedProgramChipProps) {
  const dirLabel = direction === 'source-to-program' ? 'Linked program' : 'Linked source event';
  const statusLabel = linkedPhase ?? linkedStage;

  return (
    <Link
      href={href}
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
      {/* Direction label */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: SHELL.INK_MUTED,
        }}
      >
        {dirLabel}
      </span>
      {/* Divider */}
      <span style={{ color: SHELL.CARD_LINE }}>·</span>
      {/* ID */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          fontWeight: 600,
          color: SHELL.INK,
        }}
      >
        {linkedId}
      </span>
      {/* Name */}
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 13,
          color: SHELL.INK,
        }}
      >
        {linkedName}
      </span>
      {/* Status */}
      {statusLabel && (
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.PEACH_TEXT,
            background: SHELL.PEACH_BG,
            padding: '2px 8px',
            borderRadius: 10,
          }}
        >
          {statusLabel}
        </span>
      )}
      {/* Arrow */}
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
  );
}
