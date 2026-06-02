import { auth, currentUser } from '@clerk/nextjs/server';

import { getActiveClientRow } from '@/lib/active-client';
import { hasTenantAdminAccess } from '@/lib/admin/tenant-admin-access';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from '@/lib/data-plane/postgresCompat';
import {
  SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS,
  SYSTEM_ROLE_ACKNOWLEDGMENT_ROUTE,
  SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
  SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
} from './system-role-acknowledgment-copy';

export {
  SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS,
  SYSTEM_ROLE_ACKNOWLEDGMENT_ROUTE,
  SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
  SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
};

export interface SystemRoleAcknowledgmentSubject {
  readonly userId: string;
  readonly userEmail: string | null;
  readonly clientId: string;
  readonly clientKey: string;
}

export interface SystemRoleAcknowledgmentRecord {
  readonly id: string;
  readonly client_id: string;
  readonly user_id: string;
  readonly text_version: string;
  readonly signed_at: string;
}

export interface SystemRoleAcknowledgmentStatus {
  readonly required: boolean;
  readonly textVersion: string;
  readonly acknowledgmentText: string;
  readonly storageAvailable: boolean;
  readonly signedAt: string | null;
  readonly reason:
    | 'signed'
    | 'missing'
    | 'storage_unavailable'
    | 'unauthenticated'
    | 'no_client'
    | 'forbidden_admin_required';
}

export interface SystemRoleAcknowledgmentAcceptance {
  readonly subject: SystemRoleAcknowledgmentSubject;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly source: 'tenant_admin_onboarding';
}

export interface SystemRoleAcknowledgmentStore {
  getSignedRecord(
    subject: SystemRoleAcknowledgmentSubject,
  ): Promise<SystemRoleAcknowledgmentRecord | null>;
  insertSignedRecord(
    acceptance: SystemRoleAcknowledgmentAcceptance,
  ): Promise<{ ok: boolean; error?: string }>;
}

export function createPostgresSystemRoleAcknowledgmentStore(args: {
  readonly getReadClient?: () => PostgresCompatClient;
  readonly getWriteClient?: () => PostgresCompatClient;
} = {}): SystemRoleAcknowledgmentStore {
  const getReadClient = args.getReadClient ?? getAzureReadFluentClient;
  const getWriteClient = args.getWriteClient ?? getAzureWriteFluentClient;

  return {
    async getSignedRecord(subject) {
      const { data, error } = await getReadClient()
        .from('responsible_ai_system_role_acknowledgments')
        .select('id, client_id, user_id, text_version, signed_at')
        .eq('client_id', subject.clientId)
        .eq('user_id', subject.userId)
        .eq('text_version', SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION)
        .maybeSingle<SystemRoleAcknowledgmentRecord>();

      if (error) {
        throw new Error(error.message);
      }
      return data ?? null;
    },

    async insertSignedRecord(acceptance) {
      const { subject } = acceptance;
      const { error } = await getWriteClient()
        .from('responsible_ai_system_role_acknowledgments')
        .upsert(
          {
            client_id: subject.clientId,
            client_key: subject.clientKey,
            user_id: subject.userId,
            user_email: subject.userEmail,
            text_version: SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
            acknowledgment_text: SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
            role_scope: 'tenant_admin_system_owner',
            ip_address: acceptance.ipAddress,
            user_agent: acceptance.userAgent,
            source: acceptance.source,
            metadata_jsonb: {
              capturedBy: 'system-role-acknowledgment-api',
              points: SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS,
            },
          },
          {
            onConflict: 'client_id,user_id,text_version',
            ignoreDuplicates: true,
          },
        );

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
  };
}

export async function getSystemRoleAcknowledgmentStatus(
  subject: SystemRoleAcknowledgmentSubject | null,
  store: SystemRoleAcknowledgmentStore = createPostgresSystemRoleAcknowledgmentStore(),
): Promise<SystemRoleAcknowledgmentStatus> {
  if (!subject) {
    return status(false, 'unauthenticated', true, null);
  }

  try {
    const record = await store.getSignedRecord(subject);
    if (record) {
      return status(false, 'signed', true, record.signed_at);
    }
    return status(true, 'missing', true, null);
  } catch {
    return status(true, 'storage_unavailable', false, null);
  }
}

export async function recordSystemRoleAcknowledgment(
  acceptance: SystemRoleAcknowledgmentAcceptance,
  store: SystemRoleAcknowledgmentStore = createPostgresSystemRoleAcknowledgmentStore(),
): Promise<{ ok: boolean; error?: string }> {
  return store.insertSignedRecord(acceptance);
}

export async function getSystemRoleAcknowledgmentSubjectForRequest(): Promise<SystemRoleAcknowledgmentSubject | null> {
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
  const clerkUser = await currentUser().catch(() => null);
  const email =
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;

  return {
    userId,
    userEmail: email,
    clientId: activeClient.id,
    clientKey: activeClient.key,
  };
}

export async function currentUserCanSignSystemRoleAcknowledgment(): Promise<boolean> {
  const clerkUser = await currentUser().catch(() => null);
  if (!clerkUser) return false;

  const role = (clerkUser.publicMetadata?.role as string | undefined) ?? '';
  const fallbackRole =
    (clerkUser.unsafeMetadata?.role as string | undefined) ??
    (clerkUser.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  const adminEmails = new Set([
    'anand.sundaram@thesundaram.com',
    ...CANONICAL_CLIENT_ADMIN_EMAILS,
  ]);
  const isPlatformOrCanonicalAdmin =
    role === 'admin' ||
    fallbackRole === 'admin' ||
    (!!primaryEmail && adminEmails.has(primaryEmail));

  if (isPlatformOrCanonicalAdmin) return true;
  return hasTenantAdminAccess();
}

function status(
  required: boolean,
  reason: SystemRoleAcknowledgmentStatus['reason'],
  storageAvailable: boolean,
  signedAt: string | null,
): SystemRoleAcknowledgmentStatus {
  return {
    required,
    reason,
    storageAvailable,
    signedAt,
    textVersion: SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
    acknowledgmentText: SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
  };
}
