import { getServerSupabase } from '@/lib/supabase-server';

export interface AuditLogArgs {
  actorPersonId: string | null;
  action: string;
  targetTable: string;
  targetId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

// Silent on failure — audit logging must never break a business write.
export async function logAudit(args: AuditLogArgs): Promise<void> {
  try {
    await getServerSupabase()
      .from('audit_log')
      .insert({
        actor_person_id: args.actorPersonId,
        action: args.action,
        target_table: args.targetTable,
        target_id: args.targetId,
        old_value: args.oldValue ?? null,
        new_value: args.newValue ?? null,
        metadata: args.metadata ?? {},
      });
  } catch (err) {
    console.error('[audit-log]', err);
  }
}
