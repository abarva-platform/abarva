import type { Artifact } from "@/lib/agent/artifacts";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerTable,
  AvaArtifact,
  AvaCitation,
  AvaMetricRef,
  AvaNextStep,
} from "@/lib/ava-answer/contract";
import { isDeferralOnlyAnswer } from "@/lib/programs/deferral-only-answer";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { NextPhaseReadinessPack } from "@/lib/programs/phase-templates/next-phase-readiness-pack";
import type { StrategicMove } from "@/lib/programs/types.ui";

interface MovesChatPhaseSummary {
  phase: number;
  code: string;
  title: string;
}

interface BuildMovesChatAvaAnswerPacketInput {
  move: Pick<StrategicMove, "tenant" | "name" | "displayCode">;
  phase: MovesChatPhaseSummary;
  question: string;
  visibleText: string;
  phaseTallies: PhaseTallyRow[];
  readinessPack: NextPhaseReadinessPack;
  streamArtifacts?: Artifact[];
}

function pct(met: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((met / total) * 100);
}

function stateLabel(state: PhaseTallyRow["state"]): string {
  if (state === "done") return "Approved";
  if (state === "current") return "Current";
  return "Upcoming";
}

function buildReadinessRows(phaseTallies: PhaseTallyRow[]) {
  return phaseTallies.map((row) => ({
    phase: row.label,
    status: stateLabel(row.state),
    met: row.met,
    total: row.total,
    remaining: Math.max(row.total - row.met, 0),
    readinessPct: pct(row.met, row.total),
  }));
}

function buildPhaseTallyTable(
  rows: ReturnType<typeof buildReadinessRows>,
): AnswerTable {
  return {
    id: "moves_phase_gate_tallies",
    title: "Phase readiness scorecard",
    columns: [
      { key: "phase", label: "Phase", format: "text" },
      { key: "status", label: "Status", format: "text" },
      { key: "met", label: "Met", format: "number", align: "right" },
      { key: "total", label: "Total", format: "number", align: "right" },
      {
        key: "remaining",
        label: "Open",
        format: "number",
        align: "right",
      },
    ],
    rows,
    note: "Derived from the same hard-readiness criteria used by the phase rail.",
    citationIds: ["moves-phase-readiness"],
  };
}

function buildNextReadinessTable(
  readinessPack: NextPhaseReadinessPack,
): AnswerTable | null {
  if (readinessPack.openNeeds.length === 0) return null;
  return {
    id: "moves_next_phase_evidence_needs",
    title: `${readinessPack.nextPhaseLabel} preparation needs`,
    columns: [
      { key: "need", label: "Need", format: "text" },
      { key: "priority", label: "Priority", format: "text" },
      { key: "status", label: "Status", format: "text" },
      { key: "nextAction", label: "Next action", format: "text" },
    ],
    rows: readinessPack.openNeeds.slice(0, 6).map((need) => ({
      need: need.evidenceSlot,
      priority: need.priority,
      status: need.status,
      nextAction: need.nextAction,
    })),
    note: "Only open needs already present in the move evidence-readiness inputs are shown.",
    citationIds: ["moves-next-phase-readiness"],
  };
}

function buildStreamArtifactTable(artifacts: Artifact[]): AnswerTable | null {
  if (artifacts.length === 0) return null;
  return {
    id: "moves_streamed_structured_highlights",
    title: "Structured highlights captured from aVa",
    columns: [
      { key: "kind", label: "Kind", format: "text" },
      { key: "summary", label: "Summary", format: "text" },
    ],
    rows: artifacts.slice(0, 6).map((artifact) => ({
      kind: artifactTypeLabel(artifact.type),
      summary: artifactSummary(artifact),
    })),
    note: "Parsed from the response stream and rendered as structured UI.",
  };
}

function artifactTypeLabel(type: Artifact["type"]): string {
  return type
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function artifactSummary(artifact: Artifact): string {
  if ("label" in artifact && typeof artifact.label === "string") {
    return artifact.label;
  }
  if ("title" in artifact && typeof artifact.title === "string") {
    return artifact.title;
  }
  if (
    "recommendation" in artifact &&
    typeof artifact.recommendation === "string"
  ) {
    return artifact.recommendation;
  }
  if ("detail" in artifact && typeof artifact.detail === "string") {
    return artifact.detail;
  }
  return "Captured as structured response context.";
}

export function buildMovesChatAvaAnswerPacket({
  move,
  phase,
  question,
  visibleText,
  phaseTallies,
  readinessPack,
  streamArtifacts = [],
}: BuildMovesChatAvaAnswerPacketInput) {
  const directAnswer = visibleText.trim();
  if (!directAnswer) return null;

  // An answer that only promises work must not be dressed as work.
  //
  // Everything below — the readiness chart, the tally and preparation tables,
  // the two citations, the metrics, the next steps — is context this builder
  // attaches to every answer on this surface. That is fine on a real answer
  // and actively misleading on a deferral: a reader sees dense, sourced-looking
  // furniture and concludes the thing they asked for was done.
  //
  // Observed live: asked to draft the phase inputs with citations, aVa replied
  // with one sentence promising to start, and it rendered as a full readiness
  // scorecard with two citations attached. Nothing had been drafted.
  //
  // So say plainly that nothing was produced, and attach none of the evidence
  // furniture to that claim.
  if (isDeferralOnlyAnswer(directAnswer)) {
    return composeAvaAnswer({
      surface: "moves",
      mode: "ANALYZE",
      tenantKey: move.tenant.id || move.tenant.name,
      question,
      intent: "moves_phase_readiness_chat",
      // "no_data" rather than "partial": a deferral produced nothing at all,
      // and calling it partial would imply some of the work landed.
      status: "no_data",
      directAnswer,
      interpretation:
        "aVa described what it was about to do but did not return a result. Nothing here has been drafted or checked.",
      businessImplication:
        "Treat this as no answer. Do not read the absence of findings as an absence of problems.",
      recommendation: "Ask again, or narrow the request to a single field.",
      artifacts: [],
      citations: [],
      metricsUsed: [],
      caveats: [
        {
          id: "moves-incomplete-answer",
          label: "No result returned",
          detail:
            "The response stopped at an intention. Readiness context is withheld so it cannot be mistaken for the requested work.",
        },
      ],
      nextSteps: [],
      retrievalSummary: {
        substrate: "module_read_model",
        hasTenantFacts: false,
        factCount: 0,
        metricCount: 0,
        relationshipCount: 0,
        sourceCount: 0,
      },
    });
  }

  const readinessRows = buildReadinessRows(phaseTallies);
  const currentRow = readinessRows.find(
    (row) =>
      row.phase === `P${phase.phase}` ||
      row.phase.startsWith(`P${phase.phase}`),
  );
  const openNeeds = readinessPack.openNeeds.length;
  const readinessChart = {
    artifact: "chart" as const,
    id: "moves_gate_readiness_by_phase",
    kind: "horizontal-bar" as const,
    title: "Gate readiness by phase",
    subtitle:
      "Met criteria by phase, using the same deterministic tallies as the Moves rail.",
    data: {
      data: readinessRows,
      xKey: "phase",
      yKey: "readinessPct",
      unit: "%",
    },
    xKey: "phase",
    yKey: "readinessPct",
    unit: "%",
    sourceNote:
      "Derived from phase readiness criteria and next-phase evidence needs for this Move.",
    citationIds: ["moves-phase-readiness"],
  };
  const tables: AnswerTable[] = [
    buildPhaseTallyTable(readinessRows),
    buildNextReadinessTable(readinessPack),
    buildStreamArtifactTable(streamArtifacts),
  ].filter((table): table is AnswerTable => table !== null);

  const artifacts: AvaArtifact[] = [
    readinessChart,
    ...tables.map((table) => ({ ...table, artifact: "table" as const })),
  ];
  const citations: AvaCitation[] = [
    {
      id: "moves-phase-readiness",
      label: "Moves phase readiness",
      sourceClass: "tenant-fact",
      excerpt:
        "Phase criteria, current phase state, and completion tallies from the active Move workspace.",
      confidence: "high",
    },
    {
      id: "moves-next-phase-readiness",
      label: "Next-phase readiness",
      sourceClass: "tenant-fact",
      excerpt:
        "Open preparation needs filtered from the move evidence-readiness inputs.",
      confidence: "high",
    },
  ];
  const metricsUsed: AvaMetricRef[] = [
    {
      id: "moves_current_phase_open_criteria",
      label: "Current phase open criteria",
      value: currentRow?.remaining ?? 0,
      citationIds: ["moves-phase-readiness"],
    },
    {
      id: "moves_next_phase_open_needs",
      label: "Next phase open preparation needs",
      value: openNeeds,
      citationIds: ["moves-next-phase-readiness"],
    },
  ];
  const nextSteps: AvaNextStep[] = readinessPack.openNeeds
    .slice(0, 3)
    .map((need, index) => ({
      id: `moves_next_need_${index + 1}`,
      label: need.nextAction,
      rationale: need.whyItMatters,
      targetSurface: "moves",
    }));

  return composeAvaAnswer({
    surface: "moves",
    mode: "ANALYZE",
    tenantKey: move.tenant.id || move.tenant.name,
    question,
    intent: "moves_phase_readiness_chat",
    status: "answered",
    directAnswer,
    interpretation: `${phase.code} ${phase.title} is shown with the same readiness counts and next-step evidence needs visible in the workspace.`,
    businessImplication:
      "Use the chart to separate completed phases from current decision work, then use the preparation table to decide what evidence must be gathered before the next phase starts.",
    recommendation:
      openNeeds > 0
        ? "Resolve the highest-priority preparation needs before treating the next phase as ready."
        : "Use the current phase decision work as the primary checkpoint before advancing.",
    artifacts,
    citations,
    metricsUsed,
    caveats: [
      {
        id: "moves-planning-boundary",
        label: "Planning boundary",
        detail:
          "This view supports phase planning and does not assert realized value, ROI, or savings.",
      },
    ],
    nextSteps,
    retrievalSummary: {
      substrate: "module_read_model",
      hasTenantFacts: true,
      factCount: phaseTallies.length + readinessPack.openNeeds.length,
      metricCount: metricsUsed.length,
      relationshipCount: 0,
      sourceCount: citations.length,
    },
  });
}
