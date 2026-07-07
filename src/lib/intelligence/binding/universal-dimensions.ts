import type { BindingDimension } from "./binding-payload";

type DimensionSeed = {
  dimension: string;
  description: string;
  rollup: string;
};

export const UNIVERSAL_CONTEXT_DIMENSIONS: DimensionSeed[] = [
  {
    dimension: "Enterprise Profile",
    description: "Who this enterprise is, and the shape of the technology challenge.",
    rollup: "Business strategy & priorities",
  },
  {
    dimension: "Business & Operating Model",
    description: "The functions, ownership, and where operating complexity concentrates.",
    rollup: "Business strategy & priorities",
  },
  {
    dimension: "Workforce & Personas",
    description: "The people the platform has to serve, and where AI leverage sits.",
    rollup: "Business strategy & priorities",
  },
  {
    dimension: "Business Metrics",
    description: "The outcome metrics and demand signals that define success.",
    rollup: "Business strategy & priorities",
  },
  {
    dimension: "Capabilities & Value Streams",
    description: "The business capabilities that transformation and AI are meant to lift.",
    rollup: "Business strategy & priorities",
  },
  {
    dimension: "Applications & Core Systems",
    description: "The application estate, systems of record, and modernization pressure.",
    rollup: "IT systems landscape",
  },
  {
    dimension: "Infrastructure & Cloud",
    description: "The hosting, platform, and capacity posture behind the estate.",
    rollup: "Infrastructure & cloud",
  },
  {
    dimension: "Data & Analytics Estate",
    description: "The data products, analytics platforms, and readiness caveats.",
    rollup: "Data & connectivity",
  },
  {
    dimension: "Integrations & Interfaces",
    description: "The APIs, interfaces, and integration topology connecting the estate.",
    rollup: "Data & connectivity",
  },
  {
    dimension: "Security & Compliance",
    description: "The risk, compliance, and control evidence shaping what can scale.",
    rollup: "Governance, AI & evidence",
  },
  {
    dimension: "Vendors & Contracts",
    description: "The vendor base, renewal calendar, and commercial concentration.",
    rollup: "Vendors & contracts",
  },
  {
    dimension: "IT Budget & Financials",
    description: "The run, change, AI/data, labor, vendor, and cloud cost shape.",
    rollup: "Finance & run cost",
  },
  {
    dimension: "AI & Automation Footprint",
    description: "The tools, models, gates, and adoption evidence for AI scale.",
    rollup: "Governance, AI & evidence",
  },
  {
    dimension: "Initiatives & Roadmap",
    description: "The active portfolio of initiatives, promised value, dependencies, and risk.",
    rollup: "Execution & operations",
  },
  {
    dimension: "Benefits Realization",
    description: "The evidence of value, benefits, and change outcomes.",
    rollup: "Execution & operations",
  },
  {
    dimension: "Risk & RAID Log",
    description: "The open risks, assumptions, issues, dependencies, and constraints.",
    rollup: "Governance, AI & evidence",
  },
  {
    dimension: "Operations & Service",
    description: "The operational service-management evidence and delivery health.",
    rollup: "Execution & operations",
  },
  {
    dimension: "AI Governance & Policy",
    description: "The responsible-AI, policy, HITL, monitoring, and model-gate posture.",
    rollup: "Governance, AI & evidence",
  },
  {
    dimension: "Industry Benchmarks",
    description: "How the enterprise reads against outside-in peer and market patterns.",
    rollup: "Business strategy & priorities",
  },
];

function splitEvidence(total: number, slots: number): number[] {
  if (slots <= 0) return [];
  const base = Math.floor(total / slots);
  const remainder = total - base * slots;
  return Array.from({ length: slots }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function expandUniversalContextDimensions(
  context: BindingDimension[],
): BindingDimension[] {
  if (context.length >= UNIVERSAL_CONTEXT_DIMENSIONS.length) return context;

  const byRollup = new Map(context.map((dimension) => [dimension.dimension, dimension]));
  const childrenByRollup = new Map<string, DimensionSeed[]>();
  for (const seed of UNIVERSAL_CONTEXT_DIMENSIONS) {
    const next = childrenByRollup.get(seed.rollup) ?? [];
    next.push(seed);
    childrenByRollup.set(seed.rollup, next);
  }

  const evidenceByDimension = new Map<string, number>();
  for (const [rollup, children] of childrenByRollup) {
    const source = byRollup.get(rollup);
    const split = splitEvidence(source?.evidence ?? 0, children.length);
    children.forEach((child, index) => {
      evidenceByDimension.set(child.dimension, split[index] ?? 0);
    });
  }

  return UNIVERSAL_CONTEXT_DIMENSIONS.map((seed) => {
    const source = byRollup.get(seed.rollup);
    return {
      dimension: seed.dimension,
      status: source?.status ?? "NOT LOADED",
      description: seed.description,
      evidence: evidenceByDimension.get(seed.dimension) ?? 0,
      sources: source?.sources ?? 0,
      trust: source?.trust ?? 0,
      flag: source?.flag,
    };
  });
}
