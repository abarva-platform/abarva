'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/client/arcturus')
  }, [router])
  return (
    <div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#94A3B8', fontSize: '13px' }}>Loading workspace…</div>
    </div>
  )
}
