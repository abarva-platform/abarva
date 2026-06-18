import { recordWaiver } from '@/lib/reasoning/gate-audit-state';

const waiverStore = new Map<string, { reason: string; waivedAt: string }>();

export function recordWaiverInternal(
  tenantId: string,
  instanceId: string,
  criterionId: string,
  reason: string,
): void {
  const waivedAt = new Date().toISOString();
  waiverStore.set(`${tenantId}::${instanceId}::${criterionId}`, { reason, waivedAt });
  recordWaiver({ tenantId, instanceId, criterionId, reason, waivedAt });
}

export function getWaiversForInstance(
  tenantId: string,
  instanceId: string,
): Array<{ criterionId: string; reason: string; waivedAt: string }> {
  const prefix = `${tenantId}::${instanceId}::`;
  const results: Array<{ criterionId: string; reason: string; waivedAt: string }> = [];
  for (const [key, value] of waiverStore.entries()) {
    if (key.startsWith(prefix)) {
      results.push({
        criterionId: key.slice(prefix.length),
        reason: value.reason,
        waivedAt: value.waivedAt,
      });
    }
  }
  return results;
}

export function getWaivers(
  tenantId: string,
): Array<{
  instanceId: string;
  criterionId: string;
  reason: string;
  waivedAt: string;
}> {
  const results: Array<{ instanceId: string; criterionId: string; reason: string; waivedAt: string }> = [];
  const tenantPrefix = `${tenantId}::`;
  for (const [key, value] of waiverStore.entries()) {
    if (!key.startsWith(tenantPrefix)) continue;
    const rest = key.slice(tenantPrefix.length);
    const sep = rest.indexOf('::');
    if (sep === -1) continue;
    results.push({
      instanceId: rest.slice(0, sep),
      criterionId: rest.slice(sep + 2),
      reason: value.reason,
      waivedAt: value.waivedAt,
    });
  }
  return results;
}

export function clearWaivers(): void {
  waiverStore.clear();
}
