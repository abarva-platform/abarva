import { repairAgentOutputContractText } from "./output-discipline/response-contract";
import {
  shapeSharedAdvisorResponse,
  type SharedResponseLabel,
  type SharedResponseShapeIssue,
} from "@/lib/answer/shared-response-shaper";

function normalizeAgentMarkupForPlainText(text: string): string {
  return text
    .replace(/<abv-sources[\s\S]*?<\/abv-sources>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6])>/gi, "\n\n")
    .replace(/<(?:p|div|h[1-6])(?:\s+[^>]*)?>/gi, "\n\n")
    .replace(/<li(?:\s+[^>]*)?>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(?:ul|ol)(?:\s+[^>]*)?>/gi, "\n")
    .replace(
      /<abv-(?:pattern|usecase|vendor)\s+[^>]*>([^<]+)<\/abv-(?:pattern|usecase|vendor)>/gi,
      " $1 ",
    )
    .replace(/<\/?(?:strong|b|em|i|span|cite)(?:\s+[^>]*)?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripChatMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|\s)#{1,6}\s+/g, "$1")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```[a-zA-Z0-9_-]*|```/g, "").trim(),
    )
    .replace(/\s+([,.;:!?])/g, "$1");
}

function normalizeVisibleWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function humanizeInternalProgramId(id: string): string {
  const words = id
    .toLowerCase()
    .replace(/-\d{4}\b/, "")
    .split(/[-_:]+/)
    .filter(
      (part) =>
        part &&
        ![
          "apex",
          "apx",
          "ar",
          "fcfi",
          "firstcapital",
          "meridian",
          "mh",
        ].includes(part),
    );

  if (words.length === 0) return "the referenced program";
  return `the ${words.join(" ")} program`;
}

function stripResidualArtifactBlocks(text: string): string {
  return text
    .replace(
      /\[\[artifact:[^\]]+\]\][\s\S]*?(?:\[\[\/artifact\]\]|\[\[\/\]\]|\[\[\/\])/g,
      " ",
    )
    .replace(/\[\[artifact:[^\]]+\]\]/g, " ");
}

function scrubInternalAdvisorText(text: string): string {
  const scrubbed = stripResidualArtifactBlocks(text)
    .replace(
      /\bThe\s+worldview\s+corpus\s+is\s+being\s+authored[^\n.]*\.?\s*/gi,
      "",
    )
    .replace(/\bworldview\s+corpus\b/gi, "strategic corpus")
    .replace(/\bworldview:W\d+:\d{3}\b/gi, "strategic framing")
    .replace(/\bcanonical\s+value\s+pattern\b/gi, "validated benchmark pattern")
    .replace(/\bretrieved\s+corpus\s+chunk\b/gi, "retrieved industry evidence")
    .replace(/\bloaded\s+corpus\s+chunk\b/gi, "loaded industry evidence")
    .replace(/\baudited\s+substrate\b/gi, "audited evidence base")
    .replace(/\btenant\s+substrate\b/gi, "tenant evidence base")
    .replace(/\bsubstrate\b/gi, "evidence base")
    .replace(
      /\bnot\s+exposed\s+in\s+this\s+surface\b/gi,
      "not available in the current evidence",
    )
    .replace(/\bsig:[a-z0-9:_-]+\b/gi, "the cross-program signal")
    .replace(
      /\bsignal\s*:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "the referenced portfolio signal",
    )
    .replace(/\bsignal:[a-z0-9:_-]{8,}\b/gi, "the referenced portfolio signal")
    .replace(
      /\b(?:fcfi|firstcapital|apex|apx|meridian|mh|ar)-[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}\b/gi,
      (match) => humanizeInternalProgramId(match),
    )
    .replace(
      /\bat\s+the\s+general\s+(?:ai\s+)?(?:industry|pattern|domain)\s+level\s*[,—-]?\s*(?:not\s+corpus[- ]grounded\s+(?:for|to)\s+[^,.;]+[,.;]?\s*)?/gi,
      "",
    )
    .replace(
      /\bthis\s+is\s+a\s+generic\s+observation\s*,?\s*not\s+corpus[- ]grounded(?:\s+(?:for|to)\s+[^.]+)?\.?/gi,
      "This is judgment from the pattern, not tenant-specific benchmark data.",
    )
    .replace(/\bnot\s+corpus[- ]grounded\s+(?:for|to)\s+[^,.;]+[,.;]?\s*/gi, "")
    .replace(
      /\b(?:the\s+)?(?:indexed\s+)?sources?\s+(?:don'?t|do\s+not)\s+contain\b/gi,
      "I do not have enough evidence to claim",
    )
    .replace(
      /\b(?:the\s+)?corpus\s+(?:does\s+not|doesn'?t)\s+(?:include|contain|cover)\b/gi,
      "I do not have enough evidence to claim",
    )
    .replace(
      /\bwhat\s+the\s+(?:indexed\s+)?sources?\s+do\s+show\b/gi,
      "The strongest evidence I can see",
    );

  return normalizeVisibleWhitespace(scrubbed);
}

function repairCurrencyFragments(text: string): string {
  return text.replace(
    /(?<![$\w])(\d+(?:\.\d+)?)M\b(?=\s+(?:measured|realized|committed|booked|forecast|budgeted|spend|cost|value|benefit|savings|impact|in\s+(?:benefit|value|impact|savings))\b)/gi,
    "$$$1M",
  );
}

function stripGenericDecisionFooter(text: string): string {
  return text.replace(
    /\s*Next,\s+have\s+the\s+accountable\s+owner\s+review\s+the\s+listed\s+sources\s+and\s+decide\s+whether\s+this\s+belongs\s+in\s+Source,\s*Tower,\s*or\s+Moves\.?/gi,
    "",
  );
}

function humanizeEvidenceLanguage(text: string): string {
  return text
    .replace(/^SOURCES\s*$/gim, "")
    .replace(/^\s*Evidence\s+(?:trail|drill-down)\s*:.*$/gim, "")
    .replace(/^\s*Evidence\s+(?:trail|drill-down)\s*$/gim, "")
    .replace(/\bcontrol-supporting material\b/gi, "control evidence")
    .replace(/\bSOX signer supporting material\b/gi, "SOX signer evidence")
    .replace(/\bsupporting material\b/gi, "evidence")
    .replace(/\n\s*·\s*\n\s*tenant support\b/gi, " (tenant evidence)")
    .replace(/\s+·\s+tenant support\b/gi, " (tenant evidence)")
    .replace(/\btenant support\b/gi, "tenant evidence");
}

function collapseRawEvidenceDump(text: string): string {
  return text
    .replace(
      /\n+TABLES\s*\n\s*(?:Supporting Material|Evidence)\s*\n\s*SOURCE\s+TYPE\s+CONFIDENCE\s+HOW\s+IT\s+SUPPORTS\s+THE\s+ANSWER[\s\S]*$/i,
      "",
    )
    .replace(
      /\n+(?:SOURCES|Evidence\s+trail)\s*\n[\s\S]*?(?=\n{2,}[A-Z][^\n]+\n|\n{2,}(?:Next|Decision|Recommendation|Risk|Owner)\b|$)/gi,
      "",
    );
}

function shapeSharedRenderDefects(text: string): string {
  return normalizeVisibleWhitespace(
    repairCurrencyFragments(
      collapseRawEvidenceDump(
        humanizeEvidenceLanguage(stripGenericDecisionFooter(text)),
      ),
    ),
  );
}

function normalizeCompactLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return stripDanglingTrimTail(words.slice(0, maxWords).join(" "));
}

function stripDanglingTrimTail(text: string): string {
  const original = text.trim();
  let cleaned = original.replace(/[,:;.-]+$/, "").trim();

  cleaned = cleaned
    .replace(
      /\s+(?:and|or|but)\s+(?:to\s+)?(?:proceed|continue|move|advance|reconcile|decide|approve|fund|cut|defer|pause|compare|validate|use|open|route|escalate)(?:\s+\w+){0,2}$/i,
      "",
    )
    .trim();

  cleaned = cleaned
    .replace(
      /\s+\b(?:and|or|but|with|to|of|for|from|against|into|about|on|at|by|as|than|while|because|before|after|if|then)\b$/i,
      "",
    )
    .trim();

  cleaned = cleaned
    .replace(
      /\s+\b(?:vs|versus|has|have|had|is|are|was|were|be|being|been|not|no|without)\b$/i,
      "",
    )
    .trim();

  cleaned = cleaned
    .replace(
      /\bnot\s+because\s+[^.?!]{0,80}\b(?:has|have|had|is|are|was|were|no)\b$/i,
      "",
    )
    .trim();

  return cleaned || original.replace(/[,:;.-]+$/, "").trim();
}

function sentenceWithPeriod(text: string): string {
  const normalized = normalizeCompactLine(text).replace(/\.+$/, "");
  return /[!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

const VS_DOT_SENTINEL = "ABARVA_VS_DOT_SENTINEL";

function splitSentences(text: string): string[] {
  return text
    .replace(/\bvs\./gi, (match) => match.replace(".", VS_DOT_SENTINEL))
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replaceAll(VS_DOT_SENTINEL, "."))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isRecommendationSentence(sentence: string): boolean {
  return /\b(recommend|choose|do not|highest|lowest|defer|pursue|fix|next|pause|approve|prioritize)\b/i.test(
    sentence,
  );
}

function extractNumberedItems(text: string): string[] {
  const matches = Array.from(
    text.matchAll(/(?:^|\s)([1-4])\.\s+([\s\S]*?)(?=(?:\s[1-4]\.\s+)|$)/g),
  );

  return matches
    .map((match) => match[2]?.trim() ?? "")
    .map((item) =>
      item.replace(/\s*(What do you want to do|Choose:)[\s\S]*$/i, "").trim(),
    )
    .filter(Boolean);
}

function extractItemTitle(item: string): string {
  const title = item.split(/\s+[—-]\s+/)[0] ?? item;
  return trimWords(normalizeCompactLine(title), 8);
}

function extractEvidenceLine(item: string): string {
  const afterDivider =
    item
      .split(/\s+[—-]\s+/)
      .slice(1)
      .join(" - ") || item;
  const metricClauses = afterDivider
    .split(/;|\.\s+|,\s+(?=[a-z])/i)
    .map((part) => part.trim())
    .filter((part) =>
      /\d|target|gap|margin|stockout|markdown|turn|MAPE|forecast|baseline/i.test(
        part,
      ),
    );

  const evidence =
    metricClauses.length > 0
      ? metricClauses.slice(0, 4).join("; ")
      : afterDivider;
  return trimWords(evidence, 38);
}

function extractMissingLine(
  text: string,
  excludeSources: string[] = [],
): string | null {
  const isExcluded = (candidate: string): boolean => {
    const normalizedCandidate = normalizeCompactLine(candidate).toLowerCase();
    if (!normalizedCandidate) return false;
    return excludeSources.some((excluded) => {
      const normalizedExcluded = normalizeCompactLine(excluded).toLowerCase();
      if (!normalizedExcluded) return false;
      // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B (Evidence/Missing collision):
      // if the same sentence is already assigned to Evidence, never let it
      // also surface as Missing. Treat overlap as a collision (Evidence wins).
      return (
        normalizedExcluded === normalizedCandidate ||
        normalizedExcluded.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedExcluded)
      );
    });
  };

  const explicit = text.match(
    /(?:Explicitly\s+missing\s+data(?:\s+that\s+would\s+change\s+ranking)?|Data\s+missing|Missing):\s*([^?]+?)(?=(?:\s+[A-Z][a-z]+:)|(?:\s+What\s+do\s+you)|$)/i,
  );
  if (explicit?.[1] && !isExcluded(explicit[1]))
    return trimWords(explicit[1].trim(), 28);

  const missingSentence = splitSentences(text).find(
    (sentence) =>
      /\b(missing|do not have|don't have|absent|not in the retrieved context)\b/i.test(
        sentence,
      ) &&
      !isRecommendationSentence(sentence) &&
      !isExcluded(sentence),
  );
  return missingSentence ? trimWords(missingSentence, 28) : null;
}

function extractQuestionLine(text: string): string | null {
  const question = splitSentences(text)
    .reverse()
    .find((sentence) => sentence.endsWith("?"));
  if (!question) return null;
  return trimWords(question, 22);
}

function parseTableCells(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => normalizeCompactLine(cell));
}

function stripDanglingParagraphTail(text: string): string {
  return text
    .replace(
      /\s+\b(?:and|or|but|with|to|of|for|against|because|before|after|while|if|then|vs|versus)\s*$/i,
      "",
    )
    .trim();
}

function isMalformedOptionComparisonTable(tableLines: string[]): boolean {
  const header = tableLines[0] ?? "";
  if (
    !/^\|\s*Option\s*\|\s*Strength\s*\|\s*Weakness\s*\|\s*Fit\s*\|$/i.test(
      header,
    )
  ) {
    return false;
  }

  const rows = tableLines
    .slice(2)
    .map(parseTableCells)
    .filter((cells) => cells.length >= 4);

  if (rows.length === 0) return true;

  return rows.some(([option, strength, weakness, fit]) => {
    const placeholderCount = [strength, weakness, fit].filter(
      (cell) => cell === COMPARISON_CELL_PLACEHOLDER,
    ).length;
    return (
      /^(which|what|who|where|when|why|how)\b/i.test(option) ||
      /\b(?:and|or|but|with|to|of|for|against|because|before|after|vs|versus|has|no)\.?$/i.test(
        strength,
      ) ||
      (placeholderCount >= 2 && option.split(/\s+/).length > 4)
    );
  });
}

function optionTableRowsToPlainText(tableLines: string[]): string[] {
  return tableLines
    .slice(2)
    .map(parseTableCells)
    .filter((cells) => cells.length >= 4)
    .map(([option, strength]) => {
      if (!option || option === COMPARISON_CELL_PLACEHOLDER) return null;
      const cleanStrength =
        strength && strength !== COMPARISON_CELL_PLACEHOLDER
          ? stripDanglingParagraphTail(strength)
          : "";
      const prefix = /^(which|what|who|where|when|why|how)\b/i.test(option)
        ? "Question"
        : option;
      const detail = cleanStrength ? `: ${cleanStrength}` : "";
      return sentenceWithPeriod(`${prefix}${detail}`);
    })
    .filter((line): line is string => Boolean(line));
}

function repairMalformedComparisonTables(text: string): string {
  const lines = text.split("\n");
  const repaired: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (
      !/^\|\s*Option\s*\|\s*Strength\s*\|\s*Weakness\s*\|\s*Fit\s*\|$/i.test(
        line.trim(),
      )
    ) {
      repaired.push(line);
      continue;
    }

    const tableLines = [line];
    let cursor = index + 1;
    while (
      cursor < lines.length &&
      /^\|.+\|$/.test((lines[cursor] ?? "").trim())
    ) {
      tableLines.push(lines[cursor] ?? "");
      cursor += 1;
    }

    if (!isMalformedOptionComparisonTable(tableLines)) {
      repaired.push(...tableLines);
      index = cursor - 1;
      continue;
    }

    const trailingBlankLines: string[] = [];
    while (
      repaired.length > 0 &&
      (repaired[repaired.length - 1] ?? "").trim() === ""
    ) {
      trailingBlankLines.push(repaired.pop() ?? "");
    }
    const previous = repaired.pop();
    if (previous != null) repaired.push(stripDanglingParagraphTail(previous));
    repaired.push(...trailingBlankLines);
    repaired.push(...optionTableRowsToPlainText(tableLines));
    index = cursor - 1;
  }

  return normalizeVisibleWhitespace(repaired.join("\n"));
}

function preserveReadableTable(text: string): string | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tableLines = lines.filter((line) => /^\|.+\|$/.test(line));
  if (tableLines.length < 2) return null;
  if (isMalformedOptionComparisonTable(tableLines)) return null;
  const lead = lines.find(
    (line) => !/^\|.+\|$/.test(line) && !/^[-:| ]+$/.test(line),
  );
  const table = tableLines.slice(0, 7).join("\n");
  return normalizeVisibleWhitespace(
    [lead ? trimWords(lead, 24) : null, table].filter(Boolean).join("\n\n"),
  );
}

function compactBriefNarrativeText(text: string): string | null {
  const sentences = splitSentences(text);
  const hasStructuralCue =
    /\b(recommend|choose|compare|option|vendor|scenario|steps?|data says|KPI|evidence|source|missing|risk)\b/i.test(
      text,
    );
  if (
    hasStructuralCue ||
    sentences.length < 3 ||
    sentences.length > 6 ||
    wordCount(text) > 135
  )
    return null;

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(
      sentences
        .slice(i, i + 2)
        .map((sentence) => sentenceWithPeriod(sentence))
        .join(" "),
    );
  }
  return normalizeVisibleWhitespace(paragraphs.slice(0, 3).join("\n\n"));
}

interface ComparisonItem {
  option: string;
  strength: string;
  weakness: string;
  fit: string;
}

// ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B (templated boilerplate):
// Sentinel for cells the extractors could not honestly fill. Rendered as
// an em-dash placeholder, never as a fake "Needs validation." or
// "Medium pending evidence." assertion. Reads as honest absence, not
// machine-generated filler.
const COMPARISON_CELL_PLACEHOLDER = "—";

function extractComparisonItems(text: string): ComparisonItem[] {
  const optionBlocks = Array.from(
    text.matchAll(
      /(?:^|\s)(?:Option\s*)?([A-Z0-9][A-Za-z0-9 /&+-]{2,45})\s+[—-]\s+([\s\S]*?)(?=(?:\s(?:Option\s*)?[A-Z0-9][A-Za-z0-9 /&+-]{2,45}\s+[—-]\s+)|$)/g,
    ),
  );

  return optionBlocks
    .map((match) => {
      const option = trimWords(normalizeCompactLine(match[1] ?? ""), 6);
      const body = normalizeCompactLine(match[2] ?? "");
      // Strength: prefer explicit "Strength:" label; otherwise the first
      // sentence (which is what an advisor naturally leads with).
      const strengthRaw =
        body.match(/Strength:\s*([^.;]+[.;]?)/i)?.[1] ??
        splitSentences(body)[0] ??
        body;
      // Weakness: explicit "Weakness:" label, or a "but/however" clause.
      // No fallback prose — if neither pattern exists, the cell is honestly
      // empty rather than a templated "Needs validation." assertion.
      const weaknessRaw =
        body.match(/Weakness:\s*([^.;]+[.;]?)/i)?.[1] ??
        body.match(/(?:but|however)\s+([^.;]+[.;]?)/i)?.[1] ??
        null;
      // Fit: explicit "Fit:" label, or a "best for ..." phrase. Same rule
      // as weakness — no templated "Medium pending evidence." filler.
      const fitRaw =
        body.match(/Fit:\s*([^.;]+[.;]?)/i)?.[1] ??
        body.match(/best\s+for\s+([^.;]+[.;]?)/i)?.[1] ??
        null;

      return {
        option,
        strength: strengthRaw
          ? trimWords(strengthRaw, 12)
          : COMPARISON_CELL_PLACEHOLDER,
        weakness: weaknessRaw
          ? trimWords(weaknessRaw, 12)
          : COMPARISON_CELL_PLACEHOLDER,
        fit: fitRaw ? trimWords(fitRaw, 10) : COMPARISON_CELL_PLACEHOLDER,
      };
    })
    .filter((item) => item.option && item.option.length <= 55)
    .slice(0, 4);
}

function compactComparisonText(text: string): string | null {
  const existingTable = preserveReadableTable(text);
  if (existingTable) return existingTable;
  if (
    !/\b(compare|option|vendor|scenario|versus| vs\.? |fit|strength|weakness)\b/i.test(
      text,
    )
  )
    return null;
  const hasExplicitCells = /\b(Strength|Weakness|Fit):/i.test(text);
  const hasOptionBlocks =
    /\b(?:Option\s*)?[A-Z0-9][A-Za-z0-9 /&+-]{2,45}\s+[—-]\s+\b/i.test(text);
  const hasComparisonDomainCue =
    /\b(candidates?|paths?|scenarios?|options?|alternatives?|routes?)\b/i.test(
      text,
    ) ||
    /\b(?:vendor\s+(?:candidates?|comparison|shortlist)|between\s+vendors?|vendors?\s+to\s+compare)\b/i.test(
      text,
    );
  if (!hasExplicitCells && !hasOptionBlocks) {
    return null;
  }

  if (!hasExplicitCells && !hasComparisonDomainCue) {
    return null;
  }

  const sentences = splitSentences(text);
  const items = extractComparisonItems(text);
  if (items.length < 2) return null;

  const hasDanglingCell = items.some((item) =>
    [item.option, item.strength, item.weakness, item.fit]
      .filter((value) => value !== COMPARISON_CELL_PLACEHOLDER)
      .some((value) =>
        /\b(?:and|or|but|with|to|of|for|against|because|vs|versus|has|have|had|is|are|was|were|not|no)\.?$/i.test(
          value,
        ),
      ),
  );
  if (hasDanglingCell) return null;

  const lead = trimWords(
    sentences[0] ?? "The comparison comes down to fit and evidence.",
    22,
  );
  // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B: never wrap the empty-cell
  // placeholder ("—") with a trailing period. Treat the placeholder as
  // already-final text.
  const renderCell = (value: string): string =>
    value === COMPARISON_CELL_PLACEHOLDER ? value : sentenceWithPeriod(value);
  const rows = [
    "| Option | Strength | Weakness | Fit |",
    "|---|---|---|---|",
    ...items.map(
      (item) =>
        `| ${item.option} | ${renderCell(item.strength)} | ${renderCell(item.weakness)} | ${renderCell(item.fit)} |`,
    ),
  ];
  const synthesis = sentences.find(
    (sentence) =>
      /\b(recommend|best|choose|therefore|so)\b/i.test(sentence) &&
      sentence !== sentences[0],
  );
  return normalizeVisibleWhitespace(
    [lead, rows.join("\n"), synthesis ? trimWords(synthesis, 26) : null]
      .filter(Boolean)
      .join("\n\n"),
  );
}

function compactStepText(text: string): string | null {
  const sentences = splitSentences(text);
  const numberedItems = extractNumberedItems(text);
  const hasStepCue =
    /\b(how|path|process|steps?|sequence|walk me through|first|then|handoff)\b/i.test(
      text,
    );
  if (!hasStepCue) return null;

  const steps =
    numberedItems.length >= 2
      ? numberedItems
      : sentences.filter((sentence) =>
          /\b(first|then|next|finally|step)\b/i.test(sentence),
        );
  if (steps.length < 2) return null;

  const lead = trimWords(sentences[0] ?? "The path is sequential.", 22);
  const lines = steps.slice(0, 5).map((step, index) => {
    const clean = normalizeCompactLine(step).replace(
      /^(First|Then|Next|Finally),?\s*/i,
      "",
    );
    const splitOnLabel = clean.includes(":") || /\s+[—-]\s+/.test(clean);
    const [name, ...rest] = splitOnLabel
      ? clean.split(/:\s+|[—-]\s+/)
      : clean.split(/\.\s+/);
    const title = trimWords(name || `Step ${index + 1}`, 6);
    const rawDetail = splitOnLabel ? rest.join(" ") : rest[0];
    const detailText = splitSentences(rawDetail ?? "")[0] ?? rawDetail ?? "";
    const detail = trimWords(detailText, 18);
    // ATLAS-HI-3-2026-05-30 — duplication fix. Previously the fallback was
    // `?? clean`, which meant a step with no separator (e.g. "Predictive
    // next-edit.") rendered as `title === detail`, producing the audit's
    // signature "1. Predictive next-edit. Predictive next-edit." damage.
    // If detail is empty OR collapses to the same normalized form as
    // title, emit only the title.
    const normalizedTitle = title
      .toLowerCase()
      .replace(/[.!?]+$/, "")
      .trim();
    const normalizedDetail = detail
      .toLowerCase()
      .replace(/[.!?]+$/, "")
      .trim();
    if (!detail || normalizedDetail === normalizedTitle) {
      return `${index + 1}. ${sentenceWithPeriod(title)}`;
    }
    return `${index + 1}. ${sentenceWithPeriod(title)} ${sentenceWithPeriod(detail)}`;
  });
  const outcome = sentences.find(
    (sentence, index) =>
      index > 0 &&
      /\b(outcome|result|so that|ends with|leaves you)\b/i.test(sentence),
  );
  return normalizeVisibleWhitespace(
    [lead, ...lines, outcome ? trimWords(outcome, 22) : null]
      .filter(Boolean)
      .join("\n"),
  );
}

function compactStatStackText(text: string): string | null {
  const sentences = splitSentences(text);
  const hasDataCue =
    /\b(data says|what does the data|typical|benchmark|numbers say|evidence says)\b/i.test(
      text,
    );
  const numericSentences = sentences.filter(
    (sentence) =>
      /\d|%|\$|bp|x\b|KPI|MAPE|ROI|margin/i.test(sentence) &&
      !/\b(source|basis|confidence|retrieved|corpus|tenant)\b/i.test(sentence),
  );
  if (!hasDataCue || numericSentences.length < 2) return null;

  const lead = trimWords(numericSentences[0] ?? sentences[0] ?? text, 24);
  const stats = numericSentences
    .filter((sentence) => sentence !== numericSentences[0])
    .slice(0, 4)
    .map((sentence) => `· ${sentenceWithPeriod(trimWords(sentence, 22))}`);
  const source = sentences.find((sentence) =>
    /\b(source|basis|confidence|retrieved|corpus|tenant)\b/i.test(sentence),
  );
  const sourceDetail = source?.replace(/^Source\s+basis:\s*/i, "");
  return normalizeVisibleWhitespace(
    [
      lead,
      ...stats,
      sourceDetail
        ? `Source: ${sentenceWithPeriod(trimWords(sourceDetail, 22))}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

// VOICE.STRAT-2026-05-10f — kept but no longer wired. The legacy
// `/strategic-moves/new` dispatch branch in shapeAgentResponseForSurface
// that called this function was removed alongside the shouldCompactSurface
// narrowing. Strategic Moves originate is now a Brief B advisor surface
// and passes through to natural prose. Function preserved (rather than
// deleted) per the brief's "don't refactor compactConsultantChatText"
// scope, in case a non-advisor surface ever needs the
// {headline}/-Why/-Missing/-Choose template again. If still unused at
// the next voice-doctrine review, delete entirely.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compactStrategicMoveOriginateText(text: string): string {
  const comparison = compactComparisonText(text);
  if (comparison) return comparison;
  const steps = compactStepText(text);
  if (steps) return steps;
  const stats = compactStatStackText(text);
  if (stats) return stats;
  const narrative = compactBriefNarrativeText(text);
  if (narrative) return narrative;

  const normalized = normalizeVisibleWhitespace(
    text.replace(/\bHere'?s the ranking:\s*/i, ""),
  );
  const sentences = splitSentences(normalized);
  const numberedItems = extractNumberedItems(normalized);
  const shouldPreserve =
    numberedItems.length === 0 &&
    sentences.length <= 3 &&
    wordCount(normalized) <= 75 &&
    normalized.includes("\n");
  if (shouldPreserve) return normalized;

  const headline = trimWords(sentences[0] ?? normalized, 18);
  const question = extractQuestionLine(normalized);

  if (numberedItems.length > 0) {
    const recommended = extractItemTitle(numberedItems[0] ?? "");
    const alternate = numberedItems[1]
      ? extractItemTitle(numberedItems[1])
      : null;
    const evidence = extractEvidenceLine(numberedItems[0] ?? "");
    // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B (Evidence/Missing collision):
    // exclude the evidence span so the same text never lands in both slots.
    const missing = extractMissingLine(normalized, evidence ? [evidence] : []);
    const lines = [
      headline,
      evidence ? `- Why: ${sentenceWithPeriod(evidence)}` : null,
      missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
      "- Choose:",
      `  1. ${recommended || "Use this as the Move"}`,
      `  2. ${alternate || "Compare another path"}`,
      "  3. Type your own",
    ].filter(Boolean);
    return normalizeVisibleWhitespace(lines.join("\n"));
  }

  const support = sentences.find(
    (sentence, index) =>
      index > 0 &&
      /\d|KPI|financial|system|strategy|evidence|baseline|confidence/i.test(
        sentence,
      ),
  );
  // Same Evidence/Missing collision exclusion for the fallback branch.
  const missing = extractMissingLine(normalized, support ? [support] : []);
  const lines = [
    headline,
    support
      ? `- Evidence: ${sentenceWithPeriod(trimWords(support, 28))}`
      : null,
    missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
    question
      ? `- Next: ${normalizeCompactLine(question)}`
      : "- Choose: use this framing / compare another path / type your own.",
  ].filter(Boolean);

  return normalizeVisibleWhitespace(lines.join("\n"));
}

function compactConsultantChatText(text: string, maxWords: number): string {
  const comparison = compactComparisonText(text);
  if (comparison) return comparison;
  const steps = compactStepText(text);
  if (steps) return steps;
  const stats = compactStatStackText(text);
  if (stats) return stats;
  const narrative = compactBriefNarrativeText(text);
  if (narrative) return narrative;

  const sentences = splitSentences(text);
  const shouldPreserve =
    sentences.length <= 3 &&
    wordCount(text) <= Math.min(maxWords, 75) &&
    text.includes("\n");
  if (shouldPreserve) return text;

  const headline = trimWords(sentences[0] ?? text, 18);
  const question = extractQuestionLine(text);
  // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B (Evidence/Missing collision):
  // compute evidence FIRST, then pass it to extractMissingLine as the
  // exclude-source. If the same sentence carries both signals, Evidence
  // wins and Missing is rendered empty rather than duplicating the text.
  const evidence =
    sentences.find(
      (sentence, index) =>
        index > 0 &&
        !isRecommendationSentence(sentence) &&
        /\d|KPI|financial|system|strategy|baseline|risk|confidence|source/i.test(
          sentence,
        ),
    ) ??
    sentences.find(
      (sentence, index) =>
        index > 0 &&
        !isRecommendationSentence(sentence) &&
        /\b(require|proof|integration|adoption|workflow|data|guardrail|ownership|readiness|connector)\b/i.test(
          sentence,
        ),
    );
  const missing = extractMissingLine(text, evidence ? [evidence] : []);
  const recommendation = sentences.find(
    (sentence, index) =>
      index > 0 &&
      sentence !== evidence &&
      sentence !== missing &&
      isRecommendationSentence(sentence),
  );

  const lines = [
    headline,
    evidence
      ? `- Evidence: ${sentenceWithPeriod(trimWords(evidence, 28))}`
      : null,
    missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
    recommendation
      ? `- Next: ${sentenceWithPeriod(trimWords(recommendation.replace(/^[-·]?\s*Next:\s*/i, ""), 22))}`
      : null,
    question
      ? `- Question: ${normalizeCompactLine(trimWords(question, 20))}`
      : null,
  ].filter(Boolean);

  return normalizeVisibleWhitespace(lines.join("\n"));
}

function shouldCompactSurface(surface: string): boolean {
  // VOICE.STRAT-2026-05-10f — Source + Strategic Moves removed.
  //
  // Extension of the 2026-05-10e Intelligence-surface fix. The same render-
  // bypass class affects every surface that runs a Brief A/B/C-style
  // expert-posture agent. compactConsultantChatText (and the now-removed
  // /strategic-moves/new branch's compactStrategicMoveOriginateText)
  // disassemble advisor prose and reassemble it into a fixed
  //
  //   {headline}
  //   - Evidence: …
  //   - Missing: …
  //   - Next: …
  //   - Question: …
  //
  // template, with extractMissingLine promoting any "missing" / "don't have"
  // / "absent" sentence into a "- Missing:" bullet — amplifying every honest
  // data caveat into a compliance-style refusal shape. The Brief A/B/C
  // contract explicitly requires natural advisor prose; the compaction
  // template is a Brief violation by construction.
  //
  // Surfaces removed in this iteration:
  //   - 'source' / '/source'                          (Brief C — Source)
  //   - 'programs' / '/programs/new'                  (Brief B — Strategic Moves index + originate)
  //   - 'programs-detail'                             (Brief B — Move detail / phase / evidence)
  //   - 'strategic-moves' / 'strategic-moves-new' /
  //     'strategic-moves-workspace' / '/strategic-moves'  (legacy aliases, swept for completeness)
  //
  // Surfaces kept (correctly compacted — dashboard / form, not advisor chat):
  //   - 'setup' / '/admin/setup'                      (admin setup form surface)
  //   - '/setup'                                      (legacy compatibility bridge)
  //   - '/platform/admin'                             (admin form surface)
  //
  // Wave 0 L6 production retests later proved Tower is also an advisor
  // surface for Atlas chat: the compactor turned real answers into
  // malformed tables, dangling numbered lists, and "Evidence: 1." stubs.
  // Tower now preserves natural Atlas output and only applies safety
  // repairs (markup/id scrubbing, malformed-table repair, next-action
  // fallback).
  //
  // The anti-regression guard test in response-shape.test.ts asserts that
  // every expert-posture surface returns false from this function. If a
  // future change tries to silently re-add an expert-posture surface, the
  // guard fails at PR review.
  const semanticSurface = surface.replace(/^\/+/, "");
  return ["setup", "/admin/setup", "/setup", "/platform/admin"].some(
    (prefix) =>
      surface === prefix ||
      surface.startsWith(`${prefix}/`) ||
      semanticSurface === prefix,
  );
}

// ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B (percentile labeling):
// Every percentile rendered to a user MUST include the metric, the cohort
// definition, and the sample size. If any of those is missing, do NOT
// render a naked "Xth percentile" number — render an honest absence string
// instead. This applies uniformly to all six percentile fields surfaced by
// Atlas: portfolio.adoptionPercentile, portfolio.spendIntensityPercentile,
// portfolio.valueAttainmentPercentile, portfolio.vendorCountPercentile,
// signal.percentile, and benchmark.apexPercentile.
export interface PercentileContext {
  value: number | null | undefined;
  metric: string | null | undefined;
  cohort: string | null | undefined;
  sampleSize: number | null | undefined;
}

const PERCENTILE_CONTEXT_UNAVAILABLE = "metric-context unavailable";

function ordinalSuffix(n: number): string {
  const abs = Math.abs(Math.round(n));
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  const last = abs % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
}

export function formatPercentile(ctx: PercentileContext): string {
  const { value, metric, cohort, sampleSize } = ctx;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return PERCENTILE_CONTEXT_UNAVAILABLE;
  }
  const cleanMetric = typeof metric === "string" ? metric.trim() : "";
  const cleanCohort = typeof cohort === "string" ? cohort.trim() : "";
  const cleanSample =
    typeof sampleSize === "number" &&
    Number.isFinite(sampleSize) &&
    sampleSize > 0
      ? Math.round(sampleSize)
      : null;
  if (!cleanMetric || !cleanCohort || cleanSample == null) {
    return PERCENTILE_CONTEXT_UNAVAILABLE;
  }
  const rounded = Math.round(value);
  return `${rounded}${ordinalSuffix(rounded)} percentile · ${cleanMetric} · ${cleanCohort} cohort · n=${cleanSample}`;
}

export function shapeStreamingAgentTextForSurface(
  _surface: string,
  text: string,
): string {
  const cleaned = shapeSharedRenderDefects(
    repairMalformedComparisonTables(
      scrubInternalAdvisorText(
        stripChatMarkdownFormatting(normalizeAgentMarkupForPlainText(text)),
      ),
    ),
  );
  return repairAgentOutputContractText(cleaned).text;
}

// ATLAS-HI-3-2026-05-30 — Atlas response-shaper damage bypass.
//
// The 2026-05-30 Atlas IaC E2E audit (14+ damaged turns across all three
// tenants) caught the Tower-surface compactConsultantChatText pipeline
// actively destroying well-formed LLM output:
//
//   - "- Predictive next-edit. - Predictive next-edit." (duplication —
//     compactStepText with no separator: title === detail)
//   - "There is a second pressure behind | returns fraud model accuracy
//     has slipped. | — | — |" (broken table — extractComparisonItems
//     greedy `Word — Word` regex captures any sentence with an em dash
//     and packs the rest into a table cell)
//   - Mid-thought truncation (trimWords cutting at fixed bullet caps)
//
// The compactor is a pattern-matching template designed for *loose*
// advisor prose. It was never designed for already-structured input:
//   - the Atlas composition layer's 4-section "Your data / Industry
//     context / The gap / Next move" template (compose.ts)
//   - LLM output that already used markdown tables, well-formed bullet
//     lists, or numbered steps
//
// When the input already has structure, the compactor's regex-based
// extractors fight that structure and produce damaged output. The fix
// is a fast-path: detect already-structured input and pass it through
// unchanged. The compactor still runs for genuinely loose prose, which
// is what the existing Tower compaction tests exercise.
function looksAlreadyStructured(text: string): boolean {
  if (!text) return false;
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Markdown table — two or more pipe-delimited rows.
  const tableLines = lines.filter((line) => /^\|.+\|$/.test(line));
  if (tableLines.length >= 2) return true;

  // Atlas composition 4-section template (compose.ts:103). Match any
  // two of the canonical section headers on their own line. The
  // composition layer always emits at least two when it answers; the
  // hybrid render emits all four.
  const compositionSections = [
    /^Your data$/i,
    /^Industry context$/i,
    /^The gap$/i,
    /^Next move$/i,
  ];
  const sectionHits = compositionSections.reduce(
    (count, pattern) =>
      count + (lines.some((line) => pattern.test(line)) ? 1 : 0),
    0,
  );
  if (sectionHits >= 2) return true;

  // Well-formed bullet list — 3+ lines starting with "- " or "* ".
  // (Two or fewer can be loose prose with stray dashes.)
  const bulletLines = lines.filter((line) => /^[-*]\s+\S/.test(line));
  if (bulletLines.length >= 3) return true;

  // Well-formed numbered list — 3+ lines starting with "1." "2." "3." etc.
  // in monotonic order.
  const numberedLines = lines
    .map((line, idx) => ({ line, idx, match: line.match(/^(\d+)\.\s+\S/) }))
    .filter((entry) => entry.match !== null);
  if (numberedLines.length >= 3) {
    const numbers = numberedLines.map((entry) => Number(entry.match![1]));
    const isMonotonic = numbers.every(
      (n, i) => i === 0 || n === numbers[i - 1] + 1,
    );
    if (isMonotonic && numbers[0] === 1) return true;
  }

  return false;
}

export interface ShapeAgentResponseOptions {
  labels?: ReadonlyArray<SharedResponseLabel>;
  targetChars?: number;
  hardMaxChars?: number;
  maxParagraphs?: number;
  requireNextStep?: boolean;
  nextStepFallback?: string;
  issues?: SharedResponseShapeIssue[];
  replacements?: Array<{ from: string; to: string }>;
}

export function shapeAgentResponseForSurface(
  surface: string,
  text: string,
  options: ShapeAgentResponseOptions = {},
): string {
  // VOICE.STRAT-2026-05-10f — the legacy `/strategic-moves/new` special case
  // that routed to compactStrategicMoveOriginateText was removed alongside
  // the shouldCompactSurface narrowing. Strategic Moves originate is a
  // Brief B advisor surface; the originate compactor was the same render-
  // bypass class as compactConsultantChatText (different shape, same Brief
  // violation by construction). Surfaces correctly compacted now flow
  // through the single shouldCompactSurface gate.
  const cleaned = shapeSharedRenderDefects(
    repairMalformedComparisonTables(
      scrubInternalAdvisorText(
        stripChatMarkdownFormatting(normalizeAgentMarkupForPlainText(text)),
      ),
    ),
  );
  // ATLAS-HI-3-2026-05-30 — bypass the compactor when the LLM already
  // returned well-formed structure. See looksAlreadyStructured() above.
  const shaped =
    shouldCompactSurface(surface) && !looksAlreadyStructured(cleaned)
      ? compactConsultantChatText(cleaned, 120)
      : cleaned;
  const shared = shapeSharedAdvisorResponse({
    text: shaped,
    labels: options.labels,
    targetChars: options.targetChars,
    hardMaxChars: options.hardMaxChars,
    maxParagraphs: options.maxParagraphs,
    requireNextStep: options.requireNextStep,
    nextStepFallback: options.nextStepFallback,
  });
  if (options.issues) options.issues.push(...shared.issues);
  if (options.replacements) options.replacements.push(...shared.replacements);
  return repairAgentOutputContractText(shapeSharedRenderDefects(shared.text)).text;
}
