import { Suspense, type ReactNode } from 'react'
import ValueOfficeShell from '@/components/value-office/ValueOfficeShell'

export const metadata = {
  title: 'AI Value Office',
  description: 'AbarVa AI Value Office workspace for advisory, value design, evidence operations, and executive review.',
}

export default function ValueOfficeLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F4EFE6' }} />}>
      <ValueOfficeShell>{children}</ValueOfficeShell>
    </Suspense>
  )
}
