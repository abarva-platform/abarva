import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { HowItWorks } from '@/components/public-site/HowItWorks';

export const metadata: Metadata = buildPageMetadata({
  title: 'How AbarVa works',
  description:
    'The maestro through six phases: Discovery, Synthesis, Design, Build, Activate, Operate. See every product capability without reading a feature list.',
});

export default function HowItWorksPage() {
  return (
    <div style={{ paddingTop: '56px', background: 'var(--pub-paper)', minHeight: '100vh' }}>
      <HowItWorks />
    </div>
  );
}
