import { auth, currentUser } from '@clerk/nextjs/server';

import { getActiveClientRow } from '@/lib/active-client';
import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from '@/lib/data-plane/postgresCompat';
import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
  RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS,
} from './responsible-ai-acknowledgment-copy';

export {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
  RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS,
};

export interface ResponsibleAiAcknowledgmentSubject {
  readonly userId: string;
  readonly userEmail: string | null;
  readonly clientId: string;
  readonly clientKey: string;
}

export interface ResponsibleAiAcknowledgmentRecord {
  readonly id: string;
  readonly client_id: string;
  readonly user_id: string;
  readonly text_version: string;
  readonly acknowledgment_cycle: string | null;
  readonly accepted_at: string;
}

export interface ResponsibleAiAcknowledgmentStatus {
  readonly required: boolean;
  readonly textVersion: string;
  readonly consentText: string;
  readonly storageAvailable: boolean;
  readonly acceptedAt: string | null;
  readonly expiresAt: string | null;
  readonly reacknowledgmentIntervalDays: number;
  readonly reason:
    | 'accepted'
    | 'missing'
    | 'expired'
    | 'storage_unavailable'
    | 'unauthenticated'
    | 'no_client';
}

export interface ResponsibleAiAcknowledgmentAcceptance {
  readonly subject: ResponsibleAiAcknowledgmentSubject;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly source: 'first_login_clickwrap';
}

export interface ResponsibleAiAcknowledgmentStore {
  getAcceptedRecord(
    subject: ResponsibleAiAcknowledgmentSubject,
  ): Promise<ResponsibleAiAcknowledgmentRecord | null>;
  insertAcceptedRecord(
    acceptance: ResponsibleAiAcknowledgmentAcceptance,
  ): Promise<{ ok: boolean; error?: string }>;
}

export function createPostgresResponsibleAiAcknowledgmentStore(args: {
  readonly getReadClient?: () => PostgresCompatClient;
  readonly getWriteClient?: () => PostgresCompatClient;
} = {}): ResponsibleAiAcknowledgmentStore {
  const getReadClient = args.getReadClient ?? getAzureReadFluentClient;
  const getWriteClient = args.getWriteClient ?? getAzureWriteFluentClient;

  return {
    async getAcceptedRecord(subject) {
      const { data, error } = await getReadClient()
        .from('responsible_ai_acknowledgments')
        .select(
          'id, client_id, user_id, text_version, acknowledgment_cycle, accepted_at',
        )
        .eq('client_id', subject.clientId)
        .eq('user_id', subject.userId)
        .eq('text_version', RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle<ResponsibleAiAcknowledgmentRecord>();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },

    async insertAcceptedRecord(acceptance) {
      const { subject } = acceptance;
      const { error } = await getWriteClient()
        .from('responsible_ai_acknowledgments')
        .upsert(
          {
            client_id: subject.clientId,
            client_key: subject.clientKey,
            user_id: subject.userId,
            user_email: subject.userEmail,
            text_version: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
            acknowledgment_cycle: getResponsibleAiAcknowledgmentCycle(),
            consent_text: RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
            ip_address: acceptance.ipAddress,
            user_agent: acceptance.userAgent,
            source: acceptance.source,
            metadata_jsonb: {
              capturedBy: 'responsible-ai-acknowledgment-api',
            },
          },
          {
            onConflict: 'client_id,user_id,text_version,acknowledgment_cycle',
            ignoreDuplicates: true,
          },
        );

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
  };
}

export async function getResponsibleAiAcknowledgmentStatus(
  subject: ResponsibleAiAcknowledgmentSubject | null,
  store: ResponsibleAiAcknowledgmentStore = createPostgresResponsibleAiAcknowledgmentStore(),
): Promise<ResponsibleAiAcknowledgmentStatus> {
  if (!subject) {
    return status(false, 'unauthenticated', true, null, null);
  }

  try {
    const record = await store.getAcceptedRecord(subject);
    if (record) {
      const expiresAt = getResponsibleAiAcknowledgmentExpiresAt(
        record.accepted_at,
      );
      if (isResponsibleAiAcknowledgmentExpired(record.accepted_at)) {
        return status(true, 'expired', true, record.accepted_at, expiresAt);
      }
      return status(false, 'accepted', true, record.accepted_at, expiresAt);
    }
    return status(true, 'missing', true, null, null);
  } catch {
    return status(true, 'storage_unavailable', false, null, null);
  }
}

export async function recordResponsibleAiAcknowledgment(
  acceptance: ResponsibleAiAcknowledgmentAcceptance,
  store: ResponsibleAiAcknowledgmentStore = createPostgresResponsibleAiAcknowledgmentStore(),
): Promise<{ ok: boolean; error?: string }> {
  return store.insertAcceptedRecord(acceptance);
}

export async function getResponsibleAiAcknowledgmentSubjectForRequest(): Promise<ResponsibleAiAcknowledgmentSubject | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const activeClient = await getActiveClientRow();
  if (!activeClient) return null;

  const claims = sessionClaims as
    | {
        emailAddress?: string;
        email?: string;
        emailAddresses?: Array<{ emailAddress: string }>;
        email_addresses?: Array<{ emailAddress: string }>;
      }
    | undefined;
  let email =
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    null;

  if (!email) {
    const clerkUser = await currentUser().catch(() => null);
    email =
      clerkUser?.primaryEmailAddress?.emailAddress ??
      clerkUser?.emailAddresses?.[0]?.emailAddress ??
      null;
  }

  return {
    userId,
    userEmail: email,
    clientId: activeClient.id,
    clientKey: activeClient.key,
  };
}

export async function getResponsibleAiAcknowledgmentStatusForCurrentRequest(
  store?: ResponsibleAiAcknowledgmentStore,
): Promise<ResponsibleAiAcknowledgmentStatus> {
  const subject = await getResponsibleAiAcknowledgmentSubjectForRequest().catch(
    () => null,
  );
  if (subject === null) {
    const { userId } = await auth().catch(() => ({ userId: null }));
    if (userId) return status(true, 'storage_unavailable', false, null, null);
  }
  if (!subject) return status(false, 'no_client', true, null, null);
  return getResponsibleAiAcknowledgmentStatus(subject, store);
}

export function getResponsibleAiAcknowledgmentCycle(
  date: Date = new Date(),
): string {
  return `annual-${date.getUTCFullYear()}`;
}

export function getResponsibleAiAcknowledgmentExpiresAt(
  acceptedAt: string,
): string {
  const acceptedTime = new Date(acceptedAt).getTime();
  return new Date(
    acceptedTime +
      RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function isResponsibleAiAcknowledgmentExpired(
  acceptedAt: string,
  now: Date = new Date(),
): boolean {
  return (
    now.getTime() >=
    new Date(getResponsibleAiAcknowledgmentExpiresAt(acceptedAt)).getTime()
  );
}

function status(
  required: boolean,
  reason: ResponsibleAiAcknowledgmentStatus['reason'],
  storageAvailable: boolean,
  acceptedAt: string | null,
  expiresAt: string | null,
): ResponsibleAiAcknowledgmentStatus {
  return {
    required,
    reason,
    storageAvailable,
    acceptedAt,
    expiresAt,
    textVersion: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
    consentText: RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
    reacknowledgmentIntervalDays:
      RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS,
  };
}
