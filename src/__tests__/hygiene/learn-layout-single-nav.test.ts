import { readFileSync } from 'fs';
import { join } from 'path';

function readRepoFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('/home/learn shell chrome ownership', () => {
  it('does not render NexusTopNav inside the nested Learn layout', () => {
    const layout = readRepoFile('src/app/(maestro)/home/learn/layout.tsx');
    const maestroChrome = readRepoFile('src/components/chrome/MaestroChrome.tsx');

    expect(maestroChrome).toContain('<NexusTopNav />');
    expect(maestroChrome).toContain("'/home'");
    expect(layout).not.toMatch(/import\s+\{\s*NexusTopNav\s*\}/);
    expect(layout).not.toContain('<NexusTopNav');
    expect(layout).toContain('LearnSideNav');
  });
});
