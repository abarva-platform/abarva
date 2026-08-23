import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Packer } from "docx";
import { config as loadEnv } from "dotenv";

import {
  listGeneratedArtifactsForMoveAllRefs,
  renderableDocFromGeneratedArtifact,
  saveGeneratedArtifact,
  type GeneratedArtifactRecord,
} from "@/lib/artifacts/repository";
import type {
  BoardPackRenderInput,
  BoardPackRenderResult,
} from "@/lib/artifacts/types";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  sanitizeClientFacingArtifactHtml,
  sanitizeClientFacingRenderableDeliverable,
} from "@/lib/deliverables/client-facing-artifact-sanitize";
import {
  renderDeliverableDocx,
  renderDeliverableHtml,
  renderDeliverablePptx,
} from "@/lib/deliverables/orchestrator/renderers";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import {
  scanClientReadiness,
  type ScanFinding,
} from "@/lib/deliverables/shared/client-readiness-scan";
import {
  extractOfficeText,
  type OfficeFormat,
} from "@/lib/deliverables/shared/office-text-extract";
import {
  buildPhaseWordEquivalentDocx,
  phaseWordEquivalentFileName,
} from "@/lib/deliverables/phase-word-equivalent";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  downloadArtifactBytes,
  listMoveArtifacts,
  saveMoveArtifact,
  type ArtifactFamily,
  type MoveArtifactRow,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";

const DEFAULT_ENV_PATH = "/Users/anand/Projects/nexus/.env.local";

type Action = "scan" | "refresh" | "skip";

interface CliArgs {
  moveRef: string;
  tenantKey?: string;
  outDir: string;
  apply: boolean;
  confirm: boolean;
  limit: number;
}

interface MoveScope {
  moveId: string;
  moveName: string;
  clientId: string;
  tenantKey: string;
  clientName: string | null;
}

interface ArtifactScanSummary {
  source: "move_artifacts" | "generated_artifacts";
  artifactId: string;
  title: string;
  fileName: string;
  fileFormat: string;
  artifactType?: string;
  outputFormat?: string;
  action: Action;
  refreshedArtifactId?: string;
  refreshedVersion?: number;
  blockers: number;
  reviewItems: number;
  clean: boolean;
  readable: boolean;
  detail?: string;
  findings: ScanFinding[];
}

function usage(): never {
  console.error(`usage:
  npm run moves:refresh-artifact-cleanliness -- --move <uuid-or-prefix> [--tenant <tenant-key>] --out-dir <dir>
  npm run moves:refresh-artifact-cleanliness -- --move <uuid-or-prefix> [--tenant <tenant-key>] --out-dir <dir> --apply --confirm-refresh-current-move-artifacts

Notes:
  - Dry-run is the default and performs read-only DB/Blob scans.
  - Apply writes only new current move_artifacts versions for artifacts that can be regenerated from structured source.
  - Apply writes new superseding generated_artifacts rows only when current structured renderableDoc content can be sanitized and re-rendered cleanly.
  - The script never edits Blob bytes in place and never mutates source/canonical tenant data.`);
  process.exit(3);
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    moveRef: "",
    outDir: "",
    apply: false,
    confirm: false,
    limit: 200,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--move") args.moveRef = argv[++i] ?? "";
    else if (arg === "--tenant") args.tenantKey = argv[++i] ?? "";
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? "";
    else if (arg === "--limit") args.limit = Number(argv[++i] ?? "200");
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--confirm-refresh-current-move-artifacts")
      args.confirm = true;
    else usage();
  }

  if (!args.moveRef || !args.outDir) usage();
  if (args.apply && !args.confirm) {
    throw new Error(
      "--apply requires --confirm-refresh-current-move-artifacts",
    );
  }
  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 500) {
    throw new Error("--limit must be an integer from 1 to 500");
  }
  return args;
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function officeFormat(value: string): OfficeFormat | null {
  const lower = value.toLowerCase();
  return lower === "docx" || lower === "pptx" ? lower : null;
}

async function textFromArtifactBytes(
  bytes: Buffer,
  format: string,
): Promise<{ ok: true; text: string } | { ok: false; detail: string }> {
  const office = officeFormat(format);
  if (office) {
    const extracted = await extractOfficeText(bytes, office);
    return extracted.ok
      ? { ok: true, text: extracted.text }
      : { ok: false, detail: `${extracted.reason}: ${extracted.detail}` };
  }
  const lower = format.toLowerCase();
  if (lower === "html" || lower === "htm") {
    return { ok: true, text: stripHtml(bytes.toString("utf8")) };
  }
  if (lower === "md" || lower === "txt" || lower === "text") {
    return { ok: true, text: bytes.toString("utf8") };
  }
  return { ok: false, detail: `unsupported format ${format}` };
}

function ctxFromScope(scope: MoveScope): TenancyCtx {
  return {
    clientId: scope.clientId,
    clientKey: scope.tenantKey,
    userId: "moves-artifact-cleanliness-refresh",
    email: "moves-artifact-cleanliness-refresh@abarva.ai",
    role: "maestro",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeDeliverableKey(value: string, phase: number): DeliverableKey {
  const raw = value.toLowerCase();
  if (raw.includes("charter")) return "charter";
  if (raw.includes("root_cause") || raw.includes("root cause"))
    return "root_cause_worksheet";
  if (raw.includes("discover") || raw.includes("diagnos"))
    return "discovery_report";
  if (raw.includes("approach") || raw.includes("option"))
    return "solution_approach_options";
  if (raw.includes("architecture") || raw.includes("target_state"))
    return "target_state_architecture";
  if (raw.includes("business_case") || raw.includes("business case"))
    return "business_case";
  if (raw.includes("roadmap")) return "execution_roadmap";
  if (raw.includes("handoff")) return "handoff_package";
  if (phase === 1) return "charter";
  if (phase === 2) return "discovery_report";
  if (phase === 4) return "execution_roadmap";
  if (phase === 5) return "handoff_package";
  return "solution_design";
}

function summarizeFindingResult(text: string): Pick<
  ArtifactScanSummary,
  "blockers" | "reviewItems" | "clean" | "findings"
> {
  const result = scanClientReadiness(text);
  return {
    blockers: result.blockers,
    reviewItems: result.reviewItems,
    clean: result.clean,
    findings: result.findings,
  };
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

async function resolveMoveScope(args: CliArgs): Promise<MoveScope> {
  const rows = await azureRead.query<MoveScope>(
    `select
       e.id::text as "moveId",
       e.name as "moveName",
       e.client_id::text as "clientId",
       coalesce(c.tenant_key, c.slug, e.client_id::text) as "tenantKey",
       c.name as "clientName"
     from public.engagements e
     left join public.clients c on c.id = e.client_id
     where e.id::text like $1
       and ($2::text is null or c.tenant_key = $2 or c.slug = $2)
     order by e.created_at desc
     limit 5`,
    [`${args.moveRef}%`, args.tenantKey ?? null],
  );
  if (rows.length === 0) {
    throw new Error(`No Move found for --move ${args.moveRef}`);
  }
  if (rows.length > 1) {
    throw new Error(
      `Move prefix ${args.moveRef} is ambiguous: ${rows
        .map((row) => `${row.moveId} (${row.tenantKey})`)
        .join(", ")}`,
    );
  }
  return rows[0]!;
}

async function scanMoveArtifact(
  ctx: TenancyCtx,
  artifact: MoveArtifactRow,
): Promise<ArtifactScanSummary> {
  const downloaded = await downloadArtifactBytes(ctx, artifact.artifact_id);
  if (!downloaded) {
    return {
      source: "move_artifacts",
      artifactId: artifact.artifact_id,
      title: artifact.title,
      fileName: artifact.file_name,
      fileFormat: artifact.file_format,
      artifactType: artifact.artifact_type,
      action: "scan",
      blockers: 0,
      reviewItems: 0,
      clean: false,
      readable: false,
      detail: "download_failed",
      findings: [],
    };
  }
  const text = await textFromArtifactBytes(downloaded.bytes, downloaded.fileFormat);
  if (!text.ok) {
    return {
      source: "move_artifacts",
      artifactId: artifact.artifact_id,
      title: artifact.title,
      fileName: downloaded.fileName,
      fileFormat: downloaded.fileFormat,
      artifactType: artifact.artifact_type,
      action: "scan",
      blockers: 0,
      reviewItems: 0,
      clean: false,
      readable: false,
      detail: text.detail,
      findings: [],
    };
  }
  return {
    source: "move_artifacts",
    artifactId: artifact.artifact_id,
    title: artifact.title,
    fileName: downloaded.fileName,
    fileFormat: downloaded.fileFormat,
    artifactType: artifact.artifact_type,
    action: "scan",
    readable: true,
    ...summarizeFindingResult(text.text),
  };
}

async function rebuildEditableDocx(
  ctx: TenancyCtx,
  scope: MoveScope,
  artifact: MoveArtifactRow,
): Promise<Buffer | null> {
  const metadata = asRecord(artifact.metadata);
  if (str(metadata.outputRole) !== "docx_editable_phase_record") return null;
  const companionId = str(metadata.pairedVisualCompanionArtifactId);
  if (!companionId) return null;
  const companion = await downloadArtifactBytes(ctx, companionId);
  if (!companion) return null;
  const companionText = await textFromArtifactBytes(
    companion.bytes,
    companion.fileFormat,
  );
  if (!companionText.ok) return null;
  const phase = artifact.phase ?? 0;
  const rawKey =
    str(metadata.visualCompanionArtifactType) ??
    str(metadata.deliverableTypeKey) ??
    artifact.artifact_type;

  return buildPhaseWordEquivalentDocx({
    artifact: normalizeDeliverableKey(rawKey, phase),
    phase,
    moveName: scope.moveName,
    title: artifact.title.replace(/\s+— Editable Deliverable$/i, ""),
    html: companionText.text,
    generationMode: str(metadata.generationMode) ?? "draft",
    reviewStatus: str(metadata.reviewStatus) ?? artifact.status,
    qualityStatus: str(metadata.qualityStatus) ?? undefined,
    goldenBarStatus: str(metadata.goldenBarStatus) ?? undefined,
    feedbackSummary: Array.isArray(metadata.feedbackSummary)
      ? metadata.feedbackSummary.map(String)
      : undefined,
  });
}

async function maybeRefreshMoveArtifact(
  ctx: TenancyCtx,
  scope: MoveScope,
  artifact: MoveArtifactRow,
  scan: ArtifactScanSummary,
  apply: boolean,
): Promise<ArtifactScanSummary> {
  if (scan.blockers === 0) return scan;
  const rebuilt = await rebuildEditableDocx(ctx, scope, artifact);
  if (!rebuilt) {
    return {
      ...scan,
      action: "skip",
      detail:
        "no structured regeneration path for this current move_artifacts row",
    };
  }
  const rebuiltText = await extractOfficeText(rebuilt, "docx");
  if (!rebuiltText.ok) {
    return {
      ...scan,
      action: "skip",
      detail: `rebuilt docx unreadable: ${rebuiltText.reason}`,
    };
  }
  const rebuiltScan = scanClientReadiness(rebuiltText.text);
  if (rebuiltScan.blockers > 0) {
    return {
      ...scan,
      action: "skip",
      detail: `rebuilt docx still has ${rebuiltScan.blockers} blocker(s)`,
      findings: rebuiltScan.findings,
      blockers: rebuiltScan.blockers,
      reviewItems: rebuiltScan.reviewItems,
      clean: rebuiltScan.clean,
      readable: true,
    };
  }
  if (!apply) {
    return {
      ...scan,
      action: "refresh",
      detail: "dry-run: regenerated bytes scan clean; apply not requested",
      blockers: 0,
      reviewItems: rebuiltScan.reviewItems,
      clean: rebuiltScan.clean,
      findings: rebuiltScan.findings,
      readable: true,
    };
  }

  const metadata = asRecord(artifact.metadata);
  const saved = await saveMoveArtifact(ctx, {
    moveId: scope.moveId,
    phase: artifact.phase ?? 0,
    artifactType: artifact.artifact_type,
    artifactFamily: artifact.artifact_family as ArtifactFamily,
    title: artifact.title,
    description: "Refreshed from existing structured source after client-readiness renderer fixes.",
    fileName: phaseWordEquivalentFileName({
      title: artifact.title,
      artifact: artifact.artifact_type,
      version: artifact.version + 1,
    }),
    fileFormat: "docx",
    body: rebuilt,
    status: artifact.status,
    generatedBy: ctx.email ?? ctx.userId ?? "moves-artifact-cleanliness-refresh",
    qualityScore: artifact.quality_score,
    unsupportedClaimsCount: artifact.unsupported_claims_count,
    sourceBasis: "existing_artifact_structured_refresh",
    confidence: "high",
    citationReady: true,
    metadata: {
      ...metadata,
      refreshedFromArtifactId: artifact.artifact_id,
      refreshReason: "client_readiness_renderer_cleanup",
      refreshScannerBlockersBefore: scan.blockers,
      refreshScannerReviewItemsBefore: scan.reviewItems,
      refreshScannerBlockersAfter: rebuiltScan.blockers,
      refreshScannerReviewItemsAfter: rebuiltScan.reviewItems,
      refreshedAt: new Date().toISOString(),
    },
  });

  return {
    ...scan,
    action: "refresh",
    refreshedArtifactId: saved.artifactId,
    refreshedVersion: saved.version,
    detail: "applied: saved new current move_artifacts version",
    blockers: 0,
    reviewItems: rebuiltScan.reviewItems,
    clean: rebuiltScan.clean,
    findings: rebuiltScan.findings,
    readable: true,
  };
}

async function renderGeneratedArtifact(
  artifact: GeneratedArtifactRecord,
  format: OfficeFormat,
): Promise<Buffer | null> {
  const doc = renderableDocFromGeneratedArtifact(artifact);
  if (!doc) return null;
  if (format === "docx") {
    return Buffer.from(
      await Packer.toBuffer(renderDeliverableDocx(doc as unknown as RenderableDeliverable)),
    );
  }
  return Buffer.from(
    await renderDeliverablePptx(doc as unknown as RenderableDeliverable),
  );
}

interface GeneratedRenderBundle {
  doc: RenderableDeliverable;
  html: string;
  docx: Buffer;
  pptx: Buffer;
}

async function renderGeneratedArtifactBundle(
  artifact: GeneratedArtifactRecord,
  sanitize: boolean,
): Promise<GeneratedRenderBundle | null> {
  const rawDoc = renderableDocFromGeneratedArtifact(artifact);
  if (!rawDoc) return null;
  const doc = sanitize
    ? sanitizeClientFacingRenderableDeliverable(
        rawDoc as unknown as RenderableDeliverable,
      )
    : (rawDoc as unknown as RenderableDeliverable);
  const html = sanitizeClientFacingArtifactHtml(renderDeliverableHtml(doc));
  return {
    doc,
    html,
    docx: Buffer.from(await Packer.toBuffer(renderDeliverableDocx(doc))),
    pptx: Buffer.from(await renderDeliverablePptx(doc)),
  };
}

async function scanGeneratedArtifactBytes(
  artifact: GeneratedArtifactRecord,
  format: OfficeFormat,
  bytes: Buffer | null,
): Promise<ArtifactScanSummary> {
  if (!bytes) {
    return {
      source: "generated_artifacts",
      artifactId: artifact.id,
      title: str(artifact.metadata.title) ?? artifact.artifactType,
      fileName: `${artifact.id}.${format}`,
      fileFormat: format,
      outputFormat: artifact.outputFormat,
      action: "skip",
      blockers: 0,
      reviewItems: 0,
      clean: false,
      readable: false,
      detail: "no persisted renderableDoc; download route will fall back to stored HTML",
      findings: [],
    };
  }
  const extracted = await extractOfficeText(bytes, format);
  if (!extracted.ok) {
    return {
      source: "generated_artifacts",
      artifactId: artifact.id,
      title: str(artifact.metadata.title) ?? artifact.artifactType,
      fileName: `${artifact.id}.${format}`,
      fileFormat: format,
      outputFormat: artifact.outputFormat,
      action: "scan",
      blockers: 0,
      reviewItems: 0,
      clean: false,
      readable: false,
      detail: `${extracted.reason}: ${extracted.detail}`,
      findings: [],
    };
  }
  return {
    source: "generated_artifacts",
    artifactId: artifact.id,
    title: str(artifact.metadata.title) ?? artifact.artifactType,
    fileName: `${artifact.id}.${format}`,
    fileFormat: format,
    outputFormat: artifact.outputFormat,
    action: "scan",
    readable: true,
    ...summarizeFindingResult(extracted.text),
  };
}

async function scanGeneratedArtifact(
  artifact: GeneratedArtifactRecord,
  format: OfficeFormat,
): Promise<ArtifactScanSummary> {
  const bytes = await renderGeneratedArtifact(artifact, format);
  return scanGeneratedArtifactBytes(artifact, format, bytes);
}

async function saveSanitizedGeneratedArtifact(
  ctx: TenancyCtx,
  artifact: GeneratedArtifactRecord,
  bundle: GeneratedRenderBundle,
  before: { blockers: number; reviewItems: number },
  after: { blockers: number; reviewItems: number },
): Promise<GeneratedArtifactRecord> {
  const sections: BoardPackRenderInput["sections"] =
    bundle.doc.generatedSections.map((section) => ({
      id: section.key,
      title: section.title,
      claims: [section.bodyMarkdown.slice(0, 500)],
    }));
  const facts: BoardPackRenderInput["facts"] = bundle.doc.sourceRegister.map(
    (entry) => ({
      id: `cite-${entry.citationNumber}`,
      label: entry.label,
      value: `${entry.evidenceFamily} (${entry.confidence}${entry.asOf ? `, ${entry.asOf}` : ""})`,
      evidenceLedgerId: String(entry.citationNumber),
    }),
  );
  const input: BoardPackRenderInput = {
    clientId: artifact.clientId,
    sourceArtifactRef: artifact.sourceArtifactRef,
    artifactType: artifact.artifactType,
    outputFormat: artifact.outputFormat,
    renderEngine: "internal",
    renderedBy: ctx.email ?? ctx.userId ?? "moves-artifact-cleanliness-refresh",
    title: bundle.doc.title,
    sections,
    facts,
    tenantPolicy: {} as BoardPackRenderInput["tenantPolicy"],
  };
  const rendered: BoardPackRenderResult = {
    artifactType: artifact.artifactType,
    sourceArtifactRef: artifact.sourceArtifactRef,
    renderEngine: "internal",
    outputFormat: artifact.outputFormat,
    html: bundle.html,
    blobUrl: "",
    blobSha256: createHash("sha256").update(bundle.html).digest("hex"),
    qualityScore: artifact.qualityScore ?? 0,
    evidenceLedgerIds: artifact.evidenceLedgerIds,
    generationEgressAudit: artifact.generationEgressAudit,
    quarantined: artifact.quarantineReason !== null,
    quarantineReason: artifact.quarantineReason,
  };
  const metadata = asRecord(artifact.metadata);
  const deliverableTypeKey =
    str(metadata.deliverableTypeKey) ??
    str(metadata.registryKey) ??
    str(metadata.artifactId) ??
    artifact.artifactType;
  return saveGeneratedArtifact(input, rendered, {
    ...metadata,
    title: str(metadata.title) ?? bundle.doc.title,
    deliverableTypeKey,
    renderableDoc: {
      ...bundle.doc,
      deliverableTypeKey,
      ...(str(metadata.deliverableType)
        ? { deliverableType: str(metadata.deliverableType) }
        : {}),
    },
    renderedHtml: bundle.html,
    originalBlobUrl: artifact.blobUrl,
    refreshedFromGeneratedArtifactId: artifact.id,
    refreshReason: "client_readiness_structured_doc_cleanup",
    refreshScannerBlockersBefore: before.blockers,
    refreshScannerReviewItemsBefore: before.reviewItems,
    refreshScannerBlockersAfter: after.blockers,
    refreshScannerReviewItemsAfter: after.reviewItems,
    refreshedAt: new Date().toISOString(),
  });
}

async function maybeRefreshGeneratedArtifact(
  ctx: TenancyCtx,
  artifact: GeneratedArtifactRecord,
  scans: ArtifactScanSummary[],
  apply: boolean,
): Promise<ArtifactScanSummary[]> {
  const before = {
    blockers: scans.reduce((sum, item) => sum + item.blockers, 0),
    reviewItems: scans.reduce((sum, item) => sum + item.reviewItems, 0),
  };
  if (before.blockers === 0 && before.reviewItems === 0) return scans;
  const bundle = await renderGeneratedArtifactBundle(artifact, true);
  if (!bundle) {
    return scans.map((scan) => ({
      ...scan,
      action: "skip",
      detail: "no persisted renderableDoc to sanitize and re-render",
    }));
  }
  const nextScans = await Promise.all([
    scanGeneratedArtifactBytes(artifact, "docx", bundle.docx),
    scanGeneratedArtifactBytes(artifact, "pptx", bundle.pptx),
  ]);
  const after = {
    blockers: nextScans.reduce((sum, item) => sum + item.blockers, 0),
    reviewItems: nextScans.reduce((sum, item) => sum + item.reviewItems, 0),
  };
  if (after.blockers > 0 || after.reviewItems > 0) {
    return nextScans.map((scan) => ({
      ...scan,
      action: "skip",
      detail: `sanitized generated_artifacts render still has ${after.blockers} blocker(s) and ${after.reviewItems} review item(s)`,
    }));
  }
  if (!apply) {
    return nextScans.map((scan) => ({
      ...scan,
      action: "refresh",
      detail:
        "dry-run: sanitized generated_artifacts row scans clean; apply not requested",
    }));
  }
  const saved = await saveSanitizedGeneratedArtifact(
    ctx,
    artifact,
    bundle,
    before,
    after,
  );
  return nextScans.map((scan) => ({
    ...scan,
    action: "refresh",
    refreshedArtifactId: saved.id,
    detail: "applied: saved new superseding generated_artifacts row",
  }));
}

async function main(): Promise<number> {
  loadEnv({ path: DEFAULT_ENV_PATH, override: false, quiet: true });
  const args = parseArgs(process.argv.slice(2));
  const outDir = resolve(args.outDir);
  await mkdir(outDir, { recursive: true });

  const scope = await resolveMoveScope(args);
  const ctx = ctxFromScope(scope);

  const moveArtifacts = await listMoveArtifacts(ctx, scope.moveId, {
    currentOnly: true,
  });
  const moveResults: ArtifactScanSummary[] = [];
  for (const artifact of moveArtifacts) {
    const scanned = await scanMoveArtifact(ctx, artifact);
    const refreshed = await maybeRefreshMoveArtifact(
      ctx,
      scope,
      artifact,
      scanned,
      args.apply,
    );
    moveResults.push(refreshed);
  }

  const generatedArtifacts = (
    await listGeneratedArtifactsForMoveAllRefs({
      clientId: scope.clientId,
      clientIds: [scope.tenantKey],
      moveId: scope.moveId,
      limit: args.limit,
    })
  ).filter((artifact) => !artifact.supersededBy);
  const generatedResults: ArtifactScanSummary[] = [];
  for (const artifact of generatedArtifacts) {
    const scans = await Promise.all([
      scanGeneratedArtifact(artifact, "docx"),
      scanGeneratedArtifact(artifact, "pptx"),
    ]);
    generatedResults.push(
      ...(await maybeRefreshGeneratedArtifact(ctx, artifact, scans, args.apply)),
    );
  }

  const results = [...moveResults, ...generatedResults];
  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? "apply" : "dry-run",
    scope,
    summary: {
      scanned: results.length,
      readable: results.filter((item) => item.readable).length,
      clean: results.filter((item) => item.clean).length,
      blockers: results.reduce((sum, item) => sum + item.blockers, 0),
      reviewItems: results.reduce((sum, item) => sum + item.reviewItems, 0),
      refreshable: uniqueCount(
        results
          .filter(
            (item) =>
              item.action === "refresh" &&
              item.detail?.includes("apply not requested"),
          )
          .map((item) => `${item.source}:${item.artifactId}`),
      ),
      refreshed: uniqueCount(
        results
          .map((item) => item.refreshedArtifactId)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
      notRefreshable: results.filter(
        (item) =>
          item.action === "skip" &&
          (item.blockers > 0 || item.reviewItems > 0),
      ).length,
    },
    results,
  };

  const jsonPath = join(outDir, "moves-artifact-cleanliness-report.json");
  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`report: ${jsonPath}`);
  return report.summary.blockers > 0 ||
    report.summary.reviewItems > 0 ||
    report.summary.notRefreshable > 0
    ? 1
    : 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 3;
  },
);
