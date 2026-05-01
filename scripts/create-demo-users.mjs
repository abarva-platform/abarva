#!/usr/bin/env node
/**
 * Deprecated.
 *
 * The old `demo-*+clerk_test@abarva.com` users are no longer canonical.
 * Use `npx tsx scripts/create-test-users.ts` to provision the client-bound
 * roster from `src/testing/test-users/spec.ts`, then use
 * `npx tsx scripts/cleanup-auth-users.ts` to review legacy deletions.
 */

console.error('Deprecated: old demo users are no longer supported. Run `npx tsx scripts/create-test-users.ts` instead.');
process.exit(1);
