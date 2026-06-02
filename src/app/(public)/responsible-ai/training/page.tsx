import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ResponsibleAiTrainingForm } from '@/components/ai-liability/ResponsibleAiTrainingForm';
import { getActiveClientRow } from '@/lib/active-client';
import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  getResponsibleAiAcknowledgmentStatus,
  getResponsibleAiAcknowledgmentSubjectForRequest,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';
import {
  getResponsibleAiTrainingStatus,
} from '@/lib/ai-liability/responsible-ai-training';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Responsible AI Training | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResponsibleAiTrainingPage() {
  const [subjectResult, activeClient] = await Promise.all([
    getResponsibleAiAcknowledgmentSubjectForRequest()
      .then((subject) => ({ subject, failed: false }))
      .catch(() => ({ subject: null, failed: true })),
    getActiveClientRow().catch(() => null),
  ]);
  const subject = subjectResult.subject;

  if (!subject && !subjectResult.failed) redirect('/sign-in');

  const acknowledgmentStatus = subject
    ? await getResponsibleAiAcknowledgmentStatus(subject)
    : { required: true, storageAvailable: false };
  if (acknowledgmentStatus.required) redirect(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE);

  const trainingStatus = subject
    ? await getResponsibleAiTrainingStatus(subject)
    : {
        required: true,
        trainingVersion: '',
        completionStatement: '',
        estimatedMinutes: 10,
        storageAvailable: false,
        completedAt: null,
        reason: 'storage_unavailable' as const,
      };
  if (!trainingStatus.required) redirect('/home');

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
      <section style={{ width: 'min(760px, 100%)', display: 'grid', gap: 18 }}>
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
            Responsible AI training
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
            Complete the human-accountability training before entering AbarVa.
          </h1>
          <p style={{ margin: '12px 0 0', color: '#69758A', fontSize: 15, lineHeight: 1.6 }}>
            This short module sets the operating standard for AI-assisted work:
            review evidence, validate assumptions, document reasoning, and keep
            human approval in control of consequential actions.
          </p>
        </div>
        <ResponsibleAiTrainingForm
          clientName={clientName}
          storageAvailable={trainingStatus.storageAvailable}
        />
      </section>
    </main>
  );
}
