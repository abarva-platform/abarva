import {
  getAgentOutputFewShotExamples,
  type AgentOutputFewShotExample,
} from './few-shot-examples';
import {
  normalizeOutputDisciplinedAgent,
  type OutputDisciplinedAgent,
} from './prompt-contract';

interface ComposeFewShotPromptBlockOptions {
  maxExamples?: number;
}

function sourceFooterToText(output: string): string {
  const sources = Array.from(
    output.matchAll(/<abv-source\s+ref="([^"]+)"\s+reliability="([^"]+)"\/>/g),
  );
  if (sources.length === 0) return '';

  const labels = sources
    .slice(0, 3)
    .map((match) => `${match[1]} (${match[2]})`);
  return `Source basis: ${labels.join('; ')}.`;
}

export function visibleFewShotOutput(output: string): string {
  const sourceFooter = sourceFooterToText(output);
  const visible = output
    .replace(/<abv-(?:pattern|usecase|vendor)\s+id="[^"]+">([^<]+)<\/abv-(?:pattern|usecase|vendor)>/g, '$1')
    .replace(/<abv-sources>[\s\S]*?<\/abv-sources>/g, '')
    .replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n')
    .replace(/<p>([\s\S]*?)<\/p>/g, '$1\n')
    .replace(/<th>([\s\S]*?)<\/th>/g, '$1 | ')
    .replace(/<td>([\s\S]*?)<\/td>/g, '$1 | ')
    .replace(/<\/tr>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return [visible, sourceFooter].filter(Boolean).join('\n');
}

function pickPromptExamples(
  agent: OutputDisciplinedAgent,
  maxExamples: number,
): AgentOutputFewShotExample[] {
  const examples = getAgentOutputFewShotExamples(agent);
  const preferred = examples.filter((example) =>
    ['lead-bullets', 'lead-table', 'stat-stack'].includes(example.pattern),
  );
  const fallback = examples.filter((example) => !preferred.includes(example));
  return [...preferred, ...fallback].slice(0, maxExamples);
}

export function composeAgentOutputFewShotPromptBlock(
  agentName: string | null | undefined,
  options: ComposeFewShotPromptBlockOptions = {},
): string {
  const agent = normalizeOutputDisciplinedAgent(agentName);
  const maxExamples = options.maxExamples ?? 2;
  const examples = pickPromptExamples(agent, maxExamples);

  const renderedExamples = examples.map((example, index) => [
    `Example ${index + 1}: ${example.pattern}`,
    `User: ${example.question}`,
    `Retrieve first: ${example.retrievalPlan.join(' ')}`,
    'Answer:',
    visibleFewShotOutput(example.output),
  ].join('\n'));

  return [
    'AGENT OUTPUT FEW-SHOT EXAMPLES',
    `Agent example set: ${agent}.`,
    'Imitate the answer shape, specificity, missing-data honesty, and source-basis placement. Do not copy the facts unless the current retrieved context supports them.',
    ...renderedExamples,
  ].join('\n\n');
}
