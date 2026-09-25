export {};

// /rfp and /api/v1/source/rfp are on PUBLIC_ROUTE_PATTERNS, so Clerk does not
// stand in front of them. Being on that list is the ABSENCE of a control.
//
// This test is the control: every route under the vendor API must either be the
// sign-in route or resolve a vendor from the session cookie. Without it, adding
// one handler under that prefix silently publishes it to the internet.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// Must match an actual CALL. A bare substring test passes for a renamed or
// misspelled identifier such as `resolveVendorBySessionXX`, which is exactly the
// bug this guard exists to catch.
const CALLS_SESSION_RESOLVER = /\bresolveVendorBySession\s*\(/;

const API_ROOT = path.join(process.cwd(), 'src/app/api/v1/source/rfp');
const PAGE_ROOT = path.join(process.cwd(), 'src/app/rfp');

function routeFiles(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/^(route|page)\.tsx?$/.test(entry)) out.push(full);
    }
  }
  walk(root);
  return out;
}

describe('vendor portal public surface', () => {
  it('is registered as public so Clerk does not intercept it', () => {
    const proxy = readFileSync(path.join(process.cwd(), 'src/proxy.ts'), 'utf8');
    expect(proxy).toContain('"/rfp(.*)"');
    expect(proxy).toContain('"/api/v1/source/rfp(.*)"');
  });

  it('every vendor API route resolves a session, except sign-in itself', () => {
    const unguarded: string[] = [];
    for (const file of routeFiles(API_ROOT)) {
      const src = readFileSync(file, 'utf8');
      const isSignIn = file.includes(`${path.sep}sign-in${path.sep}`);
      if (isSignIn) {
        // Sign-in is the one route that legitimately has no session yet. It must
        // still verify a password rather than trusting the request.
        expect(src).toContain('verifyPassword');
        continue;
      }
      if (!CALLS_SESSION_RESOLVER.test(src)) unguarded.push(file);
    }
    expect(unguarded).toEqual([]);
  });

  it('every vendor page resolves a session, except the sign-in page', () => {
    const unguarded: string[] = [];
    for (const file of routeFiles(PAGE_ROOT)) {
      const src = readFileSync(file, 'utf8');
      if (file.includes(`${path.sep}sign-in${path.sep}`)) continue;
      if (src.includes("'use client'")) continue; // client components receive props, they do not gate
      if (!CALLS_SESSION_RESOLVER.test(src)) unguarded.push(file);
    }
    expect(unguarded).toEqual([]);
  });

  // A vendor is outside the organisation. Nothing on this surface may lean on
  // the tenant session that every other Source route assumes.
  it('no vendor route imports Clerk or the internal tenancy helper', () => {
    const leaks: string[] = [];
    for (const file of [...routeFiles(API_ROOT), ...routeFiles(PAGE_ROOT)]) {
      const src = readFileSync(file, 'utf8');
      if (/@clerk\/|requireTenancy/.test(src)) leaks.push(file);
    }
    expect(leaks).toEqual([]);
  });

  it('sign-in cannot distinguish an unknown username from a wrong password', () => {
    const src = readFileSync(path.join(API_ROOT, '[eventId]/sign-in/route.ts'), 'utf8');
    // A dummy verification keeps the timing of both paths comparable.
    expect(src).toContain('DUMMY_HASH');
    // And both must return the same error to the caller.
    const errors = [...src.matchAll(/error: '([a-z_]+)'/g)].map((m) => m[1]);
    expect(errors.filter((e) => e === 'invalid_credentials')).toHaveLength(1);
    expect(errors).not.toContain('unknown_username');
    expect(errors).not.toContain('wrong_password');
  });
});
