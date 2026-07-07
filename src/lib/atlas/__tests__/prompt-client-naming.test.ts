import { buildAtlasSystemPrompt } from '@/lib/atlas/prompt';

describe('Atlas prompt client naming', () => {
  it('names the current client for hard CXO, value, federated, and governance answers', () => {
    const prompt = buildAtlasSystemPrompt('Lakeshore Holdings');

    expect(prompt).toContain('Lakeshore Holdings');
    expect(prompt).toContain('For hard CXO, program-readiness, value, federated, or governance questions');
    expect(prompt).toContain('name the current client in the first sentence');
  });
});
