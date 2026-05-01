import { readFileSync } from 'fs';
import { join } from 'path';

const topBarSource = readFileSync(
  join(process.cwd(), 'src/components/shell/AppTopBar.tsx'),
  'utf8',
);

describe('AppTopBar auth affordances', () => {
  it('renders a visible sign-out action for signed-in users', () => {
    expect(topBarSource).toContain("'use client'");
    expect(topBarSource).toContain('useUser');
    expect(topBarSource).toContain('useClerk');
    expect(topBarSource).toContain('Sign out');
  });

  it('clears the active client context before sign-out', () => {
    expect(topBarSource).toContain('clearActiveClientContext()');
    expect(topBarSource).toContain("router.push('/')");
  });

  it('makes the wordmark an explicit Home link', () => {
    expect(topBarSource).toContain('href="/home"');
    expect(topBarSource).toContain('aria-label="Go to Home"');
  });
});
