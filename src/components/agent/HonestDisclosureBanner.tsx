'use client';

// HonestDisclosureBanner · File 10 §5.6 P0
//
// Broader honest-disclosure surface than SparsitySignal. Renders above any
// agent response / deliverable section / pattern detail when the content
// needs a framing caveat the reader must see FIRST.
//
// Four canonical scenarios per File 08 §10 vocabulary:
//   sparse       — retrieval thin; reuse §10.4 phrase
//   authored     — "authored from industry knowledge, not measured outcomes"
//                  per §10.5 + the canonical composite disclaimer
//   cannot_help  — "outside what AbarVa tracks" (§10.6) with a path forward
//   quality      — a quality issue was detected in assembly (hallucinated
//                  citation stripped, context truncated, etc.)
//
// Anti-patterns:
// - No hiding · the banner always renders its label; never collapsed
//   by default
// - No fake reassurance · "we'll get back to you" without a named path
//   is banned
// - No stacking · if two disclosures would fire (e.g. sparse + authored),
//   the renderer merges into one banner; the caller chooses the primary

import { sparsityOpener } from '@/lib/agent/honestDisclosure';

export type DisclosureKind = 'sparse' | 'authored' | 'cannot_help' | 'quality';

interface HonestDisclosureBannerProps {
  kind: DisclosureKind;
  /**
   * Optional short addendum — what the agent specifically does or doesn't
   * have. Example: "no direct evidence for retail margin outcomes; two
   * adjacent patterns at medium confidence."
   */
  detail?: string;
  /**
   * For `cannot_help`, a named alternate path. The renderer displays this
   * as a next-step chip so the user is never left at a dead-end.
   */
  alternatePath?: { label: string; href: string };
  /**
   * For `quality`, the specific issue the assembly flagged. Used verbatim
   * in the banner body so the reader sees what was dropped/truncated.
   */
  qualityIssue?: string;
  /**
   * Optional sparsity phrase rotation index. Defaults to 0; callers can
   * pass a turn-derived index to vary the opener across repeated sparse
   * responses.
   */
  sparsityIndex?: number;
}

const KIND_META: Record<DisclosureKind, { eyebrow: string; accent: string; bg: string }> = {
  sparse: {
    eyebrow: 'Evidence is thin',
    accent: '#8a7e72',
    bg: 'rgba(138,126,114,0.08)',
  },
  authored: {
    eyebrow: 'Authored, not measured',
    accent: '#9B6DFF',
    bg: 'rgba(155,109,255,0.08)',
  },
  cannot_help: {
    eyebrow: 'Outside scope',
    accent: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  quality: {
    eyebrow: 'Response quality note',
    accent: '#E04444',
    bg: 'rgba(224,68,68,0.08)',
  },
};

function bodyFor(
  kind: DisclosureKind,
  detail: string | undefined,
  qualityIssue: string | undefined,
  sparsityIndex: number,
): string {
  switch (kind) {
    case 'sparse':
      return [sparsityOpener(sparsityIndex), detail].filter(Boolean).join(' ');
    case 'authored':
      return [
        'Pattern observations are authored from industry knowledge, not measured outcomes from deployed customers. Every observation card carries a "Composite" tag.',
        detail,
      ]
        .filter(Boolean)
        .join(' ');
    case 'cannot_help':
      return [
        'That\u2019s outside what AbarVa tracks.',
        detail ?? 'Try the linked alternate path, or flag the question for the program team.',
      ]
        .filter(Boolean)
        .join(' ');
    case 'quality':
      return [
        'The response assembly flagged a quality issue:',
        qualityIssue ?? 'an element was stripped or truncated.',
        detail,
      ]
        .filter(Boolean)
        .join(' ');
    default:
      return '';
  }
}

export function HonestDisclosureBanner({
  kind,
  detail,
  alternatePath,
  qualityIssue,
  sparsityIndex = 0,
}: HonestDisclosureBannerProps) {
  const meta = KIND_META[kind];
  const body = bodyFor(kind, detail, qualityIssue, sparsityIndex);

  return (
    <aside
      className={`honest-disclosure honest-${kind}`}
      role="note"
      aria-label={`Honest disclosure · ${meta.eyebrow}`}
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: meta.bg,
        borderLeft: `3px solid ${meta.accent}`,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: meta.accent,
        }}
      >
        {meta.eyebrow}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.6,
          color: '#3d342d',
          fontStyle: kind === 'sparse' ? 'italic' : 'normal',
        }}
      >
        {body}
      </p>
      {kind === 'cannot_help' && alternatePath ? (
        <a
          href={alternatePath.href}
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: meta.accent,
            padding: '6px 10px',
            borderRadius: 999,
            border: `1px solid ${meta.accent}55`,
            textDecoration: 'none',
          }}
        >
          {alternatePath.label} →
        </a>
      ) : null}
    </aside>
  );
}
