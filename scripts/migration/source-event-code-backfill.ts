import { getServerSupabase } from '@/lib/supabase-server';
import { getClientOption, isClientKey } from '@/lib/client-config';

interface SourceEventCodeRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanEventName(clientKey: string, eventName: string): string {
  const clientOption = isClientKey(clientKey) ? getClientOption(clientKey) : null;
  const clientPrefixes = [clientOption?.name, clientOption?.shortName, clientKey]
    .filter((value): value is string => Boolean(value));
  return clientPrefixes.reduce((name, prefix) => {
    const pattern = new RegExp(`^${escapeRegExp(prefix)}\\s+`, 'i');
    return name.replace(pattern, '');
  }, eventName.trim());
}

export function generateCanonicalSourceEventCode(clientKey: string, eventName: string, year = new Date().getFullYear()): string {
  const prefix = clientKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SRC';
  const nameParts = cleanEventName(clientKey, eventName)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 3);
  const nameSlug = nameParts.length > 0 ? nameParts.join('-') : 'EVENT';
  return `${prefix}-${nameSlug}-${year}`;
}

function needsBackfill(row: SourceEventCodeRow): boolean {
  const code = row.event_code.toUpperCase();
  const prefix = row.client_key.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (!prefix) return false;
  return code.includes(`${prefix}-${prefix}-`) || code.includes('APEX-APEX-');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_events')
    .select('id,client_key,event_code,event_name')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as SourceEventCodeRow[]).filter(needsBackfill);
  const rewrites: Array<{ row: SourceEventCodeRow; newCode: string }> = rows.map((row) => ({
    row,
    newCode: generateCanonicalSourceEventCode(row.client_key, row.event_name),
  }));

  console.log(JSON.stringify({
    dryRun,
    candidates: rewrites.length,
    rewrites: rewrites.map(({ row, newCode }) => ({
      id: row.id,
      clientKey: row.client_key,
      oldCode: row.event_code,
      newCode,
    })),
  }, null, 2));

  if (dryRun || rewrites.length === 0) return;

  for (const { row, newCode } of rewrites) {
    if (row.event_code === newCode) continue;
    const { error: updateError } = await supabase
      .from('source_events')
      .update({ event_code: newCode })
      .eq('id', row.id);
    if (updateError) throw new Error(`source_events update failed for ${row.id}: ${updateError.message}`);

    const { error: auditError } = await supabase
      .from('source_event_code_backfill_audit')
      .insert({
        source_event_id: row.id,
        client_key: row.client_key,
        old_code: row.event_code,
        new_code: newCode,
        reason: 'Packet 22 canonical source event code backfill removed duplicate tenant prefix.',
      });
    if (auditError) throw new Error(`source_event_code_backfill_audit insert failed for ${row.id}: ${auditError.message}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
