/**
 * ProgramProvenanceRibbon — REASON-28
 *
 * Surfaces the inputs that informed Nexus's program synthesis: the patterns
 * cited, phase-gate state, open blockers, and downstream cascades. Sits
 * directly below the streamed Nexus quote on the Programs detail page.
 *
 * Server-render-friendly: no client hooks, no event handlers. The component
 * is pure presentation over a SynthesisContext-derived view; all formatting
 * happens in `provenance-ribbon-helpers.ts` so the shape can be unit-tested.
 *
 * Style follows the AbarVa palette via SHELL tokens — no new color tokens
 * are introduced here.
 */

import type { SynthesisContext } from '@/lib/reasoning/types';
import {
  formatCitations,
  summarizeBlockers,
  summarizeCascade,
  summarizeFailureModes,
  summarizeGates,
} from '@/lib/reasoning/provenance-ribbon-helpers';
import { SHELL } from '@/lib/shell/shell-tokens';

interface ProgramProvenanceRibbonProps {
  context: SynthesisContext;
}

const RIBBON_BG = '#F8F7F4';
const SECTION_GAP = 14;
const VISIBLE_CITATION_LIMIT = 4;

export function ProgramProvenanceRibbon({ context }: ProgramProvenanceRibbonProps) {
  const cited = formatCitations(context.citations, VISIBLE_CITATION_LIMIT);
  const gates = summarizeGates(context.gatesSummary);
  const blockers = summarizeBlockers(context);
  const cascade = summarizeCascade(context);
  const failureModes = summarizeFailureModes(context);

  const hasCitations = cited.length > 0;
  const hasBlockers = blockers.count > 0;
  const hasCascade = cascade.count > 0;
  const hasFailureModes = failureModes.count > 0;
  const failureModeTopPct = Math.round(failureModes.topConfidence * 100);
  const failureModeTitle =
    failureModes.topLabel !== null
      ? `${failureModes.topLabel} (${failureModeTopPct}% confidence)`
      : 'No failure modes detected';

  return (
    <aside
      aria-label="Program provenance ribbon"
      data-testid="program-provenance-ribbon"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${SECTION_GAP}px`,
        rowGap: 8,
        padding: '8px 16px',
        minHeight: 40,
        background: RIBBON_BG,
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK_SOFT,
      }}
    >
      <Section label="Patterns">
        {hasCitations ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cited.map((c) => (
              <span
                key={c.patternId}
                title={`${c.patternId} — ${c.section}`}
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  color: SHELL.INK,
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 999,
                  padding: '2px 9px',
                  lineHeight: 1.4,
                }}
              >
                {c.title}
              </span>
            ))}
          </div>
        ) : (
          <Muted>No pattern citations yet</Muted>
        )}
      </Section>

      <Divider />

      <Section label="Phase gates">
        <span style={{ fontFamily: SHELL.SERIF, fontSize: 13, color: SHELL.INK }}>
          {gates.cleared}
        </span>
        <Muted> cleared · </Muted>
        <span style={{ fontFamily: SHELL.SERIF, fontSize: 13, color: SHELL.INK }}>
          {gates.pending}
        </span>
        <Muted> pending</Muted>
      </Section>

      <Divider />

      <Section label="Blockers">
        {hasBlockers ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Dot color={blockers.severity === 'red' ? SHELL.RUST_TEXT : SHELL.AMBER_DOT} />
            <span style={{ color: SHELL.INK }}>
              {blockers.count} open
            </span>
            {blockers.topLabel ? (
              <span
                title={blockers.topLabel}
                style={{
                  color: SHELL.INK_SOFT,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                · {blockers.topLabel}
              </span>
            ) : null}
          </span>
        ) : (
          <Muted>None</Muted>
        )}
      </Section>

      <Divider />

      <Section label="Cascade">
        {hasCascade ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {cascade.hasBlockingImpact ? <Dot color={SHELL.AMBER_DOT} /> : null}
            <span style={{ color: SHELL.INK }}>
              Linked: {cascade.count} event{cascade.count === 1 ? '' : 's'}
            </span>
          </span>
        ) : (
          <Muted>No linked events</Muted>
        )}
      </Section>

      <Divider />

      <Section
        label="Failure modes"
        labelDotColor={failureModes.highConfidence > 0 ? SHELL.AMBER_DOT : null}
      >
        {hasFailureModes ? (
          <span
            title={failureModeTitle}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ color: SHELL.INK }}>
              {failureModes.count} detected
            </span>
            {failureModes.topLabel ? (
              <span style={{ color: SHELL.INK_SOFT }}>
                · top: {failureModes.topLabel} ({failureModeTopPct}%)
              </span>
            ) : null}
          </span>
        ) : (
          <Muted>No failure modes detected</Muted>
        )}
      </Section>
    </aside>
  );
}

function Section({
  label,
  labelDotColor,
  children,
}: {
  label: string;
  labelDotColor?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 700,
        }}
      >
        {label}
        {labelDotColor ? (
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: 999,
              background: labelDotColor,
            }}
          />
        ) : null}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{children}</span>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: SHELL.INK_MUTED }}>{children}</span>;
}

function Divider() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 1,
        height: 16,
        background: SHELL.CARD_LINE,
      }}
    />
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
      }}
    />
  );
}
