'use client'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
}

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

interface Service {
  id: string
  name: string
  description: string
  status: ServiceStatus
  uptimePct: string
  lastIncident: string | null
}

const SERVICES: Service[] = [
  { id: 'api', name: 'AI Intelligence API', description: 'Claude-powered response generation, streaming, confidence scoring', status: 'operational', uptimePct: '99.94', lastIncident: null },
  { id: 'platform', name: 'Platform (Web App)', description: 'All product pages — Situation Intelligence, AI Strategy, Marketplace, Control Tower', status: 'operational', uptimePct: '99.98', lastIncident: null },
  { id: 'data-pipeline', name: 'Data Processing Pipeline', description: 'Data ingestion, Layer 1/2/3 promotion, version tracking', status: 'operational', uptimePct: '99.91', lastIncident: null },
  { id: 'auth', name: 'Authentication (Clerk)', description: 'User login, session management, role assignment', status: 'operational', uptimePct: '100.00', lastIncident: null },
  { id: 'database', name: 'Database (Supabase)', description: 'Engagement data, org profiles, audit logs', status: 'operational', uptimePct: '99.99', lastIncident: null },
  { id: 'export', name: 'Export & Delivery', description: 'Board deck generation, Excel export, PDF rendering', status: 'operational', uptimePct: '99.87', lastIncident: null },
  { id: 'genome', name: 'Transformation Genome', description: 'Knowledge graph reads, failure pattern matching', status: 'operational', uptimePct: '99.96', lastIncident: null },
]

const INCIDENTS = [
  {
    id: 'inc-2026-003',
    date: 'Mar 28, 2026',
    title: 'Export service latency degradation',
    impact: 'Degraded',
    duration: '42 minutes',
    service: 'Export & Delivery',
    resolved: true,
    summary: 'PDF rendering pipeline experienced elevated response times (12s avg vs 2s baseline) due to memory pressure in the rendering container. Resolved by scaling container count.',
  },
  {
    id: 'inc-2026-002',
    date: 'Mar 12, 2026',
    title: 'AI API streaming interruption',
    impact: 'Partial outage',
    duration: '8 minutes',
    service: 'AI Intelligence API',
    resolved: true,
    summary: 'Anthropic API rate limit hit during concurrent demo sessions. Queuing logic deployed — subsequent sessions resume from partial response. Full response replay added.',
  },
  {
    id: 'inc-2026-001',
    date: 'Feb 4, 2026',
    title: 'Scheduled maintenance — database migration',
    impact: 'Maintenance',
    duration: '22 minutes',
    service: 'Database',
    resolved: true,
    summary: 'Planned Supabase migration to add three-layer data model schema. Completed within maintenance window. No data loss.',
  },
]

const UPTIME_HISTORY = [
  { month: 'Oct \'25', pct: 100 },
  { month: 'Nov \'25', pct: 99.9 },
  { month: 'Dec \'25', pct: 100 },
  { month: 'Jan \'26', pct: 99.97 },
  { month: 'Feb \'26', pct: 99.94 },
  { month: 'Mar \'26', pct: 99.91 },
]

function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    operational: { label: 'Operational', color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', dot: '#059669' },
    degraded: { label: 'Degraded', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
    outage: { label: 'Outage', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
    maintenance: { label: 'Maintenance', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', dot: '#6366F1' },
  }
  const c = cfg[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: c.color, background: c.bg, border: '1px solid ' + c.border, padding: '3px 10px', borderRadius: '10px' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  )
}

export default function StatusPage() {
  const [now, setNow] = useState('')

  useEffect(() => {
    setNow(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }))
  }, [])

  const allOperational = SERVICES.every(s => s.status === 'operational')

  return (
    <div style={S.page}>
      <AbarvaNav />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Platform Status</h1>
          {now && <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>Updated: {now}</p>}
        </div>

        {/* Overall status banner */}
        <div style={{ padding: '20px 24px', borderRadius: '12px', background: allOperational ? '#F0FDF4' : '#FFFBEB', border: '1px solid ' + (allOperational ? '#A7F3D0' : '#FDE68A'), marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: allOperational ? '#059669' : '#D97706', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: allOperational ? '#065F46' : '#92400E' }}>
              {allOperational ? 'All systems operational' : 'Some systems experiencing issues'}
            </div>
            <div style={{ fontSize: '13px', color: allOperational ? '#059669' : '#D97706', marginTop: '2px' }}>
              {allOperational ? `${SERVICES.length} services healthy · No active incidents` : 'Check service status below'}
            </div>
          </div>
        </div>

        {/* Service list */}
        <div style={{ ...S.card, marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Services</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {SERVICES.map((svc, i) => (
              <div key={svc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < SERVICES.length - 1 ? '1px solid #F1F5F9' : 'none', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{svc.name}</div>
                  <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '2px' }}>{svc.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{svc.uptimePct}%</div>
                    <div style={{ fontSize: '11px', color: '#888888' }}>30-day uptime</div>
                  </div>
                  <StatusBadge status={svc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime history chart */}
        <div style={{ ...S.card, marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Uptime History</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
            {UPTIME_HISTORY.map((m, i) => {
              const height = Math.max(8, ((m.pct - 99.5) / 0.5) * 60 + 8)
              const color = m.pct === 100 ? '#059669' : m.pct >= 99.9 ? '#34D399' : '#D97706'
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '80px', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color }}>{m.pct}%</div>
                  <div style={{ width: '100%', height: height + 'px', background: color, borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: '10px', color: '#888888', whiteSpace: 'nowrap' }}>{m.month}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Incident history */}
        <div style={S.card}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Incident History</div>
          {INCIDENTS.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#888888', padding: '16px 0' }}>No incidents in the past 90 days.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {INCIDENTS.map(inc => (
                <div key={inc.id} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{inc.title}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#F0FDF4', padding: '1px 7px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>Resolved</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#888888' }}>{inc.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#3C3C3C' }}>Service: <strong style={{ color: '#3C3C3C' }}>{inc.service}</strong></span>
                    <span style={{ fontSize: '12px', color: '#3C3C3C' }}>Impact: <strong style={{ color: '#3C3C3C' }}>{inc.impact}</strong></span>
                    <span style={{ fontSize: '12px', color: '#3C3C3C' }}>Duration: <strong style={{ color: '#3C3C3C' }}>{inc.duration}</strong></span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{inc.summary}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#CBD5E1' }}>
            Subscribe to status updates at <a href="mailto:status@abarva.ai" style={{ color: '#4DA3FF', textDecoration: 'none' }}>status@abarva.ai</a>
          </p>
        </div>
      </div>
    </div>
  )
}
