import { BuildProgressDashboard } from '@/components/admin/build-progress/BuildProgressDashboard';
import { buildProgressRoadmap } from '@/lib/build-progress/roadmap';

export const dynamic = 'force-dynamic';

export default function FounderBuildProgressPage() {
  return <BuildProgressDashboard roadmap={buildProgressRoadmap} />;
}
