'use client';

/**
 * ExplainQuoteDrawer — surfaces the full reasoning trace behind a synthesis
 * quote. Opens on demand (Explain pill click), fetches
 * `/api/reasoning/explain?surface=...&instanceId=...`, and renders:
 *   - Citations (clickable pattern doctrine chips)
 *   - Gates grouped by stage (every criterion with status)
 *   - Contradictions (every template tested, fired or not)
 *   - Failure modes (every template tested, fired or not)
 *   - Cascade impacts
 *
 * Right-anchored fixed panel with a paper-light scrim. ESC closes. AbarVa
 * palette only — reuses SHELL tokens already shared with the
 * ContradictionDetailCard.
 */

import { startTransition, useEffect, useState } from 'react';

import { PatternDoctrineLink } from '@/components/source/PatternDoctrineLink';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  ExplanationCascadeRow,
  ExplanationContradictionRow,
  ExplanationFailureModeRow,
  ExplanationGateRow,
  ExplanationGateStageGroup,
  ExplanationPayload,
} from '@/lib/reasoning/explanation-serializer';

export interface ExplainQuoteDrawerProps {
  surface: 'source' | 'programs' | 'tower';
  instanceId: string;
  open: boolean;
  onClose: () => void;
}

const STATUS_DOT_COLOR: Record<ExplanationGateRow['status'], string> = {
  met: SHELL.MINT_TEXT,
  unmet: SHELL.RUST_TEXT,
  partial: SHELL.AMBER_DOT,
  waived: SHELL.INK_MUTED,
};

const SEVERITY_DOT_COLOR: Record<'low' | 'medium' | 'high', string> = {
  high: SHELL.RUST_TEXT,
  medium: SHELL.AMBER_DOT,
  low: SHELL.INK_MUTED,
};

export function ExplainQuoteDrawer({
  surface,
  instanceId,
  open,
  onClose,
}: ExplainQuoteDrawerProps) {
  const [payload, setPayload] = useState<ExplanationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch on open. We intentionally re-fetch every time the drawer opens —
  // this is a debug-y surface where freshness matters more than caching.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Batch the reset into a transition so React handles it as a single
    // lower-priority update rather than three cascading synchronous renders.
    startTransition(() => {
      setLoading(true);
      setError(null);
      setPayload(null);
    });

    const url = `/api/reasoning/explain?surface=${encodeURIComponent(
      surface,
    )}&instanceId=${encodeURIComponent(instanceId)}`;

    fetch(url, { method: 'GET', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `explain ${res.status}`);
        }
        return res.json() as Promise<ExplanationPayload>;
      })
      .then((data) => {
        if (cancelled) return;
        setPayload(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'failed to load explanation');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, surface, instanceId]);

  // ESC closes the drawer.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="explain-quote-drawer-overlay"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,12,18,0.18)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        data-testid="explain-quote-drawer"
        role="complementary"
        aria-label="Explanation drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          height: '100%',
          background: SHELL.PAPER,
          borderLeft: `1px solid ${SHELL.CARD_LINE}`,
          boxShadow: '-8px 0 32px rgba(10,12,18,0.08)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: SHELL.SANS,
          color: SHELL.INK,
          boxSizing: 'border-box',
        }}
      >
        <Header
          surface={surface}
          instanceId={instanceId}
          onClose={onClose}
        />

        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {loading && <Skeleton />}
          {error && (
            <div
              data-testid="explain-quote-drawer-error"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
                background: SHELL.RUST_BG,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              {error}
            </div>
          )}
          {payload && <Body payload={payload} />}
        </div>
      </aside>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  surface,
  instanceId,
  onClose,
}: {
  surface: string;
  instanceId: string;
  onClose: () => void;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '16px 20px',
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          Explanation
        </span>
        <span
          title={`${surface}/${instanceId}`}
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.3,
            color: SHELL.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {surface} · {instanceId}
        </span>
      </div>
      <button
        type="button"
        data-testid="explain-quote-drawer-close"
        onClick={onClose}
        aria-label="Close explanation drawer"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          letterSpacing: '0.04em',
          color: SHELL.INK_MUTED,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
        }}
      >
        Close ✕
      </button>
    </header>
  );
}

// ─── Body ────────────────────────────────────────────────────────────────────

function Body({ payload }: { payload: ExplanationPayload }) {
  return (
    <>
      <SummaryBar payload={payload} />
      <CitationsSection citations={payload.citations} />
      <GatesSection gates={payload.gates} />
      <ContradictionsSection contradictions={payload.contradictions} />
      <FailureModesSection failureModes={payload.failureModes} />
      <CascadeSection impacts={payload.cascadeImpacts} />
    </>
  );
}

function SummaryBar({ payload }: { payload: ExplanationPayload }) {
  return (
    <section
      data-testid="explain-summary"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 12px',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        Pattern · stage
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <PatternDoctrineLink
          patternId={payload.patternId}
          title={`v${payload.patternVersion}`}
        />
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT }}>
          stage {payload.currentStage}
        </span>
      </div>
      <div style={{ fontFamily: SHELL.MONO, fontSize: 10.5, color: SHELL.INK_MUTED }}>
        Gates: {payload.gateSummary.met} of {payload.gateSummary.total} met
        {payload.gateSummary.unmet > 0 ? ` · ${payload.gateSummary.unmet} unmet` : ''}
      </div>
    </section>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
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
        {title}
      </span>
      {typeof count === 'number' && (
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
          {count}
        </span>
      )}
    </div>
  );
}

function CitationsSection({
  citations,
}: {
  citations: ExplanationPayload['citations'];
}) {
  return (
    <section data-testid="explain-citations">
      <SectionHeader title="Citations" count={citations.length} />
      {citations.length === 0 ? (
        <EmptyHint text="No citations attached." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {citations.map((c, idx) => (
            <article
              key={`${c.patternId}-${idx}`}
              style={{
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PatternDoctrineLink patternId={c.patternId} />
                <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
                  {c.section}
                </span>
              </div>
              {c.excerpt && (
                <p
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    margin: 0,
                    color: SHELL.INK_SOFT,
                    lineHeight: 1.5,
                  }}
                >
                  {c.excerpt}
                </p>
              )}
              {c.relevance && (
                <p
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    margin: 0,
                    color: SHELL.INK_MUTED,
                    letterSpacing: '0.04em',
                  }}
                >
                  {c.relevance}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GatesSection({ gates }: { gates: ExplanationGateStageGroup[] }) {
  const totalRows = gates.reduce((acc, g) => acc + g.rows.length, 0);
  return (
    <section data-testid="explain-gates">
      <SectionHeader title="Gates" count={totalRows} />
      {totalRows === 0 ? (
        <EmptyHint text="No gate criteria evaluated." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gates.map((g) => (
            <GateStageBlock key={g.stageId} group={g} />
          ))}
        </div>
      )}
    </section>
  );
}

function GateStageBlock({ group }: { group: ExplanationGateStageGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK,
            letterSpacing: '0.04em',
          }}
        >
          stage {group.stageId}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
          {group.rows.length} · {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 10px 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {group.rows.map((row) => (
            <GateRow key={row.criterionId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function GateRow({ row }: { row: ExplanationGateRow }) {
  const dot = STATUS_DOT_COLOR[row.status];
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '6px 8px',
        background: SHELL.PAPER_SOFT,
        borderRadius: 4,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      <span
        aria-label={row.status}
        title={row.status}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
          marginTop: 5,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.04em',
          }}
        >
          {row.criterionId} · {row.gateType}
        </div>
        {row.description && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK,
              lineHeight: 1.4,
              marginTop: 2,
            }}
          >
            {row.description}
          </div>
        )}
        {row.evaluationHint && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {row.evaluationHint}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: SHELL.INK_MUTED,
          flexShrink: 0,
        }}
      >
        {row.status}
      </span>
    </div>
  );
}

function ContradictionsSection({
  contradictions,
}: {
  contradictions: ExplanationContradictionRow[];
}) {
  const fired = contradictions.filter((c) => c.fired).length;
  return (
    <section data-testid="explain-contradictions">
      <SectionHeader
        title="Contradictions"
        count={contradictions.length}
      />
      <div
        style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 6 }}
      >
        {fired} fired · {contradictions.length - fired} not detected
      </div>
      {contradictions.length === 0 ? (
        <EmptyHint text="No contradiction templates defined for this pattern." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contradictions.map((row) => (
            <ContradictionRow key={row.templateId} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function ContradictionRow({ row }: { row: ExplanationContradictionRow }) {
  const dot = SEVERITY_DOT_COLOR[row.severity];
  const confidencePct = Math.round(row.confidence * 100);
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: row.fired ? SHELL.CARD_WHITE : SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
        padding: '8px 10px',
        opacity: row.fired ? 1 : 0.75,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
          marginTop: 5,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.04em',
          }}
        >
          {row.templateId}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK,
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {row.label}
        </div>
        {row.fired && row.triggeringFields.length > 0 && (
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 4,
            }}
          >
            triggered by {row.triggeringFields.join(' · ')}
          </div>
        )}
        {row.fired && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {row.resolutionPath}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: row.fired ? SHELL.RUST_TEXT : SHELL.INK_MUTED,
          flexShrink: 0,
        }}
      >
        {row.fired ? `fired · ${confidencePct}%` : 'no match'}
      </span>
    </div>
  );
}

function FailureModesSection({
  failureModes,
}: {
  failureModes: ExplanationFailureModeRow[];
}) {
  const fired = failureModes.filter((f) => f.fired).length;
  return (
    <section data-testid="explain-failure-modes">
      <SectionHeader title="Failure modes" count={failureModes.length} />
      <div
        style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 6 }}
      >
        {fired} fired · {failureModes.length - fired} not detected
      </div>
      {failureModes.length === 0 ? (
        <EmptyHint text="No failure-mode templates defined for this pattern." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {failureModes.map((row) => (
            <FailureModeRow key={row.failureModeId} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function FailureModeRow({ row }: { row: ExplanationFailureModeRow }) {
  const confidencePct = Math.round(row.confidence * 100);
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: row.fired ? SHELL.CARD_WHITE : SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
        padding: '8px 10px',
        opacity: row.fired ? 1 : 0.75,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.04em',
          }}
        >
          {row.failureModeId}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK,
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {row.label}
        </div>
        {row.fired && row.matchedKeywords.length > 0 && (
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              marginTop: 4,
            }}
          >
            keywords: {row.matchedKeywords.join(' · ')}
          </div>
        )}
        {row.fired && row.mitigations.length > 0 && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {row.mitigations[0]}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: row.fired ? SHELL.AMBER_DOT : SHELL.INK_MUTED,
          flexShrink: 0,
        }}
      >
        {row.fired ? `fired · ${confidencePct}%` : 'no match'}
      </span>
    </div>
  );
}

function CascadeSection({ impacts }: { impacts: ExplanationCascadeRow[] }) {
  return (
    <section data-testid="explain-cascade">
      <SectionHeader title="Cascade impacts" count={impacts.length} />
      {impacts.length === 0 ? (
        <EmptyHint text="No cascade impacts identified." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {impacts.map((c, idx) => (
            <div
              key={`${c.targetInstanceId}-${idx}`}
              style={{
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_SOFT,
                  letterSpacing: '0.04em',
                }}
              >
                {c.targetInstanceId} · {c.linkType} · {c.severity}
                {c.impactSeverity ? ` · ${c.impactSeverity}` : ''}
              </div>
              {c.targetInstanceName && (
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.INK,
                    marginTop: 2,
                  }}
                >
                  {c.targetInstanceName}
                </div>
              )}
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  color: SHELL.INK_SOFT,
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                {c.impact}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK_MUTED,
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

function Skeleton() {
  return (
    <div
      data-testid="explain-quote-drawer-loading"
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_MUTED,
      }}
    >
      Loading explanation…
    </div>
  );
}
