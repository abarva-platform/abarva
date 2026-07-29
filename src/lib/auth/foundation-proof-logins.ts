export type FoundationProofTenantKey =
  | "airline-demo-new"
  | "healthcare-demo-new";

export type FoundationProofPersonaKind = "human_owner" | "automation_agent";

export interface FoundationProofLogin {
  slug: string;
  tenantKey: FoundationProofTenantKey;
  tenantName: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  personaKind: FoundationProofPersonaKind;
  purpose: string;
}

/**
 * Passwordless proof identities for foundation-only tenants.
 *
 * These are deliberately separate from the legacy demo client roster
 * (`skyharbor`, `meridian`, etc.). They exist only to prove the governed
 * Knowledge Baseline through `/knowledge-preview?provider=http&tenant=...`
 * before any tenant is activated on the ordinary product routes.
 */
export const FOUNDATION_PROOF_LOGINS: readonly FoundationProofLogin[] = [
  {
    slug: "anand-airline-foundation",
    tenantKey: "airline-demo-new",
    tenantName: "Airline Demo New",
    email: "anand.sundaram+airline-foundation@thesundaram.com",
    phoneNumber: "+15550190101",
    firstName: "Anand",
    lastName: "Sundaram",
    personaKind: "human_owner",
    purpose:
      "Founder/operator proof identity for Airline Demo New foundation preview.",
  },
  {
    slug: "agent-airline-foundation",
    tenantKey: "airline-demo-new",
    tenantName: "Airline Demo New",
    email: "airline-foundation-agent@abarva.ai",
    phoneNumber: "+15550190102",
    firstName: "Ava",
    lastName: "Agent",
    personaKind: "automation_agent",
    purpose:
      "Non-human automation identity for Airline Demo New signed-in browser proof.",
  },
];

export interface FoundationProofMetadata extends Record<string, unknown> {
  role: "client";
  accountType: "foundation_proof_login";
  foundationTenant: true;
  proofLogin: true;
  foundationTenantKey: FoundationProofTenantKey;
  tenantKey: FoundationProofTenantKey;
  clientId: FoundationProofTenantKey;
  defaultClientId: FoundationProofTenantKey;
  tenantName: string;
  personaKind: FoundationProofPersonaKind;
  clientLocked: true;
  moduleAccess: readonly ["knowledge"];
  allowedRoutes: readonly ["/knowledge-preview"];
}

export function buildFoundationProofMetadata(
  login: FoundationProofLogin,
): FoundationProofMetadata {
  return {
    role: "client",
    accountType: "foundation_proof_login",
    foundationTenant: true,
    proofLogin: true,
    foundationTenantKey: login.tenantKey,
    tenantKey: login.tenantKey,
    clientId: login.tenantKey,
    defaultClientId: login.tenantKey,
    tenantName: login.tenantName,
    personaKind: login.personaKind,
    clientLocked: true,
    moduleAccess: ["knowledge"],
    allowedRoutes: ["/knowledge-preview"],
  };
}

export function foundationProofLoginsForTenant(
  tenantKey: FoundationProofTenantKey,
): readonly FoundationProofLogin[] {
  return FOUNDATION_PROOF_LOGINS.filter(
    (login) => login.tenantKey === tenantKey,
  );
}
