// Agent client logins — one dedicated AUTOMATION identity per active client tenant.
//
// Purpose: durable, password-less per-tenant accounts that the signed-in proof
// harness (scripts/auth/prime-agent-client-auth-states.ts) and the post-deploy
// crawl/gauntlet authenticate AS — via Clerk sign-in tokens (ticket strategy),
// so NO human ever logs in and there are NO passwords to manage. This replaces
// the dependency on the human CXO demo roster (which was removed, leaving the
// crawl/gauntlet access-stale).
//
// These are explicitly NON-HUMAN automation accounts ("Ava agent for <tenant>").
// They reuse the CxoPersona shape so the existing provisioner machinery
// (scripts/provision-cxo-personas.ts --agents) and the prime-auth harness work
// unchanged. They get `maestro` membership so a proof can reach every surface
// (Intelligence / Tower / Source / Moves / Setup) for the tenant.
//
// Provision once (secret-bearing env — CLERK_SECRET_KEY + Supabase service role):
//   npx tsx scripts/provision-cxo-personas.ts --agents --apply
// Then mint per-client auth states (no human login):
//   npx tsx scripts/auth/prime-agent-client-auth-states.ts
//
// Email convention: `<clientKey>-agent@abarva.example.com` — distinct from any
// human demo email, clearly an agent, one per client, on a non-deliverable
// reserved domain (example.com), matching the demo roster's domain convention.

import type { CxoPersona } from './cxo-personas';

/** One automation agent per active client tenant. clientKey is the canonical app key. */
export const AGENT_CLIENT_LOGINS: ReadonlyArray<CxoPersona> = [
  {
    slug: 'agent-skyharbor',
    email: 'skyharbor-agent@abarva.example.com',
    shortLabel: 'agent@skyharbor',
    firstName: 'Ava',
    lastName: 'Agent',
    personaName: 'Ava · Airline Demo (agent)',
    monogram: 'AV',
    titleShort: 'AGENT',
    titleFull: 'AbarVa automation agent',
    tenant: 'Airline Demo',
    clientKey: 'skyharbor',
    tenantKey: 'skyharbor_global',
    authRole: 'maestro',
    graphNodeId: 'person:agent:skyharbor',
    monogramBg: '#0369A1',
    bioShort: 'Automation account — signed-in proofs & crawl for Airline Demo.',
    bioLong:
      'Non-human automation identity used by the signed-in proof harness and the post-deploy crawl/gauntlet to authenticate as the Airline Demo tenant via Clerk sign-in tokens (no password). Not a real person.',
    workspaceTeaser:
      'Used to verify Airline Demo surfaces render and ground correctly under a real signed-in session.',
  },
];

/** Lookup the agent login for a client key. */
export function agentLoginForClientKey(
  clientKey: CxoPersona['clientKey'],
): CxoPersona | undefined {
  return AGENT_CLIENT_LOGINS.find((p) => p.clientKey === clientKey);
}
