import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbarVaLogo } from '@/components/abarva/AbarVaLogo';

const logoPath = resolve(process.cwd(), 'public/brand/abarva-logo.svg');
const shellPaths = [
  resolve(process.cwd(), 'src/components/abarva/AbarVaAppShell.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaShellNav.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaWordmark.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaTopNav.tsx'),
  // NAV1B: src/components/chrome/TopBar.tsx removed in an earlier wave;
  // its consumers were migrated to AbarVaTopNav / AbarVaShellNav.
  resolve(process.cwd(), 'src/components/admin/ExperienceGallery.tsx'),
];

describe('AbarVaLogo', () => {
  it('renders from the canonical public brand asset', () => {
    const markup = renderToStaticMarkup(createElement(AbarVaLogo, { 'aria-hidden': false }));
    const logoSource = readFileSync(logoPath, 'utf8');

    expect(markup).toContain('/brand/abarva-logo.svg');
    expect(logoSource).toContain('viewBox="0 0 1600 520"');
  });

  it('has no symbol element in the canonical SVG asset', () => {
    const logoSource = readFileSync(logoPath, 'utf8').toLowerCase();
    expect(logoSource).not.toContain('<symbol');
    expect(logoSource).not.toContain('id="symbol"');
  });

  it('exposes brand logo via shell/nav consumers', () => {
    for (const shellPath of shellPaths.filter((file) => existsSync(file))) {
      const source = readFileSync(shellPath, 'utf8');
      expect(source).toMatch(/AbarVaLogo|AbarvaWordmark|AbarVaWordmark/);
    }
  });
});

// ---------------------------------------------------------------------
// NAV1B · canonical brand component invariants (pure TypeScript)
// ---------------------------------------------------------------------

describe('NAV1B · AbarVaLogo wordmark-only invariants', () => {
  const logoComponentSource = readFileSync(
    resolve(process.cwd(), 'src/components/brand/AbarVaLogo.tsx'),
    'utf8',
  );
  const brandIndexSource = readFileSync(
    resolve(process.cwd(), 'src/components/brand/index.ts'),
    'utf8',
  );

  it('AbarVaLogo component file points at the canonical /brand/abarva-logo.svg asset', () => {
    expect(logoComponentSource).toContain('/brand/abarva-logo.svg');
  });

  it('AbarVaLogo component file does not inline an SVG symbol or path mark', () => {
    expect(logoComponentSource).not.toMatch(/<svg/i);
    expect(logoComponentSource).not.toMatch(/<symbol/i);
    expect(logoComponentSource).not.toMatch(/<path/i);
  });

  it('AbarVaLogo component file declares no banned tokens', () => {
    // Banned: teal accent, sparkle motif, Sanskrit AUM glyph.
    expect(logoComponentSource).not.toContain('#14B8A6');
    expect(logoComponentSource.toLowerCase()).not.toContain('sparkle');
    expect(logoComponentSource).not.toContain('ॐ'); // ॐ
  });

  it('AbarVaLogo exposes the canonical sm/md/lg size prop', () => {
    expect(logoComponentSource).toMatch(/AbarVaLogoSize\s*=\s*'sm'\s*\|\s*'md'\s*\|\s*'lg'/);
    expect(logoComponentSource).toMatch(/SIZE_TO_HEIGHT/);
  });

  it('AbarVaLogo accepts an aria-label "label" prop', () => {
    expect(logoComponentSource).toMatch(/label\s*\?:\s*string/);
    expect(logoComponentSource).toMatch(/aria-label\s*=\s*\{label\}/);
  });

  it('brand index re-exports AbarVaLogo as the canonical entry point', () => {
    expect(brandIndexSource).toMatch(/export\s*\{\s*AbarVaLogo\s*\}\s*from\s*['"]\.\/AbarVaLogo['"]/);
  });

  it('canonical SVG asset uses no banned token in markup', () => {
    const logoSource = readFileSync(logoPath, 'utf8');
    expect(logoSource).not.toContain('#14B8A6');
    expect(logoSource.toLowerCase()).not.toContain('sparkle');
    expect(logoSource).not.toContain('ॐ');
  });
});
