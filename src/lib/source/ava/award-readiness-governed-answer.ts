import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AnswerTable, AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
} from "@/lib/source/proposal-intelligence/mve-profile";
import { deriveVendorResponseProfilesFromNormalized } from "@/lib/source/vendor-response-completeness-from-normalized";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";

export interface BuildAwardReadinessGovernedAnswerInput {
  eventId: string;
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikeAwardReadinessQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const hasAwardContext =
    /\b(award|selection|select|finalists?|vendors?|suppliers?)\b/.test(q);
  const hasReadinessContext =
    /\b(ready|readiness|held|hold|blocked|blocker|must[- ]resolve|condition|conditional)\b/.test(
      q,
    );
  return hasAwardContext && hasReadinessContext;
}

function governedCandidateFromPackage(
  responsePackage: NormalizedVendorResponsePackage,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const exceptionRows = responsePackage.rows.filter(
    (row) =>
      row.responseDisposition === "Exception" ||
      row.responseDisposition === "Partially Comply",
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
    title: `${responsePackage.vendorName} evaluation response`,
    citations: [
      `${responsePackage.originalName} contains ${responsePackage.rows.length} normalized requirement rows and ${exceptionRows.length} disclosed exception or partial-compliance rows.`,
    ],
  };
}

export async function buildAwardReadinessGovernedAnswer(
  input: BuildAwardReadinessGovernedAnswerInput,
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
  const bafoPack = buildVendorBafoInstructionPack(intelligence);
  const decision = buildVendorEvaluationDecisionView(
    profiles,
    intelligence,
    bafoPack,
  );

  if (!decision) {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "award_readiness",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer:
        "I cannot assess award readiness because this event has no normalized vendor response packages.",
      gaps: [
        {
          id: "source-award-readiness-packages-missing",
          label: "Normalized vendor responses missing",
          detail:
            "Load and normalize each vendor response before evaluating award readiness or must-resolve conditions.",
          severity: "critical",
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
      intent: "award_readiness",
      status: "blocked",
      tenantFencePassed: false,
      directAnswer:
        "The vendor responses exist, but their governed evidence is blocked from supporting an award-readiness answer.",
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citations.map((citation) => citation.id);
  const rows = decision.vendorSummaries.map((summary) => {
    const instruction = bafoPack?.vendorInstructions.find(
      (candidate) => candidate.vendorId === summary.vendorId,
    );
    const mustResolve = instruction?.mustResolveBeforeScoring ?? [];
    const conditions = summary.conditions.length
      ? summary.conditions
      : mustResolve;
    const held =
      mustResolve.length > 0 ||
      conditions.length > 0 ||
      summary.recommendation === "hold_until_clarified";
    return {
      vendor: summary.vendorName,
      provisionalScore: Number(summary.weightedScore.toFixed(1)),
      responseReadiness: summary.readiness,
      awardReadiness: held ? "Held" : "Human decision required",
      mustResolve: Math.max(mustResolve.length, conditions.length),
      controllingCondition:
        conditions[0] ??
        "No deterministic hold identified; human evaluation and approval remain required.",
    };
  });
  const heldCount = rows.filter((row) => row.awardReadiness === "Held").length;
  const table: AnswerTable = {
    id: "source-award-readiness-by-vendor",
    title: "Award readiness by vendor",
    columns: [
      { key: "vendor", label: "Vendor", format: "text" },
      {
        key: "provisionalScore",
        label: "Provisional score",
        format: "number",
      },
      {
        key: "responseReadiness",
        label: "Response readiness",
        format: "text",
      },
      { key: "awardReadiness", label: "Award readiness", format: "text" },
      { key: "mustResolve", label: "Must resolve", format: "number" },
      {
        key: "controllingCondition",
        label: "Controlling condition",
        format: "text",
      },
    ],
    rows,
    note:
      "Scores are provisional decision support. A vendor remains held when its normalized response carries a must-resolve evidence or commercial condition; no score or rank constitutes an award.",
    citationIds,
  };

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "award_readiness",
    status: heldCount > 0 ? "partial" : "answered",
    tenantFencePassed: true,
    directAnswer:
      heldCount === decision.vendorCount
        ? `No vendor is decision-ready for an unconditional award. All ${decision.vendorCount} submitted vendors remain held by at least one must-resolve evidence or commercial condition.`
        : `${heldCount} of ${decision.vendorCount} submitted vendors remain held by must-resolve evidence or commercial conditions. Any vendor not held still requires named human evaluation and approval; aVa does not make the award.`,
    businessImplication:
      "Response completeness is not award readiness. A submitted answer can still leave pricing, staffing, SLA, transition, assumption, exception, or evidence conditions unresolved.",
    recommendation:
      "Close or explicitly accept each controlling condition, preserve the cited evidence, and require named evaluator approval before recording an award decision.",
    artifacts: [{ ...table, artifact: "table" as const }],
    citations,
    caveats: [
      {
        id: "source-award-human-owned",
        label: "Award remains human-owned",
        detail:
          "aVa reports deterministic readiness holds and provisional scores; it does not select a supplier, waive a condition, or approve an award.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      factCount: rows.reduce((sum, row) => sum + row.mustResolve, 0),
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
