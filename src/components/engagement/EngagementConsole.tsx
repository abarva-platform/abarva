'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { EngagementRow } from '@/lib/db/engagement';
import type { PersonRow } from '@/lib/db/person';
import type { TurnRow } from '@/lib/db/turn';
import type { ActivePattern, PeerDecisionSummary, ChainedPattern } from '@/lib/graph/types';
import type { VipGreetingData } from '@/lib/agent/prompts/_shared/user-context';
import { ChoiceChips, type Choice } from './ChoiceChips';
import { renderWithCitations } from './renderWithCitations';
import { CitationPill } from './CitationPill';

// Extract unique citations from agent turn text so we can render a source
// pills row below the response — visible provenance by default, Target
// Trend Brain pattern.
const CITATION_EXTRACT_RE = /\[([a-z][a-z0-9_]{2,})(?:\s+§\s+([^\]]+?)|,\s+page\s+(\d+))?\]/g;
function extractCitations(text: string): Array<{ key: string; section?: string; page?: string }> {
  const seen = new Set<string>();
  const out: Array<{ key: string; section?: string; page?: string }> = [];
  CITATION_EXTRACT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CITATION_EXTRACT_RE.exec(text)) !== null) {
    const key = m[1];
    const section = m[2];
    const page = m[3];
    const sig = `${key}|${section ?? ''}|${page ?? ''}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push({ key, section, page });
  }
  return out;
}
import { TraceDrawer } from './TraceDrawer';

type LocalTurn = TurnRow & { streaming?: boolean; errored?: boolean };

interface Deliverable {
  type: string;
  phase: number;
  generated_at: string;
  content: Record<string, unknown>;
}

interface AssignedTopic {
  key: string;
  title: string;
  isPrimary: boolean;
}

interface TopContradiction {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  one_liner: string | null;
  monthly_total_usd: number | null;
  eliminable_usd_annual: number | null;
  owner_named: boolean | null;
}

interface ActivityEvent {
  kind: 'turn' | 'gate' | 'deliverable';
  label: string;
  detail: string;
  at: string;
}

interface Props {
  engagement: EngagementRow;
  sponsor: PersonRow | null;
  turns: TurnRow[];
  activePatterns: ActivePattern[];
  peerDecisions: PeerDecisionSummary[];
  chainedPatterns: ChainedPattern[];
  deliverables?: Deliverable[];
  vipGreeting?: VipGreetingData | null;
  assignedTopics?: AssignedTopic[];
  topContradictions?: TopContradiction[];
  activityEvents?: ActivityEvent[];
}

export function EngagementConsole({
  engagement, sponsor, turns, activePatterns, peerDecisions, chainedPatterns, deliverables, vipGreeting, assignedTopics, topContradictions, activityEvents,
}: Props) {
  const router = useRouter();
  const phaseLabels = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];
  const deliverablesList = deliverables ?? [];

  const [messages, setMessages] = useState<LocalTurn[]>(turns);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateToast, setGateToast] = useState<{ phase: number; newPhase: number } | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [choicesForTurnId, setChoicesForTurnId] = useState<string | null>(null);
  const [composerPlaceholder, setComposerPlaceholder] = useState('Your reply…');
  const [traceTurnId, setTraceTurnId] = useState<string | null>(null);
  const [stages, setStages] = useState<Array<{ label: string; detail?: string }>>([]);
  const composerRef = useRef<HTMLInputElement>(null);
  const localIdRef = useRef(0);
  const nextLocalId = () => `local-${Date.now()}-${++localIdRef.current}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    await sendTurn(text);
  }

  async function sendTurn(text: string) {
    if (!text || isStreaming) return;
    setInput('');
    setComposerPlaceholder('Your reply…');
    setChoices([]);
    setChoicesForTurnId(null);
    setError(null);
    setStages([]);
    setIsStreaming(true);

    const now = new Date().toISOString();
    const userTurn: LocalTurn = {
      id: nextLocalId(),
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'user',
      text,
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
    };
    const agentTurnId = nextLocalId();
    const agentTurn: LocalTurn = {
      id: agentTurnId,
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'agent',
      text: '',
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
      streaming: true,
    };
    setMessages(prev => [...prev, userTurn, agentTurn]);

    try {
      const res = await fetch(`/api/engage/${encodeURIComponent(engagement.graph_node_id)}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: text }),
      });
      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => '');
        throw new Error(`${res.status} ${body || res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let evt: { type: string; text?: string; turnId?: string; error?: string; label?: string; detail?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === 'stage' && typeof evt.label === 'string') {
            const stageLabel = evt.label;
            const stageDetail = evt.detail;
            setStages((prev) => [...prev, { label: stageLabel, detail: stageDetail }]);
          } else if (evt.type === 'delta' && typeof evt.text === 'string') {
            // Clear stages once real content starts streaming.
            setStages([]);
            const delta = evt.text;
            setMessages(prev =>
              prev.map(m => (m.id === agentTurnId ? { ...m, text: m.text + delta } : m)),
            );
          } else if (evt.type === 'done') {
            setMessages(prev =>
              prev.map(m =>
                m.id === agentTurnId
                  ? { ...m, id: evt.turnId ?? m.id, streaming: false }
                  : m,
              ),
            );
          } else if (evt.type === 'gate_approved') {
            const raw = evt as unknown as { phase?: number; new_phase?: number };
            const phase = typeof raw.phase === 'number' ? raw.phase : engagement.current_phase;
            const newPhase = typeof raw.new_phase === 'number' ? raw.new_phase : phase + 1;
            setGateToast({ phase, newPhase });
            setTimeout(() => router.refresh(), 1800);
          } else if (evt.type === 'phase_opener') {
            // Server has advanced the phase and pre-seeded the next-phase
            // opener as an agent turn. Render it inline so the console doesn't
            // feel blank after gate approval.
            const raw = evt as unknown as { phase?: number; turnId?: string; text?: string };
            if (typeof raw.text === 'string' && raw.text.length > 0) {
              const openerId = raw.turnId ?? `opener-${Date.now()}`;
              const openerPhase = typeof raw.phase === 'number' ? raw.phase : engagement.current_phase + 1;
              const openerTurn: LocalTurn = {
                id: openerId,
                engagement_id: engagement.id,
                phase: openerPhase,
                sender: 'agent',
                text: raw.text,
                mode_label: null,
                retrieved_refs: {},
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, openerTurn]);
            }
          } else if (evt.type === 'choices') {
            const raw = evt as unknown as { choices?: Choice[] };
            if (Array.isArray(raw.choices) && raw.choices.length > 0) {
              setChoices(raw.choices);
              setChoicesForTurnId(agentTurnId);
              // Also strip any <choices> that may have leaked into the visible bubble
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentTurnId
                    ? { ...m, text: m.text.replace(/<choices>[\s\S]*?<\/choices>/g, '').trim() }
                    : m,
                ),
              );
            }
          } else if (evt.type === 'error') {
            throw new Error(evt.error ?? 'stream error');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      setError(msg);
      setMessages(prev =>
        prev.map(m => (m.id === agentTurnId ? { ...m, streaming: false, errored: true } : m)),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F5F0', fontFamily: 'DM Sans, -apple-system, sans-serif', position: 'relative' }}>
      {gateToast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 50,
          padding: '12px 18px',
          background: 'rgba(45,212,200,0.12)',
          border: '0.5px solid rgba(45,212,200,0.4)',
          borderRadius: 10,
          color: '#2DD4C8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          letterSpacing: '0.08em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          ✓ Phase {gateToast.phase} approved · advancing to Phase {gateToast.newPhase}…
        </div>
      )}
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: 'Georgia, serif', marginBottom: 4 }}>
          <span style={{ color: '#F5F5F0', fontSize: 17, fontWeight: 800 }}>Abar</span>
          <span style={{ color: '#2DD4C8', fontSize: 23, fontWeight: 900 }}>Va</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2DD4C8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {engagement.name} · {sponsor?.name ?? 'unassigned'} · {sponsor?.role ?? '—'}
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {phaseLabels.map((label, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: i === engagement.current_phase ? 'rgba(45,212,200,0.12)' : 'rgba(255,255,255,0.03)',
              border: `0.5px solid ${i === engagement.current_phase ? '#2DD4C8' : 'rgba(255,255,255,0.12)'}`,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: i === engagement.current_phase ? '#2DD4C8' : 'rgba(245,245,240,0.72)', letterSpacing: '0.14em', marginBottom: 4 }}>
                PHASE {i}
              </div>
              <div style={{ fontSize: 13, color: i === engagement.current_phase ? '#F5F5F0' : 'rgba(245,245,240,0.72)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Three-column layout: conversation placeholder | context sidebar */}
      <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Conversation + composer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,245,240,0.72)', textTransform: 'uppercase', marginBottom: 16 }}>
            Conversation · {messages.length} turns
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              vipGreeting ? (
                <div
                  style={{
                    padding: 20,
                    background: 'linear-gradient(135deg, rgba(45,212,200,0.06) 0%, rgba(155,109,255,0.04) 100%)',
                    border: '0.5px solid rgba(45,212,200,0.25)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      color: '#2DD4C8',
                      letterSpacing: '0.14em',
                      marginBottom: 10,
                    }}
                  >
                    NEXUS · FIRST TURN
                  </div>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 20,
                      color: '#F5F5F0',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.35,
                      marginBottom: 10,
                    }}
                  >
                    Good to meet you, {vipGreeting.firstName}.
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(245,245,240,0.82)', lineHeight: 1.55, marginBottom: 14 }}>
                    {vipGreeting.currentTitle && vipGreeting.currentCompany
                      ? `I know you're ${vipGreeting.currentTitle.toLowerCase().startsWith('executive') ? 'the' : ''} ${vipGreeting.currentTitle} at ${vipGreeting.currentCompany}. `
                      : ''}
                    Before we dig in, here's what I've already pulled that might be relevant —
                    push back hard if I've mis-prioritized.
                  </div>
                  {vipGreeting.emphasizeTopics.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 9,
                          color: 'rgba(245,245,240,0.6)',
                          letterSpacing: '0.14em',
                          marginBottom: 6,
                        }}
                      >
                        WHAT I'LL EMPHASIZE
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(245,245,240,0.88)', fontSize: 13.5, lineHeight: 1.6 }}>
                        {vipGreeting.emphasizeTopics.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {vipGreeting.currentInitiatives.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 9,
                          color: 'rgba(245,245,240,0.6)',
                          letterSpacing: '0.14em',
                          marginBottom: 6,
                        }}
                      >
                        GIVEN YOUR CURRENT FOCUS
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(245,245,240,0.72)', fontSize: 12.5, lineHeight: 1.6 }}>
                        {vipGreeting.currentInitiatives.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: 'rgba(245,245,240,0.65)',
                      fontStyle: 'italic',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    Where should we start?
                  </div>
                </div>
              ) : (
                <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 14, fontStyle: 'italic' }}>
                  No turns yet. Say something to Nexus.
                </div>
              )
            ) : (
              messages.map(t => (
                <div key={t.id}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: t.sender === 'agent' ? 'rgba(45,212,200,0.05)' : 'rgba(255,255,255,0.06)',
                    border: `0.5px solid ${t.errored ? 'rgba(255,107,74,0.5)' : t.sender === 'agent' ? 'rgba(45,212,200,0.2)' : 'rgba(255,255,255,0.12)'}`,
                    opacity: t.streaming && !t.text ? 0.6 : 1,
                  }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: t.sender === 'agent' ? '#2DD4C8' : 'rgba(245,245,240,0.72)', letterSpacing: '0.14em', marginBottom: 4 }}>
                      {t.sender === 'agent' ? `NEXUS${t.mode_label ? ' · ' + t.mode_label : ''}${t.streaming ? ' · streaming' : ''}` : 'YOU'}
                    </div>
                    {t.sender === 'agent' && t.streaming && !t.text && stages.length > 0 && (
                      <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {stages.map((s, i) => (
                          <div key={i} style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(245,245,240,0.55)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.01em' }}>
                            <span style={{ color: '#2DD4C8', marginRight: 6, fontFamily: 'JetBrains Mono, monospace' }}>▸</span>
                            {s.label}
                            {s.detail && <span style={{ color: 'rgba(245,245,240,0.4)', marginLeft: 6 }}>· {s.detail}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {t.sender === 'agent' ? renderWithCitations(t.text) : t.text}
                      {t.streaming && <span style={{ color: '#2DD4C8', opacity: 0.7 }}>▊</span>}
                    </div>
                    {t.sender === 'agent' && !t.streaming && (() => {
                      const cites = extractCitations(t.text);
                      if (cites.length === 0) return null;
                      return (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: '0.5px solid rgba(45,212,200,0.12)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 9,
                              color: 'rgba(245,245,240,0.55)',
                              letterSpacing: '0.14em',
                              marginRight: 4,
                            }}
                          >
                            SOURCES · {cites.length}
                          </span>
                          {cites.map((c, i) => (
                            <CitationPill key={`${c.key}-${i}`} sourceKey={c.key} section={c.section} page={c.page} />
                          ))}
                        </div>
                      );
                    })()}
                    {t.sender === 'agent' && !t.streaming && t.id && (
                      <button
                        type="button"
                        onClick={() => setTraceTurnId(t.id)}
                        title="Why did Nexus say this?"
                        style={{
                          marginTop: 8,
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(245,245,240,0.55)',
                          fontSize: 13,
                          fontFamily: 'JetBrains Mono, monospace',
                          cursor: 'pointer',
                          padding: 0,
                          letterSpacing: '0.08em',
                        }}
                      >
                        ◎ trace
                      </button>
                    )}
                  </div>
                  {t.id === choicesForTurnId && choices.length > 0 && (
                    <ChoiceChips
                      choices={choices}
                      disabled={isStreaming}
                      onPick={(value) => { void sendTurn(value); }}
                      onFreeType={(placeholder) => {
                        setComposerPlaceholder(placeholder);
                        setChoices([]);
                        composerRef.current?.focus();
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: '#FF6B4A', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input
              ref={composerRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder={composerPlaceholder}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#F5F5F0', fontFamily: 'inherit', fontSize: 14 }}
            />
            <button type="submit" disabled={isStreaming || !input.trim()} style={{ padding: '10px 18px', background: '#2DD4C8', color: '#0A0A0A', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: isStreaming || !input.trim() ? 'default' : 'pointer', opacity: isStreaming || !input.trim() ? 0.5 : 1 }}>
              {isStreaming ? 'Nexus...' : 'Send'}
            </button>
          </form>
        </div>

        {/* Context sidebar — what the agent knows but doesn't flex */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Sponsor */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#2DD4C8', textTransform: 'uppercase', marginBottom: 8 }}>
              Sponsor
            </div>
            {sponsor ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{sponsor.name}</div>
                <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12 }}>{sponsor.role} · {sponsor.organization}</div>
                <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  {sponsor.familiarity.replace(/_/g, ' ')}
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12 }}>No sponsor linked</div>
            )}
          </div>

          {/* Active patterns */}
          <div style={{ background: 'rgba(155,109,255,0.04)', border: '0.5px solid rgba(155,109,255,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#9B6DFF', textTransform: 'uppercase', marginBottom: 8 }}>
              Active patterns · {activePatterns.length}
            </div>
            {activePatterns.length === 0 ? (
              <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12 }}>None observed</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activePatterns.map(p => (
                  <div key={p.code} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: '#9B6DFF', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.code}</span>
                    <span style={{ color: '#F5F5F0' }}> {p.name}</span>
                    <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 11 }}>
                      {(p.failure_rate * 100).toFixed(0)}% historical failure rate · {p.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contradictions · top 3 for this engagement's client, so-what framed */}
          {topContradictions && topContradictions.length > 0 && (
            <div style={{ background: 'rgba(245,197,74,0.04)', border: '0.5px solid rgba(245,197,74,0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#F5C54A', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Contradictions · {topContradictions.length}</span>
                <a href="/tower" style={{ color: 'rgba(245,245,240,0.55)', textDecoration: 'none', letterSpacing: '0.1em' }}>ALL →</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topContradictions.map((c) => {
                  const sev = c.severity === 'high' ? '#FF6B4A' : c.severity === 'medium' ? '#F5C54A' : 'rgba(245,245,240,0.72)';
                  const monthly = c.monthly_total_usd != null && c.monthly_total_usd >= 1000
                    ? c.monthly_total_usd >= 1_000_000
                      ? `$${(c.monthly_total_usd / 1_000_000).toFixed(1)}M/mo`
                      : `$${Math.round(c.monthly_total_usd / 1_000)}K/mo`
                    : null;
                  const eliminable = c.eliminable_usd_annual != null && c.eliminable_usd_annual >= 1000
                    ? c.eliminable_usd_annual >= 1_000_000
                      ? `$${(c.eliminable_usd_annual / 1_000_000).toFixed(1)}M/yr eliminable`
                      : `$${Math.round(c.eliminable_usd_annual / 1_000)}K/yr eliminable`
                    : null;
                  return (
                    <div key={c.id} style={{ padding: '8px 10px', borderLeft: `2px solid ${sev}`, background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: sev, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {c.severity}
                        {monthly && <span style={{ color: 'rgba(245,245,240,0.72)', marginLeft: 6 }}>· {monthly}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#F5F5F0', lineHeight: 1.4, fontWeight: 500 }}>
                        {c.one_liner ?? c.description.slice(0, 120)}
                      </div>
                      {(eliminable || c.owner_named === false) && (
                        <div style={{ display: 'flex', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.55)', marginTop: 4, letterSpacing: '0.04em' }}>
                          {eliminable && <span style={{ color: sev }}>{eliminable}</span>}
                          {c.owner_named === false && <span style={{ color: '#FF6B4A' }}>no owner</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Peer decisions */}
          <div style={{ background: 'rgba(255,107,74,0.04)', border: '0.5px solid rgba(255,107,74,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#FF6B4A', textTransform: 'uppercase', marginBottom: 8 }}>
              Peer decisions · phase {engagement.current_phase}
            </div>
            {peerDecisions.length === 0 ? (
              <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12 }}>No comparable decisions at this phase yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {peerDecisions.map(d => (
                  <div key={d.choice} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ color: '#F5F5F0' }}>{d.choice.replace(/_/g, ' ')}</div>
                    <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 11 }}>
                      {d.engagement_count} engagements · avg ${Math.round(d.avg_outcome_usd / 1000000)}M outcome
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topics · /engagements/[id]/topics deep-link. Shows assigned
              topics inline per product-map spec Phase 5. */}
          {(() => {
            const topics = assignedTopics ?? [];
            const primaryCount = topics.filter((t) => t.isPrimary).length;
            const secondaryCount = topics.length - primaryCount;
            return (
              <a
                href={`/engagements/${encodeURIComponent(engagement.graph_node_id)}/topics`}
                style={{
                  display: 'block',
                  background: 'rgba(155,109,255,0.04)',
                  border: '0.5px solid rgba(155,109,255,0.2)',
                  borderRadius: 10,
                  padding: 14,
                  textDecoration: 'none',
                  color: '#F5F5F0',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: '#9B6DFF',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Topics · {topics.length} assigned</span>
                  {topics.length > 0 && (
                    <span>{primaryCount} primary · {secondaryCount} secondary</span>
                  )}
                </div>
                {topics.length === 0 ? (
                  <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12, lineHeight: 1.4 }}>
                    Assign a topic to carry playbook intelligence, diagnostic questions, and vendor landscape into every Nexus turn →
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {topics.slice(0, 4).map((t) => (
                      <div key={t.key} style={{ fontSize: 13, color: '#F5F5F0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span>{t.title}</span>
                        {t.isPrimary && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9B6DFF', letterSpacing: '0.1em' }}>
                            PRIMARY
                          </span>
                        )}
                      </div>
                    ))}
                    {topics.length > 4 && (
                      <div style={{ fontSize: 11, color: 'rgba(245,245,240,0.6)', fontStyle: 'italic' }}>
                        + {topics.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </a>
            );
          })()}

          {/* Deliverables · links to browser */}
          <a
            href={`/engagements/${encodeURIComponent(engagement.graph_node_id)}/deliverables`}
            style={{
              display: 'block',
              background: 'rgba(45,212,200,0.04)',
              border: '0.5px solid rgba(45,212,200,0.2)',
              borderRadius: 10,
              padding: 14,
              textDecoration: 'none',
              color: '#F5F5F0',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#2DD4C8', textTransform: 'uppercase', marginBottom: 8 }}>
              Deliverables · {deliverablesList.length}
            </div>
            {deliverablesList.length === 0 ? (
              <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 12 }}>None yet. Generated when a phase gate is approved, or on-demand via Pack L generator.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {deliverablesList.map((d) => (
                  <div key={`${d.type}-${d.phase}`} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: '#2DD4C8', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>PHASE {d.phase}</span>
                    <span style={{ color: '#F5F5F0' }}> · {d.type.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
                    <div style={{ color: 'rgba(245,245,240,0.72)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(d.generated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </a>

          {/* Quick links · charter + turns */}
          <div style={{ display: 'flex', gap: 6 }}>
            <a
              href={`/engagements/${encodeURIComponent(engagement.graph_node_id)}/charter`}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 10px',
                textDecoration: 'none',
                color: '#F5F5F0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.12em',
                textAlign: 'center',
              }}
            >
              CHARTER →
            </a>
            <a
              href={`/engagements/${encodeURIComponent(engagement.graph_node_id)}/turns`}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 10px',
                textDecoration: 'none',
                color: '#F5F5F0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.12em',
                textAlign: 'center',
              }}
            >
              TURNS →
            </a>
          </div>

          {/* Chained patterns */}
          {chainedPatterns.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,245,240,0.72)', textTransform: 'uppercase', marginBottom: 8 }}>
                Chained risks
              </div>
              {chainedPatterns.map(c => (
                <div key={`${c.from_code}-${c.to_code}`} style={{ fontSize: 11, lineHeight: 1.5, color: '#C9C6BD' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.from_code} → {c.to_code}</span>
                  <span style={{ color: 'rgba(245,245,240,0.72)' }}> · {(c.weight * 100).toFixed(0)}% chain rate</span>
                </div>
              ))}
            </div>
          )}

          {/* Activity pulse · last 5 events · turns + gates + deliverable drafts */}
          {activityEvents && activityEvents.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,245,240,0.72)', textTransform: 'uppercase', marginBottom: 10 }}>
                Activity pulse · last {activityEvents.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activityEvents.map((e, i) => {
                  const color = e.kind === 'turn' ? '#2DD4C8' : e.kind === 'gate' ? '#3FB27F' : '#9B6DFF';
                  const glyph = e.kind === 'turn' ? '▸' : e.kind === 'gate' ? '●' : '◆';
                  const then = new Date(e.at).getTime();
                  const diffMs = Date.now() - then;
                  const m = Math.floor(diffMs / 60000);
                  const rel = m < 60 ? `${m}m ago` : m < 60 * 24 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / (60 * 24))}d ago`;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, width: 10, flexShrink: 0 }}>{glyph}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, color: '#F5F5F0', fontWeight: 500, lineHeight: 1.3 }}>{e.label}</div>
                        <div style={{ fontSize: 10.5, color: 'rgba(245,245,240,0.55)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {e.detail}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.55)', flexShrink: 0, whiteSpace: 'nowrap' }}>{rel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {traceTurnId && (
        <TraceDrawer turnId={traceTurnId} open={true} onClose={() => setTraceTurnId(null)} />
      )}
    </div>
  );
}
