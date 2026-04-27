import { ArchitectureOverviewPage } from '@/components/admin/ArchitectureOverviewPage'
import { ArchitectureCanvas } from '@/components/admin/ArchitectureCanvas'
import { AdminCanonShell } from '@/components/admin/AdminCanonShell'

export const metadata = {
  title: 'Architecture Overview | Nexus Admin',
}

export default function ArchitecturePage() {
  return (
    <AdminCanonShell
      eyebrow="Platform · Architecture"
      title="Architecture Overview"
      description="System composition, trust boundaries, and integration surfaces for AbarVa. ATLAS · ARCHITECTURE LEAD"
      workflow={{
        primaryAgent: 'atlas',
        pageQuestion: 'How does AbarVa work end to end, and how does it support SaaS plus private data plane?',
        whatIsKnown: 'App, context, knowledge, and data planes are built. ARCH5 manifest — 9 planes documented.',
        whatIsMissing: 'Live model gateway routing, live tool execution, Azure private data plane deployment.',
        recommendedNextAction: 'Wire model gateway for live agent routing. Deploy Azure private data plane lab.',
        caveat: 'ARCH5 manifest — static documentation. Not live topology scan.',
      }}
    >
      <ArchitectureCanvas />
      <ArchitectureOverviewPage />
    </AdminCanonShell>
  )
}
