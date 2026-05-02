import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import { formatApprovalPersonDisplay } from '@/lib/programs/approval-display';

interface PersonRow {
  id: string;
  name: string | null;
  role: string | null;
}

export async function loadApprovalPersonDisplayMap(
  personIds: Iterable<string | null | undefined>,
): Promise<Map<string, string>> {
  const ids = Array.from(
    new Set(
      Array.from(personIds)
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (ids.length === 0) return new Map();

  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('id, name, role')
    .in('id', ids);

  if (error) {
    console.error('[programs/approval-person-resolver] person query failed', {
      ids,
      error,
    });
    return new Map();
  }

  const out = new Map<string, string>();
  for (const row of (data ?? []) as PersonRow[]) {
    const display = formatApprovalPersonDisplay({
      name: row.name ?? '',
      role: row.role,
    });
    if (display) out.set(row.id, display);
  }
  return out;
}
