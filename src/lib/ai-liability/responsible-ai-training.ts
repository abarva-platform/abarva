import { auth } from '@clerk/nextjs/server';

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from '@/lib/data-plane/postgresCompat';
import {
  getResponsibleAiAcknowledgmentSubjectForRequest,
  type ResponsibleAiAcknowledgmentSubject,
} from './responsible-ai-acknowledgment';
import {
  RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
  RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
  RESPONSIBLE_AI_TRAINING_MODULES,
  RESPONSIBLE_AI_TRAINING_ROUTE,
  RESPONSIBLE_AI_TRAINING_VERSION,
} from './responsible-ai-training-copy';

export {
  RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
  RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
  RESPONSIBLE_AI_TRAINING_MODULES,
  RESPONSIBLE_AI_TRAINING_ROUTE,
  RESPONSIBLE_AI_TRAINING_VERSION,
};

export type ResponsibleAiTrainingSubject = ResponsibleAiAcknowledgmentSubject;

export interface ResponsibleAiTrainingRecord {
  readonly id: string;
  readonly client_id: string;
  readonly user_id: string;
  readonly training_version: string;
  readonly completed_at: string;
}

export interface ResponsibleAiTrainingStatus {
  readonly required: boolean;
  readonly trainingVersion: string;
  readonly completionStatement: string;
  readonly estimatedMinutes: number;
  readonly storageAvailable: boolean;
  readonly completedAt: string | null;
  readonly reason:
    | 'completed'
    | 'missing'
    | 'storage_unavailable'
    | 'unauthenticated'
    | 'no_client';
}

export interface ResponsibleAiTrainingCompletion {
  readonly subject: ResponsibleAiTrainingSubject;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly source: 'responsible_ai_training_module';
}

export interface ResponsibleAiTrainingStore {
  getCompletedRecord(
    subject: ResponsibleAiTrainingSubject,
  ): Promise<ResponsibleAiTrainingRecord | null>;
  insertCompletedRecord(
    completion: ResponsibleAiTrainingCompletion,
  ): Promise<{ ok: boolean; error?: string }>;
}

export function createPostgresResponsibleAiTrainingStore(args: {
  readonly getReadClient?: () => PostgresCompatClient;
  readonly getWriteClient?: () => PostgresCompatClient;
} = {}): ResponsibleAiTrainingStore {
  const getReadClient = args.getReadClient ?? getAzureReadFluentClient;
  const getWriteClient = args.getWriteClient ?? getAzureWriteFluentClient;

  return {
    async getCompletedRecord(subject) {
      const { data, error } = await getReadClient()
        .from('responsible_ai_training_completions')
        .select('id, client_id, user_id, training_version, completed_at')
        .eq('client_id', subject.clientId)
        .eq('user_id', subject.userId)
        .eq('training_version', RESPONSIBLE_AI_TRAINING_VERSION)
        .maybeSingle<ResponsibleAiTrainingRecord>();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },

    async insertCompletedRecord(completion) {
      const { subject } = completion;
      const { error } = await getWriteClient()
        .from('responsible_ai_training_completions')
        .upsert(
          {
            client_id: subject.clientId,
            client_key: subject.clientKey,
            user_id: subject.userId,
            user_email: subject.userEmail,
            training_version: RESPONSIBLE_AI_TRAINING_VERSION,
            completion_statement: RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
            estimated_minutes: RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
            module_count: RESPONSIBLE_AI_TRAINING_MODULES.length,
            ip_address: completion.ipAddress,
            user_agent: completion.userAgent,
            source: completion.source,
            metadata_jsonb: {
              capturedBy: 'responsible-ai-training-api',
              modules: RESPONSIBLE_AI_TRAINING_MODULES.map((module) => module.title),
            },
          },
          {
            onConflict: 'client_id,user_id,training_version',
            ignoreDuplicates: true,
          },
        );

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
  };
}

export async function getResponsibleAiTrainingStatus(
  subject: ResponsibleAiTrainingSubject | null,
  store: ResponsibleAiTrainingStore = createPostgresResponsibleAiTrainingStore(),
): Promise<ResponsibleAiTrainingStatus> {
  if (!subject) {
    return status(false, 'unauthenticated', true, null);
  }

  try {
    const record = await store.getCompletedRecord(subject);
    if (record) {
      return status(false, 'completed', true, record.completed_at);
    }
    return status(true, 'missing', true, null);
  } catch {
    return status(true, 'storage_unavailable', false, null);
  }
}

export async function recordResponsibleAiTrainingCompletion(
  completion: ResponsibleAiTrainingCompletion,
  store: ResponsibleAiTrainingStore = createPostgresResponsibleAiTrainingStore(),
): Promise<{ ok: boolean; error?: string }> {
  return store.insertCompletedRecord(completion);
}

export async function getResponsibleAiTrainingStatusForCurrentRequest(
  store?: ResponsibleAiTrainingStore,
): Promise<ResponsibleAiTrainingStatus> {
  const subject = await getResponsibleAiAcknowledgmentSubjectForRequest().catch(
    () => null,
  );
  if (subject === null) {
    const { userId } = await auth().catch(() => ({ userId: null }));
    if (userId) return status(true, 'storage_unavailable', false, null);
  }
  if (!subject) return status(false, 'no_client', true, null);
  return getResponsibleAiTrainingStatus(subject, store);
}

function status(
  required: boolean,
  reason: ResponsibleAiTrainingStatus['reason'],
  storageAvailable: boolean,
  completedAt: string | null,
): ResponsibleAiTrainingStatus {
  return {
    required,
    reason,
    storageAvailable,
    completedAt,
    trainingVersion: RESPONSIBLE_AI_TRAINING_VERSION,
    completionStatement: RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
    estimatedMinutes: RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
  };
}
