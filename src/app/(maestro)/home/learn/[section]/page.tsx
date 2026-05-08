// /home/learn/[section] — renders the matching guide section component,
// or falls back to the placeholder for legacy section slugs.

import { notFound } from 'next/navigation';
import { WelcomeSection } from '@/components/home/learn/WelcomeSection';
import { SetupSection } from '@/components/home/learn/SetupSection';
import { IntelligenceSection } from '@/components/home/learn/IntelligenceSection';
import { MovesOverviewSection } from '@/components/home/learn/MovesOverviewSection';
import { PhaseSection } from '@/components/home/learn/PhaseSection';
import { GatesSection } from '@/components/home/learn/GatesSection';
import { TowerSection } from '@/components/home/learn/TowerSection';
import { GlossarySection } from '@/components/home/learn/GlossarySection';
import { LearnSectionPlaceholder } from '@/components/home/LearnSectionPlaceholder';
import { findLearnSection } from '@/lib/home/learn-sections';
import { findLearnNavItem } from '@/lib/home/learn-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  return { title: `${section} · Learn | AbarVa` };
}

export default async function LearnSectionPage({ params }: Props) {
  const { section } = await params;

  // ── Guide sections (native React) ──────────────────────────────────────────
  switch (section) {
    case 'welcome':
    case 'first-steps':
      return <WelcomeSection />;

    case 'setup':
      return <SetupSection />;

    case 'intelligence':
      return <IntelligenceSection />;

    case 'moves-overview':
      return <MovesOverviewSection />;

    case 'p0':
    case 'p1':
    case 'p2':
    case 'p3':
    case 'p4':
    case 'p5':
      return <PhaseSection phase={section} />;

    case 'gates':
      return <GatesSection />;

    case 'tower':
      return <TowerSection />;

    case 'glossary':
      return <GlossarySection />;
  }

  // ── Legacy learn sections (placeholder fallback) ────────────────────────────
  const def = findLearnSection(section);
  if (def) return <LearnSectionPlaceholder section={def} />;

  notFound();
}
