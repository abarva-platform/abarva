import { ALL_CLIENTS, CLIENT_KEY_TO_DB_NAME, type ClientKey } from '@/lib/client-config';

export interface CrossTenantWriteIntent {
  activeClientKey: ClientKey;
  activeClientName: string;
  requestedClientKey: ClientKey;
  requestedClientName: string;
}

const WRITE_INTENT_RE =
  /\b(create|copy|originate|register|set\s*up|submit|start|make|move|use)\b|\bsame\s+program\b|\bsponsor\b/i;

function aliasesForClient(key: ClientKey): string[] {
  const option = ALL_CLIENTS.find((client) => client.id === key);
  const labels = [
    option?.id,
    option?.name,
    option?.shortName,
    ...(CLIENT_KEY_TO_DB_NAME[key] ?? []),
  ].filter((value): value is string => Boolean(value));

  if (key === 'apexretail') labels.push('apex');
  if (key === 'arcturus') labels.push('first capital', 'firstcapital');
  if (key === 'meridian') labels.push('meridian health');

  return Array.from(new Set(labels.map((label) => label.toLowerCase())));
}

function mentionsAlias(message: string, alias: string): boolean {
  const escaped = alias
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(message);
}

export function detectCrossTenantWriteIntent(input: {
  message: string;
  activeClientKey: ClientKey | null | undefined;
  activeClientName?: string | null;
}): CrossTenantWriteIntent | null {
  if (!input.activeClientKey) return null;
  if (!WRITE_INTENT_RE.test(input.message)) return null;

  for (const client of ALL_CLIENTS) {
    if (client.id === input.activeClientKey) continue;
    if (aliasesForClient(client.id).some((alias) => mentionsAlias(input.message, alias))) {
      const active = ALL_CLIENTS.find((c) => c.id === input.activeClientKey);
      return {
        activeClientKey: input.activeClientKey,
        activeClientName: input.activeClientName ?? active?.name ?? input.activeClientKey,
        requestedClientKey: client.id,
        requestedClientName: client.name,
      };
    }
  }

  return null;
}

export function formatCrossTenantWriteRefusal(intent: CrossTenantWriteIntent): string {
  return [
    `Blocked for tenant safety. You are signed in to ${intent.activeClientName}.`,
    `I cannot create, copy, sponsor, or submit a ${intent.requestedClientName} program from this ${intent.activeClientName}-locked session.`,
    `No record was created. Sign out and choose the ${intent.requestedClientName} demo account, or switch to an authorized ${intent.requestedClientName} context, and I can originate it there.`,
  ].join('\n\n');
}
