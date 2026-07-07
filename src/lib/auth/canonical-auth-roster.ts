// Launch access roster for the gated workspace sign-in surface.
//
// This is intentionally not the old role@example.com demo roster. Public
// /sign-in is hidden behind the marketing page; /access accepts only known
// launch identities plus any real client emails added through the runtime
// launch-access env vars.

export const CANONICAL_AUTH_EMAILS = [
  // AbarVa admin / founder access.
  'admin@abarva.ai',
  'anand@abarva.ai',

  // Anand client-specific test identities.
  'anand.sundaram+apex@thesundaram.com',
  'anand.sundaram+firstcapital@thesundaram.com',
  'anand.sundaram+meridian@thesundaram.com',
  'anand.sundaram+skyharbor@thesundaram.com',
  'anand.sundaram+lakeshore@thesundaram.com',

  // Earlier manually provisioned founder test identities.
  'anand.sundaram@thesundaram.com',
  'anandshp@gmail.com',
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  'admin@abarva.ai',
  'anand@abarva.ai',
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
