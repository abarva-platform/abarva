import {
  UNREVIEWED_PURPOSE_TOKENS,
  usableScopeSummary,
} from "@/lib/source/contract-purpose-refusal";

/**
 * Every alternative in the contract-purpose refusal control must be able to
 * refuse. T-591.
 *
 * `usableScopeSummary` refuses a stored purpose that is really column values
 * by testing it against a list of unreviewed-value tokens. It ran that list
 * against `withoutIdentifierTokens(...)` output, and that helper replaces
 * every `\b[a-z0-9]+(?:_[a-z0-9]+)+\b` run with a space. So the one
 * snake_case alternative in the list, `for_cause_only`, was deleted from the
 * string before the list was ever consulted: the alternative could not match
 * any input, and an alternative that cannot match is a gate that cannot fail.
 *
 * The two mechanisms have opposite outcomes on the same input, which is why
 * this was not cosmetic. The list REFUSES the whole value; identifier
 * stripping KEEPS what survives. A stored `purpose_summary` reading
 * "Managed services scope for the analytics estate for_cause_only" therefore
 * rendered as "Managed services scope for the analytics estate" — a reviewed
 * purpose characterisation with a governing termination clause silently
 * removed from it, which is exactly what the list was written to refuse.
 *
 * This suite enumerates the control's own exported alternatives rather than
 * restating them, so an alternative added later that the stripper would
 * swallow fails here instead of quietly becoming dead. It lives under
 * `src/__tests__/behaviors` deliberately: `Behavior coverage floor` runs that
 * directory whole and is a required context on `main`, whereas the suite that
 * discovered this defect is named by no workflow at all.
 *
 * It imports the control from `@/lib/source/contract-purpose-refusal` and not
 * from the surface that renders its result. That floor measures line and
 * function coverage over everything a suite loads, so importing the
 * 8,466-line workspace shell and its tree put ~14.5k mostly-unexercised lines
 * into the denominator and took the gate from passing to 82.4% — measured, on
 * this branch, before the control was moved. The ordering this suite pins now
 * lives entirely in that module, so nothing is lost by not reaching through
 * the surface.
 */
describe("contract purpose refusal control — every alternative is reachable", () => {
  // Prose a reader would accept as a reviewed purpose, carrying no separator
  // shape, so the separator short-circuit above the list cannot mask the list.
  const usablePurpose = "Managed services scope for the analytics estate";

  it("exports the alternatives it refuses on, so this suite cannot drift", () => {
    expect(UNREVIEWED_PURPOSE_TOKENS.length).toBeGreaterThan(0);
    expect(UNREVIEWED_PURPOSE_TOKENS).toContain("for_cause_only");
  });

  it.each(UNREVIEWED_PURPOSE_TOKENS)(
    "refuses a purpose carrying the standalone token %s",
    (token) => {
      // Refusal is total: the caller reads null and falls through to
      // "Purpose review needed". The prose around the token is not a reviewed
      // purpose once a governing value has been removed from it, so a
      // stripped-but-non-null answer would be the defect, not a partial fix.
      expect(usableScopeSummary(`${usablePurpose} ${token}.`)).toBeNull();
    },
  );
});
