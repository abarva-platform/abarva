'use client';

import { useState } from 'react';
import type { SourceWorkspaceVM } from '../buildViewModel';

const LEDGER_ORDER = ['recoverable_leakage', 'avoided_cost', 'negotiated_improvement', 'realized_value'] as const;

const LEDGER_LABEL: Record<(typeof LEDGER_ORDER)[number], string> = {
  recoverable_leakage: 'Recoverable opportunity',
  avoided_cost: 'Avoidable opportunity',
  negotiated_improvement: 'Negotiable improvement',
  realized_value: 'Finance-confirmed outcome',
};

type MarkerShape = 'circle-fill' | 'square-fill' | 'check' | 'diamond' | 'circle-hollow';

const MARKER: Record<string, MarkerShape> = {
  'SYSTEM EVIDENCED': 'circle-fill',
  'DOCUMENT EVIDENCED': 'square-fill',
  'HUMAN VALIDATED': 'check',
  INFERRED: 'diamond',
  MISSING: 'circle-hollow',
};

function Marker({ shape, color, size = 14 }: { shape: MarkerShape; color: string; size?: number }) {
  const s = size;
  const c = s / 2;
  if (shape === 'circle-fill') return <svg width={s} height={s} style={{ flexShrink: 0 }}><circle cx={c} cy={c} r={c - 2} fill={color} /></svg>;
  if (shape === 'square-fill') return <svg width={s} height={s} style={{ flexShrink: 0 }}><rect x="2" y="2" width={s - 4} height={s - 4} fill={color} /></svg>;
  if (shape === 'check')
    return (
      <svg width={s} height={s} style={{ flexShrink: 0 }} viewBox="0 0 14 14">
        <path d="M2.5,7.2 L5.8,10.5 L11.5,3.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (shape === 'diamond')
    return (
      <svg width={s} height={s} style={{ flexShrink: 0 }} viewBox="0 0 14 14">
        <path d="M7,1 L13,7 L7,13 L1,7 Z" fill="none" stroke={color} strokeWidth="1.6" />
      </svg>
    );
  return <svg width={s} height={s} style={{ flexShrink: 0 }}><circle cx={c} cy={c} r={c - 2} fill="none" stroke={color} strokeWidth="1.6" /></svg>;
}

const MARKER_LEGEND: { cls: keyof typeof MARKER; label: string }[] = [
  { cls: 'SYSTEM EVIDENCED', label: 'System evidenced' },
  { cls: 'DOCUMENT EVIDENCED', label: 'Document evidenced' },
  { cls: 'HUMAN VALIDATED', label: 'Human validated' },
  { cls: 'INFERRED', label: 'Inferred / calculated' },
  { cls: 'MISSING', label: 'Missing / unresolved' },
];

export function EvidenceLineageGraph({ vm }: { vm: SourceWorkspaceVM }) {
  const ledger = vm.optLedger;
  const lines = ledger?.lines ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ledger || lines.length === 0) return null;

  const groups = LEDGER_ORDER.map((kind) => ({ kind, items: lines.filter((l) => l.kind === kind) })).filter((g) => g.items.length > 0);
  const selected = lines.find((l) => l.id === selectedId) ?? null;

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 22px' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 6 }}>
        Why we believe this
      </div>
      <div style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.5, marginBottom: 16, maxWidth: 640 }}>
        Trace each opportunity to its contract, transaction, operational, and validation evidence. Marker color shows evidence strength, not whether the finding is good or bad news.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(280px,1fr) minmax(320px,1.2fr)' : '1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => (
            <div key={g.kind}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#888780', marginBottom: 7 }}>
                {LEDGER_LABEL[g.kind]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.items.map((item) => {
                  const isSel = item.id === selectedId;
                  const shape = MARKER[item.evidenceClass] ?? 'circle-hollow';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(isSel ? null : item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                        border: 'none', borderLeft: `2px solid ${isSel ? item.evidenceTone : 'rgba(10,10,11,.1)'}`,
                        background: isSel ? '#fbfaf7' : 'transparent', cursor: 'pointer',
                        padding: '8px 10px', borderRadius: 4, marginBottom: 2,
                      }}
                    >
                      <Marker shape={shape} color={item.evidenceTone} />
                      <span style={{ fontSize: 12.5, fontWeight: isSel ? 700 : 600, color: '#0a0a0b', flex: '1 1 auto', minWidth: 0 }}>{item.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: item.state === 'Quantified' ? '#1d9e75' : '#5f5e5a', whiteSpace: 'nowrap' }}>{item.amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 8, borderTop: '1px solid rgba(10,10,11,.08)' }}>
            {MARKER_LEGEND.map((m) => (
              <span key={m.cls} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#888780' }}>
                <Marker shape={MARKER[m.cls]} color="#888780" size={12} />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {selected ? (
          <div style={{ background: '#fbfaf7', border: `1px solid ${selected.evidenceTone}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Marker shape={MARKER[selected.evidenceClass] ?? 'circle-hollow'} color={selected.evidenceTone} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: selected.evidenceTone }}>{selected.evidenceClass}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0b', marginBottom: 2 }}>Why {selected.amount}?</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 14 }}>{selected.label}</div>

            {selected.sourceRefs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selected.sourceRefs.map((ref, i) => (
                  <div key={ref}>
                    <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 6, padding: '9px 12px' }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#2c2c2a', overflowWrap: 'anywhere' }}>{ref}</div>
                    </div>
                    {i < selected.sourceRefs.length - 1 ? (
                      <div style={{ textAlign: 'center', color: '#b4b2a9', fontSize: 12, lineHeight: '18px' }}>↓</div>
                    ) : null}
                  </div>
                ))}
                <div style={{ textAlign: 'center', color: '#b4b2a9', fontSize: 12, lineHeight: '18px' }}>↓</div>
                <div style={{ background: selected.evidenceTone + '1a', border: `1px solid ${selected.evidenceTone}`, borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#2c2c2a' }}>Finding</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: '#0a0a0b' }}>{selected.amount}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: '#a32d2d', background: '#fceded', border: '1px solid rgba(163,45,45,.28)', borderRadius: 6, padding: '10px 12px' }}>
                No source record is linked yet — this is exactly why the evidence class reads {selected.evidenceClass}.
              </div>
            )}

            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#2c2c2a', marginTop: 14 }}>{selected.evidence}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#5f5e5a', marginTop: 8 }}><b style={{ color: '#2c2c2a' }}>Next.</b> {selected.nextAction}</div>

            {selected.lineageFields.length > 0 ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#888780', margin: '14px 0 6px' }}>Lineage fields required for full trace</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.lineageFields.map((f) => (
                    <span key={f} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5f5e5a', background: '#fff', border: '1px solid rgba(10,10,11,.1)', borderRadius: 3, padding: '3px 6px' }}>{f}</span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
