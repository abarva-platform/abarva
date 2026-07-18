import "server-only";

import { getDecisionThreadDossier, getThreadForArtifact } from "@/lib/decisions/auto-linker";
import { resolveFunctionPack } from "@/lib/programs/expert-kernel/domain/function-pack-registry";
import {
  classifyFunctionKey,
  industryKeyForCode,
  resolveMoveFunctionIdentity,
} from "@/lib/programs/function-identity";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { buildGateCriteria } from "@/lib/programs/transformers";
import type { MoveFunctionIdentity } from "@/lib/programs/function-identity";
import type { TenancyCtx } from "@/lib/programs/types.db";

type StrategicMoveForPhaseIntelligence = NonNullable<
  Awaited<ReturnType<typeof getStrategicMoveById>>
>;

export type PhaseIntelligenceItemTone = "default" | "success" | "warning" | "danger";

export interface PhaseIntelligenceItem {
  id: "decision" | "strategic_signal" | "gate_evidence";
  eyebrow: string;
  title: string;
  body: string;
  sourceLabel: string;
  tone: PhaseIntelligenceItemTone;
  href?: string;
  hrefLabel?: string;
  facts: string[];
}

export interface PhaseIntelligenceSummary {
  ok: true;
  moveId: string;
  phase: number;
  generatedAt: string;
  items: PhaseIntelligenceItem[];
}

function compact(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function formatRange(low: number, high: number, unit: string): string {
  if (unit === "%") return `${low}-${high}%`;
  return `${low}-${high} ${unit}`;
}

function safeCharterText(charter: unknown): string {
  if (!charter || typeof charter !== "object") return "";
  try {
    return JSON.stringify(charter);
  } catch {
    return "";
  }
}

function buildMoveFunctionBriefText(move: StrategicMoveForPhaseIntelligence): string {
  return [
    move.displayCode,
    move.name,
    move.archetype,
    move.phaseLabel,
    move.status.text,
    move.status.description,
    move.tenant.name,
    move.tenant.industryCode,
    safeCharterText(move.charter),
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");
}

function resolveKnownLegacyFunctionAlias(
  industryKey: MoveFunctionIdentity["industryKey"],
  briefText: string,
): { functionKey: string; confidence: number } | null {
  const normalized = briefText.toLowerCase();
  if (industryKey !== "healthcare-provider") return null;

  const namesAgentAssist =
    /\b(agent|member|contact|call|service)\b/.test(normalized) &&
    /\b(ai|assist|assistant|augmentation|copilot)\b/.test(normalized);
  const namesMemberService =
    /\b(member|contact|call)\b/.test(normalized) &&
    /\b(service|center|centre|experience)\b/.test(normalized);
  if (namesAgentAssist || namesMemberService) {
    return { functionKey: "member_service_agent_assist", confidence: 0.95 };
  }

  return null;
}

function resolvePhaseIntelligenceFunctionIdentity(
  move: StrategicMoveForPhaseIntelligence,
): {
  identity: MoveFunctionIdentity;
  source: string;
  confidence: number | null;
} | null {
  const storedIdentity = resolveMoveFunctionIdentity({
    industryCode: move.tenant.industryCode,
    functionPackKey: move.functionPackKey,
    charter: move.charter,
  });
  if (storedIdentity) {
    return {
      identity: storedIdentity,
      source: "persisted functionPackKey",
      confidence: null,
    };
  }

  const industryKey = industryKeyForCode(move.tenant.industryCode);
  if (!industryKey) return null;

  const briefText = buildMoveFunctionBriefText(move);
  const classified =
    classifyFunctionKey(industryKey, briefText) ??
    resolveKnownLegacyFunctionAlias(industryKey, briefText);
  if (!classified) return null;

  return {
    identity: { industryKey, functionKey: classified.functionKey },
    source: "deterministic classifier fallback",
    confidence: classified.confidence,
  };
}

async function buildDecisionItem(
  ctx: TenancyCtx,
  moveId: string,
): Promise<PhaseIntelligenceItem> {
  try {
    const thread = await getThreadForArtifact("moves", moveId, ctx.clientId);
    if (!thread) {
      return {
        id: "decision",
        eyebrow: "Key design decision",
        title: "No decision record captured yet.",
        body:
          "Record a KDD when the team chooses between material options. Until then, this phase has no selected/rejected option history to summarize.",
        sourceLabel: "Decision thread",
        tone: "warning",
        facts: ["No moves decision thread is linked to this Move yet."],
      };
    }

    const dossier = await getDecisionThreadDossier(thread.id);
    const selected = dossier?.options.find((option) => option.is_selected) ?? null;
    if (!selected) {
      return {
        id: "decision",
        eyebrow: "Key design decision",
        title: thread.title,
        body:
          "A decision thread exists, but no selected option has been recorded yet. Use the KDD action when the team commits to a path.",
        sourceLabel: "Decision thread",
        tone: "warning",
        href: `/dossier/${thread.id}`,
        hrefLabel: "See full decision record",
        facts: [
          `${dossier?.options.length ?? 0} alternatives captured`,
          `Thread status: ${thread.status}`,
        ],
      };
    }

    return {
      id: "decision",
      eyebrow: "Key design decision",
      title: selected.label,
      body: compact(
        selected.rationale_for,
        "Selected option is recorded. Add a one-line rationale so the next phase understands why it won.",
      ),
      sourceLabel: "Decision thread",
      tone: "success",
      href: `/dossier/${thread.id}`,
      hrefLabel: "See full decision record",
      facts: [
        `${dossier?.options.length ?? 0} alternatives captured`,
        `Rejected options: ${Math.max((dossier?.options.length ?? 1) - 1, 0)}`,
      ],
    };
  } catch (error) {
    return {
      id: "decision",
      eyebrow: "Key design decision",
      title: "Decision record unavailable.",
      body:
        "The KDD read failed, so this panel is not claiming a selected option. The full dossier remains the authority.",
      sourceLabel: "Decision thread",
      tone: "warning",
      facts: [error instanceof Error ? error.message : "Decision read failed"],
    };
  }
}

async function buildStrategicSignalItem(
  ctx: TenancyCtx,
  moveId: string,
): Promise<PhaseIntelligenceItem> {
  const move = await getStrategicMoveById(ctx, moveId);
  const binding = move ? resolvePhaseIntelligenceFunctionIdentity(move) : null;
  const pack = binding
    ? resolveFunctionPack(binding.identity.industryKey, binding.identity.functionKey)
    : null;

  if (!move || !binding || !pack) {
    return {
      id: "strategic_signal",
      eyebrow: "Strategic signal",
      title: "No curated function pack is bound yet.",
      body:
        "Nexus cannot show a function-specific value or pain signal until this Move resolves to a curated industry/function pack.",
      sourceLabel: "Function Pack",
      tone: "warning",
      facts: [
        `Industry code: ${move?.tenant.industryCode ?? "not set"}`,
        `Function key: ${move?.functionPackKey ?? "not set"}`,
      ],
    };
  }

  const benchmark = pack.valueModel.valueBenchmarks[0];
  if (benchmark) {
    return {
      id: "strategic_signal",
      eyebrow: "Strategic signal",
      title: benchmark.lever,
      body: `${formatRange(
        benchmark.range.low,
        benchmark.range.high,
        benchmark.measuredAs.toLowerCase().includes("percentage-point") ? "pts" : "%",
      )} is a labeled planning range, not a committed target. ${benchmark.range.basis}`,
      sourceLabel: `${pack.functionLabel} Function Pack`,
      tone: "default",
      facts: [
        `Function key: ${binding.identity.functionKey}`,
        binding.confidence == null
          ? `Binding source: ${binding.source}`
          : `Binding source: ${binding.source} (${binding.confidence})`,
        `Measured as: ${benchmark.measuredAs}`,
        `Time to value: ${pack.valueModel.timeToValueBand}`,
      ],
    };
  }

  const painTheme = pack.painThemes[0];
  return {
    id: "strategic_signal",
    eyebrow: "Strategic signal",
    title: painTheme?.name ?? pack.functionLabel,
    body:
      painTheme?.diagnosticQuestion ??
      "The bound Function Pack is available, but no value benchmark is catalogued yet.",
    sourceLabel: `${pack.functionLabel} Function Pack`,
    tone: "default",
    facts: painTheme
      ? [
          `Function key: ${binding.identity.functionKey}`,
          binding.confidence == null
            ? `Binding source: ${binding.source}`
            : `Binding source: ${binding.source} (${binding.confidence})`,
          `Detection signal: ${painTheme.detectionSignal}`,
        ]
      : [
          `Function key: ${String(pack.functionKey)}`,
          binding.confidence == null
            ? `Binding source: ${binding.source}`
            : `Binding source: ${binding.source} (${binding.confidence})`,
        ],
  };
}

async function buildGateEvidenceItem(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
): Promise<PhaseIntelligenceItem> {
  try {
    const [move, gateCriteria, readiness] = await Promise.all([
      getStrategicMoveById(ctx, moveId),
      buildGateCriteria(ctx, moveId, phase),
      loadDiscoveryEvidenceReadiness(ctx, moveId),
    ]);
    const packets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move?.name ?? "Strategic Move",
      currentPhase: phase,
      readiness,
    });
    const hardOpen = gateCriteria.filter(
      (criterion) => criterion.severity === "hard" && !criterion.completed,
    );
    const hardMet = gateCriteria.filter(
      (criterion) => criterion.severity === "hard" && criterion.completed,
    );
    const requiredMissing = packets.filter(
      (packet) => packet.priority === "required" && packet.status !== "covered",
    );
    const requiredCovered = packets.filter(
      (packet) => packet.priority === "required" && packet.status === "covered",
    );

    const title =
      hardOpen.length === 0 && requiredMissing.length === 0
        ? "Gate and required evidence are clear."
        : `${hardOpen.length} hard gate${hardOpen.length === 1 ? "" : "s"} open; ${requiredMissing.length} required evidence gap${requiredMissing.length === 1 ? "" : "s"}.`;

    return {
      id: "gate_evidence",
      eyebrow: "Gate and evidence truth",
      title,
      body:
        requiredMissing[0]?.nextAction ??
        hardOpen[0]?.label ??
        "Approve & Build can use the same governed gate/evidence state shown in this workspace and aVa chat.",
      sourceLabel: "Governance + evidence readiness",
      tone: hardOpen.length > 0 ? "danger" : requiredMissing.length > 0 ? "warning" : "success",
      facts: [
        `${hardMet.length}/${hardMet.length + hardOpen.length} hard gates met`,
        `${requiredCovered.length}/${requiredCovered.length + requiredMissing.length} required evidence families covered`,
        `Readiness score: ${readiness.readinessScore}%`,
      ],
    };
  } catch (error) {
    return {
      id: "gate_evidence",
      eyebrow: "Gate and evidence truth",
      title: "Gate/evidence state unavailable.",
      body:
        "The canonical gate/evidence read failed, so this panel is not guessing readiness. Use the Approve & Build page as the current authority.",
      sourceLabel: "Governance + evidence readiness",
      tone: "warning",
      facts: [error instanceof Error ? error.message : "Gate/evidence read failed"],
    };
  }
}

export async function buildPhaseIntelligenceSummary(
  ctx: TenancyCtx,
  input: { moveId: string; phase: number },
): Promise<PhaseIntelligenceSummary> {
  const [decision, strategicSignal, gateEvidence] = await Promise.all([
    buildDecisionItem(ctx, input.moveId),
    buildStrategicSignalItem(ctx, input.moveId),
    buildGateEvidenceItem(ctx, input.moveId, input.phase),
  ]);

  return {
    ok: true,
    moveId: input.moveId,
    phase: input.phase,
    generatedAt: new Date().toISOString(),
    items: [decision, strategicSignal, gateEvidence],
  };
}
