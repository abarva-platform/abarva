import { repairAgentOutputContractText } from './output-discipline/response-contract';

function normalizeAgentMarkupForPlainText(text: string): string {
  return text
    .replace(/<abv-sources[\s\S]*?<\/abv-sources>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6])>/gi, '\n\n')
    .replace(/<(?:p|div|h[1-6])(?:\s+[^>]*)?>/gi, '\n\n')
    .replace(/<li(?:\s+[^>]*)?>/gi, '\n- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?(?:ul|ol)(?:\s+[^>]*)?>/gi, '\n')
    .replace(/<abv-(?:pattern|usecase|vendor)\s+[^>]*>([^<]+)<\/abv-(?:pattern|usecase|vendor)>/gi, ' $1 ')
    .replace(/<\/?(?:strong|b|em|i|span|cite)(?:\s+[^>]*)?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripChatMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)#{1,6}\s+/g, '$1')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-zA-Z0-9_-]*|```/g, '').trim())
    .replace(/\s+([,.;:!?])/g, '$1');
}

function normalizeVisibleWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeCompactLine(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ').replace(/[,:;.-]+$/, '');
}

function sentenceWithPeriod(text: string): string {
  const normalized = normalizeCompactLine(text).replace(/\.+$/, '');
  return /[!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isRecommendationSentence(sentence: string): boolean {
  return /\b(recommend|choose|do not|highest|lowest|defer|pursue|fix|next|pause|approve|prioritize)\b/i.test(sentence);
}

function extractNumberedItems(text: string): string[] {
  const matches = Array.from(
    text.matchAll(/(?:^|\s)([1-4])\.\s+([\s\S]*?)(?=(?:\s[1-4]\.\s+)|$)/g),
  );

  return matches
    .map((match) => match[2]?.trim() ?? '')
    .map((item) => item.replace(/\s*(What do you want to do|Choose:)[\s\S]*$/i, '').trim())
    .filter(Boolean);
}

function extractItemTitle(item: string): string {
  const title = item.split(/\s+[—-]\s+/)[0] ?? item;
  return trimWords(normalizeCompactLine(title), 8);
}

function extractEvidenceLine(item: string): string {
  const afterDivider = item.split(/\s+[—-]\s+/).slice(1).join(' - ') || item;
  const metricClauses = afterDivider
    .split(/;|\.\s+|,\s+(?=[a-z])/i)
    .map((part) => part.trim())
    .filter((part) => /\d|target|gap|margin|stockout|markdown|turn|MAPE|forecast|baseline/i.test(part));

  const evidence = metricClauses.length > 0 ? metricClauses.slice(0, 4).join('; ') : afterDivider;
  return trimWords(evidence, 38);
}

function extractMissingLine(text: string): string | null {
  const explicit = text.match(/(?:Explicitly\s+missing\s+data(?:\s+that\s+would\s+change\s+ranking)?|Data\s+missing|Missing):\s*([^?]+?)(?=(?:\s+[A-Z][a-z]+:)|(?:\s+What\s+do\s+you)|$)/i);
  if (explicit?.[1]) return trimWords(explicit[1].trim(), 28);

  const missingSentence = splitSentences(text).find((sentence) =>
    /\b(missing|do not have|don't have|absent|not in the retrieved context)\b/i.test(sentence) &&
    !isRecommendationSentence(sentence),
  );
  return missingSentence ? trimWords(missingSentence, 28) : null;
}

function extractQuestionLine(text: string): string | null {
  const question = splitSentences(text).reverse().find((sentence) => sentence.endsWith('?'));
  if (!question) return null;
  return trimWords(question, 22);
}

function preserveReadableTable(text: string): string | null {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const tableLines = lines.filter((line) => /^\|.+\|$/.test(line));
  if (tableLines.length < 2) return null;
  const lead = lines.find((line) => !/^\|.+\|$/.test(line) && !/^[-:| ]+$/.test(line));
  const table = tableLines.slice(0, 7).join('\n');
  return normalizeVisibleWhitespace([lead ? trimWords(lead, 24) : null, table].filter(Boolean).join('\n\n'));
}

function compactBriefNarrativeText(text: string): string | null {
  const sentences = splitSentences(text);
  const hasStructuralCue = /\b(recommend|choose|compare|option|vendor|scenario|steps?|data says|KPI|evidence|source|missing|risk)\b/i.test(text);
  if (hasStructuralCue || sentences.length < 3 || sentences.length > 6 || wordCount(text) > 135) return null;

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).map((sentence) => sentenceWithPeriod(sentence)).join(' '));
  }
  return normalizeVisibleWhitespace(paragraphs.slice(0, 3).join('\n\n'));
}

interface ComparisonItem {
  option: string;
  strength: string;
  weakness: string;
  fit: string;
}

function extractComparisonItems(text: string): ComparisonItem[] {
  const optionBlocks = Array.from(
    text.matchAll(
      /(?:^|\s)(?:Option\s*)?([A-Z0-9][A-Za-z0-9 /&+-]{2,45})\s+[—-]\s+([\s\S]*?)(?=(?:\s(?:Option\s*)?[A-Z0-9][A-Za-z0-9 /&+-]{2,45}\s+[—-]\s+)|$)/g,
    ),
  );

  return optionBlocks
    .map((match) => {
      const option = trimWords(normalizeCompactLine(match[1] ?? ''), 6);
      const body = normalizeCompactLine(match[2] ?? '');
      const strength = body.match(/Strength:\s*([^.;]+[.;]?)/i)?.[1] ?? splitSentences(body)[0] ?? body;
      const weakness = body.match(/Weakness:\s*([^.;]+[.;]?)/i)?.[1] ?? body.match(/(?:but|however)\s+([^.;]+[.;]?)/i)?.[1] ?? 'Needs validation.';
      const fit = body.match(/Fit:\s*([^.;]+[.;]?)/i)?.[1] ?? body.match(/best\s+for\s+([^.;]+[.;]?)/i)?.[1] ?? 'Medium pending evidence.';
      return {
        option,
        strength: trimWords(strength, 12),
        weakness: trimWords(weakness, 12),
        fit: trimWords(fit, 10),
      };
    })
    .filter((item) => item.option && item.option.length <= 55)
    .slice(0, 4);
}

function compactComparisonText(text: string): string | null {
  const existingTable = preserveReadableTable(text);
  if (existingTable) return existingTable;
  if (!/\b(compare|option|vendor|scenario|versus| vs\.? |fit|strength|weakness)\b/i.test(text)) return null;

  const sentences = splitSentences(text);
  const items = extractComparisonItems(text);
  if (items.length < 2) return null;

  const lead = trimWords(sentences[0] ?? 'The comparison comes down to fit and evidence.', 22);
  const rows = [
    '| Option | Strength | Weakness | Fit |',
    '|---|---|---|---|',
    ...items.map((item) => `| ${item.option} | ${sentenceWithPeriod(item.strength)} | ${sentenceWithPeriod(item.weakness)} | ${sentenceWithPeriod(item.fit)} |`),
  ];
  const synthesis = sentences.find((sentence) => /\b(recommend|best|choose|therefore|so)\b/i.test(sentence) && sentence !== sentences[0]);
  return normalizeVisibleWhitespace([lead, rows.join('\n'), synthesis ? trimWords(synthesis, 26) : null].filter(Boolean).join('\n\n'));
}

function compactStepText(text: string): string | null {
  const sentences = splitSentences(text);
  const numberedItems = extractNumberedItems(text);
  const hasStepCue = /\b(how|path|process|steps?|sequence|walk me through|first|then|handoff)\b/i.test(text);
  if (!hasStepCue) return null;

  const steps = numberedItems.length >= 2
    ? numberedItems
    : sentences.filter((sentence) => /\b(first|then|next|finally|step)\b/i.test(sentence));
  if (steps.length < 2) return null;

  const lead = trimWords(sentences[0] ?? 'The path is sequential.', 22);
  const lines = steps.slice(0, 5).map((step, index) => {
    const clean = normalizeCompactLine(step).replace(/^(First|Then|Next|Finally),?\s*/i, '');
    const splitOnLabel = clean.includes(':') || /\s+[—-]\s+/.test(clean);
    const [name, ...rest] = splitOnLabel
      ? clean.split(/:\s+|[—-]\s+/)
      : clean.split(/\.\s+/);
    const title = trimWords(name || `Step ${index + 1}`, 6);
    const rawDetail = splitOnLabel ? rest.join(' ') : rest[0];
    const detailText = splitSentences(rawDetail ?? '')[0] ?? rawDetail ?? clean;
    const detail = trimWords(detailText, 18);
    return `${index + 1}. ${sentenceWithPeriod(title)} ${sentenceWithPeriod(detail)}`;
  });
  const outcome = sentences.find((sentence, index) => index > 0 && /\b(outcome|result|so that|ends with|leaves you)\b/i.test(sentence));
  return normalizeVisibleWhitespace([lead, ...lines, outcome ? trimWords(outcome, 22) : null].filter(Boolean).join('\n'));
}

function compactStatStackText(text: string): string | null {
  const sentences = splitSentences(text);
  const hasDataCue = /\b(data says|what does the data|typical|benchmark|numbers say|evidence says)\b/i.test(text);
  const numericSentences = sentences.filter((sentence) =>
    /\d|%|\$|bp|x\b|KPI|MAPE|ROI|margin/i.test(sentence) && !/\b(source|basis|confidence|retrieved|corpus|tenant)\b/i.test(sentence),
  );
  if (!hasDataCue || numericSentences.length < 2) return null;

  const lead = trimWords(numericSentences[0] ?? sentences[0] ?? text, 24);
  const stats = numericSentences
    .filter((sentence) => sentence !== numericSentences[0])
    .slice(0, 4)
    .map((sentence) => `· ${sentenceWithPeriod(trimWords(sentence, 22))}`);
  const source = sentences.find((sentence) => /\b(source|basis|confidence|retrieved|corpus|tenant)\b/i.test(sentence));
  const sourceDetail = source?.replace(/^Source\s+basis:\s*/i, '');
  return normalizeVisibleWhitespace([lead, ...stats, sourceDetail ? `Source: ${sentenceWithPeriod(trimWords(sourceDetail, 22))}` : null].filter(Boolean).join('\n'));
}

function compactStrategicMoveOriginateText(text: string): string {
  const comparison = compactComparisonText(text);
  if (comparison) return comparison;
  const steps = compactStepText(text);
  if (steps) return steps;
  const stats = compactStatStackText(text);
  if (stats) return stats;
  const narrative = compactBriefNarrativeText(text);
  if (narrative) return narrative;

  const normalized = normalizeVisibleWhitespace(text.replace(/\bHere'?s the ranking:\s*/i, ''));
  const sentences = splitSentences(normalized);
  const numberedItems = extractNumberedItems(normalized);
  const shouldPreserve =
    numberedItems.length === 0 &&
    sentences.length <= 3 &&
    wordCount(normalized) <= 75 &&
    normalized.includes('\n');
  if (shouldPreserve) return normalized;

  const headline = trimWords(sentences[0] ?? normalized, 18);
  const missing = extractMissingLine(normalized);
  const question = extractQuestionLine(normalized);

  if (numberedItems.length > 0) {
    const recommended = extractItemTitle(numberedItems[0] ?? '');
    const alternate = numberedItems[1] ? extractItemTitle(numberedItems[1]) : null;
    const evidence = extractEvidenceLine(numberedItems[0] ?? '');
    const lines = [
      headline,
      evidence ? `- Why: ${sentenceWithPeriod(evidence)}` : null,
      missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
      '- Choose:',
      `  1. ${recommended || 'Use this as the Move'}`,
      `  2. ${alternate || 'Compare another path'}`,
      '  3. Type your own',
    ].filter(Boolean);
    return normalizeVisibleWhitespace(lines.join('\n'));
  }

  const support = sentences.find((sentence, index) =>
    index > 0 && /\d|KPI|financial|system|strategy|evidence|baseline|confidence/i.test(sentence),
  );
  const lines = [
    headline,
    support ? `- Evidence: ${sentenceWithPeriod(trimWords(support, 28))}` : null,
    missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
    question ? `- Next: ${normalizeCompactLine(question)}` : '- Choose: use this framing / compare another path / type your own.',
  ].filter(Boolean);

  return normalizeVisibleWhitespace(lines.join('\n'));
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
    text.includes('\n');
  if (shouldPreserve) return text;

  const headline = trimWords(sentences[0] ?? text, 18);
  const missing = extractMissingLine(text);
  const question = extractQuestionLine(text);
  const evidence = sentences.find((sentence, index) =>
    index > 0 && !isRecommendationSentence(sentence) && /\d|KPI|financial|system|strategy|baseline|risk|confidence|source/i.test(sentence),
  ) ?? sentences.find((sentence, index) =>
    index > 0 && !isRecommendationSentence(sentence) && /\b(require|proof|integration|adoption|workflow|data|guardrail|ownership|readiness|connector)\b/i.test(sentence),
  );
  const recommendation = sentences.find((sentence, index) =>
    index > 0 &&
    sentence !== evidence &&
    sentence !== missing &&
    isRecommendationSentence(sentence),
  );

  const lines = [
    headline,
    evidence ? `- Evidence: ${sentenceWithPeriod(trimWords(evidence, 28))}` : null,
    missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
    recommendation ? `- Next: ${sentenceWithPeriod(trimWords(recommendation, 22))}` : null,
    question ? `- Question: ${normalizeCompactLine(trimWords(question, 20))}` : null,
  ].filter(Boolean);

  return normalizeVisibleWhitespace(lines.join('\n'));
}

function shouldCompactSurface(surface: string): boolean {
  // INT-VOICE.STRAT-2026-05-10e — Intelligence surface removed.
  //
  // The Brief A expert posture installed in src/lib/intelligence/ask/synthesizer.ts
  // requires natural advisor prose: "Don't bullet-point everything. Use bullets
  // when they earn their place; otherwise, write in prose. Reads like a person
  // talking — varied sentence structure, natural transitions, length matches
  // the question." compactConsultantChatText violates that contract by
  // construction — it forces every response into a fixed
  //
  //   {headline}
  //   - Evidence: …
  //   - Missing: …
  //   - Next: …
  //   - Question: …
  //
  // template, and extractMissingLine specifically promotes any sentence
  // containing "missing" / "don't have" / "absent" into a "- Missing:" bullet,
  // amplifying any retrieval-thin phrasing into a compliance-style refusal
  // shape. The 2026-05-10 Meridian production audit captured exactly this
  // failure on every Sentinel response.
  //
  // 'source' and the strategic-moves / programs / tower surfaces remain in
  // the compaction list pending parallel updates under Briefs B and C
  // (Nexus and Source consultant posture). Tower is unrelated to Briefs
  // A/B/C and stays as-is. See docs/build/CODEX_BRIEF_6_CONSULTANT_POSTURE_NEXUS_SOURCE.md
  // for the next-up work.
  const semanticSurface = surface.replace(/^\/+/, '');
  return [
    'tower',
    'source',
    'setup',
    'programs',
    'programs-detail',
    'strategic-moves-new',
    'strategic-moves-workspace',
    'strategic-moves',
    '/tower',
    '/source',
    '/setup',
    '/platform/admin',
    '/programs/new',
    '/strategic-moves',
  ].some((prefix) => surface === prefix || surface.startsWith(`${prefix}/`) || semanticSurface === prefix);
}

export function shapeStreamingAgentTextForSurface(_surface: string, text: string): string {
  return repairAgentOutputContractText(stripChatMarkdownFormatting(normalizeAgentMarkupForPlainText(text))).text;
}

export function shapeAgentResponseForSurface(surface: string, text: string): string {
  const cleaned = normalizeVisibleWhitespace(stripChatMarkdownFormatting(normalizeAgentMarkupForPlainText(text)));
  let shaped: string;
  if (surface === '/strategic-moves/new') {
    shaped = compactStrategicMoveOriginateText(cleaned);
  } else if (shouldCompactSurface(surface)) {
    shaped = compactConsultantChatText(cleaned, 120);
  } else {
    shaped = cleaned;
  }
  return repairAgentOutputContractText(shaped).text;
}
