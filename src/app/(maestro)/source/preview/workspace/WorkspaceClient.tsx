'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import './workspace.css';
import { cssStringToObject } from './cssStringToObject';
import { INITIAL_STATE, WorkspaceViewModel, type WorkspaceState } from './viewModel';
import { buildViewModel } from './buildViewModel';
import type { SourceWorkspacePortfolioData } from './live/portfolioAdapter';
import type { Contract360Response } from './live/contractDetail';
import { AgentDock, type AttachmentRef, type ChatMessage } from '@/components/agent/AgentDock';
import { stripArtifactsForDisplay } from '@/lib/agent/artifacts';
import { Tooltip } from './Tooltip';
import { ContextLens } from './lenses/ContextLens';
import { ExploreLens } from './lenses/ExploreLens';
import { ConcentrationLens } from './lenses/ConcentrationLens';
import { RenewalsLens } from './lenses/RenewalsLens';
import { LeverageLens } from './lenses/LeverageLens';
import { ListLens } from './lenses/ListLens';
import { VendorCanvas } from './canvases/VendorCanvas';
import { ContractCanvas } from './canvases/ContractCanvas';
import { OpportunityCanvas } from './canvases/OpportunityCanvas';
import { EvidenceCanvas } from './canvases/EvidenceCanvas';

const SOURCE_WORKSPACE_AGENT = { initials: 'aVa', mark: 'ava' as const, name: 'aVa', role: 'Source Workspace advisor' };
const SOURCE_WORKSPACE_AGENT_API_URL = '/api/chat/agent';

export function WorkspaceClient({
  portfolio,
  tenantName,
}: {
  portfolio: SourceWorkspacePortfolioData;
  tenantName: string;
}) {
  const [state, setStateRaw] = useState<WorkspaceState>(INITIAL_STATE);
  const [thread, setThread] = useState<ChatMessage[]>([]);

  const setState = useMemo(
    () => (patch: Partial<WorkspaceState> | ((s: WorkspaceState) => Partial<WorkspaceState>)) => {
      setStateRaw((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
    },
    [],
  );

  const fetchContractDetail = useCallback((contractId: string) => {
    setStateRaw((prev) => {
      if (prev.contractDetail[contractId]) return prev; // already loaded/loading
      return { ...prev, contractDetail: { ...prev.contractDetail, [contractId]: 'loading' } };
    });
    fetch('/api/source/workspace/contract/' + encodeURIComponent(contractId))
      .then((r) => (r.ok ? (r.json() as Promise<Contract360Response>) : Promise.reject(new Error(String(r.status)))))
      .then((view) => setStateRaw((prev) => ({ ...prev, contractDetail: { ...prev.contractDetail, [contractId]: view } })))
      .catch(() => setStateRaw((prev) => ({ ...prev, contractDetail: { ...prev.contractDetail, [contractId]: 'error' } })));
  }, []);

  const startContractOptimization = useCallback((contractId: string) => {
    setStateRaw((prev) => ({
      ...prev,
      optimizationLaunch: {
        ...prev.optimizationLaunch,
        [contractId]: { status: 'loading' },
      },
    }));
    fetch('/api/source/workspace/contract/' + encodeURIComponent(contractId) + '/optimization', {
      method: 'POST',
    })
      .then(async (r) => {
        const payload = await r.json().catch(() => null);
        if (!r.ok || !payload?.ok) {
          throw new Error(payload?.detail ?? payload?.error ?? `Source returned ${r.status}`);
        }
        return payload as { approvalUrl?: string; contractId?: string; eventUrl?: string; eventId?: string };
      })
      .then((payload) => {
        if (payload.contractId !== contractId) {
          throw new Error('Door 1 returned a different contract. The workflow was not opened.');
        }
        window.location.href = payload.approvalUrl ?? payload.eventUrl ?? `/source/events/${payload.eventId ?? ''}`;
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Could not start optimization workflow.';
        setStateRaw((prev) => ({
          ...prev,
          optimizationLaunch: {
            ...prev.optimizationLaunch,
            [contractId]: { status: 'error', message },
          },
        }));
      });
  }, []);

  const vm = useMemo(() => {
    const logic = new WorkspaceViewModel(state, setState, portfolio, tenantName, fetchContractDetail, startContractOptimization);
    return buildViewModel(logic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, portfolio, tenantName]);

  // AgentDock's onMessage contract — same runtime call as every other Source
  // aVa surface (see SourceEventsAgentDockView.tsx), grounded in whatever the
  // Explorer/canvas is currently showing via vm.avaSurfaceContext.
  const onAvaMessage = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      if (!text && attachments.length === 0) return;
      const userBody =
        attachments.length > 0
          ? `${text}\n\n[attached: ${attachments.map((a) => a.file_name).join(', ')}]`
          : text;
      setThread((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', body: userBody }]);

      const attachmentContext = attachments
        .filter((a) => a.extracted_text_preview && a.extracted_text_preview.trim().length > 0)
        .map((a) => `--- attachment: ${a.file_name} (${a.mime}) ---\n${a.extracted_text_preview}\n--- end attachment ---`)
        .join('\n\n');
      const messageForRuntime = attachmentContext ? `${text}\n\n${attachmentContext}` : text;

      const context = [
        'Surface: /source/preview/workspace.',
        `Agent: ${SOURCE_WORKSPACE_AGENT.name}.`,
        `Tenant: ${tenantName}.`,
        `Selection: ${String(vm.avaSurfaceContext.selection ?? 'Executive portfolio')}.`,
        `Lens: ${String(vm.avaSurfaceContext.lens ?? 'portfolio')}.`,
        'Use the structured Source workspace context supplied in surfaceContext; do not echo raw JSON, context bundles, retrieval receipts, artifact tags, or internal ids in visible prose.',
        'If the user asks for a chart, graph, visual, trend, or Recharts exhibit, describe the recommended visual in prose; this Source dock must not show inline chart JSON, object literals, code fences, or renderer payloads.',
      ].join(' ');

      let acc = '';
      try {
        const res = await fetch(SOURCE_WORKSPACE_AGENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageForRuntime,
            context,
            surface: '/source/preview/workspace',
            tenantName,
            surfaceContext: vm.avaSurfaceContext,
            agentName: SOURCE_WORKSPACE_AGENT.name,
          }),
        });
        if (!res.ok) throw new Error(`aVa returned ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let streaming = true;
        while (streaming) {
          const { done, value } = await reader.read();
          if (done) {
            streaming = false;
            break;
          }
          acc += decoder.decode(value, { stream: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection error';
        acc = `I hit an error: ${message}`;
      }

      const trimmed = acc.trim();
      const visibleBody = stripArtifactsForDisplay(trimmed).trim();
      const finalBody = visibleBody.length > 0 ? visibleBody : 'aVa did not return a response.';
      setThread((prev) => [...prev, { id: `a-${Date.now()}`, role: 'agent', body: finalBody }]);
    },
    [tenantName, vm.avaSurfaceContext],
  );

  useEffect(() => {
    const onResize = () =>
      // "tight" spans the laptop band (roughly a 13"-16" MacBook browser
      // window) where the Explorer starves the canvas below its ~720-800px
      // working width; "wide" is an external-monitor viewport with room for
      // both panes plus the aVa dock at once.
      setState({ narrow: window.innerWidth < 760, tight: window.innerWidth < 1440, wide: window.innerWidth >= 1440 });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sw-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f1eb', overflow: 'hidden' }}>
      {/* Live-data banner — every figure below reads the governed Source
          data plane for this tenant, not an illustrative fixture. */}
      <div
        style={{
          background: portfolio.isEmpty ? '#3a1f0c' : '#0c1a3a', color: 'rgba(255,255,255,.86)', fontSize: 11.5, padding: '5px 20px',
          display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '.02em',
        }}
      >
        <strong style={{ color: portfolio.isEmpty ? '#ffb066' : '#8fb8ff' }}>
          {portfolio.isEmpty ? '● SOURCE WORKSPACE · NO ROWS RETURNED' : '● SOURCE WORKSPACE · LIVE'}
        </strong>
        <span>
          {portfolio.isEmpty
            ? 'source.contract_360 returned no rows for tenant_key=' + (portfolio.tenantKey || '(none)') + ' — nothing below is estimated in its place.'
            : portfolio.workspaceDiagnostics.datasetLabel + ' · provider=' + portfolio.workspaceDiagnostics.analyticsProvider + ' · contracts/vendors=' + portfolio.workspaceDiagnostics.v4ContractCount + '/' + portfolio.workspaceDiagnostics.v4VendorCount + ' · tenant_key=' + portfolio.tenantKey + ' · as-of ' + new Date(portfolio.v4Snapshot.asOfDateIso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
        </span>
        {!portfolio.isEmpty && portfolio.workspaceDiagnostics.mismatchWarning ? (
          <span style={{ color: '#ffcf8a' }}>
            Explore projection={portfolio.workspaceDiagnostics.legacyContractCount}/{portfolio.workspaceDiagnostics.legacyVendorCount}
          </span>
        ) : null}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => { window.location.href = '/source/portfolio'; }} style={{ border: '1px solid rgba(255,255,255,.28)', background: 'transparent', color: 'inherit', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Sourcing events ↗
          </button>
          <button onClick={() => { window.location.href = '/source/new'; }} style={{ border: '1px solid rgba(255,255,255,.28)', background: 'transparent', color: 'inherit', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            New event ↗
          </button>
          {vm.isNarrow ? (
            <button onClick={vm.toggleDrawer} style={{ border: '1px solid rgba(255,255,255,.28)', background: 'transparent', color: 'inherit', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Explorer
            </button>
          ) : null}
        </span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: vm.shellCols, minHeight: 0 }}>
        {/* ── Explorer ── */}
        <div style={cssStringToObject(vm.explorerStyle)}>
          <ExplorerPane vm={vm} />
        </div>

        {/* ── Canvas, wrapped in the shared aVa dock (same component/pattern as Moves' Move advisor) ── */}
        <AgentDock
          agent={SOURCE_WORKSPACE_AGENT}
          surface="/source/preview/workspace"
          defaultMode="collapsed"
          collapsedRestoreMode="expand"
          collapsedSummary={{ label: 'aVa', detail: vm.title }}
          thread={thread}
          onMessage={onAvaMessage}
          suggestedActions={vm.avaSuggestedActions}
          surfaceContext={vm.avaSurfaceContext}
          workspace={
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflowY: vm.isExplore ? 'hidden' : 'auto' }}>
              <div style={{ background: '#fff', borderBottom: '1px solid rgba(10,10,11,.12)', padding: vm.isExplore ? '6px 18px 0' : '16px 30px 0', position: 'sticky', top: 0, zIndex: 30, flex: '0 0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: vm.isExplore ? 9 : 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', marginBottom: vm.isExplore ? 4 : 11 }}>
                  {vm.crumbs.map((c, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: c.color }}>{c.label}</span>
                      {c.sep ? <span style={{ color: '#d3d1c7' }}>{c.sep}</span> : null}
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9, textTransform: 'none', letterSpacing: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: vm.availDot }} />
                    <span style={{ color: '#5f5e5a' }}>{vm.availLabel}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: vm.isExplore ? 'nowrap' : 'wrap' }}>
                  <div style={{ flex: '1 1 460px', minWidth: 'min(100%,420px)' }}>
                    <h1 style={{ fontFamily: vm.isExplore ? 'Inter,system-ui,sans-serif' : 'Fraunces,Georgia,serif', fontWeight: vm.isExplore ? 750 : 500, fontSize: vm.isExplore ? 18 : 'clamp(22px,1.8vw,28px)', lineHeight: vm.isExplore ? 1.15 : 1.12, letterSpacing: 0, color: '#0a0a0b', margin: vm.isExplore ? '0 0 4px' : '0 0 8px' }}>
                      {vm.title}
                    </h1>
                    <p style={{ display: vm.isExplore ? 'none' : undefined, fontSize: 14.5, lineHeight: 1.55, color: '#5f5e5a', margin: '0 0 14px', maxWidth: 'none' }}>{vm.thesis}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingBottom: vm.isExplore ? 8 : 14 }}>
                    {vm.headerActions.map((a, i) => (
                      <button key={i} onClick={a.onClick} style={{ border: `1px solid ${a.border}`, background: a.bg, color: a.fg, borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
                  {vm.tabs.map((t, i) => (
                    <button key={i} onClick={t.onClick} style={{ border: 'none', borderBottom: `2px solid ${t.line}`, background: 'transparent', color: t.fg, fontSize: 13, fontWeight: t.weight, padding: vm.isExplore ? '6px 12px' : '11px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: vm.isExplore ? '6px 18px 8px' : '22px 30px 60px', display: 'flex', flexDirection: 'column', gap: vm.isExplore ? 6 : 18, flex: vm.isExplore ? '1 1 auto' : undefined, minHeight: vm.isExplore ? 0 : undefined, overflow: vm.isExplore ? 'hidden' : undefined }}>
                {vm.stripCompact ? <CompactContextStrip vm={vm} /> : null}

                {vm.isPortfolioContext ? <ContextLens vm={vm} /> : null}
                {vm.isExplore ? <ExploreLens vm={vm} /> : null}
                {vm.isConc ? (
                  <>
                    <PortfolioLensSwitch vm={vm} />
                    {vm.showConcentrationLens ? <ConcentrationLens vm={vm} /> : null}
                    {vm.showLeverageLens ? <LeverageLens vm={vm} /> : null}
                  </>
                ) : null}
                {vm.isRenewals ? <RenewalsLens vm={vm} /> : null}
                {(vm.isContractList || vm.isVendorList) ? <ListLens vm={vm} /> : null}
                {vm.isVendor ? <VendorCanvas vm={vm} /> : null}
                {vm.isContract ? <ContractCanvas vm={vm} /> : null}
                {vm.isOpp ? <OpportunityCanvas vm={vm} /> : null}
                {vm.isEvidence ? <EvidenceCanvas vm={vm} /> : null}

                {vm.hasPins ? (
                  <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '18px 22px' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 12 }}>
                      Pinned analyses · part of this workspace
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vm.pins.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(10,10,11,.12)', borderRadius: 6, padding: '11px 14px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0066CC', border: '1px solid rgba(0,102,204,.3)', borderRadius: 3, padding: '2px 6px' }}>{p.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b' }}>{p.title}</span>
                          <span style={{ fontSize: 12, color: '#5f5e5a' }}>{p.note}</span>
                          <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#b4b2a9' }}>{p.when}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />
      </div>

      <div style={{ background: '#fff', borderTop: '1px solid rgba(10,10,11,.12)', minHeight: 34, display: vm.isExplore ? 'none' : 'flex', alignItems: 'center', gap: 14, padding: '6px 20px', flexShrink: 0, fontSize: 11.5, color: '#5f5e5a', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780' }}>Selection</span>
        <span style={{ fontWeight: 600, color: '#2c2c2a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vm.statusSel}</span>
        <span style={{ width: 1, height: 14, background: 'rgba(10,10,11,.12)', flexShrink: 0 }} />
        <span>Position as of <b style={{ color: '#2c2c2a' }}>{new Date(portfolio.asOfDateIso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</b> · governed as_of_date</span>
        {vm.showStatusDetail ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 1, height: 14, background: 'rgba(10,10,11,.12)' }} />
            <span>Freshness <b style={{ color: '#2c2c2a' }}>{vm.freshness}</b></span>
            <span style={{ width: 1, height: 14, background: 'rgba(10,10,11,.12)' }} />
            <span>Evidence <b style={{ color: '#2c2c2a' }}>{vm.evidenceState}</b></span>
          </span>
        ) : null}
      </div>

      <Tooltip tip={vm.tip} />
    </div>
  );
}

function PortfolioLensSwitch({ vm }: { vm: ReturnType<typeof buildViewModel> }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0b', marginBottom: 4 }}>
          One action surface, two lenses
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#5f5e5a' }}>
          Spend concentration explains dependency. Leverage explains where a sourcing action is justified.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {vm.portfolioLensButtons.map((lens) => (
          <button
            key={lens.id}
            onClick={lens.onClick}
            title={lens.note}
            style={{
              border: `1px solid ${lens.border}`,
              background: lens.bg,
              color: lens.fg,
              borderRadius: 6,
              padding: '9px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {lens.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FullContextStrip({ vm }: { vm: ReturnType<typeof buildViewModel> }) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
        {vm.valueStrip.map((v, i) => (
          <div key={i} style={{ flex: '1 1 190px', padding: '15px 17px', borderRight: '1px solid rgba(10,10,11,.09)', borderTop: '1px solid rgba(10,10,11,.09)', marginTop: -1 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 9, lineHeight: 1.35 }}>{v.label}</div>
            <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontSize: v.size, fontWeight: 500, lineHeight: 1.05, color: v.color }}>{v.value}</div>
            <div style={{ fontSize: 11.5, color: '#5f5e5a', marginTop: 7, lineHeight: 1.4 }}>{v.sub}</div>
          </div>
        ))}
      </div>
      {vm.hasPending ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', background: '#fbfaf7', border: '1px solid rgba(10,10,11,.1)', borderRadius: 6, padding: '11px 16px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780' }}>Not yet established</span>
          {vm.pendingItems.map((p, i) => (
            <span key={i} style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#5f5e5a' }}><b style={{ color: '#2c2c2a', fontWeight: 600 }}>{p.label}</b> — {p.sub}</span>
              <span style={{ color: '#d3d1c7' }}>·</span>
            </span>
          ))}
          <a onClick={vm.goEvidence} style={{ fontSize: 12, fontWeight: 600, marginLeft: 'auto', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            See what it needs →
          </a>
        </div>
      ) : null}
      <SourceV4ProofPanel vm={vm} />
    </>
  );
}

function CompactContextStrip({ vm }: { vm: ReturnType<typeof buildViewModel> }) {
  const [expanded, setExpanded] = useState(false);
  const ring = vm.compactRing;
  const ringDeg = ring ? Math.max(0, Math.min(100, ring.pct01 * 100)) : 0;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: vm.isExplore ? 'nowrap' : 'wrap', alignItems: 'center', gap: vm.isExplore ? 10 : 14, padding: vm.isExplore ? '6px 10px' : '10px 16px', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, background: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: vm.isExplore ? 11.5 : 12.5, color: '#5f5e5a', overflow: vm.isExplore ? 'hidden' : undefined }}>
        {vm.compactItems.map((it, i) => (
          <span key={i} style={{ whiteSpace: 'nowrap' }}>
            <b style={{ color: '#0a0a0b' }}>{it.value}</b> {it.label}
          </span>
        ))}
        {ring ? (
          <>
            <span
              style={{
                width: vm.isExplore ? 18 : 22, height: vm.isExplore ? 18 : 22, borderRadius: '50%', flex: 'none',
                background: `conic-gradient(${ring.color} 0 ${ringDeg}%, #f1efe8 ${ringDeg}% 100%)`,
                display: 'grid', placeItems: 'center',
              }}
            >
              <span style={{ width: vm.isExplore ? 10 : 13, height: vm.isExplore ? 10 : 13, borderRadius: '50%', background: '#fff' }} />
            </span>
            <span style={{ color: ring.color, whiteSpace: 'nowrap' }}>
              <b>{ring.valueLabel}</b> {ring.label}
            </span>
          </>
        ) : null}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{ marginLeft: 'auto', border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#5f5e5a', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {expanded ? '– hide full context' : '+ full context ▾'}
        </button>
      </div>
      {expanded ? <FullContextStrip vm={vm} /> : null}
    </>
  );
}

function SourceV4ProofPanel({ vm }: { vm: ReturnType<typeof buildViewModel> }) {
  return (
    <section
      aria-label="Source V4 semantic proof"
      style={{
        background: '#fff',
        border: '1px solid rgba(10,10,11,.12)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 12,
          padding: '16px 22px 13px',
          borderBottom: '1px solid rgba(10,10,11,.12)',
        }}
      >
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0a0a0b' }}>
          V4 semantic proof
        </div>
        <div style={{ fontSize: 12.5, color: '#5f5e5a' }}>
          {vm.sourceV4DatasetId} · as of {vm.sourceV4AsOf} · labels preserve period, exposure and observation grain.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', background: '#fff' }}>
        {vm.sourceV4ProofCards.map((card, i) => (
          <div
            key={card.label}
            style={{
              minWidth: 0,
              padding: '14px 17px',
              borderRight: '1px solid rgba(10,10,11,.08)',
              borderTop: i === 0 ? 'none' : '1px solid rgba(10,10,11,.08)',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: '#0066CC',
                marginBottom: 7,
                lineHeight: 1.35,
              }}
            >
              {card.label}
            </div>
            <div style={{ fontSize: 22, lineHeight: 1.05, fontWeight: 750, color: '#0a0a0b' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.4, color: '#5f5e5a', marginTop: 7 }}>
              {card.note}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '.04em',
                color: '#b4b2a9',
                marginTop: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={card.source}
            >
              {card.source}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExplorerPane({ vm }: { vm: ReturnType<typeof buildViewModel> }) {
  if (vm.explorerRail) {
    return (
      <div
        onClick={vm.toggleExplorerPin}
        title="Pin explorer open"
        className="sw-hover-cream"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 13, color: '#5f5e5a' }}>»</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5f5e5a', writingMode: 'vertical-rl' }}>
          Explorer
        </span>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px', borderBottom: '1px solid rgba(10,10,11,.09)' }}>
        {vm.explorerPinned ? (
          <button onClick={vm.toggleExplorerPin} title="Unpin explorer" className="sw-hover-ink-text" style={{ border: 'none', background: 'transparent', color: '#0066CC', fontSize: 12, cursor: 'pointer' }}>
            «
          </button>
        ) : null}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#888780' }}>Explorer</span>
        <button onClick={vm.collapseAll} className="sw-hover-ink-text" style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#888780', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Collapse
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 24px' }}>
        {vm.tree.map((n) => (
          <div
            key={n.id}
            onClick={n.onClick}
            className={n.active ? undefined : 'sw-hover-cream'}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: n.pad, borderRadius: 5, cursor: 'pointer', background: n.bg, marginBottom: 1 }}
          >
            <span style={{ width: 11, flexShrink: 0, color: '#b4b2a9', fontSize: 9, textAlign: 'center' }}>{n.caret}</span>
            <span style={{ fontSize: n.size, fontWeight: n.weight, color: n.fg, fontFamily: n.size === '9.5px' ? "'JetBrains Mono', monospace" : 'inherit', letterSpacing: n.size === '9.5px' ? '.12em' : 0, textTransform: n.size === '9.5px' ? 'uppercase' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {n.label}
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: n.badgeColor }}>{n.badgeVal}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#b4b2a9', minWidth: 14, textAlign: 'right' }}>{n.badgeCount}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(10,10,11,.09)', padding: '11px 14px', fontSize: 11.5, color: '#888780', lineHeight: 1.45 }}>
        Badges show governed counts and annual value exposed at the as-of date.
      </div>
    </>
  );
}
