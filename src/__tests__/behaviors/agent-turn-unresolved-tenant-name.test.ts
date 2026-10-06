/**
 * U-512 · the tenant `/api/chat/agent` tells the model it is answering for.
 *
 * Sibling of the rendering cases in
 * `unresolved-client-fallback-guards.test.tsx`; separate because the route
 * module cannot load under jsdom.
 *
 * The resolved name reaches the model as
 * `Active tenant: <name> (locked -- this is the user's client account).` Until
 * U-512 it could not be anything but a registered account name:
 * `canonicalClientDisplayName` resolves an unknown key through
 * `getClientOption`, which answers the DEFAULT_CLIENT_KEY option, so a turn
 * whose server-side tenant resolution had just failed told the model it was
 * locked to an account that was never established.
 *
 * Its behaviour is exercised rather than its source text read: a test that
 * greps a route for a symbol cannot tell a running control from a comment,
 * which is the failure this programme exists to repair. The helper sits in its
 * own module rather than in `route.ts` for a measured reason -- importing the
 * route into a suite under `src/__tests__/behaviors` drags 4,269 statements
 * and 52 functions of it into the behaviour floor's coverage denominator, and
 * that alone took the required gate from 91.41% statements / 63.70% functions
 * to 78.12% / 17.43%. What the route uses is then carried by the type checker,
 * not by an assertion about its text.
 */
import {
  UNRESOLVED_ACTIVE_TENANT_NAME,
  resolveTurnTenantName,
} from "@/app/api/chat/agent/active-tenant-name";

/** A key that reads successfully and resolves to no registered client. */
const UNREGISTERED_KEY = "not-a-registered-tenant";

describe("Agent turn · active tenant name", () => {
  it("says the tenant is unresolved rather than naming the default account", () => {
    // This value reaches the model as
    // `Active tenant: <name> (locked — this is the user's client account).`
    // Naming the default account after a failed server-side resolution tells
    // the model it is locked to an account that was never established.
    expect(
      resolveTurnTenantName({ activeClientKey: null, activeClientName: null }),
    ).toBe(UNRESOLVED_ACTIVE_TENANT_NAME);
    expect(
      resolveTurnTenantName({
        activeClientKey: UNREGISTERED_KEY,
        activeClientName: null,
      }),
    ).toBe(UNRESOLVED_ACTIVE_TENANT_NAME);
  });

  it("resolves a registered key to its canonical name", () => {
    expect(
      resolveTurnTenantName({
        activeClientKey: "meridian",
        activeClientName: null,
      }),
    ).toBe("Meridian Health");
  });

  it("takes no request-supplied tenant name at all", () => {
    // SEC-P1-7 removed body-derived tenancy from this prompt block, but left
    // `?? canonicalClientDisplayName({ name: body.tenantName })` behind it as
    // a resilience fallback. That fallback was unreachable, so it was never
    // exercised -- and repointing the first call without removing it would
    // have woken a request-controlled tenant name up on the exact path where
    // server-side resolution had just failed. The helper has no such input.
    expect(resolveTurnTenantName.length).toBe(1);
    const accepted = resolveTurnTenantName({
      activeClientKey: null,
      activeClientName: null,
      // @ts-expect-error -- pinning that a caller cannot smuggle one in.
      tenantName: "Some Other Account",
    });
    expect(accepted).toBe(UNRESOLVED_ACTIVE_TENANT_NAME);
  });
});

// ---------------------------------------------------------------------------
// Moves · the client name on a program summary
// ---------------------------------------------------------------------------

import { canonicalProgramClientName } from "@/lib/programs/client-name";

/**
 * U-512 · `canonicalProgramClientName` carries the strongest statement of
 * intent of all 40 call sites, in its own comment: "NEVER default to a
 * specific tenant: an unresolved client falls back to its own raw name, then a
 * neutral dash. Previously this hardcoded [an account] as the catch-all
 * default, so any tenant not in a stale closed list rendered as [that account]
 * -- a cross-tenant name leak on every Move card/detail."
 *
 * Asking `canonicalClientDisplayName` reinstated exactly that: it resolves an
 * unrecognised `clientId` through `getClientOption`, which answers the
 * DEFAULT_CLIENT_KEY option. So the leak the comment describes as fixed was
 * back, by a different route, on every Move card whose client did not resolve.
 *
 * The helper was moved out of `transformers.ts` for the same coverage reason as
 * the route helper above: that module is 1,849 statements and 46 functions of
 * data-plane code, none of which this case exercises.
 */
describe("Moves · program summary client name", () => {
  it("never answers an unresolved client with a specific account", () => {
    // What `resolveClientName` passes when the `clients` row is missing.
    expect(
      canonicalProgramClientName({ clientId: UNREGISTERED_KEY, name: "" }),
    ).toBe("—");
  });

  it("answers the dash, not an empty string, for a missing clients row", () => {
    // The dash was unreachable twice over: once through the resolver, and once
    // because `row?.name ?? ""` is not nullish, so `?? "—"` could not fire for
    // it either. Repairing only the resolver left the card rendering "".
    expect(
      canonicalProgramClientName({ clientId: UNREGISTERED_KEY, name: "   " }),
    ).toBe("—");
    expect(canonicalProgramClientName({ clientId: null, name: null })).toBe(
      "—",
    );
  });

  it("prefers the program's own raw name over a dash", () => {
    expect(
      canonicalProgramClientName({
        clientId: UNREGISTERED_KEY,
        name: "Some Unregistered Org",
      }),
    ).toBe("Some Unregistered Org");
  });

  it("still resolves a registered client to its canonical name", () => {
    expect(canonicalProgramClientName({ clientId: "meridian", name: "" })).toBe(
      "Meridian Health",
    );
  });
});
