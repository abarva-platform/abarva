/**
 * Plan or apply Moves learning writeback into the enterprise context layer.
 *
 * Default mode is a dry run. It reads one tenant-scoped Move and projects only
 * approved evidence, signed-off/client-approved deliverables, and approved gate
 * decisions into reviewable enterprise-context candidates. Use `--apply` only
 * from the approved operator/deploy lane after the dry-run report is reviewed.
 *
 * Usage:
 *   npm run moves:enterprise-context:writeback -- --client-key arcturus --move-id <uuid>
 *   npm run moves:enterprise-context:writeback -- --client-key arcturus --move-id <uuid> --apply
 */

import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import {
  buildMovesLearningWritebackPlan,
  writeMovesLearningToEnterpriseContext,
  type MovesLearningDeliverableInput,
  type MovesLearningEvidenceInput,
  type MovesLearningGateDecisionInput,
  type MovesLearningMove,
} from "@/lib/programs/learning-writeback";

config({ path: ".env.local" });
config({ path: ".env" });

interface CliOptions {
  readonly clientKey: string;
  readonly moveId: string;
  readonly apply: boolean;
  readonly outDir: string;
}

interface ClientRow {
  readonly id: string;
  readonly tenant_key?: string | null;
  readonly client_key?: string | null;
  readonly slug?: string | null;
  readonly name?: string | null;
}

interface Report {
  readonly generatedAt: string;
  readonly mode: "dry_run" | "apply";
  readonly clientKey: string;
  readonly moveId: string;
  readonly moveName: string;
  readonly inputCounts: {
    readonly approvedEvidence: number;
    readonly signedOffDeliverables: number;
    readonly gateDecisions: number;
  };
  readonly eligibleRecords: number;
  readonly eligibleFacts: number;
  readonly readinessRows: number;
  readonly skipped: ReturnType<typeof buildMovesLearningWritebackPlan>["skipped"];
  readonly writeResult?: Awaited<ReturnType<typeof writeMovesLearningToEnterpriseContext>>;
}

function valueAfter(args: readonly string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const clientKey =
    valueAfter(args, "--client-key") ??
    valueAfter(args, "--client") ??
    process.env.MOVES_WRITEBACK_CLIENT_KEY;
  const moveId =
    valueAfter(args, "--move-id") ??
    valueAfter(args, "--move") ??
    process.env.MOVES_WRITEBACK_MOVE_ID;
  if (!clientKey || !moveId || args.includes("--help")) {
    throw new Error(
      [
        "Usage:",
        "  npm run moves:enterprise-context:writeback -- --client-key <tenant> --move-id <uuid> [--apply] [--out-dir <dir>]",
        "",
        "Default is dry-run. Use --apply only after reviewing the report.",
      ].join("\n"),
    );
  }
  return {
    clientKey: canonicalTenantKey(clientKey),
    moveId,
    apply:
      args.includes("--apply") ||
      process.env.MOVES_WRITEBACK_APPLY?.toLowerCase() === "true",
    outDir:
      valueAfter(args, "--out-dir") ??
      process.env.MOVES_WRITEBACK_OUT_DIR ??
      "reports/moves-enterprise-context-writeback/latest",
  };
}

async function resolveClient(clientKey: string): Promise<ClientRow> {
  const db = getAzureReadFluentClient();
  const aliases = tenantAliasesFor(clientKey);
  for (const column of ["tenant_key", "client_key", "slug"] as const) {
    for (const alias of aliases) {
      const { data, error } = await db
        .from("clients")
        .select("id,tenant_key,client_key,slug,name")
        .eq(column, alias)
        .maybeSingle<ClientRow>();
      if (error) continue;
      if (data?.id) return data;
    }
  }
  throw new Error(`No client row found for ${clientKey} (${aliases.join(", ")})`);
}

async function readMove(opts: {
  client: ClientRow;
  clientKey: string;
  moveId: string;
}): Promise<MovesLearningMove> {
  const { data, error } = await getAzureReadFluentClient()
    .from("engagements")
    .select("id,client_id,name,current_phase,function_pack_key,program_archetype")
    .eq("id", opts.moveId)
    .eq("client_id", opts.client.id)
    .maybeSingle<{
      id: string;
      client_id: string;
      name: string | null;
      current_phase: number | null;
      function_pack_key: string | null;
      program_archetype: string | null;
    }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No Move found for ${opts.clientKey}:${opts.moveId}`);
  return {
    id: data.id,
    tenantKey: opts.clientKey,
    clientId: data.client_id,
    name: data.name ?? `Strategic Move ${data.id.slice(0, 8)}`,
    currentPhase: data.current_phase,
    functionPackKey: data.function_pack_key,
    archetype: data.program_archetype,
  };
}

async function readApprovedEvidence(opts: {
  clientKey: string;
  clientId: string | null;
  moveId: string;
}): Promise<MovesLearningEvidenceInput[]> {
  const db = getAzureReadFluentClient();
  const { data: reviews, error: reviewError } = await db
    .from("program_evidence_reviews")
    .select("evidence_id,decision,reviewed_at,updated_at,created_at")
    .in("tenant_key", tenantAliasesFor(opts.clientKey))
    .eq("program_id", opts.moveId)
    .eq("decision", "approved")
    .order("updated_at", { ascending: false })
    .limit(250);
  if (reviewError) throw new Error(reviewError.message);
  const reviewRows = (reviews ?? []) as Array<Record<string, unknown>>;
  const evidenceIds = reviewRows
    .map((row) => (typeof row.evidence_id === "string" ? row.evidence_id : null))
    .filter((id): id is string => Boolean(id));
  if (evidenceIds.length === 0) return [];

  const { data: evidence, error: evidenceError } = await db
    .from("program_evidence_items")
    .select(
      "id,tenant_key,program_id,attachment_id,phase,evidence_type,title,summary,extracted_text,extracted_structured,confidence",
    )
    .in("id", evidenceIds);
  if (evidenceError) throw new Error(evidenceError.message);
  const reviewById = new Map(reviewRows.map((row) => [row.evidence_id, row]));
  return ((evidence ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const review = reviewById.get(id);
    return {
      id,
      tenantKey: String(row.tenant_key ?? opts.clientKey),
      clientId: opts.clientId,
      moveId: String(row.program_id ?? opts.moveId),
      phase: typeof row.phase === "number" ? row.phase : null,
      evidenceType: String(row.evidence_type ?? "program_evidence"),
      title: String(row.title ?? "Untitled Move evidence"),
      summary: typeof row.summary === "string" ? row.summary : null,
      extractedText:
        typeof row.extracted_text === "string" ? row.extracted_text : null,
      attachmentId:
        typeof row.attachment_id === "string" ? row.attachment_id : null,
      confidence: row.confidence as number | string | null,
      reviewDecision:
        typeof review?.decision === "string" ? review.decision : null,
      reviewedAt:
        typeof review?.reviewed_at === "string"
          ? review.reviewed_at
          : typeof review?.updated_at === "string"
            ? review.updated_at
            : typeof review?.created_at === "string"
              ? review.created_at
              : null,
    };
  });
}

function phaseForDeliverableType(deliverableTypeKey: string): number | null {
  return (
    DELIVERABLE_REGISTRY.find(
      (spec) => spec.deliverableTypeKey === deliverableTypeKey,
    )?.phase ?? null
  );
}

async function readSignedOffDeliverables(opts: {
  clientKey: string;
  clientId: string | null;
  moveId: string;
}): Promise<MovesLearningDeliverableInput[]> {
  const db = getAzureReadFluentClient();
  const { data, error } = await db
    .from("deliverables_v2")
    .select(
      "id,engagement_id,deliverable_type_key,title,status,current_version,signed_off_version,signed_off_at,signed_off_by,approved_artifact_id",
    )
    .eq("engagement_id", opts.moveId)
    .eq("status", "signed_off")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const ids = rows.map((row) => String(row.id));
  const versions =
    ids.length === 0
      ? []
      : ((await db
          .from("deliverable_versions")
          .select("deliverable_id,version,content")
          .in("deliverable_id", ids)).data ?? []);
  const contentByKey = new Map(
    (versions as Array<Record<string, unknown>>).map((row) => [
      `${row.deliverable_id}:${row.version}`,
      typeof row.content === "string" ? row.content : null,
    ]),
  );

  return rows.map((row) => {
    const deliverableTypeKey = String(row.deliverable_type_key ?? "unknown");
    const signedOffVersion =
      typeof row.signed_off_version === "number"
        ? row.signed_off_version
        : typeof row.current_version === "number"
          ? row.current_version
          : null;
    return {
      id: String(row.id),
      tenantKey: opts.clientKey,
      clientId: opts.clientId,
      moveId: String(row.engagement_id ?? opts.moveId),
      phase: phaseForDeliverableType(deliverableTypeKey),
      deliverableTypeKey,
      title: String(row.title ?? deliverableTypeKey),
      status: typeof row.status === "string" ? row.status : null,
      signedOffVersion,
      signedOffAt:
        typeof row.signed_off_at === "string" ? row.signed_off_at : null,
      signedOffBy:
        typeof row.signed_off_by === "string" ? row.signed_off_by : null,
      approvedArtifactId:
        typeof row.approved_artifact_id === "string"
          ? row.approved_artifact_id
          : null,
      latestContent: signedOffVersion
        ? contentByKey.get(`${row.id}:${signedOffVersion}`) ?? null
        : null,
    };
  });
}

async function readGateDecisions(opts: {
  clientKey: string;
  clientId: string | null;
  moveId: string;
}): Promise<MovesLearningGateDecisionInput[]> {
  const { data, error } = await getAzureReadFluentClient()
    .from("move_artifacts")
    .select(
      "artifact_id,move_id,tenant_key,phase,artifact_type,title,status,source_basis,generated_at,metadata",
    )
    .in("tenant_key", tenantAliasesFor(opts.clientKey))
    .eq("move_id", opts.moveId)
    .eq("artifact_type", "phase_gate_decision")
    .eq("status", "approved")
    .order("generated_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.artifact_id),
    tenantKey: String(row.tenant_key ?? opts.clientKey),
    clientId: opts.clientId,
    moveId: String(row.move_id ?? opts.moveId),
    phase: typeof row.phase === "number" ? row.phase : null,
    title: String(row.title ?? "Phase Gate Decision"),
    status: typeof row.status === "string" ? row.status : null,
    sourceBasis:
      typeof row.source_basis === "string" ? row.source_basis : null,
    generatedAt:
      typeof row.generated_at === "string" ? row.generated_at : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
  }));
}

async function writeReport(outDir: string, report: Report): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "result.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

function emitProofBundle(outDir: string): void {
  if (process.env.MOVES_WRITEBACK_EMIT_PROOF_BUNDLE?.toLowerCase() !== "true") {
    return;
  }
  const tar = spawnSync("tar", ["-czf", "-", "-C", outDir, "."], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(
      `failed to create writeback proof bundle: ${
        tar.stderr?.toString("utf8") || tar.stdout?.toString("utf8")
      }`,
    );
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const opts = parseArgs();
  const generatedAt = new Date().toISOString();
  const client = await resolveClient(opts.clientKey);
  const move = await readMove({
    client,
    clientKey: opts.clientKey,
    moveId: opts.moveId,
  });
  const [evidence, deliverables, gateDecisions] = await Promise.all([
    readApprovedEvidence({
      clientKey: opts.clientKey,
      clientId: move.clientId,
      moveId: move.id,
    }),
    readSignedOffDeliverables({
      clientKey: opts.clientKey,
      clientId: move.clientId,
      moveId: move.id,
    }),
    readGateDecisions({
      clientKey: opts.clientKey,
      clientId: move.clientId,
      moveId: move.id,
    }),
  ]);
  const plan = buildMovesLearningWritebackPlan({
    move,
    evidence,
    deliverables,
    gateDecisions,
    committedAt: generatedAt,
  });
  const writeResult = opts.apply
    ? await writeMovesLearningToEnterpriseContext({
        move,
        evidence,
        deliverables,
        gateDecisions,
        committedAt: generatedAt,
      })
    : undefined;
  const report: Report = {
    generatedAt,
    mode: opts.apply ? "apply" : "dry_run",
    clientKey: opts.clientKey,
    moveId: move.id,
    moveName: move.name,
    inputCounts: {
      approvedEvidence: evidence.length,
      signedOffDeliverables: deliverables.length,
      gateDecisions: gateDecisions.length,
    },
    eligibleRecords: plan.records.length,
    eligibleFacts: plan.factDrafts.length,
    readinessRows: plan.readinessDrafts.length,
    skipped: plan.skipped,
    writeResult,
  };
  const reportPath = await writeReport(opts.outDir, report);
  emitProofBundle(opts.outDir);
  console.log(
    [
      `Moves enterprise-context writeback ${report.mode}`,
      `move=${move.name} (${move.id})`,
      `approvedEvidence=${report.inputCounts.approvedEvidence}`,
      `signedOffDeliverables=${report.inputCounts.signedOffDeliverables}`,
      `gateDecisions=${report.inputCounts.gateDecisions}`,
      `eligible=${report.eligibleRecords}`,
      writeResult ? `writeStatus=${writeResult.status}` : "writeStatus=not_applied",
      `report=${reportPath}`,
    ].join(" · "),
  );
  if (writeResult?.status === "failed") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
