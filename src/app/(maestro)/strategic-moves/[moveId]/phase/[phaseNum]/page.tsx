import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { MovesPhaseStandaloneClient } from "@/components/strategic-moves/MovesPhaseStandaloneClient";
import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "@/lib/programs/strategic-move-route-params";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  buildMoveEvidenceNeedPackets,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getMovePhaseTallies } from "@/lib/programs/phase-explorer-tallies";
import { getGateArtifacts } from "@/lib/programs/deliverable-registry";
import {
  readDeliverableContentSignals,
  type DeliverableContentSignal,
} from "@/lib/deliverables/deliverable-content-signals";
import { AppShell } from "@/components/shell/AppShell";
import type { StageId } from "@/lib/shell/atlas-page-state";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
  type ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string; phaseNum: string }>;
  searchParams?: Promise<{ focus?: string | string[] }>;
}

export default async function StrategicMovePhaseWorkspacePage({
  params,
  searchParams,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect("/sign-in");
  }

  const { moveId, phaseNum } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const parsedPhase = parseStrategicMovePhaseNum(phaseNum);
  if (parsedPhase === null) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const pricingEngineEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_pricing_engine",
  );
  const riskAssessmentEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_risk_tier_scoring_v1",
  );
  const solutionPatternGateEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_solution_pattern_gate_v1",
  );

  // State reconciliation: current_phase is the single source of truth for where
  // the Move actually is. A user must not work a phase ahead of it (e.g. open
  // /phase/1 while P0 is still awaiting the brief approval), or the workspace
  // would contradict the Overview/Documents/File Cabinet. Redirect forward-
  // looking requests back to the true current phase.
  const currentPhase = move.currentPhase ?? 0;
  if (parsedPhase > currentPhase) {
    // Carry the reason as a query param — a silent redirect here reads as a
    // broken link (bookmarked/shared URLs to a future phase would otherwise
    // land the user somewhere else with zero explanation). StrategicMove-
    // PhaseClient reads this to show a one-time dismissible banner.
    redirect(
      `/strategic-moves/${moveId}/phase/${currentPhase}?phaseLocked=${parsedPhase}`,
    );
  }

  let evidenceNeedPackets: MoveEvidenceNeedPacket[] = [];
  try {
    const tctx = await requireTenancy();
    const evidenceReadiness = await loadDiscoveryEvidenceReadiness(
      tctx,
      moveId,
    );
    evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move.name,
      currentPhase: parsedPhase,
      readiness: evidenceReadiness,
    });
  } catch {
    evidenceNeedPackets = [];
  }

  // Real "carries forward" content — extracted from the current phase's own
  // already-generated gate deliverable(s), not fabricated. A phase whose gate
  // artifact hasn't been generated yet (or whose content has no matching
  // heading/table) simply yields no signals; the readiness pack renders that
  // honestly rather than inventing a punch list.
  let carriesForwardContent: DeliverableContentSignal[] = [];
  try {
    const gateArtifactTypeKeys = getGateArtifacts(parsedPhase).map(
      (d) => d.deliverableTypeKey,
    );
    const signalsByKey = new Map<string, DeliverableContentSignal>();
    for (const typeKey of gateArtifactTypeKeys) {
      const signals = await readDeliverableContentSignals(moveId, typeKey);
      for (const signal of signals) {
        if (!signalsByKey.has(signal.key)) signalsByKey.set(signal.key, signal);
      }
    }
    carriesForwardContent = Array.from(signalsByKey.values());
  } catch {
    carriesForwardContent = [];
  }

  let currentStateReadiness: ReadinessReport | null = null;
  try {
    const tctx = await requireTenancy();
    const archetype = await resolveMoveArchetypeForProgram(tctx, moveId);
    const profile = await inferMoveProfile(tctx);
    currentStateReadiness = await resolveCurrentStateReadiness(
      tctx,
      archetype,
      profile,
      parsedPhase,
      moveId,
    );
  } catch {
    currentStateReadiness = null;
  }

  return (
    <AppShell
      surface="programs-detail"
      stage={`P${parsedPhase}` as StageId}
      hasTenantKey
      surfaceContext={{
        moveId: move.id,
        moveName: move.name,
        phase: parsedPhase,
        currentPhase,
      }}
    >
      <MovesPhaseStandaloneClient
        carriesForwardContent={carriesForwardContent}
        currentStateReadiness={currentStateReadiness}
        currentUser={{
          email: ctx.email ?? null,
          role: ctx.tenantRole ?? ctx.role ?? null,
        }}
        evidenceNeedPackets={evidenceNeedPackets}
        initialSubstepKey={
          parsedPhase === 0 && resolvedSearchParams.focus === "gate"
            ? "approve"
            : undefined
        }
        move={move}
        phaseNum={parsedPhase}
        phaseTallies={getMovePhaseTallies(move)}
        pricingEngineEnabled={pricingEngineEnabled}
        riskAssessmentEnabled={riskAssessmentEnabled}
        solutionPatternGateEnabled={solutionPatternGateEnabled}
      />
    </AppShell>
  );
}
