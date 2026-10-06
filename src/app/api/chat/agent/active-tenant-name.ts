import { canonicalClientDisplayNameOrNull } from "@/lib/client-config";

/**
 * What this turn tells the model when server-side tenant resolution found
 * nothing. SEC-P1-7 (audit 2026-05-13) moved this prompt block off the
 * request body; U-512 (2026-09-22) made its unresolved case reachable.
 */
export const UNRESOLVED_ACTIVE_TENANT_NAME = "Unknown active tenant";

/**
 * The tenant name this turn is answering for, as the model is told it:
 * `Active tenant: <name> (locked -- this is the user's client account).`
 *
 * Asks `canonicalClientDisplayNameOrNull`, not `canonicalClientDisplayName`.
 * The lenient form resolves an unrecognised key through `getClientOption`,
 * which answers the DEFAULT_CLIENT_KEY option rather than `undefined` -- so it
 * never returns null, and a turn whose active-client lookup had just failed
 * told the model it was locked to an account that was never established.
 *
 * It takes no request-supplied name. The dead fallback this replaced ended
 * `?? canonicalClientDisplayName({ name: body.tenantName }) ?? "Unknown active
 * tenant"`; repointing the first call without removing the second would have
 * woken a request-controlled tenant name up on exactly the path where
 * server-side resolution had failed, which is the class of defect SEC-P1-7
 * closed. The fallback was unreachable, so dropping it changes no behaviour
 * that was ever observable.
 */
export function resolveTurnTenantName(args: {
  activeClientKey?: string | null;
  activeClientName?: string | null;
}): string {
  return (
    canonicalClientDisplayNameOrNull({
      key: args.activeClientKey,
      name: args.activeClientName,
    }) ?? UNRESOLVED_ACTIVE_TENANT_NAME
  );
}
