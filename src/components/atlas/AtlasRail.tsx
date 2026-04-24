'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { AtlasChatPanel, type AtlasMessage } from '@/components/atlas/AtlasChatPanel';
import { AtlasSignalDetailPanel } from '@/components/atlas/AtlasSignalDetailPanel';
import type { AtlasChatResponse, AtlasObservation, AtlasPortfolioSummary, AtlasSignalSummary, AtlasSuggestion } from '@/lib/atlas/types';

const INK = '#F8FAFC';
const MUTE = '#CBD5E1';
const SOFT = '#94A3B8';
const TEAL = '#14B8A6';
const ATLAS = '#F59E0B';
const CRITICAL = '#DC2626';
const WARNING = '#D97706';
const INFO = '#2563EB';

interface AtlasRailPayload {
  portfolio: AtlasPortfolioSummary;
  observations: AtlasObservation[];
  signals: AtlasSignalSummary[];
}

function dollars(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function severityColor(severity: string | null | undefined): string {
  if (severity === 'critical') return CRITICAL;
  if (severity === 'warning') return WARNING;
  return INFO;
}

function topSummary(payload: AtlasRailPayload | null): string {
  if (!payload) return 'Atlas will load portfolio context once Tower data is available.';
  if (payload.observations[0]?.summary) return payload.observations[0].summary;
  const { activeUseCaseCount, criticalSignalCount, warningSignalCount, shadowAiSpendUsd } = payload.portfolio;
  const pieces: string[] = [];
  if (activeUseCaseCount > 0) pieces.push(`${activeUseCaseCount} active use case${activeUseCaseCount === 1 ? '' : 's'}`);
  if (criticalSignalCount > 0) pieces.push(`${criticalSignalCount} critical`);
  else if (warningSignalCount > 0) pieces.push(`${warningSignalCount} warning signal${warningSignalCount === 1 ? '' : 's'}`);
  else pieces.push('no critical signals open');
  if (shadowAiSpendUsd > 0) pieces.push(`${dollars(shadowAiSpendUsd)} shadow AI tracked`);
  return `Atlas is reading ${pieces.join(' · ')}.`;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; payload: AtlasRailPayload };

export function AtlasRail({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [expanded, setExpanded] = useState(true);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [messages, setMessages] = useState<AtlasMessage[]>([]);
  const [suggestions, setSuggestions] = useState<AtlasSuggestion[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const payload = state.kind === 'ready' ? state.payload : null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/v1/atlas/observations?clientId=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => ({}))) as Partial<AtlasRailPayload> & { error?: string; detail?: string };
        if (cancelled) return;
        if (!res.ok) {
          const msg = json.detail || json.error || `Atlas API returned ${res.status}`;
          setState({ kind: 'error', message: msg });
          return;
        }
        // Minimum viable signal · portfolio is guaranteed by the server-side
        // fallback (buildTowerViewModel). Observations / signals may legitimately
        // be empty arrays for quiet tenants — treat them as optional, not
        // blocking.
        if (!json.portfolio) {
          setState({ kind: 'error', message: 'Atlas observations endpoint returned no portfolio summary' });
          return;
        }
        const data: AtlasRailPayload = {
          portfolio: json.portfolio,
          observations: json.observations ?? [],
          signals: json.signals ?? [],
        };
        setState({ kind: 'ready', payload: data });
        setMessages([
          {
            id: 'atlas-opener',
            role: 'atlas',
            content: topSummary(data),
          },
        ]);
        const heroSignal = data.signals[0];
        setSuggestions([
          heroSignal ? { label: 'Open hero signal', value: `signal:${heroSignal.id}`, kind: 'signal' } : { label: 'Portfolio status', value: 'What is the portfolio look like?', kind: 'message' },
          { label: 'Peer position', value: 'How do we compare to peers?', kind: 'message' },
          { label: 'Program roster', value: 'Show active programs', kind: 'message' },
        ]);
      } catch (err) {
        if (!cancelled) {
          setState({ kind: 'error', message: (err as Error).message ?? 'Atlas request failed' });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function sendMessage(message: string, signalId?: string | null) {
    const trimmed = message.trim();
    if (!trimmed) return;

    setPending(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content: trimmed }]);

    const res = await fetch('/api/v1/atlas/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmed, threadId, signalId, clientId }),
    });
    const json = (await res.json().catch(() => ({}))) as Partial<AtlasChatResponse>;

    setPending(false);
    if (!res.ok || !json.response || !json.threadId) {
      setMessages((current) => [
        ...current,
        {
          id: `atlas-error-${Date.now()}`,
          role: 'atlas',
          content: 'Atlas could not answer that right now. Try the hero signal or peer-position prompts again.',
        },
      ]);
      return;
    }

    const responseText = json.response;
    setThreadId(json.threadId);
    setMessages((current) => [
      ...current,
      {
        id: `atlas-${Date.now()}`,
        role: 'atlas',
        content: responseText,
      },
    ]);
    setSuggestions(json.suggestions ?? []);
    if (json.signalId) {
      setActiveSignalId(json.signalId);
    }
  }

  function handleSuggestion(suggestion: AtlasSuggestion) {
    if (suggestion.kind === 'signal' && suggestion.value.startsWith('signal:')) {
      const signalId = suggestion.value.replace('signal:', '');
      setActiveSignalId(signalId);
      setDetailOpen(true);
      return;
    }
    if (suggestion.kind === 'link' && suggestion.href) {
      window.location.assign(suggestion.href);
      return;
    }
    startTransition(() => {
      void sendMessage(suggestion.value);
    });
  }

  return (
    <>
      <aside
        style={{
          position: 'sticky',
          top: 24,
          alignSelf: 'start',
          borderRadius: 24,
          border: '0.5px solid rgba(148,163,184,0.22)',
          background: 'linear-gradient(180deg, rgba(30,41,59,0.98), rgba(20,32,52,0.98))',
          boxShadow: '0 24px 60px rgba(2,6,23,0.34)',
          padding: expanded ? 18 : 12,
          display: 'grid',
          gap: 16,
          minHeight: expanded ? 640 : 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: ATLAS,
              }}
            >
              Atlas · Tower
            </div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: INK }}>{clientName}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: state.kind === 'error' ? CRITICAL : SOFT }}>
              {state.kind === 'ready'
                ? `${state.payload.portfolio.activeUseCaseCount} active use cases`
                : state.kind === 'error'
                  ? 'Atlas unavailable'
                  : 'Loading portfolio context…'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            style={{
              padding: '8px 10px',
              borderRadius: 999,
              border: '0.5px solid rgba(148,163,184,0.22)',
              background: 'transparent',
              color: MUTE,
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Collapse' : 'Open'}
          </button>
        </div>

        {expanded && (
          <>
            <div
              style={{
                padding: 16,
                borderRadius: 20,
                border: '0.5px solid rgba(245,158,11,0.24)',
                background: 'linear-gradient(180deg, rgba(245,158,11,0.14), rgba(15,23,42,0.42))',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.6, color: INK }}>
                {state.kind === 'error'
                  ? `Atlas can't reach the observations endpoint right now · ${state.message}. Tower tiles on the left are server-rendered and still accurate.`
                  : topSummary(payload)}
              </div>
              {payload?.signals[0] && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSignalId(payload.signals[0].id);
                    setDetailOpen(true);
                  }}
                  style={{
                    justifySelf: 'start',
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.96), rgba(37,99,235,0.92))',
                    color: '#03121A',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Open hero signal
                </button>
              )}
            </div>

            {payload?.signals && payload.signals.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEAL,
                  }}
                >
                  Signals
                </div>
                {payload.signals.map((signal) => (
                  <button
                    key={signal.id}
                    type="button"
                    onClick={() => {
                      setActiveSignalId(signal.id);
                      setDetailOpen(true);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: 14,
                      borderRadius: 18,
                      border: '0.5px solid rgba(148,163,184,0.18)',
                      background: 'rgba(15,23,42,0.34)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: severityColor(signal.severity),
                        }}
                      >
                        {signal.severity}
                      </div>
                      <div style={{ fontSize: 11, color: SOFT }}>{dollars(signal.impactUsd)}</div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: INK }}>{signal.headline}</div>
                    {signal.cohortLabel && <div style={{ marginTop: 6, fontSize: 11, color: MUTE }}>{signal.cohortLabel}</div>}
                  </button>
                ))}
              </div>
            )}

            {payload?.portfolio && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  border: '0.5px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.34)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEAL,
                  }}
                >
                  Quick read
                </div>
                <div style={{ fontSize: 13, color: MUTE, lineHeight: 1.5 }}>
                  Shadow AI {dollars(payload.portfolio.shadowAiSpendUsd)} · realized value {dollars(payload.portfolio.realizedValueUsd)} · trustworthiness {payload.portfolio.averageTrustworthinessScore ?? 'n/a'}
                </div>
                <Link
                  href="/engagements"
                  style={{
                    justifySelf: 'start',
                    fontSize: 12,
                    color: TEAL,
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Open Programs →
                </Link>
              </div>
            )}

            <AtlasChatPanel
              messages={messages}
              pending={pending}
              input={input}
              onInputChange={setInput}
              onSubmit={() => {
                const message = input;
                setInput('');
                void sendMessage(message, activeSignalId);
              }}
              suggestions={suggestions}
              onSuggestion={handleSuggestion}
            />
          </>
        )}
      </aside>

      <AtlasSignalDetailPanel
        clientId={clientId}
        signalId={activeSignalId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAskAtlas={(message) => {
          setDetailOpen(false);
          void sendMessage(message, activeSignalId);
        }}
      />
    </>
  );
}
