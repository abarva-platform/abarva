import { redirect } from 'next/navigation'

export default async function ValueOfficeUseCaseIndexPage({
  params,
}: {
  params: Promise<{ useCaseId: string }>
}) {
  const { useCaseId } = await params
  redirect(`/value-office/${useCaseId}/overview`)
}
