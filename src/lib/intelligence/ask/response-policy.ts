import type { AskSource } from './types';

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

const BROAD_CURRENT_STATE_RE =
  /\b(current state|state of play|where are we|where do we stand|how are we doing|what is going on|what do you see|give me perspective|your perspective|executive read|simple question|our state)\b/i;

export function isBroadCurrentStateQuestion(query: string): boolean {
  return BROAD_CURRENT_STATE_RE.test(query);
}

export function stripMarkdownControl(text: string): string {
  return text
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, '$1')
    .replace(/\*([^*\n][^*\n]*?[^*\n])\*/g, '$1')
    .replace(/__([^_\n][\s\S]*?[^_\n])__/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[-*]\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n');
}

export function sanitizeAskSynthesis(text: string, maxWords = 120): string {
  const withoutOpener = stripMarkdownControl(text.replace(HOLLOW_OPENER_RE, '').trim());
  const words = withoutOpener.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return withoutOpener;

  const capped = words.slice(0, maxWords).join(' ');
  const lastSentenceEnd = Math.max(
    capped.lastIndexOf('.'),
    capped.lastIndexOf('?'),
    capped.lastIndexOf('!'),
  );
  if (lastSentenceEnd > 80) return capped.slice(0, lastSentenceEnd + 1);
  return `${capped.replace(/[,\s;:]+$/, '')}...`;
}

export function chunkAskText(text: string): string[] {
  return text.match(/.{1,80}(?:\s|$)/g) ?? [text];
}

export function buildCurrentStateAdvisory(sources: AskSource[]): string | null {
  const facts = sources.flatMap((source) => source.detail.split('\n').map((line) => cleanFact(line)));
  const activeClient = stripTerminalPeriod(readAfter(facts, 'Active client:') ?? readAfter(facts, 'Tenant:')) ?? 'the active client';
  const isApex = facts.some((fact) => /Apex Retail/i.test(fact));
  const strategicCenter = readAfter(facts, 'Current strategic center:');
  const executivePosture = readAfter(facts, 'Executive posture:');
  const briefSynthesis = readAfter(facts, 'Brief synthesis:');
  const risk = facts.find((fact) => /^Risk:/i.test(fact));
  const graphEdge = facts.find((fact) => /^Graph edge:/i.test(fact));

  if (!isApex && !strategicCenter && !briefSynthesis && !risk && !graphEdge) return null;

  const businessLens = briefSynthesis ?? strategicCenter ?? risk ?? 'The portfolio needs sequencing before more AI commitments are added.';
  const technicalLens = graphEdge ?? strategicCenter ?? 'The technical question is whether the data, ownership, and integration baseline is strong enough to support the next wave.';
  const posture = executivePosture
    ? `The leadership tension is visible: ${executivePosture}`
    : `${activeClient} has enough signal for an executive conversation, but the operating model still needs sharper ownership.`;

  return [
    `My read: ${activeClient} is not short on AI ideas. The issue is sequencing, ownership, and evidence quality before the next wave gets larger.`,
    `Business lens: ${businessLens}`,
    `Technical lens: ${technicalLens}`,
    `Leadership lens: ${posture}`,
    'The next useful question is not "what number is biggest?" It is: do you want to pressure-test this from the CFO value lens, the CIO delivery lens, or the CMO customer-growth lens first?',
  ].join('\n\n');
}

function cleanFact(line: string): string {
  return line.replace(/^\s*-\s*/, '').replace(/\s+/g, ' ').trim();
}

function readAfter(facts: string[], prefix: string): string | null {
  const match = facts.find((fact) => fact.toLowerCase().startsWith(prefix.toLowerCase()));
  return match ? match.slice(prefix.length).trim() : null;
}

function stripTerminalPeriod(value: string | null): string | null {
  return value ? value.replace(/\.$/, '') : null;
}
