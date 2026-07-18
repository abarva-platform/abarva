// Programs write layer · Packet 13 §13.5.
// Three top-level mutations: originateProgram, advancePhase,
// publishDeliverable. Plus supporting writes (create milestone, create
// risk, module state transitions). All tenancy-asserted.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import { industryCodeForClientName } from "@/lib/client-config";
import type {
  MilestoneStatus,
  ModuleStatus,
  OriginSource,
  OversightLevel,
  ProgramCore,
  RiskImpact,
  RiskLikelihood,
  TenancyCtx,
  WorkItemStatus,
  WorkItemType,
} from "./types.db";
import type { ArchetypeKey } from "./types.ui";
import { getProgramById } from "./queries";
import { writeProgramAuditLogBestEffort } from "./audit-log";
import {
  createSupabaseProgramsWriteAdapter,
  selectProgramsWriteAdapter,
  type ProgramsWriteAdapter,
} from "@/lib/data-plane/write-adapters/programsWriteAdapter";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { DiscoveryPlan } from "@/lib/programs/discovery/discovery-intake";
import {
  applyEvidenceToCharter,
  type ExtractionReceipt,
} from "@/lib/programs/discovery/extraction-planner";
import type { ExtractedProgramEvidence } from "@/lib/programs/evidence-ingestion";
import { resolveDataPlane } from "@/lib/data-plane/read-adapters/resolveDataPlane";

/**
 * Resolve the programs write adapter, threading any route-scoped Supabase
 * client through to the Supabase impl so RLS / auth-mode behavior is exactly
 * the pre-seam helper's. The Azure path ignores the client (it has its own
 * transactional session) and is opt-in via `ABARVA_DATA_PLANE`.
 */
function programsWriteAdapter(supabase?: SupabaseClient): ProgramsWriteAdapter {
  if (resolveDataPlane() === "azure-postgres")
    return selectProgramsWriteAdapter();
  return supabase
    ? createSupabaseProgramsWriteAdapter(() => supabase)
    : selectProgramsWriteAdapter("supabase");
}

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error(
      "[programs/mutations] TenancyCtx missing clientId or userId",
    );
  }
}

async function assertProgramTenancy(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<void> {
  const program = await getProgramById(ctx, programId, {
    supabase: opts.supabase,
  });
  if (!program)
    throw new Error(`[programs/mutations] program ${programId} not accessible`);
}

export function resolveProgramIndustryCode(
  client: { name?: string | null; industry_code?: string | null } | null,
  fallback?: string | null,
): string {
  return (
    client?.industry_code?.trim() ||
    industryCodeForClientName(client?.name) ||
    fallback?.trim() ||
    "UNKNOWN"
  ).toUpperCase();
}

export interface ProgramClassificationCodes {
  functionCode: "FRONT_OFFICE" | "MIDDLE_OFFICE" | "BACK_OFFICE";
  objectiveCode: "GROW" | "OPTIMISE" | "CONTROL";
  topicCode: string;
}

function slugifyTopicCode(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return slug || "program_origination";
}

export function buildEngagementGraphNodeId(name: string): string {
  const slug = slugifyTopicCode(name).slice(0, 56);
  return `eng_${slug}_${Date.now().toString(36)}`;
}

export function resolveProgramClassificationCodes(input: {
  name: string;
  useCase: string;
  archetype?: string | null;
  acceptedPatternKey?: string | null;
}): ProgramClassificationCodes {
  const text = [
    input.name,
    input.useCase,
    input.archetype ?? "",
    input.acceptedPatternKey ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let functionCode: ProgramClassificationCodes["functionCode"] =
    "MIDDLE_OFFICE";
  if (
    /\b(finance|financial close|hr|hcm|erp|procurement|supply chain|payroll|back[- ]office|revenue cycle|rcm)\b/.test(
      text,
    )
  ) {
    functionCode = "BACK_OFFICE";
  } else if (
    /\b(customer|consumer|patient|member|sales|marketing|commerce|checkout|abandonment|store|portal|front door|front[- ]office)\b/.test(
      text,
    )
  ) {
    functionCode = "FRONT_OFFICE";
  }

  let objectiveCode: ProgramClassificationCodes["objectiveCode"] = "OPTIMISE";
  if (
    /\b(risk|control|compliance|governance|audit|security|regulatory|privacy)\b/.test(
      text,
    )
  ) {
    objectiveCode = "CONTROL";
  } else if (
    /\b(growth|grow|revenue|acquisition|retention|conversion|market share)\b/.test(
      text,
    )
  ) {
    objectiveCode = "GROW";
  }

  return {
    functionCode,
    objectiveCode,
    topicCode: slugifyTopicCode(input.acceptedPatternKey || input.name),
  };
}

async function resolveClientIndustryCode(
  clientId: string,
  fallback?: string | null,
  opts: { supabase?: SupabaseClient } = {},
): Promise<string> {
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const { data } = await sb
    .from("clients")
    .select("name, industry_code")
    .eq("id", clientId)
    .maybeSingle();
  return resolveProgramIndustryCode(
    data as { name?: string | null; industry_code?: string | null } | null,
    fallback,
  );
}

export interface OriginateProgramInput {
  name: string;
  useCase: string;
  archetype: ArchetypeKey | null;
  originSource: OriginSource;
  originSourceRef?: string | null;
  acceptedPatternKey?: string | null;
  sponsorUserId?: string;
  leadUserId?: string;
  industryHint?: string;
  maestroOversightLevel?: OversightLevel;
  founderApprovalRequired?: boolean;
  dataResidencyRegion?: string;
}

export async function originateProgram(
  ctx: TenancyCtx,
  input: OriginateProgramInput,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramCore> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const industryCode = await resolveClientIndustryCode(
    ctx.clientId,
    input.industryHint,
    { supabase: sb },
  );
  const classificationCodes = resolveProgramClassificationCodes({
    name: input.name,
    useCase: input.useCase,
    archetype: input.archetype,
    acceptedPatternKey: input.acceptedPatternKey,
  });
  // NOTE: engagements has no `created_by` column on the current schema —
  // creator attribution is captured in module_state_log (changed_by_user_id)
  // and downstream participant rows. Don't reintroduce a created_by write.
  const graphNodeId = buildEngagementGraphNodeId(input.name);
  const { data, error } = await sb
    .from("engagements")
    .insert({
      graph_node_id: graphNodeId,
      client_id: ctx.clientId,
      industry_code: industryCode,
      function_code: classificationCodes.functionCode,
      objective_code: classificationCodes.objectiveCode,
      topic_code: classificationCodes.topicCode,
      name: input.name,
      // Legacy compatibility: the original engagement engine used `solution`
      // as the required program label. Live DBs can still carry that NOT NULL
      // constraint even though Programs now reads `name`.
      solution: input.name,
      status: "active",
      current_phase: 0,
      program_archetype: input.archetype,
      origin_source: input.originSource,
      origin_source_ref: input.originSourceRef ?? null,
      maestro_oversight_level: input.maestroOversightLevel ?? "partial",
      founder_approval_required: input.founderApprovalRequired ?? false,
      data_residency_region: input.dataResidencyRegion ?? null,
      retention_policy_years: 7,
    })
    .select("*")
    .single();
  if (error) throw error;

  const programId = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: "program_originated",
    fromState: null,
    toState: "phase_0_seed_created",
    rationale: input.useCase,
    evidenceRefs: input.acceptedPatternKey ? [input.acceptedPatternKey] : [],
  });

  // Record the pattern match event if a pattern was accepted
  if (input.acceptedPatternKey) {
    const { error: pmErr } = await sb.from("pattern_match_logs").insert({
      engagement_id: programId,
      pattern_key: input.acceptedPatternKey,
      match_confidence: null,
      match_context_jsonb: {
        use_case: input.useCase,
        accepted_at_origination: true,
      },
      suggested_action: "pattern",
      acted_upon: true,
      acted_upon_at: new Date().toISOString(),
      acted_upon_by_user_id: ctx.userId,
      matched_by_agent: "classifier_v1",
    });
    if (pmErr) throw pmErr;
  }

  // Log initial state
  const { error: logErr } = await sb.from("module_state_log").insert({
    engagement_id: programId,
    module_key: "origination",
    previous_state: null,
    new_state: "completed",
    changed_by_user_id: ctx.userId,
    context_jsonb: {
      pattern_key: input.acceptedPatternKey,
      origin: input.originSource,
    },
  });
  if (logErr) throw logErr;

  const program = await getProgramById(ctx, programId, { supabase: sb });
  if (!program)
    throw new Error("[originateProgram] created program not readable");
  return program;
}

export interface AdvancePhaseInput {
  programId: string;
  fromPhase: number;
  toPhase: number;
  snapshot: Record<string, unknown>;
  approvedByUserId?: string;
  bypassGate?: boolean;
  // Discovery Intake (S2c): the P1 plan to persist into the charter on advance.
  // Written only when `discovery_intake_v2` is enabled for the tenant.
  discoveryPlan?: DiscoveryPlan | null;
}

export async function advancePhase(
  ctx: TenancyCtx,
  input: AdvancePhaseInput,
  opts: { supabase?: SupabaseClient } = {},
): Promise<{ programId: string; newPhase: number; snapshotId: string }> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, input.programId, { supabase: sb });

  // Physical write goes through the data-plane write seam (Slice 3f): the
  // snapshot insert + engagement update + state-log insert are one unit —
  // atomic on Azure, the same three statements on Supabase. A write error is
  // surfaced as `ok:false` and re-thrown here, exactly as the pre-seam helper.
  // Discovery Intake (S2c): persist the P1 plan into the charter only when the
  // tenant has `discovery_intake_v2` enabled. Flag off → null → the adapter's
  // engagement update is byte-identical to today.
  const discoveryPlanToWrite =
    input.discoveryPlan && isFeatureEnabled(ctx, "discovery_intake_v2")
      ? input.discoveryPlan
      : null;

  const written = await programsWriteAdapter(opts.supabase).runAdvancePhase({
    programId: input.programId,
    clientId: ctx.clientId,
    userId: ctx.userId,
    fromPhase: input.fromPhase,
    toPhase: input.toPhase,
    snapshot: input.snapshot,
    approvedByUserId: input.approvedByUserId,
    bypassGate: input.bypassGate,
    discoveryPlan: discoveryPlanToWrite,
  });
  if (!written.ok || !written.data) {
    throw new Error(written.error ?? "[advancePhase] write failed");
  }
  const snapshotId = written.data.snapshotId;

  await writeProgramAuditLogBestEffort(ctx, {
    programId: input.programId,
    engagementId: input.programId,
    action: "program_phase_advanced",
    fromState: `P${input.fromPhase}`,
    toState: `P${input.toPhase}`,
    rationale: input.bypassGate
      ? "Phase advanced with gate bypass flag."
      : "Phase advanced after gate evaluation.",
    evidenceRefs: [snapshotId],
  });

  return { programId: input.programId, newPhase: input.toPhase, snapshotId };
}

/**
 * Manage Moves · archive a single Move (reversible soft state — NEVER a hard
 * delete). Sets `lifecycle_state='archived'`, stamps archive provenance, and
 * records the prior lifecycle_state in `archived_from_state` so Restore can
 * return the Move to exactly where it was. Evidence, artifacts, approvals,
 * deliverables, traces, and audit history are untouched.
 *
 * Tenancy is asserted via `assertProgramTenancy` (the row must be readable by
 * `ctx` and scoped to `ctx.clientId`). Writes a `program_archived` audit-log
 * entry. Idempotent for an already-archived Move (the read still passes; the
 * update is scoped by id+client so it is a safe no-op refresh).
 */
export async function archiveMove(
  ctx: TenancyCtx,
  input: { programId: string; reason: string; explanation?: string | null },
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const program = await getProgramById(ctx, input.programId, { supabase: sb });
  if (!program)
    throw new Error(`[archiveMove] program ${input.programId} not accessible`);

  const fromState = program.lifecycleState ?? null;
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("engagements")
    .update({
      lifecycle_state: "archived",
      archived_at: nowIso,
      archived_by: ctx.userId,
      archive_reason: input.reason,
      archive_explanation: input.explanation ?? null,
      // Only capture the prior state when the Move was not already archived,
      // so a double-archive cannot overwrite the real restore target.
      ...(fromState === "archived" ? {} : { archived_from_state: fromState }),
      updated_at: nowIso,
    })
    .eq("id", input.programId)
    .eq("client_id", ctx.clientId)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  await writeProgramAuditLogBestEffort(ctx, {
    programId: input.programId,
    engagementId: input.programId,
    action: "program_archived",
    fromState,
    toState: "archived",
    rationale: input.explanation?.trim()
      ? `${input.reason} — ${input.explanation.trim()}`
      : input.reason,
  });

  return Boolean(data);
}

/**
 * Manage Moves · restore an archived Move to its prior lifecycle_state
 * (`archived_from_state`, falling back to 'approved' when unknown). Clears all
 * archive-provenance fields. Writes a `program_restored` audit-log entry.
 */
export async function restoreMove(
  ctx: TenancyCtx,
  input: { programId: string },
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const program = await getProgramById(ctx, input.programId, { supabase: sb });
  if (!program)
    throw new Error(`[restoreMove] program ${input.programId} not accessible`);

  const targetState = program.archivedFromState ?? "approved";
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("engagements")
    .update({
      lifecycle_state: targetState,
      archived_at: null,
      archived_by: null,
      archive_reason: null,
      archive_explanation: null,
      archived_from_state: null,
      updated_at: nowIso,
    })
    .eq("id", input.programId)
    .eq("client_id", ctx.clientId)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  await writeProgramAuditLogBestEffort(ctx, {
    programId: input.programId,
    engagementId: input.programId,
    action: "program_restored",
    fromState: "archived",
    toState: targetState,
    rationale: "Move restored from archive.",
  });

  return Boolean(data);
}

/**
 * Discovery Intake (S3c): apply a parsed, uploaded evidence item to a Move's
 * charter — read the current DiscoveryShape, route the evidence in (upload
 * provenance + review-pending), and persist the updated charter. Returns the
 * extraction receipt, or `null` when the flag is off or the Move is unreadable.
 * Flag-gated by `discovery_intake_v2`.
 */
export async function applyUploadedEvidenceToMove(
  ctx: TenancyCtx,
  input: {
    programId: string;
    evidence: ExtractedProgramEvidence;
    sourceFile: string;
  },
  opts: { supabase?: SupabaseClient } = {},
): Promise<ExtractionReceipt | null> {
  assertTenancy(ctx);
  if (!isFeatureEnabled(ctx, "discovery_intake_v2")) return null;

  const program = await getProgramById(ctx, input.programId, opts);
  if (!program) return null;

  const { charter, receipt } = applyEvidenceToCharter(
    program.charter,
    input.evidence,
    {
      sourceFile: input.sourceFile,
    },
  );

  const written = await programsWriteAdapter(
    opts.supabase,
  ).updateEngagementCharter({
    programId: input.programId,
    clientId: ctx.clientId,
    charter,
  });
  if (!written.ok) {
    throw new Error(
      written.error ?? "[applyUploadedEvidenceToMove] charter update failed",
    );
  }
  return receipt;
}

/**
 * Publish a deliverable (flip draft → in_review). Uses existing
 * deliverables_v2 infra; this is a thin programs-facing wrapper.
 */
export async function publishDeliverable(
  ctx: TenancyCtx,
  programId: string,
  deliverableId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const { data, error } = await sb
    .from("deliverables_v2")
    .update({ status: "in_review", updated_at: new Date().toISOString() })
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/**
 * Create-or-find the phase gate deliverable record (charter, discovery_report,
 * design_spec, …) that the phase workspace Save → Approve → Generate sequence
 * signs off. The signed-in phase-capture Save path calls this when all required
 * capture sections are present, so the returned `deliverableId` lets the client
 * enable "Approve" and the sign-off route (which requires `in_review`) succeed.
 *
 * Idempotent and non-destructive: if a deliverable of this type already exists
 * for the Move it is returned untouched (so a re-save never resets a `signed_off`
 * record back to a draft/in_review state, and never bumps its version). A newly
 * created record is written directly in `in_review` so Approve works without a
 * separate publish step. Content is optional; the gate and sign-off read only
 * `deliverables_v2` (type + status), so a hollow record still satisfies the gate.
 */
export async function ensurePhaseGateDeliverable(
  ctx: TenancyCtx,
  programId: string,
  input: { deliverableTypeKey: string; title: string; content?: string },
  opts: { supabase?: SupabaseClient } = {},
): Promise<{ deliverableId: string; status: string; created: boolean }> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const deliverableTypeKey = input.deliverableTypeKey.trim();
  const title = input.title.trim();
  if (!deliverableTypeKey)
    throw new Error("[ensurePhaseGateDeliverable] deliverableTypeKey is required");
  if (!title) throw new Error("[ensurePhaseGateDeliverable] title is required");

  await ensureDeliverableType(sb, deliverableTypeKey);

  const { data: existing, error: existingError } = await sb
    .from("deliverables_v2")
    .select("id, status")
    .eq("engagement_id", programId)
    .eq("deliverable_type_key", deliverableTypeKey)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const row = existing as { id: string; status: string };
    return { deliverableId: row.id, status: row.status, created: false };
  }

  const { data: created, error } = await sb
    .from("deliverables_v2")
    .insert({
      engagement_id: programId,
      deliverable_type_key: deliverableTypeKey,
      title,
      // Created directly in `in_review` so the phase Approve step (sign-off,
      // which requires `in_review`) can act on it without a publish hop.
      status: "in_review",
      current_version: 1,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  const deliverableId = (created as { id: string }).id;

  const content = input.content?.trim();
  if (content) {
    const { error: versionError } = await sb.from("deliverable_versions").insert({
      deliverable_id: deliverableId,
      version: 1,
      content,
      structured_data: {
        source: "phase_capture",
        generated_by: "phase_capture_route",
      },
    });
    if (versionError) throw versionError;
  }

  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: "deliverable_drafted",
    fromState: "new_deliverable",
    toState: "in_review",
    rationale: title,
    evidenceRefs: [deliverableId],
  });

  return { deliverableId, status: "in_review", created: true };
}

export async function signOffDeliverable(
  ctx: TenancyCtx,
  programId: string,
  deliverableId: string,
  opts: {
    supabase?: SupabaseClient;
    /**
     * Set when the client approved by uploading an edited replacement
     * (move_artifacts row, artifact_family=generated_deliverable) rather
     * than approving the AI-generated text as-is.
     */
    approvedArtifactId?: string;
    /**
     * Parsed text from a client-uploaded replacement document. When supplied,
     * sign-off creates a new deliverable_versions row and signs off that row so
     * downstream generation consumes the human-approved text, not the prior AI
     * draft.
     */
    approvedContent?: {
      content: string;
      fileName: string;
      mimeType: string;
      parseMethod: string;
      warnings?: string[];
    };
  } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });

  const { data: existing, error: readError } = await sb
    .from("deliverables_v2")
    .select("current_version")
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) return false;
  const currentVersion = (existing as { current_version: number | null })
    .current_version ?? 0;
  let approvedVersion = currentVersion;
  const approvedContent = opts.approvedContent?.content.trim();

  if (approvedContent) {
    approvedVersion = currentVersion + 1;
    const { error: versionError } = await sb
      .from("deliverable_versions")
      .insert({
        deliverable_id: deliverableId,
        version: approvedVersion,
        content: approvedContent,
        structured_data: {
          source: "client_approved_upload",
          approved_artifact_id: opts.approvedArtifactId ?? null,
          uploaded_file_name: opts.approvedContent?.fileName ?? null,
          mime_type: opts.approvedContent?.mimeType ?? null,
          parse_method: opts.approvedContent?.parseMethod ?? null,
          parse_warnings: opts.approvedContent?.warnings ?? [],
          approved_by: ctx.userId,
          approved_by_email: ctx.email ?? null,
          human_approved: true,
          replaces_ai_draft: true,
        },
        quality_issues: null,
        generated_from_context_hash: null,
      });
    if (versionError) throw versionError;
  }

  const { data, error } = await sb
    .from("deliverables_v2")
    .update({
      status: "signed_off",
      current_version: approvedVersion,
      signed_off_by: ctx.userId,
      signed_off_at: new Date().toISOString(),
      // The durable record of what was approved. Later regeneration may advance
      // current_version, but content readers continue to prefer this explicit
      // signed-off version until a newer version is approved.
      signed_off_version: approvedVersion,
      approved_artifact_id: opts.approvedArtifactId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    // Accept `draft` as well as `in_review`. The phase "Build and approve" flow
    // generates the board-grade deliverable (which lands in `draft`) and then
    // signs it off in the same action, so sign-off must act on a fresh draft
    // without a separate publish hop. Widening only ADDS draft acceptance; the
    // existing in_review → signed_off path is unchanged.
    .in("status", ["draft", "in_review"])
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export interface CompleteDeliverableInput {
  deliverableTypeKey: string;
  title: string;
  content?: string;
  moduleKey?: string;
  structuredData?: Record<string, unknown>;
  provenanceMap?: Record<string, unknown>;
  signOff?: boolean;
}

const LIFECYCLE_DELIVERABLE_PHASES: Record<string, number[]> = {
  origination_brief: [0],
  program_seed_brief: [0],
  program_seed: [0],
  discovery_report: [1],
  current_state_summary: [1],
  baseline: [1],
  baseline_metrics: [1],
  stakeholder_map: [1],
  synthesis_options_memo: [2],
  charter: [2],
  design_spec: [3],
  design: [3],
  design_brief: [3],
  requirements_traceability: [3],
  execution_roadmap: [4],
  execution_plan: [4],
  business_case: [5],
  approval_packet: [5],
  approval_memo: [5],
  funding_approval: [5],
  sponsor_alignment: [5],
  stakeholder_alignment: [5],
  readiness_and_change_plan: [5],
  change_management_plan: [5],
  tower_handoff_plan: [6],
  control_tower_handoff: [6],
  execution_monitoring_plan: [6],
  outcome_report: [6],
};

function titleizeDeliverableType(typeKey: string): string {
  return typeKey
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function ensureDeliverableType(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  deliverableTypeKey: string,
): Promise<void> {
  const { error } = await sb.from("deliverable_types").upsert(
    {
      type_key: deliverableTypeKey,
      title: titleizeDeliverableType(deliverableTypeKey),
      description: `Lifecycle deliverable type used by Nexus for ${deliverableTypeKey}.`,
      applicable_phases: LIFECYCLE_DELIVERABLE_PHASES[deliverableTypeKey] ?? [],
      applicable_topics: [],
      template_structure: { sections: [] },
      required_data_inputs: {},
      quality_rubric: {},
      generation_prompt_template: null,
      output_format: "markdown",
      version: 1,
      maturity: "pilot",
    },
    { onConflict: "type_key", ignoreDuplicates: true },
  );
  if (error) throw error;
}

/**
 * Create/update a deliverable and optionally sign it off in one atomic
 * crawl-facing operation. This is intentionally stricter than the draft
 * route: it exists for explicit user/admin approval moments where Nexus has
 * generated the artifact and the authorized user says to accept it.
 */
export async function completeDeliverable(
  ctx: TenancyCtx,
  programId: string,
  input: CompleteDeliverableInput,
  opts: { supabase?: SupabaseClient } = {},
): Promise<{
  deliverableId: string;
  versionId: string | null;
  status: "draft" | "signed_off";
}> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const deliverableTypeKey = input.deliverableTypeKey.trim();
  const title = input.title.trim();
  if (!deliverableTypeKey)
    throw new Error("[completeDeliverable] deliverableTypeKey is required");
  if (!title) throw new Error("[completeDeliverable] title is required");

  const now = new Date().toISOString();
  await ensureDeliverableType(sb, deliverableTypeKey);
  const { data: existing, error: existingError } = await sb
    .from("deliverables_v2")
    .select("id, current_version")
    .eq("engagement_id", programId)
    .eq("deliverable_type_key", deliverableTypeKey)
    .maybeSingle();
  if (existingError) throw existingError;

  let deliverableId: string;
  let nextVersion = 1;
  if (existing) {
    deliverableId = (existing as { id: string; current_version: number | null })
      .id;
    nextVersion =
      ((existing as { current_version: number | null }).current_version ?? 0) +
      1;
    const { error } = await sb
      .from("deliverables_v2")
      .update({
        title,
        current_version: nextVersion,
        status: input.signOff === false ? "draft" : "signed_off",
        signed_off_by: input.signOff === false ? null : ctx.userId,
        signed_off_at: input.signOff === false ? null : now,
        updated_at: now,
      })
      .eq("id", deliverableId)
      .eq("engagement_id", programId);
    if (error) throw error;
  } else {
    const { data: created, error } = await sb
      .from("deliverables_v2")
      .insert({
        engagement_id: programId,
        deliverable_type_key: deliverableTypeKey,
        title,
        status: input.signOff === false ? "draft" : "signed_off",
        current_version: 1,
        // Actor fields should identify the signed-in user/person. Nexus
        // authorship is recorded in structured provenance below.
        created_by: ctx.userId,
        signed_off_by: input.signOff === false ? null : ctx.userId,
        signed_off_at: input.signOff === false ? null : now,
      })
      .select("id")
      .single();
    if (error) throw error;
    deliverableId = (created as { id: string }).id;
  }

  let versionId: string | null = null;
  const content = input.content?.trim();
  if (content) {
    const { data: version, error } = await sb
      .from("deliverable_versions")
      .insert({
        deliverable_id: deliverableId,
        version: nextVersion,
        content,
        structured_data: {
          ...(input.structuredData ?? {}),
          module_key: input.moduleKey ?? null,
          completed_by_tool: true,
          generated_by_agent: "Nexus",
          signed_off: input.signOff !== false,
        },
        quality_issues: input.provenanceMap
          ? { provenance_map: input.provenanceMap }
          : null,
        generated_from_context_hash: null,
      })
      .select("id")
      .single();
    if (error) throw error;
    versionId = (version as { id: string }).id;
  }

  const { error: logErr } = await sb.from("module_state_log").insert({
    engagement_id: programId,
    module_key: input.moduleKey ?? deliverableTypeKey,
    previous_state: null,
    new_state: input.signOff === false ? "drafted" : "signed_off",
    changed_by_user_id: ctx.userId,
    notes: `${title} ${input.signOff === false ? "drafted" : "signed off"} by Nexus tool`,
    context_jsonb: {
      deliverable_id: deliverableId,
      deliverable_type_key: deliverableTypeKey,
      version_id: versionId,
    },
  });
  if (logErr) throw logErr;

  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action:
      input.signOff === false
        ? "deliverable_drafted"
        : "deliverable_signed_off",
    fromState: existing ? "existing_deliverable" : "new_deliverable",
    toState: input.signOff === false ? "draft" : "signed_off",
    rationale: title,
    evidenceRefs: [deliverableId, ...(versionId ? [versionId] : [])],
  });

  return {
    deliverableId,
    versionId,
    status: input.signOff === false ? "draft" : "signed_off",
  };
}

export async function setModuleStatus(
  ctx: TenancyCtx,
  programId: string,
  moduleKey: string,
  status: ModuleStatus,
  patch: { assignedUserId?: string; notes?: string } = {},
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });

  // Read current state for audit log
  const { data: current } = await sb
    .from("program_modules")
    .select("status")
    .eq("engagement_id", programId)
    .eq("module_key", moduleKey)
    .maybeSingle();

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status };
  if (status === "in_progress" && !current) update.started_at = now;
  if (status === "completed") update.completed_at = now;
  if (patch.assignedUserId) update.assigned_user_id = patch.assignedUserId;

  const { data: updatedRow, error } = await sb
    .from("program_modules")
    .update(update)
    .eq("engagement_id", programId)
    .eq("module_key", moduleKey)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updatedRow) return false;

  const { error: logErr } = await sb.from("module_state_log").insert({
    engagement_id: programId,
    module_key: moduleKey,
    previous_state: (current as { status: string } | null)?.status ?? null,
    new_state: status,
    changed_by_user_id: ctx.userId,
    notes: patch.notes ?? null,
  });
  if (logErr) throw logErr;

  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: "program_module_status_changed",
    fromState: (current as { status: string } | null)?.status ?? null,
    toState: status,
    rationale: patch.notes ?? null,
    evidenceRefs: [moduleKey],
  });
  return true;
}

export async function createMilestone(
  ctx: TenancyCtx,
  programId: string,
  input: {
    name: string;
    description?: string;
    targetDate?: string;
    phaseNumber?: number;
    moduleKey?: string;
    ownerUserId?: string;
  },
  opts: { supabase?: SupabaseClient } = {},
): Promise<string> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const phaseNumber = input.phaseNumber ?? null;
  const moduleKey = input.moduleKey ?? null;
  let existingQuery = sb
    .from("program_milestones")
    .select("id")
    .eq("engagement_id", programId)
    .eq("name", input.name)
    .order("created_at", { ascending: true })
    .limit(1);

  existingQuery =
    phaseNumber === null
      ? existingQuery.is("phase_number", null)
      : existingQuery.eq("phase_number", phaseNumber);
  existingQuery =
    moduleKey === null
      ? existingQuery.is("module_key", null)
      : existingQuery.eq("module_key", moduleKey);

  const { data: existing, error: existingError } =
    await existingQuery.maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const existingId = (existing as { id: string }).id;
    const { error: updateError } = await sb
      .from("program_milestones")
      .update({
        description: input.description ?? null,
        target_date: input.targetDate ?? null,
        owner_user_id: input.ownerUserId ?? null,
      })
      .eq("id", existingId)
      .eq("engagement_id", programId);
    if (updateError) throw updateError;
    return existingId;
  }

  const { data, error } = await sb
    .from("program_milestones")
    .insert({
      engagement_id: programId,
      name: input.name,
      description: input.description ?? null,
      target_date: input.targetDate ?? null,
      status: "upcoming",
      phase_number: phaseNumber,
      module_key: moduleKey,
      owner_user_id: input.ownerUserId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateMilestoneStatus(
  ctx: TenancyCtx,
  programId: string,
  milestoneId: string,
  status: MilestoneStatus,
  actualDate?: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const { data, error } = await sb
    .from("program_milestones")
    .update({ status, actual_date: actualDate ?? null })
    .eq("id", milestoneId)
    .eq("engagement_id", programId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function createWorkItem(
  ctx: TenancyCtx,
  programId: string,
  input: {
    title: string;
    description?: string;
    itemType: WorkItemType;
    parentId?: string;
    priority?: "critical" | "high" | "medium" | "low";
    assignedUserId?: string;
    moduleKey?: string;
    phaseNumber?: number;
    dueDate?: string;
  },
  opts: { supabase?: SupabaseClient } = {},
): Promise<string> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const { data, error } = await sb
    .from("program_work_items")
    .insert({
      engagement_id: programId,
      parent_id: input.parentId ?? null,
      title: input.title,
      description: input.description ?? null,
      item_type: input.itemType,
      status: "open",
      priority: input.priority ?? null,
      assigned_user_id: input.assignedUserId ?? null,
      module_key: input.moduleKey ?? null,
      phase_number: input.phaseNumber ?? null,
      due_date: input.dueDate ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateWorkItemStatus(
  ctx: TenancyCtx,
  programId: string,
  workItemId: string,
  status: WorkItemStatus,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const update: Record<string, unknown> = { status };
  if (status === "done") update.completed_at = new Date().toISOString();
  const { data, error } = await sb
    .from("program_work_items")
    .update(update)
    .eq("id", workItemId)
    .eq("engagement_id", programId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function createRisk(
  ctx: TenancyCtx,
  programId: string,
  input: {
    title: string;
    description?: string;
    likelihood?: RiskLikelihood;
    impact?: RiskImpact;
    mitigationPlan?: string;
    ownerUserId?: string;
    phaseNumber?: number;
    moduleKey?: string;
  },
  opts: { supabase?: SupabaseClient } = {},
): Promise<string> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });
  const { data, error } = await sb
    .from("program_risks")
    .insert({
      engagement_id: programId,
      title: input.title,
      description: input.description ?? null,
      likelihood: input.likelihood ?? "medium",
      impact: input.impact ?? "medium",
      status: "open",
      mitigation_plan: input.mitigationPlan ?? null,
      owner_user_id: input.ownerUserId ?? null,
      phase_number: input.phaseNumber ?? null,
      module_key: input.moduleKey ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}
