import {
  advisoryPacketForClientEvent,
  advisoryPacketModelVisibleJson,
  assembleAdvisoryPacket,
} from "./assemble-advisory-packet";
import type {
  AskSource,
  IntentClassification,
} from "@/lib/intelligence/ask/types";
import type { AdvisoryPacket } from "./types";

export const SKYHARBOR_Q001 =
  "Which AI investments should SkyHarbor scale, hold, or stop, and why?";

const classification: IntentClassification = {
  intent: "general_synthesis",
  entities: ["SkyHarbor", "AI", "IROPS", "investment"],
  confidence: 91,
};

const CATEGORY_STEMS = [
  {
    category: "ai-investment-prioritization",
    prompt:
      "Which AI investments should SkyHarbor scale, hold, or stop, and why?",
  },
  {
    category: "financial-value",
    prompt:
      "Where is the strongest value case in SkyHarbor's AI portfolio, and what funding gate matters?",
  },
  {
    category: "risk-governance",
    prompt:
      "Which AI initiatives create the greatest governance or operational risk before scale?",
  },
  {
    category: "vendor-sourcing",
    prompt:
      "Which vendor or platform dependencies should sourcing pressure-test before the next AI funding release?",
  },
  {
    category: "data-readiness",
    prompt:
      "What data readiness gaps block IROPS and customer AI from becoming board-grade investments?",
  },
  {
    category: "board-summary",
    prompt:
      "What should the executive committee decide this month on SkyHarbor's AI portfolio?",
  },
  {
    category: "operating-model",
    prompt:
      "What operating model changes are needed before SkyHarbor expands autonomous disruption recovery?",
  },
  {
    category: "product-development",
    prompt:
      "How should SkyHarbor sequence AI-led product development across operations and customer journeys?",
  },
  {
    category: "customer-irops",
    prompt:
      "Should SkyHarbor prioritize IROPS recovery AI or customer digital concierge AI first?",
  },
  {
    category: "modernization",
    prompt:
      "Which modernization work is prerequisite to scaling airline AI safely?",
  },
] as const;

const VARIANT_FRAMES = [
  "Give the direct CXO answer.",
  "Frame it for a CIO and CFO joint decision.",
  "Call out what is tenant fact versus industry context.",
  "Name the top missing evidence before board approval.",
  "Include the operational owner and execution risk.",
  "Compare scale, hold, and stop options.",
  "Show the most important tradeoff.",
  "Give a concise recommendation with next actions.",
  "Identify the investment gate and decision required.",
  "Pressure-test the value claim without inventing ROI.",
] as const;

function stableQuestionId(index: number): string {
  return `Q${String(index + 1).padStart(3, "0")}`;
}

function questionFor(index: number): {
  id: string;
  category: string;
  question: string;
} {
  const category = CATEGORY_STEMS[index % CATEGORY_STEMS.length];
  const variant =
    VARIANT_FRAMES[
      Math.floor(index / CATEGORY_STEMS.length) % VARIANT_FRAMES.length
    ];
  return {
    id: stableQuestionId(index),
    category: category.category,
    question: index === 0 ? SKYHARBOR_Q001 : `${category.prompt} ${variant}`,
  };
}

function skyHarborSources(): AskSource[] {
  const tableRows = [
    {
      initiative: "IROPS recovery decisioning",
      valuePool: 270,
      posture: "scale after readiness gate",
      owner: "EVP Operations plus CDAO",
      gate: "real-time operations data freshness, lineage, and disruption-cost baseline",
    },
    {
      initiative: "Customer AI / Digital Concierge",
      valuePool: 180,
      posture: "hold at current scope",
      owner: "President Loyalty plus CDAO",
      gate: "identity, consent, and customer data platform foundation",
    },
    {
      initiative: "Data estate rationalization",
      valuePool: 122,
      posture: "start as modernization enabler",
      owner: "CDAO",
      gate: "retirement paths, business ownership, and reuse governance",
    },
    {
      initiative: "MRO predictive maintenance",
      valuePool: 96,
      posture: "scale bounded loops",
      owner: "SVP Technical Operations",
      gate: "maintenance exception telemetry and human approval controls",
    },
    {
      initiative: "Flight planning and dispatch optimization",
      valuePool: 74,
      posture: "pilot with dispatcher validation",
      owner: "VP Network Operations",
      gate: "dispatch workflow adoption and fuel-delay measurement baseline",
    },
  ];
  return [
    {
      type: "TENANT",
      name: "SkyHarbor AI portfolio decision ledger",
      id: "skyharbor-ai-portfolio-ledger",
      detail:
        "SkyHarbor's AI portfolio has named value pools: IROPS recovery decisioning at $270M, customer AI/Digital Concierge at $180M, data estate rationalization at $122M, MRO predictive maintenance at $96M, and flight planning and dispatch optimization at $74M. IROPS recovery is blocked by a real-time operations data readiness gap: freshness, lineage, and disruption-cost baseline are not yet board-grade. Customer AI is blocked by identity, consent, and customer data platform gaps. MRO has a more bounded operational loop and can scale before write-back-heavy IROPS autonomy.",
      confidence: 0.94,
      structured: {
        tables: [
          {
            id: "skyharbor-ai-portfolio",
            title: "SkyHarbor AI Portfolio",
            columns: [
              { key: "initiative", label: "Initiative" },
              {
                key: "valuePool",
                label: "Value pool",
                format: "currency",
                align: "right",
              },
              { key: "posture", label: "Posture" },
              { key: "owner", label: "Owner" },
              { key: "gate", label: "Gate" },
            ],
            rows: tableRows,
            chart: {
              kind: "bar",
              labelKey: "initiative",
              valueKey: "valuePool",
              title: "Value pool by AI initiative",
            },
          },
        ],
      },
    },
    {
      type: "GRAPH",
      name: "SkyHarbor operational dependency graph",
      id: "skyharbor-operational-dependency-graph",
      detail:
        "IROPS recovery decisioning depends on IBM Z / mainframe operational feeds, Slot-Sabre-Service availability, Weight-SAP-Hub data freshness, crew legality signals, aircraft routing state, and passenger reaccommodation workflow controls. The graph shows no single accountable owner for the cross-domain readiness gate.",
      confidence: 0.9,
    },
    {
      type: "TENANT",
      name: "SkyHarbor AI maturity and readiness notes",
      id: "skyharbor-ai-readiness-notes",
      detail:
        "AI maturity is early-stage for IROPS agentic recovery because operational-data certification, owner accountability, and benefit measurement are incomplete. AI maturity is emerging for revenue management and pricing because bounded decision loops and revenue controls are clearer. The evidence does not show an approved disruption-cost baseline or signed accountable owner for autonomous recovery expansion.",
      confidence: 0.89,
    },
    {
      type: "SURFACE",
      name: "SkyHarbor Intelligence decision surface",
      id: "skyharbor-intelligence-decision-surface",
      detail:
        "The SkyHarbor Intelligence surface is in airline portfolio-decision context and expects CXO-readable prioritization, evidence boundaries, chart/table-ready comparisons, and decision caveats rather than raw evidence labels.",
      confidence: 0.99,
    },
    {
      type: "PATTERN",
      name: "Airline IROPS AI sequencing pattern",
      id: "airline-irops-ai-sequencing-pattern",
      detail:
        "Airline industry pattern context: disruption recovery AI performs best when carriers first certify operational data freshness, keep dispatcher or operations-control review in the loop, and sequence passenger reaccommodation after crew and aircraft recovery constraints are reliable. This is industry context, not a SkyHarbor tenant fact.",
      confidence: 0.82,
    },
    {
      type: "BENCHMARK",
      name: "Airline operational AI benchmark context",
      id: "airline-operational-ai-benchmark-context",
      detail:
        "Benchmark context: airline IROPS automation case studies commonly report value from shorter recovery cycles, lower misconnects, and fewer manual recovery steps, but exact dollar impact depends on tenant disruption baseline, route network, labor rules, and data maturity.",
      confidence: 0.76,
    },
  ];
}

export interface Top100AdvisoryAuditInput {
  id: string;
  category: string;
  tenantKey: string;
  tenantName: string;
  question: string;
  classification: IntentClassification;
  sources: AskSource[];
}

export interface AdvisoryAnswerQualityResult {
  score: 1 | 2 | 3 | 4 | 5;
  checks: Record<string, boolean>;
  notes: string[];
}

export interface Top100AdvisoryAuditResult {
  input: Top100AdvisoryAuditInput;
  packet: AdvisoryPacket;
  promptJson: string;
  promptMarkdown: string;
  summaryMarkdown: string;
  answerQuality?: AdvisoryAnswerQualityResult;
}

export function buildTop100AdvisoryAuditInputs(): Top100AdvisoryAuditInput[] {
  return Array.from({ length: 100 }, (_, index) => {
    const item = questionFor(index);
    return {
      ...item,
      tenantKey: "skyharbor",
      tenantName: "Airline Demo",
      classification,
      sources: skyHarborSources(),
    };
  });
}

export function evaluateAdvisoryAnswerQuality(
  answer: string,
  packet: AdvisoryPacket,
): AdvisoryAnswerQualityResult {
  const text = answer.trim();
  const tablePresent = /\n\s*\|.+\|\s*\n\s*\|?\s*:?-{3,}/.test(text);
  const checks = {
    clearRecommendation:
      /\b(recommend|should|scale|hold|stop|prioritize|decide)\b/i.test(text),
    explainsWhy: /\b(because|why|driven by|the reason|evidence)\b/i.test(text),
    tenantFactsFirst:
      packet.modelVisiblePacket.tenantFacts.length > 0 &&
      text.slice(0, 600).toLowerCase().includes("skyharbor"),
    separatesIndustryContext:
      /\bindustry context\b|\bbenchmark context\b|\bnot tenant proof\b/i.test(
        text,
      ),
    caveatsAfterAnswer: /\bmissing|gap|caveat|not yet|not shown\b/i.test(
      text.slice(120),
    ),
    namesMissingEvidence: packet.modelVisiblePacket.gaps.some((gap) =>
      text.toLowerCase().includes(gap.statement.slice(0, 36).toLowerCase()),
    ),
    proposesNextActions:
      /\b(next|gate|validate|approve|assign|sequence)\b/i.test(text),
    avoidsRawIds:
      !/\b(?:SHA-CAP|SHA-BF|APP-|ai_maturity:|datasets\/|Row\s*:|\.csv)\b/i.test(
        text,
      ),
    preservesMarkdownTables:
      !/table/i.test(packet.questionIntent.originalQuestion) || tablePresent,
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score = (
    passed >= 9 ? 5 : passed >= 7 ? 4 : passed >= 5 ? 3 : passed >= 3 ? 2 : 1
  ) as 1 | 2 | 3 | 4 | 5;
  return {
    score,
    checks,
    notes: Object.entries(checks)
      .filter(([, value]) => !value)
      .map(([key]) => `Missing or weak: ${key}`),
  };
}

function sampleAnswerForPacket(packet: AdvisoryPacket): string {
  const firstGap =
    packet.modelVisiblePacket.gaps[0]?.statement ??
    "the board-grade readiness gate is incomplete";
  return [
    "SkyHarbor should scale MRO predictive maintenance and revenue-adjacent bounded AI first, hold IROPS agentic recovery behind the operational-data readiness gate, and stop expanding customer AI until identity and consent foundations are fixed. The reason is simple: IROPS has the largest value pool, but the tenant facts show the gate is not model capability; it is certified freshness, lineage, accountable ownership, and a disruption-cost baseline.",
    "",
    "Industry context supports the direction, but it is not tenant proof. Airline IROPS AI succeeds when recovery decisions stay bounded by certified operational data and dispatcher review before autonomous write-back expands.",
    "",
    `The main missing evidence is: ${firstGap}`,
    "",
    "| Initiative | Decision posture | Buyer implication |",
    "| --- | --- | --- |",
    "| IROPS recovery decisioning | Hold scale until readiness gate clears | Approve readiness work, not autonomous expansion |",
    "| MRO predictive maintenance | Scale bounded loops | Use it as the near-term proof pattern |",
    "| Customer AI / Digital Concierge | Hold current scope | Fund identity and consent foundations first |",
    "",
    "Next actions: assign the accountable owner for the readiness gate, validate the disruption-cost baseline, and bring back a funding decision that separates modernization spend from autonomous AI scale spend.",
  ].join("\n");
}

function promptMarkdown(
  input: Top100AdvisoryAuditInput,
  packet: AdvisoryPacket,
): string {
  return [
    `# ${input.id} · ${input.category}`,
    "",
    `Question: ${input.question}`,
    "",
    "## Model Visible Packet",
    "",
    "```json",
    advisoryPacketModelVisibleJson(packet),
    "```",
  ].join("\n");
}

function summaryMarkdown(
  input: Top100AdvisoryAuditInput,
  packet: AdvisoryPacket,
  answerQuality?: AdvisoryAnswerQualityResult,
): string {
  const diagnostics = packet.retrievalDiagnostics;
  const model = packet.modelVisiblePacket;
  return [
    `# ${input.id} · ${input.category}`,
    "",
    `Question: ${input.question}`,
    "",
    `- Advisory context richness: ${diagnostics.richnessScore}`,
    `- Evidence integrity score: ${diagnostics.evidenceIntegrityScore}`,
    `- Corpus role: ${diagnostics.corpusRole}`,
    `- Raw leakage scan: ${diagnostics.rawLeakageScan.passed ? "passed" : "failed"}`,
    `- Generic context flag: ${diagnostics.genericContextFlag ? "yes" : "no"}`,
    `- Biggest missing input: ${diagnostics.biggestMissingInput ?? "none named"}`,
    `- Recommended improvement: ${diagnostics.recommendedImprovement ?? "none"}`,
    answerQuality
      ? `- Answer quality score: ${answerQuality.score}`
      : "- Answer quality score: not sampled",
    "",
    "## Included Context",
    "",
    `- Tenant facts included: ${model.tenantFacts.length}`,
    `- Entities included: ${model.entities.map((entity) => entity.name).join(", ") || "none"}`,
    `- Relationships included: ${model.relationships.length}`,
    `- Metrics / maturity signals included: ${model.metrics.length}`,
    `- Specific gaps included: ${model.gaps.map((gap) => gap.statement).join(" | ") || "none"}`,
    `- Corpus context included: ${model.corpusContext.length}`,
    `- Expert lenses selected: ${model.expertLenses.map((lens) => `${lens.lens} ${lens.role}`).join(", ") || "none"}`,
  ].join("\n");
}

export function generateTop100AdvisoryPacketAudit(): Top100AdvisoryAuditResult[] {
  return buildTop100AdvisoryAuditInputs().map((input, index) => {
    const packet = assembleAdvisoryPacket({
      tenantKey: input.tenantKey,
      tenantName: input.tenantName,
      question: input.question,
      category: input.category,
      classification: input.classification,
      sources: input.sources,
      createdAt: "2026-06-28T00:00:00.000Z",
      industry: "airline",
      aliases: ["SkyHarbor Air", "SkyHarbor"],
    });
    const answerQuality =
      index === 0 || [11, 22, 33, 44, 55].includes(index)
        ? evaluateAdvisoryAnswerQuality(sampleAnswerForPacket(packet), packet)
        : undefined;
    const publicPacket = advisoryPacketForClientEvent(packet, false);
    return {
      input,
      packet,
      promptJson: JSON.stringify(
        {
          id: input.id,
          category: input.category,
          tenant: publicPacket.tenantIdentity,
          questionIntent: publicPacket.questionIntent,
          modelVisiblePacket: publicPacket.modelVisiblePacket,
          retrievalDiagnostics: publicPacket.retrievalDiagnostics,
        },
        null,
        2,
      ),
      promptMarkdown: promptMarkdown(input, packet),
      summaryMarkdown: summaryMarkdown(input, packet, answerQuality),
      answerQuality,
    };
  });
}
