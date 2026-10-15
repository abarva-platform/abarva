/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoLibrary } from "@/components/marketing/DemoLibrary";
import { LoggedOutLandingPage } from "@/components/marketing/LoggedOutLandingPage";
import { DEMO_VIDEOS } from "../catalog";
import MobileGuard from "@/components/MobileGuard";
jest.mock("next/navigation", () => ({ usePathname: () => "/demo" }));
jest.mock("@clerk/nextjs", () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/components/auth/EmailCodeSignIn", () => ({
  EmailCodeSignIn: ({
    purpose,
    redirectUrl,
  }: {
    purpose: string;
    redirectUrl: string;
  }) => (
    <div data-testid="demo-sign-in">
      {purpose}:{redirectUrl}
    </div>
  ),
}));
jest.mock("@/components/marketing/RequestAccessController", () => ({
  RequestAccessController: () => null,
}));
const videos = DEMO_VIDEOS.map(
  ({ id, title, duration, description, chapters }) => ({
    id,
    title,
    duration,
    description,
    chapters,
    ready: true,
    captionsReady: true,
  }),
);

describe("demo library presentation", () => {
  it("offers scoped sign-in without any playable source or admin control to anonymous visitors", () => {
    const { container } = render(
      <DemoLibrary state="anonymous" admin={false} videos={[]} />,
    );
    expect(screen.getByTestId("demo-sign-in").textContent).toBe("demo:/demo");
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByText("Viewer access")).toBeNull();
  });
  it("does not render either the player or sign-in as approval for a denied account", () => {
    const { container } = render(
      <DemoLibrary state="unapproved" admin={false} videos={[]} />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByTestId("demo-sign-in")).toBeNull();
    expect(
      screen.getByText("This account is not approved for the demo."),
    ).toBeTruthy();
  });
  it("shows honest unpublished states rather than broken video controls", () => {
    const { container } = render(
      <DemoLibrary
        state="approved"
        admin={false}
        videos={videos.map((video) => ({ ...video, ready: false }))}
      />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText("The final video is being prepared.")).toBeTruthy();
    expect(
      (screen.getByLabelText("Jump to chapter") as HTMLSelectElement).disabled,
    ).toBe(true);
  });
  it("uses same-origin protected media and captions, supports version switching and chapter seeking", () => {
    const { container } = render(
      <DemoLibrary state="approved" admin={false} videos={videos} />,
    );
    expect(container.querySelector("source")?.getAttribute("src")).toBe(
      "/api/demo-video/executive",
    );
    expect(container.querySelector("track")?.getAttribute("src")).toBe(
      "/api/demo-video/executive?asset=captions",
    );
    fireEvent.click(
      screen.getByRole("tab", { name: /Full product walkthrough/ }),
    );
    expect(container.querySelector("source")?.getAttribute("src")).toBe(
      "/api/demo-video/full",
    );
    fireEvent.change(screen.getByLabelText("Jump to chapter"), {
      target: { value: "392.4" },
    });
    expect(container.querySelector("video")?.currentTime).toBe(392.4);
    expect(container.querySelector("video")?.autoplay).toBe(false);
  });
  it("supports keyboard tabs and limits access management to administrators", () => {
    render(<DemoLibrary state="approved" admin={true} videos={videos} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: /Executive overview/ }), {
      key: "ArrowRight",
    });
    expect(
      screen
        .getByRole("tab", { name: /Full product walkthrough/ })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("Viewer access")).toBeTruthy();
  });
  it("makes the demo reachable from the real landing page without invented readiness numbers", () => {
    const { container } = render(<LoggedOutLandingPage />);
    expect(container.querySelectorAll(".abarva-landing > section").length).toBe(
      5,
    );
    expect(
      [...container.querySelectorAll(".surf b")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Home", "Intelligence", "Moves", "Source", "Tower"]);
    expect(
      screen
        .getByRole("link", { name: "Watch the Nexus demo" })
        .getAttribute("href"),
    ).toBe("/demo");
    expect(
      screen.getByRole("link", { name: "Watch the demo" }).getAttribute("href"),
    ).toBe("/demo");
    expect(screen.queryByText("72% · reshape")).toBeNull();
    expect(screen.getAllByAltText("Abarva Nexus").length).toBe(2);
  });

  it("keeps the video library accessible on an actual phone user agent", () => {
    const original = Object.getOwnPropertyDescriptor(
      window.navigator,
      "userAgent",
    );
    const width = window.innerWidth;
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "iPhone",
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    render(
      <MobileGuard>
        <p>Demo content</p>
      </MobileGuard>,
    );
    expect(screen.getByText("Demo content")).toBeTruthy();
    expect(screen.queryByText("AbarVa is built for desktop")).toBeNull();
    if (original)
      Object.defineProperty(window.navigator, "userAgent", original);
    else Reflect.deleteProperty(window.navigator, "userAgent");
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
  });
});
