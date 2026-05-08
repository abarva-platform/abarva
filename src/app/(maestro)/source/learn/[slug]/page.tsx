// /source/learn/[slug] — renders the matching primer section, or a
// "coming soon" placeholder for slugs not yet shipped (lifecycle
// stage walkthroughs etc.).

import { notFound } from 'next/navigation';

import { SourceWelcomeSection } from '@/components/source/learn/SourceWelcomeSection';
import { SourceIntakeSection } from '@/components/source/learn/SourceIntakeSection';
import { SourceSentinelSection } from '@/components/source/learn/SourceSentinelSection';
import { SourceGlossarySection } from '@/components/source/learn/SourceGlossarySection';
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
    case 'welcome':
      return <SourceWelcomeSection />;
    case 'intake':
      return <SourceIntakeSection />;
    case 'sentinel':
      return <SourceSentinelSection />;
    case 'glossary':
      return <SourceGlossarySection />;
    // Lifecycle stage slugs + reference pages (gates, exports, tower)
    // not yet shipped — render a minimal placeholder so the side-nav
    // links don't 404.
    case 'strategy':
    case 'scope':
    case 'rfp':
    case 'responses':
    case 'evaluation':
    case 'pricing':
    case 'bafo':
    case 'decision':
    case 'selection':
    case 'transition':
    case 'value':
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
            This section is in the next slice of the primer. Slice S1 ships the
            four framing pages (welcome / intake / sentinel / glossary). The
            eleven lifecycle stage walkthroughs and the gates / exports / tower
            reference pages land in Slices S2 + S3.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B7280', marginTop: 24 }}>
            Want to read what&rsquo;s shipped today? Try{' '}
            <a href="/source/learn" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Welcome &amp; overview
            </a>
            {', '}
            <a href="/source/learn/intake" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Creating your first event
            </a>
            {', '}
            <a href="/source/learn/sentinel" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Working with Sentinel
            </a>
            , or{' '}
            <a href="/source/learn/glossary" style={{ color: '#1B2B5C', fontWeight: 600 }}>
              Glossary &amp; pitfalls
            </a>
            .
          </p>
        </div>
      );
    default:
      notFound();
  }
}
