import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOMAIN_FILES = [
  'apex-decision-home.ts',
  'firstcapital-decision-home.ts',
  'meridian-vbc-bet-selection.ts',
  'meridian-vbc-decision-home.ts',
];

describe('decision-domain data trust links', () => {
  it('routes evidence-gap gestures to Admin Data Trust, not legacy Home aliases', () => {
    for (const file of DOMAIN_FILES) {
      const source = readFileSync(
        join(process.cwd(), 'src/lib/programs/expert-kernel/domain', file),
        'utf8',
      );

      expect(source).toContain('/admin/data-trust');
      expect(source).not.toContain('/home/data-trust');
    }
  });
});
