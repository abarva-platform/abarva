import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  RESPONSIBLE_AI_TRAINING_VERSION,
  getResponsibleAiTrainingStatus,
  recordResponsibleAiTrainingCompletion,
} from '@/lib/ai-liability/responsible-ai-training';
import {
  getResponsibleAiAcknowledgmentStatus,
  getResponsibleAiAcknowledgmentSubjectForRequest,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    body.completed !== true ||
    body.trainingVersion !== RESPONSIBLE_AI_TRAINING_VERSION
  ) {
    return NextResponse.json(
      { error: 'current Responsible AI training must be completed' },
      { status: 400 },
    );
  }

  const subject = await getResponsibleAiAcknowledgmentSubjectForRequest().catch(
    () => null,
  );
  if (!subject) {
    return NextResponse.json(
      { error: 'training subject unavailable' },
      { status: 503 },
    );
  }

  const acknowledgmentStatus = await getResponsibleAiAcknowledgmentStatus(subject);
  if (acknowledgmentStatus.required) {
    return NextResponse.json(
      { error: 'Responsible AI acknowledgment must be accepted first' },
      { status: 409 },
    );
  }

  const existingStatus = await getResponsibleAiTrainingStatus(subject);
  if (!existingStatus.required) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }
  if (!existingStatus.storageAvailable) {
    return NextResponse.json(
      { error: 'training ledger unavailable' },
      { status: 503 },
    );
  }

  const requestHeaders = await headers();
  const ipAddress = firstForwardedIp(requestHeaders.get('x-forwarded-for'));
  const userAgent = requestHeaders.get('user-agent');
  const result = await recordResponsibleAiTrainingCompletion({
    subject,
    ipAddress,
    userAgent,
    source: 'responsible_ai_training_module',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'training ledger unavailable' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}

function firstForwardedIp(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}
