import type { ReactNode } from 'react'
import UseCaseWorkflowShell from '@/components/value-office/use-case/UseCaseWorkflowShell'

export default async function ValueOfficeUseCaseLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ useCaseId: string }>
}) {
  const { useCaseId } = await params
  return <UseCaseWorkflowShell useCaseId={useCaseId}>{children}</UseCaseWorkflowShell>
}
