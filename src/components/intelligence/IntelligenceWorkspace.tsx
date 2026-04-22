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

function buildSuggestedQueries(foundation: FoundationReadoutData | null) {
  if (!foundation) {
    return [
      'What is most important in this tenant right now?',
      'What contradictions are unresolved?',
      'What would an executive challenge in this story?',
    ];
  }

  const clientName = foundation.client.name;
  const industry = (foundation.client.industry ?? '').toLowerCase();

  if (industry.includes('health') || industry.includes('clinical')) {
    return [
      `What are peer health systems doing on ambient documentation for ${clientName}?`,
      `Where are the biggest contradictions inside ${clientName} right now?`,
      `What would the CFO or CMO push back on in this intelligence stack?`,
    ];
  }

  if (industry.includes('retail')) {
    return [
      `Where is ${clientName} overspending across vendors or overlapping AI bets?`,
      `What operating signals matter most for ${clientName} this quarter?`,
      `What would a retail CFO challenge before approving more AI spend?`,
    ];
  }

  if (industry.includes('financial')) {
    return [
      `Which vendor or benchmark signals are most material for ${clientName}?`,
      `What contradictions inside ${clientName} matter for leadership decisions?`,
      `What would the board challenge before trusting this intelligence?`,
    ];
  }

  return [
    `What does AbarVa already know about ${clientName}?`,
    `Where are the highest-risk contradictions inside ${clientName}?`,
    `What would an executive push back on here?`,
  ];
}

function askPlaceholder(foundation: FoundationReadoutData | null) {
  if (!foundation) return 'Ask a grounded question about this tenant, program, or signal.'

  return `Ask about ${foundation.client.name}, a live contradiction, a vendor, a benchmark, or a program decision…`
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
  const browserSectionRef = useRef<HTMLDivElement | null>(null);
  const signalSectionRef = useRef<HTMLDivElement | null>(null);

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
  const suggestedQueries = useMemo(() => buildSuggestedQueries(foundation), [foundation]);
  const askPromptPlaceholder = useMemo(() => askPlaceholder(foundation), [foundation]);

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

  function navigateFoundation(target: { kind: 'browser' | 'signals'; layer?: 'L1' | 'L2' | 'L3' | 'L4'; facet?: string | null }) {
    if (target.kind === 'signals') {
      signalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (target.layer) setBrowserLayer(target.layer);
    setBrowserFacet(target.facet ?? null);
    browserSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div className="intel-page">
      <div className="intel-shell intel-stack">
        {pageError || streamError ? (
          <section className="intel-card intel-section" style={{ borderColor: 'rgba(255,107,74,0.35)' }}>
            <div className="intel-chip mono red">integration note</div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>
              {pageError ?? streamError}
            </div>
          </section>
        ) : null}

        {state === 'A'
          ? <FoundationReadout foundation={foundation} loading={!foundation} onNavigate={navigateFoundation} />
          : <FoundationStrip foundation={foundation} onExpand={() => reset()} />}

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
                <div ref={browserSectionRef}>
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
                </div>
                <AskIntelligenceBar
                  suggestedQueries={suggestedQueries}
                  placeholder={askPromptPlaceholder}
                  onSubmit={handleSubmitQuery}
                  onSuggestedTap={handleSubmitQuery}
                  onFileSelected={handleUpload}
                  attachments={attachments}
                  disabled={isStreaming}
                />
                <div ref={signalSectionRef}>
                  <PortfolioSignalFeed
                    signals={signals}
                    programCount={foundation?.metrics.engagements ?? 0}
                    onSignalClick={setSelectedSignalId}
                  />
                </div>
              </>
            ) : (
              <>
                <AskIntelligenceBar
                  suggestedQueries={suggestedQueries}
                  placeholder={askPromptPlaceholder}
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
