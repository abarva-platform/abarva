import { clerkFrontendApiHostFromPublishableKey } from "@/lib/crawl/clerk-testing-token";

/**
 * C-639 · which of two causes stopped the signed-in crawl.
 *
 * The crawl mints a Clerk sign-in ticket with the Backend API (keyed by
 * `CLERK_SECRET_KEY`) and redeems it in the browser against the Frontend API
 * the publishable key names. When redemption is refused with
 * `This ticket is invalid`, exactly one line of output has been produced for
 * months, and it is consistent with two defects that have OPPOSITE owners:
 *
 *   - the ticket was minted by a different (or rotated) Clerk instance than the
 *     browser loads — only an operator can provision the matching secret, and
 *     an agent must stop at that boundary rather than edit the crawl;
 *   - the crawl mints or redeems wrongly — ordinary code, this lane's to fix.
 *
 * Both instance identities are readable WITHOUT knowing the secret's value: the
 * minting instance from the ticket's own `iss` claim, the redeeming instance
 * from the publishable key. When either is unreadable this returns
 * `undetermined` and says which side it could not read. Naming the wrong owner
 * is worse than naming neither.
 */

export type CrawlAuthStage = "mint" | "redeem";

export type CrawlAuthCause =
  /** The Backend API refused to mint; upstream of the browser entirely. */
  | "mint_rejected"
  /** Minted fine, but the browser redeemed it after it had expired. */
  | "ticket_expired_before_redemption"
  /** Minting instance and redeeming instance are different Clerk instances. */
  | "instance_mismatch"
  /** Same instance, ticket still refused — the redemption itself is wrong. */
  | "redemption_defect"
  /** An identity needed for the comparison could not be read. */
  | "undetermined"
  /** Neither stage failed. */
  | "no_failure";

export type CrawlAuthOwner = "operator-secret" | "this-lane" | "undetermined";

export interface CrawlAuthMintOutcome {
  ok: boolean;
  error?: string;
  /** The ticket as returned by `signInTokens.createSignInToken`. */
  ticket?: string;
  expiresInSeconds?: number;
  /**
   * C-640 · `SignInToken.url`, served by the MINTING instance, and the only
   * remaining no-secret source of the mint-side identity now that the ticket
   * is known to carry no decodable `iss` live.
   *
   * It is an ACCOUNT-PORTAL url (`accounts.<domain>`), not a Frontend API one,
   * and it carries the ticket in a `__clerk_ticket` query parameter. Only its
   * host is ever read or logged.
   */
  url?: string;
  /** `SignInToken.status` — logged verbatim, for the operator, not compared. */
  status?: string;
  /** `SignInToken.id` — logged so an operator can find it in the dashboard. */
  tokenId?: string;
}

export interface CrawlAuthRedeemOutcome {
  ok: boolean;
  error?: string;
  elapsedMsSinceMint?: number;
}

export interface CrawlAuthObservation {
  mint: CrawlAuthMintOutcome;
  redeem: CrawlAuthRedeemOutcome;
  publishableKey?: string;
}

export interface CrawlAuthVerdict {
  cause: CrawlAuthCause;
  stage: CrawlAuthStage | null;
  owner: CrawlAuthOwner;
  mintInstance: string | null;
  redeemInstance: string | null;
  /** One line, printed by the crawl and carried into its finding text. */
  statement: string;
}

/**
 * The Frontend API host a Clerk sign-in ticket was issued by, read from the
 * JWT's `iss` claim. The signature is deliberately NOT verified: this is an
 * identity comparison for a diagnostic, not an authorization decision, and
 * verifying it would need the very key whose correctness is in question.
 */
export function clerkTicketIssuerHost(
  ticket: string | undefined | null,
): string | null {
  const segments = ticket?.trim().split(".");
  if (!segments || segments.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], "base64url").toString("utf8"),
    ) as { iss?: unknown };
    if (typeof payload.iss !== "string" || !payload.iss.trim()) return null;
    const issuer = payload.iss.includes("://")
      ? payload.iss
      : `https://${payload.iss}`;
    const host = new URL(issuer).hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

/** Which kind of Clerk instance a host belongs to. */
export type ClerkInstanceKind = "production" | "development";

/**
 * The identity that every host of ONE Clerk instance shares. Two hosts compare
 * equal exactly when they belong to the same instance.
 */
export interface ClerkInstanceIdentity {
  kind: ClerkInstanceKind;
  id: string;
}

/** Clerk serves one development instance from these two suffixes. */
const DEV_FRONTEND_API_SUFFIX = ".clerk.accounts.dev";
const DEV_PORTAL_SUFFIX = ".accounts.dev";

/**
 * C-640 · the instance a Clerk host belongs to, or `null` when the rule cannot
 * say.
 *
 * A Clerk instance presents TWO hosts, and the two halves of this diagnostic
 * read different ones: the publishable key names the Frontend API host
 * (`clerk.<domain>`), while `SignInToken.url` is the account-portal host
 * (`accounts.<domain>`). Comparing those strings directly reports a mismatch
 * on a perfectly matched pair, which would send an operator to rotate a
 * correct secret — the precise failure C-639's `undetermined` branch exists to
 * prevent. So both are reduced to the domain they share.
 *
 * `null` is a real answer here and is NOT widened away. Returning `accounts.dev`
 * for a bare suffix would make two unrelated development instances compare
 * equal, and a verdict built on that is worse than no verdict.
 */
export function clerkInstanceIdentityFromHost(
  host: string | undefined | null,
): ClerkInstanceIdentity | null {
  const normalized = host?.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized || normalized.includes("/") || normalized.includes(" ")) {
    return null;
  }

  // The longer suffix is tested first on purpose: stripping `.accounts.dev`
  // from `<slug>.clerk.accounts.dev` would leave `<slug>.clerk`, which is not
  // the slug and would not match the portal host of the same instance.
  for (const suffix of [DEV_FRONTEND_API_SUFFIX, DEV_PORTAL_SUFFIX]) {
    if (!normalized.endsWith(suffix)) continue;
    const slug = normalized.slice(0, -suffix.length);
    // The slug is a single label. Anything else is a shape this rule has not
    // been shown, so it gets no identity rather than a guessed one.
    if (!slug || slug.includes(".")) return null;
    // `clerk.accounts.dev` is the bare Frontend API suffix, not an instance
    // whose slug happens to be `clerk` — and an instance really slugged
    // `clerk` would be indistinguishable from it here. Ambiguous, so no
    // identity: the comparison reports `unsound` and no owner is named.
    if (slug === "clerk") return null;
    return { kind: "development", id: `${slug}${DEV_PORTAL_SUFFIX}` };
  }

  if (normalized.endsWith(".dev") && normalized.split(".").length <= 2) {
    return null;
  }

  const labels = normalized.split(".");
  if (labels.length < 2 || labels.some((label) => label === "")) return null;

  // A production instance is `clerk.<domain>` and `accounts.<domain>`, so one
  // leading Clerk label is dropped — but only while what remains is still a
  // domain, so `clerk.ai` keeps its own identity instead of becoming `ai`.
  const [first, ...rest] = labels;
  if ((first === "clerk" || first === "accounts") && rest.length >= 2) {
    return { kind: "production", id: rest.join(".") };
  }
  return { kind: "production", id: normalized };
}

/**
 * `unsound` when either side has no derivable identity — the comparison was
 * not performed and no owner may be named from it.
 */
export type ClerkInstanceComparison = "same" | "different" | "unsound";

export function compareClerkInstances(
  mint: ClerkInstanceIdentity | null,
  redeem: ClerkInstanceIdentity | null,
): ClerkInstanceComparison {
  if (!mint || !redeem) return "unsound";
  // A development host against a production vanity host is decisive, and the
  // id comparison alone already decides it — so there is deliberately NO
  // `kind` comparison here. Every host ending `.accounts.dev` is routed to the
  // development branch above or gets no identity at all, so a production id
  // can never end in `.accounts.dev` and the two kinds cannot collide on an
  // id. A `kind` check would be a branch no input reaches, which is the
  // unfailable-guard shape this module exists against; it survived its own
  // mutation when it was here, which is how that was found. The invariant that
  // makes it unnecessary is pinned by a test rather than left as an argument.
  return mint.id === redeem.id ? "same" : "different";
}

/**
 * The host of the mint response's `url`. The url itself is never returned and
 * never logged: it carries the live ticket in `__clerk_ticket`, and a CI log
 * is readable by anyone with repository read.
 */
export function clerkMintUrlHost(
  url: string | undefined | null,
): string | null {
  const value = url?.trim();
  if (!value) return null;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

/**
 * The minting instance's host. The ticket's own `iss` is preferred when it is
 * readable; the mint response's url host is the fallback, because live the
 * ticket is not a decodable JWT at all (run `37155858207`).
 */
export function clerkMintInstanceHost(
  mint: CrawlAuthMintOutcome,
): string | null {
  return clerkTicketIssuerHost(mint.ticket) ?? clerkMintUrlHost(mint.url);
}

export function classifyCrawlAuthFailure(
  observation: CrawlAuthObservation,
): CrawlAuthVerdict {
  const mintInstance = clerkMintInstanceHost(observation.mint);
  const redeemInstance = clerkFrontendApiHostFromPublishableKey(
    observation.publishableKey,
  );

  if (!observation.mint.ok) {
    return {
      cause: "mint_rejected",
      stage: "mint",
      owner: "undetermined",
      mintInstance,
      redeemInstance,
      statement:
        "The Backend API refused to mint the sign-in ticket, so the browser never redeemed one; " +
        `read the mint error itself — ${observation.mint.error ?? "no error recorded"} — ` +
        "because whether the minting credential or this lane's request is at fault cannot be determined from a refusal alone.",
    };
  }

  if (observation.redeem.ok) {
    return {
      cause: "no_failure",
      stage: null,
      owner: "undetermined",
      mintInstance,
      redeemInstance,
      statement:
        "Both stages succeeded: the ticket was minted and redeemed, so no cause is owed and no owner is named.",
    };
  }

  const { elapsedMsSinceMint } = observation.redeem;
  const { expiresInSeconds } = observation.mint;
  if (
    typeof elapsedMsSinceMint === "number" &&
    typeof expiresInSeconds === "number" &&
    elapsedMsSinceMint > expiresInSeconds * 1000
  ) {
    return {
      cause: "ticket_expired_before_redemption",
      stage: "redeem",
      owner: "this-lane",
      mintInstance,
      redeemInstance,
      statement:
        `The ticket was redeemed ${Math.round(elapsedMsSinceMint / 1000)}s after minting against a ` +
        `${expiresInSeconds}s expiry, so it had already lapsed — this lane fixes the ordering, and no secret is implicated.`,
    };
  }

  if (!mintInstance || !redeemInstance) {
    const unreadable = [
      mintInstance ? null : "the minted ticket carries no readable issuer",
      redeemInstance
        ? null
        : "the publishable key did not yield a Frontend API host",
    ]
      .filter(Boolean)
      .join(" and ");
    return {
      cause: "undetermined",
      stage: "redeem",
      owner: "undetermined",
      mintInstance,
      redeemInstance,
      statement:
        `Redemption was refused and the owner cannot be determined, because ${unreadable}; ` +
        "no secret is implicated and no code defect is claimed until both instance identities can be read.",
    };
  }

  const comparison = compareClerkInstances(
    clerkInstanceIdentityFromHost(mintInstance),
    clerkInstanceIdentityFromHost(redeemInstance),
  );

  if (comparison === "unsound") {
    const unplaceable = [
      clerkInstanceIdentityFromHost(mintInstance) ? null : mintInstance,
      clerkInstanceIdentityFromHost(redeemInstance) ? null : redeemInstance,
    ]
      .filter(Boolean)
      .join(" and ");
    return {
      cause: "undetermined",
      stage: "redeem",
      owner: "undetermined",
      mintInstance,
      redeemInstance,
      statement:
        `Redemption was refused and both hosts read — mint ${mintInstance}, redeem ${redeemInstance} — ` +
        `but no Clerk instance can be derived from ${unplaceable}, so the two are not comparable; ` +
        "no owner is named, because a host difference that is not an instance difference would send an operator to rotate a correct secret.",
    };
  }

  if (comparison === "different") {
    return {
      cause: "instance_mismatch",
      stage: "redeem",
      owner: "operator-secret",
      mintInstance,
      redeemInstance,
      statement:
        `The ticket was minted by Clerk instance ${mintInstance} and redeemed against ${redeemInstance}, ` +
        "so it was always going to be refused: an operator provisions a CLERK_SECRET_KEY belonging to the instance the browser loads, and this lane must not edit the crawl to work around it.",
    };
  }

  return {
    cause: "redemption_defect",
    stage: "redeem",
    owner: "this-lane",
    mintInstance,
    redeemInstance,
    statement:
      `Both stages name the same Clerk instance ${mintInstance}, and the ticket was still refused, ` +
      "so the secret is not implicated and this lane owns the redemption — wrong user, consumed ticket, or a request the Frontend API did not accept.",
  };
}

/** The single line the crawl prints, and the prefix a log reader greps for. */
export function formatCrawlAuthVerdictLine(
  personaKey: string,
  verdict: CrawlAuthVerdict,
): string {
  return `crawl_auth_cause:${personaKey}:${verdict.cause}:owner=${verdict.owner}:mint_instance=${verdict.mintInstance ?? "unreadable"}:redeem_instance=${verdict.redeemInstance ?? "unreadable"} ${verdict.statement}`;
}
