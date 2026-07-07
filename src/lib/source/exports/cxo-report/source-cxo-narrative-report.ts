import "server-only";

import type {
  DealPackArtifact,
  DealPackInput,
} from "../deal-pack/stage-sections";
import {
  getSourceArtifactStandard,
  type SourceArtifactKind,
} from "../artifact-standards";
import { buildSourceJudgmentFromDealPack } from "../../expert-judgment/source-judgment-kernel";
import { sourceJudgmentVerdictLabel } from "../../expert-judgment/source-judgment-rules";
import type { SourceJudgment } from "../../expert-judgment/source-judgment-types";

export type SourceCxoSlideKind =
  | "cover"
  | "answer"
  | "why-now"
  | "path"
  | "economics"
  | "vendor-field"
  | "commercial-risk"
  | "renewal"
  | "evidence"
  | "asks";

export interface SourceCxoMetric {
  label: string;
  value: string;
  note: string;
  status?: "good" | "warn" | "bad" | "neutral";
}

export interface SourceCxoTable {
  title: string;
  columns: ReadonlyArray<string>;
  rows: ReadonlyArray<ReadonlyArray<string>>;
}

export interface SourceCxoSlide {
  id: string;
  kind: SourceCxoSlideKind;
  title: string;
  message: string;
  proofLabel: string;
  metrics: ReadonlyArray<SourceCxoMetric>;
  table?: SourceCxoTable;
  notes: ReadonlyArray<string>;
}

export interface SourceArtifactCoverage {
  artifactCode: string;
  artifactTitle: string;
  artifactKind: SourceArtifactKind | "unknown";
  stage: number;
  stageTitle: string;
  status: "authored" | "scaffold" | "missing";
  decisionJob: string;
  minimumScore: number | null;
}

export interface SourceCxoNarrativeReport {
  tenantName: string;
  eventCode: string;
  eventName: string;
  generatedAt: string;
  verdict: string;
  verdictDetail: string;
  audience: string;
  artifactCoverage: ReadonlyArray<SourceArtifactCoverage>;
  slides: ReadonlyArray<SourceCxoSlide>;
}

export function buildSourceCxoNarrativeReport(
  input: DealPackInput,
): SourceCxoNarrativeReport {
  const coverage = input.stages.flatMap((stage) =>
    stage.artifacts.map((artifact) =>
      artifactCoverage(stage.stage, stage.title, artifact),
    ),
  );
  const judgment = buildSourceJudgmentFromDealPack(input);
  const decision = synthesizeDecision(input, judgment);
  const authoredCount = coverage.filter((a) => a.status === "authored").length;
  const missingCount = coverage.filter((a) => a.status === "missing").length;
  const scaffoldCount = coverage.filter((a) => a.status === "scaffold").length;
  const evidenceCount = input.evidence.length;
  const gateCount = input.gateCriteria.length;
  const valueLabel = fmtUsd(input.estimatedValueUsd);
  const stageLabel = `Stage ${stageNumberFor(input.currentStageKey)} · ${stageTitleFor(input.currentStageKey)}`;
  const renewal = findStructured(input, "renewal-decision");
  const tco = findStructured(input, "tco-iceberg");
  const scorecard = findStructured(input, "scorecard");
  const pricingComparison = findStructured(input, "pricing-comparison");
  const aiClause = findStructured(input, "ai-clause-gap");
  const vendorRisk = findArtifact(input, "dx6b_vendor_risk_pack");

  const slides: SourceCxoSlide[] = [
    {
      id: "cover",
      kind: "cover",
      title: `${input.eventName}`,
      message:
        "CXO narrative report for the Source event. The deck tells the executive story; the Deal Pack remains the audit appendix.",
      proofLabel: "Event snapshot",
      metrics: [
        { label: "Company", value: input.tenantName, note: input.eventCode },
        { label: "Status", value: input.eventStatus, note: stageLabel },
        {
          label: "Estimated value",
          value: valueLabel,
          note: "From source event substrate",
        },
        {
          label: "Generated",
          value: input.generatedAt.slice(0, 10),
          note: "System-generated report",
        },
      ],
      notes: [
        "Use this report for CXO readout; use the Source Deal Pack for detailed audit and artifact review.",
      ],
    },
    {
      id: "answer",
      kind: "answer",
      title: "Executive answer",
      message: decision.answer,
      proofLabel: "Decision frame",
      metrics: [
        {
          label: "Verdict",
          value: decision.verdict,
          note: decision.confidence,
          status: decision.status,
        },
        {
          label: "Financial impact",
          value: valueLabel,
          note: "Do not treat as approved value unless evidence supports it",
        },
        {
          label: "Current stage",
          value: stageLabel,
          note: "Where the event sits today",
        },
        {
          label: "Open gaps",
          value: String(missingCount + scaffoldCount),
          note: `${missingCount} missing · ${scaffoldCount} scaffold`,
          status: missingCount ? "warn" : "neutral",
        },
      ],
      table: {
        title: "What the executive is being asked to decide",
        columns: ["Decision area", "Answer", "Why it matters"],
        rows: [
          [
            "Recommended action",
            decision.answer,
            "Keeps the event from becoming activity without a decision.",
          ],
          [
            "What would change the answer",
            decision.changeTrigger,
            "Forces the expert challenge to be explicit.",
          ],
          [
            "Next gate",
            decision.nextStep,
            "Turns the deck into operating action.",
          ],
        ],
      },
      notes: [decision.detail],
    },
    {
      id: "why-now",
      kind: "why-now",
      title: "Why this matters now",
      message: `The event is in ${stageLabel}; the CXO question is whether to keep moving, stop, or change the sourcing path before commercial leverage decays.`,
      proofLabel: "Timing and readiness",
      metrics: [
        {
          label: "Artifacts authored",
          value: `${authoredCount}/${coverage.length}`,
          note: "Artifact coverage across Source lifecycle",
        },
        {
          label: "Evidence rows",
          value: String(evidenceCount),
          note: "Rows available in the evidence ledger",
        },
        {
          label: "Gate decisions",
          value: String(gateCount),
          note: "Recorded stage-gate decisions",
        },
        {
          label: "Owner",
          value: input.eventOwner ?? "Not recorded — seed gap",
          note: "Accountable sponsor / event owner",
          status: input.eventOwner ? "neutral" : "warn",
        },
      ],
      table: coverageTable(coverage),
      notes: [
        "A CXO report should not hide lifecycle gaps; incomplete stages are named rather than inferred.",
      ],
    },
    {
      id: "path",
      kind: "path",
      title: "Source path and operating shape",
      message:
        "The sourcing path is credible only if demand, approach, market, scope, pricing, evaluation, risk and renewal artifacts line up.",
      proofLabel: "Lifecycle coverage",
      metrics: stageMetrics(input),
      table: {
        title: "Lifecycle stage read",
        columns: ["Stage", "Intent", "Artifact state"],
        rows: input.stages.map((s) => [
          `Stage ${s.stage} · ${s.title}`,
          s.intent,
          summarizeStage(s.artifacts),
        ]),
      },
      notes: [
        "This slide is intentionally stage-based: it checks process completeness before recommending commercial action.",
      ],
    },
    {
      id: "economics",
      kind: "economics",
      title: "Economics and commercial defensibility",
      message: buildEconomicsMessage(tco, pricingComparison, valueLabel),
      proofLabel: "Commercial proof object",
      metrics: economicsMetrics(tco, pricingComparison, valueLabel),
      table: economicsTable(tco, pricingComparison),
      notes: [
        "The report never converts missing vendor submissions into claimed savings.",
      ],
    },
    {
      id: "vendor-field",
      kind: "vendor-field",
      title: "Vendor field and evaluation posture",
      message: buildVendorMessage(scorecard),
      proofLabel: "Vendor comparison",
      metrics: vendorMetrics(scorecard),
      table: vendorTable(scorecard),
      notes: [
        "A CXO should see which options are credible and why the losing paths lose.",
      ],
    },
    {
      id: "commercial-risk",
      kind: "commercial-risk",
      title: "Commercial, legal and AI risk",
      message: buildRiskMessage(aiClause, vendorRisk),
      proofLabel: "Risk controls",
      metrics: riskMetrics(aiClause, vendorRisk),
      table: riskTable(aiClause, vendorRisk),
      notes: ["Risk is treated as decision logic, not appendix decoration."],
    },
    {
      id: "renewal",
      kind: "renewal",
      title: "Renewal, SRM and negotiation posture",
      message: buildRenewalMessage(renewal),
      proofLabel: "Renewal decision",
      metrics: renewalMetrics(renewal),
      table: renewalTable(renewal),
      notes: [
        "If the event is not a renewal, this slide still names that the SRM/renewal substrate is not the decision driver.",
      ],
    },
    {
      id: "evidence",
      kind: "evidence",
      title: "Evidence, assumptions and gaps",
      message: `${evidenceCount} evidence row(s), ${gateCount} gate decision(s), and ${missingCount} missing artifact(s) define what can be claimed today.`,
      proofLabel: "Audit ledger",
      metrics: [
        {
          label: "Evidence rows",
          value: String(evidenceCount),
          note: "From event evidence ledger",
        },
        {
          label: "Gate decisions",
          value: String(gateCount),
          note: "From stage-gate records",
        },
        {
          label: "Missing artifacts",
          value: String(missingCount),
          note: "Shown as gaps, not inferred",
          status: missingCount ? "warn" : "good",
        },
        {
          label: "Scaffolds",
          value: String(scaffoldCount),
          note: "Generated but not authored/sign-off",
        },
      ],
      table: evidenceTable(input),
      notes: [
        "This is the governance slide: it tells the CXO where the deck is strong and where it is provisional.",
      ],
    },
    {
      id: "asks",
      kind: "asks",
      title: "Decision asks and next actions",
      message: decision.nextStep,
      proofLabel: "Action register",
      metrics: [
        {
          label: "Primary ask",
          value: decision.verdict,
          note: decision.answer,
        },
        {
          label: "Owner",
          value: input.eventOwner ?? "Not recorded — seed gap",
          note: "Needs explicit accountability",
          status: input.eventOwner ? "neutral" : "warn",
        },
        {
          label: "Next gate",
          value: stageLabel,
          note: "Move only when evidence supports the gate",
        },
        {
          label: "Appendix",
          value: "Source Deal Pack",
          note: "Detailed artifact audit remains available",
        },
      ],
      table: {
        title: "CXO action list",
        columns: ["Action", "Owner", "Condition"],
        rows: [
          [
            decision.nextStep,
            input.eventOwner ?? "Not recorded — seed gap",
            decision.changeTrigger,
          ],
          [
            "Review detailed Source Deal Pack",
            "Sourcing lead",
            "Required before external vendor commitment.",
          ],
          [
            "Close missing evidence / artifact gaps",
            "Event owner",
            `${missingCount + scaffoldCount} open item(s).`,
          ],
        ],
      },
      notes: ["This final slide is the handoff from readout to execution."],
    },
  ];

  return {
    tenantName: input.tenantName,
    eventCode: input.eventCode,
    eventName: input.eventName,
    generatedAt: input.generatedAt,
    verdict: decision.verdict,
    verdictDetail: decision.detail,
    audience: "CXO / CFO / CIO / VP Sourcing",
    artifactCoverage: coverage,
    slides,
  };
}

function artifactCoverage(
  stage: number,
  stageTitle: string,
  artifact: DealPackArtifact,
): SourceArtifactCoverage {
  const artifactKind = artifactKindForCode(artifact.code);
  const standard =
    artifactKind === "unknown" ? null : getSourceArtifactStandard(artifactKind);
  return {
    artifactCode: artifact.code,
    artifactTitle: artifact.title,
    artifactKind,
    stage,
    stageTitle,
    status:
      artifact.kind === "missing"
        ? "missing"
        : artifact.bodyIsAuthored
          ? "authored"
          : "scaffold",
    decisionJob: standard?.decisionJob ?? "No artifact standard mapped yet.",
    minimumScore: standard?.minimumAcceptableScore ?? null,
  };
}

function artifactKindForCode(
  code: string,
): SourceArtifactCoverage["artifactKind"] {
  const map: Record<string, SourceArtifactKind> = {
    dx0_demand_challenge: "demand-challenge",
    dx1_sourcing_approach: "sourcing-approach",
    dx2_market_scan: "market-scan",
    d04_app_inv: "application-inventory",
    d05_scope_memo: "scope-memo",
    d09_rfp_pack: "rfp-package",
    d11_response_checklist: "response-checklist",
    d19_pricing_workbook: "pricing-template",
    d19c_pricing_comparison: "pricing-comparison",
    dx4_tco_iceberg: "tco-iceberg",
    d16_scorecard: "evaluation-scorecard",
    d20_trap_log: "pricing-trap-log",
    d22_bafo_question_pack: "bafo-question-pack",
    d24_decision_brief: "decision-brief",
    d27_selection_memo: "selection-memo",
    dx6a_ai_clause_gap: "ai-clause-gap",
    dx6b_vendor_risk_pack: "vendor-risk-pack",
    dx7_renewal_decision: "renewal-decision",
  };
  return map[code] ?? "unknown";
}

function findArtifact(
  input: DealPackInput,
  code: string,
): DealPackArtifact | null {
  return (
    input.stages.flatMap((s) => s.artifacts).find((a) => a.code === code) ??
    null
  );
}

function findStructured(
  input: DealPackInput,
  kind: string,
): DealPackArtifact | null {
  return (
    input.stages
      .flatMap((s) => s.artifacts)
      .find((a) => a.kind === "structured" && a.structured?.kind === kind) ??
    null
  );
}

function synthesizeDecision(
  input: DealPackInput,
  judgment: SourceJudgment,
): {
  verdict: string;
  answer: string;
  detail: string;
  confidence: string;
  nextStep: string;
  changeTrigger: string;
  status: SourceCxoMetric["status"];
} {
  const selection = findAuthoredBody(input, "d27_selection_memo");
  const renewal = findAuthoredBody(input, "dx7_renewal_decision");
  const decision = findAuthoredBody(input, "d24_decision_brief");
  const demand = findAuthoredBody(input, "dx0_demand_challenge");
  if (judgment.verdict !== "award_ready") {
    const answer = judgment.executiveSummary;
    const nextStep =
      judgment.nextActions[0]?.action ??
      "Close blockers and evidence gaps before supplier commitment.";
    const changeTrigger = judgment.whatWouldChangeTheVerdict.join(" ");
    return {
      verdict: sourceJudgmentVerdictLabel(judgment.verdict),
      answer,
      detail: [
        judgment.rationale.join(" "),
        judgment.blockers.length > 0
          ? `Open blockers: ${judgment.blockers.map((blocker) => blocker.description).join(" ")}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      confidence: `${capitalize(judgment.confidence)} — Source expert judgment kernel`,
      nextStep,
      changeTrigger,
      status: judgment.verdict === "do_not_award_yet" ? "bad" : "warn",
    };
  }
  if (selection) {
    const awardStageReached =
      input.currentStageKey === "executive_decision" ||
      input.currentStageKey === "transition" ||
      input.currentStageKey === "value";
    if (awardStageReached) {
      return {
        verdict: "Award / proceed",
        answer: firstDecisionSentence(
          selection,
          "Selection memo is authored; proceed with controlled award path.",
        ),
        detail:
          "Selection memo is the strongest decision artifact in the Source lifecycle.",
        confidence: "High — selection memo authored",
        nextStep: "Mobilize transition, contract controls and SRM commitments.",
        changeTrigger:
          "Material legal, pricing or transition exception before signature.",
        status: "good",
      };
    }
    return {
      verdict: `Pending — ${stageTitleFor(input.currentStageKey)}`,
      answer: firstDecisionSentence(
        selection,
        "Selection memo is authored but the event has not reached the executive decision gate; treat as provisional.",
      ),
      detail:
        "Selection memo is authored, but the stage gate for award has not been reached; verdict must match evidence depth.",
      confidence:
        "Medium — selection memo authored, executive decision gate not reached",
      nextStep:
        "Advance the event through the remaining stage gates before committing to award.",
      changeTrigger:
        "Reaching the executive decision gate without material legal, pricing or transition exceptions.",
      status: "warn",
    };
  }
  if (renewal) {
    return {
      verdict: "Renewal posture set",
      answer: firstHeading(
        renewal,
        "Renewal posture is authored; execute before the notice window closes.",
      ),
      detail:
        "Renewal decision is authored and should be converted into negotiation / SRM action.",
      confidence: "Medium-high — renewal artifact authored",
      nextStep: "Enact the renewal posture and track SRM/Tower follow-up.",
      changeTrigger:
        "Vendor terms, usage, benchmark or alternative changes before signature.",
      status: "warn",
    };
  }
  if (decision) {
    return {
      verdict: "Recommendation drafted",
      answer: firstHeading(
        decision,
        "Decision brief is authored; close traps before sponsor approval.",
      ),
      detail:
        "Decision brief is present, but final selection memo is not yet the controlling artifact.",
      confidence: "Medium — decision brief authored",
      nextStep: "Run BAFO / close traps, then prepare selection memo.",
      changeTrigger:
        "Unresolved P0 trap, pricing exception or risk clause gap.",
      status: "warn",
    };
  }
  if (demand) {
    return {
      verdict: "Demand challenged",
      answer: firstHeading(
        demand,
        "Demand challenge is authored; choose sourcing path before scope/RFP.",
      ),
      detail: "The event is still early; do not imply a sourcing outcome yet.",
      confidence: "Low-medium — demand stage only",
      nextStep: "Approve sourcing approach and market scan.",
      changeTrigger:
        "Demand is invalidated by existing contract, overlap or weak business case.",
      status: "warn",
    };
  }
  return {
    verdict: "Recommendation pending",
    answer:
      "Recommendation pending — lifecycle artifacts are not sufficiently authored to make a CXO decision.",
    detail:
      "The report is usable as a readiness readout, not as a decision recommendation.",
    confidence: "Low — no authored decision artifact",
    nextStep:
      "Author the next stage artifact and close evidence gaps before a CXO readout.",
    changeTrigger:
      "Authoring a demand challenge, decision brief, selection memo or renewal decision.",
    status: "bad",
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function firstDecisionSentence(markdown: string, fallback: string): string {
  const normalized = markdown
    .replace(/^#{1,6}\s+.+$/gm, "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
  const sentence = normalized.match(/[^.!?]+[.!?]/)?.[0]?.trim();
  return sentence || firstHeading(markdown, fallback);
}

function findAuthoredBody(input: DealPackInput, code: string): string | null {
  const artifact = findArtifact(input, code);
  if (artifact?.kind === "narrative" && artifact.bodyMarkdown?.trim()) {
    return artifact.bodyMarkdown;
  }
  const state = input.artifactStates.find((a) => a.artifactCode === code);
  return state?.body?.trim() || null;
}

function firstHeading(markdown: string, fallback: string): string {
  const match = markdown.match(/^#{1,3}\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  return (
    markdown
      .split("\n")
      .find((line) => line.trim())
      ?.slice(0, 140) ?? fallback
  );
}

function coverageTable(
  coverage: ReadonlyArray<SourceArtifactCoverage>,
): SourceCxoTable {
  return {
    title: "Artifact quality coverage",
    columns: ["Artifact", "Stage", "Status", "Minimum bar"],
    rows: coverage.map((a) => [
      a.artifactTitle,
      `Stage ${a.stage} · ${a.stageTitle}`,
      a.status,
      a.minimumScore == null ? "No standard mapped" : `${a.minimumScore}/100`,
    ]),
  };
}

function stageMetrics(input: DealPackInput): SourceCxoMetric[] {
  return input.stages.slice(0, 4).map((stage) => ({
    label: `Stage ${stage.stage}`,
    value: stage.title,
    note: summarizeStage(stage.artifacts),
    status: stage.artifacts.some((a) => a.kind !== "missing")
      ? "neutral"
      : "warn",
  }));
}

function summarizeStage(artifacts: ReadonlyArray<DealPackArtifact>): string {
  const authored = artifacts.filter(
    (a) => a.kind !== "missing" && a.bodyIsAuthored,
  ).length;
  const scaffold = artifacts.filter(
    (a) => a.kind !== "missing" && !a.bodyIsAuthored,
  ).length;
  const missing = artifacts.filter((a) => a.kind === "missing").length;
  return `${authored} authored · ${scaffold} scaffold · ${missing} missing`;
}

function buildEconomicsMessage(
  tco: DealPackArtifact | null,
  pricing: DealPackArtifact | null,
  valueLabel: string,
): string {
  if (tco?.kind === "structured")
    return `Economics are grounded by the TCO artifact; estimated value is ${valueLabel}.`;
  if (pricing?.kind === "structured")
    return `Pricing comparison is available, but TCO may still need hidden-cost coverage; estimated value is ${valueLabel}.`;
  return `Economics are not yet board-defensible; estimated value is ${valueLabel}, but pricing/TCO artifacts are missing or scaffolded.`;
}

function economicsMetrics(
  tco: DealPackArtifact | null,
  pricing: DealPackArtifact | null,
  valueLabel: string,
): SourceCxoMetric[] {
  return [
    {
      label: "Estimated value",
      value: valueLabel,
      note: "From source event substrate",
    },
    {
      label: "TCO artifact",
      value: statusLabel(tco),
      note: "Hidden cost coverage",
      status: statusMetric(tco),
    },
    {
      label: "Pricing comparison",
      value: statusLabel(pricing),
      note: "Vendor commercial normalization",
      status: statusMetric(pricing),
    },
    {
      label: "Board claim",
      value: tco || pricing ? "Provisional" : "Not defensible",
      note: "Must match evidence depth",
      status: tco || pricing ? "warn" : "bad",
    },
  ];
}

function economicsTable(
  tco: DealPackArtifact | null,
  pricing: DealPackArtifact | null,
): SourceCxoTable {
  return {
    title: "Commercial evidence check",
    columns: ["Proof object", "State", "CXO implication"],
    rows: [
      [
        "Pricing comparison",
        statusLabel(pricing),
        pricing
          ? "Can compare supplier economics."
          : "Cannot claim supplier economics.",
      ],
      [
        "TCO iceberg",
        statusLabel(tco),
        tco
          ? "Can discuss hidden cost layers."
          : "Hidden costs must not be implied.",
      ],
      [
        "Savings claim",
        tco || pricing ? "Provisional" : "Blocked",
        "Only claim when pricing/TCO evidence exists.",
      ],
    ],
  };
}

function buildVendorMessage(scorecard: DealPackArtifact | null): string {
  if (scorecard?.kind === "structured")
    return "Vendor recommendation is backed by a scored evaluation artifact.";
  return "Vendor recommendation is not yet supported by a scored evaluation artifact.";
}

function vendorMetrics(scorecard: DealPackArtifact | null): SourceCxoMetric[] {
  return [
    {
      label: "Scorecard",
      value: statusLabel(scorecard),
      note: "Weighted vendor evaluation",
      status: statusMetric(scorecard),
    },
    {
      label: "Decision quality",
      value: scorecard ? "Comparable" : "Incomplete",
      note: "Do vendors have a common yardstick?",
    },
    {
      label: "Losing logic",
      value: scorecard ? "Traceable" : "Not yet traceable",
      note: "Why alternatives lose",
    },
    {
      label: "Bias risk",
      value: scorecard ? "Controlled" : "Open",
      note: "Without scorecard, narrative can dominate evidence",
    },
  ];
}

function vendorTable(scorecard: DealPackArtifact | null): SourceCxoTable {
  return {
    title: "Vendor decision readiness",
    columns: ["Question", "Readout", "Required action"],
    rows: [
      [
        "Are vendors scored consistently?",
        statusLabel(scorecard),
        scorecard ? "Review weighting." : "Complete scorecard.",
      ],
      [
        "Can we explain losers?",
        scorecard ? "Yes, if scorecard is complete." : "No.",
        "Document losing logic.",
      ],
      [
        "Can we move to award?",
        scorecard ? "Only after traps/BAFO close." : "No.",
        "Close evaluation artifact.",
      ],
    ],
  };
}

function buildRiskMessage(
  aiClause: DealPackArtifact | null,
  vendorRisk: DealPackArtifact | null,
): string {
  if (aiClause || vendorRisk)
    return "Risk is visible enough for executive review, but open clause/risk gaps must control the signature path.";
  return "Risk is not yet executive-ready; AI clause and vendor risk artifacts are missing or scaffolded.";
}

function riskMetrics(
  aiClause: DealPackArtifact | null,
  vendorRisk: DealPackArtifact | null,
): SourceCxoMetric[] {
  return [
    {
      label: "AI clause gap",
      value: statusLabel(aiClause),
      note: "Data/model contract controls",
      status: statusMetric(aiClause),
    },
    {
      label: "Vendor risk pack",
      value: statusLabel(vendorRisk),
      note: "Operational and supplier risk",
      status: statusMetric(vendorRisk),
    },
    {
      label: "Signature posture",
      value: aiClause || vendorRisk ? "Conditional" : "Blocked",
      note: "Risk controls must gate signature",
    },
    {
      label: "Auditability",
      value: aiClause || vendorRisk ? "Partial" : "Weak",
      note: "Risk evidence depth",
    },
  ];
}

function riskTable(
  aiClause: DealPackArtifact | null,
  vendorRisk: DealPackArtifact | null,
): SourceCxoTable {
  return {
    title: "Risk controls before commitment",
    columns: ["Risk lane", "State", "Decision use"],
    rows: [
      [
        "AI/data clauses",
        statusLabel(aiClause),
        aiClause ? "Gate contract redlines." : "Do not sign AI scope.",
      ],
      [
        "Vendor operational risk",
        statusLabel(vendorRisk),
        vendorRisk ? "Gate transition and controls." : "Complete risk pack.",
      ],
      [
        "Executive override",
        "Allowed only with named risk owner",
        "Creates audit trail.",
      ],
    ],
  };
}

function buildRenewalMessage(renewal: DealPackArtifact | null): string {
  if (renewal?.kind === "structured")
    return "Renewal posture is explicit; convert it into negotiation and SRM/Tower actions.";
  return "Renewal is not the controlling event path yet, or renewal substrate is not loaded.";
}

function renewalMetrics(renewal: DealPackArtifact | null): SourceCxoMetric[] {
  return [
    {
      label: "Renewal decision",
      value: statusLabel(renewal),
      note: "Stage 7 artifact",
      status: statusMetric(renewal),
    },
    {
      label: "Auto-renewal trap",
      value: renewal ? "Tested" : "Not tested",
      note: "Requires notice-window evidence",
    },
    {
      label: "Negotiation posture",
      value: renewal ? "Available" : "Not recorded",
      note: "Commercial stance",
    },
    {
      label: "SRM handoff",
      value: renewal ? "Available" : "Not recorded",
      note: "Tower follow-up",
    },
  ];
}

function renewalTable(renewal: DealPackArtifact | null): SourceCxoTable {
  return {
    title: "Renewal and SRM action",
    columns: ["Question", "State", "CXO implication"],
    rows: [
      [
        "Is there an explicit posture?",
        statusLabel(renewal),
        renewal
          ? "Act before notice window."
          : "Do not let contract renew silently.",
      ],
      [
        "Is negotiation posture named?",
        renewal ? "Yes" : "No",
        renewal
          ? "Use posture in vendor discussion."
          : "Generate renewal decision artifact.",
      ],
      [
        "Is Tower/SRM handoff present?",
        renewal ? "Yes" : "No",
        "Track value after decision.",
      ],
    ],
  };
}

function evidenceTable(input: DealPackInput): SourceCxoTable {
  return {
    title: "Evidence ledger sample",
    columns: ["Requirement", "State", "Source", "Note"],
    rows:
      input.evidence.length === 0
        ? [
            [
              "No evidence rows",
              "Not recorded — seed gap",
              "—",
              "Evidence ledger must be loaded before external readout.",
            ],
          ]
        : input.evidence
            .slice(0, 6)
            .map((e) => [
              e.requirementId,
              e.currentState ?? "Not recorded — seed gap",
              e.sourceArtifactId ?? "Not recorded — seed gap",
              e.notes ?? "—",
            ]),
  };
}

function statusLabel(artifact: DealPackArtifact | null): string {
  if (!artifact || artifact.kind === "missing") return "Missing";
  return artifact.bodyIsAuthored ? "Authored" : "Scaffold";
}

function statusMetric(
  artifact: DealPackArtifact | null,
): SourceCxoMetric["status"] {
  if (!artifact || artifact.kind === "missing") return "bad";
  return artifact.bodyIsAuthored ? "good" : "warn";
}

function stageNumberFor(stageKey: DealPackInput["currentStageKey"]): number {
  switch (stageKey) {
    case "strategy":
      return 1;
    case "scope":
    case "rfp":
      return 3;
    case "responses":
    case "pricing":
      return 4;
    case "evaluation":
    case "bafo":
    case "executive_decision":
    case "selection":
      return 5;
    case "transition":
    case "value":
      return 7;
    default:
      return 1;
  }
}

function stageTitleFor(stageKey: DealPackInput["currentStageKey"]): string {
  const n = stageNumberFor(stageKey);
  const map: Record<number, string> = {
    1: "Sourcing Strategy",
    3: "Scope & RFP",
    4: "Pricing & TCO",
    5: "Evaluation / BAFO / Decision",
    7: "SRM & Renewal",
  };
  return map[n] ?? "Sourcing Strategy";
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "Not recorded — seed gap";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}
