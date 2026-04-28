import { ProgramScopePage } from '@/components/tower/ProgramScopePage';
import { AiProgramDetailPage } from '@/components/tower/AiProgramDetailPage';

interface Props {
  params: Promise<{ programId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { programId } = await params;
  return { title: `${programId} · Control Tower` };
}

export default async function TowerProgramRoute({ params }: Props) {
  const { programId } = await params;
  // AI portfolio programs (Tower Wave T3) vs legacy Nexus program scope
  if (programId.startsWith('twr-prog-')) {
    return <AiProgramDetailPage programId={programId} />;
  }
  return <ProgramScopePage />;
}
