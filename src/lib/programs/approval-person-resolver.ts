import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
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

  let rows: PersonRow[];
  try {
    rows = await azureRead.select<PersonRow>({
      table: 'persons',
      columns: ['id', 'name', 'role'],
      where: { id: { op: 'in', value: ids } },
    });
  } catch (error) {
    console.error('[programs/approval-person-resolver] person query failed', {
      ids,
      error,
    });
    return new Map();
  }

  const out = new Map<string, string>();
  for (const row of rows) {
    const display = formatApprovalPersonDisplay({
      name: row.name ?? '',
      role: row.role,
    });
    if (display) out.set(row.id, display);
  }
  return out;
}
