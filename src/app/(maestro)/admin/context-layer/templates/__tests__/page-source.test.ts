import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('context template explorer page source', () => {
  it('uses the canonical explorer label and exposes unlocked surfaces', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/admin/context-layer/templates/page.tsx'),
      'utf8',
    );

    expect(source).toContain('Context template explorer');
    expect(source).toContain('Surfaces unlocked');
    expect(source).toContain('template.unlocks.join');
    expect(source).not.toContain('Northstar template catalog');
  });
});
