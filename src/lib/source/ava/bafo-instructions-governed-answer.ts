import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AnswerTable, AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
} from "@/lib/source/proposal-intelligence/mve-profile";
import { deriveVendorResponseProfilesFromNormalized } from "@/lib/source/vendor-response-completeness-from-normalized";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";

export interface BuildBafoInstructionsGovernedAnswerInput {
  eventId: string;
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikeBafoInstructionsQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  return (
    /\b(bafo|best and final|best-and-final)\b/.test(q) &&
    /\b(ask|asks|question|questions|instruction|instructions|resolve|cure|holdback|improve)\b/.test(
      q,
    )
  );
}

function governedCandidateFromPackage(
  responsePackage: NormalizedVendorResponsePackage,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const citedRows = responsePackage.rows.filter(
    (row) =>
      Boolean(row.evidenceRefs?.length) ||
      Boolean(row.pricingRef || row.slaRef || row.exceptionRef),
  );
  return {
    id: responsePackage.artifactId,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: "vendor",
    source_basis: responsePackage.originalName,
    classification: "confidential",
    retrievability: "not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level: "high",
    cited_render_verified_at: null,
    title: `${responsePackage.vendorName} normalized response`,
    citations: [
      `${responsePackage.originalName} contains ${responsePackage.rows.length} normalized requirement rows, including ${citedRows.length} rows with evidence, pricing, SLA, or exception references.`,
    ],
  };
}

export async function buildBafoInstructionsGovernedAnswer(
  input: BuildBafoInstructionsGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  const packages = await readNormalizedVendorResponsePackages({
    eventId: input.eventId,
    tenantKey: input.clientKey,
  });
  const profiles = deriveVendorResponseProfilesFromNormalized({
    packages,
    event: { id: input.eventId, name: input.eventName },
    tenantKey: input.clientKey,
  });
  const intelligence = buildVendorChallengeIntelligence(profiles);
  const pack = buildVendorBafoInstructionPack(intelligence);
  if (!pack) {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "bafo_instruction_pack",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer:
        "I cannot produce vendor-specific BAFO asks because the event does not yet have normalized response challenges with cited evidence.",
      gaps: [
        {
          id: "source-bafo-challenges-missing",
          label: "Normalized response challenges missing",
          detail:
            "Parse the vendor responses and preserve their exceptions, unsupported claims, staffing, SLA, transition, and pricing references before building BAFO instructions.",
          severity: "high",
        },
      ],
    });
  }

  const candidates = packages.map((responsePackage) =>
    governedCandidateFromPackage(responsePackage, {
      clientKey: governedClientKey,
      tenantId: input.tenantId,
    }),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });
  if (bundle.decision === "block") {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "bafo_instruction_pack",
      status: "blocked",
      tenantFencePassed: false,
      directAnswer:
        "The BAFO instruction pack exists, but its normalized response evidence is blocked by the governance gate.",
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citations.map((citation) => citation.id);
  const mustResolveCount = pack.vendorInstructions.reduce(
    (sum, instruction) =>
      sum +
      instruction.questions.filter(
        (question) => question.priority === "must_resolve",
      ).length,
    0,
  );
  const table: AnswerTable = {
    id: "source-bafo-instructions-by-vendor",
    title: "Vendor-specific BAFO instructions",
    columns: [
      { key: "vendor", label: "Vendor", format: "text" },
      { key: "asks", label: "BAFO asks", format: "number" },
      { key: "mustResolve", label: "Must resolve", format: "number" },
      { key: "priority", label: "Priority", format: "text" },
      { key: "topAsks", label: "Highest-priority asks", format: "text" },
    ],
    rows: pack.vendorInstructions.map((instruction) => ({
      vendor: instruction.vendorName,
      asks: instruction.instructionCount,
      mustResolve: instruction.questions.filter(
        (question) => question.priority === "must_resolve",
      ).length,
      priority: instruction.priority,
      topAsks: [...instruction.questions]
        .sort((a, b) =>
          a.priority === b.priority ? 0 : a.priority === "must_resolve" ? -1 : 1,
        )
        .slice(0, 3)
        .map(
          (question) =>
            `${question.questionId}: ${question.question} Required response: ${question.requiredResponseFormat} Scoring holdback: ${question.scoringDisposition}`,
        )
        .join(" | "),
    })),
    note:
      "Every ask is derived from a normalized vendor-response challenge; narrative claims receive no scoring credit without the requested exhibit or commercial cure.",
    citationIds,
  };

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "bafo_instruction_pack",
    status: "answered",
    tenantFencePassed: true,
    directAnswer: `The governed BAFO pack contains ${pack.questionCount} vendor-specific asks across ${pack.vendorCount} submitted vendors; ${mustResolveCount} are must-resolve conditions before final scoring. The table names the highest-priority cure, required response format, and scoring holdback for each vendor.`,
    businessImplication:
      "BAFO is an evidence-closing round, not another narrative refresh. Each unresolved claim remains conditional until the requested pricing, staffing, SLA, transition, assumption, or exception exhibit reconciles.",
    recommendation:
      "Issue the structured BAFO pack, preserve every requirement and evidence reference, and keep final scoring human-owned until all must-resolve items are closed or explicitly accepted as buyer risk.",
    artifacts: [{ ...table, artifact: "table" as const }],
    citations,
    caveats: [
      {
        id: "source-bafo-advisory-only",
        label: "Advisory instruction pack",
        detail:
          "aVa generated no award, score change, or autonomous vendor communication. A sourcing owner must approve and issue the BAFO instructions.",
      },
    ],
    nextSteps: [
      {
        id: "source-bafo-review-and-issue",
        label: "Review and issue the vendor-specific BAFO pack",
        rationale:
          "Confirm each requested cure and scoring holdback before external issuance.",
        targetSurface: "source",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      factCount: pack.questionCount,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
