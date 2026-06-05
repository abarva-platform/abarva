import { readFileSync } from 'node:fs';
import { classifyAtlasIntent } from '@/lib/atlas/classifier';
import { buildAtlasSystemPrompt } from '@/lib/atlas/prompt';

describe('Atlas Tower grounding contract', () => {
  it('routes open-ended industry and corpus questions through the LLM grounding path', () => {
    expect(classifyAtlasIntent('what are others doing in our industry?')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
    expect(classifyAtlasIntent('answer this from the knowledge corpus')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
    expect(classifyAtlasIntent('what can Tower answer?')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
  });

  it('routes operational action requests to refusal discipline', () => {
    expect(classifyAtlasIntent('cancel the ServiceNow renewal')).toEqual({
      intent: 'strategy_refusal',
      routeType: 'scripted',
    });
  });

  it('system prompt prioritizes current Tower state and retrieved corpus context', () => {
    const prompt = buildAtlasSystemPrompt('Meridian Health');
    expect(prompt).toContain('Treat TOWER CURRENT STATE as the first source of truth');
    expect(prompt).toContain('For "what are others doing" questions');
    expect(prompt).toContain('If asked what Tower can answer');
    expect(prompt).toContain('Do not execute or simulate operational actions');
    expect(prompt).toContain('Never answer from another tenant');
    expect(prompt).toContain('AGENT OUTPUT CONTRACT v2026-06-05');
    expect(prompt).toContain('CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap');
    expect(prompt).toContain('Simple factual questions stay simple');
    expect(prompt).not.toContain('Apex Retail Group');
  });

  it('LLM payload is wired to current Tower state plus retrieval context', () => {
    const source = readFileSync('src/lib/atlas/llm.ts', 'utf8');
    expect(source).toContain('query_tower_current_state');
    expect(source).toContain('formatTowerCurrentStateForPrompt');
    expect(source).toContain('assembleRetrievalContext');
    expect(source).toContain('formatRetrievedContext');
    expect(source).toContain('CITATION_INSTRUCTION');
    expect(source).toContain('sanitizeForTenantPrompt');
  });

  it('retrieval has an Azure context-chunk fallback when vector search is unavailable', () => {
    const source = readFileSync('src/lib/agent/retrieval.ts', 'utf8');
    expect(source).toContain('queryAzureContextChunks');
    expect(source).toContain('enterprise_context_chunks');
  });
});
