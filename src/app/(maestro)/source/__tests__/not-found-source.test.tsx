/**
 * @jest-environment jsdom
 */

/**
 * Source's not-found surface is an access guard, not a 404 page.
 *
 * The control it carries is a disclosure control: a link into another
 * account's item must be refused without revealing that the item exists. The
 * previous version of this file asserted the *bytes* of `not-found.tsx` --
 * `expect(source).toContain("This Source item is not available")`. That check
 * passed on the literal prefix while the sentence the reader actually sees is
 * interpolated (`... is not available for {tenantName}.`), so it could not
 * tell a rendered guard from a string sitting in a comment, and it never once
 * proved the tenant reached the surface. These cases render the component.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("server-only", () => ({}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

// The shell is not the subject; it is replaced with a passthrough that keeps
// the props the guard sets on it readable, because "Source is unavailable for
// this account" is part of the guard's contract with the surrounding chrome.
let shellProps: Record<string, unknown> = {};
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children, ...rest }: { children: ReactNode }) => {
    shellProps = rest as Record<string, unknown>;
    return <div data-testid="app-shell">{children}</div>;
  },
}));

import SourceNotFound from "../not-found";

/** The component is an async server component: resolve it, then render. */
async function renderGuard() {
  shellProps = {};
  const element = await SourceNotFound();
  return render(element);
}

describe("Source segment not-found state", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("names the account the link was refused for, in Source's own language", async () => {
    getActiveClientRow.mockResolvedValue({
      key: "meridian",
      name: "Meridian Health",
    });

    await renderGuard();

    expect(screen.getByTestId("source-unavailable-state")).toBeTruthy();
    expect(screen.getByText("Source · access guard")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "This Source item is not available for Meridian Health.",
      }),
    ).toBeTruthy();
    expect(shellProps.surface).toBe("source");
    expect(shellProps.surfaceContext).toEqual({
      sourceUnavailable: true,
      reason: "not_found_or_not_available_for_account",
    });
  });

  it("refuses without disclosing whether another account's item exists", async () => {
    getActiveClientRow.mockResolvedValue({
      key: "meridian",
      name: "Meridian Health",
    });

    await renderGuard();

    const body = screen.getByTestId("source-unavailable-state").textContent ?? "";
    // The guard may say the link *may* point elsewhere; it may never confirm
    // that it does, because confirming it is the disclosure.
    expect(body).toContain(
      "Source does not reveal whether another account's event exists.",
    );
    for (const disclosure of [
      "belongs to",
      "owned by",
      "another account's event exists.  It",
      "exists but",
      "you do not have access to this event",
    ]) {
      expect(body.toLowerCase()).not.toContain(disclosure.toLowerCase());
    }
  });

  it("offers only safe Source exits, and no Moves fallback", async () => {
    getActiveClientRow.mockResolvedValue({ key: "meridian", name: "Meridian Health" });

    await renderGuard();

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Open Source",
      "Go to Home",
      "Switch account",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/source",
      "/home",
      "/sign-in",
    ]);

    // The generic workspace-advisor fallback this surface replaced sent a
    // refused Source reader into Moves. It must not come back.
    expect(screen.queryByRole("link", { name: "Go to Moves" })).toBeNull();
    expect(
      screen.getByTestId("source-unavailable-state").textContent,
    ).not.toContain("Workspace advisor");
  });

  it("still refuses, with the same safe exits, when the client row cannot be read", async () => {
    getActiveClientRow.mockRejectedValue(new Error("tenant read failed"));

    await renderGuard();

    expect(screen.getByTestId("source-unavailable-state")).toBeTruthy();
    expect(screen.getByText("Source · access guard")).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  /*
   * Filed as U-511, pinned here rather than repaired.
   *
   * `not-found.tsx` reads `canonicalClientDisplayName({...}) ?? "your current
   * account"`, so on an unresolvable tenant the refusal is meant to name no
   * account at all. That fallback is unreachable: `canonicalClientDisplayName`
   * ends `getClientOption(args.key)?.name ?? null`, and `getClientOption`
   * resolves an unknown key to the `DEFAULT_CLIENT_KEY` option rather than to
   * `undefined` -- so it returns a real display name for every input. A reader
   * whose tenant read failed is therefore shown the default account's name on
   * an access-guard surface.
   *
   * `it.failing` is deliberate: it passes only while the defect is present and
   * turns red the moment U-511 lands, which is what forces this block to be
   * deleted then. It cannot be satisfied by a comment or a renamed symbol.
   */
  it.failing(
    "U-511: names no account when the tenant cannot be resolved",
    async () => {
      getActiveClientRow.mockRejectedValue(new Error("tenant read failed"));

      await renderGuard();

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "This Source item is not available for your current account.",
        }),
      ).toBeTruthy();
    },
  );
});
