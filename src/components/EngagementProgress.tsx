'use client'
import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense } from 'react'

const STEPS = [
  { label: 'Strategy', href: '/ai-strategy' },
  { label: 'Diagnose', href: '/diagnose' },
  { label: 'Justify', href: '/justify' },
  { label: 'Select', href: '/select' },
  { label: 'Track', href: '/outcomes' },
  { label: 'Optimize', href: '/control-tower' },
]

type StepStatus = 'completed' | 'active' | 'next' | 'inactive'

function getStatus(idx: number, activeIdx: number): StepStatus {
  if (idx < activeIdx) return 'completed'
  if (idx === activeIdx) return 'active'
  if (idx === activeIdx + 1) return 'next'
  return 'inactive'
}

function statusIcon(s: StepStatus) {
  if (s === 'completed') return '✓'
  if (s === 'active') return '◐'
  if (s === 'next') return '→'
  return '○'
}

function statusColor(s: StepStatus) {
  if (s === 'completed') return '#059669'
  if (s === 'active') return '#2DD4C8'
  if (s === 'next') return '#6B9FD4'
  return '#888888'
}

function ProgressBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const clientId = searchParams.get('client')

  // Only show when a client is selected
  if (!clientId) return null

  const activeIdx = STEPS.findIndex(s => pathname.startsWith(s.href))
  // Don't show on pages not in the journey
  if (activeIdx === -1) return null

  return (
    <div style={{
      position: 'sticky',
      top: '64px',
      zIndex: 40,
      background: '#0D1117',
      borderBottom: '1px solid #1E2D3D',
      padding: '0 32px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '0',
    }}>
      {STEPS.map((step, i) => {
        const status = getStatus(i, activeIdx)
        const color = statusColor(status)
        const href = step.href + '?client=' + clientId

        return (
          <a
            key={step.label}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              height: '40px',
              fontSize: '12px',
              fontWeight: status === 'active' ? 700 : 500,
              color,
              textDecoration: 'none',
              borderBottom: status === 'active' ? '2px solid ' + color : '2px solid transparent',
              transition: 'color 150ms, border-color 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (status !== 'active') {
                (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={e => {
              if (status !== 'active') {
                (e.currentTarget as HTMLAnchorElement).style.color = color
              }
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700 }}>{statusIcon(status)}</span>
            {step.label}
            {i < STEPS.length - 1 && (
              <span style={{ marginLeft: '14px', color: '#2D3B4E', fontSize: '16px', fontWeight: 300 }}>|</span>
            )}
          </a>
        )
      })}
    </div>
  )
}

export default function EngagementProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  )
}
