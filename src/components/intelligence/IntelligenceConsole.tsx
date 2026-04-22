'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PATTERN_DEPTH_OVERLAYS } from '@/lib/intelligence/fix-spec-v3-content';
import type { GenomePatternDetail, GenomePatternSummary } from '@/lib/graph/types';

interface Props {
  patterns: GenomePatternSummary[];
  initialCode: string | null;
}

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';

type QueryResult = {
  cypher: string | null;
  explanation: string;
  result_shape?: string;
  rows: Array<Record<string, unknown>>;
};

function DetailSection({
  label,
  accent = MUTE,
  children,
}: {
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function IntelligenceConsole({ patterns, initialCode }: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(initialCode);
  const [detail, setDetail] = useState<GenomePatternDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const overlay = detail ? PATTERN_DEPTH_OVERLAYS[detail.code] ?? null : null;

  async function handleQuery(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = queryInput.trim();
    if (!q || querying) return;
    setQuerying(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/intelligence/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setQueryResult(data as QueryResult);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'query failed');
    } finally {
      setQuerying(false);
    }
  }

  const loadDetail = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intelligence/pattern/${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GenomePatternDetail;
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load failed');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCode) void loadDetail(selectedCode);
  }, [selectedCode, loadDetail]);

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: FONT_BODY }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 500 }}>Genome Intelligence</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', color: PURPLE, textTransform: 'uppercase', marginTop: 6 }}>
          {patterns.length} ACTIVE PATTERNS ACROSS PORTFOLIO
        </div>
      </div>

      {/* Free-text Genome query bar */}
      <form onSubmit={handleQuery} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          disabled={querying}
          placeholder='Ask the Genome — e.g., "which patterns chain from CDO transitions?"'
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: `0.5px solid ${PURPLE}4D`,
            borderRadius: 8,
            color: INK,
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={querying || !queryInput.trim()}
          style={{
            padding: '10px 18px',
            background: PURPLE,
            color: '#FFF',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            cursor: querying || !queryInput.trim() ? 'default' : 'pointer',
            opacity: querying || !queryInput.trim() ? 0.5 : 1,
          }}
        >
          {querying ? 'Querying…' : 'Ask'}
        </button>
      </form>

      {queryError && (
        <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: CORAL, fontSize: 12, fontFamily: FONT_MONO }}>
          {queryError}
        </div>
      )}

      {queryResult && (
        <div style={{ marginBottom: 16, padding: 14, background: 'rgba(155,109,255,0.05)', border: `0.5px solid ${PURPLE}33`, borderRadius: 10 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: PURPLE, textTransform: 'uppercase', marginBottom: 6 }}>
            Result · {queryResult.rows.length} row{queryResult.rows.length === 1 ? '' : 's'}
          </div>
          {queryResult.explanation && (
            <div style={{ fontSize: 13, color: INK, marginBottom: 10, lineHeight: 1.5 }}>{queryResult.explanation}</div>
          )}
          {queryResult.cypher && (
            <details style={{ marginBottom: 10 }}>
              <summary style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, cursor: 'pointer', letterSpacing: '0.1em' }}>CYPHER</summary>
              <pre style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE, margin: '8px 0 0', padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {queryResult.cypher}
              </pre>
            </details>
          )}
          {queryResult.rows.length === 0 ? (
            <div style={{ color: MUTE, fontSize: 12, fontStyle: 'italic' }}>No rows matched.</div>
          ) : (
            <pre style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK, margin: 0, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 6, overflowX: 'auto', maxHeight: 320 }}>
              {JSON.stringify(queryResult.rows, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left pane — pattern list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {patterns.map((p) => {
            const active = p.code === selectedCode;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setSelectedCode(p.code)}
                style={{
                  textAlign: 'left',
                  padding: 14,
                  background: active ? 'rgba(155,109,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `0.5px solid ${active ? 'rgba(155,109,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10,
                  color: INK,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: PURPLE, letterSpacing: '0.08em' }}>{p.code}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: p.failure_rate >= 0.85 ? CORAL : INK }}>
                    {Math.round(p.failure_rate * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 13, color: INK }}>{p.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {p.category} · {p.trigger_count} triggering
                </div>
              </button>
            );
          })}
        </div>

        {/* Right pane — detail */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12, padding: 20, minHeight: 400 }}>
          {loading && !detail && <div style={{ color: MUTE, fontSize: 13 }}>Loading…</div>}
          {error && (
            <div style={{ padding: 10, background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: CORAL, fontSize: 12, fontFamily: FONT_MONO }}>
              {error}
            </div>
          )}
          {detail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: PURPLE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {detail.code}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>{detail.name}</div>
                {overlay?.subtitle && (
                  <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: MUTE, maxWidth: 920 }}>
                    {overlay.subtitle}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: detail.failure_rate >= 0.85 ? 'rgba(255,107,74,0.1)' : 'rgba(155,109,255,0.1)',
                      border: `0.5px solid ${detail.failure_rate >= 0.85 ? 'rgba(255,107,74,0.3)' : 'rgba(155,109,255,0.3)'}`,
                      color: detail.failure_rate >= 0.85 ? CORAL : PURPLE,
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {Math.round(detail.failure_rate * 100)}% failure rate
                  </div>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.05)',
                      border: BORDER_SOFT,
                      color: MUTE,
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {detail.category}
                  </div>
                </div>
                {detail.description && (
                  <div style={{ marginTop: 12, fontSize: 13.5, color: INK, lineHeight: 1.55 }}>{detail.description}</div>
                )}
                {overlay?.tags && overlay.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {overlay.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: 'rgba(20,184,166,0.08)',
                          border: '0.5px solid rgba(20,184,166,0.28)',
                          color: TEAL,
                          fontFamily: FONT_MONO,
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {overlay?.failureMode && overlay.failureMode.length > 0 && (
                <DetailSection label="Failure Mode" accent={TEAL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {overlay.failureMode.map((paragraph, index) => (
                      <p key={index} style={{ margin: 0, color: INK, fontSize: 13.5, lineHeight: 1.65 }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.triggers && overlay.triggers.length > 0 && (
                <DetailSection label="What Triggers It" accent={CORAL}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.65 }}>
                    {overlay.triggers.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </DetailSection>
              )}

              {overlay?.telemetry && overlay.telemetry.length > 0 && (
                <DetailSection label="Telemetry To Watch" accent={AMBER}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {overlay.telemetry.map((item) => (
                      <div key={item.signal} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                        <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.signal}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>
                          SOURCE · {item.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.landscape && overlay.landscape.length > 0 && (
                <DetailSection label="Vendor / Capability Landscape" accent={PURPLE}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {overlay.landscape.map((item) => (
                      <div key={item.layer} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                        <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.layer}</div>
                        <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55, marginBottom: 8 }}>{item.note}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {item.vendors.map((vendor) => (
                            <span
                              key={vendor}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 999,
                                background: 'rgba(155,109,255,0.08)',
                                border: '0.5px solid rgba(155,109,255,0.24)',
                                color: INK,
                                fontSize: 11,
                              }}
                            >
                              {vendor}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.contradictions && overlay.contradictions.length > 0 && (
                <DetailSection label="Core Contradictions" accent={AMBER}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.65 }}>
                    {overlay.contradictions.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </DetailSection>
              )}

              <DetailSection label={`Engagements Triggering This Pattern · ${detail.engagements_triggering.length}`}>
                {detail.engagements_triggering.length === 0 ? (
                  <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>None in the portfolio yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detail.engagements_triggering.map((e) => (
                      <Link
                        key={e.graph_node_id}
                        href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
                        style={{
                          display: 'block',
                          padding: 12,
                          background: 'rgba(255,255,255,0.03)',
                          border: BORDER_SOFT,
                          borderRadius: 8,
                          textDecoration: 'none',
                          color: INK,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em', marginTop: 2 }}>
                          {e.industry} · Phase {e.current_phase}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </DetailSection>

              <DetailSection label="Chains To · Forward Risks">
                {detail.chains_to.length === 0 ? (
                  <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>None.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.chains_to.map((c) => (
                      <button
                        key={c.to_code}
                        type="button"
                        onClick={() => setSelectedCode(c.to_code)}
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: BORDER_SOFT,
                          borderRadius: 8,
                          color: INK,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: PURPLE }}>{detail.code} → {c.to_code}</span>
                        <span style={{ fontSize: 13, color: INK, marginLeft: 8 }}>{c.to_name}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE, marginLeft: 10 }}>
                          {Math.round(c.weight * 100)}% chain rate
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </DetailSection>

              <DetailSection label="Chains From · What Historically Leads Here">
                {detail.chains_from.length === 0 ? (
                  <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>None.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.chains_from.map((c) => (
                      <button
                        key={c.from_code}
                        type="button"
                        onClick={() => setSelectedCode(c.from_code)}
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: BORDER_SOFT,
                          borderRadius: 8,
                          color: INK,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: PURPLE }}>{c.from_code} → {detail.code}</span>
                        <span style={{ fontSize: 13, color: INK, marginLeft: 8 }}>{c.from_name}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE, marginLeft: 10 }}>
                          {Math.round(c.weight * 100)}% chain rate
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </DetailSection>

              {overlay?.historicalInstances && overlay.historicalInstances.length > 0 && (
                <DetailSection label="Historical Instances" accent={PURPLE}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {overlay.historicalInstances.map((item) => (
                      <div key={item.label} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                        <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.interventions && overlay.interventions.length > 0 && (
                <DetailSection label="Interventions That Usually Work" accent={TEAL}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {overlay.interventions.map((item) => (
                      <div key={item.title} style={{ padding: 12, background: 'rgba(20,184,166,0.05)', border: '0.5px solid rgba(20,184,166,0.22)', borderRadius: 8 }}>
                        <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: TEAL, letterSpacing: '0.08em' }}>{item.effectiveness}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>{item.horizon}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>{item.resourcing}</span>
                        </div>
                        <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.description}</div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.failureModes && overlay.failureModes.length > 0 && (
                <DetailSection label="How This Work Still Fails" accent={CORAL}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.65 }}>
                    {overlay.failureModes.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </DetailSection>
              )}

              {overlay?.evidenceBase && overlay.evidenceBase.length > 0 && (
                <DetailSection label="Evidence Base" accent={AMBER}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {overlay.evidenceBase.map((item) => (
                      <div key={item.label} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                        <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {overlay?.maestroRubric && (
                <DetailSection label="Maestro Rubric" accent={TEAL}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: TEAL, letterSpacing: '0.12em', marginBottom: 8 }}>PROBE FOR</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                        {overlay.maestroRubric.probeFor.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: AMBER, letterSpacing: '0.12em', marginBottom: 8 }}>CONFIRMING SIGNALS</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                        {overlay.maestroRubric.confirmingSignals.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 8 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.12em', marginBottom: 8 }}>RESOLUTION SIGNALS</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                        {overlay.maestroRubric.resolutionSignals.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </DetailSection>
              )}

              {overlay && (overlay.relatedTopics.length > 0 || overlay.relatedPatterns.length > 0) && (
                <DetailSection label="Related Paths" accent={TEAL}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {overlay.relatedTopics.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: 'block',
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(20,184,166,0.05)',
                          border: '0.5px solid rgba(20,184,166,0.22)',
                          color: INK,
                          textDecoration: 'none',
                        }}
                      >
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: TEAL, letterSpacing: '0.08em', marginBottom: 6 }}>TOPIC</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                      </Link>
                    ))}
                    {overlay.relatedPatterns.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setSelectedCode(item.code)}
                        style={{
                          textAlign: 'left',
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                          border: BORDER_SOFT,
                          color: INK,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.08em', marginBottom: 6 }}>
                          PATTERN · {item.code}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                      </button>
                    ))}
                  </div>
                </DetailSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
