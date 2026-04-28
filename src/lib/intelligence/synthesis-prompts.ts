import type { KnowledgePrimitive } from './indexer';

export const ATLAS_SYNTHESIS_VERSION = 'atlas-synthesis-v1';
export const ATLAS_SYNTHESIS_WORD_CAP = 150;

export interface AtlasSynthesisPromptInput {
  query: string;
  primitives: readonly KnowledgePrimitive[];
}

export function buildAtlasSynthesisPrompt({ query, primitives }: AtlasSynthesisPromptInput): string {
  const evidence = primitives
    .map((primitive) => {
      const title = primitive.title ? ` ${primitive.title}` : '';
      return `- ${primitive.id} (${primitive.kind})${title}`;
    })
    .join('\n');

  return [
    `Atlas synthesis policy: ${ATLAS_SYNTHESIS_VERSION}.`,
    'Use deterministic corpus evidence only. Do not call a live model.',
    `Return no more than ${ATLAS_SYNTHESIS_WORD_CAP} words.`,
    'Every substantive answer sentence must include corpus primitive ID citations.',
    `Question: ${query}`,
    'Evidence primitives:',
    evidence || '- none',
  ].join('\n');
}
