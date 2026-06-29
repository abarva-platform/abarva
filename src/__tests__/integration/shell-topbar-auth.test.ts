import { readFileSync } from 'fs';
import { join } from 'path';

const topBarSource = readFileSync(
  join(process.cwd(), 'src/components/shell/AppTopBar.tsx'),
  'utf8',
);

describe('AppTopBar auth affordances', () => {
  it('renders a visible sign-out action for signed-in users', () => {
    expect(topBarSource).toMatch(/['"]use client['"]/);
    expect(topBarSource).toContain('useUser');
    expect(topBarSource).toContain('useSignOut');
    expect(topBarSource).toContain('Sign out');
  });

  it('clears the active client context before sign-out', () => {
    expect(topBarSource).toContain('const signOut = useSignOut()');
    expect(topBarSource).toContain('void signOut()');
  });

  it('makes the wordmark an explicit Home link', () => {
    expect(topBarSource).toContain('href="/home"');
    expect(topBarSource).toMatch(/aria-label=['"]AbarVa Home['"]/);
  });

  it('does not render Clerk fullName directly because it can contain tenant labels', () => {
    expect(topBarSource).toContain('function userDisplayName');
    expect(topBarSource).toContain('demoSafeClientText(fallback)');
    expect(topBarSource).not.toContain('const displayName =\n    user?.fullName');
  });
});
