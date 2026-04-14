'use client'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignInInner() {
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/auth-redirect'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060A12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SignIn forceRedirectUrl={redirect} />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SignIn forceRedirectUrl="/auth-redirect" />
      </div>
    }>
      <SignInInner />
    </Suspense>
  )
}
