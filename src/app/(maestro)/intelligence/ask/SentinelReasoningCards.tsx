'use client';

import { useMemo, useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SynthesisFeedbackWidget } from '@/components/reasoning/SynthesisFeedbackWidget';
import type { SentinelReasoningStage } from '@/lib/agents/sentinel-reasoning';
import { ensureIntelligenceAskTabId } from '@/app/intelligence/ask/IntelligenceAskTabCookie';

type StreamEvent =
  | { type: 'session'; sessionId?: string; tabId?: string; priorTurnCount?: number }
  | { type: 'classified'; classification?: { intent?: string; confidence?: number; reason?: string } }
  | { type: 'sentinel-stage'; stage?: SentinelReasoningStage }
  | { type: 'delta'; text?: string }
  | { type: 'done'; telemetryEventId?: string }
  | { type: 'error'; error?: string };

// STRESS-P0-002 fix: tenant-agnostic placeholder question that doesn't
// presume the user's industry. The previous placeholder ("As Apex CTO...")
// implicitly invited Apex-flavored responses regardless of session tenant.
const DEFAULT_QUESTION =
  'What are the top three AI investments I should be sequencing for the next four quarters, and what evidence do you have to back them?';

function eventFromLine(line: string): StreamEvent | null {
  try {
    return JSON.parse(line) as StreamEvent;
  } catch {
    return null;
  }
}

interface SentinelReasoningCardsProps {
  /**
   * Active tenant client key resolved from the authenticated session by the
   * server component (e.g., 'apexretail', 'meridian', 'arcturus').
   *
   * STRESS-P0-002 fix (2026-05-25): the prior default of 'apexretail' caused
   * every Sentinel ask call to be tagged as Apex regardless of the actual
   * authenticated tenant, producing cross-tenant identity leakage in the
   * agent's response. The prop is now required from the server component.
   */
  initialClient: string;
  /**
   * Human-readable display name for the active tenant ("Apex Retail Group",
   * "Meridian Health System", etc.). Used in the surfaceContext sent to the
   * API so downstream consumers don't need a second lookup. Server component
   * derives this from getActiveClientRow().name.
   */
  initialClientDisplayName: string;
}

export function SentinelReasoningCards({
  initialClient,
  initialClientDisplayName,
}: SentinelReasoningCardsProps) {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [cards, setCards] = useState<SentinelReasoningStage[]>([]);
  const [fallbackText, setFallbackText] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedbackEventId, setFeedbackEventId] = useState<string | null>(null);

  const finalAction = useMemo(
    () => cards.find((card) => card.oneClickAction)?.oneClickAction ?? null,
    [cards],
  );

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed || status === 'streaming') return;
    setCards([]);
    setFallbackText('');
    setError(null);
    setActionState(null);
    setFeedbackEventId(null);
    setStatus('streaming');

    try {
      const tabId = ensureIntelligenceAskTabId();
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: trimmed,
          client: initialClient,
          tabId,
          surfaceContext: {
            clientKey: initialClient,
            // STRESS-P0-002 fix: derive activeClient display name from the
            // server-resolved tenant prop. Previously hardcoded 'Apex Retail
            // Group' regardless of authenticated session.
            activeClient: initialClientDisplayName,
            activeTab: 'sentinel-reasoning',
          },
        }),
      });
      if (!response.ok || !response.body) throw new Error(`Sentinel request failed (${response.status})`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = eventFromLine(line);
          if (!event) continue;
          if (event.type === 'session' && event.sessionId) {
            setSessionId(event.sessionId);
          } else if (event.type === 'sentinel-stage' && event.stage) {
            setCards((prev) => [...prev.filter((card) => card.id !== event.stage?.id), event.stage as SentinelReasoningStage]);
          } else if (event.type === 'delta' && event.text) {
            setFallbackText((prev) => prev + event.text);
          } else if (event.type === 'error') {
            throw new Error(event.error ?? 'Sentinel stream error');
          } else if (event.type === 'done' && event.telemetryEventId) {
            setFeedbackEventId(event.telemetryEventId);
          }
        }
      }
      setStatus('done');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Sentinel could not complete the request.');
    }
  }

  async function shapeMoves() {
    if (!finalAction) return;
    const href = finalAction.href ?? (
      sessionId
        ? `/programs/new?fromIntelligence=1&intelligenceSessionId=${encodeURIComponent(sessionId)}&sourceTitle=${encodeURIComponent('Sentinel Intelligence Ask')}`
        : null
    );
    if (!finalAction.payload.parentMoveInstanceId) {
      if (href) {
        window.location.assign(href);
        return;
      }
      setActionState('Open this from a parent Move to instantiate in the DAG; proposals are staged here.');
      return;
    }
    setActionState('Calling DAG shape endpoint...');
    try {
      const response = await fetch(finalAction.endpoint, {
        method: finalAction.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAction.payload),
      });
      if (!response.ok) {
        setActionState('DAG API pending; five proposals are staged in the Sentinel card for P10 handoff.');
        return;
      }
      const body = await response.json().catch(() => ({}));
      const count = typeof body?.createdCount === 'number'
        ? body.createdCount
        : Array.isArray(body?.moves)
          ? body.moves.length
          : Array.isArray(body?.data?.result?.createdInstances)
            ? body.data.result.createdInstances.length
          : finalAction.payload.proposals.length;
      setActionState(`${count} Move proposals sent to the dependency DAG.`);
    } catch {
      setActionState('DAG API pending; five proposals are staged in the Sentinel card for P10 handoff.');
    }
  }

  return (
    <section
      data-testid="sentinel-reasoning-workspace"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 0.72fr) minmax(0, 1.28fr)',
        gap: 16,
        minHeight: 'min(680px, calc(100svh - 220px))',
      }}
    >
      <style>{`
        @media (max-width: 840px) {
          [data-testid="sentinel-reasoning-workspace"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask();
        }}
        style={{
          border: `1px solid ${SHELL.CARD_LINE}`,
          background: SHELL.INK,
          color: SHELL.PAPER,
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 360,
        }}
      >
        <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,247,241,0.52)' }}>
          Sentinel reasoning
        </div>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={8}
          style={{
            resize: 'vertical',
            minHeight: 150,
            borderRadius: 8,
            border: '1px solid rgba(250,247,241,0.18)',
            background: 'rgba(250,247,241,0.08)',
            color: SHELL.PAPER,
            padding: 12,
            fontFamily: SHELL.SANS,
            fontSize: 14,
            lineHeight: 1.45,
          }}
        />
        <button
          type="submit"
          disabled={status === 'streaming'}
          style={{
            border: `1px solid ${SHELL.PAPER}`,
            background: SHELL.PAPER,
            color: SHELL.INK,
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: SHELL.MONO,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: status === 'streaming' ? 'default' : 'pointer',
          }}
        >
          {status === 'streaming' ? 'Reasoning...' : 'Ask Sentinel'}
        </button>
        {error ? <div style={{ color: '#FFB4A8', fontFamily: SHELL.SANS, fontSize: 13 }}>{error}</div> : null}
        {fallbackText && cards.length === 0 ? (
          <div style={{ color: 'rgba(250,247,241,0.74)', fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.5 }}>
            {fallbackText}
          </div>
        ) : null}
      </form>

      <div style={{ minWidth: 0, display: 'grid', gap: 10, alignContent: 'start' }}>
        {cards.length === 0 && status !== 'streaming' ? (
          <div
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: 18,
              background: SHELL.PAPER,
              color: SHELL.INK_MUTED,
              fontFamily: SHELL.SANS,
              fontSize: 14,
            }}
          >
            Ask an IT-productivity question to stream the six Sentinel blocks.
          </div>
        ) : null}
        {[...cards].sort((a, b) => a.sequence - b.sequence).map((card) => (
          <details
            key={card.id}
            open
            data-testid={`sentinel-stage-card-${card.id}`}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              background: SHELL.PAPER,
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                listStyle: 'none',
                cursor: 'pointer',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <span style={{ fontFamily: SHELL.SERIF, fontSize: 18, color: SHELL.INK }}>{card.sequence}. {card.name}</span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.GRAY_TEXT }}>{Math.round(card.confidence * 100)}%</span>
            </summary>
            <div style={{ padding: 14, display: 'grid', gap: 12 }}>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 14, lineHeight: 1.55, color: SHELL.INK }}>
                {card.content}
              </p>
              {card.dissent ? (
                <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.5, color: SHELL.INK_MUTED }}>
                  {card.dissent}
                </p>
              ) : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {card.citations.map((citation) => (
                  <a
                    key={`${citation.sourceType}:${citation.id}:${citation.version ?? ''}`}
                    href={citation.url ?? '#'}
                    style={{
                      border: `1px solid ${SHELL.CARD_LINE}`,
                      borderRadius: 999,
                      padding: '5px 8px',
                      color: SHELL.INK,
                      textDecoration: 'none',
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      background: '#FFFFFF',
                    }}
                  >
                    {citation.id}{citation.version ? ` v${citation.version}` : ''}
                  </a>
                ))}
              </div>
              {card.oneClickAction ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => void shapeMoves()}
                    style={{
                      border: `1px solid ${SHELL.INK}`,
                      background: SHELL.INK,
                      color: SHELL.PAPER,
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontFamily: SHELL.MONO,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {card.oneClickAction.label}
                  </button>
                  {actionState ? <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>{actionState}</span> : null}
                </div>
              ) : null}
            </div>
          </details>
        ))}
        {feedbackEventId ? (
          <div
            aria-label="Sentinel answer feedback"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              background: SHELL.PAPER,
              padding: '8px 10px',
            }}
          >
            <SynthesisFeedbackWidget synthesisId={feedbackEventId} surface="sentinel" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
