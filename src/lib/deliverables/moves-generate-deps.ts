import "server-only";

import { streamAgentTurn } from "@/lib/agent/stream";
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
import {
  buildProgramsContextBundleAsync,
  formatProgramsBrokerBundleForPrompt,
} from "@/lib/programs/programs-broker-adapter";
import type {
  PhaseDigest,
  SolutionDecision,
} from "@/lib/programs/solution-context";

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
  return Math.max(
    Number.isFinite(envTokens) ? envTokens : 0,
    requestedTokens,
  );
}

export function createMovesGenerateArtifactDeps(
  ctx: TenancyCtx,
): GenerateArtifactDeps {
  return {
    contextSources: {
      async retrieveCurrentState(tenantKey, _query, moveId) {
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
        const evidenceBlock = moveId
          ? await listProgramEvidenceForPrompt(ctx, moveId, 20)
              .then(formatProgramEvidenceForPrompt)
              .catch(() => "")
          : "";
        return [promptBlock, evidenceBlock].filter(Boolean).join("\n\n");
      },
      async loadPriorDigests(moveId) {
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
            "ORDER BY d.created_at ASC, dv.version ASC",
          [moveId],
          { missingTable: "empty" },
        );
        return rows
          .map((row) => structuredDigest(row.structured_data))
          .filter((digest): digest is PhaseDigest => digest !== null);
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
