// INT-5 · Intelligence reasoning mode strip.
//
// Server component. Renders the four-mode reasoning toggle that
// frames Sentinel's answer scope: generic / corpus_grounded /
// tenant_grounded / cross_corpus. Mode is read from a searchParams
// prop with no client-runtime directives, no React state hooks.
// Switching modes is a pure URL change via Link.
//
// Reasoning modes are defined in src/lib/intelligence/types.ts as
// IntelligenceReasoningMode. The strip is informational + URL-routed;
// the agent route consumes the same searchParam to scope its retrieval.

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceReasoningMode } from '@/lib/intelligence/types';

interface ModeMeta {
  key: IntelligenceReasoningMode;
  label: string;
  shortLabel: string;
  description: string;
  scope: string;
}

const REASONING_MODES: ReadonlyArray<ModeMeta> = [
  {
    key: 'generic',
    label: 'Generic',
    shortLabel: 'Generic',
    description: 'Definitional answers without corpus retrieval. Fast, scoped to base reasoning.',
    scope: 'No corpus',
  },
  {
    key: 'corpus_grounded',
    label: 'Corpus-grounded',
    shortLabel: 'Corpus',
    description: 'Grounded in worldview and industry corpora. Pattern-anchored answers.',
    scope: 'Worldview + industry',
  },
  {
    key: 'tenant_grounded',
    label: 'Tenant-grounded',
    shortLabel: 'Tenant',
    description: 'Grounded in your enterprise data only. Tenant-isolated retrieval.',
    scope: 'Tenant only',
  },
  {
    key: 'cross_corpus',
    label: 'Cross-corpus',
    shortLabel: 'Cross-corpus',
    description: 'Composes worldview, industry, and tenant. Broad reasoning with full provenance.',
    scope: 'All three corpora',
  },
] as const;

const VALID_MODE_KEYS = new Set<string>(REASONING_MODES.map((m) => m.key));

export function parseReasoningMode(
  raw: string | string[] | undefined,
): IntelligenceReasoningMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'string' && VALID_MODE_KEYS.has(value)) {
    return value as IntelligenceReasoningMode;
  }
  return 'cross_corpus';
}

interface IntelligenceReasoningModeStripProps {
  searchParams?: { mode?: string | string[] };
}

export function IntelligenceReasoningModeStrip({
  searchParams,
}: IntelligenceReasoningModeStripProps) {
  const activeMode = parseReasoningMode(searchParams?.mode);
  const activeMeta = REASONING_MODES.find((m) => m.key === activeMode) ?? REASONING_MODES[3];

  return (
    <section
      data-intelligence-reasoning-mode-strip="int-5"
      data-active-mode={activeMode}
      aria-label="Reasoning mode selector"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 18px',
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            Reasoning mode
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              lineHeight: 1.4,
              maxWidth: '60ch',
            }}
          >
            {activeMeta.description}
          </div>
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            letterSpacing: '0.10em',
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
          }}
        >
          {activeMeta.scope}
        </div>
      </div>

      <nav
        aria-label="Reasoning modes"
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {REASONING_MODES.map((mode) => {
          const isActive = mode.key === activeMode;
          return (
            <Link
              key={mode.key}
              href={`/intelligence/ask?mode=${mode.key}`}
              data-mode={mode.key}
              data-active={isActive}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 999,
                background: isActive ? SHELL.INK : 'transparent',
                color: isActive ? SHELL.PAPER : SHELL.INK_SOFT,
                border: `1px solid ${isActive ? SHELL.INK : SHELL.CARD_LINE}`,
                textDecoration: 'none',
                transition: 'all 150ms',
              }}
            >
              {mode.shortLabel}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
