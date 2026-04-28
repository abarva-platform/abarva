/**
 * SourceProvenanceRibbon — REASON-27
 *
 * Renders the provenance grounding for the Sentinel synthesis quote on the
 * Source event detail page. Surfaces:
 *   • patterns cited (deduped, capped at 4)
 *   • gates: pending vs. cleared
 *   • contradictions: count + amber dot when any are active
 *   • cascade: count of linked downstream impacts
 *
 * Renders server-side from a SynthesisContext built by
 * buildSourceSynthesisContext. Visual-only, no client interactivity.
 */

import type { SynthesisContext } from '@/lib/reasoning/types';
import {
  formatCitations,
  summarizeCascade,
  summarizeGates,
} from '@/lib/reasoning/provenance-ribbon-helpers';
import { isLifecyclePatternId } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PatternDoctrineLink } from '@/components/source/PatternDoctrineLink';
import { SHELL } from '@/lib/shell/shell-tokens';

interface SourceProvenanceRibbonProps {
  context: SynthesisContext;
}

export function SourceProvenanceRibbon({ context }: SourceProvenanceRibbonProps) {
  const cited = formatCitations(context.citations, 4);
  const gates = summarizeGates(context.gatesSummary);
  const cascade = summarizeCascade(context);
  const contradictionCount = context.activeContradictions.length;
  const cascadeCount = cascade.count;

  return (
    <div
      data-testid="source-provenance-ribbon"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0,
        minHeight: 40,
        padding: '8px 14px',
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 6,
        marginTop: 12,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK_SOFT,
      }}
    >
      {/* Patterns section */}
      <RibbonSection label="Patterns">
        {cited.length > 0 ? (
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
            {cited.map((p) =>
              isLifecyclePatternId(p.patternId) ? (
                <PatternDoctrineLink
                  key={p.patternId}
                  patternId={p.patternId}
                  title={p.title}
                  hoverTitle={`${p.patternId} · ${p.section}`}
                />
              ) : (
                <span
                  key={p.patternId}
                  title={`${p.patternId} · ${p.section}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 999,
                    background: SHELL.CARD_WHITE,
                    padding: '3px 9px',
                    fontFamily: SHELL.MONO,
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: SHELL.INK,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>{p.patternId}</span>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontWeight: 400,
                      color: SHELL.INK_MUTED,
                      fontSize: 10.5,
                      letterSpacing: 0,
                    }}
                  >
                    {p.title}
                  </span>
                </span>
              )
            )}
          </div>
        ) : (
          <span style={{ color: SHELL.INK_MUTED, fontStyle: 'italic' }}>none</span>
        )}
      </RibbonSection>

      <Separator />

      {/* Gates section */}
      <RibbonSection label="Gates">
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10.5, color: SHELL.INK }}>
          <span style={{ color: SHELL.MINT_TEXT, fontWeight: 600 }}>{gates.cleared}</span>
          <span style={{ color: SHELL.INK_MUTED }}> cleared · </span>
          <span
            style={{
              color: gates.pending > 0 ? SHELL.PEACH_TEXT : SHELL.INK_MUTED,
              fontWeight: gates.pending > 0 ? 600 : 400,
            }}
          >
            {gates.pending}
          </span>
          <span style={{ color: SHELL.INK_MUTED }}> pending</span>
        </span>
      </RibbonSection>

      <Separator />

      {/* Contradictions section */}
      <RibbonSection label="Contradictions">
        {contradictionCount > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.RUST_TEXT,
              fontWeight: 500,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: SHELL.AMBER_DOT,
                display: 'inline-block',
              }}
            />
            {contradictionCount} detected
          </span>
        ) : (
          <span style={{ color: SHELL.INK_MUTED }}>none</span>
        )}
      </RibbonSection>

      <Separator />

      {/* Cascade section */}
      <RibbonSection label="Cascade">
        {cascadeCount > 0 ? (
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10.5, color: SHELL.INK }}>
            {cascadeCount} linked instance{cascadeCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span style={{ color: SHELL.INK_MUTED }}>none</span>
        )}
      </RibbonSection>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function RibbonSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      style={{
        width: 1,
        height: 20,
        background: SHELL.CARD_LINE,
        margin: '0 2px',
        display: 'inline-block',
      }}
    />
  );
}
