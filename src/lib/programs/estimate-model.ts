export type EstimateCurrency = "USD" | "CAD" | "EUR" | "GBP";
export type EstimateDeliveryModel = "internal" | "vendor";
export type EstimateInputBasis = "evidence" | "assumption" | "open";
export type EstimateConfidence = "low" | "medium" | "high";

export interface EstimateModelLine {
  pairId: string;
  workPackage: string;
  role: string;
  deliveryModel: EstimateDeliveryModel;
  lowHours: number | null;
  baseHours: number | null;
  highHours: number | null;
  ratePerHour: number | null;
  rateSource: string;
  inputBasis: EstimateInputBasis;
  evidenceReference: string;
  assumption: string;
  confidence: EstimateConfidence;
  aiEligiblePct: number | null;
  aiToolAssumption: string;
  humanReviewHours: number | null;
}

export interface EstimateModel {
  currency: EstimateCurrency;
  reviewer: string;
  reviewConfirmed: boolean;
  sourceNotes: string;
  rows: EstimateModelLine[];
}

export interface EstimateLineCalculation {
  pairId: string;
  workPackage: string;
  role: string;
  deliveryModel: EstimateDeliveryModel;
  lowHours: number;
  baseHours: number;
  highHours: number;
  aiHoursSavedAtBase: number;
  humanReviewHours: number;
  lowCost: number;
  baseCost: number;
  highCost: number;
}

export interface EstimateScenarioTotal {
  lowHours: number;
  baseHours: number;
  highHours: number;
  aiHoursSavedAtBase: number;
  humanReviewHours: number;
  lowCost: number;
  baseCost: number;
  highCost: number;
}

export interface EstimateModelEvaluation {
  model: EstimateModel | null;
  errors: string[];
  calculations: EstimateLineCalculation[];
  totals: Record<EstimateDeliveryModel, EstimateScenarioTotal>;
  readyForApproval: boolean;
}

export function emptyEstimateModel(): EstimateModel {
  return {
    currency: "USD",
    reviewer: "",
    reviewConfirmed: false,
    sourceNotes: "",
    rows: [],
  };
}

export function parseEstimateModel(value: string): EstimateModel | null {
  if (!value.trim()) return emptyEstimateModel();
  try {
    const parsed = JSON.parse(value) as Partial<EstimateModel>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.rows) ||
      !["USD", "CAD", "EUR", "GBP"].includes(String(parsed.currency))
    ) {
      return null;
    }
    const stringFields = [
      "pairId",
      "workPackage",
      "role",
      "rateSource",
      "inputBasis",
      "evidenceReference",
      "assumption",
      "confidence",
      "aiToolAssumption",
    ] as const;
    const numericFields = [
      "lowHours",
      "baseHours",
      "highHours",
      "ratePerHour",
      "aiEligiblePct",
      "humanReviewHours",
    ] as const;
    const rowsAreWellFormed = parsed.rows.every((candidate) => {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
      const row = candidate as unknown as Record<string, unknown>;
      return (
        stringFields.every((field) => typeof row[field] === "string") &&
        numericFields.every((field) => row[field] === null || typeof row[field] === "number")
      );
    });
    if (!rowsAreWellFormed) return null;
    return {
      currency: parsed.currency as EstimateCurrency,
      reviewer: typeof parsed.reviewer === "string" ? parsed.reviewer : "",
      reviewConfirmed: parsed.reviewConfirmed === true,
      sourceNotes:
        typeof parsed.sourceNotes === "string" ? parsed.sourceNotes : "",
      rows: parsed.rows as EstimateModelLine[],
    };
  } catch {
    return null;
  }
}

const emptyTotal = (): EstimateScenarioTotal => ({
  lowHours: 0,
  baseHours: 0,
  highHours: 0,
  aiHoursSavedAtBase: 0,
  humanReviewHours: 0,
  lowCost: 0,
  baseCost: 0,
  highCost: 0,
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

function numeric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateEstimateModel(value: string): EstimateModelEvaluation {
  const model = parseEstimateModel(value);
  const errors: string[] = [];
  const totals = { internal: emptyTotal(), vendor: emptyTotal() };
  if (!model) {
    return {
      model: null,
      errors: ["The estimate model could not be read. Rebuild it from the editor."],
      calculations: [],
      totals,
      readyForApproval: false,
    };
  }

  if (model.rows.length === 0) errors.push("Add at least one role/work-package pair.");
  if (!model.reviewer.trim()) errors.push("Name the human estimate reviewer.");
  if (!model.reviewConfirmed) errors.push("The estimate reviewer must confirm the editable assumptions.");

  const seen = new Set<string>();
  const scenarioKeys = new Map<string, Set<EstimateDeliveryModel>>();
  const calculations: EstimateLineCalculation[] = [];

  model.rows.forEach((line, index) => {
    const label = `Row ${index + 1}`;
    if (!line.pairId?.trim()) errors.push(`${label}: role pair is missing its identifier.`);
    if (!line.workPackage?.trim()) errors.push(`${label}: work package is required.`);
    if (!line.role?.trim()) errors.push(`${label}: role is required.`);
    if (!line.rateSource?.trim()) errors.push(`${label}: rate source is required.`);
    if (!["internal", "vendor"].includes(line.deliveryModel)) {
      errors.push(`${label}: choose internal or vendor delivery.`);
    }
    if (!["evidence", "assumption", "open"].includes(line.inputBasis)) {
      errors.push(`${label}: input basis must be evidence, assumption, or open.`);
    }
    if (line.inputBasis === "evidence" && !line.evidenceReference?.trim()) {
      errors.push(`${label}: evidence-backed inputs need a source reference.`);
    }
    if (line.inputBasis === "assumption" && !line.assumption?.trim()) {
      errors.push(`${label}: assumptions need an explanation.`);
    }
    if (line.inputBasis === "open") errors.push(`${label}: resolve or explicitly carry this open estimate input.`);
    if (!["low", "medium", "high"].includes(line.confidence)) {
      errors.push(`${label}: choose an estimate confidence.`);
    }

    const lowHours = line.lowHours;
    const baseHours = line.baseHours;
    const highHours = line.highHours;
    const hours = [lowHours, baseHours, highHours];
    if (!hours.every((n) => numeric(n) && n >= 0)) {
      errors.push(`${label}: low/base/high hours must be non-negative numbers.`);
    } else if (!(lowHours! <= baseHours! && baseHours! <= highHours!)) {
      errors.push(`${label}: hours must satisfy low ≤ base ≤ high.`);
    }
    if (!numeric(line.ratePerHour) || line.ratePerHour <= 0) {
      errors.push(`${label}: planning rate must be greater than zero.`);
    }
    if (!numeric(line.aiEligiblePct) || line.aiEligiblePct < 0 || line.aiEligiblePct > 100) {
      errors.push(`${label}: coding-assistant sensitivity must be from 0 to 100%.`);
    }
    if (!numeric(line.humanReviewHours) || line.humanReviewHours < 0) {
      errors.push(`${label}: human review hours must be non-negative.`);
    }
    if ((line.aiEligiblePct ?? 0) > 0 && !line.aiToolAssumption?.trim()) {
      errors.push(`${label}: state the Claude Code/Codex productivity assumption.`);
    }

    const key = `${line.pairId}:${line.deliveryModel}`;
    if (seen.has(key)) errors.push(`${label}: duplicate delivery scenario for this role pair.`);
    seen.add(key);
    const scenarios = scenarioKeys.get(line.pairId) ?? new Set<EstimateDeliveryModel>();
    scenarios.add(line.deliveryModel);
    scenarioKeys.set(line.pairId, scenarios);

    if (
      hours.every((n) => numeric(n) && n >= 0) &&
      numeric(line.ratePerHour) && line.ratePerHour > 0 &&
      numeric(line.aiEligiblePct) && line.aiEligiblePct >= 0 && line.aiEligiblePct <= 100 &&
      numeric(line.humanReviewHours) && line.humanReviewHours >= 0
    ) {
      const factor = 1 - line.aiEligiblePct / 100;
      const lowHours = round2(line.lowHours! * factor + line.humanReviewHours);
      const baseHours = round2(line.baseHours! * factor + line.humanReviewHours);
      const highHours = round2(line.highHours! * factor + line.humanReviewHours);
      calculations.push({
        pairId: line.pairId,
        workPackage: line.workPackage,
        role: line.role,
        deliveryModel: line.deliveryModel,
        lowHours,
        baseHours,
        highHours,
        aiHoursSavedAtBase: round2(line.baseHours! * (line.aiEligiblePct / 100)),
        humanReviewHours: line.humanReviewHours,
        lowCost: round2(lowHours * line.ratePerHour),
        baseCost: round2(baseHours * line.ratePerHour),
        highCost: round2(highHours * line.ratePerHour),
      });
    }
  });

  for (const [pairId, scenarios] of scenarioKeys) {
    if (!scenarios.has("internal") || !scenarios.has("vendor")) {
      errors.push(`Role pair ${pairId}: comparable internal and vendor rows are both required.`);
    }
  }

  for (const calculation of calculations) {
    const total = totals[calculation.deliveryModel];
    total.lowHours = round2(total.lowHours + calculation.lowHours);
    total.baseHours = round2(total.baseHours + calculation.baseHours);
    total.highHours = round2(total.highHours + calculation.highHours);
    total.aiHoursSavedAtBase = round2(total.aiHoursSavedAtBase + calculation.aiHoursSavedAtBase);
    total.humanReviewHours = round2(total.humanReviewHours + calculation.humanReviewHours);
    total.lowCost = round2(total.lowCost + calculation.lowCost);
    total.baseCost = round2(total.baseCost + calculation.baseCost);
    total.highCost = round2(total.highCost + calculation.highCost);
  }

  return {
    model,
    errors,
    calculations,
    totals,
    readyForApproval: errors.length === 0,
  };
}

export function formatEstimateModelForPrompt(value: string): string | null {
  const result = evaluateEstimateModel(value);
  if (!result.model || result.errors.length > 0) return null;
  const { model, totals } = result;
  const money = (n: number) => `${model.currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const lines = [
    "DETERMINISTIC ROADMAP ESTIMATE MODEL (human-reviewed inputs; calculated totals are authoritative)",
    `Currency: ${model.currency}`,
    `Reviewed by: ${model.reviewer}`,
    "Formula per role row: adjusted scenario hours = scenario hours × (1 − coding-assistant sensitivity) + human review hours; scenario cost = adjusted hours × planning rate.",
    ...result.calculations.map((calculation) => {
      const input = model.rows.find((row) => row.pairId === calculation.pairId && row.deliveryModel === calculation.deliveryModel)!;
      const basis = input.inputBasis === "evidence"
        ? `evidence ${input.evidenceReference}`
        : `assumption ${input.assumption}`;
      const toolAssumption = input.aiToolAssumption.trim()
        ? `; Claude Code/Codex assumption ${input.aiToolAssumption.trim()}`
        : "";
      return `- ${calculation.workPackage} / ${calculation.role} / ${calculation.deliveryModel}: input hours ${input.lowHours}/${input.baseHours}/${input.highHours}; AI sensitivity ${input.aiEligiblePct}%; human review ${calculation.humanReviewHours}h; rate ${model.currency} ${input.ratePerHour}/h (${input.rateSource}); adjusted hours ${calculation.lowHours}/${calculation.baseHours}/${calculation.highHours}; cost ${money(calculation.lowCost)}/${money(calculation.baseCost)}/${money(calculation.highCost)} low/base/high; ${basis}; confidence ${input.confidence}${toolAssumption}.`;
    }),
    ...(["internal", "vendor"] as const).map((scenario) => {
      const total = totals[scenario];
      return `${scenario}: effort ${total.lowHours}/${total.baseHours}/${total.highHours} hours; cost ${money(total.lowCost)}/${money(total.baseCost)}/${money(total.highCost)} (low/base/high); assumed coding-assistant hours saved ${total.aiHoursSavedAtBase}; human review ${total.humanReviewHours} hours.`;
    }),
    "Every line is editable and labelled as evidence or assumption. Preserve the calculations exactly; never turn a planning range into a quote or savings claim.",
  ];
  if (model.sourceNotes.trim()) lines.push(`Prior estimate notes to preserve as context: ${model.sourceNotes.trim()}`);
  return lines.join("\n");
}
