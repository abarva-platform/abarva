/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { NexusTopNav } from "@/components/navigation/NexusTopNav";
import { useSignOut } from "@/lib/auth/use-sign-out";

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
  useSignOut: jest.fn(),
}));

jest.mock("@/components/shell/AdminInboxTopNavBadge", () => ({
  AdminInboxTopNavBadge: () => <span data-testid="admin-inbox-badge" />,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseSignOut = useSignOut as jest.MockedFunction<typeof useSignOut>;
const signOut = jest.fn();

describe("NexusTopNav auth affordances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/home");
    mockUseSignOut.mockReturnValue(signOut);
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        firstName: "",
        lastName: "",
        fullName: "Alex Operator · Hidden tenant label",
        publicMetadata: { role: "admin" },
        primaryEmailAddress: { emailAddress: "operator@example.test" },
        emailAddresses: [{ emailAddress: "operator@example.test" }],
      },
    } as unknown as ReturnType<typeof useUser>);
  });

  it("renders a visible sign-out action for signed-in users", () => {
    render(<NexusTopNav />);

    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("makes the wordmark an explicit Home link", () => {
    render(<NexusTopNav />);

    expect(
      screen
        .getByRole("link", { name: "AbarVa NEXUS Home" })
        .getAttribute("href"),
    ).toBe("/home");
  });

  it("does not render tenant labels from Clerk fullName", () => {
    render(<NexusTopNav />);

    expect(screen.getByLabelText("Signed in as Alex Operator")).toBeTruthy();
    expect(screen.queryByText("Hidden tenant label")).toBeNull();
  });
});
