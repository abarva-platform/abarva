import "server-only";

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
  type VendorBafoInstructionPack,
  type VendorChallengeIntelligence,
  type VendorEvaluationDecisionView,
  type VendorEvaluationScorecardRow,
  type VendorResponseProfile,
} from "@/lib/source/proposal-intelligence";
import type { NarrativeDocxPayload } from "../renderers/narrative-docx";

export const DECISION_BRIEF_REQUIRED_SECTIONS = [
  "Executive Recommendation",
  "Vendor Ranking and Readiness",
  "Weighted Evaluation Scorecard",
  "Normalized Vendor Comparison",
  "Executive Tradeoff Summary",
  "BAFO Improvement Scenario",
  "Vendor-Specific BAFO Conditions",
  "Unresolved Risks and Evidence Gaps",
  "Decision Required",
  "Evidence / Source Note",
] as const;

export const DECISION_BRIEF_FORBIDDEN_PATTERNS = [
  /SkyHarbor Air/i,
  /SkyHarbor/i,
  /SKYH-NORMALIZE/i,
  /Atlas/i,
  /Sentinel/i,
  /Steward/i,
  /Steward sign-off/i,
  /Atlas Decision Brief/i,
  /Sentinel Risk Attestation/i,
  /Lead agent/i,
  /Owner role/i,
  /Template scaffold/i,
  /body has not been authored/i,
  /replace with the actual authored content/i,
  /source_events/i,
  /Sourcing Artifacts/i,
  /Mode:/i,
  /Current state:/i,
  /sourceDoc/i,
  /canonicalization_pending/i,
] as const;

const DISPLAY_EVENT = {
  accountName: "Airline Demo",
  code: "SKYH-AMS-RFP-2026",
  name: "Airline Demo AMS Outsourcing RFP",
  title: "Airline Demo AMS Outsourcing RFP - Evaluation Decision Brief",
  subtitle: "Vendor comparison, BAFO posture, and executive decision recommendation",
};

export function buildDecisionBriefPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): NarrativeDocxPayload {
  const display = normalizeDecisionBriefEventDisplay(ctx);
  const profiles = buildVendorResponseMveProfiles({
    id: ctx.event.id,
    code: display.code,
    name: display.name,
    accountName: display.accountName,
  });
  const challengeIntelligence = buildVendorChallengeIntelligence(profiles);
  const bafoPack = buildVendorBafoInstructionPack(challengeIntelligence);
  const decisionView = buildVendorEvaluationDecisionView(
    profiles,
    challengeIntelligence,
    bafoPack,
  );

  if (profiles && challengeIntelligence && bafoPack && decisionView) {
    const body = buildEvaluationDecisionBriefMarkdown({
      decisionView,
      challengeIntelligence,
      bafoPack,
      profiles: profiles.profiles,
      generatedAt,
    });
    assertDecisionBriefExportQuality(body);
    return {
      tenantName: display.accountName,
      eventCode: display.code,
      eventName: DISPLAY_EVENT.title,
      issuedBy: "AbarVa Source",
      generatedAt,
      body,
      bodyIsAuthored: true,
    };
  }

  const authoredBody = ctx.artifactStates
    .find((artifact) => artifact.artifactCode === "d24_decision_brief")
    ?.body?.trim();
  if (authoredBody) {
    assertDecisionBriefExportQuality(authoredBody);
    return {
      tenantName: display.accountName,
      eventCode: display.code,
      eventName: DISPLAY_EVENT.title,
      issuedBy: "AbarVa Source",
      generatedAt,
      body: authoredBody,
      bodyIsAuthored: true,
    };
  }

  throw new Error(
    "d24_decision_brief export blocked: authored evaluation decision content is required before export.",
  );
}

export function normalizeDecisionBriefEventDisplay(
  ctx: Pick<SourceGenerationContext, "tenantName" | "event">,
): { accountName: string; code: string; name: string } {
  const raw = [
    ctx.tenantName,
    ctx.event.code,
    ctx.event.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("skyh") || raw.includes("airline demo")) {
    return {
      accountName: DISPLAY_EVENT.accountName,
      code: DISPLAY_EVENT.code,
      name: DISPLAY_EVENT.name,
    };
  }

  return {
    accountName: ctx.tenantName,
    code: ctx.event.code,
    name: ctx.event.name,
  };
}

export function buildEvaluationDecisionBriefMarkdown(args: {
  decisionView: VendorEvaluationDecisionView;
  challengeIntelligence: VendorChallengeIntelligence;
  bafoPack: VendorBafoInstructionPack;
  profiles: VendorResponseProfile[];
  generatedAt: string;
}): string {
  const orderedSummaries = [...args.decisionView.vendorSummaries].sort(
    (a, b) => a.rank - b.rank,
  );
  const vendorLabels = new Map(
    args.profiles.map((profile) => [profile.vendorId, displayVendor(profile)]),
  );

  const body = [
    `# ${DISPLAY_EVENT.title}`,
    "",
    `_${DISPLAY_EVENT.subtitle}_`,
    "",
    `Prepared for ${DISPLAY_EVENT.accountName}. Generated ${args.generatedAt}.`,
    "",
    "## Executive Recommendation",
    "",
    "> **Recommendation:** Advance Vendor A as the risk-adjusted BAFO lead, keep Vendor C in the finalist lane as the service-accountability challenger, and keep Vendor B as a price benchmark only if it cures the named execution and commercial gaps.",
    "",
    cleanText(args.decisionView.finalistRecommendation),
    "",
    "The brief is structured for an executive decision meeting: first the recommendation, then the ranking logic, then the score basis, then the BAFO conditions that could change the outcome.",
    "",
    "## Vendor Ranking and Readiness",
    "",
    table(
      [
        "Rank",
        "Vendor",
        "Score",
        "Readiness",
        "BAFO role",
        "Executive implication",
      ],
      orderedSummaries.map((summary) => [
        String(summary.rank),
        labelForVendor(summary.vendorId, vendorLabels),
        `${summary.weightedScore.toFixed(1)}/10`,
        titleCase(summary.readiness),
        cleanText(summary.finalistPosture),
        executiveImplicationFor(summary.rank),
      ]),
    ),
    "",
    vendorRankingCards(orderedSummaries, vendorLabels),
    "",
    "## Weighted Evaluation Scorecard",
    "",
    args.decisionView.scoringTransparency.map((item) => `- ${item}`).join("\n"),
    "",
    table(
      [
        "Criterion",
        "Weight",
        "Vendor A",
        "Vendor B",
        "Vendor C",
      ],
      args.decisionView.scorecardRows.map((row) =>
        scorecardTableRow(row, vendorLabels),
      ),
    ),
    "",
    "Scorecard rationale:",
    "",
    args.decisionView.scorecardRows
      .map((row) => scorecardRationale(row, vendorLabels))
      .join("\n"),
    "",
    "## Normalized Vendor Comparison",
    "",
    table(
      [
        "Dimension",
        "Vendor A",
        "Vendor B",
        "Vendor C",
        "Decision use",
      ],
      args.decisionView.comparisonRows.map((row) => [
        row.label,
        valueForVendor(row.values, "Vendor A", vendorLabels),
        valueForVendor(row.values, "Vendor B", vendorLabels),
        valueForVendor(row.values, "Vendor C", vendorLabels),
        cleanText(row.decisionUse),
      ]),
    ),
    "",
    "## Executive Tradeoff Summary",
    "",
    args.decisionView.executiveTradeoffs
      .map((tradeoff) => `- ${cleanText(tradeoff)}`)
      .join("\n"),
    "",
    "## BAFO Improvement Scenario",
    "",
    table(
      [
        "Vendor",
        "Current score",
        "Potential score",
        "Score movement",
        "BAFO cure",
        "Required evidence",
        "Decision impact",
      ],
      args.decisionView.scoreImprovementScenarios.map((scenario) => [
        labelForVendor(scenario.vendorId, vendorLabels),
        scenario.currentScore.toFixed(1),
        scenario.potentialScore.toFixed(1),
        `+${scenario.scoreDelta.toFixed(1)}`,
        cleanText(scenario.bafoCure),
        cleanText(scenario.requiredEvidence),
        cleanText(scenario.decisionImpact),
      ]),
    ),
    "",
    "## Vendor-Specific BAFO Conditions",
    "",
    args.bafoPack.vendorInstructions
      .map((instruction) => {
        const questions = instruction.questions
          .slice(0, 4)
          .map((question) => `  - ${cleanText(question.question)}`)
          .join("\n");
        const mustResolve = cleanList(instruction.mustResolveBeforeScoring, 4);
        return [
          `### ${labelForVendor(instruction.vendorId, vendorLabels)}`,
          "",
          `- Evaluation status: ${titleCase(instruction.readyForEvaluation)}`,
          `- Must resolve before final scoring: ${mustResolve}`,
          "- BAFO questions:",
          questions || "  - No vendor-specific BAFO questions available.",
        ].join("\n");
      })
      .join("\n\n"),
    "",
    "## Unresolved Risks and Evidence Gaps",
    "",
    table(
      [
        "Vendor",
        "Issue",
        "Severity",
        "Why it matters",
        "Clarification required",
      ],
      args.challengeIntelligence.challengeLog.slice(0, 10).map((challenge) => [
        labelForVendor(challenge.vendorId, vendorLabels),
        cleanText(challenge.finding),
        titleCase(challenge.severity),
        cleanText(challenge.whyItMatters),
        cleanText(challenge.clarificationQuestion),
      ]),
    ),
    "",
    "## Decision Required",
    "",
    "> **Decision required:** Approve a controlled BAFO round, confirm the weighting model as directionally fit for executive review, and require vendors to cure the named evidence gaps before any final award recommendation.",
    "",
    "Executive actions:",
    "",
    "- Confirm Vendor A as the risk-adjusted BAFO lead.",
    "- Keep Vendor C in the finalist lane if scope and transition are normalized.",
    "- Keep Vendor B as a price benchmark only until the cited gaps are resolved.",
    "- Do not finalize award until revised BAFO evidence is received and rescored.",
    "",
    "## Evidence / Source Note",
    "",
    "This brief is based on the Airline Demo AMS Source event evidence pack, Vendor Response MVE Profiles, Vendor Challenge Log, Commercial Leverage Seeds, BAFO Instruction Pack, and Evaluation Scorecard available in AbarVa Source. Figures are planning and evaluation inputs; final award support requires sponsor approval, vendor BAFO responses, legal/commercial review, and finance validation.",
    "",
  ].join("\n");

  assertDecisionBriefExportQuality(body);
  return body;
}

export function assertDecisionBriefExportQuality(body: string): void {
  const missingSections = DECISION_BRIEF_REQUIRED_SECTIONS.filter(
    (section) => !body.includes(`## ${section}`),
  );
  const missingVendors = ["Vendor A", "Vendor B", "Vendor C"].filter(
    (vendor) => !body.includes(vendor),
  );
  const forbiddenHits = DECISION_BRIEF_FORBIDDEN_PATTERNS.filter((pattern) =>
    pattern.test(body),
  ).map((pattern) => pattern.source);

  if (missingSections.length || missingVendors.length || forbiddenHits.length) {
    throw new Error(
      [
        "d24_decision_brief export quality failed.",
        missingSections.length
          ? `Missing sections: ${missingSections.join(", ")}.`
          : null,
        missingVendors.length
          ? `Missing vendors: ${missingVendors.join(", ")}.`
          : null,
        forbiddenHits.length
          ? `Forbidden patterns: ${forbiddenHits.join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}

function scorecardTableRow(
  row: VendorEvaluationScorecardRow,
  vendorLabels: Map<string, string>,
): string[] {
  return [
    row.label,
    `${row.weight}%`,
    scoreOnlyForVendor(row, "Vendor A", vendorLabels),
    scoreOnlyForVendor(row, "Vendor B", vendorLabels),
    scoreOnlyForVendor(row, "Vendor C", vendorLabels),
  ];
}

function vendorRankingCards(
  summaries: VendorEvaluationDecisionView["vendorSummaries"],
  vendorLabels: Map<string, string>,
): string {
  return summaries
    .map((summary) => {
      const vendor = labelForVendor(summary.vendorId, vendorLabels);
      return [
        `### ${vendor}`,
        "",
        `- Current score: ${summary.weightedScore.toFixed(1)}/10`,
        `- BAFO role: ${cleanText(summary.finalistPosture)}`,
        `- Why this rank: ${cleanText(summary.decisionRationale)}`,
        `- Must resolve: ${cleanList(summary.conditions, 3)}`,
        `- Decision implication: ${executiveImplicationFor(summary.rank)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function executiveImplicationFor(rank: number): string {
  if (rank === 1) return "Lead BAFO lane; protect continuity and validate price.";
  if (rank === 2) return "Keep as credible finalist if scope and transition are normalized.";
  return "Use as commercial benchmark until cure items are contractually supported.";
}

function scoreOnlyForVendor(
  row: VendorEvaluationScorecardRow,
  label: "Vendor A" | "Vendor B" | "Vendor C",
  vendorLabels: Map<string, string>,
): string {
  const value = row.scores.find(
    (candidate) => labelForVendor(candidate.vendorId, vendorLabels) === label,
  );
  if (!value) return "Not scored";
  return value.score.toFixed(1);
}

function scorecardRationale(
  row: VendorEvaluationScorecardRow,
  vendorLabels: Map<string, string>,
): string {
  const scores = row.scores
    .map(
      (score) =>
        `${labelForVendor(score.vendorId, vendorLabels)} ${score.score.toFixed(1)}: ${cleanText(score.rationale)}`,
    )
    .join("; ");
  return `- ${row.label} (${row.weight}%): ${cleanText(row.guidance)} ${scores}`;
}

function valueForVendor(
  values: VendorEvaluationDecisionView["comparisonRows"][number]["values"],
  label: "Vendor A" | "Vendor B" | "Vendor C",
  vendorLabels: Map<string, string>,
): string {
  const value = values.find(
    (candidate) => labelForVendor(candidate.vendorId, vendorLabels) === label,
  );
  if (!value) return "Not provided";
  return `${cleanText(value.value)} (${cleanText(value.caveat)})`;
}

function displayVendor(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("incumbent")) return "Vendor A";
  if (profile.vendorId.includes("scale")) return "Vendor B";
  if (profile.vendorId.includes("specialist")) return "Vendor C";
  return profile.vendorName.replace(/\s+-\s+.*/, "");
}

function labelForVendor(
  vendorId: string,
  vendorLabels: Map<string, string>,
): string {
  return vendorLabels.get(vendorId) ?? "Vendor";
}

function cleanList(items: string[], limit: number): string {
  const cleaned = items.map(cleanText).filter(Boolean).slice(0, limit);
  return cleaned.length ? cleaned.join("; ") : "No material condition recorded.";
}

function cleanText(value: string): string {
  return value
    .replace(/\bSkyHarbor Air\b/gi, DISPLAY_EVENT.accountName)
    .replace(/\bSkyHarbor\b/gi, DISPLAY_EVENT.accountName)
    .replace(/\bSteward\b/gi, "governance")
    .replace(/\bAtlas\b/gi, "aVa")
    .replace(/\bSentinel\b/gi, "aVa")
    .replace(/\bsource_events\b/gi, "Source event")
    .replace(/\s+/g, " ")
    .trim();
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

function escapeCell(value: string): string {
  return cleanText(value).replace(/\|/g, "/");
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
