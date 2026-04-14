'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'

const C = {
  bg: '#0D1117',
  surface: '#161B22',
  border: '#21262D',
  text: '#E6EDF3',
  text2: '#8B949E',
  red: '#EF4444',
  redBg: 'rgba(239,68,68,0.08)',
  teal: '#2DD4C8',
  tealBg: 'rgba(45,212,200,0.08)',
  amber: '#F59E0B',
  amberBg: 'rgba(245,158,11,0.08)',
  green: '#10B981',
}

type ClientId = 'meridian' | 'firstcapital' | 'apexretail'

function getClientData(clientId: ClientId) {
  if (clientId === 'firstcapital') return {
    name: 'First Capital Financial',
    industry: 'Financial Services',
    issues: [
      {
        title: '$340M deposit at risk — FedNow ultimatum',
        metric: '3 commercial clients: 90-day deadline issued',
        implication: 'FedNow live by April 2026 or lose deposits — FIS HORIZON blocks implementation',
      },
      {
        title: 'Cost-to-income 68% vs 55% target',
        metric: '$84M in excess structural cost annually',
        implication: 'Peer median 58% — $64M/yr competitive disadvantage on cost structure',
      },
      {
        title: '3 open OCC MRAs — examiner returns Q2 2026',
        metric: 'AML, technology risk, data governance all open',
        implication: 'Formal enforcement action risk if not closed — $8.5M penalty exposure',
      },
    ],
    portfolio: {
      initiatives: 3,
      governanceScore: 42,
      valueIdentified: '$198M',
    },
    nextMilestone: {
      action: 'FedNow vendor decision required',
      deadline: '2026-04-01',
      urgencyDays: 80,
    },
    deepDiveUrl: '/diagnose?client=firstcapital',
  }

  if (clientId === 'apexretail') return {
    name: 'Apex Retail Group',
    industry: 'Retail',
    issues: [
      {
        title: 'Einstein AI activated — $248M value blocked',
        metric: '$34M/yr Salesforce contract — personalization never turned on',
        implication: '340,000 duplicate CDP profiles is the only blocker — 90-day fix available',
      },
      {
        title: 'SAP ECC end of support 2027 — decision overdue',
        metric: '$8M/yr extended support fees compounding',
        implication: 'S/4HANA $180M vs MS Dynamics $85M vs Tier-2 $42M — choice needed now',
      },
      {
        title: '$800M trapped in excess inventory',
        metric: 'Inventory turns 4.2x vs 6.8x benchmark — 87 days on hand',
        implication: 'Demand forecasting at 61% accuracy — AI fix delivers 84%+ at peers',
      },
    ],
    portfolio: {
      initiatives: 4,
      governanceScore: 38,
      valueIdentified: '$624M',
    },
    nextMilestone: {
      action: 'SAP migration path decision for board',
      deadline: '2026-06-01',
      urgencyDays: 49,
    },
    deepDiveUrl: '/diagnose?client=apexretail',
  }

  // Default: Meridian
  return {
    name: 'Meridian Health System',
    industry: 'Healthcare',
    issues: [
      {
        title: '$94M in RCM denial write-offs annually',
        metric: 'Denial rate 18.2% — 6 points above benchmark',
        implication: 'Ensemble Health Partners SLA breach — $8M in penalties never enforced',
      },
      {
        title: 'Operating margin 1.8% — board target 4%',
        metric: '$94M gap — third consecutive miss — covenant risk at 1.5%',
        implication: 'Board patience exhausted — two members privately escalated to chair',
      },
      {
        title: 'Epic optimization at 58/100 after 7 years',
        metric: '34% of clinical documentation in workarounds',
        implication: 'Prior auth AI module already purchased — 23% deployed, 77% idle',
      },
    ],
    portfolio: {
      initiatives: 4,
      governanceScore: 47,
      valueIdentified: '$288M',
    },
    nextMilestone: {
      action: 'Prior auth AI go-live — CMS deadline',
      deadline: '2026-01-15',
      urgencyDays: 12,
    },
    deepDiveUrl: '/diagnose?client=meridian',
  }
}

function urgencyColor(days: number) {
  if (days < 30) return C.red
  if (days < 90) return C.amber
  return C.green
}

function BriefContent() {
  const params = useSearchParams()
  const clientId = (params.get('client') || 'meridian') as ClientId
  const data = getClientData(clientId)
  const now = new Date()
  const timestamp = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: C.text,
      padding: '0',
    }}>
      <AbarvaNav />
      {/* Header */}
      <div style={{
        background: C.surface,
        borderBottom: '1px solid ' + C.border,
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Abar</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '21px', fontWeight: 900, color: '#2DD4C8' }}>Va</span>
          </div>
          <span style={{ fontSize: '11px', color: C.text2, background: C.border, border: '1px solid #30363D', borderRadius: '4px', padding: '2px 8px' }}>
            {data.industry}
          </span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>{data.name}</div>
        <div style={{ fontSize: '12px', color: C.text2 }}>Executive Intelligence Brief · {timestamp}</div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Critical Issues */}
        <section>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> Critical Issues
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.issues.map((issue, i) => (
              <div key={i} style={{
                background: C.redBg,
                border: '1px solid rgba(239,68,68,0.2)',
                borderLeft: '3px solid ' + C.red,
                borderRadius: '8px',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>{issue.title}</div>
                <div style={{ fontSize: '12px', color: C.text2, marginBottom: '4px' }}>{issue.metric}</div>
                <div style={{ fontSize: '12px', color: '#FDA4AF', lineHeight: 1.4 }}>{issue.implication}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Portfolio Snapshot */}
        <section>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> Portfolio Snapshot
          </div>
          <div style={{
            background: C.tealBg,
            border: '1px solid rgba(45,212,200,0.2)',
            borderRadius: '8px',
            padding: '14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: C.teal }}>{data.portfolio.initiatives}</div>
              <div style={{ fontSize: '11px', color: C.text2 }}>Active AI initiatives</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: C.teal }}>{data.portfolio.governanceScore}/100</div>
              <div style={{ fontSize: '11px', color: C.text2 }}>AI governance score</div>
            </div>
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid ' + C.border, paddingTop: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF' }}>{data.portfolio.valueIdentified}</div>
              <div style={{ fontSize: '11px', color: C.text2 }}>Identified value — AI investment intelligence</div>
            </div>
          </div>
        </section>

        {/* Next Milestone */}
        <section>
          <div style={{ fontSize: '10px', fontWeight: 700, color: urgencyColor(data.nextMilestone.urgencyDays), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> Next Milestone
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid ' + C.border,
            borderLeft: '3px solid ' + urgencyColor(data.nextMilestone.urgencyDays),
            borderRadius: '8px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: C.text, marginBottom: '6px' }}>{data.nextMilestone.action}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: C.text2 }}>
                {new Date(data.nextMilestone.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: urgencyColor(data.nextMilestone.urgencyDays),
                background: data.nextMilestone.urgencyDays < 30 ? C.redBg : data.nextMilestone.urgencyDays < 90 ? C.amberBg : C.tealBg,
                border: '1px solid ' + urgencyColor(data.nextMilestone.urgencyDays) + '40',
                borderRadius: '4px',
                padding: '2px 8px',
              }}>
                {data.nextMilestone.urgencyDays} days
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <a
          href={data.deepDiveUrl}
          style={{
            display: 'block',
            background: C.teal,
            color: '#0D1117',
            textDecoration: 'none',
            borderRadius: '10px',
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          Open full analysis →
        </a>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: C.text2, paddingBottom: '20px' }}>
          Generated by AbarVa Intelligence Platform
        </div>
      </div>
    </div>
  )
}

export default function BriefPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#8B949E', fontSize: '14px' }}>Loading brief...</span>
      </div>
    }>
      <BriefContent />
    </Suspense>
  )
}
