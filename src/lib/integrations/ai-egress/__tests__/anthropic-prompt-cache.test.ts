import {
  buildAnthropicPromptCachePayload,
  resolveAnthropicPromptCache,
} from '@/lib/integrations/ai-egress';

describe('Anthropic prompt cache policy', () => {
  it('marks stable system prompts with ephemeral cache control by default', () => {
    const payload = buildAnthropicPromptCachePayload({
      system: 'You are the AbarVa reasoning layer. Bind answers to cited tenant context.',
      prompt: 'What changed since the last board pack?',
      metadata: {},
    });

    expect(payload.auditMetadata).toMatchObject({
      enabled: true,
      cacheSystemPrompt: true,
      cacheUserPrompt: false,
      ttl: 'ephemeral_5m',
    });
    expect(payload.system).toEqual([
      {
        type: 'text',
        text: 'You are the AbarVa reasoning layer. Bind answers to cited tenant context.',
        cache_control: { type: 'ephemeral' },
      },
    ]);
    expect(payload.messages).toEqual([
      {
        role: 'user',
        content: 'What changed since the last board pack?',
      },
    ]);
  });

  it('marks document prompts cacheable when stable document metadata is present', () => {
    const payload = buildAnthropicPromptCachePayload({
      prompt: 'Summarize this parsed annual-results PDF for the CFO.',
      metadata: {
        document_key: 'doc-annual-results',
      },
    });

    expect(payload.auditMetadata).toMatchObject({
      enabled: true,
      cacheSystemPrompt: false,
      cacheUserPrompt: true,
      cacheKey: 'doc-annual-results',
      reason: 'stable cache key metadata',
    });
    expect(payload.messages).toEqual([
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Summarize this parsed annual-results PDF for the CFO.',
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ]);
  });

  it('honors explicit metadata and env opt-outs', () => {
    expect(resolveAnthropicPromptCache({
      system: 'Stable system prompt',
      metadata: {
        anthropicPromptCache: { enabled: false },
        document_key: 'doc-1',
      },
    })).toMatchObject({
      enabled: false,
      reason: 'disabled',
    });

    expect(resolveAnthropicPromptCache({
      system: 'Stable system prompt',
      metadata: { document_key: 'doc-1' },
      env: { ABARVA_ANTHROPIC_PROMPT_CACHE: 'off' } as unknown as NodeJS.ProcessEnv,
    })).toMatchObject({
      enabled: false,
      reason: 'disabled',
    });
  });
});
