const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();
const mockAuthoredApproval = jest.fn();
const mockAuthoredFlag = jest.fn();
let mockAuthoredP2Flag = true;
jest.mock("@/lib/data-plane/write-adapters/programsWriteAdapter", () => ({ createAzureProgramsWriteAdapter: () => ({ runAuthoredApproval: (...args: unknown[]) => mockAuthoredApproval(...args) }) }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: (_ctx: unknown, key: string) => key === "moves_authored_p2_draft_upload_v1" ? mockAuthoredP2Flag : mockAuthoredFlag() }));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock("../audit-log", () => ({
  __esModule: true,
  writeProgramAuditLogBestEffort: jest.fn(),
}));

import { signOffDeliverable } from "../mutations";
import { stampApprovedEvidenceLineage } from "@/lib/programs/deliverables/approved-evidence-lineage";
import { createHash } from "node:crypto";

function selectDeliverable(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function insertVersion(payloads: unknown[]) {
  return {
    insert: jest.fn((payload) => {
      payloads.push(payload);
      return { error: null };
    }),
  };
}

function updateDeliverable(payloads: unknown[]) {
  return {
    update: jest.fn((payload) => {
      payloads.push(payload);
      return {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: "deliverable-1" },
          error: null,
        }),
      };
    }),
  };
}

describe("signOffDeliverable", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: "move-1" });
  });

  it.each(["before_mutation_read", "before_final_write"])(
    "the real mutation refuses a reviewed-version race %s without approving later bytes",
    async (stage) => {
      const pointer = {
        current_version: stage === "before_mutation_read" ? 2 : 1,
        signed_off_version: null,
        status: "draft",
        structured_data: {},
      };
      const versions = [
        {
          id: "version-1",
          version: 1,
          content: "Reviewed version A",
          structured_data: {},
        },
        {
          id: "version-2",
          version: 2,
          content: "Unreviewed version B",
          structured_data: {},
        },
      ];
      const originalVersions = structuredClone(versions);
      const applied: unknown[] = [];
      const lifecycle: unknown[] = [];
      const filters: Array<[string, unknown]> = [];
      fromMock.mockImplementation((table: string) => {
        let update: Record<string, unknown> | null = null;
        const eqs: Array<[string, unknown]> = [];
        const query = {
          select: () => query,
          eq: (key: string, value: unknown) => {
            eqs.push([key, value]);
            filters.push([key, value]);
            return query;
          },
          in: () => query,
          update: (value: Record<string, unknown>) => {
            update = value;
            return query;
          },
          insert: (value: unknown) => {
            lifecycle.push(value);
            return { error: null };
          },
          maybeSingle: async () => {
            if (table === "deliverable_versions")
              return {
                data: versions.find(
                  (row) =>
                    row.version === eqs.find(([key]) => key === "version")?.[1],
                ),
                error: null,
              };
            if (!update) return { data: { ...pointer }, error: null };
            if (stage === "before_final_write") pointer.current_version = 2;
            const expected = eqs.find(
              ([key]) => key === "current_version",
            )?.[1];
            if (expected !== undefined && expected !== pointer.current_version)
              return { data: null, error: null };
            applied.push(update);
            Object.assign(pointer, update);
            return { data: { id: "deliverable-1" }, error: null };
          },
        };
        return query;
      });
      await expect(
        signOffDeliverable(
          { clientId: "client-1", userId: "synthetic-operator" },
          "move-1",
          "deliverable-1",
          {
            reviewedVersion: {
              version: 1,
              versionId: "version-1",
              contentHash: createHash("sha256")
                .update("Reviewed version A")
                .digest("hex"),
              planBindingHash: null,
              planHash: null,
            },
            approvedArtifactId: "reviewed-version-1-artifact",
            approvalLineage: {
              source: "moves_program_generate",
              generatedArtifactId: "reviewed-version-1-generation",
              approvalMode: "approve_generated_deliverable_as_is",
              ...stampApprovedEvidenceLineage({
                evidenceSnapshotHash: "reviewed-v1",
                phaseEvidenceSnapshotHash: "reviewed-v1",
                at: "2026-10-11T00:00:00Z",
              }),
            },
          } as never,
        ),
      ).rejects.toMatchObject({ code: "deliverable_review_changed" });
      expect(pointer.current_version).toBe(2);
      expect(pointer.signed_off_version).toBeNull();
      expect(pointer.status).toBe("draft");
      expect(applied).toHaveLength(0);
      expect(lifecycle).toHaveLength(0);
      expect(versions).toEqual(originalVersions);
      if (stage === "before_final_write")
        expect(filters).toContainEqual(["current_version", 1]);
    },
  );

  it("refuses an uploaded replacement for a changed draft before inserting a version", async () => {
    const versions: unknown[] = [];
    const lifecycle: unknown[] = [];
    let reads = 0;
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_versions") return insertVersion(versions);
      if (table === "deliverable_lifecycle_events")
        return insertVersion(lifecycle);
      if (++reads === 1)
        return selectDeliverable({
          data: {
            current_version: 2,
            signed_off_version: null,
            structured_data: {},
          },
          error: null,
        });
      const filters: Array<[string, unknown]> = [];
      const query = {
        update: () => query,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return query;
        },
        in: () => query,
        select: () => query,
        maybeSingle: async () => ({
          data:
            filters.find(([key]) => key === "current_version")?.[1] === 2
              ? { id: "deliverable-1" }
              : null,
          error: null,
        }),
      };
      return query;
    });
    await expect(
      signOffDeliverable(
        { clientId: "client-1", userId: "synthetic-operator" },
        "move-1",
        "deliverable-1",
        {
          expectedCurrentVersion: 1,
          approvedContent: {
            content: "Reviewed replacement",
            fileName: "replacement.docx",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            parseMethod: "local_fixture",
          },
        },
      ),
    ).rejects.toMatchObject({ code: "deliverable_review_changed" });
    expect(versions).toHaveLength(0);
    expect(lifecycle).toHaveLength(0);
  });

  it("turns an uploaded client-approved replacement into the signed-off authoritative version", async () => {
    const versionPayloads: unknown[] = [];
    const updatePayloads: unknown[] = [];
    const lifecycleEvents: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") {
        const deliverableCalls = fromMock.mock.calls.filter(
          ([t]) => t === "deliverables_v2",
        ).length;
        if (deliverableCalls === 1) {
          return selectDeliverable({
            data: {
              current_version: 2,
              signed_off_version: 1,
              structured_data: {
                source: "generated_artifact_acceptance",
                generatedArtifactId: "artifact-old",
                evidenceSnapshotHash: "revision-old",
                retained: "existing governed metadata",
              },
            },
            error: null,
          });
        }
        return updateDeliverable(updatePayloads);
      }
      if (table === "deliverable_versions")
        return insertVersion(versionPayloads);
      if (table === "deliverable_lifecycle_events")
        return insertVersion(lifecycleEvents);
      throw new Error(`Unexpected table ${table}`);
    });

    const ok = await signOffDeliverable(
      {
        clientId: "client-1",
        userId: "person-1",
        email: "approver@example.com",
      },
      "move-1",
      "deliverable-1",
      {
        approvedArtifactId: "artifact-approved-1",
        approvedContent: {
          content: "Client-approved charter text after human edits.",
          fileName: "charter-client-approved.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          parseMethod: "docx-mammoth",
          warnings: [],
          generationLineage: {
            evidenceSnapshotHash: "revision-current",
          },
        },
        approvalLineage: {
          source: "generated_artifact_acceptance",
          generatedArtifactId: "artifact-current",
          // The lineage production records: both revisions, the phase scope, and
          // the moment they were read. See `approved-evidence-lineage.ts`.
          ...stampApprovedEvidenceLineage({
            evidenceSnapshotHash: "revision-current",
            phaseEvidenceSnapshotHash: "revision-current-phase-1",
            at: "2026-10-01T11:00:00.000Z",
          }),
          approvalMode: "client_approved_replacement",
        },
        approvalRationale:
          "Synthetic review accepted the current evidence-bound version.",
      },
    );

    expect(ok).toBe(true);
    expect(versionPayloads).toEqual([
      expect.objectContaining({
        deliverable_id: "deliverable-1",
        version: 3,
        origin: "client_uploaded",
        content: "Client-approved charter text after human edits.",
        structured_data: expect.objectContaining({
          source: "client_approved_upload",
          approved_artifact_id: "artifact-approved-1",
          uploaded_file_name: "charter-client-approved.docx",
          human_approved: true,
          replaces_ai_draft: true,
        }),
      }),
    ]);
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        status: "signed_off",
        current_version: 3,
        signed_off_version: 3,
        approved_artifact_id: "artifact-approved-1",
        authoritative_lifecycle_state: "human_approved",
        authoritative_flag_source: "normal_flow",
        requires_revalidation: false,
        // Strict on purpose: the merge must keep `retained`, overwrite the old
        // lineage, and carry the whole stamp — the moment included, since the
        // currency check cannot run without it.
        structured_data: {
          source: "generated_artifact_acceptance",
          generatedArtifactId: "artifact-current",
          evidenceSnapshotHash: "revision-current",
          phaseEvidenceSnapshotHash: "revision-current-phase-1",
          evidenceSnapshotScope: "phase",
          generatedAt: "2026-10-01T11:00:00.000Z",
          approvalMode: "client_approved_replacement",
          retained: "existing governed metadata",
        },
      }),
    );
    expect(lifecycleEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "version_created",
          origin: "client_uploaded",
          version: 3,
        }),
        expect.objectContaining({
          event_type: "submitted_for_review",
          version: 3,
        }),
        expect.objectContaining({
          event_type: "approval_granted",
          decision: "approved",
          version: 3,
          comments:
            "Synthetic review accepted the current evidence-bound version.",
        }),
        expect.objectContaining({
          event_type: "superseded",
          version: 1,
          related_version: 3,
        }),
      ]),
    );
  });

  it("supersedes a prior approved upload — a second approved replacement moves signed_off_version and approved_artifact_id forward, not just accumulates", async () => {
    // The artifact-level supersession chain (move_artifacts.lifecycle_state/
    // superseded_by_artifact_id) is exercised by saveMoveArtifact and already
    // covered directly in move-artifacts.test.ts. This proves the OTHER half:
    // deliverables_v2's pointer (approved_artifact_id/signed_off_version)
    // tracks the CURRENT approved upload across repeated sign-offs, not the
    // first one.
    const versionPayloads: unknown[] = [];
    const updatePayloads: unknown[] = [];
    const lifecycleEvents: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") {
        const deliverableCalls = fromMock.mock.calls.filter(
          ([t]) => t === "deliverables_v2",
        ).length;
        // Odd calls (1st, 3rd) are the read-current_version select; even calls
        // (2nd, 4th) are the update.
        if (deliverableCalls % 2 === 1) {
          const readIndex = Math.floor(deliverableCalls / 2);
          return selectDeliverable({
            data: {
              current_version: 2 + readIndex,
              signed_off_version: deliverableCalls === 1 ? null : 3,
            },
            error: null,
          });
        }
        return updateDeliverable(updatePayloads);
      }
      if (table === "deliverable_versions")
        return insertVersion(versionPayloads);
      if (table === "deliverable_lifecycle_events")
        return insertVersion(lifecycleEvents);
      throw new Error(`Unexpected table ${table}`);
    });

    const ctx = {
      clientId: "client-1",
      userId: "person-1",
      email: "approver@example.com",
    };

    await signOffDeliverable(ctx, "move-1", "deliverable-1", {
      approvedArtifactId: "artifact-approved-1",
      approvedContent: {
        content: "First client-approved replacement.",
        fileName: "v1.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        parseMethod: "docx-mammoth",
        warnings: [],
      },
    });

    await signOffDeliverable(ctx, "move-1", "deliverable-1", {
      approvedArtifactId: "artifact-approved-2",
      approvedContent: {
        content: "Second, superseding client-approved replacement.",
        fileName: "v2.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        parseMethod: "docx-mammoth",
        warnings: [],
      },
    });

    // Both approved versions are preserved as real deliverable_versions rows
    // (version history, not overwritten)...
    expect(versionPayloads).toHaveLength(2);
    expect(versionPayloads[0]).toEqual(
      expect.objectContaining({
        version: 3,
        content: "First client-approved replacement.",
      }),
    );
    expect(versionPayloads[1]).toEqual(
      expect.objectContaining({
        version: 4,
        content: "Second, superseding client-approved replacement.",
      }),
    );

    // ...but deliverables_v2's authoritative pointer moves forward to the
    // LATEST approval, not the first one.
    expect(updatePayloads).toHaveLength(2);
    expect(updatePayloads[1]).toEqual(
      expect.objectContaining({
        status: "signed_off",
        current_version: 4,
        signed_off_version: 4,
        approved_artifact_id: "artifact-approved-2",
      }),
    );
  });
});


describe("authored current-version approval mutation bridge", () => {
  const move = "10000000-0000-4000-8000-000000000001";
  const ctx = { clientId: "client-1", clientKey: "meridian", userId: "operator-1" };
  const receipt = { source: "authored_docx_upload" as const, origin: "abarva_uploaded" as const,
    tenantKey: "meridian-health", storageTenantKey: "meridian", moveId: move, deliverableTypeKey: "charter" as const, phase: 1 as const,
    requestId: "50000000-0000-4000-8000-000000000001", sha256: "a".repeat(64), artifactId: "20000000-0000-4000-8000-000000000001",
    artifactVersion: 1, uploadedBy: "author-uploader", authoringBasis: "abarva_authored_unsigned" as const,
    delegatedReviewReference: "delegated-business-review", originalFileName: "charter.docx", parseMethod: "docx-parser",
    evidenceSnapshotHash: "approved-basis", phaseEvidenceSnapshotHash: "approved-phase-basis", evidenceSnapshotScope: "phase" as const, observedAt: "2026-10-12T18:00:00Z" };
  const version = { id: "version-1", content: "Authored scope", structured_data: { source: "authored_docx_upload", authoredUpload: receipt } };
  beforeEach(() => {
    fromMock.mockReset(); getProgramByIdMock.mockResolvedValue({ id: move });
    mockAuthoredFlag.mockReturnValue(true); mockAuthoredApproval.mockReset().mockResolvedValue({ ok: true, data: { applied: true } });
    fromMock.mockImplementation(table => selectDeliverable({ data: table === "deliverables_v2" ? { current_version: 1, signed_off_version: null, structured_data: {} } : version, error: null }));
  });
  async function options() {
    const { captureReviewedDeliverableVersion } = await import("../deliverable-review-receipt");
    return { authoredApprovalReceipt: receipt, approvedArtifactId: receipt.artifactId, expectedCurrentVersion: 1, reviewedVersion: captureReviewedDeliverableVersion(1, version) };
  }
  it("uses the atomic authored seam with original author and workspace reviewer distinct", async () => {
    expect(await signOffDeliverable(ctx, move, "document-1", await options())).toBe(true);
    expect(mockAuthoredApproval).toHaveBeenCalledWith(expect.objectContaining({ versionId: "version-1", version: 1, content: "Authored scope", userId: "operator-1", receipt: expect.objectContaining({ uploadedBy: "author-uploader", origin: "abarva_uploaded" }) }));
    expect(fromMock.mock.calls.map(c => c[0])).toEqual(["deliverables_v2", "deliverable_versions"]);
  });
  it("refuses an approval without the exact reviewed version receipt", async () => {
    await expect(signOffDeliverable(ctx, move, "document-1", { authoredApprovalReceipt: receipt, approvedArtifactId: receipt.artifactId })).rejects.toMatchObject({ code: "deliverable_review_changed" });
    expect(mockAuthoredApproval).not.toHaveBeenCalled();
  });
  it("refuses a flag-off or changed atomic version without falling through to AI approval", async () => {
    mockAuthoredFlag.mockReturnValue(false);
    await expect(signOffDeliverable(ctx, move, "document-1", await options())).rejects.toMatchObject({ code: "deliverable_review_changed" });
    expect(mockAuthoredApproval).not.toHaveBeenCalled();
    mockAuthoredFlag.mockReturnValue(true); mockAuthoredApproval.mockResolvedValue({ ok: true, data: { applied: false } });
    await expect(signOffDeliverable(ctx, move, "document-1", await options())).rejects.toMatchObject({ code: "deliverable_review_changed" });
  });
  it("reports a failed approval transaction without claiming a sign-off", async () => {
    mockAuthoredApproval.mockResolvedValue({ ok: false });
    await expect(signOffDeliverable(ctx, move, "document-1", await options())).rejects.toMatchObject({ code: "authored_approval_unavailable", status: 503 });
  });
  it("passes the complete original P2 package and exact reviewed version to the existing atomic seam", async () => {
    const r = { ...receipt, source: "authored_docx_upload" as const, phase: 2 as const, deliverableTypeKey: "design_workshop_guide" as const,
      fileRole: "primary" as const, fileFormat: "docx" as const, textSha256: "d".repeat(64), originalFileName: "guide.docx" };
    const v = { ...version, structured_data: { source: r.source, authoredUpload: r } };
    fromMock.mockImplementation(table => selectDeliverable({ data: table === "deliverables_v2" ? { current_version: 1, signed_off_version: null, structured_data: {} } : v, error: null }));
    const { captureReviewedDeliverableVersion } = await import("../deliverable-review-receipt");
    const opts = { authoredApprovalReceipt: r, approvedArtifactId: r.artifactId, expectedCurrentVersion: 1, reviewedVersion: captureReviewedDeliverableVersion(1,v) };
    mockAuthoredP2Flag = true; expect(await signOffDeliverable(ctx,move,"document-1",opts)).toBe(true);
    expect(mockAuthoredApproval).toHaveBeenCalledWith(expect.objectContaining({receipt:r,versionId:"version-1",content:"Authored scope"}));
    mockAuthoredApproval.mockClear(); mockAuthoredP2Flag = false;
    await expect(signOffDeliverable(ctx,move,"document-1",opts)).rejects.toMatchObject({code:"deliverable_review_changed"});
    expect(mockAuthoredApproval).not.toHaveBeenCalled(); mockAuthoredP2Flag = true;
  });

});
