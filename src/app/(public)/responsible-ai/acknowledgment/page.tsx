import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ResponsibleAiAcknowledgmentForm } from '@/components/ai-liability/ResponsibleAiAcknowledgmentForm';
import { getActiveClientRow } from '@/lib/active-client';
import {
  getResponsibleAiAcknowledgmentStatus,
  getResponsibleAiAcknowledgmentSubjectForRequest,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Responsible AI Acknowledgment | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResponsibleAiAcknowledgmentPage() {
  const [subjectResult, activeClient] = await Promise.all([
    getResponsibleAiAcknowledgmentSubjectForRequest()
      .then((subject) => ({ subject, failed: false }))
      .catch(() => ({ subject: null, failed: true })),
    getActiveClientRow().catch(() => null),
  ]);
  const subject = subjectResult.subject;

  if (!subject && !subjectResult.failed) redirect('/sign-in');

  const status = subject
    ? await getResponsibleAiAcknowledgmentStatus(subject)
    : {
        required: true,
        textVersion: '',
        consentText: '',
        storageAvailable: false,
        acceptedAt: null,
        expiresAt: null,
        reacknowledgmentIntervalDays: 365,
        reason: 'storage_unavailable' as const,
      };
  if (!status.required) redirect('/home');

  const clientName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'your workspace';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F6F1EA',
        color: '#27324A',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
        fontFamily: 'var(--font-inter)',
      }}
    >
      <section style={{ width: 'min(720px, 100%)', display: 'grid', gap: 18 }}>
        <div>
          <div
            style={{
              color: '#8B95A8',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Responsible AI use
          </div>
          <h1
            style={{
              margin: 0,
              color: '#0C1A3A',
              fontFamily: 'var(--font-fraunces)',
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              lineHeight: 1.08,
            }}
          >
            Confirm the human decision boundary before entering AbarVa.
          </h1>
          <p style={{ margin: '12px 0 0', color: '#69758A', fontSize: 15, lineHeight: 1.6 }}>
            AbarVa is decision-support software. The client decision owner remains
            responsible for reviewing evidence, validating assumptions, and approving
            actions before they are taken.
          </p>
        </div>
        <ResponsibleAiAcknowledgmentForm
          clientName={clientName}
          reason={status.reason}
          storageAvailable={status.storageAvailable}
        />
      </section>
    </main>
  );
}
