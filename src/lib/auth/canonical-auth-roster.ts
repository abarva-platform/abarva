// Canonical demo-account roster for the sign-in surface.
//
// Founder direction (2026-05-08):
//   - Role-based usernames (role@<tenant>) instead of person names.
//   - Each Clerk account is bound to a real persona from the existing
//     tenant org charts (apex-data, meridian-data, firstcapital). This
//     gives every login rich corpus context: charters they signed,
//     meetings they attended, programs they sponsor, decisions they
//     made — all already threaded through the data.
//
// Anand (anand.sundaram@thesundaram.com) is not in this roster — he
// is a platform super-user via PLATFORM_ADMIN_EMAIL_ALLOWLIST in
// tenant-roles.ts and signs in through normal Clerk flows, not the
// demo OTP picker.
//
// Persona binding (display name maintained in DemoCodeSignIn.tsx and
// in the Clerk user metadata seeded by the Wave 2 provisioning script):
//
//   cio@apex-retail.example.com      → Carlos Rivera (CIO · Apex Retail)
//   cdo@apex-retail.example.com      → Lynne Stratham (CDO · Apex Retail)
//   cdio@meridian-health.example.com → Dr. Anita Krishnamurthy (CDIO · Meridian)
//   cio@firstcapital.example.com     → Patricia Huang (CIO · First Capital)

export const CANONICAL_AUTH_EMAILS = [
  // Apex Retail Group
  'cio@apex-retail.example.com', // Carlos Rivera · CIO
  'cdo@apex-retail.example.com', // Lynne Stratham · Chief Data Officer

  // Meridian Health System
  'cdio@meridian-health.example.com', // Dr. Anita Krishnamurthy · CDIO

  // First Capital
  'cio@firstcapital.example.com', // Patricia Huang · CIO
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  'cio@apex-retail.example.com',
  'cdo@apex-retail.example.com',
  'cdio@meridian-health.example.com',
  'cio@firstcapital.example.com',
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
