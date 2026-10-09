import "server-only";
import { deliverableModel } from "./model-policy";

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
  gatesPassedContainsPhase,
  isGateApprovedForPhase,
} from "@/lib/programs/approved-gate-phases";
import { PHASE_CANONICAL_KEYS } from "@/lib/programs/deliverable-registry";
import {
  parseBusinessChangeAssessment,
  parseSolutionRouteValidation,
} from "@/lib/programs/solution-route-assessment";
import {
  formatStageReadinessPromptContext,
  loadStageReadinessPromptContext,
} from "@/lib/programs/stage-readiness-workbooks/prompt-context";
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

function canonicalPhaseForDeliverable(typeKey: string): number | null {
  for (const [phase, keys] of Object.entries(PHASE_CANONICAL_KEYS)) {
    if (keys.includes(typeKey)) return Number(phase);
  }
  return null;
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
  // The pointer remains authoritative when a newer current version is draft
  // or in review. Status describes the latest version; signed_off_version
  // identifies the exact human-approved version.
  if (signedOffVersion != null && version === signedOffVersion) {
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
        // Accepted transition answers reach the prompt from a review that is
        // still open too; an undecided response excludes itself, not the
        // answers a human already accepted.
        const stageReadinessBlock =
          moveId && typeof phase === "number"
            ? await loadStageReadinessPromptContext(ctx, moveId, phase)
                .then(formatStageReadinessPromptContext)
                .catch(() => "")
            : "";
        return [promptBlock, evidenceBlock, stageReadinessBlock]
          .filter(Boolean)
          .join("\n\n");
      },
      async loadPriorDigests(moveId, targetPhase) {
        // Only exact human-approved versions from strictly earlier phases are
        // authoritative context. Current/future phase outputs and drafts cannot
        // silently become inputs to this generation pass.
        const rows = await azureRead.query<{
          structured_data: unknown;
          version: number;
          created_at: string;
          deliverable_type_key: string;
        }>(
          "SELECT dv.structured_data, dv.version, d.created_at, d.deliverable_type_key " +
            "FROM deliverable_versions dv " +
            "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
            "WHERE d.engagement_id = $1 " +
            "AND d.status NOT IN ('superseded', 'rejected') " +
            "AND d.signed_off_version IS NOT NULL " +
            "AND dv.version = d.signed_off_version " +
            "ORDER BY d.created_at ASC, d.deliverable_type_key ASC",
          [moveId],
          { missingTable: "empty" },
        );
        return rows
          .filter((row) => {
            const phase = canonicalPhaseForDeliverable(
              row.deliverable_type_key,
            );
            return phase !== null && phase < targetPhase;
          })
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
            "AND d.status NOT IN ('superseded', 'rejected') " +
            "AND d.signed_off_version IS NOT NULL " +
            "AND dv.version = d.signed_off_version " +
            "ORDER BY d.deliverable_type_key ASC" +
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
        // Both gate records, because neither is complete on its own: the
        // denormalized array is not appended to for phases 1-4 by any
        // reachable control, so asking it alone reports a Move walked through
        // the product as having approved no gate it was not seeded with.
        const [program, snapshots] = await Promise.all([
          getProgramById(ctx, moveId).catch(() => null),
          getPhaseSnapshots(ctx, moveId).catch(() => []),
        ]);
        const gatesPassed = Array.isArray(program?.gatesPassed)
          ? program.gatesPassed
          : [];
        for (let phase = 0; phase <= 5; phase += 1) {
          if (isGateApprovedForPhase({ gatesPassed, snapshots }, phase)) {
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
        // Current capture can shape this phase's draft. Earlier capture is
        // inherited only after its modules are complete and its gate passed.
        const [modules, program, snapshots] = await Promise.all([
          getModuleState(ctx, moveId).catch(() => []),
          getProgramById(ctx, moveId).catch(() => null),
          // The authoritative approval record. Without it an earlier phase
          // whose gate was approved in the product inherits nothing here,
          // because the denormalized array is never appended to for P1-P4.
          getPhaseSnapshots(ctx, moveId).catch(() => []),
        ]);
        const gatesPassed = Array.isArray(program?.gatesPassed)
          ? program.gatesPassed
          : [];
        const currentByKey = new Map<string, string>();
        const priorByKey = new Map<string, string>();
        const parts: string[] = [];
        const priorParts: string[] = [];
        const approvalNotes: string[] = [];
        const eligibleModules = modules
          .filter((mod) => {
            if (mod.phaseNumber === phase) return true;
            return (
              typeof mod.phaseNumber === "number" &&
              mod.phaseNumber < phase &&
              mod.status === "completed" &&
              isGateApprovedForPhase(
                { gatesPassed, snapshots },
                mod.phaseNumber,
              )
            );
          })
          .sort((a, b) => a.phaseNumber - b.phaseNumber);
        for (const mod of eligibleModules) {
          const st = (mod.state ?? {}) as Record<string, unknown>;
          const value = typeof st.value === "string" ? st.value.trim() : "";
          if (!value) continue;
          const key =
            typeof st.capture_section_key === "string"
              ? st.capture_section_key
              : mod.moduleKey;
          const isCurrentPhase = mod.phaseNumber === phase;
          (isCurrentPhase ? currentByKey : priorByKey).set(key, value);
          const heading =
            (typeof st.label === "string" && st.label) || mod.moduleName || key;
          let rendered =
            key === "baseline_metrics" && isStructuredFactsValue(value)
              ? factsToPromptText(parseDiagnosisFacts(value))
              : value;
          if (key === "business_change_assessment") {
            const assessment = parseBusinessChangeAssessment(value);
            if (assessment) {
              rendered = [
                `Expected workflow change: ${assessment.expectedWorkflowChange}`,
                `Expected role/accountability change: ${assessment.expectedRoleAccountabilityChange}`,
                `Adoption owner: ${assessment.adoptionOwner}`,
                `Adoption responsibility: ${assessment.adoptionResponsibility}`,
                `Evidence reference: ${assessment.evidenceReference}`,
                `Validated by: ${assessment.validatedBy}`,
              ].join("\n");
            }
          }
          if (key === "solution_route_validation") {
            const validation = parseSolutionRouteValidation(value);
            if (validation) {
              rendered = [
                `Confirmed route: ${validation.selectedRoute}`,
                `System recommendation: ${validation.decision === "confirm" ? validation.selectedRoute : "corrected by reviewer"}`,
                `Output: ${validation.solutionOutput}`,
                `Workflow impact: ${validation.workflowChange}`,
                `Role/accountability impact: ${validation.roleAccountabilityChange}`,
                `Approved evidence reference: ${validation.evidenceReference}`,
                `Validated by: ${validation.validatedBy}`,
                validation.correctionRationale
                  ? `Correction rationale: ${validation.correctionRationale}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n");
              approvalNotes.push(
                `P${mod.phaseNumber} human-validated solution route: ${validation.selectedRoute}; evidence ${validation.evidenceReference}; reviewer ${validation.validatedBy}${validation.correctionRationale ? `; rationale: ${validation.correctionRationale}` : ""}.`,
              );
            }
          }
          const renderedSection = `## ${heading}\n${rendered}`;
          if (isCurrentPhase) parts.push(renderedSection);
          else
            priorParts.push(
              `## P${mod.phaseNumber} approved capture: ${heading}\n${rendered}`,
            );
        }
        if (parts.length === 0 && priorParts.length === 0) return null;
        const digest: PhaseDigest = {
          currentState: [...priorParts, ...parts].join("\n\n"),
          ...(approvalNotes.length
            ? { humanApprovalNotes: approvalNotes }
            : {}),
        };
        const baseline =
          currentByKey.get("baseline_metrics") ??
          priorByKey.get("baseline_metrics");
        if (baseline) {
          const metrics = factsToBaselineMetrics(parseDiagnosisFacts(baseline));
          digest.baselineMetrics = Object.keys(metrics).length
            ? metrics
            : { [`Operator-attested baseline (P${phase} capture)`]: baseline };
        }
        const gaps =
          currentByKey.get("gaps_root_causes") ??
          priorByKey.get("gaps_root_causes");
        if (gaps) {
          digest.gaps = [gaps];
          digest.rootCauses = [gaps];
        }
        const recommendation = currentByKey.get("recommendation");
        if (recommendation) {
          digest.humanApprovalNotes = [
            ...(digest.humanApprovalNotes ?? []),
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
        // Short-circuit before the snapshot read, as this reader always has:
        // a Move whose array already names the phase needs no second record.
        if (gatesPassedContainsPhase(gatesPassed, phase)) return true;
        if (typeof getPhaseSnapshots !== "function") return false;
        const snapshots = await getPhaseSnapshots(ctx, moveId, phase).catch(
          () => [],
        );
        return isGateApprovedForPhase({ gatesPassed, snapshots }, phase);
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
        model: deliverableModel(),
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
