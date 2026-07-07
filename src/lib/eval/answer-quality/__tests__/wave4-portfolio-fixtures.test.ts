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

describe('Wave 4 portfolio sequencing answer-quality fixtures', () => {
  it('accepts clear portfolio sequencing answers with concrete next moves', () => {
    for (const row of loadFixture('wave4-portfolio-known-good.jsonl')) {
      const score = scoreAnswer(row.answer, {
        questionId: row.id,
        tenantKey: row.tenantKey,
        surface: row.surface,
      });

      expect(score.gatePassed).toBe(true);
    }
  });

  it('rejects raw IDs, vague actions, and unexplained internal artifacts', () => {
    for (const row of loadFixture('wave4-portfolio-known-bad.jsonl')) {
      const score = scoreAnswer(row.answer, {
        questionId: row.id,
        tenantKey: row.tenantKey,
        surface: row.surface,
      });

      expect(score.gatePassed).toBe(false);
    }
  });
});
