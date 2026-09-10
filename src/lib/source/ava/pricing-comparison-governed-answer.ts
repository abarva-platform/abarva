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
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";
import type {
  NormalizedRequirementResponse,
  NormalizedVendorResponsePackage,
} from "@/lib/source/vendor-response-matrix";

export interface BuildPricingComparisonGovernedAnswerInput {
  eventId: string;
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikePricingComparisonQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  return (
    /\b(compare|comparison|rank|ranking|cheapest|lowest)\b/.test(q) &&
    /\b(vendors?|suppliers?|proposals?|bids?|prices?|pricing|quotes?)\b/.test(q)
  );
}

function pricingRows(
  responsePackage: NormalizedVendorResponsePackage,
): NormalizedRequirementResponse[] {
  return responsePackage.rows.filter(
    (row) =>
      row.responseType === "Pricing" ||
      row.category === "commercial and pricing" ||
      Boolean(row.pricingRef),
  );
}

function pricingReferenceCount(
  responsePackage: NormalizedVendorResponsePackage,
): number {
  return new Set(
    pricingRows(responsePackage)
      .map((row) => row.pricingRef?.trim())
      .filter((value): value is string => Boolean(value)),
  ).size;
}

function governedCandidateFromPackage(
  responsePackage: NormalizedVendorResponsePackage,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
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
    title: `${responsePackage.vendorName} pricing response`,
    citations: [
      `${responsePackage.originalName} contains ${pricingRows(responsePackage).length} normalized commercial or pricing rows and ${pricingReferenceCount(responsePackage)} cited pricing references.`,
    ],
  };
}

export async function buildPricingComparisonGovernedAnswer(
  input: BuildPricingComparisonGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  const packages = await readNormalizedVendorResponsePackages({
    eventId: input.eventId,
    tenantKey: input.clientKey,
  });
  if (packages.length === 0) {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "vendor_pricing_comparison",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer:
        "I cannot compare vendor prices or calculate savings because no normalized vendor response packages are loaded for this event.",
      gaps: [
        {
          id: "source-pricing-packages-missing",
          label: "Normalized vendor pricing packages missing",
          detail:
            "Load and review each vendor response package before asking aVa to compare commercial positions.",
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
      intent: "vendor_pricing_comparison",
      status: "blocked",
      tenantFencePassed: false,
      directAnswer:
        "Vendor response packages are present, but their governed evidence is blocked from supporting a pricing comparison.",
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citations.map((citation) => citation.id);
  const table: AnswerTable = {
    id: "source-vendor-pricing-comparability",
    title: "Vendor pricing comparability",
    columns: [
      { key: "vendor", label: "Vendor", format: "text" },
      { key: "package", label: "Response package", format: "text" },
      { key: "pricingRows", label: "Pricing rows", format: "number" },
      { key: "pricingRefs", label: "Pricing references", format: "number" },
      { key: "numericBasis", label: "Accepted numeric basis", format: "text" },
      { key: "state", label: "Comparison state", format: "text" },
    ],
    rows: packages.map((responsePackage) => ({
      vendor: responsePackage.vendorName,
      package: responsePackage.originalName,
      pricingRows: pricingRows(responsePackage).length,
      pricingRefs: pricingReferenceCount(responsePackage),
      numericBasis: "Not established",
      state: "Held pending accepted price facts",
    })),
    note:
      "Pricing references prove where the submitted evidence lives; they are not accepted numeric bid facts and cannot support a savings calculation.",
    citationIds,
  };

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "vendor_pricing_comparison",
    status: "partial",
    tenantFencePassed: true,
    directAnswer: `I cannot compare vendor prices or calculate savings yet. ${packages.length} vendor response packages are loaded and cite pricing evidence, but 0/${packages.length} expose accepted numeric year-one, transition, or total-cost facts in the normalized response substrate.`,
    businessImplication:
      "A ranked price or savings claim would be invented until the submitted pricing workbooks are parsed into accepted numeric facts on a common scope and term basis.",
    recommendation:
      "Parse and accept year-one run cost, transition cost, one-time cost, optional cost, and total-cost facts for every vendor, then normalize scope and assumptions before ranking.",
    artifacts: [{ ...table, artifact: "table" as const }],
    citations,
    gaps: [
      {
        id: "source-pricing-numeric-basis-missing",
        label: "Accepted numeric pricing basis missing",
        detail:
          "The normalized responses cite pricing exhibits, but accepted numeric bid facts are not present for comparison or savings calculation.",
        severity: "critical",
        citationIds,
      },
    ],
    caveats: [
      {
        id: "source-pricing-no-inference",
        label: "No price inference",
        detail:
          "aVa did not extract numbers from narrative text, infer totals from filenames, or treat pricing references as accepted commercial facts.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      factCount: packages.reduce(
        (sum, responsePackage) => sum + pricingRows(responsePackage).length,
        0,
      ),
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
