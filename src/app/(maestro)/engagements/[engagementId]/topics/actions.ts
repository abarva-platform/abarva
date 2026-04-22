'use server';

import { revalidatePath } from 'next/cache';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { assignTopic, unassignTopic, toggleQuestionDone, setTopicPrimary } from '@/lib/topics/db';

async function resolveEngagementId(graphId: string): Promise<string | null> {
  const e = await getEngagementByGraphId(graphId);
  return e?.id ?? null;
}

export async function assignTopicAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const topicKey = String(formData.get('topicKey') ?? '');
  if (!graphId || !topicKey) return;
  const engagementId = await resolveEngagementId(graphId);
  if (!engagementId) return;
  const caller = await getCurrentPerson();
  await assignTopic({ engagementId, topicKey, assignedBy: caller?.id ?? null });
  revalidatePath(`/engagements/${graphId}/topics`);
}

export async function unassignTopicAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const topicKey = String(formData.get('topicKey') ?? '');
  if (!graphId || !topicKey) return;
  const engagementId = await resolveEngagementId(graphId);
  if (!engagementId) return;
  await unassignTopic({ engagementId, topicKey });
  revalidatePath(`/engagements/${graphId}/topics`);
}

export async function togglePrimaryAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const topicKey = String(formData.get('topicKey') ?? '');
  const isPrimary = formData.get('isPrimary') === 'true';
  if (!graphId || !topicKey) return;
  const engagementId = await resolveEngagementId(graphId);
  if (!engagementId) return;
  await setTopicPrimary({ engagementId, topicKey, isPrimary });
  revalidatePath(`/engagements/${graphId}/topics`);
}

export async function toggleQuestionAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const topicKey = String(formData.get('topicKey') ?? '');
  const questionId = String(formData.get('questionId') ?? '');
  const done = formData.get('done') === 'true';
  if (!graphId || !topicKey || !questionId) return;
  const engagementId = await resolveEngagementId(graphId);
  if (!engagementId) return;
  await toggleQuestionDone({ engagementId, topicKey, questionId, done });
  revalidatePath(`/engagements/${graphId}/topics`);
}
