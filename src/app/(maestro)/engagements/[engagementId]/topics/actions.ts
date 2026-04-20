'use server';

import { revalidatePath } from 'next/cache';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { assignTopic, unassignTopic, toggleQuestionDone } from '@/lib/topics/db';

async function resolveEngagementId(graphId: string): Promise<string | null> {
  const e = await getEngagementByGraphId(graphId);
  return e?.id ?? null;
}

export async function assignTopicAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const topicId = String(formData.get('topicId') ?? '');
  if (!graphId || !topicId) return;
  const engagementId = await resolveEngagementId(graphId);
  if (!engagementId) return;
  const caller = await getCurrentPerson();
  await assignTopic({ engagementId, topicId, assignedBy: caller?.id ?? null });
  revalidatePath(`/engagements/${graphId}/topics`);
}

export async function unassignTopicAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const engagementTopicId = String(formData.get('engagementTopicId') ?? '');
  if (!graphId || !engagementTopicId) return;
  await unassignTopic(engagementTopicId);
  revalidatePath(`/engagements/${graphId}/topics`);
}

export async function toggleQuestionAction(formData: FormData): Promise<void> {
  const graphId = String(formData.get('engagementGraphId') ?? '');
  const engagementTopicId = String(formData.get('engagementTopicId') ?? '');
  const questionId = String(formData.get('questionId') ?? '');
  const done = formData.get('done') === 'true';
  if (!graphId || !engagementTopicId || !questionId) return;
  await toggleQuestionDone({ engagementTopicId, questionId, done });
  revalidatePath(`/engagements/${graphId}/topics`);
}
