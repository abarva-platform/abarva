/**
 * @jest-environment jsdom
 */

/**
 * `/home/learn` mounts exactly one product top nav.
 *
 * This replaces `src/__tests__/hygiene/learn-layout-single-nav.test.ts`, which
 * asserted the rule over the BYTES of two files: that `MaestroChrome.tsx`
 * contained the literal `<NexusTopNav />` and the literal `'/home'`, and that
 * `home/learn/layout.tsx` contained neither. It went red when `MaestroChrome`
 * was reformatted from single to double quotes — `"/home"` no longer matched
 * `'/home'` — while the behaviour it was guarding had not changed at all. A
 * sharper pattern would have been the same defect with a longer fuse (T-550),
 * so the byte assertions are deleted rather than repaired.
 *
 * What the rule actually is: `MaestroChrome` owns the single persisted
 * `NexusTopNav` for shell-native routes, and the nested Learn layout renders
 * its side nav WITHOUT a second top nav. Composing the two the way the route
 * tree composes them is the only arrangement that can see a double render, so
 * that is what these cases do.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { MaestroChrome } from "@/components/chrome/MaestroChrome";
import HomeLearnLayout from "@/app/(maestro)/home/learn/layout";

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

// The non-shell branch renders `AbarvaNav`, which reads the active tenant from
// this hook. The shape matters — `currentClient` is a `ClientOption`, not an id.
jest.mock("@/lib/use-client-context", () => ({
  useClientContext: () => ({
    clientId: "skyharbor-air",
    currentClient: {
      id: "skyharbor-air",
      name: "SkyHarbor Air",
      shortName: "SkyHarbor",
      color: "#1B2B5C",
      vertical: "Aviation",
    },
    allowedClients: [],
    canSwitch: false,
    canSwitchInline: false,
    switchClient: () => {},
    isLoaded: true,
    role: "admin",
    isElevated: true,
    isAdmin: true,
  }),
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

/** The composition the App Router builds for `/home/learn/*`. */
function renderLearnRoute(pathname: string) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseUser.mockReturnValue({
    isLoaded: true,
    user: signedInUser,
  } as unknown as ReturnType<typeof useUser>);

  return render(
    <MaestroChrome>
      <HomeLearnLayout>
        <p>Learn route body</p>
      </HomeLearnLayout>
    </MaestroChrome>,
  );
}

describe("/home/learn shell chrome ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["/home/learn", "/home/learn/welcome"])(
    "mounts exactly one product top nav on %s, from the chrome and not the layout",
    (pathname) => {
      renderLearnRoute(pathname);

      expect(screen.getAllByTestId("nexus-top-nav")).toHaveLength(1);
      expect(screen.getAllByTestId("nexus-primary-nav")).toHaveLength(1);
      expect(screen.getByText("Learn route body")).toBeInTheDocument();
    },
  );

  // Named for what it asserts and no more: this case does not look at the top
  // nav, so it survives a chrome regression and must not claim otherwise.
  it("gives the Learn layout its side nav and a named content region", () => {
    renderLearnRoute("/home/learn");

    expect(
      screen.getByRole("navigation", { name: "Learn sections" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Learn content" })).toBeInTheDocument();
  });

  it("does not render a top nav when the Learn layout is mounted on its own", () => {
    // The layout carrying its own NexusTopNav is the double-render this rule
    // exists against, and it is invisible from the composed case above: two
    // navs would fail that one, but so would a chrome regression. This case
    // names the layout as the half that must contribute none.
    mockUsePathname.mockReturnValue("/home/learn");

    render(
      <HomeLearnLayout>
        <p>Learn route body</p>
      </HomeLearnLayout>,
    );

    expect(screen.queryByTestId("nexus-top-nav")).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Learn sections" }),
    ).toBeInTheDocument();
  });

  it("selects that chrome branch from the path, so a non-shell route gets no Nexus nav", () => {
    // Without this the suite passes for a MaestroChrome that mounts the top nav
    // unconditionally, which is a different component from the one the rule
    // describes: the nav is supposed to be the SHELL-NATIVE branch, chosen by
    // pathname. Deleting `/home` from SHELL_SURFACE_PREFIXES has to be visible,
    // and only a path outside the list can show that the list is consulted.
    mockUsePathname.mockReturnValue("/settings/profile");
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: signedInUser,
    } as unknown as ReturnType<typeof useUser>);

    render(
      <MaestroChrome>
        <p>Settings body</p>
      </MaestroChrome>,
    );

    expect(screen.queryByTestId("nexus-top-nav")).not.toBeInTheDocument();
    expect(screen.getByText("Settings body")).toBeInTheDocument();
  });
});
