import { LoggedOutLandingPage } from '@/components/marketing/LoggedOutLandingPage'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Nexus | The enterprise AI operating system',
  description: 'Connect enterprise context, Anthropic Claude reasoning, governed workflows and outcome evidence. Explore the private Nexus walkthrough.',
}

export default function HomePage() {
  return <LoggedOutLandingPage />
}
