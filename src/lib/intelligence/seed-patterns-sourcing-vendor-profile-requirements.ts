import type { PatternSeed, VendorLandscapeTier } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

const FOUNDER_DATA_GAP = {
  type: "founder-data-gap" as const,
  label:
    "Vendor-specific sourcing profile requires approved public, buyer, or licensed evidence before claims are shown.",
  note: "Do not infer pricing posture, delivery quality, discount norms, clause strength, or benchmark position from vendor name alone.",
};

const VENDORS: Array<{
  id: string;
  vendorName: string;
  tier: VendorLandscapeTier;
  category: NonNullable<PatternSeed["category"]>;
  vendorClass: NonNullable<PatternSeed["vendorClass"]>;
  focus: string;
  requiredEvidence: string[];
}> = [
  {
    id: "WIPRO",
    vendorName: "Wipro",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "AMS, infrastructure, BPO, digital operations, and transformation sourcing events.",
    requiredEvidence: [
      "client contract",
      "rate card",
      "delivery mix",
      "SLA history",
      "transition plan",
      "BAFO response",
    ],
  },
  {
    id: "INFOSYS",
    vendorName: "Infosys",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "AMS, SI, managed services, automation, and large transformation sourcing events.",
    requiredEvidence: [
      "proposal",
      "pricing template",
      "automation commitments",
      "delivery locations",
      "references",
    ],
  },
  {
    id: "TCS",
    vendorName: "TCS",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus: "AMS, BPO, infrastructure, SI, and transformation sourcing events.",
    requiredEvidence: [
      "scope matrix",
      "pricing model",
      "transition plan",
      "subcontractor list",
      "governance model",
    ],
  },
  {
    id: "COGNIZANT",
    vendorName: "Cognizant",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "application services, digital engineering, operations, and transformation sourcing events.",
    requiredEvidence: [
      "delivery proposal",
      "staffing pyramid",
      "transition assumptions",
      "commercial exceptions",
      "SLA model",
    ],
  },
  {
    id: "ACCENTURE",
    vendorName: "Accenture",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "strategy, SI, transformation, managed services, and multi-tower sourcing events.",
    requiredEvidence: [
      "SOW",
      "staffing plan",
      "rate card",
      "subcontractor disclosures",
      "IP terms",
    ],
  },
  {
    id: "HCLTECH",
    vendorName: "HCLTech",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "infrastructure, workplace, AMS, engineering, and managed operations sourcing events.",
    requiredEvidence: [
      "service tower pricing",
      "delivery location mix",
      "tooling assumptions",
      "transition plan",
    ],
  },
  {
    id: "CAPGEMINI",
    vendorName: "Capgemini",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "SI, consulting, application services, data, and transformation sourcing events.",
    requiredEvidence: [
      "proposal",
      "rate card",
      "delivery model",
      "acceptance criteria",
      "IP terms",
    ],
  },
  {
    id: "IBM",
    vendorName: "IBM",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "infrastructure, hybrid cloud, managed services, SI, and enterprise technology sourcing events.",
    requiredEvidence: [
      "service catalog",
      "pricing template",
      "support model",
      "software dependencies",
      "exit terms",
    ],
  },
  {
    id: "NTT",
    vendorName: "NTT",
    tier: "enterprise",
    category: "infrastructure",
    vendorClass: "service",
    focus:
      "network, infrastructure, managed services, data center, and workplace sourcing events.",
    requiredEvidence: [
      "network scope",
      "service levels",
      "location coverage",
      "transition plan",
      "carrier dependencies",
    ],
  },
  {
    id: "DXC",
    vendorName: "DXC Technology",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "infrastructure, AMS, legacy modernization, workplace, and managed services sourcing events.",
    requiredEvidence: [
      "legacy scope",
      "transition plan",
      "tooling handback",
      "SLA history",
      "pricing template",
    ],
  },
  {
    id: "DELOITTE",
    vendorName: "Deloitte",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "consulting, SI, analytics, ERP, cyber, and transformation sourcing events.",
    requiredEvidence: [
      "SOW",
      "staffing pyramid",
      "acceptance criteria",
      "conflict disclosure",
      "IP terms",
    ],
  },
  {
    id: "KPMG",
    vendorName: "KPMG",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "advisory, risk, cyber, ERP, finance transformation, and implementation sourcing events.",
    requiredEvidence: [
      "SOW",
      "rate card",
      "conflict disclosure",
      "deliverable acceptance",
      "IP terms",
    ],
  },
  {
    id: "PWC",
    vendorName: "PwC",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "consulting, ERP, finance, risk, cyber, and transformation sourcing events.",
    requiredEvidence: [
      "SOW",
      "staffing model",
      "conflict disclosure",
      "acceptance criteria",
      "rate card",
    ],
  },
  {
    id: "EY",
    vendorName: "EY",
    tier: "enterprise",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "consulting, technology transformation, risk, cyber, and business operations sourcing events.",
    requiredEvidence: [
      "SOW",
      "role mix",
      "acceptance criteria",
      "conflict disclosure",
      "commercial exceptions",
    ],
  },
  {
    id: "EPAM",
    vendorName: "EPAM",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "digital engineering, product build, platform engineering, and application modernization sourcing events.",
    requiredEvidence: [
      "engineering delivery model",
      "rate card",
      "team locations",
      "IP terms",
      "acceptance criteria",
    ],
  },
  {
    id: "GLOBANT",
    vendorName: "Globant",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "digital product engineering, experience, data, and platform build sourcing events.",
    requiredEvidence: [
      "delivery model",
      "staffing mix",
      "rate card",
      "portfolio evidence",
      "IP terms",
    ],
  },
  {
    id: "SLALOM",
    vendorName: "Slalom",
    tier: "mid-market",
    category: "services",
    vendorClass: "professional-services",
    focus:
      "consulting, cloud, data, customer experience, and transformation sourcing events.",
    requiredEvidence: [
      "SOW",
      "local delivery model",
      "role mix",
      "acceptance criteria",
      "rate card",
    ],
  },
  {
    id: "MOURI_TECH",
    vendorName: "MOURI Tech",
    tier: "specialist",
    category: "services",
    vendorClass: "service",
    focus:
      "application services, data, integration, and managed services sourcing events.",
    requiredEvidence: [
      "scope matrix",
      "rate card",
      "references",
      "delivery locations",
      "transition plan",
    ],
  },
  {
    id: "TECH_MAHINDRA",
    vendorName: "Tech Mahindra",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "telecom, infrastructure, AMS, BPO, and managed services sourcing events.",
    requiredEvidence: [
      "service tower pricing",
      "delivery model",
      "SLA model",
      "transition plan",
      "subcontractor list",
    ],
  },
  {
    id: "LTIMINDTREE",
    vendorName: "LTIMindtree",
    tier: "enterprise",
    category: "services",
    vendorClass: "service",
    focus:
      "application services, data, cloud, ERP, and transformation sourcing events.",
    requiredEvidence: [
      "proposal",
      "pricing template",
      "delivery locations",
      "automation commitments",
      "references",
    ],
  },
];

export const SOURCING_VENDOR_PROFILE_REQUIREMENT_PATTERNS: PatternSeed[] =
  VENDORS.map((vendor) => ({
    id: `PAT-SRC-VPR-${vendor.id}`,
    slug: `${vendor.vendorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-profile-evidence-requirements`,
    title: `${vendor.vendorName} Profile Evidence Requirements`,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: `${vendor.vendorName} can be used in Source vendor context only when vendor-specific claims are grounded in dated public, licensed, buyer, or event evidence.`,
    applicability: `Apply when ${vendor.vendorName} is an incumbent, finalist, benchmark, challenger, or renewal counterparty for ${vendor.focus}`,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.74,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-AFM-001", "PAT-SRC-AFM-002"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: vendor.category,
    vendorClass: vendor.vendorClass,
    vendorLandscape: [
      {
        vendorName: vendor.vendorName,
        tier: vendor.tier,
        positioning: `Profile shell for ${vendor.focus} Source must not infer pricing posture, delivery quality, clause strength, or savings without approved evidence.`,
        cautions: [
          "Do not present vendor-specific price, discount, delivery, or clause claims until source evidence is attached.",
          "Separate public vendor facts from buyer-specific contract, pricing, and performance evidence.",
        ],
        sourceBasis: [FOUNDER_DATA_GAP],
      },
    ],
    pricingBenchmarks: [
      {
        label: `${vendor.vendorName} buyer-specific benchmark gap`,
        model: "unknown",
        sourceBasis: [FOUNDER_DATA_GAP],
        confidence: 0.35,
        notes: `Populate ${vendor.vendorName} benchmark guidance only from buyer quotes, invoices, order forms, rate cards, final contracts, renewal notices, BAFO responses, approved benchmark submissions, or licensed analyst content.`,
      },
    ],
    riskFactors: [
      {
        id: `risk-${vendor.id.toLowerCase()}-unsupported-profile-claim`,
        label: "Unsupported vendor profile claim",
        severity: "high",
        detectionSignals: [
          "Source answer ranks or characterizes the vendor using corpus memory alone.",
          "Vendor-specific discount, delivery, clause, or risk claim lacks sourceBasis.",
        ],
        mitigations: [
          "Show a citation gap and request approved vendor evidence.",
          "Downgrade guidance to pattern-level questions until evidence is loaded.",
        ],
      },
    ],
    body: `## Summary
This is a source-basis requirement pattern for ${vendor.vendorName}. It intentionally does not encode private pricing posture, delivery quality, discount norms, clause behavior, or benchmark position.

## Evidence required
Minimum useful evidence includes ${vendor.requiredEvidence.join(", ")}. Approved public, licensed analyst, buyer-specific, or event evidence must be attached before Source makes vendor-specific claims.

## CXO language
"Source can tell us what to ask ${vendor.vendorName}; it cannot tell us what ${vendor.vendorName} will do in this event until evidence is attached."`,
  }));
