/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { NexusTopNav } from "@/components/navigation/NexusTopNav";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean },
  ) => {
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
  firstName: "Alex",
  lastName: "Operator",
  fullName: "Alex Operator",
  publicMetadata: { role: "admin" },
  primaryEmailAddress: { emailAddress: "operator@example.test" },
  emailAddresses: [{ emailAddress: "operator@example.test" }],
};

describe("NexusTopNav document navigation behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/source/events/demo");
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: signedInUser,
    } as unknown as ReturnType<typeof useUser>);
  });

  it("renders product module destinations as document links", () => {
    render(<NexusTopNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    const destinations = new Map([
      ["Home", "/home"],
      ["Intelligence", "/intelligence"],
      ["Moves", "/strategic-moves"],
      ["Source Optimize", "/source"],
      ["Source New", "/source/new"],
      ["Tower", "/tower"],
    ]);

    for (const [label, href] of destinations) {
      expect(
        within(nav)
          .getAllByRole("link", { name: label })
          .some((link) => link.getAttribute("href") === href),
      ).toBe(true);
    }
  });

  it("marks Source New active without marking Source Optimize active", () => {
    render(<NexusTopNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(nav)
        .getAllByRole("link", { name: "Source New" })
        .every((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
    expect(
      within(nav)
        .getAllByRole("link", { name: "Source Optimize" })
        .every((link) => !link.hasAttribute("aria-current")),
    ).toBe(true);
  });
});
