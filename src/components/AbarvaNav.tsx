'use client'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Client {
  id: string
  name: string
  confidence: number
  isBuiltIn: boolean
}

const BUILT_IN_CLIENTS: Client[] = [
  { id: 'meridian', name: 'Meridian Health', confidence: 94, isBuiltIn: true },
  { id: 'firstcapital', name: 'First Capital', confidence: 88, isBuiltIn: true },
  { id: 'apexretail', name: 'Apex Retail', confidence: 86, isBuiltIn: true },
]

interface AbarvaNavProps {
  clientId: string
  onClientChange?: (clientId: string) => void
  activePage?: string
  showAdmin?: boolean
}

export default function AbarvaNav({ clientId, onClientChange, activePage, showAdmin = true }: AbarvaNavProps) {
  const { user } = useUser()
  const [extraClients, setExtraClients] = useState<Client[]>([])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('clients').select('id, name')
        if (data) {
          const extra = data
            .filter(c => !BUILT_IN_CLIENTS.find(b => b.id === c.id))
            .map(c => ({ id: c.id, name: c.name.length > 16 ? c.name.substring(0, 16) + '...' : c.name, confidence: 23, isBuiltIn: false }))
          setExtraClients(extra)
        }
      } catch {}
    }
    load()
  }, [])

  function switchClient(id: string) {
    if (onClientChange) {
      onClientChange(id)
    } else {
      window.location.href = `/?client=${id}`
    }
  }

  return (
    <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', height: '56px', display: 'flex', alignItems: 'center', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>A</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Abarva</span>
        </a>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {BUILT_IN_CLIENTS.map(c => (
            <button key={c.id} onClick={() => switchClient(c.id)} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: clientId === c.id ? 'none' : '1px solid #E2E8F0', background: clientId === c.id ? '#2563EB' : '#F8FAFC', color: clientId === c.id ? '#FFFFFF' : '#475569' }}>
              {c.name}
            </button>
          ))}
          {extraClients.map(c => (
            <button key={c.id} onClick={() => switchClient(c.id)} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: clientId === c.id ? 'none' : '1px solid #E2E8F0', background: clientId === c.id ? '#7C3AED' : '#F8FAFC', color: clientId === c.id ? '#FFFFFF' : '#475569' }}>
              {c.name}
            </button>
          ))}
          <a href="/search" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#F0FDF4', color: '#059669', border: '1px solid #D1FAE5' }}>+ New</a>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showAdmin && (
          <a href="/admin" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: activePage === 'admin' ? '#EFF6FF' : '#F8FAFC', color: activePage === 'admin' ? '#2563EB' : '#475569', border: '1px solid #E2E8F0' }}>
            Maestro Admin
          </a>
        )}
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EFF6FF', color: '#2563EB' }}>Maestro</span>
        <span style={{ fontSize: '13px', color: '#475569' }}>{user?.firstName}</span>
        <UserButton />
      </div>
    </nav>
  )
}
