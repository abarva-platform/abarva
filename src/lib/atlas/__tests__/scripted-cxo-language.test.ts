import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Atlas scripted CXO language', () => {
  it('does not expose implementation tool gaps in user-visible scripted copy', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/atlas/scripted-engine.ts'), 'utf8');
    const visibleStrings = Array.from(source.matchAll(/'([^'\n]*(?:query_[a-z_]+|does not exist yet|tool ships|requires .* tool|without a .* tool|signal:\$\{)[^'\n]*)'/gi))
      .map((match) => match[1])
      .filter((value) => !value.startsWith('query_'))
      .filter((value) => !value.includes('value: `signal:'));

    expect(visibleStrings).toEqual([]);
  });
});
