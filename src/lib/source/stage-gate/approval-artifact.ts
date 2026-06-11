// Approval artifact — render a Maestro ApprovalRecord to HTML and persist it durably
// through the EXISTING source artifact registry (source_artifacts table + the
// `source-artifacts` blob bucket), so it appears in the EVENT DOCUMENTS shelf alongside
// every other event artifact.
//
// Seam-sweep fix (2026-06-11): the first version persisted via the new File-Cabinet
// repository, whose schema collides with the pre-existing `source_artifacts` table —
// the insert would fail in production. This version uses the real registry. (Lesson:
// click the write seam, not just the read; sweep the class, not the instance.)

import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import {
  buildSourceArtifactBlobPath,
  registerSourceArtifactUpload,
} from "@/lib/source/artifact-registry";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry";
import type { SourceStageKey } from "@/lib/source/types";
import type { ApprovalRecord } from "./types";

const STORAGE_BUCKET = "source-artifacts";

/**
 * The stage-gate playbook uses sourcing-process stage keys (origination,
 * evidence_baseline, …); the artifact registry's DB CHECK accepts only its own
 * stage vocabulary. Map explicitly — passing a playbook key through raised
 * "stageKey not supported" → HTTP 500 (found by the pre-flight UI click pass).
 */
const PLAYBOOK_TO_REGISTRY_STAGE: Record<string, SourceStageKey> = {
  origination: "intake" as SourceStageKey,
  evidence_baseline: "scope" as SourceStageKey,
  sourcing_strategy: "sourcing_strategy" as SourceStageKey,
  rfp_design: "rfp_rfi_package" as SourceStageKey,
  vendor_briefing: "rfp_rfi_package" as SourceStageKey,
  proposal_intake: "vendor_responses" as SourceStageKey,
  evaluation: "evaluation" as SourceStageKey,
  commercial_analysis: "evaluation" as SourceStageKey,
  negotiation: "orals_bafo" as SourceStageKey,
  award_recommendation: "selection" as SourceStageKey,
  contracting_handoff: "contract_mobilization" as SourceStageKey,
  post_award_controls: "value_realization" as SourceStageKey,
};

function registryStageFor(playbookStageKey: string): SourceStageKey {
  return (
    PLAYBOOK_TO_REGISTRY_STAGE[playbookStageKey] ?? ("intake" as SourceStageKey)
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderApprovalRecordHtml(rec: ApprovalRecord): string {
  const list = (items: string[]) =>
    items.length
      ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
      : '<p style="color:#9a9a9a">(none)</p>';
  const follow = rec.followUpItems.length
    ? `<ul>${rec.followUpItems.map((f) => `<li>${esc(f.item)} — <b>${esc(f.owner)}</b></li>`).join("")}</ul>`
    : '<p style="color:#9a9a9a">(none)</p>';
  const snap = rec.readinessSnapshot;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Gate Approval — ${esc(rec.stageName)}</title><style>
  body{background:#F8F7F4;color:#1a1a1a;font-family:'DM Sans',Inter,sans-serif;line-height:1.55}
  .wrap{max-width:820px;margin:0 auto;padding:36px 26px 70px}
  h1,h2{font-family:Georgia,serif;font-weight:400;color:#0C1A3A}h1{font-size:26px}h2{font-size:18px;border-bottom:1px solid #e4e1da;padding-bottom:5px;margin-top:26px}
  .meta{background:#fff;border:1px solid #e4e1da;border-radius:8px;padding:12px 16px;font-size:13px}
  .meta div{margin:3px 0}.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#0C1A3A;color:#fff}
  ul{padding-left:18px;font-size:13px}</style></head><body><div class="wrap">
  <h1>Gate Approval Record</h1>
  <p style="color:#706D66">${esc(rec.archetype)} · ${esc(rec.stageName)}</p>
  <div class="meta">
    <div><b>Decision:</b> <span class="tag">${esc(rec.decision)}</span></div>
    <div><b>Approver:</b> ${esc(rec.approver)}</div>
    <div><b>Approved at:</b> ${esc(rec.approvedAt)}</div>
    <div><b>Artifact label:</b> ${esc(rec.artifactLabel)} · <b>Issue-ready allowed:</b> ${rec.allowIssueReady ? "yes" : "no"}</div>
    <div><b>Readiness at decision:</b> ${Math.round(snap.currentCompletion * 100)}% · minimum-viable ${snap.minimumViableMet ? "met" : "NOT met"} · ${snap.gapCount} gap(s) · prior status ${esc(snap.gateStatusBeforeDecision)}</div>
  </div>
  <h2>Rationale</h2><p>${rec.rationale ? esc(rec.rationale) : '<span style="color:#9a9a9a">(none provided)</span>'}</p>
  <h2>Gaps acknowledged</h2>${list(rec.gapsAcknowledged)}
  <h2>Risks accepted</h2>${list(rec.risksAccepted)}
  <h2>Downstream impacts (stay preliminary)</h2>${list(rec.downstreamImpacts)}
  <h2>Follow-up items</h2>${follow}
  </div></body></html>`;
}

export interface PersistApprovalDeps {
  /** injectable for tests. */
  upload?: (
    bucket: string,
    path: string,
    bytes: Buffer,
    opts: { contentType: string; upsert: boolean },
  ) => Promise<void>;
  register?: typeof registerSourceArtifactUpload;
}

/**
 * Persist the approval record durably: HTML bytes → `source-artifacts` blob bucket →
 * row in the existing `source_artifacts` registry (family `decision_brief`, generated).
 * It then renders in the EVENT DOCUMENTS shelf like every other artifact.
 */
export async function persistApprovalArtifact(
  rec: ApprovalRecord,
  opts: {
    tenantKey: string;
    sourceEventId: string;
    /** persisted source_events.id row when known (FK linkage). */
    sourceEventRowId?: string | null;
    generatedBy?: string;
  },
  deps: PersistApprovalDeps = {},
): Promise<SourceArtifactRegistryRecord> {
  const upload =
    deps.upload ??
    (async (
      bucket: string,
      path: string,
      bytes: Buffer,
      o: { contentType: string; upsert: boolean },
    ) => {
      await getObjectStorageAdapter().upload(bucket, path, bytes, {
        contentType: o.contentType,
        cacheControl: "private, max-age=0",
        upsert: o.upsert,
      });
    });
  const register = deps.register ?? registerSourceArtifactUpload;

  const html = renderApprovalRecordHtml(rec);
  const bytes = Buffer.from(html, "utf8");
  const artifactId = randomUUID();
  const filename = `gate_approval_${rec.stageKey}_${rec.approvedAt.replace(/[:.]/g, "-")}.html`;
  const blobUri = buildSourceArtifactBlobPath({
    tenantKey: opts.tenantKey,
    sourceEventId: opts.sourceEventId,
    artifactId,
    filename,
  });

  await upload(STORAGE_BUCKET, blobUri, bytes, {
    contentType: "text/html; charset=utf-8",
    upsert: false,
  });

  return register({
    artifactId,
    tenantKey: opts.tenantKey,
    sourceEventId: opts.sourceEventId,
    ...(opts.sourceEventRowId
      ? { sourceEventRowId: opts.sourceEventRowId }
      : {}),
    stageKey: registryStageFor(rec.stageKey),
    artifactFamily: "decision_brief",
    artifactKind: "gate_approval_record",
    sourceOrigin: "generated",
    sourceFormat: "html",
    originalName: filename,
    blobUri,
    uploaderUserId: opts.generatedBy ?? rec.approver,
    mimeType: "text/html",
    sizeBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    dataClassification: "Internal",
    createdBy: opts.generatedBy ?? rec.approver,
  });
}
