import fs from 'node:fs';
import path from 'node:path';

describe('/api/v1/atlas execution mode visibility', () => {
  const chatRoute = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/v1/atlas/chat/route.ts'),
    'utf8',
  );
  const askRoute = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/v1/atlas/ask/route.ts'),
    'utf8',
  );
  const llmSource = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/atlas/llm.ts'),
    'utf8',
  );

  it('exposes x-atlas-mode on chat and ask responses', () => {
    expect(chatRoute).toContain("'x-atlas-mode': result.atlasMode");
    expect(askRoute).toContain("'x-atlas-mode': result.atlasMode");
  });

  it('returns mode and fallback reason in the ask JSON payload', () => {
    expect(askRoute).toContain('atlasMode: result.atlasMode');
    expect(askRoute).toContain('fallbackReason: result.fallbackReason ?? null');
  });

  it('logs structured fallback mode events without hiding the reason', () => {
    expect(llmSource).toContain("event: 'atlas_model_mode'");
    expect(llmSource).toContain("mode: 'fallback'");
    expect(llmSource).toContain('fallbackReason: modelName ? null : fallbackReason');
  });
});
