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

  it('treats the hidden approved-access page and eligibility check as public pre-auth routes', () => {
    expect(isPublicRoute(new NextRequest('https://app.abarva.ai/access'))).toBe(true);
    expect(isPublicRoute(new NextRequest('https://app.abarva.ai/api/auth/access-eligibility'))).toBe(true);
  });

  it('treats the launch access-denied page as public so denied sessions do not loop through Clerk', () => {
    const request = new NextRequest('https://app.abarva.ai/access-denied');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it('treats the health endpoint as a public platform probe', () => {
    const request = new NextRequest('https://app.abarva.ai/api/health');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it('lets the guarded Azure connectivity probe return JSON instead of a Clerk redirect', () => {
    const request = new NextRequest('https://app.abarva.ai/api/health/azure-connectivity');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it('lets the guarded Postgres disruption drill return JSON instead of a Clerk redirect', () => {
    const request = new NextRequest('https://app.abarva.ai/api/health/postgres-disruption');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it('lets the guarded parallel-run invariant probe return JSON instead of a Clerk redirect', () => {
    const request = new NextRequest('https://app.abarva.ai/api/admin/parallel-run-invariants');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(true);
  });

  it('lets notification APIs return JSON auth or token responses instead of Clerk HTML rewrites', () => {
    for (const path of ['/api/notifications', '/api/notifications/dispatch']) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(true);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });

  it('does not treat unrelated auth API paths as public', () => {
    const request = new NextRequest('https://app.abarva.ai/api/auth/other');
    expect(isPublicRoute(request)).toBe(false);
  });

  it('keeps product workspaces auth-gated instead of public', () => {
    for (const path of ['/admin', '/home', '/programs', '/source', '/tower']) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isAuthRequiredRoute(request)).toBe(true);
      expect(isPublicRoute(request)).toBe(false);
    }
  });

  it('exposes /product as the public Product overview page', () => {
    const request = new NextRequest('https://app.abarva.ai/product');
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it('exposes the public How it works demo pages without Clerk protection', () => {
    for (const path of [
      '/how-it-works',
      '/how-it-works/it-productivity-comparison',
      '/how-it-works/frameworks/ai-it-productivity',
    ]) {
      const request = new NextRequest(`https://www.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(true);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });
});
