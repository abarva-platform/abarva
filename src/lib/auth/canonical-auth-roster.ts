// Canonical demo-account roster for the sign-in surface.
//
// Founder direction (2026-05-08):
//   - One admin per client, no other demo identities.
//   - Role-based username (cxo@<tenant>) instead of person names.
//
// Anand (anand.sundaram@thesundaram.com) is not in this roster — he
// is a platform super-user via PLATFORM_ADMIN_EMAIL_ALLOWLIST in
// tenant-roles.ts and signs in through normal Clerk flows, not the
// demo OTP picker.
//
// The sign-in flow uses these emails as the clickable identity list
// and the API gates `demo-code-sign-in` against this exact set.
//
// Display label vs. stored email:
//   - Card UI shows the short form (cxo@meridian-health) for clarity.
//   - The actual email kept here uses the existing *.example.com
//     pattern so the value is RFC-clean and Clerk accepts it without
//     special handling.

export const CANONICAL_AUTH_EMAILS = [
  // Each tenant admin signs in with OTP 424242 + password Demo2026!.
  'cxo@meridian-health.example.com', // Meridian Health System · CXO
  'cxo@apex-retail.example.com', // Apex Retail Group · CXO
  'cxo@firstcapital.example.com', // First Capital · CXO
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  'cxo@meridian-health.example.com',
  'cxo@apex-retail.example.com',
  'cxo@firstcapital.example.com',
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
