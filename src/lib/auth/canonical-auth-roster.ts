// Canonical demo-account roster for the sign-in surface.
//
// Founder direction (2026-05-08):
//   - Role-based usernames (role@<tenant>) instead of person names.
//   - Each Clerk account is bound to a real persona from the existing
//     tenant org charts (apex-data, meridian-data, firstcapital, northstar,
//     skyharbor). This
//     gives every login rich corpus context: charters they signed,
//     meetings they attended, programs they sponsor, decisions they
//     made — all already threaded through the data.
//
// Anand's client-specific operator identities are single-tenant aliases.
// They intentionally do not grant multi-client access. Each Clerk user is
// pinned through publicMetadata.clientId and the alias itself is an additional
// guardrail for routing and demo-ticket sign-in.
//
// Persona binding (display name maintained in cxo-personas.ts and
// in the Clerk user metadata seeded by the CXO provisioning script):
//
//   cio@apex-retail.example.com      → Carlos Rivera (CIO · Apex Retail)
//   cdo@apex-retail.example.com      → Lynne Stratham (CDO · Apex Retail)
//   cdio@meridian-health.example.com → Dr. Anita Krishnamurthy (CDIO · Meridian)
//   cdao@meridian-health.example.com → Kiran Rao (CDAO · Meridian)
//   cio@firstcapital.example.com     → Patricia Huang (CIO · First Capital)
//   cto@skyharbor-air.example.com    → Victor Hale (CTO · SkyHarbor)

export const CANONICAL_AUTH_EMAILS = [
  // Apex Retail Group
  "cio@apex-retail.example.com", // Carlos Rivera · CIO
  "cdo@apex-retail.example.com", // Lynne Stratham · Chief Data Officer

  // Meridian Health System
  "cdio@meridian-health.example.com", // Dr. Anita Krishnamurthy · CDIO
  "cdao@meridian-health.example.com", // Kiran Rao · Chief Data and Analytics Officer

  // First Capital
  "cio@firstcapital.example.com", // Patricia Huang · CIO

  // SkyHarbor Air
  "cto@skyharbor-air.example.com", // Victor Hale · CTO
  "cio@skyharbor-air.example.com", // Amala Rao · CIO
  "cfo@skyharbor-air.example.com", // Mara Chen · CFO
  "coo@skyharbor-air.example.com", // Darius King · COO
  "ciso@skyharbor-air.example.com", // Nadia Sethi · CISO
  "maestro@skyharbor-air.example.com", // Rina Patel · AbarVa Maestro / Pilot Lead
  "admin@skyharbor-air.example.com", // Owen Mercer · Tenant Admin / Context Layer Steward
  "cio@lakeshore-holdings.example.com", // Meera Rao · Global CIO
  "cfo@lakeshore-holdings.example.com", // Daniel Whitaker · CFO / Treasury Sponsor
  "admin@lakeshore-holdings.example.com", // admin · Lakeshore Holdings
] as const;

export const ANAND_OPERATOR_AUTH_EMAILS = [
  "anand.sundaram+apex@thesundaram.com",
  "anand.sundaram+meridian@thesundaram.com",
  "anand.sundaram+skyharbor@thesundaram.com",
  "anand.sundaram+lakeshore@thesundaram.com",
  "anand.sundaram+firstcapital@thesundaram.com",
  "anand.sundaram+northstar@thesundaram.com",
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  "cio@apex-retail.example.com",
  "cdo@apex-retail.example.com",
  "cdio@meridian-health.example.com",
  "cdao@meridian-health.example.com",
  "cio@firstcapital.example.com",
  "maestro@skyharbor-air.example.com",
  "admin@skyharbor-air.example.com",
  "cio@lakeshore-holdings.example.com",
  "cfo@lakeshore-holdings.example.com",
  "admin@lakeshore-holdings.example.com",
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
