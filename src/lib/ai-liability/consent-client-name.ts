/**
 * The account name the two Responsible AI consent surfaces record a consent
 * against.
 *
 * U-513 (2026-09-22). Both `/responsible-ai/acknowledgment` and
 * `/responsible-ai/training` resolved this name inline, with a byte-identical
 * copy of `foundationClientDisplayName` in each page. Two problems, one fix:
 *
 * 1. Both chains went through `canonicalClientDisplayName`, which resolves
 *    anything unrecognised through `getClientOption` and so never returns
 *    `null`. The neutral literal each author wrote could not fire, and a reader
 *    whose tenant did not resolve was asked to accept a consent naming the
 *    DEFAULT_CLIENT_KEY account -- "I accept it for my access to <default>."
 *    These are consent records, not chrome: the account named is the one the
 *    acceptance is filed against. So this module asks
 *    `canonicalClientDisplayNameOrNull` and lets the neutral literal be reached.
 * 2. The duplicated helper had to be decided twice or not at all. It is one
 *    helper now, here, next to the only resolution that uses it.
 *
 * The full classification of the 40 `canonicalClientDisplayName(...) ?? ...`
 * call sites is `docs/governance/unresolved-client-fallback-classification.md`.
 *
 * This module is deliberately small and free of server-only imports: the cases
 * that pin it live under `src/__tests__/behaviors`, which the required
 * `Behavior coverage floor` sweeps as a directory, so whatever a case imports
 * lands in that gate's coverage denominator.
 */
import { canonicalClientDisplayNameOrNull } from "@/lib/client-config";

/**
 * What a consent surface says instead of an account name when nothing about the
 * reader's tenancy resolved. Exported so a case can assert the surface's words
 * rather than restating them.
 */
export const UNRESOLVED_CONSENT_CLIENT_NAME = "your workspace";

/**
 * Display name for the two foundation demo tenants, which are not registered
 * clients and so are invisible to `canonicalClientDisplayNameOrNull`.
 */
export function foundationClientDisplayName(
  clientKey: string | null | undefined,
): string | null {
  if (clientKey === "airline-demo-new") return "Airline Demo New";
  if (clientKey === "healthcare-demo-new") return "Healthcare Demo New";
  return null;
}

/** `null` for absent, blank or whitespace-only. */
function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The account a consent is recorded against, or
 * {@link UNRESOLVED_CONSENT_CLIENT_NAME} when the reader's tenancy did not
 * resolve at all.
 *
 * The order is the one both pages already declared: the subject's own
 * foundation key first, then the registered client the active row names, then
 * that row's own name, then nothing. Every link is now reachable. The row's own
 * name is trusted because it comes from the tenant read, not from the request.
 */
export function resolveConsentClientName(args: {
  subjectClientKey?: string | null;
  activeClient?: { key?: string | null; name?: string | null } | null;
}): string {
  return (
    foundationClientDisplayName(args.subjectClientKey) ??
    canonicalClientDisplayNameOrNull({
      key: args.activeClient?.key,
      name: args.activeClient?.name,
    }) ??
    trimmedOrNull(args.activeClient?.name) ??
    UNRESOLVED_CONSENT_CLIENT_NAME
  );
}
