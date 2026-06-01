import type { Metadata } from 'next';
import { AiTrustPage, TrustLinkStrip, TrustTable } from '@/components/public-site/AiTrustPage';
import { MODEL_CARD_ROWS } from '@/lib/public-site/ai-trust-content';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'Model Card',
  description:
    'AbarVa model card covering intended use, users, oversight, inputs, outputs, limitations, monitoring, and review cadence.',
  openGraph: { url: CANONICAL_URLS.modelCard },
});

export default function ModelCardPage() {
  return (
    <AiTrustPage
      eyebrow="Model card"
      title="What AbarVa AI is intended to do"
      intro="This public model card summarizes the current decision-support posture. It is not a warranty or certification; it is the operating boundary users should expect."
      updated="2026-06-01"
    >
      <TrustTable rows={MODEL_CARD_ROWS} />
      <TrustLinkStrip />
    </AiTrustPage>
  );
}
