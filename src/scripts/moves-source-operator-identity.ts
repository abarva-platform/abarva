import "server-only";
import { DefaultAzureCredential } from "@azure/identity";
import type {
  ExactSourceCohort,
  NativeSourceRow,
} from "@/lib/programs/evidence-readiness/exact-source-preparation";

/** Use the same authoritative Clerk identity and native person mapping as the signed-in product. */
export async function sourceOperatorVerifier(
  cohort: Pick<ExactSourceCohort, "operatorPersonId" | "operatorClerkId">,
) {
  let secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    const uri = process.env.MOVES_SOURCE_CLERK_SECRET_URI;
    if (
      !uri ||
      !/^https:\/\/[a-z0-9-]+\.vault\.azure\.net\/secrets\/clerk-secret-key$/.test(
        uri,
      )
    )
      throw new Error("source_actor_authority_unavailable");
    const token = await new DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
    }).getToken("https://vault.azure.net/.default");
    const response = await fetch(`${uri}?api-version=7.4`, {
      headers: { authorization: `Bearer ${token.token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("source_actor_authority_unavailable");
    secret = ((await response.json()) as { value?: string }).value;
  }
  if (!secret || !/^user_[a-zA-Z0-9]+$/.test(cohort.operatorClerkId))
    throw new Error("source_actor_authority_unavailable");
  const response = await fetch(
    `https://api.clerk.com/v1/users/${cohort.operatorClerkId}`,
    {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error("source_actor_authority_unavailable");
  const user = (await response.json()) as {
    id: string;
    public_metadata?: { person_id?: string; accountType?: string };
    email_addresses?: Array<{
      email_address: string;
      verification?: { status: string };
    }>;
  };
  if (user.id !== cohort.operatorClerkId)
    throw new Error("source_actor_unbound");
  return async (person: NativeSourceRow) => {
    if (person.id !== cohort.operatorPersonId) return false;
    if (user.public_metadata?.accountType === "synthetic_e2e_operator")
      return person.graph_node_id === `clerk:${user.id}`;
    return (
      user.public_metadata?.person_id === person.id ||
      (typeof person.email === "string" &&
        !!user.email_addresses?.some(
          (email) =>
            email.verification?.status === "verified" &&
            email.email_address.toLowerCase() ===
              String(person.email).toLowerCase(),
        ))
    );
  };
}
