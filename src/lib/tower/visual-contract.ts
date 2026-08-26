import type { AnswerChartKind } from "@/lib/ava-answer/contract";

export type TowerVisualQuestionIntent =
  | "trend"
  | "comparison"
  | "distribution"
  | "portfolio"
  | "financial"
  | "value"
  | "heatmap"
  | "risk"
  | "timeline"
  | "waterfall"
  | "quadrant";

export type TowerRecommendedVisual =
  | "line"
  | "stacked_bar"
  | "waterfall"
  | "heatmap"
  | "bubble"
  | "treemap"
  | "sankey"
  | "2x2"
  | "table"
  | "horizontal_bar";

export interface TowerVisualAxisContract {
  x?: string;
  y?: string;
  size?: string;
  color?: string;
}

export interface TowerVisualContract {
  questionIntent: TowerVisualQuestionIntent;
  recommendedVisual: TowerRecommendedVisual;
  requiredData: string[];
  axes?: TowerVisualAxisContract;
  annotations: string[];
  executiveTakeaway: string;
  sourceBoundary: string;
}

interface SelectTowerVisualContractInput {
  question: string;
  contractKey?: string | null;
  artifactType?: string | null;
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function selectTowerVisualContract({
  question,
  contractKey,
  artifactType,
}: SelectTowerVisualContractInput): TowerVisualContract {
  const text = `${question} ${contractKey ?? ""} ${artifactType ?? ""}`.toLowerCase();
  const questionText = question.toLowerCase();

  if (hasAny(questionText, [/\b(trend|trajectory|over time|fy\d{2}|year over year|evolved?)\b/])) {
    return {
      questionIntent: "trend",
      recommendedVisual: "line",
      requiredData: [
        "period label",
        "metric value by period",
        "basis or confidence note",
      ],
      axes: {
        x: "Period",
        y: "Tower measure",
      },
      annotations: [
        "Call out breaks in confidence or measurement basis.",
        "Do not smooth or project missing periods.",
      ],
      executiveTakeaway:
        "Show whether the Tower measure is improving, deteriorating, or still too thin for a trend claim.",
      sourceBoundary:
        "Render only periods loaded in Tower; missing periods remain evidence gaps.",
    };
  }

  if (
    hasAny(questionText, [
      /\b(waterfall|funnel|bridge|promised|validated|claimable|value gap|losing value|value leakage|leakage|measurement readiness)\b/,
    ])
  ) {
    return {
      questionIntent: "waterfall",
      recommendedVisual: "waterfall",
      requiredData: [
        "value stage",
        "stage amount",
        "claim status or proof gate",
      ],
      axes: {
        x: "Value stage",
        y: "Amount",
      },
      annotations: [
        "Separate promised or forecast value from finance-attested value.",
        "Label blocked claim gates as measurement work, not outcomes.",
      ],
      executiveTakeaway:
        "Show where forecast value falls out before it becomes board-usable value.",
      sourceBoundary:
        "Do not present forecast, promised, or partial measurement fields as realized outcomes.",
    };
  }

  if (hasAny(questionText, [/\b(vendor|vendors|supplier|suppliers|contract|renewal|cost driver|concentration|spend exposure|financial exposure)\b/])) {
    return {
      questionIntent: "financial",
      recommendedVisual: "treemap",
      requiredData: [
        "vendor or service name",
        "spend, exposure, or renewal value",
        "owner or evidence gap",
      ],
      axes: {
        x: "Vendor or service",
        y: "Financial exposure",
      },
      annotations: [
        "Highlight concentration and renewal windows.",
        "Call out missing contract economics before ranking leverage.",
      ],
      executiveTakeaway:
        "Show which cost pools or suppliers deserve commercial inspection first.",
      sourceBoundary:
        "Rank only loaded spend or contract exposure fields; missing vendor economics must be stated as gaps.",
    };
  }

  if (hasAny(questionText, [/\b(heatmap|risk|unhealthy|control|gap|evidence|readiness)\b/])) {
    return {
      questionIntent: "heatmap",
      recommendedVisual: "heatmap",
      requiredData: [
        "program, metric, or evidence domain",
        "risk or readiness score",
        "owner or required evidence",
      ],
      axes: {
        x: "Domain",
        y: "Risk or readiness",
      },
      annotations: [
        "Separate red gaps from watch items.",
        "Name the owner or evidence needed to clear each gap.",
      ],
      executiveTakeaway:
        "Show which gaps block executive confidence and which can be handled as follow-up work.",
      sourceBoundary:
        "Do not invent risk ratings; use loaded gates, confidence, and gap fields.",
    };
  }

  if (
    hasAny(text, [
      /\b(2x2|2\s*x\s*2|quadrant|matrix)\b/,
      /\b(prioriti[sz]e|funding|fund|portfolio|readiness|complexity)\b/,
    ]) &&
    hasAny(text, [/\b(program|initiative|move|portfolio|ai)\b/])
  ) {
    return {
      questionIntent: "quadrant",
      recommendedVisual: "2x2",
      requiredData: [
        "program or initiative name",
        "business value score from 0 to 100",
        "execution complexity or readiness score from 0 to 100",
        "evidence or gate note",
      ],
      axes: {
        x: "Execution complexity or readiness",
        y: "Business value",
      },
      annotations: [
        "Mark high-value / lower-complexity candidates as first-wave candidates.",
        "Mark high-value / high-complexity candidates as strategic but gated.",
      ],
      executiveTakeaway:
        "Show which programs deserve executive attention first, and which need proof or readiness work before funding confidence improves.",
      sourceBoundary:
        "Use only loaded Tower program, value, readiness, and evidence-gate fields; do not infer scores from market opinion.",
    };
  }

  if (hasAny(text, [/\btower_value_realization\b/])) {
    return {
      questionIntent: "waterfall",
      recommendedVisual: "waterfall",
      requiredData: [
        "value stage",
        "stage amount",
        "claim status or proof gate",
      ],
      axes: {
        x: "Value stage",
        y: "Amount",
      },
      annotations: [
        "Separate promised or forecast value from finance-attested value.",
        "Label blocked claim gates as measurement work, not outcomes.",
      ],
      executiveTakeaway:
        "Show where forecast value falls out before it becomes board-usable value.",
      sourceBoundary:
        "Do not present forecast, promised, or partial measurement fields as realized outcomes.",
    };
  }

  if (hasAny(text, [/\b(vendor|supplier|contract|renewal|cost driver|concentration)\b/])) {
    return {
      questionIntent: "financial",
      recommendedVisual: "treemap",
      requiredData: [
        "vendor or service name",
        "spend, exposure, or renewal value",
        "owner or evidence gap",
      ],
      axes: {
        x: "Vendor or service",
        y: "Financial exposure",
      },
      annotations: [
        "Highlight concentration and renewal windows.",
        "Call out missing contract economics before ranking leverage.",
      ],
      executiveTakeaway:
        "Show which cost pools or suppliers deserve commercial inspection first.",
      sourceBoundary:
        "Rank only loaded spend or contract exposure fields; missing vendor economics must be stated as gaps.",
    };
  }

  if (hasAny(text, [/\b(run|change|spend mix|concentrated|allocation|budget mix)\b/])) {
    return {
      questionIntent: "distribution",
      recommendedVisual: "stacked_bar",
      requiredData: [
        "budget category",
        "run, change, or AI investment amount",
        "basis or period",
      ],
      axes: {
        x: "Budget category",
        y: "Spend",
        color: "Spend type",
      },
      annotations: [
        "Make run pressure and change capacity visible.",
        "Do not imply value from spend mix alone.",
      ],
      executiveTakeaway:
        "Show whether spend is crowding out the change or AI capacity leadership needs.",
      sourceBoundary:
        "Use loaded budget measures only; value implications must remain caveated unless value gates are clear.",
    };
  }

  if (hasAny(text, [/\b(compare|rank|top|largest|smallest|outlier|which)\b/])) {
    return {
      questionIntent: "comparison",
      recommendedVisual: "horizontal_bar",
      requiredData: [
        "ranked entity",
        "comparison metric",
        "business implication",
      ],
      axes: {
        x: "Metric value",
        y: "Ranked entity",
      },
      annotations: [
        "Sort by executive relevance, not table order.",
        "Call out unsupported values as gaps.",
      ],
      executiveTakeaway:
        "Show the ranked items that deserve leadership attention first.",
      sourceBoundary:
        "Compare only fields present in the Tower packet; do not fill gaps from general knowledge.",
    };
  }

  return {
    questionIntent: "comparison",
    recommendedVisual: "table",
    requiredData: [
      "business item",
      "current value or status",
      "decision implication",
    ],
    axes: {},
    annotations: ["Use a table only when it materially improves the executive decision."],
    executiveTakeaway:
      "Keep the answer direct and add structure only where the loaded Tower data supports it.",
    sourceBoundary:
      "Use the Tower context package and identify missing business fields plainly.",
  };
}

export function normalizeTowerVisualContract(
  value: unknown,
): TowerVisualContract | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const questionIntent =
    typeof record.questionIntent === "string"
      ? record.questionIntent
      : "comparison";
  const recommendedVisual =
    typeof record.recommendedVisual === "string"
      ? record.recommendedVisual
      : "table";
  const axes =
    record.axes && typeof record.axes === "object" && !Array.isArray(record.axes)
      ? (record.axes as TowerVisualAxisContract)
      : {};
  return {
    questionIntent: isTowerVisualQuestionIntent(questionIntent)
      ? questionIntent
      : "comparison",
    recommendedVisual: isTowerRecommendedVisual(recommendedVisual)
      ? recommendedVisual
      : "table",
    requiredData: stringArray(record.requiredData).slice(0, 6),
    axes: {
      x: typeof axes.x === "string" ? axes.x : undefined,
      y: typeof axes.y === "string" ? axes.y : undefined,
      size: typeof axes.size === "string" ? axes.size : undefined,
      color: typeof axes.color === "string" ? axes.color : undefined,
    },
    annotations: stringArray(record.annotations).slice(0, 4),
    executiveTakeaway:
      typeof record.executiveTakeaway === "string"
        ? record.executiveTakeaway
        : "Use the visual only where Tower evidence supports the decision.",
    sourceBoundary:
      typeof record.sourceBoundary === "string"
        ? record.sourceBoundary
        : "Use only loaded Tower evidence and state missing fields plainly.",
  };
}

export function chartKindForTowerVisualContract(
  contract: TowerVisualContract | null | undefined,
): AnswerChartKind | null {
  if (!contract || contract.recommendedVisual === "table") return null;
  if (contract.recommendedVisual === "2x2") return "quadrant-matrix";
  if (contract.recommendedVisual === "line") return "line";
  if (contract.recommendedVisual === "stacked_bar") return "stacked-bar";
  if (contract.recommendedVisual === "waterfall") return "horizontal-bar";
  if (contract.recommendedVisual === "heatmap") return "horizontal-bar";
  if (contract.recommendedVisual === "treemap") return "horizontal-bar";
  if (contract.recommendedVisual === "bubble") return "quadrant-matrix";
  if (contract.recommendedVisual === "sankey") return "horizontal-bar";
  return "horizontal-bar";
}

export interface TowerProgressEvent {
  phase: string;
  label: string;
  state?: "loading" | "complete";
}

export function towerProgressEventsForQuestion(question: string): TowerProgressEvent[] {
  const visual = selectTowerVisualContract({ question });
  if (visual.questionIntent === "quadrant") {
    return [
      { phase: "portfolio", label: "Loading AI portfolio..." },
      { phase: "readiness", label: "Comparing value and readiness..." },
      { phase: "visual", label: "Preparing 2x2 decision view..." },
    ];
  }
  if (visual.questionIntent === "waterfall" || visual.questionIntent === "value") {
    return [
      { phase: "value", label: "Loading value funnel..." },
      { phase: "finance", label: "Checking finance confirmation..." },
      { phase: "comparison", label: "Comparing promised versus claimable value..." },
      { phase: "visual", label: "Preparing value bridge..." },
    ];
  }
  if (visual.questionIntent === "trend") {
    return [
      { phase: "history", label: "Loading metric history..." },
      { phase: "confidence", label: "Checking period confidence..." },
      { phase: "visual", label: "Preparing trend view..." },
    ];
  }
  if (visual.questionIntent === "financial") {
    return [
      { phase: "spend", label: "Loading spend and exposure signals..." },
      { phase: "commercial", label: "Checking contract and owner coverage..." },
      { phase: "ranking", label: "Ranking commercial pressure points..." },
    ];
  }
  if (visual.questionIntent === "heatmap" || visual.questionIntent === "risk") {
    return [
      { phase: "risk", label: "Loading risk and evidence gaps..." },
      { phase: "confidence", label: "Checking measurement confidence..." },
      { phase: "visual", label: "Preparing risk view..." },
    ];
  }
  return [
    { phase: "budget", label: "Loading FY26 budget measures..." },
    { phase: "evidence", label: "Validating supporting evidence..." },
    { phase: "answer", label: "Preparing executive recommendation..." },
  ];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isTowerVisualQuestionIntent(value: string): value is TowerVisualQuestionIntent {
  return [
    "trend",
    "comparison",
    "distribution",
    "portfolio",
    "financial",
    "value",
    "heatmap",
    "risk",
    "timeline",
    "waterfall",
    "quadrant",
  ].includes(value);
}

function isTowerRecommendedVisual(value: string): value is TowerRecommendedVisual {
  return [
    "line",
    "stacked_bar",
    "waterfall",
    "heatmap",
    "bubble",
    "treemap",
    "sankey",
    "2x2",
    "table",
    "horizontal_bar",
  ].includes(value);
}
