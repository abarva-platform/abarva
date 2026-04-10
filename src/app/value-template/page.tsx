'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const S = {
  page: { minHeight: '100vh', background: '#FFFFFF', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif", color: '#1a1a1a' } as React.CSSProperties,
  body: { maxWidth: '900px', margin: '0 auto', padding: '48px 48px 80px' } as React.CSSProperties,
  sectionHeader: (accent: string) => ({
    background: '#111827', padding: '14px 20px', borderRadius: '0', marginBottom: '0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderLeft: `4px solid ${accent}`,
  } as React.CSSProperties),
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#475569', background: '#F8FAFC', textAlign: 'left' as const, borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
  td: { padding: '12px 14px', fontSize: '13px', color: '#374151', verticalAlign: 'top' as const, borderBottom: '1px solid #F1F5F9', lineHeight: 1.5 } as React.CSSProperties,
  input: { width: '72px', padding: '5px 8px', border: '1.5px solid #2563EB', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0F172A', textAlign: 'right' as const, background: '#EFF6FF' } as React.CSSProperties,
  inputWide: { width: '200px', padding: '5px 8px', border: '1.5px solid #2563EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0F172A', background: '#EFF6FF' } as React.CSSProperties,
  calc: { fontSize: '13px', fontWeight: 700, color: '#059669' } as React.CSSProperties,
  base: { fontSize: '13px', color: '#64748B', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
}

function fmt(n: number) {
  return '$' + (Math.round(n * 10) / 10).toFixed(1) + 'M'
}

function ValueTemplateContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  void clientId

  // Editable state
  const [workforcePct, setWorkforcePct] = useState(20)
  const [workforceNote, setWorkforceNote] = useState('Direct patient care, research, strategic initiatives')
  const [itPct, setItPct] = useState(35)
  const [itShiftPct, setItShiftPct] = useState(40)
  const [denialTarget, setDenialTarget] = useState(12)

  // Auto-calculated
  const workforceValue = 62.5 * workforcePct / 100
  const itValue = 28.8 * itPct / 100
  const DENIAL_REV_BASE = 450 // $450M claims base
  const denialValue = Math.max(0, (18.2 - denialTarget) / 100 * DENIAL_REV_BASE)
  const priorAuthValue = 1.6
  const epicValue = 18
  const totalClientValue = workforceValue + itValue + denialValue + priorAuthValue + epicValue
  const abarvaFee = totalClientValue * 0.15
  const netValue = totalClientValue - abarvaFee

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-body { padding: 24px 32px !important; }
          .doc-header { border-top: 3px solid #2563EB !important; }
        }
        input:focus { outline: none; box-shadow: 0 0 0 2px #BFDBFE; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />

      {/* Document chrome */}
      <div style={{ borderTop: '3px solid #2563EB' }} className="doc-header" />

      <div style={S.body} className="page-body">

        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            {/* Logo wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#2563EB" />
                <circle cx="4" cy="4" r="2" fill="#2563EB" opacity="0.6" />
                <circle cx="20" cy="4" r="2" fill="#2563EB" opacity="0.6" />
                <circle cx="4" cy="20" r="2" fill="#2563EB" opacity="0.6" />
                <circle cx="20" cy="20" r="2" fill="#2563EB" opacity="0.6" />
                <line x1="12" y1="12" x2="4" y2="4" stroke="#2563EB" strokeWidth="1" opacity="0.4" />
                <line x1="12" y1="12" x2="20" y2="4" stroke="#2563EB" strokeWidth="1" opacity="0.4" />
                <line x1="12" y1="12" x2="4" y2="20" stroke="#2563EB" strokeWidth="1" opacity="0.4" />
                <line x1="12" y1="12" x2="20" y2="20" stroke="#2563EB" strokeWidth="1" opacity="0.4" />
              </svg>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700 }}>
                <span style={{ color: '#0F172A' }}>Abar</span><span style={{ color: '#1B4FD8' }}>VA</span>
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#94A3B8', marginLeft: '4px' }}>Intelligence Platform</span>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.2, fontFamily: 'Inter, sans-serif' }}>Value Realization Framework</h1>
              <div style={{ fontSize: '16px', color: '#2563EB', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>Meridian Health System</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              A framework for quantifying the impact of AI-enabled transformation<br />
              April 2026 · Prepared by Abarva Intelligence Platform
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Confidential</span>
            <button
              className="no-print"
              onClick={() => window.print()}
              style={{ fontFamily: 'Inter, sans-serif', padding: '8px 16px', borderRadius: '8px', background: '#0F172A', color: '#F8FAFC', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⎙ Print / Export PDF
            </button>
          </div>
        </div>

        {/* Intro paragraph */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px 24px', marginBottom: '40px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#374151', margin: 0, fontStyle: 'italic' }}>
            "This framework is designed around one question: if administrative burden were meaningfully reduced, what would your teams focus on instead — and what would that be worth to Meridian Health System's mission?"
          </p>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '32px' }}>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>Total Baseline Burden Identified</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>$174.3M annually</div>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>Meridian Data Confidence</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>94%</div>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>Value Categories</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563EB' }}>3</div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* CATEGORY 1 — WORKFORCE PRODUCTIVITY */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={S.sectionHeader('#2DD4C8')}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2DD4C8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 1 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>Workforce Productivity</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: '#2DD4C8' }}>$48M</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where time is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>Meridian baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>Staff on interruptible admin — IT tickets, prior auth, HR queries, policy lookups, scheduling. Industry avg: 35 min/day per clinical employee.</td>
                <td style={S.td}>Requests resolved in minutes via AI. No human in loop for routine tasks. Every interaction governed and audited.</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Employees in scope: </span><strong>42,000</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Avg admin time lost: </span><strong>35 min/day</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Loaded cost/head: </span><strong>$87,000/yr</strong></div>
                  <div style={{ marginBottom: '0', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>Annual burden cost: </span><strong style={{ color: '#DC2626' }}>$62.5M</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0F9FF', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>% reduction in admin friction</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={100} value={workforcePct} onChange={e => setWorkforcePct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>%</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px', fontFamily: 'Inter, sans-serif' }}>Capacity recovered</div>
                    <div style={S.calc}>{fmt(workforceValue)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Redirected to</div>
                    <input type="text" value={workforceNote} onChange={e => setWorkforceNote(e.target.value)} style={{ ...S.inputWide, width: '100%', boxSizing: 'border-box' as const }} />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 1 total — workforce productivity recovery</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}><span style={S.calc}>{fmt(workforceValue)}</span><span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>at {workforcePct}% reduction</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* CATEGORY 2 — IT RUN REDUCTION */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={S.sectionHeader('#4DA3FF')}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#4DA3FF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 2 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>IT Run Reduction</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: '#4DA3FF' }}>$32M</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where time is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>Meridian baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>95% of IT team on run — L1/L2 tickets, incident triage, access requests, change coordination. Current: 4,200 tickets/month requiring human resolution.</td>
                <td style={S.td}>AI handles L1/L2 autonomously. Incident triage routed without human escalation. ServiceNow governs and audits every step.</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>IT ops team size: </span><strong>847 FTE</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Annual ticket volume: </span><strong>50,400</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Cost per ticket: </span><strong>$48</strong></div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>Annual L1/L2 run cost: </span><strong style={{ color: '#DC2626' }}>$28.8M</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0F9FF', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>% L1/L2 resolved via AI</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={100} value={itPct} onChange={e => setItPct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>%</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Run cost reduction</div>
                    <div style={S.calc}>{fmt(itValue)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>% IT effort shifted to transformation</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={100} value={itShiftPct} onChange={e => setItShiftPct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>%</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 2 total — IT run cost reduction</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}><span style={S.calc}>{fmt(itValue)}</span><span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>at {itPct}% automation</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* CATEGORY 3 — CLINICAL AND REVENUE VALUE */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={S.sectionHeader('#6EE7B7')}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#6EE7B7', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 3 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>Clinical &amp; Revenue Value</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: '#6EE7B7' }}>$94M</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where time is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>Meridian baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>Clinicians on documentation, prior auth, and administrative compliance. Revenue lost to denials, delayed AR, and $18M in unused Epic AI capabilities already licensed.</td>
                <td style={S.td}>AI agents handle prior auth and denial prediction. Epic Cogito activated. Clinical documentation via DAX. Revenue cycle optimized end-to-end.</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Annual denial write-off: </span><strong style={{ color: '#DC2626' }}>$94M</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Prior auth FTE cost: </span><strong>$2.1M/yr</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>Unused Epic license value: </span><strong>$18M</strong></div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>Days-in-AR excess cost: </span><strong style={{ color: '#DC2626' }}>$47M</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0FDF4', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Denial rate target (current: 18.2%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={18} step={0.1} value={denialTarget} onChange={e => setDenialTarget(Number(e.target.value))} style={{ ...S.input, borderColor: '#059669', background: '#F0FDF4' }} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>%</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>→ Denial reduction saves <strong>{fmt(denialValue)}</strong></div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Prior auth automation (11 FTE)</div>
                    <div style={{ ...S.calc, color: '#059669' }}>{fmt(priorAuthValue)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Epic AI activation (license already owned)</div>
                    <div style={{ ...S.calc, color: '#059669' }}>{fmt(epicValue)}</div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 3 total — clinical and revenue value</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}>
                  <span style={S.calc}>{fmt(denialValue + priorAuthValue + epicValue)}</span>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>denial → {denialTarget}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* TOTAL SUMMARY */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ background: '#111827', borderRadius: '10px', padding: '28px 32px', marginBottom: '36px' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>Total Value Summary — Based on Your Inputs</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {[
              { label: 'Total Baseline Burden Identified', value: '$174.3M', sub: 'Annual cost of current state', color: '#E6EDF3' },
              { label: 'Conservative Scenario (20%)', value: '$34.8M', sub: 'Annual savings — 20% reduction', color: '#4DA3FF' },
              { label: 'Base Case (35%)', value: '$61.0M', sub: 'Annual savings — 35% reduction', color: '#6EE7B7' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{s.value}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#21262D', marginBottom: '20px' }} />

          {/* Your inputs row */}
          <div style={{ background: '#0D1117', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2DD4C8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Your Commitments — Based on Inputs Above</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Workforce recovery</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#2DD4C8' }}>{fmt(workforceValue)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>IT run reduction</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#4DA3FF' }}>{fmt(itValue)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Clinical &amp; revenue</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#6EE7B7' }}>{fmt(denialValue + priorAuthValue + epicValue)}</div>
              </div>
              <div style={{ borderLeft: '1px solid #21262D', paddingLeft: '20px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Total committed value</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 800, color: '#F9FAFB' }}>{fmt(totalClientValue)}</div>
              </div>
            </div>
          </div>

          {/* Fee and net */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            {[
              { label: 'Optimistic Scenario (50%)', value: '$87.2M', sub: 'Annual savings at full deployment', color: '#F59E0B' },
              { label: 'Abarva Outcome Fee (15%)', value: fmt(abarvaFee), sub: 'Calculated quarterly on verified savings', color: '#EF4444' },
              { label: 'Net Client Value', value: fmt(netValue), sub: 'After Abarva fee — your return', color: '#6EE7B7' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{s.value}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.7, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            All baseline figures sourced from Meridian data loaded into Abarva Intelligence Platform. Target figures represent Meridian leadership commitments entered above. Abarva outcome fees are calculated quarterly against savings verified by third-party audit. This document is confidential and prepared exclusively for Meridian Health System leadership.
          </p>
          <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <a href="/admin" style={{ fontFamily: 'Inter, sans-serif', padding: '8px 16px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>← Engagement Hub</a>
            <a href="/admin/brief" style={{ fontFamily: 'Inter, sans-serif', padding: '8px 16px', borderRadius: '8px', background: '#0F172A', fontSize: '12px', fontWeight: 600, color: '#F8FAFC', textDecoration: 'none' }}>Pre-Meeting Brief →</a>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ValueTemplatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <ValueTemplateContent />
    </Suspense>
  )
}
