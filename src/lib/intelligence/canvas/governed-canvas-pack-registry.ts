export type CanvasPackStatus = "approved" | "candidate" | "fallback";

export type CanvasPackBasis =
  | "tenant_loaded"
  | "industry_corpus"
  | "derived_benchmark"
  | "inference_boundary";

export interface CanvasPackProvenance {
  basis: CanvasPackBasis;
  label: string;
  detail: string;
}

export interface CanvasPackGovernance {
  packId: string;
  version: string;
  status: CanvasPackStatus;
  generatedBy: string;
  generatedAt: string;
  reviewedBy: string;
  deterministic: true;
  sourceMode: "tenant_plus_industry" | "industry_fallback";
  contextSummary: string;
  provenance: CanvasPackProvenance[];
  validation: {
    passed: boolean;
    issues: string[];
    warnings: string[];
  };
  caveats: string[];
}

interface PackMetadata {
  packId: string;
  version: string;
  status: CanvasPackStatus;
  generatedAt: string;
  reviewedBy: string;
  industryCorpusLabel: string;
  corpusRefresh: string;
  caveats: string[];
}

const DEFAULT_GENERATOR =
  "Claude-assisted offline synthesis, reviewed and rendered deterministically by AbarVa";

const PACK_METADATA: Record<string, PackMetadata> = {
  skyharbor: {
    packId: "intelligence-canvas-pack:skyharbor:airline-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Airline operations and enterprise AI peer corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Industry metrics are directional corpus benchmarks, not tenant financial actuals.",
      "Tenant-specific claims must be confirmed against loaded evidence before board use.",
    ],
  },
  meridian: {
    packId: "intelligence-canvas-pack:meridian:healthcare-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Healthcare payer-provider AI adoption corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Peer adoption and spend metrics are directional benchmarks from the industry corpus.",
      "Clinical, claims, and financial claims remain planning-grade unless tied to loaded tenant evidence.",
    ],
  },
  arcturus: {
    packId: "intelligence-canvas-pack:arcturus:financial-services-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Financial-services AI and model-risk peer corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Model-risk and regulatory readiness claims require loaded policy/evidence before board use.",
      "Peer metrics are directional and should not be treated as audited tenant performance.",
    ],
  },
  northstar: {
    packId: "intelligence-canvas-pack:northstar:clinical-tech-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Clinical-technology AI and regulatory-readiness corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Regulatory-readiness claims must remain caveated unless loaded approval evidence exists.",
      "Peer metrics are directional and should not be treated as audited tenant performance.",
    ],
  },
  apexretail: {
    packId: "intelligence-canvas-pack:apexretail:retail-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Retail AI, demand, pricing, and supply-chain corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Demand, pricing, and supply-chain claims require loaded tenant data before board use.",
      "Peer metrics are directional and should not be treated as audited tenant performance.",
    ],
  },
  lakeshore: {
    packId: "intelligence-canvas-pack:lakeshore:holdco-ai-2026-q3",
    version: "2026.07.17",
    status: "approved",
    generatedAt: "2026-07-17",
    reviewedBy: "AbarVa product review",
    industryCorpusLabel: "Industrial holding-company AI and shared-services corpus",
    corpusRefresh: "2026-Q3",
    caveats: [
      "Holding-company metrics must distinguish corporate shared services from portfolio-company operations.",
      "Peer metrics are directional and should not be treated as audited tenant performance.",
    ],
  },
};

const FALLBACK_METADATA: PackMetadata = {
  packId: "intelligence-canvas-pack:fallback:cross-industry-ai-2026-q3",
  version: "2026.07.17",
  status: "fallback",
  generatedAt: "2026-07-17",
  reviewedBy: "AbarVa product review",
  industryCorpusLabel: "Cross-industry AI adoption corpus",
  corpusRefresh: "2026-Q3",
  caveats: [
    "This is a cross-industry fallback pack because a tenant-specific canvas pack has not been authored yet.",
    "Treat sector claims as directional until a tenant-specific pack is generated and reviewed.",
  ],
};

export function getIntelligenceCanvasGovernance(input: {
  clientKey: string;
  tenantName: string;
  contextAreaCount: number;
  sourceCount: number;
  strongestArea?: string;
}): CanvasPackGovernance {
  const metadata = PACK_METADATA[input.clientKey] ?? FALLBACK_METADATA;
  const provenance: CanvasPackProvenance[] = [
    {
      basis: "tenant_loaded",
      label: "Tenant-loaded context",
      detail: `${input.contextAreaCount} loaded context areas and ${input.sourceCount} source trails from the active enterprise context.`,
    },
    {
      basis: "industry_corpus",
      label: "Industry corpus",
      detail: `${metadata.industryCorpusLabel}; refresh ${metadata.corpusRefresh}.`,
    },
    {
      basis: "derived_benchmark",
      label: "Derived benchmark",
      detail: input.strongestArea
        ? `Canvas compares the strongest loaded area, ${input.strongestArea}, against directional peer benchmarks.`
        : "Canvas compares loaded context maturity against directional peer benchmarks.",
    },
    {
      basis: "inference_boundary",
      label: "Evidence boundary",
      detail:
        "The canvas is deterministic and may use reviewed synthesis, but it does not convert directional corpus signals into audited tenant facts.",
    },
  ];

  const issues: string[] = [];
  const warnings: string[] = [];
  if (input.contextAreaCount <= 0) {
    issues.push("No tenant context areas were available for this canvas pack.");
  }
  if (input.sourceCount <= 0) {
    warnings.push("No source trails were available; canvas should be treated as industry-only guidance.");
  }
  if (metadata.status !== "approved") {
    warnings.push("Canvas pack is not tenant-approved; use as preview guidance only.");
  }

  return {
    packId: metadata.packId,
    version: metadata.version,
    status: metadata.status,
    generatedBy: DEFAULT_GENERATOR,
    generatedAt: metadata.generatedAt,
    reviewedBy: metadata.reviewedBy,
    deterministic: true,
    sourceMode:
      metadata.status === "fallback" ? "industry_fallback" : "tenant_plus_industry",
    contextSummary: `${input.tenantName}: ${input.contextAreaCount} context areas, ${input.sourceCount} source trails, ${metadata.industryCorpusLabel}.`,
    provenance,
    validation: {
      passed: issues.length === 0,
      issues,
      warnings,
    },
    caveats: metadata.caveats,
  };
}
