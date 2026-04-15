'use client'
import { Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'

const DECKS: Record<string, { client: string, title: string, color: string, slides: Array<{ number: number, title: string, subtitle: string, content: string[] }> }> = {
  meridian: {
    client: 'Meridian Health System',
    title: 'AI Transformation Board Presentation',
    color: '#1B4FD8',
    slides: [
      { number: 1, title: 'Executive Summary', subtitle: 'The opportunity in one page', content: ['$292M in annual value identified from Meridian data', '$94M in RCM denial revenue is recoverable within 12 months', 'CMS prior auth mandate creates $1M/day penalty risk starting Jan 2026', 'AbarVa recommendation: 3 Wave AI program at $48M investment, 6.1x ROI'] },
      { number: 2, title: 'Current State Diagnosis', subtitle: 'What AbarVa found in your data', content: ['Operating margin 1.8% vs 4% board target — $246M gap', 'RCM denial rate 18.2% vs 12% contract SLA — $8M in uncollected penalties', 'Epic optimization 58/100 — 7 years post-implementation, 12 of 47 Cogito dashboards live', 'Travel nurse cost $142M annually — $74M above benchmark'] },
      { number: 3, title: 'The Critical Decision', subtitle: 'Three decisions this quarter', content: ['Decision 1: Enforce Ensemble SLA penalties ($8M) — or begin parallel RCM evaluation', 'Decision 2: Hire full-time CDO — role vacant 8 months, blocking $94M pipeline', 'Decision 3: Fund prior auth automation NOW — CMS mandate is 8 months away', 'All three are connected — CDO owns the AI program, Ensemble leverage funds it'] },
      { number: 4, title: 'Wave 1 — Quick Wins', subtitle: 'Months 1-6 · $68M annual value', content: ['Prior Auth Automation: $28M · Cohere Health · Epic-native · 6 months', 'RCM Denial Reduction: $37M · Ensemble renegotiation + Waystar parallel track', 'CDO Hire: unlocks entire AI pipeline · 4-month executive search', 'Total Wave 1 investment: $6.2M · Payback: 1.1 months after go-live'] },
      { number: 5, title: 'Wave 2 — Scale AI', subtitle: 'Months 7-12 · $142M annual value', content: ['Epic AI Activation: DAX Copilot for 820 physicians · $18M/year recovered capacity', 'Sepsis AI Enterprise Scale: 23 hospitals from 2 · $24M cost avoidance', 'Predictive Readmission: 14.2% → 12.1% target · $28M cost reduction', 'Data Platform: Databricks on Azure — hard dependency for ML at scale'] },
      { number: 6, title: 'Wave 3 — Transform', subtitle: 'Months 13-18 · $82M annual value', content: ['MA Star Rating: 3.5 → 4.0+ · $34M in bonus revenue', 'Workforce AI: Travel nurse dependency from $142M to $90M benchmark', 'Predictive Operations: OR scheduling, capacity management, discharge planning', 'Blue Ridge Integration: Complete Cerner migration — 8 months overdue'] },
      { number: 7, title: 'Financial Summary', subtitle: '18-month program economics', content: ['Total investment: $48M over 18 months', 'Total annual value: $292M at program maturity', 'Blended ROI: 6.1x · Payback period: 7.2 months', 'McKinsey equivalent: $12M for this analysis · AbarVa cost: $180K'] },
      { number: 8, title: 'Vendor Recommendations', subtitle: 'Source-based intelligence, not vendor pitches', content: ['Prior Auth: Cohere Health over Waystar — Epic-native, 94% ML accuracy, faster', 'Documentation AI: Nuance DAX over Augmedix — Epic-native, 91% physician satisfaction', 'Data Platform: Databricks over Snowflake — ML model training, streaming clinical data', 'RCM: Enforce Ensemble penalties first · Re-platform only if renegotiation fails'] },
      { number: 9, title: 'Risk Register', subtitle: 'What could go wrong — and how to mitigate', content: ['Risk 1: Wrong CDO hire — mitigation: 90-day contract re-opener clause with AI vendors', 'Risk 2: Ensemble retaliation on penalty enforcement — mitigation: parallel Waystar RFP', 'Risk 3: Epic activation stalls — mitigation: name SI leads in contract, milestone payments', 'Risk 4: Board loses patience — mitigation: Wave 1 results visible by Month 3'] },
      { number: 10, title: 'Board Decision Request', subtitle: 'Three approvals needed today', content: ['Approve $6.2M Wave 1 program budget — 1.1 month payback', 'Authorize Ensemble SLA penalty enforcement — $8M recovery', 'Greenlight CDO search — $500K total cost, $94M at stake', 'Next steps: AbarVa delivers detailed vendor selection in 2 weeks'] },
    ],
  },
  firstcapital: {
    client: 'First Capital Financial',
    title: 'AI & Modernization Board Presentation',
    color: '#6D28D9',
    slides: [
      { number: 1, title: 'Executive Summary', subtitle: 'The opportunity', content: ['$91M in annual value identified from First Capital data', 'Cost-to-income at 68% — highest in 5-year history', 'FedNow gap is an active deposit risk: 68% of peers live', 'AbarVa recommendation: 3-phase modernization at $28M investment'] },
      { number: 2, title: 'Current State', subtitle: 'AbarVa diagnosis', content: ['Cost-to-income: 68% vs 55% target and 61% peer median', 'Digital adoption: 41% vs 67% benchmark — 1.8M customers seeing yesterday balances', 'AML false positive rate: 78% vs 25% benchmark — 6 FTE manual review', 'Core banking: FIS HORIZON 22 years old — 87% peak capacity'] },
      { number: 3, title: 'Decision', subtitle: 'Q2 priorities', content: ['FedNow: 90-day activation via Finzly — $340M commercial deposit risk', 'AML: Actimize upgrade — 2 versions behind, OCC MRA deadline', 'Digital: Fix T+1 balance bug in Q2 Platform — 1.8M customers affected', 'Core banking: Begin Temenos evaluation — board decision needed by Q3'] },
    ],
  },
  apexretail: {
    client: 'Apex Retail Group',
    title: 'AI & Digital Transformation Board Presentation',
    color: '#047857',
    slides: [
      { number: 1, title: 'Executive Summary', subtitle: 'The opportunity', content: ['$1.27B in annual value identified from Apex data', '$248M Einstein personalization — already licensed, never activated', 'Cart abandonment recovery: $840M opportunity at 72% vs 58% benchmark', 'AbarVa recommendation: Activate Einstein NOW before any new vendor spend'] },
      { number: 2, title: 'Current State', subtitle: 'AbarVa diagnosis', content: ['Operating margin: 3.8% vs 6% target — $280M gap', 'Inventory turnover: 4.2x vs 6.8x benchmark — $180M excess inventory', 'Loyalty active rate: 42% vs 68% benchmark — 14.5M inactive members', 'Personalization: $0 invested in activation despite $248M opportunity identified'] },
      { number: 3, title: 'Decision', subtitle: 'Q2 priorities', content: ['Einstein activation: $800K investment, $248M opportunity — approve NOW', 'Segment CDP: Fix identity resolution (2 weeks, $0 cost) before Einstein activates', 'Cart abandonment: Salesforce Commerce Cloud page speed — $48M per second of load time', 'SAP migration: Board decision needed by Q3 2026 — support ends 2027'] },
    ],
  },
}

function BoardDeckContent() {
  const { clientId } = useClientContext()
  const deck = DECKS[clientId] || DECKS.meridian

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <AbarvaNav activePage="board-deck" />

      {/* Header */}
      <div style={{ background: '#111827', borderBottom: '1px solid #21262D', padding: '24px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Board Presentation</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.02em', marginBottom: '4px' }}>{deck.client}</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>{deck.title} · {deck.slides.length} slides · Every number sourced from client data</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ padding: '10px 20px', borderRadius: '8px', background: '#21262D', border: '1px solid #30363D', fontSize: '13px', fontWeight: 600, color: '#6B7280', cursor: 'default' }}>
              Export PowerPoint →
            </div>
          </div>
        </div>
      </div>

      {/* Slides */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deck.slides.map((slide, i) => (
            <div key={i} style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', overflow: 'hidden', borderLeft: '4px solid ' + deck.color }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0' }}>
                {/* Slide number */}
                <div style={{ background: deck.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: deck.color }}>{slide.number}</div>
                </div>
                {/* Content */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3' }}>{slide.title}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>{slide.subtitle}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {slide.content.map((line, j) => (
                      <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ color: deck.color, fontSize: '12px', flexShrink: 0, marginTop: '3px', fontWeight: 700 }}>→</span>
                        <span style={{ fontSize: '13px', color: '#C9D1D9', lineHeight: 1.6 }}>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '32px', padding: '24px', background: '#111827', border: '1px solid #21262D', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3', marginBottom: '4px' }}>Generated by AbarVa in minutes. McKinsey takes 16 weeks.</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Every number on every slide is sourced from actual {deck.client} data.</div>
          </div>
          <a href={'/ai-strategy?client=' + clientId} style={{ padding: '12px 24px', borderRadius: '8px', background: deck.color, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, marginLeft: '16px' }}>
            Back to AI Strategy →
          </a>
        </div>
      </div>
    </div>
  )
}

export default function BoardDeckPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Loading...</div>}>
      <BoardDeckContent />
    </Suspense>
  )
}
