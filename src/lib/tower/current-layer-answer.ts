import crypto from "node:crypto";

import { formatCioTowerMoney } from "@/lib/tower/metric-packet";
import { VISIBLE_ANSWER_CONTRACT_VERSION } from "@/lib/agent/visible-answer-contract";
import type {
  CioTowerAnswerResult,
  CioTowerVisibleAnswerContract,
  CioTowerVisibleContextCriteria,
  CioTowerVisibleTable,
} from "@/lib/tower/current-layer-answer-contract";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";

export interface CurrentTowerAnswerArgs {
  tenantId: string;
  userId?: string | null;
  tenantKey: string;
  tenantName: string;
  question: string;
  visibleContextCriteria?: CioTowerVisibleContextCriteria;
}

type CurrentTowerIntent =
  | "value"
  | "ai"
  | "decision"
  | "evidence"
  | "budget"
  | "portfolio";

function stableHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function traceKey(prefix: string, parts: readonly string[]): string {
  return `${prefix}_${stableHash(parts.join("|")).slice(0, 24)}`;
}

function intentFor(question: string): CurrentTowerIntent {
  const normalized = question.toLowerCase();
  if (/\b(value|claim|claimable|proof|validated|attestation|outcome)\b/.test(normalized)) {
    return "value";
  }
  if (/\b(ai|copilot|claude|agent|usage|adoption|seat|tool)\b/.test(normalized)) {
    return "ai";
  }
  if (/\b(decision|scale|fix|freeze|stop|fund|priority|action|next)\b/.test(normalized)) {
    return "decision";
  }
  if (/\b(evidence|lineage|source|provenance|quality|gap|missing)\b/.test(normalized)) {
    return "evidence";
  }
  if (/\b(budget|spend|cost|run|change|financial)\b/.test(normalized)) {
    return "budget";
  }
  return "portfolio";
}

function table(
  id: string,
  title: string,
  columns: string[],
  rows: string[][],
): CioTowerVisibleTable {
  return { id, title, columns, rows };
}

function tableToGfm(t: CioTowerVisibleTable): string {
  if (t.rows.length === 0) return "";
  const header = `| ${t.columns.join(" | ")} |`;
  const sep = `| ${t.columns.map(() => "---").join(" | ")} |`;
  const rows = t.rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `**${t.title}**\n\n${header}\n${sep}\n${rows}`;
}

function compactText(value: string | null | undefined, fallback = "Not loaded"): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 120 ? `${trimmed.slice(0, 117).trimEnd()}...` : trimmed;
}

function answerFromIntent(
  args: CurrentTowerAnswerArgs,
  intent: CurrentTowerIntent,
  view: Awaited<ReturnType<typeof readTowerCommandCenter>>,
): { answer: string; tables: CioTowerVisibleTable[]; metricCards: Array<{ label: string; value: string }>; gaps: string[] } {
  if (!view) {
    return {
      answer:
        "Tower does not have a current governed Tower read-model loaded for this tenant. I am not falling back to retired V6, V7, or CIO Tower layers.",
      tables: [],
      metricCards: [],
      gaps: ["Current tower.* read model not loaded for the active tenant."],
    };
  }

  const command = view.command;
  const metricCards = [
    { label: "Technology budget", value: formatCioTowerMoney(command.totalItBudgetFy26) },
    { label: "AI-tagged spend", value: formatCioTowerMoney(command.aiTaggedSpendFy26NonAdditive) },
    { label: "Value claims", value: String(command.valueClaimCount ?? view.valueFunnel[0]?.conversionRatio ?? 0) },
    { label: "Claimable value", value: formatCioTowerMoney(command.realizedValueYtdAllowed) },
  ];

  if (intent === "value") {
    const funnel = table(
      "tower_value_funnel",
      "Current Tower Value Funnel",
      ["Stage", "Value", "Conversion", "Caveat"],
      view.valueFunnel.slice(0, 6).map((stage) => [
        stage.stageLabel,
        formatCioTowerMoney(stage.valueNumeric),
        stage.conversionRatio === null ? "n/a" : `${Math.round(stage.conversionRatio * 100)}%`,
        compactText(stage.caveat),
      ]),
    );
    return {
      answer: `${args.tenantName} has ${command.valueClaimCount ?? 0} governed Tower value claims in the current layer. Claimable value remains ${formatCioTowerMoney(command.realizedValueYtdAllowed)} because Tower requires linked baseline, target, actual, and attestation evidence before a claim can move into the claimable state.`,
      tables: [funnel],
      metricCards,
      gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
    };
  }

  if (intent === "ai") {
    const ai = table(
      "tower_ai_portfolio",
      "AI Usage And Value Evidence",
      ["Tool / agent", "Usage", "Spend", "Gate"],
      view.aiPortfolio.slice(0, 5).map((item) => [
        item.itemName,
        item.usageActual === null ? "Not loaded" : `${item.usageActual} ${item.usageMetric ?? ""}`.trim(),
        formatCioTowerMoney(item.aiTaggedSpendUsd),
        item.valueClaimStatus,
      ]),
    );
    return {
      answer: `${args.tenantName} can show AI adoption and estimated use cost from the current Tower layer, but productivity improvement is not established until before/after engineering, service, HR, or finance outcome metrics are linked and attested. Tower should treat Copilot, Claude Code, and workflow-agent rows as usage evidence first, not value proof.`,
      tables: [ai],
      metricCards,
      gaps: [
        "Before/after productivity or service outcome baseline.",
        "Finance-attested calculated value.",
        "Business owner attestation for the claimed outcome.",
      ],
    };
  }

  if (intent === "decision") {
    const decisions = table(
      "tower_decision_lanes",
      "Programs Requiring Leadership Action",
      ["Program", "Lane", "Funding", "Next gate"],
      view.programLanes.slice(0, 5).map((lane) => [
        lane.programName,
        lane.decisionLane,
        formatCioTowerMoney(lane.approvedFundingUsd),
        compactText(String(lane.requiredGates[0]?.ask ?? lane.decisionRationale)),
      ]),
    );
    return {
      answer: `${args.tenantName}'s current Tower posture is a decision-control problem, not a generic dashboard problem. The next action is to use the current claim states and program lanes to force each material investment into scale, fix, freeze, stop, or evidence-required review.`,
      tables: [decisions],
      metricCards,
      gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
    };
  }

  if (intent === "evidence") {
    const evidence = table(
      "tower_evidence_lineage",
      "Evidence And Provenance",
      ["Displayed fact", "Value", "Source", "Caveat"],
      view.evidenceLineage.slice(0, 5).map((line) => [
        line.displayedFact,
        line.displayedValueText ?? formatCioTowerMoney(line.displayedValueNumeric ?? 0),
        compactText(line.sourceSystem ?? line.sourceFile),
        compactText(line.caveat),
      ]),
    );
    return {
      answer: `The current Tower layer has explicit evidence lineage and required-field gaps. Where lineage is missing, aVa must name the missing business evidence instead of falling back to retired V6, V7, or CIO Tower tables.`,
      tables: [evidence],
      metricCards,
      gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
    };
  }

  const budget = table(
    "tower_budget_posture",
    "Budget And Portfolio Posture",
    ["Measure", "Value", "Interpretation"],
    [
      ["Technology budget", formatCioTowerMoney(command.totalItBudgetFy26), "Current Tower budget envelope"],
      ["Run budget", formatCioTowerMoney(command.runBudgetFy26), "Run / keep-the-lights-on posture"],
      ["Change budget", formatCioTowerMoney(command.changeBudgetFy26), "Transformation and investment envelope"],
      ["AI-tagged spend", formatCioTowerMoney(command.aiTaggedSpendFy26NonAdditive), "Non-additive AI lens"],
      ["Claimable value", formatCioTowerMoney(command.realizedValueYtdAllowed), "Only value that passed Tower's claim gate"],
    ],
  );
  return {
    answer: `${args.tenantName}'s Tower current state is ${formatCioTowerMoney(command.totalItBudgetFy26)} of technology budget with ${formatCioTowerMoney(command.aiTaggedSpendFy26NonAdditive)} AI-tagged spend. The important point is not the spend alone: Tower currently separates funded activity, usage evidence, finance validation, and claimable value so leadership does not mistake adoption for outcome proof.`,
    tables: [budget],
    metricCards,
    gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
  };
}

export async function answerCurrentTowerQuestion(
  args: CurrentTowerAnswerArgs,
): Promise<CioTowerAnswerResult> {
  const startedAt = Date.now();
  const view = await readTowerCommandCenter({
    tenantKeyCandidates: [args.tenantKey, args.tenantName],
  });
  const intent = intentFor(args.question);
  const current = answerFromIntent(args, intent, view);
  const promptHash = stableHash(
    JSON.stringify({
      version: "tower_current_layer_answer_v1",
      tenantKey: args.tenantKey,
      question: args.question,
      intent,
      generatedFrom: view?.generatedFrom ?? "missing",
      visibleContextCriteria: args.visibleContextCriteria ?? null,
    }),
  );
  const trace = traceKey("tower_current_trace", [
    args.tenantKey,
    args.question,
    promptHash,
  ]);
  const modelOutput: CioTowerVisibleAnswerContract = {
    version: "cio_tower_visible_answer_v1",
    answer: current.answer,
    tables: current.tables,
    tabs: [],
    visualContract: null,
    followUpQuestion: null,
  };
  const gfmTables = current.tables.map(tableToGfm).filter(Boolean).join("\n\n");
  return {
    response: gfmTables ? `${current.answer}\n\n${gfmTables}` : current.answer,
    modelOutputRaw: JSON.stringify(modelOutput),
    modelOutput,
    promptPackageKey: traceKey("tower_current_prompt", [
      args.tenantKey,
      args.question,
      promptHash,
    ]),
    traceKey: trace,
    promptHash,
    model: "tower-current-layer-deterministic-v1",
    validationStatus: "passed",
    validationErrors: [],
    latencyMs: Date.now() - startedAt,
    metricCards: current.metricCards,
    gaps: current.gaps,
    v6VisibleOutputAudit: {
      passed: true,
      version: VISIBLE_ANSWER_CONTRACT_VERSION,
      violations: [],
    },
  };
}
