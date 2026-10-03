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

export function classifyCrawlAuthFailure(
  observation: CrawlAuthObservation,
): CrawlAuthVerdict {
  const mintInstance = clerkTicketIssuerHost(observation.mint.ticket);
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

  if (mintInstance !== redeemInstance) {
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
