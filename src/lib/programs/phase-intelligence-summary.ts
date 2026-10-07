import "server-only";

import { getDecisionThreadDossier, getThreadForArtifact } from "@/lib/decisions/auto-linker";
import { resolveFunctionPack } from "@/lib/programs/expert-kernel/domain/function-pack-registry";
import { resolvePhaseIntelligenceFunctionBinding } from "@/lib/programs/phase-intelligence-function-binding";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { buildGateCriteria } from "@/lib/programs/transformers";
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
  move: StrategicMoveForPhaseIntelligence | null,
): Promise<PhaseIntelligenceItem> {
  const resolved = move ? resolvePhaseIntelligenceFunctionBinding(move) : null;

  // A Move that DECLARED an archetype is reported as declared. Function Pack
  // keys are a different id space, so there is no pack to guess for it, and a
  // best-scoring healthcare pack would describe a different kind of work.
  if (resolved?.kind === "declared_archetype") {
    return {
      id: "strategic_signal",
      eyebrow: "Strategic signal",
      title: `This Move is declared ${resolved.archetypeName}.`,
      body:
        "No curated industry/function pack covers this declared archetype, so Nexus is not showing a function-specific value or pain signal. The declared archetype — not a keyword guess over this Move's text — is what drives its discovery blueprint and evidence requirements.",
      sourceLabel: "Declared archetype",
      tone: "default",
      facts: [
        `Declared archetype: ${resolved.archetypeId}`,
        `Industry code: ${move?.tenant.industryCode ?? "not set"}`,
        "Function pack: none bound (archetype ids and function pack keys are separate)",
      ],
    };
  }

  const binding = resolved?.kind === "bound" ? resolved : null;
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
  move: StrategicMoveForPhaseIntelligence | null,
): Promise<PhaseIntelligenceItem> {
  try {
    const [gateCriteria, readiness] = await Promise.all([
      move && (move.currentPhase ?? 0) === phase
        ? Promise.resolve(move.gateCriteria)
        : buildGateCriteria(ctx, moveId, phase, {
            allowHistoricalPhase: Boolean(
              move && phase < (move.currentPhase ?? 0),
            ),
          }),
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
  const [decision, move] = await Promise.all([
    buildDecisionItem(ctx, input.moveId),
    getStrategicMoveById(ctx, input.moveId),
  ]);
  const [strategicSignal, gateEvidence] = await Promise.all([
    buildStrategicSignalItem(move),
    buildGateEvidenceItem(ctx, input.moveId, input.phase, move),
  ]);

  return {
    ok: true,
    moveId: input.moveId,
    phase: input.phase,
    generatedAt: new Date().toISOString(),
    items: [decision, strategicSignal, gateEvidence],
  };
}
