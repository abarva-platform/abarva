/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { NexusTopNav } from "@/components/navigation/NexusTopNav";
import { AppShell } from "@/components/shell/AppShell";

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

jest.mock("@/components/shell/AppRail", () => ({
  AppRail: () => <nav aria-label="Legacy app rail" />,
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  AtlasPageStateProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="atlas-page-state-provider">{children}</div>
  ),
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

function signedInAt(pathname: string) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseUser.mockReturnValue({
    isLoaded: true,
    user: signedInUser,
  } as unknown as ReturnType<typeof useUser>);
}

describe("cockpit shell navigation behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signedInAt("/home");
  });

  it("renders product navigation from the persisted NexusTopNav", () => {
    render(<NexusTopNav tenantName="Hidden Client" preserveTenantName />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(screen.getByTestId("nexus-top-nav")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Client")).toBeNull();

    for (const label of [
      "Home",
      "Intelligence",
      "Moves",
      "Source Optimize",
      "Source New",
      "Tower",
    ]) {
      expect(
        within(nav).getAllByRole("link", { name: label }).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps the legacy AppRail retired unless a shell opts in", () => {
    const { rerender } = render(
      <AppShell surface="home">
        <main>Home workspace</main>
      </AppShell>,
    );

    expect(screen.getByText("Home workspace")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Legacy app rail" }),
    ).toBeNull();

    rerender(
      <AppShell surface="home" showAppRail>
        <main>Home workspace</main>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Legacy app rail" }),
    ).toBeInTheDocument();
  });
});
