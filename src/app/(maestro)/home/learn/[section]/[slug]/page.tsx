// /home/learn/<section>/<slug> · per-entry sub-page.
//
// This route serves two purposes:
//   1. Render Source primer pages under the unified guide
//      (/home/learn/source/welcome, /home/learn/source/strategy, …).
//      The Source primer used to live at /source/learn — it has been
//      folded into the global guide so all training is at one URL
//      surface. Legacy /source/learn/* URLs redirect here.
//   2. Fall back to the generic Learn Content Package placeholder for
//      any other section/slug pair.

import { notFound } from 'next/navigation';
import { LearnSectionPlaceholder } from '@/components/home/LearnSectionPlaceholder';
import { findLearnSection } from '@/lib/home/learn-sections';
import { findLearnNavItem } from '@/lib/home/learn-nav';
import { SourceWelcomeSection } from '@/components/source/learn/SourceWelcomeSection';
import { SourceIntakeSection } from '@/components/source/learn/SourceIntakeSection';
import { SourceSentinelSection } from '@/components/source/learn/SourceSentinelSection';
import { SourceGlossarySection } from '@/components/source/learn/SourceGlossarySection';
import { SourceGatesSection } from '@/components/source/learn/SourceGatesSection';
import { SourceExportsSection } from '@/components/source/learn/SourceExportsSection';
import { SourceTowerSection } from '@/components/source/learn/SourceTowerSection';
import { MeridianCaseStudyIntro } from '@/components/source/learn/case-study/MeridianCaseStudyIntro';
import { Ch01StrategyChapter } from '@/components/source/learn/case-study/Ch01StrategyChapter';
import { Ch02ScopeChapter } from '@/components/source/learn/case-study/Ch02ScopeChapter';
import { Ch03RfpChapter } from '@/components/source/learn/case-study/Ch03RfpChapter';
import { Ch04ResponsesChapter } from '@/components/source/learn/case-study/Ch04ResponsesChapter';
import { Ch05EvaluationChapter } from '@/components/source/learn/case-study/Ch05EvaluationChapter';
import { Ch06PricingChapter } from '@/components/source/learn/case-study/Ch06PricingChapter';
import { Ch07BafoChapter } from '@/components/source/learn/case-study/Ch07BafoChapter';
import { Ch08DecisionChapter } from '@/components/source/learn/case-study/Ch08DecisionChapter';
import { Ch09SelectionChapter } from '@/components/source/learn/case-study/Ch09SelectionChapter';
import { Ch10TransitionChapter } from '@/components/source/learn/case-study/Ch10TransitionChapter';
import { Ch11ValueChapter } from '@/components/source/learn/case-study/Ch11ValueChapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ section: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { section, slug } = await params;
  if (section === 'source') {
    const item = findLearnNavItem(`source/${slug}`);
    return { title: `${item?.label ?? slug} · Source · Learn | AbarVa` };
  }
  return { title: `${slug} · ${section} · Learn | AbarVa` };
}

export default async function LearnSubPage({ params }: Props) {
  const { section, slug } = await params;

  // ── Source primer (folded into the unified guide) ──────────────────────────
  if (section === 'source') {
    switch (slug) {
      // Framing pages
      case 'welcome':
        return <SourceWelcomeSection />;
      case 'intake':
        return <SourceIntakeSection />;
      case 'sentinel':
        return <SourceSentinelSection />;
      case 'glossary':
        return <SourceGlossarySection />;

      // Meridian case study intro
      case 'case-study':
        return <MeridianCaseStudyIntro />;

      // Meridian case study — 11 stage chapters
      case 'strategy':
        return <Ch01StrategyChapter />;
      case 'scope':
        return <Ch02ScopeChapter />;
      case 'rfp':
        return <Ch03RfpChapter />;
      case 'responses':
        return <Ch04ResponsesChapter />;
      case 'evaluation':
        return <Ch05EvaluationChapter />;
      case 'pricing':
        return <Ch06PricingChapter />;
      case 'bafo':
        return <Ch07BafoChapter />;
      case 'decision':
        return <Ch08DecisionChapter />;
      case 'selection':
        return <Ch09SelectionChapter />;
      case 'transition':
        return <Ch10TransitionChapter />;
      case 'value':
        return <Ch11ValueChapter />;

      // Reference pages
      case 'gates':
        return <SourceGatesSection />;
      case 'exports':
        return <SourceExportsSection />;
      case 'tower':
        return <SourceTowerSection />;
    }

    notFound();
  }

  // ── Legacy Learn Content Package sub-pages ─────────────────────────────────
  const def = findLearnSection(section);
  if (!def) notFound();

  const known = def.sampleSubPages?.find((p) => p.slug === slug);
  const subPage = known ?? { slug, label: slug };

  return <LearnSectionPlaceholder section={def} subPage={subPage} />;
}
