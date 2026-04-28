'use client';

/**
 * ExplainQuotePill — small muted ghost button that opens the
 * ExplainQuoteDrawer for a given synthesis quote. Inline-friendly so it can
 * sit next to the streamed quote text.
 */

import { useState } from 'react';

import { ExplainQuoteDrawer } from '@/components/_shared/ExplainQuoteDrawer';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface ExplainQuotePillProps {
  surface: 'source' | 'programs' | 'tower';
  instanceId: string;
}

export function ExplainQuotePill({ surface, instanceId }: ExplainQuotePillProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="explain-quote-pill"
        onClick={() => setOpen(true)}
        title="Explain this quote — show the rules that fired"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginLeft: 6,
          padding: '2px 8px',
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: SHELL.INK_MUTED,
          background: 'transparent',
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 999,
          cursor: 'pointer',
          verticalAlign: 'baseline',
        }}
      >
        Explain
      </button>
      <ExplainQuoteDrawer
        surface={surface}
        instanceId={instanceId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
