import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { scoreAnswer } from '../scorer';

interface FixtureRow {
  id: string;
  tenantKey: string;
  surface: string;
  answer: string;
}

function loadFixture(name: string): FixtureRow[] {
  const path = join(__dirname, '..', 'fixtures', name);
  return readFileSync(path, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as FixtureRow);
}

describe('Wave 3 auto board-pack answer-quality fixtures', () => {
  it('accepts CXO-readable audit and board-pack answers', () => {
    for (const row of loadFixture('wave3-auto-board-pack-known-good.jsonl')) {
      const score = scoreAnswer(row.answer, {
        questionId: row.id,
        tenantKey: row.tenantKey,
        surface: row.surface,
      });
      expect(score.gatePassed).toBe(true);
    }
  });

  it('rejects raw IDs and vague pack answers', () => {
    for (const row of loadFixture('wave3-auto-board-pack-known-bad.jsonl')) {
      const score = scoreAnswer(row.answer, {
        questionId: row.id,
        tenantKey: row.tenantKey,
        surface: row.surface,
      });
      expect(score.gatePassed).toBe(false);
    }
  });
});
