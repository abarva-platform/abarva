import type { CxoCanvasPayload } from "@/lib/cxo-canvas/canvasTypes";
import type { ParsedIntelligenceTab } from "@/lib/intelligence/tabbed-response";
import {
  buildFastCanvasAnalytics,
  INDUSTRIAL_DEMO_PORTFOLIO_CANDIDATES,
  SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES,
  type CanvasAnalyticsIntent,
  type FastCanvasAnalyticsPayload,
  type IntelligencePortfolioCandidate,
  type RankedPortfolioCandidate,
} from "./portfolio";

type DemoTenant = "airline" | "industrial";

interface PendingCanvasFrame {
  decision: string;
  industry: string;
  table: string;
  evidence: string;
  canvas: CxoCanvasPayload;
}

export function buildPendingIntelligenceCanvasTabs({
  tenantKey,
  question,
}: {
  tenantKey: string;
  question: string;
}): ParsedIntelligenceTab[] {
  const demoTenant = classifyDemoTenant(tenantKey, question);
  if (!demoTenant) return [];
  const frame = buildPendingCanvasFrame({
    tenant: demoTenant,
    intent: choosePendingCanvasIntent(question),
  });
  return buildFastCanvasTabs(frame);
}

export function buildPendingCanvasFrame({
  tenant,
  intent,
}: {
  tenant: DemoTenant;
  intent: CanvasAnalyticsIntent;
}): PendingCanvasFrame {
  const isAirline = tenant === "airline";
  const titlePrefix = isAirline
    ? "Building airline AI decision frame"
    : "Building industrial back-office decision frame";
  const candidates = demoCandidatesFor(tenant);
  const analytics = buildFastCanvasAnalytics(candidates, {
    title: canvasTitleForIntent(titlePrefix, intent),
    intent,
    decisionRequired: isAirline
      ? "Name the data gate owner and block scale capital where operational data is uncertified."
      : "Approve one lighthouse value-office lane and require control evidence before scale funding.",
  });

  return {
    decision: decisionTextFor(tenant, analytics),
    industry: industryTextFor(tenant),
    table: portfolioTable(analytics.rankedCandidates),
    evidence: evidenceTextFor(tenant, analytics),
    canvas: analytics.canvas,
  };
}

function classifyDemoTenant(
  tenantKey: string,
  question: string,
): DemoTenant | null {
  const text = `${tenantKey} ${question}`.toLowerCase();
  if (
    /skyharbor|airline|irops|crew|disruption|predictive|maintenance|loyalty|passenger/.test(
      text,
    )
  ) {
    return "airline";
  }
  if (
    /lakeshore|industrial|morgan|hr|legal|treasury|kyriba|finance|fp&a|shared services|back[- ]office|copilot/.test(
      text,
    )
  ) {
    return "industrial";
  }
  return null;
}

function choosePendingCanvasIntent(question: string): CanvasAnalyticsIntent {
  if (
    /\b(?:trust|governance|proof|evidence\s+quality|evidence|assumption|missing|signoff|sign-off|validate|validated|board[-\s]?grade|board[-\s]?ready)\b/i.test(
      question,
    )
  ) {
    return "proof-boundary-card";
  }
  if (
    /\b(?:what\s+has\s+to\s+happen\s+first|before|prerequisite|dependency|gate|roadmap|unlock)\b/i.test(
      question,
    )
  ) {
    return "gate-to-value-roadmap";
  }
  if (
    /\b(?:portfolio|tradeoff|trade-off|value\s*(?:\/|vs\.?|versus)\s*readiness|readiness|high\s+value|not\s+ready|matrix)\b/i.test(
      question,
    )
  ) {
    return "value-readiness-matrix";
  }
  return "executive-canvas-sequencing";
}

function demoCandidatesFor(
  tenant: DemoTenant,
): IntelligencePortfolioCandidate[] {
  return tenant === "airline"
    ? SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES
    : INDUSTRIAL_DEMO_PORTFOLIO_CANDIDATES;
}

function canvasTitleForIntent(
  titlePrefix: string,
  intent: CanvasAnalyticsIntent,
): string {
  if (intent === "value-readiness-matrix") {
    return `${titlePrefix}: value vs. readiness`;
  }
  if (intent === "gate-to-value-roadmap") {
    return `${titlePrefix}: gate-to-value roadmap`;
  }
  if (intent === "proof-boundary-card") {
    return `${titlePrefix}: proof boundary`;
  }
  return titlePrefix;
}

function decisionTextFor(
  tenant: DemoTenant,
  analytics: FastCanvasAnalyticsPayload,
): string {
  const top = analytics.topRecommendation;
  const topLine = top
    ? `${top.name} is the first deterministic ${top.postureLabel.toLowerCase()} candidate.`
    : "AbarVa is building the initial deterministic decision frame.";
  const lanes = analytics.lanes
    .map((lane) => `${lane.label}: ${lane.candidates.length}`)
    .join("; ");
  const postureText =
    tenant === "airline"
      ? "Use this as the airline AI portfolio frame while the full advisor answer is generated: scale clean customer/crew bets, certify operational recovery, and fund readiness before autonomous IROPS expansion."
      : "Use this as the industrial value-office frame while the full advisor answer is generated: scale Treasury/control automation first, certify Finance and shared-services workflows, and hold broad productivity scale until value proof exists.";
  return [
    `Building decision frame: ${topLine}`,
    postureText,
    `Initial lane distribution: ${lanes}.`,
    `Decision required: ${analytics.decisionRequired}`,
  ].join("\n\n");
}

function industryTextFor(tenant: DemoTenant): string {
  if (tenant === "airline") {
    return "Industry context: airline AI value tends to concentrate in disruption recovery, crew utilization, maintenance avoidance, and customer re-accommodation, but regulated operational decisions need certified data and human-in-loop controls before scale.";
  }
  return "Industry context: industrial back-office AI usually works best when automation is tied to control evidence, service-line ownership, and measurable cycle-time or working-capital outcomes, not generic assistant adoption.";
}

function evidenceTextFor(
  tenant: DemoTenant,
  analytics: FastCanvasAnalyticsPayload,
): string {
  const domain = tenant === "airline" ? "airline" : "Industrial/Morgan Street";
  const gaps = analytics.keyProofGaps.length
    ? analytics.keyProofGaps.slice(0, 4).join(" ")
    : "No major proof gap surfaced in the deterministic fast canvas.";
  return [
    `Fast canvas uses the loaded ${domain} decision packet and deterministic AbarVa analytics.`,
    "Treat it as the initial exhibit until the advisor response finishes and refines sequencing, gates, and owners.",
    `Proof focus: ${gaps}`,
  ].join("\n\n");
}

function portfolioTable(items: RankedPortfolioCandidate[]): string {
  const rows = items.map((item) => {
    const gate = gateTextFor(item).replace(/\|/g, "/");
    return [
      item.name.replace(/\|/g, "/"),
      item.postureLabel,
      `${item.valueScore}/${item.readinessScore}/${item.riskScore}`,
      `${item.proofScore}`,
      gate,
    ].join(" | ");
  });
  return [
    "| Initiative | Fast posture | Value / Readiness / Risk | Proof | Gate |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row} |`),
  ].join("\n");
}

function gateTextFor(item: RankedPortfolioCandidate): string {
  const gates: string[] = [];
  if (!item.ownerKnown) gates.push("owner");
  if (!item.controlKnown) gates.push("control");
  if (!item.baselineKnown) gates.push("baseline");
  if (!item.dependenciesKnown) gates.push("dependencies");
  return gates.length
    ? `Close ${gates.join(", ")} proof`
    : "Maintain proof and control signoff";
}

function buildFastCanvasTabs({
  decision,
  industry,
  table,
  evidence,
  canvas,
}: PendingCanvasFrame): ParsedIntelligenceTab[] {
  return [
    {
      id: "decision",
      label: "Decision",
      grounding: "tenant-evidence",
      content: decision,
    },
    {
      id: "industry_insights",
      label: "Industry Insights",
      grounding: "industry-context",
      content: industry,
    },
    {
      id: "chart",
      label: "Chart",
      grounding: "mixed",
      content: [
        "Initial decision exhibit while aVa completes the model-grounded advisor answer.",
        "",
        "```abarva-canvas",
        JSON.stringify(canvas),
        "```",
      ].join("\n"),
    },
    {
      id: "table",
      label: "Table",
      grounding: "tenant-evidence",
      content: table,
    },
    {
      id: "evidence",
      label: "Evidence",
      grounding: "mixed",
      content: evidence,
    },
  ];
}
