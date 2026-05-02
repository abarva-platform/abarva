import { createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { AUTH_REQUIRED_ROUTE_PATTERNS, PUBLIC_ROUTE_PATTERNS } from '@/proxy';

describe('proxy public route patterns', () => {
  const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);
  const isAuthRequiredRoute = createRouteMatcher([...AUTH_REQUIRED_ROUTE_PATTERNS]);

  it('treats the demo code sign-in handoff as a public route', () => {
    const request = new NextRequest('https://app.abarva.ai/api/auth/demo-code-sign-in');
    expect(isPublicRoute(request)).toBe(true);
  });

  it('does not treat unrelated auth API paths as public', () => {
    const request = new NextRequest('https://app.abarva.ai/api/auth/other');
    expect(isPublicRoute(request)).toBe(false);
  });

  it('keeps product workspaces auth-gated instead of public', () => {
    for (const path of ['/admin', '/home', '/programs', '/source', '/tower', '/product']) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isAuthRequiredRoute(request)).toBe(true);
      expect(isPublicRoute(request)).toBe(false);
    }
  });
});
