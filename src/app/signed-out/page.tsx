import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Signed out · AbarVa',
  robots: { index: false, follow: false },
}

export default function SignedOutPage() {
  redirect('/')
}
