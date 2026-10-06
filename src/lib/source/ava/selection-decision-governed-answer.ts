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
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";
import { governedCandidateFromSourceArtifact } from "@/lib/source/ava/artifact-quality-governed-answer";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export interface BuildSelectionDecisionGovernedAnswerInput {
  eventId: string;
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export interface SelectionDecisionSnapshot {
  selectedSupplier: string | null;
  evaluationScore: string | null;
  bafoTcv: string | null;
  conditions: string[];
  runnerUpCounterCase: string | null;
}

export function looksLikeSelectionDecisionQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const asksAboutReadinessOrHold =
    /\b(not ready|no (?:vendor|supplier) is ready|readiness|held?|holdback|block(?:ed|er|ing)?|before (?:selection|award)|ready for (?:selection|award))\b/.test(
      q,
    );
  if (asksAboutReadinessOrHold) return false;
  const asksAboutDecision =
    /\b(select(?:ed|ion)?|award(?:ed)?|preferred|winner|recommend(?:ed|ation)?)\b/.test(
      q,
    );
  const asksForBasis =
    /\b(why|basis|rationale|reason|score|bafo|tcv|conditions?|runner[- ]?up|counter[- ]?case|trade[- ]?off)\b/.test(
      q,
    );
  return asksAboutDecision && asksForBasis;
}

export function looksLikeCrossTenantDataRequest(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const asksOutsideTenant =
    /\b(other|another|different|cross[- ]tenant|outside)\b/.test(q) &&
    /\b(tenant|client|portfolio)\b/.test(q);
  const asksForProtectedData =
    /\b(data|vendor|supplier|contract|pricing|price|economics|spend|proposal|score|terms?)\b/.test(
      q,
    );
  return asksOutsideTenant && asksForProtectedData;
}

export function buildCrossTenantRefusalAnswer(input: {
  clientKey: string;
  question: string;
}): AvaAnswerPacket | null {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "tenant_boundary_refusal",
    status: "blocked",
    tenantFencePassed: true,
    directAnswer:
      "I cannot access, compare, or disclose another tenant's portfolio, vendor, contract, pricing, or commercial data. This Source event is fenced to the active tenant.",
    caveats: [
      {
        id: "source-cross-tenant-boundary",
        label: "Tenant boundary enforced",
        detail:
          "No other-tenant facts, artifacts, pricing, or contract records were retrieved for this answer.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: 0,
      hasTenantFacts: false,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function capture(body: string, patterns: readonly RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = body.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

function extractConditions(body: string): string[] {
  const section = body.match(
    /<h2[^>]*>\s*(?:Accepted risk and transition prerequisites|Award conditions|Selection conditions)\s*<\/h2>([\s\S]*?)(?:<\/section>|<h2\b)/i,
  )?.[1];
  if (!section) return [];
  return [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => decodeHtml(match[1] ?? ""))
    .filter(Boolean)
    .slice(0, 6);
}

export function parseSelectionDecisionArtifact(
  body: string,
): SelectionDecisionSnapshot {
  const text = decodeHtml(body);
  const selectedSupplier = capture(text, [
    /\bselect\s+([A-Z][A-Za-z0-9&,' .-]{1,80}?)\s+for\s+(?:the\s+)?/i,
    /\bselected\s+(?:supplier|vendor)\s*[:\-]\s*(.+?)(?:[.;]|$)/i,
    /\baward(?:ed)?\s+(?:the\s+contract\s+)?to\s+(.+?)(?:[.;]|$)/i,
  ]);
  const evaluationScore = capture(text, [
    /\bevaluation(?:\s+weighted)?(?:\s+score)?\s*[:=]?\s*(\d{1,3}(?:\.\d+)?)\b/i,
    /\bweighted score\s*[:=]?\s*(\d{1,3}(?:\.\d+)?)\b/i,
  ]);
  const bafoAmount = text.match(
    /\b(?:three[- ]year\s+)?BAFO TCV\s*\$\s*([\d,.]+)\s*([KMB])?\b/i,
  );
  const bafoTcv = bafoAmount
    ? `$${bafoAmount[1]}${bafoAmount[2]?.toUpperCase() ?? ""}`
    : null;
  const runnerUpCounterCase = capture(text, [
    /\b([A-Z][A-Za-z0-9&,' -]{1,80}\s+remains\s+the\s+documented\s+runner-up[^.]*\.?)/,
    /\b(runner-up\s*[:\-]\s*[^.]+\.?)/i,
  ]);

  return {
    selectedSupplier,
    evaluationScore,
    bafoTcv,
    conditions: extractConditions(body),
    runnerUpCounterCase,
  };
}

function selectionRecords(
  records: readonly SourceArtifactRegistryRecord[],
  input: BuildSelectionDecisionGovernedAnswerInput,
): SourceArtifactRegistryRecord[] {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  return records.filter(
    (record) =>
      governedClientKeyForSourceClientKey(record.tenantKey) ===
        governedClientKey &&
      record.artifactKind === "d27_selection_memo",
  );
}

function selectionTable(args: {
  snapshot: SelectionDecisionSnapshot;
  citationIds: string[];
}): AnswerTable {
  const rows: Array<Record<string, string>> = [];
  if (args.snapshot.selectedSupplier) {
    rows.push({
      item: "Selected supplier",
      value: args.snapshot.selectedSupplier,
    });
  }
  if (args.snapshot.evaluationScore) {
    rows.push({
      item: "Evaluation score",
      value: args.snapshot.evaluationScore,
    });
  }
  if (args.snapshot.bafoTcv) {
    rows.push({ item: "BAFO TCV", value: args.snapshot.bafoTcv });
  }
  if (args.snapshot.runnerUpCounterCase) {
    rows.push({
      item: "Runner-up counter-case",
      value: args.snapshot.runnerUpCounterCase,
    });
  }
  if (args.snapshot.conditions.length > 0) {
    rows.push({
      item: "Award conditions",
      value: args.snapshot.conditions.join(" "),
    });
  }
  return {
    id: "source-selection-decision-basis",
    title: "Selection decision basis",
    columns: [
      { key: "item", label: "Decision item", format: "text" },
      { key: "value", label: "Accepted position", format: "text" },
    ],
    rows,
    note: "This answer reads the authoritative selection memo for this event; it does not recalculate scores or choose a supplier.",
    citationIds: args.citationIds,
  };
}

function citationIdsForArtifact(
  artifactId: string,
  citations: readonly AnswerCitation[],
): string[] {
  return citations
    .filter((citation) => citation.recordId === artifactId)
    .map((citation) => citation.id);
}

async function readAcceptedSelectionMemoBody(
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

export async function buildSelectionDecisionGovernedAnswer(
  input: BuildSelectionDecisionGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  const records = selectionRecords(
    await listSourceArtifactsForSourceEventId(input.eventId),
    input,
  );
  const authoritative = resolveAuthoritativeArtifact(records);
  if (!authoritative) {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "selection_decision_basis",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer:
        "No authoritative selection memo is available for this event, so I cannot state that a supplier was selected or explain an award basis.",
      gaps: [
        {
          id: "source-selection-memo-missing",
          label: "Authoritative selection memo missing",
          detail:
            "Accept the reviewed selection memo before asking aVa to state the selected supplier, score, economics, conditions, or runner-up counter-case.",
          severity: "high",
        },
      ],
    });
  }

  const bodyMarkdown = await readAcceptedSelectionMemoBody(authoritative);
  const artifact: SourceArtifactRegistryRecordWithContent = bodyMarkdown
    ? { ...authoritative, bodyMarkdown }
    : authoritative;
  const snapshot = parseSelectionDecisionArtifact(bodyMarkdown ?? "");
  const extractedCount = [
    snapshot.selectedSupplier,
    snapshot.evaluationScore,
    snapshot.bafoTcv,
    snapshot.runnerUpCounterCase,
  ].filter(Boolean).length;

  const candidate = governedCandidateFromSourceArtifact(artifact, {
    clientKey: governedClientKey,
    tenantId: input.tenantId,
  });
  candidate.source_basis = authoritative.originalName;
  candidate.citations = [
    `${authoritative.originalName} — authoritative selection memo; selected supplier, evaluation score, BAFO economics, award conditions, and runner-up counter-case are read from this accepted artifact.`,
  ];
  const bundle = buildValidatedAgentContextBundle(
    [candidate] satisfies GovernedCandidate[],
    { requireAgentReady: false },
  );
  if (bundle.decision === "block") {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "selection_decision_basis",
      status: "blocked",
      tenantFencePassed: false,
      directAnswer:
        "The selection memo is present, but its governed evidence is blocked from supporting an aVa answer.",
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citationIdsForArtifact(authoritative.id, citations);
  const missing = [
    !snapshot.selectedSupplier ? "selected supplier" : null,
    !snapshot.evaluationScore ? "evaluation score" : null,
    !snapshot.bafoTcv ? "BAFO TCV" : null,
    !snapshot.runnerUpCounterCase ? "runner-up counter-case" : null,
  ].filter((value): value is string => Boolean(value));
  const decisionLead = snapshot.selectedSupplier
    ? `${snapshot.selectedSupplier} is the documented selection for ${input.eventName ?? "this event"}`
    : `The authoritative selection memo for ${input.eventName ?? "this event"} does not expose a parseable selected supplier`;
  const decisionBasis = [
    snapshot.evaluationScore
      ? `evaluation score ${snapshot.evaluationScore}`
      : null,
    snapshot.bafoTcv ? `BAFO TCV ${snapshot.bafoTcv}` : null,
  ]
    .filter(Boolean)
    .join(" and ");
  const conditions = snapshot.conditions.length
    ? ` The award remains subject to ${snapshot.conditions.slice(0, 3).join(" ")}`
    : "";
  const runnerUp = snapshot.runnerUpCounterCase
    ? ` The counter-case is preserved: ${snapshot.runnerUpCounterCase}`
    : "";

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "selection_decision_basis",
    status: missing.length === 0 ? "answered" : "partial",
    tenantFencePassed: true,
    directAnswer: `${decisionLead}${decisionBasis ? `, supported by ${decisionBasis}.` : "."}${conditions}${runnerUp}`,
    businessImplication:
      "The answer reports the accepted decision record; it does not recompute the score, suppress dissent, or convert the recommendation into an autonomous award.",
    recommendation:
      "Carry the memo's conditions into the contract and transition controls, and retain the runner-up counter-case in the audit trail.",
    artifacts: [
      {
        ...selectionTable({ snapshot, citationIds }),
        artifact: "table" as const,
      },
    ],
    citations,
    gaps: missing.map((field) => ({
      id: `source-selection-${field.replaceAll(" ", "-")}-missing`,
      label: `${field} not extracted`,
      detail: `The authoritative memo did not expose a deterministic ${field} value, so aVa did not infer one.`,
      severity: "medium" as const,
    })),
    caveats: [
      {
        id: "source-selection-read-only",
        label: "Read-only decision explanation",
        detail:
          "This answer names no new supplier, changes no score, and records no award action.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      metricCount: extractedCount,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
