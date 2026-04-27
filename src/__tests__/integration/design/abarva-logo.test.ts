import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbarVaLogo } from '@/components/brand';

const logoPath = resolve(process.cwd(), 'public/brand/abarva-logo.svg');
const shellPaths = [
  resolve(process.cwd(), 'src/components/abarva/AbarVaAppShell.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaShellNav.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaWordmark.tsx'),
  resolve(process.cwd(), 'src/components/abarva/AbarVaTopNav.tsx'),
  resolve(process.cwd(), 'src/components/chrome/TopBar.tsx'),
  resolve(process.cwd(), 'src/components/admin/ExperienceGallery.tsx'),
];

describe('AbarVaLogo', () => {
  it('renders from the canonical public brand asset', () => {
    const markup = renderToStaticMarkup(createElement(AbarVaLogo, { 'aria-hidden': false }));
    const logoSource = readFileSync(logoPath, 'utf8');

    expect(markup).toContain('/brand/abarva-logo.svg');
    expect(logoSource).toContain('viewBox="0 0 1024 1024"');
  });

  it('has no symbol element in the canonical SVG asset', () => {
    const logoSource = readFileSync(logoPath, 'utf8').toLowerCase();
    expect(logoSource).not.toContain('<symbol');
    expect(logoSource).not.toContain('id="symbol"');
  });

  it('exposes brand logo via shell/nav consumers', () => {
    for (const shellPath of shellPaths) {
      const source = readFileSync(shellPath, 'utf8');
      expect(source).toMatch(/AbarVaLogo|AbarvaWordmark|AbarVaWordmark/);
    }
  });
});
