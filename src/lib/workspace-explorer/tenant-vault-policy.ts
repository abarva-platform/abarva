import type {
  DataAccessClass,
  UserProgramAccessPolicy,
} from "@/lib/auth/program-access-policy";
import type { UserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import type { WorkspaceItem } from "./types";

type WorkspaceDataClass = DataAccessClass;

export function workspaceDataClassFor(
  classification: string | null | undefined,
): WorkspaceDataClass {
  const normalized = (classification ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!normalized) return "internal";
  if (normalized === "public") return "public";
  if (normalized === "internal") return "internal";
  if (normalized === "confidential") return "confidential";
  if (normalized.includes("financial")) return "restricted_financial";
  if (
    normalized === "restricted" ||
    normalized.includes("phi") ||
    normalized.includes("pii")
  ) {
    return "restricted_phi_pii";
  }
  if (normalized.includes("admin")) return "admin_only";
  return "confidential";
}

export function isWorkspaceItemAllowedByClasses(
  item: WorkspaceItem,
  allowedDataClasses: ReadonlyArray<WorkspaceDataClass>,
): boolean {
  return allowedDataClasses.includes(
    workspaceDataClassFor(item.classification),
  );
}

function sourceScopeAllows(
  item: WorkspaceItem,
  sourcePolicy: UserSourceAccessPolicy,
): boolean {
  if (item.module !== "source") return true;
  if (sourcePolicy.sourceEventIdsAllowed === null) return true;
  const sourceEventId =
    typeof item.blobPath === "string" && item.blobPath.startsWith("source:")
      ? item.blobPath.slice("source:".length)
      : null;
  return sourceEventId
    ? sourcePolicy.sourceEventIdsAllowed.includes(sourceEventId)
    : sourcePolicy.sourceEventIdsAllowed.length > 0;
}

function movesScopeAllows(
  item: WorkspaceItem,
  programPolicy: UserProgramAccessPolicy,
): boolean {
  if (item.module !== "moves") return true;
  if (programPolicy.programIdsAllowed === null) return true;
  const moveId =
    typeof item.blobPath === "string" && item.blobPath.startsWith("move:")
      ? item.blobPath.slice("move:".length)
      : null;
  return moveId
    ? programPolicy.programIdsAllowed.includes(moveId)
    : programPolicy.programIdsAllowed.length > 0;
}

export function filterTenantVaultItemsForPolicies(
  items: ReadonlyArray<WorkspaceItem>,
  policies: {
    source: UserSourceAccessPolicy;
    moves: UserProgramAccessPolicy;
  },
): WorkspaceItem[] {
  return items.filter((item) => {
    if (!sourceScopeAllows(item, policies.source)) return false;
    if (!movesScopeAllows(item, policies.moves)) return false;
    const allowedClasses =
      item.module === "source"
        ? policies.source.allowedDataClasses
        : policies.moves.allowedDataClasses;
    return isWorkspaceItemAllowedByClasses(item, allowedClasses);
  });
}
