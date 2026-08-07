import type {
  AzureReadClient,
  AzureReadSelect,
} from "@/lib/data-plane/azureRead";

import type { MeridianPhase0Manifest } from "../meridian-phase0-manifest";
import { getMeridianStageReadinessInputForClient } from "../meridian-stage-readiness-read-model";

function fakeReadClient(
  rowsByTable: Record<string, unknown[]>,
): AzureReadClient {
  return {
    async query() {
      return [];
    },
    async select<R = Record<string, unknown>>(
      request: AzureReadSelect,
    ): Promise<R[]> {
      return (rowsByTable[request.table] ?? []) as R[];
    },
    async maybeSingle() {
      return null;
    },
    async count() {
      return 0;
    },
    async withSession(fn) {
      return fn(async () => []);
    },
  };
}

const manifest = {
  manifestId: "meridian-phase0-001",
  tenantKey: "meridian-health",
  clientName: "Meridian Health",
  generatedAt: "2026-06-05T12:00:00.000Z",
  evidenceItems: [],
  uploadedArtifacts: [],
  workloadRecords: [],
  rateCardRows: [],
  gateCriteria: [],
  approvalRecords: [],
} satisfies MeridianPhase0Manifest;

describe("Meridian stage readiness read model", () => {
  it("maps tenant context chunks and evidence ledger rows into readiness input", async () => {
    const readClient = fakeReadClient({
      enterprise_context_chunks: [
        {
          chunk_metadata: { template_id: "meridian-workload-inventory" },
          provenance: { template_id: "meridian-workload-inventory" },
        },
      ],
      evidence_ledger: [
        {
          artifact_ref: "Meridian-STARS-2026",
          source_ref: { template_id: "meridian-evidence-register" },
        },
      ],
    });

    const input = await getMeridianStageReadinessInputForClient({
      clientId: "client-meridian",
      manifest,
      readClient,
    });

    expect(input.contextChunks).toEqual([
      {
        chunkMetadata: { template_id: "meridian-workload-inventory" },
        provenance: { template_id: "meridian-workload-inventory" },
      },
    ]);
    expect(input.evidenceRows).toEqual([
      {
        artifactRef: "Meridian-STARS-2026",
        sourceRef: { template_id: "meridian-evidence-register" },
      },
    ]);
    expect(input.manifest).toBe(manifest);
  });

  it("does not expose request-body client IDs because the caller supplies the authenticated client only", async () => {
    const selectCalls: AzureReadSelect[] = [];
    const readClient: AzureReadClient = {
      async query() {
        return [];
      },
      async select<R = Record<string, unknown>>(
        request: AzureReadSelect,
      ): Promise<R[]> {
        selectCalls.push(request);
        return [] as R[];
      },
      async maybeSingle() {
        return null;
      },
      async count() {
        return 0;
      },
      async withSession(fn) {
        return fn(async () => []);
      },
    };

    await getMeridianStageReadinessInputForClient({
      clientId: "client-from-session",
      manifest,
      readClient,
    });

    expect(selectCalls).toHaveLength(2);
    expect(
      selectCalls.every(
        (call) => call.where?.client_id === "client-from-session",
      ),
    ).toBe(true);
  });
});
