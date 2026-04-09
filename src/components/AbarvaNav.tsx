'use client'
import { useUser, UserButton } from '@clerk/nextjs'

const CLIENTS = [
  { id: 'meridian', name: 'Meridian Health' },
  { id: 'firstcapital', name: 'First Capital' },
  { id: 'apexretail', name: 'Apex Retail' },
]

interface AbarvaNavProps {
  clientId: string
  onClientChange?: (clientId: string) => void
  activePage?: string
  showAdmin?: boolean
}

export default function AbarvaNav({ clientId, onClientChange, activePage, showAdmin = true }: AbarvaNavProps) {
  const { user } = useUser()

  function switchClient(id: string) {
    if (onClientChange) onClientChange(id)
    else window.location.href = `/?client=${id}`
  }

  return (
    <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', height: '56px', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, justifyContent: 'space-between' }}>

      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="8" x2="14" y2="14" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="14" y1="14" x2="20" y2="8" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="14" y1="14" x2="20" y2="20" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="8" y1="8" x2="4" y2="16" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="20" y1="20" x2="14" y2="24" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#1B4FD8" />
            <circle cx="20" cy="8" r="2" fill="#94A3B8" />
            <circle cx="14" cy="14" r="2.5" fill="#0F172A" />
            <circle cx="20" cy="20" r="2" fill="#94A3B8" />
            <circle cx="4" cy="16" r="1.5" fill="#CBD5E1" />
            <circle cx="14" cy="24" r="1.5" fill="#CBD5E1" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Abar<span style={{ color: '#1B4FD8' }}>VA</span></span>
            <span style={{ fontSize: '9px', fontWeight: 400, color: '#94A3B8', fontFamily: 'monospace', letterSpacing: '0.02em', lineHeight: 1 }}>Enterprise AI Operating System</span>
          </div>
        </a>
        <div style={{ width: '1px', height: '20px', background: '#E5E7EB' }} />
        {CLIENTS.map(c => (
          <button key={c.id} onClick={() => switchClient(c.id)}
            style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: clientId === c.id ? 'none' : '1px solid #E5E7EB', background: clientId === c.id ? '#111827' : '#F9FAFB', color: clientId === c.id ? '#fff' : '#6B7280', transition: 'all 0.12s' }}>
            {c.name}
          </button>
        ))}
        <a href="/admin" style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#F0FDF4', color: '#059669', border: '1px solid #D1FAE5' }}>+ New Client</a>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/investor" style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', background: '#111827', color: '#fff' }}>Investor View</a>
        <a href="/admin" style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: activePage === 'admin' ? '#EFF6FF' : '#F9FAFB', color: activePage === 'admin' ? '#1B4FD8' : '#6B7280', border: '1px solid #E5E7EB' }}>Maestro Admin</a>
        <div style={{ width: '1px', height: '20px', background: '#E5E7EB' }} />
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#EFF6FF', color: '#1B4FD8' }}>Maestro</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{user?.firstName}</span>
        <UserButton />
      </div>
    </nav>
  )
}
