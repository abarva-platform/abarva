import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function MoveAliasDetailPage({ params }: Props) {
  const { moveId } = await params;
  redirect(`/strategic-moves/${moveId}`);
}

