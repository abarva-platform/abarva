'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FoundationReadout as FoundationReadoutData, NexusTurnData, PortfolioSignal } from '@/lib/intelligence/types';
import { useIntelligenceState } from '@/hooks/useIntelligenceState';
import { useNexusStream, type UploadedAttachment } from '@/hooks/useNexusStream';
import { FoundationReadout } from './FoundationReadout';
import { FoundationStrip } from './FoundationStrip';
import { AskIntelligenceBar } from './AskIntelligenceBar';
import { PortfolioSignalFeed } from './PortfolioSignalFeed';
import { PortfolioSignalDetail } from './PortfolioSignalDetail';
import { FoundationBrowser } from './FoundationBrowser';
import { ThreadRail } from './ThreadRail';
import { NextMovesFloater } from './NextMovesFloater';
import { NexusConversation } from '@/components/nexus/NexusConversation';

type BrowserResponse = {
  layer: 'L1' | 'L2' | 'L3' | 'L4';
  activeLayer: 'L1' | 'L2' | 'L3' | 'L4';
  tiles: Array<{ id: string; label: string; count: number; active: boolean }>;
  items: Array<{ id: string; title: string; subtitle: string | null; detail: string | null; href: string | null; sourceUrl: string | null }>;
};

async function fetchJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, { credentials: 'include' });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, data: body as T };
}

function buildUserTurn(query: string, threadId?: string | null): NexusTurnData {
  return {
    id: `local-user-${Date.now()}`,
    threadId: threadId ?? 'pending',
    index: -1,
    role: 'user',
    mode: null,
    format: null,
    confidence: null,
    payload: { answer: query },
    sources: [],
    capabilitiesActive: [],
    counterOfTurnId: null,
    contradictionSelfCheck: null,
    personaKey: null,
    latencyMs: null,
    firstTokenMs: null,
    createdAt: new Date().toISOString(),
  };
}

function programFitFromTurns(turns: NexusTurnData[]) {
  const lastAssistant = [...turns].reverse().find((turn) => turn.role === 'nexus');
  if (!lastAssistant) {
    return { score: 'low' as const, dotsFilled: 1, preloadablePhases: 0, rationale: 'Ask one grounded question and Nexus will start sizing whether this wants a scoped program.' };
  }
  if (lastAssistant.mode === 'pivot') {
    return { score: 'high' as const, dotsFilled: 4, preloadablePhases: 3, rationale: 'This thread is already behaving like structured decision work, not casual research.' };
  }
  if (lastAssistant.mode === 'grounded') {
    return { score: 'medium' as const, dotsFilled: 3, preloadablePhases: 2, rationale: 'Decision framing is present and the conversation is accumulating enough context to preload the next program phases.' };
  }
  return { score: 'low' as const, dotsFilled: 1, preloadablePhases: 1, rationale: 'This still reads as research-first. Keep exploring unless the scope needs ownership and sequencing.' };
}

export function IntelligenceWorkspace({
  initialQuery,
  initialThreadId,
  routeMode,
  basePath = '/intelligence',
  programTargetPath = '/programs/new',
}: {
  initialQuery: string;
  initialThreadId: string | null;
  routeMode: 'landing' | 'thread';
  basePath?: string;
  programTargetPath?: string;
}) {
  const router = useRouter();
  const [foundation, setFoundation] = useState<FoundationReadoutData | null>(null);
  const [signals, setSignals] = useState<PortfolioSignal[]>([]);
  const [browser, setBrowser] = useState<BrowserResponse | null>(null);
  const [turns, setTurns] = useState<NexusTurnData[]>([]);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [browserLayer, setBrowserLayer] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
  const [browserFacet, setBrowserFacet] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'ready' | 'unauthenticated' | 'no_client'>('ready');
  const [loadingThread, setLoadingThread] = useState(false);
  const initialQueryFired = useRef(false);
  const overviewRef = useRef<HTMLElement | null>(null);
  const layersRef = useRef<HTMLElement | null>(null);
  const patternsRef = useRef<HTMLElement | null>(null);
  const vendorsRef = useRef<HTMLElement | null>(null);
  const contradictionsRef = useRef<HTMLElement | null>(null);
  const askRef = useRef<HTMLElement | null>(null);

  const {
    isStreaming,
    streamState,
    error: streamError,
    submitQuery,
    applyPersona,
    requestCounter,
    uploadFile,
  } = useNexusStream();

  const { state, enterDeepDive, reset } = useIntelligenceState(turns, {
    isStreaming,
    forceState: routeMode === 'thread' ? 'C' : null,
  });

  const selectedSignal = useMemo(
    () => signals.find((signal) => signal.id === selectedSignalId) ?? null,
    [selectedSignalId, signals],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchJson<FoundationReadoutData>('/api/v1/intelligence/foundation'),
      fetchJson<{ signals: PortfolioSignal[] }>('/api/v1/intelligence/signals?limit=20&severity_gte=info'),
    ]).then(([foundationRes, signalsRes]) => {
      if (cancelled) return;
      if (!foundationRes.ok) {
        if (foundationRes.status === 401) setAuthState('unauthenticated');
        else if (foundationRes.status === 403) setAuthState('no_client');
        else setPageError(String(foundationRes.body.error ?? 'Failed to load foundation.'));
        return;
      }
      setFoundation(foundationRes.data);

      if (signalsRes.ok) {
        setSignals(signalsRes.data.signals);
      }
    }).catch((error: unknown) => {
      if (cancelled) return;
      setPageError(error instanceof Error ? error.message : 'Failed to load the Intelligence surface.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchJson<BrowserResponse>(`/api/v1/intelligence/foundation/browse?layer=${browserLayer}${browserFacet ? `&facet=${encodeURIComponent(browserFacet)}` : ''}`)
      .then((result) => {
        if (cancelled || !result.ok) return;
        setBrowser(result.data);
      })
      .catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, [browserFacet, browserLayer]);

  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    setLoadingThread(true);
    fetchJson<{ thread: { id: string }; turns: NexusTurnData[] }>(`/api/v1/threads/${threadId}`)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setPageError(String(result.body.error ?? 'Unable to load the thread.'));
          return;
        }
        setTurns(result.data.turns.map((turn, index) => ({ ...turn, index })));
        setSelectedTurnId(result.data.turns[result.data.turns.length - 1]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    if (!initialQuery || initialQueryFired.current || routeMode === 'thread') return;
    if (authState !== 'ready') return;
    initialQueryFired.current = true;
    void handleSubmitQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, authState, routeMode]);

  const activeTurnId = selectedTurnId ?? turns[turns.length - 1]?.id ?? null;
  const programFit = useMemo(() => programFitFromTurns(turns), [turns]);
  const tenantLabel = foundation?.client.name ?? 'this account';
  const suggestedQueries = useMemo(() => {
    const industry = (foundation?.client.industry ?? '').toLowerCase();
    if (industry.includes('health')) {
      return [
        `What are health systems like ${tenantLabel} doing on ambient documentation?`,
        `Abridge vs DAX for ${tenantLabel}`,
        `What would our CFO push back on here?`,
      ];
    }
    if (industry.includes('retail')) {
      return [
        `What are retailers like ${tenantLabel} doing on AI personalization?`,
        `Where is vendor overlap hurting margin or speed?`,
        `What would the COO challenge in this story?`,
      ];
    }
    if (industry.includes('financial') || industry.includes('bank')) {
      return [
        `What are peers like ${tenantLabel} doing on AI governance and operating risk?`,
        `Where is vendor overlap creating compliance drag?`,
        `What would the CFO or CRO push back on first?`,
      ];
    }
    return [
      `What is moving across ${tenantLabel} right now?`,
      'Which contradictions matter most?',
      'Where would leadership push back first?',
    ];
  }, [foundation, tenantLabel]);
  const askPlaceholder = useMemo(() => {
    const industry = (foundation?.client.industry ?? '').toLowerCase();
    if (industry.includes('health')) return 'What are health systems like us doing on ambient documentation?';
    if (industry.includes('retail')) return 'Where are retailers like us seeing AI margin lift right now?';
    if (industry.includes('financial') || industry.includes('bank')) return 'Where are banks like us carrying AI risk without enough evidence?';
    return 'What is changing fastest across our operating environment right now?';
  }, [foundation]);

  function scrollToSection(section: 'overview' | 'layers' | 'patterns' | 'vendors' | 'contradictions' | 'ask') {
    const refMap = {
      overview: overviewRef,
      layers: layersRef,
      patterns: patternsRef,
      vendors: vendorsRef,
      contradictions: contradictionsRef,
      ask: askRef,
    } as const;
    refMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleLandingNavigate(target: { section: 'patterns' | 'vendors' | 'contradictions' | 'ask' | 'layers'; layer?: 'L1' | 'L2' | 'L3' | 'L4'; facet?: string | null }) {
    if (target.layer) setBrowserLayer(target.layer);
    if (typeof target.facet !== 'undefined') setBrowserFacet(target.facet);
    scrollToSection(target.section);
  }

  async function handleSubmitQuery(query: string) {
    const userTurn = buildUserTurn(query, threadId);
    setTurns((prev) => [...prev, { ...userTurn, index: prev.length }]);

    const completedTurn = await submitQuery({ query, threadId });
    if (!completedTurn) return;

    setThreadId(completedTurn.threadId);
    setTurns((prev) => [...prev, { ...completedTurn, index: prev.length }]);
    setSelectedTurnId(completedTurn.id);
    router.replace(`${basePath}?q=${encodeURIComponent(query)}${completedTurn.threadId ? `&thread=${completedTurn.threadId}` : ''}`);
  }

  async function handlePersona(turnIdToRender: string, personaKey: string) {
    const turn = await applyPersona(turnIdToRender, personaKey);
    if (!turn) return;
    setTurns((prev) => [...prev, { ...turn, index: prev.length }]);
    setSelectedTurnId(turn.id);
    enterDeepDive();
  }

  async function handleCounter(turnIdToCounter?: string) {
    const targetId = turnIdToCounter ?? [...turns].reverse().find((turn) => turn.role === 'nexus')?.id;
    if (!targetId) return;
    const turn = await requestCounter(targetId);
    if (!turn) return;
    setTurns((prev) => [...prev, { ...turn, index: prev.length }]);
    setSelectedTurnId(turn.id);
    enterDeepDive();
  }

  async function handleUpload(file: File) {
    try {
      const attachment = await uploadFile(file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Upload failed.');
    }
  }

  async function handleThreadAction(action: 'save' | 'attach_to_program' | 'clear') {
    if (!threadId) return;
    if (action === 'save') {
      await fetch(`/api/v1/threads/${threadId}/save`, { method: 'POST' });
      return;
    }
    if (action === 'attach_to_program') {
      router.push(`${programTargetPath}?source=intelligence_thread&threadId=${threadId}`);
      return;
    }
    if (action === 'clear') {
      await fetch(`/api/v1/threads/${threadId}/save`, { method: 'POST' }).catch(() => void 0);
      setTurns([]);
      setThreadId(null);
      setSelectedTurnId(null);
      reset();
      router.replace(basePath);
    }
  }

  async function handlePromoteArtifact(turn: NexusTurnData) {
    setPageError(
      `Artifact promotion is UI-ready, but the current Nexus query path does not persist intelligence_artifacts yet. Turn ${turn.id} rendered as an artifact but cannot be promoted safely.`,
    );
  }

  async function handleArtifactAction(
    turn: NexusTurnData,
    action: 'download_pdf' | 'download_html' | 'copy' | 'promote',
  ) {
    if (action === 'promote') {
      await handlePromoteArtifact(turn);
      return;
    }

    const html = turn.payload.artifact_html ?? `<p>${turn.payload.answer ?? ''}</p>`;
    const title = turn.payload.artifact_metadata?.title;
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim().replace(/\s+/g, '-').toLowerCase() : 'nexus-artifact';

    if (action === 'copy') {
      const text = turn.payload.answer ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        setPageError('Clipboard access is unavailable in this browser session.');
      }
      return;
    }

    if (action === 'download_pdf') {
      window.print();
      return;
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeTitle}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="intel-page">
        <div className="intel-shell">
          <div className="intel-card intel-section intel-signedout">
            <div className="intel-eyebrow">Intelligence</div>
            <div className="intel-title" style={{ marginTop: 12 }}>Sign in to open the full research surface.</div>
            <div className="intel-subtle" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
              The backend requires a resolved person and active client context before Zone 1–4 can hydrate.
            </div>
            <div className="intel-row" style={{ marginTop: 18 }}>
              <Link href="/sign-in" className="intel-button">Go to sign in</Link>
              <Link href="/" className="intel-button-outline">Back home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'no_client') {
    return (
      <div className="intel-page">
        <div className="intel-shell">
          <div className="intel-card intel-section intel-signedout">
            <div className="intel-eyebrow">Intelligence</div>
            <div className="intel-title" style={{ marginTop: 12 }}>No active client is pinned for this viewer.</div>
            <div className="intel-subtle" style={{ marginTop: 12, fontSize: 14 }}>
              The Intelligence APIs are tenancy-scoped and currently return `403 no_client` until a valid active client resolves.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={state === 'A' ? 'intel-page intel-page-landing' : 'intel-page'}>
      <div className="intel-shell intel-stack">
        {pageError || streamError ? (
          <section className="intel-card intel-section" style={{ borderColor: 'rgba(255,107,74,0.35)' }}>
            <div className="intel-chip mono red">integration note</div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>
              {pageError ?? streamError}
            </div>
          </section>
        ) : null}

        {state !== 'A' ? <FoundationStrip foundation={foundation} onExpand={() => reset()} /> : null}
        

        <div className={`intel-shell-grid state-${state.toLowerCase()}`}>
          {state === 'C' ? (
            <ThreadRail
              turns={turns}
              activeTurnId={activeTurnId}
              onTurnClick={setSelectedTurnId}
              onThreadAction={handleThreadAction}
            />
          ) : null}

          <div className="intel-stack">
            {(state === 'A' || turns.length === 0) ? (
              <>
                <div className="intel-workspace-layout">
                  <aside className="intel-workspace-sidebar">
                    <div className="intel-workspace-sidebar-head">
                      <div className="intel-eyebrow">Persistent rail</div>
                      <div className="intel-workspace-sidebar-title">Intelligence should feel like an operating console.</div>
                      <div className="intel-subtle" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        One page, fixed navigation, and every major count opens a real in-page section instead of a dead card or a jump-out route.
                      </div>
                    </div>
                    <div className="intel-browser-sidebar-group">
                      <div className="intel-browser-sidebar-label">Primary sections</div>
                      {[
                        ['overview', 'Overview', 'Ground the tenant and the page'],
                        ['layers', 'Layer navigator', 'Switch L1–L4 as work modes'],
                        ['patterns', 'Patterns & benchmarks', 'Evidence, comparables, and promotion depth'],
                        ['vendors', 'Vendor landscape', 'Where overlap and pressure sit'],
                        ['contradictions', 'Contradictions', 'What is blocking value or trust'],
                        ['ask', 'Ask AbarVa', 'Persistent composer and next action'],
                      ].map(([key, label, detail]) => (
                        <button key={key} type="button" className="intel-browser-rail-item" onClick={() => scrollToSection(key as 'overview' | 'layers' | 'patterns' | 'vendors' | 'contradictions' | 'ask')}>
                          <div>
                            <strong>{label}</strong>
                            <span>{detail}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="intel-browser-sidebar-group">
                      <div className="intel-browser-sidebar-label">Working filters</div>
                      <button type="button" className="intel-browser-rail-item" onClick={() => handleLandingNavigate({ section: 'patterns', layer: 'L1', facet: 'pattern' })}>
                        <div><strong>Pattern</strong><span>{foundation?.metrics.patterns ?? 0} promoted or candidate</span></div>
                      </button>
                      <button type="button" className="intel-browser-rail-item" onClick={() => handleLandingNavigate({ section: 'patterns', layer: 'L1', facet: 'benchmark' })}>
                        <div><strong>Benchmark</strong><span>{foundation?.metrics.benchmarks ?? 0} market references</span></div>
                      </button>
                      <button type="button" className="intel-browser-rail-item" onClick={() => handleLandingNavigate({ section: 'vendors', layer: 'L1', facet: 'vendor' })}>
                        <div><strong>Vendor</strong><span>{foundation?.metrics.vendors ?? 0} mapped to the tenant</span></div>
                      </button>
                      <button type="button" className="intel-browser-rail-item" onClick={() => scrollToSection('contradictions')}>
                        <div><strong>Contradictions</strong><span>{foundation?.metrics.contradictions ?? 0} client-level flags</span></div>
                      </button>
                    </div>
                  </aside>

                  <div className="intel-workspace-main">
                    <section ref={overviewRef} className="intel-stack">
                      <FoundationReadout foundation={foundation} loading={!foundation} onNavigate={handleLandingNavigate} />
                    </section>

                    <section ref={layersRef} className="intel-card intel-section intel-warm-section">
                      <div className="intel-warm-section-head">
                        <div>
                          <div className="intel-eyebrow">Layer navigator</div>
                          <div className="intel-title" style={{ maxWidth: 760 }}>One page, six sections, no dead-end clicks.</div>
                          <div className="intel-subtle" style={{ marginTop: 12, maxWidth: 760 }}>
                            The left rail stays fixed. The center updates with real content. Top boxes become navigation, not decoration.
                          </div>
                        </div>
                      </div>
                      <FoundationBrowser
                        activeLayer={browser?.activeLayer ?? browserLayer}
                        onLayerChange={(layer) => {
                          setBrowserLayer(layer);
                          setBrowserFacet(null);
                        }}
                        tiles={browser?.tiles ?? []}
                        items={browser?.items ?? []}
                        onFacetChange={setBrowserFacet}
                      />
                    </section>

                    <section ref={patternsRef} className="intel-card intel-section intel-dark-band">
                      <div className="intel-band-head">
                        <div>
                          <div className="intel-eyebrow">Patterns & benchmarks</div>
                          <div className="intel-title intel-band-title">The middle of the page becomes the evidence engine.</div>
                          <div className="intel-subtle intel-band-copy">
                            This is where the page earns trust: named pattern cards, benchmark references, and what the evidence depth actually supports.
                          </div>
                        </div>
                      </div>
                      <FoundationBrowser
                        activeLayer={browser?.activeLayer ?? browserLayer}
                        onLayerChange={(layer) => {
                          setBrowserLayer(layer);
                          setBrowserFacet(null);
                        }}
                        tiles={browser?.tiles ?? []}
                        items={browser?.items ?? []}
                        onFacetChange={setBrowserFacet}
                      />
                    </section>

                    <section ref={vendorsRef} className="intel-card intel-section intel-warm-section">
                      <div className="intel-warm-section-head">
                        <div>
                          <div className="intel-eyebrow">Vendor landscape</div>
                          <div className="intel-title" style={{ maxWidth: 760 }}>Vendor should become a map, not a count.</div>
                          <div className="intel-subtle" style={{ marginTop: 12, maxWidth: 760 }}>
                            Named vendors, active overlaps, and strategic pressure should sit in one visible place instead of hiding behind a single metric chip.
                          </div>
                        </div>
                      </div>
                      <FoundationBrowser
                        activeLayer={browser?.activeLayer ?? browserLayer}
                        onLayerChange={(layer) => {
                          setBrowserLayer(layer);
                          setBrowserFacet('vendor');
                        }}
                        tiles={browser?.tiles ?? []}
                        items={browser?.items ?? []}
                        onFacetChange={setBrowserFacet}
                      />
                    </section>

                    <section ref={contradictionsRef} className="intel-card intel-section intel-dark-band">
                      <div className="intel-band-head">
                        <div>
                          <div className="intel-eyebrow">Contradictions ledger</div>
                          <div className="intel-title intel-band-title">The strongest content in the product should feel like a control room.</div>
                          <div className="intel-subtle intel-band-copy">
                            Contradictions deserve real click depth, named tension, and a visible route to next action.
                          </div>
                        </div>
                      </div>
                      <PortfolioSignalFeed
                        signals={signals}
                        programCount={foundation?.metrics.engagements ?? 0}
                        onSignalClick={setSelectedSignalId}
                      />
                    </section>

                    <section ref={askRef} className="intel-card intel-section intel-dark-band">
                      <div className="intel-band-head">
                        <div>
                          <div className="intel-eyebrow">Ask AbarVa</div>
                          <div className="intel-title intel-band-title">The chat area should feel like a real tool, not a debug console.</div>
                          <div className="intel-subtle intel-band-copy">
                            Wrapped text, visible citations, no leaked trace blocks, and a composer that stays usable on a 13-inch screen.
                          </div>
                        </div>
                      </div>
                      <AskIntelligenceBar
                        suggestedQueries={suggestedQueries}
                        placeholder={askPlaceholder}
                        onSubmit={handleSubmitQuery}
                        onSuggestedTap={handleSubmitQuery}
                        onFileSelected={handleUpload}
                        attachments={attachments}
                        disabled={isStreaming}
                      />
                    </section>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AskIntelligenceBar
                  suggestedQueries={suggestedQueries}
                  placeholder={askPlaceholder}
                  onSubmit={handleSubmitQuery}
                  onSuggestedTap={handleSubmitQuery}
                  onFileSelected={handleUpload}
                  attachments={attachments}
                  disabled={isStreaming}
                />
                <NexusConversation
                  turns={turns}
                  pending={{
                    active: isStreaming,
                    mode: streamState.mode,
                    format: streamState.format,
                    progress: streamState.progress,
                  }}
                  onPersonaApply={handlePersona}
                  onCounterRequest={handleCounter}
                  onArtifactAction={handleArtifactAction}
                />
                {loadingThread ? <div className="intel-subtle">Loading thread…</div> : null}
              </>
            )}
          </div>

          {state !== 'A' ? (
            <NextMovesFloater
              programFit={programFit}
              primaryAction={() => threadId && router.push(`${programTargetPath}?source=intelligence_thread&threadId=${threadId}`)}
              onCounter={() => void handleCounter()}
              onPersona={(persona) => {
                const lastAssistant = [...turns].reverse().find((turn) => turn.role === 'nexus');
                if (lastAssistant) void handlePersona(lastAssistant.id, persona);
              }}
              canScope={!!threadId}
            />
          ) : null}
        </div>
      </div>
      <PortfolioSignalDetail signal={selectedSignal} onClose={() => setSelectedSignalId(null)} />
    </div>
  );
}
