import type { AskSource } from "./types";

type GroundingSectionKey =
  | "tenantV7"
  | "interviewSignals"
  | "currentSystems"
  | "aiProgramUsage"
  | "processEvidence"
  | "industryBenchmarks"
  | "evidenceBoundary";

interface GroundingSection {
  key: GroundingSectionKey;
  title: string;
  matcher: RegExp;
  maxItems: number;
}

export interface ClientGroundingPacketInput {
  query: string;
  tenantKey?: string | null;
  tenantName?: string | null;
  sources: AskSource[];
}

const CLIENT_GROUNDING_QUERY =
  /\b(ai|genai|generative ai|agent assist|contact.?center|call.?center|member service|customer service|copilot|automation|use cases?|trend|industry insight|benchmark|program|portfolio|tool usage|adoption|current state|tech stack|technology stack|data foundation|lakehouse|workflow|process bottleneck|readiness|value case|prioriti[sz]e|investment)\b/i;

const SECTION_RULES: GroundingSection[] = [
  {
    key: "tenantV7",
    title: "Tenant and active context",
    matcher:
      /\b(active context dossier|enterprise profile|business functions|org ownership|programs and business priorities|source evidence registry)\b/i,
    maxItems: 4,
  },
  {
    key: "interviewSignals",
    title: "Executive interview and priority signals",
    matcher:
      /\b(interview|executive|priority|business priority|sponsor|pain point|decision needed|owner|stakeholder|cxo|strategy|initiative)\b/i,
    maxItems: 4,
  },
  {
    key: "currentSystems",
    title: "Current systems, data, and integration context",
    matcher:
      /\b(applications and systems|data assets|integration|function-system-data-vendor bridge|infrastructure|cloud estate|system|application|platform|erp|crm|contact center|telephony|data asset|lakehouse|warehouse|analytics|bi|tableau|power bi|sas|epic|claims|member|service)\b/i,
    maxItems: 5,
  },
  {
    key: "aiProgramUsage",
    title: "AI program, tool, and usage evidence",
    matcher:
      /\b(ai initiatives|ai use case|ai tool|tool usage|copilot|agent|automation|production status|measured value|adoption|usage|telemetry|scale|hold|stop|model risk)\b/i,
    maxItems: 5,
  },
  {
    key: "processEvidence",
    title: "Process evidence, risk, and bottlenecks",
    matcher:
      /\b(operational process evidence|operations, risk, and controls|process|volume|cycle time|sla|breach|bottleneck|control|risk|quality|lineage|readiness|blocked|gap)\b/i,
    maxItems: 5,
  },
  {
    key: "industryBenchmarks",
    title: "Industry patterns and benchmarks",
    matcher:
      /\b(industry and market patterns|external benchmark|benchmark|market corpus|peer|industry|case stud|pattern|trend|range_low|range_high)\b/i,
    maxItems: 4,
  },
  {
    key: "evidenceBoundary",
    title: "Evidence boundary and missing confirmations",
    matcher:
      /\b(boundary|missing|gap|not loaded|client validated|client-to-confirm|confirm|source|evidence|synthetic|demo-depth|planning context|minimum validation)\b/i,
    maxItems: 4,
  },
];

export function isClientGroundingQuestion(query: string): boolean {
  return CLIENT_GROUNDING_QUERY.test(query);
}

export function buildClientGroundingPacketSource(
  input: ClientGroundingPacketInput,
): AskSource | null {
  if (!isClientGroundingQuestion(input.query)) return null;

  const candidates = dedupeSources(input.sources).filter((source) =>
    isGroundingCandidate(source),
  );
  if (candidates.length === 0) return null;

  const sections = SECTION_RULES.map((rule) => ({
    title: rule.title,
    items: candidates
      .filter((source) => rule.matcher.test(sourceText(source)))
      .slice(0, rule.maxItems)
      .map(summarizeSourceForGrounding),
  })).filter((section) => section.items.length > 0);

  if (sections.length === 0) return null;

  const tenantName = input.tenantName?.trim() || input.tenantKey?.trim() || "this tenant";
  const detail = [
    `CLIENT GROUNDING PACKET for ${tenantName}.`,
    "Purpose: answer AI strategy, use-case, industry-trend, and automation questions through this tenant's loaded context before using generic market advice.",
    `User question: ${input.query}`,
    ...sections.flatMap((section) => [
      "",
      `${section.title}:`,
      ...section.items.map((item) => `- ${item}`),
    ]),
    "",
    "Answer contract: give the executive read first, then make recommendations through the loaded client context. Explicitly separate tenant-loaded facts, industry patterns, and missing/client-to-confirm evidence. If current systems, data readiness, interviews, AI tool usage, or process bottlenecks are not present in this packet, say that gap plainly instead of filling it with generic assumptions.",
  ].join("\n");

  return {
    type: "TENANT",
    name: `Client grounding packet (${tenantName})`,
    id: `${slugify(input.tenantKey || tenantName)}:client-grounding-packet`,
    confidence: 0.93,
    detail: detail.slice(0, 5200),
  };
}

function dedupeSources(sources: AskSource[]): AskSource[] {
  const seen = new Set<string>();
  const result: AskSource[] = [];
  for (const source of sources) {
    const key = `${source.id ?? ""}|${source.name}|${source.detail.slice(0, 240)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

function isGroundingCandidate(source: AskSource): boolean {
  const text = sourceText(source);
  return SECTION_RULES.some((rule) => rule.matcher.test(text));
}

function sourceText(source: AskSource): string {
  return `${source.name}\n${source.id ?? ""}\n${source.detail}`;
}

function summarizeSourceForGrounding(source: AskSource): string {
  const cleanDetail = source.detail
    .replace(/\s+/g, " ")
    .replace(/\bV7_\d+_?/gi, "")
    .replace(/\bv7_\d+_?/gi, "")
    .trim();
  const sentence =
    cleanDetail.match(/[^.!?]+[.!?]/)?.[0]?.trim() ||
    cleanDetail.slice(0, 260).trim();
  const citation = [source.name, source.id ? `id: ${source.id}` : null]
    .filter(Boolean)
    .join(", ");
  return `${sentence}${citation ? ` (${citation})` : ""}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
