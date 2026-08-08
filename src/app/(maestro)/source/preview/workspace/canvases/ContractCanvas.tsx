'use client';

import { DataTable } from '../DataTable';
import { EvidenceLineageGraph } from './EvidenceLineageGraph';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function ContractCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const c = vm.c;
  if (!c) return null;
  return (
    <>
      {vm.cOverview ? (
        <>
          {c.noticePassed ? (
            <div style={{ background: '#fceded', border: '1px solid rgba(163,45,45,.28)', borderRadius: 8, padding: '18px 22px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a32d2d', flexShrink: 0 }} />
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#2c2c2a', maxWidth: '96ch' }}>
                <b>Notice deadline passed</b> — {c.notice}. The contract remains active until {c.expiry}. The commercial lever for this term has lapsed; the available move is a variation or standstill, not a renewal negotiation.
              </div>
            </div>
          ) : null}
          <ContractActionStoryPanel vm={vm} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 16, alignItems: 'start' }}>
            <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 14 }}>
                Commercial terms · source.contract_360
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {vm.termRows.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                    <span style={{ fontSize: 13, color: '#5f5e5a', minWidth: 150 }}>{t.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b', flex: 1 }}>{t.value}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: '#b4b2a9', textAlign: 'right' }}>{t.field}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 12 }}>
                Recommended action
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b', marginBottom: 8 }}>{vm.recAction}</div>
              <div style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.6, marginBottom: 14 }}>{vm.recWhy}</div>
              <button onClick={vm.goActions} style={{ border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Open optimize plan
              </button>
            </div>
          </div>
        </>
      ) : null}

      {vm.cEconomics ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '22px 26px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b', marginBottom: 4 }}>Contracted value against actual spend</div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', marginBottom: 20 }}>Annual grain, from source.contract_360.annual_value / actual_annual_spend.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {vm.econBars.map((b, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#2c2c2a' }}>{b.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{b.value}</span>
                </div>
                <div style={{ height: 14, background: '#f1efe8', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: '14px 18px', background: '#faeeda', border: '1px solid rgba(186,117,23,.25)', borderRadius: 6, fontSize: 13, lineHeight: 1.6, color: '#2c2c2a' }}>
            The gap between contracted value and actual spend is either unused entitlement or timing. Source states the variance and withholds the cause until per-contract financial exposure detail is reviewed on the Performance tab.
          </div>
        </div>
      ) : null}

      {vm.cScope ? (
        <>
          <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 8 }}>
                  What this contract covers
                </div>
                <div style={{ fontSize: 14, color: '#2c2c2a', lineHeight: 1.55, maxWidth: '92ch' }}>{c.scopeSummary}</div>
              </div>
              {vm.hasScope && vm.scopeTierCounts ? (
                <div style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 6, padding: '10px 12px', minWidth: 170 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>
                    Scope evidence
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0b' }}>{vm.scopeRows.length} rows</div>
                  <div style={{ fontSize: 11.5, color: '#5f5e5a', marginTop: 3 }}>
                    {vm.scopeTierCounts.explicit.length} explicit · {vm.scopeTierCounts.reviewed.length} reviewed · {vm.scopeTierCounts.unresolved.length} unresolved
                  </div>
                </div>
              ) : null}
            </div>
            {!vm.hasScope ? (
              <div style={{ marginTop: 14, padding: '11px 13px', border: '1px solid rgba(186,117,23,.25)', borderRadius: 6, background: '#fff8ec', fontSize: 12.5, lineHeight: 1.5, color: '#6d420c' }}>
                Scope coverage is not available yet. The next upload should include the agreement/SOW scope schedule, product or service line items, and the application or owner mapping used by the client.
              </div>
            ) : null}
          </div>
          {vm.hasScope ? (
            <DataTable
              title="Systems and services in scope"
              note="These rows should describe the applications, services, products, functions, and run-cost elements the contract actually covers. Confidence stays visible where the source does not prove the link."
              binding="source.contract_application_scope"
              columns={vm.scopeCols}
              rows={vm.scopeRows}
            />
          ) : null}
          {vm.hasProg ? (
            <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 14 }}>
                Related initiatives
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vm.progRows.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,.35fr) minmax(0,1fr)', gap: 14, alignItems: 'baseline', paddingBottom: 10, borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: '#5f5e5a', minWidth: 0 }}>{p.note}</span>
                  </div>
                ))}
              </div>
              {vm.progRows.length > 4 ? (
                <div style={{ fontSize: 12, color: '#888780', marginTop: 10 }}>
                  Showing the first 4 related initiatives. Use full context for the complete dependency list.
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {vm.cPerformance ? <DetailPanel vm={vm} kind="performance" /> : null}
      {vm.cRelationship ? <ContractRelationshipCanvas vm={vm} /> : null}
      {vm.cEvidence ? (
        <>
          <DetailPanel vm={vm} kind="evidence" />
          <EvidenceLineageGraph vm={vm} />
        </>
      ) : null}

      {vm.cRenewal ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '22px 26px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b', marginBottom: 18 }}>Decision timeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
            <div style={{ borderLeft: `3px solid ${c.urgColor}`, paddingLeft: 14 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>Notice deadline</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0b' }}>{c.notice}</div>
              <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 4 }}>{c.noticeDays} before expiry</div>
            </div>
            <div style={{ borderLeft: '3px solid rgba(10,10,11,.16)', paddingLeft: 14 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>Expiration</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0b' }}>{c.expiry}</div>
              <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 4 }}>Auto-renew: {c.auto}</div>
            </div>
            <div style={{ borderLeft: '3px solid rgba(10,10,11,.16)', paddingLeft: 14 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>Urgency state</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.urgColor }}>{c.urgency}</div>
            </div>
            <div style={{ borderLeft: '3px solid rgba(10,10,11,.16)', paddingLeft: 14 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>Renewal owner</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0b' }}>{c.role}</div>
              <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 4 }}>renewal_owner_ref</div>
            </div>
          </div>
        </div>
      ) : null}

      {vm.cLeverage ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '22px 26px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Leverage position</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a32d2d' }}>{vm.weakCount} weak signals</div>
            <div style={{ fontSize: 12.5, color: '#5f5e5a' }}>Each signal is a named field returned by computeContractLeverageSignals. No composite score.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
            {vm.weakFlags.map((f, i) => (
              <div key={i} style={{ border: '1px solid rgba(10,10,11,.12)', borderLeft: `3px solid ${f.color}`, borderRadius: 6, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{f.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: f.color }}>{f.mark}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {vm.cActions ? (
        <>
          {vm.optLedger ? (
            <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(10,10,11,.1)', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 520px', minWidth: 280 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 7 }}>
                    Four-ledger evidence cockpit
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0b', marginBottom: 5 }}>{vm.optLedger.headline}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#5f5e5a' }}>
                    Recoverable leakage, avoided cost, negotiated improvement, and realized value stay separate. Governed extracts and documents can start the cockpit; APIs can replace repeat feeds later.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    ['Recoverable leakage', vm.optLedger.quantifiedLeakage],
                    ['Realized value', vm.optLedger.realizedValue],
                    ['Evidence gaps', vm.optLedger.evidenceGaps],
                  ].map(([label, value]) => (
                    <div key={label} style={{ minWidth: 118, border: '1px solid rgba(10,10,11,.1)', borderRadius: 6, padding: '10px 12px' }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', marginBottom: 5 }}>{label}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#0a0a0b' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={vm.startOptimization}
                  disabled={vm.optCtaDisabled}
                  style={{
                    border: '1px solid #0a0a0b',
                    background: vm.optCtaDisabled ? '#5f5e5a' : '#0a0a0b',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '11px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: vm.optCtaDisabled ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {vm.optCtaLabel}
                </button>
                {vm.optCtaError ? (
                  <div style={{ flexBasis: '100%', color: '#a32d2d', fontSize: 12.5, lineHeight: 1.5 }}>{vm.optCtaError}</div>
                ) : null}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
                {vm.optLedger.lines.map((line) => (
                  <div key={line.id} style={{ padding: '16px 20px', borderRight: '1px solid rgba(10,10,11,.08)', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: line.tone, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a0a0b', lineHeight: 1.35, minWidth: 0 }}>{line.label}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: line.tone, whiteSpace: 'nowrap' }}>{line.state}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: line.evidenceTone, border: `1px solid ${line.evidenceTone}`, borderRadius: 4, padding: '3px 7px', background: '#fff' }}>{line.evidenceClass}</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#0a0a0b', marginBottom: 9 }}>{line.amount}</div>
                    <div style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.55, marginBottom: 10 }}>{line.evidence}</div>
                    <div style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.55, marginBottom: 10 }}><b style={{ color: '#2c2c2a' }}>Next.</b> {line.nextAction}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888780', marginBottom: 6 }}>
                      Drilldown lineage
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {line.lineageFields.slice(0, 5).map((field) => (
                        <span key={field} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: '#5f5e5a', background: '#fff', border: '1px solid rgba(10,10,11,.1)', borderRadius: 3, padding: '3px 6px', overflowWrap: 'anywhere' }}>{field}</span>
                      ))}
                      {line.lineageFields.length > 5 ? (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: '#888780', background: '#fff', border: '1px solid rgba(10,10,11,.08)', borderRadius: 3, padding: '3px 6px' }}>+{line.lineageFields.length - 5} more</span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {line.sourceRefs.slice(0, 3).map((ref) => (
                        <span key={ref} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: '#5f5e5a', background: '#f5f1eb', border: '1px solid rgba(10,10,11,.08)', borderRadius: 3, padding: '3px 6px' }}>{ref}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <SourceSystemEvidenceMap vm={vm} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
            {vm.optLevers.map((l, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 10 }}>{l.label} levers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {l.items.map((it, j) => (
                    <div key={j} style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid rgba(10,10,11,.12)' }}>{it}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Scenario comparison</div>
              <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 3 }}>No scenario carries a savings number, because none has been validated.</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {vm.optScenarios.map((s, i) => (
                <div key={i} style={{ flex: '1 1 260px', padding: '16px 20px', borderTop: `3px solid ${s.tone}`, borderRight: '1px solid rgba(10,10,11,.09)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{s.name}</div>
                    {s.rec ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0f6e56', background: '#e1f5ee', borderRadius: 3, padding: '3px 7px' }}>Recommended</span> : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.55, marginBottom: 10 }}>{s.pos}</div>
                  <div style={{ fontSize: 12, color: '#5f5e5a', lineHeight: 1.5 }}><b style={{ color: '#2c2c2a' }}>Risk.</b> {s.risk}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: '#5f5e5a' }}>aVa reads the same governed data as this canvas. It cannot create a value, a date or a priority.</span>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function ContractActionStoryPanel({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  if (!spine?.selected) return null;
  const c = vm.c;
  const evidenceReady = vm.optLedger
    ? `${vm.optLedger.evidenceReady} ready · ${vm.optLedger.evidenceGaps} gap${vm.optLedger.evidenceGaps === '1' ? '' : 's'}`
    : 'Not established';
  const missingLines = vm.optLedger?.lines.filter((line) => line.evidenceClass === 'MISSING') ?? [];
  const quantifiedLines = vm.optLedger?.lines.filter((line) => line.state === 'Quantified') ?? [];
  const workflowLines = vm.optLedger?.lines.filter((line) => line.state === 'Workflow required') ?? [];
  const ledgerSupport = quantifiedLines.length
    ? quantifiedLines.map((line) => `${line.label}: ${line.amount}`).join(' · ')
    : 'No quantified ledger line is established yet.';
  const runwayText = c
    ? c.noticePassed
      ? `Notice deadline has passed (${c.notice}); the commercial choice is remediation or a controlled variation, not a clean renewal cycle.`
      : c.urgency?.toLowerCase().includes('monitor')
        ? `The renewal date is not the urgency trigger (${c.notice} notice, ${c.expiry} expiry). The reason to act now is evidence readiness plus material value; the long runway lets Procurement prepare properly.`
        : `A renewal or notice decision is inside the active window (${c.notice} notice, ${c.expiry} expiry), so the evidence pack should move before leverage decays.`
    : 'Timing is not established.';
  const qaGuardrail = c
    ? `Do not treat ${c.spend} actual spend below ${c.acv} contracted value as savings by itself. It becomes a finding only after usage, entitlement, invoice, and finance evidence classify the cause.`
    : 'Do not convert variance into value without supporting evidence.';
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(300px,.9fr)', gap: 18, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 8 }}>
            Selected contract decision story
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: '#0a0a0b' }}>{spine.selected.rank}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0b' }}>{spine.selected.band}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5f5e5a', border: '1px solid rgba(10,10,11,.14)', borderRadius: 999, padding: '4px 8px' }}>fit {spine.selected.score}/100</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5f5e5a' }}>{spine.selected.annualValue} annual</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5f5e5a' }}>{evidenceReady}</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: '#2c2c2a', marginBottom: 12 }}>
            {spine.selected.action} This page explains why this contract is actionable; portfolio ranking stays in the portfolio view.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 8 }}>
            <StoryTile
              index="01"
              title="Why this contract is in scope"
              body={spine.selected.reasons[0]?.detail ?? `${spine.selected.annualValue} annual exposure and a governed fit score of ${spine.selected.score}/100.`}
            />
            <StoryTile
              index="02"
              title="Why now, precisely"
              body={runwayText}
            />
            <StoryTile
              index="03"
              title="What supports the case"
              body={ledgerSupport}
            />
            <StoryTile
              index="04"
              title="What is missing"
              body={missingLines.length ? `${missingLines.length} missing line${missingLines.length === 1 ? '' : 's'}: ${missingLines.map((line) => line.label).join('; ')}.` : 'No missing evidence lines remain for this contract; remaining work is decision workflow and value attestation.'}
            />
          </div>
        </div>
        <div>
          <div style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 8, padding: '13px 14px', background: '#fbfaf7', marginBottom: 10 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 8 }}>
              Executive QA read
            </div>
            <div style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.55 }}>
              Ranking is a prioritization signal, not a recommendation to sign. It is based on material exposure, governed ledger evidence, dependency context, and any active decision timing.
            </div>
          </div>
          <div style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 8, padding: '13px 14px', background: '#fff', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0a0a0b', marginBottom: 6 }}>Evidence posture</div>
            <div style={{ fontSize: 12.2, color: '#5f5e5a', lineHeight: 1.55 }}>
              {workflowLines.length
                ? `${workflowLines.length} ledger line${workflowLines.length === 1 ? '' : 's'} still require workflow action before they become realized value.`
                : 'The evidence pack can support a fact-based commercial conversation; realized value still requires Finance/Tower confirmation.'}
            </div>
          </div>
          <div style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 8, padding: '13px 14px', background: '#fff' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0a0a0b', marginBottom: 6 }}>Guardrail</div>
            <div style={{ fontSize: 12.2, color: '#5f5e5a', lineHeight: 1.55 }}>{qaGuardrail}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryTile({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 6, padding: '10px 12px', background: '#fbfaf7' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 800, color: '#0066CC' }}>{index}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0a0a0b' }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.7, color: '#5f5e5a', lineHeight: 1.45 }}>{body}</div>
    </div>
  );
}

function ContractRelationshipCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  return (
    <>
      <ContractJourneyGraph vm={vm} />
      <ValueProofExplainer vm={vm} />
      <SourceSystemEvidenceMap vm={vm} />
    </>
  );
}

function ValueProofExplainer({ vm }: { vm: SourceWorkspaceVM }) {
  const lines = vm.optLedger?.lines ?? [];
  const valueProofDefs = [
    ['recoverable_leakage', 'Recoverable leakage', 'Money that should come back or stop because contract, invoice, SLA, or rate-card evidence proves overbilling, missed credits, duplicates, or off-contract spend.'],
    ['avoided_cost', 'Avoided cost', 'Future spend not incurred because scope, shelfware, renewal uplift, or consumption is reduced before the commitment is made.'],
    ['negotiated_improvement', 'Negotiated improvement', 'Commercial gains from price, term, index cap, volume tier, benchmark right, or termination leverage after the supplier agrees or the negotiation packet is approved.'],
    ['realized_value', 'Realized value', 'Finance-confirmed value only. It is not the same thing as estimated opportunity, usage variance, or a procurement target.'],
  ];
  return (
    <section style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(10,10,11,.1)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0b', marginBottom: 4 }}>What “value proof” means</div>
        <div style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.5 }}>
          Source separates four kinds of money so the page never turns a data gap, forecast, or negotiation target into a claimed saving.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))' }}>
        {valueProofDefs.map(([kind, label, definition]) => {
          const matchingLines = lines.filter((line) => line.kind === kind);
          const amount = matchingLines.map((line) => line.amount).find((value) => value && value !== 'Not established') ?? 'Not established';
          return (
            <div key={label} style={{ padding: '14px 16px', borderRight: '1px solid rgba(10,10,11,.08)', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
              <div style={{ fontSize: 12.8, fontWeight: 800, color: '#0a0a0b', marginBottom: 5 }}>{label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: '#0a0a0b', marginBottom: 7 }}>{amount}</div>
              <div style={{ fontSize: 11.8, color: '#5f5e5a', lineHeight: 1.45 }}>{definition}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ContractJourneyGraph({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  const ledger = vm.optLedger;
  const contract = vm.contractRow;
  if (!spine?.selected || !ledger || !contract) return null;

  const readyLines = ledger.lines.filter((line) => line.state === 'Quantified' || line.state === 'Workflow required');
  const gapLines = ledger.lines.filter((line) => line.state === 'Needs evidence' || line.evidenceClass === 'MISSING');
  const sourceConnections = spine.sourceConnections.slice(0, 6);
  const scopeCount = contract.scoped_application_count ?? 0;
  const proofStatus = gapLines.length ? `${readyLines.length} supported · ${gapLines.length} gaps` : `${readyLines.length} supported · no gaps`;
  const node = (x: number, y: number, w: number, h: number, label: string, sub: string, tone: string, fill = '#fff') => (
    <g filter="url(#softShadow)">
      <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={tone} strokeWidth="1.4" />
      <text x={x + 14} y={y + 23} fontSize="12.5" fontWeight="800" fill="#0a0a0b">{label}</text>
      <text x={x + 14} y={y + 44} fontSize="10.5" fill="#5f5e5a">{sub}</text>
    </g>
  );
  const line = (x1: number, y1: number, x2: number, y2: number, tone = '#b4b2a9') => (
    <path d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} fill="none" stroke={tone} strokeWidth="1.7" markerEnd="url(#arrow)" />
  );
  const chip = (x: number, y: number, label: string, value: string, tone: string) => (
    <g>
      <rect x={x} y={y} width="132" height="42" rx="8" fill="#fff" stroke="rgba(10,10,11,.1)" />
      <circle cx={x + 15} cy={y + 21} r="5" fill={tone} />
      <text x={x + 27} y={y + 17} fontSize="9.2" fontWeight="800" letterSpacing=".08em" fill="#888780">{label.toUpperCase()}</text>
      <text x={x + 27} y={y + 32} fontSize="10.8" fontWeight="800" fill="#0a0a0b">{value}</text>
    </g>
  );

  return (
    <section style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(10,10,11,.1)', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0b' }}>Contract relationship map</div>
        <div style={{ fontSize: 12.2, color: '#5f5e5a' }}>Follow the contract from scope and systems to governed evidence, value proof, and the approval decision. This is relationship flow, not a savings claim.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px,1.3fr) minmax(340px,.7fr)', gap: 0 }}>
        <div style={{ minWidth: 0, padding: '14px 16px' }}>
          <svg viewBox="0 0 940 360" role="img" aria-label="Contract journey relationship graph" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#9a9890" />
              </marker>
              <filter id="softShadow" x="-10%" y="-15%" width="120%" height="135%">
                <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#0a0a0b" floodOpacity=".08" />
              </filter>
              <linearGradient id="journeyBand" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f7f3ea" />
                <stop offset="50%" stopColor="#eff7f5" />
                <stop offset="100%" stopColor="#eef4fb" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="940" height="360" rx="14" fill="#fbfaf7" />
            <rect x="28" y="42" width="884" height="188" rx="18" fill="url(#journeyBand)" stroke="rgba(10,10,11,.08)" />
            <text x="44" y="28" fontSize="10" fontWeight="800" letterSpacing=".12em" fill="#888780">CONTRACT JOURNEY</text>
            <text x="44" y="252" fontSize="10" fontWeight="800" letterSpacing=".12em" fill="#888780">VALUE-PROOF STATUS</text>

            {line(172, 88, 285, 96, '#3d6ea8')}
            {line(172, 162, 285, 142, '#ba7517')}
            {line(172, 212, 285, 162, '#1d9e75')}
            {line(425, 130, 520, 130, '#0a0a0b')}
            {line(658, 130, 735, 130, gapLines.length ? '#ba7517' : '#1d9e75')}

            {node(38, 58, 134, 58, 'Agreement', 'PDF / CLM terms', '#0a0a0b')}
            {node(38, 132, 134, 58, 'Scope facts', `${scopeCount} apps / services`, scopeCount ? '#3d6ea8' : '#ba7517')}
            {node(38, 202, 134, 58, 'Source feeds', `${sourceConnections.length} systems mapped`, '#ba7517')}

            <g filter="url(#softShadow)">
              <rect x="285" y="78" width="140" height="104" rx="16" fill="#0a0a0b" />
              <text x="305" y="108" fontSize="12" fontWeight="800" fill="#fff">Contract 360</text>
              <text x="305" y="130" fontSize="18" fontWeight="900" fill="#fff">{contract.contract_id}</text>
              <text x="305" y="153" fontSize="11" fill="rgba(255,255,255,.72)">{formatCurrency(contract.annual_value ?? null)} annual</text>
              <text x="305" y="170" fontSize="10" fill="rgba(255,255,255,.58)">{spine.selected.score}/100 fit score</text>
            </g>

            {node(520, 78, 138, 104, 'Value proof', proofStatus, gapLines.length ? '#ba7517' : '#1d9e75', '#fff')}
            {node(735, 78, 160, 104, 'Optimize plan', spine.selected.band, '#0a0a0b', '#fff')}

            {ledger.lines.slice(0, 4).map((item, i) => {
              const x = 44 + i * 152;
              const color = item.evidenceClass === 'MISSING' ? '#a32d2d' : item.state === 'Quantified' ? '#1d9e75' : '#ba7517';
              return chip(x, 270, item.label.length > 17 ? `${item.label.slice(0, 16)}...` : item.label, item.amount, color);
            })}
            <text x="44" y="338" fontSize="10.5" fill="#5f5e5a">The map shows relationship flow and evidence readiness. It does not infer savings; amounts come only from governed evidence rows.</text>
            <text x="828" y="338" fontSize="10.5" fontWeight="800" textAnchor="end" fill={gapLines.length ? '#ba7517' : '#1d9e75'}>
              {gapLines.length ? `${gapLines.length} evidence gap${gapLines.length === 1 ? '' : 's'}` : 'evidence complete'}
            </text>
          </svg>
        </div>
        <div style={{ borderLeft: '1px solid rgba(10,10,11,.1)', padding: '14px 16px', minWidth: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 10 }}>
            Source facts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {sourceConnections.slice(0, 5).map((connection) => (
              <div key={connection.id} style={{ border: '1px solid rgba(10,10,11,.09)', borderRadius: 6, padding: '9px 10px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12.2, fontWeight: 800, color: '#0a0a0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{connection.sourceSystem}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#888780', whiteSpace: 'nowrap' }}>{formatValueProofKind(connection.ledgers[0])}</span>
                </div>
                <div style={{ fontSize: 11.3, color: '#5f5e5a', lineHeight: 1.4, marginTop: 3 }}>{connection.extract}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatValueProofKind(kind?: string) {
  if (!kind) return 'Evidence';
  return kind.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value: number | null) {
  if (value == null) return 'Not established';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function SourceSystemEvidenceMap({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  if (!spine) return null;
  const requirements = spine.missingEvidenceSources ?? [];
  const sourceConnections = spine.sourceConnections ?? [];
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 22px' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: '1 1 420px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 6 }}>
            How the evidence is sourced
          </div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.5, maxWidth: 760 }}>
            This contract shows the governed feeds that establish the ledger, plus any remaining extracts needed to move the decision.
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a' }}>
          {requirements.length ? `${requirements.length} gap${requirements.length === 1 ? '' : 's'} to source` : `${sourceConnections.length} governed feed${sourceConnections.length === 1 ? '' : 's'}`}
        </div>
      </div>
      {requirements.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 10 }}>
          {requirements.map((requirement) => (
            <div key={requirement.lineId} style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 8, padding: '12px 14px', background: '#fbfaf7' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0b', marginBottom: 5 }}>{requirement.lineLabel}</div>
              <div style={{ fontSize: 12, color: '#2c2c2a', lineHeight: 1.45, marginBottom: 8 }}>{requirement.ask}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {requirement.connections.map((connection) => (
                  <div key={connection.id} style={{ borderLeft: '2px solid rgba(10,10,11,.14)', paddingLeft: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0a0a0b' }}>{connection.sourceSystem}</div>
                    <div style={{ fontSize: 11.2, color: '#888780', lineHeight: 1.4 }}>{connection.examples}</div>
                    <div style={{ fontSize: 11.5, color: '#5f5e5a', lineHeight: 1.45 }}>{connection.extract}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 10 }}>
          {sourceConnections.map((connection) => (
            <div key={connection.id} style={{ border: '1px solid rgba(10,10,11,.1)', borderRadius: 8, padding: '12px 14px', background: '#fbfaf7' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0a0a0b', marginBottom: 4 }}>{connection.sourceSystem}</div>
              <div style={{ fontSize: 11.5, color: '#5f5e5a', lineHeight: 1.45, marginBottom: 7 }}>{connection.extract}</div>
              <div style={{ fontSize: 11.5, color: '#2c2c2a', lineHeight: 1.45 }}>{connection.outcome}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ vm, kind }: { vm: SourceWorkspaceVM; kind: 'performance' | 'evidence' }) {
  if (vm.detailState === 'loading' || vm.detailState === 'idle') {
    return (
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '30px 34px', fontSize: 13, color: '#5f5e5a' }}>
        Loading {kind === 'performance' ? 'operational performance and financial exposure' : 'document evidence'} for this contract…
      </div>
    );
  }
  if (vm.detailState === 'error' || !vm.detail) {
    return (
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '30px 34px', fontSize: 13, color: '#5f5e5a' }}>
        Could not load per-contract detail from the governed data plane.
      </div>
    );
  }
  const d = vm.detail;
  if (kind === 'performance') {
    const perf = d.operationalPerformance;
    const fin = d.financialExposure;
    const incidents = perf?.cloud_sev1_sev2_incidents ?? null;
    const creditsEarned = perf?.service_credits_earned ?? null;
    const creditsClaimed = perf?.service_credits_claimed ?? null;
    const hasCreditEvidence = creditsEarned != null || creditsClaimed != null;
    const variance = fin?.linked_forecast_amount != null && fin.linked_actual_amount != null
      ? fin.linked_forecast_amount - fin.linked_actual_amount
      : null;
    const performanceRead = incidents != null && incidents > 0
      ? hasCreditEvidence
        ? 'Operational pressure is visible and SLA credit evidence is available for review.'
        : 'Operational pressure is visible, but SLA-credit recovery is not yet provable from the loaded evidence.'
      : 'No material service-performance signal is established from the loaded evidence.';
    const financialRead = fin
      ? 'Financial exposure is linked for this contract; variance still needs usage, entitlement, invoice, and finance evidence before it becomes value.'
      : 'No contract-level financial exposure rows were returned.';
    if (!perf && !fin) {
      return (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '30px 34px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', border: '1px solid rgba(10,10,11,.16)', borderRadius: 3, padding: '4px 9px' }}>
            Not returned
          </span>
          <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 500, fontSize: 23, letterSpacing: '-0.02em', color: '#0a0a0b', margin: '18px 0 10px', maxWidth: '38ch' }}>
            No operational performance or financial exposure rows for this contract
          </h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#5f5e5a', margin: 0, maxWidth: '80ch' }}>
            source.contract_financial_exposure and source.contract_operational_performance returned nothing for contract_id={d.contract.contract_id}.
          </p>
        </div>
      );
    }
    return (
      <>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0b', lineHeight: 1.35, marginBottom: 6 }}>
            {performanceRead}
          </div>
          <div style={{ fontSize: 12.8, color: '#5f5e5a', lineHeight: 1.5, maxWidth: '90ch' }}>
            {financialRead} Treat this as leverage context, not a savings claim.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        {fin ? (
          <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0a0a0b', marginBottom: 10 }}>Spend position</div>
            {([['Budget', fin.linked_budget_amount], ['Forecast', fin.linked_forecast_amount], ['Actual', fin.linked_actual_amount], ['Committed', fin.linked_committed_amount]] as [string, number | null][]).map(([label, v]) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                <span style={{ fontSize: 12.6, color: '#5f5e5a' }}>{label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.6, fontWeight: 700, color: v == null ? '#b4b2a9' : '#0a0a0b' }}>{formatCurrency(v)}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: '#5f5e5a', lineHeight: 1.45, marginTop: 10 }}>
              {variance == null ? 'Variance cause is not established.' : `${formatCurrency(Math.abs(variance))} ${variance >= 0 ? 'below forecast' : 'above forecast'}; cause still needs usage and entitlement evidence.`}
            </div>
          </div>
        ) : null}
        {perf ? (
          <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0a0a0b', marginBottom: 10 }}>Service signal</div>
            <div style={{ fontSize: 12.8, color: '#2c2c2a', lineHeight: 1.5, marginBottom: 10 }}>{perf.sla_summary ?? 'No SLA summary recorded.'}</div>
            {([['Sev1/Sev2 incidents', perf.cloud_sev1_sev2_incidents], ['Service credits earned', perf.service_credits_earned], ['Service credits claimed', perf.service_credits_claimed]] as [string, number | null][]).map(([label, v]) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid rgba(10,10,11,.07)' }}>
                <span style={{ fontSize: 12.6, color: '#5f5e5a' }}>{label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.6, fontWeight: 700, color: v == null ? '#b4b2a9' : '#0a0a0b' }}>{v == null ? 'Not established' : v.toLocaleString('en-US')}</span>
              </div>
            ))}
            {perf.evidence_gap ? (
              <div style={{ fontSize: 12.2, color: '#6d420c', lineHeight: 1.45, marginTop: 10, padding: '9px 11px', border: '1px solid rgba(186,117,23,.25)', borderRadius: 6, background: '#fff8ec' }}>
                <b style={{ color: '#2c2c2a' }}>Need:</b> {String(perf.evidence_gap)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      </>
    );
  }
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(10,10,11,.12)', fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>
        Document evidence ({d.docExtractions.length})
      </div>
      <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(10,10,11,.08)', background: '#fbfaf7', fontSize: 12.5, lineHeight: 1.55, color: '#5f5e5a' }}>
        Overview and Renewal use governed register facts from <b style={{ color: '#2c2c2a' }}>source.contract_360</b>. The rows below are document-extraction facts from <b style={{ color: '#2c2c2a' }}>doc.extraction</b>; &quot;No document value extracted&quot; means the extractor did not find that concept in the current file, not that the register fact is missing.
      </div>
      {d.docExtractions.length ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {d.docExtractions.map((e) => (
            <div key={e.extraction_id} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'baseline', padding: '13px 24px', borderBottom: '1px solid rgba(10,10,11,.07)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b', minWidth: 160 }}>{e.concept_ref}</span>
              <span style={{ fontSize: 12.5, color: '#5f5e5a', flex: 1, minWidth: 240 }}>{e.value_text ?? (e.value_num != null ? String(e.value_num) : 'No document value extracted')}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#b4b2a9' }}>{e.source_file_id ?? '—'}{e.source_page != null ? ' · p.' + e.source_page : ''}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: e.review_state === 'accepted' ? '#1d9e75' : '#ba7517' }}>{e.review_state ?? 'unreviewed'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px 24px', fontSize: 13, color: '#5f5e5a' }}>No doc.extraction rows returned for this contract or its vendor.</div>
      )}
    </div>
  );
}
