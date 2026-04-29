'use client';

// EvidenceTagSelector — interactive toggle buttons for selecting evidence
// category tags. Used inside evidence submission forms.

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EVIDENCE_TAGS, type EvidenceTag } from '@/lib/reasoning/evidence-tags';

interface EvidenceTagSelectorProps {
  selectedTags: EvidenceTag[];
  onChange: (tags: EvidenceTag[]) => void;
}

const LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 4,
};

// Selected state — filled background matching tag color
const SELECTED_STYLES: Record<EvidenceTag, CSSProperties> = {
  financial: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  technical: {
    background: '#e0f2fe',
    color: '#075985',
    border: '1px solid #bae6fd',
  },
  legal: {
    background: '#ede9fe',
    color: '#5b21b6',
    border: '1px solid #ddd6fe',
  },
  operational: {
    background: SHELL.GRAY_BG,
    color: SHELL.GRAY_TEXT,
    border: `1px solid ${SHELL.GRAY_LINE}`,
  },
  market: {
    background: SHELL.MINT_BG,
    color: SHELL.MINT_TEXT,
    border: `1px solid ${SHELL.MINT_LINE}`,
  },
};

const GHOST: CSSProperties = {
  background: 'transparent',
  color: SHELL.INK_MUTED,
  border: `1px solid ${SHELL.CARD_LINE}`,
};

const BTN_BASE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderRadius: 4,
  padding: '4px 8px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function EvidenceTagSelector({ selectedTags, onChange }: EvidenceTagSelectorProps) {
  function toggle(tag: EvidenceTag) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label style={LABEL}>Tags (optional)</label>
      <div style={ROW}>
        {EVIDENCE_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              style={{
                ...BTN_BASE,
                ...(isSelected ? SELECTED_STYLES[tag] : GHOST),
              }}
              aria-pressed={isSelected}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
