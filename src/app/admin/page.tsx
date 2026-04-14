'use client'
import { useState } from 'react'
import Link from 'next/link'

// ─── Design system ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  text: '#EFF6FF', text2: '#94A3B8',
  teal: '#2DD4C8', amber: '#F59E0B', green: '#10B981',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

// ─── Engagement list (names + status only — no data) ──────────────────────────
const ENGAGEMENTS = [
  { id: 'meridian',     name: 'Meridian Health System',   vertical: 'Healthcare',         started: 'Mar 15, 2026',   status: 'active' as const },
  { id: 'firstcapital', name: 'First Capital Financial',  vertical: 'Financial Services', started: 'Mar 28, 2026',   status: 'active' as const },
  { id: 'apexretail',   name: 'Apex Retail Group',        vertical: 'Retail',             started: 'April 2, 2026',  status: 'active' as const },
  { id: 'riverside',    name: 'Riverside Medical Center', vertical: 'Healthcare',         started: 'April 13, 2026', status: 'setup'  as const },
]

function EngagementRow({ e }: { e: typeof ENGAGEMENTS[number] }) {
  const [hov, setHov] = useState(false)
  const pill = e.status === 'active'
    ? { bg: 'rgba(45,212,200,0.12)', color: '#2DD4C8', label: 'Active' }
    : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', label: 'Setup' }

  return (
    <Link href={`/admin/client/${e.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: T.surface, border: '1px solid ' + (hov ? T.teal : T.border),
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', transition: 'border-color 150ms', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: e.status === 'active' ? T.green : T.amber,
            boxShadow: `0 0 8px ${e.status === 'active' ? T.green : T.amber}50`,
          }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: T.text, fontFamily: T.sans, marginBottom: '2px' }}>
              {e.name}
            </div>
            <div style={{ fontSize: '12px', color: T.text2, fontFamily: T.sans }}>
              {e.vertical} · Lead Maestro · Started {e.started}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            background: pill.bg, color: pill.color,
            borderRadius: '20px', padding: '3px 10px', fontFamily: T.sans,
          }}>
            {pill.label}
          </span>
          <span style={{ fontSize: '18px', color: hov ? T.teal : T.text2, transition: 'color 150ms', lineHeight: 1 }}>›</span>
        </div>
      </div>
    </Link>
  )
}

export default function AdminPage() {
  return (
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>

      {/* Content */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Section heading */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, color: T.teal,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: T.mono, marginBottom: '10px',
          }}>
            SELECT ENGAGEMENT
          </div>
          <div style={{ fontSize: '13px', color: T.text2, lineHeight: 1.7, fontFamily: T.sans }}>
            You will enter that client&apos;s secure environment.<br />
            No other client data is visible once inside.
          </div>
        </div>

        {/* Engagement rows */}
        {ENGAGEMENTS.map(e => <EngagementRow key={e.id} e={e} />)}

        {/* New engagement */}
        <div style={{
          marginTop: '8px', border: '1px dashed ' + T.border,
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', color: T.text2,
        }}>
          <span style={{ fontSize: '20px', color: T.teal, lineHeight: 1, fontWeight: 300 }}>+</span>
          <span style={{ fontSize: '13px', fontFamily: T.sans }}>Start a new engagement</span>
        </div>

        {/* Privacy note */}
        <div style={{ marginTop: '52px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: 1.5 }}>🔒</span>
          <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.7, textAlign: 'center' }}>
            Each engagement is a fully isolated environment.<br />
            No data crosses between clients. All access is logged.
          </div>
        </div>
      </div>
    </div>
  )
}
