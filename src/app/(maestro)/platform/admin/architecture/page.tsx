import { ArchitectureOverviewPage } from '@/components/admin/ArchitectureOverviewPage'
import { ArchitectureCanvas } from '@/components/admin/ArchitectureCanvas'

export const metadata = {
  title: 'Architecture Overview | Nexus Admin',
}

export default function ArchitecturePage() {
  return (
    <>
      <ArchitectureCanvas />
      <ArchitectureOverviewPage />
    </>
  )
}
