'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function VendorCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  return (
    <>
      {vm.vOverview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 14 }}>
              Portfolio position
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {vm.vendorStats.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                  <span style={{ fontSize: 13, color: '#5f5e5a' }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#0a0a0b', textAlign: 'right' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <DataTable
            title="Material contracts"
            note="Row click opens Contract 360."
            binding="SourceRenewalExposure"
            columns={vm.listCols}
            rows={vm.vendorContractRows}
            footnote="Material contract rows shown. If the vendor rollup groups rows into contract families, that family count is labeled separately."
          />
        </div>
      ) : null}

      {vm.vOverview ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 4 }}>
            Contract portfolio composition
          </div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', marginBottom: 16 }}>Annual contract value against actual spend, per governed contract. Row click opens Contract 360.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {vm.vendorComposition.map((c) => (
              <div key={c.id} onClick={c.onClick} className="sw-hover-cream" style={{ cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b' }}>{c.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#b4b2a9' }}>{c.id}</span>
                  {c.autoRenew ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#ba7517', border: '1px solid rgba(186,117,23,.3)', borderRadius: 3, padding: '1px 6px' }}>Auto-renew</span> : null}
                  {c.renewalExposed ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: c.urgColor, border: `1px solid ${c.urgColor}`, borderRadius: 3, padding: '1px 6px' }}>≤180d</span> : null}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#5f5e5a' }}>{c.renewalLabel}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 88, fontSize: 10.5, color: '#888780' }}>Contract value</span>
                    <div style={{ flex: 1, height: 10, background: '#f1efe8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.acvPct}%`, background: '#0a0a0b' }} />
                    </div>
                    <span style={{ width: 70, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textAlign: 'right', color: '#2c2c2a' }}>{c.acv}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 88, fontSize: 10.5, color: '#888780' }}>Actual spend</span>
                    <div style={{ flex: 1, height: 10, background: '#f1efe8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.spendPct}%`, background: '#3d6ea8' }} />
                    </div>
                    <span style={{ width: 70, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textAlign: 'right', color: '#5f5e5a' }}>{c.spend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {vm.vOverview ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 4 }}>
            Enterprise dependency map
          </div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', marginBottom: 16 }}>Vendor → contracts → critical applications → platforms → transformation initiatives. A layer that has nothing mapped for this vendor says so rather than showing zero.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <DepCol label="Contracts">
              {vm.vendorDependencyMap.contracts.length ? vm.vendorDependencyMap.contracts.map((c) => (
                <DepChip key={c.id} onClick={c.onClick}>{c.name}</DepChip>
              )) : <DepEmpty />}
            </DepCol>
            <DepCol label="Critical applications">
              {vm.vendorDependencyMap.criticalApplications > 0 ? <DepChip tone="#0066CC">{vm.vendorDependencyMap.criticalApplications} business-critical</DepChip> : <DepEmpty />}
            </DepCol>
            <DepCol label="Platforms">
              {vm.vendorDependencyMap.platforms.length ? vm.vendorDependencyMap.platforms.map((p) => <DepChip key={p}>{p}</DepChip>) : <DepEmpty />}
            </DepCol>
            <DepCol label="Transformation initiatives">
              {vm.vendorDependencyMap.initiatives.length ? vm.vendorDependencyMap.initiatives.map((i, idx) => <DepChip key={idx} tone="#ba7517">{i.name} · {i.status}</DepChip>) : <DepEmpty />}
            </DepCol>
          </div>
        </div>
      ) : null}

      {vm.vContracts ? (
        <DataTable
          title="Contracts and renewal posture"
          note="Notice deadline, expiry, auto-renew and weak-signal count for every material contract with this vendor."
          binding="computeRenewalExposure + computeContractLeverageSignals(source.contract_360)"
          columns={vm.listCols}
          rows={vm.vendorContractRows}
        />
      ) : null}

      {vm.vDeps ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 4 }}>
            Transformation dependencies
          </div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', marginBottom: 16 }}>source.contract_initiative_dependency, across every material contract with this vendor.</div>
          {vm.vendorDependencyMap.initiatives.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vm.vendorDependencyMap.initiatives.map((i, idx) => (
                <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'baseline', paddingBottom: 10, borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{i.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', border: '1px solid rgba(10,10,11,.16)', borderRadius: 3, padding: '2px 7px' }}>{i.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#b4b2a9' }}>No initiative dependencies recorded for this vendor&rsquo;s contracts.</div>
          )}
        </div>
      ) : null}

      {vm.vOppsTab ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vm.vendorHasOpps ? vm.vendorOpps.map((o) => (
            <div key={o.ref} onClick={o.onClick} className="sw-hover-ink-border" style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '18px 22px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b' }}>{o.reasons}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#0a0a0b' }}>{o.exposed} exposed</span>
              </div>
              <div style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.6, maxWidth: '100ch' }}>{o.why}</div>
            </div>
          )) : <div style={{ fontSize: 12.5, color: '#b4b2a9' }}>No deterministic opportunities flagged for this vendor.</div>}
        </div>
      ) : null}
    </>
  );
}

function DepCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}
function DepChip({ children, onClick, tone }: { children: React.ReactNode; onClick?: () => void; tone?: string }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? 'sw-hover-cream' : undefined}
      style={{ border: `1px solid ${tone ?? 'rgba(10,10,11,.14)'}`, borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: tone ?? '#2c2c2a', cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
}
function DepEmpty() {
  return <div style={{ fontSize: 12, color: '#b4b2a9' }}>Not mapped for this vendor.</div>;
}
