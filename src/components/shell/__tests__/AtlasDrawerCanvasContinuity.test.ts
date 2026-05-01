import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/components/shell/AtlasDrawer.tsx'),
  'utf8',
);

describe('AtlasDrawer · composer continuity', () => {
  it('keeps newest turns directly under top composers', () => {
    expect(source).toContain("const latestFirst = composerPlacement === 'afterHeader'");
    expect(source).toContain('? [...visibleConversation].reverse()');
    expect(source).toContain('scroller.scrollTop = latestFirst ? 0 : scroller.scrollHeight');
  });

  it('enables browser writing assists on the prompt textarea', () => {
    expect(source).toContain('spellCheck');
    expect(source).toContain('autoCorrect="on"');
    expect(source).toContain('autoCapitalize="sentences"');
  });
});
