import type { AiEgressAuditRecord, AiEgressAuditSink } from './types';

function randomAuditId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createMemoryAiEgressAuditSink(seed: AiEgressAuditRecord[] = []): AiEgressAuditSink & {
  records: AiEgressAuditRecord[];
} {
  return {
    records: seed,
    async write(record) {
      const persisted: AiEgressAuditRecord = {
        ...record,
        id: randomAuditId(),
        createdAt: new Date().toISOString(),
      };
      this.records.push(persisted);
      return persisted;
    },
  };
}
