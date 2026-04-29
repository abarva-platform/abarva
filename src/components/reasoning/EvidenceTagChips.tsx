// EvidenceTagChips — read-only display of evidence category tags.
// Renders small colored chips for each tag. No client directive needed —
// this is a pure display component with no interactivity.

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { EvidenceTag } from '@/lib/reasoning/evidence-tags';

interface EvidenceTagChipsProps {
  tags: EvidenceTag[];
}

const CHIP_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderRadius: 4,
  padding: '2px 6px',
  whiteSpace: 'nowrap',
};

const TAG_STYLES: Record<EvidenceTag, CSSProperties> = {
  financial: {
    ...CHIP_BASE,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  technical: {
    ...CHIP_BASE,
    background: '#e0f2fe',
    color: '#075985',
    border: '1px solid #bae6fd',
  },
  legal: {
    ...CHIP_BASE,
    background: '#ede9fe',
    color: '#5b21b6',
    border: '1px solid #ddd6fe',
  },
  operational: {
    ...CHIP_BASE,
    background: SHELL.GRAY_BG,
    color: SHELL.GRAY_TEXT,
    border: `1px solid ${SHELL.GRAY_LINE}`,
  },
  market: {
    ...CHIP_BASE,
    background: SHELL.MINT_BG,
    color: SHELL.MINT_TEXT,
    border: `1px solid ${SHELL.MINT_LINE}`,
  },
};

export function EvidenceTagChips({ tags }: EvidenceTagChipsProps) {
  if (tags.length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {tags.map((tag) => (
        <span key={tag} style={TAG_STYLES[tag]}>
          {tag}
        </span>
      ))}
    </span>
  );
}
