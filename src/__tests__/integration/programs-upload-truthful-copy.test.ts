import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'src/components/programs/ProgramDetailPage.tsx'),
  'utf8',
);

describe('Programs upload panel truthful parsing copy', () => {
  it('does not claim every uploaded document is parsed into insights', () => {
    expect(source).not.toContain('Document parsed · 3 insights extracted');
    expect(source).not.toContain('Documents are parsed for evidence');
  });

  it('exposes the same evidence-friendly formats that the upload route accepts', () => {
    expect(source).toContain('.txt,.md,.csv,.json');
    expect(source).toContain('.docx,.xlsx,.pptx');
    expect(source).toContain('.mp3,.m4a,.mp4');
  });

  it('distinguishes immediate text parsing from metadata-only capture', () => {
    expect(source).toContain('Evidence captured · text parsed');
    expect(source).toContain('File captured · structured parsing pending');
    expect(source).toContain('Text, Markdown, CSV, and JSON are parsed immediately');
  });
});
