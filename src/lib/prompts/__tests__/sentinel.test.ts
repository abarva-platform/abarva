import {
  DEFAULT_SENTINEL_PROMPT_VERSION,
  getActiveSentinelPrompt,
  resolveActiveSentinelPromptVersion,
} from '@/lib/prompts/sentinel';

describe('Sentinel prompt version registry', () => {
  it('selects the default semver prompt when no active version is configured', () => {
    const prompt = getActiveSentinelPrompt({});

    expect(prompt.version).toBe(DEFAULT_SENTINEL_PROMPT_VERSION);
    expect(prompt.version).toBe('1.0.0');
    expect(prompt.buildSystemPrompt()).toContain('Use only the provided context. Do not invent evidence.');
  });

  it('selects the active semver prompt from config', () => {
    const prompt = getActiveSentinelPrompt({ SENTINEL_PROMPT_VERSION: '1.0.0' });

    expect(prompt.version).toBe('1.0.0');
    expect(prompt.citationBehavior).toMatchObject({
      expectedGroundingFlagPrefix: 'Grounding check:',
      requiresContextOnlyAnswers: true,
      requiresThinEvidenceDisclosure: true,
    });
  });

  it('rejects unsupported prompt versions instead of silently changing Sentinel behavior', () => {
    expect(() => resolveActiveSentinelPromptVersion({
      SENTINEL_PROMPT_VERSION: '2.0.0',
    })).toThrow('Unsupported SENTINEL_PROMPT_VERSION "2.0.0"');
  });
});
