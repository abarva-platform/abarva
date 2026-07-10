import fs from 'node:fs';
import path from 'node:path';

describe('sign-in route contract', () => {
  const routePath = path.join(
    process.cwd(),
    'src/app/sign-in/[[...sign-in]]/page.tsx',
  );

  it('renders the sign-in shell for anonymous users instead of bouncing to marketing', () => {
    const source = fs.readFileSync(routePath, 'utf8');

    expect(source).toContain("import { SignInShell }");
    expect(source).toContain('<SignInShell');
    expect(source).not.toContain("redirect('/')");
    expect(source).not.toContain('redirect("/")');
  });

  it('keeps authenticated users on the normal post-sign-in resolver', () => {
    const source = fs.readFileSync(routePath, 'utf8');

    expect(source).toContain('currentUser()');
    expect(source).toContain('redirect(params.redirect || "/auth-redirect")');
  });
});
