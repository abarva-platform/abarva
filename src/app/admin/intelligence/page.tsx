'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Redirect() {
  const searchParams = useSearchParams()
  const client = searchParams.get('client') || 'meridian'
  if (typeof window !== 'undefined') window.location.href = `/intelligence?client=${client}`
  return <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#3C3C3C' }}>Redirecting...</div>
}

export default function AdminIntelligence() {
  return <Suspense fallback={<div>Loading...</div>}><Redirect /></Suspense>
}
