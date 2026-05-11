import type { Metadata } from 'next'
import { LoggedOutLandingPage } from '@/components/marketing/LoggedOutLandingPage'

export const metadata: Metadata = {
  title: 'Signed out · AbarVa',
  robots: { index: false, follow: false },
}

export default function SignedOutPage() {
  return <LoggedOutLandingPage signedOut />
}
