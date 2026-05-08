// Canonical demo-account roster for the sign-in surface.
//
// Founder direction (2026-05-08): one admin per client, no other
// demo identities. Anand is the platform super-user (allowlist via
// PLATFORM_ADMIN_EMAIL_ALLOWLIST in tenant-roles.ts) and is not
// listed here — he authenticates through normal Clerk flows, not the
// demo OTP picker.
//
// Sign-in flow uses these emails as the clickable identity list and
// the API gates `demo-code-sign-in` against this exact set.

export const CANONICAL_AUTH_EMAILS = [
  // One admin per tenant. Each carries the maestro/admin role and
  // signs in with OTP 424242 + password Demo2026!.
  'nina.patel@meridian-health.example.com', // Meridian Health System · CIO
  'maya.desai@apex-retail.example.com', // Apex Retail Group · CDO
  'ethan.brooks@firstcapital.example.com', // First Capital · CTO
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  'nina.patel@meridian-health.example.com',
  'maya.desai@apex-retail.example.com',
  'ethan.brooks@firstcapital.example.com',
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
