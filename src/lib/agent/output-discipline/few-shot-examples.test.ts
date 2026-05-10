import {
  AGENT_OUTPUT_FEW_SHOT_EXAMPLES,
  getAgentOutputFewShotExamples,
} from './few-shot-examples';
import type { OutputDisciplineAgent, OutputShapePattern } from './golden-fixtures';

const agents: OutputDisciplineAgent[] = ['nexus', 'sentinel', 'atlas', 'source', 'steward'];
const requiredPatterns: OutputShapePattern[] = [
  'lead-bullets',
  'lead-table',
  'stat-stack',
  'sequential-steps',
  'brief-narrative',
];

function visibleText(output: string): string {
  return output
    .replace(/<abv-(?:pattern|usecase|vendor)\s+id="[^"]+">([^<]+)<\/abv-(?:pattern|usecase|vendor)>/g, '$1')
    .replace(/<abv-source\s+ref="[^"]+"\s+reliability="[^"]+"\/>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('agent output few-shot examples', () => {
  it.each(agents)('provides six training examples for %s', (agent) => {
    const examples = getAgentOutputFewShotExamples(agent);

    expect(examples).toHaveLength(6);
    expect(examples.every((example) => example.agent === agent)).toBe(true);
    expect(new Set(examples.map((example) => example.pattern)).size).toBeGreaterThanOrEqual(4);
    expect(examples.every((example) => example.retrievalPlan.length >= 3)).toBe(true);
  });

  it('covers every agent and every allowed answer pattern', () => {
    const coveredAgents = new Set(AGENT_OUTPUT_FEW_SHOT_EXAMPLES.map((example) => example.agent));
    const coveredPatterns = new Set(AGENT_OUTPUT_FEW_SHOT_EXAMPLES.map((example) => example.pattern));

    for (const agent of agents) {
      expect(coveredAgents.has(agent)).toBe(true);
    }
    for (const pattern of requiredPatterns) {
      expect(coveredPatterns.has(pattern)).toBe(true);
    }
  });

  it('keeps user-visible output free of markdown emphasis and raw bracket ids', () => {
    for (const example of AGENT_OUTPUT_FEW_SHOT_EXAMPLES) {
      const text = visibleText(example.output);

      expect(text).not.toMatch(/\*\*[^*]+\*\*|\*[^*\n]+\*/);
      expect(text).not.toMatch(/\[(?:P|UC|V|PAT)-[A-Z0-9-]+\]/);
      expect(text).not.toMatch(/\b(?:P|UC|V)-[A-Z0-9]+(?:-[A-Z0-9]+){1,5}\b/);
    }
  });
});

