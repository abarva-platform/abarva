import type { ContractOptimizationMveProfile } from "./types";
import { computeContractOptimizationExposureRollup } from "./exposure";
import { buildContractOptimizationStoryPack } from "./story-pack";

const money = (value: number | null): string => {
  if (!value || !Number.isFinite(value))
    return "Value to be quantified during vendor cure review";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
};

const urgencyLabel = (
  priority: ContractOptimizationMveProfile["levers"][number]["priority"],
): string => {
  if (priority === "P0") return "Immediate";
  if (priority === "P1") return "Before renewal notice";
  return "Post-cure governance";
};

const impactRange = (low: number | null, high: number | null): string => {
  if (!low && !high) return "Value to be quantified during vendor cure review";
  if (!low) return `Up to ${money(high)}`;
  if (!high) return `At least ${money(low)}`;
  return `${money(low)} to ${money(high)}`;
};

const percent = (value: number): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const number = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 1 });

const md = (value: string): string => value.replace(/\|/g, "/");

const bar = (value: number, maxValue: number, width = 12): string => {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) return "";
  const filled = Math.max(1, Math.round((value / maxValue) * width));
  return "#".repeat(filled).padEnd(width, ".");
};

const topFindingTitles = (
  profile: ContractOptimizationMveProfile,
  count: number,
): string[] =>
  profile.findings
    .filter(
      (finding) => finding.severity === "high" || finding.severity === "medium",
    )
    .slice(0, count)
    .map((finding) => finding.title);

const cureNoticeAsks = (profile: ContractOptimizationMveProfile): string[] => {
  const asks = profile.levers
    .filter((lever) => lever.priority === "P0" || lever.priority === "P1")
    .slice(0, 4)
    .map((lever) => lever.buyerAsk);
  return asks.length
    ? asks
    : [
        "Reconcile invoice variance before renewal pricing is accepted.",
        "Strengthen SLA remedies for critical service towers.",
        "True up staffing coverage against committed roles and locations.",
        "Separate one-time change orders from recurring run-rate baseline.",
      ];
};

const impactLabel = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

const contractBriefTitle = (
  profile: ContractOptimizationMveProfile,
): string => {
  if (/application managed services|ams/i.test(profile.contractName)) {
    return "AMS Contract Optimization Brief";
  }

  return `${profile.contractName} Optimization Brief`;
};

const leakageDriverReadout = (driver: string): string => {
  const normalized = driver.toLowerCase();
  if (normalized.includes("invoice")) {
    return "Recover cash by reconciling unsupported variance before renewal pricing is accepted.";
  }
  if (normalized.includes("change")) {
    return "Stop recurring exceptions from becoming the next run-rate baseline.";
  }
  if (normalized.includes("sla")) {
    return "Reset service credits so accountability matches operational criticality.";
  }
  if (normalized.includes("staff")) {
    return "True up priced roles, tower coverage, and location commitments.";
  }
  if (normalized.includes("productivity")) {
    return "Convert productivity claims into measurable, priced commitments.";
  }

  return "Tie the driver to a cure action before renewal approval.";
};

const strategyConsultingExhibits = (
  profile: ContractOptimizationMveProfile,
): string[] => {
  const exposure = computeContractOptimizationExposureRollup(profile);
  const exposureDrivers = profile.visualInsights.exposureByDriver
    .filter(
      (driver) =>
        driver.annualImpactHighUsd ||
        driver.valueBasis === "opportunity_to_test",
    )
    .slice(0, 6);
  const invoiceTrend = profile.visualInsights.invoiceVarianceTrend;
  const maxVariance = Math.max(
    1,
    ...invoiceTrend.map((row) => row.varianceUsd),
  );
  const operationalPressure = profile.visualInsights.operationalPressure;
  const staffingCoverage = profile.visualInsights.staffingCoverage;

  return [
    "## Strategy Consulting Exhibits",
    "",
    "These exhibits summarize the sourcing story in the format an executive steering committee can scan: where value is leaking, how the leakage is trending, which operating signals are above baseline, and which staffing commitments must be cured before renewal.",
    "",
    "### Exhibit 1: Exposure Bridge and Buyer Action",
    "",
    "| Driver | Impact range | Basis | Buyer action |",
    "|---|---:|---|---|",
    ...exposureDrivers.map((driver) =>
      [
        `| ${md(driver.driver)}`,
        impactRange(driver.annualImpactLowUsd, driver.annualImpactHighUsd),
        driver.valueBasis.replaceAll("_", " "),
        `${md(driver.action)} |`,
      ].join(" | "),
    ),
    "",
    `**Readout:** ${exposure.label}. Treat non-quantified productivity/SLA economics as negotiation upside until the vendor provides measurable cure evidence.`,
    "",
    "### Exhibit 2: Invoice Variance Trend",
    "",
    "| Month | Contracted | Invoiced | Variance | Variance % | Trend |",
    "|---|---:|---:|---:|---:|---|",
    ...invoiceTrend.map((row) =>
      [
        `| ${row.month}`,
        money(row.contractedAmountUsd),
        money(row.invoicedAmountUsd),
        money(row.varianceUsd),
        percent(row.variancePct),
        `${bar(row.varianceUsd, maxVariance)} |`,
      ].join(" | "),
    ),
    "",
    "### Exhibit 3: Operational Pressure Versus Baseline",
    "",
    "| Metric | Baseline | Current | Delta | Sourcing implication |",
    "|---|---:|---:|---:|---|",
    ...operationalPressure.map((metric) =>
      [
        `| ${md(metric.metric)}`,
        `${number(metric.baseline)} ${metric.unit}`,
        `${number(metric.current)} ${metric.unit}`,
        percent(metric.deltaPct),
        `${md(metric.implication)} |`,
      ].join(" | "),
    ),
    "",
    "### Exhibit 4: Staffing Coverage Reconciliation",
    "",
    "| Tower | Committed FTE | Observed FTE | Gap | Gap % | Coverage note |",
    "|---|---:|---:|---:|---:|---|",
    ...staffingCoverage.map((row) =>
      [
        `| ${md(row.tower)}`,
        number(row.committedFte),
        number(row.observedFte),
        number(row.gapFte),
        percent(row.gapPct),
        `${md(row.coverage)} |`,
      ].join(" | "),
    ),
  ];
};

export function buildContractOptimizationBriefMarkdown(
  profile: ContractOptimizationMveProfile,
): string {
  const exposure = computeContractOptimizationExposureRollup(profile);
  const storyPack = buildContractOptimizationStoryPack(profile);
  const highFindings = profile.findings.filter(
    (finding) => finding.severity === "high",
  ).length;
  const frontSheetFindings = topFindingTitles(profile, 4);
  const frontSheetAsks = cureNoticeAsks(profile);
  return [
    `# ${contractBriefTitle(profile)}`,
    "",
    `**Contract in scope:** ${profile.contractName}.`,
    "",
    "## Page 1: Executive Message",
    "",
    ...storyPack.executiveMessage.map((message) => `**${message}**`),
    "",
    `**Identified exposure:** ${exposure.label}.`,
    "",
    `**Decision required:** ${storyPack.decisionAsk}`,
    "",
    `**Renewal deadline:** non-renewal notice date is ${profile.contractBaseline.renewalNoticeDate}; use this window as leverage rather than accepting the current baseline by default.`,
    "",
    "**Top findings:**",
    ...frontSheetFindings.map((finding) => `- ${finding}`),
    "",
    "**Cure notice asks:**",
    ...frontSheetAsks.map((ask) => `- ${ask}`),
    "",
    "## Page 2: Where Value Is Leaking",
    "",
    "The value leakage is not one isolated issue. It is a chain of commercial and operating signals that should be cured together.",
    "",
    "| Sequence | Leakage driver | Executive readout |",
    "|---:|---|---|",
    ...storyPack.valueLeakageTree.map(
      (item, index) =>
        `| ${index + 1} | ${md(item)} | ${md(leakageDriverReadout(item))} |`,
    ),
    "",
    "### Commercial Opportunity Map",
    "",
    "| Opportunity quadrant | What it means | Business impact |",
    "|---|---|---|",
    ...storyPack.opportunityMap.flatMap((quadrant) =>
      quadrant.items.map(
        (item) =>
          `| ${md(quadrant.quadrant)} | ${md(item.title)} — ${md(item.summary)} | ${item.businessImpact.map(impactLabel).join(", ")} |`,
      ),
    ),
    "",
    ...strategyConsultingExhibits(profile),
    "",
    "## Page 3: Why It Is Happening",
    "",
    storyPack.whyItIsHappening,
    "",
    "### Root-Cause Map",
    "",
    "| Symptom | Commercial mechanism | Executive implication |",
    "|---|---|---|",
    "| Invoice variance | Contracted run rate is being exceeded by pass-throughs, demand changes, and out-of-catalog charges. | Do not accept current invoice baseline as clean renewal pricing. |",
    "| Recurring change orders | Exceptions can become normalized run cost when catalog, approval, and recurring status are not governed. | Separate approved scope growth from recoverable leakage before renewal. |",
    "| Weak SLA economics | Remedies are not strong enough for business-critical service towers. | Vendor accountability must be repriced before renewal approval. |",
    "| Staffing coverage gaps | Priced commitments are not fully visible in observed tower coverage. | Service quality and price are not comparable until staffing is reconciled. |",
    "| Operational pressure | Ticket, reopen, and emergency-change load is above the original model. | Demand reset and productivity glidepath must be explicit. |",
    "",
    "## Page 4: What Should Happen",
    "",
    "### Decision Timeline",
    "",
    "| Step | Timing | Decision | Owner |",
    "|---|---|---|---|",
    ...storyPack.actionTimeline.map(
      (step) =>
        `| ${md(step.label)} | ${md(step.timing)} | ${md(step.decision)} | ${md(step.ownerRole)} |`,
    ),
    "",
    "### Do-Nothing vs Renegotiate Scenario",
    "",
    "| Path | Outcome | Commercial effect | Risk effect |",
    "|---|---|---|---|",
    ...storyPack.scenarios.map(
      (scenario) =>
        `| ${md(scenario.title)} | ${md(scenario.outcome)} | ${md(scenario.commercialEffect)} | ${md(scenario.riskEffect)} |`,
    ),
    "",
    "## Page 5: Commercial Negotiation Strategy",
    "",
    "| Theme | Buyer ask | Evidence basis | Impact |",
    "|---|---|---|---|",
    ...storyPack.negotiationThemes.map(
      (theme) =>
        `| ${md(theme.theme)} | ${md(theme.buyerAsk)} | ${md(theme.evidenceBasis)} | ${theme.businessImpact.map(impactLabel).join(", ")} |`,
    ),
    "",
    "### Business Impact Scorecard",
    "",
    "| Impact category | Implication | Evidence basis |",
    "|---|---|---|",
    ...storyPack.businessImpactScorecard.map(
      (impact) =>
        `| ${impactLabel(impact.category)} | ${md(impact.implication)} | ${md(impact.evidenceBasis)} |`,
    ),
    "",
    "## Procurement Appendix: Decision Snapshot",
    "",
    `- Renewal posture: do not renew as-is. ${profile.recommendedPath.immediateAction}`,
    `- Commercial baseline: ${money(profile.contractBaseline.currentAnnualRunRateUsd)} run rate with identified exposure of ${exposure.label}. Reconcile invoice, staffing, SLA, and change-order drivers before renewal pricing.`,
    `- Fallback: ${profile.recommendedPath.fallbackPath} Keep the competitive event ready until cure evidence is received.`,
    `- Ready for optimization: ${profile.readyForOptimization}`,
    `- Decision owner: ${profile.recommendedPath.decisionOwnerRole}`,
    `- High-priority findings: ${highFindings}`,
    "",
    "## Recommended Path",
    "",
    `- Immediate action: ${profile.recommendedPath.immediateAction}`,
    `- Primary path: ${profile.recommendedPath.primaryPath}`,
    `- Fallback path: ${profile.recommendedPath.fallbackPath}`,
    `- Do not do: ${profile.recommendedPath.doNotDo}`,
    "",
    "## Optimization Findings",
    "",
    ...profile.findings.flatMap((finding, index) => [
      `### Finding ${index + 1}: ${finding.title}`,
      "",
      `- Severity: ${finding.severity}`,
      `- Observed issue: ${finding.currentState}`,
      `- Sourcing implication: ${finding.sourcingImplication}`,
      `- Recommended action: ${finding.recommendedAction}`,
      `- Estimated annual impact: ${money(finding.estimatedAnnualImpactUsd)}`,
      `- Evidence: ${finding.evidenceLabels.join("; ")}`,
      "",
    ]),
    "## Negotiation Levers",
    "",
    ...profile.levers.flatMap((lever, index) => [
      `### Lever ${index + 1}: ${lever.buyerAsk}`,
      "",
      `- Timing: ${urgencyLabel(lever.priority)}`,
      `- Value basis: ${lever.valueBasis.replaceAll("_", " ")}`,
      `- Impact range: ${impactRange(lever.annualImpactLowUsd, lever.annualImpactHighUsd)}`,
      `- Negotiation language: ${lever.negotiationLanguage}`,
      `- Owner role: ${lever.ownerRole}`,
      "",
    ]),
    "## Evidence Caveats",
    "",
    profile.syntheticDemo
      ? "- This proof uses tenant/use-case-specific synthetic demo evidence and must not be represented as a real client contract."
      : "- Client evidence is required for external use.",
    ...profile.clientToComplete.map((gap) => `- Client to complete: ${gap}`),
    profile.clientToComplete.length
      ? ""
      : "- No minimum evidence gaps detected for a draft optimization workshop.",
    "",
    "## CXO Story Contract Validation",
    "",
    storyPack.validation.ok
      ? "- Passed: executive story spine, required visuals, business-impact mapping, prompt packet discipline, and evidence caveats are present."
      : `- Failed: ${[
          ...storyPack.validation.missingStoryElements,
          ...storyPack.validation.missingBusinessImpacts,
          ...storyPack.validation.missingExhibits,
          ...storyPack.validation.missingPromptPacketKeys,
          ...storyPack.validation.pageFailures,
        ].join("; ")}`,
  ].join("\n");
}
