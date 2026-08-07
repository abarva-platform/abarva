'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

const LP_LABEL: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 6 };

export function ContextLens({ vm }: { vm: SourceWorkspaceVM }) {
  const lp = vm.leadershipPosition;
  const diag = vm.dataLayerDiagnostics;
  return (
    <>
      <div style={{ background: '#0a0a0b', borderRadius: 8, padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e05a5a' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>
            Leadership position · updates with the governed as-of date
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          <div>
            <div style={{ ...LP_LABEL, color: 'rgba(255,255,255,.5)' }}>What we know</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#fff' }}>{lp.whatWeKnow}</div>
          </div>
          <div>
            <div style={{ ...LP_LABEL, color: 'rgba(255,255,255,.5)' }}>What it means</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#fff' }}>{lp.whatItMeans}</div>
          </div>
          <div>
            <div style={{ ...LP_LABEL, color: 'rgba(255,255,255,.5)' }}>Value at stake</div>
            <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontSize: 22, color: '#ff9d9d' }}>{lp.valueAtStake}</div>
          </div>
          <div>
            <div style={{ ...LP_LABEL, color: 'rgba(255,255,255,.5)' }}>Recommended action</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#fff' }}>{lp.recommendedAction}</div>
          </div>
          <div>
            <div style={{ ...LP_LABEL, color: 'rgba(255,255,255,.5)' }}>Evidence basis</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.75)' }}>{lp.evidenceRequired}</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${diag.exploreMatchesV4 ? 'rgba(29,158,117,.28)' : 'rgba(186,117,23,.34)'}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(10,10,11,.09)', background: diag.exploreMatchesV4 ? '#f3fbf8' : '#fff3e6' }}>
          <div style={{ flex: '1 1 360px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0b', marginBottom: 4 }}>Evidence reconciliation</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#5f5e5a' }}>
              {diag.mismatchWarning
                ? 'The semantic snapshot and contract explorer use different governed projections; values remain labeled by source until the projections are unified.'
                : 'The semantic snapshot and contract explorer reconcile for the active tenant.'}
            </div>
          </div>
          <div style={{ flex: '0 1 150px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a' }}><b style={{ display: 'block', fontSize: 15, color: '#0a0a0b' }}>{diag.datasetLabel}</b> active dataset</div>
          <div style={{ flex: '0 1 145px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a' }}><b style={{ display: 'block', fontSize: 15, color: '#0a0a0b' }}>{diag.v4ContractCount} / {diag.v4VendorCount}</b> semantic snapshot</div>
          <div style={{ flex: '0 1 150px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a' }}><b style={{ display: 'block', fontSize: 15, color: diag.exploreMatchesV4 ? '#1d9e75' : '#ba7517' }}>{diag.legacyContractCount} / {diag.legacyVendorCount}</b> contract explorer</div>
          <div style={{ flex: '0 1 180px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a' }}><b style={{ display: 'block', fontSize: 15, color: diag.exploreMatchesV4 ? '#1d9e75' : '#ba7517' }}>{diag.exploreMatchesV4 ? 'Aligned' : 'Source-labeled'}</b> reconciliation state</div>
        </div>
      </div>

      <DataTable
        title="Connected governed context"
        note="What the read adapter returned for this tenant, layer by layer."
        binding="source.contract_360, source.vendor_contract_portfolio"
        columns={vm.contextTableCols}
        rows={vm.contextTableRows}
        footnote="Each row's source column names the exact table or pure function it comes from. Nothing here is computed by this page."
      />

      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, padding: '16px 22px 13px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Context coverage</div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a' }}>Which governed reads actually returned rows for this tenant.</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff' }}>
          {vm.coverage.map((c, i) => (
            <div key={i} style={{ flex: '1 1 240px', background: '#fff', padding: '13px 17px 14px', borderRight: '1px solid rgba(10,10,11,.09)', borderTop: '1px solid rgba(10,10,11,.09)', marginTop: -1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0a0a0b' }}>{c.name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: c.dot }}>{c.state}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#5f5e5a', lineHeight: 1.45 }}>{c.note}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.05em', color: '#b4b2a9', marginTop: 7, textTransform: 'uppercase' }}>{c.system}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
