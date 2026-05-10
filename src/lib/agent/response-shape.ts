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
    /\b(missing|do not have|don't have|absent|not in the retrieved context)\b/i.test(sentence),
  );
  return missingSentence ? trimWords(missingSentence, 28) : null;
}

function extractQuestionLine(text: string): string | null {
  const question = splitSentences(text).reverse().find((sentence) => sentence.endsWith('?'));
  if (!question) return null;
  return trimWords(question, 22);
}

function compactStrategicMoveOriginateText(text: string): string {
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
    index > 0 && /\d|KPI|financial|system|strategy|baseline|risk|confidence|source/i.test(sentence),
  ) ?? sentences.find((sentence, index) =>
    index > 0 && /\b(require|proof|integration|adoption|workflow|data|guardrail|ownership|readiness|connector)\b/i.test(sentence),
  );
  const recommendation = sentences.find((sentence, index) =>
    index > 0 &&
    sentence !== evidence &&
    sentence !== missing &&
    /\b(recommend|choose|do not|highest|lowest|defer|pursue|fix|next)\b/i.test(sentence),
  );

  const lines = [
    headline,
    evidence ? `- Evidence: ${sentenceWithPeriod(trimWords(evidence, 28))}` : null,
    missing ? `- Missing: ${sentenceWithPeriod(missing)}` : null,
    recommendation ? `- Next: ${sentenceWithPeriod(trimWords(recommendation, 22))}` : null,
    !recommendation && !question ? '- Next: choose an action, compare options, or ask for evidence.' : null,
    question ? `- Question: ${normalizeCompactLine(trimWords(question, 20))}` : null,
  ].filter(Boolean);

  return normalizeVisibleWhitespace(lines.join('\n'));
}

function shouldCompactSurface(surface: string): boolean {
  const semanticSurface = surface.replace(/^\/+/, '');
  return [
    'tower',
    'source',
    'intelligence',
    'setup',
    'programs',
    'programs-detail',
    'strategic-moves-new',
    'strategic-moves-workspace',
    'strategic-moves',
    '/tower',
    '/source',
    '/intelligence',
    '/setup',
    '/platform/admin',
    '/programs/new',
    '/strategic-moves',
  ].some((prefix) => surface === prefix || surface.startsWith(`${prefix}/`) || semanticSurface === prefix);
}

export function shapeStreamingAgentTextForSurface(_surface: string, text: string): string {
  return stripChatMarkdownFormatting(text);
}

export function shapeAgentResponseForSurface(surface: string, text: string): string {
  const cleaned = normalizeVisibleWhitespace(stripChatMarkdownFormatting(text));
  if (surface === '/strategic-moves/new') {
    return compactStrategicMoveOriginateText(cleaned);
  }
  if (shouldCompactSurface(surface)) {
    return compactConsultantChatText(cleaned, 120);
  }
  return cleaned;
}
