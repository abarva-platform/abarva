import type { SourceStageKey } from "@/lib/source/types";

export type WorkspaceItemOrigin = "uploaded" | "generated";

export type WorkspaceItemState =
  | "loaded"
  | "parsed"
  | "available"
  | "usable"
  | "draft"
  | "review"
  | "approved"
  | "superseded"
  | "blocked"
  | "missing";

export type WorkspaceItemModule = "source" | "moves";

export type WorkspaceItemKind =
  | "input"
  | "deliverable"
  | "approval"
  | "evidence"
  | "vendor_response"
  | "attachment";

export interface WorkspaceItemLineage {
  readonly cites: ReadonlyArray<string>;
  readonly usedBy: ReadonlyArray<string>;
  readonly status?: "recorded" | "not_recorded";
}

export interface WorkspaceItemAudit {
  readonly createdBy?: string | null;
  readonly createdAt?: string | null;
  readonly updatedBy?: string | null;
  readonly updatedAt?: string | null;
  readonly approvedBy?: string | null;
  readonly approvedAt?: string | null;
}

export interface WorkspaceGenerateCandidate {
  readonly id: string;
  readonly module: WorkspaceItemModule;
  readonly artifactCode: string;
  readonly label: string;
  readonly description?: string | null;
  readonly stageKey?: SourceStageKey | string | null;
  readonly state: WorkspaceItemState;
  readonly generateHref: string;
  readonly reviewHref: string;
  readonly method?: "GET" | "POST";
  readonly responseKind?: "html" | "json";
}

export interface WorkspaceGenerateIntent {
  readonly module: WorkspaceItemModule;
  readonly eventId: string;
  readonly stageKey?: SourceStageKey | string | null;
  readonly candidates: ReadonlyArray<WorkspaceGenerateCandidate>;
}

export interface WorkspaceUploadFamilyOption {
  readonly value: string;
  readonly label: string;
}

export interface WorkspaceUploadIntent {
  readonly module: WorkspaceItemModule;
  readonly eventId: string;
  readonly stageKey?: SourceStageKey | string | null;
  readonly uploadHref: string;
  readonly acceptedFormats: string;
  readonly defaultClassification: string;
  readonly classificationOptions: ReadonlyArray<string>;
  readonly familyOptions: ReadonlyArray<WorkspaceUploadFamilyOption>;
  readonly defaultFamily?: string | null;
}

export interface WorkspaceItem {
  readonly id: string;
  readonly name: string;
  readonly module: WorkspaceItemModule;
  readonly type: string;
  readonly kind: WorkspaceItemKind;
  readonly origin: WorkspaceItemOrigin;
  readonly state: WorkspaceItemState;
  readonly version?: string | number | null;
  readonly stageKey?: SourceStageKey | string | null;
  readonly artifactCode?: string | null;
  readonly sourceLabel?: string | null;
  readonly description?: string | null;
  readonly href?: string | null;
  readonly downloadHref?: string | null;
  readonly classification?: string | null;
  readonly vendor?: string | null;
  readonly lineage: WorkspaceItemLineage;
  readonly audit: WorkspaceItemAudit;
  readonly blobPath?: string | null;
}

// ── Progression ("what's needed to advance") — surfaces the stage progression
// engine (`computeStageProgression`) as an ordered, one-click action list. ──
export type WorkspaceProgressionKind =
  | "upload"
  | "generate"
  | "prepare"
  | "send"
  | "approve"
  | "advance";

export interface WorkspaceProgressionNeed {
  readonly id: string;
  readonly kind: WorkspaceProgressionKind;
  readonly label: string;
  readonly detail?: string;
  /** One-click target when the action is wired; absent when blocked. */
  readonly href?: string;
  readonly blocked?: boolean;
  readonly blockedReason?: string;
  /** Soft need (e.g. recommended evidence) — surfaced but non-blocking. */
  readonly optional?: boolean;
}

export interface WorkspaceProgression {
  readonly gateSummary: string;
  readonly allClear: boolean;
  readonly needs: WorkspaceProgressionNeed[];
}
