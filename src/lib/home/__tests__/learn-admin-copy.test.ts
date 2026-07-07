import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('Home Learn admin copy contract', () => {
  it('frames Steward and operational workflows as Admin workspace guidance', () => {
    const learnSections = readRepoFile('src/lib/home/learn-sections.ts');

    expect(learnSections).toContain('Steward · Admin workspace');
    expect(learnSections).toContain('opening Admin connector requests');
    expect(learnSections).toContain('Validate Admin substrate readiness');

    expect(learnSections).not.toContain('Steward · Setup / Home');
    expect(learnSections).not.toContain('Onboard a new connector');
    expect(learnSections).not.toContain('Validate substrate completeness');
  });

  it('keeps glossary tips aligned to Admin workspace instead of Setup', () => {
    const glossary = readRepoFile('src/components/home/learn/GlossarySection.tsx');

    expect(glossary).toContain('<SubHead>Admin workspace</SubHead>');
    expect(glossary).toContain('approved Admin connector');
    expect(glossary).toContain('incomplete Admin context');
    expect(glossary).not.toContain('<SubHead>Setup</SubHead>');
  });
});
