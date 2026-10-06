import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerCitation,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import {
  listSourceArtifactsForSourceEventId,
  readSourceArtifactRegistryTextContent,
  type SourceArtifactRegistryRecord,
  type SourceArtifactRegistryRecordWithContent,
} from "@/lib/source/artifact-registry";
import { resolveAuthoritativeArtifact } from "@/lib/source/client-final-artifacts";
import { governedCandidateFromSourceArtifact } from "@/lib/source/ava/artifact-quality-governed-answer";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export interface BuildRfpDesignGovernedAnswerInput {
  eventId: string;
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export interface RfpDesignSnapshot {
  requirementCount: number | null;
  mandatoryRequirementCount: number | null;
  scoredRequirementCount: number | null;
  informationalRequirementCount: number | null;
  evaluationRequiredCount: number | null;
  dispositions: string[];
  categories: string[];
  responseFields: string[];
  conflicts: string[];
}

const RFP_ARTIFACT_KINDS = new Set([
  "d09_rfp_pack",
  "d11_response_checklist",
]);

const DISPOSITIONS = [
  "Comply",
  "Partially Comply",
  "Exception",
  "Not Applicable",
] as const;

const CATEGORY_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["Service scope", /\bservice scope\b/i],
  ["Service management", /\bservice management\b/i],
  ["SLA and service credits", /\b(?:sla|service level).{0,30}service credits?\b|\bservice credits?.{0,30}(?:sla|service level)\b/i],
  ["Staffing and productivity", /\bstaffing\b.{0,30}\bproductivity\b|\bproductivity\b.{0,30}\bstaffing\b/i],
  ["Security and compliance", /\bsecurity\b.{0,30}\bcompliance\b|\bcompliance\b.{0,30}\bsecurity\b/i],
  ["Cloud and data", /\bcloud\b.{0,20}\bdata\b|\bdata\b.{0,20}\bcloud\b/i],
  ["Transition", /\btransition\b/i],
  ["Commercial and pricing", /\bcommercial\b.{0,30}\bpricing\b|\bpricing\b.{0,30}\bcommercial\b/i],
  ["Governance and reporting", /\bgovernance\b.{0,30}\breporting\b|\breporting\b.{0,30}\bgovernance\b/i],
  ["Value measurement", /\bvalue measurement\b/i],
];

const RESPONSE_FIELD_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["Requirement ID", /\brequirement id\b/i],
  ["Requirement category", /\brequirement category\b/i],
  ["RFP section", /\brfp section\b/i],
  ["Requirement statement", /\brequirement statement\b/i],
  ["Requirement level", /\brequirement level\b/i],
  ["Response type", /\bresponse type\b/i],
  ["Evaluation criterion ID", /\bevaluation criterion id\b/i],
  ["Evidence required", /\bevidence required\b/i],
  ["Response disposition", /\bresponse disposition\b/i],
  ["Response narrative", /\bresponse narrative\b/i],
  ["Evidence reference(s)", /\bevidence references?\b/i],
  ["Pricing reference", /\bpricing reference\b/i],
  ["SLA / KPI reference", /\b(?:sla|kpi)\s*\/\s*(?:kpi|sla) reference\b|\bsla reference\b|\bkpi reference\b/i],
  ["Assumption / exception reference", /\bassumption\s*\/\s*exception reference\b|\bassumption reference\b|\bexception reference\b/i],
  ["Vendor owner", /\bvendor owner\b/i],
];

export function looksLikeRfpDesignQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const asksAboutRfp =
    /\b(rfp|request for proposal|solicitation)\b/.test(q);
  const asksAboutDesign =
    /\b(requirements?|mandatory|normalized|categor(?:y|ies)|disposition|response schema|response control|scor(?:able|ing)|evaluation criteria|evidence required)\b/.test(
      q,
    );
  return asksAboutRfp && asksAboutDesign;
}

function uniqueNumbers(body: string, pattern: RegExp): number[] {
  return [
    ...new Set(
      [...body.matchAll(pattern)]
        .map((match) => Number.parseInt(match[1] ?? "", 10))
        .filter(Number.isFinite),
    ),
  ];
}

function chooseCount(args: {
  label: string;
  explicit: number[];
  identifiers?: number;
  conflicts: string[];
}): number | null {
  if (args.explicit.length > 1) {
    args.conflicts.push(
      `${args.label} counts conflict in the accepted artifacts: ${args.explicit.join(", ")}.`,
    );
    return null;
  }
  if (args.explicit.length === 1) return args.explicit[0] ?? null;
  return args.identifiers && args.identifiers > 0 ? args.identifiers : null;
}

function chooseStructuredCount(args: {
  label: string;
  explicit: number[];
  identifiers: number;
  conflicts: string[];
}): number | null {
  if (args.identifiers <= 0) return chooseCount(args);
  if (args.explicit.length > 1) {
    args.conflicts.push(
      `${args.label} counts conflict in the accepted artifacts: ${args.explicit.join(", ")}.`,
    );
    return null;
  }
  if (args.explicit.length === 1 && args.explicit[0] !== args.identifiers) {
    args.conflicts.push(
      `${args.label} count conflicts with the controlled matrix: the summary states ${args.explicit[0]}, while the matrix contains ${args.identifiers}.`,
    );
    return null;
  }
  return args.identifiers;
}

type RequirementLevel = "mandatory" | "scored" | "informational";

interface StructuredRequirementCounts {
  all: Set<string>;
  byLevel: Record<RequirementLevel, Set<string>>;
}

function plainCell(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .trim();
}

function structuredRequirementRows(body: string): string[][] {
  const htmlRows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((rowMatch) =>
      [...(rowMatch[1] ?? "").matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((cellMatch) => plainCell(cellMatch[1] ?? "")),
    )
    .filter((cells) => cells.length > 0);
  const markdownRows = body
    .split(/\r?\n/)
    .filter((line) => /^\s*\|.*\bREQ-[A-Z0-9-]+\b/i.test(line))
    .map((line) =>
      line
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map(plainCell),
    );
  return [...htmlRows, ...markdownRows];
}

function structuredRequirementCounts(body: string): StructuredRequirementCounts {
  const counts: StructuredRequirementCounts = {
    all: new Set<string>(),
    byLevel: {
      mandatory: new Set<string>(),
      scored: new Set<string>(),
      informational: new Set<string>(),
    },
  };

  for (const cells of structuredRequirementRows(body)) {
    const ids = cells
      .flatMap((cell) => [...cell.matchAll(/\bREQ-[A-Z0-9-]+\b/gi)])
      .map((match) => (match[0] ?? "").toUpperCase());
    if (ids.length !== 1) continue;
    const level = cells
      .map((cell) => cell.toLowerCase())
      .find((cell): cell is RequirementLevel =>
        cell === "mandatory" || cell === "scored" || cell === "informational",
      );
    if (!level) continue;
    counts.all.add(ids[0]!);
    counts.byLevel[level].add(ids[0]!);
  }
  return counts;
}

export function parseRfpDesignArtifacts(
  rfpBody: string,
  responseControlBody: string,
): RfpDesignSnapshot {
  const joined = `${rfpBody}\n${responseControlBody}`;
  const conflicts: string[] = [];
  const structured = structuredRequirementCounts(joined);
  const requirementCount = chooseStructuredCount({
    label: "Total requirement",
    explicit: uniqueNumbers(
      joined,
      /\b(\d{1,4})\s+(?:issued\s+)?requirements?\b/gi,
    ),
    identifiers: structured.all.size,
    conflicts,
  });
  const mandatoryRequirementCount = chooseStructuredCount({
    label: "Mandatory requirement",
    explicit: uniqueNumbers(
      joined,
      /\b(\d{1,4})\s+mandatory\s+requirements?\b/gi,
    ),
    identifiers: structured.byLevel.mandatory.size,
    conflicts,
  });
  const scoredRequirementCount = chooseStructuredCount({
    label: "Scored requirement",
    explicit: uniqueNumbers(
      joined,
      /\b(\d{1,4})\s+scored\s+requirements?\b/gi,
    ),
    identifiers: structured.byLevel.scored.size,
    conflicts,
  });
  const informationalRequirementCount = chooseStructuredCount({
    label: "Informational requirement",
    explicit: uniqueNumbers(
      joined,
      /\b(\d{1,4})\s+informational\s+requirements?\b/gi,
    ),
    identifiers: structured.byLevel.informational.size,
    conflicts,
  });
  const evaluationRequiredCount =
    mandatoryRequirementCount !== null && scoredRequirementCount !== null
      ? mandatoryRequirementCount + scoredRequirementCount
      : null;

  if (
    requirementCount !== null &&
    mandatoryRequirementCount !== null &&
    scoredRequirementCount !== null &&
    informationalRequirementCount !== null &&
    requirementCount !==
      mandatoryRequirementCount +
        scoredRequirementCount +
        informationalRequirementCount
  ) {
    conflicts.push(
      `Requirement-level counts do not reconcile to the accepted total: ${mandatoryRequirementCount} Mandatory + ${scoredRequirementCount} Scored + ${informationalRequirementCount} Informational does not equal ${requirementCount}.`,
    );
  }

  return {
    requirementCount,
    mandatoryRequirementCount,
    scoredRequirementCount,
    informationalRequirementCount,
    evaluationRequiredCount,
    dispositions: DISPOSITIONS.filter((value) =>
      new RegExp(`\\b${value.replace(" ", "\\s+")}\\b`, "i").test(joined),
    ),
    categories: CATEGORY_PATTERNS.filter(([, pattern]) => pattern.test(joined)).map(
      ([label]) => label,
    ),
    responseFields: RESPONSE_FIELD_PATTERNS.filter(([, pattern]) =>
      pattern.test(joined),
    ).map(([label]) => label),
    conflicts,
  };
}

function isAcceptedArtifact(record: SourceArtifactRegistryRecord): boolean {
  return (
    record.isClientFinal === true ||
    record.approvalState === "approved" ||
    record.approvalState === "locked"
  );
}

function acceptedAuthoritativeArtifact(
  records: readonly SourceArtifactRegistryRecord[],
  artifactKind: string,
): SourceArtifactRegistryRecord | null {
  return resolveAuthoritativeArtifact(
    records.filter(
      (record) =>
        record.artifactKind === artifactKind && isAcceptedArtifact(record),
    ),
  );
}

async function readAcceptedArtifactBody(
  artifact: SourceArtifactRegistryRecord,
): Promise<string | null> {
  const registryBody = await readSourceArtifactRegistryTextContent(artifact);
  if (registryBody?.trim()) return registryBody;

  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_artifact_states")
    .select("body")
    .eq("source_event_id", artifact.sourceEventId)
    .eq("artifact_code", artifact.artifactKind)
    .maybeSingle<{ body: string | null }>();
  if (error) return null;
  const body = data?.body?.trim();
  return body ? body : null;
}

function citationIdsForArtifacts(
  artifactIds: ReadonlySet<string>,
  citations: readonly AnswerCitation[],
): string[] {
  return citations
    .filter(
      (citation) =>
        citation.recordId && artifactIds.has(citation.recordId),
    )
    .map((citation) => citation.id);
}

function rfpControlTable(args: {
  snapshot: RfpDesignSnapshot;
  citationIds: string[];
}): AnswerTable {
  const rows: Array<Record<string, string | number>> = [];
  if (args.snapshot.requirementCount !== null) {
    rows.push({
      control: "Requirement grain",
      acceptedDesign: `${args.snapshot.requirementCount} issued requirements, answered at requirement-ID level`,
    });
  }
  if (args.snapshot.mandatoryRequirementCount !== null) {
    rows.push({
      control: "Mandatory pass/fail requirements",
      acceptedDesign: `${args.snapshot.mandatoryRequirementCount} requirements require a compliant, evidenced response`,
    });
  }
  if (
    args.snapshot.evaluationRequiredCount !== null &&
    args.snapshot.scoredRequirementCount !== null
  ) {
    rows.push({
      control: "Evaluation-ready submission",
      acceptedDesign: `${args.snapshot.evaluationRequiredCount} required responses: ${args.snapshot.mandatoryRequirementCount} Mandatory + ${args.snapshot.scoredRequirementCount} Scored`,
    });
  }
  if (args.snapshot.informationalRequirementCount !== null) {
    rows.push({
      control: "Informational requirements",
      acceptedDesign: `${args.snapshot.informationalRequirementCount} normalized responses support comparison but do not gate submission`,
    });
  }
  if (args.snapshot.dispositions.length > 0) {
    rows.push({
      control: "Normalized disposition",
      acceptedDesign: args.snapshot.dispositions.join(" · "),
    });
  }
  if (args.snapshot.categories.length > 0) {
    rows.push({
      control: "Requirement taxonomy",
      acceptedDesign: args.snapshot.categories.join(" · "),
    });
  }
  if (args.snapshot.responseFields.length > 0) {
    rows.push({
      control: "Scoring and evidence fields",
      acceptedDesign: args.snapshot.responseFields.join(" · "),
    });
  }
  return {
    id: "source-rfp-response-control-design",
    title: "Accepted RFP response controls",
    columns: [
      { key: "control", label: "Control", format: "text" },
      { key: "acceptedDesign", label: "Accepted design", format: "text" },
    ],
    rows,
    note:
      "The structure makes submissions comparable and scorable; it does not establish that a vendor answer is accurate, supported, or award-ready.",
    citationIds: args.citationIds,
  };
}

export async function buildRfpDesignGovernedAnswer(
  input: BuildRfpDesignGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  const records = (await listSourceArtifactsForSourceEventId(input.eventId)).filter(
    (record) =>
      governedClientKeyForSourceClientKey(record.tenantKey) ===
        governedClientKey && RFP_ARTIFACT_KINDS.has(record.artifactKind),
  );
  const rfpArtifact = acceptedAuthoritativeArtifact(records, "d09_rfp_pack");
  const responseControlArtifact = acceptedAuthoritativeArtifact(
    records,
    "d11_response_checklist",
  );

  if (!rfpArtifact || !responseControlArtifact) {
    const missing = [
      !rfpArtifact ? "accepted RFP package" : null,
      !responseControlArtifact ? "accepted vendor response control pack" : null,
    ].filter((value): value is string => Boolean(value));
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "rfp_design_controls",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer: `I cannot state the RFP's mandatory response design because this event has no ${missing.join(" or ")}.`,
      gaps: missing.map((label) => ({
        id: `source-rfp-${label.replaceAll(" ", "-")}-missing`,
        label: `${label} missing`,
        detail:
          "Accept the reviewed artifact before aVa describes its requirements, response schema, or scoring controls.",
        severity: "high" as const,
      })),
    });
  }

  const [rfpBody, responseControlBody] = await Promise.all([
    readAcceptedArtifactBody(rfpArtifact),
    readAcceptedArtifactBody(responseControlArtifact),
  ]);
  const artifactsWithContent: SourceArtifactRegistryRecordWithContent[] = [
    { ...rfpArtifact, bodyMarkdown: rfpBody },
    { ...responseControlArtifact, bodyMarkdown: responseControlBody },
  ];
  const candidates = artifactsWithContent.map((artifact) => {
    const candidate = governedCandidateFromSourceArtifact(artifact, {
      clientKey: governedClientKey,
      tenantId: input.tenantId,
    });
    candidate.source_basis = artifact.originalName;
    candidate.citations = [
      `${artifact.originalName} — accepted ${artifact.artifactKind === "d09_rfp_pack" ? "RFP package" : "vendor response control pack"} for this event.`,
    ];
    return candidate;
  });
  const bundle = buildValidatedAgentContextBundle(
    candidates satisfies GovernedCandidate[],
    { requireAgentReady: false },
  );
  if (bundle.decision === "block") {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "rfp_design_controls",
      status: "blocked",
      tenantFencePassed: false,
      directAnswer:
        "The accepted RFP artifacts are present, but their governed evidence is blocked from supporting an aVa answer.",
    });
  }

  const snapshot = parseRfpDesignArtifacts(
    rfpBody ?? "",
    responseControlBody ?? "",
  );
  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citationIdsForArtifacts(
    new Set([rfpArtifact.id, responseControlArtifact.id]),
    citations,
  );
  const hasCoreDesign =
    snapshot.requirementCount !== null &&
    snapshot.mandatoryRequirementCount !== null &&
    snapshot.scoredRequirementCount !== null &&
    snapshot.informationalRequirementCount !== null &&
    snapshot.evaluationRequiredCount !== null &&
    snapshot.dispositions.length > 0 &&
    snapshot.responseFields.length > 0 &&
    snapshot.conflicts.length === 0;
  const requirementPhrase = snapshot.requirementCount
    ? `${snapshot.requirementCount} issued requirements`
    : "a requirement-level response matrix";
  const requirementMixPhrase =
    snapshot.evaluationRequiredCount !== null &&
    snapshot.mandatoryRequirementCount !== null &&
    snapshot.scoredRequirementCount !== null &&
    snapshot.informationalRequirementCount !== null
      ? `: ${snapshot.evaluationRequiredCount} are required for an evaluation-ready submission (${snapshot.mandatoryRequirementCount} Mandatory and ${snapshot.scoredRequirementCount} Scored), while ${snapshot.informationalRequirementCount} are Informational`
      : "";
  const dispositionPhrase = snapshot.dispositions.length
    ? ` Vendors had to use the normalized dispositions ${snapshot.dispositions.join(", ")}.`
    : "";
  const fieldPhrase = snapshot.responseFields.length
    ? ` Each scored response preserves ${snapshot.responseFields.slice(0, 8).join(", ")}${snapshot.responseFields.length > 8 ? ", and linked commercial/control references" : ""}.`
    : "";

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "rfp_design_controls",
    status: hasCoreDesign ? "answered" : "partial",
    tenantFencePassed: true,
    directAnswer: `The accepted RFP for ${input.eventName ?? "this event"} controls ${requirementPhrase}${requirementMixPhrase}.${dispositionPhrase}${fieldPhrase}`,
    businessImplication:
      "The response design makes vendors answer the same requirement grain and ties evaluable claims to evidence, pricing, SLA/KPI, and exception references before scoring.",
    recommendation:
      "Score only normalized, requirement-level responses with the required evidence links; route partial compliance, exceptions, and unsupported claims into clarification rather than silently normalizing them as compliant.",
    artifacts: [
      {
        ...rfpControlTable({ snapshot, citationIds }),
        artifact: "table" as const,
      },
    ],
    citations,
    gaps: [
      ...snapshot.conflicts.map((detail, index) => ({
        id: `source-rfp-count-conflict-${index + 1}`,
        label: "Accepted artifact count conflict",
        detail,
        severity: "high" as const,
      })),
      ...(!rfpBody
        ? [{
            id: "source-rfp-body-unavailable",
            label: "RFP body unavailable",
            detail:
              "The accepted RFP registry record exists, but its text could not be read; aVa used only the response-control artifact.",
            severity: "medium" as const,
          }]
        : []),
      ...(!responseControlBody
        ? [{
            id: "source-response-control-body-unavailable",
            label: "Response-control body unavailable",
            detail:
              "The accepted response-control registry record exists, but its text could not be read; aVa did not infer missing schema fields.",
            severity: "high" as const,
          }]
        : []),
    ],
    caveats: [
      {
        id: "source-rfp-design-not-response-quality",
        label: "Design control, not response validation",
        detail:
          "A scorable response structure does not establish that any vendor answer is correct, supported, commercially acceptable, or award-ready.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      metricCount:
        (snapshot.requirementCount !== null ? 1 : 0) +
        (snapshot.mandatoryRequirementCount !== null ? 1 : 0) +
        (snapshot.scoredRequirementCount !== null ? 1 : 0) +
        (snapshot.informationalRequirementCount !== null ? 1 : 0),
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
