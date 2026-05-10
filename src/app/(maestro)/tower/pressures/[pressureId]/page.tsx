import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ pressureId: string }>;
}) {
  const { pressureId } = await params;
  redirect(`/tower?view=pressures&pressure=${encodeURIComponent(pressureId)}`);
}
