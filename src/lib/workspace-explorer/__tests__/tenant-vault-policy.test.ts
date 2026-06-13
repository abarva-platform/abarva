import {
  filterTenantVaultItemsForPolicies,
  workspaceDataClassFor,
} from "@/lib/workspace-explorer/tenant-vault-policy";
import type { UserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import type { UserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import type { WorkspaceItem } from "@/lib/workspace-explorer/types";

function item(overrides: Partial<WorkspaceItem>): WorkspaceItem {
  return {
    id: "item_1",
    name: "Artifact",
    module: "source",
    type: "pdf",
    kind: "evidence",
    origin: "uploaded",
    state: "loaded",
    classification: "Confidential",
    lineage: { cites: [], usedBy: [], status: "not_recorded" },
    audit: {},
    ...overrides,
  };
}

function sourcePolicy(
  overrides: Partial<UserSourceAccessPolicy> = {},
): UserSourceAccessPolicy {
  return {
    userId: "user_1",
    clientId: "client_1",
    activeClientKey: "skyharbor",
    accessLevel: "source_member",
    sourceScope: "all_client_source_events",
    sourceEventIdsAllowed: null,
    canAdminUsers: false,
    canCreateSourceEvents: true,
    canApproveSourceStages: true,
    canApproveAward: false,
    canUploadSourceArtifacts: true,
    canGenerateSourcingArtifacts: true,
    canPublishSourcingArtifacts: false,
    holdingGroupId: null,
    holdingGroupRole: "standalone",
    federatedScope: "none",
    canReadHoldingGroupAggregates: false,
    canReadSiblingTransactionGrain: false,
    canViewFinancialData: false,
    allowedDataClasses: ["public", "internal", "confidential"],
    deniedDataClasses: ["restricted_phi_pii", "admin_only"],
    outputPolicy: {
      exactFinancialValues: false,
      financialSummaries: true,
      restrictedSourceIds: false,
      saveRestrictedContentToArtifacts: false,
    },
    ...overrides,
  };
}

function movesPolicy(
  overrides: Partial<UserProgramAccessPolicy> = {},
): UserProgramAccessPolicy {
  return {
    userId: "user_1",
    clientId: "client_1",
    accessLevel: "program_member",
    programScope: "all_client_programs",
    programIdsAllowed: null,
    canAdminUsers: false,
    canCreatePrograms: true,
    canApproveGates: true,
    canUploadArtifacts: true,
    canGenerateDeliverables: true,
    canPublishDeliverables: false,
    canViewFinancialData: false,
    allowedDataClasses: ["public", "internal", "confidential"],
    deniedDataClasses: ["restricted_phi_pii", "admin_only"],
    outputPolicy: {
      exactFinancialValues: false,
      financialSummaries: true,
      restrictedSourceIds: false,
      saveRestrictedContentToDeliverables: false,
    },
    ...overrides,
  };
}

describe("tenant vault policy", () => {
  it("normalizes workspace classifications into access-policy data classes", () => {
    expect(workspaceDataClassFor("Public")).toBe("public");
    expect(workspaceDataClassFor("Confidential")).toBe("confidential");
    expect(workspaceDataClassFor("Restricted")).toBe("restricted_phi_pii");
    expect(workspaceDataClassFor("restricted financial")).toBe(
      "restricted_financial",
    );
  });

  it("filters restricted Source artifacts for users without that data class", () => {
    const visible = item({
      id: "visible",
      module: "source",
      classification: "Confidential",
      blobPath: "source:event_1",
    });
    const restricted = item({
      id: "restricted",
      module: "source",
      classification: "Restricted",
      blobPath: "source:event_1",
    });

    expect(
      filterTenantVaultItemsForPolicies([visible, restricted], {
        source: sourcePolicy(),
        moves: movesPolicy(),
      }).map((entry) => entry.id),
    ).toEqual(["visible"]);
  });

  it("filters Moves artifacts outside assigned program scope", () => {
    const inScope = item({
      id: "in_scope",
      module: "moves",
      blobPath: "move:move_1",
    });
    const outOfScope = item({
      id: "out_scope",
      module: "moves",
      blobPath: "move:move_2",
    });

    expect(
      filterTenantVaultItemsForPolicies([inScope, outOfScope], {
        source: sourcePolicy(),
        moves: movesPolicy({ programIdsAllowed: ["move_1"] }),
      }).map((entry) => entry.id),
    ).toEqual(["in_scope"]);
  });
});
