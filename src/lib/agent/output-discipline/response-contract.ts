export type AgentOutputContractViolation =
  | 'raw_markdown_emphasis'
  | 'raw_visible_entity_id'
  | 'overlong_paragraph';

export interface AgentOutputContractResult {
  text: string;
  violations: AgentOutputContractViolation[];
}

const RAW_MARKDOWN_EMPHASIS_REGEX = /(^|[\s([{])(?:\*\*[^*]+\*\*|\*[^*\n]+\*|__[^_]+__|_[^_\n]+_)(?=$|[\s)\]}.,;:!?])/;
const BRACKETED_RAW_ID_REGEX = /(?:\s*)[\[(]((?:P|UC|V|PAT)-[A-Z0-9]+(?:-[A-Z0-9]+){1,5}|T\d-[A-Z0-9]+)[\])]/g;
const BARE_RAW_ENTITY_ID_REGEX = /\b((?:P|UC|V)-[A-Z0-9]+(?:-[A-Z0-9]+){1,5})\b/g;
const BARE_UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const SENTENCE_SPLIT_REGEX = /(?<=[.!?])\s+/;
const VS_DOT_SENTINEL = 'ABARVA_VS_DOT_SENTINEL';

function splitContractSentences(text: string): string[] {
  return text
    .replace(/\bvs\./gi, (match) => match.replace('.', VS_DOT_SENTINEL))
    .split(SENTENCE_SPLIT_REGEX)
    .map((sentence) => sentence.replaceAll(VS_DOT_SENTINEL, '.'))
    .filter(Boolean);
}

function stripRawEntityIds(text: string): string {
  return text
    .replace(BRACKETED_RAW_ID_REGEX, '')
    .replace(BARE_RAW_ENTITY_ID_REGEX, 'the cited pattern')
    .replace(/\bsignal\s*:\s*/gi, 'signal: ')
    .replace(BARE_UUID_REGEX, 'the referenced record')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1');
}

function splitOverlongParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      const isStructured = /^(\s*[-·]|\s*\d+\.|\s*\|)/m.test(trimmed);
      if (isStructured) return trimmed;

      const sentences = splitContractSentences(trimmed);
      if (sentences.length <= 3) return trimmed;

      const groups: string[] = [];
      for (let i = 0; i < sentences.length; i += 3) {
        groups.push(sentences.slice(i, i + 3).join(' '));
      }
      return groups.join('\n\n');
    })
    .join('\n\n');
}

export function validateAgentOutputContractText(text: string): AgentOutputContractViolation[] {
  const violations = new Set<AgentOutputContractViolation>();

  if (RAW_MARKDOWN_EMPHASIS_REGEX.test(text)) {
    violations.add('raw_markdown_emphasis');
  }

  BRACKETED_RAW_ID_REGEX.lastIndex = 0;
  BARE_RAW_ENTITY_ID_REGEX.lastIndex = 0;
  BARE_UUID_REGEX.lastIndex = 0;
  if (BRACKETED_RAW_ID_REGEX.test(text) || BARE_RAW_ENTITY_ID_REGEX.test(text) || BARE_UUID_REGEX.test(text)) {
    violations.add('raw_visible_entity_id');
  }
  BRACKETED_RAW_ID_REGEX.lastIndex = 0;
  BARE_RAW_ENTITY_ID_REGEX.lastIndex = 0;
  BARE_UUID_REGEX.lastIndex = 0;

  for (const paragraph of text.split(/\n{2,}/)) {
    const trimmed = paragraph.trim();
    if (!trimmed || /^(\s*[-·]|\s*\d+\.|\s*\|)/m.test(trimmed)) continue;
    if (splitContractSentences(trimmed).length > 3) {
      violations.add('overlong_paragraph');
      break;
    }
  }

  return [...violations];
}

export function repairAgentOutputContractText(text: string): AgentOutputContractResult {
  const initialViolations = validateAgentOutputContractText(text);
  const repaired = splitOverlongParagraphs(stripRawEntityIds(text)).trim();
  const remainingViolations = validateAgentOutputContractText(repaired)
    .filter((violation) => violation !== 'overlong_paragraph' && violation !== 'raw_visible_entity_id');

  return {
    text: repaired,
    violations: [...new Set([...initialViolations, ...remainingViolations])],
  };
}
