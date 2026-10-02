import type { AvaAnswerPacket, AvaCitation } from "@/lib/ava-answer/contract";
import type { HomeEnterpriseContext } from "./ecl-enterprise-context";
import type { HomeContextVersion } from "./types";

type AnswerArea = "business" | "priorities" | "operating" | "risk";

function areaForQuestion(question: string): AnswerArea | null {
  if (
    /\b(graphs?|charts?|diagrams?|connect(?:ion|ions)?|dependenc(?:y|ies)|commercial|contracts?|vendors?|finance|value|benefits?|savings|returns?|spend|costs?|roi|realiz\w*|chang(?:e|ed|es|ing)|previous|since|trend|quarter)\b|\bover time\b/i.test(
      question,
    )
  )
    return null;
  if (/\bdata estate\b/i.test(question)) return null;
  if (/\b(risks?|controls?|attention|address first)\b/i.test(question))
    return "risk";
  if (
    /\b(strateg(?:y|ic)|priorit(?:y|ies)|programs?|initiatives?|transformation|off track)\b/i.test(
      question,
    )
  )
    return "priorities";
  if (
    /\b(operating model|functions?|organi[sz]\w*|ownership|accountab\w*|who owns)\b/i.test(
      question,
    )
  )
    return "operating";
  if (
    /\b(business|segments?|revenue|what we are|enterprise model)\b/i.test(
      question,
    )
  )
    return "business";
  return null;
}

/** A current-row answer is allowed only when the record itself is fully source-linked and accepted. */
export function canAnswerFromCurrentContext(
  version: HomeContextVersion,
): boolean {
  const coverage = version.sourceCoverage;
  const review = version.sourceFileReview;
  return (
    coverage.totalRecordRows > 0 &&
    coverage.totalRecordRows === coverage.linkedRecordRows &&
    Boolean(
      review &&
      review.totalFiles > 0 &&
      review.acceptedFiles === review.totalFiles,
    )
  );
}

export function answerHomeCurrentContext(args: {
  context: HomeEnterpriseContext;
  version: HomeContextVersion;
  recordMarker?: string;
  tenantKey: string;
  question: string;
}): AvaAnswerPacket | null {
  const area = areaForQuestion(args.question);
  if (!area) return null;
  const { context, version, tenantKey, question } = args;
  const citations: AvaCitation[] = [
    {
      id: "home-current-record",
      label: "Live governed rows · current Home record",
      sourceClass: "tenant-fact",
      recordId: args.recordMarker || version.projectionContentHash,
      confidence: "high",
    },
  ];
  const addCitation = (title: string, sourceRefs: string[]): void => {
    const ref = sourceRefs[0];
    if (!ref || citations.some((citation) => citation.recordId === ref)) return;
    citations.push({
      id: `home-current-source-${citations.length}`,
      label: title,
      sourceClass: "tenant-fact",
      recordId: ref,
      confidence: "high",
    });
  };
  let directAnswer: string;
  let bullets: string[];
  let evidenceLimit: string;

  if (area === "business") {
    const segments = [...context.segmentSpine.segments].sort(
      (a, b) =>
        b.revenueSharePct - a.revenueSharePct ||
        a.segmentName.localeCompare(b.segmentName),
    );
    addCitation(context.profile.title, context.profile.sourceRefs);
    for (const segment of segments) {
      addCitation(
        segment.segmentName,
        context.segmentFacts[segment.segmentKey]?.sourceRefs ?? [],
      );
    }
    directAnswer = `Declared business model: ${context.profile.businessModel}.`;
    bullets = segments
      .slice(0, 4)
      .map(
        (segment) =>
          `${segment.segmentName}: ${segment.revenueSharePct}% of declared revenue; P&L owner: ${segment.pnlOwnerRole || "not established"}.`,
      );
    evidenceLimit =
      "Business model and revenue mix are synthetic reference assertions, not client-attested results.";
  } else if (area === "priorities") {
    const priorities = [...context.priorities].sort(
      (a, b) =>
        b.atRiskProgramCount - a.atRiskProgramCount ||
        a.title.localeCompare(b.title),
    );
    const linkedPrograms = priorities.reduce(
      (sum, priority) => sum + priority.programCount,
      0,
    );
    const atRiskPrograms = priorities.reduce(
      (sum, priority) => sum + priority.atRiskProgramCount,
      0,
    );
    for (const priority of priorities)
      addCitation(priority.title, priority.sourceRefs);
    directAnswer = `${priorities.length} declared priorities connect to ${linkedPrograms} programs; ${atRiskPrograms} linked programs are marked at risk.`;
    bullets = priorities
      .slice(0, 4)
      .map(
        (priority) =>
          `${priority.title}: ${priority.programCount} linked programs, ${priority.atRiskProgramCount} at risk; owner: ${priority.ownerRole || "not established"}.`,
      );
    if (context.unlinkedPrograms.length > 0) {
      bullets.push(
        `${context.unlinkedPrograms.length} program${context.unlinkedPrograms.length === 1 ? " has" : "s have"} no declared priority link.`,
      );
      for (const program of context.unlinkedPrograms)
        addCitation(program.title, program.sourceRefs);
    }
    evidenceLimit =
      "Program status is a declared source state, not independent delivery assurance.";
  } else if (area === "operating") {
    const segments = context.segmentSpine.segments;
    for (const segment of segments) {
      addCitation(
        segment.segmentName,
        context.segmentFacts[segment.segmentKey]?.sourceRefs ?? [],
      );
    }
    for (const item of context.functions.slice(0, 3))
      addCitation(item.title, item.sourceRefs);
    directAnswer = `${context.functions.length} declared business functions map to ${segments.length} segments; ${context.sharedFunctionIds.length} functions serve the enterprise across segments.`;
    bullets = segments.slice(0, 4).map((segment) => {
      const count = context.functions.filter(
        (item) => item.segmentKey === segment.segmentKey,
      ).length;
      return `${segment.segmentName}: ${count} assigned functions; P&L owner: ${segment.pnlOwnerRole || "not established"}.`;
    });
    evidenceLimit =
      "Function and P&L ownership are declared; decision rights have not been established.";
  } else {
    const triage = context.riskTriage;
    const top = triage.attentionRisks.slice(0, 3);
    for (const risk of top) addCitation(risk.title, risk.sourceRefs);
    directAnswer = `${triage.highOrCritical} of ${triage.totalRisks} registered risks are high or critical; ${triage.attentionRisks.length} combine that severity with a partial or unknown control state.`;
    bullets = top.map(
      (risk) =>
        `${risk.title}: ${risk.severity} severity, control ${risk.controlState === "unknown" ? "not assessed" : "partially effective"}${triage.ownerIsConstant ? "" : `; owner: ${risk.ownerRole || "not established"}`}.`,
    );
    evidenceLimit = `Unknown control state means not assessed, not confirmed uncontrolled.${triage.ownerIsConstant ? " The same role appears on every risk; item-level accountability is not established." : ""} The register is synthetic and not client-attested.`;
  }

  const sourceDate = version.sourceDateCoverage?.latest;
  const dateCaveat = sourceDate
    ? `Registered source files are dated through ${sourceDate}; underlying data currency is not attested.`
    : "Underlying data currency is not attested.";
  const packet: AvaAnswerPacket = {
    surface: "home",
    mode: "KNOW",
    tenantKey,
    question,
    intent: `home_current_${area}`,
    status: "partial",
    directAnswer,
    prose: bullets.map((bullet) => `- ${bullet}`).join("\n"),
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [],
    citations,
    gaps: [
      {
        id: "home-current-context-limit",
        label: "Evidence limit",
        detail: evidenceLimit,
        severity: "medium",
      },
    ],
    caveats: [
      {
        id: "home-current-synthetic",
        label: "Source basis",
        detail: evidenceLimit,
      },
      { id: "home-current-date", label: "Currency", detail: dateCaveat },
    ],
    nextSteps: [],
    quality: {
      confidence: "medium",
      evidenceStrength: "partial",
      tenantGrounding: "complete",
      answerCompleteness: "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
  return packet;
}
