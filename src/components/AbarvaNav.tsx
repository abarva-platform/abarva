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
          <div style={{ width: '28px', height: '28px', background: '#111827', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800 }}>A</span>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Abarva</span>
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
