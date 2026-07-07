import "server-only";

import type {
  EnterpriseAgentContextBundle,
  EnterpriseAgentContextItem,
  EnterpriseContextItemKind,
} from "@/lib/knowledge/agent-context-broker";
import {
  buildProgramsContextBundle,
  buildProgramsContextBundleAsync,
} from "@/lib/programs/programs-broker-adapter";
import type { ProgramCore, TenancyCtx } from "@/lib/programs/types.db";
import { PHASE_LABELS } from "@/lib/programs/types.db";

const CURRENT_STATE_DOMAINS = [
  "people_org",
  "program_lifecycle",
  "system_landscape",
  "vendor_contracts",
  "financials",
  "evidence_provenance",
] as const;

export interface NexusBriefCitation {
  id: string;
  label: string;
  sourceBasis: string;
  confidence?: string;
}

export interface NexusCurrentStateBriefingSection {
  id:
    | "org"
    | "programs"
    | "technology"
    | "vendors"
    | "financials"
    | "evidence"
    | "guidance";
  title: string;
  summary: string;
  facts: string[];
  citationIds: string[];
}

export interface NexusCurrentStateAnswer {
  question: string;
  answer: string;
  facts: string[];
  citationIds: string[];
  confidence: "high" | "medium" | "low";
  missingContext: string[];
}

export interface NexusCurrentStateBriefing {
  briefingVersion: "nexus-current-state-briefing/v1";
  generatedAt: string;
  move: {
    id: string;
    name: string;
    currentPhase: number | null;
    phaseLabel: string;
    sponsor: string;
    problemStatement: string | null;
    targetOutcome: string | null;
    valueRange: string;
  };
  executiveRead: string;
  sections: NexusCurrentStateBriefingSection[];
  recommendedQuestions: string[];
  citations: NexusBriefCitation[];
  brokerWarnings: string[];
  answerQuestion: (question: string) => NexusCurrentStateAnswer;
}

interface BuildBriefingInput {
  ctx: TenancyCtx;
  tenantKey: string;
  program: ProgramCore;
  generatedAt?: string;
  bundle?: EnterpriseAgentContextBundle;
}

function compact(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function valueRange(program: ProgramCore): string {
  if (
    program.valueProjectedLowUsd !== null &&
    program.valueProjectedHighUsd !== null
  ) {
    const currency = program.valueCurrency ?? "USD";
    return `${currency} ${Number(program.valueProjectedLowUsd).toLocaleString()}-${Number(program.valueProjectedHighUsd).toLocaleString()} projected`;
  }
  if (program.valueVerifiedUsd !== null) {
    return `${program.valueCurrency ?? "USD"} ${Number(program.valueVerifiedUsd).toLocaleString()} verified`;
  }
  return "Value not captured";
}

function itemsOf(
  bundle: EnterpriseAgentContextBundle,
  kinds: EnterpriseContextItemKind[],
): EnterpriseAgentContextItem[] {
  const allowed = new Set(kinds);
  return bundle.items.filter((item) => allowed.has(item.kind));
}

function mergeSupplementalCorpusDomains(
  primary: EnterpriseAgentContextBundle,
  supplement: EnterpriseAgentContextBundle,
): EnterpriseAgentContextBundle {
  const needsKind = (kind: EnterpriseContextItemKind) =>
    primary.items.every((item) => item.kind !== kind);
  const supplementalKinds = new Set<EnterpriseContextItemKind>();
  if (needsKind("system")) supplementalKinds.add("system");
  if (needsKind("vendor_contract")) supplementalKinds.add("vendor_contract");
  if (needsKind("financial_metric") && needsKind("kpi_metric")) {
    supplementalKinds.add("financial_metric");
    supplementalKinds.add("kpi_metric");
  }
  if (needsKind("evidence")) supplementalKinds.add("evidence");

  if (supplementalKinds.size === 0) return primary;

  const existingIds = new Set(primary.items.map((item) => item.id));
  const supplementalItems = supplement.items.filter(
    (item) => supplementalKinds.has(item.kind) && !existingIds.has(item.id),
  );

  if (supplementalItems.length === 0) return primary;

  const citationIds = new Set(
    primary.citations.map((citation) => citation.evidenceId),
  );
  const supplementalCitations = supplement.citations.filter(
    (citation) => !citationIds.has(citation.evidenceId),
  );

  return {
    ...primary,
    items: [...primary.items, ...supplementalItems],
    citations: [...primary.citations, ...supplementalCitations],
    warnings: [
      ...primary.warnings,
      "Missing current-state domains supplemented from AbarVa enterprise corpus fixture; persisted tenant data remains source of truth where present.",
    ],
  };
}

function summarizeItems(
  items: EnterpriseAgentContextItem[],
  fallback: string,
  limit = 4,
): string[] {
  const facts = items
    .slice(0, limit)
    .map((item) => `${item.title}: ${item.summary}`);
  return facts.length > 0 ? facts : [fallback];
}

function citationKeyFor(item: EnterpriseAgentContextItem): string {
  return item.linkedEvidence[0]?.evidenceId ?? item.id;
}

function collectCitations(
  items: EnterpriseAgentContextItem[],
): NexusBriefCitation[] {
  const seen = new Set<string>();
  const citations: NexusBriefCitation[] = [];
  for (const item of items) {
    const linked = item.linkedEvidence[0];
    const id = linked?.evidenceId ?? item.id;
    if (seen.has(id)) continue;
    seen.add(id);
    citations.push({
      id,
      label: linked?.citationLocator ?? item.title,
      sourceBasis: item.sourceBasis,
      confidence: linked?.confidence,
    });
  }
  return citations;
}

function section(
  id: NexusCurrentStateBriefingSection["id"],
  title: string,
  summary: string,
  items: EnterpriseAgentContextItem[],
  fallback: string,
  limit = 4,
): NexusCurrentStateBriefingSection {
  return {
    id,
    title,
    summary,
    facts: summarizeItems(items, fallback, limit),
    citationIds: items.slice(0, limit).map(citationKeyFor),
  };
}

function deriveGuidance(
  program: ProgramCore,
  bundle: EnterpriseAgentContextBundle,
): string[] {
  const systems = itemsOf(bundle, ["system"]);
  const vendors = itemsOf(bundle, ["vendor_contract"]);
  const financials = itemsOf(bundle, ["financial_metric", "kpi_metric"]);
  const evidence = itemsOf(bundle, ["evidence"]);
  const guidance = [
    `Keep the Move bounded to "${compact(program.problemStatement) || program.name}" until P3 design ties every requirement back to the P2 diagnosis.`,
  ];

  if ((program.currentPhase ?? 0) >= 3) {
    guidance.push(
      "Before P4, Nexus should force an explicit design-to-value trace: root causes, target architecture, operating owner, KPI cadence, and finance assumptions.",
    );
  }
  if (systems.length > 0) {
    guidance.push(
      `Treat ${systems[0].title} as a design dependency; do not approve architecture without confirming ownership, integration path, and operational constraints.`,
    );
  } else {
    guidance.push(
      "Technology landscape is thin in the broker bundle; ask for system owners and integration evidence before design sign-off.",
    );
  }
  if (vendors.length > 0) {
    guidance.push(
      `Vendor posture matters: ${vendors[0].title} should be checked for renewal, commercial leverage, and Source handoff implications.`,
    );
  }
  if (financials.length > 0) {
    guidance.push(
      `Financial shaping should anchor on ${financials[0].title}; validate baseline grain and value attribution before declaring the business case decision-grade.`,
    );
  } else {
    guidance.push(
      "Financial baseline evidence is missing or sparse; Nexus should not let the Move advance on value narrative alone.",
    );
  }
  if (evidence.length === 0) {
    guidance.push(
      "Evidence provenance is sparse; label recommendations as directional until source-backed artifacts are attached.",
    );
  }

  return guidance;
}

function answerFromSections(
  question: string,
  sections: NexusCurrentStateBriefingSection[],
): NexusCurrentStateAnswer {
  const q = question.toLowerCase();
  const picked =
    /\b(org|owner|sponsor|decision|who|structure|role|it leadership)\b/.test(q)
      ? sections.find((s) => s.id === "org")
      : /\b(finance|financial|cost|value|baseline|kpi|metric|money|budget)\b/.test(
            q,
          )
        ? sections.find((s) => s.id === "financials")
        : /\b(system|systems|tech|technology|technologies|architecture|integration|platform|landscape|data|analytics|stack|bi|business intelligence|reporting|warehouse|lakehouse|cmdb|applications?|apps?)\b/.test(
              q,
            )
          ? sections.find((s) => s.id === "technology")
          : /\b(vendor|contract|renewal|source|sourcing|commercial)\b/.test(q)
            ? sections.find((s) => s.id === "vendors")
            : /\b(evidence|source|citation|provenance|corpus|knowledge)\b/.test(
                  q,
                )
              ? sections.find((s) => s.id === "evidence")
              : /\b(program|move|portfolio|dependency|collision|in flight)\b/.test(
                    q,
                  )
                ? sections.find((s) => s.id === "programs")
                : sections.find((s) => s.id === "guidance");

  const active = picked ?? sections[sections.length - 1];
  const hasSpecificFacts =
    active.facts.length > 0 && !active.facts[0].startsWith("No ");
  return {
    question,
    answer: `${active.summary} ${hasSpecificFacts ? active.facts.slice(0, 2).join(" ") : "The current bundle does not contain enough evidence to answer this fully."}`,
    facts: active.facts,
    citationIds: active.citationIds,
    confidence:
      hasSpecificFacts && active.citationIds.length > 0
        ? "high"
        : hasSpecificFacts
          ? "medium"
          : "low",
    missingContext: hasSpecificFacts
      ? []
      : [`More ${active.title.toLowerCase()} evidence is needed.`],
  };
}

export async function buildNexusCurrentStateBriefing(
  input: BuildBriefingInput,
): Promise<NexusCurrentStateBriefing> {
  const primaryBundle =
    input.bundle ??
    (await buildProgramsContextBundleAsync({
      tenantKey: input.tenantKey,
      programId: input.program.id,
      agentName: "Nexus",
      surface: "programs",
      allowL4RawContext: false,
      includeGraphNeighborhood: true,
      requestedDomains: [...CURRENT_STATE_DOMAINS],
    }));
  const supplementalCorpus = buildProgramsContextBundle({
    tenantKey: input.tenantKey,
    programId: input.program.id,
    agentName: "Nexus",
    surface: "programs",
    allowL4RawContext: false,
    includeGraphNeighborhood: true,
    requestedDomains: [...CURRENT_STATE_DOMAINS],
  });
  const bundle = input.bundle
    ? primaryBundle
    : mergeSupplementalCorpusDomains(primaryBundle, supplementalCorpus);

  const people = itemsOf(bundle, ["person"]);
  const programs = itemsOf(bundle, ["program", "cross_program_signal"]);
  const systems = itemsOf(bundle, ["system"]);
  const vendors = itemsOf(bundle, ["vendor_contract"]);
  const financials = itemsOf(bundle, ["financial_metric", "kpi_metric"]);
  const evidence = itemsOf(bundle, ["evidence"]);
  const guidanceFacts = deriveGuidance(input.program, bundle);
  const guidanceItems = [
    ...systems.slice(0, 1),
    ...vendors.slice(0, 1),
    ...financials.slice(0, 1),
    ...evidence.slice(0, 1),
  ];
  const phaseLabel =
    input.program.currentPhase !== null
      ? `P${input.program.currentPhase} ${PHASE_LABELS[input.program.currentPhase] ?? "Unknown"}`
      : "Phase not set";

  const sections: NexusCurrentStateBriefingSection[] = [
    section(
      "org",
      "Org Structure & Decision Rights",
      "Who owns the Move, who must shape it, and which executives matter.",
      people,
      "No org-structure records are available in the current bundle.",
      5,
    ),
    section(
      "programs",
      "Program & Portfolio State",
      "Active Moves, adjacent programs, and cross-program signals Nexus should sequence against.",
      programs,
      "No adjacent program inventory is available in the current bundle.",
      5,
    ),
    section(
      "technology",
      "Technology Landscape",
      "Systems and architecture dependencies that constrain the Move design.",
      systems,
      "No system-landscape records are available in the current bundle.",
      5,
    ),
    section(
      "vendors",
      "Vendor & Commercial Posture",
      "Contracts, renewal pressure, and Source handoff triggers that may shape the Move.",
      vendors,
      "No vendor-contract records are available in the current bundle.",
      5,
    ),
    section(
      "financials",
      "Financial Baselines & Value Levers",
      "Metrics, baselines, and value assumptions Nexus can use to keep the business case honest.",
      financials,
      "No financial baseline records are available in the current bundle.",
      5,
    ),
    section(
      "evidence",
      "Knowledge Corpus & Provenance",
      "Evidence records and corpus-backed facts Nexus can cite while advising the CXO.",
      evidence,
      "No evidence-ledger records are available in the current bundle.",
      6,
    ),
    {
      id: "guidance",
      title: "Nexus Guidance",
      summary: "How Nexus should help the CXO shape the Move from here.",
      facts: guidanceFacts,
      citationIds: guidanceItems.map(citationKeyFor),
    },
  ];

  const citations = collectCitations([...bundle.items, ...guidanceItems]);
  const executiveRead = [
    `${input.program.name} is currently in ${phaseLabel}.`,
    compact(input.program.targetOutcome) || "Target outcome is not captured.",
    `Value posture: ${valueRange(input.program)}.`,
    systems[0]
      ? `Primary technology dependency visible to Nexus: ${systems[0].title}.`
      : "Technology dependency evidence is sparse.",
    financials[0]
      ? `Primary financial anchor: ${financials[0].title}.`
      : "Financial baseline evidence is sparse.",
  ].join(" ");

  return {
    briefingVersion: "nexus-current-state-briefing/v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    move: {
      id: input.program.id,
      name: input.program.name,
      currentPhase: input.program.currentPhase,
      phaseLabel,
      sponsor: input.program.sponsorPersonId ?? "Sponsor unresolved",
      problemStatement: input.program.problemStatement,
      targetOutcome: input.program.targetOutcome,
      valueRange: valueRange(input.program),
    },
    executiveRead,
    sections,
    recommendedQuestions: [
      "Who owns the decisions around this Move?",
      "What systems constrain the P3 design?",
      "What financial baseline should we trust?",
      "Do any vendor renewals or Source events shape this?",
      "What should Nexus push the CXO to decide next?",
    ],
    citations,
    brokerWarnings: bundle.warnings,
    answerQuestion: (question: string) =>
      answerFromSections(question, sections),
  };
}

export function serializeNexusCurrentStateBriefing(
  briefing: NexusCurrentStateBriefing,
): Omit<NexusCurrentStateBriefing, "answerQuestion"> {
  const serializable: Partial<NexusCurrentStateBriefing> = { ...briefing };
  delete serializable.answerQuestion;
  return serializable as Omit<NexusCurrentStateBriefing, "answerQuestion">;
}
