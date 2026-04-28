import {
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabricWriteResult,
  resolveKnowledgeFabricWriteMode,
} from "./feature-flag";

export type EvidenceLedgerEntry = {
  id: string;
  primitiveId: string;
  eventType: string;
  storeRefs: string[];
  evidence: Record<string, unknown>;
  sequenceNumber: number;
  appendedAt: string;
};

export type EvidenceLedgerEntryInput = {
  id?: string;
  primitiveId: string;
  eventType: string;
  storeRefs?: string[];
  evidence?: Record<string, unknown>;
};

export class EvidenceLedger {
  private readonly entriesBySequence: EvidenceLedgerEntry[] = [];
  private readonly writesEnabled?: boolean;

  constructor(options: KnowledgeFabricWriteOptions = {}) {
    this.writesEnabled = options.writesEnabled;
  }

  append(
    input: EvidenceLedgerEntryInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<EvidenceLedgerEntry> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const nextSequence = this.entriesBySequence.length + 1;
    const appendedAt = new Date().toISOString();
    const record: EvidenceLedgerEntry = {
      id: input.id ?? `${input.primitiveId}:ledger:${nextSequence}`,
      primitiveId: input.primitiveId,
      eventType: input.eventType,
      storeRefs: input.storeRefs ?? [],
      evidence: input.evidence ?? {},
      sequenceNumber: nextSequence,
      appendedAt,
    };

    if (mode.writesEnabled) {
      this.entriesBySequence.push(record);
    }

    return createKnowledgeFabricWriteResult({
      store: "evidence-ledger",
      operation: "append",
      id: record.id,
      mode,
      record,
      timestamp: appendedAt,
    });
  }

  entries(): EvidenceLedgerEntry[] {
    return [...this.entriesBySequence];
  }

  count(): number {
    return this.entriesBySequence.length;
  }
}
