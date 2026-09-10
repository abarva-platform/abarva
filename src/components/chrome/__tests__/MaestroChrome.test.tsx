/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { MaestroChrome } from "@/components/chrome/MaestroChrome";

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
  firstName: "Anand",
  lastName: "Sundaram",
  fullName: "Anand Sundaram",
  publicMetadata: { role: "admin" },
  primaryEmailAddress: { emailAddress: "anand@abarva.ai" },
  emailAddresses: [{ emailAddress: "anand@abarva.ai" }],
};

function renderChrome(pathname: string) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseUser.mockReturnValue({
    isLoaded: true,
    user: signedInUser,
  } as unknown as ReturnType<typeof useUser>);

  return render(
    <MaestroChrome>
      <main>Route body</main>
    </MaestroChrome>,
  );
}

describe("MaestroChrome canonical shell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    "/home/knowledge",
    "/intelligence",
    "/strategic-moves",
    "/source",
    "/source/events",
    "/source/workspace",
    "/source/preview/workspace",
    "/tower",
    "/tenant/example-tenant/tower",
  ])("mounts exactly one Nexus toolbar for %s", (pathname) => {
    renderChrome(pathname);

    expect(screen.getAllByTestId("nexus-top-nav")).toHaveLength(1);
    expect(screen.getAllByTestId("nexus-primary-nav")).toHaveLength(1);
    expect(
      screen.getByRole("img", { name: "AbarVa NEXUS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Route body")).toBeInTheDocument();
  });

  it("marks Tower active on tenant-scoped Tower routes", () => {
    renderChrome("/tenant/example-tenant/tower");
    const primaryNav = screen.getByTestId("nexus-primary-nav");

    expect(
      within(primaryNav).getAllByRole("link", { name: "Tower" })[0],
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(primaryNav).getAllByRole("link", { name: "Home" })[0],
    ).not.toHaveAttribute("aria-current");
  });
});
