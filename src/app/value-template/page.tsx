'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActiveClient } from '@/lib/use-active-client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#FFFFFF', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif", color: '#1a1a1a' } as React.CSSProperties,
  body: { maxWidth: '1400px', margin: '0 auto', padding: '48px 48px 80px' } as React.CSSProperties,
  sectionHeader: (accent: string) => ({
    background: '#0C0C0C', padding: '14px 20px', borderRadius: '0', marginBottom: '0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderLeft: `4px solid ${accent}`,
  } as React.CSSProperties),
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#475569', background: '#F8FAFC', textAlign: 'left' as const, borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
  td: { padding: '12px 14px', fontSize: '13px', color: '#3C3C3C', verticalAlign: 'top' as const, borderBottom: '1px solid #F1F5F9', lineHeight: 1.5 } as React.CSSProperties,
  input: { width: '72px', padding: '5px 8px', border: '1.5px solid #2563EB', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0F172A', textAlign: 'right' as const, background: '#EFF6FF' } as React.CSSProperties,
  inputWide: { width: '200px', padding: '5px 8px', border: '1.5px solid #2563EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0F172A', background: '#EFF6FF' } as React.CSSProperties,
  calc: { fontSize: '13px', fontWeight: 700, color: '#059669' } as React.CSSProperties,
  base: { fontSize: '13px', color: '#64748B', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
}

function fmt(n: number) {
  return '$' + (Math.round(n * 10) / 10).toFixed(1) + 'M'
}

const CLIENT_VT: Record<string, {
  name: string; industry: string; totalBurden: string; confidence: string; dataSource: string
  intro: string
  cat1: { title: string; color: string; opportunity: string; lostToday: string; withAI: string
    b1: string; b1v: string; b2: string; b2v: string; b3: string; b3v: string; b4: string; b4v: string
    inputLabel: string; inputMax: number; inputDefault: number; noteDefault: string; burdenBase: number }
  cat2: { title: string; color: string; opportunity: string; lostToday: string; withAI: string
    b1: string; b1v: string; b2: string; b2v: string; b3: string; b3v: string; b4: string; b4v: string
    inputLabel: string; inputMax: number; inputDefault: number; burdenBase: number }
  cat3: { title: string; color: string; opportunity: string; lostToday: string; withAI: string
    b1: string; b1v: string; b2: string; b2v: string; b3: string; b3v: string; b4: string; b4v: string
    fixedA: string; fixedAv: number; fixedB: string; fixedBv: number
    inputLabel: string; inputMin: number; inputMax: number; inputStep: number; inputDefault: number; inputBase: number; inputBaseLabel: string; inputUnit: string; burdenBase: number }
}> = {
  meridian: {
    name: 'Meridian Health System', industry: '23-hospital IDN · 42,000 employees', totalBurden: '$174.3M', confidence: '94%',
    dataSource: 'Meridian data loaded into AbarVa Intelligence Platform',
    intro: '"This framework is designed around one question: if administrative burden were meaningfully reduced, what would your teams focus on instead — and what would that be worth to Meridian Health System\'s mission?"',
    cat1: { title: 'Workforce Productivity', color: '#2DD4C8', opportunity: '$48M',
      lostToday: 'Staff on interruptible admin — IT tickets, prior auth, HR queries, policy lookups, scheduling. Industry avg: 35 min/day per clinical employee.',
      withAI: 'Requests resolved in minutes via AI. No human in loop for routine tasks. Every interaction governed and audited.',
      b1: 'Employees in scope', b1v: '42,000', b2: 'Avg admin time lost', b2v: '35 min/day', b3: 'Loaded cost/head', b3v: '$87,000/yr', b4: 'Annual burden cost', b4v: '$62.5M',
      inputLabel: '% reduction in admin friction', inputMax: 100, inputDefault: 20, noteDefault: 'Direct patient care, research, strategic initiatives', burdenBase: 62.5 },
    cat2: { title: 'IT Run Reduction', color: '#4DA3FF', opportunity: '$32M',
      lostToday: '95% of IT team on run — L1/L2 tickets, incident triage, access requests, change coordination. Current: 4,200 tickets/month requiring human resolution.',
      withAI: 'AI handles L1/L2 autonomously. Incident triage routed without human escalation. ServiceNow governs and audits every step.',
      b1: 'IT ops team size', b1v: '847 FTE', b2: 'Annual ticket volume', b2v: '50,400', b3: 'Cost per ticket', b3v: '$48', b4: 'Annual L1/L2 run cost', b4v: '$28.8M',
      inputLabel: '% L1/L2 resolved via AI', inputMax: 100, inputDefault: 35, burdenBase: 28.8 },
    cat3: { title: 'Clinical & Revenue Value', color: '#6EE7B7', opportunity: '$94M',
      lostToday: 'Clinicians on documentation, prior auth, and administrative compliance. Revenue lost to denials, delayed AR, and $18M in unused Epic AI capabilities already licensed.',
      withAI: 'AI agents handle prior auth and denial prediction. Epic Cogito activated. Clinical documentation via DAX. Revenue cycle optimized end-to-end.',
      b1: 'Annual denial write-off', b1v: '$94M', b2: 'Prior auth FTE cost', b2v: '$2.1M/yr', b3: 'Unused Epic license value', b3v: '$18M', b4: 'Days-in-AR excess cost', b4v: '$47M',
      fixedA: 'Prior auth automation (11 FTE)', fixedAv: 1.6, fixedB: 'Epic AI activation (license already owned)', fixedBv: 18,
      inputLabel: 'Denial rate target (current: 18.2%)', inputMin: 0, inputMax: 18, inputStep: 0.1, inputDefault: 12, inputBase: 18.2, inputBaseLabel: '18.2%', inputUnit: '%', burdenBase: 450 },
  },
  arcturus: {
    name: 'Arcturus Financial Group', industry: '$200B AUM · 180 advisors', totalBurden: '$180M', confidence: '91%',
    dataSource: 'Arcturus data loaded into AbarVa Intelligence Platform',
    intro: '"This framework is designed around one question: if advisor bandwidth were focused entirely on client relationships, what would that be worth to Arcturus\'s AUM growth and retention?"',
    cat1: { title: 'Advisor Productivity', color: '#2DD4C8', opportunity: '$42M',
      lostToday: 'Advisors spend 64% of time on prep, reporting, and admin. Only 36% on relationship work — the activity that retains AUM and wins new clients.',
      withAI: 'Pre-meeting briefs auto-generated. Portfolio narratives produced in 6 minutes. Churn alerts surface 60 days before departure. Advisors focus on relationships.',
      b1: 'Advisors in scope', b1v: '180', b2: 'Meeting prep time today', b2v: '45 min/meeting', b3: 'Estimated AUM per advisor', b3v: '$1.1B', b4: 'Admin burden (time cost)', b4v: '$42M equiv.',
      inputLabel: '% reduction in non-relationship admin', inputMax: 100, inputDefault: 25, noteDefault: 'Client relationship deepening, new AUM prospecting', burdenBase: 42 },
    cat2: { title: 'Compliance & Operations', color: '#4DA3FF', opportunity: '$22M',
      lostToday: 'Only 12% of advisor communications monitored for compliance. 68 vendors with no systematic benchmarking. Trade reconciliation takes 3 days. Onboarding takes 6 weeks.',
      withAI: 'AI surveillance covers 100% of communications. Vendor contracts benchmarked continuously. Trade breaks resolved in 4 hours. Clients onboarded in 4 days.',
      b1: 'Advisor communication coverage', b1v: '12% (manual sample)', b2: 'Annual vendor spend', b2v: '$45M across 68 vendors', b3: 'Trade break resolution time', b3v: '3 days average', b4: 'Client onboarding time', b4v: '6 weeks (industry: 4 days)',
      inputLabel: '% operational cost reduction via AI', inputMax: 100, inputDefault: 30, burdenBase: 45 },
    cat3: { title: 'AUM & Revenue Growth', color: '#6EE7B7', opportunity: '$116M',
      lostToday: 'Client churn at 13% vs 8% peer benchmark costs $588M AUM annually. Zero AI-identified prospects. Portfolio inconsistency across 180 advisors costs tax alpha and creates compliance exposure.',
      withAI: 'Churn prediction 60 days ahead. AI-identified prospect pipeline from liquidity events and RSU vesting. Consistent portfolio construction across all advisors.',
      b1: 'Annual AUM churn', b1v: '$588M (13% of base)', b2: 'AUM lost above peer benchmark', b2v: '$240M/yr excess churn', b3: 'C/I ratio vs. peer', b3v: '71% vs. 58% benchmark', b4: 'Efficiency gap', b4v: '$840M annual',
      fixedA: 'Compliance surveillance (100% coverage)', fixedAv: 18, fixedB: 'Vendor spend optimization (14% reduction)', fixedBv: 6.3,
      inputLabel: 'AUM churn rate target (current: 13%)', inputMin: 0, inputMax: 13, inputStep: 0.5, inputDefault: 9, inputBase: 13, inputBaseLabel: '13%', inputUnit: '%', burdenBase: 45 },
  },
  apexretail: {
    name: 'Apex Retail Group', industry: '380 stores · $2.8B revenue', totalBurden: '$264M', confidence: '89%',
    dataSource: 'Apex data loaded into AbarVa Intelligence Platform',
    intro: '"This framework is designed around one question: if Apex could forecast demand at the SKU level, eliminate preventable markdowns, and match labor to actual foot traffic — what would that be worth to gross margin and operating income?"',
    cat1: { title: 'Workforce & Labor Efficiency', color: '#2DD4C8', opportunity: '$38M',
      lostToday: 'Labor cost is 18% of revenue vs. 14% peer benchmark — $112M in excess. Manual scheduling across 380 stores creates overtime of 28% above benchmark and understaffing during peak hours.',
      withAI: 'Demand-driven scheduling predicts hourly traffic per store. Labor matched to forecast. Overtime eliminated. Understaffed shifts filled from part-time pool before agency calls.',
      b1: 'Stores with manual scheduling', b1v: '380 stores', b2: 'Labor cost vs. peer', b2v: '18% vs 14% of revenue', b3: 'Excess labor cost', b3v: '$112M annually', b4: 'Overtime above benchmark', b4v: '28% excess',
      inputLabel: '% excess labor cost recovered', inputMax: 100, inputDefault: 30, noteDefault: 'Store experience improvement, full-price selling, training', burdenBase: 112 },
    cat2: { title: 'Inventory & Margin Recovery', color: '#4DA3FF', opportunity: '$108M',
      lostToday: 'SKU-level forecast accuracy is 61%. $180M annual markdowns, 3 stockout events costing $42M, and clearance recovery of only 34% of original retail.',
      withAI: 'ML model achieves 86% SKU-store-week accuracy. Par levels auto-adjusted daily. Markdown engine optimizes clearance pricing by SKU. Stockouts eliminated.',
      b1: 'SKU forecast accuracy', b1v: '61% (category-level: 82%)', b2: 'Annual markdown cost', b2v: '$180M', b3: 'Stockout losses (2025)', b3v: '$42M in 3 events', b4: 'Clearance recovery rate', b4v: '34% of original retail',
      inputLabel: '% forecast accuracy improvement', inputMax: 100, inputDefault: 25, burdenBase: 180 },
    cat3: { title: 'Digital & Loyalty Revenue', color: '#6EE7B7', opportunity: '$118M',
      lostToday: 'eCommerce conversion 2.1% vs 3.4% peer benchmark. 14.5M of 22M loyalty members are dormant — single-purchase. $67M in annual shrink at 2.4% of revenue.',
      withAI: 'Real-time personalization lifts email CTR from 2.1% to 5.8%. Loyalty reactivation AI recovers 12% of dormant members. Loss prevention AI reduces shrink rate by 30%.',
      b1: 'eCommerce conversion vs. peer', b1v: '2.1% vs 3.4%', b2: 'Dormant loyalty members', b2v: '14.5M of 22M members', b3: 'Annual shrink rate', b3v: '2.4% of revenue ($67M)', b4: 'Digital revenue gap vs. peer', b4v: '$392M/yr',
      fixedA: 'Loyalty re-engagement AI (12% reactivation)', fixedAv: 14, fixedB: 'Loss prevention AI (shrink 2.4% → 1.7%)', fixedBv: 22,
      inputLabel: 'eCommerce conversion target (current: 2.1%)', inputMin: 0, inputMax: 5, inputStep: 0.1, inputDefault: 3.4, inputBase: 2.1, inputBaseLabel: '2.1%', inputUnit: '%', burdenBase: 58 },
  },
}

function ValueTemplateContent() {
  const searchParams = useSearchParams()
  void searchParams
  const clientId = useActiveClient()
  const cfg = CLIENT_VT[clientId] ?? CLIENT_VT.meridian

  // Editable state
  const [c1Pct, setC1Pct] = useState(cfg.cat1.inputDefault)
  const [c1Note, setC1Note] = useState(cfg.cat1.noteDefault)
  const [c2Pct, setC2Pct] = useState(cfg.cat2.inputDefault)
  const [c2ShiftPct, setC2ShiftPct] = useState(40)
  const [c3Target, setC3Target] = useState(cfg.cat3.inputDefault)

  // Reset defaults when client changes
  const prevClientRef = useState(clientId)
  if (prevClientRef[0] !== clientId) {
    prevClientRef[0] = clientId
    setC1Pct(cfg.cat1.inputDefault)
    setC2Pct(cfg.cat2.inputDefault)
    setC3Target(cfg.cat3.inputDefault)
  }

  // Auto-calculated
  const cat1Value = cfg.cat1.burdenBase * c1Pct / 100
  const cat2Value = cfg.cat2.burdenBase * c2Pct / 100
  const cat3Var = clientId === 'meridian'
    ? Math.max(0, (18.2 - c3Target) / 100 * cfg.cat3.burdenBase)
    : clientId === 'arcturus'
    ? Math.max(0, (13 - c3Target) / 100 * 45 * 10) // AUM fee revenue proxy
    : Math.max(0, (c3Target - 2.1) / 100 * cfg.cat3.burdenBase * 10) // conversion lift
  const cat3Value = cat3Var + cfg.cat3.fixedAv + cfg.cat3.fixedBv
  const totalClientValue = cat1Value + cat2Value + cat3Value
  const abarvaFee = totalClientValue * 0.15
  const netValue = totalClientValue - abarvaFee

  return (
    <div style={S.page}>
      <AbarvaNav />
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
              <div style={{ fontSize: '16px', color: '#2563EB', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>{cfg.name}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              {cfg.industry}<br />
              April 2026 · Prepared by AbarVa Intelligence Platform
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
          <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#3C3C3C', margin: 0, fontStyle: 'italic' }}>
            {cfg.intro}
          </p>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '32px' }}>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>Total Baseline Burden Identified</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{cfg.totalBurden} annually</div>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>{cfg.name.split(' ')[0]} Data Confidence</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{cfg.confidence}</div>
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
          <div style={S.sectionHeader(cfg.cat1.color)}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: cfg.cat1.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 1 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>{cfg.cat1.title}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: cfg.cat1.color }}>{cfg.cat1.opportunity}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where value is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>{cfg.name.split(' ')[0]} baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>{cfg.cat1.lostToday}</td>
                <td style={S.td}>{cfg.cat1.withAI}</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat1.b1}: </span><strong>{cfg.cat1.b1v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat1.b2}: </span><strong>{cfg.cat1.b2v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat1.b3}: </span><strong>{cfg.cat1.b3v}</strong></div>
                  <div style={{ marginBottom: '0', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>{cfg.cat1.b4}: </span><strong style={{ color: '#DC2626' }}>{cfg.cat1.b4v}</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0F9FF', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>{cfg.cat1.inputLabel}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={cfg.cat1.inputMax} value={c1Pct} onChange={e => setC1Pct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#3C3C3C' }}>%</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px', fontFamily: 'Inter, sans-serif' }}>Value recovered</div>
                    <div style={S.calc}>{fmt(cat1Value)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Redirected to</div>
                    <input type="text" value={c1Note} onChange={e => setC1Note(e.target.value)} style={{ ...S.inputWide, width: '100%', boxSizing: 'border-box' as const }} />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 1 total — {cfg.cat1.title.toLowerCase()}</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}><span style={S.calc}>{fmt(cat1Value)}</span><span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>at {c1Pct}% reduction</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* CATEGORY 2 — IT RUN REDUCTION */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={S.sectionHeader(cfg.cat2.color)}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: cfg.cat2.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 2 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>{cfg.cat2.title}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: cfg.cat2.color }}>{cfg.cat2.opportunity}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where value is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>{cfg.name.split(' ')[0]} baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>{cfg.cat2.lostToday}</td>
                <td style={S.td}>{cfg.cat2.withAI}</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat2.b1}: </span><strong>{cfg.cat2.b1v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat2.b2}: </span><strong>{cfg.cat2.b2v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat2.b3}: </span><strong>{cfg.cat2.b3v}</strong></div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>{cfg.cat2.b4}: </span><strong style={{ color: '#DC2626' }}>{cfg.cat2.b4v}</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0F9FF', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{cfg.cat2.inputLabel}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={cfg.cat2.inputMax} value={c2Pct} onChange={e => setC2Pct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#3C3C3C' }}>%</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Value recovered</div>
                    <div style={S.calc}>{fmt(cat2Value)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>% effort shifted to strategic work</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={0} max={100} value={c2ShiftPct} onChange={e => setC2ShiftPct(Number(e.target.value))} style={S.input} />
                      <span style={{ fontSize: '13px', color: '#3C3C3C' }}>%</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 2 total — {cfg.cat2.title.toLowerCase()}</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}><span style={S.calc}>{fmt(cat2Value)}</span><span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>at {c2Pct}% improvement</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* CATEGORY 3 — CLINICAL AND REVENUE VALUE */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={S.sectionHeader(cfg.cat3.color)}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: cfg.cat3.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Category 3 of 3</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>{cfg.cat3.title}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Identified opportunity</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 800, color: cfg.cat3.color }}>{cfg.cat3.opportunity}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '22%' }}>Where value is lost today</th>
                <th style={{ ...S.th, width: '22%' }}>What changes with AI</th>
                <th style={{ ...S.th, width: '28%' }}>{cfg.name.split(' ')[0]} baseline</th>
                <th style={{ ...S.th, width: '28%' }}>Your target impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>{cfg.cat3.lostToday}</td>
                <td style={S.td}>{cfg.cat3.withAI}</td>
                <td style={{ ...S.td, background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat3.b1}: </span><strong style={{ color: '#DC2626' }}>{cfg.cat3.b1v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat3.b2}: </span><strong>{cfg.cat3.b2v}</strong></div>
                  <div style={{ marginBottom: '6px' }}><span style={S.base}>{cfg.cat3.b3}: </span><strong>{cfg.cat3.b3v}</strong></div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}><span style={S.base}>{cfg.cat3.b4}: </span><strong style={{ color: '#DC2626' }}>{cfg.cat3.b4v}</strong></div>
                </td>
                <td style={{ ...S.td, background: '#F0FDF4', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{cfg.cat3.inputLabel}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min={cfg.cat3.inputMin} max={cfg.cat3.inputMax} step={cfg.cat3.inputStep} value={c3Target} onChange={e => setC3Target(Number(e.target.value))} style={{ ...S.input, borderColor: '#059669', background: '#F0FDF4' }} />
                      <span style={{ fontSize: '13px', color: '#3C3C3C' }}>{cfg.cat3.inputUnit}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>→ Variable impact: <strong>{fmt(cat3Var)}</strong></div>
                  </div>
                  <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>{cfg.cat3.fixedA}</div>
                    <div style={{ ...S.calc, color: '#059669' }}>{fmt(cfg.cat3.fixedAv)}</div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>{cfg.cat3.fixedB}</div>
                    <div style={{ ...S.calc, color: '#059669' }}>{fmt(cfg.cat3.fixedBv)}</div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9' }}>
                <td colSpan={3} style={{ ...S.td, fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '12px' }}>Category 3 total — {cfg.cat3.title.toLowerCase()}</td>
                <td style={{ ...S.td, fontFamily: 'Inter, sans-serif' }}>
                  <span style={S.calc}>{fmt(cat3Value)}</span>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>target {cfg.cat3.inputBaseLabel} → {c3Target}{cfg.cat3.inputUnit}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* TOTAL SUMMARY */}
        {/* ─────────────────────────────────────────── */}
        <div style={{ background: '#0C0C0C', borderRadius: '10px', padding: '28px 32px', marginBottom: '36px' }}>
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
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{cfg.cat1.title}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: cfg.cat1.color }}>{fmt(cat1Value)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{cfg.cat2.title}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: cfg.cat2.color }}>{fmt(cat2Value)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{cfg.cat3.title}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: cfg.cat3.color }}>{fmt(cat3Value)}</div>
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
              { label: 'AbarVa Outcome Fee (15%)', value: fmt(abarvaFee), sub: 'Calculated quarterly on verified savings', color: '#EF4444' },
              { label: 'Net Client Value', value: fmt(netValue), sub: 'After AbarVa fee — your return', color: '#6EE7B7' },
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
            All baseline figures sourced from {cfg.dataSource}. Target figures represent {cfg.name} leadership commitments entered above. AbarVa outcome fees are calculated quarterly against savings verified by third-party audit. This document is confidential and prepared exclusively for {cfg.name} leadership.
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
