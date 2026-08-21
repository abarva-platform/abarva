import "server-only";

import { streamAgentTurn } from "@/lib/agent/stream";
import {
  parseDiagnosisFacts,
  isStructuredFactsValue,
  factsToBaselineMetrics,
  factsToPromptText,
} from "@/lib/programs/diagnosis-facts";
import type { GenerateArtifactDeps } from "@/lib/deliverables/generate-artifact";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import { azureRead } from "@/lib/data-plane/azureRead";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  getModuleState,
  getPhaseSnapshots,
  getProgramById,
} from "@/lib/programs/queries";
import {
  formatProgramEvidenceForPrompt,
  listProgramEvidenceForPrompt,
} from "@/lib/programs/evidence-context";
import { loadEvidencePacketsForMove } from "@/lib/programs/evidence-packets";
import {
  buildProgramsContextBundleAsync,
  formatProgramsBrokerBundleForPrompt,
} from "@/lib/programs/programs-broker-adapter";
import { hasPriorPhaseDraftApproval } from "@/lib/programs/deliverables/artifact-review-decisions";
import {
  formatAcceptedStageReadinessContextForPrompt,
  loadAcceptedStageReadinessContext,
} from "@/lib/programs/stage-readiness-workbooks/accepted-context";
import type {
  PhaseDigest,
  SolutionDecision,
} from "@/lib/programs/solution-context";
import {
  P3_ARCHITECTURE_TYPE_KEYS,
  type DeliverableAcceptance,
  type PriorDeliverable,
} from "@/lib/programs/prior-deliverable-precedence";

const BROKER_DOMAINS = [
  "enterprise_profile",
  "people_org",
  "program_lifecycle",
  "system_landscape",
  "vendor_contracts",
  "financials",
  "evidence_provenance",
  "operating_telemetry",
] as const;

const PHASE_DEFAULT_ARTIFACT: Record<number, DeliverableKey> = {
  1: "charter",
  2: "discovery_report",
  3: "solution_approach_options",
  4: "execution_roadmap",
  5: "handoff_package",
};

function isDeliverableKey(value: string): value is DeliverableKey {
  return value in DELIVERABLE_PROFILES;
}

export function normalizeMovesDeliverableKey(
  input: string | undefined,
  phase: number,
  title = "",
): DeliverableKey {
  const raw = `${input ?? ""} ${title}`.toLowerCase();
  if (input && isDeliverableKey(input)) return input;
  if (raw.includes("approach") || raw.includes("option"))
    return "solution_approach_options";
  if (raw.includes("architecture") || raw.includes("target state"))
    return "target_state_architecture";
  if (raw.includes("solution design") || raw.includes("design_spec"))
    return "solution_design";
  if (raw.includes("business case")) return "business_case";
  if (raw.includes("financial")) return "financial_model";
  if (raw.includes("measurement") || raw.includes("metric"))
    return "value_measurement_contract";
  if (raw.includes("mobilize") || raw.includes("handoff"))
    return "handoff_package";
  if (raw.includes("roadmap")) return "execution_roadmap";
  if (raw.includes("root cause")) return "root_cause_worksheet";
  if (
    raw.includes("diagnose") ||
    raw.includes("diagnostic") ||
    raw.includes("discover")
  ) {
    return "discovery_report";
  }
  if (raw.includes("charter")) return "charter";
  return PHASE_DEFAULT_ARTIFACT[phase] ?? "charter";
}

function extractRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isPhaseDigest(value: unknown): value is PhaseDigest {
  return extractRecord(value) !== null;
}

function structuredDigest(structuredData: unknown): PhaseDigest | null {
  const data = extractRecord(structuredData);
  if (!data) return null;
  const direct =
    data.solutionContextDigest ??
    data.solution_context_digest ??
    data.phaseDigest ??
    data.phase_digest ??
    null;
  if (isPhaseDigest(direct)) return direct;
  const context = data.solutionContext ?? data.solution_context;
  if (isPhaseDigest(context)) return context;
  return null;
}

function gatesPassedContains(gatesPassed: unknown[], phase: number): boolean {
  return gatesPassed.some((entry) => {
    if (entry === phase || entry === String(phase) || entry === `P${phase}`)
      return true;
    const gate = extractRecord(entry);
    if (!gate) return false;
    const gatePhase = gate.phase ?? gate.phase_number ?? gate.phaseNumber;
    const status = String(
      gate.status ?? gate.approval_status ?? "approved",
    ).toLowerCase();
    return (
      (gatePhase === phase ||
        gatePhase === String(phase) ||
        gatePhase === `P${phase}`) &&
      ["approved", "passed", "complete", "completed"].includes(status)
    );
  });
}

function stripHtmlFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function maxTokensForRequest(requested?: number): number {
  const envTokens = Number(process.env.NEXUS_MOVES_ARTIFACT_MAX_TOKENS ?? 0);
  const requestedTokens = requested ?? 25000;
  return Math.max(Number.isFinite(envTokens) ? envTokens : 0, requestedTokens);
}

/** Map a deliverables_v2 row's status to the authoritative-acceptance model. */
function acceptanceFromStatus(
  status: string,
  version: number,
  signedOffVersion: number | null,
): DeliverableAcceptance {
  const s = (status ?? "").toLowerCase();
  if (s === "superseded") return "superseded";
  if (s === "rejected") return "rejected";
  // Accepted only when the deliverable is signed off AND this is the signed-off
  // version — a later unreviewed regeneration is never authoritative.
  if (
    (s === "signed_off" || s === "approved" || s === "board_ready") &&
    (signedOffVersion == null || version === signedOffVersion)
  ) {
    return "accepted";
  }
  if (s === "draft" || s === "in_review" || s === "review_required")
    return "draft";
  return "candidate";
}

/** Best-effort plain-text architecture summary from a deliverable version. */
function architectureSummaryFrom(
  digest: PhaseDigest | null,
  content: string | null,
): string | undefined {
  const fromDigest = (
    digest?.architecture ??
    digest?.solutionDesign ??
    digest?.approach
  )?.trim();
  if (fromDigest) return fromDigest;
  const text = (content ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, 1200) : undefined;
}

export function createMovesGenerateArtifactDeps(
  ctx: TenancyCtx,
): GenerateArtifactDeps {
  return {
    contextSources: {
      async retrieveCurrentState(tenantKey, _query, moveId, phase) {
        const bundle = await buildProgramsContextBundleAsync({
          tenantKey,
          programId: moveId,
          agentName: "Nexus",
          surface: "programs",
          allowL4RawContext: false,
          includeGraphNeighborhood: true,
          requestedDomains: [...BROKER_DOMAINS],
        });
        const promptBlock = formatProgramsBrokerBundleForPrompt(bundle).trim();
        // Scoped to the target phase — once a phase gates, its raw evidence is
        // done; later phases inherit it via that phase's own finished,
        // approved artifact (loadPriorDigests), not by re-reading raw files.
        const evidenceBlock = moveId
          ? await listProgramEvidenceForPrompt(ctx, moveId, phase)
              .then(formatProgramEvidenceForPrompt)
              .catch(() => "")
          : "";
        const stageReadinessBlock =
          moveId && typeof phase === "number"
            ? await loadAcceptedStageReadinessContext(ctx, moveId, phase)
                .then(formatAcceptedStageReadinessContextForPrompt)
                .catch(() => "")
            : "";
        return [promptBlock, evidenceBlock, stageReadinessBlock]
          .filter(Boolean)
          .join("\n\n");
      },
      async loadPriorDigests(moveId) {
        // One row per deliverable type — the client-approved version
        // (signed_off_version) when one exists, otherwise the newest draft.
        // Previously this pulled every version of every deliverable with no
        // dedup at all, so an approved version had no more weight in the
        // generation context than any later unreviewed regeneration.
        const rows = await azureRead.query<{
          structured_data: unknown;
          version: number;
          created_at: string;
          deliverable_type_key: string;
        }>(
          "SELECT structured_data, version, created_at, deliverable_type_key FROM (" +
            "SELECT DISTINCT ON (d.deliverable_type_key) " +
            "dv.structured_data, dv.version, d.created_at, d.deliverable_type_key " +
            "FROM deliverable_versions dv " +
            "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
            "WHERE d.engagement_id = $1 " +
            "ORDER BY d.deliverable_type_key, (dv.version = d.signed_off_version) DESC, dv.version DESC" +
            ") latest_per_type " +
            "ORDER BY created_at ASC, version ASC",
          [moveId],
          { missingTable: "empty" },
        );
        return rows
          .map((row) => structuredDigest(row.structured_data))
          .filter((digest): digest is PhaseDigest => digest !== null);
      },
      async loadPriorDeliverables(moveId) {
        // Architecture-bearing prior deliverables WITH real acceptance status +
        // Move/tenant scope + lineage, so the assembler can resolve authoritative
        // architecture by precedence (PR1). Scoped to this Move by
        // engagement_id; the tenant is this ctx's tenant. The pure resolver
        // still re-checks Move/tenant scope as defense in depth.
        const rows = await azureRead.query<{
          id: string;
          structured_data: unknown;
          content: string | null;
          version: number;
          status: string;
          signed_off_version: number | null;
          deliverable_type_key: string;
        }>(
          "SELECT dv.id, dv.structured_data, dv.content, dv.version, " +
            "d.status, d.signed_off_version, d.deliverable_type_key FROM (" +
            "SELECT DISTINCT ON (d.deliverable_type_key) " +
            "dv.id, dv.structured_data, dv.content, dv.version, " +
            "d.status, d.signed_off_version, d.deliverable_type_key " +
            "FROM deliverable_versions dv " +
            "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
            "WHERE d.engagement_id = $1 " +
            "AND d.deliverable_type_key = ANY($2) " +
            "ORDER BY d.deliverable_type_key, (dv.version = d.signed_off_version) DESC, dv.version DESC" +
            ") d " +
            "ORDER BY deliverable_type_key ASC",
          [moveId, [...P3_ARCHITECTURE_TYPE_KEYS]],
          { missingTable: "empty" },
        );
        const tenantKey = ctx.clientKey ?? ctx.clientId;
        return rows.map((row): PriorDeliverable => {
          const digest = structuredDigest(row.structured_data) ?? {};
          const architecture = architectureSummaryFrom(digest, row.content);
          return {
            deliverableTypeKey: row.deliverable_type_key,
            acceptance: acceptanceFromStatus(
              row.status,
              row.version,
              row.signed_off_version,
            ),
            engagementId: moveId,
            tenantKey,
            digest: architecture ? { ...digest, architecture } : digest,
            lineageRef: row.id,
          };
        });
      },
      async loadDecisions(moveId) {
        const decisions: SolutionDecision[] = [];
        const program = await getProgramById(ctx, moveId).catch(() => null);
        const gatesPassed = Array.isArray(program?.gatesPassed)
          ? program.gatesPassed
          : [];
        for (let phase = 0; phase <= 5; phase += 1) {
          if (gatesPassedContains(gatesPassed, phase)) {
            decisions.push({
              phase,
              decision: `P${phase} gate approved`,
              rationale: "Program gate record shows this phase was approved.",
            });
          }
        }
        return decisions;
      },
      async loadEvidencePackets(moveId, phase) {
        return loadEvidencePacketsForMove(ctx, moveId, phase);
      },
      async loadPhaseCapture(moveId, phase) {
        // The operator's saved phase capture: one program_modules row per
        // section, state_jsonb = { capture_section_key, label, value, … }.
        const modules = await getModuleState(ctx, moveId).catch(() => []);
        const byKey = new Map<string, string>();
        const parts: string[] = [];
        for (const mod of modules) {
          if (mod.phaseNumber !== phase) continue;
          const st = (mod.state ?? {}) as Record<string, unknown>;
          const value = typeof st.value === "string" ? st.value.trim() : "";
          if (!value) continue;
          const key =
            typeof st.capture_section_key === "string"
              ? st.capture_section_key
              : mod.moduleKey;
          byKey.set(key, value);
          const heading =
            (typeof st.label === "string" && st.label) || mod.moduleName || key;
          // Structured facts (baseline) are stored as JSON — render them as
          // readable "metric: value (source: …)" lines, not raw JSON, so the
          // model sees clean provenance-tagged facts.
          const rendered =
            key === "baseline_metrics" && isStructuredFactsValue(value)
              ? factsToPromptText(parseDiagnosisFacts(value))
              : value;
          parts.push(`## ${heading}\n${rendered}`);
        }
        if (parts.length === 0) return null;
        const digest: PhaseDigest = { currentState: parts.join("\n\n") };
        // Structured P2 fields the diagnostic prompt + metric inference expect.
        const baseline = byKey.get("baseline_metrics");
        if (baseline) {
          const metrics = factsToBaselineMetrics(parseDiagnosisFacts(baseline));
          digest.baselineMetrics = Object.keys(metrics).length
            ? metrics
            : { [`Operator-attested baseline (P${phase} capture)`]: baseline };
        }
        const gaps = byKey.get("gaps_root_causes");
        if (gaps) {
          digest.gaps = [gaps];
          digest.rootCauses = [gaps];
        }
        const recommendation = byKey.get("recommendation");
        if (recommendation) {
          digest.humanApprovalNotes = [
            `Operator recommendation (P${phase} capture): ${recommendation}`,
          ];
        }
        return digest;
      },
    },
    gateSources: {
      async captureComplete(moveId, phase) {
        const modules = await getModuleState(ctx, moveId).catch(() => []);
        const phaseModules = modules.filter(
          (module) => module.phaseNumber === phase,
        );
        if (phaseModules.length === 0) {
          return { complete: false, missing: [`P${phase} capture modules`] };
        }
        const missing = phaseModules
          .filter((module) => !["completed", "skipped"].includes(module.status))
          .map((module) => module.moduleName || module.moduleKey);
        return { complete: missing.length === 0, missing };
      },
      async gateApproved(moveId, phase) {
        const program = await getProgramById(ctx, moveId).catch(() => null);
        const gatesPassed = Array.isArray(program?.gatesPassed)
          ? program.gatesPassed
          : [];
        if (gatesPassedContains(gatesPassed, phase)) return true;
        if (typeof getPhaseSnapshots !== "function") return false;
        const snapshots = await getPhaseSnapshots(ctx, moveId, phase).catch(
          () => [],
        );
        return snapshots.some(
          (snapshot) => snapshot.approvalStatus === "approved",
        );
      },
      async priorPhaseDraftApproval(moveId, phase) {
        const result = await hasPriorPhaseDraftApproval(ctx, {
          moveId,
          targetPhase: phase,
        });
        return { approved: result.approved, caveats: result.caveats };
      },
    },
    async callModel(system, user, options) {
      let content = "";
      for await (const chunk of streamAgentTurn({
        system,
        messages: [{ role: "user", content: user }],
        model: process.env.NEXUS_COMPOSER_MODEL ?? "claude-opus-4-7",
        maxTokens: maxTokensForRequest(options?.maxTokens),
        aiEgress: {
          tenantId: ctx.clientId,
          userId: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ctx.userId ?? "")
            ? ctx.userId
            : undefined,
          workflow: "moves-deliverable-redo-generate-artifact",
          dataClass: "confidential",
          artifactType: "program",
          metadata: {
            output_format: "html",
            artifact: options?.artifact,
            phase: options?.phase,
            generationMode: options?.generationMode,
          },
        },
      })) {
        content += chunk;
      }
      return stripHtmlFences(content);
    },
  };
}
