/**
 * Notifications preferences page · W4-PR-4
 *
 * `/admin/users-access/notifications`
 *
 * Per-user matrix where each event type is configurable per channel +
 * frequency, with mandatory subscriptions locked. Server-fetches the
 * viewer's preferences + mandatory subscriptions via the
 * notifications-preferences broker, then renders the client component.
 *
 * Boundary: this page imports only from `@/lib/admin/broker/**` and
 * `@/lib/admin/admin-tenant`. The client component receives every
 * row as a prop; no direct Supabase access from the client.
 */

import { auth } from '@clerk/nextjs/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import {
  NotificationsPreferencesPage,
  type SavePreferencesInput,
} from '@/components/admin/NotificationsPreferencesPage';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import {
  resolveTenantId,
  loadUserPreferences,
  loadUserMandatorySubscriptions,
  groupRegistryBySourceModule,
} from '@/lib/admin/broker/notifications-preferences-broker';
import { DEFAULT_ADMIN_MANDATORY_EVENT_TYPES } from '@/lib/admin/broker/notifications-types';
import { savePreferences } from './_actions/save-preferences';
import { seedDefaults } from './_actions/seed-defaults';
import { sendTest } from './_actions/send-test';

export const metadata = {
  title: 'Notifications | AbarVa Admin',
};

export default async function NotificationsPreferencesRoute() {
  const tenant = await resolveAdminTenant();
  const { userId } = await auth();
  const safeUserId = userId ?? 'anonymous';

  let existingPreferences: Awaited<ReturnType<typeof loadUserPreferences>> = [];
  let mandatoryEventTypes: readonly string[] = DEFAULT_ADMIN_MANDATORY_EVENT_TYPES;

  const tenantId = await resolveTenantId(tenant.tenantSlug);
  if (tenantId && userId) {
    existingPreferences = await loadUserPreferences({ tenantId, userId });
    const subs = await loadUserMandatorySubscriptions({ tenantId, userId });
    if (subs.length > 0) {
      mandatoryEventTypes = subs.map((s) => s.event_type);
    }
  }

  const registryByModule = groupRegistryBySourceModule();
  const lastSavedAt =
    existingPreferences.length > 0
      ? existingPreferences
          .map((r) => r.updated_at)
          .sort()
          .slice(-1)[0] ?? null
      : null;

  // Server-action adapters: the client component receives plain
  // callbacks; we adapt by re-shaping the args to the server-action
  // signatures.
  async function handleSave(input: SavePreferencesInput) {
    'use server';
    const result = await savePreferences({
      rows: input.rows,
      quietHoursStart: input.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd,
      timezone: input.timezone,
      dailyCap: input.dailyCap,
    });
    if (result.ok) {
      return { ok: true as const, savedAt: result.savedAt, count: result.count };
    }
    return { ok: false as const, code: result.code, message: result.message };
  }

  async function handleSeed() {
    'use server';
    const result = await seedDefaults();
    if (result.ok) return { ok: true as const, count: result.count };
    return { ok: false as const, message: result.message };
  }

  async function handleTest(channel: 'email' | 'in_app') {
    'use server';
    const result = await sendTest(channel);
    if (result.ok) return { ok: true as const, status: result.status };
    return { ok: false as const, message: result.message };
  }

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Governance · Notifications"
        title="Notifications"
        subtitle="Configure how each event type reaches you. Mandatory subscriptions stay on; you control channel and cadence for everything else."
      >
        <NotificationsPreferencesPage
          tenantName={tenant.tenantName}
          tenantSlug={tenant.tenantSlug}
          userId={safeUserId}
          personaLabel={`user · ${safeUserId.slice(0, 12)}…`}
          registryByModule={registryByModule}
          existingPreferences={existingPreferences}
          mandatoryEventTypes={mandatoryEventTypes}
          lastSavedAt={lastSavedAt}
          actions={{
            savePreferences: handleSave,
            seedDefaults: handleSeed,
            sendTest: handleTest,
          }}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
