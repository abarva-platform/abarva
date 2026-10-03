/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

/**
 * Item T-786, claimable half. This suite used to read the BYTES of
 * `AbarvaNav.tsx` and look for the literal `<Link href={href} prefetch`, so a
 * reformat turned it red and a plain `<a>` spelled any other way turned it
 * green. It now renders the nav and asks the rendered DOM the question the
 * byte scan stood in for: is every product nav item a client-side route
 * (`next/link`), or a document-reload anchor?
 *
 * `next/link` is replaced by an anchor that carries a marker attribute. An
 * anchor without the marker was rendered by something other than `next/link`,
 * which is exactly the regression this guards.
 */

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: string;
    prefetch?: boolean;
    children: ReactNode;
  }) =>
    createElement(
      "a",
      {
        href,
        "data-next-link": "true",
        "data-prefetch": prefetch === undefined ? "default" : String(prefetch),
        ...rest,
      },
      children,
    ),
}));

type MockUser = {
  fullName: string;
  firstName: string;
  primaryEmailAddress: { emailAddress: string };
  emailAddresses: { emailAddress: string }[];
  publicMetadata: Record<string, unknown>;
};

let mockUser: MockUser | null = null;
let mockPathname = "/home";

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: mockUser }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("@/lib/auth/use-sign-out", () => ({
  useSignOut: () => jest.fn(),
}));

jest.mock("@/lib/use-client-context", () => ({
  useClientContext: () => ({
    currentClient: { name: "Fixture Tenant", color: "#123456" },
  }),
}));

// Imported after the mocks so the component binds to them.
import AbarvaNav from "../AbarvaNav";

function userWithRole(role: string): MockUser {
  return {
    fullName: "Nav Fixture",
    firstName: "Nav",
    primaryEmailAddress: { emailAddress: "nav.fixture@example.test" },
    emailAddresses: [{ emailAddress: "nav.fixture@example.test" }],
    publicMetadata: { role },
  };
}

const PRODUCT_NAV = [
  ["Knowledge", "/home"],
  ["Intelligence", "/intelligence"],
  ["Moves", "/strategic-moves"],
  ["Source", "/source"],
  ["Tower", "/tower"],
] as const;

function navBar(): HTMLElement {
  const bar = document.getElementById("abarva-nav");
  if (!bar) throw new Error("AbarvaNav did not render #abarva-nav");
  return bar;
}

function anchorsIn(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a"));
}

beforeEach(() => {
  mockUser = null;
  mockPathname = "/home";
});

describe("AbarvaNav client routing", () => {
  it.each(["admin", "client"])(
    "renders every product nav item for a signed-in %s as a prefetched next/link route",
    (role) => {
      mockUser = userWithRole(role);
      render(createElement(AbarvaNav));
      const bar = navBar();

      const rendered = PRODUCT_NAV.map(([label]) => {
        const link = within(bar).getByRole("link", { name: label });
        return {
          label,
          href: link.getAttribute("href"),
          nextLink: link.getAttribute("data-next-link"),
          prefetch: link.getAttribute("data-prefetch"),
        };
      });
      expect(rendered).toEqual(
        PRODUCT_NAV.map(([label, href]) => ({
          label,
          href,
          nextLink: "true",
          prefetch: "true",
        })),
      );
    },
  );

  it.each([
    ["signed-in admin", () => userWithRole("admin")],
    ["signed-in client", () => userWithRole("client")],
    ["signed out", () => null],
  ])("renders no document-reload anchor anywhere in the bar (%s)", (_label, makeUser) => {
    mockUser = makeUser();
    render(createElement(AbarvaNav));
    const reloads = anchorsIn(navBar())
      .filter((anchor) => anchor.getAttribute("data-next-link") !== "true")
      .map((anchor) => anchor.textContent?.trim() || anchor.getAttribute("href"));
    expect(anchorsIn(navBar()).length).toBeGreaterThan(0);
    expect(reloads).toEqual([]);
  });

  it("marks the item for the current path active, and only that one", () => {
    mockUser = userWithRole("admin");
    mockPathname = "/source/events/123";
    render(createElement(AbarvaNav));
    const active = anchorsIn(navBar())
      .filter((anchor) => anchor.classList.contains("abarva-nav-link--active"))
      .map((anchor) => anchor.textContent?.trim());
    expect(active).toEqual(["Source"]);
  });

  it("omits the product items when compact, leaving them to the chrome's own nav", () => {
    mockUser = userWithRole("admin");
    render(createElement(AbarvaNav, { compact: true }));
    const labels = PRODUCT_NAV.map(([label]) => label).filter((label) =>
      within(navBar()).queryByRole("link", { name: label }),
    );
    expect(labels).toEqual([]);
  });

  it("routes the signed-out marketing item through next/link too", () => {
    render(createElement(AbarvaNav));
    const investor = screen.getByRole("link", { name: "Investor" });
    expect({
      href: investor.getAttribute("href"),
      nextLink: investor.getAttribute("data-next-link"),
    }).toEqual({ href: "/investor", nextLink: "true" });
  });
});
