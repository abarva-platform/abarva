import fs from 'node:fs';
import path from 'node:path';

describe('toolUseLoop initial tool choice wiring', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/agent/streaming/toolUseLoop.ts'),
    'utf8',
  );

  it('passes an explicit initial tool choice only on the first model turn', () => {
    expect(source).toContain("initialToolChoice?: Anthropic.MessageStreamParams['tool_choice']");
    expect(source).toContain("turn === 1 && args.initialToolChoice ? { tool_choice: args.initialToolChoice } : {}");
  });
});
