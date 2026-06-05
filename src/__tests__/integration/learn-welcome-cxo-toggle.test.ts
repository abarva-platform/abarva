import fs from 'node:fs';
import path from 'node:path';

import { CLIENT_KEY_TO_DB_NAME, getClientOption } from '@/lib/client-config';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('Learn welcome CXO context switcher', () => {
  it('offers Apex and Meridian executive review paths from the top of the page', () => {
    const source = read('src/components/home/learn/WelcomeSection.tsx');

    expect(source).toContain("type ReviewScenarioKey = 'apex' | 'meridian'");
    expect(source).toContain('role="tablist"');
    expect(source).toContain('Apex Retail primary demo');
    expect(source).toContain('Healthcare CXO path');
    expect(source).toContain('Meridian Health System');
    expect(source).toContain('AI Governance + Analytics Modernization');
  });

  it('uses the brand wordmark for the hero AbarVa reference', () => {
    const welcome = read('src/components/home/learn/WelcomeSection.tsx');
    const primitives = read('src/components/home/learn/primitives.tsx');

    expect(welcome).toContain('InlineAbarvaLogo');
    expect(primitives).toContain('/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg');
    expect(primitives).toContain('/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg');
  });

  it('exposes Meridian as the healthcare client label while preserving legacy aliases', () => {
    expect(getClientOption('meridian').name).toBe('Meridian Health System');
    expect(getClientOption('meridian').shortName).toBe('Meridian Health');
    expect(CLIENT_KEY_TO_DB_NAME.meridian).toContain('Meridian Health');
  });
});
