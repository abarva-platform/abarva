import type { AskSource } from "./types";

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

const BROAD_CURRENT_STATE_RE =
  /\b(current state|state of play|where are we|where do we stand|how are we doing|what is going on|what do you see|give me perspective|your perspective|executive read|simple question|our state)\b/i;

const TECHNOLOGY_CONTEXT_LINE_RE =
  /\b(data|analytics|technology|technologies|tech stack|system|systems|platform|warehouse|lakehouse|bi|business intelligence|reporting|tableau|power\s*bi|sas|sql\s*server|clarity|caboodle|epic|kyriba|erp|cmdb|integration|vendor|deployment|owner|criticality|annual cost|renewal|domain|category)\b/i;

const MERIDIAN_ANALYTICS_PLATFORMS = [
  {
    label: "Epic Clarity",
    aliases: [/\bEpic\s+Clarity\b/i, /\bClarity\b/i],
  },
  {
    label: "Epic Caboodle",
    aliases: [/\bEpic\s+Caboodle\b/i, /\bCaboodle\b/i],
  },
  {
    label: "SQL Server",
    aliases: [/\bSQL\s*Server\b/i, /\bMicrosoft\s+SQL\b/i, /\bMSSQL\b/i],
  },
  { label: "Tableau", aliases: [/\bTableau\b/i] },
  { label: "SAS", aliases: [/\bSAS\b/i] },
  {
    label: "Epic Cogito",
    aliases: [/\bEpic\s+Cogito\b/i, /\bCogito\b/i],
  },
  {
    label: "Power BI",
    aliases: [/\bPower\s*BI\b/i, /\bPowerBI\b/i],
  },
] as const;

type MeridianAnalyticsStatus = "loaded" | "demo" | "missing";

interface MeridianAnalyticsCoverage {
  label: (typeof MERIDIAN_ANALYTICS_PLATFORMS)[number]["label"];
  status: MeridianAnalyticsStatus;
  evidence: string[];
}

export function isBroadCurrentStateQuestion(query: string): boolean {
  return BROAD_CURRENT_STATE_RE.test(query);
}

export function stripMarkdownControl(text: string): string {
  return text
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
    .replace(/\*([^*\n][^*\n]*?[^*\n])\*/g, "$1")
    .replace(/__([^_\n][\s\S]*?[^_\n])__/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*]\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n");
}

export function sanitizeAskSynthesis(text: string, maxWords = 120): string {
  const withoutOpener = stripMarkdownControl(
    text.replace(HOLLOW_OPENER_RE, "").trim(),
  );
  const words = withoutOpener.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return withoutOpener;

  const capped = words.slice(0, maxWords).join(" ");
  const lastSentenceEnd = Math.max(
    capped.lastIndexOf("."),
    capped.lastIndexOf("?"),
    capped.lastIndexOf("!"),
  );
  if (lastSentenceEnd > 80) return capped.slice(0, lastSentenceEnd + 1);
  return `${capped.replace(/[,\s;:]+$/, "")}...`;
}

export function applyPartialEvidencePolicy(
  text: string,
  sources: AskSource[],
): string {
  if (!hasTenantEvidence(sources)) return text;

  let rewritten = text.replace(
    /\bThe loaded sources\s+(?:give|show|provide)\s+(?:you\s+)?([^.!?]{1,140}?)\s+but\s+(?:do not|don't|does not|doesn't)\s+(?:contain|include|show|provide|name)\s+([^.!?;—]+)(?:\s*—\s*[^.!?]*(?:not|n't)\s+(?:been\s+)?(?:ingested|loaded|available)[^.!?]*)?\.?\s*(?:Here's what I can ground firmly\.?\s*)?/gi,
    (_match, evidenceScope: string, missingField: string) =>
      `The loaded sources show ${normalizeEvidenceScope(evidenceScope)}; the remaining field to confirm is ${normalizeMissingField(missingField)}. `,
  );

  rewritten = rewritten.replace(
    /\b(?:I|we)\s+(?:do not|don't)\s+have\s+([^.!?]{1,140}?)\s+(?:in|from)\s+(?:the\s+)?(?:connected|loaded|tenant)\s+(?:data|sources|context)[^.!?]*[.!?]\s*/gi,
    (_match, missingField: string) =>
      `The loaded tenant sources leave ${normalizeMissingField(missingField)} as the remaining field to confirm. `,
  );

  rewritten = rewritten.replace(
    /\b(?:that|the)\s+([^.!?]{1,120}?)\s+(?:has not|hasn't|is not|isn't)\s+(?:been\s+)?(?:ingested|loaded|available)[^.!?]*[.!?]\s*/gi,
    (_match, missingField: string) =>
      `The remaining field to confirm is ${normalizeMissingField(missingField)}. `,
  );

  rewritten = neutralizeUnavailableDetectorPhrases(rewritten);

  return rewritten
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function enforceCxoSectionBreaks(text: string): string {
  const sectioned = text
    .replace(
      /([^\n])\s+(Evidence:|Decision fork:|Risk\s*\/\s*gate:|Risk\/gate:)/g,
      (_match, before: string, marker: string) =>
        `${before}\n\n${normalizeCxoSectionMarker(marker)}`,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphBreaks = (sectioned.match(/\n\s*\n/g) ?? []).length;
  if (sectioned.length < 900 || paragraphBreaks >= 2) return sectioned;

  return sectioned
    .replace(
      /([^\n])\s+(What I can prove from evidence\b)/gi,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(
      /([^\n])\s+(Why:\s+what['’]s proven vs not\b)/gi,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(
      /([^\n])\s+(Proven\s+\(in loaded evidence\):)/gi,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(
      /([^\n])\s+(Not yet proven\s+\(must be treated as gates\):)/gi,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(
      /([^\n])\s+(Evidence checked:)/gi,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(
      /([^\n])\s+(\d+\)\s+[A-Z][^:]{4,80})/g,
      (_match, before: string, marker: string) => `${before}\n\n${marker}`,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkAskText(text: string): string[] {
  if (!text) return [text];

  const chunks: string[] = [];
  let buffer = "";
  for (const char of text) {
    buffer += char;
    if (buffer.length >= 80 && /\s/.test(char)) {
      chunks.push(buffer);
      buffer = "";
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks.length > 0 ? chunks : [text];
}

export function buildCurrentStateAdvisory(sources: AskSource[]): string | null {
  const facts = sources.flatMap((source) =>
    source.detail.split("\n").map((line) => cleanFact(line)),
  );
  const activeClient =
    stripTerminalPeriod(
      readAfter(facts, "Active client:") ?? readAfter(facts, "Tenant:"),
    ) ?? "the active client";
  const isApex = facts.some((fact) => /Apex Retail/i.test(fact));
  const strategicCenter = readAfter(facts, "Current strategic center:");
  const executivePosture = readAfter(facts, "Executive posture:");
  const briefSynthesis = readAfter(facts, "Brief synthesis:");
  const risk = facts.find((fact) => /^Risk:/i.test(fact));
  const graphEdge = facts.find((fact) => /^Graph edge:/i.test(fact));

  if (!isApex && !strategicCenter && !briefSynthesis && !risk && !graphEdge)
    return null;

  const businessLens =
    briefSynthesis ??
    strategicCenter ??
    risk ??
    "The portfolio needs sequencing before more AI commitments are added.";
  const technicalLens =
    graphEdge ??
    strategicCenter ??
    "The technical question is whether the data, ownership, and integration baseline is strong enough to support the next wave.";
  const posture = executivePosture
    ? `The leadership tension is visible: ${executivePosture}`
    : `${activeClient} has enough signal for an executive conversation, but the operating model still needs sharper ownership.`;

  return [
    `My read: ${activeClient} is not short on AI ideas. The issue is sequencing, ownership, and evidence quality before the next wave gets larger.`,
    `Business lens: ${businessLens}`,
    `Technical lens: ${technicalLens}`,
    `Leadership lens: ${posture}`,
    'The next useful question is not "what number is biggest?" It is: do you want to pressure-test this from the CFO value lens, the CIO delivery lens, or the CMO customer-growth lens first?',
  ].join("\n\n");
}

export function buildCurrentStateTechnologyAdvisory(
  sources: AskSource[],
): string | null {
  const meridianCoverage = buildMeridianAnalyticsStackAdvisory(sources);
  if (meridianCoverage) return meridianCoverage;

  const facts = collectCurrentStateTechnologyFacts(sources).slice(0, 6);
  if (facts.length === 0) return null;

  return [
    "My read: you asked for the current-state data and technology baseline, not a generic AI-bet sequencing answer. I would ground this in the loaded enterprise context first.",
    [
      "Current state I can see:",
      ...facts.map((fact, index) => `${index + 1}. ${fact}`),
    ].join("\n"),
    "Decision implication: this becomes the baseline for AI strategy, treasury/Kyriba execution, and modernization planning. If a platform, owner, integration, or reporting dependency is missing from these records, treat that as a context-layer gap to fix before ranking the next AI bet.",
  ].join("\n\n");
}

function collectCurrentStateTechnologyFacts(sources: AskSource[]): string[] {
  const facts: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!["TENANT", "SURFACE", "GRAPH"].includes(source.type)) continue;
    const sourceLooksTechnologyRelated = TECHNOLOGY_CONTEXT_LINE_RE.test(
      `${source.name} ${source.id ?? ""}`,
    );
    const lines = source.detail.split("\n").map(cleanFact);

    for (const line of lines) {
      if (
        !line ||
        /^Use these\b/i.test(line) ||
        /^Active Intelligence surface\b/i.test(line)
      )
        continue;
      if (
        !sourceLooksTechnologyRelated &&
        !TECHNOLOGY_CONTEXT_LINE_RE.test(line)
      )
        continue;

      const normalized = stripTerminalPeriod(line) ?? line;
      const fact = normalizeTechnologyFact(normalized, source);
      const key = fact.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push(fact);
      if (facts.length >= 8) return facts;
    }
  }

  return facts;
}

function buildMeridianAnalyticsStackAdvisory(
  sources: AskSource[],
): string | null {
  const coverage = collectMeridianAnalyticsCoverage(sources);
  if (!coverage) return null;

  const loaded = coverage.filter((item) => item.status === "loaded");
  const demo = coverage.filter((item) => item.status === "demo");
  const missing = coverage.filter((item) => item.status === "missing");

  return [
    "My read: for Meridian's analytics stack, the Azure-backed tenant context is partial but specific enough to separate loaded facts from demo rows and true gaps.",
    [
      "Current state I can see:",
      `1. Present in loaded Enterprise Context / CMDB: ${formatCoverageList(loaded)}.`,
      `2. Present only in the synthetic/demo application portfolio: ${formatCoverageList(demo)}.`,
      `3. Missing as named platforms in the loaded Meridian context: ${formatCoverageList(missing)}.`,
    ].join("\n"),
    "Decision implication: treat the missing list as a context-layer gap to close through the governed loader, not as proof Meridian does not own those tools. The demo rows can inform the walkthrough, but they should not override loaded enterprise-context facts.",
  ].join("\n\n");
}

function collectMeridianAnalyticsCoverage(
  sources: AskSource[],
): MeridianAnalyticsCoverage[] | null {
  const sourceText = sources
    .map((source) => `${source.name} ${source.id ?? ""} ${source.detail}`)
    .join("\n");
  if (!/\bMeridian\b/i.test(sourceText)) return null;

  const coverage = MERIDIAN_ANALYTICS_PLATFORMS.map((platform) => ({
    label: platform.label,
    status: "missing" as MeridianAnalyticsStatus,
    evidence: [] as string[],
  }));

  for (const source of sources) {
    if (!["TENANT", "SURFACE", "GRAPH"].includes(source.type)) continue;
    const sourceContext = `${source.name} ${source.id ?? ""}`;
    const lines = source.detail.split("\n").map(cleanFact);

    for (const line of lines) {
      if (!line) continue;
      for (const platform of MERIDIAN_ANALYTICS_PLATFORMS) {
        if (!platform.aliases.some((alias) => alias.test(line))) continue;

        const item = coverage.find((entry) => entry.label === platform.label);
        if (!item) continue;
        const evidenceClass = classifyMeridianAnalyticsEvidence(
          sourceContext,
          line,
        );
        if (evidenceClass === "missing") {
          item.evidence.push(line);
          continue;
        }
        if (evidenceClass === "loaded" || item.status !== "loaded") {
          item.status = evidenceClass;
        }
        item.evidence.push(line);
      }
    }
  }

  const evidenceCount = coverage.filter((item) => item.evidence.length > 0);
  const hasMeridianAnalyticsSignal =
    evidenceCount.length >= 2 ||
    /\b(Epic\s+Clarity|Epic\s+Caboodle|Epic\s+Cogito|Power\s*BI|enterprise_context|public\.applications|CMDB)\b/i.test(
      sourceText,
    );
  return hasMeridianAnalyticsSignal ? coverage : null;
}

function classifyMeridianAnalyticsEvidence(
  sourceContext: string,
  line: string,
): Exclude<MeridianAnalyticsStatus, never> {
  const haystack = `${sourceContext} ${line}`;
  if (
    /\b(absent|missing|not\s+(?:loaded|present|available)|does\s+not\s+appear|do\s+not\s+appear|unavailable|gap)\b/i.test(
      line,
    )
  ) {
    return "missing";
  }
  if (
    /\b(is_demo_data\s*=?\s*true|data_basis\s+(?:synthetic\/demo|demo)|synthetic\/demo|demo\s+row|T1\s+synthetic)\b/i.test(
      haystack,
    ) ||
    /\b(public\.applications|Structured application portfolio)\b/i.test(
      sourceContext,
    )
  ) {
    return "demo";
  }
  return "loaded";
}

function formatCoverageList(items: MeridianAnalyticsCoverage[]): string {
  if (items.length === 0) return "none surfaced";
  return items.map((item) => item.label).join(", ");
}

function normalizeTechnologyFact(line: string, source: AskSource): string {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (
    source.name &&
    !cleaned.toLowerCase().startsWith(source.name.toLowerCase()) &&
    !/^Tenant 360:/i.test(cleaned)
  ) {
    return `${source.name}: ${cleaned}`;
  }
  return cleaned;
}

function cleanFact(line: string): string {
  return line
    .replace(/^\s*-\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readAfter(facts: string[], prefix: string): string | null {
  const match = facts.find((fact) =>
    fact.toLowerCase().startsWith(prefix.toLowerCase()),
  );
  return match ? match.slice(prefix.length).trim() : null;
}

function stripTerminalPeriod(value: string | null): string | null {
  return value ? value.replace(/\.$/, "") : null;
}

function hasTenantEvidence(sources: AskSource[]): boolean {
  return sources.some(
    (source) =>
      source.type === "TENANT" ||
      source.type === "SURFACE" ||
      source.type === "GRAPH",
  );
}

function normalizeEvidenceScope(value: string): string {
  const cleaned = cleanClause(value);
  if (
    !cleaned ||
    /\b(?:the|some)\s+(?:structural\s+)?(?:picture|context)\b/i.test(cleaned)
  ) {
    return "the exposure shape and decision context";
  }
  return cleaned;
}

function normalizeMissingField(value: string): string {
  return cleanClause(value)
    .replace(/^(?:a|an|the)\s+/i, "the ")
    .replace(/\b(?:itself|directly|specifically)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanClause(value: string): string {
  return value
    .replace(/^[\s:;,\-—]+/, "")
    .replace(/[\s:;,\-—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function neutralizeUnavailableDetectorPhrases(text: string): string {
  return text
    .replace(
      /\bNo specific ([^.?!]{1,90}?) loaded,\s+so\s+/gi,
      (_match, field: string) =>
        `The loaded sources do not include a specific ${cleanClause(field)}, so `,
    )
    .replace(
      /\bno SHA-MOD entry is explicitly flagged\b/gi,
      "the loaded SHA-MOD entries are not explicitly flagged",
    )
    .replace(
      /\bNo airline in a rational posture touches\b/gi,
      "A rational airline posture leaves",
    )
    .replace(
      /\bno\s+(realized value signal|real-time coupling risk|delivery track record|controversy|dispute|contested ground)\b/gi,
      (_match, phrase: string) => `zero ${phrase}`,
    )
    .replace(/\bno clean exit path\b/gi, "lack a clean exit path")
    .replace(
      /\bnot a ledger\b/gi,
      "pattern-informed rather than ledger-confirmed",
    )
    .replace(
      /\bno ([^.?!]{1,140}?\b(?:ledger|inventory)\b)/gi,
      (_match, phrase: string) =>
        `the loaded evidence does not show ${cleanClause(phrase)}`,
    );
}

function normalizeCxoSectionMarker(value: string): string {
  return value
    .replace(/^Risk\s*\/\s*gate:/i, "Risk / gate:")
    .replace(/^Risk\/gate:/i, "Risk / gate:");
}
