'use client';

// SparsitySignal · File 08 Section 4.7, Section 7.3, Section 10.4
//
// Renders when `rendered_response.sparsity_flag` is true. Per §4.7 this
// is editorial prose, NOT an error banner. It opens the response so the
// reader sees the honest disclosure before any substantive claim.
//
// Typographic treatment: italic, muted, no border/chrome. Designed to
// feel like a librarian admitting the limits of the collection, not a
// system error. Separator line below it is the only affordance saying
// "the rest of the response continues below."

import { sparsityOpener } from '@/lib/agent/honestDisclosure';

interface SparsitySignalProps {
  /**
   * Index into the rotation of §10.4 phrases. Defaults to 0. Callers
   * that want variation across repeated sparse responses can pass a
   * turn-derived index.
   */
  phraseIndex?: number;
  /**
   * Optional short addendum naming what evidence is or isn't available.
   * The renderer appends this after the stock opener. Keep to one
   * sentence. Example: "Two adjacent patterns exist for retail CX
   * workflows, neither at HIGH confidence."
   */
  evidenceSummary?: string;
}

export function SparsitySignal({ phraseIndex = 0, evidenceSummary }: SparsitySignalProps) {
  const opener = sparsityOpener(phraseIndex);

  return (
    <div
      className="agent-sparsity-signal"
      role="note"
      aria-label="Evidence disclosure"
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 1.6,
        color: '#5a5148',
        margin: '4px 0 14px',
        paddingBottom: 10,
        borderBottom: '1px solid rgba(26,22,18,0.08)',
      }}
    >
      {opener}
      {evidenceSummary ? <span style={{ marginLeft: 6 }}>{evidenceSummary}</span> : null}
    </div>
  );
}
