import { createHash } from "node:crypto";

import { generatePhaseSuccessPackages } from "../generate";
import { buildDefaultPhaseSuccessRuntimeTruth, buildPhaseSuccessPackages } from "../core";
import { getPhasePackV2 } from "@/lib/programs/phase-packs/v2";
import { getMovePhasePlaybook } from "@/lib/programs/playbook/move-phase-playbook";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { StrategicMove } from "@/lib/programs/types.ui";

const listMoveArtifacts = jest.fn();
const saveMoveArtifact = jest.fn();

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  listMoveArtifacts: (...args: unknown[]) => listMoveArtifacts(...args),
  saveMoveArtifact: (...args: unknown[]) => saveMoveArtifact(...args),
}));

const ctx = {
  clientId: "tenant-1",
  clientKey: "meridian",
  userId: "user-1",
  role: "maestro",
  email: "maestro@example.com",
} as TenancyCtx;

const move = {
  id: "move-123",
  name: "Meridian Member Experience AI Assist",
  tenant: { id: "tenant-1", name: "Meridian Health", industryCode: "healthcare" },
  charter: null,
  functionPackKey: "healthcare_member_services",
  archetype: "customer-service-ai",
  currentPhase: 2,
  phaseLabel: "P2",
  status: { key: "active", text: "Active", description: "Active" },
  statusColor: "amber",
  sponsor: null,
  participants: [],
  valueAtStake: {
    projected: { low: 2_000_000, high: 5_000_000, currency: "USD" },
    verified: null,
    assumptions: null,
  },
  deliverables: [],
  gateCriteria: [
    {
      id: "GC-P2-1",
      label: "Baseline evidence accepted",
      completed: false,
      severity: "hard",
      verified: true,
    },
  ],
  recentActivity: [],
  linkedEvidence: [],
  mapLabel: "Meridian",
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
  displayCode: "M-1",
} satisfies StrategicMove;

beforeEach(() => {
  jest.clearAllMocks();
  saveMoveArtifact.mockResolvedValue({
    artifactId: "new-artifact",
    version: 1,
    blobPath: "blob/path",
    blobStored: true,
  });
});

describe("generatePhaseSuccessPackages", () => {
  it("reuses identical current artifacts to prevent duplicate rapid-click versions", async () => {
    const pkg = buildPhaseSuccessPackages({
      move,
      phase: 2,
      phasePack: getPhasePackV2(2),
      playbook: getMovePhasePlaybook(2),
      runtime: buildDefaultPhaseSuccessRuntimeTruth({
        move,
        phase: 2,
        phasePack: getPhasePackV2(2),
        generatedAt: "2026-07-13T12:00:00.000Z",
        generatedBy: "user-1",
        sourceArtifacts: [],
      }),
    })[0];
    const sha256 = createHash("sha256").update(pkg.body).digest("hex");
    listMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "existing-artifact",
        move_id: move.id,
        phase: 2,
        artifact_type: "p2_phase_execution_package",
        artifact_family: "session_artifact",
        title: pkg.title,
        file_name: pkg.fileName,
        file_format: "md",
        blob_container: "context-drops",
        blob_path: "blob/path",
        file_size: 100,
        version: 3,
        status: "draft",
        generated_by: "user-1",
        generated_at: "2026-07-13T12:00:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T12:00:00.000Z",
        metadata: { sha256, storage: "azure_blob" },
      },
    ]);

    const result = await generatePhaseSuccessPackages(ctx, {
      move,
      phase: 2,
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(result.packages[0].artifactId).toBe("existing-artifact");
    expect(result.packages[0].reusedExisting).toBe(true);
    expect(saveMoveArtifact).toHaveBeenCalledTimes(1);
  });

  it("uses included source artifact timestamps for evidence cutoff metadata", async () => {
    listMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "source-artifact-1",
        move_id: move.id,
        phase: 2,
        artifact_type: "uploaded_evidence",
        artifact_family: "evidence",
        title: "Call center baseline",
        file_name: "call-center-baseline.csv",
        file_format: "csv",
        blob_container: "context-drops",
        blob_path: "blob/source-1",
        file_size: 100,
        version: 1,
        status: "approved",
        generated_by: "user-1",
        generated_at: "2026-07-13T10:15:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T10:00:00.000Z",
        metadata: { storage: "azure_blob" },
      },
      {
        artifact_id: "source-artifact-2",
        move_id: move.id,
        phase: 2,
        artifact_type: "workshop_notes",
        artifact_family: "session_artifact",
        title: "Sponsor playback notes",
        file_name: "sponsor-playback.md",
        file_format: "md",
        blob_container: "context-drops",
        blob_path: "blob/source-2",
        file_size: 100,
        version: 1,
        status: "draft",
        generated_by: "user-1",
        generated_at: null,
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T11:30:00.000Z",
        metadata: { storage: "azure_blob" },
      },
    ]);

    await generatePhaseSuccessPackages(ctx, {
      move: {
        ...move,
        linkedEvidence: [
          {
            id: "linked-evidence-1",
            anchor: "AHT baseline",
            summary: "Average handle time baseline from operations.",
            url: "/evidence/linked-evidence-1",
          },
        ],
      },
      phase: 2,
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(saveMoveArtifact).toHaveBeenCalledTimes(2);
    const firstSave = saveMoveArtifact.mock.calls[0][1];
    expect(firstSave.metadata.evidenceCutoffAt).toBe("2026-07-13T11:30:00.000Z");
    expect(firstSave.metadata.packageStatus).toBe("evidence_incomplete");
    expect(firstSave.status).toBe("draft");
    expect(firstSave.metadata.sourceArtifactIds).toEqual([
      "source-artifact-1",
      "source-artifact-2",
    ]);
    expect(firstSave.metadata.findingIds).toEqual([]);
  });

  it("reuses current packages when only the generated timestamp changes", async () => {
    listMoveArtifacts.mockResolvedValueOnce([]);
    saveMoveArtifact.mockImplementation((_ctx, input) => {
      const suffix =
        input.artifactType === "p2_phase_execution_package"
          ? "execution"
          : "readiness";
      return Promise.resolve({
        artifactId: `new-${suffix}`,
        version: 1,
        blobPath: `blob/${suffix}`,
        blobStored: true,
      });
    });

    await generatePhaseSuccessPackages(ctx, {
      move,
      phase: 2,
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    const firstExecutionSave = saveMoveArtifact.mock.calls[0][1];
    const firstReadinessSave = saveMoveArtifact.mock.calls[1][1];
    listMoveArtifacts.mockResolvedValueOnce([
      {
        artifact_id: "new-execution",
        move_id: move.id,
        phase: 2,
        artifact_type: "p2_phase_execution_package",
        artifact_family: "session_artifact",
        title: firstExecutionSave.title,
        file_name: firstExecutionSave.fileName,
        file_format: "md",
        blob_container: "context-drops",
        blob_path: "blob/execution",
        file_size: 100,
        version: 1,
        status: "draft",
        generated_by: "phase-success-package",
        generated_at: "2026-07-13T12:00:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T12:00:00.000Z",
        metadata: {
          storage: "azure_blob",
          phaseSuccessContentFingerprint:
            firstExecutionSave.metadata.phaseSuccessContentFingerprint,
        },
      },
      {
        artifact_id: "new-readiness",
        move_id: move.id,
        phase: 2,
        artifact_type: "p2_next_phase_readiness_package",
        artifact_family: "session_artifact",
        title: firstReadinessSave.title,
        file_name: firstReadinessSave.fileName,
        file_format: "md",
        blob_container: "context-drops",
        blob_path: "blob/readiness",
        file_size: 100,
        version: 1,
        status: "draft",
        generated_by: "phase-success-package",
        generated_at: "2026-07-13T12:00:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T12:00:00.000Z",
        metadata: {
          storage: "azure_blob",
          phaseSuccessContentFingerprint:
            firstReadinessSave.metadata.phaseSuccessContentFingerprint,
        },
      },
    ]);

    const second = await generatePhaseSuccessPackages(ctx, {
      move,
      phase: 2,
      generatedAt: "2026-07-13T12:01:00.000Z",
    });

    expect(saveMoveArtifact).toHaveBeenCalledTimes(2);
    expect(second.packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactId: "new-execution",
          reusedExisting: true,
          version: 1,
        }),
        expect.objectContaining({
          artifactId: "new-readiness",
          reusedExisting: true,
          version: 1,
        }),
      ]),
    );
  });

  it("blocks regeneration when the current package is approved", async () => {
    listMoveArtifacts.mockResolvedValue([
      {
        artifact_id: "approved-artifact",
        move_id: move.id,
        phase: 2,
        artifact_type: "p2_phase_execution_package",
        artifact_family: "session_artifact",
        title: "Approved",
        file_name: "approved.md",
        file_format: "md",
        blob_container: "context-drops",
        blob_path: "blob/path",
        file_size: 100,
        version: 2,
        status: "approved",
        generated_by: "user-1",
        generated_at: "2026-07-13T12:00:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-07-13T12:00:00.000Z",
        metadata: { sha256: "different", storage: "azure_blob" },
      },
    ]);

    await expect(
      generatePhaseSuccessPackages(ctx, {
        move,
        phase: 2,
        generatedAt: "2026-07-13T12:00:00.000Z",
      }),
    ).rejects.toThrow("approved_package_requires_manual_regeneration");
    expect(saveMoveArtifact).not.toHaveBeenCalled();
  });
});
