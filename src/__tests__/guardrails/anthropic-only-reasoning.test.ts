import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..'); // src/__tests__/guardrails -> repo root

describe('Anthropic-only reasoning standard', () => {
  it('guard passes: no OpenAI in reasoning paths outside the embedding/legacy allowlists', () => {
    expect(() =>
      execFileSync('node', ['scripts/guardrails/anthropic-only-reasoning.mjs'], {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('the ask reasoning path is OpenAI-free (no openai SDK / openai-runtime / OPENAI_API_KEY)', () => {
    const dir = path.join(ROOT, 'src/lib/intelligence/ask');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    for (const f of files) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(text).not.toMatch(/openai-runtime/);
      expect(text).not.toMatch(/from ['"]openai['"]/);
      expect(text).not.toMatch(/\bOPENAI_API_KEY\b/);
    }
  });

  it('the deleted openai-runtime module is gone', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/lib/intelligence/ask/openai-runtime.ts'))).toBe(false);
  });

  it('the chat route reasons via the audited Anthropic client, not OpenAI', () => {
    const text = fs.readFileSync(path.join(ROOT, 'src/app/api/chat/route.ts'), 'utf8');
    expect(text).not.toMatch(/openai-runtime/);
    expect(text).not.toMatch(/\bOPENAI_API_KEY\b/);
    expect(text).toMatch(/AnthropicDirectClient|getAuditedAnthropicClient|preflightAnthropicDirectClient/);
  });
});
