// ─────────────────────────────────────────────────────────────────────────────
// Governed Source evidence-processing readiness chat answer.
//
// Projects existing Source artifact registry parse/search/graph statuses into an
// aVa chart + table. This is intentionally read-only: it never parses bytes,
// writes rows, runs OCR/transcription, indexes vectors, projects graph context,
// or promotes anything into the enterprise context layer.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import {
  listSourceArtifactsForSourceEventIdWithContent,
  type SourceArtifactRegistryRecordWithContent,
} from "@/lib/source/artifact-registry";
import {
  buildSourceArtifactParseBacklogReport,
  type SourceArtifactParseBacklogItem,
  type SourceArtifactParseBacklogReport,
} from "@/lib/source/artifact-registry/parse-backlog";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";
import { governedCandidateFromSourceArtifact } from "@/lib/source/ava/artifact-quality-governed-answer";

export interface BuildEvidenceReadinessGovernedAnswerInput {
  eventId: string;
  eventAliases?: readonly string[];
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikeEvidenceReadinessQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const isArtifactQualityQuestion =
    /\b(quality|lifecycle|gate b|client final|client-final|deliverable standards)\b/.test(
      q,
    ) &&
    /\b(artifact|artifacts|deliverable|deliverables|document|documents|draft|drafts|client final|client-final|quality|lifecycle)\b/.test(
      q,
    );
  if (isArtifactQualityQuestion) return false;
  return (
    /\b(evidence|upload|uploads|uploaded|file|files|artifact|artifacts|workshop|session|notes|parse|parsed|parser|parsing|ingest|ingested|index|indexed|embedding|search-ready|search ready|graph|promoted|promotion|enterprise context|agent-ready|agent_ready|ocr|transcription)\b/.test(
      q,
    ) &&
    /\b(readiness|status|ready|parsed|parser|parsing|ingest|ingested|indexed|indexing|search|embedding|graph|promoted|promotion|enterprise context|agent-ready|agent_ready|ocr|transcription|which|what|show|table|chart|learned|learn)\b/.test(
      q,
    )
  );
}

function normalizedAliases(input: BuildEvidenceReadinessGovernedAnswerInput) {
  return [
    ...new Set(
      [input.eventId, ...(input.eventAliases ?? [])]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

async function listArtifactsForAliases(
  aliases: readonly string[],
): Promise<SourceArtifactRegistryRecordWithContent[]> {
  const byId = new Map<string, SourceArtifactRegistryRecordWithContent>();
  for (const alias of aliases) {
    const artifacts = await listSourceArtifactsForSourceEventIdWithContent(alias);
    for (const artifact of artifacts) {
      if (!byId.has(artifact.id)) byId.set(artifact.id, artifact);
    }
  }
  return [...byId.values()];
}

function citationIdsForArtifacts(
  artifacts: readonly SourceArtifactRegistryRecordWithContent[],
  citations: readonly AnswerCitation[],
): string[] {
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  return citations
    .filter((citation) => citation.recordId && artifactIds.has(citation.recordId))
    .map((citation) => citation.id);
}

function countAttention(report: SourceArtifactParseBacklogReport): number {
  return (
    report.counts.failedArtifacts +
    report.counts.needsReviewArtifacts +
    report.counts.unsupportedWithoutOcrOrTranscriptionArtifacts +
    report.counts.unknownFormatArtifacts +
    report.counts.staleParsingArtifacts
  );
}

function label(value: string): string {
  return value.replaceAll("_", " ");
}

function buildEvidenceReadinessChart(args: {
  report: SourceArtifactParseBacklogReport;
  citationIds: string[];
}): AnswerChart {
  return {
    id: "source-evidence-processing-readiness",
    kind: "horizontal-bar",
    title: "Evidence processing readiness",
    subtitle:
      "Stored, parsed, search-ready, graph-projected, and attention states stay separate.",
    data: {
      type: "horizontal-bar",
      data: [
        { metric: "Stored", count: args.report.counts.totalArtifacts },
        { metric: "Parser-ready", count: args.report.counts.parserReadyArtifacts },
        { metric: "Parsed", count: args.report.counts.parsedArtifacts },
        { metric: "Search-ready", count: args.report.counts.searchReadyArtifacts },
        {
          metric: "Graph-projected",
          count: args.report.counts.graphProjectedArtifacts,
        },
        { metric: "Needs attention", count: countAttention(args.report) },
      ],
      xKey: "metric",
      yKey: "count",
      unit: "artifacts",
    },
    xKey: "metric",
    yKey: "count",
    unit: "artifacts",
    citationIds: args.citationIds,
    sourceNote:
      "Counts come from existing Source artifact registry statuses; this answer does not run parser, search, graph, or enterprise-context jobs.",
  };
}

function itemRows(report: SourceArtifactParseBacklogReport) {
  const rows =
    report.attentionItems.length > 0 ? report.attentionItems : report.examples;
  return rows.slice(0, 8);
}

function buildEvidenceReadinessTable(args: {
  report: SourceArtifactParseBacklogReport;
  citationIds: string[];
}): AnswerTable {
  return {
    id: "source-evidence-processing-items",
    title:
      args.report.attentionItems.length > 0
        ? "Evidence items needing attention"
        : "Evidence processing examples",
    columns: [
      { key: "file", label: "File", format: "text" },
      { key: "stage", label: "Stage", format: "text" },
      { key: "parse", label: "Parse", format: "text" },
      { key: "search", label: "Search", format: "text" },
      { key: "graph", label: "Graph", format: "text" },
      { key: "nextAction", label: "Next action", format: "text" },
    ],
    rows: itemRows(args.report).map((item: SourceArtifactParseBacklogItem) => ({
      file: item.originalName,
      stage: item.stageKey,
      parse: label(item.parseReadiness),
      search: label(item.searchReadiness),
      graph: label(item.graphReadiness),
      nextAction: item.note,
    })),
    note:
      "This is a registry status view, not proof that evidence has been parsed, indexed, promoted, or made agent-ready.",
    citationIds: args.citationIds,
  };
}

function directAnswerForReport(report: SourceArtifactParseBacklogReport): string {
  const c = report.counts;
  if (c.totalArtifacts === 0) {
    return "No Source evidence files are registered for this event yet. Uploaded is the first proof layer; parsing, search indexing, enterprise-context promotion, and agent-ready status remain unavailable until evidence is captured.";
  }
  return `${c.totalArtifacts} Source files are stored. ${c.parsedArtifacts} are parsed, ${c.searchReadyArtifacts} are search-ready, ${c.parserReadyArtifacts} are parser-ready, and ${countAttention(report)} need attention. I am not claiming OCR, vector indexing, enterprise-context promotion, or agent-ready status unless those states already exist in the registry.`;
}

function businessImplicationForReport(
  report: SourceArtifactParseBacklogReport,
): string {
  const attentionCount = countAttention(report);
  if (report.counts.totalArtifacts === 0) {
    return "The event has no persisted evidence base for aVa to cite yet, so workshop/session notes and client files need to be captured before richer insights can be trusted.";
  }
  if (attentionCount > 0) {
    return "The event has evidence in Source, but some files need operator review before they can support higher-confidence analysis or downstream promotion.";
  }
  if (report.counts.parserReadyArtifacts > 0) {
    return "The next value is operational: schedule an approved parser/backfill job for the parser-ready files, then verify indexing and promotion as separate proof layers.";
  }
  return "The registry is clean for the states currently recorded; richer aVa answers still require separately proven search indexing and enterprise-context promotion.";
}

function recommendationForReport(
  report: SourceArtifactParseBacklogReport,
): string {
  const attentionCount = countAttention(report);
  if (report.counts.totalArtifacts === 0) {
    return "Capture workshop notes, session outputs, and client-approved files into Source first, then rerun this answer to inspect parse/index readiness.";
  }
  if (attentionCount > 0) {
    return "Clear failed, review-required, stale, unknown-format, and OCR/transcription-dependent files before treating this event as evidence-ready.";
  }
  if (report.counts.parserReadyArtifacts > 0) {
    return "Queue a governed parse/backfill job for parser-ready files; do not use chat as proof that parsing or enterprise-context learning has occurred.";
  }
  return "Use this as the evidence-readiness control view and keep asking for parse, search, graph, and promotion status separately as the data-build jobs mature.";
}

function blockedAnswer(args: {
  governedClientKey: string;
  question: string;
  bundle: ReturnType<typeof buildValidatedAgentContextBundle>;
}): AvaAnswerPacket {
  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: args.governedClientKey,
    question: args.question,
    intent: "evidence_processing_readiness",
    status: "blocked",
    tenantFencePassed: false,
    gaps: [
      {
        id: "evidence-readiness-governance-blocked",
        label: "Evidence rows blocked by governance policy",
        detail:
          args.bundle.blocked
            .flatMap((blocked) => blocked.errors)
            .slice(0, 3)
            .join("; ") || "The governance gate blocked every artifact row.",
        severity: "high",
      },
    ],
    caveats: [
      {
        id: "evidence-readiness-no-sensitive-bypass",
        label: "No sensitive-context bypass",
        detail:
          "Restricted or excluded evidence must be reviewed through the governed context policy before it can support an aVa answer.",
      },
    ],
  });
}

export async function buildEvidenceReadinessGovernedAnswer(
  input: BuildEvidenceReadinessGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(input.clientKey);
  if (!governedClientKey) return null;

  const aliases = normalizedAliases(input);
  const artifacts = (await listArtifactsForAliases(aliases)).filter(
    (artifact) =>
      artifact.tenantKey === input.clientKey ||
      artifact.tenantKey === governedClientKey,
  );
  const candidates: GovernedCandidate[] = artifacts.map((artifact) =>
    governedCandidateFromSourceArtifact(artifact, {
      clientKey: governedClientKey,
      tenantId: input.tenantId,
    }),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });

  if (bundle.decision === "block") {
    return blockedAnswer({
      governedClientKey,
      question: input.question,
      bundle,
    });
  }

  const report = buildSourceArtifactParseBacklogReport({
    clientKey: governedClientKey,
    inputEventId: input.eventId,
    resolvedEventId: aliases[0],
    resolvedEventCode: aliases.find((alias) => alias !== input.eventId),
    artifacts,
  });
  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citationIdsForArtifacts(artifacts, citations);

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "evidence_processing_readiness",
    status: report.status === "empty" ? "no_data" : "answered",
    tenantFencePassed: true,
    directAnswer: directAnswerForReport(report),
    businessImplication: businessImplicationForReport(report),
    recommendation: recommendationForReport(report),
    artifacts: [
      {
        ...buildEvidenceReadinessChart({ report, citationIds }),
        artifact: "chart" as const,
      },
      {
        ...buildEvidenceReadinessTable({ report, citationIds }),
        artifact: "table" as const,
      },
    ],
    citations,
    gaps:
      report.status === "empty"
        ? [
            {
              id: "evidence-readiness-files-missing",
              label: "No registered evidence files",
              detail:
                "Upload or capture workshop notes, session outputs, and client files before asking aVa to reason from persisted Source evidence.",
              severity: "high",
            },
          ]
        : [],
    caveats: [
      {
        id: "evidence-readiness-read-only",
        label: "Read-only status view",
        detail:
          "This answer parsed no bytes, wrote no rows, ran no OCR/transcription, and attempted no indexing, graph projection, or enterprise-context promotion.",
      },
      {
        id: "evidence-readiness-state-separation",
        label: "States stay separate",
        detail:
          "Stored, parsed, search-ready, graph-projected, enterprise-context-promoted, and agent-ready are intentionally separate proof layers.",
      },
      {
        id: "evidence-readiness-ocr-gap",
        label: "OCR/transcription remains governed follow-up",
        detail:
          "Image, audio, and video artifacts remain unsupported for evidence extraction until a governed OCR or transcription path is approved.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
