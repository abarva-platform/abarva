import crypto from "node:crypto";

import { formatCioTowerMoney } from "@/lib/tower/metric-packet";
import { VISIBLE_ANSWER_CONTRACT_VERSION } from "@/lib/agent/visible-answer-contract";
import type {
  CioTowerAnswerResult,
  CioTowerPageContext,
  CioTowerVisibleAnswerContract,
  CioTowerVisibleContextCriteria,
  CioTowerVisibleTable,
} from "@/lib/tower/current-layer-answer-contract";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";
import { selectTowerVisualContract } from "@/lib/tower/visual-contract";

type TowerCurrentView = NonNullable<Awaited<ReturnType<typeof readTowerCommandCenter>>>;
type TowerCurrentAiItem = TowerCurrentView["aiPortfolio"][number];

export interface CurrentTowerAnswerArgs {
  tenantId: string;
  userId?: string | null;
  tenantKey: string;
  tenantKeyCandidates?: readonly (string | null | undefined)[];
  tenantName: string;
  question: string;
  pageContext?: CioTowerPageContext | null;
  visibleContextCriteria?: CioTowerVisibleContextCriteria;
}

type CurrentTowerIntent =
  | "value"
  | "ai"
  | "tools"
  | "distribution"
  | "constraints"
  | "foundations"
  | "selected"
  | "top_investments"
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
  if (/\b(this|selected|detail|double[-\s]?click|drill[-\s]?down)\b/.test(normalized)) {
    return "selected";
  }
  if (
    (/\b(top|largest|biggest|rank|ranking)\b/.test(normalized) &&
      /\b(investment|investments|spend|cost|budget|case|initiative|bet)\b/.test(normalized)) ||
    /\broi\b|\breturn\b/.test(normalized)
  ) {
    return "top_investments";
  }
  if (/\b(distribution|breakdown|slice|segment|by domain|by value type|reduce cost|foundation)\b/.test(normalized)) {
    return "distribution";
  }
  if (/\b(blocker|blocks|constraint|control|sox|workflow telemetry|dlp|clinical safety|gate)\b/.test(normalized)) {
    return "constraints";
  }
  if (/\b(foundation|platform|governance|enabler|cross[-\s]?functional)\b/.test(normalized)) {
    return "foundations";
  }
  if (/\b(tool|tools|copilot|codex|claude|servicenow|workday|adoption|seat|rollout|licensed user)\b/.test(normalized)) {
    return "tools";
  }
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

function intentFromPageContext(
  intent: CurrentTowerIntent,
  pageContext?: CioTowerPageContext | null,
): CurrentTowerIntent {
  if (intent !== "portfolio" && intent !== "ai") return intent;
  if (pageContext?.selectedEntity) return "selected";
  if (pageContext?.activeTab === "tools") return "tools";
  if (pageContext?.activeTab === "foundations") return "foundations";
  if (pageContext?.activeView === "distribution") return "distribution";
  if (pageContext?.activeView === "constraint") return "constraints";
  if (pageContext?.activeView === "table") return "top_investments";
  return intent;
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

function text(value: string | null | undefined): string {
  return compactText(value, "Not loaded");
}

function count(value: number | null | undefined): string {
  return value === null || value === undefined ? "Not loaded" : String(value);
}

function pct(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "Not loaded"
    : `${Math.round(value)}%`;
}

function multiple(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "Not loaded" : `${value.toFixed(1)}x`;
}

function loadedNumber(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Number.isFinite(value);
}

function money(value: number | null | undefined): string {
  const formatted = formatCioTowerMoney(value);
  return formatted === "not loaded" ? "Not loaded" : formatted;
}

function roi(promisedUsd: number | null | undefined, investmentLoaded: boolean, investmentUsd: number): number | null {
  if (!loadedNumber(promisedUsd) || !investmentLoaded || investmentUsd <= 0) return null;
  return (promisedUsd as number) / investmentUsd;
}

function itemSpendLoaded(item: TowerCurrentAiItem): boolean {
  return item.aiSpendLoaded === true;
}

function itemSpendUsd(item: TowerCurrentAiItem): number {
  return item.aiTaggedSpendUsd;
}

function isToolRollout(item: TowerCurrentAiItem): boolean {
  return item.sourceFile === "23_ai_tool_rollout.csv" || item.adoptionTargetPct !== null || item.linkedBusinessCaseCount !== null;
}

function isFoundation(item: TowerCurrentAiItem): boolean {
  const probe = `${item.itemKind} ${item.aiSpendType ?? ""} ${item.aiSpendCategory ?? ""} ${item.itemName}`;
  return /foundation|platform|governance/i.test(probe);
}

function topInvestmentRows(view: TowerCurrentView): string[][] {
  return [...view.aiPortfolio]
    .filter((item) => itemSpendLoaded(item) || loadedNumber(item.promisedValueUsd))
    .sort((a, b) => (itemSpendLoaded(b) ? itemSpendUsd(b) : -1) - (itemSpendLoaded(a) ? itemSpendUsd(a) : -1))
    .slice(0, 10)
    .map((item) => [
      item.itemName,
      text(item.businessValueType ?? item.itemKind),
      text(item.aiSpendCategory),
      itemSpendLoaded(item) ? money(itemSpendUsd(item)) : "Not loaded",
      loadedNumber(item.promisedValueUsd) ? money(item.promisedValueUsd) : "Not loaded",
      multiple(roi(item.promisedValueUsd, itemSpendLoaded(item), itemSpendUsd(item))),
      text(item.gatingConstraint ?? item.controlBlocker),
      text(item.financeStatus),
    ]);
}

function toolRows(view: TowerCurrentView): string[][] {
  return view.aiPortfolio
    .filter(isToolRollout)
    .sort((a, b) => {
      const aGap =
        a.adoptionRatePct === null || a.adoptionTargetPct === null
          ? -1
          : a.adoptionTargetPct - a.adoptionRatePct;
      const bGap =
        b.adoptionRatePct === null || b.adoptionTargetPct === null
          ? -1
          : b.adoptionTargetPct - b.adoptionRatePct;
      return bGap - aGap;
    })
    .slice(0, 15)
    .map((item) => {
      const gap =
        item.adoptionRatePct === null || item.adoptionTargetPct === null
          ? "Not loaded"
          : `${Math.max(0, Math.round(item.adoptionTargetPct - item.adoptionRatePct))} pts`;
      return [
        item.itemName,
        text(item.vendorName),
        item.usageActual === null ? "Not loaded" : `${item.usageActual} ${item.usageMetric ?? ""}`.trim(),
        pct(item.adoptionRatePct),
        pct(item.adoptionTargetPct),
        gap,
        text(item.controlBlocker ?? "None found"),
        count(item.linkedBusinessCaseCount),
      ];
    });
}

function distributionRows(
  view: TowerCurrentView,
  groupBy: (item: TowerCurrentAiItem) => string | null | undefined,
): string[][] {
  const groups = new Map<string, { count: number; spend: number; spendLoaded: number; value: number; missingValue: number }>();
  for (const item of view.aiPortfolio) {
    const key = groupBy(item) ?? "Not loaded";
    const current = groups.get(key) ?? { count: 0, spend: 0, spendLoaded: 0, value: 0, missingValue: 0 };
    groups.set(key, {
      count: current.count + 1,
      spend: current.spend + (itemSpendLoaded(item) ? itemSpendUsd(item) : 0),
      spendLoaded: current.spendLoaded + (itemSpendLoaded(item) ? 1 : 0),
      value: current.value + (loadedNumber(item.promisedValueUsd) ? (item.promisedValueUsd as number) : 0),
      missingValue: current.missingValue + (loadedNumber(item.promisedValueUsd) ? 0 : 1),
    });
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([name, row]) => [
      name,
      String(row.count),
      row.spendLoaded === 0 ? "Not loaded" : money(row.spend),
      row.missingValue === row.count ? "Not loaded" : money(row.value),
      row.missingValue === 0 ? "Complete" : `${row.missingValue} missing value`,
    ]);
}

function constraintRows(view: TowerCurrentView): string[][] {
  const groups = new Map<string, { count: number; spend: number; spendLoaded: number; value: number; valueLoaded: number; examples: string[] }>();
  for (const item of view.aiPortfolio) {
    const blocker = item.gatingConstraint ?? item.controlBlocker ?? "Not loaded";
    const current = groups.get(blocker) ?? { count: 0, spend: 0, spendLoaded: 0, value: 0, valueLoaded: 0, examples: [] };
    groups.set(blocker, {
      count: current.count + 1,
      spend: current.spend + (itemSpendLoaded(item) ? itemSpendUsd(item) : 0),
      spendLoaded: current.spendLoaded + (itemSpendLoaded(item) ? 1 : 0),
      value: current.value + (loadedNumber(item.promisedValueUsd) ? (item.promisedValueUsd as number) : 0),
      valueLoaded: current.valueLoaded + (loadedNumber(item.promisedValueUsd) ? 1 : 0),
      examples: current.examples.length >= 2 ? current.examples : [...current.examples, item.itemName],
    });
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 10)
    .map(([name, row]) => [
      name,
      String(row.count),
      row.spendLoaded === 0 ? "Not loaded" : money(row.spend),
      row.valueLoaded === 0 ? "Not loaded" : money(row.value),
      row.examples.join("; "),
    ]);
}

function foundationRows(view: TowerCurrentView): string[][] {
  return view.aiPortfolio
    .filter(isFoundation)
    .sort((a, b) => itemSpendUsd(b) - itemSpendUsd(a))
    .slice(0, 12)
    .map((item) => [
      item.itemName,
      text(item.aiSpendCategory ?? item.itemKind),
      itemSpendLoaded(item) ? money(itemSpendUsd(item)) : "Not loaded",
      item.costToBuildLowUsd === null && item.costToBuildHighUsd === null
        ? "Not loaded"
        : `${item.costToBuildLowUsd === null || item.costToBuildLowUsd === undefined ? "?" : money(item.costToBuildLowUsd)}-${item.costToBuildHighUsd === null || item.costToBuildHighUsd === undefined ? "?" : money(item.costToBuildHighUsd)}`,
      loadedNumber(item.promisedValueUsd) ? money(item.promisedValueUsd) : "Not loaded",
      text(item.controlBlocker),
    ]);
}

function selectedEntityTables(
  pageContext: CioTowerPageContext | null | undefined,
  view: TowerCurrentView,
): CioTowerVisibleTable[] {
  const selected = pageContext?.selectedEntity;
  if (!selected) return [];
  const selectedLabel = selected.label?.trim().toLowerCase();
  const ai =
    selected.kind === "ai"
      ? view.aiPortfolio.find(
          (item) =>
            item.aiPortfolioKey === selected.id ||
            item.sourceRow === selected.id ||
            item.itemName.toLowerCase() === selectedLabel,
        )
      : null;
  if (ai) {
    return [
      table("tower_selected_ai_detail", `Selected AI item: ${ai.itemName}`, ["Field", "Value"], [
        ["Type", text(ai.businessValueType ?? ai.itemKind)],
        ["Domain", text(ai.aiSpendCategory)],
        ["Vendor", text(ai.vendorName)],
        ["Investment", itemSpendLoaded(ai) ? money(itemSpendUsd(ai)) : "Not loaded"],
        ["Sponsor-stated value", loadedNumber(ai.promisedValueUsd) ? money(ai.promisedValueUsd) : "Not loaded"],
        ["Sponsor ROI", multiple(roi(ai.promisedValueUsd, itemSpendLoaded(ai), itemSpendUsd(ai)))],
        ["Gating constraint", text(ai.gatingConstraint)],
        ["Control blocker", text(ai.controlBlocker)],
        ["Finance status", text(ai.financeStatus)],
        ["Evidence items", String(ai.evidenceItems?.length ?? 0)],
      ]),
    ];
  }
  const program =
    selected.kind === "program"
      ? view.programLanes.find(
          (item) =>
            item.programCode === selected.id ||
            item.programName.toLowerCase() === selectedLabel,
        )
      : null;
  if (program) {
    return [
      table("tower_selected_program_detail", `Selected case: ${program.programName}`, ["Field", "Value"], [
        ["Owner", text(program.ownerRole)],
        ["Domain", text(program.domainName)],
        ["Investment", money(program.fundedAmount ?? program.approvedFundingUsd)],
        ["Promised value", loadedNumber(program.promisedValueUsd) ? money(program.promisedValueUsd) : "Not loaded"],
        ["Usage supported", money(program.knownSupportedValue)],
        ["Finance approved", money(program.financeValidatedValueUsd)],
        ["Next gate", text(program.nextGate)],
        ["Blocker", text(program.decisionRationale)],
      ]),
    ];
  }
  const gap =
    selected.kind === "gap"
      ? view.requiredFieldGaps.find(
          (item) =>
            item.gapKey === selected.id ||
            item.requiredField.toLowerCase() === selectedLabel ||
            item.remediationAction.toLowerCase() === selectedLabel,
        )
      : null;
  if (gap) {
    return [
      table("tower_selected_gap_detail", `Selected evidence gap: ${gap.requiredField}`, ["Field", "Value"], [
        ["Source template", gap.sourceTemplate],
        ["Owner", text(gap.ownerHint)],
        ["Severity", gap.severity],
        ["Blocking", gap.blocking ? "Yes" : "No"],
        ["Remediation", gap.remediationAction],
      ]),
    ];
  }
  const action =
    selected.kind === "action"
      ? view.cxoActions.find(
          (item) =>
            item.actionKey === selected.id ||
            item.title.toLowerCase() === selectedLabel,
        )
      : null;
  if (!action) return [];
  return [
    table("tower_selected_action_detail", `Selected action: ${action.title}`, ["Field", "Value"], [
      ["Owner", text(action.ownerRole ?? action.ownerHint)],
      ["Decision", text(action.blockedDecision ?? action.actionLane)],
      ["Why", text(action.actionBody)],
      ["Evidence required", text(action.evidenceRequirement)],
      ["Value affected", money(action.amountExposed)],
      ["Due", text(action.dueWindow ?? action.dueDate)],
      ["Handoff", text(action.moduleHandoff ?? action.handoffModule)],
    ]),
  ];
}

function answerFromIntent(
  args: CurrentTowerAnswerArgs,
  intent: CurrentTowerIntent,
  view: TowerCurrentView | null,
): { answer: string; tables: CioTowerVisibleTable[]; metricCards: Array<{ label: string; value: string }>; gaps: string[] } {
  if (!view) {
    return {
      answer:
        "Tower does not have a governed ECL serving read model loaded for this tenant. I am not falling back to retired V6, V7, CIO Tower, or pre-ECL Tower layers.",
      tables: [],
      metricCards: [],
      gaps: ["ECL serving Tower rows are not loaded for the active tenant."],
    };
  }

  const command = view.command;
  const pageLead = args.pageContext?.activeTabLabel
    ? `I am using the ${args.pageContext.activeTabLabel}${args.pageContext.activeViewLabel ? ` / ${args.pageContext.activeViewLabel}` : ""} context. `
    : "";
  const metricCards = [
    { label: "Technology budget", value: money(command.totalItBudgetFy26) },
    { label: "AI-tagged spend", value: money(command.aiTaggedSpendFy26NonAdditive) },
    { label: "Value claims", value: count(command.valueClaimCount) },
    { label: "Claimable value", value: money(command.realizedValueYtdAllowed) },
  ];

  if (intent === "selected") {
    const selectedTables = selectedEntityTables(args.pageContext, view);
    if (selectedTables.length > 0) {
      return {
        answer: `${pageLead}This is the governed drill-down for the selected Tower row. I am showing loaded fields and naming gaps rather than treating missing values as zero.`,
        tables: selectedTables,
        metricCards,
        gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
      };
    }
  }

  if (intent === "top_investments") {
    const investments = table(
      "tower_top_ai_investments",
      "Top AI Investments And Sponsor ROI",
      ["Initiative", "Value type", "Domain", "Investment", "Sponsor-stated value", "Sponsor ROI", "Constraint", "Finance status"],
      topInvestmentRows(view),
    );
    return {
      answer: `${pageLead}The useful CXO view is investment next to sponsor-stated value and proof state. Sponsor ROI here means promised value divided by loaded investment; it is not realized value and it is not finance-attested unless the finance status says so.`,
      tables: [investments],
      metricCards,
      gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
    };
  }

  if (intent === "tools") {
    const tools = table(
      "tower_tool_rollouts",
      "AI Tool Rollouts, Adoption Targets, And Blockers",
      ["Tool", "Vendor", "Users", "Adoption", "Target", "Gap to target", "Control blocker", "Linked cases"],
      toolRows(view),
    );
    return {
      answer: `${pageLead}Tool rows are adoption evidence, not value proof. The strongest view is users, adoption target, control blocker, and linked value cases side by side so leadership can see which rollouts are under target and which have no linked business case.`,
      tables: [tools],
      metricCards,
      gaps: [
        "Tool productivity baseline by role or workflow.",
        "Monthly usage-to-value mapping for linked business cases.",
        "Finance-approved calculation method before claiming savings.",
      ],
    };
  }

  if (intent === "distribution") {
    const byValueType = table(
      "tower_distribution_by_value_type",
      "AI Initiatives By Value Type",
      ["Value type", "Rows", "Investment", "Sponsor-stated value", "Value completeness"],
      distributionRows(view, (item) => item.businessValueType),
    );
    const byDomain = table(
      "tower_distribution_by_domain",
      "AI Initiatives By Domain",
      ["Domain", "Rows", "Investment", "Sponsor-stated value", "Value completeness"],
      distributionRows(view, (item) => item.aiSpendCategory),
    );
    return {
      answer: `${pageLead}The portfolio is tagged by value type and domain where those fields are loaded. Rows with missing tags stay visible as Not loaded instead of being forced into a category.`,
      tables: [byValueType, byDomain],
      metricCards,
      gaps: view.requiredFieldGaps.slice(0, 5).map((gap) => gap.remediationAction),
    };
  }

  if (intent === "constraints") {
    const constraints = table(
      "tower_constraints",
      "Constraints Blocking AI Value",
      ["Constraint", "Rows", "Investment", "Sponsor-stated value", "Examples"],
      constraintRows(view),
    );
    return {
      answer: `${pageLead}Constraints explain why adoption has not become claimable value. A control blocker such as SOX evidence, DLP policy, workflow telemetry, or clinical safety review means a named proof/control condition must clear before leadership can treat the row as validated.`,
      tables: [constraints],
      metricCards,
      gaps: view.requiredFieldGaps
        .slice(0, 6)
        .map((gap) => `${gap.sourceTemplate}: ${gap.requiredField}`),
    };
  }

  if (intent === "foundations") {
    const foundations = table(
      "tower_foundations",
      "Foundation Enablers For AI Delivery",
      ["Foundation", "Type", "Investment", "Cost to build", "Sponsor-stated value", "Control blocker"],
      foundationRows(view),
    );
    return {
      answer: `${pageLead}Foundations are cross-functional enablers: platforms, data products, governance controls, or reusable services that make multiple AI use cases possible. Their benefit should usually be claimed through the business cases they enable, not double-counted as standalone realized value.`,
      tables: [foundations],
      metricCards,
      gaps: view.requiredFieldGaps
        .slice(0, 5)
        .map((gap) => gap.remediationAction),
    };
  }

  if (intent === "value") {
    const funnel = table(
      "tower_value_funnel",
      "Current Tower Value Funnel",
      ["Stage", "Value", "Conversion", "Caveat"],
      view.valueFunnel.slice(0, 6).map((stage) => [
        stage.stageLabel,
        money(stage.valueNumeric),
        stage.conversionRatio === null ? "n/a" : `${Math.round(stage.conversionRatio * 100)}%`,
        compactText(stage.caveat),
      ]),
    );
    return {
      answer: `${pageLead}${args.tenantName} has ${count(command.valueClaimCount)} governed Tower value claims in the current layer. Claimable value remains ${money(command.realizedValueYtdAllowed)} because Tower requires linked baseline, target, actual, and attestation evidence before a claim can move into the claimable state.`,
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
        itemSpendLoaded(item) ? money(itemSpendUsd(item)) : "Not loaded",
        item.valueClaimStatus,
      ]),
    );
    return {
      answer: `${pageLead}${args.tenantName} can show AI adoption and estimated use cost from the current Tower layer, but productivity improvement is not established until before/after engineering, service, HR, or finance outcome metrics are linked and attested. Tower should treat Copilot, Claude Code, and workflow-agent rows as usage evidence first, not value proof.`,
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
        money(lane.approvedFundingUsd),
        compactText(String(lane.requiredGates[0]?.ask ?? lane.decisionRationale)),
      ]),
    );
    return {
      answer: `${pageLead}${args.tenantName}'s current Tower posture is a decision-control problem, not a generic dashboard problem. The next action is to use the current claim states and program lanes to force each material investment into scale, fix, freeze, stop, or evidence-required review.`,
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
        line.displayedValueText ?? money(line.displayedValueNumeric),
        compactText(line.sourceSystem ?? line.sourceFile),
        compactText(line.caveat),
      ]),
    );
    return {
      answer: `${pageLead}The current Tower layer has explicit evidence lineage and required-field gaps. Where lineage is missing, aVa must name the missing business evidence instead of falling back to retired V6, V7, or CIO Tower tables.`,
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
      ["Technology budget", money(command.totalItBudgetFy26), "Current Tower budget envelope"],
      ["Run budget", money(command.runBudgetFy26), "Run / keep-the-lights-on posture"],
      ["Change budget", money(command.changeBudgetFy26), "Transformation and investment envelope"],
      ["AI-tagged spend", money(command.aiTaggedSpendFy26NonAdditive), "Non-additive AI lens"],
      ["Claimable value", money(command.realizedValueYtdAllowed), "Only value that passed Tower's claim gate"],
    ],
  );
  return {
    answer: `${pageLead}${args.tenantName}'s Tower current state is ${money(command.totalItBudgetFy26)} of technology budget with ${money(command.aiTaggedSpendFy26NonAdditive)} AI-tagged spend. The important point is not the spend alone: Tower currently separates funded activity, usage evidence, finance validation, and claimable value so leadership does not mistake adoption for outcome proof.`,
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
    tenantKeyCandidates: [
      args.tenantKey,
      ...(args.tenantKeyCandidates ?? []),
      args.tenantName,
    ],
  });
  const intent = intentFromPageContext(intentFor(args.question), args.pageContext);
  const current = answerFromIntent(args, intent, view);
  const visualContract = selectTowerVisualContract({
    question: args.question,
    contractKey: args.pageContext?.activeView ?? args.pageContext?.activeTab,
    artifactType: current.tables[0]?.id ?? null,
  });
  const promptHash = stableHash(
    JSON.stringify({
      version: "tower_current_layer_answer_v2",
      tenantKey: args.tenantKey,
      question: args.question,
      intent,
      pageContext: args.pageContext ?? null,
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
    visualContract,
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
    model: "tower-current-layer-deterministic-v2",
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
