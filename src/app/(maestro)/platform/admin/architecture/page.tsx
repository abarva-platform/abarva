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
      description="System composition, trust boundaries, and integration surfaces for AbarVa."
      workflow={{
        primaryAgent: 'steward',
        pageQuestion: 'How do the major planes integrate safely and where are the current boundary risks?',
        whatIsKnown: 'Architecture sections and contracts are documented and route-mounted.',
        whatIsMissing: 'Live infra telemetry is outside this deterministic architecture surface.',
        recommendedNextAction: 'Review control/data plane boundaries and map unresolved deployment dependencies.',
        caveat: 'Deterministic architecture brief; not a runtime monitoring surface.',
      }}
    >
      <ArchitectureCanvas />
      <ArchitectureOverviewPage />
    </AdminCanonShell>
  )
}
