import "server-only";

import { getDecisionThreadDossier, getThreadForArtifact } from "@/lib/decisions/auto-linker";
import { resolveFunctionPack } from "@/lib/programs/expert-kernel/domain/function-pack-registry";
import { resolveMoveFunctionIdentity } from "@/lib/programs/function-identity";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { buildGateCriteria } from "@/lib/programs/transformers";
import type { TenancyCtx } from "@/lib/programs/types.db";

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
  const identity = move
    ? resolveMoveFunctionIdentity({
        industryCode: move.tenant.industryCode,
        functionPackKey: move.functionPackKey,
        charter: move.charter,
      })
    : null;
  const pack = identity ? resolveFunctionPack(identity.industryKey, identity.functionKey) : null;

  if (!move || !identity || !pack) {
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
      ? [`Detection signal: ${painTheme.detectionSignal}`]
      : [`Function key: ${String(pack.functionKey)}`],
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
