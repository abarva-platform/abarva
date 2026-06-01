import type { Metadata } from 'next';
import { AiTrustPage, TrustCardGrid, TrustLinkStrip } from '@/components/public-site/AiTrustPage';
import { RESPONSIBLE_AI_PRINCIPLES } from '@/lib/public-site/ai-trust-content';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'Responsible AI',
  description:
    'AbarVa responsible AI posture: decision support, human accountability, visible evidence, and high-risk-use boundaries.',
  openGraph: { url: CANONICAL_URLS.responsibleAi },
});

export default function ResponsibleAiPage() {
  return (
    <AiTrustPage
      eyebrow="Responsible AI"
      title="AI as advisor, never final decision-maker"
      intro="AbarVa is designed as decision support for enterprise AI programs. It helps organize evidence, surface assumptions, and draft recommendations; it does not replace accountable human review."
      updated="2026-06-01"
    >
      <TrustCardGrid items={RESPONSIBLE_AI_PRINCIPLES} />
      <TrustLinkStrip />
    </AiTrustPage>
  );
}
