/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import { NexusTopNav } from "@/components/navigation/NexusTopNav";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority, alt, ...imageProps } = props;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ""} {...imageProps} />;
  },
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

jest.mock("@/lib/auth/use-sign-out", () => ({
  useSignOut: () => jest.fn(),
}));

jest.mock("@/components/shell/AdminInboxTopNavBadge", () => ({
  AdminInboxTopNavBadge: () => <span data-testid="admin-inbox-badge" />,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

const signedInUser = {
  firstName: "Anand",
  lastName: "Sundaram",
  fullName: "Anand Sundaram",
  publicMetadata: { role: "admin" },
  primaryEmailAddress: { emailAddress: "anand@abarva.ai" },
  emailAddresses: [{ emailAddress: "anand@abarva.ai" }],
};

function renderNav(pathname: string, props: React.ComponentProps<typeof NexusTopNav> = {}) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseUser.mockReturnValue({
    isLoaded: true,
    user: signedInUser,
  } as unknown as ReturnType<typeof useUser>);

  return render(
    <NexusTopNav
      tenantName="Airline Demo"
      preserveTenantName
      {...props}
    />,
  );
}

describe("NexusTopNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the AbarVa NEXUS lockup and exactly one primary navigation landmark", () => {
    renderNav("/home");

    expect(screen.getByRole("img", { name: "AbarVa NEXUS" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "AbarVa NEXUS Knowledge" }).getAttribute("href")).toBe(
      "/home",
    );
    expect(screen.getAllByRole("navigation", { name: "Primary" })).toHaveLength(1);
    expect(screen.queryByText("Airline Demo")).toBeNull();
    expect(screen.queryByLabelText(/Active client/i)).toBeNull();
  });

  it("shows the canonical six product nav labels", () => {
    renderNav("/home");
    const nav = screen.getByRole("navigation", { name: "Primary" });

    for (const label of ["Knowledge", "Intelligence", "Moves", "Source", "Tower", "Learn"]) {
      expect(within(nav).getAllByRole("link", { name: label }).length).toBeGreaterThanOrEqual(1);
    }
    expect(within(nav).queryByRole("link", { name: "Home" })).toBeNull();
  });

  it("keeps the Knowledge destination stable from Tower", () => {
    renderNav("/tower");
    const nav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(nav).getAllByRole("link", { name: "Knowledge" })[0]?.getAttribute("href")).toBe(
      "/home",
    );
  });

  it.each([
    ["/home", "Knowledge"],
    ["/home/context", "Knowledge"],
    ["/intelligence", "Intelligence"],
    ["/strategic-moves/123", "Moves"],
    ["/source/events/alpha", "Source"],
    ["/tower/portfolio", "Tower"],
    ["/home/learn/source", "Learn"],
  ])("marks %s as %s", (pathname, label) => {
    renderNav(pathname);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const activeLinks = within(nav).getAllByRole("link", { name: label });

    expect(activeLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("hides product navigation when requested without changing the brand lockup", () => {
    renderNav("/home", { showProductNav: false });

    expect(screen.getByRole("img", { name: "AbarVa NEXUS" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
  });
});
