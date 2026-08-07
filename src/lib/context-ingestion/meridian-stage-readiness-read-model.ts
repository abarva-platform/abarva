import { azureRead, type AzureReadClient } from "@/lib/data-plane/azureRead";

import type { MeridianPhase0Manifest } from "./meridian-phase0-manifest";
import type {
  MeridianReadinessContextChunk,
  MeridianReadinessEvidenceRow,
  MeridianStageReadinessInput,
} from "./meridian-stage-readiness";

type ContextChunkRow = {
  chunk_metadata?: Record<string, unknown> | null;
  provenance?: Record<string, unknown> | null;
};

type EvidenceLedgerRow = {
  artifact_ref?: string | null;
  source_ref?: Record<string, unknown> | null;
};

export interface MeridianStageReadinessReadModelArgs {
  clientId: string;
  manifest?: MeridianPhase0Manifest | null;
  readClient?: AzureReadClient;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function contextChunk(row: ContextChunkRow): MeridianReadinessContextChunk {
  return {
    chunkMetadata: asRecord(row.chunk_metadata),
    provenance: asRecord(row.provenance),
  };
}

function evidenceRow(
  row: EvidenceLedgerRow,
): MeridianReadinessEvidenceRow | null {
  if (!row.artifact_ref) return null;
  return {
    artifactRef: row.artifact_ref,
    sourceRef: asRecord(row.source_ref),
  };
}

export async function getMeridianStageReadinessInputForClient(
  args: MeridianStageReadinessReadModelArgs,
): Promise<MeridianStageReadinessInput> {
  const readClient = args.readClient ?? azureRead;
  const [contextRows, evidenceRows] = await Promise.all([
    readClient.select<ContextChunkRow>({
      table: "enterprise_context_chunks",
      columns: ["chunk_metadata", "provenance"],
      where: { client_id: args.clientId },
      missingTable: "empty",
      limit: 5000,
    }),
    readClient.select<EvidenceLedgerRow>({
      table: "evidence_ledger",
      columns: ["artifact_ref", "source_ref"],
      where: {
        client_id: args.clientId,
        surface: "moves",
      },
      missingTable: "empty",
      limit: 5000,
    }),
  ]);

  return {
    contextChunks: contextRows.map(contextChunk),
    evidenceRows: evidenceRows
      .map(evidenceRow)
      .filter((row): row is MeridianReadinessEvidenceRow => Boolean(row)),
    manifest: args.manifest ?? null,
  };
}
