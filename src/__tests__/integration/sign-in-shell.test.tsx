/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { SignInShell } from "@/components/auth/SignInShell";

jest.mock("@clerk/nextjs", () => ({
  SignIn: (props: {
    forceRedirectUrl?: string;
    fallbackRedirectUrl?: string;
  }) => (
    <div
      data-fallback-redirect-url={props.fallbackRedirectUrl}
      data-force-redirect-url={props.forceRedirectUrl}
      data-testid="clerk-sign-in"
    />
  ),
}));

describe("SignInShell", () => {
  it("uses email-code sign-in by default", () => {
    render(<SignInShell redirectUrl="/auth-redirect" />);

    expect(screen.getByRole("button", { name: /send email code/i })).toBeTruthy();
    expect(screen.getByText("Sign in with a one-time code.")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
    expect(screen.queryByLabelText("Access code")).toBeNull();
    expect(screen.queryByTestId("clerk-sign-in")).toBeNull();
  });

  it("keeps normal Clerk sign-in behind an explicit mode", () => {
    render(<SignInShell redirectUrl="/auth-redirect" signInMode="clerk" />);

    expect(
      screen
        .getByTestId("clerk-sign-in")
        .getAttribute("data-force-redirect-url"),
    ).toBe("/auth-redirect");
  });

  it("keeps legacy demo-code sign-in behind an explicit mode", () => {
    render(<SignInShell redirectUrl="/auth-redirect" signInMode="demo-code" />);

    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByLabelText("Access code")).toBeTruthy();
    expect(screen.queryByTestId("clerk-sign-in")).toBeNull();
  });

  it("uses a no-Clerk fallback for accessibility scans", () => {
    render(
      <SignInShell redirectUrl="/auth-redirect" signInMode="accessibility" />,
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/Clerk sign-in is disabled/i)).toBeTruthy();
    expect(screen.queryByTestId("clerk-sign-in")).toBeNull();
  });
});
