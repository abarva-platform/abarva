/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
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

  it("keeps legacy demo-code sign-in behind an explicit mode AND behind a click", () => {
    // This case used to render `signInMode="demo-code"` and assert the Password
    // and Access code fields immediately. It was right when it was written
    // (#3229, 2026-06-06) and went stale a month later: `DemoCodeSignIn` gained
    // its own Email code / Demo invite toggle whose internal state defaults to
    // 'email', so the invite fields now appear one click in.
    //
    // The control the case is about — the legacy invite flow sits behind an
    // explicit mode — still holds, and now holds harder: there are two gates in
    // front of a password field, not one. So both are asserted, in order,
    // rather than the assertion being dropped.
    render(<SignInShell redirectUrl="/auth-redirect" signInMode="demo-code" />);

    // Gate two: even inside the explicit demo-code mode, first paint is the
    // one-time-code flow and no password field is reachable.
    expect(screen.queryByLabelText("Password")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /demo invite/i }));

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
