// /source/learn/[slug] — renders the matching primer section, or a
// "coming soon" placeholder for slugs not yet shipped (gates / exports
// / tower).
//
// Slice S2 ships the Meridian end-to-end case study: the 11 lifecycle
// stage slugs each render a chapter component (Strategy → Value), and
// the new `case-study` slug renders the case study overview. Reference
// slugs (gates / exports / tower) remain placeholders until S3.

import { notFound } from 'next/navigation';
import Link from 'next/link';

import { SourceWelcomeSection } from '@/components/source/learn/SourceWelcomeSection';
import { SourceIntakeSection } from '@/components/source/learn/SourceIntakeSection';
import { SourceSentinelSection } from '@/components/source/learn/SourceSentinelSection';
import { SourceGlossarySection } from '@/components/source/learn/SourceGlossarySection';
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
import { findSourceLearnNavItem } from '@/lib/source/learn/learn-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = findSourceLearnNavItem(slug);
  return { title: `${item?.label ?? slug} · Source primer | AbarVa` };
}

export default async function SourceLearnSlugPage({ params }: Props) {
  const { slug } = await params;
  const item = findSourceLearnNavItem(slug);

  switch (slug) {
    // Framing pages (Slice S1)
    case 'welcome':
      return <SourceWelcomeSection />;
    case 'intake':
      return <SourceIntakeSection />;
    case 'sentinel':
      return <SourceSentinelSection />;
    case 'glossary':
      return <SourceGlossarySection />;

    // Meridian case study (Slice S2)
    case 'case-study':
      return <MeridianCaseStudyIntro />;
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

    // Reference pages (still in next slice — render the placeholder)
    case 'gates':
    case 'exports':
    case 'tower':
      return (
        <div style={{ padding: '64px 48px', maxWidth: 720 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6B7280',
              marginBottom: 12,
            }}
          >
            Source primer · coming soon
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 32,
              fontWeight: 500,
              color: '#0A0C12',
              margin: '0 0 16px',
              letterSpacing: '-0.01em',
            }}
          >
            {item?.label ?? slug}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#1F2433' }}>
            This reference page lands in Slice S3. Slice S2 ships the framing
            pages plus the Meridian end-to-end case study (11 chapters).
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B7280', marginTop: 24 }}>
            Want to read what&rsquo;s shipped today? Try the{' '}
            <Link href="/source/learn/case-study" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Meridian case study overview
            </Link>
            , or{' '}
            <Link href="/source/learn/welcome" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Welcome &amp; overview
            </Link>
            .
          </p>
        </div>
      );
    default:
      notFound();
  }
}
