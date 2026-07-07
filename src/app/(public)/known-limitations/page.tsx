import type { Metadata } from 'next';
import { AiTrustPage, TrustCardGrid, TrustLinkStrip } from '@/components/public-site/AiTrustPage';
import { KNOWN_LIMITATIONS } from '@/lib/public-site/ai-trust-content';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'Known Limitations',
  description:
    'Known AbarVa AI limitations, including missing data, inherited source errors, overstated certainty, and prohibited final-decision uses.',
  openGraph: { url: CANONICAL_URLS.knownLimitations },
});

export default function KnownLimitationsPage() {
  return (
    <AiTrustPage
      eyebrow="Known limitations"
      title="What users must not assume"
      intro="AbarVa can make enterprise AI work more evidence-based, but it can still be wrong. These limitations are part of the product boundary and should be reviewed before pilot use."
      updated="2026-06-01"
    >
      <TrustCardGrid items={KNOWN_LIMITATIONS} />
      <TrustLinkStrip />
    </AiTrustPage>
  );
}
