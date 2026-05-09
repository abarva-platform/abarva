import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATE_PATHS, validateTemplate } from '@/scripts/seed/validate-tower-substrate-depth';

describe('Tower AI initiative substrate depth', () => {
  it('keeps all pilot tenant templates at Atlas-ready depth', () => {
    for (const templatePath of TEMPLATE_PATHS) {
      const payload = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), templatePath), 'utf8'),
      );
      expect(validateTemplate(payload, '2026-05-12')).toEqual([]);
    }
  });
});
