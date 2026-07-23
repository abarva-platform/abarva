import { createHash, randomUUID } from "node:crypto";

import { sanitizeClientFacingSourceDraft } from "@/lib/source/agent-generation/client-facing-hygiene";
import { scanForBannedTerms } from "@/lib/source/documentation-standards/source-documentation-standards";

export type SourceArtifactSafeRepairMode = "dry_run" | "apply";

export interface SourceArtifactSafeRepairDiff {
  beforeBytes: number;
  afterBytes: number;
  removedBannedTerms: string[];
  remainingBannedTerms: string[];
  changed: boolean;
  summary: string;
}

export interface SourceArtifactSafeRepairReceipt {
  receiptId: string;
  sourceEventId: string;
  artifactStateId: string;
  artifactCode: string;
  statusAtRepair: string;
  mode: SourceArtifactSafeRepairMode;
  repairedAt: string;
  repairedByUserId: string | null;
  beforeSha256: string;
  afterSha256: string;
  beforeBannedTermMatches: string[];
  afterBannedTermMatches: string[];
  diff: SourceArtifactSafeRepairDiff;
}

export interface SourceArtifactSafeRepairPlan {
  receipt: SourceArtifactSafeRepairReceipt;
  originalBody: string;
  repairedBody: string;
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function expectedSafeRepairConfirmationPhrase(
  artifactCode: string,
): string {
  return `SAFE REPAIR ${artifactCode}`;
}

export function buildSourceArtifactSafeRepairPlan(args: {
  sourceEventId: string;
  artifactStateId: string;
  artifactCode: string;
  status: string;
  body: string;
  companyName?: string | null;
  nowIso: string;
  actorUserId?: string | null;
  mode: SourceArtifactSafeRepairMode;
}): SourceArtifactSafeRepairPlan {
  const shortCode = shortArtifactCode(args.artifactCode);
  const repairedBody = sanitizeClientFacingSourceDraft(args.body, {
    artifactCode: args.artifactCode,
    companyName: args.companyName,
  });
  const beforeBannedTermMatches = scanForBannedTerms(args.body, shortCode);
  const afterBannedTermMatches = scanForBannedTerms(repairedBody, shortCode);
  const removedBannedTerms = beforeBannedTermMatches.filter(
    (term) => !afterBannedTermMatches.includes(term),
  );
  const changed = repairedBody !== args.body;
  const beforeBytes = Buffer.byteLength(args.body, "utf8");
  const afterBytes = Buffer.byteLength(repairedBody, "utf8");
  const diff: SourceArtifactSafeRepairDiff = {
    beforeBytes,
    afterBytes,
    removedBannedTerms,
    remainingBannedTerms: afterBannedTermMatches,
    changed,
    summary: buildDiffSummary({
      beforeBytes,
      afterBytes,
      removedBannedTerms,
      remainingBannedTerms: afterBannedTermMatches,
      changed,
    }),
  };

  return {
    originalBody: args.body,
    repairedBody,
    receipt: {
      receiptId: randomUUID(),
      sourceEventId: args.sourceEventId,
      artifactStateId: args.artifactStateId,
      artifactCode: args.artifactCode,
      statusAtRepair: args.status,
      mode: args.mode,
      repairedAt: args.nowIso,
      repairedByUserId: args.actorUserId ?? null,
      beforeSha256: sha256Text(args.body),
      afterSha256: sha256Text(repairedBody),
      beforeBannedTermMatches,
      afterBannedTermMatches,
      diff,
    },
  };
}

export function appendSafeRepairReceipt(
  metadata: Record<string, unknown> | null,
  receipt: SourceArtifactSafeRepairReceipt,
): Record<string, unknown> {
  const base = metadata ? { ...metadata } : {};
  const existing = Array.isArray(base.safeRepairReceipts)
    ? base.safeRepairReceipts
    : [];
  return {
    ...base,
    safeRepairReceipts: [...existing.slice(-9), receipt],
    latestSafeRepairReceipt: receipt,
    bannedTermMatches: receipt.afterBannedTermMatches,
    safeRepairedAt: receipt.repairedAt,
    safeRepairedByUserId: receipt.repairedByUserId,
  };
}

function shortArtifactCode(artifactCode: string): string {
  return artifactCode.split("_")[0] ?? artifactCode;
}

function buildDiffSummary(args: {
  beforeBytes: number;
  afterBytes: number;
  removedBannedTerms: string[];
  remainingBannedTerms: string[];
  changed: boolean;
}): string {
  if (!args.changed) {
    return args.remainingBannedTerms.length > 0
      ? `No body changes available; ${args.remainingBannedTerms.length} content blocker(s) remain.`
      : "No body changes needed; content-blocker scan is clean.";
  }
  const byteDelta = args.afterBytes - args.beforeBytes;
  const byteText =
    byteDelta === 0
      ? "no byte-length change"
      : `${byteDelta > 0 ? "+" : ""}${byteDelta} bytes`;
  const removedText =
    args.removedBannedTerms.length > 0
      ? `removed ${args.removedBannedTerms.length} content blocker(s)`
      : "no content blockers removed";
  const remainingText =
    args.remainingBannedTerms.length > 0
      ? `${args.remainingBannedTerms.length} content blocker(s) remain`
      : "content-blocker scan is clean";
  return `Applied deterministic client-facing hygiene (${byteText}); ${removedText}; ${remainingText}.`;
}
